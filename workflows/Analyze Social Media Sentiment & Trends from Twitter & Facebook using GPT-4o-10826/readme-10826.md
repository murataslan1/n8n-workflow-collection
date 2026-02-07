Analyze Social Media Sentiment & Trends from Twitter & Facebook using GPT-4o

https://n8nworkflows.xyz/workflows/analyze-social-media-sentiment---trends-from-twitter---facebook-using-gpt-4o-10826


# Analyze Social Media Sentiment & Trends from Twitter & Facebook using GPT-4o

### 1. Workflow Overview

This workflow, titled **"AI-Powered Cross-Platform Audience Sentiment & Trend Analyzer"**, is designed to fetch social media data from Twitter (X) and Facebook, unify the datasets, perform AI-driven sentiment and keyword analysis using GPT-4o, and generate a polished summary report emailed to the marketing team. It also logs any API or runtime errors encountered during execution into Google Sheets for monitoring.

The workflow is logically divided into the following blocks:

- **1.1 Data Collection Layer:** Fetch recent mentions from Twitter and recent comments from Facebook.
- **1.2 Dataset Merging and Validation:** Merge and validate raw data streams into a unified structure.
- **1.3 Data Consolidation:** Normalize and standardize data into a consistent JSON format.
- **1.4 AI Sentiment & Keyword Analysis:** Use GPT-4o to analyze sentiment and extract keywords/trends.
- **1.5 AI Output Parsing:** Clean and parse AI-generated JSON output.
- **1.6 AI Summary Generation:** Convert structured analysis into a visually rich HTML summary.
- **1.7 Email Delivery:** Send the summary report via Gmail to marketing stakeholders.
- **1.8 Error Logging:** Log any workflow or API errors into Google Sheets for audit and debugging.

---

### 2. Block-by-Block Analysis

#### 2.1 Data Collection Layer

**Overview:**  
This block fetches the raw social media data: recent mentions from Twitter (X) and recent post comments from a specific Facebook page.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Fetch Recent Mentions (X API)  
- Fetch Recent Facebook Comments

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Starts the workflow manually on demand.  
  - *Configuration:* No parameters needed.  
  - *Input:* Manual user trigger.  
  - *Output:* Triggers both social media fetch nodes in parallel.  
  - *Edge Cases:* N/A

- **Fetch Recent Mentions (X API)**  
  - *Type:* HTTP Request  
  - *Role:* Calls Twitter API v2 to get user mentions.  
  - *Configuration:*  
    - URL: `https://api.x.com/2/users/1380391508860268549/mentions` with tweet fields: created_at, text, public_metrics, author_id.  
    - Auth: Predefined Twitter OAuth2 credentials.  
  - *Input:* Trigger from Manual Trigger.  
  - *Output:* JSON array of recent mentions.  
  - *Edge Cases:* Authentication failure, API rate limits, no mentions found, malformed response.

- **Fetch Recent Facebook Comments**  
  - *Type:* Facebook Graph API  
  - *Role:* Fetches posts from a Facebook page and their comments with detailed fields.  
  - *Configuration:*  
    - Node ID: `230476031170639` (Facebook page).  
    - Edge: `posts` with fields including messages, comments, reactions, likes, etc.  
    - Graph API version: v23.0  
    - Auth: Facebook Graph API credentials.  
  - *Input:* Trigger from Manual Trigger.  
  - *Output:* JSON array of posts and nested comments.  
  - *Edge Cases:* Authentication failure, permission errors, API limits, empty posts or comments.

---

#### 2.2 Dataset Merging and Validation

**Overview:**  
Merges the responses from Twitter and Facebook into a single data stream and validates the integrity of the responses before proceeding.

**Nodes Involved:**  
- Merge Platform Datasets  
- Validate API Response Integrity  
- Log Errors in Google Sheets (error handling branch)

**Node Details:**

