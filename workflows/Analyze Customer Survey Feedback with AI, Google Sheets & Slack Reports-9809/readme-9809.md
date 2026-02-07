Analyze Customer Survey Feedback with AI, Google Sheets & Slack Reports

https://n8nworkflows.xyz/workflows/analyze-customer-survey-feedback-with-ai--google-sheets---slack-reports-9809


# Analyze Customer Survey Feedback with AI, Google Sheets & Slack Reports

### 1. Workflow Overview

The **Customer Survey Summary Generator** workflow automates the analysis of customer survey feedback by grouping responses based on sentiment, leveraging AI for thematic and actionable insight extraction, and distributing consolidated reports via Google Sheets and Slack. It is designed for daily execution and serves use cases such as customer experience teams seeking automated, data-driven feedback summaries to inform improvements.

The workflow is logically divided into these blocks:

- **1.1 Input Reception**: Scheduled trigger and retrieval of raw survey responses from Google Sheets.
- **1.2 Data Preparation & Grouping**: Grouping survey responses into sentiment buckets (positive, neutral, negative) and preparing batches for AI processing.
- **1.3 AI Processing**: An AI agent analyzes each sentiment batch to identify themes, insights, and recommendations.
- **1.4 Output Aggregation**: Aggregates AI analysis results into a comprehensive summary.
- **1.5 Output & Reporting**: Saves the summary to Google Sheets and posts a formatted report to Slack.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block triggers the workflow on a daily schedule and retrieves raw customer survey responses from a Google Sheets document.

**Nodes Involved:**  
- Daily Schedule Trigger  
- Get Survey Responses  
- Data Source Note (sticky note for setup guidance)

**Node Details:**

- **Daily Schedule Trigger**  
  - Type: scheduleTrigger  
  - Role: Initiates workflow daily at 9:00 AM JST.  
  - Config: Trigger set at hour 9 every day.  
  - Inputs: None (trigger node)  
  - Outputs: Connects to Get Survey Responses  
  - Edge cases: Trigger failure (rare), timezone mismatch if changed.  

- **Get Survey Responses**  
  - Type: googleSheets (v4.5)  
  - Role: Fetches raw survey data from a Google Sheet containing customer responses.  
  - Config: Requires Google Sheets OAuth2 credentials, Sheet ID and Name placeholders must be replaced.  
  - Key variables: Reads columns named in Japanese: `満足度 (Rating)`, `自由記述コメント (Comment)`, `回答日時 (Timestamp)`.  
  - Inputs: From Schedule Trigger  
  - Outputs: To Group & Prepare Data node  
  - Edge cases: Missing or incorrect Sheet ID/Name, auth errors, empty sheets, missing columns.

- **Data Source Note** (sticky note)  
  - Provides setup instructions for connecting the Google Sheets source and ensuring correct column names.

---

#### 1.2 Data Preparation & Grouping

**Overview:**  
Processes raw survey data by grouping responses into sentiment categories based on rating values and prepares batches (max 50 responses each) for AI analysis.

**Nodes Involved:**  
- Group & Prepare Data (Code node)  
- Loop Over Batches (splitInBatches)  
- Processing Note (sticky note)

**Node Details:**

- **Group & Prepare Data**  
  - Type: code (JavaScript)  
  - Role: Groups responses into three buckets: positive (rating ≥4), neutral (=3), negative (<3). Prepares batch arrays limited to 50 responses each for AI processing.  
  - Key expressions: Parses Japanese column names; creates `groupedByRating` object; slices responses for batching.  
  - Inputs: From Get Survey Responses  
  - Outputs: To Loop Over Batches  
  - Edge cases: Ratings missing or non-numeric; empty feedback; date missing (defaults to current ISO timestamp).

- **Loop Over Batches**  
  - Type: splitInBatches  
  - Role: Iterates over each sentiment batch to process them individually in downstream AI nodes.  
  - Inputs: From Group & Prepare Data  
  - Outputs: Two branches—one to Analyze Survey Batch, one to Aggregate Results.  
  - Edge cases: Empty batches, batch size handling.

- **Processing Note** (sticky note)  
  - Explains the logic: grouping by sentiment, looping over batches for AI analysis, aggregation for final summary.

---

#### 1.3 AI Processing

