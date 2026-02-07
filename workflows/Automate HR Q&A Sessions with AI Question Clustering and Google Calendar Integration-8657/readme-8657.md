Automate HR Q&A Sessions with AI Question Clustering and Google Calendar Integration

https://n8nworkflows.xyz/workflows/automate-hr-q-a-sessions-with-ai-question-clustering-and-google-calendar-integration-8657


# Automate HR Q&A Sessions with AI Question Clustering and Google Calendar Integration

### 1. Workflow Overview

This workflow automates the collection, processing, and scheduling of a monthly HR Q&A session using AI-powered question clustering and Google Calendar integration. It targets HR teams aiming to efficiently organize monthly meetings based on employee-submitted questions, optimizing meeting content by clustering similar inquiries and automatically creating an event with a Google Meet link.

The workflow consists of the following logical blocks:

- **1.1 Input Reception:** Collect employee questions via a styled web form and store them in a database.
- **1.2 Question Retrieval & Aggregation:** HR selects a date range to fetch relevant questions from the database, aggregated into a single payload.
- **1.3 Date Calculation:** Compute the last Friday of the current month (meeting date/time).
- **1.4 AI Processing and Calendar Scheduling:** An AI agent validates, clusters, prioritizes questions, and calls Google Calendar API to create the meeting event.
- **1.5 Output Generation:** Convert AI output into a downloadable text file and present a confirmation page with meeting details.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
Collects employee HR questions through a web form, validates mandatory fields, and stores the submitted data in a MySQL database.

**Nodes Involved:**  
- Form to get employee questions (“Question form”)  
- Add question to database (“Add question to database”)  
- Return form submission confirmation (“Return form”)

**Node Details:**

- **Question form**  
  - Type: `FormTrigger` (webhook form input)  
  - Role: Presents a styled form collecting employee name, department, internal email, and question. Name, email, and question are required fields.  
  - Configuration: Custom CSS for UX; on submit, triggers workflow with form data.  
  - Inputs: Web form submission  
  - Outputs: JSON with form fields  
  - Failure modes: Form submission errors, validation failures if fields missing  
  - Sticky Note: Notes about fields and styling, required fields, validation recommendation.

- **Add question to database**  
  - Type: `MySQL` (Insert)  
  - Role: Inserts submitted form data into table `hr_questions`. Columns: name, department, email, question, created_at.  
  - Configuration: Uses submittedAt timestamp converted to datetime for `created_at`.  
  - Inputs: Output from form node  
  - Outputs: Database insert confirmation  
  - Failure modes: DB connection/auth errors, SQL insert errors, data type mismatches  
  - Sticky Note: Notes on database schema, importance of email validation.

- **Return form**  
  - Type: `Form` (completion response)  
  - Role: Sends a confirmation page to the employee after submission, confirming receipt and explaining the monthly meeting.  
  - Configuration: Custom CSS for styling, completion message.  
  - Inputs: Output of DB insert node  
  - Outputs: HTTP response to user  
  - Failure modes: HTTP response errors, form rendering issues  
  - Sticky Note: Explains confirmation messaging for users.

---

#### 2.2 Question Retrieval & Aggregation

**Overview:**  
Allows HR to select a date range and retrieves all questions submitted within that range from the database. Then aggregates these questions into a single array for further AI processing.

**Nodes Involved:**  
- Form to get date range (“Form to get questions”)  
- Retrieve questions from DB (“Get queries from the database”)  
- Aggregate rows into array (“Aggregate Questions”)

**Node Details:**

- **Form to get questions**  
  - Type: `FormTrigger`  
  - Role: HR inputs a date range with two date fields: "Of the day" (start) and "Until the day" (end).  
  - Configuration: Custom CSS for nice UX, sends date range as JSON.  
  - Inputs: Web form submission  
  - Outputs: JSON with date fields  
  - Failure modes: Invalid date formats, empty dates  
  - Sticky Note: Describes date range input for query.

