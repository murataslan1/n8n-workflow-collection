Automate Tally Form Submissions to Airtable with Gmail Responses

https://n8nworkflows.xyz/workflows/automate-tally-form-submissions-to-airtable-with-gmail-responses-5433


# Automate Tally Form Submissions to Airtable with Gmail Responses

### 1. Workflow Overview

This n8n workflow automates the handling of Tally form submissions by capturing responses, structuring the data, saving it into Airtable, and sending an automated confirmation email via Gmail. It is designed for users who want to eliminate manual copy-pasting of form responses, ensuring data consistency and timely communication with respondents.

The workflow is logically divided into four main blocks:

- **1.1 Input Reception:** Capture Tally form submissions via a webhook.
- **1.2 Data Structuring:** Clean and structure the raw form data for easier downstream processing.
- **1.3 Data Persistence:** Store the structured data as a new record in Airtable.
- **1.4 Automated Email Response:** Wait for a short period, then send a personalized confirmation email to the form submitter using Gmail.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block triggers the workflow whenever a new Tally form is submitted. It uses a webhook to receive JSON payloads containing the form response data.

- **Nodes Involved:**  
  - Webhook : Tally

- **Node Details:**  
  - **Webhook : Tally**  
    - *Type:* Webhook node  
    - *Role:* Entry point that listens for HTTP POST requests from Tally form submissions.  
    - *Configuration:*  
      - HTTP Method: POST  
      - Path: `formulaire-tally` (custom URL endpoint for webhook)  
      - Authentication: None (open endpoint to accept form data)  
      - Respond Immediately: Enabled (responds with HTTP 200 to Tally right after receiving data)  
    - *Key Expressions:* None at this stage; raw JSON input is captured.  
    - *Input Connections:* None (start node).  
    - *Output Connections:* Connects to the “Edit Fields” node.  
    - *Potential Failures:*  
      - Missing or malformed POST data from Tally.  
      - Network connectivity issues.  
      - Unauthorized or unexpected requests if security is not enforced.  
    - *Sub-workflow:* None.

#### 2.2 Data Structuring

- **Overview:**  
  This block converts the raw array of form fields from Tally into a structured JSON object with named properties, making data easier to reference and map downstream.

- **Nodes Involved:**  
  - Edit Fields

- **Node Details:**  
  - **Edit Fields (Set node)**  
    - *Type:* Set node  
    - *Role:* Transforms and flattens raw Tally response fields into descriptive keys.  
    - *Configuration:*  
      - "Keep Only Set" enabled to discard original data and keep only assigned fields.  
      - Assignments:  
        - `full_name` = `$json.body.data.fields[0].value`  
        - `company_name` = `$json.body.data.fields[1].value`  
        - `job_title` = `$json.body.data.fields[2].value`  
        - `email` = `$json.body.data.fields[3].value`  
        - `phone_number` = `$json.body.data.fields[4].value`  
      - Note: Field indices correspond to the order of questions in the Tally form and must be updated if form changes.  
    - *Key Expressions:* Uses JavaScript expressions to extract values from nested JSON.  
    - *Input Connections:* Connected from the “Webhook : Tally” node.  
    - *Output Connections:* Connects to the “Airtable : Create a record” node.  
    - *Potential Failures:*  
      - Index out of bounds if the form fields array is shorter than expected.  
      - Changes in Tally form structure without updating the node.  
      - Null or undefined values if fields are empty.  
    - *Sub-workflow:* None.

#### 2.3 Data Persistence

- **Overview:**  
  This block inserts the cleaned form data into a specified Airtable base and table, creating a new record with mapped fields.

- **Nodes Involved:**  
  - Airtable : Create a record

- **Node Details:**  
  - **Airtable : Create a record**  
    - *Type:* Airtable node  
    - *Role:* Creates a new record in Airtable with the structured form data.  
    - *Configuration:*  
      - Base: Selected Airtable base (e.g., "Client Requests")  
      - Table: Selected table within base (e.g., "Client Requests")  
      - Operation: Create (adds a new record)  
      - Column Mappings:  
        - "Email" = `{{$json.email}}`  
        - "Full Name" = `{{$json.full_name}}`  
        - "Job Title" = `{{$json.job_title}}`  
        - "Company Name" = `{{$json.company_name}}`  
        - "Phone Number" = `{{$json.phone_number}}`  
      - Mapping Mode: Define fields explicitly, no type conversion.  
    - *Credentials:* Airtable Personal Access Token with data.records:read, data.records:write, schema.bases:read permissions.  
    - *Input Connections:* From "Edit Fields" node.  
    - *Output Connections:* Connects to the "Wait" node.  
    - *Potential Failures:*  
      - Authentication failure due to invalid or expired token.  
      - Network or API rate limiting errors.  
      - Schema mismatch if Airtable columns are renamed or removed.  
    - *Sub-workflow:* None.

