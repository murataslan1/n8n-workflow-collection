Automate Review Requests via WhatsApp for Completed WooCommerce Orders with Rapiwa

https://n8nworkflows.xyz/workflows/automate-review-requests-via-whatsapp-for-completed-woocommerce-orders-with-rapiwa-9969


# Automate Review Requests via WhatsApp for Completed WooCommerce Orders with Rapiwa

### 1. Workflow Overview

This workflow automates sending WhatsApp review requests to customers whose WooCommerce orders have been marked as "completed." It listens to WooCommerce order update events, filters for completed orders, verifies customer phone numbers for WhatsApp registration via the Rapiwa API, sends templated WhatsApp messages to verified numbers, and logs all attempts into Google Sheets for record-keeping. The workflow operates in batches to manage throughput and avoid hitting API rate limits.

**Logical Blocks:**

- **1.1 WooCommerce Order Reception and Filtering**  
  Receive order update events from WooCommerce, filter for completed orders, and normalize order data.

- **1.2 Batch Processing and Phone Number Normalization**  
  Process orders in batches, clean and standardize customer phone numbers.

- **1.3 WhatsApp Number Verification**  
  Verify if customer phone numbers are registered on WhatsApp using Rapiwa API.

- **1.4 Conditional Messaging and Logging**  
  Branch workflow based on WhatsApp verification results: send messages to verified numbers or log unverified numbers; record all outcomes in Google Sheets.

- **1.5 Loop Control and Throttling**  
  Wait and loop over remaining batches to control message sending rate.

---

### 2. Block-by-Block Analysis

#### 2.1 WooCommerce Order Reception and Filtering

- **Overview:**  
  Triggered by WooCommerce order updates, this block filters only orders with status "completed" and maps relevant customer and product data into a structured format.

- **Nodes Involved:**  
  - WooCommerce Trigger  
  - Order Completed check (Code)

- **Node Details:**

  - **WooCommerce Trigger**  
    - *Type:* WooCommerce Trigger  
    - *Role:* Listens for WooCommerce order update events (`order.updated`).  
    - *Configuration:* Uses WooCommerce API credentials; listens specifically for `order.updated` events.  
    - *Input/Output:* No input; outputs raw WooCommerce order data.  
    - *Edge Cases:* Network failures; webhook misconfiguration; incomplete payloads.  
    - *Credentials:* WooCommerce API credential configured.

  - **Order Completed check**  
    - *Type:* Code (JavaScript)  
    - *Role:* Filters only orders with status `"completed"`, extracts and normalizes customer and product info into a compact JSON structure `{ data: { customer, products, invoice_link } }`.  
    - *Configuration:*  
      - Filters input array for orders where `json.body.status === "completed"`.  
      - Extracts billing info, line items, product metadata (like size), and payment URL.  
    - *Expressions/Variables:* Uses `json.body` and maps nested fields.  
    - *Input:* Output from WooCommerce Trigger.  
    - *Output:* Array of normalized order objects with customer and products data.  
    - *Edge Cases:* Orders without billing info or missing product metadata; empty or malformed line items.

---

#### 2.2 Batch Processing and Phone Number Normalization

- **Overview:**  
  Processes the filtered orders in batches to control flow and avoid rate limits; cleans customer phone numbers by stripping all non-digit characters.

- **Nodes Involved:**  
  - Loop Over Items (SplitInBatches)  
  - Clean WhatsApp Number (Code)

- **Node Details:**

  - **Loop Over Items**  
    - *Type:* SplitInBatches  
    - *Role:* Splits the input array into batches (default batch size unspecified but configurable) to process items incrementally.  
    - *Input:* Normalized order list from "Order Completed check".  
    - *Output:* One batch of order items per execution cycle.  
    - *Edge Cases:* Empty input arrays; batch size misconfiguration causing empty batches.

  - **Clean WhatsApp Number**  
    - *Type:* Code (JavaScript)  
    - *Role:* For each order in batch, ensures the phone number exists and removes all non-numeric characters, producing a clean string suitable for API calls.  
    - *Configuration:* Uses regex `\D` to strip non-digits from the `number` field.  
    - *Input:* Batch of orders with raw phone numbers.  
    - *Output:* Batch with cleaned `number` fields replaced.  
    - *Edge Cases:* Missing or null phone numbers; phone numbers with unexpected formats.

