Analyze Trending YouTube Videos with Apify, OpenAI, and Google Sheets

https://n8nworkflows.xyz/workflows/analyze-trending-youtube-videos-with-apify--openai--and-google-sheets-8023


# Analyze Trending YouTube Videos with Apify, OpenAI, and Google Sheets

### 1. Workflow Overview

This workflow automates the process of researching trending YouTube videos based on a user-provided keyword or topic. It scrapes recent videos related to the keyword, filters those with promising engagement metrics, analyzes thumbnails and video transcripts using AI, generates optimized video titles and outlines, and stores all relevant data in a Google Sheet for content ideation and planning.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receives user input (keyword/topic) via a form trigger to start the search.
- **1.2 Video Data Scraping and Filtering:** Uses Apify API to scrape trending YouTube videos and filters them by view count and subscriber count.
- **1.3 Duplicate Check and Data Consolidation:** Checks for duplicates in the Google Sheet and merges new unique entries.
- **1.4 Thumbnail Analysis:** Uses OpenAI to analyze the video thumbnail image and generate a descriptive summary.
- **1.5 Transcript Retrieval:** Retrieves the video transcript/captions via Apify API for further content analysis.
- **1.6 AI Title and Outline Generation:** Generates a new SEO-optimized video title and thumbnail text based on the original title, thumbnail description, and transcript; then creates a fresh video outline.
- **1.7 Google Sheets Update:** Updates the Google Sheet with enriched data including new titles, outlines, transcript, and thumbnail descriptions.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block captures the keyword or topic from the user via a web form to initiate the search process.
- **Nodes Involved:**  
  - On form submission

- **Node Details:**
  - **On form submission**
    - Type: Form Trigger  
    - Role: Entry point capturing user input for "Keyword or Topic"  
    - Configuration:  
      - Single required field labeled "Keyword or Topic"  
      - Webhook ID assigned for receiving submissions  
    - Inputs: None (trigger node)  
    - Outputs: Flow trigger with form data  
    - Edge Cases: Missing or empty input will halt the workflow since the field is required  
    - Version: 2.2  

---

#### 2.2 Video Data Scraping and Filtering

- **Overview:** Uses Apify API to scrape trending YouTube videos filtered by the input keyword/topic and applies a filter to keep only videos with view count > 1000 and view count exceeding subscriber count.
- **Nodes Involved:**  
  - YouTube Video Scrape  
  - If

- **Node Details:**
  - **YouTube Video Scrape**  
    - Type: HTTP Request  
    - Role: Calls Apify API to retrieve trending YouTube videos filtered by the keyword/topic from the form trigger  
    - Configuration:  
      - POST request to Apify endpoint with JSON body filtering videos in the past month, length between 7-14 minutes, max 100 results, sorted by newest  
      - Authorization header with Apify API token (must be replaced by user)  
      - Dynamic search query injected from form input  
    - Inputs: Trigger from form submission  
    - Outputs: JSON array of video metadata (title, URL, thumbnail, views, subscribers, etc.)  
    - Edge Cases: API token missing/expired, network errors, empty or malformed response  
    - Version: 4.2

  - **If**  
    - Type: Conditional (If)  
    - Role: Filters videos where viewCount > 1000 AND viewCount > numberOfSubscribers  
    - Configuration: Two numeric conditions combined with AND:  
      - `$json.viewCount > 1000`  
      - `$json.viewCount > $json.numberOfSubscribers`  
    - Inputs: Video items from YouTube Video Scrape  
    - Outputs: True path for videos passing the filter, false path discarded  
    - Edge Cases: Missing or non-numeric fields causing evaluation errors  

---

#### 2.3 Duplicate Check and Data Consolidation

- **Overview:** Checks if videos are already present in the Google Sheet to avoid duplicates, then merges new unique videos with existing data.
- **Nodes Involved:**  
  - Find Duplicate Entries  
  - Merge  
  - Step 1 Results

