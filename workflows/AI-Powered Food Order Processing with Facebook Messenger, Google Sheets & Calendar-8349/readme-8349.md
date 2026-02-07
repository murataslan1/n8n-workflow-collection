AI-Powered Food Order Processing with Facebook Messenger, Google Sheets & Calendar

https://n8nworkflows.xyz/workflows/ai-powered-food-order-processing-with-facebook-messenger--google-sheets---calendar-8349


# AI-Powered Food Order Processing with Facebook Messenger, Google Sheets & Calendar

---

## 1. Workflow Overview

This workflow automates **Facebook Messenger-based food order processing** for Karaage Pops, integrating Messenger with Google Sheets and Google Calendar. It listens to customer messages, uses AI to parse orders, logs them in a Google Sheet, schedules fulfillment via Google Calendar, and sends confirmation and upsell messages back to the customer.

**Logical Blocks:**

- **1.1 Webhook Reception & Validation:** Receives and validates Facebook Messenger webhook events, including Facebook’s subscription challenge.
- **1.2 AI Processing & Conversation Management:** Uses LangChain AI Agent with memory buffer to interpret customer messages and maintain conversational context.
- **1.3 Order Parsing & Validation:** Converts free-form order text into structured JSON and validates required fields.
- **1.4 Data Persistence & Scheduling:** Saves validated order details into Google Sheets and creates corresponding Google Calendar events.
- **1.5 Messenger Response & Confirmation:** Sends order confirmations, upsell offers, and menu images back to customers through Facebook Messenger.

---

## 2. Block-by-Block Analysis

### 2.1 Webhook Reception & Validation

**Overview:**  
This block handles incoming HTTP requests from Facebook Messenger, validates the webhook subscription challenge, and forwards actual message events downstream.

**Nodes Involved:**  
- Webhook - FB Messenger  
- Validate Webhook Subscription (If)  
- Respond Challenge  
- Respond 202 (Error fallback)  

**Node Details:**

- **Webhook - FB Messenger**  
  - *Type:* Webhook  
  - *Role:* Entry point receiving Facebook Messenger events and subscription verification requests.  
  - *Configuration:* Path set to `fb-messenger-webhook`; accepts multiple HTTP methods; response controlled by downstream nodes.  
  - *Input/Output:* Receives all webhook calls; outputs to validation node or AI agent node.  
  - *Failure Modes:* Webhook unreachable, invalid verify token, malformed requests.  
  - *Notes:* Must ensure Facebook App webhook URL matches and verify token matches environment variable `FB_VERIFY_TOKEN`.

- **Validate Webhook Subscription**  
  - *Type:* If  
  - *Role:* Checks if the request is a Facebook webhook validation (hub.mode = subscribe and hub.verify_token matches).  
  - *Configuration:* Conditions check `hub.mode` equals `subscribe` and `hub.verify_token` equals `{{YOUR_FB_VERIFY_TOKEN}}`.  
  - *Input/Output:* Input from webhook; if true, sends to Respond Challenge; if false, continues to AI Agent or Respond 202.  
  - *Failure Modes:* Incorrect verify token leads to webhook validation failure.

- **Respond Challenge**  
  - *Type:* Respond to Webhook  
  - *Role:* Responds with the `hub.challenge` query parameter to complete webhook subscription validation.  
  - *Configuration:* Returns plain text body from webhook query `hub.challenge`.  
  - *Input/Output:* Input from Validate Webhook Subscription; output is HTTP 200 response.  
  - *Failure Modes:* Missing challenge parameter would cause invalid response.

- **Respond 202 (Error fallback)**  
  - *Type:* Respond to Webhook  
  - *Role:* Responds to invalid or unexpected webhook calls with HTTP 202 (Accepted) and no data.  
  - *Failure Modes:* Acts as fallback for unhandled webhook payloads.

---

### 2.2 AI Processing & Conversation Management

**Overview:**  
This block uses an AI agent to interpret incoming messages, generate conversational replies or order prompts, and maintains customer session context with a memory buffer.

