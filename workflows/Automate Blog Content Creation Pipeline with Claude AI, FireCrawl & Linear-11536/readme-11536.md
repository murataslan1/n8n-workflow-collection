Automate Blog Content Creation Pipeline with Claude AI, FireCrawl & Linear

https://n8nworkflows.xyz/workflows/automate-blog-content-creation-pipeline-with-claude-ai--firecrawl---linear-11536


# Automate Blog Content Creation Pipeline with Claude AI, FireCrawl & Linear

### 1. Workflow Overview

This workflow, titled **"The Blog Jedi"**, automates the end-to-end blog content creation pipeline using AI models (Claude AI and OpenAI GPT), FireCrawl web scraping, and project management integration with Linear. It is designed for a content marketing team aiming to efficiently produce SEO-optimized blog posts following a pillar/cluster content strategy.

**Target Use Cases:**  
- Automate blog topic prioritization and lifecycle management  
- Conduct focused research using web scraping for accurate content briefs  
- Generate full, publish-ready blog posts with SEO metadata  
- Manage content tasks and statuses within Linear issue tracking  
- Synchronize blog planning and status updates with Google Sheets for tracking

**Logical Blocks:**

- **1.1 Trigger & Status Management:** Scheduled and chat triggers initiate the workflow. Blog lifecycle status is managed by comparing Linear issues and Google Sheets data.  
- **1.2 Research Agent:** Uses FireCrawl scraping and Claude AI to generate detailed blog briefs including outlines, metadata, and image requirements.  
- **1.3 Blog Writer Agent:** Consumes briefs to write complete, SEO-optimized blog posts with strict formatting and metadata rules, leveraging Claude AI, GPT-5, and FireCrawl.  
- **1.4 Linear Issue Creation:** Posts the finished blog content as issues in Linear for tracking and editorial workflow integration.  
- **1.5 Google Sheets Integration:** Reads and updates strategy and SEO report sheets to track blog progress and plan future content.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Trigger & Status Management

**Overview:**  
Initiates workflow execution and manages blog statuses by pulling data from Linear and Google Sheets, cross-referencing completed and planned blogs to decide next focus topics.

**Nodes Involved:**  
- Schedule Trigger  
- Blog Status Manager Agent  
- Get many issues in Linear1  
- Get row(s) in sheet in Google Sheets- Strategy_State  
- Get row(s) in sheet in Google Sheets- SEO Report  
- Append or update row in sheet in Google Sheets

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Configured to trigger on Mondays, Tuesdays, and Wednesdays weekly.  
  - Initiates the workflow automatically on these days.  
  - Outputs trigger data to Blog Status Manager Agent.  
  - Edge cases: Missed triggers if system downtime; no manual trigger fallback here.

- **Blog Status Manager Agent**  
  - Type: LangChain Agent (AI-driven strategic project manager)  
  - Uses a custom system message that instructs it to:  
    - Query Linear issues for completed blogs  
    - Cross-reference with Google Sheets Strategy_State  
    - Update blog statuses from PLANNED to DRAFT_CREATED as appropriate  
    - Select next blog topic for research  
    - If all content is drafted, reads SEO Report for new priorities  
  - Inputs: Trigger data, Linear issues, Google Sheets data  
  - Outputs: Next blog title/topic to research  
  - Edge cases: API failures, data mismatches, AI prompt errors, rate limits on APIs  
  - Sticky Note attached explaining its role and prompt location.

- **Get many issues in Linear1**  
  - Type: HTTP Request (GraphQL)  
  - Pulls first 50 issues from Linear with id, identifier, and title fields to identify existing blogs.  
  - Headers contain authorization token (OAuth).  
  - Input: Triggered by Blog Status Manager Agent.  
  - Output: Issues list for AI processing.  
  - Edge cases: Auth errors, API limits, network errors.

- **Get row(s) in sheet in Google Sheets- Strategy_State**  
  - Type: Google Sheets Tool  
  - Reads rows from the "Strategy_State" sheet to check blog planning status.  
  - Uses OAuth2 credentials.  
  - Input: Triggered by Blog Status Manager Agent.  
  - Output: Current blog plan state.  
  - Edge cases: Sheet access errors, missing data.

