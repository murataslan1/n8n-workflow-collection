Automate YouTube Content Strategy with AI, Apify & Google Sheets

https://n8nworkflows.xyz/workflows/automate-youtube-content-strategy-with-ai--apify---google-sheets-10808


# Automate YouTube Content Strategy with AI, Apify & Google Sheets

### 1. Workflow Overview

This workflow automates a YouTube content strategy process using AI, Apify data scraping, and Google Sheets for data storage and analysis. It targets YouTube content creators, marketers, and strategists aiming to analyze competitor channels, niche trends, and audience feedback to generate optimized video ideas with compelling titles and thumbnails.

The workflow is logically divided into five main phases:

- **1.1 Niche Outliers (Phase 1)**: Accepts input of three high-quality YouTube channel URLs, scrapes their popular videos, analyzes titles and thumbnails for power words and visual hooks, and stores the results in Google Sheets.

- **1.2 Broad Niche Insights Weekly (Phase 2)**: Scrapes trending videos weekly for a broad niche keyword, analyzes video titles and thumbnails similarly, and logs data to Google Sheets.

- **1.3 Niche Insights Daily (Phase 3)**: Runs daily scraping and analysis on a specific niche keyword (e.g., “n8n”), collecting recent popular videos and analyzing content performance.

- **1.4 Comment Analysis (Phase 4)**: Scrapes comments from a specified YouTube channel, aggregates and analyzes viewer sentiment and requests using AI, then saves the insights to Google Sheets.

- **1.5 Ideation (Phase 5)**: Combines all gathered data—titles, power words, thumbnail analysis, and audience desires—to generate three new video title and thumbnail ideas tailored to the channel, which are then saved and a Slack notification is sent.

---

### 2. Block-by-Block Analysis

#### 1.1 Niche Outliers (Phase 1)

- **Overview:**  
  This block starts with a form submission trigger where a user inputs three YouTube channel URLs. It then scrapes each channel’s popular videos, analyzes their titles and thumbnails to extract power words and thumbnail appeal, and stores these insights in a Google Sheet.

- **Nodes Involved:**  
  - On form submission  
  - 3 Channels  
  - Split Out  
  - Loop Over Items  
  - Channel Outliers  
  - Sort1  
  - Filter  
  - Limit  
  - Set Fields  
  - Title Analyzer  
  - GPT 4.1-mini  
  - Analyze Thumbnails  
  - Merge  
  - Niche Outliers Data  
  - Sticky Note (Phase 1)

