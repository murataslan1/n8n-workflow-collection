Automate E-commerce Order Processing with Email Notifications & Webhooks

https://n8nworkflows.xyz/workflows/automate-e-commerce-order-processing-with-email-notifications---webhooks-7518


# Automate E-commerce Order Processing with Email Notifications & Webhooks

### 1. Workflow Overview

This workflow automates the process of handling new e-commerce orders by integrating order data reception, validation, email notifications, logging, and response confirmation. It targets small online stores or beginners who want a simple, free, and efficient system to confirm orders to customers, notify their internal team, and keep logs for record-keeping without requiring paid APIs.

The workflow is logically structured into six main blocks:

- **1.1 Input Reception:** Receives new order data via a webhook.
- **1.2 Order Data Extraction:** Parses and assigns key order details.
- **1.3 Validation:** Checks essential order fields for correctness.
- **1.4 Customer Notification:** Sends order confirmation email to the customer.
- **1.5 Team Notification & Logging:** Notifies the internal team and logs order processing details.
- **1.6 Final Response:** Sends a success or error response back to the e-commerce platform.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Receives incoming new order data from an e-commerce platform via an HTTP POST webhook and initiates the workflow.

**Nodes Involved:**  
- New Order Webhook  
- Workflow Instructions (Sticky Note)

**Node Details:**  

- **New Order Webhook**  
  - Type: Webhook node  
  - Role: Entry point for incoming order data via HTTP POST at path `/new-order`.  
  - Config: `httpMethod` set to POST, response mode set to `responseNode` meaning response is sent later by a dedicated node.  
  - Input: External HTTP POST requests from e-commerce platforms.  
  - Output: JSON payload containing raw order data.  
  - Edge cases: Possible failure if webhook path changes or request format is unexpected. Must handle invalid/malformed JSON gracefully.

- **Workflow Instructions (Sticky Note)**  
  - Role: Provides a high-level textual description and setup instructions for users.  
  - Content explains workflow purpose, steps, and prerequisites.  
  - No technical configuration.

---

#### 1.2 Order Data Extraction

**Overview:**  
Extracts key order details from the raw webhook data and sets standardized variables for downstream use.

**Nodes Involved:**  
- Store Configuration  
- Extract Order Note (Sticky Note)  
- Extract Order Details

**Node Details:**  

- **Store Configuration**  
  - Type: Set node  
  - Role: Defines static store-related configuration variables such as store name, support email, team email, phone, and website URL.  
  - Key variables include `STORE_NAME`, `STORE_EMAIL`, `SUPPORT_EMAIL`, `STORE_PHONE`, `STORE_WEBSITE`, `TEAM_EMAIL`.  
  - Input: Data from webhook node.  
  - Output: Adds store config data to JSON object for access in later nodes.  
  - Edge cases: Misconfiguration here leads to incorrect emails or missing contact info.

- **Extract Order Note (Sticky Note)**  
  - Role: Describes that order data is extracted including order number, customer info, items, totals, and shipping address.  
  - No processing function.

- **Extract Order Details**  
  - Type: Set node  
  - Role: Uses expressions to safely extract and standardize key order fields from various possible JSON structures, supporting multiple e-commerce platforms.  
  - Fields extracted:  
    - `order_number`: Attempts `$json.order_number`, `$json.id`, `$json.order_id`, defaults to `'N/A'`  
    - `customer_name`: Tries `$json.customer.name`, `$json.billing_address.name`, `$json.customer_name`, defaults `'Valued Customer'`  
    - `customer_email`: Tries `$json.customer.email`, `$json.email`, `$json.customer_email`, defaults empty string  
    - `order_total`, `currency`, `order_date`, `payment_status` similarly extracted with fallbacks.  
  - Input: Output from Store Configuration node.  
  - Output: JSON with clean, uniform order fields.  
  - Edge cases: Missing critical fields default to safe values; customer email may be empty, which triggers validation failure downstream.

---

#### 1.3 Validation

**Overview:**  
Validates that the order contains essential data: a valid non-empty customer email and a valid order number that is not 'N/A'. Branches workflow based on validation result.

**Nodes Involved:**  
- Validation Note (Sticky Note)  
- Validate Order Data  
- Send Error Response

**Node Details:**  

- **Validation Note (Sticky Note)**  
  - Explains validation step criteria and consequence of skipping invalid orders.

