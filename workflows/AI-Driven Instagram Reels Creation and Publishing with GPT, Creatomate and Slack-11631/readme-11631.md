AI-Driven Instagram Reels Creation and Publishing with GPT, Creatomate and Slack

https://n8nworkflows.xyz/workflows/ai-driven-instagram-reels-creation-and-publishing-with-gpt--creatomate-and-slack-11631


# AI-Driven Instagram Reels Creation and Publishing with GPT, Creatomate and Slack

### 1. Workflow Overview

This workflow automates the creation and publishing of Instagram Reels using AI-generated content combined with multimedia rendering and human approval. It targets social media managers, marketers, and automation enthusiasts aiming to streamline content creation and distribution on Instagram, while maintaining quality control via Slack approvals.

The workflow is logically divided into three main blocks:

- **1.1 Content Planning & Approval**  
  Generates engaging quiz-style content ideas for Instagram Reels based on past topics and trends, using OpenAI GPT models and Google Sheets for topic tracking. Content proposals are sent to Slack for human approval.

- **1.2 Video Creation**  
  Converts the approved content plan into a video using the Creatomate API. It waits for rendering completion before proceeding.

- **1.3 Publishing**  
  Automatically uploads and publishes the generated Reel video to Instagram via Facebook Graph API. Notifies the team on Slack upon successful posting.

---

### 2. Block-by-Block Analysis

#### 2.1 Content Planning & Approval

**Overview:**  
This block plans new Instagram Reel content by querying past topics from Google Sheets to avoid duplication, generates new quiz-style content ideas with OpenAI GPT, parses the AI output into structured JSON, and requests approval from Slack users.

**Nodes Involved:**  
- Schedule Trigger  
- Get Past Topics (Google Sheets)  
- Generate Content Plan (LangChain LLM Chain)  
- Parse LLM Output (Code)  
- Slack Approval Request (Slack)  
- Check Approval (If)  
- Save New Topic (Google Sheets)  
- OpenAI Chat Model (LangChain Chat OpenAI)  
- Main Sticky Note  
- Section: Content Gen (Sticky Note)

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow on an hourly basis (interval set to every hour) to generate new content regularly.  
  - Inputs: None  
  - Outputs: Connected to Get Past Topics  
  - Edge Cases: Missed triggers if n8n instance down; incorrect scheduling could lead to flooding.

- **Get Past Topics**  
  - Type: Google Sheets (Read)  
  - Role: Retrieves previously created questions to avoid content duplication.  
  - Configuration: Reads a specific Google Sheet and sheet name (IDs are placeholders). OAuth2 authentication configured.  
  - Inputs: From Schedule Trigger  
  - Outputs: To Generate Content Plan  
  - Edge Cases: Google API quota limits, invalid sheet/document IDs, auth token expiration.

- **Generate Content Plan**  
  - Type: LangChain LLM Chain (OpenAI GPT)  
  - Role: Generates a new quiz-style content plan in JSON format based on past topics and strict constraints (JSON only output, English language, mobile-friendly answer length).  
  - Configuration: Custom prompt includes instructions for JSON output with fields like Image, Audio trim, Question, Answer, Title, and Font family.  
  - Inputs: Past topics list (from Get Past Topics) as dynamic prompt content  
  - Outputs: To Parse LLM Output  
  - Credentials: OpenAI API (GPT-4o-mini model)  
  - Edge Cases: Model rate limits, malformed AI output, prompt failure, language inconsistencies.

- **Parse LLM Output**  
  - Type: Code (JavaScript)  
  - Role: Extracts and parses JSON content from AI raw text output, removing markdown code blocks and verifying valid JSON.  
  - Inputs: Text output from Generate Content Plan  
  - Outputs: To Slack Approval Request  
  - Edge Cases: Parsing errors if AI output deviates from expected JSON format; workflow throws explicit error on parse failure.

- **Slack Approval Request**  
  - Type: Slack node (Send & Wait for approval)  
  - Role: Posts the content proposal message to a Slack channel, including details like title, question, answer, image prompt, font, and audio trim start time. Waits for double approval before proceeding.  
  - Configuration: OAuth2 Slack authentication; message formatted with variables from parsed AI output; channel ID is preconfigured.  
  - Inputs: Parsed JSON content  
  - Outputs: To Check Approval  
  - Edge Cases: Slack API rate limits, invalid channel ID, user non-response causing workflow to hang, OAuth token expiry.

