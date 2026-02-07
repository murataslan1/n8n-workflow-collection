AI-Powered Loom Video Q&A with Gemini-2.5 and Slack Notifications

https://n8nworkflows.xyz/workflows/ai-powered-loom-video-q-a-with-gemini-2-5-and-slack-notifications-4472


# AI-Powered Loom Video Q&A with Gemini-2.5 and Slack Notifications

---

## 1. Workflow Overview

This workflow enables an AI-powered question and answer interaction on Loom videos by integrating Google Gemini-2.5 LLM and Slack for notifications. Users submit a public Loom video URL and a question about the video via a web form. The workflow downloads the Loom video, uploads it to Google Gemini’s video processing endpoint, waits for the video to become active, then sends the video and the user’s question to Gemini’s language model for summarization or answering. Finally, the response is sent as a Slack message to a specified user.

**Target Use Cases:**
- Automating video content understanding and Q&A from Loom videos.
- Leveraging Google Gemini’s multimodal capabilities with video input.
- Real-time question answering and notifications via Slack.
- Extensible for triggers such as email or other input sources containing Loom links.

**Logical Blocks:**

- **1.1 Input Reception:** User submits Loom video URL and question via a form; input validation.
- **1.2 Loom Video Download:** Extract video ID, fetch Loom API video URL, download video binary.
- **1.3 Prepare Video Upload to Gemini:** Calculate video size, set metadata, initiate Gemini upload session.
- **1.4 Upload Binary Video to Gemini:** Upload video binary data to Gemini resumable session URL.
- **1.5 Wait for Video Activation:** Poll Gemini API until video processing state is “ACTIVE”.
- **1.6 Query Gemini LLM:** Send video URI and user question to Gemini LLM for summarization/answer.
- **1.7 Slack Notification:** Post Gemini’s response to a Slack user.
- **1.8 User Guidance and Notes:** Sticky notes providing workflow usage instructions and context.

---

## 2. Block-by-Block Analysis

### 2.1 Input Reception

**Overview:**  
Receive Loom video URL and a user question through a web form, then validate the Loom URL format.

**Nodes Involved:**  
- Loom URL Form  
- Valid Loom URL?

**Node Details:**

- **Loom URL Form**  
  - Type: Form Trigger  
  - Role: Entry point to accept user input via an HTTP form with fields for Loom URL and question.  
  - Config: Two required fields: “Loom Video URL” (URL format) and “Enter a question about the video” (textarea).  
  - Input: User HTTP form submission  
  - Output: JSON with user inputs  
  - Edge Cases: Missing required fields; malformed URL inputs.

- **Valid Loom URL?**  
  - Type: If  
  - Role: Validate that the Loom URL starts with “https://www.loom.com/share/”.  
  - Config: String operation “startsWith” on the Loom Video URL from form JSON.  
  - Input: Form output  
  - Output: Passes valid URLs to next node; invalid URLs cause workflow to halt silently (no else branch).  
  - Edge Cases: URLs not matching Loom’s share URL pattern; could add error handling or user feedback.

---

### 2.2 Loom Video Download

**Overview:**  
Extract the video ID from the Loom URL, request Loom API for the transcoded video URL, and download the video binary content.

**Nodes Involved:**  
- Extract Video ID  
- Fetch Download URL  
- Download Video Content

**Node Details:**

- **Extract Video ID**  
  - Type: Set  
  - Role: Parse Loom Video URL string to isolate the video ID.  
  - Config: Expression splits URL by “/”, takes last segment, then splits by “?” to remove query params.  
  - Input: Valid Loom URL JSON  
  - Output: JSON with extracted “videoId” string.  
  - Edge Cases: Unexpected URL formats causing empty or invalid videoId.

- **Fetch Download URL**  
  - Type: HTTP Request  
  - Role: POST request to Loom API endpoint to get video transcoded download URL.  
  - Config: URL uses extracted videoId in path; POST method without additional payload.  
  - Input: Extract Video ID output  
  - Output: JSON containing “url” with the direct video download link.  
  - Edge Cases: Loom API failure, invalid videoId, authorization issues (not shown here, assumes public videos).  
  - Version: HTTP Request v3 for improved features.

