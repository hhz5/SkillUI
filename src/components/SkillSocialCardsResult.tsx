import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Layers,
  Layout,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Maximize2,
  Grid3X3,
  Columns2,
  FileText,
  Code,
  Sparkles,
  Smartphone,
  Video,
  Share2,
  Bookmark,
  CheckCircle2,
  Palette,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CardItem {
  pageNumber: number;
  type: 'cover' | 'content' | 'summary';
  title: string;
  subtitle?: string;
  tag?: string;
  bullets?: string[];
  highlight?: string;
  evidenceType?: 'screenshot' | 'photo' | 'quote' | 'checklist';
  summaryChecklist?: string[];
  imageIndex?: number;
}

interface SkillSocialCardsResultProps {
  rawOutput: string;
  formValues: Record<string, any>;
  title: string;
}

// Preset Themes according to Guizang Visual Spec
const THEME_PALETTES = {
  ikb_blue: {
    name: '克莱因蓝 (IKB Blue)',
    type: 'swiss',
    bg: '#002FA7',
    textColor: '#FFFFFF',
    accentColor: '#D6FF00',
    cardBg: '#FFFFFF',
    cardText: '#0A0A0B',
    mutedText: '#64748B',
    border: '#002FA7',
    badgeBg: '#D6FF00',
    badgeText: '#002FA7',
  },
  lemon_yellow: {
    name: '荧光柠檬黄 (Lemon)',
    type: 'swiss',
    bg: '#D6FF00',
    textColor: '#0A0A0B',
    accentColor: '#002FA7',
    cardBg: '#0A0A0B',
    cardText: '#FFFFFF',
    mutedText: '#94A3B8',
    border: '#D6FF00',
    badgeBg: '#002FA7',
    badgeText: '#FFFFFF',
  },
  safety_orange: {
    name: '国际安全橙 (Orange)',
    type: 'swiss',
    bg: '#FF5500',
    textColor: '#FFFFFF',
    accentColor: '#0A0A0B',
    cardBg: '#FFFFFF',
    cardText: '#0F172A',
    mutedText: '#64748B',
    border: '#FF5500',
    badgeBg: '#FF5500',
    badgeText: '#FFFFFF',
  },
  ink_classic: {
    name: '玄墨经典 (Ink Classic)',
    type: 'editorial',
    bg: '#F3F0E8',
    textColor: '#0A0A0B',
    accentColor: '#111111',
    cardBg: '#EBE6DA',
    cardText: '#0A0A0B',
    mutedText: '#68625A',
    border: 'rgba(10,10,11,0.22)',
    badgeBg: '#111111',
    badgeText: '#F3F0E8',
  },
  indigo_porcelain: {
    name: '青花霁蓝 (Indigo Porcelain)',
    type: 'editorial',
    bg: '#F2F4F5',
    textColor: '#0A1F3D',
    accentColor: '#315D93',
    cardBg: '#E5EBEF',
    cardText: '#0A1F3D',
    mutedText: '#5F6D78',
    border: 'rgba(10,31,61,0.20)',
    badgeBg: '#315D93',
    badgeText: '#FFFFFF',
  },
  forest_ink: {
    name: '山野苍林 (Forest Ink)',
    type: 'editorial',
    bg: '#F5F1E8',
    textColor: '#16251B',
    accentColor: '#2D4A34',
    cardBg: '#E8DFCF',
    cardText: '#16251B',
    mutedText: '#5D665D',
    border: 'rgba(22,37,27,0.20)',
    badgeBg: '#2D4A34',
    badgeText: '#F5F1E8',
  },
  kraft_paper: {
    name: '大地牛皮纸 (Kraft Paper)',
    type: 'editorial',
    bg: '#ECE6D8',
    textColor: '#292524',
    accentColor: '#78350F',
    cardBg: '#E2DAC9',
    cardText: '#292524',
    mutedText: '#78716C',
    border: 'rgba(41,37,36,0.25)',
    badgeBg: '#78350F',
    badgeText: '#ECE6D8',
  },
};

type ThemeKey = keyof typeof THEME_PALETTES;

