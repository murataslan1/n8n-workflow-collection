Automate Construction Site Attendance Tracking with Geofencing, Google Sheets & Email Alerts

https://n8nworkflows.xyz/workflows/automate-construction-site-attendance-tracking-with-geofencing--google-sheets---email-alerts-6774


# Automate Construction Site Attendance Tracking with Geofencing, Google Sheets & Email Alerts

### 1. Workflow Overview

This workflow automates the tracking of construction worker attendance through geofencing technology, integrating GPS check-ins with Google Sheets and email notifications. It is designed to receive check-in/out requests with GPS coordinates, validate whether the worker is within a predefined geofenced construction site area, log the attendance data in a Google Sheet, and send email alerts confirming updates or flagging location issues.

The workflow’s logic is grouped into these main blocks:

- **1.1 Input Reception:** Receives HTTP POST requests containing worker check-in/out data, including GPS coordinates and worker details.
- **1.2 Geofence Validation & Log Formatting:** Validates if the GPS location falls within the geofence boundary and formats the attendance record.
- **1.3 Attendance Logging:** Appends the validated attendance record to a Google Sheets document.
- **1.4 Notification:** Sends an email notification summarizing the attendance update.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
This block listens for incoming POST requests triggered by workers’ mobile devices or forms submitting check-in or check-out data with GPS location and worker information.

- **Nodes Involved:**  
  - Webhook  
  - Sticky Note (comment)

- **Node Details:**

  - **Webhook**  
    - Type: HTTP Webhook Trigger  
    - Role: Entry point capturing attendance data submitted externally.  
    - Configuration:  
      - HTTP Method: POST  
      - Path: `geofence-thaltej-attendance` (unique webhook endpoint)  
    - Inputs: HTTP POST request payload (expected to include GPS coordinates and worker info)  
    - Outputs: Passes data to "Validate Geofence & Format Log" node  
    - Edge cases/failures:  
      - Missing or malformed input data  
      - Unauthorized or unexpected requests (no authentication configured)  
    - Sticky Note content:  
      "Receives check-in/check-out requests from mobile input (e.g., Google Form or WhatsApp). Carries GPS coordinates and worker info."

  - **Sticky Note**  
    - Type: Annotation  
    - Content: Describes the webhook’s functional role as input reception.

#### 2.2 Geofence Validation & Log Formatting

- **Overview:**  
This block validates the worker’s GPS coordinates against the geofenced construction site boundary to ensure legitimacy. It also formats the attendance log with details such as punch type (in/out), timestamp, and date.

- **Nodes Involved:**  
  - Validate Geofence & Format Log (Function Node)  
  - Sticky Note1 (comment)

- **Node Details:**

  - **Validate Geofence & Format Log**  
    - Type: Function Node (JavaScript code execution)  
    - Role:  
      - Checks if latitude and longitude are within the allowed geofence area (likely via coordinates comparison or Google Maps API call inside the function code).  
      - Formats the attendance record to include key data fields for Google Sheets append.  
    - Configuration: Custom JavaScript (not shown in JSON)  
    - Inputs: Payload from Webhook node containing worker GPS and info  
    - Outputs: Formatted data object for appending if validation passes  
    - Edge cases/failures:  
      - GPS data missing or invalid format  
      - Worker outside geofence (should be handled to prevent logging or trigger alerts)  
      - Execution errors in code (syntax or logic faults)  
    - Sticky Note1 content:  
      "Validates if the worker’s location is within the geofenced construction site area using Google Maps API. Also formats the log with punch type, time, and date."

  - **Sticky Note1**  
    - Type: Annotation  
    - Content describes geofence validation and log formatting roles.

#### 2.3 Attendance Logging

- **Overview:**  
Appends the validated attendance record as a new row in the specified Google Sheet to maintain a persistent attendance log accessible for reporting and review.

- **Nodes Involved:**  
  - Append data to a sheet (Google Sheets Node)  
  - Sticky Note2 (comment)

- **Node Details:**

  - **Append data to a sheet**  
    - Type: Google Sheets node  
    - Role: Appends new attendance records to the sheet "Attendance" in columns A to D.  
    - Configuration:  
      - Operation: Append  
      - Range: `Attendance!A:D`  
      - Sheet ID: `your_google_sheet_id` (placeholder, must be replaced)  
    - Credentials: Google API OAuth2 credentials configured (named "Google Sheets- test")  
    - Inputs: Formatted attendance data from previous node  
    - Outputs: Triggers the next node "Send email" after successful append  
    - Edge cases/failures:  
      - API auth errors or expired credentials  
      - Sheet ID incorrect or sheet access revoked  
      - Data format mismatch causing append failure  
    - Sticky Note2 content:  
      "Appends the validated punch-in/out record to a Google Sheet for attendance tracking and reporting."

  - **Sticky Note2**  
    - Annotation explaining the node’s purpose for attendance data recording.

#### 2.4 Notification

- **Overview:**  
Sends an email notification summarizing the attendance sheet update, prompting recipients to review the latest punch-in/out data.

- **Nodes Involved:**  
  - Send email (Email Send Node)  
  - Sticky Note3 (comment)

