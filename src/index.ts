#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { A11yRobotServer } from './server/a11y-robot-server.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    const server = new Server(
      {
        name: 'a11y-robot',
        version: '1.0.0',
      }
    );

    // Create our a11y robot server instance
    const a11yRobot = new A11yRobotServer();

    // Handle list tools request
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_static_accessibility',
            description: 'Analyze Angular/TypeScript source code for accessibility issues',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to the Angular project directory',
                },
                includePatterns: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'File patterns to include (optional)',
                  default: ['**/*.ts', '**/*.html', '**/*.scss', '**/*.css'],
                },
                excludePatterns: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'File patterns to exclude (optional)',
                  default: ['node_modules/**', 'dist/**', '**/*.spec.ts'],
                },
              },
              required: ['projectPath'],
            },
          },
          {
            name: 'analyze_dynamic_accessibility',
            description: 'Analyze running web application for accessibility issues using browser automation',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL of the web application to analyze',
                },
                pages: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Additional pages to analyze (optional)',
                  default: [],
                },
                waitForSelector: {
                  type: 'string',
                  description: 'CSS selector to wait for before analyzing (optional)',
                },
                timeout: {
                  type: 'number',
                  description: 'Timeout in milliseconds (optional)',
                  default: 30000,
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'generate_accessibility_report',
            description: 'Generate HTML report from accessibility analysis results',
            inputSchema: {
              type: 'object',
              properties: {
                outputPath: {
                  type: 'string',
                  description: 'Path where the HTML report should be saved',
                },
                title: {
                  type: 'string',
                  description: 'Title for the report (optional)',
                  default: 'Accessibility Analysis Report',
                },
                includeWcagLinks: {
                  type: 'boolean',
                  description: 'Include links to WCAG 2.0 guidelines (optional)',
                  default: true,
                },
              },
              required: ['outputPath'],
            },
          },
          {
            name: 'get_wcag_guidelines',
            description: 'Fetch and parse WCAG 2.0 guidelines for reference',
            inputSchema: {
              type: 'object',
              properties: {
                criterion: {
                  type: 'string',
                  description: 'Specific WCAG criterion to fetch (e.g., "1.1.1") (optional)',
                },
                level: {
                  type: 'string',
                  enum: ['A', 'AA', 'AAA'],
                  description: 'WCAG conformance level (optional)',
                },
              },
              required: [],
            },
          },
        ],
      };
    });

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_static_accessibility':
            return await a11yRobot.analyzeStaticAccessibility(args as any);

          case 'analyze_dynamic_accessibility':
            return await a11yRobot.analyzeDynamicAccessibility(args as any);

          case 'generate_accessibility_report':
            return await a11yRobot.generateAccessibilityReport(args as any);

          case 'get_wcag_guidelines':
            return await a11yRobot.getWcagGuidelines(args as any);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute tool ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    // Start the server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('A11y Robot MCP server started successfully');

  } catch (error) {
    logger.error('Failed to start A11y Robot MCP server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
}); 