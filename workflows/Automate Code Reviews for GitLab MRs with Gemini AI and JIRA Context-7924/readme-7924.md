Automate Code Reviews for GitLab MRs with Gemini AI and JIRA Context

https://n8nworkflows.xyz/workflows/automate-code-reviews-for-gitlab-mrs-with-gemini-ai-and-jira-context-7924


# Automate Code Reviews for GitLab MRs with Gemini AI and JIRA Context

### 1. Workflow Overview

This workflow automates AI-powered code reviews on GitLab Merge Requests (MRs) by integrating Gemini AI and JIRA context. The main use case is to enable teams to obtain automated, high-value feedback on code changes focusing on business logic, correctness, security, and performance. It listens for a specific GitLab MR comment trigger, fetches the MR diff and relevant JIRA ticket context, invokes an LLM for review, and posts inline comments or summary notes back to the MR.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Trigger Handling:** Listens for GitLab MR comment events and filters those requesting a review.
- **1.2 Static Context Initialization:** Stores persistent data such as project and MR IDs for use across nodes and error handling.
- **1.3 JIRA Context Extraction:** Extracts JIRA issue keys from MR descriptions and fetches issue and parent issue details.
- **1.4 Merge Request Data Preparation:** Retrieves MR changes, parses diffs, and prepares original vs new code for review.
- **1.5 AI Review Processing:** Sends code change segments with JIRA context to Gemini AI for automated review.
- **1.6 Review Results Processing:** Aggregates AI comments, filters relevant issues, and determines if issues were found.
- **1.7 Posting Comments to GitLab:** Posts inline comments or summary notes to the MR, with fallback for comments without position.
- **1.8 Error Handling & Cleanup:** Handles errors with contextual posting and clears static context after execution.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Trigger Handling

**Overview:**  
This block listens for GitLab MR comment webhook events and triggers the workflow only if the comment matches the configured trigger phrase.

**Nodes Involved:**  
- Listen For Gitlab Comments (Webhook)  
- Need Review (If)  

**Node Details:**

- **Listen For Gitlab Comments**  
  - Type: Webhook  
  - Role: Receives HTTP POST from GitLab when a note is added to an MR.  
  - Key Config: webhook path and HTTP method POST (customized by user).  
  - Output: Emits event data containing note details.  
  - Edge Cases: Webhook misconfiguration, unauthorized calls, missing note data.  

- **Need Review**  
  - Type: If  
  - Role: Checks if the comment text equals the trigger phrase (default: `coro-bot-review`).  
  - Key Expression: `{{$json.body.object_attributes.note}} === 'coro-bot-review'`  
  - Output: Passes only triggering comments for further processing.  
  - Edge Cases: Case sensitivity, empty or malformed comments.

---

#### 2.2 Static Context Initialization

**Overview:**  
Stores MR identifiers in workflow static data for persistent reference across nodes and in error handling.

**Nodes Involved:**  
- Set workflow execution information  
- Post Review Started  

**Node Details:**

- **Set workflow execution information**  
  - Type: Code  
  - Role: Extracts project ID and MR IID from webhook payload and stores them keyed by execution ID in static data.  
  - Key Expression: Uses `$input.first().json.body.project_id` and MR IID path.  
  - Output: Passes input unchanged.  
  - Edge Cases: Missing IDs in webhook payload, static data access issues.

- **Post Review Started**  
  - Type: HTTP Request  
  - Role: Posts a comment to the MR notifying that AI review has started.  
  - Config: POST to GitLab MR notes endpoint with private token authentication.  
  - Body Content: Fixed message about AI review initiation duration.  
  - Edge Cases: API rate limits, invalid token, network failures.

---

#### 2.3 JIRA Context Extraction

**Overview:**  
Extracts JIRA issue keys from the MR description and fetches corresponding JIRA issue and parent issue to enrich context for AI review.

**Nodes Involved:**  
- Extract MR Details  
- Extract the JIRA Issue ID  
- Get JIRA issue  
- If JIRA Subtask  
- Get JIRA Parent Issue  
- Format JIRA Context  
- Format JIRA Parent Context  
- Merge  

**Node Details:**

- **Extract MR Details**  
  - Type: Set  
  - Role: Extracts project ID, MR IID, and MR description from webhook payload for downstream use.  
  - Output: Adds `projectId`, `iid`, and `description` fields.  
  - Edge Cases: Missing or malformed fields.

