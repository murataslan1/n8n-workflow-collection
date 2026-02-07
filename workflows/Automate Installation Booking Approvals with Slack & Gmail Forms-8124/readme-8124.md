Automate Installation Booking Approvals with Slack & Gmail Forms

https://n8nworkflows.xyz/workflows/automate-installation-booking-approvals-with-slack---gmail-forms-8124


# Automate Installation Booking Approvals with Slack & Gmail Forms

### 1. Workflow Overview

This workflow automates the approval process for installation booking requests submitted via a web form. It targets service businesses that need to collect installation appointments, obtain team approval before confirmation, and send automated email responses accordingly.

**Logical Blocks:**

- **1.1 Input Reception:** Capture customer booking requests through a customizable form trigger.
- **1.2 Configuration Setup:** Extract and assign form data to reusable workflow variables for consistent referencing.
- **1.3 Team Approval Request via Slack:** Send a detailed and interactive Slack message to a designated channel, enabling the team to approve or reject the booking.
- **1.4 Approval Status Evaluation:** Conditional branch based on Slack approval response.
- **1.5 Email Notification:** Send confirmation emails if approved, or reschedule request emails if rejected.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
Accept installation booking submissions from customers using a form integrated within n8n, triggering the workflow when a new request arrives.

- **Nodes Involved:**  
  - Form Trigger: Installation Booking

- **Node Details:**

  - **Form Trigger: Installation Booking**  
    - **Type & Role:** `formTrigger` node; starts the workflow upon form submission.  
    - **Configuration:**  
      - Form titled "Installation Schedule Booking Form" with fields: Full Name (text), Email Address (email), Phone Number (text), Booking Date (date), Preferred Time (dropdown with options: 09:00, 11:00, 14:00, 16:00 PST).  
      - All fields are required.  
    - **Expressions/Variables:** Outputs submitted form data as JSON with keys matching field labels.  
    - **Connections:** Output connected to "Set Fields: Configuration Variables" node.  
    - **Edge Cases / Failures:**  
      - Form validation failure (missing required fields) is handled by the form UI, not this node.  
      - Webhook registration issues if URL is not correctly embedded or exposed publicly.  
    - **Version:** 2.2

#### 1.2 Configuration Setup

- **Overview:**  
Extract values from the form submission and assign them to named variables for ease of use downstream. Also sets static business-specific configuration values.

- **Nodes Involved:**  
  - Set Fields: Configuration Variables

