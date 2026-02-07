AI Social Media Caption Creator creates social media post captions in Airtable

https://n8nworkflows.xyz/workflows/ai-social-media-caption-creator-creates-social-media-post-captions-in-airtable-2817


# AI Social Media Caption Creator creates social media post captions in Airtable

### 1. Workflow Overview

This workflow, titled **AI Social Media Caption Creator**, automates the generation of social media post captions within an Airtable editorial plan. It targets marketing teams or social media managers who maintain content plans in Airtable and want to leverage AI to create engaging, audience-tailored captions based on briefing notes and background information stored in Airtable.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Detects new Airtable records indicating new social media posts to be captioned.
- **1.2 Delay for Data Completion:** Waits to ensure the briefing field is fully populated by the user.
- **1.3 Data Retrieval:** Fetches the full record data from Airtable, including briefing and metadata.
- **1.4 AI Caption Generation:** Uses an AI agent powered by OpenAI GPT-4 to create a caption, enriched by background info about the target audience and tonality.
- **1.5 Output Formatting:** Prepares the AI-generated caption for insertion.
- **1.6 Airtable Update:** Posts the generated caption back into the corresponding Airtable record.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block triggers the workflow when a new record is created in the Airtable editorial plan, specifically monitoring the `created_at` field.

- **Nodes Involved:**  
  - Airtable Trigger: New Record

- **Node Details:**  
  - **Airtable Trigger: New Record**  
    - Type: Airtable Trigger  
    - Role: Watches the Airtable base and table for new records created, polling every minute.  
    - Configuration:  
      - Base ID and Table ID point to the editorial plan Airtable base and table.  
      - Trigger field is `created_at` to detect new entries.  
      - Polling interval: every minute.  
      - Authentication via Airtable API token credential.  
    - Inputs: None (trigger node)  
    - Outputs: Emits new record metadata including record ID.  
    - Edge Cases:  
      - Polling delay may cause slight latency.  
      - Authentication errors if API token is invalid or expired.  
      - Missed triggers if Airtable API rate limits are exceeded.

#### 2.2 Delay for Data Completion

- **Overview:**  
  After detecting a new record, the workflow waits 1 minute to allow the record creator to fill in the `Briefing` field before proceeding.

- **Nodes Involved:**  
  - Wait 1 Minute

- **Node Details:**  
  - **Wait 1 Minute**  
    - Type: Wait  
    - Role: Pauses workflow execution for 1 minute.  
    - Configuration: Wait time set to 1 minute.  
    - Inputs: Triggered by the Airtable Trigger node.  
    - Outputs: Passes execution forward after delay.  
    - Edge Cases:  
      - If the briefing is not filled after 1 minute, the AI will process incomplete data.  
      - Workflow execution time increases by 1 minute per record.

#### 2.3 Data Retrieval

- **Overview:**  
  Retrieves the full Airtable record data for the new entry, including briefing and other relevant fields.

- **Nodes Involved:**  
  - Get Airtable Record Data

- **Node Details:**  
  - **Get Airtable Record Data**  
    - Type: Airtable (read)  
    - Role: Fetches the complete record data by record ID.  
    - Configuration:  
      - Uses the record ID from the trigger.  
      - Points to the editorial plan base and table.  
      - Authenticated with Airtable API token.  
    - Inputs: From Wait 1 Minute node.  
    - Outputs: Full record JSON including fields like `Briefing`, `SoMe_Text_AI`, etc.  
    - Edge Cases:  
      - Record may be deleted or unavailable at fetch time.  
      - API errors or rate limits.  
      - Missing or empty briefing field if user did not fill it.

#### 2.4 AI Caption Generation

- **Overview:**  
  Uses an AI agent to generate a creative, audience-tailored social media caption based on the briefing and background info.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  
  - Window Buffer Memory  
  - Background Info

