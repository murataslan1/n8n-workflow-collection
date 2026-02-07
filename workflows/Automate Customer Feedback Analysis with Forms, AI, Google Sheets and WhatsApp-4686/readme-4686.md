Automate Customer Feedback Analysis with Forms, AI, Google Sheets and WhatsApp

https://n8nworkflows.xyz/workflows/automate-customer-feedback-analysis-with-forms--ai--google-sheets-and-whatsapp-4686


# Automate Customer Feedback Analysis with Forms, AI, Google Sheets and WhatsApp

### 1. Workflow Overview

This workflow automates the collection, analysis, and follow-up of customer feedback related to IT services. It targets organizations seeking to streamline feedback intake via forms, record responses in Google Sheets, and engage with customers through email or WhatsApp based on their provided contact information.

The workflow is logically grouped into these blocks:

- **1.1 Feedback Collection:** Captures customer feedback submitted via a form with multiple fields including ratings, comments, and contact details.
- **1.2 Data Recording:** Appends or updates the collected feedback into a Google Sheets document for record-keeping and analysis.
- **1.3 Conditional Communication:** Checks the availability of email and phone number from the submission to decide the communication channel.
- **1.4 Email Notification:** Sends a feedback request or acknowledgment email if an email address is provided.
- **1.5 WhatsApp Notification:** Sends a WhatsApp message using a business template if only a phone number is provided.
- **1.6 Trigger for Google Sheets Changes:** Listens for changes in Google Sheets to potentially trigger further processing (though no downstream nodes are shown here).
- **1.7 Integration Guidance:** Provides extensive notes on setting up Google Sheets OAuth2 credentials and usage instructions.

---

### 2. Block-by-Block Analysis

#### 2.1 Feedback Collection

- **Overview:** Captures customer feedback through a web form triggered node exposing an HTTP webhook.
- **Nodes Involved:** 
  - On form submission
- **Node Details:**
  - **Node Name:** On form submission
  - **Type:** `formTrigger`
  - **Technical Role:** Captures form submissions via webhook.
  - **Configuration:**
    - Webhook path set to `/feedback`.
    - Form titled “Customer Feedback Questions for IT Services”.
    - Multiple fields including text, email, phone, dropdowns for satisfaction, communication, timeliness, ratings, and text areas for comments.
    - All fields marked as required.
  - **Expressions:** Uses standard form input field mapping.
  - **Input/Output:** No input (trigger node); outputs JSON of form responses.
  - **Version:** 2.2
  - **Edge Cases:** 
    - If the form is submitted with missing required fields, the form itself blocks submission.
    - Potential errors if webhook path conflicts or network issues.
  - **Sub-workflow:** None.

#### 2.2 Data Recording

- **Overview:** Appends or updates the received feedback into a Google Sheets document.
- **Nodes Involved:**
  - Google Sheets1
- **Node Details:**
  - **Node Name:** Google Sheets1
  - **Type:** `googleSheets`
  - **Technical Role:** Inserts or updates form data into Google Sheets.
  - **Configuration:**
    - Operation set to “appendOrUpdate”.
    - Requires Google Sheets OAuth2 credentials.
    - Document ID and Sheet name selected dynamically or from list.
    - Manual mapping of form fields to sheet columns is expected in the UI.
  - **Expressions:** Uses incoming form data JSON to map fields.
  - **Input/Output:** Input from “On form submission”; outputs updated row data.
  - **Version:** 4.5
  - **Edge Cases:**
    - Google API quota limits or OAuth token expiry.
    - Sheet or document not found errors.
    - Mapping errors if columns mismatch.
  - **Sub-workflow:** None.

#### 2.3 Conditional Communication

- **Overview:** Determines whether to send follow-up communication by email or WhatsApp based on the presence of contact information.
- **Nodes Involved:**
  - If E-mail and Phone Number Both are given
  - If only Phone Number is given
- **Node Details:**

  - **Node Name:** If E-mail and Phone Number Both are given
    - **Type:** `if`
    - **Role:** Checks if both email and phone number are non-empty.
    - **Configuration:** 
      - Condition: `$json.Phone.toString()` is not empty AND `$json.Email` is not empty.
    - **Input/Output:** Input from Google Sheets Trigger node; outputs to Email node if true.
    - **Edge Cases:** 
      - If either field is missing or empty, condition false.
      - Expression evaluation errors if fields are missing in JSON.

  - **Node Name:** If only Phone Number is given
    - **Type:** `if`
    - **Role:** Checks if only phone number is non-empty.
    - **Configuration:** 
      - Condition: `$json.Phone.toString()` is not empty.
      - No condition on email (implicitly false or empty).
    - **Input/Output:** Input from Google Sheets Trigger node; outputs to WhatsApp node if true.
    - **Edge Cases:** 
      - Phone number format correctness is not validated here.
      - May trigger wrongly if email field is empty but present.

