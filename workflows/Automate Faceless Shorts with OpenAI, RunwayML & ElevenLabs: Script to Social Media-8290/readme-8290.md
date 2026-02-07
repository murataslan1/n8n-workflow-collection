Automate Faceless Shorts with OpenAI, RunwayML & ElevenLabs: Script to Social Media

https://n8nworkflows.xyz/workflows/automate-faceless-shorts-with-openai--runwayml---elevenlabs--script-to-social-media-8290


# Automate Faceless Shorts with OpenAI, RunwayML & ElevenLabs: Script to Social Media

### 1. Workflow Overview

This n8n workflow automates the creation and publishing of faceless short videos for social media platforms using AI and cloud services. Its primary purpose is to transform video scripts into fully rendered videos with AI-generated images, audio narration, background sound, captions, and then publish the final outputs to multiple social media channels. The workflow targets creators and marketers seeking to automate video content generation and distribution efficiently.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Script Generation:** Intake of initial video script requests, filtering, and AI-powered script writing.
- **1.2 Scene and Image Generation:** Breaking scripts into scenes, generating image prompts, and producing images via AI.
- **1.3 Audio Generation:** Creating audio narration and background sound using text-to-speech and sound prompt generation.
- **1.4 Video Rendering and Captioning:** Combining scenes, images, and audio to render videos, adding captions, and managing video URLs.
- **1.5 Upload and Publishing:** Uploading final videos and assets to Google Drive and publishing to social media channels.
- **1.6 Status Updates and Control Flow:** Managing status updates in Google Sheets and controlling workflow loops and waits to handle asynchronous operations.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception and Script Generation

**Overview:**  
This block receives input requests (likely via webhook), filters them, and uses AI models to generate video scripts based on structured prompts. It also parses AI outputs for structured responses.

**Nodes Involved:**  
- Webhook  
- Filter  
- Filter1  
- Write Video Script (LangChain Agent)  
- Structured Output Parser  
- Youtube shorts (Google Sheets)  
- Calculator Code (LangChain Tool)  
- Sticky Note7  
- Sticky Note  
- Sticky Note1  
- Sticky Note8

**Node Details:**

- **Webhook**  
  - Type: Webhook trigger  
  - Role: Entry point for requests triggering the workflow  
  - Config: Listens for HTTP requests at a specific webhook URL  
  - Inputs: External HTTP calls  
  - Outputs: Splits flow to Filter and Filter1  
  - Edge Cases: Missing or malformed requests, authentication if any  
- **Filter**  
  - Type: Filter node  
  - Role: Conditions to filter incoming requests for script generation  
  - Config: Custom expression to allow only valid inputs  
  - Inputs: From Webhook  
  - Outputs: Passes valid data to Write Video Script node  
  - Edge Cases: Filtering logic errors or unexpected input data  
- **Filter1**  
  - Type: Filter node  
  - Role: Secondary filtering for alternative logic, leading to scene array processing  
  - Inputs: From Webhook  
  - Outputs: Passes filtered data to All_scenes_to_array  
- **Write Video Script (LangChain Agent)**  
  - Type: AI agent node using LangChain framework  
  - Role: Generates video script based on input and tools  
  - Config: Utilizes Calculator Code as an AI tool for enhanced logic  
  - Inputs: From Filter  
  - Outputs: Sends generated script to Youtube shorts node  
  - Edge Cases: AI model errors, rate limits, incorrect prompt handling  
- **Structured Output Parser**  
  - Type: Output parser for LangChain AI responses  
  - Role: Parses AI output to structured format for further use  
  - Inputs: AI output (not directly shown but linked to Write Video Script)  
  - Outputs: Structured data feeding into Write Video Script  
- **Youtube shorts (Google Sheets)**  
  - Type: Google Sheets node  
  - Role: Stores video scripts or metadata in a spreadsheet  
  - Inputs: From Write Video Script  
  - Outputs: Not explicitly connected further in this block  
- **Calculator Code (LangChain Tool)**  
  - Type: AI tool node for code/calculation assistance  
  - Role: Used by Write Video Script to perform calculations or logic during script generation  
  - Inputs/Outputs: Connected as a tool input to Write Video Script  
