Auto-Send PDF Invoices with Stripe Payment Triggers and Gmail

https://n8nworkflows.xyz/workflows/auto-send-pdf-invoices-with-stripe-payment-triggers-and-gmail-8030


# Auto-Send PDF Invoices with Stripe Payment Triggers and Gmail

### 1. Workflow Overview

This workflow automatically generates and sends PDF invoices via email when a successful payment is detected through Stripe. It is designed for businesses that want to automate invoicing immediately after payment confirmation, improving efficiency and customer communication.

The workflow is logically divided into the following blocks:

- **1.1 Setup and Input Reception:** Receive Stripe payment success webhooks.
- **1.2 Payment Data Normalization:** Process and validate payment data from Stripe.
- **1.3 Invoice Generation:** Create an HTML invoice template customized with payment details.
- **1.4 Email Dispatch:** Send the invoice as a PDF attachment via Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Setup and Input Reception

- **Overview:**  
  This block is responsible for receiving incoming webhook events from Stripe, specifically payment success notifications. It acts as the entry point for the workflow.

- **Nodes Involved:**  
  - Stripe Payment Webhook  
  - Setup Instructions (Sticky Note)

- **Node Details:**  

  **Stripe Payment Webhook**  
  - Type: Webhook  
  - Role: Listens for incoming Stripe events of type `payment_intent.succeeded`.  
  - Configuration:  
    - HTTP Method: POST  
    - Path: `stripe-webhook`  
  - Input: HTTP POST requests from Stripe Webhook with payment event data.  
  - Output: Passes the webhook JSON payload downstream.  
  - Potential Failures: Misconfigured webhook URL, invalid payloads, network timeouts.  
  - Notes: Requires Stripe Dashboard setup with this webhook URL and event selection.  

  **Setup Instructions**  
  - Type: Sticky Note  
  - Role: Provides setup guidance to the user.  
  - Content Highlights:  
    - Stripe webhook registration steps.  
    - Gmail OAuth credential setup.  
    - Customization instructions for invoice template.  
  - No input/output connections.

#### 1.2 Payment Data Normalization

- **Overview:**  
  Processes the raw Stripe webhook payload to extract and normalize key payment and customer information. It filters for successful payments only and validates the presence of critical fields like customer email.

- **Nodes Involved:**  
  - Normalize Payment Data (Code Node)

- **Node Details:**  

  **Normalize Payment Data**  
  - Type: Code (JavaScript)  
  - Role: Extracts relevant payment details such as payment ID, amount (converted from cents), currency, customer email and name, payment date, description, and generates a unique invoice number.  
  - Key Expressions:  
    - Checks event type must be `payment_intent.succeeded` or `charge.succeeded`.  
    - Throws error if customer email is missing.  
    - Converts timestamp from UNIX epoch to ISO string.  
    - Formats currency to uppercase.  
  - Inputs: JSON from Stripe webhook node.  
  - Outputs: Normalized JSON object with standardized fields for further processing.  
  - Failure Cases:  
    - Event type mismatch (workflow stops).  
    - Missing customer email (throws error, halts execution).  
  - Version-specific: Uses typeVersion 2 for improved JS code execution.

#### 1.3 Invoice Generation

- **Overview:**  
  Generates a fully formatted HTML invoice based on the normalized payment data. This HTML will be later converted to PDF for emailing.

- **Nodes Involved:**  
  - Generate Invoice HTML (Code Node)

- **Node Details:**  

  **Generate Invoice HTML**  
  - Type: Code (JavaScript)  
  - Role: Creates an HTML document string styled with embedded CSS to represent the invoice visually, including company header, invoice details, billing information, payment summary, and footer notes.  
  - Configuration:  
    - Hardcoded company name placeholder "Your Company Name" (to be customized).  
    - Uses template literals to inject dynamic payment data such as invoice number, payment date, customer name/email, amount, currency, and description.  
    - Constructs a filename for the PDF invoice using invoice number.  
  - Inputs: Normalized payment JSON.  
  - Outputs: JSON with extended fields `invoice_html` and `filename`.  
  - Edge Cases: Date formatting depends on valid ISO string; missing or malformed data could break layout.  
  - Version-specific: typeVersion 2.

#### 1.4 Email Dispatch

- **Overview:**  
  Sends the generated invoice as a PDF attachment via Gmail to the customer’s email address.

- **Nodes Involved:**  
  - Send Invoice Email (Gmail Node)

- **Node Details:**  

  **Send Invoice Email**  
  - Type: Gmail (Email)  
  - Role: Sends an email with the invoice attached as a PDF to the customer.  
  - Configuration:  
    - Subject: "Invoice {{ $json.invoice_number }} - Payment Confirmation"  
    - Message Body: Personalized greeting including customer name, payment details (amount, ID, date), and a thank-you note.  
    - Attachments: Binds to binary property `invoice_pdf` (assumed generated upstream or by an implicit conversion from HTML to PDF—though this conversion node is not explicitly listed, might be a missing or implicit step).  
  - Input: JSON with invoice data and binary attachment.  
  - Output: None (end node).  
  - Credential: Requires Gmail OAuth2 credentials connected in n8n.  
  - Edge Cases:  
    - Missing or invalid Gmail credentials.  
    - Attachment binary data missing or improperly formatted.  
    - Email address validation failure (handled upstream).  
  - Version: typeVersion 2.1.

