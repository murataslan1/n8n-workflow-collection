Automate News Discovery & Publishing with GPT-4, Google Search API & Slack

https://n8nworkflows.xyz/workflows/automate-news-discovery---publishing-with-gpt-4--google-search-api---slack-8360


# Automate News Discovery & Publishing with GPT-4, Google Search API & Slack

---

## 1. Workflow Overview

This workflow automates the discovery, generation, publishing, and notification of AI/enterprise automation news content. Its primary use case is to autonomously generate original, SEO-optimized news articles based on recent industry developments, publish them to a CMS, log results for tracking, and notify a Slack channel.

The logic is divided into these main functional blocks:

- **1.1 Input Scheduling & Query Generation**: Periodic trigger to generate unique search queries that have not been covered before.
- **1.2 Search & Filtering**: Use Google Custom Search API to find recent news articles, filter out problematic sources.
- **1.3 AI Article Generation**: Generate a fully original, SEO-optimized news article from the curated source material using GPT-4.
- **1.4 Data Preparation & Publishing**: Clean and format the AI-generated article data, then publish it to a CMS endpoint.
- **1.5 Logging & Notification**: Log published article metadata to Google Sheets and notify a Slack channel of successful publication.
- **1.6 Setup & Configuration Instructions**: Sticky notes providing setup guidance for Google Sheets, credentials, and API keys.

---

## 2. Block-by-Block Analysis

### 2.1 Input Scheduling & Query Generation

- **Overview:**  
  This block triggers the workflow daily at a specified hour and generates a unique search query within the AI/automation niche that has not been previously processed.

- **Nodes Involved:**  
  - Daily Schedule Trigger  
  - AI Agent  
  - Get row(s) in sheet in Google Sheets  
  - OpenAI Chat Model  

- **Node Details:**

  - **Daily Schedule Trigger**  
    - *Type & Role:* Schedule trigger node, initiates workflow every day at 7:00 AM.  
    - *Configuration:* Interval set to trigger at hour 7 daily.  
    - *Input/Output:* No input; outputs trigger event.  
    - *Edge Cases:* Workflow will not run if n8n instance is offline or scheduler disabled.

  - **AI Agent**  
    - *Type & Role:* LangChain AI agent node generating a unique search query.  
    - *Configuration:* Prompt requests a 3-5 word phrase related to AI/enterprise automation, excluding previously covered queries.  
    - *Input:* Triggered by schedule node.  
    - *Output:* Single string query for next search step.  
    - *Edge Cases:* Possible failure if input data or prompt malformed; fallback not configured.

  - **Get row(s) in sheet in Google Sheets**  
    - *Type & Role:* Google Sheets data retrieval tool.  
    - *Configuration:* Filters rows by the generated query phrase to check for duplicates.  
    - *Input:* Uses AI Agent’s generated search phrase as filter.  
    - *Output:* Rows from sheet matching the query (if any).  
    - *Edge Cases:* Google Sheets API auth errors, empty or no matching rows, rate limits.

  - **OpenAI Chat Model**  
    - *Type & Role:* Chat model node (GPT-4 turbo preview) for auxiliary AI processing.  
    - *Configuration:* Standard GPT-4 turbo preview with no special prompt configured here, acts as backend for AI Agent.  
    - *Input:* Connected as AI tool for AI Agent.  
    - *Output:* AI Agent responses.  
    - *Edge Cases:* API key limits, rate limits, malformed response.

---

### 2.2 Search & Filtering

- **Overview:**  
  This block performs a Google Custom Search for recent articles based on the AI-generated query, then filters out results from domains with strong anti-bot protections.

- **Nodes Involved:**  
  - Search Recent Articles  
  - Extract Best Article  
  - Skip problems  

- **Node Details:**

  - **Search Recent Articles**  
    - *Type & Role:* HTTP Request node querying Google Custom Search API.  
    - *Configuration:* Uses API key and custom search engine ID; queries last 7 days; limit 5 results.  
    - *Input:* Receives query from AI Agent output.  
    - *Output:* JSON with search results.  
    - *Edge Cases:* API key or quota errors, no results returned, malformed JSON.

  - **Extract Best Article**  
    - *Type & Role:* Code node extracting key data from search results.  
    - *Configuration:* Parses items array; extracts title, URL, snippet, hostname, and current timestamp as publish date.  
    - *Input:* Google Search API response.  
    - *Output:* Array of article objects with basic metadata.  
    - *Edge Cases:* Empty or malformed search results, missing fields.

  - **Skip problems**  
    - *Type & Role:* Code node filtering out articles from blacklisted domains known for anti-bot protection.  
    - *Configuration:* Filters out domains aibusiness.com, forbes.com, wsj.com, ft.com; falls back to first article snippet if all filtered out.  
    - *Input:* Extracted articles list.  
    - *Output:* Filtered list of articles for AI generation.  
    - *Edge Cases:* All articles blocked, fallback triggered; malformed URLs.

