Automate Digital Product Sales & Delivery for n8n Templates with Stripe and Email

https://n8nworkflows.xyz/workflows/automate-digital-product-sales---delivery-for-n8n-templates-with-stripe-and-email-9063


# Automate Digital Product Sales & Delivery for n8n Templates with Stripe and Email

### 1. Workflow Overview

This workflow automates the sales and delivery of digital products specifically tailored for n8n templates using Stripe for payment processing and email for delivery. It handles incoming Stripe payment events, verifies and processes payment information, retrieves product data from Google Sheets, manages digital product files in Google Drive, and sends emails to customers via Microsoft Outlook.

The workflow is logically divided into the following blocks:

- **1.1 Stripe Payment Event Reception and Deduplication:** Captures Stripe events via webhook and removes duplicate events to ensure idempotent processing.
- **1.2 Payment Information Retrieval and Validation:** Retrieves detailed payment information from Stripe and verifies the payment status.
- **1.3 Product Data Lookup:** Accesses Google Sheets to obtain product and pricing details based on payment metadata.
- **1.4 Delivery Preparation:** Prepares digital product delivery data, including accessing files in Google Drive.
- **1.5 Email Delivery and Notifications:** Sends the purchased digital product or relevant email notifications to the customer using Microsoft Outlook.
- **1.6 Conditional Content Rendering:** Uses a switch node to conditionally generate HTML email content based on payment or product type.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Stripe Payment Event Reception and Deduplication

- **Overview:**  
  This block receives payment events from Stripe via webhook, ensuring that duplicate events are filtered out to avoid redundant processing.

- **Nodes Involved:**  
  - Stripe (stripeTrigger)  
  - D (removeDuplicates)

- **Node Details:**

  - **Stripe (stripeTrigger)**
    - *Type & Role:* Stripe webhook trigger node; listens for Stripe events such as payment_intent.succeeded.
    - *Configuration:* Uses a webhook with ID `25e801ab-7c11-4330-a8df-239e9fda97ad` configured in Stripe dashboard.
    - *Input/Output:* No input (trigger node); outputs event data to "D".
    - *Edge Cases:* Possible webhook signature verification failure; network timeouts; Stripe API changes.
    - *Version:* 1 (no special version constraints).

  - **D (removeDuplicates)**
    - *Type & Role:* Ensures no duplicate Stripe events are processed, preventing double fulfillment.
    - *Configuration:* Uses default settings to remove duplicates based on event IDs or unique identifiers.
    - *Input/Output:* Input from Stripe node; output to "PI".
    - *Edge Cases:* If duplicates are not correctly identified, potential double processing; if data format changes, expressions may fail.

#### Block 1.2: Payment Information Retrieval and Validation

- **Overview:**  
  Retrieves detailed payment information from Stripe API, checks payment status, then forwards data for product code extraction or triggers notification on failure.

- **Nodes Involved:**  
  - PI (httpRequest)  
  - PC (stripe)  
  - PD (set)  
  - N (Microsoft Outlook) - notification on errors

- **Node Details:**

  - **PI (httpRequest)**
    - *Type & Role:* Makes API call to Stripe to fetch detailed payment information.
    - *Configuration:* Configured with Stripe API endpoint, uses authentication credentials.
    - *Input/Output:* Input from removeDuplicates; outputs to PC and N nodes.
    - *Edge Cases:* HTTP errors, invalid API keys, rate limiting, unexpected data format.
    - *Error Handling:* Continues on error output to N (notification).

  - **PC (stripe)**
    - *Type & Role:* Processes Stripe payment details; may be configured to retrieve payment intent or charges.
    - *Configuration:* Uses Stripe API credentials; extracts payment status and metadata.
    - *Input/Output:* Input from PI; outputs to PD (set) and N (notification).
    - *Edge Cases:* Authentication failures, API errors, payment status unexpected values.

  - **PD (set)**
    - *Type & Role:* Prepares and formats payment-related data, possibly extracting product IDs or customer info.
    - *Configuration:* Sets variables/fields required for next steps.
    - *Input/Output:* Input from PC; outputs to AP (Google Sheets).
    - *Edge Cases:* Expression errors if expected fields missing.

  - **N (Microsoft Outlook)**
    - *Type & Role:* Sends notification emails, likely error or alert emails upon failure.
    - *Configuration:* Uses Outlook OAuth2 credentials.
    - *Input/Output:* Input from PI and PC error outputs.
    - *Edge Cases:* Email sending failures, credential expiry.

