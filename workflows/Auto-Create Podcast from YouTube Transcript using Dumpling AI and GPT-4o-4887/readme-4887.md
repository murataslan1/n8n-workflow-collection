Auto-Create Podcast from YouTube Transcript using Dumpling AI and GPT-4o

https://n8nworkflows.xyz/workflows/auto-create-podcast-from-youtube-transcript-using-dumpling-ai-and-gpt-4o-4887


# Auto-Create Podcast from YouTube Transcript using Dumpling AI and GPT-4o

### 1. Workflow Overview

This workflow automates the creation of podcast scripts from newly uploaded YouTube videos. It is designed for content creators who want to repurpose YouTube video content into podcast episodes efficiently. The workflow monitors a YouTube channel’s RSS feed, extracts transcripts via Dumpling AI, cleans and summarizes the transcript using GPT-4o, and stores the final podcast script with metadata in Airtable for easy management and further use.

The logical blocks are:

- **1.1 Input Reception:** Watching the YouTube RSS feed for new video uploads.
- **1.2 Transcript Extraction:** Using Dumpling AI to retrieve the full transcript of the detected video.
- **1.3 Transcript Processing:** Cleaning, labeling, and summarizing the transcript with GPT-4o.
- **1.4 Output Storage:** Saving the generated podcast script, title, and summary into Airtable.
- **1.5 Documentation:** Sticky note summarizing the workflow purpose and usage.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block triggers the workflow whenever a new YouTube video is detected through the RSS feed of a specified channel or playlist.

- **Nodes Involved:**  
  - Watch for New YouTube Video via RSS

- **Node Details:**  

  - **Watch for New YouTube Video via RSS**  
    - Type: RSS Feed Read Trigger  
    - Role: Polls the YouTube RSS feed for new items every minute to detect new video uploads automatically.  
    - Configuration:  
      - Feed URL is set to a YouTube RSS feed URL (`https://rss.app/feeds/Vw076Uzh7bIinpci.xml`).  
      - Polling frequency: every minute (`mode: everyMinute`).  
    - Inputs: None (trigger node)  
    - Outputs: Passes new feed items downstream, providing video metadata including the video link.  
    - Edge Cases / Potential Failures:  
      - RSS feed unavailability or downtime.  
      - Feed URL changes or invalid URL.  
      - Rate-limiting by the RSS provider.  
      - Network timeouts or connectivity issues.  
    - Version: 1  

#### 1.2 Transcript Extraction

- **Overview:**  
  This block retrieves the full transcript of the detected YouTube video using Dumpling AI’s API.

- **Nodes Involved:**  
  - Get Transcript from YouTube Video using Dumpling AI

- **Node Details:**  

  - **Get Transcript from YouTube Video using Dumpling AI**  
    - Type: HTTP Request (POST)  
    - Role: Sends the detected video URL to Dumpling AI’s API and requests an English transcript.  
    - Configuration:  
      - URL: `https://app.dumplingai.com/api/v1/get-youtube-transcript`  
      - Method: POST  
      - Body (JSON): Contains the video URL dynamically injected via expression `{{ $json.link }}`, and preferred language set to `"en"`.  
      - Authentication: HTTP Header Auth, using a stored credential named "Dumpling AI-n8n".  
    - Inputs: Receives the YouTube video metadata from the RSS trigger node.  
    - Outputs: Provides the transcript JSON from Dumpling AI, including the full transcript text.  
    - Edge Cases / Potential Failures:  
      - API authentication failure or invalid API key.  
      - Dumpling AI service unavailability or downtime.  
      - Video without available transcript or unsupported language.  
      - HTTP request timeouts or malformed requests.  
    - Version: 4.2  

#### 1.3 Transcript Processing

- **Overview:**  
  This block processes the raw transcript text by cleaning filler words, labeling speakers, summarizing key points, and generating a relevant podcast title using GPT-4o.

- **Nodes Involved:**  
  - Transform Transcript into Podcast Script using GPT-4o

- **Node Details:**  

  - **Transform Transcript into Podcast Script using GPT-4o**  
    - Type: OpenAI GPT integration (via LangChain node)  
    - Role: Uses GPT-4o to:  
      - Label speakers clearly (e.g., Speaker 1:).  
      - Remove filler words such as "um," "uh," "you know," "like," etc.  
      - Combine cleaned transcript into a formatted string.  
      - Summarize the conversation’s key points in 2–4 sentences.  
      - Extract or infer a podcast title relevant to the transcript content.  
      - Return strictly formatted JSON with fields: title, cleaned_transcript, summary.  
    - Configuration:  
      - Model: `chatgpt-4o-latest` (latest GPT-4o model).  
      - Messages: System prompt with instructions; user message containing transcript dynamically injected with expression `{{ $json.transcript }}`.  
      - JSON output enabled for structured parsing downstream.  
      - Credentials: OpenAI API key referenced as "OpenAi account 2".  
    - Inputs: Receives transcript JSON from Dumpling AI node.  
    - Outputs: JSON with title, cleaned_transcript, and summary fields.  
    - Edge Cases / Potential Failures:  
      - OpenAI API key invalid or quota exceeded.  
      - Model timeouts or rate limits.  
      - Prompt formatting errors or input transcript too long.  
      - Unexpected GPT response format.  
    - Version: 1.8  