---

### 2.3 AI Article Generation

- **Overview:**  
  This block uses GPT-4 to generate an original, comprehensive, SEO-optimized news article based on filtered source article data.

- **Nodes Involved:**  
  - Generate Original Article  

- **Node Details:**

  - **Generate Original Article**  
    - *Type & Role:* LangChain OpenAI node with GPT-4 turbo-preview model.  
    - *Configuration:*  
      - Model: GPT-4 turbo-preview  
      - Max tokens: 4096  
      - Temperature: 0.7  
      - System prompt instructs expert content strategist to generate original news article with journalistic and SEO requirements (e.g., inverted pyramid, quotes, data points).  
      - Input message includes source material details (title, content snippet, source).  
    - *Input:* Filtered article data from previous block.  
    - *Output:* JSON-formatted original article with title, meta description, content, SEO metrics, word count, reading time, and other metadata.  
    - *Edge Cases:* API limits or timeouts, incomplete or malformed JSON output (handled in next block).

---

### 2.4 Data Preparation & Publishing

- **Overview:**  
  This block cleans and formats the AI-generated JSON article data, prepares publishing metadata, then publishes the article to a CMS via HTTP POST.

- **Nodes Involved:**  
  - Prepare Publishing Data1  
  - Publish to CMS1  

- **Node Details:**

  - **Prepare Publishing Data1**  
    - *Type & Role:* Code node to parse and clean GPT JSON output, extract article fields, and generate SEO metadata.  
    - *Configuration:*  
      - Extracts JSON from content, handling cases with code block markdown and incomplete JSON.  
      - Cleans escaped characters and spacing issues.  
      - Calculates actual word count based on cleaned text.  
      - Generates URL slug from title (lowercase, hyphenated, max length 60).  
      - Constructs metadata objects for SEO, category, image, etc.  
    - *Input:* GPT-4 generated JSON article string.  
    - *Output:* Structured object containing article data, publishing info, SEO metadata, and image info.  
    - *Edge Cases:* JSON parse errors (fallback extraction), missing fields, malformed content.

  - **Publish to CMS1**  
    - *Type & Role:* HTTP Request node to publish article to custom CMS endpoint.  
    - *Configuration:*  
      - POST request with JSON body mapping article data fields to CMS schema.  
      - Headers specify content-type application/json.  
      - On error, continues workflow to allow logging and notification.  
      - CMS webhook URL placeholder requires user replacement.  
    - *Input:* Prepared article and publishing data.  
    - *Output:* CMS response, expected to include article URL or status.  
    - *Edge Cases:* Network errors, CMS authentication or schema mismatches, webhook URL misconfiguration.

---

### 2.5 Logging & Notification

- **Overview:**  
  This block logs published article metadata to a Google Sheet for tracking and sends a notification message to a Slack channel.

- **Nodes Involved:**  
  - Log to Google Sheets2  
  - Send Slack Notification  

- **Node Details:**

  - **Log to Google Sheets2**  
    - *Type & Role:* Google Sheets node to append a new row with article metadata.  
    - *Configuration:*  
      - Appends data to sheet "ProcessedWorkflows" with columns: workflow_id, title, slug, query, published_at, SEO score, word count, featured image URL, and status.  
      - Google Sheets document ID and sheet name must be set by user.  
      - On error, continues workflow.  
    - *Input:* CMS publish response and article metadata.  
    - *Output:* Confirmation of row append.  
    - *Edge Cases:* Google Sheets API errors, permission issues, quota limits.

  - **Send Slack Notification**  
    - *Type & Role:* Slack node sends a formatted message to a specific channel.  
    - *Configuration:*  
      - Message contains article title, SEO metrics, meta description, SEO keyword, search volume, and a link to view the article.  
      - Channel ID must be specified.  
      - Uses Slack OAuth2 credential.  
      - On error, continues workflow.  
    - *Input:* Uses data from published article and logging nodes.  
    - *Output:* Slack message posted to channel.  
    - *Edge Cases:* Slack API auth failure, channel not found, rate limits.

---

### 2.6 Setup & Configuration Instructions

- **Overview:**  
  Sticky notes provide step-by-step instructions for setting up Google Sheets, API keys, credentials, and configuring nodes.

- **Nodes Involved:**  
  - 📋 Setup Instructions (Google Sheets setup)  
  - 🚀 Setup Instructions (overall workflow setup)

