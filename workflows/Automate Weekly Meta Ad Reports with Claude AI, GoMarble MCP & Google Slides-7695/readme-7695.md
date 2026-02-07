Automate Weekly Meta Ad Reports with Claude AI, GoMarble MCP & Google Slides

https://n8nworkflows.xyz/workflows/automate-weekly-meta-ad-reports-with-claude-ai--gomarble-mcp---google-slides-7695


# Automate Weekly Meta Ad Reports with Claude AI, GoMarble MCP & Google Slides

### 1. Workflow Overview

This workflow automates the generation and distribution of a weekly Meta Ads performance summary deck. It is designed for senior digital marketing analysts who need a concise, actionable report for busy CMOs, delivered every Monday morning. The workflow integrates AI-powered analysis, data retrieval from Meta Ads via GoMarble MCP, slide deck creation in Google Slides, and automated email delivery.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Input Setup**  
  Initiates the workflow weekly and sets key input parameters such as ad account details and report prompt configuration.

- **1.2 AI Processing & Data Retrieval**  
  Invokes GoMarble MCP to fetch Meta Ads metrics, and uses an Anthropic Claude AI agent to analyze the data and generate exactly five slides of structured JSON content.

- **1.3 Validation & Slide Deck Creation**  
  Validates the AI-generated slides JSON, creates a new Google Slides presentation, and formats the slides including tables for KPIs.

- **1.4 Presentation Finalization & Distribution**  
  Executes batch updates to build the presentation, downloads the generated file, and sends it via email to specified recipients.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Input Setup

**Overview:**  
This block starts the workflow every Monday at 8 AM and sets essential parameters like the Facebook ad account name and the detailed AI prompt instructions for the report. It allows manual customization of account and email details.

**Nodes Involved:**  
- Schedule Trigger  
- Ad Account  
- Sticky Note (account guidance)  
- Report Prompt  

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow weekly on Monday at 8 AM.  
  - Configuration: Interval set to weekly, trigger day Monday, hour 8 AM.  
  - Input: None  
  - Output: Triggers Ad Account node.  
  - Edge Cases: Misconfigured schedule may delay or miss runs.

- **Ad Account**  
  - Type: Set  
  - Role: Defines the Facebook ad account name used in the report.  
  - Configuration: Sets variable `accountName` to "Long Surf" (editable).  
  - Input: From Schedule Trigger.  
  - Output: To Report Prompt node.  
  - Edge Cases: Missing or incorrect accountName will cause inaccurate or empty reports.

- **Sticky Note (Account Guidance)**  
  - Type: Sticky Note  
  - Role: Instructional note reminding user to edit the Ad Account node with relevant Facebook ad account.  
  - Input/Output: None (visual aid only).

- **Report Prompt**  
  - Type: Set  
  - Role: Builds the textual prompt for the AI agent, embedding the accountName and instructions for data retrieval and slide formatting.  
  - Configuration: Multi-line string prompt specifying voice, goal, data source usage (GoMarble MCP), strict JSON slide output requirements (5 slides exactly, no fluff).  
  - Key Variables: Uses expression `{{ $json.accountName }}` to inject dynamic account name.  
  - Input: From Ad Account.  
  - Output: To AI Agent node.  
  - Edge Cases: Improper prompt text or syntax errors can confuse AI output.

---

#### 1.2 AI Processing & Data Retrieval

**Overview:**  
This block calls the GoMarble MCP API to fetch Meta Ads metrics, then sends the combined prompt and data to the Anthropic Claude AI model to generate the report content as JSON slides.

**Nodes Involved:**  
- GoMarble MCP  
- Anthropic Chat Model  
- AI Agent  

**Node Details:**

- **GoMarble MCP**  
  - Type: LangChain MCP Client Tool  
  - Role: Calls Meta Ads API via GoMarble to retrieve JSON metrics for the last 7 days.  
  - Configuration: SSE endpoint set to GoMarble MCP API URL, uses Bearer authentication with stored credential.  
  - Input: Invoked by AI Agent as external tool call.  
  - Output: JSON data of ad performance metrics.  
  - Edge Cases: Authentication failure (invalid token), API downtime, network timeouts.

- **Anthropic Chat Model**  
  - Type: LangChain Chat Model  
  - Role: Provides the Claude AI language model to be used by AI Agent.  
  - Configuration: Model set to "claude-sonnet-4-20250514", authenticated via Anthropic API credentials.  
  - Input: Used internally by AI Agent as language model.  
  - Output: AI-generated text response (raw report JSON).  
  - Edge Cases: API limits, authentication errors, model latency.

