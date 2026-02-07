Analyze USD/JPY Rates with AI and Tavily News Search for Email Reporting

https://n8nworkflows.xyz/workflows/analyze-usd-jpy-rates-with-ai-and-tavily-news-search-for-email-reporting-9550


# Analyze USD/JPY Rates with AI and Tavily News Search for Email Reporting

### 1. Workflow Overview

This workflow automates the analysis of the USD/JPY foreign exchange rate every 4 hours by leveraging AI for both fundamental and technical insights, integrating the latest news for a comprehensive evaluation, and emailing the results. It targets financial analysts or automated trading assistants who require timely, structured forex insights combining real-time exchange data and relevant news.

Logical blocks in the workflow are:

- **1.1 Scheduled Trigger:** Periodic initiation every 4 hours to start the pipeline.
- **1.2 Configuration Setup:** Setting API keys and notification email.
- **1.3 Fetch Current Exchange Rate:** HTTP request to retrieve the latest USD/JPY rate.
- **1.4 AI Analysis:** An AI agent processes the exchange rate and uses tools for news search and structured output parsing to generate an investment recommendation.
- **1.5 Email Notification:** Sends the AI-generated analysis results via email.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:** This block triggers the entire workflow every 4 hours, ensuring periodic execution without manual intervention.
- **Nodes Involved:**  
  - Run every 4 hours  
  - Note: Schedule (sticky note)

- **Node Details:**

  - **Run every 4 hours**  
    - Type: Schedule Trigger  
    - Role: Initiates workflow on a fixed interval  
    - Configuration: Set to trigger every 4 hours (hoursInterval=4)  
    - Inputs: None (trigger node)  
    - Outputs: Connected to the "Set (Fields) — Configure me" node  
    - Edge cases: If n8n service downtime occurs, scheduled trigger may skip runs; ensure system uptime.

  - **Note: Schedule**  
    - Type: Sticky Note  
    - Role: Documentation for users describing the schedule  
    - Content: "Runs every 4 hours. Starts the forex analysis pipeline."

---

#### 1.2 Configuration Setup

- **Overview:** This block sets essential variables such as the Tavily API key for news search and the recipient email address for notifications.
- **Nodes Involved:**  
  - Set (Fields) — Configure me  
  - Note: Fetch rate (sticky note) — near this block for contextual relevance

- **Node Details:**

  - **Set (Fields) — Configure me**  
    - Type: Set node  
    - Role: Defines workflow variables/credentials such as API keys and email addresses  
    - Configuration:  
      - `tavilyApiKey`: Your Tavily API key for news search  
      - `notifyEmail`: Email address to receive analysis results  
    - Inputs: Triggered by "Run every 4 hours" node  
    - Outputs: Feeds into "Fetch USD/JPY rate (HTTP)" node  
    - Edge cases: Missing or invalid API key or email will cause downstream failures (e.g., HTTP errors or email send failure).

  - **Note: Fetch rate**  
    - Type: Sticky Note  
    - Role: Explains the purpose of fetching exchange rates via a free HTTP API.

---

#### 1.3 Fetch Current Exchange Rate

- **Overview:** Retrieves the latest USD/JPY exchange rate from a public API to supply real-time data for analysis.
- **Nodes Involved:**  
  - Fetch USD/JPY rate (HTTP)  
  - Note: Fetch rate (sticky note)

- **Node Details:**

  - **Fetch USD/JPY rate (HTTP)**  
    - Type: HTTP Request  
    - Role: Fetches current exchange rate data  
    - Configuration:  
      - Method: GET  
      - URL: `https://api.exchangerate-api.com/v4/latest/USD`  
      - No authentication required  
    - Inputs: From "Set (Fields) — Configure me"  
    - Outputs: JSON data containing currency rates, specifically `$json.rates.JPY` used later  
    - Edge cases:  
      - API downtime or rate limits may cause failure or stale data  
      - Network timeouts  
      - Unexpected API response format changes

