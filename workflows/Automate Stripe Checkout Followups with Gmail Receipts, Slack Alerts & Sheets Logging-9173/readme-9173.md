Automate Stripe Checkout Followups with Gmail Receipts, Slack Alerts & Sheets Logging

https://n8nworkflows.xyz/workflows/automate-stripe-checkout-followups-with-gmail-receipts--slack-alerts---sheets-logging-9173


# Automate Stripe Checkout Followups with Gmail Receipts, Slack Alerts & Sheets Logging

### 1. Workflow Overview

This workflow automates the post-purchase follow-up process for Stripe Checkout sessions by integrating Gmail, Slack, and Google Sheets. Upon completion of a Stripe checkout, it logs the transaction details, sends an internal Slack notification to the Sales team, waits for the corresponding invoice creation event, logs the invoice details, and finally emails a receipt with a downloadable PDF invoice to the customer.

Logical blocks:

- **1.1 Stripe Event Reception**: Capture Stripe webhook events for checkout completion and invoice creation.
- **1.2 Transaction Logging and Notification**: Log checkout transaction details to Google Sheets and notify internal users via Slack.
- **1.3 Invoice Logging**: Log invoice details from Stripe invoice creation events to Google Sheets.
- **1.4 Receipt Emailing**: After a short wait to ensure invoice data is available, lookup the invoice data in Google Sheets and email the customer a receipt with invoice PDF link.

---

### 2. Block-by-Block Analysis

#### 2.1 Stripe Event Reception

**Overview:**  
This block listens for Stripe events related to checkout sessions completed and invoices created, serving as entry points into the workflow.

**Nodes Involved:**  
- Checkout Completed (Stripe Trigger)  
- Invoice Created (Stripe Trigger)

**Node Details:**

- **Checkout Completed**  
  - Type: Stripe Trigger  
  - Purpose: Triggers workflow when a Stripe checkout session completes.  
  - Configuration: Listens specifically for `checkout.session.completed` event.  
  - Credentials: Uses Stripe API credential for authentication.  
  - Inputs: Webhook from Stripe.  
  - Outputs: Passes event data downstream to log transaction and notify.  
  - Edge Cases: Possible webhook failures, auth errors, or missing event data.

- **Invoice Created**  
  - Type: Stripe Trigger  
  - Purpose: Triggers workflow when a Stripe invoice is created.  
  - Configuration: Listens for `invoice.created` event.  
  - Credentials: Uses the same Stripe API credential.  
  - Inputs: Webhook from Stripe.  
  - Outputs: Passes invoice data downstream to log invoice.  
  - Edge Cases: Webhook delivery failures, event data shape changes.

#### 2.2 Transaction Logging and Notification

**Overview:**  
Upon checkout completion, this block logs the transaction details to Google Sheets, sends an internal Slack notification for sales awareness, and triggers a wait period for invoice data to be available.

**Nodes Involved:**  
- Log Transaction (Google Sheets)  
- Message to RevOps (Slack)  
- Wait for Invoice (Wait node)

**Node Details:**

- **Log Transaction**  
  - Type: Google Sheets (Append operation)  
  - Purpose: Appends checkout session customer and transaction details to a Google Sheets document for record-keeping.  
  - Configuration: Maps multiple fields such as customer name, email, country, creation date (formatted), currency, invoice ID, postal code, and formatted total amount.  
  - Key Expressions: Uses `$json.data.object` path from Stripe event data to extract information, with date formatting (`DateTime.fromSeconds`), currency formatting via `Intl.NumberFormat`.  
  - Inputs: Triggered by Checkout Completed event.  
  - Outputs: Passes data to Slack notification and Wait node.  
  - Credentials: Uses Google Sheets OAuth2 credentials.  
  - Edge Cases: Google API quota limits, invalid data shapes, formatting errors.

- **Message to RevOps**  
  - Type: Slack (Send message)  
  - Purpose: Sends a formatted notification message to the internal #revops Slack channel with order details and a direct link to Stripe payment.  
  - Configuration: Message uses expressions referencing the logged transaction data and Stripe payment intent. The Slack channel is selected by ID.  
  - Inputs: Receives data from Log Transaction node.  
  - Credentials: Slack OAuth2 credentials for posting.  
  - Edge Cases: Slack API rate limits, channel permission errors.

