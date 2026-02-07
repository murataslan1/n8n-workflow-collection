AI System Prompt Generator & Optimizer (n8n + OpenAI)

https://n8nworkflows.xyz/workflows/ai-system-prompt-generator---optimizer--n8n---openai--7606


# AI System Prompt Generator & Optimizer (n8n + OpenAI)

### 1. Workflow Overview

This workflow, titled **AI System Prompt Generator & Optimizer (n8n + OpenAI)**, is designed to optimize and generate system prompts for AI agents based on user input. It acts as a **System Prompt Optimizer Agent** that receives a draft prompt or a user goal and returns:

- An optimized, clear, specific, and actionable system prompt.
- A recommendation for the best OpenAI model to use, factoring in reasoning complexity, latency, and cost.

The workflow is structured into the following logical blocks:

- **1.1 Input Reception:** Receives user input via a chat trigger.
- **1.2 AI Processing:** Applies AI memory and language model nodes to generate and optimize the system prompt.
- **1.3 System Instructions & Setup:** Contains sticky notes with instructions and usage guidelines for users and administrators.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block captures the initial user input, which is the draft prompt or goal that needs optimization.

**Nodes Involved:**  
- Chat Message

**Node Details:**

- **Chat Message**  
  - *Type & Role:* Chat trigger node that acts as the entry point for user input via webhook.
  - *Configuration:* Uses a webhook ID for receiving chat messages.
  - *Expressions/Variables:* Captures incoming chat content as input.
  - *Input Connections:* None (workflow start).
  - *Output Connections:* Sends data to the "AI Prompt Generator".
  - *Version-Specific Requirements:* n8n version supporting webhook triggers.
  - *Edge Cases:* Invalid or empty input might cause the downstream AI processing to fail or return non-useful prompts.
  - *Sub-workflow:* None.

#### 1.2 AI Processing

**Overview:**  
Processes the user input to generate an optimized system prompt and recommend the best OpenAI model using LangChain AI components and OpenAI API.

**Nodes Involved:**  
- Simple Memory2  
- OpenAI Chat Model10  
- AI Prompt Generator

**Node Details:**

- **Simple Memory2**  
  - *Type & Role:* LangChain memory buffer window node to maintain conversational context.
  - *Configuration:* Default, no custom parameters.
  - *Expressions/Variables:* Stores and provides recent dialogue context.
  - *Input Connections:* Receives input from OpenAI Chat Model10 via `ai_memory` channel.
  - *Output Connections:* Connects to "AI Prompt Generator" memory input.
  - *Version-Specific Requirements:* Requires LangChain integration.
  - *Edge Cases:* Memory overflow or context size limitations can cause loss of relevant history.

- **OpenAI Chat Model10**  
  - *Type & Role:* Language model node using OpenAI Chat API (LangChain wrapper).
  - *Configuration:*  
    - Model: GPT-5 (selected from a list mode).  
    - Credentials: OpenAI API key configured.
  - *Expressions/Variables:* Uses the selected model for generating completions.
  - *Input Connections:* Feeds AI Prompt Generator via `ai_languageModel` channel.
  - *Output Connections:* Connected into the AI Prompt Generator.
  - *Version-Specific Requirements:* Requires valid OpenAI API credentials and supported n8n LangChain node version.
  - *Edge Cases:* API errors (auth, quota, timeouts), unsupported model, or rate limits.

- **AI Prompt Generator**  
  - *Type & Role:* LangChain agent node that performs the core system prompt optimization.
  - *Configuration:*  
    - System message preset instructing the agent to rewrite the user’s input into a polished system prompt with explicit rules and model recommendation.  
    - Output parser enabled to structure the output.
  - *Expressions/Variables:* Uses systemMessage for prompt logic.
  - *Input Connections:*  
    - Receives chat input from "Chat Message" node.  
    - Receives memory buffer from "Simple Memory2".  
    - Uses "OpenAI Chat Model10" as the language model.
  - *Output Connections:* Outputs the optimized prompt and model recommendation as final output.
  - *Version-Specific Requirements:* Requires n8n LangChain agent node version 2.2 or higher.
  - *Edge Cases:* Parsing errors, incomplete AI responses, or unexpected output format.

#### 1.3 System Instructions & Setup

**Overview:**  
Contains sticky notes with setup instructions, workflow description, and example usage for user guidance.

**Nodes Involved:**  
- Sticky Note33  
- Sticky Note34  
- Sticky Note35  
- Sticky Note36

**Node Details:**

- **Sticky Note33**  
  - *Type & Role:* Visual note with setup instructions for OpenAI API key and billing.
  - *Content Highlights:* Step-by-step instructions to obtain OpenAI API key and add billing funds.
  - *Edge Cases:* None; informational only.

- **Sticky Note34**  
  - *Type & Role:* Workflow description note explaining purpose and outputs.
  - *Content Highlights:* Explains that the workflow optimizes system prompts and recommends best OpenAI model.
  - *Edge Cases:* None.

- **Sticky Note35**  
  - *Type & Role:* Concise OpenAI connection setup instructions.
  - *Content Highlights:* Steps for setting up API keys and billing.
  - *Edge Cases:* None.

- **Sticky Note36**  
  - *Type & Role:* Example user question prompt.
  - *Content Highlights:* Example input specifying a prompt for summarizing meeting transcripts.
  - *Edge Cases:* None.

---

### 3. Summary Table

