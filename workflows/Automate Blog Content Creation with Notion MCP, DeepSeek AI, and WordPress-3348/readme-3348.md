Automate Blog Content Creation with Notion MCP, DeepSeek AI, and WordPress

https://n8nworkflows.xyz/workflows/automate-blog-content-creation-with-notion-mcp--deepseek-ai--and-wordpress-3348


# Automate Blog Content Creation with Notion MCP, DeepSeek AI, and WordPress

### 1. Workflow Overview

This workflow automates the creation and publication of SEO-optimized blog content by integrating Notion, AI content generation, WordPress publishing, and email notification. It is designed for content creators, marketers, and bloggers who use Notion for content management and WordPress for publishing, aiming to reduce manual effort and streamline the content pipeline.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Variable Initialization:** Detects updates in a specified Notion database and initializes workflow variables for further processing.
- **1.2 AI Content Generation and Task Planning:** Uses an AI agent to generate SEO-optimized article content, plan publishing, email notification, and Notion database updates.
- **1.3 Content Publishing and Notifications:** Publishes the generated article to WordPress, sends an email notification, and updates the Notion database accordingly.
- **1.4 Notion Tools Interaction:** Retrieves and executes Notion tools required for updating the Notion database entry with article details.
- **1.5 Configuration and Metadata:** Provides user guidance and configuration notes via sticky notes.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Variable Initialization

- **Overview:**  
  This block listens for updates in a specific Notion database and extracts key variables needed for subsequent processing.

- **Nodes Involved:**  
  - Watch Notion Updates  
  - Edit Workflow Variables

- **Node Details:**

  - **Watch Notion Updates**  
    - *Type & Role:* Notion Trigger node; listens for page updates in a Notion database.  
    - *Configuration:* Triggers every hour on updates in the Notion database with ID `1c33d655-0fd9-8057-ac1a-eabf12d12f6b`.  
    - *Expressions:* Uses the Notion database ID directly; outputs updated page data including the page `Name`.  
    - *Connections:* Output → Edit Workflow Variables.  
    - *Potential Failures:* API authentication errors, rate limits, or database ID misconfiguration.  
    - *Version:* TypeVersion 1.

  - **Edit Workflow Variables**  
    - *Type & Role:* Set node; initializes workflow variables such as email address, Notion database ID, and Notion item ID.  
    - *Configuration:*  
      - `emailAddress`: empty string placeholder to be set by user.  
      - `notionDatabaseId`: empty string placeholder to be set by user.  
      - `notionItemId`: dynamically set to the updated Notion page ID from the trigger (`={{ $json.id }}`).  
    - *Connections:* Output → AI Task Planner.  
    - *Potential Failures:* Missing or incorrect variable values will cause downstream failures.  
    - *Version:* TypeVersion 3.4.

---

#### 2.2 AI Content Generation and Task Planning

- **Overview:**  
  This block uses an AI agent to generate an SEO-optimized article based on Notion data, plan publishing on WordPress, send email notifications, and update Notion entries accordingly.

- **Nodes Involved:**  
  - AI Task Planner  
  - DeepSeek Chat Model

- **Node Details:**

  - **AI Task Planner**  
    - *Type & Role:* LangChain Agent node; orchestrates AI-driven content creation and task execution planning.  
    - *Configuration:*  
      - Prompt instructs the AI to:  
        1. Write an SEO-optimized article (max 20 lines) with structured headings (H1, H2), keyword extraction, readability optimization, and CTA.  
        2. Publish the article on WordPress with title and content.  
        3. Send an email with the article title and URL to the configured email address.  
        4. Retrieve Notion tools and update the Notion database entry with article details (title, content, URL, status).  
      - Uses dynamic expressions to inject Notion page `Name`, email address, Notion database ID, and item ID.  
    - *Connections:*  
      - AI Language Model input → DeepSeek Chat Model.  
      - AI Tool outputs → Publish Blog Post, Send Email, Notion List Available Tools, Notion Run a Tool.  
    - *Potential Failures:*  
      - AI service authentication or rate limits.  
      - Expression evaluation errors if variables are missing.  
      - Logical errors if AI output is malformed or incomplete.  
    - *Version:* TypeVersion 1.7.

  - **DeepSeek Chat Model**  
    - *Type & Role:* Language Model node; provides AI language generation capabilities to the AI Task Planner.  
    - *Configuration:* Uses DeepSeek API credentials for content generation.  
    - *Connections:* Output → AI Task Planner (ai_languageModel input).  
    - *Potential Failures:* API key invalidation, network issues, or DeepSeek service downtime.  
    - *Version:* TypeVersion 1.

---

#### 2.3 Content Publishing and Notifications

- **Overview:**  
  This block handles publishing the AI-generated article to WordPress and sending an email notification with article details.

- **Nodes Involved:**  
  - Publish Blog Post  
  - Send Email

