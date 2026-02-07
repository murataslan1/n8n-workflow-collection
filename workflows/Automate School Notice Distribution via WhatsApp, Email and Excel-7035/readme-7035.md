Automate School Notice Distribution via WhatsApp, Email and Excel

https://n8nworkflows.xyz/workflows/automate-school-notice-distribution-via-whatsapp--email-and-excel-7035


# Automate School Notice Distribution via WhatsApp, Email and Excel

### 1. Workflow Overview

This workflow automates the distribution of school notices via WhatsApp, Email, and Excel updates. It is designed to run daily at 9 AM, automatically fetching pending notices from an Excel workbook, validating and processing them for targeted distribution, sending personalized messages to relevant stakeholders, and updating the distribution status for tracking.

**Logical blocks included:**

- **1.1 Scheduled Trigger & Data Input**  
  Automates the daily start of the workflow and reads pending notices from Excel.

- **1.2 Data Validation**  
  Ensures notices have required fields before further processing.

- **1.3 Notice Processing & Audience Matching**  
  Matches each notice with the correct target audience contacts.

- **1.4 Message Content Preparation**  
  Generates customized email and WhatsApp message contents.

- **1.5 Distribution**  
  Sends out emails and WhatsApp messages using configured services.

- **1.6 Status Update & Reporting**  
  Updates the Excel sheet to mark notices as distributed.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Data Input

**Overview:**  
This block initiates the workflow every day at 9 AM and reads pending notices from an Excel workbook to begin processing.

**Nodes Involved:**  
- Daily Notice Check - 9 AM  
- Read Notices

**Node Details:**

- **Daily Notice Check - 9 AM**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow daily at 9:00 AM.  
  - Configuration: Trigger set to hour 9 daily.  
  - Inputs: None (trigger node).  
  - Outputs: Starts the flow to "Read Notices".  
  - Failure modes: Workflow won't trigger if n8n server is down or scheduling service fails.

- **Read Notices**  
  - Type: Microsoft Excel (worksheet read)  
  - Role: Fetches notices marked as "Pending" from a specified Excel workbook and worksheet.  
  - Configuration: Reads rows where the "Status" column equals "Pending". Uses OAuth2 credentials for Excel access.  
  - Inputs: Trigger from schedule node.  
  - Outputs: Passes notice data to validation node.  
  - Failure modes: Excel file inaccessible, authentication failure, or no matching rows found.

---

#### 1.2 Data Validation

**Overview:**  
Validates that each notice has essential fields: title, message, and target audience, filtering out incomplete notices.

**Nodes Involved:**  
- Validate Notice Data

**Node Details:**

- **Validate Notice Data**  
  - Type: If Node (conditional filtering)  
  - Role: Checks that title, message, and targetAudience fields are non-empty.  
  - Configuration: Three string conditions all must be true.  
  - Inputs: Output from "Read Notices".  
  - Outputs: Passes valid notices to "Process Notice Distribution"; invalid notices are ignored (no further output).  
  - Failure modes: Missing or malformed data causes notices to be dropped silently.

---

#### 1.3 Notice Processing & Audience Matching

**Overview:**  
For each valid notice, this block matches the target audience with stakeholder contacts and prepares a distribution list.

**Nodes Involved:**  
- Process Notice Distribution

**Node Details:**

- **Process Notice Distribution**  
  - Type: Code Node (JavaScript)  
  - Role: Joins notice data with stakeholder contacts, filtering contacts by target audience (e.g., All, Students, Parents, Teachers, Staff). Creates detailed objects for each notice-contact pair.  
  - Configuration:  
    - Reads input from "Read Notices" and "Read Stakeholder Contacts" (contacts are expected to be read elsewhere but this node assumes those inputs).  
    - Contacts filtered by audience field with case-insensitive matching.  
    - Generates noticeId if missing, sets default priority "Medium".  
    - Adds status "Ready for Distribution" and distribution date.  
  - Inputs: Validated notices and contacts (the contacts input node is not visible in JSON but implied by JS code).  
  - Outputs: List of processed notice-contact pairs for message preparation.  
  - Failure modes: Missing contacts or malformed data; if contacts input is absent or empty, no distribution will occur.

---

#### 1.4 Message Content Preparation

**Overview:**  
This block creates personalized message bodies formatted for email and WhatsApp channels.

**Nodes Involved:**  
- Prepare Email Content  
- Prepare WhatsApp Content

**Node Details:**

- **Prepare Email Content**  
  - Type: Code Node (JavaScript)  
  - Role: Constructs email subject and plain-text body with notice details and personalized greeting.  
  - Configuration: Uses input notice-contact pair JSON fields such as title, priority, message, and contactName to build email content.  
  - Inputs: Processed notices from "Process Notice Distribution".  
  - Outputs: JSON including recipient email, subject, body, and metadata for downstream use.  
  - Failure modes: Missing email address or malformed data could cause send failure.