- **Get row(s) in sheet in Google Sheets- SEO Report**  
  - Type: Google Sheets Tool  
  - Reads rows from "SEO Report" sheet containing deep SEO data and priorities.  
  - Used if all current blogs are drafted to find new pillars/clusters.  
  - Edge cases: Sheet access errors, stale data.

- **Append or update row in sheet in Google Sheets**  
  - Type: Google Sheets Tool  
  - Updates or appends rows in "Strategy_State" to reflect new blog statuses or newly planned pillars/clusters.  
  - Uses dynamic columns with AI-generated values for status, titles, notes, dates, etc.  
  - Edge cases: Update conflicts, invalid data.

---

#### 1.2 Research Agent

**Overview:**  
Conducts fast, focused research for the selected blog topic using FireCrawl scraping and Claude AI, producing a detailed blog brief with metadata, outlines, and image sourcing instructions.

**Nodes Involved:**  
- When chat message received (optional alternative trigger)  
- Researcher (LangChain Agent)  
- MCP FireCrawl1  
- Anthropic Chat Model2  
- Think1 (toolThink)

**Node Details:**

- **When chat message received**  
  - Type: Chat Trigger (LangChain)  
  - Optional entry point for manual or chat-based initiation of research.  
  - Passes message to Researcher Agent.  
  - Edge cases: Webhook connectivity, message format errors.

- **Researcher**  
  - Type: LangChain Agent  
  - System message instructs research steps:  
    - Make exactly two FireCrawl calls to scrape competitor and pricing/statistics data.  
    - Build a structured blog brief with meta title, description, outline, image needs, key data, internal links, and Trigify positioning.  
    - Output the brief clearly for the Blog Writer Agent.  
  - Inputs: Topic title from Blog Status Manager Agent or chat trigger.  
  - Outputs: Complete blog brief in structured markdown.  
  - Edge cases: FireCrawl API failures, insufficient data, prompt errors.

- **MCP FireCrawl1**  
  - Type: FireCrawl MCP Client Tool  
  - Configured with endpoint URL for FireCrawl API (custom domain).  
  - Used twice by Researcher Agent for scraping.  
  - Edge cases: API rate limits, temporary unavailability.

- **Anthropic Chat Model2**  
  - Type: LangChain Chat Model (Claude Opus 4.5)  
  - Used by Researcher Agent to process and structure research data.  
  - Configured for large token limit (20,000) and no "thinking" mode.  
  - Edge cases: API timeouts, quota limits.

- **Think1**  
  - Type: ToolThink (LangChain)  
  - Utility node used for internal reasoning steps by Researcher Agent.  
  - No direct input/output connections externally.  
  - Edge cases: None specific.

---

#### 1.3 Blog Writer Agent

**Overview:**  
Generates the full, publish-ready blog post based on the detailed brief from the Researcher Agent, ensuring SEO optimization, internal linking, metadata, and strict formatting rules.

**Nodes Involved:**  
- Blog Writer Agent (LangChain Agent)  
- MCP FireCrawl  
- OpenAI Chat Model  
- Anthropic Chat Model  
- Think

**Node Details:**

- **Blog Writer Agent**  
  - Type: LangChain Agent  
  - System message:  
    - Acts as an expert SEO and AI-optimized content writer specialized in pillar/cluster strategy for Trigify.  
    - Writes the full blog post (no summaries).  
    - Enforces content rules: no em dashes, real source URLs for images, metadata character limits, and internal linking strategies.  
    - Outputs the entire article in Markdown format for direct publishing.  
    - Provides image delivery instructions with fallback URLs.  
  - Inputs: Blog brief from Researcher Agent, FireCrawl data, outputs from AI chat models.  
  - Outputs: Full blog post content.  
  - Edge cases: API rate limits, incomplete content generation, generation cutoff due to max tokens.

