Auto-Send WooCommerce Invoices via WhatsApp with Rapiwa API

https://n8nworkflows.xyz/workflows/auto-send-woocommerce-invoices-via-whatsapp-with-rapiwa-api-9879


# Auto-Send WooCommerce Invoices via WhatsApp with Rapiwa API

### 1. Workflow Overview

This workflow automates sending WooCommerce order invoices via WhatsApp by leveraging the Rapiwa API for WhatsApp messaging and verification. It listens for new or updated WooCommerce orders, extracts and normalizes customer and order data, verifies the customer's WhatsApp number, sends a personalized invoice message to verified numbers, and logs all interactions in Google Sheets.

**Key Use Cases:**
- Automatically notify customers via WhatsApp with invoice details after order updates.
- Ensure messages are only sent to valid WhatsApp numbers.
- Maintain detailed logs of sent and unsent messages for record-keeping and auditing.

**Logical Blocks:**

- **1.1 Input Reception and Data Cleaning:**  
  Receives WooCommerce order update events, extracts relevant order and customer data, and normalizes it for further processing.

- **1.2 Batch Processing and Number Normalization:**  
  Processes orders in batches and cleans WhatsApp phone numbers to a standardized numeric format.

- **1.3 WhatsApp Number Verification:**  
  Uses Rapiwa API to verify if the cleaned phone number is registered on WhatsApp.

- **1.4 Conditional Messaging and Logging:**  
  Depending on verification result, sends WhatsApp invoice messages via Rapiwa API or logs unverified numbers to Google Sheets.

- **1.5 Logging and Controlled Looping:**  
  Appends results to appropriate Google Sheets tabs, then uses a wait node to throttle processing and loop back.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Data Cleaning

- **Overview:**  
  Triggered by WooCommerce order update events, this block extracts and reforms incoming order data to a consistent structure containing customer info, product details, and invoice link.

- **Nodes Involved:**  
  - WooCommerce Trigger  
  - Clean Webhooks Response Data

- **Node Details:**

  - **WooCommerce Trigger**  
    - Type: Trigger (WooCommerce)  
    - Role: Listens to `order.updated` events from WooCommerce.  
    - Configuration: Event set to `order.updated`; uses WooCommerce API credentials.  
    - Input: Incoming WooCommerce webhook payload.  
    - Output: Emits raw order data JSON.  
    - Edge Cases: Missing or malformed webhook data; credential/authentication failures.

  - **Clean Webhooks Response Data**  
    - Type: Code (JavaScript)  
    - Role: Normalizes order payload into a simplified JSON with `customer`, `products`, and `invoice_link`.  
    - Key logic: Extracts customer billing info, line items with product details including size (meta), prices, and image URLs.  
    - Input: WooCommerce Trigger output.  
    - Output: Emits structured JSON under `data`.  
    - Edge Cases: Missing fields (e.g., no phone number, missing product metadata); malformed input.

#### 1.2 Batch Processing and Number Normalization

- **Overview:**  
  Processes extracted orders in batches to control throughput and cleans customer WhatsApp phone numbers by removing non-digit characters.

- **Nodes Involved:**  
  - Loop Over Items  
  - Clean WhatsApp Number

- **Node Details:**

  - **Loop Over Items**  
    - Type: SplitInBatches  
    - Role: Splits the incoming array of orders into manageable batches for sequential processing.  
    - Configuration: Defaults (batch size unspecified, likely default 1).  
    - Input: Output from Clean Webhooks Response Data.  
    - Output: Individual order items for processing.  
    - Edge Cases: Large order arrays may require batch size tuning to avoid rate limits.

  - **Clean WhatsApp Number**  
    - Type: Code (JavaScript)  
    - Role: Normalizes phone numbers by forcing string type and stripping out all non-digit characters.  
    - Key logic: Uses regex replace to remove anything except digits.  
    - Input: Individual orders from Loop Over Items.  
    - Output: Orders with cleaned `number` field added.  
    - Edge Cases: Empty or malformed phone numbers; non-string types; missing number fields.

#### 1.3 WhatsApp Number Verification

