Automate Shopify Abandoned Cart WhatsApp Reminders with Product Links via Rapiwa

https://n8nworkflows.xyz/workflows/automate-shopify-abandoned-cart-whatsapp-reminders-with-product-links-via-rapiwa-9031


# Automate Shopify Abandoned Cart WhatsApp Reminders with Product Links via Rapiwa

### 1. Workflow Overview

This workflow automates sending WhatsApp reminders to customers who have abandoned their shopping carts on a Shopify store. It fetches abandoned checkout data from Shopify, cleans and verifies customer phone numbers for WhatsApp validity using the Rapiwa API, sends personalized WhatsApp messages with product and discount details, and logs each interaction's status into Google Sheets for tracking. The workflow runs on a scheduled interval and processes each checkout individually to avoid rate limits or number bans.

Logical blocks:

- **1.1 Scheduled Trigger & Data Fetch**: Periodically triggers the workflow and fetches abandoned cart checkouts from Shopify.
- **1.2 Data Formatting & Iteration**: Formats the raw Shopify API response and splits the data to process each cart separately.
- **1.3 Phone Number Cleaning & Verification**: Cleans phone numbers to WhatsApp-compatible format and verifies their WhatsApp validity through Rapiwa.
- **1.4 Conditional Messaging & Logging**: Based on verification, either sends WhatsApp reminders via Rapiwa and logs as verified or logs as unverified without sending.
- **1.5 Post-Processing Wait**: Adds delay between message sends to prevent API abuse or number blocking.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Data Fetch

**Overview:**  
Automatically triggers the workflow on a recurring schedule and fetches the latest abandoned checkout data from Shopify using authenticated HTTP requests.

**Nodes Involved:**  
- Schedule Trigger  
- HTTP Request (Shopify API)

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow at regular intervals (e.g., every few hours).  
  - Configuration: Default interval configured (likely hourly or daily).  
  - Inputs: None (trigger node).  
  - Outputs: Triggers HTTP Request node.  
  - Edge Cases: Misconfiguration of schedule could cause missed or excessive runs.

- **HTTP Request (Shopify API)**  
  - Type: HTTP Request  
  - Role: Retrieves abandoned checkouts via Shopify API endpoint `/admin/api/2025-07/checkouts.json`.  
  - Configuration: Uses HTTP Header Authentication with Shopify private app credentials.  
  - Key Expressions: Static URL, no dynamic parameters.  
  - Inputs: Triggered by Schedule Trigger.  
  - Outputs: Raw JSON response to next node.  
  - Edge Cases: API rate limits, authentication failure, network errors, empty or malformed responses.

---

#### 1.2 Data Formatting & Iteration

**Overview:**  
Transforms Shopify's raw JSON checkout data into structured records and processes each checkout individually via batch splitting.

**Nodes Involved:**  
- Format HTTP Response Data (Code Node)  
- Loop Over Items (SplitInBatches)

**Node Details:**

- **Format HTTP Response Data**  
  - Type: Code (JavaScript)  
  - Role: Parses Shopify checkouts, extracts customer name, phone number, product title, quantity, price, currency, and abandoned cart URL.  
  - Configuration: Custom JS code that validates the presence of checkouts array and maps data fields into simplified JSON objects.  
  - Key Expressions: Accesses nested JSON paths for customer and product details, handles missing data gracefully.  
  - Inputs: Raw HTTP response from Shopify API.  
  - Outputs: Array of structured checkout JSON objects.  
  - Edge Cases: Missing fields, empty checkout array, malformed JSON causing exceptions.

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Role: Iterates over each checkout record one at a time to allow controlled processing.  
  - Configuration: Default batch size (likely 1) for sequential processing.  
  - Inputs: Structured checkout array from code node.  
  - Outputs: Single checkout JSON per iteration.  
  - Edge Cases: Large number of checkouts causing long processing times.

---

#### 1.3 Phone Number Cleaning & Verification

**Overview:**  
Cleans the phone number to a numeric-only format required by WhatsApp and verifies via Rapiwa API if the number is valid and active on WhatsApp.

**Nodes Involved:**  
- Clean WhatsApp Number (Code Node)  
- Check valid whatsapp number Using Rapiwa1 (HTTP Request)

