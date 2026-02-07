AI-Powered Reddit Monitoring with Sentiment Analysis and Growth Insights Dashboard

https://n8nworkflows.xyz/workflows/ai-powered-reddit-monitoring-with-sentiment-analysis-and-growth-insights-dashboard-11182


# AI-Powered Reddit Monitoring with Sentiment Analysis and Growth Insights Dashboard

### 1. Workflow Overview

This workflow is designed for **AI-Powered Reddit Monitoring with Sentiment Analysis and Growth Insights Dashboard**. Its primary purpose is to automate the monitoring of Reddit mentions related to a company or product, classify and analyze these mentions using AI for sentiment and intent, and store the enriched data for leadership, product, marketing, and support teams. It facilitates a continuous voice-of-customer engine by integrating email alerts, Reddit data extraction, AI classification, and a dashboard interface.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Scheduling**: Periodic trigger and Gmail node to fetch incoming alerts from F5Bot about Reddit mentions.
- **1.2 Initial AI Classification**: Classify the raw mention text from emails using OpenAI for category and sentiment.
- **1.3 Data Storage and Looping**: Store initial classified mentions in Supabase and iterate over items for further processing.
- **1.4 Reddit Conversation Extraction**: Fetch the full Reddit post and all its comments related to the mention.
- **1.5 Markdown Formatting of Comments**: Convert nested Reddit comments into Markdown format recursively.
- **1.6 Advanced AI Insight Analysis**: Use OpenAI to analyze the entire Reddit conversation (post + comments) for insightful signals relevant to strategic teams.
- **1.7 Summary Storage and Webhook Response**: Store the AI-generated insights back into Supabase and respond to dashboard queries via webhook.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Scheduling

- **Overview:**  
  This block triggers the workflow every hour and fetches all relevant emails from a Gmail inbox that come from F5Bot, containing Reddit mention alerts.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Gmail  

- **Node Details:**

  - **Schedule Trigger**  
    - Type: `scheduleTrigger`  
    - Role: Starts the workflow every hour automatically.  
    - Configuration: Interval set to 1 hour.  
    - Inputs: None  
    - Outputs: Connects to Gmail node.  
    - Edge Cases: Scheduler downtime could delay email fetch; time zone considerations.  

  - **Gmail**  
    - Type: `gmail`  
    - Role: Retrieves emails filtered by sender (admin@f5bot.com) and received within the last hour.  
    - Configuration: Filters emails from "admin@f5bot.com" received after current time minus 1 hour; fetches all matching emails.  
    - Inputs: Trigger from Schedule Trigger.  
    - Outputs: Sends email data to "Loop Over Items" for batch processing.  
    - Edge Cases: Gmail API quota limits, OAuth token expiration, unexpected email format changes.  

---

#### 2.2 Initial AI Classification

- **Overview:**  
  Classify each email mention's content into a category and sentiment using OpenAI’s GPT-5 model based on a detailed system prompt tailored for strategic social intelligence analysis.

- **Nodes Involved:**  
  - Loop Over Items  
  - OpenAI  

- **Node Details:**

  - **Loop Over Items**  
    - Type: `splitInBatches`  
    - Role: Processes each email mention individually to avoid API overload and maintain manageable payloads.  
    - Configuration: Default batch size.  
    - Inputs: Emails from Gmail.  
    - Outputs: Sends single email mention to OpenAI node.  
    - Edge Cases: Large batch size could cause timeouts; empty batch input if Gmail returns none.  

  - **OpenAI**  
    - Type: `@n8n/n8n-nodes-langchain.openAi`  
    - Role: AI-driven classification of Reddit mention email content into predefined categories and sentiment.  
    - Configuration:  
      - Model: GPT-5 (latest version)  
      - System prompt: Detailed instructions for social intelligence analysis tailored to the company context.  
      - User message: Extracts mention text from email HTML, processed by expressions to clean and isolate the content.  
      - Output: JSON with fields `Category`, `Sentiment`, and `Reasoning`.  
    - Inputs: Single email mention JSON.  
    - Outputs: Sends classification result to "Create a row" for storage.  
    - Edge Cases: API rate limits, prompt misinterpretation if email format changes, model latency.  
    - Version: Requires n8n nodes supporting Langchain OpenAI integration (v1.6+).  

