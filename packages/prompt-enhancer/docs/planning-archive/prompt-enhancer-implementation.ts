// packages/prompt-enhancer/src/types.ts

export interface PromptEnhancerConfig {
  projectPath: string;
  outputDir?: string;
  enableCodebaseContext?: boolean;
  maxContextTokens?: number;
  templateLibrary?: PromptTemplate[];
  debug?: boolean;
  logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'verbose';
}

export interface RawPromptInput {
  content: string;
  type?: WorkflowType;
  metadata?: {
    taskId?: string;
    author?: string;
    timestamp?: Date;
    tags?: string[];
  };
}

export enum WorkflowType {
  FEATURE = 'feature',
  BUG = 'bug',
  REFACTOR = 'refactor',
  DOCUMENTATION = 'documentation',
  RESEARCH = 'research',
  PR_REVIEW = 'pr_review',
  GENERAL = 'general'
}

export interface StructuredPrompt {
  id: string;
  version: string;
  workflow: WorkflowType;
  
  // Core prompt structure
  instruction: string;
  context: PromptContext;
  inputs: PromptInput[];
  expectedOutput: OutputSpecification;
  
  // Validation & metadata
  validation: ValidationResult;
  metadata: PromptMetadata;
  
  // Enhanced sections
  clarifyingQuestions?: string[];
  successCriteria?: string[];
  constraints?: string[];
  examples?: Example[];
}

export interface PromptContext {
  projectOverview: string;
  relevantFiles: FileContext[];
  dependencies: string[];
  currentState: string;
  technicalStack: string[];
}

export interface FileContext {
  path: string;
  summary: string;
  relevantSections?: CodeSection[];
}

export interface CodeSection {
  startLine: number;
  endLine: number;
  purpose: string;
}

export interface PromptInput {
  label: string;
  value: string;
  type: 'text' | 'code' | 'data' | 'reference';
}

export interface OutputSpecification {
  format: 'code' | 'documentation' | 'analysis' | 'structured_data';
  structure?: string;
  constraints?: string[];
  examples?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  fix?: string;
}

export interface PromptMetadata {
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  usage: PromptUsage[];
  performance?: PromptPerformance;
}

export interface PromptUsage {
  timestamp: Date;
  success: boolean;
  feedback?: string;
}

export interface PromptPerformance {
  avgResponseTime: number;
  successRate: number;
  userRating?: number;
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  workflow: WorkflowType;
  structure: Partial<StructuredPrompt>;
  variables: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description?: string;
}

export interface PromptSearchQuery {
  workflow?: WorkflowType;
  tags?: string[];
  author?: string;
  dateRange?: { start: Date; end: Date };
  minScore?: number;
}

// Internal types
export interface ParsedPrompt {
  rawContent: string;
  detectedType: WorkflowType;
  extractedRequirements: string[];
  identifiedComponents: string[];
  suggestedTags: string[];
}

export interface CodebaseContext {
  files: FileContext[];
  dependencies: Record<string, string>;
  configuration: Record<string, any>;
  recentChanges: string[];
}

// packages/prompt-enhancer/src/index.ts

import { 
  PromptEnhancerConfig, 
  RawPromptInput, 
  StructuredPrompt,
  ValidationResult,
  PromptSearchQuery,
  WorkflowType
} from './types';
import { PromptParser } from './parser';
import { ContextAnalyzer } from './context';
import { PromptValidator } from './validator';
import { PromptStorage } from './storage';
import { PromptOptimizer } from './optimizer';
import { PromptStructureBuilder } from './structure-builder';
import { Logger } from './logger';

export * from './types';

export class PromptEnhancerSDK {
  private parser: PromptParser;
  private contextAnalyzer: ContextAnalyzer;
  private validator: PromptValidator;
  private storage: PromptStorage;
  private optimizer: PromptOptimizer;
  private structureBuilder: PromptStructureBuilder;
  private logger: Logger;
  private config: Required<PromptEnhancerConfig>;

  constructor(config: PromptEnhancerConfig) {
    this.config = this.mergeWithDefaults(config);
    
    this.logger = new Logger(this.config.logLevel);
    this.parser = new PromptParser(this.logger);
    this.contextAnalyzer = new ContextAnalyzer(this.config.projectPath, this.logger);
    this.structureBuilder = new PromptStructureBuilder(this.logger);
    this.validator = new PromptValidator(this.logger);
    this.storage = new PromptStorage(this.config.outputDir, this.logger);
    this.optimizer = new PromptOptimizer(this.config.maxContextTokens, this.logger);
    
    this.logger.info('PromptEnhancerSDK initialized', { config: this.config });
  }

