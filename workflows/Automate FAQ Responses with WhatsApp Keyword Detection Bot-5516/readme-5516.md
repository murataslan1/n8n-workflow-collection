Automate FAQ Responses with WhatsApp Keyword Detection Bot

https://n8nworkflows.xyz/workflows/automate-faq-responses-with-whatsapp-keyword-detection-bot-5516


# Automate FAQ Responses with WhatsApp Keyword Detection Bot

### 1. Workflow Overview

This workflow implements an automated WhatsApp chatbot designed to provide instant answers to frequently asked questions (FAQs) by detecting keywords in incoming customer messages. It targets small businesses or support teams aiming to automate responses to common queries such as business hours, pricing, location, and contact information, thereby reducing manual workload and improving response times.

The workflow is logically divided into six main functional blocks:

- **1.1 Input Reception:** Continuously listens for incoming WhatsApp messages via the WhatsApp Business API.
- **1.2 Message Filtering:** Filters incoming messages to process only text messages, redirecting others to a fallback message.
- **1.3 Data Extraction:** Extracts and normalizes message content and sender information for further processing.
- **1.4 Keyword Detection:** Analyzes the cleaned message text to route it to the appropriate FAQ category using keyword matching.
- **1.5 Response Generation:** Generates professionally formatted, emoji-enhanced responses tailored to the detected category.
- **1.6 Message Delivery:** Sends the selected response back to the customer via WhatsApp.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Listens for all incoming WhatsApp messages in real-time, triggering the workflow upon message receipt.

- **Nodes Involved:**  
  - Incoming WhatsApp Messages

- **Node Details:**

  - **Incoming WhatsApp Messages**  
    - Type: WhatsApp Trigger  
    - Role: Entry point that listens for WhatsApp messages via webhook linked to WhatsApp Business API.  
    - Configuration: Listens to "messages" updates only, using a webhook identified as "whatsapp-support-webhook".  
    - Inputs: None (trigger node)  
    - Outputs: Passes raw message JSON to next node  
    - Version-specific: Requires WhatsApp Business API setup and phone number ID configuration on Meta platform.  
    - Failure modes: Webhook misconfiguration, API authentication failure, network issues.  
    - Notes: This node is crucial as the workflow’s entry and must have correct webhook URL registered with WhatsApp Business API.

#### 1.2 Message Filtering

- **Overview:**  
  Filters messages to process only those of type "text". Non-text messages receive an automated friendly notification.

- **Nodes Involved:**  
  - Filter Text Messages Only  
  - Handle Unsupported Message Types

- **Node Details:**

  - **Filter Text Messages Only**  
    - Type: IF node  
    - Role: Checks if the message type equals "text".  
    - Configuration: Condition uses expression `{{$json.messages[0].type}} === 'text'`, case-sensitive strict matching.  
    - Inputs: From Incoming WhatsApp Messages  
    - Outputs:  
      - True branch: Text messages routed to data extraction  
      - False branch: Non-text messages routed to fallback response node  
    - Failure modes: Malformed message JSON, missing `messages[0].type` attribute.

  - **Handle Unsupported Message Types**  
    - Type: WhatsApp Node (send operation)  
    - Role: Sends a polite message explaining that only text messages are supported.  
    - Configuration: Sends fixed text explaining to send text messages and offers ‘hello’ command for guidance. Uses same sender phone number from incoming message.  
    - Inputs: False branch of filter node  
    - Outputs: None (end of branch)  
    - Failure modes: WhatsApp API send failure, invalid phone number format.

#### 1.3 Data Extraction

- **Overview:**  
  Extracts relevant data fields from the incoming message and normalizes the text for keyword detection.

- **Nodes Involved:**  
  - Extract Message Content

- **Node Details:**

  - **Extract Message Content**  
    - Type: Set node  
    - Role: Extracts and prepares message text and sender info for downstream processing.  
    - Configuration:  
      - `message_text`: Lowercase and trimmed message body from `$json.messages[0].text.body`  
      - `sender_phone`: Original sender phone number from `$json.messages[0].from`  
      - `message_id`: Message ID from `$json.messages[0].id`  
    - Inputs: True branch of filter node  
    - Outputs: Passes cleaned data to keyword detection  
    - Failure modes: Missing or malformed text body, unexpected JSON structure.

