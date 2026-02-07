AI-Powered Code Review with Linting, Red-Marked Corrections in Google Sheets & Slack

https://n8nworkflows.xyz/workflows/ai-powered-code-review-with-linting--red-marked-corrections-in-google-sheets---slack-10034


# AI-Powered Code Review with Linting, Red-Marked Corrections in Google Sheets & Slack

### 1. Workflow Overview

This workflow automates code reviews by combining AI-driven feedback with rule-based linting, then documents results in Google Sheets and notifies the team via Slack. It targets software engineers, QA teams, and tech leads who want to streamline code quality checks with minimal manual effort. The workflow continuously monitors a Google Sheet for new or updated code snippets, performs lint checks, sends code to an AI model (Google Gemini) for detailed review with highlighted corrections, formats and aggregates results, writes the review outcomes back to a spreadsheet, and posts a summary notification to Slack.

Logical blocks:

- **1.1 Input Reception:** Monitor Google Sheets for new code entries.
- **1.2 Static Linting:** Perform lightweight static analysis on the code.
- **1.3 AI Review:** Send code and lint results to AI for expert review and correction marking.
- **1.4 Formatting & Aggregation:** Process AI output, combine with lint data, and compute scores.
- **1.5 Output Writing:** Append review results back into Google Sheets.
- **1.6 Notification:** Post a concise summary of the review to a Slack channel.
- **Auxiliary:** Sticky notes providing context and guidance on workflow parts.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Monitors the designated Google Sheets document and sheet for new or updated rows containing code to review. Triggers the workflow on changes.

**Nodes Involved:**  
- コード入力シート監視 (Google Sheets Trigger)

**Node Details:**

- **コード入力シート監視**  
  - Type: Google Sheets Trigger  
  - Role: Watches a specific sheet and document for changes every minute.  
  - Configuration:  
    - Poll every minute.  
    - List mode for sheetName and documentId, placeholders for actual sheet GID/name and spreadsheet ID must be replaced by user.  
  - Inputs: None (trigger node).  
  - Outputs: Emits the changed row with the code field.  
  - Edge Cases:  
    - Delay or missed triggers if Google Sheets API quota is exceeded or network issues occur.  
    - If sheet or document ID not set correctly, trigger fails.  
  - Sticky Note: "Monitors the 'Input Code' sheet for new or edited rows to start the review process automatically."

---

#### 1.2 Static Linting

**Overview:**  
Performs a basic static lint check on the submitted code to identify common issues like improper variable declarations, debug statements, and unbalanced braces. Produces an error list and a lint score.

**Nodes Involved:**  
- Lint Check (Function)

**Node Details:**

- **Lint Check**  
  - Type: Function  
  - Role: Runs JavaScript code to analyze the input code for lint errors.  
  - Configuration:  
    - Checks for use of `var` (Major), `console.log` (Minor), and brace imbalance (Critical).  
    - Calculates a lint score starting at 10, deducting 2 points per error.  
  - Inputs: Receives code from "コード入力シート監視".  
  - Outputs: Emits JSON containing original code, list of lint errors, and lint score.  
  - Edge Cases:  
    - Empty or missing code inputs result in empty lint errors and full score.  
    - Only basic lint rules — may miss complex issues.  
  - Sticky Note: None.

---

#### 1.3 AI Review

**Overview:**  
Sends the code and lint check summary to an AI agent (Google Gemini via LangChain) for a detailed review. The AI returns code with inline corrections marked in red or orange, classifies issues by severity, and provides an overall score.

**Nodes Involved:**  
- AI Agent (LangChain AI Agent)  
- Google Gemini Chat Model (Language Model)  
- Get row(s) in sheet in Google Sheets (Code Conventions Fetch)  

**Node Details:**

- **Google Gemini Chat Model**  
  - Type: LangChain Google Gemini LM  
  - Role: Provides AI language model capabilities.  
  - Configuration: Default, no special options set.  
  - Inputs: Receives prompt from "AI Agent".  
  - Outputs: AI-generated review text.  
  - Edge Cases:  
    - API quota limits or auth errors may block response.  
    - Network latency may cause delays.  
  - Sticky Note: None.

- **Get row(s) in sheet in Google Sheets**  
  - Type: Google Sheets Tool  
  - Role: Retrieves coding conventions or guidance from a sheet to supplement AI review prompt.  
  - Configuration:  
    - Uses service account authentication.  
    - Sheet and document IDs placeholders provided.  
  - Inputs: Not triggered directly by code input but linked as ai_tool input to "AI Agent".  
  - Outputs: Provides content for AI prompt.  
  - Edge Cases:  
    - Missing or inaccessible sheet causes empty or no guidance.  
  - Sticky Note: None.

