Automate Personalized Upwork Proposals with GPT-4, Google Docs & Mermaid Diagrams

https://n8nworkflows.xyz/workflows/automate-personalized-upwork-proposals-with-gpt-4--google-docs---mermaid-diagrams-6174


# Automate Personalized Upwork Proposals with GPT-4, Google Docs & Mermaid Diagrams

---

## 1. Workflow Overview

This workflow automates the creation of personalized Upwork proposals leveraging GPT-4, Google Docs, and Mermaid.js diagrams. It is designed for freelancers or agencies seeking to rapidly generate tailored job applications, detailed professional proposals, and visual workflow diagrams in response to job postings on Upwork. The key use cases include automating proposal writing, professional document generation, and visual presentations to enhance client engagement.

The workflow is logically divided into four main blocks:

- **1.1 Application Copy Generation:** Receives job descriptions and creates tailored Upwork application texts using AI templates.
- **1.2 Google Doc Proposal Creation:** Produces detailed professional proposals in Google Docs by generating content via AI and populating a document template.
- **1.3 Mermaid Diagram Generation:** Generates Mermaid.js flowchart code to visually represent the proposed solution.
- **1.4 AI Agent Orchestration:** Central orchestration node that accepts incoming chat messages (job descriptions), invokes the three sub-workflows (application, proposal, diagram), and compiles their outputs into a cohesive response including link replacements.

---

## 2. Block-by-Block Analysis

### 2.1 Application Copy Generation

**Overview:**  
Generates a personalized, templated Upwork application text based on the job description and personal social proof. This block uses an execute trigger, sets personal variables, calls OpenAI to produce the proposal text, and formats the response for consumption by an AI agent.

**Nodes Involved:**  
- Execute Workflow Trigger  
- Set Variable  
- OpenAI  
- Edit Fields  
- Sticky Note (Step 1 explanation)

**Node Details:**

- **Execute Workflow Trigger**  
  - Type: Trigger node to start workflow execution.  
  - Config: No parameters; triggers when invoked externally.  
  - Input: External trigger (e.g., from AI agent).  
  - Output: Passes received job description JSON downstream.  
  - Failure: Trigger misconfiguration or missing input data can cause failure.

- **Set Variable**  
  - Type: Variable assignment node.  
  - Config: Sets `aboutMe` string with detailed personal achievements and social proof.  
  - Input: From Execute Workflow Trigger.  
  - Output: Passes job description along with `aboutMe` variable.  
  - Edge Cases: Variable content should not exceed node limits; long text handled correctly.

- **OpenAI**  
  - Type: OpenAI GPT-4 model node (model: gpt-4o-mini).  
  - Config:  
    - Temperature 0.7 for balanced creativity.  
    - System message instructs node to act as an Upwork application writer.  
    - Input message includes job description and `aboutMe` variable.  
    - Output formatted strictly in JSON with a proposal field containing templated text, preserving `$$$` as placeholders for links.  
  - Input: Job description and `aboutMe`.  
  - Output: JSON with `proposal` text.  
  - Edge Cases:  
    - API key or quota issues.  
    - Potential timeout or incomplete responses.  
    - Expression evaluation errors when injecting variables.

- **Edit Fields**  
  - Type: Set node to format output.  
  - Config: Extracts `proposal` from OpenAI response JSON and sets it as `response` for AI agent use.  
  - Input: OpenAI node output.  
  - Output: Formatted string proposal.  
  - Edge Cases: Missing or malformed JSON from OpenAI can cause errors.

- **Sticky Note (Step 1)**  
  - Describes the entire step 1 process for user clarity.  
  - Content includes template structure and key logic notes.

---

### 2.2 Google Doc Proposal Creation

**Overview:**  
Generates a professional proposal document in Google Docs by creating structured content with AI, copying a Google Docs template, inserting AI-generated data, sharing the document publicly, and returning a shareable URL.