  private mergeWithDefaults(config: PromptEnhancerConfig): Required<PromptEnhancerConfig> {
    return {
      projectPath: config.projectPath,
      outputDir: config.outputDir || '.prompts',
      enableCodebaseContext: config.enableCodebaseContext ?? true,
      maxContextTokens: config.maxContextTokens || 4000,
      templateLibrary: config.templateLibrary || [],
      debug: config.debug || false,
      logLevel: config.logLevel || 'error'
    };
  }

  async enhance(raw: string | RawPromptInput): Promise<StructuredPrompt> {
    this.logger.info('Starting prompt enhancement');
    
    try {
      // Validate input
      const input = this.normalizeInput(raw);
      if (!input.content || input.content.trim() === '') {
        throw new Error('Input cannot be empty');
      }

      // 1. Parse raw input
      this.logger.debug('Parsing input');
      const parsed = await this.parser.parse(input);
      
      // 2. Analyze codebase context if enabled
      let context = null;
      if (this.config.enableCodebaseContext) {
        this.logger.debug('Analyzing codebase context');
        context = await this.contextAnalyzer.analyze(parsed);
      }
      
      // 3. Build structured prompt
      this.logger.debug('Building structure');
      const structured = await this.structureBuilder.build(parsed, context, input.metadata);
      
      // 4. Optimize for clarity and token limits
      this.logger.debug('Optimizing prompt');
      const optimized = await this.optimizer.optimize(structured);
      
      // 5. Validate
      this.logger.debug('Validating prompt');
      const validation = this.validator.validate(optimized);
      optimized.validation = validation;
      
      this.logger.info('Enhancement complete', { 
        id: optimized.id, 
        score: validation.score 
      });
      
      return optimized;
    } catch (error) {
      this.logger.error('Enhancement failed', error);
      throw error;
    }
  }

  private normalizeInput(raw: string | RawPromptInput): RawPromptInput {
    if (typeof raw === 'string') {
      return {
        content: raw,
        type: WorkflowType.GENERAL,
        metadata: {
          timestamp: new Date()
        }
      };
    }
    return raw;
  }

  validate(prompt: StructuredPrompt): ValidationResult {
    return this.validator.validate(prompt);
  }

  async store(prompt: StructuredPrompt): Promise<string> {
    this.logger.debug('Storing prompt', { id: prompt.id });
    return this.storage.save(prompt);
  }

  async retrieve(id: string): Promise<StructuredPrompt> {
    this.logger.debug('Retrieving prompt', { id });
    return this.storage.load(id);
  }

