Automate WordPress Elementor Lead Management with Excel CRM & Email Campaigns

https://n8nworkflows.xyz/workflows/automate-wordpress-elementor-lead-management-with-excel-crm---email-campaigns-11033


# Automate WordPress Elementor Lead Management with Excel CRM & Email Campaigns

### 1. Workflow Overview

This workflow automates lead management for WordPress Elementor forms by integrating real-time lead capture, CRM storage, and email communications. It targets businesses using Elementor forms to gather leads, aiming to centralize lead data in a Google Sheets CRM while automating immediate email notifications to both the business owner and the lead. Additionally, it schedules and executes periodic promotional email campaigns to all stored contacts.

The workflow is structured into five logical blocks:

- **1.1 Input Reception and Lead Storage:** Receives Elementor form submissions via webhook and appends lead data to Google Sheets.
- **1.2 Immediate Email Notifications:** Sends notification emails to the business owner and confirmation emails to the lead.
- **1.3 CRM Status Updates:** Updates the CRM sheet to mark email notifications as sent.
- **1.4 Scheduled Campaign Trigger:** Activates on a monthly schedule to start the promotional campaign.
- **1.5 Campaign Execution Loop:** Reads all stored contacts and sends promotional emails iteratively.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Lead Storage

**Overview:**  
This block captures incoming form submissions from Elementor via a webhook and stores each lead as a new row in a Google Sheets CRM.

**Nodes Involved:**  
- Webhook  
- Append row in sheet

**Node Details:**

- **Webhook**  
  - *Type & Role:* HTTP Webhook node; entry point receiving POST requests from Elementor form submissions.  
  - *Configuration:* Path set to `Contact-us`, listening for POST method.  
  - *Expressions:* Uses raw JSON body from the incoming HTTP request to extract lead fields such as "Full Name", "Email Address", "Whatsapp Number", "Project Budget", and "Project Details".  
  - *Input/Output:* No inputs; outputs lead data to the next node.  
  - *Potential Failures:* Incoming request format errors, missing required fields, webhook URL misconfiguration, network issues.  

- **Append row in sheet**  
  - *Type & Role:* Google Sheets node; writes new lead data as a row in the CRM sheet.  
  - *Configuration:* Targets a specific Google Sheets document and sheet tab. Columns mapped explicitly to lead fields extracted from webhook JSON body.  
  - *Expressions:* Uses expressions like `={{ $json.body['Email Address'] }}` to map webhook payload fields to sheet columns.  
  - *Input/Output:* Inputs lead data from Webhook; outputs appended data to email notification nodes.  
  - *Potential Failures:* Authentication errors, sheet access issues, schema mismatch, rate limits.

---

#### 1.2 Immediate Email Notifications

**Overview:**  
Sends two emails per submission: one to the business owner containing lead details for follow-up, and one as a confirmation to the lead.

**Nodes Involved:**  
- Send a mail to Business Owner  
- Send a mail to User

**Node Details:**

- **Send a mail to Business Owner**  
  - *Type & Role:* Gmail node; sends notification email to fixed business owner address.  
  - *Configuration:* Sends to `didaruleee11@gmail.com`, subject "Send mail to Owner". Email body constructed with HTML, embedding lead details from JSON fields. Uses OAuth2 credential for Gmail.  
  - *Expressions:* Uses `{{$json["Name "]}}`, `{{$json["Email"]}}`, etc., to populate email content dynamically.  
  - *Input/Output:* Input from Append row in sheet; output to Update row in sheet node.  
  - *Potential Failures:* Gmail auth failures, email sending limits, invalid email content.

- **Send a mail to User**  
  - *Type & Role:* Gmail node; sends confirmation email to the lead's email.  
  - *Configuration:* Sends to `={{ $json.Email }}`, subject "Send Mail to User", similar HTML content as owner email but personalized. Uses same Gmail OAuth2 credentials.  
  - *Expressions:* Uses dynamic recipient email and lead info fields.  
  - *Input/Output:* Input from Append row in sheet; output to Update row in sheet2 node.  
  - *Potential Failures:* Invalid recipient email address, Gmail send limits, auth issues.

---

#### 1.3 CRM Status Updates