**Nodes Involved:**  
- OpenRouter Model  
- Memory Buffer (Customer Session)  
- AI Agent (Order Assistant)  
- Respond 200 OK  

**Node Details:**

- **OpenRouter Model**  
  - *Type:* LangChain LM Chat OpenRouter  
  - *Role:* Provides AI language model backend for the AI Agent.  
  - *Configuration:* Uses model `deepseek/deepseek-chat:free`.  
  - *Input/Output:* Feeds AI Agent node; outputs AI model data.  
  - *Failure Modes:* Authentication errors, rate limits, or model unavailability.

- **Memory Buffer (Customer Session)**  
  - *Type:* LangChain Memory Buffer Window  
  - *Role:* Maintains conversation context per customer using sender ID as session key.  
  - *Configuration:* `sessionKey` set to sender ID; context window length 50 interactions.  
  - *Input/Output:* Connected as `ai_memory` input for AI Agent; outputs memory context.  
  - *Failure Modes:* Memory overflow or context loss if session key is misconfigured.

- **AI Agent (Order Assistant)**  
  - *Type:* LangChain Agent  
  - *Role:* Processes customer messages, returns friendly conversational replies or structured order prompts.  
  - *Configuration:* Takes raw message text from webhook JSON; uses a detailed system prompt describing menu, promos, order instructions, and upsell options. Outputs parsed or conversational text.  
  - *Input/Output:* Input from webhook and memory buffer; output connected to Respond 200 OK.  
  - *Failure Modes:* Expression errors if JSON path invalid; AI model errors; prompt misconfiguration.

- **Respond 200 OK**  
  - *Type:* Respond to Webhook  
  - *Role:* Sends HTTP 200 OK to Facebook to acknowledge message receipt.  
  - *Configuration:* No data response.  
  - *Input/Output:* Receives from AI Agent; outputs HTTP response to Facebook.

---

### 2.3 Order Parsing & Validation

**Overview:**  
This block parses the free-form text order into structured JSON and verifies all required fields are present before proceeding to save data.

**Nodes Involved:**  
- Send Message to FB (Text)  
- Check for Menu Trigger (If)  
- Send Message to FB (Image)  
- Send Generic Text (HTTP)  
- Validate Parsed Order (If)  
- Parse Order Text (Code)  
- Respond Raw Items (Debug)  

**Node Details:**

- **Send Message to FB (Text)**  
  - *Type:* HTTP Request  
  - *Role:* Sends AI Agent's textual response back to the customer on Messenger.  
  - *Configuration:* POST to Facebook Graph API `/messages` endpoint using `FB_PAGE_ID` and `FB_PAGE_ACCESS_TOKEN`. Payload includes recipient ID and message text from AI Agent output.  
  - *Input/Output:* Input from Append or Update Orders Sheet node; output to Check for Menu Trigger.  
  - *Failure Modes:* API token errors, network failures.

- **Check for Menu Trigger**  
  - *Type:* If  
  - *Role:* Checks if the AI Agent's output contains the specific phrase indicating the full menu should be sent.  
  - *Configuration:* Condition looks for substring `"Here’s our FULL MENU OF FLAVORS and options for you to choose from"` in AI Agent output.  
  - *Input/Output:* Input from Send Message to FB (Text); if true sends to Send Message to FB (Image), else to Send Generic Text (HTTP).  
  - *Failure Modes:* False negatives if phrase changes.

- **Send Message to FB (Image)**  
  - *Type:* HTTP Request  
  - *Role:* Sends a menu image attachment to the customer.  
  - *Configuration:* POST to Facebook API with message attachment URL `https://i.imgur.com/M4cryeH.jpg`.  
  - *Input/Output:* Input from Check for Menu Trigger true branch.  
  - *Failure Modes:* Image URL invalid, token issues.

- **Send Generic Text (HTTP)**  
  - *Type:* HTTP Request  
  - *Role:* Sends AI Agent’s textual output to Facebook Messenger as chat message.  
  - *Configuration:* Similar to Send Message to FB (Text) node, used for messages other than menu image.  
  - *Input/Output:* Input from Check for Menu Trigger false branch; output to Validate Parsed Order.  
  - *Failure Modes:* Same as other HTTP request nodes.

