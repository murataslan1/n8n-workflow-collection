Automate Property Link Shortening & QR Code Generation with Google Sheets and Bitly

https://n8nworkflows.xyz/workflows/automate-property-link-shortening---qr-code-generation-with-google-sheets-and-bitly-6407


# Automate Property Link Shortening & QR Code Generation with Google Sheets and Bitly

### 1. Workflow Overview

This workflow automates the process of shortening property listing URLs and generating corresponding QR codes using data from a Google Sheet. It is designed for real estate agents or property managers who maintain listings in Google Sheets and want to create shareable short links and QR codes efficiently.

The workflow consists of four logical blocks:

- **1.1 Input Reception:** Monitors Google Sheets for new or updated property listings.
- **1.2 URL Shortening:** Sends the original property URL to Bitly to obtain a shortened URL.
- **1.3 QR Code Generation:** Creates a QR code image URL from the shortened URL using a QR code generation API.
- **1.4 Data Update:** Writes back the shortened URL and QR code URL to the original Google Sheet row.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block listens for new or updated rows in a specified Google Sheet. When a property link is added or modified, it triggers the workflow to start processing.

- **Nodes Involved:**  
  - `0. Google Sheets (New/Updated Row Trigger)`

- **Node Details:**  
  - **Node:** `0. Google Sheets (New/Updated Row Trigger)`  
    - **Type:** Google Sheets Trigger  
    - **Role:** Watches for changes (new or updated rows) in a configured Google Sheet containing property listings.  
    - **Configuration:**  
      - Triggers on both new and updated rows for real-time processing.  
      - Requires connection to Google Sheets via OAuth2 credentials.  
      - Configured to monitor a specific spreadsheet and worksheet (not detailed here).  
    - **Key Expressions/Variables:** Retrieves entire row data including the original property URL.  
    - **Input Connections:** None (trigger node).  
    - **Output Connections:** Passes data to the "1. Shorten URL" node.  
    - **Version Considerations:** Uses version 1 of the Google Sheets trigger node.  
    - **Failure Modes:**  
      - Authorization errors if Google credentials are invalid or expired.  
      - Network or API rate limits from Google Sheets.  
      - Trigger misconfiguration (wrong spreadsheet or worksheet).  
    - **Sub-Workflow:** None.

#### 1.2 URL Shortening

- **Overview:**  
  This block sends the property URL extracted from the Google Sheet row to Bitly’s API to obtain a shortened link.

- **Nodes Involved:**  
  - `1. Shorten URL (HTTP Request - Bitly)`

- **Node Details:**  
  - **Node:** `1. Shorten URL (HTTP Request - Bitly)`  
    - **Type:** HTTP Request  
    - **Role:** Calls Bitly API to shorten the long property URL.  
    - **Configuration:**  
      - Method: POST  
      - URL: Bitly API endpoint for shortening URLs (e.g., `https://api-ssl.bitly.com/v4/shorten`).  
      - Authentication: Bearer token for Bitly API (configured in credentials).  
      - Request Body: JSON containing the long URL from the Google Sheet row (e.g., `{ "long_url": {{ $json.propertyUrl }} }`).  
      - Headers: Content-Type application/json and Authorization header with the Bearer token.  
    - **Key Expressions:** Uses dynamic expressions to extract the property URL from the trigger node’s output.  
    - **Input Connections:** Receives Google Sheet row data from the trigger.  
    - **Output Connections:** Passes shortened URL data to QR Code generation node.  
    - **Version Considerations:** HTTP Request node version 3 to support modern HTTP features.  
    - **Failure Modes:**  
      - Invalid or expired Bitly API token leading to authentication failure.  
      - Malformed URL or missing property URL in input data causing API errors.  
      - Bitly API rate limiting or downtime.  
    - **Sub-Workflow:** None.

#### 1.3 QR Code Generation

- **Overview:**  
  This block generates a QR code image URL by submitting the shortened URL to a QR code generation API.

- **Nodes Involved:**  
  - `2. Generate QR Code (HTTP Request - QR Code API)`

- **Node Details:**  
  - **Node:** `2. Generate QR Code (HTTP Request - QR Code API)`  
    - **Type:** HTTP Request  
    - **Role:** Calls an external QR code API to create a QR code image representing the shortened URL.  
    - **Configuration:**  
      - Method: GET or POST depending on API.  
      - URL: Endpoint of the QR code generation service, possibly with query parameters including the shortened URL.  
      - Authentication: Usually none or API key if required (not specified here).  
      - Request Parameters: Contains the shortened URL dynamically from the previous node’s output.  
    - **Key Expressions:** Extracts shortened URL from previous node output to pass to the QR code API.  
    - **Input Connections:** Receives shortened URL JSON from Bitly HTTP node.  
    - **Output Connections:** Passes QR code image URL and shortened URL to Google Sheets update node.  
    - **Version Considerations:** HTTP Request node version 3.  
    - **Failure Modes:**  
      - QR code API service downtime.  
      - Incorrect or missing URL parameter causing invalid QR code generation.  
      - Network issues or timeouts.  
    - **Sub-Workflow:** None.

#### 1.4 Data Update

- **Overview:**  
  Writes the generated short URL and QR code link back into the appropriate row of the Google Sheet, completing the automation loop.

- **Nodes Involved:**  
  - `3. Update Google Sheet (Update Row)`

