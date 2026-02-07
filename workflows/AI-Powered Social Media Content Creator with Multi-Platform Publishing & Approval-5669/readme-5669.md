AI-Powered Social Media Content Creator with Multi-Platform Publishing & Approval

https://n8nworkflows.xyz/workflows/ai-powered-social-media-content-creator-with-multi-platform-publishing---approval-5669


# AI-Powered Social Media Content Creator with Multi-Platform Publishing & Approval

---

## 1. Workflow Overview

This workflow, titled **"AI-Powered Social Media Content Creator with Multi-Platform Publishing & Approval"**, automates the creation, approval, and multi-platform publishing of social media posts using AI tools integrated within n8n. It is designed for social media managers, marketing teams, and content creators who want to generate platform-specific content from chat inputs, review and approve posts via email, and publish them seamlessly to multiple social platforms.

The workflow is logically structured into the following blocks:

- **1.1 Input Reception (Chat Trigger & Memory)**: Receives user prompts via chat and maintains conversation context.
- **1.2 AI Content Generation (Router Agent & Platform Tools)**: Uses an AI agent to analyze the input and call specialized tools to generate posts tailored for various social media platforms.
- **1.3 Content Approval (Email Preparation & Approval Waiting)**: Prepares an HTML email summary of generated content and sends it to an approver, then waits for approval.
- **1.4 Content Retrieval & Merging (Google Drive & JSON Extraction)**: Downloads the approved content from Google Drive, extracts the JSON, and merges post content with images.
- **1.5 Conditional Publishing (Router & Platform-Specific Posting)**: Routes the merged content to appropriate nodes to publish posts on X (Twitter), Instagram, Facebook, LinkedIn, Threads, and YouTube Shorts.
- **1.6 Response Formatting (Post-Publish Formatting)**: Formats output messages for each platform to summarize the published post content.
- **1.7 No-Op Placeholders**: Nodes for future implementation of Threads and YouTube Shorts publishing.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception

**Overview:**  
This block captures chat messages from users to initiate the workflow and maintains conversational context for AI processing.

**Nodes Involved:**  
- When chat message received  
- Window Buffer Memory  

**Node Details:**  

- **When chat message received**  
  - Type: Chat Trigger (LangChain)  
  - Role: Entry point to receive chat input asynchronously.  
  - Configuration: Uses webhook with a placeholder webhookId; triggers on incoming chat messages.  
  - Expressions: None directly, but chat input is accessed downstream via `$('When chat message received').item.json.chatInput`.  
  - Outputs: Connected to the Social Media Router Agent node.  
  - Edge Cases: Requires correct webhook setup; failure if webhook misconfigured or not publicly accessible.

- **Window Buffer Memory**  
  - Type: Memory Buffer (LangChain)  
  - Role: Maintains a sliding window of conversation history to provide context to AI agents.  
  - Configuration: Default parameters (no custom settings).  
  - Inputs/Outputs: Connected as AI memory input to Social Media Router Agent.  
  - Edge Cases: Memory overflow or excessive context size could lead to token limits errors in OpenAI calls.

---

### 2.2 AI Content Generation

**Overview:**  
This block uses an AI agent to decide which platform-specific content creation tool to invoke based on user input, generating tailored posts for multiple social networks.

**Nodes Involved:**  
- 🤖Social Media Router Agent (LangChain Agent)  
- X-Twiter (Tool Workflow)  
- Instagram (Tool Workflow)  
- Facebook (Tool Workflow)  
- LinkedIn (Tool Workflow)  
- Short (Threads) (Tool Workflow)  
- YouTube Short (Tool Workflow)  
- gpt-4o (OpenAI Chat Model)  

**Node Details:**  

- **🤖Social Media Router Agent**  
  - Type: LangChain Agent  
  - Role: Acts as a controller AI that interprets user prompts and selectively calls platform-specific content creation tools.  
  - Configuration: Provided with system rules enforcing that it only calls tools, returning JSON objects, no direct user answers.  
  - Inputs: Receives chat input and memory context.  
  - Outputs: Calls tool workflows for each platform, passing the original chat input as `user_prompt`.  
  - Edge Cases: Agent response must be valid JSON; malformed responses may cause downstream errors.

