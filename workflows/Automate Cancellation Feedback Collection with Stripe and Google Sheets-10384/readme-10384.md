Automate Cancellation Feedback Collection with Stripe and Google Sheets

https://n8nworkflows.xyz/workflows/automate-cancellation-feedback-collection-with-stripe-and-google-sheets-10384


# Automate Cancellation Feedback Collection with Stripe and Google Sheets

### 1. Workflow Overview

This n8n workflow automates the process of collecting feedback from customers who cancel their subscriptions in Stripe. It targets businesses using Stripe for subscription management who want to understand churn reasons and organize customer feedback efficiently. The workflow captures cancellation events, fetches customer details, sends personalized survey emails, logs cancellations and survey responses in Google Sheets, and categorizes feedback by reason for actionable insights.

The workflow logic is divided into two main parallel blocks:

**1.1 Cancellation Detection and Survey Invitation**  
- Detect Stripe subscription cancellations via webhook  
- Retrieve customer details from Stripe  
- Send a personalized feedback survey email with embedded customer and plan data  
- Log cancellation details and email status to a Google Sheet

**1.2 Survey Response Reception and Categorization**  
- Receive survey responses through a dedicated webhook  
- Route feedback based on cancellation reason ("Price Concerns", "Feature Requests", "Other Feedback")  
- Log categorized responses into respective Google Sheets tabs

This structure ensures end-to-end automation from cancellation event detection to organized feedback collection.

---

### 2. Block-by-Block Analysis

#### 2.1 Block 1: Cancellation Detection and Survey Emailing

**Overview:**  
This block listens for Stripe subscription cancellation events, fetches customer info not included in the webhook, sends a personalized survey invitation email with embedded customer data, and logs the cancellation event along with email status to a Google Sheet.

**Nodes Involved:**  
- Stripe Subscription Canceled (Stripe Trigger)  
- Get Customer Details (Stripe API)  
- Send Feedback Survey Email (Email Send)  
- Log to Cancellations Sheet (Google Sheets)  
- Sticky Notes: Workflow Overview, Step 1, Step 2, Step 3, Step 4

**Node Details:**

- **Stripe Subscription Canceled**  
  - *Type:* Stripe Trigger  
  - *Role:* Listens for the `customer.subscription.deleted` webhook event from Stripe  
  - *Configuration:* Event filter set to `customer.subscription.deleted`; webhook URL to be added manually to Stripe dashboard  
  - *Inputs:* External Stripe webhook POST  
  - *Outputs:* Emits cancellation event JSON  
  - *Potential Failures:* Missing webhook setup in Stripe, invalid signature verification, network timeout  
  - *Notes:* Requires Stripe account configured; test mode recommended initially

- **Get Customer Details**  
  - *Type:* Stripe API Node  
  - *Role:* Fetches detailed customer information (email, name) since webhook lacks email  
  - *Configuration:* Resource set to "customer"; customerId extracted dynamically from webhook JSON path `$json.data.object.customer`  
  - *Inputs:* Output of Stripe Subscription Canceled  
  - *Outputs:* Customer detail JSON including email and name  
  - *Potential Failures:* API auth errors, invalid customer ID, network issues

- **Send Feedback Survey Email**  
  - *Type:* Email Send Node  
  - *Role:* Sends a personalized email that includes a survey link with embedded query parameters for customer data  
  - *Configuration:*  
    - Subject: "We're sorry to see you go — Quick 1-min survey"  
    - To: Customer email from `Get Customer Details`  
    - From: Configurable sender email (must configure credentials)  
    - HTML body includes link to `[SURVEY_URL]` with query parameters: email, customer_id, name, plan  
    - Plan name is dynamically extracted from the Stripe cancellation event JSON, falling back to plan ID if nickname missing  
  - *Inputs:* Output of Get Customer Details  
  - *Outputs:* Status of email send operation  
  - *Potential Failures:* Credential misconfiguration, SMTP server errors, invalid email addresses, email quota limits  
  - *Notes:* Requires setup of email credentials (Gmail, Outlook, SMTP) and replacing `[SURVEY_URL]` with actual survey URL

