Anonymize Faces and License Plates in Media with BlurIt

https://n8nworkflows.xyz/workflows/anonymize-faces-and-license-plates-in-media-with-blurit-8535


# Anonymize Faces and License Plates in Media with BlurIt

---

### 1. Workflow Overview

This workflow automates the anonymization of faces and license plates in media files (images or videos) by integrating with the BlurIt API. It is designed for use cases such as anonymizing dashcam footage, securing photos before public sharing, and ensuring compliance with privacy regulations like GDPR.

The workflow’s logic is divided into the following functional blocks:

- **1.1 Input Reception**: Receives media file uploads via a web form.
- **1.2 Authentication**: Configures and obtains an access token from BlurIt API.
- **1.3 Task Creation**: Submits the media file to BlurIt to create an anonymization task with specified blur settings.
- **1.4 Task Monitoring**: Polls the BlurIt API to check the status of the anonymization task.
- **1.5 Result Retrieval**: Downloads the anonymized media file once the task completes successfully.

These blocks work sequentially to ensure reliable processing from input to output.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block handles the initial media file input by exposing a form webhook where users can upload an image or video for anonymization.

- **Nodes Involved:**  
  - Upload Input File  
  - Sticky Note (File Upload instructions)  
  - Sticky Note (Image Input preview)

- **Node Details:**  

  - **Upload Input File**  
    - Type: Form Trigger  
    - Role: Entry point that triggers the workflow upon form submission; accepts one media file.  
    - Configuration:  
      - Webhook path set to a unique ID.  
      - Form titled "Media Upload Form" with a single required file field labeled "input_media".  
      - Accepts one file only (no multiple).  
    - Inputs: External HTTP form submission.  
    - Outputs: Emits uploaded file data for downstream processing.  
    - Edge cases:  
      - User submits no file (blocked by required field).  
      - Invalid file types or corrupted uploads (not explicitly handled).  
    - Sticky Notes provide clickable form URLs for testing and production.

  - **Sticky Note (File Upload instructions)**  
    - Provides direct links to test and production form URLs for file upload.  
    - Suggests refreshing the console page after upload to see updates.

  - **Sticky Note (Image Input preview)**  
    - Shows an example image to illustrate acceptable input format.

---

#### 2.2 Authentication

- **Overview:**  
  This block configures authentication settings and obtains a Bearer token required for API calls to BlurIt.

- **Nodes Involved:**  
  - Set Auth Config  
  - Auth Get Token  
  - Merge  
  - Sticky Note (BlurIt Credentials instructions)

- **Node Details:**  

  - **Set Auth Config**  
    - Type: Set  
    - Role: Stores API base URL, client ID, and secret ID for authentication.  
    - Configuration:  
      - Sets three strings:  
        - `BASE_URL` = "https://api.services.wassa.io"  
        - `CLIENT_ID` = placeholder "[REPLACE_BY_YOUR_CLIENT_ID]"  
        - `SECRET_ID` = placeholder "[REPLACE_BY_YOUR_SECRET_ID]"  
    - Outputs: Passes these values downstream as JSON properties.  
    - Edge cases:  
      - Missing or incorrect credentials will cause authentication failure.  
    - Sticky Note explains where to get actual credentials in BlurIt Developer Dashboard.

  - **Auth Get Token**  
    - Type: HTTP Request  
    - Role: Performs POST request to `/login` endpoint to get an OAuth token.  
    - Configuration:  
      - URL constructed dynamically from `BASE_URL`.  
      - Body JSON includes `clientId` and `secretId` from previous node.  
      - Returns a JSON with a `token` property.  
    - Inputs: Receives credentials from Set Auth Config.  
    - Outputs: Emits token for authorization header usage.  
    - Failure modes:  
      - 401 Unauthorized if credentials invalid.  
      - Network timeouts.  
      - JSON parse errors if unexpected response.  

  - **Merge**  
    - Type: Merge  
    - Role: Combines outputs from Upload Input File (media file) and Auth Get Token (token) into a single data stream to prepare for task creation.  
    - Configuration: Combine mode set to "combineAll" to merge data from two sources.  
    - Inputs: Two inputs, one from Upload Input File, one from Auth Get Token.  
    - Outputs: Single combined item containing file and token data.  
    - Edge cases:  
      - If one input is missing or delayed, merge may wait indefinitely.  

  - **Sticky Note (BlurIt Credentials instructions)**  
    - Provides instructions to replace placeholders with actual credentials.  
    - Includes a link to BlurIt Developer portal for obtaining credentials.