- **Node Details:**

  - **Set Fields: Configuration Variables**  
    - **Type & Role:** `set` node; defines variables for workflow-wide use.  
    - **Configuration:**  
      - Assigns variables like CUSTOMER_NAME, CUSTOMER_EMAIL, CUSTOMER_PHONE, BOOKING_DATE, BOOKING_TIME from form trigger outputs.  
      - Sets static variables: SLACK_CHANNEL_ID (“#installations”), COMPANY_NAME (“Your Company Name”), CONTACT_PERSON (“Your Name”), RESCHEDULE_LINK (URL to booking form).  
    - **Expressions:** Uses expressions like `={{ $('Form Trigger: Installation Booking').item.json['Full Name'] }}` to map form fields.  
    - **Connections:** Output to "Slack: Request Approval" node.  
    - **Edge Cases:** If form data missing or malformed, variables may be empty or invalid.  
    - **Version:** 3.4

#### 1.3 Team Approval Request via Slack

- **Overview:**  
Sends a formatted message to a Slack channel with details of the booking request and interactive approval buttons for team members to accept or reject.

- **Nodes Involved:**  
  - Slack: Request Approval

- **Node Details:**

  - **Slack: Request Approval**  
    - **Type & Role:** `slack` node; sends a message and waits for approval response.  
    - **Configuration:**  
      - Sends message to channel defined by SLACK_CHANNEL_ID variable (`#installations`).  
      - Message includes customer name, email, phone, booking date/time.  
      - Asks if an installer is available with double approval buttons (approve/disapprove).  
      - Approval type set to double; disapprove label is "No installer available".  
    - **Expressions:** Uses variables from Set Fields node, e.g. `{{ $json.CUSTOMER_NAME }}`.  
    - **Connections:** Output connects to "If: Check Approval Status" node to evaluate response.  
    - **Edge Cases:**  
      - Slack API errors (invalid channel, permission issues).  
      - Timeout if no team member responds.  
      - Incorrect Slack credentials or tokens.  
    - **Version:** 2.3

#### 1.4 Approval Status Evaluation

- **Overview:**  
Evaluates the team’s response from Slack. If approved, proceeds to send confirmation email; if rejected, sends reschedule email.

- **Nodes Involved:**  
  - If: Check Approval Status

- **Node Details:**

  - **If: Check Approval Status**  
    - **Type & Role:** `if` node; conditional branching based on Slack approval result.  
    - **Configuration:**  
      - Checks if `$json.data.approved` is `true`.  
      - If true, routes to confirmation email node; else routes to reschedule email node.  
    - **Expressions:** `={{ $json.data.approved }}` used to evaluate boolean approval.  
    - **Connections:**  
      - True branch → "Gmail: Send Confirmation Email"  
      - False branch → "Gmail: Send Reschedule Email"  
    - **Edge Cases:**  
      - Slack response payload structure changes could break condition.  
      - Null or missing approval data.  
    - **Version:** 2.2

#### 1.5 Email Notification

- **Overview:**  
Sends a personalized email to the customer confirming the booking if approved, or requesting rescheduling if rejected.

- **Nodes Involved:**  
  - Gmail: Send Confirmation Email  
  - Gmail: Send Reschedule Email

- **Node Details:**

  - **Gmail: Send Confirmation Email**  
    - **Type & Role:** `gmail` node; sends confirmation email to customer.  
    - **Configuration:**  
      - Recipient: CUSTOMER_EMAIL  
      - Subject: "✅ Installation Confirmed - [Booking Date]"  
      - Message body includes customer name, appointment date/time, and contact person signature.  
    - **Expressions:** Uses variables from Set Fields node for dynamic content.  
    - **Edge Cases:**  
      - Gmail authentication errors.  
      - Invalid email address format.  
      - Email sending limits or quota exceeded.  
    - **Version:** 2.1

  - **Gmail: Send Reschedule Email**  
    - **Type & Role:** `gmail` node; sends reschedule request email if no installer available.  
    - **Configuration:**  
      - Recipient: CUSTOMER_EMAIL  
      - Subject: "⏰ Please Reschedule Your Installation"  
      - Message includes booking details and a reschedule link.  
    - **Expressions:** Uses variables from Set Fields node.  
    - **Edge Cases:** Similar to confirmation email node.  
    - **Version:** 2.1

---

### 3. Summary Table

| Node Name                      | Node Type                  | Functional Role                          | Input Node(s)                    | Output Node(s)                   | Sticky Note                                                      |
|--------------------------------|----------------------------|----------------------------------------|---------------------------------|---------------------------------|-----------------------------------------------------------------|
| Form Trigger: Installation Booking | formTrigger                | Capture installation booking form data | (Trigger node)                  | Set Fields: Configuration Variables | **Step 1** Customer submits form with booking details           |
| Set Fields: Configuration Variables | set                        | Assign form data to variables and set static config | Form Trigger: Installation Booking | Slack: Request Approval           | **Step 2** Set up configuration variables for customization      |
| Slack: Request Approval          | slack                      | Send Slack message requesting booking approval | Set Fields: Configuration Variables | If: Check Approval Status         | **Step 3** Send Slack approval request with buttons             |
| If: Check Approval Status        | if                         | Branch workflow based on Slack approval | Slack: Request Approval          | Gmail: Send Confirmation Email, Gmail: Send Reschedule Email | **Step 4** Check team approval or rejection                     |
| Gmail: Send Confirmation Email  | gmail                      | Send confirmation email if approved   | If: Check Approval Status (true) | (End)                          | **Step 5A** Send confirmation email with appointment details    |
| Gmail: Send Reschedule Email    | gmail                      | Send reschedule email if rejected     | If: Check Approval Status (false) | (End)                          | **Step 5B** Send reschedule email with booking form link        |
| Sticky Note                    | stickyNote                 | Documentation and overview note         | —                               | —                               | Overview and setup instructions for the entire workflow         |
| Sticky Note1                   | stickyNote                 | Step 1 description                      | —                               | —                               | Step 1: Customer submits form                                    |
| Sticky Note2                   | stickyNote                 | Step 2 description                      | —                               | —                               | Step 2: Set configuration variables                               |
| Sticky Note3                   | stickyNote                 | Step 3 description                      | —                               | —                               | Step 3: Slack message with approval buttons                      |
| Sticky Note4                   | stickyNote                 | Step 4 description                      | —                               | —                               | Step 4: Check approval status                                    |
| Sticky Note5                   | stickyNote                 | Step 5A description                     | —                               | —                               | Step 5A: Send confirmation email                                |
| Sticky Note6                   | stickyNote                 | Step 5B description                     | —                               | —                               | Step 5B: Send reschedule email                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node:**  
   - Node Type: `formTrigger`  
   - Name: "Form Trigger: Installation Booking"  
   - Configure form fields:  
     - Full Name (text, required)  
     - Email Address (email, required)  
     - Phone Number (text, required)  
     - Booking Date (date picker, required)  
     - Preferred Time (dropdown: 09:00, 11:00, 14:00, 16:00; required)  
   - Set form title: "Installation Schedule Booking Form"  
   - Publish webhook URL and embed form on website or share link.

2. **Add Set Node to Assign Variables:**  
   - Node Type: `set`  
   - Name: "Set Fields: Configuration Variables"  
   - Add assignments:  
     - CUSTOMER_NAME: `={{ $('Form Trigger: Installation Booking').item.json['Full Name'] }}`  
     - CUSTOMER_EMAIL: `={{ $('Form Trigger: Installation Booking').item.json['Email Address'] }}`  
     - CUSTOMER_PHONE: `={{ $('Form Trigger: Installation Booking').item.json['Phone Number'] }}`  
     - BOOKING_DATE: `={{ $('Form Trigger: Installation Booking').item.json['Booking Date'] }}`  
     - BOOKING_TIME: `={{ $('Form Trigger: Installation Booking').item.json['Preferred Time (PST)'] }}`  
     - SLACK_CHANNEL_ID: `#installations` (replace with your Slack channel)  
     - COMPANY_NAME: Your business name (replace)  
     - CONTACT_PERSON: Your name or contact person (replace)  
     - RESCHEDULE_LINK: URL to your booking form for rescheduling (replace)

3. **Create Slack Node to Send Approval Request:**  
   - Node Type: `slack`  
   - Name: "Slack: Request Approval"  
   - Set operation to "sendAndWait" to await approval response.  
   - Channel: Use expression or select the channel from SLACK_CHANNEL_ID variable.  
   - Message content example:  
     ```
     🔧 **New Installation Request**

     👤 **Customer:** {{ $json.CUSTOMER_NAME }}
     📧 **Email:** {{ $json.CUSTOMER_EMAIL }}
     📞 **Phone:** {{ $json.CUSTOMER_PHONE }}

     📅 **Requested Date/Time:** {{ $json.BOOKING_DATE }} at {{ $json.BOOKING_TIME }} PST

     ❓ **Do we have an available installer for this slot?**
     ```  
   - Configure approval options:  
     - Approval type: Double (approve/disapprove)  
     - Disapprove label: "No installer available"  
   - Connect output to "If" node.

4. **Add If Node to Check Approval Status:**  
   - Node Type: `if`  
   - Name: "If: Check Approval Status"  
   - Condition: Boolean check if `{{$json.data.approved}}` is `true`.  
   - True branch connects to confirmation email node; False branch connects to reschedule email node.

5. **Create Gmail Node for Confirmation Email:**  
   - Node Type: `gmail`  
   - Name: "Gmail: Send Confirmation Email"  
   - Set "Send To" to `={{ $('Set Fields: Configuration Variables').item.json.CUSTOMER_EMAIL }}`  
   - Subject: `=✅ Installation Confirmed - {{ $('Set Fields: Configuration Variables').item.json.BOOKING_DATE }}`  
   - Message:  
     ```
     Hi {{ $('Set Fields: Configuration Variables').item.json.CUSTOMER_NAME }},

     Great news! We've confirmed your installation appointment.

     📅 Date: {{ $('Set Fields: Configuration Variables').item.json.BOOKING_DATE }}
     ⏰ Time: {{ $('Set Fields: Configuration Variables').item.json.BOOKING_TIME }} PST

     Our installer will contact you shortly to confirm final details and provide any preparation instructions.

     If you need to make any changes, please contact us as soon as possible.

     Best regards,
     {{ $('Set Fields: Configuration Variables').item.json.CONTACT_PERSON }}
     {{ $('Set Fields: Configuration Variables').item.json.COMPANY_NAME }}
     ```
   - Connect to end of workflow.

6. **Create Gmail Node for Reschedule Email:**  
   - Node Type: `gmail`  
   - Name: "Gmail: Send Reschedule Email"  
   - Set "Send To" to `={{ $('Set Fields: Configuration Variables').item.json.CUSTOMER_EMAIL }}`  
   - Subject: `=⏰ Please Reschedule Your Installation`  
   - Message:  
     ```
     Hi {{ $('Set Fields: Configuration Variables').item.json.CUSTOMER_NAME }},

     Thank you for your interest in our installation services.

     Unfortunately, we don't have an installer available for your requested time slot:
     📅 Date: {{ $('Set Fields: Configuration Variables').item.json.BOOKING_DATE }}
     ⏰ Time: {{ $('Set Fields: Configuration Variables').item.json.BOOKING_TIME }} PST

     Please reschedule your appointment using this link:
     🔗 {{ $('Set Fields: Configuration Variables').item.json.RESCHEDULE_LINK }}

     We apologize for any inconvenience and look forward to serving you at a different time.

     Best regards,
     {{ $('Set Fields: Configuration Variables').item.json.CONTACT_PERSON }}
     {{ $('Set Fields: Configuration Variables').item.json.COMPANY_NAME }}
     ```
   - Connect to end of workflow.

7. **Credential Setup:**  
   - Configure Slack credentials with appropriate OAuth2 or token access having permission to post and manage messages in the selected channel.  
   - Configure Gmail credentials with OAuth2 access to send emails on behalf of the configured account.

8. **Testing & Deployment:**  
   - Test the form submission and verify Slack message received.  
   - Approve and reject booking in Slack to verify correct email responses.  
   - Ensure webhook URLs and Slack channel IDs are correct and accessible.

---

### 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                                                                 |
|---------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| The workflow automates installation booking approvals integrating Slack for team decisions and Gmail for customer notifications. | Project description and overview.                                                              |
| Update the "Set Fields" node with your own Slack channel ID, company name, contact person, and reschedule link before use.       | Configuration requirement.                                                                     |
| Slack approval messages use double approval buttons; disapproval label is "No installer available".                              | Slack node configuration detail.                                                              |
| No API keys or sensitive data are hardcoded; credentials managed securely through n8n's credential system.                       | Security best practice note.                                                                   |
| Embed the form trigger webhook URL on your website or share the form link for customer submissions.                              | Deployment instruction.                                                                        |
| Useful for service businesses needing structured booking approvals with minimal manual intervention.                            | Intended use case.                                                                             |

---

**Disclaimer:** The text provided is extracted exclusively from an automated workflow built with n8n, an integration and automation tool. It complies strictly with all applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.