AI-Powered YouTube Shorts Automation: Create & Publish with OpenAI & ElevenLabs

https://n8nworkflows.xyz/workflows/ai-powered-youtube-shorts-automation--create---publish-with-openai---elevenlabs-3553


# AI-Powered YouTube Shorts Automation: Create & Publish with OpenAI & ElevenLabs

### 1. Workflow Overview

This workflow automates the entire process of creating and publishing YouTube Shorts videos using AI technologies. It targets digital marketers, content creators, social media managers, and businesses aiming to scale short-form video marketing content with minimal manual effort. The workflow integrates multiple AI services to generate video ideas, scripts, voiceovers, visuals, and final video editing, culminating in automated YouTube publishing.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Validation**: Receives user input via Telegram, validates API keys, and initiates the content creation process.
- **1.2 AI Idea Generation & Approval**: Uses OpenAI to generate video ideas and scripts, with human approval checkpoints via Telegram.
- **1.3 Visual & Audio Asset Creation**: Generates images and voiceover audio using ElevenLabs and AI image/video generation APIs.
- **1.4 Video Assembly & Rendering**: Combines audio, images, and video clips into a final video using Creatomate and related services.
- **1.5 Final Approval & Publishing**: Sends the final video for human approval, converts and uploads it to YouTube, and notifies the user.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Validation

**Overview:**  
This block handles incoming Telegram messages, checks if the user input is valid, and verifies that all required API keys are set before proceeding.

**Nodes Involved:**  
- Telegram Trigger  
- If Message From User  
- If All API Keys Set  
- Telegram: API Keys Missing  
- Missing API Keys  
- Set API Keys

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger  
  - Role: Entry point for user messages via Telegram bot webhook.  
  - Configuration: Listens for any Telegram message to start the workflow.  
  - Inputs: Telegram messages  
  - Outputs: Passes data to "If Message From User" node  
  - Edge Cases: Telegram webhook failures, message format issues.

- **If Message From User**  
  - Type: If  
  - Role: Checks if the incoming message is valid for processing.  
  - Configuration: Conditional logic based on message content or type.  
  - Inputs: Telegram Trigger output  
  - Outputs: Routes valid messages to AI idea generation, invalid to ignore or error handling.  
  - Edge Cases: Unexpected message formats or commands.

- **If All API Keys Set**  
  - Type: If  
  - Role: Verifies that all required API keys (OpenAI, ElevenLabs, Replicate, Cloudinary, Creatomate, 0CodeKit, YouTube) are configured.  
  - Inputs: Workflow context or environment variables set in "Set API Keys"  
  - Outputs: Proceeds if all keys are present; otherwise triggers API keys missing notification.  
  - Edge Cases: Missing or invalid API keys causing downstream failures.

- **Telegram: API Keys Missing**  
  - Type: Telegram  
  - Role: Notifies the user via Telegram that API keys are missing and halts the workflow.  
  - Inputs: If All API Keys Set (false branch)  
  - Outputs: None (ends workflow)  
  - Edge Cases: Telegram message delivery failure.

- **Missing API Keys**  
  - Type: Stop and Error  
  - Role: Stops workflow execution with an error due to missing API keys.  
  - Inputs: Telegram: API Keys Missing  
  - Outputs: None  
  - Edge Cases: None.

- **Set API Keys**  
  - Type: Set  
  - Role: Sets all required API keys as variables for use in subsequent nodes.  
  - Inputs: Telegram: Processing Started  
  - Outputs: If All API Keys Set  
  - Edge Cases: Incorrect key values or missing keys.

---

#### 2.2 AI Idea Generation & Approval

**Overview:**  
Generates video ideas, scripts, and SEO-optimized metadata using OpenAI models. Includes human approval checkpoints via Telegram to accept or reject AI-generated ideas.

**Nodes Involved:**  
- Input Variables  
- Ideator 🧠 (OpenAI)  
- Script (Set)  
- Chunk Script (HTTP Request)  
- Split Out  
- OpenAI Chat Model  
- Discuss Ideas 💡 (Langchain Agent)  
- Structure Model Output  
- Track Conversation Memory  
- If No Video Idea  
- Telegram: Conversational Response  
- Telegram: Approve Idea  
- If Idea Approved  
- Idea Denied

