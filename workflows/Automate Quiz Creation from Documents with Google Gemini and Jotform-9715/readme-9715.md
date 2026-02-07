Automate Quiz Creation from Documents with Google Gemini and Jotform

https://n8nworkflows.xyz/workflows/automate-quiz-creation-from-documents-with-google-gemini-and-jotform-9715


# Automate Quiz Creation from Documents with Google Gemini and Jotform

### 1. Workflow Overview

This workflow automates the creation of multiple-choice quizzes from uploaded documents, integrating Google Gemini AI and JotForm form generation. It is designed for educators or content creators who want to quickly generate quizzes based on document content, customize the quiz title and number of questions, and seamlessly publish the quiz on JotForm. The workflow also stores generated quiz questions in a Google Sheet for record-keeping or further analysis.

Logical blocks:

- **1.1 Input Reception**: Triggered by a JotForm submission including document upload, quiz title, and number of questions.
- **1.2 Document Processing**: Download and extract text content from the uploaded document.
- **1.3 AI Quiz Generation**: Use Google Gemini-powered AI to generate quiz questions in JSON format based on extracted content.
- **1.4 Data Structuring and Storage**: Parse AI output, split questions individually, and append each question to a Google Sheet.
- **1.5 JotForm Quiz Creation**: Format the quiz questions and metadata, then use JotForm API to create a new quiz form with the AI-generated questions.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Receives a form submission from JotForm containing the uploaded document, quiz title, and the desired number of questions.

**Nodes Involved:**  
- JotForm Trigger  
- HTTP Request1  
- Sticky Note (contextual comment)

**Node Details:**

- **JotForm Trigger**  
  - *Type*: JotForm Trigger node  
  - *Role*: Listens for new submissions on a specific JotForm (form ID: 252856893250062).  
  - *Configuration*: Webhook-based trigger, resolves submission data without resolving all nested data.  
  - *Input/Output*: No input; outputs form submission JSON including file upload URL and form fields.  
  - *Edge Cases*: Failure if webhook is not authorized or form ID changes; missing fields may cause downstream errors.  
  - *Sticky Note*: "Create a JotForm with Document upload, quiz title and no of questions options."

- **HTTP Request1**  
  - *Type*: HTTP Request node  
  - *Role*: Downloads the uploaded file from the URL provided in the form submission.  
  - *Configuration*: URL expression set to the first file upload URL from form data (`{{$json.fileUpload[0]}}`).  
  - *Input/Output*: Input from JotForm Trigger; outputs file binary data.  
  - *Edge Cases*: Download failure if URL is invalid or file removed; timeout or network errors.

- **Sticky Note**  
  - *Content*: "Download the document."  
  - *Role*: Provides user guidance on this step.

---

#### 1.2 Document Processing

**Overview:**  
Extracts the textual content from the downloaded PDF document to prepare for AI processing.

**Nodes Involved:**  
- Extract from File  
- Sticky Note (contextual comment)

**Node Details:**

- **Extract from File**  
  - *Type*: ExtractFromFile node  
  - *Role*: Extracts text content from PDF files.  
  - *Configuration*: Operation set to "pdf". No additional options specified.  
  - *Input/Output*: Receives binary PDF data from HTTP Request1; outputs extracted text in JSON under `text` property.  
  - *Edge Cases*: Extraction failure if file is not a valid PDF or is corrupted; empty text may cause AI issues.

- **Sticky Note**  
  - *Content*: "Extract Content from the document."  
  - *Role*: Clarifies the purpose of this node.

---

#### 1.3 AI Quiz Generation

**Overview:**  
Generates multiple-choice quiz questions based on the extracted document text using an AI agent powered by Google Gemini chat model and structured output parsing.

**Nodes Involved:**  
- AI Agent  
- Google Gemini Chat Model  
- Structured Output Parser  
- Split Out  
- Sticky Note (contextual comment)

**Node Details:**

