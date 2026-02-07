Automate Weekly Tech Research with Perplexity AI, Notion & Gmail

https://n8nworkflows.xyz/workflows/automate-weekly-tech-research-with-perplexity-ai--notion---gmail-6616


# Automate Weekly Tech Research with Perplexity AI, Notion & Gmail

### 1. Workflow Overview

This workflow automates a weekly technology research report focusing on recent and innovative artificial intelligence tools. It integrates Perplexity AI via OpenRouter for advanced research, stores curated results into a Notion database, and sends an email report through Gmail. The workflow is designed for professionals and teams seeking an automated technology watch, concentrating on no-code, productivity, and analytics tools launched or popularized in the last three months.

The workflow’s logic is organized into the following blocks:

- **1.1 Report Scheduling:** Defines the weekly trigger time for the workflow execution.
- **1.2 AI Research Agent:** Uses a configured AI agent with a specific system prompt and research guidelines to perform technology monitoring.
- **1.3 Language Model Integration:** Connects the AI agent to the Perplexity Sonar DeepSearch model via OpenRouter for detailed research.
- **1.4 Internal Reasoning:** Allows the AI agent to perform internal reflection and complex reasoning without external calls.
- **1.5 Data Storage:** Updates or adds the research results into a Notion database page.
- **1.6 Report Delivery:** Sends the final compiled report by email through Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Report Scheduling

- **Overview:**  
  This block schedules the workflow to run automatically every Monday at 9 AM, initiating the research process.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Sticky Note (Report Scheduling)

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates the workflow on a weekly schedule  
    - Configuration: Set to trigger every week on Monday at 09:00 AM  
    - Input: None (trigger node)  
    - Output: Starts the AI Agent node  
    - Version Requirements: n8n version supporting schedule trigger v1.2  
    - Potential Failures: Misconfigured time zone, invalid cron expression, or n8n scheduler down  
    - Sticky Note: Explains the scheduling setup and the trigger timing

  - **Sticky Note (Report Scheduling)**  
    - Type: Sticky Note  
    - Role: Documentation for scheduling details  
    - Content: Explains the trigger timing and how to adjust it  
    - No input/output  

#### 1.2 AI Research Agent

- **Overview:**  
  The core logic for conducting the technology watch. It defines a detailed system prompt with specific tasks, sources, guidelines, output format, volume, and language instructions to the AI agent.

- **Nodes Involved:**  
  - AI Agent  
  - Sticky Note1 (Monitoring AI Agent)

- **Node Details:**

  - **AI Agent**  
    - Type: Langchain Agent node  
    - Role: Executes the technology monitoring task as per a custom system prompt  
    - Configuration:  
      - Text prompt defines task, sources (including theresanaiforthat.com), exclusion criteria, focus on professional no-code tools, output format, and volume limit of 10 tools  
      - Output language fixed to English  
    - Input: Triggered by Schedule Trigger  
    - Output: Connected to Notion and Gmail nodes for data storage and report delivery  
    - Version Requirements: Langchain Agent v1.8  
    - Potential Failures:  
      - Prompt parse errors  
      - API rate limits or authentication issues with the language model  
      - Incomplete or malformed AI responses  
    - Sticky Note: Provides guidance on adjusting the agent’s system prompt for desired monitoring strategy

  - **Sticky Note1 (Monitoring AI Agent)**  
    - Type: Sticky Note  
    - Role: Documentation of the AI agent’s purpose and prompt customization  
    - Content: Explains how to adapt the agent’s goals and behavior

#### 1.3 Language Model Integration

- **Overview:**  
  This block specifies the language model used by the AI agent — Perplexity Sonar DeepSearch via OpenRouter API — enabling advanced research capabilities.

- **Nodes Involved:**  
  - OpenRouter Chat Model  
  - Sticky Note2 (Language Model)

- **Node Details:**

  - **OpenRouter Chat Model**  
    - Type: Langchain OpenRouter Language Model node  
    - Role: Provides AI language model capability for the AI Agent  
    - Configuration:  
      - Model set to “perplexity/sonar-deep-research”  
      - Connected with valid OpenRouter API credentials  
    - Input: Connected as ai_languageModel input to AI Agent node  
    - Output: Provides responses to AI Agent  
    - Version Requirements: OpenRouter LM node v1  
    - Potential Failures:  
      - API authentication errors  
      - Model unavailability or latency issues  
      - Quota or credit exhaustion  
    - Sticky Note: Describes the choice of Perplexity model and encourages users to connect their own AI credits

  - **Sticky Note2 (Language Model)**  
    - Type: Sticky Note  
    - Role: Documentation for the language model choice  
    - Content: Explains why Perplexity is recommended for monitoring and research tasks

