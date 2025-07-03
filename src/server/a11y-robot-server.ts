import { StaticAnalyzer } from '../analyzers/static-analyzer.js';
import { DynamicAnalyzer } from '../analyzers/dynamic-analyzer.js';
import { WcagService } from '../services/wcag-service.js';
import { ReportGenerator } from '../services/report-generator.js';
import { logger } from '../utils/logger.js';
import type {
  StaticAnalysisOptions,
  DynamicAnalysisOptions,
  ReportGenerationOptions,
  WcagQueryOptions,
  AnalysisResult,
  AccessibilityIssue,
} from '../types/index.js';

export class A11yRobotServer {
  private staticAnalyzer: StaticAnalyzer;
  private dynamicAnalyzer: DynamicAnalyzer;
  private wcagService: WcagService;
  private reportGenerator: ReportGenerator;
  private analysisResults: AnalysisResult[] = [];

  constructor() {
    this.staticAnalyzer = new StaticAnalyzer();
    this.dynamicAnalyzer = new DynamicAnalyzer();
    this.wcagService = new WcagService();
    this.reportGenerator = new ReportGenerator();
  }

  async analyzeStaticAccessibility(options: StaticAnalysisOptions): Promise<{
    content: Array<{
      type: 'text';
      text: string;
    }>;
  }> {
    try {
      logger.info(`Starting static accessibility analysis for: ${options.projectPath}`);
      
      const logCollector: string[] = [];
      const result = await this.staticAnalyzer.analyze(options, logCollector);
      this.analysisResults.push(result);
      
      const summary = this.formatAnalysisSummary(result);
      
      logger.info(`Static analysis completed. Found ${result.issues.length} issues.`);
      
      return {
        content: [
          {
            type: 'text',
            text: summary,
          },
          {
            type: 'text',
            text: `# Detailed Analysis Log\n\n${logCollector.join('\n')}`,
          },
        ],
      };
    } catch (error) {
      logger.error('Static analysis failed:', error);
      throw new Error(`Static analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async analyzeDynamicAccessibility(options: DynamicAnalysisOptions): Promise<{
    content: Array<{
      type: 'text';
      text: string;
    }>;
  }> {
    try {
      logger.info(`Starting dynamic accessibility analysis for: ${options.url}`);
      
      const result = await this.dynamicAnalyzer.analyze(options);
      this.analysisResults.push(result);
      
      const summary = this.formatAnalysisSummary(result);
      
      logger.info(`Dynamic analysis completed. Found ${result.issues.length} issues.`);
      
      return {
        content: [
          {
            type: 'text',
            text: summary,
          },
        ],
      };
    } catch (error) {
      logger.error('Dynamic analysis failed:', error);
      throw new Error(`Dynamic analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateAccessibilityReport(options: ReportGenerationOptions): Promise<{
    content: Array<{
      type: 'text';
      text: string;
    }>;
  }> {
    try {
      logger.info(`Generating accessibility report: ${options.outputPath}`);
      
      if (this.analysisResults.length === 0) {
        throw new Error('No analysis results available. Please run static or dynamic analysis first.');
      }
      
      // Combine all analysis results
      const allIssues: AccessibilityIssue[] = [];
      this.analysisResults.forEach(result => {
        allIssues.push(...result.issues);
      });
      
      // Sort by severity (critical > serious > moderate > minor)
      const severityOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
      allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
      
      const combinedResult: AnalysisResult = {
        issues: allIssues,
        summary: this.calculateSummary(allIssues),
        analysisType: 'static' as const,
        timestamp: new Date().toISOString(),
      };
      
      const reportPath = await this.reportGenerator.generate(combinedResult, options);
      
      logger.info(`Report generated successfully: ${reportPath}`);
      
      return {
        content: [
          {
            type: 'text',
            text: `Accessibility report generated successfully!\n\nReport saved to: ${reportPath}\n\nSummary:\n${this.formatAnalysisSummary(combinedResult)}`,
          },
        ],
      };
    } catch (error) {
      logger.error('Report generation failed:', error);
      throw new Error(`Report generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getWcagGuidelines(options: WcagQueryOptions): Promise<{
    content: Array<{
      type: 'text';
      text: string;
    }>;
  }> {
    try {
      logger.info('Fetching WCAG guidelines...');
      
      const guidelines = await this.wcagService.getGuidelines(options);
      
      let response = '# WCAG 2.0 Guidelines\n\n';
      
      if (guidelines.length === 0) {
        response += 'No guidelines found matching your criteria.\n';
      } else {
        guidelines.forEach(guideline => {
          response += `## ${guideline.id} - ${guideline.title} (Level ${guideline.level})\n\n`;
          response += `**Description:** ${guideline.description}\n\n`;
          response += `**URL:** ${guideline.url}\n\n`;
          if (guideline.techniques.length > 0) {
            response += `**Techniques:** ${guideline.techniques.join(', ')}\n\n`;
          }
          response += '---\n\n';
        });
      }
      
      logger.info(`Retrieved ${guidelines.length} WCAG guidelines`);
      
      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      };
    } catch (error) {
      logger.error('Failed to fetch WCAG guidelines:', error);
      throw new Error(`Failed to fetch WCAG guidelines: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private formatAnalysisSummary(result: AnalysisResult): string {
    const { summary, analysisType, timestamp } = result;
    
    return `# Accessibility Analysis Summary

**Analysis Type:** ${analysisType}
**Timestamp:** ${timestamp}
**Total Issues Found:** ${summary.total}

## Issue Breakdown by Severity:
- 🔴 **Critical:** ${summary.critical} issues
- 🟠 **Serious:** ${summary.serious} issues  
- 🟡 **Moderate:** ${summary.moderate} issues
- 🟢 **Minor:** ${summary.minor} issues

## Top Issues Found:
${result.issues.slice(0, 10).map((issue, index) => {
  const severityIcon = this.getSeverityIcon(issue.severity);
  return `${index + 1}. ${severityIcon} **${issue.rule}** (${issue.wcagCriterion})\n   ${issue.description}\n   ${issue.file ? `File: ${issue.file}` : `Element: ${issue.element || 'N/A'}`}`;
}).join('\n\n')}

${result.issues.length > 10 ? `\n*...and ${result.issues.length - 10} more issues*` : ''}

Run 'generate_accessibility_report' to create a detailed HTML report with all findings.`;
  }

  private getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical': return '🔴';
      case 'serious': return '🟠';
      case 'moderate': return '🟡';
      case 'minor': return '🟢';
      default: return '⚪';
    }
  }

  private calculateSummary(issues: AccessibilityIssue[]) {
    return {
      total: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      serious: issues.filter(i => i.severity === 'serious').length,
      moderate: issues.filter(i => i.severity === 'moderate').length,
      minor: issues.filter(i => i.severity === 'minor').length,
    };
  }
}
