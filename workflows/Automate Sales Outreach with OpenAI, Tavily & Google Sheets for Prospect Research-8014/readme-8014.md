Automate Sales Outreach with OpenAI, Tavily & Google Sheets for Prospect Research

https://n8nworkflows.xyz/workflows/automate-sales-outreach-with-openai--tavily---google-sheets-for-prospect-research-8014


# Automate Sales Outreach with OpenAI, Tavily & Google Sheets for Prospect Research

### 1. Workflow Overview

This workflow automates the process of prospect research and personalized sales outreach following a sales call booking. It is designed to enrich prospect data, identify relevant product solutions, and generate personalized communication content (email and SMS) using AI agents and external data sources.

**Target Use Cases:**  
- Sales teams automating outreach personalization after a meeting is booked.  
- Marketing teams needing structured and updated prospect/company info integrated into Google Sheets.  
- Businesses leveraging AI to dynamically research prospects and craft tailored messaging based on company data and testimonials.

**Logical Blocks:**  
- **1.1 Input Reception & Data Retrieval:** Trigger and fetch raw prospect booking data from Google Sheets.  
- **1.2 AI-Driven Prospect Research:** Use AI and Tavily API to gather company insights, tech stack, updates, and find relevant products.  
- **1.3 Google Sheets Update:** Save researched data back to the spreadsheet for tracking and further use.  
- **1.4 Personalized Outreach Generation:** AI agent creates a tailored email subject, body, and SMS message using prospect and testimonial data.  
- **1.5 Final Outreach Content Storage:** Update the spreadsheet with generated outreach content for follow-up.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Data Retrieval

**Overview:**  
This block initiates the workflow manually for testing and pulls prospect booking data from a Google Sheet, filtering for entries that require research.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Review Calls (Google Sheets)

**Node Details:**  

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Starts the workflow execution manually for testing purposes.  
  - Configuration: Default manual trigger with no parameters.  
  - Input/Output: No input; output triggers next node.  
  - Edge cases: None; manual trigger suitable for testing only.

- **Review Calls**  
  - Type: Google Sheets (Read)  
  - Role: Reads prospect booking data from the “Meeting Data” sheet.  
  - Configuration:  
    - Document ID points to a specific Google Sheet (mock data).  
    - Reads from tab “Meeting Data”.  
    - Filter applied: only rows where `company_overview` column equals “FILL” (indicating unprocessed).  
  - Expressions used: None explicitly; filtered via UI.  
  - Input: Trigger from manual node  
  - Output: Array of prospect booking records filtered for processing.  
  - Edge cases:  
    - Google Sheets API auth errors (OAuth2 required).  
    - Empty result if no matching rows (workflow may end silently).  
    - Sheet structure changes may break filtering.

---

#### 2.2 AI-Driven Prospect Research

**Overview:**  
Processes each prospect record through an AI agent that executes research tasks using the Tavily search tool and product list extraction, then formats output for updating the sheet.

**Nodes Involved:**  
- AI Agent (Langchain Agent)  
- Tavily (HTTP Request Tool)  
- Product List (Google Sheets Tool)  
- OpenAI Chat Model (Language Model)  
- Structured Output Parser (Langchain Output Parser)

**Node Details:**  

- **AI Agent**  
  - Type: Langchain Agent Node  
  - Role: Central AI orchestrator that receives prospect info and manages tool calls.  
  - Configuration:  
    - Prompt includes prospect fields: Name, Email, Company Name, Website, Business Type, Project.  
    - System message describes detailed instructions to:  
      - Parse inputs, call Tavily for company overview, tech stack, updates.  
      - Use Product List tool to find three relevant solutions.  
      - Format output as JSON with exactly six fields.  
      - Explicitly call the Update Sheet tool with results.  
    - Tools linked: Tavily, Product List, Update Sheet.  
  - Expressions: Uses mustache expressions `{{ $json.FieldName }}` to inject prospect data.  
  - Input: Prospect data from Review Calls node.  
  - Output: JSON structured data ready for parsing.  
  - Edge cases:  
    - AI prompt failures due to malformed input.  
    - API call failures to Tavily or Google Sheets.  
    - Missing or incomplete data fields.  
    - Rate limits or timeout on AI or external APIs.

