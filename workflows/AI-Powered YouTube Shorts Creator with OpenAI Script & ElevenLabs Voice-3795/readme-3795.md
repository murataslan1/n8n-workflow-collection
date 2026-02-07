AI-Powered YouTube Shorts Creator with OpenAI Script & ElevenLabs Voice

https://n8nworkflows.xyz/workflows/ai-powered-youtube-shorts-creator-with-openai-script---elevenlabs-voice-3795


# AI-Powered YouTube Shorts Creator with OpenAI Script & ElevenLabs Voice

### 1. Workflow Overview

This workflow automates the creation of engaging YouTube and TikTok Shorts videos using AI-powered content generation, voice synthesis, and video assembly tools. It targets content creators, marketing agencies, and business owners who want to produce short-form videos quickly without manual editing or technical expertise.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Validation:** Receives video ideas from users via Telegram, validates input, and manages conversation memory.
- **1.2 Idea Discussion & Approval:** Uses OpenAI to generate and discuss video ideas, then routes for user approval or denial.
- **1.3 Script Generation & Audio Conversion:** Generates a detailed video script from the approved idea, converts the script into AI-generated voiceover audio.
- **1.4 Visual Content Generation:** Creates image prompts, requests images and videos from external APIs, and aggregates media assets.
- **1.5 Video Assembly & Rendering:** Merges audio and video assets, sends data to Creatomate for video rendering, and waits for the final video.
- **1.6 Final Approval & Publishing:** Sends the final video for user approval, converts video to YouTube-compatible format, uploads to YouTube, and notifies the user.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Validation

- **Overview:**  
  This block captures user input via Telegram, checks if the message is valid, and manages conversation memory for context retention.

- **Nodes Involved:**  
  - Telegram Trigger  
  - If Message From User  
  - Track Conversation Memory  

- **Node Details:**

  - **Telegram Trigger**  
    - Type: Telegram Trigger  
    - Role: Entry point capturing incoming Telegram messages.  
    - Config: Uses a webhook ID to listen for messages.  
    - Inputs: Telegram messages from users.  
    - Outputs: Passes messages to conditional checks.  
    - Edge Cases: Telegram API downtime, webhook misconfiguration.

  - **If Message From User**  
    - Type: If  
    - Role: Checks if incoming Telegram message contains valid user input.  
    - Config: Conditional logic based on message content presence.  
    - Inputs: Telegram Trigger output.  
    - Outputs: Routes valid messages to AI discussion, invalid to no further processing.  
    - Edge Cases: Empty messages, unsupported message types.

  - **Track Conversation Memory**  
    - Type: LangChain Memory Buffer Window  
    - Role: Maintains conversation context for AI interactions.  
    - Config: Buffer window size to retain recent messages.  
    - Inputs: Valid user messages.  
    - Outputs: Provides context to AI discussion node.  
    - Edge Cases: Memory overflow, context loss.

---

#### 2.2 Idea Discussion & Approval

- **Overview:**  
  Uses OpenAI models to generate and discuss video ideas based on user input, then routes the workflow depending on user approval or denial.

- **Nodes Involved:**  
  - Discuss Ideas 💡 (LangChain Agent)  
  - Structure Model Output (LangChain Output Parser Structured)  
  - If No Video Idea (If)  
  - Telegram: Conversational Response  
  - Telegram: Approve Idea  
  - If Idea Approved (If)  
  - Idea Denied (Set)  
  - Telegram: Processing Started  

