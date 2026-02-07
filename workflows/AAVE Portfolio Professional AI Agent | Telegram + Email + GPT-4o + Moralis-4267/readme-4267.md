AAVE Portfolio Professional AI Agent | Telegram + Email + GPT-4o + Moralis

https://n8nworkflows.xyz/workflows/aave-portfolio-professional-ai-agent---telegram---email---gpt-4o---moralis-4267


# AAVE Portfolio Professional AI Agent | Telegram + Email + GPT-4o + Moralis

---
### 1. Workflow Overview

This workflow, titled **"AAVE Portfolio Professional AI Agent"**, is designed to automatically monitor multiple Ethereum wallet addresses for their Aave V3 decentralized finance (DeFi) portfolio health. It fetches on-chain DeFi data using Moralis API, processes and analyzes this data using GPT-4o via LangChain, and then delivers human-readable reports through Telegram messages and formatted HTML emails. The workflow is intended for professional users or analysts who want timely, detailed insights into wallet positions on Aave, including risk indicators like health factors and liquidation thresholds.

**Target Use Cases:**
- Automated periodic portfolio health monitoring of Ethereum wallets interacting with Aave V3.
- Real-time alerts and reports delivered via Telegram and email.
- Portfolio risk analysis including liquidation risk warnings.
- Scalable monitoring of multiple wallet addresses managed via Google Sheets.

**Logical Blocks:**

- **1.1 Scheduler & Wallet Input:** Periodic trigger and dynamic wallet loading from Google Sheets.
- **1.2 Data Preparation:** Setting wallet address and current date variables for downstream use.
- **1.3 Moralis API Data Fetch:** Calls to Moralis API endpoints to retrieve DeFi summaries and detailed Aave V3 positions.
- **1.4 AI Processing:** Uses LangChain Agent with GPT-4o to analyze Moralis data and generate textual reports.
- **1.5 Report Formatting & Delivery:** Formats AI output into styled HTML email and sends reports via Telegram and Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduler & Wallet Input

**Overview:**  
Triggers workflow execution at fixed intervals (hourly by default) and loads wallet addresses dynamically from a Google Sheet for batch processing.

**Nodes Involved:**  
- Schedule Trigger  
- Wallet Addresses to Monitor  
- Sticky Note (Scheduler)  
- Sticky Note (Google Sheets Wallet Loader)

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow every hour to ensure periodic scanning.  
  - Configuration: Interval set to every 1 hour.  
  - Inputs: None (trigger node).  
  - Outputs: Connected to Google Sheets Loader.  
  - Failure Modes: Scheduler misconfiguration or downtime stops periodic runs.

- **Wallet Addresses to Monitor**  
  - Type: Google Sheets  
  - Role: Reads Ethereum wallet addresses from a designated Google Sheet column named `wallet_address`.  
  - Configuration: Reads from sheet with ID `1rTPT4-e8AER5xJkm297ibk3e4wVhDd5zSi66kTOCW0U`, sheet gid=0.  
  - Inputs: Trigger from Schedule Trigger.  
  - Outputs: Emits list of wallets for processing.  
  - Credentials: Google Sheets OAuth2 connected.  
  - Failure Modes: API quota limits, credential expiration, or sheet structure changes.

- **Sticky Notes**  
  - Provide contextual information about scheduler role and Google Sheets wallet source.

---

#### 1.2 Data Preparation

**Overview:**  
Transforms raw wallet data by setting two key variables: `Wallet_Address` and `current_date`. These are essential for API calls and report labeling.

**Nodes Involved:**  
- Edit Fields  
- Sticky Note (Set Variables)

**Node Details:**

- **Edit Fields**  
  - Type: Set  
  - Role: Assigns variables for the current wallet address and today's date (in `YYYY-MM-DD` format).  
  - Configuration:  
    - `Wallet_Address` assigned from input JSON property `wallet_address`.  
    - `=current_date` assigned dynamically using JavaScript Date API.  
  - Inputs: Wallet addresses from Google Sheets.  
  - Outputs: Prepared data to AI Agent node.  
  - Failure Modes: Expression errors if input JSON lacks expected property.

---

#### 1.3 Moralis API Data Fetch & AI Agent Processing

**Overview:**  
Fetches detailed DeFi data from Moralis APIs and applies AI analysis via LangChain Agent with GPT-4o-mini to generate a structured Aave portfolio health report.

