 Audit student degree progress in Google Sheets using OpenAI

https://n8nworkflows.xyz/workflows/-audit-student-degree-progress-in-google-sheets-using-openai-8093


#  Audit student degree progress in Google Sheets using OpenAI

### 1. Workflow Overview

This workflow automates auditing senior students’ degree progress using data stored in Google Sheets and AI-powered analysis via OpenAI. It reads student academic records, compares completed courses against predefined program requirements, generates a detailed audit summary specifying missing courses and credits, and writes this summary back to the Google Sheet.

Logical blocks:

- **1.1 Input Reception**: Manual trigger to start the workflow and retrieval of student data from Google Sheets.
- **1.2 AI Degree Audit Processing**: Uses LangChain nodes and OpenAI models to analyze degree progress and identify missing requirements.
- **1.3 Output Handling**: Parses AI output and updates Google Sheets with the audit results.
- **1.4 Setup Instructions**: Sticky notes provide guidance on setting up Google Sheets OAuth2 and OpenAI credentials.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview**: Initiates the workflow manually and fetches student data from the Google Sheets “Senior_data” tab for processing.
- **Nodes Involved**:  
  - When clicking ‘Execute workflow’  
  - Get Student Data1

- **Node Details**:

  1. **When clicking ‘Execute workflow’**  
     - Type: Manual Trigger  
     - Role: Entry point allowing manual workflow execution.  
     - Configuration: Default manual trigger without parameters.  
     - Inputs: None  
     - Outputs: Triggers the next node to fetch student data.  
     - Edge Cases: None typical; manual trigger requires user intervention to start.

  2. **Get Student Data1**  
     - Type: Google Sheets (OAuth2)  
     - Role: Reads all rows from the “Senior_data” worksheet in the configured Google Sheets document.  
     - Configuration:  
       - Document ID: Points to the specific Google Sheets document.  
       - Sheet Name: “Senior_data” (tab containing student records).  
       - Credentials: Google Sheets OAuth2 (configured separately).  
     - Inputs: Trigger from manual node.  
     - Outputs: Array of student records with fields like StudentID, Name, Program, Year, CompletedCourses.  
     - Edge Cases:  
       - Authentication failures if OAuth2 token expires or is invalid.  
       - Empty or malformed sheet data.  
       - Large datasets may cause timeouts or partial reads.

---

#### 1.2 AI Degree Audit Processing

- **Overview**: Processes each student record through an AI-powered agent that compares completed courses against hard-coded degree requirements, then produces a JSON-formatted list of missing courses and a summary.

- **Nodes Involved**:  
  - OpenAI Chat Model1  
  - Structured Output Parser1  
  - Degree Audit Agent

- **Node Details**:

  1. **OpenAI Chat Model1**  
     - Type: LangChain OpenAI Chat Model  
     - Role: Provides AI language model capabilities to power the degree audit assistant.  
     - Configuration:  
       - Model: “gpt-5” (latest generation model)  
       - Credentials: OpenAI API key credential.  
     - Inputs: Receives prompt from Degree Audit Agent.  
     - Outputs: AI-generated text response (JSON structured).  
     - Edge Cases:  
       - API key invalid or rate limited.  
       - Model response timeout or errors.  
       - Unexpected output format.

  2. **Structured Output Parser1**  
     - Type: LangChain Structured Output Parser  
     - Role: Parses AI text output into structured JSON data based on a defined schema example.  
     - Configuration: JSON schema example includes fields StudentID, Program, Missing (array), Summary (string).  
     - Inputs: Raw AI response text from OpenAI Chat Model.  
     - Outputs: Parsed JSON object with audit results.  
     - Edge Cases:  
       - Parsing failure if AI output deviates from expected format.  
       - Schema mismatches or missing fields.

  3. **Degree Audit Agent**  
     - Type: LangChain Agent  
     - Role: Orchestrates prompt creation for AI, incorporating student data and hard-coded program rules, and requests structured output.  
     - Configuration:  
       - Prompt template dynamically injects StudentID, Name, Program, Year, Completed Courses.  
       - System message defines the degree audit logic, hard-coded program requirements, and precise output rules (JSON array format).  
       - Output parser attached for structured results.  
       - AI language model linked to OpenAI Chat Model1.  
     - Inputs: Receives student data item by item (from Get Student Data1).  
     - Outputs: JSON audit results for each student.  
     - Edge Cases:  
       - Template expression failures if data fields missing.  
       - AI misunderstanding the system message or output rules.  
       - Large input strings could exceed model limits.

---

#### 1.3 Output Handling

- **Overview**: Takes the parsed audit results and appends or updates the Google Sheet with the AI-generated summaries per student.