- **Sticky Notes (7, 0, 1, 8)**  
  - Type: Sticky Note  
  - Role: Provide visual annotations or documentation on the canvas for this block  
  - Inputs/Outputs: None, purely for reference  

---

#### 2.2 Scene and Image Generation

**Overview:**  
This block takes the generated scripts, breaks them into individual scenes, generates image prompts via an AI agent, and converts these prompts to images using an AI image generation API.

**Nodes Involved:**  
- All_scenes_to_array (Code)  
- Split Out  
- Image Prompt Generator (LangChain Agent)  
- Generate Image1 (HTTP Request)  
- Convert Base64 String to Binary File1  
- Upload to Drive2 (Google Drive)  
- Image Link: WebView Link (Set)  
- Loop Over Items (SplitInBatches)  
- Sticky Note3  
- Sticky Note5

**Node Details:**

- **All_scenes_to_array (Code)**  
  - Type: JavaScript Code node  
  - Role: Converts scenes from script into array items for processing  
  - Inputs: Filter1 output  
  - Outputs: Array for Split Out  
- **Split Out**  
  - Type: Split Out node  
  - Role: Splits array of scenes into individual items for sequential processing  
  - Inputs: From All_scenes_to_array  
  - Outputs: Feeds Image Prompt Generator  
- **Image Prompt Generator (LangChain Agent)**  
  - Type: AI agent for generating image prompts  
  - Role: Generates detailed image prompts from scene descriptions  
  - Inputs: From Split Out  
  - Outputs: To Generate Image1  
- **Generate Image1 (HTTP Request)**  
  - Type: HTTP Request  
  - Role: Calls an image generation API (e.g., RunwayML or similar)  
  - Config: Sends prompt, receives base64 image data  
  - Inputs: From Image Prompt Generator  
  - Outputs: To Convert Base64 String to Binary File1  
  - Edge Cases: API rate limits, failures, invalid prompts  
- **Convert Base64 String to Binary File1**  
  - Type: Convert to File  
  - Role: Converts base64 string from API into binary file format for upload  
  - Inputs: From Generate Image1  
  - Outputs: To Upload to Drive2  
- **Upload to Drive2 (Google Drive)**  
  - Type: Google Drive node  
  - Role: Uploads generated images to Google Drive for storage/access  
  - Inputs: From Convert Base64 String to Binary File1  
  - Outputs: To Image Link: WebView Link  
- **Image Link: WebView Link (Set)**  
  - Type: Set node  
  - Role: Sets or formats the URL or metadata for the uploaded image  
  - Inputs: From Upload to Drive2  
  - Outputs: Loops back to Loop Over Items for batch processing  
- **Loop Over Items (SplitInBatches)**  
  - Type: Split in Batches  
  - Role: Controls batch processing of scenes/images to handle rate limits and sequencing  
  - Inputs: From Image Link: WebView Link  
  - Outputs: To Get Generated Videos or Generate Videos nodes  
- **Sticky Notes (3,5)**  
  - Visual comments to explain or annotate this block  

---

#### 2.3 Audio Generation

**Overview:**  
This block generates audio narration and background sound for the video using AI text-to-speech and sound prompt generation services.

**Nodes Involved:**  
- Generate Sound Prompt (LangChain Chain LLM)  
- Generate Audio (Background sound) (HTTP Request)  
- Text to Speech (Adam Voice) (HTTP Request)  
- Upload to Drive1 (Google Drive)  
- No Operation, do nothing  
- Sticky Note4

**Node Details:**

- **Generate Sound Prompt (LangChain Chain LLM)**  
  - Type: AI chain using LangChain for generating sound descriptions or prompts  
  - Role: Creates descriptive prompts for background audio generation  
  - Inputs: From Update Video Status  
  - Outputs: To Generate Audio (Background sound)  
- **Generate Audio (Background sound) (HTTP Request)**  
  - Type: HTTP Request  
  - Role: Calls audio generation API with sound prompt to create background audio file  
  - Inputs: From Generate Sound Prompt  
  - Outputs: To Upload to Drive  
  - Edge Cases: API failures, timeout, invalid prompt  