- **Node Details:**
  - **Find Duplicate Entries**  
    - Type: Google Sheets  
    - Role: Searches the Google Sheet for existing entries matching video IDs to detect duplicates  
    - Configuration:  
      - Uses "id" column to lookup current video id  
      - Document and sheet IDs set to user’s Google Sheet (must be configured)  
    - Inputs: Filtered videos from If node  
    - Outputs: Returns matching rows if duplicates found  
    - Edge Cases: API auth errors, sheet not accessible, no matches found returns null or empty  

  - **Merge**  
    - Type: Merge  
    - Role: Combines new video data with duplicates check results, keeping non-matching (new) items from the If node input  
    - Configuration:  
      - Mode: Combine  
      - Join Mode: Keep Non Matches  
      - Fields to match: "id"  
      - Output data from input2 (duplicates)  
    - Inputs:  
      - Input1: From If (filtered videos)  
      - Input2: From Find Duplicate Entries  
    - Outputs: Unique videos excluding duplicates  
    - Edge Cases: No duplicates found means all videos pass through  

  - **Step 1 Results**  
    - Type: Google Sheets  
    - Role: Appends new unique video data to the Google Sheet  
    - Configuration:  
      - Maps multiple video fields (id, url, input keyword, likes, title, duration, channel info, thumbnail URL, view count, subscribers)  
      - Uses “append” operation to add rows  
      - Points to the same Google Sheet and sheet tab as Find Duplicate Entries  
    - Inputs: Unique videos from Merge  
    - Outputs: Confirmed appended data  
    - Edge Cases: Sheet permission errors, rate limits, malformed data causing append failure  

---

#### 2.4 Thumbnail Analysis

- **Overview:** Uses OpenAI image understanding capabilities to analyze the video thumbnail URL and produce a natural language description capturing visual style and tone.
- **Nodes Involved:**  
  - Analyze Thumbnail

- **Node Details:**
  - **Analyze Thumbnail**  
    - Type: OpenAI (Langchain/OpenAI)  
    - Role: Analyzes thumbnail image URL and returns a descriptive text summary  
    - Configuration:  
      - Model: gpt-4o-mini (optimized for image understanding)  
      - Operation: Analyze image from URL provided by Step 1 Results (thumbnailUrl field)  
      - High detail level requested  
      - Prompt instructs to describe layout, colors, mood, font style, composition without brand names  
    - Inputs: From Step 1 Results (appended video data)  
    - Outputs: Natural language description of thumbnail in plain text  
    - Edge Cases: Invalid or inaccessible thumbnail URL, OpenAI quota or auth errors, slow response times  
    - Version: 1.8  

---

#### 2.5 Transcript Retrieval

- **Overview:** Retrieves the transcript (captions) of the video using Apify API to enable further AI processing.
- **Nodes Involved:**  
  - HTTP Request (second instance)

- **Node Details:**
  - **HTTP Request**  
    - Type: HTTP Request  
    - Role: Calls Apify API to get video transcript data for the video URL from Step 1 Results  
    - Configuration:  
      - POST request with JSON body specifying to return single string text of captions, requesting keywords and other metadata without likes or comments  
      - Uses Apify API token in Authorization header (same token as YouTube Video Scrape)  
      - URL parameter dynamically set from Step 1 Results video URL  
    - Inputs: From Analyze Thumbnail (to ensure thumbnail analysis before transcript retrieval)  
    - Outputs: JSON object including “captions” (video transcript string)  
    - Edge Cases: Transcript unavailable, API errors, rate limits, malformed requests  
    - Version: 4.2  

---

#### 2.6 AI Title and Outline Generation

- **Overview:** Generates an optimized YouTube video title and thumbnail text using OpenAI based on the original title, thumbnail description, and video transcript; then generates a fresh video outline from the transcript.
- **Nodes Involved:**  
  - YouTube Title Generator  
  - Outline Generator

