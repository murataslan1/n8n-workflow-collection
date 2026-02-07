Automate Verified Visitor Management with Email Verification, Badges & Slack Alerts

https://n8nworkflows.xyz/workflows/automate-verified-visitor-management-with-email-verification--badges---slack-alerts-10443


# Automate Verified Visitor Management with Email Verification, Badges & Slack Alerts

---

## 1. Workflow Overview

This workflow, titled **"Verified Visitor Pass Generator"**, automates the visitor management process for coworking spaces by verifying visitor emails, generating verified visitor passes with QR codes, and notifying security teams via Slack, while also logging all visits in a Google Sheet. It ensures only validated visitors receive badges, thereby enhancing security and operational efficiency.

**Target Use Cases:**
- Coworking spaces or offices requiring visitor pre-registration and verification
- Automating visitor badge creation and distribution
- Real-time security team notifications for arrivals
- Maintaining an audit trail of visitor data with verification status

**Logical Blocks:**

- **1.1 Input Reception**: Receives visitor registration data via webhook.
- **1.2 Data Extraction & Normalization**: Extracts and formats visitor data from nested JSON inputs.
- **1.3 Email Verification**: Validates visitor email addresses to prevent fake or disposable entries.
- **1.4 Validation Decision**: Routes workflow based on email validity.
- **1.5 Visitor ID & QR Code Generation**: Creates unique visitor ID and QR codes with embedded visitor info.
- **1.6 Visitor Badge Creation**: Generates a professional visitor badge as an image from an HTML/CSS template.
- **1.7 Visitor Pass Emailing**: Sends a styled email to the visitor including the badge image and visit details.
- **1.8 Slack Notification**: Alerts the security team with visitor details and badge image via Slack.
- **1.9 Audit Logging**: Appends visitor data and verification results to a Google Sheet for record-keeping.
- **1.10 Invalid Email Handling**: Stops workflow and provides an error message for invalid emails.

---

## 2. Block-by-Block Analysis

### 1.1 Input Reception

- **Overview:**  
  This block receives incoming visitor registration data through an HTTP POST webhook endpoint.

- **Nodes Involved:**  
  - Webhook

- **Node Details:**  
  - **Webhook**  
    - Type: `n8n-nodes-base.webhook`  
    - Configuration: Listens for POST requests on path `/visitor-registration`.  
    - Input: External HTTP POST payload with visitor data (see expected JSON below).  
    - Output: Passes raw JSON to next node.  
    - Edge Cases: Invalid or malformed payloads may cause failures or missing data downstream.

  **Expected Input Format:**  
  ```json
  {
    "Full Name": {
      "first": "John",
      "last": "Doe"
    },
    "Email": "john@example.com",
    "Profile Photo": "https://...",
    "Visit Date ": {
      "month": "11",
      "day": "05",
      "year": "2025"
    },
    "Purpose of Visit": "Meeting",
    "Company/Organization": "ABC Corp"
  }
  ```

---

### 1.2 Data Extraction & Normalization

- **Overview:**  
  Extracts and normalizes visitor data from the nested JSON input. Combines first and last names, formats visit dates, and adds submission metadata.

- **Nodes Involved:**  
  - Set - Extract Form Data

- **Node Details:**  
  - **Set - Extract Form Data**  
    - Type: `n8n-nodes-base.set`  
    - Purpose: Parses nested JSON fields to simple variables; e.g., concatenates first and last names, formats visit date as ISO string and display string, extracts purpose and company, captures profile photo URL, adds a submission timestamp and unique submission ID based on current time.  
    - Expressions: Uses JavaScript expressions to combine and format data, e.g.  
      ```js
      visitorName = {{$json.body[0]['Full Name'].first + ' ' + $json.body[0]['Full Name'].last}}
      visitDate = {{$json.body[0]['Visit Date '].year}}-{{$json.body[0]['Visit Date '].month.padStart(2, '0')}}-{{$json.body[0]['Visit Date '].day.padStart(2, '0')}}
      submissionId = {{$now.format('yyyyMMddHHmmss')}}
      timestamp = {{$now.toISO()}}
      ```  
    - Inputs: Webhook JSON payload  
    - Outputs: Structured JSON with normalized fields for downstream consumption  
    - Edge Cases: Missing nested fields, unexpected data formats, or null values could cause expression errors.

---

### 1.3 Email Verification

- **Overview:**  
  Validates the visitor's email address using the VerifiEmail API to ensure legitimacy and reduce fake or disposable emails.

- **Nodes Involved:**  
  - Verifi Email

