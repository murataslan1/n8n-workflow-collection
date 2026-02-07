AI-Powered Multi-Social Media Post Automation: Google Trends & Perplexity AI 

https://n8nworkflows.xyz/workflows/ai-powered-multi-social-media-post-automation--google-trends---perplexity-ai--4352


# AI-Powered Multi-Social Media Post Automation: Google Trends & Perplexity AI 

---
### 1. Workflow Overview

This workflow automates the generation and multi-platform posting of social media content using trending topics sourced from Google Trends and refined with AI-powered research from Perplexity AI. It targets marketing and content teams aiming to leverage real-time trends to create optimized social media posts, boosting engagement and SEO impact.

The workflow is logically divided into the following blocks:

- **1.1 Trend Discovery:** Retrieves and processes trending search queries from Google Trends.
- **1.2 Keyword Filtering and Topic Selection:** Filters high-volume keywords and uses OpenAI to select the most relevant topic.
- **1.3 AI Content Research and Refinement:** Calls Perplexity AI to generate a LinkedIn-style post based on the chosen topic, applying editorial style rules.
- **1.4 Scheduled Execution and Throttling:** Uses schedule triggers and wait nodes to pace the workflow.
- **1.5 Multi-Platform Posting:** Splits the AI-generated content and posts it to Twitter, Facebook, and LinkedIn.
- **1.6 Logging and Status Updates:** Updates a Google Sheet with posting status and content for tracking.

---

### 2. Block-by-Block Analysis

#### 2.1 Trend Discovery

- **Overview:**  
  This initial block triggers periodically to retrieve trending queries related to "ai agents" from Google Trends via SerpAPI, providing raw trend data for downstream processing.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Google Trends  
  - 2 Most Trending  
  - High search volume keywords

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates the workflow twice daily at 6 AM and 6 PM.  
    - Configuration: Interval with two trigger hours (6, 18).  
    - Inputs: None  
    - Outputs: Google Trends node  
    - Edge Cases: Missed trigger if n8n instance is down; timezone considerations.

  - **Google Trends**  
    - Type: HTTP Request  
    - Role: Calls SerpAPI Google Trends endpoint to retrieve related search queries for "ai agents" in the US over the past 3 days.  
    - Configuration: GET request with query parameters for location, language, date range, and API key.  
    - Inputs: Schedule Trigger output  
    - Outputs: 2 Most Trending node  
    - Edge Cases: API rate limits, invalid API key, network timeouts.

  - **2 Most Trending**  
    - Type: Set  
    - Role: Extracts the top 2 rising related queries with their scores from Google Trends JSON response.  
    - Configuration: Maps `related_queries.rising[0]` and `[1]` into structured JSON with query and score.  
    - Inputs: Google Trends output  
    - Outputs: High search volume keywords node  
    - Edge Cases: Empty or missing rising queries array; malformed JSON.

  - **High search volume keywords**  
    - Type: Code (JavaScript)  
    - Role: Filters the top related queries from Google Trends to include only those with extracted_value > 30 and concatenates their queries into a comma-separated string.  
    - Inputs: 2 Most Trending output (relies on field `related_queries.top`)  
    - Outputs: Choosing Topic node  
    - Edge Cases: No keywords meeting threshold; syntax errors in JS code.

---

#### 2.2 Keyword Filtering and Topic Selection

- **Overview:**  
  This block leverages OpenAI's GPT-3.5 to select the most SEO-relevant blog post topic from the two trending keywords, balancing trendiness and business relevance.

- **Nodes Involved:**  
  - Choosing Topic

- **Node Details:**

  - **Choosing Topic**  
    - Type: OpenAI (Langchain)  
    - Role: Uses GPT-3.5-turbo model to analyze two trending keywords and choose one keyword best suited for a blog post targeting SEO goals.  
    - Configuration: Message prompt instructs the model to consider keyword relevance and trendiness, outputting only the chosen keyword without explanation.  
    - Inputs: High search volume keywords output via expressions referencing the top 2 trending keywords JSON.  
    - Outputs: Research Topic- Perplexity node  
    - Credentials: Requires OpenAI API key.  
    - Edge Cases: API quota exceeded, ambiguous responses, model latency.

---

#### 2.3 AI Content Research and Refinement

- **Overview:**  
  This block uses Perplexity AI's chat completions API to generate a well-crafted LinkedIn post on the selected topic, applying editorial rules to sound more human and engaging.

