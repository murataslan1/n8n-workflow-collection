Automate ASMR Video Creation and Distribution with FalAI and Social Media Integration

https://n8nworkflows.xyz/workflows/automate-asmr-video-creation-and-distribution-with-falai-and-social-media-integration-5553


# Automate ASMR Video Creation and Distribution with FalAI and Social Media Integration

### 1. Workflow Overview

This workflow automates the creation and distribution of ASMR-style glass-cutting videos using AI-driven prompt generation, video generation via FalAI, and social media posting via Blotato. Its target use cases include content creators and marketers aiming to produce visually and sonically engaging ASMR videos featuring glass objects and efficiently share them on platforms like YouTube, TikTok, and Instagram.

The workflow is logically divided into the following blocks:

- **1.1 Input and Historical Data Retrieval:** Fetches previously used ASMR glass objects from Google Sheets to avoid repetitions.
- **1.2 Idea Generation:** Uses an AI agent to propose a new glass object (fruit) that fits aesthetic and physical criteria.
- **1.3 Video Prompt Generation:** Crafts a detailed, cinematic text prompt optimized for ASMR glass-cutting videos using an AI language model.
- **1.4 Video Generation and Polling:** Sends the prompt to FalAI’s video generation API, waits for completion by polling status.
- **1.5 Result Handling and Storage:** Extracts the generated video URL, updates the Google Sheet by deleting the oldest entry and appending the new object and video URL.
- **1.6 Upload and Social Media Posting:** Uploads the video to Blotato and posts automatically to YouTube, TikTok, and Instagram using Blotato’s API.

---

### 2. Block-by-Block Analysis

#### 2.1 Input and Historical Data Retrieval

- **Overview:** Retrieves the last 7 ASMR glass objects from a Google Sheet to ensure new content uniqueness.
- **Nodes Involved:**  
  - When clicking ‘Execute workflow’ (Manual Trigger)  
  - Get Past Objects (Google Sheets)  
  - Aggregate  
  - Set Object List  

##### Node Details

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Initiates the workflow manually.  
  - Inputs: None  
  - Outputs: Triggers "Get Past Objects"  
  - Edge Cases: None significant.

- **Get Past Objects**  
  - Type: Google Sheets  
  - Role: Reads a sheet tab containing past ASMR objects and video URLs.  
  - Configuration: Requires OAuth2 Google Sheets credentials; user must specify correct Document ID and Sheet Name.  
  - Input: Trigger node  
  - Output: Raw rows of objects and video URLs  
  - Failure Modes: 404 errors if sheet ID or range is incorrect; auth failures if OAuth invalid.

- **Aggregate**  
  - Type: Aggregate  
  - Role: Aggregates all rows' data into a single array for processing.  
  - Input: Get Past Objects output  
  - Output: Aggregated data array  
  - Edge Cases: Empty or malformed sheet data.

- **Set Object List**  
  - Type: Set  
  - Role: Extracts exactly 7 objects from aggregated data into an array named `objects`.  
  - Key Expression:  
    ```
    =[ "{{ $json.data[0].Object }}", "{{ $json.data[1].Object }}", ..., "{{ $json.data[6].Object }}" ]
    ```  
  - Input: Aggregated data  
  - Output: JSON with `objects` array for next node  
  - Edge Cases: Less than 7 entries cause undefined references; must ensure sheet has at least 7 rows.

---

#### 2.2 Idea Generation

- **Overview:** An AI agent analyzes the last 7 objects and proposes 1 new unique fruit object suitable for ASMR glass-cutting video creation.
- **Nodes Involved:**  
  - Idea Agent  

##### Node Details

- **Idea Agent**  
  - Type: Langchain Agent (OpenAI-based)  
  - Role: Receives the array of objects and outputs a JSON with the new glass object and caption.  
  - Configuration:  
    - System message instructs AI to pick a unique fruit not in the list, physically reasonable to cut, visually aesthetic as glass.  
    - Input text expression: `=Objects: {{ $json.objects.join(", ") }}`  
  - Output Parsing: Structured JSON with keys `object` and `caption`.  
  - Input: From Set Object List  
  - Output: New object JSON  
  - Edge Cases: AI may output invalid JSON or repeat fruits if prompt misunderstood; output parser helps mitigate.

