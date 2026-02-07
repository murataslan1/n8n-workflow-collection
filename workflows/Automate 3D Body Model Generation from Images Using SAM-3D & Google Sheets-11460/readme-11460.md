Automate 3D Body Model Generation from Images Using SAM-3D & Google Sheets

https://n8nworkflows.xyz/workflows/automate-3d-body-model-generation-from-images-using-sam-3d---google-sheets-11460


# Automate 3D Body Model Generation from Images Using SAM-3D & Google Sheets

### 1. Workflow Overview

This workflow automates the generation of 3D human body models in `.glb` format from single images using the SAM-3D model API provided by Fal AI. It is designed for use cases where users maintain a Google Sheet with image URLs and want to automatically create and track corresponding 3D models without manual intervention.

The workflow is logically divided into these main blocks:

- **1.1 Input Reception (Google Sheets Source):** Fetches image URLs from a Google Sheet where the 3D model result is not yet generated.
- **1.2 AI Processing Request:** Sends each image URL to the SAM-3D API to start the 3D model generation job and receives a request ID.
- **1.3 Status Polling:** Repeatedly polls the API using the request ID to check if the 3D model generation has completed.
- **1.4 Result Retrieval and Update:** When the job is complete, retrieves the URL of the generated `.glb` 3D model file, downloads it, and updates the Google Sheet with the model URL.
- **1.5 Triggering Mechanisms:** Supports manual execution via a manual trigger node and automated periodic execution via a schedule trigger node.
- **1.6 Documentation and Instructions:** Sticky notes provide setup instructions, usage guidelines, and references to external resources.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception (Google Sheets Source)

- **Overview:**  
  This block reads rows from a Google Sheet where the “3D RESULT” column is empty, indicating images that require 3D modeling.

- **Nodes Involved:**  
  - Get new image  
  - Set data

- **Node Details:**

  - **Get new image**  
    - Type: Google Sheets  
    - Role: Reads rows from the specified Google Sheet filtering only those where the “3D RESULT” column is empty.  
    - Configuration: Uses OAuth2 credentials to access Google Sheets. Filters applied on “3D RESULT” column empty status.  
    - Inputs: Triggered by the manual or schedule trigger.  
    - Outputs: Emits rows with image URLs and metadata including row number.  
    - Edge Cases: Possible auth failures, Google Sheets API rate limits, or no matching rows found.  
    - Credentials: Google Sheets OAuth2 API required.

  - **Set data**  
    - Type: Set  
    - Role: Prepares the payload by extracting the image URL from the Google Sheets data into a variable named `image`.  
    - Configuration: Assigns `image` as `{{$json["IMAGE"]}}`, where “IMAGE” is expected to be the image URL column from the sheet.  
    - Inputs: From Get new image node.  
    - Outputs: Structured JSON with `image` key for the next HTTP request.  
    - Edge Cases: Missing or malformed image URLs could cause downstream errors.

#### 2.2 AI Processing Request

- **Overview:**  
  Sends the image URL to the Fal AI SAM-3D API to initiate 3D model generation and retrieves a `request_id` for tracking.

- **Nodes Involved:**  
  - Create 3D Image

- **Node Details:**

  - **Create 3D Image**  
    - Type: HTTP Request  
    - Role: POSTs to `https://queue.fal.run/fal-ai/sam-3/3d-body` with JSON containing the image URL and options for mesh export and keypoints.  
    - Configuration:  
      - HTTP method: POST  
      - JSON body includes `image_url`, `export_meshes: true`, and `include_3d_keypoints: true`  
      - Headers: Content-Type: application/json; Authorization set via HTTP Header Auth (Fal AI API key)  
    - Inputs: From Set data node.  
    - Outputs: Returns a JSON including a `request_id` used for job status checking.  
    - Edge Cases: Auth errors if API key invalid, network timeouts, invalid image URLs causing API errors.

#### 2.3 Status Polling

- **Overview:**  
  Polls the Fal AI API periodically using the `request_id` until the 3D model generation job completes.

- **Nodes Involved:**  
  - Wait 60 sec.  
  - Get status  
  - Completed? (If node)

