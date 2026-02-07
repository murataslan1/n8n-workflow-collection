AI Chat Agent: Dumpling AI + GPT-4o to Auto-Save Local Business Data to Airtable

https://n8nworkflows.xyz/workflows/ai-chat-agent--dumpling-ai---gpt-4o-to-auto-save-local-business-data-to-airtable-3826


# AI Chat Agent: Dumpling AI + GPT-4o to Auto-Save Local Business Data to Airtable

### 1. Workflow Overview

This workflow automates the process of discovering and enriching local business leads using AI, then saving structured data into Airtable for easy management. It is designed for digital marketers, lead generation agencies, small business owners, and virtual assistants who want to efficiently gather business information and relevant news insights without manual research.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Listens for incoming chat messages to trigger the workflow.
- **1.2 AI Processing and Memory:** Processes user input with GPT-4o Mini and maintains conversational context with a memory buffer.
- **1.3 External Data Retrieval via Dumpling AI Agents:** Uses two Dumpling AI agents—one for local business data and one for news—to fetch relevant information based on the input.
- **1.4 AI Task Routing:** Coordinates the interaction between the language model, memory, and external tools.
- **1.5 Data Storage:** Saves the enriched and structured business lead data into Airtable.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block triggers the workflow when a chat message is received, serving as the entry point for user interaction.

**Nodes Involved:**  
- When chat message received

**Node Details:**  
- **Type:** Chat Trigger (Langchain)  
- **Role:** Listens for incoming chat messages to start the workflow.  
- **Configuration:** Default settings; no additional parameters specified.  
- **Input/Output:** No input; output triggers the next node.  
- **Version:** 1.1  
- **Edge Cases:** Failure to receive messages due to webhook misconfiguration or network issues.  
- **Sub-workflow:** None.

---

#### 2.2 AI Processing and Memory

**Overview:**  
Processes the user's chat input using GPT-4o Mini and maintains a rolling memory buffer of the last 10 messages to preserve conversational context.

**Nodes Involved:**  
- Process Input with GPT-4o Mini  
- Track Last 10 Messages

**Node Details:**  

- **Process Input with GPT-4o Mini**  
  - **Type:** Language Model Chat (OpenAI)  
  - **Role:** Generates AI responses based on user input.  
  - **Configuration:** Uses the "gpt-4o-mini" model; no extra options specified.  
  - **Credentials:** OpenAI API key configured.  
  - **Input:** Receives chat input from trigger or previous nodes.  
  - **Output:** AI-generated response forwarded downstream.  
  - **Version:** 1.2  
  - **Edge Cases:** API rate limits, network timeouts, invalid API key.  

- **Track Last 10 Messages**  
  - **Type:** Memory Buffer (Langchain)  
  - **Role:** Stores last 10 exchanges to maintain context.  
  - **Configuration:** Context window length set to 10 messages.  
  - **Input:** Receives chat messages and AI responses.  
  - **Output:** Provides memory context for AI agent node.  
  - **Version:** 1.3  
  - **Edge Cases:** Memory overflow if context window exceeded; data loss if node crashes.

---

#### 2.3 External Data Retrieval via Dumpling AI Agents

**Overview:**  
Fetches external data from Dumpling AI agents: one for local business leads and another for relevant news, using HTTP requests with agent keys for authentication.

**Nodes Involved:**  
- Local Business Finder Agent  
- News Agent

**Node Details:**  

- **Local Business Finder Agent**  
  - **Type:** HTTP Request (Langchain Tool)  
  - **Role:** Sends prompt to Dumpling AI Local Business Agent to retrieve structured business leads.  
  - **Configuration:**  
    - POST request to `https://app.dumplingai.com/api/v1/agents/generate-completion`  
    - JSON body includes user chat input as message content.  
    - `agentId` parameter set to the Local Business Agent’s ID (not shown in JSON).  
    - `parseJson` set to false (response is raw text).  
    - Authentication via HTTP header with Dumpling AI Agent Key.  
  - **Credentials:** Generic HTTP Header Auth with Dumpling AI Agent Key.  
  - **Input:** Receives chat input from AI agent routing node.  
  - **Output:** Returns business lead data as text.  
  - **Version:** 1.1  
  - **Edge Cases:** Invalid agent key, malformed response, API downtime.

- **News Agent**  
  - **Type:** HTTP Request (Langchain Tool)  
  - **Role:** Sends prompt to Dumpling AI News Agent to fetch recent news related to business type/location.  
  - **Configuration:**  
    - POST request to same endpoint as above.  
    - JSON body includes user chat input.  
    - `agentId` set to News Agent’s ID (not shown).  
    - `parseJson` set to true (expects JSON response).  
    - Authentication via HTTP header with Dumpling AI Agent Key.  
  - **Credentials:** Same as Local Business Finder Agent.  
  - **Input:** Receives chat input from AI agent routing node.  
  - **Output:** Returns news data as JSON.  
  - **Version:** 1.1  
  - **Edge Cases:** Same as above, plus JSON parsing errors.