- **Overview:**  
  Verifies that the cleaned phone number is registered on WhatsApp by calling the Rapiwa API.

- **Nodes Involved:**  
  - Check valid whatsapp number Using Rapiwa  
  - If

- **Node Details:**

  - **Check valid whatsapp number Using Rapiwa**  
    - Type: HTTP Request  
    - Role: POST request to `https://app.rapiwa.com/api/verify-whatsapp` with the phone number in body.  
    - Authentication: HTTP Bearer token via Rapiwa Bearer credential.  
    - Input: Cleaned phone number from previous node.  
    - Output: JSON response indicating if number exists on WhatsApp (`data.exists`).  
    - Edge Cases: Network issues; invalid token; API errors; unexpected response formats.

  - **If**  
    - Type: If Condition  
    - Role: Branches workflow based on Rapiwa verification result.  
    - Condition: `$json.data.exists` equals string `"true"`.  
    - Input: Output from verification node.  
    - Output: Two branches:  
      - True branch: continue to send message  
      - False branch: log as unverified  
    - Edge Cases: Missing or malformed verification response; string vs boolean mismatches.

#### 1.4 Conditional Messaging and Logging

- **Overview:**  
  Sends personalized WhatsApp invoice messages to verified numbers or logs unverified numbers. Logs all activities in Google Sheets for record-keeping.

- **Nodes Involved:**  
  - Send Message Using Rapiwa  
  - Append Rows in Sheet Verified & Sent  
  - Append Rows in Sheet Unverified & Not sent

- **Node Details:**

  - **Send Message Using Rapiwa**  
    - Type: HTTP Request  
    - Role: Sends a WhatsApp text message with order details and invoice link via Rapiwa API.  
    - Authentication: HTTP Bearer token (Rapiwa Bearer).  
    - Message Template: Uses dynamic expressions to personalize message with customer name, product details, address, invoice link, and product image URL.  
    - Input: Verified numbers branch from If node.  
    - Output: API response from message send request.  
    - Edge Cases: API rate limits; invalid message format; token expiration; failed sends.

  - **Append Rows in Sheet Verified & Sent**  
    - Type: Google Sheets  
    - Role: Appends a row with customer, product, and message send details indicating `status: sent` and `validity: verified`.  
    - Configuration: Uses OAuth2 credentials, appends to a specific Google Sheet tab.  
    - Input: Output from Send Message node.  
    - Output: Confirmation of row append operation.  
    - Edge Cases: Google Sheets API quota; malformed data; connectivity issues.

  - **Append Rows in Sheet Unverified & Not sent**  
    - Type: Google Sheets  
    - Role: Appends a row with customer and product data for numbers not verified on WhatsApp, marking `status: not sent` and `validity: unverified`.  
    - Input: False branch from If node.  
    - Output: Confirmation of append operation.  
    - Edge Cases: Same as above for Sheets.

#### 1.5 Logging and Controlled Looping

- **Overview:**  
  Adds a delay for throttling and loops back to the batch processor to continue processing subsequent orders.

- **Nodes Involved:**  
  - Wait  
  - Loop Over Items (loopback)

- **Node Details:**

  - **Wait**  
    - Type: Wait  
    - Role: Introduces a pause between processing batches to avoid rate limiting or API overload.  
    - Configuration: Default wait time (unspecified).  
    - Input: After Google Sheets append operations.  
    - Output: Triggers re-entry into Loop Over Items.  
    - Edge Cases: Long wait times can delay processing; short waits may cause API throttling.

  - **Loop Over Items** (re-entry)  
    - Role: Continues processing next batch of orders after wait.  
    - Input: Wait node output.  
    - Output: Next batch item processed through Clean WhatsApp Number and onward.

---

### 3. Summary Table