#### 1.4 Internal Reasoning

- **Overview:**  
  Enables the AI agent to perform internal reflection or complex reasoning steps without querying external resources or modifying data.

- **Nodes Involved:**  
  - Think  
  - Sticky Note4 (Internal Thinking Tool)

- **Node Details:**

  - **Think**  
    - Type: Langchain Tool Think node  
    - Role: Allows internal agent reflection, managing short-term memory, and reasoning  
    - Configuration: Description indicates no external calls or DB changes; purely internal thought logging  
    - Input: From AI Agent’s ai_tool output  
    - Output: Connected back into AI Agent input loop  
    - Version Requirements: Tool Think v1  
    - Potential Failures: Expression evaluation errors or infinite loops in reasoning logic  
    - Sticky Note: Explains purpose and recommended use cases

  - **Sticky Note4 (Internal Thinking Tool)**  
    - Type: Sticky Note  
    - Role: Documentation for the Think node  
    - Content: Explains internal thinking tool usage and benefits

#### 1.5 Data Storage

- **Overview:**  
  Stores or updates the AI-generated technology watch results into a Notion database page for easy access and organization.

- **Nodes Involved:**  
  - Notion  
  - Sticky Note3 (Database Selection)

- **Node Details:**

  - **Notion**  
    - Type: Notion node  
    - Role: Updates a database page with research results  
    - Configuration:  
      - Target page identified by URL (converted to pageId)  
      - Operation set to “update” on databasePage resource  
      - Credentials for Notion API authenticated  
    - Input: Receives output from AI Agent node  
    - Output: None downstream, terminal node for data storage  
    - Version Requirements: Notion node v2.2  
    - Potential Failures:  
      - API authentication errors  
      - Invalid pageId or database access rights  
      - Rate limiting by Notion  
    - Sticky Note: Describes database selection and automation of data entry

  - **Sticky Note3 (Database Selection)**  
    - Type: Sticky Note  
    - Role: Documentation for Notion database integration  
    - Content: Explains how to select and connect the database for storing results

#### 1.6 Report Delivery

- **Overview:**  
  Sends the compiled technology research report automatically by email to configured recipients once the monitoring is complete.

- **Nodes Involved:**  
  - Gmail  
  - Sticky Note5 (Automatic Report Delivery)

- **Node Details:**

  - **Gmail**  
    - Type: Gmail node  
    - Role: Sends the report email containing AI Agent output  
    - Configuration:  
      - Subject dynamically includes current date/time  
      - Email body set to the AI Agent’s output  
      - Options disable Gmail’s default attribution text  
      - Credentials use OAuth2 Gmail account  
    - Input: Receives data from AI Agent node (after Notion update)  
    - Output: None downstream, terminal node for email sending  
    - Version Requirements: Gmail node v2.1  
    - Potential Failures:  
      - OAuth token expiration or authentication failures  
      - Gmail API quota limits  
      - Email formatting issues  
    - Sticky Note: Highlights automatic delivery and recipient configuration

  - **Sticky Note5 (Automatic Report Delivery)**  
    - Type: Sticky Note  
    - Role: Documentation for email sending  
    - Content: Explains automatic emailing of monitoring results

---

### 3. Summary Table