- **Tavily**  
  - Type: HTTP Request Tool (used as AI Tool)  
  - Role: Searches the internet for company data (overview, tech stack, updates).  
  - Configuration:  
    - POST to `https://api.tavily.com/search` with API key (needs user replacement).  
    - Query parameter `{searchTerm}` dynamically set by AI Agent.  
    - Search depth: basic; max 3 results; includes raw content and answers.  
  - Input: Dynamic search term from AI Agent.  
  - Output: Search results used by AI Agent to generate summaries.  
  - Edge cases:  
    - API key missing or invalid.  
    - API response errors or empty results.  
    - Network errors or rate limits.

- **Product List**  
  - Type: Google Sheets Tool  
  - Role: Retrieves relevant product solutions based on business type and project.  
  - Configuration:  
    - Reads from “Products” sheet tab within the same Google Sheet.  
    - No filters configured; used as a tool by AI Agent.  
  - Input: Called by AI Agent with parameters.  
  - Output: Product names used to fill primary_solution, solution_2, solution_3.  
  - Edge cases:  
    - Google Sheets auth or access issues.  
    - Incorrect or empty product data.

- **OpenAI Chat Model**  
  - Type: Langchain Language Model Node  
  - Role: Provides LLM backend for AI Agent processing.  
  - Configuration: GPT-4.1 model selected.  
  - Input: Prompt forwarded by AI Agent.  
  - Output: Text completion used by AI Agent.  
  - Edge cases:  
    - API key missing or invalid.  
    - Rate limits or network errors.  
    - Model usage quota exceeded.

- **Structured Output Parser**  
  - Type: Langchain Output Parser  
  - Role: Parses AI Agent output to ensure JSON matches expected schema.  
  - Configuration: JSON schema example with six fields: company_overview, tech_stack, company_updates, primary_solution, solution_2, solution_3.  
  - Input: Raw AI output.  
  - Output: Parsed structured JSON for downstream use.  
  - Edge cases:  
    - Output not compliant with schema causing parsing errors.

---

#### 2.3 Google Sheets Update (Research Results)

**Overview:**  
Updates the prospect’s row in the “Meeting Data” sheet with the researched company info and product solutions.

**Nodes Involved:**  
- Update Sheet (Google Sheets Tool)

**Node Details:**  

- **Update Sheet**  
  - Type: Google Sheets Tool (Update Operation)  
  - Role: Writes six researched fields alongside Email as matching key.  
  - Configuration:  
    - Document ID and sheet “Meeting Data” set.  
    - Matching column: Email (to update correct row).  
    - Fields updated: company_overview, tech_stack, company_updates, primary_solution, solution_2, solution_3.  
    - Values come from AI Agent output using `$fromAI` expression to extract specific fields.  
  - Input: Parsed output from AI Agent.  
  - Output: Confirmation of sheet update.  
  - Edge cases:  
    - Google Sheets auth errors.  
    - Row not found if Email does not exist.  
    - Update conflicts if sheet is edited concurrently.

---

#### 2.4 Personalized Outreach Generation

**Overview:**  
Generates personalized outreach messages (email subject, body, and SMS) leveraging prospect data and testimonial success stories.

**Nodes Involved:**  
- Sales Writing Assistant (Langchain Agent)  
- Review Calls (Google Sheets)  
- Testimonials Tool (Google Sheets Tool)  
- OpenAI Chat Model1 (Language Model)  
- Structured Output Parser1 (Output Parser)  
- Update Sheets 2 (Google Sheets Tool)

**Node Details:**  

- **Sales Writing Assistant**  
  - Type: Langchain Agent Node  
  - Role: Generates personalized sales outreach messages using prospect and testimonial data.  
  - Configuration:  
    - Prompt uses fields from “Review Calls” and AI Agent output to provide context.  
    - System message instructs to write short, personal emails and SMS with a testimonial tie-in.  
    - Calls: Testimonials Tool for success stories, Email Agent, and Update Sheets 2 for saving output.  
    - Output parser enabled for structured JSON with subject, email, text_message fields.  
  - Input: Prospect data plus researched company info from AI Agent.  
  - Output: Structured message content (subject, email, SMS).  
  - Edge cases:  
    - Missing testimonial data leading to weak messages.  
    - AI generation errors or timeouts.  
    - Input field inconsistencies.