- **Node Details:**

  - **Wait 60 sec.**  
    - Type: Wait  
    - Role: Delays execution by 60 seconds between status checks to avoid excessive API calls.  
    - Configuration: Wait time set to 60 seconds.  
    - Inputs: From Create 3D Image or from Completed? node (if job incomplete).  
    - Outputs: Triggers Get status node after wait.  
    - Edge Cases: None significant; wait node is stable.

  - **Get status**  
    - Type: HTTP Request  
    - Role: GET request to check status of the 3D model generation job at endpoint `https://queue.fal.run/fal-ai/sam-3/requests/{{ request_id }}/status`.  
    - Configuration: Uses Fal AI API key in HTTP Header Auth.  
    - Inputs: From Wait 60 sec. node.  
    - Outputs: Returns job status JSON (e.g., status: "COMPLETED", "PENDING", etc.).  
    - Edge Cases: Auth failures, request timeouts, malformed request_id.

  - **Completed?**  
    - Type: If  
    - Role: Checks if the `status` field in the JSON response equals "COMPLETED".  
    - Configuration: Expression `{{$json.status === "COMPLETED"}}`.  
    - Inputs: From Get status node.  
    - Outputs:  
      - True branch: proceeds to Get Url 3D image node.  
      - False branch: loops back to Wait 60 sec. node to poll again.  
    - Edge Cases: If status is not present or unexpected values, could cause logic flow issues.

#### 2.4 Result Retrieval and Update

- **Overview:**  
  Once the 3D generation job completes, this block fetches the generated `.glb` file URL, downloads it, and updates the Google Sheet with the result.

- **Nodes Involved:**  
  - Get Url 3D image  
  - Get File 3D image  
  - Update result

- **Node Details:**

  - **Get Url 3D image**  
    - Type: HTTP Request  
    - Role: GET request to `https://queue.fal.run/fal-ai/sam-3/requests/{{ request_id }}` to retrieve detailed job results including the 3D model URL.  
    - Configuration: Uses Fal AI API key authentication.  
    - Inputs: From Completed? node (true branch).  
    - Outputs: Includes the `.glb` model URL in `model_glb.url`.  
    - Edge Cases: Auth errors, missing or malformed response.

  - **Get File 3D image**  
    - Type: HTTP Request  
    - Role: Downloads the `.glb` file from the URL obtained above.  
    - Configuration: URL set dynamically from `{{$json.model_glb.url}}`.  
    - Inputs: From Get Url 3D image node.  
    - Outputs: Raw binary or file data (implicit in n8n) to be used or stored as needed.  
    - Edge Cases: Network errors, file not found, download failures.

  - **Update result**  
    - Type: Google Sheets  
    - Role: Updates the original Google Sheet row, writing the 3D model URL into the “IMAGE RESULT” column to mark completion.  
    - Configuration:  
      - Uses OAuth2 Google Sheets credentials.  
      - Matches row by `row_number` to correctly update the row.  
      - Sets “IMAGE RESULT” to the retrieved 3D model URL.  
    - Inputs: From Get File 3D image node.  
    - Outputs: None (end of workflow for this item).  
    - Edge Cases: Google Sheets API quota limits, auth failures, incorrect row matching.

#### 2.5 Triggering Mechanisms and Miscellaneous

- **Overview:**  
  Enables manual testing and automated periodic runs, plus provides documentation.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Schedule Trigger  
  - Sticky Notes (documentation and instructions)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Allows manual execution of the workflow for testing purposes.  
    - Outputs: Triggers Get new image node.  
    - Edge Cases: None.

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Runs the workflow automatically at intervals (every minute).  
    - Configuration: Interval set to 1 minute.  
    - Outputs: Triggers Get new image node.  
    - Edge Cases: High frequency jobs may cause rate limits.

  - **Sticky Notes**  
    - Type: Sticky Note  
    - Role: Provide comprehensive documentation and instructions including:  
      - Overview of the workflow and its purpose  
      - Step 1: Google Sheet setup instructions with link  
      - Step 2: API Key setup instructions with link  
      - Step 3: Retrieval and saving of 3D file instructions  
      - Step 4: Testing the resulting 3D model on external viewer  
      - Visual examples and helpful links  
    - Edge Cases: None.