- **Merge Platform Datasets**  
  - *Type:* Merge  
  - *Role:* Combines Twitter and Facebook API results into one merged output.  
  - *Configuration:* Default merge (no special mode).  
  - *Input:* Outputs from Twitter and Facebook fetch nodes.  
  - *Output:* Combined array containing both platforms’ data.  
  - *Edge Cases:* One API returns no data, or data format changes.

- **Validate API Response Integrity**  
  - *Type:* If (Conditional)  
  - *Role:* Checks if the merged data contains essential fields (`data.id`) to confirm validity.  
  - *Configuration:* Conditions check if the first data item has a non-empty `id` field or a fallback condition true.  
  - *Input:* From merged datasets.  
  - *Output:* Passes valid data to the consolidation node; routes invalid data to error logging.  
  - *Edge Cases:* Empty responses, malformed JSON, missing fields.

- **Log Errors in Google Sheets**  
  - *Type:* Google Sheets Append  
  - *Role:* Logs invalid API responses or errors for audit.  
  - *Configuration:* Appends error ID and error description into a specific Google Sheets document and sheet.  
  - *Credentials:* Google Sheets OAuth2.  
  - *Input:* From failed validation.  
  - *Output:* None (terminal for errors).  
  - *Edge Cases:* Google Sheets API quota, permission errors.

---

#### 2.3 Data Consolidation

**Overview:**  
Transforms the merged raw data into a unified, normalized JSON array with consistent fields for downstream AI analysis.

**Nodes Involved:**  
- Consolidate Mentions & Comments

**Node Details:**

- **Consolidate Mentions & Comments**  
  - *Type:* Code (JavaScript)  
  - *Role:*  
    - Iterates over Twitter mentions and Facebook comments.  
    - Normalizes dates to ISO format.  
    - Extracts key fields: platform, post IDs, author info, message text, created timestamps, likes, reactions, links, and placeholders for sentiment.  
  - *Key Expressions:*  
    - Uses `$input.all()` to process all input items.  
    - Checks for Twitter or Facebook specific data structures.  
    - Constructs a unified array with consistent attribute names.  
  - *Input:* Validated merged data.  
  - *Output:* JSON with `unified_comments`, total counts, and platform-wise summary.  
  - *Edge Cases:* Missing or malformed dates, missing fields, empty comments or mentions.

---

#### 2.4 AI Sentiment & Keyword Analysis

**Overview:**  
Uses GPT-4o model to analyze the consolidated dataset for sentiment classification and keyword trend extraction.

**Nodes Involved:**  
- Configure GPT-4o Model  
- Perform Sentiment & Keyword Analysis

**Node Details:**

- **Configure GPT-4o Model**  
  - *Type:* Langchain Azure OpenAI Chat Model  
  - *Role:* Configures the GPT-4o language model for AI processing steps.  
  - *Configuration:* Model set to `gpt-4o` with empty options.  
  - *Credentials:* Azure OpenAI API credentials.  
  - *Output:* Provides the configured AI model to downstream nodes.  
  - *Edge Cases:* Azure API limits, auth failures.

- **Perform Sentiment & Keyword Analysis**  
  - *Type:* Langchain Agent  
  - *Role:* Sends the unified social media data to GPT-4o for:  
    - Per-item sentiment analysis (positive, negative, neutral).  
    - Keyword and theme extraction.  
    - Overall sentiment distribution.  
    - Structured JSON output.  
  - *Key Expressions:*  
    - Input text includes serialized JSON of unified comments.  
    - System prompt defines role as social media analytics assistant with clear output format.  
  - *Input:* Unified dataset JSON from previous node.  
  - *Output:* Raw AI output JSON string.  
  - *Edge Cases:* AI timeout, malformed response, JSON parse errors, incomplete data.

---

#### 2.5 AI Output Parsing

**Overview:**  
Parses and cleans the raw AI output string to extract structured JSON for further summarization.

**Nodes Involved:**  
- Parse AI Output to Structured JSON

**Node Details:**