**Overview:**  
Updates the Google Sheets CRM to mark that notification emails were sent successfully to both owner and lead.

**Nodes Involved:**  
- Update row in sheet  
- Update row in sheet2

**Node Details:**

- **Update row in sheet**  
  - *Type & Role:* Google Sheets node; updates the "Mail Sent at Owner End" column to "Sent" for the lead's row.  
  - *Configuration:* Matches rows based on the lead's email address, updates status column accordingly.  
  - *Expressions:* Uses `={{ $json["Email"] }}` for matching and updating.  
  - *Input/Output:* Input from Send a mail to Business Owner; no output to other nodes (ends branch).  
  - *Potential Failures:* Sheet access issues, mismatched email key, concurrency conflicts.

- **Update row in sheet2**  
  - *Type & Role:* Google Sheets node; updates the "Mail Sent at Consumer End" column to "Sent".  
  - *Configuration:* Similar to above, matching on email, updating consumer mail status.  
  - *Input/Output:* Input from Send a mail to User; endpoint node.  
  - *Potential Failures:* Same as above.

---

#### 1.4 Scheduled Campaign Trigger

**Overview:**  
Triggers the start of a scheduled marketing email campaign at a defined time interval (monthly at 9 AM).

**Nodes Involved:**  
- Schedule Trigger  
- Get row(s) in sheet

**Node Details:**

- **Schedule Trigger**  
  - *Type & Role:* Schedule Trigger node; initiates execution on set schedule.  
  - *Configuration:* Monthly trigger at 9:00 AM (hour set, months interval).  
  - *Input/Output:* No input; outputs trigger event to Get row(s) in sheet node.  
  - *Potential Failures:* Timing misconfiguration, system downtime.

- **Get row(s) in sheet**  
  - *Type & Role:* Google Sheets node; reads all contact rows from CRM sheet for campaign processing.  
  - *Configuration:* Accesses same Google Sheets document and tab as lead storage. Reads all rows.  
  - *Input/Output:* Input from Schedule Trigger; outputs all rows to Loop Over Items node.  
  - *Potential Failures:* Authentication issues, large data volume causing timeouts.

---

#### 1.5 Campaign Execution Loop

**Overview:**  
Loops over each contact obtained from the sheet and sends a promotional email individually.

**Nodes Involved:**  
- Loop Over Items  
- Replace Me (NoOp)  
- Send promotional email at specific date

**Node Details:**

- **Loop Over Items**  
  - *Type & Role:* SplitInBatches node; processes rows one by one or in batches for campaign emails.  
  - *Configuration:* Default batching (batch size unspecified, defaults to 1).  
  - *Input/Output:* Input from Get row(s) in sheet; outputs each batch to Replace Me node.  
  - *Potential Failures:* Large batch sizes causing delays, empty or malformed rows.

- **Replace Me**  
  - *Type & Role:* NoOp node; placeholder node representing where campaign email logic occurs.  
  - *Configuration:* No specific parameters; purely a pass-through to next node.  
  - *Input/Output:* Input from Loop Over Items (second output port); outputs to Send promotional email node.  
  - *Potential Failures:* None (no operation).

- **Send promotional email at specific date**  
  - *Type & Role:* Gmail node; sends marketing email to each contact.  
  - *Configuration:* Sends to dynamic email from current item; HTML email content similar to immediate notification emails but presumably customizable for promotions. Subject: "Send Mail to User". Uses Gmail OAuth2 credentials.  
  - *Expressions:* Same as earlier email nodes to fill dynamic fields.  
  - *Input/Output:* Input from Replace Me; endpoint of campaign flow.  
  - *Potential Failures:* Email sending limits, invalid recipient addresses, auth failures.

---

### 3. Summary Table