**Nodes Involved:**  
- Set Variable1  
- OpenAI1  
- Google Drive (copy template)  
- Google Drive1 (share document publicly)  
- Google Docs (replace placeholders)  
- Edit Fields1  
- Sticky Note1 (Step 2 explanation)

**Node Details:**

- **Set Variable1**  
  - Type: Set node.  
  - Config: Similar to Set Variable but scoped for proposal generation; sets `aboutMe` string with social proof and achievements.  
  - Input: Triggered from main flow.  
  - Output: Adds `aboutMe` to job description context.

- **OpenAI1**  
  - Type: OpenAI GPT-4 model node (gpt-4o-mini).  
  - Config:  
    - Temperature 0.7.  
    - System message instructs node to write a detailed proposal in a JSON format including fields like title, explanation, bullet points, and flow descriptions.  
    - Input includes job description and `aboutMe`.  
    - Output: Structured JSON proposal data.  
    - Special formatting: bullet points delimited by newline with dashes; flow represented with arrows (`->`).  
  - Input: Job description and `aboutMe`.  
  - Output: JSON with multiple fields for proposal content.  
  - Edge Cases: API response completeness and JSON parsing errors.

- **Google Drive (Copy Template)**  
  - Type: Google Drive node (copy file operation).  
  - Config: Copies a fixed Google Docs template file (hardcoded file ID) and renames it using the proposal title from OpenAI1 output.  
  - Input: OpenAI1 output with title.  
  - Output: File metadata including new document ID.  
  - Edge Cases: Permission errors or quota limits on Google Drive API.

- **Google Drive1 (Share Document)**  
  - Type: Google Drive node (share file operation).  
  - Config: Sets sharing permissions to `anyone with link` as reader.  
  - Input: New document ID from previous node.  
  - Output: Confirmation of sharing settings.  
  - Edge Cases: Permission errors if OAuth credentials lack sharing rights.

- **Google Docs (Replace Placeholders)**  
  - Type: Google Docs node (update document operation).  
  - Config: Replaces multiple placeholders in the template with respective fields from OpenAI1 JSON output. Placeholders include title, explanation, request specifics, bullet points, flow arrows, and about me.  
  - Input: Document ID and proposal JSON fields.  
  - Output: Document update confirmation.  
  - Edge Cases: Template not matching placeholders, API errors, or rate limits.

- **Edit Fields1**  
  - Type: Set node.  
  - Config: Constructs and returns a shareable Google Docs URL based on document ID.  
  - Input: Google Docs output (document ID).  
  - Output: `urlOfProposal` string with full edit URL.  
  - Edge Cases: Incorrect document ID or malformed URLs.

- **Sticky Note1 (Step 2)**  
  - Explains the detailed proposal creation process and output expectations.

---

### 2.3 Mermaid Diagram Generation

**Overview:**  
Generates a Mermaid.js flowchart diagram representing the job’s workflow or solution. The output is Mermaid code that can be visualized externally to impress clients with a professional diagram.

**Nodes Involved:**  
- OpenAI2  
- Edit Fields2  
- Sticky Note2 (Step 3 explanation)

**Node Details:**

- **OpenAI2**  
  - Type: OpenAI GPT-4 model node (gpt-4o-mini).  
  - Config:  
    - Temperature 0.7.  
    - System message instructs node to produce only Mermaid flowchart code (no other diagram types or formatting).  
    - Input: Job description.  
    - Output: Plaintext Mermaid diagram code.  
  - Input: Job description.  
  - Output: Mermaid code string.  
  - Edge Cases: Output formatting errors, incomplete diagrams, or API failures.

- **Edit Fields2**  
  - Type: Set node.  
  - Config: Sets `mermaidCode` field with the Mermaid diagram code from OpenAI2 output for further use.  
  - Input: OpenAI2 output.  
  - Output: Mermaid code string.  
  - Edge Cases: Missing or malformed output.

