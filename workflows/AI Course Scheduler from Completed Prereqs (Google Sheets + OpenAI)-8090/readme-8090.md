AI Course Scheduler from Completed Prereqs (Google Sheets + OpenAI)

https://n8nworkflows.xyz/workflows/ai-course-scheduler-from-completed-prereqs--google-sheets---openai--8090


# AI Course Scheduler from Completed Prereqs (Google Sheets + OpenAI)

---

### 1. Workflow Overview

This workflow automates the creation of personalized Fall 2025 course schedules for students based on their completed prerequisite courses. It reads student data from a Google Sheets spreadsheet, uses OpenAI’s GPT-4o chat model configured as a scheduling assistant agent to generate course selections that respect program constraints and prerequisites, then writes the resulting schedules back to a designated Google Sheets tab.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Data Retrieval**: Triggering the workflow and fetching student data from Google Sheets.
- **1.2 AI Scheduling Agent Processing**: Passing student data to an AI agent that applies course catalog rules and constraints to generate course schedules.
- **1.3 Output Parsing and Formatting**: Parsing the structured output from the AI agent and preparing data fields.
- **1.4 Google Sheets Output Management**: Clearing the output sheet and appending the new schedules.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Data Retrieval

**Overview:**  
Initiates the workflow manually and retrieves student data from a Google Sheets spreadsheet tab named "Sheet1" containing student records.

**Nodes Involved:**  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Get Student Data (Google Sheets)

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Role: Starts the workflow on user command.  
  - Config: No parameters.  
  - Inputs: None (trigger node).  
  - Outputs: Triggers "Get Student Data".  
  - Edge cases: User must manually trigger; no automatic scheduling.  
  - Notes: Ensures controlled execution.

- **Get Student Data**  
  - Type: Google Sheets  
  - Role: Reads input student data from Google Sheets tab "Sheet1".  
  - Config: Reads all rows from spreadsheet with ID "10IMnD8JhiR4lTlNFQTG_Auopg8haAiEt3_G9EKWTqLw", tab "Sheet1" (gid=0).  
  - Credentials: Google Sheets OAuth2 (account 3).  
  - Input: Trigger from Manual Trigger node.  
  - Output: Passes student data as JSON array to AI Scheduling Agent.  
  - Edge cases: OAuth2 token expiration or permission issues; empty or malformed sheet data may cause errors or unexpected AI input.

---

#### 2.2 AI Scheduling Agent Processing

**Overview:**  
Processes the student data through an OpenAI GPT-4o powered agent configured with a rich system prompt that includes a detailed course catalog and scheduling constraints. The agent generates a JSON array of course schedules per student.

**Nodes Involved:**  
- OpenAI Chat Model2 (Language Model)  
- Structured Output Parser (Output Parser)  
- Scheduling Agent (Agent)

**Node Details:**

- **OpenAI Chat Model2**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Provides GPT-4o language model interface for AI processing.  
  - Config: Model set to "gpt-4o" with no additional options.  
  - Credentials: OpenAI API key (account 4).  
  - Input: Connected to Scheduling Agent as languageModel input.  
  - Output: Passes AI-generated chat completions to Scheduling Agent.  
  - Edge cases: API key invalid, rate limits, model unavailability, or network timeouts.

- **Structured Output Parser**  
  - Type: LangChain Structured Output Parser  
  - Role: Parses AI response to a JSON schema example defining expected output structure.  
  - Config: Example JSON enforces fields: StudentID, Term, Selected (array of course strings), Rationale.  
  - Input: Connected as outputParser input to Scheduling Agent.  
  - Output: Provides structured JSON data for downstream nodes.  
  - Edge cases: AI output format deviations, parse errors, schema mismatches.

- **Scheduling Agent**  
  - Type: LangChain Agent  
  - Role: Coordinates AI prompt crafting and parses results.  
  - Config:  
    - System message defines detailed course catalog with prerequisites, terms offered, and constraints to produce exactly five courses per student totaling 15–17 credits.  
    - Input template uses JSON expressions to inject student fields (StudentID, Name, Program, Year, CompletedCourses).  
    - Logic enforces prerequisite AND conditions, term offerings, course categories, and fallback to Gen Eds if needed.  
  - Inputs: Receives student data from "Get Student Data", languageModel input from "OpenAI Chat Model2", outputParser from "Structured Output Parser".  
  - Outputs: JSON array of schedules per student, passed to "Split Schedule".  
  - Edge cases: Complex prompt may cause AI hallucination, incomplete adherence to constraints, or output parsing failures.

---

#### 2.3 Output Parsing and Formatting

