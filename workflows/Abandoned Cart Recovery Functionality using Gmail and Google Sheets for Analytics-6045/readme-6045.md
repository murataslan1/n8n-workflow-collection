Abandoned Cart Recovery Functionality using Gmail and Google Sheets for Analytics

https://n8nworkflows.xyz/workflows/abandoned-cart-recovery-functionality-using-gmail-and-google-sheets-for-analytics-6045


# Abandoned Cart Recovery Functionality using Gmail and Google Sheets for Analytics

### 1. Workflow Overview

This workflow implements an **Abandoned Cart Recovery Functionality** using **Gmail** to send recovery emails and **Google Sheets** for analytics tracking. It is designed for e-commerce stores to automatically reach out to customers who have left items in their shopping carts, encouraging them to complete their purchases through a timed sequence of personalized discount offers.

The workflow is logically structured into the following blocks:

- **1.1 Input Reception:** Receives abandoned cart data via a webhook.
- **1.2 Configuration Setup:** Loads recovery settings including discounts, email sender, and base URL.
- **1.3 Cart Qualification:** Determines if the cart qualifies for recovery based on cart value and presence of customer email.
- **1.4 Recovery Data Generation:** Creates unique discount codes and schedules timestamps for sending emails.
- **1.5 Email Sequence:** Sends a sequence of three recovery emails with increasing discounts, spaced by specific wait times.
- **1.6 Analytics Tracking:** Logs recovery sequence starts into Google Sheets for performance monitoring.
- **1.7 Informational Notes:** Provides configuration and analytics tracking guidance through sticky notes.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block initiates the workflow by capturing incoming abandoned cart events through an HTTP POST webhook.

- **Nodes Involved:**  
  - Cart Abandoned Webhook

- **Node Details:**  
  - **Cart Abandoned Webhook**  
    - Type: Webhook  
    - Role: Entry point to receive abandoned cart data from the e-commerce platform via POST request at the path `/cart-abandoned`.  
    - Configuration: HTTP Method POST, path set to `cart-abandoned`. No authentication or additional options specified.  
    - Input: HTTP request payload containing cart data (cart_id, customer_email, cart_value, items, etc.).  
    - Output: Passes received JSON data to the next node (Recovery Settings).  
    - Edge Cases: Missing or malformed payloads may cause downstream failures; webhook must be publicly accessible and secure.  
    - No sub-workflow.

#### 2.2 Configuration Setup

- **Overview:**  
  Loads predefined recovery settings such as discount percentages, sender email, and base URL into the workflow context.

- **Nodes Involved:**  
  - Recovery Settings  
  - Sticky Note (Cart Recovery Config)

- **Node Details:**  
  - **Recovery Settings**  
    - Type: Set  
    - Role: Sets static variables for the recovery process: three discount levels (10%, 15%, 20%), sender email (`sales@your-store.com`), and website base URL (`https://your-store.com`).  
    - Configuration: Number and string parameters predefined in the node.  
    - Input: Receives cart data from the webhook node.  
    - Output: Passes combined data to Cart Qualification node.  
    - Edge Cases: Hardcoded values require manual update for customization; no validation of email or URL format.  
    - No sub-workflow.

  - **Sticky Note (Cart Recovery Config)**  
    - Provides user guidance on customization parameters: recovery timing, discount rates, email templates, and exclusion rules.  
    - Visual aid only, no workflow logic impact.

#### 2.3 Cart Qualification

- **Overview:**  
  Validates whether the abandoned cart meets criteria for recovery email sequence initiation.

- **Nodes Involved:**  
  - Qualify Cart

- **Node Details:**  
  - **Qualify Cart**  
    - Type: If (Condition)  
    - Role: Checks if cart value exceeds 50 and customer email is present and non-empty.  
    - Configuration: Two conditions combined with AND:  
      - cart_value > 50 (strict numeric comparison)  
      - customer_email is not empty (strict string check)  
    - Input: Receives cart data with settings.  
    - Output: If true, proceeds to Generate Recovery Data; if false, stops workflow.  
    - Edge Cases: Missing or malformed `cart_value` or `customer_email` fields could cause false negatives or errors.

#### 2.4 Recovery Data Generation

- **Overview:**  
  Creates unique discount codes for the recovery sequence and calculates scheduled timestamps for each recovery email.

- **Nodes Involved:**  
  - Generate Recovery Data