- **Parse AI Output to Structured JSON**  
  - *Type:* Code (JavaScript)  
  - *Role:*  
    - Removes Markdown code block wrappers from AI text output.  
    - Parses JSON safely, catches errors.  
    - Extracts overall summary and detailed analysis arrays.  
  - *Input:* Raw AI output string from sentiment analysis node.  
  - *Output:* JSON object with parsed structured data ready for summary generation.  
  - *Edge Cases:* JSON parsing errors, unexpected AI output format.

---

#### 2.6 AI Summary Generation

**Overview:**  
Transforms the structured sentiment analysis data into a human-readable, visually formatted HTML report.

**Nodes Involved:**  
- Configure GPT-4o Model1  
- Generate Audience Sentiment Summary

**Node Details:**

- **Configure GPT-4o Model1**  
  - *Type:* Langchain Azure OpenAI Chat Model  
  - *Role:* Configures the GPT-4o model for the summary generation step (separate instance).  
  - *Configuration:* Model `gpt-4o`, empty options.  
  - *Credentials:* Azure OpenAI API credentials.  
  - *Output:* Model for summary generation.  
  - *Edge Cases:* Same as previous GPT-4o config.

- **Generate Audience Sentiment Summary**  
  - *Type:* Langchain Agent  
  - *Role:*  
    - Converts structured JSON data into an HTML formatted marketing insights report.  
    - Includes sentiment proportions, top keywords, bullet-point insights, and examples.  
    - Uses Markdown headings and light styling for clarity and email readiness.  
  - *Key Expressions:*  
    - Input text includes structured sentiment analysis JSON.  
    - System prompt specifies professional marketing tone and formatting requirements.  
  - *Input:* Parsed AI output structured JSON.  
  - *Output:* HTML string for email body.  
  - *Edge Cases:* AI response formatting issues, incomplete data, HTML render errors.

---

#### 2.7 Email Delivery

**Overview:**  
Sends the generated HTML report as an email to designated marketing recipients.

**Nodes Involved:**  
- Send Email Summary to Marketing Team

**Node Details:**

- **Send Email Summary to Marketing Team**  
  - *Type:* Gmail Node  
  - *Role:* Sends an HTML email with the AI-generated summary to marketing team.  
  - *Configuration:*  
    - Recipient: `newscctv22@gmail.com`  
    - Subject: "Audience Sentiment and Keyword Trend Monitoring"  
    - Message body: HTML output from summary generation.  
  - *Credentials:* Gmail OAuth2 credentials.  
  - *Input:* HTML summary string.  
  - *Output:* Email send status.  
  - *Edge Cases:* Gmail API quota exceeded, auth failure, email delivery failure.

---

#### 2.8 Error Logging

**Overview:**  
Handles logging of any errors encountered during API calls or data validation to Google Sheets.

**Nodes Involved:**  
- Log Errors in Google Sheets (also connected from validation node)

**Node Details:**

- **Log Errors in Google Sheets**  
  - *Type:* Google Sheets Append  
  - *Role:* Stores error logs with identifiers and details for monitoring and troubleshooting.  
  - *Configuration:* Appends to a specific Google Sheet document and sheet.  
  - *Input:* Error objects from validation failure.  
  - *Output:* None.  
  - *Edge Cases:* Google Sheets API limits, permissions.

---

### 3. Summary Table

