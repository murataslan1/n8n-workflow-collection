Auto-Generate AI News Commentary with Dumpling AI and GPT-4o

https://n8nworkflows.xyz/workflows/auto-generate-ai-news-commentary-with-dumpling-ai-and-gpt-4o-4884


# Auto-Generate AI News Commentary with Dumpling AI and GPT-4o

### 1. Workflow Overview

This workflow automates the generation of personalized AI news commentary based on trending topics. It targets content creators, marketers, and professionals who want to produce insightful LinkedIn-style commentary on AI and technology news without manual research. The workflow systematically fetches topics lacking commentary from a Google Sheet, searches for related news articles via Dumpling AI, scrapes and cleans article content, and uses GPT-4o to generate authentic, engaging commentary. Finally, it updates the original Google Sheet with the generated text.

The workflow is logically divided into two main blocks:

- **1.1 Fetch and Search News:** Triggered daily, this block fetches topics needing commentary and queries Dumpling AI’s news search API to gather relevant articles per topic.
- **1.2 Scrape, Clean, Generate Commentary, Append:** Processes each news article by scraping full content, cleaning extracted text, generating a LinkedIn-style commentary with GPT-4o, and appending the output back to the Google Sheet.

---

### 2. Block-by-Block Analysis

#### 2.1 Fetch and Search News

**Overview:**  
This block initiates the workflow on a daily schedule, retrieves AI news topics from a Google Sheet where commentary is missing, and searches for relevant news articles using Dumpling AI.

**Nodes Involved:**  
- Run on Schedule (Daily)  
- Fetch Topics with Empty Commentary  
- Loop Through Each Topic  
- No Operation, do nothing  
- Wait Before News Search  
- Search News with Dumpling AI  
- Split Returned News Articles  
- Sticky Note (describing this block)

**Node Details:**

- **Run on Schedule (Daily)**  
  - Type: Schedule Trigger  
  - Configuration: Fires once daily (default interval) to start the workflow automatically.  
  - Inputs: None  
  - Outputs: Triggers "Fetch Topics with Empty Commentary"  
  - Edge Cases: Failure if n8n scheduler is disabled or time zone mismatches cause unexpected trigger time.

- **Fetch Topics with Empty Commentary**  
  - Type: Google Sheets  
  - Role: Reads rows from a Google Sheet named "News articles" with the sheet "Sheet1" filtering for entries where the "generated commentary" field is empty. Returns the first match.  
  - Credentials: Google Sheets OAuth2  
  - Inputs: Triggered by the schedule node  
  - Outputs: Provides topic data to loop node  
  - Edge Cases:  
    - Google API auth failure  
    - Empty or malformed sheet data  
    - Network timeouts

- **Loop Through Each Topic**  
  - Type: SplitInBatches  
  - Role: Processes each topic individually in batches to handle one topic at a time downstream.  
  - Inputs: Data from Google Sheets node  
  - Outputs: Two outputs:  
    - Output 1: Connected to "No Operation, do nothing" (possibly for debugging or placeholder)  
    - Output 2: Connected to "Wait Before News Search" for processing  
  - Edge Cases: Large batch sizes might cause timeouts or rate limit issues.

- **No Operation, do nothing**  
  - Type: NoOp  
  - Role: Placeholder node, possibly for debugging or workflow expansion  
  - Inputs: From Loop node output 1  
  - Outputs: None  
  - Edge Cases: None functional; safe to ignore.

- **Wait Before News Search**  
  - Type: Wait  
  - Role: Delays execution slightly to manage rate limits before calling Dumpling AI news search  
  - Inputs: From Loop node output 2  
  - Outputs: To "Search News with Dumpling AI"  
  - Edge Cases: Excessive wait times might delay processing; too short could cause rate limiting.

- **Search News with Dumpling AI**  
  - Type: HTTP Request  
  - Role: Calls Dumpling AI’s `/search-news` POST endpoint with topic keyword, country set to US, page 3, language English  
  - Authentication: HTTP Header using a configured credential  
  - Input: Topic from previous node used as query parameter  
  - Output: JSON response containing news articles array  
  - Edge Cases:  
    - API key expiration or invalid credential  
    - Network failures or timeouts  
    - Unexpected API response schema  
  - Key Expressions:  
    - `query` set dynamically as `{{ $json.Topic }}`  