- **Node Details:**

  - **On form submission**  
    - *Type:* Form Trigger  
    - *Role:* Entry point for manual input of three YouTube channel URLs  
    - *Config:* Form titled "Niche Outliers" with required fields for Channel 1, 2, and 3 URLs  
    - *Input/Output:* Output triggers next node with form JSON data  
    - *Failures:* Missing or invalid URLs, webhook connectivity problems

  - **3 Channels**  
    - *Type:* Set  
    - *Role:* Aggregates the three channel URLs into an array named `channels`  
    - *Expressions:* Uses JSON from form submission to collect URLs  
    - *Output:* Array passed downstream  

  - **Split Out**  
    - *Type:* SplitOut  
    - *Role:* Splits the `channels` array into individual items for processing  
    - *Output:* One channel URL per item to next node  

  - **Loop Over Items**  
    - *Type:* SplitInBatches  
    - *Role:* Manages batch iteration over individual channels for API calls and analysis  
    - *Output:* Executes Channel Outliers for each channel  

  - **Channel Outliers**  
    - *Type:* HTTP Request  
    - *Role:* Calls Apify YouTube Scraper API to get top 30 popular videos for each channel URL (sorted by views)  
    - *Config:* POST request with query parameters including API token (must be set)  
    - *Inputs:* Channel URL from Loop Over Items  
    - *Outputs:* Video metadata JSON  
    - *Failures:* API errors, rate limits, invalid token  

  - **Sort1**  
    - *Type:* Sort  
    - *Role:* Sorts scraped videos by view count descending  
    - *Input:* Video list from Channel Outliers  
    - *Output:* Sorted video list  

  - **Filter**  
    - *Type:* Filter  
    - *Role:* Filters videos newer than 6 months ago (date comparison)  
    - *Input:* Sorted videos  
    - *Output:* Filtered videos  

  - **Limit**  
    - *Type:* Limit  
    - *Role:* Limits output to 10 videos maximum per channel  
    - *Input:* Filtered videos  
    - *Output:* Limited videos  

  - **Set Fields**  
    - *Type:* Set  
    - *Role:* Extracts and sets key video fields (channel name, title, URL, thumbnail URL, views, likes) for further processing  
    - *Input:* Video JSON  
    - *Output:* Simplified structured data  

  - **Title Analyzer**  
    - *Type:* Langchain Agent  
    - *Role:* Uses AI to extract 1-3 “power words” from each video title that drive clicks  
    - *Config:* System prompt defines power word extraction logic  
    - *Input:* Video title from Set Fields  
    - *Output:* List of power words  
    - *Failures:* AI service availability, prompt failures  

  - **GPT 4.1-mini**  
    - *Type:* Langchain LM Chat (OpenRouter/OpenAI)  
    - *Role:* Language model used by Title Analyzer node for processing  
    - *Config:* Credential required for OpenRouter or OpenAI API  

  - **Analyze Thumbnails**  
    - *Type:* Langchain OpenAI (image analysis)  
    - *Role:* Analyzes thumbnail images to identify visual hooks and attention-grabbing features  
    - *Config:* Uses ChatGPT-4o model, max 50 tokens, receives thumbnail URL from Set Fields  
    - *Output:* Concise thumbnail analysis text  
    - *Failures:* Image URL validity, API limits  

  - **Merge**  
    - *Type:* Merge  
    - *Role:* Combines outputs from Title Analyzer, Analyze Thumbnails, and Set Fields nodes by position to unify video data  
    - *Input:* Multiple data streams per video  
    - *Output:* Combined JSON per video  

  - **Niche Outliers Data**  
    - *Type:* Google Sheets  
    - *Role:* Appends analyzed video data (title, views, likes, power words, thumbnail analysis, etc.) into a Google Sheets document under the “Niche Outliers” tab  
    - *Config:* Requires Google Sheets credentials and correct sheet/document IDs  
    - *Failures:* Authentication issues, sheet access, quota limits  

  - **Sticky Note (Phase 1)**  
    - *Type:* Sticky Note  
    - *Role:* Visual label marking this phase on the workflow canvas  

---

#### 1.2 Broad Niche Insights Weekly (Phase 2)

- **Overview:**  
  Weekly scheduled scraping of popular videos for a broad niche keyword (e.g., “artificial intelligence”), analysis of titles and thumbnails, and storage of data for trend tracking.

- **Nodes Involved:**  
  - Sundays (Schedule Trigger)  
  - Broad Niche (Set niche keyword)  
  - Scrape YT (Apify API HTTP Request)  
  - Title Analyzer1 (AI power word extraction)  
  - GPT 4.1-mini1 (LM for Title Analyzer1)  
  - Analyze Thumbnails1 (AI thumbnail analysis)  
  - Broad Niche Weekly (Google Sheets append)  
  - Sticky Note1 (Phase 2 label)

- **Node Details:**

  - **Sundays**  
    - *Type:* Schedule Trigger  
    - *Role:* Runs the workflow weekly on Sundays at 5 AM  
    - *Failures:* Scheduler misconfiguration  

  - **Broad Niche**  
    - *Type:* Set  
    - *Role:* Defines the broad niche keyword to search (default “artificial intelligence”)  
    - *Output:* Injects `niche` variable for downstream nodes  

  - **Scrape YT**  
    - *Type:* HTTP Request  
    - *Role:* Calls Apify YouTube Scraper API to fetch top 5 trending videos for niche keyword within the last week, sorted by views  
    - *Config:* POST with niche as search query, API key required  
    - *Failures:* API rate limits, invalid params  

  - **Title Analyzer1**  
    - *Type:* Langchain Agent  
    - *Role:* Same as Title Analyzer in Phase 1, extracts power words from video titles  
    - *Input:* Scrape YT video titles  

  - **GPT 4.1-mini1**  
    - *Type:* LM Chat model for Title Analyzer1  

  - **Analyze Thumbnails1**  
    - *Type:* Langchain OpenAI (image analysis)  
    - *Role:* Analyzes thumbnails from scraped videos for visual appeal  

  - **Broad Niche Weekly**  
    - *Type:* Google Sheets  
    - *Role:* Appends video data with analysis to a dedicated “Broad Niche Weekly” tab for trend analysis over time  

  - **Sticky Note1**  
    - *Type:* Sticky Note  
    - *Role:* Label for Phase 2  

