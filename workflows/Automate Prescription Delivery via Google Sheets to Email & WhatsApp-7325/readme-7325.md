Automate Prescription Delivery via Google Sheets to Email & WhatsApp

https://n8nworkflows.xyz/workflows/automate-prescription-delivery-via-google-sheets-to-email---whatsapp-7325


# Automate Prescription Delivery via Google Sheets to Email & WhatsApp

### 1. Workflow Overview

This workflow automates the process of sending medical prescriptions from a Google Sheet to patients via email and WhatsApp. It is designed for healthcare providers or clinics who maintain prescriptions in Google Sheets and want to efficiently notify patients with formatted prescription details.

**Target Use Cases:**  
- Automated delivery of prescription details to patients.  
- Multi-channel communication (Email + WhatsApp).  
- Tracking and logging notification status for compliance and auditing.  
- Updating prescription status after notifications are sent.

**Logical Blocks:**  
- **1.1 Input Reception:** Trigger on new or updated prescription entries in Google Sheets.  
- **1.2 Filtering:** Select only prescriptions that are new and have contact details.  
- **1.3 Data Formatting:** Prepare prescription text and HTML email content.  
- **1.4 Notification Sending:** Dispatch prescription via email and WhatsApp.  
- **1.5 Logging:** Record notification success or failure in Google Sheets log.  
- **1.6 Status Update:** Mark prescription as sent in the source Google Sheet.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception  
**Overview:**  
Monitors a specific Google Sheet for new or updated prescription entries. Triggers the workflow every minute to check for changes.

**Nodes Involved:**  
- Google Sheets Trigger

**Node Details:**  
- **Google Sheets Trigger**  
  - Type: Trigger node for Google Sheets updates  
  - Configuration: Polls every minute, watching a specified sheet and document by ID  
  - Inputs: None (trigger node)  
  - Outputs: Emits new or updated prescription rows as JSON  
  - Credentials: OAuth2 Google Sheets API credentials required  
  - Edge Cases: Potential delays due to polling interval; API quota limits; OAuth token expiry

---

#### 1.2 Filtering  
**Overview:**  
Filters incoming prescription entries to pass only those marked as "new" and having both patient email and phone number populated.

**Nodes Involved:**  
- Filter New Prescriptions

**Node Details:**  
- **Filter New Prescriptions**  
  - Type: Filter node  
  - Configuration:  
    - Conditions combined with AND:  
      - `prescription_status` equals "new"  
      - `patient_email` is not empty  
      - `patient_phone` is not empty  
  - Inputs: Outputs from Google Sheets Trigger  
  - Outputs: Passes filtered data downstream  
  - Edge Cases: Fails if any field is missing or has invalid data type; strict case sensitive match on "new" status  

---

#### 1.3 Data Formatting  
**Overview:**  
Formats prescription data into a textual message for WhatsApp and a rich HTML email. Also constructs a WhatsApp-compatible plain text message.

**Nodes Involved:**  
- Format Prescription Data

**Node Details:**  
- **Format Prescription Data**  
  - Type: Code (JavaScript) node  
  - Configuration:  
    - Generates:  
      - `prescriptionText`: a multi-line string with emojis and formatted text  
      - `emailHTML`: styled HTML content for email body  
      - `whatsappMessage`: same as `prescriptionText` but emojis removed for compatibility  
      - `timestamp`: current ISO timestamp  
  - Inputs: Filtered prescription JSON data  
  - Outputs: JSON with original data plus formatted fields  
  - Key Expressions: Uses template literals with patient and doctor info, prescription details, and conditional follow-up date section  
  - Edge Cases: Missing fields handled by default "Not specified" text for follow-up date; potential formatting errors if data contains unexpected types or characters  

---

#### 1.4 Notification Sending  
**Overview:**  
Sends the formatted prescription details both via email and WhatsApp to the patient.

**Nodes Involved:**  
- Send email  
- Send WhatsApp

**Node Details:**  
- **Send email**  
  - Type: Email Send node  
  - Configuration:  
    - Recipient email dynamically set to patient’s email  
    - Subject includes doctor or hospital name placeholder  
    - Email body uses a simple text template referencing patient and doctor names, with attachment note (attachment handling not shown in JSON)  
    - From address set as noreply@yourhospital.com  
    - SMTP credentials required  
  - Inputs: Formatted prescription data  
  - Outputs: Passes success/failure status downstream  
  - Edge Cases: SMTP authentication failure, invalid email addresses, email sending delay or failure  

