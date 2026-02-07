Audit Interview Feedback & Report via Slack with GPT-4o-mini and Google Sheets

https://n8nworkflows.xyz/workflows/audit-interview-feedback---report-via-slack-with-gpt-4o-mini-and-google-sheets-9139


# Audit Interview Feedback & Report via Slack with GPT-4o-mini and Google Sheets

### 1. Workflow Overview

This workflow automates the auditing of interviewer feedback quality using AI evaluation and integrates the results with Google Sheets and Slack notifications. It targets HR teams or recruitment coordinators who want to ensure interview feedback is specific, structured, unbiased, actionable, and deep, improving hiring decisions through continuous quality control.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Data Retrieval:** Manual trigger starts the process, fetching raw interview feedback data from a Google Sheet.
- **1.2 AI Feedback Analysis:** Uses Azure-hosted GPT-4o-mini via LangChain to analyze feedback quality across multiple dimensions and returns structured JSON results.
- **1.3 AI Response Validation:** Checks if AI output is valid JSON and routes valid vs invalid responses accordingly.
- **1.4 Quality Scoring & Flagging:** Parses AI JSON, calculates weighted quality scores, and generates flags for low-quality feedback.
- **1.5 Reporting & Persistence:** Updates the original Google Sheet rows with scores and flags, sends summary reports to interviewers via Slack, and conditionally sends training recommendations if scores are low.
- **1.6 Error Handling:** Logs AI errors into a dedicated Google Sheet for monitoring and debugging.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Data Retrieval

- **Overview:** Trigger the workflow manually and fetch all raw interview feedback data from a Google Sheets document.
- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Fetch Raw Feedback Data (Google Sheets Read)  
- **Node Details:**

  - *When clicking ‘Execute workflow’*  
    - Type: Manual Trigger  
    - Config: No parameters; manual execution starts workflow.  
    - Inputs: None  
    - Outputs: Triggers the next node "Fetch Raw Feedback Data"  
    - Edge cases: None (manual initiation)  
  
  - *Fetch Raw Feedback Data*  
    - Type: Google Sheets (Read)  
    - Config: Reads all rows from sheet "Raw_Feedback" in document "Interviewer Brief Pack". Retrieves fields: Timestamp, Candidate_ID, Role, Stage, Interviewer_Email, Feedback_Text, row_number.  
    - Inputs: Trigger from manual node  
    - Outputs: Array of feedback records for AI processing  
    - Edge cases: Authentication failures, empty sheets, API rate limits

#### 2.2 AI Feedback Analysis

- **Overview:** Evaluates the quality of each feedback item using GPT-4o-mini on Azure via LangChain, scoring five dimensions and extracting vague phrases.
- **Nodes Involved:**  
  - AI Quality Evaluator (GPT-4o)  
  - Analyze Feedback Quality (LangChain LLM Chain)  
- **Node Details:**

  - *AI Quality Evaluator (GPT-4o)*  
    - Type: LangChain LLM Chat Node (Azure OpenAI GPT-4o-mini)  
    - Config: Model set to "gpt-4o-mini", no extra options.  
    - Credentials: Azure OpenAI API  
    - Input: Feedback record JSON from Google Sheets node  
    - Output: AI raw textual JSON response  
    - Edge cases: API quota exceeded, network issues, malformed prompts  
  
  - *Analyze Feedback Quality*  
    - Type: LangChain Chain Node  
    - Config: Defines prompt to score feedback on specificity, STAR structure, bias-free language, actionability, and depth on a 1-5 scale, including special rules for short feedback and vague phrase extraction.  
    - Input: AI model output from previous node  
    - Output: Raw JSON string with scoring and vague phrases  
    - Edge cases: Invalid prompt parameters, AI hallucination, unexpected output format

#### 2.3 AI Response Validation

- **Overview:** Validates that the AI response is defined and not "undefined", routing valid responses for parsing, invalid ones for error logging.
- **Nodes Involved:**  
  - Validate AI Response (If)  
  - Log AI Errors (Google Sheets Append)  