- **Extract the JIRA Issue ID**  
  - Type: Code  
  - Role: Uses regex to find JIRA issue keys (e.g., `PROJ-123`) from MR description text.  
  - Output: Emits JSON with `jiraIssueKey` or empty array if none found (halts downstream).  
  - Edge Cases: No JIRA key found, malformed description.

- **Get JIRA issue**  
  - Type: JIRA  
  - Role: Fetches JIRA issue data using extracted key.  
  - Credentials: Jira Software Cloud OAuth.  
  - Output: JIRA issue JSON.  
  - Edge Cases: Invalid key, auth errors, API downtime.

- **If JIRA Subtask**  
  - Type: If  
  - Role: Checks if the fetched JIRA issue has a parent (subtask).  
  - Output: True branch triggers fetching parent issue.  
  - Edge Cases: Missing parent field, null values.

- **Get JIRA Parent Issue**  
  - Type: JIRA  
  - Role: Fetches parent issue details if subtask.  
  - Output: Parent issue JSON.  
  - Edge Cases: Same as Get JIRA issue.

- **Format JIRA Context**  
  - Type: Set  
  - Role: Formats the JIRA issue summary, type, and description into a string for the prompt.  
  - Output: Adds `jiraContext` string.  
  - Edge Cases: Missing fields in JIRA data.

- **Format JIRA Parent Context**  
  - Type: Set  
  - Role: Formats parent JIRA issue similarly.  
  - Output: Adds `jiraParentContext` string.

- **Merge**  
  - Type: Merge  
  - Role: Combines JIRA context data streams into a single object for prompt construction.  
  - Mode: Combine by position, including unpaired inputs.  
  - Edge Cases: Missing inputs, partial data.

---

#### 2.4 Merge Request Data Preparation

**Overview:**  
Fetches the MR code changes from GitLab API, splits the diff into file changes, filters out irrelevant changes, parses diff hunks, and prepares original vs new code segments for review.

**Nodes Involved:**  
- Get MR Changes  
- Split Out Changes  
- Skip File Changes  
- Parse Diff  
- Prepare Code Changes  
- Filter Irrelevant Fields  

**Node Details:**

- **Get MR Changes**  
  - Type: HTTP Request  
  - Role: Retrieves the MR changes (diffs) from GitLab API using project ID and MR IID.  
  - Auth: Private token from environment variable.  
  - Output: JSON with MR changes.  
  - Edge Cases: API rate limits, invalid tokens, large MR diffs.

- **Split Out Changes**  
  - Type: Split Out  
  - Role: Splits the array of file changes into individual items for granular processing.  
  - Fields Included: JIRA context, IID, project ID, diff refs.  
  - Edge Cases: Empty changes array.

- **Skip File Changes**  
  - Type: If  
  - Role: Filters out renamed or deleted files or diffs starting with `@@` (likely metadata).  
  - Conditions: renamed_file=false, deleted_file=false, diff starts with "@@"  
  - Edge Cases: Unexpected diff formats.

- **Parse Diff**  
  - Type: Code  
  - Role: Parses the last diff hunk to extract line number information for positioning inline comments.  
  - Output: Adds `lastOldLine`, `lastNewLine`, and cleaned `gitDiff`.  
  - Edge Cases: Malformed diffs, no newline at end marker.

- **Prepare Code Changes**  
  - Type: Code  
  - Role: Splits diff text into original and new code blocks by line prefix (`-` for original, `+` for new).  
  - Output: Adds `originalCode` and `newCode` fields to each item.  
  - Edge Cases: Complex diffs with context lines, empty diffs.

- **Filter Irrelevant Fields**  
  - Type: Set  
  - Role: Selects and passes only relevant fields for downstream nodes (diff refs, file paths, line numbers).  
  - Output: Refined JSON for AI prompt.  

---

#### 2.5 AI Review Processing

**Overview:**  
Constructs a prompt including JIRA context and code changes, then sends it to Gemini AI for review focusing on logic, security, and performance issues.

**Nodes Involved:**  
- Basic LLM Chain  
- Google Gemini Chat Model  
- Merge LLM Output with Input  
- Aggregate  

**Node Details:**