- **Validate Parsed Order**  
  - *Type:* If  
  - *Role:* Validates presence of required order fields (`Full Name`, `Date`, `Order`, `Delivery Address`) within the AI Agent’s output text before proceeding.  
  - *Configuration:* Checks that these keywords appear in the text of `Send Message to FB (Text)` node’s output.  
  - *Input/Output:* Input from Send Generic Text (HTTP); if true proceeds to Parse Order Text; if false sends to Respond Raw Items (Debug).  
  - *Failure Modes:* Validation fails if order incomplete or malformed.

- **Parse Order Text**  
  - *Type:* Code (JavaScript)  
  - *Role:* Parses multiline free-text order into JSON by splitting on lines and colon separators.  
  - *Configuration:* Custom JavaScript code extracting key:value pairs from the message text.  
  - *Input/Output:* Input from Validate Parsed Order (true branch); output to Append or Update Orders Sheet.  
  - *Failure Modes:* Unexpected text format causing incomplete parsing.

- **Respond Raw Items (Debug)**  
  - *Type:* Respond to Webhook  
  - *Role:* Returns raw incoming webhook payload for debugging purposes with HTTP 100 status.  
  - *Input/Output:* Input from Validate Parsed Order (false branch).  
  - *Use Case:* Helps troubleshoot parsing failures.

---

### 2.4 Data Persistence & Scheduling

**Overview:**  
This block saves the structured order data to Google Sheets and creates a Google Calendar event for order fulfillment scheduling.

**Nodes Involved:**  
- Append or Update Orders Sheet  
- Create Calendar Event  

**Node Details:**

- **Append or Update Orders Sheet**  
  - *Type:* Google Sheets  
  - *Role:* Appends new or updates existing order rows in the Google Sheet.  
  - *Configuration:*  
    - Operation: appendOrUpdate  
    - Document ID: `{{YOUR_GOOGLE_SHEET_ID}}` (environment variable)  
    - Sheet name/GID: `{{YOUR_SHEET_GID_OR_NAME}}`  
    - Columns mapped: Date, Time, Order, Full Name, Contact Number, Delivery Address  
    - Matching column: Full Name (used to update existing rows)  
  - *Input/Output:* Input from Parse Order Text; output to Create Calendar Event and Send Message to FB (Text).  
  - *Failure Modes:* Sheet access permission errors, incorrect document ID, schema mismatch.

- **Create Calendar Event**  
  - *Type:* Google Calendar  
  - *Role:* Creates an event in Google Calendar using order details.  
  - *Configuration:*  
    - Calendar: `{{YOUR_GOOGLE_CALENDAR_EMAIL}}`  
    - Summary: formatted as `{{Order}} ORDERED BY {{Full Name}}`  
  - *Input/Output:* Input from Append or Update Orders Sheet; no direct output downstream.  
  - *Failure Modes:* Calendar permission errors, invalid calendar email.

---

### 2.5 Messenger Response & Confirmation

**Overview:**  
This block sends confirmation messages and optional upsell offers back to the customer in Messenger after order processing.

**Nodes Involved:**  
- Send Message to FB (Text) (used above)  
- Send Message to FB (Image) (used above)  

**Node Details:**

- These nodes are reused for sending confirmation text messages and images such as menu or upsell prompts.  
- Payloads can be customized in HTTP request body to change text, images, or quick replies.  
- They rely on valid Facebook Page ID and Page Access Token credentials.  
- Retry on failure enabled to handle transient network or API errors.

---

## 3. Summary Table

