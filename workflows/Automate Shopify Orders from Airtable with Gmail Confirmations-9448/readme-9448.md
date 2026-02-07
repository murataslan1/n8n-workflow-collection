Automate Shopify Orders from Airtable with Gmail Confirmations

https://n8nworkflows.xyz/workflows/automate-shopify-orders-from-airtable-with-gmail-confirmations-9448


# Automate Shopify Orders from Airtable with Gmail Confirmations

### 1. Workflow Overview

This workflow automates the process of creating Shopify orders based on order data stored in Airtable and sends order confirmation emails via Gmail. It is designed to be triggered by an Airtable Automation when an order is marked as ready. The workflow comprises several logical blocks:

- **1.1 Trigger Reception:** Receive order record ID from Airtable via webhook.
- **1.2 Order & Customer Data Retrieval:** Fetch complete order and customer details from Airtable.
- **1.3 Product Line Items Retrieval:** Fetch associated product line items for the order from Airtable.
- **1.4 Shopify Order Creation:** Use gathered data to create a new order in Shopify.
- **1.5 Confirmation Email Sending:** Send a styled HTML order confirmation email to the customer via Gmail.
- **1.6 Email Sent Confirmation:** Verify that the confirmation email was successfully sent.
- **1.7 Airtable Status Update:** Update the original Airtable order record to mark it as processed and prevent duplicate triggers.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger Reception

- **Overview:**  
  This block serves as the entry point of the workflow. It listens for an incoming webhook call triggered by an Airtable Automation, which includes the unique record ID of an order ready for processing.

- **Nodes Involved:**  
  - Trigger from Airtable  
  - Sticky Note (explaining trigger usage)

- **Node Details:**  
  - **Trigger from Airtable**  
    - *Type:* Webhook (n8n-nodes-base.webhook)  
    - *Configuration:*  
      - Webhook path is fixed (`f4e69e57-40f0-4af9-b44d-17eb9389b427`)  
      - Waits for HTTP POST from Airtable Automation, receiving `recordId` in query parameters.  
    - *Expressions:* Accesses `recordId` via `{{$json.query.recordId}}`  
    - *Connections:* Output connects to "Fetch Order & Customer Details" node  
    - *Edge cases:* Missing or invalid `recordId` would cause failure downstream; webhook URL must be correctly set in Airtable Automation.  
    - *Version:* v2.1  
  - **Sticky Note**  
    - Explains the trigger’s role and instructs to copy the production URL to Airtable Automation.

#### 2.2 Order & Customer Data Retrieval

- **Overview:**  
  Using the received record ID, this block fetches the full order record from Airtable, including customer details necessary for Shopify order creation.

- **Nodes Involved:**  
  - Fetch Order & Customer Details  
  - Sticky Note (explaining this step)

- **Node Details:**  
  - **Fetch Order & Customer Details**  
    - *Type:* Airtable (n8n-nodes-base.airtable)  
    - *Configuration:*  
      - Uses record ID from webhook (`{{$json.query.recordId}}`) to fetch a single order record from Airtable base `appQTd8PXDgHdjOpr`, table `Orders` (`tblEXxxmfYYsMDLC9`).  
      - Retrieves fields including customer name, email, shipping address, and linked order line items.  
    - *Input:* Receives from webhook node  
    - *Output:* Passes record data downstream  
    - *Edge cases:* Invalid record ID, missing fields, or Airtable API failures can cause errors.  
    - *Version:* v2.1  
  - **Sticky Note**  
    - Describes this step’s purpose: turning an ID into a full customer/order profile.

#### 2.3 Product Line Items Retrieval

- **Overview:**  
  Using the order’s linked line items record ID, this block fetches detailed product data (product name, quantity, price) from Airtable.

- **Nodes Involved:**  
  - Fetch Product Line Items  
  - Sticky Note (explaining this step)