---

#### 2.4 AI Task Routing

**Overview:**  
Central node that orchestrates the workflow by routing tasks between the language model, memory buffer, and Dumpling AI tools, ensuring the correct sequence and data flow.

**Nodes Involved:**  
- Route AI Tasks with Dumpling + GPT + Memory

**Node Details:**  
- **Type:** Langchain Agent  
- **Role:** Acts as the brain coordinating AI language model, memory, and external tools.  
- **Configuration:**  
  - System message instructs the agent to use:  
    - Local Business Finder Agent HTTP request tool for business data  
    - News Agent HTTP request tool for news data  
    - Airtable tool for saving results  
  - No additional options specified.  
- **Input:** Receives chat trigger, memory buffer, language model output, and tool outputs.  
- **Output:** Routes processed data to Airtable node.  
- **Version:** 1.8  
- **Edge Cases:** Misrouting due to misconfiguration, missing tool connections, or unexpected input format.

---

#### 2.5 Data Storage

**Overview:**  
Saves the structured business lead data and summaries into Airtable, mapping fields such as name, rating, address, phone number, website, category, and reviews.

**Nodes Involved:**  
- Save Business Results

**Node Details:**  
- **Type:** Airtable Tool  
- **Role:** Upserts (creates or updates) records in Airtable base and table.  
- **Configuration:**  
  - Base and table selected from Airtable account.  
  - Columns mapped explicitly with AI overrides to extract fields like:  
    - Name of Restaurant  
    - Rating (number)  
    - Total Reviews (number)  
    - Address  
    - Phone Number  
    - Website  
    - Category  
  - Matching column set to "id" for upsert operation.  
  - Attempt to convert types disabled; fields saved as defined.  
- **Credentials:** Airtable Personal Access Token configured.  
- **Input:** Receives structured data from AI agent routing node.  
- **Output:** Airtable record creation/update confirmation.  
- **Version:** 2.1  
- **Edge Cases:** Credential expiration, schema mismatch, API rate limits, invalid data format.

---

### 3. Summary Table

| Node Name                      | Node Type                         | Functional Role                              | Input Node(s)                   | Output Node(s)                          | Sticky Note                                                                                         |
|--------------------------------|----------------------------------|----------------------------------------------|---------------------------------|----------------------------------------|---------------------------------------------------------------------------------------------------|
| When chat message received      | Chat Trigger (Langchain)          | Entry point; listens for chat messages       | None                            | Route AI Tasks with Dumpling + GPT + Memory |                                                                                                   |
| Process Input with GPT-4o Mini  | Language Model Chat (OpenAI)      | Processes user input with GPT-4o Mini        | Route AI Tasks with Dumpling + GPT + Memory (ai_languageModel) | Route AI Tasks with Dumpling + GPT + Memory |                                                                                                   |
| Track Last 10 Messages          | Memory Buffer (Langchain)         | Stores last 10 messages for context          | Route AI Tasks with Dumpling + GPT + Memory (ai_memory) | Route AI Tasks with Dumpling + GPT + Memory |                                                                                                   |
| Local Business Finder Agent     | HTTP Request (Langchain Tool)     | Fetches local business leads from Dumpling AI | Route AI Tasks with Dumpling + GPT + Memory (ai_tool) | Route AI Tasks with Dumpling + GPT + Memory |                                                                                                   |
| News Agent                     | HTTP Request (Langchain Tool)     | Fetches recent news from Dumpling AI          | Route AI Tasks with Dumpling + GPT + Memory (ai_tool) | Route AI Tasks with Dumpling + GPT + Memory |                                                                                                   |
| Route AI Tasks with Dumpling + GPT + Memory | Langchain Agent               | Orchestrates AI, memory, and external tools  | When chat message received, Process Input with GPT-4o Mini, Track Last 10 Messages, Local Business Finder Agent, News Agent | Save Business Results                   | #### 🧠 Workflow Purpose An interactive chat assistant that listens for incoming messages, processes them with AI, and uses Dumpling AI to fetch external information or complete tasks — with memory tracking. See sticky note content for detailed workflow steps and customization tips. |
| Save Business Results           | Airtable Tool                    | Saves structured business data to Airtable   | Route AI Tasks with Dumpling + GPT + Memory (ai_tool) | None                                   |                                                                                                   |
| Sticky Note                    | Sticky Note                      | Provides detailed workflow purpose and notes | None                            | None                                   | #### 🧠 Workflow Purpose An interactive chat assistant that listens for incoming messages, processes them with AI, and uses Dumpling AI to fetch external information or complete tasks — with memory tracking. See sticky note content for detailed workflow steps and customization tips. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a "When chat message received" node (Langchain Chat Trigger):**  
   - Position it as the entry point.  
   - Use default settings.  
   - This node listens for incoming chat messages to trigger the workflow.

