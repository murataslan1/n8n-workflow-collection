Auto Send Thank-You Messages & Loyalty Coupons via WhatsApp from Shopify using Rapiwa

https://n8nworkflows.xyz/workflows/auto-send-thank-you-messages---loyalty-coupons-via-whatsapp-from-shopify-using-rapiwa-9292


# Auto Send Thank-You Messages & Loyalty Coupons via WhatsApp from Shopify using Rapiwa

---

### 1. Workflow Overview

This n8n workflow automates sending personalized thank-you messages and loyalty coupons via WhatsApp to high-value Shopify customers using the Rapiwa API for WhatsApp validation and messaging. It is designed for Shopify store owners who want to engage customers who have spent more than 5000 units by sending them promotional WhatsApp messages and logging the results.

The workflow is logically divided into these blocks:

- **1.1 Input Reception & Customer Data Retrieval:** Manual trigger initiates the workflow; fetches all customers from Shopify API.
- **1.2 Customer Data Filtering & Preparation:** Filters customers by total spent > 5000 and extracts relevant data fields.
- **1.3 Batch Processing:** Splits customer list into batches for sequential processing.
- **1.4 Phone Number Cleaning & Validation:** Cleans phone numbers and verifies WhatsApp availability using Rapiwa API.
- **1.5 Conditional Messaging & Logging:** Depending on verification status, sends WhatsApp messages and logs verified and unverified customers separately in Google Sheets.
- **1.6 Rate Limit Management:** Wait node delays processing to avoid API throttling.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Customer Data Retrieval

- **Overview:**  
  This block starts the workflow manually and fetches all customer data from the Shopify store via its API.

- **Nodes Involved:**  
  - Clicki (Manual Trigger)  
  - Get All Customer Data In Store (HTTP Request)

- **Node Details:**

  - **Clicki (Manual Trigger)**  
    - Type: Manual Trigger  
    - Configuration: No parameters; starts workflow manually.  
    - Inputs: None  
    - Outputs: Triggers "Get All Customer Data In Store"  
    - Edge Cases: None  
    - Notes: Entry point for manual execution.

  - **Get All Customer Data In Store (HTTP Request)**  
    - Type: HTTP Request  
    - Configuration:  
      - Method: GET (default)  
      - URL: Shopify customers endpoint `https://your_shop_domain/admin/api/2025-07/customers.json`  
      - Headers: Includes `X-Shopify-Access-Token` with a valid Shopify API token (e.g., `shpat_57xx78xxxxx90fxxx67`)  
    - Inputs: Triggered by Manual Trigger  
    - Outputs: Raw JSON customer data from Shopify  
    - Edge Cases:  
      - Invalid or expired Shopify API token causes authentication errors.  
      - Network errors or Shopify API downtime.  
    - Version: Requires Shopify API version 2025-07 or compatible.

#### 2.2 Customer Data Filtering & Preparation

- **Overview:**  
  Processes the raw Shopify customer data, filtering for customers with total spent > 5000 and extracts key fields for downstream use.

- **Nodes Involved:**  
  - Clean HTTP Request Data (Code)

- **Node Details:**

  - **Clean HTTP Request Data (Code)**  
    - Type: Code (JavaScript)  
    - Configuration:  
      - Filters customers array for total_spent > 5000  
      - Extracts customerId, customerName, email, phone (from customer or default address), totalSpent, ordersCount, address, city, country, createdAt, updatedAt, state  
      - Throws error if customers array is missing or invalid  
    - Key Expressions: Uses `$input.all()` and item JSON properties  
    - Inputs: Raw Shopify customer JSON  
    - Outputs: Filtered and formatted customer objects  
    - Edge Cases:  
      - If Shopify returns no customers or unexpected data structure, error thrown  
      - Customers without phone numbers will default phone to 'N/A'  
    - Version: JavaScript environment in n8n code node.

#### 2.3 Batch Processing

- **Overview:**  
  Splits the filtered customers into smaller batches for individual processing to manage API limits and control flow.

- **Nodes Involved:**  
  - Loop Over Items (SplitInBatches)

