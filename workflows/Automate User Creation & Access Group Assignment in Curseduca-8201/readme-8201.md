Automate User Creation & Access Group Assignment in Curseduca

https://n8nworkflows.xyz/workflows/automate-user-creation---access-group-assignment-in-curseduca-8201


# Automate User Creation & Access Group Assignment in Curseduca

### 1. Workflow Overview

This workflow automates the creation of a new user in the Curseduca platform and assigns them to a specific access group based on input data received via an HTTP POST webhook. It is designed for use cases where user onboarding needs to be seamlessly integrated with group membership assignment, such as in educational or organizational platforms managing access permissions.

Logical blocks:

- **1.1 Input Reception:** Capture user data including name, email, and target group identifier via an HTTP webhook.
- **1.2 User Creation & Group Assignment:** Use the captured data to call the Curseduca API to create the user and assign them to the specified group.
- **1.3 Setup & Documentation:** Provide setup instructions and example payloads as sticky notes for user reference.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
This block receives incoming HTTP POST requests containing user data needed to create a member in Curseduca. It acts as the entry point for the workflow.

- **Nodes Involved:**  
  - Webhook - Capture User Data

- **Node Details:**  

  - **Node Name:** Webhook - Capture User Data  
  - **Type and Technical Role:** Webhook node; listens for incoming HTTP POST requests at a specified endpoint.  
  - **Configuration Choices:**  
    - HTTP Method: POST  
    - Path: `creators-create-user-with-group` (endpoint URL suffix)  
    - No additional options enabled (default handling).  
  - **Key Expressions or Variables:**  
    - Captures the entire incoming JSON payload, expecting at least `name`, `email`, and `groupId` fields in the request body.  
  - **Input/Output Connections:**  
    - No input node (entry point).  
    - Output connected to "Curseduca - Create User & Assign Group".  
  - **Version-Specific Requirements:**  
    - Uses n8n Webhook node version 2.1 features, compatible with standard webhook behavior.  
  - **Edge Cases / Potential Failures:**  
    - Missing or malformed JSON body could cause downstream failures.  
    - Invalid HTTP method (only POST allowed).  
    - No authentication or validation on webhook input (security considerations).  
  - **Sub-workflow Reference:** None.

#### 1.2 User Creation & Group Assignment

- **Overview:**  
This block sends a POST request to the Curseduca API to create a new user and assign the user to the specified group. It also triggers an email notification to the user upon registration.

- **Nodes Involved:**  
  - Curseduca - Create User & Assign Group

- **Node Details:**  

  - **Node Name:** Curseduca - Create User & Assign Group  
  - **Type and Technical Role:** HTTP Request node; performs REST API interaction with Curseduca to create a member.  
  - **Configuration Choices:**  
    - HTTP Method: POST  
    - URL: `https://prof.curseduca.pro/members`  
    - Request Body: JSON formatted with dynamic expressions injected from webhook data:  
      ```json
      {
        "name": "{{ $json.body.name }}",
        "email": "{{ $json.body.email }}",
        "group": { "id": {{ $json.body.groupId }} },
        "notifications": [ { "type": "EMAIL" } ],
        "sendMemberRegisteredEmail": true
      }
      ```  
    - Headers: Include two authentication headers:  
      - `api_key` with placeholder `<API_KEY>`  
      - `Authorization` with placeholder `Bearer <BEARER_TOKEN>`  
    - Sends body as JSON payload.  
  - **Key Expressions or Variables:**  
    - Uses expressions to dynamically insert `name`, `email`, and `groupId` from the webhook JSON body.  
  - **Input/Output Connections:**  
    - Input from "Webhook - Capture User Data".  
    - No outputs connected (end node).  
  - **Version-Specific Requirements:**  
    - HTTP Request node version 4.2 or higher recommended for current parameter structure.  
  - **Edge Cases / Potential Failures:**  
    - Authentication errors if API key or bearer token are invalid or missing.  
    - API endpoint errors (e.g., invalid group ID, duplicate user email).  
    - Network timeout or connectivity issues.  
    - Malformed request body if input data is incomplete.  
  - **Sub-workflow Reference:** None.

#### 1.3 Setup & Documentation

- **Overview:**  
Provides key usage instructions and an example payload for users configuring or invoking the webhook.

- **Nodes Involved:**  
  - ⚠️ Setup Instructions (Sticky Note)  
  - 📩 Example Payload (Sticky Note)