- **Node Details:**
  - **YouTube Title Generator**  
    - Type: OpenAI (Langchain/OpenAI)  
    - Role: Generates improved, SEO-optimized video titles and concise thumbnail text (3-5 words)  
    - Configuration:  
      - Model: gpt-4.1-mini  
      - Input messages include original title (from Step 1 Results), thumbnail description (from Analyze Thumbnail), and transcript (from HTTP Request)  
      - System prompt details instructions for preserving original message while improving clarity and engagement, outputting a JSON object with newTitle and thumbnailText  
      - Output as JSON for downstream use  
    - Inputs: From HTTP Request (transcript retrieval)  
    - Outputs: JSON with newTitle and thumbnailText  
    - Edge Cases: Model rate limits, malformed input, incomplete transcript, text generation errors  
    - Version: 1.8  

  - **Outline Generator**  
    - Type: OpenAI (Langchain/OpenAI)  
    - Role: Creates an original video outline inspired by the transcript, providing a fresh perspective and structured sections (hook, intro, main points, CTA)  
    - Configuration:  
      - Model: gpt-4.1  
      - Input message contains the video transcript  
      - System prompt instructs generating an original, engaging outline that does not copy but reinterprets the content  
      - Output is a structured bullet-point outline  
    - Inputs: From YouTube Title Generator (passing transcript forward)  
    - Outputs: Video outline text  
    - Edge Cases: Transcript quality affecting outline relevance, OpenAI API errors  
    - Version: 1.8  

---

#### 2.7 Google Sheets Update

- **Overview:** Updates the existing Google Sheet rows with the AI-generated new titles, outlines, thumbnail text, transcript, and thumbnail descriptions to enrich the video research data.
- **Nodes Involved:**  
  - Update Rows

- **Node Details:**
  - **Update Rows**  
    - Type: Google Sheets  
    - Role: Updates existing rows matching video IDs with new AI-generated fields and additional metadata  
    - Configuration:  
      - Matching on “id” column  
      - Updates columns: newTitle, newOutline, thumbnailText, videoTranscript, thumbnailDescription  
      - Uses Google Sheets OAuth2 credentials with write access  
      - Operates on the same document and sheet tab as previous Google Sheets nodes  
    - Inputs: From Outline Generator (AI-generated outline and data)  
    - Outputs: Confirmation of row updates  
    - Edge Cases: Permission errors, concurrency conflicts, invalid data causing update failures  

---

### 3. Summary Table

