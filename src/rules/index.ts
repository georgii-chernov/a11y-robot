import type { AccessibilityRule } from '../types/index.js';

// Basic HTML accessibility rules
export const htmlRules: AccessibilityRule[] = [
  {
    id: 'img-alt',
    name: 'Images must have alt attributes',
    description: 'All img elements must have an alt attribute to provide alternative text for screen readers.',
    wcagCriterion: '1.1.1',
    wcagLevel: 'A',
    severity: 'serious',
    category: 'html',
    check: (element: any) => {
      return element.tagName === 'IMG' && element.hasAttribute('alt');
    },
    message: 'Add an alt attribute that describes the image content or use alt="" for decorative images.',
    helpUrl: 'https://www.w3.org/TR/WCAG20/#text-equiv-all'
  },
  {
    id: 'form-labels',
    name: 'Form inputs must have labels',
    description: 'All form input elements must have associated labels to be accessible to screen readers.',
    wcagCriterion: '1.3.1',
    wcagLevel: 'A',
    severity: 'serious',
    category: 'html',
    check: (element: any) => {
      const inputTypes = ['text', 'email', 'password', 'number', 'tel', 'url'];
      if (element.tagName === 'INPUT' && inputTypes.includes(element.type)) {
        return element.hasAttribute('aria-label') || 
               element.hasAttribute('aria-labelledby') || 
               (element.id && document.querySelector(`label[for="${element.id}"]`));
      }
      return true;
    },
    message: 'Add a <label> element with a "for" attribute matching the input\'s id, or use aria-label or aria-labelledby.',
    helpUrl: 'https://www.w3.org/TR/WCAG20/#content-structure-separation-programmatic'
  },
  {
    id: 'button-name',
    name: 'Buttons must have accessible names',
    description: 'All button elements must have accessible names for screen readers.',
    wcagCriterion: '4.1.2',
    wcagLevel: 'A',
    severity: 'serious',
    category: 'html',
    check: (element: any) => {
      if (element.tagName === 'BUTTON') {
        return element.textContent?.trim() || 
               element.hasAttribute('aria-label') || 
               element.hasAttribute('aria-labelledby');
      }
      return true;
    },
    message: 'Add text content to the button or use aria-label or aria-labelledby attributes.',
    helpUrl: 'https://www.w3.org/TR/WCAG20/#ensure-compat-rsv'
  },
  {
    id: 'heading-hierarchy',
    name: 'Heading levels should not be skipped',
    description: 'Heading levels should be used in sequential order without skipping levels.',
    wcagCriterion: '1.3.1',
    wcagLevel: 'AA',
    severity: 'moderate',
    category: 'semantic',
    check: (_element: any, _context: any) => {
      // This check requires context of previous headings
      return true; // Implemented in static analyzer
    },
    message: 'Use headings in sequential order (h1, h2, h3, etc.) without skipping levels.',
    helpUrl: 'https://www.w3.org/TR/WCAG20/#content-structure-separation-programmatic'
  }
];

// ARIA accessibility rules
export const ariaRules: AccessibilityRule[] = [
  {
    id: 'aria-labels',
    name: 'Elements with ARIA roles must have accessible names',
    description: 'Elements with ARIA roles must have accessible names when required.',
    wcagCriterion: '4.1.2',
    wcagLevel: 'A',
    severity: 'serious',
    category: 'aria',
    check: (element: any) => {
      const role = element.getAttribute('role');
      if (role) {
        const rolesRequiringNames = ['button', 'link', 'menuitem', 'option', 'tab', 'treeitem'];
        if (rolesRequiringNames.includes(role)) {
          return element.textContent?.trim() || 
                 element.hasAttribute('aria-label') || 
                 element.hasAttribute('aria-labelledby');
        }
      }
      return true;
    },
    message: 'Elements with interactive ARIA roles must have accessible names.',
    helpUrl: 'https://www.w3.org/TR/WCAG20/#ensure-compat-rsv'
  },
  {
    id: 'aria-expanded',
    name: 'Expandable elements should have aria-expanded',
    description: 'Elements that can be expanded or collapsed should have aria-expanded attribute.',
    wcagCriterion: '4.1.2',
    wcagLevel: 'A',
    severity: 'moderate',
    category: 'aria',
    check: (element: any) => {
      const role = element.getAttribute('role');
      if (role === 'button' && element.getAttribute('aria-controls')) {
        return element.hasAttribute('aria-expanded');
      }
      return true;
    },
    message: 'Add aria-expanded attribute to indicate the expanded/collapsed state.',
    helpUrl: 'https://www.w3.org/TR/WCAG20/#ensure-compat-rsv'
  }
];