---

#### 2.3 Data Storage and Looping

- **Overview:**  
  Store the initial classification results in a Supabase database table `all_mentions` and loop back to process additional items.

- **Nodes Involved:**  
  - Create a row (Supabase)  
  - Loop Over Items (reused)  

- **Node Details:**

  - **Create a row**  
    - Type: `supabase`  
    - Role: Insert a new record into Supabase `all_mentions` table with metadata and AI classification of the mention.  
    - Configuration:  
      - Fields extracted from Gmail email and OpenAI classification, including title, body, link, account, posted_at, category, sentiment, and reasoning.  
      - Uses complex expressions to decode URLs and parse email content.  
    - Inputs: AI classification output from OpenAI node.  
    - Outputs: Connects back to Loop Over Items node to continue processing.  
    - Edge Cases: Supabase API errors, data schema mismatches, network issues.  

---

#### 2.4 Reddit Conversation Extraction

- **Overview:**  
  When a webhook event triggers (e.g., user interaction), retrieve stored mention data from Supabase, fetch the Reddit post and all comments for deeper context.

- **Nodes Involved:**  
  - Webhook  
  - Get a row (Supabase)  
  - Get a post (Reddit)  
  - Get many comments in a post (Reddit)  

- **Node Details:**

  - **Webhook**  
    - Type: `webhook`  
    - Role: Receives POST requests, typically from the dashboard UI, to fetch detailed mention data.  
    - Configuration: Custom path, POST HTTP method, response mode set to responseNode.  
    - Inputs: External HTTP POST request with mention ID payload.  
    - Outputs: Passes mention ID to "Get a row".  
    - Edge Cases: Unauthorized requests, invalid payload, webhook downtime.  

  - **Get a row**  
    - Type: `supabase`  
    - Role: Retrieve a mention record from `all_mentions` Supabase table by ID.  
    - Configuration: Filter by `id` equals webhook payload.  
    - Inputs: Webhook data.  
    - Outputs: Passes mention data to "Get a post".  
    - Edge Cases: Missing record, Supabase connection errors.  

  - **Get a post**  
    - Type: `reddit`  
    - Role: Fetch the main Reddit post details for the mention.  
    - Configuration:  
      - Post ID extracted dynamically from stored mention link.  
      - Subreddit extracted from mention account field.  
    - Inputs: Mention data from Supabase.  
    - Outputs: Sends post data to "Get many comments in a post".  
    - Edge Cases: Reddit API rate limits, invalid IDs, OAuth expiration.  

  - **Get many comments in a post**  
    - Type: `reddit`  
    - Role: Fetch all comments under the Reddit post.  
    - Configuration: Post ID and subreddit same as "Get a post", returns all comments without limit.  
    - Inputs: Post data.  
    - Outputs: Sends raw comments to "Code in JavaScript2".  
    - Edge Cases: Large comment threads may cause timeout; API quota limits.  

---

#### 2.5 Markdown Formatting of Comments

- **Overview:**  
  Transform the nested Reddit comments into a clean Markdown string with indentation reflecting reply depth for easier AI consumption.

- **Nodes Involved:**  
  - Code in JavaScript2  

- **Node Details:**

  - **Code in JavaScript2**  
    - Type: `code` (JavaScript)  
    - Role: Recursive function to convert Reddit comments and replies into indented Markdown format.  
    - Configuration:  
      - Skips deleted or invalid comments.  
      - Cleans newlines and excessive spaces.  
      - Builds permalink URLs for authors.  
      - Handles nested replies recursively.  
    - Inputs: Raw Reddit comments from "Get many comments in a post".  
    - Outputs: Single JSON containing Markdown string of entire comment tree.  
    - Edge Cases: Unexpected comment structures, very deep nesting, missing permalink data.  

