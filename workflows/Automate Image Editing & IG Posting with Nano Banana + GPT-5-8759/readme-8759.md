Automate Image Editing & IG Posting with Nano Banana + GPT-5

https://n8nworkflows.xyz/workflows/automate-image-editing---ig-posting-with-nano-banana---gpt-5-8759


# Automate Image Editing & IG Posting with Nano Banana + GPT-5

### 1. Workflow Overview

This workflow automates the process of editing images uploaded to a specific Google Drive folder, enhancing them via the Nano Banana AI service, and then posting the final images to Instagram using the Postiz platform. It integrates AI-generated captions tailored for Instagram posts using GPT-5. The workflow is structured into several logical blocks that handle file detection, image processing, result polling, uploading, caption generation, and social media posting.

Logical blocks:

- **1.1 Input Reception**: Detect new image uploads in a designated Google Drive folder.
- **1.2 Image Editing via Nano Banana API**: Send the uploaded image for AI-based cleanup and enhancement.
- **1.3 Result Polling & Verification**: Wait and poll for the completion of the image editing process.
- **1.4 Image Retrieval and Upload**: Download the edited image and upload it to Postiz.
- **1.5 Logging**: Append information about the edited image and posting status to Google Sheets logs.
- **1.6 Caption Generation**: Use GPT-5 to generate an Instagram caption based on the image description.
- **1.7 Instagram Posting**: Post the edited image along with the generated caption to Instagram via Postiz.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Watches a specific Google Drive folder for new image files to trigger the workflow.
- **Nodes Involved:**  
  - Google Drive Trigger  
- **Node Details:**

  - **Google Drive Trigger**
    - Type: Trigger node for Google Drive events.
    - Configuration: Watches a specific folder (`YOUR_FOLDER_ID`) for new files created, polling every minute.
    - Key Variables: The uploaded file's metadata including `webContentLink` and `name`.
    - Input: None (trigger node).
    - Output: Passes the new file metadata to the next node.
    - Failures: Potential auth errors if Google credentials expire; folder ID must be valid.
    - Notes: Requires Google Drive OAuth credentials configured.

---

#### 2.2 Image Editing via Nano Banana API

- **Overview:** Sends the new image URL to the Nano Banana API to perform AI-based image cleanup and enhancement.
- **Nodes Involved:**  
  - Nano Banana POST Request  
- **Node Details:**

  - **Nano Banana POST Request**
    - Type: HTTP Request node.
    - Configuration: POSTs to `https://api.wavespeed.ai/api/v3/google/nano-banana/edit` with JSON body containing the image URL and a detailed prompt requesting decluttering and lighting enhancement while preserving the apartment's structure.
    - Key Expressions: Image URL is inserted dynamically from `{{ $json.webContentLink }}`.
    - Authentication: Uses generic HTTP header authentication (API key or token).
    - Input: Receives file metadata from Google Drive Trigger.
    - Output: Returns a prediction request ID to track processing.
    - Failures: API auth errors, network timeouts, malformed request body.
    - Notes: Requires valid Nano Banana API credentials.

---

#### 2.3 Result Polling & Verification

- **Overview:** Waits and polls the Nano Banana API for the completion of the image editing process.
- **Nodes Involved:**  
  - Wait 15 Secs  
  - GET Result from Nano Banana Node  
  - If  
  - Wait 15 Secs Again  
- **Node Details:**

  - **Wait 15 Secs**
    - Type: Wait node.
    - Configuration: Pauses workflow for 15 seconds to allow Nano Banana processing.
    - Input: From Nano Banana POST Request.
    - Output: Triggers result polling.
    - Edge cases: Excessive API latency may require longer wait.

  - **GET Result from Nano Banana Node**
    - Type: HTTP Request node.
    - Configuration: GET request to `https://api.wavespeed.ai/api/v3/predictions/{{ $json.data.id }}/result` to fetch processing status and result.
    - Authentication: Same generic HTTP header auth as POST.
    - Input: Receives prediction `id`.
    - Output: JSON with status and edited image URL.
    - Failures: Invalid or expired prediction id, API errors, network timeouts.

  - **If**
    - Type: Conditional node.
    - Configuration: Checks if `data.status` equals `"completed"`.
    - Input: From GET Result node.
    - Output: If completed, continue; else, wait and poll again.
    - Edge cases: Infinite loop risks if status never completes; no explicit max retries.

  - **Wait 15 Secs Again**
    - Type: Wait node.
    - Configuration: Another 15-second pause before re-polling result if not completed.
    - Input: From If node (false branch).
    - Output: Loops back to GET Result node.
    - Edge cases: Same as previous wait node.

