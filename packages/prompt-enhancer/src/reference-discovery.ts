import { promises as fs } from 'fs';
import { join } from 'path';
import { findProjectRoot } from './utils.js';

interface DiscoveredReference {
  type: 'url' | 'library' | 'package';
  value: string;
  context?: string;
}

export class ReferenceDiscovery {
  private projectPath: string;
  private packageDependencies: Set<string> = new Set();

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.loadPackageDependencies();
  }

  /**
   * Discover all references (URLs, libraries, packages) from a prompt
   */
  async discoverReferences(prompt: string): Promise<DiscoveredReference[]> {
    const references: DiscoveredReference[] = [];

    // Extract URLs
    const urls = this.extractUrls(prompt);
    references.push(...urls.map(url => ({
      type: 'url' as const,
      value: url,
      context: 'Found in prompt text'
    })));

    // Extract library/package references
    const libraries = await this.extractLibraries(prompt);
    references.push(...libraries);

    // Extract @-references (likely file paths or services)
    const atReferences = this.extractAtReferences(prompt);
    references.push(...atReferences.map(ref => ({
      type: 'package' as const,
      value: ref,
      context: '@-reference in prompt'
    })));

    return references;
  }

  /**
   * Extract URLs from prompt text
   */
  private extractUrls(prompt: string): string[] {
    const urlRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)/g;
    const matches = prompt.match(urlRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Extract library and package references
   */
  private async extractLibraries(prompt: string): Promise<DiscoveredReference[]> {
    const references: DiscoveredReference[] = [];

    // Check for known dependencies mentioned in the prompt
    const words = prompt.toLowerCase().split(/\s+/);
    for (const word of words) {
      // Remove punctuation and check if it matches a dependency
      const cleanWord = word.replace(/[^\w-@\/]/g, '');
      if (this.packageDependencies.has(cleanWord)) {
        references.push({
          type: 'library',
          value: cleanWord,
          context: 'Found in project dependencies'
        });
      }
    }

    // Look for npm package patterns like @scope/package
    const scopedPackageRegex = /@[\w-]+\/[\w-]+/g;
    const scopedMatches = prompt.match(scopedPackageRegex) || [];
    references.push(...scopedMatches.map(match => ({
      type: 'library' as const,
      value: match,
      context: 'Scoped package pattern'
    })));

    // Look for common library patterns
    const libraryPatterns = [
      /\b(react|vue|angular|svelte|nextjs|next\.js|express|fastify|koa)\b/gi,
      /\b(typescript|javascript|node\.js|bun|deno)\b/gi,
      /\b(prisma|mongoose|sequelize|typeorm)\b/gi,
      /\b(tailwind|bootstrap|material-ui|antd|chakra)\b/gi,
      /\b(jest|vitest|mocha|cypress|playwright)\b/gi,
      /\b(webpack|vite|rollup|parcel|esbuild)\b/gi
    ];

    for (const pattern of libraryPatterns) {
      const matches = prompt.match(pattern) || [];
      references.push(...matches.map(match => ({
        type: 'library' as const,
        value: match.toLowerCase(),
        context: 'Common library pattern'
      })));
    }

    // Remove duplicates
    const unique = references.filter((ref, index, arr) => 
      arr.findIndex(r => r.value === ref.value && r.type === ref.type) === index
    );

    return unique;
  }

  /**
   * Extract @-references which often indicate file paths or services
   */
  private extractAtReferences(prompt: string): string[] {
    const atRefRegex = /@[\w-]+(?:\/[\w-]+)*(?:\.[\w]+)?/g;
    const matches = prompt.match(atRefRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Load package dependencies from package.json
   */
  private async loadPackageDependencies(): Promise<void> {
    try {
      const projectRoot = findProjectRoot(this.projectPath);
      const packageJsonPath = join(projectRoot, 'package.json');
      
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      
      // Combine dependencies and devDependencies
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
        ...pkg.peerDependencies,
        ...pkg.optionalDependencies
      };

      // Add all dependency names to the set
      Object.keys(allDeps).forEach(dep => {
        this.packageDependencies.add(dep);
        // Also add without @scope/ prefix for easier matching
        if (dep.startsWith('@')) {
          const withoutScope = dep.split('/')[1];
          if (withoutScope) {
            this.packageDependencies.add(withoutScope);
          }
        }
      });
    } catch (error) {
      console.warn('Could not load package dependencies for reference discovery:', error);
    }
  }

  /**
   * Validate discovered references (e.g., check if URLs are accessible)
   */
  async validateReferences(references: DiscoveredReference[]): Promise<DiscoveredReference[]> {
    const validated: DiscoveredReference[] = [];

    for (const ref of references) {
      if (ref.type === 'url') {
        // For now, just add all URLs - could add actual validation later
        validated.push(ref);
      } else {
        // Add all library/package references
        validated.push(ref);
      }
    }

    return validated;
  }
}