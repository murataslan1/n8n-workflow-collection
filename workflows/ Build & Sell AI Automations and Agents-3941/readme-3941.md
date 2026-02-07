 Build & Sell AI Automations and Agents

https://n8nworkflows.xyz/workflows/-build---sell-ai-automations-and-agents-3941


#  Build & Sell AI Automations and Agents

### 1. Workflow Overview

This workflow is designed as a comprehensive AI automation system that builds, processes, and sells AI-driven video content based on user input via Telegram. It incorporates ideation, script generation, multimedia creation (images, audio, video), and final video processing, with human-in-the-loop approval steps. The workflow integrates OpenAI language models, external APIs for media generation and hosting, and YouTube for publishing.

**Target use cases:**  
- Automating content creation (video scripts, images, audio) from user prompts  
- Enabling interactive approval processes via Telegram  
- Generating promotional or educational videos with AI assistance  
- Monetizing AI-generated media by streamlining production and publishing  

**Logical blocks:**  
- **1.1 Input Reception and Validation**: Receives and validates user input from Telegram, checks API key setup.  
- **1.2 Idea Generation and Discussion**: Uses AI agents to generate and discuss video ideas; manages approval or denial flows.  
- **1.3 Script Creation and Audio Generation**: Converts approved ideas into scripts and generates audio narrations.  
- **1.4 Image Generation and Handling**: Creates image prompts and fetches/generated images.  
- **1.5 Video Generation and Assembly**: Requests, aggregates, and merges video segments, integrates audio and images, and processes final video rendering.  
- **1.6 Final Approval and Publishing**: Handles final video approval via Telegram, converts video to upload-ready format, uploads to YouTube, and notifies users.  
- **1.7 API Key and Error Handling**: Ensures all required API keys are set and handles missing keys errors gracefully.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Validation

- **Overview:** This block initializes the workflow by receiving Telegram messages, verifying if input is from a valid user and if all necessary API keys are set. It prevents proceeding if keys are missing.  
- **Nodes Involved:** Telegram Trigger, If Message From User, Set API Keys, If All API Keys Set, Telegram: API Keys Missing, Missing API Keys (stop node)  
- **Node Details:**  
  - *Telegram Trigger*: Listens for incoming messages from Telegram users.  
  - *If Message From User*: Conditional node checking if the message is valid user input (likely filtering for text or command).  
  - *Set API Keys*: Prepares API key variables (likely pulled from credentials or environment). Flagged as "SET BEFORE STARTING" to emphasize manual configuration.  
  - *If All API Keys Set*: Checks presence of all required API keys; routes workflow accordingly.  
  - *Telegram: API Keys Missing*: Sends notification to user if keys are missing.  
  - *Missing API Keys*: Stops workflow execution with error if keys are not set.  
- **Edge Cases:** Missing API keys, invalid Telegram message format, unauthorized user input.

#### 1.2 Idea Generation and Discussion

- **Overview:** Uses AI to generate video ideas based on user input, tracks conversation memory, and routes ideas for approval or denial.  
- **Nodes Involved:** Discuss Ideas 💡 (agent), Structure Model Output, Track Conversation Memory, If No Video Idea, If Idea Approved, Idea Denied, Telegram: Conversational Response, Telegram: Approve Idea, Telegram: Processing Started  
- **Node Details:**  
  - *Discuss Ideas 💡*: AI agent node that uses LangChain to ideate video concepts.  
  - *Structure Model Output*: Parses AI output into structured format for evaluation.  
  - *Track Conversation Memory*: Maintains context window for coherent conversational flow with the user.  
  - *If No Video Idea*: Conditional node checking if the AI failed to generate ideas; routes to response or approval.  
  - *If Idea Approved*: Checks user approval status; continues or denies idea.  
  - *Idea Denied*: Sets variables or flags when idea is rejected, triggering regeneration or user notification.  
  - *Telegram: Conversational Response*: Sends AI-generated response back to user if no idea is generated or for conversational feedback.  
  - *Telegram: Approve Idea*: Sends approval prompt to user for generated ideas.  
  - *Telegram: Processing Started*: Notifies user that processing has begun after idea approval.  