**Node Details:**

- **Input Variables**  
  - Type: Set  
  - Role: Prepares input parameters for AI idea generation (e.g., topic, style).  
  - Inputs: If All API Keys Set  
  - Outputs: Ideator 🧠  
  - Edge Cases: Missing or malformed input variables.

- **Ideator 🧠**  
  - Type: OpenAI (Langchain)  
  - Role: Generates video ideas, titles, descriptions, and scripts using GPT models.  
  - Configuration: Uses advanced prompt engineering for SEO and engagement.  
  - Inputs: Input Variables  
  - Outputs: Script  
  - Edge Cases: API rate limits, prompt failures.

- **Script**  
  - Type: Set  
  - Role: Stores generated script text for further processing.  
  - Inputs: Ideator 🧠  
  - Outputs: Convert Script to Audio  
  - Edge Cases: Empty or invalid script content.

- **Chunk Script**  
  - Type: HTTP Request  
  - Role: Splits script into manageable chunks for voiceover or processing.  
  - Inputs: Convert Script to Audio  
  - Outputs: Split Out  
  - Edge Cases: HTTP request failures, chunking errors.

- **Split Out**  
  - Type: Split Out  
  - Role: Splits chunked script into individual parts for parallel processing.  
  - Inputs: Chunk Script  
  - Outputs: Image Prompter 📷  
  - Edge Cases: Empty chunks, splitting errors.

- **OpenAI Chat Model**  
  - Type: Langchain Chat Model  
  - Role: Supports conversational AI for idea discussion and refinement.  
  - Inputs: Discuss Ideas 💡  
  - Outputs: Discuss Ideas 💡  
  - Edge Cases: Chat model failures.

- **Discuss Ideas 💡**  
  - Type: Langchain Agent  
  - Role: Manages conversation flow for idea approval or rejection.  
  - Inputs: Telegram Trigger, Structure Model Output, Track Conversation Memory  
  - Outputs: If No Video Idea  
  - Edge Cases: Conversation state loss, unexpected user input.

- **Structure Model Output**  
  - Type: Output Parser Structured  
  - Role: Parses AI output into structured data for decision making.  
  - Inputs: Ideator 🧠  
  - Outputs: Discuss Ideas 💡  
  - Edge Cases: Parsing errors.

- **Track Conversation Memory**  
  - Type: Memory Buffer Window  
  - Role: Maintains conversation context across multiple user interactions.  
  - Inputs: Discuss Ideas 💡  
  - Outputs: Discuss Ideas 💡  
  - Edge Cases: Memory overflow or loss.

- **If No Video Idea**  
  - Type: If  
  - Role: Checks if AI generated a valid video idea.  
  - Inputs: Discuss Ideas 💡  
  - Outputs: Telegram: Conversational Response (no idea), Telegram: Approve Idea (idea present)  
  - Edge Cases: False negatives or positives.

- **Telegram: Conversational Response**  
  - Type: Telegram  
  - Role: Sends a message to user if no valid idea was generated.  
  - Inputs: If No Video Idea (false branch)  
  - Outputs: None  
  - Edge Cases: Telegram delivery failure.

- **Telegram: Approve Idea**  
  - Type: Telegram  
  - Role: Sends AI-generated idea to user for approval.  
  - Inputs: If No Video Idea (true branch)  
  - Outputs: If Idea Approved  
  - Edge Cases: User non-response or delays.

- **If Idea Approved**  
  - Type: If  
  - Role: Branches workflow based on user approval of idea.  
  - Inputs: Telegram: Approve Idea  
  - Outputs: Telegram: Processing Started (approved), Idea Denied (rejected)  
  - Edge Cases: User indecision or timeout.

- **Idea Denied**  
  - Type: Set  
  - Role: Handles rejection by resetting or requesting new ideas.  
  - Inputs: If Idea Approved (false branch)  
  - Outputs: Discuss Ideas 💡 (restart idea generation)  
  - Edge Cases: Looping without progress.

---

#### 2.3 Visual & Audio Asset Creation

**Overview:**  
Generates images and voiceover audio assets using AI services, including ElevenLabs for voice and various AI models for images and videos. Assets are uploaded to Cloudinary for storage.

