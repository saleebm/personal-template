import { 
  type StructuredPrompt, 
  type ValidationResult,
  type ValidationIssue
} from './types.js';

export class PromptValidator {
  validate(prompt: StructuredPrompt): ValidationResult {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];

    // Validate instruction
    if (!prompt.instruction || prompt.instruction.trim().length < 20) {
      issues.push({
        severity: 'warning',
        field: 'instruction',
        message: 'Instruction is too short or missing',
        fix: 'Add more specific details about what needs to be done'
      });
      suggestions.push('Expand the instruction with specific requirements');
    }

    // Check for vague language
    const vagueTerms = ['something', 'somehow', 'stuff', 'thing', 'whatever'];
    const foundVague = vagueTerms.filter(term => 
      prompt.instruction?.toLowerCase().includes(term)
    );
    
    if (foundVague.length > 0) {
      issues.push({
        severity: 'warning',
        field: 'instruction',
        message: `Instruction contains vague terms: ${foundVague.join(', ')}`,
        fix: 'Replace vague terms with specific descriptions'
      });
      suggestions.push('Be more specific about requirements');
    }

    // Validate success criteria
    if (!prompt.successCriteria || prompt.successCriteria.length === 0) {
      issues.push({
        severity: 'info',
        field: 'successCriteria',
        message: 'No success criteria defined',
        fix: 'Add clear criteria for task completion'
      });
      suggestions.push('Define how to verify the task is complete');
    }

    // Calculate score
    let score = 100;
    
    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'error': score -= 20; break;
        case 'warning': score -= 10; break;
        case 'info': score -= 5; break;
      }
    });

    // Bonus points for quality
    if (prompt.successCriteria && prompt.successCriteria.length >= 3) score += 5;
    if (prompt.examples && prompt.examples.length > 0) score += 5;
    if (prompt.constraints && prompt.constraints.length > 0) score += 5;
    if (prompt.instruction && prompt.instruction.length > 100) score += 5;

    // Keep score in bounds
    score = Math.max(0, Math.min(100, score));

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      score,
      issues,
      suggestions
    };
  }
}