---

### 3. Summary Table

| Node Name             | Node Type          | Functional Role                 | Input Node(s)           | Output Node(s)           | Sticky Note                                                                                  |
|-----------------------|--------------------|--------------------------------|-------------------------|--------------------------|----------------------------------------------------------------------------------------------|
| Setup Instructions    | Sticky Note        | Setup guidance and instructions | None                    | None                     | 💰 **SETUP REQUIRED:** Stripe webhook setup, Gmail OAuth setup, invoice customization notes |
| Stripe Payment Webhook | Webhook            | Receive Stripe payment events   | None                    | Normalize Payment Data    | 💰 **SETUP REQUIRED:** Stripe webhook setup instructions apply here                          |
| Normalize Payment Data | Code               | Normalize and validate payment data | Stripe Payment Webhook  | Generate Invoice HTML     |                                                                                              |
| Generate Invoice HTML  | Code               | Generate HTML invoice template  | Normalize Payment Data  | Send Invoice Email        |                                                                                              |
| Send Invoice Email     | Gmail              | Send invoice email with PDF     | Generate Invoice HTML   | None                     | 💰 **SETUP REQUIRED:** Gmail OAuth credential setup required                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node:**  
   - Name: `Stripe Payment Webhook`  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `stripe-webhook`  
   - Purpose: To receive Stripe payment event POST requests.  
   - Save and activate webhook.  

2. **Create Code Node for Data Normalization:**  
   - Name: `Normalize Payment Data`  
   - Type: Code  
   - Language: JavaScript  
   - Paste the provided JS code that:  
     - Extracts payment object from Stripe event.  
     - Checks event type for success.  
     - Extracts payment details (ID, amount in dollars, currency, customer email and name, payment date, description).  
     - Generates a unique invoice number prefixed with `INV-`.  
     - Throws error if customer email missing.  
   - Connect input from `Stripe Payment Webhook`.  

3. **Create Code Node for Invoice HTML Generation:**  
   - Name: `Generate Invoice HTML`  
   - Type: Code  
   - Language: JavaScript  
   - Paste the provided invoice HTML template code, embedding dynamic fields from normalized data.  
   - Note: Customize the company name in the `<h2>Your Company Name</h2>` element.  
   - Connect input from `Normalize Payment Data`.  

4. **Create Gmail Node for Sending Email:**  
   - Name: `Send Invoice Email`  
   - Type: Gmail  
   - Configure Gmail OAuth2 credentials under n8n credentials.  
   - Set Subject: `Invoice {{ $json.invoice_number }} - Payment Confirmation`  
   - Set Message:  
     ```
     Dear {{ $json.customer_name }},

     Thank you for your payment! Please find your invoice attached.

     Payment Details:
     - Amount: {{ $json.currency }} {{ $json.amount }}
     - Payment ID: {{ $json.payment_id }}
     - Date: {{ $json.payment_date }}

     Best regards,
     Your Company Name
     ```  
   - Attachments: Bind to binary property `invoice_pdf` (requires conversion of invoice HTML to PDF before this step).  
   - Connect input from `Generate Invoice HTML`.  

5. **(Optional - Missing Node) Add HTML to PDF Conversion Node:**  
   - Since the workflow references a PDF attachment `invoice_pdf` but no explicit node converts HTML to PDF, add a node such as "HTML to PDF" or "PDF Generator":  
   - Input: `invoice_html` from `Generate Invoice HTML`.  
   - Output: Binary data named `invoice_pdf` for attachment.  
   - Connect between `Generate Invoice HTML` and `Send Invoice Email`.  

6. **Connect all nodes in sequence:**  
   - `Stripe Payment Webhook` → `Normalize Payment Data` → `Generate Invoice HTML` → (HTML to PDF) → `Send Invoice Email`.  

7. **Finalize:**  
   - Test the webhook by triggering a Stripe payment event.  
   - Verify email delivery with attached PDF invoice.  
   - Adjust company branding in invoice HTML as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                     | Context or Link                                          |
|----------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------|
| 💰 **SETUP REQUIRED:** Stripe webhook setup is mandatory via Stripe Dashboard → Webhooks. Select event `payment_intent.succeeded`. | Workflow Setup Instructions Sticky Note                  |
| Gmail OAuth2 credential must be configured in n8n to send emails from your Gmail account.                                         | Workflow Setup Instructions Sticky Note                  |
| Customize your company name and invoice template style in the "Generate Invoice HTML" node for branding consistency.              | Workflow Setup Instructions Sticky Note                  |
| For converting HTML invoices to PDF, an additional node (e.g., HTML to PDF) is needed though not included in the current export. | Important for PDF attachment generation                   |
| Stripe payment amounts are handled in cents and converted to dollars in the code node for correct invoice display.                | Payment Data Normalization block                          |

---

**Disclaimer:**  
The text provided originates exclusively from an n8n automated workflow. This processing strictly adheres to content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.