- **Node Details:**

  - **Discuss Ideas 💡**  
    - Type: LangChain Agent  
    - Role: AI agent that generates and refines video ideas.  
    - Config: Uses OpenAI chat model with conversation memory.  
    - Inputs: User message and conversation context.  
    - Outputs: Structured idea data.  
    - Edge Cases: AI model rate limits, unexpected output format.

  - **Structure Model Output**  
    - Type: LangChain Output Parser Structured  
    - Role: Parses AI output into structured JSON for downstream use.  
    - Inputs: AI raw output.  
    - Outputs: Structured idea data.  
    - Edge Cases: Parsing errors if AI output format changes.

  - **If No Video Idea**  
    - Type: If  
    - Role: Checks if AI generated a valid video idea.  
    - Inputs: Structured output.  
    - Outputs: Routes to approval or conversational response.  
    - Edge Cases: False negatives due to parsing issues.

  - **Telegram: Conversational Response**  
    - Type: Telegram  
    - Role: Sends a message back to user if no valid idea is generated.  
    - Inputs: Negative branch from If No Video Idea.  
    - Outputs: User notification.  
    - Edge Cases: Telegram API errors.

  - **Telegram: Approve Idea**  
    - Type: Telegram  
    - Role: Sends approval prompt to user for generated idea.  
    - Inputs: Positive branch from If No Video Idea.  
    - Outputs: User approval request.  
    - Edge Cases: Message delivery failure.

  - **If Idea Approved**  
    - Type: If  
    - Role: Checks user response to idea approval prompt.  
    - Inputs: Telegram approval response.  
    - Outputs: Routes to processing or denial.  
    - Edge Cases: User non-response or ambiguous input.

  - **Idea Denied**  
    - Type: Set  
    - Role: Sets variables or flags when idea is denied.  
    - Inputs: Negative branch from If Idea Approved.  
    - Outputs: Loops back to Discuss Ideas for new suggestions.  
    - Edge Cases: Infinite loops if user keeps denying.

  - **Telegram: Processing Started**  
    - Type: Telegram  
    - Role: Notifies user that video processing has started after idea approval.  
    - Inputs: Positive branch from If Idea Approved.  
    - Outputs: User notification.  
    - Edge Cases: Telegram API errors.

---

#### 2.3 Script Generation & Audio Conversion

- **Overview:**  
  Generates a detailed video script from the approved idea using OpenAI, then converts the script text into AI-generated voiceover audio via ElevenLabs.

- **Nodes Involved:**  
  - Input Variables (Set)  
  - Ideator 🧠 (LangChain OpenAI)  
  - Script (Set)  
  - Convert Script to Audio (HTTP Request)  
  - Chunk Script (HTTP Request)  
  - Split Out (Split Out)  
  - Upload to Cloudinary (HTTP Request)  

- **Node Details:**

  - **Input Variables**  
    - Type: Set  
    - Role: Prepares input variables for script generation.  
    - Inputs: Approved idea data.  
    - Outputs: Variables for AI script generation.  
    - Edge Cases: Missing or malformed input data.

  - **Ideator 🧠**  
    - Type: LangChain OpenAI  
    - Role: Generates a detailed script optimized for engagement and SEO.  
    - Inputs: Input Variables.  
    - Outputs: Script text.  
    - Edge Cases: API rate limits, generation errors.

  - **Script**  
    - Type: Set  
    - Role: Stores the generated script for further processing.  
    - Inputs: Ideator output.  
    - Outputs: Script text for audio conversion.  
    - Edge Cases: Empty or invalid script.

  - **Convert Script to Audio**  
    - Type: HTTP Request  
    - Role: Sends script text to ElevenLabs API to generate voiceover audio.  
    - Inputs: Script text.  
    - Outputs: Audio file or base64 audio data.  
    - Edge Cases: API authentication errors, network timeouts.

  - **Chunk Script**  
    - Type: HTTP Request  
    - Role: Splits long script into manageable chunks for processing.  
    - Inputs: Audio or script data.  
    - Outputs: Script chunks.  
    - Edge Cases: Chunking errors, data truncation.

  - **Split Out**  
    - Type: Split Out  
    - Role: Splits chunked script into individual parts for parallel processing.  
    - Inputs: Chunk Script output.  
    - Outputs: Individual script chunks.  
    - Edge Cases: Empty chunks, splitting errors.

  - **Upload to Cloudinary**  
    - Type: HTTP Request  
    - Role: Uploads audio files to Cloudinary for storage and CDN delivery.  
    - Inputs: Audio files from Convert Script to Audio or Chunk Script.  
    - Outputs: Cloudinary URLs.  
    - Edge Cases: Upload failures, API limits.