---

#### 1.3 Niche Insights Daily (Phase 3)

- **Overview:**  
  Daily scraping and analysis for a specific niche keyword (example: “n8n”), gathering recent popular videos, analyzing titles and thumbnails, and recording data for ongoing performance tracking.

- **Nodes Involved:**  
  - 6 am (Schedule Trigger)  
  - Niche (Set niche keyword)  
  - Scrape YT1 (Apify API HTTP Request)  
  - Title Analyzer2 (AI power word extraction)  
  - GPT 4.1-mini2 (LM for Title Analyzer2)  
  - Analyze Thumbnails2 (AI thumbnail analysis)  
  - Niche Daily (Google Sheets append)  
  - Sticky Note2 (Phase 3 label)

- **Node Details:**

  - **6 am**  
    - *Type:* Schedule Trigger  
    - *Role:* Runs daily at 6 AM  

  - **Niche**  
    - *Type:* Set  
    - *Role:* Sets specific niche keyword (default “n8n”)  

  - **Scrape YT1**  
    - *Type:* HTTP Request  
    - *Role:* Scrapes videos similarly to prior scraping nodes but for daily data  

  - **Title Analyzer2**  
    - *Type:* Langchain Agent  
    - *Role:* Extracts power words for daily videos  

  - **GPT 4.1-mini2**  
    - *Type:* LM Chat for Title Analyzer2  

  - **Analyze Thumbnails2**  
    - *Type:* Langchain OpenAI (image analysis)  

  - **Niche Daily**  
    - *Type:* Google Sheets  
    - *Role:* Stores daily video insights in “Niche Daily” tab  

  - **Sticky Note2**  
    - *Type:* Sticky Note  

---

#### 1.4 Comment Analysis (Phase 4)

- **Overview:**  
  Retrieves recent comments from a channel’s videos, aggregates user opinions, and uses AI to identify what audiences like, dislike, and want more of. Saves this structured insight into Google Sheets.

- **Nodes Involved:**  
  - Channel URL (Set channel URL)  
  - Scrape Channel (Apify YouTube Scraper)  
  - Get Comments (Apify YouTube Comments Scraper)  
  - Aggregate1 (Aggregate comments)  
  - Comment Analyzer (Langchain Agent)  
  - GPT 4.1-mini3 (LM for Comment Analyzer)  
  - Insights (Structured output parser for comment analysis)  
  - Comment Analysis (Google Sheets append)  
  - Aggregate (Aggregate video data for ideation)  
  - Channel Description (Set channel description for context)  
  - Sticky Note4 (Phase 4 label)

- **Node Details:**

  - **Channel URL**  
    - *Type:* Set  
    - *Role:* Sets the YouTube channel URL to analyze comments for (default to Nate Herk channel)  

  - **Scrape Channel**  
    - *Type:* HTTP Request  
    - *Role:* Scrapes newest 5 videos from the channel to get URLs for comment scraping  

  - **Get Comments**  
    - *Type:* HTTP Request  
    - *Role:* Scrapes up to 30 newest comments per video  

  - **Aggregate1**  
    - *Type:* Aggregate  
    - *Role:* Combines all comments into a single list  

  - **Comment Analyzer**  
    - *Type:* Langchain Agent  
    - *Role:* Analyzes comments to produce three categories: what is done well, dislikes, and requests  
    - *Output Parser:* Structured JSON output  

  - **GPT 4.1-mini3**  
    - *Type:* LM Chat for Comment Analyzer  

  - **Insights**  
    - *Type:* Output Parser Structured  
    - *Role:* Parses AI comment analysis output into typed fields  

  - **Comment Analysis**  
    - *Type:* Google Sheets  
    - *Role:* Appends the categorized comment insights into the “Comment Analysis” tab  

  - **Aggregate**  
    - *Type:* Aggregate  
    - *Role:* Aggregates video data fields for use in ideation  

  - **Channel Description**  
    - *Type:* Set  
    - *Role:* Provides a detailed textual description of the channel's focus to inform AI ideation  

  - **Sticky Note4**  
    - *Type:* Sticky Note  

---

#### 1.5 Ideation (Phase 5)

- **Overview:**  
  Combines all previous insights—titles, power words, thumbnail analyses, and audience desires—to generate three new compelling YouTube video title and thumbnail ideas via an AI agent. Stores output in Google Sheets and sends a Slack notification.