**Overview:**  
Uses an AI agent to analyze each sentiment batch, extracting recurring themes, key insights, and actionable recommendations, all strictly outputting JSON for downstream parsing.

**Nodes Involved:**  
- Analyze Survey Batch (LangChain Agent)  
- OpenRouter Chat Model (LangChain LM)  
- Structure Output (LangChain Output Parser)  
- AI Processing Note (sticky note)  
- Add Metadata (Code node)

**Node Details:**

- **Analyze Survey Batch**  
  - Type: `@n8n/n8n-nodes-langchain.agent`  
  - Role: Sends a prompt to the AI to analyze the batch of responses by sentiment, requesting JSON-only output with themes, insights, and recommendations.  
  - Config: Uses dynamic expressions to inject sentiment, count, and batch responses into prompt. System message enforces deep analysis and strict JSON output.  
  - Inputs: From Loop Over Batches  
  - Outputs: To Add Metadata  
  - Edge cases: AI response errors, prompt injection failures, JSON parsing issues.

- **OpenRouter Chat Model**  
  - Type: `@n8n/n8n-nodes-langchain.lmChatOpenRouter`  
  - Role: Language model node linked as AI backend for Analyze Survey Batch, configured for JSON object response format.  
  - Inputs: From Analyze Survey Batch (languageModel interface)  
  - Outputs: To Analyze Survey Batch (ai_languageModel)  
  - Edge cases: API auth errors, rate limits, timeout.

- **Structure Output**  
  - Type: `@n8n/n8n-nodes-langchain.outputParserStructured`  
  - Role: Parses the AI output according to a strict JSON schema defining themes, insights, recommendations, and sentiment summary.  
  - Inputs: From Analyze Survey Batch (ai_outputParser)  
  - Outputs: To Loop Over Batches (second main output)  
  - Edge cases: Schema mismatch, invalid JSON.

- **Add Metadata**  
  - Type: code  
  - Role: Enriches AI analysis results with the original sentiment label and count from the current batch iteration for aggregation.  
  - Inputs: From Analyze Survey Batch and Loop Over Batches (context data)  
  - Outputs: To Aggregate Results  
  - Edge cases: Missing loop context, data mismatch.

- **AI Processing Note** (sticky note)  
  - Advises on AI setup, credentials, and importance of JSON-only AI output for downstream reliability.

---

#### 1.4 Output Aggregation

**Overview:**  
Aggregates all AI batch analyses into a final consolidated report summarizing themes, insights, recommendations, and sentiment breakdown.

**Nodes Involved:**  
- Aggregate Results (Code node)

**Node Details:**

- **Aggregate Results**  
  - Type: code  
  - Role: Combines the array of AI results; merges themes by lowercase keys; deduplicates insights and recommendations; calculates total responses and sentiment breakdown; formats an executive summary string.  
  - Inputs: From Loop Over Batches (after Add Metadata)  
  - Outputs: To Save to Sheet and Send a message1 nodes  
  - Edge cases: Missing or malformed AI output, empty results, large datasets.

---

#### 1.5 Output & Reporting

**Overview:**  
Writes the consolidated summary to Google Sheets and posts a formatted Slack message with key findings.

**Nodes Involved:**  
- Save to Sheet (Google Sheets node)  
- Send a message1 (Slack node)  
- Output Options Note (sticky note)

**Node Details:**

- **Save to Sheet**  
  - Type: googleSheets (v4.5)  
  - Role: Appends a new row to a Google Sheet with fields including report date, sentiment breakdown, top themes, insights, recommendations, total responses, and executive summary.  
  - Config: Requires OAuth2 credentials; placeholders for Sheet ID and Name must be replaced.  
  - Inputs: From Aggregate Results  
  - Outputs: To Send a message1  
  - Edge cases: Sheet access errors, credential issues, data format mismatches.

- **Send a message1**  
  - Type: slack  
  - Role: Sends a detailed, formatted Slack message to a configured channel summarizing the report.  
  - Config: Uses OAuth2 Slack credentials; channel ID and name placeholders must be replaced; message uses n8n expressions to format date and lists; includes fallback text for missing data.  
  - Inputs: From Aggregate Results (via Save to Sheet)  
  - Outputs: None (end node)  
  - Edge cases: Slack API auth errors, channel misconfiguration, message formatting errors.

- **Output Options Note** (sticky note)  
  - Describes output options and reminds to replace placeholders and add credentials.