- **Log to Cancellations Sheet**  
  - *Type:* Google Sheets Node  
  - *Role:* Appends cancellation info and email send status to a Google Sheets tab named "Cancellations"  
  - *Configuration:*  
    - Document ID: To be set by user  
    - Sheet: "Cancellations"  
    - Columns: Cancellation timestamp, Customer ID, Email, Name, Plan, Email send status (Success/Failed)  
  - *Inputs:* Output of Send Feedback Survey Email  
  - *Outputs:* None (append operation)  
  - *Potential Failures:* Google API auth errors, permission issues, document ID misconfiguration

- **Sticky Notes (Overview and Steps 1-4)**  
  Provide detailed instructions and contextual explanation for setup and operation. Includes Stripe webhook setup, email credential configuration, survey URL requirements, and Google Sheets configuration.

---

#### 2.2 Block 2: Survey Response Reception and Categorization

**Overview:**  
This block collects survey responses submitted by customers, routes the feedback based on the cancellation reason field, and logs responses into categorized Google Sheets tabs for analysis.

**Nodes Involved:**  
- Survey Response Webhook (Webhook Node)  
- Route by Feedback Type (Switch Node)  
- Log Price Concerns (Google Sheets)  
- Log Feature Requests (Google Sheets)  
- Log Other Feedback (Google Sheets)  
- Sticky Notes: Step 5, Step 6, Step 7

**Node Details:**

- **Survey Response Webhook**  
  - *Type:* Webhook Node  
  - *Role:* Receives POST requests from survey tool when customer submits feedback  
  - *Configuration:*  
    - Path: `survey-response`  
    - Method: POST  
  - *Inputs:* External POST from survey platform (Tally, Typeform, or custom)  
  - *Outputs:* Parsed JSON payload containing email, customer_id, name, plan, reason, comments  
  - *Potential Failures:* Invalid payload format, missing required fields, network issues  
  - *Notes:* Survey tool must be configured to POST correct fields to this URL

- **Route by Feedback Type**  
  - *Type:* Switch Node  
  - *Role:* Routes incoming feedback based on the 'reason' field content  
  - *Configuration:*  
    - Output 0 (Price Concerns): Matches if reason contains "expensive", "price", or "cost" (case insensitive)  
    - Output 1 (Feature Requests): Matches if reason contains "feature", "functionality", or "missing"  
    - Output 2 (Other Feedback): Fallback for all other reasons  
  - *Inputs:* Output of Survey Response Webhook  
  - *Outputs:* Three branches corresponding to feedback categories  
  - *Potential Failures:* Case sensitivity issues if conditions are adjusted, empty or malformed reason field

- **Log Price Concerns**  
  - *Type:* Google Sheets Node  
  - *Role:* Logs price-related feedback to "Price Concerns" tab  
  - *Configuration:*  
    - Columns: Response timestamp, Customer name, email, plan, reason, additional comments  
    - Document ID & sheet name set accordingly  
  - *Inputs:* Output 0 of Switch Node  
  - *Outputs:* None (append operation)  
  - *Potential Failures:* Google API permission issues, missing document ID

- **Log Feature Requests**  
  - *Type:* Google Sheets Node  
  - *Role:* Logs feature-related feedback to "Feature Requests" tab  
  - *Configuration:* Same as above but targets "Feature Requests" sheet  
  - *Inputs:* Output 1 of Switch Node  
  - *Outputs:* None

- **Log Other Feedback**  
  - *Type:* Google Sheets Node  
  - *Role:* Logs all other feedback to "Other Feedback" tab  
  - *Configuration:* Same as above but targets "Other Feedback" sheet  
  - *Inputs:* Output 2 of Switch Node  
  - *Outputs:* None

- **Sticky Notes (Steps 5-7)**  
  Explain how to configure the survey webhook, the routing logic, and Google Sheets setup for categorized feedback logging.

---

### 3. Summary Table

