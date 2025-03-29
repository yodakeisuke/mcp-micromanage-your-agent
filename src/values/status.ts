export type Status = 
  | "not_started" 
  | "in_progress" 
  | "user_review"
  | "completed" 
  | "cancelled"
  | "needsRefinment"; 

export type StatusTransitionValidationResult = {
  isValid: boolean;
  errorMessage?: string;
};

export function validateStatusTransition(currentStatus: Status, newStatus: Status): StatusTransitionValidationResult {
  // 同じステータスへの遷移は常に許可
  if (currentStatus === newStatus) {
    return { isValid: true };
  }

  // completedへの遷移は、user_reviewからのみ許可
  if (newStatus === 'completed' && currentStatus !== 'user_review') {
    return {
      isValid: false,
      errorMessage: `Tasks can only be marked as "completed" after going through user review.\n` +
        `In the user review phase:\n` +
        `- The implementation is reviewed by the user\n` +
        `- Feedback is gathered on the implementation\n` +
        `- User approves the changes before completion\n\n` +
        `Direct transition from "${currentStatus}" to "completed" is not allowed.\n` +
        `Correct path: "${currentStatus}" → "user_review" → "completed"`
    };
  }

  // in_progressへの遷移は、needsRefinmentからのみ許可
  if (newStatus === 'in_progress' && currentStatus !== 'needsRefinment') {
    return {
      isValid: false,
      errorMessage: `Tasks can only enter "in_progress" after going through the refinement phase.\n` +
        `In the refinement phase, you should:\n` +
        `- Clarify and confirm your understanding of the task requirements\n` +
        `- Review existing code to identify impacts and reference points\n` +
        `- Create a detailed implementation plan at the commit level\n` +
        `- Check if changes to other commit plans are needed\n\n` +
        `Direct transition from "${currentStatus}" to "in_progress" is not allowed.\n` +
        `Correct path: "${currentStatus}" → "needsRefinment" → "in_progress"`
    };
  }

  // not_startedからの遷移は、needsRefinmentまたはcancelledのみ許可
  if (currentStatus === 'not_started' && newStatus !== 'needsRefinment' && newStatus !== 'cancelled') {
    return {
      isValid: false,
      errorMessage: `Tasks must go through the refinement phase before implementation.\n` +
        `In the refinement phase, you should:\n` +
        `- Clarify and confirm your understanding of the task requirements\n` +
        `- Review existing code to identify impacts and reference points\n` +
        `- Create a detailed implementation plan at the commit level\n` +
        `- Check if changes to other commit plans are needed\n\n` +
        `Direct transition from "not_started" to "${newStatus}" is not allowed.\n` +
        `Correct path: "not_started" → "needsRefinment" → "in_progress"`
    };
  }

  // 将来的に追加される可能性のある他のバリデーションルール

  // その他の遷移は許可
  return { isValid: true };
}

export function getStatusDisplayInfo(status: Status): { displayName: string; description: string } {
  switch (status) {
    case 'not_started':
      return { 
        displayName: '未着手', 
        description: 'まだ作業が開始されていないタスク' 
      };
    case 'in_progress':
      return { 
        displayName: '進行中', 
        description: '現在取り組み中のタスク' 
      };
    case 'user_review':
      return { 
        displayName: 'ユーザーレビュー待ち', 
        description: 'ユーザーによるレビューが必要なタスク' 
      };
    case 'completed':
      return { 
        displayName: '完了', 
        description: '正常に完了したタスク' 
      };
    case 'cancelled':
      return { 
        displayName: 'キャンセル済', 
        description: '取り消されたタスク' 
      };
    case 'needsRefinment':
      return { 
        displayName: '要精査', 
        description: '再検討が必要なタスク' 
      };
  }
} 