**Nodes Involved:**  
- Convert Script to Audio  
- Upload to Cloudinary  
- Image Prompter 📷  
- Aggregate Prompts  
- Request Images  
- Generating Images (Wait)  
- Get Images  
- Request Videos  
- Generating Videos (Wait)  
- Get Videos  
- Aggregate Videos

**Node Details:**

- **Convert Script to Audio**  
  - Type: HTTP Request  
  - Role: Sends script chunks to ElevenLabs API to generate voiceover audio files.  
  - Inputs: Script  
  - Outputs: Chunk Script, Upload to Cloudinary  
  - Edge Cases: API failures, audio generation errors.

- **Upload to Cloudinary**  
  - Type: HTTP Request  
  - Role: Uploads generated audio and visual assets to Cloudinary cloud storage.  
  - Inputs: Convert Script to Audio, Merge Videos and Audio  
  - Outputs: Merge Videos and Audio  
  - Edge Cases: Upload failures, API limits.

- **Image Prompter 📷**  
  - Type: OpenAI (Langchain)  
  - Role: Generates AI prompts for image creation based on script content.  
  - Inputs: Split Out  
  - Outputs: Aggregate Prompts, Request Images  
  - Edge Cases: Prompt generation errors.

- **Aggregate Prompts**  
  - Type: Aggregate  
  - Role: Collects all image prompts into a single batch for processing.  
  - Inputs: Image Prompter 📷  
  - Outputs: Merge Video Variables (branch 1)  
  - Edge Cases: Aggregation errors.

- **Request Images**  
  - Type: HTTP Request  
  - Role: Calls AI image generation APIs (e.g., Replicate) with prompts to create images.  
  - Inputs: Aggregate Prompts  
  - Outputs: Generating Images  
  - Edge Cases: API failures, rate limits.

- **Generating Images**  
  - Type: Wait  
  - Role: Waits for asynchronous image generation to complete.  
  - Inputs: Request Images  
  - Outputs: Get Images  
  - Edge Cases: Timeout or generation failures.

- **Get Images**  
  - Type: HTTP Request  
  - Role: Retrieves generated images from AI service.  
  - Inputs: Generating Images  
  - Outputs: Request Videos  
  - Edge Cases: Retrieval failures.

- **Request Videos**  
  - Type: HTTP Request  
  - Role: Requests AI-generated video clips matching the script and images.  
  - Inputs: Get Images  
  - Outputs: Generating Videos  
  - Edge Cases: API failures.

- **Generating Videos**  
  - Type: Wait  
  - Role: Waits for video generation to complete asynchronously.  
  - Inputs: Request Videos  
  - Outputs: Get Videos  
  - Edge Cases: Timeout or errors.

- **Get Videos**  
  - Type: HTTP Request  
  - Role: Retrieves generated video clips.  
  - Inputs: Generating Videos  
  - Outputs: Aggregate Videos  
  - Edge Cases: Retrieval failures.

- **Aggregate Videos**  
  - Type: Aggregate  
  - Role: Collects all video clips for merging.  
  - Inputs: Get Videos  
  - Outputs: Merge Videos and Audio  
  - Edge Cases: Aggregation errors.

---

#### 2.4 Video Assembly & Rendering

**Overview:**  
Combines audio, images, and video clips into a final video using Creatomate API, prepares rendering JSON, and manages video merging and uploading to Cloudinary.

**Nodes Involved:**  
- Merge Videos and Audio  
- Generate Render JSON  
- Set JSON Variable  
- Send to Creatomate  
- Generating Final Video (Wait)  
- Get Final Video  
- Merge Video Variables  
- Upload to Cloudinary

**Node Details:**

- **Merge Videos and Audio**  
  - Type: Merge  
  - Role: Combines video clips and audio tracks into a single timeline.  
  - Inputs: Aggregate Videos, Upload to Cloudinary  
  - Outputs: Generate Render JSON, Upload to Cloudinary (branch 1)  
  - Edge Cases: Merging conflicts or missing assets.

- **Generate Render JSON**  
  - Type: HTTP Request  
  - Role: Creates JSON configuration for Creatomate video rendering API.  
  - Inputs: Merge Videos and Audio  
  - Outputs: Set JSON Variable  
  - Edge Cases: JSON formatting errors.

