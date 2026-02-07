Automate Invoice Generation & Email Delivery with Jotform, Xero & GPT-4o-mini

https://n8nworkflows.xyz/workflows/automate-invoice-generation---email-delivery-with-jotform--xero---gpt-4o-mini-9796


# Automate Invoice Generation & Email Delivery with Jotform, Xero & GPT-4o-mini

### 1. Workflow Overview

This workflow automates the entire process of generating and delivering invoices for customers based on form submissions. It is triggered by a product or service order submitted through Jotform and integrates with Xero for customer and invoice management, OpenAI GPT-4o-mini for generating professional invoice email content, and Slack for team notifications.

**Target Use Cases:**  
- Freelancers, consultants, coaches, small businesses, and e-commerce sellers who need automated invoice creation and delivery.  
- Scenarios requiring seamless customer verification or creation, invoice generation, email dispatch, and sales team notification triggered by form entries.

**Logical Blocks:**  
1.1 **Input Reception** — Receiving and formatting form submission data from Jotform.  
1.2 **Customer Verification & Management** — Checking if the customer exists in Xero; updating or creating a contact accordingly.  
1.3 **Invoice Generation** — Creating an invoice in Xero for the verified or newly created customer.  
1.4 **Invoice Email Creation** — Using GPT-4o-mini AI to generate professional HTML email content for the invoice.  
1.5 **Invoice Dispatch & Team Notification** — Sending the invoice email to the customer and notifying the sales team via Slack.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
Receives the product or service order submitted via Jotform webhook and formats the raw submission data to structured fields for use downstream.

- **Nodes Involved:**  
  - Receive form submission  
  - Format data  
  - Sticky Notes: "Receive Submission", "Format Data"

- **Node Details:**

  1. **Receive form submission**  
     - Type: Webhook (HTTP POST)  
     - Role: Entry trigger; receives form data from Jotform via webhook URL.  
     - Config: HTTP method POST, path fixed for webhook identification.  
     - Input: External HTTP POST request from Jotform form submission.  
     - Output: Raw JSON containing form fields such as name, email, phone, itemName, and billingAddress as HTML-formatted string.  
     - Edge cases: Missing or malformed form data; webhook connection errors.

  2. **Format data**  
     - Type: Code (JavaScript)  
     - Role: Parses and extracts structured customer and address data from raw form submission. Simplifies downstream node usage.  
     - Config: Custom JS code extracts address components via regex from HTML string, and maps customer name, email, phone, and item name.  
     - Expressions: Uses `$input.first().json.body` to access raw form fields.  
     - Input: Output of webhook node.  
     - Output: JSON with structured `address`, `customer`, and `item` objects.  
     - Edge cases: Address fields missing or in unexpected format causing regex failure; null values handled by returning null fields.

---

#### 2.2 Customer Verification & Management

- **Overview:**  
Checks if the customer exists in Xero by matching email. If found, updates contact details; if not, creates a new contact with the formatted data.

- **Nodes Involved:**  
  - Check if the customer exists  
  - If (Condition)  
  - Update contact  
  - Create new contact  
  - Sticky Notes: "Check If Contact exists", "Update Contact", "Create Contact"

- **Node Details:**

  1. **Check if the customer exists**  
     - Type: Xero node (Get all contacts)  
     - Role: Searches Xero contacts filtered by customer email.  
     - Config: Limit 1 result, filter by `EmailAddress="{{ $json.customer.email }}"`.  
     - Input: Formatted customer data.  
     - Output: Xero contact object if found, empty if none.  
     - Edge cases: API rate limits, auth errors, email not found.

  2. **If**  
     - Type: Conditional  
     - Role: Determines if contact exists based on presence of `ContactID` in response.  
     - Config: Checks if JSON data exists and if `ContactID` field exists and is not empty.  
     - Input: Output of Xero contact search.  
     - Output: Routes to update contact (true) or create new contact (false).  
     - Edge cases: Response anomalies or missing fields leading to false negatives.

  3. **Update contact**  
     - Type: Xero node (Update contact)  
     - Role: Updates existing contact details with latest customer info.  
     - Config: Uses `ContactID` from previous node; updates name and mobile phone number.  
     - Input: True branch from If node.  
     - Output: Updated contact object.  
     - Edge cases: Invalid ContactID, API update errors.

  4. **Create new contact**  
     - Type: Xero node (Create contact)  
     - Role: Creates a new contact in Xero with full details including address and email.  
     - Config: Uses formatted customer name, email, phone, and detailed address fields (line1, line2, city, state, postal code, country).  
     - Input: False branch from If node.  
     - Output: Newly created contact object with ContactID.  
     - Edge cases: Duplicate contact creation, validation errors on address or phone.