**Overview:**  
Splits the AI-generated schedule array into individual student schedule entries and extracts key fields for writing back to Google Sheets.

**Nodes Involved:**  
- Split Schedule (Split Out)  
- Set Fields (Set)

**Node Details:**

- **Split Schedule**  
  - Type: Split Out  
  - Role: Splits the array of student schedules (field "output[0].Selected") into individual items for processing.  
  - Config: Splits on field "output[0].Selected", includes all other fields in output.  
  - Input: Receives AI JSON output from Scheduling Agent.  
  - Output: Produces one output per scheduled student’s course list.  
  - Edge cases: Empty or malformed array causes no outputs.

- **Set Fields**  
  - Type: Set  
  - Role: Extracts and maps student schedule fields to simplified output format suitable for Google Sheets.  
  - Config:  
    - Sets "StudentID" = first element of "output" array's StudentID.  
    - Sets "Schedule" = string representation of selected courses list.  
  - Input: From "Split Schedule".  
  - Output: Passes cleaned data to "Clear sheet1".  
  - Edge cases: Missing fields or index out of range if AI output is empty.

---

#### 2.4 Google Sheets Output Management

**Overview:**  
Prepares the Google Sheets output worksheet by clearing old data and appending the newly generated course schedules.

**Nodes Involved:**  
- Clear sheet1 (Google Sheets)  
- Append Schedule (Google Sheets)

**Node Details:**

- **Clear sheet1**  
  - Type: Google Sheets  
  - Role: Clears all existing data from the "schedule" tab (gid=572766543) before appending new data.  
  - Config: Operation: Clear on spreadsheet ID "10IMnD8JhiR4lTlNFQTG_Auopg8haAiEt3_G9EKWTqLw", tab "schedule".  
  - Credentials: Google Sheets OAuth2 (account 3).  
  - Input: From "Set Fields".  
  - Output: Triggers "Append Schedule".  
  - Edge cases: OAuth errors, sheet locked or unavailable.

- **Append Schedule**  
  - Type: Google Sheets  
  - Role: Appends each student's schedule data to the "schedule" tab.  
  - Config:  
    - Operation: Append.  
    - Columns: "StudentID" (string), "Schedule" (string), auto-mapped from incoming data.  
    - Target Sheet: "schedule" tab (gid=572766543).  
  - Credentials: Google Sheets OAuth2 (account 3).  
  - Input: From "Clear sheet1".  
  - Output: Workflow ends here.  
  - Edge cases: Append failures, data type mismatches.

---

### 3. Summary Table

