Abandoned cart recovery for Shopify via Gmail, Google Sheets & Twilio (no-code)

https://n8nworkflows.xyz/workflows/abandoned-cart-recovery-for-shopify-via-gmail--google-sheets---twilio--no-code--3415


# Abandoned cart recovery for Shopify via Gmail, Google Sheets & Twilio (no-code)

### 1. Workflow Overview

This workflow automates abandoned cart recovery for Shopify stores by integrating Shopify checkout events with Gmail, Google Sheets, and optionally Twilio for SMS reminders. It targets solo store owners, eCommerce marketers, and automation beginners who want to recover lost sales without coding.

The workflow is logically divided into these blocks:

- **1.1 Shopify Checkout Event Reception**: Detects new Shopify checkout creations via webhook trigger.
- **1.2 Initial Data Extraction & Wait**: Extracts key checkout data and waits for a configurable delay (default 1 hour).
- **1.3 Checkout Status Verification**: Checks if the checkout was completed after the wait.
- **1.4 Conditional Branching**: If completed, marks as recovered naturally; if abandoned, proceeds to fetch cart details.
- **1.5 Discount Application & Email Sending**: Applies a fallback discount code and sends a recovery email via Gmail.
- **1.6 Logging & Optional SMS Reminder**: Logs the interaction to Google Sheets and optionally sends an SMS reminder after 24 hours.
- **1.7 (Disabled/Optional) Advanced Features**: Includes nodes for Airtable logging, batch processing, and additional waits, currently disabled.

---

### 2. Block-by-Block Analysis

#### 2.1 Shopify Checkout Event Reception

- **Overview:**  
  Listens for new checkout creation events from Shopify to trigger the workflow.

- **Nodes Involved:**  
  - Shopify Trigger

- **Node Details:**  
  - **Shopify Trigger**  
    - Type: Shopify webhook trigger node  
    - Configuration: Listens to "Checkout Create" webhook events from Shopify store  
    - Inputs: External Shopify webhook event  
    - Outputs: JSON payload containing checkout details (customer info, line items, checkout URL, etc.)  
    - Edge Cases: Webhook misconfiguration, Shopify API downtime, missing or malformed payloads  
    - Notes: Requires Shopify credentials and webhook setup in Shopify admin

#### 2.2 Initial Data Extraction & Wait

- **Overview:**  
  Extracts essential checkout data for further processing and waits for a configurable delay (default 1 hour) before checking checkout status.

- **Nodes Involved:**  
  - Extract Key Values  
  - Wait some hours

- **Node Details:**  
  - **Extract Key Values**  
    - Type: Set node  
    - Role: Extracts and formats key checkout fields (email, token, customer phone, first name, line items, checkout URL, subtotal price) for downstream nodes  
    - Expressions: Uses expressions to map incoming JSON fields to simplified variables  
    - Inputs: Shopify Trigger output  
    - Outputs: Simplified JSON with key checkout data  
    - Edge Cases: Missing fields in payload, expression evaluation errors

  - **Wait some hours**  
    - Type: Wait node  
    - Role: Pauses workflow execution for a set duration (default 1 hour) to allow customer time to complete checkout  
    - Configuration: Wait time parameter (configurable)  
    - Inputs: Extract Key Values output  
    - Outputs: Passes data unchanged after wait  
    - Edge Cases: Workflow timeout if wait exceeds instance limits, misconfiguration of wait duration

#### 2.3 Checkout Status Verification

- **Overview:**  
  After waiting, queries Shopify API to check if the checkout was completed.

- **Nodes Involved:**  
  - GET Checkout Status  
  - Completed Checkout?

- **Node Details:**  
  - **GET Checkout Status**  
    - Type: HTTP Request node  
    - Role: Calls Shopify API to retrieve current checkout status using checkout token or ID  
    - Configuration: Uses Shopify API credentials, GET method, endpoint for checkout status  
    - Inputs: Wait some hours output (with checkout token)  
    - Outputs: JSON with updated checkout data including completed_at field  
    - Edge Cases: API rate limits, invalid token, network errors

  - **Completed Checkout?**  
    - Type: If node  
    - Role: Checks if checkout's `completed_at` field is non-null to determine if purchase was completed  
    - Configuration: Condition on JSON path `completed_at != null`  
    - Inputs: GET Checkout Status output  
    - Outputs: Two branches: True (completed), False (abandoned)  
    - Edge Cases: Null or missing completed_at field, logic errors