- **Wait for Invoice**  
  - Type: Wait node  
  - Purpose: Pauses the workflow to allow Stripe invoice creation event to arrive and be logged before attempting to email receipt.  
  - Configuration: Default wait parameters (duration not specified, likely short).  
  - Inputs: From Log Transaction node.  
  - Outputs: To Invoice Lookup node.  
  - Edge Cases: Timing issues if invoice event delayed or missing.

#### 2.3 Invoice Logging

**Overview:**  
This block listens for invoice creation events and logs invoice details in a dedicated Google Sheet for lookup during receipt emailing.

**Nodes Involved:**  
- Invoice Created (Stripe Trigger)  
- Log Invoice (Google Sheets)

**Node Details:**

- **Invoice Created**  
  - (Described above in Stripe Event Reception)

- **Log Invoice**  
  - Type: Google Sheets (Append operation)  
  - Purpose: Stores invoice details such as customer name, invoice ID, amount paid (formatted), and invoice PDF URL into a Google Sheet.  
  - Configuration: Maps Stripe invoice object fields with currency-formatted amounts.  
  - Inputs: Triggered by Invoice Created node.  
  - Credentials: Google Sheets OAuth2 credentials.  
  - Edge Cases: Google API limits, missing invoice data.

#### 2.4 Receipt Emailing

**Overview:**  
After waiting, this block looks up the logged invoice by invoice ID in Google Sheets and sends a personalized HTML receipt email to the customer with a link to download the invoice PDF.

**Nodes Involved:**  
- Lookup Invoice (Google Sheets)  
- Email Receipt (Gmail)

**Node Details:**

- **Lookup Invoice**  
  - Type: Google Sheets (Lookup operation)  
  - Purpose: Searches the invoice log sheet for the invoice record matching the invoice ID from checkout transaction.  
  - Configuration: Sets filter to match `invoice_id` column with the invoice ID from the JSON data.  
  - Inputs: From Wait for Invoice node.  
  - Outputs: To Email Receipt node.  
  - Credentials: Google Sheets OAuth2.  
  - Edge Cases: Invoice not found, multiple matches, data sync issues.

- **Email Receipt**  
  - Type: Gmail (Send email)  
  - Purpose: Sends a receipt email to the customer using the email and name from the logged transaction, including details and a link to the invoice PDF.  
  - Configuration: Uses HTML message template with dynamic placeholders for customer name, purchase date, country, postal code, amount, and invoice PDF URL. Subject is fixed "Your Demo Karma purchase."  
  - Inputs: Invoice data from Lookup Invoice node; references Log Transaction node data for customer info.  
  - Credentials: Gmail OAuth2 credentials.  
  - Edge Cases: Email sending failures, invalid email addresses, template rendering errors.

---

### 3. Summary Table

