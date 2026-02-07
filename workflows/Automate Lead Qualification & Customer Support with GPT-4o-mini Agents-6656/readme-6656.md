Automate Lead Qualification & Customer Support with GPT-4o-mini Agents

https://n8nworkflows.xyz/workflows/automate-lead-qualification---customer-support-with-gpt-4o-mini-agents-6656


# Automate Lead Qualification & Customer Support with GPT-4o-mini Agents

### 1. Workflow Overview

This n8n workflow automates two core business functions for an ecommerce store using GPT-4o-mini language models:

- **Lead Qualification**: Automatically analyzes customer phone call transcripts to identify good leads for bulk orders.
- **Customer Support Chatbot**: Engages customers in ecommerce-related conversations, providing product info, pricing, bulk order details, and shipping policies.

The workflow is divided into two main logical blocks:

- **1.1 Lead Qualifier Agent**: Processes sample customer transcripts, uses an AI agent to classify leads as good or not based on bulk order indicators, and outputs structured JSON results.
- **1.2 Ecommerce Chatbot**: Listens to live chat messages via webhook, engages in multi-turn conversations with customers, applies memory to maintain context, and detects order completion to finalize the conversation.

Supporting these blocks are utility nodes for managing AI model calls, parsing outputs, and controlling flow based on chat events.

---

### 2. Block-by-Block Analysis

#### 2.1 Lead Qualifier Agent

**Overview:**  
This block receives sample data representing customer call transcripts, uses a GPT-4o-mini-powered AI agent to analyze each transcript for bulk order intent, and outputs structured JSON indicating lead quality and reasoning.

**Nodes Involved:**  
- When clicking ‘Test workflow’  
- Create Sample Data  
- OpenAI Chat Model1  
- Structured Output Parser  
- Lead Qualifier Agent  
- Edit Fields1  
- Sticky Note (Lead Qualifier Agent)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Starts the workflow manually for testing lead qualification  
  - Inputs: None (manual trigger)  
  - Outputs: Starts flow to Create Sample Data  
  - Edge cases: None; manual start  
 
- **Create Sample Data**  
  - Type: Code (JavaScript)  
  - Role: Provides hardcoded sample customer transcripts with names for testing  
  - Configuration: Returns an array of objects, each with `name` and `transcript` fields  
  - Inputs: Trigger from manual node  
  - Outputs: Sample data items to Lead Qualifier Agent  
  - Edge cases: None; static data  

- **OpenAI Chat Model1**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Provides GPT-4o-mini model as language model backend for agent  
  - Configuration: Model set to "gpt-4o-mini" with default options  
  - Credentials: Uses configured OpenAI API key  
  - Inputs: Connected internally by agent node  
  - Outputs: Passed to Lead Qualifier Agent as language model  
  - Edge cases: API auth errors, rate limits, timeout  

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Role: Parses AI agent outputs to enforce JSON schema for consistency  
  - Configuration: JSON example schema defining keys "Name", "Is Good Lead", "Reasoning"  
  - Inputs: Output from Lead Qualifier Agent  
  - Outputs: Parsed structured JSON back to Lead Qualifier Agent  
  - Edge cases: Parsing errors if AI response not valid JSON  

- **Lead Qualifier Agent**  
  - Type: LangChain Agent  
  - Role: Core AI logic to classify lead quality from transcript using prompt instructions  
  - Configuration:  
    - Prompt template includes customer name and transcript  
    - System message instructs criteria for "good lead" (bulk order indicators)  
    - Specifies output as valid JSON with keys "Name", "Is Good Lead", and "Reasoning"  
  - Inputs: Sample data item + language model (OpenAI Chat Model1) + output parser  
  - Outputs: Parsed JSON to Edit Fields1  
  - Edge cases: Model hallucination, prompt misunderstanding, invalid JSON output  

- **Edit Fields1**  
  - Type: Set Node  
  - Role: Maps parsed JSON fields into workflow fields for further use or output  
  - Configuration: Assigns "Name", "Good Lead", and "Reasoning" from parsed JSON output properties  
  - Inputs: JSON from Lead Qualifier Agent  
  - Outputs: Final structured lead qualification data  
  - Edge cases: Missing or malformed JSON fields  