---

#### 2.3 Invoice Generation

- **Overview:**  
Generates a new accounts receivable invoice in Xero linked to the verified or newly created contact.

- **Nodes Involved:**  
  - Create the invoice  
  - Sticky Note: "Create The Invoice"

- **Node Details:**

  1. **Create the invoice**  
     - Type: Xero node (Create invoice)  
     - Role: Creates an ACCREC (accounts receivable) invoice for the contact.  
     - Config:  
       - Contact ID from updated or newly created contact.  
       - Line item uses `itemCode` from formatted data's item name.  
       - Unit amount hardcoded as 10 (currency units).  
       - Tax type INPUT and account code 200 configured.  
     - Input: ContactID from contact nodes, item code from formatted data.  
     - Output: Xero invoice object including InvoiceNumber, AmountDue, CurrencyCode, Status.  
     - Edge cases: Missing or invalid item code, API timeouts, or invoice creation errors.

---

#### 2.4 Invoice Email Creation

- **Overview:**  
Uses a GPT-4o-mini AI model to generate a professional HTML email body for the newly created invoice, based on the invoice data.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - AI Agent  
  - Sticky Note: "Send The Invoice"

- **Node Details:**

  1. **OpenAI Chat Model**  
     - Type: Langchain OpenAI chat model node  
     - Role: Provides AI language model interface using GPT-4o-mini.  
     - Config: Model set to "gpt-4o-mini".  
     - Input: Invoice JSON data from "Create the invoice".  
     - Output: AI-generated content to AI Agent node.  
     - Credentials: OpenAI API key required.  
     - Edge cases: API limits, response latency, malformed input JSON.

  2. **AI Agent**  
     - Type: Langchain AI Agent node  
     - Role: Defines an AI assistant prompt that creates professional HTML invoice email content from the Xero invoice response.  
     - Config: System message defines AI's role as generating professional HTML content for invoice email.  
     - Input: Data from Xero invoice node, passed through OpenAI Chat Model.  
     - Output: HTML email content string.  
     - Edge cases: Failure to interpret input, generation of irrelevant or incomplete email content.

---

#### 2.5 Invoice Dispatch & Team Notification

- **Overview:**  
Sends the generated invoice email to the customer’s email address and sends a notification message to the sales team via Slack.

- **Nodes Involved:**  
  - Send email  
  - Notify the team  
  - Sticky Notes: "Send The Invoice", "Notify The Team"

- **Node Details:**

  1. **Send email**  
     - Type: Email Send node (SMTP)  
     - Role: Sends the AI-generated invoice email to the customer's email address.  
     - Config:  
       - `To Email` dynamically set from Xero invoice contact email.  
       - Email subject "New Invoice".  
       - HTML body set from AI Agent output.  
       - From email hardcoded as system@example.com (should be updated).  
     - Credentials: SMTP credentials (Mailtrap used in example).  
     - Input: HTML content from AI Agent, recipient email from invoice node.  
     - Edge cases: SMTP auth failure, invalid email address, email sending timeout.

  2. **Notify the team**  
     - Type: Slack node  
     - Role: Posts a notification message to a Slack channel about the newly created invoice.  
     - Config:  
       - Channel: #test (by name).  
       - Message includes invoice number, amount due, currency, and status dynamically from invoice data.  
     - Credentials: Slack API token required.  
     - Input: Invoice data from "Create the invoice".  
     - Edge cases: Slack API rate limits, invalid token, channel not found.