- **Split Returned News Articles**  
  - Type: SplitOut  
  - Role: Splits the array of news articles from the HTTP response into individual items for sequential processing  
  - Input: Output of the previous node  
  - Output: Individual news articles to scrape node  
  - Edge Cases: Empty or null "news" field in response leads to no downstream processing.

- **Sticky Note**  
  - Content: Explains that this block includes the scheduled trigger, fetches topics missing commentary, loops over each topic, waits for rate limiting, and retrieves news via Dumpling AI’s search API.

---

#### 2.2 Scrape, Clean, Generate Commentary, Append

**Overview:**  
Processes each extracted news article by scraping full article content, aggregating and cleaning the text, generating a LinkedIn-style AI commentary via GPT-4o, and appending the commentary back to the Google Sheet.

**Nodes Involved:**  
- Scrape Article Content with Dumpling AI  
- Aggregate Scraped Article Content  
- Clean Article Content (Code Node)  
- Generate LinkedIn Commentary (GPT-4o)  
- Append Commentary Back to Sheet  
- Sticky Note1 (describing this block)

**Node Details:**

- **Scrape Article Content with Dumpling AI**  
  - Type: HTTP Request  
  - Role: Calls Dumpling AI’s `/scrape` POST endpoint to retrieve full content of each article using article `link` field  
  - Input: Each news article item from Split Returned News Articles node  
  - Authentication: Same HTTP Header credential as search node  
  - Outputs: Scraped content JSON including field `content`  
  - Edge Cases:  
    - Invalid or unreachable URLs  
    - API failures or rate limits  
    - Missing content field in response

- **Aggregate Scraped Article Content**  
  - Type: Aggregate  
  - Role: Aggregates all scraped article contents into a single combined string for the current topic  
  - Configuration: Aggregates field `content` across all articles  
  - Input: Multiple scraped article content items  
  - Output: Single aggregated content object  
  - Edge Cases: Empty aggregation if no articles scraped

- **Clean Article Content**  
  - Type: Code (JavaScript)  
  - Role: Cleans the aggregated content string by removing URLs, markdown/HTML links, extra spaces, and trims text  
  - Key Code Logic:  
    - Removes `http(s)://` links, `www.` links  
    - Removes markdown links `[text](url)` to just `text`  
    - Removes HTML anchor tags `<a>...</a>`  
    - Removes multiple spaces  
  - Input: Aggregated content from previous node  
  - Output: JSON with key `cleaned_content`  
  - Edge Cases: Non-string content converted to JSON string to avoid errors

- **Generate LinkedIn Commentary (GPT-4o)**  
  - Type: Langchain OpenAI node  
  - Role: Sends a prompt to GPT-4o model to generate a first-person, insightful LinkedIn commentary under 600 characters based on cleaned article content and topic  
  - Model: `chatgpt-4o-latest`  
  - Credentials: OpenAI API key  
  - Input: Cleaned content and topic dynamically inserted into the prompt message  
  - Prompt Highlights:  
    - First-person confident tone  
    - Connects news to real-world trends  
    - Ends with engagement question/call to action  
    - Avoids fluff and buzzwords  
  - Output: AI-generated commentary text  
  - Edge Cases:  
    - API limits or failures  
    - Model returning empty or irrelevant content

- **Append Commentary Back to Sheet**  
  - Type: Google Sheets  
  - Role: Appends or updates the row in the Google Sheet matching the topic, inserting the generated commentary under "generated commentary" column  
  - Credentials: Google Sheets OAuth2  
  - Matching Column: `Topic` to update the correct row  
  - Input: Generated commentary and topic name  
  - Edge Cases:  
    - Sheet update conflicts  
    - Auth errors  
    - Mismatched topics causing duplicates or failures

- **Sticky Note1**  
  - Content: Describes that this block scrapes articles, cleans text, generates commentary with GPT-4o, and appends results back to the Google Sheet.

---

### 3. Summary Table

