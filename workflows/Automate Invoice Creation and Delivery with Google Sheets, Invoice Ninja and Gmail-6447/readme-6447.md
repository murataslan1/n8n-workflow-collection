Automate Invoice Creation and Delivery with Google Sheets, Invoice Ninja and Gmail

https://n8nworkflows.xyz/workflows/automate-invoice-creation-and-delivery-with-google-sheets--invoice-ninja-and-gmail-6447


# Automate Invoice Creation and Delivery with Google Sheets, Invoice Ninja and Gmail

---

### 1. Workflow Overview

This workflow automates the creation and delivery of invoices triggered by project status updates in Google Sheets. When a project’s status changes to "Ready for Invoice" in a Google Sheets document, the workflow initiates an invoice creation process via the Invoice Ninja API, sends the generated invoice to the client through Gmail, and finally updates the project status in Google Sheets to "Invoiced."

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Detects status changes in Google Sheets that indicate a project is ready for invoicing.
- **1.2 Invoice Creation:** Sends relevant project data to the Invoice Ninja API to create an invoice.
- **1.3 Invoice Delivery:** Emails the newly created invoice to the client using Gmail.
- **1.4 Status Update:** Updates the project’s status in Google Sheets to reflect that invoicing is complete.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block monitors a Google Sheets document for changes in project status. It triggers the workflow when a project status is updated to "Ready for Invoice."

- **Nodes Involved:**  
  - 0. Google Sheets (Invoice Trigger)

- **Node Details:**

  - **Node Name:** 0. Google Sheets (Invoice Trigger)  
  - **Type:** Google Sheets Trigger  
  - **Technical Role:** Watches for changes in a specific Google Sheets spreadsheet and triggers the workflow when conditions are met.  
  - **Configuration:**  
    - Connected to the Google Sheets document containing project data.  
    - Configured to watch for row changes, specifically when the status column changes to "Ready for Invoice."  
  - **Key Expressions/Variables:**  
    - Filters or expressions based on the project status column for "Ready for Invoice" string.  
  - **Input Connections:** None (trigger node).  
  - **Output Connections:** Connects to the HTTP Request node to initiate invoice creation.  
  - **Version-Specific Requirements:** Uses typeVersion 1; compatible with standard Google Sheets trigger capabilities.  
  - **Potential Failures:**  
    - Authorization errors if Google Sheets credentials expire or are invalid.  
    - Missed triggers if the status update does not match the expected string exactly (case sensitivity, extra spaces).  
    - Network issues causing delayed or missed triggers.  
  - **Sub-Workflow Reference:** None.

#### 2.2 Invoice Creation

- **Overview:**  
  This block sends project data to the Invoice Ninja API to create a new invoice based on the triggered event.

- **Nodes Involved:**  
  - 1. HTTP Request (Create Invoice)

- **Node Details:**

  - **Node Name:** 1. HTTP Request (Create Invoice)  
  - **Type:** HTTP Request  
  - **Technical Role:** Sends an HTTP POST request to the Invoice Ninja API endpoint to create an invoice with the provided project details.  
  - **Configuration:**  
    - HTTP method: POST  
    - URL: Invoice Ninja API invoice creation endpoint  
    - Authentication: API key or token in headers as per Invoice Ninja API requirements.  
    - Body: JSON payload containing client data, project details, line items, amounts, and invoice metadata extracted from the Google Sheets trigger data.  
  - **Key Expressions/Variables:**  
    - Dynamic mapping of project fields from Google Sheets to the API request body fields (e.g., client name, project description, amounts).  
  - **Input Connections:** Receives data from Google Sheets trigger node.  
  - **Output Connections:** Passes the created invoice data to the Gmail node for email delivery.  
  - **Version-Specific Requirements:** Uses typeVersion 1; standard HTTP request node functionalities.  
  - **Potential Failures:**  
    - API authentication errors (invalid or expired API key).  
    - Network timeouts or connectivity issues.  
    - API rate limits or quota exceeded errors.  
    - Malformed request payload if input data is incomplete or incorrectly formatted.  
  - **Sub-Workflow Reference:** None.

#### 2.3 Invoice Delivery

- **Overview:**  
  This block emails the newly created invoice to the client using Gmail.

- **Nodes Involved:**  
  - 2. Gmail (Send Invoice)

- **Node Details:**

  - **Node Name:** 2. Gmail (Send Invoice)  
  - **Type:** Gmail Node  
  - **Technical Role:** Sends an email containing the invoice to the client’s email address.  
  - **Configuration:**  
    - Authenticated with OAuth2 credentials for a Gmail account.  
    - Email fields: recipient address (client’s email), subject line, body text, and attachment(s) if applicable (e.g., PDF invoice).  
    - Dynamic content generation for email body using invoice data returned by the HTTP Request node.  
  - **Key Expressions/Variables:**  
    - Recipient email extracted from invoice or project data.  
    - Invoice link or attachment included in the email body or attachments.  
  - **Input Connections:** Receives invoice data from HTTP Request node.  
  - **Output Connections:** Connects to the Google Sheets update node to finalize the workflow.  
  - **Version-Specific Requirements:** Uses typeVersion 1; requires Gmail OAuth2 credentials properly configured.  
  - **Potential Failures:**  
    - Authentication errors if Gmail OAuth tokens expire or are revoked.  
    - Email sending failures due to invalid recipient addresses.  
    - Attachment size limits or formatting issues.  
    - Gmail API rate limits.  
  - **Sub-Workflow Reference:** None.