#### 2.4 Automated Email Response

- **Overview:**  
  After storing the data, this block waits for a configured delay to avoid robotic immediate responses, then sends a personalized confirmation email to the form submitter via Gmail.

- **Nodes Involved:**  
  - Wait  
  - GMAIL : Send a message

- **Node Details:**  
  - **Wait**  
    - *Type:* Wait node  
    - *Role:* Introduces a delay before sending the email to improve recipient experience.  
    - *Configuration:*  
      - Wait Mode: Wait for a period of time  
      - Duration: Default (not explicitly set in JSON, but recommended 5-10 minutes)  
      - Unit: Minutes  
    - *Input Connections:* From "Airtable : Create a record" node.  
    - *Output Connections:* Connects to "GMAIL : Send a message" node.  
    - *Potential Failures:*  
      - Workflow interruptions or restarts could reset wait timer.  
    - *Sub-workflow:* None.

  - **GMAIL : Send a message**  
    - *Type:* Gmail node  
    - *Role:* Sends an automated thank-you email to the form submitter.  
    - *Configuration:*  
      - Send To: `{{$json.fields.Email}}` (Note: The exact path in JSON is fields.Email, ensure correct input mapping.)  
      - Subject: "Thanks for reaching out!"  
      - Message (HTML): Personalized email including full name, company, and job title using expressions like `{{$json.fields['Full Name']}}`  
      - Authentication: OAuth2 via Gmail account credentials  
    - *Credentials:* Gmail account connected via OAuth2  
    - *Input Connections:* From "Wait" node  
    - *Output Connections:* None (end of workflow)  
    - *Potential Failures:*  
      - OAuth token expiry or revocation causing authentication errors.  
      - Invalid email addresses causing send failures.  
      - Gmail API rate limits or quota exceeded.  
    - *Sub-workflow:* None.

---

### 3. Summary Table

| Node Name              | Node Type           | Functional Role                         | Input Node(s)          | Output Node(s)          | Sticky Note                                                                                                                         |
|------------------------|---------------------|---------------------------------------|-----------------------|-------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| Webhook : Tally        | Webhook             | Capture Tally form submissions        | None                  | Edit Fields             | ## STEP 1 — Capture Tally Form Responses<br>Trigger the workflow automatically every time someone submits your Tally form.         |
| Edit Fields            | Set                 | Clean and structure raw form data     | Webhook : Tally       | Airtable : Create a record | ## STEP 2 — Clean and Structure the Form Data (Set node)<br>Take the raw data sent by Tally and turn it into clean, readable JSON. |
| Airtable : Create a record | Airtable           | Save structured data to Airtable      | Edit Fields           | Wait                    | ## STEP 3 — Save Data in Airtable<br>Automatically add each submission to Airtable with proper field mapping and authentication.    |
| Wait                   | Wait                | Delay before sending confirmation email | Airtable : Create a record | GMAIL : Send a message   | ## STEP 4 — Send an Automatic Confirmation Email<br>Delay sending email to feel more natural.                                       |
| GMAIL : Send a message | Gmail               | Send confirmation email to submitter | Wait                  | None                    | ## STEP 4 — Send an Automatic Confirmation Email<br>Send a professional email confirming receipt of the submission.                 |
| Sticky Note            | Sticky Note         | Workflow introduction and summary     | None                  | None                    | **Still manually copy-pasting your Tally form responses?**<br>What if every submission went straight into Airtable — and the user got an automatic email right after?<br>That’s exactly what this workflow does.<br>No code, no headache — just a simple and fast automation:<br>**Tally → Airtable → Gmail.** |
| Sticky Note1           | Sticky Note         | Detailed instructions for webhook setup | None                  | None                    | ## STEP 1 — Capture Tally Form Responses<br>Detailed guidance on webhook setup and test submission process.                         |
| Sticky Note2           | Sticky Note         | Instructions on cleaning data         | None                  | None                    | ## STEP 2 — Clean and Structure the Form Data (Set node)<br>Explanation of field indexing and data structuring.                     |
| Sticky Note3           | Sticky Note         | Guidance on Airtable setup             | None                  | None                    | ## STEP 3 — Save Data in Airtable<br>Instructions on creating base, token, and mapping fields.                                       |
| Sticky Note4           | Sticky Note         | Email sending best practices           | None                  | None                    | ## STEP 4 — Send an Automatic Confirmation Email<br>How to configure Wait and Gmail nodes for better UX.                           |
| Sticky Note5           | Sticky Note         | Workflow completion summary            | None                  | None                    | ## End of the Workflow<br>Your lead fills out the Tally form → info goes to Airtable → they get a clean, professional email.        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Webhook node**  
   - Node Type: Webhook  
   - Name: `Webhook : Tally`  
   - HTTP Method: POST  
   - Path: `formulaire-tally`  
   - Authentication: None  
   - Respond Immediately: Enabled  
   - Purpose: To receive Tally form submissions via HTTP POST.

