AI Podcast Generator with RSS Feed & ElevenLabs Voice

https://n8nworkflows.xyz/workflows/ai-podcast-generator-with-rss-feed---elevenlabs-voice-5084


# AI Podcast Generator with RSS Feed & ElevenLabs Voice

### 1. Workflow Overview

This workflow, titled **AI Podcast Generator with RSS Feed & ElevenLabs Voice**, automates the generation of podcast episodes based on content fetched from an RSS feed. Its primary use case is to automatically read new RSS feed entries, extract and validate content length, generate an AI-driven podcast script using OpenAI, synthesize voice audio via ElevenLabs, upload the audio file to Google Drive, and notify users through email and Telegram.

The workflow is logically divided into the following blocks:

- **1.1 Trigger and Input Reception:** Scheduled trigger initiates the workflow periodically, reading new items from an RSS feed.
- **1.2 Content Extraction and Validation:** Extracts the main content from RSS entries and checks if the content length meets minimum requirements.
- **1.3 AI Podcast Script Generation:** Uses OpenAI's API to generate a podcast script based on the extracted content.
- **1.4 Audio Synthesis with ElevenLabs:** Converts the generated script into audio using ElevenLabs text-to-speech service.
- **1.5 Upload and Notification:** Uploads the audio file to Google Drive, then sends notifications via email and Telegram.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger and Input Reception

- **Overview:**  
  This block initiates the workflow at scheduled intervals and reads the latest content from an RSS feed.

- **Nodes Involved:**  
  - Schedule Trigger  
  - RSS Feed Read

- **Node Details:**

  - **Schedule Trigger**  
    - Type: Trigger node (Schedule Trigger)  
    - Role: Initiates the workflow on a predefined schedule (e.g., daily, hourly)  
    - Configuration: Default or user-defined cron-like schedule  
    - Inputs: None (trigger node)  
    - Outputs: Triggers the RSS Feed Read node  
    - Failures: Misconfiguration may cause the workflow not to trigger; no retries by default.

  - **RSS Feed Read**  
    - Type: Input node (RSS Feed Reader)  
    - Role: Fetches the latest entries from the specified RSS feed URL  
    - Configuration: RSS feed URL needed; can specify max items and other feed parameters  
    - Inputs: Trigger from Schedule Trigger  
    - Outputs: Passes fetched RSS feed items to Extract Content node  
    - Failures: Network errors, invalid RSS URL, or malformed feed can cause failure; no fallback mechanism present.

#### 2.2 Content Extraction and Validation

- **Overview:**  
  Extracts the main textual content from RSS feed items and validates if the content length is sufficient to proceed.

- **Nodes Involved:**  
  - Extract Content (Code node)  
  - Check Content Length (If node)  
  - Content Too Short Error (Stop and Error node)

- **Node Details:**

  - **Extract Content**  
    - Type: Code node (JavaScript)  
    - Role: Processes RSS feed entries to extract relevant textual content for podcast generation  
    - Configuration: Custom JavaScript code to parse and clean RSS item content  
    - Inputs: RSS Feed Read output  
    - Outputs: Cleaned content passed to Check Content Length  
    - Failures: Code errors or unexpected feed structure can cause runtime exceptions.

  - **Check Content Length**  
    - Type: Conditional node (If)  
    - Role: Determines if extracted content meets a minimum length threshold  
    - Configuration: Condition like `content.length > threshold`  
    - Inputs: Extract Content output  
    - Outputs:  
      - True branch: Proceed to Generate Podcast Script  
      - False branch: Trigger Content Too Short Error  
    - Failures: Expression evaluation errors if content is undefined or null.

  - **Content Too Short Error**  
    - Type: Stop and Error node  
    - Role: Stops workflow execution with an error message when content is insufficient  
    - Configuration: Custom error message indicating content is too short  
    - Inputs: False branch of Check Content Length  
    - Outputs: None (terminates workflow)  
    - Failures: N/A (intended stop node)

#### 2.3 AI Podcast Script Generation

- **Overview:**  
  Generates a podcast script using the OpenAI language model based on the validated RSS content.

