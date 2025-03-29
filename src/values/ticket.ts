import { Status } from './status.js';
import { PullRequest } from './pullRequest.js';
import { PlanTaskInput } from '../aggregates/workplan.js';

export type Ticket = {
  goal: string;
  pullRequests: PullRequest[];
  needsMoreThoughts?: boolean;
};

// Helper function to check if ticket exists
export const ensureTicketExists = (
  ticketState: Ticket | "noTicket", 
  isError = false
): { result: true; ticket: Ticket } | { result: false; response: { content: Array<{ type: string; text: string }>; isError?: boolean } } => {
  if (ticketState === "noTicket") {
    return {
      result: false,
      response: {
        content: [{
          type: "text",
          text: JSON.stringify({
            message: "No implementation plan found. Create an implementation plan first using the 'plan' tool.",
            ...(isError && { status: 'failed' })
          }, null, 2)
        }],
        isError
      }
    };
  }
  
  return {
    result: true,
    ticket: ticketState
  };
};

// Create a plan for a ticket from input data
export const planTicket = (data: PlanTaskInput): Ticket => {
  // PRプランからPullRequestオブジェクトを作成
  const pullRequests = data.prPlans.map(prPlan => {
    // コミットプランからCommitオブジェクトを作成
    const commits = prPlan.commitPlans.map(commitPlan => ({
      goal: commitPlan.goal,
      status: "not_started" as Status,
      developerNote: commitPlan.developerNote
    }));
    
    return {
      goal: prPlan.goal,
      status: "not_started" as Status,
      commits,
      developerNote: prPlan.developerNote
    };
  });

  // チケットを作成して返す
  return {
    goal: data.goal,
    pullRequests,
    needsMoreThoughts: data.needsMoreThoughts
  };
}; 