- **Edge Cases:** AI failing to generate ideas, user denial, conversation context loss.

#### 1.3 Script Creation and Audio Generation

- **Overview:** Converts the approved idea into a video script and generates audio narration from the script.  
- **Nodes Involved:** Ideator 🧠 (OpenAI), Script, Convert Script to Audio, Chunk Script, Upload to Cloudinary  
- **Node Details:**  
  - *Ideator 🧠*: Uses OpenAI to generate a video script based on the idea.  
  - *Script*: Sets or formats the script text for further processing.  
  - *Convert Script to Audio*: Sends script to an external API to generate audio narration (likely TTS).  
  - *Chunk Script*: Splits the audio or script content if needed (e.g., for length constraints).  
  - *Upload to Cloudinary*: Uploads audio chunks or files to Cloudinary for storage and access.  
- **Edge Cases:** TTS API failures, large script size, upload errors.

#### 1.4 Image Generation and Handling

- **Overview:** Generates image prompts from the script or idea, requests and retrieves images for video content.  
- **Nodes Involved:** Image Prompter 📷 (OpenAI), Aggregate Prompts, Request Images, Generating Images, Get Images  
- **Node Details:**  
  - *Image Prompter 📷*: Uses OpenAI to generate image prompts based on script or ideas.  
  - *Aggregate Prompts*: Aggregates multiple image prompts into a batch for processing.  
  - *Request Images*: Calls an external image generation API or service.  
  - *Generating Images*: Wait node that pauses workflow until image generation completes (webhook).  
  - *Get Images*: Retrieves generated images from the external service.  
- **Edge Cases:** Image generation failure, timeout on wait node, invalid image prompts.

#### 1.5 Video Generation and Assembly

- **Overview:** Requests videos using generated prompts, aggregates video segments, merges video with audio and images, and prepares final video render JSON.  
- **Nodes Involved:** Request Videos, Generating Videos, Get Videos, Aggregate Videos, Merge Videos and Audio, Generate Render JSON, Set JSON Variable, Send to Creatomate, Generating Final Video, Get Final Video, Merge Video Variables  
- **Node Details:**  
  - *Request Videos*: Requests video clips from an external generation API.  
  - *Generating Videos*: Waits for video processing completion.  
  - *Get Videos*: Retrieves the generated video clips.  
  - *Aggregate Videos*: Aggregates multiple video parts for merging.  
  - *Merge Videos and Audio*: Combines video clips with audio narration and images.  
  - *Generate Render JSON*: Prepares JSON configuration for the rendering engine.  
  - *Set JSON Variable*: Sets parameters or payload for final rendering.  
  - *Send to Creatomate*: Sends project data to Creatomate API for video rendering.  
  - *Generating Final Video*: Waits for final video rendering to complete.  
  - *Get Final Video*: Retrieves the final rendered video.  
  - *Merge Video Variables*: Consolidates video metadata or variables for approval.  
- **Edge Cases:** API timeouts, video rendering failures, merging errors.

#### 1.6 Final Approval and Publishing

- **Overview:** Handles user approval of the final video, converts video formats, uploads to YouTube, and sends Telegram notifications.  
- **Nodes Involved:** Telegram: Approve Final Video, If Final Video Approved, Convert Video to Base64, Decode Base64 to File, Upload to YouTube, Telegram: Video Uploaded, Telegram: Video Declined  
- **Node Details:**  
  - *Telegram: Approve Final Video*: Requests user approval for final video.  
  - *If Final Video Approved*: Routes according to approval status.  
  - *Convert Video to Base64*: Converts video file for upload preparation.  
  - *Decode Base64 to File*: Converts base64 back to file format for YouTube upload.  
  - *Upload to YouTube*: Uploads the final video to YouTube channel.  
  - *Telegram: Video Uploaded*: Notifies user of successful upload.  
  - *Telegram: Video Declined*: Notifies user if the video was declined.  