#### 1.4 Keyword Detection

- **Overview:**  
  Detects keywords in the cleaned message text to classify the query into one of several FAQ categories using a Switch node.

- **Nodes Involved:**  
  - FAQ Keyword Detection

- **Node Details:**

  - **FAQ Keyword Detection**  
    - Type: Switch node  
    - Role: Routes messages based on keyword presence in `message_text`.  
    - Configuration:  
      - Case-insensitive matching for keywords grouped into 5 categories:  
        - Business Hours: contains "hours", "open", "close", "time"  
        - Pricing: contains "price", "cost", "fee", "money"  
        - Location: contains "address", "location", "where", "find"  
        - Contact: contains "contact", "phone", "email", "support"  
        - Greeting: contains "hello", "hi", "hey", "start"  
      - Outputs: Each category routes to a corresponding response generator node.  
    - Inputs: From Extract Message Content  
    - Outputs: Up to 5 branches, one per category  
    - Failure modes: Misclassification if message text does not contain recognized keywords; no explicit fallback in switch (handled downstream).  
    - Notes: Case insensitivity and multiple keywords per category enhance natural language understanding.

#### 1.5 Response Generation

- **Overview:**  
  Generates customized, formatted responses including emojis and dynamic content for each detected category.

- **Nodes Involved:**  
  - Business Hours Response  
  - Pricing Information Response  
  - Location Information Response  
  - Contact Information Response  
  - Welcome Menu Response  
  - Helpful Fallback Response (used if no keywords matched, outside switch)

- **Node Details:**

  - **Business Hours Response**  
    - Type: Set node  
    - Role: Sends business hours schedule with dynamic open/closed status based on current time.  
    - Configuration: Response text includes hours and uses JavaScript expression to display open/closed status dynamically.  
    - Inputs: Switch output "Business Hours"  
    - Outputs: To Send WhatsApp Reply  
    - Edge cases: Timezone differences may affect status accuracy if server/timezone is not set properly.

  - **Pricing Information Response**  
    - Type: Set node  
    - Role: Provides detailed pricing packages with emojis and bullet points.  
    - Inputs: Switch output "Pricing"  
    - Outputs: To Send WhatsApp Reply

  - **Location Information Response**  
    - Type: Set node  
    - Role: Shares office address, nearby transport, parking info, and Google Maps link.  
    - Inputs: Switch output "Location"  
    - Outputs: To Send WhatsApp Reply

  - **Contact Information Response**  
    - Type: Set node  
    - Role: Lists support phone, email, live chat, social media, and response times.  
    - Inputs: Switch output "Contact"  
    - Outputs: To Send WhatsApp Reply

  - **Welcome Menu Response**  
    - Type: Set node  
    - Role: Provides a welcome greeting with quick menu instructions and usage tips.  
    - Inputs: Switch output "Greeting"  
    - Outputs: To Send WhatsApp Reply

  - **Helpful Fallback Response**  
    - Type: Set node  
    - Role: Sent when incoming message does not match any keyword category (typically attached outside switch, fallback not explicit in switch).  
    - Configuration: Friendly message with available commands and examples, encouraging user to try again or contact support.  
    - Inputs: (Not directly connected in JSON but logically expected as fallback)  
    - Outputs: To Send WhatsApp Reply

#### 1.6 Message Delivery

- **Overview:**  
  Sends the selected and formatted response back to the customer via WhatsApp.

- **Nodes Involved:**  
  - Send WhatsApp Reply

- **Node Details:**

  - **Send WhatsApp Reply**  
    - Type: WhatsApp node (send operation)  
    - Role: Delivers the response text to the user's WhatsApp number.  
    - Configuration:  
      - `textBody`: Uses expression to get `response_text` from the incoming JSON data.  
      - `phoneNumberId`: Placeholder for WhatsApp Business API phone number ID (must be replaced).  
      - `recipientPhoneNumber`: Sourced from `sender_phone` extracted previously.  
      - Additional: Preview URL disabled.  
    - Inputs: From all response generation nodes  
    - Outputs: None (end of workflow path)  
    - Failure modes: API authentication failure, incorrect phone number format, message quota exceeded.