| Node Name                      | Node Type                     | Functional Role                              | Input Node(s)                         | Output Node(s)                         | Sticky Note                                                                                                                |
|-------------------------------|-------------------------------|----------------------------------------------|-------------------------------------|---------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Sticky Note - Main Description | Sticky Note                   | Describes overall workflow purpose           |                                     |                                       | Contains full workflow description, requirements, environment variables, troubleshooting tips                              |
| Sticky Note - Webhook          | Sticky Note                   | Describes webhook validation requirements    |                                     |                                       | Explains Facebook webhook verification & path setup                                                                        |
| Sticky Note - AI Agent         | Sticky Note                   | Describes AI agent and memory buffer         |                                     |                                       | Notes about AI behavior, session key, and prompt customization                                                              |
| Sticky Note - Parsing          | Sticky Note                   | Describes order parsing and validation       |                                     |                                       | Explains parsing free text and validation steps                                                                             |
| Sticky Note - Google Sheets    | Sticky Note                   | Describes Google Sheets node configuration   |                                     |                                       | Details on sheet ID, sheet name/GID, sharing requirements                                                                   |
| Sticky Note - Google Calendar  | Sticky Note                   | Describes Google Calendar node                |                                     |                                       | Notes on calendar email and access permissions                                                                              |
| Sticky Note - Confirmation Msg | Sticky Note                   | Describes Messenger confirmation messages    |                                     |                                       | Explains text and image message sending nodes                                                                                 |
| Webhook - FB Messenger         | Webhook                      | Receives Facebook Messenger webhook events   |                                     | Validate Webhook Subscription, AI Agent | See webhook sticky note                                                                                                      |
| Validate Webhook Subscription  | If                           | Validates Facebook webhook subscription      | Webhook - FB Messenger              | Respond Challenge, Respond 202          | See webhook sticky note                                                                                                      |
| Respond Challenge              | Respond to Webhook           | Responds to Facebook webhook validation       | Validate Webhook Subscription       |                                       |                                                                                                                            |
| Respond 202 (Error fallback)    | Respond to Webhook           | Default webhook response for invalid calls   | Validate Webhook Subscription       |                                       |                                                                                                                            |
| AI Agent (Order Assistant)     | LangChain Agent              | Processes messages with AI, generates reply  | Webhook - FB Messenger, Memory Buffer | Respond 200 OK                         | See AI Agent sticky note                                                                                                    |
| OpenRouter Model               | LangChain LM Chat OpenRouter | AI language model backend                      |                                     | AI Agent (Order Assistant)             | See AI Agent sticky note                                                                                                    |
| Memory Buffer (Customer Session) | LangChain Memory Buffer      | Maintains session context per customer        |                                     | AI Agent (Order Assistant)             | See AI Agent sticky note                                                                                                    |
| Respond 200 OK                | Respond to Webhook           | Sends HTTP 200 OK response to Facebook        | AI Agent (Order Assistant)           |                                       |                                                                                                                            |
| Send Message to FB (Text)      | HTTP Request                 | Sends text messages to Facebook Messenger     | Append or Update Orders Sheet        | Check for Menu Trigger                  | See Confirmation Message sticky note                                                                                        |
| Check for Menu Trigger          | If                           | Detects if full menu message should be sent   | Send Message to FB (Text)            | Send Message to FB (Image), Send Generic Text (HTTP) |                                                                                                                            |
| Send Message to FB (Image)     | HTTP Request                 | Sends image message to Facebook Messenger     | Check for Menu Trigger               |                                       | See Confirmation Message sticky note                                                                                        |
| Send Generic Text (HTTP)        | HTTP Request                 | Sends generic text messages to Facebook       | Check for Menu Trigger               | Validate Parsed Order                   |                                                                                                                            |
| Validate Parsed Order           | If                           | Validates required order fields in AI output  | Send Generic Text (HTTP)             | Parse Order Text, Respond Raw Items (Debug) | See Parsing sticky note                                                                                                      |
| Parse Order Text               | Code                        | Parses free-form text order into JSON          | Validate Parsed Order                | Append or Update Orders Sheet           | See Parsing sticky note                                                                                                      |
| Respond Raw Items (Debug)       | Respond to Webhook           | Debug response with raw webhook payload        | Validate Parsed Order                |                                       |                                                                                                                            |
| Append or Update Orders Sheet   | Google Sheets               | Saves order data to Google Sheets              | Parse Order Text                    | Create Calendar Event, Send Message to FB (Text) | See Google Sheets sticky note                                                                                               |
| Create Calendar Event          | Google Calendar             | Creates Google Calendar events for orders      | Append or Update Orders Sheet        |                                       | See Google Calendar sticky note                                                                                            |