- **Check Approval**  
  - Type: If node  
  - Role: Checks approval status received from Slack node.  
  - Condition: Passes if approval is TRUE (double approval required).  
  - Inputs: Slack Approval Request output  
  - Outputs:  
    - TRUE branch: Save New Topic (records approved question)  
    - FALSE branch: Generate Content Plan (retries generating new content)  
  - Edge Cases: Approval status missing or malformed response causing incorrect branching.

- **Save New Topic**  
  - Type: Google Sheets (Append or Update)  
  - Role: Records the newly approved question into the Google Sheet for future reference.  
  - Configuration: Same Google Sheet and sheet name as Get Past Topics, OAuth2 auth.  
  - Inputs: From Check Approval TRUE branch  
  - Outputs: To Generate Video  
  - Edge Cases: Google Sheets API errors, concurrency issues, write conflicts.

- **OpenAI Chat Model**  
  - Type: LangChain Chat OpenAI  
  - Role: (Not directly connected in main flow) Possibly used as an internal or alternative AI model node; connected as AI language model for Generate Content Plan.  
  - Credentials: OpenAI API  
  - Edge Cases: Same as Generate Content Plan.

- **Main Sticky Note**  
  - Type: Sticky Note  
  - Content: Provides high-level documentation, setup instructions including credentials and IDs, and general workflow description.  

- **Section: Content Gen**  
  - Type: Sticky Note  
  - Content: Labels the Content Planning & Approval block.

---

#### 2.2 Video Creation

**Overview:**  
Transforms the approved content plan into an Instagram Reel video using Creatomate's rendering API, then waits for the rendering process to complete before moving to publishing.

**Nodes Involved:**  
- Save New Topic (from previous block)  
- Generate Video (HTTP Request to Creatomate)  
- Wait for Rendering (Wait)  
- Section: Approval (Sticky Note)

**Node Details:**  

- **Generate Video**  
  - Type: HTTP Request  
  - Role: Sends a POST request to Creatomate API to generate a video based on the approved content plan JSON fields.  
  - Configuration:  
    - URL: Creatomate render endpoint  
    - Method: POST  
    - Body: JSON includes template ID (placeholder), with modifications mapped from parsed AI output: image source, audio trim start fixed at 6.5, question & answer text, title, and font family.  
    - Auth: HTTP Header Authentication with Creatomate API key.  
  - Inputs: From Save New Topic  
  - Outputs: To Wait for Rendering  
  - Notes: Comment reminds user to set the Creatomate template ID.  
  - Edge Cases: API errors, invalid template ID, authentication failure, malformed JSON.

- **Wait for Rendering**  
  - Type: Wait node  
  - Role: Pauses workflow for a fixed time (minutes) to allow video rendering completion on Creatomate side.  
  - Inputs: From Generate Video  
  - Outputs: To Instagram Upload  
  - Edge Cases: Fixed wait time may be insufficient or excessive depending on rendering speed.

- **Section: Approval**  
  - Type: Sticky Note  
  - Content: Labels the video creation block.

---

#### 2.3 Publishing

**Overview:**  
Uploads the rendered video to Instagram as a Reel, publishes it, and sends a notification message on Slack confirming the post completion.

**Nodes Involved:**  
- Wait for Rendering (from Video Creation)  
- Instagram Upload (Facebook Graph API)  
- Wait (1 min) (Wait)  
- Instagram Publish (Facebook Graph API)  
- Slack Notification (Slack)  
- Section: Approval1 (Sticky Note)

**Node Details:**  

- **Instagram Upload**  
  - Type: Facebook Graph API  
  - Role: Uploads the video media to Instagram (Reels format) using Facebook Graph API's media edge.  
  - Configuration:  
    - Node: Instagram Business Account ID (placeholder)  
    - Parameters: media_type=REELS, video_url from Generate Video node output, caption includes question text and hashtags.  
    - HTTP Method: POST  
    - Graph API Version: v18.0  
  - Inputs: From Wait for Rendering  
  - Outputs: To Wait (1 min)  
  - Credentials: Facebook Graph API OAuth2  
  - Edge Cases: API rate limits, invalid video URL, permission errors, expired tokens.

- **Wait (1 min)**  
  - Type: Wait node  
  - Role: Waits 1 minute after uploading before publishing to ensure media availability.  
  - Inputs: From Instagram Upload  
  - Outputs: To Instagram Publish  
  - Edge Cases: Insufficient wait time may cause publishing to fail.

