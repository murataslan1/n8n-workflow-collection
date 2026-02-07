Automate Weekly Marketing Reports with GoMarble MCP, Claude AI & Gmail

https://n8nworkflows.xyz/workflows/automate-weekly-marketing-reports-with-gomarble-mcp--claude-ai---gmail-6420


# Automate Weekly Marketing Reports with GoMarble MCP, Claude AI & Gmail

### 1. Workflow Overview

This workflow automates the generation and emailing of a weekly marketing performance report for a client using the GoMarble MCP platform, AI language models (Claude AI and OpenAI GPT), and Gmail. Its primary use case is to provide a concise, insight-driven digest of key marketing metrics and recommendations every Monday morning, enabling busy CMOs or marketing managers to review and act quickly.

The workflow is logically organized into these blocks:

- **1.1 Scheduled Trigger & Prompt Setup**: Weekly trigger to initiate the report generation process and create a customized report prompt.
- **1.2 Data Retrieval from GoMarble MCP**: Connects to the GoMarble MCP platform to fetch the raw marketing data.
- **1.3 AI-Powered Report Generation**: Uses Claude AI to analyze data and draft a textual report, then OpenAI GPT to convert that text into styled HTML formatted for email.
- **1.4 Email Dispatch**: Sends the formatted report via Gmail to the designated recipient.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Prompt Setup

**Overview:**  
This block initiates the workflow every Monday at 8 AM and prepares the detailed text prompt that guides the AI in generating the marketing report content.

**Nodes Involved:**  
- Schedule Trigger  
- Report Prompt

**Node Details:**  

- **Schedule Trigger**  
  - *Type:* Schedule Trigger node  
  - *Role:* Automatically triggers the workflow weekly on Mondays at 8 AM.  
  - *Configuration:* Interval set to weekly on day 1 (Monday) at hour 8.  
  - *Input/Output:* No input; outputs trigger signal to Report Prompt.  
  - *Failures:* Possible failure if n8n instance is down at trigger time or timezone misconfiguration.  
  - *Notes:* User can adjust schedule as needed.

- **Report Prompt**  
  - *Type:* Set node  
  - *Role:* Defines a detailed string prompt for the AI agent to generate the marketing report text.  
  - *Configuration:*  
    - Assigns a complex multi-paragraph string to `report prompt` variable.  
    - The prompt specifies voice, goal, data sources, report structure (executive snapshot, KPI tables, recommendations), and formatting instructions.  
  - *Expressions:* Uses direct string assignment with embedded variables for account name and time period placeholders (`[YOUR_ACCOUNT_NAME]`).  
  - *Input/Output:* Input from Schedule Trigger; output passes the `report prompt` to the AI Agent node.  
  - *Edge cases:* Errors if string is malformed or missing required placeholders.

---

#### 1.2 Data Retrieval from GoMarble MCP

**Overview:**  
This block connects to the GoMarble MCP API to stream marketing data based on the prompt and feeds it into the AI processing node.

**Nodes Involved:**  
- MCP Client

**Node Details:**  

- **MCP Client**  
  - *Type:* Langchain MCP Client Tool node  
  - *Role:* Connects to GoMarble MCP API via SSE (Server-Sent Events) to retrieve marketing campaign data.  
  - *Configuration:*  
    - `sseEndpoint` set to GoMarble MCP API URL.  
    - Uses Bearer token authentication; requires user to add their GoMarble Bearer token in node settings.  
  - *Input/Output:* Receives AI tool input from Report Prompt output; outputs to AI Agent node.  
  - *Failures:* Authentication errors if token is invalid or missing; network timeouts; API changes may break integration.  
  - *Notes:* User must obtain token from GoMarble docs.

---

#### 1.3 AI-Powered Report Generation

**Overview:**  
This block processes the raw data to generate a textual weekly report using Claude AI, then formats that report into branded HTML using OpenAI GPT.

**Nodes Involved:**  
- AI Agent  
- Anthropic Chat Model  
- OpenAI Chat Model  
- Basic LLM Chain1

**Node Details:**  