- **AI Agent**  
  - Type: LangChain Agent  
  - Role: Coordinates the prompt and tool calls, sends the report prompt plus GoMarble data to the Claude AI model, enforcing output rules.  
  - Configuration: Uses the "Report Prompt" text, system message directs it to produce exactly 5 slides JSON without hallucination, placeholder text allowed for missing data.  
  - Input: Receives prompt text and GoMarble MCP results.  
  - Output: Raw JSON string of slides.  
  - Edge Cases: AI hallucination, invalid JSON output, timeout, incomplete responses.

---

#### 1.3 Validation & Slide Deck Creation

**Overview:**  
This block ensures the AI output is valid JSON with exactly 5 slides, creates a new Google Slides presentation, and prepares batch update requests to build slides with text and tables.

**Nodes Involved:**  
- Validate slide output  
- Create Presentation  
- Merge Presentation Info  
- Format Slides Data  
- Build Presentation  

**Node Details:**

- **Validate slide output**  
  - Type: Code  
  - Role: Parses the AI agent’s raw output, strips markdown fences, validates JSON, enforces exactly 5 slides.  
  - Configuration: JavaScript code with robust parsing, fallback to default slides if parsing fails.  
  - Input: AI Agent output.  
  - Output: JSON object containing validated slides array.  
  - Edge Cases: JSON parsing errors, missing slides, malformed AI output.

- **Create Presentation**  
  - Type: HTTP Request  
  - Role: Calls Google Slides API to create an empty presentation titled with current date.  
  - Configuration: POST to slides.googleapis.com/v1/presentations, JSON body includes dynamic title `Weekly Ad Report – MM-DD`, credentialed with Google Slides OAuth2.  
  - Input: From Validate slide output.  
  - Output: Presentation ID.  
  - Edge Cases: API authentication failure, quota limits, network issues.

- **Merge Presentation Info**  
  - Type: Set  
  - Role: Combines presentation ID from Create Presentation with slides data from validation for formatting.  
  - Input: From Create Presentation and Validate slide output.  
  - Output: To Format Slides Data.  
  - Edge Cases: Missing data fields.

- **Format Slides Data**  
  - Type: Code  
  - Role: Prepares Google Slides batch update requests to delete default slide, create 5 new slides, insert titles and bodies, and render a table for the "Channel KPIs" slide.  
  - Configuration: JavaScript constructs requests array with slide IDs, text insertions, and table creation with metrics.  
  - Input: Presentation ID and slides array.  
  - Output: JSON batch update body for Google Slides API.  
  - Edge Cases: Slide count mismatch, API request size limits, slide object ID collisions.

- **Build Presentation**  
  - Type: HTTP Request  
  - Role: Executes the batchUpdate call to Google Slides API to build the full presentation using prepared requests.  
  - Configuration: POST to `presentations/{presentationId}:batchUpdate` with JSON body from previous node, authenticated.  
  - Input: From Format Slides Data.  
  - Output: Completed presentation ready for download.  
  - Edge Cases: API quota, invalid requests, authentication errors.

---

#### 1.4 Presentation Finalization & Distribution

**Overview:**  
This block downloads the finished presentation file from Google Drive and sends it via Gmail to the specified recipient with the weekly summary deck attached.

**Nodes Involved:**  
- Download file  
- Send Email  
- Sticky Note1 (email guidance)  

**Node Details:**

- **Download file**  
  - Type: Google Drive  
  - Role: Downloads the Google Slides presentation file by ID for attachment.  
  - Configuration: Uses dynamic fileId from presentationId, authenticated with Google Drive OAuth2 credentials.  
  - Input: From Build Presentation (presentationId).  
  - Output: Binary file data for email attachment.  
  - Edge Cases: Missing file, permission denied, network issues.

- **Send Email**  
  - Type: Gmail  
  - Role: Sends an email with the presentation attached to the recipient.  
  - Configuration:  
    - To: hardcoded "amancliff1@gmail.com" (editable).  
    - Subject: dynamically includes date, e.g. "Weekly Summary Deck - MM-DD".  
    - Message body: brief note referencing the deck and date.  
    - Attachment: binary from Download file node.  
  - Input: Attachment binary from Download file.  
  - Output: Email sent confirmation.  
  - Edge Cases: Auth errors, attachment size limits, invalid email address.