- **Nodes Involved:**  
  - Research Topic- Perplexity  
  - Wait

- **Node Details:**

  - **Research Topic- Perplexity**  
    - Type: HTTP Request  
    - Role: Sends a POST request to Perplexity AI API with a system prompt instructing editorial style rules and a user prompt requesting a LinkedIn post formatted for LinkedIn's API.  
    - Configuration: JSON body with `model: sonar-pro`, system message for editorial style, user message including instructions and content input from "Choosing Topic" node.  
    - Inputs: Choosing Topic output (topic keyword)  
    - Outputs: Wait node  
    - Credentials: Requires Perplexity AI API key.  
    - Edge Cases: API authentication failure, malformed prompt, response delays, output length limits.

  - **Wait**  
    - Type: Wait  
    - Role: Adds a 10-second delay after receiving the AI-generated content before continuing, possibly to ensure API rate limits or processing stability.  
    - Inputs: Research Topic- Perplexity output  
    - Outputs: Split Out node  
    - Edge Cases: Workflow timeout if wait is too long or interrupted.

---

#### 2.4 Scheduled Execution and Throttling

- **Overview:**  
  This block ensures the workflow executes at regular intervals and introduces controlled pauses to manage API call pacing and resource usage.

- **Nodes Involved:**  
  - Schedule Trigger  
  - Wait

- **Node Details:**  
  Already described above in 2.1 and 2.3.

---

#### 2.5 Multi-Platform Posting

- **Overview:**  
  Splits the AI-generated LinkedIn post content and posts it simultaneously to Twitter, Facebook, and LinkedIn accounts.

- **Nodes Involved:**  
  - Split Out  
  - X1 (Twitter)  
  - Facebook Graph API1  
  - LinkedIn1  
  - Google Sheets2

- **Node Details:**

  - **Split Out**  
    - Type: Split Out  
    - Role: Splits the AI-generated message content string into individual items to send to different social media posting nodes.  
    - Configuration: Splitting based on the field `choices[0].message.content`.  
    - Inputs: Wait node output  
    - Outputs: Twitter (X1), Facebook Graph API1, LinkedIn1 nodes  
    - Edge Cases: Empty or malformed content causing split failure.

  - **X1 (Twitter)**  
    - Type: Twitter OAuth2  
    - Role: Posts the content to Twitter.  
    - Configuration: Uses OAuth2 credentials for authentication; posts the text content directly.  
    - Inputs: Split Out output  
    - Outputs: None  
    - Credentials: Twitter OAuth2 API credentials configured.  
    - Edge Cases: Twitter API rate limits, content too long for Twitter, auth errors.

  - **Facebook Graph API1**  
    - Type: Facebook Graph API (POST)  
    - Role: Posts the content to Facebook via Graph API.  
    - Configuration: HTTP POST request with no additional fields configured (likely posts default message content).  
    - Inputs: Split Out output  
    - Outputs: None  
    - Credentials: Facebook OAuth2 credentials required.  
    - Edge Cases: Permissions errors, invalid tokens, API rate limits.

  - **LinkedIn1**  
    - Type: LinkedIn (Community Management)  
    - Role: Posts the content to LinkedIn on behalf of a specified person.  
    - Configuration: Text parameter set dynamically from AI-generated content; requires person ID and OAuth2 credentials.  
    - Inputs: Split Out output  
    - Outputs: Google Sheets2 node  
    - Credentials: LinkedIn Community Management OAuth2 API credentials required.  
    - Edge Cases: Incorrect LinkedIn person ID, auth failures, API limits.

  - **Google Sheets2**  
    - Type: Google Sheets  
    - Role: Logs the posted topic, status, AI output, and posting date into a Google Sheet for monitoring and tracking.  
    - Configuration: Appends or updates rows matching topic; columns include Topic, Status ("Posted"), AI Output (post content), Date Posted (timestamp).  
    - Inputs: LinkedIn1 output  
    - Outputs: None  
    - Credentials: Google Sheets OAuth2 API credentials needed.  
    - Edge Cases: Sheet access errors, invalid document or sheet ID, quota limits.

---

#### 2.6 Logging and Status Updates

- **Overview:**  
  Records the posting data into Google Sheets, providing a historical log of topics posted and their AI-generated content.

