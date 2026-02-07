Automate Trend Research to Blog Content with GPT-4o, DALL-E & Apify to Notion

https://n8nworkflows.xyz/workflows/automate-trend-research-to-blog-content-with-gpt-4o--dall-e---apify-to-notion-11094


# Automate Trend Research to Blog Content with GPT-4o, DALL-E & Apify to Notion

### 1. Workflow Overview

This workflow automates the end-to-end process of researching trending topics, generating blog article ideas, drafting full articles with AI assistance, creating cover images, and saving the results in Notion while notifying a Slack channel. Its primary use case is content marketing teams or bloggers who want to generate data-driven, AI-enhanced blog posts on a scheduled basis, leveraging Google search trends and OpenAI’s GPT-4o and DALL-E models.

The workflow is logically divided into four main blocks:

- **1.1 Scheduling & Configuration:** Scheduled trigger and setting up search keywords and integration parameters.
- **1.2 Research & Analysis:** Scraping Google search results via Apify and generating article ideas using AI.
- **1.3 Content Creation:** Writing full article text with GPT-4o and generating cover images with DALL-E.
- **1.4 Save & Notify:** Saving articles to Notion and sending completion notifications to Slack.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduling & Configuration

- **Overview:**  
  This block triggers the workflow on a weekly basis and initializes configuration parameters such as the search keyword, Apify actor ID, Notion database ID, and Slack channel.

- **Nodes Involved:**  
  - Weekly Monday 9AM Trigger  
  - Workflow Configuration

- **Node Details:**

  - **Weekly Monday 9AM Trigger**  
    - Type: Schedule Trigger  
    - Role: Initiates workflow every Monday at 9 AM  
    - Configuration: Set to trigger weekly on Monday at 09:00  
    - Inputs: None (trigger node)  
    - Outputs: Connects to Workflow Configuration  
    - Edge cases: Missed triggers due to downtime or time zone issues  
    - Version: 1.2

  - **Workflow Configuration**  
    - Type: Set node  
    - Role: Defines static workflow parameters such as:  
      - `searchKeyword` = "2025年 AIツール" (Japanese for "2025 AI tools")  
      - `apifyActorId` = "apify/google-search-scraper"  
      - `notionDatabaseId` = Placeholder for Notion DB ID (must be set before use)  
      - `slackChannel` = Placeholder for Slack channel ID or name  
    - Inputs: From Weekly Monday 9AM Trigger  
    - Outputs: Connects to Run an Actor and get dataset  
    - Edge cases: Missing or incorrect placeholders will cause downstream failures  
    - Version: 3.4

---

#### 2.2 Research & Analysis

- **Overview:**  
  This block fetches Google search results using Apify’s Google Search Scraper actor, then feeds the results into OpenAI GPT-4o to generate 3 distinct blog article ideas in a structured JSON format. The JSON ideas are parsed for downstream use.

- **Nodes Involved:**  
  - Run an Actor and get dataset  
  - AI Editorial Meeting - Generate 3 Article Ideas  
  - Parse Article Ideas JSON

- **Node Details:**

  - **Run an Actor and get dataset**  
    - Type: Apify node  
    - Role: Executes Apify’s Google Search Scraper actor with parameters from Workflow Configuration  
    - Configuration:  
      - Actor ID: "nFJndFXA5zjCTuudP" (Apify Google Search Scraper)  
      - Input JSON:  
        - queries: searchKeyword from config  
        - maxPagesPerQuery: 1  
        - resultsPerPage: 5  
        - countryCode: jp  
        - languageCode: ja  
    - Inputs: From Workflow Configuration  
    - Outputs: Connects to AI Editorial Meeting  
    - Edge cases: Apify API quota limits, actor failures, network timeouts  
    - Version: 1

  - **AI Editorial Meeting - Generate 3 Article Ideas**  
    - Type: OpenAI (LangChain) node  
    - Role: Uses GPT-4o to analyze Google search results and generate 3 blog article ideas, each with an angle, title, outline, and image prompt in JSON  
    - Configuration:  
      - Model: GPT-4o  
      - Prompt: Japanese instructions requesting 3 article ideas as JSON array with specific fields  
      - Input: JSON stringified Apify search results  
    - Inputs: From Run an Actor and get dataset  
    - Outputs: Connects to Parse Article Ideas JSON  
    - Credentials: OpenAI API key required  
    - Edge cases: API rate limits, prompt parsing errors, malformed JSON output  
    - Version: 2

  - **Parse Article Ideas JSON**  
    - Type: Code node (JavaScript)  
    - Role: Extracts the JSON array of article ideas from the AI response text and outputs each idea as a separate item for iteration  
    - Key logic:  
      - Extract text from various possible response structures  
      - Locate JSON array between brackets `[...]`  
      - Parse JSON safely with error handling  
      - Output one item per idea object  
    - Inputs: From AI Editorial Meeting  
    - Outputs: Connects to AI Writer - Generate Article Content  
    - Edge cases: If AI response format changes, parsing may fail or return empty  
    - Version: 2