- **X-Twiter, Instagram, Facebook, LinkedIn, Short (Threads), YouTube Short (Tool Workflows)**  
  - Type: LangChain Tool Workflows  
  - Role: Each generates a post tailored for a specific platform using the chat input.  
  - Configuration: Each tool receives the same user prompt from the chat input node; the `route` parameter specifies the target platform.  
  - Inputs: Connected as AI tools called by the Router Agent.  
  - Outputs: Generated post data passed onward for approval and publishing.  
  - Edge Cases: Each tool depends on successful AI model calls and correct routing; failure in any tool may affect that platform's content generation.

- **gpt-4o**  
  - Type: OpenAI Chat Model (LangChain LM)  
  - Role: Supports natural language processing within the workflow, likely as a fallback or additional AI model.  
  - Configuration: Model set to "gpt-4o" with JSON object response format.  
  - Edge Cases: API limits or model downtime may impact performance.

---

### 2.3 Content Approval

**Overview:**  
Prepares an HTML email with the generated social media content for human approval and waits for the approval response before proceeding.

**Nodes Involved:**  
- Prepare Email Contents (LangChain Agent)  
- Gmail User for Approval (Gmail Node)  
- Is Approved? (If Node)  

**Node Details:**  

- **Prepare Email Contents**  
  - Type: LangChain Agent  
  - Role: Generates an HTML email body using a provided template populated with social content data.  
  - Configuration: Uses a detailed HTML table template with placeholders replaced by social content fields. Outputs only HTML (no code blocks).  
  - Inputs: Receives JSON data extracted from the approved social media content.  
  - Outputs: HTML used as email message body.  
  - Edge Cases: Template placeholders must match available data; missing fields could produce incomplete emails.

- **Gmail User for Approval**  
  - Type: Gmail Node  
  - Role: Sends the prepared HTML email to an approver and waits for a double approval response.  
  - Configuration: Sends email to address defined by environment variable `TELEGRAM_CHAT_ID` (likely misnamed or proxy for actual email), with subject dynamically showing post name. Waits max 45 minutes.  
  - Outputs: Passes approval status downstream.  
  - Edge Cases: Requires valid Gmail OAuth2 credentials; if approval is not received in time, workflow may stall or timeout.

- **Is Approved?**  
  - Type: If Node  
  - Role: Evaluates the approval status boolean from the Gmail node and routes accordingly.  
  - Outputs: If approved, continues to download content; else, halts further publishing.  
  - Edge Cases: Misinterpretation of approval status could cause unintended publishing or blocking.

---

### 2.4 Content Retrieval & Merging

**Overview:**  
Downloads the approved social media post file from Google Drive, extracts its JSON content, and merges it with associated image data for publishing.

**Nodes Involved:**  
- File Id (Set Node)  
- Get Social Post from Google Drive (Google Drive Node)  
- Extract as JSON (Extract From File Node)  
- Get Social Post Image (HTTP Request Node)  
- Merge Image and Post Contents (Merge Node)  

**Node Details:**  

- **File Id**  
  - Type: Set Node  
  - Role: Assigns the output object from the AI agent to a JSON key for downstream retrieval.  
  - Configuration: Sets a variable `output` with the AI agent's output JSON.  
  - Outputs: Passes to Google Drive node.  

- **Get Social Post from Google Drive**  
  - Type: Google Drive Node  
  - Role: Downloads the file identified by the provided file ID from Google Drive.  
  - Configuration: Uses the file ID extracted from AI agent output response.  
  - Edge Cases: Requires valid Google Drive credentials and permissions; failure if file is missing or access denied.

- **Extract as JSON**  
  - Type: Extract From File Node  
  - Role: Parses the downloaded file content assuming JSON format.  
  - Configuration: Operation set to parse JSON.  
  - Edge Cases: File content must be valid JSON; malformed files cause errors.

- **Get Social Post Image**  
  - Type: HTTP Request Node  
  - Role: Downloads the social media post image from the URL specified in the extracted JSON.  
  - Configuration: Retry enabled on failure.  
  - Edge Cases: Network errors or invalid image URLs may cause failures.

- **Merge Image and Post Contents**  
  - Type: Merge Node  
  - Role: Combines JSON post data and downloaded image data by position for unified downstream processing.  
  - Configuration: Combine mode by position.  
  - Outputs: Feeds merged content into the Social Media Publishing Router.  

---

### 2.5 Conditional Publishing

**Overview:**  
Routes the merged content based on the social media platform and publishes the post using platform-specific nodes.

**Nodes Involved:**  
- Social Media Publishing Router (Switch Node)  
- X Post (Twitter Node)  
- Instagram Image (HTTP Request Node)  
- Instragram Post (Facebook Graph API Node for Instagram publishing)  
- Facebook Post (Facebook Graph API Node)  
- LinkedIn Post (LinkedIn Node)  
- Implement Threads Here (NoOp Node)  
- Implement YouTube Shorts Here (NoOp Node)  

