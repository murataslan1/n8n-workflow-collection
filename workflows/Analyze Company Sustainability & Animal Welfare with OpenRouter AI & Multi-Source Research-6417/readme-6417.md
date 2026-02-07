Analyze Company Sustainability & Animal Welfare with OpenRouter AI & Multi-Source Research

https://n8nworkflows.xyz/workflows/analyze-company-sustainability---animal-welfare-with-openrouter-ai---multi-source-research-6417


# Analyze Company Sustainability & Animal Welfare with OpenRouter AI & Multi-Source Research

### 1. Workflow Overview

This workflow automates a comprehensive sustainability and animal welfare assessment of a given company or institution by leveraging AI-driven research and multi-source data analysis. Its primary use case is to provide ESG (Environmental, Social, and Governance) screening, investment decision support, consumer guidance, and compliance reporting via structured quantitative scoring and narrative reporting.

The workflow is structured into the following logical blocks:

- **1.1 Input Reception:** Entry node receiving the target company name from external workflows.
- **1.2 Multi-Source Research Agent Execution:** Invokes a specialized research sub-workflow to collect and synthesize data from numerous authoritative sources.
- **1.3 AI Structured Scoring:** Processes the research data using an LLM (Large Language Model) to output structured JSON scores, grades, and detailed assessments.
- **1.4 AI HTML Report Generation:** Generates a formatted, human-readable HTML report summarizing the findings.
- **1.5 Data Merging and Final Output Formatting:** Combines structured data and narrative report into one final output package.
- **1.6 Output Setting:** Prepares key data fields and final outputs for downstream systems or user consumption.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Accepts the company name input from an external caller workflow to trigger the assessment process.
- **Nodes Involved:**  
  - *When Executed by Another Workflow*

- **Node Details:**

  - **When Executed by Another Workflow**  
    - Type: Execute Workflow Trigger  
    - Role: Entry point triggered externally, passing input data.  
    - Configuration: Accepts a single input parameter `companyName` (string).  
    - Input Connections: None (trigger node)  
    - Output Connections: Connects to *Trigger Research Agent* node.  
    - Edge Cases: Missing or empty companyName input will cause downstream failures or empty results. Must ensure validation upstream.  
    - Version Requirements: n8n v0.188+ recommended for ExecuteWorkflowTrigger stability.

---

#### 2.2 Multi-Source Research Agent Execution

- **Overview:** Calls a dedicated sub-workflow responsible for comprehensive data retrieval and synthesis from prioritized sources including company reports, certifications, ratings, NGO assessments, academic papers, and media.  
- **Nodes Involved:**  
  - *Trigger Research Agent*

- **Node Details:**

  - **Trigger Research Agent**  
    - Type: Execute Workflow  
    - Role: Invokes the external "General Research Agent" workflow to run multi-source research.  
    - Configuration:  
      - Workflow ID linked to the research agent sub-workflow.  
      - Passes a detailed prompt in `chatInput` parameter, dynamically inserting the input company name.  
      - Session ID generated to uniquely identify the research session.  
    - Input Connections: Receives companyName from *When Executed by Another Workflow*.  
    - Output Connections: Feeds into *Return Structured Analysis* and *Return HTML Report* nodes.  
    - Edge Cases:  
      - Requires the sub-workflow to be imported and configured before use (see sticky note).  
      - Failure if sub-workflow missing or credentials invalid.  
      - Timeout or API rate limits possible on extensive data calls.  
    - Sub-workflow Reference: https://creators.n8n.io/workflows/5588 (must be downloaded and installed).  
    - Notes: The sub-workflow integrates multiple tools such as web scraping, database queries, social media monitoring for enriched data.

---

#### 2.3 AI Structured Scoring

- **Overview:** Processes the collected research data using an LLM configured with a detailed schema prompt to generate a validated, structured JSON object containing scores, grades, certifications, and detailed narrative assessments.  
- **Nodes Involved:**  
  - *OpenRouter Chat Model*  
  - *Structured Output Parser*  
  - *Return Structured Analysis*