#### 1.4 Output Storage

- **Overview:**  
  This block saves the generated podcast script and metadata to an Airtable base for further use, review, and management.

- **Nodes Involved:**  
  - Save Podcast Script and Metadata to Airtable

- **Node Details:**  

  - **Save Podcast Script and Metadata to Airtable**  
    - Type: Airtable node (Create operation)  
    - Role: Inserts a new record into a specified Airtable base and table with fields: Title, podcast transcript, and summary.  
    - Configuration:  
      - Base: Selected from the Airtable bases available (linked to a specific Airtable app).  
      - Table: Set to "podcast" table.  
      - Columns mapping:  
        - Title ← `{{ $json.message.content.title }}`  
        - Summary ← `{{ $json.message.content.summary }}`  
        - podcast transcript ← `{{ $json.message.content.cleaned_transcript }}`  
      - Mapping mode: manual definition of fields and values.  
      - Credentials: Airtable Personal Access Token credential named "Airtable Personal Access Token account".  
    - Inputs: Receives JSON from GPT-4o node containing the podcast script metadata.  
    - Outputs: Created Airtable record confirmation.  
    - Edge Cases / Potential Failures:  
      - Invalid or expired Airtable token.  
      - Airtable API limits or downtime.  
      - Mismatched base/table/field names or permissions errors.  
      - Data format issues (e.g., fields expecting strings but receiving null).  
    - Version: 2.1  

#### 1.5 Documentation

- **Overview:**  
  Provides a sticky note on the canvas summarizing the workflow’s purpose and ideal use case.

- **Nodes Involved:**  
  - Sticky Note

- **Node Details:**  

  - **Sticky Note**  
    - Type: Sticky Note (visual documentation)  
    - Role: Describes the workflow’s intent to auto-create podcast scripts from YouTube videos, leveraging Dumpling AI and GPT-4o, and storing results in Airtable.  
    - Content highlights:  
      - Workflow monitors YouTube RSS feed.  
      - Uses Dumpling AI for transcript extraction.  
      - GPT-4o cleans and summarizes transcripts.  
      - Saves output to Airtable for editing and podcast production.  
      - Ideal for creators repurposing videos as podcasts.  
    - Inputs/Outputs: None (informational only).  
    - Version: 1  

---

### 3. Summary Table

| Node Name                                 | Node Type                                | Functional Role                                    | Input Node(s)                      | Output Node(s)                                | Sticky Note                                                                                       |
|-------------------------------------------|-----------------------------------------|---------------------------------------------------|----------------------------------|-----------------------------------------------|-------------------------------------------------------------------------------------------------|
| Watch for New YouTube Video via RSS       | RSS Feed Read Trigger                    | Triggers workflow on new YouTube video upload     | None                             | Get Transcript from YouTube Video using Dumpling AI | ### 🎙️ Auto-Create Podcast Script from YouTube Videos This workflow starts by monitoring a YouTube RSS feed for new uploads. Once a new video is detected, Dumpling AI extracts the full transcript. GPT-4o then converts that transcript into a well-formatted podcast script, ensuring it’s clean, structured, and engaging. The final script along with the video title and summary is saved into Airtable, where it can be reviewed, edited, or used to produce an actual podcast episode. Ideal for creators repurposing video content into audio format. |
| Get Transcript from YouTube Video using Dumpling AI | HTTP Request (POST)                      | Retrieves transcript from Dumpling AI API          | Watch for New YouTube Video via RSS | Transform Transcript into Podcast Script using GPT-4o | See above sticky note                                                                             |
| Transform Transcript into Podcast Script using GPT-4o | OpenAI GPT (LangChain integration)      | Cleans, labels, summarizes transcript and generates podcast title | Get Transcript from YouTube Video using Dumpling AI | Save Podcast Script and Metadata to Airtable    | See above sticky note                                                                             |
| Save Podcast Script and Metadata to Airtable | Airtable Create                         | Saves podcast script, summary, and title to Airtable | Transform Transcript into Podcast Script using GPT-4o | None                                          | See above sticky note                                                                             |
| Sticky Note                               | Sticky Note                             | Workflow summary documentation                     | None                             | None                                          | See content in the “Sticky Note” node description above                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node: “Watch for New YouTube Video via RSS”**  
   - Node Type: RSS Feed Read Trigger  
   - Configure:  
     - Feed URL: `https://rss.app/feeds/Vw076Uzh7bIinpci.xml` (replace with your desired YouTube RSS feed)  
     - Polling Frequency: Every minute (set polling mode to `everyMinute`)  
   - No credentials required.  

