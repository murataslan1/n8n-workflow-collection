Auto-Create Airtable CRM Records for Zoom Attendees

https://n8nworkflows.xyz/workflows/auto-create-airtable-crm-records-for-zoom-attendees-8059


# Auto-Create Airtable CRM Records for Zoom Attendees

### 1. Workflow Overview

This workflow automates the creation or updating of CRM records in Airtable for Zoom meeting attendees. It is designed for use cases where businesses want to track participant engagement in Zoom meetings by logging attendee details into a CRM system automatically. The workflow listens for Zoom participant join events, normalizes the attendee data, and then upserts this information into an Airtable base.

Logical blocks:

- **1.1 Input Reception:** Capturing Zoom attendee join events via webhook.
- **1.2 Data Normalization:** Processing and structuring raw Zoom event data into a consistent format.
- **1.3 CRM Record Upsertion:** Creating or updating corresponding records in Airtable.
- **1.4 Setup Guidance:** Provides instructions for configuring Zoom, Airtable, and n8n for this automation.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Captures incoming Zoom webhook POST requests notifying when a participant joins a meeting. This node serves as the entry point to the workflow.

**Nodes Involved:**  
- Zoom Attendee Webhook

**Node Details:**  

- **Zoom Attendee Webhook**  
  - **Type:** Webhook  
  - **Role:** Receives POST requests from Zoom when a participant joins a meeting.  
  - **Configuration:**  
    - HTTP Method: POST  
    - Path: `/zoom-attendee` (this path is exposed externally to Zoom when configuring the Zoom app)  
  - **Expressions/Variables:** None  
  - **Inputs:** External HTTP POST request from Zoom  
  - **Outputs:** JSON payload passed downstream to data normalization  
  - **Version Requirements:** n8n version supporting Webhook node v1 or higher  
  - **Potential Failures:**  
    - Invalid webhook URL or misconfigured Zoom app leading to no data reception  
    - Network connectivity issues blocking webhook calls  
    - Unauthorized or malformed requests  
  - **Sub-workflow Reference:** None

#### 1.2 Data Normalization

**Overview:**  
Processes the raw webhook payload to extract and unify relevant attendee information into a simplified JSON structure for further processing.

**Nodes Involved:**  
- Normalize Attendee Data

**Node Details:**  

- **Normalize Attendee Data**  
  - **Type:** Code (JavaScript)  
  - **Role:** Extracts fields from Zoom’s event payload and standardizes attendee data fields, including fallback handling for missing emails.  
  - **Configuration:**  
    - JavaScript code snippet that:  
      - Extracts `meeting_id`, `topic`, attendee's `join_time`, `leave_time`, `duration`, `user_name`, and email (with fallback logic).  
      - Adds a `timestamp` of processing time in ISO format.  
  - **Expressions/Variables:**  
    - Uses `$input.first().json` to access the incoming webhook JSON  
    - Constructs output JSON with normalized fields  
  - **Inputs:** Output from Zoom Attendee Webhook  
  - **Outputs:** Cleaned JSON object with attendee data fields  
  - **Version Requirements:** n8n Code node v2 recommended for latest JS features  
  - **Potential Failures:**  
    - Missing expected fields in Zoom payload causing runtime errors  
    - Unexpected data formats or null values  
  - **Sub-workflow Reference:** None

#### 1.3 CRM Record Upsertion

**Overview:**  
Uses the normalized data to create or update a record in an Airtable CRM base, tagging new attendees as leads.

**Nodes Involved:**  
- Save to Airtable

**Node Details:**  

- **Save to Airtable**  
  - **Type:** Airtable node  
  - **Role:** Upsert attendee records into a specified Airtable base and table with mapped fields.  
  - **Configuration:**  
    - Airtable Base ID and Table ID must be replaced with user-specific values.  
    - Columns mapped:  
      - Tag = "New Lead" (static value)  
      - Name, Email, Topic, Duration, Join Time, Leave Time, Meeting ID mapped dynamically from normalized data  
    - Operation mode: Upsert (create new or update existing records based on matching keys)  
    - Airtable API credentials configured with full access token  
  - **Expressions/Variables:** Uses expressions like `={{ $json.name }}` to map data fields dynamically  
  - **Inputs:** Normalized attendee data from previous node  
  - **Outputs:** Response from Airtable API with record creation/update confirmation  
  - **Version Requirements:** Airtable node v2 or higher for upsert support  
  - **Potential Failures:**  
    - Authentication errors if API key is invalid or missing  
    - Network/timeout issues communicating with Airtable  
    - Missing or invalid Base/Table IDs leading to API errors  
    - Data validation errors if fields do not match Airtable schema  
  - **Sub-workflow Reference:** None  

#### 1.4 Setup Guidance

**Overview:**  
Provides detailed instructions for configuring the necessary external services and the workflow itself to function correctly.

**Nodes Involved:**  
- Setup Instructions (Sticky Note)

**Node Details:**  

- **Setup Instructions**  
  - **Type:** Sticky Note  
  - **Role:** Documentation embedded within the workflow to help users configure Zoom webhook, Airtable base/table, and n8n credentials and parameters.  
  - **Content Highlights:**  
    - Zoom app creation with `meeting.participant_joined` event and webhook URL setup  
    - Airtable base named "CRM", table named "Attendees", with specified columns  
    - Reminder to replace placeholder Airtable Base ID and Table ID, connect API key  
    - Example Airtable row for reference  
  - **Inputs:** None (informational only)  
  - **Outputs:** None  
  - **Version Requirements:** None  
  - **Potential Failures:** N/A