- **Basic LLM Chain**  
  - Type: Langchain LLM Chain  
  - Role: Builds a structured prompt with JIRA context and a code diff snippet for the LLM.  
  - Prompt:  
    ```
    First, consider the context from the associated JIRA ticket:
    ------------
    {{jiraParentContext || jiraContext || 'No JIRA context was provided.'}}
    ------------
    
    File path：{{ new_path }}
    
    ```Original code
    {{ originalCode }}
    ```
    change to
    ```New code
    {{ newCode }}
    ```
    Please review the code changes in this section:
    ```
  - Output: Text prompt sent to LLM.  
  - Edge Cases: Missing context, large diffs.

- **Google Gemini Chat Model**  
  - Type: Langchain LM Chat (Google Gemini)  
  - Role: Sends prompt to Gemini AI model for code review.  
  - Config: Temperature 0, topK 1, model version "gemini-2.5-pro".  
  - Credentials: Google Palm API credentials.  
  - Output: AI-generated review text.  
  - Edge Cases: API quota, rate limits, model errors.

- **Merge LLM Output with Input**  
  - Type: Merge  
  - Role: Combines AI review output with original input item to keep context.  
  - Edge Cases: Missing AI response.

- **Aggregate**  
  - Type: Aggregate  
  - Role: Collects all AI responses into one array for further filtering.  
  - Edge Cases: Empty responses.

---

#### 2.6 Review Results Processing

**Overview:**  
Filters AI comments to exclude empty or non-actionable items and determines whether any issues were found.

**Nodes Involved:**  
- Process Comments  
- Any Issues Found?  
- Get Static Context  
- Split Out Comments  

**Node Details:**

- **Process Comments**  
  - Type: Code  
  - Role: Filters aggregated AI comments removing those with empty text, `ALL_CLEAR`, or variations of no findings.  
  - Output: `commentsToPost` array and `noIssuesFound` boolean.  
  - Edge Cases: Incorrect filtering logic.

- **Any Issues Found?**  
  - Type: If  
  - Role: Checks if no issues were found by evaluating `noIssuesFound` boolean.  
  - Output: True branch triggers posting a no-issues note, false branch proceeds to post comments.

- **Get Static Context**  
  - Type: Code  
  - Role: Retrieves project and MR IDs from static data for posting comments.  
  - Edge Cases: Missing static data due to execution context issues.

- **Split Out Comments**  
  - Type: Split Out  
  - Role: Splits filtered comments into individual items for posting.  
  - Edge Cases: Empty comments array.

---

#### 2.7 Posting Comments to GitLab

**Overview:**  
Posts AI review comments to GitLab MR discussions, either as inline comments with position or as fallback top-level comments if positioning fails.

**Nodes Involved:**  
- Prepare Request  
- Post Gitlab MR Comments  
- Prepare Request Without Position  
- Post Gitlab MR Comments WIthout Position  
- Post No Issues Found  
- Cleanup Static Context  

**Node Details:**

- **Prepare Request**  
  - Type: Code  
  - Role: Builds request body including nested GitLab MR diff position info (file paths, commit SHAs, line numbers).  
  - Output: `requestBody` with `body` and `position` keys for inline comments.  
  - Edge Cases: Missing line info, invalid data types.

- **Post Gitlab MR Comments**  
  - Type: HTTP Request  
  - Role: Posts inline comments to GitLab MR discussions with position info.  
  - Auth: Private token from environment variable.  
  - On Error: Continues without stopping workflow to allow fallback.  
  - Edge Cases: API errors, invalid positioning.

- **Prepare Request Without Position**  
  - Type: Code  
  - Role: Builds request body without position info to post as general discussion comment (fallback).  
  - Output: `requestBody` with only `body` key.

- **Post Gitlab MR Comments WIthout Position**  
  - Type: HTTP Request  
  - Role: Posts fallback comments at MR discussion level without positioning.  
  - Edge Cases: API limits, missing data.

- **Post No Issues Found**  
  - Type: HTTP Request  
  - Role: Posts a summary comment indicating the AI found no issues.  
  - Body: Fixed "LGTM" message.  
  - Edge Cases: Posting failures.

- **Cleanup Static Context**  
  - Type: Code  
  - Role: Deletes stored static context data for the current execution to avoid stale data.  
  - Output: Empty data array.  

---

