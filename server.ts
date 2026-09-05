import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import JSZip from "jszip";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

function formatGeminiError(err: any): string {
  if (!err) return "AI 模型服务繁忙或请求超时，请重试";
  let rawMsg = err.message || (typeof err === "string" ? err : JSON.stringify(err));

  // Unwrap nested JSON error strings if present
  try {
    let parsed = JSON.parse(rawMsg);
    for (let depth = 0; depth < 5; depth++) {
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.error === "string") {
          try { parsed = JSON.parse(parsed.error); continue; } catch { rawMsg = parsed.error; break; }
        }
        if (parsed.error?.message) {
          rawMsg = parsed.error.message;
          try { parsed = JSON.parse(rawMsg); continue; } catch { break; }
        }
        if (parsed.message) {
          rawMsg = parsed.message;
          try { parsed = JSON.parse(rawMsg); continue; } catch { break; }
        }
      }
      break;
    }
  } catch {}

  if (rawMsg.includes("RESOURCE_EXHAUSTED") || rawMsg.includes("quota") || err.status === 429 || err.code === 429) {
    return "当前模型调用频次暂时达到上限（429 Rate Limit）。系统已切换备选链路，请稍候 15~30 秒后再次点击运行。";
  }
  if (rawMsg.includes("UNAVAILABLE") || rawMsg.includes("503") || rawMsg.includes("high demand") || rawMsg.includes("Overloaded")) {
    return "AI 模型服务暂时高负载繁忙（503 Service Unavailable），请稍候点击重试。";
  }
  return rawMsg;
}

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Helper: Parse GitHub URL into components
function parseGitHubUrl(rawUrl: string): { owner: string; repo: string; branch?: string; path?: string } | null {
  try {
    const trimmed = rawUrl.trim();
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (!u.hostname.includes("github.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    let branch = "main";
    let path = "";
    if (parts[2] === "tree" || parts[2] === "blob") {
      branch = parts[3] || "main";
      path = parts.slice(4).join("/");
    }
    return { owner, repo, branch, path };
  } catch {
    return null;
  }
}

// 1. Fetch skill from URL (solves CORS issues, auto handles GitHub repositories & directory tree)
app.post("/api/skill/fetch-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "请提供有效的 Skill URL 地址" });
      return;
    }

    let targetUrl = url.trim();

    // Check if it is a GitHub repository
    const ghInfo = parseGitHubUrl(targetUrl);
    if (ghInfo) {
      const { owner, repo, path: subPath } = ghInfo;
      let branch = ghInfo.branch || "main";

      // 1. Try to fetch repository git trees recursively
      let treeData: any = null;
      let treeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        {
          headers: {
            "User-Agent": "SkillUI-App/1.0",
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      // If branch 'main' 404, try 'master'
      if (!treeRes.ok && branch === "main") {
        branch = "master";
        treeRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
          {
            headers: {
              "User-Agent": "SkillUI-App/1.0",
              Accept: "application/vnd.github.v3+json",
            },
          }
        );
      }

      if (treeRes.ok) {
        treeData = await treeRes.json();
      }

      // Fetch repo metadata (stars, description)
      let repoMeta: any = null;
      try {
        const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: { "User-Agent": "SkillUI-App/1.0" },
        });
        if (metaRes.ok) {
          repoMeta = await metaRes.json();
        }
      } catch (e) {
        // ignore
      }

      const rawTreeItems = (treeData?.tree || []) as Array<{ path: string; type: string; size?: number }>;

      // Build structured files array
      const files = rawTreeItems.map((item) => ({
        path: item.path,
        name: item.path.split("/").pop() || item.path,
        type: item.type === "tree" ? ("dir" as const) : ("file" as const),
        size: item.size,
      }));

      // Find key files in the repository
      // Priority: 1. Specific subPath if specified, 2. SKILL.md, 3. */SKILL.md, 4. agents/openai.yaml, 5. README.md
      let primarySkillPath = "";
      if (subPath && rawTreeItems.some((f) => f.path === subPath)) {
        primarySkillPath = subPath;
      } else {
        const exactSkill = rawTreeItems.find((f) => f.path === "SKILL.md");
        const nestedSkill = rawTreeItems.find((f) => f.path.endsWith("/SKILL.md"));
        const openaiYaml = rawTreeItems.find((f) => f.path.endsWith("openai.yaml"));
        const readme = rawTreeItems.find((f) => f.path === "README.md");

        if (nestedSkill) {
          primarySkillPath = nestedSkill.path;
        } else if (exactSkill) {
          primarySkillPath = exactSkill.path;
        } else if (openaiYaml) {
          primarySkillPath = openaiYaml.path;
        } else if (readme) {
          primarySkillPath = readme.path;
        } else {
          // Find first markdown or text file
          const firstMd = rawTreeItems.find((f) => f.path.endsWith(".md") || f.path.endsWith(".txt"));
          primarySkillPath = firstMd?.path || rawTreeItems[0]?.path || "";
        }
      }

      // Fetch the primary skill content directly from raw.githubusercontent.com
      let primaryContent = "";
      if (primarySkillPath) {
        const rawContentRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${primarySkillPath}`,
          { headers: { "User-Agent": "SkillUI-App/1.0" } }
        );
        if (rawContentRes.ok) {
          primaryContent = await rawContentRes.text();
        }
      }

      // Also check if openai.yaml exists to get extra metadata
      const openaiYamlItem = rawTreeItems.find((f) => f.path.endsWith("openai.yaml"));
      let openaiYamlContent = "";
      if (openaiYamlItem && openaiYamlItem.path !== primarySkillPath) {
        try {
          const yRes = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${openaiYamlItem.path}`,
            { headers: { "User-Agent": "SkillUI-App/1.0" } }
          );
          if (yRes.ok) openaiYamlContent = await yRes.text();
        } catch (e) {
          // ignore
        }
      }

      // Check if README.md exists if primary is not README
      let readmeSnippet = "";
      const readmeItem = rawTreeItems.find((f) => f.path === "README.md");
      if (readmeItem && readmeItem.path !== primarySkillPath) {
        try {
          const rRes = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`,
            { headers: { "User-Agent": "SkillUI-App/1.0" } }
          );
          if (rRes.ok) {
            const fullReadme = await rRes.text();
            readmeSnippet = fullReadme.slice(0, 3000);
          }
        } catch (e) {
          // ignore
        }
      }

      // If we got files and primary content, return repository bundle
      if (primaryContent || files.length > 0) {
        res.json({
          success: true,
          isRepository: true,
          repositoryInfo: {
            owner,
            repo,
            branch,
            url: `https://github.com/${owner}/${repo}`,
            totalFiles: files.length,
            stars: repoMeta?.stargazers_count || 0,
            description: repoMeta?.description || "",
          },
          primaryFile: primarySkillPath,
          content: primaryContent,
          openaiYamlContent,
          readmeSnippet,
          files,
        });
        return;
      }
    }

    // Fallback: regular URL fetch
    if (targetUrl.includes("github.com") && targetUrl.includes("/blob/")) {
      targetUrl = targetUrl.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "SkillUI-App/1.0",
        Accept: "text/plain, text/markdown, application/json, text/yaml, */*",
      },
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `获取 URL 失败: HTTP ${response.status} ${response.statusText}`,
      });
      return;
    }

    const content = await response.text();

    // Check if the content is raw HTML from a web page
    if (content.trim().startsWith("<!DOCTYPE html>") || content.trim().startsWith("<html")) {
      res.status(400).json({
        error: "此链接返回的是 HTML 网页源码，而非 Skill 规则文件。如果您输入的是 GitHub 仓库页面，请确认仓库地址格式为 https://github.com/owner/repo",
      });
      return;
    }

    res.json({
      success: true,
      content,
      url: targetUrl,
      size: content.length,
      files: [],
    });
  } catch (err: any) {
    console.error("Fetch URL error:", err);
    res.status(500).json({ error: err.message || "拉取链接内容失败，请检查网络或 URL 是否有效" });
  }
});

// Fetch single file content from GitHub repository or url
app.post("/api/skill/fetch-file-content", async (req, res) => {
  try {
    const { owner, repo, branch = "main", path: filePath } = req.body;
    if (!owner || !repo || !filePath) {
      res.status(400).json({ error: "缺少必要的文件路径参数" });
      return;
    }

    const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    const response = await fetch(fileUrl, {
      headers: { "User-Agent": "SkillUI-App/1.0" },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `读取文件失败: HTTP ${response.status}` });
      return;
    }

    const content = await response.text();
    res.json({ success: true, path: filePath, content });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "读取文件失败" });
  }
});

