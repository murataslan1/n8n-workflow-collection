Automate Video Translation from Multiple Sources with Rask AI

https://n8nworkflows.xyz/workflows/automate-video-translation-from-multiple-sources-with-rask-ai-11496


# Automate Video Translation from Multiple Sources with Rask AI

### 1. Workflow Overview

This workflow automates the translation of a video accessible via URL into a target language using the Rask AI platform. It is designed for use cases such as localization, multilingual content creation, and training material preparation. It supports video sources such as YouTube, Google Drive, S3, Vimeo, or direct download links.

The workflow is logically divided into these blocks:

- **1.1 Input Reception and Media Upload:** Receives input parameters (video link and destination language), uploads the video to Rask AI.
- **1.2 Media Processing Monitoring:** Polls the media status until the upload and processing are complete or an error occurs.
- **1.3 Project Creation and Translation:** Creates a translation project on Rask AI using the processed media and the target language.
- **1.4 Project Processing Monitoring:** Polls the translation project status until the dubbing/translation is complete or an error occurs.

This design ensures robust asynchronous processing with status checks and error handling at both media upload and project translation stages.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Media Upload

- **Overview:**  
  This block initializes the workflow by receiving input parameters (`link` and `dst_lang`) and uploads the video media to the Rask AI platform via its API.

- **Nodes Involved:**  
  - When Executed by Another Workflow (trigger)  
  - Upload media (HTTP Request)

- **Node Details:**

  - **When Executed by Another Workflow**  
    - Type: Execute Workflow Trigger (Trigger node)  
    - Role: Accepts input parameters `link` (video URL) and `dst_lang` (target language code) from an external workflow or manual trigger.  
    - Configuration: Disabled by default; expects inputs named `link` and `dst_lang`.  
    - Inputs: External workflow or manual execution.  
    - Outputs: Passes input data downstream.  
    - Edge Cases: Missing or malformed inputs could cause later API calls to fail.

  - **Upload media**  
    - Type: HTTP Request  
    - Role: Calls Rask AI API to upload the video media using provided link.  
    - Configuration: POST to `https://api.rask.ai/api/library/v1/media/link` with body parameters: `link` (from input), `kind` set to `"video"`, and `name` set to `"n8n"`. OAuth2 authentication (`raskOAuth2`) used.  
    - Inputs: Data from "When Executed by Another Workflow" node.  
    - Outputs: JSON response containing uploaded media ID and status.  
    - Edge Cases: Authentication failure, invalid video URL, network errors, API rate limits.

#### 2.2 Media Processing Monitoring

- **Overview:**  
  This block polls the media entity status until it reaches a terminal state: ready, failed, or still processing.

- **Nodes Involved:**  
  - Get media (HTTP Request)  
  - Switch media status (Switch)  
  - Wait media processing (Wait)  
  - Uploading failed (Stop and Error)  

- **Node Details:**

  - **Get media**  
    - Type: HTTP Request  
    - Role: Retrieves current status of uploaded media by ID from Rask AI API.  
    - Configuration: GET request to `https://api.rask.ai/api/library/v1/media/{{media_id}}` using OAuth2 credentials.  
    - Inputs: Output from "Upload media" or "Wait media processing".  
    - Outputs: Current media status JSON.  
    - Edge Cases: Token expiration, network issues, invalid media ID.

  - **Switch media status**  
    - Type: Switch  
    - Role: Evaluates media `status` field to decide next action.  
    - Configuration:  
      - If status = `"failed"` → route to "Uploading failed" node.  
      - If status = `"ready"` → route to "Create project" node.  
      - If status = `"processing"` → route to "Wait media processing" node.  
    - Inputs: Media status JSON from "Get media".  
    - Outputs: One of three paths based on status.  
    - Edge Cases: Unexpected status values or missing `status` field.

  - **Wait media processing**  
    - Type: Wait  
    - Role: Introduces delay before polling media status again.  
    - Configuration: Uses webhook-based wait with no explicit timeout set; waits to be triggered again.  
    - Inputs: From "Switch media status" when status is `"processing"`.  
    - Outputs: Triggers "Get media" node again to re-poll status.  
    - Edge Cases: Webhook trigger failures or indefinite wait if media never reaches terminal status.

  - **Uploading failed**  
    - Type: Stop and Error  
    - Role: Terminates workflow with error message `"Video uploading failed"`.  
    - Inputs: From "Switch media status" if media status is `"failed"`.  
    - Outputs: None (workflow stops).  
    - Edge Cases: None beyond normal error termination.

#### 2.3 Project Creation and Translation

- **Overview:**  
  Once media is ready, this block creates a translation project specifying the video ID and target language.

- **Nodes Involved:**  
  - Create project (HTTP Request)  
  - Get project (HTTP Request)  