- **Node Details:**  
  - **Generate Recovery Data**  
    - Type: Code (JavaScript)  
    - Role:  
      - Extracts cart ID, customer email, and current timestamp.  
      - Generates three unique discount codes by concatenating the discount percentage and last 4 characters of cart ID (e.g., `SAVE10-1a2b`).  
      - Calculates ISO timestamps for sending emails after 1 hour, 24 hours, and 72 hours respectively.  
      - Builds a recovery ID string for analytics tracking.  
    - Input: Validated cart data and recovery settings.  
    - Output: JSON object with discount codes, schedule timestamps, original cart data, and recovery ID.  
    - Edge Cases: Assumes cart_id is a string with sufficient length; failure if cart_id missing or invalid.  
    - No sub-workflow.

#### 2.5 Email Sequence

- **Overview:**  
  Sequentially sends three recovery emails at defined intervals with increasing discount offers to prompt cart recovery.

- **Nodes Involved:**  
  - Wait 1 Hour  
  - Send First Recovery Email  
  - Wait 23 Hours More  
  - Send Second Recovery Email  
  - Wait 48 Hours More  
  - Send Final Recovery Email  
  - Sticky Note1 (Recovery Analytics)

- **Node Details:**  
  - **Wait 1 Hour**  
    - Type: Wait  
    - Role: Pauses workflow 1 hour before sending the first recovery email.  
    - Input: Recovery data from Generate Recovery Data.  
    - Output: Triggers Send First Recovery Email.  
    - Edge Cases: Workflow pausing depends on n8n execution environment; long waits may be affected by system restarts.

  - **Send First Recovery Email**  
    - Type: Gmail  
    - Role: Sends personalized first recovery email with 10% discount code and cart details.  
    - Configuration:  
      - To: customer_email from recovery data  
      - Subject: "You forgot something in your cart 🛒"  
      - Content: HTML email with cart items, first discount code, call to action linking to cart URL.  
    - Input: After Wait 1 Hour.  
    - Output: Triggers Wait 23 Hours More.  
    - Credential: Requires Gmail OAuth2 credentials configured in n8n.  
    - Edge Cases: Email sending failure can occur due to authentication errors, invalid email, or rate limits.  
    - Uses Handlebars templating with expressions referencing dynamic data.

  - **Wait 23 Hours More**  
    - Type: Wait  
    - Role: Waits an additional 23 hours (total 24h after initial cart abandonment) before sending the second email.  
    - Output: Triggers Send Second Recovery Email.

  - **Send Second Recovery Email**  
    - Type: Gmail  
    - Role: Sends second recovery email with 15% discount and urgency messaging.  
    - Configuration: Similar to first email but includes different styling, discount code, and subject "Last chance - Your discount is waiting! 💸".  
    - Output: Triggers Wait 48 Hours More.  
    - Edge Cases: Same as first email.

  - **Wait 48 Hours More**  
    - Type: Wait  
    - Role: Waits an additional 48 hours (72h total) before sending the final recovery email.  
    - Output: Triggers Send Final Recovery Email.

  - **Send Final Recovery Email**  
    - Type: Gmail  
    - Role: Sends final and strongest recovery offer with 20% discount, testimonial, and final call to action.  
    - Configuration: Subject "Absolutely last chance - 20% discount! 🔥" with styled HTML content.  
    - Edge Cases: Same email sending considerations.

  - **Sticky Note1 (Recovery Analytics)**  
    - Provides guidance on tracking recovery performance indicators such as conversion rates, revenue, and email open rates.

#### 2.6 Analytics Tracking

- **Overview:**  
  Logs the start of each recovery sequence into a Google Sheets document for monitoring and analysis.

- **Nodes Involved:**  
  - Track Recovery Start

- **Node Details:**  
  - **Track Recovery Start**  
    - Type: Google Sheets  
    - Role: Appends a row to "Cart Recovery Tracking" sheet with columns: recovery ID, customer email, cart value, current timestamp, and status "sequence_started".  
    - Configuration:  
      - Document ID: placeholder `your-google-sheet-id` (must be replaced with actual sheet ID).  
      - Operation: Append row.  
    - Input: Runs in parallel with Wait 1 Hour after generating recovery data.  
    - Credential: Requires Google Sheets OAuth2 credentials.  
    - Edge Cases: Failure if Google Sheet ID invalid or credentials lack write permission.

---

### 3. Summary Table

