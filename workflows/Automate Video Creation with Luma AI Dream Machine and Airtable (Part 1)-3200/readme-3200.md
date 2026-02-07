Automate Video Creation with Luma AI Dream Machine and Airtable (Part 1)

https://n8nworkflows.xyz/workflows/automate-video-creation-with-luma-ai-dream-machine-and-airtable--part-1--3200


# Automate Video Creation with Luma AI Dream Machine and Airtable (Part 1)

### 1. Workflow Overview

This workflow automates the creation of dynamic videos using the **Luma AI Dream Machine** API, integrating with **Airtable** for organized storage and tracking of generated video metadata. It is designed for content creators and marketers who want to scale video production with minimal manual intervention.

The workflow is logically divided into the following blocks:

- **1.1 Input Trigger and Global Settings Initialization:** Starts the workflow manually and sets global parameters such as video prompt, aspect ratio, duration, looping, and callback URL.
- **1.2 Random Camera Motion Selection:** Randomly selects a camera motion effect to add dynamic visual interest to the video.
- **1.3 Video Generation API Request:** Sends a POST request to Luma AI’s API to initiate video generation using the combined prompt and settings.
- **1.4 Execution Data Capture:** Captures the response from the API request for further processing.
- **1.5 Airtable Record Creation:** Stores the video generation metadata, including the generation ID and video parameters, into Airtable for tracking.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Trigger and Global Settings Initialization

- **Overview:**  
  This block starts the workflow manually and defines all necessary global settings that configure the video generation request.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’ (Manual Trigger)  
  - Global SETTINGS (Set)  
  - Sticky Note (Instructional)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Entry point to manually start the workflow for testing or execution.  
    - Configuration: No parameters; triggers workflow on manual user action.  
    - Input: None  
    - Output: Triggers "Global SETTINGS" node.  
    - Edge Cases: None typical; manual trigger avoids unexpected automatic runs.

  - **Global SETTINGS**  
    - Type: Set  
    - Role: Defines key parameters for video generation such as prompt, aspect ratio, duration, loop flag, cluster ID, Airtable base/table IDs, and callback URL.  
    - Configuration:  
      - `video_prompt`: "a superhero flying through a volcano"  
      - `aspect_ratio`: "9:16"  
      - `loop`: "true" (string, but used as boolean in expressions)  
      - `duration`: "5s"  
      - `cluster_id`: Unique string combining timestamp and random characters for grouping videos  
      - `airtable_base` and `airtable_table_generated_videos`: Airtable identifiers for storage  
      - `callback_url`: Placeholder URL for webhook callback after video generation  
    - Expressions: Uses JavaScript expression to generate `cluster_id` dynamically.  
    - Input: Triggered by manual trigger node.  
    - Output: Passes settings to "RANDOM Camera Motion" node.  
    - Edge Cases: Misconfiguration of callback URL or Airtable IDs will cause downstream failures.

  - **Sticky Note**  
    - Type: Sticky Note  
    - Role: Instructional note to define settings here.  
    - Content: "## Define your SETTINGS here"  
    - Input/Output: None  

#### 2.2 Random Camera Motion Selection

- **Overview:**  
  This block randomly selects a camera motion effect from a predefined list to add dynamic movement to the generated video.

- **Nodes Involved:**  
  - RANDOM Camera Motion (Code)  
  - Sticky Note1 (Instructional)

- **Node Details:**

  - **RANDOM Camera Motion**  
    - Type: Code (JavaScript)  
    - Role: Selects one random camera motion string from a list of 14 options (e.g., "Zoom In", "Pan Left", "Crane Up").  
    - Configuration:  
      - JavaScript code defines an array of camera motions and returns one randomly selected item as `action`.  
    - Input: Receives global settings from "Global SETTINGS".  
    - Output: Passes selected camera motion to "Text 2 Video" node.  
    - Edge Cases: None expected; code is simple and deterministic.  
    - Failure Modes: Syntax errors in code or empty array would cause failure.

  - **Sticky Note1**  
    - Type: Sticky Note  
    - Role: Instructional note "## This is where the magic happens..."  
    - Input/Output: None  

#### 2.3 Video Generation API Request

- **Overview:**  
  This block sends a POST request to the Luma AI Dream Machine API to initiate video generation with the combined prompt and settings.

- **Nodes Involved:**  
  - Text 2 Video (HTTP Request)  
  - Execution Data (Execution Data Capture)

