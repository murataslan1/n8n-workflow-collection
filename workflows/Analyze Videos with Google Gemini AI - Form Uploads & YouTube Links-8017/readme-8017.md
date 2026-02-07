Analyze Videos with Google Gemini AI - Form Uploads & YouTube Links

https://n8nworkflows.xyz/workflows/analyze-videos-with-google-gemini-ai---form-uploads---youtube-links-8017


# Analyze Videos with Google Gemini AI - Form Uploads & YouTube Links

### 1. Workflow Overview

This workflow is designed to analyze video content using Google Gemini AI's generative language capabilities. It supports two primary input methods:

- **1.1 Form Upload:** Users upload a video file via a web form, which is then uploaded to Google’s generative language API for detailed content analysis.
- **1.2 YouTube Link Analysis:** Users can provide a YouTube video URL to get a concise summary of the video content.

The workflow is structured into these logical blocks:

- **1.1 Input Reception (Form Trigger and YouTube link via manual trigger)**
- **1.2 File Upload and Processing (Uploading the video file to Google Gemini API)**
- **1.3 Waiting and Analysis Retrieval (Wait nodes to allow processing time, then request analysis)**
- **1.4 Results Extraction and Presentation (Extracting AI-generated text and formatting output)**
- **1.5 Configuration and Setup Notes (Sticky notes with instructions and descriptions)**

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception Block

**Overview:**  
This block captures user input, either via a web form upload or a manual trigger for testing with a preset YouTube link.

**Nodes Involved:**  
- On form submission  
- When clicking ‘Test workflow’  

**Node Details:**

- **On form submission**  
  - *Type:* FormTrigger  
  - *Role:* Receives video file uploads from users through a web form titled "Insert Video" with a single required file input labeled "Video."  
  - *Config:* Single file upload only, no multiple files allowed.  
  - *Connections:* Output to "Upload File " node.  
  - *Failure Points:* User upload errors, network issues, unsupported file formats not filtered here.  
  - *Version:* 2.2  

- **When clicking ‘Test workflow’**  
  - *Type:* ManualTrigger (disabled by default)  
  - *Role:* Allows manual triggering for testing the YouTube video analysis path.  
  - *Config:* No parameters.  
  - *Connections:* Output to "YouTube Video" node.  
  - *Failure Points:* None typically, except user forgets to enable the node.  
  - *Version:* 1  

---

#### 2.2 File Upload and Processing Block

**Overview:**  
This block handles uploading the user’s video file to Google Gemini AI’s file upload API endpoint.

**Nodes Involved:**  
- Upload File  

**Node Details:**

- **Upload File**  
  - *Type:* HTTP Request  
  - *Role:* Uploads binary video data to Google generative language API’s upload endpoint.  
  - *Config:*  
    - URL: `https://generativelanguage.googleapis.com/upload/v1beta/files`  
    - Method: POST  
    - Content-Type: binary data with dynamic MIME type derived from the uploaded file’s type and extension.  
    - Headers include Google-specific upload commands: `start, upload, finalize` and content length/type.  
    - Authentication: Generic HTTP Query Auth with Google API key credential.  
  - *Input:* Binary file from form upload stored in `$binary.Video`.  
  - *Output:* Passes to "Wait" node.  
  - *Failure Points:* Network/timeout issues, invalid or missing credentials, file size too large, improper MIME type, upload interruptions.  
  - *Version:* 4.2  

---

#### 2.3 Waiting and Analysis Retrieval Block

**Overview:**  
This block waits for the upload processing to complete and then requests detailed video content analysis from Google Gemini AI.

**Nodes Involved:**  
- Wait  
- 5 seconds  
- Get Analysis  

**Node Details:**

- **Wait**  
  - *Type:* Wait  
  - *Role:* Delays workflow for an unspecified time after file upload to ensure processing readiness.  
  - *Config:* Default wait, no parameters set explicitly.  
  - *Input:* From "Upload File " node.  
  - *Output:* To "Get Analysis" node.  
  - *Failure Points:* None significant, except workflow stuck if wait too long or too short.  
  - *Version:* 1.1  