**Node Details:**  

- **Social Media Publishing Router**  
  - Type: Switch Node  
  - Role: Routes incoming data to the appropriate platform publishing node based on the `route` field.  
  - Configuration: Multiple conditions matching platform names (`xtwitter`, `instagram`, `facebook`, `linkedin`, `threads`, `youtube_short`).  
  - Edge Cases: Case sensitivity and strict type checks could cause routing mismatches if data is inconsistent.

- **X Post**  
  - Type: Twitter Node  
  - Role: Posts content text to X (formerly Twitter).  
  - Configuration: Text content taken from merged JSON path `data.social_content.schema.post`.  
  - Edge Cases: Requires valid Twitter OAuth credentials; API rate limits or text length issues may occur.

- **Instagram Image**  
  - Type: HTTP Request Node  
  - Role: Creates Instagram media object by uploading image URL and caption.  
  - Configuration: Uses Facebook Graph API endpoint for Instagram media creation; requires Facebook Graph API credentials with Instagram permissions.  
  - Edge Cases: Image URL must be accessible; API permissions required.

- **Instragram Post**  
  - Type: Facebook Graph API Node  
  - Role: Publishes Instagram media object created previously.  
  - Configuration: Uses media publishing edge with creation ID from prior node.  
  - Edge Cases: Timing between media creation and publishing must be managed.

- **Facebook Post**  
  - Type: Facebook Graph API Node  
  - Role: Posts photo with caption to Facebook.  
  - Configuration: Uploads binary image data with message including post and call to action.  
  - Edge Cases: Requires Facebook page permissions; image binary must be present.

- **LinkedIn Post**  
  - Type: LinkedIn Node  
  - Role: Creates an organization post with text and image.  
  - Configuration: Posts as organization with ID configured; text includes post content, call to action, and hashtags.  
  - Edge Cases: Valid LinkedIn OAuth credentials and organization permissions required.

- **Implement Threads Here**  
  - Type: NoOp Node  
  - Role: Placeholder for future implementation of Threads publishing.  
  - Edge Cases: Not implemented yet.

- **Implement YouTube Shorts Here**  
  - Type: NoOp Node  
  - Role: Placeholder for future implementation of YouTube Shorts publishing.  
  - Edge Cases: Not implemented yet.

---

### 2.6 Response Formatting

**Overview:**  
Sets formatted textual responses summarizing the published post content for each platform.

**Nodes Involved:**  
- X Response (Set Node)  
- Instagram Response (Set Node)  
- Facebook Response (Set Node)  
- LinkedIn Response (Set Node)  

**Node Details:**  

- **X Response**  
  - Type: Set Node  
  - Role: Formats a text message including route, post name, post content, and thumbnail image link for X platform.  
  - Configuration: Uses expressions referencing the router output JSON data.  

- **Instagram Response**  
  - Type: Set Node  
  - Role: Formats Instagram post summary including route, post name, caption, and thumbnail image.  

- **Facebook Response**  
  - Type: Set Node  
  - Role: Formats Facebook post summary including route, post name, post content, and thumbnail image.  

- **LinkedIn Response**  
  - Type: Set Node  
  - Role: Formats LinkedIn post summary including route, post name, post content, and thumbnail image.  

---

### 2.7 Sticky Notes and Metadata

Sticky notes are used extensively throughout the workflow for documentation and section labeling, e.g., "## 👍Start Here", "## LLM", platform-specific labels, and process explanations.

---

## 3. Summary Table