- **Review Calls**  
  - Same as before; used here as input reference for Sales Writing Assistant.  
  - Edge cases: Same as prior.

- **Testimonials Tool**  
  - Type: Google Sheets Tool  
  - Role: Provides relevant success stories from “Success Stories” tab for personalization.  
  - Configuration:  
    - Reads from “Success Stories” sheet tab in same Google Sheet.  
    - No filters, used by Sales Writing Assistant to find best match.  
  - Input: Called by Sales Writing Assistant.  
  - Output: Testimonial data for message generation.  
  - Edge cases:  
    - Auth errors.  
    - Empty or irrelevant testimonials.

- **OpenAI Chat Model1**  
  - Type: Langchain Language Model Node  
  - Role: Backend LLM for Sales Writing Assistant.  
  - Configuration: GPT-4.1 model.  
  - Input: Prompt from Sales Writing Assistant.  
  - Output: Generated outreach message text.  
  - Edge cases: Same as other OpenAI node.

- **Structured Output Parser1**  
  - Type: Langchain Output Parser  
  - Role: Validates and parses Sales Writing Assistant output into JSON with subject, email, text_message.  
  - Configuration: Manual JSON schema with required fields.  
  - Input: Raw AI response.  
  - Output: Structured outreach content.  
  - Edge cases: Parsing failures if output is malformed.

- **Update Sheets 2**  
  - Type: Google Sheets Tool (Update Operation)  
  - Role: Saves the generated outreach messages (subject, email, sms) back into “Meeting Data” sheet, matched by Email.  
  - Configuration:  
    - Document ID and sheet “Meeting Data” configured.  
    - Matching column: Email.  
    - Fields updated: email_subject, email_text, sms.  
    - Values from Sales Writing Assistant output using `$fromAI()` expressions.  
  - Input: Parsed outreach content.  
  - Output: Confirmation of update.  
  - Edge cases: Same as other Google Sheets update nodes.

---

#### 2.5 Sticky Notes (Documentation)

**Overview:**  
Sticky notes provide setup instructions, workflow explanation, and user guidance embedded within the n8n canvas.

**Nodes Involved:**  
- Sticky Note  
- Sticky Note1

**Node Details:**  

- **Sticky Note**  
  - Type: Sticky Note  
  - Role: Documentation on credentials setup (Google Sheets, OpenAI, Tavily), sheet duplication, and initial configuration.  
  - Content includes links and stepwise setup info.

- **Sticky Note1**  
  - Type: Sticky Note  
  - Role: High-level workflow description explaining how the automation runs and what it achieves.

---

### 3. Summary Table

| Node Name                | Node Type                             | Functional Role                                | Input Node(s)                | Output Node(s)               | Sticky Note                                                                                                        |
|--------------------------|-------------------------------------|------------------------------------------------|-----------------------------|-----------------------------|-------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                      | Starts workflow manually for testing          | None                        | Review Calls                |                                                                                                                   |
| Review Calls             | Google Sheets (Read)                 | Reads prospect booking data needing research  | When clicking ‘Test workflow’ | AI Agent                   | Sticky Note1: Explains workflow steps and overview.                                                               |
| AI Agent                | Langchain Agent                     | Orchestrates AI research and calls tools      | Review Calls                 | Sales Writing Assistant     | Sticky Note1: Workflow description includes AI Agent role.                                                       |
| Tavily                  | HTTP Request (AI Tool)              | Searches internet for company insights         | AI Agent                    | AI Agent                   | Sticky Note: Setup instructions include Tavily API key replacement.                                              |
| Product List            | Google Sheets Tool                  | Retrieves product solutions related to prospect | AI Agent                    | AI Agent                   | Sticky Note: Google Sheets OAuth2 setup instructions.                                                             |
| Update Sheet            | Google Sheets Tool (Update)         | Updates prospect row with research results     | AI Agent                    |                             | Sticky Note: Google Sheets OAuth2 setup instructions.                                                             |
| Structured Output Parser | Langchain Output Parser             | Parses AI Agent output to structured JSON      | AI Agent                    | Update Sheet               |                                                                                                                   |
| Sales Writing Assistant  | Langchain Agent                    | Generates personalized outreach messages       | AI Agent                    | Update Sheets 2            | Sticky Note1: Workflow overview and personalization details.                                                     |
| Review Calls             | Google Sheets (Read)                | Provides prospect data to Sales Writing Assistant | AI Agent                    | Sales Writing Assistant     |                                                                                                                   |
| Testimonials Tool        | Google Sheets Tool                  | Retrieves testimonial success stories          | Sales Writing Assistant     | Sales Writing Assistant     | Sticky Note: OAuth2 setup instructions for Google Sheets.                                                         |
| OpenAI Chat Model        | Langchain LM (GPT-4.1)              | AI backend for AI Agent                         | AI Agent                    | AI Agent                   | Sticky Note: OpenAI API key setup instructions.                                                                    |
| OpenAI Chat Model1       | Langchain LM (GPT-4.1)              | AI backend for Sales Writing Assistant         | Sales Writing Assistant     | Sales Writing Assistant     | Sticky Note: OpenAI API key setup instructions.                                                                    |
| Structured Output Parser1| Langchain Output Parser             | Parses outreach message outputs                  | Sales Writing Assistant     | Update Sheets 2            |                                                                                                                   |
| Update Sheets 2         | Google Sheets Tool (Update)          | Saves generated email and SMS outreach content | Sales Writing Assistant     |                             | Sticky Note: Google Sheets OAuth2 setup instructions.                                                             |
| Sticky Note             | Sticky Note                        | Setup instructions and notes                     | None                        | None                       | Contains detailed step-by-step setup instructions and links to services.                                          |
| Sticky Note1            | Sticky Note                        | Workflow overview and brief explanation          | None                        | None                       | Contains workflow summary and usage notes.                                                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Name: When clicking ‘Test workflow’  
   - No special parameters.

