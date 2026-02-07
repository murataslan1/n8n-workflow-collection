Automate Marker.io Issues to ServiceNow Incidents with Full Technical Context

https://n8nworkflows.xyz/workflows/automate-marker-io-issues-to-servicenow-incidents-with-full-technical-context-8247


# Automate Marker.io Issues to ServiceNow Incidents with Full Technical Context

### 1. Workflow Overview

This workflow automates the creation of ServiceNow incidents from issues reported via Marker.io. It is designed for IT service desks, development, QA, and support teams aiming to streamline bug tracking by automatically transferring rich technical context from Marker.io into ServiceNow.

The workflow consists of three main logical blocks:

- **1.1 Input Reception:** Receives webhook POST requests from Marker.io when a new issue is created.
- **1.2 Data Formatting:** Processes and formats the raw Marker.io webhook payload into structured and enriched data suitable for ServiceNow incident creation.
- **1.3 Incident Creation:** Uses the ServiceNow node to create an incident with the formatted data, including detailed description, reporter info, and links.

---

### 2. Block-by-Block Analysis

#### 2.1 Block: Input Reception

- **Overview:**  
  This block listens for incoming HTTP POST requests from Marker.io's webhook when a new issue is reported.

- **Nodes Involved:**  
  - Webhook

- **Node Details:**

  - **Webhook**  
    - *Type & Role:* HTTP Webhook node; entry point of the workflow.  
    - *Configuration:*  
      - HTTP Method: POST  
      - Path: Unique identifier (`0c89174c-6bf6-4dc6-bdd6-1903d8d16baf`) used to receive Marker.io webhook calls.  
      - No additional options configured.  
    - *Expressions/Variables:* None used at this stage; raw webhook body is received.  
    - *Connections:* Output connected to "Format Marker.io Data" node.  
    - *Version-Specific Requirements:* Requires n8n version supporting webhook node version 2.  
    - *Potential Failures/Edge Cases:*  
      - Webhook URL misconfiguration (wrong path or HTTP method).  
      - Marker.io webhook not activated or linked properly.  
      - Network/firewall issues blocking incoming requests.  
      - Payload structure changes from Marker.io causing downstream parsing errors.  
    - *Sub-workflow:* None.

#### 2.2 Block: Data Formatting

- **Overview:**  
  This block extracts and formats the Marker.io webhook data, enriching it with user-friendly text, technical details, and links, preparing it for ServiceNow incident creation.

- **Nodes Involved:**  
  - Format Marker.io Data

- **Node Details:**

  - **Format Marker.io Data**  
    - *Type & Role:* Code node executing JavaScript to parse and reformat webhook JSON data.  
    - *Configuration Choices:*  
      - Extracts fields such as issue title, description, Marker.io IDs, priority, issue type, URLs (public/private), due date, browser and OS info, website URL, context string, reporter details, and screenshot URL.  
      - Applies string manipulation on screenshot URL to ensure correct `.jpg` extension for image loading.  
      - Builds two main formatted strings:  
        - `titleBody`: The issue title.  
        - `noteBody`: A rich markdown-formatted string with bullet points covering all issue details, technical context, and custom data fields.  
      - Returns a structured JSON object with all these fields for downstream use.  
    - *Key Expressions/Variables:*  
      - Uses `$input.first().json.body.data` to access Marker.io payload.  
      - Conditional logic for optional fields like description and due date.  
      - Array mapping to format custom data fields dynamically.  
    - *Input Connections:* From Webhook node output.  
    - *Output Connections:* To ServiceNow node input.  
    - *Version-Specific Requirements:* Requires n8n supporting code node version 2 and JavaScript ES6+.  
    - *Potential Failures/Edge Cases:*  
      - Payload fields missing or renamed by Marker.io (causing undefined errors).  
      - Screenshot URL format changes breaking regex replacement.  
      - Large or malformed custom data causing formatting issues.  
      - Date parsing errors if dueDate is invalid or absent.  
    - *Sub-workflow:* None.

#### 2.3 Block: Incident Creation

- **Overview:**  
  Creates a new incident in ServiceNow using the formatted data, preserving all critical issue information, including technical context and reporter details.

- **Nodes Involved:**  
  - ServiceNow

- **Node Details:**

  - **ServiceNow**  
    - *Type & Role:* ServiceNow node for creating an incident record via API.  
    - *Configuration Choices:*  
      - Resource: `incident`  
      - Operation: `create`  
      - Authentication: Basic Auth using stored credentials named "ServiceNow Basic Auth account".  
      - Short Description: Uses expression referencing `titleBody` from formatted data.  
      - Description: Uses expression referencing `nodeBody` (rich markdown text) from formatted data.  
      - Additional fields: Caller ID left empty (can be customized).  
    - *Input Connections:* Receives JSON from "Format Marker.io Data" node.  
    - *Output Connections:* None (end node).  
    - *Version-Specific Requirements:* Requires n8n version supporting ServiceNow node version 1 and correct credential configuration.  
    - *Potential Failures/Edge Cases:*  
      - Authentication failures (invalid/expired credentials).  
      - Permission denied if the user lacks incident creation rights.  
      - API rate limits or ServiceNow instance connectivity issues.  
      - Field validation errors if required fields are missing or malformed.  
    - *Sub-workflow:* None.