- **Get queries from the database**  
  - Type: `MySQL` (Execute Query)  
  - Role: Executes SQL to fetch rows from `hr_questions` where `created_at` is between provided dates.  
  - Configuration: Parameterized query using date inputs; ensure date formats match DB schema (timestamp).  
  - Inputs: Date range from previous form node  
  - Outputs: Rows of questions matching criteria  
  - Failure modes: SQL errors, DB connection/auth issues, timezone mismatches  
  - Sticky Note: Advises on date format and timezone considerations.

- **Aggregate Questions**  
  - Type: `Aggregate`  
  - Role: Combines all retrieved question rows into a single JSON array under field `questions`.  
  - Configuration: Aggregate all item data into `questions` array.  
  - Inputs: DB query result array  
  - Outputs: Single JSON with `questions` array  
  - Failure modes: Empty results, aggregation logic failures  
  - Sticky Note: Notes that this array is the AI Agent’s input payload.

---

#### 2.3 Date Calculation

**Overview:**  
Calculates the meeting start and end date/time corresponding to the last Friday of the current month at 16:00–17:00 in America/Sao_Paulo timezone.

**Nodes Involved:**  
- Compute meeting date/time (“Get start_date and end_date Meeting”)

**Node Details:**

- **Get start_date and end_date Meeting**  
  - Type: `Set`  
  - Role: Uses JavaScript expressions to:  
    - Find the last day of current month  
    - Backtrack to the last Friday (weekday 5)  
    - Set start time 16:00 and end time 17:00  
    - Return ISO 8601 strings for both start_date and end_date  
  - Inputs: Aggregated questions node output (passes through)  
  - Outputs: Add `start_date` and `end_date` fields for scheduling  
  - Failure modes: Date calculation errors, timezone mismatches  
  - Sticky Note: Explains the logic and suggests modification if last Friday passed.

---

#### 2.4 AI Processing and Calendar Scheduling

**Overview:**  
The core AI Agent node processes the submitted questions by validating, normalizing, clustering, and prioritizing them. It then calls the Google Calendar tool to create a meeting event with a Google Meet link. Finally, it returns a JSON object containing meeting details and a Markdown script for HR use.

**Nodes Involved:**  
- OpenAI Chat Model (“OpenAI Chat Model”)  
- AI Agent (LangChain Agent node) (“AI Agent”)  
- Structured Output Parser (“Structured Output Parser”)  
- Create Google Calendar Event (“Create an event in Google Calendar”)

**Node Details:**

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Provides GPT-4.1-mini model to the AI Agent as the language model backend.  
  - Configuration: Model selected is `gpt-4.1-mini` with default options.  
  - Inputs: From Aggregate Questions node (in AI language model input mode)  
  - Outputs: Language model responses  
  - Failure modes: API auth errors, rate limits, timeouts

- **AI Agent**  
  - Type: LangChain Agent (AI Agent)  
  - Role: Contains the main logic prompt instructing the AI to:  
    1. Validate questions and emails  
    2. Deduplicate by email but keep all questions  
    3. Normalize and cluster semantically similar questions  
    4. Prioritize clusters by frequency and earliest submission  
    5. Call the "Create an event in Google Calendar" tool with meeting details  
    6. Return JSON with meeting info and Markdown script text  
  - Configuration:  
    - System message with detailed instructions and example input/output  
    - Uses variables: `{{ $json.questions.toJsonString() }}` for questions input  
    - Requires calling Google Calendar tool with parameters (title, start, end, timezone, attendees, conference enabled)  
  - Inputs: Aggregated questions + meeting dates  
  - Outputs: JSON with meeting and script fields  
  - Failure modes: Expression errors, AI parsing errors, tool call failures, invalid question data  
  - Sticky Note: Details the agent’s roles, expected JSON output, and calendar tool usage.

- **Structured Output Parser**  
  - Type: Output Parser (LangChain)  
  - Role: Parses AI Agent’s textual output into structured JSON according to given schema.  
  - Configuration: JSON schema example defines meeting object and script string.  
  - Inputs: Output of OpenAI Chat Model in AI output parser mode  
  - Outputs: Parsed JSON for AI Agent node use  
  - Failure modes: Parsing failures if AI output malformed or incomplete