- **Sticky Note (162bcc59-f8ac-4468-900a-a65f52320ec8)**  
  - Content: "## Lead Qualifier Agent"  
  - Role: Visual grouping and documentation for the block  

---

#### 2.2 Ecommerce Chatbot

**Overview:**  
This block handles live chat messages received via webhook, uses GPT-4o-mini to conduct multi-turn conversations about ecommerce products, pricing, bulk discounts, shipping, and order placement. It applies conversation memory and detects when an order is confirmed to end the interaction.

**Nodes Involved:**  
- When chat message received  
- OpenAI Chat Model2  
- Simple Memory  
- Ecommerce Chatbot  
- Test if conversation is complete (If)  
- End the Conversation (Code)  
- Respond to User (NoOp)  
- Sticky Note1 (Ecommerce Chatbot)  
- Sticky Note2 (Instructions & Help)

**Node Details:**

- **When chat message received**  
  - Type: LangChain Chat Trigger (Webhook)  
  - Role: Entry point that triggers workflow on incoming chat messages (public webhook)  
  - Configuration: Public webhook enabled, no extra options  
  - Inputs: Incoming external chat payload with user message  
  - Outputs: Passes data to Ecommerce Chatbot agent  
  - Edge cases: Webhook connectivity issues, malformed payloads  

- **OpenAI Chat Model2**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Language model backend for Ecommerce Chatbot agent, using GPT-4o-mini  
  - Configuration: Model "gpt-4o-mini" default options  
  - Credentials: OpenAI API key configured  
  - Inputs: From agent node internally  
  - Outputs: Responses to Ecommerce Chatbot agent  
  - Edge cases: API auth, rate limiting, timeouts  

- **Simple Memory**  
  - Type: LangChain Memory Buffer Window  
  - Role: Maintains a sliding window of past 10 messages for conversation context  
  - Configuration: Context window length set to 10  
  - Inputs: From Ecommerce Chatbot agent  
  - Outputs: Provides memory context back to agent  
  - Edge cases: Memory overflow if conversation very long; possible context loss  

- **Ecommerce Chatbot**  
  - Type: LangChain Agent  
  - Role: AI assistant agent managing multi-turn ecommerce conversations  
  - Configuration:  
    - System message defines detailed persona, ecommerce product/pricing info, bulk discount tiers, shipping and returns policies  
    - Rules for honest, professional responses and handling bulk orders  
    - Special marker "*****" signals order confirmation  
  - Inputs: Incoming chat message from webhook, memory, and language model  
  - Outputs: Generates chat reply text  
  - Edge cases: Misinterpretation of user intent, failure to detect order completion marker  

- **Test if conversation is complete (If)**  
  - Type: If Node  
  - Role: Checks if chatbot response contains "*****" indicating order placement complete  
  - Configuration: Condition checks if output string contains "*****" (case sensitive)  
  - Inputs: Output from Ecommerce Chatbot  
  - Outputs:  
    - True branch: End the Conversation  
    - False branch: Respond to User (continue interaction)  
  - Edge cases: Marker missing or malformed, false positives if "*****" occurs in normal text  

- **End the Conversation**  
  - Type: Code (JavaScript)  
  - Role: Sends final confirmation message "Your order has been placed"  
  - Configuration: Returns simple text object with confirmation string  
  - Inputs: From If node True branch  
  - Outputs: Final message to user  
  - Edge cases: None  

- **Respond to User**  
  - Type: NoOp  
  - Role: Placeholder node to represent sending the chatbot reply to the user (integration point)  
  - Configuration: None (pass-through)  
  - Inputs: If node False branch  
  - Outputs: Continues conversation flow externally  
  - Edge cases: Needs external integration to deliver message  

- **Sticky Note1 (45e03054-92b4-4fbb-a9f0-a65bd024f972)**  
  - Content: "## Ecommerce Chatbot"  
  - Role: Visual grouping and documentation for the chatbot block  

- **Sticky Note2 (d2055f0c-81ce-4b83-9541-12634e4fc75c)**  
  - Content:  
    - Installation and run instructions, credential setup, testing tips, customization ideas  
    - Contact info: rbreen@ynteractive.com  
  - Role: Comprehensive user guide and help notes  

