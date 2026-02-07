Automate Website Monitoring with GPT-4 Mini, MCP Tools & Multi-channel Alerts

https://n8nworkflows.xyz/workflows/automate-website-monitoring-with-gpt-4-mini--mcp-tools---multi-channel-alerts-6594


# Automate Website Monitoring with GPT-4 Mini, MCP Tools & Multi-channel Alerts

### 1. Workflow Overview

This workflow automates the monitoring of multiple websites by leveraging AI-powered analysis combined with MCP (Modular Control Plane) tools. It performs periodic checks on website performance, security, SSL status, and other critical parameters, then categorizes issues by severity and sends multi-channel alerts (Slack and email). It also logs all monitoring results to Google Sheets for historical tracking and review.

**Target Use Cases:**  
- Continuous monitoring of critical websites for uptime, performance, and security  
- Automated detection of issues with actionable severity levels (critical, warning, info)  
- Alerting relevant teams via Slack and email when problems arise  
- Centralized logging of monitoring data for audit and trend analysis  

**Logical Blocks:**  
- **1.1 Input Reception & Configuration:** Scheduling trigger, loading website list from Google Sheets or default list, configuration variables for thresholds and notification settings  
- **1.2 Website Analysis:** Batching URLs, invoking AI agent with MCP tools to analyze websites’ performance, SSL, and security, OpenAI GPT-4 Mini model integration  
- **1.3 Results Aggregation & Routing:** Combining analysis results, routing alerts by severity levels  
- **1.4 Notifications:** Sending alerts via Slack and email based on severity  
- **1.5 Logging:** Appending analysis results to Google Sheets for record keeping  
- **1.6 Documentation & Instructions:** Sticky notes providing setup instructions and references  

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Configuration

**Overview:** This block triggers the workflow on schedule, loads configuration variables, and fetches the list of websites to monitor from Google Sheets or falls back to a default list.

**Nodes Involved:**  
- Website Monitor Trigger  
- Configuration Variables  
- Load Website List  
- Check Website Source  
- Format Default Websites  
- Batch Website URLs  

**Node Details:**

- **Website Monitor Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow periodically based on a configurable interval (minutes)  
  - Configuration: Default interval set to run every X minutes (user-defined)  
  - Inputs: None (trigger)  
  - Outputs: Configuration Variables node  
  - Edge Cases: Trigger misfires, scheduling misconfiguration  

- **Configuration Variables**  
  - Type: Set  
  - Role: Defines key environment-driven settings such as website list defaults, MCP server URLs, monitoring thresholds, and notification parameters  
  - Configuration: Object variable named `config` with nested keys for websites, MCP URLs, monitoring thresholds (batch size, response time warnings, SSL expiry warnings), and notifications (email/slack settings)  
  - Inputs: Website Monitor Trigger  
  - Outputs: Load Website List  
  - Edge Cases: Missing or invalid environment variables, misconfigured URLs or emails  

- **Load Website List**  
  - Type: Google Sheets  
  - Role: Retrieves the list of websites to monitor from the “Websites” sheet in a Google Sheet document  
  - Configuration: Reads sheet named "Websites" using service account authentication, document ID from environment variable  
  - Inputs: Configuration Variables  
  - Outputs: Check Website Source  
  - Edge Cases: Sheet missing, invalid document ID, permission errors on Google Sheets API  

- **Check Website Source**  
  - Type: If  
  - Role: Determines if the website list from Google Sheets is empty; if so, fallback to default websites specified in configuration  
  - Configuration: Checks if the JSON from Load Website List is empty  
  - Inputs: Load Website List  
  - Outputs:  
    - True (empty): Format Default Websites  
    - False (not empty): Batch Website URLs  
  - Edge Cases: Empty or malformed data from Google Sheets  

- **Format Default Websites**  
  - Type: Set  
  - Role: Converts the default website URLs array into individual items with a `url` field for downstream processing  
  - Configuration: Maps each website URL string into an object with `url` property  
  - Inputs: Check Website Source (True branch)  
  - Outputs: Batch Website URLs  
  - Edge Cases: Empty default list, invalid URL format  

- **Batch Website URLs**  
  - Type: SplitInBatches  
  - Role: Splits the list of URLs into batches for efficient parallel processing  
  - Configuration: Batch size from configuration variable (default 10)  
  - Inputs: Format Default Websites or Check Website Source (False branch)  
  - Outputs: Website Analysis Agent (main output), Combine Analysis Results (second output)  
  - Edge Cases: Batch size misconfiguration, very large lists causing delays or timeouts  

