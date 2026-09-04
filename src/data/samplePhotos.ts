// Sample ancient architectural photos for Yingzao and heritage skills
// Encoded as high-fidelity SVG/Canvas Data URLs for instant offline availability

export interface SamplePhoto {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  type: string;
}

// 1. High-fidelity architectural photo of Yingxian Wooden Pagoda (Dougong Bracket & Eaves)
const yingxianSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1A202C"/>
      <stop offset="45%" stop-color="#2D3748"/>
      <stop offset="75%" stop-color="#4A5568"/>
      <stop offset="100%" stop-color="#718096"/>
    </linearGradient>
    <linearGradient id="woodGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4A2810"/>
      <stop offset="50%" stop-color="#6E3816"/>
      <stop offset="100%" stop-color="#381D0B"/>
    </linearGradient>
    <linearGradient id="mineralRed" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#991B1B"/>
      <stop offset="100%" stop-color="#7F1D1D"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0"/>
      <feBlend in="SourceGraphic" in2="noise" mode="overlay"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="800" height="1000" fill="url(#skyGrad)"/>
  <circle cx="680" cy="180" r="140" fill="#E2E8F0" opacity="0.12"/>
  
  <!-- Silhouette Mountain -->
  <path d="M0,750 Q180,680 380,720 T800,690 L800,1000 L0,1000 Z" fill="#1A202C" opacity="0.6"/>

  <!-- Pagoda Base & Levels -->
  <rect x="180" y="800" width="440" height="200" fill="url(#woodGrad)"/>
  
  <!-- Level 3 Dougong & Eaves -->
  <path d="M120,680 L680,680 L730,720 L70,720 Z" fill="#26150B"/>
  <path d="M140,660 L660,660 L680,680 L120,680 Z" fill="url(#woodGrad)"/>
  <!-- Brackets details -->
  <g fill="#5C2E12">
    <rect x="220" y="680" width="36" height="40"/>
    <rect x="300" y="680" width="36" height="40"/>
    <rect x="382" y="680" width="36" height="40"/>
    <rect x="464" y="680" width="36" height="40"/>
    <rect x="544" y="680" width="36" height="40"/>
  </g>

  <!-- Level 2 Flying Eaves (Dramatic Upswept Curves) -->
  <path d="M80,480 Q400,530 720,480 L760,515 Q400,565 40,515 Z" fill="#1C1008"/>
  <path d="M110,465 Q400,510 690,465 L720,480 Q400,530 80,480 Z" fill="url(#woodGrad)"/>
  
  <!-- Dougong Brackets System (斗拱) -->
  <g fill="#703615">
    <path d="M200,515 L220,550 L250,550 L230,515 Z"/>
    <path d="M280,515 L300,550 L330,550 L310,515 Z"/>
    <path d="M370,515 L390,550 L420,550 L400,515 Z"/>
    <path d="M470,515 L490,550 L520,550 L500,515 Z"/>
    <path d="M570,515 L590,550 L620,550 L600,515 Z"/>
  </g>

  <!-- Level 1 Upper Roof (Spire & Finial) -->
  <path d="M160,300 Q400,340 640,300 L680,335 Q400,375 120,335 Z" fill="#1C1008"/>
  <polygon points="400,100 350,300 450,300" fill="url(#woodGrad)"/>
  
  <!-- Spire / Finial (宝顶与铁刹) -->
  <line x1="400" y1="40" x2="400" y2="120" stroke="#CBD5E0" stroke-width="6"/>
  <circle cx="400" cy="50" r="14" fill="#D69E2E"/>
  <circle cx="400" cy="80" r="22" fill="#D69E2E"/>

  <!-- Bell hanging from eaves (风铃) -->
  <circle cx="50" cy="530" r="6" fill="#D69E2E"/>
  <line x1="40" y1="515" x2="50" y2="530" stroke="#A0AEC0" stroke-width="2"/>
  <circle cx="750" cy="530" r="6" fill="#D69E2E"/>
  <line x1="760" y1="515" x2="750" y2="530" stroke="#A0AEC0" stroke-width="2"/>

  <!-- Seal / Stamp Watermark -->
  <rect x="680" y="850" width="70" height="70" fill="url(#mineralRed)" rx="4"/>
  <text x="715" y="882" fill="#FEE2E2" font-family="serif" font-size="14" font-weight="bold" text-anchor="middle">山西</text>
  <text x="715" y="904" fill="#FEE2E2" font-family="serif" font-size="14" font-weight="bold" text-anchor="middle">应县</text>

  <!-- Texture overlay -->
  <rect width="800" height="1000" fill="none" stroke="#2D3748" stroke-width="4"/>