| Node Name             | Node Type                 | Functional Role                                 | Input Node(s)            | Output Node(s)          | Sticky Note                                                                                                  |
|-----------------------|---------------------------|------------------------------------------------|--------------------------|-------------------------|--------------------------------------------------------------------------------------------------------------|
| On form submission     | Form Trigger              | Captures user keyword/topic input               | None                     | YouTube Video Scrape    | See sticky note content for setup instructions and credentials                                              |
| YouTube Video Scrape   | HTTP Request              | Scrapes trending YouTube videos from Apify      | On form submission       | If                      | Requires Apify API token in Authorization header                                                             |
| If                    | Conditional (If)          | Filters videos with viewCount > 1000 and viewCount > subscribers | YouTube Video Scrape     | Find Duplicate Entries   |                                                                                                              |
| Find Duplicate Entries | Google Sheets             | Checks for existing videos in Google Sheet      | If                       | Merge                   | Requires Google Sheets OAuth2 credentials and correct documentId                                            |
| Merge                 | Merge                     | Merges unique new videos excluding duplicates   | If, Find Duplicate Entries | Step 1 Results          |                                                                                                              |
| Step 1 Results        | Google Sheets             | Appends new unique videos to Google Sheet       | Merge                    | Analyze Thumbnail       | See sticky note for Google Sheets documentId setup                                                           |
| Analyze Thumbnail     | OpenAI (Langchain/OpenAI) | Analyzes thumbnail image and generates description | Step 1 Results           | HTTP Request (Transcript) | Requires OpenAI API key and GPT-4o-mini model                                                                |
| HTTP Request (Transcript) | HTTP Request            | Retrieves video transcript from Apify           | Analyze Thumbnail        | YouTube Title Generator  | Requires Apify API token; extracts captions for AI processing                                               |
| YouTube Title Generator | OpenAI (Langchain/OpenAI) | Generates optimized video title and thumbnail text | HTTP Request             | Outline Generator        | Requires OpenAI API key; outputs JSON with newTitle and thumbnailText                                         |
| Outline Generator      | OpenAI (Langchain/OpenAI) | Creates original video outline based on transcript | YouTube Title Generator  | Update Rows              | Requires OpenAI API key                                                                                        |
| Update Rows            | Google Sheets             | Updates Google Sheet rows with AI-generated data | Outline Generator        | None                    | Requires Google Sheets OAuth2 credentials and correct documentId                                            |
| Sticky Note            | Sticky Note               | Contains author info, setup steps, and usage notes | None                     | None                    | Provides detailed instructions on API tokens, credentials, and setup                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node**  
   - Type: Form Trigger  
   - Configure a form titled "YouTube Topic Research"  
   - Add a required text field "Keyword or Topic"  
   - Save to generate webhook ID

2. **Create an HTTP Request node named "YouTube Video Scrape"**  
   - Method: POST  
   - URL: `https://api.apify.com/v2/acts/h7sDV53CddomktSi5/run-sync-get-dataset-items`  
   - Headers:  
     - Accept: application/json  
     - Authorization: Bearer `<Your Apify API Token>`  
   - Body Type: JSON  
   - Body JSON (example):  
     ```json
     {
       "dateFilter": "month",
       "lengthFilter": "between420",
       "maxResults": 100,
       "sortVideosBy": "NEWEST",
       "searchQueries": ["={{ $json['Keyword or Topic'] }}"]
     }
     ```
   - Connect output from Form Trigger to this node.

3. **Add an If node**  
   - Conditions (AND):  
     - `$json.viewCount > 1000` (Number)  
     - `$json.viewCount > $json.numberOfSubscribers` (Number)  
   - Connect output from YouTube Video Scrape to this node.

4. **Add Google Sheets node "Find Duplicate Entries"**  
   - Operation: Lookup rows by filter  
   - Filter: Lookup column "id" equals `{{$json.id}}`  
   - Document ID and Sheet Name: Set to your Google Sheet with video data  
   - Connect "true" output from If node to this node.

5. **Add Merge node**  
   - Mode: Combine  
   - Join Mode: Keep Non Matches  
   - Match by field: "id"  
   - Output data from: input2 (duplicates)  
   - Connect input1 from If node (true output), input2 from Find Duplicate Entries node.

6. **Add Google Sheets node "Step 1 Results"**  
   - Operation: Append rows  
   - Map columns: id, url, input (keyword), likes, title, duration, fromYTUrl, viewCount, channelUrl, channelName, thumbnailUrl, numberOfSubscribers  
   - Document ID and Sheet Name: Same as Find Duplicate Entries  
   - Connect output from Merge node.

7. **Add OpenAI node "Analyze Thumbnail"**  
   - Model: GPT-4o-mini  
   - Operation: Analyze image  
   - Input image URL: `{{$json.thumbnailUrl}}` from Step 1 Results  
   - Prompt: Describe visual style, layout, color, font, mood in natural language  
   - Connect output from Step 1 Results node.

8. **Add HTTP Request node for transcript retrieval**  
   - Method: POST  
   - URL: `https://api.apify.com/v2/acts/1s7eXiaukVuOr4Ueg/run-sync-get-dataset-items`  
   - Headers:  
     - Accept: application/json  
     - Authorization: Bearer `<Your Apify API Token>`  
   - Body JSON: include video URL from Step 1 Results, request captions as single string  
   - Connect output from Analyze Thumbnail to this node.