- **Node Details:**

  - **Send email**  
    - Type: Email Send Node  
    - Role: Sends notification email upon successful attendance record update.  
    - Configuration:  
      - Subject: "📋 Daily Attendance Updated – Please Review"  
      - Body (text format): Includes current date, location info, and reminder to review the sheet. Contains placeholder link to Google Sheet for recipients to access.  
      - To: `abcd@gmail.com` (example placeholder)  
      - From: `abc@gmail.com` (example placeholder)  
    - Credentials: SMTP credentials named "SMTP -test"  
    - Inputs: Triggered after successful Google Sheets append  
    - Outputs: None (end of workflow)  
    - Edge cases/failures:  
      - SMTP authentication failure  
      - Invalid email addresses or network issues  
    - Sticky Note3 content:  
      "Sends a notification email with attendance details or alerts if the location is invalid."

  - **Sticky Note3**  
    - Annotation clarifying the email notification role.

---

### 3. Summary Table

| Node Name                  | Node Type          | Functional Role                                     | Input Node(s)                | Output Node(s)               | Sticky Note                                                                                     |
|----------------------------|--------------------|----------------------------------------------------|------------------------------|------------------------------|------------------------------------------------------------------------------------------------|
| Webhook                    | HTTP Webhook       | Receives worker check-in/out requests with GPS     | —                            | Validate Geofence & Format Log | Receives check-in/check-out requests from mobile input (e.g., Google Form or WhatsApp). Carries GPS coordinates and worker info. |
| Validate Geofence & Format Log | Function           | Validates geofence and formats attendance log      | Webhook                      | Append data to a sheet       | Validates if the worker’s location is within the geofenced construction site area using Google Maps API. Also formats the log with punch type, time, and date. |
| Append data to a sheet     | Google Sheets      | Appends attendance record to Google Sheet           | Validate Geofence & Format Log | Send email                   | Appends the validated punch-in/out record to a Google Sheet for attendance tracking and reporting.      |
| Send email                 | Email Send         | Sends notification email confirming attendance update | Append data to a sheet       | —                            | Sends a notification email with attendance details or alerts if the location is invalid.            |
| Sticky Note                | Sticky Note        | Annotation for Webhook node                          | —                            | —                            | Receives check-in/check-out requests from mobile input (e.g., Google Form or WhatsApp). Carries GPS coordinates and worker info. |
| Sticky Note1               | Sticky Note        | Annotation for Geofence validation node             | —                            | —                            | Validates if the worker’s location is within the geofenced construction site area using Google Maps API. Also formats the log with punch type, time, and date. |
| Sticky Note2               | Sticky Note        | Annotation for Google Sheets append node             | —                            | —                            | Appends the validated punch-in/out record to a Google Sheet for attendance tracking and reporting.      |
| Sticky Note3               | Sticky Note        | Annotation for email notification node               | —                            | —                            | Sends a notification email with attendance details or alerts if the location is invalid.            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: HTTP Webhook  
   - HTTP Method: POST  
   - Path: `geofence-thaltej-attendance`  
   - Purpose: Receive attendance check-in/out data from mobile apps or forms.

2. **Add Function Node: Validate Geofence & Format Log**  
   - Type: Function  
   - Purpose:  
     - Validate GPS coordinates to confirm if within geofence (use Google Maps API or coordinate logic).  
     - Format attendance data with punch-in/out type, timestamp, and date.  
   - Connect Webhook’s output to this node’s input.

3. **Add Google Sheets Node: Append data to a sheet**  
   - Type: Google Sheets  
   - Operation: Append  
   - Sheet ID: Replace `your_google_sheet_id` with actual Google Sheet ID  
   - Range: `Attendance!A:D`  
   - Credentials: Configure Google API credentials with necessary scopes (read/write for Sheets).  
   - Connect Function node output to this node input.

4. **Add Email Send Node: Send email**  
   - Type: Email Send  
   - Subject: "📋 Daily Attendance Updated – Please Review"  
   - Body:  
     ```
     Hello,

     The attendance sheet has been successfully updated for today.

     Please review the latest punch-in and punch-out entries to ensure everything is in order.

     🗓️ Date: {{new Date().toLocaleDateString()}}  
     📍 Location: Construction Site (Geofenced)

     You can access the updated sheet here: [Insert Sheet Link]

     Regards,  
     n8n Automation System
     ```  
   - To Email: `abcd@gmail.com` (replace with actual recipient)  
   - From Email: `abc@gmail.com` (replace with authorized sender)  
   - Credentials: Configure SMTP credentials for sending email.  
   - Connect Google Sheets node output to this node input.

5. **Add Sticky Notes (Optional but recommended for clarity):**  
   - Add four sticky notes near respective nodes with descriptions as per the workflow to document functionality and provide contextual guidance.

6. **Activate Workflow**  
   - Ensure all credentials are valid and tested.  
   - Save and activate the workflow to start receiving and processing attendance check-ins.

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                                                                  |
|---------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Replace placeholder Google Sheet ID and email addresses with real values before deploying.              | Critical for successful data logging and notifications.                                         |
| Ensure Google API credentials have Sheets API enabled and OAuth2 consent configured.                     | Google Sheets Node requirement.                                                                |
| SMTP credentials must allow sending from the specified "from" email address.                            | Email Send Node requirement.                                                                    |
| Geofence validation logic must be implemented securely within the Function node to prevent spoofing.    | Custom JavaScript code or external API calls can be used; test thoroughly.                      |
| The webhook endpoint URL must be shared securely with mobile app or form sending attendance data.       | Prevent unauthorized data submission.                                                          |
| Consider adding authentication or validation on the webhook to improve security (not currently included).| Recommended for production deployments.                                                        |

---

**Disclaimer:**  
The text provided is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.