- **Instagram Publish**  
  - Type: Facebook Graph API  
  - Role: Publishes the uploaded media on Instagram using media_publish edge.  
  - Configuration:  
    - Node: Instagram Business Account ID  
    - Parameters: creation_id from Instagram Upload response  
    - HTTP Method: POST  
    - Graph API Version: v18.0  
  - Inputs: From Wait (1 min)  
  - Outputs: To Slack Notification  
  - Credentials: Facebook Graph API OAuth2  
  - Edge Cases: Publish failures due to invalid creation_id or permissions.

- **Slack Notification**  
  - Type: Slack node (Send message)  
  - Role: Sends a confirmation message to Slack channel with video URL and snapshot URL after successful publishing.  
  - Configuration: OAuth2 Slack credentials; message uses variables from Generate Video node output.  
  - Inputs: From Instagram Publish  
  - Outputs: None (end of workflow)  
  - Edge Cases: Slack API issues, token expiry.

- **Section: Approval1**  
  - Type: Sticky Note  
  - Content: Labels the publishing block.

---

### 3. Summary Table

| Node Name            | Node Type                  | Functional Role                              | Input Node(s)          | Output Node(s)           | Sticky Note                                                                                                         |
|----------------------|----------------------------|----------------------------------------------|------------------------|--------------------------|---------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger      | Schedule Trigger            | Initiates workflow hourly                     | None                   | Get Past Topics          |                                                                                                                     |
| Get Past Topics       | Google Sheets              | Reads past topics to avoid duplication        | Schedule Trigger       | Generate Content Plan     |                                                                                                                     |
| Generate Content Plan | LangChain LLM Chain        | Generates new quiz-style content plan         | Get Past Topics        | Parse LLM Output          |                                                                                                                     |
| Parse LLM Output      | Code                       | Parses AI JSON output from raw text           | Generate Content Plan  | Slack Approval Request    |                                                                                                                     |
| Slack Approval Request| Slack                      | Requests double approval on content proposal  | Parse LLM Output       | Check Approval            |                                                                                                                     |
| Check Approval        | If                         | Branches based on Slack approval status       | Slack Approval Request | Save New Topic, Generate Content Plan |                                                                                                               |
| Save New Topic        | Google Sheets              | Saves approved topic to Google Sheet          | Check Approval (true)  | Generate Video            |                                                                                                                     |
| OpenAI Chat Model     | LangChain Chat OpenAI      | AI language model for content generation       | -                      | Generate Content Plan (AI model input) |                                                                                                            |
| Generate Video        | HTTP Request (Creatomate)  | Sends approved content to Creatomate for video| Save New Topic         | Wait for Rendering        | Reminder: Set Creatomate template ID                                                                               |
| Wait for Rendering    | Wait                       | Pauses workflow during video rendering        | Generate Video         | Instagram Upload          |                                                                                                                     |
| Instagram Upload      | Facebook Graph API         | Uploads video as Instagram Reel                | Wait for Rendering     | Wait (1 min)              |                                                                                                                     |
| Wait (1 min)          | Wait                       | Waits 1 minute before publishing               | Instagram Upload       | Instagram Publish         |                                                                                                                     |
| Instagram Publish     | Facebook Graph API         | Publishes uploaded video on Instagram         | Wait (1 min)           | Slack Notification        |                                                                                                                     |
| Slack Notification    | Slack                      | Sends confirmation of successful post         | Instagram Publish      | None                     |                                                                                                                     |
| Main Sticky Note      | Sticky Note                | Documentation and setup instructions           | None                   | None                     | # 🚀 Automated Instagram Reels Generator… Setup steps include credentials and IDs configuration                    |
| Section: Content Gen  | Sticky Note                | Labels Content Planning & Approval block       | None                   | None                     | ## 1. Content Planning & Approval: AI generates ideas and requests Slack approval                                   |
| Section: Approval     | Sticky Note                | Labels Video Creation block                      | None                   | None                     | ## 2. Video Creation: Transforms plan into video using Creatomate                                                  |
| Section: Approval1    | Sticky Note                | Labels Publishing block                          | None                   | None                     | ## 3. Publishing: Uploads and publishes reel to Instagram automatically                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set interval to every 1 hour.

2. **Create Get Past Topics Node**  
   - Type: Google Sheets  
   - Operation: Read rows from your Google Sheet containing past questions.  
   - Configure OAuth2 credentials for Google Sheets API.  
   - Set Document ID and Sheet Name to your specific spreadsheet.