- **Nodes Involved:**  
  - Google Sheets2 (described above)

---

### 3. Summary Table

| Node Name                | Node Type                  | Functional Role                      | Input Node(s)      | Output Node(s)                  | Sticky Note                                                                                                    |
|--------------------------|----------------------------|------------------------------------|--------------------|-------------------------------|---------------------------------------------------------------------------------------------------------------|
| Schedule Trigger         | Schedule Trigger            | Initiates workflow twice daily     | None               | Google Trends                  | ## Find Trend                                                                                                  |
| Google Trends            | HTTP Request               | Fetches Google Trends related queries | Schedule Trigger   | 2 Most Trending               | ## Find Trend                                                                                                  |
| 2 Most Trending          | Set                        | Extracts top 2 trending queries    | Google Trends      | High search volume keywords   | ## Find Trend                                                                                                  |
| High search volume keywords | Code                     | Filters keywords with high search volume | 2 Most Trending   | Choosing Topic                | ## High Volume Keywords                                                                                        |
| Choosing Topic           | OpenAI (Langchain)          | Chooses best blog topic from keywords | High search volume keywords | Research Topic- Perplexity   | ## Choosing Blog Topic                                                                                          |
| Research Topic- Perplexity | HTTP Request             | Generates LinkedIn post via Perplexity AI | Choosing Topic      | Wait                         | ## Research                                                                                                    |
| Wait                     | Wait                       | Adds delay for API pacing          | Research Topic- Perplexity | Split Out                  |                                                                                                               |
| Split Out                | Split Out                  | Splits AI post content for multi-posting | Wait                | X1, Facebook Graph API1, LinkedIn1 |                                                                                                               |
| X1                       | Twitter OAuth2             | Posts to Twitter                   | Split Out           | None                        | ## Multi Social Media Posting                                                                                  |
| Facebook Graph API1      | Facebook Graph API POST    | Posts to Facebook                  | Split Out           | None                        | ## Multi Social Media Posting                                                                                  |
| LinkedIn1                | LinkedIn                   | Posts to LinkedIn                  | Split Out           | Google Sheets2               | ## Multi Social Media Posting                                                                                  |
| Google Sheets2           | Google Sheets              | Logs post status and content       | LinkedIn1           | None                        | ## Status update                                                                                                |
| Sticky Note              | Sticky Note                | Visual annotation for trend discovery | None               | None                        | ## Find Trend                                                                                                  |
| Sticky Note1             | Sticky Note                | Visual annotation for high volume keywords | None               | None                        | ## High Volume Keywords                                                                                        |
| Sticky Note2             | Sticky Note                | Visual annotation for topic choosing | None               | None                        | ## Choosing Blog Topic                                                                                          |
| Sticky Note3             | Sticky Note                | Visual annotation for research     | None               | None                        | ## Research                                                                                                    |
| Sticky Note4             | Sticky Note                | Visual annotation for multi social posting | None               | None                        | ## Multi Social Media Posting                                                                                  |
| Sticky Note5             | Sticky Note                | Visual annotation for status update | None               | None                        | ## Status update                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Set to trigger twice daily at 6 AM and 6 PM.  
   - No credentials needed.

2. **Add an HTTP Request node (Google Trends):**  
   - Name: "Google Trends"  
   - Method: GET  
   - URL: `https://serpapi.com/search`  
   - Query Parameters:  
     - `q`: "ai agents"  
     - `geo`: "US"  
     - `hl`: "en"  
     - `date`: From 3 days ago to today, dynamically set using expression `{{$now.minus({ days: 3 }).format('yyyy-MM-dd')}} {{$now.format('yyyy-MM-dd')}}`  
     - `data_type`: "RELATED_QUERIES"  
     - `engine`: "google_trends"  
     - `api_key`: Your SerpAPI key  
   - Connect Schedule Trigger → Google Trends.

3. **Add a Set node (2 Most Trending):**  
   - Name: "2 Most Trending"  
   - Mode: Raw JSON  
   - JSON output: Extract top 2 rising queries and scores from `related_queries.rising[0]` and `[1]`, mapping to a structured JSON as shown in the overview.  
   - Connect Google Trends → 2 Most Trending.