---

### 3. Summary Table

| Node Name             | Node Type                              | Functional Role                         | Input Node(s)             | Output Node(s)                      | Sticky Note                                                                                           |
|-----------------------|--------------------------------------|---------------------------------------|---------------------------|-----------------------------------|-----------------------------------------------------------------------------------------------------|
| Workflow Overview     | stickyNote                           | Overview and description of workflow  | None                      | None                              | ## Customer Survey Summary Generator (Template)<br>Automated daily run, AI analysis, Google Sheets & Slack output. |
| Daily Schedule Trigger | scheduleTrigger (v1.2)                | Triggers workflow daily at 9 AM JST   | None                      | Get Survey Responses              |                                                                                                     |
| Data Source Note      | stickyNote                           | Setup instructions for survey data    | None                      | None                              | ## Setup: Data Source<br>Instructions for connecting Google Sheets and required columns.             |
| Get Survey Responses  | googleSheets (v4.5)                   | Reads survey responses from Google Sheets | Daily Schedule Trigger    | Group & Prepare Data              |                                                                                                     |
| Group & Prepare Data  | code (JavaScript)                    | Groups responses by sentiment and batches | Get Survey Responses      | Loop Over Batches                 |                                                                                                     |
| Processing Note       | stickyNote                           | Explains processing logic              | None                      | None                              | ## Processing Logic<br>Grouping by sentiment, batching, looping over batches for AI analysis.       |
| Loop Over Batches     | splitInBatches (v3)                   | Iterates over sentiment batches       | Group & Prepare Data       | Analyze Survey Batch, Aggregate Results |                                                                                                     |
| Analyze Survey Batch  | LangChain Agent (v2)                 | AI analysis of each batch              | Loop Over Batches          | Add Metadata                     | ## Setup: AI Processing<br>AI analyzes themes, insights, recommendations; JSON-only output required. |
| OpenRouter Chat Model | LangChain LM OpenRouter (v1)          | AI language model backend              | Analyze Survey Batch (ai_languageModel) | Analyze Survey Batch (ai_outputParser) |                                                                                                     |
| Structure Output      | LangChain Output Parser (v1.2)        | Parses AI JSON output according to schema | Analyze Survey Batch (ai_outputParser) | Loop Over Batches                |                                                                                                     |
| Add Metadata          | code (JavaScript)                    | Adds batch metadata to AI results      | Analyze Survey Batch, Loop Over Batches | Aggregate Results                |                                                                                                     |
| Aggregate Results     | code (JavaScript)                    | Aggregates all AI batch analyses       | Loop Over Batches (Add Metadata) | Save to Sheet, Send a message1   |                                                                                                     |
| Output Options Note   | stickyNote                           | Output options and placeholder reminders | None                      | None                              | ## Output Options<br>Save to Sheets, Slack, optional CSV/DB insert; replace placeholders and add credentials. |
| Save to Sheet         | googleSheets (v4.5)                   | Appends consolidated summary to Sheet | Aggregate Results          | Send a message1                  |                                                                                                     |
| Send a message1       | slack (v2.3)                         | Posts formatted report to Slack channel | Save to Sheet              | None                             |                                                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n and set timezone to Asia/Tokyo.

2. **Add "Daily Schedule Trigger" node**  
   - Type: scheduleTrigger  
   - Trigger at hour: 9 (daily)  
   - No credentials needed.

3. **Add "Get Survey Responses" node**  
   - Type: googleSheets (v4.5)  
   - Operation: Read rows (default)  
   - Configure Google Sheets OAuth2 credentials.  
   - Set Document ID: Replace `YOUR_SHEET_ID` with your Google Sheet ID.  
   - Set Sheet Name: Replace `YOUR_SHEET_NAME` with your sheet tab name.  
   - Ensure sheet has columns: `満足度 (Rating)`, `自由記述コメント (Comment)`, `回答日時 (Timestamp)`.

4. **Connect "Daily Schedule Trigger" → "Get Survey Responses"**

5. **Add "Group & Prepare Data" node**  
   - Type: code (JavaScript)  
   - Paste the provided JS code that:  
     - Groups responses by rating into positive (≥4), neutral (=3), negative (<3)  
     - Creates batches limited to 50 responses per sentiment.  
   - Connect "Get Survey Responses" → "Group & Prepare Data"