---

### 3. Summary Table

| Node Name             | Node Type                | Functional Role                      | Input Node(s)            | Output Node(s)         | Sticky Note                                                                                                                  |
|-----------------------|--------------------------|------------------------------------|--------------------------|------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Webhook               | n8n-nodes-base.webhook   | Receives Marker.io webhook POST    |                          | Format Marker.io Data   | # Marker.io to ServiceNow Integration (details on purpose, setup, and benefits)                                              |
| Format Marker.io Data | n8n-nodes-base.code       | Parses and formats Marker.io data  | Webhook                  | ServiceNow              | # Marker.io to ServiceNow Integration (explains data formatting and field extraction)                                         |
| ServiceNow            | n8n-nodes-base.serviceNow | Creates incident in ServiceNow     | Format Marker.io Data     |                        | # Marker.io to ServiceNow Integration (creates incident with full context)                                                    |
| Sticky Note2          | n8n-nodes-base.stickyNote | Documentation and instructions     |                          |                        | Marker.io to ServiceNow Integration (full detailed instructions, benefits, use cases, and data captured)                     |
| Sticky Note3          | n8n-nodes-base.stickyNote | Troubleshooting guidelines          |                          |                        | Troubleshooting tips for webhook, ServiceNow connection, data issues, JS errors, connection issues, and testing recommendations |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Add node: Type `Webhook`  
   - Set HTTP Method to `POST`  
   - Set Path to a unique identifier (e.g., `0c89174c-6bf6-4dc6-bdd6-1903d8d16baf`)  
   - Save the node  
   - This node is the webhook entry point for Marker.io to send issue creation events.

2. **Create Code Node to Format Marker.io Data**  
   - Add node: Type `Code`  
   - Set language to JavaScript  
   - Paste the following logic (adapt as needed):  
     - Extract `data` from `$input.first().json.body.data`  
     - Extract fields: title, description (with fallback), markerId, priority, issueType, URLs, dueDate, browser, OS, website, contextString, reporter info, screenshot URL (modify URL to `.jpg`)  
     - Format `titleBody` as issue title  
     - Format `noteBody` as a markdown string with all issue details including technical context and custom data fields  
   - Return a JSON object containing all extracted and formatted fields  
   - Connect input to Webhook node output.

3. **Create ServiceNow Node to Create Incident**  
   - Add node: Type `ServiceNow`  
   - Set resource to `incident`  
   - Set operation to `create`  
   - Authentication method: Basic Auth  
   - Select or create credentials for ServiceNow (provide instance URL, username, password)  
   - Map `Short Description` to expression: `{{$json["titleBody"]}}`  
   - Map `Description` to expression: `{{$json["nodeBody"]}}`  
   - Leave `Caller ID` empty or set as needed  
   - Connect input to Code node output.

4. **Connect Nodes**  
   - Connect Webhook node’s output to Code node input  
   - Connect Code node’s output to ServiceNow node input

5. **Configure Credentials**  
   - Create a new ServiceNow Basic Auth credential in n8n  
   - Enter ServiceNow instance URL, username, and password with sufficient permissions to create incidents  
   - Test credentials to verify successful connection

6. **Deploy and Test**  
   - Activate the workflow in n8n  
   - Copy the webhook URL from the Webhook node  
   - In Marker.io workspace settings, add this webhook URL under Webhooks, selecting the "Issue Created" event  
   - Trigger a test issue in Marker.io and verify incident creation in ServiceNow with full details

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Context or Link                                                                                              |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| This workflow automates the seamless creation of ServiceNow incidents from Marker.io bug reports, preserving technical and contextual data including screenshots, browser, OS, website, and custom fields. It is ideal for IT, development, QA, and support teams to speed up issue triage and resolution.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Overall workflow purpose                                                                                      |
| Marker.io webhook documentation: Understand the structure of webhook payloads and the types of events available for integration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | https://help.marker.io/en/articles/3738778-webhook-notifications                                               |
| Troubleshooting tips include verifying webhook URL correctness, Marker.io event configuration, ServiceNow credential validity, API limits, and JavaScript code robustness against payload changes. Use n8n’s data pinning feature to debug live data and test ServiceNow API calls independently.                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Provided in Sticky Note3 within the workflow                                                                  |
| For optimal screenshot URL handling, the code replaces the pattern `/0?` with `/0.jpg?` to ensure the image is correctly referenced. Verify Marker.io screenshot URLs conform to this pattern.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Within Format Marker.io Data node code                                                                        |
| Recommended ServiceNow permissions: Ensure the user account used has incident creation rights and API access enabled to avoid authentication or authorization failures.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Workflow prerequisites                                                                                        |
| Customize field mappings by editing the JavaScript code or ServiceNow node parameters to fit your instance schema or add additional metadata as required.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Workflow customization advice                                                                                  |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All processed data is legal and publicly available.