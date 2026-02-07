Automate School Trip Consent Forms with Email Verification, PDF Generation & Google Drive

https://n8nworkflows.xyz/workflows/automate-school-trip-consent-forms-with-email-verification--pdf-generation---google-drive-10454


# Automate School Trip Consent Forms with Email Verification, PDF Generation & Google Drive

---

### 1. Workflow Overview

This workflow automates the processing of school trip consent forms submitted by parents. It is designed to securely capture consent data, verify parent email authenticity, generate a legally formatted consent PDF, store the document in Google Drive, and notify the class teacher via email.

**Target Use Cases:**  
- Schools collecting parental consent for student trips  
- Ensuring authenticity of consent submissions through email verification  
- Automating document generation and archival  
- Streamlining teacher notifications upon successful consent capture

**Logical Blocks:**  
- **1.1 Input Reception:** Receives POST requests containing consent form data via webhook.  
- **1.2 Email Verification:** Validates the parent's email to prevent fake or disposable addresses.  
- **1.3 Validation Branch:** Routes workflow based on email verification result.  
- **1.4 Unique Consent ID Generation:** Creates a timestamp-based unique identifier for tracking.  
- **1.5 PDF Generation:** Converts HTML-formatted consent data into a print-ready PDF document.  
- **1.6 PDF Handling:** Downloads the generated PDF.  
- **1.7 Google Drive Upload:** Stores the PDF in a structured Drive folder.  
- **1.8 Teacher Notification:** Sends an email to the teacher with consent details and Drive link.  
- **1.9 Final Response:** Sends success or error JSON responses back to the webhook caller.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Listens for incoming POST requests with parent and trip consent details, capturing all necessary fields.

- **Nodes Involved:**  
  - Webhook Trigger  
  - Sticky Note - Webhook

- **Node Details:**  
  - *Webhook Trigger*  
    - Type: Webhook  
    - Role: Entry point receiving POST data at path `/consent`  
    - Configuration: Accepts POST method, responds via response node  
    - Inputs: External HTTP POST requests  
    - Outputs: JSON with fields: parent_name, parent_email, child_name, child_class, trip_name, trip_date, teacher_email  
    - Edge Cases: Missing fields, malformed JSON, unauthorized access (no auth configured)  
  - *Sticky Note - Webhook*  
    - Type: Sticky Note  
    - Role: Documentation of expected input JSON structure  
    - No functional impact

#### 2.2 Email Verification

- **Overview:**  
  Validates that the parent's email is genuine and not disposable, reducing fraudulent submissions.

- **Nodes Involved:**  
  - Verifi Email  
  - Sticky Note - VerifiEmail

- **Node Details:**  
  - *Verifi Email*  
    - Type: VerifiEmail node (third-party integration)  
    - Role: Calls VerifiEmail API with parent_email extracted from webhook data  
    - Configuration: Uses VerifiEmail API credentials  
    - Input: JSON with parent_email field  
    - Output: JSON including `valid` boolean field  
    - Edge Cases: API key invalid, request timeout, API quota exceeded, malformed email input  
  - *Sticky Note - VerifiEmail*  
    - Type: Sticky Note  
    - Role: Documentation of verification purpose

#### 2.3 Validation Branch

- **Overview:**  
  Checks the email verification result and branches the workflow accordingly to continue processing or send an error.

- **Nodes Involved:**  
  - IF Email Valid  
  - Error Response - Invalid Email  
  - Sticky Note - IF Validation  
  - Sticky Note - Error Handler

- **Node Details:**  
  - *IF Email Valid*  
    - Type: IF node (Boolean check)  
    - Role: Tests if `valid` property is `true`  
    - Configuration: Condition: `{{$json.valid}} == true`  
    - Inputs: Output from Verifi Email node  
    - Outputs: Two branches - true path to consent ID generation, false path to error response  
  - *Error Response - Invalid Email*  
    - Type: Respond to Webhook  
    - Role: Sends HTTP 400 response with JSON error message indicating invalid email  
    - Configuration: Status code 400, JSON body with status "error" and descriptive message  
    - Inputs: False branch of IF Email Valid  
    - Outputs: Ends workflow  
  - *Sticky Notes*  
    - Describe branching logic and error handling

#### 2.4 Unique Consent ID Generation

- **Overview:**  
  Generates a unique consent ID using the current timestamp and adds generation timestamps for audit and display.

- **Nodes Involved:**  
  - Generate Consent ID  
  - Sticky Note - Generate ID