---

#### 1.4 AI Analysis

- **Overview:** Uses an AI agent to analyze the USD/JPY rate including fundamental and technical aspects by invoking external tools for news search and structured output parsing.
- **Nodes Involved:**  
  - Analyze USD/JPY (AI agent)  
  - LLM provider (configure)  
  - Tool: Search Forex News (Tavily)  
  - Tool: Structured Output Parser  
  - Note: LLM setup (sticky note)

- **Node Details:**

  - **Analyze USD/JPY (AI agent)**  
    - Type: LangChain AI Agent node  
    - Role: Core AI processing node that:  
      - Receives current exchange rate input  
      - Calls the "Search Forex News" tool (Tavily) to retrieve latest USD/JPY news  
      - Performs technical analysis on the rate  
      - Outputs a structured investment recommendation ("買い", "売り", or "様子見") with reasoning  
    - Configuration highlights:  
      - Prompt includes Japanese instructions to analyze based on `{{ $json.rates.JPY }}`  
      - System message defines role as an experienced forex analyst who must use tools  
      - Enforces output via the "Analysis Output Parser" tool to ensure structured JSON  
    - Inputs: From "Fetch USD/JPY rate (HTTP)" node (exchange rate data) and from the LLM provider and tools nodes  
    - Outputs: Passes parsed result to the email sending node  
    - Edge cases:  
      - LLM provider unavailable or rate limited  
      - Tool API errors (news search fails)  
      - Parser mismatches if AI output is malformed  
      - Expression errors if input data missing or malformed

  - **LLM provider (configure)**  
    - Type: LangChain LLM Chat Open Router  
    - Role: Configures the language model provider credentials and options for AI agent  
    - Configuration: Placeholder for user to input their LLM provider credentials (e.g., OpenAI API keys)  
    - Inputs: None  
    - Outputs: Connected to AI agent node  
    - Edge cases: Invalid or missing credentials cause AI failures

  - **Tool: Search Forex News (Tavily)**  
    - Type: LangChain HTTP Tool  
    - Role: Searches the Tavily API for latest USD/JPY-related news  
    - Configuration:  
      - Method: POST  
      - URL: `https://api.tavily.com/search`  
      - Body includes API key from workflow variable, search query `{searchTerm}`, topic "finance", max 5 results, and advanced search depth  
      - The search term can be customized (default targets USD/JPY news)  
    - Inputs: Called internally by the AI agent node  
    - Outputs: News data used by AI for fundamental analysis  
    - Edge cases:  
      - Invalid or expired Tavily API key  
      - Network or API service errors

  - **Tool: Structured Output Parser**  
    - Type: LangChain Output Parser  
    - Role: Ensures the AI agent returns strictly structured JSON with fields: recommendation, currentRate, technicalAnalysis, newsAnalysis, reasoning  
    - Configuration: JSON schema manually defined to enforce required properties  
    - Inputs: AI agent raw output  
    - Outputs: Parsed structured analysis passed to AI agent final output  
    - Edge cases: Parsing errors if AI output doesn't conform to schema

  - **Note: LLM setup**  
    - Type: Sticky Note  
    - Role: Instruction for users to supply LLM credentials here  
    - Content: "Provide your LLM provider credential in this node. Default: small/light model."

---

#### 1.5 Email Notification

- **Overview:** Sends the structured AI analysis results via email to the configured recipient after each analysis cycle.
- **Nodes Involved:**  
  - Send results via Gmail  
  - Note: Email setup (sticky note)

