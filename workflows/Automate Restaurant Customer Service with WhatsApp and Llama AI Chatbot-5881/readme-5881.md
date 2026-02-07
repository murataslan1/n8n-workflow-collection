Automate Restaurant Customer Service with WhatsApp and Llama AI Chatbot

https://n8nworkflows.xyz/workflows/automate-restaurant-customer-service-with-whatsapp-and-llama-ai-chatbot-5881


# Automate Restaurant Customer Service with WhatsApp and Llama AI Chatbot

### 1. Workflow Overview

This workflow implements an automated WhatsApp chatbot designed for a restaurant’s customer service. It handles incoming customer messages related to restaurant information such as opening hours, menu details, table booking, services, and current offers. The chatbot uses a large language model (LLM) powered by Llama AI to understand and generate natural language replies. The workflow includes logic to detect if a customer inquiry involves booking a table, in which case it creates a booking record in a PostgreSQL database and confirms the reservation with the customer over WhatsApp.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receiving and capturing incoming WhatsApp messages from customers.
- **1.2 AI Query Extraction:** Using an AI agent to interpret and extract the customer’s query intent.
- **1.3 Wait and Decision:** Waiting briefly before deciding if the query involves a table booking.
- **1.4 Booking Handling:** If booking is required, create a booking record in the database and send confirmation.
- **1.5 General Reply:** If no booking is needed, generate an AI reply and send it back to the customer via WhatsApp.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block listens for incoming WhatsApp messages and triggers the workflow when a new message arrives.

**Nodes Involved:**  
- Receive WhatsApp Message

**Node Details:**  
- **Receive WhatsApp Message**  
  - Type: WhatsApp Trigger  
  - Role: Entry point capturing incoming WhatsApp messages.  
  - Config: Listens to "messages" update events for incoming chat messages.  
  - Credentials: Uses WhatsApp API credentials for webhook setup and authentication.  
  - Inputs: None (trigger node)  
  - Outputs: Passes message JSON including sender contact and message text to the next node.  
  - Edge Cases: Webhook failures, authentication errors, missing message body.  
  - Notes: Critical for reliable real-time message capture.

---

#### 1.2 AI Query Extraction

**Overview:**  
This block extracts and interprets the customer’s message content using an AI agent to understand intent and context.

**Nodes Involved:**  
- Extract Customer Query  
- Generate Reply with AI

**Node Details:**  
- **Extract Customer Query**  
  - Type: Langchain Agent Node  
  - Role: Processes raw customer messages to clarify intent and guide response generation.  
  - Config: Uses a defined system prompt instructing the AI to act as a friendly restaurant chatbot that handles queries about timings, booking, menu, services, offers, and reservations.  
  - Input Expression: Extracts the text body from the first message in the WhatsApp messages array.  
  - Outputs: Extracted, cleaned, or reformulated query text passed to the language model.  
  - Edge Cases: Ambiguous or incomplete messages, AI misunderstanding input.  
  - Version: 1.9  
  - Notes: Custom system message steers AI behavior for consistent, polite responses.

- **Generate Reply with AI**  
  - Type: Langchain LLM Chat Node (Ollama Llama 3.2 model)  
  - Role: Generates a natural language reply based on the extracted query.  
  - Config: Uses the latest Llama 3.2 16k token model without additional options.  
  - Credentials: Requires Ollama API credentials.  
  - Inputs: Takes processed query text from the previous agent node.  
  - Outputs: AI-generated reply text to be sent back to the customer or used in further logic.  
  - Edge Cases: API rate limits, model timeouts, malformed input.  
  - Version: 1  
  - Notes: Central to providing intelligent, context-aware responses.

---

#### 1.3 Wait and Decision

**Overview:**  
This block introduces a brief wait (to ensure message processing and user interaction flow) and then decides if the customer query concerns a table booking.

**Nodes Involved:**  
- Wait For Response  
- Check If Table Booking Required

**Node Details:**  
- **Wait For Response**  
  - Type: Wait Node  
  - Role: Pauses execution to allow message handling or delays between interactions.  
  - Config: Default wait, no specific timeout defined.  
  - Inputs: Output from query extraction.  
  - Outputs: Passes data to conditional check node.  
  - Edge Cases: Possible indefinite wait if misconfigured, but defaults are safe.  
  - Version: 1.1  