#### Block 1.3: Product Data Lookup

- **Overview:**  
  Looks up product and pricing details from Google Sheets based on the payment metadata. This informs which product files to deliver.

- **Nodes Involved:**  
  - AP (Google Sheets)  
  - GT (Google Sheets)  
  - GSW (executeWorkflow)

- **Node Details:**

  - **AP (Google Sheets)**
    - *Type & Role:* Reads product ID or code related data from a Google Sheet.
    - *Configuration:* Configured with Google Sheets credentials, sheet ID, and range.
    - *Input/Output:* Input from PD; outputs to GT.
    - *Edge Cases:* Sheet access errors, API quota exceeded.

  - **GT (Google Sheets)**
    - *Type & Role:* Reads additional or complementary product/pricing data.
    - *Configuration:* Similar to AP, with possibly different sheet or range.
    - *Input/Output:* Input from AP; outputs to GSW.
    - *Edge Cases:* Same as AP.

  - **GSW (executeWorkflow)**
    - *Type & Role:* Calls a sub-workflow, likely to perform complex product data processing or further validation.
    - *Configuration:* References another workflow with input/output parameters.
    - *Input/Output:* Input from GT; outputs to ED (set) and N (notification).
    - *Edge Cases:* Sub-workflow failures, input/output mismatch.

#### Block 1.4: Delivery Preparation

- **Overview:**  
  Prepares digital product files from Google Drive for delivery based on the product data retrieved.

- **Nodes Involved:**  
  - ED (set)  
  - SJ (Google Drive)  
  - SJ1 (Google Drive)

- **Node Details:**

  - **ED (set)**
    - *Type & Role:* Sets variables or metadata needed to locate and prepare digital files in Google Drive.
    - *Configuration:* May set file IDs, paths, or email variables.
    - *Input/Output:* Input from GSW; outputs to SJ.
    - *Edge Cases:* Missing or incorrect metadata causing file lookup failure.

  - **SJ (Google Drive)**
    - *Type & Role:* Accesses Google Drive to locate/download files.
    - *Configuration:* Uses Google Drive OAuth2 credentials; configured to find files by ID or query.
    - *Input/Output:* Input from ED; outputs to SJ1.
    - *Edge Cases:* File not found, permission issues.

  - **SJ1 (Google Drive)**
    - *Type & Role:* Further processing or retrieval of files (e.g., downloading or preparing share links).
    - *Configuration:* Similar to SJ; may generate public URLs or attachments.
    - *Input/Output:* Input from SJ; outputs to SE (Microsoft Outlook).
    - *Edge Cases:* File sharing permission errors.

#### Block 1.5: Email Delivery and Notifications

- **Overview:**  
  Sends the digital product and notifications to customers via Microsoft Outlook email.

- **Nodes Involved:**  
  - SE (Microsoft Outlook)  
  - E (Microsoft Outlook)  
  - N (Microsoft Outlook) (also used in error notifications)

- **Node Details:**

  - **SE (Microsoft Outlook)**
    - *Type & Role:* Sends the main product delivery email with attachments or download links.
    - *Configuration:* Uses Outlook OAuth2 credentials; email content and recipients dynamically set.
    - *Input/Output:* Input from SJ1; outputs to E.
    - *Edge Cases:* Email sending failures, attachment size limits.

  - **E (Microsoft Outlook)**
    - *Type & Role:* Sends follow-up or confirmation emails.
    - *Configuration:* Similar to SE.
    - *Input/Output:* Input from SE.
    - *Edge Cases:* Same as SE.

  - **N (Microsoft Outlook)**
    - *Also used in error notification as explained in Block 1.2.*