---

#### 1.2 Website Analysis

**Overview:** Runs the AI-powered analysis agent that uses MCP tools to evaluate websites for performance, security, and SSL status. This includes invoking browser-tools-mcp and mcp-recon endpoints and processing the data with GPT-4 Mini.

**Nodes Involved:**  
- Website Analysis Agent  
- Browser-Tools-MCP  
- mcp-recon  
- OpenAI Chat Model  

**Node Details:**

- **Website Analysis Agent**  
  - Type: LangChain Agent (AI agent node)  
  - Role: Orchestrates AI analysis by feeding website URLs through MCP tools and interpreting results based on configured thresholds  
  - Configuration:  
    - Prompt instructs the agent to analyze each website with MCP tools (browser-tools-mcp for performance and SEO, mcp-recon for SSL and security)  
    - Defines severity criteria (critical, warning, info) based on response time, SSL expiry, performance score, and security headers  
    - Output format is a JSON object with fields: url, severity, performanceScore, responseTime, sslStatus, securityScore, issues, recommendations  
  - Inputs: Batch Website URLs  
  - Outputs: Combine Analysis Results  
  - Connections: Uses Browser-Tools-MCP and mcp-recon as `ai_tool`; OpenAI Chat Model as `ai_languageModel`  
  - Edge Cases: AI model failure, MCP server unreachable, malformed output, timeout, API rate limits  