| Node Name                        | Node Type                              | Functional Role                                          | Input Node(s)                     | Output Node(s)                  | Sticky Note                                                                                                 |
|---------------------------------|--------------------------------------|----------------------------------------------------------|----------------------------------|--------------------------------|------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                       | Starts workflow manually                                  | None                             | Fetch Recent Facebook Comments, Fetch Recent Mentions (X API) | ## Cross-Platform Audience Sentiment Analyzer 🎯 This workflow unifies data... (covers entire workflow)      |
| Fetch Recent Mentions (X API)    | HTTP Request                        | Fetches recent mentions from Twitter (X) API             | When clicking ‘Execute workflow’ | Merge Platform Datasets         | ## Data Collection Layer Fetches recent mentions from Twitter (X) and recent post comments from Facebook.   |
| Fetch Recent Facebook Comments   | Facebook Graph API                  | Fetches recent posts and comments from Facebook page     | When clicking ‘Execute workflow’ | Merge Platform Datasets         | ## Data Collection Layer Fetches recent mentions from Twitter (X) and recent post comments from Facebook.   |
| Merge Platform Datasets          | Merge                              | Combines Twitter and Facebook data streams               | Fetch Recent Mentions (X API), Fetch Recent Facebook Comments | Validate API Response Integrity | ## Dataset Merging Combines results from both APIs into a unified dataset...                                |
| Validate API Response Integrity  | If                                | Checks if API responses are valid and non-empty          | Merge Platform Datasets          | Consolidate Mentions & Comments, Log Errors in Google Sheets | ## Data Validation Checks API responses to confirm essential fields...                                      |
| Log Errors in Google Sheets      | Google Sheets Append               | Logs API or runtime errors for monitoring                 | Validate API Response Integrity  | None                           | ## Error Logging Captures workflow or API-level errors and logs them in Google Sheets...                    |
| Consolidate Mentions & Comments  | Code                              | Normalizes and unifies data into consistent JSON format  | Validate API Response Integrity  | Perform Sentiment & Keyword Analysis | ## Data Consolidation Standardizes and merges Facebook comments and Twitter mentions into a clean JSON...    |
| Configure GPT-4o Model           | Langchain Azure OpenAI Chat Model | Configures GPT-4o for sentiment & keyword analysis       | None                             | Perform Sentiment & Keyword Analysis | ## AI Sentiment & Keyword Analysis Uses GPT-4o to classify each post/comment as Positive, Negative, or Neutral. |
| Perform Sentiment & Keyword Analysis | Langchain Agent               | Performs AI sentiment classification and keyword extraction | Consolidate Mentions & Comments, Configure GPT-4o Model | Parse AI Output to Structured JSON | ## AI Sentiment & Keyword Analysis Uses GPT-4o to classify each post/comment as Positive, Negative, or Neutral. |
| Parse AI Output to Structured JSON | Code                           | Cleans and parses AI JSON output for further use         | Perform Sentiment & Keyword Analysis | Generate Audience Sentiment Summary | ## AI Output Parsing Cleans and parses the AI output JSON...                                                |
| Configure GPT-4o Model1          | Langchain Azure OpenAI Chat Model | Configures GPT-4o for summary generation                  | None                             | Generate Audience Sentiment Summary | ## AI Summary Generation GPT-4o converts structured data into a visually rich HTML summary...                |
| Generate Audience Sentiment Summary | Langchain Agent               | Converts analysis into formatted human-readable HTML report | Parse AI Output to Structured JSON, Configure GPT-4o Model1 | Send Email Summary to Marketing Team | ## AI Summary Generation GPT-4o converts structured data into a visually rich HTML summary...                |
| Send Email Summary to Marketing Team | Gmail                           | Sends the final HTML report to marketing via email       | Generate Audience Sentiment Summary | None                           | ## Email Delivery Sends the final HTML summary via Gmail to marketing stakeholders...                        |
| Sticky Note                     | Sticky Note                       | Provides workflow overview and key instructions          | None                             | None                           | ## Cross-Platform Audience Sentiment Analyzer 🎯 This workflow unifies data... (covers entire workflow)      |
| Sticky Note1                    | Sticky Note                       | Describes Data Collection layer                           | None                             | None                           | ## Data Collection Layer Fetches recent mentions from Twitter (X) and recent post comments from Facebook.   |
| Sticky Note2                    | Sticky Note                       | Describes Dataset Merging                                 | None                             | None                           | ## Dataset Merging Combines results from both APIs into a unified dataset...                                |
| Sticky Note3                    | Sticky Note                       | Describes Data Validation                                 | None                             | None                           | ## Data Validation Checks API responses to confirm essential fields...                                      |
| Sticky Note4                    | Sticky Note                       | Describes Data Consolidation                              | None                             | None                           | ## Data Consolidation Standardizes and merges Facebook comments and Twitter mentions into a clean JSON...    |
| Sticky Note5                    | Sticky Note                       | Describes AI Sentiment & Keyword Analysis                | None                             | None                           | ## AI Sentiment & Keyword Analysis Uses GPT-4o to classify each post/comment as Positive, Negative, or Neutral. |
| Sticky Note6                    | Sticky Note                       | Describes AI Output Parsing                               | None                             | None                           | ## AI Output Parsing Cleans and parses the AI output JSON...                                                |
| Sticky Note7                    | Sticky Note                       | Describes AI Summary Generation                           | None                             | None                           | ## AI Summary Generation GPT-4o converts structured data into a visually rich HTML summary...                |
| Sticky Note8                    | Sticky Note                       | Describes Email Delivery                                  | None                             | None                           | ## Email Delivery Sends the final HTML summary via Gmail to marketing stakeholders...                        |
| Sticky Note9                    | Sticky Note                       | Describes Error Logging                                   | None                             | None                           | ## Error Logging Captures workflow or API-level errors and logs them in Google Sheets...                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**  
   - Name: `When clicking ‘Execute workflow’`  
   - Type: Manual Trigger  
   - No parameters needed.