- **Text to Speech (Adam Voice) (HTTP Request)**  
  - Type: HTTP Request  
  - Role: Calls text-to-speech API (ElevenLabs or similar) to generate narration audio  
  - Inputs: From No Operation, do nothing node  
  - Outputs: To Upload to Drive1  
  - Edge Cases: Authentication errors, rate limits, TTS conversion errors  
- **Upload to Drive1 (Google Drive)**  
  - Type: Google Drive node  
  - Role: Uploads audio files to Google Drive  
  - Inputs: From Text to Speech (Adam Voice)  
  - Outputs: To Merge1 node for further processing  
- **No Operation, do nothing**  
  - Type: NoOp node  
  - Role: Placeholder node to control flow order before TTS  
- **Sticky Note4**  
  - Visual annotation for audio generation block  

---

#### 2.4 Video Rendering and Captioning

**Overview:**  
This block compiles video assets, renders videos using an external service, adds captions, and manages video URLs and downloads.

**Nodes Involved:**  
- Generate Videos (HTTP Request)  
- Get Generated Videos (HTTP Request)  
- Limit  
- Merge  
- Merge1  
- Get all video urls (Code)  
- Render Video with Creatomate (HTTP Request)  
- Wait 30 Seconds (Wait)  
- Add Captions - replicate (HTTP Request)  
- Wait (Wait)  
- Get Captioned Video Url (HTTP Request)  
- Download file binary (HTTP Request)  
- Sticky Note6  
- Sticky Note5  
- Sticky Note11

**Node Details:**

- **Generate Videos (HTTP Request)**  
  - Type: HTTP request to a video generation API (e.g., Creatomate)  
  - Role: Initiates video rendering from generated assets  
  - Inputs: From Loop Over Items  
  - Outputs: To 80 seconds wait node  
  - Edge Cases: API errors, rendering failures, network timeouts  
- **Get Generated Videos (HTTP Request)**  
  - Type: HTTP Request  
  - Role: Polls or retrieves the status or results of video generation  
  - Inputs: From Loop Over Items  
  - Outputs: To Limit and Merge nodes  
- **Limit**  
  - Type: Limit node  
  - Role: Limits number of videos processed at once  
  - Inputs: From Get Generated Videos  
  - Outputs: To Update Video Status  
- **Merge / Merge1**  
  - Type: Merge nodes  
  - Role: Combines multiple streams of data for synchronization  
  - Inputs: Various (e.g., Upload to Drive, No Operation, Upload to Drive1)  
  - Outputs: To Get all video urls  
- **Get all video urls (Code)**  
  - Type: Code node  
  - Role: Extracts and compiles all video URLs from merged data  
  - Inputs: From Merge1  
  - Outputs: To Render Video with Creatomate  
- **Render Video with Creatomate (HTTP Request)**  
  - Type: HTTP Request to Creatomate API  
  - Role: Finalizes rendering of videos with assets and timing  
  - Inputs: From Get all video urls  
  - Outputs: To Wait 30 Seconds  
- **Wait 30 Seconds (Wait)**  
  - Type: Wait node  
  - Role: Pauses workflow to allow asynchronous rendering completion  
  - Inputs: From Render Video with Creatomate  
  - Outputs: To Add Captions - replicate  
- **Add Captions - replicate (HTTP Request)**  
  - Type: HTTP Request  
  - Role: Sends video to a captioning service (e.g., Replicate)  
  - Inputs: From Wait 30 Seconds  
  - Outputs: To Wait node  
- **Wait (Wait)**  
  - Type: Wait node  
  - Role: Pause for caption processing  
  - Outputs: To Get Captioned Video Url  
- **Get Captioned Video Url (HTTP Request)**  
  - Type: HTTP Request  
  - Role: Fetches URL of the captioned video  
  - Inputs: From Wait  
  - Outputs: To Download file binary  
- **Download file binary (HTTP Request)**  
  - Type: HTTP Request  
  - Role: Downloads the video file binary for upload or further processing  
  - Inputs: From Get Captioned Video Url  
  - Outputs: To Google Drive and Load Shorts nodes  