- **Node Details:**

  - **Text 2 Video**  
    - Type: HTTP Request  
    - Role: Sends a POST request to Luma AI API endpoint `/dream-machine/v1/generations` to create a video generation job.  
    - Configuration:  
      - URL: `https://api.lumalabs.ai/dream-machine/v1/generations`  
      - Method: POST  
      - Body (JSON):  
        - `model`: fixed as `"ray-2"`  
        - `prompt`: Combines global prompt with camera motion, e.g. `"a superhero flying through a volcano; camera motion: Zoom In"`  
        - `aspect_ratio`, `duration`, `loop`, `callback_url`: pulled from global settings  
      - Authentication: HTTP Header Auth using Luma AI API key credential  
      - Headers: Accept JSON  
    - Expressions: Uses n8n expressions to dynamically build JSON body from previous nodes.  
    - Input: Receives camera motion from "RANDOM Camera Motion".  
    - Output: Passes API response to "Execution Data".  
    - Edge Cases:  
      - API key invalid or missing → authentication errors  
      - Network timeout or API downtime → request failure  
      - Invalid prompt or parameters → API validation errors  
      - Expression errors in building JSON body  
    - Version: Uses HTTP Request node version 4.2 for advanced JSON body support.

  - **Execution Data**  
    - Type: Execution Data  
    - Role: Captures and passes the response data from the HTTP Request node for further processing.  
    - Configuration: Default; no parameters.  
    - Input: Receives output from "Text 2 Video".  
    - Output: Passes data to "ADD Video Info".  
    - Edge Cases: None typical.

#### 2.4 Airtable Record Creation

- **Overview:**  
  This block creates a new record in Airtable with metadata about the generated video, including generation ID, prompt, aspect ratio, duration, and status.

- **Nodes Involved:**  
  - ADD Video Info (Airtable)

- **Node Details:**

  - **ADD Video Info**  
    - Type: Airtable  
    - Role: Creates a new record in the specified Airtable base and table to store video generation metadata.  
    - Configuration:  
      - Base ID and Table ID are dynamically pulled from global settings.  
      - Operation: Create record  
      - Fields mapped:  
        - Generation ID: from API response `id`  
        - Model: from API response `model`  
        - Aspect: from request parameters  
        - Length: from request parameters  
        - Prompt: from global settings  
        - Status: set to "Done" (hardcoded)  
        - Cluster ID: from global settings  
        - Resolution: from API response `request.resolution`  
      - Credential: Airtable Personal Access Token configured in n8n credentials.  
    - Input: Receives execution data from "Execution Data".  
    - Output: None connected (end of workflow).  
    - Edge Cases:  
      - Invalid Airtable credentials → authentication errors  
      - Incorrect base or table IDs → API errors  
      - Network issues → request failures  
      - Missing required fields → Airtable validation errors  
    - Version: Airtable node version 2.1

---

### 3. Summary Table

| Node Name                  | Node Type          | Functional Role                        | Input Node(s)               | Output Node(s)           | Sticky Note                                                                                  |
|----------------------------|--------------------|-------------------------------------|-----------------------------|--------------------------|----------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger     | Entry point to start workflow manually | None                        | Global SETTINGS          |                                                                                              |
| Global SETTINGS            | Set                | Defines global video generation parameters | When clicking ‘Test workflow’ | RANDOM Camera Motion     | ## Define your SETTINGS here                                                                 |
| Sticky Note                | Sticky Note        | Instructional note for settings      | None                        | None                     | ## Define your SETTINGS here                                                                 |
| RANDOM Camera Motion       | Code               | Randomly selects camera motion effect | Global SETTINGS             | Text 2 Video             | ## This is where the magic happens...                                                        |
| Sticky Note1               | Sticky Note        | Instructional note                   | None                        | None                     | ## This is where the magic happens...                                                        |
| Text 2 Video               | HTTP Request       | Sends video generation request to Luma AI API | RANDOM Camera Motion        | Execution Data           |                                                                                              |
| Execution Data             | Execution Data     | Captures API response data           | Text 2 Video                | ADD Video Info           |                                                                                              |
| ADD Video Info             | Airtable           | Stores video metadata in Airtable    | Execution Data              | None                     |                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add a **Manual Trigger** node named `When clicking ‘Test workflow’`.  
   - No parameters needed.

2. **Create Global SETTINGS Node**  
   - Add a **Set** node named `Global SETTINGS`.  
   - Connect `When clicking ‘Test workflow’` → `Global SETTINGS`.  
   - Define the following fields (all as strings except `cluster_id` which uses an expression):  
     - `video_prompt`: `"a superhero flying through a volcano"`  
     - `aspect_ratio`: `"9:16"`  
     - `loop`: `"true"` (string, interpreted as boolean downstream)  
     - `duration`: `"5s"`  
     - `cluster_id`: Expression: `={{ Date.now() + '_' + Math.random().toString(36).slice(2, 10) }}`  
     - `airtable_base`: Your Airtable base ID (e.g., `"appvk87mtcwRve5p5"`)  
     - `airtable_table_generated_videos`: Your Airtable table ID (e.g., `"tblOzRFWgcsfttRWK"`)  
     - `callback_url`: Your webhook callback URL (e.g., `"https://YOURURL.com/luma-ai"`)