2. **Add HTTP Request Node to Fetch Twitter Mentions:**  
   - Name: `Fetch Recent Mentions (X API)`  
   - Type: HTTP Request  
   - URL: `https://api.x.com/2/users/1380391508860268549/mentions?tweet.fields=created_at,text,public_metrics,author_id`  
   - Authentication: Twitter OAuth2 (set credentials).  
   - Connect output from Manual Trigger.

3. **Add Facebook Graph API Node to Fetch Facebook Comments:**  
   - Name: `Fetch Recent Facebook Comments`  
   - Type: Facebook Graph API  
   - Node ID: `230476031170639` (Facebook Page)  
   - Edge: `posts`  
   - Fields: `id,message,story,created_time,permalink_url,full_picture,attachments{media_type,media,url,description},shares,likes.limit(100).summary(true){id,name},comments.limit(100).summary(true){id,from,message,created_time,like_count,comment_count,reactions.summary(true)},reactions.limit(100).summary(true){type,id,name},from{id,name,category}`  
   - Graph API version: v23.0  
   - Connect output from Manual Trigger.

4. **Add Merge Node to Combine Twitter and Facebook Data:**  
   - Name: `Merge Platform Datasets`  
   - Type: Merge  
   - Default settings.  
   - Connect outputs from both social fetch nodes to this merge node.

5. **Add If Node to Validate API Response:**  
   - Name: `Validate API Response Integrity`  
   - Type: If  
   - Condition: Check if `$json.data.id` is not empty on merged data or fallback condition true.  
   - Connect output from Merge node.

6. **Add Google Sheets Node for Error Logging:**  
   - Name: `Log Errors in Google Sheets`  
   - Type: Google Sheets Append  
   - Configure credentials with Google Sheets OAuth2.  
   - Document ID and Sheet name as per your sheet.  
   - Connect error output of the If node here.

7. **Add Code Node to Consolidate Data:**  
   - Name: `Consolidate Mentions & Comments`  
   - Type: Code (JavaScript)  
   - Paste the provided JS code to normalize and unify data.  
   - Connect success output of the If node here.

8. **Add Langchain Azure OpenAI Chat Model Node for Sentiment Analysis:**  
   - Name: `Configure GPT-4o Model`  
   - Type: Langchain Azure OpenAI Chat Model  
   - Model: `gpt-4o`  
   - Configure Azure OpenAI API credentials.  
   - No extra options needed.