- **Sticky Notes (6,5,11)**  
  - Provide notes and explanations for video rendering and captioning steps  

---

#### 2.5 Upload and Publishing

**Overview:**  
Uploads finalized videos and audio to Google Drive, then posts videos to social media platforms like Instagram, YouTube, TikTok, and LinkedIn, updating statuses accordingly.

**Nodes Involved:**  
- Upload to Drive  
- Upload to Drive1  
- Upload to Drive2  
- Google Drive  
- Load Shorts (HTTP Request)  
- Instagram (HTTP Request)  
- YouTube (HTTP Request)  
- TikTok (HTTP Request)  
- LinkedIn (HTTP Request)  
- Update Shorts Status (Google Sheets)  
- Update Sheet (Google Sheets)  
- Sticky Note2

**Node Details:**

- **Upload to Drive / Upload to Drive1 / Upload to Drive2 (Google Drive nodes)**  
  - Type: Google Drive upload nodes  
  - Role: Upload images, audio, and video assets to Google Drive  
  - Inputs: Various from audio, video, and image generation nodes  
  - Outputs: To Merge nodes and Set nodes for URL formatting  
- **Google Drive (Google Drive node)**  
  - Role: Handles file management or retrieval for final assets  
  - Inputs: From Download file binary  
  - Outputs: To Update Sheet  
- **Load Shorts (HTTP Request)**  
  - Role: Loads shorts metadata or prepares data for publishing  
  - Outputs: To Instagram, YouTube, LinkedIn, TikTok nodes  
- **Instagram / YouTube / TikTok / LinkedIn (HTTP Request nodes)**  
  - Role: Publish videos to respective social media platforms via API calls  
  - Inputs: From Load Shorts  
  - Outputs: To Update Shorts Status  
  - Edge Cases: API auth errors, rate limits, upload failures  
- **Update Shorts Status / Update Sheet (Google Sheets nodes)**  
  - Role: Updates processing status and metadata in Google Sheets after publishing  
  - Inputs: From social media nodes and Google Drive  
- **Sticky Note2**  
  - General annotation for upload and publishing block  

---

#### 2.6 Status Updates and Control Flow

**Overview:**  
Manages workflow pacing with wait nodes, loops to control batch processing, and status updates in Google Sheets for tracking progress.

**Nodes Involved:**  
- Limit  
- Loop Over Items (SplitInBatches)  
- Wait  
- Wait 30 Seconds  
- 80 seconds (Wait)  
- Update Video Status (Google Sheets)  
- Update Shorts Status (Google Sheets)  
- No Operation, do nothing (NoOp)  

**Node Details:**

- **Limit**  
  - Controls number of concurrent operations (e.g., video status updates)  
- **Loop Over Items**  
  - Processes scenes or video items in batches to handle API limits and sequencing  
- **Wait / Wait 30 Seconds / 80 seconds**  
  - Introduces deliberate delays to accommodate asynchronous remote processing (e.g., video rendering, captioning)  
- **Update Video Status / Update Shorts Status**  
  - Update relevant Google Sheets rows with current processing stage/status  
- **No Operation, do nothing**  
  - Placeholder for flow control, ensuring correct sequence for TTS audio generation  

---

### 3. Summary Table

