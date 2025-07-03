import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs-extra';
import * as path from 'path';
import { logger } from '../utils/logger.js';
import type { WcagGuideline, WcagQueryOptions } from '../types/index.js';

interface WcagCache {
  guidelines: WcagGuideline[];
  timestamp: string;
}

export class WcagService {
  private readonly wcagUrl = 'https://www.w3.org/TR/WCAG20/';
  private readonly cacheDir = path.join(process.cwd(), '.cache', 'wcag');
  private readonly cacheFile = path.join(this.cacheDir, 'guidelines.json');
  private readonly cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private guidelines: WcagGuideline[] = [];
  private cacheLoaded = false;

  constructor() {
    this.ensureCacheDir();
  }

  async getGuidelines(options: WcagQueryOptions = {}): Promise<WcagGuideline[]> {
    try {
      await this.loadGuidelines();
      
      let filteredGuidelines = this.guidelines;

      // Filter by specific criterion
      if (options.criterion) {
        filteredGuidelines = filteredGuidelines.filter(g => 
          g.id.toLowerCase().includes(options.criterion!.toLowerCase()) ||
          g.title.toLowerCase().includes(options.criterion!.toLowerCase()) ||
          g.description.toLowerCase().includes(options.criterion!.toLowerCase())
        );
      }

      // Filter by level
      if (options.level) {
        filteredGuidelines = filteredGuidelines.filter(g => g.level === options.level);
      }

      logger.info(`Retrieved ${filteredGuidelines.length} WCAG guidelines`);
      return filteredGuidelines;
    } catch (error) {
      logger.error('Failed to get WCAG guidelines:', error);
      throw error;
    }
  }

  private async loadGuidelines(): Promise<void> {
    if (this.cacheLoaded) {
      return;
    }

    try {
      // Try to load from cache first
      if (await this.loadFromCache()) {
        this.cacheLoaded = true;
        return;
      }

      // Cache miss or expired, fetch from web
      logger.info('Fetching WCAG guidelines from web...');
      this.guidelines = await this.fetchGuidelinesFromWeb();
      
      // Save to cache
      await this.saveToCache();
      this.cacheLoaded = true;
      
      logger.info(`Loaded ${this.guidelines.length} WCAG guidelines from web`);
    } catch (error) {
      logger.error('Failed to load WCAG guidelines:', error);
      throw error;
    }
  }

  private async loadFromCache(): Promise<boolean> {
    try {
      if (!await fs.pathExists(this.cacheFile)) {
        return false;
      }

      const cacheData: WcagCache = await fs.readJson(this.cacheFile);
      const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();

      if (cacheAge > this.cacheMaxAge) {
        logger.info('WCAG cache expired, will fetch from web');
        return false;
      }

      this.guidelines = cacheData.guidelines;
      logger.info(`Loaded ${this.guidelines.length} WCAG guidelines from cache`);
      return true;
    } catch (error) {
      logger.warn('Failed to load WCAG cache:', error);
      return false;
    }
  }

  private async saveToCache(): Promise<void> {
    try {
      const cacheData: WcagCache = {
        guidelines: this.guidelines,
        timestamp: new Date().toISOString()
      };

      await fs.writeJson(this.cacheFile, cacheData, { spaces: 2 });
      logger.debug('WCAG guidelines saved to cache');
    } catch (error) {
      logger.warn('Failed to save WCAG cache:', error);
    }
  }

  private async fetchGuidelinesFromWeb(): Promise<WcagGuideline[]> {
    try {
      const response = await axios.get(this.wcagUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'A11y-Robot/1.0.0 (Accessibility Analysis Tool)'
        }
      });

      const $ = cheerio.load(response.data);
      const guidelines: WcagGuideline[] = [];