- **Sticky Note1**  
  - Type: Sticky Note  
  - Role: Instructional note reminding user to edit the email ID in the Send Email node.  
  - Input/Output: None.

---

### 3. Summary Table

| Node Name            | Node Type                          | Functional Role                     | Input Node(s)           | Output Node(s)          | Sticky Note                                                                                   |
|----------------------|----------------------------------|-----------------------------------|------------------------|-------------------------|----------------------------------------------------------------------------------------------|
| Schedule Trigger      | Schedule Trigger                  | Starts workflow weekly            | -                      | Ad Account              | :alarm_clock: Runs every Monday at 8 AM - adjust schedule as needed                           |
| Ad Account            | Set                              | Sets Facebook ad account name     | Schedule Trigger        | Report Prompt           | Please add the name of the Facebook ad account in the node below for which you need the summary deck. |
| Sticky Note           | Sticky Note                      | Instructional note for Ad Account | -                      | -                       | Please add the name of the Facebook ad account in the node below for which you need the summary deck. |
| Report Prompt         | Set                              | Builds AI prompt text             | Ad Account              | AI Agent                | 🔧 EDIT THIS NODE to change:\n• Account Name & ID\n• Email Recipients\n• Report Settings      |
| GoMarble MCP          | LangChain MCP Client Tool         | Fetches Meta Ads metrics          | AI Agent (tool call)    | AI Agent (tool data)    | :closed_lock_with_key: Add your GoMarble Bearer token - get it from https://www.gomarble.ai/docs/connect-to-n8n |
| Anthropic Chat Model  | LangChain Chat Model              | Provides Claude AI language model | AI Agent (languageModel)| AI Agent                |                                                                                              |
| AI Agent             | LangChain Agent                   | Coordinates AI prompt & tools     | Report Prompt, GoMarble MCP, Anthropic Chat Model | Validate slide output     |                                                                                              |
| Validate slide output | Code                             | Parses & validates AI JSON output | AI Agent                | Create Presentation     | :lock: GUARANTEES exactly 5 slides - no more, no less                                        |
| Create Presentation   | HTTP Request (Google Slides API) | Creates empty Google Slides deck  | Validate slide output   | Merge Presentation Info | :bar_chart: Creates empty presentation                                                       |
| Merge Presentation Info| Set                             | Combines presentation ID & slides | Create Presentation     | Format Slides Data      | :link: Combines presentation ID with slide data                                             |
| Format Slides Data    | Code                             | Prepares batch requests for slides| Merge Presentation Info | Build Presentation      | :wrench: Prepares the batch request with slide data                                         |
| Build Presentation    | HTTP Request (Google Slides API) | Executes batch update to build slides| Format Slides Data  | Download file           | :page_facing_up: Executes the batch update to create all slides                             |
| Download file         | Google Drive                     | Downloads presentation file       | Build Presentation      | Send Email              | Please add the email ID in the node below to which you want the summary deck sent.           |
| Send Email            | Gmail                            | Sends the presentation via email  | Download file           | -                       | Please add the email ID in the node below to which you want the summary deck sent.           |
| Sticky Note1          | Sticky Note                      | Instructional note for Send Email | -                      | -                       | Please add the email ID in the node below to which you want the summary deck sent.           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set to trigger every Monday at 8 AM (weekly interval, day=1, hour=8).

2. **Create Ad Account node (Set):**  
   - Type: Set  
   - Add string field `accountName` with default value (e.g., "Long Surf").  
   - Connect Schedule Trigger output to Ad Account input.

3. **Add Sticky Note near Ad Account:**  
   - Content: "Please add the name of the Facebook ad account in the node below for which you need the summary deck."

4. **Create Report Prompt node (Set):**  
   - Type: Set  
   - Add string field `Report Prompt` with multi-line text including:  
     - Role definition: senior performance-marketing analyst  
     - Voice and goal instructions  
     - Ad account variable injected via `{{ $json.accountName }}`  
     - Instructions for calling GoMarble MCP with `{"period":"last_7_days"}`  
     - Strict output format: JSON with exactly 5 slides, slide titles and content structure specified  
   - Connect Ad Account output to Report Prompt input.

5. **Create Anthropic Chat Model node:**  
   - Type: LangChain Chat Model  
   - Select model "claude-sonnet-4-20250514" or latest Claude 4 Sonnet version.  
   - Assign Anthropic API credentials.