- **Validate Order Data**  
  - Type: If node  
  - Role: Checks two conditions combined with AND:  
    - `customer_email` is not empty.  
    - `order_number` is not equal to `'N/A'`.  
  - Input: Extract Order Details node output.  
  - Output:  
    - True branch: Proceed to customer email sending.  
    - False branch: Send error response and terminate processing.  
  - Edge cases: If either condition fails, workflow sends error JSON and stops.

- **Send Error Response**  
  - Type: Respond to Webhook node  
  - Role: Sends JSON response with status "error" including missing field info, original received data, and timestamp.  
  - Input: False branch from Validate Order Data node.  
  - Output: HTTP response to webhook caller indicating failed processing.  
  - Edge cases: Ensure response format is correct; large original payload could be truncated or cause performance issues.

---

#### 1.4 Customer Notification

**Overview:**  
Sends a professional order confirmation email to the customer with order details, next steps, and contact info.

**Nodes Involved:**  
- Customer Email Note (Sticky Note)  
- Send Customer Confirmation

**Node Details:**  

- **Customer Email Note (Sticky Note)**  
  - Describes the purpose and contents of the customer confirmation email.

- **Send Customer Confirmation**  
  - Type: Email Send node  
  - Role: Sends order confirmation email to customer's email address using SMTP credentials.  
  - Email content uses expressions to personalize: customer name, order number, date, total, payment status, store contact info.  
  - Email subject includes order number and store name.  
  - From email and SMTP credentials configured via Store Configuration values and credential named "Gmail SMTP" (placeholder ID).  
  - Input: True branch from Validate Order Data.  
  - Output: Passes confirmed order data forward for next steps.  
  - Edge cases:  
    - SMTP failures may cause email not sent.  
    - Empty or invalid customer email filtered out by validation.  
    - Template expressions must resolve correctly; otherwise, email content may be malformed.

---

#### 1.5 Team Notification & Logging

**Overview:**  
Notifies the internal team via email about the new order and logs order processing details such as timestamps and email sent status.

**Nodes Involved:**  
- Team Notification Note (Sticky Note)  
- Send Team Notification  
- Log Order Note (Sticky Note)  
- Log Processing Details

**Node Details:**  

- **Team Notification Note (Sticky Note)**  
  - Explains the team notification email includes order info, action items, and quick stats.

- **Send Team Notification**  
  - Type: Email Send node  
  - Role: Sends detailed order notification to team email configured in Store Configuration.  
  - Includes order number, customer info, payment status, date, and suggested action items.  
  - Subject line reflects new order number and total.  
  - Uses same SMTP credentials as customer email.  
  - Input: Output from Send Customer Confirmation node.  
  - Output: Passes to logging node.  
  - Edge cases: SMTP issues may block notification; ensure team email configured correctly.

- **Log Order Note (Sticky Note)**  
  - Describes the logging step purpose: record keeping for analytics and troubleshooting.

- **Log Processing Details**  
  - Type: Set node  
  - Role: Adds properties documenting processing status, timestamps, email sent flags, and summary string.  
  - Fields:  
    - `processing_status`: `"completed"`  
    - `processed_at`: ISO timestamp of processing  
    - `customer_email_sent`: true  
    - `team_email_sent`: true  
    - `order_summary`: formatted string summarizing order and customer  
  - Input: Output from Send Team Notification node.  
  - Output: JSON with logging info passed to final response node.  
  - Edge cases: Missing or incorrect data here affects response accuracy.

---

#### 1.6 Final Response

**Overview:**  
Responds back to the e-commerce platform confirming successful order processing including email sent status and order summary.

**Nodes Involved:**  
- Success Response Note (Sticky Note)  
- Send Success Response

**Node Details:**  

- **Success Response Note (Sticky Note)**  
  - Summarizes the purpose of this step: final confirmation back to the webhook caller.

- **Send Success Response**  
  - Type: Respond to Webhook node  
  - Role: Sends JSON response with status `"success"` including order number, customer email, confirmation that customer and team emails were sent, timestamp, and order total with currency.  
  - Input: Output from Log Processing Details node.  
  - Output: HTTP response to webhook caller.  
  - Edge cases: Ensure correct JSON formatting; expression evaluation must not fail.

---

### 3. Summary Table