#### Block 1.6: Conditional Content Rendering

- **Overview:**  
  Based on payment or product type, this block dynamically generates email content in HTML format with three different branches for different cases.

- **Nodes Involved:**  
  - Switch1 (switch)  
  - G1 (html)  
  - G2 (html)  
  - G3 (html)

- **Node Details:**

  - **Switch1 (switch)**
    - *Type & Role:* Routes flow depending on a condition (e.g., product type or payment status).
    - *Configuration:* Uses expressions to direct to one of three HTML nodes.
    - *Input/Output:* Input from somewhere in the flow (not explicitly connected in JSON); outputs to G1, G2, or G3.
    - *Edge Cases:* Misconfiguration may lead to no path being matched.

  - **G1, G2, G3 (html)**
    - *Type & Role:* Generate different HTML email templates for different product types or scenarios.
    - *Configuration:* HTML content is likely customized per product or customer.
    - *Input/Output:* Inputs from Switch1; outputs to email nodes (not explicitly shown).
    - *Edge Cases:* HTML formatting errors, encoding issues.

---

### 3. Summary Table

| Node Name    | Node Type           | Functional Role                                 | Input Node(s)        | Output Node(s)      | Sticky Note |
|--------------|---------------------|------------------------------------------------|----------------------|---------------------|-------------|
| Sticky Note  | stickyNote           | Not functionally connected                      | -                    | -                   |             |
| Sticky Note2 | stickyNote           | Not functionally connected                      | -                    | -                   |             |
| Stripe       | stripeTrigger        | Stripe webhook listener for payment events     | -                    | D                   |             |
| D            | removeDuplicates     | Filters duplicate Stripe events                 | Stripe               | PI                  |             |
| PI           | httpRequest          | Retrieves detailed payment info from Stripe API| D                    | PC, N                |             |
| PC           | stripe              | Processes payment data, checks payment status  | PI                   | PD, N                |             |
| PD           | set                 | Prepares payment data for product lookup       | PC                   | AP                  |             |
| AP           | googleSheets         | Reads product info from Google Sheets           | PD                   | GT                  |             |
| GT           | googleSheets         | Reads additional product/pricing data           | AP                   | GSW                 |             |
| GSW          | executeWorkflow      | Calls sub-workflow for product processing       | GT                   | ED, N                |             |
| ED           | set                 | Prepares data for Google Drive file access      | GSW                  | SJ                  |             |
| SJ           | googleDrive          | Retrieves product files from Google Drive       | ED                   | SJ1                 |             |
| SJ1          | googleDrive          | Further file processing or sharing setup        | SJ                   | SE                  |             |
| SE           | microsoftOutlook     | Sends product delivery email                      | SJ1                  | E                   |             |
| E            | microsoftOutlook     | Sends confirmation/follow-up email               | SE                   | -                   |             |
| N            | microsoftOutlook     | Sends error or notification emails               | PI, PC, GSW          | -                   |             |
| Switch1      | switch               | Routes flow based on condition                    | - (not connected)    | G1, G2, G3           |             |
| G1           | html                 | Generates HTML email content variant 1           | Switch1               | -                   |             |
| G2           | html                 | Generates HTML email content variant 2           | Switch1               | -                   |             |
| G3           | html                 | Generates HTML email content variant 3           | Switch1               | -                   |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Stripe Trigger Node**
   - Type: Stripe Trigger
   - Configure webhook ID and Stripe API credentials.
   - Set to listen for payment events (e.g., payment_intent.succeeded).
   - Position it as the entry point.

2. **Add Remove Duplicates Node**
   - Type: Remove Duplicates
   - Connect input from Stripe Trigger.
   - Configure to remove duplicate Stripe event IDs.

