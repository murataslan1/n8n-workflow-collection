Automate Digital Product Delivery & Sales Tracking with Stripe, Email, Notion & Telegram

https://n8nworkflows.xyz/workflows/automate-digital-product-delivery---sales-tracking-with-stripe--email--notion---telegram-8588


# Automate Digital Product Delivery & Sales Tracking with Stripe, Email, Notion & Telegram

### 1. Workflow Overview

This workflow automates the digital product delivery and sales tracking process triggered by Stripe payment events. It is designed for businesses selling multiple digital products through Stripe and aims to:

- Receive Stripe payment session data via webhook.
- Identify the purchased product.
- Send a product-specific email delivery to the customer.
- Log the transaction details into Notion for sales tracking.
- Notify a team or sales channel on Telegram about the sale.

The workflow is logically divided into these blocks:

- **1.1 Stripe Payment Reception**: Listens for Stripe checkout session completion events.
- **1.2 Payment Session Retrieval**: Fetches detailed Stripe session information using the webhook payload.
- **1.3 Product Identification**: Determines which product was purchased.
- **1.4 Email Delivery**: Sends a product-specific email to the customer.
- **1.5 Sales Logging**: Records the sale information into Notion.
- **1.6 Notification**: Sends a summary notification to Telegram.

---

### 2. Block-by-Block Analysis

#### 1.1 Stripe Payment Reception

- **Overview**: This block captures incoming Stripe checkout session completed events via a webhook, initiating the workflow.
- **Nodes Involved**: Stripe Webhook
- **Node Details**:
  - **Stripe Webhook**
    - Type: Webhook (listening node)
    - Configuration: Listens for Stripe checkout session events (exact event not specified but assumed from context)
    - Input: External Stripe event POST request
    - Output: Raw webhook payload forwarded to the next node
    - Edge Cases: Receiving invalid or malformed webhook payloads; missing event data
    - Version Requirements: n8n webhook node v1 or later

#### 1.2 Payment Session Retrieval

- **Overview**: Retrieves detailed session information from Stripe using the session ID obtained from the webhook to get product and customer details.
- **Nodes Involved**: Get Stripe Session
- **Node Details**:
  - **Get Stripe Session**
    - Type: HTTP Request
    - Configuration: Makes an authenticated GET request to Stripe API to retrieve session details
    - Key Expressions: Uses session ID from webhook data to construct API request URL (e.g., `/v1/checkout/sessions/{session_id}`)
    - Input: Webhook output containing session ID
    - Output: Stripe session data including line items and customer info
    - Edge Cases: API authentication failure, network timeout, invalid session ID, Stripe API rate limiting
    - Requires Stripe API credentials set in n8n HTTP Request node
    - Version Requirements: n8n HTTP Request node v1 or later

#### 1.3 Product Identification

- **Overview**: Checks which product was purchased by analyzing the session data to route the workflow accordingly.
- **Nodes Involved**: Check Product (If node)
- **Node Details**:
  - **Check Product**
    - Type: If (conditional branching)
    - Configuration: Checks for product identity, likely by evaluating product ID or name in the session data
    - Expressions: Conditional expressions on session data fields (e.g., `items[0].description === 'Product A'`)
    - Input: Stripe session data from previous node
    - Output: Routes workflow to either "Send Email - Product A" or "Send Email - Product B"
    - Edge Cases: Product ID not recognized, multiple products in one session, missing product info in session
    - Version Requirements: n8n If node v1 or later

#### 1.4 Email Delivery

- **Overview**: Sends a product-specific email to the customer with delivery details or download links.
- **Nodes Involved**: Send Email - Product A, Send Email - Product B
- **Node Details**:
  - **Send Email - Product A**
    - Type: Email Send
    - Configuration: Sends email with content tailored for Product A customers
    - Expressions: Uses customer email and product details from session data
    - Input: Conditional output from Check Product node (Product A branch)
    - Output: Passes result to Log to Notion node
    - Credentials: Requires configured SMTP or email sending credentials
    - Edge Cases: Email sending failure, invalid email address
  - **Send Email - Product B**
    - Type: Email Send
    - Configuration: Similar to above but for Product B
    - Input: Conditional output from Check Product node (Product B branch)
    - Output: Passes result to Log to Notion node
    - Edge Cases: As above

#### 1.5 Sales Logging