- **Create an event in Google Calendar**  
  - Type: Google Calendar Tool  
  - Role: Called by AI Agent to schedule the meeting with given parameters including conference (Meet) enabled.  
  - Configuration:  
    - Calendar account credential configured with OAuth2  
    - Inputs: start, end, summary(title), attendees (unique emails), description, timezone America/Sao_Paulo  
  - Inputs: Called via AI Agent tool call (ai_tool input)  
  - Outputs: Event creation response including `event_id` and `hangoutLink` (meet_link)  
  - Failure modes: API auth failure, permission errors, invalid parameters, rate limits  
  - Sticky Note: Calendar tool integration details.

---

#### 2.5 Output Generation and Presentation

**Overview:**  
Converts the AI-generated meeting script text into a downloadable text file, merges it with meeting JSON data, and displays a confirmation page to HR with meeting details and auto-download trigger.

**Nodes Involved:**  
- Convert AI output script to file (“Convert to File”)  
- Merge JSON and file outputs (“Merge”)  
- Final confirmation form (“Return meeting script”)

**Node Details:**

- **Convert to File**  
  - Type: Convert to File  
  - Role: Converts the `output.script` field (Markdown string) to a plain text file named `MeetingItinerary.txt`.  
  - Configuration: Operation "toText", source property `output.script`.  
  - Inputs: Output from AI Agent node JSON output (script text)  
  - Outputs: Binary file data for download  
  - Failure modes: Conversion errors, empty script text  
  - Sticky Note: Explains purpose of generating a text file for HR.

- **Merge**  
  - Type: Merge  
  - Role: Combines the JSON meeting info and binary script file into a single output payload.  
  - Configuration: Combine mode "combineByPosition" to merge parallel inputs.  
  - Inputs: JSON from AI Agent and binary file from Convert to File  
  - Outputs: Merged payload for final form response  
  - Failure modes: Mismatched input counts, merge logic errors  
  - Sticky Note: Explains merging for final response.

- **Return meeting script**  
  - Type: Form  
  - Role: Displays HR confirmation page with meeting metadata: title, attendees count, start/end date-times, and triggers automatic download of the script file.  
  - Configuration: Custom CSS styling; completion title and message use expressions to show meeting info and download status.  
  - Inputs: Merged output from Merge node  
  - Outputs: HTTP response to HR user  
  - Failure modes: HTTP errors, rendering issues, file download failures  
  - Sticky Note: Describes clear actionable confirmation for HR.

---

### 3. Summary Table