#### 2.4 Conditional Branching: Completed vs Abandoned

- **Overview:**  
  Routes workflow based on checkout completion status.

- **Nodes Involved:**  
  - Mark as "Recovered Naturally" (Google Sheets)  
  - Fetch Cart

- **Node Details:**  
  - **Mark as "Recovered Naturally"**  
    - Type: Google Sheets node (disabled by default)  
    - Role: Logs completed checkouts as recovered naturally in Google Sheets  
    - Inputs: Completed Checkout? True branch  
    - Outputs: None (terminal)  
    - Edge Cases: Google Sheets API errors, credential issues

  - **Fetch Cart**  
    - Type: HTTP Request node  
    - Role: Retrieves detailed cart contents from Shopify for abandoned checkouts  
    - Inputs: Completed Checkout? False branch  
    - Outputs: Cart JSON data for discount application and email  
    - Edge Cases: API errors, missing cart data

#### 2.5 Discount Application & Email Sending

- **Overview:**  
  Applies a fallback discount code to the cart data and sends a recovery email via Gmail.

- **Nodes Involved:**  
  - Apply Global Discount Code  
  - Send Email (Gmail)

- **Node Details:**  
  - **Apply Global Discount Code**  
    - Type: Set node  
    - Role: Adds discount code and discount URL fields to the cart data for email personalization  
    - Configuration: Hardcoded discount code (e.g., "ABANDONED10") and URL constructed from Shopify domain and code  
    - Inputs: Fetch Cart output  
    - Outputs: Enriched JSON with discount info  
    - Edge Cases: Incorrect discount code formatting, URL errors

  - **Send Email (Gmail)**  
    - Type: Gmail node  
    - Role: Sends recovery email to customer with cart details and discount code  
    - Configuration: Uses Gmail OAuth2 credentials, email template with dynamic fields (customer name, discount code, cart items, checkout URL)  
    - Inputs: Apply Global Discount Code output  
    - Outputs: Confirmation of sent email  
    - Edge Cases: Gmail API quota limits, authentication errors, invalid email addresses

#### 2.6 Logging & Optional SMS Reminder

- **Overview:**  
  Logs the email sending event to Google Sheets and optionally sends an SMS reminder after 24 hours.

- **Nodes Involved:**  
  - Log to Google Sheet  
  - Wait some days  
  - Send SMS (Twilio)  
  - Wait 24 Hours (disabled)

- **Node Details:**  
  - **Log to Google Sheet**  
    - Type: Google Sheets node  
    - Role: Records email sent event with customer email, status, timestamp, cart value, first name, and discount code  
    - Inputs: Send Email (Gmail) output  
    - Outputs: Passes data to next node  
    - Edge Cases: Google Sheets API errors, sheet ID or header misconfiguration

  - **Wait some days**  
    - Type: Wait node  
    - Role: Waits 24 hours (configurable) before sending SMS reminder  
    - Inputs: Log to Google Sheet output  
    - Outputs: Passes data after wait  
    - Edge Cases: Workflow timeout, misconfiguration

  - **Send SMS (Twilio)**  
    - Type: Twilio node (disabled by default)  
    - Role: Sends SMS or WhatsApp reminder to customer phone number  
    - Configuration: Uses Twilio credentials, message template with dynamic fields  
    - Inputs: Wait some days output  
    - Outputs: Confirmation of SMS sent  
    - Edge Cases: Twilio API errors, invalid phone numbers, disabled node

  - **Wait 24 Hours**  
    - Type: Wait node (disabled)  
    - Role: Additional wait step after SMS (optional)  
    - Inputs: Send SMS output  
    - Outputs: None (terminal)  
    - Edge Cases: Disabled node, no effect unless enabled

#### 2.7 Disabled / Optional Advanced Features

- **Overview:**  
  Contains nodes for batch processing, Airtable logging, and additional waits for advanced customization, currently disabled.

- **Nodes Involved:**  
  - Loop Over Items (SplitInBatches)  
  - GET Checkout Status1 (HTTP Request)  
  - Airtable (logging)  
  - Mark as "Recovered Naturally" (Google Sheets, disabled)  
  - Webhook (disabled)  
  - NoOp node with motivational message (disabled)

- **Node Details:**  
  - These nodes are disabled and serve as placeholders or advanced options for scaling, CRM integration, or manual approval steps.

