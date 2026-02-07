Automate Blog Content Creation with GPT-4, Perplexity & WordPress

https://n8nworkflows.xyz/workflows/automate-blog-content-creation-with-gpt-4--perplexity---wordpress-3336


# Automate Blog Content Creation with GPT-4, Perplexity & WordPress

### 1. Workflow Overview

This workflow automates the entire process of creating, publishing, and promoting SEO-optimized blog content using AI and multiple integrations. It is designed for content creators, marketers, and AI enthusiasts who want to streamline blog production from research to publication and notifications.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Captures user input (blog topic or question) via a form trigger.
- **1.2 Research via Perplexity AI:** Queries Perplexity AI API to gather fresh, reputable research data on the topic.
- **1.3 Research Formatting:** Processes and formats the raw research output for downstream use.
- **1.4 Workflow Variable Setup:** Sets essential workflow variables such as email address, Slack channel ID, and Notion database ID.
- **1.5 AI Content Generation and Orchestration:** Uses a LangChain AI Agent with GPT-4 to generate SEO-optimized blog content, publish it to WordPress, send notifications via Gmail and Slack, and log the article in Notion. This block also orchestrates calls to Slack and Notion tools.
- **1.6 Publishing and Notifications:** Handles WordPress publishing, email notification, Slack notification, and Notion database insertion through dedicated nodes invoked by the AI Agent.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Captures the blog topic or question from the user through a web form to initiate the workflow.
- **Nodes Involved:**  
  - Start with Research Query Submission

- **Node Details:**

  - **Start with Research Query Submission**  
    - Type: Form Trigger  
    - Role: Entry point capturing user input via a form titled "AutoBlog Creator" with a required textarea field labeled "Topic or Question".  
    - Configuration: Placeholder text suggests example input "How is GPT-4 transforming content creation in 2025?"  
    - Inputs: None (trigger node)  
    - Outputs: Passes form data downstream to Perplexity Research node  
    - Edge Cases: Missing required field blocks trigger; malformed input unlikely due to textarea  
    - Version: 2.2

---

#### 2.2 Research via Perplexity AI

- **Overview:** Sends the user’s topic to Perplexity AI API to retrieve detailed, reputable research summaries.
- **Nodes Involved:**  
  - Perplexity Research  
  - Sticky Note5 (documentation)

- **Node Details:**

  - **Perplexity Research**  
    - Type: HTTP Request  
    - Role: Calls Perplexity API endpoint `https://api.perplexity.ai/chat/completions` with POST method  
    - Configuration:  
      - Model: "sonar-pro"  
      - System message instructs the AI to act as a professional news researcher summarizing reputable sources  
      - User message dynamically inserts the topic from form input (`{{ $json['Topic or Question'] }}`)  
      - Authentication: HTTP Header Auth with API key credential  
    - Inputs: Receives topic from form trigger  
    - Outputs: JSON response containing research content and citations  
    - Edge Cases: API authentication failure, network timeout, malformed response, rate limits  
    - Version: 4.2

  - **Sticky Note5**  
    - Provides contextual documentation about this block’s purpose: calling Perplexity API for fresh research.

---

#### 2.3 Research Formatting

- **Overview:** Cleans and formats the raw research output from Perplexity by replacing citation placeholders with actual source URLs.
- **Nodes Involved:**  
  - Format Research Output

- **Node Details:**

  - **Format Research Output**  
    - Type: Set Node  
    - Role: Processes the research text to replace citation placeholders `[1]` to `[10]` with corresponding source URLs from the API response.  
    - Configuration: Uses a complex expression with multiple `.replaceAll()` calls to substitute citation markers with actual source links dynamically.  
    - Inputs: Raw research JSON from Perplexity Research  
    - Outputs: JSON with a new field `research` containing formatted research text  
    - Edge Cases: Missing citations array or fewer than 10 citations may cause undefined references; expression failures if JSON structure changes  
    - Version: 3.4

