Auto-Generate Instagram, Facebook & LinkedIn Posts from YouTube Videos with GPT-4o & Dumpling AI

https://n8nworkflows.xyz/workflows/auto-generate-instagram--facebook---linkedin-posts-from-youtube-videos-with-gpt-4o---dumpling-ai-9130


# Auto-Generate Instagram, Facebook & LinkedIn Posts from YouTube Videos with GPT-4o & Dumpling AI

### 1. Workflow Overview

This workflow automates the generation of tailored social media posts for Instagram, Facebook, and LinkedIn based on YouTube videos related to specific topics stored in a Google Sheet. It leverages Dumpling AI for YouTube search and transcript extraction, and OpenAI's GPT-4o for content generation. The workflow also produces AI-generated images matching each post and saves all outputs back to Google Sheets for further use.

**Target Use Cases:**  
- Social media managers wanting to automate content creation from video topics  
- Digital marketers seeking platform-specific post optimization  
- Content creators leveraging AI to boost productivity and engagement

**Logical Blocks:**  
- **1.1 Trigger & Input Retrieval:** Scheduled trigger initiates the workflow and fetches unprocessed topics from Google Sheets  
- **1.2 YouTube Search & Selection:** Searches YouTube videos via Dumpling AI, filters and selects the best match using GPT-4o  
- **1.3 Transcript & Post Generation:** Retrieves video transcript, generates platform-specific social media posts with GPT-4o  
- **1.4 AI Image Generation:** Creates images matching posts for Instagram, Facebook, and LinkedIn using Dumpling AI  
- **1.5 Formatting & Saving:** Formats posts with images and saves them to Google Sheets, then updates topic status as processed

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger & Input Retrieval

**Overview:**  
This block triggers the workflow on a schedule and retrieves an unprocessed YouTube topic from a designated Google Sheet to start the content generation process.

**Nodes Involved:**  
- Trigger Search Schedule  
- Get Unsearched Topic from Google Sheet

**Node Details:**

- **Trigger Search Schedule**  
  - *Type:* Schedule Trigger  
  - *Role:* Initiates workflow execution periodically (default interval unspecified but set to run regularly)  
  - *Configuration:* Interval set to run continuously (empty interval object implies default)  
  - *Input/Output:* No input; outputs trigger signal to next node  
  - *Potential Failures:* Misconfiguration could cause no triggering; dependent on n8n instance uptime  

- **Get Unsearched Topic from Google Sheet**  
  - *Type:* Google Sheets (Read)  
  - *Role:* Retrieves the first topic from the sheet where the "Searched?" column is empty or false (unprocessed topics)  
  - *Configuration:*  
    - Document and Sheet selected from Google Sheets OAuth2 credentials  
    - Filters to return only the first match where "Searched?" is false or empty  
    - Reads from sheet named "YouTube Topics" (gid=0)  
  - *Key Expressions:* None beyond sheet config; returns the topic to be searched  
  - *Connections:* Trigger node → this node → next search node  
  - *Potential Failures:* Authentication errors, empty sheet, or no unsearched topics may cause early termination

---

#### 2.2 YouTube Search & Selection

**Overview:**  
Searches YouTube for videos matching the topic using Dumpling AI, filters and sorts the videos, and uses GPT-4o to select the best matching video closest to the current date.

**Nodes Involved:**  
- Search YouTube via Dumpling AI  
- Filter + Sort YouTube Videos  
- Prepare Video List for AI  
- Select Best Video with GPT-4o

**Node Details:**

- **Search YouTube via Dumpling AI**  
  - *Type:* HTTP Request  
  - *Role:* Calls Dumpling AI API to search YouTube videos with the topic as the query  
  - *Configuration:*  
    - POST to `https://app.dumplingai.com/api/v1/youtube/search`  
    - Body JSON includes query from Google Sheets topic and filter set to "video"  
    - Auth via HTTP Header with Dumpling AI credentials  
  - *Expressions:* Uses `{{ $json['Youtube Topics'] }}` to inject topic  
  - *Input/Output:* Input from Google Sheets node; output is raw search results JSON  
  - *Potential Failures:* API key errors, rate limits, malformed JSON, no results