---

### 3. Summary Table

| Node Name             | Node Type     | Functional Role             | Input Node(s)          | Output Node(s)        | Sticky Note                                                                                                                                                                                                                                                                                                                                                   |
|-----------------------|---------------|----------------------------|------------------------|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Zoom Attendee Webhook  | Webhook       | Capture Zoom join events   | External HTTP POST     | Normalize Attendee Data| See "Setup Instructions" for Zoom app setup with `meeting.participant_joined` event and webhook URL configuration.                                                                                                                                                                                                                                           |
| Normalize Attendee Data| Code          | Normalize Zoom payload     | Zoom Attendee Webhook  | Save to Airtable      |                                                                                                                                                                                                                                                                                                                                                               |
| Save to Airtable       | Airtable      | Upsert CRM records         | Normalize Attendee Data|                       | Replace `YOUR_AIRTABLE_BASE_ID` and `YOUR_AIRTABLE_TABLE_ID` with actual values. Connect Airtable API key with full access. Airtable base should have columns as per instructions.                                                                                                                                                                             |
| Setup Instructions     | Sticky Note   | Setup and configuration    | None                   | None                  | **Setup Steps:** Zoom app with `meeting.participant_joined` event, Airtable base/table with specified columns, replace placeholder IDs, connect credentials. Example Airtable row included.                                                                                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Zoom Attendee Webhook node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `zoom-attendee`  
   - Purpose: Receive Zoom participant join events  
   - No credentials needed  
   - Position on canvas: left side (optional for clarity)  

2. **Create Normalize Attendee Data node**  
   - Type: Code (JavaScript)  
   - Connect input from Zoom Attendee Webhook node  
   - Paste code snippet:  
     ```javascript
     // Normalize Zoom attendee payload
     const e = $input.first().json;
     const attendee = e.payload.object.participant;

     return {
       json: {
         meeting_id: e.payload.object.id,
         topic: e.payload.object.topic,
         join_time: attendee.join_time,
         leave_time: attendee.leave_time,
         duration: attendee.duration,
         name: attendee.user_name,
         email: attendee.email || attendee.user_email || 'unknown',
         timestamp: new Date().toISOString()
       }
     };
     ```
   - Version: Use Code node v2 if available  

3. **Create Save to Airtable node**  
   - Type: Airtable  
   - Connect input from Normalize Attendee Data node  
   - Credentials: Set up Airtable API key credential with full access  
   - Parameters:  
     - Base: Select mode "ID" and enter your Airtable Base ID  
     - Table: Select mode "ID" and enter your Airtable Table ID  
     - Operation: Upsert  
     - Columns mapping:  
       - Tag: Static value `"New Lead"`  
       - Name: Expression `={{ $json.name }}`  
       - Email: Expression `={{ $json.email }}`  
       - Topic: Expression `={{ $json.topic }}`  
       - Duration: Expression `={{ $json.duration }}`  
       - Join Time: Expression `={{ $json.join_time }}`  
       - Leave Time: Expression `={{ $json.leave_time }}`  
       - Meeting ID: Expression `={{ $json.meeting_id }}`  
   - Version: Airtable node v2 or newer recommended  

4. **Add Setup Instructions sticky note**  
   - Type: Sticky Note  
   - Paste the setup instructions content as per the original workflow for user reference  

5. **Connect the nodes**  
   - Zoom Attendee Webhook → Normalize Attendee Data → Save to Airtable  

6. **Configure Zoom app**  
   - Create a Zoom app (JWT or OAuth)  
   - Enable event subscription for `meeting.participant_joined`  
   - Use the webhook URL generated by the Zoom Attendee Webhook node (copy from n8n webhook URL + `/zoom-attendee`)  
   - Activate the app  

7. **Set up Airtable base**  
   - Create a base named "CRM" (or any preferred name)  
   - Create a table named "Attendees" with columns:  
     - Meeting ID  
     - Topic  
     - Name  
     - Email  
     - Join Time  
     - Leave Time  
     - Duration  
     - Tag  

8. **Replace placeholders**  
   - In the Save to Airtable node, replace `YOUR_AIRTABLE_BASE_ID` and `YOUR_AIRTABLE_TABLE_ID` with actual Airtable IDs  

9. **Test workflow**  
   - Trigger a Zoom meeting participant join event  
   - Verify data appears correctly in Airtable  

---

### 5. General Notes & Resources

| Note Content                                                                                                 | Context or Link                                                                                          |
|--------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Zoom app must be configured to send `meeting.participant_joined` event to the n8n webhook URL                | Zoom Developer Portal event subscription documentation                                                  |
| Airtable base/table schema must match columns for successful upsertion                                       | Airtable API documentation for field types and upsert behavior                                         |
| Ensure Airtable API key has full access permissions to avoid authorization errors                            | Airtable API key management                                                                             |
| The example Airtable row in the sticky note shows typical values for quick reference                         | Embedded in the workflow sticky note node                                                              |
| Workflow designed to automatically create new leads tagged as "New Lead" based on Zoom attendance            | Useful for sales, marketing, or customer success teams monitoring meeting participation                 |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.