---

#### 2.4 Visual Content Generation

- **Overview:**  
  Generates image prompts from the script, requests images and videos from external APIs, and aggregates media assets for video assembly.

- **Nodes Involved:**  
  - Image Prompter 📷 (LangChain OpenAI)  
  - Aggregate Prompts (Aggregate)  
  - Request Images (HTTP Request)  
  - Generating Images (Wait)  
  - Get Images (HTTP Request)  
  - Request Videos (HTTP Request)  
  - Generating Videos (Wait)  
  - Get Videos (HTTP Request)  
  - Aggregate Videos (Aggregate)  

- **Node Details:**

  - **Image Prompter 📷**  
    - Type: LangChain OpenAI  
    - Role: Generates image prompts based on script content.  
    - Inputs: Script chunks or full script.  
    - Outputs: Image prompt texts.  
    - Edge Cases: AI generation errors.

  - **Aggregate Prompts**  
    - Type: Aggregate  
    - Role: Combines multiple image prompts into a single dataset.  
    - Inputs: Image Prompter outputs.  
    - Outputs: Aggregated prompt list.  
    - Edge Cases: Empty aggregation.

  - **Request Images**  
    - Type: HTTP Request  
    - Role: Calls external image generation API (e.g., Replicate) with prompts.  
    - Inputs: Aggregated prompts.  
    - Outputs: Image generation job IDs or URLs.  
    - Edge Cases: API errors, rate limits.

  - **Generating Images**  
    - Type: Wait  
    - Role: Waits for image generation to complete asynchronously.  
    - Inputs: Request Images output.  
    - Outputs: Triggers Get Images after wait.  
    - Edge Cases: Timeout if generation takes too long.

  - **Get Images**  
    - Type: HTTP Request  
    - Role: Retrieves generated images from API.  
    - Inputs: Generating Images trigger.  
    - Outputs: Image URLs.  
    - Edge Cases: Retrieval failures.

  - **Request Videos**  
    - Type: HTTP Request  
    - Role: Requests relevant video clips from external API based on prompts.  
    - Inputs: Aggregated prompts or script data.  
    - Outputs: Video generation job IDs or URLs.  
    - Edge Cases: API errors.

  - **Generating Videos**  
    - Type: Wait  
    - Role: Waits for video generation to complete.  
    - Inputs: Request Videos output.  
    - Outputs: Triggers Get Videos.  
    - Edge Cases: Timeout.

  - **Get Videos**  
    - Type: HTTP Request  
    - Role: Retrieves generated video clips.  
    - Inputs: Generating Videos output.  
    - Outputs: Video clip URLs.  
    - Edge Cases: Retrieval errors.

  - **Aggregate Videos**  
    - Type: Aggregate  
    - Role: Combines multiple video clips into a single collection for merging.  
    - Inputs: Get Videos output.  
    - Outputs: Aggregated video list.  
    - Edge Cases: Empty aggregation.

---

#### 2.5 Video Assembly & Rendering

- **Overview:**  
  Merges audio and video assets, generates a JSON render specification, sends it to Creatomate for video assembly, and waits for the final video.

- **Nodes Involved:**  
  - Merge Videos and Audio (Merge)  
  - Upload to Cloudinary (HTTP Request)  
  - Generate Render JSON (HTTP Request)  
  - Set JSON Variable (Set)  
  - Send to Creatomate (HTTP Request)  
  - Generating Final Video (Wait)  
  - Get Final Video (HTTP Request)  
  - Merge Video Variables (Merge)  

