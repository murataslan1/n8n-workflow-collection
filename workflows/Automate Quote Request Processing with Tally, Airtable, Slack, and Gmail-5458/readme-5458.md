Automate Quote Request Processing with Tally, Airtable, Slack, and Gmail

https://n8nworkflows.xyz/workflows/automate-quote-request-processing-with-tally--airtable--slack--and-gmail-5458


# Automate Quote Request Processing with Tally, Airtable, Slack, and Gmail

### 1. Workflow Overview

This workflow automates the processing of quote requests submitted via a Tally form. It is designed for businesses that receive incoming client inquiries requesting quotes and want to streamline their lead management and communication. The workflow consists of the following logical blocks:

- **1.1 Input Reception:** A webhook receives the quote request data posted by Tally upon form submission.
- **1.2 Data Transformation:** Raw form data (an array of labeled fields) is converted into structured fields with meaningful variable names.
- **1.3 Data Logging:** The structured data is saved as a new record in an Airtable base for CRM and tracking purposes.
- **1.4 Team Notification:** A Slack message is sent to alert the sales or relevant team about the new quote request.
- **1.5 Delay Before Client Follow-up:** A Wait node pauses the workflow to allow internal team response before the automated thank-you email is sent.
- **1.6 Client Acknowledgment:** A personalized thank-you email is sent to the requester via Gmail.

This end-to-end pipeline replaces manual email checks, lead data entry, and notifications with a fully automated system, improving response time and operational efficiency.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Receives HTTP POST requests from the Tally form when a quote request is submitted.

- **Nodes Involved:**  
  - `Webhook : Tally`

- **Node Details:**  
  - **Type:** Webhook  
  - **Role:** Entry point of the workflow, listens for incoming POST requests at the path `/Request a Quote`.  
  - **Configuration:**  
    - HTTP Method: POST  
    - Path: `Request a Quote`  
    - No authentication required  
    - Responds immediately to Tally to avoid timeout  
  - **Expressions/Variables:** Receives payload in `body.data.fields` as an array of objects with `label` and `value`.  
  - **Input:** External HTTP POST from Tally form submission  
  - **Output:** Passes raw JSON data downstream  
  - **Potential Failures:** Network issues, webhook unavailability, malformed requests  
  - **Sticky Notes:** Step 1 details the webhook configuration and data format

#### 2.2 Data Transformation

- **Overview:**  
  Converts the raw array of fields into discrete, named variables for easier downstream use.

- **Nodes Involved:**  
  - `Edit Fields`

- **Node Details:**  
  - **Type:** Set node  
  - **Role:** Maps each item from the incoming array into individual variables such as `Name`, `Email Address`, `Type of Service Needed`, etc.  
  - **Configuration:**  
    - Manual assignments using expressions, e.g.,  
      - `Name` = `{{$json.body.data.fields[0].label}}` (Note: This seems to map label for Name, possibly a minor inconsistency)  
      - `Email Address` = `{{$json.body.data.fields[1].value}}`  
      - Other fields mapped similarly from array indexes 2-5  
  - **Input:** Raw JSON array from webhook  
  - **Output:** JSON object with clean key-value pairs for each form field  
  - **Potential Failures:** Index out of range if Tally changes form structure, missing or malformed fields  
  - **Sticky Notes:** Step 2 explains the mapping rationale and expressions used

#### 2.3 Data Logging

- **Overview:**  
  Creates a new record in an Airtable base, storing the quote request as a CRM lead.

- **Nodes Involved:**  
  - `Create a record`

- **Node Details:**  
  - **Type:** Airtable node  
  - **Role:** Insert a new row into the configured Airtable base/table with mapped fields  
  - **Configuration:**  
    - Base: "Request a Quote - Airtable Base" (appZ7CtNukjbwxDap)  
    - Table: Corresponding table in the base (tblcS0ZQeEo4dC1Iv)  
    - Operation: Create record  
    - Manual field mappings from `Edit Fields` output, e.g.:  
      - `Name` → `{{$json.Name}}`  
      - `Email` → `{{$json["Email Address"]}}`  
      - `Type of Service` → `{{$json["Type of Service Needed"]}}`  
      - Other fields mapped accordingly  
  - **Input:** Structured JSON from `Edit Fields`  
  - **Output:** Confirmation of record creation with Airtable response data  
  - **Credentials:** Airtable Personal Access Token (PAT) required  
  - **Potential Failures:** Authentication errors, API rate limits, field mismatches, network issues  
  - **Sticky Notes:** Step 3 details field mapping and base info

#### 2.4 Team Notification

