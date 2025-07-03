import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import type { StaticAnalysisOptions, AnalysisResult, AccessibilityIssue } from '../types/index.js';

export class StaticAnalyzer {
  private readonly defaultIncludePatterns = ['**/*.ts', '**/*.html', '**/*.scss', '**/*.css'];
  private readonly defaultExcludePatterns = ['node_modules/**', 'dist/**', '**/*.spec.ts', '**/*.test.ts'];

  async analyze(options: StaticAnalysisOptions): Promise<AnalysisResult> {
    try {
      logger.info(`Starting static analysis of: ${options.projectPath}`);

      const includePatterns = options.includePatterns || this.defaultIncludePatterns;
      const excludePatterns = options.excludePatterns || this.defaultExcludePatterns;

      // Find all relevant files
      const files = await this.findFiles(options.projectPath, includePatterns, excludePatterns);
      logger.info(`Found ${files.length} files to analyze`);

      // Analyze files
      const allIssues: AccessibilityIssue[] = [];
      
      for (const filePath of files) {
        const fileIssues = await this.analyzeFile(filePath, options.projectPath);
        allIssues.push(...fileIssues);
      }

      // Calculate summary
      const summary = this.calculateSummary(allIssues);

      const result: AnalysisResult = {
        issues: allIssues,
        summary,
        analysisType: 'static',
        timestamp: new Date().toISOString(),
        projectPath: options.projectPath
      };

      logger.info(`Static analysis completed. Found ${allIssues.length} issues.`);
      return result;

    } catch (error) {
      logger.error('Static analysis failed:', error);
      throw error;
    }
  }

