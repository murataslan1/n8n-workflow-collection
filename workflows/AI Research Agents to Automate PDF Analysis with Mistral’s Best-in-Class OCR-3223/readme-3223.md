AI Research Agents to Automate PDF Analysis with Mistral’s Best-in-Class OCR

https://n8nworkflows.xyz/workflows/ai-research-agents-to-automate-pdf-analysis-with-mistral-s-best-in-class-ocr-3223


# AI Research Agents to Automate PDF Analysis with Mistral’s Best-in-Class OCR

### 1. Workflow Overview

This workflow automates the analysis of complex PDF documents using Mistral’s advanced OCR and AI capabilities, transforming dense documents such as financial reports into either detailed research reports or concise newsletters. It is designed for businesses and researchers seeking automated, high-fidelity document understanding and summarization with customizable depth and focus.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Document Upload:** Handles PDF submission via a form and uploads the document to Mistral’s API.
- **1.2 Document OCR and Understanding:** Uses Mistral’s OCR API to extract structured content from the PDF.
- **1.3 Research Planning and Delegation:** Employs AI agents to plan research, break down content, and assign tasks.
- **1.4 Research Execution and Content Assembly:** Multiple AI research assistants analyze sections and merge their outputs.
- **1.5 Final Editing and Output Delivery:** An editor agent refines the compiled content and sends the final article via Gmail.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Document Upload

**Overview:**  
This block initiates the workflow by receiving a PDF document through an n8n form trigger, then uploads it to Mistral’s API to obtain a signed URL for OCR processing.

**Nodes Involved:**  
- On form submission  
- Mistral Upload  
- Mistral Signed URL  

**Node Details:**  

- **On form submission**  
  - *Type:* Form Trigger  
  - *Role:* Entry point; listens for PDF upload and user input (e.g., output format, instructions)  
  - *Configuration:* Webhook ID configured for form submissions  
  - *Connections:* Outputs to Mistral Upload  
  - *Edge cases:* Missing file upload, invalid file format, webhook failures  

- **Mistral Upload**  
  - *Type:* HTTP Request  
  - *Role:* Uploads the submitted PDF to Mistral’s cloud storage or API endpoint  
  - *Configuration:* Uses Mistral API credentials; sends multipart/form-data with PDF file  
  - *Connections:* Outputs to Mistral Signed URL  
  - *Edge cases:* Upload failures, API authentication errors, file size limits  

- **Mistral Signed URL**  
  - *Type:* HTTP Request  
  - *Role:* Requests a signed URL from Mistral for secure access to the uploaded PDF  
  - *Configuration:* Authenticated request using Mistral credentials  
  - *Connections:* Outputs to Research Leader 🔬 node  
  - *Edge cases:* Expired or invalid signed URL, API errors  

---

#### 2.2 Document OCR and Understanding

**Overview:**  
This block sends the PDF to Mistral’s Document Understanding OCR API to extract structured text, tables, charts, and other elements, preparing the content for AI analysis.

**Nodes Involved:**  
- When Executed by Another Workflow  
- Document Understanding  
- qa_answer (Set node)  

**Node Details:**  

- **When Executed by Another Workflow**  
  - *Type:* Execute Workflow Trigger  
  - *Role:* Allows this workflow to be triggered by other workflows, enabling modular use  
  - *Connections:* Outputs to Document Understanding  
  - *Edge cases:* Trigger failures, missing input data  

- **Document Understanding**  
  - *Type:* HTTP Request  
  - *Role:* Calls Mistral’s OCR API with the signed URL to perform document parsing  
  - *Configuration:* Authenticated request with Mistral API key; sends signed URL and parameters for OCR  
  - *Connections:* Outputs to qa_answer  
  - *Edge cases:* API timeouts, parsing errors, malformed responses  

- **qa_answer**  
  - *Type:* Set  
  - *Role:* Stores or formats the OCR response for downstream processing  
  - *Connections:* None (end of this sub-block)  
  - *Edge cases:* Empty or invalid OCR data  

---

#### 2.3 Research Planning and Delegation

**Overview:**  
This block uses AI agents to plan the research based on the OCR output. The Research Leader creates a table of contents, the Project Planner breaks it into sections, and tasks are delegated to Research Assistants.

**Nodes Involved:**  
- Research Leader 🔬  
- Project Planner  
- Structured Output Parser  
- Delegate to Research Assistants  

**Node Details:**  

- **Research Leader 🔬**  
  - *Type:* LangChain Agent  
  - *Role:* Analyzes OCR data to create a research plan and table of contents  
  - *Configuration:* Uses OpenRouter GPT model (o3-mini) and Mistral_PDF tool workflow for document context  
  - *Connections:* Outputs to Project Planner  
  - *Edge cases:* AI model timeouts, incomplete content understanding  

- **Structured Output Parser**  
  - *Type:* LangChain Structured Output Parser  
  - *Role:* Parses structured AI outputs (e.g., JSON tables) to ensure consistent data format  
  - *Connections:* Outputs to Project Planner’s AI output parser input  
  - *Edge cases:* Parsing failures due to malformed AI responses  

