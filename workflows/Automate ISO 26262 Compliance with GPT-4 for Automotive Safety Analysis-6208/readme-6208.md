Automate ISO 26262 Compliance with GPT-4 for Automotive Safety Analysis

https://n8nworkflows.xyz/workflows/automate-iso-26262-compliance-with-gpt-4-for-automotive-safety-analysis-6208


# Automate ISO 26262 Compliance with GPT-4 for Automotive Safety Analysis

---

### 1. Workflow Overview

This workflow automates the process of ISO 26262 compliance for automotive safety analysis by leveraging GPT-4 AI models to assist functional safety engineers in hazard analysis, risk estimation, and mitigation strategy generation. It is designed for automotive safety teams aiming to streamline Hazard Analysis and Risk Assessment (HARA) tasks aligned with ISO 26262 standards.

The workflow logically divides into the following blocks:

- **1.1 Input Reception and Preprocessing:** Handles manual trigger and ingestion of system description text files.
- **1.2 Hazard Identification and Initial AI Analysis:** Uses AI to extract hazards, root causes, and relevant ISO clauses from the system description.
- **1.3 Risk Estimation and AI Assessment:** Processes the identified hazards to estimate severity, exposure, and controllability (S/E/C) ratings and derive ASIL classifications.
- **1.4 Mitigation Strategy Generation:** Uses ASIL-rated hazards to generate technical and process mitigation strategies compliant with ISO 26262.
- **1.5 File Writing and Data Conversion:** Manages file read/write operations and data transformations between AI nodes and storage.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Preprocessing

**Overview:**  
This block initiates the workflow manually and reads the system description input file, converting it to a format suitable for AI processing.

**Nodes Involved:**  
- When clicking ‘Execute workflow’  
- Read Systems_Description  
- Convert input to binary data

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Entry point; triggers the workflow execution manually.  
  - *Configuration:* Default manual trigger.  
  - *Connections:* Output → Read Systems_Description.  
  - *Failure Modes:* None; manual trigger.  

- **Read Systems_Description**  
  - *Type:* Read/Write File  
  - *Role:* Reads the system description text file from `/data/inputs/1_hazard_identification/systems_description.txt`.  
  - *Configuration:* Reads file without appending; outputs full content.  
  - *Connections:* Output → Convert input to binary data.  
  - *Failure Modes:* File not found, permission errors.  

- **Convert input to binary data**  
  - *Type:* Extract From File  
  - *Role:* Converts the file content into text string suitable for AI input.  
  - *Configuration:* Operation set to "text".  
  - *Connections:* Output → AI Agent.  
  - *Failure Modes:* File content encoding errors, empty content.  

---

#### 2.2 Hazard Identification and Initial AI Analysis

**Overview:**  
Using the system description, this block extracts potential hazards, their root causes, and relevant ISO 26262 clauses through GPT-4 powered AI analysis.

**Nodes Involved:**  
- AI Agent  
- Convert to File  
- Potential_risks_report.txt  
- Convert input to binary data1

**Node Details:**

- **AI Agent**  
  - *Type:* LangChain Agent (GPT-4)  
  - *Role:* Analyzes system description text to identify:  
    1. Five potential hazards  
    2. Likely root causes  
    3. Relevant ISO 26262 clauses  
  - *Configuration:*  
    - Custom prompt dynamically constructed from input file text.  
    - System message sets role as "helpful FuSA assistant".  
    - Uses defined prompt type with output parser enabled.  
  - *Connections:* Output → Convert to File.  
  - *Variables:* Uses expression `{{ $json.data }}.binary.data.toString('utf-8')` to process input text.  
  - *Failure Modes:* API auth issues, rate limits, prompt formatting errors, empty or malformed input.  

- **Convert to File**  
  - *Type:* Convert To File  
  - *Role:* Converts AI Agent output text into a file format for storage.  
  - *Configuration:* Operation "toText", source property "output".  
  - *Connections:* Output → Potential_risks_report.txt.  
  - *Failure Modes:* Output missing or invalid data.  

- **Potential_risks_report.txt**  
  - *Type:* Read/Write File  
  - *Role:* Writes the hazard identification report to a timestamped file under `/data/outputs/1_hazard_identification/`.  
  - *Configuration:* File name dynamically uses current timestamp. Overwrites existing files.  
  - *Connections:* Output → Convert input to binary data1.  
  - *Failure Modes:* File system permission errors, disk space issues.  