- **Nodes Involved**:  
  - Add Student Degree Summary

- **Node Details**:

  1. **Add Student Degree Summary**  
     - Type: Google Sheets (OAuth2)  
     - Role: Updates “Senior_data” sheet by adding or updating each student’s “AI Degree Summary” column with the audit summary text.  
     - Configuration:  
       - Document ID and Sheet name same as input node.  
       - Operation: appendOrUpdate based on matching StudentID column.  
       - Mapping: Adds two columns: StudentID and AI Degree Summary (from AI output Summary field).  
       - Credentials: Google Sheets OAuth2.  
     - Inputs: Receives structured JSON output from Degree Audit Agent.  
     - Outputs: Confirmation of Google Sheets update.  
     - Edge Cases:  
       - Authentication errors.  
       - Data mismatch or duplicate StudentIDs causing update conflicts.  
       - Google Sheets API limits or write failures.

---

#### 1.4 Setup Instructions (Sticky Notes)

- **Overview**: Provides user guidance on configuring credentials and spreadsheet setup.

- **Nodes Involved**:  
  - Sticky Note5  
  - Sticky Note57  
  - Sticky Note68  
  - Sticky Note69

- **Node Details**:

  1. **Sticky Note5**  
     - Content: Setup steps for Google Sheets OAuth2 and OpenAI API key, plus contact/credits info.  
     - Role: User instructions on credential creation and sheet preparation.

  2. **Sticky Note57**  
     - Content: High-level description of workflow purpose: AI-powered degree audit reading Google Sheets, analyzing courses, summarizing missing requirements.  
     - Role: Workflow purpose and overview.

  3. **Sticky Note68**  
     - Content: Detailed instructions to connect Google Sheets via OAuth2, select spreadsheet and worksheets (data, lookup, render pivot).  
     - Link: Google Sheets example URL.  
     - Role: Help with Google Sheets node configuration.

  4. **Sticky Note69**  
     - Content: Instructions to connect OpenAI API key and select a vision-capable chat model (e.g., gpt-4o, gpt-5).  
     - Role: Help with OpenAI node configuration.

---

### 3. Summary Table