| Node Name                   | Node Type                           | Functional Role                        | Input Node(s)                  | Output Node(s)               | Sticky Note                                                                                                                                                                                                                             |
|-----------------------------|-----------------------------------|-------------------------------------|-------------------------------|------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger                   | Workflow start trigger               | None                          | Get Student Data              |                                                                                                                                                                                                                                       |
| Get Student Data             | Google Sheets                     | Reads student data from Google Sheets| When clicking ‘Execute workflow’ | Scheduling Agent             | ### 1) Connect Google Sheets (OAuth2) 1. In **n8n → Credentials → New → Google Sheets (OAuth2)**  2. Sign in with your Google account and grant access  3. In each Google Sheets node, select your Spreadsheet and the appropriate Worksheet: **data** (raw spend), **Lookup** (channel reference table), **render pivot** (output tab) https://docs.google.com/spreadsheets/d/10IMnD8JhiR4lTlNFQTG_Auopg8haAiEt3_G9EKWTqLw/edit?gid=572766543#gid=572766543 |
| OpenAI Chat Model2           | LangChain OpenAI Chat Model       | Provides GPT-4o model for AI processing| Scheduling Agent (ai_languageModel) | Scheduling Agent            | ### 3) Connect OpenAI (API Key) 1. In **n8n → Credentials → New → OpenAI API**  2. Paste your **OpenAI API key**  3. In **OpenAI Chat Model**, select your credential and a **vision-capable** chat model (e.g., `gpt-4o-mini`, `gpt-4o`, or your configured vision model) |
| Structured Output Parser     | LangChain Output Parser Structured| Parses AI JSON output into structured data| Scheduling Agent (ai_outputParser) | Scheduling Agent            |                                                                                                                                                                                                                                       |
| Scheduling Agent            | LangChain Agent                   | AI assistant applying scheduling logic| Get Student Data, OpenAI Chat Model2, Structured Output Parser | Split Schedule               |                                                                                                                                                                                                                                       |
| Split Schedule              | Split Out                        | Splits array of course selections into individual entries| Scheduling Agent              | Set Fields                   |                                                                                                                                                                                                                                       |
| Set Fields                 | Set                              | Maps AI output fields to simplified fields for Google Sheets| Split Schedule               | Clear sheet1                 |                                                                                                                                                                                                                                       |
| Clear sheet1               | Google Sheets                     | Clears existing schedule tab content| Set Fields                   | Append Schedule              |                                                                                                                                                                                                                                       |
| Append Schedule             | Google Sheets                     | Appends new schedules to Google Sheets tab| Clear sheet1                 | None                        |                                                                                                                                                                                                                                       |
| Sticky Note66               | Sticky Note                      | Instruction for OpenAI API key setup| None                         | None                        | ### 3) Connect OpenAI (API Key) 1. In **n8n → Credentials → New → OpenAI API**  2. Paste your **OpenAI API key**  3. In **OpenAI Chat Model**, select your credential and a **vision-capable** chat model (e.g., `gpt-4o-mini`, `gpt-4o`, or your configured vision model) |
| Sticky Note67               | Sticky Note                      | Instruction for Google Sheets OAuth2 setup| None                         | None                        | ### 1) Connect Google Sheets (OAuth2) 1. In **n8n → Credentials → New → Google Sheets (OAuth2)**  2. Sign in with your Google account and grant access  3. In each Google Sheets node, select your **Spreadsheet** and the appropriate **Worksheet**: - **data** (raw spend)  - **Lookup** (channel reference table)  - **render pivot** (output tab) https://docs.google.com/spreadsheets/d/10IMnD8JhiR4lTlNFQTG_Auopg8haAiEt3_G9EKWTqLw/edit?gid=572766543#gid=572766543 |
| Sticky Note56               | Sticky Note                      | Workflow overview and description   | None                         | None                        | ### 🎓 AI Course Scheduler from Completed Prereqs (Google Sheets + OpenAI) Create a **Fall 2025 course schedule** for each student based on what they’ve already completed, catalog prerequisites, and term availability (Fall/Both). Reads students from Google Sheets → asks an AI agent to select **exactly 5 courses** (target **15–17 credits**, no duplicates, prereqs enforced) → appends each student’s schedule to a **schedule** tab. |
| Sticky Note4                | Sticky Note                      | Setup instructions for Google Sheets and OpenAI | None                         | None                        | ### ⚙️ Setup (only 2 steps) 1) Connect Google Sheets (OAuth2) - In **n8n → Credentials → New → Google Sheets (OAuth2)**, sign in and grant access  - In the Google Sheets nodes, select your spreadsheet and these tabs:  - **Sheet1** (input students)  - **schedule** (output) > Example spreadsheet (replace with your own):  - Input: `.../edit#gid=0`  - Output: `.../edit#gid=572766543` 2) Connect OpenAI (API Key) - In **n8n → Credentials → New → OpenAI API**, paste your key  - In the **OpenAI Chat Model** node, select that credential and a chat model (e.g., `gpt-4o`) - 📧 **rbreen@ynteractive.com**  - 🔗 **Robert Breen** — https://www.linkedin.com/in/robert-breen-29429625/  - 🌐 **ynteractive.com** — https://ynteractive.com |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: `When clicking ‘Execute workflow’`  
   - Type: Manual Trigger  
   - No parameters needed.

2. **Add Google Sheets Node to Read Student Data**  
   - Name: `Get Student Data`  
   - Type: Google Sheets  
   - Operation: Read rows  
   - Spreadsheet ID: `10IMnD8JhiR4lTlNFQTG_Auopg8haAiEt3_G9EKWTqLw` (replace with your own)  
   - Sheet Name / Tab: `Sheet1` (gid=0)  
   - Credential: Configure Google Sheets OAuth2 credential with access to your spreadsheet.

3. **Add OpenAI Chat Model Node**  
   - Name: `OpenAI Chat Model2`  
   - Type: LangChain OpenAI Chat Model  
   - Model: Select "gpt-4o" or another vision-capable GPT-4 variant  
   - Credential: Configure OpenAI API key credential.

4. **Add Structured Output Parser Node**  
   - Name: `Structured Output Parser`  
   - Type: LangChain Output Parser Structured  
   - JSON Schema Example:  
     ```json
     [
       {
         "StudentID": "S001",
         "Term": "Fall 2025",
         "Selected": [
           "CS-201 | Computer Systems | 3",
           "CS-220 | Databases | 3",
           "CS-210 | Web Development | 3",
           "GEN-107 | Introduction to Sociology | 3",
           "GEN-109 | Environmental Science | 4"
         ],
         "Rationale": "Student met prerequisites for sophomore-level Computer Science courses and added two Gen Eds for balance."
       }
     ]
     ```

