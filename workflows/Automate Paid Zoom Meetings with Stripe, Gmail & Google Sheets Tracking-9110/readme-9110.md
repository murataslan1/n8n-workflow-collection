Automate Paid Zoom Meetings with Stripe, Gmail & Google Sheets Tracking

https://n8nworkflows.xyz/workflows/automate-paid-zoom-meetings-with-stripe--gmail---google-sheets-tracking-9110


# Automate Paid Zoom Meetings with Stripe, Gmail & Google Sheets Tracking

### 1. Workflow Overview

This workflow automates the creation and management of paid Zoom meetings by integrating Zoom, Stripe, Gmail, and Google Sheets. It streamlines the event setup process, payment collection, participant tracking, and notification delivery.

The workflow is logically divided into two main functional blocks:

- **1.1 Event Creation Flow** (Triggered by a form submission):
  - Receives meeting details via a form.
  - Creates a Zoom meeting with a randomized password.
  - Creates a Stripe product and payment link for the event.
  - Creates a Google Sheet tab to track participants.
  - Stores event details in a master Google Sheet.
  - Sends a notification email to the event organizer/teacher with all event and payment information.

- **1.2 Payment Handling Flow** (Triggered by Stripe webhook on completed checkout sessions):
  - Listens for successful payment events.
  - Extracts participant details from payment metadata.
  - Adds participant data to the corresponding Google Sheet tab.
  - Sends a confirmation email to the participant.
  - Notifies the event organizer/teacher about the new participant.

---

### 2. Block-by-Block Analysis

#### 2.1 Event Creation Flow

**Overview:**  
This block handles new meeting creation triggered by a form submission. It sets up the Zoom meeting, Stripe payment product and link, participant tracking sheet tab, and alerts the event teacher.

**Nodes Involved:**  
- Creation Form  
- if is creation flow  
- Create Zoom meeting  
- Create Stripe Product  
- Create payment link  
- Create participant list  
- Format event  
- Store event  
- Send email to teacher  

**Node Details:**

- **Creation Form**  
  - Type: Form Trigger  
  - Role: Entry point for event creation, collects event title, price, date, hour, and minute.  
  - Key Config: Form fields include title (string), price (number), date_start (date), hour (number), minute (number).  
  - Outputs the form data for downstream nodes.  
  - Edge cases: Missing required fields; date/time parsing errors.

- **if is creation flow**  
  - Type: If condition node  
  - Role: Checks if the workflow was triggered by form submission before proceeding with creation flow.  
  - Condition: Checks if Creation Form node was executed (boolean true).  
  - Routes data to Zoom meeting creation or participant formatting depending on trigger.  
  - Edge cases: False negatives if trigger not recognized.

- **Create Zoom meeting**  
  - Type: Zoom node  
  - Role: Creates a Zoom meeting for the event.  
  - Config: Uses OAuth2 for authentication; sets meeting topic from form title; generates a random 4-character password; calculates start time by combining date, hour, and minute inputs.  
  - Inputs: Form data.  
  - Outputs: Zoom meeting details (join_url, id, password, start_time).  
  - Edge cases: Zoom API quota limits, OAuth token expiry, invalid date/time inputs.

- **Create Stripe Product**  
  - Type: HTTP Request (Stripe API)  
  - Role: Creates a Stripe product with price for the event.  
  - Config: POST to /v1/products with product name (event title), price (converted to cents), and currency from config. Uses Stripe API credentials.  
  - Inputs: Zoom meeting data, form data.  
  - Outputs: Stripe product object with ID for pricing.  
  - Edge cases: API rate limits, authentication failure, invalid price or currency.

- **Create payment link**  
  - Type: HTTP Request (Stripe API)  
  - Role: Creates Stripe payment link for the product.  
  - Config: POST to /v1/payment_links with line items referencing product price; metadata includes Zoom meeting info and event sheet ID; quantity fixed to 1.  
  - Inputs: Stripe product, Zoom meeting.  
  - Outputs: Payment link URL and metadata.  
  - Edge cases: API failures, metadata size limits, invalid references.