- **Node Details:**

  - **Publish Blog Post**  
    - *Type & Role:* WordPress Tool node; creates a new blog post on WordPress.  
    - *Configuration:*  
      - Title and content are dynamically set from AI Task Planner outputs.  
      - Post status set to `draft` (can be changed to `publish` if desired).  
    - *Connections:* Input from AI Task Planner (ai_tool output).  
    - *Credentials:* WordPress API credentials required.  
    - *Potential Failures:* Authentication errors, API rate limits, invalid content format, or WordPress site connectivity issues.  
    - *Version:* TypeVersion 1.

  - **Send Email**  
    - *Type & Role:* Gmail Tool node; sends an email notification with article title and URL.  
    - *Configuration:*  
      - Recipient, subject, and message are dynamically set from AI Task Planner outputs.  
    - *Connections:* Input from AI Task Planner (ai_tool output).  
    - *Credentials:* Gmail OAuth2 credentials required.  
    - *Potential Failures:* Authentication errors, quota limits, invalid email addresses, or network issues.  
    - *Version:* TypeVersion 2.1.

---

#### 2.4 Notion Tools Interaction

- **Overview:**  
  This block retrieves available Notion tools and executes the tool to update the Notion database entry with the article details.

- **Nodes Involved:**  
  - Notion List Available Tools  
  - Notion Run a Tool

- **Node Details:**

  - **Notion List Available Tools**  
    - *Type & Role:* MCP Client Tool node; lists available Notion tools for interaction.  
    - *Configuration:* No parameters; uses MCP client API credentials.  
    - *Connections:* Output → AI Task Planner (ai_tool input).  
    - *Credentials:* MCP Client API credentials for Notion.  
    - *Potential Failures:* API authentication errors, MCP node compatibility issues, or network problems.  
    - *Version:* TypeVersion 1.

  - **Notion Run a Tool**  
    - *Type & Role:* MCP Client Tool node; executes a specified Notion tool with parameters to update the database entry.  
    - *Configuration:*  
      - Tool name and parameters are dynamically set from AI Task Planner outputs.  
      - Operation set to `executeTool`.  
    - *Connections:* Input from AI Task Planner (ai_tool output).  
    - *Credentials:* MCP Client API credentials for Notion.  
    - *Potential Failures:* Tool execution errors, invalid parameters, or API issues.  
    - *Version:* TypeVersion 1.

---

#### 2.5 Configuration and Metadata

- **Overview:**  
  Provides user instructions, branding, and configuration guidance via sticky notes.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note2

- **Node Details:**

  - **Sticky Note**  
    - *Type & Role:* Visual note for workflow overview and API key reference.  
    - *Content:* Describes the workflow as a smart content automation system and provides a link to Openrouter API keys.  
    - *Position:* Top-left area for visibility.  
    - *Version:* TypeVersion 1.

  - **Sticky Note2**  
    - *Type & Role:* Visual note for configuration instructions.  
    - *Content:* Instructs users to set variables such as email, Slack, Notion, and OpenAI model credentials.  
    - *Position:* Near variable initialization nodes.  
    - *Version:* TypeVersion 1.

---

### 3. Summary Table

