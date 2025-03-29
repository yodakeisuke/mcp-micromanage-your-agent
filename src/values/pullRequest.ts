import { Status } from './status.js';
import { Commit } from './commit.js';

export type PullRequest = {
  goal: string;
  status: Status;
  commits: Commit[];
  needsMoreThoughts?: boolean;
  developerNote?: string;
};

/**
 * Generates summary information for a list of pull requests
 */
export const generatePRSummaries = (pullRequests: PullRequest[]): Array<{
  prIndex: number;
  goal: string;
  status: Status;
  developerNote?: string;
  commits: {
    completed: number;
    total: number;
    percentComplete: number;
  };
}> => {
  return pullRequests.map((pr: PullRequest, prIndex: number) => {
    const completedCommits = pr.commits.filter((c: { status: Status }) => c.status === "completed").length;
    const totalCommits = pr.commits.length;
    
    return {
      prIndex: prIndex,
      goal: pr.goal,
      status: pr.status,
      developerNote: pr.developerNote,
      commits: {
        completed: completedCommits,
        total: totalCommits,
        percentComplete: totalCommits ? Math.round((completedCommits / totalCommits) * 100) : 0
      }
    };
  });
};

// Helper functions for status updates
export const updatePRStatusBasedOnCommits = (pr: PullRequest): PullRequest => {
  const commits = pr.commits;
  
  if (commits.length === 0) return pr;
  
  const updatedPr = { ...pr };
  
  // If all commits are completed, mark PR as completed
  if (commits.every(commit => commit.status === "completed")) {
    updatedPr.status = "completed";
  }
  // If any commit is in user_review status, mark PR as user_review (unless there are in_progress commits)
  else if (commits.some(commit => commit.status === "user_review") &&
           !commits.some(commit => commit.status === "in_progress")) {
    updatedPr.status = "user_review";
  }
  // If any commit is in progress, mark PR as in progress
  else if (commits.some(commit => commit.status === "in_progress")) {
    updatedPr.status = "in_progress";
  }
  // "blocked" status has been removed as per requirements
  
  // If any commit needs refinement, mark PR as needs refinement
  else if (commits.some(commit => commit.status === "needsRefinment") &&
           !commits.some(commit => commit.status === "in_progress")) {
    updatedPr.status = "needsRefinment";
  }
  
  return updatedPr;
};

/**
 * Updates the developer note for a pull request
 */
export const updatePRDeveloperNote = (pr: PullRequest, note: string): PullRequest => {
  return {
    ...pr,
    developerNote: note
  };
};

/**
 * Updates the developer note for a commit in a pull request
 */
export const updateCommitDeveloperNote = (pr: PullRequest, commitIndex: number, note: string): PullRequest => {
  if (commitIndex < 0 || commitIndex >= pr.commits.length) {
    return pr; // Invalid commit index
  }

  const updatedCommits = [...pr.commits];
  updatedCommits[commitIndex] = {
    ...updatedCommits[commitIndex],
    developerNote: note
  };

  return {
    ...pr,
    commits: updatedCommits
  };
}; 