- **Node Details:**  
  - **AI Agent**  
    - Type: LangChain Agent Node  
    - Role: Orchestrates AI caption creation using a system prompt and tools.  
    - Configuration:  
      - Input text is the `Briefing` field from Airtable.  
      - System message instructs the agent to:  
        - Understand briefing deeply.  
        - Retrieve target audience and tonality info using the "Background Info" tool.  
        - Create a creative, engaging caption with a clear call-to-action.  
        - Output only the final caption text without explanations.  
      - Connected to:  
        - OpenAI Chat Model (language model)  
        - Window Buffer Memory (session memory keyed by record ID)  
        - Background Info (Airtable tool to fetch audience data)  
    - Inputs: Full record JSON from Get Airtable Record Data.  
    - Outputs: AI-generated caption text in `output` field.  
    - Edge Cases:  
      - AI model failures or timeouts.  
      - Missing or incomplete briefing or background info.  
      - API quota limits or authentication errors with OpenAI.  
      - Expression evaluation errors in prompt templates.  
    - Version-specific: Requires n8n LangChain nodes v1.7 or later.  
  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Model  
    - Role: Provides GPT-4o model for AI Agent.  
    - Configuration:  
      - Model: GPT-4o  
      - Credentials: OpenAI API key.  
    - Inputs: From AI Agent node (as language model).  
    - Outputs: AI-generated text responses.  
    - Edge Cases: API errors, rate limits, invalid credentials.  
  - **Window Buffer Memory**  
    - Type: LangChain Memory Buffer Window  
    - Role: Maintains conversational context per record/session.  
    - Configuration:  
      - Session key derived from Airtable record ID.  
    - Inputs: AI Agent node (memory).  
    - Outputs: Contextual memory for AI Agent.  
  - **Background Info**  
    - Type: Airtable Tool (AI Tool)  
    - Role: Provides additional background data about target audience and tonality from Airtable "Good to know" table.  
    - Configuration:  
      - Points to Airtable base and "Good to know" table.  
      - Authenticated with Airtable API token.  
    - Inputs: AI Agent node (tool).  
    - Outputs: Background info data for AI Agent.  
    - Edge Cases: Missing or outdated background info, API errors.

#### 2.5 Output Formatting

- **Overview:**  
  Assigns the AI-generated caption text to a workflow variable for updating Airtable.

- **Nodes Involved:**  
  - Format Fields

- **Node Details:**  
  - **Format Fields**  
    - Type: Set Node  
    - Role: Maps AI Agent output to a field named `SoMe Text` for Airtable update.  
    - Configuration:  
      - Sets `SoMe Text` to the AI Agent's `output` property.  
    - Inputs: AI Agent node output.  
    - Outputs: JSON with `SoMe Text` field.  
    - Edge Cases: Missing or empty AI output.

#### 2.6 Airtable Update

- **Overview:**  
  Updates the original Airtable record with the generated caption in the designated field.

- **Nodes Involved:**  
  - Post Caption into Airtable Record

- **Node Details:**  
  - **Post Caption into Airtable Record**  
    - Type: Airtable (update)  
    - Role: Writes the AI-generated caption back into the Airtable editorial plan record.  
    - Configuration:  
      - Uses record ID from "Get Airtable Record Data" node.  
      - Updates the field `SoMe_Text_KI` with the value from `SoMe Text`.  
      - Points to the editorial plan base and table.  
      - Authenticated with Airtable API token.  
    - Inputs: From Format Fields node.  
    - Outputs: Confirmation of record update.  
    - Edge Cases:  
      - Record may have been deleted or locked.  
      - API errors or rate limits.  
      - Field permissions or schema mismatches.

---

### 3. Summary Table

| Node Name                     | Node Type                          | Functional Role                            | Input Node(s)                 | Output Node(s)                 | Sticky Note                                                                                                                          |
|-------------------------------|----------------------------------|--------------------------------------------|------------------------------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Airtable Trigger: New Record   | Airtable Trigger                 | Detect new Airtable records                 | None                         | Wait 1 Minute                 | # Welcome to my AI Social Media Caption Creator Workflow! This workflow automatically creates a social media post caption in Airtable. |
| Wait 1 Minute                 | Wait                            | Delay to allow briefing completion          | Airtable Trigger: New Record | Get Airtable Record Data       | # Welcome to my AI Social Media Caption Creator Workflow! This workflow automatically creates a social media post caption in Airtable. |
| Get Airtable Record Data      | Airtable                        | Retrieve full record data                    | Wait 1 Minute                | AI Agent                      | # Welcome to my AI Social Media Caption Creator Workflow! This workflow automatically creates a social media post caption in Airtable. |
| AI Agent                     | LangChain Agent                 | Generate AI caption using briefing & background info | Get Airtable Record Data, Background Info, OpenAI Chat Model, Window Buffer Memory | Format Fields                 | # Welcome to my AI Social Media Caption Creator Workflow! This workflow automatically creates a social media post caption in Airtable. |
| OpenAI Chat Model            | LangChain OpenAI Chat Model     | Provide GPT-4o AI model                      | AI Agent (ai_languageModel)  | AI Agent (ai_languageModel)    | # Welcome to my AI Social Media Caption Creator Workflow! This workflow automatically creates a social media post caption in Airtable. |
| Window Buffer Memory         | LangChain Memory Buffer Window  | Maintain session memory per record          | AI Agent (ai_memory)         | AI Agent (ai_memory)           | # Welcome to my AI Social Media Caption Creator Workflow! This workflow automatically creates a social media post caption in Airtable. |
| Background Info              | Airtable Tool                   | Provide background info about target audience | AI Agent (ai_tool)           | AI Agent (ai_tool)             | # Welcome to my AI Social Media Caption Creator Workflow! This workflow automatically creates a social media post caption in Airtable. |
| Format Fields               | Set                             | Format AI output for Airtable update        | AI Agent                     | Post Caption into Airtable Record | # Welcome to my AI Social Media Caption Creator Workflow! This workflow automatically creates a social media post caption in Airtable. |
| Post Caption into Airtable Record | Airtable                      | Update Airtable record with AI caption      | Format Fields                | None                          | # Welcome to my AI Social Media Caption Creator Workflow! This workflow automatically creates a social media post caption in Airtable. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Airtable Trigger Node**  
   - Type: Airtable Trigger  
   - Configure with your Airtable base and table IDs for the editorial plan.  
   - Set trigger field to `created_at`.  
   - Set polling interval to every minute.  
   - Authenticate with Airtable API token credential.