- **Node Details:**

  - **Create project**  
    - Type: HTTP Request  
    - Role: Initiates a translation project on Rask AI with the media ID and destination language.  
    - Configuration: POST to `https://api.rask.ai/v2/projects` with JSON body containing:  
      - `video_id` from "Get media" node's JSON `id`  
      - `dst_lang` from input `dst_lang` parameter  
      - `name` set to `"n8n"`  
      OAuth2 authentication used.  
    - Inputs: From "Switch media status" node when media is ready.  
    - Outputs: Project creation response JSON including project ID.  
    - Edge Cases: Authentication and API errors, invalid language codes.

  - **Get project**  
    - Type: HTTP Request  
    - Role: Retrieves current status of the translation project using project ID.  
    - Configuration: GET request to `https://api.rask.ai/v2/projects/{{project_id}}` with OAuth2 credentials.  
    - Inputs: Output from "Create project" node or from "Wait project processing".  
    - Outputs: Project status JSON.  
    - Edge Cases: Token expiration, invalid project ID, network issues.

#### 2.4 Project Processing Monitoring

- **Overview:**  
  This block polls the translation project status to monitor progress until dubbing is complete or an error occurs.

- **Nodes Involved:**  
  - Switch project status (Switch)  
  - Wait project processing (Wait)  
  - Processing failed (Stop and Error)  

- **Node Details:**

  - **Switch project status**  
    - Type: Switch  
    - Role: Evaluates the project `status` field to determine the next step.  
    - Configuration:  
      - If status ends with `"failed"` → route to "Processing failed".  
      - If status equals `"merging_done"` → translation is complete → proceed normally (no further nodes connected here, i.e., success end).  
      - Otherwise → route to "Wait project processing" to delay before next poll.  
    - Inputs: Project status JSON from "Get project".  
    - Outputs: One of three paths based on status.  
    - Edge Cases: Unexpected status values or delays.

  - **Wait project processing**  
    - Type: Wait  
    - Role: Delays before re-polling the project status.  
    - Configuration: Webhook-based wait node, no explicit timeout configured.  
    - Inputs: From "Switch project status" when project still processing.  
    - Outputs: Triggers "Get project" node for next poll cycle.  
    - Edge Cases: Possible indefinite wait if project never reaches terminal status.

  - **Processing failed**  
    - Type: Stop and Error  
    - Role: Terminates workflow execution with error message `"Project processing failed"`.  
    - Inputs: From "Switch project status" if project status indicates failure.  
    - Outputs: None (workflow stops).  
    - Edge Cases: None beyond workflow error termination.

---

### 3. Summary Table