- **Convert input to binary data1**  
  - *Type:* Extract From File  
  - *Role:* Reads the newly written hazard report as text for the next AI processing step.  
  - *Configuration:* Operation "text".  
  - *Connections:* Output → AI Agent1.  
  - *Failure Modes:* File read errors, empty file.  

---

#### 2.3 Risk Estimation and AI Assessment

**Overview:**  
This block analyzes the identified hazards, rating their Severity (S), Exposure (E), Controllability (C), and determining ASIL classification according to ISO 26262.

**Nodes Involved:**  
- AI Agent1  
- Convert to File1  
- Update_risk_estimation_report  
- Convert input to binary data2

**Node Details:**

- **AI Agent1**  
  - *Type:* LangChain Agent (GPT-4)  
  - *Role:* Acts as a functional safety expert to estimate risk parameters (S/E/C) and ASIL levels from hazard list.  
  - *Configuration:*  
    - Includes detailed prompt with definitions for S, E, C scales and ASIL output format.  
    - System message instructs role as functional safety expert with detailed task scope.  
    - Output parser enabled.  
  - *Connections:* Output → Convert to File1.  
  - *Variables:* Uses expression embedding hazard list from input JSON.  
  - *Failure Modes:* Input data formatting issues, AI API limits, unexpected output structure.  

- **Convert to File1**  
  - *Type:* Convert To File  
  - *Role:* Converts risk estimation results into file format for saving.  
  - *Configuration:* Operation "toText", source property "output".  
  - *Connections:* Output → Update_risk_estimation_report.  
  - *Failure Modes:* Conversion failures.  

- **Update_risk_estimation_report**  
  - *Type:* Read/Write File  
  - *Role:* Writes risk estimation report to a timestamped file under `/data/outputs/2_risk_estimation/`.  
  - *Configuration:* Overwrites file if exists, dynamic filename with timestamp.  
  - *Connections:* Output → Convert input to binary data2.  
  - *Failure Modes:* File write errors, disk space issues.  

- **Convert input to binary data2**  
  - *Type:* Extract From File  
  - *Role:* Reads the risk estimation report text for the mitigation strategy generation step.  
  - *Configuration:* Operation "text".  
  - *Connections:* Output → AI Agent2.  
  - *Failure Modes:* File read errors, empty content.  

---

#### 2.4 Mitigation Strategy Generation

**Overview:**  
Generates ISO 26262-compliant mitigation strategies for the ASIL-rated hazards, covering both technical and process controls.

**Nodes Involved:**  
- AI Agent2  
- Convert to File2  
- Risks_mitigation.txt

**Node Details:**

- **AI Agent2**  
  - *Type:* LangChain Agent (GPT-4)  
  - *Role:* Functional Safety Engineer role to generate mitigation strategies per hazard with ISO clause references and rationale.  
  - *Configuration:*  
    - Prompt includes detailed rules for mitigation design based on ASIL levels, mitigation types, ISO clauses, output format in markdown.  
    - System message defines role and task clearly.  
    - Output parser enabled for structured results.  
  - *Connections:* Output → Convert to File2.  
  - *Variables:* Uses expression binding input JSON data for hazard list.  
  - *Failure Modes:* AI API errors, prompt complexity causing incomplete output.  

- **Convert to File2**  
  - *Type:* Convert To File  
  - *Role:* Converts mitigation strategy text output to file format.  
  - *Configuration:* Operation "toText", source property "output".  
  - *Connections:* Output → Risks_mitigation.txt.  
  - *Failure Modes:* Conversion errors.  

- **Risks_mitigation.txt**  
  - *Type:* Read/Write File  
  - *Role:* Writes the mitigation strategy report to a timestamped file under `/data/outputs/3_mitigation_strategy/`.  
  - *Configuration:* Overwrites existing files, dynamic timestamp in filename.  
  - *Connections:* None (end node).  
  - *Failure Modes:* File system errors.  

---

#### 2.5 File Writing and Data Conversion (Cross-block Support)