---

#### 2.3 Video Prompt Generation

- **Overview:** Produces a detailed text prompt describing the cinematic ASMR scene of cutting the chosen glass object, tailored for FalAI video generation.
- **Nodes Involved:**  
  - Prompt Agent  
  - OpenAI Chat Model  
  - Object & Caption (output parser structured)  

##### Node Details

- **Prompt Agent**  
  - Type: Langchain Agent  
  - Role: Generates hyper-detailed video prompt based on the new object from Idea Agent.  
  - Configuration:  
    - System message defines strict format and rich ASMR sensory details, cutting action, sound layers, and visual style.  
    - Input text is the chosen object’s name from Idea Agent output:  
      ```
      ={{ $json.output?.object || "Please generate an ASMR video prompt for an object." }}
      ```  
  - Input: From Idea Agent  
  - Output: Text prompt for video generation  
  - Edge Cases: Empty or malformed input could cause incomplete prompt.

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat  
  - Role: Underlying LLM used by both Idea Agent and Prompt Agent.  
  - Config: Model `gpt-4o-mini` selected.  
  - Credentials: Requires OpenAI API key.  
  - Edge Cases: Rate limits, API errors.

- **Object & Caption**  
  - Type: Output Parser Structured  
  - Role: Parses AI output into JSON format with keys for object and caption, enabling downstream nodes to use them reliably.  
  - Input: Idea Agent output

---

#### 2.4 Video Generation and Polling

- **Overview:** Sends the crafted prompt to FalAI’s video generation API, waits for processing with timed delays, polls for completion, and retrieves the final video URL.
- **Nodes Involved:**  
  - Generate Video  
  - 5 Minutes - Wait for Video  
  - Get Result  
  - 1 Minute - Video taking longer please wait  
  - Result  

##### Node Details

- **Generate Video**  
  - Type: HTTP Request  
  - Role: POSTs the cleaned prompt to FalAI video generation endpoint.  
  - Configuration:  
    - URL: `https://queue.fal.run/fal-ai/veo3`  
    - Method: POST  
    - Body Parameters:  
      - `prompt`: cleansed prompt string with newlines/quotes removed  
      - `aspect_ratio`: "9:16"  
      - `generate_audio`: true  
    - Authentication: Header Auth with FalAI API key (Authorization header with `key YOUR_FALAI_API_KEY`)  
  - Input: Prompt Agent output  
  - Output: Request ID for polling  
  - Edge Cases: Auth errors, malformed prompt, API downtime.

- **5 Minutes - Wait for Video**  
  - Type: Wait  
  - Role: Waits 5 minutes before polling result to allow video generation.  
  - Input: Generate Video output

- **Get Result**  
  - Type: HTTP Request  
  - Role: Polls FalAI API for video generation status using request ID.  
  - Configuration:  
    - URL: `https://queue.fal.run/fal-ai/veo3/requests/{{ $json.request_id }}`  
    - Method: GET  
    - Authentication: Same FalAI Header Auth  
  - On Error: Continues with error output, allowing retry or fallback.  
  - Output: Video URL if done, or status.  
  - Input: Wait node(s) output  
  - Edge Cases: Timeouts, polling failures, incomplete video generation.

- **1 Minute - Video taking longer please wait**  
  - Type: Wait  
  - Role: Secondary wait for additional minute before retrying Get Result if video not ready.  
  - Input: Get Result error output  
  - Output: Retry Get Result

- **Result**  
  - Type: Set  
  - Role: Extracts and sets the final video URL from the Get Result output for downstream use.  
  - Assigns: `Video URL` string from `$json.video.url`

---

#### 2.5 Result Handling and Storage

- **Overview:** Updates the Google Sheet by deleting the oldest ASMR object entry and appending the newly generated object and video URL.
- **Nodes Involved:**  
  - Delete First Row  
  - Append Object  