3. **Create RANDOM Camera Motion Node**  
   - Add a **Code** node named `RANDOM Camera Motion`.  
   - Connect `Global SETTINGS` → `RANDOM Camera Motion`.  
   - Paste the following JavaScript code:  
     ```javascript
     const items = [
       "Static",
       "Move Left",
       "Move Right",
       "Move Up",
       "Move Down",
       "Push In",
       "Pull Out",
       "Zoom In",
       "Zoom Out",
       "Pan Left",
       "Pan Right",
       "Orbit Left",
       "Orbit Right",
       "Crane Up",
       "Crane Down"
     ];
     const randomItem = items[Math.floor(Math.random() * items.length)];
     return [{ json: { action: randomItem } }];
     ```

4. **Create Text 2 Video HTTP Request Node**  
   - Add an **HTTP Request** node named `Text 2 Video`.  
   - Connect `RANDOM Camera Motion` → `Text 2 Video`.  
   - Configure as follows:  
     - HTTP Method: POST  
     - URL: `https://api.lumalabs.ai/dream-machine/v1/generations`  
     - Authentication: HTTP Header Auth with your Luma AI API key credential  
     - Headers: Add header `accept: application/json`  
     - Body Content Type: JSON  
     - JSON Body (use expression mode):  
       ```json
       {
         "model": "ray-2",
         "prompt": {{$json["video_prompt"] + "; camera motion: " + $json["action"]}},
         "aspect_ratio": {{$json["aspect_ratio"]}},
         "duration": {{$json["duration"]}},
         "loop": {{$json["loop"] === "true"}},
         "callback_url": {{$json["callback_url"]}}
       }
       ```  
       Note: Adjust expressions to reference the `Global SETTINGS` node data properly, e.g.:  
       ```
       {{ $('Global SETTINGS').first().json.video_prompt + "; camera motion: " + $json.action }}
       ```  
     - Ensure `sendBody` and `sendHeaders` are enabled.

5. **Create Execution Data Node**  
   - Add an **Execution Data** node named `Execution Data`.  
   - Connect `Text 2 Video` → `Execution Data`.  
   - No additional configuration needed.

6. **Create ADD Video Info Airtable Node**  
   - Add an **Airtable** node named `ADD Video Info`.  
   - Connect `Execution Data` → `ADD Video Info`.  
   - Configure:  
     - Credentials: Use your Airtable Personal Access Token credential.  
     - Base ID: Use expression to get from `Global SETTINGS` node: `={{ $('Global SETTINGS').first().json.airtable_base }}`  
     - Table ID: Use expression: `={{ $('Global SETTINGS').first().json.airtable_table_generated_videos }}`  
     - Operation: Create  
     - Map fields as follows:  
       - `Generation ID`: `={{ $json.id }}` (from API response)  
       - `Model`: `={{ $json.model }}`  
       - `Aspect`: `={{ $json.request.aspect_ratio }}`  
       - `Length`: `={{ $json.request.duration }}`  
       - `Prompt`: `={{ $('Global SETTINGS').first().json.video_prompt }}`  
       - `Status`: `"Done"` (hardcoded)  
       - `Cluster ID`: `={{ $('Global SETTINGS').first().json.cluster_id }}`  
       - `Resolution`: `={{ $json.request.resolution }}`

7. **Add Sticky Notes (Optional)**  
   - Add sticky notes near `Global SETTINGS` node with content:  
     ```
     ## Define your SETTINGS here
     ```  
   - Add sticky note near `RANDOM Camera Motion` node with content:  
     ```
     ## This is where the magic happens...
     ```

8. **Save and Activate Workflow**  
   - Save the workflow.  
   - Test by clicking the manual trigger node.  
   - Monitor execution and verify Airtable records are created with correct data.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                  |
|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Airtable Base Template for easy setup of required fields                                        | https://airtable.com/invite/l?inviteId=invOr5AApOnDOtkhi&inviteToken=72a165d2df1c9a1c82a6144effc626f88ad501e9eaab10a1c2f279c3d7a6faff |
| Tutorial Video explaining workflow usage and setup                                             | https://youtu.be/yFCZYGHM9d8                                                                     |
| Workflow designed to be extended with Part 2 for webhook handling and automatic Airtable updates | Mentioned in description as next step                                                           |
| Luma AI API requires valid API key with permissions to create and manage video requests         | Ensure API key is configured in n8n credentials with HTTP Header Auth                            |
| Callback URL placeholder must be replaced with actual webhook URL for receiving video completion notifications | Critical for Part 2 webhook integration                                                          |

---

This documentation provides a complete and detailed reference for understanding, reproducing, and maintaining the "Automate Video Creation with Luma AI Dream Machine and Airtable (Part 1)" workflow.