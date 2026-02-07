Automate Client Invoicing & Payments with Stripe, Google Sheets, Drive and Gmail

https://n8nworkflows.xyz/workflows/automate-client-invoicing---payments-with-stripe--google-sheets--drive-and-gmail-8819


# Automate Client Invoicing & Payments with Stripe, Google Sheets, Drive and Gmail

### 1. Workflow Overview

This workflow automates client invoicing and payment processing by integrating Google Sheets, Stripe, Google Drive, and Gmail. It targets businesses that manage client payments via Google Sheets and want to automate invoice creation, payment link generation, and client notification.

The workflow is logically divided into these blocks:

- **1.1 Input Reception:** Detects new or updated rows in a Google Sheet containing client order and payment data.
- **1.2 Data Filtering:** Filters out rows that have already been processed or are missing required update flags.
- **1.3 Stripe Integration:** Creates Stripe products, prices, and payment links dynamically for each invoice.
- **1.4 Invoice Generation & Storage:** Generates a textual invoice and stores it in Google Drive.
- **1.5 Google Sheets Update:** Updates the original Google Sheet row with invoice and payment link details.
- **1.6 Client Notification:** Sends an invoice email to the client with embedded invoice and payment links.
- **1.7 Setup Guidance:** Provides detailed instructions for configuring the workflow and its credentials.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Listens for changes every minute in a specified Google Sheet to detect new or updated client payment rows.

- **Nodes Involved:**  
  - Google Sheets Trigger

- **Node Details:**  
  - **Google Sheets Trigger**  
    - Type: Trigger node for Google Sheets  
    - Configuration: Polls the sheet named "Sheet1" (`gid=0`) in the document "ClientPayments" every minute.  
    - Credentials: Uses OAuth2 for Google Sheets trigger authentication.  
    - Input: None (trigger-based)  
    - Output: Emits rows that have changed since last poll.  
    - Edge Cases:  
      - API rate limits on Google Sheets polling.  
      - Connectivity issues causing missed triggers.  
      - Changes in sheet structure may cause failures.  

#### 2.2 Data Filtering

- **Overview:**  
  Filters incoming rows to process only those where the `Last Updated` field is empty, indicating unprocessed invoices.

- **Nodes Involved:**  
  - Filter

- **Node Details:**  
  - **Filter**  
    - Type: Filter node  
    - Configuration: Passes only rows where `Last Updated` is empty (strict string check).  
    - Input: Trigger output (Google Sheets rows).  
    - Output: Rows to be processed further.  
    - Edge Cases:  
      - Rows with invalid or unexpected data in `Last Updated` might be incorrectly filtered.  
      - Case sensitivity is enabled; variations may cause misses.

#### 2.3 Stripe Integration

- **Overview:**  
  Creates a Stripe product based on the invoice item, then creates a price for that product, followed by generating a payment link.

- **Nodes Involved:**  
  - Create Stripe Product  
  - Create Stripe Price  
  - Create Stripe Payment Link

- **Node Details:**  
  - **Create Stripe Product**  
    - Type: HTTP Request node  
    - Role: Creates a new Stripe product using item description from the filtered row.  
    - Configuration: POST request to `https://api.stripe.com/v1/products` with body parameter `name` set to the item description.  
    - Authentication: Basic Auth using Stripe Secret Key credential.  
    - Input: Filter output.  
    - Output: Stripe product JSON containing product ID.  
    - Edge Cases:  
      - API key invalid or expired.  
      - Network or Stripe service downtime.  
      - Item description missing or malformed.  

  - **Create Stripe Price**  
    - Type: HTTP Request node  
    - Role: Creates a price for the previously created Stripe product.  
    - Configuration: POST to `https://api.stripe.com/v1/prices` with `currency`, `unit_amount`, and `product` from previous node and filtered row.  
    - Authentication: Same Stripe Basic Auth credential.  
    - Input: Stripe product response.  
    - Output: Stripe price JSON with price ID.  
    - Edge Cases:  
      - Currency code invalid or unsupported.  
      - Amount not in smallest currency unit or invalid format (Stripe expects integers in cents).  
      - Product ID missing or invalid.

  - **Create Stripe Payment Link**  
    - Type: HTTP Request node  
    - Role: Generates a payment link for the created price.  
    - Configuration: POST to `https://api.stripe.com/v1/payment_links` with line items including price ID and quantity 1.  
    - Authentication: Same Stripe credential.  
    - Input: Stripe price response.  
    - Output: Payment link JSON with URL.  
    - Edge Cases:  
      - Price ID invalid or missing.  
      - API limits or Stripe service issues.