- **Set JSON Variable**  
  - Type: Set  
  - Role: Stores the render JSON for sending to Creatomate.  
  - Inputs: Generate Render JSON  
  - Outputs: Send to Creatomate  
  - Edge Cases: Data corruption.

- **Send to Creatomate**  
  - Type: HTTP Request  
  - Role: Sends video render request to Creatomate API.  
  - Inputs: Set JSON Variable  
  - Outputs: Generating Final Video  
  - Edge Cases: API failures, request timeouts.

- **Generating Final Video**  
  - Type: Wait  
  - Role: Waits for Creatomate to finish rendering the final video.  
  - Inputs: Send to Creatomate  
  - Outputs: Get Final Video  
  - Edge Cases: Timeout, rendering errors.

- **Get Final Video**  
  - Type: HTTP Request  
  - Role: Retrieves the rendered final video file.  
  - Inputs: Generating Final Video  
  - Outputs: Merge Video Variables  
  - Edge Cases: Retrieval failures.

- **Merge Video Variables**  
  - Type: Merge  
  - Role: Merges final video data with other metadata for approval.  
  - Inputs: Get Final Video, Aggregate Prompts (branch 1)  
  - Outputs: Telegram: Approve Final Video  
  - Edge Cases: Data mismatch.

- **Upload to Cloudinary**  
  - Type: HTTP Request  
  - Role: Uploads intermediate or final media assets to Cloudinary.  
  - Inputs: Convert Script to Audio, Merge Videos and Audio  
  - Outputs: Merge Videos and Audio  
  - Edge Cases: Upload failures.

---

#### 2.5 Final Approval & Publishing

**Overview:**  
Sends the final video to the user for approval via Telegram, converts video to Base64, uploads to YouTube, and sends confirmation messages.

**Nodes Involved:**  
- Telegram: Approve Final Video  
- If Final Video Approved  
- Convert Video to Base64  
- Decode Base64 to File  
- Upload to YouTube  
- Telegram: Video Uploaded  
- Telegram: Video Declined  
- Telegram: Processing Started  
- Telegram: Video Declined

**Node Details:**

- **Telegram: Approve Final Video**  
  - Type: Telegram  
  - Role: Sends the final video preview to the user for approval.  
  - Inputs: Merge Video Variables  
  - Outputs: If Final Video Approved  
  - Edge Cases: User non-response.

- **If Final Video Approved**  
  - Type: If  
  - Role: Branches based on user approval of the final video.  
  - Inputs: Telegram: Approve Final Video  
  - Outputs: Convert Video to Base64 (approved), Telegram: Video Declined (rejected)  
  - Edge Cases: User indecision or timeout.

- **Convert Video to Base64**  
  - Type: HTTP Request  
  - Role: Converts the video file to Base64 encoding for upload.  
  - Inputs: If Final Video Approved (true branch)  
  - Outputs: Decode Base64 to File  
  - Edge Cases: Conversion failures.

- **Decode Base64 to File**  
  - Type: Convert To File  
  - Role: Converts Base64 string back to file format for YouTube upload.  
  - Inputs: Convert Video to Base64  
  - Outputs: Upload to YouTube  
  - Edge Cases: File corruption.

- **Upload to YouTube**  
  - Type: YouTube  
  - Role: Uploads the final video file to the connected YouTube channel with metadata.  
  - Inputs: Decode Base64 to File  
  - Outputs: Telegram: Video Uploaded  
  - Edge Cases: API quota limits, upload failures.

- **Telegram: Video Uploaded**  
  - Type: Telegram  
  - Role: Notifies the user that the video has been successfully uploaded.  
  - Inputs: Upload to YouTube  
  - Outputs: None  
  - Edge Cases: Notification failures.

- **Telegram: Video Declined**  
  - Type: Telegram  
  - Role: Notifies the user that the final video was declined and workflow ends or loops.  
  - Inputs: If Final Video Approved (false branch)  
  - Outputs: None  
  - Edge Cases: Notification failures.

- **Telegram: Processing Started**  
  - Type: Telegram  
  - Role: Sends a message to the user indicating that video processing has started after idea approval.  
  - Inputs: If Idea Approved (true branch)  
  - Outputs: Set API Keys  
  - Edge Cases: Notification failures.

---