##### Node Details

- **Delete First Row**  
  - Type: Google Sheets  
  - Role: Deletes the first row (oldest entry) to keep sheet size constant.  
  - Operation: Delete  
  - Requires: OAuth2 Google Sheets credentials, correct document ID and sheet name.  
  - Input: Result node output  
  - Edge Cases: Incorrect range or sheet ID causes 404; deleting empty rows may error.

- **Append Object**  
  - Type: Google Sheets  
  - Role: Appends a new row with the object name and video URL.  
  - Operation: Append  
  - Inputs:  
    - Object: `{{ $('Idea Agent').item.json.output.object }}`  
    - URL: `{{ $('Result').item.json['Video URL'] }}`  
  - Credentials: Same Google OAuth  
  - Output: Triggers the Upload node next.

---

#### 2.6 Upload and Social Media Posting

- **Overview:** Uploads the generated video URL to Blotato, then posts it to YouTube, Instagram, and TikTok automatically.
- **Nodes Involved:**  
  - Upload  
  - YouTube  
  - Instagram  
  - TikTok  

##### Node Details

- **Upload**  
  - Type: HTTP Request  
  - Role: Sends the video URL to Blotato media endpoint for hosting and management.  
  - URL: `https://backend.blotato.com/v2/media`  
  - Method: POST  
  - Body Parameters: JSON with the `url` field containing the video URL.  
  - Authentication: Header Auth with Blotato API key (`blotato-api-key`)  
  - Input: Append Object output  

- **YouTube**  
  - Type: HTTP Request  
  - Role: Creates a YouTube post with title and media URL via Blotato.  
  - Body: JSON with caption from Idea Agent and video media URL, privacy set to public, no subscriber notification.  
  - Authentication: Blotato Header Auth  
  - Input: Upload output  
  - Edge Cases: 401 errors if credentials invalid; empty media URL leads to silent failure.

- **Instagram**  
  - Type: HTTP Request  
  - Role: Posts video to Instagram using Blotato API with caption and media URL.  
  - Authentication: Blotato Header Auth  
  - Input: Upload output  

- **TikTok**  
  - Type: HTTP Request  
  - Role: Posts video on TikTok with metadata (e.g., disabling duet, stitch, comments) and the media URL.  
  - Authentication: Blotato Header Auth  
  - Input: Upload output  

---

### 3. Summary Table