- **Node Details:**

  - *Validate AI Response*  
    - Type: If (Conditional)  
    - Config: Checks if `$json.text` is not the string "undefined " (note trailing space)  
    - Input: AI raw JSON string output  
    - Output:  
      - True branch: Pass to "Parse AI JSON Output"  
      - False branch: Pass to "Log AI Errors"  
    - Edge cases: False negatives if AI output formatting changes, string comparison fragile  
  
  - *Log AI Errors*  
    - Type: Google Sheets Append  
    - Config: Appends error details to "error log sheet" in the same Google Sheets document  
    - Input: Invalid AI responses  
    - Output: None (logging only)  
    - Edge cases: Google Sheets API limits, data loss if errors flood

#### 2.4 Quality Scoring & Flagging

- **Overview:** Parses the AI’s JSON string, calculates a weighted score from dimension ratings, creates flags for quality issues, and prepares formatted vague phrase text.
- **Nodes Involved:**  
  - Parse AI JSON Output (Code)  
  - Calculate Weighted Quality Score (Code)  
- **Node Details:**

  - *Parse AI JSON Output*  
    - Type: Code (JavaScript)  
    - Config: Safely parses AI JSON string from `$json.text`, throws error on failure  
    - Input: AI raw string from validation node  
    - Output: Parsed JSON object with scoring data  
    - Edge cases: Malformed JSON, unexpected formats, runtime errors  
  
  - *Calculate Weighted Quality Score*  
    - Type: Code (JavaScript)  
    - Config:  
      - Weights: specificity 35%, depth 25%, structure 15%, bias-free 15%, actionability 10%  
      - Calculates weighted average scaled 0-100  
      - Flags "low_detail" if specificity or depth < 3  
      - Flags "bias" if bias_free_language < 3  
      - Formats vague phrases array into multiline string for Slack  
      - Includes Role, Stage, row_number for tracking  
    - Input: Parsed AI JSON from previous node  
    - Output: JSON with Score, Flags, LLM_JSON stringified, formatted vague phrases, and metadata  
    - Edge cases: Missing fields, zero or null values, division by zero safeguard

#### 2.5 Reporting & Persistence

- **Overview:** Saves audit scores and flags back to the original Google Sheet, sends Slack messages with feedback summaries, and conditionally sends training recommendations if score < 50.
- **Nodes Involved:**  
  - Save Scores to Spreadsheet (Google Sheets Update)  
  - Send Feedback Summary to Interviewer (Slack Notification)  
  - Check if Training Needed (If condition)  
  - Send Training Recommendations (Slack Notification)  
- **Node Details:**

  - *Save Scores to Spreadsheet*  
    - Type: Google Sheets Update  
    - Config: Updates rows in "Raw_Feedback" sheet matching on row_number, fields updated: Score, Flags, LLM_JSON  
    - Input: Scoring output JSON  
    - Output: Confirmation of update  
    - Edge cases: Mismatched row_number, API errors, partial updates  
  
  - *Send Feedback Summary to Interviewer*  
    - Type: Slack Notification  
    - Config: Sends message to specific Slack user ID with detailed summary: Role, Stage, Score, Flags, and vague phrase examples if any, with encouragement and improvement tips.  
    - Input: Scoring output JSON  
    - Output: Slack message sent  
    - Credentials: Slack API with OAuth2 token  
    - Edge cases: Slack API limits, invalid user IDs  
  
  - *Check if Training Needed*  
    - Type: If (Conditional)  
    - Config: Checks if Score < 50  
    - Input: Scoring output JSON  
    - Output: True branch to send training recommendations, False branch does nothing  
    - Edge cases: Score missing or null  
  
  - *Send Training Recommendations*  
    - Type: Slack Notification  
    - Config: Sends coaching message with score, flags, vague phrase examples, links to STAR method guide and bias-free interviewing video.  
    - Input: Triggered only if low score  
    - Output: Slack message sent  
    - Credentials: Same Slack account as summary node  
    - Edge cases: Slack delivery failure

#### 2.6 Error Handling

- **Overview:** Captures any invalid or malformed AI responses and logs them into a dedicated error sheet for auditing and troubleshooting.
- **Nodes Involved:**  
  - Log AI Errors (Google Sheets Append)  
- **Node Details:**

  - Same as described in 2.3. Log AI Errors node. Handles storing error details for system reliability monitoring.