| Node Name                      | Node Type                          | Functional Role                              | Input Node(s)                 | Output Node(s)                   | Sticky Note                                                                                           |
|--------------------------------|----------------------------------|----------------------------------------------|------------------------------|---------------------------------|-----------------------------------------------------------------------------------------------------|
| Question form                  | FormTrigger                      | Collect employee questions via web form       | (Webhook entry)              | Add question to database         | Collects employee inputs: name, dept, email, question. Styled with custom CSS.                       |
| Add question to database       | MySQL (Insert)                   | Store submitted questions in database         | Question form                | Return form                     | Writes to hr_questions table; validate email recommended.                                           |
| Return form                   | Form                            | Confirm submission to employee                 | Add question to database     | -                               | Confirmation page for employees after submission.                                                   |
| Form to get questions          | FormTrigger                     | HR date range input for question retrieval    | (Webhook entry)              | Get queries from the database    | HR utility form for selecting start/end dates to query questions.                                   |
| Get queries from the database  | MySQL (Execute Query)            | Fetch questions by date range from DB          | Form to get questions        | Aggregate Questions             | SQL range query on hr_questions by created_at.                                                       |
| Aggregate Questions            | Aggregate                       | Combine all question rows into a JSON array   | Get queries from the database| Get start_date and end_date Meeting | Aggregates rows into `questions` array for AI input.                                                |
| Get start_date and end_date Meeting | Set                      | Calculate last Friday of month meeting time   | Aggregate Questions          | AI Agent                       | Computes meeting date/time (last Friday 16:00–17:00).                                               |
| OpenAI Chat Model              | LangChain LM Chat OpenAI         | AI language model backend                      | Aggregate Questions          | AI Agent (ai_languageModel)     | GPT-4.1-mini model configured.                                                                      |
| AI Agent                      | LangChain Agent                  | Validate, cluster, prioritize questions + schedule meeting | Get start_date and end_date Meeting + OpenAI Chat Model + Structured Output Parser + Calendar Tool | Convert to File + Merge           | Core AI logic; calls Google Calendar tool; returns meeting JSON + script text.                       |
| Structured Output Parser       | LangChain Output Parser          | Parse AI text output into structured JSON     | OpenAI Chat Model            | AI Agent (ai_outputParser)      | Parses AI output according to JSON schema.                                                          |
| Create an event in Google Calendar | Google Calendar Tool       | Schedule meeting with Google Meet link        | AI Agent (ai_tool)           | AI Agent (ai_tool output)       | Creates calendar event with Meet enabled; uses OAuth2 credentials.                                  |
| Convert to File                | Convert to File                 | Convert AI script text to downloadable .txt   | AI Agent output              | Merge                          | Creates MeetingItinerary.txt file for HR download.                                                  |
| Merge                        | Merge                          | Combine JSON data and file for final output   | AI Agent + Convert to File   | Return meeting script           | Merges JSON and binary file for final response.                                                     |
| Return meeting script          | Form                           | Show meeting confirmation & auto-download     | Merge                       | -                               | HR confirmation page with meeting info and file download.                                          |
| Sticky Notes (multiple)        | Sticky Note                    | Documentation and instructions                 | -                            | -                               | Multiple sticky notes provide detailed contextual info, instructions, and tips for each block/node. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form to Collect Employee Questions:**  
   - Add a `FormTrigger` node named “Question form”.  
   - Configure fields:  
     - Your name (text, required)  
     - Department (text, optional)  
     - Internal email (email, required)  
     - Your question (text, required)  
   - Apply custom CSS for styling (copy from original if desired).  
   - Set response mode to “lastNode”.  
   - Set webhook to activate.

2. **Add MySQL Insert Node to Save Questions:**  
   - Add `MySQL` node named “Add question to database”.  
   - Connect “Question form” output to this node.  
   - Configure credentials for your MySQL instance.  
   - Set operation to insert into table `hr_questions`.  
   - Map columns: name, department, email, question, created_at (use `$json.submittedAt.toDateTime()`).  
   - Validate DB connection and data types.

3. **Add Confirmation Form Node:**  
   - Add `Form` node named “Return form”.  
   - Connect “Add question to database” to it.  
   - Configure confirmation message and custom CSS.  
   - Set webhook ID for response.  
   - Confirm form displays success message on submission.

4. **Create Form for HR to Select Date Range:**  
   - Add `FormTrigger` node named “Form to get questions”.  
   - Add fields:  
     - Of the day (date)  
     - Until the day (date)  
   - Add custom CSS matching the original.  
   - Enable webhook.

5. **Add MySQL Query Node to Retrieve Questions:**  
   - Add `MySQL` node named “Get queries from the database”.  
   - Connect “Form to get questions” output.  
   - Set SQL to:  
     ```sql
     SELECT * FROM hr_questions WHERE created_at BETWEEN '{{ $json['Of the day'] }}' AND '{{ $json['Until the day'] }}';
     ```  
   - Use same DB credentials.

6. **Add Aggregate Node:**  
   - Add `Aggregate` node named “Aggregate Questions”.  
   - Connect “Get queries from the database”.  
   - Set to aggregate all items into a single field `questions`.

7. **Add Set Node for Meeting Date Calculation:**  
   - Add `Set` node named “Get start_date and end_date Meeting”.  
   - Connect “Aggregate Questions” output.  
   - Add two string fields with JavaScript expressions:  
     - `start_date`: Last Friday of current month at 16:00 (ISO string)  
     - `end_date`: Last Friday of current month at 17:00 (ISO string)  
   - Use the provided JavaScript logic for date calculation.