| Node Name                    | Node Type            | Functional Role                                   | Input Node(s)               | Output Node(s)                              | Sticky Note                                                                                                                                    |
|------------------------------|----------------------|-------------------------------------------------|-----------------------------|---------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Workflow Overview            | Sticky Note          | Describes entire workflow and setup overview    |                             |                                             | ## 📋 Automated Feedback Survey on Stripe Cancellation ... See full content in doc.                                                             |
| Step 1                      | Sticky Note          | Explains Stripe webhook setup for cancellation  |                             |                                             | ## Step 1: Detect Cancellation ... Setup Stripe webhook for `customer.subscription.deleted` event                                                |
| Step 2                      | Sticky Note          | Explains need to fetch customer info             |                             |                                             | ## Step 2: Get Customer Info ... Webhook event lacks email, so fetch separately                                                                |
| Step 3                      | Sticky Note          | Explains survey email sending details            |                             |                                             | ## Step 3: Send Survey Email ... Replace `[SURVEY_URL]` and configure email credentials                                                         |
| Step 4                      | Sticky Note          | Explains Google Sheets logging for cancellations|                             |                                             | ## Step 4: Log Cancellation ... Logs timestamp, customer details and email send status                                                          |
| Step 5                      | Sticky Note          | Explains survey response webhook setup           |                             |                                             | ## Step 5: Receive Survey Response ... Configure survey tool to POST required fields to webhook URL                                              |
| Step 6                      | Sticky Note          | Explains routing of feedback by reason           |                             |                                             | ## Step 6: Route by Reason ... Switch node routes by keywords in cancellation reason                                                            |
| Step 7                      | Sticky Note          | Explains feedback categorization sheets          |                             |                                             | ## Step 7: Log to Category Sheets ... Logs categorized feedback to respective Google Sheets                                                    |
| Stripe Subscription Canceled | Stripe Trigger       | Listens for Stripe subscription cancellation webhook|                           | Get Customer Details                        |                                                                                                                                                 |
| Get Customer Details        | Stripe API           | Fetches customer email and name from Stripe      | Stripe Subscription Canceled | Send Feedback Survey Email                  |                                                                                                                                                 |
| Send Feedback Survey Email  | Email Send           | Sends survey invitation email with embedded data| Get Customer Details         | Log to Cancellations Sheet                   |                                                                                                                                                 |
| Log to Cancellations Sheet  | Google Sheets        | Logs cancellation and email send status          | Send Feedback Survey Email   |                                             |                                                                                                                                                 |
| Survey Response Webhook     | Webhook              | Receives survey POST responses                    |                             | Route by Feedback Type                       |                                                                                                                                                 |
| Route by Feedback Type      | Switch               | Routes feedback based on reason                   | Survey Response Webhook      | Log Price Concerns, Log Feature Requests, Log Other Feedback |                                                                                                                                                 |
| Log Price Concerns          | Google Sheets        | Logs price-related feedback                        | Route by Feedback Type       |                                             |                                                                                                                                                 |
| Log Feature Requests        | Google Sheets        | Logs feature-related feedback                      | Route by Feedback Type       |                                             |                                                                                                                                                 |
| Log Other Feedback          | Google Sheets        | Logs other feedback                                | Route by Feedback Type       |                                             |                                                                                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Stripe Trigger node:**  
   - Name: `Stripe Subscription Canceled`  
   - Credentials: Connect your Stripe account  
   - Webhook Event: `customer.subscription.deleted`  
   - Save and copy the webhook URL generated for Stripe dashboard setup.

3. **Configure Stripe webhook:**  
   - In Stripe Dashboard → Developers → Webhooks, add the copied URL  
   - Subscribe to event `customer.subscription.deleted`  
   - Use test mode for initial setup if desired.

4. **Add a Stripe node to get customer details:**  
   - Name: `Get Customer Details`  
   - Operation: Get customer  
   - Customer ID: Set expression to `{{$json.data.object.customer}}` from the Stripe trigger output  
   - Connect output of `Stripe Subscription Canceled` to this node.

5. **Add an Email Send node:**  
   - Name: `Send Feedback Survey Email`  
   - Credentials: Configure Gmail, Outlook, or SMTP credentials  
   - To Email: `={{ $json.email }}` (from `Get Customer Details`)  
   - From Email: Set to your verified sender email  
   - Subject: "We're sorry to see you go — Quick 1-min survey"  
   - HTML Body: Include a link with embedded query parameters to your survey URL:  
     ```
     [SURVEY_URL]?email={{ $json.email }}&customer_id={{ $json.id }}&name={{ $json.name || 'Customer' }}&plan={{ $('Stripe Subscription Canceled').item.json.data.object.items.data[0].plan.nickname || $('Stripe Subscription Canceled').item.json.data.object.items.data[0].plan.id }}
     ```
   - Connect output of `Get Customer Details` to this node.