---

#### 2.6 Advanced AI Insight Analysis

- **Overview:**  
  Analyze the entire Reddit discussion (post plus formatted comments) to extract actionable insights, themes, and sentiment for business teams.

- **Nodes Involved:**  
  - Message a model (OpenAI)  

- **Node Details:**

  - **Message a model**  
    - Type: `@n8n/n8n-nodes-langchain.openAi`  
    - Role: Generate strategic insights from full Reddit thread using GPT-5 with a detailed prompt for an "Elite Insight Analyst".  
    - Configuration:  
      - Input: Concatenates post text and Markdown comments.  
      - Output: Bullet-pointed structured analysis covering topic summary, key insights, actionable signals, and sentiment snapshot.  
      - Tone: Neutral, concise, strategic.  
    - Inputs: Markdown from "Code in JavaScript2" and post text from "Get a post".  
    - Outputs: Send analysis text to "Respond to Webhook" and "Update a row".  
    - Edge Cases: API delays, response truncation, malformed input strings.  

---

#### 2.7 Summary Storage and Webhook Response

- **Overview:**  
  Store the AI-generated summary back in Supabase and respond with the summary text to the original webhook caller (e.g., dashboard UI).

- **Nodes Involved:**  
  - Update a row (Supabase)  
  - Respond to Webhook  

- **Node Details:**

  - **Update a row**  
    - Type: `supabase`  
    - Role: Update the existing mention record with the AI-generated thread summary and raw thread content in Markdown.  
    - Configuration:  
      - Filters by mention ID and link.  
      - Updates fields `thread_summary` and `raw_full_thread`.  
    - Inputs: AI analysis from "Message a model" and Markdown from "Code in JavaScript2".  
    - Outputs: None (workflow end).  
    - Edge Cases: Partial updates, Supabase API limits.  

  - **Respond to Webhook**  
    - Type: `respondToWebhook`  
    - Role: Send AI insight summary as HTTP response with `text/html` content type.  
    - Configuration:  
      - Responds with the first text content from AI analysis JSON output.  
    - Inputs: AI analysis output.  
    - Outputs: HTTP response to webhook caller.  
    - Edge Cases: Response size limits, header misconfiguration.  

---

### 3. Summary Table