- **Filter + Sort YouTube Videos**  
  - *Type:* Code Node (JavaScript)  
  - *Role:* Parses Dumpling AI search response, filters for video type, sorts by published time descending, and extracts top 3 videos  
  - *Key Logic:*  
    - Extracts videos safely from various nested JSON structures  
    - Throws error if no videos found  
    - Sorts by publishedTime descending (newest first)  
    - Returns an array of 3 latest videos with id, url, title, and publishedTime info  
  - *Input:* Search results JSON  
  - *Output:* Filtered and trimmed list of videos  
  - *Edge Cases:* Various JSON structures handled; fails if no videos found

- **Prepare Video List for AI**  
  - *Type:* Aggregate  
  - *Role:* Aggregates all items into a single data set for feeding to GPT-4o  
  - *Configuration:* Aggregates all input data into a single array (aggregateAllItemData)  
  - *Input:* From previous code node (multiple video items)  
  - *Output:* Single aggregated item with video list

- **Select Best Video with GPT-4o**  
  - *Type:* OpenAI (Langchain) Node  
  - *Role:* Uses GPT-4o to analyze video list and select the best matching video closest to current date, returning JSON strictly formatted  
  - *Configuration:*  
    - Model: GPT-4.1  
    - System prompt instructs to pick videos matching search input and closest publishedTime to present date, output in strict JSON format  
    - User message injects: search input topic, present date (`$now`), and search output JSON string  
  - *Input:* Aggregated video list and search input  
  - *Output:* JSON with the selected best video details  
  - *Potential Failures:* OpenAI API errors, malformed prompt output, rate limits

---

#### 2.3 Transcript & Post Generation

**Overview:**  
Retrieves the transcript of the selected YouTube video via Dumpling AI and leverages GPT-4o to generate three unique, platform-specific social media posts with image prompts.

**Nodes Involved:**  
- Get Transcript (Dumpling AI)  
- Generate Posts with GPT-4o

**Node Details:**

- **Get Transcript (Dumpling AI)**  
  - *Type:* HTTP Request  
  - *Role:* Requests transcript for the selected YouTube video URL from Dumpling AI API  
  - *Configuration:*  
    - POST to `https://app.dumplingai.com/api/v1/get-youtube-transcript`  
    - JSON body includes videoUrl extracted from selected video (`{{ $json.message.content.data[0].url }}`)  
    - Auth via Dumpling AI HTTP header credentials  
  - *Output:* Transcript text in JSON response field `transcript`  
  - *Potential Failures:* Missing or invalid video URL, API errors, no transcript available

- **Generate Posts with GPT-4o**  
  - *Type:* OpenAI (Langchain) Node  
  - *Role:* Creates three distinct social media posts (Instagram, Facebook, LinkedIn) with matching image prompts using the transcript text  
  - *Configuration:*  
    - Model: GPT-4.1  
    - System prompt defines style and formatting rules for each platform's post and image prompt generation  
    - User message injects transcript text (`{{ $json.transcript }}`)  
    - Outputs strict JSON array named `output` with posts and image prompts  
  - *Output:* JSON with three platform posts and image prompts  
  - *Potential Failures:* OpenAI API failure, prompt misformatting, empty transcript input

---

#### 2.4 AI Image Generation

**Overview:**  
Generates AI images for each social media post’s image prompt using Dumpling AI’s image generation API.

**Nodes Involved:**  
- Generate Instagram Image (Dumpling AI)  
- Generate Facebook Image (Dumpling AI)  
- Generate LinkedIn Image (Dumpling AI)

**Node Details:**

All three nodes share a similar structure with minor differences in which image prompt they use:

- *Type:* HTTP Request  
- *Role:* Generate AI images from text prompts for each social platform  
- *Configuration:*  
  - POST to `https://app.dumplingai.com/api/v1/generate-ai-image`  
  - JSON body includes model `FLUX.1-pro`, prompt from respective post’s `image_prompt`, output format `png`  
  - Auth via Dumpling AI HTTP header credentials  