- **AI Agent**  
  - *Type*: LangChain Agent node  
  - *Role*: Orchestrates AI prompt processing and output parsing.  
  - *Configuration*:  
    - Prompt includes instructions to generate a specified number of quiz questions, each with 4 options (A-D), randomized correct option, concise phrasing, and JSON-only output.  
    - Uses dynamic expressions to insert number of questions (`q5_numberOf`) and quiz title (`q7_quizName`) from form submission.  
    - Output is parsed with a structured output parser expecting a JSON array of question objects.  
  - *Input/Output*: Input is extracted text from Extract from File; output is parsed JSON quiz questions.  
  - *Version*: 2.2 (supports advanced prompt and output parsing).  
  - *Edge Cases*: AI response may fail JSON parsing if output format deviates; prompt variables missing cause runtime errors.

- **Google Gemini Chat Model**  
  - *Type*: LangChain LM Chat node, Google Gemini variant  
  - *Role*: Provides the language model backend for AI Agent.  
  - *Input/Output*: Receives prompt from AI Agent; outputs raw AI chat completion.  
  - *Edge Cases*: API key or quota issues; latency or timeout.

- **Structured Output Parser**  
  - *Type*: LangChain Output Parser node  
  - *Role*: Parses AI chat output into validated JSON according to schema example (question, options, correct_option).  
  - *Configuration*: Auto-fix enabled to correct minor JSON issues.  
  - *Input/Output*: Input from Google Gemini Chat Model; output to AI Agent.  
  - *Edge Cases*: Parsing errors if AI output malformed beyond auto-fix.

- **Split Out**  
  - *Type*: Split Out node  
  - *Role*: Splits the array of quiz questions into individual items for separate processing.  
  - *Configuration*: Splits on field "output" which contains the questions array.  
  - *Input/Output*: Input from AI Agent; outputs individual question items.  
  - *Edge Cases*: Empty or missing output field causes no splitting.

- **Sticky Note**  
  - *Content*: "Save questions in a google sheet."  
  - *Role*: Indicates that generated questions will be saved externally.

---

#### 1.4 Data Structuring and Storage

**Overview:**  
Appends each generated quiz question as a new row into a Google Sheet, preserving question text, options, and correct answer.

**Nodes Involved:**  
- Append row in sheet  
- Sticky Note (contextual comment)

**Node Details:**

- **Append row in sheet**  
  - *Type*: Google Sheets node  
  - *Role*: Appends rows with quiz data into a Google Sheet named "Questions" (gid=0).  
  - *Configuration*:  
    - Maps question JSON properties to columns: Question, Option A-D, Correct Answer.  
    - Uses OAuth2 credentials for Google Sheets access.  
    - Append operation on specified spreadsheet ID.  
  - *Input/Output*: Input from Split Out node (individual question JSON); output is JSON confirming append operation.  
  - *Edge Cases*: Credential expiration or permission errors; sheet not found; column mapping mismatch.

- **Sticky Note**  
  - *Content*: "Save questions in a google sheet."  
  - *Role*: Reinforces the purpose of this block.

---

#### 1.5 JotForm Quiz Creation

**Overview:**  
Transforms structured quiz questions and styling information into a form payload, then calls JotForm API to create a new quiz form with the AI-generated questions.

**Nodes Involved:**  
- Code in JavaScript  
- HTTP Request (for JotForm API)  
- Sticky Note (contextual comment)

**Node Details:**

- **Code in JavaScript**  
  - *Type*: Code node (JavaScript)  
  - *Role*:  
    - Parses AI output JSON (from AI Agent) safely.  
    - Builds a form properties object with title, styling, layout, and question data formatted for JotForm API.  
    - Dynamically sets quiz title from form submission or defaults.  
    - Formats each question into JotForm-compatible structure including question text, multiple-choice options, and correct answer key.  
  - *Input/Output*: Input from Append row in sheet (JSON with quiz questions); outputs formatted HTTP body for JotForm API.  
  - *Edge Cases*: JSON parse errors; missing or malformed quiz data; formatting errors causing API rejection.