- **Create participant list**  
  - Type: Google Sheets  
  - Role: Creates a new tab in a Google Sheet for participant tracking for the event.  
  - Config: Uses master sheet URL from config; tab ID is the Stripe product ID; tab title includes event date, title, and product ID.  
  - Inputs: Payment link, Stripe product.  
  - Outputs: Confirmation of sheet tab creation.  
  - Edge cases: Google Sheets API quota, permission issues, duplicate sheet tabs.

- **Format event**  
  - Type: Set node  
  - Role: Prepares a structured event object with relevant fields for storage and email.  
  - Fields: title, start, price, currency, zoom_link, zoom_id, zoom_password, payment_link, payment_id, event_sheet_id.  
  - Inputs: Payment link, Zoom meeting, form data, config.  
  - Outputs: Clean event data object.  
  - Edge cases: Missing or inconsistent data propagation.

- **Store event**  
  - Type: Google Sheets  
  - Role: Appends the formatted event data to the master Google Sheet's first tab (sheet ID 0).  
  - Inputs: Formatted event data.  
  - Outputs: Confirmation of data appended.  
  - Edge cases: Sheet access permissions, API quota.

- **Send email to teacher**  
  - Type: Gmail  
  - Role: Sends a detailed confirmation email to the teacher/organizer with event details, payment link, participant list link, and Zoom info.  
  - Config: Recipient email from config; HTML email body uses expressions to include event and payment information.  
  - Inputs: Created participant list, payment link, Zoom meeting, config data.  
  - Outputs: Email sent confirmation.  
  - Edge cases: Gmail API limits, invalid email addresses, SMTP errors.

---

#### 2.2 Payment Handling Flow

**Overview:**  
Triggered by Stripe webhook on payment completion, this block processes new participant data, updates tracking sheets, and notifies both participant and teacher.

**Nodes Involved:**  
- On payment  
- Format participant  
- Add participant to list  
- Send confirmation to participant  
- Notify teacher  
- the end  

**Node Details:**

- **On payment**  
  - Type: Stripe Trigger (Webhook)  
  - Role: Listens for Stripe event "checkout.session.completed" indicating a successful purchase.  
  - Config: Stripe API credentials required; webhook URL configured in Stripe dashboard.  
  - Outputs: Payment session data including customer details and metadata.  
  - Edge cases: Disabled currently (node is disabled); webhook security and retries; partial or malformed events.

- **Format participant**  
  - Type: Set node  
  - Role: Extracts participant email and name from Stripe payment metadata.  
  - Inputs: On payment node output.  
  - Outputs: Clean participant data object with email and name fields.  
  - Edge cases: Missing customer details, malformed payment metadata.

- **Add participant to list**  
  - Type: Google Sheets  
  - Role: Appends participant data to the Google Sheet tab corresponding to the event sheet ID.  
  - Config: Document ID from config; sheet tab ID dynamically retrieved from payment metadata; columns mapped automatically.  
  - Inputs: Formatted participant data.  
  - Outputs: Confirmation of row append.  
  - Edge cases: Sheet access permission errors; invalid sheet tab IDs; data mapping mismatches.

- **Send confirmation to participant**  
  - Type: Gmail  
  - Role: Sends a personalized confirmation email to the participant with Zoom access details and event info.  
  - Config: Recipient email from payment customer details; email content includes Zoom link, password, and meeting ID.  
  - Inputs: On payment data, Google Sheets append confirmation.  
  - Outputs: Email sent confirmation.  
  - Edge cases: Invalid participant email addresses; Gmail API limits.