2. **Add Wait Node**  
   - Type: Wait  
   - Set wait time to 1 minute.  
   - Connect output of Airtable Trigger to this node.

3. **Add Airtable Read Node**  
   - Type: Airtable (read)  
   - Configure to read from the same base and table as trigger.  
   - Use record ID from previous node (`{{$json["id"]}}`).  
   - Authenticate with Airtable API token.  
   - Connect output of Wait node to this node.

4. **Add LangChain OpenAI Chat Model Node**  
   - Type: LangChain OpenAI Chat Model  
   - Select GPT-4o model.  
   - Authenticate with OpenAI API key credential.

5. **Add LangChain Window Buffer Memory Node**  
   - Type: LangChain Memory Buffer Window  
   - Set session key to record ID (`{{$json["id"]}}`).  
   - Connect this node as memory input to AI Agent.

6. **Add Airtable Tool Node (Background Info)**  
   - Type: Airtable Tool (AI Tool)  
   - Configure to read from your Airtable base and the "Good to know" table containing background info.  
   - Authenticate with Airtable API token.  
   - Connect this node as AI tool input to AI Agent.

7. **Add LangChain Agent Node**  
   - Type: LangChain Agent  
   - Set input text to `{{$json["Briefing"]}}`.  
   - Paste the detailed system prompt instructing the agent to:  
     - Analyze briefing.  
     - Use "Background Info" tool.  
     - Generate creative, audience-focused caption with CTA.  
     - Output only the caption text.  
   - Connect inputs:  
     - Language model input from OpenAI Chat Model node.  
     - Memory input from Window Buffer Memory node.  
     - AI tool input from Background Info node.  
   - Connect output to next node.

8. **Add Set Node (Format Fields)**  
   - Type: Set  
   - Create a new field `SoMe Text` and assign it the AI Agent's output (`{{$json["output"]}}`).  
   - Connect output of AI Agent node to this node.

9. **Add Airtable Update Node**  
   - Type: Airtable (update)  
   - Configure to update the editorial plan base and table.  
   - Use record ID from "Get Airtable Record Data" node (`{{$node["Get Airtable Record Data"].json["id"]}}`).  
   - Map the field `SoMe_Text_KI` to the value from `SoMe Text` field (`{{$json["SoMe Text"]}}`).  
   - Authenticate with Airtable API token.  
   - Connect output of Format Fields node to this node.

10. **Connect Workflow**  
    - Connect nodes in this order:  
      Airtable Trigger → Wait 1 Minute → Get Airtable Record Data → AI Agent (with OpenAI Chat Model, Window Buffer Memory, Background Info as inputs) → Format Fields → Post Caption into Airtable Record.

11. **Activate Workflow**  
    - Test with new Airtable records containing a `Briefing` field.  
    - Ensure API credentials are valid and have sufficient quota.

---

### 5. General Notes & Resources

| Note Content                                                                                                      | Context or Link                                                                                      |
|------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow automatically creates social media captions using AI based on Airtable editorial plan data.             | Workflow purpose                                                                                   |
| Requires Airtable fields: `created_at`, `Briefing`, and `SoMe_Text_AI` (or equivalent for caption storage).      | Airtable schema requirements                                                                       |
| Airtable API access documentation: https://docs.n8n.io/integrations/builtin/credentials/airtable                  | Credential setup guide                                                                             |
| Example Airtable editorial plan: https://airtable.com/appIXeIkDPjQefHXN/shrwcY45g48RpcvvC                         | Sample data structure                                                                              |
| AI API access required: OpenAI, Anthropic, Google, or Ollama supported via LangChain nodes.                       | AI integration requirements                                                                        |
| Contact for questions: https://www.linkedin.com/in/friedemann-schuetz                                            | Support and contact                                                                                |

---

This documentation provides a detailed, structured reference for understanding, reproducing, and maintaining the **AI Social Media Caption Creator** workflow in n8n. It covers all nodes, their configurations, and integration points to ensure smooth operation and easy modification.