- **Prepare WhatsApp Content**  
  - Type: Code Node (JavaScript)  
  - Role: Formats WhatsApp message text with emojis and notice details for official look.  
  - Configuration: Uses similar data fields as email but formats message for WhatsApp text.  
  - Inputs: Processed notices from "Process Notice Distribution".  
  - Outputs: JSON with recipient phone, message body, and metadata.  
  - Failure modes: Missing or invalid phone number causes message send failure.

---

#### 1.5 Distribution

**Overview:**  
Sends the prepared messages through Email and WhatsApp API, then triggers status updates.

**Nodes Involved:**  
- Send Email Notice  
- Send WhatsApp Notice

**Node Details:**

- **Send Email Notice**  
  - Type: Email Send  
  - Role: Sends plain-text email using SMTP credentials.  
  - Configuration:  
    - From address: notices@school.edu  
    - Subject and body use expressions from previous node output.  
    - SMTP credentials are pre-configured for authentication.  
  - Inputs: Prepared email content.  
  - Outputs: On success, triggers "Update Notice Status".  
  - Failure modes: SMTP auth failures, network issues, invalid email addresses.

- **Send WhatsApp Notice**  
  - Type: HTTP Request  
  - Role: Sends WhatsApp messages via Facebook Graph API (WhatsApp Business API).  
  - Configuration:  
    - POST request to Graph API v17 endpoint with phone number and message body in JSON.  
    - Headers include Authorization Bearer token and Content-Type JSON.  
    - Requires valid access token and correct phone number formats.  
  - Inputs: Prepared WhatsApp content.  
  - Outputs: On success, triggers "Update Notice Status".  
  - Failure modes: Token expiry, API limits, invalid phone numbers, HTTP errors.

---

#### 1.6 Status Update & Reporting

**Overview:**  
Updates the Excel sheet to mark notices as distributed, enabling tracking of sent notices.

**Nodes Involved:**  
- Update Notice Status

**Node Details:**

- **Update Notice Status**  
  - Type: Microsoft Excel (worksheet update)  
  - Role: Updates notice status in Excel workbook to reflect distribution.  
  - Configuration:  
    - Matches rows by "title" column.  
    - Updates status or other relevant fields.  
    - Uses OAuth2 credentials for authentication.  
  - Inputs: Output from either "Send Email Notice" or "Send WhatsApp Notice".  
  - Outputs: None (end of workflow).  
  - Failure modes: Excel access issues, concurrency conflicts, unmatched titles.

---

### 3. Summary Table

| Node Name               | Node Type               | Functional Role                         | Input Node(s)           | Output Node(s)                 | Sticky Note                                                                                                                                             |
|-------------------------|-------------------------|---------------------------------------|-------------------------|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| Daily Notice Check - 9 AM | Schedule Trigger        | Triggers workflow daily at 9 AM       | None                    | Read Notices                  |                                                                                                                                                         |
| Read Notices            | Microsoft Excel         | Reads pending notices from Excel      | Daily Notice Check - 9 AM | Validate Notice Data           |                                                                                                                                                         |
| Validate Notice Data    | If Node                 | Validates notice fields are non-empty | Read Notices             | Process Notice Distribution    |                                                                                                                                                         |
| Process Notice Distribution | Code Node             | Matches notices with stakeholders     | Validate Notice Data      | Prepare Email Content, Prepare WhatsApp Content |                                                                                                                                                         |
| Prepare Email Content   | Code Node               | Creates personalized email messages   | Process Notice Distribution | Send Email Notice             |                                                                                                                                                         |
| Prepare WhatsApp Content | Code Node               | Creates formatted WhatsApp messages   | Process Notice Distribution | Send WhatsApp Notice          |                                                                                                                                                         |
| Send Email Notice       | Email Send              | Sends email using SMTP                 | Prepare Email Content     | Update Notice Status           |                                                                                                                                                         |
| Send WhatsApp Notice    | HTTP Request            | Sends WhatsApp message via API        | Prepare WhatsApp Content  | Update Notice Status           |                                                                                                                                                         |
| Update Notice Status    | Microsoft Excel         | Updates Excel to mark notice sent     | Send Email Notice, Send WhatsApp Notice | None                  |                                                                                                                                                         |
| Workflow Documentation  | Sticky Note             | Explains workflow structure           | None                    | None                          | ### **School Notice Distribution Workflow Components**\n\n**📅 Triggers:**\n* **Daily Notice Check - 9 AM** - Scheduled trigger for automated daily notice distribution\n\n**📊 Data Processing:**\n* **Read Notices** - Fetches notices from Excel database\n* **Validate Notice Data** - Ensures notice data completeness and format\n* **Process Notice Distribution** - Matches notices with target audiences\n\n**📧 Communication:**\n* **Prepare Email Content** - Creates personalized email messages\n* **Prepare WhatsApp Content** - Formats WhatsApp messages with emojis\n* **Send Email Notice** - Distributes via email to stakeholders\n* **Send WhatsApp Notice** - Sends WhatsApp messages via Business API\n\n**📈 Reporting:**\n* **Update Notice Status** - Marks notices as distributed |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node: "Daily Notice Check - 9 AM"**  
   - Type: Schedule Trigger  
   - Set trigger to daily at 9:00 AM.