- **Edge Cases:** User rejection, upload failures, conversion errors.

#### 1.7 API Key and Error Handling

- **Overview:** Manages scenarios when API keys are missing or invalid, stopping workflow and alerting users.  
- **Nodes Involved:** Telegram: API Keys Missing, Missing API Keys (stop node)  
- **Node Details:**  
  - *Telegram: API Keys Missing*: Notifies user to configure API keys.  
  - *Missing API Keys*: Stops workflow execution with error for missing keys.  
- **Edge Cases:** Missing or expired API keys, unauthorized API access.

---

### 3. Summary Table

| Node Name                 | Node Type                          | Functional Role                           | Input Node(s)                | Output Node(s)                     | Sticky Note                                                                                   |
|---------------------------|----------------------------------|-----------------------------------------|-----------------------------|----------------------------------|----------------------------------------------------------------------------------------------|
| Telegram Trigger          | Telegram Trigger                  | Entry point, listens for user messages | -                           | If Message From User              |                                                                                              |
| If Message From User      | If                               | Validates message from user             | Telegram Trigger             | Discuss Ideas 💡                  |                                                                                              |
| Set API Keys             | Set                              | Sets API keys variables                  | Telegram: Processing Started | If All API Keys Set               | SET BEFORE STARTING                                                                          |
| If All API Keys Set      | If                               | Checks if all API keys are set           | Set API Keys                | Input Variables / Telegram: API Keys Missing |                                                                                              |
| Telegram: API Keys Missing| Telegram                         | Notifies user about missing API keys    | If All API Keys Set          | Missing API Keys                 |                                                                                              |
| Missing API Keys         | Stop and Error                   | Stops workflow if keys missing           | Telegram: API Keys Missing   | -                                |                                                                                              |
| Discuss Ideas 💡          | LangChain Agent                  | Generates video ideas using AI           | If Message From User         | If No Video Idea                 |                                                                                              |
| Structure Model Output   | LangChain Output Parser          | Parses AI idea outputs                    | Discuss Ideas 💡             | Discuss Ideas 💡                 |                                                                                              |
| Track Conversation Memory| LangChain Memory Buffer          | Maintains conversation context           | Discuss Ideas 💡             | Discuss Ideas 💡                 |                                                                                              |
| If No Video Idea         | If                               | Checks if AI generated no ideas          | Discuss Ideas 💡             | Telegram: Conversational Response / Telegram: Approve Idea |                                                                                              |
| Telegram: Conversational Response| Telegram                   | Sends AI conversational message          | If No Video Idea             | -                                |                                                                                              |
| Telegram: Approve Idea   | Telegram                         | Sends approval prompt to user            | If No Video Idea             | If Idea Approved                |                                                                                              |
| If Idea Approved         | If                               | Checks if user approved idea              | Telegram: Approve Idea       | Telegram: Processing Started / Idea Denied |                                                                                              |
| Idea Denied              | Set                              | Handles idea rejection                    | If Idea Approved             | Discuss Ideas 💡                 |                                                                                              |
| Telegram: Processing Started| Telegram                      | Notifies user processing started         | If Idea Approved             | Set API Keys                    |                                                                                              |
| Input Variables          | Set                              | Prepares input variables for AI          | If All API Keys Set          | Ideator 🧠                      |                                                                                              |
| Ideator 🧠               | OpenAI (LangChain)               | Generates video script from idea         | Input Variables             | Script                         |                                                                                              |
| Script                   | Set                              | Sets the generated script text            | Ideator 🧠                  | Convert Script to Audio          |                                                                                              |
| Convert Script to Audio  | HTTP Request                    | Converts script text to audio (TTS)      | Script                      | Chunk Script / Upload to Cloudinary |                                                                                              |
| Chunk Script             | Split Out                       | Splits audio/script chunks if needed     | Convert Script to Audio      | Image Prompter 📷               |                                                                                              |
| Upload to Cloudinary     | HTTP Request                    | Uploads audio files to Cloudinary         | Convert Script to Audio / Chunk Script | Merge Videos and Audio        |                                                                                              |
| Image Prompter 📷        | OpenAI (LangChain)               | Generates image prompts from script       | Chunk Script                | Aggregate Prompts / Request Images |                                                                                              |
| Aggregate Prompts        | Aggregate                      | Aggregates image prompts                   | Image Prompter 📷           | Merge Video Variables (branch 1) |                                                                                              |
| Request Images           | HTTP Request                    | Requests image generation                  | Image Prompter 📷           | Generating Images               |                                                                                              |
| Generating Images        | Wait                           | Waits for asynchronous image generation   | Request Images              | Get Images                     |                                                                                              |
| Get Images               | HTTP Request                    | Retrieves generated images                 | Generating Images           | Request Videos                 |                                                                                              |
| Request Videos           | HTTP Request                    | Requests video generation                   | Get Images                  | Generating Videos              |                                                                                              |
| Generating Videos        | Wait                           | Waits for asynchronous video generation   | Request Videos              | Get Videos                   |                                                                                              |
| Get Videos               | HTTP Request                    | Retrieves generated videos                  | Generating Videos           | Aggregate Videos              |                                                                                              |
| Aggregate Videos         | Aggregate                      | Aggregates video segments                   | Get Videos                  | Merge Videos and Audio         |                                                                                              |
| Merge Videos and Audio   | Merge                         | Combines video segments with audio and images | Aggregate Videos / Upload to Cloudinary | Generate Render JSON        |                                                                                              |
| Generate Render JSON     | HTTP Request                    | Prepares JSON for final video rendering    | Merge Videos and Audio      | Set JSON Variable               |                                                                                              |
| Set JSON Variable        | Set                              | Sets JSON payload for rendering API         | Generate Render JSON        | Send to Creatomate             |                                                                                              |
| Send to Creatomate       | HTTP Request                    | Sends video project to Creatomate for rendering | Set JSON Variable          | Generating Final Video          |                                                                                              |
| Generating Final Video   | Wait                           | Waits for final video rendering completion | Send to Creatomate          | Get Final Video                |                                                                                              |
| Get Final Video          | HTTP Request                    | Retrieves final rendered video              | Generating Final Video      | Merge Video Variables          |                                                                                              |
| Merge Video Variables    | Merge                         | Merges video metadata for approval          | Get Final Video / Aggregate Prompts | Telegram: Approve Final Video |                                                                                              |
| Telegram: Approve Final Video| Telegram                    | Requests user approval for final video       | Merge Video Variables       | If Final Video Approved        |                                                                                              |
| If Final Video Approved  | If                               | Checks final video approval status           | Telegram: Approve Final Video | Convert Video to Base64 / Telegram: Video Declined |                                                                                              |
| Convert Video to Base64  | HTTP Request                    | Converts final video to Base64 for upload    | If Final Video Approved     | Decode Base64 to File          |                                                                                              |
| Decode Base64 to File    | Convert to File                | Converts Base64 string to file format        | Convert Video to Base64     | Upload to YouTube              |                                                                                              |
| Upload to YouTube        | YouTube                       | Uploads video to YouTube channel               | Decode Base64 to File       | Telegram: Video Uploaded       |                                                                                              |
| Telegram: Video Uploaded | Telegram                       | Notifies user of successful video upload      | Upload to YouTube           | -                            |                                                                                              |
| Telegram: Video Declined | Telegram                       | Notifies user if final video was declined      | If Final Video Approved (false branch) | -                            |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node:**  
   - Type: Telegram Trigger  
   - Configure webhook and bot credentials to listen for incoming messages.  