| Node Name                        | Node Type               | Functional Role                                | Input Node(s)                  | Output Node(s)                       | Sticky Note                                                                                                  |
|---------------------------------|-------------------------|------------------------------------------------|--------------------------------|------------------------------------|--------------------------------------------------------------------------------------------------------------|
| WooCommerce Trigger             | Trigger (WooCommerce)   | Entry point, listens for order updates        | —                              | Clean Webhooks Response Data       | ## 1. WooCommerce Trigger - Trigger event: `order.updated`. Entry point. Credentials required.               |
| Clean Webhooks Response Data    | Code                    | Normalize and extract customer and order data | WooCommerce Trigger            | Loop Over Items                    | ## 2. Clean Webhooks Response Data - Normalizes incoming payload.                                            |
| Loop Over Items                | SplitInBatches           | Batch processing of order items                | Clean Webhooks Response Data   | Clean WhatsApp Number (main branch) |                                                                                                              |
| Clean WhatsApp Number          | Code                    | Normalize WhatsApp phone number                 | Loop Over Items                | Check valid whatsapp number Using Rapiwa | ## 1. Clean WhatsApp Number - Removes non-digit chars for consistency.                                      |
| Check valid whatsapp number Using Rapiwa | HTTP Request            | Verify WhatsApp registration status via Rapiwa| Clean WhatsApp Number          | If                               | ## 2. Check valid whatsapp number Using Rapiwa - POST to verify WhatsApp number.                             |
| If                             | If Condition            | Branch based on verification response          | Check valid whatsapp number Using Rapiwa | Send Message Using Rapiwa (true), Append Rows in Sheet Unverified & Not sent (false) | ## If (Condition) - Branches workflow on verification result.                                               |
| Send Message Using Rapiwa      | HTTP Request            | Sends WhatsApp invoice message                  | If (true branch)               | Append Rows in Sheet Verified & Sent | ## Send Message Using Rapiwa - Sends personalized WhatsApp message.                                         |
| Append Rows in Sheet Verified & Sent | Google Sheets            | Log sent and verified messages                   | Send Message Using Rapiwa      | Wait                             | ## Append Rows in Sheet Verified & Sent - Logs sent messages with status and validity.                      |
| Append Rows in Sheet Unverified & Not sent | Google Sheets            | Log unverified, not sent numbers                 | If (false branch)              | Wait                             | ## Append Rows in Sheet Unverified & Not sent - Logs unverified numbers with status and validity.           |
| Wait                           | Wait                    | Throttle processing, delay before next batch   | Append Rows in Sheet Verified & Sent, Append Rows in Sheet Unverified & Not sent | Loop Over Items (loopback) | ## Wait - Delays processing cycles and re-enters batch loop.                                               |
| Sticky Note                    | Sticky Note             | Documentation and overview                      | —                              | —                                | See section 5 for full sticky note content.                                                                  |
| Sticky Note4                   | Sticky Note             | Details about If, Messaging, Logging, and Wait | —                              | —                                | See section 5                                                                                                |
| Sticky Note3                   | Sticky Note             | Details about Number cleaning and Verification  | —                              | —                                | See section 5                                                                                                |
| Sticky Note1                   | Sticky Note             | Details about WooCommerce Trigger and Data cleaning | —                              | —                                | See section 5                                                                                                |
| Sticky Note2                   | Sticky Note             | How to use and setup instructions               | —                              | —                                | See section 5                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create WooCommerce Trigger Node**  
   - Type: WooCommerce Trigger  
   - Event: `order.updated`  
   - Credentials: Add WooCommerce API credentials (e.g., "WooCommerce (get customer)")  
   - Purpose: Listen for order updates.

2. **Add Code Node: Clean Webhooks Response Data**  
   - Type: Code  
   - JavaScript code: Map incoming WooCommerce payload to `{ data: { customer, products, invoice_link } }` structure as per workflow code.  
   - Input: Connect from WooCommerce Trigger output.

3. **Add SplitInBatches Node: Loop Over Items**  
   - Purpose: Process each order item individually or in batches.  
   - Connect from Clean Webhooks Response Data output.

4. **Add Code Node: Clean WhatsApp Number**  
   - JavaScript code: Convert `number` field to string and remove all non-digit characters using regex.  
   - Connect from Loop Over Items output.

5. **Add HTTP Request Node: Check valid whatsapp number Using Rapiwa**  
   - HTTP Method: POST  
   - URL: `https://app.rapiwa.com/api/verify-whatsapp` (use expression to pass number)  
   - Body Parameters: JSON with `number` set to customer phone number (`{{$json.data.customer.phone}}`)  
   - Authentication: HTTP Bearer with Rapiwa API token (`Rapiwa Bearer YOUR_TOKEN_HERE`)  
   - Connect from Clean WhatsApp Number output.