5. **Add LangChain Agent Node**  
   - Name: `Scheduling Agent`  
   - Type: LangChain Agent  
   - System Message: Paste the detailed course catalog, constraints, input/output specification, and implementation notes exactly as in the original prompt for the AI agent.  
   - Input Template: Use expressions to inject student fields:  
     ```
     =
         "StudentID": "{{$json.StudentID}}",
         "Name": "{{$json.Name}}",
         "Program": "{{$json.Program}}",
         "Year": "{{$json.Year}}",
         "CompletedCourses": "{{$json.CompletedCourses}}"
     ```
   - Connect `OpenAI Chat Model2` as languageModel input node.  
   - Connect `Structured Output Parser` as outputParser node.

6. **Connect Nodes for AI Processing**  
   - Connect `Get Student Data` to `Scheduling Agent` main input.  
   - Connect `OpenAI Chat Model2` to `Scheduling Agent` languageModel input.  
   - Connect `Structured Output Parser` to `Scheduling Agent` outputParser input.

7. **Add Split Out Node to Split AI Output**  
   - Name: `Split Schedule`  
   - Type: Split Out  
   - Field to Split: `output[0].Selected`  
   - Include all other fields.

8. **Add Set Node to Map Fields**  
   - Name: `Set Fields`  
   - Type: Set  
   - Assignments:  
     - `StudentID` = `={{ $json.output[0].StudentID }}`  
     - `Schedule` = `={{ $json['output[0].Selected'] }}` (stringify as needed)

9. **Add Google Sheets Node to Clear Output Sheet**  
   - Name: `Clear sheet1`  
   - Type: Google Sheets  
   - Operation: Clear  
   - Spreadsheet ID: same as input spreadsheet  
   - Sheet Name: `schedule` (gid=572766543)  
   - Credential: Use Google Sheets OAuth2 credential.

10. **Add Google Sheets Node to Append Schedule Data**  
    - Name: `Append Schedule`  
    - Type: Google Sheets  
    - Operation: Append  
    - Columns: Auto-map input data columns "StudentID" (string) and "Schedule" (string)  
    - Spreadsheet ID and Sheet Name same as above (`schedule`)  
    - Credential: Same as above.

11. **Connect Nodes for Output**  
    - Connect `Scheduling Agent` to `Split Schedule`.  
    - Connect `Split Schedule` to `Set Fields`.  
    - Connect `Set Fields` to `Clear sheet1`.  
    - Connect `Clear sheet1` to `Append Schedule`.

12. **Validate Credentials**  
    - Setup Google Sheets OAuth2 credential with full read/write access to your spreadsheet.  
    - Setup OpenAI API key credential with access to GPT-4o or compatible model.

13. **Test Workflow**  
    - Manually trigger `When clicking ‘Execute workflow’`.  
    - Check logs and Google Sheets output tab `schedule` for generated schedules.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Context or Link                                                                                                    |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| Workflow creates Fall 2025 course schedules using AI to enforce prerequisite rules and course offerings. Input students and completed courses are read from Google Sheets, output schedules appended to a separate tab.                                                                                                                                                                                                                                                                                                                                                                                       | General workflow purpose.                                                                                          |
| Google Sheets setup requires OAuth2 credential granting read/write access to the spreadsheet with tabs "Sheet1" (input) and "schedule" (output).                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Google Sheets OAuth2 node setup.                                                                                   |
| OpenAI integration requires API Key credential, with GPT-4o or similar vision-capable model selected for best results.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | OpenAI API credential and model selection instructions.                                                           |
| Detailed course catalog and scheduling constraints are embedded in the agent’s system message, including prerequisite logic, term offerings (Fall/Both), and course categories (Major Core, Major Elective, Gen Ed).                                                                                                                                                                                                                                                                                                                                                                                            | Core AI logic embedded in the LangChain Agent node.                                                                |
| Contact and project info: Robert Breen, rbreen@ynteractive.com, LinkedIn https://www.linkedin.com/in/robert-breen-29429625/, https://ynteractive.com                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Author and project credit from Sticky Note4.                                                                       |
| Example Google Sheets URL (replace with your own): https://docs.google.com/spreadsheets/d/10IMnD8JhiR4lTlNFQTG_Auopg8haAiEt3_G9EKWTqLw/edit?gid=572766543                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Example spreadsheet for reference.                                                                                 |

---

**Disclaimer:** The provided text originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.