- **Node Details:**

  - **📋 Setup Instructions**  
    - *Type & Role:* Sticky note with detailed Google Sheets setup: creating sheet, headers, copying sheet ID, and updating nodes.  
    - *Content:* Instructions on naming Google Sheet "n8n Blog Tracker," sheet "ProcessedWorkflows," required headers, and credential setup.  

  - **🚀 Setup Instructions**  
    - *Type & Role:* Sticky note with overall workflow setup guidance: required APIs (OpenAI, Google Custom Search, Google Sheets OAuth2, Slack OAuth2), CMS endpoint configuration, scheduling, and features.  
    - *Content:* Comprehensive instructions for API keys, CMS URL, Google Sheets setup, and scheduling details.

---

## 3. Summary Table

| Node Name                 | Node Type                        | Functional Role                        | Input Node(s)                   | Output Node(s)                  | Sticky Note                                                                                                  |
|---------------------------|---------------------------------|-------------------------------------|--------------------------------|--------------------------------|--------------------------------------------------------------------------------------------------------------|
| 🚀 Setup Instructions     | Sticky Note                     | Overall workflow setup instructions | None                           | None                           | See detailed setup instructions for APIs, credentials, CMS endpoint, scheduling, and features.               |
| 📋 Setup Instructions     | Sticky Note                     | Google Sheets setup instructions    | None                           | None                           | Details Google Sheets creation, headers, sheet ID extraction, and credential configuration.                   |
| Daily Schedule Trigger    | Schedule Trigger                | Daily workflow start trigger         | None                           | AI Agent                      |                                                                                                              |
| AI Agent                 | LangChain Agent                 | Generate unique AI/automation query  | Daily Schedule Trigger, OpenAI Chat Model | Search Recent Articles         |                                                                                                              |
| OpenAI Chat Model         | LangChain LM Chat OpenAI         | Backend AI model for AI Agent        | AI Agent (ai_tool)             | AI Agent                      |                                                                                                              |
| Get row(s) in sheet in Google Sheets | Google Sheets Tool               | Check for duplicate queries          | AI Agent                      | AI Agent                      |                                                                                                              |
| Search Recent Articles    | HTTP Request                   | Google Custom Search API call        | AI Agent                      | Extract Best Article           |                                                                                                              |
| Extract Best Article      | Code                          | Parse search results to extract articles | Search Recent Articles        | Skip problems                 |                                                                                                              |
| Skip problems             | Code                          | Filter out problematic domains       | Extract Best Article           | Generate Original Article      |                                                                                                              |
| Generate Original Article | LangChain OpenAI               | Generate original news article       | Skip problems                 | Prepare Publishing Data1       |                                                                                                              |
| Prepare Publishing Data1  | Code                          | Parse and clean GPT-4 output, prepare metadata | Generate Original Article    | Publish to CMS1               |                                                                                                              |
| Publish to CMS1           | HTTP Request                  | Publish article to CMS                | Prepare Publishing Data1       | Log to Google Sheets2          |                                                                                                              |
| Log to Google Sheets2     | Google Sheets                 | Log published article metadata       | Publish to CMS1               | Send Slack Notification        |                                                                                                              |
| Send Slack Notification   | Slack                        | Notify channel of new published article | Log to Google Sheets2         | None                         |                                                                                                              |

---

## 4. Reproducing the Workflow from Scratch

1. **Create the Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 7:00 AM.

2. **Create the AI Agent Node**  
   - Type: LangChain Agent  
   - Configure prompt: Generate a unique 3-5 word search query in AI/enterprise automation niche, excluding previously covered queries.  
   - Configure to use OpenAI Chat Model as AI tool.

3. **Create OpenAI Chat Model Node**  
   - Type: LangChain LM Chat OpenAI  
   - Model: gpt-4-turbo-preview  
   - No special prompt needed (used by AI Agent).  
   - Provide OpenAI API credentials.

4. **Create Google Sheets Tool Node**  
   - Name: Get row(s) in sheet in Google Sheets  
   - Use to check if generated query exists in "ProcessedWorkflows" sheet.  
   - Configure with Google Sheets OAuth2 credentials.  
   - Set document ID and sheet name ("gid=0" for first sheet).  
   - Filter rows by "query" column matching AI Agent output.

5. **Create HTTP Request Node for Google Search**  
   - Name: Search Recent Articles  
   - Method: GET  
   - URL: https://www.googleapis.com/customsearch/v1  
   - Query Parameters:  
     - key: your Google API key  
     - cx: your custom search engine ID  
     - q: AI Agent generated query  
     - dateRestrict: d7 (last 7 days)  
     - num: 5  
   - Handle JSON response.

6. **Create Code Node to Extract Articles**  
   - Name: Extract Best Article  
   - Parse search API response, extract title, url, snippet, source domain, and current datetime.