- **Check If Table Booking Required**  
  - Type: If Node (Conditional)  
  - Role: Determines if the extracted customer query indicates a booking intent.  
  - Config: Contains a string equality condition comparing a field labeled "Booking" to a placeholder "add_your_value_here" (likely to be customized).  
  - Inputs: From Wait node.  
  - Outputs:  
    - True branch: Booking required → proceeds to booking creation.  
    - False branch: Booking not required → proceeds to send AI reply directly.  
  - Edge Cases: Misconfigured condition leading to incorrect routing, empty or unexpected query data.  
  - Version: 2.2  

---

#### 1.4 Booking Handling

**Overview:**  
If the customer wants to book a table, this block records the booking in the PostgreSQL database and confirms the reservation via WhatsApp.

**Nodes Involved:**  
- Create New Table Booking  
- Send Booking Confirmation to Customer

**Node Details:**  
- **Create New Table Booking**  
  - Type: Postgres Node  
  - Role: Inserts a new booking record into the `public` schema, presumably in a table identified by `id` (needs mapping).  
  - Config: Uses auto-mapping for input data fields to database columns; specific columns not detailed and require configuration.  
  - Credentials: PostgreSQL credentials configured.  
  - Inputs: Data from conditional node’s true branch.  
  - Outputs: Passes database write result to confirmation node.  
  - Edge Cases: Database connection issues, SQL errors, missing or invalid booking data.  
  - Version: 2.6  

- **Send Booking Confirmation to Customer**  
  - Type: WhatsApp Node  
  - Role: Sends a confirmation message back to the customer acknowledging their booking.  
  - Config: Sends text from `output` field of the previous node’s JSON output. Uses the same WhatsApp phone number credentials as the main message node.  
  - Inputs: Booking creation output.  
  - Outputs: None (end of booking flow).  
  - Edge Cases: Messaging API errors, invalid recipient ID, message formatting issues.  
  - Version: 1  

---

#### 1.5 General Reply

**Overview:**  
If the query is not related to booking, this block sends the AI-generated reply back to the customer.

**Nodes Involved:**  
- Send Reply to Customer

**Node Details:**  
- **Send Reply to Customer**  
  - Type: WhatsApp Node  
  - Role: Sends the AI-generated response text to the customer’s WhatsApp number.  
  - Config: Text body is set using an expression pulling from the AI reply node’s `output` field. Uses configured WhatsApp API credentials.  
  - Inputs: False branch of booking conditional node.  
  - Outputs: None (end of message reply flow).  
  - Edge Cases: API errors, invalid recipient phone number, message content issues.  
  - Version: 1  

---

### 3. Summary Table

| Node Name                      | Node Type                   | Functional Role                       | Input Node(s)           | Output Node(s)                    | Sticky Note                                                                                          |
|--------------------------------|-----------------------------|-------------------------------------|------------------------|---------------------------------|----------------------------------------------------------------------------------------------------|
| Sticky Note                    | Sticky Note                 | Documentation / Workflow overview   | —                      | —                               | ## This workflow powers a WhatsApp chatbot that answers customer questions about restaurant timing, menu, booking, services, and offers. It uses a chat model (LLM) to understand queries and respond clearly via WhatsApp. |
| Receive WhatsApp Message       | WhatsApp Trigger            | Entry point for WhatsApp messages   | —                      | Extract Customer Query           |                                                                                                    |
| Extract Customer Query         | Langchain Agent             | Extracts and clarifies customer query | Receive WhatsApp Message | Wait For Response                |                                                                                                    |
| Wait For Response              | Wait                       | Introduces a pause before decision  | Extract Customer Query  | Check If Table Booking Required  |                                                                                                    |
| Check If Table Booking Required| If                         | Conditional routing for booking intent | Wait For Response       | Create New Table Booking (true) / Send Reply to Customer (false) |                                                                                                    |
| Create New Table Booking       | Postgres                   | Inserts new booking record           | Check If Table Booking Required (true) | Send Booking Confirmation to Customer |                                                                                                    |
| Send Booking Confirmation to Customer | WhatsApp                | Sends booking confirmation message  | Create New Table Booking | —                               |                                                                                                    |
| Generate Reply with AI         | Langchain LLM Chat (Ollama) | Generates AI reply for general queries | Extract Customer Query  | —                               |                                                                                                    |
| Send Reply to Customer         | WhatsApp                   | Sends AI-generated reply to customer | Check If Table Booking Required (false) | —                               |                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create WhatsApp Trigger Node**  
   - Name: "Receive WhatsApp Message"  
   - Type: WhatsApp Trigger  
   - Configure to listen to "messages" update events.  
   - Set up webhook URL and connect to your WhatsApp API credentials (OAuth2 or API token).  
   - Ensure phone number and webhook are verified with WhatsApp Business API.

