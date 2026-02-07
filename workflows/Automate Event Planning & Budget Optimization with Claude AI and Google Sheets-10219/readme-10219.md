Automate Event Planning & Budget Optimization with Claude AI and Google Sheets

https://n8nworkflows.xyz/workflows/automate-event-planning---budget-optimization-with-claude-ai-and-google-sheets-10219


# Automate Event Planning & Budget Optimization with Claude AI and Google Sheets

### 1. Workflow Overview

This workflow automates event planning and budget optimization using Claude AI and Google Sheets as data sources. It is designed for event planners or organizations managing complex events with multiple budget categories, vendors, and real-time cost tracking. The workflow orchestrates event metadata ingestion, aggregates budget and spending data, applies AI-driven strategic planning and budget optimization, and automates communication and reporting.

Logical blocks include:

- **1.1 Input Reception:** Trigger the workflow via webhook to start an event orchestration process.
- **1.2 Data Ingestion:** Read event briefs, budget estimates, actual costs, and vendor databases from Google Sheets.
- **1.3 Data Fusion & Aggregation:** Merge and aggregate all incoming data into a unified dataset with computed totals, variances, and category breakdowns.
- **1.4 AI Processing:** Use Claude AI to generate a detailed event plan and optimized budget based on fused data.
- **1.5 Post-AI Processing:** Parse AI output, calculate savings, ROI, and risk scores, and determine auto-approval status.
- **1.6 Persistence & Notifications:** Save the orchestrated plan back to Google Sheets, notify the team via Slack, and send an executive email report.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Input Reception

- **Overview:** Starts the workflow by receiving an HTTP POST webhook call with event orchestration request payload.
- **Nodes Involved:** Orchestrate Trigger
- **Node Details:**
  - **Orchestrate Trigger**  
    - Type: Webhook node  
    - Role: Entry point to trigger orchestration  
    - Configuration: HTTP POST method, path “event-orchestrate”  
    - Input: External HTTP POST request with JSON payload (including spreadsheetId, vendorSpreadsheetId, client info, etc.)  
    - Output: Passes payload downstream to data ingestion nodes  
    - Edge cases: Missing or malformed payload, webhook authentication (not configured here), network issues  
    - Sticky Note: "Webhook (POST /event-orchestrate) or Daily @ 7 AM schedule"

#### Block 1.2: Data Ingestion

- **Overview:** Reads multiple Google Sheets to acquire all relevant event-related data sets.
- **Nodes Involved:** Read Client Brief, Read Budget Estimates, Read Actual Costs, Read Vendor Database
- **Node Details:**
  - **Read Client Brief**  
    - Type: Google Sheets  
    - Role: Fetch metadata and event brief details from “ClientBriefs” sheet  
    - Config: Uses spreadsheetId from webhook JSON or default; authentication via service account  
    - Output: Client event info such as clientName, eventType, attendees, budget, plannerEmail  
  - **Read Budget Estimates**  
    - Type: Google Sheets  
    - Role: Fetch budget categories, budgetAmount, estimatedCost from “BudgetEstimates” sheet  
    - Config: Same spreadsheetId and auth as above  
  - **Read Actual Costs**  
    - Type: Google Sheets  
    - Role: Fetch real-time actual spend data from “ActualCosts” sheet  
  - **Read Vendor Database**  
    - Type: Google Sheets  
    - Role: Fetch vendor info such as vendorName, pricing, ratings from “VendorDatabase” sheet  
    - Config: Uses vendorSpreadsheetId if provided, else fallback to main spreadsheetId  
  - Edge Cases: Missing sheets, read permission errors, empty data, inconsistent spreadsheetId values  
  - Sticky Note: "Pulls event metadata from ClientBriefs sheet\n\nFetches budgetAmount, estimatedCost, vendor\n\nLoads real-time spend from ActualCosts\n\nRetrieves pricing, ratings, and reliability"

#### Block 1.3: Data Fusion & Aggregation

- **Overview:** Merges all data sources by position and aggregates totals, variances, and category breakdowns.
- **Nodes Involved:** Fuse All Data, Data Fusion Engine
- **Node Details:**
  - **Fuse All Data**  
    - Type: Merge  
    - Role: Combine incoming arrays from multiple Google Sheets nodes into a single stream by position  
    - Config: Merge mode “mergeByPosition” to align data entries  
    - Input: Outputs from Read Client Brief, Budget Estimates, Actual Costs, Vendor Database  
    - Output: Combined multi-source data for code processing  
  - **Data Fusion Engine**  
    - Type: Code (JavaScript)  
    - Role: Process merged data:  
      - Extracts metadata (eventId, clientName, etc.) from client brief  
      - Aggregates total budgeted, estimated, actual costs  
      - Builds category-wise budget and actual cost aggregation with itemized details  
      - Calculates variance, variance percentage, budget overshoot flag  
      - Prepares structured JSON with validation placeholders and timestamp  
    - Key Expressions:  
      - Parsing numerical values safely with fallback defaults  
      - Category grouping with cumulative sums  
      - Metadata enrichment with defaults  
    - Edge cases: Missing or malformed numeric fields, empty arrays, no categories, parse errors  
    - Sticky Note: "Aggregates totals, calculates variance, validates data" and "Merges all sources into unified dataset"