- **Overview**: Logs the sale information into a Notion database for record-keeping and tracking.
- **Nodes Involved**: Log to Notion
- **Node Details**:
  - **Log to Notion**
    - Type: Notion node
    - Configuration: Creates or updates a page in a Notion database with sale details such as product, customer info, amount, and date
    - Input: Output from either Send Email node
    - Output: Passes success to Telegram Notify node
    - Credentials: Requires Notion API credentials with access to the target database
    - Edge Cases: API authentication errors, invalid database or page IDs, rate limits

#### 1.6 Notification

- **Overview**: Sends a notification message to a specified Telegram chat to inform about the successful sale.
- **Nodes Involved**: Telegram Notify
- **Node Details**:
  - **Telegram Notify**
    - Type: Telegram node (send message)
    - Configuration: Sends a formatted message summarizing the sale event
    - Input: Output from Log to Notion node
    - Credentials: Requires Telegram Bot token and configured chat ID
    - Edge Cases: Bot authentication failure, invalid chat ID, Telegram API rate limits

---

### 3. Summary Table

| Node Name            | Node Type           | Functional Role               | Input Node(s)       | Output Node(s)           | Sticky Note                                          |
|----------------------|---------------------|------------------------------|---------------------|--------------------------|-----------------------------------------------------|
| Stripe Webhook       | Webhook             | Receive Stripe payment event | None                | Get Stripe Session        |                                                     |
| Get Stripe Session    | HTTP Request        | Retrieve Stripe session data | Stripe Webhook      | Check Product             |                                                     |
| Check Product        | If                  | Branch based on product type | Get Stripe Session  | Send Email - Product A, Send Email - Product B |                                                     |
| Send Email - Product A| Email Send          | Send email for Product A     | Check Product       | Log to Notion             |                                                     |
| Send Email - Product B| Email Send          | Send email for Product B     | Check Product       | Log to Notion             |                                                     |
| Log to Notion        | Notion              | Log sale in Notion           | Send Email - Product A, Send Email - Product B | Telegram Notify             |                                                     |
| Telegram Notify      | Telegram            | Notify sale via Telegram     | Log to Notion       | None                     |                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Stripe Webhook Node**
   - Type: Webhook
   - Set to listen for Stripe checkout session completion events (configure webhook URL in Stripe dashboard)
   - No special parameters needed in n8n node, just capture POST requests
   - Position: Start of workflow

2. **Add HTTP Request Node: Get Stripe Session**
   - Type: HTTP Request
   - Method: GET
   - URL: `https://api.stripe.com/v1/checkout/sessions/{{ $json["data"]["object"]["id"] }}`
     (Use expression to extract session ID from webhook payload)
   - Authentication: Set up Stripe API credentials (Bearer token)
   - Connect output of Stripe Webhook node to this node

3. **Add If Node: Check Product**
   - Type: If
   - Condition: Check line items or product description in session data
   - Example condition: `{{$json["line_items"][0]["description"]}} === "Product A"`
   - True branch: Send Email - Product A
   - False branch: Send Email - Product B
   - Connect output of Get Stripe Session to this node

4. **Add Email Send Node: Send Email - Product A**
   - Type: Email Send
   - Set recipient email to customer email from session data (`{{$json["customer_details"]["email"]}}`)
   - Compose email body specific to Product A delivery instructions or download link
   - Configure SMTP credentials or email provider
   - Connect true output of Check Product node here

5. **Add Email Send Node: Send Email - Product B**
   - Same as above but tailored for Product B
   - Connect false output of Check Product node here

6. **Add Notion Node: Log to Notion**
   - Type: Notion
   - Action: Create or update a database page
   - Map properties: product name, customer email, purchase date, amount, etc.
   - Requires Notion API credentials with access to database
   - Connect outputs of both Send Email nodes here

7. **Add Telegram Node: Telegram Notify**
   - Type: Telegram
   - Action: Send message
   - Configure with Telegram Bot token and chat ID
   - Message content: sale summary including product and customer info
   - Connect output of Log to Notion node here

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                               |
|--------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| Ensure Stripe webhook endpoint is secured and properly configured in Stripe dashboard.           | Stripe Webhook configuration                                  |
| SMTP credentials must support sending to customer email addresses to avoid delivery failures.    | Email Send nodes                                              |
| Notion API integration requires correct database schema matching properties mapped in node.      | Notion node setup                                            |
| Telegram Bot must be added to the target chat/channel with appropriate permissions.               | Telegram Notify configuration                                 |
| This workflow assumes single product purchase per session; multi-product sessions may require enhancement. | Edge case consideration                                      |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.