  async update(id: string, updates: Partial<StructuredPrompt>): Promise<StructuredPrompt> {
    this.logger.debug('Updating prompt', { id });
    
    const existing = await this.retrieve(id);
    const updated = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date()
      }
    };
    
    updated.validation = this.validate(updated);
    await this.storage.save(updated);
    
    return updated;
  }

  async search(query: PromptSearchQuery): Promise<StructuredPrompt[]> {
    this.logger.debug('Searching prompts', { query });
    return this.storage.search(query);
  }

  export(prompt: StructuredPrompt, format: 'json' | 'yaml' | 'markdown'): string {
    this.logger.debug('Exporting prompt', { id: prompt.id, format });
    
    switch (format) {
      case 'json':
        return JSON.stringify(prompt, null, 2);
      
      case 'yaml':
        return this.exportToYaml(prompt);
      
      case 'markdown':
        return this.exportToMarkdown(prompt);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private exportToYaml(prompt: StructuredPrompt): string {
    // Simple YAML export (you might want to use a proper YAML library)
    const yaml = [`id: ${prompt.id}`];
    yaml.push(`version: ${prompt.version}`);
    yaml.push(`workflow: ${prompt.workflow}`);
    yaml.push(`score: ${prompt.validation.score}`);
    yaml.push('');
    yaml.push('instruction: |');
    yaml.push(...prompt.instruction.split('\n').map(line => `  ${line}`));
    yaml.push('');
    yaml.push('context:');
    yaml.push(`  technicalStack: [${prompt.context.technicalStack.join(', ')}]`);
    yaml.push(`  dependencies: [${prompt.context.dependencies.join(', ')}]`);
    yaml.push('  relevantFiles:');
    prompt.context.relevantFiles.forEach(file => {
      yaml.push(`    - path: ${file.path}`);
      yaml.push(`      summary: ${file.summary}`);
    });
    
    if (prompt.successCriteria?.length) {
      yaml.push('');
      yaml.push('successCriteria:');
      prompt.successCriteria.forEach(criteria => {
        yaml.push(`  - ${criteria}`);
      });
    }
    
    return yaml.join('\n');
  }

  private exportToMarkdown(prompt: StructuredPrompt): string {
    const md = [`# Enhanced Prompt`];
    md.push('');
    md.push(`**ID**: ${prompt.id}`);
    md.push(`**Workflow**: ${prompt.workflow}`);
    md.push(`**Score**: ${prompt.validation.score}/100`);
    md.push(`**Created**: ${prompt.metadata.createdAt.toISOString()}`);
    md.push('');
    
    md.push('## Instruction');
    md.push(prompt.instruction);
    md.push('');
    
    md.push('## Context');
    md.push(`- **Project Overview**: ${prompt.context.projectOverview}`);
    md.push(`- **Technical Stack**: ${prompt.context.technicalStack.join(', ')}`);
    md.push(`- **Dependencies**: ${prompt.context.dependencies.join(', ')}`);
    md.push('');
    
    if (prompt.context.relevantFiles.length > 0) {
      md.push('### Relevant Files');
      prompt.context.relevantFiles.forEach(file => {
        md.push(`- \`${file.path}\`: ${file.summary}`);
      });
      md.push('');
    }
    
    if (prompt.inputs.length > 0) {
      md.push('## Inputs');
      prompt.inputs.forEach(input => {
        md.push(`### ${input.label}`);
        md.push(`Type: ${input.type}`);
        md.push('```');
        md.push(input.value);
        md.push('```');
        md.push('');
      });
    }
    
    md.push('## Expected Output');
    md.push(`- **Format**: ${prompt.expectedOutput.format}`);
    if (prompt.expectedOutput.structure) {
      md.push(`- **Structure**: ${prompt.expectedOutput.structure}`);
    }
    md.push('');
    
    if (prompt.successCriteria && prompt.successCriteria.length > 0) {
      md.push('## Success Criteria');
      prompt.successCriteria.forEach((criteria, i) => {
        md.push(`${i + 1}. ✅ ${criteria}`);
      });
      md.push('');
    }
    
    if (prompt.constraints && prompt.constraints.length > 0) {
      md.push('## Constraints');
      prompt.constraints.forEach(constraint => {
        md.push(`- ${constraint}`);
      });
      md.push('');
    }
    
    if (prompt.clarifyingQuestions && prompt.clarifyingQuestions.length > 0) {
      md.push('## Clarifying Questions');
      prompt.clarifyingQuestions.forEach((question, i) => {
        md.push(`${i + 1}. ${question}`);
      });
      md.push('');
    }
    
    if (prompt.examples && prompt.examples.length > 0) {
      md.push('## Examples');
      prompt.examples.forEach((example, i) => {
        md.push(`### Example ${i + 1}`);
        md.push('**Input:**');
        md.push('```');
        md.push(example.input);
        md.push('```');
        md.push('**Output:**');
        md.push('```');
        md.push(example.output);
        md.push('```');
        if (example.explanation) {
          md.push(`**Explanation:** ${example.explanation}`);
        }
        md.push('');
      });
    }
    
    if (prompt.validation.issues.length > 0) {
      md.push('## Validation Issues');
      prompt.validation.issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : 
                     issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        md.push(`- ${icon} **${issue.field}**: ${issue.message}`);
        if (issue.fix) {
          md.push(`  - Fix: ${issue.fix}`);
        }
      });
      md.push('');
    }
    
    if (prompt.validation.suggestions.length > 0) {
      md.push('## Improvement Suggestions');
      prompt.validation.suggestions.forEach(suggestion => {
        md.push(`- ${suggestion}`);
      });
    }
    
    return md.join('\n');
  }
}

// packages/prompt-enhancer/src/parser.ts

import { RawPromptInput, ParsedPrompt, WorkflowType } from './types';
import { Logger } from './logger';

export class PromptParser {
  private workflowPatterns: Map<WorkflowType, RegExp[]>;
  
  constructor(private logger: Logger) {
    this.workflowPatterns = this.initializePatterns();
  }

