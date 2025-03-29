import { z } from 'zod';
import { Tool, createErrorResponse, PlanTaskInput } from '../common.js';
import { workPlan } from '../../index.js';
import logger from '../../utils/logger.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';

// Improved error messages with guidance
const goalLengthErrorMessage = "Goal must be at most 60 characters. Consider moving detailed information to the developerNote field.";
const developerNoteLengthErrorMessage = "Developer note must be at most 300 characters. Consider breaking it into smaller, focused notes.";

export const PLAN_TOOL: Tool<{
  goal: z.ZodString;
  prPlans: z.ZodArray<z.ZodObject<{
    goal: z.ZodString;
    commitPlans: z.ZodArray<z.ZodObject<{
      goal: z.ZodString;
      developerNote?: z.ZodOptional<z.ZodString>;
    }>>;
    developerNote?: z.ZodOptional<z.ZodString>;
  }>>;
  needsMoreThoughts: z.ZodOptional<z.ZodBoolean>;
}> = {
  name: "plan",
  description: `
    A tool for managing a development work plan for a ticket, organized by PRs and commits.
    Register or update the whole work plan for the current ticket you assigned to.

    Before using this tool, you **MUST**:
    - Understand requirements, goals, and specifications.
    - Clarify the task scope and break it down into a hierarchy of PRs and commit plans.
    - Analyze existing codebase and impact area.
    - Include developer notes to document implementation considerations discovered during refinement.
    
    Make sure PR and commit goals are clear enough to stand alone without their developer notes
  `,
  schema: {
    goal: z.string().min(1, "Goal must be a non-empty string").max(60, goalLengthErrorMessage)
      .describe("High-level description of what this ticket aims to achieve. Should be concise and focus on the overall outcome or deliverable of the entire task."),
    prPlans: z.array(z.object({
      goal: z.string().min(1, "PR goal must be a non-empty string").max(60, goalLengthErrorMessage)
        .describe("Description of what this PR aims to accomplish. Should be written as a PR title would be - concise and focused on WHAT will be delivered."),
      commitPlans: z.array(z.object({
        goal: z.string().min(1, "Commit goal must be a non-empty string").max(60, goalLengthErrorMessage)
          .describe("Description of what this commit aims to accomplish. Should match the format of an actual commit message - concise and specific to a single change."),
        developerNote: z.string().max(300, developerNoteLengthErrorMessage).optional()
          .describe("Developer implementation notes for this commit. Use this field for detailed HOW information and implementation considerations discovered during refinement.")
      })).min(1, "At least one commit plan is required").describe("Array of commit plans for this PR. Each commit should be small and atomic."),
      developerNote: z.string().max(300, developerNoteLengthErrorMessage).optional()
        .describe("Developer implementation notes for this PR. Use this field for detailed implementation considerations and technical context discovered during refinement.")
    })).min(1, "At least one PR plan is required").describe("Array of PR plans. Each PR represents a logical unit of work in the implementation plan."),
    needsMoreThoughts: z.boolean().optional().describe("Whether this plan might need further refinement. Set to true if you think the plan may need changes.")
  },
  handler: async (params, extra: RequestHandlerExtra) => {
    try {
      logger.info(`Plan tool called with goal: ${params.goal}, PRs: ${params.prPlans.length}`);
      
      if (!workPlan) {
        logger.error('WorkPlan instance is not available');
        return createErrorResponse('WorkPlan instance is not initialized', 'plan');
      }
      
      if (!workPlan.isInitialized()) {
        logger.error('WorkPlan is not initialized');
        return createErrorResponse('WorkPlan is not ready. Server initialization incomplete.', 'plan');
      }
      
      const planParams: PlanTaskInput = {
        goal: params.goal,
        prPlans: params.prPlans.map(pr => ({
          goal: pr.goal,
          commitPlans: pr.commitPlans.map(commit => ({
            goal: commit.goal,
            developerNote: commit.developerNote ? String(commit.developerNote) : undefined
          })),
          developerNote: pr.developerNote ? String(pr.developerNote) : undefined
        })),
        needsMoreThoughts: params.needsMoreThoughts
      };
      
      const result = workPlan.plan(planParams);
      
      return {
        content: result.content.map(item => ({
          type: "text" as const,
          text: item.text
        })),
        isError: result.isError
      };
    } catch (error) {
      // Enhance error handling with guidance
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Detect specific validation errors and enhance with guidance
      let enhancedError = errorMessage;
      if (errorMessage.includes("too_big") && errorMessage.includes("goal")) {
        enhancedError = `Validation Error: Goal field exceeds maximum length of 60 characters. 
Please move implementation details to the developerNote field and keep goal fields concise.
- Goal fields should describe WHAT will be done (the end result)
- Developer notes should explain HOW it will be done (implementation details)`;
      } else if (errorMessage.includes("too_big") && errorMessage.includes("developerNote")) {
        enhancedError = `Validation Error: Developer note exceeds maximum length of 300 characters.
Please break down the information into smaller, more focused notes or consider creating separate commits for different aspects.`;
      }
      
      logger.logError(`Error in PLAN tool`, error);
      return createErrorResponse(enhancedError, 'plan');
    }
  }
}; 