**Nodes Involved:**  
- getDefiSummary  
- getDefiPositionsSummary  
- getDefiPositionsByProtocol  
- OpenAI Chat Model  
- AAVE Portfolio Professional AI Agent  
- Sticky Notes (Moralis API nodes, AI Report Generator, OpenAI Chat Model)

**Node Details:**

- **getDefiSummary**  
  - Type: HTTP Request (Tool node)  
  - Role: Fetches list of DeFi protocols the wallet is using.  
  - URL: Dynamic - `https://deep-index.moralis.io/api/v2.2/wallets/{{$json.Wallet_Address}}/defi/summary`  
  - Authentication: HTTP Header Auth with Moralis API key.  
  - Headers: `Content-Type: application/json`  
  - Inputs: Wallet address from Edit Fields.  
  - Outputs: JSON data forwarded to AI Agent.  
  - Failure Modes: API key invalid, rate limit exceeded, network failures.

- **getDefiPositionsSummary**  
  - Type: HTTP Request (Tool node)  
  - Role: Retrieves summary of wallet’s DeFi positions including collateral and debt.  
  - URL: Dynamic - `https://deep-index.moralis.io/api/v2.2/wallets/{{$json.Wallet_Address}}/defi/positions`  
  - Authentication: HTTP Header Auth with Moralis API key.  
  - Inputs: Wallet address.  
  - Outputs: Data for AI Agent use.  
  - Failure Modes: Same as above.

- **getDefiPositionsByProtocol**  
  - Type: HTTP Request (Tool node)  
  - Role: Fetches detailed Aave V3 positions, including pool and asset breakdowns.  
  - URL: Dynamic - `https://deep-index.moralis.io/api/v2.2/wallets/{{$json.Wallet_Address}}/defi/aave-v3/positions`  
  - Authentication: HTTP Header Auth.  
  - Inputs: Wallet address.  
  - Outputs: Detailed Aave data.  
  - Failure Modes: API or data unavailability.

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Processes prompt and generates natural language DeFi summary for each wallet.  
  - Model: `gpt-4o-mini` (optimized for speed and multimodal input).  
  - Inputs: Wallet address, current date, and Moralis API data (via LangChain Agent).  
  - Outputs: Text report for formatting and delivery.  
  - Credentials: OpenAI API key configured.  
  - Failure Modes: API quota exhaustion, prompt injection errors, latency.

- **AAVE Portfolio Professional AI Agent**  
  - Type: LangChain Agent  
  - Role: Central logic node that orchestrates Moralis API calls and OpenAI summarization.  
  - Configuration:  
    - System message instructs fetching from Moralis endpoints, processing Aave V3 data, formatting output per defined template (including fallback messages).  
    - Outputs human-readable reports.  
  - Inputs: Wallet address and current date from Edit Fields; Moralis API nodes as AI tools; OpenAI Chat Model as language model.  
  - Outputs: Text report JSON containing the summary.  
  - Failure Modes: Complex prompt parsing errors, API failures, or empty data responses.  
  - Notes: Designed to send output to Telegram and email formatting downstream.

---

#### 1.4 Report Formatting & Delivery

**Overview:**  
Transforms AI-generated text into styled HTML email content and sends final reports via Telegram chat and Gmail.

**Nodes Involved:**  
- Format Email  
- Telegram  
- Gmail  
- Sticky Notes (Format Email, Telegram Message Delivery, Send Aave Report via Gmail)

**Node Details:**

- **Format Email**  
  - Type: Code (JavaScript)  
  - Role: Converts AI output text into HTML and plain text email body.  
  - Configuration:  
    - Parses AI output for wallet address using regex.  
    - Formats line breaks to `<br>`, inserts horizontal rules `<hr>` for section breaks.  
    - Wraps content in basic styled `<div>`.  
    - Generates email subject with date and emoji prefix.  
  - Inputs: AI Agent output JSON (`output` property).  
  - Outputs: JSON with `wallet`, `subject`, `htmlBody`, `textBody`.  
  - Failure Modes: Regex failures if AI output format changes; malformed HTML if unexpected characters.

- **Telegram**  
  - Type: Telegram  
  - Role: Sends formatted report text to pre-configured Telegram chat.  
  - Configuration:  
    - Text payload from AI output (`$json.output`).  
    - Chat ID must be replaced with user’s Telegram chat ID.  
    - Attribution disabled.  
  - Credentials: Telegram Bot API credentials required.  
  - Inputs: AI Agent output.  
  - Failure Modes: Invalid chat ID, bot permissions, network issues.