- **HTTP Request**  
  - *Type*: HTTP Request node  
  - *Role*: Calls JotForm API to create a new form with the quiz questions.  
  - *Configuration*:  
    - POST method to `https://api.jotform.com/form?apiKey=` (API key parameterized).  
    - Sends URL-encoded form data body from Code node.  
    - Sets header with API key for authentication.  
  - *Input/Output*: Input from Code in JavaScript; outputs JotForm API response JSON.  
  - *Edge Cases*: API key invalid or expired; API rate limit; malformed request; network errors.

- **Sticky Note**  
  - *Content*: "Create a quiz on jotform having AI generated questions."  
  - *Role*: Clarifies this step's objective.

---

### 3. Summary Table

| Node Name            | Node Type                          | Functional Role                                   | Input Node(s)         | Output Node(s)            | Sticky Note                                               |
|----------------------|----------------------------------|--------------------------------------------------|-----------------------|---------------------------|-----------------------------------------------------------|
| JotForm Trigger      | n8n-nodes-base.jotFormTrigger     | Receives form submission with document and inputs| None                  | HTTP Request1             | Create a JotForm with Document upload, quiz title and no of questions options |
| HTTP Request1        | n8n-nodes-base.httpRequest        | Downloads uploaded document                        | JotForm Trigger       | Extract from File          | Download the document                                     |
| Extract from File    | n8n-nodes-base.extractFromFile    | Extracts text content from PDF                     | HTTP Request1         | AI Agent                  | Extract Content from the document                         |
| AI Agent             | @n8n/n8n-nodes-langchain.agent    | Generates quiz questions from extracted text using AI | Extract from File      | Split Out                 | Save questions in a google sheet                          |
| Google Gemini Chat Model | @n8n/n8n-nodes-langchain.lmChatGoogleGemini | Provides AI chat completions to AI Agent          | AI Agent (ai_languageModel) | Structured Output Parser  |                                                           |
| Structured Output Parser | @n8n/n8n-nodes-langchain.outputParserStructured | Parses AI output into structured JSON             | Google Gemini Chat Model | AI Agent (ai_outputParser) |                                                           |
| Split Out            | n8n-nodes-base.splitOut           | Splits quiz questions array into individual items | AI Agent               | Append row in sheet        | Save questions in a google sheet                          |
| Append row in sheet  | n8n-nodes-base.googleSheets       | Appends each question as a row in Google Sheet    | Split Out              | Code in JavaScript         | Save questions in a google sheet                          |
| Code in JavaScript   | n8n-nodes-base.code               | Formats quiz data and styling for JotForm API     | Append row in sheet    | HTTP Request               |                                                           |
| HTTP Request         | n8n-nodes-base.httpRequest        | Creates new quiz form on JotForm via API          | Code in JavaScript     | None                      | Create a quiz on jotform having AI generated questions   |
| Sticky Note          | n8n-nodes-base.stickyNote         | Visual guidance                                   | None                  | None                      | Create a JotForm with Document upload, quiz title and no of questions options |
| Sticky Note1         | n8n-nodes-base.stickyNote         | Visual guidance                                   | None                  | None                      | Download the document                                    |
| Sticky Note2         | n8n-nodes-base.stickyNote         | Visual guidance                                   | None                  | None                      | Extract Content from the document                        |
| Sticky Note3         | n8n-nodes-base.stickyNote         | Visual guidance                                   | None                  | None                      | Save questions in a google sheet                         |
| Sticky Note4         | n8n-nodes-base.stickyNote         | Visual guidance                                   | None                  | None                      | Create a quiz on jotform having AI generated questions  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a JotForm Trigger node:**
   - Set the form ID to `252856893250062` (or your quiz request form).
   - Enable webhook to listen for new submissions.
   - Ensure your form includes fields for document upload (`fileUpload`), quiz title (`q7_quizName`), and number of questions (`q5_numberOf`).

