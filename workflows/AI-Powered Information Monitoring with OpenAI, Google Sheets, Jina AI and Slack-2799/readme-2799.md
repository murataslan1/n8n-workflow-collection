AI-Powered Information Monitoring with OpenAI, Google Sheets, Jina AI and Slack

https://n8nworkflows.xyz/workflows/ai-powered-information-monitoring-with-openai--google-sheets--jina-ai-and-slack-2799


# AI-Powered Information Monitoring with OpenAI, Google Sheets, Jina AI and Slack

### 1. Workflow Overview

This workflow automates the monitoring of topics related to artificial intelligence, data science, and related fields by fetching articles from RSS feeds, classifying their relevance using AI, extracting and summarizing content, and delivering formatted summaries to a Slack channel. It also maintains a Google Sheets database to track processed articles and avoid duplicates.

The workflow is logically divided into the following blocks:

- **1.1 Trigger and Initialization:** Periodic triggering and retrieval of monitored article URLs and RSS feed URLs from Google Sheets.
- **1.2 RSS Feed Reading and Filtering:** Fetching RSS feed articles and filtering out already processed articles.
- **1.3 Article Relevance Classification:** Using OpenAI GPT-4o-mini to classify articles as relevant or not relevant.
- **1.4 Content Extraction for Relevant Articles:** Scraping full article content via Jina AI for relevant articles.
- **1.5 Article Summarization and Formatting:** Summarizing and formatting article content into Slack Markdown using OpenAI GPT-4o-mini.
- **1.6 Slack Notification and Data Storage:** Posting summaries to Slack and updating Google Sheets with article metadata for both relevant and non-relevant articles.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger and Initialization

**Overview:**  
This block initiates the workflow on a schedule and retrieves necessary data from Google Sheets: the list of already monitored articles and the RSS feed URLs to follow.

**Nodes Involved:**  
- Schedule Trigger  
- Google Sheets - Get article monitored database  
- Set field - existing_url  
- Google Sheets - Get RSS Feed url followed

**Node Details:**

- **Schedule Trigger**  
  - Type: Trigger (Scheduler)  
  - Role: Triggers workflow every 15 minutes (default interval) to check for new articles.  
  - Configuration: Interval set to 15 minutes.  
  - Input: None (trigger node)  
  - Output: Starts the workflow  
  - Edge Cases: Misconfiguration could cause too frequent or infrequent triggering.

- **Google Sheets - Get article monitored database**  
  - Type: Google Sheets (Read)  
  - Role: Retrieves rows from the "article_database" sheet containing URLs of already processed articles.  
  - Configuration: Uses service account authentication; reads from the specified Google Sheet template and sheet ID.  
  - Input: Trigger output  
  - Output: List of monitored articles  
  - Edge Cases: Authentication errors, sheet access issues, empty sheet on first run.

- **Set field - existing_url**  
  - Type: Set  
  - Role: Extracts and sets the "existing_url" field from the "article_url" column in the Google Sheets data.  
  - Configuration: Uses expression to extract URL from "article_url" field.  
  - Input: Google Sheets monitored articles data  
  - Output: Adds "existing_url" field for downstream filtering  
  - Edge Cases: Empty data on first run; errors are ignored to continue workflow.

- **Google Sheets - Get RSS Feed url followed**  
  - Type: Google Sheets (Read)  
  - Role: Retrieves RSS feed URLs from the "rss_feed" sheet to be monitored.  
  - Configuration: Service account authentication; reads from the same Google Sheet template, "rss_feed" sheet.  
  - Input: Output of Set field node  
  - Output: List of RSS feed URLs with metadata (e.g., website)  
  - Edge Cases: Authentication errors, invalid or empty feed URLs.

---

#### 1.2 RSS Feed Reading and Filtering

**Overview:**  
Fetches articles from each RSS feed URL and filters out articles that have already been processed, ensuring only new articles proceed.

**Nodes Involved:**  
- RSS Read  
- Code (Filter Existing URLs)  
- If  
- No Operation, do nothing

**Node Details:**

