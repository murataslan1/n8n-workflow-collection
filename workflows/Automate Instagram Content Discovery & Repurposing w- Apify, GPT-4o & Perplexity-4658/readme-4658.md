Automate Instagram Content Discovery & Repurposing w/ Apify, GPT-4o & Perplexity

https://n8nworkflows.xyz/workflows/automate-instagram-content-discovery---repurposing-w--apify--gpt-4o---perplexity-4658


# Automate Instagram Content Discovery & Repurposing w/ Apify, GPT-4o & Perplexity

### 1. Workflow Overview

This workflow automates the discovery, analysis, and repurposing of Instagram Reels content from competitor accounts using Apify scraping, OpenAI GPT-4o, Whisper transcription, and Perplexity AI. Its primary use case is for content creators and marketers running AI & automation Instagram channels who want to efficiently monitor trends, extract insights, and generate unique content scripts based on competitor videos.

The workflow is logically divided into four main functional blocks:

- **1.1 Instagram Content Discovery:** Scrapes new Reels from a curated list of Instagram usernames using Apify. This block fetches the latest videos for processing.

- **1.2 Smart Duplicate Prevention:** Uses Google Sheets as a content database to check if a Reel has already been processed, filtering out duplicates to avoid redundant work.

- **1.3 AI-Powered Content Analysis:** Downloads videos, transcribes audio via OpenAI Whisper, analyzes the transcript with GPT-4o to identify tools/technologies, enriches insights with Perplexity AI search, and then generates a fresh, audience-tailored script for the content.

- **1.4 Database Updates:** Saves the original transcript and newly generated script back into the Google Sheets database, maintaining an evolving content intelligence repository.

---

### 2. Block-by-Block Analysis

#### 2.1 Instagram Content Discovery

**Overview:**  
This block triggers periodically and scrapes the latest 5 Instagram Reels from a list of competitor usernames via Apify's Instagram scraping API.

**Nodes Involved:**  
- Schedule Trigger  
- Run Actor Synchronously

**Node Details:**  

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow daily at 6 AM.  
  - Configuration: Runs once daily at hour 6 (6 AM).  
  - Inputs: None (start node)  
  - Outputs: To "Run Actor Synchronously" node  
  - Edge Cases: Schedule misconfiguration may cause missed runs.

- **Run Actor Synchronously**  
  - Type: HTTP Request  
  - Role: Calls Apify API to scrape Instagram reels synchronously.  
  - Configuration:  
    - Method: POST  
    - URL: Apify actor endpoint for scraping Reels dataset  
    - Body: JSON with `resultsLimit: 5` and a list of target usernames  
    - Headers: Accept JSON, Authorization Bearer token (replace with actual API key)  
  - Inputs: Trigger from Schedule Trigger  
  - Outputs: JSON array of scraped Reels data to "Limit" node  
  - Version: 4.2  
  - Edge Cases:  
    - Invalid API key or rate limiting causing failure  
    - Network timeouts  
    - Empty or malformed responses  
    - Username changes or private accounts blocking scraping

---

#### 2.2 Smart Duplicate Prevention

**Overview:**  
Prevents processing duplicate Reels by checking IDs against the existing Google Sheets database and only passing through new, unseen content.

**Nodes Involved:**  
- Limit  
- Search for Entries  
- Drop Duplicates  
- Add Entries

**Node Details:**  

- **Limit**  
  - Type: Limit  
  - Role: Restricts processing to the last 2 items (likely for testing or control)  
  - Configuration: Keeps last 2 items from input  
  - Inputs: From "Run Actor Synchronously"  
  - Outputs: To "Search for Entries"  
  - Edge Cases: Limits throughput artificially; adjust as needed.

- **Search for Entries**  
  - Type: Google Sheets (Lookup)  
  - Role: Searches the Google Sheet for each Reel's `id` to detect duplicates  
  - Configuration:  
    - Document: Instagram Reel Database spreadsheet  
    - Sheet: "Reels" (gid=0)  
    - Filter: Lookup `id` column equals current Reel `id`  
  - Inputs: From "Limit"  
  - Outputs: To "Drop Duplicates"  
  - Credentials: Google Sheets OAuth2  
  - Edge Cases:  
    - Google API quota limits or auth errors  
    - Sheet access issues  
    - False negatives if IDs mismatch format