| Node Name                      | Node Type          | Functional Role                          | Input Node(s)          | Output Node(s)                  | Sticky Note                                                                                                                   |
|-------------------------------|--------------------|----------------------------------------|-----------------------|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Webhook                       | Webhook            | Receives Elementor form submissions    | —                     | Append row in sheet            | ## STEP 1: 🟦 Webhook Input and Store Lead in Sheet<br>1. Receives form data from Elementor.<br>2. Adds each submission to CRM. |
| Append row in sheet           | Google Sheets      | Stores lead data in CRM sheet           | Webhook                | Send a mail to Business Owner, Send a mail to User | Same sticky note as Webhook                                                                                                  |
| Send a mail to Business Owner | Gmail              | Sends email notification to owner       | Append row in sheet    | Update row in sheet            | ## STEP 2:  🟩  Notify Website Owner and Auto-Reply to Customer<br>1. Sends email to admin.<br>2. Sends confirmation to user.    |
| Send a mail to User           | Gmail              | Sends confirmation email to lead         | Append row in sheet    | Update row in sheet2           | Same sticky note as above                                                                                                     |
| Update row in sheet           | Google Sheets      | Marks owner email as sent in CRM         | Send a mail to Business Owner | —                        | ## STEP 3:   🟧 Status Update in Sheet<br>Writes “Mail Sent” updates back to the sheet.                                          |
| Update row in sheet2          | Google Sheets      | Marks user email as sent in CRM          | Send a mail to User    | —                             | Same sticky note as above                                                                                                     |
| Schedule Trigger             | Schedule Trigger   | Triggers monthly campaign start          | —                     | Get row(s) in sheet           | ## STEP 4: 🟦 Scheduled Campaign Sender<br>Reads all emails from the sheet and sends marketing messages.                       |
| Get row(s) in sheet           | Google Sheets      | Retrieves all lead contacts for campaign | Schedule Trigger       | Loop Over Items               | Same sticky note as Schedule Trigger                                                                                          |
| Loop Over Items               | SplitInBatches     | Loops over each contact for campaign     | Get row(s) in sheet    | Replace Me                    | ## STEP 5: 🟦 Send promotional email<br>Can customize and send email to all contacts listed.                                   |
| Replace Me                   | NoOp               | Placeholder for campaign email logic     | Loop Over Items        | Send promotional email at specific date | Same sticky note as Loop Over Items                                                                                     |
| Send promotional email at specific date | Gmail        | Sends promotional email to contacts      | Replace Me             | —                             | Same sticky note as above                                                                                                     |
| Sticky Note9                 | Sticky Note        | Workflow overview and setup instructions | —                     | —                             | # How it works<br>Setup steps for webhook, sheets, Gmail nodes, and schedule                                                  |
| Sticky Note10                | Sticky Note        | Describes webhook and lead storage step  | —                     | —                             | ## STEP 1: 🟦 Webhook Input and Store Lead in Sheet                                                                           |
| Sticky Note11                | Sticky Note        | Describes email notification step        | —                     | —                             | ## STEP 2:  🟩  Notify Website Owner and Auto-Reply to Customer                                                               |
| Sticky Note12                | Sticky Note        | Describes CRM status update step          | —                     | —                             | ## STEP 3:   🟧 Status Update in Sheet                                                                                        |
| Sticky Note13                | Sticky Note        | Describes scheduled campaign trigger      | —                     | —                             | ## STEP 4: 🟦 Scheduled Campaign Sender                                                                                       |
| Sticky Note14                | Sticky Note        | Describes promotional email sending step | —                     | —                             | ## STEP 5: 🟦 Send promotional email                                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `Contact-us`  
   - No authentication required  
   - This node receives form submission data from Elementor forms.

2. **Create Google Sheets Node (Append row in sheet)**  
   - Type: Google Sheets  
   - Operation: Append  
   - Connect Google Sheets OAuth2 credentials  
   - Select the spreadsheet and sheet/tab for CRM storage  
   - Map columns:  
     - `Name ` ← `{{$json.body['Full Name']}}`  
     - `Email` ← `{{$json.body['Email Address']}}`  
     - `Whats app` ← `{{$json.body['Whatsapp Number']}}`  
     - `Budget` ← `{{$json.body['Project Budget']}}`  
     - `Project Detail` ← `{{$json.body['Project Details']}}`  
   - Connect output of Webhook node to this node.

3. **Create Gmail Node (Send a mail to Business Owner)**  
   - Type: Gmail  
   - Credentials: Gmail OAuth2 account  
   - To: `didaruleee11@gmail.com` (change as needed)  
   - Subject: `Send mail to Owner`  
   - Message (HTML): Include lead details using expressions like `{{$json["Name "]}}` etc.  
   - Connect output of Append row node to this node.