- **Download Video Content**  
  - Type: HTTP Request  
  - Role: Download the actual video content from the Loom API provided URL.  
  - Config: GET request to the “url” field from previous node, expects binary data.  
  - Input: Fetch Download URL output  
  - Output: Binary video data under property “data”.  
  - Edge Cases: Large file downloads, network timeout, invalid URLs.

---

### 2.3 Prepare Video Upload to Gemini

**Overview:**  
Calculate the binary video file size, set video metadata (mime type and display name), and initiate an authenticated resumable upload session with Gemini’s API.

**Nodes Involved:**  
- Calculate File Size  
- Set Video Attributes  
- Merge1  
- Start Upload Session for Gemini

**Node Details:**

- **Calculate File Size**  
  - Type: Code  
  - Role: Calculate binary size of downloaded video.  
  - Config: JavaScript code reads binary property “data” buffer length as size in bytes.  
  - Input: Download Video Content binary data  
  - Output: JSON with “fileSizeInBytes”.  
  - Edge Cases: Missing binary data causes explicit error with debug info.

- **Set Video Attributes**  
  - Type: Set  
  - Role: Define “mimeType” from binary data and “displayName” formatted with video ID.  
  - Config: mimeType from binary metadata, displayName uses extracted video ID with prefix “loom_”.  
  - Input: Download Video Content output  
  - Output: JSON with mimeType and displayName fields.  
  - Edge Cases: Missing mimeType metadata.

- **Merge1**  
  - Type: Merge  
  - Role: Combine file size info and video attributes into a single JSON object for upload session creation.  
  - Config: Combine by position mode, inputs from Calculate File Size and Set Video Attributes.  
  - Input: Both prior nodes  
  - Output: Merged JSON for upload session input.  
  - Edge Cases: Unequal array lengths or missing inputs.

- **Start Upload Session for Gemini**  
  - Type: HTTP Request  
  - Role: Begin Gemini API resumable upload session.  
  - Config: POST to Gemini upload endpoint with JSON body containing “display_name”. Authenticated with HTTP Query Authentication (API key as query param). Headers specify resumable upload protocol and content-length/type.  
  - Input: Merge1 output JSON  
  - Output: Full HTTP response with “x-goog-upload-url” header containing upload URL.  
  - Edge Cases: Authentication failure, invalid params, API errors.  
  - Credential: Gemini API Query Auth (generic HTTP Query Auth with key param).  
  - Version: HTTP Request v4.1+ (supports full response capture).

---

### 2.4 Upload Binary Video to Gemini

**Overview:**  
Extract the upload URL from the upload session response and upload the binary video data to Gemini with appropriate headers.

**Nodes Involved:**  
- Extract URL for Uploading  
- Upload Video Data  
- Merge

**Node Details:**

- **Extract URL for Uploading**  
  - Type: Set  
  - Role: Extract “x-goog-upload-url” header from previous node’s HTTP response.  
  - Config: Sets “uploadUrl” string from headers.  
  - Input: Start Upload Session for Gemini output  
  - Output: JSON containing “uploadUrl”.  
  - Edge Cases: Missing header causes failure.

- **Upload Video Data**  
  - Type: HTTP Request  
  - Role: Upload video binary data to Gemini using PUT method and resumable upload headers.  
  - Config: URL set dynamically from “uploadUrl”. Headers include Content-Length, X-Goog-Upload-Offset (0), X-Goog-Upload-Command (upload, finalize). Content type is binary. Binary data sent from “data” property.  
  - Input: Extract URL for Uploading + Download Video Content binary (connected via Merge)  
  - Output: Upload response JSON.  
  - Edge Cases: Upload interruptions, network errors, incorrect content-length.

- **Merge**  
  - Type: Merge  
  - Role: Combine binary video data and upload URL JSON for Upload Video Data node input.  
  - Config: Combine by position.  
  - Input: Extract URL for Uploading and binary video data (Download Video Content chain).  
  - Output: Combined data for upload request.  
  - Edge Cases: Data mismatch.

---

### 2.5 Wait for Video Activation

**Overview:**  
Poll Gemini API to check the state of the uploaded video file until it reaches “ACTIVE” status, waiting 5 seconds between polls.