2. **Create Microsoft Excel Node: "Read Notices"**  
   - Type: Microsoft Excel (worksheet read)  
   - Configure OAuth2 credentials for Microsoft Excel API.  
   - Select the workbook (e.g., notices-workbook-001) and worksheet (default or specified).  
   - Add filter: Status equals "Pending".  
   - Connect output from "Daily Notice Check - 9 AM" to this node.

3. **Create If Node: "Validate Notice Data"**  
   - Type: If  
   - Configure three string conditions: title is not empty, message is not empty, targetAudience is not empty.  
   - Connect output from "Read Notices" to this node.

4. **Create Code Node: "Process Notice Distribution"**  
   - Type: Code  
   - Insert JavaScript code that:  
     - Reads the array of notices and stakeholder contacts (stakeholder contacts input must be added as a separate data source in your environment).  
     - Filters contacts based on notice targetAudience (all, students, parents, teachers, staff).  
     - Constructs objects combining notice and contact info; assigns noticeId if missing; sets priority defaulting to "Medium".  
     - Sets distributionDate to today’s date in "YYYY-MM-DD" format.  
     - Sets status to "Ready for Distribution".  
   - Connect output from "Validate Notice Data" (true branch) to this node.

5. **Create Code Node: "Prepare Email Content"**  
   - Type: Code  
   - JavaScript to generate email subject and body using notice-contact data fields.  
   - Personalized greeting and structured message including notice details.  
   - Connect output from "Process Notice Distribution" to this node.

6. **Create Code Node: "Prepare WhatsApp Content"**  
   - Type: Code  
   - JavaScript to format WhatsApp message text with emojis and notice details.  
   - Connect output from "Process Notice Distribution" to this node.

7. **Create Email Send Node: "Send Email Notice"**  
   - Type: Email Send  
   - Configure SMTP credentials with valid email account (e.g., "SMTP -test").  
   - From email: notices@school.edu  
   - Set subject to expression referencing previous node's subject.  
   - Set text content to expression referencing previous node's body.  
   - Set recipient email to previous node’s to field.  
   - Connect output from "Prepare Email Content" to this node.

8. **Create HTTP Request Node: "Send WhatsApp Notice"**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: https://graph.facebook.com/v17.0/FROM_PHONE_NUMBER_ID/messages (replace placeholder).  
   - Headers:  
     - Authorization: Bearer YOUR_ACCESS_TOKEN (replace with valid token).  
     - Content-Type: application/json  
   - Body (JSON):  
     ```json
     {
       "messaging_product": "whatsapp",
       "to": "{{ $json.phone }}",
       "type": "text",
       "text": {
         "body": "{{ $json.message }}"
       }
     }
     ```  
   - Connect output from "Prepare WhatsApp Content" to this node.

9. **Create Microsoft Excel Node: "Update Notice Status"**  
   - Type: Microsoft Excel (worksheet update)  
   - Configure OAuth2 credentials for Excel access.  
   - Select same workbook and worksheet as "Read Notices".  
   - Set operation to "update".  
   - Column to match on: title.  
   - Map fields to update status to reflect notice distribution (e.g., "Distributed").  
   - Connect outputs from both "Send Email Notice" and "Send WhatsApp Notice" nodes to this node.

10. **(Optional) Add Sticky Note Node: "Workflow Documentation"**  
    - Type: Sticky Note  
    - Add content describing the workflow blocks and logic for future reference.

---

### 5. General Notes & Resources

| Note Content                                                                                                                      | Context or Link                                                                                                                                               |
|----------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| The WhatsApp Business API requires a valid phone number ID and access token; refer to https://developers.facebook.com/docs/whatsapp for setup. | WhatsApp API integration details and token acquisition instructions.                                                                                        |
| SMTP credentials must be securely stored and configured in n8n credentials manager for email sending.                             | SMTP email sending configuration best practices.                                                                                                            |
| Excel OAuth2 credentials require user consent and correct permissions for reading and writing workbooks.                         | Microsoft Graph API documentation: https://docs.microsoft.com/en-us/graph/                                                                                   |
| The workflow assumes stakeholder contacts are maintained and accessible; a node or external process must provide this data.       | Missing contacts input will cause distribution failure; ensure contacts are read or passed as input prior to processing.                                     |
| Distribution status update depends on matching notice titles exactly; consider using a unique ID in production to avoid conflicts.| Data integrity recommendation to avoid overwriting wrong rows in Excel.                                                                                      |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.