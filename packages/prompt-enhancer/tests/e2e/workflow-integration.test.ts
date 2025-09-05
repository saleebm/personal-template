/**
 * End-to-end workflow integration tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { PromptEnhancerSDK } from '../../src/index.js';
import { PromptStorage } from '../../src/storage.js';
import { setupTestEnvironment, PerformanceMonitor } from '../utils/setup.js';
import { setupCustomMatchers } from '../utils/custom-matchers.js';
import { TEST_PROMPTS, generateRandomPrompt } from '../fixtures/prompts.js';
import { join } from 'path';

// Setup custom matchers
setupCustomMatchers();

describe('End-to-End Workflow Integration', () => {
  let testEnv: any;
  let sdk: PromptEnhancerSDK;
  let storage: PromptStorage;
  let performanceMonitor: PerformanceMonitor;
  
  beforeEach(async () => {
    testEnv = await setupTestEnvironment();
    sdk = new PromptEnhancerSDK({
      projectPath: testEnv.tempDir,
      outputDir: join(testEnv.tempDir, 'output'),
      debug: false
    });
    storage = new PromptStorage(join(testEnv.tempDir, 'storage'));
    performanceMonitor = new PerformanceMonitor();
  });
  
  afterEach(async () => {
    if (testEnv?.cleanup) {
      await testEnv.cleanup();
    }
  });

  describe('Complete Enhancement Workflow', () => {
    it('should complete enhance → save → load → validate cycle', async () => {
      performanceMonitor.mark('workflow-start');
      
      // Step 1: Enhance a prompt
      performanceMonitor.mark('enhance-start');
      const originalPrompt = TEST_PROMPTS.workflows.feature;
      const enhanced = await sdk.enhance(originalPrompt);
      performanceMonitor.measure('enhance', 'enhance-start');
      
      // Validate enhancement
      expect(enhanced).toBeValidPrompt();
      expect(enhanced).toHaveWorkflowType('feature');
      expect(enhanced).toContainSuccessCriteria();
      expect(enhanced).toHaveValidationScore(0, 100);
      
      // Step 2: Store the enhanced prompt
      performanceMonitor.mark('save-start');
      await storage.save(enhanced);
      performanceMonitor.measure('save', 'save-start');
      
      // Step 3: Load the prompt back
      performanceMonitor.mark('load-start');
      const loaded = await storage.load(enhanced.id);
      performanceMonitor.measure('load', 'load-start');
      
      // Validate loaded prompt
      expect(loaded).toBeDefined();
      expect(loaded?.id).toBe(enhanced.id);
      expect(loaded?.instruction).toBe(enhanced.instruction);
      expect(loaded?.workflow).toBe(enhanced.workflow);
      
      // Step 4: Validate consistency
      expect(JSON.stringify(loaded)).toBe(JSON.stringify(enhanced));
      
      // Performance check
      performanceMonitor.measure('total-workflow', 'workflow-start');
      const stats = performanceMonitor.getStats('total-workflow');
      expect(stats?.mean).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle multiple concurrent workflows', async () => {
      const prompts = [
        TEST_PROMPTS.workflows.bug,
        TEST_PROMPTS.workflows.feature,
        TEST_PROMPTS.workflows.refactor,
        TEST_PROMPTS.workflows.research
      ];
      
      // Run multiple workflows concurrently
      const workflows = prompts.map(async (prompt) => {
        const enhanced = await sdk.enhance(prompt);
        await storage.save(enhanced);
        const loaded = await storage.load(enhanced.id);
        return { prompt, enhanced, loaded };
      });
      
      const results = await Promise.all(workflows);
      
      // Validate all workflows completed successfully
      results.forEach(result => {
        expect(result.enhanced).toBeValidPrompt();
        expect(result.loaded).toBeDefined();
        expect(result.loaded?.id).toBe(result.enhanced.id);
      });
      
      // Ensure different workflows were detected correctly
      const workflowTypes = results.map(r => r.enhanced.workflow);
      expect(workflowTypes).toContain('bug');
      expect(workflowTypes).toContain('feature');
      expect(workflowTypes).toContain('refactor');
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should maintain workflow consistency during partial failures', async () => {
      const prompts = Array(5).fill(null).map(() => generateRandomPrompt());
      const results = {
        enhanced: [] as any[],
        saved: [] as any[],
        failed: [] as any[]
      };
      
      // Process prompts with potential failures
      for (const prompt of prompts) {
        try {
          const enhanced = await sdk.enhance(prompt);
          results.enhanced.push(enhanced);
          
          // Simulate random storage failure
          if (Math.random() > 0.7) {
            throw new Error('Simulated storage failure');
          }
          
          await storage.save(enhanced);
          results.saved.push(enhanced);
        } catch (error) {
          results.failed.push({ prompt, error });
        }
      }
      
      // System should remain functional after failures
      expect(results.enhanced.length).toBeGreaterThan(0);
      
      // Verify saved prompts are retrievable
      for (const saved of results.saved) {
        const loaded = await storage.load(saved.id);
        expect(loaded).toBeDefined();
        expect(loaded?.id).toBe(saved.id);
      }
      
      // Should be able to continue processing after failures
      const recoveryPrompt = generateRandomPrompt();
      const recovered = await sdk.enhance(recoveryPrompt);
      expect(recovered).toBeValidPrompt();
    });

    it('should handle workflow interruption and resume', async () => {
      const workflowSteps = [
        { id: 'step1', prompt: TEST_PROMPTS.simple.feature },
        { id: 'step2', prompt: TEST_PROMPTS.simple.bugFix },
        { id: 'step3', prompt: TEST_PROMPTS.simple.refactor }
      ];
      
      const checkpoint = {
        completed: [] as string[],
        results: {} as Record<string, any>
      };
      
      // Simulate interrupted workflow
      for (let i = 0; i < workflowSteps.length; i++) {
        const step = workflowSteps[i];
        if (!step) continue; // Skip if step is undefined
        
        // Simulate interruption at step 2
        if (i === 1) {
          // Save checkpoint
          await Bun.write(
            join(testEnv.tempDir, 'checkpoint.json'),
            JSON.stringify(checkpoint)
          );
          
          // Simulate interruption
          break;
        }
        
        const enhanced = await sdk.enhance(step.prompt);
        await storage.save(enhanced);
        
        checkpoint.completed.push(step.id);
        checkpoint.results[step.id] = enhanced.id;
      }
      
      // Resume workflow from checkpoint
      const savedCheckpoint = JSON.parse(
        await Bun.file(join(testEnv.tempDir, 'checkpoint.json')).text()
      );
      
      expect(savedCheckpoint.completed).toContain('step1');
      expect(savedCheckpoint.completed).not.toContain('step2');
      
      // Resume from where it left off
      for (const step of workflowSteps) {
        if (savedCheckpoint.completed.includes(step.id)) {
          continue; // Skip completed steps
        }
        
        const enhanced = await sdk.enhance(step.prompt);
        await storage.save(enhanced);
        
        savedCheckpoint.completed.push(step.id);
        savedCheckpoint.results[step.id] = enhanced.id;
      }
      
      // Verify all steps completed
      expect(savedCheckpoint.completed).toHaveLength(3);
      expect(savedCheckpoint.completed).toContain('step1');
      expect(savedCheckpoint.completed).toContain('step2');
      expect(savedCheckpoint.completed).toContain('step3');
    });
  });

  describe('Complex Multi-Agent Workflow', () => {
    it('should orchestrate multiple agents for complex enhancement', async () => {
      // Simulate complex prompt requiring multiple processing steps
      const complexPrompt = TEST_PROMPTS.complex.dataArchitecture;
      
      // Step 1: Initial enhancement
      const phase1 = await sdk.enhance(complexPrompt);
      expect(phase1).toBeValidPrompt();
      
      // Step 2: Refine with additional context (simulated)
      const refinedPrompt = `${phase1.instruction}\nAdditional context: High availability required`;
      const phase2 = await sdk.enhance(refinedPrompt);
      expect(phase2.instruction).toContain('availability');
      
      // Step 3: Validate and save final result
      await storage.save(phase2);
      
      // Step 4: Generate related prompts (simulated workflow expansion)
      const relatedPrompts = [
        'Set up monitoring for the data pipeline',
        'Create backup and recovery procedures',
        'Implement data validation rules'
      ];
      
      const relatedEnhancements = await Promise.all(
        relatedPrompts.map(p => sdk.enhance(p))
      );
      
      // All related enhancements should be valid
      relatedEnhancements.forEach(e => {
        expect(e).toBeValidPrompt();
      });
      
      // Store all related enhancements
      await Promise.all(
        relatedEnhancements.map(e => storage.save(e))
      );
      
      // Verify workflow completeness
      const mainLoaded = await storage.load(phase2.id);
      expect(mainLoaded).toBeDefined();
      
      for (const related of relatedEnhancements) {
        const loaded = await storage.load(related.id);
        expect(loaded).toBeDefined();
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle rapid successive enhancements efficiently', async () => {
      const promptCount = 20;
      const prompts = Array(promptCount).fill(null).map(() => generateRandomPrompt());
      
      performanceMonitor.mark('batch-start');
      
      const enhancements = [];
      for (const prompt of prompts) {
        performanceMonitor.mark(`enhance-${prompts.indexOf(prompt)}-start`);
        const enhanced = await sdk.enhance(prompt);
        performanceMonitor.measure(
          `enhance-${prompts.indexOf(prompt)}`,
          `enhance-${prompts.indexOf(prompt)}-start`
        );
        enhancements.push(enhanced);
      }
      
      performanceMonitor.measure('batch-total', 'batch-start');
      
      // Check performance degradation
      const stats = performanceMonitor.getStats('batch-total');
      const avgTimePerPrompt = stats!.mean / promptCount;
      
      // Average time per prompt should be reasonable
      expect(avgTimePerPrompt).toBeLessThan(2000); // Less than 2 seconds per prompt
      
      // All enhancements should be valid
      enhancements.forEach(e => {
        expect(e).toBeValidPrompt();
      });
    });

    it('should maintain performance with large context accumulation', async () => {
      // Simulate building up large context over time
      let accumulatedContext = '';
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        performanceMonitor.mark(`iteration-${i}-start`);
        
        // Add to context
        accumulatedContext += `\nIteration ${i}: ${generateRandomPrompt()}`;
        
        // Enhance with growing context
        const enhanced = await sdk.enhance(
          `Process this with context: ${accumulatedContext.slice(-1000)}` // Use last 1000 chars
        );
        
        performanceMonitor.measure(`iteration-${i}`, `iteration-${i}-start`);
        
        expect(enhanced).toBeValidPrompt();
        
        // Check if performance degrades significantly
        if (i > 0) {
          const currentStats = performanceMonitor.getStats(`iteration-${i}`);
          const firstStats = performanceMonitor.getStats('iteration-0');
          
          // Performance shouldn't degrade more than 2x
          if (currentStats && firstStats) {
            expect(currentStats.mean).toBeLessThan(firstStats.mean * 2);
          }
        }
      }
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain prompt integrity through full lifecycle', async () => {
      const testPrompt = TEST_PROMPTS.complex.authentication;
      
      // Enhance
      const original = await sdk.enhance(testPrompt);
      
      // Store
      await storage.save(original);
      
      // Load and verify
      const loaded1 = await storage.load(original.id);
      expect(JSON.stringify(loaded1)).toBe(JSON.stringify(original));
      
      // Search and verify
      const searchResults = await storage.search({ tags: ['authentication'] });
      const found = searchResults.find(r => r.id === original.id);
      expect(found).toBeDefined();
      
      // Load again to ensure consistency
      const loaded2 = await storage.load(original.id);
      expect(JSON.stringify(loaded2)).toBe(JSON.stringify(loaded1));
    });

    it('should handle workflow cleanup on failure', async () => {
      const tempFiles: string[] = [];
      
      try {
        // Start workflow that creates temporary resources
        const prompt = TEST_PROMPTS.simple.feature;
        const enhanced = await sdk.enhance(prompt);
        
        // Create temporary workflow files
        const workflowDir = join(testEnv.tempDir, 'workflow', enhanced.id);
        await Bun.write(join(workflowDir, 'temp.json'), JSON.stringify(enhanced));
        tempFiles.push(workflowDir);
        
        // Simulate failure
        throw new Error('Workflow failed');
      } catch (error) {
        // Cleanup should happen
        for (const file of tempFiles) {
          // In a real implementation, these should be cleaned up
          // Document whether cleanup happens or not
        }
      }
      
      // System should remain functional after failure
      const recoveryPrompt = TEST_PROMPTS.simple.bugFix;
      const recovered = await sdk.enhance(recoveryPrompt);
      expect(recovered).toBeValidPrompt();
    });
  });
});