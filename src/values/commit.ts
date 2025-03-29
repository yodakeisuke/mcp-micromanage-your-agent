import { Status } from './status.js';

export type CommitId = string;

export type Commit = {
  commitId?: CommitId;
  goal: string;
  status: Status;
  needsMoreThoughts?: boolean;
  needsRevision?: boolean;
  revisesTargetCommit?: CommitId;
  developerNote?: string;
}; 