| Node Name               | Node Type             | Functional Role                             | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                                                      |
|-------------------------|-----------------------|---------------------------------------------|-------------------------------|-------------------------------|-------------------------------------------------------------------------------------------------|
| New Order Webhook        | Webhook               | Entry point, receives new order data        | None                          | Store Configuration            |                                                                                                |
| Workflow Instructions    | Sticky Note           | Describes workflow purpose and setup        | None                          | None                          | Explains steps, use cases, setup needs, no paid APIs required                                   |
| Store Configuration      | Set                   | Defines store static config variables        | New Order Webhook             | Extract Order Details          |                                                                                                |
| Extract Order Note       | Sticky Note           | Explains data extraction step                 | None                          | None                          | Describes extraction of order details from payload                                              |
| Extract Order Details    | Set                   | Normalizes and extracts key order data       | Store Configuration           | Validate Order Data            |                                                                                                |
| Validation Note          | Sticky Note           | Explains order data validation logic         | None                          | None                          | Describes validation criteria and error handling                                                |
| Validate Order Data      | If                    | Checks for valid email and order number      | Extract Order Details          | Send Customer Confirmation, Send Error Response |                                                                                                |
| Send Error Response      | Respond to Webhook     | Sends error response for invalid orders      | Validate Order Data            | None                          |                                                                                                |
| Customer Email Note      | Sticky Note           | Describes customer email content and purpose| None                          | None                          |                                                                                                |
| Send Customer Confirmation| Email Send            | Sends order confirmation email to customer  | Validate Order Data (true branch) | Send Team Notification        |                                                                                                |
| Team Notification Note   | Sticky Note           | Describes team notification email            | None                          | None                          |                                                                                                |
| Send Team Notification   | Email Send            | Sends order notification email to team       | Send Customer Confirmation    | Log Processing Details         |                                                                                                |
| Log Order Note           | Sticky Note           | Explains purpose of order logging             | None                          | None                          |                                                                                                |
| Log Processing Details   | Set                   | Logs processing status, timestamps, summaries| Send Team Notification        | Send Success Response          |                                                                                                |
| Success Response Note    | Sticky Note           | Describes success response to webhook caller | None                          | None                          |                                                                                                |
| Send Success Response    | Respond to Webhook     | Sends success confirmation JSON response     | Log Processing Details         | None                          |                                                                                                |
| Easy Setup Guide         | Sticky Note           | Provides setup instructions for users        | None                          | None                          | Includes detailed stepwise setup for store config, email, webhook, and testing                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Name: `New Order Webhook`  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `new-order`  
   - Response Mode: Set to `Response Node` (response sent later)  

2. **Add Store Configuration Node**  
   - Type: Set  
   - Name: `Store Configuration`  
   - Add string fields:  
     - `STORE_NAME` = `"Your Store Name"`  
     - `STORE_EMAIL` = `"orders@yourstore.com"`  
     - `SUPPORT_EMAIL` = `"support@yourstore.com"`  
     - `STORE_PHONE` = `"(555) 123-4567"`  
     - `STORE_WEBSITE` = `"https://yourstore.com"`  
     - `TEAM_EMAIL` = `"team@yourstore.com"`  
   - Connect `New Order Webhook` output to this node's input.

3. **Create Extract Order Details Node**  
   - Type: Set  
   - Name: `Extract Order Details`  
   - Add string fields with expressions:  
     - `order_number` = `={{ $json.order_number || $json.id || $json.order_id || 'N/A' }}`  
     - `customer_name` = `={{ $json.customer?.name || $json.billing_address?.name || $json.customer_name || 'Valued Customer' }}`  
     - `customer_email` = `={{ $json.customer?.email || $json.email || $json.customer_email || '' }}`  
     - `order_total` = `={{ $json.total_price || $json.total || $json.amount || '0.00' }}`  
     - `currency` = `={{ $json.currency || $json.currency_code || 'USD' }}`  
     - `order_date` = `={{ $json.created_at || $json.order_date || new Date().toISOString() }}`  
     - `payment_status` = `={{ $json.payment_status || $json.financial_status || 'pending' }}`  
   - Connect `Store Configuration` output to this node.

4. **Add Validate Order Data Node**  
   - Type: If  
   - Name: `Validate Order Data`  
   - Conditions (AND):  
     - `customer_email` is not empty (string not empty)  
     - `order_number` is not equal to `'N/A'`  
   - Connect `Extract Order Details` output to this node.

5. **Create Send Error Response Node**  
   - Type: Respond to Webhook  
   - Name: `Send Error Response`  
   - Response Mode: JSON  
   - Response Body:  
   ```json
   {
     "status": "error",
     "message": "Invalid order data - missing required fields",
     "missing_fields": {
       "customer_email": "{{ $json.customer_email || 'missing' }}",
       "order_number": "{{ $json.order_number || 'missing' }}"
     },
     "received_data": {{ JSON.stringify($('New Order Webhook').first().json) }},
     "processed_at": "{{ new Date().toISOString() }}"
   }
   ```  
   - Connect the **False** output of `Validate Order Data` to this node.