- **AI Agent**  
  - *Type:* Langchain Agent node  
  - *Role:* Main orchestrator AI node that uses Anthropic Claude model to generate the core textual report from prompt and data.  
  - *Configuration:*  
    - Input text is the `report prompt` from the Set node.  
    - System message instructs the agent to act as a senior digital marketing professional preparing an email without hallucinations.  
  - *Input/Output:* Receives prompt from Report Prompt node and MCP Client data stream; outputs raw report text to Basic LLM Chain1.  
  - *Failures:* Possible AI hallucinations if prompt unclear; API rate limits; model changes may affect output quality.

- **Anthropic Chat Model**  
  - *Type:* Langchain Chat Model (Anthropic Claude)  
  - *Role:* Provides the language model backend for the AI Agent node.  
  - *Configuration:* Model set to "claude-sonnet-4-20250514".  
  - *Credentials:* Requires Anthropic API key configured in node settings.  
  - *Input/Output:* Connected as AI language model to AI Agent node.  
  - *Failures:* Auth errors, API downtime, quota limits.

- **OpenAI Chat Model**  
  - *Type:* Langchain Chat Model (OpenAI GPT)  
  - *Role:* Provides the language model backend for final HTML formatting of the report text.  
  - *Configuration:* Model set to "chatgpt-4o-latest".  
  - *Credentials:* Requires OpenAI API key configured in node settings.  
  - *Input/Output:* Connected as AI language model to Basic LLM Chain1 node.  
  - *Failures:* Auth errors, API quota, response timeouts.

- **Basic LLM Chain1**  
  - *Type:* Langchain LLM Chain node  
  - *Role:* Converts raw textual report into branded HTML email content.  
  - *Configuration:*  
    - Contains detailed design and style guidelines consistent with GoMarble brand colors, fonts, and layout rules.  
    - Input text is the output from AI Agent (raw report text).  
    - Output is styled HTML suitable for direct email insertion.  
  - *Input/Output:* Inputs from AI Agent output; outputs final HTML to Gmail node.  
  - *Failures:* Formatting errors if input text is malformed; API errors from OpenAI.

---

#### 1.4 Email Dispatch

**Overview:**  
This block sends the formatted HTML report via Gmail to the client.

**Nodes Involved:**  
- Gmail

**Node Details:**  

- **Gmail**  
  - *Type:* Gmail node (n8n core node)  
  - *Role:* Sends the marketing report email.  
  - *Configuration:*  
    - Sends email with subject "Weekly platform analysis report".  
    - Recipient email address must be configured by the user.  
    - Email body is the HTML formatted report from Basic LLM Chain1 node.  
  - *Credentials:* Requires Gmail OAuth2 credentials configured in n8n.  
  - *Input/Output:* Input from Basic LLM Chain1; no output (end node).  
  - *Failures:* Authentication issues, rate limits, email send failures (invalid recipient, quota exceeded).

---

### 3. Summary Table

| Node Name          | Node Type                                | Functional Role                         | Input Node(s)         | Output Node(s)       | Sticky Note                                                                                      |
|--------------------|----------------------------------------|---------------------------------------|-----------------------|----------------------|------------------------------------------------------------------------------------------------|
| Schedule Trigger    | Schedule Trigger                       | Initiates workflow weekly             | —                     | Report Prompt         | ⏰ Runs every Monday at 8 AM - adjust schedule as needed                                         |
| Report Prompt      | Set                                    | Defines AI prompt for report generation | Schedule Trigger       | AI Agent              | 📝 Customize the report prompt for your specific account and requirements                        |
| MCP Client         | Langchain MCP Client Tool               | Fetches marketing data from GoMarble MCP API | AI Agent (ai_tool)     | AI Agent              | 🔐 Add your GoMarble Bearer token - get it from https://www.gomarble.ai/docs/connect-to-n8n     |
| AI Agent           | Langchain Agent                        | Generates raw textual report           | Report Prompt, MCP Client | Basic LLM Chain1      |                                                                                                |
| Anthropic Chat Model | Langchain Chat Model (Anthropic Claude) | AI model backend for AI Agent          | —                     | AI Agent              | 🔑 Add your Anthropic API credentials in the node settings                                      |
| OpenAI Chat Model  | Langchain Chat Model (OpenAI GPT)       | AI model backend for HTML formatting   | —                     | Basic LLM Chain1      | 🤖 Configure your OpenAI API credentials for HTML formatting                                   |
| Basic LLM Chain1   | Langchain LLM Chain                   | Converts report text to branded HTML   | AI Agent               | Gmail                 |                                                                                                |
| Gmail              | Gmail node                            | Sends formatted report email           | Basic LLM Chain1       | —                    | 📧 Configure your Gmail credentials and set the recipient email address                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Parameters: Set to trigger weekly every Monday at 8 AM.  
   - Connect output to "Report Prompt" node.