4. **Create Google Sheets Node (Update row in sheet)**  
   - Type: Google Sheets  
   - Operation: Update  
   - Use same spreadsheet and sheet as append node  
   - Match row by `Email` column using `={{ $json["Email"] }}`  
   - Update column `Mail Sent at Owner End` to `Sent`  
   - Connect output of "Send a mail to Business Owner" node to this node.

5. **Create Gmail Node (Send a mail to User)**  
   - Type: Gmail  
   - Credentials: Gmail OAuth2 account (same as above)  
   - To: `={{ $json.Email }}` (dynamic user email)  
   - Subject: `Send Mail to User`  
   - Message: Similar HTML content as business owner email with lead details  
   - Connect output of Append row node to this node.

6. **Create Google Sheets Node (Update row in sheet2)**  
   - Type: Google Sheets  
   - Operation: Update  
   - Use same spreadsheet and sheet  
   - Match by `Email` column  
   - Update column `Mail Sent at Consumer End` to `Sent`  
   - Connect output of "Send a mail to User" node to this node.

7. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Set to trigger monthly at 9:00 AM (specify hour and months interval)  
   - This node starts the marketing campaign flow.

8. **Create Google Sheets Node (Get row(s) in sheet)**  
   - Type: Google Sheets  
   - Operation: Read all rows  
   - Use same spreadsheet and sheet as above  
   - Connect output of Schedule Trigger node to this node.

9. **Create SplitInBatches Node (Loop Over Items)**  
   - Type: SplitInBatches  
   - Default batch size (usually 1)  
   - Connect output of Get row(s) in sheet node to this node.

10. **Create NoOp Node (Replace Me)**  
    - Type: No Operation  
    - Acts as placeholder for campaign logic  
    - Connect output of Loop Over Items node (second output port) to this node.

11. **Create Gmail Node (Send promotional email at specific date)**  
    - Type: Gmail  
    - Credentials: Gmail OAuth2 account  
    - To: `={{ $json.Email }}`  
    - Subject: `Send Mail to User` (customize as needed)  
    - Message: HTML formatted promotional content, similar template as other emails  
    - Connect output of Replace Me node to this node.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                        | Context or Link                                                                                                                                                          |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This workflow captures Elementor form submissions using a webhook, saves each lead into a Google Sheets CRM, and sends two emails: one to the website owner and one to the customer. It also includes a scheduled email campaign to all contacts. Setup steps are detailed in Sticky Note9. | Workflow overview and setup instructions (Sticky Note9)                                                                                                                |
| Ensure the Google Sheets document has appropriate columns exactly matching the mapped fields (`Name `, `Email`, `Whats app`, `Budget`, `Project Detail`, `Mail Sent at Owner End`, `Mail Sent at Consumer End`).                                                                 | Critical for data consistency and update operations                                                                                                                    |
| Gmail OAuth2 credentials must be configured and authorized for sending emails. Be aware of Gmail sending limits to avoid throttling.                                                                                                                                               | Gmail OAuth2 account setup                                                                                                                                               |
| Elementor forms must be configured to send POST requests to the webhook URL path `Contact-us`.                                                                                                                                                                                     | Elementor integration requirement                                                                                                                                       |
| Scheduled campaign frequency can be modified by adjusting the Schedule Trigger node parameters (daily, weekly, monthly).                                                                                                                                                            | Schedule customization                                                                                                                                                   |
| Email HTML templates include embedded images hosted on external URLs. Ensure these URLs remain valid and accessible to avoid broken images in emails.                                                                                                                             | Email content customization                                                                                                                                              |
| Monitor Google Sheets API quota and rate limits, especially if lead volume or campaign size grows significantly.                                                                                                                                                                   | API usage consideration                                                                                                                                                   |
| The NoOp "Replace Me" node serves as a placeholder; you can replace it with more complex campaign logic or additional processing if needed.                                                                                                                                         | Placeholder node for campaign customization                                                                                                                             |

---

**Disclaimer:**  
The text provided is extracted exclusively from an n8n automated workflow designed for legal and compliant data processing. No illegal, offensive, or protected content is included. All data handled is legal and public.