  private async findFiles(projectPath: string, includePatterns: string[], excludePatterns: string[]): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of includePatterns) {
      const files = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        ignore: excludePatterns
      });
      allFiles.push(...files);
    }

    // Remove duplicates
    return [...new Set(allFiles)];
  }

  private async analyzeFile(filePath: string, projectPath: string): Promise<AccessibilityIssue[]> {
    try {
      const relativePath = path.relative(projectPath, filePath);
      const extension = path.extname(filePath).toLowerCase();
      const content = await fs.readFile(filePath, 'utf8');

      switch (extension) {
        case '.html':
          return this.analyzeHtmlTemplate(content, relativePath);
        case '.ts':
          return this.analyzeTypeScriptFile(content, relativePath);
        case '.scss':
        case '.css':
          return this.analyzeCssFile(content, relativePath);
        default:
          return [];
      }
    } catch (error) {
      logger.warn(`Failed to analyze file ${filePath}:`, error);
      return [];
    }
  }

  private analyzeHtmlTemplate(content: string, filePath: string): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const $ = cheerio.load(content);

    // Check for images without alt attributes
    $('img').each((index, element) => {
      const $img = $(element);
      const alt = $img.attr('alt');
      const src = $img.attr('src');

      if (alt === undefined) {
        issues.push({
          id: `img-alt-${index}`,
          rule: 'Images must have alt attributes',
          severity: 'serious',
          wcagLevel: 'A',
          wcagCriterion: '1.1.1',
          description: 'Image elements must have an alt attribute to provide alternative text for screen readers.',
          helpText: 'Add an alt attribute that describes the image content or use alt="" for decorative images.',
          wcagUrl: 'https://www.w3.org/TR/WCAG20/#text-equiv-all',
          element: src ? `<img src="${src}">` : '<img>',
          selector: 'img',
          file: filePath,
          source: 'static'
        });
      }
    });

    // Check for form inputs without labels
    $('input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="tel"], input[type="url"], textarea, select').each((index, element) => {
      const $input = $(element);
      const id = $input.attr('id');
      const ariaLabel = $input.attr('aria-label');
      const ariaLabelledby = $input.attr('aria-labelledby');
      const type = $input.attr('type') || $input.prop('tagName')?.toLowerCase() || 'input';

      // Check if input has a label
      let hasLabel = false;
      if (id) {
        hasLabel = $(`label[for="${id}"]`).length > 0;
      }

      if (!hasLabel && !ariaLabel && !ariaLabelledby) {
        issues.push({
          id: `input-label-${index}`,
          rule: 'Form inputs must have labels',
          severity: 'serious',
          wcagLevel: 'A',
          wcagCriterion: '1.3.1',
          description: 'Form input elements must have associated labels to be accessible to screen readers.',
          helpText: 'Add a <label> element with a "for" attribute matching the input\'s id, or use aria-label or aria-labelledby.',
          wcagUrl: 'https://www.w3.org/TR/WCAG20/#content-structure-separation-programmatic',
          element: `<${type}>`,
          selector: type,
          file: filePath,
          source: 'static'
        });
      }
    });

    // Check for proper heading hierarchy
    const headings = $('h1, h2, h3, h4, h5, h6').toArray();
    let previousLevel = 0;
    
    headings.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      const currentLevel = parseInt(tagName.charAt(1));
      
      if (currentLevel > previousLevel + 1) {
        issues.push({
          id: `heading-hierarchy-${index}`,
          rule: 'Heading levels should not be skipped',
          severity: 'moderate',
          wcagLevel: 'AA',
          wcagCriterion: '1.3.1',
          description: 'Heading levels should be used in sequential order without skipping levels.',
          helpText: `Use h${previousLevel + 1} instead of h${currentLevel} to maintain proper heading hierarchy.`,
          wcagUrl: 'https://www.w3.org/TR/WCAG20/#content-structure-separation-programmatic',
          element: `<${tagName}>`,
          selector: tagName,
          file: filePath,
          source: 'static'
        });
      }
      
      previousLevel = currentLevel;
    });

    return issues;
  }

  private analyzeTypeScriptFile(content: string, filePath: string): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for Angular component template accessibility
    if (this.isAngularComponent(content)) {
      // Look for inline templates
      const templateMatch = content.match(/template\s*:\s*`([^`]*)`/s);
      if (templateMatch) {
        const templateContent = templateMatch[1];
        const templateIssues = this.analyzeHtmlTemplate(templateContent, filePath);
        issues.push(...templateIssues);
      }

      // Check for missing trackBy in *ngFor
      const ngForMatches = content.match(/\*ngFor="[^"]*"/g);
      if (ngForMatches) {
        ngForMatches.forEach((match, index) => {
          if (!match.includes('trackBy')) {
            issues.push({
              id: `ngfor-trackby-${index}`,
              rule: '*ngFor should use trackBy for performance and accessibility',
              severity: 'minor',
              wcagLevel: 'AA',
              wcagCriterion: '2.4.3',
              description: 'Using trackBy in *ngFor helps screen readers maintain context when list items change.',
              helpText: 'Add trackBy function to *ngFor directive to improve performance and accessibility.',
              wcagUrl: 'https://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-order',
              element: match,
              file: filePath,
              source: 'static'
            });
          }
        });
      }
    }

    return issues;
  }

  private analyzeCssFile(content: string, filePath: string): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for focus indicators
    const focusSelectors = [':focus', ':focus-visible', ':focus-within'];
    const hasFocusStyles = focusSelectors.some(selector => content.includes(selector));

    if (!hasFocusStyles && content.includes('outline')) {
      const outlineNoneMatches = content.match(/outline\s*:\s*none/g);
      if (outlineNoneMatches) {
        issues.push({
          id: 'outline-none-focus',
          rule: 'Do not remove focus indicators without replacement',
          severity: 'serious',
          wcagLevel: 'AA',
          wcagCriterion: '2.4.7',
          description: 'Removing focus indicators without providing alternative focus styles makes it difficult for keyboard users to navigate.',
          helpText: 'If you remove the default outline, provide alternative focus styles using :focus or :focus-visible.',
          wcagUrl: 'https://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-visible',
          element: 'outline: none',
          file: filePath,
          source: 'static'
        });
      }
    }

    return issues;
  }

  private isAngularComponent(content: string): boolean {
    return content.includes('@Component') || content.includes('templateUrl') || content.includes('styleUrls');
  }

  private calculateSummary(issues: AccessibilityIssue[]) {
    const summary = {
      total: issues.length,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0
    };

    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          summary.critical++;
          break;
        case 'serious':
          summary.serious++;
          break;
        case 'moderate':
          summary.moderate++;
          break;
        case 'minor':
          summary.minor++;
          break;
      }
    }

    return summary;
  }
} 