- **Gmail**  
  - Type: Gmail  
  - Role: Sends full HTML email report to designated recipient.  
  - Configuration:  
    - Recipient email hardcoded to `don.jayamaha@treasurium.capital` (replace as needed).  
    - Message body is the formatted HTML from the `Format Email` node.  
    - Subject line set dynamically.  
    - Attribution disabled.  
  - Credentials: Gmail OAuth2 credential configured.  
  - Inputs: Output of Format Email node.  
  - Failure Modes: OAuth token expiration, email sending limits, invalid recipient.

---

### 3. Summary Table

| Node Name                      | Node Type                        | Functional Role                               | Input Node(s)                   | Output Node(s)                        | Sticky Note                                                                                  |
|-------------------------------|---------------------------------|-----------------------------------------------|--------------------------------|-------------------------------------|----------------------------------------------------------------------------------------------|
| Schedule Trigger               | Schedule Trigger                 | Periodic trigger for workflow execution       | None                           | Wallet Addresses to Monitor          | ## ⏰ Scheduler: Triggers workflow every X hours for automatic wallet scanning               |
| Wallet Addresses to Monitor    | Google Sheets                   | Load wallet addresses from Google Sheet       | Schedule Trigger               | Edit Fields                        | ## 📄 Google Sheets Wallet Loader: Loads wallet addresses; requires `wallet_address` column   |
| Edit Fields                   | Set                             | Set `Wallet_Address` and current date          | Wallet Addresses to Monitor    | AAVE Portfolio Professional AI Agent | ## 🧩 Set Variables: Prepare wallet and date variables for API calls and reporting           |
| getDefiSummary                | HTTP Request (Tool)              | Fetch DeFi protocol summary from Moralis API  | AAVE Portfolio Professional AI Agent (ai_tool) | AAVE Portfolio Professional AI Agent (ai_tool) | ## 📡 Moralis API – DeFi Summary: Fetch protocols wallet uses; requires API key              |
| getDefiPositionsSummary       | HTTP Request (Tool)              | Fetch protocol-level DeFi positions summary    | AAVE Portfolio Professional AI Agent (ai_tool) | AAVE Portfolio Professional AI Agent (ai_tool) | ## 📡 Moralis API – Position Summary: Get supply, borrow, collateral data                    |
| getDefiPositionsByProtocol    | HTTP Request (Tool)              | Fetch detailed Aave V3 positions               | AAVE Portfolio Professional AI Agent (ai_tool) | AAVE Portfolio Professional AI Agent (ai_tool) | ## 📡 Moralis API – Aave V3 Details: Pool-level breakdown; critical for liquidation risk      |
| OpenAI Chat Model             | LangChain OpenAI Chat Model      | Processes prompt and generates DeFi reports   | AAVE Portfolio Professional AI Agent (ai_languageModel) | AAVE Portfolio Professional AI Agent (ai_languageModel) | ## 🧠 OpenAI Chat Model: Uses GPT-4o-mini for report generation                              |
| AAVE Portfolio Professional AI Agent | LangChain Agent              | Orchestrates API calls and AI analysis         | Edit Fields                    | Telegram, Format Email              | ## 🤖 Aave AI Report Generator: AI summarizes Moralis data, outputs report                    |
| Format Email                 | Code                            | Formats AI output to HTML and text email bodies | AAVE Portfolio Professional AI Agent | Gmail                             | ## 📨 Format Email Report: Converts report to HTML + text for email delivery                 |
| Telegram                     | Telegram                        | Sends AI report via Telegram chat               | AAVE Portfolio Professional AI Agent | None                              | ## 📲 Telegram Message Delivery: Sends summary to Telegram chat; replace Chat ID             |
| Gmail                       | Gmail                          | Sends formatted HTML email report               | Format Email                   | None                              | ## 📧 Send Aave Report via Gmail: Sends email; requires Gmail OAuth2 credential               |
| Sticky Note                  | Sticky Note                    | Documentation nodes                             | None                         | None                              | Various explanatory notes covering each block                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set interval to every 1 hour (or desired frequency).  
   - No input; output connects to Google Sheets node.

