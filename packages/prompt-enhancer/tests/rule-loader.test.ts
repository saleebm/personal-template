import { describe, test, expect, beforeAll } from 'bun:test';
import { RuleLoader } from '../src/rule-loader.js';
import { join } from 'path';

describe('RuleLoader', () => {
  let ruleLoader: RuleLoader;
  const projectPath = join(process.cwd(), '../..');

  beforeAll(() => {
    ruleLoader = new RuleLoader(projectPath);
  });

  test('should load rules from .ruler directory', async () => {
    const rules = await ruleLoader.loadRules();
    
    expect(rules.count).toBeGreaterThan(0);
    expect(rules.rules).toBeInstanceOf(Array);
    expect(rules.rulesText).toBeTruthy();
    expect(rules.rulesText.length).toBeGreaterThan(100);
  });

  test('should format rules with proper structure', async () => {
    const rules = await ruleLoader.loadRules();
    
    expect(rules.rulesText).toContain('### PROJECT RULES AND STANDARDS (MUST BE FOLLOWED)');
    expect(rules.rulesText).toContain('Source: .ruler/');
    expect(rules.rulesText).toContain('---');
  });

  test('should include specific rule files', async () => {
    const rules = await ruleLoader.loadRules();
    const ruleFileNames = rules.rules.map(r => r.fileName);
    
    expect(ruleFileNames).toContain('behavior');
    expect(ruleFileNames).toContain('coding-style');
    expect(ruleFileNames).toContain('development');
    expect(ruleFileNames).toContain('security');
    expect(ruleFileNames).toContain('typescript');
  });

  test('should cache rules after first load', async () => {
    const rules1 = await ruleLoader.loadRules();
    const rules2 = await ruleLoader.loadRules();
    
    // Should be the same object reference due to caching
    expect(rules1).toBe(rules2);
  });

  test('should force reload when requested', async () => {
    const rules1 = await ruleLoader.loadRules();
    ruleLoader.clearCache();
    const rules2 = await ruleLoader.loadRules(true);
    
    // Should be different object references
    expect(rules1).not.toBe(rules2);
    // But content should be the same
    expect(rules1.count).toBe(rules2.count);
  });

  test('should get specific rule by filename', async () => {
    const behaviorRule = await ruleLoader.getRule('behavior');
    
    expect(behaviorRule).toBeTruthy();
    expect(behaviorRule?.fileName).toBe('behavior');
    expect(behaviorRule?.content).toContain('Critical Communication Rules');
  });

  test('should return null for non-existent rule', async () => {
    const nonExistentRule = await ruleLoader.getRule('non-existent-rule');
    
    expect(nonExistentRule).toBeNull();
  });

  test('should correctly report if rules are available', async () => {
    const hasRules = await ruleLoader.hasRules();
    
    expect(hasRules).toBe(true);
  });

  test('should handle missing .ruler directory gracefully', async () => {
    const invalidLoader = new RuleLoader('/non/existent/path');
    const rules = await invalidLoader.loadRules();
    
    expect(rules.count).toBe(0);
    expect(rules.rules).toEqual([]);
    expect(rules.rulesText).toBe('');
  });
});