---

### 3. Summary Table

| Node Name              | Node Type            | Functional Role                             | Input Node(s)              | Output Node(s)              | Sticky Note                                                                                                                                |
|------------------------|----------------------|--------------------------------------------|----------------------------|-----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger       | Manual execution trigger                    | —                          | Get new image               |                                                                                                                                            |
| Schedule Trigger       | Schedule Trigger     | Automated periodic trigger (every 1 minute) | —                          | Get new image               |                                                                                                                                            |
| Get new image          | Google Sheets        | Fetch rows with empty “3D RESULT” to process | When clicking ‘Test workflow’, Schedule Trigger | Set data                    | See Sticky Note4: Google Sheet setup instructions with link                                                                                |
| Set data               | Set                  | Extract and prepare image URL for API call | Get new image               | Create 3D Image             |                                                                                                                                            |
| Create 3D Image        | HTTP Request         | Send image URL to SAM-3D API to create model | Set data                   | Wait 60 sec.                | See Sticky Note6: Setup Fal AI API key in HTTP Header Auth                                                                                  |
| Wait 60 sec.           | Wait                 | Delay between status polling calls          | Create 3D Image, Completed? (false branch) | Get status                  |                                                                                                                                            |
| Get status             | HTTP Request         | Check job status by request_id               | Wait 60 sec.                | Completed?                  |                                                                                                                                            |
| Completed?             | If                   | Check if job status equals “COMPLETED”       | Get status                  | Get Url 3D image (true), Wait 60 sec. (false) |                                                                                                                                            |
| Get Url 3D image       | HTTP Request         | Retrieve job results including 3D file URL   | Completed? (true)           | Get File 3D image           | See Sticky Note7: Instructions on getting and saving the .glb file                                                                          |
| Get File 3D image      | HTTP Request         | Download the .glb 3D model file               | Get Url 3D image            | Update result               |                                                                                                                                            |
| Update result          | Google Sheets        | Update the Google Sheet with 3D model URL    | Get File 3D image           | —                           | See Sticky Note3: Overall workflow explanation and setup instructions                                                                      |
| Sticky Note3           | Sticky Note          | Documentation and overview                    | —                          | —                           | Full overview and setup instructions                                                                                                       |
| Sticky Note4           | Sticky Note          | Google Sheet cloning and setup instructions  | —                          | —                           | Includes link to Google Sheet template                                                                                                     |
| Sticky Note6           | Sticky Note          | Fal AI API key setup instructions             | —                          | —                           | Includes link to Fal AI signup page                                                                                                        |
| Sticky Note7           | Sticky Note          | Instructions on retrieving and saving 3D files | —                          | —                           |                                                                                                                                            |
| Sticky Note8           | Sticky Note          | Instructions on testing the .glb file with external viewer | —                          | —                           | Includes link to https://glb.ee/upload and example images                                                                                   |
| Sticky Note            | Sticky Note          | Visual example of the final 3D model result  | —                          | —                           |                                                                                                                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**
   - Add a **Manual Trigger** node named `When clicking ‘Test workflow’`.
   - Add a **Schedule Trigger** node named `Schedule Trigger`, configure it to run every 1 minute.

2. **Fetch New Images from Google Sheets:**
   - Add a **Google Sheets** node named `Get new image`.
   - Set operation to "Read Rows".
   - Configure document ID and sheet ID to your Google Sheet containing images.
   - Add a filter to only select rows where “3D RESULT” column is empty.
   - Connect both triggers (`When clicking ‘Test workflow’` and `Schedule Trigger`) to this node.
   - Configure Google Sheets OAuth2 credentials.

3. **Prepare Data for API Request:**
   - Add a **Set** node named `Set data`.
   - Assign a new field `image` with the expression `{{$json["IMAGE MODEL"] || $json["IMAGE"]}}` depending on your column name.
   - Connect output from `Get new image` to `Set data`.