2. **Add Conditional Node "If Message From User":**  
   - Type: If  
   - Condition: Check if incoming Telegram message contains valid user input (e.g., text exists).  
   - Connect Telegram Trigger → If Message From User.  

3. **Add "Set API Keys" Node:**  
   - Type: Set  
   - Manually enter API keys for OpenAI, Cloudinary, YouTube, and any external APIs as variables.  
   - Connect If Message From User → Set API Keys.  
   - Add sticky note: "SET BEFORE STARTING".  

4. **Add "If All API Keys Set" Node:**  
   - Type: If  
   - Condition: Check all required API keys exist (non-empty).  
   - Connect Set API Keys → If All API Keys Set.  

5. **Add "Telegram: API Keys Missing" Node:**  
   - Type: Telegram  
   - Configure to notify user about missing keys.  
   - Connect If All API Keys Set (false output) → Telegram: API Keys Missing.  

6. **Add "Missing API Keys" Node:**  
   - Type: Stop and Error  
   - Connect Telegram: API Keys Missing → Missing API Keys.  

7. **Add "Input Variables" Node:**  
   - Type: Set  
   - Prepare variables for AI prompt input (e.g., user text).  
   - Connect If All API Keys Set (true output) → Input Variables.  

8. **Add "Ideator 🧠" Node:**  
   - Type: OpenAI (LangChain)  
   - Configure to generate video scripts based on input variables.  
   - Connect Input Variables → Ideator 🧠.  

