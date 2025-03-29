import { progressInstructionGuide } from '../prompts.js';
import { Ticket, planTicket, ensureTicketExists } from '../values/ticket.js';
import { PullRequest, updatePRStatusBasedOnCommits, generatePRSummaries } from '../values/pullRequest.js';
import { Status, validateStatusTransition } from '../values/status.js';
import * as fileStorage from '../utils/fileStorage.js';
import logger from '../utils/logger.js';

// command input schema
export interface PlanTaskInput {
  goal: string;
  prPlans: Array<{
    goal: string;
    commitPlans: Array<{
      goal: string;
      developerNote?: string;  // Added field for developer implementation notes
    }>;
    developerNote?: string;  // Added field for developer implementation notes
  }>;
  needsMoreThoughts?: boolean;
}

export interface UpdateStatusInput {
  prIndex: number;
  commitIndex: number;
  status: Status;
  goal?: string;
  developerNote?: string;  // Added field for developer implementation notes
}

// 初期化オプション
export interface WorkPlanInitOptions {
  dataDir?: string;         // データディレクトリパス
  dataFileName?: string;    // データファイル名
}

// helpers
const errorResponse = (error: string): { content: Array<{ type: string; text: string }>; isError: boolean } => {
  logger.error(`Error response generated: ${error}`);
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        error: error,
        status: 'failed'
      }, null, 2)
    }],
    isError: true
  };
};

// ファイル操作に関連するエラーハンドリング
const handleFileOperationError = (operation: string, error: unknown): void => {
  logger.logError(`File operation error during ${operation}`, error);
};

// WorkPlanの状態をJSON形式で表現するインターフェース
export interface WorkPlanState {
  currentTicket: Ticket | "noTicket";
  lastUpdated?: string;     // 最終更新日時
  version?: string;         // データ形式のバージョン
}

// aggregate
export class WorkPlan {
  // state
  private currentTicket: Ticket | "noTicket" = "noTicket";
  private initialized: boolean = false;
  private lastUpdated: string = new Date().toISOString();
  private readonly version: string = "1.0.0"; // データ形式のバージョン
  
  constructor(options?: WorkPlanInitOptions) {
    // 初期化オプションの処理
    if (options) {
      this.initialize(options);
    }
  }
  
  /**
   * WorkPlanの初期化メソッド
   * @param options 初期化オプション
   * @returns 初期化が成功したかどうか
   */
  public initialize(options: WorkPlanInitOptions = {}): boolean {
    try {
      logger.info('Initializing WorkPlan with options:', options);
      
      // データディレクトリの設定
      if (options.dataDir) {
        fileStorage.setDataDirectory(options.dataDir);
      }
      
      // データファイル名の設定
      if (options.dataFileName) {
        fileStorage.setDataFileName(options.dataFileName);
      }
      
      // 常に自動的にデータをロードする
      this.loadState();
      
      // ファイルが存在しない場合に常に新規作成
      if (!fileStorage.fileExists()) {
        logger.info('Creating initial data file as it does not exist');
        this.saveState();
      }
      
      this.initialized = true;
      logger.info(`WorkPlan initialized successfully. Using data file: ${fileStorage.getDataFilePath()}`);
      return true;
    } catch (error) {
      handleFileOperationError('initialization', error);
      return false;
    }
  }
  
