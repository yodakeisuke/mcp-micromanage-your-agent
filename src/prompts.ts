interface RequestExtra {
  readonly context?: {
    [key: string]: unknown;
  };
  readonly [key: string]: unknown;
}

// hope that the cursor supports the prompt as an mcp client
// alternative, you can include this in your .mdc
export const taskPlanningGuide = {
  name: "task-planning-guide",
  description: "A comprehensive guide for planning development tasks with minimal PRs and commits. Helps structure work before using the plan tool.",
  handler: () => ({
    description: "Task planning guide for minimal PRs and commits",
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `
# Task Planning Guide

## Purpose
- To design a structured implementation approach before any coding begins
- To ensure clear understanding of requirements and dependencies
- To divide tickets into small PRs and commits for easier review and integration

## Output
- A comprehensive work plan organized by PRs and commits
- Each PR should be small, functional, and independently reviewable
- Each commit should represent an atomic change within its PR
- To minimize dependencies between PRs, ideally making them independently implementable

## Method
### Analysis Phase
- Analyze the task's architecture requirements thoroughly
- Explore and read all potentially relevant existing code and similar reference code
- Develop a meta architecture plan for the solution

### Planning Approach
- Break down the task into smallest possible PRs
- Order PRs logically (e.g., setup → core logic → tests)
- Define 2-4 minimal atomic commits for each PR
- Prefer splitting tasks into PRs rather than large commits

### Implementation Criteria
- Only proceed after achieving 100% clarity and confidence
- Ensure all affected parts of the codebase have been fully identified through dependency tracing
- **The work plan must be approved by the user before implementation**

## Prohibited Actions
- **Any implementation or code writing, even "example code"**
          `
        }
      }
    ]
  })
};


// internal prompt
export const progressInstructionGuide = {
  name: "progressInstructionGuide",
  description: "Based on this progress report, analyze the current state and suggest the next commit to work on.",
  text: `
  Based on this progress report, analyze the current state and suggest the next commit to work on.
  **Next, you must strictly follow these procedures without exception**:
1. Before starting your next commit, obtain the user's approval.  
2. Once approved, implement the code and test scripts strictly within this commit's scope.  
   - Make sure there are no build errors or test failures.  
   - If a UI is involved, verify its behavior using mcp playwright.  
3. After completing the commit:  
   - Review and evaluate the implementation, and conduct a self-feedback cycle.  
   - Request feedback from the user.

  **User Review State Procedures**:
  When setting a task status to "user_review":
  1. Create a comprehensive review request message that includes:
     - A clear summary of the implementation derived from PR/commit goals and developer notes
     - Specific changes made and their intended functionality
     - Areas that particularly need user verification
     - Clear instructions for the user to approve (change status to "completed") or request changes
  2. Format the review request message in a structured way with clear section headings
  3. Remember that tasks cannot transition directly from other states to "completed" - they must go through "user_review" first
  4. Only users can transition tasks from "user_review" to "completed" after their review

  **Always secure the user's agreement before starting the next task.**
`};

// alternative, you can include this in your .mdc
export const updateTaskStatusRule= {
  name: "update-task-status-rule",
  description: "Always When updating the status of a task",
  text: `
    **STRICT RULES - MUST BE FOLLOWED WITHOUT EXCEPTION:**

    in_progress → user_review conditions:
    ✅ No compilation errors exist
    ✅ Necessary tests have been added and all pass
    ✅ Required documentation updates are completed

    needsRefinment → in_progress conditions:
    ✅ Requirements have been sufficiently clarified and ready for implementation
    ✅ All necessary information for implementation is available
    ✅ The scope of the task is clearly defined

    user_review → in_progress conditions:
    ✅ From feedback, the content to be modified is completely clear

    * → needsRefinment conditions:
    ✅ It becomes apparent that the task requirements are unclear or incomplete

    * → cancelled conditions:
    ✅ There is a clear reason why the task is no longer needed, or alternative methods or solutions to meet the requirements are clear
    ✅ The impact of cancellation on other related tasks has been evaluated
`};

// alternative, you can include this in your .mdc
export const solutionExplorationGuide= {
  name: "solution-exploration-guide",
  description: "When examining how to implement an issue",
  text: `
    ## Purpose
    - nformation gathering and Brainstorming potential approaches

    ## Forbidden: 
    - Concrete planning, implementation details, or any code writing

    ##output-format
    - file: ticket_[issue name].md
    - chapters:
        - Summary of the issue that will be resolved with the ticket
        - Overview of the architecture, domain model and data model to be changed or added this time
        - Work plan based on PR and commitment units(This is only for creating chapters, do not write content)

    ## Method
    - Understand the issue from the given information and existing code
    - research and interviews with users to ensure that we have all the information we need to complete the task
    - Analyze potential impacts to the existing codebase
`};