6. **Create Send Customer Confirmation Node**  
   - Type: Email Send  
   - Name: `Send Customer Confirmation`  
   - Set:  
     - To Email: `={{ $json.customer_email }}`  
     - From Email: `={{ $('Store Configuration').first().json.STORE_EMAIL }}`  
     - Subject: `Order Confirmation #{{ $json.order_number }} - {{ $('Store Configuration').first().json.STORE_NAME }}`  
     - Message: Use the provided templated text including order details, support contacts, and next steps.  
   - Credentials: Configure SMTP credentials (e.g., Gmail SMTP) in n8n and assign here.  
   - Connect **True** output of `Validate Order Data` to this node.

7. **Create Send Team Notification Node**  
   - Type: Email Send  
   - Name: `Send Team Notification`  
   - To Email: `={{ $('Store Configuration').first().json.TEAM_EMAIL }}`  
   - From Email: `={{ $('Store Configuration').first().json.STORE_EMAIL }}`  
   - Subject: `🛒 NEW ORDER #{{ $json.order_number }} - {{ $json.currency }} {{ $json.order_total }}`  
   - Message: Use templated email content outlining order info, action items, and quick stats.  
   - Credentials: Use same SMTP credentials as customer email.  
   - Connect output of `Send Customer Confirmation` to this node.

8. **Create Log Processing Details Node**  
   - Type: Set  
   - Name: `Log Processing Details`  
   - Add fields:  
     - `processing_status` = `"completed"`  
     - `processed_at` = `={{ new Date().toISOString() }}`  
     - `customer_email_sent` = `true`  
     - `team_email_sent` = `true`  
     - `order_summary` = `"Order #{{ $('Extract Order Details').first().json.order_number }} for {{ $('Extract Order Details').first().json.customer_name }} ({{ $('Extract Order Details').first().json.currency }} {{ $('Extract Order Details').first().json.order_total }}) processed successfully"`  
   - Connect output of `Send Team Notification` to this node.

9. **Create Send Success Response Node**  
   - Type: Respond to Webhook  
   - Name: `Send Success Response`  
   - Response Mode: JSON  
   - Response Body:  
   ```json
   {
     "status": "success",
     "message": "Order processed successfully",
     "order_number": "{{ $('Extract Order Details').first().json.order_number }}",
     "customer_email": "{{ $('Extract Order Details').first().json.customer_email }}",
     "customer_notification_sent": {{ $json.customer_email_sent }},
     "team_notification_sent": {{ $json.team_email_sent }},
     "processed_at": "{{ $json.processed_at }}",
     "order_total": "{{ $('Extract Order Details').first().json.currency }} {{ $('Extract Order Details').first().json.order_total }}"
   }
   ```  
   - Connect output of `Log Processing Details` to this node.

10. **Optionally add Sticky Notes** for documentation at appropriate positions with content from the workflow for clarity and user guidance.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                   | Context or Link                                                                                  |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow uses only built-in n8n nodes and free Gmail SMTP credentials, making it accessible without paid services.                                                       | Workflow Instructions sticky note                                                              |
| Easy Setup Guide sticky note provides clear stepwise instructions for configuring store details, email credentials, webhook setup, and testing.                               | Included in workflow as a sticky note                                                          |
| SMTP email credentials must be configured in n8n beforehand; Gmail accounts may require app passwords or less secure app access enabled depending on Google policies.          | Credential setup context                                                                        |
| Webhook URL from `New Order Webhook` node must be added to the e-commerce platform’s webhook or API integration settings (Shopify, WooCommerce, etc.)                         | Setup guide sticky note                                                                        |
| The workflow handles multiple e-commerce platforms by using flexible JSON path expressions with fallback values ensuring compatibility and robustness in data extraction.     | Extract Order Details node description                                                         |
| Error handling ensures invalid orders do not proceed to email notifications, providing clear JSON error responses to the caller.                                              | Validate Order Data and Send Error Response nodes                                              |
| This automation is suitable for beginners and small stores to reduce manual work in order confirmation and team notification.                                                | Tags: Beginner Friendly, E-commerce, Order Automation                                          |

---

**Disclaimer:** The text provided is exclusively derived from an n8n automated workflow. It adheres strictly to content policies and contains no illegal, offensive, or protected material. All processed data is legal and public.