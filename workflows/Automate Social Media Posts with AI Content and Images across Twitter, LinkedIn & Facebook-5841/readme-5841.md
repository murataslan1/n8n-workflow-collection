Automate Social Media Posts with AI Content and Images across Twitter, LinkedIn & Facebook

https://n8nworkflows.xyz/workflows/automate-social-media-posts-with-ai-content-and-images-across-twitter--linkedin---facebook-5841


# Automate Social Media Posts with AI Content and Images across Twitter, LinkedIn & Facebook

### 1. Workflow Overview

This workflow automates social media content creation and posting using AI-generated text and images. It targets users or organizations seeking to publish regularly scheduled posts across multiple social platforms—Twitter, LinkedIn, and Facebook—without manual content creation. The workflow logically divides into these main blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow daily at a fixed time.
- **1.2 AI Content Generation:** Uses OpenAI models to generate a post title, then a detailed tweet with hashtags.
- **1.3 AI Image Generation:** Creates a themed image based on the generated title.
- **1.4 Data Logging:** Appends or updates the generated content and metadata in a Google Sheet for record-keeping.
- **1.5 Social Media Posting:** Publishes the generated text and image to Twitter, LinkedIn, and Facebook using their respective APIs.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:** Starts the automation once every day at 22:00 (10 PM), triggering the entire workflow.
- **Nodes Involved:** Schedule Trigger
- **Node Details:**
  - Type: `Schedule Trigger`
  - Configuration: Trigger time set at hour 22 daily.
  - Inputs: None (trigger node)
  - Outputs: Connects to "Message a model" node.
  - Edge cases: If the system time zone is not set properly, the trigger may fire at unexpected local times.
  - Version-specific: Uses version 1.2 of the node.

#### 2.2 AI Content Generation

- **Overview:** Generates a concise title and then a detailed tweet around a niche automation problem using OpenAI's GPT-4 and GPT-4o models.
- **Nodes Involved:** Message a model, Message a model1
- **Node Details:**

  - **Message a model**
    - Type: OpenAI (LangChain integration)
    - Purpose: Generate a 50-character title about a very specific n8n or automation problem.
    - Configuration:
      - Model: GPT-4
      - Prompt: Static text requesting a 50-character title related to automation/n8n problems.
      - Credential: OpenAI API key (named "OpenAi account 2")
    - Inputs: Output from Schedule Trigger
    - Outputs: Feeds into "Message a model1", "Generate an image", and "Append or update row in sheet1".
    - Edge cases: API rate limits, authentication failures, prompt generation errors.

  - **Message a model1**
    - Type: OpenAI (LangChain integration)
    - Purpose: Using the title from the previous node, generate a solution-oriented tweet with hashtags.
    - Configuration:
      - Model: chatgpt-4o-latest (optimized for chat)
      - Prompt: Dynamic content referencing `{{ $json.message.content }}` (title from previous node).
      - Credential: Same OpenAI API as above.
    - Inputs: Output from "Message a model".
    - Outputs: Connects to "Append or update row in sheet1".
    - Edge cases: Expression failures if the title is missing or malformed, API errors.

#### 2.3 AI Image Generation

- **Overview:** Creates a Japanese anime style image inspired by the generated title.
- **Nodes Involved:** Generate an image
- **Node Details:**
  - Type: OpenAI Image generation (LangChain)
  - Configuration:
    - Resource: image generation
    - Prompt: Dynamic text referencing the title `{{ $json.message.content }}` with instruction to generate anime-style image.
    - Credential: Same OpenAI API used previously.
  - Inputs: Output from "Message a model"
  - Outputs: Connects to social media posting nodes: "Create Tweet", "Create a post", "Facebook Graph API"
  - Edge cases: Image generation failures, API quota limits.

#### 2.4 Data Logging

- **Overview:** Records the generated title, description, and image metadata into a Google Sheet for tracking and future reference.
- **Nodes Involved:** Append or update row in sheet1
- **Node Details:**
  - Type: Google Sheets
  - Configuration:
    - Operation: Append or update row based on matching "Title" column.
    - Columns: Title and Description set dynamically from AI-generated content.
    - Sheet: Target Google Sheet identified by documentId and sheetName (gid=0).
    - Credential: Google Sheets OAuth2 account ("Google Sheets account 3")
  - Inputs: Receives data from "Message a model1" and "Message a model"
  - Outputs: Feeds into social media posting nodes.
  - Edge cases: Google API authentication errors, permission errors on the sheet, schema mismatch.

#### 2.5 Social Media Posting

- **Overview:** Publishes the generated text and image to Twitter, LinkedIn, and Facebook.
- **Nodes Involved:** Create Tweet, Create a post, Facebook Graph API
- **Node Details:**

  - **Create Tweet**
    - Type: Twitter node (OAuth2)
    - Configuration:
      - Text: Posts the Description field from Google Sheets / AI output.
      - Credential: Connected to "X account" (Twitter OAuth2)
    - Inputs: From "Generate an image" and "Append or update row in sheet1"
    - Outputs: None
    - Edge cases: Twitter API limits, auth token expiration, content rejection.

  - **Create a post** (LinkedIn)
    - Type: LinkedIn node
    - Configuration: Default post with AI-generated content; no additional custom fields.
    - Inputs: From "Generate an image"
    - Outputs: None
    - Edge cases: LinkedIn API permissions, rate limits.

  - **Facebook Graph API**
    - Type: Facebook Graph API node
    - Configuration: Default posting options; uses Facebook Graph API credentials.
    - Inputs: From "Generate an image"
    - Outputs: None
    - Edge cases: Facebook API permission scopes, page access tokens expiration.

---

### 3. Summary Table

