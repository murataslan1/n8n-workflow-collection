Access data from bubble application

https://n8nworkflows.xyz/workflows/access-data-from-bubble-application-879


# Access data from bubble application

### 1. Workflow Overview

This workflow demonstrates a simple proof of concept for accessing data from a Bubble.io application using n8n. Its primary purpose is to showcase how to connect n8n to a Bubble data collection via Bubble’s API and retrieve data on demand.

The workflow consists of two main logical blocks:

- **1.1 Input Reception:** Manual trigger to initiate the workflow execution.
- **1.2 Bubble API Data Retrieval:** HTTP request configured to fetch user data from a Bubble app’s data API endpoint using authenticated headers.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block provides a manual trigger node that allows users to start the workflow execution on demand. It serves as the entry point for the workflow.

- **Nodes Involved:**  
  - On clicking 'execute'

- **Node Details:**

  - **Node Name:** On clicking 'execute'  
  - **Type:** Manual Trigger  
  - **Technical Role:** Starts the workflow manually; no external inputs.  
  - **Configuration:** Default settings; no parameters needed.  
  - **Key Expressions / Variables:** None.  
  - **Input Connections:** None (starting node).  
  - **Output Connections:** Connected to the "HTTP Request" node to trigger the API call.  
  - **Version-Specific Requirements:** Compatible with all n8n versions supporting manual triggers.  
  - **Potential Failure Types:** None; manual trigger is highly reliable.  
  - **Sub-workflow Reference:** None.

#### 1.2 Bubble API Data Retrieval

- **Overview:**  
  This block performs an authenticated HTTP GET request to the Bubble API endpoint to retrieve user data from the specified Bubble app. It demonstrates how to integrate Bubble’s REST API with n8n through header-based authentication.

- **Nodes Involved:**  
  - HTTP Request

- **Node Details:**

  - **Node Name:** HTTP Request  
  - **Type:** HTTP Request  
  - **Technical Role:** Executes a GET request to fetch user data from Bubble’s API.  
  - **Configuration Choices:**  
    - URL set to `https://n8n-lessons.bubbleapps.io/version-test/api/1.1/obj/user` which targets the Bubble data API for the "user" data type in the version-test environment.  
    - Authentication mode: HTTP Header Authentication using a pre-configured credential named `Bubble n8n Lessons Token`.  
    - No additional options like query parameters or body since it's a simple GET.  
  - **Key Expressions / Variables:** None explicitly used; static URL and credential.  
  - **Input Connections:** Receives trigger signal from the Manual Trigger node.  
  - **Output Connections:** None (end node). Output contains the response data from the Bubble API.  
  - **Version-Specific Requirements:** None special; standard HTTP Request node behavior.  
  - **Potential Failure Types:**  
    - Authentication failure if the token is invalid or expired.  
    - Network errors or timeouts.  
    - API rate limiting or permission errors from Bubble.  
  - **Sub-workflow Reference:** None.

---

### 3. Summary Table

| Node Name              | Node Type         | Functional Role             | Input Node(s)           | Output Node(s)        | Sticky Note                         |
|------------------------|-------------------|----------------------------|------------------------|-----------------------|-----------------------------------|
| On clicking 'execute'  | Manual Trigger    | Initiates workflow manually | None                   | HTTP Request          |                                   |
| HTTP Request           | HTTP Request      | Fetches user data from Bubble API | On clicking 'execute' | None                  |                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Manual Trigger Node:**  
   - Add a new node of type **Manual Trigger**.  
   - Name it `On clicking 'execute'`.  
   - No parameters needed. This node serves as the workflow entry point.

2. **Create the HTTP Request Node:**  
   - Add a new node of type **HTTP Request**.  
   - Name it `HTTP Request`.  
   - Set the **HTTP Method** to `GET` (default).  
   - Set the **URL** to `https://n8n-lessons.bubbleapps.io/version-test/api/1.1/obj/user`.  
   - Under **Authentication**, select **Header Auth**.  
   - Create or select existing HTTP Header Auth credentials:  
     - Credential Name: `Bubble n8n Lessons Token` (or a suitable name).  
     - Configure the credential with the required HTTP header key and value as provided by your Bubble app (usually an API token).  
   - Leave other fields as default.

3. **Connect Nodes:**  
   - Connect the output of the Manual Trigger node `On clicking 'execute'` to the input of the `HTTP Request` node.

4. **Activate and Test:**  
   - Save the workflow.  
   - Execute the manual trigger to test the data retrieval from Bubble.

---

### 5. General Notes & Resources

| Note Content                                                    | Context or Link                                  |
|----------------------------------------------------------------|-------------------------------------------------|
| This workflow is a simple demonstration of connecting n8n to Bubble’s REST data API. | Useful for developers integrating Bubble apps. |
| For Bubble API authentication, ensure your Bubble app’s API token is properly generated and permissions are set. | https://manual.bubble.io/core-resources/api   |
| Bubble API version in URL is `version-test` which targets the development version; change to `live` for production. | Bubble API docs                                 |