**Nodes Involved:**  
- Extract File Details  
- Loop Until Video Is Active  
- Wait 5 Seconds  
- Get Video Status  
- Video Active?

**Node Details:**

- **Extract File Details**  
  - Type: Set  
  - Role: Extract Gemini file metadata (URI, name, MIME type) from upload response for status polling.  
  - Config: Sets “geminiFileUri”, “geminiFileName”, “geminiFileMimeType” from nested JSON fields.  
  - Input: Upload Video Data output  
  - Output: JSON with file metadata.  
  - Edge Cases: Incorrect response format.

- **Loop Until Video Is Active**  
  - Type: Split In Batches  
  - Role: Controls looping/polling logic (used as loop control node).  
  - Config: Reset disabled to maintain loop state.  
  - Input: Extract File Details output  
  - Output: Passes single item through loop cycle.  
  - Edge Cases: Potential infinite loop if video never activates.

- **Wait 5 Seconds**  
  - Type: Wait  
  - Role: Delay between polling attempts.  
  - Config: 5 seconds fixed wait.  
  - Input: If video not active.  
  - Output: Triggers next status check.  
  - Edge Cases: Delays add latency; could be parameterized.

- **Get Video Status**  
  - Type: HTTP Request  
  - Role: Query Gemini API for current video file status using “geminiFileUri”.  
  - Config: GET request with HTTP Query Auth (API key).  
  - Input: Wait or loop trigger  
  - Output: JSON with “state” property (e.g., PROCESSING, ACTIVE).  
  - Edge Cases: API errors, auth failure.

- **Video Active?**  
  - Type: If  
  - Role: Evaluate if video “state” equals “ACTIVE”.  
  - Config: String equals check on “state” JSON field.  
  - Input: Get Video Status output  
  - Output: If yes, proceed; if no, loop back with wait.  
  - Edge Cases: Non-standard states; potential loop exit conditions missing.

---

### 2.6 Query Gemini LLM

**Overview:**  
Once the video is active, send a request to Gemini’s LLM endpoint with the video file URI and the user question, requesting a content generation response.

**Nodes Involved:**  
- Ask Gemini to Summarize Video

**Node Details:**

- **Ask Gemini to Summarize Video**  
  - Type: HTTP Request  
  - Role: POST to Gemini’s generative language API, providing video file data and user question as content parts.  
  - Config: JSON body includes two parts: video data with mime type and URI, and text containing the user question from form input. Authenticated via HTTP Query Auth.  
  - Input: Video active confirmation with file URI and form question  
  - Output: Gemini LLM response with content candidates.  
  - Edge Cases: API limits, malformed prompt, authentication failure.

---

### 2.7 Slack Notification

**Overview:**  
Send the Gemini LLM response as a Slack message to a specified user.

**Nodes Involved:**  
- Slack

**Node Details:**

- **Slack**  
  - Type: Slack node  
  - Role: Send message to Slack user with Gemini LLM answer.  
  - Config: Message text uses expression to extract first candidate’s content text from Gemini response; addressed to user “@giosegar” via username mode.  
  - Input: Gemini LLM response  
  - Output: Slack API message post result.  
  - Credential: Bot access token configured.  
  - Edge Cases: Slack API rate limits, invalid token, user not found.

---

### 2.8 User Guidance and Notes

**Overview:**  
Sticky notes provide detailed user instructions, block descriptions, and external links for understanding and customizing the workflow.

**Nodes Involved:**  
- Sticky Note (Download Loom Video)  
- Sticky Note1 (Upload Video to Gemini)  
- Sticky Note2 (Ensure Video Is Active)  
- Sticky Note3 (Send Request to Gemini LLM)  
- Sticky Note4 (How to use the workflow)

**Node Details:**