---

#### 2.3 WhatsApp Number Verification

- **Overview:**  
  Verifies if cleaned phone numbers are registered on WhatsApp via the Rapiwa API.

- **Nodes Involved:**  
  - Check valid whatsapp number Using Rapiwa (HTTP Request)  
  - If (conditional branching)

- **Node Details:**

  - **Check valid whatsapp number Using Rapiwa**  
    - *Type:* HTTP Request  
    - *Role:* Sends POST request to Rapiwa API endpoint `/api/verify-whatsapp` with the cleaned phone number to check WhatsApp registration.  
    - *Configuration:*  
      - URL: `https://app.rapiwa.com/api/verify-whatsapp` (set as expression)  
      - Method: POST  
      - Body: JSON `{ "number": <cleaned phone number> }`  
      - Authentication: HTTP Bearer token (credential named `Rapiwa Bearer YOUR_TOKEN_HERE`)  
    - *Input:* Orders with cleaned phone numbers.  
    - *Output:* JSON response indicating if number exists on WhatsApp (field `data.exists`).  
    - *Edge Cases:* API authentication failures; network timeouts; unexpected API responses; rate limiting.

  - **If**  
    - *Type:* If  
    - *Role:* Branches flow based on verification response: if `data.exists === "true"`, proceed to message sending; else, mark as unverified.  
    - *Configuration:*  
      - Condition checks if `$json.data.exists` equals string `"true"` (case sensitive).  
      - True branch: Send WhatsApp message.  
      - False branch: Log unverified number.  
    - *Input:* Verification response from Rapiwa.  
    - *Output:* Two branches: message sending or logging unverified.  
    - *Edge Cases:* Boolean vs string mismatch in `data.exists`; expression evaluation errors.

---

#### 2.4 Conditional Messaging and Logging

- **Overview:**  
  For verified numbers, sends templated WhatsApp review request messages via Rapiwa API and logs the successful sends in Google Sheets. For unverified numbers, logs them separately. Both paths append appropriate data rows to Google Sheets.

- **Nodes Involved:**  
  - Send Message Using Rapiwa API (HTTP Request)  
  - Save State of Rows in Verified & Sent (Google Sheets)  
  - Save State of Rows in Unerified & Not sent (Google Sheets)

- **Node Details:**

  - **Send Message Using Rapiwa API**  
    - *Type:* HTTP Request  
    - *Role:* Sends a templated WhatsApp text message via Rapiwa API to verified phone numbers.  
    - *Configuration:*  
      - URL: `https://app.rapiwa.com/api/send-message`  
      - Method: POST  
      - Body parameters:  
        - `number`: cleaned phone number from data  
        - `message_type`: "text"  
        - `message`: Templated message including customer first/last name, product status, and a review request text (multi-line message with markdown-like formatting for emphasis).  
      - Authentication: HTTP Bearer token (same credential as verification).  
    - *Input:* Verified numbers from If node.  
    - *Output:* Response from message sending endpoint.  
    - *Edge Cases:* API failures, message formatting issues, authentication errors.

  - **Save State of Rows in Verified & Sent**  
    - *Type:* Google Sheets  
    - *Role:* Appends a row to a Google Sheet logging successfully sent messages with relevant customer and order details.  
    - *Configuration:*  
      - Operation: Append  
      - Mapped columns include customer name, email, cleaned number, status "sent", validity "verified", product ID, total price, invoice link, product title, delivery status.  
      - Document ID and Sheet GID configured with OAuth2 credentials.  
    - *Input:* After successful message send.  
    - *Output:* Appended row in Google Sheets.  
    - *Edge Cases:* Google Sheets API quota limits; invalid document ID or sheet name; OAuth token expiration.

  - **Save State of Rows in Unerified & Not sent**  
    - *Type:* Google Sheets  
    - *Role:* Appends a row to a separate Google Sheet logging numbers that failed WhatsApp verification and for which no message was sent.  
    - *Configuration:*  
      - Operation: Append  
      - Similar column mappings as above but with status "not sent" and validity "unverified".  
      - Uses same Google Sheet document and sheet as verified log but differentiated by "validity" and "status" fields.  
    - *Input:* From "If" node false branch (unverified numbers).  
    - *Output:* Appended row in Google Sheets.  
    - *Edge Cases:* Same as verified logging node.