**Node Details:**

- **Clean WhatsApp Number**  
  - Type: Code (JavaScript)  
  - Role: Removes all non-digit characters from the phone number string.  
  - Configuration: Maps over input items, applies regex replacement `/\D/g` to strip non-numeric chars, updates the `number` field.  
  - Key Expressions: `item.json["number"] = rawNumber.replace(/\D/g, "")`  
  - Inputs: Single checkout JSON from Loop Over Items.  
  - Outputs: Cleaned phone number JSON to next node.  
  - Edge Cases: Missing or malformed number fields, empty strings.

- **Check valid whatsapp number Using Rapiwa1**  
  - Type: HTTP Request  
  - Role: POSTs cleaned phone number to Rapiwa's WhatsApp verification API endpoint.  
  - Configuration: URL `https://app.rapiwa.com/api/verify-whatsapp`, Bearer Token authentication, sends JSON body with `number`.  
  - Key Expressions: `"number": "={{ $json.number }}"`  
  - Inputs: Cleaned phone number JSON.  
  - Outputs: JSON response indicating if number exists as WhatsApp account (`data.exists`).  
  - Edge Cases: API downtime, invalid token, request throttling, unexpected API response format.

---

#### 1.4 Conditional Messaging & Logging

**Overview:**  
Branches workflow based on WhatsApp number validity. Valid numbers get personalized WhatsApp messages sent via Rapiwa and logged as verified. Invalid numbers are logged as unverified without message sending.

**Nodes Involved:**  
- If (Condition node)  
- Rapiwa Sender (HTTP Request)  
- Change State of Rows in Verified & Sent (Google Sheets)  
- Change State of Rows in Unverified & Not Sent (Google Sheets)

**Node Details:**

- **If**  
  - Type: If (Conditional)  
  - Role: Checks if `data.exists == true` from Rapiwa verification response.  
  - Configuration: Boolean condition comparing `$json.data.exists` to literal `true`.  
  - Inputs: Verification response JSON.  
  - Outputs: Two branches: True (valid WhatsApp number), False (invalid).  
  - Edge Cases: Missing `data.exists` field, unexpected values.

- **Rapiwa Sender**  
  - Type: HTTP Request  
  - Role: Sends WhatsApp message to the verified number via Rapiwa API.  
  - Configuration: POST to `https://app.rapiwa.com/api/send-message` with Bearer Token auth, sends parameters: `number`, `message_type` = text, personalized `message` with customer name, product, quantity, price, currency, discount code, and checkout URL.  
  - Key Expressions: Uses expressions referencing prior node JSON data for message templating.  
  - Inputs: True branch from If node.  
  - Outputs: Response to Google Sheets append node.  
  - Edge Cases: API errors, invalid message format, rate limits.

- **Change State of Rows in Verified & Sent**  
  - Type: Google Sheets (Append Row)  
  - Role: Logs the message as sent with `validity` = "verified" and `status` = "sent" into a Google Sheet.  
  - Configuration: Appends multiple fields including customer name, number, order ID, item name, item link, total price with currency, validity, and status.  
  - Inputs: Output of Rapiwa Sender node.  
  - Outputs: Wait node for pacing.  
  - Edge Cases: Google Sheets API limits, insufficient permissions, incorrect column mapping.

- **Change State of Rows in Unverified & Not Sent**  
  - Type: Google Sheets (Append Row)  
  - Role: Logs unverified numbers with `validity` = "unverified" and `status` = "not sent" to Google Sheet.  
  - Configuration: Similar field mapping as verified append but marks status accordingly.  
  - Inputs: False branch from If node.  
  - Outputs: Wait node for pacing.  
  - Edge Cases: Same as above.

---

#### 1.5 Post-Processing Wait

**Overview:**  
Implements a delay between processing each checkout to avoid API rate limits and WhatsApp number blocking.

**Nodes Involved:**  
- Wait

**Node Details:**