- *Key Expressions:* Reference to corresponding post output index, e.g., Instagram uses `output[0].image_prompt`  
- *Output:* JSON containing image URL(s)  
- *Potential Failures:* API key errors, rate limits, prompt issues, image generation timeouts

---

#### 2.5 Formatting & Saving

**Overview:**  
Formats each post with platform label, content, and associated image URL, saves them to a "Social Media Post" Google Sheet, merges post results, and updates the original topic’s status to "Searched? = Yes".

**Nodes Involved:**  
- Format Instagram Post  
- Format Facebook Post  
- Format LinkedIn Post  
- Save Instagram Post to Sheet  
- Save Facebook Post to Sheet  
- Save LinkedIn Post to Sheet  
- Merge Post Results  
- Update Topic Status in Sheet

**Node Details:**

- **Format [Platform] Post (Set Nodes)**  
  - *Type:* Set  
  - *Role:* Assigns structured fields: `platform` (instagram/facebook/linkedin), `Content` (post text), and `Image` (image URL) for each platform’s post  
  - *Configuration:* Uses expressions to pull data from `Generate Posts with GPT-4o` and respective image generation nodes  
  - *Input:* Image generation output and post generation output  
  - *Output:* Single item with formatted post data

- **Save [Platform] Post to Sheet (Google Sheets Append)**  
  - *Type:* Google Sheets (Append)  
  - *Role:* Appends each formatted post to the "Social Media Post" sheet in Google Sheets  
  - *Configuration:*  
    - Document and sheet selected via credentials  
    - Columns mapped automatically for platform, Content, Image  
  - *Input:* Formatted post item  
  - *Output:* Confirmation of append operation  
  - *Potential Failures:* Auth errors, sheet access issues, quota limits

- **Merge Post Results**  
  - *Type:* Merge  
  - *Role:* Merges the three separate post save operations into a single execution flow to synchronize downstream steps  
  - *Configuration:* Number of inputs set to 3 (one per platform)  
  - *Execute Once:* Enabled to run only one merged output  
  - *Input:* Outputs from Save Instagram, Facebook, and LinkedIn Post to Sheet nodes  
  - *Output:* Single merged output

- **Update Topic Status in Sheet**  
  - *Type:* Google Sheets (Append or Update)  
  - *Role:* Marks the original topic as searched by updating "Searched?" to "Yes" in the "YouTube Topics" sheet  
  - *Configuration:*  
    - Matches on "Youtube Topics" column to update the relevant row  
    - Appends or updates the "Searched?" column to "Yes"  
  - *Input:* From merged post results node  
  - *Output:* Confirmation of update  
  - *Potential Failures:* Auth errors, concurrent updates, matching failures

---

### 3. Summary Table