---

### 3. Summary Table

| Node Name               | Node Type             | Functional Role                  | Input Node(s)               | Output Node(s)               | Sticky Note                                                                                                                   |
|-------------------------|-----------------------|--------------------------------|-----------------------------|------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Receive form submission | Webhook               | Receive Jotform submission      | —                           | Format data                  | ## Receive Submission Receives the product/service form submission from Jotform                                               |
| Format data             | Code                  | Format raw form data            | Receive form submission     | Check if the customer exists | ## Format Data Formats the data thus making it easier to be used in other nodes                                               |
| Check if the customer exists | Xero                 | Search for customer by email    | Format data                 | If                          | ## Check If Contact exists Checks if the contact exists in Xero or not                                                       |
| If                      | If                    | Branch for contact existence   | Check if the customer exists | Update contact, Create new contact |                                                                                                                              |
| Update contact          | Xero                  | Update existing contact details | If (true branch)            | Create the invoice           | ## Update Contact Updates the contact                                                                                         |
| Create new contact      | Xero                  | Create new contact in Xero      | If (false branch)           | Create the invoice           | ## Create Contact Creates a new contact                                                                                        |
| Create the invoice      | Xero                  | Generate invoice for contact    | Update contact, Create new contact | AI Agent, Notify the team    | ## Create The Invoice Creates a new invoice for that contact                                                                   |
| OpenAI Chat Model       | Langchain OpenAI chat | AI model interface (GPT-4o-mini)| Create the invoice          | AI Agent                    |                                                                                                                              |
| AI Agent                | Langchain AI Agent    | Generate professional invoice email HTML | Create the invoice, OpenAI Chat Model | Send email                 | ## Send The Invoice Sends the newly created invoice for that customer(via email)                                              |
| Send email              | Email Send            | Send invoice email to customer  | AI Agent                    | —                           |                                                                                                                              |
| Notify the team         | Slack                 | Notify sales team about invoice | Create the invoice          | —                           | ## Notify The Team Notifies the team (sales team for example) about the new invoice                                             |
| Sticky Note             | Sticky Note           | Documentation                  | —                           | —                           | See individual sticky notes for contextual explanations                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**  
   - Type: Webhook  
   - Name: "Receive form submission"  
   - HTTP Method: POST  
   - Path: Unique webhook path (e.g., "dac28968-ec17-41da-b720-c579c1a7169b")  
   - Purpose: Receive form submissions from Jotform.

2. **Add Code Node to Format Data:**  
   - Type: Code  
   - Name: "Format data"  
   - Use JavaScript code to extract customer name, email, phone, item name, and parse billing address from HTML string into structured JSON fields.  
   - Input: Data from webhook node.

3. **Add Xero Node to Check Customer Existence:**  
   - Type: Xero (Get All Contacts)  
   - Name: "Check if the customer exists"  
   - Operation: Get all contacts with limit 1  
   - Filter: `EmailAddress="{{ $json.customer.email }}"`  
   - Credential: Xero OAuth2 API configured with your Xero account.

4. **Add If Node to Branch Based on Contact Presence:**  
   - Type: If  
   - Name: "If"  
   - Condition: Check if JSON and `ContactID` exist in input  
   - True branch: Existing contact found  
   - False branch: No contact found

5. **Add Xero Node to Update Contact:**  
   - Type: Xero (Update Contact)  
   - Name: "Update contact"  
   - Contact ID: `={{ $json.ContactID }}`  
   - Update fields: name, mobile phone  
   - Connect from If node True output  
   - Credential: Xero OAuth2 API

6. **Add Xero Node to Create New Contact:**  
   - Type: Xero (Create Contact)  
   - Name: "Create new contact"  
   - Fields: name, email, phone, address (line1, line2, city, region, postal code, country) from formatted data  
   - Connect from If node False output  
   - Credential: Xero OAuth2 API