---

#### 2.4 Image Retrieval and Upload

- **Overview:** Downloads the edited image and uploads it to Postiz for social media posting.
- **Nodes Involved:**  
  - Append row in sheet  
  - Get Image  
  - Upload to Postiz  
  - Update Log  
- **Node Details:**

  - **Append row in sheet**
    - Type: Google Sheets node.
    - Configuration: Appends a new row with columns "Image URL" (edited image URL) and "Timestamp" to a specified Google Sheet.
    - Inputs: Receives from If node on success.
    - Outputs: Passes to Get Image node.
    - Failures: Google Sheets API errors, permission issues, sheet ID/name must be valid.

  - **Get Image**
    - Type: HTTP Request node.
    - Configuration: Downloads the edited image binary from the URL stored in `Image URL`.
    - Input: Receives edited image URL from Append row node.
    - Output: Passes binary data to Upload to Postiz.
    - Failures: URL invalid or expired, network errors.

  - **Upload to Postiz**
    - Type: HTTP Request node.
    - Configuration: POSTs multipart form data with binary image file to `https://api.postiz.com/public/v1/upload`.
    - Authentication: Generic HTTP header auth (API key or token).
    - Input: Receives binary image data.
    - Output: Returns uploaded file ID and path.
    - Failures: API errors, auth failures, network issues.

  - **Update Log**
    - Type: Google Sheets node.
    - Configuration: Appends a row with "Status" as "Uploaded to Postiz", current timestamp, and the original file name to a separate Google Sheet log.
    - Input: From Upload to Postiz node.
    - Output: Passes image name to Caption Agent node.
    - Failures: Google Sheets API errors, permission issues.

---

#### 2.5 Caption Generation

- **Overview:** Uses GPT-5 to generate a short, engaging Instagram caption based on the image description.
- **Nodes Involved:**  
  - Caption Agent  
  - OpenAI Chat Model  
- **Node Details:**

  - **Caption Agent**
    - Type: LangChain Agent node.
    - Configuration: Receives image name and description text, uses system message to instruct GPT-5 to create a friendly, impactful caption without special characters or explanations.
    - Input: From Update Log node.
    - Output: Passes generated caption to Instagram posting node.
    - Edge cases: Model may produce unexpected output if prompt misinterpreted.

  - **OpenAI Chat Model**
    - Type: LangChain OpenAI Chat Model node.
    - Configuration: Uses GPT-5 model.
    - Input: Linked internally as AI language model for Caption Agent.
    - Output: Provides text generation capability.
    - Failures: API quota limits, auth errors, timeouts.

---

#### 2.6 Instagram Posting

- **Overview:** Posts the edited image with the generated caption to Instagram via Postiz.
- **Nodes Involved:**  
  - Post to Instagram  
- **Node Details:**

  - **Post to Instagram**
    - Type: HTTP Request node.
    - Configuration: POSTs JSON to `https://api.postiz.com/public/v1/posts` with the caption text and uploaded image ID/path.
    - Authentication: Generic HTTP header auth.
    - Input: Receives caption text from Caption Agent and image upload info from Upload to Postiz.
    - Output: Terminal node.
    - Failures: API errors, auth issues, invalid post data.

---

### 3. Summary Table