- **MCP FireCrawl**  
  - Type: FireCrawl MCP Client Tool  
  - Used for deep content research or fact verification during blog writing.  
  - Edge cases: Same as above.

- **OpenAI Chat Model**  
  - Type: LangChain Chat Model (GPT-5)  
  - Used to enhance writing quality and creativity.  
  - Configured for 90 seconds timeout, 20,000 tokens max, medium reasoning effort.  
  - Edge cases: API downtime, quota issues.

- **Anthropic Chat Model**  
  - Type: LangChain Chat Model (Claude Sonnet 4.5)  
  - Supports writing alongside OpenAI with large token allowance.  
  - "Thinking" enabled for deeper reasoning.  
  - Edge cases: Same as OpenAI.

- **Think**  
  - Type: ToolThink (LangChain)  
  - Used internally for additional reasoning during writing.  
  - No external inputs/outputs.  

---

#### 1.4 Linear Issue Creation

**Overview:**  
Posts the finalized blog content as a new issue in Linear, enabling editorial workflow and tracking of published or drafted blogs.

**Nodes Involved:**  
- Create an issue in Linear

**Node Details:**

- **Create an issue in Linear**  
  - Type: Linear Tool (n8n built-in)  
  - Creates a new issue with title and description fields dynamically set from AI-generated blog title and full blog content.  
  - Authenticated via OAuth2 credentials.  
  - Inputs: Full blog post content and metadata from Blog Writer Agent.  
  - Outputs: Confirmation of issue creation.  
  - Edge cases: Auth errors, API rate limits, title/content formatting restrictions.

---

#### 1.5 Google Sheets Integration

**Overview:**  
Reads and updates Google Sheets documents to synchronize blog strategy data and SEO reports with workflow progress.

**Nodes Involved:**  
- Get row(s) in sheet in Google Sheets- Strategy_State  
- Get row(s) in sheet in Google Sheets- SEO Report  
- Append or update row in sheet in Google Sheets

**Node Details:**  
(Details described above in 1.1 block)

---

### 3. Summary Table