This cross-cutting functionality ensures proper data transformation between raw text files and AI node inputs/outputs. It involves nodes used repeatedly for conversion to/from file content and text strings to maintain compatibility and data integrity.

---

### 3. Summary Table

| Node Name                   | Node Type                        | Functional Role                                   | Input Node(s)                 | Output Node(s)                   | Sticky Note                                                                                   |
|-----------------------------|---------------------------------|-------------------------------------------------|------------------------------|---------------------------------|------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                  | Workflow entry point                             |                              | Read Systems_Description         |                                                                                                |
| Read Systems_Description     | Read/Write File                 | Reads system description input file              | When clicking ‘Execute workflow’ | Convert input to binary data      |                                                                                                |
| Convert input to binary data | Extract From File               | Converts file content to text for AI input       | Read Systems_Description      | AI Agent                        |                                                                                                |
| AI Agent                    | LangChain Agent (GPT-4)          | Hazard identification and root cause analysis   | Convert input to binary data  | Convert to File                 |                                                                                                |
| Convert to File             | Convert To File                 | Converts AI text output to file format            | AI Agent                     | Potential_risks_report.txt       |                                                                                                |
| Potential_risks_report.txt  | Read/Write File                 | Writes hazard identification report              | Convert to File              | Convert input to binary data1    |                                                                                                |
| Convert input to binary data1| Extract From File               | Reads hazard report text for risk estimation      | Potential_risks_report.txt    | AI Agent1                      |                                                                                                |
| AI Agent1                  | LangChain Agent (GPT-4)          | Risk estimation with S/E/C ratings and ASIL      | Convert input to binary data1 | Convert to File1                |                                                                                                |
| Convert to File1           | Convert To File                 | Converts risk estimation output to file format   | AI Agent1                    | Update_risk_estimation_report    |                                                                                                |
| Update_risk_estimation_report| Read/Write File                | Writes risk estimation report                      | Convert to File1             | Convert input to binary data2    |                                                                                                |
| Convert input to binary data2| Extract From File               | Reads risk estimation report text for mitigation | Update_risk_estimation_report | AI Agent2                    |                                                                                                |
| AI Agent2                  | LangChain Agent (GPT-4)          | Generates ISO 26262 mitigation strategies          | Convert input to binary data2 | Convert to File2                |                                                                                                |
| Convert to File2           | Convert To File                 | Converts mitigation strategy output to file       | AI Agent2                    | Risks_mitigation.txt             |                                                                                                |
| Risks_mitigation.txt       | Read/Write File                 | Writes mitigation strategy report                  | Convert to File2             |                                 |                                                                                                |
| A simple memory window     | Memory Buffer Window            | Maintains AI session memory context               | AI_Hazard_Analysis            | AI Agent, AI Agent1, AI Agent2  |                                                                                                |
| AI_Hazard_Analysis         | LM Chat OpenAI (GPT-4)          | Core GPT-4 model node providing AI responses      |                              | AI Agent, AI Agent1, AI Agent2  |                                                                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: Start workflow execution on demand.

2. **Create Read/Write File Node - "Read Systems_Description"**  
   - Configure to read text file from `/data/inputs/1_hazard_identification/systems_description.txt`.  
   - Connect output to next node.

3. **Create Extract From File Node - "Convert input to binary data"**  
   - Operation: Text  
   - Input: Output of "Read Systems_Description".  
   - Connect output to AI Agent node.

4. **Create LangChain Agent Node - "AI Agent"**  
   - Use OpenAI GPT-4 model (credential required).  
   - Prompt: Build dynamically from input text, asking for 5 hazards, root causes, relevant ISO clauses.  
   - System message: "You are a helpful FuSA assistant."  
   - Enable output parser.  
   - Connect output to Convert to File node.

5. **Create Convert To File Node - "Convert to File"**  
   - Operation: toText  
   - Source Property: output  
   - Connect output to file write node.

6. **Create Read/Write File Node - "Potential_risks_report.txt"**  
   - Write mode, filename `/data/outputs/1_hazard_identification/Report_Hazard Identification.txt_{{ $now.toString() }}`.  
   - Connect output to Extract From File node for next block.

7. **Create Extract From File Node - "Convert input to binary data1"**  
   - Operation: Text  
   - Input: Output of potential risks report write node.  
   - Connect output to next AI Agent.