2. **Create Set node named "Report Prompt"**  
   - Type: Set  
   - Parameters:  
     - Add a string field named `report prompt`.  
     - Paste the detailed report prompt text specifying voice, goal, data source, and report sections (see overview).  
   - Connect input from Schedule Trigger.  
   - Connect output to "AI Agent" node.

3. **Create MCP Client node**  
   - Type: Langchain MCP Client Tool  
   - Parameters:  
     - SSE endpoint: `https://apps.gomarble.ai/mcp-api/sse`  
     - Authentication: Bearer Token (user must configure token in credentials)  
   - Connect input from AI Agent's `ai_tool` input.  
   - Connect output to AI Agent's `ai_tool` output.

4. **Create Anthropic Chat Model node**  
   - Type: Langchain Chat Model  
   - Parameters:  
     - Model: `claude-sonnet-4-20250514`  
   - Configure Anthropic API credentials in node settings.

5. **Create AI Agent node**  
   - Type: Langchain Agent  
   - Parameters:  
     - Text input: `={{ $json['report prompt'] }}`  
     - System message: "You are a senior digital marketing professional preparing an email to be sent to the client. There should be no made up data or hallucination."  
     - Prompt type: Define  
   - Connect input from "Report Prompt" node main output and MCP Client node `ai_tool` output.  
   - Connect Anthropic Chat Model node as AI language model backend.  
   - Connect output to "Basic LLM Chain1" node.

6. **Create OpenAI Chat Model node**  
   - Type: Langchain Chat Model  
   - Parameters:  
     - Model: `chatgpt-4o-latest`  
   - Configure OpenAI API credentials in node settings.

7. **Create Basic LLM Chain1 node**  
   - Type: Langchain LLM Chain  
   - Parameters:  
     - Text prompt with detailed instructions to convert input text to clean, branded HTML email using GoMarble design guidelines (colors, fonts, layout).  
     - Input text is `={{ $json['output'] }}` from AI Agent node.  
   - Connect OpenAI Chat Model as AI language model backend.  
   - Connect input from AI Agent output.  
   - Connect output to Gmail node.

8. **Create Gmail node**  
   - Type: Gmail  
   - Parameters:  
     - Recipient email address (user to configure)  
     - Subject: "Weekly platform analysis report"  
     - Message body: `={{ $json.text }}` (HTML formatted report)  
   - Configure Gmail OAuth2 credentials in n8n.  
   - Connect input from Basic LLM Chain1 node.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                               |
|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| GoMarble Bearer token required for MCP Client; see https://www.gomarble.ai/docs/connect-to-n8n  | GoMarble MCP API documentation                                |
| Anthropic API key needed for Claude model (Anthropic Chat Model node)                            | Anthropic API portal                                           |
| OpenAI API key required for OpenAI Chat Model node                                             | OpenAI developer platform                                     |
| Gmail node requires OAuth2 credential setup and recipient email configuration                    | Gmail API and n8n Gmail node documentation                    |
| The report prompt is highly customizable to match client-specific needs and account names       | Adapt prompt in Set node "Report Prompt"                      |
| Styling instructions in Basic LLM Chain1 ensure brand consistency and email client compatibility | Inline CSS only, no <head> tags, suitable for direct email use|

---

**Disclaimer:** The provided text is generated solely from an automated n8n workflow. It adheres strictly to current content policies and contains no illegal, offensive, or protected material. All data processed is legal and public.