- **AI Agent**  
  - Type: LangChain Agent  
  - Role: Coordinates AI prompt construction and response processing.  
  - Configuration:  
    - Prompt includes lint summary and score, instructions to mark corrections using HTML `<span style="color:red">` for critical fixes and orange for minor suggestions.  
    - Embeds the original code and review prompt from "Get row(s) in sheet in Google Sheets".  
  - Inputs: Receives lint check data and coding conventions.  
  - Outputs: AI review output JSON with marked corrections and overall score.  
  - Edge Cases:  
    - Expression errors if referenced nodes are missing or empty.  
    - AI response format may vary, requiring robust parsing downstream.  
  - Sticky Note: "Sends the submitted code to the connected AI model (e.g., Gemini or GPT) for detailed review and feedback."

---

#### 1.4 Formatting & Aggregation

**Overview:**  
Processes the AI review output alongside lint results to produce a clean summary with counts of issue types and an averaged overall score. Prepares data for writing back to the spreadsheet.

**Nodes Involved:**  
- Format Review Output (Function)  
- Aggregate Review Stats (Function)  
- レビュー結果整形 (Set node)  

**Node Details:**

- **Format Review Output**  
  - Type: Function  
  - Role: Parses AI output and lint errors, counts issues by severity, averages scores.  
  - Configuration:  
    - Extracts JSON overall_score from AI output text.  
    - Combines AI and lint scores evenly.  
  - Inputs: AI Agent output.  
  - Outputs: JSON with reviewed code text, lint summary counts, lint score, and combined overall score.  
  - Edge Cases:  
    - Missing or malformed AI output may cause mismatch or zero scores.  
  - Sticky Note: "Formats AI’s review response — adds red-colored text for corrections and clear comments for improvements."

- **Aggregate Review Stats**  
  - Type: Function  
  - Role: Creates a human-readable summary text string combining issue counts and overall score.  
  - Configuration: Basic JSON to string formatting.  
  - Inputs: Output of Format Review Output.  
  - Outputs: JSON with summary text suitable for Slack notification and spreadsheet.  
  - Edge Cases: None significant.  
  - Sticky Note: None.

- **レビュー結果整形** (Review Result Formatting)  
  - Type: Set  
  - Role: Sets fields for final output including original code, reviewed code, timestamp, scores, etc.  
  - Configuration:  
    - Maps reviewedCode, originalCode, and timestamp for Google Sheets appending.  
  - Inputs: Output of Aggregate Review Stats.  
  - Outputs: Data formatted for Google Sheets write operation.  
  - Edge Cases: Ensure timestamp is ISO string.  
  - Sticky Note: "Writes the reviewed and corrected code output into the 'Review Results' sheet for easy comparison."

---

#### 1.5 Output Writing

**Overview:**  
Appends or updates the review results in a designated Google Sheets "Review Results" sheet for tracking and comparison.

**Nodes Involved:**  
- レビュー結果書き込み (Google Sheets)

**Node Details:**

- **レビュー結果書き込み**  
  - Type: Google Sheets  
  - Role: Writes the formatted review results into a Google Sheet.  
  - Configuration:  
    - Operation: appendOrUpdate (adds new rows or updates existing ones).  
    - Uses OAuth2 credentials for Google Sheets.  
    - Sheet name and document ID placeholders to be replaced by user.  
  - Inputs: Receives formatted output from "レビュー結果整形".  
  - Outputs: Confirms sheet update, triggers Slack notification.  
  - Edge Cases:  
    - Permission issues if OAuth token lacks write access.  
    - Network or quota errors may cause failure.  
  - Sticky Note: "Writes the reviewed and corrected code output into the 'Review Results' sheet for easy comparison."

---

#### 1.6 Notification

**Overview:**  
Posts a concise summary of the review results, including issue counts and overall score, to a designated Slack channel.

**Nodes Involved:**  
- Post Review Summary (Slack)

**Node Details:**

- **Post Review Summary**  
  - Type: Slack node  
  - Role: Sends a message to Slack with review completion status and summary text.  
  - Configuration:  
    - Channel ID placeholder to be replaced by user.  
    - OAuth2 authentication for Slack.  
    - Message text interpolates summaryText from previous node.  
  - Inputs: Receives summary text from "レビュー結果書き込み".  
  - Outputs: None (terminal node).  
  - Edge Cases:  
    - Slack API rate limiting or permission errors.  
    - Missing or incorrect channel ID causes message failure.  
  - Sticky Note: None.

