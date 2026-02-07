AI-Powered Workflow Error Analysis & Fix Suggestions with Gemini 2.5 Pro

https://n8nworkflows.xyz/workflows/ai-powered-workflow-error-analysis---fix-suggestions-with-gemini-2-5-pro-9375


# AI-Powered Workflow Error Analysis & Fix Suggestions with Gemini 2.5 Pro

### 1. Workflow Overview

This workflow provides an automated, AI-powered error detection and debugging assistant for n8n workflows. It is designed for n8n users who want rapid root cause analysis and actionable fix suggestions whenever any workflow in their n8n instance fails. Instead of manually inspecting error logs, users receive detailed emails containing the error context, AI-driven root cause diagnostics, and step-by-step remediation instructions.

The workflow is logically split into three main blocks:

- **1.1 Error Capture and Context Retrieval**  
  Detects any workflow error event and fetches the full JSON definition of the failing workflow for context.

- **1.2 AI-Powered Root Cause Analysis**  
  Sends the error details along with the full workflow JSON to a Gemini 2.5 Pro AI language model agent which generates a markdown report containing root cause analysis and suggested fixes.

- **1.3 Formatting and Notification**  
  Converts the AI-generated markdown into HTML and emails the formatted report plus error and execution details to a specified email address.

---

### 2. Block-by-Block Analysis

#### 2.1 Error Capture and Context Retrieval

**Overview:**  
This block listens for any workflow failure in the n8n instance and retrieves the complete JSON definition of the failed workflow via the n8n API. This context is critical for the AI to understand the workflow structure and node configurations.

**Nodes Involved:**  
- Error Trigger  
- Get Workflow JSON

**Node Details:**

- **Error Trigger**  
  - *Type:* Error Trigger node  
  - *Role:* Entry point that activates on any workflow failure within the n8n instance.  
  - *Configuration:* Default settings, no parameters needed. Triggers with error payload including workflow and execution metadata.  
  - *Input:* No input (event-driven).  
  - *Output:* Emits error information including workflow id, error node name/type, error message.  
  - *Failures:* None expected; built-in trigger node.  
  - *Notes:* Must be enabled on n8n instance level to catch errors.

- **Get Workflow JSON**  
  - *Type:* HTTP Request node  
  - *Role:* Fetches the full JSON structure of the failed workflow using n8n REST API.  
  - *Configuration:*  
    - URL dynamically built from environment variable `N8N_EDITOR_BASE_URL` and the failed workflow’s id extracted from error trigger JSON.  
    - Uses HTTP Header Authentication with a generic credential containing an API key (`X-N8N-API-KEY`).  
    - Response format set to JSON.  
  - *Input:* JSON from Error Trigger node (contains workflow.id).  
  - *Output:* Full JSON data of the failed workflow.  
  - *Failures:*  
    - 401 Unauthorized if API key incorrect or missing.  
    - 404 if workflow id invalid.  
    - Timeout or network errors.  
  - *Setup:* Requires creating an API key under n8n Settings > API and configuring a generic credential with that key in HTTP headers.

---

#### 2.2 AI-Powered Root Cause Analysis

**Overview:**  
This block composes a detailed prompt combining error details and full workflow JSON, then sends it to the Gemini 2.5 Pro model via the OpenRouter Chat integration. The AI produces a markdown report with root cause analysis and suggested fixes.

**Nodes Involved:**  
- Gemini 2.5 Pro  
- Debugger Agent

**Node Details:**

- **Gemini 2.5 Pro**  
  - *Type:* OpenRouter Chat Model node (LangChain)  
  - *Role:* Provides AI model interface using Google Gemini 2.5 Pro through OpenRouter API.  
  - *Configuration:*  
    - Model set to "google/gemini-2.5-pro".  
    - Credentials: OpenRouter API key configured.  
  - *Input:* Triggered by workflow, passes input to Debugger Agent node.  
  - *Output:* AI-generated textual response (markdown).  
  - *Failures:*  
    - Authentication failure if API key invalid.  
    - Rate limits or quota exceeded errors.  
    - Network/timeouts.  

- **Debugger Agent**  
  - *Type:* LangChain Agent node specialized for n8n debugging  
  - *Role:* Constructs prompt text and system instructions, sends input and workflow JSON to AI model.  
  - *Configuration:*  
    - Text input dynamically assembled with error details (workflow name, failed node name/type, error message) and full workflow JSON stringified.  
    - System message instructs AI to act as expert n8n developer and debugger, focusing on direct, actionable analysis in markdown format.  
  - *Input:* Receives JSON from Get Workflow JSON and Error Trigger nodes.  
  - *Output:* AI response with root cause and fix suggestions in markdown.  
  - *Failures:* Expression syntax errors if JSON data missing or malformed; partial or incomplete AI response if model times out or errors.  
  - *Notes:* The agent node uses the output of Gemini 2.5 Pro as its AI language model engine.

