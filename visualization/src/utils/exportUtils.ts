import { WorkPlan, CommitStatus } from '../types';

// Status display name mapping
const STATUS_LABELS: Record<CommitStatus, string> = {
  'not_started': 'Not Started',
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'needsRefinment': 'Needs Refinement',
  'user_review': 'Waiting for User Review'
};

// Status icon mapping
const STATUS_ICONS: Record<CommitStatus, string> = {
  'not_started': '⚪',
  'in_progress': '🔄',
  'completed': '✅',
  'cancelled': '❌',
  'needsRefinment': '⚠️',
  'user_review': '👀'
};

/**
 * Export WorkPlan as JSON
 * @param workplan The workplan to export
 * @returns Formatted JSON string
 */
export const exportToJSON = (workplan: WorkPlan): string => {
  return JSON.stringify(workplan, null, 2);
};

/**
 * Export WorkPlan as Markdown
 * @param workplan The workplan to export
 * @returns Markdown formatted string
 */
export const exportToMarkdown = (workplan: WorkPlan): string => {
  let markdown = `# ${workplan.goal}\n\n`;
  
  markdown += `Created: ${new Date().toLocaleString()}\n\n`;
  
  const totalPRs = workplan.prPlans.length;
  const completedPRs = workplan.prPlans.filter(pr => 
    pr.status === 'completed' || 
    pr.commitPlans.every(commit => commit.status === 'completed')
  ).length;
  
  const totalCommits = workplan.prPlans.reduce((total, pr) => total + pr.commitPlans.length, 0);
  const completedCommits = workplan.prPlans.reduce((total, pr) => 
    total + pr.commitPlans.filter(commit => commit.status === 'completed').length, 
  0);
  
  markdown += `## Progress Summary\n\n`;
  markdown += `- PR Progress: ${completedPRs}/${totalPRs} (${Math.round(completedPRs / totalPRs * 100)}%)\n`;
  markdown += `- Commit Progress: ${completedCommits}/${totalCommits} (${Math.round(completedCommits / totalCommits * 100)}%)\n\n`;
  
  workplan.prPlans.forEach((pr, prIndex) => {
    const prStatus = pr.status || 
      (pr.commitPlans.every(commit => commit.status === 'completed') ? 'completed' : 
      pr.commitPlans.some(commit => commit.status === 'in_progress') ? 'in_progress' : 'not_started');
    
    const prIcon = STATUS_ICONS[prStatus as CommitStatus] || '';
    
    markdown += `## PR ${prIndex + 1}: ${pr.goal} ${prIcon}\n\n`;
    
    pr.commitPlans.forEach((commit, commitIndex) => {
      const status = commit.status || 'not_started';
      const statusIcon = STATUS_ICONS[status];
      const statusLabel = STATUS_LABELS[status];
      
      markdown += `### Commit ${commitIndex + 1}: ${statusIcon} ${commit.goal}\n`;
      markdown += `Status: ${statusLabel}\n\n`;
    });
    
    markdown += '\n';
  });
  
  return markdown;
};

/**
 * Export WorkPlan as CSV
 * @param workplan The workplan to export
 * @returns CSV formatted string
 */
export const exportToCSV = (workplan: WorkPlan): string => {
  let csv = 'PR Number,PR Goal,PR Status,Commit Number,Commit Goal,Commit Status\n';
  
  workplan.prPlans.forEach((pr, prIndex) => {
    const prStatus = pr.status || 
      (pr.commitPlans.every(commit => commit.status === 'completed') ? 'completed' : 
      pr.commitPlans.some(commit => commit.status === 'in_progress') ? 'in_progress' : 'not_started');
    
    pr.commitPlans.forEach((commit, commitIndex) => {
      const status = commit.status || 'not_started';
      const statusLabel = STATUS_LABELS[status];
      
      const escapeCsv = (text: string) => `"${text.replace(/"/g, '""')}"`;
      
      csv += `${prIndex + 1},${escapeCsv(pr.goal)},${STATUS_LABELS[prStatus as CommitStatus] || ''},`;
      csv += `${commitIndex + 1},${escapeCsv(commit.goal)},${statusLabel}\n`;
    });
  });
  
  return csv;
};

/**
 * Download file to the user's device
 * @param content File content
 * @param fileName File name
 * @param contentType Content type
 */
export const downloadFile = (content: string, fileName: string, contentType: string): void => {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  
  URL.revokeObjectURL(a.href);
};

/**
 * Download WorkPlan as JSON
 * @param workplan The workplan to export
 * @param fileName File name (default: workplan.json)
 */
export const downloadAsJSON = (workplan: WorkPlan, fileName: string = 'workplan.json'): void => {
  const json = exportToJSON(workplan);
  downloadFile(json, fileName, 'application/json');
};

/**
 * Download WorkPlan as Markdown
 * @param workplan The workplan to export
 * @param fileName File name (default: workplan.md)
 */
export const downloadAsMarkdown = (workplan: WorkPlan, fileName: string = 'workplan.md'): void => {
  const markdown = exportToMarkdown(workplan);
  downloadFile(markdown, fileName, 'text/markdown');
};

/**
 * Download WorkPlan as CSV
 * @param workplan The workplan to export
 * @param fileName File name (default: workplan.csv)
 */
export const downloadAsCSV = (workplan: WorkPlan, fileName: string = 'workplan.csv'): void => {
  const csv = exportToCSV(workplan);
  downloadFile(csv, fileName, 'text/csv');
}; 