- **Node Details:**  
  - **Fetch Product Line Items**  
    - *Type:* Airtable  
    - *Configuration:*  
      - Uses the first linked record ID from the order’s `Order Line Items` field (`{{$json['Order Line Items'][0]}}`)  
      - Retrieves product details from Airtable base `appQTd8PXDgHdjOpr`, table `Order Line Items` (`tblC9b18Rf1uZZW7m`).  
    - *Input:* Receives from "Fetch Order & Customer Details"  
    - *Output:* Passes product info downstream  
    - *Edge cases:* Missing or invalid linked record ID, or multiple line items not handled (only first item used).  
    - *Version:* v2.1  
  - **Sticky Note**  
    - Explains that this step builds the order’s product content for Shopify.

#### 2.4 Shopify Order Creation

- **Overview:**  
  Combines customer and product data to create a new order in Shopify using OAuth2 authentication.

- **Nodes Involved:**  
  - Create the Order in Shopify  
  - Sticky Note (explaining this step)

- **Node Details:**  
  - **Create the Order in Shopify**  
    - *Type:* Shopify (n8n-nodes-base.shopify)  
    - *Configuration:*  
      - Authenticated via OAuth2  
      - Line items mapped from product data fields: price, title, quantity, productId (mapped from product name field)  
      - Shipping address and customer email pulled from the fetched order/customer details  
    - *Expressions:* Accesses prior nodes’ data with expressions like `$('Fetch Order & Customer Details').item.json['Email ID']`  
    - *Input:* Receives product line items data  
    - *Output:* Passes created Shopify order data downstream  
    - *Edge cases:* Shopify API errors, invalid product IDs, missing required fields, or authentication failures.  
    - *Version:* v1  
  - **Sticky Note**  
    - Highlights key mappings and the core function of creating a real Shopify transaction.

#### 2.5 Confirmation Email Sending

- **Overview:**  
  Sends a professionally styled HTML email to the customer confirming the order, using Gmail.

- **Nodes Involved:**  
  - Send Order Confirmation Email  
  - Sticky Note (explaining this step)

- **Node Details:**  
  - **Send Order Confirmation Email**  
    - *Type:* Gmail (n8n-nodes-base.gmail)  
    - *Configuration:*  
      - Sends to a fixed email address (for test or admin): `samartian8@gmail.com` (note: real customer email is not dynamically used here)  
      - Subject: "Order Confirmed !"  
      - Message: HTML template using data from Shopify order node and Airtable product node, including order number, date, total, product name, quantity, and price.  
      - Uses expressions to access Shopify order JSON and Airtable product JSON for dynamic content.  
    - *Input:* Receives from Shopify order creation node  
    - *Output:* Passes Gmail response downstream  
    - *Edge cases:* Gmail API errors, authentication failures, invalid email address, or expression evaluation errors.  
    - *Version:* v2.1  
  - **Sticky Note**  
    - Describes the email template, customization, and data used.

#### 2.6 Email Sent Confirmation

- **Overview:**  
  Checks the Gmail node output to confirm the email was successfully sent before proceeding.

- **Nodes Involved:**  
  - Confirm Email Sent? (IF node)  
  - Sticky Note (explaining this step)

- **Node Details:**  
  - **Confirm Email Sent?**  
    - *Type:* IF (n8n-nodes-base.if)  
    - *Configuration:*  
      - Checks if the first label ID from Gmail response equals "SENT"  
      - Condition: `{{$json.labelIds[0]}} == "SENT"`  
    - *Input:* Receives Gmail node output  
    - *Output:*  
      - True branch: proceeds to Airtable update  
      - False branch: stops workflow  
    - *Edge cases:* Label may not exist or differ; Gmail API response format changes; false negatives blocking workflow progress.  
    - *Version:* v2.2  
  - **Sticky Note**  
    - Explains importance of this checkpoint to avoid marking order done if email not sent.

#### 2.7 Airtable Status Update

- **Overview:**  
  Updates the original Airtable order record to mark the Shopify order as completed, preventing duplicate processing.

- **Nodes Involved:**  
  - Close the Loop - Update Airtable Status  
  - Sticky Note (explaining this step)