- **RSS Read**  
  - Type: RSS Feed Read  
  - Role: Reads articles from RSS feeds using URLs from Google Sheets.  
  - Configuration: URL dynamically set from input JSON field `rss_feed_url`; SSL validation enabled.  
  - Input: RSS feed URLs from Google Sheets  
  - Output: List of articles with metadata (title, link, content snippet, pubDate)  
  - Edge Cases: Invalid RSS URLs, network errors, empty feeds; configured to continue on error.

- **Code (Filter Existing URLs)**  
  - Type: Code (JavaScript)  
  - Role: Filters out articles whose URLs already exist in the monitored articles list.  
  - Configuration: Compares RSS article links against "existing_url" from Google Sheets; outputs only new articles or a message if none found.  
  - Input: RSS articles and existing URLs  
  - Output: New articles or message "No new articles found."  
  - Edge Cases: Empty inputs, expression errors.

- **If**  
  - Type: Conditional  
  - Role: Checks if new articles were found (message not equal to "No new articles found.")  
  - Configuration: Condition on JSON field `message`  
  - Input: Output of Code node  
  - Output: Routes to processing or no-op node  
  - Edge Cases: Misconfigured condition could block processing.

- **No Operation, do nothing**  
  - Type: NoOp  
  - Role: Ends workflow path when no new articles are found.  
  - Input: If node false branch  
  - Output: None

---

#### 1.3 Article Relevance Classification

**Overview:**  
Classifies each new article as relevant or not relevant to the monitored topics using OpenAI GPT-4o-mini.

**Nodes Involved:**  
- OpenAI Chat Model1  
- Relevance Classification for Topic Monitoring  
- Set fields - Not relevant articles  
- Google Sheets - Add relevant articles

**Node Details:**

- **OpenAI Chat Model1**  
  - Type: OpenAI Chat Model (Langchain)  
  - Role: Provides the AI model (GPT-4o-mini) for classification.  
  - Configuration: Uses OpenAI credentials; no special options.  
  - Input: New articles from If node  
  - Output: AI model instance for classification node  
  - Edge Cases: API key issues, rate limits.

- **Relevance Classification for Topic Monitoring**  
  - Type: Text Classifier (Langchain)  
  - Role: Classifies articles as "relevant" or "not_relevant" based on title and content snippet.  
  - Configuration: Categories defined with descriptions focused on AI, data science, machine learning, big data, and innovations.  
  - Input: Article title and content snippet  
  - Output: Classification label per article  
  - Edge Cases: Misclassification, fallback set to discard.

- **Set fields - Not relevant articles**  
  - Type: Set  
  - Role: Prepares data for articles classified as not relevant for storage.  
  - Configuration: Sets fields: article_url, summarized = "NO (not relevant)", website, fetched_at (current timestamp), publish_date (formatted).  
  - Input: Articles classified as not relevant  
  - Output: Data for Google Sheets insertion  
  - Edge Cases: Missing fields, date formatting errors.

- **Google Sheets - Add relevant articles**  
  - Type: Google Sheets (Append)  
  - Role: Adds not relevant articles data to "article_database" sheet.  
  - Configuration: Service account authentication; auto-maps input data to columns.  
  - Input: Set fields - Not relevant articles  
  - Output: Confirmation of data append  
  - Edge Cases: Write permission errors, API limits.

---

#### 1.4 Content Extraction for Relevant Articles

**Overview:**  
For articles classified as relevant, this block extracts the full article content using Jina AI to prepare for summarization.

**Nodes Involved:**  
- Jina AI - Read URL  
- Basic LLM Chain  
- OpenAI Chat Model

**Node Details:**

- **Jina AI - Read URL**  
  - Type: HTTP Request  
  - Role: Scrapes article content from the URL using Jina AI API.  
  - Configuration: URL constructed dynamically as `https://r.jina.ai/{{ $json.link }}`; retries on failure with 5-second delay.  
  - Input: Relevant article URLs  
  - Output: Article content in Markdown format  
  - Edge Cases: Scraping restrictions, rate limits, network errors, legal compliance warnings.

