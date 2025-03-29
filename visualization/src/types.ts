import { ReactNode } from 'react';
import { Node, Edge as ReactFlowEdge } from 'reactflow';

// Possible commit statuses
export type CommitStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'needsRefinment' | 'user_review';

// Node data type definition
export interface NodeData {
  label: ReactNode; // Node label
  description?: string; // Node description
  status?: CommitStatus; // Node status
  statusLabel?: string; // Status label
  statusIcon?: string; // Status icon
  onEdit?: (data: NodeData) => void; // Callback when edit button is clicked
  onStatusChange?: (data: NodeData) => void; // Callback when status change button is clicked
}

// Extended node type
export type ExtendedNode<T = any> = Node<T>;

// Edge type
export type Edge = ReactFlowEdge;

// Commit plan type
export interface CommitPlan {
  goal: string;
  status?: CommitStatus;
  developerNote?: string; // Developer implementation notes captured during refinement
}

// PR plan type
export interface PRPlan {
  goal: string;
  commitPlans: CommitPlan[];
  status?: CommitStatus;
  developerNote?: string; // Developer implementation notes captured during refinement
}

// Work plan type
export interface WorkPlan {
  goal: string;
  prPlans: PRPlan[];
} 