---

## 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Path: `fb-messenger-webhook`  
   - Methods: Accept multiple HTTP methods (GET, POST)  
   - Response Mode: Use response nodes downstream  
   - Credential: None yet  

2. **Add 'Validate Webhook Subscription' If Node**  
   - Conditions:  
     - `hub.mode` equals `subscribe`  
     - `hub.verify_token` equals environment variable or credential `YOUR_FB_VERIFY_TOKEN`  
   - Connect Webhook main output to this node  

3. **Add 'Respond Challenge' Node (Respond to Webhook)**  
   - Response Body: `={{ $json.query['hub.challenge'] }}`  
   - Content-Type: text/plain  
   - Connect 'Validate Webhook Subscription' true output to this node  

4. **Add 'Respond 202 (Error fallback)' Node (Respond to Webhook)**  
   - Response Code: 202  
   - No response body  
   - Connect 'Validate Webhook Subscription' false output to this node  

5. **Add OpenRouter Model Node (LangChain LM Chat OpenRouter)**  
   - Model: `deepseek/deepseek-chat:free`  
   - Connect output to AI Agent node  

6. **Add Memory Buffer Node (LangChain Memory Buffer Window)**  
   - Session Key: `={{ $json.body.entry[0].messaging[0].sender.id }}`  
   - Context Window Length: 50  
   - Connect to AI Agent as `ai_memory` input  

7. **Add AI Agent Node (LangChain Agent)**  
   - Input Text: `={{ $json.body.entry[0].messaging[0].message.text }}`  
   - System Prompt: Detailed menu, promos, order instructions, upsell offers as described in the main sticky note  
   - Connect `ai_languageModel` input to OpenRouter Model output  
   - Connect `ai_memory` input to Memory Buffer node output  
   - Connect Webhook node output (false branch from validation) to AI Agent input  
   - Connect AI Agent output to 'Respond 200 OK' node  

8. **Add 'Respond 200 OK' Node (Respond to Webhook)**  
   - Response Code: 200  
   - No response body  
   - Connect AI Agent output here  

9. **Add 'Send Message to FB (Text)' Node (HTTP Request)**  
   - Method: POST  
   - URL: `https://graph.facebook.com/v13.0/{{FB_PAGE_ID}}/messages`  
   - Query Parameters: `access_token={{FB_PAGE_ACCESS_TOKEN}}`  
   - Body (JSON):  
     ```json
     {
       "recipient": { "id": "{{ $json.body.entry[0].messaging[0].sender.id }}" },
       "message": { "text": {{ JSON.stringify($('AI Agent (Order Assistant)').item.json.output) }} },
       "messaging_type": "RESPONSE",
       "notification_type": "REGULAR"
     }
     ```  
   - Connect output from Append or Update Orders Sheet node (see below) to this node  

10. **Add 'Check for Menu Trigger' If Node**  
    - Condition: Check if `AI Agent (Order Assistant)` output text contains the phrase `"Here’s our FULL MENU OF FLAVORS and options for you to choose from"`  
    - Connect 'Send Message to FB (Text)' output to this node  

11. **Add 'Send Message to FB (Image)' Node (HTTP Request)**  
    - Method: POST  
    - URL: same Facebook messages endpoint  
    - Query Parameters: `access_token={{FB_PAGE_ACCESS_TOKEN}}`  
    - Body (JSON):  
      ```json
      {
        "recipient": { "id": "{{ $json.body.entry[0].messaging[0].sender.id }}" },
        "message": {
          "attachment": {
            "type": "image",
            "payload": { "url": "https://i.imgur.com/M4cryeH.jpg", "is_reusable": true }
          }
        },
        "messaging_type": "RESPONSE",
        "notification_type": "REGULAR"
      }
      ```  
    - Connect 'Check for Menu Trigger' true output to this node  