| Node Name        | Node Type           | Functional Role                      | Input Node(s)           | Output Node(s)             | Sticky Note                                                                                      |
|------------------|---------------------|------------------------------------|------------------------|----------------------------|------------------------------------------------------------------------------------------------|
| Invoice Created  | Stripe Trigger       | Listen for invoice.created event   | Webhook (external)     | Log Invoice                | ### Log the invoice  Receive the invoice created event from Stripe. This happens separately from the checkout event. Store the invoice details in a Google Sheet log where we can look them up. |
| Log Invoice      | Google Sheets        | Log invoice details                 | Invoice Created        |                            | ### Log the invoice  Receive the invoice created event from Stripe. This happens separately from the checkout event. Store the invoice details in a Google Sheet log where we can look them up. |
| Checkout Completed| Stripe Trigger      | Listen for checkout.session.completed event | Webhook (external)     | Log Transaction            |                                                                                                |
| Log Transaction  | Google Sheets        | Log checkout transaction details   | Checkout Completed     | Message to RevOps, Wait for Invoice | ### Log the checkout transaction  Receive the checkout transaction from Stripe and append the details to a log we are keeping in a Google Sheet. |
| Message to RevOps| Slack                | Notify internal Sales (#revops)    | Log Transaction        |                            | ### Notify internal users  The data from the Stripe checkout event is also used to send a notification to the #revops channel for the Sales team. |
| Wait for Invoice | Wait                 | Pause before invoice lookup        | Log Transaction        | Lookup Invoice             |                                                                                                |
| Lookup Invoice   | Google Sheets        | Lookup invoice details by invoice_id | Wait for Invoice       | Email Receipt              | ### Email a receipt  Wait a few seconds for the invoice to be received from Stripe and logged to the Sheet. Then look up the link to the PDF and email it out to the customer. |
| Email Receipt    | Gmail                | Email customer receipt             | Lookup Invoice         |                            | ### Email a receipt  Wait a few seconds for the invoice to be received from Stripe and logged to the Sheet. Then look up the link to the PDF and email it out to the customer. |
| Sticky Note      | Sticky Note          | Documentation / description        | -                      | -                          | ## Followup Stripe Checkouts with Gmail Receipts, Internal Slack, and Sheets Logs This n8n template demonstrates how to automate the followup when your customer completes a checkout in Stripe by emailing a receipt, logging the transaction, and sending an internal notification. |
| Sticky Note1     | Sticky Note          | Documentation / description        | -                      | -                          | ### Log the checkout transaction  Receive the checkout transaction from Stripe and append the details to a log we are keeping in a Google Sheet. |
| Sticky Note2     | Sticky Note          | Documentation / description        | -                      | -                          | ### Email a receipt  Wait a few seconds for the invoice to be received from Stripe and logged to the Sheet. Then look up the link to the PDF and email it out to the customer. |
| Sticky Note3     | Sticky Note          | Documentation / description        | -                      | -                          | ### Log the invoice  Receive the invoice created event from Stripe. This happens separately from the checkout event. Store the invoice details in a Google Sheet log where we can look them up. |
| Sticky Note4     | Sticky Note          | Documentation / description        | -                      | -                          | ### Notify internal users  The data from the Stripe checkout event is also used to send a notification to the #revops channel for the Sales team. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Stripe Trigger Node for Checkout Completed**  
   - Type: Stripe Trigger  
   - Set event to listen: `checkout.session.completed`  
   - Connect Stripe API credentials (test or live mode as required)  
   - Position: Left side of canvas, top

2. **Create Stripe Trigger Node for Invoice Created**  
   - Type: Stripe Trigger  
   - Set event to listen: `invoice.created`  
   - Use same Stripe credentials  
   - Position: Left side of canvas, below Checkout Completed

3. **Create Google Sheets Node: Log Transaction**  
   - Type: Google Sheets (Append operation)  
   - Connect Google Sheets OAuth2 credentials  
   - Set Document ID to your Google Sheet used for transaction logs  
   - Set Sheet name or GID to the transactions sheet  
   - Define columns with expressions:  
     - `name`: `{{$json.data.object.customer_details.name}}`  
     - `email`: `{{$json.data.object.customer_details.email}}`  
     - `country`: `{{$json.data.object.customer_details.address.country}}`  
     - `created`: `{{DateTime.fromSeconds($json.data.object.created).toFormat('yyyy-MM-dd HH:mm:ss')}}`  
     - `currency`: `{{$json.data.object.currency}}`  
     - `invoice_id`: `{{$json.data.object.invoice}}`  
     - `postal_code`: `{{$json.data.object.customer_details.address.postal_code}}`  
     - `amount_total`: `{{new Intl.NumberFormat("en-US", { style: "currency", currency: $json.data.object.currency}).format($json.data.object.amount_total/100)}}`  
   - Connect input from Checkout Completed node

4. **Create Slack Node: Message to RevOps**  
   - Type: Slack  
   - Connect Slack OAuth2 credentials  
   - Select channel by ID (e.g., #revops channel ID)  
   - Compose message text using expressions referencing Log Transaction data and Stripe payment intent:  
     `"={{ $json.amount_total }} - new order from {{ $json.name }} ( {{ $json.email }} ). Link to payment: <https://dashboard.stripe.com/acct_1SD3OCEhbbYR1XBf/test/payments/{{ $('Checkout Completed').item.json.data.object.payment_intent }}|{{ $('Checkout Completed').item.json.data.object.payment_intent }}>"`  
   - Connect input from Log Transaction node

5. **Create Wait Node: Wait for Invoice**  
   - Type: Wait  
   - Use default wait time (can be configured, e.g., 10-30 seconds)  
   - Connect input from Log Transaction node

6. **Create Google Sheets Node: Log Invoice**  
   - Type: Google Sheets (Append operation)  
   - Connect Google Sheets OAuth2 credentials  
   - Set Document ID to same Google Sheet or a dedicated one for invoices  
   - Set Sheet name or GID to invoices sheet  
   - Define columns with expressions:  
     - `customer`: `{{$json.data.object.customer_name}}`  
     - `invoice_id`: `{{$json.data.object.id}}`  
     - `amount_paid`: `{{new Intl.NumberFormat("en-US", { style: "currency", currency: $json.data.object.currency}).format($json.data.object.amount_paid/100)}}`  
     - `invoice_pdf`: `{{$json.data.object.invoice_pdf}}`  
   - Connect input from Invoice Created node

7. **Create Google Sheets Node: Lookup Invoice**  
   - Type: Google Sheets (Lookup operation)  
   - Connect Google Sheets OAuth2 credentials  
   - Set Document ID and Sheet name to invoices sheet  
   - Configure filter:  
     - Lookup column: `invoice_id`  
     - Lookup value: `{{$json.invoice_id}}` (from previous node data)  
   - Connect input from Wait for Invoice node

8. **Create Gmail Node: Email Receipt**  
   - Type: Gmail (Send email)  
   - Connect Gmail OAuth2 credentials  
   - Set recipient to: `{{$('Log Transaction').item.json.email}}`  
   - Set subject to: `"Your Demo Karma purchase"`  
   - Set HTML message body template with placeholders:  
   ```
   <html>
     <body style="font-family: Arial, sans-serif; color: #333;">
       <h2 style="color: #2c7be5;">Hello {{$('Log Transaction').item.json.name}}</h2>
       <p>
         Thank you for your purchase from Demo Karma.
         <br><br>
         <div style="margin-left: 40px;">
           <p>Date: {{$('Log Transaction').item.json.created}}</p>
           <p>Country: {{$('Log Transaction').item.json.country}}</p>
           <p>Postal Code: {{$('Log Transaction').item.json.postal_code}}</p>
           <p>Amount: {{$('Log Transaction').item.json.amount_total}}</p>
         </div>
         <br><br>
         Click here to <a href="{{$json.invoice_pdf}}" target="_blank">download your receipt</a>.
       </p>
       <p style="margin-top:20px;">Best regards,<br/>Demo Karma Team</p>
     </body>
   </html>
   ```  
   - Connect input from Lookup Invoice node

9. **Connect the Nodes in Order:**  
   - Checkout Completed → Log Transaction  
   - Log Transaction → Message to RevOps  
   - Log Transaction → Wait for Invoice  
   - Wait for Invoice → Lookup Invoice  
   - Lookup Invoice → Email Receipt  
   - Invoice Created → Log Invoice

10. **Test the Workflow:**  
    - Trigger a Stripe checkout session completed event and verify logs, Slack messages, wait, invoice logging, and email receipt sending.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                | Context or Link                                                                                                         |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| This workflow demonstrates integration of Stripe events with Gmail, Slack, and Google Sheets for automated transaction follow-up.                                         | Internal project documentation                                                                                          |
| Stripe Checkout session completed events and invoice created events are handled separately and synchronized via a wait period for data consistency before emailing receipts. | Important architectural note                                                                                             |
| Google Sheets document must have sheets named or identified for `transactions` and `invoices` with columns matching the fields used in the workflow.                       | Google Sheets setup requirement                                                                                         |
| Slack channel ID must be for an existing channel where the bot/user has permission to post messages.                                                                        | Slack API permission note                                                                                               |
| Gmail OAuth2 credentials require proper scopes for sending emails.                                                                                                          | Gmail API setup note                                                                                                    |
| Date and currency formatting use JavaScript expressions inside n8n for consistent representation.                                                                          | Localization/formatting reminder                                                                                         |

---

**Disclaimer:**  
The provided content originates exclusively from an automated workflow created using n8n, an integration and automation tool. All processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.