- **Node Details:**  
  - **Verifi Email**  
    - Type: `n8n-nodes-verifiemail.verifiEmail`  
    - Configuration: Uses the visitorEmail extracted previously as input for verification.  
    - Verifies:  
      - Email syntax correctness  
      - Domain existence and MX records  
      - Mailbox existence  
      - Detects disposable or spammy addresses  
    - Outputs: JSON with a boolean field `valid` indicating verification success.  
    - Inputs: visitorEmail from Set node  
    - Outputs: Verification results for conditional routing  
    - Edge Cases: API rate limits, network errors, or invalid email inputs can cause failures.

---

### 1.4 Validation Decision

- **Overview:**  
  Routes workflow based on whether the email verification passed or failed.

- **Nodes Involved:**  
  - IF - Check Email Valid  
  - Stop and Error (for invalid emails)

- **Node Details:**  
  - **IF - Check Email Valid**  
    - Type: `n8n-nodes-base.if`  
    - Condition: Checks if `$json.valid === true` from Verifi Email node.  
    - True branch: Proceeds to visitor ID and QR code generation.  
    - False branch: Leads to error node stopping the workflow.  
    - Edge Cases: Expression evaluation errors or missing `valid` field.  
  - **Stop and Error**  
    - Type: `n8n-nodes-base.stopAndError`  
    - Configuration: Stops execution with error message "Invalid Email".  
    - Purpose: Prevents continuation for invalid emails, saving resources and avoiding fake entries.

---

### 1.5 Visitor ID & QR Code Generation

- **Overview:**  
  Generates a unique visitor ID and two QR code formats containing visitor information for scanning.

- **Nodes Involved:**  
  - Function - Generate Visitor ID & QR

- **Node Details:**  
  - **Function - Generate Visitor ID & QR**  
    - Type: `n8n-nodes-base.code` (JavaScript code)  
    - Logic:  
      - Creates visitorId using current date (YYYYMMDD) and last 6 digits of timestamp, e.g., `VIS-20251103-234567`.  
      - Assembles full visitor info JSON string for QR code data.  
      - Creates a simplified QR code string for basic scanners.  
      - Generates two QR code image URLs using public APIs (`qrserver.com` and `quickchart.io`).  
      - Outputs visitorId, QR data strings, QR URLs, and timestamp.  
    - Inputs: normalized visitor data from Set node  
    - Outputs: visitorId and QR code info  
    - Edge Cases: API URL encoding errors, reliance on external QR generation services which may fail or be slow.

---

### 1.6 Visitor Badge Creation

- **Overview:**  
  Converts an HTML/CSS visitor badge template into an image, embedding visitor data and QR code.

- **Nodes Involved:**  
  - HTML/CSS to Image

- **Node Details:**  
  - **HTML/CSS to Image**  
    - Type: `n8n-nodes-htmlcsstoimage.htmlCssToImage`  
    - Configuration:  
      - Uses a detailed HTML template styled with CSS showing visitor photo, name, visitor ID, visit date, purpose, company, a verified badge, and QR code image.  
      - Includes fallback avatar generation if profile photo URL fails.  
      - Calls Htmlcsstoimg API with credentials.  
    - Inputs: visitor data from Set node, visitorId and QR code URL from Function node  
    - Outputs: Image URL of the visitor badge  
    - Edge Cases: API quota limits, image generation timeouts, HTML rendering issues, missing photo URLs.

---

### 1.7 Visitor Pass Emailing

- **Overview:**  
  Sends a formatted HTML email to the visitor containing the visitor pass badge image and visit details.

- **Nodes Involved:**  
  - Send a message1

- **Node Details:**  
  - **Send a message1 (Gmail node)**  
    - Type: `n8n-nodes-base.gmail`  
    - Configuration:  
      - Sends to visitorEmail extracted earlier.  
      - Subject includes visit date dynamically.  
      - Message body is a well-styled HTML email summarizing visit details, showing the badge image, usage instructions, location/contact info, and confirmation of verification.  
      - Uses Gmail OAuth2 credentials.  
    - Inputs: visitor badge image URL, visitor info and visit details  
    - Outputs: Email sent confirmation  
    - Edge Cases: Gmail API limits, OAuth token expiration, email delivery delays or failures.

---

### 1.8 Slack Notification

- **Overview:**  
  Notifies the security team in Slack with visitor registration details and the badge image for real-time awareness.

- **Nodes Involved:**  
  - Slack - Notify Security Team

- **Node Details:**  
  - **Slack - Notify Security Team**  
    - Type: `n8n-nodes-base.slack`  
    - Configuration:  
      - Sends message to a configured Slack channel with visitor name, email, visit date, purpose, company, visitor ID, status, submission timestamp, and badge image URL.  
      - Requires Slack API credentials and channel ID.  
    - Inputs: visitor data and badge image URL  
    - Outputs: Slack message confirmation  
    - Edge Cases: Slack API rate limits, authentication errors, channel misconfiguration.

