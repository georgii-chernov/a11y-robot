import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { logger } from '../utils/logger.js';
import type { DynamicAnalysisOptions, AnalysisResult, AccessibilityIssue } from '../types/index.js';

export class DynamicAnalyzer {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async analyze(options: DynamicAnalysisOptions): Promise<AnalysisResult> {
    try {
      logger.info(`Starting dynamic analysis of: ${options.url}`);

      // Launch browser with accessibility settings
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--force-prefers-reduced-motion',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--no-sandbox'
        ]
      });

      // Create context with accessibility-friendly settings
      this.context = await this.browser.newContext({
        reducedMotion: 'reduce',
        colorScheme: 'light',
        viewport: { width: 1280, height: 720 },
        userAgent: 'A11y-Robot/1.0.0 (Accessibility Analysis Tool)'
      });

      // Analyze main page
      const mainPageIssues = await this.analyzePage(options.url, options);
      let allIssues: AccessibilityIssue[] = [...mainPageIssues];

      // Analyze additional pages if specified
      if (options.pages && options.pages.length > 0) {
        for (const pageUrl of options.pages) {
          try {
            const pageIssues = await this.analyzePage(pageUrl, options);
            allIssues.push(...pageIssues);
          } catch (error) {
            logger.warn(`Failed to analyze page ${pageUrl}:`, error);
          }
        }
      }

      // Calculate summary
      const summary = this.calculateSummary(allIssues);

      const result: AnalysisResult = {
        issues: allIssues,
        summary,
        analysisType: 'dynamic',
        timestamp: new Date().toISOString(),
        url: options.url
      };

      logger.info(`Dynamic analysis completed. Found ${allIssues.length} issues.`);
      return result;

    } catch (error) {
      logger.error('Dynamic analysis failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async analyzePage(url: string, options: DynamicAnalysisOptions): Promise<AccessibilityIssue[]> {
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }

    const page = await this.context.newPage();
    
    try {
      // Set up page with timeout
      page.setDefaultTimeout(options.timeout || 30000);
      page.setDefaultNavigationTimeout(options.timeout || 30000);

      // Navigate to page
      logger.info(`Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle' });

      // Wait for specific selector if provided
      if (options.waitForSelector) {
        logger.info(`Waiting for selector: ${options.waitForSelector}`);
        await page.waitForSelector(options.waitForSelector);
      }

      // Wait for page to be fully loaded
      await page.waitForLoadState('domcontentloaded');

      // Inject axe-core
      await this.injectAxeCore(page);

      // Run axe-core analysis
      logger.info(`Running axe-core analysis on: ${url}`);
      const axeResults = await page.evaluate(() => {
        return (window as any).axe.run();
      });

      // Convert axe results to our format
      const issues = this.convertAxeResults(axeResults, url);

      return issues;

    } catch (error) {
      logger.error(`Failed to analyze page ${url}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  private async injectAxeCore(page: Page): Promise<void> {
    try {
      // Inject axe-core from CDN
      await page.addScriptTag({
        url: 'https://unpkg.com/axe-core@latest/axe.min.js'
      });

      // Wait for axe to be available
      await page.waitForFunction(() => typeof (window as any).axe !== 'undefined');

      // Configure axe-core
      await page.evaluate(() => {
        (window as any).axe.configure({
          rules: {
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'focus-management': { enabled: true },
            'aria-usage': { enabled: true },
            'semantic-structure': { enabled: true }
          }
        });
      });

      logger.debug('Axe-core injected and configured successfully');
    } catch (error) {
      logger.error('Failed to inject axe-core:', error);
      throw error;
    }
  }

  private convertAxeResults(axeResults: any, _url: string): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Process violations
    if (axeResults.violations) {
      axeResults.violations.forEach((violation: any, index: number) => {
        const severity = this.mapAxeSeverity(violation.impact);
        const wcagInfo = this.extractWcagInfo(violation.tags);

        violation.nodes.forEach((node: any, nodeIndex: number) => {
          issues.push({
            id: `axe-${violation.id}-${index}-${nodeIndex}`,
            rule: violation.id,
            severity,
            wcagLevel: wcagInfo.level,
            wcagCriterion: wcagInfo.criterion,
            description: violation.description,
            helpText: violation.help,
            wcagUrl: violation.helpUrl,
            element: node.html,
            selector: node.target.join(', '),
            source: 'dynamic'
          });
        });
      });
    }

    return issues;
  }

  private mapAxeSeverity(impact: string): 'critical' | 'serious' | 'moderate' | 'minor' {
    switch (impact) {
      case 'critical': return 'critical';
      case 'serious': return 'serious';
      case 'moderate': return 'moderate';
      case 'minor': return 'minor';
      default: return 'minor';
    }
  }

  private extractWcagInfo(tags: string[]): { level: 'A' | 'AA' | 'AAA'; criterion: string } {
    const wcagTag = tags.find(tag => tag.startsWith('wcag'));
    
    if (wcagTag) {
      const parts = wcagTag.split('');
      const level = parts.filter(p => p === 'a').length;
      const criterion = tags.find(tag => tag.match(/^\d+\.\d+\.\d+$/)) || 'Unknown';
      
      return {
        level: level === 1 ? 'A' : level === 2 ? 'AA' : 'AAA',
        criterion
      };
    }

    return { level: 'AA', criterion: 'Unknown' };
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

  private async cleanup(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      logger.warn('Cleanup failed:', error);
    }
  }
} 