- **Node Details:**  
  - **Node:** `3. Update Google Sheet (Update Row)`  
    - **Type:** Google Sheets (Update Row)  
    - **Role:** Updates the original Google Sheet row with the new short URL and QR code URL.  
    - **Configuration:**  
      - Spreadsheet and worksheet set to match the trigger node.  
      - Uses the row ID or index from the trigger to identify which row to update.  
      - Maps fields for short URL and QR code URL to corresponding columns.  
      - Requires Google Sheets OAuth2 credentials.  
    - **Key Expressions:**  
      - References shortened URL and QR code URL from previous nodes’ outputs.  
      - Uses dynamic row identification to update the correct row.  
    - **Input Connections:** Receives QR code URL and shortened URL data.  
    - **Output Connections:** None (end of workflow).  
    - **Version Considerations:** HTTP Request node version 3.  
    - **Failure Modes:**  
      - Authorization errors with Google Sheets.  
      - Row ID mismatch or missing causing failed update.  
      - API rate limiting or network issues.  
    - **Sub-Workflow:** None.

---

### 3. Summary Table

| Node Name                             | Node Type               | Functional Role                       | Input Node(s)                        | Output Node(s)                          | Sticky Note                                  |
|-------------------------------------|-------------------------|------------------------------------|------------------------------------|----------------------------------------|----------------------------------------------|
| 0. Google Sheets (New/Updated Row Trigger) | Google Sheets Trigger    | Detects new or updated property rows | None                               | 1. Shorten URL (HTTP Request - Bitly) |                                              |
| 1. Shorten URL (HTTP Request - Bitly)       | HTTP Request            | Shortens property URLs via Bitly API | 0. Google Sheets (New/Updated Row Trigger) | 2. Generate QR Code (HTTP Request - QR Code API) |                                              |
| 2. Generate QR Code (HTTP Request - QR Code API) | HTTP Request            | Generates QR code image URLs         | 1. Shorten URL (HTTP Request - Bitly) | 3. Update Google Sheet (Update Row)    |                                              |
| 3. Update Google Sheet (Update Row)           | Google Sheets           | Updates sheet with short URL & QR code URL | 2. Generate QR Code (HTTP Request - QR Code API) | None                                   |                                              |
| Sticky Note                          | Sticky Note             |                                      |                                    |                                        |                                              |
| Sticky Note1                         | Sticky Note             |                                      |                                    |                                        |                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger Node:**  
   - Add a new node of type "Google Sheets Trigger".  
   - Configure OAuth2 credentials for Google Sheets access.  
   - Select the target spreadsheet and worksheet where property listings are stored.  
   - Set the trigger to activate on "New Row" and "Updated Row".  
   - This node will provide the property listing data, including the original URL.

2. **Create HTTP Request Node to Shorten URL via Bitly:**  
   - Add a new node of type "HTTP Request".  
   - Name it "1. Shorten URL (HTTP Request - Bitly)".  
   - Set HTTP Method to POST.  
   - Set the URL to Bitly’s shorten endpoint, e.g., `https://api-ssl.bitly.com/v4/shorten`.  
   - Under Authentication, set to use Bearer Token with your Bitly API token (create Bitly credentials in n8n).  
   - Set Headers: `Content-Type: application/json`.  
   - Set Body Parameters (raw JSON):  
     `{ "long_url": "{{ $json.propertyUrl }}" }`  
     Replace `propertyUrl` with the correct property link field from the Google Sheet trigger.  
   - Connect the output of the Google Sheets Trigger node to this node’s input.

3. **Create HTTP Request Node for QR Code Generation:**  
   - Add a new node of type "HTTP Request".  
   - Name it "2. Generate QR Code (HTTP Request - QR Code API)".  
   - Configure the HTTP method (GET or POST) and URL of your chosen QR code API (e.g., `https://api.qrserver.com/v1/create-qr-code/`).  
   - Pass the shortened URL obtained from the previous node as a query parameter or in the request body, depending on API requirements. Example URL with query parameter:  
     `https://api.qrserver.com/v1/create-qr-code/?data={{ $json.link }}`  
     where `link` is the shortened URL field from the previous node.  
   - Connect the output of the Bitly HTTP Request node to this node’s input.

4. **Create Google Sheets Node to Update Row:**  
   - Add a new node of type "Google Sheets".  
   - Name it "3. Update Google Sheet (Update Row)".  
   - Configure it to update the same spreadsheet and worksheet used in the trigger.  
   - Use the row number or unique row ID from the trigger node to specify which row to update.  
   - Map the new columns (e.g., "Short URL", "QR Code URL") to the corresponding data:  
     - Short URL: from the Bitly node output.  
     - QR Code URL: from the QR code generation node output.  
   - Connect the output of the QR code HTTP Request node to this node’s input.

5. **Connect Nodes in Sequence:**  
   - From Google Sheets Trigger → to Bitly HTTP Request → to QR Code HTTP Request → to Google Sheets Update node.

6. **Credential Setup:**  
   - Google Sheets: OAuth2 credentials with read/write access to the target spreadsheet.  
   - Bitly: API token with URL shortening permissions.

7. **Test the Workflow:**  
   - Add or update a row in the Google Sheet with a property URL.  
   - Confirm the workflow triggers, shortens the URL, generates a QR code, and updates the Google Sheet row with new data.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                         |
|-------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| Bitly API documentation for URL shortening: https://dev.bitly.com/api-reference#createBitlink | Reference for HTTP Request node configuration with Bitly |
| QR code generation API example: https://goqr.me/api/                                           | Example free API for QR code generation                 |
| Ensure Google Sheets OAuth2 credentials have "Editor" permission to allow updating rows.         | Credential requirement                                  |
| This workflow is optimized for property listings management to streamline marketing collateral. | Use case context                                        |

---

This concludes the comprehensive analysis and reconstruction guide for the "Property Link Shortener & QR Code Generator" workflow.