---

#### 2.3 Task Creation

- **Overview:**  
  This block creates an anonymization task on BlurIt by uploading the media file along with configuration options for blurring faces and license plates.

- **Nodes Involved:**  
  - Create Blurit Task  
  - Sticky Note (Create Task instructions)

- **Node Details:**  

  - **Create Blurit Task**  
    - Type: HTTP Request  
    - Role: Sends POST request to `/innovation-service/anonymization` endpoint to start the anonymization process.  
    - Configuration:  
      - URL dynamically built from `BASE_URL`.  
      - Content type: multipart/form-data to upload binary media.  
      - Body parameters:  
        - `input_media`: the uploaded file binary data.  
        - `activation_plates_blur`: set to `"true"`.  
        - `activation_faces_blur`: set to `"true"`.  
        - `blur_type`: JSON string specifying `"anonymization_type": "blur"`.  
      - Headers: Authorization Bearer token from Auth Get Token node.  
    - Inputs: Combined data from Merge node (file + token).  
    - Outputs: JSON response containing `anonymization_job_id` used for status polling.  
    - Edge cases:  
      - HTTP errors (e.g., 400 Bad Request if file invalid).  
      - Authorization errors if token expired.  
      - Large file upload failures or timeouts.  

  - **Sticky Note (Create Task instructions)**  
    - Instructs users to edit blur configuration by editing the `blur_type` field in this node.  

---

#### 2.4 Task Monitoring

- **Overview:**  
  This block periodically checks the status of the anonymization task until completion or failure.

- **Nodes Involved:**  
  - Wait  
  - Get Task Status  
  - Switch  

- **Node Details:**  

  - **Wait**  
    - Type: Wait  
    - Role: Pauses workflow execution for 2 seconds between polling attempts.  
    - Configuration: Wait amount set to 2 seconds.  
    - Inputs: Output from Create Blurit Task and from Switch node when status is "Pending...".  
    - Outputs: Triggers Get Task Status after delay.  
    - Edge cases:  
      - Fixed delay may be inefficient for longer tasks; no exponential backoff implemented.  

  - **Get Task Status**  
    - Type: HTTP Request  
    - Role: Sends GET request to `/innovation-service/anonymization` endpoint with `anonymization_job_id` query parameter.  
    - Configuration:  
      - URL dynamically built from `BASE_URL`.  
      - Query parameter: `anonymization_job_id` obtained from Create Blurit Task node response.  
      - Authorization header with Bearer token.  
    - Inputs: From Wait node or initial task creation.  
    - Outputs: JSON response including `status` field and, if completed, `output_media` URL for the anonymized file.  
    - Edge cases:  
      - API errors or timeouts.  
      - Token expiration.  

  - **Switch**  
    - Type: Switch  
    - Role: Routes execution based on the task `status` value.  
    - Configuration:  
      - If `status` == "Succeeded": route to Get Result File node.  
      - If `status` == "Failed": route to no further nodes (ends workflow).  
      - Else (pending): route back to Wait node for next polling.  
    - Inputs: From Get Task Status.  
    - Outputs: Three outputs corresponding to each status condition.  
    - Edge cases:  
      - Unknown or unexpected status values not explicitly handled.  

---

#### 2.5 Result Retrieval

- **Overview:**  
  After successful anonymization, this block downloads the anonymized media file for further use.

- **Nodes Involved:**  
  - Get Result File  
  - Sticky Note (Get Result instructions)  
  - Sticky Note (Image Output preview)