- **Node Details:**

  - **Merge Videos and Audio**  
    - Type: Merge  
    - Role: Combines video clips and audio files into one dataset for rendering.  
    - Inputs: Aggregated videos and audio URLs.  
    - Outputs: Merged media data.  
    - Edge Cases: Mismatched counts, missing files.

  - **Upload to Cloudinary**  
    - Type: HTTP Request  
    - Role: Uploads merged media files to Cloudinary for hosting.  
    - Inputs: Audio or video files.  
    - Outputs: Cloudinary URLs.  
    - Edge Cases: Upload failures.

  - **Generate Render JSON**  
    - Type: HTTP Request  
    - Role: Creates a JSON specification for Creatomate video rendering API.  
    - Inputs: Merged media data.  
    - Outputs: Render JSON.  
    - Edge Cases: JSON formatting errors.

  - **Set JSON Variable**  
    - Type: Set  
    - Role: Stores the render JSON for sending to Creatomate.  
    - Inputs: Generate Render JSON output.  
    - Outputs: JSON data for video assembly.  
    - Edge Cases: Data loss.

  - **Send to Creatomate**  
    - Type: HTTP Request  
    - Role: Sends render JSON to Creatomate API to start video rendering.  
    - Inputs: Render JSON.  
    - Outputs: Video rendering job ID or status.  
    - Edge Cases: API errors, authentication failures.

  - **Generating Final Video**  
    - Type: Wait  
    - Role: Waits for Creatomate to finish rendering the video.  
    - Inputs: Send to Creatomate output.  
    - Outputs: Triggers Get Final Video.  
    - Edge Cases: Timeout, rendering errors.

  - **Get Final Video**  
    - Type: HTTP Request  
    - Role: Retrieves the final rendered video from Creatomate or storage.  
    - Inputs: Generating Final Video output.  
    - Outputs: Final video file or URL.  
    - Edge Cases: Retrieval failures.

  - **Merge Video Variables**  
    - Type: Merge  
    - Role: Combines final video data with other variables for approval and publishing.  
    - Inputs: Get Final Video output and other metadata.  
    - Outputs: Complete video package.  
    - Edge Cases: Data mismatch.

---

#### 2.6 Final Approval & Publishing

- **Overview:**  
  Sends the final video to the user for approval, converts the video to a YouTube-compatible base64 format, uploads it to YouTube, and notifies the user upon completion.

- **Nodes Involved:**  
  - Telegram: Approve Final Video  
  - If Final Video Approved (If)  
  - Convert Video to Base64 (HTTP Request)  
  - Decode Base64 to File (Convert To File)  
  - Upload to YouTube (YouTube)  
  - Telegram: Video Uploaded  
  - Telegram: Video Declined  

- **Node Details:**

  - **Telegram: Approve Final Video**  
    - Type: Telegram  
    - Role: Sends final video preview to user for approval.  
    - Inputs: Merged video variables.  
    - Outputs: User approval response.  
    - Edge Cases: Message delivery failure.

  - **If Final Video Approved**  
    - Type: If  
    - Role: Checks if user approved the final video.  
    - Inputs: Telegram approval response.  
    - Outputs: Routes to upload or decline.  
    - Edge Cases: Ambiguous user input.

  - **Convert Video to Base64**  
    - Type: HTTP Request  
    - Role: Converts video file to base64 format required for YouTube upload.  
    - Inputs: Final video file or URL.  
    - Outputs: Base64 encoded video.  
    - Edge Cases: Conversion failures.

  - **Decode Base64 to File**  
    - Type: Convert To File  
    - Role: Decodes base64 video back to file format for upload.  
    - Inputs: Base64 video data.  
    - Outputs: Video file.  
    - Edge Cases: Decoding errors.

  - **Upload to YouTube**  
    - Type: YouTube  
    - Role: Uploads the final video file to YouTube channel.  
    - Inputs: Video file.  
    - Outputs: Upload confirmation.  
    - Edge Cases: OAuth token expiration, upload failures.

  - **Telegram: Video Uploaded**  
    - Type: Telegram  
    - Role: Notifies user that video has been successfully uploaded.  
    - Inputs: Upload confirmation.  
    - Outputs: User notification.  
    - Edge Cases: Message delivery failure.

  - **Telegram: Video Declined**  
    - Type: Telegram  
    - Role: Notifies user if final video was declined.  
    - Inputs: Negative branch from If Final Video Approved.  
    - Outputs: User notification.  
    - Edge Cases: Message delivery failure.