| Node Name                      | Node Type                      | Functional Role                                      | Input Node(s)                 | Output Node(s)                      | Sticky Note                                                                                                  |
|--------------------------------|--------------------------------|-----------------------------------------------------|-------------------------------|------------------------------------|--------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’| Manual Trigger                 | Manual workflow start                               | None                          | Get Past Objects                  |                                                                                                              |
| Get Past Objects               | Google Sheets                  | Fetch last ASMR objects from Google Sheet           | When clicking ‘Execute workflow’ | Aggregate                        | Connect your Google Sheets OAuth2 credentials; sheet ID and range must be correct (Sticky Note9)             |
| Aggregate                     | Aggregate                     | Aggregate fetched rows into array                    | Get Past Objects              | Set Object List                   |                                                                                                              |
| Set Object List               | Set                           | Extract 7 objects into array                          | Aggregate                     | Idea Agent                      |                                                                                                              |
| Idea Agent                   | Langchain Agent                | Generate new unique fruit object                      | Set Object List               | Prompt Agent                    | Sticky Note7 (Idea Agent section), Sticky Note4                                                              |
| Prompt Agent                 | Langchain Agent                | Generate detailed ASMR video prompt                   | Idea Agent                   | Generate Video                  | Sticky Note1, Sticky Note3                                                                                    |
| OpenAI Chat Model             | Langchain OpenAI Chat          | Provides LLM for Idea and Prompt Agent               | -                            | Idea Agent, Prompt Agent          | Requires OpenAI API key                                                                                       |
| Generate Video                | HTTP Request                   | Send prompt to FalAI video generation                 | Prompt Agent                 | 5 Minutes - Wait for Video       | Sticky Note3 (FalAI API key setup)                                                                            |
| 5 Minutes - Wait for Video    | Wait                          | Delay to allow video generation                        | Generate Video               | Get Result                      |                                                                                                              |
| Get Result                   | HTTP Request                   | Poll for FalAI video completion                        | 5 Minutes - Wait for Video, 1 Minute - Video taking longer please wait | Result, 1 Minute - Video taking longer please wait | Sticky Note5 (FalAI polling credential)                                                                       |
| 1 Minute - Video taking longer please wait | Wait              | Additional delay before retrying poll                  | Get Result                   | Get Result                      |                                                                                                              |
| Result                       | Set                           | Extract final video URL from FalAI response           | Get Result                   | Delete First Row                |                                                                                                              |
| Delete First Row             | Google Sheets                  | Delete oldest video entry in Google Sheet             | Result                       | Append Object                  | Sticky Note9 (Google Sheets setup details)                                                                    |
| Append Object               | Google Sheets                  | Append new object and video URL entry                  | Delete First Row             | Upload                        | Sticky Note11 (Google Sheets append instructions)                                                             |
| Upload                      | HTTP Request                   | Upload video URL to Blotato media                      | Append Object               | YouTube, Instagram, TikTok     | Sticky Note6 (Blotato API key credential must be separate from FalAI key)                                     |
| YouTube                     | HTTP Request                   | Post video to YouTube via Blotato                      | Upload                      | None                          | Sticky Note8 (Blotato accountId and API key needed; media URL required)                                        |
| Instagram                   | HTTP Request                   | Post video to Instagram via Blotato                    | Upload                      | None                          | Sticky Note8                                                                                                  |
| TikTok                      | HTTP Request                   | Post video to TikTok via Blotato                       | Upload                      | None                          | Sticky Note8                                                                                                  |
| Sticky Note(s)              | Sticky Note                   | Informational / setup guidance                         | Various                      | None                          | Multiple notes covering setup instructions and node roles throughout the workflow                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**  
   - Name: "When clicking ‘Execute workflow’"  
   - Type: Manual Trigger.

2. **Add Google Sheets Node to Retrieve Past Objects:**  
   - Name: "Get Past Objects"  
   - Operation: Read rows from Google Sheet  
   - Configure OAuth2 Google Sheets credentials.  
   - Set Document ID and Sheet Name pointing to your ASMR list sheet.

3. **Add Aggregate Node:**  
   - Name: "Aggregate"  
   - Aggregation: Aggregate all item data into one array.

4. **Add Set Node for Object List:**  
   - Name: "Set Object List"  
   - Define `objects` as an array of the first 7 rows' "Object" field with expressions:  
     ```
     =["{{ $json.data[0].Object }}", ..., "{{ $json.data[6].Object }}"]
     ```

5. **Add Langchain Agent Node for Idea Generation:**  
   - Name: "Idea Agent"  
   - Use Langchain Agent with OpenAI Chat Model (model gpt-4o-mini).  
   - Input Text: `=Objects: {{ $json.objects.join(", ") }}`  
   - System Prompt instructs to generate 1 new fruit object not in the list with JSON output format `{ object, caption }`.  
   - Connect OpenAI API credentials.

6. **Add Langchain Agent Node for Prompt Generation:**  
   - Name: "Prompt Agent"  
   - Input: The `object` from "Idea Agent" output.  
   - System Prompt: Detailed instructions to create cinematic ASMR video prompt for FalAI.  
   - Use same OpenAI credentials.

7. **Add HTTP Request Node to Generate Video:**  
   - Name: "Generate Video"  
   - Method: POST  
   - URL: `https://queue.fal.run/fal-ai/veo3`  
   - Body: JSON with prompt (cleaned), aspect_ratio "9:16", generate_audio true.  
   - Authentication: Header Auth with header "Authorization" and value `key YOUR_FALAI_API_KEY`. Create this credential in n8n.  
   - Connect input from "Prompt Agent".