- **Node Details:**  
  - **Close the Loop - Update Airtable Status**  
    - *Type:* Airtable  
    - *Configuration:*  
      - Updates record by ID from "Fetch Order & Customer Details" node (`$('Fetch Order & Customer Details').item.json.id`)  
      - Sets field `Shopify Ordered` to "Done"  
      - Uses Airtable base `appQTd8PXDgHdjOpr`, table `Orders`  
    - *Input:* Receives from IF node (true branch)  
    - *Output:* Final node, ends workflow  
    - *Edge cases:* Airtable API failures, permission issues, record locking, or missing record ID cause update failure.  
    - *Version:* v2.1  
  - **Sticky Note**  
    - Explains this final step's importance to prevent re-triggering on same order.

---

### 3. Summary Table

| Node Name                      | Node Type         | Functional Role                          | Input Node(s)               | Output Node(s)                     | Sticky Note                                          |
|--------------------------------|-------------------|----------------------------------------|-----------------------------|----------------------------------|------------------------------------------------------|
| Sticky Note                   | Sticky Note       | Explains trigger usage                  |                             |                                  | ##  The Trigger... Copy 'Production URL' to Airtable Automation. |
| Trigger from Airtable          | Webhook           | Receives order ID from Airtable         |                             | Fetch Order & Customer Details   |                                                      |
| Sticky Note1                  | Sticky Note       | Explains order & customer data fetch    |                             |                                  | ##  Fetch Order & Customer Details... profile creation. |
| Fetch Order & Customer Details | Airtable          | Fetch full order and customer details   | Trigger from Airtable        | Fetch Product Line Items         |                                                      |
| Sticky Note2                  | Sticky Note       | Explains product line items retrieval   |                             |                                  | ##   Fetch Product Line Items... builds order content. |
| Fetch Product Line Items       | Airtable          | Fetch product details for order         | Fetch Order & Customer Details | Create the Order in Shopify     |                                                      |
| Sticky Note3                  | Sticky Note       | Explains Shopify order creation         |                             |                                  | ##  Create the Order in Shopify... core action.     |
| Create the Order in Shopify    | Shopify           | Creates order in Shopify                 | Fetch Product Line Items     | Send Order Confirmation Email    |                                                      |
| Sticky Note4                  | Sticky Note       | Explains confirmation email sending     |                             |                                  | ##  Send Order Confirmation Email... professional HTML template. |
| Send Order Confirmation Email | Gmail             | Sends confirmation email via Gmail      | Create the Order in Shopify  | Confirm Email Sent?              |                                                      |
| Sticky Note6                  | Sticky Note       | Explains email sent confirmation check  |                             |                                  | ##  Confirm Email Sent?... prevents false completion. |
| Confirm Email Sent?            | IF                | Checks if email was successfully sent   | Send Order Confirmation Email | Close the Loop - Update Airtable Status |                                                      |
| Sticky Note5                  | Sticky Note       | Explains Airtable status update          |                             |                                  | ##  Close the Loop - Update Airtable Status... prevents duplicate triggers. |
| Close the Loop - Update Airtable Status | Airtable  | Marks order as done in Airtable          | Confirm Email Sent? (true)   |                                  |                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node ("Trigger from Airtable")**  
   - Type: Webhook (v2.1)  
   - Set path: `f4e69e57-40f0-4af9-b44d-17eb9389b427`  
   - No authentication  
   - This node waits for POST requests from Airtable Automation, expecting a `recordId` in query parameters.

2. **Create Airtable Node ("Fetch Order & Customer Details")**  
   - Type: Airtable (v2.1)  
   - Credentials: Connect Airtable API credentials for base `appQTd8PXDgHdjOpr`  
   - Operation: Get a record by ID  
   - Base: Select `appQTd8PXDgHdjOpr`  
   - Table: Select `Orders` (`tblEXxxmfYYsMDLC9`)  
   - Record ID: Set expression `{{$json.query.recordId}}` from webhook output  
   - Connect input from "Trigger from Airtable" output

3. **Create Airtable Node ("Fetch Product Line Items")**  
   - Type: Airtable (v2.1)  
   - Credentials: Same Airtable credentials  
   - Operation: Get record by ID  
   - Base: `appQTd8PXDgHdjOpr`  
   - Table: `Order Line Items` (`tblC9b18Rf1uZZW7m`)  
   - Record ID: Expression: `{{$json["Order Line Items"][0]}}` from "Fetch Order & Customer Details" output  
   - Connect input from "Fetch Order & Customer Details" output