- **Node Details:**  

  - **Get Result File**  
    - Type: HTTP Request  
    - Role: Downloads the anonymized media file from the URL provided in the task status response (`output_media`).  
    - Configuration:  
      - URL taken dynamically from Get Task Status node’s output.  
      - Authorization header with Bearer token.  
    - Inputs: From Switch node’s "Task Succeeded" output.  
    - Outputs: The binary media data of the anonymized file available in output.  
    - Edge cases:  
      - Download failures (network issues, expired URLs).  
      - Authorization issues.  

  - **Sticky Note (Get Result instructions)**  
    - Explains that the output data contains the anonymized file.  
    - Instructs to use output section to view or download the file.

  - **Sticky Note (Image Output preview)**  
    - Shows example image illustrating expected anonymization result.

---

### 3. Summary Table

| Node Name           | Node Type        | Functional Role                   | Input Node(s)                     | Output Node(s)                  | Sticky Note                                                                                                                     |
|---------------------|------------------|---------------------------------|----------------------------------|--------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Upload Input File    | Form Trigger     | Receives media file upload       | (Trigger)                        | Set Auth Config, Merge          | After launching **Execute Workflow**, click form links to upload input file. Links visible in sticky note next to this node.   |
| Set Auth Config      | Set              | Stores API credentials           | Upload Input File                | Auth Get Token                  | Replace placeholders with your Client ID and Secret from BlurIt Developer Dashboard.                                           |
| Auth Get Token       | HTTP Request     | Obtains Bearer token             | Set Auth Config                 | Merge                          | -                                                                                                                              |
| Merge               | Merge            | Combines file and token data     | Upload Input File, Auth Get Token| Create Blurit Task             | -                                                                                                                              |
| Create Blurit Task   | HTTP Request     | Submits anonymization task       | Merge                          | Wait                           | Edit blur configuration by changing the *blur_type* field in this node.                                                        |
| Wait                | Wait             | Delays between polling attempts  | Create Blurit Task, Switch      | Get Task Status                | -                                                                                                                              |
| Get Task Status      | HTTP Request     | Polls anonymization task status  | Wait                           | Switch                        | -                                                                                                                              |
| Switch              | Switch           | Routes based on task status      | Get Task Status                 | Get Result File (Succeeded), Wait (Pending), None (Failed) | -                                                                                                                              |
| Get Result File      | HTTP Request     | Downloads anonymized media       | Switch (Succeeded)              | (End)                         | If succeeded, the anonymized file is present in output data. View or download from output section.                             |
| Sticky Note          | Sticky Note      | Instructions and info            | -                              | -                              | Various sticky notes provide URLs, usage instructions, previews, and links to BlurIt documentation and support.               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Input Reception Node:**  
   - Add a **Form Trigger** node named `Upload Input File`.  
   - Set the webhook path to a unique ID (e.g., "6afa917a-f6c6-459c-907c-ec8cfa950703").  
   - Configure form fields: one required file field labeled `input_media`, single file only.  
   - Save and note the webhook URL for uploading media.

2. **Create Authentication Configuration Node:**  
   - Add a **Set** node named `Set Auth Config`.  
   - Add string fields:  
     - `BASE_URL` = `"https://api.services.wassa.io"`  
     - `CLIENT_ID` = your BlurIt API client ID (replace placeholder)  
     - `SECRET_ID` = your BlurIt API secret ID (replace placeholder)

3. **Create Token Retrieval Node:**  
   - Add an **HTTP Request** node named `Auth Get Token`.  
   - Set method to POST.  
   - URL: `={{$json.BASE_URL}}/login` (dynamic from Set Auth Config).  
   - Body parameters (JSON):  
     ```json
     {
       "clientId": "{{$json.CLIENT_ID}}",
       "secretId": "{{$json.SECRET_ID}}"
     }
     ```  
   - Enable JSON parameters option.  
   - Output expected: JSON with `token`.

4. **Merge Uploaded File and Token:**  
   - Add a **Merge** node named `Merge`.  
   - Set mode to `combine` with option `combineAll` to merge both inputs (Upload Input File and Auth Get Token).

