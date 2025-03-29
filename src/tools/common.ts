import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { z } from 'zod';
import { type PlanTaskInput, type UpdateStatusInput, type WorkPlanInitOptions } from '../aggregates/workplan.js';
import logger from '../utils/logger.js';


export type Tool<Args extends z.ZodRawShape> = {
  name: string;
  description: string;
  schema: Args;
  handler: (
    args: z.infer<z.ZodObject<Args>>,
    extra: RequestHandlerExtra,
  ) =>
    | Promise<{
      content: Array<{
        type: 'text';
        text: string;
      }>;
      isError?: boolean;
    }>
    | {
      content: Array<{
        type: 'text';
        text: string;
      }>;
      isError?: boolean;
    };
};

/**
 * Enhanced error response generator with improved formatting and guidance.
 * 
 * Formats error messages to be more user-friendly and provides specific guidance
 * for validation errors and other common issues.
 * 
 * @param error - The error to format
 * @param context - Optional context about the error source (e.g., 'plan', 'update')
 * @returns Formatted error response
 */
export function createErrorResponse(
  error: unknown, 
  context?: string
): {
  content: Array<{ type: 'text'; text: string }>;
  isError: boolean;
} {
  // Extract base error message
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(`Creating error response: ${errorMessage}`);
  
  // Format error message with guidance based on error type
  let formattedError = errorMessage;
  
  // Check if it's a validation error
  if (errorMessage.includes('Invalid arguments') || errorMessage.includes('Validation')) {
    formattedError = `Validation Error: The provided data does not meet requirements.\n\n${errorMessage}`;
    
    if (context === 'plan') {
      formattedError += `\n\nSuggestions for fixing plan validation errors:
- Ensure goal fields are concise (max 60 characters) and focus on WHAT will be done
- Use developer notes for detailed implementation information (max 300 characters)
- Make sure at least one PR plan and one commit plan are provided
- Check that all required fields are present and properly formatted`;
    }
  }
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        error: formattedError,
        status: 'failed'
      }, null, 2)
    }],
    isError: true
  };
}

// エクスポートする型
export type { PlanTaskInput, UpdateStatusInput, WorkPlanInitOptions }; 