---

### 3. Summary Table

| Node Name                   | Node Type                          | Functional Role                      | Input Node(s)                   | Output Node(s)                       | Sticky Note                                                                                          |
|-----------------------------|----------------------------------|------------------------------------|--------------------------------|------------------------------------|----------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’| Manual Trigger                   | Starts lead qualifier test          | None                           | Create Sample Data                 |                                                                                                |
| Create Sample Data           | Code                             | Provides sample customer transcripts| When clicking ‘Test workflow’  | Lead Qualifier Agent               |                                                                                                |
| OpenAI Chat Model1           | LangChain OpenAI Chat Model      | Language model for Lead Qualifier  | Lead Qualifier Agent (internal) | Lead Qualifier Agent               |                                                                                                |
| Structured Output Parser     | LangChain Structured Output Parser| Parses AI output to JSON            | Lead Qualifier Agent           | Lead Qualifier Agent               |                                                                                                |
| Lead Qualifier Agent         | LangChain Agent                  | Classifies lead quality via AI     | Create Sample Data, OpenAI Chat Model1, Structured Output Parser | Edit Fields1 |                                                                                                |
| Edit Fields1                | Set Node                        | Maps parsed JSON to structured fields | Lead Qualifier Agent           | None                             |                                                                                                |
| Sticky Note                 | Sticky Note                     | Documentation for Lead Qualifier Block | None                         | None                             | ## Lead Qualifier Agent                                                                           |
| When chat message received  | LangChain Chat Trigger (Webhook) | Entry point for live chat messages | External webhook              | Ecommerce Chatbot                 |                                                                                                |
| OpenAI Chat Model2          | LangChain OpenAI Chat Model      | Language model for Ecommerce Chatbot| Ecommerce Chatbot (internal)  | Ecommerce Chatbot                 |                                                                                                |
| Simple Memory               | LangChain Memory Buffer Window   | Maintains conversation context     | Ecommerce Chatbot              | Ecommerce Chatbot                 |                                                                                                |
| Ecommerce Chatbot           | LangChain Agent                  | Ecommerce multi-turn chatbot AI    | When chat message received, OpenAI Chat Model2, Simple Memory | Test if conversation is complete |                                                                                                |
| Test if conversation is complete | If Node                      | Checks for order completion marker | Ecommerce Chatbot              | End the Conversation, Respond to User |                                                                                                |
| End the Conversation        | Code                            | Sends final order confirmation     | Test if conversation is complete (true branch) | None                             |                                                                                                |
| Respond to User             | NoOp                            | Passes chatbot reply for delivery  | Test if conversation is complete (false branch) | None                             |                                                                                                |
| Sticky Note1                | Sticky Note                     | Documentation for Ecommerce Chatbot| None                         | None                             | ## Ecommerce Chatbot                                                                             |
| Sticky Note2                | Sticky Note                     | Installation, usage, and customization instructions | None                         | None                             | ### Need help?  \nEmail **rbreen@ynteractive.com**\n\n---\n\n### How to Install & Run\n\n1. **Import the workflow**  \n   - n8n → **Workflows → Import from File** (or **Paste JSON**) → **Save**\n\n2. **Add your OpenAI API key**  \n   - n8n → **Credentials → New → OpenAI API**  \n   - Paste the key from <https://platform.openai.com>  \n   - Select this credential in both **OpenAI Chat Model** nodes\n\n3. **(Optional) Choose another model**  \n   - Default model: **gpt‑4o‑mini**  \n   - Open each **OpenAI Chat Model** node → choose **GPT‑4o**, **GPT‑3.5‑turbo**, etc.\n\n4. **Test the Lead‑Qualifier Task Automator**  \n   - Click **Activate**  \n   - Press **Test workflow**  \n   - Sample transcripts run; each item returns JSON with **Name**, **Is Good Lead**, **Reasoning**\n\n5. **Test the Ecommerce Chatbot**  \n   - Copy the **Webhook URL** from **When chat message received**  \n   - POST example payload:  \n     ```json\n     { \"message\": \"Hi, do you offer discounts if I buy 120 notebooks?\" }\n     ```  \n   - Chatbot replies with pricing details  \n   - If the response contains `*****`, the **If** node sends: **“Your order has been placed”**\n\n---\n\n### Customization Ideas\n\n- Edit prompts to change lead‑qualification rules or chatbot dialogue  \n- Add Google Sheets, Airtable, or database nodes to store qualified leads  \n- Integrate inventory, shipping, or payment APIs  \n- Adjust the **Simple Memory** node’s window size to remember more conversation context |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger (When clicking ‘Test workflow’)**  
   - Node Type: Manual Trigger  
   - Purpose: Manually start the lead qualification test  
   - No parameters needed  