---

#### 2.3 Formatting and Notification

**Overview:**  
This block converts the AI markdown output into HTML and sends a formatted email notification containing the error context and AI analysis to a configured recipient.

**Nodes Involved:**  
- Convert Markdown To HTML  
- Send Debugging Email

**Node Details:**

- **Convert Markdown To HTML**  
  - *Type:* Markdown node (built-in)  
  - *Role:* Converts AI markdown output to HTML for email rendering.  
  - *Configuration:*  
    - Mode set to "markdownToHtml".  
    - Markdown input taken from the AI output key `output`.  
    - HTML stored in output key `responseHtml`.  
  - *Input:* Output from Debugger Agent node.  
  - *Output:* HTML-formatted AI analysis.  
  - *Failures:* Invalid markdown input could cause conversion errors (rare).  

- **Send Debugging Email**  
  - *Type:* Gmail node  
  - *Role:* Sends email notification with error and AI analysis details.  
  - *Configuration:*  
    - Recipient email set in `sendTo` parameter (must be replaced with actual email).  
    - Email subject dynamically includes failing workflow name.  
    - HTML email body includes direct link to failed execution, error details, and AI debugging assistant response (in HTML).  
    - Credentials: OAuth2 Gmail account configured.  
  - *Input:* Receives HTML content from Convert Markdown To HTML node.  
  - *Output:* Email sent confirmation.  
  - *Failures:*  
    - Authentication errors if Gmail OAuth token expired or invalid.  
    - Quota limits on Gmail API usage.  
    - Network issues.  
  - *Setup:* Requires creating and configuring Gmail OAuth2 credentials in n8n.

---

### 3. Summary Table

| Node Name             | Node Type                         | Functional Role                                  | Input Node(s)         | Output Node(s)             | Sticky Note                                                                                   |
|-----------------------|----------------------------------|-------------------------------------------------|-----------------------|----------------------------|-----------------------------------------------------------------------------------------------|
| Error Trigger         | n8n-nodes-base.errorTrigger       | Entry point, triggers on any workflow failure    | -                     | Get Workflow JSON          | Stage 1: Capture Error & Fetch Context - activates on workflow failure                        |
| Get Workflow JSON     | n8n-nodes-base.httpRequest        | Fetches full JSON of failed workflow via API     | Error Trigger         | Debugger Agent             | Stage 1: Capture Error & Fetch Context - requires API key credential                          |
| Gemini 2.5 Pro        | @n8n/n8n-nodes-langchain.lmChatOpenRouter | AI model interface to Gemini 2.5 Pro             | Debugger Agent (ai_languageModel) | Debugger Agent            | Stage 2: AI Root Cause Analysis - uses OpenRouter API key                                    |
| Debugger Agent        | @n8n/n8n-nodes-langchain.agent   | Builds prompt, sends error and JSON to AI        | Get Workflow JSON, Gemini 2.5 Pro | Convert Markdown To HTML  | Stage 2: AI Root Cause Analysis - expert prompt for root cause and fix suggestions           |
| Convert Markdown To HTML | n8n-nodes-base.markdown         | Converts AI markdown output to HTML               | Debugger Agent         | Send Debugging Email       | Stage 3: Format and Notify - prepares readable email content                                 |
| Send Debugging Email  | n8n-nodes-base.gmail              | Sends formatted debugging email notification      | Convert Markdown To HTML | -                          | Stage 3: Format and Notify - requires Gmail OAuth2 credentials                               |
| Sticky Note           | n8n-nodes-base.stickyNote         | Documentation notes                               | -                     | -                          | Stage 1: Capture Error & Fetch Context - API key setup details                               |
| Sticky Note1          | n8n-nodes-base.stickyNote         | Documentation notes                               | -                     | -                          | Stage 2: AI Root Cause Analysis - explains AI agent role and model choice                    |
| Sticky Note2          | n8n-nodes-base.stickyNote         | Documentation notes                               | -                     | -                          | Stage 3: Format and Notify - email formatting and notification details                       |
| Sticky Note3          | n8n-nodes-base.stickyNote         | Documentation notes                               | -                     | -                          | Common Errors & Resolutions - troubleshooting tips for common setup errors                   |
| Sticky Note4          | n8n-nodes-base.stickyNote         | Documentation notes                               | -                     | -                          | Watch Video Walkthrough On YouTube - link to video resource                                 |
| Sticky Note5          | n8n-nodes-base.stickyNote         | Documentation notes                               | -                     | -                          | Overview - high-level purpose and benefits of the workflow                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create an "Error Trigger" node**  
   - Type: `Error Trigger`  
   - Purpose: Activate on any workflow failure in the n8n instance.  
   - No special configuration needed.

