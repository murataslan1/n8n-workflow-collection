Automate Email Tracking & Generate Pixel for Lead Nurturing with Google Sheet

https://n8nworkflows.xyz/workflows/automate-email-tracking---generate-pixel-for-lead-nurturing-with-google-sheet-11248


# Automate Email Tracking & Generate Pixel for Lead Nurturing with Google Sheet

### 1. Workflow Overview

This workflow automates personalized lead nurturing emails with real-time open tracking using a unique invisible tracking pixel embedded in each email. It targets sales and marketing teams who want to monitor email engagement directly from a Google Sheets CRM.

The workflow logic is divided into two main functional blocks:

- **1.1 Lead Email Generation & Sending**:  
  Retrieves leads from a Google Sheet, generates a unique tracking pixel per lead, uses OpenAI to craft personalized HTML emails embedding the pixel, sends these emails via Gmail, and updates the CRM sheet with send status and pixel ID.

- **1.2 Email Open Tracking & CRM Update**:  
  Listens for tracking pixel requests via webhook when recipients open the email, decodes query parameters to identify the lead and pixel, updates the Google Sheet CRM to mark the email as opened.

---

### 2. Block-by-Block Analysis

#### 2.1 Lead Email Generation & Sending

**Overview:**  
This block handles retrieving leads from Google Sheets, generating a unique tracking pixel per lead, creating a personalized email body using OpenAI, sending the email through Gmail, and updating the CRM with send details.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Get CRM (Google Sheets)  
- Loop Over Items (SplitInBatches)  
- Generate Pixel (Set)  
- Email Agent (@n8n/n8n-nodes-langchain.agent)  
- OpenAI Chat Model (@n8n/n8n-nodes-langchain.lmChatOpenAi)  
- Send email (Gmail)  
- Update CRM (Google Sheets)

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Entry point for manual workflow execution to send emails.  
  - Config: No parameters.  
  - Input: None  
  - Output: Triggers "Get CRM" node.

- **Get CRM**  
  - Type: Google Sheets  
  - Role: Retrieves lead data from Google Sheet, filtering rows where "EMAIL 1 SEND" is empty (unsent leads).  
  - Config: Reads from a specific Google Sheets document and sheet ("Lead nurturing", "Foglio1"). Uses OAuth2 credentials.  
  - Input: Manual Trigger  
  - Output: Passes lead data to Loop Over Items.  
  - Edge Cases: Google API quota limits, credential expiration, empty result sets.

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Role: Processes leads one by one to handle individual email generation and sending.  
  - Config: Default batch size (1) to process single lead per iteration.  
  - Input: Lead items from Get CRM  
  - Output: Passes single lead item to Generate Pixel.  
  - Edge Cases: Large lead lists could slow processing, batch size should be manageable.

- **Generate Pixel**  
  - Type: Set  
  - Role: Creates a unique tracking pixel ID string and sets the email and webhook URL placeholders.  
  - Config: Pixel generated as 15 random alphanumeric characters plus one special character randomly chosen among ['!', '@', '#', '$', '%', '&', '*']. Email field statically set as "email-1" (likely a placeholder). Webhook URL is a string placeholder to be replaced by the actual webhook URL.  
  - Input: Single lead from Loop Over Items  
  - Output: Data passed to Email Agent.  
  - Edge Cases: Random pixel collision unlikely but possible; webhook URL must be updated to actual deployed URL.

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat  
  - Role: Provides the language model for the Email Agent to generate email text.  
  - Config: Uses "gpt-5-mini" model with OpenAI API credentials configured.  
  - Input: Called by Email Agent node.  
  - Output: Returns AI-generated email body in HTML.  
  - Edge Cases: API quota, latency, prompt failures.

- **Email Agent**  
  - Type: Langchain Agent  
  - Role: Crafts a lead conversion email with a clear call-to-action and embeds the unique tracking pixel in the email HTML body.  
  - Config: Static prompt includes embedding the pixel image with the URL query parameters for pixel and email. Returns only the email body in HTML.  
  - Input: Data from Generate Pixel, uses OpenAI Chat Model for generation.  
  - Output: Email HTML body passed to Send email.  
  - Edge Cases: Prompt failures, incomplete or malformed HTML generation.

- **Send email**  
  - Type: Gmail  
  - Role: Sends the generated email to the lead’s email address.  
  - Config: Sends to the email extracted from the Get CRM node JSON data. The email body is the output from Email Agent. Subject is "Email 1". Uses Gmail OAuth2 credentials.  
  - Input: Email body and recipient email  
  - Output: Passes send status to Update CRM.  
  - Edge Cases: Gmail API rate limits, OAuth token expiration, invalid email addresses.