- **Notify teacher**  
  - Type: Gmail  
  - Role: Notifies the teacher about the new participant registration.  
  - Config: Recipient email from config; email body includes participant name, email, and participant list link.  
  - Inputs: On payment data, participant list append confirmation.  
  - Outputs: Email sent confirmation.  
  - Edge cases: Email delivery issues; invalid teacher email.

- **the end**  
  - Type: NoOp  
  - Role: Terminal node marking workflow end.  
  - Inputs: From Notify teacher.  
  - Outputs: None.

---

### 3. Summary Table

| Node Name                | Node Type               | Functional Role                            | Input Node(s)                 | Output Node(s)                             | Sticky Note                                                                                                                                    |
|--------------------------|-------------------------|-------------------------------------------|------------------------------|--------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Creation Form            | Form Trigger            | Entry point for meeting creation           |                              | Config                                    | # Create a meeting 👉🏻 Your journey to easy event management starts here. Copy the production URL; it is your admin tool.                        |
| if is creation flow      | If                      | Checks if triggered by form submission     | Creation Form                 | Create Zoom meeting, Format participant    |                                                                                                                                                |
| Create Zoom meeting      | Zoom                    | Creates Zoom meeting with password & start | if is creation flow           | Create Stripe Product                      |                                                                                                                                                |
| Create Stripe Product    | HTTP Request (Stripe)   | Creates Stripe product with price           | Create Zoom meeting           | Create payment link                        |                                                                                                                                                |
| Create payment link      | HTTP Request (Stripe)   | Creates Stripe payment link with metadata   | Create Stripe Product         | Create participant list, Format event     |                                                                                                                                                |
| Create participant list  | Google Sheets           | Creates spreadsheet tab for participant list | Create payment link           | Send email to teacher                      |                                                                                                                                                |
| Format event             | Set                     | Formats event data for storage & email      | Create payment link           | Store event                               |                                                                                                                                                |
| Store event              | Google Sheets           | Stores event data in master sheet            | Format event                  |                                            |                                                                                                                                                |
| Send email to teacher    | Gmail                   | Sends event creation confirmation email     | Create participant list       |                                            | # 🖋️ Customize Feel free to adapt email contents to your needs.                                                                              |
| On payment               | Stripe Trigger          | Listens for payment completion events       |                              | Config                                    |                                                                                                                                                |
| Format participant       | Set                     | Extracts participant details from payment   | On payment                   | Add participant to list                    |                                                                                                                                                |
| Add participant to list  | Google Sheets           | Appends participant info to sheet tab       | Format participant            | Send confirmation to participant          |                                                                                                                                                |
| Send confirmation to participant | Gmail             | Sends confirmation email to participant      | Add participant to list       | Notify teacher                            |                                                                                                                                                |
| Notify teacher           | Gmail                   | Notifies teacher of new participant          | Send confirmation to participant | the end                                  |                                                                                                                                                |
| the end                  | NoOp                    | Workflow termination node                     | Notify teacher                |                                            |                                                                                                                                                |
| Config                   | Set                     | Stores global settings (currency, email, sheet URL) | Creation Form, On payment      | if is creation flow, Config returns       | # Setup 1/ Add Your credentials for Zoom, Google, Stripe. 2/ Create a new Google Sheet. 3/ Fill the Config node.                                 |
| Sticky Note1             | Sticky Note             | Instructions for initial setup                |                              |                                            | # Setup 1/ Add Your credentials [Zoom](https://docs.n8n.io/integrations/builtin/credentials/zoom/) [Google](https://docs.n8n.io/integrations/builtin/credentials/google/) [Stripe](https://docs.n8n.io/integrations/builtin/credentials/stripe/) Note: For Google, add Gmail and Google Sheets. 2/ Create a [new Google Sheet](https://sheets.new/). Keep it blank for now; it contains your meeting and participant info. 3/ Fill the config node. |
| Sticky Note2             | Sticky Note             | Highlights form trigger node usage            |                              |                                            | # Create a meeting 👉🏻 Your journey to easy event management starts here. Copy the production URL; it is your admin tool.                        |
| Sticky Note3             | Sticky Note             | Email customization reminder                   |                              |                                            | # 🖋️ Customize Feel free to adapt email contents to your needs.                                                                              |
| Sticky Note              | Sticky Note             | Branding credit                               |                              |                                            | ### Crafted by the ## [🥷 n8n.ninja](https://n8n.ninja)                                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Credentials:**  
   - Set up OAuth2 credentials for Zoom and Google (Gmail and Google Sheets).  
   - Set up Stripe API credentials with necessary permissions.