- **Browser-Tools-MCP**  
  - Type: MCP Client Tool  
  - Role: Connects to browser-tools-mcp server to analyze website performance, SEO, and accessibility  
  - Configuration: SSE endpoint URL (default http://localhost:8001 or from env var)  
  - Inputs: Website Analysis Agent (ai_tool input)  
  - Outputs: Website Analysis Agent  
  - Edge Cases: Server offline, network errors, malformed responses  

- **mcp-recon**  
  - Type: MCP Client Tool  
  - Role: Connects to mcp-recon server to check SSL certificates, security headers, domain info  
  - Configuration: SSE endpoint URL (default http://localhost:8002 or from env var)  
  - Inputs: Website Analysis Agent (ai_tool input)  
  - Outputs: Website Analysis Agent  
  - Edge Cases: Server offline, network errors, malformed responses  

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Uses GPT-4 Mini model to process and synthesize analysis data and generate final structured output  
  - Configuration: Model set to "gpt-4.1-mini", credentials via OpenAI API key  
  - Inputs: Website Analysis Agent (ai_languageModel input)  
  - Outputs: Website Analysis Agent  
  - Edge Cases: API quota exceeded, invalid API key, network timeout  

---

#### 1.3 Results Aggregation & Routing

**Overview:** Aggregates individual batch results into a single combined dataset and routes each website’s issue report to appropriate alert channels based on severity.

**Nodes Involved:**  
- Combine Analysis Results  
- Alert Severity Router  

**Node Details:**

- **Combine Analysis Results**  
  - Type: Merge  
  - Role: Combines all batch outputs from Website Analysis Agent into one consolidated list for downstream processing  
  - Configuration: Mode set to combine all inputs (combineAll)  
  - Inputs: Website Analysis Agent (main output batches)  
  - Outputs: Alert Severity Router  
  - Edge Cases: Missing batches, partial data, out-of-order results  

- **Alert Severity Router**  
  - Type: Switch  
  - Role: Routes each combined analysis item according to `severity` field: critical, warning, or info  
  - Configuration: Three rules checking if severity equals "critical", "warning", or "info" (case-sensitive, strict)  
  - Inputs: Combine Analysis Results  
  - Outputs:  
    - Critical: Critical Slack Alert, Critical Email Alert, Log to Google Sheets  
    - Warning: Warning Slack Alert, Log to Google Sheets  
    - Info: Log to Google Sheets only  
  - Edge Cases: Unexpected severity values, missing severity, case mismatches  

---

#### 1.4 Notifications

**Overview:** Sends alerts to Slack channels and email recipients for critical and warning issues, while info-level issues are logged only.

**Nodes Involved:**  
- Critical Slack Alert  
- Critical Email Alert  
- Warning Slack Alert  

**Node Details:**

- **Critical Slack Alert**  
  - Type: Slack  
  - Role: Posts detailed critical alerts to configured Slack channel  
  - Configuration:  
    - Uses Slack webhook with channel name from configuration variables  
    - Message includes website URL, severity (critical), performance score, response time, SSL status, list of issues, security score  
  - Inputs: Alert Severity Router (critical output)  
  - Outputs: None (terminal)  
  - Edge Cases: Slack webhook failure, invalid channel, rate limits  

- **Critical Email Alert**  
  - Type: Email Send  
  - Role: Sends formatted HTML email for critical issues to alert recipient  
  - Configuration:  
    - Subject includes website URL and critical alert  
    - HTML body summarizes issues, performance metrics, SSL and security scores  
    - To and From addresses from configuration variables  
  - Inputs: Alert Severity Router (critical output)  
  - Outputs: None (terminal)  
  - Edge Cases: SMTP failure, invalid email addresses, email throttling  

- **Warning Slack Alert**  
  - Type: Slack  
  - Role: Posts warning alerts to Slack channel with less severity than critical  
  - Configuration: Similar to Critical Slack Alert but message differs to reflect warning severity  
  - Inputs: Alert Severity Router (warning output)  
  - Outputs: None (terminal)  
  - Edge Cases: Same as Critical Slack Alert  

---

#### 1.5 Logging

**Overview:** Records all monitoring results (critical, warning, info) into a Google Sheets “Monitoring Log” for historical tracking.

**Nodes Involved:**  
- Log to Google Sheets  

**Node Details:**

- **Log to Google Sheets**  
  - Type: Google Sheets  
  - Role: Appends monitoring data rows to “Monitoring Log” sheet with detailed fields  
  - Configuration:  
    - Columns mapped: url, issues (joined string), severity, sslStatus, timestamp (ISO string), responseTime, securityScore, recommendations (joined string), performanceScore  
    - Authentication via service account  
    - Document ID from environment variable  
  - Inputs: Alert Severity Router (all outputs)  
  - Outputs: None (terminal)  
  - Edge Cases: Permission errors, sheet not found, API limits  

---

#### 1.6 Documentation & Instructions

**Overview:** Sticky notes provide users with setup instructions, references for MCP servers, Google Sheets setup, and environment variable configuration.

**Nodes Involved:**  
- Sticky Note1  
- Sticky Note2  
- Sticky Note3  

**Node Details:**

- **Sticky Note1**  
  - Content: Details on Google Sheets configuration including required sheet names, headers, and service account permissions  
  - Position: Near logging nodes for context  
- **Sticky Note2**  
  - Content: High-level overview and setup instructions for the entire AI monitoring system including MCP server installation, Google Sheets setup, notification configuration, and testing  
  - Position: Top-left corner for global overview  
- **Sticky Note3**  
  - Content: Detailed instructions for installing required MCP servers with links to GitHub repositories and docs  
  - Position: Top-left near configuration nodes  

---

### 3. Summary Table

| Node Name               | Node Type                         | Functional Role                                  | Input Node(s)            | Output Node(s)                           | Sticky Note                                                                                             |
|-------------------------|----------------------------------|-------------------------------------------------|--------------------------|-----------------------------------------|-------------------------------------------------------------------------------------------------------|
| Website Monitor Trigger  | Schedule Trigger                 | Periodic workflow trigger                        | None                     | Configuration Variables                 | 🛠️ AI-Powered Website Monitoring System overview and setup (Sticky Note2)                              |
| Configuration Variables | Set                              | Load environment and config variables           | Website Monitor Trigger  | Load Website List                      | 🛠️ AI-Powered Website Monitoring System overview and setup (Sticky Note2)                              |
| Load Website List        | Google Sheets                    | Fetch websites list from Google Sheets           | Configuration Variables  | Check Website Source                   | 🧰 Google Sheets config details (Sticky Note1)                                                        |
| Check Website Source     | If                               | Determine if website list from Sheets is empty  | Load Website List        | Format Default Websites, Batch Website URLs |                                                                                                       |
| Format Default Websites  | Set                              | Format default URLs if no Sheets data            | Check Website Source     | Batch Website URLs                      |                                                                                                       |
| Batch Website URLs       | SplitInBatches                   | Split URLs into batches for processing           | Format Default Websites, Check Website Source | Website Analysis Agent, Combine Analysis Results |                                                                                                       |
| Website Analysis Agent   | LangChain Agent                  | AI analysis using MCP tools and GPT-4 Mini       | Batch Website URLs       | Combine Analysis Results               |                                                                                                       |
| Browser-Tools-MCP        | MCP Client Tool                  | Performance, SEO, accessibility analysis         | Website Analysis Agent   | Website Analysis Agent                 | 🛠️ MCP server installation instructions (Sticky Note3)                                               |
| mcp-recon               | MCP Client Tool                  | SSL and security header analysis                  | Website Analysis Agent   | Website Analysis Agent                 | 🛠️ MCP server installation instructions (Sticky Note3)                                               |
| OpenAI Chat Model        | LangChain OpenAI Chat Model      | GPT-4 Mini model for AI synthesis                 | Website Analysis Agent   | Website Analysis Agent                 |                                                                                                       |
| Combine Analysis Results | Merge                           | Combine batch analysis results                     | Website Analysis Agent   | Alert Severity Router                  |                                                                                                       |
| Alert Severity Router    | Switch                          | Route alerts based on severity                     | Combine Analysis Results | Critical Slack Alert, Critical Email Alert, Warning Slack Alert, Log to Google Sheets |                                                                                                       |
| Critical Slack Alert     | Slack                           | Send critical severity alerts to Slack channel    | Alert Severity Router    | None                                  |                                                                                                       |
| Critical Email Alert     | Email Send                      | Send critical severity alerts via email           | Alert Severity Router    | None                                  |                                                                                                       |
| Warning Slack Alert      | Slack                           | Send warning severity alerts to Slack channel     | Alert Severity Router    | None                                  |                                                                                                       |
| Log to Google Sheets     | Google Sheets                   | Append monitoring logs to Google Sheets            | Alert Severity Router    | None                                  | 🧰 Google Sheets config details (Sticky Note1)                                                        |
| Sticky Note1             | Sticky Note                    | Google Sheets configuration instructions          | None                     | None                                  | See content in Documentation & Instructions (Section 1.6)                                            |
| Sticky Note2             | Sticky Note                    | Overall workflow setup and instructions            | None                     | None                                  | See content in Documentation & Instructions (Section 1.6)                                            |
| Sticky Note3             | Sticky Note                    | MCP server installation instructions               | None                     | None                                  | See content in Documentation & Instructions (Section 1.6)                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node** named “Website Monitor Trigger”:  
   - Set interval to run every X minutes (customizable).

2. **Add a Set node** named “Configuration Variables”:  
   - Create one object variable `config` with keys:  
     - `websites`: default array of website URLs (e.g., ["https://example.com","https://example.org"])  
     - `mcpServers`: URLs for MCP servers, default to env vars or localhost (`MCP_RECON_URL`, `MCP_BROWSER_TOOLS_URL`)  
     - `monitoring`: thresholds like `batchSize` (10), `responseTimeWarning` (3000 ms), `responseTimeCritical` (5000 ms), `sslExpiryWarningDays` (30), `performanceScoreThreshold` (80)  
     - `notifications`: email and Slack settings with emails and Slack channel names from env vars (`FROM_EMAIL`, `ALERT_EMAIL`, `SLACK_CHANNEL`) including enable flags

3. **Add a Google Sheets node** “Load Website List”:  
   - Configure to read from "Websites" sheet in the Google Sheet doc referenced by the environment variable `GOOGLE_SHEET_ID`  
   - Authenticate using a Service Account with Editor permissions  
   - Set to continue on error to handle missing/empty sheets gracefully

4. **Add an If node** “Check Website Source”:  
   - Condition: Check if the output from “Load Website List” is empty  
   - True branch (empty): proceed to “Format Default Websites”  
   - False branch: proceed to “Batch Website URLs”

5. **Add a Set node** “Format Default Websites”:  
   - Map each website URL string in the default list to an object with a `url` property (for downstream uniformity)

6. **Add a SplitInBatches node** “Batch Website URLs”:  
   - Set batch size from `config.monitoring.batchSize` (default 10)  
   - Inputs from both “Format Default Websites” (True branch) and “Check Website Source” (False branch)

7. **Add a LangChain Agent node** “Website Analysis Agent”:  
   - Configure prompt to analyze websites using MCP tools with instructions:  
     - Use browser-tools-mcp and mcp-recon tools for performance, SEO, SSL, and security analysis  
     - Define severity levels based on thresholds in configuration variables  
     - Return structured JSON results for each website  
   - Set AI tools:  
     - MCP Client Tool nodes for Browser-Tools-MCP and mcp-recon with SSE endpoints configured  
   - Set AI language model to OpenAI GPT-4 Mini with appropriate credentials

8. **Add MCP Client Tool nodes**:  
   - “Browser-Tools-MCP”: SSE endpoint from `MCP_BROWSER_TOOLS_URL` env var or default localhost:8001  
   - “mcp-recon”: SSE endpoint from `MCP_RECON_URL` env var or default localhost:8002

9. **Add a LangChain OpenAI Chat Model node**:  
   - Model: gpt-4.1-mini  
   - Credentials: OpenAI API key configured

10. **Connect “Website Analysis Agent” output to a Merge node** “Combine Analysis Results”:  
    - Mode: combine all inputs  
    - Purpose: aggregate batch results

11. **Add a Switch node** “Alert Severity Router”:  
    - Route on field `severity` with three cases: “critical”, “warning”, “info”  
    - Connect outputs accordingly

12. **Add Slack nodes** for alerts:  
    - “Critical Slack Alert”: sends critical alerts to Slack channel from configuration variables using webhook  
    - “Warning Slack Alert”: sends warning alerts similarly

13. **Add Email Send node** “Critical Email Alert”:  
    - Send HTML email for critical alerts  
    - Use fromEmail and alertEmail from configuration variables

14. **Add Google Sheets node** “Log to Google Sheets”:  
    - Append rows to “Monitoring Log” sheet with columns: timestamp, url, severity, performanceScore, responseTime, sslStatus, securityScore, issues, recommendations  
    - Authenticate with same Google Service Account

15. **Add Sticky Note nodes** for documentation:  
    - One with Google Sheets setup details  
    - One with overall workflow instructions and environment variable information  
    - One with MCP server installation instructions and links  

16. **Wire nodes following the logical flow:**  
    - Website Monitor Trigger → Configuration Variables → Load Website List → Check Website Source → (Format Default Websites or Batch Website URLs) → Website Analysis Agent → Combine Analysis Results → Alert Severity Router → (Slack Alerts, Email Alert, Log to Google Sheets)

17. **Credentials Setup:**  
    - Google Sheets: Service Account with Editor access  
    - OpenAI: API key with GPT-4 Mini access  
    - Slack: Webhook URL or configured Slack node credentials  
    - Email: SMTP credentials for sending email alerts  

18. **Environment Variables:**  
    - `MCP_RECON_URL` and `MCP_BROWSER_TOOLS_URL` for MCP endpoints  
    - `GOOGLE_SHEET_ID` for target spreadsheet  
    - `FROM_EMAIL` and `ALERT_EMAIL` for email notifications  
    - `SLACK_CHANNEL` for Slack alerts  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| 🛠️ AI-Powered Website Monitoring System: Step-by-step instructions on installing MCP servers, setting up Google Sheets, configuring notifications, and testing workflow       | Provided in Sticky Note2                                                                           |
| 🔧 Required MCP Servers: Browser Tools MCP and MCP Recon with GitHub repos and installation guides                                                                           | [Browser Tools MCP GitHub](https://github.com/AgentDeskAI/browser-tools-mcp)                       |
|                                                                                                                                                                             | [Browser Tools Docs](https://browsertools.agentdesk.ai/installation)                               |
|                                                                                                                                                                             | [MCP Recon GitHub](https://github.com/nickpending/mcp-recon)                                       |
| 📊 Google Sheets Configuration: Required sheet names and headers, service account permissions for Sheets integration                                                        | Provided in Sticky Note1                                                                           |
| Environment variables usage for dynamic configuration of endpoints, emails, Slack channels, and Google Sheets document ID                                                  | Workflow uses environment variables throughout for flexibility                                      |
| AI Model used: GPT-4 Mini variant (gpt-4.1-mini) for advanced natural language processing and synthesis of monitoring data                                                | Requires OpenAI API key with access to GPT-4 Mini                                                  |

---

This documentation enables full understanding, deployment, and modification of the “Automate Website Monitoring with GPT-4 Mini, MCP Tools & Multi-channel Alerts” workflow. It highlights key configuration points, integration details, and the logical flow within n8n.