### 3. Summary Table

| Node Name                  | Node Type                          | Functional Role                          | Input Node(s)                  | Output Node(s)                 | Sticky Note                              |
|----------------------------|----------------------------------|----------------------------------------|-------------------------------|-------------------------------|-----------------------------------------|
| Telegram Trigger           | Telegram Trigger                  | Entry point for Telegram messages      | -                             | If Message From User           |                                         |
| If Message From User       | If                               | Validates user message                  | Telegram Trigger              | Discuss Ideas 💡               |                                         |
| If All API Keys Set        | If                               | Checks all API keys presence            | Set API Keys                  | Input Variables, Telegram: API Keys Missing |                                         |
| Telegram: API Keys Missing | Telegram                         | Notifies missing API keys               | If All API Keys Set           | Missing API Keys              |                                         |
| Missing API Keys           | Stop and Error                   | Stops workflow due to missing keys     | Telegram: API Keys Missing    | -                             |                                         |
| Set API Keys              | Set                              | Sets API keys variables                 | Telegram: Processing Started  | If All API Keys Set            | SET BEFORE STARTING                      |
| Input Variables           | Set                              | Prepares input for AI idea generation  | If All API Keys Set           | Ideator 🧠                    |                                         |
| Ideator 🧠                 | OpenAI (Langchain)               | Generates video ideas and scripts      | Input Variables              | Script                        |                                         |
| Script                    | Set                              | Stores generated script                 | Ideator 🧠                   | Convert Script to Audio        |                                         |
| Convert Script to Audio    | HTTP Request                    | Generates voiceover audio via ElevenLabs | Script                      | Chunk Script, Upload to Cloudinary |                                         |
| Chunk Script              | HTTP Request                    | Splits script into chunks               | Convert Script to Audio       | Split Out                    |                                         |
| Split Out                 | Split Out                       | Splits chunks for parallel processing  | Chunk Script                 | Image Prompter 📷             |                                         |
| Image Prompter 📷          | OpenAI (Langchain)               | Generates image prompts                  | Split Out                   | Aggregate Prompts, Request Images |                                         |
| Aggregate Prompts         | Aggregate                       | Aggregates image prompts                 | Image Prompter 📷            | Merge Video Variables (branch 1) |                                         |
| Request Images            | HTTP Request                    | Requests AI image generation             | Aggregate Prompts            | Generating Images             |                                         |
| Generating Images         | Wait                           | Waits for image generation completion   | Request Images               | Get Images                   |                                         |
| Get Images                | HTTP Request                    | Retrieves generated images               | Generating Images            | Request Videos               |                                         |
| Request Videos            | HTTP Request                    | Requests AI video clips                   | Get Images                  | Generating Videos            |                                         |
| Generating Videos         | Wait                           | Waits for video generation completion   | Request Videos              | Get Videos                  |                                         |
| Get Videos                | HTTP Request                    | Retrieves generated videos               | Generating Videos           | Aggregate Videos            |                                         |
| Aggregate Videos          | Aggregate                       | Aggregates video clips                    | Get Videos                  | Merge Videos and Audio       |                                         |
| Merge Videos and Audio    | Merge                          | Combines video clips and audio           | Aggregate Videos, Upload to Cloudinary | Generate Render JSON, Upload to Cloudinary |                                         |
| Upload to Cloudinary      | HTTP Request                    | Uploads media assets                      | Convert Script to Audio, Merge Videos and Audio | Merge Videos and Audio       |                                         |
| Generate Render JSON      | HTTP Request                    | Creates JSON config for video rendering  | Merge Videos and Audio       | Set JSON Variable           |                                         |
| Set JSON Variable         | Set                            | Stores render JSON                        | Generate Render JSON         | Send to Creatomate          |                                         |
| Send to Creatomate        | HTTP Request                    | Sends video render request                | Set JSON Variable            | Generating Final Video       |                                         |
| Generating Final Video    | Wait                           | Waits for final video rendering           | Send to Creatomate           | Get Final Video             |                                         |
| Get Final Video           | HTTP Request                    | Retrieves final rendered video            | Generating Final Video       | Merge Video Variables       |                                         |
| Merge Video Variables     | Merge                          | Merges final video data with metadata     | Get Final Video, Aggregate Prompts | Telegram: Approve Final Video |                                         |
| Telegram: Approve Idea    | Telegram                       | Sends AI idea for user approval           | If No Video Idea             | If Idea Approved            |                                         |
| If No Video Idea          | If                             | Checks if AI generated a valid idea       | Discuss Ideas 💡             | Telegram: Conversational Response, Telegram: Approve Idea |                                         |
| Telegram: Conversational Response | Telegram               | Sends message if no idea generated         | If No Video Idea             | -                           |                                         |
| If Idea Approved          | If                             | Branches based on idea approval            | Telegram: Approve Idea       | Telegram: Processing Started, Idea Denied |                                         |
| Idea Denied               | Set                            | Handles rejected ideas                      | If Idea Approved (false)     | Discuss Ideas 💡            |                                         |
| Telegram: Processing Started | Telegram                   | Notifies user that processing started      | If Idea Approved (true)      | Set API Keys                |                                         |
| Telegram: Approve Final Video | Telegram                  | Sends final video for approval              | Merge Video Variables        | If Final Video Approved     |                                         |
| If Final Video Approved   | If                             | Branches based on final video approval      | Telegram: Approve Final Video | Convert Video to Base64, Telegram: Video Declined |                                         |
| Convert Video to Base64   | HTTP Request                    | Converts final video to Base64               | If Final Video Approved      | Decode Base64 to File       |                                         |
| Decode Base64 to File     | Convert To File                 | Converts Base64 string back to file          | Convert Video to Base64      | Upload to YouTube           |                                         |
| Upload to YouTube         | YouTube                        | Uploads video to YouTube channel             | Decode Base64 to File       | Telegram: Video Uploaded    |                                         |
| Telegram: Video Uploaded  | Telegram                       | Notifies user of successful upload           | Upload to YouTube           | -                           |                                         |
| Telegram: Video Declined  | Telegram                       | Notifies user of video rejection              | If Final Video Approved (false) | -                        |                                         |
| Discuss Ideas 💡          | Langchain Agent                | Manages conversation for idea discussion     | Telegram Trigger, Structure Model Output, Track Conversation Memory | If No Video Idea |                                         |
| Structure Model Output    | Output Parser Structured       | Parses AI output into structured data         | Ideator 🧠                  | Discuss Ideas 💡            |                                         |
| Track Conversation Memory | Memory Buffer Window           | Maintains conversation context                | Discuss Ideas 💡            | Discuss Ideas 💡            |                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node**  
   - Type: Telegram Trigger  
   - Configure webhook to receive messages from your Telegram bot.