- **Sticky Note2 (Step 3)**  
  - Describes this step’s purpose, output format, example flowchart syntax, and client value.

---

### 2.4 AI Agent Orchestration

**Overview:**  
Acts as the main AI agent that receives Upwork job descriptions via chat messages, maintains conversational memory, and orchestrates calls to the three sub-workflows for application copy, Google Doc proposal, and Mermaid diagram generation. It also replaces placeholder tokens with real links before output.

**Nodes Involved:**  
- When chat message received  
- AI Agent  
- OpenAI Chat Model  
- Window Buffer Memory  
- Generate Application Copy (sub-workflow call)  
- Generate Google Doc Proposal (sub-workflow call)  
- Generate Mermaid.js (sub-workflow call)  
- Sticky Note3 (Step 4 explanation)

**Node Details:**

- **When chat message received**  
  - Type: Chat trigger node for Langchain agent.  
  - Config: Listens for incoming chat messages representing Upwork job descriptions.  
  - Output: Passes job description text to AI Agent.  
  - Edge Cases: Webhook or connection failures.

- **AI Agent**  
  - Type: Langchain AI agent node.  
  - Config:  
    - System message instructs agent to generate all three assets (application, proposal, diagram) for each job description.  
    - Replaces `$$$` placeholders with actual Google Doc proposal URLs.  
    - Coordinates sub-workflow calls.  
  - Input: Chat message from trigger.  
  - Output: Final composed response with all assets and links.  
  - Edge Cases: Coordination failures, sub-workflow invocation errors, variable substitution errors.

- **OpenAI Chat Model**  
  - Type: OpenAI chat completion node used internally by the AI Agent.  
  - Config: No parameters exposed here; used as a language model backend.  
  - Input/Output: Internal to agent.  
  - Edge Cases: API or quota issues.

- **Window Buffer Memory**  
  - Type: Memory node to maintain context over chat messages.  
  - Config: Context window length set to 10 messages for stateful conversation.  
  - Input/Output: Internal to agent.  
  - Edge Cases: Memory overflow or loss of context.

- **Generate Application Copy, Generate Google Doc Proposal, Generate Mermaid.js**  
  - Type: Tool Workflow nodes calling respective sub-workflows by ID.  
  - Config:  
    - Each tool takes job description input and outputs respective content (text, doc URL, diagram code).  
    - Outputs mapped back to the AI agent for compilation.  
  - Edge Cases: Sub-workflow failures, communication errors.

- **Sticky Note3 (Step 4)**  
  - Details the orchestration logic, business value, revenue potential, and key functional roles.

---

## 3. Summary Table