- **Update CRM**  
  - Type: Google Sheets  
  - Role: Updates the lead row in the Google Sheet with the send date (current date), the Gmail message ID, and the generated pixel ID.  
  - Config: Matches rows by "row_number" and updates columns "EMAIL 1 DATE", "EMAIL 1 SEND", and "PIXEL EMAIL 1". Uses same Google Sheets OAuth2 credentials.  
  - Input: Send email node output and Get CRM reference for row number  
  - Output: Loops back to Loop Over Items to process next lead.  
  - Edge Cases: Update failures if row number not found, Google API errors.

---

#### 2.2 Email Open Tracking & CRM Update

**Overview:**  
This block listens for incoming HTTP requests triggered by the tracking pixel loading in the recipient's email client, extracts tracking data, and updates the CRM to mark the email as opened.

**Nodes Involved:**  
- Webhook (HTTP Inbound)  
- Create data pixel in base64 (Set)  
- Create pixel image (ConvertToFile)  
- Respond to Webhook  
- Get vars (Set)  
- Update Open email 1 (Google Sheets)

**Node Details:**

- **Webhook**  
  - Type: Webhook (HTTP Input)  
  - Role: Receives requests when the tracking pixel is loaded in the recipient's email client.  
  - Config: Receives on path "e995cbaa-9259-4685-a144-16a700d0a71d", responds with binary data.  
  - Input: External HTTP request with query parameters "pixel" and "email".  
  - Output: Passes request data to Create data pixel in base64.  
  - Edge Cases: Invalid or missing query parameters, unauthorized access, webhook URL must be publicly accessible.

- **Create data pixel in base64**  
  - Type: Set  
  - Role: Sets the pixel image data as a base64 PNG string to serve as the response to the webhook request.  
  - Config: Static base64-encoded 1x1 transparent PNG image data.  
  - Input: Webhook request data  
  - Output: Passes binary image data to Create pixel image.  
  - Edge Cases: None significant; static data.

- **Create pixel image**  
  - Type: ConvertToFile  
  - Role: Converts the base64 data string to binary image file format (PNG) for response.  
  - Config: MIME type set to image/png, source property is "data".  
  - Input: Base64 data from previous Set node  
  - Output: Passes binary image to Respond to Webhook and Get vars.  
  - Edge Cases: Conversion failures unlikely but possible with corrupted data.

- **Respond to Webhook**  
  - Type: Respond to Webhook  
  - Role: Sends the 1x1 transparent PNG image back as the HTTP response to the tracking pixel request.  
  - Config: Responds with binary data.  
  - Input: Binary image from ConvertToFile  
  - Output: Ends webhook response.  
  - Edge Cases: Timeout or response failures.

- **Get vars**  
  - Type: Set  
  - Role: Extracts "pixel" and "email" query parameters from the webhook request for CRM update.  
  - Config: Sets variables from webhook query parameters: pixel and email.  
  - Input: Webhook request data  
  - Output: Passes variables to Update Open email 1.  
  - Edge Cases: Missing or malformed parameters.

- **Update Open email 1**  
  - Type: Google Sheets  
  - Role: Updates the CRM to mark that the email with the corresponding pixel was opened ("OPEN EMAIL 1" = "yes") and confirms the pixel ID.  
  - Config: Matches rows by "PIXEL EMAIL 1" column, updates "OPEN EMAIL 1" to "yes" and "PIXEL EMAIL 1" to the pixel ID. Uses Google Sheets OAuth2 credentials.  
  - Input: Variables from Get vars node.  
  - Output: None (terminal).  
  - Edge Cases: Pixel ID not found in sheet, update failures, Google API errors.

---

### 3. Summary Table