#### 2.4 Invoice Generation & Storage

- **Overview:**  
  Generates a textual invoice file using data from the filtered row and payment link, then saves it into a specified Google Drive folder.

- **Nodes Involved:**  
  - Google Drive

- **Node Details:**  
  - **Google Drive**  
    - Type: Google Drive node  
    - Role: Creates a new text file named with invoice number containing invoice details and payment link.  
    - Configuration:  
      - Operation: `createFromText`  
      - File name: `Invoice_<Order ID>`  
      - File content: Text including order info, client info, amount, and Stripe payment URL.  
      - Target Folder: Google Drive folder with ID `1FfQW6DeAd0UPj-CFFEsXqgE43I2V6zDX` (named "Youtube").  
    - Authentication: OAuth2 for Google Drive.  
    - Input: Stripe payment link and filtered row data.  
    - Output: Google Drive file metadata including file ID.  
    - Edge Cases:  
      - Google Drive API quota or permission errors.  
      - Missing or invalid folder ID.  
      - Rate limiting or network issues.

#### 2.5 Google Sheets Update

- **Overview:**  
  Updates the original Google Sheet row with the invoice link (Google Drive file ID), Stripe payment link URL, and sets the `Last Updated` timestamp to current time.

- **Nodes Involved:**  
  - Google Sheets

- **Node Details:**  
  - **Google Sheets**  
    - Type: Google Sheets node  
    - Role: Updates the relevant row in the sheet with new invoice and payment info.  
    - Configuration:  
      - Operation: `update`  
      - Matching column: `Order ID` to identify the row.  
      - Columns updated: `Invoice Link` (Google Drive file ID), `Stripe Payment Link` (payment URL), `Last Updated` (current datetime).  
      - Document: Same as trigger.  
      - Sheet: "Sheet1" (`gid=0`).  
    - Authentication: OAuth2 for Google Sheets.  
    - Input: Google Drive file metadata and Stripe payment link.  
    - Output: Updated row confirmation.  
    - Edge Cases:  
      - Row not found or multiple matches for `Order ID`.  
      - API rate limits or permission errors.  
      - Date/time format issues.

#### 2.6 Client Notification

- **Overview:**  
  Sends an HTML email invoice to the client using Gmail, including invoice details, Google Drive invoice link, and Stripe payment link.

- **Nodes Involved:**  
  - Send Email via Gmail

- **Node Details:**  
  - **Send Email via Gmail**  
    - Type: Gmail node  
    - Role: Sends an invoice email to the client’s email address extracted from the filtered row.  
    - Configuration:  
      - To: Client Email from filtered data.  
      - Subject: "Invoice for Services".  
      - HTML Message: Styled HTML email embedding order details, invoice view link (Google Drive file), and payment link (Stripe). Includes current date and company branding placeholders.  
      - Includes HTML content.  
    - Authentication: OAuth2 for Gmail.  
    - Input: Filtered row, Google Drive file ID, Stripe payment link.  
    - Output: Email send confirmation.  
    - Edge Cases:  
      - Invalid or missing email address.  
      - Gmail API quota or authorization errors.  
      - Email formatting issues or link failures.

#### 2.7 Setup Guidance

- **Overview:**  
  Provides a detailed sticky note within the workflow explaining setup prerequisites and stepwise configuration instructions.