6. **Add "Loop Over Batches" node**  
   - Type: splitInBatches (v3)  
   - No specific options needed.  
   - Connect "Group & Prepare Data" → "Loop Over Batches"

7. **Add "Analyze Survey Batch" node**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Set prompt with dynamic expressions to inject batch sentiment, count, and responses.  
   - Set system message enforcing deep, thematic AI analysis and JSON-only output.  
   - Connect "Loop Over Batches" (main output 0) → "Analyze Survey Batch"

8. **Add "OpenRouter Chat Model" node**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenRouter`  
   - Configure API credentials for OpenRouter or preferred AI provider.  
   - Set response format to `json_object`.  
   - Connect "Analyze Survey Batch" (ai_languageModel) → "OpenRouter Chat Model"

9. **Add "Structure Output" node**  
   - Type: `@n8n/n8n-nodes-langchain.outputParserStructured`  
   - Define input JSON schema with objects for themes, insights, recommendations, sentiment_summary.  
   - Connect "Analyze Survey Batch" (ai_outputParser) → "Structure Output"

10. **Connect "Structure Output" → "Loop Over Batches" (second output, index 1)**  
    - This completes the AI batch processing loop.

11. **Add "Add Metadata" node**  
    - Type: code  
    - Add code to enrich AI output with original sentiment and count from loop context.  
    - Connect "Analyze Survey Batch" → "Add Metadata"  
    - Connect "Loop Over Batches" → "Add Metadata" (to provide loop data context)

12. **Add "Aggregate Results" node**  
    - Type: code  
    - Paste code to merge themes (case-insensitive), deduplicate insights and recommendations, and prepare a final executive summary.  
    - Connect "Add Metadata" → "Aggregate Results"

13. **Add "Save to Sheet" node**  
    - Type: googleSheets (v4.5)  
    - Operation: Append  
    - Use same or different Google Sheets credentials and document ID / sheet name as preferred for output.  
    - Map fields: reportDate, sentimentBreakdown, topThemes, keyInsights, priorityRecommendations, totalResponsesAnalyzed, executiveSummary (match keys exactly as output).  
    - Connect "Aggregate Results" → "Save to Sheet"

14. **Add "Send a message1" Slack node**  
    - Type: slack (v2.3)  
    - Authentication: OAuth2 with Slack credentials.  
    - Channel: Replace `YOUR_CHANNEL_ID` with target Slack channel ID.  
    - Message text: Format using n8n expressions to present report date, counts, themes, insights, and recommendations in Japanese with markdown styling.  
    - Connect "Save to Sheet" → "Send a message1"

15. **Add Sticky Notes** (optional but recommended for clarity):  
    - Workflow Overview (general description)  
    - Data Source Note (Google Sheets setup instructions)  
    - AI Processing Note (AI setup and JSON output emphasis)  
    - Processing Note (logic for grouping and batching)  
    - Output Options Note (output destinations and placeholder reminders)

16. **Save and activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                                         |
|----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| This workflow automates customer survey analysis with AI, grouping responses by sentiment and producing actionable insights shared on Slack and Google Sheets. | Workflow general purpose described in "Workflow Overview" sticky note.                                                  |
| Replace all placeholder IDs and names (`YOUR_SHEET_ID`, `YOUR_SHEET_NAME`, `YOUR_CHANNEL_ID`) with your actual values before activating. | Critical setup note in "Data Source Note" and "Output Options Note".                                                    |
| Add your own credentials for Google Sheets (OAuth2), Slack (OAuth2), and AI provider (e.g., OpenRouter or OpenAI) in n8n's credential manager. | Credential setup reminder in AI Processing Note and Output Options Note.                                                |
| AI output must strictly be JSON to allow automatic parsing and aggregation downstream—avoid conversational or markdown formatting in AI prompt. | Emphasized in AI Processing Note and Analyze Survey Batch node configuration.                                           |
| The workflow respects survey data with columns in Japanese; adapt column names or logic if using surveys in other languages. | Mentioned in Data Source Note and Group & Prepare Data code node comments.                                              |
| Slack message formatting uses Japanese language and markdown styling to present a professional report. | See "Send a message1" Slack node configuration for formatting details.                                                  |

---

**Disclaimer:** The content originates exclusively from an n8n automated workflow. It conforms strictly to content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly accessible.