- **5 seconds**  
  - *Type:* Wait  
  - *Role:* Additional short wait (5 seconds) triggered after analysis request to handle timing or retries.  
  - *Config:* Wait duration: 5 seconds.  
  - *Input:* From "Get Analysis" node (secondary output).  
  - *Output:* Loops back to "Get Analysis" node, enabling retry or repeated analysis.  
  - *Failure Points:* Timing issues may cause unnecessary delays.  
  - *Version:* 1.1  

- **Get Analysis**  
  - *Type:* HTTP Request  
  - *Role:* Sends a POST request to Google Gemini AI to generate detailed video content description.  
  - *Config:*  
    - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`  
    - Method: POST  
    - Body (JSON):  
      - Includes `fileUri` and `mimeType` from the uploaded file response.  
      - Includes prompt text asking for a detailed description of the video.  
    - Authentication: Generic HTTP Query Auth with Google API key.  
    - On error: continues workflow with error output.  
  - *Input:* Receives file metadata from the previous wait node.  
  - *Output:* Passes analysis results to "Video Analysis" node and triggers "5 seconds" wait for retries.  
  - *Failure Points:* API quota exceeded, invalid credentials, malformed request, timeouts, file not found at URI, JSON expression errors.  
  - *Version:* 4.2  

---

#### 2.4 YouTube Link Analysis Block

**Overview:**  
This block accepts a YouTube video URL (via manual trigger) and requests a summarized description from Google Gemini AI.

**Nodes Involved:**  
- YouTube Video  
- Get Results  

**Node Details:**

- **YouTube Video**  
  - *Type:* HTTP Request  
  - *Role:* Sends a POST request to Google Gemini AI to generate a summary of a YouTube video given its public URL.  
  - *Config:*  
    - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`  
    - Method: POST  
    - Body (JSON):  
      - Text prompt to summarize video in 3 sentences.  
      - `file_uri` set to a hardcoded YouTube URL: `https://youtu.be/gwCQF--cARA?si=uCbaUnoRlEjHO50a`  
    - Authentication: Generic HTTP Query Auth with Google API key.  
  - *Input:* From manual trigger node.  
  - *Output:* Passes AI response to "Get Results" node.  
  - *Failure Points:* Invalid or unavailable YouTube URL, API errors, quota exceeded, malformed requests.  
  - *Version:* 4.2  

- **Get Results**  
  - *Type:* Set  
  - *Role:* Extracts and assigns the summarized text from the AI response to a `text` field for downstream use.  
  - *Config:*  
    - Assigns `text` = first candidate content text from AI response JSON.  
  - *Input:* From "YouTube Video" node.  
  - *Output:* No further nodes connected; presumably final step for YouTube path.  
  - *Failure Points:* Missing or malformed response JSON, empty candidate list.  
  - *Version:* 3.4  

---

#### 2.5 Results Extraction and Presentation Block

**Overview:**  
This block processes and stores the detailed video analysis text from the AI response after file upload analysis.

**Nodes Involved:**  
- Video Analysis  

**Node Details:**

- **Video Analysis**  
  - *Type:* Set  
  - *Role:* Extracts the detailed video description from the AI response and stores it in a `Video Analysis` string field.  
  - *Config:*  
    - Assigns `Video Analysis` = first candidate content text part from the AI response JSON.  
  - *Input:* From "Get Analysis" node.  
  - *Output:* No further nodes connected; presumably final step for file upload path.  
  - *Failure Points:* Empty or malformed AI response, missing content parts.  
  - *Version:* 3.4  

---

#### 2.6 Configuration and Setup Notes Block

**Overview:**  
This block contains instructional sticky notes to assist users in understanding and setting up the workflow.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1  
- Sticky Note2  
- Sticky Note5  
- Sticky Note7  
- Sticky Note8  

**Node Details:**

- **Sticky Note**  
  - *Role:* Labels "Form Trigger" block for clarity.  
  - *Content:* "## Form Trigger"  

- **Sticky Note1**  
  - *Role:* Labels "Upload File" block.  
  - *Content:* "## Upload File"  