4. **Create Shopify Node ("Create the Order in Shopify")**  
   - Type: Shopify (v1)  
   - Credentials: Setup OAuth2 credentials for your Shopify store  
   - Operation: Create Order  
   - Authentication: OAuth2  
   - Map Line Items:  
     - Price: `{{$json.Price}}` (from product line items)  
     - Title: `{{$json.Title}}`  
     - Quantity: `{{$json.Quantity}}`  
     - Product ID: `{{$json["Product Name"]}}`  
   - Additional Fields:  
     - Email: `{{$('Fetch Order & Customer Details').item.json['Email ID']}}`  
     - Shipping Address: Map all fields (First Name, Last Name, Address lines, City, Province, Zip, Country, Phone) similarly from "Fetch Order & Customer Details" node  
   - Connect input from "Fetch Product Line Items" output

5. **Create Gmail Node ("Send Order Confirmation Email")**  
   - Type: Gmail (v2.1)  
   - Credentials: Setup Gmail OAuth2 credentials  
   - Operation: Send Email  
   - To: (Currently hardcoded) `samartian8@gmail.com` (can be replaced by dynamic customer email)  
   - Subject: `Order Confirmed !`  
   - Message (HTML): Use the provided HTML template, embedding expressions for order number, date, total, product name, quantity, and price from Shopify order and Airtable product nodes.  
   - Connect input from "Create the Order in Shopify" output

6. **Create IF Node ("Confirm Email Sent?")**  
   - Type: IF (v2.2)  
   - Condition: Check if first item in `labelIds` array equals `"SENT"`  
   - Expression: `{{$json.labelIds[0]}} == "SENT"`  
   - Connect input from "Send Order Confirmation Email" output  
   - True branch: proceed to Airtable update  
   - False branch: end workflow

7. **Create Airtable Node ("Close the Loop - Update Airtable Status")**  
   - Type: Airtable (v2.1)  
   - Credentials: Same Airtable credentials  
   - Operation: Update record  
   - Base: `appQTd8PXDgHdjOpr`  
   - Table: `Orders` (`tblEXxxmfYYsMDLC9`)  
   - Record ID: `{{$('Fetch Order & Customer Details').item.json.id}}`  
   - Fields to update: Set `Shopify Ordered` to `"Done"`  
   - Connect input from IF node's true output

8. **Add Sticky Notes**  
   - Add descriptive sticky notes at each logical block to explain roles and instructions, especially on trigger usage and preventing duplicate processing.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                   | Context or Link                                                                                           |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| The webhook URL from the "Trigger from Airtable" node must be copied and configured in your Airtable Automation to trigger this workflow correctly.                                                                                                                                                                                                                                          | Critical for workflow triggering; see Sticky Note at start                                              |
| The Gmail node currently sends confirmation emails to a fixed address (`samartian8@gmail.com`). For real deployment, replace this with the customer's email dynamically pulled from the order data.                                                                                                                                                                                           | Modify Gmail node's `sendTo` parameter for production use                                                |
| The workflow only supports a single product line item per order (uses `[0]` index). To support multiple products, the workflow must be extended to loop or batch process line items.                                                                                                                                                                                                           | Enhancing product line item support                                                                       |
| OAuth2 credentials must be set up for both Shopify and Gmail nodes to authenticate API requests securely.                                                                                                                                                                                                                                                                                      | Credential setup required before running workflow                                                        |
| Ensure that "Shopify Ordered" field in Airtable is set to "Pending" initially to allow proper triggering and update to "Done" after processing.                                                                                                                                                                                                                                               | Airtable field dependency                                                                                  |
| The HTML email template can be customized inside the Gmail node to match branding. It uses inline CSS for styling and dynamic expressions for order details.                                                                                                                                                                                                                                  | Email customization                                                                                       |
| For error handling, consider adding failure workflows or notifications in case of API errors, missing data, or unsuccessful email sending. The IF node already prevents marking orders done if email sending fails.                                                                                                                                                                           | Workflow robustness                                                                                       |

---

**Disclaimer:** The provided workflow text is derived exclusively from an automated process created with n8n, an integration and automation tool. The workflow respects all applicable content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.