2. **Create Langchain Agent Node**  
   - Name: "Extract Customer Query"  
   - Type: Langchain Agent (`@n8n/n8n-nodes-langchain.agent`)  
   - Input: Use expression to extract incoming message text: `{{$json.messages[0].text.body}}`  
   - Set system prompt with instructions to act as a friendly restaurant chatbot (see overview section for full prompt content).  
   - No additional options needed.  
   - Connect input from "Receive WhatsApp Message".

3. **Create Wait Node**  
   - Name: "Wait For Response"  
   - Type: Wait  
   - Use default wait settings (no delay or minimal delay as preferred).  
   - Connect from "Extract Customer Query".

4. **Create If Node**  
   - Name: "Check If Table Booking Required"  
   - Type: If  
   - Condition: Configure to check if the extracted query indicates booking.  
   - Example: Left value `"Booking"` equals `"add_your_value_here"` (replace this placeholder with your actual logic or expression that detects booking intent).  
   - Connect input from "Wait For Response".  
   - True branch: Booking flow, False branch: General reply.

5. **Create Postgres Node**  
   - Name: "Create New Table Booking"  
   - Type: Postgres  
   - Configure connection to your PostgreSQL database with credentials.  
   - Target Schema: `public`  
   - Target Table: specify the booking table name (e.g., `bookings`).  
   - Set columns mapping to map booking details from input data (configure mapping manually or auto-map fields).  
   - Connect input from the true branch of "Check If Table Booking Required".

6. **Create WhatsApp Node (Booking Confirmation)**  
   - Name: "Send Booking Confirmation to Customer"  
   - Type: WhatsApp node (send operation)  
   - Text Body: Use expression to send confirmation message, e.g. `{{$json.output}}` or a static confirmation text.  
   - Recipient Phone Number: Extract from `Receive WhatsApp Message` node’s contacts array, e.g. `{{$node["Receive WhatsApp Message"].json.contacts[0].wa_id}}`.  
   - Use same WhatsApp credentials as trigger node.  
   - Connect input from "Create New Table Booking".

7. **Create Langchain LLM Chat Node**  
   - Name: "Generate Reply with AI"  
   - Type: Langchain LLM Chat (`@n8n/n8n-nodes-langchain.lmChatOllama`)  
   - Model: `llama3.2-16000:latest`  
   - Credentials: Connect Ollama API credentials.  
   - Input: Connect from "Extract Customer Query" node.  
   - No additional options necessary.

8. **Create WhatsApp Node (General Reply)**  
   - Name: "Send Reply to Customer"  
   - Type: WhatsApp node (send operation)  
   - Text Body: Use expression to send AI-generated reply: `{{$json.output}}`.  
   - Recipient Phone Number: Same as before, from incoming message sender.  
   - Use WhatsApp credentials.  
   - Connect input from false branch of "Check If Table Booking Required".

9. **Connect Nodes According to Flow:**  
   - "Receive WhatsApp Message" → "Extract Customer Query"  
   - "Extract Customer Query" → "Wait For Response"  
   - "Wait For Response" → "Check If Table Booking Required"  
   - "Check If Table Booking Required" true → "Create New Table Booking" → "Send Booking Confirmation to Customer"  
   - "Check If Table Booking Required" false → "Send Reply to Customer"  
   - Also connect "Extract Customer Query" → "Generate Reply with AI" (for AI response generation used in the false branch).

10. **Test Workflow:**  
    - Ensure all credentials are valid and active (WhatsApp API and Ollama API).  
    - Test incoming message triggers and verify AI responses.  
    - Validate booking insertion and confirmation message sending.

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                                                                 |
|----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow uses the Ollama Llama 3.2 model with 16k token context for enhanced replies.    | Ollama Model Reference: https://ollama.com/models/llama3                                        |
| WhatsApp API credentials must be properly configured for both receiving and sending messages. | WhatsApp Business API Documentation: https://developers.facebook.com/docs/whatsapp/            |
| The system prompt for the Langchain agent is crafted to maintain polite, short, and clear replies focusing on restaurant-related queries only. | Prompt content embedded in "Extract Customer Query" node.                                      |
| PostgreSQL node requires mapping of booking fields which must be defined according to your database schema. | PostgreSQL Documentation: https://www.postgresql.org/docs/current/index.html                    |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. All processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.