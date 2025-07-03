export interface AccessibilityIssue {
  id: string;
  rule: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriterion: string;
  description: string;
  helpText: string;
  wcagUrl: string;
  element?: string;
  selector?: string;
  file?: string;
  line?: number;
  column?: number;
  source: 'static' | 'dynamic';
}

export interface AnalysisResult {
  issues: AccessibilityIssue[];
  summary: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  analysisType: 'static' | 'dynamic';
  timestamp: string;
  projectPath?: string;
  url?: string;
}

export interface WcagGuideline {
  id: string;
  level: 'A' | 'AA' | 'AAA';
  title: string;
  description: string;
  techniques: string[];
  url: string;
}

export interface StaticAnalysisOptions {
  projectPath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface DynamicAnalysisOptions {
  url: string;
  pages?: string[];
  waitForSelector?: string;
  timeout?: number;
}

export interface ReportGenerationOptions {
  outputPath: string;
  title?: string;
  includeWcagLinks?: boolean;
}

export interface WcagQueryOptions {
  criterion?: string;
  level?: 'A' | 'AA' | 'AAA';
}

export interface AngularTemplate {
  file: string;
  content: string;
  ast?: any;
}

export interface AngularComponent {
  file: string;
  content: string;
  template?: AngularTemplate;
  styles?: string[];
  className: string;
}

export interface AccessibilityRule {
  id: string;
  name: string;
  description: string;
  wcagCriterion: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  category: 'html' | 'angular' | 'aria' | 'color' | 'keyboard' | 'semantic';
  check: (element: any, context: any) => boolean;
  message: string;
  helpUrl: string;
} 