#### 2.8 Error Handling & Cleanup

**Overview:**  
Handles errors during execution by retrieving static context and posting an error message to the MR, followed by cleanup.

**Nodes Involved:**  
- Error Trigger  
- Get Static Context Including Error  
- Post Error Occurred  
- Cleanup Static Context  

**Node Details:**

- **Error Trigger**  
  - Type: Error Trigger Node  
  - Role: Catches any workflow errors to initiate error handling path.  
  - Edge Cases: Errors in error handling nodes.

- **Get Static Context Including Error**  
  - Type: Code  
  - Role: Retrieves static context combined with error message for reporting.  
  - Output: JSON including `projectId`, `mrId`, and `error` message.

- **Post Error Occurred**  
  - Type: HTTP Request  
  - Role: Posts an error comment to GitLab MR notifying users of the failure and suggesting to retry.  
  - Edge Cases: API errors during error reporting.

- **Cleanup Static Context**  
  - (Shared node with posting block) Deletes static data after error handling.

---

### 3. Summary Table

| Node Name                      | Node Type                    | Functional Role                          | Input Node(s)                        | Output Node(s)                      | Sticky Note                                                                                   |
|--------------------------------|------------------------------|----------------------------------------|------------------------------------|-----------------------------------|----------------------------------------------------------------------------------------------|
| Listen For Gitlab Comments      | Webhook                      | Entry point, listens for MR comments   | -                                  | Need Review                       | "### 🟢 Step 1: Listen & Capture\nA Webhook node listens for merge request note events. ..."  |
| Need Review                    | If                           | Checks if comment equals trigger phrase| Listen For Gitlab Comments          | Set workflow execution information| "Change the trigger word in the **IF** node to match your own.\n..."                         |
| Set workflow execution information | Code                       | Stores MR and project IDs in static data | Need Review                      | Post Review Started, Extract MR Details | "### 🔵 Static Context & Error Handling\nWorkflow Static Data is used to store persistent values..." |
| Post Review Started            | HTTP Request                 | Posts "AI review started" comment      | Set workflow execution information | Extract MR Details                |                                                                                              |
| Extract MR Details             | Set                         | Extracts MR project ID, IID, description | Set workflow execution information | Get MR Changes, Extract the JIRA Issue ID |                                                                                              |
| Extract the JIRA Issue ID      | Code                        | Extracts JIRA key from MR description   | Extract MR Details                 | Get JIRA issue                   |                                                                                              |
| Get JIRA issue                | JIRA                        | Fetches JIRA issue by key               | Extract the JIRA Issue ID          | Format JIRA Context, If JIRA Subtask |                                                                                              |
| Format JIRA Context           | Set                         | Formats JIRA issue info for prompt      | Get JIRA issue                    | Merge                            |                                                                                              |
| If JIRA Subtask              | If                           | Checks if JIRA issue is a subtask       | Get JIRA issue                    | Get JIRA Parent Issue            |                                                                                              |
| Get JIRA Parent Issue        | JIRA                        | Fetches parent issue details            | If JIRA Subtask                   | Format JIRA Parent Context       |                                                                                              |
| Format JIRA Parent Context   | Set                         | Formats parent JIRA context             | Get JIRA Parent Issue             | Merge                           |                                                                                              |
| Merge                       | Merge                       | Combines JIRA contexts                   | Format JIRA Context, Format JIRA Parent Context | Get MR Changes                |                                                                                              |
| Get MR Changes               | HTTP Request                 | Fetches MR file changes                  | Extract MR Details, Merge         | Split Out Changes                |                                                                                              |
| Split Out Changes            | Split Out                   | Splits file changes array                | Get MR Changes                   | Skip File Changes               |                                                                                              |
| Skip File Changes            | If                           | Filters out renamed/deleted/irrelevant files | Split Out Changes              | Parse Diff                     |                                                                                              |
| Parse Diff                  | Code                        | Parses diff hunks for line info          | Skip File Changes                | Prepare Code Changes            |                                                                                              |
| Prepare Code Changes         | Code                        | Splits diff into original and new code  | Parse Diff                     | Basic LLM Chain, Filter Irrelevant Fields |                                                                                              |
| Filter Irrelevant Fields     | Set                         | Selects relevant fields for review       | Prepare Code Changes            | Merge LLM Output with Input     |                                                                                              |
| Basic LLM Chain             | Langchain LLM Chain          | Builds prompt for AI review               | Prepare Code Changes            | Google Gemini Chat Model        |                                                                                              |
| Google Gemini Chat Model    | Langchain LM Chat            | Sends prompt to Gemini AI model           | Basic LLM Chain                | Basic LLM Chain                |                                                                                              |
| Merge LLM Output with Input | Merge                        | Combines AI output with original input   | Filter Irrelevant Fields, Basic LLM Chain | Aggregate                    |                                                                                              |
| Aggregate                  | Aggregate                    | Aggregates all AI review outputs          | Merge LLM Output with Input     | Process Comments               |                                                                                              |
| Process Comments           | Code                        | Filters out empty or irrelevant AI comments | Aggregate                    | Any Issues Found?              |                                                                                              |
| Any Issues Found?          | If                           | Checks if any issues found by AI          | Process Comments               | Get Static Context, Split Out Comments |                                                                                              |
| Get Static Context         | Code                        | Fetches stored project and MR IDs         | Any Issues Found? (true branch)  | Post No Issues Found           |                                                                                              |
| Post No Issues Found       | HTTP Request                 | Posts 'No issues found' comment           | Get Static Context              | Cleanup Static Context         |                                                                                              |
| Split Out Comments         | Split Out                   | Splits actionable comments for posting    | Any Issues Found? (false branch) | Prepare Request              |                                                                                              |
| Prepare Request            | Code                        | Builds comment body with position info    | Split Out Comments             | Post Gitlab MR Comments        |                                                                                              |
| Post Gitlab MR Comments    | HTTP Request                 | Posts inline comments to MR                | Prepare Request               | Cleanup Static Context, Prepare Request Without Position |                                                                                              |
| Prepare Request Without Position | Code                     | Builds comment body without position info | Post Gitlab MR Comments       | Post Gitlab MR Comments WIthout Position |                                                                                              |
| Post Gitlab MR Comments WIthout Position | HTTP Request       | Posts fallback comments without position   | Prepare Request Without Position | Cleanup Static Context         |                                                                                              |
| Cleanup Static Context     | Code                        | Clears static context at workflow end      | Post No Issues Found, Post Gitlab MR Comments, Post Gitlab MR Comments WIthout Position, Post Error Occurred | - |                                                                                              |
| Error Trigger             | Error Trigger               | Captures workflow errors                    | -                            | Get Static Context Including Error |                                                                                              |
| Get Static Context Including Error | Code                  | Retrieves static data and error message     | Error Trigger                | Post Error Occurred            |                                                                                              |
| Post Error Occurred       | HTTP Request                 | Posts error message comment to MR           | Get Static Context Including Error | Cleanup Static Context         |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook node** named "Listen For Gitlab Comments":  
   - HTTP Method: POST  
   - Path: Set your unique webhook path  
   - This node listens for GitLab MR note events.