- **Nodes Involved:**  
  - Creative Agent (Langchain Agent for ideation)  
  - GPT 4.1-mini4 (LM for Creative Agent)  
  - Titles & Thumbs (Output parser for structured results)  
  - Append Ideas (Google Sheets append)  
  - Notification (Slack notification)  
  - Sticky Note5 (Phase 5 label)

- **Node Details:**

  - **Creative Agent**  
    - *Type:* Langchain Agent  
    - *Role:* Generates three unique YouTube video title and thumbnail ideas based on aggregated inputs and channel description  
    - *Input:* Aggregated titles, power words, thumbnail analysis, and audience wants  
    - *Output Parser:* Structured output defining title and thumbnail fields  
    - *Failures:* AI model errors, prompt misalignment  

  - **GPT 4.1-mini4**  
    - *Type:* LM Chat for Creative Agent  

  - **Titles & Thumbs**  
    - *Type:* Output Parser Structured  
    - *Role:* Parses Creative Agent’s raw text output into structured JSON fields for titles and thumbnails  

  - **Append Ideas**  
    - *Type:* Google Sheets  
    - *Role:* Appends generated ideas into “Ideation” tab in Google Sheets  

  - **Notification**  
    - *Type:* Slack  
    - *Role:* Sends message to Slack channel notifying completion, including link to Google Sheet results  

  - **Sticky Note5**  
    - *Type:* Sticky Note  

---

### 3. Summary Table