- **Basic LLM Chain**  
  - Type: Langchain LLM Chain  
  - Role: Summarizes and formats article content into Slack Markdown using OpenAI GPT-4o-mini.  
  - Configuration: System prompt instructs the AI to produce structured summaries with clickable titles, sections, bullet points, and contextual relevance, formatted for Slack.  
  - Input: Markdown content from Jina AI  
  - Output: Slack-formatted summary text  
  - Edge Cases: Prompt failures, API errors, formatting issues.

- **OpenAI Chat Model**  
  - Type: OpenAI Chat Model (Langchain)  
  - Role: Provides the AI model (GPT-4o-mini) for summarization.  
  - Configuration: Uses OpenAI credentials; no special options.  
  - Input: Basic LLM Chain node  
  - Output: AI model instance for summarization  
  - Edge Cases: API key issues, rate limits.

---

#### 1.5 Slack Notification and Data Storage

**Overview:**  
Posts the formatted article summaries to Slack and updates the Google Sheets database with metadata for both relevant and non-relevant articles.

**Nodes Involved:**  
- Slack1  
- Set Fields - Relevant Articles  
- Google Sheets - Add relevant article

**Node Details:**

- **Slack1**  
  - Type: Slack  
  - Role: Posts the formatted summary message to a dedicated Slack channel.  
  - Configuration: OAuth2 authentication; channel ID set to "topic-monitoring" channel; message text from Basic LLM Chain output.  
  - Input: Summarized article text  
  - Output: Slack message confirmation  
  - Edge Cases: Authentication errors, channel access issues, message formatting errors.

- **Set Fields - Relevant Articles**  
  - Type: Set  
  - Role: Prepares metadata for relevant articles to be stored in Google Sheets.  
  - Configuration: Sets fields: article_url, summarized = "YES", summary (Slack message text), website, fetched_at (current timestamp), publish_date (formatted).  
  - Input: Summarized article data  
  - Output: Data for Google Sheets insertion  
  - Edge Cases: Missing fields, timestamp errors.

- **Google Sheets - Add relevant article**  
  - Type: Google Sheets (Append)  
  - Role: Appends relevant article metadata and summary to "article_database" sheet.  
  - Configuration: Service account authentication; auto-maps input data to columns.  
  - Input: Set Fields - Relevant Articles  
  - Output: Confirmation of data append  
  - Edge Cases: Write permission errors, API limits.

---

### 3. Summary Table