#### Block 1.4: AI Processing

- **Overview:** Sends structured prompt containing event data to Claude AI to generate a strategic event plan with budget optimization.
- **Nodes Involved:** Claude AI Core, AI Orchestration Engine
- **Node Details:**
  - **Claude AI Core**  
    - Type: Langchain Anthropic LM Chat node  
    - Role: Interface with Claude AI model “claude-3-5-sonnet-20241022”  
    - Config: Temperature 0.3 for controlled creativity  
    - Credentials: Anthropic API key setup  
    - Input: Prompt from AI Orchestration Engine node  
    - Output: AI-generated JSON plan text  
  - **AI Orchestration Engine**  
    - Type: Langchain Agent node  
    - Role: Constructs system prompt embedding event metadata, budgets, vendors, and instructions for JSON output  
    - Key Expressions:  
      - Template uses mustache-style interpolation from fused data JSON  
      - Requires output JSON with keys like planSummary, optimizedBudgetBreakdown, vendorRecommendations, riskAnalysis, autoApproval flag  
    - Output: AI response in JSON string form  
    - Edge cases: AI timeout, malformed AI response, missing fields in output  
    - Sticky Note: "Sends structured prompt to Claude AI"

#### Block 1.5: Post-AI Processing

- **Overview:** Parses AI JSON output, calculates savings, ROI, risk score, and decides whether to auto-approve plan.
- **Nodes Involved:** Parse & Finalize
- **Node Details:**
  - **Parse & Finalize**  
    - Type: Code (JavaScript)  
    - Role:  
      - Extract JSON object from AI textual response via regex match  
      - Calculate total savings from optimized budget breakdown  
      - Compute final cost and ROI improvement percentage  
      - Aggregate risk score using weighted probabilities and impacts  
      - Determine risk level (Low/Medium/High) and auto-approval boolean based on thresholds  
      - Append orchestration timestamp  
    - Edge cases: AI response missing JSON, parse failure fallback, zero division, missing keys  
    - Sticky Note: "Extracts JSON, computes savings, ROI, risk, sets auto-approve"

#### Block 1.6: Persistence & Notifications

- **Overview:** Stores the final event orchestration plan in Google Sheets, sends Slack updates, and emails the event planner.
- **Nodes Involved:** Save Orchestrated Plan, Team Sync, Executive Report
- **Node Details:**
  - **Save Orchestrated Plan**  
    - Type: Google Sheets  
    - Role: Append or update the “OrchestratedPlans” sheet with the final JSON event plan and KPIs  
    - Config: Uses spreadsheetId from JSON, auto-mapping input data columns  
    - Edge cases: Write permission errors, concurrency issues  
  - **Team Sync**  
    - Type: Slack node  
    - Role: Post formatted message to Slack channel with event status, savings, risk level, and plan link  
    - Config: Uses channel from teamChannel JSON field, message includes clickable Google Sheets link  
    - Edge cases: Slack API rate limits, invalid channel ID  
  - **Executive Report**  
    - Type: Email Send node  
    - Role: Send an HTML email to event planner summarizing approval status and plan details  
    - Config: Uses SMTP credentials, dynamic subject based on autoApprove boolean, from fixed email address  
    - Edge cases: Email delivery failures, invalid email addresses  
  - Sticky Note: "Writes full plan + KPIs to OrchestratedPlans\n\nPosts rich Slack message with status & link\n\nSends interactive HTML email to planner"

---

### 3. Summary Table