---

### 3. Summary Table

| Node Name                      | Node Type             | Functional Role              | Input Node(s)                 | Output Node(s)                     | Sticky Note                                                                                                                     |
|-------------------------------|-----------------------|-----------------------------|------------------------------|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Incoming WhatsApp Messages     | WhatsApp Trigger      | Entry point for incoming messages | None                         | Filter Text Messages Only          | # 📱 WhatsApp Customer Support Bot ... *Listens constantly for customer messages*                                               |
| Filter Text Messages Only      | IF                    | Filters text messages only  | Incoming WhatsApp Messages    | Extract Message Content, Handle Unsupported Message Types | *Keeps bot focused and reliable*                                                                                              |
| Handle Unsupported Message Types | WhatsApp (Send)       | Sends fallback for non-text messages | Filter Text Messages Only    | None                             |                                                                                                                                |
| Extract Message Content        | Set                   | Extracts and normalizes data | Filter Text Messages Only     | FAQ Keyword Detection             | *Prepares data for keyword matching*                                                                                           |
| FAQ Keyword Detection          | Switch                | Routes message by keyword   | Extract Message Content        | Business Hours Response, Pricing Information Response, Location Information Response, Contact Information Response, Welcome Menu Response | *Intelligent message routing*                                                                                                  |
| Business Hours Response        | Set                   | Creates business hours reply | FAQ Keyword Detection          | Send WhatsApp Reply               | *Consistent, professional communication*                                                                                       |
| Pricing Information Response   | Set                   | Creates pricing info reply  | FAQ Keyword Detection          | Send WhatsApp Reply               |                                                                                                                                |
| Location Information Response  | Set                   | Creates location info reply | FAQ Keyword Detection          | Send WhatsApp Reply               |                                                                                                                                |
| Contact Information Response   | Set                   | Creates contact info reply  | FAQ Keyword Detection          | Send WhatsApp Reply               |                                                                                                                                |
| Welcome Menu Response          | Set                   | Creates greeting/menu reply | FAQ Keyword Detection          | Send WhatsApp Reply               |                                                                                                                                |
| Helpful Fallback Response      | Set                   | Creates fallback reply for unknown queries | (Implicit fallback outside switch) | Send WhatsApp Reply               |                                                                                                                                |
| Send WhatsApp Reply            | WhatsApp (Send)       | Sends response to customer  | Business Hours Response, Pricing Information Response, Location Information Response, Contact Information Response, Welcome Menu Response, Helpful Fallback Response | None                             | *Complete the customer service loop*                                                                                           |
| Main Workflow Explanation      | Sticky Note           | Documentation overview      | None                         | None                            | # 📱 WhatsApp Customer Support Bot ... *Handles 80% of common customer questions automatically.*                                 |
| Step 1 - Message Reception     | Sticky Note           | Step 1 overview             | None                         | None                            | ## Step 1: Message Reception ... *Listens constantly for customer messages*                                                     |
| Step 2 - Message Type Filter   | Sticky Note           | Step 2 overview             | None                         | None                            | ## Step 2: Message Type Filter ... *Keeps bot focused and reliable*                                                             |
| Step 3 - Data Extraction       | Sticky Note           | Step 3 overview             | None                         | None                            | ## Step 3: Data Extraction ... *Prepares data for keyword matching*                                                             |
| Step 4 - Keyword Detection     | Sticky Note           | Step 4 overview             | None                         | None                            | ## Step 4: Keyword Detection ... *Intelligent message routing*                                                                   |
| Step 5 - Response Generation   | Sticky Note           | Step 5 overview             | None                         | None                            | ## Step 5: Response Generation ... *Consistent, professional communication*                                                     |
| Step 6 - Message Delivery      | Sticky Note           | Step 6 overview             | None                         | None                            | ## Step 6: Message Delivery ... *Complete the customer service loop*                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Incoming WhatsApp Messages" Node**  
   - Type: WhatsApp Trigger  
   - Configure webhook to listen for message updates.  
   - Ensure WhatsApp Business API account is connected.  
   - Set webhook ID (e.g., "whatsapp-support-webhook").