| Node Name                 | Node Type                               | Functional Role                        | Input Node(s)               | Output Node(s)                | Sticky Note                                                                                                              |
|---------------------------|---------------------------------------|-------------------------------------|-----------------------------|------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Sticky Note               | stickyNote                            | Describes Step 1 Application Copy   |                             |                              | ## 🎯 STEP 1: Application Copy Generation ...                                                                            |
| Execute Workflow Trigger  | executeWorkflowTrigger                | Starts Application Copy Block       |                             | Set Variable                  |                                                                                                                          |
| Set Variable              | set                                  | Sets personal social proof variable | Execute Workflow Trigger     | OpenAI                       |                                                                                                                          |
| OpenAI                   | openAi (GPT-4)                       | Generates personalized proposal text| Set Variable                 | Edit Fields                  |                                                                                                                          |
| Edit Fields               | set                                  | Extracts proposal text for output   | OpenAI                      |                              |                                                                                                                          |
| Sticky Note1              | stickyNote                            | Describes Step 2 Google Doc Proposal|                             |                              | ## 📄 STEP 2: Google Doc Proposal Creation ...                                                                            |
| Set Variable1             | set                                  | Sets personal social proof for proposal |                           | OpenAI1                      |                                                                                                                          |
| OpenAI1                  | openAi (GPT-4)                       | Generates structured proposal content| Set Variable1               | Google Drive                 |                                                                                                                          |
| Google Drive              | googleDrive                          | Copies Google Docs template         | OpenAI1                      | Google Drive1                |                                                                                                                          |
| Google Drive1             | googleDrive                          | Shares document publicly            | Google Drive                 | Google Docs                  |                                                                                                                          |
| Google Docs               | googleDocs                          | Replaces template placeholders      | Google Drive1                | Edit Fields1                 |                                                                                                                          |
| Edit Fields1              | set                                  | Constructs shareable document URL   | Google Docs                  |                              |                                                                                                                          |
| Sticky Note2              | stickyNote                            | Describes Step 3 Mermaid Diagram    |                             |                              | ## 📊 STEP 3: Mermaid Diagram Generation ...                                                                              |
| OpenAI2                  | openAi (GPT-4)                       | Generates Mermaid.js flowchart code |                             | Edit Fields2                 |                                                                                                                          |
| Edit Fields2              | set                                  | Sets Mermaid code string            | OpenAI2                     |                              |                                                                                                                          |
| Sticky Note3              | stickyNote                            | Describes Step 4 AI Agent Orchestration |                          |                              | ## 🤖 STEP 4: AI Agent Orchestration ...                                                                                  |
| When chat message received| chatTrigger                         | Receives incoming Upwork job posts |                             | AI Agent                    |                                                                                                                          |
| AI Agent                  | langchain.agent                     | Orchestrates sub-workflows & output| When chat message received   |                              |                                                                                                                          |
| OpenAI Chat Model         | langchain.lmChatOpenAi               | Language model backend for AI Agent |                             | AI Agent                    |                                                                                                                          |
| Window Buffer Memory      | langchain.memoryBufferWindow         | Maintains conversation context     |                             | AI Agent                    |                                                                                                                          |
| Generate Application Copy | langchain.toolWorkflow               | Calls sub-workflow for app copy    |                             | AI Agent                    |                                                                                                                          |
| Generate Google Doc Proposal | langchain.toolWorkflow            | Calls sub-workflow for Google Docs |                             | AI Agent                    |                                                                                                                          |
| Generate Mermaid.js       | langchain.toolWorkflow               | Calls sub-workflow for Mermaid code|                             | AI Agent                    |                                                                                                                          |

---

## 4. Reproducing the Workflow from Scratch

1. **Create the Application Copy Sub-Workflow:**

   1. Add an **Execute Workflow Trigger** node. No special parameters.
   2. Add a **Set** node named `Set Variable`. Configure it to set a string variable `aboutMe` with detailed personal social proof and achievements.
   3. Add an **OpenAI** node configured as follows:
      - Model: `gpt-4o-mini`
      - Temperature: `0.7`
      - System message: "You are a helpful, intelligent Upwork application writer."
      - Prompt includes job description and `aboutMe` variable.
      - Output in JSON format with a `proposal` field.
      - Use expressions to pass job description from trigger and the `aboutMe` variable.
   4. Add a **Set** node named `Edit Fields` to extract the `proposal` field from OpenAI output and assign it to `response`.
   5. Connect nodes in order: Execute Workflow Trigger → Set Variable → OpenAI → Edit Fields.
   6. Save this as a sub-workflow named "generate_upwork_application_copy".