- **Sticky Note2**  
  - *Role:* Labels "Get Analysis" block.  
  - *Content:* "## Get Analysis"  

- **Sticky Note5**  
  - *Role:* Labels "Result" block.  
  - *Content:* "## Result"  

- **Sticky Note7**  
  - *Role:* Labels "YouTube Vision" block.  
  - *Content:* "# YouTube Vision"  

- **Sticky Note8**  
  - *Role:* Provides a detailed setup guide for users.  
  - *Content:*  
    ```
    # 🛠️ Setup Guide  
    *Author: [Lee Wei]*

    ### ✅ Step 1: Get Your Free API Key  
    Go to [**Google**](https://ai.google.dev/) and sign up to get your **free API key**.

    Create your query authorization credential using that API key in the **HTTP Request** nodes that require a Google credential.

    ### 🎬 Step 2: Drop in a Video  
    You’re basically all set! Now you can:
    - Upload a video using the **Form Trigger**, **OR**
    - Drop in a **YouTube URL** to have it analyzed.
    ---
    That’s it — your video analysis agent is ready to go.
    ```  

- *Failure Points:* None; informational nodes only.

---

### 3. Summary Table

| Node Name               | Node Type          | Functional Role                       | Input Node(s)          | Output Node(s)         | Sticky Note                                                    |
|-------------------------|--------------------|------------------------------------|-----------------------|------------------------|---------------------------------------------------------------|
| On form submission      | FormTrigger        | Receives video file uploads         | —                     | Upload File            | ## Form Trigger                                               |
| Upload File             | HTTP Request       | Uploads video file to Google Gemini | On form submission    | Wait                   | ## Upload File                                                |
| Wait                    | Wait               | Delays for upload processing        | Upload File            | Get Analysis            |                                                               |
| Get Analysis            | HTTP Request       | Requests detailed video analysis    | Wait, 5 seconds        | Video Analysis, 5 seconds | ## Get Analysis                                              |
| 5 seconds               | Wait               | Short delay for retry/processing    | Get Analysis           | Get Analysis            |                                                               |
| Video Analysis          | Set                | Extracts detailed analysis text     | Get Analysis           | —                      | ## Result                                                    |
| When clicking ‘Test workflow’ | ManualTrigger  | Manual trigger for YouTube analysis | —                     | YouTube Video           | # YouTube Vision                                             |
| YouTube Video           | HTTP Request       | Requests summary of YouTube video   | When clicking ‘Test workflow’ | Get Results           | # YouTube Vision                                             |
| Get Results             | Set                | Extracts summarized text            | YouTube Video          | —                      | # YouTube Vision                                             |
| Sticky Note             | StickyNote         | Labels Form Trigger block           | —                      | —                      | ## Form Trigger                                              |
| Sticky Note1            | StickyNote         | Labels Upload File block            | —                      | —                      | ## Upload File                                               |
| Sticky Note2            | StickyNote         | Labels Get Analysis block           | —                      | —                      | ## Get Analysis                                             |
| Sticky Note5            | StickyNote         | Labels Result block                 | —                      | —                      | ## Result                                                   |
| Sticky Note7            | StickyNote         | Labels YouTube Vision block        | —                      | —                      | # YouTube Vision                                            |
| Sticky Note8            | StickyNote         | Contains setup guide instructions  | —                      | —                      | # 🛠️ Setup Guide, includes link to https://ai.google.dev/   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a FormTrigger Node**  
   - Name: `On form submission`  
   - Parameters:  
     - Form Title: "Insert Video"  
     - Form Description: "Drop in a video for analysis."  
     - Add a field: Type `file`, Label `Video`, single file upload, required.  
   - Position it as the entry point for file uploads.

2. **Create HTTP Request Node for Uploading File**  
   - Name: `Upload File`  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://generativelanguage.googleapis.com/upload/v1beta/files`  
   - Authentication: Create and select a Google API key credential using HTTP Query Auth.  
   - Headers:  
     - `X-Goog-Upload-Command`: `start, upload, finalize`  
     - `X-Goog-Upload-Header-Content-Length`: Set to `={{ $binary.Video.fileSize }}`  
     - `X-Goog-Upload-Header-Content-Type`: Set to `={{ $binary.Video.fileType }}/{{ $binary.Video.fileExtension }}`  
     - `Content-Type`: Same as above  
   - Body Content-Type: binaryData  
   - Input Data Field Name: `Video` (matches form field binary key)  
   - Connect `On form submission` → `Upload File`