---

#### 2.3 Content Creation

- **Overview:**  
  This block generates the full article content using GPT-4o based on the parsed article ideas, then creates a cover image for each article using DALL-E.

- **Nodes Involved:**  
  - AI Writer - Generate Article Content  
  - DALL-E Generate Cover Image

- **Node Details:**

  - **AI Writer - Generate Article Content**  
    - Type: OpenAI (LangChain) node  
    - Role: Writes a full blog article in Markdown format, using the title and outline from each parsed article idea  
    - Configuration:  
      - Model: GPT-4o conversation mode  
      - Prompt: Japanese instructions to write a professional article with no HTML, only Markdown  
      - Variables: Uses title and outline from the current item (from Parse Article Ideas JSON)  
    - Inputs: From Parse Article Ideas JSON (iterates per idea)  
    - Outputs: Connects to DALL-E Generate Cover Image  
    - Edge cases: API errors, long content truncation or token limits  
    - Credentials: OpenAI API key required  
    - Version: 2

  - **DALL-E Generate Cover Image**  
    - Type: OpenAI (LangChain) node for image generation  
    - Role: Generates a 1024x1024 cover image based on the article’s image_prompt field (in English)  
    - Configuration:  
      - Prompt: image_prompt from current item  
      - Size: 1024x1024  
      - Quality: standard  
      - Returns image URLs  
    - Inputs: From AI Writer  
    - Outputs: Connects to Save Article to Notion  
    - Credentials: OpenAI API key required  
    - Edge cases: Image generation failures, prompt too vague or inappropriate  
    - Version: 2

---

#### 2.4 Save & Notify

- **Overview:**  
  This block saves each generated article with its cover image into the specified Notion database and then aggregates all article URLs to send a Slack notification reporting completion.

- **Nodes Involved:**  
  - Save Article to Notion  
  - Aggregate All Articles  
  - Send Completion Notification to Slack

- **Node Details:**

  - **Save Article to Notion**  
    - Type: Notion node  
    - Role: Creates a new page in the configured Notion database per article  
    - Configuration:  
      - Title: Article title from parsed idea  
      - Content block:  
        - Includes the generated cover image URL as an image block  
        - Includes article content text as rich text block  
      - Database ID: Must be set to target Notion database  
    - Inputs: From DALL-E Generate Cover Image  
    - Outputs: Connects to Aggregate All Articles  
    - Credentials: Notion API key required  
    - Edge cases: Notion API quota, invalid database ID, permission errors  
    - Version: 2.2

  - **Aggregate All Articles**  
    - Type: Aggregate node  
    - Role: Aggregates all saved article URLs from the previous node into a single array for notification  
    - Configuration:  
      - Aggregation: Aggregate all item data  
      - Fields included: url  
    - Inputs: From Save Article to Notion  
    - Outputs: Connects to Send Completion Notification to Slack  
    - Edge cases: Missing URLs if Notion fails to return them properly  
    - Version: 1

  - **Send Completion Notification to Slack**  
    - Type: Slack node  
    - Role: Sends a formatted message to the configured Slack channel listing all saved article URLs, confirming workflow completion  
    - Configuration:  
      - Text: Japanese message with checkmark, list of URLs  
      - Channel: Configured Slack channel (name or ID)  
      - Authentication: OAuth2  
    - Inputs: From Aggregate All Articles  
    - Outputs: End of workflow  
    - Credentials: Slack OAuth2 token  
    - Edge cases: Slack API rate limits, invalid channel, auth token expiry  
    - Version: 2.3

---

### 3. Summary Table