9. **Add Langchain Agent Node for Sentiment & Keyword Analysis:**  
   - Name: `Perform Sentiment & Keyword Analysis`  
   - Type: Langchain Agent  
   - Input text: Use the prompt template with `{{ JSON.stringify($json.unified_comments) }}`  
   - System message: Provided prompt for social media analytics assistant.  
   - Connect outputs from Consolidate node and GPT-4o Model node.

10. **Add Code Node to Parse AI Output:**  
    - Name: `Parse AI Output to Structured JSON`  
    - Type: Code (JavaScript)  
    - Paste the JS code that removes markdown wrappers and parses JSON safely.  
    - Connect output from Sentiment & Keyword Analysis node.

11. **Add Second Langchain Azure OpenAI Chat Model Node for Summary Generation:**  
    - Name: `Configure GPT-4o Model1`  
    - Type: Langchain Azure OpenAI Chat Model  
    - Model: `gpt-4o`  
    - Use same Azure OpenAI credentials.

12. **Add Langchain Agent Node for Audience Sentiment Summary:**  
    - Name: `Generate Audience Sentiment Summary`  
    - Type: Langchain Agent  
    - Input text: Use prompt instructing professional marketing insights writer with structured JSON input.  
    - System message: Provided prompt for marketing summary generation.  
    - Connect outputs from Parse AI Output node and GPT-4o Model1 node.

13. **Add Gmail Node to Send Email:**  
    - Name: `Send Email Summary to Marketing Team`  
    - Type: Gmail  
    - Recipient: `newscctv22@gmail.com` (or your marketing email)  
    - Subject: `"Audience Sentiment and Keyword Trend Monitoring"`  
    - Message: Use `{{$json.output}}` from previous node (HTML content).  
    - Configure Gmail OAuth2 credentials.  
    - Connect output from Summary Generation node.

14. **Arrange Connections:**  
    - Manual Trigger → Facebook Comments node & Twitter Mentions node  
    - Both → Merge Node  
    - Merge → Validation If Node  
    - Validation success → Consolidate Data Node  
    - Validation fail → Log Errors Node  
    - Consolidate Data → Configure GPT-4o Model → Sentiment Analysis  
    - Sentiment Analysis → Parse AI Output  
    - Parse AI Output → Configure GPT-4o Model1 → Summary Generation  
    - Summary Generation → Gmail Send Email

15. **Set Workflow Settings:**  
    - Execution order: Sequential (default)  
    - Optional scheduling for automation (e.g., weekly runs).  
    - Verify all credentials and API permissions.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                                                                              |
|--------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| This workflow unifies Twitter (X) and Facebook data for cross-platform social media sentiment analysis using GPT-4o. | Overview and design intention from Sticky Note node content.                                                |
| For Twitter API v2, OAuth2 credentials with appropriate scopes are required.                      | Twitter Developer Portal docs.                                                                               |
| Facebook Graph API requires page access tokens with permissions to read posts and comments.      | Facebook for Developers docs.                                                                                |
| Azure OpenAI credentials must have access to GPT-4o model.                                       | Azure OpenAI Service documentation.                                                                          |
| Gmail OAuth2 credentials must permit sending emails via API.                                     | Google Workspace API docs.                                                                                   |
| Google Sheets OAuth2 credentials must have edit access to the designated sheet for error logging.| Google Sheets API docs.                                                                                       |
| Adjust API endpoints and IDs (Twitter user ID, Facebook page ID) to target your own accounts.    | Configuration note for customization.                                                                        |
| Consider scheduling the workflow for periodic social media monitoring (e.g., weekly or daily).   | n8n scheduling feature.                                                                                       |
| AI prompt templates in Langchain agent nodes are critical for accurate sentiment and summary output. | Refer to system messages in nodes for customization.                                                         |
| Error logging provides an audit trail but consider alerting mechanisms for critical failures.    | Suggested enhancement beyond current implementation.                                                        |

---

**Disclaimer:** The text provided originates solely from an n8n automated workflow. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.