- **Node Details:**  
  - *Generate Consent ID*  
    - Type: Code node (JavaScript)  
    - Role: Creates a unique ID prefixed with "CONSENT-" and ISO timestamps  
    - Configuration: Uses JavaScript Date APIs to generate IDs and formatted date strings  
    - Inputs: True branch of IF Email Valid node  
    - Outputs: JSON extended with `consent_id`, `generated_at`, `generated_date`  
    - Edge Cases: Date generation errors unlikely; ensure system clock accuracy  
  - *Sticky Note - Generate ID*  
    - Documents importance of unique ID for tracking and legal purposes

#### 2.5 PDF Generation

- **Overview:**  
  Converts the consent data into a visually styled, print-ready PDF document using HTML and CSS.

- **Nodes Involved:**  
  - HTML to PDF1  
  - Sticky Note - HTML to PDF

- **Node Details:**  
  - *HTML to PDF1*  
    - Type: HTMLCSSToPDF node  
    - Role: Converts HTML content (templated with consent data) into PDF format  
    - Configuration: HTML includes styling, consent details, signatures section, verification badges  
    - Credentials: HTMLCSSToPDF API key  
    - Inputs: JSON with consent data and generated IDs  
    - Outputs: JSON containing URL to generated PDF (`pdf_url`)  
    - Edge Cases: API limits, malformed HTML, network timeouts  
  - *Sticky Note - HTML to PDF*  
    - Describes document formatting and quality

#### 2.6 PDF Handling

- **Overview:**  
  Downloads the PDF from the generated URL to prepare for upload.

- **Nodes Involved:**  
  - Download file  
  - Sticky Note (Download the PDF)

- **Node Details:**  
  - *Download file*  
    - Type: HTTP Request node  
    - Role: Performs a GET request to fetch the PDF file from the URL returned by HTML to PDF node  
    - Configuration: Response set to file format for downstream storage  
    - Inputs: PDF URL from previous node  
    - Outputs: Binary data of PDF file for upload  
    - Edge Cases: URL expired, network failure, large file size issues  
  - *Sticky Note*  
    - Explains purpose of downloading PDF

#### 2.7 Google Drive Upload

- **Overview:**  
  Uploads the consent PDF to a structured folder in Google Drive for archival and easy retrieval.

- **Nodes Involved:**  
  - Upload to Google Drive  
  - Sticky Note - Google Drive

- **Node Details:**  
  - *Upload to Google Drive*  
    - Type: Google Drive node  
    - Role: Uploads PDF binary file to specified Drive folder  
    - Configuration:  
      - Filename: `{ChildName}_{ConsentID}.pdf` (spaces replaced with underscores)  
      - Folder: Target folder ID for "School_Consents" subfolder hierarchy  
      - Credentials: OAuth2 with Google Drive scopes  
    - Inputs: Binary PDF from Download file node  
    - Outputs: Metadata about uploaded file  
    - Edge Cases: Authentication failure, quota limit, folder ID invalid, file name conflicts  
  - *Sticky Note - Google Drive*  
    - Describes folder hierarchy and naming conventions

#### 2.8 Teacher Notification

- **Overview:**  
  Sends an email notification to the class teacher containing consent details and Google Drive reference.

- **Nodes Involved:**  
  - Send Gmail to Teacher  
  - Sticky Note - Gmail Notification

- **Node Details:**  
  - *Send Gmail to Teacher*  
    - Type: Gmail node  
    - Role: Sends a plaintext email to the teacher's email address  
    - Configuration:  
      - Recipient: extracted from webhook input  
      - Subject: Includes child name and trip name dynamically  
      - Message body: Includes consent ID, child/class/trip details, parent info, verification badge, and Google Drive location  
      - Credentials: Gmail OAuth2 with send mail permissions  
    - Inputs: Metadata from Google Drive upload and original webhook data  
    - Outputs: Confirmation of email sent  
    - Edge Cases: Authentication failure, invalid teacher email, Gmail API quota exceeded  
  - *Sticky Note - Gmail Notification*  
    - Explains email content and recipients

#### 2.9 Final Response

- **Overview:**  
  Returns a success JSON response to the initial webhook caller confirming processing completion.

- **Nodes Involved:**  
  - Success Response  
  - Sticky Note - Success Response

- **Node Details:**  
  - *Success Response*  
    - Type: Respond to Webhook  
    - Role: Sends HTTP 200 JSON response with full consent details and statuses (email verified, stored, notified)  
    - Configuration: JSON body templated with workflow data output  
    - Inputs: Output of Send Gmail to Teacher node  
    - Edge Cases: Failures in previous nodes would have stopped workflow, so this node represents success only  
  - *Sticky Note - Success Response*  
    - Documents response contents