9. **Add "Script" Node:**  
   - Type: Set  
   - Store generated script content.  
   - Connect Ideator 🧠 → Script.  

10. **Add "Convert Script to Audio" Node:**  
    - Type: HTTP Request  
    - Configure for TTS API with script input.  
    - Connect Script → Convert Script to Audio.  

11. **Add "Chunk Script" Node:**  
    - Type: Split Out  
    - Split audio/script if needed for processing.  
    - Connect Convert Script to Audio → Chunk Script.  

12. **Add "Upload to Cloudinary" Node:**  
    - Type: HTTP Request  
    - Upload audio chunks or files to Cloudinary.  
    - Connect Convert Script to Audio and Chunk Script → Upload to Cloudinary.  

13. **Add "Image Prompter 📷" Node:**  
    - Type: OpenAI (LangChain)  
    - Generate image prompts from script/chunks.  
    - Connect Chunk Script → Image Prompter 📷.  

14. **Add "Aggregate Prompts" Node:**  
    - Type: Aggregate  
    - Aggregate image prompts.  
    - Connect Image Prompter 📷 → Aggregate Prompts.  

15. **Add "Request Images" Node:**  
    - Type: HTTP Request  
    - Request image generation from external API.  
    - Connect Image Prompter 📷 → Request Images.  

16. **Add "Generating Images" Node:**  
    - Type: Wait (webhook)  
    - Wait for image generation completion.  
    - Connect Request Images → Generating Images.  

17. **Add "Get Images" Node:**  
    - Type: HTTP Request  
    - Retrieve generated images.  
    - Connect Generating Images → Get Images.  

18. **Add "Request Videos" Node:**  
    - Type: HTTP Request  
    - Request video generation using images/prompts.  
    - Connect Get Images → Request Videos.  

19. **Add "Generating Videos" Node:**  
    - Type: Wait (webhook)  
    - Wait for video generation completion.  
    - Connect Request Videos → Generating Videos.  

20. **Add "Get Videos" Node:**  
    - Type: HTTP Request  
    - Retrieve generated videos.  
    - Connect Generating Videos → Get Videos.  

21. **Add "Aggregate Videos" Node:**  
    - Type: Aggregate  
    - Aggregate multiple video clips.  
    - Connect Get Videos → Aggregate Videos.  

22. **Add "Merge Videos and Audio" Node:**  
    - Type: Merge  
    - Combine aggregated videos with audio and uploaded images.  
    - Connect Aggregate Videos and Upload to Cloudinary → Merge Videos and Audio.  

23. **Add "Generate Render JSON" Node:**  
    - Type: HTTP Request  
    - Prepare JSON config for final video rendering.  
    - Connect Merge Videos and Audio → Generate Render JSON.  

24. **Add "Set JSON Variable" Node:**  
    - Type: Set  
    - Set JSON payload from render generation.  
    - Connect Generate Render JSON → Set JSON Variable.  

