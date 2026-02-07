Automate WordPress Contact Form (CF7) Responses and Classification with Gemini

https://n8nworkflows.xyz/workflows/automate-wordpress-contact-form--cf7--responses-and-classification-with-gemini-3472


# Automate WordPress Contact Form (CF7) Responses and Classification with Gemini

### 1. Workflow Overview

This n8n workflow automates the handling of customer inquiries submitted via a **Contact Form 7 (CF7)** on a WordPress website. It captures form submissions, classifies the inquiry type using Google Gemini AI, drafts personalized email responses accordingly, creates Gmail drafts for review, and logs all interactions in Google Sheets for record-keeping.

**Target Use Cases:**  
- Businesses receiving multiple daily inquiries via WordPress contact forms.  
- Teams seeking to automate initial email responses while maintaining customization options.  
- Organizations wanting to track inquiry history and classification for analytics or follow-up.

**Logical Blocks:**

- **1.1 Input Reception:** Captures and structures incoming form data from WordPress via webhook.  
- **1.2 Message Classification:** Uses AI to classify the inquiry into predefined categories.  
- **1.3 Email Draft Generation:** Generates tailored email drafts per category using AI language models.  
- **1.4 Draft Email Creation:** Creates Gmail drafts with the generated responses for manual review or sending.  
- **1.5 Data Logging:** Appends all inquiry data, classification, and draft content to Google Sheets.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Receives HTTP POST requests from the WordPress CF7 form via webhook and extracts relevant fields into a structured format.

**Nodes Involved:**  
- From Wordpress  
- Set Fields

**Node Details:**

- **From Wordpress**  
  - Type: Webhook  
  - Role: Entry point capturing POST requests from WordPress CF7 form submissions.  
  - Configuration: HTTP POST method, unique webhook path.  
  - Inputs: External HTTP request.  
  - Outputs: Raw JSON containing form data (first_name, last_name, email, phone, message).  
  - Edge Cases: Missing or malformed POST data; webhook URL misconfiguration.  
  - Notes: Requires WordPress plugin "CF7 to Webhook" configured to send data here.

- **Set Fields**  
  - Type: Set  
  - Role: Extracts and maps form fields from raw webhook JSON to named variables for downstream use.  
  - Configuration: Assigns string values from `$json.body` for first_name, last_name, email, phone, message.  
  - Inputs: Output from "From Wordpress".  
  - Outputs: JSON with clean, named fields.  
  - Edge Cases: Missing fields in submission; empty strings.

---

#### 1.2 Message Classification

**Overview:**  
Classifies the inquiry message into categories ("Product Info", "Order Info", or fallback "Other") using Google Gemini AI.

**Nodes Involved:**  
- Google Gemini Chat Model  
- Message Classifier

**Node Details:**

- **Google Gemini Chat Model**  
  - Type: Google Gemini Language Model (AI)  
  - Role: Provides AI inference capabilities for classification.  
  - Configuration: Model "models/gemini-2.0-flash", authenticated with Google PaLM API credentials.  
  - Inputs: None directly; invoked by "Message Classifier".  
  - Outputs: AI-generated classification data.  
  - Edge Cases: API authentication failure, rate limits, network timeouts.

- **Message Classifier**  
  - Type: Langchain Text Classifier  
  - Role: Uses AI model to classify the message text into predefined categories.  
  - Configuration:  
    - System prompt instructs classification into categories with JSON output only.  
    - Categories defined: "Product Info" and "Order Info" with descriptions.  
    - Fallback category: "Other".  
    - Input text: `{{$json.message}}` from "Set Fields".  
  - Inputs: Output from "Set Fields".  
  - Outputs: JSON with classification result and associated email address for the department.  
  - Edge Cases: Ambiguous messages, classification errors, fallback usage.

---

#### 1.3 Email Draft Generation

**Overview:**  
Generates personalized email drafts tailored to the inquiry category using Google Gemini AI models and Langchain chains.

**Nodes Involved:**  
- Email writer (Product info)  
- Email writer (Order info)  
- Email writer (Others)  
- Google Gemini Chat Model1  
- Google Gemini Chat Model2  
- Google Gemini Chat Model3  
- Subject and Text  
- Subject and Text 2  
- Subject and Text 3