---

### 3. Summary Table

| Node Name                      | Node Type                          | Functional Role                     | Input Node(s)                    | Output Node(s)                    | Sticky Note                                                                                                         |
|-------------------------------|----------------------------------|-----------------------------------|---------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                   | Start workflow                    | None                            | Fetch Raw Feedback Data          |                                                                                                                     |
| Fetch Raw Feedback Data        | Google Sheets Read               | Retrieve raw feedback data         | When clicking ‘Execute workflow’ | Analyze Feedback Quality         | 📋 Fetch Interview Feedback: Reads all feedback rows including metadata                                              |
| AI Quality Evaluator (GPT-4o) | LangChain LLM Chat Azure OpenAI | AI cognitive engine for evaluation | Analyze Feedback Quality        | Analyze Feedback Quality         | 🤖 AI Quality Evaluator (GPT-4o): Uses GPT-4o-mini on Azure via LangChain                                            |
| Analyze Feedback Quality       | LangChain Chain LLM             | Core AI evaluation engine          | Fetch Raw Feedback Data          | Validate AI Response             | 🔍 Analyze Feedback Quality: Scores 5 dimensions; extracts vague phrases; outputs JSON                               |
| Validate AI Response           | If (Conditional)                | Validate AI output                 | Analyze Feedback Quality         | Parse AI JSON Output, Log AI Errors | ✅ Validate AI Response: Conditional routing based on AI output validity                                            |
| Log AI Errors                 | Google Sheets Append            | Log AI errors                     | Validate AI Response (false branch) | None                       | 🚨 Log AI Errors: Tracks AI failures in error log sheet                                                             |
| Parse AI JSON Output           | Code (JavaScript)               | Parse AI JSON string to object    | Validate AI Response (true branch) | Calculate Weighted Quality Score | 🔄 Parse AI JSON Output: Safe JSON parsing with error handling                                                     |
| Calculate Weighted Quality Score | Code (JavaScript)             | Calculate final score and flags   | Parse AI JSON Output             | Send Feedback Summary, Save Scores to Spreadsheet, Check if Training Needed | 🧮 Calculate Weighted Quality Score: Weighted scoring and flag generation                                         |
| Save Scores to Spreadsheet     | Google Sheets Update            | Persist scores and flags          | Calculate Weighted Quality Score | None                           | 💾 Save Scores to Spreadsheet: Updates original feedback rows with audit data                                       |
| Send Feedback Summary to Interviewer | Slack Notification          | Deliver audit summary to user     | Calculate Weighted Quality Score | Check if Training Needed         | 💬 Send Feedback Summary: Sends detailed feedback quality report via Slack                                         |
| Check if Training Needed       | If (Conditional)                | Determine if training message needed | Send Feedback Summary to Interviewer | Send Training Recommendations  | 🎯 Check if Training Needed: Routes low scores (<50) to training recommendations                                   |
| Send Training Recommendations  | Slack Notification             | Send coaching resources           | Check if Training Needed         | None                           | 📚 Send Training Recommendations: Sends helpful coaching links and tips for low scoring feedback                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - No configuration needed. This node starts the workflow manually.

2. **Create Google Sheets Read Node ("Fetch Raw Feedback Data")**  
   - Type: Google Sheets  
   - Operation: Read rows  
   - Document ID: Select your "Interviewer Brief Pack" spreadsheet  
   - Sheet Name: "Raw_Feedback"  
   - Credentials: OAuth2 Google Sheets credentials with read access  
   - Output: All rows with fields including Timestamp, Candidate_ID, Role, Stage, Interviewer_Email, Feedback_Text, row_number

3. **Create LangChain LLM Chat Node ("AI Quality Evaluator (GPT-4o)")**  
   - Type: LangChain LLM Chat (Azure OpenAI)  
   - Model: gpt-4o-mini  
   - Credentials: Azure OpenAI API key with GPT-4o-mini access  
   - Input: Each feedback record's JSON from Google Sheets node  