- **Nodes Involved:**  
  - Generate Podcast Script (OpenAI node)

- **Node Details:**

  - **Generate Podcast Script**  
    - Type: AI processing node (OpenAI)  
    - Role: Uses OpenAI API to generate a coherent podcast script from the input text  
    - Configuration:  
      - Model selection (e.g., GPT-4 or GPT-3.5)  
      - Prompt template incorporating extracted content  
      - Temperature, max tokens, and other parameters controlling generation  
    - Inputs: True branch output from Check Content Length  
    - Outputs: Generated podcast script passed to ElevenLabs node  
    - Credentials: Requires configured OpenAI API credentials  
    - Failures: API rate limits, authentication failures, or malformed prompts may cause errors.

#### 2.4 Audio Synthesis with ElevenLabs

- **Overview:**  
  Converts the AI-generated podcast script into speech audio using ElevenLabs text-to-speech.

- **Nodes Involved:**  
  - ElevenLabs

- **Node Details:**

  - **ElevenLabs**  
    - Type: External API node (ElevenLabs TTS)  
    - Role: Synthesizes voice audio from the AI-generated podcast script  
    - Configuration:  
      - Voice selection (predefined voices or custom)  
      - Audio format (e.g., mp3, wav)  
      - Input text from Generate Podcast Script  
    - Inputs: Output from Generate Podcast Script  
    - Outputs: Audio file binary data to Upload to Google Drive  
    - Credentials: Requires ElevenLabs API credentials  
    - Failures: Authentication errors, API limits, or network issues.

#### 2.5 Upload and Notification

- **Overview:**  
  Uploads the synthesized audio to Google Drive and sends notifications via email and Telegram about the new podcast episode.

- **Nodes Involved:**  
  - Upload to Google Drive  
  - Send Email Notification  
  - Send Telegram Notification

- **Node Details:**

  - **Upload to Google Drive**  
    - Type: Cloud storage node (Google Drive)  
    - Role: Uploads the audio file to a specified folder in Google Drive  
    - Configuration:  
      - Target folder ID or path  
      - File name and MIME type settings (e.g., audio/mpeg)  
      - Uses binary data from ElevenLabs node  
    - Inputs: Audio data from ElevenLabs  
    - Outputs: Triggers notification nodes  
    - Credentials: Requires Google Drive OAuth2 credentials  
    - Failures: Permission errors, quota limits, or network problems.

  - **Send Email Notification**  
    - Type: Email node (Gmail)  
    - Role: Sends an email notification about the new podcast episode upload  
    - Configuration:  
      - Recipient email addresses  
      - Subject and body, potentially with dynamic content (e.g., podcast title, link)  
    - Inputs: Output of Upload to Google Drive  
    - Credentials: Gmail OAuth2 credentials required  
    - Failures: Authentication errors, quota limits, invalid email addresses.

  - **Send Telegram Notification**  
    - Type: Messaging node (Telegram)  
    - Role: Sends a Telegram message notification about the new episode  
    - Configuration:  
      - Chat ID or username for the recipient  
      - Message text with dynamic content  
    - Inputs: Output of Upload to Google Drive  
    - Credentials: Telegram Bot API token required  
    - Failures: Invalid chat ID, bot permissions, network issues.

---

### 3. Summary Table

