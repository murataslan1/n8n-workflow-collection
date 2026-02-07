AI-Powered Corporate Research System for Animal Advocacy Campaigns with Claude & Gemini

https://n8nworkflows.xyz/workflows/ai-powered-corporate-research-system-for-animal-advocacy-campaigns-with-claude---gemini-6483


# AI-Powered Corporate Research System for Animal Advocacy Campaigns with Claude & Gemini

### 1. Workflow Overview

This workflow is an AI-powered corporate research system designed to generate detailed, campaign-focused reports for animal advocacy targeting companies or entities involved in animal exploitation. Its primary use case is to support activists and campaigners by providing thoroughly researched intelligence on a main target and its network of connected sub-targets (organizations, individuals, controversies, partnerships) to identify exploitable vulnerabilities and strategic advocacy opportunities.

The workflow logic is organized into the following functional blocks:

- **1.1 Input Reception:** Receives the user query or campaign target from an external trigger or another workflow.
- **1.2 Sub-Target Discovery:** Performs broad, multi-tool research to identify 30-50 relevant sub-targets closely linked to the primary target.
- **1.3 Sub-Target Extraction and Splitting:** Extracts structured sub-target information and splits them into individual items for parallel processing.
- **1.4 Sub-Target Investigation:** Runs detailed research on each sub-target through a specialized research agent workflow, focusing on contacts, controversies, affiliations, and vulnerabilities.
- **1.5 Aggregation:** Collects and aggregates all individual sub-target reports into a consolidated dataset.
- **1.6 Final Report Generation:** Synthesizes all sub-target findings into a professional, campaign-oriented HTML report with strategic recommendations and full source citations.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
Receives the initial query specifying the corporate target for research. Acts as the entry point when triggered by another workflow.

**Nodes Involved:**  
- When Executed by Another Workflow

**Node Details:**  
- **When Executed by Another Workflow**  
  - Type: Execute Workflow Trigger  
  - Role: Receives input parameter `query` from calling workflow.  
  - Configuration: Defines `query` as workflow input.  
  - Inputs: External workflow call.  
  - Outputs: Passes query JSON downstream.  
  - Edge Cases: Missing or malformed query input could cause downstream failures. Validation is implicit in sub-workflows.  
  - Sub-workflow: This node is the entry point and expects external workflow invocation.

---

#### 2.2 Sub-Target Discovery

**Overview:**  
Uses a dedicated research agent sub-workflow to conduct broad, multi-tool investigations to identify a comprehensive list of 30-50 specific sub-targets (individuals, organizations, partnerships, controversies) connected to the main target.

**Nodes Involved:**  
- Find Sub-Targets  
- OpenRouter Chat Model2  
- Information Extractor

**Node Details:**  
- **Find Sub-Targets**  
  - Type: Execute Workflow  
  - Role: Invokes the "General Research Agent" sub-workflow to discover sub-targets.  
  - Configuration: Passes a carefully crafted prompt embedding the original user query and instructions for identifying actionable sub-targets.  
  - Inputs: Receives `query` from the entry node.  
  - Outputs: Produces raw research results containing sub-target data.  
  - Edge Cases: Workflow failures or incomplete results if sub-workflow fails or returns insufficient sub-targets.  
  - Sub-workflow: Calls external workflow ID `k053fXGjIF7dUIQZ` (General Research Agent).

- **OpenRouter Chat Model2**  
  - Type: OpenRouter Chat Model (Google Gemini 2.5 flash preview)  
  - Role: Language model used within the sub-workflow for research synthesis.  
  - Configuration: Uses OpenRouter API credentials with Google Gemini model.  
  - Inputs: Passes chat inputs from Find Sub-Targets.  
  - Outputs: Processed text used by Information Extractor.  
  - Edge Cases: API rate limits, auth failures, or model timeouts.

- **Information Extractor**  
  - Type: LangChain Information Extractor  
  - Role: Parses the language model output to extract structured JSON array of sub-target objects with fields "Sub-Target Name" and "Relevance".  
  - Configuration: Uses a strict system prompt instructing to return only JSON without extraneous text; schema validates each sub-target object.  
  - Inputs: Text from the language model output.  
  - Outputs: JSON array of sub-targets.  
  - Edge Cases: Parsing errors if output does not comply with strict JSON format; incomplete extraction if model output is malformed.

---

#### 2.3 Sub-Target Extraction and Splitting

**Overview:**  
Splits the extracted list of sub-target objects into individual items for independent processing.

**Nodes Involved:**  
- Split Out

**Node Details:**  
- **Split Out**  
  - Type: Split Out  
  - Role: Takes the JSON array of sub-targets and splits it so each sub-target becomes a separate item in the workflow.  
  - Configuration: Splits by field "output" which holds the sub-target list.  
  - Inputs: JSON array from Information Extractor.  
  - Outputs: Individual sub-target items.  
  - Edge Cases: Empty or malformed array can cause no outputs or errors.

---

#### 2.4 Sub-Target Investigation