| Node Name                       | Node Type                      | Functional Role                                   | Input Node(s)                           | Output Node(s)                                    | Sticky Note                                                                                             |
|--------------------------------|--------------------------------|-------------------------------------------------|----------------------------------------|--------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Trigger Search Schedule         | Schedule Trigger               | Initiates workflow on schedule                   | None                                   | Get Unsearched Topic from Google Sheet            |                                                                                                       |
| Get Unsearched Topic from Google Sheet | Google Sheets                | Retrieves unprocessed YouTube topic              | Trigger Search Schedule                 | Search YouTube via Dumpling AI                     |                                                                                                       |
| Search YouTube via Dumpling AI | HTTP Request                  | Searches YouTube videos for topic via Dumpling AI | Get Unsearched Topic from Google Sheet | Filter + Sort YouTube Videos                       |                                                                                                       |
| Filter + Sort YouTube Videos    | Code                         | Filters & sorts top 3 latest videos from search  | Search YouTube via Dumpling AI          | Prepare Video List for AI                          |                                                                                                       |
| Prepare Video List for AI       | Aggregate                    | Aggregates video list for AI input                | Filter + Sort YouTube Videos             | Select Best Video with GPT-4o                      |                                                                                                       |
| Select Best Video with GPT-4o   | OpenAI (Langchain)           | Picks best video matching topic & date           | Prepare Video List for AI                | Get Transcript (Dumpling AI)                       |                                                                                                       |
| Get Transcript (Dumpling AI)   | HTTP Request                 | Retrieves transcript for selected video          | Select Best Video with GPT-4o            | Generate Posts with GPT-4o                         |                                                                                                       |
| Generate Posts with GPT-4o      | OpenAI (Langchain)           | Generates Instagram, Facebook, LinkedIn posts    | Get Transcript (Dumpling AI)            | Generate Instagram Image, Generate Facebook Image, Generate LinkedIn Image |                                                                                                       |
| Generate Instagram Image (Dumpling AI) | HTTP Request                 | Creates Instagram post image from prompt          | Generate Posts with GPT-4o               | Format Instagram Post                              |                                                                                                       |
| Generate Facebook Image (Dumpling AI) | HTTP Request                 | Creates Facebook post image from prompt           | Generate Posts with GPT-4o               | Format Facebook Post                               |                                                                                                       |
| Generate LinkedIn Image (Dumpling AI) | HTTP Request                 | Creates LinkedIn post image from prompt           | Generate Posts with GPT-4o               | Format LinkedIn Post                               |                                                                                                       |
| Format Instagram Post           | Set                          | Formats Instagram post with content & image       | Generate Instagram Image                 | Save Instagram Post to Sheet                       |                                                                                                       |
| Format Facebook Post            | Set                          | Formats Facebook post with content & image        | Generate Facebook Image                  | Save Facebook Post to Sheet                        |                                                                                                       |
| Format LinkedIn Post            | Set                          | Formats LinkedIn post with content & image        | Generate LinkedIn Image                  | Save LinkedIn Post to Sheet                        |                                                                                                       |
| Save Instagram Post to Sheet    | Google Sheets (Append)        | Saves Instagram post to Google Sheet              | Format Instagram Post                    | Merge Post Results                                |                                                                                                       |
| Save Facebook Post to Sheet     | Google Sheets (Append)        | Saves Facebook post to Google Sheet               | Format Facebook Post                     | Merge Post Results                                |                                                                                                       |
| Save LinkedIn Post to Sheet     | Google Sheets (Append)        | Saves LinkedIn post to Google Sheet               | Format LinkedIn Post                     | Merge Post Results                                |                                                                                                       |
| Merge Post Results              | Merge                        | Merges post save outputs for synchronization      | Save Instagram/Facebook/LinkedIn Posts  | Update Topic Status in Sheet                       |                                                                                                       |
| Update Topic Status in Sheet    | Google Sheets (Append/Update) | Marks topic as searched in Google Sheet           | Merge Post Results                      | None                                             |                                                                                                       |
| Sticky Note                    | Sticky Note                  | Workflow overview and instructions                 | None                                   | None                                             | ## 🧠 Auto-Generate Social Media Posts from YouTube Videos - detailed workflow description and instructions |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node**  
   - Set it to run at your desired interval (e.g., every hour or daily).

2. **Add a Google Sheets Node to Get Unsearched Topic**  
   - Operation: Read Rows  
   - Sheet: "YouTube Topics" (gid=0)  
   - Filter: Return first row where "Searched?" is empty or false  
   - Connect Schedule Trigger → Google Sheets node  
   - Configure Google Sheets OAuth2 credentials for your account.

3. **Add HTTP Request Node to Search YouTube via Dumpling AI**  
   - Method: POST  
   - URL: `https://app.dumplingai.com/api/v1/youtube/search`  
   - Body (JSON): `{ "query": "{{ $json['Youtube Topics'] }}", "filter": "video" }`  
   - Authentication: HTTP Header Auth with Dumpling AI API key  
   - Connect Google Sheets node → HTTP Request node.

4. **Add Code Node to Filter and Sort YouTube Videos**  
   - Paste provided JavaScript code to parse, filter, and return top 3 newest videos  
   - Connect HTTP Request node → Code node.

5. **Add Aggregate Node to Combine Video Items**  
   - Operation: aggregateAllItemData  
   - Connect Code node → Aggregate node.