- **Wait**  
  - Type: Wait  
  - Role: Pauses the workflow for a configured duration (e.g., 5 seconds) between message sends or logging operations.  
  - Configuration: Default wait time (not explicitly stated but typically a few seconds).  
  - Inputs: Both verified and unverified Google Sheets append nodes connect here.  
  - Outputs: Loops back to Loop Over Items to process next batch.  
  - Edge Cases: Excessive wait time might slow workflow, insufficient wait could trigger rate limits.

---

### 3. Summary Table

| Node Name                              | Node Type             | Functional Role                                    | Input Node(s)                      | Output Node(s)                          | Sticky Note                                                                                          |
|--------------------------------------|-----------------------|---------------------------------------------------|----------------------------------|---------------------------------------|----------------------------------------------------------------------------------------------------|
| Schedule Trigger                     | Schedule Trigger      | Periodic workflow trigger                          | None                             | HTTP Request                         | ## Scheduled Trigger  \n- Runs automatically on schedule to start workflow.                         |
| HTTP Request                        | HTTP Request          | Fetch abandoned checkouts from Shopify API        | Schedule Trigger                 | Format HTTP Response Data            | ## Fetch Abandoned Checkouts\n- Pulls abandoned carts from Shopify for messaging.                   |
| Format HTTP Response Data           | Code                  | Format raw Shopify data into structured JSON      | HTTP Request                    | Loop Over Items                     | ## Format the API Response\n- Extracts needed fields for downstream nodes.                          |
| Loop Over Items                    | SplitInBatches        | Process each checkout individually                 | Format HTTP Response Data       | Clean WhatsApp Number                | ## Loop Through Each Checkout\n- Enables batching and sequential processing.                         |
| Clean WhatsApp Number               | Code                  | Clean phone number to numeric-only WhatsApp format| Loop Over Items                 | Check valid whatsapp number Using Rapiwa1 | ## Clean and Verify WhatsApp Numbers\n- Removes unwanted chars for WhatsApp number formatting.     |
| Check valid whatsapp number Using Rapiwa1 | HTTP Request          | Verify if number is WhatsApp-registered            | Clean WhatsApp Number           | If                                  | ## Clean and Verify WhatsApp Numbers\n- Checks if the WhatsApp number is active and valid.         |
| If                                 | If                    | Branch logic based on WhatsApp validity            | Check valid whatsapp number Using Rapiwa1 | Rapiwa Sender (True), Change State of Rows in Unverified & Not Sent (False) | ## Conditional Logic\n- Routes based on verification result: send or log unverified.                 |
| Rapiwa Sender                     | HTTP Request          | Send WhatsApp message via Rapiwa API               | If (True branch)                | Change State of Rows in Verified & Sent | ## Send Message via HTTP Request Using Rapiwa\n- Core message sending step to WhatsApp.             |
| Change State of Rows in Verified & Sent | Google Sheets (Append Row) | Log verified and sent messages                      | Rapiwa Sender                  | Wait                                | ## Change State of Rows in Sent\n- Logs successful messages as sent and verified.                   |
| Change State of Rows in Unverified & Not Sent | Google Sheets (Append Row) | Log unverified and not sent messages                | If (False branch)               | Wait                                | ## Append Unverified Row to Sheet\n- Logs invalid WhatsApp numbers without sending messages.       |
| Wait                               | Wait                  | Delay between processing each checkout             | Change State of Rows (both)     | Loop Over Items                     | ## Wait\n- Pauses workflow to prevent API rate limits or WhatsApp blocking.                         |
| Sticky Notes (multiple)             | Sticky Note           | Explanations and instructions                       | N/A                            | N/A                                | See detailed content in workflow overview and notes sections.                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Set to trigger at desired intervals (e.g., every 4 hours).

2. **Create HTTP Request Node (Shopify API)**  
   - Set URL to `https://salebotsg.myshopify.com/admin/api/2025-07/checkouts.json`.  
   - Authentication: Use HTTP Header Authentication with Shopify private app token credentials.  
   - Connect Schedule Trigger → HTTP Request.

3. **Create Code Node (Format HTTP Response Data)**  
   - Copy-paste JavaScript to parse `checkouts` array from Shopify response, extract these fields per checkout:  
     - `checkoutId`, `customerName` (concatenate first and last names), `number` (phone), `productTitle`, `quantity`, `totalPrice`, `presentment_currency`, `abandonedCheckoutURL`.  
   - Connect HTTP Request → Format HTTP Response Data.