6. **Add a Google Sheets node to log cancellations:**  
   - Name: `Log to Cancellations Sheet`  
   - Credentials: Connect your Google Sheets account  
   - Operation: Append  
   - Document ID: Select your Google Sheets doc  
   - Sheet Name: `Cancellations`  
   - Mapping:  
     - Cancellation Date: `={{ new Date().toISOString() }}`  
     - Customer ID: From Stripe trigger  
     - Customer Email & Name: From `Get Customer Details`  
     - Plan Name: From Stripe trigger (plan nickname or ID)  
     - Email Sent: `={{ $json.accepted ? 'Success' : 'Failed' }}` from email node  
   - Connect output of `Send Feedback Survey Email` to this node.

7. **Add a Webhook node to receive survey responses:**  
   - Name: `Survey Response Webhook`  
   - HTTP Method: POST  
   - Path: `survey-response`  
   - Save and copy the webhook URL for your survey tool.

8. **Configure your survey tool:**  
   - Set the webhook URL to POST survey submissions here  
   - Ensure payload includes: email, customer_id, name, plan, reason, comments.

9. **Add a Switch node to route feedback:**  
   - Name: `Route by Feedback Type`  
   - Rules:  
     - Output 0 (Price Concerns): reason contains "expensive" or "price" or "cost" (case-insensitive)  
     - Output 1 (Feature Requests): reason contains "feature" or "functionality" or "missing"  
     - Output 2 (Other Feedback): fallback output  
   - Connect output of `Survey Response Webhook` to this node.

10. **Add three Google Sheets nodes to log categorized feedback:**  
    - Names: `Log Price Concerns`, `Log Feature Requests`, `Log Other Feedback`  
    - Credentials: Use same Google Sheets credentials  
    - Operation: Append  
    - Document ID: Same sheet as cancellations  
    - Sheet Names: "Price Concerns", "Feature Requests", "Other Feedback"  
    - Mapping (all three):  
      - Response Date: `={{ new Date().toISOString() }}`  
      - Customer Email, Name, Plan, Cancellation Reason, Additional Comments from webhook JSON  
    - Connect outputs 0, 1, 2 of `Route by Feedback Type` respectively to these nodes.

11. **Test the whole flow:**  
    - Use Stripe test mode to cancel subscriptions and verify email sending and logging  
    - Submit test survey responses to the webhook URL and verify routing and logs in Google Sheets.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                                               |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| This workflow enables automated churn feedback collection to reduce subscription cancellations and prioritize product improvements.                                                                                                                                                                         | Workflow purpose                                                                                                              |
| Survey tools compatible: Tally, Typeform, or any tool supporting webhook POSTs.                                                                                                                                                                                                                                | Survey tool options                                                                                                           |
| Customize survey email template by replacing `[SURVEY_URL]` with your actual survey link supporting hidden fields for email, customer_id, name, and plan.                                                                                                                                                      | Email template customization                                                                                                 |
| Setup Google Sheets with four tabs: "Cancellations", "Price Concerns", "Feature Requests", and "Other Feedback" before running the workflow.                                                                                                                                                                    | Google Sheets setup                                                                                                           |
| Consider adding Slack notifications or CRM integrations for enhanced churn management as customization options.                                                                                                                                                                                               | Suggested workflow enhancements                                                                                              |
| Ensure all API credentials (Stripe, Google Sheets, Email) are correctly configured with necessary permissions before activating the workflow.                                                                                                                                                                   | Credential and permission requirement                                                                                        |
| Use Stripe test mode and "Listen for Test Event" features in the webhook nodes to validate setup before going live.                                                                                                                                                                                            | Testing recommendations                                                                                                      |

---

**Disclaimer:** The text provided originates exclusively from an n8n automated workflow. All data handled complies with applicable content policies and contains no illegal or protected material.