| Node Name                    | Node Type                         | Functional Role                          | Input Node(s)                 | Output Node(s)                          | Sticky Note                                                                                                  |
|------------------------------|----------------------------------|----------------------------------------|------------------------------|----------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Webhook                      | Webhook                          | Entry point for requests                | -                            | Filter, Filter1                        |                                                                                                              |
| Filter                       | Filter                           | Filters incoming requests               | Webhook                      | Write Video Script                     |                                                                                                              |
| Filter1                      | Filter                           | Alternate filter for scene array        | Webhook                      | All_scenes_to_array                    |                                                                                                              |
| Write Video Script            | LangChain Agent                  | AI script generation                    | Filter                       | Youtube shorts                        |                                                                                                              |
| Structured Output Parser     | Output Parser                    | Parses AI output to structured format  | AI output                    | Write Video Script                     |                                                                                                              |
| Calculator Code              | LangChain Tool                  | AI computation tool for scripting       | -                           | Write Video Script                     |                                                                                                              |
| Youtube shorts               | Google Sheets                   | Stores video scripts/metadata           | Write Video Script            | -                                     |                                                                                                              |
| All_scenes_to_array          | Code                            | Converts script to scene array           | Filter1                      | Split Out                            |                                                                                                              |
| Split Out                   | Split Out                       | Splits scenes into individual items     | All_scenes_to_array          | Image Prompt Generator                |                                                                                                              |
| Image Prompt Generator       | LangChain Agent                 | Generates image prompts from scenes     | Split Out                   | Generate Image1                      |                                                                                                              |
| Generate Image1             | HTTP Request                    | Calls AI image generation API            | Image Prompt Generator       | Convert Base64 String to Binary File1 |                                                                                                              |
| Convert Base64 String to Binary File1 | ConvertToFile                 | Converts base64 to binary file          | Generate Image1             | Upload to Drive2                     |                                                                                                              |
| Upload to Drive2            | Google Drive                   | Uploads generated images to Drive       | Convert Base64 String to Binary File1 | Image Link: WebView Link             |                                                                                                              |
| Image Link: WebView Link    | Set                             | Sets web-accessible image URL            | Upload to Drive2             | Loop Over Items                      |                                                                                                              |
| Loop Over Items             | SplitInBatches                 | Batch processing control                 | Image Link: WebView Link     | Generate Videos, Get Generated Videos |                                                                                                              |
| Generate Videos             | HTTP Request                    | Initiates video rendering                 | Loop Over Items             | 80 seconds                          |                                                                                                              |
| 80 seconds                  | Wait                            | Wait for video rendering                  | Generate Videos             | Loop Over Items                      |                                                                                                              |
| Get Generated Videos        | HTTP Request                    | Retrieves generated video status          | Loop Over Items             | Limit, Merge                        |                                                                                                              |
| Limit                      | Limit                          | Limits number of videos processed         | Get Generated Videos         | Update Video Status                 |                                                                                                              |
| Update Video Status         | Google Sheets                   | Updates video processing status           | Limit                       | Generate Sound Prompt               |                                                                                                              |
| Generate Sound Prompt       | LangChain Chain LLM            | Creates sound prompts for background audio | Update Video Status        | Generate Audio (Background sound)   |                                                                                                              |
| Generate Audio (Background sound) | HTTP Request                    | Generates background audio               | Generate Sound Prompt       | Upload to Drive                    |                                                                                                              |
| Upload to Drive             | Google Drive                   | Uploads background audio                   | Generate Audio (Background sound) | Merge                             |                                                                                                              |
| Merge                      | Merge                          | Combines streams for synchronization      | Upload to Drive, No Operation | Merge1                            |                                                                                                              |
| No Operation, do nothing   | NoOp                           | Flow control placeholder                   | Upload to Drive             | Text to Speech (Adam Voice)         |                                                                                                              |
| Text to Speech (Adam Voice) | HTTP Request                    | Generates narration audio                   | No Operation               | Upload to Drive1                   |                                                                                                              |
| Upload to Drive1            | Google Drive                   | Uploads narration audio                     | Text to Speech (Adam Voice)  | Merge1                            |                                                                                                              |
| Merge1                     | Merge                          | Combines audio and video data               | Upload to Drive1, Upload to Drive2 | Get all video urls               |                                                                                                              |
| Get all video urls          | Code                            | Extracts all video URLs                      | Merge1                      | Render Video with Creatomate        |                                                                                                              |
| Render Video with Creatomate | HTTP Request                    | Final video rendering call                   | Get all video urls          | Wait 30 Seconds                    |                                                                                                              |
| Wait 30 Seconds            | Wait                            | Wait for rendering completion                | Render Video with Creatomate | Add Captions - replicate           |                                                                                                              |
| Add Captions - replicate   | HTTP Request                    | Sends video for captioning                    | Wait 30 Seconds            | Wait                             |                                                                                                              |
| Wait                       | Wait                            | Wait for captioning processing                | Add Captions - replicate    | Get Captioned Video Url            |                                                                                                              |
| Get Captioned Video Url    | HTTP Request                    | Fetches captioned video URL                    | Wait                       | Download file binary              |                                                                                                              |
| Download file binary       | HTTP Request                    | Downloads video binary file                      | Get Captioned Video Url     | Google Drive, Load Shorts          |                                                                                                              |
| Google Drive               | Google Drive                   | Manages file upload/download                    | Download file binary        | Update Sheet                     |                                                                                                              |
| Update Sheet               | Google Sheets                   | Updates metadata/status in sheet                | Google Drive                | -                               |                                                                                                              |
| Load Shorts                | HTTP Request                    | Loads shorts metadata for publishing            | Download file binary        | Instagram, YouTube, LinkedIn, TikTok |                                                                                                              |
| Instagram                  | HTTP Request                    | Publishes video to Instagram                      | Load Shorts                | Update Shorts Status             |                                                                                                              |
| YouTube                    | HTTP Request                    | Publishes video to YouTube                        | Load Shorts                | Update Shorts Status             |                                                                                                              |
| TikTok                     | HTTP Request                    | Publishes video to TikTok                         | Load Shorts                | Update Shorts Status             |                                                                                                              |
| LinkedIn                   | HTTP Request                    | Publishes video to LinkedIn                       | Load Shorts                | Update Shorts Status             |                                                                                                              |
| Update Shorts Status       | Google Sheets                   | Updates publishing status in sheet                 | Instagram, YouTube, TikTok, LinkedIn | -                               |                                                                                                              |
| Sticky Notes (all)         | Sticky Note                    | Visual documentation and annotations               | -                          | -                               | Various notes across workflow for clarity and explanation                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Purpose: Receive incoming requests to start workflow  
   - Configure webhook URL and HTTP method (e.g., POST)  