| Node Name             | Node Type                          | Functional Role                  | Input Node(s)      | Output Node(s)           | Sticky Note                                                                                     |
|-----------------------|----------------------------------|--------------------------------|--------------------|--------------------------|------------------------------------------------------------------------------------------------|
| Schedule Trigger       | Schedule Trigger                 | Weekly workflow trigger         | None               | AI Agent                 | Set the time when your monitoring workflow will run automatically. Trigger: Monday at 9 AM.    |
| Sticky Note           | Sticky Note                     | Documentation                   | None               | None                     | Set the time when your monitoring workflow will run automatically.                             |
| AI Agent              | Langchain Agent                 | Executes AI research task       | Schedule Trigger, Think | Notion, Gmail            | Define your agent’s system prompt and monitoring strategy goals here.                          |
| Sticky Note1          | Sticky Note                     | Documentation                   | None               | None                     | Adjust the AI agent’s goals, roles, and behavior based on your monitoring strategy.            |
| OpenRouter Chat Model | Langchain LM OpenRouter         | Provides AI language model      | None               | AI Agent (languageModel) | Connects to Perplexity Sonar DeepSearch for advanced research. Connect your own AI credits.   |
| Sticky Note2          | Sticky Note                     | Documentation                   | None               | None                     | Perplexity recommended for monitoring and research tasks.                                     |
| Think                 | Langchain Tool Think            | Internal AI reflection          | AI Agent           | AI Agent                 | Use for internal reasoning without external interactions or DB changes.                       |
| Sticky Note4          | Sticky Note                     | Documentation                   | None               | None                     | Allows agent to express internal thoughts for complex reasoning.                              |
| Notion                | Notion                         | Stores AI results in database   | AI Agent           | None                     | Select the database where weekly monitoring results are stored automatically.                 |
| Sticky Note3          | Sticky Note                     | Documentation                   | None               | None                     | Explains database selection and automatic update.                                            |
| Gmail                 | Gmail                          | Sends email report              | AI Agent           | None                     | Automatically sends monitoring results by email to configured recipients.                     |
| Sticky Note5          | Sticky Note                     | Documentation                   | None               | None                     | Handles automatic email delivery of the generated monitoring results.                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set to trigger every week on Monday at 09:00 AM  
   - No credentials required

2. **Create the AI Agent node:**  
   - Type: Langchain Agent  
   - Paste the detailed system prompt specifying:  
     - Task: Conduct technology watch on recent AI tools (last 3 months)  
     - Sources: Include theresanaiforthat.com plus blogs, forums, product launch platforms  
     - Guidelines: Exclude well-known tools, focus on professional no-code, active tools  
     - Output format: Tool name, link, summary, use cases, benefits, source  
     - Volume: Max 10 tools  
     - Language: English  
   - No additional options needed  
   - Connect input from Schedule Trigger  
   - No credentials needed for this node

3. **Create the OpenRouter Chat Model node:**  
   - Type: Langchain OpenRouter LM  
   - Set model to “perplexity/sonar-deep-research”  
   - Add OpenRouter API credentials with valid API key  
   - Connect output as ai_languageModel input to AI Agent node

4. **Create the Think node:**  
   - Type: Langchain Tool Think  
   - Description: Internal reflection tool for AI agent reasoning  
   - Connect ai_tool output of Think node back to ai_tool input of AI Agent  
   - No credentials needed

5. **Connect AI Agent node outputs:**  
   - Connect main output to Notion node  
   - Connect main output also to Gmail node (both receive AI Agent output)

6. **Create the Notion node:**  
   - Type: Notion  
   - Operation: Update  
   - Resource: databasePage  
   - Set pageId by pasting the Notion database page URL (convert to pageId)  
   - Authenticate with Notion API credentials (OAuth or token)  
   - Connect input from AI Agent output

7. **Create the Gmail node:**  
   - Type: Gmail  
   - Set subject to: "Veille technologique du {{ $now.toLocaleString() }}" (dynamic date/time)  
   - Set message body to: "={{ $json.output }}" (AI Agent output)  
   - Disable “append attribution” option  
   - Authenticate with Gmail OAuth2 credentials  
   - Connect input from AI Agent output (after Notion)

8. **Add Sticky Note nodes for documentation:**  
   - Place sticky notes near each logical block describing their purpose following the content in the sticky notes from the original workflow for clarity and maintainability

9. **Save and activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                        | Context or Link                                                                                       |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| The workflow is designed to run automatically every Monday at 9 AM to generate a weekly technology research report using AI and deliver it by email.            | Scheduling overview                                                                                  |
| Perplexity AI via OpenRouter is recommended for high-quality, advanced research tasks, especially for monitoring emerging technologies.                         | Language model choice documentation                                                                  |
| The AI agent’s prompt is highly customizable to adapt to different monitoring goals, sources, or output formats.                                                | AI Agent customization guidance                                                                     |
| Integration with Notion allows seamless storage and organization of research results in a collaborative environment.                                            | Notion database integration                                                                          |
| The Gmail node uses OAuth2 for secure email sending; ensure credentials are properly set up to avoid authentication failures.                                   | Gmail OAuth2 credentials setup                                                                       |
| For troubleshooting, check API quotas and connectivity for OpenRouter, Notion, and Gmail integrations.                                                         | Common integration issues                                                                            |
| Official n8n documentation can provide additional details on node configuration and API credential setup.                                                      | https://docs.n8n.io/                                                                                  |

---

**Disclaimer:** The provided workflow content originates exclusively from an automated workflow created with n8n, an integration and automation tool. The processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All manipulated data are legal and public.