- **Send WhatsApp**  
  - Type: WhatsApp node  
  - Configuration:  
    - Sends a text message (template includes placeholders for patient name, doctor name, date, contact info)  
    - Recipient phone number dynamically set  
    - Uses WhatsApp API credentials (token-based)  
  - Inputs: Formatted prescription data  
  - Outputs: Passes success/failure status downstream  
  - Edge Cases: API authentication failure, phone number format issues, message content length limits, WhatsApp service outages  

---

#### 1.5 Logging  
**Overview:**  
Logs each notification attempt with timestamp, patient info, and success or failure status for email and WhatsApp into a Google Sheet named "Notification_Log".

**Nodes Involved:**  
- Log Notification

**Node Details:**  
- **Log Notification**  
  - Type: Google Sheets node (append or update)  
  - Configuration:  
    - Appends or updates rows in "Notification_Log" sheet by matching patient name  
    - Columns include timestamp, doctor name, patient email/phone, prescription ID, email and WhatsApp status, notification type  
    - Email and WhatsApp status dynamically determined by success flags from respective nodes  
    - Uses service account credentials  
  - Inputs: Outputs from "Send email" and "Send WhatsApp" nodes  
  - Outputs: Passes data downstream for status update  
  - Edge Cases: Google API quota limits, sheet permission errors, matching on patient name may cause collisions if names are not unique  

---

#### 1.6 Status Update  
**Overview:**  
Updates the original prescription status in the Google Sheet to "sent" to avoid duplicate notifications.

**Nodes Involved:**  
- Update Prescription Status

**Node Details:**  
- **Update Prescription Status**  
  - Type: Google Sheets node (update operation)  
  - Configuration:  
    - Updates "Prescriptions" sheet by matching `prescription_id`  
    - Sets `prescription_status` to "sent"  
    - Uses service account credentials  
  - Inputs: Output from Log Notification node  
  - Outputs: None (end of workflow)  
  - Edge Cases: Update failure due to permission or concurrency issues, missing prescription_id causing no update  

---

### 3. Summary Table

| Node Name                 | Node Type           | Functional Role                  | Input Node(s)           | Output Node(s)            | Sticky Note                                                                                               |
|---------------------------|---------------------|---------------------------------|-------------------------|---------------------------|-----------------------------------------------------------------------------------------------------------|
| Google Sheets Trigger      | Google Sheets Trigger| Input Reception - triggers flow | None                    | Filter New Prescriptions   | ## 🌟 Features Included<br>- **Automated Trigger**: Monitors Google Sheet for new prescriptions<br>- **Smart Filtering**: Only processes prescriptions with status "new"<br>- **Rich Email Format**: Professional HTML email with prescription details<br>- **WhatsApp Integration**: Sends formatted prescription text<br>- **Comprehensive Logging**: Tracks all sent notifications<br>- **Status Updates**: Marks prescriptions as "sent" after processing<br>- **Error Handling**: Logs success/failure status for both channels |
| Filter New Prescriptions   | Filter              | Filtering new valid prescriptions| Google Sheets Trigger    | Format Prescription Data   | See above sticky note                                                                                      |
| Format Prescription Data   | Code                | Formatting prescription content  | Filter New Prescriptions | Send email, Send WhatsApp  | See above sticky note                                                                                      |
| Send email                | Email Send           | Send prescription via email      | Format Prescription Data | Log Notification           | See above sticky note                                                                                      |
| Send WhatsApp             | WhatsApp             | Send prescription via WhatsApp   | Format Prescription Data | Log Notification           | See above sticky note                                                                                      |
| Log Notification          | Google Sheets        | Log notification status          | Send email, Send WhatsApp| Update Prescription Status | See above sticky note                                                                                      |
| Update Prescription Status| Google Sheets        | Update prescription status       | Log Notification         | None                      | See above sticky note                                                                                      |
| Sticky Note               | Sticky Note          | Informational note               | None                    | None                      | ## 🌟 Features Included<br>- **Automated Trigger**: Monitors Google Sheet for new prescriptions<br>- **Smart Filtering**: Only processes prescriptions with status "new"<br>- **Rich Email Format**: Professional HTML email with prescription details<br>- **WhatsApp Integration**: Sends formatted prescription text<br>- **Comprehensive Logging**: Tracks all sent notifications<br>- **Status Updates**: Marks prescriptions as "sent" after processing<br>- **Error Handling**: Logs success/failure status for both channels |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger node:**  
   - Type: Google Sheets Trigger  
   - Configure OAuth2 credentials for Google Sheets API access.  
   - Set to poll every minute.  
   - Specify the Spreadsheet ID and Sheet name where prescriptions are stored.