- **Overview:**  
  Sends a Slack message notifying the team about the new quote request with all relevant details.

- **Nodes Involved:**  
  - `Send a message` (Slack node)

- **Node Details:**  
  - **Type:** Slack node  
  - **Role:** Post a message to a specified Slack channel summarizing the new request  
  - **Configuration:**  
    - Channel: `#sales` (channel ID C0945G1RY0Y)  
    - Message: Formatted text with dynamic fields, e.g.  
      - Name, Email, Service, Budget, Timeline, Notes  
    - Authentication: OAuth2 for Slack  
  - **Input:** Airtable record data from `Create a record` node  
  - **Output:** Slack API response confirming message sent  
  - **Credentials:** Slack OAuth2 account configured  
  - **Potential Failures:** Slack API limits, authentication expiration, channel permissions  
  - **Sticky Notes:** Step 4 includes message format and channel details

#### 2.5 Delay Before Client Follow-up

- **Overview:**  
  Pauses the workflow for 5 minutes before sending an acknowledgment email, allowing team members to respond manually if needed.

- **Nodes Involved:**  
  - `Wait`

- **Node Details:**  
  - **Type:** Wait node  
  - **Role:** Introduces a time delay before continuing execution  
  - **Configuration:**  
    - Wait type: Resume after time interval  
    - Duration: 5 minutes  
  - **Input:** Slack message completion trigger  
  - **Output:** Resumes workflow after delay  
  - **Potential Failures:** Workflow interruptions, system time changes  
  - **Sticky Notes:** Step 5 describes the purpose and settings of the wait node

#### 2.6 Client Acknowledgment

- **Overview:**  
  Sends a personalized thank-you email to the requester via Gmail.

- **Nodes Involved:**  
  - `GMAIL : Send a message`

- **Node Details:**  
  - **Type:** Gmail node  
  - **Role:** Sends an email to the requester's address confirming receipt of their quote request  
  - **Configuration:**  
    - To: `{{$('Edit Fields').item.json['Email Address']}}`  
    - Subject: "Thanks for your quote request 🙌"  
    - Message body: Personalized text including requester's Name and a thank you note  
    - HTML email format  
  - **Input:** Triggered after wait node  
  - **Output:** Gmail API response with email sending confirmation  
  - **Credentials:** Gmail OAuth2 account configured  
  - **Potential Failures:** OAuth token expiry, Gmail API limits, invalid email format  
  - **Sticky Notes:** Step 6 outlines email content and recipient details

---

### 3. Summary Table

| Node Name           | Node Type             | Functional Role                 | Input Node(s)        | Output Node(s)       | Sticky Note                                                                                          |
|---------------------|-----------------------|--------------------------------|----------------------|----------------------|----------------------------------------------------------------------------------------------------|
| Sticky Note         | Sticky Note           | Overview description            |                      |                      | **=== AUTOMATION OVERVIEW ===** Workflow: Tally → Airtable → Slack → Gmail; purpose and intro      |
| Sticky Note1        | Sticky Note           | Webhook explanation             |                      |                      | **== STEP 1 – Webhook (Tally) ==** Details on webhook trigger, path, and data format                |
| Webhook : Tally     | Webhook               | Receives form submission        |                      | Edit Fields          |                                                                                                    |
| Sticky Note2        | Sticky Note           | Data transformation explanation |                      |                      | **== STEP 2 – Edit Fields ==** Manual mapping of array to variables                                |
| Edit Fields         | Set                   | Maps raw array to variables     | Webhook : Tally      | Create a record      |                                                                                                    |
| Sticky Note3        | Sticky Note           | Airtable record creation info   |                      |                      | **== STEP 3 – Create Airtable Record ==** Base, table, and field mapping details                   |
| Create a record     | Airtable              | Logs quote request in Airtable  | Edit Fields          | Send a message       |                                                                                                    |
| Sticky Note4        | Sticky Note           | Slack notification details      |                      |                      | **== STEP 4 – Send Slack Notification ==** Channel, message format                                |
| Send a message      | Slack                 | Sends Slack alert to team       | Create a record      | Wait                 |                                                                                                    |
| Sticky Note5        | Sticky Note           | Wait node explanation           |                      |                      | **== STEP 5 – Wait Node ==** Delay before sending email                                            |
| Wait                | Wait                  | Delay before email              | Send a message       | GMAIL : Send a message |                                                                                                    |
| Sticky Note6        | Sticky Note           | Gmail sending details           |                      |                      | **== STEP 6 – Send Email via Gmail ==** Recipient, subject, and email body                         |
| GMAIL : Send a message | Gmail                | Sends thank-you email to client | Wait                 |                      |                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Webhook Node (Webhook : Tally):**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `Request a Quote`  
   - No authentication needed  
   - This node will receive JSON payloads from the Tally form containing `body.data.fields` array.