---

### 3. Summary Table

| Node Name                  | Node Type                         | Functional Role                              | Input Node(s)                  | Output Node(s)                   | Sticky Note                          |
|----------------------------|----------------------------------|----------------------------------------------|-------------------------------|---------------------------------|------------------------------------|
| Telegram Trigger            | Telegram Trigger                 | Entry point for Telegram messages             | —                             | If Message From User             |                                    |
| If Message From User        | If                              | Validates incoming Telegram message           | Telegram Trigger              | Discuss Ideas 💡                 |                                    |
| Track Conversation Memory   | LangChain Memory Buffer Window  | Maintains conversation context                | If Message From User          | Discuss Ideas 💡                 |                                    |
| Discuss Ideas 💡            | LangChain Agent                 | Generates and discusses video ideas           | Track Conversation Memory     | If No Video Idea                |                                    |
| Structure Model Output      | LangChain Output Parser Structured | Parses AI output into structured JSON         | Discuss Ideas 💡              | If No Video Idea                |                                    |
| If No Video Idea            | If                              | Checks if AI generated a valid idea           | Structure Model Output        | Telegram: Conversational Response, Telegram: Approve Idea |                                    |
| Telegram: Conversational Response | Telegram                     | Sends message if no valid idea generated      | If No Video Idea              | —                               |                                    |
| Telegram: Approve Idea      | Telegram                        | Sends approval prompt for generated idea      | If No Video Idea              | If Idea Approved               |                                    |
| If Idea Approved            | If                              | Checks user approval of idea                   | Telegram: Approve Idea        | Telegram: Processing Started, Idea Denied |                                    |
| Idea Denied                | Set                             | Sets flags when idea denied                     | If Idea Approved             | Discuss Ideas 💡                |                                    |
| Telegram: Processing Started | Telegram                        | Notifies user that processing started          | If Idea Approved             | Set API Keys                   |                                    |
| Set API Keys               | Set                             | Prepares API keys for subsequent calls         | Telegram: Processing Started | If All API Keys Set            | SET BEFORE STARTING                |
| If All API Keys Set        | If                              | Checks if all required API keys are set        | Set API Keys                 | Input Variables, Telegram: API Keys Missing |                                    |
| Telegram: API Keys Missing | Telegram                        | Notifies user of missing API keys              | If All API Keys Set          | Missing API Keys               |                                    |
| Missing API Keys           | Stop and Error                 | Stops workflow if API keys missing              | Telegram: API Keys Missing   | —                             |                                    |
| Input Variables            | Set                             | Sets variables for script generation            | If All API Keys Set          | Ideator 🧠                    |                                    |
| Ideator 🧠                 | LangChain OpenAI               | Generates detailed video script                 | Input Variables              | Script                        |                                    |
| Script                    | Set                             | Stores generated script                          | Ideator 🧠                   | Convert Script to Audio        |                                    |
| Convert Script to Audio    | HTTP Request                   | Converts script text to voiceover audio         | Script                       | Chunk Script, Upload to Cloudinary |                                    |
| Chunk Script              | HTTP Request                   | Splits script into chunks for processing        | Convert Script to Audio      | Split Out                    |                                    |
| Split Out                 | Split Out                      | Splits chunked script into individual parts     | Chunk Script                 | Image Prompter 📷             |                                    |
| Image Prompter 📷          | LangChain OpenAI               | Generates image prompts from script chunks      | Split Out                   | Aggregate Prompts, Request Images |                                    |
| Aggregate Prompts         | Aggregate                      | Aggregates image prompts                          | Image Prompter 📷            | Merge Video Variables (branch 1) |                                    |
| Request Images            | HTTP Request                   | Requests images from external API                | Aggregate Prompts            | Generating Images             |                                    |
| Generating Images         | Wait                          | Waits for image generation completion            | Request Images               | Get Images                   |                                    |
| Get Images                | HTTP Request                   | Retrieves generated images                        | Generating Images            | Request Videos               |                                    |
| Request Videos            | HTTP Request                   | Requests video clips from external API           | Get Images                  | Generating Videos            |                                    |
| Generating Videos         | Wait                          | Waits for video generation completion             | Request Videos              | Get Videos                  |                                    |
| Get Videos                | HTTP Request                   | Retrieves generated video clips                   | Generating Videos           | Aggregate Videos            |                                    |
| Aggregate Videos          | Aggregate                      | Aggregates video clips                             | Get Videos                  | Merge Videos and Audio       |                                    |
| Merge Videos and Audio    | Merge                         | Combines video clips and audio files              | Aggregate Videos, Upload to Cloudinary | Generate Render JSON, Upload to Cloudinary (branch 2) |                                    |
| Upload to Cloudinary      | HTTP Request                   | Uploads media files to Cloudinary                  | Convert Script to Audio, Merge Videos and Audio | Merge Videos and Audio (branch 2) |                                    |
| Generate Render JSON      | HTTP Request                   | Creates JSON spec for video rendering              | Merge Videos and Audio       | Set JSON Variable            |                                    |
| Set JSON Variable         | Set                             | Stores render JSON for Creatomate                   | Generate Render JSON         | Send to Creatomate           |                                    |
| Send to Creatomate        | HTTP Request                   | Sends render JSON to Creatomate API                 | Set JSON Variable            | Generating Final Video       |                                    |
| Generating Final Video    | Wait                          | Waits for Creatomate to finish rendering            | Send to Creatomate           | Get Final Video              |                                    |
| Get Final Video           | HTTP Request                   | Retrieves final rendered video                       | Generating Final Video       | Merge Video Variables        |                                    |
| Merge Video Variables     | Merge                         | Combines final video data with metadata              | Get Final Video, Aggregate Prompts | Telegram: Approve Final Video |                                    |
| Telegram: Approve Final Video | Telegram                     | Sends final video preview for user approval          | Merge Video Variables        | If Final Video Approved      |                                    |
| If Final Video Approved   | If                              | Checks if user approved final video                   | Telegram: Approve Final Video | Convert Video to Base64, Telegram: Video Declined |                                    |
| Convert Video to Base64   | HTTP Request                   | Converts video file to base64 for YouTube upload       | If Final Video Approved      | Decode Base64 to File        |                                    |
| Decode Base64 to File     | Convert To File                | Decodes base64 video to file format                     | Convert Video to Base64      | Upload to YouTube            |                                    |
| Upload to YouTube         | YouTube                       | Uploads video to YouTube channel                          | Decode Base64 to File        | Telegram: Video Uploaded     |                                    |
| Telegram: Video Uploaded  | Telegram                      | Notifies user of successful video upload                 | Upload to YouTube            | —                           |                                    |
| Telegram: Video Declined  | Telegram                      | Notifies user if final video was declined                  | If Final Video Approved      | —                           |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger node**  
   - Type: Telegram Trigger  
   - Configure webhook with Telegram bot token and webhook ID.  
   - Set to listen for new messages.