- **Nodes Involved:**  
  - Sticky Note

- **Node Details:**  
  - **Sticky Note**  
    - Type: Sticky Note node (non-executing)  
    - Role: Contains comprehensive setup guide including prerequisites, stepwise instructions for Google Sheets, Stripe API key setup, Google Drive folder configuration, Gmail authorization, and testing instructions.  
    - Content includes links such as the Stripe Dashboard URL.  
    - Position: Fixed in the canvas for visibility.  
    - No input/output connections.

---

### 3. Summary Table

| Node Name             | Node Type                | Functional Role               | Input Node(s)        | Output Node(s)                | Sticky Note                                                                                  |
|-----------------------|--------------------------|------------------------------|----------------------|------------------------------|----------------------------------------------------------------------------------------------|
| Google Sheets Trigger  | Google Sheets Trigger    | Detects sheet updates        | None                 | Filter                       | See sticky note for full setup instructions.                                                |
| Filter                | Filter                   | Filters unprocessed rows     | Google Sheets Trigger| Create Stripe Product         | See sticky note for full setup instructions.                                                |
| Create Stripe Product  | HTTP Request             | Creates Stripe product       | Filter               | Create Stripe Price           | See sticky note for full setup instructions.                                                |
| Create Stripe Price    | HTTP Request             | Creates Stripe price         | Create Stripe Product| Create Stripe Payment Link    | See sticky note for full setup instructions.                                                |
| Create Stripe Payment Link | HTTP Request         | Creates Stripe payment link  | Create Stripe Price  | Google Drive                  | See sticky note for full setup instructions.                                                |
| Google Drive           | Google Drive             | Creates invoice file         | Create Stripe Payment Link | Google Sheets             | See sticky note for full setup instructions.                                                |
| Google Sheets          | Google Sheets            | Updates row with links       | Google Drive         | Send Email via Gmail          | See sticky note for full setup instructions.                                                |
| Send Email via Gmail   | Gmail                    | Sends invoice email          | Google Sheets        | None                         | See sticky note for full setup instructions.                                                |
| Sticky Note            | Sticky Note              | Setup instructions           | None                 | None                         | Contains detailed setup guide with links to Stripe Dashboard and configuration steps.        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger Node**  
   - Type: Google Sheets Trigger  
   - Configuration:  
     - Document ID: ID of your Google Sheet (e.g., `1xRWt65Mu7Lx_LAbCdf_FsZmO0MW2o61kMPM854_L4jw`)  
     - Sheet Name: `Sheet1` (gid=0)  
     - Polling: Every minute  
   - Credentials: OAuth2 Google Sheets Trigger account  

2. **Add Filter Node**  
   - Type: Filter  
   - Condition: Pass only rows where `Last Updated` is empty (strict string equality)  
   - Connect input from Google Sheets Trigger output  

3. **Add HTTP Request Node "Create Stripe Product"**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.stripe.com/v1/products`  
   - Body Content Type: `application/x-www-form-urlencoded`  
   - Body Parameter: `name` set to `{{ $json["Items Description"] }}` from Filter node data  
   - Authentication: Basic Auth with Stripe Secret Key credentials  
   - Connect input from Filter output  

4. **Add HTTP Request Node "Create Stripe Price"**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.stripe.com/v1/prices`  
   - Body Content Type: `application/x-www-form-urlencoded`  
   - Body Parameters:  
     - `currency`: from Filter node `Currency` field  
     - `unit_amount`: from Filter node `Amount` field (ensure amount is in smallest currency unit, e.g., cents)  
     - `product`: from previous node (`Create Stripe Product`) response `id`  
   - Authentication: Basic Auth with Stripe credentials  
   - Connect input from "Create Stripe Product" output  