| Node Name               | Node Type                         | Functional Role                                | Input Node(s)          | Output Node(s)                           | Sticky Note                                                                                  |
|-------------------------|----------------------------------|-----------------------------------------------|-----------------------|-----------------------------------------|----------------------------------------------------------------------------------------------|
| Watch Notion Updates     | notionTrigger                    | Detects Notion database updates                | —                     | Edit Workflow Variables                  |                                                                                              |
| Edit Workflow Variables  | set                             | Initializes workflow variables                  | Watch Notion Updates   | AI Task Planner                         |                                                                                              |
| AI Task Planner          | langchain.agent                 | AI content generation and task orchestration   | Edit Workflow Variables, DeepSeek Chat Model, Notion List Available Tools, Notion Run a Tool, Publish Blog Post, Send Email | Publish Blog Post, Send Email, Notion List Available Tools, Notion Run a Tool, DeepSeek Chat Model |                                                                                              |
| DeepSeek Chat Model      | lmChatDeepSeek                  | AI language model for content generation        | —                     | AI Task Planner (ai_languageModel input) |                                                                                              |
| Publish Blog Post        | wordpressTool                   | Publishes article to WordPress                   | AI Task Planner       | —                                       |                                                                                              |
| Send Email               | gmailTool                      | Sends email notification                         | AI Task Planner       | —                                       |                                                                                              |
| Notion List Available Tools | mcpClientTool                 | Lists available Notion tools                     | AI Task Planner       | AI Task Planner                         |                                                                                              |
| Notion Run a Tool        | mcpClientTool                   | Executes Notion tool to update database entry   | AI Task Planner       | —                                       |                                                                                              |
| Sticky Note              | stickyNote                     | Workflow overview and API key reference          | —                     | —                                       | **Smart Content Automation Workflow** Automatically reacts to Notion updates, uses AI to process data, and triggers actions like sending emails or publishing blog posts. **Openrouter** : [API](https://openrouter.ai/settings/keys) |
| Sticky Note2             | stickyNote                     | Workflow configuration instructions              | —                     | —                                       | **Workflow Configuration Panel** 🛠️ Set your variables here (email, Slack, Notion, OpenAI model) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Notion Trigger Node**  
   - Type: `notionTrigger`  
   - Event: `pagedUpdatedInDatabase`  
   - Polling: Every hour  
   - Database ID: Set to your Notion database ID (e.g., `1c33d655-0fd9-8057-ac1a-eabf12d12f6b`)  
   - Credentials: Configure with your Notion API credentials.

2. **Add a Set Node to Initialize Variables**  
   - Type: `set`  
   - Variables to define:  
     - `emailAddress` (string): Your notification email address.  
     - `notionDatabaseId` (string): Your Notion database ID.  
     - `notionItemId` (string): Set dynamically to `={{ $json.id }}` from the Notion trigger output.  
   - Connect input from Notion Trigger node.

3. **Add a LangChain Agent Node for AI Task Planning**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - Prompt: Use the detailed prompt to instruct the AI to generate SEO content, publish on WordPress, send email, and update Notion.  
   - Use expressions to inject:  
     - Keywords from Notion page `Name` field.  
     - Email address, Notion database ID, and item ID from variables.  
   - Connect input from the Set node.

4. **Add a DeepSeek Chat Model Node**  
   - Type: `@n8n/n8n-nodes-langchain.lmChatDeepSeek`  
   - Credentials: Configure with your DeepSeek API key.  
   - Connect output to AI Task Planner node’s language model input.

5. **Add a WordPress Tool Node to Publish Blog Post**  
   - Type: `wordpressTool`  
   - Title: Set dynamically from AI Task Planner output (`Title`).  
   - Content: Set dynamically from AI Task Planner output (`Content`).  
   - Status: Set to `draft` or `publish` as preferred.  
   - Credentials: Configure with WordPress API credentials.  
   - Connect input from AI Task Planner node (ai_tool output).

6. **Add a Gmail Tool Node to Send Email**  
   - Type: `gmailTool`  
   - Send To: Set dynamically from AI Task Planner output (`To`).  
   - Subject: Set dynamically from AI Task Planner output (`Subject`).  
   - Message: Set dynamically from AI Task Planner output (`Message`).  
   - Credentials: Configure with Gmail OAuth2 credentials.  
   - Connect input from AI Task Planner node (ai_tool output).

7. **Add MCP Client Tool Node to List Notion Tools**  
   - Type: `mcpClientTool`  
   - Credentials: Configure with MCP Client API credentials for Notion.  
   - Connect input from AI Task Planner node (ai_tool output).

8. **Add MCP Client Tool Node to Run Notion Tool**  
   - Type: `mcpClientTool`  
   - Operation: `executeTool`  
   - Tool Name and Parameters: Set dynamically from AI Task Planner output.  
   - Credentials: Same MCP Client API credentials.  
   - Connect input from AI Task Planner node (ai_tool output).

9. **Add Sticky Notes for Documentation**  
   - Create one sticky note describing the workflow overview and API key references.  
   - Create another sticky note for configuration instructions (variables to set).  
   - Position these notes near relevant nodes for clarity.

10. **Configure Credentials**  
    - Notion API credentials with access to the target database.  
    - DeepSeek API key for AI content generation.  
    - WordPress API credentials with permissions to create posts.  
    - Gmail OAuth2 credentials for sending emails.  
    - MCP Client API credentials for Notion tools.

11. **Activate the Workflow**  
    - Test the workflow by updating a page in the Notion database.  
    - Verify that the AI generates content, publishes to WordPress, sends an email, and updates Notion accordingly.

---

### 5. General Notes & Resources

| Note Content                                                                                           | Context or Link                                         |
|------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| This workflow requires the community node `n8n-nodes-mcp`, which is compatible only with self-hosted n8n instances. | [n8n Documentation on Community Nodes](https://docs.n8n.io/integrations/community-nodes/) |
| Openrouter API keys are used for AI content generation.                                              | [Openrouter API Keys](https://openrouter.ai/settings/keys) |
| Workflow screenshot and branding available at:                                                       | ![Workflow Screenshot](https://www.dr-firas.com/workflow_deepseek.png) |
| Recommended to customize AI prompt and email notifications to fit your tone and style preferences.  | —                                                      |
| Ensure all API credentials and permissions are correctly configured to avoid authentication errors.  | —                                                      |

---

This document provides a detailed, structured reference for understanding, reproducing, and customizing the "Automate Blog Content Creation with Notion MCP, DeepSeek AI, and WordPress" workflow. It covers all nodes, their roles, configurations, and integration points to facilitate smooth operation and maintenance.