2. **Add Filter Node (Filter)**  
   - Type: Filter  
   - Condition: Define logic to validate incoming request for script generation  
   - Connect Webhook output to Filter input  

3. **Add Secondary Filter Node (Filter1)**  
   - Type: Filter  
   - Alternative condition for different processing path (scene array)  
   - Connect Webhook output also to Filter1  

4. **Create LangChain Agent Node (Write Video Script)**  
   - Type: LangChain Agent  
   - Purpose: Generate video script using AI  
   - Configure to use Calculator Code node as AI tool  
   - Connect Filter output to this node's input  

5. **Create LangChain Tool Node (Calculator Code)**  
   - Type: LangChain Tool (code/calculation)  
   - Used by Write Video Script for enhanced AI logic  

6. **Add Structured Output Parser Node**  
   - Type: LangChain output parser  
   - Parse AI outputs to structured format  
   - Connect AI output to this parser, then feed into Write Video Script  

7. **Add Google Sheets Node (Youtube shorts)**  
   - Type: Google Sheets  
   - Purpose: Store generated scripts and metadata  
   - Connect Write Video Script output here  

8. **Create Code Node (All_scenes_to_array)**  
   - Purpose: Convert script scenes to array  
   - Connect Filter1 output here  

9. **Add Split Out Node**  
   - Split array into individual scenes  
   - Connect All_scenes_to_array output here  

10. **Create LangChain Agent (Image Prompt Generator)**  
    - Generate image prompts from scenes  
    - Connect Split Out output here  

11. **Add HTTP Request Node (Generate Image1)**  
    - Call AI image generation API  
    - Send prompt from Image Prompt Generator  
    - Receive base64 image data  

12. **Add ConvertToFile Node (Convert Base64 String to Binary File1)**  
    - Convert base64 image data to binary file  

13. **Add Google Drive Node (Upload to Drive2)**  
    - Upload image files to Google Drive  

14. **Add Set Node (Image Link: WebView Link)**  
    - Format or set the image URL  
    - Connect Upload to Drive2 output here  

15. **Add SplitInBatches Node (Loop Over Items)**  
    - Batch processing control for scene/image processing  
    - Connect Image Link output here  

16. **Add HTTP Request Node (Generate Videos)**  
    - Call video generation API (Creatomate or similar)  
    - Connect Loop Over Items output here  