2. **Add Google Sheets Read Node (Review Calls)**  
   - Type: Google Sheets  
   - Name: Review Calls  
   - Credentials: Connect Google account via OAuth2.  
   - Document ID: Your Google Sheet ID with prospect data.  
   - Sheet Name: “Meeting Data” tab.  
   - Filter: Set filter to fetch rows where `company_overview` equals “FILL”.  
   - Connect input: From Manual Trigger node.

3. **Add Langchain Agent Node (AI Agent)**  
   - Type: Langchain Agent  
   - Name: AI Agent  
   - Credentials: Connect OpenAI API key in linked OpenAI Chat Model node.  
   - Prompt: Use a prompt that instructs to parse prospect info and call two tools: Tavily and Product List, then call Update Sheet with six fields.  
   - Tools to register: Tavily (HTTP Request), Product List (Google Sheets Tool), Update Sheet (Google Sheets Tool).  
   - Connect input: From Review Calls node.

4. **Add HTTP Request Node (Tavily Tool)**  
   - Type: HTTP Request  
   - Name: Tavily  
   - URL: `https://api.tavily.com/search`  
   - Method: POST  
   - Body Type: JSON  
   - Body Content:  
     ```json
     {
       "api_key": "your-tavily-key-here",
       "query": "{searchTerm}",
       "search_depth": "basic",
       "include_answer": true,
       "topic": "news",
       "include_raw_content": true,
       "max_results": 3
     }
     ```  
   - Connect input: As AI Tool of AI Agent node.

5. **Add Google Sheets Tool (Product List)**  
   - Type: Google Sheets Tool (Read)  
   - Name: Product List  
   - Credentials: Use OAuth2 Google connection.  
   - Document ID: Same prospect data Google Sheet or another containing products.  
   - Sheet Name: Tab “Products”.  
   - Connect input: As AI Tool of AI Agent node.

6. **Add Google Sheets Tool (Update Sheet)**  
   - Type: Google Sheets Tool (Update)  
   - Name: Update Sheet  
   - Credentials: OAuth2 Google connection.  
   - Document ID: Same as above.  
   - Sheet Name: “Meeting Data” tab.  
   - Matching Column: “Email”.  
   - Columns to update: company_overview, tech_stack, company_updates, primary_solution, solution_2, solution_3.  
   - Values: Use `$fromAI()` expressions to extract fields from AI Agent output.  
   - Connect input: As AI Tool of AI Agent node.

7. **Add Langchain Output Parser Node (Structured Output Parser)**  
   - Type: Langchain Output Parser  
   - Name: Structured Output Parser  
   - Schema: JSON schema with six fields for company overview, tech stack, etc.  
   - Connect input: From AI Agent node output.