| Node Name                          | Node Type                          | Functional Role                                  | Input Node(s)                          | Output Node(s)                              | Sticky Note                                                                                         |
|-----------------------------------|----------------------------------|-------------------------------------------------|--------------------------------------|---------------------------------------------|---------------------------------------------------------------------------------------------------|
| Schedule Trigger                  | Schedule Trigger                 | Initiates workflow periodically                  | None                                 | Google Sheets - Get article monitored database | ## Scheduler: Defines execution frequency (default every 15 minutes).                             |
| Google Sheets - Get article monitored database | Google Sheets (Read)             | Retrieves monitored article URLs                 | Schedule Trigger                    | Set field - existing_url                      | ## Google Sheets - Get Article Monitored Database: Retrieves processed articles to avoid duplicates. |
| Set field - existing_url          | Set                              | Extracts existing URLs for filtering             | Google Sheets - Get article monitored database | Google Sheets - Get RSS Feed url followed     | See above                                                                                         |
| Google Sheets - Get RSS Feed url followed | Google Sheets (Read)             | Retrieves RSS feed URLs to monitor                | Set field - existing_url             | RSS Read                                    | ## Google Sheets - Get RSS Feed URLs Followed: Retrieves RSS feed URLs from Google Sheets.         |
| RSS Read                         | RSS Feed Read                   | Reads articles from RSS feeds                      | Google Sheets - Get RSS Feed url followed | Code                                        | ## RSS Read: Reads RSS feeds; URL from Google Sheets.                                            |
| Code                            | Code (JavaScript)               | Filters out already processed articles            | RSS Read, Set field - existing_url   | If                                          | ## Code Node to Filter Existing URLs: Filters new articles only.                                 |
| If                              | If                              | Checks if new articles exist                       | Code                               | Relevance Classification for Topic Monitoring, No Operation, do nothing | See above                                                                                         |
| No Operation, do nothing         | NoOp                            | Ends workflow if no new articles                   | If (false branch)                   | None                                        | See above                                                                                         |
| OpenAI Chat Model1               | OpenAI Chat Model (Langchain)   | Provides AI model for classification              | If (true branch)                   | Relevance Classification for Topic Monitoring | ## LLM Call 1 - Article Topic Relevance Classification: Classifies articles as relevant or not.    |
| Relevance Classification for Topic Monitoring | Text Classifier (Langchain)     | Classifies article relevance                       | OpenAI Chat Model1                 | Jina AI - Read URL, Set fields - Not relevant articles | See above                                                                                         |
| Set fields - Not relevant articles | Set                              | Prepares data for non-relevant articles           | Relevance Classification for Topic Monitoring | Google Sheets - Add relevant articles         | ## Set Fields - Not Relevant Articles: Prepares data for storage of non-relevant articles.         |
| Google Sheets - Add relevant articles | Google Sheets (Append)           | Stores non-relevant articles metadata              | Set fields - Not relevant articles  | None                                        | See above                                                                                         |
| Jina AI - Read URL              | HTTP Request                   | Extracts full article content for relevant articles | Relevance Classification for Topic Monitoring | Basic LLM Chain                              | ## Jina AI - Read URL: Scrapes article content for relevant articles.                            |
| OpenAI Chat Model               | OpenAI Chat Model (Langchain)   | Provides AI model for summarization                | Jina AI - Read URL                 | Basic LLM Chain                              | ## OpenAI Chat Model: Uses GPT-4o-mini for summarization.                                        |
| Basic LLM Chain                 | Langchain LLM Chain             | Summarizes and formats article content for Slack  | Jina AI - Read URL, OpenAI Chat Model | Slack1, Set Fields - Relevant Articles         | ## LLM Call 2 - Summarize and Format in Slack Markdown: Summarizes and formats content.           |
| Slack1                         | Slack                          | Posts formatted summary to Slack channel           | Basic LLM Chain                   | Set Fields - Relevant Articles                 | ## Slack - Send Article Summary: Posts summary to dedicated Slack channel.                        |
| Set Fields - Relevant Articles  | Set                              | Prepares metadata and summary for relevant articles | Basic LLM Chain, Relevance Classification for Topic Monitoring, Google Sheets - Get RSS Feed url followed | Google Sheets - Add relevant article          | ## Set Fields - Relevant Articles: Prepares data for storage of relevant articles.                |
| Google Sheets - Add relevant article | Google Sheets (Append)           | Stores relevant articles metadata and summary      | Set Fields - Relevant Articles      | None                                        | See above                                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set interval to every 15 minutes (or preferred frequency).

2. **Add Google Sheets node to get monitored articles:**  
   - Type: Google Sheets (Read)  
   - Configure with service account credentials.  
   - Select your Google Sheet document (copy the provided template).  
   - Select the sheet named "article_database".  
   - Set to execute once per workflow run.

3. **Add Set node to extract existing URLs:**  
   - Type: Set  
   - Add a field named "existing_url".  
   - Use expression: `{{$json.article_url.extractUrl()}}` to extract URLs from the Google Sheets data.  
   - Set to always output data.

4. **Add Google Sheets node to get RSS feed URLs:**  
   - Type: Google Sheets (Read)  
   - Use the same Google Sheet document.  
   - Select the sheet named "rss_feed".  
   - Use service account credentials.  
   - Set to execute once per workflow run.

5. **Add RSS Read node:**  
   - Type: RSS Feed Read  
   - Set URL to `{{$json.rss_feed_url}}` dynamically from previous node.  
   - Enable SSL validation.  
   - Set error handling to continue on error.

6. **Add Code node to filter new articles:**  
   - Type: Code (JavaScript)  
   - Use code to compare RSS article links with existing URLs and output only new articles or a message if none found.