---

### 3. Summary Table

| Node Name                        | Node Type           | Functional Role                          | Input Node(s)           | Output Node(s)                | Sticky Note                                                                                   |
|---------------------------------|---------------------|----------------------------------------|------------------------|------------------------------|-----------------------------------------------------------------------------------------------|
| Shopify Trigger                 | Shopify Trigger     | Entry point: listens for new checkouts | (external webhook)      | Extract Key Values            | 🟩 Main Step: Replace with your Shopify webhook for "Checkout Create"                         |
| Extract Key Values              | Set                 | Extracts key checkout data              | Shopify Trigger         | Wait some hours               | 🟦 Personalization: Adjust extracted fields if needed                                        |
| Wait some hours                | Wait                | Waits 1 hour before status check        | Extract Key Values      | GET Checkout Status           | 🟩 Main Step: Configure wait time as desired                                                 |
| GET Checkout Status            | HTTP Request        | Queries Shopify for checkout status     | Wait some hours         | Completed Checkout?           | 🟩 Main Step: Requires Shopify API credentials                                               |
| Completed Checkout?            | If                  | Checks if checkout was completed        | GET Checkout Status     | Mark as "Recovered Naturally" (True), Fetch Cart (False) | 🟩 Main Step: Conditional branching based on checkout completion                            |
| Mark as "Recovered Naturally" | Google Sheets       | Logs natural recovery                    | Completed Checkout? (True) | (none)                      | 🟨 Optional: Enable to log recovered checkouts                                               |
| Fetch Cart                    | HTTP Request        | Retrieves cart details for abandoned carts | Completed Checkout? (False) | Apply Global Discount Code    | 🟩 Main Step: Requires Shopify API credentials                                               |
| Apply Global Discount Code    | Set                 | Adds discount code and URL to data      | Fetch Cart              | Send Email (Gmail)            | 🟦 Personalization: Update discount code and URL                                            |
| Send Email (Gmail)            | Gmail                | Sends recovery email                     | Apply Global Discount Code | Log to Google Sheet           | 🟩 Main Step: Requires Gmail OAuth2 credentials                                              |
| Log to Google Sheet           | Google Sheets        | Logs email sent event                    | Send Email (Gmail)      | Wait some days                | 🟩 Main Step: Update Sheet ID and headers                                                   |
| Wait some days               | Wait                 | Waits 24 hours before SMS reminder      | Log to Google Sheet     | Send SMS (Twilio)             | 🟨 Optional: Configure wait duration                                                        |
| Send SMS (Twilio)            | Twilio               | Sends SMS reminder (optional)            | Wait some days          | Wait 24 Hours                | 🟨 Optional: Requires Twilio credentials; disabled by default                               |
| Wait 24 Hours                | Wait                 | Additional wait after SMS (optional)     | Send SMS (Twilio)       | (none)                       | 🟨 Optional: Disabled by default                                                           |
| Loop Over Items              | SplitInBatches       | Batch processing of cart items (disabled) | GET Checkout Status1 (disabled) | GET Checkout Status1 (disabled) | 🟨 Optional: Disabled node                                                                 |
| GET Checkout Status1          | HTTP Request         | Additional checkout status check (disabled) | Loop Over Items (disabled) | Loop Over Items (disabled)    |                                                                                               |
| Airtable                    | Airtable             | Alternative logging (disabled)           | (none)                 | (none)                       | 🟨 Optional: Disabled node                                                                 |
| Webhook                     | Webhook              | Alternative trigger (disabled)            | (none)                 | (none)                       |                                                                                               |
| NoOp (Motivational Message) | NoOp                 | Placeholder node with message (disabled) | (none)                 | (none)                       |                                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Shopify Trigger Node**  
   - Type: Shopify Trigger  
   - Configure with Shopify credentials  
   - Set webhook event to "Checkout Create"  
   - Position as entry point

2. **Add Set Node "Extract Key Values"**  
   - Extract fields: email, token, customer phone & first name, line items, checkout URL, subtotal price  
   - Use expressions to map from Shopify Trigger output  
   - Connect Shopify Trigger → Extract Key Values

3. **Add Wait Node "Wait some hours"**  
   - Set wait time to 1 hour (configurable)  
   - Connect Extract Key Values → Wait some hours

4. **Add HTTP Request Node "GET Checkout Status"**  
   - Configure to GET Shopify API endpoint for checkout status using token or ID  
   - Use Shopify credentials  
   - Connect Wait some hours → GET Checkout Status