| Node Name                          | Node Type                              | Functional Role                             | Input Node(s)                         | Output Node(s)                        | Sticky Note                                                                                          |
|-----------------------------------|--------------------------------------|---------------------------------------------|-------------------------------------|-------------------------------------|----------------------------------------------------------------------------------------------------|
| Weekly Monday 9AM Trigger          | Schedule Trigger                     | Start workflow weekly on Monday 9 AM        | None                                | Workflow Configuration              | ## 1. Configuration\nSet the schedule and target keywords here.                                   |
| Workflow Configuration             | Set                                  | Define keywords, actor IDs, and integration params | Weekly Monday 9AM Trigger           | Run an Actor and get dataset         | ## 1. Configuration\nSet the schedule and target keywords here.                                   |
| Run an Actor and get dataset       | Apify actor node                     | Scrape Google search results                 | Workflow Configuration             | AI Editorial Meeting - Generate 3 Article Ideas | ## 2. Research & Analysis\nScrapes trend data via Apify and structures the article plan using AI. |
| AI Editorial Meeting - Generate 3 Article Ideas | OpenAI GPT-4o (LangChain) node      | Generate 3 article ideas from search data    | Run an Actor and get dataset        | Parse Article Ideas JSON             | ## 2. Research & Analysis\nScrapes trend data via Apify and structures the article plan using AI. |
| Parse Article Ideas JSON           | Code (JavaScript)                    | Parse JSON array of article ideas from AI response | AI Editorial Meeting              | AI Writer - Generate Article Content | ## 2. Research & Analysis\nScrapes trend data via Apify and structures the article plan using AI. |
| AI Writer - Generate Article Content | OpenAI GPT-4o (LangChain) node      | Generate full blog article text in Markdown | Parse Article Ideas JSON             | DALL-E Generate Cover Image          | ## 3. Content Creation\nWrites the article body and generates a cover image.                      |
| DALL-E Generate Cover Image        | OpenAI Image generation (DALL-E)    | Generate 1024x1024 cover image from prompt  | AI Writer - Generate Article Content | Save Article to Notion              | ## 3. Content Creation\nWrites the article body and generates a cover image.                      |
| Save Article to Notion             | Notion node                         | Save article and image to Notion database    | DALL-E Generate Cover Image          | Aggregate All Articles               | ## 4. Save & Notify\nSaves the draft to Notion and sends a report to Slack.                       |
| Aggregate All Articles             | Aggregate node                      | Collect all article URLs for notification    | Save Article to Notion               | Send Completion Notification to Slack | ## 4. Save & Notify\nSaves the draft to Notion and sends a report to Slack.                       |
| Send Completion Notification to Slack | Slack node                        | Send completion message with article URLs    | Aggregate All Articles               | None                                | ## 4. Save & Notify\nSaves the draft to Notion and sends a report to Slack.                       |
| Sticky Note                       | Sticky Note                         | Workflow overview and setup instructions     | None                                | None                                | ##  How it works\nThis workflow automates the process of creating trend-based blog posts.\n1. **Schedule & Config**: Triggers weekly and defines the search keyword.\n2. **Research**: Scrapes Google/Social trends via Apify and analyzes them with AI.\n3. **Drafting**: Generates a full article and a DALL-E 3 cover image based on the analysis.\n4. **Publishing**: Saves the draft to Notion and notifies the team on Slack.\n\n## Setup steps\n1. **Credentials**: Configure your credentials for **Apify**, **OpenAI**, **Notion**, and **Slack**.\n2. **Configuration**: Open the **'Workflow Configuration'** node and set your target `Keyword`.\n3. **Apify Actor**: Ensure you have the Google Search Scraper actor available in your Apify account.\n4. **Notion**: Select your target Database in the Notion node. |
| Sticky Note1                      | Sticky Note                         | Scheduling & Configuration summary           | None                                | None                                | ## 1. Configuration\nSet the schedule and target keywords here.                                   |
| Sticky Note2                      | Sticky Note                         | Research & Analysis summary                    | None                                | None                                | ## 2. Research & Analysis\nScrapes trend data via Apify and structures the article plan using AI. |
| Sticky Note3                      | Sticky Note                         | Content Creation summary                       | None                                | None                                | ## 3. Content Creation\nWrites the article body and generates a cover image.                      |
| Sticky Note4                      | Sticky Note                         | Save & Notify summary                          | None                                | None                                | ## 4. Save & Notify\nSaves the draft to Notion and sends a report to Slack.                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Name: `Weekly Monday 9AM Trigger`  
   - Type: Schedule Trigger  
   - Set to trigger every week on Monday at 09:00.