| Node Name                | Node Type      | Functional Role                       | Input Node(s)             | Output Node(s)                      | Sticky Note                                                                                     |
|--------------------------|----------------|------------------------------------|---------------------------|-----------------------------------|------------------------------------------------------------------------------------------------|
| Cart Abandoned Webhook    | Webhook        | Receive abandoned cart data         | -                         | Recovery Settings                  |                                                                                                |
| Sticky Note              | Sticky Note    | Configuration guidance for recovery | -                         | -                                 | ## Cart Recovery Config ⚙️ Customize these settings: Recovery sequence timing, Discount percentages, Email templates, Exclusion rules |
| Recovery Settings        | Set            | Set discount rates and email config | Cart Abandoned Webhook     | Qualify Cart                      |                                                                                                |
| Qualify Cart             | If             | Decide if cart qualifies for recovery| Recovery Settings          | Generate Recovery Data             |                                                                                                |
| Generate Recovery Data   | Code           | Create discount codes and schedule  | Qualify Cart               | Wait 1 Hour, Track Recovery Start |                                                                                                |
| Wait 1 Hour              | Wait           | Delay before first email             | Generate Recovery Data     | Send First Recovery Email          |                                                                                                |
| Send First Recovery Email| Gmail          | Send initial recovery email          | Wait 1 Hour                | Wait 23 Hours More                 |                                                                                                |
| Wait 23 Hours More       | Wait           | Delay before second email            | Send First Recovery Email  | Send Second Recovery Email         |                                                                                                |
| Send Second Recovery Email| Gmail         | Send second recovery email           | Wait 23 Hours More         | Wait 48 Hours More                 |                                                                                                |
| Wait 48 Hours More       | Wait           | Delay before final email             | Send Second Recovery Email | Send Final Recovery Email          |                                                                                                |
| Send Final Recovery Email| Gmail          | Send final recovery email            | Wait 48 Hours More         | -                                 |                                                                                                |
| Sticky Note1             | Sticky Note    | Analytics tracking guidance          | -                         | -                                 | ## Recovery Analytics 📊 Track performance: Recovery conversion rates, Revenue generated, Email open rates, Best performing sequences |
| Track Recovery Start     | Google Sheets  | Log recovery sequence start          | Generate Recovery Data     | -                                 |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Name: `Cart Abandoned Webhook`  
   - HTTP Method: POST  
   - Path: `cart-abandoned`  
   - No authentication set.  
   - Connect output to `Recovery Settings`.

2. **Create Set Node for Recovery Settings**  
   - Type: Set  
   - Name: `Recovery Settings`  
   - Add numeric fields:  
     - `firstDiscount` = 10  
     - `secondDiscount` = 15  
     - `finalDiscount` = 20  
   - Add string fields:  
     - `fromEmail` = `sales@your-store.com`  
     - `baseUrl` = `https://your-store.com`  
   - Connect input from `Cart Abandoned Webhook`, output to `Qualify Cart`.

3. **Create If Node for Cart Qualification**  
   - Type: If  
   - Name: `Qualify Cart`  
   - Conditions:  
     - cart_value > 50 (number comparison)  
     - customer_email is not empty (string check)  
   - Connect input from `Recovery Settings`.  
   - True output connects to `Generate Recovery Data`.

4. **Create Code Node to Generate Recovery Data**  
   - Type: Code  
   - Name: `Generate Recovery Data`  
   - JavaScript code:  
     ```javascript
     const cartId = $json.cart_id;
     const customerEmail = $json.customer_email;
     const timestamp = Date.now();

     const codes = {
       firstCode: `SAVE${$node['Recovery Settings'].json.firstDiscount}-${cartId.slice(-4)}`,
       secondCode: `SAVE${$node['Recovery Settings'].json.secondDiscount}-${cartId.slice(-4)}`,
       finalCode: `SAVE${$node['Recovery Settings'].json.finalDiscount}-${cartId.slice(-4)}`
     };

     const schedules = {
       firstEmail: new Date(timestamp + 1 * 60 * 60 * 1000).toISOString(),
       secondEmail: new Date(timestamp + 24 * 60 * 60 * 1000).toISOString(),
       finalEmail: new Date(timestamp + 72 * 60 * 60 * 1000).toISOString()
     };

     return {
       ...codes,
       ...schedules,
       cartData: $json,
       recoveryId: `recovery_${cartId}_${timestamp}`
     };
     ```
   - Connect input from `Qualify Cart` true branch.  
   - Connect output to `Wait 1 Hour` and `Track Recovery Start`.