- **Node Details:**

  - **OpenRouter Chat Model**  
    - Type: Langchain OpenRouter Chat Model  
    - Role: Performs LLM inference using Google Gemini 2.5 Flash model.  
    - Configuration: No special options; uses OpenRouter API credentials.  
    - Input Connections: Receives prompt from *Trigger Research Agent* output.  
    - Output Connections: Feeds into *Structured Output Parser* and *Return Structured Analysis*.  
    - Edge Cases:  
      - API authentication errors if credentials expired.  
      - Model timeout or rate limiting.  
      - Unexpected model output format requires robust parsing.  

  - **Structured Output Parser**  
    - Type: Langchain Structured Output Parser  
    - Role: Validates and auto-fixes LLM JSON output against a strict predefined JSON schema for company sustainability and animal welfare assessment.  
    - Configuration:  
      - Manual JSON schema with detailed fields such as company name, type, environmental policy, carbon emissions, animal welfare policy, certifications, ratings, scores, and narrative assessments.  
      - `autoFix` enabled to correct minor output deviations.  
    - Input Connections: Connected to *OpenRouter Chat Model* output.  
    - Output Connections: Connects to *Return Structured Analysis* for downstream merging.  
    - Edge Cases: Malformed or incomplete LLM output may cause parse failures; autoFix mitigates some issues.  

  - **Return Structured Analysis**  
    - Type: Langchain Chain LLM  
    - Role: Processes the raw LLM output to finalize and standardize the structured JSON analysis.  
    - Configuration:  
      - Uses the JSON-parsed output as input text.  
      - Contains a detailed, multi-paragraph prompt guiding LLM to produce the comprehensive assessment.  
    - Input Connections: Receives from both *OpenRouter Chat Model* and *Structured Output Parser*.  
    - Output Connections: Connects to *Merge* node for combination with report.  
    - Edge Cases: LLM failures or inconsistent data may cause incomplete or incorrect scoring.

---

#### 2.4 AI HTML Report Generation

- **Overview:** Generates a professional, well-structured HTML report summarizing the assessment results with sections on animal welfare, environmental practices, scores, and closing remarks.  
- **Nodes Involved:**  
  - *OpenRouter Chat Model2*  
  - *Return HTML Report*

- **Node Details:**

  - **OpenRouter Chat Model2**  
    - Type: Langchain OpenRouter Chat Model  
    - Role: Uses Claude Sonnet 4 model for narrative report generation.  
    - Configuration: OpenRouter API credentials reused.  
    - Input Connections: Receives raw research outputs from *Trigger Research Agent*.  
    - Output Connections: Feeds into *Return HTML Report*.  
    - Edge Cases: Same as other LLM nodes; model-specific response style may vary.  

  - **Return HTML Report**  
    - Type: Langchain Chain LLM  
    - Role: Converts the research data into a formatted HTML report using a detailed prompt specifying structure and tags.  
    - Configuration: Prompt enforces HTML5 structure with headings, paragraphs, lists, and placeholder substitution.  
    - Input Connections: Connected from *OpenRouter Chat Model2*.  
    - Output Connections: Sends HTML text to *Merge* node.  
    - Edge Cases: Malformed HTML output possible if LLM deviates from prompt instructions.

---

#### 2.5 Data Merging and Final Output Formatting

- **Overview:** Combines the structured JSON analysis and the HTML report into a single aggregated output for delivery or further processing.  
- **Nodes Involved:**  
  - *Merge*  
  - *Aggregate*  
  - *Set Output*

- **Node Details:**

  - **Merge**  
    - Type: Merge  
    - Role: Joins outputs from *Return Structured Analysis* (JSON) and *Return HTML Report* (HTML).  
    - Configuration: Default merge mode, combining the two input streams.  
    - Input Connections: Receives from *Return Structured Analysis* (main output 0), and *Return HTML Report* (main output 1).  
    - Output Connections: Connects to *Aggregate* node.  
    - Edge Cases: Data misalignment if outputs do not correspond correctly.  

  - **Aggregate**  
    - Type: Aggregate  
    - Role: Aggregates all merged data items into a single JSON object for coherent output.  
    - Configuration: Aggregates all item data.  
    - Input Connections: Receives from *Merge*.  
    - Output Connections: Connects to *Set Output*.  
    - Edge Cases: Large data payloads may increase execution time.  

  - **Set Output**  
    - Type: Set  
    - Role: Extracts and assigns individual key fields (e.g., company name, scores, policies, certifications, HTML report) into final output variables.  
    - Configuration:  
      - Assigns named variables with expressions to pull data from aggregated JSON.  
    - Input Connections: Receives from *Aggregate*.  
    - Output Connections: None (final node).  
    - Edge Cases: Missing expected fields in input data could cause empty outputs.

