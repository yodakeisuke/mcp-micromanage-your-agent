import { z } from 'zod';
import { Tool, createErrorResponse, UpdateStatusInput } from '../common.js';
import { workPlan } from '../../index.js';
import logger from '../../utils/logger.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';

export const UPDATE_STATUS_TOOL: Tool<{
  prIndex: z.ZodNumber;
  commitIndex: z.ZodNumber;
  status: z.ZodEnum<["not_started", "in_progress", "user_review", "completed", "cancelled", "needsRefinment"]>;
  goal?: z.ZodOptional<z.ZodString>;
  developerNote?: z.ZodOptional<z.ZodString>;
}> = {
  name: "update",
  description: `
    A tool for updating the status and goals of development tasks.
    **IMPORTANT**: 
      - There is always exactly one task in either the in_progress or user_review or needsRefinment state.
      - When setting status to "user_review", you MUST generate a review request message to the user.
      - Always check and follow **task-status-update-rule.mdc** when updating task status.
    
    **After receiving the tool response, you MUST**::
    - 1. track the current whole status of the workplan.
    - 2. check the detailed information including developer notes in the next task.
  `,
  schema: {
    prIndex: z.number().int().min(0, "PR index must be a non-negative integer").describe("Index of the PR containing the commit to update. Zero-based index in the PR array."),
    commitIndex: z.number().int().describe("Index of the commit to update within the specified PR. Zero-based index in the commit array. Use -1 to update the PR directly."),
    status: z.enum(["not_started", "in_progress", "user_review", "completed", "cancelled", "needsRefinment"])
      .describe("New status value for the commit. Valid values: 'not_started' (work has not begun), 'in_progress' (currently being worked on), 'user_review' (waiting for user to review), 'completed' (work is finished), 'cancelled' (work has been abandoned), or 'needsRefinment' (needs further refinement)."),
    goal: z.string().min(1, "Goal must be a non-empty string").optional()
      .describe("New goal description for the commit. Optional - only provide if you want to change the commit goal."),
    developerNote: z.string().optional()
      .describe("Developer implementation notes. Can be added to both PRs and commits to document important implementation details.")
  },
  handler: async (params, extra: RequestHandlerExtra) => {
    try {
      logger.info(`Update tool called for PR #${params.prIndex}, commit #${params.commitIndex}, status: ${params.status}`);
      
      if (!workPlan) {
        logger.error('WorkPlan instance is not available');
        return createErrorResponse('WorkPlan instance is not initialized');
      }
      
      if (!workPlan.isInitialized()) {
        logger.error('WorkPlan is not initialized');
        return createErrorResponse('WorkPlan is not ready. Server initialization incomplete.');
      }
      
      const updateParams: UpdateStatusInput = {
        prIndex: params.prIndex,
        commitIndex: params.commitIndex,
        status: params.status,
        goal: params.goal ? String(params.goal) : undefined,
        developerNote: params.developerNote ? String(params.developerNote) : undefined
      };
      
      const result = workPlan.updateStatus(updateParams);
      
      return {
        content: result.content.map(item => ({
          type: "text" as const,
          text: item.text
        })),
        isError: result.isError
      };
    } catch (error) {
      logger.logError('Error in UPDATE_STATUS tool', error);
      return createErrorResponse(error);
    }
  }
}; 