5. **Create Wait Node for 1 Hour Delay**  
   - Type: Wait  
   - Name: `Wait 1 Hour`  
   - Parameters: Wait for 1 hour.  
   - Input from `Generate Recovery Data`.  
   - Output to `Send First Recovery Email`.

6. **Create Gmail Node for First Recovery Email**  
   - Type: Gmail  
   - Name: `Send First Recovery Email`  
   - Credentials: Configure Gmail OAuth2 credentials with send permission.  
   - Send To: `={{ $node["Generate Recovery Data"].json.cartData.customer_email }}`  
   - Subject: `You forgot something in your cart 🛒`  
   - Message Content Type: HTML  
   - Message Body: Use embedded HTML template with Handlebars expressions referencing cart items, first discount code, customer name, and cart URL from recovery data and settings.  
   - Connect input from `Wait 1 Hour`.  
   - Output to `Wait 23 Hours More`.

7. **Create Wait Node for 23 Hours Delay**  
   - Type: Wait  
   - Name: `Wait 23 Hours More`  
   - Wait for 23 hours.  
   - Input from `Send First Recovery Email`.  
   - Output to `Send Second Recovery Email`.

8. **Create Gmail Node for Second Recovery Email**  
   - Type: Gmail  
   - Name: `Send Second Recovery Email`  
   - Credentials: Same Gmail OAuth2.  
   - Send To: `={{ $node["Generate Recovery Data"].json.cartData.customer_email }}`  
   - Subject: `Last chance - Your discount is waiting! 💸`  
   - Content: HTML template with urgency messaging, 15% discount code, cart total, and CTA.  
   - Input from `Wait 23 Hours More`.  
   - Output to `Wait 48 Hours More`.

9. **Create Wait Node for 48 Hours Delay**  
   - Type: Wait  
   - Name: `Wait 48 Hours More`  
   - Wait for 48 hours.  
   - Input from `Send Second Recovery Email`.  
   - Output to `Send Final Recovery Email`.

10. **Create Gmail Node for Final Recovery Email**  
    - Type: Gmail  
    - Name: `Send Final Recovery Email`  
    - Credentials: Same Gmail OAuth2.  
    - Send To: `={{ $node["Generate Recovery Data"].json.cartData.customer_email }}`  
    - Subject: `Absolutely last chance - 20% discount! 🔥`  
    - Content: HTML with final offer, testimonial, unsubscribe link, and 20% discount code.  
    - Input from `Wait 48 Hours More`.

11. **Create Google Sheets Node to Track Recovery Start**  
    - Type: Google Sheets  
    - Name: `Track Recovery Start`  
    - Credentials: Google Sheets OAuth2 with write permission.  
    - Operation: Append row to sheet named `Cart Recovery Tracking`.  
    - Document ID: Replace with your actual Google Sheet ID.  
    - Values:  
      - recoveryId (from `Generate Recovery Data`)  
      - customer_email (from cartData)  
      - cart_value  
      - current timestamp (ISO)  
      - status string: `sequence_started`  
    - Input from `Generate Recovery Data` (parallel to Wait 1 Hour).  

12. **Add Sticky Notes**  
    - Create two Sticky Note nodes to provide configuration and analytics guidance near corresponding sections for user reference.

---

### 5. General Notes & Resources

| Note Content                                                                                               | Context or Link                                                                                 |
|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Customize recovery timings, discount rates, email templates, and exclusion rules in the `Recovery Settings` node and sticky note. | Configuration guidance in Sticky Note near recovery config block.                               |
| Use Gmail OAuth2 credentials with appropriate scopes to send emails without interruption.                   | Credential setup required for Gmail nodes.                                                     |
| Replace placeholder Google Sheet ID with your actual document ID having a sheet named "Cart Recovery Tracking". | Google Sheets node configuration for analytics logging.                                        |
| HTML email templates leverage Handlebars expressions to dynamically insert cart and discount data.          | Templates embedded in Gmail nodes for personalized emails.                                    |
| Consider implementing error handling or retry mechanisms for email sending and webhook input validation.    | Potential workflow improvements to increase robustness and reliability.                        |
| Workflow respects user privacy and unsubscribe options should be implemented in the email footer links.     | Final recovery email includes placeholder unsubscribe link.                                   |
| For best performance, host n8n on a reliable environment that supports long-running workflows for wait nodes.| Wait nodes require persistent workflow execution to maintain timing accuracy.                 |

---

**Disclaimer:** The text above is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.