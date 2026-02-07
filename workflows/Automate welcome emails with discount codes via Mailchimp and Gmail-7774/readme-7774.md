Automate welcome emails with discount codes via Mailchimp and Gmail

https://n8nworkflows.xyz/workflows/automate-welcome-emails-with-discount-codes-via-mailchimp-and-gmail-7774


# Automate welcome emails with discount codes via Mailchimp and Gmail

### 1. Workflow Overview

This workflow automates the process of welcoming new subscribers by sending personalized welcome emails with discount codes. It is designed primarily for e-commerce, SaaS, course creators, or service providers who want to engage new contacts immediately after signup.

**Logical Blocks:**

- **1.1 Input Reception:** Receives subscriber data from a website signup form via a webhook.
- **1.2 Mailchimp Integration:** Adds the new subscriber to a specified Mailchimp mailing list.
- **1.3 Email Delivery:** Sends a branded welcome email with a discount code to the subscriber using Gmail.
- **1.4 Error Handling:** Ensures the email is sent even if adding to Mailchimp fails, guaranteeing subscriber engagement.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block captures new subscriber data submitted via HTTP POST requests from a website form using a webhook node.

- **Nodes Involved:**  
  - Webhook

- **Node Details:**  
  - **Webhook**  
    - Type: Webhook node (HTTP endpoint listener)  
    - Configuration:  
      - HTTP Method: POST  
      - Path: Unique webhook ID path (`b3d366be-bffc-4d2d-a465-db487976ada0`)  
      - Response Mode: Response sent from the last node in the workflow  
    - Expressions/Variables: Incoming JSON payload expected to contain at least `email` and `name` fields, e.g., `{{$json.body.email}}` and `{{$json.body.name}}`  
    - Input/Output: Accepts external POST request, outputs JSON data to downstream nodes  
    - Version: 2.1  
    - Edge cases:  
      - Invalid or missing data in the payload (e.g., missing email or name) might cause downstream nodes to fail or act unexpectedly  
      - Unauthorized requests or malformed HTTP requests  
    - Sticky Note: "Step 1: Receive Signup Data — Webhook receives form submissions from your website."

#### 2.2 Mailchimp Integration

- **Overview:**  
  Adds the subscriber captured by the webhook to a Mailchimp mailing list to manage audience segmentation and email marketing campaigns.

- **Nodes Involved:**  
  - Create a member

- **Node Details:**  
  - **Create a member**  
    - Type: Mailchimp node (Add or update list member)  
    - Configuration:  
      - Audience List ID: Placeholder `YOUR_MAILCHIMP_LIST_ID` (must be replaced with actual Mailchimp list ID)  
      - Email: Extracted from webhook JSON body (`{{$json.body.email}}`)  
      - Status: `subscribed` (adds the contact as a subscribed member)  
      - Merge Fields: Sets subscriber’s first name using field `FNAME` with value from webhook (`{{$json.body.name}}`)  
    - Credentials: Requires valid Mailchimp API credentials  
    - Input/Output: Receives subscriber data from webhook node, outputs success or failure response to next node  
    - Version: 1  
    - On Error: Configured to "continueRegularOutput" — workflow proceeds even if this node fails (e.g., due to duplicate email or API errors)  
    - Edge cases:  
      - Invalid list ID or API credentials leading to authentication errors  
      - Subscriber already exists or duplicate email causing errors  
      - Network or API timeouts  
    - Sticky Note: "Step 2: Add to Email List — Automatically adds subscriber to your Mailchimp audience."

#### 2.3 Email Delivery

- **Overview:**  
  Sends a personalized, branded welcome email with a 15% discount code to the new subscriber’s email address.

- **Nodes Involved:**  
  - Send a message

- **Node Details:**  
  - **Send a message**  
    - Type: Gmail node (SMTP email sender via OAuth2)  
    - Configuration:  
      - Recipient Email: Extracted from webhook output (`{{$node["Webhook"].json.body.email}}`)  
      - Subject: "Welcome to Berley! Here's your 15% discount 🎉"  
      - Email Body: Rich HTML content including:  
        - Personalized greeting using subscriber’s name (`{{$node["Webhook"].json.name || "there"}}`)  
        - Welcome message  
        - Discount code "WELCOME15" highlighted prominently  
        - Call-to-action button linking to shop URL (`https://your-website.com/shop`)  
        - Social media links (Facebook, Instagram, Twitter)  
    - Credentials: Requires configured Gmail OAuth2 credentials  
    - Input/Output: Receives subscriber info from Mailchimp node output (or directly from webhook if Mailchimp fails)  
    - Version: 2.1  
    - Edge cases:  
      - Gmail OAuth2 authentication failure or token expiration  
      - Invalid recipient email format  
      - Gmail API rate limits or sending quota exceeded  
      - HTML rendering issues in email clients  
    - Sticky Note: "Step 3: Send Welcome Email — Sends branded welcome email with personalized discount code."

#### 2.4 Documentation and Instructions

- **Overview:**  
  Provides detailed notes, instructions, and setup guidance embedded as sticky notes within the workflow for maintainers and users.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  
  - Sticky Note2  
  - Sticky Note3