  private initializePatterns(): Map<WorkflowType, RegExp[]> {
    const patterns = new Map<WorkflowType, RegExp[]>();
    
    patterns.set(WorkflowType.BUG, [
      /\b(bug|error|issue|problem|broken|fix|crash|fail)\b/i,
      /\b(not working|doesn't work|can't|unable|exception)\b/i,
      /\b(regression|defect|fault)\b/i
    ]);
    
    patterns.set(WorkflowType.FEATURE, [
      /\b(add|create|implement|build|develop|new feature)\b/i,
      /\b(enhance|extend|integrate|support)\b/i,
      /\b(functionality|capability)\b/i
    ]);
    
    patterns.set(WorkflowType.REFACTOR, [
      /\b(refactor|restructure|reorganize|optimize)\b/i,
      /\b(improve|clean up|simplify|modernize)\b/i,
      /\b(performance|efficiency|maintainability)\b/i
    ]);
    
    patterns.set(WorkflowType.DOCUMENTATION, [
      /\b(document|documentation|docs|readme)\b/i,
      /\b(explain|describe|clarify|comment)\b/i,
      /\b(guide|tutorial|example)\b/i
    ]);
    
    patterns.set(WorkflowType.RESEARCH, [
      /\b(research|investigate|explore|analyze)\b/i,
      /\b(compare|evaluate|assess|study)\b/i,
      /\b(understand|learn|discover)\b/i
    ]);
    
    patterns.set(WorkflowType.PR_REVIEW, [
      /\b(pr|pull request|review|merge)\b/i,
      /\b(code review|feedback|approve)\b/i,
      /\b(changes|diff|commit)\b/i
    ]);
    
    return patterns;
  }

  async parse(input: RawPromptInput): Promise<ParsedPrompt> {
    this.logger.debug('Parsing prompt input');
    
    const content = this.sanitizeContent(input.content);
    const detectedType = input.type || this.detectWorkflowType(content);
    const requirements = this.extractRequirements(content);
    const components = this.identifyComponents(content);
    const tags = this.suggestTags(content, detectedType);
    
    const parsed: ParsedPrompt = {
      rawContent: content,
      detectedType,
      extractedRequirements: requirements,
      identifiedComponents: components,
      suggestedTags: tags
    };
    
    this.logger.debug('Parsing complete', { 
      type: detectedType, 
      requirements: requirements.length,
      components: components.length 
    });
    
    return parsed;
  }

  private sanitizeContent(content: string): string {
    return content
      .trim()
      .replace(/[<>]/g, '')           // Remove potential HTML
      .replace(/\$\{.*?\}/g, '')       // Remove template literals
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .slice(0, 10000);                // Limit length
  }

  private detectWorkflowType(content: string): WorkflowType {
    const scores = new Map<WorkflowType, number>();
    
    for (const [type, patterns] of this.workflowPatterns) {
      let score = 0;
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          score += matches.length;
        }
      }
      scores.set(type, score);
    }
    
    // Find the type with highest score
    let maxScore = 0;
    let detectedType = WorkflowType.GENERAL;
    
    for (const [type, score] of scores) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    }
    
    this.logger.debug('Workflow type detected', { type: detectedType, score: maxScore });
    return detectedType;
  }

  private extractRequirements(content: string): string[] {
    const requirements: string[] = [];
    
    // Extract sentences that look like requirements
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    
    for (const sentence of sentences) {
      // Check if sentence contains action words
      if (/\b(should|must|need|require|want|have to|ensure|make sure)\b/i.test(sentence)) {
        requirements.push(sentence.trim());
      }
      // Check for imperative sentences
      else if (/^(add|create|implement|fix|update|remove|change|modify|improve)/i.test(sentence.trim())) {
        requirements.push(sentence.trim());
      }
    }
    
    return requirements;
  }

  private identifyComponents(content: string): string[] {
    const components: string[] = [];
    
    // Common component patterns
    const patterns = [
      /\b(api|endpoint|route|controller)\b/gi,
      /\b(database|db|table|schema|model)\b/gi,
      /\b(ui|component|page|view|screen)\b/gi,
      /\b(service|handler|manager|provider)\b/gi,
      /\b(auth|authentication|authorization)\b/gi,
      /\b(logger|logging|monitor|tracking)\b/gi,
      /\b(cache|redis|memory|storage)\b/gi,
      /\b(test|spec|testing|unit|integration)\b/gi
    ];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        components.push(...matches.map(m => m.toLowerCase()));
      }
    }
    
    // Remove duplicates
    return [...new Set(components)];
  }

  private suggestTags(content: string, type: WorkflowType): string[] {
    const tags: string[] = [type];
    
    // Add priority tags
    if (/\b(urgent|critical|asap|immediately|high priority)\b/i.test(content)) {
      tags.push('high-priority');
    }
    
    // Add technical tags
    if (/\b(performance|slow|optimize|fast)\b/i.test(content)) {
      tags.push('performance');
    }
    if (/\b(security|secure|vulnerability|auth)\b/i.test(content)) {
      tags.push('security');
    }
    if (/\b(ui|ux|user interface|design|frontend)\b/i.test(content)) {
      tags.push('frontend');
    }
    if (/\b(api|backend|server|database)\b/i.test(content)) {
      tags.push('backend');
    }
    
    return tags;
  }
}