6. **Add If Node**  
   - Condition: Check if `$json.data.exists` equals string `"true"`  
   - Connect from Check valid whatsapp number Using Rapiwa output.

7. **Add HTTP Request Node: Send Message Using Rapiwa** (True branch)  
   - HTTP Method: POST  
   - URL: `https://app.rapiwa.com/api/send-message`  
   - Body Parameters:  
     - `number`: from cleaned number  
     - `message_type`: `"text"`  
     - `message`: Use template with customer name, product details, invoice link, etc. (use expressions to access data)  
   - Authentication: HTTP Bearer with Rapiwa API token  
   - Connect from If true output.

8. **Add Google Sheets Node: Append Rows in Sheet Verified & Sent**  
   - Operation: Append  
   - Spreadsheet: Use your Google Sheet ID containing logging sheet  
   - Sheet Name/Tab: e.g., "Sheet1" or as configured  
   - Columns: Map customer and product fields, `status: sent`, `validity: verified`  
   - Credentials: Google Sheets OAuth2  
   - Connect from Send Message Using Rapiwa output.

9. **Add Google Sheets Node: Append Rows in Sheet Unverified & Not sent** (False branch)  
   - Same as above but with `status: not sent`, `validity: unverified`  
   - Connect from If false output.

10. **Add Wait Node**  
    - Purpose: Delay before processing next batch to avoid rate limiting.  
    - Connect from both Google Sheets append nodes' output.

11. **Connect Wait Node output back to Loop Over Items input**  
    - Creates a loop for batch processing.

12. **Add Sticky Notes for Documentation** (Optional)  
    - Include notes explaining workflow sections, setup instructions, and references.

13. **Configure Credentials:**  
    - Rapiwa API: HTTP Bearer token credential with your API key.  
    - Google Sheets OAuth2: OAuth2 credentials with access to your logging spreadsheet.  
    - WooCommerce API: Credentials with sufficient permissions to receive order webhooks.

14. **Set Default Values and Constraints:**  
    - Batch size in SplitInBatches can be tuned based on use case and API limits.  
    - Wait node delay can be adjusted to balance speed and throttling.  
    - Ensure message template placeholders match the data structure.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Context or Link                                                                                                                                                                                                       |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| # Send WooCommerce Invoices on WhatsApp Automatically Using Rapiwa API. Workflow listens for WooCommerce order updates, processes in batches, cleans phone numbers, verifies via Rapiwa, sends messages, and logs results. Supports throttling and detailed logging. | Overview sticky note inside workflow                                                                                                                                        |
| Sample Google Sheet with required columns is available here: [Sample Sheet](https://docs.google.com/spreadsheets/d/1NVYsvOg3mzsAGlzJiL7-2mtkN-5gsmqd3fG8hboE3vk/edit?usp=sharing)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Google Sheets template link                                                                                                                                                                                        |
| How to Use: Configure Rapiwa Bearer token, Google Sheets OAuth2, WooCommerce API credentials. Confirm Google Sheet column setup. Observe flow: webhook → mapping → batch → number cleaning → verify → conditional send or log → append → wait → loop.                                                                                                                                                                                                                                                                                                                                                                                                        | Usage instructions sticky note                                                                                                                                                                                     |
| Useful Links: - Dashboard: https://app.rapiwa.com/login - Official Website: https://rapiwa.com - Documentation: https://docs.rapiwa.com                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Official API and service links                                                                                                                                                                                     |
| Customization Suggestions: Replace WooCommerce trigger with Shopify webhook; customize message template; add customer filtering; add fallback channels like SMS/email; send admin summaries; enrich customer data externally.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Suggestions for workflow extensions and adaptations                                                                                                                                                               |

---

**Disclaimer:**  
The content provided is derived exclusively from an automated workflow created with n8n, adhering strictly to content policies and containing no illegal, offensive, or protected elements. All data processed is legal and publicly accessible.