---

### 1.9 Audit Logging

- **Overview:**  
  Logs all visitor registration details, verification status, and badge image URL into a Google Sheets document for audit and record-keeping.

- **Nodes Involved:**  
  - Google Sheets - Log Visitor

- **Node Details:**  
  - **Google Sheets - Log Visitor**  
    - Type: `n8n-nodes-base.googleSheets`  
    - Configuration:  
      - Appends a new row to a target Google Sheet with columns: Timestamp, Visitor ID, Full Name, Email, Visit Date, Purpose, Company, Email Verified status, Badge Image URL, and Status.  
      - Uses Google Sheets OAuth2 credentials.  
    - Inputs: comprehensive visitor data and badge image URL  
    - Outputs: Row append confirmation  
    - Edge Cases: Google Sheets API limits, OAuth2 token issues, spreadsheet access permissions.

---

### 1.10 Invalid Email Handling

- **Overview:**  
  Handles cases where email verification fails by stopping the workflow and providing an error message.

- **Nodes Involved:**  
  - Stop and Error

- **Node Details:**  
  - **Stop and Error**  
    - Type: `n8n-nodes-base.stopAndError`  
    - Configuration: Stops execution with message "Invalid Email".  
    - Purpose: Prevents fake or invalid visitor entries from consuming resources or triggering notifications.

---

## 3. Summary Table

| Node Name                     | Node Type                      | Functional Role                         | Input Node(s)              | Output Node(s)                             | Sticky Note                                                                                   |
|-------------------------------|--------------------------------|---------------------------------------|----------------------------|--------------------------------------------|-----------------------------------------------------------------------------------------------|
| Webhook                       | webhook                       | Receives visitor registration data   | —                          | Set - Extract Form Data                     | ## 📥 STEP 1: WEBHOOK TRIGGER<br>Expected Input JSON format for visitor registration           |
| Set - Extract Form Data       | set                          | Extracts and normalizes form data     | Webhook                    | Verifi Email                               | ## 🔄 STEP 2: EXTRACT & ORGANIZE DATA<br>Extracts visitor info, formats date, adds timestamp   |
| Verifi Email                 | verifiEmail                  | Validates visitor email               | Set - Extract Form Data     | IF - Check Email Valid                      | ## ✅ STEP 3: EMAIL VERIFICATION<br>Checks email syntax, domain, mailbox, disposables          |
| IF - Check Email Valid       | if                           | Routes based on email verification    | Verifi Email               | Function - Generate Visitor ID & QR, Stop and Error | ## 🔀 STEP 4: VALIDATION DECISION POINT<br>Splits to valid or invalid email paths              |
| Stop and Error               | stopAndError                 | Stops workflow on invalid email      | IF - Check Email Valid (False) | —                                          | ## ❌ STEP 4B: INVALID EMAIL HANDLING<br>Stops workflow with "Invalid Email" error            |
| Function - Generate Visitor ID & QR | code                          | Generates visitor ID and QR codes    | IF - Check Email Valid (True) | HTML/CSS to Image                           | ## 🆔 STEP 5: GENERATE VISITOR ID & QR CODE<br>Creates unique ID and QR code data              |
| HTML/CSS to Image            | htmlCssToImage               | Creates visitor badge image from HTML| Function - Generate Visitor ID & QR | Send a message1, Slack - Notify Security Team, Google Sheets - Log Visitor | ## 🎨 STEP 6: CREATE VISITOR BADGE IMAGE<br>Generates styled visitor badge image               |
| Send a message1              | gmail                        | Sends visitor pass email             | HTML/CSS to Image          | —                                          | ## 📧 STEP 7: EMAIL VISITOR PASS<br>Sends styled email with badge and visit details            |
| Slack - Notify Security Team | slack                        | Sends Slack alert to security team   | HTML/CSS to Image          | —                                          | ## 💬 STEP 8: SLACK SECURITY ALERT<br>Real-time visitor notification for security              |
| Google Sheets - Log Visitor  | googleSheets                 | Logs visitor data in Google Sheets   | HTML/CSS to Image          | —                                          | ## 📊 STEP 9: LOG TO GOOGLE SHEETS<br>Appends visitor info including badge and verification    |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `visitor-registration`  
   - Purpose: Receive visitor registration JSON payload.

2. **Add Set Node "Set - Extract Form Data":**  
   - Type: Set  
   - Extract and assign these variables using expressions referencing `{{$json.body[0]}}`:  
     - `visitorName` = concatenate first and last names  
     - `firstName` and `lastName` separately  
     - `visitorEmail`  
     - `visitDate` formatted as `YYYY-MM-DD` (pad month/day to 2 digits)  
     - `visitDateFormatted` as `MM/DD/YYYY` for display  
     - `purpose` (from "Purpose of Visit")  
     - `company` (from "Company/Organization")  
     - `photoUrl` (profile photo URL)  
     - `submissionId` as current timestamp string `yyyyMMddHHmmss`  
     - `timestamp` as ISO string for submission time  
   - Connect Webhook → Set node.