4. **Create SplitInBatches Node (Loop Over Items)**  
   - Set batch size to 1.  
   - Connect Format HTTP Response Data → Loop Over Items.

5. **Create Code Node (Clean WhatsApp Number)**  
   - Write JS code to remove all non-digit characters from the `number` field.  
   - Connect Loop Over Items (main output for data) → Clean WhatsApp Number.

6. **Create HTTP Request Node (Check valid whatsapp number Using Rapiwa1)**  
   - POST to `https://app.rapiwa.com/api/verify-whatsapp`.  
   - Authentication: Bearer Token via Rapiwa credentials.  
   - Body parameter: JSON with `number` from cleaned phone number.  
   - Connect Clean WhatsApp Number → Check valid whatsapp number Using Rapiwa1.

7. **Create If Node**  
   - Condition: `$json.data.exists == true`.  
   - Connect Check valid whatsapp number Using Rapiwa1 → If.

8. **Create HTTP Request Node (Rapiwa Sender)**  
   - POST to `https://app.rapiwa.com/api/send-message`.  
   - Authentication: Bearer Token (Rapiwa).  
   - Body parameters include:  
     - `number`: cleaned WhatsApp number  
     - `message_type`: "text"  
     - `message`: Template with customerName, productTitle, quantity, totalPrice, presentment_currency, abandonedCheckoutURL, and discount code SPAGREEN10.  
   - Connect If (true branch) → Rapiwa Sender.

9. **Create Google Sheets Node (Change State of Rows in Verified & Sent)**  
   - Operation: Append row.  
   - Map columns: name, number, order id, item name, item link, total price, validity ("verified"), status ("sent").  
   - Connect Rapiwa Sender → Google Sheets.

10. **Create Google Sheets Node (Change State of Rows in Unverified & Not Sent)**  
    - Operation: Append row.  
    - Map columns similarly but set validity = "unverified" and status = "not sent".  
    - Connect If (false branch) → Google Sheets.

11. **Create Wait Node**  
    - Configure wait time (e.g., 5 seconds).  
    - Connect both Google Sheets nodes → Wait.

12. **Connect Wait Node → Loop Over Items**  
    - To continue processing next checkout batch.

13. **Set up Credentials**  
    - Shopify HTTP Header Auth with private app token.  
    - Rapiwa Bearer Token Auth.  
    - Google Sheets OAuth2 with appropriate permissions.

14. **Prepare Google Sheet**  
    - Create a Google Sheet with columns:  
      `name`, `number`, `order id`, `item name`, `coupon`, `item link`, `total price`, `validity`, `status`.  
    - Share and connect to n8n via OAuth2.

15. **Test workflow end-to-end**  
    - Trigger manually or wait for schedule.  
    - Verify logs, messages sent, and rows appended.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                               | Context or Link                                                                                           |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Sample Google Sheet format for logging messages: Columns include name, number, order id, item name, coupon, item link, total price, validity, status.                                                                                                                       | [Sample Google Sheet](https://docs.google.com/spreadsheets/d/1zsVzniJTeiFOafCI_V0B3_7VnlAPQ2CTWQa-N30qCqs/edit?usp=sharing) |
| Workflow enables WhatsApp messaging without official WhatsApp Business API by using Rapiwa API, offering a cost-effective and easy-to-manage solution for abandoned cart recovery campaigns.                                                                                 | Workflow description and overview.                                                                        |
| The workflow includes batching and wait nodes to prevent WhatsApp number bans and API rate limiting, which is critical for scaling messaging campaigns.                                                                                                                    | Sticky notes and wait node explanations.                                                                  |
| Discount code "SPAGREEN10" is hardcoded in the message template; customize as needed per your marketing strategy.                                                                                                                                                           | Rapiwa Sender node message template.                                                                      |
| Requires Rapiwa account with API access and WhatsApp number authorized for sending messages.                                                                                                                                                                               | Rapiwa API documentation (external).                                                                      |

---

**Disclaimer:** The text provided derives exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly respects current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.