6. **Create GoMarble MCP node:**  
   - Type: LangChain MCP Client Tool  
   - Set SSE endpoint to `https://apps.gomarble.ai/mcp-api/sse`  
   - Use Bearer Auth credentials from your GoMarble account.

7. **Create AI Agent node:**  
   - Type: LangChain Agent  
   - Set prompt text input to `={{ $json['Report Prompt'] }}`  
   - Configure system message to instruct:  
     "You are a senior digital marketing professional. Return exactly 5 slides JSON. No hallucinations. Use placeholders if needed."  
   - Set prompt type to "define".  
   - Connect `Report Prompt` node to AI Agent main input.  
   - Connect `GoMarble MCP` node as AI Agent tool (`ai_tool` input).  
   - Connect `Anthropic Chat Model` as AI Agent language model (`ai_languageModel` input).

8. **Create Validate slide output node (Code):**  
   - Type: Code  
   - Paste JavaScript code that parses AI output, strips markdown fences, validates JSON with exactly 5 slides, returns slides array.  
   - Includes fallback slides if parsing fails.  
   - Connect AI Agent output to this node.

9. **Create Create Presentation node (HTTP Request):**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://slides.googleapis.com/v1/presentations`  
   - Body (JSON): `{ "title": "Weekly Ad Report – {{ $now.format('MM-DD') }}" }`  
   - Authentication: Google Slides OAuth2 credentials.  
   - Connect Validate slide output node to this node.

10. **Create Merge Presentation Info node (Set):**  
    - Type: Set  
    - Assign two fields:  
      - `presentationId` from `{{$json.presentationId}}`  
      - `slides` from `{{$items('Validate slide output')[0].json.slides}}`  
    - Connect Create Presentation output to this node.

11. **Create Format Slides Data node (Code):**  
    - Type: Code  
    - Add JavaScript to build batch update requests:  
      - Delete default slide  
      - Create 5 slides with IDs and placeholders  
      - Insert titles and bodies or create table for "Channel KPIs" slide with 10 rows x 2 columns  
    - Connect Merge Presentation Info output to this node.

12. **Create Build Presentation node (HTTP Request):**  
    - Type: HTTP Request  
    - Method: POST  
    - URL: `https://slides.googleapis.com/v1/presentations/{{$json.presentationId}}:batchUpdate`  
    - Body: `{{$json.batchUpdateBody}}` (stringified JSON)  
    - Authentication: Google Slides OAuth2 credentials.  
    - Connect Format Slides Data output to this node.

13. **Create Download file node (Google Drive):**  
    - Type: Google Drive  
    - Operation: Download  
    - File ID: `{{$json.presentationId}}`  
    - Authentication: Google Drive OAuth2 credentials.  
    - Connect Build Presentation output to this node.

14. **Create Send Email node (Gmail):**  
    - Type: Gmail  
    - Set recipient email (e.g., "amancliff1@gmail.com")  
    - Subject: `Weekly Summary Deck - {{ $now.format('MM-DD') }}`  
    - Message: `Here is the Weekly Ad Performance Summary Deck - {{ $now.format('MM-DD') }}.`  
    - Attach binary from Download file node.  
    - Authentication: Gmail OAuth2 credentials.  
    - Connect Download file output to this node.

15. **Add Sticky Note near Send Email node:**  
    - Content: "Please add the email ID in the node below to which you want the summary deck sent."

---

### 5. General Notes & Resources

| Note Content                                                                                                                              | Context or Link                                                        |
|-------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| GoMarble MCP requires a Bearer token available from https://www.gomarble.ai/docs/connect-to-n8n                                            | GoMarble MCP API setup documentation                                 |
| The AI prompt enforces strict JSON output with exactly 5 slides for consistent downstream processing                                       | Custom prompt instructions in Report Prompt node                     |
| Google Slides API quota and permissions must be configured in Google Cloud Console for OAuth2 credentials                                 | Google Slides API documentation                                      |
| Gmail OAuth2 credentials must have permission to send emails and attach files                                                             | Gmail API OAuth2 setup instructions                                  |
| The workflow uses the Anthropic Claude model "claude-sonnet-4-20250514" which may require separate API key and access permissions         | Anthropic API documentation                                          |
| Placeholders in the prompt guide the AI to avoid hallucinations by using fallback text when data is missing                               | Critical to prevent invalid or misleading reports                    |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated n8n workflow. This process strictly complies with current content policies and contains no illegal, offensive, or protected material. All data processed is legal and public.