| Node Name                   | Node Type                          | Functional Role                        | Input Node(s)                 | Output Node(s)                    | Sticky Note                                   |
|-----------------------------|----------------------------------|-------------------------------------|------------------------------|---------------------------------|-----------------------------------------------|
| Google Drive Trigger         | Google Drive Trigger              | Detect new images in Drive folder   | None                         | Nano Banana POST Request         | Drive Trigger                                 |
| Nano Banana POST Request     | HTTP Request                     | Send image for AI editing           | Google Drive Trigger          | Wait 15 Secs                    | Drive Trigger                                 |
| Wait 15 Secs                | Wait                            | Pause before polling result         | Nano Banana POST Request      | GET Result from Nano Banana Node | Get Results from Nano Banana                   |
| GET Result from Nano Banana Node | HTTP Request                 | Poll Nano Banana for results        | Wait 15 Secs                 | If                            | Get Results from Nano Banana                   |
| If                          | If                              | Check if editing completed          | GET Result from Nano Banana Node | Append row in sheet, Wait 15 Secs Again | Get Results from Nano Banana                   |
| Wait 15 Secs Again           | Wait                            | Wait before retry                   | If (false branch)             | GET Result from Nano Banana Node | Get Results from Nano Banana                   |
| Append row in sheet          | Google Sheets                   | Log edited image URL & timestamp    | If (true branch)              | Get Image                      | Get Image and Upload                          |
| Get Image                   | HTTP Request                    | Download edited image               | Append row in sheet           | Upload to Postiz                | Get Image and Upload                          |
| Upload to Postiz             | HTTP Request                    | Upload image to Postiz              | Get Image                    | Update Log                     | Get Image and Upload                          |
| Update Log                  | Google Sheets                   | Log post status and filename        | Upload to Postiz             | Caption Agent                  |                                               |
| Caption Agent               | LangChain Agent                 | Generate Instagram caption          | Update Log                   | Post to Instagram              | Caption for IG                               |
| OpenAI Chat Model           | LangChain OpenAI Chat Model     | GPT-5 text generation               | Caption Agent (AI model link) | Caption Agent                 | Caption for IG                               |
| Post to Instagram           | HTTP Request                    | Post image and caption to Instagram| Caption Agent                | None                          | Post to IG                                   |
| Sticky Note                 | Sticky Note                    | Notes                             | None                         | None                          | See respective node rows                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger Node**
   - Type: Google Drive Trigger
   - Set event to `fileCreated`
   - Set folder to watch: specify your folder ID (`YOUR_FOLDER_ID`)
   - Set polling interval to every minute
   - Configure Google Drive OAuth2 credentials

2. **Add HTTP Request Node for Nano Banana POST Request**
   - URL: `https://api.wavespeed.ai/api/v3/google/nano-banana/edit`
   - Method: POST
   - Body content type: JSON
   - JSON Body:
     ```json
     {
       "enable_base64_output": false,
       "enable_sync_mode": false,
       "images": ["{{ $json.webContentLink }}"],
       "output_format": "jpeg",
       "prompt": "Clean up and declutter this apartment unit: remove all mess, trash, and personal items while keeping the original furniture, layout, and design intact. Tidy up surfaces, straighten objects, and make the space look neat and inviting. Enhance the lighting to appear bright and natural, similar to professional real-estate photography, without altering the structure or style of the apartment."
     }
     ```
   - Authentication: Generic HTTP Header Auth; configure Nano Banana API key/token
   - Connect output of Google Drive Trigger to this node

3. **Add Wait Node ("Wait 15 Secs")**
   - Wait time: 15 seconds
   - Connect output of Nano Banana POST Request to this node

4. **Add HTTP Request Node for GET Result from Nano Banana**
   - URL: `https://api.wavespeed.ai/api/v3/predictions/{{ $json.data.id }}/result`
   - Method: GET
   - Authentication: Same as Nano Banana POST Request
   - Connect output of Wait 15 Secs to this node

5. **Add If Node to Check Completion**
   - Condition: `$json.data.status` equals `completed`
   - Connect output of GET Result node to this node