25. **Add "Send to Creatomate" Node:**  
    - Type: HTTP Request  
    - Send JSON payload to Creatomate API for rendering.  
    - Connect Set JSON Variable → Send to Creatomate.  

26. **Add "Generating Final Video" Node:**  
    - Type: Wait (webhook)  
    - Wait for final video rendering completion.  
    - Connect Send to Creatomate → Generating Final Video.  

27. **Add "Get Final Video" Node:**  
    - Type: HTTP Request  
    - Retrieve final rendered video.  
    - Connect Generating Final Video → Get Final Video.  

28. **Add "Merge Video Variables" Node:**  
    - Type: Merge  
    - Consolidate video metadata and prompts.  
    - Connect Get Final Video and Aggregate Prompts → Merge Video Variables.  

29. **Add "Telegram: Approve Final Video" Node:**  
    - Type: Telegram  
    - Request user approval for final video.  
    - Connect Merge Video Variables → Telegram: Approve Final Video.  

30. **Add "If Final Video Approved" Node:**  
    - Type: If  
    - Check user approval status.  
    - Connect Telegram: Approve Final Video → If Final Video Approved.  

31. **Add "Convert Video to Base64" Node:**  
    - Type: HTTP Request  
    - Convert final video to base64 for upload.  
    - Connect If Final Video Approved (true) → Convert Video to Base64.  

32. **Add "Decode Base64 to File" Node:**  
    - Type: Convert to File  
    - Decode base64 string to file format.  
    - Connect Convert Video to Base64 → Decode Base64 to File.  

33. **Add "Upload to YouTube" Node:**  
    - Type: YouTube  
    - Upload video file to YouTube channel.  
    - Connect Decode Base64 to File → Upload to YouTube.  

34. **Add "Telegram: Video Uploaded" Node:**  
    - Type: Telegram  
    - Notify user video was uploaded successfully.  
    - Connect Upload to YouTube → Telegram: Video Uploaded.  

35. **Add "Telegram: Video Declined" Node:**  
    - Type: Telegram  
    - Notify user if video was declined.  
    - Connect If Final Video Approved (false) → Telegram: Video Declined.  

36. **Add Idea Approval Flow:**  
    - Add "Telegram: Approve Idea" node to request idea approval.  
    - Add "If Idea Approved" node to check approval.  
    - Add "Idea Denied" node to handle denial.  
    - Connect Discuss Ideas 💡 → If No Video Idea → Telegram: Approve Idea → If Idea Approved → Telegram: Processing Started → Set API Keys (loop back).  

37. **Add AI Conversation Memory and Output Parsing:**  
    - Add "Structure Model Output" and "Track Conversation Memory" nodes connected to Discuss Ideas 💡 to maintain context and parse outputs.  

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                               |
|--------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| "SET BEFORE STARTING" note on Set API Keys emphasizes manual API key setup before running.        | Node: Set API Keys                                            |
| Workflow integrates multiple external APIs: OpenAI for language, Cloudinary for media hosting, Creatomate for video rendering, YouTube for publishing. | Integration overview                                          |
| Telegram nodes require bot setup with webhook URL configured for n8n instance.                     | Telegram Trigger and Telegram notification nodes              |
| Uses LangChain nodes for AI agent and output parsing, requiring n8n version supporting LangChain nodes (v1.7+). | Version-specific requirement                                  |
| Video generation includes asynchronous wait nodes linked to webhooks, ensuring API processing completion before proceeding. | Generating Images, Generating Videos, Generating Final Video  |
| For detailed video rendering, Creatomate API usage is assumed; refer to Creatomate documentation for JSON payload structure. | Video rendering integration                                   |
| YouTube node requires OAuth2 credentials for channel upload permissions.                          | Upload to YouTube node credential setup                        |

---

This document provides a detailed, stepwise understanding of the "Build & Sell AI Automations and Agents" workflow, enabling effective reproduction, modification, and troubleshooting by developers or AI automation agents.