---

### 3. Summary Table

| Node Name                  | Node Type                            | Functional Role                     | Input Node(s)                | Output Node(s)                  | Sticky Note                                                                                                                      |
|----------------------------|------------------------------------|-----------------------------------|-----------------------------|--------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| When Executed by Another Workflow | Execute Workflow Trigger           | Entry point receiving companyName | None                        | Trigger Research Agent         | Validates non-empty company name input; passes to Research Agent                                                                 |
| Trigger Research Agent      | Execute Workflow                   | Executes multi-source research sub-workflow | When Executed by Another Workflow | Return Structured Analysis, Return HTML Report | Multi-source data collection hub; requires subworkflow setup from https://creators.n8n.io/workflows/5588                         |
| OpenRouter Chat Model       | Langchain OpenRouter Chat Model    | Generates structured JSON analysis | Trigger Research Agent       | Structured Output Parser, Return Structured Analysis | JSON Analysis Engine; schema-based scoring and structured output                                                                |
| Structured Output Parser    | Langchain Structured Output Parser | Validates and fixes JSON output    | OpenRouter Chat Model        | Return Structured Analysis      | Validates output against detailed JSON schema                                                                                   |
| Return Structured Analysis  | Langchain Chain LLM                | Finalizes structured JSON output  | OpenRouter Chat Model, Structured Output Parser | Merge                         |                                                                                                                                |
| OpenRouter Chat Model2      | Langchain OpenRouter Chat Model    | Generates narrative HTML report    | Trigger Research Agent       | Return HTML Report              | Report Generation Engine; creates HTML formatted summary                                                                         |
| Return HTML Report          | Langchain Chain LLM                | Formats and outputs HTML report    | OpenRouter Chat Model2       | Merge                         |                                                                                                                                |
| Merge                      | Merge                             | Combines JSON analysis and HTML report | Return Structured Analysis, Return HTML Report | Aggregate                    | Final output combiner; combines structured data with narrative                                                                   |
| Aggregate                  | Aggregate                        | Aggregates merged data items       | Merge                       | Set Output                    |                                                                                                                                |
| Set Output                 | Set                              | Assigns final output variables     | Aggregate                   | None                         |                                                                                                                                |
| Sticky Note                | Sticky Note                      | Documentation note                 | None                        | None                         | Company Sustainability Assessment Workflow overview                                                                             |
| Sticky Note1               | Sticky Note                      | Documentation note                 | None                        | None                         | Multi-Source Research Agent instructions and prerequisite                                                                        |
| Sticky Note2               | Sticky Note                      | Documentation note                 | None                        | None                         | LLM Chain 1: Structured Scoring explanation                                                                                      |
| Sticky Note3               | Sticky Note                      | Documentation note                 | None                        | None                         | LLM Chain 2: HTML Report explanation                                                                                             |
| Sticky Note4               | Sticky Note                      | Documentation note                 | None                        | None                         | Merge & Aggregate explanation                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Node**  
   - Add **Execute Workflow Trigger** node named *When Executed by Another Workflow*.  
   - Configure one workflow input parameter: `companyName` (string).  
   - No credentials needed.

