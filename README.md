# A11y Robot - MCP Server for Accessibility Testing

A comprehensive accessibility testing tool built as an MCP (Model Context Protocol) server for analyzing Angular and TypeScript applications. The tool integrates with GitHub Copilot and Cursor to provide accessibility analysis capabilities.

## Features

- **Static Analysis**: Analyzes Angular/TypeScript source code for accessibility issues
- **Dynamic Analysis**: Uses Playwright to test running web applications with axe-core
- **WCAG 2.0 Guidelines**: Fetches and references official WCAG 2.0 guidelines
- **HTML Reports**: Generates comprehensive HTML reports with severity sorting
- **MCP Integration**: Works as a local MCP server with GitHub Copilot and Cursor

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

## Usage

### Running the MCP Server

```bash
npm start
```

The server will start and listen for MCP protocol connections.

### Available Tools

The MCP server provides four main tools:

#### 1. Static Accessibility Analysis
Analyzes Angular/TypeScript source code for accessibility issues.

```javascript
{
  "name": "analyze_static_accessibility",
  "arguments": {
    "projectPath": "/path/to/your/angular/project",
    "includePatterns": ["**/*.ts", "**/*.html", "**/*.scss", "**/*.css"],
    "excludePatterns": ["node_modules/**", "dist/**", "**/*.spec.ts"]
  }
}
```

#### 2. Dynamic Accessibility Analysis
Analyzes running web applications using browser automation.

```javascript
{
  "name": "analyze_dynamic_accessibility",
  "arguments": {
    "url": "https://your-app.com",
    "pages": ["https://your-app.com/page1", "https://your-app.com/page2"],
    "waitForSelector": ".main-content",
    "timeout": 30000
  }
}
```

#### 3. Generate Accessibility Report
Creates an HTML report from analysis results.

```javascript
{
  "name": "generate_accessibility_report",
  "arguments": {
    "outputPath": "./accessibility-report.html",
    "title": "My App Accessibility Report",
    "includeWcagLinks": true
  }
}
```

#### 4. Get WCAG Guidelines
Fetches WCAG 2.0 guidelines for reference.

```javascript
{
  "name": "get_wcag_guidelines",
  "arguments": {
    "criterion": "1.1.1",
    "level": "AA"
  }
}
```

## Accessibility Rules

The tool checks for various accessibility issues including:

### HTML Rules
- Missing alt attributes on images
- Form inputs without labels
- Buttons without accessible names
- Heading hierarchy issues

### ARIA Rules
- Missing accessible names for ARIA roles
- Missing aria-expanded attributes
- Invalid ARIA attribute usage

### Angular Rules
- Missing trackBy in *ngFor directives
- Focus management issues
- Component accessibility patterns

### Keyboard Navigation
- Missing focus indicators
- Keyboard accessibility issues
- Tab order problems

### Color & Contrast
- Insufficient color contrast
- Information conveyed by color alone

## Configuration

The tool uses sensible defaults but can be configured:

- **Include/Exclude Patterns**: Customize which files to analyze
- **WCAG Levels**: Filter by A, AA, or AAA compliance levels
- **Severity Levels**: Focus on critical, serious, moderate, or minor issues
- **Browser Settings**: Configure Playwright browser options

## Integration with IDEs

### GitHub Copilot
1. Configure the MCP server in your GitHub Copilot settings
2. Use the accessibility tools directly in your code editor

### Cursor
1. Add the MCP server to your Cursor configuration
2. Access accessibility analysis through the Cursor interface

## Development

### Project Structure
```
src/
├── analyzers/          # Static and dynamic analyzers
├── services/           # WCAG service and report generator
├── rules/             # Accessibility rule definitions
├── types/             # TypeScript type definitions
├── utils/             # Logger and utilities
├── server/            # Main MCP server implementation
└── index.ts           # Entry point
```

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **Playwright Installation**: Make sure to install Playwright browsers:
   ```bash
   npx playwright install
   ```

2. **Network Access**: The tool needs internet access to fetch WCAG guidelines

3. **File Permissions**: Ensure the tool has read access to your project files

4. **Browser Issues**: Check that Chromium can launch properly for dynamic analysis

### Debug Mode

Set the DEBUG environment variable to enable debug logging:
```bash
DEBUG=true npm start
```

## WCAG 2.0 Compliance

This tool helps you achieve WCAG 2.0 compliance by:
- Identifying accessibility violations
- Providing actionable remediation guidance
- Linking to official WCAG documentation
- Categorizing issues by severity and WCAG level

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the GitHub issues
3. Create a new issue with detailed information

---

**A11y Robot** - Making web accessibility testing accessible to everyone. 