---

#### Auxiliary Sticky Notes

- **Sheet Trigger Note:** Explains the monitoring role of the Google Sheets trigger node.  
- **AI Review Note:** Describes sending code to AI for review.  
- **Formatting Note:** Explains how AI output is formatted with color-coded corrections.  
- **Write Output Note:** Describes writing results back to the review results sheet.  
- **Template Overview (Advanced):** Extended documentation on who the workflow is for, how it works, setup instructions, customization ideas, and value proposition.  
- **Sticky Note:** Suggests adding coding conventions and design documents as tools (linked to the "Get row(s) in sheet in Google Sheets" node).

---

### 3. Summary Table

| Node Name                 | Node Type                           | Functional Role                         | Input Node(s)                 | Output Node(s)                   | Sticky Note                                                                                         |
|---------------------------|-----------------------------------|---------------------------------------|------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------|
| コード入力シート監視       | Google Sheets Trigger             | Input Reception - triggers on sheet edits | None                         | Lint Check                      | Monitors the 'Input Code' sheet for new or edited rows to start the review process automatically. |
| Lint Check                | Function                         | Static linting of input code           | コード入力シート監視           | AI Agent                       |                                                                                                   |
| Google Gemini Chat Model  | LangChain LM Chat (Google Gemini) | AI language model for code review      | AI Agent (as ai_languageModel) | AI Agent                       |                                                                                                   |
| Get row(s) in sheet in Google Sheets | Google Sheets Tool               | Fetch coding conventions for AI prompt | None (used as ai_tool input) | AI Agent                       |                                                                                                   |
| AI Agent                  | LangChain Agent                  | Sends code and lint data to AI and formats prompt | Lint Check, Get row(s) in sheet in Google Sheets | Format Review Output            | Sends the submitted code to the connected AI model (e.g., Gemini or GPT) for detailed review and feedback. |
| Format Review Output      | Function                         | Parses AI output, combines with lint data | AI Agent                      | Aggregate Review Stats          | Formats AI’s review response — adds red-colored text for corrections and clear comments for improvements. |
| Aggregate Review Stats    | Function                         | Creates summary text from review data | Format Review Output           | レビュー結果整形                |                                                                                                   |
| レビュー結果整形           | Set                              | Prepares output data for Google Sheets | Aggregate Review Stats         | レビュー結果書き込み             | Writes the reviewed and corrected code output into the 'Review Results' sheet for easy comparison. |
| レビュー結果書き込み       | Google Sheets                    | Writes review results back to sheet    | レビュー結果整形                | Post Review Summary             | Writes the reviewed and corrected code output into the 'Review Results' sheet for easy comparison. |
| Post Review Summary       | Slack                           | Posts code review summary to Slack     | レビュー結果書き込み            | None                          |                                                                                                   |
| Sheet Trigger Note        | Sticky Note                     | Documentation                          | None                         | None                          | Monitors the 'Input Code' sheet for new or edited rows to start the review process automatically. |
| AI Review Note            | Sticky Note                     | Documentation                          | None                         | None                          | Sends the submitted code to the connected AI model (e.g., Gemini or GPT) for detailed review and feedback. |
| Formatting Note           | Sticky Note                     | Documentation                          | None                         | None                          | Formats AI’s review response — adds red-colored text for corrections and clear comments for improvements. |
| Write Output Note         | Sticky Note                     | Documentation                          | None                         | None                          | Writes the reviewed and corrected code output into the 'Review Results' sheet for easy comparison. |
| Template Overview (Advanced) | Sticky Note                  | Extended documentation                  | None                         | None                          | See detailed workflow overview, setup, customization, and value proposition in the note content. |
| Sticky Note               | Sticky Note                     | Suggestion                            | None                         | None                          | Add coding conventions and design documents as tools.                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger Node:**  
   - Type: Google Sheets Trigger  
   - Configure to watch the spreadsheet and sheet containing the input code (`<YOUR_SPREADSHEET_ID>`, `<YOUR_SHEET_GID_OR_NAME>`)  
   - Set polling mode to every minute.

2. **Create Function Node for Lint Check:**  
   - Type: Function  
   - Code: Analyze the input code for:  
     - Presence of `var` → Major issue  
     - Presence of `console.log` → Minor issue  
     - Brace imbalance → Critical issue  
   - Calculate lint score starting at 10 minus 2 per error.  
   - Connect input from Google Sheets Trigger node.