2. **Add a Set node to clean data**  
   - Node Type: Set  
   - Name: `Edit Fields`  
   - Enable “Keep Only Set” option.  
   - Add fields with expressions (adapt index as per your Tally form structure):  
     - `full_name`: `{{$json.body.data.fields[0].value}}`  
     - `company_name`: `{{$json.body.data.fields[1].value}}`  
     - `job_title`: `{{$json.body.data.fields[2].value}}`  
     - `email`: `{{$json.body.data.fields[3].value}}`  
     - `phone_number`: `{{$json.body.data.fields[4].value}}`  
   - Connect this node’s input to the webhook node’s output.

3. **Add Airtable node to create record**  
   - Node Type: Airtable  
   - Name: `Airtable : Create a record`  
   - Credentials: Configure Airtable Personal Access Token with proper permissions.  
   - Base: Select or enter your Airtable base ID or name.  
   - Table: Select or enter your table ID or name.  
   - Operation: Create  
   - Map fields explicitly:  
     - Email → `{{$json.email}}`  
     - Full Name → `{{$json.full_name}}`  
     - Job Title → `{{$json.job_title}}`  
     - Company Name → `{{$json.company_name}}`  
     - Phone Number → `{{$json.phone_number}}`  
   - Connect input from `Edit Fields` node.

4. **Add Wait node**  
   - Node Type: Wait  
   - Name: `Wait`  
   - Mode: Wait for a period of time  
   - Duration: 5 to 10 minutes (recommended)  
   - Unit: Minutes  
   - Connect input from Airtable node.

5. **Add Gmail node to send email**  
   - Node Type: Gmail  
   - Name: `GMAIL : Send a message`  
   - Credentials: Configure Gmail OAuth2 credentials.  
   - Operation: Send  
   - To: `{{$json.fields.Email}}` (verify path depending on input data)  
   - Subject: "Thanks for reaching out!"  
   - Message Type: HTML  
   - Message Body: Use HTML template with placeholders:  
     ```
     <p>Hi {{ $json.fields['Full Name'] }},</p>
     <p>Thanks for reaching out! We’ve received your request and our team will get back to you as soon as possible.</p>
     <p><strong>Here’s a quick summary:</strong></p>
     <ul>
       <li><strong>Company:</strong> {{ $json.fields['Company Name'] }}</li>
       <li><strong>Job Title:</strong> {{ $json.fields['Job Title'] }}</li>
     </ul>
     <p>We’ll be in touch very soon!</p>
     <p>— The Team</p>
     ```  
   - Connect input from Wait node.

6. **Connect all nodes in order:**  
   Webhook : Tally → Edit Fields → Airtable : Create a record → Wait → GMAIL : Send a message

7. **Activate workflow and test:**  
   - Save and activate the workflow.  
   - Copy webhook URL and configure it in your Tally form under Form Settings > Integrations > Webhooks.  
   - Submit test entries to verify data flow and email sending.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                         | Context or Link                                                                                      |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Still manually copy-pasting your Tally form responses? Automate the process so every submission goes directly to Airtable, and the user receives an automatic email right after. No code, no headache — just simple, fast automation: Tally → Airtable → Gmail.                                      | Sticky Note introduction                                                                              |
| Detailed instructions on setting up the Tally webhook and performing a test submission to capture form structure.                                                                                                                                                                                | Sticky Note1                                                                                        |
| Explanation on cleaning and structuring the raw Tally form data using a Set node, emphasizing the importance of field index accuracy.                                                                                                                                                             | Sticky Note2                                                                                        |
| Guidance on creating an Airtable base and table, generating a personal access token with correct permissions, and mapping fields in the Airtable node.                                                                                                                                            | Sticky Note3                                                                                        |
| Best practices for sending confirmation emails, including adding a delay using the Wait node to avoid robotic instant responses, and configuring Gmail OAuth2 credentials.                                                                                                                          | Sticky Note4                                                                                        |
| Final workflow summary: lead fills out Tally form → data saved in Airtable → automated confirmation email sent without manual intervention.                                                                                                                                                       | Sticky Note5                                                                                        |
| Airtable Personal Access Token creation guide: https://airtable.com/create/tokens                                                                                                                                                                                                                   | Referenced in Sticky Note3                                                                           |

---

**Disclaimer:**  
The text provided stems exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.