| Node Name                        | Node Type                    | Functional Role                                 | Input Node(s)                     | Output Node(s)                        | Sticky Note                                                                                               |
|---------------------------------|------------------------------|------------------------------------------------|----------------------------------|-------------------------------------|----------------------------------------------------------------------------------------------------------|
| Run on Schedule (Daily)          | Schedule Trigger             | Triggers workflow once daily                    | None                             | Fetch Topics with Empty Commentary   | 📥 Fetch Topics and Search News via Dumpling AI (applies to first block)                                  |
| Fetch Topics with Empty Commentary | Google Sheets               | Reads topics needing commentary                 | Run on Schedule (Daily)          | Loop Through Each Topic              | 📥 Fetch Topics and Search News via Dumpling AI                                                         |
| Loop Through Each Topic          | SplitInBatches              | Processes topics one at a time                   | Fetch Topics with Empty Commentary | No Operation, do nothing; Wait Before News Search | 📥 Fetch Topics and Search News via Dumpling AI                                                         |
| No Operation, do nothing         | NoOp                        | Placeholder/debugging                            | Loop Through Each Topic (output 1) | None                              | 📥 Fetch Topics and Search News via Dumpling AI                                                         |
| Wait Before News Search          | Wait                        | Adds delay for rate limit management             | Loop Through Each Topic (output 2) | Search News with Dumpling AI       | 📥 Fetch Topics and Search News via Dumpling AI                                                         |
| Search News with Dumpling AI     | HTTP Request                | Calls Dumpling AI news search API               | Wait Before News Search          | Split Returned News Articles         | 📥 Fetch Topics and Search News via Dumpling AI                                                         |
| Split Returned News Articles     | SplitOut                    | Splits news articles array into individual items | Search News with Dumpling AI     | Scrape Article Content with Dumpling AI | 📥 Fetch Topics and Search News via Dumpling AI                                                         |
| Scrape Article Content with Dumpling AI | HTTP Request          | Scrapes full article content                     | Split Returned News Articles     | Aggregate Scraped Article Content    | ✍️ Scrape Articles, Clean Text, Generate Commentary, and Append (applies to second block)                 |
| Aggregate Scraped Article Content | Aggregate                  | Combines all scraped article contents           | Scrape Article Content with Dumpling AI | Clean Article Content             | ✍️ Scrape Articles, Clean Text, Generate Commentary, and Append                                         |
| Clean Article Content            | Code                        | Cleans aggregated content text                    | Aggregate Scraped Article Content | Generate LinkedIn Commentary (GPT-4o) | ✍️ Scrape Articles, Clean Text, Generate Commentary, and Append                                         |
| Generate LinkedIn Commentary (GPT-4o) | Langchain OpenAI         | Generates LinkedIn-style commentary               | Clean Article Content            | Append Commentary Back to Sheet      | ✍️ Scrape Articles, Clean Text, Generate Commentary, and Append                                         |
| Append Commentary Back to Sheet  | Google Sheets               | Updates Google Sheet with generated commentary   | Generate LinkedIn Commentary (GPT-4o) | Loop Through Each Topic             | ✍️ Scrape Articles, Clean Text, Generate Commentary, and Append                                         |
| Sticky Note                     | Sticky Note                 | Describes first block logic                       | None                           | None                               | 📥 Fetch Topics and Search News via Dumpling AI                                                         |
| Sticky Note1                    | Sticky Note                 | Describes second block logic                      | None                           | None                               | ✍️ Scrape Articles, Clean Text, Generate Commentary, and Append                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node:**
   - Name: `Run on Schedule (Daily)`
   - Type: Schedule Trigger  
   - Configure to trigger once daily (default settings).

2. **Add a Google Sheets Node:**
   - Name: `Fetch Topics with Empty Commentary`
   - Operation: Read rows from a Google Sheet containing news topics.
   - Sheet Name: `Sheet1`
   - Document ID: Use your Google Sheets document ID for "News articles".
   - Filter: Only rows where `generated commentary` column is empty.
   - Credentials: Set up and link Google Sheets OAuth2 credentials.

3. **Add a SplitInBatches Node:**
   - Name: `Loop Through Each Topic`
   - Purpose: Process each topic individually.
   - Connect input from `Fetch Topics with Empty Commentary`.

4. **Add a No Operation Node (optional):**
   - Name: `No Operation, do nothing`
   - Connect to the first output of `Loop Through Each Topic` (used as placeholder/debug).

5. **Add a Wait Node:**
   - Name: `Wait Before News Search`
   - Connect to the second output of `Loop Through Each Topic`.
   - Purpose: Add a short delay to avoid API rate limits.
   - Default wait time is acceptable unless tuning is needed.

6. **Add an HTTP Request Node for News Search:**
   - Name: `Search News with Dumpling AI`
   - Method: POST  
   - URL: `https://app.dumplingai.com/api/v1/search-news`
   - Body (JSON):  
     ```json
     {
       "query": "{{ $json.Topic }}",
       "country": "US",
       "page": 3,
       "language": "en"
     }
     ```
   - Authentication: HTTP Header Auth with Dumpling AI API key.
   - Connect input from `Wait Before News Search`.

