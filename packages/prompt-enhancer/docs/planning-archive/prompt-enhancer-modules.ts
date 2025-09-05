// packages/prompt-enhancer/src/context.ts

import { readFile, readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { ParsedPrompt, FileContext, CodebaseContext } from './types';
import { Logger } from './logger';

export class ContextAnalyzer {
  private cache: Map<string, CodebaseContext> = new Map();
  private readonly IGNORE_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
    '.turbo',
    '*.log'
  ];
  
  constructor(
    private projectPath: string,
    private logger: Logger
  ) {}

  async analyze(parsed: ParsedPrompt): Promise<CodebaseContext> {
    this.logger.debug('Analyzing codebase context');
    
    // Check cache first
    const cacheKey = `${this.projectPath}-${parsed.rawContent.slice(0, 50)}`;
    if (this.cache.has(cacheKey)) {
      this.logger.debug('Using cached context');
      return this.cache.get(cacheKey)!;
    }
    
    const context: CodebaseContext = {
      files: [],
      dependencies: {},
      configuration: {},
      recentChanges: []
    };
    
    // Analyze package.json
    await this.analyzePackageJson(context);
    
    // Find relevant files based on parsed content
    const relevantFiles = await this.findRelevantFiles(parsed);
    context.files = await this.analyzeFiles(relevantFiles);
    
    // Get configuration files
    await this.analyzeConfiguration(context);
    
    // Get recent git changes (if available)
    await this.analyzeRecentChanges(context);
    
    // Cache the result
    this.cache.set(cacheKey, context);
    
    this.logger.debug('Context analysis complete', {
      files: context.files.length,
      dependencies: Object.keys(context.dependencies).length
    });
    
    return context;
  }

  private async analyzePackageJson(context: CodebaseContext): Promise<void> {
    try {
      const packagePath = join(this.projectPath, 'package.json');
      const content = await readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);
      
      context.dependencies = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };
      
      context.configuration.name = pkg.name;
      context.configuration.version = pkg.version;
      context.configuration.scripts = pkg.scripts;
    } catch (error) {
      this.logger.warn('Could not read package.json', error);
    }
  }

  private async findRelevantFiles(parsed: ParsedPrompt): Promise<string[]> {
    const relevantFiles: string[] = [];
    const searchTerms = this.extractSearchTerms(parsed);
    
    // Search for files matching the components and requirements
    await this.searchDirectory(this.projectPath, (filePath) => {
      const relativePath = relative(this.projectPath, filePath);
      
      // Check if file path contains any search terms
      for (const term of searchTerms) {
        if (relativePath.toLowerCase().includes(term.toLowerCase())) {
          relevantFiles.push(filePath);
          return true;
        }
      }
      
      return false;
    });
    
    // Limit to most relevant files
    return relevantFiles.slice(0, 20);
  }

  private extractSearchTerms(parsed: ParsedPrompt): string[] {
    const terms: string[] = [];
    
    // Add identified components
    terms.push(...parsed.identifiedComponents);
    
    // Extract key words from requirements
    for (const req of parsed.extractedRequirements) {
      const words = req.split(/\s+/)
        .filter(w => w.length > 3)
        .filter(w => !/^(the|and|for|with|from|that|this)$/i.test(w));
      terms.push(...words);
    }
    
    // Add workflow-specific terms
    switch (parsed.detectedType) {
      case 'bug':
        terms.push('error', 'exception', 'handler');
        break;
      case 'feature':
        terms.push('service', 'controller', 'component');
        break;
      case 'refactor':
        terms.push('util', 'helper', 'lib');
        break;
    }
    
    return [...new Set(terms)];
  }

  private async searchDirectory(
    dir: string,
    predicate: (path: string) => boolean
  ): Promise<void> {
    try {
      const entries = await readdir(dir);
      
      for (const entry of entries) {
        // Skip ignored patterns
        if (this.IGNORE_PATTERNS.some(pattern => entry.includes(pattern))) {
          continue;
        }
        
        const fullPath = join(dir, entry);
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          await this.searchDirectory(fullPath, predicate);
        } else if (stats.isFile() && this.isSourceFile(entry)) {
          predicate(fullPath);
        }
      }
    } catch (error) {
      this.logger.warn(`Could not search directory: ${dir}`, error);
    }
  }

  private isSourceFile(filename: string): boolean {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.yaml', '.yml', '.md'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  private async analyzeFiles(filePaths: string[]): Promise<FileContext[]> {
    const fileContexts: FileContext[] = [];
    
    for (const filePath of filePaths) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const summary = this.summarizeFile(filePath, content);
        
        fileContexts.push({
          path: relative(this.projectPath, filePath),
          summary,
          relevantSections: this.findRelevantSections(content)
        });
      } catch (error) {
        this.logger.warn(`Could not analyze file: ${filePath}`, error);
      }
    }
    
    return fileContexts;
  }

  private summarizeFile(filePath: string, content: string): string {
    const lines = content.split('\n').slice(0, 10);
    
    // Try to extract main purpose from comments or exports
    for (const line of lines) {
      if (line.includes('//') || line.includes('/*') || line.includes('*')) {
        const comment = line.replace(/^.*?(\/\/|\/\*|\*)\s*/, '').trim();
        if (comment.length > 10) {
          return comment;
        }
      }
    }
    
    // Check for main export or class
    const exportMatch = content.match(/export\s+(default\s+)?(class|function|const)\s+(\w+)/);
    if (exportMatch) {
      return `Exports ${exportMatch[3]}`;
    }
    
    // Default summary based on file type
    if (filePath.endsWith('.test.ts') || filePath.endsWith('.spec.ts')) {
      return 'Test file';
    }
    if (filePath.endsWith('.config.js') || filePath.endsWith('.config.ts')) {
      return 'Configuration file';
    }
    
    return 'Source file';
  }

  private findRelevantSections(content: string): any[] {
    // This is a simplified version - you might want to use a proper AST parser
    const sections: any[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Find function/class definitions
      if (/^(export\s+)?(async\s+)?function\s+\w+/.test(line) ||
          /^(export\s+)?class\s+\w+/.test(line)) {
        sections.push({
          startLine: i + 1,
          endLine: Math.min(i + 20, lines.length),
          purpose: 'Function/Class definition'
        });
      }
    }
    
    return sections.slice(0, 5); // Limit to 5 sections
  }

  private async analyzeConfiguration(context: CodebaseContext): Promise<void> {
    const configFiles = [
      'tsconfig.json',
      '.env',
      '.env.example',
      'turbo.json',
      'docker-compose.yml'
    ];
    
    for (const configFile of configFiles) {
      try {
        const path = join(this.projectPath, configFile);
        const content = await readFile(path, 'utf-8');
        
        // Don't include actual env values, just keys
        if (configFile.startsWith('.env')) {
          const keys = content.split('\n')
            .filter(line => line.includes('='))
            .map(line => line.split('=')[0].trim());
          context.configuration[configFile] = keys;
        } else {
          context.configuration[configFile] = true;
        }
      } catch {
        // File doesn't exist, skip
      }
    }
  }

  private async analyzeRecentChanges(context: CodebaseContext): Promise<void> {
    // Simplified version - in production you'd use git commands
    try {
      // Mock implementation - you'd actually run git log
      context.recentChanges = [
        'Recent updates to authentication',
        'Bug fixes in workflow engine',
        'Added new API endpoints'
      ];
    } catch {
      // Git not available or not a git repo
    }
  }
}