2. **Create Sample Data Node**  
   - Node Type: Code  
   - Configuration:  
     - JavaScript code returning an array of sample customers with `name` and `transcript` fields as shown below:  
       ```js
       return [
         { json: { name: "Jordan Lee", transcript: "Hi, I'm looking to place a large order of custom mugs for an upcoming corporate event. Probably around 300 units." } },
         { json: { name: "Alex Chen", transcript: "Do you sell just one of these backpacks? I’m shopping for my daughter." } },
         { json: { name: "Samira Patel", transcript: "We’re exploring gifts for our team and might want to add a logo. What's your bulk pricing on notebooks?" } },
         { json: { name: "Marcus Grant", transcript: "Just checking shipping times for a single product before I order. Thanks." } }
       ];
       ```  
   - Connect output of Manual Trigger to this node  

3. **Add LangChain OpenAI Chat Model Node (OpenAI Chat Model1)**  
   - Node Type: LangChain OpenAI Chat Model  
   - Configuration:  
     - Select model: **gpt-4o-mini**  
     - Leave default options  
   - Credentials: Create new OpenAI API credential with your key from https://platform.openai.com  
   - No direct input/output connections (used internally by agent)  

4. **Add LangChain Structured Output Parser Node**  
   - Node Type: LangChain Structured Output Parser  
   - Configuration:  
     - Provide JSON schema example:  
       ```json
       {
         "Name": "Alex Chen",
         "Is Good Lead": "No",
         "Reasoning": "The customer is interested in buying a single item for personal use."
       }
       ```  
   - No direct input/output connections (linked internally in agent)  

5. **Add LangChain Agent Node (Lead Qualifier Agent)**  
   - Node Type: LangChain Agent  
   - Configuration:  
     - Prompt text:  
       ```
       Name: {{$json["name"]}}
       Transcript: {{$json["transcript"]}}
       ```  
     - System message:  
       ```
       You are a lead qualification assistant for an ecommerce store. Your job is to determine if a customer from a phone call is a good lead for a **bulk order**.

       If they mention:
       - large quantities
       - logos
       - team gifts
       - events
       - wholesale
       - or any indication of buying in bulk

       Then classify them as a **good lead**. Otherwise, mark them as not a good lead.

       Respond only in valid JSON with:
       - "Name": customer's name
       - "Is Good Lead": Yes or No
       - "Reasoning": short one-sentence reason
       ```  
     - Enable output parser with the Structured Output Parser node  
     - Link the OpenAI Chat Model1 node as the language model  
   - Connect output of Create Sample Data to this node (main input)  

6. **Add Set Node (Edit Fields1)**  
   - Node Type: Set  
   - Configuration:  
     - Assign fields:  
       - Name = `={{$json["output"]["Name"]}}`  
       - Good Lead = `={{$json["output"]["Is Good Lead"]}}`  
       - Reasoning = `={{ $json.output.Reasoning }}`  
   - Connect output of Lead Qualifier Agent to this node  

7. **Add Sticky Note**  
   - Content: "## Lead Qualifier Agent"  
   - Place near these nodes for visual grouping  

---

8. **Create LangChain Chat Trigger Node (When chat message received)**  
   - Node Type: LangChain Chat Trigger  
   - Configuration:  
     - Public webhook enabled  
     - No additional options  
   - This will be the webhook entry point for live chat messages  

9. **Add LangChain OpenAI Chat Model Node (OpenAI Chat Model2)**  
   - Node Type: LangChain OpenAI Chat Model  
   - Configuration:  
     - Model: **gpt-4o-mini**  
   - Credentials: Use same OpenAI API credential  
   - Used internally by chatbot agent  