**Overview:**  
For each sub-target item, invokes a detailed research agent sub-workflow to gather deep, focused intelligence about that sub-target’s contacts, controversies, affiliations, vulnerabilities, and connections to the primary target.

**Nodes Involved:**  
- Investigate Sub-Targets  
- OpenRouter Chat Model3

**Node Details:**  
- **Investigate Sub-Targets**  
  - Type: Execute Workflow (Mode: Each)  
  - Role: Calls the "General Tools Agent" sub-workflow once for each sub-target item to perform deep, multi-tool research.  
  - Configuration: Passes a detailed prompt embedding sub-target name, relevance, and user query. Limits research calls to 10 per sub-target and specifies output sections.  
  - Inputs: Individual sub-target items from Split Out.  
  - Outputs: Detailed reports per sub-target.  
  - Edge Cases: Rate limits or failures in sub-workflow; incomplete data if tool call limits reached early.  
  - Sub-workflow: Calls external workflow ID `k053fXGjIF7dUIQZ` (General Tools Agent).

- **OpenRouter Chat Model3**  
  - Type: OpenRouter Chat Model (Anthropic Claude Sonnet 4)  
  - Role: Language model used inside the sub-workflow to synthesize detailed reports.  
  - Configuration: Uses OpenRouter API with Anthropic Claude model.  
  - Inputs: Chat inputs for report generation.  
  - Outputs: Report text for aggregation.  
  - Edge Cases: API errors, timeouts, or malformed report text.

---

#### 2.5 Aggregation

**Overview:**  
Aggregates all detailed individual sub-target reports into a single comprehensive dataset to prepare for final report synthesis.

**Nodes Involved:**  
- Aggregate

**Node Details:**  
- **Aggregate**  
  - Type: Aggregate  
  - Role: Combines all individual sub-target report items into one aggregated item containing the full dataset.  
  - Configuration: Uses "aggregateAllItemData" to merge all inputs into one output.  
  - Inputs: Multiple sub-target reports from Investigate Sub-Targets.  
  - Outputs: Single aggregated item with array of all sub-target reports.  
  - Edge Cases: Large data size could cause performance issues; empty inputs result in empty aggregation.

---

#### 2.6 Final Report Generation

**Overview:**  
Synthesizes the aggregated sub-target findings and the original query into a single, professional, campaign-focused HTML report. The report includes detailed sections, strategic insights, and full citation of all URLs found during research.

**Nodes Involved:**  
- Write Final Report

**Node Details:**  
- **Write Final Report**  
  - Type: LangChain Chain LLM  
  - Role: Uses a powerful language model prompt to produce a thorough HTML report with structured sections: introduction, insights, vulnerabilities, tactics, strategic recommendations, contact information, and citations.  
  - Configuration: Contains a comprehensive system and user prompt specifying output style, structure, content restrictions (no speculative or placeholder content), and formatting requirements (raw HTML only).  
  - Inputs: Aggregated sub-target data and original query.  
  - Outputs: Final HTML report string.  
  - Edge Cases: Model hallucination, incomplete citations, or formatting errors if instructions are not strictly followed.  
  - Version: LangChain Chain LLM v1.5.  
  - Credentials: Uses OpenRouter API with Anthropic Claude Sonnet 4 model (connected externally).  

---

### 3. Summary Table

| Node Name                   | Node Type                                  | Functional Role                         | Input Node(s)                     | Output Node(s)                 | Sticky Note                                                                                                                              |
|-----------------------------|--------------------------------------------|---------------------------------------|----------------------------------|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| When Executed by Another Workflow | Execute Workflow Trigger                  | Entry point, receives user query      | External workflow call            | Find Sub-Targets               |                                                                                                                                          |
| Find Sub-Targets             | Execute Workflow                           | Runs sub-workflow to discover sub-targets | When Executed by Another Workflow | Information Extractor          | # 🔍 Initial Company Research - Uses the Multi-tool Research Agent subworkflow to gather broad intel on the target company.               |
| OpenRouter Chat Model2       | LangChain OpenRouter Chat Model (Gemini) | Language model for sub-target discovery | Find Sub-Targets (internal)       | Information Extractor (internal) |                                                                                                                                          |
| Information Extractor        | LangChain Information Extractor           | Extracts structured sub-target list   | Find Sub-Targets                  | Split Out                     | # ✂️ Split Sub-Targets - Splits each sub-target into its own item for parallel processing.                                                |
| Split Out                   | Split Out                                 | Splits sub-target array into items    | Information Extractor             | Investigate Sub-Targets        |                                                                                                                                          |
| Investigate Sub-Targets      | Execute Workflow (Each)                    | Runs detailed research per sub-target | Split Out                       | Aggregate                     | # 🕵️‍♂️ Sub-Target Deep Research - Calls Multi-tool Research Agent subworkflow per sub-target for focused intel.                         |
| OpenRouter Chat Model3       | LangChain OpenRouter Chat Model (Claude) | Language model for detailed sub-target reports | Investigate Sub-Targets (internal) | Aggregate (internal)           |                                                                                                                                          |
| Aggregate                   | Aggregate                                 | Aggregates all sub-target reports     | Investigate Sub-Targets           | Write Final Report            |                                                                                                                                          |
| Write Final Report          | LangChain Chain LLM                       | Synthesizes final campaign report     | Aggregate                       | (End)                        | # 📄 Generate Campaign Research Report - Produces detailed report with tactics and recommendations. \n# Note: Output is HTML formatted. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "When Executed by Another Workflow" node**  
   - Type: Execute Workflow Trigger  
   - Configure an input parameter named `query` (string).  
   - This node will receive the user query from external workflows.