- **Drop Duplicates**  
  - Type: Merge  
  - Role: Keeps only new Reels whose IDs do not match existing entries  
  - Configuration:  
    - Mode: Combine  
    - Join mode: Keep non-matches  
    - Fields to match: `id`  
  - Inputs: Left from "Limit" (new data), Right from "Search for Entries" (existing data)  
  - Outputs: To "Add Entries"  
  - Edge Cases: Incorrect matching fields can cause false duplicates or misses.

- **Add Entries**  
  - Type: Google Sheets (Append)  
  - Role: Adds genuinely new Reel metadata to the "Reels" sheet for tracking  
  - Configuration:  
    - Document & Sheet same as above  
    - Columns mapped explicitly for Reel metadata (e.g., id, url, caption, username, videoUrl, etc.)  
  - Inputs: From "Drop Duplicates"  
  - Outputs: To "Download Video"  
  - Credentials: Google Sheets OAuth2  
  - Edge Cases: Sheet write conflicts, quota limits.

---

#### 2.3 AI-Powered Content Analysis

**Overview:**  
Downloads the video, transcribes it, analyzes the transcript for tool mentions, enriches insights via Perplexity AI, and generates a new, optimized content script with GPT-4o.

**Nodes Involved:**  
- Download Video  
- Transcribe Video  
- Filter & Generate Suggestions  
- Search Perplexity  
- Write New Script

**Node Details:**  

- **Download Video**  
  - Type: HTTP Request  
  - Role: Downloads video file from the Reel's video URL  
  - Configuration: URL set dynamically from Reel's `videoUrl` field  
  - Inputs: From "Add Entries"  
  - Outputs: To "Transcribe Video"  
  - Edge Cases: Video URL invalid or expired, download failures, large file sizes.

- **Transcribe Video**  
  - Type: OpenAI Whisper (via Langchain node)  
  - Role: Extracts audio transcript from downloaded video  
  - Configuration: Resource set to "audio", operation "transcribe"  
  - Credentials: OpenAI API key (configured)  
  - Inputs: From "Download Video" (binary video data)  
  - Outputs: JSON transcript to "Filter & Generate Suggestions"  
  - Edge Cases: Audio quality issues affecting transcription, API limits.

- **Filter & Generate Suggestions**  
  - Type: OpenAI GPT-4o (Langchain node)  
  - Role: Analyzes transcript to detect if it discusses tools/technologies, generates step-by-step instructions and content improvement suggestions  
  - Configuration:  
    - Model: GPT-4o  
    - System prompt defines a task to classify content, identify tools, and produce structured JSON output  
    - Input: Transcript text extracted from previous node  
  - Credentials: OpenAI API  
  - Inputs: From "Transcribe Video"  
  - Outputs: To "Search Perplexity"  
  - Edge Cases: Model hallucination, incomplete or incorrect JSON output, API timeouts.

- **Search Perplexity**  
  - Type: HTTP Request  
  - Role: Queries Perplexity AI API for additional insights about identified tools  
  - Configuration:  
    - POST to Perplexity chat completions endpoint  
    - Body includes a prompt asking for three interesting facts about the tool identified in GPT node  
    - Authorization header requires valid Perplexity API key  
  - Inputs: From "Filter & Generate Suggestions" (uses searchPrompt field)  
  - Outputs: To "Write New Script"  
  - Edge Cases: API limits, invalid API key, response format errors.

- **Write New Script**  
  - Type: OpenAI GPT-4o (Langchain node)  
  - Role: Generates a polished, original script (~100 words) for the Instagram channel based on all inputs (tools, step guide, Perplexity insights, suggestions)  
  - Configuration:  
    - Model: GPT-4o with temperature 0.7 for a casual tone  
    - System prompt instructs creation of straightforward, call-to-action ending script in JSON format  
    - Inputs combined from previous nodes via expressions  
  - Credentials: OpenAI API  
  - Inputs: From "Search Perplexity"  
  - Outputs: To "Update Entries"  
  - Edge Cases: Incoherent output, API errors, token limits.

---

#### 2.4 Database Updates

**Overview:**  
Updates the Google Sheets database record for each Reel with the original transcript and the newly generated content script for future reference and analysis.

**Nodes Involved:**  
- Update Entries

**Node Details:**  

- **Update Entries**  
  - Type: Google Sheets (Update)  
  - Role: Updates existing Reel entry with `scrapedTranscript` (original transcription) and `newTranscript` (AI-generated script) fields  
  - Configuration:  
    - Document & Sheet same as earlier Google Sheets nodes  
    - Matching on `id` column to update correct row  
    - Maps new transcript and scraped transcript fields from node outputs  
  - Inputs: From "Write New Script"  
  - Outputs: None (end of workflow)  
  - Credentials: Google Sheets OAuth2  
  - Edge Cases: Update conflicts, data overwrite, quota limits.