10. **Add LangChain Memory Buffer Window Node (Simple Memory)**  
    - Node Type: LangChain Memory Buffer Window  
    - Configuration:  
      - Context window length: 10  
    - Connect this node to chatbot agent for memory context  

11. **Add LangChain Agent Node (Ecommerce Chatbot)**  
    - Node Type: LangChain Agent  
    - Configuration:  
      - System message:  
        ```
        👋 Hi there! I'm your personal assistant here to help you with anything related to our ecommerce store.

        I can assist you with:
        - Product information
        - Bulk orders
        - Pricing questions
        - Customization options (like adding a logo)
        - Shipping times and return policies

        Here’s how I work:
        - I know the details of our products, pricing, and bulk order discounts.
        - I respond politely, professionally, and clearly.
        - If you're placing a bulk order, I’ll ask for the quantity you need, when you need it, and whether you have your artwork or logo ready.

        ## Product Pricing (Standard Retail):
        - **Custom Notebook**: $12.00 each  
        - **Eco Water Bottle**: $15.00 each  
        - **Enamel Mug**: $10.00 each  
        - **Canvas Tote Bag**: $14.00 each

        ## Bulk Discount Tiers:
        - 50+ units: 10% off  
        - 100+ units: 15% off  
        - 250+ units: 20% off  
        - 500+ units: 25% off  
        *Discounts apply per product type and are automatically calculated.*

        ## Shipping & Returns:
        - Standard shipping: 3–5 business days  
        - Bulk orders may take 7–14 business days depending on customization
        - Returns accepted within 30 days for non-customized items

        ## Rules:
        - Be honest and helpful
        - Never make up data or offer discounts outside the tiers above
        - If unsure about something, say a team member will follow up
        - If the customer mentions a bulk order, ask how many units they need and if they have artwork ready

        - if the customer has confirmed they want to place an order output ***** along with the response. 

        Just ask your question, and I’ll take it from there!
        ```  
      - Link to OpenAI Chat Model2 as language model  
      - Link to Simple Memory for conversation context  
    - Connect output of "When chat message received" to this node  

12. **Add If Node (Test if conversation is complete)**  
    - Node Type: If  
    - Configuration:  
      - Condition: Check if chatbot response output contains string "*****" (case sensitive)  
      - Combinator: AND with single condition  
    - Connect output of Ecommerce Chatbot to If node  

13. **Add Code Node (End the Conversation)**  
    - Node Type: Code (JavaScript)  
    - Configuration:  
      - Code:  
        ```js
        let text = "Your order has been placed"
        return { text }
        ```  
    - Connect If node True branch to this node  

14. **Add NoOp Node (Respond to User)**  
    - Node Type: NoOp  
    - Purpose: Placeholder for responding to user with chatbot reply  
    - Connect If node False branch to this node  

15. **Add Sticky Notes**  
    - Sticky Note1 Content: "## Ecommerce Chatbot"  
    - Sticky Note2 Content: Installation & usage instructions from original workflow (including contact email, API key setup, testing instructions, customization ideas)  
    - Place near relevant nodes for documentation  

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                            |
|------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| Installation & usage instructions include importing workflow, OpenAI API key setup, testing manual trigger and webhook, and tips for customizing prompts and memory window size. | Sticky Note2 content; contact: rbreen@ynteractive.com      |
| The workflow uses GPT-4o-mini as default model; users can switch to other OpenAI models like GPT-4o or GPT-3.5-turbo by editing OpenAI Chat Model nodes. | Sticky Note2; OpenAI platform                              |
| The Ecommerce Chatbot detects order completion using a special marker "*****" in its response to trigger order confirmation flow. | Ecommerce Chatbot system message & If node logic           |
| Lead Qualifier Agent enforces structured JSON output for easy integration with other systems like CRMs or databases.             | Structured Output Parser node & Lead Qualifier Agent prompt |
| The workflow is designed for both testing with sample data and live operation via webhook for chat messages.                     | Manual Trigger and Chat Trigger nodes                       |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. The processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.