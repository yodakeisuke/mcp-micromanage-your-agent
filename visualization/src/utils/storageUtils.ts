import { WorkPlan, CommitStatus, PRPlan, CommitPlan } from '../types';

// Local storage key
const STORAGE_KEY = 'workplan-visualization-data';

// List of valid status values
const VALID_STATUSES: CommitStatus[] = [
  'not_started', 
  'in_progress', 
  'completed', 
  'cancelled', 
  'needsRefinment',
  'user_review'
];

/**
 * Check if an object is a valid WorkPlan and fix it if necessary
 */
const validateWorkPlan = (data: any): WorkPlan => {
  // Basic structure check
  if (!data || typeof data !== 'object' || !data.goal || !Array.isArray(data.prPlans)) {
    throw new Error('Invalid workplan data structure');
  }

  // Validate and normalize PRPlans
  const validatedPrPlans: PRPlan[] = data.prPlans.map((pr: any): PRPlan => {
    if (!pr || typeof pr !== 'object' || !pr.goal || !Array.isArray(pr.commitPlans)) {
      throw new Error('Invalid PR data structure');
    }
    
    // Validate status
    const status = pr.status && VALID_STATUSES.includes(pr.status as CommitStatus) 
      ? pr.status as CommitStatus 
      : undefined;
    
    // Validate and normalize commit plans
    const commitPlans: CommitPlan[] = pr.commitPlans.map((commit: any): CommitPlan => {
      if (!commit || typeof commit !== 'object' || !commit.goal) {
        throw new Error('Invalid commit data structure');
      }
      
      // Validate commit status
      const commitStatus = commit.status && VALID_STATUSES.includes(commit.status as CommitStatus) 
        ? commit.status as CommitStatus 
        : undefined;
      
      return {
        goal: commit.goal,
        status: commitStatus,
        developerNote: commit.developerNote ? String(commit.developerNote) : undefined
      };
    });
    
    return {
      goal: pr.goal,
      status,
      commitPlans,
      developerNote: pr.developerNote ? String(pr.developerNote) : undefined
    };
  });
  
  return {
    goal: data.goal,
    prPlans: validatedPrPlans
  };
};

/**
 * Save workplan to local storage
 * @param workplan The workplan to save
 */
export const saveWorkPlanToStorage = (workplan: WorkPlan): void => {
  try {
    const serializedData = JSON.stringify(workplan);
    localStorage.setItem(STORAGE_KEY, serializedData);
  } catch (error) {
    console.error('Failed to save workplan:', error);
  }
};

/**
 * Get workplan from local storage
 * @returns The stored workplan, or null if not found
 */
export const getWorkPlanFromStorage = (): WorkPlan | null => {
  try {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    if (!serializedData) return null;
    
    const parsedData = JSON.parse(serializedData);
    return validateWorkPlan(parsedData);
  } catch (error) {
    console.error('Failed to get workplan:', error);
    return null;
  }
};

/**
 * Clear workplan from local storage
 */
export const clearWorkPlanStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to delete workplan:', error);
  }
}; 