| Node Name               | Node Type                         | Functional Role                                         | Input Node(s)            | Output Node(s)                | Sticky Note                                                                                          |
|-------------------------|----------------------------------|---------------------------------------------------------|--------------------------|------------------------------|----------------------------------------------------------------------------------------------------|
| Schedule Trigger         | scheduleTrigger                  | Triggers workflow every hour                             | None                     | Gmail                        | Step 1: Check inbox for alerts from F5bot every hour                                              |
| Gmail                   | gmail                           | Fetch emails from F5Bot alerts in inbox                  | Schedule Trigger          | Loop Over Items              | Step 1: Check inbox for alerts from F5bot every hour                                              |
| Loop Over Items          | splitInBatches                  | Process each email mention individually                  | Gmail, Create a row       | OpenAI, (loop back to Gmail) | Step 2: Classify the conversation and determine its sentiment                                     |
| OpenAI                  | @n8n/n8n-nodes-langchain.openAi | Classify mentions into category and sentiment            | Loop Over Items           | Create a row                 | Step 2: Classify the conversation and determine its sentiment                                     |
| Create a row            | supabase                        | Store initial mention and classification                 | OpenAI                    | Loop Over Items              | Step 3: Store the data                                                                            |
| Webhook                 | webhook                        | Receive external request to fetch detailed mention data  | External HTTP POST        | Get a row                   | Step 4: When the user clicks on "AI Summary" get the relevant data                                |
| Get a row               | supabase                        | Retrieve mention record by ID                             | Webhook                   | Get a post                   | Step 4: When the user clicks on "AI Summary" get the relevant data                                |
| Get a post              | reddit                         | Fetch Reddit post details                                | Get a row                 | Get many comments in a post  | Fetch the entire conversation: Reddit post + comments                                            |
| Get many comments in a post | reddit                         | Fetch all comments from Reddit post                      | Get a post                | Code in JavaScript2          | Fetch the entire conversation: Reddit post + comments                                            |
| Code in JavaScript2      | code                           | Convert Reddit comments into Markdown format             | Get many comments in a post | Message a model              | Extract insightful signals for leadership, product, marketing, and support teams.                 |
| Message a model          | @n8n/n8n-nodes-langchain.openAi | Generate strategic insights and summary                   | Code in JavaScript2       | Respond to Webhook, Update a row | Extract insightful signals for leadership, product, marketing, and support teams.                 |
| Respond to Webhook       | respondToWebhook                | Send AI summary back as HTTP response                     | Message a model           | None                        | Store the summary                                                                                |
| Update a row            | supabase                        | Update mention with AI summary and raw thread content    | Message a model           | None                        | Store the summary                                                                                |
| Sticky Note              | stickyNote                     | Comment: Step 1 explanation                               | None                     | None                        | Step 1: Check inbox for alerts from F5bot every hour                                              |
| Sticky Note1             | stickyNote                     | Comment: Step 2 explanation                               | None                     | None                        | Step 2: Classify the conversation and determine its sentiment                                     |
| Sticky Note2             | stickyNote                     | Comment: Fetch entire conversation                        | None                     | None                        | Fetch the entire conversation: Reddit post + comments                                            |
| Sticky Note3             | stickyNote                     | Comment: Extract insightful signals                       | None                     | None                        | Extract insightful signals for leadership, product, marketing, and support teams.                 |
| Sticky Note4             | stickyNote                     | Comment: Step 3 explanation                               | None                     | None                        | Step 3: Store the data                                                                            |
| Sticky Note5             | stickyNote                     | Comment: Store the summary                                | None                     | None                        | Store the summary                                                                                |
| Sticky Note6             | stickyNote                     | Comment: Step 4 explanation                               | None                     | None                        | Step 4: When the user clicks on "AI Summary" get the relevant data                                |
| Sticky Note7             | stickyNote                     | General explanation and setup notes                       | None                     | None                        | Why This Workflow Is Useful; Requirements; Setup guide with links to F5Bot and WeWeb             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: `scheduleTrigger`  
   - Configuration: Set interval to every 1 hour.  
   - Connect to Gmail node.

2. **Add a Gmail node:**  
   - Type: `gmail`  
   - Credentials: Connect Gmail OAuth2 credentials.  
   - Operation: Get all emails.  
   - Filter: Sender equals `admin@f5bot.com`, and received after the current time minus 1 hour (expression `{{$now.minus(1,"hour")}}`).  
   - Connect output to "Loop Over Items".

3. **Add a Loop Over Items node:**  
   - Type: `splitInBatches`  
   - Use default batch size.  
   - Connect input from Gmail node.  
   - Connect first output branch to OpenAI node.

4. **Add an OpenAI node for initial classification:**  
   - Type: `@n8n/n8n-nodes-langchain.openAi`  
   - Credentials: Connect OpenAI API key.  
   - Model: Select GPT-5.  
   - System prompt: Use the provided detailed prompt instructing classification into categories and sentiment.  
   - User message: Extract mention text from email HTML using expressions:  
     - Example: `={{ $json.html.split('\n')[3].removeTags().split(': ')[1].toString()}}` for title, and similarly for body.  
   - Enable JSON output.  
   - Connect output to Create a row node.

5. **Add a Supabase “Create a row” node:**  
   - Credentials: Connect Supabase API credentials.  
   - Table: `all_mentions` (create this table with fields: id, title, body, link, account, posted_at, category, sentiment, classification_reasoning).  
   - Map fields from Gmail and OpenAI outputs, including URL decoding logic for the link.  
   - Connect output back to Loop Over Items to continue processing.