| Node Name                                   | Node Type                              | Functional Role                                | Input Node(s)                            | Output Node(s)                  | Sticky Note                                                                                                                                    |
|---------------------------------------------|--------------------------------------|-----------------------------------------------|-----------------------------------------|--------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger                            | Schedule Trigger                     | Periodic workflow trigger                      | -                                       | Blog Status Manager Agent       |                                                                                                                                                |
| Blog Status Manager Agent                   | LangChain Agent                     | Manages blog lifecycle, topic prioritization  | Schedule Trigger, Linear issues, Sheets | Researcher                     | Manages full blog lifecycle, cross-references Linear & Sheets, selects next blog topic to research. See prompt for customization.              |
| Get many issues in Linear1                   | HTTP Request (GraphQL)               | Retrieves existing blog issues from Linear    | Blog Status Manager Agent                | Blog Status Manager Agent       |                                                                                                                                                |
| Get row(s) in sheet in Google Sheets- Strategy_State | Google Sheets Tool                   | Fetches blog strategy states                   | Blog Status Manager Agent                | Blog Status Manager Agent       |                                                                                                                                                |
| Get row(s) in sheet in Google Sheets- SEO Report | Google Sheets Tool                   | Fetches SEO report data                         | Blog Status Manager Agent                | Blog Status Manager Agent       |                                                                                                                                                |
| Append or update row in sheet in Google Sheets | Google Sheets Tool                   | Updates blog statuses and plans                | Blog Status Manager Agent                | -                              |                                                                                                                                                |
| When chat message received                  | LangChain Chat Trigger              | Optional manual trigger for research           | -                                       | Researcher                     |                                                                                                                                                |
| Researcher                                  | LangChain Agent                     | Performs focused research, creates blog briefs | Blog Status Manager Agent, chat trigger | Blog Writer Agent              | Conducts fast research via Firecrawl, outputs structured blog briefs. See prompt for details and edit location.                                |
| MCP FireCrawl1                              | FireCrawl MCP Client Tool           | Web scraping for blog research                  | Researcher                              | Researcher                     |                                                                                                                                                |
| Anthropic Chat Model2                       | LangChain Chat Model (Claude Opus) | Processes research data into structured briefs | Researcher                              | Researcher                     |                                                                                                                                                |
| Think1                                      | LangChain ToolThink                 | Internal reasoning during research             | Researcher                              | Researcher                     |                                                                                                                                                |
| Blog Writer Agent                           | LangChain Agent                     | Writes full, publish-ready blog posts          | Researcher, FireCrawl, AI models         | Create an issue in Linear       | Writes entire blog post with SEO and internal linking, no summaries. See prompt for detailed instructions and customization.                  |
| MCP FireCrawl                              | FireCrawl MCP Client Tool           | Web scraping for blog writing verification     | Blog Writer Agent                       | Blog Writer Agent              |                                                                                                                                                |
| OpenAI Chat Model                          | LangChain Chat Model (GPT-5)         | Enhances blog writing                           | Blog Writer Agent                       | Blog Writer Agent              |                                                                                                                                                |
| Anthropic Chat Model                       | LangChain Chat Model (Claude Sonnet) | Supports blog writing                           | Blog Writer Agent                       | Blog Writer Agent              |                                                                                                                                                |
| Think                                      | LangChain ToolThink                 | Internal reasoning during blog writing         | Blog Writer Agent                       | Blog Writer Agent              |                                                                                                                                                |
| Create an issue in Linear                   | Linear Tool                        | Creates new blog issues in Linear for tracking | Blog Writer Agent                       | -                              |                                                                                                                                                |
| Get row(s) in sheet in Google Sheets- SEO Report | Google Sheets Tool                   | Reads SEO report for new pillar planning        | Blog Status Manager Agent                | Blog Status Manager Agent       |                                                                                                                                                |
| Append or update row in sheet in Google Sheets | Google Sheets Tool                   | Updates Google Sheet with blog statuses         | Blog Status Manager Agent                | -                              |                                                                                                                                                |
| Sticky Note                                 | Sticky Note                       | Explains Blog Status Manager Agent role         | -                                       | -                              | Manages blog lifecycle, status updates, topic prioritization, prompt editing instructions.                                                      |
| Sticky Note1                                | Sticky Note                       | Explains Researcher Agent role                   | -                                       | -                              | Details research agent's role, Firecrawl calls, blog brief format, prompt editing.                                                             |
| Sticky Note2                                | Sticky Note                       | Explains Blog Writer Agent role                  | -                                       | -                              | Details blog writer's role, SEO optimization, full article writing, prompt editing, brand guidelines.                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set it to trigger weekly on Mondays, Tuesdays, and Wednesdays.

2. **Create HTTP Request Node for Linear Issues**  
   - Name: Get many issues in Linear1  
   - Method: POST  
   - URL: https://api.linear.app/graphql  
   - Body: GraphQL query to fetch first 50 issues with id, identifier, title  
   - Headers: Authorization with valid Linear API token.

3. **Create Google Sheets Nodes**  
   - Get row(s) in sheet in Google Sheets- Strategy_State  
     - Document ID and Sheet ID from your Google Sheets containing blog strategy.  
     - Use OAuth2 credentials.  
   - Get row(s) in sheet in Google Sheets- SEO Report  
     - Document and sheet IDs for SEO report data.  
     - Use OAuth2 credentials.  
   - Append or update row in sheet in Google Sheets  
     - Configure columns for blog status, titles, notes, dates, etc.  
     - Use matching column "current_pillar" for update.

4. **Create Blog Status Manager Agent (LangChain Agent)**  
   - Use LangChain Agent node.  
   - Paste the system message defining blog lifecycle management logic (provided in the workflow).  
   - Connect inputs from Schedule Trigger, Get many issues in Linear1, Google Sheets nodes.  
   - Outputs connect to Researcher node.

5. **Create Researcher Agent (LangChain Agent)**  
   - Paste the provided research system message with explicit two FireCrawl calls and blog brief template.  
   - Connect input from Blog Status Manager Agent or optional Chat Trigger.  
   - Connect output to Blog Writer Agent.  