- **Project Planner**  
  - *Type:* LangChain Agent  
  - *Role:* Breaks down the table of contents into manageable research sections  
  - *Configuration:* Uses GPT-4 OpenRouter model (gpt4o) and Mistral_PDF1 tool workflow  
  - *Connections:* Outputs to Delegate to Research Assistants  
  - *Edge cases:* AI retries on failure, incomplete section breakdown  

- **Delegate to Research Assistants**  
  - *Type:* Split Out  
  - *Role:* Splits the sections into individual tasks for parallel processing by Research Assistants  
  - *Connections:* Outputs to Research Assistant and Merge chapters title and text  
  - *Edge cases:* Task distribution errors, empty splits  

---

#### 2.4 Research Execution and Content Assembly

**Overview:**  
Multiple Research Assistant agents analyze assigned sections in depth, then their outputs are merged and prepared for final editing.

**Nodes Involved:**  
- Research Assistant  
- Merge chapters title and text  
- Final article text  

**Node Details:**  

- **Research Assistant**  
  - *Type:* LangChain Agent  
  - *Role:* Performs detailed research and content generation on assigned sections  
  - *Configuration:* Uses OpenRouter GPT model (o3-mini1) and Mistral_PDF2 tool workflow  
  - *Connections:* Outputs to Merge chapters title and text  
  - *Edge cases:* AI model failures, incomplete section analysis  

- **Merge chapters title and text**  
  - *Type:* Merge  
  - *Role:* Combines multiple research assistant outputs into a single coherent document  
  - *Connections:* Outputs to Final article text  
  - *Edge cases:* Merge conflicts, missing data from some assistants  

- **Final article text**  
  - *Type:* Code  
  - *Role:* Performs any final text processing or formatting before editing  
  - *Connections:* Outputs to Editor  
  - *Edge cases:* Code execution errors, formatting issues  

---

#### 2.5 Final Editing and Output Delivery

**Overview:**  
The Editor agent refines the compiled article for coherence and citations, generates a title, and sends the final output via Gmail.

**Nodes Involved:**  
- Editor  
- Title1  
- Gmail1  

**Node Details:**  

- **Editor**  
  - *Type:* LangChain Agent  
  - *Role:* Edits and polishes the final article text, ensuring quality and consistency  
  - *Configuration:* Uses OpenRouter GPT model (o3-mini-3)  
  - *Connections:* Outputs to Title1 and itself (AI language model output)  
  - *Edge cases:* AI response delays, incomplete editing  

- **Title1**  
  - *Type:* LangChain Chain LLM  
  - *Role:* Generates an appropriate title for the final article  
  - *Connections:* Outputs to Gmail1  
  - *Edge cases:* Title relevance or quality issues  

- **Gmail1**  
  - *Type:* Gmail  
  - *Role:* Sends the final article via email  
  - *Configuration:* Uses Gmail OAuth2 credentials; configured with recipient and email content parameters  
  - *Edge cases:* Authentication errors, email delivery failures  

---

### 3. Summary Table

| Node Name                  | Node Type                          | Functional Role                          | Input Node(s)                  | Output Node(s)                   | Sticky Note                          |
|----------------------------|----------------------------------|----------------------------------------|-------------------------------|---------------------------------|------------------------------------|
| On form submission         | Form Trigger                     | Entry point for PDF upload              |                               | Mistral Upload                  |                                    |
| Mistral Upload             | HTTP Request                    | Uploads PDF to Mistral API              | On form submission            | Mistral Signed URL              |                                    |
| Mistral Signed URL         | HTTP Request                    | Gets signed URL for uploaded PDF        | Mistral Upload                | Research Leader 🔬              |                                    |
| Research Leader 🔬          | LangChain Agent                 | Creates research plan and TOC            | Mistral Signed URL            | Project Planner                |                                    |
| Structured Output Parser   | LangChain Output Parser          | Parses structured AI output              |                               | Project Planner (AI output parser) |                                    |
| Project Planner            | LangChain Agent                 | Breaks down TOC into research sections   | Research Leader 🔬, Structured Output Parser | Delegate to Research Assistants |                                    |
| Delegate to Research Assistants | Split Out                      | Splits sections for parallel research    | Project Planner               | Research Assistant, Merge chapters title and text |                                    |
| Research Assistant         | LangChain Agent                 | Performs detailed research on sections   | Delegate to Research Assistants | Merge chapters title and text   |                                    |
| Merge chapters title and text | Merge                          | Combines research assistant outputs      | Delegate to Research Assistants, Research Assistant | Final article text              |                                    |
| Final article text         | Code                            | Final text formatting                     | Merge chapters title and text | Editor                         |                                    |
| Editor                    | LangChain Agent                 | Edits and polishes final article          | Final article text            | Title1, Editor (AI output)      |                                    |
| Title1                    | LangChain Chain LLM             | Generates article title                    | Editor                       | Gmail1                        |                                    |
| Gmail1                    | Gmail                           | Sends final article via email              | Title1                       |                                 |                                    |
| When Executed by Another Workflow | Execute Workflow Trigger       | Allows external triggering of OCR process |                               | Document Understanding         |                                    |
| Document Understanding    | HTTP Request                    | Calls Mistral OCR API                      | When Executed by Another Workflow | qa_answer                     |                                    |
| qa_answer                 | Set                             | Stores OCR response                        | Document Understanding       |                                 |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node**  
   - Type: Form Trigger  
   - Configure webhook to receive PDF uploads and user inputs (output format, instructions).  
   - Position: Start of workflow.