| Node Name             | Node Type                               | Functional Role                        | Input Node(s)                          | Output Node(s)                           | Sticky Note                                                                                     |
|-----------------------|---------------------------------------|-------------------------------------|--------------------------------------|------------------------------------------|------------------------------------------------------------------------------------------------|
| Orchestrate Trigger    | Webhook                               | Entry point receiving orchestration request | -                                    | Read Client Brief, Read Budget Estimates, Read Actual Costs, Read Vendor Database | Webhook (POST /event-orchestrate) or Daily @ 7 AM schedule                                    |
| Read Client Brief      | Google Sheets                         | Read event metadata from ClientBriefs sheet | Orchestrate Trigger                  | Fuse All Data                            | Pulls event metadata from ClientBriefs sheet\n\nFetches budgetAmount, estimatedCost, vendor\n\nLoads real-time spend from ActualCosts\n\nRetrieves pricing, ratings, and reliability |
| Read Budget Estimates  | Google Sheets                         | Read budget estimates from BudgetEstimates sheet | Orchestrate Trigger                  | Fuse All Data                            | Same as above                                                                                 |
| Read Actual Costs      | Google Sheets                         | Read actual spend data from ActualCosts sheet | Orchestrate Trigger                  | Fuse All Data                            | Same as above                                                                                 |
| Read Vendor Database   | Google Sheets                         | Read vendor info from VendorDatabase sheet | Orchestrate Trigger                  | Fuse All Data                            | Same as above                                                                                 |
| Fuse All Data          | Merge                                | Merge data arrays from all sources   | Read Client Brief, Read Budget Estimates, Read Actual Costs, Read Vendor Database | Data Fusion Engine                       | Merges all sources into unified dataset                                                      |
| Data Fusion Engine     | Code                                 | Aggregate budgets, actuals, metadata | Fuse All Data                       | AI Orchestration Engine                  | Aggregates totals, calculates variance, validates data                                       |
| Claude AI Core         | Langchain Anthropic LM Chat          | Call Claude AI model for event plan  | AI Orchestration Engine              | AI Orchestration Engine (feedback loop) | Sends structured prompt to Claude AI                                                        |
| AI Orchestration Engine| Langchain Agent                      | Generate structured event plan JSON  | Data Fusion Engine                   | Claude AI Core                          | Sends structured prompt to Claude AI                                                        |
| Parse & Finalize       | Code                                 | Parse AI output, calculate savings/ROI/risk | AI Orchestration Engine              | Save Orchestrated Plan, Team Sync, Executive Report | Extracts JSON, computes savings, ROI, risk, sets auto-approve                                |
| Save Orchestrated Plan | Google Sheets                        | Save final plan and KPIs to sheet    | Parse & Finalize                    | -                                        | Writes full plan + KPIs to OrchestratedPlans                                                |
| Team Sync              | Slack                                | Post event status and plan link      | Parse & Finalize                    | -                                        | Posts rich Slack message with status & link                                                 |
| Executive Report       | Email Send                          | Email event planner final status     | Parse & Finalize                    | -                                        | Sends interactive HTML email to planner                                                    |
| Sticky Note            | Sticky Note                         | Annotate webhook trigger info        | -                                  | -                                        | Webhook (POST /event-orchestrate) or Daily @ 7 AM schedule                                  |
| Sticky Note1           | Sticky Note                         | Annotate data fusion and aggregation | -                                  | -                                        | Aggregates totals, calculates variance, validates data                                     |
| Sticky Note2           | Sticky Note                         | Annotate AI prompt node              | -                                  | -                                        | Sends structured prompt to Claude AI                                                      |
| Sticky Note3           | Sticky Note                         | Annotate merge node                  | -                                  | -                                        | Merges all sources into unified dataset                                                    |
| Sticky Note4           | Sticky Note                         | Annotate Google Sheets data reads   | -                                  | -                                        | Pulls event metadata from ClientBriefs sheet\n\nFetches budgetAmount, estimatedCost, vendor\n\nLoads real-time spend from ActualCosts\n\nRetrieves pricing, ratings, and reliability |
| Sticky Note5           | Sticky Note                         | Annotate parse & finalize node       | -                                  | -                                        | Extracts JSON, computes savings, ROI, risk, sets auto-approve                              |
| Sticky Note6           | Sticky Note                         | Annotate persistence and notifications | -                                  | -                                        | Writes full plan + KPIs to OrchestratedPlans\n\nPosts rich Slack message with status & link\n\nSends interactive HTML email to planner |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Trigger:**
   - Node Type: Webhook  
   - Name: Orchestrate Trigger  
   - HTTP Method: POST  
   - Path: event-orchestrate  
   - Purpose: Receive event orchestration requests with payload including spreadsheetId, vendorSpreadsheetId, and client metadata.

2. **Add Google Sheets Nodes (4 nodes):**
   - Node 1: Read Client Brief  
     - Operation: Read Rows  
     - Sheet Name: ClientBriefs  
     - Document ID: Expression `{{$json.spreadsheetId || 'defaultSpreadsheetId'}}`  
     - Authentication: Google Service Account credential  
   - Node 2: Read Budget Estimates  
     - Operation: Read Rows  
     - Sheet Name: BudgetEstimates  
     - Document ID & Auth: Same as above  
   - Node 3: Read Actual Costs  
     - Operation: Read Rows  
     - Sheet Name: ActualCosts  
     - Document ID & Auth: Same as above  
   - Node 4: Read Vendor Database  
     - Operation: Read Rows  
     - Sheet Name: VendorDatabase  
     - Document ID: Expression `{{$json.vendorSpreadsheetId || $json.spreadsheetId}}`  
     - Auth: Same as above