- **Node Details:**  

  - **Node Name:** ⚠️ Setup Instructions  
    - **Type and Technical Role:** Sticky Note; informational only.  
    - **Content Summary:**  
      - Reminds to replace placeholder API credentials in the HTTP Request node headers.  
      - Notes that `groupId` must be included in the webhook body alongside `name` and `email`.  
    - **Connections:** None (informational).  
    - **Edge Cases:** None.  

  - **Node Name:** 📩 Example Payload  
    - **Type and Technical Role:** Sticky Note; provides example JSON payload for webhook input.  
    - **Content Summary:**  
      ```json
      {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "groupId": 123
      }
      ```  
    - **Connections:** None (informational).  
    - **Edge Cases:** None.

---

### 3. Summary Table

| Node Name                         | Node Type      | Functional Role                      | Input Node(s)              | Output Node(s)                  | Sticky Note                                                                                  |
|----------------------------------|----------------|------------------------------------|---------------------------|--------------------------------|----------------------------------------------------------------------------------------------|
| Webhook - Capture User Data       | Webhook        | Receive user creation data          | -                         | Curseduca - Create User & Assign Group |                                                                                              |
| Curseduca - Create User & Assign Group | HTTP Request   | Create user and assign group on Curseduca | Webhook - Capture User Data | -                              | ⚠️ Setup Instructions: Replace <API_KEY> and <BEARER_TOKEN> in headers; send `groupId` with name and email. |
| ⚠️ Setup Instructions            | Sticky Note    | Setup instructions and reminders   | -                         | -                              | ⚠️ Setup Instructions: Replace <API_KEY> and <BEARER_TOKEN> in headers; send `groupId` with name and email. |
| 📩 Example Payload               | Sticky Note    | Example webhook body payload       | -                         | -                              | 📩 Example Webhook Body: { "name": "Jane Doe", "email": "jane@example.com", "groupId": 123 }  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Add a **Webhook** node named `Webhook - Capture User Data`.  
   - Set HTTP Method to `POST`.  
   - Set the path to `creators-create-user-with-group`.  
   - Leave other options at default.  
   - This node will receive incoming JSON containing `name`, `email`, and `groupId`.

2. **Create HTTP Request Node**  
   - Add an **HTTP Request** node named `Curseduca - Create User & Assign Group`.  
   - Set HTTP Method to `POST`.  
   - Set the URL to `https://prof.curseduca.pro/members`.  
   - In the "Body Parameters" section, select "Raw Body" or "JSON" (depending on n8n version) and input the following JSON with expressions:  
     ```json
     {
       "name": "{{ $json.body.name }}",
       "email": "{{ $json.body.email }}",
       "group": { "id": {{ $json.body.groupId }} },
       "notifications": [ { "type": "EMAIL" } ],
       "sendMemberRegisteredEmail": true
     }
     ```  
   - Under "Headers", add two header parameters:  
     - `api_key` with the placeholder value `<API_KEY>` (to be replaced by actual API key).  
     - `Authorization` with the placeholder value `Bearer <BEARER_TOKEN>` (to be replaced by actual Bearer token).  
   - Set "Send Body" to true and specify body type as JSON.  
   - Connect the output of `Webhook - Capture User Data` node to this HTTP Request node input.

3. **Add Sticky Notes for Documentation**  
   - Add a **Sticky Note** named `⚠️ Setup Instructions`.  
     - Content:  
       ```
       ⚠️ Setup Instructions:
       - Replace <API_KEY> and <BEARER_TOKEN> in headers
       - Send `groupId` along with `name` and `email` in the webhook body
       ```  
   - Add a **Sticky Note** named `📩 Example Payload`.  
     - Content:  
       ```
       📩 Example Webhook Body:
       {
         "name": "Jane Doe",
         "email": "jane@example.com",
         "groupId": 123
       }
       ```  
   - Position sticky notes near related nodes for clarity.

4. **Credentials Setup**  
   - Ensure valid API credentials are available and replace placeholders `<API_KEY>` and `<BEARER_TOKEN>` in the HTTP Request node headers before activation.

5. **Activate Webhook**  
   - Deploy and activate the workflow to start listening for incoming POST requests at the specified webhook path.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                          |
|--------------------------------------------------------------------------------------------------|-----------------------------------------|
| Use of sensitive API keys and bearer tokens requires secure storage and management in production. | Security best practices for API credentials |
| The workflow assumes the Curseduca API endpoint and parameters remain stable; verify API docs if errors occur. | Curseduca API official documentation (not linked here) |
| Webhook endpoint path `creators-create-user-with-group` must be unique and not conflict with other webhooks. | n8n webhook management guidelines       |

---

**Disclaimer:**  
The text provided is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected material. All data handled is legal and publicly accessible.