4. **Send Image to SAM-3D API:**
   - Add an **HTTP Request** node named `Create 3D Image`.
   - Set HTTP method to POST.
   - URL: `https://queue.fal.run/fal-ai/sam-3/3d-body`.
   - Add JSON body:
     ```json
     {
       "image_url": "{{$json.image}}",
       "export_meshes": true,
       "include_3d_keypoints": true
     }
     ```
   - Set header `Content-Type: application/json`.
   - Use HTTP Header Auth credentials with header `Authorization: Key YOUR_API_KEY`.
   - Connect `Set data` to `Create 3D Image`.

5. **Wait Before Polling Status:**
   - Add a **Wait** node named `Wait 60 sec.`.
   - Set wait duration to 60 seconds.
   - Connect `Create 3D Image` to `Wait 60 sec.`.

6. **Poll API for Job Status:**
   - Add an **HTTP Request** node named `Get status`.
   - Set method to GET.
   - URL: `https://queue.fal.run/fal-ai/sam-3/requests/{{$json.request_id}}/status`.
   - Use same HTTP Header Auth credentials.
   - Connect `Wait 60 sec.` to `Get status`.

7. **Check if Job is Completed:**
   - Add an **If** node named `Completed?`.
   - Condition: Check if `{{$json.status}}` equals `"COMPLETED"`.
   - Connect `Get status` to `Completed?`.
   - Connect the false branch back to `Wait 60 sec.` for repeat polling.

8. **Get 3D Model URL on Completion:**
   - Add an **HTTP Request** node named `Get Url 3D image`.
   - Method: GET.
   - URL: `https://queue.fal.run/fal-ai/sam-3/requests/{{$json.request_id}}`.
   - Use HTTP Header Auth.
   - Connect the true branch of `Completed?` to this node.

9. **Download the .glb File:**
   - Add an **HTTP Request** node named `Get File 3D image`.
   - Method: GET.
   - URL: `{{$json.model_glb.url}}`.
   - Connect `Get Url 3D image` to this node.

10. **Update Google Sheet with Result:**
    - Add a **Google Sheets** node named `Update result`.
    - Operation: Update row.
    - Use the same Google Sheet and credentials.
    - Match row by `row_number`.
    - Update the “IMAGE RESULT” column with `{{$json.model_glb.url}}`.
    - Connect `Get File 3D image` to `Update result`.

11. **Add Sticky Notes:**
    - Add sticky notes as per the original workflow to provide:
      - Overview and setup instructions.
      - Google Sheet cloning link.
      - API key setup instructions.
      - 3D file retrieval and testing instructions.
      - Visual examples.

12. **Credentials Setup:**
    - Configure Google Sheets OAuth2 credentials with access to your Google Sheet.
    - Create HTTP Header Auth credentials for Fal AI API with header:
      - Name: `Authorization`
      - Value: `Key YOUR_API_KEY`.

13. **Testing:**
    - Test manually by triggering `When clicking ‘Test workflow’`.
    - Verify that the Google Sheet updates with the 3D model URLs.
    - Enable the schedule trigger once verified.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                 | Context or Link                                                                                                  |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| Clone the Google Sheet template for image input at: [Google Sheet Template](https://docs.google.com/spreadsheets/d/1C0Et6X3Zwr_6CxeNjhLpDwjAfIGeUvLGFawckKb0utY/edit?usp=sharing)                                               | Google Sheet template for entering images to process                                                           |
| Obtain Fal AI API key by creating an account at: [Fal AI Signup](https://fal.ai/)                                                                                                                                              | Required for API authentication                                                                                  |
| Test generated `.glb` files online at: [https://glb.ee/upload](https://glb.ee/upload)                                                                                                                                          | Useful for verifying 3D model outputs                                                                            |
| Workflow automates 3D model creation from single images using SAM-3D API, updating Google Sheets with results and enabling scheduled or manual execution modes.                                                              | Overall workflow purpose                                                                                          |
| API authentication uses HTTP Header Auth with header `Authorization: Key YOUR_API_KEY`. Ensure this is configured properly in all HTTP Request nodes communicating with Fal AI API.                                          | Credential setup note                                                                                            |

---

**Disclaimer:**  
The provided text is exclusively from an automated workflow created with n8n, respecting all content policies. It contains no illegal or offensive material. All data processed are legal and public.