| Node Name               | Node Type                               | Functional Role                           | Input Node(s)                      | Output Node(s)             | Sticky Note                                                                                                                       |
|-------------------------|---------------------------------------|-----------------------------------------|----------------------------------|----------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                      | Starts the workflow manually             | None                             | Get CRM                    |                                                                                                                                  |
| Get CRM                 | Google Sheets                         | Retrieves lead data with filter          | When clicking ‘Execute workflow’ | Loop Over Items             |                                                                                                                                  |
| Loop Over Items         | SplitInBatches                       | Processes leads one by one                | Get CRM                         | Generate Pixel              |                                                                                                                                  |
| Generate Pixel          | Set                                  | Creates unique tracking pixel and email | Loop Over Items                 | Email Agent                 |                                                                                                                                  |
| OpenAI Chat Model       | Langchain OpenAI Chat Model          | AI model used for generating email text  | Email Agent (ai_languageModel)  | Email Agent                 |                                                                                                                                  |
| Email Agent             | Langchain Agent                      | Generates personalized email HTML body   | Generate Pixel, OpenAI Chat Model| Send email                  |                                                                                                                                  |
| Send email              | Gmail                               | Sends the email to the lead               | Email Agent                    | Update CRM                 |                                                                                                                                  |
| Update CRM              | Google Sheets                       | Updates sheet with send date, pixel ID   | Send email                    | Loop Over Items             |                                                                                                                                  |
| Webhook                 | Webhook HTTP Input                   | Receives pixel image requests             | External HTTP request           | Create data pixel in base64 |                                                                                                                                  |
| Create data pixel in base64 | Set                             | Sets base64 PNG image data for response   | Webhook                       | Create pixel image          |                                                                                                                                  |
| Create pixel image      | ConvertToFile                       | Converts base64 string to binary PNG      | Create data pixel in base64    | Respond to Webhook, Get vars|                                                                                                                                  |
| Respond to Webhook      | Respond to Webhook                  | Sends pixel image as HTTP response        | Create pixel image             | None                       |                                                                                                                                  |
| Get vars                | Set                                | Extracts pixel and email query parameters | Create pixel image             | Update Open email 1         |                                                                                                                                  |
| Update Open email 1     | Google Sheets                      | Marks email as opened in CRM               | Get vars                      | None                       |                                                                                                                                  |
| Sticky Note             | Sticky Note                       | Documentation and explanation              | None                         | None                       | ## Automate Email Tracking & Generate Pixel for Lead Nurturing ... (full content in node)                                         |
| Sticky Note1            | Sticky Note                       | Reminder about webhook URL setup           | None                         | None                       | ## STEP 2 - Set webook url ...                                                                                                   |
| Sticky Note2            | Sticky Note                       | Instructions to clone and prepare Google Sheet | None                         | None                       | ## STEP 1 - Clone CRM in Google Sheet ...                                                                                         |
| Sticky Note3            | Sticky Note                       | Reminder about generating and sending Email 1 | None                         | None                       | ## STEP 3 - Generate and send Email 1 ...                                                                                         |
| Sticky Note4            | Sticky Note                       | Explains how the webhook triggers on pixel load | None                         | None                       | ## STEP 4 ...                                                                                                                     |
| Sticky Note5            | Sticky Note                       | Explains CRM update on email open          | None                         | None                       | ## STEP 5 - Update CRM ...                                                                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**
   - Type: Manual Trigger  
   - Purpose: To manually start the workflow.

2. **Create Google Sheets Node “Get CRM”**
   - Operation: Read rows  
   - Sheet: Specify your Google Sheet document and sheet name ("Lead nurturing", "Foglio1").  
   - Filter: Only rows where "EMAIL 1 SEND" is empty (unsent leads).  
   - Credentials: Connect Google Sheets OAuth2 account.

3. **Create SplitInBatches Node “Loop Over Items”**
   - Batch Size: 1  
   - Connect input from “Get CRM” node.

4. **Create Set Node “Generate Pixel”**
   - Assignments:  
     - pixel: Generate a 15-character random alphanumeric string plus one random special character from ! @ # $ % & *  
       Expression example: `={{ Array.from({length: 15}, () => Math.random().toString(36).charAt(2)).join('') + ['!', '@', '#', '$', '%', '&', '*'][Math.floor(Math.random() * 7)] }}`  
     - email: Static string `"email-1"` (optionally replace with dynamic email if needed)  
     - webhook_url: Set to your actual n8n webhook URL (replace placeholder)  
   - Connect input from “Loop Over Items”.

5. **Create Langchain OpenAI Chat Model Node “OpenAI Chat Model”**
   - Model: Use “gpt-5-mini” or any preferred OpenAI model.  
   - Credentials: Provide OpenAI API credentials.

6. **Create Langchain Agent Node “Email Agent”**
   - Text Prompt:  
     ```
     Write a lead conversion email with a clear call-to-action button. Include this conversion tracking pixel in the HTML body:

     <img src="{{$json.webhook_url}}?pixel={{ $json.pixel }}&email={{ $json.email }}" width="1" height="1" style="display:none;">

     Return only the email body in HTML format, no introductions or explanations.
     ```
   - Connect AI Language Model input to “OpenAI Chat Model” node.  
   - Connect input from “Generate Pixel”.