| Node Name           | Node Type                             | Functional Role                                 | Input Node(s)                          | Output Node(s)                      | Sticky Note                                       |
|---------------------|-------------------------------------|------------------------------------------------|--------------------------------------|-----------------------------------|--------------------------------------------------|
| On form submission  | Form Trigger                        | Starts workflow on niche channel URLs input    | -                                    | 3 Channels                        | # Phase 1) Niche Outliers                         |
| 3 Channels          | Set                                 | Aggregates input channels into array            | On form submission                   | Split Out                        | # Phase 1) Niche Outliers                         |
| Split Out           | SplitOut                           | Splits channels array into individual items     | 3 Channels                          | Loop Over Items                  | # Phase 1) Niche Outliers                         |
| Loop Over Items     | SplitInBatches                     | Iterates over channels for scraping             | Split Out                          | Channel Outliers                | # Phase 1) Niche Outliers                         |
| Channel Outliers    | HTTP Request                      | Scrapes popular videos per channel via Apify    | Loop Over Items                    | Sort1                          | # Phase 1) Niche Outliers                         |
| Sort1               | Sort                               | Sorts videos by descending views                 | Channel Outliers                   | Filter                         | # Phase 1) Niche Outliers                         |
| Filter              | Filter                             | Filters videos newer than 6 months               | Sort1                             | Limit                          | # Phase 1) Niche Outliers                         |
| Limit               | Limit                              | Limits to 10 videos per channel                   | Filter                           | Set Fields                     | # Phase 1) Niche Outliers                         |
| Set Fields          | Set                                | Extracts relevant video fields                    | Limit                            | Title Analyzer                 | # Phase 1) Niche Outliers                         |
| Title Analyzer      | Langchain Agent                   | Extracts power words from titles                  | Set Fields                      | Merge                         | # Phase 1) Niche Outliers                         |
| GPT 4.1-mini        | LM Chat OpenRouter/OpenAI         | Language model used by Title Analyzer            | Title Analyzer                  | Title Analyzer                 | # Phase 1) Niche Outliers                         |
| Analyze Thumbnails  | Langchain OpenAI (image analysis) | Analyzes thumbnail visuals                         | Set Fields                      | Merge                         | # Phase 1) Niche Outliers                         |
| Merge               | Merge                              | Combines video data streams                        | Title Analyzer, Analyze Thumbnails, Set Fields | Niche Outliers Data           | # Phase 1) Niche Outliers                         |
| Niche Outliers Data | Google Sheets                     | Appends analyzed video data to Google Sheets     | Merge                           | Loop Over Items                | # Phase 1) Niche Outliers                         |
| Sticky Note         | Sticky Note                       | Visual label for Phase 1                           | -                              | -                             | # Phase 1) Niche Outliers                         |
| Sundays             | Schedule Trigger                  | Weekly Sunday trigger                              | -                              | Broad Niche                   | # Phase 2) Broad Niche Insights (Weekly)         |
| Broad Niche         | Set                                | Sets broad niche keyword                           | Sundays                         | Scrape YT                    | # Phase 2) Broad Niche Insights (Weekly)         |
| Scrape YT           | HTTP Request                      | Scrapes trending videos for broad niche           | Broad Niche                     | Title Analyzer1              | # Phase 2) Broad Niche Insights (Weekly)         |
| Title Analyzer1     | Langchain Agent                   | Extracts power words from titles                   | Scrape YT                      | Analyze Thumbnails1          | # Phase 2) Broad Niche Insights (Weekly)         |
| GPT 4.1-mini1       | LM Chat OpenRouter/OpenAI         | Language model for Title Analyzer1                 | Title Analyzer1                | Title Analyzer1              | # Phase 2) Broad Niche Insights (Weekly)         |
| Analyze Thumbnails1 | Langchain OpenAI (image analysis) | Analyzes thumbnails for broad niche videos         | Scrape YT                      | Broad Niche Weekly           | # Phase 2) Broad Niche Insights (Weekly)         |
| Broad Niche Weekly  | Google Sheets                     | Stores broad niche weekly data                      | Analyze Thumbnails1            | -                           | # Phase 2) Broad Niche Insights (Weekly)         |
| Sticky Note1        | Sticky Note                       | Visual label for Phase 2                            | -                              | -                           | # Phase 2) Broad Niche Insights (Weekly)         |
| 6 am                | Schedule Trigger                  | Daily 6 AM trigger                                 | -                              | Niche                       | # Phase 3) Niche Insights (Daily)                 |
| Niche               | Set                                | Sets specific daily niche keyword                   | 6 am                           | Scrape YT1                  | # Phase 3) Niche Insights (Daily)                 |
| Scrape YT1          | HTTP Request                      | Scrapes recent popular videos for niche daily       | Niche                         | Title Analyzer2             | # Phase 3) Niche Insights (Daily)                 |
| Title Analyzer2     | Langchain Agent                   | Extracts power words from daily video titles         | Scrape YT1                    | Analyze Thumbnails2         | # Phase 3) Niche Insights (Daily)                 |
| GPT 4.1-mini2       | LM Chat OpenRouter/OpenAI         | Language model for Title Analyzer2                   | Title Analyzer2               | Title Analyzer2             | # Phase 3) Niche Insights (Daily)                 |
| Analyze Thumbnails2 | Langchain OpenAI (image analysis) | Analyzes thumbnails for daily videos                   | Scrape YT1                    | Niche Daily                | # Phase 3) Niche Insights (Daily)                 |
| Niche Daily         | Google Sheets                     | Stores daily niche insights                           | Analyze Thumbnails2            | -                           | # Phase 3) Niche Insights (Daily)                 |
| Sticky Note2        | Sticky Note                       | Visual label for Phase 3                            | -                              | -                           | # Phase 3) Niche Insights (Daily)                 |
| Channel URL         | Set                                | Sets YouTube channel URL for comment analysis         | Niche Daily                   | Scrape Channel             | # Phase 4) Comment Analysis                        |
| Scrape Channel      | HTTP Request                      | Scrapes newest videos from channel                    | Channel URL                   | Get Comments               | # Phase 4) Comment Analysis                        |
| Get Comments        | HTTP Request                      | Scrapes comments for channel videos                    | Scrape Channel                | Aggregate1                 | # Phase 4) Comment Analysis                        |
| Aggregate1          | Aggregate                         | Aggregates all comments into a list                    | Get Comments                  | Comment Analyzer           | # Phase 4) Comment Analysis                        |
| Comment Analyzer    | Langchain Agent                   | Analyzes comments for viewer sentiment and requests    | Aggregate1                    | Insights                   | # Phase 4) Comment Analysis                        |
| GPT 4.1-mini3       | LM Chat OpenRouter/OpenAI         | Language model for Comment Analyzer                     | Comment Analyzer              | Comment Analyzer           | # Phase 4) Comment Analysis                        |
| Insights            | Output Parser Structured          | Parses comment analysis output into structured JSON     | Comment Analyzer              | Comment Analysis           | # Phase 4) Comment Analysis                        |
| Comment Analysis    | Google Sheets                     | Stores comment insights                                | Insights                     | Get High Performers        | # Phase 4) Comment Analysis                        |
| Aggregate           | Aggregate                         | Aggregates video data for ideation                      | Get High Performers           | Channel Description        | # Phase 4) Comment Analysis                        |
| Channel Description | Set                                | Sets detailed channel description for ideation          | Aggregate                    | Creative Agent             | # Phase 4) Comment Analysis                        |
| Sticky Note4        | Sticky Note                       | Visual label for Phase 4                              | -                            | -                         | # Phase 4) Comment Analysis                        |
| Creative Agent      | Langchain Agent                   | Generates 3 video title and thumbnail ideas              | Channel Description           | Append Ideas               | # Phase 5) Ideation                               |
| GPT 4.1-mini4       | LM Chat OpenRouter/OpenAI         | Language model for Creative Agent                          | Creative Agent               | Creative Agent             | # Phase 5) Ideation                               |
| Titles & Thumbs     | Output Parser Structured          | Parses AI ideation output into structured JSON             | Creative Agent               | Creative Agent             | # Phase 5) Ideation                               |
| Append Ideas        | Google Sheets                     | Stores generated ideas                                   | Creative Agent               | Notification               | # Phase 5) Ideation                               |
| Notification        | Slack                            | Sends Slack notification about completed ideation          | Append Ideas                 | -                         | # Phase 5) Ideation                               |
| Sticky Note5        | Sticky Note                       | Visual label for Phase 5                              | -                            | -                         | # Phase 5) Ideation                               |
| Sticky Note3        | Sticky Note                       | Setup guide with API keys and instructions              | -                            | -                         | Setup Guide (covers all phases)                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger Node**:  
   - Name: "On form submission"  
   - Configure a form titled "Niche Outliers" with three required fields: Channel 1, Channel 2, Channel 3 (placeholders: example channel URLs).  
   - This node starts the workflow on user input.  