#### 2.4 Status Update

- **Overview:**  
  This block updates the Google Sheets document to mark the project status as "Invoiced" after successful invoice creation and email delivery.

- **Nodes Involved:**  
  - 3. Google Sheets (Update Status)

- **Node Details:**

  - **Node Name:** 3. Google Sheets (Update Status)  
  - **Type:** Google Sheets Node (write/update)  
  - **Technical Role:** Writes back to the Google Sheets document to update the project’s status cell.  
  - **Configuration:**  
    - Writes "Invoiced" to the status column for the corresponding project row.  
    - Uses row ID or unique identifier passed along from previous nodes to target the correct row.  
  - **Key Expressions/Variables:**  
    - Dynamic row selection based on the project triggered initially.  
    - Sets status value explicitly to "Invoiced."  
  - **Input Connections:** Receives execution from Gmail node after email sending.  
  - **Output Connections:** None (terminal node).  
  - **Version-Specific Requirements:** Uses typeVersion 3; Google Sheets node version supporting updates.  
  - **Potential Failures:**  
    - Authorization errors if Google Sheets credentials are invalid.  
    - Failures if the row cannot be found or is locked.  
    - Network or API errors.  
  - **Sub-Workflow Reference:** None.

---

### 3. Summary Table

| Node Name                     | Node Type               | Functional Role                | Input Node(s)               | Output Node(s)                | Sticky Note                    |
|-------------------------------|-------------------------|-------------------------------|-----------------------------|------------------------------|-------------------------------|
| 0. Google Sheets (Invoice Trigger) | Google Sheets Trigger     | Detect project status change   | None                        | 1. HTTP Request (Create Invoice) |                               |
| 1. HTTP Request (Create Invoice)    | HTTP Request             | Create invoice via API         | 0. Google Sheets (Invoice Trigger)  | 2. Gmail (Send Invoice)        |                               |
| 2. Gmail (Send Invoice)              | Gmail                    | Send invoice email to client   | 1. HTTP Request (Create Invoice)     | 3. Google Sheets (Update Status) |                               |
| 3. Google Sheets (Update Status)    | Google Sheets (Update)   | Update project status to 'Invoiced' | 2. Gmail (Send Invoice)           | None                         |                               |
| Sticky Note                        | Sticky Note              | (Empty)                       |                             |                              |                               |
| Sticky Note1                       | Sticky Note              | (Empty)                       |                             |                              |                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node: Google Sheets Trigger**  
   - Type: Google Sheets Trigger  
   - Connect to the Google Sheets document holding project data.  
   - Configure to watch for row changes where the project status column changes to "Ready for Invoice."  
   - Ensure Google Sheets OAuth2 credentials are set up and authorized.  

2. **Create HTTP Request Node: Create Invoice**  
   - Type: HTTP Request  
   - Connect input from the Google Sheets Trigger node.  
   - Set method to POST.  
   - Enter Invoice Ninja API endpoint URL for invoice creation.  
   - Add authentication headers with your Invoice Ninja API key/token.  
   - Configure JSON body to include dynamic data from the Google Sheets node (client info, line items, amounts).  
   - Test the request to confirm correct API response.  

3. **Create Gmail Node: Send Invoice**  
   - Type: Gmail  
   - Connect input from the HTTP Request node.  
   - Set up OAuth2 credentials for the Gmail account to send emails.  
   - Configure email fields:  
     - Recipient: dynamically set to the client’s email from invoice data.  
     - Subject: e.g., "Your Invoice from [Company Name]"  
     - Body: include invoice details or link.  
     - Attach invoice PDF if available.  
   - Test email sending functionality.  

4. **Create Google Sheets Node: Update Status**  
   - Type: Google Sheets (Update)  
   - Connect input from the Gmail node.  
   - Configure to update the project status column in the same Google Sheets document.  
   - Use the row ID or unique identifier to locate the correct row.  
   - Set the status value to "Invoiced."  
   - Confirm write permissions and test update functionality.  

5. **Connect Nodes in Sequence:**  
   - Google Sheets Trigger → HTTP Request → Gmail → Google Sheets Update  

6. **Set Execution Order:**  
   - Ensure execution order is sequential and each node passes data correctly to the next.  

7. **Activate the Workflow:**  
   - Enable trigger node and test end-to-end automation by changing a project status in Google Sheets to "Ready for Invoice."  

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                             |
|----------------------------------------------------------------------------------------------------|---------------------------------------------|
| The workflow automates invoice creation for projects marked "Ready for Invoice" in Google Sheets.  | Workflow purpose description                 |
| Requires valid API credentials for Invoice Ninja and Gmail OAuth2 credentials for email sending.   | Important credential setup                    |
| Invoice Ninja API documentation: https://invoiceninja.github.io/api-docs/                           | API reference for invoice creation setup    |
| Gmail API limits and quota considerations should be reviewed to avoid sending failures.            | Gmail API usage guidelines                    |
| Google Sheets trigger may require exact match on status text; ensure data consistency.             | Data validation note                          |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---