2. **Create "Filter Text Messages Only" Node (IF)**  
   - Create IF node.  
   - Condition: Check if `$json.messages[0].type === 'text'` (string equals, case-sensitive).  
   - Connect input from "Incoming WhatsApp Messages".

3. **Create "Handle Unsupported Message Types" Node (WhatsApp Send)**  
   - Type: WhatsApp node, operation "send".  
   - Text: Inform user that only text messages are supported, suggest typing 'hello'.  
   - Recipient phone number: `{{$json.messages[0].from}}`.  
   - Connect false output branch of IF node.

4. **Create "Extract Message Content" Node (Set)**  
   - Type: Set node.  
   - Assign fields:  
     - `message_text`: `{{$json.messages[0].text.body.toLowerCase().trim()}}`  
     - `sender_phone`: `{{$json.messages[0].from}}`  
     - `message_id`: `{{$json.messages[0].id}}`  
   - Connect true output branch of IF node.

5. **Create "FAQ Keyword Detection" Node (Switch)**  
   - Type: Switch node.  
   - Add outputs for: Business Hours, Pricing, Location, Contact, Greeting.  
   - For each output, configure multiple conditions using "contains" operator (case-insensitive) on `message_text`:  
     - Business Hours: "hours", "open", "close", "time"  
     - Pricing: "price", "cost", "fee", "money"  
     - Location: "address", "location", "where", "find"  
     - Contact: "contact", "phone", "email", "support"  
     - Greeting: "hello", "hi", "hey", "start"  
   - Connect from "Extract Message Content".

6. **Create Response Set Nodes (one per category):**  
   - Business Hours Response: set a formatted multi-line string with hours and dynamic open/closed status using JavaScript date logic.  
   - Pricing Information Response: set a multi-line pricing plan description with emojis.  
   - Location Information Response: set office address, transport info, and Google Maps link.  
   - Contact Information Response: set phone, email, live chat, social media, and response times.  
   - Welcome Menu Response: set greeting message with quick menu instructions and usage tips.  
   - Connect each corresponding output branch of Switch node to the appropriate response node.

7. **Create "Helpful Fallback Response" Node (Set)**  
   - Create a Set node with a fallback response for unrecognized queries.  
   - (Optionally, this node can be connected from the default/fallback case if Switch supports or by adding a separate IF node for unknown keywords.)

8. **Create "Send WhatsApp Reply" Node (WhatsApp Send)**  
   - Type: WhatsApp node, operation "send".  
   - Text body: `{{$json.response_text}}` (use expression to grab generated response).  
   - Recipient phone number: `{{$json.sender_phone}}`.  
   - Phone Number ID: Set your WhatsApp Business API phone number ID.  
   - Disable preview URL.  
   - Connect outputs from all response nodes (Business Hours, Pricing, Location, Contact, Welcome Menu, Helpful Fallback) to this node.

9. **Test full flow:**  
   - Send test WhatsApp messages covering all keywords and unsupported types.  
   - Verify responses and fallback behavior.

---

### 5. General Notes & Resources

| Note Content                                                                                                                   | Context or Link                                                                                  |
|-------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow requires WhatsApp Business API account and proper webhook URL configuration.                                           | Setup prerequisite for Incoming WhatsApp Messages node                                         |
| Replace all placeholder `phoneNumberId` values in WhatsApp nodes with your actual Meta phone number ID.                        | Essential for message sending to work                                                          |
| Sticky notes in the workflow provide detailed step explanations and setup guidance.                                             | Visible in the workflow editor, useful for maintainers                                         |
| This bot handles approximately 80% of common customer questions automatically, ideal for small businesses and support teams.  | Highlighted in main workflow explanation sticky note                                          |
| For enhanced natural language processing beyond keyword matching, consider integrating AI or NLP services in future versions. | Extension suggestion for improving understanding and flexibility                               |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.