2. **Add HTTP Request Node for Mistral Upload**  
   - Type: HTTP Request  
   - Configure to upload PDF file to Mistral API endpoint.  
   - Use Mistral API credentials.  
   - Connect output of Form Trigger to this node.

3. **Add HTTP Request Node for Mistral Signed URL**  
   - Type: HTTP Request  
   - Configure to request signed URL for uploaded PDF from Mistral API.  
   - Use Mistral API credentials.  
   - Connect output of Mistral Upload to this node.

4. **Add LangChain Agent Node: Research Leader 🔬**  
   - Type: LangChain Agent  
   - Configure with OpenRouter GPT model (o3-mini).  
   - Attach Mistral_PDF tool workflow for document context.  
   - Connect output of Mistral Signed URL to this node.

5. **Add LangChain Structured Output Parser Node**  
   - Type: Structured Output Parser  
   - Connect output to Project Planner’s AI output parser input.

6. **Add LangChain Agent Node: Project Planner**  
   - Type: LangChain Agent  
   - Configure with GPT-4 OpenRouter model (gpt4o).  
   - Attach Mistral_PDF1 tool workflow.  
   - Connect output of Research Leader and Structured Output Parser to this node.

7. **Add Split Out Node: Delegate to Research Assistants**  
   - Type: Split Out  
   - Connect output of Project Planner to this node.

8. **Add LangChain Agent Node: Research Assistant**  
   - Type: LangChain Agent  
   - Configure with OpenRouter GPT model (o3-mini1).  
   - Attach Mistral_PDF2 tool workflow.  
   - Connect one output of Delegate to Research Assistants to this node.

9. **Add Merge Node: Merge chapters title and text**  
   - Type: Merge  
   - Connect outputs of Delegate to Research Assistants and Research Assistant to this node.

10. **Add Code Node: Final article text**  
    - Type: Code  
    - Use for final text formatting or processing.  
    - Connect output of Merge node to this node.

11. **Add LangChain Agent Node: Editor**  
    - Type: LangChain Agent  
    - Configure with OpenRouter GPT model (o3-mini-3).  
    - Connect output of Final article text to this node.

12. **Add LangChain Chain LLM Node: Title1**  
    - Type: Chain LLM  
    - Configure to generate article title.  
    - Connect output of Editor to this node.

13. **Add Gmail Node: Gmail1**  
    - Type: Gmail  
    - Configure with Gmail OAuth2 credentials.  
    - Set recipient, subject, and body parameters to send final article.  
    - Connect output of Title1 to this node.

14. **Add Execute Workflow Trigger Node: When Executed by Another Workflow**  
    - Type: Execute Workflow Trigger  
    - Configure to allow external triggering of OCR process.

15. **Add HTTP Request Node: Document Understanding**  
    - Type: HTTP Request  
    - Configure to call Mistral OCR API with signed URL.  
    - Use Mistral API credentials.  
    - Connect output of Execute Workflow Trigger to this node.

16. **Add Set Node: qa_answer**  
    - Type: Set  
    - Store or format OCR response.  
    - Connect output of Document Understanding to this node.

17. **Credential Setup**  
    - Create credentials for Mistral API (API key).  
    - Create credentials for OpenRouter (for GPT models).  
    - Create Gmail OAuth2 credentials.

18. **Sub-Workflow Setup**  
    - Import or create Mistral_PDF, Mistral_PDF1, and Mistral_PDF2 tool workflows.  
    - Ensure these workflows provide document context and tools for LangChain agents.

---

### 5. General Notes & Resources

| Note Content                                                                 | Context or Link                                                                                           |
|------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Mistral OCR offers superior document understanding including multi-column text, charts, diagrams, and multilingual support. | Workflow description and key features section.                                                          |
| Video overview of multi-agent research team approach: [YouTube Video](https://youtu.be/Z9Lym6AZdVM) | Embedded video link in the workflow description.                                                        |
| Setup instructions include obtaining API keys from OpenRouter.ai and Mistral.ai and configuring credentials in n8n. | Setup section of the workflow description.                                                              |
| Output customization is possible by adjusting word count parameters in the Project Planner node. | Workflow description under Key Features.                                                                 |

---

This document provides a detailed, structured reference for understanding, reproducing, and modifying the "AI Research Agents to Automate PDF Analysis with Mistral’s Best-in-Class OCR" workflow in n8n. It covers all nodes, connections, configurations, and potential failure points to ensure robust implementation and maintenance.