8. **Connect OpenAI Chat Model Node (for AI Agent)**  
   - Type: Langchain LM Chat OpenAI  
   - Name: OpenAI Chat Model  
   - Model: GPT-4.1  
   - Credentials: OpenAI API key.  
   - Connect input: From AI Agent node languageModel input.

9. **Add Langchain Agent Node (Sales Writing Assistant)**  
   - Type: Langchain Agent  
   - Name: Sales Writing Assistant  
   - Prompt: Uses prospect details and researched data to generate personalized email subject, body, and SMS using Testimonials Tool.  
   - Tools: Testimonials Tool (Google Sheets), Update Sheets 2 (Google Sheets), Email Agent (optional).  
   - Connect input: From AI Agent node main output.

10. **Add Google Sheets Read Node (Review Calls for Sales Writing Assistant)**  
    - Type: Google Sheets  
    - Name: Review Calls (reuse or separate instance)  
    - Same setup as before.  
    - Connect input: From prior nodes as needed for data reference.

11. **Add Google Sheets Tool (Testimonials Tool)**  
    - Type: Google Sheets Tool (Read)  
    - Name: Testimonials Tool  
    - Document ID: Same Google Sheet or one with testimonials.  
    - Sheet Name: “Success Stories” tab.  
    - Connect input: As AI Tool of Sales Writing Assistant node.

12. **Add OpenAI Chat Model Node (for Sales Writing Assistant)**  
    - Type: Langchain LM Chat OpenAI  
    - Name: OpenAI Chat Model1  
    - Model: GPT-4.1  
    - Credentials: OpenAI API key.  
    - Connect input: From Sales Writing Assistant node languageModel input.

13. **Add Langchain Output Parser Node (Structured Output Parser1)**  
    - Type: Langchain Output Parser  
    - Name: Structured Output Parser1  
    - Schema: JSON with “subject”, “email”, “text_message” fields.  
    - Connect input: From Sales Writing Assistant output.

14. **Add Google Sheets Tool (Update Sheets 2)**  
    - Type: Google Sheets Tool (Update)  
    - Name: Update Sheets 2  
    - Document ID: Same Google Sheet.  
    - Sheet Name: “Meeting Data” tab.  
    - Matching Column: “Email”.  
    - Columns to update: email_subject, email_text, sms.  
    - Values: Extract from Sales Writing Assistant output with `$fromAI()` expressions.  
    - Connect input: As AI Tool of Sales Writing Assistant node.

15. **Add Sticky Notes for Documentation (Optional)**  
    - Add two sticky notes with setup instructions and workflow overview for user guidance.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                    | Context or Link                                                                                     |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Google Sheets OAuth2 credentials must be connected in all Google Sheets nodes to enable read/write operations.                                                                                                                                  | Google Sheets nodes: Review Calls, Product List, Testimonials Tool, Update Sheet, Update Sheets 2. |
| OpenAI API keys are required for GPT-4.1 models used in AI Agent and Sales Writing Assistant nodes.                                                                                                                                             | https://platform.openai.com/                                                                       |
| Replace the Tavily API key placeholder in the Tavily node JSON body with your real API key from https://tavily.com/.                                                                                                                            | https://tavily.com/                                                                                |
| Duplicate the provided mock Google Sheet (ID: 1u3WMJwYGwZewW1IztY8dfbEf5yBQxVh8oH7LQp4rAk4) and update all Google Sheets nodes to point to your copy for proper operation.                                                                           | https://docs.google.com/spreadsheets/d/1u3WMJwYGwZewW1IztY8dfbEf5yBQxVh8oH7LQp4rAk4               |
| The AI Agent strictly requires the Update Sheet tool call to complete its task; skipping this will cause errors or incomplete runs.                                                                                                            | See AI Agent system prompt in node configuration.                                                 |
| Workflow uses GPT-4.1, requiring OpenAI API access with appropriate quota and permissions.                                                                                                                                                       |                                                                                                   |
| The workflow is designed for manual trigger (test mode), but can be connected to real triggers or schedules for automation in production.                                                                                                     |                                                                                                   |
| Personalization and testimonial integration is critical for high engagement in outreach messages. The Sales Writing Assistant node’s prompt enforces this style strictly.                                                                       |                                                                                                   |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.