#### 2.4 Email Notification

- **Overview:** Sends an email to the customer requesting or thanking for feedback.
- **Nodes Involved:**
  - Email
- **Node Details:**
  - **Node Name:** Email
  - **Type:** `emailSend`
  - **Role:** Sends text email to the address provided in the form.
  - **Configuration:**
    - Subject: “Feedback”.
    - From email: fixed as XYZ@gmail.com.
    - To email: dynamic via expression `={{ $json.Email }}`.
    - Body text: asks for valuable feedback and includes a placeholder for the form URL.
    - SMTP credentials configured separately.
  - **Expressions:** Uses `$json.Email` for recipient.
  - **Input/Output:** Input from “If E-mail and Phone Number Both are given” node.
  - **Edge Cases:**
    - Email sending failures due to SMTP misconfiguration or network issues.
    - Invalid email formats may cause rejection.
  - **Sub-workflow:** None.

#### 2.5 WhatsApp Notification

- **Overview:** Sends a WhatsApp message using a pre-approved template if only phone number is provided.
- **Nodes Involved:**
  - Send Message on Whatsapp
- **Node Details:**
  - **Node Name:** Send Message on Whatsapp
  - **Type:** `whatsApp`
  - **Role:** Sends a WhatsApp template message to the customer’s phone.
  - **Configuration:**
    - Uses WhatsApp Business API.
    - Template named “feedback_n8n” in English (en_US).
    - Template body parameter dynamically set from an earlier Google Sheets Trigger node's user field.
    - Phone Number ID and recipient number provided.
    - WhatsApp API credentials configured.
  - **Expressions:** Recipient phone number from `$json.Phone.toString()`.
  - **Input/Output:** Input from “If only Phone Number is given”.
  - **Edge Cases:**
    - WhatsApp API errors such as template mismatch, account suspension, or invalid phone number format.
    - Template must be pre-approved in WhatsApp Business Account.
  - **Sub-workflow:** None.

#### 2.6 Trigger for Google Sheets Changes

- **Overview:** Watches for changes in a specified Google Sheets document to trigger additional processes.
- **Nodes Involved:**
  - Google Sheets Trigger
- **Node Details:**
  - **Node Name:** Google Sheets Trigger
  - **Type:** `googleSheetsTrigger`
  - **Role:** Polls Google Sheets for changes every minute.
  - **Configuration:**
    - Requires Google Sheets OAuth2 credentials.
    - Document ID and Sheet name selected.
    - Poll interval set to every minute.
  - **Input/Output:** No inputs; outputs triggered data.
  - **Edge Cases:**
    - API quota or authorization errors.
    - Polling latency.
  - **Downstream:** Connected to conditional nodes for communication.
  - **Sub-workflow:** None.

#### 2.7 Integration Guidance

- **Overview:** Provides detailed instructions on setting up Google Cloud OAuth2 credentials to enable Google Sheets integration.
- **Nodes Involved:**
  - Sticky Note
  - Sticky Note1
- **Node Details:**
  - **Node Name:** Sticky Note
    - Content includes step-by-step instructions on:
      - Creating Google Cloud project.
      - Enabling Sheets API.
      - Configuring OAuth consent screen.
      - Creating OAuth2 client credentials with authorized redirect URI from n8n.
  - **Node Name:** Sticky Note1
    - Notes readers to check individual node notes for further integration details.

---

### 3. Summary Table