- **Node Details:**

  - **Loop Over Items (SplitInBatches)**  
    - Type: SplitInBatches  
    - Configuration: Defaults (batch size not explicitly set, defaults to 1 or n8n default)  
    - Inputs: Filtered customer list from Code node  
    - Outputs: Single or small groups of customers per batch for sequential processing  
    - Edge Cases:  
      - Large batch sizes may cause API rate limiting  
      - If batch size is zero or invalid, processing errors may occur  
    - Version: n8n SplitInBatches node v3.

#### 2.4 Phone Number Cleaning & Validation

- **Overview:**  
  Cleans each customer’s phone number to remove non-digit characters and validates if the cleaned number is registered on WhatsApp using Rapiwa API.

- **Nodes Involved:**  
  - Clean WhatsApp Number (Code)  
  - Check valid whatsapp number Using Rapiwa (HTTP Request)

- **Node Details:**

  - **Clean WhatsApp Number (Code)**  
    - Type: Code (JavaScript)  
    - Configuration:  
      - Iterates over each item  
      - Converts phone to string if needed  
      - Removes all non-digit characters via regex `\D`  
      - Updates item JSON with cleaned phone number under `phone`  
    - Inputs: Batch of customers with phone numbers  
    - Outputs: Customers with cleaned phone numbers  
    - Edge Cases:  
      - Phone number missing or null replaced by empty string  
      - Non-string phone numbers converted to string  
    - Version: n8n code node environment.

  - **Check valid whatsapp number Using Rapiwa (HTTP Request)**  
    - Type: HTTP Request  
    - Configuration:  
      - Method: POST  
      - URL: `https://app.rapiwa.com/api/verify-whatsapp`  
      - Body: JSON with `number` set to cleaned phone number  
      - Authentication: HTTP Bearer token with Rapiwa API token  
    - Inputs: Cleaned phone number from previous node  
    - Outputs: JSON response indicating WhatsApp verification status (e.g., `data.exists` boolean)  
    - Edge Cases:  
      - Invalid or expired Rapiwa token causes authentication errors  
      - API downtime or network errors cause request failure  
      - Unexpected API responses may break downstream logic  
    - Version: Requires Rapiwa API and valid bearer token.

#### 2.5 Conditional Messaging & Logging

- **Overview:**  
  Based on Rapiwa verification, sends a personalized WhatsApp message to verified numbers, logs the sent message and status in Google Sheets, or logs unverified numbers accordingly.

- **Nodes Involved:**  
  - If (Conditional)  
  - Send Message Using Rapiwa (HTTP Request)  
  - Append Rows in Sheet Verified & Sent (Google Sheets)  
  - Append Rows in Sheet Unverified & Not sent (Google Sheets)

- **Node Details:**

  - **If (Conditional)**  
    - Type: If  
    - Configuration:  
      - Condition: Checks if `data.exists` is boolean true (means number verified on WhatsApp)  
    - Inputs: Response from Rapiwa verification  
    - Outputs:  
      - True branch: Number verified  
      - False branch: Number not verified  
    - Edge Cases:  
      - Missing `data.exists` field causes false branch  
      - Expression evaluation failures if response malformed  
    - Version: n8n If node v2.2.

  - **Send Message Using Rapiwa (HTTP Request)**  
    - Type: HTTP Request  
    - Configuration:  
      - Method: POST  
      - URL: `https://app.rapiwa.com/api/send-message`  
      - Body JSON parameters:  
        - `number`: verified WhatsApp number  
        - `message_type`: "text"  
        - `message`: personalized text with customer name, coupon code "SG-50", branding (SpaGreen Creative)  
      - Authentication: HTTP Bearer token (Rapiwa)  
    - Inputs: Verified numbers from If node  
    - Outputs: API response for message sending  
    - Edge Cases:  
      - API failures or rate limits cause message send failure  
      - Invalid number formatting may cause message rejection  
    - Version: Requires Rapiwa API credentials.

  - **Append Rows in Sheet Verified & Sent (Google Sheets)**  
    - Type: Google Sheets Append  
    - Configuration:  
      - Spreadsheet ID and Sheet name specified  
      - Columns appended: name, number, status="sent", validity="verified"  
      - Name retrieved from original cleaned number node customerName field  
      - Number from message sending node output (`to` field)  
    - Inputs: After message sent  
    - Outputs: None (logging operation)  
    - Edge Cases:  
      - Invalid Google Sheets credentials cause append failure  
      - Incorrect sheet structure or missing columns cause errors  
    - Version: Google Sheets OAuth2 authentication required.

  - **Append Rows in Sheet Unverified & Not sent (Google Sheets)**  
    - Type: Google Sheets Append  
    - Configuration:  
      - Spreadsheet ID and Sheet name same as above  
      - Columns appended: name, number, status="not sent", validity="unverified"  
      - Name from cleaned number node customerName  
      - Number from Rapiwa verification response (`data.number`)  
    - Inputs: From false branch of If node  
    - Outputs: None (logging operation)  
    - Edge Cases: Same as above for Google Sheets append.