7. **Create Code Node to Filter Blocked Domains**  
   - Name: Skip problems  
   - Filter out articles from domains: aibusiness.com, forbes.com, wsj.com, ft.com.  
   - If all blocked, fallback to first article snippet.

8. **Create LangChain OpenAI Node for Article Generation**  
   - Name: Generate Original Article  
   - Model: gpt-4-turbo-preview  
   - Max tokens: 4096  
   - Temperature: 0.7  
   - System prompt: Expert content strategist instructions for creating original, SEO-optimized, journalistic news article with specific structure and formatting.  
   - Input: filtered article data.

9. **Create Code Node for Data Preparation**  
   - Name: Prepare Publishing Data1  
   - Parse GPT JSON output, fix incomplete JSON if needed.  
   - Clean article content formatting.  
   - Calculate word count and reading time.  
   - Generate slug from title.  
   - Compose metadata objects.

10. **Create HTTP Request Node to Publish Article**  
    - Name: Publish to CMS1  
    - Method: POST  
    - URL: CMS webhook URL (replace placeholder).  
    - Headers: Content-Type application/json.  
    - JSON body: Map prepared article fields to CMS schema (title, slug, meta description, content, SEO fields, tags, image URL, etc.).  
    - Use credentials or auth as required by CMS.

11. **Create Google Sheets Node to Log Data**  
    - Name: Log to Google Sheets2  
    - Operation: Append row to "ProcessedWorkflows" sheet.  
    - Columns: workflow_id, title, slug, query, published_at, seo_score, word_count, featured, status.  
    - Use Google Sheets OAuth2 credentials.  
    - Specify document ID and sheet name.

12. **Create Slack Node to Send Notification**  
    - Name: Send Slack Notification  
    - Authentication: Slack OAuth2  
    - Channel: specific Slack channel ID  
    - Message: Formatted text including article title, SEO metrics, meta description, focus keyword, and article URL.

13. **Add Sticky Notes**  
    - Add two sticky notes with detailed setup instructions: overall workflow and Google Sheets setup.

14. **Connect Nodes in Sequence:**  
    - Daily Schedule Trigger → AI Agent  
    - AI Agent → Get row(s) in sheet in Google Sheets (filter)  
    - AI Agent → Search Recent Articles  
    - Search Recent Articles → Extract Best Article  
    - Extract Best Article → Skip problems  
    - Skip problems → Generate Original Article  
    - Generate Original Article → Prepare Publishing Data1  
    - Prepare Publishing Data1 → Publish to CMS1  
    - Publish to CMS1 → Log to Google Sheets2  
    - Log to Google Sheets2 → Send Slack Notification  
    - OpenAI Chat Model → AI Agent (ai_tool connection)

15. **Configure Credentials:**  
    - OpenAI API (GPT-4) credentials for AI nodes.  
    - Google Sheets OAuth2 credentials for Google Sheets nodes.  
    - Google Custom Search API key and Custom Search Engine ID in HTTP Request node.  
    - Slack OAuth2 credentials for Slack node.  
    - CMS webhook URL and any authentication required.

---

## 5. General Notes & Resources

| Note Content                                                                                                                      | Context or Link                                                               |
|-----------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| Workflow requires GPT-4 access and Google Custom Search API with quota for 5 queries/day or more.                                 | OpenAI & Google API setup.                                                    |
| Google Sheet must be created with specified headers and shared with Google OAuth2 user.                                           | Google Sheets setup instructions sticky note.                                |
| Slack notifications require a valid Slack OAuth2 app with permission to post in the specified channel.                           | Slack OAuth2 setup.                                                           |
| CMS webhook URL must be replaced with actual endpoint accepting JSON in specified schema.                                         | CMS integration instructions in sticky notes.                                |
| The workflow uses fallback mechanisms for parsing incomplete or malformed JSON from GPT output and for blocked domains in search. | Robustness and error handling notes.                                         |
| Scheduling can be adjusted in the Schedule Trigger node to run more or less frequently.                                            | Scheduling flexibility note.                                                  |
| The AI Agent’s prompt enforces unique queries to reduce duplicate content.                                                        | Duplicate avoidance strategy.                                                 |
| SEO optimization includes focus keyphrase, reading time estimation, and word count calculation for content quality metrics.      | SEO best practices embedded in workflow.                                     |
| Article generation enforces journalistic style with sections and quotes for professional tone.                                    | Content style instructions in Generate Original Article node.                |
| Source attribution uses numeric citation style [1], [2], etc.                                                                     | Journalistic citation note.                                                  |

---

*Disclaimer: The provided text exclusively originates from an automated workflow built with n8n, an integration and automation tool. It strictly complies with content policies and contains no illegal, offensive, or protected material. All processed data are legal and publicly available.*