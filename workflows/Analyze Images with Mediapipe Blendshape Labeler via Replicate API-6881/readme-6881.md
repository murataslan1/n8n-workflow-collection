Analyze Images with Mediapipe Blendshape Labeler via Replicate API

https://n8nworkflows.xyz/workflows/analyze-images-with-mediapipe-blendshape-labeler-via-replicate-api-6881


# Analyze Images with Mediapipe Blendshape Labeler via Replicate API

### 1. Workflow Overview

This workflow automates the process of analyzing images using the **fire/v-sekai.mediapipe-labeler** model via the Replicate API. It is designed to submit an image URL for analysis, poll the API until the processing is complete, and then extract and structure the results for further use.

**Target Use Cases:**  
- Automated image analysis with blendshape labeling using Mediapipe technology.  
- Integration of the Replicate AI prediction API within n8n workflows.  
- Scenarios requiring polling for asynchronous API responses.  

**Logical Blocks:**  
- **1.1 Input Trigger and API Key Setup:** Initiates the workflow manually and sets the Replicate API key.  
- **1.2 Prediction Request Creation:** Sends a request to the Replicate API to start image analysis.  
- **1.3 Prediction ID Extraction:** Extracts the prediction ID and status from the API response.  
- **1.4 Polling Loop:** Waits and checks the prediction status repeatedly until completion.  
- **1.5 Result Processing:** Parses and formats the final prediction output data.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Trigger and API Key Setup

**Overview:**  
Starts the workflow manually and assigns the Replicate API key for authentication in subsequent requests.

**Nodes Involved:**  
- On clicking 'execute'  
- Set API Key

**Node Details:**

- **On clicking 'execute'**  
  - Type: Manual Trigger  
  - Role: Entry point allowing user to manually start the workflow  
  - Config: No parameters; triggers the flow upon manual execution  
  - Inputs: None  
  - Outputs: Connects to "Set API Key" node  
  - Edge Cases: None inherent, but workflow won't start without manual trigger  

- **Set API Key**  
  - Type: Set  
  - Role: Sets the Replicate API key as a workflow variable  
  - Config: Assigns a string variable `replicate_api_key` with placeholder `"YOUR_REPLICATE_API_KEY"`  
  - Inputs: From manual trigger  
  - Outputs: Connects to "Create Prediction" node  
  - Edge Cases: Missing or invalid API key will cause authentication errors downstream  

---

#### 1.2 Prediction Request Creation

**Overview:**  
Sends a POST request to Replicate’s API to create a prediction job for the specified image.

**Nodes Involved:**  
- Create Prediction

**Node Details:**

- **Create Prediction**  
  - Type: HTTP Request  
  - Role: Sends the image and parameters to the Replicate API to initiate blendshape labeling  
  - Configurations:  
    - URL: `https://api.replicate.com/v1/predictions`  
    - Method: POST  
    - Headers:  
      - Authorization: Bearer token dynamically set from `replicate_api_key`  
      - Content-Type: application/json  
    - Body (JSON): Includes fixed model version, input parameters such as:  
      - `media_path`: URL string of the input image (default: `https://example.com/input.image`)  
      - `max_people`: 100  
      - `export_train`: true  
      - `frame_sample_rate`: 1  
    - Timeout: 60 seconds (to accommodate network latency)  
  - Inputs: From "Set API Key"  
  - Outputs: Connects to "Extract Prediction ID"  
  - Edge Cases:  
    - Network errors or timeouts  
    - HTTP 401/403 if API key invalid  
    - API rejection if input URL invalid or unreachable  
  - Version: HTTP Request node v4.2  

---

#### 1.3 Prediction ID Extraction

**Overview:**  
Extracts the prediction ID and initial status from the API response to enable polling.

**Nodes Involved:**  
- Extract Prediction ID

**Node Details:**

