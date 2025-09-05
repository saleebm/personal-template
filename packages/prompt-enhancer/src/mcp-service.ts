import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { Tool } from 'ai';
import { z } from 'zod';

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPConfiguration {
  mcpServers: Record<string, MCPServerConfig>;
}

export class MCPService {
  private config: MCPConfiguration | null = null;
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
    this.loadDefaultConfig();
  }

  /**
   * Load MCP configuration from .ruler/mcp.json
   */
  private loadDefaultConfig(): void {
    try {
      const defaultConfigPath = path.join(this.projectPath, '.ruler', 'mcp.json');
      if (fs.existsSync(defaultConfigPath)) {
        const configContent = fs.readFileSync(defaultConfigPath, 'utf-8');
        this.config = JSON.parse(configContent) as MCPConfiguration;
        console.log(`📡 Loaded MCP configuration with ${Object.keys(this.config.mcpServers).length} servers`);
      } else {
        console.warn('⚠️ No default MCP configuration found at .ruler/mcp.json');
      }
    } catch (error) {
      console.error('❌ Failed to load MCP configuration:', error);
    }
  }

  /**
   * Load custom MCP configuration from a specified path
   */
  public loadCustomConfig(configPath: string): void {
    try {
      if (!fs.existsSync(configPath)) {
        throw new Error(`MCP configuration file not found: ${configPath}`);
      }
      const configContent = fs.readFileSync(configPath, 'utf-8');
      this.config = JSON.parse(configContent) as MCPConfiguration;
      console.log(`📡 Loaded custom MCP configuration from ${configPath}`);
    } catch (error) {
      console.error(`❌ Failed to load custom MCP configuration from ${configPath}:`, error);
      throw error;
    }
  }

  /**
   * Get specific MCP server configurations
   */
  public getServers(serverNames?: string[]): Record<string, MCPServerConfig> {
    if (!this.config) {
      return {};
    }

    if (!serverNames || serverNames.length === 0) {
      return this.config.mcpServers;
    }

    const selectedServers: Record<string, MCPServerConfig> = {};
    for (const name of serverNames) {
      if (this.config.mcpServers[name]) {
        selectedServers[name] = this.config.mcpServers[name];
      }
    }
    return selectedServers;
  }

  /**
   * Create tool definitions for MCP servers
   * This creates proxy tools that can be used with AI SDK v5
   */
  public createMCPTools(): Record<string, Tool> {
    const tools: Record<string, Tool> = {};

    // npm-search tool
    if (this.config?.mcpServers['npm-search']) {
      tools['npm_search'] = {
        description: 'Search for npm packages to find relevant libraries and tools',
        inputSchema: z.object({
          query: z.string().describe('The search query for npm packages'),
          limit: z.number().default(10).describe('Maximum number of results to return')
        }),
        execute: async ({ query, limit = 10 }) => {
          try {
            // Execute npm search command
            if (!this.config) throw new Error('MCP configuration not loaded');
            const npmConfig = this.config.mcpServers['npm-search'];
            if (!npmConfig) throw new Error('npm-search server configuration not found');
            const command = `${npmConfig.command} ${npmConfig.args.join(' ')} search "${query}"`;
            const result = execSync(command, { encoding: 'utf-8' });
            
            // Parse and return results
            const lines = result.split('\n').filter(line => line.trim());
            const packages = lines.slice(0, limit).map(line => {
              const parts = line.split(/\s+/);
              return {
                name: parts[0],
                description: parts.slice(1).join(' ')
              };
            });
            
            return {
              success: true,
              packages,
              query,
              count: packages.length
            };
          } catch (error) {
            console.error('npm-search tool error:', error);
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              query
            };
          }
        }
      };
    }

    // GitHub search tool
    if (this.config?.mcpServers['ai-dr-github-search']) {
      tools['github_search'] = {
        description: 'Search GitHub repositories for code, issues, and documentation',
        inputSchema: z.object({
          query: z.string().describe('The search query for GitHub'),
          type: z.enum(['repositories', 'code', 'issues', 'users']).default('repositories').describe('Type of search to perform'),
          limit: z.number().default(10).describe('Maximum number of results')
        }),
        execute: async ({ query, type = 'repositories', limit = 10 }) => {
          try {
            // Note: This is a placeholder implementation
            // In a real implementation, you would properly invoke the MCP server
            console.log(`🔍 GitHub search for "${query}" (type: ${type}, limit: ${limit})`);
            
            return {
              success: true,
              query,
              type,
              results: [],
              message: 'GitHub search MCP server integration pending full implementation'
            };
          } catch (error) {
            console.error('github-search tool error:', error);
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              query
            };
          }
        }
      };
    }

    return tools;
  }

  /**
   * Check if specific MCP servers are available
   */
  public hasServers(serverNames: string[]): boolean {
    if (!this.config) return false;
    const config = this.config;
    return serverNames.every(name => name in config.mcpServers);
  }

  /**
   * Get list of available MCP server names
   */
  public getAvailableServers(): string[] {
    if (!this.config) return [];
    return Object.keys(this.config.mcpServers);
  }
}