3. **Add HTTP Request Node (PI)**
   - Type: HTTP Request
   - Connect input from Remove Duplicates.
   - Configure to GET detailed payment info from Stripe API.
   - Use an HTTP header for authorization (`Bearer <secret_key>`).
   - Enable error output to continue processing.

4. **Add Stripe Node (PC)**
   - Type: Stripe
   - Connect input from HTTP Request.
   - Configure to parse payment details, extract status and metadata.
   - Set error output to continue.
   - Connect one output to next Set node, another to Outlook notification.

5. **Add Set Node (PD)**
   - Type: Set
   - Connect input from Stripe Node.
   - Configure expressions to extract product codes, customer info, and prepare data for Google Sheets lookup.

6. **Add Google Sheets Node (AP)**
   - Type: Google Sheets
   - Connect input from PD.
   - Configure with Google Sheets credentials.
   - Set to read product-related metadata (e.g., product ID, price).

7. **Add Google Sheets Node (GT)**
   - Type: Google Sheets
   - Connect input from AP.
   - Configure to read additional pricing or product details.

8. **Add Execute Workflow Node (GSW)**
   - Type: Execute Workflow
   - Connect input from GT.
   - Configure to call a sub-workflow handling advanced product processing.
   - Map inputs/outputs accordingly.
   - Enable error handling to continue.

9. **Add Set Node (ED)**
   - Type: Set
   - Connect input from GSW.
   - Configure to set file IDs or paths for Google Drive.

10. **Add Google Drive Node (SJ)**
    - Type: Google Drive
    - Connect input from ED.
    - Configure with OAuth2 credentials.
    - Query or locate files specific to purchased product.

11. **Add Google Drive Node (SJ1)**
    - Type: Google Drive
    - Connect input from SJ.
    - Configure to prepare file sharing links or download files.

12. **Add Microsoft Outlook Node (SE)**
    - Type: Microsoft Outlook
    - Connect input from SJ1.
    - Configure to send product delivery email to customer.
    - Use Outlook OAuth2 credentials.

13. **Add Microsoft Outlook Node (E)**
    - Type: Microsoft Outlook
    - Connect input from SE.
    - Configure for sending follow-up or confirmation email.

14. **Add Microsoft Outlook Node (N)**
    - Type: Microsoft Outlook
    - Connect error outputs from PI, PC, and GSW to N.
    - Configure to send error or notification emails.

15. **Add Switch Node (Switch1)**
    - Type: Switch
    - Configure routing conditions based on product or payment metadata.
    - Connect to three HTML nodes for conditional email content.

16. **Add HTML Nodes (G1, G2, G3)**
    - Type: HTML
    - Connect each from Switch1 outputs.
    - Configure each node with different email template HTML content.

17. **Credential Setup**
    - Set up Stripe API credentials with required permissions.
    - Configure Google Sheets and Google Drive OAuth2 credentials.
    - Configure Microsoft Outlook OAuth2 credentials with send permissions.

18. **Testing**
    - Test Stripe webhook integration.
    - Verify Google Sheets data retrieval.
    - Confirm Google Drive file accessibility.
    - Test email sending via Outlook.
    - Validate error handling paths.

---

### 5. General Notes & Resources

| Note Content                                                                 | Context or Link                                                  |
|------------------------------------------------------------------------------|-----------------------------------------------------------------|
| The workflow automates digital product delivery specifically for n8n templates. | Project-specific context.                                       |
| Stripe Webhook must be configured in Stripe dashboard to point to the workflow webhook URL. | Stripe Dashboard Setup.                                         |
| Google Sheets must contain up-to-date product and pricing information.       | Google Sheets product catalog.                                  |
| Google Drive must contain the digital product files with correct access rights. | Google Drive file permissions.                                  |
| Microsoft Outlook OAuth2 requires proper consent for sending emails.         | Microsoft Azure Portal OAuth2 setup for Outlook.                |
| Consider enabling logging and error notification for better monitoring.      | Best practice for production workflows.                         |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.