- **Extract Prediction ID**  
  - Type: Code (JavaScript)  
  - Role: Parses the JSON response to retrieve prediction ID, status, and constructs the polling URL  
  - Key expressions:  
    ```js
    const prediction = $input.item.json;
    const predictionId = prediction.id;
    const initialStatus = prediction.status;
    return {
      predictionId: predictionId,
      status: initialStatus,
      predictionUrl: `https://api.replicate.com/v1/predictions/${predictionId}`
    };
    ```  
  - Inputs: From "Create Prediction"  
  - Outputs: Connects to "Wait" node to start polling  
  - Edge Cases:  
    - Missing or malformed ID in response  
    - Unexpected API response structure  

---

#### 1.4 Polling Loop

**Overview:**  
Implements a polling mechanism that waits for 2 seconds and then checks the status of the prediction until it is marked as succeeded.

**Nodes Involved:**  
- Wait  
- Check Prediction Status  
- Check If Complete

**Node Details:**

- **Wait**  
  - Type: Wait  
  - Role: Delays the workflow for 2 seconds between status checks  
  - Config: Fixed 2 seconds delay  
  - Inputs: From "Extract Prediction ID" (initial) and from "Check If Complete" (loop)  
  - Outputs: To "Check Prediction Status"  

- **Check Prediction Status**  
  - Type: HTTP Request  
  - Role: Queries the prediction endpoint to get current processing status  
  - Configurations:  
    - URL: Dynamic, from `predictionUrl` field of previous step  
    - Method: GET (default)  
    - Headers: Authorization with Bearer token from the API key node  
  - Inputs: From "Wait"  
  - Outputs: To "Check If Complete"  
  - Edge Cases:  
    - Network timeouts  
    - API returning error or unexpected response  

- **Check If Complete**  
  - Type: If  
  - Role: Checks if the prediction status is `succeeded`  
  - Condition: Boolean equality check `$json.status === "succeeded"`  
  - Inputs: From "Check Prediction Status"  
  - Outputs:  
    - True branch: To "Process Result"  
    - False branch: Loops back to "Wait" to continue polling  
  - Edge Cases:  
    - Prediction status could be `failed` or other error states not handled explicitly  
    - Infinite loop risk if prediction never completes  

---

#### 1.5 Result Processing

**Overview:**  
Processes and formats the completed prediction data for further consumption or export.

**Nodes Involved:**  
- Process Result

**Node Details:**

- **Process Result**  
  - Type: Code (JavaScript)  
  - Role: Structures relevant output fields including status, output URL, metrics, timestamps, and model name  
  - Code snippet:  
    ```js
    const result = $input.item.json;
    return {
      status: result.status,
      output: result.output,
      metrics: result.metrics,
      created_at: result.created_at,
      completed_at: result.completed_at,
      model: 'fire/v-sekai.mediapipe-labeler',
      image_url: result.output
    };
    ```  
  - Inputs: From "Check If Complete" (true branch)  
  - Outputs: None (end of workflow)  
  - Edge Cases:  
    - Missing expected fields in the API response  

---

### 3. Summary Table

| Node Name                | Node Type             | Functional Role                        | Input Node(s)           | Output Node(s)          | Sticky Note                                                                                          |
|--------------------------|-----------------------|-------------------------------------|------------------------|-------------------------|-----------------------------------------------------------------------------------------------------|
| On clicking 'execute'     | Manual Trigger        | Workflow manual start trigger       | None                   | Set API Key             |                                                                                                     |
| Set API Key              | Set                   | Assign Replicate API key             | On clicking 'execute'   | Create Prediction       |                                                                                                     |
| Create Prediction        | HTTP Request          | Send prediction creation request    | Set API Key             | Extract Prediction ID   |                                                                                                     |
| Extract Prediction ID    | Code                  | Extract prediction ID and status    | Create Prediction       | Wait                    |                                                                                                     |
| Wait                    | Wait                  | Delay between polling requests      | Extract Prediction ID, Check If Complete (false branch) | Check Prediction Status |                                                                                                     |
| Check Prediction Status  | HTTP Request          | Poll prediction status              | Wait                    | Check If Complete       |                                                                                                     |
| Check If Complete        | If                    | Check if prediction succeeded       | Check Prediction Status | Process Result, Wait    |                                                                                                     |
| Process Result           | Code                  | Process and format final output     | Check If Complete (true) | None                    |                                                                                                     |
| Sticky Note             | Sticky Note           | Workflow description and usage info | None                   | None                    | ## Fire V Sekai.mediapipe Labeler Image Generator<br><br>This workflow uses the **fire/v-sekai.mediapipe-labeler** model from Replicate to generate image content.<br><br>### Setup<br>1. Add your Replicate API key<br>2. Configure the input parameters<br>3. Run the workflow<br><br>### Model Details<br>- **Type**: Image Generation<br>- **Provider**: fire<br>- **Required Fields**: media_path |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add a **Manual Trigger** node named `On clicking 'execute'`.  
   - No configuration needed. This node will start the workflow manually.

2. **Create Set Node for API Key**  
   - Add a **Set** node named `Set API Key`.  
   - Create a new string field named `replicate_api_key`.  
   - Set the value to your Replicate API key (replace `"YOUR_REPLICATE_API_KEY"`).  
   - Connect `On clicking 'execute'` output to this node.

3. **Create HTTP Request Node to Create Prediction**  
   - Add an **HTTP Request** node named `Create Prediction`.  
   - Set HTTP Method to POST.  
   - Set URL to `https://api.replicate.com/v1/predictions`.  
   - Under Authentication, select **Generic Credential Type** with **HTTP Header Auth**.  
   - Add header `Authorization` with value: `={{ 'Bearer ' + $('Set API Key').item.json.replicate_api_key }}`.  
   - Add header `Content-Type: application/json`.  
   - For Body Parameters, switch to **JSON** mode and enter:  
     ```json
     {
       "version": "f6cda62f5bdf02558ef9f9d23512a296db9927b2b93b6c57295f3e9d6ae696fa",
       "input": {
         "media_path": "https://example.com/input.image",
         "max_people": 100,
         "export_train": true,
         "frame_sample_rate": 1
       }
     }
     ```  
   - Set timeout to 60000 ms (60 seconds).  
   - Connect output of `Set API Key` to this node.