3. **Create Google Sheets Tool Node to Get Coding Conventions:**  
   - Type: Google Sheets Tool  
   - Configure with service account credentials.  
   - Set spreadsheet and sheet IDs to contain coding conventions or review prompts (`<YOUR_SPREADSHEET_ID>`, `<YOUR_SHEET_GID_OR_NAME>`).  
   - No direct trigger; this node will feed data into the AI Agent node.

4. **Create Google Gemini Chat Model Node:**  
   - Type: LangChain LM Chat (Google Gemini)  
   - No special configuration needed.  
   - This node will be invoked by the AI Agent node.

5. **Create AI Agent Node:**  
   - Type: LangChain Agent  
   - Configure prompt to include:  
     - Lint summary and score from Lint Check node.  
     - Coding conventions fetched from Google Sheets Tool node.  
     - Instructions to mark corrections with `<span style="color:red">` for critical fixes and `<span style="color:orange">` for minor suggestions.  
     - Include the original code from the Google Sheets trigger.  
   - Connect inputs from Lint Check (main input) and Google Sheets Tool (ai_tool input).  
   - Link AI language model to Google Gemini Chat Model node.

6. **Create Function Node to Format Review Output:**  
   - Type: Function  
   - Parse AI output JSON embedded in text to extract overall score.  
   - Count lint errors by severity.  
   - Average AI and lint scores.  
   - Connect input from AI Agent node.

7. **Create Function Node to Aggregate Review Stats:**  
   - Type: Function  
   - Format a summary string with counts of Critical, Major, Minor issues and overall score.  
   - Connect input from Format Review Output node.

8. **Create Set Node (レビュー結果整形):**  
   - Type: Set  
   - Assign fields:  
     - `reviewedCode` from formatted AI output.  
     - `originalCode` from Google Sheets trigger node.  
     - `timestamp` as current ISO string.  
   - Connect input from Aggregate Review Stats node.

9. **Create Google Sheets Node to Write Review Results:**  
   - Type: Google Sheets  
   - Operation: appendOrUpdate  
   - Configure with OAuth2 credentials.  
   - Set spreadsheet and sheet IDs to "Review Results" sheet (`<YOUR_SPREADSHEET_ID>`, `<YOUR_SHEET_GID_OR_NAME>`).  
   - Connect input from レビュー結果整形 node.

10. **Create Slack Node to Post Summary:**  
    - Type: Slack  
    - Authentication: OAuth2 with Slack credentials.  
    - Channel: Set to your Slack channel ID (`<YOUR_SLACK_CHANNEL_ID>`).  
    - Message: Include summary text from previous node.  
    - Connect input from Google Sheets write node.

11. **Add Sticky Notes for Documentation:**  
    - Add notes describing the role of each major block: Input monitoring, AI review, formatting, writing output, and notification.

12. **Replace all placeholders:**  
    - `<YOUR_SPREADSHEET_ID>`, `<YOUR_SHEET_GID_OR_NAME>`, `<YOUR_SLACK_CHANNEL_ID>` must be replaced with your actual IDs.

13. **Activate the workflow:**  
    - Turn on the workflow to start automated code reviews triggered by sheet updates.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                                    |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| This workflow brings realistic, team-oriented AI-assisted code review to n8n — combining automated linting speed with nuanced human-like feedback, saving time and improving code quality.                                                                                                                                                                         | Template Overview (Advanced) sticky note content in the workflow                                                  |
| For best results, customize lint rules and AI prompts to your project’s standards. Add more linting rules or extend AI instructions to fit your coding guidelines.                                                                                                                                                                                                | Template Overview (Advanced) sticky note content in the workflow                                                  |
| Ensure your Google Sheets and Slack credentials have proper permissions to read/write sheets and post messages.                                                                                                                                                                                                                                                     | Setup instructions in Template Overview (Advanced) sticky note                                                    |
| Video introduction and project details: https://n8n.io/blog/ai-code-review                                                                                                                                                                                                                                                                                          | Reference for similar AI n8n workflows                                                                            |
| Add coding conventions and design documents as tools for the AI prompt to improve review quality and consistency.                                                                                                                                                                                                                                                  | Sticky Note linked to 'Get row(s) in sheet in Google Sheets' node                                                  |

---

**Disclaimer:** The text provided is extracted exclusively from an automated n8n workflow. It complies strictly with current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and publicly accessible.