7. **Add Xero Node to Create Invoice:**  
   - Type: Xero (Create Invoice)  
   - Name: "Create the invoice"  
   - Invoice Type: ACCREC  
   - Contact ID: from "Update contact" or "Create new contact" output  
   - Line items: itemCode from formatted item name, unitAmount 10, taxType INPUT, accountCode 200  
   - Credential: Xero OAuth2 API

8. **Add OpenAI Chat Model Node:**  
   - Type: Langchain OpenAI Chat Model  
   - Name: "OpenAI Chat Model"  
   - Model: gpt-4o-mini  
   - Credential: OpenAI API key  
   - Input: Xero invoice data

9. **Add AI Agent Node:**  
   - Type: Langchain AI Agent  
   - Name: "AI Agent"  
   - System Message: Define AI to generate professional HTML invoice email content from Xero invoice response.  
   - Input: Output of OpenAI Chat Model and Xero invoice node.

10. **Add Email Send Node:**  
    - Type: Email Send (SMTP)  
    - Name: "Send email"  
    - To: Customer email from Xero invoice contact  
    - From: Set appropriate sender email  
    - Subject: "New Invoice"  
    - HTML Body: HTML content from AI Agent node  
    - Credential: SMTP credentials (e.g., Mailtrap or your SMTP server)  
    - Connect from AI Agent node.

11. **Add Slack Node to Notify Team:**  
    - Type: Slack  
    - Name: "Notify the team"  
    - Channel: Specify Slack channel by name or ID (e.g., #test)  
    - Message: Include invoice number, amount due, currency, and status from Xero invoice data  
    - Credential: Slack API token  
    - Connect from "Create the invoice" node.

12. **Connect Workflow:**  
    - Webhook → Format data → Check if customer exists → If → (True) Update contact → Create the invoice → AI Agent  
    - (False) Create new contact → Create the invoice → AI Agent  
    - AI Agent → Send email  
    - Create the invoice → Notify the team

13. **Configure Credentials:**  
    - Xero OAuth2 API with appropriate scopes and authenticated account.  
    - OpenAI API key for GPT-4o-mini model.  
    - SMTP credentials for email sending.  
    - Slack API token with permission to post to the target channel.

14. **Test the workflow:**  
    - Submit a test form via Jotform with sample customer and item data matching Xero item codes.  
    - Verify customer creation/update, invoice generation, email receipt, and Slack notification.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                               | Context or Link                                                                                                                |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| This workflow automates receiving product/service orders, managing customers in Xero, generating invoices, emailing customers, and notifying teams via Slack.                                                                                                                                                                                                             | Overview sticky note within the workflow.                                                                                      |
| Jotform webhook setup is required to trigger this workflow; see Jotform webhook setup instructions.                                                                                                                                                                                                                                                                        | https://www.jotform.com/help/245-how-to-setup-a-webhook-with-jotform/                                                         |
| Xero credentials must be configured with OAuth2 API; ensure products/services in Jotform match item codes in Xero exactly.                                                                                                                                                                                                                                               | https://docs.n8n.io/integrations/builtin/credentials/xero                                                                       |
| Slack credentials must be configured for posting notifications; configure the Slack node with a valid API token and specify the channel.                                                                                                                                                                                                                                 | https://docs.n8n.io/integrations/builtin/credentials/slack                                                                      |
| Email node requires SMTP credentials; Mailtrap used in example for testing but replace with production SMTP.                                                                                                                                                                                                                                                               |                                                                                                                               |
| AI model GPT-4o-mini is used for generating professional invoice email content, requiring OpenAI API credentials.                                                                                                                                                                                                                                                         |                                                                                                                               |
| Unit amount for invoice line items is hardcoded to 10; adjust as per pricing requirements.                                                                                                                                                                                                                                                                                  |                                                                                                                               |

---

**Disclaimer:** The text provided is exclusively from an automated workflow created with n8n, respecting all applicable content policies. It contains no illegal or protected content and processes only legal, public data.