2. **Create a Set Node**:  
   - Name: "3 Channels"  
   - Combine the three channel URLs from the form into an array variable called `channels` using expressions (e.g., `=["{{$json['Channel 1']}}","{{$json['Channel 2']}}","{{$json['Channel 3']}}"]`).  
   - Connect output from Form Trigger here.  

3. **Add a SplitOut Node**:  
   - Name: "Split Out"  
   - Configure to split the `channels` array into individual items for processing.  
   - Connect from "3 Channels".  

4. **Add a SplitInBatches Node**:  
   - Name: "Loop Over Items"  
   - Use default batch settings to process each channel one at a time.  
   - Connect from "Split Out".  

5. **Add HTTP Request Node for Channel Scraping**:  
   - Name: "Channel Outliers"  
   - Method: POST  
   - URL: `https://api.apify.com/v2/acts/streamers~youtube-scraper/run-sync-get-dataset-items`  
   - Body (JSON): Include parameters to scrape popular videos from the channel URL (use `{{$json.channels}}` or current item channel URL).  
   - Add query parameter `token` for your Apify API key.  
   - Connect from Batch Output of "Loop Over Items".  

6. **Add Sort Node**:  
   - Name: "Sort1"  
   - Configure to sort videos by `viewCount` descending.  
   - Connect from "Channel Outliers".  

7. **Add Filter Node**:  
   - Name: "Filter"  
   - Filter videos with `date` after current date minus 6 months (use expression for dynamic date handling).  
   - Connect from "Sort1".  

8. **Add Limit Node**:  
   - Name: "Limit"  
   - Limit maximum items to 10 videos per channel.  
   - Connect from "Filter".  

9. **Add Set Node**:  
   - Name: "Set Fields"  
   - Extract and set these fields: `channel`, `title`, `url`, `thumbnail`, `views`, `likes`, from the scraped video JSON.  
   - Connect from "Limit".  

10. **Add Langchain Agent Node for Title Analysis**:  
    - Name: "Title Analyzer"  
    - Use AI to extract 1-3 power words from video titles, prompt defines the rules for power words.  
    - Connect from "Set Fields".  

11. **Add Langchain LM Chat Node**:  
    - Name: "GPT 4.1-mini"  
    - Credential: Connect to your OpenRouter or OpenAI API credentials.  
    - Connect as language model to "Title Analyzer".  

12. **Add Langchain OpenAI Node for Thumbnail Analysis**:  
    - Name: "Analyze Thumbnails"  
    - Use ChatGPT-4o model, input thumbnail URLs, output short analysis of why thumbnail is attention-grabbing.  
    - Connect from "Set Fields".  

13. **Add Merge Node**:  
    - Name: "Merge"  
    - Mode: Combine by position, input 3 streams (Set Fields, Title Analyzer, Analyze Thumbnails).  
    - Connect outputs of the three nodes accordingly.  