</svg>`;

// 2. High-fidelity architectural photo of Datong Ancient City Wall & Corner Tower (角楼)
const datongSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <linearGradient id="dSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="60%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <linearGradient id="wallGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="40%" stop-color="#64748B"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <linearGradient id="redPillar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7F1D1D"/>
      <stop offset="50%" stop-color="#991B1B"/>
      <stop offset="100%" stop-color="#581C1C"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#dSky)"/>
  
  <!-- Sunset Glow -->
  <circle cx="240" cy="420" r="160" fill="#F97316" opacity="0.25"/>
  <circle cx="240" cy="420" r="100" fill="#FBBF24" opacity="0.35"/>

  <!-- Ancient Brick City Wall Massive Base (城台) -->
  <polygon points="0,620 800,560 800,1000 0,1000" fill="url(#wallGrad)"/>
  <!-- Battlement crenellations (垛口) -->
  <g fill="#334155">
    <rect x="40" y="590" width="50" height="40"/>
    <rect x="120" y="584" width="50" height="40"/>
    <rect x="200" y="578" width="50" height="40"/>
    <rect x="280" y="572" width="50" height="40"/>
    <rect x="360" y="566" width="50" height="40"/>
    <rect x="440" y="560" width="50" height="40"/>
    <rect x="520" y="554" width="50" height="40"/>
    <rect x="600" y="548" width="50" height="40"/>
    <rect x="680" y="542" width="50" height="40"/>
  </g>

  <!-- Corner Tower Wooden Structure (木构角楼) -->
  <!-- Pillars -->
  <rect x="260" y="380" width="18" height="180" fill="url(#redPillar)"/>
  <rect x="340" y="375" width="18" height="185" fill="url(#redPillar)"/>
  <rect x="420" y="370" width="18" height="190" fill="url(#redPillar)"/>
  <rect x="500" y="365" width="18" height="195" fill="url(#redPillar)"/>
  
  <!-- Tower Balcony & Rails -->
  <rect x="230" y="490" width="320" height="16" fill="#1E1B18"/>

  <!-- Mid Roof Hip & Gable (歇山顶) -->
  <path d="M180,380 Q380,410 580,370 L610,405 Q380,445 150,415 Z" fill="#1C1917"/>
  <polygon points="220,380 380,290 540,370" fill="#78350F"/>

  <!-- Upper Roof (重檐) -->
  <path d="M220,290 Q380,315 540,285 L560,305 Q380,335 200,310 Z" fill="#0C0A09"/>
  <!-- Ridge ornaments / Chiwen (鸱吻) -->
  <path d="M215,285 Q205,260 220,250 Q230,270 235,285 Z" fill="#B45309"/>
  <path d="M545,280 Q555,255 540,245 Q530,265 525,280 Z" fill="#B45309"/>

  <!-- Seal / Stamp Watermark -->
  <rect x="680" y="850" width="70" height="70" fill="#991B1B" rx="4"/>
  <text x="715" y="882" fill="#FEE2E2" font-family="serif" font-size="14" font-weight="bold" text-anchor="middle">大同</text>
  <text x="715" y="904" fill="#FEE2E2" font-family="serif" font-size="14" font-weight="bold" text-anchor="middle">营造</text>
</svg>`;

export const SAMPLE_HERITAGE_PHOTOS: SamplePhoto[] = [
  {
    id: 'sample-yingxian-pagoda',
    name: '应县木塔_辽代斗拱与飞檐.png',
    size: 245800,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(yingxianSvg)}`,
    type: 'image/svg+xml',
  },
  {
    id: 'sample-datong-ancient-city',
    name: '大同古城_角楼与夯土城台.png',
    size: 218400,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(datongSvg)}`,
    type: 'image/svg+xml',
  },
];