3. **Create Generate Content Plan Node**  
   - Type: LangChain LLM Chain  
   - Configure prompt to generate quiz-style Instagram Reel content in JSON, referencing past topics dynamically.  
   - Use OpenAI credentials with GPT-4o-mini model or equivalent.  
   - Ensure output parser is enabled to parse JSON.

4. **Create Parse LLM Output Node (Code)**  
   - Type: Code  
   - Use JavaScript to clean AI output from markdown and parse JSON, throwing error on invalid JSON.

5. **Create Slack Approval Request Node**  
   - Type: Slack  
   - Operation: Send and wait for double approval.  
   - OAuth2 Slack credentials configured.  
   - Set message template including variables extracted from parsed JSON (title, question, answer, image prompt, font, trim start).  
   - Set Slack channel ID.

6. **Create Check Approval Node (If)**  
   - Type: If  
   - Condition: Check if Slack’s response `data.approved` is true.  
   - TRUE branch leads to Save New Topic, FALSE branch loops back to Generate Content Plan.

7. **Create Save New Topic Node**  
   - Type: Google Sheets (Append or Update)  
   - Configure to add new approved question to your Google Sheet.  
   - Use same OAuth2 credentials and sheet as Get Past Topics.

8. **Create Generate Video Node (HTTP Request)**  
   - Type: HTTP Request  
   - Endpoint: Creatomate render API POST request.  
   - Set JSON body with template ID (replace with your actual Creatomate template) and map modifications from approved content fields.  
   - Use HTTP Header Authentication with your Creatomate API key.

9. **Create Wait for Rendering Node**  
   - Type: Wait  
   - Duration: Set to a few minutes sufficient for Creatomate rendering to complete.

10. **Create Instagram Upload Node**  
    - Type: Facebook Graph API  
    - Operation: POST to media edge with media_type=REELS, video URL from Creatomate output, caption including question text and hashtags.  
    - Configure Facebook Graph OAuth2 credentials.  
    - Set Instagram Business Account ID.

11. **Create Wait (1 min) Node**  
    - Type: Wait  
    - Duration: 1 minute to allow media processing.

12. **Create Instagram Publish Node**  
    - Type: Facebook Graph API  
    - Operation: POST to media_publish edge with creation_id from Upload node response.  
    - Use same Facebook OAuth2 credentials.

13. **Create Slack Notification Node**  
    - Type: Slack  
    - Operation: Send message to Slack channel with post completion details (video URL and snapshot URL).  
    - Use OAuth2 Slack credentials.

14. **Connect the nodes in order:**  
    - Schedule Trigger → Get Past Topics → Generate Content Plan → Parse LLM Output → Slack Approval Request → Check Approval  
    - Check Approval TRUE → Save New Topic → Generate Video → Wait for Rendering → Instagram Upload → Wait (1 min) → Instagram Publish → Slack Notification  
    - Check Approval FALSE → Generate Content Plan (retry loop)

15. **Add Sticky Notes** for documentation at logical points:  
    - Main overview note  
    - Content Planning & Approval block label  
    - Video Creation block label  
    - Publishing block label

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                                                      |
|----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| The workflow uses Creatomate API for video rendering; ensure your template ID is correctly set.    | Creatomate API docs: https://creatomate.com/api                                                                              |
| Slack nodes require OAuth2 authentication with appropriate scopes for sending messages and approvals.| Slack OAuth2 setup guide: https://api.slack.com/authentication/oauth-v2                                                          |
| Facebook Graph API requires Instagram Business Account linked to Facebook Page with correct perms. | Facebook Graph API docs: https://developers.facebook.com/docs/instagram-api/guides/reels                                            |
| The AI content generation enforces strict JSON output parsing; malformed AI responses cause errors. | Use GPT-4o-mini or compatible model with controlled prompt to reduce parsing issues.                                               |
| This workflow assumes English content generation for global audience; adapt prompt language as needed.|                                                                                                                                    |
| Video rendering wait times are fixed; consider implementing webhook callbacks if Creatomate supports.|                                                                                                                                    |
| Google Sheets nodes require OAuth2 credentials and correct sheet/document IDs for topic tracking.   |                                                                                                                                    |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated n8n workflow. It strictly complies with current content policies and contains no illegal, offensive, or protected material. All manipulated data is legal and public.