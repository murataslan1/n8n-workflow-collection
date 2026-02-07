Automated Agentic News Event Monitoring with perplexity.ai

https://n8nworkflows.xyz/workflows/workflow-2458-1747220133588.png


# Automated Agentic News Event Monitoring with perplexity.ai

### 1. Workflow Overview

This workflow implements an automated AI-driven news monitoring and reporting system named "Automated Agentic News Event Monitoring with perplexity.ai". Its main purpose is to keep users informed about specific news events by automatically gathering, summarizing, and emailing relevant news content at scheduled intervals. The workflow is especially valuable for professionals like investors or researchers who need timely updates on topics without manual searching.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger**: Initiates the workflow automatically at preset times (e.g., daily 7 AM).
- **1.2 News Monitoring & AI Processing**: Uses an AI agent powered by Perplexity's large language models via OpenRouter to scan, analyze, and summarize current news on the specified topic.
- **1.3 Content Formatting**: Converts the AI-generated summary into markdown format suitable for email.
- **1.4 Email Dispatch**: Sends the formatted summary via Gmail to the user's email address.

Each block depends sequentially on the previous one, ensuring a smooth flow from triggering to notification delivery.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:**  
  This block automatically starts the workflow on a set schedule, eliminating the need for manual execution.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**

  - **Schedule Trigger**  
    - *Type & Role:* Built-in n8n node to trigger workflows on a schedule.  
    - *Configuration:* Default settings without custom parameters visible (likely configured externally for time).  
    - *Inputs:* None (trigger node).  
    - *Outputs:* Triggers the "News Reporter" node via the main output.  
    - *Version:* 1.2.  
    - *Edge Cases:* Misconfigured scheduling could cause missed triggers; no input data means all downstream logic depends on correct trigger firing.  
    - *Notes:* This node initiates the entire workflow.

#### 2.2 News Monitoring & AI Processing

- **Overview:**  
  This block queries current news and generates a concise summary using AI language models via Perplexity through OpenRouter.

- **Nodes Involved:**  
  - News Reporter  
  - Perplexity

- **Node Details:**

  - **News Reporter**  
    - *Type & Role:* LangChain Agent node acting as an AI agent specialized in news topic monitoring and summarization.  
    - *Configuration:* Configured with the topic/event to monitor (user-specified). Uses retry on failure enabled to improve reliability.  
    - *Inputs:* Trigger input from Schedule Trigger; AI language model input from Perplexity node.  
    - *Outputs:* Provides summarized news text to the "Markdown" node.  
    - *Version:* 1.6.  
    - *Edge Cases:* Failures can arise from API limits, malformed input topics, or language model errors. Retry mechanism mitigates transient failures.  
    - *Sub-workflow:* Utilizes AI model from Perplexity node.

  - **Perplexity**  
    - *Type & Role:* LangChain OpenAI Chat node configured to connect to Perplexity's language model via OpenRouter.ai API.  
    - *Configuration:* Connects using OpenRouter API key (must be set up prior). Acts as the AI backend for both the News Reporter and Title nodes.  
    - *Inputs:* Receives AI queries from News Reporter and Title nodes.  
    - *Outputs:* Provides AI-generated responses back to these nodes.  
    - *Version:* 1.  
    - *Edge Cases:* API key invalid/expired, rate limits, network issues, or malformed prompts can cause failures.

#### 2.3 Content Formatting

- **Overview:**  
  Converts raw AI-generated news summaries into markdown format to prepare for email delivery, and generates an appropriate email subject title.

- **Nodes Involved:**  
  - Markdown  
  - Title

- **Node Details:**

  - **Markdown**  
    - *Type & Role:* Converts text content into markdown format for better readability in emails.  
    - *Configuration:* Default markdown conversion with no custom parameters shown.  
    - *Inputs:* Receives summarized news text from News Reporter.  
    - *Outputs:* Passes markdown content to the Title node.  
    - *Version:* 1.  
    - *Edge Cases:* If input text is empty or malformed, markdown output may be empty or poorly formatted.

  - **Title**  
    - *Type & Role:* LangChain LLM Chain node generating a concise, engaging email subject line based on the markdown content.  
    - *Configuration:* Uses Perplexity node as AI language model.  
    - *Inputs:* Receives markdown content from Markdown node; AI model input from Perplexity node.  
    - *Outputs:* Passes final content and title to Gmail node.  
    - *Version:* 1.4.  
    - *Edge Cases:* Failures can arise from AI model errors or invalid markdown input.

#### 2.4 Email Dispatch

- **Overview:**  
  Sends the prepared news summary with the generated title as an email to the user using Gmail.

- **Nodes Involved:**  
  - Gmail