**Node Details:**

- **Email writer (Product info)**  
  - Type: Langchain Chain LLM  
  - Role: Generates professional email draft for product-related inquiries.  
  - Configuration:  
    - Input text includes all form fields and message.  
    - System prompt defines detailed instructions for tone, structure, and personalization.  
    - Output parsed into structured JSON with "subject" and "text".  
  - Inputs: Classification output routed here if category is "Product Info".  
  - Outputs: Draft email content (subject and body).  
  - Edge Cases: Missing info placeholders, AI generation errors.

- **Email writer (Order info)**  
  - Type: Langchain Chain LLM  
  - Role: Generates email draft for order-related inquiries.  
  - Configuration: Same detailed system prompt as above, adapted for order context.  
  - Inputs: Classification output routed here if category is "Order Info".  
  - Outputs: Draft email content.  
  - Edge Cases: Same as above.

- **Email writer (Others)**  
  - Type: Langchain Chain LLM  
  - Role: Generates email draft for all other inquiries.  
  - Configuration: Same system prompt, general fallback.  
  - Inputs: Classification output routed here if category is "Other".  
  - Outputs: Draft email content.  
  - Edge Cases: Same as above.

- **Google Gemini Chat Model1, 2, 3**  
  - Type: Google Gemini Language Model  
  - Role: Provide AI inference for each email writer node respectively.  
  - Configuration: Model "models/gemini-2.0-flash-exp", authenticated with Google PaLM API.  
  - Inputs: Connected to respective email writer nodes.  
  - Outputs: AI-generated draft content.  
  - Edge Cases: API errors, rate limits.

- **Subject and Text, Subject and Text 2, Subject and Text 3**  
  - Type: Langchain Output Parser Structured  
  - Role: Parses AI output into structured JSON with "subject" and "text" fields.  
  - Configuration: JSON schema with "subject" and "text" string properties.  
  - Inputs: AI output from email writer nodes.  
  - Outputs: Structured draft content for Gmail nodes.  
  - Edge Cases: Parsing failures if AI output is malformed.

---

#### 1.4 Draft Email Creation

**Overview:**  
Creates Gmail draft emails with the generated subject and body, addressed to the appropriate department email.

**Nodes Involved:**  
- Email draft - Product info  
- Email draft - Order info  
- Email draft - Other info

**Node Details:**

- **Email draft - Product info**  
  - Type: Gmail  
  - Role: Creates a Gmail draft for product inquiries.  
  - Configuration:  
    - Draft resource selected (does not send immediately).  
    - Subject and message body use parsed AI output.  
    - Includes original form data appended below the message.  
    - Recipient email dynamically set from classification node output.  
  - Inputs: Output from "Email writer (Product info)".  
  - Outputs: Gmail draft created.  
  - Edge Cases: Gmail OAuth2 authentication errors, API limits.

- **Email draft - Order info**  
  - Type: Gmail  
  - Role: Creates Gmail draft for order inquiries.  
  - Configuration: Same as above, adapted for order info.  
  - Inputs: Output from "Email writer (Order info)".  
  - Outputs: Gmail draft created.  
  - Edge Cases: Same as above.

- **Email draft - Other info**  
  - Type: Gmail  
  - Role: Creates Gmail draft for other inquiries.  
  - Configuration: Same as above, adapted for other info.  
  - Inputs: Output from "Email writer (Others)".  
  - Outputs: Gmail draft created.  
  - Edge Cases: Same as above.

---

#### 1.5 Data Logging

**Overview:**  
Appends all inquiry data, classification, and generated draft content to a Google Sheets spreadsheet for tracking and historical record.

**Nodes Involved:**  
- Save on Sheet (product)  
- Save on Sheet (order)  
- Save on Sheet (other)

**Node Details:**