2. **Create the Google Doc Proposal Sub-Workflow:**

   1. Add a **Set** node named `Set Variable1` with the same or similar `aboutMe` variable as above.
   2. Add an **OpenAI** node `OpenAI1`:
      - Model: `gpt-4o-mini`
      - Temperature: `0.7`
      - System message: "You are a helpful, intelligent proposal writer."
      - Input: job description and `aboutMe`.
      - Output: JSON with fields like `titleOfSystem`, `briefExplanationOfSystem`, `stepByStepBulletPoints`, etc.
   3. Add a **Google Drive** node:
      - Operation: Copy file.
      - File ID: Use an existing Google Docs template file ID (replace with your own).
      - New file name: Use expression to set from `titleOfSystem`.
   4. Add a **Google Drive** node (Google Drive1):
      - Operation: Share file.
      - Permissions: `anyone` with `reader` role.
      - File ID: Use the copied document ID from previous node.
   5. Add a **Google Docs** node:
      - Operation: Update document.
      - Document URL: Use the ID from copied document.
      - Actions: Replace placeholders like `{{titleOfSystem}}`, `{{briefExplanationOfSystem}}`, etc. with corresponding OpenAI1 JSON fields.
   6. Add a **Set** node `Edit Fields1`:
      - Create a string field `urlOfProposal` with the Google Docs edit link based on document ID.
   7. Connect nodes: Set Variable1 → OpenAI1 → Google Drive → Google Drive1 → Google Docs → Edit Fields1.
   8. Save this sub-workflow as "generate_google_doc_proposal".

3. **Create the Mermaid Diagram Sub-Workflow:**

   1. Add an **OpenAI** node `OpenAI2`:
      - Model: `gpt-4o-mini`
      - Temperature: `0.7`
      - System message: "You are a helpful, intelligent Mermaid.js code writer."
      - Input: Job description.
      - Output: Plain Mermaid flowchart code only.
   2. Add a **Set** node `Edit Fields2`:
      - Assign the Mermaid code string to a field `mermaidCode`.
   3. Connect nodes: OpenAI2 → Edit Fields2.
   4. Save this sub-workflow as "generate_mermaid_diagram".

4. **Create the Main Orchestrator Workflow:**

   1. Add a **When chat message received** node (Langchain chat trigger).
   2. Add a **AI Agent** node:
      - Configure system message instructing to generate all three assets (application, proposal, diagram) per job description.
      - Enable placeholder replacement (`$$$`) with Google Doc link.
   3. Add **OpenAI Chat Model** node as backend for AI Agent.
   4. Add **Window Buffer Memory** node for conversation context (window length 10).
   5. Add three **Tool Workflow** nodes:
      - "Generate Application Copy" referencing the `generate_upwork_application_copy` sub-workflow.
      - "Generate Google Doc Proposal" referencing the `generate_google_doc_proposal` sub-workflow.
      - "Generate Mermaid.js" referencing the `generate_mermaid_diagram` sub-workflow.
   6. Connect:
      - When chat message received → AI Agent
      - AI Agent → OpenAI Chat Model (ai_languageModel)
      - AI Agent → Window Buffer Memory (ai_memory)
      - AI Agent → Generate Application Copy (ai_tool)
      - AI Agent → Generate Google Doc Proposal (ai_tool)
      - AI Agent → Generate Mermaid.js (ai_tool)
   7. Configure credentials for:
      - OpenAI API (GPT-4)
      - Google Drive and Google Docs API (OAuth2 with proper scopes)
   8. Test full flow by sending Upwork job descriptions via the chat trigger endpoint.

---

## 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                                 |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| Workflow uses proven Upwork proposal templates with placeholders (`$$$`) replaced by actual Google Doc links. | Detailed template outlined in Sticky Note for Step 1.                                                          |
| Mermaid.js diagrams provide visual flowcharts to impress clients and demonstrate professional approach.       | Mermaid syntax example: `graph TD; A-->B; B-->C;` - copy code to Mermaid visualizer or Whimsical.               |
| Business value highlighted: automates proposal generation saving hours, enabling potentially $500K+ earnings. | Step 4 sticky note content describing revenue and workflow benefits.                                          |
| Google Docs template file ID must be replaced with user’s own template for personalized proposals.             | Located in Google Drive node inside Step 2 block.                                                              |
| Requires Google OAuth2 credentials with Drive and Docs scopes for document creation and sharing.               | Credential configuration needed in Google Drive and Google Docs nodes.                                         |

---

**Disclaimer:** The text provided exclusively derives from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected material. All data processed is legal and public.

---