// Heuristic fallback parser in case of upstream AI network spikes
function heuristicParseSkill(content: string, sourceName?: string, files: any[] = [], openaiYamlContent?: string) {
  const contentLower = content.toLowerCase();
  const filePaths = files.map((f) => f.path.toLowerCase()).join(" ");
  const srcNameLower = (sourceName || "").toLowerCase();

  // Extract from YAML frontmatter or openai.yaml if present
  let extractedTitle = "";
  let extractedDesc = "";

  if (openaiYamlContent) {
    const yamlDisplayMatch = openaiYamlContent.match(/display_name:\s*([^\n\r]+)/i);
    if (yamlDisplayMatch && yamlDisplayMatch[1]) {
      extractedTitle = yamlDisplayMatch[1].replace(/["']/g, "").trim();
    }
    const yamlDescMatch = openaiYamlContent.match(/short_description:\s*([^\n\r]+)/i);
    if (yamlDescMatch && yamlDescMatch[1]) {
      extractedDesc = yamlDescMatch[1].replace(/["']/g, "").trim();
    }
  }

  if (!extractedTitle) {
    const nameMatch = content.match(/name:\s*([^\n\r]+)/i);
    if (nameMatch && nameMatch[1]) {
      extractedTitle = nameMatch[1].replace(/["']/g, "").trim();
    } else {
      const titleMatch = content.match(/^#+\s*(?:Role:\s*)?([^\n\r]+)/m);
      if (titleMatch && titleMatch[1]) {
        extractedTitle = titleMatch[1].replace(/["']/g, "").trim();
      } else if (sourceName) {
        extractedTitle = sourceName.replace(/\.[^.]+$/, "");
      }
    }
  }

  if (!extractedDesc) {
    const descMatch = content.match(/description:\s*([^\n\r]+)/i);
    if (descMatch && descMatch[1]) {
      extractedDesc = descMatch[1].replace(/["']/g, "").trim();
    }
  }

  // 0. Check if this is a Presentation Deck / Web PPT Skill (e.g. guizang-ppt-skill, presentation-deck)
  const isDeckSkill =
    contentLower.includes("ppt-skill") ||
    contentLower.includes("guizang-ppt") ||
    contentLower.includes("web-deck") ||
    contentLower.includes("presentation") ||
    contentLower.includes("web ppt") ||
    contentLower.includes("幻灯片") ||
    contentLower.includes("演示文稿") ||
    filePaths.includes("ppt-skill") ||
    filePaths.includes("web-deck") ||
    srcNameLower.includes("ppt") ||
    srcNameLower.includes("deck");

  if (isDeckSkill) {
    return {
      title: extractedTitle || "Guizang · Web-native PPT 演示文稿工坊 (Web Deck Skill)",
      description:
        extractedDesc ||
        "将文档、大纲或素材提炼为高密度事实、瑞士国际风格与杂志风的 Web 原生单文件幻灯片，自带演讲者模式。",
      icon: "Sliders",
      category: "design",
      tags: ["Web幻灯片", "瑞士风格", "演讲者模式", "单文件HTML", "高事实密度"],
      systemInstruction: content,
      detectedEndpoints: [],
      hasExternalEndpoints: false,
      uiSchema: {
        title: "Web-native 演示文稿 (PPT Deck) 工作台",
        subtitle: "输入主题大纲或上传研报附件，生成瑞士国际主义与高事实密度的 Web 原生演示文稿",
        fields: [
          {
            id: "topic_or_outline",
            name: "演讲大纲与参考研报",
            label: "上传演讲大纲 / 研报文档 / 原始材料附件 或 粘贴提纲",
            type: "file",
            accept: ".md,.txt,.pdf,.docx,.json,image/*",
            multiple: true,
            uploadPreset: "document",
            placeholder: "在此输入演讲主题、核心论点、汇报大纲，或直接上传研报/文档附件...",
            defaultValue: `AI Agent 时代的产品范式重构：从单体 SaaS 到意图自适应交互\n\n核心论点：\n1. 传统 SaaS 的层级菜单黄昏：78% 的功能常年闲置，用户被困在复杂表单与跨工具跳转中。\n2. 瑞士国际主义排版与高密度事实设计：严谨网格、留白呼吸、单色重锚、证据为骨。\n3. Web 原生单文件演示文稿交付：无需庞大客户端，浏览器双击即讲，内置双屏演讲者模式与完整讲稿提纲。\n4. 自适应流式生成：从文档与素材附件一键萃取演讲主干，全流程生产级交付。`,
            required: true,
            description: "支持上传 Word、PDF、Markdown 研报或大纲文件，AI 将全自动提取事实依据并生成 Web 幻灯片",
          },
          {
            id: "deck_style",
            name: "幻灯片视觉风格",
            label: "视觉风格体系 (Presentation Style)",
            type: "select",
            defaultValue: "style_b_swiss",
            required: true,
            options: [
              { label: "风格 B：瑞士国际主义高密度事实 (Swiss Facts & Grid)", value: "style_b_swiss" },
              { label: "风格 A：现代杂志叙事风 (Editorial Magazine)", value: "style_a_editorial" },
              { label: "风格 C：暗黑极客先锋 (Cyber Dark Minimal)", value: "style_c_dark" },
            ],
            description: "瑞士风格强调不对称网格与单色重锚；杂志风格强调优雅衬线与叙事呼吸",
          },
          {
            id: "theme_color",
            name: "主题主色调",
            label: "品牌/主色系 (Primary Accent)",
            type: "select",
            defaultValue: "ikb_blue",
            required: true,
            options: [
              { label: "克莱因蓝 (IKB Blue #002FA7) - 理性科技与权威", value: "ikb_blue" },
              { label: "国际安全橙 (Safety Orange #FF5500) - 醒目聚焦与活力", value: "safety_orange" },
              { label: "玄铁墨黑 (Ink Black #18181B) - 高端商务与极简", value: "ink_black" },
              { label: "青花瓷蓝 (Porcelain Blue #1D4ED8) - 结构严谨与数据分析", value: "porcelain_blue" },
              { label: "冷翠深绿 (Emerald Forest #065F46) - 商业洞察与生态", value: "emerald_forest" },
            ],
          },
          {
            id: "duration_pages",
            name: "规划幻灯片页数",
            label: "演讲时长与预期页数",
            type: "select",
            defaultValue: "16",
            required: true,
            options: [
              { label: "8 页精简快讲 (5-10 分钟 Flash Pitch)", value: "8" },
              { label: "16 页标准深度演讲 (15-25 分钟 Standard Deck)", value: "16" },
              { label: "24 页完整方案与研报交付 (30-45 分钟 Comprehensive)", value: "24" },
            ],
          },
          {
            id: "audience_scenario",
            name: "汇报场景与受众",
            label: "受众与演讲场景",
            type: "select",
            defaultValue: "conference",
            options: [
              { label: "行业峰会 / Keynote 主题演讲", value: "conference" },
              { label: "投资人路演 / Pitch Deck", value: "investor" },
              { label: "企业内部战略汇报 / OKR 复盘", value: "internal_strategy" },
              { label: "产品发布会 / Demo Day", value: "product_launch" },
              { label: "技术分享 / 架构深潜 (Tech Deep Dive)", value: "tech_share" },
            ],
          },
          {
            id: "include_speaker_notes",
            name: "包含演讲者备忘录与逐字稿",
            label: "生成演讲者模式备忘录 (Speaker Notes)",
            type: "switch",
            defaultValue: true,
            description: "为每页生成 30-60 秒的口播要点、递进逻辑与关键包袱提纲",
          },
          {
            id: "source_documents",
            name: "参考研报或大纲文档",
            label: "上传参考研报 / 提纲文件 (可选)",
            type: "file",
            accept: ".txt,.md,.pdf,.json",
            multiple: true,
            placeholder: "点击或拖拽上传研报、大纲文档或文字资料...",
            required: false,
            description: "系统将自动提取文档内容并融合进幻灯片知识库",
          },
          {
            id: "media_assets",
            name: "图表与真实配图素材",
            label: "上传真实产品截图 / 图表素材 (可选)",
            type: "file",
            accept: "image/*",
            multiple: true,
            uploadPreset: "image",
            placeholder: "上传真实截图或架构图...",
            required: false,
            description: "嵌入真实事实图表，避免空洞",
          },
        ],
        outputConfig: {
          renderType: "web-deck",
          suggestedActions: ["download", "fullscreen", "compare", "copy", "rerun"],
          customLayout: "split",
          deckConfig: {
            defaultStyle: "style_b_swiss",
            defaultTheme: "ikb_blue",
            durationPages: 16,
            speakerNotes: true,
          },
        },
      },
    };
  }

  // 1. Check if this is a Social Card / Carousel / Xiaohongshu / Cover Skill (e.g. guizang-social-card-skill)
  const isSocialCardSkill =
    (contentLower.includes("social-card") ||
      contentLower.includes("social card") ||
      contentLower.includes("小红书轮播") ||
      contentLower.includes("小红书图文") ||
      contentLower.includes("微信公众号封面") ||
      contentLower.includes("实况动效卡") ||
      filePaths.includes("social-card") ||
      filePaths.includes("category-cookbook") ||
      filePaths.includes("live-photo-production") ||
      srcNameLower.includes("social-card")) &&
    !contentLower.includes("brand-style") &&
    !contentLower.includes("web-ui") &&
    !contentLower.includes("html-snippet") &&
    !contentLower.includes("网页设计") &&
    !contentLower.includes("ios app");

  if (isSocialCardSkill) {
    return {
      title: extractedTitle || "Guizang · 社交卡片与封面工坊 (Social Card Skill)",
      description:
        extractedDesc ||
        "将长文、笔记、脚本、截图与实拍，生成高质感小红书 3:4 轮播卡片套图、微信公众号 21:9+1:1 封面对与实况动效卡。",
      icon: "Layers",
      category: "design",
      tags: ["小红书图文", "瑞士国际风格", "杂志风", "微信封面", "实况卡片"],
      systemInstruction: content,
      detectedEndpoints: [],
      hasExternalEndpoints: false,
      uiSchema: {
        title: "社交卡片与实况封面工作台",
        subtitle: "输入长文或选题，自动规划 3:4 轮播套卡、微信公众号封面对与实况动效卡",
        fields: [
          {
            id: "source_text",
            name: "待转化文章与文档附件",
            label: "上传待转化文章 / 文档 / 笔记附件 或 粘贴长文",
            type: "file",
            accept: ".md,.txt,.pdf,.docx,.json,image/*",
            multiple: true,
            uploadPreset: "document",
            placeholder: "在此粘贴长文、深度文章、播客脚本、产品评测、经验笔记，或直接上传文档附件...",
            defaultValue: `AI Agent 时代的产品范式重构：为什么我们不再需要复杂的单体控制台？\n\n核心观点：\n1. 传统 SaaS 的层级菜单黄昏：78% 的功能常年闲置，用户被困在复杂表单与跨工具跳转中。\n2. 意图自适应 UI 的兴起：从“用户学习软件”转变为“软件理解意图并在运行时自装配界面”。\n3. 沉浸式单一任务专注：每一次交互都直击核心，拒绝无意义的视觉噪声与功能堆砌。\n4. 生产力工具的终极形态：从臃肿的巨石应用，进化为即用即走、随需而生的轻量智能微构件。`,
            required: true,
            description: "支持上传 Markdown/PDF/TXT/Word/图片附件，AI 自动提取论据与结构，亦可直接在下方编写/粘贴长文",
          },
          {
            id: "target_platform",
            name: "交付平台与版式",
            label: "输出目标与版式规格",
            type: "select",
            defaultValue: "xhs_deck",
            required: true,
            options: [
              { label: "小红书 3:4 轮播卡片套图 (1080×1440, 封面+观点内页+复盘清单)", value: "xhs_deck" },
              { label: "微信公众号封面套件 (21:9 宽屏主封面 + 1:1 正方形分享头图)", value: "wechat_covers" },
              { label: "实况照片动态卡 (Live Photo 3-5秒动效卡 / 实况拼图)", value: "live_photo" },
              { label: "产品截图评测卡 (适合 App/教程/数据展示)", value: "screenshot_post" },
            ],
            description: "根据发布平台适配专属像素比例与留白安全区 (Safe Area)",
          },
          {
            id: "style_system",
            name: "视觉设计系统",
            label: "视觉设计系统模式",
            type: "select",
            defaultValue: "swiss",
            required: true,
            options: [
              { label: "瑞士国际主义风格 (Swiss - 严谨网格 / 单色重锚 / 强对比)", value: "swiss" },
              { label: "杂志编辑叙事风 (Editorial - 优雅衬线 / 呼吸留白 / 生活志质感)", value: "editorial" },
            ],
            description: "Swiss 适合科技、认知与方法论；Editorial 适合生活、人文与深度思考",
          },
          {
            id: "color_theme",
            name: "色彩主题",
            label: "预设主题色彩 (Theme Palette)",
            type: "select",
            defaultValue: "ikb_blue",
            required: true,
            options: [
              { label: "克莱因蓝 (IKB Blue #002FA7) - 瑞士科技与前沿", value: "ikb_blue" },
              { label: "荧光柠檬黄 (Lemon Yellow #D6FF00) - 高能警示与活力", value: "lemon_yellow" },
              { label: "国际安全橙 (Safety Orange #FF5500) - 醒目聚焦", value: "safety_orange" },
              { label: "玄墨经典 (Ink Classic) - 商务评论与理性思辨", value: "ink_classic" },
              { label: "青花霁蓝 (Indigo Porcelain) - 科技数据与清雅分析", value: "indigo_porcelain" },
              { label: "山野苍林 (Forest Ink) - 户外徒步与自然生活", value: "forest_ink" },
              { label: "大地牛皮纸 (Kraft Paper) - 质感复古与读书笔记", value: "kraft_paper" },
            ],
          },
          {
            id: "media_assets",
            name: "配图与截图素材",
            label: "上传真实配图 / 产品截图素材",
            type: "file",
            accept: "image/*",
            multiple: true,
            uploadPreset: "image",
            placeholder: "点击或拖拽上传一张或多张真实截图或照片...",
            required: false,
            description: "强烈建议上传真实截图或实拍图作为事实依据层，拒绝 AI 虚假质感",
          },
          {
            id: "video_asset",
            name: "实况视频素材",
            label: "上传实况照片短视频 (可选)",
            type: "file",
            accept: "video/*",
            multiple: false,
            placeholder: "上传 3-5 秒屏幕录像或实拍短视频...",
            required: false,
            description: "用于生成带 LIVE 标识的动态卡片 (小红书支持 5s，微信建议 3s)",
          },
          {
            id: "rednote_category",
            name: "小红书类目",
            label: "小红书笔记类目定位",
            type: "select",
            defaultValue: "tech",
            options: [
              { label: "科技与产品评测 (Tech / Review)", value: "tech" },
              { label: "旅行与户外探店 (Travel / Outdoor)", value: "travel" },
              { label: "职场思维与方法论 (Workplace / Thinking)", value: "workplace" },
              { label: "推荐好物与开箱 (Recommendation / Unbox)", value: "recommend" },
              { label: "家居与设计生活 (Home / Design)", value: "home" },
              { label: "美食食谱与教程 (Food / Recipe)", value: "food" },
              { label: "穿搭精选与胶囊衣橱 (Outfit / Capsule)", value: "outfit" },
            ],
          },
          {
            id: "page_count",
            name: "规划卡片页数",
            label: "期望卡片套图页数",
            type: "select",
            defaultValue: "4",
            options: [
              { label: "4 页精炼套卡 (封面 + 2 论据页 + 1 复盘清单)", value: "4" },
              { label: "6 页完整套卡 (封面 + 4 深度页 + 1 复盘清单)", value: "6" },
              { label: "8 页长篇干货 (封面 + 6 维度展开 + 1 复盘清单)", value: "8" },
              { label: "仅制作首图封面 (1 页大字钩子)", value: "1" },
            ],
          },
          {
            id: "include_summary_card",
            name: "末页行动清单",
            label: "包含末页复盘与行动清单卡",
            type: "switch",
            defaultValue: true,
            description: "自动在末页生成结构化 CheckList 清单，提升收藏率与复用价值",
          },
        ],
        outputConfig: {
          renderType: "social-cards",
          suggestedActions: ["download", "compare", "copy", "fullscreen", "rerun"],
          customLayout: "split",
          socialCardsConfig: {
            defaultPlatform: "xhs_deck",
            defaultStyle: "swiss",
            defaultTheme: "ikb_blue",
            pageCount: 4,
          },
        },
      },
    };
  }

  // 1.5 Check if this is a Brand Design / Web UI / HTML Snippet / iOS App Generation Skill
  const isWebUiOrHtmlSkill =
    contentLower.includes("brand-style") ||
    contentLower.includes("web-ui") ||
    contentLower.includes("html-snippet") ||
    contentLower.includes("品牌风格设计") ||
    contentLower.includes("web 页面") ||
    contentLower.includes("web页面") ||
    contentLower.includes("网页设计") ||
    contentLower.includes("ios app 界面") ||
    contentLower.includes("ios app") ||
    contentLower.includes("设计系统参考") ||
    contentLower.includes("html 片段") ||
    contentLower.includes("html片段") ||
    contentLower.includes("ui 设计") ||
    contentLower.includes("landing page") ||
    srcNameLower.includes("brand") ||
    srcNameLower.includes("web-ui") ||
    srcNameLower.includes("html");

  if (isWebUiOrHtmlSkill) {
    return {
      title: extractedTitle || "品牌风格设计参考与 Web/iOS 界面生成工坊",
      description:
        extractedDesc ||
        "根据指定品牌风格 (如 Stripe, Linear, 飞书, 小米, Apple) 或中国传统色，自动生成高质量 Web 页面、iOS App 界面或设计系统参考的 HTML 片段，并适配您的文案内容。",
      icon: "PenTool",
      category: "design",
      tags: ["Web设计", "UI组件", "品牌风格", "HTML", "iOS界面"],
      systemInstruction: content,
      detectedEndpoints: [],
      hasExternalEndpoints: false,
      uiSchema: {
        title: "品牌风格与 Web/iOS 界面生成工作台",
        subtitle: "选择品牌设计语言与界面形态，输入业务文案，一键生成生产级 HTML 代码并在沙箱中实时交互",
        fields: [
          {
            id: "brand_style",
            name: "品牌与设计风格",
            label: "品牌视觉设计语言 (Brand Style)",
            type: "select",
            defaultValue: "stripe_minimal",
            required: true,
            options: [
              { label: "Stripe 现代科技 (优雅网格渐变 / 极简排版 / 微投影)", value: "stripe_minimal" },
              { label: "Linear 先锋暗黑 (Cyber Dark / 精准边框高光 / 键盘快捷指示)", value: "linear_dark" },
              { label: "Apple 极致纯粹 (精致磨砂玻璃 / 严谨留白 / SF Pro 字体排版)", value: "apple_refined" },
              { label: "飞书/字节高效商务 (高信息密度 / 协同模块 / 亲和力蓝彩)", value: "feishu_business" },
              { label: "中国传统国色风雅 (矿物朱砂 / 黛蓝 / 东方典雅意境)", value: "chinese_tradition" },
              { label: "Tailwind 现代 SaaS (高转化 Hero / 特性矩阵 / 交互卡片)", value: "tailwind_saas" },
              { label: "iOS 18 拟态质感 (圆润大倒角 / 触觉反馈卡片 / 紧凑列表)", value: "ios_native" },
            ],
            description: "AI 将严格根据所选品牌的调色板、圆角率、边框与排版节奏组织界面",
          },
          {
            id: "target_ui_type",
            name: "交付界面形态",
            label: "界面形态规格 (UI Type)",
            type: "select",
            defaultValue: "web_landing",
            required: true,
            options: [
              { label: "Web 响应式 Landing Page 落地页 (包含 Hero 头部 + 核心亮点卡片 + CTA 转化区)", value: "web_landing" },
              { label: "iOS App 移动端单屏界面 (iPhone 390px 尺寸, 顶部状态栏 + 卡片列表 + 底部操作栏)", value: "ios_screen" },
              { label: "设计系统组件规范卡 (包含调色板色卡 + 按钮状态 + 卡片变体 + 字体阶梯)", value: "design_system_cards" },
              { label: "交互式业务分析仪表盘 (Dashboard - 统计指标 + 图表卡片 + 动态列表)", value: "analytics_dashboard" },
            ],
            description: "决定生成的 HTML 结构、画布比例与容器响应式断点",
          },
          {
            id: "source_content",
            name: "界面文案与需求材料",
            label: "上传需求文档 / 业务文案附件 或 粘贴内容",
            type: "file",
            accept: ".md,.txt,.pdf,.docx,.json,image/*",
            multiple: true,
            uploadPreset: "document",
            placeholder: "在此粘贴或输入需要呈现在界面上的产品名称、核心卖点、功能描述、数据指标，或直接上传文档附件...",
            defaultValue: "SkillUI 智能技能工作台：一键将 Markdown 与 API 规则转化为极致体验的生产力工具。\n\n核心亮点：\n1. 零配置自动装配界面\n2. 瑞士国际主义高质感排版\n3. 本地优先安全架构",
            required: true,
            description: "支持上传文档附件，AI 自动提取事实文案并融合进生成的界面中",
          },
          {
            id: "theme_color",
            name: "主题主色系",
            label: "品牌主色调 (Primary Accent)",
            type: "select",
            defaultValue: "indigo_modern",
            options: [
              { label: "极光紫蓝 (Indigo Modern #6366F1)", value: "indigo_modern" },
              { label: "克莱因蓝 (IKB Blue #002FA7)", value: "ikb_blue" },
              { label: "荧光柠檬黄 (Lemon Yellow #D6FF00)", value: "lemon_yellow" },
              { label: "翡翠深绿 (Emerald #10B981)", value: "emerald" },
              { label: "朱砂赤红 (Vermilion #AC3C33)", value: "vermilion" },
              { label: "极简纯黑白 (Monochrome Noir #09090B)", value: "monochrome" },
            ],
          },
        ],
        outputConfig: {
          renderType: "html",
          suggestedActions: ["download", "fullscreen", "copy", "rerun"],
          customLayout: "split",
        },
      },
    };
  }

  // 2. Check if this is an Architectural / Cultural Poster / Photo Skill (e.g. Yingzao 营造)
  const isPosterSkill =
    contentLower.includes("yingzao") ||
    contentLower.includes("营造") ||
    (contentLower.includes("古建筑") && contentLower.includes("海报")) ||
    filePaths.includes("yingzao") ||
    filePaths.includes("reference-plates") ||
    filePaths.includes("typeset_compose");

  if (isPosterSkill) {
    return {
      title: extractedTitle || "Yingzao · 营造 (建筑与在地文化海报)",
      description:
        extractedDesc ||
        "把拍下的真实古建筑、民居、文化街区与器物照片，转成经过艺术指导与图文遮挡互动的中文编辑海报。",
      icon: "Sparkles",
      category: "design",
      tags: ["文化建筑", "编辑海报", "艺术指导", "字形设计", "多模态"],
      systemInstruction: content,
      detectedEndpoints: [],
      hasExternalEndpoints: false,
      uiSchema: {
        title: "营造 (Yingzao) 艺术海报工作台",
        subtitle: "上传真实建筑/文创照片，智能配置四域艺术命题与图文空间咬合",
        fields: [
          {
            id: "photos",
            name: "真实照片素材",
            label: "上传真实建筑 / 街区 / 器物照片",
            type: "file",
            accept: "image/*",
            multiple: true,
            uploadPreset: "image",
            placeholder: "点击或拖拽上传一张或多张真实拍摄的照片素材...",
            required: true,
            description: "支持单张照片重绘，或上传同组多张照片融合成一个共同场景",
          },
          {
            id: "subject_name",
            name: "地点与对象名",
            label: "建筑 / 殿名 / 地方对象名称",
            type: "text",
            placeholder: "如：大同古城、善化寺藻井、应县木塔、沙棘美式...",
            defaultValue: "大同古城",
            required: true,
            description: "请提供已核实或照片可见的真实名称，避免凭空编造",
          },
          {
            id: "aspect_ratio",
            name: "画幅比例",
            label: "海报画幅比例 (Aspect Ratio)",
            type: "select",
            defaultValue: "3:4",
            required: true,
            options: [
              { label: "3:4 (经典竖版艺术海报，推荐)", value: "3:4" },
              { label: "1:1 (正方形典雅画幅)", value: "1:1" },
              { label: "16:9 (横版宽幅空间画卷)", value: "16:9" },
              { label: "4:3 (标准横向构图)", value: "4:3" },
              { label: "9:16 (手机壁纸/全屏海报)", value: "9:16" },
            ],
          },
          {
            id: "interaction_style",
            name: "图文空间互动",
            label: "标题字与建筑空间互动方式",
            type: "select",
            defaultValue: "masking",
            required: true,
            options: [
              { label: "主体压字 / 边缘咬合遮挡 (打破平面感)", value: "masking" },
              { label: "文字避让核心构件 / 留白穿插 (如避让藻井)", value: "avoidance" },
              { label: "字压主体 / 纯净覆层", value: "overlay" },
              { label: "侧轴非对称排版 (打破双居中孤岛)", value: "asymmetric" },
            ],
            description: "拒绝无接触的两座孤岛，使标题字与真实飞檐、轮廓自然共边与掩映",
          },
          {
            id: "multi_photo_mode",
            name: "多图融合模式",
            label: "多图场景重构模式",
            type: "select",
            defaultValue: "unified_scene",
            required: false,
            options: [
              { label: "重构为共享透视与光影的单一场景", value: "unified_scene" },
              { label: "保留照片矩形与留白对比组照", value: "photo_collage" },
            ],
            description: "当上传多张照片时生效，默认将各图主体重构进同一视觉世界",
          },
          {
            id: "create_comparison",
            name: "对照拼图",
            label: "同时生成原图与海报对照图",
            type: "switch",
            defaultValue: false,
            description: "开启后将在海报旁输出前后对比拼接图",
          },
          {
            id: "expand_storyboard",
            name: "视频分镜扩展",
            label: "扩展生成 3×3 视频分镜与视频模型提示词",
            type: "switch",
            defaultValue: false,
            description: "按海报视觉延展出 9 格运镜分镜，并附可直接交付视频模型的英文 Prompt",
          },
        ],
        outputConfig: {
          renderType: "poster",
          suggestedActions: ["download", "compare", "copy", "fullscreen", "rerun"],
          customLayout: "split",
          posterConfig: {
            theme: "architectural",
            defaultAspect: "3:4",
            brandColor: "#AC3C33",
            showComparison: true,
            showStoryboard: true,
          },
        },
      },
    };
  }

  let title = extractedTitle || "通用智能技能";
  let description = extractedDesc || "由 Skill 规则与目录体系自动解析生成的交互式应用";
  let icon = "Sparkles";
  let category = "custom";
  let tags = ["AI技能", "自动化"];

  if (contentLower.includes("code") || contentLower.includes("javascript") || contentLower.includes("python")) {
    category = "coding";
    icon = "Code";
    tags = ["编程开发", "代码辅助"];
  } else if (contentLower.includes("write") || contentLower.includes("copy") || contentLower.includes("文案")) {
    category = "writing";
    icon = "Wand2";
    tags = ["内容创作", "文案生成"];
  } else if (contentLower.includes("data") || contentLower.includes("sql") || contentLower.includes("分析")) {
    category = "analysis";
    icon = "BarChart";
    tags = ["数据分析", "统计分析"];
  }

  // Detect endpoints
  const detectedEndpoints: any[] = [];
  const urlMatches = content.match(/https?:\/\/[^\s"'`<>]+/g) || [];
  urlMatches.forEach((u) => {
    if (u.includes("api") || u.includes("webhook") || u.includes("post") || u.includes("httpbin")) {
      detectedEndpoints.push({
        name: "检测到的外部接口",
        url: u,
        method: "POST",
        description: "从 Skill 内容中提取的 API 端点",
      });
    }
  });

  return {
    title,
    description,
    icon,
    category,
    tags,
    systemInstruction: content,
    uiSchema: {
      title: `${title} - 操作面板`,
      subtitle: "请在下方配置参数后点击执行",
      fields: [
        {
          id: "input_text",
          name: "输入内容",
          label: "输入内容 / 任务指令",
          type: "textarea",
          placeholder: "请输入您希望该 Skill 处理的详细内容...",
          required: true,
        },
      ],
      outputConfig: {
        renderType: "markdown",
        suggestedActions: ["copy", "download", "rerun"],
        customLayout: "split",
      },
    },
    detectedEndpoints,
  };
}

// 2. Parse skill with Gemini AI into structured UI Schema & metadata
app.post("/api/skill/parse", async (req, res) => {
  const { content, sourceName, files = [], repositoryInfo, openaiYamlContent, readmeSnippet } = req.body;
  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "Skill 内容不能为空" });
    return;
  }

  try {
    const ai = getGeminiClient();

    const filePathsSummary =
      files && Array.isArray(files) && files.length > 0
        ? files.map((f: any) => `  - [${f.type}] ${f.path}`).slice(0, 100).join("\n")
        : "无外部独立目录文件（单文件 Skill）";

    const repoContext = repositoryInfo
      ? `\n仓库来源: ${repositoryInfo.owner}/${repositoryInfo.repo} (${repositoryInfo.totalFiles} 个文件, ⭐ ${repositoryInfo.stars || 0})`
      : "";

    const yamlContext = openaiYamlContent
      ? `\n--- openai.yaml 元数据 ---\n${openaiYamlContent}\n`
      : "";

    const parsePrompt = `你是一个顶级 AI 应用架构师与 UI/UX 专家。
你的任务是深入分析用户提供的 Skill（技能规范、SKILL.md、目录结构、YAML/JSON 配置与代码片段），将其自动解析并转换为一个高度精准、专业的可视化 UI 交互界面配置。
${repoContext}

--- 技能目录与资源文件结构 (Files & Directory Tree) ---
${filePathsSummary}
${yamlContext}
================ Skill 核心规则 (SKILL.md) ================
${content.slice(0, 25000)}
================ End Content ================
来源文件名/提示: ${sourceName || "未指定"}

【核心原则：输入字段必须深度分析是否支持/需要文件附件上传】：
- Skill 的本质是「基于用户输入的内容/素材进行智能加工、编辑与重构」。
- 必须分析该 Skill 是否需要用户提供文章、文档、研究报告、代码文件、图片素材、数据表或视音频等。
- 如果是内容转化/编辑/分析/多模态类 Skill（如长文转卡片、文档转PPT、代码评审、海报设计、数据分析、文档翻译等），核心输入项【绝不能仅仅提供一个简陋的纯文本输入框】，必须优先设计为支持文件/文档/素材上传的智能内容字段（type: 'file' 或多模态文档上传，配置 accept: '.md,.txt,.pdf,.docx,.json,image/*'，multiple: true，uploadPreset: 'document' | 'image' | 'any'），让用户可以直接拖入/上传附件，并支持文本直接输入。

【特别分析要求 - 必须遵循不同 Skill 目录结构的真实业务属性与输入输出形态】：
1. 仔细观察该技能的目录结构、引用的规范文档与业务领域：
   - 【类型 A：社交媒体轮播卡片 / 封面对 / 实况照片工坊 (如 Guizang Social Card, 小红书轮播图文, 微信公众号封面对, 知识卡片)】：
     * 判定特征：包含 social-card、category-cookbook、swiss-style、editorial-style、live-photo-production、layout-recipes、小红书、微信公众号、实况照片、轮播卡片等。
     * 输入字段 (fields) 必须包含：
       1) 待转化文章与文档附件 (id: 'source_text', name: '待转化文章与文档附件', label: '上传待转化文章 / 文档 / 笔记附件 或 粘贴长文', type: 'file', accept: '.md,.txt,.pdf,.docx,.json,image/*', multiple: true, uploadPreset: 'document', placeholder: '在此粘贴长文、深度文章、播客脚本、产品评测、经验笔记，或直接上传文档附件...', required: true, description: '支持上传 Markdown/PDF/TXT/Word/图片附件，AI 自动提取论据与结构，亦可直接在下方编写/粘贴长文')
       2) 交付平台与版式 (id: 'target_platform', name: '交付平台与版式', label: '输出目标与版式规格', type: 'select', defaultValue: 'xhs_deck', required: true, options: [{label: '小红书 3:4 轮播卡片套图 (1080×1440, 封面+观点内页+复盘清单)', value: 'xhs_deck'}, {label: '微信公众号封面套件 (21:9 宽屏主封面 + 1:1 正方形分享头图)', value: 'wechat_covers'}, {label: '实况照片动态卡 (Live Photo 3-5秒动效卡 / 实况拼图)', value: 'live_photo'}, {label: '产品截图评测卡 (适合 App/教程/数据展示)', value: 'screenshot_post'}], description: '根据发布平台适配专属像素比例与留白安全区')
       3) 视觉设计系统 (id: 'style_system', name: '视觉设计系统', label: '视觉设计系统模式', type: 'select', defaultValue: 'swiss', required: true, options: [{label: '瑞士国际主义风格 (Swiss - 严谨网格 / 单色重锚 / 强对比)', value: 'swiss'}, {label: '杂志编辑叙事风 (Editorial - 优雅衬线 / 呼吸留白 / 生活志质感)', value: 'editorial'}], description: 'Swiss 适合科技与方法论；Editorial 适合生活、人文与深度思考')
       4) 色彩主题 (id: 'color_theme', name: '色彩主题', label: '预设主题色彩 (Theme Palette)', type: 'select', defaultValue: 'ikb_blue', required: true, options: [{label: '克莱因蓝 (IKB Blue #002FA7) - 瑞士科技与前沿', value: 'ikb_blue'}, {label: '荧光柠檬黄 (Lemon Yellow #D6FF00) - 高能警示与活力', value: 'lemon_yellow'}, {label: '国际安全橙 (Safety Orange #FF5500) - 醒目聚焦', value: 'safety_orange'}, {label: '玄墨经典 (Ink Classic) - 商务评论与理性思辨', value: 'ink_classic'}, {label: '青花霁蓝 (Indigo Porcelain) - 科技数据与清雅分析', value: 'indigo_porcelain'}, {label: '山野苍林 (Forest Ink) - 户外徒步与自然生活', value: 'forest_ink'}, {label: '大地牛皮纸 (Kraft Paper) - 质感复古与读书笔记', value: 'kraft_paper'}])
       5) 配图与截图素材 (id: 'media_assets', name: '配图与截图素材', label: '上传真实配图 / 产品截图素材', type: 'file', accept: 'image/*', multiple: true, uploadPreset: 'image', placeholder: '点击或拖拽上传一张或多张真实截图或照片...', required: false, description: '强烈建议上传真实截图或实拍图作为事实依据层，拒绝 AI 虚假质感')
       6) 实况视频素材 (id: 'video_asset', name: '实况视频素材', label: '上传实况照片短视频 (可选)', type: 'file', accept: 'video/*', multiple: false, placeholder: '上传 3-5 秒屏幕录像或实拍短视频...', required: false, description: '用于生成带 LIVE 标识的动态卡片 (小红书支持 5s，微信建议 3s)')
       7) 小红书类目 (id: 'rednote_category', name: '小红书类目', label: '小红书笔记类目定位', type: 'select', defaultValue: 'tech', options: [{label: '科技与产品评测 (Tech / Review)', value: 'tech'}, {label: '旅行与户外探店 (Travel / Outdoor)', value: 'travel'}, {label: '职场思维与方法论 (Workplace / Thinking)', value: 'workplace'}, {label: '推荐好物与开箱 (Recommendation / Unbox)', value: 'recommend'}, {label: '家居与设计生活 (Home / Design)', value: 'home'}, {label: '美食食谱与教程 (Food / Recipe)', value: 'food'}, {label: '穿搭精选与胶囊衣橱 (Outfit / Capsule)', value: 'outfit'}])
       8) 规划卡片页数 (id: 'page_count', name: '规划卡片页数', label: '期望卡片套图页数', type: 'select', defaultValue: '4', options: [{label: '4 页精炼套卡 (封面 + 2 论据页 + 1 复盘清单)', value: '4'}, {label: '6 页完整套卡 (封面 + 4 深度页 + 1 复盘清单)', value: '6'}, {label: '8 页长篇干货 (封面 + 6 维度展开 + 1 复盘清单)', value: '8'}, {label: '仅制作首图封面 (1 页大字钩子)', value: '1'}])
       9) 末页行动清单 (id: 'include_summary_card', name: '末页行动清单', label: '包含末页复盘与行动清单卡', type: 'switch', defaultValue: true, description: '自动在末页生成结构化 CheckList 清单，提升收藏率与复用价值')
     * 输出配置 (outputConfig)：
       renderType: 'social-cards'
       suggestedActions: ['download', 'compare', 'copy', 'fullscreen', 'rerun']
       customLayout: 'split'
       socialCardsConfig: {
         defaultPlatform: 'xhs_deck',
         defaultStyle: 'swiss',
         defaultTheme: 'ikb_blue',
         pageCount: 4
       }

   - 【类型 B：Web 原生演示文稿 / PPT Deck 工坊 (如 Guizang PPT Skill)】：
     * 判定特征：包含 ppt、deck、slides、presentation、幻灯片、演示文稿等。
     * 输入字段必须包含：
       1) 演讲大纲与研报文档附件 (id: 'topic_or_outline', name: '演讲大纲与参考研报', label: '上传演讲大纲 / 研报文档 / 原始材料附件 或 粘贴提纲', type: 'file', accept: '.md,.txt,.pdf,.docx,.json,image/*', multiple: true, uploadPreset: 'document', required: true, description: '支持上传 Word、PDF、Markdown 研报或大纲文件，AI 将全自动提取事实依据并生成 Web 幻灯片')
       2) 幻灯片视觉风格 (id: 'deck_style', name: '幻灯片视觉风格', label: '视觉风格体系 (Presentation Style)', type: 'select', defaultValue: 'style_b_swiss', required: true, options: [{label: '风格 B：瑞士国际主义高密度事实 (Swiss Facts & Grid)', value: 'style_b_swiss'}, {label: '风格 A：现代杂志叙事风 (Editorial Magazine)', value: 'style_a_editorial'}, {label: '风格 C：暗黑极客先锋 (Cyber Dark Minimal)', value: 'style_c_dark'}])
       3) 主题主色调 (id: 'theme_color', name: '主题主色调', label: '品牌/主色系 (Primary Accent)', type: 'select', defaultValue: 'ikb_blue', required: true, options: [{label: '克莱因蓝 (IKB Blue #002FA7) - 理性科技与权威', value: 'ikb_blue'}, {label: '国际安全橙 (Safety Orange #FF5500) - 醒目聚焦与活力', value: 'safety_orange'}, {label: '玄铁墨黑 (Ink Black #18181B) - 高端商务与极简', value: 'ink_black'}, {label: '青花瓷蓝 (Porcelain Blue #1D4ED8) - 结构严谨与数据分析', value: 'porcelain_blue'}, {label: '冷翠深绿 (Emerald Forest #065F46) - 商业洞察与生态', value: 'emerald_forest'}])
       4) 规划幻灯片页数 (id: 'duration_pages', name: '规划幻灯片页数', label: '演讲时长与预期页数', type: 'select', defaultValue: '16', required: true, options: [{label: '8 页精简快讲 (5-10 分钟 Flash Pitch)', value: '8'}, {label: '16 页标准深度演讲 (15-25 分钟 Standard Deck)', value: '16'}, {label: '24 页完整方案与研报交付 (30-45 分钟 Comprehensive)', value: '24'}])
       5) 受众与演讲场景 (id: 'audience_scenario', name: '汇报场景与受众', label: '受众与演讲场景', type: 'select', defaultValue: 'conference', options: [{label: '行业峰会 / Keynote 主题演讲', value: 'conference'}, {label: '投资人路演 / Pitch Deck', value: 'investor'}, {label: '企业内部战略汇报 / OKR 复盘', value: 'internal_strategy'}, {label: '产品发布会 / Demo Day', value: 'product_launch'}, {label: '技术分享 / 架构深潜 (Tech Deep Dive)', value: 'tech_share'}])
       6) 生成演讲者模式备忘录 (id: 'include_speaker_notes', name: '包含演讲者备忘录与逐字稿', label: '生成演讲者模式备忘录 (Speaker Notes)', type: 'switch', defaultValue: true)
     * 输出配置 (outputConfig)：
       renderType: 'web-deck'
       suggestedActions: ['download', 'fullscreen', 'compare', 'copy', 'rerun']
       customLayout: 'split'
       deckConfig: { defaultStyle: 'style_b_swiss', defaultTheme: 'ikb_blue', durationPages: 16, speakerNotes: true }

   - 【类型 C：视觉编辑海报 / 多模态建筑文化图像重绘与排版 (如 Yingzao 营造, 建筑古建海报)】：
     * 判定特征：包含 reference-plates、frontend-layout-guide.md、image-generation-workflow.md、typeset_compose.py、Yingzao、营造、古建筑海报等。
     * 输入字段 (fields) 必须包含：
       - 照片素材上传 (id: 'photos', name: '真实照片素材', label: '上传真实建筑 / 街区 / 器物照片素材', type: 'file', accept: 'image/*', multiple: true, uploadPreset: 'image', required: true, description: '支持单张照片重绘，或上传同组多张照片融合成一个共同场景')
       - 建筑/地点/对象名称 (id: 'subject_name', name: '地点与对象名', label: '建筑 / 殿名 / 地方对象名称', type: 'text', placeholder: '如：大同古城、善化寺藻井、沙棘美式...', defaultValue: '大同古城', required: true)
       - 海报画幅比例 (id: 'aspect_ratio', name: '画幅比例', label: '海报画幅比例 (Aspect Ratio)', type: 'select', defaultValue: '3:4', options: [{label: '3:4 (经典竖版海报，推荐)', value: '3:4'}, {label: '1:1 (正方形典雅画幅)', value: '1:1'}, {label: '16:9 (横版宽幅空间画卷)', value: '16:9'}, {label: '4:3 (标准横向构图)', value: '4:3'}, {label: '9:16 (手机壁纸全屏)', value: '9:16'}], required: true)
       - 图文空间互动 (id: 'interaction_style', name: '图文空间互动', label: '标题字与建筑空间互动方式', type: 'select', defaultValue: 'masking', options: [{label: '主体压字 / 边缘咬合遮挡 (打破平面感)', value: 'masking'}, {label: '文字避让核心构件 / 留白穿插 (如避让藻井)', value: 'avoidance'}, {label: '字压主体 / 纯净覆层', value: 'overlay'}, {label: '侧轴非对称排版 (打破双居中孤岛)', value: 'asymmetric'}], required: true)
       - 多图融合模式 (id: 'multi_photo_mode', name: '多图融合模式', label: '多图场景重构模式', type: 'select', defaultValue: 'unified_scene', options: [{label: '重构为共享透视与光影的单一场景', value: 'unified_scene'}, {label: '保留照片矩形与留白对比组照', value: 'photo_collage'}])
       - 对照拼图 (id: 'create_comparison', name: '对照拼图', label: '同时生成原图与海报对照图', type: 'switch', defaultValue: false)
       - 视频分镜扩展 (id: 'expand_storyboard', name: '视频分镜扩展', label: '扩展生成 3×3 视频分镜与视频模型提示词', type: 'switch', defaultValue: false)
     * 输出配置 (outputConfig)：
       renderType: 'poster'
       suggestedActions: ['download', 'compare', 'copy', 'fullscreen', 'rerun']
       customLayout: 'split'
       posterConfig: { theme: 'architectural', defaultAspect: '3:4', brandColor: '#AC3C33', showComparison: true, showStoryboard: true }

   - 【类型 D：代码开发 / 代码审查 / 智能重构】：
     * 源码与工程文件上传 (type: 'file', accept: '.ts,.js,.py,.go,.rs,.java,.cpp,.sql,.json,.md') + 编程语言 (select) + 审查侧重 (select) -> renderType: 'code' 或 'markdown'
   - 【类型 E：深度长文 / 策划方案 / 写作辅助 / 翻译润色】：
     * 原文档附件上传 (type: 'file', accept: '.md,.txt,.pdf,.docx,.json') + 补充要求 (textarea) -> renderType: 'markdown'
   - 【类型 F：数据分析 / 指标看板】：
     * 数据集文件上传 (type: 'file', accept: '.csv,.json,.xlsx,.txt') + 分析目标 (text) -> renderType: 'structured'

请提取并生成以下 JSON 结构：
1. title: 简洁有吸引力的应用/技能名称（中文，如果是 Guizang 社交卡片、Guizang PPT 或 Yingzao 营造请清晰标明）
2. description: 1-2句话清晰阐述这个技能解决什么问题、如何使用
3. icon: 适合该功能的图标名称（必须是以下之一：Sparkles, Code, Terminal, Bot, FileText, Wand2, Database, Globe, Search, Layers, Zap, Cpu, Settings, MessageSquare, Shield, PenTool, CheckCircle, BarChart, Sliders, Box, Brain, Workflow, Flame, BookOpen）
4. category: 分类（coding, writing, analysis, productivity, design, utilities, custom 之一）
5. tags: 2-4个标签数组
6. systemInstruction: 核心系统指令或 Prompt 模版
7. detectedEndpoints: []
8. hasExternalEndpoints: false
9. uiSchema:
   - title: 表单标题
   - subtitle: 表单操作引导语
   - fields: 表单输入字段数组，每个字段包含 id, name, label, type, placeholder, defaultValue, required, options, description, validation, language, accept, multiple, uploadPreset
   - outputConfig:
     * renderType: "social-cards" | "web-deck" | "poster" | "markdown" | "code" | "json" | "structured" | "diff"
     * suggestedActions: ["download", "compare", "copy", "rerun", "fullscreen"]
     * socialCardsConfig?: { defaultPlatform, defaultStyle, defaultTheme, pageCount }
     * deckConfig?: { defaultStyle, defaultTheme, durationPages, speakerNotes }
     * posterConfig?: { theme, defaultAspect, brandColor, showComparison, showStoryboard }

请严格返回符合上述结构的合法 JSON，不要包含任何 markdown 围栏标记（如 \`\`\`json ）。`;

    let rawJson = "{}";
    const parseCandidates = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"];
    let parseSuccess = false;

    for (const pModel of parseCandidates) {
      try {
        const response = await ai.models.generateContent({
          model: pModel,
          contents: parsePrompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        rawJson = response.text || "{}";
        parseSuccess = true;
        break;
      } catch (pErr: any) {
        console.warn(`Parse attempt with ${pModel} failed:`, pErr?.message);
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    if (!parseSuccess) {
      throw new Error("All AI parse models temporarily busy, triggering heuristic fallback");
    }

    const parsedData = JSON.parse(rawJson);

    // Structural Normalization: ensure correct renderType and configs for known archetypes
    const contentLower = content.toLowerCase();
    const sourceNameLower = (sourceName || "").toLowerCase();
    const filePaths = (files || []).map((f: any) => (f.path || "").toLowerCase()).join(" ");

    const isDeck =
      contentLower.includes("ppt-skill") ||
      contentLower.includes("guizang-ppt") ||
      contentLower.includes("web-deck") ||
      contentLower.includes("presentation") ||
      contentLower.includes("web ppt") ||
      contentLower.includes("幻灯片") ||
      contentLower.includes("演示文稿") ||
      filePaths.includes("ppt-skill") ||
      filePaths.includes("web-deck") ||
      sourceNameLower.includes("ppt") ||
      sourceNameLower.includes("deck");

    const isWebUi =
      contentLower.includes("brand-style") ||
      contentLower.includes("web-ui") ||
      contentLower.includes("html-snippet") ||
      contentLower.includes("品牌风格设计") ||
      contentLower.includes("web 页面") ||
      contentLower.includes("web页面") ||
      contentLower.includes("网页设计") ||
      contentLower.includes("ios app 界面") ||
      contentLower.includes("ios app") ||
      contentLower.includes("设计系统参考") ||
      contentLower.includes("html 片段") ||
      contentLower.includes("html片段") ||
      contentLower.includes("ui 设计") ||
      contentLower.includes("landing page") ||
      sourceNameLower.includes("brand") ||
      sourceNameLower.includes("web-ui") ||
      sourceNameLower.includes("html");

    const isSocialCard =
      !isDeck &&
      !isWebUi &&
      (contentLower.includes("social-card") ||
        contentLower.includes("social card") ||
        contentLower.includes("小红书轮播") ||
        contentLower.includes("小红书图文") ||
        contentLower.includes("微信公众号封面") ||
        contentLower.includes("category-cookbook") ||
        filePaths.includes("social-card") ||
        filePaths.includes("category-cookbook") ||
        sourceNameLower.includes("social-card"));

    if (isDeck) {
      if (!parsedData.uiSchema) parsedData.uiSchema = {};
      if (!parsedData.uiSchema.outputConfig) parsedData.uiSchema.outputConfig = {};
      parsedData.uiSchema.outputConfig.renderType = "web-deck";
      if (!parsedData.uiSchema.outputConfig.deckConfig) {
        parsedData.uiSchema.outputConfig.deckConfig = {
          defaultStyle: "style_b_swiss",
          defaultTheme: "ikb_blue",
          durationPages: 16,
          speakerNotes: true,
        };
      }
      parsedData.category = "design";
      parsedData.icon = "Sliders";
    } else if (isWebUi) {
      if (!parsedData.uiSchema) parsedData.uiSchema = {};
      if (!parsedData.uiSchema.outputConfig) parsedData.uiSchema.outputConfig = {};
      parsedData.uiSchema.outputConfig.renderType = "html";
      parsedData.category = "design";
      parsedData.icon = "PenTool";
    } else if (isSocialCard) {
      if (!parsedData.uiSchema) parsedData.uiSchema = {};
      if (!parsedData.uiSchema.outputConfig) parsedData.uiSchema.outputConfig = {};
      parsedData.uiSchema.outputConfig.renderType = "social-cards";
      if (!parsedData.uiSchema.outputConfig.socialCardsConfig) {
        parsedData.uiSchema.outputConfig.socialCardsConfig = {
          defaultPlatform: "xhs_deck",
          defaultStyle: "swiss",
          defaultTheme: "ikb_blue",
          pageCount: 4,
        };
      }
      parsedData.category = "design";
      parsedData.icon = "Layers";
    }

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (err: any) {
    console.warn("AI parse fallback applied:", err?.message);
    const fallbackData = heuristicParseSkill(content, sourceName, files, openaiYamlContent);
    res.json({
      success: true,
      data: fallbackData,
      isFallback: true,
    });
  }
});

// 3. Execute Skill using Gemini AI (SSE Stream for fast, interactive response)
app.post("/api/skill/execute", async (req, res) => {
  try {
    const { systemInstruction, inputValues, fields, title, modelConfig, skillRecord } = req.body;

    const ai = getGeminiClient();

    // Set headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Extract any uploaded multimodal parts (images, PDFs) or decode text/data files (including docx)
    const multimodalParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    const extractedDocumentTexts: Array<{ name: string; content: string }> = [];

    const processUploadedItemAsync = async (val: any) => {
      if (!val) return;
      if (typeof val === "string") {
        if (val.startsWith("data:image/") || val.startsWith("data:application/pdf")) {
          const match = val.match(/^data:([^;]+);base64,(.+)$/);
          if (match && multimodalParts.length < 8) {
            multimodalParts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        } else if (val.includes("wordprocessingml") || val.includes("vnd.openxmlformats") || val.endsWith(".docx")) {
          const match = val.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            try {
              const buffer = Buffer.from(match[2], "base64");
              const zip = await JSZip.loadAsync(buffer);
              const docXml = await zip.file("word/document.xml")?.async("text");
              if (docXml) {
                const text = docXml
                  .replace(/<\/w:p>/g, "\n")
                  .replace(/<w:tab\/>/g, "\t")
                  .replace(/<[^>]+>/g, "")
                  .trim();
                if (text) {
                  extractedDocumentTexts.push({ name: "Word文档 (DOCX)", content: text });
                }
              }
            } catch (e) {
              console.warn("DOCX extraction error in server:", e);
            }
          }
        } else if (
          val.startsWith("data:text/") ||
          val.startsWith("data:application/json") ||
          val.startsWith("data:application/xml") ||
          val.startsWith("data:text/markdown")
        ) {
          const match = val.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            try {
              const decoded = Buffer.from(match[2], "base64").toString("utf-8");
              extractedDocumentTexts.push({ name: "附加文本文件", content: decoded });
            } catch {}
          }
        }
      } else if (Array.isArray(val)) {
        for (const item of val) {
          await processUploadedItemAsync(item);
        }
      } else if (typeof val === "object" && val !== null) {
        if (Array.isArray(val.files)) {
          for (const item of val.files) {
            await processUploadedItemAsync(item);
          }
        }
        if (val.textContent && typeof val.textContent === "string") {
          extractedDocumentTexts.push({ name: val.name || "文档附件", content: val.textContent });
        }
        const fileUrl = val.dataUrl || val.url;
        const fileName = val.name || "素材附件";
        if (typeof fileUrl === "string") {
          if (fileUrl.startsWith("data:image/") || fileUrl.startsWith("data:application/pdf")) {
            const match = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match && multimodalParts.length < 8) {
              multimodalParts.push({
                inlineData: {
                  mimeType: match[1],
                  data: match[2],
                },
              });
            }
          }
          if (fileUrl.startsWith("data:application/pdf") || fileName.toLowerCase().endsWith(".pdf")) {
            const match = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              try {
                const buffer = Buffer.from(match[2], "base64");
                const pdfModule = await import("pdf-parse");
                const pdfParse = (pdfModule as any).default || pdfModule;
                const pdfResult = await pdfParse(buffer);
                if (pdfResult && pdfResult.text && pdfResult.text.trim()) {
                  extractedDocumentTexts.push({
                    name: fileName,
                    content: pdfResult.text.trim().slice(0, 50000),
                  });
                }
              } catch (e) {
                console.warn("PDF extraction error in server:", e);
              }
            }
          } else if (fileName.endsWith(".docx") || fileUrl.includes("wordprocessingml") || fileUrl.includes("vnd.openxmlformats")) {
            const match = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              try {
                const buffer = Buffer.from(match[2], "base64");
                const zip = await JSZip.loadAsync(buffer);
                const docXml = await zip.file("word/document.xml")?.async("text");
                if (docXml) {
                  const text = docXml
                    .replace(/<\/w:p>/g, "\n")
                    .replace(/<w:tab\/>/g, "\t")
                    .replace(/<[^>]+>/g, "")
                    .trim();
                  if (text) {
                    extractedDocumentTexts.push({ name: fileName, content: text });
                  }
                }
              } catch (e) {
                console.warn("DOCX extraction error in server:", e);
              }
            }
          } else if (
            fileUrl.startsWith("data:text/") ||
            fileUrl.startsWith("data:application/json") ||
            fileUrl.startsWith("data:application/xml") ||
            fileUrl.startsWith("data:text/markdown") ||
            fileUrl.startsWith("data:application/octet-stream") ||
            /\.(md|txt|json|csv|xml|yaml|yml|js|ts|py|sql|html|css|env)$/i.test(fileName)
          ) {
            const match = fileUrl.match(/^data:([^;]*);base64,(.+)$/);
            if (match) {
              try {
                const decoded = Buffer.from(match[2], "base64").toString("utf-8");
                if (decoded && decoded.trim()) {
                  extractedDocumentTexts.push({ name: fileName, content: decoded });
                }
              } catch {}
            }
          }
        }
      }
    };

    if (inputValues && typeof inputValues === "object") {
      for (const [_, val] of Object.entries(inputValues)) {
        await processUploadedItemAsync(val);
      }
    }

    // Construct user prompt with clean structured representation, omitting gigantic base64 strings
    let userPromptSection = "";
    if (fields && Array.isArray(fields) && inputValues) {
      userPromptSection = fields
        .map((f: any) => {
          const val = inputValues[f.id] !== undefined ? inputValues[f.id] : f.defaultValue;
          let displayVal = "";
          if (typeof val === "object" && val !== null) {
            const desc = (typeof val.description === "string" && val.description.trim())
              ? val.description.trim()
              : (typeof val.text === "string" && val.text.trim())
              ? val.text.trim()
              : (typeof val.content === "string" && val.content.trim())
              ? val.content.trim()
              : "";
            const filesList = Array.isArray(val.files) ? val.files : Array.isArray(val) ? val : [];

            if (desc && filesList.length > 0) {
              displayVal = `需求文字描述: "${desc}"\n[同时已附加 ${filesList.length} 个素材/文档文件: ${filesList.map((fileItem: any) => fileItem.name || '附件').join(", ")}]`;
            } else if (desc) {
              displayVal = desc;
            } else if (filesList.length > 0) {
              displayVal = `[已附加 ${filesList.length} 个素材/文档文件: ${filesList.map((fileItem: any) => fileItem.name || '附件').join(", ")}]`;
            } else {
              displayVal = JSON.stringify(val, null, 2);
            }
          } else if (
            f.type === "file" ||
            f.id === "photos" ||
            f.uploadPreset === "image" ||
            f.label?.includes("照片") ||
            f.label?.includes("素材图片")
          ) {
            const count = Array.isArray(val) ? val.length : val ? 1 : 0;
            displayVal = `[已上传 ${count} 个视觉素材/图片附件，已作为多模态视觉数据载入]`;
          } else {
            displayVal = String(val ?? "");
          }
          return `【${f.label || f.name} (${f.id})】:\n${displayVal}`;
        })
        .join("\n\n");
    } else if (inputValues) {
      userPromptSection = Object.entries(inputValues)
        .map(([k, v]) => {
          if (typeof v === "string" && (v.startsWith("data:image/") || v.startsWith("data:application/pdf"))) {
            return `【${k}】:\n[已提供多模态附件数据]`;
          }
          if (typeof v === "object" && v !== null) {
            const desc = (v as any).description || (v as any).text || "";
            const count = Array.isArray((v as any).files) ? (v as any).files.length : 0;
            if (desc && count > 0) {
              return `【${k}】:\n需求描述: ${desc}\n[附加 ${count} 个文件]`;
            }
            if (desc) return `【${k}】:\n${desc}`;
            if (count > 0) return `【${k}】:\n[已附加 ${count} 个文件]`;
          }
          return `【${k}】:\n${typeof v === "object" ? JSON.stringify(v, null, 2) : v}`;
        })
        .join("\n\n");
    }

    // Append decoded text document contents if available (up to 40,000 characters per document)
    if (extractedDocumentTexts.length > 0) {
      userPromptSection += "\n\n=== 已上传参考文档与大纲解析提取内容 (必须深度结合此部分真实材料生成) ===\n";
      extractedDocumentTexts.slice(0, 8).forEach((d) => {
        userPromptSection += `\n【文档附件: ${d.name}】:\n${d.content.slice(0, 40000)}\n`;
      });
    }

    // Replace {{variable}} template placeholders if present in systemInstruction
    let processedSystemInstruction = systemInstruction || "You are an expert AI assistant executing a specialized skill.";
    if (inputValues && typeof inputValues === "object") {
      for (const [key, value] of Object.entries(inputValues)) {
        if (typeof value === "string" && value.startsWith("data:")) continue;
        let valStr = "";
        if (typeof value === "object" && value !== null) {
          valStr = (value as any).description || (value as any).text || JSON.stringify(value);
        } else {
          valStr = String(value ?? "");
        }
        processedSystemInstruction = processedSystemInstruction.replace(
          new RegExp(`{{\\s*${key}\\s*}}`, "g"),
          valStr
        );
      }
    }

    // Extract explicit target page count if selected in inputValues
    let targetPageCount: number | null = null;
    if (inputValues && typeof inputValues === "object") {
      const pageVal =
        inputValues.duration_pages ||
        inputValues.page_count ||
        inputValues.slides_count ||
        inputValues.slide_count;
      if (pageVal) {
        const num = parseInt(String(pageVal).match(/\d+/)?.[0] || "", 10);
        if (!isNaN(num) && num > 0) {
          targetPageCount = num;
        }
      }
    }

    // Determine skill archetype dynamically for precise generation instructions
    const skillType = (skillRecord?.uiSchema?.outputConfig?.renderType || "").toLowerCase();
    const titleLower = (title || "").toLowerCase();
    const isPptSkill =
      skillType === "web-deck" ||
      skillType === "presentation" ||
      titleLower.includes("ppt") ||
      titleLower.includes("deck") ||
      (title || "").includes("演示文稿") ||
      (title || "").includes("幻灯片");
    const isSocialSkill =
      !isPptSkill &&
      (skillType === "social-cards" ||
        (title || "").includes("社交卡片") ||
        (title || "").includes("小红书"));
    const isPosterSkill =
      skillType === "poster" ||
      (title || "").includes("营造") ||
      ((title || "").includes("海报") && !(title || "").includes("卡片"));
    const isHtmlOrWebUiSkill =
      skillType === "html" ||
      skillType === "web-preview" ||
      (title || "").includes("Web") ||
      (title || "").includes("HTML") ||
      (title || "").includes("品牌风格") ||
      (title || "").includes("界面生成") ||
      (title || "").includes("Landing Page");

    // Add overriding directive to prevent confirmation loops, strictly prohibit conversational preambles
    processedSystemInstruction += `\n\n【最高优先级执行指令与交付规范】：
1. 【绝对禁止寒暄与开场白】：严禁输出任何“好的”、“当然”、“作为...专家”、“我将严格遵循您的指令”、“收到您的需求”、“根据您的输入”、“这是为您定制的”等任何形式的套话、开头自我介绍或过渡铺垫！直接输出核心交付内容！
2. 【严禁确认循环】：用户在前端已完整配置好所有参数并上传所有真实素材。严禁输出任何“确认风格”、“请确认”、“等待回复”、“未检测到输入”等套话！立即输出最终全部内容！`;

    if (isHtmlOrWebUiSkill) {
      processedSystemInstruction += `\n3. 【Web / UI 界面与 HTML 代码生成规范】：你必须输出一段结构完整、美观现代且可直接在浏览器沙箱中完美呈现的单文件 HTML 代码（必须使用 \`\`\`html ... \`\`\` 代码块包裹）。请利用 Tailwind CSS 工具类、Google Fonts 与 FontAwesome 图标，将用户提供的真实文案、卖点、数据指标与品牌风格有机融入精美的卡片、按钮、Hero 与布局中。在 HTML 代码块之后，可附带简明的设计语言说明与设计规范！`;
    } else if (isPptSkill) {
      processedSystemInstruction += `\n3. 【Web 幻灯片逐页生成规范】：请直接从第 1 页（例如 "### 01 封面与核心主张"）开始逐页展开完整的高密度事实内容与演讲者备忘录（Speaker Notes）。严禁输出全局元目录！`;
      if (targetPageCount) {
        processedSystemInstruction += `\n4. 【严格页面总数约束】：用户指定了页数规格为严格正好 ${targetPageCount} 页！你必须严格且仅生成正好 ${targetPageCount} 页（从第 1 页直到第 ${targetPageCount} 页），绝对不能多于或少于 ${targetPageCount} 页！`;
      }
    } else if (isSocialSkill) {
      processedSystemInstruction += `\n3. 【社交卡片套图规范】：请直接从第 1 页开始逐页展开完整卡片（封面大字卡、观点证据内页、末页 CheckList 清单）。严禁输出全局元目录！`;
      if (targetPageCount) {
        processedSystemInstruction += `\n4. 【严格页面总数约束】：用户指定了页数规格为严格正好 ${targetPageCount} 页！你必须严格且仅生成正好 ${targetPageCount} 页（从第 1 页直到第 ${targetPageCount} 页），绝对不能多于或少于 ${targetPageCount} 页！`;
      }
    }

    const fullPrompt = `请严格按照专业技能规范执行任务：
技能名称: ${title || "专用技能"}

--- 用户输入参数与真实业务素材 ---
${userPromptSection}

【执行要求与质量准则】：
1. 必须完全基于上述用户提供的真实输入文本、需求文字描述与文档附件内容（如 PRD 需求文档、研究报告、大纲材料、上传的素材图片等）进行深度提炼与高质量创作。
2. 严禁输出与用户输入及附件无关的虚构内容，严禁输出空洞无物的泛泛套话，严禁输出“未检测到输入内容”，严禁截断句子或输出半句话。
3. 【绝对禁止寒暄开场】：输出直接呈现交付内容，严禁任何“好的”、“当然”、“作为专家”等废话！
${
  isHtmlOrWebUiSkill
    ? `4. 【Web / UI 界面与 HTML 代码规范】：请输出高质量、生产级、自带完整视觉样式（使用 Tailwind CSS 类名或现代 CSS）的 HTML 界面代码块（使用 \`\`\`html ... \`\`\` 包裹），并在代码块后附上简明的设计规范和交互说明。确保生成的 HTML 在沙箱中直接可完整交互展示！`
    : isPptSkill
    ? `4. 【演示文稿 / PPT Deck 规范】：若执行 PPT/Deck 技能，请严格根据用户选择的页数（${
        targetPageCount ? `严格正好 ${targetPageCount} 页` : "如 8/16/24 页"
      }）以及视觉风格，逐页生成每一页的完整幻灯片内容，包含幻灯片编号与标题、核心论点、高密度事实依据与核心指标数据、演讲者模式备忘录（Speaker Notes）。`
    : isSocialSkill
    ? `4. 【社交卡片 / Social Card 规范】：若执行社交卡片技能，请严格按所选页数（${
        targetPageCount ? `严格正好 ${targetPageCount} 页` : "如 4/6/8 页"
      }）逐页输出封面大字卡、观点证据内页与末页行动清单。`
    : `4. 【专业交付】：输出结构严谨、排版清晰的交付成果，必要时提供代码块、结构化列表或对比分析。`
}
5. 必须输出完整、详尽、高质量的最终交付方案。`;

    // Prepare contents: multimodal if images/documents exist, otherwise plain text string
    const contents: any[] = [];
    if (multimodalParts.length > 0) {
      contents.push({
        parts: [
          ...multimodalParts.slice(0, 6), // Pass up to 6 attachments safely
          { text: fullPrompt },
        ],
      });
    } else {
      contents.push(fullPrompt);
    }

    const requestedModel = modelConfig?.model;
    const candidateModels = Array.from(
      new Set([
        requestedModel && requestedModel !== "gemini-3.8-flash" ? requestedModel : "gemini-2.5-flash-lite",
        "gemini-2.5-flash-lite",
        "gemini-flash-latest",
        "gemini-2.5-flash",
      ])
    ).filter(Boolean) as string[];

    let streamSuccess = false;
    let lastError: any = null;
    let accumulatedText = "";

    for (const modelToTry of candidateModels) {
      try {
        console.log(`Streaming skill execution with model: ${modelToTry}`);
        const streamResponse = await ai.models.generateContentStream({
          model: modelToTry,
          contents: contents,
          config: {
            systemInstruction: processedSystemInstruction,
            temperature: modelConfig?.temperature !== undefined ? modelConfig.temperature : 0.7,
          },
        });

        for await (const chunk of streamResponse) {
          const textChunk = chunk.text || "";
          if (textChunk) {
            accumulatedText += textChunk;
            res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
          }
        }

        streamSuccess = true;
        break;
      } catch (streamErr: any) {
        lastError = streamErr;
        console.warn(`Model ${modelToTry} stream failed (code: ${streamErr?.status || streamErr?.code}):`, streamErr?.message);
        if (accumulatedText.length > 50) {
          streamSuccess = true;
          break;
        }
        // Immediately try next candidate model
        continue;
      }
    }

    if (!streamSuccess && !accumulatedText) {
      const errorMsg = formatGeminiError(lastError);
      res.write(`data: ${JSON.stringify({ error: `执行失败: ${errorMsg}` })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("Execute skill error:", err);
    const formatted = formatGeminiError(err);
    if (!res.headersSent) {
      res.status(500).json({ error: formatted });
    } else {
      res.write(`data: ${JSON.stringify({ error: `执行异常: ${formatted}` })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  }
});

// 4. Direct API Proxy (when user explicitly selects external API/Webhook engine)
app.post("/api/skill/execute-api", async (req, res) => {
  try {
    const { endpoint, method = "POST", headers = {}, body, params = {} } = req.body;

    if (!endpoint || typeof endpoint !== "string") {
      res.status(400).json({ error: "缺少有效的 API 端点 URL" });
      return;
    }

    let url = endpoint;
    if (Object.keys(params).length > 0) {
      const urlObj = new URL(url);
      for (const [k, v] of Object.entries(params)) {
        urlObj.searchParams.append(k, String(v));
      }
      url = urlObj.toString();
    }

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (method.toUpperCase() !== "GET" && method.toUpperCase() !== "HEAD" && body) {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const apiResponse = await fetch(url, fetchOptions);
    const contentType = apiResponse.headers.get("content-type") || "";

    let responseData;
    if (contentType.includes("application/json")) {
      responseData = await apiResponse.json();
    } else {
      responseData = await apiResponse.text();
    }

    res.json({
      success: apiResponse.ok,
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      data: responseData,
    });
  } catch (err: any) {
    console.error("API proxy error:", err);
    res.status(500).json({ error: err.message || "调用外部 API 接口失败" });
  }
});

// 5. Generate AI Image / Poster using Gemini Image generation models
app.post("/api/generate-ai-image", async (req, res) => {
  try {
    const { prompt, base64Image, mimeType = "image/jpeg", aspectRatio = "3:4", model = "gemini-3.1-flash-image" } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "生图 Prompt 不能为空" });
      return;
    }

    const ai = getGeminiClient();

    // Prepare contents
    const parts: any[] = [];
    if (base64Image) {
      const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, "");
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || "image/jpeg",
        },
      });
    }
    parts.push({ text: prompt });

    const candidateModels = [
      model || "gemini-3.1-flash-image",
      "gemini-3.1-flash-lite-image",
    ];

    let generatedImageUrl = "";
    let lastError = null;

    for (const m of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio || "3:4",
            },
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const imgMime = part.inlineData.mimeType || "image/png";
              generatedImageUrl = `data:${imgMime};base64,${part.inlineData.data}`;
              break;
            }
          }
        }

        if (generatedImageUrl) break;
      } catch (err: any) {
        console.warn(`Model ${m} image generation warning:`, err?.message);
        lastError = err;
      }
    }

    if (generatedImageUrl) {
      res.json({ success: true, imageUrl: generatedImageUrl });
    } else {
      res.status(200).json({
        success: false,
        error: lastError?.message || "当前模型服务未返回有效图片，建议使用提示词在 Midjourney/即梦 中生成",
      });
    }
  } catch (err: any) {
    console.error("Generate image endpoint error:", err);
    res.status(500).json({ success: false, error: err?.message || "生成图片失败" });
  }
});

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SkillUI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