2. **Add If node "If Message From User"**  
   - Condition: Check if incoming message text exists and is not empty.  
   - Connect Telegram Trigger output to this node.

3. **Add LangChain Memory Buffer Window node "Track Conversation Memory"**  
   - Configure buffer size (e.g., last 10 messages).  
   - Connect "If Message From User" positive branch to this node.

4. **Add LangChain Agent node "Discuss Ideas 💡"**  
   - Use OpenAI chat model credentials.  
   - Configure prompt to generate video ideas based on user input and conversation memory.  
   - Connect "Track Conversation Memory" output here.

5. **Add LangChain Output Parser Structured node "Structure Model Output"**  
   - Configure to parse AI output into structured JSON with fields like idea text, approval status.  
   - Connect "Discuss Ideas 💡" output here.

6. **Add If node "If No Video Idea"**  
   - Condition: Check if structured output contains a valid idea.  
   - Connect "Structure Model Output" output here.

7. **Add Telegram node "Telegram: Conversational Response"**  
   - Configure to send message if no valid idea generated.  
   - Connect negative branch of "If No Video Idea" here.

8. **Add Telegram node "Telegram: Approve Idea"**  
   - Configure to send idea approval prompt to user.  
   - Connect positive branch of "If No Video Idea" here.

9. **Add If node "If Idea Approved"**  
   - Condition: Check user response to approval prompt.  
   - Connect "Telegram: Approve Idea" output here.