8. **Add Wait Node:**  
   - Name: "5 Minutes - Wait for Video"  
   - Wait time: 5 minutes.  
   - Connect output from "Generate Video".

9. **Add HTTP Request Node to Poll FalAI Result:**  
   - Name: "Get Result"  
   - Method: GET  
   - URL: `https://queue.fal.run/fal-ai/veo3/requests/{{ $json.request_id }}`  
   - Authentication: Same FalAI Header Auth as "Generate Video"  
   - On Error: Continue with error output (to allow retries).  
   - Connect input from "5 Minutes - Wait for Video" and from "1 Minute - Video taking longer please wait".

10. **Add Wait Node for Additional Polling Delay:**  
    - Name: "1 Minute - Video taking longer please wait"  
    - Wait time: 1 minute.  
    - Connect error output of "Get Result" to this node, then connect this node back to "Get Result".

11. **Add Set Node to Extract Video URL:**  
    - Name: "Result"  
    - Assign variable "Video URL" from `{{$json.video.url}}` from "Get Result".  
    - Connect output from successful "Get Result".

12. **Add Google Sheets Node to Delete First Row:**  
    - Name: "Delete First Row"  
    - Operation: Delete  
    - Configure with same Google Sheets OAuth2 credentials and correct document ID and sheet name.  
    - Connect input from "Result".

13. **Add Google Sheets Node to Append New Object:**  
    - Name: "Append Object"  
    - Operation: Append row  
    - Fields:  
      - Object: `{{ $('Idea Agent').item.json.output.object }}`  
      - Video URL: `{{ $('Result').item.json['Video URL'] }}`  
    - Connect input from "Delete First Row".

14. **Add HTTP Request Node to Upload Video to Blotato:**  
    - Name: "Upload"  
    - Method: POST  
    - URL: `https://backend.blotato.com/v2/media`  
    - Body: JSON with `"url": "{{ $json['Video URL'] }}"`  
    - Authentication: Header Auth with header name "blotato-api-key" and your Blotato API key (must be a separate credential from FalAI).  
    - Connect input from "Append Object".

15. **Add HTTP Request Nodes for Social Media Posting:**  
    - Names: "YouTube", "Instagram", "TikTok"  
    - Method: POST  
    - URL: `https://backend.blotato.com/v2/posts`  
    - Body: JSON structured per platform with caption from `{{ $('Idea Agent').item.json.output.caption }}` and media URL from upload output.  
    - Authentication: Same Blotato Header Auth credential.  
    - Connect input from "Upload".

16. **Connect OpenAI Chat Model Node:**  
    - Name: "OpenAI Chat Model"  
    - Model: `gpt-4o-mini`  
    - Connect as AI language model for "Idea Agent" and "Prompt Agent" nodes.

17. **Add Sticky Notes at Appropriate Positions:**  
    - Add informational sticky notes for setup instructions, API key info, credential setup, and Google Sheets template link.

---

### 5. General Notes & Resources

| Note Content                                                                                                                            | Context or Link                                                                                     |
|-----------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Download and copy the Google Sheets template named “yourname ASMR” to track objects and videos.                                        | [Google Sheets Template](https://docs.google.com/spreadsheets/d/14Qe2rz2BYykBEnGzab-TSm-RP8TTpkjbh4e6GAMPX74/edit?usp=sharing) |
| Create separate Header Auth credentials in n8n for FalAI (`Authorization: key YOUR_FALAI_API_KEY`) and Blotato (`blotato-api-key`).    | API key management requirement                                                                      |
| Blotato account setup required for automatic social media posting; insert your Blotato `accountId` in the respective nodes JSON body. | https://www.blotato.com/                                                                            |
| Media URL must be valid and non-empty to avoid silent failures or 401 errors when posting to social media via Blotato.                 |                                                                                                   |
| Workflow setup can be fully done in ~15-20 minutes with these detailed instructions.                                                     |                                                                                                   |
| Use the n8n helper on ChatGPT for setup or debugging assistance; it has high effectiveness for this workflow.                          |                                                                                                   |

---

**Disclaimer:** The text provided originates solely from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.