| Node Name              | Node Type                     | Functional Role                            | Input Node(s)        | Output Node(s)                    | Sticky Note |
|------------------------|-------------------------------|--------------------------------------------|----------------------|----------------------------------|-------------|
| Schedule Trigger       | Schedule Trigger              | Initiates workflow on schedule             | None                 | RSS Feed Read                    |             |
| RSS Feed Read          | RSS Feed Reader               | Reads RSS feed entries                      | Schedule Trigger     | Extract Content                  |             |
| Extract Content        | Code                         | Extracts and cleans RSS content             | RSS Feed Read        | Check Content Length             |             |
| Check Content Length   | If                           | Validates content length                     | Extract Content      | Generate Podcast Script, Content Too Short Error |             |
| Content Too Short Error| Stop and Error                | Stops workflow if content is too short      | Check Content Length | None                           |             |
| Generate Podcast Script| OpenAI                       | Generates podcast script from content       | Check Content Length | ElevenLabs                     |             |
| ElevenLabs             | ElevenLabs TTS               | Synthesizes audio from script                | Generate Podcast Script | Upload to Google Drive          |             |
| Upload to Google Drive | Google Drive                 | Uploads audio file                           | ElevenLabs           | Send Email Notification, Send Telegram Notification |             |
| Send Email Notification| Gmail                        | Sends email notification                     | Upload to Google Drive | None                           |             |
| Send Telegram Notification | Telegram                  | Sends Telegram notification                  | Upload to Google Drive | None                           |             |
| Sticky Note            | Sticky Note                  | [Empty]                                      | None                 | None                           |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Set the desired schedule (e.g., daily at 9 AM).  
   - This node will trigger the workflow periodically.

2. **Add an RSS Feed Read node:**  
   - Connect it to the Schedule Trigger node.  
   - Configure with the RSS feed URL you want to monitor.  
   - Set options such as max items if needed.

3. **Add a Code node named "Extract Content":**  
   - Connect it to RSS Feed Read.  
   - Write JavaScript code to extract and clean the main content from each RSS item (e.g., remove HTML tags, extract description or content fields).  
   - Ensure the code outputs a clean textual field for downstream use.

4. **Add an If node named "Check Content Length":**  
   - Connect it to Extract Content.  
   - Configure a condition to check if the extracted content length is above a set threshold (e.g., `{{$json["content"].length}} > 200`).  
   - The "true" branch proceeds; the "false" branch triggers an error.

5. **Add a Stop and Error node named "Content Too Short Error":**  
   - Connect it to the false branch of Check Content Length.  
   - Configure a suitable error message like "Content too short to generate podcast script."  
   - This node ends the workflow on insufficient content.

6. **Add an OpenAI node named "Generate Podcast Script":**  
   - Connect it to the true branch of Check Content Length.  
   - Configure OpenAI credentials.  
   - Select an appropriate model (e.g., GPT-4).  
   - Set prompt template to generate a podcast script based on the extracted content (pass content as prompt input).  
   - Tune parameters like temperature and max tokens as required.

7. **Add ElevenLabs node:**  
   - Connect it to Generate Podcast Script.  
   - Configure ElevenLabs API credentials.  
   - Set voice parameters and audio format.  
   - Use the generated podcast script text as input for speech synthesis.

8. **Add Google Drive node named "Upload to Google Drive":**  
   - Connect it to ElevenLabs.  
   - Configure Google Drive OAuth2 credentials.  
   - Specify target folder and file naming scheme for the audio file.  
   - Upload the audio binary data from ElevenLabs.

9. **Add Gmail node named "Send Email Notification":**  
   - Connect it to the output of Upload to Google Drive.  
   - Configure Gmail OAuth2 credentials.  
   - Set recipient email(s), subject, and body with dynamic content from previous nodes (e.g., link to uploaded file).

10. **Add Telegram node named "Send Telegram Notification":**  
    - Connect it to the output of Upload to Google Drive.  
    - Configure Telegram Bot API token.  
    - Set chat ID and message text with dynamic content about the new podcast episode.

11. **Test the entire workflow end-to-end:**  
    - Trigger manually or wait for the schedule.  
    - Verify each step completes successfully and notifications are received.

---

### 5. General Notes & Resources

| Note Content                                                                                                  | Context or Link                                          |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| This workflow integrates OpenAI and ElevenLabs APIs for content generation and speech synthesis.              | n8n nodes: @n8n/n8n-nodes-langchain.openAi, ElevenLabs  |
| Ensure API credentials for OpenAI, ElevenLabs, Google Drive, Gmail, and Telegram are set up with proper scopes.| Credential setup within n8n                              |
| ElevenLabs TTS supports multiple voices and languages; choose voice parameters matching your podcast style.   | https://elevenlabs.io/docs                               |
| Use Telegram bots with correct permissions to send messages to your chat/group.                               | https://core.telegram.org/bots/api                       |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected material. All manipulated data is legal and public.