4. **Create LangChain Chain Node ("Analyze Feedback Quality")**  
   - Type: LangChain Chain LLM  
   - Prompt configuration:  
     - Define task as Interview Feedback Quality Auditor  
     - Score across 5 dimensions (specificity, structure_STAR, bias_free_language, actionability, depth) on a 1-5 scale  
     - Apply rules for short text and vague phrase extraction  
     - Return ONLY valid JSON with specified schema  
   - Input: Output from AI Quality Evaluator node  

5. **Create If Node ("Validate AI Response")**  
   - Type: If (Conditional)  
   - Condition: Check if the AI output field `text` is not equal to string "undefined "  
   - True branch: Proceed to parsing AI JSON  
   - False branch: Route to error logging  

6. **Create Google Sheets Append Node ("Log AI Errors")**  
   - Type: Google Sheets Append  
   - Document ID: Same "Interviewer Brief Pack" spreadsheet  
   - Sheet Name: "error log sheet"  
   - Credentials: Google Sheets OAuth2 with append permissions  
   - Input: AI output from false branch of validation node  

7. **Create Code Node ("Parse AI JSON Output")**  
   - Type: Code (JavaScript)  
   - Code: Safely parse string in `$json.text` to JSON with try-catch, throw error if invalid  

8. **Create Code Node ("Calculate Weighted Quality Score")**  
   - Type: Code (JavaScript)  
   - Code:  
     - Define weights for each dimension (specificity 35%, depth 25%, structure 15%, bias-free 15%, actionability 10%)  
     - Calculate weighted average scaled 0-100  
     - Generate flags "low_detail" and "bias" based on thresholds  
     - Format vague phrases into bullet points for Slack  
     - Include Role, Stage, row_number for tracking  

9. **Create Google Sheets Update Node ("Save Scores to Spreadsheet")**  
   - Type: Google Sheets Update  
   - Document ID: Same spreadsheet  
   - Sheet Name: "Raw_Feedback"  
   - Credentials: Google Sheets OAuth2 with update permissions  
   - Matching Column: row_number  
   - Update fields: Score, Flags, LLM_JSON (stringified AI result)  

10. **Create Slack Node ("Send Feedback Summary to Interviewer")**  
    - Type: Slack Notification  
    - Credentials: Slack OAuth2 with chat.postMessage scope  
    - Message: Role, Stage, Score, Flags, vague phrase examples if any, encouragement, and improvement tips  
    - User: Slack user ID of recipient  

11. **Create If Node ("Check if Training Needed")**  
    - Type: If (Conditional)  
    - Condition: Score < 50  

12. **Create Slack Node ("Send Training Recommendations")**  
    - Type: Slack Notification  
    - Credentials: Same Slack OAuth2  
    - Message: Score, Flags, vague phrases, links to STAR method guide and bias-free interviewing video, supportive coaching tone  
    - Trigger: True branch of "Check if Training Needed"  

13. **Connect Nodes Sequentially:**  
    - Manual Trigger → Fetch Raw Feedback Data → AI Quality Evaluator → Analyze Feedback Quality → Validate AI Response  
    - Validate AI Response true → Parse AI JSON Output → Calculate Weighted Quality Score →  
       → Send Feedback Summary to Interviewer → Check if Training Needed → Send Training Recommendations (if true)  
       → Save Scores to Spreadsheet  
    - Validate AI Response false → Log AI Errors  

14. **Credential Setup:**  
    - Google Sheets OAuth2 with read, append, and update permissions on target spreadsheet  
    - Azure OpenAI API key with GPT-4o-mini model access  
    - Slack OAuth2 token with chat permissions and user ID for message recipients  

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                               |
|---------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| The STAR method is a structured feedback technique: Situation, Task, Action, Result.                           | [STAR Method Guide](https://example.com/star-training)         |
| Bias-free interviewing training video linked to raise awareness of unconscious bias in feedback.              | [Bias-Free Interviewing Video](https://example.com/interview-bias) |
| Automated feedback quality audit designed to improve hiring decisions and interviewer coaching.                | Internal HR Ops and Recruitment Automation                      |
| Slack messages use a supportive and growth-focused tone to encourage continuous improvement in interviewing.  | Communication best practice for feedback loops                 |

---

**Disclaimer:** The provided text is generated from an n8n automation workflow. It adheres strictly to content policies and contains only lawful, public data.