2. **Add Google Sheets node ("Wallet Addresses to Monitor"):**  
   - Type: Google Sheets  
   - Connect to Schedule Trigger output.  
   - Configure with your Google Sheets OAuth2 credential.  
   - Set Document ID to your sheet containing wallet addresses.  
   - Set Sheet Name/GID to correct sheet (default `gid=0`).  
   - Ensure your sheet has a column named `wallet_address`.

3. **Add Set node ("Edit Fields"):**  
   - Connect input from Google Sheets node.  
   - Add field `Wallet_Address` assigned to `{{$json.wallet_address}}`.  
   - Add field `=current_date` assigned to current date string via expression: `={{ new Date().toISOString().split('T')[0] }}`.

4. **Add HTTP Request Tool nodes for Moralis API calls:**  
   - Create three nodes named:  
     - `getDefiSummary`  
     - `getDefiPositionsSummary`  
     - `getDefiPositionsByProtocol`  
   - For each:  
     - Type: HTTP Request Tool  
     - URL: Use dynamic expressions based on `{{$json.Wallet_Address}}` for:  
       - `/defi/summary`  
       - `/defi/positions`  
       - `/defi/aave-v3/positions` respectively  
     - Authentication: HTTP Header Auth using Moralis API key (header `X-API-Key`)  
     - Headers: Add `Content-Type: application/json`  
     - Connect all three as `ai_tool` inputs to the AI Agent node (see below).

5. **Add OpenAI Chat Model node:**  
   - Type: LangChain OpenAI Chat Model  
   - Configure with OpenAI API credentials.  
   - Set model to `gpt-4o-mini`.  
   - Connect as `ai_languageModel` input to AI Agent node.

6. **Add LangChain Agent node ("AAVE Portfolio Professional AI Agent"):**  
   - Type: LangChain Agent  
   - Input: Connect from Set node (`Edit Fields`).  
   - Add AI tools inputs from three Moralis API HTTP Request nodes.  
   - Add AI language model input from OpenAI Chat Model node.  
   - Configure system prompt with instructions to fetch and analyze Moralis API data and format output per defined report template, including fallback message if no data.  
   - Configure output to pass AI-generated text downstream.  
   - Connect main output to Telegram and Format Email nodes.

7. **Add Code node ("Format Email"):**  
   - Type: Code (JavaScript)  
   - Input: AI Agent output.  
   - Use code that:  
     - Extracts wallet address from AI output text via regex.  
     - Converts line breaks and section breaks to HTML (`<br>`, `<hr>`).  
     - Wraps content in styled HTML div.  
     - Creates email subject with date and emoji.  
     - Outputs JSON with `wallet`, `subject`, `htmlBody`, `textBody`.

8. **Add Telegram node:**  
   - Type: Telegram  
   - Configure with Telegram Bot API credentials.  
   - Set Chat ID to target chat for report delivery.  
   - Set text parameter to AI Agent output text (`{{$json.output}}`).  
   - Disable attribution.  
   - Connect input from AI Agent node.

9. **Add Gmail node:**  
   - Type: Gmail  
   - Configure Gmail OAuth2 credentials.  
   - Set recipient to desired email address.  
   - Set message body to `htmlBody` from Format Email node.  
   - Set subject to `subject` from Format Email node.  
   - Disable attribution.  
   - Connect input from Format Email node.

10. **Add Sticky Notes:**  
    - Add descriptive sticky notes near each logical block for documentation and clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Full system documentation available as a large sticky note node describing setup, components, installation, and support. | Inline sticky note in workflow titled "🧠 AAVE Portfolio Professional AI Agent – Full System Documentation" |
| Google Sheet link placeholder: [Google Sheet link] for wallet address management                                    | Specified in sticky note near Google Sheets node                                                   |
| Telegram Chat ID and Gmail recipient email placeholders must be replaced with actual values                         | Critical for message delivery nodes                                                                |
| Moralis API requires valid `X-API-Key` HTTP header authentication                                                  | Moralis API nodes configuration                                                                    |
| OpenAI API credentials configured for GPT-4o-mini model via LangChain                                                | AI processing nodes                                                                                |
| Workflow designed for extensibility: add Telegram commands, alerts on health factor, CSV/Notion exports possible     | Mentioned in full documentation sticky note                                                        |
| Author and licensing details: Don Jayamaha, Treasurium Capital Limited Company                                        | Provided in workflow documentation sticky note                                                    |

---

**Disclaimer:**  
The text and functionality described originate exclusively from an automated n8n workflow integration. The workflow respects all applicable content policies and handles only legal and public data.

---