  /**
   * WorkPlanが初期化されているかどうかを確認
   * @returns 初期化済みの場合はtrue
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  // ファイルから状態を読み込む
  private loadState(): void {
    try {
      logger.info('Loading WorkPlan state from file');
      const defaultState: WorkPlanState = {
        currentTicket: "noTicket",
        lastUpdated: this.lastUpdated,
        version: this.version
      };
      
      const savedState = fileStorage.loadFromFile<WorkPlanState>(defaultState);
      
      // 読み込んだ状態をクラスに適用
      this.currentTicket = savedState.currentTicket;
      this.lastUpdated = savedState.lastUpdated || new Date().toISOString();
      
      // バージョンチェック (将来の互換性のため)
      if (savedState.version && savedState.version !== this.version) {
        logger.warn(`Data version mismatch: file=${savedState.version}, current=${this.version}`);
      }
      
      logger.info(`WorkPlan state loaded from file: ${fileStorage.getDataFilePath()}`);
      
      if (this.currentTicket === "noTicket") {
        logger.info('No active ticket found in loaded state');
      } else {
        const ticket = this.currentTicket;
        logger.info(`Loaded ticket with goal: ${ticket.goal}, ${ticket.pullRequests.length} PRs`);
      }
    } catch (error) {
      handleFileOperationError('loading state from file', error);
    }
  }
  
  // 状態をファイルに保存
  private saveState(): boolean {
    try {
      logger.info('Saving WorkPlan state to file');
      
      // 最終更新日時を更新
      this.lastUpdated = new Date().toISOString();
      
      const state: WorkPlanState = {
        currentTicket: this.currentTicket,
        lastUpdated: this.lastUpdated,
        version: this.version
      };
      
      const success = fileStorage.saveToFile<WorkPlanState>(state);
      
      if (success) {
        logger.info(`WorkPlan state saved to file: ${fileStorage.getDataFilePath()}`);
      } else {
        logger.error('Failed to save WorkPlan state to file');
      }
      
      return success;
    } catch (error) {
      handleFileOperationError('saving state to file', error);
      return false;
    }
  }

  // commands
  public plan(input: PlanTaskInput): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      // 初期化チェック
      if (!this.initialized) {
        return errorResponse('WorkPlan is not initialized. Call initialize() first.');
      }
      
      logger.info(`Creating plan with goal: ${input.goal}, ${input.prPlans.length} PRs`);
      const newTicket = planTicket(input);
      
      const isReplacing = this.currentTicket !== "noTicket";
      
      this.currentTicket = newTicket;
      
      // 状態をファイルに保存
      const saveSuccess = this.saveState();

      let message = `Implementation plan created with ${newTicket.pullRequests.length} PRs and ${newTicket.pullRequests.reduce((sum: number, pr: PullRequest) => sum + pr.commits.length, 0)} commits.`;
      
      if (isReplacing) {
        message = `Previous plan has been replaced. ${message}`;
      }

      logger.info(message);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            prCount: newTicket.pullRequests.length,
            commitCount: newTicket.pullRequests.reduce((sum: number, pr: PullRequest) => sum + pr.commits.length, 0),
            message,
            persistenceStatus: saveSuccess ? 'saved' : 'memory_only',
            lastUpdated: this.lastUpdated
          }, null, 2)
        }]
      };
    } catch (error) {
      logger.logError('Error during plan creation', error);
      return errorResponse(error instanceof Error ? error.message : String(error));
    }
  }

  public trackProgress(): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      // 初期化チェック
      if (!this.initialized) {
        return errorResponse('WorkPlan is not initialized. Call initialize() first.');
      }
      
      logger.info('Tracking progress');
      const ticketCheck = ensureTicketExists(this.currentTicket);
      if (!ticketCheck.result) {
        logger.warn('No implementation plan found');
        return ticketCheck.response;
      }
      
      const ticket = ticketCheck.ticket;
      
      // Calculate progress statistics
      const completedPRs = ticket.pullRequests.filter((pr: PullRequest) => pr.status === "completed").length;
      const totalPRs = ticket.pullRequests.length;
      const completedCommits = ticket.pullRequests.reduce(
        (sum: number, pr: PullRequest) => sum + pr.commits.filter((c: { status: Status }) => c.status === "completed").length, 0);
      const totalCommits = ticket.pullRequests.reduce((sum: number, pr: PullRequest) => sum + pr.commits.length, 0);
      
      // Generate PR status summary
      const prSummaries = generatePRSummaries(ticket.pullRequests);
      
      // Create detailed PR and commit information including developer notes
      const detailedPRs = ticket.pullRequests.map((pr: PullRequest, prIndex: number) => {
        const detailedCommits = pr.commits.map((commit, commitIndex) => {
          return {
            commitIndex,
            goal: commit.goal,
            status: commit.status,
            developerNote: commit.developerNote
          };
        });

        return {
          prIndex,
          goal: pr.goal,
          status: pr.status,
          developerNote: pr.developerNote,
          commits: detailedCommits
        };
      });
      
      logger.info(`Progress: ${completedPRs}/${totalPRs} PRs, ${completedCommits}/${totalCommits} commits, ${Math.round((completedCommits / totalCommits) * 100)}% complete`);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            goal: ticket.goal,
            progress: {
              prs: `${completedPRs}/${totalPRs}`,
              commits: `${completedCommits}/${totalCommits}`,
              percentComplete: totalCommits ? Math.round((completedCommits / totalCommits) * 100) : 0
            },
            pullRequests: prSummaries,
            detailedPullRequests: detailedPRs,  // Add detailed information including developer notes
            agentInstruction: progressInstructionGuide.text,
            persistenceInfo: {
              dataFilePath: fileStorage.getDataFilePath(),
              fileExists: fileStorage.fileExists(),
              lastUpdated: this.lastUpdated
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      logger.logError('Error during progress tracking', error);
      return errorResponse(error instanceof Error ? error.message : String(error));
    }
  }

  // Method to update status
  public updateStatus(input: UpdateStatusInput): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      // 初期化チェック
      if (!this.initialized) {
        return errorResponse('WorkPlan is not initialized. Call initialize() first.');
      }
      
      logger.info(`Updating status for PR #${input.prIndex}, commit #${input.commitIndex} to "${input.status}"`);
      const ticketCheck = ensureTicketExists(this.currentTicket, true);
      if (!ticketCheck.result) {
        logger.warn('No implementation plan found');
        return ticketCheck.response;
      }
      
      const ticket = ticketCheck.ticket;
      
      const prIndex = input.prIndex;
      if (prIndex < 0 || prIndex >= ticket.pullRequests.length) {
        const error = `Invalid prIndex: must be between 0 and ${ticket.pullRequests.length - 1}`;
        logger.error(error);
        return errorResponse(error);
      }

      const changes: string[] = [];
      const pr = ticket.pullRequests[prIndex];
      
      // Special case: commit index -1 means we're updating the PR itself, not a commit
      // This allows adding developer notes directly to PRs
      if (input.commitIndex === -1) {
        // Only update the developer note for the PR
        if (input.developerNote !== undefined) {
          ticket.pullRequests[prIndex].developerNote = input.developerNote;
          changes.push(`PR developer note updated`);
          logger.info(`Updated PR developer note: ${input.developerNote}`);

          // 変更をファイルに保存
          const saveSuccess = this.saveState();

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                message: `PR #${prIndex} ${changes.join(" and ")}.`,
                prIndex: prIndex,
                developerNote: input.developerNote,
                persistenceStatus: saveSuccess ? 'saved' : 'memory_only',
                lastUpdated: this.lastUpdated
              }, null, 2)
            }]
          };
        } else {
          const error = `When updating a PR directly (commitIndex -1), developerNote must be provided`;
          logger.error(error);
          return errorResponse(error);
        }
      }
      
      const commitIndex = input.commitIndex;
      if (commitIndex < 0 || commitIndex >= pr.commits.length) {
        const error = `Invalid commitIndex: must be between 0 and ${pr.commits.length - 1}`;
        logger.error(error);
        return errorResponse(error);
      }
      
      // ステータス遷移のバリデーション
      const currentStatus = ticket.pullRequests[prIndex].commits[commitIndex].status;
      
      // ステータス遷移のバリデーションを実行
      const validationResult = validateStatusTransition(currentStatus, input.status);
      if (!validationResult.isValid) {
        const errorMessage = validationResult.errorMessage || 'ステータス遷移が無効です';
        logger.error(errorMessage);
        return errorResponse(errorMessage);
      }
      
      // If setting a task to "in_progress", reset any other in-progress tasks to "not_started"
      if (input.status === 'in_progress') {
        // Find all in-progress tasks and reset them to not_started
        let resetTasksCount = 0;
        ticket.pullRequests.forEach((pullRequest, pullRequestIndex) => {
          pullRequest.commits.forEach((commit, commitIdx) => {
            // Skip the current task being updated
            if (pullRequestIndex === prIndex && commitIdx === commitIndex) {
              return;
            }
            
            // Reset any other in-progress tasks to not_started
            if (commit.status === 'in_progress') {
              ticket.pullRequests[pullRequestIndex].commits[commitIdx].status = 'not_started';
              resetTasksCount++;
              logger.info(`Reset task PR #${pullRequestIndex}, commit #${commitIdx} from "in_progress" to "not_started"`);
            }
          });
        });
        
        if (resetTasksCount > 0) {
          changes.push(`${resetTasksCount} other in-progress tasks reset to "not_started"`);
        }
      }
      
      ticket.pullRequests[prIndex].commits[commitIndex].status = input.status;
      changes.push(`status updated to "${input.status}"`);
      
      // Update PR status based on commits
      const updatedPr = updatePRStatusBasedOnCommits(ticket.pullRequests[prIndex]);
      ticket.pullRequests[prIndex] = updatedPr;
      
      // ゴール更新
      if (input.goal !== undefined) {
        ticket.pullRequests[prIndex].commits[commitIndex].goal = input.goal;
        changes.push(`goal updated to "${input.goal}"`);
        logger.info(`Updated commit goal to: ${input.goal}`);
      }
      
      // 開発者メモの更新
      if (input.developerNote !== undefined) {
        ticket.pullRequests[prIndex].commits[commitIndex].developerNote = input.developerNote;
        changes.push(`developer note updated`);
        logger.info(`Updated commit developer note: ${input.developerNote}`);
      }
      
      // 変更をファイルに保存
      const saveSuccess = this.saveState();
      
      logger.info(`Commit #${commitIndex} ${changes.join(" and ")}`);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            message: `Commit #${commitIndex} ${changes.join(" and ")}.`,
            prIndex: prIndex,
            commitIndex: commitIndex,
            status: input.status,
            goal: input.goal,
            developerNote: input.developerNote,
            persistenceStatus: saveSuccess ? 'saved' : 'memory_only',
            lastUpdated: this.lastUpdated
          }, null, 2)
        }]
      };
    } catch (error) {
      logger.logError('Error during status update', error);
      return errorResponse(error instanceof Error ? error.message : String(error));
    }
  }
  
  // カスタム設定のための公開メソッド
  public setDataDirectory(dir: string): void {
    logger.info(`Setting data directory to: ${dir}`);
    fileStorage.setDataDirectory(dir);
  }
  
  public setDataFileName(fileName: string): void {
    logger.info(`Setting data file name to: ${fileName}`);
    fileStorage.setDataFileName(fileName);
  }
  
  /**
   * データを再ロードする
   * @returns 再ロードに成功した場合はtrue
   */
  public reloadData(): boolean {
    try {
      this.loadState();
      return true;
    } catch (error) {
      handleFileOperationError('reloading data', error);
      return false;
    }
  }
  
  /**
   * 現在のデータを強制的に保存する
   * @returns 保存に成功した場合はtrue
   */
  public forceSave(): boolean {
    return this.saveState();
  }
  
}