12. **Add 'Send Generic Text (HTTP)' Node (HTTP Request)**  
    - Similar configuration as 'Send Message to FB (Text)' node  
    - Connect 'Check for Menu Trigger' false output to this node  

13. **Add 'Validate Parsed Order' If Node**  
    - Conditions: Check if output from 'Send Message to FB (Text)' contains keywords: "Full Name", "Date", "Order", "Delivery Address"  
    - Connect 'Send Generic Text (HTTP)' output to this node  

14. **Add 'Parse Order Text' Node (Code)**  
    - JavaScript code to split message text into key-value pairs, returning JSON object:  
    ```js
    const text = $('Webhook - FB Messenger').first().json.body.entry[0].messaging[0].message.text;
    const lines = text.split(/\r?\n/);
    const result = {};
    lines.forEach(line => {
      const [key, ...rest] = line.split(':');
      if (key && rest.length) {
        result[key.trim().replace(/^[^a-zA-Z0-9]+/g, '')] = rest.join(':').trim();
      }
    });
    return [{ json: result }];
    ```  
    - Connect 'Validate Parsed Order' true output to this node  

15. **Add 'Respond Raw Items (Debug)' Node (Respond to Webhook)**  
    - Response Code: 100 (debugging)  
    - Respond with all incoming items  
    - Connect 'Validate Parsed Order' false output to this node  

16. **Add 'Append or Update Orders Sheet' Node (Google Sheets)**  
    - Operation: appendOrUpdate  
    - Document ID: `{{YOUR_GOOGLE_SHEET_ID}}` (credential or env var)  
    - Sheet Name/GID: `{{YOUR_SHEET_GID_OR_NAME}}`  
    - Columns mapped: Date, Time, Order, Full Name, Contact Number, Delivery Address  
    - Matching Columns: ["Full Name"]  
    - Connect 'Parse Order Text' output to this node  

17. **Add 'Create Calendar Event' Node (Google Calendar)**  
    - Calendar Email: `{{YOUR_GOOGLE_CALENDAR_EMAIL}}`  
    - Summary: `={{ $json.Order }} ORDERED BY {{ $json['Full Name'] }}`  
    - Connect 'Append or Update Orders Sheet' output to this node  

18. **Connect 'Append or Update Orders Sheet' output also to 'Send Message to FB (Text)' node** (step 9) to send confirmation after data persistence.

---

## 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                              | Context or Link                                                    |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| Facebook App must be in Live Mode, webhook URL reachable, and verify token set correctly for webhook triggering.                                                                                                                         | Sticky Note - Webhook                                             |
| Google Sheets must have columns: Date, Time, Order, Full Name, Contact Number, Delivery Address, and be shared with Google account used by n8n.                                                                                         | Sticky Note - Google Sheets                                       |
| Google Calendar email must be accessible by the connected Google account in n8n.                                                                                                                                                         | Sticky Note - Google Calendar                                     |
| AI Agent’s system prompt can be customized inside the AI Agent node to adjust conversation and parsing behavior.                                                                                                                        | Sticky Note - AI Agent                                            |
| Confirmation messages and upsell offers are customizable by editing HTTP request JSON payloads in the Send Message to FB nodes.                                                                                                         | Sticky Note - Confirmation Message                                |
| Use environment variables or n8n credentials to store sensitive tokens (`FB_PAGE_ACCESS_TOKEN`, `FB_VERIFY_TOKEN`, Google API credentials) to avoid hardcoding secrets in workflow JSON.                                                   | Sticky Note - Main Description                                    |
| For troubleshooting, use the Respond Raw Items (Debug) node to inspect webhook payloads and parsing results.                                                                                                                            | Parsing sticky note and debug node                                |
| Workflow tested with Facebook Messenger API version v13.0; adjust URLs if Facebook updates API versions.                                                                                                                                 | General best practice                                             |
| LangChain OpenRouter model `deepseek/deepseek-chat:free` used; replace with preferred AI model and configure credentials accordingly.                                                                                                   | AI Agent node configuration                                      |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.

---