14. **Add Google Sheets Node**:  
    - Name: "Niche Outliers Data"  
    - Operation: Append  
    - Document & Sheet: Connect to your Google Sheet, tab “Niche Outliers”  
    - Map fields accordingly: URL, Likes, Title, Views, Channel, Thumbnail, Power Words, Thumbnail Analysis.  
    - Connect from "Merge".  

15. **Add Sticky Note Node**:  
    - Content: "# Phase 1) Niche Outliers"  
    - Place visually near this block for clarity.

16. **Repeat similar steps to build Phase 2 (Broad Niche Weekly):**  
    - Schedule Trigger "Sundays" running weekly.  
    - Set broad niche keyword (e.g., "artificial intelligence") in "Broad Niche" set node.  
    - HTTP Request to Apify for trending videos of that niche.  
    - Title Analyzer1, GPT 4.1-mini1, Analyze Thumbnails1 nodes configured similarly.  
    - Append data to Google Sheets tab "Broad Niche Weekly".  

17. **Build Phase 3 (Niche Daily):**  
    - Schedule Trigger "6 am" daily.  
    - Set niche keyword (e.g., "n8n") in "Niche" node.  
    - HTTP Request Scrape YT1, Title Analyzer2, GPT 4.1-mini2, Analyze Thumbnails2 nodes.  
    - Append results to "Niche Daily" tab in Google Sheets.  

18. **Build Phase 4 (Comment Analysis):**  
    - Set channel URL in "Channel URL" node.  
    - HTTP Request to scrape newest videos "Scrape Channel".  
    - Get Comments HTTP Request.  
    - Aggregate comments, analyze with Langchain Agent "Comment Analyzer".  
    - Use GPT 4.1-mini3 as language model.  
    - Parse structured output with "Insights".  
    - Append to Google Sheets tab "Comment Analysis".  
    - Aggregate video data and set channel description for ideation context.  

19. **Build Phase 5 (Ideation):**  
    - Langchain Agent "Creative Agent" takes aggregated data and channel description to generate 3 title/thumbnail ideas.  
    - Use GPT 4.1-mini4 as language model.  
    - Parse output with "Titles & Thumbs".  
    - Append ideas to Google Sheets tab "Ideation".  
    - Add Slack "Notification" node to alert team with Google Sheet link.  

20. **Add Sticky Notes for each phase and add a Setup Guide sticky note:**  
    - Include instructions for API key insertion (Apify, OpenRouter/OpenAI), Google Sheets setup, and schedule configuration.

21. **Configure all credentials:**  
    - Apify API key in all HTTP Request nodes.  
    - OpenRouter/OpenAI API credentials for Langchain nodes.  
    - Google Sheets OAuth2 credentials.  
    - Slack webhook credential for notifications.  

22. **Test each phase independently:**  
    - Trigger form submission and scheduled triggers manually to verify data flows and AI responses.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                            | Context or Link                                                                                                                                                                           |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Setup Guide: Add your Apify API key to all HTTP Request nodes calling Apify services. Connect OpenRouter and OpenAI API keys for language models. Copy the Google Sheets template and link it in all Google Sheets nodes. Customize schedule triggers and test each phase to ensure data flows correctly. | Setup Guide sticky note in workflow; includes stepwise instructions and links to OpenRouter https://openrouter.ai/, OpenAI https://platform.openai.com/settings/organization/api-keys, and Google Sheets template https://docs.google.com/spreadsheets/d/197vv7pZWXOiMufm1BFuV07obNafBr3PgOsbR5a4JAAI/edit?usp=sharing |
| Workflow leverages Apify YouTube Scraper APIs for video and comments data, OpenAI GPT-4o models for natural language and image analysis, and Google Sheets for data persistence and collaboration.                                                                                                  | Apify https://apify.com/acts/streamers~youtube-scraper, YouTube Comments https://apify.com/acts/streamers~youtube-comments-scraper                                                                |
| Slack notification node alerts team/channel when ideation is complete, providing a link to Google Sheets results.                                                                                                                                                                                    | Slack API integration; ensure channel and webhook are configured.                                                                                                                          |

---

**Disclaimer:** The text provided is exclusively derived from an n8n automated workflow and complies with all content policies. It contains no illegal, offensive, or protected materials. All data handled is legal and publicly accessible.