---

### 3. Summary Table

| Node Name                   | Node Type                    | Functional Role                          | Input Node(s)                 | Output Node(s)                | Sticky Note                                                                                                                   |
|-----------------------------|------------------------------|----------------------------------------|------------------------------|------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger            | Schedule Trigger             | Starts workflow daily at 6 AM          | None                         | Run Actor Synchronously        | ## 🎯 STEP 1: Instagram Content Discovery ...                                                                                  |
| Run Actor Synchronously     | HTTP Request                | Calls Apify API to scrape Instagram    | Schedule Trigger             | Limit                         | ## 🎯 STEP 1: Instagram Content Discovery ...                                                                                  |
| Limit                      | Limit                       | Limits to last 2 reels for processing  | Run Actor Synchronously      | Search for Entries            | ## 🔍 STEP 2: Smart Duplicate Prevention ...                                                                                   |
| Search for Entries         | Google Sheets (Lookup)       | Checks if reel ID exists in database   | Limit                        | Drop Duplicates               | ## 🔍 STEP 2: Smart Duplicate Prevention ...                                                                                   |
| Drop Duplicates            | Merge                       | Filters out already processed reels    | Limit, Search for Entries    | Add Entries                  | ## 🔍 STEP 2: Smart Duplicate Prevention ...                                                                                   |
| Add Entries                | Google Sheets (Append)       | Adds new reels to Google Sheets        | Drop Duplicates              | Download Video                | ## 🔍 STEP 2: Smart Duplicate Prevention ...                                                                                   |
| Download Video             | HTTP Request                | Downloads reel video from URL           | Add Entries                  | Transcribe Video              | ## 🧠 STEP 3: AI-Powered Content Analysis ...                                                                                  |
| Transcribe Video           | OpenAI Whisper (Langchain)   | Transcribes audio from video            | Download Video               | Filter & Generate Suggestions | ## 🧠 STEP 3: AI-Powered Content Analysis ...                                                                                  |
| Filter & Generate Suggestions | OpenAI GPT-4o (Langchain) | Identifies tools, generates guides     | Transcribe Video             | Search Perplexity             | ## 🧠 STEP 3: AI-Powered Content Analysis ...                                                                                  |
| Search Perplexity          | HTTP Request                | Gets additional insights on tools      | Filter & Generate Suggestions| Write New Script             | ## 🧠 STEP 3: AI-Powered Content Analysis ...                                                                                  |
| Write New Script           | OpenAI GPT-4o (Langchain)   | Creates new script for Instagram video | Search Perplexity            | Update Entries               | ## 🧠 STEP 3: AI-Powered Content Analysis ...                                                                                  |
| Update Entries             | Google Sheets (Update)       | Updates database with transcripts/script | Write New Script             | None                         | ## 📋 STEP 4: Database Updates ...                                                                                            |
| sticky-note-1              | Sticky Note                  | Explains Step 1 Instagram Content Discovery | None                         | None                         | ## 🎯 STEP 1: Instagram Content Discovery ...                                                                                  |
| sticky-note-2              | Sticky Note                  | Explains Step 2 Duplicate Prevention   | None                         | None                         | ## 🔍 STEP 2: Smart Duplicate Prevention ...                                                                                   |
| sticky-note-3              | Sticky Note                  | Explains Step 3 AI Content Analysis    | None                         | None                         | ## 🧠 STEP 3: AI-Powered Content Analysis ...                                                                                  |
| sticky-note-4              | Sticky Note                  | Explains Step 4 Database Updates        | None                         | None                         | ## 📋 STEP 4: Database Updates ...                                                                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set to run daily at 6 AM.

2. **Create HTTP Request Node: "Run Actor Synchronously"**  
   - Method: POST  
   - URL: `https://api.apify.com/v2/acts/xMc5Ga1oCONPmWJIa/run-sync-get-dataset-items`  
   - Headers:  
     - Accept: application/json  
     - Authorization: Bearer *your Apify API key*  
   - Body (JSON):  
     ```json
     {
       "resultsLimit": 5,
       "username": [
         "nick_saraev", "juliangoldieseo", "brand.nat", "realrileybrown",
         "hamza_automates", "100xengineers", "mattfarmerai", "nathanhodgson.ai",
         "theaisurfer", "shedoesai", "aitrendz.xyz", "thevarunmayya",
         "rohak_arya", "digitalsamaritan"
       ]
     }
     ```
   - Connect Schedule Trigger output to this node.