2. **Add Research Agent Executor**  
   - Add **Execute Workflow** node named *Trigger Research Agent*.  
   - Configure to call the external research sub-workflow (ID: `k053fXGjIF7dUIQZ`).  
   - Map input: set `chatInput` parameter with a detailed research prompt embedding `{{ $json.companyName }}` dynamically.  
   - Generate `sessionId` dynamically for each run.  
   - Connect input from *When Executed by Another Workflow*.  
   - Ensure the sub-workflow is imported and configured beforehand (https://creators.n8n.io/workflows/5588).

3. **Add LLM Node for Structured Analysis**  
   - Add **Langchain OpenRouter Chat Model** node named *OpenRouter Chat Model*.  
   - Select model: `google/gemini-2.5-flash`.  
   - Configure with valid OpenRouter API credentials.  
   - Connect input from *Trigger Research Agent* output.  

4. **Add Structured Output Parser**  
   - Add **Langchain Structured Output Parser** node named *Structured Output Parser*.  
   - Provide manual JSON schema for company sustainability assessment (as specified in the workflow).  
   - Enable `autoFix` option for robust parsing.  
   - Connect input from *OpenRouter Chat Model* output.

5. **Add Chain LLM for Structured Analysis Output**  
   - Add **Langchain Chain LLM** node named *Return Structured Analysis*.  
   - Set input text to `={{ $json.output }}` from parser output.  
   - Use a detailed prompt guiding scoring and assessment generation.  
   - Connect inputs from both *OpenRouter Chat Model* and *Structured Output Parser*.  
   - Connect output to *Merge* node.

6. **Add LLM Node for HTML Report Generation**  
   - Add **Langchain OpenRouter Chat Model** node named *OpenRouter Chat Model2*.  
   - Select model: `anthropic/claude-sonnet-4`.  
   - Use same OpenRouter API credentials.  
   - Connect input from *Trigger Research Agent*.  

7. **Add Chain LLM for HTML Report**  
   - Add **Langchain Chain LLM** node named *Return HTML Report*.  
   - Use a prompt instructing generation of a well-structured HTML report with placeholders dynamically filled.  
   - Connect input from *OpenRouter Chat Model2*.  
   - Connect output to *Merge* node.

8. **Add Merge Node**  
   - Add **Merge** node named *Merge*.  
   - Connect two inputs:  
     - Input 1: from *Return Structured Analysis*.  
     - Input 2: from *Return HTML Report*.  

9. **Add Aggregate Node**  
   - Add **Aggregate** node named *Aggregate*.  
   - Configure to aggregate all item data into one object.  
   - Connect input from *Merge*.  

10. **Add Set Node for Final Output**  
    - Add **Set** node named *Set Output*.  
    - Configure assignments to extract and rename key data fields from aggregated input, e.g.:  
      - Company Name, Company Type, Environmental Policy, Carbon Emissions Report Link, Animal Welfare Policy, Vegan Options, Certifications, Ratings, Scores, Overall Grade, Sources, Overall Assessments, and final HTML Report.  
    - Connect input from *Aggregate*.  

11. **Add Sticky Notes for Documentation** (Optional but recommended)  
    - Create sticky notes describing each block’s purpose, prerequisites, and instructions.  
    - Include links to sub-workflows and prompt references.

12. **Configure Credentials**  
    - Ensure OpenRouter API credentials are set up and linked to the respective LLM nodes.  
    - Validate sub-workflow credentials for research agent if applicable.

13. **Test the Workflow**  
    - Trigger the workflow via the entry node with a valid company name string.  
    - Verify outputs: structured JSON and HTML report.  
    - Handle errors related to missing data, API limits, or parsing failures as needed.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                  | Context or Link                                      |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| Multi-Source Research Agent sub-workflow must be downloaded and installed separately for this workflow to function correctly.                                                                                                  | https://creators.n8n.io/workflows/5588               |
| This workflow uses advanced LLM models via OpenRouter API including Google Gemini 2.5 Flash and Anthropic Claude Sonnet 4 for scoring and report generation respectively.                                                       | OpenRouter AI API                                    |
| The structured output parser relies on a comprehensive JSON schema ensuring data consistency and enabling automation-ready outputs for ESG evaluation and reporting.                                                          | Internal workflow JSON schema                        |
| The HTML report output is designed to be embedded in email or web portals for clear stakeholder communication with formatting tags specified in the prompt.                                                                     | HTML5 report formatting prompt                       |
| Sticky notes within the workflow provide contextual documentation and setup instructions, improving maintainability and onboarding for new users or automation agents.                                                        | See Sticky Notes nodes in workflow                   |
| The workflow is suitable for ESG screening, investment decision-making, compliance reporting, and consumer guidance applications requiring transparent sustainability assessments.                                            | Use case summary                                    |
| Ensure input validation upstream to avoid empty or invalid company names which can disrupt research and analysis stages.                                                                                                       | Input validation recommendation                      |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, a workflow automation tool. This process strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.