3. **Merge Data:**
   - Node Type: Merge  
   - Name: Fuse All Data  
   - Mode: mergeByPosition  
   - Input: Connect all 4 Google Sheets nodes to this node.

4. **Data Fusion Engine (Code Node):**
   - Node Type: Code (JavaScript)  
   - Name: Data Fusion Engine  
   - Code: Implement aggregation logic to:  
     - Extract metadata from Client Brief  
     - Aggregate budget, estimate, actual costs by category  
     - Calculate total budgeted, estimated, actual costs, variance, and variance percent  
     - Structure output JSON with timestamp and validation placeholders  
   - Input: Fuse All Data node output  
   - Output: Aggregated dataset JSON for AI prompt

5. **AI Orchestration Engine (Langchain Agent):**
   - Node Type: Langchain Agent  
   - Name: AI Orchestration Engine  
   - System Message: Compose prompt embedding event metadata, budget totals, vendor list, and detailed instructions to generate JSON including planSummary, optimizedTimeline, budget breakdown, taskList, vendorRecommendations, riskAnalysis, savings, ROI, and approval flag. Use mustache-style expressions to inject data dynamically.  
   - Input: Data Fusion Engine output  
   - Output: AI-generated JSON plan text

6. **Claude AI Core (Langchain Anthropic LM Chat):**
   - Node Type: Langchain LM Chat Anthropic  
   - Name: Claude AI Core  
   - Model: claude-3-5-sonnet-20241022  
   - Temperature: 0.3  
   - Credentials: Anthropic API key  
   - Input: Connect AI Orchestration Engine node output to this node’s chat input.  
   - Output: AI response text with JSON plan

7. **Parse & Finalize (Code Node):**
   - Node Type: Code (JavaScript)  
   - Name: Parse & Finalize  
   - Code:  
     - Extract JSON object from AI response with regex  
     - Calculate total savings, final cost, ROI improvement  
     - Compute risk score and risk level based on risk analysis data  
     - Set autoApprove flag based on risk and savings thresholds  
     - Add orchestration timestamp  
   - Input: AI Orchestration Engine output (post Claude AI Core)  
   - Output: Final enriched JSON for persistence and notifications

8. **Save Orchestrated Plan (Google Sheets):**
   - Node Type: Google Sheets  
   - Name: Save Orchestrated Plan  
   - Operation: appendOrUpdate  
   - Sheet Name: OrchestratedPlans  
   - Document ID: From JSON data `{{$json.spreadsheetId}}`  
   - Column Mapping: Auto map input JSON fields  
   - Input: Parse & Finalize output

9. **Team Sync (Slack):**
   - Node Type: Slack  
   - Name: Team Sync  
   - Channel ID: From JSON `{{$json.teamChannel}}`  
   - Message Text: Template includes event id, clientName, eventType, status (autoApprove), savings, ROI, risk, and a link to Google Sheets plan  
   - Credentials: Slack API token  
   - Input: Parse & Finalize output

10. **Executive Report (Email Send):**
    - Node Type: Email Send  
    - Name: Executive Report  
    - To Email: From JSON `{{$json.plannerEmail}}`  
    - From Email: ai-orchestrator@company.com  
    - Subject: Dynamic, uses autoApprove to prefix “Approved” or “Review” with eventId  
    - Credentials: SMTP credentials  
    - Input: Parse & Finalize output

---

### 5. General Notes & Resources

| Note Content                                                                                                              | Context or Link                                      |
|---------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| Workflow is designed for integration with Google Sheets using service account authentication and requires API credentials. | Google Sheets API documentation                      |
| Claude AI model “claude-3-5-sonnet-20241022” used via Anthropic API with temperature 0.3 for balanced creativity.          | Anthropic API docs                                   |
| Slack integration requires channel ID from input JSON; Slack app must have chat:write permissions configured properly.    | Slack API chat.postMessage documentation            |
| Email sending requires SMTP configuration with valid credentials and sender domain verification for deliverability.       | SMTP standards and SPF/DKIM setup guides             |
| The workflow assumes consistent schema across sheets: ClientBriefs, BudgetEstimates, ActualCosts, VendorDatabase            | Spreadsheet schema design best practices             |
| Regex extraction of JSON from AI text is fragile; consider AI output validation or schema enforcement for robustness.      | JSON parsing and validation techniques                |
| Risk score calculation is heuristic and can be adjusted for more granular risk management frameworks.                      | Risk assessment models and scoring references        |