- **Node Details:**  
  - These are informational nodes only, containing:  
    - Overall workflow description and purpose  
    - Step-by-step explanation of each major block  
    - Setup prerequisites such as replacing placeholders, configuring credentials, and updating templates  
    - Target audiences and use cases  
  - No input/output or execution flow role  
  - Sticky Note (large) contains extensive overview and setup instructions  
  - Sticky Note1, Sticky Note2, Sticky Note3 correspond to the three main functional steps respectively

---

### 3. Summary Table

| Node Name       | Node Type          | Functional Role                     | Input Node(s) | Output Node(s) | Sticky Note                                                                                                  |
|-----------------|--------------------|-----------------------------------|---------------|----------------|--------------------------------------------------------------------------------------------------------------|
| Webhook         | Webhook            | Receive signup form submissions   | -             | Create a member | Step 1: Receive Signup Data — Webhook receives form submissions from your website.                            |
| Create a member | Mailchimp          | Add subscriber to Mailchimp list  | Webhook       | Send a message  | Step 2: Add to Email List — Automatically adds subscriber to your Mailchimp audience.                         |
| Send a message  | Gmail              | Send welcome email with discount  | Create a member | -              | Step 3: Send Welcome Email — Sends branded welcome email with personalized discount code.                    |
| Sticky Note     | Sticky Note        | Documentation and overview        | -             | -              | 📧 Automated Welcome Email with Discount Code — Full workflow explanation, setup instructions, and use cases |
| Sticky Note1    | Sticky Note        | Step 1 note                       | -             | -              | Step 1: Receive Signup Data — Webhook receives form submissions from your website.                            |
| Sticky Note2    | Sticky Note        | Step 2 note                       | -             | -              | Step 2: Add to Email List — Automatically adds subscriber to your Mailchimp audience.                         |
| Sticky Note3    | Sticky Note        | Step 3 note                       | -             | -              | Step 3: Send Welcome Email — Sends branded welcome email with personalized discount code.                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Choose a unique path (e.g., `welcome-signup-webhook`)  
   - Response Mode: `lastNode` (respond after last node executes)  
   - Save node.

2. **Create Mailchimp Node ("Create a member")**  
   - Type: Mailchimp  
   - Operation: Add/Update member  
   - List ID: Enter your Mailchimp audience/list ID (replace `YOUR_MAILCHIMP_LIST_ID`)  
   - Email: Expression — `{{$json.body.email}}` (from webhook)  
   - Status: `subscribed`  
   - Merge Fields: Add `FNAME` with value `{{$json.body.name}}`  
   - Credentials: Configure Mailchimp API credentials (API key and server prefix)  
   - On Error: Set to `continueRegularOutput` to allow workflow continuation if this node fails  
   - Connect Webhook node output to this node’s input.

3. **Create Gmail Node ("Send a message")**  
   - Type: Gmail  
   - Operation: Send Email  
   - Send To: Expression — `{{$node["Webhook"].json.body.email}}`  
   - Subject: `Welcome to Berley! Here's your 15% discount 🎉`  
   - Message (HTML): Insert branded HTML content including:  
     - Greeting with `{{$node["Webhook"].json.name || "there"}}`  
     - Discount code "WELCOME15" prominently displayed  
     - Link button to shop URL (e.g., `https://your-website.com/shop`)  
     - Social media links to Facebook, Instagram, Twitter  
   - Credentials: Configure Gmail OAuth2 credentials (Google API client ID/secret, OAuth scopes for sending email)  
   - Connect Mailchimp node’s output to Gmail node input.

4. **Add Sticky Notes (Optional but Recommended)**  
   - Add descriptive sticky notes for each step to document purpose and setup details.

5. **Test the Workflow**  
   - Use a test payload simulating form submission with `name` and `email` fields.  
   - Confirm subscriber is added to Mailchimp list and email is sent successfully.

6. **Deploy**  
   - Expose webhook URL to your website’s signup form as the form’s POST target.  
   - Monitor for errors and adjust credentials or list IDs as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                  | Context or Link                                                                                                            |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Before using this workflow, replace `YOUR_MAILCHIMP_LIST_ID` with your actual Mailchimp audience ID. Update the email template with your business name, branding, discount code, and shop URL. Configure Mailchimp and Gmail credentials accordingly.                           | Embedded in main sticky note inside the workflow.                                                                           |
| This workflow is ideal for automating onboarding and engagement of new subscribers, offering immediate value through discount codes and personalization.                                                                                                                      | Workflow purpose and use case explanation from sticky notes.                                                                 |
| Gmail node uses OAuth2 authentication requiring Google Cloud project setup with Gmail API enabled and appropriate OAuth consent screen configuration.                                                                                                                        | Gmail OAuth2 credential setup.                                                                                               |
| Mailchimp node requires valid API key and audience access. Ensure list ID is correct and API key has necessary permissions.                                                                                                                                                   | Mailchimp API credential setup.                                                                                             |
| HTML email template includes inline CSS styling for compatibility with major email clients. Test rendering in common clients (Gmail, Outlook, Apple Mail) before production use.                                                                                              | Email node HTML content description.                                                                                        |
| Error handling in Mailchimp node ensures the email is sent even if subscriber addition fails, preventing workflow interruption and missing welcome emails.                                                                                                                    | Node setting “On Error: continueRegularOutput”.                                                                             |

---

**Disclaimer:** The provided text is extracted exclusively from an automated workflow created with n8n, a no-code integration and automation platform. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.