| Node Name                | Node Type                          | Functional Role               | Input Node(s)           | Output Node(s)                              | Sticky Note                                  |
|--------------------------|----------------------------------|------------------------------|------------------------|---------------------------------------------|----------------------------------------------|
| Schedule Trigger          | Schedule Trigger (v1.2)           | Workflow Initiation           | None                   | Message a model                             |                                              |
| Message a model           | OpenAI (LangChain) (v1.8)         | Generate title                | Schedule Trigger        | Message a model1, Generate an image, Append or update row in sheet1 |                                              |
| Message a model1          | OpenAI (LangChain) (v1.8)         | Generate tweet text           | Message a model         | Append or update row in sheet1              |                                              |
| Generate an image         | OpenAI Image Generation (v1.8)    | Generate anime-style image    | Message a model         | Create Tweet, Create a post, Facebook Graph API |                                              |
| Append or update row in sheet1 | Google Sheets (v4.6)          | Log content to Google Sheets  | Message a model1, Message a model | Create Tweet, Create a post, Facebook Graph API |                                              |
| Create Tweet             | Twitter OAuth2 (v2)                | Post tweet to Twitter         | Generate an image, Append or update row in sheet1 | None                                       |                                              |
| Create a post            | LinkedIn (v1)                     | Post to LinkedIn              | Generate an image       | None                                        |                                              |
| Facebook Graph API        | Facebook Graph API (v1)            | Post to Facebook              | Generate an image       | None                                        |                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Set the trigger to run daily at 22:00 (10 PM)  
   - No credentials needed  
   - Connect this node’s output to the next node "Message a model"

2. **Create "Message a model" OpenAI node**  
   - Type: OpenAI (LangChain)  
   - Credentials: Set with your OpenAI API key (GPT-4 access)  
   - Model ID: Select "gpt-4"  
   - Prompt: Static text: "Create a 50 character title of a topic related to very specific problem related to n8n or automation."  
   - Connect input from Schedule Trigger  
   - Connect outputs to "Message a model1", "Generate an image", and "Append or update row in sheet1"

3. **Create "Message a model1" OpenAI node**  
   - Type: OpenAI (LangChain)  
   - Credentials: Same OpenAI API key  
   - Model ID: Select "chatgpt-4o-latest"  
   - Prompt: Dynamic expression referencing previous node:  
     `Based on the title: {{ $json.message.content }}  
     Write a tweet that breaks this topic down.  
     Be solution oriented and make it easily readable with easy vocabulary  
     Add some hashtags too`  
   - Connect input from "Message a model"  
   - Output connects to "Append or update row in sheet1"

4. **Create "Generate an image" OpenAI node**  
   - Type: OpenAI Image generation (LangChain)  
   - Credentials: Same OpenAI API key  
   - Resource: Image  
   - Prompt: Dynamic expression:  
     `Based on the title: {{ $json.message.content }}  
     Generate a japanese anime style image`  
   - Connect input from "Message a model"  
   - Output connects to "Create Tweet", "Create a post", "Facebook Graph API"

5. **Create "Append or update row in sheet1" Google Sheets node**  
   - Credentials: Google Sheets OAuth2 with access to your target sheet  
   - Operation: Append or Update  
   - Document ID and Sheet Name: Set to your Google Sheet document and sheet (gid=0)  
   - Columns mapping:  
     - Title: `={{ $json.message.content }}` (title from AI)  
     - Description: `={{ $json.message.content }}` (same as title or from AI output)  
     - Image: Leave empty or map if image URL is available  
   - Connect inputs from "Message a model1" and "Message a model"  
   - Outputs connect to social media nodes

6. **Create "Create Tweet" Twitter node**  
   - Credentials: Twitter OAuth2 app credentials  
   - Text: Map to `{{ $json.Description }}` from Google Sheets or AI output  
   - Connect inputs from "Generate an image" and "Append or update row in sheet1"  

7. **Create "Create a post" LinkedIn node**  
   - Credentials: LinkedIn app OAuth2 credentials  
   - Use default post settings (can customize if needed)  
   - Connect input from "Generate an image"

8. **Create "Facebook Graph API" node**  
   - Credentials: Facebook Graph API OAuth2 credentials with appropriate permissions  
   - Use default posting options  
   - Connect input from "Generate an image"

9. **Verify all connections** according to the workflow’s connection graph:  
   - Schedule Trigger → Message a model  
   - Message a model → Message a model1, Generate an image, Append or update row in sheet1  
   - Message a model1 → Append or update row in sheet1  
   - Append or update row in sheet1 → Create Tweet, Create a post, Facebook Graph API  
   - Generate an image → Create Tweet, Create a post, Facebook Graph API

10. **Test the workflow manually** for one execution to verify AI outputs, image generation, Google Sheets logging, and social media posting.

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                                                                           |
|-----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Workflow automates multi-channel social media posting with AI-generated content and images.                      | Useful for marketing teams, automation enthusiasts, social media managers.                               |
| OpenAI GPT-4 and GPT-4o models used for different text generation tasks (title vs. tweet).                       | Requires valid API keys with sufficient quota and access.                                                |
| Google Sheets used as a content log for auditing and tracking published posts.                                  | Sheet must have columns: Title, Description, Image (optional).                                           |
| Twitter posting uses OAuth2 tokens for authentication; ensure tokens are valid and have appropriate scopes.     | Twitter API policy and rate limits apply.                                                                |
| LinkedIn and Facebook nodes require OAuth2 credentials with posting permissions to respective pages or profiles. | Proper app setup and permission grants needed in developer portals.                                      |
| Image generation uses a Japanese anime style prompt; adjust prompt as needed for different visual themes.        | Image outputs may vary; consider error handling for generation failures.                                  |

---

This detailed analysis and reconstruction guide should provide full clarity for developers or agents to understand, replicate, and maintain the workflow effectively.