2. **Create a Set node for configuration:**  
   - Name: `Workflow Configuration`  
   - Define variables:  
     - `searchKeyword`: `"2025年 AIツール"`  
     - `apifyActorId`: `"apify/google-search-scraper"`  
     - `notionDatabaseId`: Set your Notion database ID here  
     - `slackChannel`: Set your Slack channel ID or name here  
   - Connect output of the schedule trigger to this node.

3. **Create an Apify node to run the Google Search Scraper actor:**  
   - Name: `Run an Actor and get dataset`  
   - Set Actor ID to Apify’s Google Search Scraper actor (ID: `nFJndFXA5zjCTuudP`)  
   - Set operation: Run actor and get dataset  
   - Input JSON:  
     ```json
     {
       "queries": "={{ $json.searchKeyword }}",
       "maxPagesPerQuery": 1,
       "resultsPerPage": 5,
       "countryCode": "jp",
       "languageCode": "ja"
     }
     ```  
   - Connect output of `Workflow Configuration` to this node.  
   - Set Apify credentials.

4. **Add an OpenAI node using GPT-4o for idea generation:**  
   - Name: `AI Editorial Meeting - Generate 3 Article Ideas`  
   - Use GPT-4o model  
   - Set prompt to instruct the AI to generate 3 article ideas based on the Google search results JSON (see prompt in overview)  
   - Input: Use output from Apify node  
   - Connect output of Apify node to this node.  
   - Set OpenAI credentials.

5. **Add a Code node to parse the JSON article ideas:**  
   - Name: `Parse Article Ideas JSON`  
   - Paste provided JavaScript code to extract JSON array from AI response text  
   - Connect output of AI Editorial Meeting node to this node.

6. **Add an OpenAI node for article writing:**  
   - Name: `AI Writer - Generate Article Content`  
   - Use GPT-4o conversation mode  
   - Prompt: Write article text in Markdown using title and outline from current item  
   - Connect output of `Parse Article Ideas JSON` node to this node.  
   - Set OpenAI credentials.

7. **Add an OpenAI DALL-E image generation node:**  
   - Name: `DALL-E Generate Cover Image`  
   - Use image prompt from current item’s `image_prompt` field  
   - Set image size to 1024x1024, quality standard  
   - Connect output of `AI Writer - Generate Article Content` to this node.  
   - Set OpenAI credentials.

8. **Add a Notion node to save article and cover image:**  
   - Name: `Save Article to Notion`  
   - Resource: Database Page  
   - Database ID: Use the configured Notion database ID  
   - Title: Use current item’s `title`  
   - Content blocks:  
     - Image block with URL from DALL-E node output  
     - Rich text block with article content from AI Writer node output  
   - Connect output of DALL-E node to this node.  
   - Set Notion credentials.

9. **Add an Aggregate node to collect all saved article URLs:**  
   - Name: `Aggregate All Articles`  
   - Aggregate all item data with field `url`  
   - Connect output of Notion node to this node.

10. **Add Slack node to send completion notification:**  
    - Name: `Send Completion Notification to Slack`  
    - Message:  
      ```
      ✅ *AI編集部レポート*

      3本の記事案をNotionに格納しました！

      {{ $json.url.map((url, i) => `${i+1}. ${url}`).join('\n') }}

      確認してください 📝
      ```  
    - Channel: Use configured Slack channel from configuration  
    - Authentication: OAuth2 Slack credentials  
    - Connect output of Aggregate node to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                   | Context or Link                                               |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| This workflow automates trend-based blog content creation using Apify for data scraping, OpenAI GPT-4o for text generation, DALL-E for image creation, Notion for content storage, and Slack for team notifications.                              | Workflow overview sticky note                                 |
| Ensure all credentials for Apify, OpenAI, Notion, and Slack are properly configured and tested before running the workflow. Missing or incorrect credentials will cause failures at respective nodes.                                           | Setup step note in sticky note                                |
| Apify Actor used: Google Search Scraper (apify/google-search-scraper) — ensure this actor is available and operational in your Apify account.                                                                                                | Apify actor note in sticky note                               |
| Notion Database ID and Slack Channel ID placeholders must be replaced with actual values to enable saving and notifications.                                                                                                                | Configuration sticky note                                     |
| The workflow uses Japanese language prompts and keywords targeting Japanese content but can be adapted for other languages by changing keywords and prompt text accordingly.                                                                  | Localization note                                            |
| For best results, monitor API rate limits and quota usage on OpenAI and Apify to avoid unexpected interruptions.                                                                                                                             | API usage note                                               |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with content policies and does not include illegal, offensive, or protected elements. All manipulated data is legal and public.