3. **Add Verifi Email Node:**  
   - Type: VerifiEmail  
   - Parameter: `email` = `{{$json.visitorEmail}}`  
   - Credentials: Configure VerifiEmail API credentials.  
   - Connect Set node → Verifi Email node.

4. **Add IF Node "IF - Check Email Valid":**  
   - Type: IF  
   - Condition: Check if `{{$json.valid}}` equals boolean `true`.  
   - Connect Verifi Email → IF node.

5. **Add Stop and Error Node (Invalid Email Handling):**  
   - Type: StopAndError  
   - Error Message: "Invalid Email"  
   - Connect IF node's False output to this node.

6. **Add Function Node "Function - Generate Visitor ID & QR":**  
   - Type: Code (JavaScript)  
   - Logic:  
     - Generate `visitorId` using current date and timestamp suffix.  
     - Create QR code JSON data with visitor info.  
     - Create simple text format for QR code.  
     - Generate two QR code URLs using public APIs.  
     - Output JSON with all above fields.  
   - Connect IF node's True output to this node.

7. **Add HTML/CSS to Image Node:**  
   - Type: htmlCssToImage  
   - Configure with HTML template embedding visitor info, visitor photo, QR code URL, and styling for a professional visitor badge.  
   - Use expressions to pull data from Set and Function nodes.  
   - Configure Htmlcsstoimg API credentials.  
   - Connect Function node → HTML/CSS to Image node.

8. **Add Gmail Node "Send a message1":**  
   - Type: Gmail  
   - Send To: `{{$json.visitorEmail}}` from Set node  
   - Subject: "🎫 Your Verified Visitor Pass - {{ visitDateFormatted }}"  
   - Message: Styled HTML email with visit details and embedded badge image URL from HTML/CSS to Image node.  
   - Use Gmail OAuth2 credentials.  
   - Connect HTML/CSS to Image node → Gmail node.

9. **Add Slack Node "Slack - Notify Security Team":**  
   - Type: Slack  
   - Message: Compose with visitor name, email, visit date, purpose, company, visitor ID, status, timestamp, and badge image URL.  
   - Select Slack channel ID.  
   - Use Slack API credentials.  
   - Connect HTML/CSS to Image node → Slack node.

10. **Add Google Sheets Node "Google Sheets - Log Visitor":**  
    - Type: Google Sheets  
    - Operation: Append row  
    - Target Sheet: Visitor Log with columns  
      Timestamp, Visitor ID, Full Name, Email, Visit Date, Purpose, Company, Email Verified, Badge Image URL, Status  
    - Map columns using expressions from Set node and Function node outputs.  
    - Use Google Sheets OAuth2 credentials.  
    - Connect HTML/CSS to Image node → Google Sheets node.

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                         | Context or Link                   |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------|
| **Workflow Purpose:** Automated visitor pass system with email verification, QR code badges, Slack alerts, and audit logging.                                                                                                     | Workflow Overview Sticky Note    |
| **VerifiEmail API:** Email verification service used to validate visitor emails and block fake/disposable addresses.                                                                                                             | https://verifi.email             |
| **Htmlcsstoimg API:** Converts HTML/CSS badge template into an image for embedding in emails and Slack.                                                                                                                          | https://htmlcsstoimg.com         |
| **Gmail OAuth2:** Used to send emails securely with visitor pass information.                                                                                                                                                     | Gmail OAuth2 credential setup    |
| **Slack API:** Provides real-time notifications to security teams. Setup requires Slack app and channel configuration.                                                                                                           | https://api.slack.com/apps       |
| **Google Sheets OAuth2:** Used to append visitor data to a spreadsheet as an audit trail. Spreadsheet must have predefined headers matching the workflow columns.                                                                | Google Sheets credential setup  |
| **Visitor Badge Design:** The badge includes visitor photo with fallback avatar, visitor name, unique ID, visit date, purpose, company, QR code, and a verified entry badge, styled with modern gradients and shadows.               | HTML template in HTML/CSS to Image node |
| **Security Assurance:** Invalid or unverified emails stop the workflow immediately, preventing resource waste and fake entries.                                                                                                   | Stop and Error node              |
| **Processing Time:** Approximately 30 seconds per visitor, with 99%+ success rate for valid emails.                                                                                                                               | Overview sticky note             |

---

# Disclaimer

The provided text is solely derived from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.

---