5. **Create BlurIt Anonymization Task:**  
   - Add an **HTTP Request** node named `Create Blurit Task`.  
   - Method: POST.  
   - URL: `={{$("Set Auth Config").item.json.BASE_URL}}/innovation-service/anonymization`  
   - Content type: multipart/form-data.  
   - Body parameters:  
     - `input_media` as form binary data from uploaded file.  
     - `activation_plates_blur`: `"true"`  
     - `activation_faces_blur`: `"true"`  
     - `blur_type`: `{"anonymization_type": "blur"}` (as a JSON string)  
   - Headers: Authorization `Bearer {{$json.token}}` taken from Auth Get Token.  

6. **Add Wait Node for Polling Delay:**  
   - Add a **Wait** node named `Wait`.  
   - Set to wait 2 seconds between polling attempts.

7. **Create Task Status Polling Node:**  
   - Add an **HTTP Request** node named `Get Task Status`.  
   - Method: GET.  
   - URL: same base URL as above `/innovation-service/anonymization`.  
   - Query parameter: `anonymization_job_id` set from `Create Blurit Task` response JSON.  
   - Headers: Authorization `Bearer {{$('Auth Get Token').item.json.token}}`.

8. **Add Switch Node to Route by Status:**  
   - Add a **Switch** node named `Switch`.  
   - Configure rules on `status` field:  
     - If equals `"Succeeded"`, go to Get Result File.  
     - If equals `"Failed"`, terminate workflow.  
     - Else (pending), route back to Wait node.

9. **Download Anonymized Result:**  
   - Add an **HTTP Request** node named `Get Result File`.  
   - Method: GET.  
   - URL: dynamic from `Get Task Status` output field `output_media`.  
   - Headers: Authorization Bearer token from `Auth Get Token`.  
   - Output: Contains anonymized media binary.

10. **Connect Nodes:**  
    - `Upload Input File` → `Set Auth Config` → `Auth Get Token` → `Merge`  
    - `Upload Input File` also connects to `Merge` as second input  
    - `Merge` → `Create Blurit Task` → `Wait` → `Get Task Status` → `Switch`  
    - `Switch` outputs:  
      - "Succeeded" → `Get Result File`  
      - "Pending..." → `Wait` (loop)  
      - "Failed" → end workflow or error handling  

11. **Credentials Setup:**  
    - Ensure you have valid BlurIt API credentials (Client ID and Secret) entered in `Set Auth Config`.  
    - No additional credential nodes needed since HTTP requests use raw token in headers.

12. **Optional:**  
    - Add Sticky Notes at relevant points to provide usage instructions and links (e.g., form URLs, BlurIt developer portal).  
    - Customize blur configuration JSON as needed in `Create Blurit Task`.

---

### 5. General Notes & Resources

| Note Content                                                                                                                               | Context or Link                                                                                 |
|--------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| ![](https://res.cloudinary.com/dhtpkobg1/image/upload/v1757689724/logo_blurit_vxo83w.png)                                                  | BlurIt branding image to visualize the service.                                               |
| This n8n template demonstrates how to use BlurIt to anonymize faces and license plates in images or videos directly within your workflow.  | Overview and use cases description.                                                           |
| Replace the placeholders with your own Client ID and Secret ID by double-clicking the Set Auth Config node.                                | BlurIt Developer portal: https://app.blurit.io/account/developer                              |
| After launching Execute Workflow, click one of the form links to upload your input file, then return to the console (refresh page if needed).| Form URLs are accessible by double-clicking the Upload Input File node.                        |
| If succeed, file result is present in Output data of the Get Result File Node. Click View or Download in Output Section.                   | Instructions for retrieving anonymized media.                                                 |
| Use cases include: anonymizing dashcam videos, securing photos before public sharing, or ensuring compliance with privacy regulations.      | General workflow motivation and context.                                                      |
| Need Help? Contact us at support@blurit.io or visit the BlurIt Documentation.                                                               | BlurIt API docs: https://doc-api.blurit.io/n8n-integration                                   |

---

**Disclaimer:** The text provided derives exclusively from an automated workflow created with n8n, respecting all current content policies. It contains no illegal, offensive, or protected elements. All data handled is legal and public.

---