export const SkillSocialCardsResult: React.FC<SkillSocialCardsResultProps> = ({
  rawOutput,
  formValues,
  title,
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'wechat' | 'livephoto' | 'plan' | 'code'>('cards');
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>(
    (formValues.color_theme as ThemeKey) && THEME_PALETTES[formValues.color_theme as ThemeKey]
      ? (formValues.color_theme as ThemeKey)
      : 'ikb_blue'
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isGridView, setIsGridView] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPlan, setCopiedPlan] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Extract uploaded image assets if provided
  const uploadedImages: string[] = useMemo(() => {
    const images: string[] = [];
    const collectFromItem = (item: any) => {
      if (!item) return;
      if (typeof item === 'string') {
        if (item.startsWith('data:image/') || item.startsWith('http')) {
          images.push(item);
        }
      } else if (typeof item === 'object') {
        if (typeof item.dataUrl === 'string' && (item.dataUrl.startsWith('data:image/') || item.dataUrl.startsWith('http'))) {
          images.push(item.dataUrl);
        } else if (typeof item.url === 'string') {
          images.push(item.url);
        }
        if (Array.isArray(item.files)) {
          item.files.forEach(collectFromItem);
        }
      }
    };

    ['media_assets', 'photos', 'images', 'source_text'].forEach((k) => {
      const val = formValues[k];
      if (Array.isArray(val)) {
        val.forEach(collectFromItem);
      } else if (val) {
        collectFromItem(val);
      }
    });

    return Array.from(new Set(images.filter(Boolean)));
  }, [formValues]);

  // Extract uploaded video asset if provided
  const uploadedVideo: string | null = useMemo(() => {
    const raw = formValues.video_asset || formValues.video;
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw) && raw.length > 0) return typeof raw[0] === 'string' ? raw[0] : raw[0]?.dataUrl || null;
    return null;
  }, [formValues]);

  // Parse structured card deck from output
  const cards: CardItem[] = useMemo(() => {
    const rawSource = formValues.source_text;
    const sourceText: string = typeof rawSource === 'string'
      ? rawSource
      : typeof rawSource?.text === 'string'
      ? rawSource.text
      : Array.isArray(rawSource?.files) && rawSource.files[0]?.textContent
      ? rawSource.files[0].textContent
      : typeof rawSource?.content === 'string'
      ? rawSource.content
      : '';

    const hasRawOutput = typeof rawOutput === 'string' && rawOutput.trim().length > 0;
    const hasSourceText = sourceText.trim().length > 0;

    // If both LLM output and user text are empty, do not fabricate fake cards
    if (!hasRawOutput && !hasSourceText) {
      return [];
    }

    const mainTitle = (typeof formValues.title === 'string' && formValues.title.trim())
      ? formValues.title.trim()
      : '';
    const totalPages = parseInt(String(formValues.page_count || formValues.duration_pages || '4').match(/\d+/)?.[0] || '4', 10) || 4;

    // Pre-clean rawOutput: strip conversational preambles and meta-proposal titles
    let cleanRaw = (rawOutput || '').trim();
    // 1. Remove opening conversational chatter
    cleanRaw = cleanRaw
      .replace(
        /^(?:好的|当然|收到|作为[^\n]+总监|作为[^\n]+专家|很高兴[^\n]+|根据[^\n]+需求|为您定制[^\n]+)[，,：:\s][\s\S]*?(?=(?:^|\n)#{1,4}\s+|(?:^|\n)(?:卡片\s*\d+|Page\s*\d+|P0?\d|第\s*\d+\s*页|【(?:封面|内页|总结|复盘|论点)】))/i,
        ''
      )
      .trim();

    // 2. Remove meta proposal headings like "### 社交卡片方案 (共4页)" or "## 方案说明"
    cleanRaw = cleanRaw.replace(
      /(?:^|\n)#{1,4}\s*(?:社交卡片方案|卡片制作方案|设计方案|幻灯片方案|方案大纲|内容大纲)\s*[\(（]?[^\n]*[\)）]?\s*(?=\n)/gi,
      '\n'
    );

    // Try parsing JSON block if LLM returned structured JSON
    const jsonMatch = cleanRaw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed.cards) && parsed.cards.length > 0) {
          const clampedCards = parsed.cards.slice(0, totalPages);
          return clampedCards.map((c: any, idx: number) => ({
            pageNumber: idx + 1,
            type: idx === 0 ? 'cover' : idx === clampedCards.length - 1 ? 'summary' : 'content',
            title: c.title || `第 ${idx + 1} 页核心论点`,
            subtitle: c.subtitle || c.subTitle || '',
            tag: idx === 0 ? 'COVER' : idx === clampedCards.length - 1 ? 'SUMMARY' : `P0${idx + 1}`,
            bullets: Array.isArray(c.bullets) ? c.bullets : Array.isArray(c.points) ? c.points : [],
            highlight: c.highlight || c.quote || '',
            evidenceType: c.evidenceType || (idx % 2 === 1 ? 'screenshot' : 'photo'),
            summaryChecklist: c.summaryChecklist || c.checklist || [],
            imageIndex: idx % (uploadedImages.length || 1),
          }));
        }
      } catch (e) {
        // Fallback to text parsing
      }
    }

    // Multi-strategy Markdown / Section parser from AI cleanRaw
    if (cleanRaw.length > 0) {
      // 1. First attempt: Split by Markdown H1/H2/H3 or explicit Card markers or numbered cards
      let sections = cleanRaw
        .split(/(?=(?:^|\n)#{1,4}\s+|(?:^|\n)(?:卡片\s*\d+|Page\s*\d+|P0?\d|第\s*\d+\s*页|【(?:封面|内页|总结|复盘|论点)】|\d+[\.、]\s*[\*#]?))/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 15);

      // If sections is too small, try splitting by double line breaks with headings or bold starts
      if (sections.length < 2) {
        sections = cleanRaw
          .split(/\n\s*\n/)
          .map((s) => s.trim())
          .filter((s) => s.length > 20);
      }

      if (sections.length > 0) {
        const parsedDeck: CardItem[] = [];
        sections.forEach((section, index) => {
          const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
          if (lines.length === 0) return;

          const firstLine = lines[0] || '';

          // Filter out conversational lines or meta headings
          if (
            /^(?:好的|当然|作为.*?总监|作为.*?专家|收到需求|为您生成|遵循您的指令)/i.test(firstLine) ||
            /^(?:社交卡片方案|设计方案|方案大纲|内容提要)/i.test(firstLine)
          ) {
            return;
          }

          const isCover = parsedDeck.length === 0 || /封面|Cover|P1|第\s*1\s*页|主旨/i.test(firstLine);
          const isSummary = /总结|复盘|清单|Checklist|末页|最终页|行动/i.test(firstLine);

          // Find title
          let cardTitle = '';
          const headingMatch = firstLine.match(/^(?:#+\s*|\d+[\.、]\s*|【.*?】\s*|卡片\s*\d+[:：]?\s*)(.+)$/);
          if (headingMatch) {
            cardTitle = headingMatch[1].replace(/[*_#`【】]/g, '').trim();
          } else {
            const boldMatch = section.match(/\*\*([^\*\n]+)\*\*/);
            cardTitle = boldMatch ? boldMatch[1].trim() : lines[0].replace(/[*_#`【】]/g, '').slice(0, 40);
          }

          // Filter out conversational cardTitle
          if (/^(?:好的|当然|作为.*?总监|作为.*?专家|社交卡片方案)/i.test(cardTitle)) {
            return;
          }

          // Find subtitle
          let subtitle = '';
          const subMatch = section.match(/(?:副标题|Subtitle|Slogan|定位)[:：]\s*([^\n\r]+)/i);
          if (subMatch) {
            subtitle = subMatch[1].replace(/[*_`]/g, '').trim();
          }

          // Extract bullets
          const bullets: string[] = [];
          lines.forEach((line) => {
            if (line.match(/^[-*•]\s+/) || line.match(/^\d+[\.、]\s+/)) {
              const cleanBullet = line.replace(/^[-*•\d.、]+\s*/, '').replace(/[*_`]/g, '').trim();
              if (cleanBullet && !cleanBullet.startsWith('#') && cleanBullet !== cardTitle) {
                bullets.push(cleanBullet);
              }
            }
          });

          // If no formal bullets found, take non-heading body lines as bullets
          if (bullets.length === 0) {
            lines.slice(1).forEach((line) => {
              if (!line.startsWith('#') && line.length > 4 && line !== cardTitle) {
                bullets.push(line.replace(/[*_`]/g, '').trim());
              }
            });
          }

          // Extract quote/highlight
          const quoteMatch = section.match(/>\s*([^\n\r]+)/);
          const highlight = quoteMatch ? quoteMatch[1].replace(/[*_`]/g, '').trim() : '';

          parsedDeck.push({
            pageNumber: parsedDeck.length + 1,
            type: isCover ? 'cover' : isSummary ? 'summary' : 'content',
            title: cardTitle || (isCover ? (mainTitle || '核心观点与论述') : `核心论点 0${parsedDeck.length + 1}`),
            subtitle: subtitle,
            tag: isCover ? 'COVER' : isSummary ? 'SUMMARY' : `P0${parsedDeck.length + 1}`,
            bullets: bullets.slice(0, 5),
            highlight: highlight,
            summaryChecklist: isSummary && bullets.length > 0 ? bullets : undefined,
            imageIndex: parsedDeck.length % (uploadedImages.length || 1),
          });
        });

        if (parsedDeck.length > 0) {
          // Strictly clamp to totalPages
          let finalDeck = parsedDeck;
          if (finalDeck.length > totalPages) {
            const cover = finalDeck[0];
            const summary = finalDeck[finalDeck.length - 1];
            const pool = finalDeck.slice(1, finalDeck.length - 1);
            const neededMiddle = totalPages - 2;
            const selectedMiddle: CardItem[] = [];
            if (neededMiddle > 0 && pool.length > 0) {
              const step = pool.length / neededMiddle;
              for (let i = 0; i < neededMiddle; i++) {
                selectedMiddle.push(pool[Math.floor(i * step)]);
              }
            }
            finalDeck = [cover, ...selectedMiddle, ...(totalPages > 1 ? [summary] : [])].filter(Boolean);
          }

          return finalDeck.map((c, idx) => ({
            ...c,
            pageNumber: idx + 1,
            type: idx === 0 ? 'cover' : idx === finalDeck.length - 1 ? 'summary' : 'content',
            tag: idx === 0 ? 'COVER' : idx === finalDeck.length - 1 ? 'SUMMARY' : `P0${idx + 1}`,
          }));
        }
      }

      // If section split didn't catch, parse cleanRaw line by line into cards
      const paragraphs = cleanRaw.split('\n\n').map(p => p.trim()).filter(Boolean);
      if (paragraphs.length > 0) {
        return paragraphs.slice(0, totalPages).map((para, idx) => {
          const lines = para.split('\n').map(l => l.trim()).filter(Boolean);
          const title = lines[0]?.replace(/^[#*`\-0-9.、\s]+/, '').slice(0, 40) || `观点卡片 0${idx + 1}`;
          const bullets = lines.slice(1).map(l => l.replace(/^[-*•0-9.、\s]+/, '').trim()).filter(Boolean);
          return {
            pageNumber: idx + 1,
            type: idx === 0 ? 'cover' : idx === Math.min(totalPages, paragraphs.length) - 1 ? 'summary' : 'content',
            title,
            subtitle: '',
            tag: idx === 0 ? 'COVER' : idx === Math.min(totalPages, paragraphs.length) - 1 ? 'SUMMARY' : `P0${idx + 1}`,
            bullets: bullets.length > 0 ? bullets.slice(0, 4) : [para.slice(0, 100)],
            imageIndex: idx % (uploadedImages.length || 1),
          };
        });
      }
    }

    // Fallback: If no markdown parsed but user provided sourceText
    if (hasSourceText) {
      const defaultDeck: CardItem[] = [];
      const cleanLines = sourceText
        .split('\n')
        .map((l: string) => l.trim().replace(/^[#\s*•\-]+/, ''))
        .filter((l: string) => l.length > 1);

      if (cleanLines.length > 0) {
        const firstSentence = cleanLines[0] || '核心观点拆解';
        const meaningfulBullets = cleanLines.slice(1).filter((l) => !l.endsWith('：') && !l.endsWith(':') && l.length > 3);

        defaultDeck.push({
          pageNumber: 1,
          type: 'cover',
          title: mainTitle || firstSentence,
          subtitle: '',
          tag: 'COVER',
          bullets: meaningfulBullets.slice(0, 3),
          highlight: meaningfulBullets[0] || '',
          imageIndex: 0,
        });

        const pointsPerCard = 2;
        const remainingPoints = meaningfulBullets.slice(3);
        const contentCardCount = Math.min(
          Math.max(1, totalPages - 2),
          Math.max(1, Math.ceil(remainingPoints.length / pointsPerCard))
        );

        for (let i = 0; i < contentCardCount; i++) {
          const idx = i + 2;
          const cardBullets = remainingPoints.slice(i * pointsPerCard, (i + 1) * pointsPerCard);
          const cardTitle = cardBullets[0] || cleanLines[idx] || `论点分析 0${i + 1}`;
          defaultDeck.push({
            pageNumber: idx,
            type: 'content',
            title: cardTitle,
            subtitle: '',
            tag: `P0${idx}`,
            bullets: cardBullets.length > 0 ? cardBullets : [cardTitle],
            highlight: '',
            imageIndex: (i + 1) % (uploadedImages.length || 1),
          });
        }

        if (totalPages >= 3 && cleanLines.length > 2) {
          defaultDeck.push({
            pageNumber: defaultDeck.length + 1,
            type: 'summary',
            title: '核心复盘与行动要点',
            subtitle: '',
            tag: 'SUMMARY',
            bullets: meaningfulBullets.slice(0, 4),
            summaryChecklist: meaningfulBullets.slice(0, 4),
            highlight: '',
            imageIndex: 0,
          });
        }
        return defaultDeck;
      }
    }

    return [];
  }, [rawOutput, formValues, title, uploadedImages]);

  const currentCard = cards[currentCardIndex] || cards[0];
  const theme = THEME_PALETTES[selectedTheme] || THEME_PALETTES.ikb_blue;

  // WeChat Cover Titles
  const wechatTitles = useMemo(() => {
    const baseTitle = currentCard?.title || formValues.title || title || '核心洞察与实践指南';
    return {
      main21x9: baseTitle,
      square1x1: baseTitle.length > 12 ? baseTitle.slice(0, 10) + '...' : baseTitle,
      subtitle: '深度拆解与完整框架梳理 · 点击阅读全文',
      author: formValues.author || 'Guizang Studio',
    };
  }, [currentCard, formValues, title]);

  // High-Resolution 1080x1440 Canvas Card Renderer
  const renderCardToCanvas = (card: CardItem, targetCanvas: HTMLCanvasElement): Promise<void> => {
    return new Promise((resolve) => {
      const ctx = targetCanvas.getContext('2d');
      if (!ctx) return resolve();

      const width = 1080;
      const height = 1440;
      targetCanvas.width = width;
      targetCanvas.height = height;

      // Helper to draw multiline wrapped text cleanly
      const drawWrappedText = (
        text: string,
        x: number,
        startY: number,
        maxWidth: number,
        lineHeight: number,
        maxLines: number = 3
      ): number => {
        let currentY = startY;
        let line = '';
        let lineCount = 0;

        for (let n = 0; n < text.length; n++) {
          const testLine = line + text[n];
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            lineCount++;
            if (lineCount >= maxLines) {
              ctx.fillText(line.slice(0, -1) + '...', x, currentY);
              return currentY + lineHeight;
            }
            ctx.fillText(line, x, currentY);
            line = text[n];
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        if (line) {
          ctx.fillText(line, x, currentY);
          currentY += lineHeight;
        }
        return currentY;
      };

      // 1. Draw Background
      if (theme.type === 'swiss') {
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, width, height);

        // Add subtle paper noise / border
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(36, 36, width - 72, height - 72);
      }

      // 2. Inner Container (Safe Area: Margin 72px)
      const margin = 72;
      const contentWidth = width - margin * 2;

      // Header Tag Strip
      ctx.fillStyle = theme.type === 'swiss' ? theme.textColor : theme.mutedText;
      ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const tagText = `${card.tag?.toUpperCase() || 'GUIZANG SPEC'} // PAGE 0${card.pageNumber} OF 0${cards.length}`;
      ctx.fillText(tagText, margin, margin + 36);

      // Top Accent Line
      ctx.strokeStyle = theme.type === 'swiss' ? theme.accentColor : theme.border;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(margin, margin + 56);
      ctx.lineTo(margin + 240, margin + 56);
      ctx.stroke();

      // Card Main Title (Large, Bold, High Contrast)
      ctx.fillStyle = theme.type === 'swiss' ? theme.textColor : theme.cardText;
      ctx.font = '900 52px "PingFang SC", "Noto Sans SC", -apple-system, sans-serif';

      // Title Word Wrap
      const titleWords = card.title;
      let line = '';
      let y = margin + 130;
      const maxTitleWidth = contentWidth - 40;

      for (let n = 0; n < titleWords.length; n++) {
        const testLine = line + titleWords[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTitleWidth && n > 0) {
          ctx.fillText(line, margin, y);
          line = titleWords[n];
          y += 66;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, margin, y);

      // Subtitle / Eyebrow
      if (card.subtitle) {
        y += 40;
        ctx.fillStyle = theme.type === 'swiss' ? theme.accentColor : theme.mutedText;
        ctx.font = '600 26px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(card.subtitle.toUpperCase(), margin, y);
      }

      // Middle Container: Photo/Screenshot or Solid Anchor Box
      y += 44;
      const boxHeight = 480;
      const boxWidth = contentWidth;

      const finishDrawingContent = () => {
        // Draw Bullets & Highlights in Bottom Area
        let bulletY = y + boxHeight + 50;
        ctx.fillStyle = theme.type === 'swiss' ? theme.textColor : theme.cardText;

        if (card.type === 'summary' && card.summaryChecklist) {
          ctx.font = '700 28px "PingFang SC", sans-serif';
          ctx.fillText('✓ ACTIONABLE CHECKLIST 行动自查', margin, bulletY);
          bulletY += 46;

          card.summaryChecklist.slice(0, 4).forEach((item) => {
            ctx.fillStyle = theme.type === 'swiss' ? theme.accentColor : theme.badgeBg;
            ctx.fillRect(margin, bulletY - 20, 22, 22);

            ctx.fillStyle = theme.type === 'swiss' ? theme.textColor : theme.cardText;
            ctx.font = '500 26px "PingFang SC", sans-serif';
            bulletY = drawWrappedText(item, margin + 36, bulletY, contentWidth - 40, 36, 2) + 12;
          });
        } else if (card.bullets && card.bullets.length > 0) {
          card.bullets.slice(0, 3).forEach((bullet) => {
            ctx.fillStyle = theme.type === 'swiss' ? theme.accentColor : theme.badgeBg;
            ctx.beginPath();
            ctx.arc(margin + 10, bulletY - 8, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = theme.type === 'swiss' ? theme.textColor : theme.cardText;
            ctx.font = '500 26px "PingFang SC", sans-serif';
            bulletY = drawWrappedText(bullet, margin + 32, bulletY, contentWidth - 36, 36, 2) + 12;
          });
        }

        // Highlight Callout Banner
        if (card.highlight) {
          bulletY += 8;
          ctx.fillStyle = theme.type === 'swiss' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)';
          ctx.fillRect(margin, bulletY - 26, contentWidth, 68);

          ctx.fillStyle = theme.type === 'swiss' ? theme.accentColor : theme.cardText;
          ctx.font = 'italic 700 24px "PingFang SC", sans-serif';
          drawWrappedText(`“${card.highlight}”`, margin + 20, bulletY + 14, contentWidth - 40, 32, 2);
        }

        // Footer Safe Margin
        const footerY = height - margin - 10;
        ctx.strokeStyle = theme.type === 'swiss' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(margin, footerY - 24);
        ctx.lineTo(width - margin, footerY - 24);
        ctx.stroke();

        ctx.fillStyle = theme.type === 'swiss' ? 'rgba(255,255,255,0.7)' : theme.mutedText;
        ctx.font = '600 20px -apple-system, monospace';
        ctx.fillText('GUIZANG SOCIAL CARD ENGINE // 1080×1440 SAFE AREA', margin, footerY);
        ctx.fillText(`PAGE 0${card.pageNumber} / 0${cards.length}`, width - margin - 140, footerY);

        resolve();
      };

      // Check if we have an image to render
      const imgSrc = uploadedImages[card.imageIndex || 0];
      if (imgSrc) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Draw Frame
          ctx.fillStyle = theme.type === 'swiss' ? '#0A0A0B' : '#FFFFFF';
          ctx.fillRect(margin, y, boxWidth, boxHeight);
          ctx.strokeStyle = theme.type === 'swiss' ? theme.accentColor : theme.border;
          ctx.lineWidth = 3;
          ctx.strokeRect(margin, y, boxWidth, boxHeight);

          // Draw Image contained with aspect ratio
          const hRatio = boxWidth / img.width;
          const vRatio = boxHeight / img.height;
          const ratio = Math.max(hRatio, vRatio);
          const centerShiftX = (boxWidth - img.width * ratio) / 2;
          const centerShiftY = (boxHeight - img.height * ratio) / 2;

          ctx.save();
          ctx.beginPath();
          ctx.rect(margin + 4, y + 4, boxWidth - 8, boxHeight - 8);
          ctx.clip();
          ctx.drawImage(
            img,
            0,
            0,
            img.width,
            img.height,
            margin + 4 + centerShiftX,
            y + 4 + centerShiftY,
            img.width * ratio,
            img.height * ratio
          );
          ctx.restore();

          finishDrawingContent();
        };
        img.onerror = () => {
          drawPlaceholderBox();
          finishDrawingContent();
        };
        img.src = imgSrc;
      } else {
        drawPlaceholderBox();
        finishDrawingContent();
      }

      function drawPlaceholderBox() {
        ctx.fillStyle = theme.type === 'swiss' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
        ctx.fillRect(margin, y, boxWidth, boxHeight);
        ctx.strokeStyle = theme.type === 'swiss' ? theme.accentColor : theme.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(margin, y, boxWidth, boxHeight);

        // Tech Cross Grid / Visual Mark
        ctx.strokeStyle = theme.type === 'swiss' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.moveTo(margin + 30, y + 30);
        ctx.lineTo(margin + boxWidth - 30, y + boxHeight - 30);
        ctx.moveTo(margin + boxWidth - 30, y + 30);
        ctx.lineTo(margin + 30, y + boxHeight - 30);
        ctx.stroke();

        ctx.fillStyle = theme.type === 'swiss' ? theme.accentColor : theme.cardText;
        ctx.font = '700 24px -apple-system, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EVIDENCE LAYER // REAL ARTIFACT / PHOTO', width / 2, y + boxHeight / 2);
        ctx.textAlign = 'start';
      }
    });
  };

  // Download Single Card PNG
  const handleDownloadCard = async (index: number) => {
    const card = cards[index];
    if (!card) return;
    setIsExporting(true);

    try {
      const tempCanvas = document.createElement('canvas');
      await renderCardToCanvas(card, tempCanvas);

      const dataUrl = tempCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `social-card-page-${card.pageNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export card failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Download All Cards Batch
  const handleDownloadAllCards = async () => {
    setIsExporting(true);
    try {
      for (let i = 0; i < cards.length; i++) {
        await handleDownloadCard(i);
        // Small delay to prevent browser download throttling
        await new Promise((r) => setTimeout(r, 400));
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyCardImage = async () => {
    if (!currentCard) return;
    setIsExporting(true);
    try {
      const tempCanvas = document.createElement('canvas');
      await renderCardToCanvas(currentCard, tempCanvas);

      tempCanvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ 'image/png': blob }),
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2000);
        }
      });
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Generate HTML/CSS Production Code
  const productionCodeSnippet = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title} - Guizang Social Cards</title>
  <style>
    :root {
      --bg: ${theme.bg};
      --text: ${theme.textColor};
      --accent: ${theme.accentColor};
      --card-bg: ${theme.cardBg};
      --card-text: ${theme.cardText};
    }
    body {
      margin: 0;
      padding: 40px;
      background: #1e293b;
      font-family: -apple-system, "PingFang SC", "Segoe UI", sans-serif;
      display: flex;
      flex-wrap: wrap;
      gap: 32px;
      justify-content: center;
    }
    .social-card {
      width: 1080px;
      height: 1440px;
      box-sizing: border-box;
      background: var(--bg);
      color: var(--text);
      padding: 72px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    .card-header {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      border-bottom: 4px solid var(--accent);
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .card-title {
      font-size: 56px;
      font-weight: 900;
      line-height: 1.25;
      margin-bottom: 16px;
    }
    .card-subtitle {
      font-size: 28px;
      color: var(--accent);
      font-weight: 600;
      margin-bottom: 32px;
    }
    .evidence-box {
      width: 100%;
      height: 520px;
      background: rgba(255,255,255,0.06);
      border: 3px solid var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 36px;
    }
    .bullet-list {
      list-style: none;
      padding: 0;
      margin: 0 0 32px 0;
    }
    .bullet-item {
      font-size: 28px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .bullet-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--accent);
    }
    .quote-box {
      padding: 16px 24px;
      background: rgba(255,255,255,0.1);
      border-left: 6px solid var(--accent);
      font-style: italic;
      font-size: 26px;
    }
    .card-footer {
      font-size: 20px;
      border-top: 1px solid rgba(255,255,255,0.2);
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      opacity: 0.8;
    }
  </style>
</head>
<body>
${cards
  .map(
    (c) => `  <div class="social-card">
    <div>
      <div class="card-header">${c.tag || 'GUIZANG SPEC'} // PAGE 0${c.pageNumber}</div>
      <div class="card-title">${c.title}</div>
      ${c.subtitle ? `<div class="card-subtitle">${c.subtitle}</div>` : ''}
      <div class="evidence-box">[ EVIDENCE SLOT ]</div>
    </div>
    <div>
      <ul class="bullet-list">
        ${(c.bullets || []).map((b) => `<li class="bullet-item"><span class="bullet-dot"></span>${b}</li>`).join('\n        ')}
      </ul>
      ${c.highlight ? `<div class="quote-box">“${c.highlight}”</div>` : ''}
    </div>
    <div class="card-footer">
      <span>GUIZANG SOCIAL CARD SYSTEM // 1080×1440</span>
      <span>PAGE 0${c.pageNumber} / 0${cards.length}</span>
    </div>
  </div>`
  )
  .join('\n')}
</body>
</html>`;
  }, [cards, theme, title]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-2xl overflow-hidden border border-slate-800">
      {/* Hidden high-res canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Top Header & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
              <span>{title || 'Guizang 社交卡片工坊'}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {cards.length} 页套卡
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              小红书 3:4 轮播 · 微信 21:9+1:1 封面对 · 实况动态卡
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'cards'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>3:4 轮播卡片</span>
          </button>
          <button
            onClick={() => setActiveTab('wechat')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'wechat'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>微信封面对</span>
          </button>
          <button
            onClick={() => setActiveTab('livephoto')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'livephoto'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>实况照片</span>
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'plan'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>分卡策划</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'code'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>HTML代码</span>
          </button>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Theme Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value as ThemeKey)}
              className="bg-transparent text-xs text-slate-200 border-none outline-none cursor-pointer"
            >
              {Object.entries(THEME_PALETTES).map(([k, v]) => (
                <option key={k} value={k} className="bg-slate-900 text-slate-100">
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Download All PNGs */}
          <button
            onClick={handleDownloadAllCards}
            disabled={isExporting}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
            title="一键高清导出整套卡片 (1080×1440 PNG)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? '导出中...' : '下载整套 PNG'}</span>
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
        {/* Tab 1: 3:4 Social Cards Deck */}
        {activeTab === 'cards' && (
          cards.length === 0 ? (
            <div className="w-full max-w-lg my-12 p-8 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-200 mb-1">待生成图文卡片</h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                请在左侧配置卡片风格与主题，上传附件材料或输入需求描述，然后点击「执行 Skill 获得结果」，系统将为您生成高品质图文卡片。
              </p>
            </div>
          ) : (
          <div className="w-full max-w-4xl flex flex-col items-center space-y-4">
            {/* View Mode & Page Toolbar */}
            <div className="w-full flex items-center justify-between px-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsGridView(false)}
                  className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                    !isGridView
                      ? 'bg-slate-800 border-slate-700 text-slate-200 font-bold'
                      : 'border-transparent hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>单张精读</span>
                </button>
                <button
                  onClick={() => setIsGridView(true)}
                  className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                    isGridView
                      ? 'bg-slate-800 border-slate-700 text-slate-200 font-bold'
                      : 'border-transparent hover:text-slate-200'
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>九宫全览 ({cards.length}P)</span>
                </button>
              </div>

              {!isGridView && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentCardIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentCardIndex === 0}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono font-bold text-slate-200 px-1">
                      {currentCardIndex + 1} / {cards.length}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentCardIndex((prev) => Math.min(cards.length - 1, prev + 1))
                      }
                      disabled={currentCardIndex === cards.length - 1}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDownloadCard(currentCardIndex)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs flex items-center gap-1 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出当前张 (1080×1440)</span>
                  </button>

                  <button
                    onClick={handleCopyCardImage}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs flex items-center gap-1 transition-all"
                  >
                    {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedImage ? '已复制' : '复制图'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* View Mode: Single Card */}
            {!isGridView && currentCard ? (
              <div className="flex flex-col items-center space-y-4">
                {/* 3:4 Responsive Container */}
                <div
                  className="relative w-[360px] sm:w-[420px] aspect-[3/4] rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden transition-all duration-300 select-none border"
                  style={{
                    backgroundColor: theme.bg,
                    color: theme.textColor,
                    borderColor: theme.border,
                  }}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between border-b pb-2 mb-3" style={{ borderColor: theme.accentColor }}>
                      <div className="text-[11px] font-mono font-bold tracking-wider" style={{ color: theme.type === 'swiss' ? theme.accentColor : theme.mutedText }}>
                        {currentCard.tag ? `${currentCard.tag} // ` : ''}P0{currentCard.pageNumber}
                      </div>
                      <div className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}>
                        {currentCard.type === 'cover' ? '封面' : currentCard.type === 'summary' ? '复盘' : '内页'}
                      </div>
                    </div>

                    <h2
                      className="text-xl sm:text-2xl font-black leading-tight mb-1.5"
                      style={{ color: theme.type === 'swiss' ? theme.textColor : theme.cardText }}
                    >
                      {currentCard.title}
                    </h2>

                    {currentCard.subtitle && (
                      <p
                        className="text-xs font-semibold tracking-wide uppercase mb-3"
                        style={{ color: theme.accentColor }}
                      >
                        {currentCard.subtitle}
                      </p>
                    )}

                    {/* Evidence Box / Photo Slot */}
                    <div
                      className="w-full aspect-[16/9] rounded-xl overflow-hidden border my-2 flex items-center justify-center relative shadow-inner"
                      style={{
                        borderColor: theme.accentColor,
                        backgroundColor: theme.type === 'swiss' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
                      }}
                    >
                      {uploadedImages[currentCard.imageIndex || 0] ? (
                        <img
                          src={uploadedImages[currentCard.imageIndex || 0]}
                          alt="Evidence"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-3">
                          <Layout className="w-6 h-6 mb-1 opacity-70" style={{ color: theme.accentColor }} />
                          <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: theme.accentColor }}>
                            素材/截图位置
                          </span>
                          <span className="text-[9px] opacity-60">左侧可上传产品截图或实拍图替换此框</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Content & Bullets */}
                  <div className="space-y-2 mt-2">
                    {currentCard.type === 'summary' && currentCard.summaryChecklist ? (
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold flex items-center gap-1" style={{ color: theme.accentColor }}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>行动自查清单</span>
                        </div>
                        {currentCard.summaryChecklist.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] leading-snug">
                            <span className="w-3.5 h-3.5 rounded mt-0.5 flex-shrink-0 flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: theme.accentColor, color: theme.bg }}>
                              ✓
                            </span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-1.5">
                        {currentCard.bullets?.slice(0, 3).map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px] leading-snug">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: theme.accentColor }} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Highlight Box */}
                    {currentCard.highlight && (
                      <div
                        className="p-2 rounded-lg text-[10px] font-medium italic border-l-2 leading-relaxed"
                        style={{
                          backgroundColor: theme.type === 'swiss' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                          borderColor: theme.accentColor,
                          color: theme.type === 'swiss' ? theme.accentColor : theme.cardText,
                        }}
                      >
                        “{currentCard.highlight}”
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-2 border-t flex items-center justify-between text-[9px] font-mono opacity-70 mt-2" style={{ borderColor: theme.type === 'swiss' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }}>
                    <span>1080×1440</span>
                    <span>PAGE 0{currentCard.pageNumber} / 0{cards.length}</span>
                  </div>
                </div>

                {/* Dot Pagination */}
                <div className="flex items-center gap-1.5">
                  {cards.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentCardIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        currentCardIndex === idx
                          ? 'w-6 bg-blue-500'
                          : 'w-2 bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* View Mode: Grid Contact Sheet */
              <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
                {cards.map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentCardIndex(idx);
                      setIsGridView(false);
                    }}
                    className="aspect-[3/4] rounded-xl p-3 flex flex-col justify-between cursor-pointer hover:scale-105 transition-all shadow-lg border relative group overflow-hidden"
                    style={{
                      backgroundColor: theme.bg,
                      color: theme.textColor,
                      borderColor: currentCardIndex === idx ? theme.accentColor : theme.border,
                    }}
                  >
                    <div>
                      <div className="text-[9px] font-mono font-bold" style={{ color: theme.accentColor }}>
                        PAGE 0{card.pageNumber}
                      </div>
                      <div className="text-xs font-black line-clamp-2 mt-1 leading-snug">
                        {card.title}
                      </div>
                    </div>

                    <div className="w-full aspect-[16/9] rounded bg-black/20 my-1 overflow-hidden">
                      {uploadedImages[card.imageIndex || 0] ? (
                        <img
                          src={uploadedImages[card.imageIndex || 0]}
                          alt="thumb"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] opacity-60 font-mono">
                          SHOT
                        </div>
                      )}
                    </div>

                    <div className="text-[9px] line-clamp-2 opacity-80 leading-tight">
                      {card.bullets?.[0] || card.highlight}
                    </div>

                    <div className="text-[8px] font-mono opacity-60 pt-1 border-t border-white/10 flex justify-between">
                      <span>{card.type.toUpperCase()}</span>
                      <span>0{card.pageNumber}/0{cards.length}</span>
                    </div>

                    <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-xs text-white backdrop-blur-[1px] transition-opacity">
                      点击查看
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )
        )}

        {/* Tab 2: WeChat 21:9 + 1:1 Cover Pair */}
        {activeTab === 'wechat' && (
          <div className="w-full max-w-3xl space-y-6">
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">微信公众号双封面套件</h4>
                  <p className="text-xs text-slate-400">
                    同屏联动校验 21:9 横向主封面 (900×383) 与 1:1 正方形分享头图 (500×500)
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  WECHAT SPEC 2026
                </span>
              </div>

              {/* 21:9 Header Cover */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold">21:9 横版大图封面 (900×383)</span>
                  <span className="text-[11px] font-mono">用于公众号信息流顶部大图推送</span>
                </div>
                <div
                  className="w-full aspect-[21/9] rounded-xl p-6 flex flex-col justify-between shadow-xl border relative overflow-hidden"
                  style={{
                    backgroundColor: theme.bg,
                    color: theme.textColor,
                    borderColor: theme.border,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: theme.accentColor }}>
                      SPECIAL COVER // {wechatTitles.author}
                    </span>
                    <span className="text-xs font-mono opacity-60">21:9 MAIN HEADER</span>
                  </div>

                  <div className="space-y-1 my-auto">
                    <h2 className="text-2xl sm:text-3xl font-black leading-tight" style={{ color: theme.type === 'swiss' ? theme.textColor : theme.cardText }}>
                      {wechatTitles.main21x9}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold opacity-90" style={{ color: theme.accentColor }}>
                      {wechatTitles.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono opacity-70 border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                    <span>GUIZANG WECHAT COVER PAIR SYSTEM</span>
                    <span>900 × 383 PX</span>
                  </div>
                </div>
              </div>

              {/* 1:1 Square Share Card */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold">1:1 正方形分享卡片 (500×500)</span>
                  <span className="text-[11px] font-mono">用于微信单聊、群聊转发与朋友圈小缩略图</span>
                </div>
                <div className="flex items-center gap-6">
                  <div
                    className="w-44 h-44 rounded-xl p-4 flex flex-col justify-between shadow-xl border relative overflow-hidden flex-shrink-0"
                    style={{
                      backgroundColor: theme.bg,
                      color: theme.textColor,
                      borderColor: theme.border,
                    }}
                  >
                    <div className="text-[9px] font-mono font-bold" style={{ color: theme.accentColor }}>
                      1:1 SQUARE
                    </div>
                    <div className="text-sm font-black leading-snug my-auto" style={{ color: theme.type === 'swiss' ? theme.textColor : theme.cardText }}>
                      {wechatTitles.square1x1}
                    </div>
                    <div className="text-[8px] font-mono opacity-70">
                      500 × 500 PX
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400">
                    <p className="font-bold text-slate-200">排版设计规范验证：</p>
                    <p className="leading-relaxed">
                      • 21:9 宽屏封面避免在四周 15% 放置关键大字，确保在微信折叠栏中不被裁切。
                    </p>
                    <p className="leading-relaxed">
                      • 1:1 正方形分享头图将主标题提炼至 12 字内极简钩子，确保在聊天列表极小尺寸下第一眼可辨。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Live Photo Motion Card */}
        {activeTab === 'livephoto' && (
          <div className="w-full max-w-2xl space-y-4">
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-rose-500" />
                    <span>实况照片 (Live Photo) 动态卡交付</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    小红书 5 秒 / 微信 3 秒实况动效卡，可由视频素材或 AI 动效模型渲染交付
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  LIVE PHOTO
                </span>
              </div>

              {uploadedVideo ? (
                <div className="w-full aspect-[3/4] max-w-[340px] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-700 relative bg-black">
                  <video
                    src={uploadedVideo}
                    controls
                    loop
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 px-2 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    LIVE
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs text-slate-300">
                  <p className="font-bold text-slate-100">Live Photo 实况制作规范：</p>
                  <ul className="space-y-1.5 text-slate-400">
                    <li>• <strong>时长控制：</strong> 小红书实况照片建议不超过 5s；微信公众号实况建议控制在 3s。</li>
                    <li>• <strong>格式打包：</strong> iPhone AirDrop 测试需打包为 .pvt 格式，避免松散的 JPG/MOV 分开识别。</li>
                    <li>• <strong>素材建议：</strong> 可在左侧表单上传 3-5 秒屏幕录制或动态短视频，即刻生成带有 LIVE 标识的动态卡片。</li>
                  </ul>

                  <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] text-blue-400 space-y-1 border border-slate-800">
                    <div className="text-slate-500 font-sans">推荐视频生成提示词 (Runway/Kling):</div>
                    <p>
                      "Subtle slow camera tilt-down on modern minimalist swiss design card, smooth 60fps motion, crisp text lighting, studio aesthetic."
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Content Plan & Copywriting */}
        {activeTab === 'plan' && (
          <div className="w-full max-w-3xl space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-slate-300">分卡策划脚本与文案排期</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(rawOutput);
                  setCopiedPlan(true);
                  setTimeout(() => setCopiedPlan(false), 2000);
                }}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-all"
              >
                {copiedPlan ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPlan ? '已复制策划文案' : '复制全套策划'}</span>
              </button>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-4 font-sans leading-relaxed">
              <div className="prose prose-invert prose-sm max-w-none prose-headings:font-bold prose-headings:text-slate-100 prose-p:text-slate-300 prose-li:text-slate-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{rawOutput}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Production HTML/CSS Code */}
        {activeTab === 'code' && (
          <div className="w-full max-w-3xl space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-slate-300">独立单文件 HTML/CSS 渲染源码</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(productionCodeSnippet);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-all"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '已复制代码' : '复制代码'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[520px]">
              {productionCodeSnippet}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