2. **Create Config Node (Set):**  
   - Add a Set node named `Config`.  
   - Add variables:  
     - `currency` = "EUR" (string)  
     - `sheet_url` = URL of your Google Sheet (string)  
     - `teacher_email` = organizer’s email address (string)

3. **Create Form Trigger Node:**  
   - Add node `Creation Form` of type Form Trigger.  
   - Configure webhook path (e.g., "1c6fe52c-48ab-4688-b5ae-7e24361aa602").  
   - Define form fields:  
     - "title" (text, required)  
     - "price" (number, required)  
     - "date_start" (date, required)  
     - "hour" (number, optional)  
     - "minute" (number, optional)  
   - Set response mode to "last node".  
   - Add form description explaining purpose.

4. **Create If Node:**  
   - Add `if is creation flow` node.  
   - Set condition to check if `Creation Form` node was executed (expression: `={{ $("Creation Form").isExecuted }}`).  
   - Connect `Config` node output to this node input.

5. **Create Zoom Meeting Node:**  
   - Add `Create Zoom meeting` node (Zoom node).  
   - Authenticate with Zoom OAuth2 credentials.  
   - Set topic to `={{ $("Creation Form").item.json.title }}`.  
   - Set password using expression: `={{ Math.random().toString(36).slice(-4) }}` to generate a random 4-character password.  
   - Calculate start time as combined date and time:  
     `={{ new Date(new Date($("Creation Form").item.json.date_start).getTime() + ($("Creation Form").item.json.hour * 3600000) + ($("Creation Form").item.json.minute * 60000)).toISOString() }}`.  
   - Connect `if is creation flow` node’s "true" output to this node.

6. **Create Stripe Product Node:**  
   - Add HTTP Request node named `Create Stripe Product`.  
   - Method: POST  
   - URL: `https://api.stripe.com/v1/products`  
   - Authentication: Stripe API credentials  
   - Content Type: form-urlencoded  
   - Body parameters:  
     - `name` = `={{ $("Creation Form").item.json.title }}`  
     - `default_price_data[unit_amount]` = `={{ $("Creation Form").item.json.price * 100 }}` (convert to cents)  
     - `default_price_data[currency]` = `={{ $("Config").item.json.currency }}`  
   - Connect output of `Create Zoom meeting` to this node.

7. **Create Payment Link Node:**  
   - Add HTTP Request node named `Create payment link`.  
   - Method: POST  
   - URL: `https://api.stripe.com/v1/payment_links`  
   - Authentication: Stripe API credentials  
   - Content Type: form-urlencoded  
   - Body parameters:  
     - `line_items[0][price]` = `={{ $json.default_price }}` (from Stripe product response)  
     - `line_items[0][quantity]` = 1  
     - Metadata fields: event_sheet_id, zoom_link, zoom_password, zoom_id, title, start_time, price, currency (all set using expressions from previous nodes)  
   - Connect output of `Create Stripe Product` to this node.

8. **Create Participant List Node:**  
   - Add Google Sheets node `Create participant list`.  
   - Operation: create sheet tab  
   - Document ID: URL from `Config.sheet_url`  
   - Sheet ID: from Stripe product ID (`={{ $("Create Stripe Product").item.json.created }}`)  
   - Sheet tab title: combination of date, title, and product ID  
   - Connect output of `Create payment link` to this node.