9. **Add OpenAI node "YouTube Title Generator"**  
   - Model: GPT-4.1-mini  
   - Input messages: system prompt describing task and user messages including original title (Step 1 Results), thumbnail description (Analyze Thumbnail), and transcript (HTTP Request)  
   - Output format: JSON with fields newTitle and thumbnailText  
   - Connect output from HTTP Request (transcript) node.

10. **Add OpenAI node "Outline Generator"**  
    - Model: GPT-4.1  
    - Input message: video transcript (from HTTP Request)  
    - System prompt instructs generating a unique, engaging video outline  
    - Connect output from YouTube Title Generator node.

11. **Add Google Sheets node "Update Rows"**  
    - Operation: Update rows by matching "id"  
    - Update columns: newTitle, newOutline, thumbnailText, videoTranscript, thumbnailDescription  
    - Document ID and Sheet Name: Same as before  
    - Connect output from Outline Generator node.

12. **Connect nodes in sequence:**  
    - Form Trigger → YouTube Video Scrape → If → Find Duplicate Entries → Merge → Step 1 Results → Analyze Thumbnail → HTTP Request (transcript) → YouTube Title Generator → Outline Generator → Update Rows

13. **Credential Setup:**  
    - Apify API Token: Insert into both HTTP Request nodes with Authorization header  
    - OpenAI API Key: Configure credentials and assign to all OpenAI nodes  
    - Google Sheets OAuth2: Configure with edit access, assign to all Google Sheets nodes  
    - Spreadsheet: Use your own Google Sheets document; set document ID and sheet names accordingly  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                             | Context or Link                                                                                           |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| ⚙️ Trending YouTube Videos Research Workflow by LeeWei automates scraping, filtering, AI analysis, and Google Sheets update for video content ideation.                                                                                                                                                                                                                                  | Author credit and workflow purpose                                                                        |
| Apify API Token is required for YouTube data and transcript scraping; sign up at [Apify](https://apify.com/) and generate your token. Replace `<token>` in HTTP Request nodes.                                                                                                                                                                                                          | https://apify.com/                                                                                        |
| OpenAI API key required for thumbnail analysis, title and outline generation; generate at [OpenAI](https://platform.openai.com/). Use GPT-4o-mini and GPT-4.1 models for best results.                                                                                                                                                                                                  | https://platform.openai.com/                                                                              |
| Google Sheets OAuth2 credentials must be set up with Drive access; update `documentId` and sheet tabs in all Google Sheets nodes to your own spreadsheet. Clone provided sheet if needed.                                                                                                                                                                                              | Google Sheets documentation                                                                               |
| Form Trigger expects a keyword/topic and starts the workflow; test inputs such as “AI automation” to verify full workflow.                                                                                                                                                                                                                                                                |                                                                                                          |
| The workflow filters out videos with low views or where views do not exceed subscriber count to focus on high-potential content.                                                                                                                                                                                                                                                        | Filtering criteria                                                                                         |
| Thumbnail descriptions generated by OpenAI are natural language summaries of visual style, supporting thumbnail re-creation or better contextual understanding.                                                                                                                                                                                                                          | AI image analysis use case                                                                                 |
| Video transcripts retrieved via Apify enable AI generation of optimized titles and outlines that are original and SEO-friendly.                                                                                                                                                                                                                                                         | Transcript data for AI processing                                                                          |
| The workflow updates Google Sheets with enriched data to serve as a centralized content ideation repository.                                                                                                                                                                                                                                                                              | Data storage and management                                                                                |

---

**Disclaimer:** This document describes a workflow created exclusively with n8n automation software. It adheres strictly to applicable content policies and contains no illegal, offensive, or protected elements. All data processed is legal and publicly available.