10. **Add Set node "Idea Denied"**  
    - Configure to set flags or variables indicating denial.  
    - Connect negative branch of "If Idea Approved" here.

11. **Connect "Idea Denied" output back to "Discuss Ideas 💡"**  
    - To allow new idea generation.

12. **Add Telegram node "Telegram: Processing Started"**  
    - Configure to notify user processing has started.  
    - Connect positive branch of "If Idea Approved" here.

13. **Add Set node "Set API Keys"**  
    - Configure to set all required API keys (OpenAI, ElevenLabs, Cloudinary, Creatomate).  
    - Connect "Telegram: Processing Started" output here.

14. **Add If node "If All API Keys Set"**  
    - Condition: Verify all API keys are present and valid.  
    - Connect "Set API Keys" output here.

15. **Add Telegram node "Telegram: API Keys Missing"**  
    - Notify user if keys are missing.  
    - Connect negative branch of "If All API Keys Set" here.

16. **Add Stop and Error node "Missing API Keys"**  
    - Stops workflow if keys missing.  
    - Connect "Telegram: API Keys Missing" output here.

17. **Add Set node "Input Variables"**  
    - Prepare variables for script generation from approved idea.  
    - Connect positive branch of "If All API Keys Set" here.

18. **Add LangChain OpenAI node "Ideator 🧠"**  
    - Configure to generate detailed video script from input variables.  
    - Connect "Input Variables" output here.

19. **Add Set node "Script"**  
    - Store generated script text.  
    - Connect "Ideator 🧠" output here.

20. **Add HTTP Request node "Convert Script to Audio"**  
    - Configure to call ElevenLabs API with script text to generate voiceover audio.  
    - Connect "Script" output here.

21. **Add HTTP Request node "Chunk Script"**  
    - Configure to split script/audio into chunks if needed.  
    - Connect "Convert Script to Audio" output here.

22. **Add Split Out node "Split Out"**  
    - Splits chunked script into individual parts.  
    - Connect "Chunk Script" output here.

23. **Add LangChain OpenAI node "Image Prompter 📷"**  
    - Generate image prompts from script chunks.  
    - Connect "Split Out" output here.

24. **Add Aggregate node "Aggregate Prompts"**  
    - Aggregate image prompts into a list.  
    - Connect "Image Prompter 📷" output here.

25. **Add HTTP Request node "Request Images"**  
    - Call image generation API with prompts.  
    - Connect "Aggregate Prompts" output here.

26. **Add Wait node "Generating Images"**  
    - Wait for image generation completion.  
    - Connect "Request Images" output here.

27. **Add HTTP Request node "Get Images"**  
    - Retrieve generated images.  
    - Connect "Generating Images" output here.

28. **Add HTTP Request node "Request Videos"**  
    - Request video clips based on prompts or images.  
    - Connect "Get Images" output here.