5. **Add HTTP Request Node "Create Stripe Payment Link"**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.stripe.com/v1/payment_links`  
   - Body Content Type: `application/x-www-form-urlencoded`  
   - Body Parameters:  
     - `line_items[0][price]`: from "Create Stripe Price" node response `id`  
     - `line_items[0][quantity]`: 1  
   - Authentication: Basic Auth with Stripe credentials  
   - Connect input from "Create Stripe Price" output  

6. **Add Google Drive Node**  
   - Type: Google Drive  
   - Operation: `createFromText`  
   - File Name: `Invoice_{{ $json["Order ID"] }}`  
   - Content: Text invoice including order ID, dates, client info, items, amount, and Stripe payment URL from previous node  
   - Folder ID: Your Google Drive folder ID for invoices (e.g., `1FfQW6DeAd0UPj-CFFEsXqgE43I2V6zDX`)  
   - Credentials: OAuth2 Google Drive account  
   - Connect input from "Create Stripe Payment Link" output  

7. **Add Google Sheets Node**  
   - Type: Google Sheets  
   - Operation: `update`  
   - Document ID & Sheet Name: Same as trigger  
   - Matching Column: `Order ID`  
   - Columns to update:  
     - `Invoice Link`: Google Drive file ID from previous node  
     - `Stripe Payment Link`: payment URL from "Create Stripe Payment Link" node  
     - `Last Updated`: current date/time (use `{{ DateTime.now() }}` expression)  
   - Credentials: OAuth2 Google Sheets account  
   - Connect input from Google Drive node output  

8. **Add Gmail Node "Send Email via Gmail"**  
   - Type: Gmail  
   - To: Client Email from Filter node data  
   - Subject: `"Invoice for Services"`  
   - HTML Message: Construct an HTML email including invoice details, Google Drive invoice link, and Stripe payment link  
   - Include HTML content option enabled  
   - Credentials: OAuth2 Gmail account  
   - Connect input from Google Sheets update node output  

9. **Add Sticky Note Node for Setup Instructions**  
   - Content: Detailed setup guide as per the original workflow’s sticky note, including links to Stripe Dashboard and Google APIs configuration steps  
   - Position on canvas for visibility  
   - No connections  

10. **Activate Workflow and Test**  
    - Add test data row in Google Sheet with required columns:  
      `Order ID, Client Name, Client Email, Items Description, Due Date, Amount, Currency, Invoice Status, Invoice Link, Stripe Payment Link, Last Updated`  
    - Save and activate workflow  
    - Verify Stripe product, price, and payment links creation  
    - Verify Google Drive invoice file creation  
    - Verify Google Sheet update with links and timestamp  
    - Verify client receives the invoice email  

---

### 5. General Notes & Resources

| Note Content                                                                                                                               | Context or Link                                         |
|--------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| Workflow requires Google Sheets, Drive, Gmail OAuth2 credentials and Stripe API key configured with Basic Auth in HTTP Request nodes.      | Credential setup                                        |
| Amount in Stripe Price creation must be in the lowest currency unit (e.g., cents for USD) to avoid errors.                                 | Stripe API specification                                |
| Google Sheets column `Last Updated` is used as an indicator to avoid reprocessing rows.                                                    | Workflow logic                                         |
| Gmail node uses HTML email template with embedded CSS for branding and clear invoice presentation.                                         | Email formatting                                        |
| Stripe Secret Key can be found and managed in your [Stripe Dashboard](https://dashboard.stripe.com/).                                      | Stripe Dashboard link                                   |
| Google Drive folder ID for invoices must be set and the authenticated account must have write access to that folder.                      | Google Drive configuration                              |
| Polling Google Sheets every minute may hit API limits in heavy usage scenarios; consider adjusting polling frequency accordingly.          | Performance consideration                               |
| Workflow tested with n8n version supporting Google Sheets v4.5, Google Drive v3, Gmail v1 nodes and HTTP Request nodes with Basic Auth.   | Version compatibility                                  |

---

This comprehensive analysis and instruction set enables developers and automation agents to understand, replicate, and troubleshoot the client invoicing and payment workflow integrating Google Sheets, Stripe, Drive, and Gmail in n8n.