- **Node Details:**

  - **Gmail**  
    - *Type & Role:* Official Gmail node for sending emails via OAuth2 authentication.  
    - *Configuration:* Uses user’s Gmail OAuth2 credentials (must be set up). Email content and subject taken from Title node output.  
    - *Inputs:* Receives final processed content and title from Title node.  
    - *Outputs:* None (endpoint node).  
    - *Version:* 2.1.  
    - *Edge Cases:* Authentication failures, quota limits, or network issues can prevent email delivery.

---

### 3. Summary Table

| Node Name       | Node Type                                | Functional Role                       | Input Node(s)       | Output Node(s)    | Sticky Note                                                                                                             |
|-----------------|-----------------------------------------|------------------------------------|---------------------|-------------------|-------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger| n8n-nodes-base.scheduleTrigger           | Initiates workflow on schedule     | None                | News Reporter     |                                                                                                                         |
| News Reporter   | @n8n/n8n-nodes-langchain.agent           | AI agent monitoring news            | Schedule Trigger, Perplexity (ai_languageModel) | Markdown          |                                                                                                                         |
| Perplexity      | @n8n/n8n-nodes-langchain.lmChatOpenAi    | Provides AI language model (Perplexity via OpenRouter) | News Reporter, Title (ai_languageModel) | News Reporter, Title |                                                                                                                         |
| Markdown        | n8n-nodes-base.markdown                   | Formats AI summary to markdown     | News Reporter       | Title             |                                                                                                                         |
| Title           | @n8n/n8n-nodes-langchain.chainLlm         | Generates email subject/title      | Markdown, Perplexity (ai_languageModel) | Gmail             |                                                                                                                         |
| Gmail           | n8n-nodes-base.gmail                      | Sends email with news summary      | Title                | None              |                                                                                                                         |
| Sticky Note5    | n8n-nodes-base.stickyNote                 | Annotation                        | None                 | None              |                                                                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Configure the desired schedule (e.g., daily at 7 AM).  
   - No inputs.  
   - Output connects to the next node: "News Reporter".

2. **Create News Reporter Node**  
   - Type: LangChain Agent (`@n8n/n8n-nodes-langchain.agent`)  
   - Set the monitored event/topic parameter within the node configuration (user-defined topic).  
   - Enable “Retry on Fail” to handle transient errors.  
   - Connect input from Schedule Trigger’s main output.  
   - Connect AI language model input later from the Perplexity node (ai_languageModel input).

3. **Create Perplexity Node**  
   - Type: LangChain OpenAI Chat (`@n8n/n8n-nodes-langchain.lmChatOpenAi`)  
   - Configure credentials with OpenRouter.ai API key (accessing Perplexity’s models).  
   - Connect outputs to both News Reporter and Title nodes as AI language model inputs (`ai_languageModel`).  
   - Connect News Reporter and Title nodes’ `ai_languageModel` inputs to this node’s output.

4. **Link News Reporter Node to Markdown Node**  
   - Create Markdown node (`n8n-nodes-base.markdown`).  
   - Connect main output of News Reporter node to Markdown node input.  
   - Default markdown conversion settings.

5. **Create Title Node**  
   - Type: LangChain LLM Chain (`@n8n/n8n-nodes-langchain.chainLlm`)  
   - Connect input from Markdown node.  
   - Connect AI language model input from Perplexity node (ai_languageModel input).  
   - This node generates a concise email subject or title based on the markdown content.

6. **Create Gmail Node**  
   - Type: Gmail (`n8n-nodes-base.gmail`)  
   - Configure Gmail OAuth2 credentials for email sending.  
   - Connect input from Title node’s main output.  
   - Configure email fields:  
     - Recipient: user’s email address  
     - Subject: use Title node’s generated title  
     - Body: use Title node’s output content (which includes markdown summary).  

7. **Verify All Connections**  
   - Schedule Trigger → News Reporter (main)  
   - Perplexity → News Reporter (ai_languageModel)  
   - News Reporter → Markdown (main)  
   - Markdown → Title (main)  
   - Perplexity → Title (ai_languageModel)  
   - Title → Gmail (main)  

8. **Activate Workflow**  
   - Ensure all credentials are valid and API keys are active.  
   - Turn on workflow to enable scheduled execution.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| API key setup is required from OpenRouter.ai to access Perplexity’s online language models.      | https://openrouter.ai/                                                                          |
| The workflow is designed for automated, scheduled monitoring—adjust Schedule Trigger timing as needed. | Documentation note in workflow description.                                                    |
| Useful for investors and researchers needing up-to-date news summaries without manual search.    | Workflow purpose summary.                                                                       |

---

This documentation provides a detailed, structured reference for understanding, modifying, or recreating the "Automated Agentic News Event Monitoring with perplexity.ai" workflow in n8n. It anticipates key failure points, explains node roles and configuration, and clarifies data flow across the workflow.