29. **Add Wait node "Generating Videos"**  
    - Wait for video generation completion.  
    - Connect "Request Videos" output here.

30. **Add HTTP Request node "Get Videos"**  
    - Retrieve generated videos.  
    - Connect "Generating Videos" output here.

31. **Add Aggregate node "Aggregate Videos"**  
    - Aggregate video clips.  
    - Connect "Get Videos" output here.

32. **Add Merge node "Merge Videos and Audio"**  
    - Merge aggregated videos and audio files.  
    - Connect "Aggregate Videos" and "Upload to Cloudinary" outputs here.

33. **Add HTTP Request node "Upload to Cloudinary"**  
    - Upload audio or video files to Cloudinary.  
    - Connect "Convert Script to Audio" and "Merge Videos and Audio" outputs here.

34. **Add HTTP Request node "Generate Render JSON"**  
    - Create JSON spec for Creatomate video rendering.  
    - Connect "Merge Videos and Audio" output here.

35. **Add Set node "Set JSON Variable"**  
    - Store render JSON.  
    - Connect "Generate Render JSON" output here.

36. **Add HTTP Request node "Send to Creatomate"**  
    - Send render JSON to Creatomate API.  
    - Connect "Set JSON Variable" output here.

37. **Add Wait node "Generating Final Video"**  
    - Wait for Creatomate rendering.  
    - Connect "Send to Creatomate" output here.

38. **Add HTTP Request node "Get Final Video"**  
    - Retrieve final video file.  
    - Connect "Generating Final Video" output here.

39. **Add Merge node "Merge Video Variables"**  
    - Combine final video with metadata.  
    - Connect "Get Final Video" and "Aggregate Prompts" outputs here.

40. **Add Telegram node "Telegram: Approve Final Video"**  
    - Send final video preview for user approval.  
    - Connect "Merge Video Variables" output here.

41. **Add If node "If Final Video Approved"**  
    - Check user approval response.  
    - Connect "Telegram: Approve Final Video" output here.

42. **Add HTTP Request node "Convert Video to Base64"**  
    - Convert video file to base64 for YouTube upload.  
    - Connect positive branch of "If Final Video Approved" here.

43. **Add Convert To File node "Decode Base64 to File"**  
    - Decode base64 video to file.  
    - Connect "Convert Video to Base64" output here.

44. **Add YouTube node "Upload to YouTube"**  
    - Upload video file to YouTube channel.  
    - Connect "Decode Base64 to File" output here.

45. **Add Telegram node "Telegram: Video Uploaded"**  
    - Notify user of successful upload.  
    - Connect "Upload to YouTube" output here.

46. **Add Telegram node "Telegram: Video Declined"**  
    - Notify user if video declined.  
    - Connect negative branch of "If Final Video Approved" here.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                     |
|-----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Workflow automates YouTube and TikTok Shorts creation with AI-generated scripts, voice, and visuals | Workflow description and use cases                                                               |
| Setup requires API keys for OpenAI, ElevenLabs, Cloudinary, Creatomate                              | Credentials setup is mandatory before running workflow                                             |
| Video tutorial available for guided setup                                                          | Refer to the original project or documentation for tutorial links                                 |
| Uses LangChain nodes for AI conversation, memory, and output parsing                               | Requires n8n LangChain integration and compatible OpenAI credentials                              |
| Cloudinary used for media hosting and CDN delivery                                                 | Ensure Cloudinary account and API keys are configured                                            |
| Creatomate API used for video rendering                                                            | Creatomate account and API keys required                                                         |
| Telegram bot integration for user interaction and notifications                                    | Telegram bot token and webhook setup required                                                    |
| YouTube node requires OAuth2 credentials for channel upload                                       | Configure YouTube OAuth2 credentials with proper scopes                                          |

---

This document provides a detailed, structured reference for the AI-Powered YouTube Shorts Creator workflow, enabling advanced users and AI agents to understand, reproduce, and modify the workflow effectively.