2. **Create "Find Sub-Targets" node**  
   - Type: Execute Workflow  
   - Set to call the sub-workflow with ID `k053fXGjIF7dUIQZ` (General Research Agent).  
   - Pass inputs: craft a detailed prompt embedding the received `query`, instructing to identify 30-50 highly relevant sub-targets with specific relevance explanations.  
   - Use a dynamic sessionId for uniqueness (e.g., a random string plus timestamp).  
   - Connect input from "When Executed by Another Workflow".

3. **Create "OpenRouter Chat Model2" node**  
   - Type: LangChain OpenRouter Chat Model  
   - Model: `google/gemini-2.5-flash-preview`  
   - Set OpenRouter API credentials.  
   - This node is used internally by the sub-workflow called by "Find Sub-Targets".

4. **Create "Information Extractor" node**  
   - Type: LangChain Information Extractor  
   - Configure:  
     - Input text: combine output from "Find Sub-Targets" (`$json.output`) and recent intermediate steps.  
     - Use a strict JSON schema defining an array of objects with "Sub-Target Name" and "Relevance" fields.  
     - Use a system prompt to only output pure JSON without any code fences or explanations.  
   - Connect output of "Find Sub-Targets" or its internal language model to this node.

5. **Create "Split Out" node**  
   - Type: Split Out  
   - Configure to split on the field containing the extracted list of sub-targets (likely `output`).  
   - Connect input from "Information Extractor".

6. **Create "Investigate Sub-Targets" node**  
   - Type: Execute Workflow (Mode: Each)  
   - Configure to call the sub-workflow with ID `k053fXGjIF7dUIQZ` (General Tools Agent).  
   - Pass parameters embedding the individual sub-target's name, relevance, and the original user query. Limit to 10 tool calls per sub-target.  
   - Connect input from "Split Out".

7. **Create "OpenRouter Chat Model3" node**  
   - Type: LangChain OpenRouter Chat Model  
   - Model: `anthropic/claude-sonnet-4`  
   - Set OpenRouter API credentials.  
   - Used internally by the sub-workflow called by "Investigate Sub-Targets".

8. **Create "Aggregate" node**  
   - Type: Aggregate  
   - Configure: `aggregateAllItemData` to combine all detailed reports into one item.  
   - Connect input from "Investigate Sub-Targets".

9. **Create "Write Final Report" node**  
   - Type: LangChain Chain LLM  
   - Configure a detailed prompt that:  
     - Synthesizes all sub-target reports into a single HTML document.  
     - Follows the provided report structure (Introduction, Insights, Strategic Recommendations, Contacts, Citations).  
     - Enforces exclusion of speculative or missing data sections.  
     - Requires inclusion of ALL referenced URLs as footnotes.  
     - Specifies output must be raw HTML only (no markdown or other markup).  
   - Connect input from "Aggregate".  
   - Use OpenRouter API credentials with Anthropic Claude Sonnet 4 model.

10. **Connect nodes in order:**  
    When Executed by Another Workflow → Find Sub-Targets → Information Extractor → Split Out → Investigate Sub-Targets → Aggregate → Write Final Report

11. **Set Credentials:**  
    - Configure OpenRouter API credentials with necessary API keys for both Google Gemini and Anthropic Claude models.  
    - Ensure the sub-workflows called ("General Research Agent" and "General Tools Agent") are available and properly configured.

12. **Test and validate:**  
    - Trigger workflow with a sample query.  
    - Confirm that sub-target discovery produces 30-50 structured sub-targets.  
    - Confirm parallel processing of sub-target investigations.  
    - Confirm aggregation and final HTML report generation with proper citations.

---

### 5. General Notes & Resources

| Note Content                                                                                                                | Context or Link                                                                                                   |
|-----------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| Initial company research uses the Multi-tool Research Agent subworkflow to gather broad intel on the target company.         | https://n8n.io/workflows/5588-multi-tool-research-agent-for-animal-advocacy-with-openrouter-serper-and-open-paws-db/ |
| Sub-target deep research runs the Multi-tool Research Agent subworkflow for each sub-target to gather detailed intel.        | https://n8n.io/workflows/5588-multi-tool-research-agent-for-animal-advocacy-with-openrouter-serper-and-open-paws-db/ |
| The final report is produced as HTML, suitable for direct emailing, returning to an AI agent, or posting online (e.g., Gist). |                                                                                                                  |

---

This documentation fully describes the logical structure, node configurations, interactions, and reproduction steps of the workflow, enabling both expert users and automation agents to understand, modify, and reliably operate it within the n8n environment.