---

### 3. Summary Table

| Node Name                  | Node Type                 | Functional Role                          | Input Node(s)            | Output Node(s)           | Sticky Note                                                                                     |
|----------------------------|---------------------------|----------------------------------------|--------------------------|--------------------------|------------------------------------------------------------------------------------------------|
| Sticky Note - Workflow Overview | Sticky Note              | Documents workflow purpose and inputs  |                          |                          | ## 🎯 WORKFLOW START Purpose, Trigger, Expected Input                                          |
| Sticky Note - Credentials Setup  | Sticky Note              | Documents required credentials setup   |                          |                          | ## 🔑 SETUP CREDENTIALS Accounts & API keys needed (VerifiEmail, Google, PDF)                  |
| Webhook Trigger             | Webhook                   | Receives POST request with consent data|                          | Verifi Email             | ## 📥 STEP 1: Webhook Trigger Receives and captures form fields                               |
| Sticky Note - Webhook       | Sticky Note               | Documents webhook input example        |                          |                          | JSON example of expected input                                                                |
| Verifi Email                | VerifiEmail node          | Validates parent email authenticity    | Webhook Trigger          | IF Email Valid           | ## 📧 STEP 2: Email Verification Validates email authenticity and detects disposable addresses|
| Sticky Note - VerifiEmail   | Sticky Note               | Documents email verification step      |                          |                          |                                                                                               |
| IF Email Valid              | IF node                   | Branches flow based on email validity  | Verifi Email             | Generate Consent ID, Error Response - Invalid Email | ## ✅ STEP 3: Validation Check TRUE path continues, FALSE sends error                      |
| Sticky Note - IF Validation | Sticky Note               | Documents validation logic              |                          |                          |                                                                                               |
| Error Response - Invalid Email | Respond to Webhook       | Sends 400 error response on invalid email | IF Email Valid (false)   |                          | ## ❌ ERROR HANDLER Sends error response and stops workflow                                    |
| Sticky Note - Error Handler | Sticky Note               | Documents error handler                 |                          |                          |                                                                                               |
| Generate Consent ID         | Code node                 | Generates unique consent ID and timestamps | IF Email Valid (true)    | HTML to PDF1             | ## 🔢 STEP 4: Generate Unique ID Creates unique ID, timestamps                                |
| Sticky Note - Generate ID   | Sticky Note               | Documents ID generation                 |                          |                          |                                                                                               |
| HTML to PDF1               | HTMLCSSToPDF node         | Converts consent data HTML to PDF       | Generate Consent ID      | Download file            | ## 📑 STEP 5: Convert to PDF Converts HTML to print-ready PDF                                 |
| Sticky Note - HTML to PDF   | Sticky Note               | Documents PDF generation                |                          |                          |                                                                                               |
| Download file              | HTTP Request              | Downloads PDF binary from generated URL | HTML to PDF1             | Upload to Google Drive   | ## Download the PDF GETs the PDF file                                                         |
| Sticky Note                | Sticky Note               | Documents PDF download step             |                          |                          |                                                                                               |
| Upload to Google Drive      | Google Drive node         | Uploads PDF to Drive folder             | Download file            | Send Gmail to Teacher    | ## ☁️ STEP 7: Upload to Google Drive Folder structure and naming conventions                 |
| Sticky Note - Google Drive  | Sticky Note               | Documents Drive upload                   |                          |                          |                                                                                               |
| Send Gmail to Teacher       | Gmail node                | Sends email notification to teacher    | Upload to Google Drive   | Success Response         | ## 📧 STEP 8: Notify Teacher Email with consent details and Drive location                     |
| Sticky Note - Gmail Notification | Sticky Note           | Documents teacher notification          |                          |                          |                                                                                               |
| Success Response            | Respond to Webhook        | Sends success JSON response             | Send Gmail to Teacher    |                          | ## ✅ STEP 9: Send Success Response Includes all consent and workflow statuses                |
| Sticky Note - Success Response | Sticky Note             | Documents final webhook response        |                          |                          |                                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Trigger node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `consent`  
   - Response Mode: Respond with node output  
   - No authentication (or add as needed)  