2. **Create HTTP Request Node: “Get Transcript from YouTube Video using Dumpling AI”**  
   - Node Type: HTTP Request (POST)  
   - Connect input from “Watch for New YouTube Video via RSS” node.  
   - Configure:  
     - URL: `https://app.dumplingai.com/api/v1/get-youtube-transcript`  
     - Method: POST  
     - Authentication: HTTP Header Auth (set up credentials with Dumpling AI API key, name it e.g., “Dumpling AI-n8n”)  
     - Body Content Type: JSON  
     - Body JSON:  
       ```json
       {
         "videoUrl": "{{ $json.link }}",
         "preferredLanguage": "en"
       }
       ```  
     - Ensure body is sent as JSON.  

3. **Create OpenAI Node: “Transform Transcript into Podcast Script using GPT-4o”**  
   - Node Type: OpenAI (LangChain integration or native OpenAI node)  
   - Connect input from “Get Transcript from YouTube Video using Dumpling AI” node.  
   - Configure:  
     - Model: Select `chatgpt-4o-latest` or equivalent GPT-4o model.  
     - Credentials: Link to your OpenAI API key credential (e.g., “OpenAi account 2”).  
     - Messages:  
       - System Prompt:  
         ```
         Instructions:
         You are a professional transcript editor and podcast summarizer. For the transcript below, complete these tasks:

         Label each speaker (e.g., Speaker 1:) and remove all filler words such as "um," "uh," "you know," "like," "basically," "actually," "so."

         Combine the cleaned speaker labels and their text into one single string, clearly formatted.

         Summarize the key points of the conversation in 2–4 concise sentences.

         Extract or infer a short, relevant title based on the content.

         Return your response strictly in the following JSON format:
         {
           "title": "Relevant podcast title here",
           "cleaned_transcript": "Speaker 1: Cleaned text. Speaker 2: Cleaned text. (Continue in this format.)",
           "summary": "Concise summary of the key points here."
         }
         ```  
       - User Prompt:  
         ```
         Here’s the transcript:{{ $json.transcript }}
         ```  
     - Enable JSON output parsing for structured downstream use.  

4. **Create Airtable Node: “Save Podcast Script and Metadata to Airtable”**  
   - Node Type: Airtable (Create operation)  
   - Connect input from “Transform Transcript into Podcast Script using GPT-4o” node.  
   - Configure:  
     - Credentials: Set up Airtable Personal Access Token credential (name e.g., “Airtable Personal Access Token account”).  
     - Base: Select the Airtable base where podcasts will be stored.  
     - Table: Select the “podcast” table (or create one with relevant fields).  
     - Define Fields Mapping:  
       - Title ← `{{ $json.message.content.title }}`  
       - Summary ← `{{ $json.message.content.summary }}`  
       - podcast transcript ← `{{ $json.message.content.cleaned_transcript }}`  
     - Ensure field names exactly match those in Airtable schema.  

5. **(Optional) Add Sticky Note for Documentation**  
   - Add a sticky note on the canvas describing workflow purpose and usage for team clarity.

6. **Connect Nodes Sequentially:**  
   - “Watch for New YouTube Video via RSS” → “Get Transcript from YouTube Video using Dumpling AI” → “Transform Transcript into Podcast Script using GPT-4o” → “Save Podcast Script and Metadata to Airtable”  

7. **Validate and Activate Workflow**  
   - Test with a real YouTube RSS feed URL.  
   - Verify that Dumpling AI returns transcript.  
   - Check GPT-4o output JSON correctness.  
   - Confirm Airtable record creation with proper data.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                     | Context or Link                                |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------|
| This workflow is designed for creators looking to repurpose video content as audio podcasts, automating the transcript extraction and script generation process.                                                                                                                                  | Workflow purpose (Sticky Note content)        |
| Dumpling AI API requires an API key with appropriate permissions for transcript extraction. Ensure your subscription supports YouTube transcript retrieval.                                                                                                                                     | Dumpling AI API docs (https://app.dumplingai.com/docs) |
| GPT-4o is a cutting-edge OpenAI model optimized for complex understanding and content generation; API costs and rate limits apply.                                                                                                                                                               | OpenAI API documentation (https://platform.openai.com/docs/models/gpt-4o) |
| Airtable Personal Access Token must have write access to the target base and table. Field names in Airtable must match exactly those mapped in the node.                                                                                                                                          | Airtable API docs (https://airtable.com/api)  |
| Polling frequency is currently set to every minute which may lead to rate-limiting if feed updates are very frequent; adjust polling interval as necessary.                                                                                                                                      | RSS feed considerations                        |

---

**Disclaimer:** The text provided here is derived exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.