#### 2.6 Rate Limit Management

- **Overview:**  
  Adds a delay after processing each batch to prevent API rate limiting and avoid Google Sheets write conflicts.

- **Nodes Involved:**  
  - Wait

- **Node Details:**

  - **Wait**  
    - Type: Wait  
    - Configuration: Default delay (no explicit duration set in JSON, presumably configured in UI)  
    - Inputs: After appending rows (either verified or unverified)  
    - Outputs: Loops back to batch processing node "Loop Over Items"  
    - Edge Cases:  
      - No delay or very short delay may cause rate limiting  
      - Too long delay slows workflow unnecessarily  
    - Version: n8n Wait node v1.1.

---

### 3. Summary Table

| Node Name                     | Node Type            | Functional Role                                               | Input Node(s)                      | Output Node(s)                            | Sticky Note                                                                                                          |
|-------------------------------|----------------------|--------------------------------------------------------------|----------------------------------|-------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Clicki                        | Manual Trigger       | Starts the workflow manually                                  | None                             | Get All Customer Data In Store             | Starts the workflow manually when you want to run it.                                                               |
| Get All Customer Data In Store| HTTP Request         | Fetch all customers from Shopify API                          | Clicki                          | Clean HTTP Request Data                    | Fetches all customer data from Shopify store using Shopify API.                                                      |
| Clean HTTP Request Data       | Code                 | Filters customers spending > 5000, extracts key data fields  | Get All Customer Data In Store   | Loop Over Items                            | Filters and processes Shopify customer data to only keep customers who have spent more than 5000 units.               |
| Loop Over Items               | SplitInBatches       | Splits customer list into batches for sequential processing   | Clean HTTP Request Data          | Clean WhatsApp Number (2nd output branch) | Splits the customer list into smaller batches to process each customer individually or in groups.                     |
| Clean WhatsApp Number         | Code                 | Cleans phone numbers by removing non-digit characters         | Loop Over Items                  | Check valid whatsapp number Using Rapiwa  | Cleans up the phone numbers by removing non-digit characters to format the number properly for WhatsApp verification.|
| Check valid whatsapp number Using Rapiwa | HTTP Request | Verifies if cleaned phone number is registered on WhatsApp    | Clean WhatsApp Number            | If                                        | Checks if the cleaned phone number is a valid WhatsApp number by calling the Rapiwa API.                             |
| If                           | If                   | Branches workflow based on WhatsApp verification status       | Check valid whatsapp number Using Rapiwa | Send Message Using Rapiwa (true), Append Rows in Sheet Unverified & Not sent (false) | Checks the Rapiwa API response to see if the phone number is verified as a WhatsApp number.                          |
| Send Message Using Rapiwa    | HTTP Request         | Sends personalized WhatsApp message via Rapiwa API            | If (true branch)                | Append Rows in Sheet Verified & Sent      | Sends a personalized discount message via WhatsApp to customers with verified WhatsApp numbers.                      |
| Append Rows in Sheet Verified & Sent | Google Sheets    | Logs verified and messaged customers as sent                  | Send Message Using Rapiwa       | Wait                                      | Logs details of customers with verified WhatsApp numbers and sent messages into a Google Sheet.                      |
| Append Rows in Sheet Unverified & Not sent | Google Sheets | Logs unverified customers as not sent                          | If (false branch)               | Wait                                      | Logs customers with unverified WhatsApp numbers and marks them as “not sent” in the Google Sheet.                    |
| Wait                         | Wait                 | Adds delay to avoid API rate limits and sheet write conflicts | Append Rows in Sheet Verified & Sent, Append Rows in Sheet Unverified & Not sent | Loop Over Items                       | Pauses the workflow briefly to avoid hitting API rate limits before processing the next batch of customers.          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node:**  
   - Name: `Clicki`  
   - Type: Manual Trigger  
   - No parameters.