3. **Create Limit Node**  
   - Configuration: Keep last 2 items (adjust as needed).  
   - Connect "Run Actor Synchronously" output to "Limit".

4. **Create Google Sheets Node: "Search for Entries"**  
   - Operation: Lookup rows  
   - Document: Your Google Sheets spreadsheet (Instagram Reel Database)  
   - Sheet: "Reels" (gid=0)  
   - Filter: Lookup where `id` equals `{{$json["id"]}}` from input data  
   - Credentials: Google Sheets OAuth2  
   - Connect "Limit" output to this node.

5. **Create Merge Node: "Drop Duplicates"**  
   - Mode: Combine  
   - Join Mode: Keep non-matches  
   - Fields to match: `id`  
   - Connect "Limit" as left input and "Search for Entries" as right input.

6. **Create Google Sheets Node: "Add Entries"**  
   - Operation: Append rows  
   - Map all relevant Reel metadata fields (id, url, caption, hashtags, username, videoUrl, etc.)  
   - Credentials: Google Sheets OAuth2  
   - Connect "Drop Duplicates" output to this node.

7. **Create HTTP Request Node: "Download Video"**  
   - Method: GET  
   - URL: Dynamic expression from Reel’s `videoUrl`  
   - Connect "Add Entries" output to this node.

8. **Create OpenAI Whisper Node: "Transcribe Video"**  
   - Resource: Audio  
   - Operation: Transcribe  
   - Credentials: OpenAI API (Whisper-enabled)  
   - Connect "Download Video" output to this node.

9. **Create OpenAI GPT-4o Node: "Filter & Generate Suggestions"**  
   - Model: GPT-4o  
   - System prompt: Explains task to identify tools in transcript, create usage steps, and content suggestions  
   - Input: Transcript text from "Transcribe Video" node  
   - Credentials: OpenAI API  
   - Connect "Transcribe Video" output to this node.

10. **Create HTTP Request Node: "Search Perplexity"**  
    - Method: POST  
    - URL: `https://api.perplexity.ai/chat/completions`  
    - Headers:  
      - Accept: application/json  
      - Authorization: Bearer *your Perplexity API key*  
    - Body (JSON) dynamically includes searchPrompt from previous node output  
    - Connect "Filter & Generate Suggestions" output to this node.

11. **Create OpenAI GPT-4o Node: "Write New Script"**  
    - Model: GPT-4o  
    - Temperature: 0.7  
    - System prompt: Instructs to generate a concise, casual script with call to action  
    - Inputs: Combination of tools list, rough draft transcript, Perplexity output, step-by-step guide, and suggestions from previous nodes  
    - Credentials: OpenAI API  
    - Connect "Search Perplexity" output to this node.

12. **Create Google Sheets Node: "Update Entries"**  
    - Operation: Update rows  
    - Match on `id` column  
    - Update fields:  
      - `scrapedTranscript` with original transcription  
      - `newTranscript` with generated script  
    - Credentials: Google Sheets OAuth2  
    - Connect "Write New Script" output to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                             | Context or Link                                                                                             |
|------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| Replace placeholder API keys (`yourapikeyhere`, `<your-perplexity-api-key-here>`) with valid credentials before activating workflow.   | Apify and Perplexity API usage                                                                              |
| The workflow relies on a Google Sheet named "Instagram Reel Database" with a sheet "Reels" structured for metadata and transcript data. | Google Sheets integration                                                                                    |
| Sticky notes in the workflow visually explain each step: Discovery, Duplicate Prevention, AI Processing, and Database Updates.          | Workflow documentation embedded in n8n canvas                                                              |
| OpenAI credentials must support GPT-4o model and Whisper transcription for full functionality.                                           | OpenAI API setup                                                                                            |
| The Perplexity AI API key must be obtained from Perplexity with chat completions enabled.                                                | Perplexity API documentation: https://www.perplexity.ai/api                                                |
| Ensure that the Apify actor used (`xMc5Ga1oCONPmWJIa`) remains publicly accessible or update with a maintained Instagram scraping actor. | Apify actor reference                                                                                       |

---

This detailed analysis and reconstruction guide enables developers and automation agents to fully understand, reproduce, and troubleshoot the Instagram content discovery and repurposing workflow with confidence.