2. **Add a Set Node (Edit Fields):**  
   - Type: Set  
   - Purpose: Map the incoming array of fields to named variables.  
   - Assign the following fields using expressions:  
     - `Name`: `{{$json.body.data.fields[0].label}}` (verify if label or value is intended)  
     - `Email Address`: `{{$json.body.data.fields[1].value}}`  
     - `Type of Service Needed`: `{{$json.body.data.fields[2].value}}`  
     - `Estimated Budget`: `{{$json.body.data.fields[3].value}}`  
     - `Preferred Timeline`: `{{$json.body.data.fields[4].value}}`  
     - `Additional Details or Questions`: `{{$json.body.data.fields[5].value}}`  
   - Connect output of Webhook node to this Set node.

3. **Configure Airtable Node (Create a record):**  
   - Type: Airtable  
   - Operation: Create  
   - Base: Select your Airtable base for quote requests  
   - Table: Select appropriate table within the base  
   - Map fields manually:  
     - `Name` → `{{$json.Name}}`  
     - `Email` → `{{$json["Email Address"]}}`  
     - `Type of Service` → `{{$json["Type of Service Needed"]}}`  
     - `Estimated Budget (€)` → `{{$json["Estimated Budget"]}}`  
     - `Preferred Timeline` → `{{$json["Preferred Timeline"]}}`  
     - `Additional Details` → `{{$json["Additional Details or Questions"]}}`  
   - Set Airtable credentials using a Personal Access Token with write access  
   - Connect Edit Fields node output to this Airtable node.

4. **Add Slack Node (Send a message):**  
   - Type: Slack  
   - Authentication: OAuth2 with Slack app credentials  
   - Channel: Select your team channel (e.g., #sales)  
   - Message text:  
     ```
     :new: *New quote request received!*

     *👤 Name:* {{ $json.fields.Name }}
     *📧 Email:* {{ $json.fields.Email }}
     *💼 Service:* {{ $json.fields['Type of Service'] }}
     *💰 Budget:* {{ $json.fields['Estimated Budget (€)'] }}
     *⏱️ Timeline:* {{ $json.fields['Preferred Timeline'] }}
     *📝 Notes:* {{ $json.fields['Additional Details'] }}
     ```  
   - Connect Airtable node output to this Slack node.

5. **Add Wait Node:**  
   - Type: Wait  
   - Wait Mode: Resume after time interval  
   - Time Interval: 5 minutes  
   - Connect Slack node output to this Wait node.

6. **Add Gmail Node (GMAIL : Send a message):**  
   - Type: Gmail  
   - Authentication: OAuth2 with Gmail credentials  
   - To: `{{$('Edit Fields').item.json['Email Address']}}`  
   - Subject: "Thanks for your quote request 🙌"  
   - Message body (HTML or plain text):  
     ```
     Hi {{$('Edit Fields').item.json.Name}},

     Thanks a lot for your quote request — we’ve received your information!

     Our team will get back to you within the next 24 hours to discuss your project.

     Talk soon,  
     — The WebExperts Team
     ```  
   - Connect Wait node output to this Gmail node.

7. **Test the Workflow:**  
   - Ensure Tally form submits POST requests to your webhook URL.  
   - Verify Airtable records are created correctly.  
   - Check Slack channel for notifications.  
   - Confirm thank-you emails are received after delay.  

---

### 5. General Notes & Resources

| Note Content                                                                                                               | Context or Link                                                                                                          |
|----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| This workflow automates client quote requests from form submission to team notification and client acknowledgment emails. | Workflow title: "Automate Quote Request Processing with Tally, Airtable, Slack, and Gmail"                                |
| Slack channel used in the example is named `#sales`. Adjust channel ID as needed.                                           | Slack node configuration                                                                                                 |
| Airtable base and table IDs are specific to the example, replace with your own Airtable setup.                              | Airtable node configuration                                                                                              |
| Delay of 5 minutes before sending the confirmation email allows manual team intervention.                                   | Wait node rationale                                                                                                      |
| Gmail OAuth2 credentials require proper consent and token refresh setup for uninterrupted email sending.                    | Gmail node configuration                                                                                                |
| The Tally webhook expects data in a specific JSON structure; any changes in Tally form fields order require Set node update.| Webhook and Edit Fields nodes dependency                                                                                  |

---

**Disclaimer:** The provided text is exclusively from an automated workflow created with n8n, a tool for integration and automation. This process strictly adheres to content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.