17. **Add Wait Node (80 seconds)**  
    - Wait after video generation request  
    - Connect Generate Videos output here  

18. **Connect Loop Over Items to Get Generated Videos (HTTP Request)**  
    - Poll or get status of video generation  

19. **Add Limit Node**  
    - Limit concurrent video processing  
    - Connect Get Generated Videos output here  

20. **Add Google Sheets Node (Update Video Status)**  
    - Update video status in sheet  
    - Connect Limit output here  

21. **Add LangChain Chain LLM Node (Generate Sound Prompt)**  
    - Generate background sound prompts  
    - Connect Update Video Status output here  

22. **Add HTTP Request Node (Generate Audio - Background sound)**  
    - Generate background audio using sound prompt  

23. **Add Google Drive Node (Upload to Drive)**  
    - Upload background audio files  

24. **Add NoOp Node (No Operation, do nothing)**  
    - Flow control before TTS  

25. **Add HTTP Request Node (Text to Speech - Adam Voice)**  
    - Generate narration audio from text  

26. **Add Google Drive Node (Upload to Drive1)**  
    - Upload narration audio files  

27. **Add Merge Nodes (Merge, Merge1)**  
    - Synchronize streams of audio/video assets  

28. **Add Code Node (Get all video urls)**  
    - Extract video URLs from merged data  

29. **Add HTTP Request Node (Render Video with Creatomate)**  
    - Finalize video rendering with assets  

30. **Add Wait Node (Wait 30 Seconds)**  
    - Wait for rendering completion  

31. **Add HTTP Request Node (Add Captions - replicate)**  
    - Send video to captioning service  

32. **Add Wait Node (Wait)**  
    - Wait for captioning results  

33. **Add HTTP Request Node (Get Captioned Video Url)**  
    - Get captioned video URL  

34. **Add HTTP Request Node (Download file binary)**  
    - Download final video binary  

35. **Add Google Drive Node (Google Drive)**  
    - Upload final video binary  

36. **Add Google Sheets Node (Update Sheet)**  
    - Update metadata/status  

37. **Add HTTP Request Node (Load Shorts)**  
    - Prepare videos for social media publishing  

38. **Add HTTP Request Nodes (Instagram, YouTube, TikTok, LinkedIn)**  
    - Publish videos to respective platforms  

39. **Add Google Sheets Node (Update Shorts Status)**  
    - Update publishing status  

40. **Add Wait Nodes as needed to manage pacing and API limits**  

41. **Add Sticky Notes**  
    - Add visual annotations on canvas for clarity  

**Credential Setup:**  
- Configure OpenAI or LangChain-compatible credentials for AI nodes.  
- Set up Google Drive OAuth2 credentials.  
- Configure APIs for image generation (e.g., RunwayML), audio generation (ElevenLabs or similar), video rendering (Creatomate), captioning (Replicate), and social media APIs (Instagram, YouTube, TikTok, LinkedIn).  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                            | Context or Link                                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| This workflow integrates multiple AI services: OpenAI (LangChain), RunwayML for image generation, ElevenLabs for TTS, and Creatomate for video rendering. | Overview of AI tools used                                                                                         |
| The workflow includes deliberate wait nodes (30s, 80s) to handle asynchronous processing in external APIs.                                              | Important for timing control                                                                                      |
| Social media publishing requires API credentials and appropriate permissions for each platform.                                                        | Credentials setup required                                                                                        |
| Sticky notes are used extensively to document workflow sections and guide users.                                                                        | Visual aids on n8n canvas                                                                                        |
| For best performance, batch processing with SplitInBatches and Limit nodes is critical to avoid API rate limits.                                        | Workflow optimization                                                                                             |
| See https://n8n.io/integrations for detailed node documentation of Google Sheets, HTTP Request, and LangChain nodes.                                   | Official n8n documentation                                                                                        |
| The workflow exemplifies a practical end-to-end automation for faceless shorts production, suitable for digital marketers and content creators alike.  | Use case summary                                                                                                 |

---

**Disclaimer:**  
The provided content is generated exclusively from an n8n automated workflow. It complies with all current content policies and contains no illegal, offensive, or protected material. All processed data is legal and publicly available.