2. **Add an If node** named "Need Review":  
   - Condition: `{{$json.body.object_attributes.note}} === 'coro-bot-review'` (or your preferred trigger phrase)  
   - Connect "Listen For Gitlab Comments" → "Need Review" (main output).

3. **Add a Code node** named "Set workflow execution information":  
   - Code extracts `projectId` and `mrId` from webhook payload  
   - Stores them in global static data keyed by execution ID.  
   - Connect "Need Review" → "Set workflow execution information".

4. **Add an HTTP Request node** named "Post Review Started":  
   - POST to `https://gitlab.com/api/v4/projects/{{ $json.body.project_id }}/merge_requests/{{ $json.body.merge_request.iid }}/notes`  
   - Headers: `PRIVATE-TOKEN` from env variable (e.g., `GITLAB_TOKEN`)  
   - Body: `{"body":"🤖 AI code review initiated. This may take up to 30 minutes for large merge requests. I'll post my findings as comments on the relevant files."}`  
   - Connect "Set workflow execution information" → "Post Review Started".

5. **Add a Set node** named "Extract MR Details":  
   - Extract from webhook JSON:  
     - `projectId` = `{{$json.body.project_id}}`  
     - `iid` = `{{$json.body.merge_request.iid}}`  
     - `description` = `{{$json.body.merge_request.description}}`  
   - Connect "Set workflow execution information" → "Extract MR Details".