4. **Add a Code node (High search volume keywords):**  
   - Name: "High search volume keywords"  
   - JavaScript code:  
     ```javascript
     const topItems = $('Google Trends').first().json.related_queries.top;
     const filtered = topItems.filter(item => item.extracted_value > 30);
     const resultString = filtered.map(item => item.query).join(', ');
     return [{ json: { result: resultString } }];
     ```  
   - Connect 2 Most Trending → High search volume keywords.

5. **Add OpenAI node (Choosing Topic):**  
   - Name: "Choosing Topic"  
   - Model: GPT-3.5-turbo  
   - Credentials: Configure OpenAI API key credentials.  
   - Messages: System/user prompt instructing the model to choose one keyword from two trending keywords formatted as JSON, outputting only the chosen keyword. Use expressions to inject the two keywords from previous node.  
   - Connect High search volume keywords → Choosing Topic.

6. **Add HTTP Request node (Research Topic- Perplexity):**  
   - Name: "Research Topic- Perplexity"  
   - Method: POST  
   - URL: `https://api.perplexity.ai/chat/completions`  
   - Headers: Set authentication header with Perplexity API key.  
   - JSON Body: Includes system message with editorial style rules and user message requesting a LinkedIn post on the selected topic, using the output from Choosing Topic node.  
   - Connect Choosing Topic → Research Topic- Perplexity.

7. **Add Wait node:**  
   - Name: "Wait"  
   - Duration: 10 seconds  
   - Connect Research Topic- Perplexity → Wait.

8. **Add Split Out node:**  
   - Name: "Split Out"  
   - Field to split out: `choices[0].message.content` (the AI-generated post content)  
   - Connect Wait → Split Out.

9. **Add Twitter node (X1):**  
   - Name: "X1"  
   - Credentials: Twitter OAuth2 API credentials configured.  
   - Post text: Use split content dynamically.  
   - Connect Split Out → X1.

10. **Add Facebook Graph API node (Facebook Graph API1):**  
    - Name: "Facebook Graph API1"  
    - Method: POST  
    - Credentials: Facebook OAuth2 credentials configured.  
    - Post content: Use split content dynamically.  
    - Connect Split Out → Facebook Graph API1.

11. **Add LinkedIn node (LinkedIn1):**  
    - Name: "LinkedIn1"  
    - Person ID: Specify LinkedIn person URN.  
    - Authentication: LinkedIn Community Management OAuth2 credentials configured.  
    - Text: Set from AI content dynamically.  
    - Connect Split Out → LinkedIn1.

12. **Add Google Sheets node (Google Sheets2):**  
    - Name: "Google Sheets2"  
    - Operation: Append or Update row in a configured sheet.  
    - Columns mapped:  
      - Topic: From "Choosing Topic" output.  
      - Status: Set to "Posted".  
      - AI Output: Post content from LinkedIn1.  
      - Date Posted: Timestamp from schedule trigger.  
    - Credentials: Google Sheets OAuth2 API credentials configured.  
    - Connect LinkedIn1 → Google Sheets2.

13. **Add Sticky Notes for documentation:**  
    - Position and content as per logical blocks to enhance workflow clarity.

14. **Set node execution order:**  
    - Ensure nodes are connected as described to maintain flow integrity.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                 |
|-----------------------------------------------------------------------------------------------------|------------------------------------------------|
| Workflow uses SerpAPI for Google Trends data, requires valid SerpAPI key.                            | https://serpapi.com/                            |
| OpenAI GPT-3.5-turbo used for topic selection with a carefully constructed prompt.                   | https://openai.com/api                         |
| Perplexity AI API for AI-generated LinkedIn posts, requires API key and specific system/user prompts.| https://api.perplexity.ai/documentation        |
| LinkedIn posting requires correct person URN and Community Management OAuth2 credentials.           | https://docs.microsoft.com/en-us/linkedin/    |
| Twitter OAuth2 API credentials must have write permissions for posting tweets.                       | https://developer.twitter.com/en/docs/authentication/oauth-2-0 |
| Facebook Graph API requires access tokens with publishing permissions for pages or profiles.         | https://developers.facebook.com/docs/graph-api/ |
| Google Sheets OAuth2 credentials must allow edit access to target spreadsheet.                       | https://developers.google.com/sheets/api       |
| Use of Unicode characters and emojis recommended for LinkedIn post formatting per AI prompt.        | LinkedIn API formatting guidelines              |

---

**Disclaimer:** The provided text is exclusively derived from an automated n8n workflow. It respects all current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.