---

#### 2.4 Workflow Variable Setup

- **Overview:** Sets user-specific variables such as email address, Slack channel ID, and Notion database ID for use in notifications and logging.
- **Nodes Involved:**  
  - Edit Workflow Variables  
  - Sticky Note2 (documentation)

- **Node Details:**

  - **Edit Workflow Variables**  
    - Type: Set Node  
    - Role: Defines three string variables: `emailAddress`, `slackChannelId`, and `notionDatabaseId`. These must be configured by the user before running the workflow.  
    - Inputs: Receives formatted research output  
    - Outputs: Passes variables downstream for AI agent use  
    - Edge Cases: Empty or incorrect values will cause failures in email, Slack, or Notion steps  
    - Version: 3.4  
    - Always outputs data to ensure variables are available downstream

  - **Sticky Note2**  
    - Explains this node’s purpose as a configuration panel for user variables and OpenAI model selection.

---

#### 2.5 AI Content Generation and Orchestration

- **Overview:** The core AI agent node that orchestrates content creation, publishing, notifications, and logging by leveraging GPT-4 and MCP client tools for Slack and Notion.
- **Nodes Involved:**  
  - Copywriting AI Agent  
  - Slack-List  
  - Notion-List  
  - Generate SEO Blog Content (GPT-4o)  
  - Sticky Note (documentation)