6. **Add Wait Node ("Wait 15 Secs Again")**
   - Wait time: 15 seconds
   - Connect false output of If node to this wait node
   - Connect output of this wait node back to GET Result node (loop)

7. **Add Google Sheets Node ("Append row in sheet")**
   - Operation: Append
   - Document ID: your target Google Sheet ID (`YOUR_SHEET_ID`)
   - Sheet Name: your target sheet name (`YOUR_SHEET_NAME`)
   - Columns: "Image URL" mapped to `{{$json.data.outputs[0]}}`, "Timestamp" mapped to `{{$now}}`
   - Connect true output of If node to this node
   - Configure Google Sheets OAuth2 credentials

8. **Add HTTP Request Node ("Get Image")**
   - Method: GET
   - URL: `{{$json["Image URL"]}}`
   - Connect output of Append row in sheet to this node

9. **Add HTTP Request Node ("Upload to Postiz")**
   - URL: `https://api.postiz.com/public/v1/upload`
   - Method: POST
   - Content-Type: multipart/form-data
   - Body Parameters: add formBinaryData parameter for key "file" with input data field name "data"
   - Authentication: Generic HTTP Header Auth; configure Postiz API key/token
   - Connect output of Get Image to this node

10. **Add Google Sheets Node ("Update Log")**
    - Operation: Append
    - Document ID: your log Google Sheet ID (`YOUR_SHEET_ID`)
    - Sheet Name: your log sheet name (`YOUR_SHEET_NAME`)
    - Columns: "Status" = "Uploaded to Postiz", "Timestamp" = `{{$now}}`, "Video Name and Description" = `{{$node["Google Drive Trigger"].item.json.name}}`
    - Connect output of Upload to Postiz to this node

11. **Add LangChain Agent Node ("Caption Agent")**
    - Text: `{{$json["Video Name and Description"]}}`
    - System Message: instruct the model to generate a friendly, impactful Instagram caption with no special characters or explanations.
    - Prompt Type: Define
    - Connect output of Update Log to this node

12. **Add LangChain OpenAI Chat Model Node ("OpenAI Chat Model")**
    - Model: GPT-5
    - Connect as AI model input to Caption Agent node

13. **Add HTTP Request Node ("Post to Instagram")**
    - URL: `https://api.postiz.com/public/v1/posts`
    - Method: POST
    - Content-Type: JSON
    - JSON Body:
      ```json
      {
        "type": "now",
        "shortLink": false,
        "date": "{{ new Date($now).toISOString() }}",
        "tags": [],
        "posts": [
          {
            "integration": { "id": "cmeku38qa00cpo90yfw4ai6lt" },
            "value": [
              {
                "content": "{{ $json.output }}",
                "image": [
                  {
                    "id": "{{ $node['Upload to Postiz'].json.id }}",
                    "path": "{{ $node['Upload to Postiz'].json.path }}"
                  }
                ]
              }
            ],
            "settings": {
              "post_type": "post"
            }
          }
        ]
      }
      ```
    - Authentication: Generic HTTP Header Auth; configure Postiz API key/token
    - Connect output of Caption Agent to this node

---

### 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                                 |
|----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| The workflow requires valid API credentials for Google Drive, Nano Banana API, OpenAI GPT-5, and Postiz services.                | Credential setup in n8n credentials manager                    |
| The prompt for Nano Banana is carefully crafted to maintain furniture and layout while enhancing lighting and tidiness.          | Nano Banana API documentation for prompt design                 |
| The GPT-5 caption generation avoids special characters and extra formatting to fit Instagram's typical caption style.             | GPT-5 prompt engineering best practices                         |
| Postiz is used both for image hosting and Instagram posting integration via their public API.                                      | https://api.postiz.com/public/v1/                              |
| Polling logic loops indefinitely until Nano Banana processing completes; consider adding retry limits or error handling for robustness. | Recommended enhancement for production readiness               |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow built with n8n, an integration and automation tool. The processing strictly follows current content policies and contains no illegal, offensive, or protected elements. All data handled are legal and public.