| Node Name                      | Node Type                     | Functional Role                                    | Input Node(s)                   | Output Node(s)                   | Sticky Note                                                                                                                                |
|-------------------------------|-------------------------------|---------------------------------------------------|--------------------------------|---------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| When Executed by Another Workflow | Execute Workflow Trigger       | Receives input parameters to start the workflow   | (external trigger)             | Upload media                    |                                                                                                                                            |
| Upload media                  | HTTP Request                   | Uploads video media to Rask AI via API             | When Executed by Another Workflow | Get media                      |                                                                                                                                            |
| Get media                    | HTTP Request                   | Retrieves current media status                      | Upload media, Wait media processing | Switch media status            | 🎯  Media processing — The [media entity](https://docs.api.rask.ai/api-reference/media/get_media) polling is used to wait until the media is ready. |
| Switch media status          | Switch                        | Routes workflow based on media status               | Get media                      | Uploading failed, Create project, Wait media processing |                                                                                                                                            |
| Uploading failed             | Stop and Error                | Stops workflow on media upload failure              | Switch media status            | (none)                         |                                                                                                                                            |
| Create project              | HTTP Request                   | Creates translation project with media ID and target language | Switch media status            | Get project                    | 🎯 Project processing — The [translation project entity](https://docs.api.rask.ai/api-reference/project/get_project) polling is used to wait until the project is ready. After that, the dubbing is complete and you can get all the necessary artifacts. |
| Get project                | HTTP Request                   | Retrieves current translation project status         | Create project, Wait project processing | Switch project status        |                                                                                                                                            |
| Switch project status       | Switch                        | Routes workflow based on project status              | Get project                   | Processing failed, (end), Wait project processing |                                                                                                                                            |
| Processing failed          | Stop and Error                | Stops workflow on project processing failure         | Switch project status          | (none)                         |                                                                                                                                            |
| Wait media processing       | Wait                         | Waits before re-polling media status                   | Switch media status            | Get media                      |                                                                                                                                            |
| Wait project processing     | Wait                         | Waits before re-polling project status                 | Switch project status          | Get project                    |                                                                                                                                            |
| Sticky Note                 | Sticky Note                   | Explanation of media processing polling               | (none)                       | (none)                         | 🎯  Media processing — The [media entity](https://docs.api.rask.ai/api-reference/media/get_media) polling is used to wait until the media is ready. |
| Sticky Note1                | Sticky Note                   | Explanation of project processing polling             | (none)                       | (none)                         | 🎯 Project processing — The [translation project entity](https://docs.api.rask.ai/api-reference/project/get_project) polling is used to wait until the project is ready. After that, the dubbing is complete and you can get all the necessary artifacts. |
| Sticky Note2                | Sticky Note                   | Full workflow description, test inputs, and authentication instructions | (none)                       | (none)                         | Full detailed workflow description including supported sources, usage, OAuth2 requirements, and test input values.                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node: "When Executed by Another Workflow"**  
   - Type: Execute Workflow Trigger  
   - Configure inputs: define two input parameters named `link` and `dst_lang`.  
   - Initially disable this node if manual triggering is preferred.

2. **Create HTTP Request Node: "Upload media"**  
   - Connect output of trigger node to this node.  
   - Method: POST  
   - URL: `https://api.rask.ai/api/library/v1/media/link`  
   - Authentication: OAuth2 with credentials named `raskOAuth2`.  
   - Body Parameters (JSON):  
     - `link`: use expression to get value `{{$json["link"]}}` from trigger input  
     - `kind`: `"video"` (static)  
     - `name`: `"n8n"` (static)  
   - Enable sending body as JSON.

3. **Create HTTP Request Node: "Get media"**  
   - Connect output of "Upload media" to this node.  
   - Method: GET  
   - URL: use expression `https://api.rask.ai/api/library/v1/media/{{$json["id"]}}` to get media status by media ID from previous step.  
   - Authentication: OAuth2 `raskOAuth2`.

4. **Create Switch Node: "Switch media status"**  
   - Connect output of "Get media" to this node.  
   - Add three rules on `$json.status`:  
     - Equals `"failed"` → output: "Error"  
     - Equals `"ready"` → output: "Ready"  
     - Equals `"processing"` → output: "Processing"  

5. **Create Stop and Error Node: "Uploading failed"**  
   - Connect "Error" output of switch to this node.  
   - Set error message: `"Video uploading failed"`.

6. **Create HTTP Request Node: "Create project"**  
   - Connect "Ready" output of switch to this node.  
   - Method: POST  
   - URL: `https://api.rask.ai/v2/projects`  
   - Body Parameters:  
     - `video_id`: expression from "Get media" node `{{$json["id"]}}`  
     - `dst_lang`: expression from trigger node `{{$json["dst_lang"]}}`  
     - `name`: `"n8n"` (static)  
   - Authentication: OAuth2 `raskOAuth2`.

7. **Create HTTP Request Node: "Get project"**  
   - Connect output of "Create project" to this node.  
   - Method: GET  
   - URL: expression `https://api.rask.ai/v2/projects/{{$json["id"]}}`  
   - Authentication: OAuth2 `raskOAuth2`.

8. **Create Switch Node: "Switch project status"**  
   - Connect output of "Get project" to this node.  
   - Add three rules on `$json.status`:  
     - Ends with `"failed"` → output: "Error"  
     - Equals `"merging_done"` → output: "Ready"  
     - Otherwise → output: "Processing"  

9. **Create Stop and Error Node: "Processing failed"**  
   - Connect "Error" output of switch to this node.  
   - Set error message: `"Project processing failed"`.

10. **Create Wait Node: "Wait media processing"**  
    - Connect "Processing" output of "Switch media status" to this node.  
    - Use webhook-based wait with default parameters.  
    - Connect output of this node back to "Get media" to poll again.

11. **Create Wait Node: "Wait project processing"**  
    - Connect "Processing" output of "Switch project status" to this node.  
    - Use webhook-based wait with default parameters.  
    - Connect output of this node back to "Get project" to poll again.

12. **Connect node outputs as described in the connections above.**

13. **Set up OAuth2 Credentials in n8n:**  
    - Name: `raskOAuth2`  
    - Provide Client ID and Client Secret from your Rask AI account settings (https://app.rask.ai/account).  
    - Configure OAuth2 scopes and token URLs as per Rask AI documentation (https://docs.api.rask.ai/api-reference/authentication).

14. **Add Sticky Note nodes for documentation inside the workflow:**  
    - Add notes explaining media processing, project processing, and overall workflow context with links to Rask API docs and test inputs.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                  | Context or Link                                                                                          |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| OAuth2 credentials for Rask AI must include Client ID and Client Secret, accessible via https://app.rask.ai/account.                                                                                                                                                                         | Rask AI account settings                                                                                 |
| Official Rask AI API Authentication documentation: https://docs.api.rask.ai/api-reference/authentication                                                                                                                                                                                    | API docs for OAuth2 setup                                                                                |
| Media entity polling documentation: https://docs.api.rask.ai/api-reference/media/get_media                                                                                                                                                                                                   | Used for monitoring media processing status                                                             |
| Translation project polling documentation: https://docs.api.rask.ai/api-reference/project/get_project                                                                                                                                                                                       | Used for monitoring project translation status                                                           |
| Supported video sources include YouTube, Google Drive, S3, Vimeo, or direct links. Destination languages supported are listed here: https://docs.api.rask.ai/languages/destination                                                                                                             | Workflow usage and limitations                                                                            |
| Test inputs for quick workflow run: `link`: https://static.rask.ai/samples/sample_1.mp4, `dst_lang`: `en-us`                                                                                                                                                                                | Provided for quick testing                                                                                |
| This workflow is designed to be triggered by another workflow or manually, enabling integration into larger automation pipelines.                                                                                                                                                           | Workflow design note                                                                                      |

---

**Disclaimer:**  
The text provided comes exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and publicly accessible.