| Node Name                  | Node Type                                | Functional Role                       | Input Node(s)             | Output Node(s)            | Sticky Note                                                                                                       |
|----------------------------|----------------------------------------|-------------------------------------|---------------------------|---------------------------|------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                         | Manual start of workflow             | None                      | Get Student Data1          |                                                                                                                  |
| Get Student Data1           | Google Sheets (OAuth2)                  | Read student data from sheet         | When clicking ‘Execute workflow’ | Degree Audit Agent         | Sticky Note68 (Google Sheets connection instructions)                                                            |
| Degree Audit Agent          | LangChain Agent                        | AI degree audit processing           | Get Student Data1          | Add Student Degree Summary | Sticky Note57 (workflow overview), Sticky Note69 (OpenAI connection instructions)                                |
| OpenAI Chat Model1          | LangChain OpenAI Chat Model             | AI language model query               | Degree Audit Agent (ai_languageModel) | Degree Audit Agent (ai_languageModel) | Sticky Note69 (OpenAI connection instructions)                                                                    |
| Structured Output Parser1   | LangChain Structured Output Parser      | Parse AI response into JSON           | OpenAI Chat Model1 (ai_outputParser) | Degree Audit Agent (ai_outputParser) |                                                                                                                  |
| Add Student Degree Summary  | Google Sheets (OAuth2)                  | Update Google Sheet with audit summary | Degree Audit Agent         | None                      | Sticky Note68 (Google Sheets connection instructions)                                                            |
| Sticky Note5               | Sticky Note                            | Setup instructions                    | None                      | None                      | Sticky Note5 (setup instructions, contact info)                                                                   |
| Sticky Note57              | Sticky Note                            | Workflow overview                     | None                      | None                      | Sticky Note57 (workflow overview)                                                                                  |
| Sticky Note68              | Sticky Note                            | Google Sheets setup instructions     | None                      | None                      | Sticky Note68 (Google Sheets connection instructions with example link: https://docs.google.com/spreadsheets/d/10IMnD8JhiR4lTlNFQTG_Auopg8haAiEt3_G9EKWTqLw/edit?gid=1466231493#gid=1466231493) |
| Sticky Note69              | Sticky Note                            | OpenAI setup instructions            | None                      | None                      | Sticky Note69 (OpenAI connection instructions)                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: When clicking ‘Execute workflow’  
   - Type: Manual Trigger  
   - Purpose: To manually start the workflow.

2. **Add Google Sheets Node to Read Student Data**  
   - Name: Get Student Data1  
   - Type: Google Sheets (OAuth2)  
   - Credentials: Configure Google Sheets OAuth2 credential (see step 7 below).  
   - Document ID: Use your Google Sheets document ID containing student data.  
   - Sheet Name: “Senior_data” (or your student data tab).  
   - Operation: Read all rows.  
   - Connect input from manual trigger node.

3. **Add LangChain Agent Node for Degree Audit**  
   - Name: Degree Audit Agent  
   - Type: LangChain Agent  
   - Configuration:  
     - Prompt text template:  
       ```
       =student:  {{ $json.StudentID }}, Name: {{ $json.Name }}, Program: {{ $json.Program }} Year: {{ $json.Year }} Completed Courses: {{ $json.CompletedCourses }}
       ```  
     - System message: Copy the hard-coded program requirements and output rules exactly as provided in the original workflow. This includes detailed course requirements for all supported programs and clear instructions for JSON output formatting.  
     - Enable output parser (attach Structured Output Parser node).  
   - Connect input from “Get Student Data1” node.

4. **Add LangChain OpenAI Chat Model Node**  
   - Name: OpenAI Chat Model1  
   - Type: LangChain OpenAI Chat Model  
   - Model: Select “gpt-5” or equivalent latest vision-capable model.  
   - Credentials: Configure OpenAI API key credential (see step 8 below).  
   - Connect as AI language model input to Degree Audit Agent node.

5. **Add LangChain Structured Output Parser Node**  
   - Name: Structured Output Parser1  
   - Type: LangChain Structured Output Parser  
   - JSON Schema Example: Provide the example JSON schema used in the original workflow, containing fields: StudentID (string), Program (string), Missing (array of strings), Summary (string).  
   - Connect AI output parser input to OpenAI Chat Model node.  
   - Connect output parser to Degree Audit Agent node.

6. **Add Google Sheets Node to Update Degree Summary**  
   - Name: Add Student Degree Summary  
   - Type: Google Sheets (OAuth2)  
   - Credentials: Use the same Google Sheets OAuth2 credential as before.  
   - Document ID: Same as input node.  
   - Sheet Name: “Senior_data” (or your student data tab).  
   - Operation: Append or update rows matching on “StudentID”.  
   - Column Mapping:  
     - StudentID: `={{ $json.output.StudentID }}`  
     - AI Degree Summary: `={{ $json.output.Summary }}`  
   - Connect input from Degree Audit Agent node.

7. **Configure Google Sheets OAuth2 Credential**  
   - Go to n8n credentials section.  
   - Create new Google Sheets OAuth2 credential.  
   - Authenticate with your Google account and grant access to required spreadsheets.  
   - Assign this credential in all Google Sheets nodes.

8. **Configure OpenAI API Credential**  
   - Go to n8n credentials section.  
   - Create new OpenAI API credential.  
   - Paste your OpenAI API key.  
   - Assign this credential in the OpenAI Chat Model node.

9. **Optional: Add Sticky Notes with Setup Instructions**  
   - Create sticky notes with summaries about credential setup, Google Sheets tabs, and AI model selection for user reference.

10. **Test Workflow Execution**  
    - Manually trigger the workflow.  
    - Verify student data is read correctly.  
    - Confirm AI outputs JSON audit summaries per student.  
    - Check Google Sheets updates have been applied with the AI Degree Summary column filled.

---

### 5. General Notes & Resources

| Note Content                                                                                                                         | Context or Link                                                                                                     |
|--------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| Workflow runs an AI-powered degree audit comparing student course completions to hard-coded program requirements in a Google Sheet. | General purpose and logic overview (Sticky Note57).                                                                |
| Google Sheets OAuth2 setup: Create credential in n8n, sign in, select spreadsheet and worksheet tabs (“data”, “Lookup”, “render pivot”). | Setup instructions (Sticky Note68). https://docs.google.com/spreadsheets/d/10IMnD8JhiR4lTlNFQTG_Auopg8haAiEt3_G9EKWTqLw/edit?gid=1466231493#gid=1466231493 |
| OpenAI API setup: Create OpenAI API credential in n8n, paste API key, select vision-capable chat model like gpt-5 or gpt-4o-mini.      | Setup instructions (Sticky Note69).                                                                                 |
| Contact & Credits: Robert Breen, rbreen@ynteractive.com, LinkedIn: https://www.linkedin.com/in/robert-breen-29429625/, ynteractive.com | Provided in Sticky Note5.                                                                                            |

---

**Disclaimer:** The text provided here originates exclusively from an automated workflow created with n8n, an integration and automation tool. This treatment strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data are legal and public.