6. **Create FireCrawl MCP Client Tool Nodes**  
   - MCP FireCrawl1 for Researcher Agent calls  
   - MCP FireCrawl for Blog Writer Agent calls  
   - Set endpoint URL to your FireCrawl API endpoint.  

7. **Create LangChain Chat Model Nodes**  
   - Anthropic Chat Model1 for Blog Status Manager Agent  
   - Anthropic Chat Model2 for Researcher Agent  
   - Anthropic Chat Model and OpenAI Chat Model for Blog Writer Agent  
   - Configure with appropriate credentials and model names (e.g., Claude Sonnet 4.5, Claude Opus 4.5, GPT-5).  
   - Adjust token limits and timeout settings as in original workflow.

8. **Create Blog Writer Agent (LangChain Agent)**  
   - Paste the detailed system message instructing full blog post writing with SEO and formatting rules.  
   - Input connected from Researcher Agent and AI models.  
   - Output connected to Create an issue in Linear node.

9. **Create Create an issue in Linear Node**  
   - Configure with valid Linear OAuth2 credentials.  
   - Map title and description fields dynamically from blog post content and metadata.  

10. **Optional: Create Chat Trigger Node**  
    - For manual invocation of Researcher Agent via chat message.  

11. **Create ToolThink Nodes (Think, Think1)**  
    - Add ToolThink nodes to support internal AI reasoning steps inside agents.  

12. **Connect all nodes according to data flow:**  
    - Schedule Trigger → Blog Status Manager Agent  
    - Blog Status Manager Agent → Get many issues in Linear1, Google Sheets nodes  
    - Blog Status Manager Agent → Researcher Agent  
    - Researcher Agent → MCP FireCrawl1, Anthropic Chat Model2, Think1  
    - Researcher Agent → Blog Writer Agent  
    - Blog Writer Agent → MCP FireCrawl, OpenAI Chat Model, Anthropic Chat Model, Think  
    - Blog Writer Agent → Create an issue in Linear  

13. **Set all credentials:**  
    - Google Sheets OAuth2  
    - Linear API OAuth2  
    - OpenAI API key  
    - Anthropic API key  
    - FireCrawl API endpoint and credentials if needed  

14. **Save and test workflow end-to-end.**

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                 | Context or Link                                                                                      |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| The agents (Blog Status Manager, Researcher, Blog Writer) are customizable via their system messages. Edit the prompts within each agent node to adjust behavior, priorities, and tone.                                                                                                      | Located in each LangChain Agent node under "System Message" in node options.                      |
| FireCrawl API is used for web scraping to gather real data for research and fact-checking. Avoid using temporary or base64 image links; always provide public source URLs for image referencing.                                                                                          | FireCrawl endpoint URLs are configured in MCP FireCrawl nodes.                                    |
| The workflow enforces strict SEO and formatting rules: no em dashes, metadata character limits, full article output (no summaries), and internal linking per pillar/cluster strategy.                                                                                                      | Detailed in Blog Writer Agent system message.                                                     |
| Linear integration allows blog content to be tracked as issues, bridging content creation and project management.                                                                                                                                                                          | Linear API GraphQL used for fetching and creating issues.                                         |
| Google Sheets serves as the central data store for blog statuses, SEO reports, and strategy state, enabling easy manual review and updates outside the workflow.                                                                                                                           | Sheets IDs and credentials must be set correctly for proper access.                               |
| For more on n8n LangChain nodes and FireCrawl integration, refer to official n8n documentation and FireCrawl API docs.                                                                                                                                                                     | https://docs.n8n.io, https://firecrawl.dev/docs                                                       |
| The workflow is designed for Trigify.io branding and content strategy but can be adapted to other brands by editing prompts and credentials.                                                                                                                                               | Prompts contain specific branding instructions that can be replaced.                              |

---

This documentation enables understanding, reproduction, and modification of the complete blog content automation workflow leveraging AI and integrations.