7. **Add If node to check for new articles:**  
   - Condition: `{{$json.message}}` not equal to "No new articles found."  
   - True branch proceeds to classification; false branch connects to No Operation node.

8. **Add No Operation node:**  
   - Type: NoOp  
   - Connect from If node false branch to end workflow when no new articles.

9. **Add OpenAI Chat Model node for classification:**  
   - Type: OpenAI Chat Model (Langchain)  
   - Configure with OpenAI API credentials.  
   - Use GPT-4o-mini model or preferred model.

10. **Add Text Classifier node:**  
    - Type: Langchain Text Classifier  
    - Input text: concatenate article title and content snippet.  
    - Define two categories: "relevant" and "not_relevant" with descriptions matching your monitoring topics.  
    - Set fallback to discard.

11. **Add Set node for not relevant articles:**  
    - Set fields: article_url, summarized = "NO (not relevant)", website (from RSS feed data), fetched_at (current timestamp), publish_date (formatted).  
    - Use expressions to populate fields.

12. **Add Google Sheets node to append not relevant articles:**  
    - Append to "article_database" sheet.  
    - Map fields automatically.  
    - Use service account credentials.

13. **Add HTTP Request node for Jina AI content extraction:**  
    - URL: `https://r.jina.ai/{{$json.link}}` dynamically.  
    - Enable retry on failure with 5-second delay.

14. **Add OpenAI Chat Model node for summarization:**  
    - Configure with OpenAI API credentials.  
    - Use GPT-4o-mini model.

15. **Add Langchain LLM Chain node:**  
    - Input: content from Jina AI node.  
    - System prompt: instruct AI to summarize article in English and format in Slack Markdown with sections, bullet points, and clickable title links.  
    - Connect OpenAI Chat Model node as AI model.

16. **Add Slack node:**  
    - Configure OAuth2 credentials for Slack.  
    - Set channel to your dedicated Slack channel (e.g., "topic-monitoring").  
    - Message text from LLM Chain output.

17. **Add Set node for relevant articles:**  
    - Set fields: article_url, summarized = "YES", summary (Slack message text), website, fetched_at (current timestamp), publish_date (formatted).  
    - Use expressions to populate fields.

18. **Add Google Sheets node to append relevant articles:**  
    - Append to "article_database" sheet.  
    - Map fields automatically.  
    - Use service account credentials.

19. **Connect nodes according to the logical flow:**  
    - Schedule Trigger → Google Sheets (article monitored) → Set existing_url → Google Sheets (RSS feed URLs) → RSS Read → Code → If →  
      - True → OpenAI Chat Model1 → Relevance Classification →  
        - Relevant → Jina AI → OpenAI Chat Model → Basic LLM Chain → Slack → Set Fields Relevant → Google Sheets Add Relevant  
        - Not Relevant → Set Fields Not Relevant → Google Sheets Add Not Relevant  
      - False → No Operation

---

### 5. General Notes & Resources

| Note Content                                                                                                                                        | Context or Link                                                                                                  |
|-----------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| This workflow involves web scraping; ensure compliance with your country's legal regulations before use.                                            | Legal compliance warning                                                                                         |
| Google Sheets template required for this workflow can be copied from: https://docs.google.com/spreadsheets/d/1F2FzWt9FMkA5V5i9d_hBJRahLDvxs3DQBOLkLYowXbY | Google Sheets template for RSS feeds and article database                                                       |
| Jina AI provides 1,000,000 free tokens for testing; can be used without API key but with reduced request rate limits.                              | https://jina.ai/                                                                                                |
| The workflow uses OpenAI GPT-4o-mini model for cost-efficient and effective AI processing.                                                          | Model choice rationale                                                                                           |
| Slack messages are formatted using Slack Markdown syntax for better readability and engagement.                                                     | Slack Markdown formatting guide included in system prompt                                                       |
| Recommended to use a dedicated Slack channel for topic monitoring to avoid clutter and improve accessibility.                                       | Slack channel best practice                                                                                      |

---

This comprehensive documentation enables understanding, reproduction, and modification of the workflow, while highlighting potential failure points and integration considerations.