| Node Name                    | Node Type                         | Functional Role                                         | Input Node(s)                         | Output Node(s)                                     | Sticky Note                                                                                  |
|------------------------------|----------------------------------|---------------------------------------------------------|-------------------------------------|---------------------------------------------------|----------------------------------------------------------------------------------------------|
| When chat message received    | Chat Trigger (LangChain)          | Entry point to receive chat input                        | -                                   | 🤖Social Media Router Agent                        | ## 👍Start Here                                                                             |
| Window Buffer Memory          | Memory Buffer (LangChain)         | Maintains chat memory context                            | When chat message received           | 🤖Social Media Router Agent                        | ## Chat Memory                                                                             |
| 🤖Social Media Router Agent   | LangChain Agent                   | Routes user prompt to platform-specific AI tools        | When chat message received, Window Buffer Memory | File Id                                           | # Social Media Router Agent                                                                |
| File Id                      | Set Node                         | Prepares file ID output for Google Drive download        | 🤖Social Media Router Agent           | Get Social Post from Google Drive                  |                                                                                              |
| Get Social Post from Google Drive | Google Drive Node              | Downloads approved post file                             | File Id                             | Extract as JSON                                   |                                                                                              |
| Extract as JSON              | Extract From File Node            | Parses downloaded file as JSON                           | Get Social Post from Google Drive    | Merge Image and Post Contents, Prepare Email Contents |                                                                                              |
| Get Social Post Image         | HTTP Request Node                 | Downloads image from URL specified in JSON              | Is Approved?                       | Merge Image and Post Contents                      |                                                                                              |
| Merge Image and Post Contents | Merge Node                      | Combines JSON post and image data                        | Extract as JSON, Get Social Post Image | Social Media Publishing Router                      |                                                                                              |
| Social Media Publishing Router | Switch Node                    | Routes post data to platform-specific publishing nodes   | Merge Image and Post Contents        | X Post, Instagram Image, Facebook Post, LinkedIn Post, Implement Threads Here, Implement YouTube Shorts Here | ## Social Media Publishing Router                                                          |
| X Post                      | Twitter Node                     | Publishes post to X (Twitter)                           | Social Media Publishing Router       | X Response                                        | ## 1️⃣ X - Twitter                                                                         |
| Instagram Image              | HTTP Request Node                 | Creates Instagram media object                           | Social Media Publishing Router       | Instragram Post                                   | ## 2️⃣ Instagram                                                                         |
| Instragram Post              | Facebook Graph API Node           | Publishes Instagram post                                 | Instagram Image                     | Instagram Response                               |                                                                                              |
| Facebook Post               | Facebook Graph API Node           | Publishes photo post to Facebook                         | Social Media Publishing Router       | Facebook Response                                 | ## 3️⃣ Facebook                                                                          |
| LinkedIn Post               | LinkedIn Node                    | Publishes post to LinkedIn organization                  | Social Media Publishing Router       | LinkedIn Response                                 | ## 4️⃣ LinkedIn                                                                          |
| Implement Threads Here      | NoOp Node                        | Placeholder for Threads publishing                       | Social Media Publishing Router       | -                                                 | ## 5️⃣Threads                                                                             |
| Implement YouTube Shorts Here | NoOp Node                      | Placeholder for YouTube Shorts publishing                | Social Media Publishing Router       | -                                                 | ## 6️⃣YouTube Shorts                                                                     |
| X Response                  | Set Node                         | Formats published post summary for X                    | X Post                             | -                                                 |                                                                                              |
| Instagram Response          | Set Node                         | Formats published post summary for Instagram            | Instragram Post                   | -                                                 |                                                                                              |
| Facebook Response           | Set Node                         | Formats published post summary for Facebook              | Facebook Post                    | -                                                 |                                                                                              |
| LinkedIn Response           | Set Node                         | Formats published post summary for LinkedIn              | LinkedIn Post                    | -                                                 |                                                                                              |
| Prepare Email Contents      | LangChain Agent                   | Generates HTML email for approval                        | Extract as JSON                   | Gmail User for Approval                            | ## Prepare Email Approval Contents as HTML                                                |
| Gmail User for Approval      | Gmail Node                       | Sends approval email and waits for response             | Prepare Email Contents             | Is Approved?                                      | # 👍 Approve Content Before Proceeding                                                  |
| Is Approved?                | If Node                          | Checks if content is approved                            | Gmail User for Approval             | Get Social Post Image (if approved)               |                                                                                              |
| gpt-4o                      | OpenAI Chat Model (LangChain)    | AI model for chat tasks                                  | -                               | 🤖Social Media Router Agent (AI languageModel)    | ## LLM                                                                                   |
| Sticky Notes (multiple)      | Sticky Note                      | Documentation and section labels                         | -                               | -                                                 | Various, including "## 👍Start Here", platform labels, and process explanations             |

---

## 4. Reproducing the Workflow from Scratch

1. **Create "When chat message received" node**  
   - Type: `@n8n/n8n-nodes-langchain.chatTrigger`  
   - Configure webhook with a unique, publicly accessible URL.  
   - No additional parameters needed.  

2. **Add "Window Buffer Memory" node**  
   - Type: `@n8n/n8n-nodes-langchain.memoryBufferWindow`  
   - Use default settings.  
   - Connect output of chat trigger to this memory node as AI memory.  