2. **Add Filter node "Filter New Prescriptions":**  
   - Connect input from Google Sheets Trigger.  
   - Set conditions:  
     - `prescription_status` equals "new" (case sensitive)  
     - `patient_email` is not empty  
     - `patient_phone` is not empty

3. **Add Code node "Format Prescription Data":**  
   - Connect input from Filter node.  
   - Paste the provided JavaScript code to:  
     - Format prescription text with emojis and details  
     - Create HTML email content with inline styles  
     - Generate WhatsApp plain text message (emojis removed)  
     - Add timestamp field  
   - No credentials needed.

4. **Add Email Send node "Send email":**  
   - Connect input from Code node.  
   - Configure SMTP credentials (your mail server).  
   - Set "To Email" field to `{{$json.patient_email}}`.  
   - Set "From Email" as a no-reply address.  
   - Set subject and body with placeholders for patient and doctor names.  
   - Disable attribution and unauthorized certs.

5. **Add WhatsApp node "Send WhatsApp":**  
   - Connect input from Code node (parallel to Email node).  
   - Configure WhatsApp API credentials with phone number ID.  
   - Set recipient phone number dynamically (`{{$json.patient_phone}}`).  
   - Compose message using placeholders (patient name, doctor name, date).  
   - Operation: send text message.

6. **Add Google Sheets node "Log Notification":**  
   - Connect inputs from both "Send email" and "Send WhatsApp" nodes (merge outputs).  
   - Configure Google Sheets service account credentials.  
   - Set to append or update rows in "Notification_Log" sheet.  
   - Map columns: timestamp, doctor_name, patient_name, patient_email, patient_phone, prescription_id, email_status (based on email success), whatsapp_status (based on WhatsApp success), notification_type (set to "prescription_sent").  
   - Use patient_name as matching column for updates.

7. **Add Google Sheets node "Update Prescription Status":**  
   - Connect input from Log Notification node.  
   - Configure service account credentials.  
   - Set to update in "Prescriptions" sheet.  
   - Match rows by `prescription_id`.  
   - Update `prescription_status` field to "sent".

8. **Add Sticky Note for documentation:**  
   - Add a sticky note node anywhere visible describing features and workflow summary.

9. **Connect all nodes according to the flow:**  
   - Google Sheets Trigger → Filter New Prescriptions → Format Prescription Data → (Send email & Send WhatsApp in parallel) → Log Notification → Update Prescription Status.

10. **Test the workflow:**  
    - Use sample prescription data with `prescription_status` as "new", valid emails and phone numbers.  
    - Confirm email and WhatsApp are sent.  
    - Verify logs and status update in Google Sheets.

---

### 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                 |
|---------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------|
| This workflow requires valid Google Sheets OAuth2 and Service Account credentials for reading/writing sheets.                    | Google Sheets API setup                         |
| WhatsApp API credentials must be configured with correct phone number ID and token.                                               | WhatsApp Business API documentation             |
| SMTP credentials are required for sending emails; ensure the SMTP server allows sending from the configured email address.        | SMTP provider documentation                     |
| Patient name is used as a matching key in logging, which may cause collisions if names are not unique; consider adding unique IDs. | Data integrity recommendation                   |
| The workflow removes emojis for WhatsApp messages to ensure compatibility and avoid delivery issues.                             | WhatsApp messaging best practices               |
| Poll interval is set to one minute; adjust based on expected prescription update frequency and API quota limits.                  | Performance tuning                               |
| The email currently uses a text template; for sending attachments (PDFs/images), additional nodes or steps would be needed.       | Email attachment handling                        |

---

**Disclaimer:** The text provided is extracted exclusively from an n8n automation workflow. It complies strictly with content policies and contains no illegal or protected data. All manipulated data is legal and public.