2. **Create a "Get Workflow JSON" HTTP Request node**  
   - Type: `HTTP Request`  
   - Connect input from: `Error Trigger` node.  
   - URL: `={{`${$env.N8N_EDITOR_BASE_URL}/api/v1/workflows/${$json.workflow.id}`}}`  
   - Authentication: Generic HTTP Header Authentication.  
   - Create a new Generic Credential for HTTP Header Auth:  
     - Header Name: `X-N8N-API-KEY`  
     - Header Value: Your n8n API key created under Settings > API.  
   - Response Format: JSON.

3. **Create a "Gemini 2.5 Pro" node for AI model**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatOpenRouter` (OpenRouter Chat Model)  
   - Model: `google/gemini-2.5-pro`  
   - Credentials: Setup OpenRouter API credentials with your OpenRouter API key.

4. **Create a "Debugger Agent" LangChain Agent node**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Connect two inputs: from `Get Workflow JSON` and from `Gemini 2.5 Pro` (as ai_languageModel input).  
   - Parameters:  
     - Text: Construct a multiline string including:  
       - Workflow name (`{{$json.name}}`)  
       - Failed node name and type from `Error Trigger` JSON (e.g., `{{ $('Error Trigger').item.json.execution.error.node.name }}`)  
       - Error message similarly extracted  
       - Full workflow JSON stringified from `Get Workflow JSON` output.  
     - System Message: `"You are an expert n8n automation developer and debugger. Your task is to analyze a workflow error and provide a clear, actionable diagnosis and solution. Do not be conversational; provide the analysis directly in markdown."`

5. **Connect "Debugger Agent" output to a "Convert Markdown To HTML" node**  
   - Type: `Markdown` node  
   - Mode: `markdownToHtml`  
   - Input markdown: from `Debugger Agent` output key `output`  
   - Output key: `responseHtml`

6. **Create a "Send Debugging Email" node**  
   - Type: `Gmail` node  
   - Connect input from `Convert Markdown To HTML` node.  
   - Recipient: Set the `sendTo` email address to your desired recipient.  
   - Subject: Include dynamic workflow name (e.g., `N8N Automation Error (Workflow: {{ $('Get Workflow JSON').item.json.name }})`).  
   - Message (HTML): Include:  
     - Direct URL link to failed execution using `$env.N8N_EDITOR_BASE_URL` and execution id from error trigger.  
     - Error details: node name, type, and error message.  
     - AI debugging assistant HTML content from `Convert Markdown To HTML`.  
   - Credentials: Configure Gmail OAuth2 credentials, and authenticate with your Google account.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                 |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------|
| Stop digging through execution logs to find out why a workflow failed. This template provides a "set-it-and-forget-it" monitoring system that uses AI to automatically debug your n8n workflows. Instead of just getting a simple error message, you'll receive a detailed email notification with a root cause analysis and a step-by-step suggested fix from a Gemini-powered AI agent. This saves you valuable time, helps you resolve issues faster, and ensures your automations run smoothly. | Overview sticky note in workflow                |
| You must create an n8n API key in `Settings > API` and create a new header auth credential under "Generic Credential" with header `X-N8N-API-KEY` to authorize calls to the n8n REST API for fetching workflow JSON.                                                                                                                                                                                                                                                                                     | Sticky Note on API key setup                     |
| Common errors such as 401 Unauthorized on "Get Workflow JSON" usually mean the API key is missing or invalid; 401 on OpenRouter Chat Model means the OpenRouter API key is not configured; Gmail 401 or invalid_grant means OAuth2 token expired and needs reauthorization. Setting the environment variable `N8N_EDITOR_BASE_URL` correctly is essential for building URLs. Refer to official n8n docs for environment variable setup.                                               | Sticky Note with Common Errors & Resolutions    |
| Watch a detailed video walkthrough on YouTube to understand this workflow better: @[youtube](80m0ebb2_1Q)                                                                                                                                                                                                                                                                                                                                                                                           | Sticky Note with YouTube video link             |

---

**Disclaimer:** The provided text originates exclusively from an automated n8n workflow. It respects all content policies and contains no illegal, offensive, or protected content. All data handled is legal and public.