- Sticky notes contain markdown-formatted explanations and best practices, including:

  - Workflow usage overview with links to Gemini API key setup:  
    [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

  - Block explanations for downloading video, uploading to Gemini, waiting for processing, and sending to LLM.

  - Suggestions for workflow customization, e.g., triggering on incoming emails with Loom links.

---

## 3. Summary Table

| Node Name                       | Node Type          | Functional Role                              | Input Node(s)                 | Output Node(s)                        | Sticky Note                                                                                      |
|--------------------------------|--------------------|----------------------------------------------|------------------------------|--------------------------------------|------------------------------------------------------------------------------------------------|
| Loom URL Form                  | Form Trigger       | Receive Loom URL and question from user      | -                            | Valid Loom URL?                      |                                                                                                |
| Valid Loom URL?                | If                 | Validate Loom URL format                       | Loom URL Form                | Extract Video ID                     |                                                                                                |
| Extract Video ID               | Set                | Parse video ID from URL                        | Valid Loom URL?              | Fetch Download URL                   |                                                                                                |
| Fetch Download URL             | HTTP Request       | Request Loom API for video download URL       | Extract Video ID             | Download Video Content               |                                                                                                |
| Download Video Content         | HTTP Request       | Download Loom video binary                     | Fetch Download URL           | Calculate File Size, Set Video Attributes |                                                                                                |
| Calculate File Size            | Code               | Calculate binary video file size in bytes     | Download Video Content       | Merge1                             |                                                                                                |
| Set Video Attributes           | Set                | Set video mime type and display name          | Download Video Content       | Merge1                             |                                                                                                |
| Merge1                        | Merge              | Combine file size and video attributes         | Calculate File Size, Set Video Attributes | Start Upload Session for Gemini |                                                                                                |
| Start Upload Session for Gemini| HTTP Request       | Initiate Gemini resumable upload session       | Merge1                      | Extract URL for Uploading           |                                                                                                |
| Extract URL for Uploading      | Set                | Extract upload URL from session response       | Start Upload Session for Gemini | Merge                            |                                                                                                |
| Merge                         | Merge              | Combine upload URL and binary video data       | Extract URL for Uploading, Download Video Content | Upload Video Data         |                                                                                                |
| Upload Video Data             | HTTP Request       | Upload video binary to Gemini                   | Merge                       | Extract File Details                |                                                                                                |
| Extract File Details          | Set                | Extract Gemini file URI and metadata            | Upload Video Data            | Loop Until Video Is Active          |                                                                                                |
| Loop Until Video Is Active    | Split In Batches   | Loop control for polling video activation       | Extract File Details         | Ask Gemini to Summarize Video, Wait 5 Seconds |                                                                                                |
| Wait 5 Seconds               | Wait               | Delay between polling attempts                   | Loop Until Video Is Active (if not active) | Get Video Status                  |                                                                                                |
| Get Video Status             | HTTP Request       | Check video processing status via Gemini API   | Wait 5 Seconds              | Video Active?                      |                                                                                                |
| Video Active?                | If                 | Check if video state is “ACTIVE”                 | Get Video Status            | Loop Until Video Is Active (if no), Ask Gemini to Summarize Video (if yes) |                                                                                                |
| Ask Gemini to Summarize Video| HTTP Request       | Send video and question to Gemini LLM           | Loop Until Video Is Active (if active) | Slack                           |                                                                                                |
| Slack                       | Slack              | Post Gemini response to Slack user               | Ask Gemini to Summarize Video | -                                |                                                                                                |
| Sticky Note                  | Sticky Note        | Instructions: Download Loom Video                 | -                            | -                                | ## Download Loom Video\n\nEnter loom video url via form, then make requests to loom api to get url of video and then download. |
| Sticky Note1                 | Sticky Note        | Instructions: Upload Video to Gemini              | -                            | -                                | ## Upload Video to Gemini\n\nExtract data from video needed for upload to Gemini. Then start an authenticated upload session, get the url to upload to and upload the video. |
| Sticky Note2                 | Sticky Note        | Instructions: Ensure Video Is Active               | -                            | -                                | ## Ensure Video Is Active Before Using with LLM Request\n\nUploaded videos start in "PROCESSING" state when first uploaded and need to be "ACTIVE" before they can be provided to a Gemini LLM request. |
| Sticky Note3                 | Sticky Note        | Instructions: Send Request to Gemini LLM           | -                            | -                                | ## Send Request to Gemini LLM\n\nOnce video is active, send video to Gemini with prompt from the form |
| Sticky Note4                 | Sticky Note        | Instructions: How to use the workflow               | -                            | -                                | ## How to use the workflow\nThis workflow takes a Loom link, extracts the video ID, uses the Loom API to download the video, then sends it to Gemini along with your question. Finally, it sends the output to Slack.\n\nTo use it, you just need to add your own [API key for Gemini](https://aistudio.google.com/app/apikey) and Slack connection. \n\nClick the link above to get your Gemini API key, then add a generic "Query auth" type credential in n8n. The name will be "key" and the value will be your API key.\n\nOne way to customize this workflow would be to make the trigger any received email, extract the Loom link, and run an auto-prompt like "Describe this video in detail". |

---

## 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node named “Loom URL Form”**  
   - Form Title: “Loom Video Downloader to Gemini”  
   - Fields:  
     - Text field “Loom Video URL”, required, placeholder “https://www.loom.com/share/…”  
     - Textarea field “Enter a question about the video”, required  
   - Save webhook ID for external access.

2. **Add an “If” node named “Valid Loom URL?”**  
   - Condition: String operation “startsWith”  
   - Left value: Expression to access `Loom Video URL` from form input  
   - Right value: “https://www.loom.com/share/”  
   - Connect “Loom URL Form” → “Valid Loom URL?”

3. **Add a “Set” node named “Extract Video ID”**  
   - Add string field “videoId” with expression:  
     `{{$json["Loom Video URL"].split("/").pop().split("?")[0]}}`  
   - Connect “Valid Loom URL?” (true output) → “Extract Video ID”

4. **Add an HTTP Request node “Fetch Download URL”**  
   - Method: POST  
   - URL: `https://www.loom.com/api/campaigns/sessions/{{ $json.videoId }}/transcoded-url`  
   - Connect “Extract Video ID” → “Fetch Download URL”

5. **Add HTTP Request node “Download Video Content”**  
   - Method: GET (default)  
   - URL: Use expression `{{ $json.url }}` from previous node’s output  
   - Set “Response Format” to “File” (binary) to download raw video  
   - Connect “Fetch Download URL” → “Download Video Content”

6. **Add “Code” node “Calculate File Size”**  
   - JavaScript code to calculate binary data size (see node 2.3 details)  
   - Input binary property name: “data”  
   - Connect “Download Video Content” → “Calculate File Size”

7. **Add “Set” node “Set Video Attributes”**  
   - Set “mimeType” to `{{ $binary.data.mimeType }}`  
   - Set “displayName” to `loom_{{ $json.videoId }}`  
   - Connect “Download Video Content” → “Set Video Attributes”

8. **Add “Merge” node “Merge1”**  
   - Mode: Combine by position  
   - Connect “Calculate File Size” → first input  
   - Connect “Set Video Attributes” → second input

9. **Add HTTP Request node “Start Upload Session for Gemini”**  
   - Method: POST  
   - URL: `https://generativelanguage.googleapis.com/upload/v1beta/files`  
   - Authentication: Generic HTTP Query Auth with API key credential (named “Gemini API Query Auth”)  
   - Headers:  
     - `X-Goog-Upload-Protocol`: “resumable”  
     - `X-Goog-Upload-Command`: “start”  
     - `X-Goog-Upload-Header-Content-Length`: `{{ $json.fileSizeInBytes }}`  
     - `X-Goog-Upload-Header-Content-Type`: `{{ $json.mimeType }}`  
     - `Content-Type`: “application/json”  
   - Body (JSON):  
     ```json
     {
       "file": {
         "display_name": "{{ $json.displayName }}"
       }
     }
     ```  
   - Connect “Merge1” → “Start Upload Session for Gemini”

10. **Add “Set” node “Extract URL for Uploading”**  
    - Set “uploadUrl” to `{{ $json.headers["x-goog-upload-url"] }}`  
    - Connect “Start Upload Session for Gemini” → “Extract URL for Uploading”

11. **Add “Merge” node “Merge”**  
    - Mode: Combine by position  
    - Connect “Extract URL for Uploading” → first input  
    - Connect “Download Video Content” → second input

12. **Add HTTP Request node “Upload Video Data”**  
    - Method: PUT  
    - URL: `{{ $json.uploadUrl }}`  
    - Headers:  
      - `Content-Length`: `{{ $json.fileSizeInBytes }}`  
      - `X-Goog-Upload-Offset`: “0”  
      - `X-Goog-Upload-Command`: “upload, finalize”  
    - Content-Type: binary  
    - Body: Binary data from “data” property  
    - Connect “Merge” → “Upload Video Data”

13. **Add “Set” node “Extract File Details”**  
    - Set:  
      - geminiFileUri: `{{ $json.file.uri }}`  
      - geminiFileName: `{{ $json.file.name }}`  
      - geminiFileMimeType: `{{ $json.file.mimeType }}`  
    - Connect “Upload Video Data” → “Extract File Details”

14. **Add “Split In Batches” node “Loop Until Video Is Active”**  
    - Options: Reset disabled  
    - Connect “Extract File Details” → “Loop Until Video Is Active”

15. **Add “Wait” node “Wait 5 Seconds”**  
    - Fixed wait time: 5 seconds  
    - Connect “Loop Until Video Is Active” (second output for “not active” branch) → “Wait 5 Seconds”

16. **Add HTTP Request node “Get Video Status”**  
    - Method: GET  
    - URL: `{{ $json.geminiFileUri }}`  
    - Authentication: Gemini API Query Auth  
    - Connect “Wait 5 Seconds” → “Get Video Status”

17. **Add “If” node “Video Active?”**  
    - Condition: Check `{{ $json.state }}` equals “ACTIVE”  
    - Connect “Get Video Status” → “Video Active?”

18. **Connect “Video Active?”**  
    - True output → “Loop Until Video Is Active” (first output to continue loop)  
    - False output → “Ask Gemini to Summarize Video”

19. **Add HTTP Request node “Ask Gemini to Summarize Video”**  
    - Method: POST  
    - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-03-25:generateContent`  
    - Authentication: Gemini API Query Auth  
    - Body (JSON):  
      ```json
      {
        "contents": [
          {
            "parts": [
              {
                "file_data": {
                  "mime_type": "video/mp4",
                  "file_uri": "{{ $json.uri }}"
                }
              },
              {
                "text": {{ JSON.stringify($('Loom URL Form').first().json['Enter a question about the video']) }}
              }
            ]
          }
        ]
      }
      ```  
    - Connect “Loop Until Video Is Active” (true output from “Video Active?”) → “Ask Gemini to Summarize Video”

20. **Add Slack node “Slack”**  
    - Send Message  
    - Text: `Loom video response from Gemini: {{ $json.candidates[0].content.parts[0].text }}`  
    - User: Username mode, value `@giosegar` (change as needed)  
    - Credential: Slack Bot Token  
    - Connect “Ask Gemini to Summarize Video” → “Slack”

21. **Add Sticky Notes**  
    - Add all sticky notes as per node placement to provide instructions and context.

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                              | Context or Link                                         |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| To get your Gemini API key, visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey). Add it in n8n as a generic “Query Auth” credential with the parameter name “key”.                                                                                     | Gemini API Key Setup                                   |
| This workflow expects Loom videos to be public and accessible without authentication. Private or restricted videos may cause API failures.                                                                                                                                              | Loom Video Access Considerations                       |
| Uploaded videos to Gemini start in “PROCESSING” state and must be polled until reaching “ACTIVE” before querying the LLM. Failure to wait may result in errors or incomplete responses.                                                                                                  | Video Processing State Management                       |
| Slack node requires a bot token with chat permissions and the target user must exist in the workspace.                                                                                                                                                                                   | Slack API Permissions and User Setup                    |
| Suggested customization: Trigger workflow on new incoming emails, extract Loom URLs, and use predefined prompts to automate video summarization or monitoring.                                                                                                                           | Workflow Extensibility                                  |
| Error handling is minimal; consider adding branches to handle invalid Loom URLs, Loom API failures, video download issues, or Gemini API errors for robust, production-grade workflows.                                                                                                   | Recommended Enhancements                                |

---

**Disclaimer:** The provided text is derived exclusively from an n8n automated workflow. It adheres strictly to content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.