// Angular-specific accessibility rules
export const angularRules: AccessibilityRule[] = [
  {
    id: 'ngfor-trackby',
    name: '*ngFor should use trackBy for accessibility',
    description: 'Using trackBy in *ngFor helps screen readers maintain context when list items change.',
    wcagCriterion: '2.4.3',
    wcagLevel: 'AA',
    severity: 'minor',
    category: 'angular',
    check: (_element: any) => {
      // This is checked in the static analyzer
      return true;
    },
    message: 'Add trackBy function to *ngFor directive to improve performance and accessibility.',
    helpUrl: 'https://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-order'
  },
  {
    id: 'angular-focus-management',
    name: 'Angular components should manage focus appropriately',
    description: 'Angular components that show/hide content should manage focus for screen readers.',
    wcagCriterion: '2.4.3',
    wcagLevel: 'AA',
    severity: 'moderate',
    category: 'angular',
    check: (_element: any) => {
      // This would be checked in dynamic analysis
      return true;
    },
    message: 'Ensure focus is managed when dynamically showing/hiding content in Angular components.',
    helpUrl: 'https://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-order'
  }
];

// Keyboard navigation rules
export const keyboardRules: AccessibilityRule[] = [
  {
    id: 'keyboard-focus',
    name: 'Interactive elements must be keyboard accessible',
    description: 'All interactive elements must be reachable and operable via keyboard.',
    wcagCriterion: '2.1.1',
    wcagLevel: 'A',
    severity: 'serious',
    category: 'keyboard',
    check: (element: any) => {
      const interactiveElements = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
      if (interactiveElements.includes(element.tagName)) {
        return element.tabIndex !== -1 || element.hasAttribute('tabindex');
      }
      return true;
    },
    message: 'Ensure interactive elements are keyboard accessible with proper tabindex values.',
    helpUrl: 'https://www.w3.org/TR/WCAG20/#keyboard-operation-keyboard-operable'
  },
  {
    id: 'focus-visible',
    name: 'Focus indicators must be visible',
    description: 'Interactive elements must have visible focus indicators for keyboard users.',
    wcagCriterion: '2.4.7',
    wcagLevel: 'AA',
    severity: 'serious',
    category: 'keyboard',
    check: (_element: any) => {
      // This is checked in CSS analysis and dynamic analysis
      return true;
    },
    message: 'Provide visible focus styles using :focus or :focus-visible pseudo-classes.',
    helpUrl: 'https://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-visible'
  }
];

// Color and contrast rules
export const colorRules: AccessibilityRule[] = [
  {
    id: 'color-contrast',
    name: 'Text must have sufficient color contrast',
    description: 'Text must have a contrast ratio of at least 4.5:1 against its background.',
    wcagCriterion: '1.4.3',
    wcagLevel: 'AA',
    severity: 'serious',
    category: 'color',
    check: (_element: any) => {
      // This requires color analysis tools
      return true;
    },
    message: 'Ensure text has a contrast ratio of at least 4.5:1 against its background color.',
    helpUrl: 'https://www.w3.org/TR/WCAG20/#visual-audio-contrast-contrast'
  },
  {
    id: 'color-only-info',
    name: 'Information should not be conveyed by color alone',
    description: 'Information conveyed by color should also be available through other means.',
    wcagCriterion: '1.4.1',
    wcagLevel: 'A',
    severity: 'moderate',
    category: 'color',
    check: (_element: any) => {
      // This requires semantic analysis
      return true;
    },
    message: 'Provide additional indicators (text, icons, patterns) beyond color to convey information.',
    helpUrl: 'https://www.w3.org/TR/WCAG20/#visual-audio-contrast-without-color'
  }
];

// Export all rules
export const allRules: AccessibilityRule[] = [
  ...htmlRules,
  ...ariaRules,
  ...angularRules,
  ...keyboardRules,
  ...colorRules
];

// Rule registry for easy lookup
export const ruleRegistry = new Map<string, AccessibilityRule>();
allRules.forEach(rule => {
  ruleRegistry.set(rule.id, rule);
});

// Helper function to get rule by ID
export function getRuleById(id: string): AccessibilityRule | undefined {
  return ruleRegistry.get(id);
}

// Helper function to get rules by category
export function getRulesByCategory(category: string): AccessibilityRule[] {
  return allRules.filter(rule => rule.category === category);
}

// Helper function to get rules by WCAG level
export function getRulesByWcagLevel(level: 'A' | 'AA' | 'AAA'): AccessibilityRule[] {
  return allRules.filter(rule => rule.wcagLevel === level);
}

// Helper function to get rules by severity
export function getRulesBySeverity(severity: 'critical' | 'serious' | 'moderate' | 'minor'): AccessibilityRule[] {
  return allRules.filter(rule => rule.severity === severity);
} 