              // Parse WCAG 2.0 structure
        $('.guideline').each((_i, element) => {
        const $guideline = $(element);
        
        // Extract guideline ID and title
        const header = $guideline.find('h3').first();
        const idMatch = header.text().match(/^(\d+\.\d+)\s+(.+)$/);
        
        if (!idMatch) return;

        const id = idMatch[1];
        const title = idMatch[2];

        // Extract description
        const description = $guideline.find('p').first().text().trim();

        // Extract success criteria
        const successCriteria: WcagGuideline[] = [];
        $guideline.find('.sc').each((_j, scElement) => {
          const $sc = $(scElement);
          const scHeader = $sc.find('h4').first();
          const scIdMatch = scHeader.text().match(/^(\d+\.\d+\.\d+)\s+(.+)\s+\(Level\s+([A]+)\)$/);
          
          if (!scIdMatch) return;

          const scId = scIdMatch[1];
          const scTitle = scIdMatch[2];
          const scLevel = scIdMatch[3] as 'A' | 'AA' | 'AAA';

          const scDescription = $sc.find('p').first().text().trim();

          // Extract techniques
          const techniques: string[] = [];
          $sc.find('.technique').each((_k, techElement) => {
            const techText = $(techElement).text().trim();
            if (techText) {
              techniques.push(techText);
            }
          });

          successCriteria.push({
            id: scId,
            title: scTitle,
            level: scLevel,
            description: scDescription,
            techniques,
            url: `${this.wcagUrl}#${scId.replace(/\./g, '-')}`
          });
        });

        // Add main guideline
        guidelines.push({
          id,
          title,
          level: 'A', // Guidelines don't have levels, success criteria do
          description,
          techniques: [],
          url: `${this.wcagUrl}#${id.replace(/\./g, '-')}`
        });

        // Add success criteria
        guidelines.push(...successCriteria);
      });

      // If parsing failed, create some default guidelines
      if (guidelines.length === 0) {
        guidelines.push(...this.getDefaultGuidelines());
      }

      return guidelines;
    } catch (error) {
      logger.error('Failed to fetch WCAG guidelines from web:', error);
      // Return default guidelines as fallback
      return this.getDefaultGuidelines();
    }
  }

  private getDefaultGuidelines(): WcagGuideline[] {
    return [
      {
        id: '1.1.1',
        title: 'Non-text Content',
        level: 'A',
        description: 'All non-text content that is presented to the user has a text alternative that serves the equivalent purpose.',
        techniques: ['H37', 'H36', 'H35', 'H53'],
        url: 'https://www.w3.org/TR/WCAG20/#text-equiv-all'
      },
      {
        id: '1.3.1',
        title: 'Info and Relationships',
        level: 'A',
        description: 'Information, structure, and relationships conveyed through presentation can be programmatically determined.',
        techniques: ['H44', 'H65', 'H71', 'H85'],
        url: 'https://www.w3.org/TR/WCAG20/#content-structure-separation-programmatic'
      },
      {
        id: '1.4.3',
        title: 'Contrast (Minimum)',
        level: 'AA',
        description: 'The visual presentation of text has a contrast ratio of at least 4.5:1.',
        techniques: ['G18', 'G145', 'G174'],
        url: 'https://www.w3.org/TR/WCAG20/#visual-audio-contrast-contrast'
      },
      {
        id: '2.1.1',
        title: 'Keyboard',
        level: 'A',
        description: 'All functionality is available from a keyboard.',
        techniques: ['G202', 'H91'],
        url: 'https://www.w3.org/TR/WCAG20/#keyboard-operation-keyboard-operable'
      },
      {
        id: '2.4.1',
        title: 'Bypass Blocks',
        level: 'A',
        description: 'A mechanism is available to bypass blocks of content that are repeated on multiple Web pages.',
        techniques: ['G1', 'G123', 'G124'],
        url: 'https://www.w3.org/TR/WCAG20/#navigation-mechanisms-skip'
      },
      {
        id: '3.1.1',
        title: 'Language of Page',
        level: 'A',
        description: 'The default human language of each Web page can be programmatically determined.',
        techniques: ['H57'],
        url: 'https://www.w3.org/TR/WCAG20/#meaning-doc-lang-id'
      },
      {
        id: '4.1.1',
        title: 'Parsing',
        level: 'A',
        description: 'Content implemented using markup languages has elements with complete start and end tags.',
        techniques: ['G134', 'G192', 'H88'],
        url: 'https://www.w3.org/TR/WCAG20/#ensure-compat-parses'
      },
      {
        id: '4.1.2',
        title: 'Name, Role, Value',
        level: 'A',
        description: 'For all user interface components, the name and role can be programmatically determined.',
        techniques: ['G135', 'H91'],
        url: 'https://www.w3.org/TR/WCAG20/#ensure-compat-rsv'
      }
    ];
  }

  private ensureCacheDir(): void {
    try {
      fs.ensureDirSync(this.cacheDir);
    } catch (error) {
      logger.warn('Failed to create cache directory:', error);
    }
  }
} 