5. **Add If Node "Completed Checkout?"**  
   - Condition: Check if `completed_at` field is not null  
   - Connect GET Checkout Status → Completed Checkout?

6. **Add Google Sheets Node "Mark as Recovered Naturally"** (optional)  
   - Configure Google Sheets credentials  
   - Set target Sheet ID and columns for logging  
   - Connect Completed Checkout? True → Mark as Recovered Naturally

7. **Add HTTP Request Node "Fetch Cart"**  
   - Configure to GET detailed cart data from Shopify API  
   - Use Shopify credentials  
   - Connect Completed Checkout? False → Fetch Cart

8. **Add Set Node "Apply Global Discount Code"**  
   - Add fields: discount_code (e.g., "ABANDONED10"), discount_url (Shopify discount link)  
   - Connect Fetch Cart → Apply Global Discount Code

9. **Add Gmail Node "Send Email (Gmail)"**  
   - Configure Gmail OAuth2 credentials  
   - Compose email template with dynamic fields: customer name, discount code, cart items, checkout URL  
   - Connect Apply Global Discount Code → Send Email (Gmail)

10. **Add Google Sheets Node "Log to Google Sheet"**  
    - Configure Google Sheets credentials and Sheet ID  
    - Log email sent event with email, status, timestamp, cart value, first name, discount code  
    - Connect Send Email (Gmail) → Log to Google Sheet

11. **Add Wait Node "Wait some days"**  
    - Set wait time to 24 hours (configurable)  
    - Connect Log to Google Sheet → Wait some days

12. **Add Twilio Node "Send SMS (Twilio)"** (optional)  
    - Configure Twilio credentials  
    - Compose SMS message with dynamic fields  
    - Connect Wait some days → Send SMS (Twilio)  
    - (Optional) Enable this node if SMS reminders are desired

13. **Add Wait Node "Wait 24 Hours"** (optional)  
    - Configure wait time if needed  
    - Connect Send SMS (Twilio) → Wait 24 Hours  
    - Disabled by default

14. **(Optional) Add Disabled Nodes for Advanced Features**  
    - Batch processing, Airtable logging, alternative triggers, etc.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                     | Context or Link                                                                                     |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| This workflow uses a color-coded sticky note system inside n8n canvas for easier customization: Green = Main Steps, Blue = Personalization Tips, Yellow = Optional/Advanced Features.                                           | Visual sticky notes inside the n8n workflow canvas                                                |
| To customize for other platforms like WooCommerce or Stripe, replace the Shopify trigger and cart-check logic accordingly.                                                                                                     | Customization tip                                                                                |
| For multilingual support or AI-powered personalization, consider integrating AI nodes or external services.                                                                                                                    | Customization tip                                                                                |
| Upgrade logging from Google Sheets to Airtable for CRM-style features by enabling and configuring the Airtable node.                                                                                                           | Optional advanced feature                                                                        |
| For manual approval steps or unique discount codes per user, contact Velebit at Innovatio for custom logic development.                                                                                                        | Contact: velebit@innovatio.design                                                                |
| This template was designed by Velebit from Innovatio. External links in the workflow are optional and lead only to the official company website with no affiliate links.                                                        | Project credit                                                                                   |
| A paid version is available on Gumroad with additional modules and commercial use rights.                                                                                                                                      | Licensing note                                                                                   |
| Setup requires creating credentials for Shopify, Gmail, Google Sheets, and optionally Twilio in your n8n instance before importing and activating the workflow.                                                               | Setup instruction                                                                              |
| Replace the Shopify trigger webhook URL with your store’s webhook URL configured for “Checkout Create” events.                                                                                                                | Setup instruction                                                                              |
| Customize email and SMS message templates to match your brand tone and customer engagement strategy.                                                                                                                           | Personalization tip                                                                             |
| Ensure Google Sheets node is configured with your own Sheet ID and headers matching the logged data fields.                                                                                                                    | Setup instruction                                                                              |
| Twilio SMS node is disabled by default; enable and configure if SMS reminders are desired.                                                                                                                                      | Optional feature                                                                                |

---

This documentation provides a detailed, structured reference for understanding, reproducing, and customizing the "Abandoned Cart Recovery for Shopify via Gmail, Google Sheets & Twilio (no-code)" workflow in n8n.