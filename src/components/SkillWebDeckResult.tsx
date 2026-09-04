import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Download,
  Copy,
  Check,
  LayoutGrid,
  Monitor,
  User,
  Sparkles,
  FileCode,
  Palette,
  Clock,
  ArrowRight,
  Compass,
  FileText,
  Volume2,
  HelpCircle,
  Presentation,
} from 'lucide-react';

export interface SlideData {
  id: string;
  slideNumber: number;
  chapter?: string;
  title: string;
  subtitle?: string;
  layout?: 'cover' | 'split' | 'data-hero' | 'grid' | 'quote' | 'closing' | 'default';
  headline?: string;
  points?: string[];
  kpis?: Array<{ value: string; label: string; unit?: string }>;
  quote?: { text: string; author?: string };
  rawHtml?: string;
  speakerNotes?: {
    purpose?: string;
    talk?: string;
    transition?: string;
    minutes?: number;
    cue?: string;
  };
}

interface SkillWebDeckResultProps {
  rawOutput: string;
  formValues?: Record<string, any>;
  title?: string;
}

export const SkillWebDeckResult: React.FC<SkillWebDeckResultProps> = ({
  rawOutput,
  formValues = {},
  title = '网页演示文稿',
}) => {
  // Determine style and theme
  const initialStyle =
    formValues.deck_style === 'style_b_swiss' ||
    (typeof rawOutput === 'string' && rawOutput.toLowerCase().includes('swiss'))
      ? 'swiss'
      : 'magazine';

  const [deckStyle, setDeckStyle] = useState<'magazine' | 'swiss'>(initialStyle);
  const [themeColor, setThemeColor] = useState<string>(
    formValues.theme_color || (initialStyle === 'swiss' ? 'ikb_blue' : 'ink_classic')
  );

  // Active slide state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPresenterMode, setShowPresenterMode] = useState(false);
  const [showGridOverview, setShowGridOverview] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'notes'>('preview');
  const [copied, setCopied] = useState(false);

  // Presenter timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Parse slides from raw output
  const slides: SlideData[] = useMemo(() => {
    if (!rawOutput) return [];

    const parsed: SlideData[] = [];

    // Attempt 1: Check if rawOutput contains explicit HTML slide sections (<section class="slide" ...>)
    const sectionMatches = Array.from(
      rawOutput.matchAll(/<section[^>]*class=["'][^"']*slide[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi)
    );

    if (sectionMatches.length > 0) {
      sectionMatches.forEach((match, idx) => {
        const sectionContent = match[1];
        const sectionTag = match[0];

        // Extract data-slide-id
        const idMatch = sectionTag.match(/data-slide-id=["']([^"']+)["']/i);
        const slideId = idMatch ? idMatch[1] : `slide-${idx + 1}`;

        // Extract title
        const hMatch = sectionContent.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
        const slideTitle = hMatch
          ? hMatch[1].replace(/<[^>]+>/g, '').trim()
          : `幻灯片 ${idx + 1}`;

        // Extract subtitle / chapter / kicker
        const kickerMatch = sectionContent.match(/class=["'][^"']*(?:kicker|t-cat|chapter|meta-row)[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i);
        const chapter = kickerMatch ? kickerMatch[1].replace(/<[^>]+>/g, '').trim() : undefined;

        // Extract notes
        let speakerNotes: SlideData['speakerNotes'] = undefined;
        const notesMatch = sectionContent.match(/<aside[^>]*class=["'][^"']*notes[^"']*["'][^>]*>([\s\S]*?)<\/aside>/i);
        if (notesMatch) {
          speakerNotes = {
            talk: notesMatch[1].replace(/<[^>]+>/g, '').trim(),
          };
        }

        // Layout heuristics
        let layout: SlideData['layout'] = 'default';
        if (idx === 0) layout = 'cover';
        else if (sectionContent.includes('kpi') || sectionContent.includes('stat-card')) layout = 'data-hero';
        else if (sectionContent.includes('grid-') || sectionContent.includes('cards')) layout = 'grid';

        parsed.push({
          id: slideId,
          slideNumber: idx + 1,
          chapter: chapter || (idx === 0 ? 'START' : `SECTION 0${Math.min(3, Math.ceil((idx + 1) / 4))}`),
          title: slideTitle,
          layout,
          rawHtml: sectionContent,
          speakerNotes,
        });
      });
    }

    // Attempt 2: Fallback to markdown slides separated by "---", "### 01", "## 第X页", "Slide X", etc.
    if (parsed.length === 0) {
      let cleanRaw = (rawOutput || '').trim();
      // Remove opening chatter
      cleanRaw = cleanRaw
        .replace(
          /^(?:好的|当然|收到|作为[^\n]+总监|作为[^\n]+专家|很高兴[^\n]+|根据[^\n]+需求|为您定制[^\n]+)[，,：:\s][\s\S]*?(?=(?:^|\n)#{1,3}\s+(?:\d+|Slide|第\s*\d+\s*页|【|\bP0?\d\b)|(?:^|\n)(?:---|___|\*\*\*)\n?)/i,
          ''
        )
        .trim();

      // Remove meta proposal headings
      cleanRaw = cleanRaw.replace(
        /(?:^|\n)#{1,3}\s*(?:演示文稿方案|PPT方案|幻灯片方案|设计方案|方案大纲|内容提要)\s*[\(（]?[^\n]*[\)）]?\s*(?=\n)/gi,
        '\n'
      );

      let rawBlocks = cleanRaw
        .split(/(?=(?:^|\n)#{1,3}\s+(?:\d+|Slide|第\s*\d+\s*页|【|\bP0?\d\b)|(?:^|\n)(?:---|___|\*\*\*)\n?)/i)
        .map((b) => b.trim())
        .filter((b) => b.length > 15);

      if (rawBlocks.length < 2) {
        rawBlocks = cleanRaw.split(/\n(?:---|___|\*\*\*)\n/g)
          .map((b) => b.trim())
          .filter(Boolean);
      }

      if (rawBlocks.length < 2) {
        rawBlocks = cleanRaw.split(/(?=(?:^|\n)#{1,3}\s+)/m)
          .map((b) => b.trim())
          .filter((b) => b.length > 20);
      }

      rawBlocks.forEach((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return;

        // Skip conversational blocks
        if (/^(?:好的|当然|作为.*?总监|作为.*?专家|收到需求|为您生成|演示文稿方案|方案大纲)/i.test(trimmed)) {
          return;
        }

        // Extract title
        const titleMatch = trimmed.match(/^#+\s*(.+)$/m) || trimmed.match(/^(?:Slide|第\s*\d+\s*页|[0-9]+[\.、])\s*(.+)$/m);
        let slideTitle = titleMatch ? titleMatch[1].replace(/[*_#`【】]/g, '').trim() : `幻灯片 ${parsed.length + 1}`;

        if (/^(?:好的|当然|作为.*?总监|作为.*?专家|演示文稿方案)/i.test(slideTitle)) {
          return;
        }

        // Extract subtitle
        let subtitle = '';
        const subMatch = trimmed.match(/(?:副标题|Subtitle|主张|定位)[:：]\s*([^\n\r]+)/i);
        if (subMatch) {
          subtitle = subMatch[1].replace(/[*_`]/g, '').trim();
        }

        // Extract points
        const lines = trimmed.split('\n');
        const points: string[] = [];
        let talkNotes = '';
        let purpose = '';
        let transition = '';

        lines.forEach((line) => {
          const l = line.trim();
          if (l.startsWith('- ') || l.startsWith('* ') || /^\d+[\.、]\s/.test(l)) {
            const cleanPoint = l.replace(/^[-*]\s+|\d+[\.、]\s+/, '').replace(/[*_`]/g, '').trim();
            if (cleanPoint && cleanPoint !== slideTitle) {
              points.push(cleanPoint);
            }
          } else if (l.includes('讲稿') || l.includes('台词') || l.includes('Talk:') || l.includes('备注:') || l.includes('Speaker')) {
            talkNotes += l.replace(/.*(?:讲稿|台词|Talk:|备注:|Speaker(?:\s*Notes)?[:：])\s*/i, '') + ' ';
          } else if (l.includes('目的') || l.includes('Purpose:')) {
            purpose = l.replace(/.*(?:目的|Purpose:)\s*/i, '').trim();
          } else if (l.includes('转场') || l.includes('Transition:')) {
            transition = l.replace(/.*(?:转场|Transition:)\s*/i, '').trim();
          }
        });

        // Heuristic KPIs (only match clean numeric percentages/metrics, avoid matching CSS/rgba values)
        const kpis: Array<{ value: string; label: string }> = [];
        const cleanForKpi = trimmed.replace(/<[^>]+>/g, ' ').replace(/rgba?\([^)]+\)/g, ' ');
        const kpiMatches = Array.from(cleanForKpi.matchAll(/(?:^|[\s,，。])([0-9]+(?:\.[0-9]+)?%?|\+[0-9]+[kKmM%]?)\s*[:：\-]\s*([^\n\r,，。<>{}#]{2,20})/g));
        kpiMatches.slice(0, 3).forEach((km) => {
          const val = km[1].trim();
          const lbl = km[2].trim();
          if (val && lbl && !lbl.includes(';') && !lbl.includes('px')) {
            kpis.push({ value: val, label: lbl });
          }
        });

        parsed.push({
          id: `slide-${parsed.length + 1}`,
          slideNumber: parsed.length + 1,
          chapter: parsed.length === 0 ? 'START' : `SECTION 0${Math.min(4, Math.ceil((parsed.length + 1) / 3))}`,
          title: slideTitle,
          subtitle: subtitle || undefined,
          layout: parsed.length === 0 ? 'cover' : kpis.length > 0 ? 'data-hero' : points.length > 3 ? 'grid' : 'split',
          points: points.length > 0 ? points : undefined,
          kpis: kpis.length > 0 ? kpis : undefined,
          speakerNotes: {
            purpose: purpose || (parsed.length === 0 ? '确立演讲主张，引发听众共鸣' : '阐述核心论据与支撑事实'),
            talk: talkNotes.trim() || '配合当前页面的视觉重点，向听众强调此阶段的关键突破与落地思考。',
            transition: transition || '引导听众思考下一步的挑战与行动方案。',
            minutes: 2,
          },
        });
      });
    }

    // Fallback: If no HTML/markdown slides extracted, check if user provided topic or outline
    if (parsed.length === 0) {
      const rawTopic = formValues.topic_or_outline;
      const topicText: string = typeof rawTopic === 'string'
        ? rawTopic
        : typeof rawTopic?.text === 'string'
        ? rawTopic.text
        : Array.isArray(rawTopic?.files) && rawTopic.files[0]?.textContent
        ? rawTopic.files[0].textContent
        : typeof rawTopic?.content === 'string'
        ? rawTopic.content
        : '';

      const cleanTopic = topicText.trim();
      if (!cleanTopic) {
        return [];
      }

      const lines = cleanTopic.split('\n').map((l) => l.trim().replace(/^[#\s\-*•]+/, '')).filter(Boolean);
      const mainTitle = lines[0] || '演示文稿';
      const bulletLines = lines.slice(1);

      // Slide 1: Cover
      parsed.push({
        id: 'slide-1',
        slideNumber: 1,
        chapter: 'P01 · COVER',
        title: mainTitle,
        subtitle: bulletLines[0] || '',
        layout: 'cover',
        speakerNotes: {
          purpose: '开篇点明核心主题',
          talk: `本次分享的主题是《${mainTitle}》。`,
          transition: '接下来进入核心论述。',
          minutes: 2,
        },
      });

      // Additional slides based on user input
      if (bulletLines.length > 0) {
        const chunkSize = 3;
        for (let i = 0; i < bulletLines.length; i += chunkSize) {
          const chunk = bulletLines.slice(i, i + chunkSize);
          const slideIdx = parsed.length + 1;
          parsed.push({
            id: `slide-${slideIdx}`,
            slideNumber: slideIdx,
            chapter: `P0${slideIdx}`,
            title: chunk[0] || `核心要点 ${slideIdx - 1}`,
            layout: 'split',
            points: chunk,
            speakerNotes: {
              purpose: '展开当前要点与论据',
              talk: chunk.join('；'),
              transition: '进入下一个要点。',
              minutes: 2,
            },
          });
        }
      }
    }

    // Strict Target Slide Count Clamping
    const targetCount =
      parseInt(
        String(formValues.duration_pages || formValues.slides_count || formValues.page_count || '16').match(/\d+/)?.[0] || '16',
        10
      ) || 16;

    if (parsed.length > 0) {
      let finalSlides = parsed;
      if (finalSlides.length > targetCount) {
        const cover = finalSlides[0];
        const last = finalSlides[finalSlides.length - 1];
        const middle = finalSlides.slice(1, finalSlides.length - 1);
        const neededMiddle = targetCount - 2;
        const sampledMiddle: SlideData[] = [];
        if (neededMiddle > 0 && middle.length > 0) {
          const step = middle.length / neededMiddle;
          for (let i = 0; i < neededMiddle; i++) {
            sampledMiddle.push(middle[Math.floor(i * step)]);
          }
        }
        finalSlides = [cover, ...sampledMiddle, ...(targetCount > 1 ? [last] : [])].filter(Boolean);
      }

      return finalSlides.map((s, idx) => ({
        ...s,
        id: `slide-${idx + 1}`,
        slideNumber: idx + 1,
        chapter:
          idx === 0
            ? 'P01 · COVER'
            : idx === finalSlides.length - 1
            ? `P${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1} · CONCLUSION`
            : `SECTION 0${Math.min(4, Math.ceil((idx + 1) / Math.ceil(targetCount / 4)))}`,
      }));
    }

    return parsed;
  }, [rawOutput, formValues]);

  const currentSlide = slides[currentSlideIndex] || slides[0];
  const totalSlides = slides.length;

  // Key navigation bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowPresenterMode((prev) => !prev);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === 'Escape') {
        setShowGridOverview((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides]);

  // Autoplay timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSlideIndex((prev) => {
          if (prev >= totalSlides - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSlides]);

  // Presentation clock
  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Generate complete, self-contained standalone HTML presentation
  const generateStandaloneHtml = () => {
    const isSwiss = deckStyle === 'swiss';
    const accentHex =
      themeColor === 'ikb_blue'
        ? '#002FA7'
        : themeColor === 'lemon_yellow'
        ? '#D6FF00'
        : themeColor === 'safety_orange'
        ? '#FF5500'
        : themeColor === 'forest_ink'
        ? '#244230'
        : themeColor === 'indigo_porcelain'
        ? '#1C3B5E'
        : themeColor === 'kraft_paper'
        ? '#C29B38'
        : '#121316';

    const bgHex = isSwiss ? '#090A0F' : '#F9F8F5';
    const textHex = isSwiss ? '#FFFFFF' : '#1A1A1A';
    const subTextHex = isSwiss ? '#94A3B8' : '#57534E';
    const cardBgHex = isSwiss ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
    const borderHex = isSwiss ? 'rgba(255,255,255,0.1)' : '#E7E5E4';

    const slidesHtml = slides
      .map((s, idx) => {
        return `
    <section class="slide ${idx === 0 ? 'active' : ''}" data-slide-id="${s.id}">
      <div class="slide-chrome">
        <span class="slide-kicker">${s.chapter || 'GUZANG DECK'}</span>
        <span class="slide-counter">${String(idx + 1).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}</span>
      </div>
      <div class="slide-body">
        <h1 class="slide-title">${s.title}</h1>
        ${s.subtitle ? `<p class="slide-subtitle">${s.subtitle}</p>` : ''}
        
        ${
          s.kpis && s.kpis.length > 0
            ? `<div class="kpi-grid">
                ${s.kpis
                  .map(
                    (k) => `
                  <div class="kpi-card">
                    <div class="kpi-val">${k.value}</div>
                    <div class="kpi-lbl">${k.label}</div>
                  </div>`
                  )
                  .join('')}
              </div>`
            : ''
        }

        ${
          s.points && s.points.length > 0
            ? `<div class="points-grid">
                ${s.points
                  .map(
                    (pt, pidx) => `
                  <div class="point-item">
                    <span class="point-idx">0${pidx + 1}</span>
                    <span class="point-txt">${pt}</span>
                  </div>`
                  )
                  .join('')}
              </div>`
            : ''
        }
      </div>
      <aside class="slide-notes" style="display:none;">
        <div class="note-purpose">${s.speakerNotes?.purpose || ''}</div>
        <div class="note-talk">${s.speakerNotes?.talk || ''}</div>
        <div class="note-transition">${s.speakerNotes?.transition || ''}</div>
      </aside>
    </section>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} · Guizang Web PPT</title>
  <style>
    :root {
      --accent: ${accentHex};
      --bg: ${bgHex};
      --text: ${textHex};
      --subtext: ${subTextHex};
      --card-bg: ${cardBgHex};
      --border: ${borderHex};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: ${
        isSwiss
          ? 'system-ui, -apple-system, "Inter", "Helvetica Neue", "Noto Sans SC", sans-serif'
          : '"Noto Serif SC", "Playfair Display", "Songti SC", serif'
      };
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      user-select: none;
    }
    .deck-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .slide-stage {
      width: 100%;
      height: 100%;
      max-width: 177.78vh; /* 16:9 aspect */
      max-height: 56.25vw;
      position: relative;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      padding: 4vw 6vw;
    }
    .slide {
      position: absolute;
      inset: 0;
      padding: 4vw 6vw;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.35s ease, transform 0.35s ease;
      transform: translateX(20px);
    }
    .slide.active {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(0);
    }
    .slide-chrome {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9vw;
      font-family: monospace;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--subtext);
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.5vw;
    }
    .slide-kicker { color: var(--accent); font-weight: bold; }
    .slide-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 2vw 0;
    }
    .slide-title {
      font-size: 3.2vw;
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 1.5vw;
      color: var(--text);
    }
    .slide-subtitle {
      font-size: 1.4vw;
      color: var(--subtext);
      line-height: 1.5;
      margin-bottom: 2.5vw;
      max-width: 80%;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2vw;
      margin-top: 2vw;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 2vw;
      border-radius: 8px;
    }
    .kpi-val {
      font-size: 3.8vw;
      font-weight: 900;
      font-family: monospace;
      color: var(--accent);
      line-height: 1;
    }
    .kpi-lbl {
      font-size: 1vw;
      color: var(--subtext);
      margin-top: 0.8vw;
    }
    .points-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5vw;
      margin-top: 1.5vw;
    }
    .point-item {
      display: flex;
      align-items: flex-start;
      gap: 1vw;
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 1.5vw;
      border-radius: 6px;
    }
    .point-idx {
      font-family: monospace;
      font-size: 1.1vw;
      color: var(--accent);
      font-weight: bold;
    }
    .point-txt {
      font-size: 1.15vw;
      line-height: 1.5;
    }
    .deck-controls {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(12px);
      padding: 8px 16px;
      border-radius: 30px;
      color: white;
      font-family: monospace;
      font-size: 13px;
      z-index: 1000;
    }
    .ctrl-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 14px;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .ctrl-btn:hover { background: rgba(255,255,255,0.2); }
    /* Presenter Overlay */
    #presenter-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(10,10,12,0.95);
      z-index: 9999;
      color: white;
      padding: 30px;
      font-family: system-ui, sans-serif;
    }
    #presenter-modal.open { display: flex; flex-direction: column; }
    .presenter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.15);
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .presenter-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      flex: 1;
    }
    .presenter-box {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 24px;
      display: flex;
      flex-direction: column;
    }
    .presenter-box h3 { font-size: 14px; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px; }
    .note-talk-text { font-size: 18px; line-height: 1.6; color: #e2e8f0; flex: 1; }
  </style>
</head>
<body>
  <div class="deck-container">
    <div class="slide-stage">
      ${slidesHtml}
    </div>
  </div>

  <div class="deck-controls">
    <button class="ctrl-btn" onclick="prevSlide()">←</button>
    <span id="deck-progress">01 / ${String(totalSlides).padStart(2, '0')}</span>
    <button class="ctrl-btn" onclick="nextSlide()">→</button>
    <button class="ctrl-btn" onclick="togglePresenter()">P 讲稿</button>
    <button class="ctrl-btn" onclick="toggleFullscreen()">全屏</button>
  </div>

  <div id="presenter-modal">
    <div class="presenter-header">
      <h2>演讲者模式 (Presenter View)</h2>
      <div style="font-family:monospace;font-size:20px;color:var(--accent);" id="timer-display">00:00</div>
      <button class="ctrl-btn" onclick="togglePresenter()" style="border:1px solid #666;">关闭 (ESC / P)</button>
    </div>
    <div class="presenter-grid">
      <div class="presenter-box">
        <h3>当前页信息 & 目的</h3>
        <h2 id="p-slide-title" style="margin-bottom:12px;font-size:22px;"></h2>
        <div id="p-slide-purpose" style="color:#94a3b8;margin-bottom:20px;font-size:15px;"></div>
        <h3>下一页预见 (Next Slide)</h3>
        <div id="p-next-title" style="color:var(--accent);font-size:18px;font-weight:bold;"></div>
      </div>
      <div class="presenter-box">
        <h3>台词讲稿 (Speaker Talk Notes)</h3>
        <div class="note-talk-text" id="p-slide-talk"></div>
        <h3 style="margin-top:20px;">转场提示</h3>
        <div id="p-slide-trans" style="color:#38bdf8;font-size:15px;"></div>
      </div>
    </div>
  </div>

  <script>
    let currentIdx = 0;
    const slides = document.querySelectorAll('.slide');
    const total = slides.length;
    let timerSec = 0;
    setInterval(() => {
      timerSec++;
      const m = Math.floor(timerSec / 60).toString().padStart(2, '0');
      const s = (timerSec % 60).toString().padStart(2, '0');
      const tEl = document.getElementById('timer-display');
      if (tEl) tEl.innerText = m + ':' + s;
    }, 1000);

    function updateDeck() {
      slides.forEach((s, idx) => {
        if (idx === currentIdx) s.classList.add('active');
        else s.classList.remove('active');
      });
      const pEl = document.getElementById('deck-progress');
      if (pEl) pEl.innerText = String(currentIdx + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');

      // Update presenter modal
      const curSlide = slides[currentIdx];
      const nextSlide = slides[currentIdx + 1];
      if (curSlide) {
        document.getElementById('p-slide-title').innerText = curSlide.querySelector('.slide-title')?.innerText || '';
        document.getElementById('p-slide-purpose').innerText = curSlide.querySelector('.note-purpose')?.innerText || '';
        document.getElementById('p-slide-talk').innerText = curSlide.querySelector('.note-talk')?.innerText || '';
        document.getElementById('p-slide-trans').innerText = curSlide.querySelector('.note-transition')?.innerText || '';
      }
      if (nextSlide) {
        document.getElementById('p-next-title').innerText = '下一页: ' + (nextSlide.querySelector('.slide-title')?.innerText || '');
      } else {
        document.getElementById('p-next-title').innerText = '这是最后一页 (End of Deck)';
      }
    }

    function nextSlide() {
      if (currentIdx < total - 1) { currentIdx++; updateDeck(); }
    }
    function prevSlide() {
      if (currentIdx > 0) { currentIdx--; updateDeck(); }
    }
    function togglePresenter() {
      const m = document.getElementById('presenter-modal');
      m.classList.toggle('open');
    }
    function toggleFullscreen() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
      else document.exitFullscreen().catch(()=>{});
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') nextSlide();
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevSlide();
      else if (e.key.toLowerCase() === 'p') togglePresenter();
      else if (e.key.toLowerCase() === 'f') toggleFullscreen();
    });

    updateDeck();
  </script>
</body>
</html>`;
  };

  const handleDownloadHtml = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_Guizang_PPT.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    const html = generateStandaloneHtml();
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Accent styling values
  const isSwiss = deckStyle === 'swiss';
  const accentColor =
    themeColor === 'ikb_blue'
      ? '#002FA7'
      : themeColor === 'lemon_yellow'
      ? '#D6FF00'
      : themeColor === 'safety_orange'
      ? '#FF5500'
      : themeColor === 'forest_ink'
      ? '#244230'
      : themeColor === 'indigo_porcelain'
      ? '#1C3B5E'
      : themeColor === 'kraft_paper'
      ? '#C29B38'
      : '#0F172A';

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col rounded-2xl border transition-colors ${
        isSwiss
          ? 'bg-slate-950 border-slate-800 text-slate-100'
          : 'bg-stone-50 border-stone-200 text-stone-900'
      }`}
    >
      {/* 1. Header Toolbar */}
      <div
        className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
          isSwiss ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-white/80'
        }`}
      >
        {/* Left: Title & Badge */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white shadow-xs"
            style={{ backgroundColor: accentColor }}
          >
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm truncate max-w-[200px] sm:max-w-xs">
                {title}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                  isSwiss
                    ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                    : 'bg-amber-100/80 text-amber-800 border border-amber-200'
                }`}
              >
                {isSwiss ? 'SWISS STYLE · 瑞士风' : 'MAGAZINE · 电子杂志'}
              </span>
            </div>
            <p className="text-[11px] opacity-60">
              单文件 HTML 网页 PPT · 共 {totalSlides} 页 · 支持键盘 ← → 翻页
            </p>
          </div>
        </div>

        {/* Center: Style & Theme Switches */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
          <button
            type="button"
            onClick={() => setDeckStyle('magazine')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              deckStyle === 'magazine'
                ? 'bg-white shadow-xs text-stone-900 font-bold'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            杂志风
          </button>
          <button
            type="button"
            onClick={() => setDeckStyle('swiss')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              deckStyle === 'swiss'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            瑞士风
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Grid Overview Button */}
          <button
            type="button"
            onClick={() => setShowGridOverview((v) => !v)}
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
              showGridOverview
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : isSwiss
                ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-700'
            }`}
            title="查看所有幻灯片缩略图 (ESC)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">大纲总览</span>
          </button>

          {/* Presenter Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowPresenterMode((v) => !v);
              if (!isTimerRunning) setIsTimerRunning(true);
            }}
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
              showPresenterMode
                ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                : isSwiss
                ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-700'
            }`}
            title="切换演讲者双屏讲稿模式 (快捷键 P)"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">演讲者模式 (P)</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              isSwiss
                ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-700'
            }`}
            title="全屏演示 (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Standalone HTML Download */}
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="一键导出为独立的单文件 HTML 网页幻灯片，可在任何设备离线播放"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载单文件 HTML</span>
          </button>
        </div>
      </div>

      {/* 2. Main Presentation Stage (16:9 Aspect Ratio) */}
      {slides.length === 0 ? (
        <div className="w-full max-w-lg my-16 p-8 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center text-center self-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 mb-3">
            <Presentation className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 mb-1">待生成网页幻灯片</h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            请在左侧输入演讲主题、文字大纲或上传文稿附件与需求描述，然后点击「执行 Skill 获得结果」，系统将为您生成专业的网页幻灯片。
          </p>
        </div>
      ) : (
      <div className="relative w-full p-4 sm:p-6 flex flex-col items-center justify-center overflow-hidden">
        {/* Aspect 16:9 Screen Box */}
        <div
          className={`relative w-full aspect-16/9 rounded-xl border shadow-xl overflow-hidden flex flex-col justify-between p-6 sm:p-10 transition-all select-none ${
            isSwiss
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-stone-200 text-stone-900 font-serif'
          }`}
          style={{
            backgroundImage: isSwiss
              ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)'
              : 'none',
            backgroundSize: isSwiss ? '24px 24px' : 'auto',
          }}
        >
          {/* Slide Top Chrome / Header */}
          <div
            className={`flex items-center justify-between pb-3 border-b text-xs font-mono tracking-wider uppercase ${
              isSwiss ? 'border-slate-800 text-slate-400' : 'border-stone-200 text-stone-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                style={{
                  color: accentColor,
                  backgroundColor: `${accentColor}1A`,
                }}
              >
                {currentSlide?.chapter || 'CHAPTER'}
              </span>
              <span className="opacity-40">|</span>
              <span className="text-[11px] truncate max-w-[200px]">{title}</span>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span>
                PAGE {String(currentSlide?.slideNumber || 1).padStart(2, '0')} /{' '}
                {String(totalSlides).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Slide Main Body Content */}
          {currentSlide && (
            <div className="my-auto py-4 flex flex-col justify-center">
              {/* Main Headline */}
              <h1
                className={`text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-3 ${
                  isSwiss ? 'font-sans font-black' : 'font-serif font-bold'
                }`}
              >
                {currentSlide.title}
              </h1>

              {/* Subtitle */}
              {currentSlide.subtitle && (
                <p
                  className={`text-sm sm:text-lg lg:text-xl opacity-75 max-w-3xl leading-relaxed mb-6 ${
                    isSwiss ? 'font-sans text-slate-300' : 'font-serif text-stone-600'
                  }`}
                >
                  {currentSlide.subtitle}
                </p>
              )}

              {/* KPI Data Hero Layout */}
              {currentSlide.kpis && currentSlide.kpis.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 my-2">
                  {currentSlide.kpis.map((kpi, kIdx) => (
                    <div
                      key={kIdx}
                      className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-between ${
                        isSwiss
                          ? 'bg-slate-800/40 border-slate-700/60'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div
                        className="text-3xl sm:text-5xl font-extrabold font-mono tracking-tight"
                        style={{ color: accentColor }}
                      >
                        {kpi.value}
                      </div>
                      <div className="text-xs sm:text-sm font-medium mt-2 opacity-70">
                        {kpi.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Structured Points / Grid Items */}
              {currentSlide.points && currentSlide.points.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-2">
                  {currentSlide.points.map((pt, pIdx) => (
                    <div
                      key={pIdx}
                      className={`p-3.5 sm:p-4 rounded-xl border flex items-start gap-3 ${
                        isSwiss
                          ? 'bg-slate-800/30 border-slate-700/50'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5"
                        style={{
                          color: accentColor,
                          backgroundColor: `${accentColor}1A`,
                        }}
                      >
                        {String(pIdx + 1).padStart(2, '0')}
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed opacity-90">{pt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Slide Footer Status */}
          <div
            className={`pt-3 border-t flex items-center justify-between text-[11px] opacity-60 font-mono ${
              isSwiss ? 'border-slate-800' : 'border-stone-200'
            }`}
          >
            <span>16:9 WEB DECK</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE INTERACTION READY</span>
            </span>
          </div>
        </div>

        {/* Playback Controls Scrubber Bar */}
        <div className="w-full max-w-2xl mt-4 flex items-center justify-between gap-4 px-2">
          {/* Prev Slide */}
          <button
            type="button"
            onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentSlideIndex === 0}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="上一页 (ArrowLeft)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrubber Progress dots */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 justify-center scrollbar-none">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentSlideIndex
                    ? 'w-7 bg-indigo-600 dark:bg-indigo-500'
                    : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
                title={`第 ${idx + 1} 页: ${s.title}`}
              />
            ))}
          </div>

          {/* Next Slide */}
          <button
            type="button"
            onClick={() => setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1))}
            disabled={currentSlideIndex === totalSlides - 1}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="下一页 (ArrowRight / Space)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Play/Pause Auto Advance */}
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-white border-amber-500'
                : 'border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="自动轮播播放 (5秒/页)"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? '暂停' : '自动放映'}</span>
          </button>
        </div>
      </div>
      )}

      {/* 3. Presenter Mode Drawer / Split View */}
      {showPresenterMode && (
        <div
          className={`mx-4 sm:mx-6 mb-4 p-5 rounded-xl border shadow-lg ${
            isSwiss ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">
                演讲者双屏讲稿模式 (Presenter View)
              </span>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold text-sm">{formatTimer(timerSeconds)}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTimerRunning((r) => !r)}
                className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-[11px] cursor-pointer"
              >
                {isTimerRunning ? '暂停' : '开始计时'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerSeconds(0);
                  setIsTimerRunning(false);
                }}
                className="p-1 rounded-md border border-slate-300 dark:border-slate-700 hover:text-red-500 text-[11px] cursor-pointer"
                title="重置计时"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Left: Current Slide Mission & Next Slide Preview */}
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">
                  页面核心任务 (Slide Mission)
                </span>
                <p className="text-xs leading-relaxed font-medium">
                  {currentSlide.speakerNotes?.purpose ||
                    '阐述当前维度的核心发现，用清晰事实消除听众疑惑。'}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                  下一页预见 (Next Slide Preview)
                </span>
                <p className="text-xs font-bold truncate">
                  {slides[currentSlideIndex + 1]
                    ? `[${slides[currentSlideIndex + 1].slideNumber}] ${
                        slides[currentSlideIndex + 1].title
                      }`
                    : '这是最后一页 (End of Presentation)'}
                </p>
                {currentSlide.speakerNotes?.transition && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1.5 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 shrink-0" />
                    <span>转场话术: {currentSlide.speakerNotes.transition}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Right: Speaker Talk Script */}
            <div className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1.5">
                  台词与讲述建议 (Speaker Script)
                </span>
                <p className="text-xs sm:text-sm leading-relaxed opacity-90 whitespace-pre-wrap">
                  {currentSlide.speakerNotes?.talk ||
                    '配合幻灯片大字报，向听众指出当前行业痛点，重点阐述方案如何在效率上取得数量级提升。'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] opacity-60">
                <span>建议讲述时长: {currentSlide.speakerNotes?.minutes || 2} 分钟</span>
                <button
                  type="button"
                  onClick={() => {
                    if (currentSlide.speakerNotes?.talk) {
                      navigator.clipboard.writeText(currentSlide.speakerNotes.talk);
                      alert('已复制该页讲稿');
                    }
                  }}
                  className="hover:text-indigo-500 cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>复制讲稿</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Grid Overview Modal / Drawer */}
      {showGridOverview && (
        <div className="mx-4 sm:mx-6 mb-4 p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-500" />
              <span>全篇大纲与幻灯片索引 ({totalSlides} 页)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowGridOverview(false)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            >
              关闭 (ESC)
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setCurrentSlideIndex(idx);
                  setShowGridOverview(false);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between aspect-16/10 ${
                  idx === currentSlideIndex
                    ? 'border-indigo-600 bg-white dark:bg-slate-900 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>#{String(idx + 1).padStart(2, '0')}</span>
                  <span className="truncate max-w-[60px]">{s.chapter || 'SLIDE'}</span>
                </div>
                <p className="text-xs font-bold line-clamp-2 mt-1">{s.title}</p>
                <span className="text-[9px] text-slate-400 mt-auto pt-1">点击跳转</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Bottom Code & Raw Data Tab Switcher */}
      <div
        className={`px-4 py-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
          isSwiss ? 'border-slate-800 bg-slate-900/40' : 'border-stone-200 bg-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            演示预览
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('html')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'html'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            单文件 HTML 源码
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            全篇演讲稿提纲
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制代码' : '复制 HTML 代码'}</span>
          </button>
        </div>
      </div>

      {/* Code / Notes Drawer content */}
      {activeTab === 'html' && (
        <div className="p-4 border-t border-slate-800">
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono max-h-96 overflow-y-auto whitespace-pre-wrap">
            {generateStandaloneHtml()}
          </pre>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="p-4 border-t border-slate-800 max-h-96 overflow-y-auto space-y-4 text-xs">
          {slides.map((s, idx) => (
            <div
              key={s.id}
              className="p-3.5 rounded-xl border border-slate-700 bg-slate-900/60 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between font-mono text-slate-400">
                <span className="font-bold text-indigo-400">
                  第 {idx + 1} 页 · {s.chapter}
                </span>
                <span>{s.speakerNotes?.minutes || 2} 分钟</span>
              </div>
              <h4 className="font-bold text-sm text-white">{s.title}</h4>
              <p className="text-slate-300 leading-relaxed mt-1">
                <strong>台词:</strong> {s.speakerNotes?.talk || '（根据当前要点展开阐述）'}
              </p>
              {s.speakerNotes?.transition && (
                <p className="text-amber-300 text-[11px]">
                  <strong>转场:</strong> {s.speakerNotes.transition}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