7. **Add a SplitOut Node:**
   - Name: `Split Returned News Articles`
   - Field to split out: `news` (array of articles from API response)
   - Connect input from `Search News with Dumpling AI`.

8. **Add an HTTP Request Node for Scraping Articles:**
   - Name: `Scrape Article Content with Dumpling AI`
   - Method: POST  
   - URL: `https://app.dumplingai.com/api/v1/scrape`
   - Body (JSON):  
     ```json
     {
       "url": "{{ $json.link }}"
     }
     ```
   - Authentication: Same HTTP Header Auth as news search.
   - Connect input from `Split Returned News Articles`.

9. **Add an Aggregate Node:**
   - Name: `Aggregate Scraped Article Content`
   - Operation: Aggregate field `content` from all scraped articles into one combined string.
   - Connect input from `Scrape Article Content with Dumpling AI`.

10. **Add a Code Node:**
    - Name: `Clean Article Content`
    - Language: JavaScript  
    - Code:  
      ```javascript
      let rawContent = $input.first().json.content;
      if (typeof rawContent !== 'string') {
        rawContent = JSON.stringify(rawContent);
      }
      const cleaned = rawContent
        .replace(/https?:\/\/[^\s]+/g, '')           // Remove URLs
        .replace(/www\.[^\s]+/g, '')                  // Remove www links
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')      // Remove markdown links
        .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')        // Remove HTML anchor tags
        .replace(/\s{2,}/g, ' ')                       // Remove extra spaces
        .trim();
      return [{ json: { cleaned_content: cleaned } }];
      ```
    - Connect input from `Aggregate Scraped Article Content`.

11. **Add an OpenAI Node (Langchain OpenAI):**
    - Name: `Generate LinkedIn Commentary (GPT-4o)`
    - Model: `chatgpt-4o-latest`
    - Credentials: OpenAI API key
    - Message content (dynamic prompt):  
      ```
      You are a thought leader on LinkedIn. I will provide you with news articles related to {{ $('Fetch Topics with Empty Commentary').item.json.Topic }}, and you will write a personal commentary in a confident, insightful, first-person voice.

      Your response should:
      - Start with a strong personal opinion or observation
      - Briefly connect the news to real-world trends or implications
      - Mention how this relates to your work, experience, or thinking
      - Use a human tone, no robotic phrasing or generic statements
      - End with a question or call to action to invite engagement

      Keep it under 600 characters. Avoid buzzwords or fluff. Be authentic.

      Here are the news articles: {{ $json.cleaned_content }}
      ```
    - Connect input from `Clean Article Content`.

12. **Add a Google Sheets Node:**
    - Name: `Append Commentary Back to Sheet`
    - Operation: Append or update row in Google Sheet.
    - Sheet Name: `Sheet1`
    - Document ID: Same as before.
    - Columns to update:  
      - `Topic`: `={{ $('Fetch Topics with Empty Commentary').item.json.Topic }}`  
      - `generated commentary`: `={{ $json.message.content }}`
    - Matching Column: `Topic`
    - Credentials: Google Sheets OAuth2
    - Connect input from `Generate LinkedIn Commentary (GPT-4o)`.
    - Connect output back to `Loop Through Each Topic` to continue processing next topic.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                              | Context or Link                                                                                                               |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| 📥 Fetch Topics and Search News via Dumpling AI: This block uses Dumpling AI’s powerful news search API to retrieve the latest articles based on topics missing commentary.                                                | Sticky Note at workflow start                                                                                                 |
| ✍️ Scrape Articles, Clean Text, Generate Commentary, and Append: Describes the process of scraping full article content, cleaning it, generating authentic commentary with GPT-4o, and updating the Google Sheet accordingly. | Sticky Note near scraping and commentary generation nodes                                                                     |
| Dumpling AI API Documentation and Access: https://app.dumplingai.com/api-docs                                                                                                                                              | Useful for troubleshooting and extending HTTP request nodes                                                                   |
| OpenAI GPT-4o Model Details: https://platform.openai.com/docs/models/gpt-4o                                                                                                                                                 | For understanding capabilities and limitations of the AI model used                                                           |
| Google Sheets OAuth2 Setup Guide: https://docs.n8n.io/credentials/google-sheets/                                                                                                                                             | Required for Google Sheets node authentication                                                                                 |

---

**Disclaimer:**  
The provided text is solely derived from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected content. All data handled is legal and publicly accessible.