3. **Add a "Process Input with GPT-4o Mini" node (Langchain OpenAI Chat Model):**  
   - Set model to `gpt-4o-mini`.  
   - Connect the output of the chat trigger node to this node.  
   - Configure OpenAI credentials with your API key.

4. **Add a "Track Last 10 Messages" node (Langchain Memory Buffer Window):**  
   - Set context window length to 10 messages.  
   - Connect the chat trigger and GPT node outputs to this memory node as needed.  
   - This node maintains conversational context.

5. **Add two HTTP Request nodes configured as Langchain Tools for Dumpling AI:**

   - **Local Business Finder Agent:**  
     - Method: POST  
     - URL: `https://app.dumplingai.com/api/v1/agents/generate-completion`  
     - Body (JSON):  
       ```json
       {
         "messages": [
           {
             "role": "user",
             "content": "{{ $json.chatInput }}"
           }
         ],
         "agentId": "<Local Business Agent ID>",
         "parseJson": "false"
       }
       ```  
     - Authentication: HTTP Header Auth with header `x-agent-key` set to your Local Business Agent Key.  
     - Connect this node’s output to the AI agent routing node.

   - **News Agent:**  
     - Same URL and method as above.  
     - Body (JSON):  
       ```json
       {
         "messages": [
           {
             "role": "user",
             "content": "{{ $json.chatInput }}"
           }
         ],
         "agentId": "<News Agent ID>",
         "parseJson": "true"
       }
       ```  
     - Authentication: HTTP Header Auth with header `x-agent-key` set to your News Agent Key.  
     - Connect this node’s output to the AI agent routing node.

6. **Add a "Route AI Tasks with Dumpling + GPT + Memory" node (Langchain Agent):**  
   - Configure system message to instruct the agent to use:  
     - Local Business Finder Agent HTTP request tool for business data  
     - News Agent HTTP request tool for news data  
     - Airtable tool for saving results  
   - Connect inputs from:  
     - Chat trigger node  
     - GPT-4o Mini node  
     - Memory buffer node  
     - Both Dumpling AI HTTP request nodes  
   - This node orchestrates the entire AI workflow.

7. **Add an "Airtable Tool" node:**  
   - Operation: Upsert  
   - Connect to your Airtable account using a Personal Access Token credential.  
   - Select the base and table where you want to store leads (e.g., "Local Business").  
   - Map columns explicitly:  
     - Name of Restaurant (string)  
     - Rating (number)  
     - Total Reviews (number)  
     - Address (string)  
     - Phone Number (string)  
     - Website (string)  
     - Category (string)  
   - Set matching column to "id" for upsert logic.  
   - Connect the output of the AI agent routing node to this Airtable node.

8. **Add a Sticky Note node (optional):**  
   - Use to document workflow purpose, steps, and tips for future reference.

9. **Test the workflow:**  
   - Trigger manually by sending a chat message.  
   - Confirm that business leads and news are fetched, summarized, and saved to Airtable.

10. **Customize:**  
    - Replace agent prompts or agent IDs as needed.  
    - Add webhook trigger for automation beyond manual testing.  
    - Integrate with other CRMs or expand data extraction.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                 | Context or Link                                                                                   |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| You must create and configure your Dumpling AI agents before running this workflow. Agent Keys are required in HTTP request headers.                                                                         | https://app.dumplingai.com                                                                       |
| The workflow is modular and flexible, allowing easy customization for different industries or integration with other CRMs like HubSpot.                                                                       | Workflow description section                                                                     |
| Manual trigger node is ideal for testing; for production, consider replacing with a Webhook node to automate input reception.                                                                                | Workflow description section                                                                     |
| Sticky Note node contains detailed workflow purpose, step explanations, and customization tips.                                                                                                               | See Sticky Note node content in the workflow                                                    |
| Airtable columns must exactly match the mapped fields in the Airtable base schema to avoid data mismatches or errors.                                                                                        | Airtable Tool node configuration                                                                 |
| Dumpling AI API may return raw text or JSON depending on `parseJson` parameter; ensure correct parsing logic in downstream nodes or agent configuration.                                                    | HTTP Request nodes configuration                                                                 |
| For best results, monitor API usage limits and handle possible errors such as authentication failures, timeouts, and malformed responses with error handling nodes or workflows.                             | General best practices for API integrations                                                     |
| To expand functionality, consider adding parallel execution for multiple industries or locations by duplicating the Dumpling AI agent calls with varied prompts.                                            | Customization suggestions                                                                        |

---

This completes the comprehensive reference document for the "AI Chat Agent: Dumpling AI + GPT-4o to Auto-Save Local Business Data to Airtable" workflow. It provides a detailed understanding of the workflow structure, node configurations, and instructions for reproduction and customization.