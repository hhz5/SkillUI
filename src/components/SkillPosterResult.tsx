import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import {
  Sparkles,
  Layers,
  Palette,
  Download,
  Copy,
  Check,
  Columns2,
  Film,
  Eye,
  Maximize2,
  Sliders,
  Share2,
  Image as ImageIcon,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SkillPosterResultProps {
  rawOutput: string;
  formValues: Record<string, any>;
  title: string;
}

type ColorTheme = 'xuan_paper' | 'cinnabar' | 'ink' | 'mineral';
type CompositionMode = 'hero' | 'fullbleed' | 'mount';
type PhotoFilter = 'sketch' | 'rubbing' | 'natural';
type InteractionStyle = 'masking' | 'avoidance' | 'overlay' | 'asymmetric';

export const SkillPosterResult: React.FC<SkillPosterResultProps> = ({
  rawOutput,
  formValues,
  title,
}) => {
  const [activeTab, setActiveTab] = useState<'poster' | 'markdown' | 'storyboard'>('poster');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [posterAspect, setPosterAspect] = useState<string>(
    formValues.aspect_ratio || '3:4'
  );
  const [showComparison, setShowComparison] = useState(
    formValues.create_comparison || false
  );
  // Default to xuan_paper (authentic author style from GitHub)
  const [colorTheme, setColorTheme] = useState<ColorTheme>('xuan_paper');
  const [compositionMode, setCompositionMode] = useState<CompositionMode>('hero');
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>('sketch');
  const [interactionStyle, setInteractionStyle] = useState<InteractionStyle>(
    (formValues.interaction_style as InteractionStyle) || 'masking'
  );

  const posterRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const subjectName = (formValues.subject_name || '').trim();

  // Sync interactionStyle with form changes
  useEffect(() => {
    if (formValues.interaction_style) {
      setInteractionStyle(formValues.interaction_style as InteractionStyle);
    }
  }, [formValues.interaction_style]);

  // Robust extraction of uploaded photos from any form field format
  const photoUrls: string[] = React.useMemo(() => {
    const urls: string[] = [];
    const collectFromItem = (item: any) => {
      if (!item) return;
      if (typeof item === 'string') {
        if (
          item.startsWith('data:image/') ||
          item.startsWith('http://') ||
          item.startsWith('https://') ||
          item.startsWith('/')
        ) {
          urls.push(item);
        }
      } else if (typeof item === 'object') {
        if (
          typeof item.dataUrl === 'string' &&
          (item.dataUrl.startsWith('data:image/') || item.dataUrl.startsWith('http'))
        ) {
          urls.push(item.dataUrl);
        } else if (typeof item.url === 'string' && item.url) {
          urls.push(item.url);
        }
        if (Array.isArray(item.files)) {
          item.files.forEach(collectFromItem);
        }
      }
    };

    const primaryKeys = ['photos', 'media_assets', 'images', 'photo', 'source_photos'];
    for (const key of primaryKeys) {
      const val = formValues[key];
      if (Array.isArray(val)) {
        val.forEach(collectFromItem);
      } else if (val) {
        collectFromItem(val);
      }
    }

    // Also scan all other fields in formValues in case field id differs
    for (const [k, val] of Object.entries(formValues)) {
      if (!primaryKeys.includes(k) && val) {
        if (Array.isArray(val)) {
          val.forEach(collectFromItem);
        } else if (typeof val === 'object') {
          collectFromItem(val);
        }
      }
    }

    return Array.from(new Set(urls.filter(Boolean)));
  }, [formValues]);

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const primaryPhoto = photoUrls[selectedPhotoIndex] || photoUrls[0] || '';
  const hasContent = Boolean(subjectName || primaryPhoto || (rawOutput && rawOutput.trim().length > 0));

  // Extract Video prompt if found in markdown
  const videoPromptMatch = rawOutput.match(
    /(?:Prompt|prompt|提示词)[:：]\s*[`'"]*([A-Za-z0-9\s,.-_]{30,})[`'"]*/i
  );
  const extractedVideoPrompt = videoPromptMatch ? videoPromptMatch[1].trim() : '';

  const copyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAspectClass = (aspect: string) => {
    switch (aspect) {
      case '1:1':
        return 'aspect-square max-w-sm';
      case '16:9':
        return 'aspect-video max-w-lg';
      case '4:3':
        return 'aspect-4/3 max-w-md';
      case '9:16':
        return 'aspect-9/16 max-w-xs';
      case '3:4':
      default:
        return 'aspect-3/4 max-w-sm';
    }
  };

  // Generate high-resolution poster on Canvas and export PNG
  const renderCanvasPoster = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    let width = 1200;
    let height = 1600; // 3:4 default

    if (posterAspect === '1:1') {
      width = 1400;
      height = 1400;
    } else if (posterAspect === '16:9') {
      width = 1600;
      height = 900;
    } else if (posterAspect === '4:3') {
      width = 1600;
      height = 1200;
    } else if (posterAspect === '9:16') {
      width = 1080;
      height = 1920;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Color theme setups
    const isXuanPaper = colorTheme === 'xuan_paper';
    const themeBg =
      colorTheme === 'xuan_paper'
        ? '#ECE5D8'
        : colorTheme === 'cinnabar'
        ? '#161514'
        : colorTheme === 'ink'
        ? '#0D0E11'
        : '#0E1F1D';
    const themeAccent =
      colorTheme === 'xuan_paper'
        ? '#B91C1C'
        : colorTheme === 'cinnabar'
        ? '#AC3C33'
        : colorTheme === 'ink'
        ? '#8A2B2B'
        : '#D97706';

    // 1. Draw Background
    ctx.fillStyle = themeBg;
    ctx.fillRect(0, 0, width, height);

    // Subtle background texture / gradient
    if (isXuanPaper) {
      // Xuan paper rice texture
      const paperGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        width * 0.1,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );
      paperGrad.addColorStop(0, '#F5EFE6');
      paperGrad.addColorStop(0.6, '#EAE3D2');
      paperGrad.addColorStop(1, '#DED6C4');
      ctx.fillStyle = paperGrad;
      ctx.fillRect(0, 0, width, height);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, 'rgba(30, 28, 26, 0.9)');
      bgGrad.addColorStop(0.5, 'rgba(18, 17, 16, 0.4)');
      bgGrad.addColorStop(1, 'rgba(10, 10, 9, 0.95)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // Set filter on canvas if photoFilter is selected
    const applyCanvasPhotoFilter = () => {
      if (photoFilter === 'sketch') {
        ctx.filter = 'contrast(130%) grayscale(35%) sepia(25%)';
      } else if (photoFilter === 'rubbing') {
        ctx.filter = 'contrast(180%) grayscale(100%)';
      } else {
        ctx.filter = 'none';
      }
    };

    // 1. Draw Title for MASKING Mode (behind the subject, upper strokes towering above eaves)
    if (subjectName && interactionStyle === 'masking') {
      const behindTitleY = height * 0.22;
      ctx.save();
      ctx.font = `900 ${Math.round(width * 0.22)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isXuanPaper ? '#24201D' : 'rgba(255, 248, 235, 0.88)';
      if (!isXuanPaper) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 30;
      }
      ctx.fillText(subjectName, width * 0.5, behindTitleY);
      ctx.restore();
    }

    // 1.1 Draw Title for AVOIDANCE Mode (floating in upper negative space with generous letter spacing)
    if (subjectName && interactionStyle === 'avoidance') {
      ctx.save();
      ctx.font = `bold ${Math.round(width * 0.048)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isXuanPaper ? '#2C2723' : '#F1E7D0';
      const spacedText = `〔 · ${subjectName.split('').join(' · ')} · 〕`;
      ctx.fillText(spacedText, width * 0.5, height * 0.165);

      ctx.font = `normal ${Math.round(width * 0.018)}px serif`;
      ctx.fillStyle = isXuanPaper ? '#786F66' : 'rgba(230, 210, 180, 0.7)';
      ctx.fillText('避让藻井正梁 · 虚实气口相生', width * 0.5, height * 0.198);
      ctx.restore();
    }

    // 1.2 Draw Vertical Title for ASYMMETRIC Mode (down the left side axis)
    if (subjectName && interactionStyle === 'asymmetric') {
      ctx.save();
      const leftAxisX = width * 0.15;
      let charY = height * 0.26;
      ctx.font = `900 ${Math.round(width * 0.12)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isXuanPaper ? '#1E1B18' : '#FFF2DB';
      for (const char of subjectName.slice(0, 4)) {
        ctx.fillText(char, leftAxisX, charY);
        charY += Math.round(width * 0.13);
      }

      // Vertical guide rule
      ctx.strokeStyle = themeAccent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(leftAxisX, charY + 5);
      ctx.lineTo(leftAxisX, charY + Math.round(height * 0.06));
      ctx.stroke();

      ctx.font = `bold ${Math.round(width * 0.018)}px "Courier New", monospace`;
      ctx.fillStyle = isXuanPaper ? '#8C4336' : '#E8A375';
      ctx.fillText('AXIS:01-ELEV', leftAxisX, height * 0.21);
      ctx.restore();
    }

    // 2. Draw user photo if present
    if (primaryPhoto) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const imageObj = new Image();
          imageObj.crossOrigin = 'anonymous';
          imageObj.onload = () => resolve(imageObj);
          imageObj.onerror = reject;
          imageObj.src = primaryPhoto;
        });

        ctx.save();
        applyCanvasPhotoFilter();

        if (compositionMode === 'fullbleed') {
          // Full-bleed mode
          const scale = Math.max(width / img.width, height / img.height);
          const x = (width - img.width * scale) / 2;
          const y = (height - img.height * scale) / 2;
          ctx.globalAlpha = isXuanPaper ? 0.75 : 0.55;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          ctx.restore();

          // Overlay gradient for readability
          const scrim = ctx.createLinearGradient(0, 0, 0, height);
          if (isXuanPaper) {
            scrim.addColorStop(0, 'rgba(236, 229, 216, 0.4)');
            scrim.addColorStop(0.5, 'rgba(236, 229, 216, 0.15)');
            scrim.addColorStop(1, 'rgba(236, 229, 216, 0.85)');
          } else {
            scrim.addColorStop(0, 'rgba(15, 14, 13, 0.8)');
            scrim.addColorStop(0.4, 'rgba(15, 14, 13, 0.3)');
            scrim.addColorStop(1, 'rgba(15, 14, 13, 0.85)');
          }
          ctx.fillStyle = scrim;
          ctx.fillRect(0, 0, width, height);
        } else if (interactionStyle === 'asymmetric') {
          // Asymmetric mode: photo shifted to the right side
          const rightAreaW = width * 0.65;
          const maxPhotoH = height * 0.58;
          const scale = Math.min(rightAreaW / img.width, maxPhotoH / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;
          const dx = width * 0.28 + (rightAreaW - dw) / 2;
          const dy = height * 0.25 + (maxPhotoH - dh) / 2;

          ctx.shadowColor = isXuanPaper ? 'rgba(40, 30, 20, 0.35)' : 'rgba(0,0,0,0.9)';
          ctx.shadowBlur = 35;
          ctx.drawImage(img, dx, dy, dw, dh);
          ctx.restore();

          // Draw photo badge
          ctx.save();
          ctx.fillStyle = isXuanPaper ? 'rgba(255,248,235,0.92)' : 'rgba(0,0,0,0.8)';
          ctx.fillRect(dx + 12, dy + 12, 130, 24);
          ctx.font = 'bold 12px monospace';
          ctx.fillStyle = isXuanPaper ? '#443B33' : '#F7D08A';
          ctx.fillText(photoFilter === 'sketch' ? 'WOODBLOCK SKETCH' : photoFilter === 'rubbing' ? 'INK RUBBING' : 'PHOTO ASSET', dx + 18, dy + 28);
          ctx.restore();
        } else {
          // Centered subject mode (Hero, Masking, Avoidance, Overlay)
          const maxPhotoW = width * 0.84;
          const maxPhotoH = interactionStyle === 'avoidance' ? height * 0.52 : height * 0.56;
          const scale = Math.min(maxPhotoW / img.width, maxPhotoH / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;
          const dx = (width - dw) / 2;
          const dy = interactionStyle === 'avoidance'
            ? height * 0.27 + (maxPhotoH - dh) / 2
            : height * 0.26 + (maxPhotoH - dh) / 2;

          ctx.shadowColor = isXuanPaper ? 'rgba(40, 30, 20, 0.35)' : 'rgba(0,0,0,0.9)';
          ctx.shadowBlur = 35;
          ctx.shadowOffsetY = 10;
          ctx.drawImage(img, dx, dy, dw, dh);
          ctx.restore();

          // Draw photo badge
          ctx.save();
          ctx.fillStyle = isXuanPaper ? 'rgba(255,248,235,0.92)' : 'rgba(0,0,0,0.8)';
          ctx.fillRect(dx + 12, dy + 12, 130, 24);
          ctx.font = 'bold 12px monospace';
          ctx.fillStyle = isXuanPaper ? '#443B33' : '#F7D08A';
          ctx.fillText(photoFilter === 'sketch' ? 'WOODBLOCK SKETCH' : photoFilter === 'rubbing' ? 'INK RUBBING' : 'PHOTO ASSET', dx + 18, dy + 28);
          ctx.restore();
        }
      } catch (err) {
        console.warn('Canvas failed to load primary photo:', err);
      }
    }

    // 2.1 Draw Title for OVERLAY Mode (Directly on top of the photo facade in front)
    if (subjectName && interactionStyle === 'overlay') {
      ctx.save();
      const overlayCenterY = height * 0.44;
      const boxW = Math.min(width * 0.76, 520);
      const boxH = Math.round(width * 0.16);
      const boxX = (width - boxW) / 2;
      const boxY = overlayCenterY - boxH / 2;

      // Draw frosted mineral plate
      ctx.fillStyle = isXuanPaper ? 'rgba(250, 245, 236, 0.92)' : 'rgba(15, 14, 13, 0.75)';
      ctx.strokeStyle = isXuanPaper ? 'rgba(80, 60, 40, 0.3)' : 'rgba(255, 215, 150, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 16);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(width * 0.016)}px "Courier New", monospace`;
      ctx.fillStyle = isXuanPaper ? '#8C4336' : '#F59E0B';
      ctx.fillText('OVERLAY TECTONICS · 纯净覆层', width * 0.5, boxY + boxH * 0.22);

      ctx.font = `900 ${Math.round(width * 0.085)}px serif`;
      ctx.fillStyle = isXuanPaper ? '#1E1B18' : '#FFFDF5';
      ctx.fillText(subjectName, width * 0.5, boxY + boxH * 0.62);
      ctx.restore();
    }

    // 3. Draw Red Seal / Stamp
    const sealSize = Math.round(width * 0.075);
    const sealX = width - sealSize - width * 0.05;
    const sealY = height * 0.045;

    ctx.save();
    ctx.fillStyle = themeAccent;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 12;
    ctx.fillRect(sealX, sealY, sealSize, sealSize);
    ctx.strokeStyle = 'rgba(255, 230, 200, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sealX + 3, sealY + 3, sealSize - 6, sealSize - 6);

    ctx.fillStyle = '#FFF5EB';
    ctx.font = `bold ${Math.round(sealSize * 0.42)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('营造', sealX + sealSize / 2, sealY + sealSize / 2);
    ctx.restore();

    // 4. Draw Header Metadata
    ctx.fillStyle = isXuanPaper ? '#44403C' : 'rgba(251, 241, 225, 0.8)';
    ctx.font = `600 ${Math.round(width * 0.02)}px "Courier New", monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(
      `YINGZAO POSTER EDITORIAL  •  ${posterAspect}`,
      width * 0.06,
      height * 0.065
    );

    // 4.1 Draw Vertical Geographical Placename Tag (Top Right, like "沙溪·寺登街")
    const verticalText = subjectName ? `${subjectName}·营造文脉` : '在地营建·文存';
    ctx.save();
    ctx.font = `600 ${Math.round(width * 0.022)}px serif`;
    ctx.fillStyle = isXuanPaper ? '#57534E' : 'rgba(245, 215, 170, 0.8)';
    ctx.textAlign = 'center';
    const vertX = width * 0.88;
    let vertY = height * 0.16;
    for (const char of verticalText.slice(0, 8)) {
      ctx.fillText(char, vertX, vertY);
      vertY += Math.round(width * 0.032);
    }
    ctx.restore();

    // 5. Draw Lower Metadata / Year Stamp (like "1415 明永乐十三年 一建三殿")
    const titleY = height * 0.88;
    ctx.save();
    ctx.font = `bold ${Math.round(width * 0.045)}px serif`;
    ctx.fillStyle = isXuanPaper ? '#B45309' : '#F59E0B';
    ctx.textAlign = 'left';
    ctx.fillText('1415', width * 0.06, titleY - Math.round(width * 0.035));

    ctx.font = `normal ${Math.round(width * 0.02)}px serif`;
    ctx.fillStyle = isXuanPaper ? '#44403C' : '#E2E8F0';
    ctx.fillText('明永乐十三年 · 营造一建三殿', width * 0.06, titleY - Math.round(width * 0.012));
    ctx.fillText('ARCHITECTURAL VERNACULAR & CULTURAL HERITAGE', width * 0.06, titleY + Math.round(width * 0.015));
    ctx.restore();

    // 6. Draw Footer Rule & Metadata
    ctx.strokeStyle = isXuanPaper ? 'rgba(120, 100, 80, 0.25)' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width * 0.06, height * 0.94);
    ctx.lineTo(width * 0.94, height * 0.94);
    ctx.stroke();

    ctx.fillStyle = isXuanPaper ? '#78716C' : 'rgba(180, 180, 180, 0.65)';
    ctx.font = `normal ${Math.round(width * 0.017)}px "Courier New", monospace`;
    ctx.fillText('STRUCT: TIMBER VERNACULAR & ARTIFACT', width * 0.06, height * 0.97);
    ctx.textAlign = 'right';
    ctx.fillText('CULTURAL ARCHIVES & SPECIFICATIONS', width * 0.94, height * 0.97);

    return canvas.toDataURL('image/png');
  };

  // Obtain high-fidelity poster image, matching preview DOM with 1:1 pixel accuracy
  const getPosterDataUrl = async (): Promise<string> => {
    if (posterRef.current) {
      try {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }
        const dataUrl = await toPng(posterRef.current, {
          quality: 1.0,
          pixelRatio: 2.5,
          cacheBust: true,
        });
        if (dataUrl && dataUrl.length > 500) {
          return dataUrl;
        }
      } catch (err) {
        console.warn('html-to-image capture fallback to canvas:', err);
      }
    }
    return await renderCanvasPoster();
  };

  // Download high-resolution PNG file identical to preview
  const handleDownloadPosterPNG = async () => {
    setIsDownloading(true);
    try {
      const dataUrl = await getPosterDataUrl();
      if (!dataUrl) throw new Error('生成海报图片失败');

      const link = document.createElement('a');
      link.download = `yingzao-poster-${subjectName || '东方建筑'}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download poster error:', err);
      alert('下载海报失败，请稍后重试');
    } finally {
      setIsDownloading(false);
    }
  };

  // Convert dataURL to Blob directly without network fetch
  const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1] || '');
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Copy PNG image to clipboard
  const handleCopyPosterImage = async () => {
    try {
      const dataUrl = await getPosterDataUrl();
      if (!dataUrl) return;

      const blob = dataURLtoBlob(dataUrl);
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } catch (err) {
      console.warn('Copy image to clipboard fallback:', err);
      // Fallback: copy dataUrl string
      copyText(rawOutput, setCopiedAll);
    }
  };

  if (!hasContent) {
    return (
      <div className="w-full my-12 p-8 rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 flex flex-col items-center text-center animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-rose-400 mb-3 shadow-inner">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">未检测到海报内容</h3>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed">
          请在左侧表单输入建筑/对象名称或上传照片素材，点击「执行 Skill 获得结果」开始排版生成。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Visual Navigation Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('poster')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'poster'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
            <span>视觉海报图片</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('markdown')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'markdown'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>艺术指导规范文档</span>
          </button>
          {formValues.expand_storyboard && (
            <button
              type="button"
              onClick={() => setActiveTab('storyboard')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'storyboard'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-amber-500" />
              <span>3×3 视频分镜</span>
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {primaryPhoto && (
            <button
              type="button"
              onClick={() => setShowComparison(!showComparison)}
              className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1 transition-colors cursor-pointer ${
                showComparison
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>{showComparison ? '退出对比' : '原图对比'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyPosterImage}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            title="复制海报图片到剪贴板"
          >
            {copiedImage ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedImage ? '已复制图片' : '复制海报图'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPosterPNG}
            disabled={isDownloading}
            className="px-3 py-1 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? '生成图片中...' : '下载高清海报 (PNG)'}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Interactive Visual Poster Render */}
      {activeTab === 'poster' && (
        !hasContent ? (
          <div className="w-full max-w-lg my-12 mx-auto p-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">待生成营造海报</h3>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              请在左侧配置建筑/造像主体名称，上传拍摄照片或输入需求描述，然后点击「执行 Skill 获得结果」，系统将为您生成艺术指导海报与视频分镜。
            </p>
          </div>
        ) : (
          <div className="space-y-5">
          {/* Controls Bar */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between flex-wrap gap-3">
            {/* Aspect ratio selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium text-[11px]">画幅比例:</span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                {['3:4', '1:1', '16:9', '4:3', '9:16'].map((asp) => (
                  <button
                    key={asp}
                    type="button"
                    onClick={() => setPosterAspect(asp)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      posterAspect === asp
                        ? 'bg-rose-600 text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {asp}
                  </button>
                ))}
              </div>
            </div>

            {/* Aesthetic theme selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium text-[11px]">矿物色场:</span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setColorTheme('xuan_paper')}
                  className={`px-2.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    colorTheme === 'xuan_paper'
                      ? 'bg-amber-100 text-stone-900 font-bold border border-amber-300 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📜 宣纸版画 (原作者)
                </button>
                <button
                  type="button"
                  onClick={() => setColorTheme('cinnabar')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    colorTheme === 'cinnabar'
                      ? 'bg-rose-950 text-rose-200 font-bold border border-rose-800/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  朱砂金石
                </button>
                <button
                  type="button"
                  onClick={() => setColorTheme('ink')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    colorTheme === 'ink'
                      ? 'bg-slate-900 text-slate-100 font-bold border border-slate-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  玄青古墨
                </button>
                <button
                  type="button"
                  onClick={() => setColorTheme('mineral')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    colorTheme === 'mineral'
                      ? 'bg-emerald-950 text-emerald-200 font-bold border border-emerald-800'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  石青碧玉
                </button>
              </div>
            </div>

            {/* Photo filter selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium text-[11px]">照片质感:</span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPhotoFilter('sketch')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    photoFilter === 'sketch'
                      ? 'bg-stone-800 text-amber-100 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  木刻素描 (原作者质感)
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoFilter('rubbing')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    photoFilter === 'rubbing'
                      ? 'bg-stone-800 text-amber-100 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  金石拓印
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoFilter('natural')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    photoFilter === 'natural'
                      ? 'bg-stone-800 text-amber-100 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  实拍原色
                </button>
              </div>
            </div>

            {/* Composition style */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium text-[11px]">构图版式:</span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCompositionMode('hero')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    compositionMode === 'hero'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  主体咬合
                </button>
                <button
                  type="button"
                  onClick={() => setCompositionMode('fullbleed')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    compositionMode === 'fullbleed'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  全景意境
                </button>
                <button
                  type="button"
                  onClick={() => setCompositionMode('mount')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    compositionMode === 'mount'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  典雅装裱
                </button>
              </div>
            </div>

            {/* Interaction Style Selector (The 4 Spatial Interaction Modes) */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium text-[11px]">图文空间互动:</span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setInteractionStyle('masking')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    interactionStyle === 'masking'
                      ? 'bg-amber-800 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  主体压字咬合
                </button>
                <button
                  type="button"
                  onClick={() => setInteractionStyle('avoidance')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    interactionStyle === 'avoidance'
                      ? 'bg-amber-800 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  避让留白穿插
                </button>
                <button
                  type="button"
                  onClick={() => setInteractionStyle('overlay')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    interactionStyle === 'overlay'
                      ? 'bg-amber-800 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  字压主体覆层
                </button>
                <button
                  type="button"
                  onClick={() => setInteractionStyle('asymmetric')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    interactionStyle === 'asymmetric'
                      ? 'bg-amber-800 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  侧轴非对称
                </button>
              </div>
            </div>

            {/* Multiple photos thumbnail switcher */}
            {photoUrls.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-1 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium px-1">切换照片素材 ({photoUrls.length}):</span>
                {photoUrls.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`w-7 h-7 rounded-md overflow-hidden border transition-all cursor-pointer ${
                      selectedPhotoIndex === idx
                        ? 'border-amber-600 ring-2 ring-amber-500/50 scale-105'
                        : 'border-slate-300 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`素材 ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Poster Stage */}
          <div className="flex flex-col items-center justify-center p-6 bg-stone-900/90 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden relative">
            {/* Top aspect & info */}
            <div className="w-full flex items-center justify-between text-slate-400 text-xs mb-4 pb-2 border-b border-stone-800">
              <span className="text-[11px] text-amber-200/90 font-mono">
                {subjectName || '营造视觉'} · 东方在地文化海报
              </span>
              <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-full font-serif">
                营造 · 东方编辑排版规范
              </span>
            </div>

            {/* Poster Card Container */}
            <div
              className={`w-full flex items-center justify-center gap-6 ${
                showComparison ? 'flex-col sm:flex-row' : ''
              }`}
            >
              {/* Optional: Original Photo Comparison */}
              {showComparison && primaryPhoto && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">原始拍摄素材</span>
                  <div
                    className={`${getAspectClass(
                      posterAspect
                    )} rounded-2xl overflow-hidden border border-stone-700 bg-black relative shadow-lg flex items-center justify-center`}
                  >
                    <img
                      src={primaryPhoto}
                      alt="原图"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
                      RAW INPUT
                    </div>
                  </div>
                </div>
              )}

              {/* The Art-Directed Poster */}
              <div className="flex flex-col items-center gap-2">
                {showComparison && (
                  <span className="text-[11px] text-amber-400 font-mono font-bold">
                    艺术指导与咬合海报
                  </span>
                )}
                <div
                  ref={posterRef}
                  id="poster-artboard"
                  className={`${getAspectClass(
                    posterAspect
                  )} w-full rounded-2xl overflow-hidden border ${
                    colorTheme === 'xuan_paper'
                      ? 'bg-[#EAE4D6] text-stone-900 border-[#D6CDBC]'
                      : colorTheme === 'cinnabar'
                      ? 'bg-[#161514] text-amber-50 border-stone-800'
                      : colorTheme === 'ink'
                      ? 'bg-[#0D0E11] text-slate-100 border-stone-800'
                      : 'bg-[#0E1F1D] text-emerald-50 border-stone-800'
                  } relative shadow-2xl flex flex-col justify-between p-6 select-none group`}
                  style={{
                    boxShadow:
                      colorTheme === 'xuan_paper'
                        ? '0 25px 50px -12px rgba(40, 30, 20, 0.45), 0 0 30px rgba(214, 180, 130, 0.2)'
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 24px rgba(172, 60, 51, 0.25)',
                  }}
                >
                  {/* Subtle Xuan paper grain overlay */}
                  {colorTheme === 'xuan_paper' && (
                    <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#CBBDA6_1px,transparent_1px)] [background-size:16px_16px]" />
                  )}

                  {/* Red Seal / Mineral Color accent stamp */}
                  <div
                    className={`absolute top-5 right-5 z-30 w-8 h-8 rounded-xs ${
                      colorTheme === 'xuan_paper'
                        ? 'bg-[#B91C1C] border-amber-200/50 text-amber-50'
                        : colorTheme === 'cinnabar'
                        ? 'bg-[#AC3C33] border-amber-600/40 text-amber-100'
                        : colorTheme === 'ink'
                        ? 'bg-[#8A2B2B] border-slate-500/40 text-slate-100'
                        : 'bg-[#D97706] border-emerald-400/40 text-emerald-950 font-bold'
                    } border flex items-center justify-center text-[10px] font-serif shadow-md`}
                  >
                    营造
                  </div>

                  {/* Vertical placename calligraphy tag on right (like "沙溪·寺登街") */}
                  <div className="absolute top-16 right-5 z-30 flex flex-col items-center space-y-1 font-serif text-[11px] tracking-widest pointer-events-none opacity-80">
                    <span className={colorTheme === 'xuan_paper' ? 'text-stone-700' : 'text-amber-200/80'}>
                      {subjectName ? `${subjectName}·营造` : '在地·文存'}
                    </span>
                  </div>

                  {/* Editorial Header Details */}
                  <div className="relative z-10 space-y-1">
                    <div className={`flex items-center gap-2 text-[10px] tracking-widest uppercase font-mono ${
                      colorTheme === 'xuan_paper' ? 'text-stone-600' : 'text-amber-200/70'
                    }`}>
                      <span>YINGZAO POSTER EDITORIAL</span>
                      <span>•</span>
                      <span>{posterAspect}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline px-1.5 py-0.5 text-[9px] rounded font-serif bg-amber-900/10 text-amber-900 border border-amber-900/20">
                        {interactionStyle === 'masking'
                          ? '主体压字咬合'
                          : interactionStyle === 'avoidance'
                          ? '避让留白穿插'
                          : interactionStyle === 'overlay'
                          ? '字压主体覆层'
                          : '侧轴非对称'}
                      </span>
                    </div>
                  </div>

                  {/* MODE 1: MASKING (主体压字咬合: Colossal characters behind the photo, roof eaves physically cutting into strokes) */}
                  {interactionStyle === 'masking' && subjectName && (
                    <div className="absolute inset-x-0 top-[13%] sm:top-[15%] z-10 flex items-center justify-center px-4 pointer-events-none select-none">
                      <h1
                        className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-serif tracking-tight leading-none text-center ${
                          colorTheme === 'xuan_paper'
                            ? 'text-stone-900/90'
                            : 'text-amber-100/85 drop-shadow-2xl'
                        }`}
                        style={{
                          letterSpacing: '-0.03em',
                        }}
                      >
                        {subjectName}
                      </h1>
                    </div>
                  )}

                  {/* MODE 2: AVOIDANCE (避让留白穿插: Title floats cleanly in upper negative space, zero overlap with architecture) */}
                  {interactionStyle === 'avoidance' && subjectName && (
                    <div className="relative z-20 pt-1 pb-1 flex flex-col items-center justify-center text-center select-none">
                      <div className="flex items-center gap-2 mb-1 opacity-75">
                        <span className="w-5 h-[1px] bg-amber-800/40" />
                        <span className="text-[8px] font-mono tracking-widest text-amber-900/80 uppercase">
                          VOID & CAVITY · 留白避让
                        </span>
                        <span className="w-5 h-[1px] bg-amber-800/40" />
                      </div>
                      <h1
                        className={`text-3xl sm:text-4xl md:text-5xl font-bold font-serif leading-tight text-center ${
                          colorTheme === 'xuan_paper' ? 'text-stone-900' : 'text-amber-100'
                        }`}
                        style={{ letterSpacing: '0.35em', textIndent: '0.35em' }}
                      >
                        〔 {subjectName.split('').join(' · ')} 〕
                      </h1>
                      <span className={`text-[9px] font-serif mt-0.5 opacity-75 ${
                        colorTheme === 'xuan_paper' ? 'text-stone-600' : 'text-amber-200/70'
                      }`}>
                        避让藻井正梁 · 虚实气口相生
                      </span>
                    </div>
                  )}

                  {/* MODE 4: ASYMMETRIC (侧轴非对称: Left vertical typography spine + Right offset photo) */}
                  {interactionStyle === 'asymmetric' ? (
                    <div className="relative z-20 my-auto py-2 flex items-center justify-between w-full gap-3 sm:gap-5">
                      {/* Left Column: Monumental Vertical Calligraphy Spine */}
                      <div className="flex flex-col items-center justify-center shrink-0 w-16 sm:w-20 pl-1 border-r border-stone-400/30 pr-3 select-none">
                        <span className="text-[8px] font-mono tracking-widest text-amber-800/80 mb-2 rotate-180 [writing-mode:vertical-rl]">
                          AXIS · 01-ELEV
                        </span>
                        <div className={`flex flex-col items-center leading-none gap-2 font-serif font-black text-4xl sm:text-5xl ${
                          colorTheme === 'xuan_paper' ? 'text-stone-900' : 'text-amber-100'
                        }`}>
                          {subjectName ? subjectName.slice(0, 4).split('').map((char, i) => (
                            <span key={i} className="drop-shadow-xs">{char}</span>
                          )) : <span>营造</span>}
                        </div>
                        <div className="w-0.5 h-8 bg-amber-700/60 my-2" />
                        <span className={`text-[9px] font-serif [writing-mode:vertical-rl] tracking-widest ${
                          colorTheme === 'xuan_paper' ? 'text-stone-600' : 'text-amber-200/70'
                        }`}>
                          非对称侧轴
                        </span>
                      </div>

                      {/* Right Area: Offset Architecture Photo */}
                      <div className="flex-1 flex items-center justify-center">
                        {primaryPhoto ? (
                          <div className="relative w-full flex items-center justify-center">
                            <img
                              src={primaryPhoto}
                              alt={subjectName || '素材照片'}
                              className={`max-h-60 sm:max-h-72 w-auto max-w-full rounded-xl object-contain transition-all duration-300 ${
                                colorTheme === 'xuan_paper' && photoFilter === 'sketch'
                                  ? 'mix-blend-multiply contrast-130 grayscale-[35%] sepia-[25%] opacity-95'
                                  : colorTheme === 'xuan_paper' && photoFilter === 'rubbing'
                                  ? 'mix-blend-multiply contrast-180 grayscale'
                                  : photoFilter === 'sketch'
                                  ? 'contrast-125 grayscale-[30%] sepia-[15%]'
                                  : 'contrast-105'
                              }`}
                              style={{
                                filter:
                                  colorTheme === 'xuan_paper'
                                    ? 'drop-shadow(0 15px 25px rgba(60,45,30,0.25))'
                                    : 'drop-shadow(0 20px 30px rgba(0,0,0,0.85))',
                              }}
                            />
                            <div className={`absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded font-mono border ${
                              colorTheme === 'xuan_paper'
                                ? 'bg-amber-100/90 text-stone-800 border-amber-300'
                                : 'bg-black/75 text-amber-200 border-amber-500/30'
                            }`}>
                              {photoFilter === 'sketch' ? 'WOODBLOCK SKETCH' : photoFilter === 'rubbing' ? 'INK RUBBING' : 'PHOTO ASSET'}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-44 rounded-2xl border-2 border-dashed border-stone-400/40 bg-white/20 flex flex-col items-center justify-center text-center p-3">
                            <span className="text-2xl mb-1">🏛️</span>
                            <span className="text-xs font-serif font-bold text-stone-800">未上传素材照片</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Centered Subject Area for masking, avoidance, overlay */
                    compositionMode !== 'fullbleed' && (
                      <div className="relative z-20 my-auto py-2 flex items-center justify-center w-full">
                        {primaryPhoto ? (
                          <div
                            className={`relative w-full flex items-center justify-center ${
                              compositionMode === 'mount'
                                ? 'p-2.5 border border-stone-400/40 bg-stone-100/60 rounded-2xl shadow-inner'
                                : ''
                            }`}
                          >
                            <img
                              src={primaryPhoto}
                              alt={subjectName || '真实建筑素材照片'}
                              className={`max-h-64 sm:max-h-76 w-auto max-w-full rounded-xl object-contain transition-all duration-300 ${
                                colorTheme === 'xuan_paper' && photoFilter === 'sketch'
                                  ? 'mix-blend-multiply contrast-130 grayscale-[35%] sepia-[25%] opacity-95'
                                  : colorTheme === 'xuan_paper' && photoFilter === 'rubbing'
                                  ? 'mix-blend-multiply contrast-180 grayscale'
                                  : photoFilter === 'sketch'
                                  ? 'contrast-125 grayscale-[30%] sepia-[15%]'
                                  : 'contrast-105'
                              }`}
                              style={{
                                filter:
                                  colorTheme === 'xuan_paper'
                                    ? 'drop-shadow(0 15px 25px rgba(60,45,30,0.25))'
                                    : 'drop-shadow(0 20px 30px rgba(0,0,0,0.85))',
                              }}
                            />
                            <div className={`absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded font-mono border ${
                              colorTheme === 'xuan_paper'
                                ? 'bg-amber-100/90 text-stone-800 border-amber-300'
                                : 'bg-black/75 text-amber-200 border-amber-500/30'
                            }`}>
                              {photoFilter === 'sketch' ? 'WOODBLOCK SKETCH' : photoFilter === 'rubbing' ? 'INK RUBBING' : 'PHOTO ASSET'}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-48 rounded-2xl border-2 border-dashed border-stone-400/40 bg-white/20 flex flex-col items-center justify-center text-center p-4">
                            <span className="text-3xl mb-1">🏛️</span>
                            <span className="text-xs font-serif font-bold text-stone-800">
                              {subjectName ? `${subjectName} · 东方古建营造场` : '未上传素材照片'}
                            </span>
                            <span className="text-[10px] text-stone-500 mt-1">
                              请在左侧上传拍摄照片，将自动呈现版画质感并实现图文空间穿插
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* MODE 3: OVERLAY (字压主体覆层: Crisp mineral plate floating directly over the architectural facade in layer z-30) */}
                  {interactionStyle === 'overlay' && subjectName && (
                    <div className="absolute inset-x-0 top-[38%] sm:top-[42%] z-30 flex flex-col items-center justify-center px-4 pointer-events-none select-none">
                      <div
                        className={`px-6 py-2.5 rounded-2xl border shadow-2xl flex flex-col items-center text-center backdrop-blur-md ${
                          colorTheme === 'xuan_paper'
                            ? 'bg-[#FAF5EC]/92 border-stone-800/30 text-stone-950'
                            : 'bg-black/70 border-amber-400/40 text-amber-50'
                        }`}
                      >
                        <span className="text-[8px] font-mono tracking-widest uppercase opacity-75 mb-0.5">
                          OVERLAY TECTONICS · 纯净覆层
                        </span>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-serif tracking-tight leading-none">
                          {subjectName}
                        </h1>
                        <span className="text-[8px] font-mono tracking-widest opacity-80 mt-1 uppercase border-t border-current/20 pt-1">
                          VERNACULAR ARTIFACT & SPATIAL VENEER
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Poster Lower Metadata (Historical Year & Dynastic Record) */}
                  <div className={`relative z-20 pt-3 border-t flex items-end justify-between text-[9px] font-mono ${
                    colorTheme === 'xuan_paper'
                      ? 'border-stone-400/40 text-stone-700'
                      : 'border-white/10 text-slate-400'
                  }`}>
                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-serif font-black text-sm text-amber-700">1415</span>
                        <span className="font-serif text-[10px] text-stone-600">明永乐十三年 · 一建三殿</span>
                      </div>
                      <div className="text-[8px] opacity-75">STRUCT: TIMBER VERNACULAR & ARTIFACT</div>
                    </div>
                    <div className="text-right font-serif">
                      <div className="text-[10px] font-semibold text-stone-800">
                        {subjectName || '东方建筑'} · 营造测绘档案
                      </div>
                      <div className="text-[8px] opacity-75">SPECIFICATIONS & ARCHIVES</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Art Direction Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" />
                <span>四域艺术指导体系</span>
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                遵循真实器物/建筑的自然光影与材质诚实性，以天然矿物色场（朱砂、玄铁、石青）营造空间张力。
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>图文空间咬合</span>
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                标题字「{subjectName}」与真实主体边缘自然咬合交错，杜绝文字漂浮的平面孤岛感。
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                <Film className="w-3.5 h-3.5" />
                <span>视频延展与导出</span>
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                支持一键导出 1200×1600 高清海报 PNG，并附带 3×3 九宫格运镜与 AI 视频交付提示词。
              </p>
            </div>
          </div>
        </div>
        )
      )}

      {/* Tab 2: Full Art Direction Markdown Document */}
      {activeTab === 'markdown' && (
        <div className="prose prose-slate prose-sm max-w-none bg-slate-50/50 p-5 rounded-2xl border border-slate-200 prose-headings:text-slate-900 prose-headings:font-bold prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-2xl prose-table:border prose-table:border-slate-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{rawOutput}</ReactMarkdown>
        </div>
      )}

      {/* Tab 3: Storyboard & Video Prompt */}
      {activeTab === 'storyboard' && (
        <div className="space-y-4">
          {extractedVideoPrompt && (
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Film className="w-4 h-4" />
                  <span>AI 视频模型交付 Prompt (Kling / Runway / Sora)</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyText(extractedVideoPrompt, setCopiedPrompt)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 text-xs cursor-pointer"
                >
                  {copiedPrompt ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedPrompt ? '已复制' : '复制视频 Prompt'}</span>
                </button>
              </div>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                {extractedVideoPrompt}
              </p>
            </div>
          )}

          <div className="prose prose-slate prose-sm max-w-none bg-white p-5 rounded-2xl border border-slate-200">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{rawOutput}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