2. **Add If node "If Message From User"**  
   - Condition: Check if the incoming Telegram message is valid for processing.

3. **Add Set node "Set API Keys"**  
   - Define variables for all required API keys: OpenAI, ElevenLabs, Replicate, Cloudinary, Creatomate, 0CodeKit, YouTube.

4. **Add If node "If All API Keys Set"**  
   - Condition: Verify all API keys are present and valid.

5. **Add Telegram node "Telegram: API Keys Missing"**  
   - Sends message if API keys are missing.

6. **Add Stop and Error node "Missing API Keys"**  
   - Stops workflow if keys are missing.

7. **Connect "If All API Keys Set" true branch to "Input Variables" Set node**  
   - Prepare input parameters for AI idea generation (e.g., topic, style).

8. **Add OpenAI node "Ideator 🧠"**  
   - Use GPT model to generate video ideas, titles, descriptions, and scripts.  
   - Connect input variables to this node.

9. **Add Set node "Script"**  
   - Store generated script text.

10. **Add HTTP Request node "Convert Script to Audio"**  
    - Configure to call ElevenLabs API to generate voiceover audio from script chunks.

11. **Add HTTP Request node "Chunk Script"**  
    - Split script into chunks for processing.

12. **Add Split Out node "Split Out"**  
    - Split chunked script into individual parts.

13. **Add OpenAI node "Image Prompter 📷"**  
    - Generate AI prompts for image creation based on script chunks.

14. **Add Aggregate node "Aggregate Prompts"**  
    - Aggregate image prompts for batch processing.

15. **Add HTTP Request node "Request Images"**  
    - Call AI image generation API (e.g., Replicate) with prompts.