- **Node Details:**

  - **Send results via Gmail**  
    - Type: Gmail node  
    - Role: Sends the analysis results as an email message  
    - Configuration:  
      - Recipient: Uses `{{ $json.notifyEmail }}` from earlier set variables  
      - Subject: "USD/JPY analysis result"  
      - Message: JSON stringified output from AI agent, includes all analysis fields  
      - Credential: User must configure Gmail OAuth2 or SMTP credentials in n8n  
    - Inputs: From "Analyze USD/JPY (AI agent)" node  
    - Outputs: None (terminal node)  
    - Edge cases:  
      - Authentication errors if Gmail SMTP credentials invalid  
      - Email delivery failures (invalid recipient, network issues)  

  - **Note: Email setup**  
    - Type: Sticky Note  
    - Role: User instruction to configure email credential and recipient  
    - Content: "Configure your email credential (Gmail or SMTP). Recipient is controlled via the Set (Fields) node."

---

### 3. Summary Table

| Node Name                     | Node Type                         | Functional Role                            | Input Node(s)                 | Output Node(s)                | Sticky Note                                                                                          |
|-------------------------------|----------------------------------|--------------------------------------------|------------------------------|------------------------------|----------------------------------------------------------------------------------------------------|
| Run every 4 hours              | Schedule Trigger                 | Triggers workflow every 4 hours             | None                         | Set (Fields) — Configure me   | Runs every 4 hours. Starts the forex analysis pipeline                                              |
| Note: Schedule                | Sticky Note                     | Documentation of schedule block              | None                         | None                         | Runs every 4 hours. Starts the forex analysis pipeline                                              |
| Set (Fields) — Configure me   | Set                             | Sets API keys and notification email        | Run every 4 hours            | Fetch USD/JPY rate (HTTP)     |                                                                                                    |
| Note: Fetch rate              | Sticky Note                     | Explains exchange rate fetching              | None                         | None                         | Fetch the latest USD/JPY rate. Uses a free HTTP API                                                |
| Fetch USD/JPY rate (HTTP)     | HTTP Request                   | Retrieves current USD/JPY exchange rate      | Set (Fields) — Configure me   | Analyze USD/JPY (AI agent)    | Fetch the latest USD/JPY rate. Uses a free HTTP API                                                |
| Analyze USD/JPY (AI agent)    | LangChain Agent                | AI analysis of rate + news + recommendation | Fetch USD/JPY rate (HTTP), LLM provider (configure), Tools (Search Forex News, Output Parser) | Send results via Gmail         |                                                                                                    |
| LLM provider (configure)      | LangChain LLM Chat Open Router | Configures AI language model provider        | None                         | Analyze USD/JPY (AI agent)    | Provide your LLM provider credential in this node. Default: small/light model                      |
| Tool: Search Forex News (Tavily) | LangChain HTTP Tool           | Searches Tavily API for forex news            | Called internally by AI agent | Analyze USD/JPY (AI agent)    | USD/JPY（ドル円）に関する最新ニュースを検索                                                      |
| Tool: Structured Output Parser| LangChain Output Parser         | Parses AI output into structured JSON         | Analyze USD/JPY (AI agent) (raw output) | Analyze USD/JPY (AI agent) (final output) |                                                                                                    |
| Note: LLM setup              | Sticky Note                     | Instruction on LLM provider credential setup | None                         | None                         | Provide your LLM provider credential in this node. Default: small/light model                      |
| Send results via Gmail        | Gmail                          | Sends analysis results by email               | Analyze USD/JPY (AI agent)    | None                         | Configure your email credential (Gmail or SMTP). Recipient is controlled via the Set (Fields) node|

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Name: "Run every 4 hours"  
   - Type: Schedule Trigger  
   - Set to trigger every 4 hours (hoursInterval = 4)  

2. **Create a Set node:**  
   - Name: "Set (Fields) — Configure me"  
   - Type: Set  
   - Add two string fields:  
     - `tavilyApiKey`: Set your Tavily API key here.  
     - `notifyEmail`: Set your notification email address here.  
   - Connect "Run every 4 hours" → "Set (Fields) — Configure me"