- **Save on Sheet (product)**  
  - Type: Google Sheets  
  - Role: Appends a new row with product inquiry data and draft content.  
  - Configuration:  
    - Target spreadsheet and sheet specified by ID and gid.  
    - Columns mapped: DATE (current date), FIRST NAME, LAST NAME, EMAIL, PHONE, MESSAGE, CLASSIFIED (hardcoded "Other request" - likely a mislabel), DRAFT (email draft text).  
  - Inputs: Output from "Email draft - Product info".  
  - Outputs: Confirmation of append operation.  
  - Edge Cases: Google Sheets API errors, permission issues.

- **Save on Sheet (order)**  
  - Type: Google Sheets  
  - Role: Same as above for order inquiries.  
  - Inputs: Output from "Email draft - Order info".  
  - Edge Cases: Same as above.

- **Save on Sheet (other)**  
  - Type: Google Sheets  
  - Role: Same as above for other inquiries.  
  - Inputs: Output from "Email draft - Other info".  
  - Edge Cases: Same as above.

---

### 3. Summary Table

| Node Name               | Node Type                             | Functional Role                         | Input Node(s)             | Output Node(s)                   | Sticky Note                                                                                              |
|-------------------------|-------------------------------------|---------------------------------------|---------------------------|---------------------------------|--------------------------------------------------------------------------------------------------------|
| From Wordpress          | Webhook                             | Receives form submission POST request | -                         | Set Fields                      | ## PRELIMINARY STEP - Download the Wordpress Plugin [CF7 to Webhook](https://wordpress.org/plugins/cf7-to-zapier/) and install it - Go to webhook tab on Wordpress and set the url of the n8n Webhook trigger - Set the POST request |
| Set Fields              | Set                                 | Extracts and maps form fields          | From Wordpress             | Message Classifier              | Set your own classification categories                                                                |
| Google Gemini Chat Model | Google Gemini LM                    | Provides AI model for classification   | -                         | Message Classifier              |                                                                                                        |
| Message Classifier      | Langchain Text Classifier           | Classifies message into categories     | Set Fields                 | Email writer (Product info), Email writer (Order info), Email writer (Others) |                                                                                                        |
| Email writer (Product info) | Langchain Chain LLM               | Generates email draft for product info | Message Classifier         | Email draft - Product info      | Create the draft of the reply email by dividing it into subject and text ready to be sent               |
| Email writer (Order info) | Langchain Chain LLM               | Generates email draft for order info   | Message Classifier         | Email draft - Order info        | Create the draft of the reply email by dividing it into subject and text ready to be sent               |
| Email writer (Others)   | Langchain Chain LLM                 | Generates email draft for other inquiries | Message Classifier         | Email draft - Other info        | Create the draft of the reply email by dividing it into subject and text ready to be sent               |
| Google Gemini Chat Model1 | Google Gemini LM                  | AI model for "Others" email writer     | -                         | Email writer (Others)           |                                                                                                        |
| Google Gemini Chat Model2 | Google Gemini LM                  | AI model for "Order info" email writer | -                         | Email writer (Order info)       |                                                                                                        |
| Google Gemini Chat Model3 | Google Gemini LM                  | AI model for "Product info" email writer | -                         | Email writer (Product info)     |                                                                                                        |
| Subject and Text        | Langchain Output Parser Structured  | Parses AI output for Product info      | Email writer (Product info) | Email writer (Product info)     | Create the draft of the reply email by dividing it into subject and text ready to be sent               |
| Subject and Text 2      | Langchain Output Parser Structured  | Parses AI output for Order info        | Email writer (Order info)  | Email writer (Order info)       | Create the draft of the reply email by dividing it into subject and text ready to be sent               |
| Subject and Text 3      | Langchain Output Parser Structured  | Parses AI output for Others             | Email writer (Others)      | Email writer (Others)           | Create the draft of the reply email by dividing it into subject and text ready to be sent               |
| Email draft - Product info | Gmail                            | Creates Gmail draft for product inquiries | Email writer (Product info) | Save on Sheet (product)         | send the draft to the correct department's company email                                               |
| Email draft - Order info | Gmail                             | Creates Gmail draft for order inquiries | Email writer (Order info)  | Save on Sheet (order)           | send the draft to the correct department's company email                                               |
| Email draft - Other info | Gmail                             | Creates Gmail draft for other inquiries | Email writer (Others)      | Save on Sheet (other)           | send the draft to the correct department's company email                                               |
| Save on Sheet (product) | Google Sheets                      | Logs product inquiry data and draft    | Email draft - Product info | -                               |                                                                                                        |
| Save on Sheet (order)   | Google Sheets                      | Logs order inquiry data and draft      | Email draft - Order info   | -                               |                                                                                                        |
| Save on Sheet (other)   | Google Sheets                      | Logs other inquiry data and draft      | Email draft - Other info   | -                               |                                                                                                        |
| Sticky Note             | Sticky Note                       | Instructions for WordPress plugin setup | -                         | -                               | ## PRELIMINARY STEP - Download the Wordpress Plugin [CF7 to Webhook](https://wordpress.org/plugins/cf7-to-zapier/) and install it - Go to webhook tab on Wordpress and set the url of the n8n Webhook trigger - Set the POST request |
| Sticky Note1            | Sticky Note                       | Reminder to customize classification categories | -                         | -                               | Set your own classification categories                                                                |
| Sticky Note2            | Sticky Note                       | Reminder about email draft creation     | -                         | -                               | Create the draft of the reply email by dividing it into subject and text ready to be sent               |
| Sticky Note3            | Sticky Note                       | Reminder about sending drafts to correct department | -                         | -                               | send the draft to the correct department's company email                                               |
| Sticky Note4            | Sticky Note                       | Workflow purpose and benefits overview  | -                         | -                               | # WordPress Contact Form (CF7) Responses and Classification - This workflow optimizes the management of inquiries received through a contact form on a WordPress site, automating the process of classification, response drafting, and data storage. This workflow is particularly useful for businesses that receive multiple daily inquiries and want to improve their efficiency in managing customer communications. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Name: "From Wordpress"  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Unique identifier (e.g., "61858d25-af82-4cab-bb1b-68bea4989e15")  
   - Purpose: Receive form submissions from WordPress CF7 via webhook.