16. **Add Wait node "Generating Images"**  
    - Wait for image generation to complete.

17. **Add HTTP Request node "Get Images"**  
    - Retrieve generated images.

18. **Add HTTP Request node "Request Videos"**  
    - Request AI-generated video clips based on images and script.

19. **Add Wait node "Generating Videos"**  
    - Wait for video generation completion.

20. **Add HTTP Request node "Get Videos"**  
    - Retrieve generated video clips.

21. **Add Aggregate node "Aggregate Videos"**  
    - Aggregate video clips.

22. **Add HTTP Request node "Upload to Cloudinary"**  
    - Upload audio and video assets to Cloudinary.

23. **Add Merge node "Merge Videos and Audio"**  
    - Combine video clips and audio tracks.

24. **Add HTTP Request node "Generate Render JSON"**  
    - Create JSON configuration for Creatomate video rendering.

25. **Add Set node "Set JSON Variable"**  
    - Store render JSON.

26. **Add HTTP Request node "Send to Creatomate"**  
    - Send render request to Creatomate API.

27. **Add Wait node "Generating Final Video"**  
    - Wait for final video rendering.

28. **Add HTTP Request node "Get Final Video"**  
    - Retrieve rendered video.

29. **Add Merge node "Merge Video Variables"**  
    - Merge final video data with metadata.

30. **Add Telegram node "Telegram: Approve Final Video"**  
    - Send final video to user for approval.

31. **Add If node "If Final Video Approved"**  
    - Branch based on user approval.

32. **Add HTTP Request node "Convert Video to Base64"**  
    - Convert video file to Base64 for upload.

33. **Add Convert To File node "Decode Base64 to File"**  
    - Convert Base64 back to file.

34. **Add YouTube node "Upload to YouTube"**  
    - Upload video to YouTube channel with metadata.

35. **Add Telegram node "Telegram: Video Uploaded"**  
    - Notify user of successful upload.

36. **Add Telegram node "Telegram: Video Declined"**  
    - Notify user if video is declined.

37. **Add Langchain nodes for conversation management:**  
    - "Discuss Ideas 💡" (Agent)  
    - "Structure Model Output" (Output Parser)  
    - "Track Conversation Memory" (Memory Buffer)  
    - Connect these to manage idea discussion and approval.

38. **Add Telegram nodes for idea approval:**  
    - "Telegram: Approve Idea"  
    - "Telegram: Conversational Response" (for no idea)  
    - "If Idea Approved" node to branch workflow.

39. **Add Set node "Idea Denied"**  
    - Handles rejected ideas by restarting idea generation.

40. **Connect all nodes according to the logical flow described in section 2.**

41. **Configure all HTTP Request nodes with appropriate API endpoints, authentication headers, and payloads.**

42. **Set credentials for all external services (OpenAI, ElevenLabs, Replicate, Cloudinary, Creatomate, YouTube, Telegram) in n8n credentials manager.**

43. **Test the workflow end-to-end with sample inputs.**

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                         |
|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| This workflow requires approximately 10-15 minutes setup time, including API key configuration and Telegram bot setup. | Setup instructions included in workflow notes.                                                        |
| Video walkthrough available for step-by-step setup and customization guidance.                                 | Refer to workflow's embedded video walkthrough (not included here).                                   |
| Supports over 40 AI image models and multiple AI voices for customization.                                    | Allows tailoring visual and audio style to brand voice and audience preferences.                       |
| Uses Telegram for two human checkpoints: idea approval and final video approval.                              | Ensures user control over AI-generated content before publishing.                                     |
| Integrates multiple AI services: OpenAI (content generation), ElevenLabs (voiceover), Replicate (video), Creatomate (video assembly), Cloudinary (asset storage), YouTube API (publishing). | Requires API keys and credentials for all services.                                                   |
| Designed for digital marketers and content creators to automate YouTube Shorts production at scale.           | Ideal for teams seeking to increase content output without sacrificing quality.                        |
| Workflow includes detailed sticky notes with color-coded instructions for easy customization.                 | Accessible even for users new to marketing automation or n8n.                                         |

---

This document provides a comprehensive reference to understand, reproduce, and customize the AI-Powered YouTube Shorts Automation workflow, ensuring smooth integration and error anticipation across all steps.