3. **Create "🤖Social Media Router Agent" node**  
   - Type: `@n8n/n8n-nodes-langchain.agent`  
   - System Message: Explain rules to only call tools with JSON responses.  
   - Provide tools: `create_x_twitter_posts_tool`, `create_instagram_posts_tool`, `create_facebook_posts_tool`, `create_linkedin_posts_tool`, `create_threads_posts_tool`, `create_youtube_short_tool`.  
   - Connect inputs: chat message and memory buffer.  
   - Outputs: connect to "File Id" node.  

4. **Create "File Id" Set node**  
   - Assign `output` field to the AI agent output JSON.  
   - Connect output to "Get Social Post from Google Drive".  

5. **Create "Get Social Post from Google Drive" node**  
   - Type: Google Drive node.  
   - Operation: Download file.  
   - File ID: use expression from previous node's response.  
   - Connect output to "Extract as JSON".  
   - Configure Google Drive credentials with required permissions.  

6. **Create "Extract as JSON" node**  
   - Operation: fromJson.  
   - Input: file content from Google Drive node.  
   - Outputs: connect to "Merge Image and Post Contents" and "Prepare Email Contents".  

7. **Create "Get Social Post Image" HTTP Request node**  
   - URL: Extract image URL from JSON data.  
   - Enable retry on fail.  
   - Connect output to "Merge Image and Post Contents".  

8. **Create "Merge Image and Post Contents" node**  
   - Mode: Combine by position.  
   - Inputs: JSON content and image content.  
   - Output: connect to "Social Media Publishing Router".  

9. **Create "Social Media Publishing Router" Switch node**  
   - Set conditions for values of `data.route` for each platform:  
     - xtwitter  
     - instagram  
     - facebook  
     - linkedin  
     - threads  
     - youtube_short  
   - Connect outputs to respective publishing nodes.  

10. **Create publishing nodes:**  
    - **X Post**: Twitter node, text from social content post.  
    - **Instagram Image**: HTTP Request node, POST to Facebook Graph API to create media.  
    - **Instragram Post**: Facebook Graph API node, media_publish edge.  
    - **Facebook Post**: Facebook Graph API node, photos edge, sends binary image data.  
    - **LinkedIn Post**: LinkedIn node, posts as organization with text and image.  
    - **Implement Threads Here**: NoOp node (placeholder).  
    - **Implement YouTube Shorts Here**: NoOp node (placeholder).  

    Configure credentials for each platform accordingly (Twitter OAuth1/2, Facebook Graph API, LinkedIn OAuth2).  

11. **Create response formatting nodes:**  
    - Set nodes for each platform to format a summary message using expressions referencing published content and images.  

12. **Create "Prepare Email Contents" LangChain Agent node**  
    - Provide HTML email template with placeholders for social content fields and image thumbnail.  
    - Connect input from "Extract as JSON".  
    - Output connects to "Gmail User for Approval".  

13. **Create "Gmail User for Approval" node**  
    - Operation: sendAndWait with double approval.  
    - Send to email configured via environment variable or explicit email address.  
    - Subject includes dynamic post name.  
    - Timeout: 45 minutes.  
    - Output connects to "Is Approved?" node.  
    - Configure Gmail OAuth2 credentials.  

14. **Create "Is Approved?" If node**  
    - Condition: approval status boolean true.  
    - True: connect to "Get Social Post Image".  
    - False: stop or handle rejection.  

15. **Add sticky notes** throughout the workflow for documentation and clarity.  

---

## 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                                  |
|----------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Update all Social Media Platform Credentials as required.                                           | Sticky Note near publishing nodes                                                                                |
| Adjust parameters and content for each platform to suit your needs.                                | Sticky Note near publishing nodes                                                                                |
| Workflow uses LangChain AI agents and tools extensively for content creation and routing logic.   | General architecture note                                                                                        |
| Approval email includes HTML templated content with embedded image thumbnails and post details.    | Email preparation block                                                                                          |
| Placeholder nodes exist for Threads and YouTube Shorts publishing, to be implemented in the future.| NoOp nodes with sticky notes                                                                                     |
| Facebook Graph API calls require correct page and Instagram permissions.                           | Publishing nodes using Facebook Graph API                                                                        |
| Ensure environment variables such as `TELEGRAM_CHAT_ID` used for approval email recipient are set. | Gmail approval node configuration                                                                                 |

---

**Disclaimer:** The provided content is exclusively derived from an automated n8n workflow and complies with all content policies, containing no illegal or protected data. All processed data is legal and publicly accessible.