2. **Add HTTP Request Node to Fetch Shopify Customers:**  
   - Name: `Get All Customer Data In Store`  
   - HTTP Method: GET  
   - URL: `https://your_shop_domain/admin/api/2025-07/customers.json` (replace `your_shop_domain`)  
   - Headers: Add header `X-Shopify-Access-Token` with Shopify API token (e.g., `shpat_57xx78xxxxx90fxxx67`)  
   - Connect `Clicki` → `Get All Customer Data In Store`

3. **Add Code Node to Filter and Clean Customer Data:**  
   - Name: `Clean HTTP Request Data`  
   - Code (JavaScript):  
     ```javascript
     const customers = items[0].json.customers;
     if (!Array.isArray(customers)) {
       throw new Error("Customers not found or not an array");
     }
     return customers
       .filter((customer) => parseFloat(customer.total_spent || '0.00') > 5000)
       .map((customer) => {
         const address = customer.default_address || {};
         return {
           json: {
             customerId: customer.id || null,
             customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
             email: customer.email || 'N/A',
             phone: customer.phone || address.phone || 'N/A',
             totalSpent: customer.total_spent || '0.00',
             ordersCount: customer.orders_count || 0,
             address: address.address1 || 'N/A',
             city: address.city || 'N/A',
             country: address.country || 'N/A',
             createdAt: customer.created_at || null,
             updatedAt: customer.updated_at || null,
             state: customer.state || 'N/A'
           }
         };
       });
     ```  
   - Connect `Get All Customer Data In Store` → `Clean HTTP Request Data`

4. **Add SplitInBatches Node:**  
   - Name: `Loop Over Items`  
   - Batch Size: Default (or set as per your rate limits)  
   - Connect `Clean HTTP Request Data` → `Loop Over Items`

5. **Add Code Node to Clean WhatsApp Numbers:**  
   - Name: `Clean WhatsApp Number`  
   - Code (JavaScript):  
     ```javascript
     const items = $input.all();
     const updatedItems = items.map((item) => {
       const waNo = item?.json?.["phone"];
       const waNoStr = typeof waNo === 'string' ? waNo : (waNo !== undefined && waNo !== null ? String(waNo) : "");
       const cleanedNumber = waNoStr.replace(/\D/g, "");
       item.json["phone"] = cleanedNumber;
       return item;
     });
     return updatedItems;
     ```  
   - Connect the second output of `Loop Over Items` → `Clean WhatsApp Number`

6. **Add HTTP Request Node to Verify WhatsApp Number via Rapiwa:**  
   - Name: `Check valid whatsapp number Using Rapiwa`  
   - Method: POST  
   - URL: `https://app.rapiwa.com/api/verify-whatsapp`  
   - Authentication: HTTP Bearer Token (Configure Rapiwa token in credentials)  
   - Body Parameters (JSON): `{ "number": {{$json.phone}} }`  
   - Connect `Clean WhatsApp Number` → `Check valid whatsapp number Using Rapiwa`

7. **Add If Node to Branch on Verification:**  
   - Name: `If`  
   - Condition: Boolean check if `{{$json.data.exists}} == true`  
   - Connect `Check valid whatsapp number Using Rapiwa` → `If`