2. **Create Set Node**  
   - Name: "Set Fields"  
   - Type: Set  
   - Assign fields from incoming webhook JSON body:  
     - first_name = `{{$json.body.first_name}}`  
     - last_name = `{{$json.body.last_name}}`  
     - email = `{{$json.body.email}}`  
     - phone = `{{$json.body.phone}}`  
     - message = `{{$json.body.message}}`  
   - Connect "From Wordpress" → "Set Fields".

3. **Create Google Gemini Chat Model Node**  
   - Name: "Google Gemini Chat Model"  
   - Type: Langchain Google Gemini LM  
   - Model: "models/gemini-2.0-flash"  
   - Credentials: Google PaLM API account  
   - No direct input; used by classifier.

4. **Create Message Classifier Node**  
   - Name: "Message Classifier"  
   - Type: Langchain Text Classifier  
   - Input Text: `{{$json.message}}` from "Set Fields"  
   - System Prompt: Instruct classification into categories with JSON output only.  
   - Categories:  
     - "Product Info" (Product information request)  
     - "Order Info" (Request information on the order placed)  
   - Fallback: "Other"  
   - Connect "Set Fields" → "Message Classifier"  
   - Connect "Google Gemini Chat Model" → "Message Classifier" (AI model input).

5. **Create Three Google Gemini Chat Model Nodes for Email Writing**  
   - Names: "Google Gemini Chat Model1", "Google Gemini Chat Model2", "Google Gemini Chat Model3"  
   - Type: Langchain Google Gemini LM  
   - Model: "models/gemini-2.0-flash-exp"  
   - Credentials: Google PaLM API account  
   - Connect each to respective email writer node.

6. **Create Three Langchain Chain LLM Nodes for Email Drafting**  
   - Names: "Email writer (Product info)", "Email writer (Order info)", "Email writer (Others)"  
   - Type: Langchain Chain LLM  
   - Input Text Template: Includes all form fields and message from "Set Fields".  
   - System Prompt: Detailed instructions for professional, personalized email drafting with placeholders for missing info, tone, structure, and scenario handling.  
   - Output Parser: Enable structured output with "subject" and "text".  
   - Connect "Message Classifier" outputs to these three nodes based on classification category.

