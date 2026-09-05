export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'switch'
  | 'slider'
  | 'tags'
  | 'file'
  | 'code';

export interface FieldOption {
  label: string;
  value: string | number;
}

export interface FormFieldValidation {
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultValue?: any;
  required?: boolean;
  options?: FieldOption[];
  description?: string;
  validation?: FormFieldValidation;
  language?: string; // for 'code' type (e.g. 'typescript', 'python', 'json')
  accept?: string; // for 'file' type (e.g. 'image/*', '.txt,.md,.json')
  group?: string;
  multiple?: boolean;
  uploadPreset?: 'image' | 'document' | 'any';
}

export interface OutputConfig {
  renderType:
    | 'markdown'
    | 'code'
    | 'json'
    | 'structured'
    | 'diff'
    | 'poster'
    | 'image'
    | 'social-cards'
    | 'web-deck'
    | 'presentation'
    | 'html'
    | 'web-preview';
  suggestedActions: ('copy' | 'download' | 'share' | 'fullscreen' | 'rerun' | 'compare')[];
  customLayout?: 'single' | 'split' | 'tabs';
  posterConfig?: {
    theme?: string;
    defaultAspect?: string;
    brandColor?: string;
    showComparison?: boolean;
    showStoryboard?: boolean;
  };
  socialCardsConfig?: {
    defaultPlatform?: string;
    defaultStyle?: string;
    defaultTheme?: string;
    pageCount?: number;
  };
  deckConfig?: {
    defaultStyle?: string;
    defaultTheme?: string;
    durationPages?: number;
    speakerNotes?: boolean;
  };
}

export interface UISchema {
  title: string;
  subtitle?: string;
  fields: FormField[];
  outputConfig: OutputConfig;
}

export interface DetectedEndpoint {
  name: string;
  url: string;
  method: string;
  description?: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  bodyTemplate?: string;
}

export interface SkillModelConfig {
  model?: string;
  temperature?: number;
  topP?: number;
  thinkingLevel?: 'HIGH' | 'LOW' | 'MINIMAL';
}

export interface SkillFile {
  path: string;
  name: string;
  type: 'file' | 'dir';
  size?: number;
  content?: string;
  language?: string;
  downloadUrl?: string;
}

export interface RepositoryInfo {
  owner?: string;
  repo?: string;
  branch?: string;
  url?: string;
  totalFiles?: number;
  stars?: number;
}

export interface Skill {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'coding' | 'writing' | 'analysis' | 'productivity' | 'design' | 'utilities' | 'custom';
  tags: string[];
  rawSource: {
    type: 'file' | 'url' | 'text' | 'github';
    content: string;
    originalName?: string;
    url?: string;
  };
  files?: SkillFile[];
  repositoryInfo?: RepositoryInfo;
  activeFilePath?: string;
  systemInstruction: string;
  uiSchema: UISchema;
  detectedEndpoints?: DetectedEndpoint[];
  hasExternalEndpoints?: boolean;
  enginePreference: 'gemini' | 'api' | 'hybrid'; // Default: 'gemini'
  modelConfig?: SkillModelConfig;
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  isBuiltIn?: boolean;
  runCount?: number;
  sampleInputs?: Record<string, any>;
}

export interface ExecutionRecord {
  id: string;
  skillId: string;
  skillTitle: string;
  timestamp: number;
  engineUsed: 'gemini' | 'api' | 'hybrid';
  inputValues: Record<string, any>;
  outputResult: string;
  structuredOutput?: any;
  status: 'success' | 'error' | 'running';
  durationMs: number;
  errorMessage?: string;
}

export type ActiveTab = 'explore' | 'runner' | 'editor' | 'history' | 'docs';