6. **Add an HTTP Request node** named "Get MR Changes":  
   - GET `https://gitlab.com/api/v4/projects/{{ $json.projectId }}/merge_requests/{{ $json.iid }}/changes`  
   - Headers: `PRIVATE-TOKEN` from env variable  
   - Connect "Extract MR Details" → "Get MR Changes".

7. **Add a Split Out node** named "Split Out Changes":  
   - Split field: `changes`  
   - Include fields: `jiraParentContext`, `jiraContext`, `iid`, `project_id`, `diff_refs`  
   - Connect "Get MR Changes" (main output index 2) → "Split Out Changes".

8. **Add an If node** named "Skip File Changes":  
   - Conditions:  
     - `renamed_file` is false  
     - `deleted_file` is false  
     - `diff` starts with "@@"  
   - Connect "Split Out Changes" → "Skip File Changes".

9. **Add a Code node** named "Parse Diff":  
   - Parses last diff hunk and extracts `lastOldLine` and `lastNewLine` line numbers.  
   - Connect "Skip File Changes" (true branch) → "Parse Diff".

10. **Add a Code node** named "Prepare Code Changes":  
    - Splits diff lines into `originalCode` and `newCode` by prefix '-' and '+'.  
    - Connect "Parse Diff" → "Prepare Code Changes".

11. **Add a Set node** named "Filter Irrelevant Fields":  
    - Pass only relevant fields: `iid`, `project_id`, `diff_refs`, `lastNewLine`, `lastOldLine`, `new_path`, `old_path`.  
    - Connect "Prepare Code Changes" → "Filter Irrelevant Fields".

12. **Add a Langchain LLM Chain node** named "Basic LLM Chain":  
    - Prompt includes JIRA context, file path, original and new code blocks, with instructions focusing on business logic, security, and performance.  
    - Connect "Prepare Code Changes" → "Basic LLM Chain".

13. **Add a Google Gemini Chat Model node**:  
    - Model name: `models/gemini-2.5-pro`  
    - Temperature: 0  
    - TopK: 1  
    - Credentials: Google Palm API (set up in n8n credentials).  
    - Connect "Basic LLM Chain" → "Google Gemini Chat Model".  
    - Connect "Google Gemini Chat Model" → "Basic LLM Chain" (ai_languageModel input).

14. **Add a Merge node** named "Merge LLM Output with Input":  
    - Combine mode: combine by position  
    - Connect "Filter Irrelevant Fields" → "Merge LLM Output with Input" (input 1)  
    - Connect "Basic LLM Chain" → "Merge LLM Output with Input" (input 2).

15. **Add an Aggregate node** named "Aggregate":  
    - Aggregate all item data.  
    - Connect "Merge LLM Output with Input" → "Aggregate".

16. **Add a Code node** named "Process Comments":  
    - Filters out comments with empty text, `ALL_CLEAR`, or "no issues" phrases.  
    - Outputs `commentsToPost` and `noIssuesFound`.  
    - Connect "Aggregate" → "Process Comments".

17. **Add an If node** named "Any Issues Found?":  
    - Condition: `noIssuesFound === true`  
    - Connect "Process Comments" → "Any Issues Found?".

18. **Add a Code node** named "Get Static Context":  
    - Retrieves `projectId` and `mrId` from static data using execution ID.  
    - Connect "Any Issues Found?" (true branch) → "Get Static Context".

19. **Add an HTTP Request node** named "Post No Issues Found":  
    - POST to GitLab MR notes endpoint  
    - Body: `"🤖 AI review complete. No significant issues were found. LGTM!"`  
    - Headers: `PRIVATE-TOKEN`  
    - Connect "Get Static Context" → "Post No Issues Found".

20. **Add a Code node** named "Cleanup Static Context":  
    - Deletes static data for current execution.  
    - Connect "Post No Issues Found" → "Cleanup Static Context".

21. **Connect "Any Issues Found?" (false branch) → Split Out node "Split Out Comments":**  
    - Field to split out: `commentsToPost`  
    - Include fields: `iid`, `project_id`, `diff_refs`.  

22. **Add a Code node** named "Prepare Request":  
    - Builds GitLab comment request body including position info (file paths, commit SHAs, line numbers).  
    - Connect "Split Out Comments" → "Prepare Request".