4. **Create Code Node to Extract Prediction ID**  
   - Add a **Code** node named `Extract Prediction ID`.  
   - Set mode to `Run Once For Each Item`.  
   - Use this JavaScript code:  
     ```js
     const prediction = $input.item.json;
     const predictionId = prediction.id;
     const initialStatus = prediction.status;
     return {
       predictionId: predictionId,
       status: initialStatus,
       predictionUrl: `https://api.replicate.com/v1/predictions/${predictionId}`
     };
     ```  
   - Connect output of `Create Prediction` to this node.

5. **Create Wait Node**  
   - Add a **Wait** node named `Wait`.  
   - Set to wait for 2 seconds.  
   - Connect output of `Extract Prediction ID` to this node.

6. **Create HTTP Request Node to Check Prediction Status**  
   - Add an **HTTP Request** node named `Check Prediction Status`.  
   - Set URL to: `={{ $json.predictionUrl }}` (dynamic from previous node).  
   - Use **Generic Credential Type** with **HTTP Header Auth**.  
   - Add header `Authorization` with value: `={{ 'Bearer ' + $('Set API Key').item.json.replicate_api_key }}`.  
   - Connect output of `Wait` node to this node.

7. **Create If Node to Check Completion**  
   - Add an **If** node named `Check If Complete`.  
   - Set condition: Boolean, check if `$json.status` equals `"succeeded"`.  
   - Connect output of `Check Prediction Status` to this node.

8. **Create Code Node to Process Result**  
   - Add a **Code** node named `Process Result`.  
   - Set mode to `Run Once For Each Item`.  
   - Use this JavaScript code:  
     ```js
     const result = $input.item.json;
     return {
       status: result.status,
       output: result.output,
       metrics: result.metrics,
       created_at: result.created_at,
       completed_at: result.completed_at,
       model: 'fire/v-sekai.mediapipe-labeler',
       image_url: result.output
     };
     ```  
   - Connect the **true** output of `Check If Complete` to this node.

9. **Connect False Branch of If Node Back to Wait**  
   - Connect the **false** output of `Check If Complete` back to the `Wait` node to continue polling.

10. **Add Sticky Note for Documentation (Optional)**  
    - Add a **Sticky Note** node with content describing the workflow purpose, setup instructions, and model details. Place it visually near the start node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                   | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow uses the **fire/v-sekai.mediapipe-labeler** model from Replicate to analyze images by extracting blendshape labels.                                                                                                            | Model provider and workflow purpose                                                               |
| Setup instructions: Add your Replicate API key, configure the input image URL in the "Create Prediction" node, then run the workflow.                                                                                                         | Workflow configuration                                                                              |
| Polling is implemented with a fixed 2-second delay between status checks to balance responsiveness and API rate limits.                                                                                                                     | Polling strategy                                                                                   |
| Ensure your input image URL is publicly accessible to avoid request failures.                                                                                                                                                                 | Input validation                                                                                   |
| API errors such as authentication failure or invalid input should be handled by extending the workflow with error nodes or notifications as this workflow assumes successful requests.                                                        | Error handling recommendation                                                                     |
| Replicate API docs: https://replicate.com/docs/api-reference/predictions/create                                                                                                                                                               | Official API documentation                                                                         |

---

This detailed analysis and structured documentation enable users and automation agents to fully understand, reproduce, and maintain the "Fire V Sekai.mediapipe Labeler Image Generator" workflow in n8n.