---

#### 2.5 Loop Control and Throttling

- **Overview:**  
  Adds a delay after processing each batch and loops back to process the next batch, controlling throughput and avoiding rapid-fire requests.

- **Nodes Involved:**  
  - Wait  
  - Loop Over Items (SplitInBatches) [loop-back]

- **Node Details:**

  - **Wait**  
    - *Type:* Wait  
    - *Role:* Delays workflow execution for a set amount of time (default unspecified) to pace batch processing.  
    - *Configuration:* No parameters specified (defaults apply unless configured).  
    - *Input:* After logging nodes (verified or unverified).  
    - *Output:* Feeds back to Loop Over Items node to continue with next batch.  
    - *Edge Cases:* Long waits may cause workflow timeouts; no wait configured could cause API rate limit errors.

  - **Loop Over Items** (loop-back)  
    - Continues processing remaining batches from filtered orders.

---

### 3. Summary Table

| Node Name                          | Node Type           | Functional Role                                     | Input Node(s)               | Output Node(s)                          | Sticky Note                                                                                                                  |
|-----------------------------------|---------------------|----------------------------------------------------|-----------------------------|----------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| WooCommerce Trigger               | WooCommerce Trigger | Receives WooCommerce order update events           | (Trigger)                   | Order Completed check                   | ## WooCommerce Trigger - Purpose: Receives incoming HTTP POST payloads from WooCommerce Trigger                               |
| Order Completed check            | Code                | Filters completed orders and normalizes data        | WooCommerce Trigger          | Loop Over Items                        | ## Order Completed check (Code) - Purpose: Filter events and normalize payload into a compact `data` object                   |
| Loop Over Items                  | SplitInBatches      | Processes orders in batches                           | Order Completed check        | Clean WhatsApp Number                   | - Controls throughput and avoids rate limits                                                                                  |
| Clean WhatsApp Number            | Code                | Cleans phone numbers by stripping non-digits        | Loop Over Items              | Check valid whatsapp number Using Rapiwa | ## Clean WhatsApp Number (Code) - Purpose: Ensure the `number` field exists and strip all non-digit characters                |
| Check valid whatsapp number Using Rapiwa | HTTP Request        | Verifies WhatsApp registration of phone numbers     | Clean WhatsApp Number        | If                                    | ## Check valid whatsapp number Using Rapiwa - Verify phone number via POST https://app.rapiwa.com/api/verify-whatsapp         |
| If                              | If                  | Branches flow based on WhatsApp verification         | Check valid whatsapp number  | Send Message Using Rapiwa API / Save State of Rows in Unerified & Not sent | ## If - Branches flow depending on Rapiwa verification                                                                        |
| Send Message Using Rapiwa API   | HTTP Request        | Sends templated WhatsApp messages to verified numbers | If (true branch)             | Save State of Rows in Verified & Sent | ## Send Message Using Rapiwa - Sends WhatsApp message via API                                                                   |
| Save State of Rows in Verified & Sent | Google Sheets       | Logs successful message sends                         | Send Message Using Rapiwa API| Wait                                  | ## Save State of Rows in Verified & Sent - Append successful sends to Google Sheets                                            |
| Save State of Rows in Unerified & Not sent | Google Sheets       | Logs unverified numbers and failed sends             | If (false branch)            | Wait                                  | ## Save State of Rows in Unerified & Not sent - Append unverified numbers to Google Sheets                                      |
| Wait                            | Wait                | Delays processing between batches                     | Save State of Rows in Verified & Sent / Save State of Rows in Unerified & Not sent | Loop Over Items                        | - Controls message sending rate and avoids API rate limits                                                                     |
| Sticky Note                     | Sticky Note         | Documentation and overview                            |                             |                                        | See section 5 for detailed notes                                                                                                |
| Sticky Note1                    | Sticky Note         | Describes WooCommerce Trigger and Order Completed check nodes |                             |                                        |                                                                                                                              |
| Sticky Note3                    | Sticky Note         | Describes Clean WhatsApp Number and Rapiwa verification |                             |                                        |                                                                                                                              |
| Sticky Note4                    | Sticky Note         | Describes If branching, message sending, and Google Sheets logging |                             |                                        |                                                                                                                              |
| Sticky Note5                    | Sticky Note         | Summarizes the entire workflow steps                 |                             |                                        |                                                                                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create WooCommerce Trigger node**  
   - Type: WooCommerce Trigger  
   - Configure credentials with WooCommerce API access.  
   - Set event to `order.updated`.  
   - No input connections.