2. **Add Verifi Email node**  
   - Type: VerifiEmail  
   - Parameter: Email = `{{$json.body.parent_email}}` (extract from webhook JSON)  
   - Credentials: Setup VerifiEmail API key (sign up at https://verifi.email)  

3. **Add IF node "IF Email Valid"**  
   - Condition: Boolean  
   - Expression: `{{$json.valid}} == true`  
   - Input: Connected from Verifi Email node  

4. **Add Respond to Webhook node "Error Response - Invalid Email"** on FALSE branch  
   - HTTP Status Code: 400  
   - Response Body (JSON):  
     ```json
     {
       "status": "error",
       "message": "Invalid email address provided. Please use a valid email.",
       "email_checked": "{{ $json.parent_email }}",
       "reason": "Email verification failed"
     }
     ```  
   - Connect from IF node FALSE output  

5. **Add Code node "Generate Consent ID"** on TRUE branch  
   - JavaScript code:  
     ```javascript
     const consentId = "CONSENT-" + Date.now();
     const timestamp = new Date().toISOString();
     const formattedDate = new Date().toLocaleDateString('en-IN', {
       day: '2-digit',
       month: 'long',
       year: 'numeric'
     });
     return [{
       json: {
         ...items[0].json,
         consent_id: consentId,
         generated_at: timestamp,
         generated_date: formattedDate
       }
     }];
     ```  

6. **Add HTMLCSSToPDF node "HTML to PDF1"**  
   - HTML content: Use provided HTML template with embedded expressions referencing webhook and code node data for dynamic fields  
   - Credentials: Setup HTMLCSSToPDF API key (sign up at https://pdfmunk.com)  
   - Connect from Generate Consent ID node  

7. **Add HTTP Request node "Download file"**  
   - Method: GET  
   - URL: `{{$json.pdf_url}}` (from HTML to PDF node output)  
   - Response Format: File (binary)  
   - Connect from HTML to PDF node  

8. **Add Google Drive node "Upload to Google Drive"**  
   - Operation: Upload File  
   - File Name: `={{ $('Webhook Trigger').item.json.body.child_name.replace(/ /g, '_') }}_{{ $('Generate Consent ID').item.json.consent_id }}.pdf`  
   - Folder ID: Set to your Drive folder ID for consents (e.g., "School_Consents/2025/November")  
   - Credentials: Google Drive OAuth2 with file upload scopes  
   - Input: Binary data from Download file node  

9. **Add Gmail node "Send Gmail to Teacher"**  
   - Operation: Send Email  
   - To: `={{ $json.teacher_email }}` (from webhook data)  
   - Subject: `New Consent Received: {{$json.child_name}} - {{$json.trip_name}}`  
   - Message: Use provided plaintext template with dynamic data fields referencing prior nodes  
   - Credentials: Gmail OAuth2 with send email scopes  
   - Connect from Upload to Google Drive node  

10. **Add Respond to Webhook node "Success Response"**  
    - HTTP Status Code: 200  
    - Response Body (JSON): Include `status: "success"`, consent ID, all input fields, email verification true, storage confirmation, and teacher notification true  
    - Connect from Send Gmail to Teacher node  

11. **Add Sticky Notes (optional)**  
    - Add documentation notes at each significant step for maintenance and clarity following the content provided in the original workflow.

12. **Configure Credentials**  
    - VerifiEmail API key (https://verifi.email)  
    - HTMLCSSToPDF API key (https://pdfmunk.com)  
    - Google Drive OAuth2 (ensure Drive API enabled and folder structure created)  
    - Gmail OAuth2 (with send mail permission)  

13. **Test the workflow**  
    - Use Postman or similar tool to POST JSON data matching the expected schema to the webhook endpoint  
    - Verify email verification, PDF generation, file upload, email notification, and webhook response  

---

### 5. General Notes & Resources

| Note Content                                                                                               | Context or Link                          |
|------------------------------------------------------------------------------------------------------------|-----------------------------------------|
| VerifiEmail API is critical for email verification to prevent fake or disposable email addresses.          | https://verifi.email                     |
| HTMLCSSToPDF API is used to generate print-ready PDFs from styled HTML content.                            | https://pdfmunk.com                      |
| Google Drive folder structure should be created as `/School_Consents/{Year}/{Month}/` for organized storage.| Google Drive setup                       |
| Gmail OAuth2 credentials must have permission to send emails on behalf of the user configured in n8n.      | Google Cloud Console OAuth2 setup        |
| The consent ID format `CONSENT-{timestamp}` ensures uniqueness and audit trail capability.                  | Workflow design rationale                |
| The workflow expects all input fields to be valid and present; additional input validation can be added if needed.| Possible enhancement                     |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated n8n workflow. It adheres strictly to current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.

---