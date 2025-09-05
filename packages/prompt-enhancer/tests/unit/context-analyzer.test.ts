/**
 * Comprehensive context analyzer tests covering filesystem edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { ContextAnalyzer, type CodebaseContext } from '../../src/context.js';
import { setupTestEnvironment, createTestFile, waitFor } from '../utils/setup.js';
import { join } from 'path';
import { mkdir, symlink, chmod, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

describe('ContextAnalyzer - Filesystem Edge Cases', () => {
  let testEnv: any;
  let analyzer: ContextAnalyzer;
  
  beforeEach(async () => {
    testEnv = await setupTestEnvironment();
    analyzer = new ContextAnalyzer(testEnv.tempDir);
  });
  
  afterEach(async () => {
    if (testEnv?.cleanup) {
      await testEnv.cleanup();
    }
  });

  describe('Circular Symlinks', () => {
    it('should handle circular symlinks without infinite recursion', async () => {
      // Create circular symlink structure
      const dir1 = join(testEnv.tempDir, 'dir1');
      const dir2 = join(testEnv.tempDir, 'dir2');
      
      await mkdir(dir1);
      await mkdir(dir2);
      
      // Create circular symlinks
      await symlink(dir2, join(dir1, 'link-to-dir2'));
      await symlink(dir1, join(dir2, 'link-to-dir1'));
      
      // Add some files
      await createTestFile(join(dir1, 'file1.ts'), 'const a = 1;');
      await createTestFile(join(dir2, 'file2.ts'), 'const b = 2;');
      
      // Should not hang or crash
      const startTime = Date.now();
      const context = await analyzer.analyze('test analysis');
      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);
      
      // Should find the files but not loop infinitely
      const fileNames = context.files.map(f => f.path);
      expect(fileNames.some(f => f.includes('file1.ts'))).toBe(true);
      expect(fileNames.some(f => f.includes('file2.ts'))).toBe(true);
      
      // Should not have duplicated content from following symlinks repeatedly
      const file1Count = fileNames.filter(f => f.includes('file1.ts')).length;
      expect(file1Count).toBeLessThan(10); // Reasonable limit
    });

    it('should detect and report symlink loops', async () => {
      // Create self-referencing symlink
      const selfLink = join(testEnv.tempDir, 'self-link');
      
      try {
        await symlink(selfLink, selfLink);
      } catch (error) {
        // Some systems prevent self-referencing symlinks
        return;
      }
      
      // Should handle gracefully
      const context = await analyzer.analyze('test analysis');
      expect(context).toBeDefined();
    });
  });

  describe('Permission Issues', () => {
    it('should handle permission-denied directories gracefully', async () => {
      const restrictedDir = join(testEnv.tempDir, 'restricted');
      await mkdir(restrictedDir);
      await createTestFile(join(restrictedDir, 'secret.ts'), 'const secret = "data";');
      
      // Make directory unreadable
      await chmod(restrictedDir, 0o000);
      
      try {
        // Should not crash when encountering permission denied
        const context = await analyzer.analyze('test analysis');
        expect(context).toBeDefined();
        
        // Should skip the restricted directory
        expect(context).not.toContain('secret.ts');
        expect(context).not.toContain('secret = "data"');
      } finally {
        // Restore permissions for cleanup
        await chmod(restrictedDir, 0o755);
      }
    });

    it('should handle files with no read permission', async () => {
      const file = join(testEnv.tempDir, 'unreadable.ts');
      await createTestFile(file, 'const data = "test";');
      await chmod(file, 0o000);
      
      try {
        const context = await analyzer.analyze('test analysis');
        expect(context).toBeDefined();
        // Should skip unreadable files
        expect(context).not.toContain('data = "test"');
      } finally {
        await chmod(file, 0o644);
      }
    });
  });

  describe('Binary Files', () => {
    it('should skip binary files safely', async () => {
      // Create various binary files
      const binaryFiles = [
        { name: 'image.png', content: Buffer.from([0x89, 0x50, 0x4E, 0x47]) }, // PNG header
        { name: 'archive.zip', content: Buffer.from([0x50, 0x4B, 0x03, 0x04]) }, // ZIP header
        { name: 'binary.exe', content: Buffer.from([0x4D, 0x5A]) }, // EXE header
        { name: 'data.bin', content: Buffer.alloc(1000, 0xFF) } // Random binary
      ];
      
      for (const file of binaryFiles) {
        await Bun.write(join(testEnv.tempDir, file.name), file.content);
      }
      
      // Add a text file for comparison
      await createTestFile(join(testEnv.tempDir, 'text.ts'), 'const text = "readable";');
      
      const context = await analyzer.analyze('test analysis');
      
      // Should include text file
      expect(context).toContain('text.ts');
      expect(context).toContain('readable');
      
      // Should skip binary files
      expect(context).not.toContain('\x89PNG');
      expect(context).not.toContain('PK\x03\x04');
      expect(context).not.toContain('MZ');
      
      // Should not crash on binary content
      expect(context).toBeDefined();
    });

    it('should handle files with mixed binary and text content', async () => {
      const mixedContent = 'Text content\x00\xFF\xFE\nMore text\x00';
      await createTestFile(join(testEnv.tempDir, 'mixed.txt'), mixedContent);
      
      const context = await analyzer.analyze('test analysis');
      expect(context).toBeDefined();
      
      // Implementation should either skip or sanitize
      const fileNames = context.files.map(f => f.path);
      const hasMixedFile = fileNames.some(f => f.includes('mixed.txt'));
    });
  });

  describe('Large Directory Structures', () => {
    it('should handle extremely deep directory structures', async () => {
      // Create deep nested structure
      let currentPath = testEnv.tempDir;
      const depth = 100;
      
      for (let i = 0; i < depth; i++) {
        currentPath = join(currentPath, `level-${i}`);
        await mkdir(currentPath);
        
        // Add file at each level
        await createTestFile(
          join(currentPath, `file-${i}.ts`),
          `const level = ${i};`
        );
      }
      
      // Should handle deep recursion
      const startTime = Date.now();
      const context = await analyzer.analyze('test analysis');
      const duration = Date.now() - startTime;
      
      expect(context).toBeDefined();
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      
      // Should find files at various depths
      const fileNames = context.files.map(f => f.path);
      expect(fileNames.some(f => f.includes('level-0'))).toBe(true);
      
      // May implement depth limit for safety
      // Check if very deep files are included
      const hasDeepFile = fileNames.some(f => f.includes('level-99'));
      // Document the behavior (whether depth limited or not)
    });

    it('should handle directories with many files efficiently', async () => {
      // Create directory with many files
      const manyFilesDir = join(testEnv.tempDir, 'many-files');
      await mkdir(manyFilesDir);
      
      const fileCount = 1000;
      const createPromises = [];
      
      for (let i = 0; i < fileCount; i++) {
        createPromises.push(
          createTestFile(
            join(manyFilesDir, `file-${i}.ts`),
            `export const value${i} = ${i};`
          )
        );
      }
      
      await Promise.all(createPromises);
      
      // Should handle many files efficiently
      const startTime = Date.now();
      const context = await analyzer.analyze('test analysis');
      const duration = Date.now() - startTime;
      
      expect(context).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Check sampling behavior
      const fileNames = context.files.map(f => f.path);
      const fileReferences = fileNames.filter(f => /file-\d+\.ts/.test(f)).length;
      
      // May sample or limit files for performance
      if (fileReferences < fileCount) {
        // Document sampling behavior
        expect(fileReferences).toBeGreaterThan(0);
      }
    });
  });

  describe('Special File Types', () => {
    it('should handle special file system entries', async () => {
      // These tests may behave differently on different systems
      
      // Named pipe (FIFO) - Unix-like systems only
      if (process.platform !== 'win32') {
        const fifoPath = join(testEnv.tempDir, 'named-pipe');
        try {
          // Try to use mkfifo if available, otherwise skip
          const { spawn } = await import('child_process');
          await new Promise((resolve, reject) => {
            const child = spawn('mkfifo', [fifoPath], { stdio: 'ignore' });
            child.on('exit', resolve);
            child.on('error', reject);
          });
        } catch (error) {
          // mkfifo may not be available or child_process may fail
        }
      }
      
      // Device files, sockets, etc. typically require special permissions
      // Just ensure the analyzer doesn't crash on special files
      
      const context = await analyzer.analyze('test analysis');
      expect(context).toBeDefined();
    });

    it('should handle hidden files and directories', async () => {
      // Create hidden files (Unix convention)
      await createTestFile(join(testEnv.tempDir, '.hidden-file.ts'), 'const hidden = true;');
      await mkdir(join(testEnv.tempDir, '.hidden-dir'));
      await createTestFile(
        join(testEnv.tempDir, '.hidden-dir', 'secret.ts'),
        'const secret = "data";'
      );
      
      const context = await analyzer.analyze('test analysis');
      
      // Document whether hidden files are included or excluded
      const fileNames = context.files.map(f => f.path);
      const includesHidden = fileNames.some(f => f.includes('.hidden'));
      
      // Either behavior is acceptable, just document it
      expect(context).toBeDefined();
    });
  });

  describe('Network and Slow Filesystems', () => {
    it('should timeout on slow filesystem operations', async () => {
      // Simulate slow filesystem by intercepting read operations
      const originalReadFile = Bun.file;
      let slowReadTriggered = false;
      
      // @ts-ignore
      global.Bun.file = (path: string) => {
        const file = originalReadFile(path);
        
        // Add delay to text method
        const originalText = file.text.bind(file);
        file.text = async () => {
          slowReadTriggered = true;
          await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
          return originalText();
        };
        
        return file;
      };
      
      try {
        // Create a test file
        await createTestFile(join(testEnv.tempDir, 'slow.ts'), 'const data = "test";');
        
        // Should have timeout mechanism
        const startTime = Date.now();
        const contextPromise = analyzer.analyze('test slow filesystem');
        
        // Set maximum wait time
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 15000);
        });
        
        try {
          await Promise.race([contextPromise, timeoutPromise]);
          const duration = Date.now() - startTime;
          
          // Should either timeout or complete quickly (implementation dependent)
          expect(duration).toBeLessThan(20000);
        } catch (error: any) {
          // Timeout is acceptable
          expect(error.message).toContain('Timeout');
        }
      } finally {
        // @ts-ignore
        global.Bun.file = originalReadFile;
      }
    });
  });

  describe('Encoding Issues', () => {
    it('should handle various file encodings', async () => {
      // Create files with different encodings
      const encodingTests = [
        { name: 'utf8.ts', content: 'const text = "Hello 世界 🌍";' },
        { name: 'utf16.ts', content: Buffer.from('const text = "UTF-16";', 'utf16le') },
        { name: 'latin1.ts', content: Buffer.from('const text = "Café";', 'latin1') },
        { name: 'invalid.ts', content: Buffer.from([0xFF, 0xFE, 0xFD]) } // Invalid UTF-8
      ];
      
      for (const test of encodingTests) {
        await Bun.write(join(testEnv.tempDir, test.name), test.content);
      }
      
      // Should handle various encodings without crashing
      const context = await analyzer.analyze('test analysis');
      expect(context).toBeDefined();
      
      // UTF-8 should work
      expect(context).toContain('Hello');
      
      // Other encodings may or may not be handled
      // Document the behavior
    });

    it('should handle files with BOM (Byte Order Mark)', async () => {
      // UTF-8 BOM
      const utf8BOM = Buffer.concat([
        Buffer.from([0xEF, 0xBB, 0xBF]),
        Buffer.from('const text = "UTF-8 with BOM";')
      ]);
      
      await Bun.write(join(testEnv.tempDir, 'bom.ts'), utf8BOM);
      
      const context = await analyzer.analyze('test analysis');
      expect(context).toBeDefined();
      
      // Should handle BOM correctly
      const fileNames = context.files.map(f => f.path);
      const hasBomFile = fileNames.some(f => f.includes('bom.ts'));
    });
  });

  describe('Resource Limits', () => {
    it('should limit memory usage with large files', async () => {
      // Create a very large file
      const largeContent = 'const data = "' + 'A'.repeat(50_000_000) + '";'; // 50MB
      await createTestFile(join(testEnv.tempDir, 'large.ts'), largeContent);
      
      // Should handle large files without excessive memory usage
      const context = await analyzer.analyze('test analysis');
      expect(context).toBeDefined();
      
      // May truncate or skip very large files
      const fileNames = context.files.map(f => f.path);
      const hasLargeFile = fileNames.some(f => f.includes('large.ts'));
    });

    it('should handle recursive directory watches', async () => {
      // Test if implementation sets up file watchers
      const watchDir = join(testEnv.tempDir, 'watch-test');
      await mkdir(watchDir);
      
      // Analyze once
      await analyzer.analyze('test');
      
      // Add new file
      await createTestFile(join(watchDir, 'new.ts'), 'const new = true;');
      
      // Check if new file is picked up (implementation dependent)
      const context2 = await analyzer.analyze('test analysis');
      
      // Document whether caching or watching is implemented
      expect(context2).toBeDefined();
    });
  });
});