2. **Add Code node "Order Completed check"**  
   - Connect input from WooCommerce Trigger.  
   - Use JavaScript to filter orders where `json.body.status === "completed"`.  
   - Map order details into `{ data: { customer, products, invoice_link } }` as per the original code.  
   - Output filtered and normalized orders array.

3. **Add SplitInBatches node "Loop Over Items"**  
   - Connect input from "Order Completed check".  
   - Configure batch size as needed (default if unsure).  
   - Output batches of normalized orders.

4. **Add Code node "Clean WhatsApp Number"**  
   - Connect input from "Loop Over Items".  
   - Use JavaScript to clean the phone number: remove all non-digit characters from `json.data.customer.phone` and save in `json.number`.  
   - Output batch with cleaned numbers.

5. **Add HTTP Request node "Check valid whatsapp number Using Rapiwa"**  
   - Connect input from "Clean WhatsApp Number".  
   - Configure:  
     - Method: POST  
     - URL: `https://app.rapiwa.com/api/verify-whatsapp` (expression format to include dynamic number)  
     - Body (JSON): `{ "number": {{$json.data.customer.phone}} }`  
     - Authentication: HTTP Bearer with Rapiwa API token credential (`Rapiwa Bearer YOUR_TOKEN_HERE`).  
   - Output API verification response.

6. **Add If node "If" for verification result**  
   - Connect input from "Check valid whatsapp number Using Rapiwa".  
   - Condition: `$json.data.exists === "true"` (string match, case-sensitive).  
   - Define two outputs: True and False branches.

7. **On True branch, add HTTP Request node "Send Message Using Rapiwa API"**  
   - Connect from If node True output.  
   - Configure:  
     - Method: POST  
     - URL: `https://app.rapiwa.com/api/send-message`  
     - Body parameters:  
       - `number`: `{{$json.data.number}}` (cleaned phone number)  
       - `message_type`: `"text"`  
       - `message`: Templated text message using customer first and last name and product status.  
     - Authentication: HTTP Bearer, same Rapiwa credential.  
   - Output response from message send.

8. **Add Google Sheets node "Save State of Rows in Verified & Sent"**  
   - Connect input from "Send Message Using Rapiwa API".  
   - Configure with Google Sheets OAuth2 credentials.  
   - Operation: Append row to a sheet with columns: name, email, number, status = "sent", validity = "verified", productId, totalPrice, invoiceLink, productTitle, delivery status.  
   - Specify Document ID and Sheet GID of your target Google Sheet.