23. **Add an HTTP Request node** named "Post Gitlab MR Comments":  
    - POST to GitLab MR discussions endpoint with JSON body from `requestBody`.  
    - Headers: `PRIVATE-TOKEN`  
    - Retries disabled, on error continue output.  
    - Connect "Prepare Request" → "Post Gitlab MR Comments".

24. **Add a Code node** named "Prepare Request Without Position":  
    - Builds comment body without position for fallback posting.  
    - Connect "Post Gitlab MR Comments" (error output) → "Prepare Request Without Position".

25. **Add an HTTP Request node** named "Post Gitlab MR Comments WIthout Position":  
    - Posts fallback comments without position info.  
    - Headers: `PRIVATE-TOKEN`  
    - Connect "Prepare Request Without Position" → "Post Gitlab MR Comments WIthout Position".

26. **Connect both "Post Gitlab MR Comments" (success) and "Post Gitlab MR Comments WIthout Position" → "Cleanup Static Context"** to clear data after posting.

27. **Add an Error Trigger node** named "Error Trigger":  
    - Captures workflow errors.

28. **Add a Code node** named "Get Static Context Including Error":  
    - Retrieves static context and error message for error reporting.  
    - Connect "Error Trigger" → "Get Static Context Including Error".

29. **Add an HTTP Request node** named "Post Error Occurred":  
    - Posts error message comment to GitLab MR including error details.  
    - Headers: `PRIVATE-TOKEN`.  
    - Connect "Get Static Context Including Error" → "Post Error Occurred".

30. **Connect "Post Error Occurred" → "Cleanup Static Context"** to clear data after error reporting.

31. **JIRA Context Integration:**  
    - From "Extract MR Details", connect to "Extract the JIRA Issue ID" (Code node with regex to find JIRA key).  
    - Connect "Extract the JIRA Issue ID" → "Get JIRA issue" (JIRA node).  
    - Connect "Get JIRA issue" →  
      - "Format JIRA Context" (Set node) and  
      - "If JIRA Subtask" (If node).  
    - "If JIRA Subtask" (true branch) → "Get JIRA Parent Issue" → "Format JIRA Parent Context".  
    - "Format JIRA Context" and "Format JIRA Parent Context" → "Merge".  
    - Connect "Merge" → "Get MR Changes" (to add JIRA context to MR data).

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                         | Context or Link                                                                                     |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| ⭐️ Try It Out! Welcome! This template adds AI-powered code reviews to your GitLab Merge Requests. Simply comment `ai-review` on any MR to trigger the workflow.     | Sticky note "Try It Out!" at the workflow start.                                                  |
| 🟢 Step 1: Listen & Capture - A Webhook node listens for MR note events; extracts project & MR IDs; posts a review start message.                                  | Sticky note "Step 1: Listen & Capture".                                                           |
| 🟣 Step 2: Prepare & Review - Fetches MR diffs, parses code changes, obtains JIRA context, and sends to LLM for review focusing on logic, security, and performance. | Sticky note "Step 2: Prepare & Review".                                                           |
| 🟠 Step 3: Post & Fallback - Posts inline comments with position or fallback thread comments if position missing.                                                  | Sticky note "Step 3: Post & Fallback".                                                            |
| 🔵 Static Context & Error Handling - Uses workflow static data to persist MR info across nodes and to enable posting error messages on failure.                    | Sticky note "Static Context & Error Handling".                                                    |
| 🟡 Need Help & Customise - Change trigger word, swap LLM, adjust prompts, or filter files/dirs as needed.                                                          | Sticky note "Need Help & Customise".                                                              |
| GitLab API documentation: https://docs.gitlab.com/ee/api/merge_requests.html#list-merge-request-changes                                                              | Useful for understanding MR changes API.                                                         |
| JIRA Cloud API documentation: https://developer.atlassian.com/cloud/jira/software/rest/api-group-issue-fields/                                                      | For JIRA issue data retrieval.                                                                    |
| Gemini AI (Google PaLM) API docs: https://developers.generativeai.google/api/rest/gemini                                                                                 | For LLM model usage and parameters.                                                              |

---

This completes the detailed reference documentation for the "Gitlab Code Review Template" workflow integrating Gemini AI and JIRA context to automate code reviews on GitLab Merge Requests.