9. **Format Event Node:**  
   - Add Set node `Format event`.  
   - Assign fields: title, start, price, currency, zoom_link, zoom_id, zoom_password, payment_link, payment_id, event_sheet_id (all from previous nodes).  
   - Connect output of `Create payment link` to this node.

10. **Store Event Node:**  
    - Add Google Sheets node `Store event`.  
    - Operation: append  
    - Document ID: URL from `Config.sheet_url`  
    - Sheet Name: "0" (first tab)  
    - Map all fields from `Format event`.  
    - Connect output of `Format event` to this node.

11. **Send Email to Teacher Node:**  
    - Add Gmail node `Send email to teacher`.  
    - Authentication: Gmail OAuth2 credentials  
    - Recipient: `={{ $("Config").item.json.teacher_email }}`  
    - Subject: `=🎉 {{ $("Creation Form").item.json.title }} has been created!`  
    - Message: HTML body including event title, price, start date, payment link URL, participant list URL, Zoom link and password (use expressions referencing previous nodes).  
    - Connect output of `Create participant list` to this node.

12. **Payment Handling Flow – Stripe Trigger Node:**  
    - Add Stripe Trigger node `On payment`.  
    - Configure webhook for event `checkout.session.completed`.  
    - Authenticate with Stripe API credentials.  
    - This node triggers on successful payment.

13. **Format Participant Node:**  
    - Add Set node `Format participant`.  
    - Extract `email` and `name` from Stripe payment metadata (`customer_details`).  
    - Connect output of `On payment` node.

14. **Add Participant to List Node:**  
    - Add Google Sheets node `Add participant to list`.  
    - Operation: append  
    - Document ID: from `Config.sheet_url`  
    - Sheet Name: from payment metadata field `event_sheet_id`  
    - Columns: city, email, name, country, postal_code, amount, currency (mapped automatically)  
    - Connect output of `Format participant` node.

15. **Send Confirmation to Participant Node:**  
    - Add Gmail node `Send confirmation to participant`.  
    - Recipient: participant email from payment metadata.  
    - Subject: "Thank you for your subscription 🙏"  
    - Message: HTML with participant name, event title, start date, Zoom link, password, and ID (from payment metadata).  
    - Connect output of `Add participant to list`.

16. **Notify Teacher Node:**  
    - Add Gmail node `Notify teacher`.  
    - Recipient: teacher email from `Config` node  
    - Subject: "New participant registered ☝️"  
    - Message: Participant name, email, and participant list link.  
    - Connect output of `Send confirmation to participant`.

17. **NoOp Node (the end):**  
    - Add NoOp node `the end` as terminal node.  
    - Connect output of `Notify teacher`.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                       | Context or Link                                                                                          |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Setup instructions for credentials: Zoom, Google (Gmail & Google Sheets), Stripe.                                                                                                                                                                                                                 | Sticky Note1 in workflow; links: [Zoom](https://docs.n8n.io/integrations/builtin/credentials/zoom/), [Google](https://docs.n8n.io/integrations/builtin/credentials/google/), [Stripe](https://docs.n8n.io/integrations/builtin/credentials/stripe/) |
| Create a new blank Google Sheet to store meeting and participant info. Place it appropriately in your organization.                                                                                                                                                                               | Sticky Note1                                                                                             |
| The `Creation Form` node URL is your admin tool for creating new meetings quickly. Save this URL for recurring use.                                                                                                                                                                              | Sticky Note2                                                                                             |
| Customize email content as needed to match your branding or communication style.                                                                                                                                                                                                                 | Sticky Note3                                                                                             |
| Workflow created by [🥷 n8n.ninja](https://n8n.ninja)                                                                                                                                                                                                                                            | Sticky Note                                                                                              |

---

**Disclaimer:** This document is generated from an automated n8n workflow export. It complies with applicable content policies and contains only lawful and public data.