// packages/prompt-enhancer/src/structure-builder.ts

import { 
  ParsedPrompt, 
  CodebaseContext, 
  StructuredPrompt, 
  WorkflowType,
  PromptContext,
  PromptInput,
  OutputSpecification,
  Example
} from './types';
import { Logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

export class PromptStructureBuilder {
  constructor(private logger: Logger) {}

  async build(
    parsed: ParsedPrompt,
    context: CodebaseContext | null,
    metadata?: any
  ): Promise<StructuredPrompt> {
    this.logger.debug('Building structured prompt');
    
    const id = uuidv4();
    const version = '1.0.0';
    
    const structured: StructuredPrompt = {
      id,
      version,
      workflow: parsed.detectedType,
      instruction: this.buildInstruction(parsed),
      context: this.buildContext(parsed, context),
      inputs: this.buildInputs(parsed),
      expectedOutput: this.buildOutputSpec(parsed),
      validation: {
        isValid: false,
        score: 0,
        issues: [],
        suggestions: []
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        author: metadata?.author,
        usage: [],
        performance: undefined
      }
    };
    
    // Add enhanced sections based on workflow type
    this.addWorkflowSpecificSections(structured, parsed);
    
    // Add clarifying questions if prompt is vague
    if (this.isVague(parsed)) {
      structured.clarifyingQuestions = this.generateClarifyingQuestions(parsed);
    }
    
    this.logger.debug('Structure building complete', { id });
    return structured;
  }

  private buildInstruction(parsed: ParsedPrompt): string {
    // Start with the original content
    let instruction = parsed.rawContent;
    
    // Enhance based on workflow type
    const prefix = this.getWorkflowPrefix(parsed.detectedType);
    if (!instruction.toLowerCase().startsWith(prefix.toLowerCase())) {
      instruction = `${prefix} ${instruction}`;
    }
    
    // Make it more specific if it's too general
    if (instruction.length < 50) {
      instruction = this.expandInstruction(instruction, parsed);
    }
    
    return instruction;
  }

  private getWorkflowPrefix(type: WorkflowType): string {
    const prefixes: Record<WorkflowType, string> = {
      [WorkflowType.BUG]: 'Fix the issue where',
      [WorkflowType.FEATURE]: 'Implement a feature that',
      [WorkflowType.REFACTOR]: 'Refactor the code to',
      [WorkflowType.DOCUMENTATION]: 'Document',
      [WorkflowType.RESEARCH]: 'Research and analyze',
      [WorkflowType.PR_REVIEW]: 'Review the changes for',
      [WorkflowType.GENERAL]: 'Complete the task to'
    };
    return prefixes[type];
  }

  private expandInstruction(instruction: string, parsed: ParsedPrompt): string {
    const components = parsed.identifiedComponents.join(', ');
    const requirements = parsed.extractedRequirements.join('. ');
    
    let expanded = instruction;
    
    if (components) {
      expanded += ` involving ${components}`;
    }
    
    if (requirements && requirements !== instruction) {
      expanded += `. Requirements: ${requirements}`;
    }
    
    return expanded;
  }

  private buildContext(parsed: ParsedPrompt, codebase: CodebaseContext | null): PromptContext {
    const context: PromptContext = {
      projectOverview: 'AI Dr. workflow orchestration system',
      relevantFiles: [],
      dependencies: [],
      currentState: '',
      technicalStack: []
    };
    
    if (codebase) {
      context.relevantFiles = codebase.files;
      context.dependencies = Object.keys(codebase.dependencies).slice(0, 10);
      
      // Detect technical stack
      const deps = Object.keys(codebase.dependencies);
      if (deps.some(d => d.includes('next'))) context.technicalStack.push('Next.js');
      if (deps.some(d => d.includes('react'))) context.technicalStack.push('React');
      if (deps.some(d => d.includes('express'))) context.technicalStack.push('Express');
      if (deps.some(d => d.includes('prisma'))) context.technicalStack.push('Prisma');
      if (codebase.configuration['tsconfig.json']) context.technicalStack.push('TypeScript');
      
      // Add Bun if it's the AI Dr. project
      context.technicalStack.push('Bun');
      
      // Current state from recent changes
      if (codebase.recentChanges.length > 0) {
        context.currentState = `Recent changes: ${codebase.recentChanges.join(', ')}`;
      }
    } else {
      context.technicalStack = ['TypeScript', 'Bun', 'Next.js', 'React'];
    }
    
    return context;
  }

  private buildInputs(parsed: ParsedPrompt): PromptInput[] {
    const inputs: PromptInput[] = [];
    
    // Add the raw prompt as primary input
    inputs.push({
      label: 'Original Request',
      value: parsed.rawContent,
      type: 'text'
    });
    
    // Add extracted requirements as separate inputs
    if (parsed.extractedRequirements.length > 0) {
      inputs.push({
        label: 'Requirements',
        value: parsed.extractedRequirements.join('\n'),
        type: 'text'
      });
    }
    
    // Add identified components
    if (parsed.identifiedComponents.length > 0) {
      inputs.push({
        label: 'Related Components',
        value: parsed.identifiedComponents.join(', '),
        type: 'reference'
      });
    }
    
    return inputs;
  }

  private buildOutputSpec(parsed: ParsedPrompt): OutputSpecification {
    const spec: OutputSpecification = {
      format: 'code',
      constraints: [],
      examples: []
    };
    
    // Determine output format based on workflow type
    switch (parsed.detectedType) {
      case WorkflowType.BUG:
      case WorkflowType.FEATURE:
      case WorkflowType.REFACTOR:
        spec.format = 'code';
        spec.structure = 'TypeScript/JavaScript code with proper error handling';
        spec.constraints = [
          'Follow existing code patterns',
          'Include appropriate error handling',
          'Add necessary type definitions',
          'Update relevant tests'
        ];
        break;
        
      case WorkflowType.DOCUMENTATION:
        spec.format = 'documentation';
        spec.structure = 'Markdown documentation with examples';
        spec.constraints = [
          'Use clear, concise language',
          'Include code examples',
          'Follow documentation standards'
        ];
        break;
        
      case WorkflowType.RESEARCH:
        spec.format = 'analysis';
        spec.structure = 'Detailed analysis with recommendations';
        spec.constraints = [
          'Provide data-driven insights',
          'Include pros and cons',
          'Make actionable recommendations'
        ];
        break;
        
      case WorkflowType.PR_REVIEW:
        spec.format = 'analysis';
        spec.structure = 'Code review with feedback';
        spec.constraints = [
          'Check for bugs and issues',
          'Verify code quality',
          'Suggest improvements'
        ];
        break;
        
      default:
        spec.format = 'structured_data';
        spec.structure = 'Appropriate format for the task';
    }
    
    return spec;
  }

  private addWorkflowSpecificSections(prompt: StructuredPrompt, parsed: ParsedPrompt): void {
    switch (parsed.detectedType) {
      case WorkflowType.BUG:
        prompt.successCriteria = [
          'Bug is no longer reproducible',
          'All existing tests pass',
          'New tests added for the fix',
          'No performance regression'
        ];
        prompt.constraints = [
          'Maintain backward compatibility',
          'Follow existing error handling patterns',
          'Add appropriate logging'
        ];
        break;
        
      case WorkflowType.FEATURE:
        prompt.successCriteria = [
          'Feature works as specified',
          'Unit tests provide >80% coverage',
          'Documentation updated',
          'No breaking changes to existing functionality'
        ];
        prompt.constraints = [
          'Follow project architecture patterns',
          'Implement proper input validation',
          'Consider scalability'
        ];
        break;
        
      case WorkflowType.REFACTOR:
        prompt.successCriteria = [
          'Code is more maintainable',
          'All tests still pass',
          'Performance is maintained or improved',
          'Code follows best practices'
        ];
        prompt.constraints = [
          'No change in external behavior',
          'Preserve all public APIs',
          'Update affected documentation'
        ];
        break;
        
      case WorkflowType.DOCUMENTATION:
        prompt.successCriteria = [
          'All public APIs documented',
          'Examples provided for common use cases',
          'Clear and concise explanations',
          'Proper formatting and structure'
        ];
        break;
        
      case WorkflowType.RESEARCH:
        prompt.successCriteria = [
          'All options evaluated',
          'Pros and cons clearly stated',
          'Recommendations backed by data',
          'Implementation plan provided'
        ];
        break;
    }
  }

  private isVague(parsed: ParsedPrompt): boolean {
    // Check if prompt is too short or lacks specifics
    if (parsed.rawContent.length < 30) return true;
    if (parsed.extractedRequirements.length === 0) return true;
    if (parsed.identifiedComponents.length === 0) return true;
    
    // Check for vague words
    const vagueWords = ['something', 'somehow', 'thing', 'stuff', 'whatever'];
    const hasVagueWords = vagueWords.some(word => 
      parsed.rawContent.toLowerCase().includes(word)
    );
    
    return hasVagueWords;
  }

  private generateClarifyingQuestions(parsed: ParsedPrompt): string[] {
    const questions: string[] = [];
    
    // Workflow-specific questions
    switch (parsed.detectedType) {
      case WorkflowType.BUG:
        questions.push('What are the exact steps to reproduce this issue?');
        questions.push('What is the expected behavior vs actual behavior?');
        questions.push('When did this issue first appear?');
        break;
        
      case WorkflowType.FEATURE:
        questions.push('Who are the primary users of this feature?');
        questions.push('What are the acceptance criteria?');
        questions.push('Are there any specific performance requirements?');
        break;
        
      case WorkflowType.REFACTOR:
        questions.push('What specific problems does the current code have?');
        questions.push('What are the performance targets?');
        questions.push('Which parts of the codebase will be affected?');
        break;
        
      default:
        questions.push('What is the specific goal you want to achieve?');
        questions.push('What constraints or requirements should be considered?');
        questions.push('What does success look like for this task?');
    }
    
    // Add general questions if content is very vague
    if (parsed.rawContent.length < 50) {
      questions.push('Can you provide more details about the context?');
    }
    
    return questions.slice(0, 3); // Limit to 3 questions
  }
}