7. **Create Gmail Node “Send email”**
   - Send To: Use email from the lead data, e.g. `={{ $('Get CRM').item.json.EMAIL }}`  
   - Subject: “Email 1”  
   - Message: Use output from “Email Agent” node.  
   - Credentials: Gmail OAuth2 credentials.  
   - Connect input from “Email Agent”.

8. **Create Google Sheets Node “Update CRM”**
   - Operation: Update  
   - Match by: “row_number” from lead data  
   - Columns to update:  
     - "EMAIL 1 DATE": Current date `={{$now.format('dd/LL/yyyy')}}`  
     - "EMAIL 1 SEND": Message ID or email sent ID from Gmail node output  
     - "PIXEL EMAIL 1": Pixel string from “Generate Pixel” node  
   - Credentials: Google Sheets OAuth2 credentials.  
   - Connect input from “Send email”.  
   - Connect output back to “Loop Over Items” to continue batch processing.

9. **Create Webhook Node “Webhook”**
   - Path: Unique endpoint path (e.g. “e995cbaa-9259-4685-a144-16a700d0a71d”)  
   - Response Mode: “responseNode” to allow binary response.  
   - No credentials needed (public endpoint).  

10. **Create Set Node “Create data pixel in base64”**
    - Assignments: Set a variable “data” with base64 string of a transparent 1x1 PNG image (static string provided).  
    - Connect input from “Webhook”.

11. **Create ConvertToFile Node “Create pixel image”**
    - Operation: toBinary  
    - MIME Type: image/png  
    - Source Property: “data”  
    - Connect input from “Create data pixel in base64”.

12. **Create Respond to Webhook Node “Respond to Webhook”**
    - Respond with: binary data from “Create pixel image”.  
    - Connect input from “Create pixel image”.

13. **Create Set Node “Get vars”**
    - Assignments:  
      - pixel: Extract from webhook query parameter `={{ $('Webhook').item.json.query.pixel }}`  
      - email: Extract from webhook query parameter `={{ $('Webhook').item.json.query.email }}`  
    - Connect input from “Create pixel image”.

14. **Create Google Sheets Node “Update Open email 1”**
    - Operation: Update  
    - Match by: “PIXEL EMAIL 1” column  
    - Columns to update:  
      - "OPEN EMAIL 1": Set to “yes”  
      - "PIXEL EMAIL 1": Update with pixel ID from "Get vars"  
    - Credentials: Google Sheets OAuth2 credentials.  
    - Connect input from “Get vars”.

15. **Add Sticky Notes (optional) for documentation**  
    - Add instructions on cloning the Google Sheet template, webhook URL setup, email generation, pixel tracking, and CRM updating as per original workflow notes.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                              | Context or Link                                                                                              |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Clone this sheet and fill in the columns "Date", "First Name", "Last Name", and "Email" to start using the workflow.                                                                                                                                                      | [Google Sheet Template](https://docs.google.com/spreadsheets/d/1zgmgqTW3IVfI9BqCGyXHvDj1F80Yn8ibuwAjT-cxSmM/edit?usp=sharing) |
| Set the webhook URL in the “Generate Pixel” node to your actual n8n webhook endpoint. The workflow must be active for the webhook to correctly trigger.                                                                                                                   | Internal note                                                                                                 |
| The workflow generates personalized emails with embedded pixels to track opens, updating the CRM sheet in real-time based on pixel loading.                                                                                                                                 | Internal note                                                                                                 |
| The pixel image served is a 1x1 transparent PNG encoded in base64, served via the webhook to trigger the tracking event without disturbing the user experience.                                                                                                            | Internal note                                                                                                 |
| Use valid OAuth2 credentials for Google Sheets and Gmail nodes to ensure authorization and smooth operation.                                                                                                                                                                | Internal note                                                                                                 |
| OpenAI is used to generate dynamic email body content based on the prompt including the pixel URL. Ensure your OpenAI API key is valid and has sufficient quota.                                                                                                            | Internal note                                                                                                 |
| For effective tracking, ensure email clients do not block remote images or tracking pixels.                                                                                                                                                                                 | General email marketing best practice                                                                         |
| This workflow was designed for lead nurturing with Google Sheets CRM and can be extended to additional email sequences or pixel tracking for clicks and replies by adapting the sheet and nodes accordingly.                                                                 | General scalability note                                                                                       |

---

**Disclaimer:** The provided text is exclusively from an automated workflow created with n8n, respecting content policies and containing no illegal or offensive elements. All data processed is legal and public.