| Node Name          | Node Type                                   | Functional Role                 | Input Node(s)     | Output Node(s)         | Sticky Note                                                                                                       |
|--------------------|---------------------------------------------|--------------------------------|-------------------|------------------------|-------------------------------------------------------------------------------------------------------------------|
| Chat Message       | Chat Trigger (LangChain chatTrigger)         | Receives user prompt input      | None              | AI Prompt Generator     |                                                                                                                   |
| AI Prompt Generator | LangChain Agent                              | Generates optimized prompt & model recommendation | Chat Message, Simple Memory2, OpenAI Chat Model10 | None                   |                                                                                                                   |
| Simple Memory2     | LangChain Memory Buffer Window               | Maintains conversation context  | OpenAI Chat Model10 (ai_memory) | AI Prompt Generator (ai_memory) |                                                                                                                   |
| OpenAI Chat Model10 | LangChain OpenAI Chat Model                  | Provides language model for AI  | None              | Simple Memory2 (ai_memory), AI Prompt Generator (ai_languageModel) |                                                                                                                   |
| Sticky Note33      | Sticky Note                                  | Setup instructions              | None              | None                   | ## ⚙️ Setup Instructions  1️⃣ Set Up OpenAI Connection  1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)  2. Navigate to [OpenAI Billing](https://platform.openai.com/settings/organization/billing/overview)  3. Add funds to your billing account  4. Copy your API key into the **OpenAI credentials** in n8n  📧 [robert@ynteractive.com](mailto:robert@ynteractive.com)  🔗 [Robert Breen](https://www.linkedin.com/in/robert-breen-29429625/)  🌐 [ynteractive.com](https://ynteractive.com) |
| Sticky Note34      | Sticky Note                                  | Workflow description           | None              | None                   | # 🛠️ AI System Prompt Generator & Optimizer (n8n + OpenAI)  This workflow acts as a **System Prompt Optimizer Agent**.  You send it a draft prompt or goal, and it returns:  1. A rewritten **optimized system prompt** that is clear, specific, and actionable.  2. A recommendation for the **best OpenAI model** to use based on reasoning needs, complexity, and latency/cost tradeoffs.  |
| Sticky Note35      | Sticky Note                                  | OpenAI API key setup instructions | None              | None                   | ### 1️⃣ Set Up OpenAI Connection 1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)  2. Navigate to [OpenAI Billing](https://platform.openai.com/settings/organization/billing/overview)  3. Add funds to your billing account  4. Copy your API key into the **OpenAI credentials** in n8n  |
| Sticky Note36      | Sticky Note                                  | Example input prompt           | None              | None                   | ### example question  I need a system prompt for an agent that summarizes meeting transcripts into 3 bullet points for executives. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Chat Message Node**  
   - Type: LangChain Chat Trigger (`chatTrigger`) node.  
   - Configure webhook with a new unique ID or accept the default.  
   - Purpose: Entry point to receive the user's draft prompt or goal.

2. **Create OpenAI Chat Model Node**  
   - Type: LangChain OpenAI Chat Model (`lmChatOpenAi`).  
   - Set model to "gpt-5" (or use a supported equivalent if unavailable).  
   - Configure OpenAI credentials with a valid API key.  
   - Purpose: Provides the language model for generating responses.

3. **Create Simple Memory Node**  
   - Type: LangChain Memory Buffer Window (`memoryBufferWindow`).  
   - Use default parameters to keep recent conversational context.  
   - Purpose: Maintains dialogue context between user input and AI agent.

4. **Create AI Prompt Generator Node**  
   - Type: LangChain Agent (`agent`) node.  
   - Set `systemMessage` parameter to:  
     ```
     You are a System Prompt Optimizer.  
     Your job is to take a user’s goal or draft prompt and return an optimized system prompt that is clear, specific, and actionable.

     ### Rules:
     - Always rewrite the input into a polished, professional **system prompt**.  
     - Ensure the system prompt includes explicit rules, roles, and constraints where useful.  
     - Make it concise but detailed enough to remove ambiguity.  
     - Recommend the **best OpenAI model** to use for this prompt, based on complexity, reasoning needs, and latency/cost tradeoffs.
     ```
   - Enable output parser to structure the response.  
   - Connect `main` input to "Chat Message" node output.  
   - Connect `ai_memory` input to "Simple Memory" node output.  
   - Connect `ai_languageModel` input to "OpenAI Chat Model" node output.

5. **Connect Nodes**  
   - Connect "Chat Message" → "AI Prompt Generator" (main input).  
   - Connect "OpenAI Chat Model" → "Simple Memory" (ai_memory input).  
   - Connect "Simple Memory" → "AI Prompt Generator" (ai_memory input).  
   - Connect "OpenAI Chat Model" → "AI Prompt Generator" (ai_languageModel input).

6. **Configure Credentials**  
   - In n8n, add OpenAI credentials with your API key obtained from https://platform.openai.com/api-keys.  
   - Ensure billing is set up as per https://platform.openai.com/settings/organization/billing/overview.

7. **Add Sticky Notes (Optional but Recommended)**  
   - Add sticky notes with setup instructions, workflow overview, and example input prompts for user clarity.

8. **Test the Workflow**  
   - Trigger the webhook with a sample draft prompt.  
   - Verify the AI Prompt Generator returns an optimized system prompt and model recommendation.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                                                           |
|-------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Setup instructions for OpenAI key and billing.                                                 | https://platform.openai.com/api-keys and https://platform.openai.com/settings/organization/billing/overview |
| Workflow acts as a system prompt optimizer, rewriting prompts and recommending best OpenAI model. | Workflow description sticky note included in the workflow.                                              |
| Contact for customization and assistance: Robert Breen (robert@ynteractive.com)                 | LinkedIn: https://www.linkedin.com/in/robert-breen-29429625/  Website: https://ynteractive.com            |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to content policies and contains no illegal, offensive, or protected elements. All manipulated data are legal and public.