6. **Add OpenAI Node to Select Best Video**  
   - Model: GPT-4.1  
   - System Prompt: Use supplied prompt to filter and pick best matching video closest to current date, output JSON only  
   - User Prompt: Inject search topic, current date, and aggregated video data  
   - Connect Aggregate node → OpenAI node  
   - Configure OpenAI credentials.

7. **Add HTTP Request Node to Get Transcript from Dumpling AI**  
   - Method: POST  
   - URL: `https://app.dumplingai.com/api/v1/get-youtube-transcript`  
   - Body (JSON): `{ "videoUrl": "{{ $json.message.content.data[0].url }}" }`  
   - Use Dumpling AI HTTP Header Auth  
   - Connect OpenAI node → HTTP Request node.

8. **Add OpenAI Node to Generate Platform-Specific Posts**  
   - Model: GPT-4.1  
   - System Prompt: Use supplied prompt describing Instagram, Facebook, LinkedIn post styles and JSON output format  
   - User Prompt: Inject transcript from previous node  
   - Connect HTTP Request (transcript) → OpenAI node.

9. **Add Three HTTP Request Nodes to Generate AI Images (one per platform)**  
   - Method: POST  
   - URL: `https://app.dumplingai.com/api/v1/generate-ai-image`  
   - Body (JSON): `{ "model": "FLUX.1-pro", "input": { "prompt": "{{ $json.message.content.output[0/1/2].image_prompt }}", "output_format": "png" } }`  
   - Use Dumpling AI HTTP Header Auth  
   - Connect OpenAI post generation node → all three image generation nodes (in parallel).

10. **Add Three Set Nodes to Format Posts (one per platform)**  
    - Assign `platform` (instagram/facebook/linkedin), `Content` (post text), and `Image` (image URL from respective image generation node)  
    - Connect each image generation node → corresponding Set node.

11. **Add Three Google Sheets Nodes to Save Posts (one per platform)**  
    - Operation: Append  
    - Sheet: "Social Media Post" (with columns for platform, Content, Image)  
    - Configure Google Sheets OAuth2 credentials  
    - Connect each Set node → corresponding Google Sheets node.

12. **Add Merge Node**  
    - Number of Inputs: 3  
    - Connect all three Google Sheets post save nodes → Merge node.

13. **Add Google Sheets Node to Update Topic Status**  
    - Operation: Append or Update  
    - Sheet: "YouTube Topics" (gid=0)  
    - Match on "Youtube Topics" column  
    - Set "Searched?" column to "Yes"  
    - Connect Merge node → Google Sheets update node.

14. **Test the entire workflow end-to-end**  
    - Verify correct credentials and API keys for Google Sheets, Dumpling AI, and OpenAI  
    - Confirm Google Sheets structure matches expected columns and sheets  
    - Ensure network and API access for external services

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                   | Context or Link                                                                                                       |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| The workflow requires no hardcoded API keys; credentials for Dumpling AI, OpenAI, and Google Sheets must be configured in n8n’s credential manager.                                                                                          | Workflow credentials setup                                                                                           |
| Required Google Sheets: "YouTube Topics" with columns `Youtube Topics` and `Searched?`; "Social Media Post" with columns `platform`, `Content`, `Image`.                                                                                      | Spreadsheet preparation                                                                                                |
| The workflow strictly uses JSON-formatted prompts and expects strict JSON outputs from GPT-4o to facilitate automation without parsing errors.                                                                                              | Prompt and output formatting best practices                                                                           |
| Dumpling AI APIs are used for both YouTube search and transcript, as well as AI image generation, centralizing AI-powered content enrichment.                                                                                               | Dumpling AI platform: https://app.dumplingai.com                                                                     |
| The workflow is designed to handle up to 3 videos per topic, selecting the best one closest to the present date, but can be modified for more or fewer results by adjusting the code node.                                                     | Scalability and customization                                                                                         |
| This automation is ideal for marketers and social media managers looking to generate native, engaging posts for multiple platforms from video content without manual rewriting or image sourcing.                                            | Use case clarification                                                                                                |

---

**Disclaimer:**  
The provided content is generated exclusively from an n8n automation workflow and complies strictly with all content policies. It contains no illegal, offensive, or protected material. All data processed is legal and publicly accessible.