3. **Add an HTTP Request node ("HTTP Request1"):**
   - Set method to `GET` (default).
   - Set URL to expression: `{{$json.fileUpload[0]}}` to download the uploaded document.
   - Connect JotForm Trigger output to this node.

4. **Add Extract from File node:**
   - Set operation to `pdf`.
   - Connect HTTP Request1 output (binary PDF) to this node.
   - This extracts the text content from the PDF.

5. **Add AI Agent node:**
   - Choose LangChain Agent node.
   - Set prompt as a "define" prompt type with instructions to generate multiple-choice questions:
     - Use expressions to insert number of questions `{{ $('JotForm Trigger').item.json.q5_numberOf }}` and quiz title `{{ $('JotForm Trigger').item.json.q7_quizName }}`.
     - Instruct AI to output exactly 4 options per question, randomize correct option, output JSON only.
   - Enable output parser.
   - Connect Extract from File output to AI Agent.

6. **Add Google Gemini Chat Model node:**
   - Select Google Gemini model.
   - Connect AI Agent's ai_languageModel input to this node’s output.

7. **Add Structured Output Parser node:**
   - Configure with JSON schema example: an array of question objects with properties `question`, `options` (array), and `correct_option`.
   - Enable autoFix to handle minor JSON issues.
   - Connect Google Gemini Chat Model output to this node.
   - Connect Structured Output Parser output to AI Agent’s ai_outputParser input.

8. **Add Split Out node:**
   - Set `fieldToSplitOut` to `"output"` which holds array of quiz questions.
   - Connect AI Agent output to Split Out.

9. **Add Google Sheets node ("Append row in sheet"):**
   - Set operation to `append`.
   - Configure document ID and sheet name (`gid=0`) where quiz questions will be stored.
   - Map columns:
     - Question → `{{$json.question}}`
     - Option A → `{{$json.options[0]}}`
     - Option B → `{{$json.options[1]}}`
     - Option C → `{{$json.options[2]}}`
     - Option D → `{{$json.options[3]}}`
     - Correct Answer → `{{$json.correct_option}}`
   - Use Google OAuth2 credentials with access to the target spreadsheet.
   - Connect Split Out output to this node.

10. **Add Code node ("Code in JavaScript"):**
    - Paste provided JavaScript code to:
      - Parse AI Agent output JSON safely.
      - Build JotForm API body with quiz title, styling, and questions formatted.
    - Connect Append row in sheet output to this node.

11. **Add HTTP Request node:**
    - Configure for POST to `https://api.jotform.com/form`.
    - Set query parameter `apiKey` with your JotForm API key.
    - Set content type to `application/x-www-form-urlencoded`.
    - Set body to raw content, pass the JSON-formatted body coming from the Code node.
    - Add header with `APIKEY` set to your API key.
    - Connect Code node output to this HTTP Request node.

12. **Add Sticky Notes as needed for documentation in the workflow UI, matching descriptions provided.**

13. **Test the entire workflow:**
    - Submit a form with document, quiz title, and number of questions.
    - Verify extraction, AI generation, Google Sheets appending, and JotForm creation.

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                      |
|--------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| Workflow requires valid API credentials for Google Sheets (OAuth2) and JotForm (API key).               | Credentials setup in n8n for Google Sheets and JotForm |
| Google Gemini chat model usage requires appropriate API access and n8n LangChain integration.          | Verify Google Gemini API availability and quota.     |
| Quiz questions are generated strictly from document content; ensure uploaded documents are text-rich PDFs.| Important for AI quality and relevance.              |
| Styling options in quiz creation include font, colors, layout, and button appearance for better UX.     | Customizable in the JavaScript Code node.            |
| Official n8n documentation links for node references and LangChain usage: https://docs.n8n.io/         | Useful for debugging and extending workflow.         |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly respects current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.