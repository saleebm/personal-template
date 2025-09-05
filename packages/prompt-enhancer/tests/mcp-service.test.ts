import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { MCPService } from '../src/mcp-service.js';
import fs from 'fs';
import path from 'path';

describe('MCPService', () => {
  let mcpService: MCPService;
  const testConfigPath = path.join(process.cwd(), 'test-mcp.json');

  beforeAll(() => {
    // Create test MCP configuration
    const testConfig = {
      mcpServers: {
        'test-server': {
          command: '/usr/bin/test',
          args: ['--test'],
          env: { TEST_VAR: 'test' }
        },
        'npm-search': {
          command: 'bunx',
          args: ['npm-search-mcp-server']
        }
      }
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    mcpService = new MCPService(process.cwd());
  });

  it('should load default configuration', () => {
    const servers = mcpService.getAvailableServers();
    expect(Array.isArray(servers)).toBe(true);
  });

  it('should load custom configuration', () => {
    mcpService.loadCustomConfig(testConfigPath);
    const servers = mcpService.getAvailableServers();
    expect(servers).toContain('test-server');
    expect(servers).toContain('npm-search');
  });

  it('should get specific servers', () => {
    mcpService.loadCustomConfig(testConfigPath);
    const servers = mcpService.getServers(['npm-search']);
    expect(Object.keys(servers)).toContain('npm-search');
    expect(Object.keys(servers)).not.toContain('test-server');
  });

  it('should check if servers exist', () => {
    mcpService.loadCustomConfig(testConfigPath);
    expect(mcpService.hasServers(['npm-search'])).toBe(true);
    expect(mcpService.hasServers(['non-existent'])).toBe(false);
  });

  it('should create MCP tools', () => {
    mcpService.loadCustomConfig(testConfigPath);
    const tools = mcpService.createMCPTools();
    expect(typeof tools).toBe('object');
    
    if (tools['npm_search']) {
      expect(tools['npm_search'].description).toContain('npm');
      expect(typeof tools['npm_search'].execute).toBe('function');
    }
  });

  it('should handle missing configuration gracefully', () => {
    const emptyService = new MCPService('/non-existent-path');
    const servers = emptyService.getAvailableServers();
    expect(servers).toEqual([]);
  });

  // Clean up
  afterAll(() => {
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });
});

describe('MCP Tools Integration', () => {
  it('should have correct tool parameters', () => {
    const mcpService = new MCPService();
    const tools = mcpService.createMCPTools();
    
    if (tools['npm_search']) {
      const npmTool = tools['npm_search'];
      expect(npmTool.inputSchema).toBeDefined();
      expect(npmTool.description).toContain('npm');
      expect(typeof npmTool.execute).toBe('function');
    }
    
    if (tools['github_search']) {
      const githubTool = tools['github_search'];
      expect(githubTool.inputSchema).toBeDefined();
      expect(githubTool.description).toContain('GitHub');
      expect(typeof githubTool.execute).toBe('function');
    }
  });

  it('should execute npm search tool', async () => {
    const mcpService = new MCPService();
    const tools = mcpService.createMCPTools();
    
    if (tools['npm_search'] && tools['npm_search'].execute) {
      // Execute the tool with proper types
      const executeFunc = tools['npm_search'].execute;
      if (executeFunc) {
        const result = await executeFunc({
          query: 'test-package',
          limit: 5
        }, {
          // ToolExecutionOptions
          toolCallId: 'test-call-id',
          messages: [],
          abortSignal: new AbortController().signal
        } as Parameters<typeof executeFunc>[1]);
        
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('query', 'test-package');
      }
    }
  });
});