| Node Name                       | Node Type           | Functional Role                      | Input Node(s)               | Output Node(s)                           | Sticky Note                                                                                                   |
|--------------------------------|---------------------|------------------------------------|----------------------------|-----------------------------------------|--------------------------------------------------------------------------------------------------------------|
| On form submission             | formTrigger         | Capture customer feedback submission | None                       | Google Sheets1                          |                                                                                                              |
| Google Sheets1                 | googleSheets        | Append or update feedback in Sheets | On form submission          | None                                    | Follow node notes for mapping and setup instructions.                                                        |
| Google Sheets Trigger          | googleSheetsTrigger | Listen for sheet changes           | None                       | If E-mail and Phone Number Both are given, If only Phone Number is given | Set Google Credentials and select Sheet to trigger on changes.                                               |
| If E-mail and Phone Number Both are given | if                  | Condition: both email and phone present | Google Sheets Trigger       | Email                                   |                                                                                                              |
| If only Phone Number is given  | if                  | Condition: only phone number present | Google Sheets Trigger       | Send Message on Whatsapp                 |                                                                                                              |
| Email                         | emailSend           | Send feedback email                 | If E-mail and Phone Number Both are given | None                                    |                                                                                                              |
| Send Message on Whatsapp       | whatsApp            | Send WhatsApp template message      | If only Phone Number is given | None                                    | Set the WhatsApp template from the WhatsApp Business Account.                                                |
| Sticky Note                   | stickyNote          | Guidance for Google Sheets OAuth2 setup | None                       | None                                    | Detailed OAuth2 credential setup instructions for Google Sheets integration.                                  |
| Sticky Note1                  | stickyNote          | Reminder to check node notes         | None                       | None                                    | Integration Notes: Check individual node notes for more information.                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add the “On form submission” node:**
   - Type: `formTrigger`
   - Configure form title as “Customer Feedback Questions for IT Services”.
   - Add required fields:
     - Text fields: "What is your Name?"
     - Email field: "Email ID"
     - Text field: "Contact Number" with placeholder `(e.g, +1234567890)`
     - Multiple dropdown fields for satisfaction, communication, timeliness, responsiveness, technical expertise, recommendation.
     - Textarea fields for improvement and additional comments.
   - Set webhook path as `/feedback`.
   - Save and activate webhook.

3. **Add the “Google Sheets1” node:**
   - Type: `googleSheets`
   - Select operation: “appendOrUpdate”.
   - Set up Google Sheets OAuth2 credentials (see section 5).
   - Choose the Google Sheets document and sheet to update.
   - Manually map each form field to corresponding sheet columns (e.g., Name → Name column).
   - Connect output of “On form submission” to input of “Google Sheets1”.

4. **Add the “Google Sheets Trigger” node:**
   - Type: `googleSheetsTrigger`
   - Set poll interval to every minute.
   - Select the same Google Sheets document and sheet as above.
   - Use Google Sheets OAuth2 credentials.
   - This node listens for any changes in the sheet.

5. **Add the “If E-mail and Phone Number Both are given” node:**
   - Type: `if`
   - Condition: 
     - `$json.Phone.toString()` is not empty
     - AND `$json.Email` is not empty
   - Connect output of “Google Sheets Trigger” to this node.

6. **Add the “If only Phone Number is given” node:**
   - Type: `if`
   - Condition:
     - `$json.Phone.toString()` is not empty
     - No email condition needed.
   - Connect output of “Google Sheets Trigger” to this node.

7. **Add the “Email” node:**
   - Type: `emailSend`
   - SMTP credentials configured for sending emails.
   - From email: “XYZ@gmail.com” or your verified sender.
   - To email: `={{ $json.Email }}`
   - Subject: “Feedback”
   - Body text: “Please give us your valuable feedback at: <<< Your Form Production URL >>>”
   - Connect output “true” of “If E-mail and Phone Number Both are given” to “Email”.

8. **Add the “Send Message on Whatsapp” node:**
   - Type: `whatsApp`
   - Configure WhatsApp Business API credentials.
   - Set template name to “feedback_n8n” with language “en_US”.
   - Set template body parameters dynamically (e.g., user name or ID from Google Sheets Trigger).
   - Recipient phone number: `={{ $json.Phone.toString() }}`
   - Connect output “true” of “If only Phone Number is given” to this node.

9. **Add Sticky Notes (Optional for guidance):**
   - Add a sticky note with detailed instructions on creating Google Cloud credentials, enabling the Sheets API, and configuring OAuth2.
   - Add another sticky note reminding to check individual node notes for further details.

10. **Test the workflow:**
    - Submit the form to trigger data flow.
    - Verify data correctly appends to Google Sheets.
    - Check if emails or WhatsApp messages are sent depending on contact info.
    - Monitor for errors and adjust credentials/settings as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                   | Context or Link                                                                                               |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Detailed instructions for creating Google Cloud Project and enabling Google Sheets API, setting up OAuth consent screen, and creating OAuth2 client credentials needed for Google Sheets integration.                                           | https://console.cloud.google.com/ (Google Cloud Console)                                                     |
| Reminder: WhatsApp templates must be pre-approved in the WhatsApp Business Account before use in this workflow.                                                                                                                              | WhatsApp Business API documentation                                                                           |
| Node notes include important setup steps especially for Google Sheets node mapping and email SMTP configuration.                                                                                                                            | Check node “notes” section in n8n UI                                                                         |
| The placeholder “<<< Your Form Production URL >>>” in the email body should be replaced with the actual live URL of the deployed n8n form trigger webhook for production use.                                                               | User must replace manually                                                                                     |

---

**Disclaimer:** This documentation is generated exclusively from the provided n8n workflow JSON. It adheres strictly to content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.