8. **Add HTTP Request Node to Send WhatsApp Message via Rapiwa:**  
   - Name: `Send Message Using Rapiwa`  
   - Method: POST  
   - URL: `https://app.rapiwa.com/api/send-message`  
   - Authentication: HTTP Bearer Token (Rapiwa credentials)  
   - Body Parameters (JSON):  
     ```json
     {
       "number": "={{$json.data.number}}",
       "message_type": "text",
       "message": "Hey {{$('Clean WhatsApp Number').item.json.customerName}},\n\nYou're one of our favorite customers! 💚\nHere’s a *50% OFF* coupon just for you *SG-50*🎁\n\nHurry — it won’t last long! \n– Team *SpaGreen Creative*"
     }
     ```  
   - Connect `If` True (verified) → `Send Message Using Rapiwa`

9. **Add Google Sheets Append Node for Verified & Sent:**  
   - Name: `Append Rows in Sheet Verified & Sent`  
   - Operation: Append  
   - Spreadsheet ID: Use your Google Sheet ID  
   - Sheet Name: Use the sheet name or gid (e.g., gid=0)  
   - Columns: name, number, status="sent", validity="verified"  
   - Connect `Send Message Using Rapiwa` → `Append Rows in Sheet Verified & Sent`  
   - Credentials: Google Sheets OAuth2

10. **Add Google Sheets Append Node for Unverified & Not Sent:**  
    - Name: `Append Rows in Sheet Unverified & Not sent`  
    - Operation: Append  
    - Spreadsheet ID and Sheet Name same as above  
    - Columns: name, number, status="not sent", validity="unverified"  
    - Connect `If` False (unverified) → `Append Rows in Sheet Unverified & Not sent`  
    - Credentials: Google Sheets OAuth2

11. **Add Wait Node for Rate Limiting:**  
    - Name: `Wait`  
    - Set delay (e.g., seconds or milliseconds as needed to avoid rate limiting)  
    - Connect outputs of both Google Sheets Append nodes → `Wait`

12. **Loop Back to Batch Processing:**  
    - Connect `Wait` → `Loop Over Items` to process next batch

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                     | Context or Link                                                                                                                  |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| This workflow targets Shopify stores wanting to engage high-value customers via WhatsApp using the Rapiwa API. It filters customers spending over 5000 units and sends personalized discount coupons.                                                                                                             | Workflow Purpose                                                                                                                 |
| The Google Sheet used for logging must have columns: `name`, `number`, `status`, `validity` exactly named for appends to work properly. Example sheet available here: [Sample Google Sheet](https://docs.google.com/spreadsheets/d/1q5mO2pRCdO-v51OyUZt-56UprsGpmn0PMGhnglgg2ls/edit?usp=sharing)                          | Google Sheets Setup                                                                                                             |
| Use valid Shopify access tokens with permissions to read customers. Ensure Rapiwa tokens are active and have sufficient quota.                                                                                                                                                                                 | Credential Setup                                                                                                                |
| This workflow uses batching and wait nodes to handle API rate limits; adjust parameters based on your API quotas and workflow performance.                                                                                                                                                                     | Performance Tuning                                                                                                              |
| For help or support, contact SpaGreen community and developer via WhatsApp, Discord, Facebook Group, or official website.                                                                                                                                                                                      | Support Links:                                                                                                                  |
| - WhatsApp: [Chat on WhatsApp](https://wa.me/8801322827799)  
- Discord: [SpaGreen Community](https://discord.gg/SsCChWEP)  
- Facebook Group: [SpaGreen Support](https://www.facebook.com/groups/spagreenbd)  
- Website: [https://spagreen.net](https://spagreen.net)  
- Developer Portfolio: [Codecanyon SpaGreen](https://codecanyon.net/user/spagreen/portfolio) | Various Support Channels                                                                                                        |
| Rapiwa API resources:  
- Dashboard: [https://app.rapiwa.com](https://app.rapiwa.com/login)  
- Official Website: [https://rapiwa.com](https://rapiwa.com/)  
- Documentation: [https://docs.rapiwa.com](https://docs.rapiwa.com/)                                                                                                                                                                                | Rapiwa API Useful Links                                                                                                        |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.

---