3. **Create an HTTP Request node:**  
   - Name: "Fetch USD/JPY rate (HTTP)"  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.exchangerate-api.com/v4/latest/USD`  
   - Connect "Set (Fields) — Configure me" → "Fetch USD/JPY rate (HTTP)"

4. **Create LangChain LLM Chat Open Router node:**  
   - Name: "LLM provider (configure)"  
   - Type: LangChain LLM Chat Open Router  
   - Configure your LLM provider credentials here (e.g., OpenAI API key)  
   - No input connections (starts independently)

5. **Create LangChain HTTP Tool node:**  
   - Name: "Tool: Search Forex News (Tavily)"  
   - Type: LangChain HTTP Tool  
   - Method: POST  
   - URL: `https://api.tavily.com/search`  
   - Body (JSON):  
     ```json
     {
       "api_key": "={{ $json.tavilyApiKey }}",
       "query": "{searchTerm}",
       "search_depth": "advanced",
       "include_answer": true,
       "topic": "finance",
       "include_raw_content": true,
       "max_results": 5
     }
     ```  
   - Define placeholder `{searchTerm}` for customizable queries  
   - This node will be called internally by the AI agent

6. **Create LangChain Output Parser Structured node:**  
   - Name: "Tool: Structured Output Parser"  
   - Type: LangChain Output Parser Structured  
   - Define manual JSON schema requiring fields:  
     - recommendation (string)  
     - currentRate (string)  
     - technicalAnalysis (string)  
     - newsAnalysis (string)  
     - reasoning (string)

7. **Create LangChain Agent node:**  
   - Name: "Analyze USD/JPY (AI agent)"  
   - Type: LangChain Agent  
   - Prompt: Japanese text instructing the AI to analyze USD/JPY using the current rate (`{{ $json.rates.JPY }}`), search news with the tool, perform technical analysis, and recommend buy/sell/hold with reasoning  
   - System message: Define role as experienced forex analyst who must use tools  
   - Enable use of tools: assign "Tool: Search Forex News (Tavily)" and "Tool: Structured Output Parser"  
   - Connect inputs:  
     - From "Fetch USD/JPY rate (HTTP)" (main input)  
     - From "LLM provider (configure)" (ai_languageModel)  
     - From "Tool: Search Forex News (Tavily)" (ai_tool)  
     - From "Tool: Structured Output Parser" (ai_outputParser)  

8. **Create Gmail node:**  
   - Name: "Send results via Gmail"  
   - Type: Gmail  
   - Credentials: Configure Gmail OAuth2 or SMTP credentials  
   - Set "Send To": `={{ $json.notifyEmail }}`  
   - Set Subject: "USD/JPY analysis result"  
   - Set Message: `={{ JSON.stringify($json.output) }}` (output from AI agent)  
   - Connect "Analyze USD/JPY (AI agent)" → "Send results via Gmail"

9. **Add Sticky Notes (optional for user clarity):**  
   - Schedule explanation near "Run every 4 hours"  
   - API fetch explanation near "Fetch USD/JPY rate (HTTP)"  
   - LLM setup instructions near "LLM provider (configure)"  
   - Email setup instructions near "Send results via Gmail"

10. **Activate workflow and test:**  
    - Ensure all credentials are valid and API keys set  
    - Test manual trigger or wait for scheduled run  
    - Verify email receipt with structured analysis in Japanese

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                         |
|-------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| The AI agent requires strict use of tools for news retrieval; it must not hallucinate news data. | AI agent system message enforces tool usage             |
| Tavily API key is required for the news search tool to function correctly.                       | https://api.tavily.com                                  |
| The workflow outputs the analysis in Japanese language.                                         | AI agent instructions specify all communication in Japanese |
| Gmail or SMTP credentials must be configured in n8n for email delivery.                         | n8n Gmail node documentation                            |
| Free exchange rate API used: https://api.exchangerate-api.com/v4/latest/USD                      | Public API for forex rates                              |

---

**Disclaimer:**  
The provided content is exclusively derived from an n8n automation workflow. It complies fully with content policies and contains no unlawful, offensive, or protected elements. All processed data is legal and publicly accessible.