6. **Add a Webhook node:**  
   - Type: `webhook`  
   - Set method to POST.  
   - Define a unique webhook path (e.g., `8bc532ac-315a-4987-9f21-3d48c50f2b99`).  
   - Set response mode to responseNode.  
   - Connect output to "Get a row" node.

7. **Add a Supabase “Get a row” node:**  
   - Credentials: Supabase API.  
   - Table: `all_mentions`.  
   - Filter by `id` from webhook POST body.  
   - Connect output to "Get a post".

8. **Add a Reddit “Get a post” node:**  
   - Credentials: Reddit OAuth2 API.  
   - Extract subreddit and postId from the mention record using expressions:  
     - postId from link URL path.  
     - subreddit from account field.  
   - Connect output to “Get many comments in a post”.

9. **Add a Reddit “Get many comments in a post” node:**  
   - Credentials: Reddit OAuth2 API.  
   - Use postId and subreddit from previous node.  
   - Return all comments.  
   - Connect output to “Code in JavaScript2”.

10. **Add a Code node (“Code in JavaScript2”):**  
    - Type: `code` (JavaScript)  
    - Insert recursive function to convert nested comments to Markdown with author links and indentation.  
    - Input: comments array from Reddit.  
    - Output: Single JSON with `markdown` string.  
    - Connect output to “Message a model”.

11. **Add an OpenAI node (“Message a model”) for insight analysis:**  
    - Credentials: OpenAI API.  
    - Model: GPT-5.  
    - System prompt: Detailed instructions for extracting strategic insights and formatting output in bullet points.  
    - User message: Concatenate main post text and markdown comments using expressions.  
    - Connect outputs to Respond to Webhook and Update a row nodes.

12. **Add a Supabase “Update a row” node:**  
    - Credentials: Supabase API.  
    - Table: `all_mentions`.  
    - Filter by mention ID and link.  
    - Update fields: `thread_summary` with AI insight text and `raw_full_thread` with concatenated post text + Markdown comments.  
    - Connect output to nowhere (end).

13. **Add a Respond to Webhook node:**  
    - Type: `respondToWebhook`  
    - Response Headers: Set `Content-Type` to `text/html`.  
    - Response Body: Use AI analysis text from "Message a model" output.  
    - Connect output to end.

14. **Add Sticky Notes** for clarity and documentation at each major step as per the provided notes.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                                      |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Reddit is a **goldmine** for user intelligence and high-intent leads, but manually tracking subreddits is time-consuming. This workflow automates the process to save time while maintaining authentic engagement. It surfaces what users love, dislike, want changed, and competitor comparisons. Helps build a continuous voice-of-customer engine for product, marketing, sales, and support decisions. | General workflow purpose and value proposition.                                                                    |
| Requirements: F5Bot account (free), Gmail integration, OpenAI API key, Supabase project, WeWeb (free).                                                                                                                                                                                                                                                                                                               | Setup prerequisites.                                                                                                |
| Setup steps include importing the workflow, setting F5Bot email alerts, connecting Gmail, modifying AI prompts with company-specific data, creating Supabase tables with specified schema, connecting Supabase, and linking webhook to WeWeb dashboard. Detailed guide available.                                                                                                                                    | Setup instructions and reference: https://marketplace.weweb.io/projects/9a2048a6-8702-4606-8320-948db5962e88/      |
| Supabase table schema includes fields for mention metadata, category, sentiment, reasoning, raw thread content, and AI-generated summaries.                                                                                                                                                                                                                                                                          | Database design note.                                                                                               |
| F5Bot website for Reddit alert emails: https://f5bot.com                                                                                                                                                                                                                                                                                                                                                              | External integration reference.                                                                                     |
| WeWeb dashboard integration to visualize AI summaries and mentions.                                                                                                                                                                                                                                                                                                                                                  | UI integration reference.                                                                                           |

---

**Disclaimer:** The provided text is exclusively derived from an n8n automated workflow. This processing strictly respects content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.