3. **Create a Wait Node**  
   - Name: `Wait`  
   - Default wait (no duration set)  
   - Connect `Upload File` → `Wait`

4. **Create HTTP Request Node for Getting Analysis**  
   - Name: `Get Analysis`  
   - Method: POST  
   - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`  
   - Authentication: Use same Google API key credential  
   - Headers: `Content-Type: application/json`  
   - Body (JSON, raw):  
     ```json
     {
       "contents": [
         {
           "role": "user",
           "parts": [
             {
               "fileData": {
                 "fileUri": "={{ $json.file.uri }}",
                 "mimeType": "={{ $json.file.mimeType }}"
               }
             },
             {
               "text": "Describe what's going on in the video in great detail. Describe the entire video."
             }
           ]
         }
       ]
     }
     ```  
   - On Error: Continue workflow with error output  
   - Connect `Wait` → `Get Analysis`

5. **Create a Wait Node of 5 seconds**  
   - Name: `5 seconds`  
   - Set fixed wait time: 5 seconds  
   - Connect `Get Analysis` secondary output (index 1) → `5 seconds`  
   - Connect `5 seconds` → `Get Analysis` (loop back for retry or additional processing)

6. **Create a Set Node for Video Analysis Result**  
   - Name: `Video Analysis`  
   - Add string field `Video Analysis` assigned to: `={{ $json.candidates[0].content.parts[0].text }}`  
   - Connect `Get Analysis` primary output (index 0) → `Video Analysis`

7. **Create Manual Trigger Node for YouTube Testing**  
   - Name: `When clicking ‘Test workflow’`  
   - Disabled by default  
   - Connect output → `YouTube Video`

8. **Create HTTP Request Node for YouTube Video Analysis**  
   - Name: `YouTube Video`  
   - Method: POST  
   - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`  
   - Authentication: Google API key credential  
   - Body (JSON, raw):  
     ```json
     {
       "contents": [
         {
           "parts": [
             { "text": "Please summarize the video in 3 sentences." },
             { "file_data": { "file_uri": "https://youtu.be/gwCQF--cARA?si=uCbaUnoRlEjHO50a" } }
           ]
         }
       ]
     }
     ```
   - Connect `When clicking ‘Test workflow’` → `YouTube Video`

9. **Create Set Node for YouTube Analysis Result**  
   - Name: `Get Results`  
   - Add string field `text` assigned to: `={{ $json.candidates[0].content.parts[0].text }}`  
   - Connect `YouTube Video` → `Get Results`

10. **Add Sticky Notes**  
    - Add informative sticky notes for blocks to improve clarity (optional but recommended).  
    - Include the setup guide sticky note with instructions and the link to https://ai.google.dev/.

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                         |
|------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| Author: Lee Wei                                                                                                                     | Project credit                        |
| Step 1: Get your free API key at [Google AI](https://ai.google.dev/) and create a query authorization credential for HTTP nodes. | Setup instruction                     |
| Two input methods supported: Form-uploaded video files and YouTube video URLs for analysis.                                        | Workflow functionality summary        |
| The workflow uses Google Gemini AI’s `gemini-2.0-flash` model for video content generation and summarization.                      | Model specification                   |
| The file upload uses Google’s resumable upload protocol with headers `X-Goog-Upload-Command`.                                        | API integration detail                |
| Error handling on "Get Analysis" node continues workflow even on errors to avoid halting.                                           | Robustness feature                    |
| YouTube URL is currently hardcoded for testing; this can be parameterized for dynamic input.                                        | Enhancement suggestion                |

---

This document provides a detailed, stepwise breakdown of the "Analyze Videos with Google Gemini AI - Form Uploads & YouTube Links" workflow, enabling reproduction, modification, and troubleshooting by advanced users or automation agents.