8. **Add LangChain OpenAI Chat Model Node:**  
   - Add `LM Chat OpenAI` node named “OpenAI Chat Model”.  
   - Connect to “Aggregate Questions” (ai_languageModel input).  
   - Set model to `gpt-4.1-mini`.  
   - Configure OpenAI credentials.

9. **Add LangChain Output Parser Node:**  
   - Add `Output Parser Structured` node named “Structured Output Parser”.  
   - Connect output of “OpenAI Chat Model” (ai_outputParser input).  
   - Paste the JSON schema for expected meeting and script output.

10. **Add LangChain Agent Node:**  
    - Add `Agent` node named “AI Agent”.  
    - Connect:  
      - Input from “Get start_date and end_date Meeting” (main input)  
      - AI language model input from “OpenAI Chat Model”  
      - AI output parser input from “Structured Output Parser”  
      - AI tool input from “Create an event in Google Calendar” node (see next step)  
    - Paste the detailed system prompt instructing question validation, clustering, prioritization, calendar event creation, and JSON output.  
    - Use expression to pass questions JSON to prompt: `={{ $json.questions.toJsonString() }}`.

11. **Add Google Calendar Tool Node:**  
    - Add `Google Calendar Tool` node named “Create an event in Google Calendar”.  
    - Connect as ai_tool input to “AI Agent”.  
    - Configure with Google OAuth2 credentials.  
    - Set parameters to accept title, start, end, timezone, attendees, description, conference enabled (Meet).  
    - Make sure this node can be called by the agent.

12. **Add Convert to File Node:**  
    - Add `Convert to File` node named “Convert to File”.  
    - Connect main output from “AI Agent”.  
    - Configure to convert `output.script` text field to a file named `MeetingItinerary.txt`.

13. **Add Merge Node:**  
    - Add `Merge` node named “Merge”.  
    - Connect two inputs:  
      - Main output from “AI Agent” (JSON)  
      - Output from “Convert to File” (file binary)  
    - Set mode to “combineByPosition”.

14. **Add Final Form Node for HR Confirmation:**  
    - Add `Form` node named “Return meeting script”.  
    - Connect “Merge” output.  
    - Configure form to display meeting details: title, attendees count, start/end times.  
    - Configure automatic download trigger for `MeetingItinerary.txt`.  
    - Add custom CSS and completion messages.

15. **Testing and Validation:**  
    - Test form submission end-to-end.  
    - Verify DB inserts.  
    - Test HR date range form and AI processing.  
    - Confirm Google Calendar event creation with Meet link.  
    - Confirm final page shows correct info and triggers download.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                 | Context or Link                                                                                     |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| The workflow is designed to avoid hardcoding API keys; credentials must be configured securely within n8n.                                                                                                                   | Security best practice                                                                             |
| Emails collected are internal only and should be protected to comply with privacy considerations.                                                                                                                             | Data privacy                                                                                      |
| AI prompt carefully instructs the agent to only return the final JSON after calendar event creation to avoid partial outputs.                                                                                                 | AI prompt design                                                                                  |
| The meeting script output is a single Markdown text field, formatted as a meeting guide with question clusters and counts for HR staff use.                                                                                   | AI output formatting                                                                              |
| The meeting is always scheduled for the last Friday of the current month, 16:00–17:00 America/Sao_Paulo timezone; date calculation can be customized if needed.                                                                | Date calculation logic                                                                            |
| The final confirmation page includes auto-download of the script file and clear meeting info for HR staff.                                                                                                                    | UX design                                                                                         |
| Sticky notes in the workflow provide detailed documentation and tips on each step, including validation, styling, and API usage.                                                                                              | In-workflow documentation                                                                         |
| For more details on Google Calendar API and OAuth2 setup, see https://developers.google.com/calendar/api/guides/auth                                                                                                          | External API reference                                                                             |
| For OpenAI API usage and prompt engineering, see https://platform.openai.com/docs/guides/chat                                                                                                                                | External AI documentation                                                                         |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.