7. **Create Three Langchain Output Parser Structured Nodes**  
   - Names: "Subject and Text", "Subject and Text 2", "Subject and Text 3"  
   - Type: Langchain Output Parser Structured  
   - Schema: JSON with "subject" and "text" string properties.  
   - Connect each email writer node to its corresponding output parser node.

8. **Create Three Gmail Nodes for Draft Creation**  
   - Names: "Email draft - Product info", "Email draft - Order info", "Email draft - Other info"  
   - Type: Gmail  
   - Operation: Create draft (do not send immediately)  
   - Subject: `{{$json.output.subject}}` from output parser  
   - Message Body: `{{$json.output.text}}` plus appended original form data (first name, last name, email, phone, message) from "Set Fields"  
   - Recipient: Dynamic, from classification node email field  
   - Credentials: Gmail OAuth2 account  
   - Connect each output parser node to corresponding Gmail node.

9. **Create Three Google Sheets Nodes for Logging**  
   - Names: "Save on Sheet (product)", "Save on Sheet (order)", "Save on Sheet (other)"  
   - Type: Google Sheets  
   - Operation: Append row  
   - Spreadsheet ID and Sheet Name: Set to your target Google Sheets document and sheet (e.g., "Contact Form 7" spreadsheet, "gid=0")  
   - Columns to map:  
     - DATE: Current date formatted as dd/MM/yyyy (`{{$now.format('dd/MM/yyyy')}}`)  
     - FIRST NAME, LAST NAME, EMAIL, PHONE, MESSAGE: From "Set Fields"  
     - CLASSIFIED: Set to classification category or "Other request" (adjust as needed)  
     - DRAFT: Email draft text from respective email writer output  
   - Credentials: Google Sheets OAuth2 account  
   - Connect each Gmail draft node to corresponding Google Sheets node.

10. **Connect Workflow Branches**  
    - From "Message Classifier", route outputs to the three email writer nodes according to classification category.  
    - From each email writer node, connect to its output parser, then to Gmail draft node, then to Google Sheets logging node.

11. **Add Sticky Notes for Documentation**  
    - Add notes for WordPress plugin installation and webhook setup.  
    - Add notes reminding to customize classification categories.  
    - Add notes about email draft creation and sending to correct department.  
    - Add overview note describing workflow purpose and benefits.

---

### 5. General Notes & Resources

| Note Content                                                                                                               | Context or Link                                                                                          |
|----------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Download the WordPress Plugin [CF7 to Webhook](https://wordpress.org/plugins/cf7-to-zapier/) and install it.                | WordPress plugin required to send CF7 form submissions to n8n webhook.                                 |
| Set the webhook URL in WordPress CF7 plugin to the n8n webhook node URL and configure POST requests.                        | Essential for form submission data to reach the workflow.                                              |
| Customize classification categories in the "Message Classifier" node to fit your business needs.                            | Allows adapting the workflow to different inquiry types.                                              |
| Google Gemini (PaLM) API credentials must be configured and valid for AI nodes to function correctly.                       | See Google Cloud documentation for API setup.                                                         |
| Gmail OAuth2 credentials must be authorized with the Gmail account used to create drafts.                                    | Ensure OAuth2 tokens have appropriate scopes for draft creation.                                       |
| Google Sheets OAuth2 credentials must have write access to the target spreadsheet.                                           | Spreadsheet ID and sheet gid must be correctly set in Google Sheets nodes.                             |
| The email drafts created are not sent automatically; they allow manual review and editing before sending.                   | Maintains a personal touch and quality control.                                                        |
| For support or customization, contact: [info@n3w.it](mailto:info@n3w.it) or LinkedIn: [Davide Boizza](https://www.linkedin.com/in/davideboizza/) | Consulting and assistance offered by workflow author.                                                 |

---

This structured documentation provides a complete understanding of the workflow, enabling reproduction, modification, and troubleshooting by advanced users or AI agents.