8. **Create LangChain Agent Node - "AI Agent1"**  
   - Use GPT-4 with OpenAI credentials.  
   - Prompt: Detailed instructions for S (Severity), E (Exposure), C (Controllability) ratings and ASIL classification.  
   - System message: Functional Safety Expert role with rating definitions.  
   - Enable output parser.  
   - Connect output to convert to file node.

9. **Create Convert To File Node - "Convert to File1"**  
   - Operation: toText  
   - Source Property: output  
   - Connect output to risk estimation report write node.

10. **Create Read/Write File Node - "Update_risk_estimation_report"**  
    - Write mode, filename `/data/outputs/2_risk_estimation/Report_Risk_Estimation.txt_{{ $now.toString() }}`.  
    - Connect output to extract from file node.

11. **Create Extract From File Node - "Convert input to binary data2"**  
    - Operation: Text  
    - Input: Output of risk estimation report write node.  
    - Connect output to third AI Agent node.

12. **Create LangChain Agent Node - "AI Agent2"**  
    - Use GPT-4 with OpenAI credentials.  
    - Prompt: Generate mitigation strategies per ASIL with ISO 26262 clause references and rationale.  
    - System message: Functional Safety Engineer role, mitigation design rules, output format markdown.  
    - Enable output parser.  
    - Connect output to convert to file node.

13. **Create Convert To File Node - "Convert to File2"**  
    - Operation: toText  
    - Source Property: output  
    - Connect output to mitigation report write node.

14. **Create Read/Write File Node - "Risks_mitigation.txt"**  
    - Write mode, filename `/data/outputs/3_mitigation_strategy/Report_Risk_mitigation.txt_{{ $now.toString() }}`.  
    - End node.

15. **Create LM Chat OpenAI Node - "AI_Hazard_Analysis"**  
    - Model: GPT-4.1-mini  
    - Credentials: OpenAI API  
    - Connect ai_languageModel outputs to AI Agent, AI Agent1, AI Agent2 nodes as memory provider.

16. **Create Memory Buffer Window Node - "A simple memory window"**  
    - SessionKey: `={{ $execution.id }}`  
    - ContextWindowLength: 20  
    - Connect ai_memory outputs to AI Agent, AI Agent1, AI Agent2.

17. **Establish all connections as per the workflow:**  
    - Manual Trigger → Read Systems_Description → Convert input to binary data → AI Agent → Convert to File → Potential_risks_report.txt → Convert input to binary data1 → AI Agent1 → Convert to File1 → Update_risk_estimation_report → Convert input to binary data2 → AI Agent2 → Convert to File2 → Risks_mitigation.txt.

18. **Configure credentials:**  
    - OpenAI API credentials required for AI Agent, AI Agent1, AI Agent2, and AI_Hazard_Analysis nodes.  
    - File system access permissions for reading inputs and writing outputs.

19. **Set default values and constraints:**  
    - Ensure file paths exist and are writable.  
    - Timestamp formats use `$now.toString()` for uniqueness.  
    - Output parsers enabled on AI nodes for structured data extraction.

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                                                           |
|-----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Workflow automates ISO 26262 compliance processes using GPT-4 for automotive safety hazard analysis.      | Workflow purpose and use case.                                                                            |
| Prompts include detailed ISO 26262 clauses and ASIL definitions for precise AI-driven safety analysis.    | Ensures domain specificity and standard compliance within AI tasks.                                      |
| File paths are hardcoded to `/data/inputs/` and `/data/outputs/` directories; ensure these exist.         | Important for deployment environment setup.                                                              |
| AI output parsing enabled to structure GPT-4 responses into actionable reports.                            | Critical for reliable downstream processing and file generation.                                         |
| Memory buffer window node maintains session context across AI calls, improving coherence of analyses.     | Useful for multi-step AI interactions requiring context retention.                                       |
| OpenAI API credentials must have permissions for GPT-4 models and be configured in n8n.                   | Credential management essential for AI node functionality.                                               |
| Time-based dynamic file naming (`{{ $now.toString() }}`) ensures unique report versions for traceability. | Facilitates audit trails and report versioning in safety processes.                                      |

---

**Disclaimer:** The text provided originates solely from an automated workflow created with n8n, an integration and automation tool. The process strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.

---