9. **On False branch of If node, add Google Sheets node "Save State of Rows in Unerified & Not sent"**  
   - Connect from If node False output.  
   - Configure similarly as above but with status = "not sent" and validity = "unverified".  
   - Same Google Sheet document and sheet as above.

10. **Add Wait node "Wait"**  
    - Connect input from both Google Sheets nodes (verified and unverified).  
    - Configure desired wait time to throttle requests (e.g., a few seconds).  
    - Output connects back to "Loop Over Items" node to continue processing next batch.

11. **Add the necessary credentials:**  
    - WooCommerce API credential for trigger.  
    - Rapiwa API HTTP Bearer token credential.  
    - Google Sheets OAuth2 credential with write access.

12. **Create Google Sheet:**  
    - Create a Google Sheet with columns matching the mappings exactly:  
      `name`, `email`, `number`, `status`, `validity`, `productId`, `totalPrice`, `invoiceLink`, `productTitle`, `delivery status`.  
    - Use the Sheet's document ID and GID in the Google Sheets nodes.

13. **Test the workflow:**  
    - Start with a small batch size to avoid mass messaging.  
    - Verify phone numbers and message sending behavior.  
    - Monitor Google Sheets logs for successful and failed attempts.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                           |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Workflow listens to WooCommerce order update events (e.g., `order.updated`), filters completed orders, normalizes payloads, verifies WhatsApp numbers via Rapiwa, sends templated messages, and logs all attempts. Batch processing and throttling prevent API limits.                                                                                                                                                                                                               | Workflow Overview (Sticky Note)                                                                           |
| Rapiwa API requires HTTP Bearer token authentication. Use credential named `Rapiwa Bearer YOUR_TOKEN_HERE` in n8n.                                                                                                                                                                                                                                                                                                                                                              | Rapiwa API Authentication                                                                                  |
| Google Sheets OAuth2 credential must have write access to the target spreadsheet. Ensure column names exactly match those in mappings, including case and spaces (e.g., `delivery status`).                                                                                                                                                                                                                                                                                         | Google Sheets Setup                                                                                        |
| Message template example:  
Hi *{first_name} {last_name}*,  
Your order is currently: *{product.status}*  
Your order has been successfully delivered!  
We’d love to hear your thoughts. Please take a moment to leave a review — your feedback helps us grow and improve!  
Thanks for shopping with *SpaGreen Creative*!  
Let us know if you need anything.                                                                                                                                                | WhatsApp Message Template                                                                                  |
| Expression caution: The `If` node compares `{{$json.data.exists}}` to string `"true"`. If Rapiwa returns a boolean, consider normalizing in a Code node before this check to avoid mismatches.                                                                                                                                                                                                                                                                                      | Expression Handling                                                                                         |
| Google Sheet sample template available here: [Sample Google Sheet](https://docs.google.com/spreadsheets/d/1vxocktoY-y-PYBZNxmUDuQv02b5F8QKhbQ0yLHjwjBY/edit?usp=sharing)                                                                                                                                                                                                                                                                                                         | Google Sheet Sample                                                                                        |
| Useful Rapiwa Links:  
- Dashboard: https://app.rapiwa.com/login  
- Official Website: https://rapiwa.com  
- Documentation: https://docs.rapiwa.com                                                                                                                                                                                                                                            | Official Rapiwa Resources                                                                                   |
| Support Channels:  
- WhatsApp Chat: https://wa.me/8801322827799  
- Discord: https://discord.gg/SsCChWEP  
- Facebook Group: https://www.facebook.com/groups/spagreenbd  
- Website: https://spagreen.net  
- Developer Portfolio: https://codecanyon.net/user/spagreen/portfolio                                                                                                                                                                        | Support and Help Links                                                                                      |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, respecting all applicable content policies. It contains no illegal, offensive, or protected material. All data processed is legal and public.