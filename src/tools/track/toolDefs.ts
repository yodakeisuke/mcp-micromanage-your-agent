import { Tool, createErrorResponse } from '../common.js';
import { workPlan } from '../../index.js';
import logger from '../../utils/logger.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';

export const TRACK_TOOL: Tool<{}> = {
  name: "track",
  description: `
    This tool helps you monitor the current state of the implementation plan, view progress, and identify possible next steps.
    There is always exactly one task in either the in_progress or user_review state.
    **IMPORTANT**: There is always exactly one task in either the in_progress or user_review or needsRefinment state.
    
    **MANDATORY STATUS TRANSITION RULES:**
    needsRefinment → in_progress:
      - Requirements, implementation plan, and impact MUST be clearly explained.
    user_review → completed:
      - A commit may not transition to "completed" without explicit user approval. No exceptions.
    
    **After receiving the tool response, you MUST**::
    - Monitor PRs, commits, and overall progress to spot blockers or items needing refinement.
    - Review recommended actions to decide your next steps.
    - **Absolutely follow the content of "agentInstruction" in the response JSON**!!.
  `,
  schema: {},
  handler: async (_, extra: RequestHandlerExtra) => {
    try {
      logger.info('Track tool called');
      
      if (!workPlan) {
        logger.error('WorkPlan instance is not available');
        return createErrorResponse('WorkPlan instance is not initialized');
      }
      
      if (!workPlan.isInitialized()) {
        logger.error('WorkPlan is not initialized');
        return createErrorResponse('WorkPlan is not ready. Server initialization incomplete.');
      }
      
      const result = workPlan.trackProgress();
      
      return {
        content: result.content.map(item => ({
          type: 'text' as const,
          text: item.text
        })),
        isError: result.isError
      };
    } catch (error) {
      logger.logError('Error in TRACK tool', error);
      return createErrorResponse(error);
    }
  }
}; 