- **Node Details:**

  - **Copywriting AI Agent**  
    - Type: LangChain Agent Node  
    - Role: Central orchestrator that:  
      1. Uses research data to generate a short SEO-optimized article with H1 and H2 headings (max 20 lines)  
      2. Publishes the article to WordPress  
      3. Sends an email notification with article title and URL  
      4. Retrieves Slack tools and sends a Slack notification to a specified channel  
      5. Retrieves Notion tools and inserts a new entry in the Notion database with article details  
    - Configuration:  
      - The prompt is detailed and instructs the agent to perform each step sequentially, ensuring success before moving on  
      - Dynamic variables include research content, email address, Slack channel ID, and Notion database ID  
    - Inputs: Receives variables and formatted research output  
    - Outputs: Triggers downstream nodes for Slack and Notion tools  
    - Edge Cases: AI generation errors, API failures in WordPress, Gmail, Slack, or Notion; incomplete or invalid credentials; timeout or rate limits  
    - Version: 1.7

  - **Slack-List**  
    - Type: MCP Client Tool  
    - Role: Retrieves available Slack tools for the AI agent to use  
    - Credentials: Slack Bot Token  
    - Inputs: Invoked by AI agent  
    - Outputs: Provides Slack tools list for notification step  
    - Edge Cases: Slack API auth failure, network issues  
    - Version: 1

  - **Notion-List**  
    - Type: MCP Client Tool  
    - Role: Retrieves available Notion tools for the AI agent to use  
    - Credentials: Notion integration token  
    - Inputs: Invoked by AI agent  
    - Outputs: Provides Notion tools list for database insertion  
    - Edge Cases: Notion API auth failure, invalid database ID  
    - Version: 1

  - **Generate SEO Blog Content (GPT-4o)**  
    - Type: LangChain OpenAI Chat Node  
    - Role: Generates SEO blog content using GPT-4o-mini model as part of the AI agent’s language model chain  
    - Credentials: OpenAI API key  
    - Inputs: Provided by AI agent prompt  
    - Outputs: SEO content for publishing  
    - Edge Cases: OpenAI API errors, rate limits, malformed prompts  
    - Version: 1.2

  - **Sticky Note**  
    - Describes the AI agent’s role as a full-stack content assistant and provides links to MCP Notion and Slack server guides:  
      - [mcp-notion-server Guide](https://github.com/suekou/mcp-notion-server)  
      - [mcp-slack-server Guide](https://github.com/modelcontextprotocol/servers/tree/main/src/slack)

---

#### 2.6 Publishing and Notifications

- **Overview:** Executes the actual publishing of the article to WordPress, sends email and Slack notifications, and inserts the article record into Notion.
- **Nodes Involved:**  
  - Publish Article to WordPress  
  - Send Email Notification  
  - Notify Slack Channel  
  - Insert Article in Notion

- **Node Details:**

  - **Publish Article to WordPress**  
    - Type: WordPress Tool Node  
    - Role: Publishes the SEO article with title and content to WordPress with status "publish"  
    - Configuration:  
      - Title and content are dynamically overridden by AI agent outputs  
      - Uses WordPress API credentials  
    - Inputs: Called by AI agent  
    - Outputs: Article URL and metadata for notifications  
    - Edge Cases: WordPress API auth failure, invalid content, network issues  
    - Version: 1

  - **Send Email Notification**  
    - Type: Gmail Tool Node  
    - Role: Sends an email containing the article title and URL to the configured email address  
    - Configuration:  
      - Recipient, subject, and message are dynamically set by AI agent outputs  
      - Uses Gmail OAuth2 credentials  
    - Inputs: Called by AI agent  
    - Outputs: Email send status  
    - Edge Cases: Gmail API auth failure, quota limits, invalid email address  
    - Version: 2.1

  - **Notify Slack Channel**  
    - Type: MCP Client Tool  
    - Role: Sends a notification message to the specified Slack channel with article details  
    - Configuration:  
      - Tool name and parameters dynamically set by AI agent  
      - Uses Slack Bot Token credentials  
    - Inputs: Called by AI agent after Slack tools retrieval  
    - Outputs: Slack message send status  
    - Edge Cases: Slack API auth failure, invalid channel ID, network issues  
    - Version: 1

  - **Insert Article in Notion**  
    - Type: MCP Client Tool  
    - Role: Inserts a new record into the Notion database with article metadata (title, content, URL, status)  
    - Configuration:  
      - Tool name and parameters dynamically set by AI agent  
      - Uses Notion integration credentials  
    - Inputs: Called by AI agent after Notion tools retrieval  
    - Outputs: Database insertion status  
    - Edge Cases: Notion API auth failure, invalid database ID, permission issues  
    - Version: 1

---

### 3. Summary Table

| Node Name                      | Node Type                      | Functional Role                                  | Input Node(s)                      | Output Node(s)                   | Sticky Note                                                                                                  |
|--------------------------------|--------------------------------|-------------------------------------------------|----------------------------------|---------------------------------|--------------------------------------------------------------------------------------------------------------|
| Start with Research Query Submission | Form Trigger                  | Captures blog topic/question from user          | None                             | Perplexity Research             |                                                                                                              |
| Perplexity Research             | HTTP Request                   | Queries Perplexity API for research data        | Start with Research Query Submission | Format Research Output          | Sticky Note5: Calls Perplexity API to get fresh research based on form input.                                |
| Format Research Output          | Set                           | Formats research text, replaces citation markers| Perplexity Research              | Edit Workflow Variables         |                                                                                                              |
| Edit Workflow Variables         | Set                           | Sets email, Slack channel, and Notion DB IDs    | Format Research Output           | Copywriting AI Agent            | Sticky Note2: Workflow Configuration Panel - set your variables here (email, Slack, Notion, OpenAI model).   |
| Copywriting AI Agent            | LangChain Agent               | Orchestrates content creation, publishing, notifications, and logging | Edit Workflow Variables          | Slack-List, Notion-List, Publish Article to WordPress, Send Email Notification, Notify Slack Channel, Insert Article in Notion | Sticky Note: Full-stack content assistant from prompt to post. MCP Notion and Slack server guides linked.     |
| Slack-List                     | MCP Client Tool               | Retrieves Slack tools for AI agent               | Copywriting AI Agent             | Notify Slack Channel            |                                                                                                              |
| Notion-List                    | MCP Client Tool               | Retrieves Notion tools for AI agent              | Copywriting AI Agent             | Insert Article in Notion        |                                                                                                              |
| Generate SEO Blog Content (GPT-4o) | LangChain OpenAI Chat Node   | Generates SEO blog content using GPT-4o          | Copywriting AI Agent             | Copywriting AI Agent (internal) |                                                                                                              |
| Publish Article to WordPress    | WordPress Tool                | Publishes article to WordPress                    | Copywriting AI Agent             | Send Email Notification         |                                                                                                              |
| Send Email Notification         | Gmail Tool                   | Sends email with article title and URL           | Copywriting AI Agent             |                               |                                                                                                              |
| Notify Slack Channel            | MCP Client Tool               | Sends Slack notification about published article | Slack-List                      |                               |                                                                                                              |
| Insert Article in Notion        | MCP Client Tool               | Inserts article record into Notion database      | Notion-List                    |                               |                                                                                                              |
| Sticky Note1                   | Sticky Note                  | Introductory note about workflow automation       | None                           | None                          | Intro Sticky: Automates full SEO blog content creation cycle from research to publishing and notifications.  |
| Sticky Note5                   | Sticky Note                  | Documentation for Perplexity Research block       | None                           | None                          | Perplexity Section: Calls Perplexity API to get fresh research based on a form input.                         |
| Sticky Note2                   | Sticky Note                  | Documentation for workflow variable setup         | None                           | None                          | Workflow Configuration Panel: Set your variables here (email, Slack, Notion, OpenAI model).                  |
| Sticky Note                    | Sticky Note                  | Documentation for AI Agent block                   | None                           | None                          | My Copywriting AI Agent: Full-stack content assistant with MCP Notion and Slack server guides linked.        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node**  
   - Type: Form Trigger  
   - Name: "Start with Research Query Submission"  
   - Configure form title: "AutoBlog Creator"  
   - Add one required textarea field labeled "Topic or Question" with placeholder "How is GPT-4 transforming content creation in 2025?"  
   - Save and note webhook URL for external triggering.

2. **Create HTTP Request Node for Perplexity Research**  
   - Type: HTTP Request  
   - Name: "Perplexity Research"  
   - Method: POST  
   - URL: `https://api.perplexity.ai/chat/completions`  
   - Authentication: HTTP Header Auth with Perplexity API key credential  
   - Body (JSON):  
     ```json
     {
       "model": "sonar-pro",
       "messages": [
         {
           "role": "system",
           "content": "Act as a professional news researcher who is capable of finding detailed summaries about a news topic from highly reputable sources."
         },
         {
           "role": "user",
           "content": " Research the following topic and return everything you can find about: '{{ $json[\"Topic or Question\"] }}'."
         }
       ]
     }
     ```  
   - Connect input from form trigger node.

3. **Create Set Node to Format Research Output**  
   - Type: Set  
   - Name: "Format Research Output"  
   - Add a string field named `research`  
   - Use expression to replace citation placeholders `[1]` to `[10]` with actual citation URLs from API response, using `.replaceAll()` chained calls as in the original workflow.  
   - Connect input from Perplexity Research node.

4. **Create Set Node for Workflow Variables**  
   - Type: Set  
   - Name: "Edit Workflow Variables"  
   - Add string fields: `emailAddress`, `slackChannelId`, `notionDatabaseId`  
   - Leave values empty initially; user must fill before running  
   - Connect input from Format Research Output node.

5. **Create LangChain Agent Node for AI Orchestration**  
   - Type: LangChain Agent  
   - Name: "Copywriting AI Agent"  
   - Configure prompt with detailed instructions to:  
     - Generate SEO-optimized article (max 20 lines, H1, H2, meta-description) based on research input  
     - Publish article to WordPress (title, content)  
     - Send email notification with article title and URL  
     - Retrieve Slack tools and send Slack notification to configured channel  
     - Retrieve Notion tools and insert article record with specified fields  
   - Use variables from previous nodes for dynamic data insertion (`research`, `emailAddress`, `slackChannelId`, `notionDatabaseId`)  
   - Connect input from Edit Workflow Variables node.

6. **Create MCP Client Tool Node for Slack Tools Retrieval**  
   - Type: MCP Client Tool  
   - Name: "Slack-List"  
   - Credentials: Slack Bot Token  
   - Connect input from Copywriting AI Agent node (ai_tool output).

7. **Create MCP Client Tool Node for Notion Tools Retrieval**  
   - Type: MCP Client Tool  
   - Name: "Notion-List"  
   - Credentials: Notion integration token  
   - Connect input from Copywriting AI Agent node (ai_tool output).

8. **Create LangChain OpenAI Chat Node for SEO Content Generation**  
   - Type: LangChain OpenAI Chat  
   - Name: "Generate SEO Blog Content (GPT-4o)"  
   - Model: gpt-4o-mini  
   - Credentials: OpenAI API key  
   - Connect input from Copywriting AI Agent node (ai_languageModel output).

9. **Create WordPress Tool Node for Publishing**  
   - Type: WordPress Tool  
   - Name: "Publish Article to WordPress"  
   - Configure to publish post with:  
     - Title: dynamically from AI agent output  
     - Content: dynamically from AI agent output  
     - Status: publish  
   - Credentials: WordPress API credentials  
   - Connect input from Copywriting AI Agent node (ai_tool output).

10. **Create Gmail Tool Node for Email Notification**  
    - Type: Gmail Tool  
    - Name: "Send Email Notification"  
    - Configure recipient, subject, and message dynamically from AI agent output  
    - Credentials: Gmail OAuth2 credentials  
    - Connect input from Copywriting AI Agent node (ai_tool output).

11. **Create MCP Client Tool Node for Slack Notification**  
    - Type: MCP Client Tool  
    - Name: "Notify Slack Channel"  
    - Configure tool name and parameters dynamically from AI agent output  
    - Credentials: Slack Bot Token  
    - Connect input from Slack-List node (ai_tool output).

12. **Create MCP Client Tool Node for Notion Database Insertion**  
    - Type: MCP Client Tool  
    - Name: "Insert Article in Notion"  
    - Configure tool name and parameters dynamically from AI agent output  
    - Credentials: Notion integration token  
    - Connect input from Notion-List node (ai_tool output).

13. **Add Sticky Notes for Documentation**  
    - Add notes describing each block’s purpose, referencing MCP server guides for Slack and Notion, and workflow configuration instructions.

14. **Configure Credentials**  
    - Setup and test credentials for:  
      - OpenAI API (GPT-4)  
      - Perplexity API (HTTP Header Auth)  
      - WordPress API  
      - Slack Bot Token (MCP Client)  
      - Notion integration token (MCP Client)  
      - Gmail OAuth2 (optional for email notifications)

15. **Test Workflow**  
    - Submit a test topic via the form trigger  
    - Verify research retrieval, content generation, publishing, notifications, and logging  
    - Monitor for errors and adjust variables or credentials as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                          |
|-----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| This workflow uses the community node `n8n-nodes-mcp` which requires self-hosted n8n instances.     | Installation: Settings > Community Nodes > Install `n8n-nodes-mcp`                                      |
| MCP Notion Server Guide                                                                              | https://github.com/suekou/mcp-notion-server                                                             |
| MCP Slack Server Guide                                                                               | https://github.com/modelcontextprotocol/servers/tree/main/src/slack                                      |
| Workflow automates full SEO blog content creation cycle from research to publishing and notifications | Introductory sticky note in workflow                                                                    |
| Customize research prompt, GPT-4 settings, Notion fields, and add logic for featured images as needed | User customization suggestions from workflow description                                                |

---

This documentation provides a complete, structured reference to understand, reproduce, and modify the "Automate Blog Content Creation with GPT-4, Perplexity & WordPress" workflow. It anticipates potential failure points and integration requirements, enabling robust deployment and maintenance.