AI Call Summary + Follow-Up Task to HubSpot

https://n8nworkflows.xyz/workflows/ai-call-summary---follow-up-task-to-hubspot-8966


# AI Call Summary + Follow-Up Task to HubSpot

### 1. Workflow Overview

This workflow automates the process of summarizing sales or discovery calls and managing follow-up tasks within HubSpot CRM. It targets sales and customer success teams who want to quickly log call insights and coordinate next actions without manual data entry.

The workflow logically decomposes into these blocks:

- **1.1 Input Reception:** Captures call transcript and contact email via a form submission.
- **1.2 Contact Lookup:** Searches HubSpot for the contact record matching the submitted email.
- **1.3 AI Processing:** Uses OpenAI GPT-4 via LangChain to analyze the transcript combined with the contact data to generate a concise call summary, a follow-up task description, and suggested updates to contact fields.
- **1.4 Data Parsing & HubSpot Updates:** Parses the AI’s structured JSON output; logs the call summary as a HubSpot engagement; creates a follow-up task in HubSpot; optionally updates the contact’s HubSpot record with inferred missing data.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block collects user input consisting of a contact email and a call transcript via an embedded form trigger.

- **Nodes Involved:**  
  - Form: Capture Transcript  
  - Sticky Note (Get call transcript and contact)

- **Node Details:**  

  - **Form: Capture Transcript**  
    - Type: Form Trigger node  
    - Role: Entry point capturing "Contact email" (email type) and "Paste transcript here" (textarea) from a user form submission.  
    - Configuration: Requires both fields; webhook ID is set for external form integration.  
    - Inputs: None (trigger node)  
    - Outputs: JSON object with 'Contact email' and 'Paste transcript here' fields.  
    - Edge Cases: Missing or malformed email input; excessively long transcripts may cause timeout or memory issues.  
    - Version 2.3

  - **Sticky Note**  
    - Role: Documentation for the user to understand the input step.

---

#### 2.2 Contact Lookup

- **Overview:**  
  Finds the HubSpot contact matching the submitted email to retrieve detailed contact properties for AI context and further processing.

- **Nodes Involved:**  
  - Find Contact by Email

- **Node Details:**  

  - **Find Contact by Email**  
    - Type: HubSpot node (Search operation)  
    - Role: Searches HubSpot contacts by email; retrieves extensive contact properties (e.g., name, job title, company, lifecycle stage, owner ID, timestamps, etc.).  
    - Configuration: OAuth2 authentication; filter on 'email' property equals input email; retrieves a broad set of properties for AI context and updates.  
    - Input: Output from form submission node with contact email.  
    - Output: Contact details JSON or empty if no match.  
    - Edge Cases: No contact found (empty result), OAuth token expiration or permission errors, API rate limits.  
    - Version 2.1

---

#### 2.3 AI Processing

- **Overview:**  
  This core block sends the call transcript and contact data to an OpenAI GPT-4 powered LangChain agent to generate a structured summary, follow-up task, and contact updates.

- **Nodes Involved:**  
  - OpenAI Chat Model  
  - AI: Summarize Call & Draft Task  
  - Parse Structured Output  
  - Sticky Note1 (Add call summary, follow-up task and contact properties)  

- **Node Details:**  

  - **OpenAI Chat Model**  
    - Type: LangChain LM Chat OpenAI node  
    - Role: Provides GPT-4.1-mini model interface for natural language generation.  
    - Configuration: Uses GPT-4 mini variant; no additional options set.  
    - Input: Connected internally to AI agent node (ai_languageModel).  
    - Output: Raw GPT response text.  
    - Edge Cases: API quota or authentication failures, rate limits, model throttling, unexpected output formatting.  
    - Version 1.2

  - **AI: Summarize Call & Draft Task**  
    - Type: LangChain Agent node  
    - Role: Custom prompt-driven agent that receives contact properties and transcript; instructs GPT to:  
      1. Extract call participants, company, role, problems, timelines, metrics.  
      2. Produce a concise 120–160 word summary.  
      3. Create one actionable follow-up task with name and description.  
      4. Suggest updates to missing contact fields (city, country, job title, job function).  
    - Configuration: Prompt includes detailed instructions and output JSON schema; uses contact properties from previous node and transcript from form input.  
    - Input: Contact JSON from "Find Contact by Email" and transcript text from form.  
    - Output: Structured JSON string with Summary, Task name, and Task body.  
    - Edge Cases: AI hallucinations (mitigated by prompt rules), missing or inconsistent data, JSON parsing failures.  
    - Version 2.2

  - **Parse Structured Output**  
    - Type: LangChain Output Parser Structured node  
    - Role: Parses the AI agent’s JSON-formatted output into discrete JSON fields for downstream processing.  
    - Configuration: Uses example JSON schema matching expected AI output.  
    - Input: AI agent raw output JSON string.  
    - Output: Parsed JSON object with keys: Summary, Task name, Task body.  
    - Edge Cases: Parsing errors if AI output deviates from schema, malformed JSON.  
    - Version 1.3

  - **Sticky Note1**  
    - Role: Explains this block’s function—adding call summary, follow-up task, and contact property updates.

---

#### 2.4 Data Parsing & HubSpot Updates

- **Overview:**  
  Logs the AI-generated call summary as a HubSpot call engagement, creates a follow-up task with the AI-provided title/body, and optionally updates the contact record based on AI-inferred fields.

- **Nodes Involved:**  
  - Log Call Summary  
  - Create Follow-Up Task  
  - Update Contact from Transcript  
  - Sticky Note3 (Customization tips)

- **Node Details:**  

  - **Log Call Summary**  
    - Type: HubSpot engagement node (create call)  
    - Role: Logs a completed call engagement in HubSpot with the AI-generated summary as body text.  
    - Configuration: OAuth2 authentication; status set to COMPLETED; associated with contact ID from "Find Contact by Email".  
    - Input: AI parsed output summary field and contact ID.  
    - Output: Engagement creation confirmation.  
    - Edge Cases: Contact ID missing (no contact found), API permission issues, rate limits.  
    - Version 2.1

  - **Create Follow-Up Task**  
    - Type: HubSpot engagement node (create task)  
    - Role: Creates a task engagement in HubSpot assigned to the contact, with AI-generated task name and body, status NOT_STARTED.  
    - Configuration: OAuth2 authentication; associations with contact ID; subject and body from AI JSON fields.  
    - Input: Parsed AI output fields and contact ID.  
    - Output: Task creation confirmation.  
    - Edge Cases: Missing contact ID, API errors, invalid task data.  
    - Version 2.1

  - **Update Contact from Transcript**  
    - Type: HubSpot Tool node  
    - Role: Updates selected contact properties (city, country, job title, job function) based on AI-inferred values derived from transcript analysis.  
    - Configuration: OAuth2 authentication; email input from form; dynamic mapping of fields using $fromAI expressions that link to AI agent’s output overrides.  
    - Input: Contact email and AI-inferred property values.  
    - Output: Contact update confirmation or no-op if no changes.  
    - Edge Cases: Email not found, conflicting updates, token expiry, API limits.  
    - Version 2.1

  - **Sticky Note3**  
    - Role: Offers customization guidance, such as replacing the form with Google Drive integration, extracting audio for transcripts, or adding more contact fields for AI to update.

---

### 3. Summary Table

| Node Name                 | Node Type                              | Functional Role                             | Input Node(s)               | Output Node(s)                 | Sticky Note                                                                                                  |
|---------------------------|--------------------------------------|---------------------------------------------|-----------------------------|-------------------------------|--------------------------------------------------------------------------------------------------------------|
| Form: Capture Transcript   | Form Trigger                         | Capture contact email and call transcript   | None                        | Find Contact by Email          | ## Get call transcript and contact                                                                          |
| Find Contact by Email      | HubSpot (Search)                    | Lookup contact details by email             | Form: Capture Transcript    | AI: Summarize Call & Draft Task |                                                                                                              |
| OpenAI Chat Model          | LangChain LM Chat OpenAI             | Provide GPT-4 model interface                | AI: Summarize Call & Draft Task (ai_languageModel) | AI: Summarize Call & Draft Task (ai_languageModel output) |                                                                                                              |
| AI: Summarize Call & Draft Task | LangChain Agent                 | Analyze transcript + contact; generate summary, task, updates | Find Contact by Email        | Log Call Summary, Update Contact from Transcript | ## Add call summary, follow-up task and contact properties                                                  |
| Parse Structured Output    | LangChain Output Parser Structured   | Parse AI JSON output into usable fields     | AI: Summarize Call & Draft Task (ai_outputParser) | AI: Summarize Call & Draft Task |                                                                                                              |
| Log Call Summary           | HubSpot (Create Call Engagement)    | Log call summary as completed HubSpot call | AI: Summarize Call & Draft Task | Create Follow-Up Task         |                                                                                                              |
| Create Follow-Up Task      | HubSpot (Create Task Engagement)    | Create follow-up task in HubSpot            | Log Call Summary             | None                          | ### 💡 Customizing this workflow - Instead of a form, try using a google drive folder to fetch call transcripts, etc. |
| Update Contact from Transcript | HubSpot Tool                    | Update contact properties from AI inference | AI: Summarize Call & Draft Task (ai_tool) | None                          |                                                                                                              |
| Sticky Note                | Sticky Note                         | Documentation                              | None                        | None                          | ## Get call transcript and contact                                                                          |
| Sticky Note1               | Sticky Note                         | Documentation                              | None                        | None                          | ## Add call summary, follow-up task and contact properties                                                  |
| Sticky Note2               | Sticky Note                         | Documentation (Workflow overview & usage) | None                        | None                          | ## AI Call Summary to HubSpot + Follow-Up Task ... [Full description]                                       |
| Sticky Note3               | Sticky Note                         | Documentation (Customization tips)         | None                        | None                          | ### 💡 Customizing this workflow - Instead of a form, try using a google drive folder to fetch call transcripts, extract audio, add fields, etc. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node: "Form: Capture Transcript"**  
   - Node type: Form Trigger  
   - Configure webhook with a unique ID or generate new webhook URL.  
   - Add fields:  
     - "Contact email" (fieldType: email, required)  
     - "Paste transcript here" (fieldType: textarea, required)  
   - Position near workflow start.

2. **Create HubSpot Node: "Find Contact by Email"**  
   - Node type: HubSpot (Search operation)  
   - Set operation to "search" on contacts.  
   - Authentication: OAuth2 with appropriate HubSpot credentials.  
   - Filter: propertyName = "email", value from previous node `={{ $json['Contact email'] }}`  
   - Retrieve extensive properties: email, firstname, lastname, jobtitle, company, country, state, city, hs_language, phone, mobilephone, lifecyclestage, hs_lead_status, hubspot_owner_id, hs_email_last_open_date, hs_email_last_reply_date, hs_latest_meeting_activity, hs_sequences_is_enrolled, hs_sequences_enrolled_count, createdate, hs_lastmodifieddate, hs_timezone, notes_last_contacted, hs_object_id.  
   - Connect output from Form node input.

3. **Create LangChain LM Chat OpenAI Node: "OpenAI Chat Model"**  
   - Node type: LangChain LM Chat OpenAI  
   - Select GPT-4.1-mini model.  
   - No additional options.  
   - This node will be connected internally by the Agent node.

4. **Create LangChain Agent Node: "AI: Summarize Call & Draft Task"**  
   - Node type: LangChain Agent  
   - Configure prompt:  
     - Inputs:  
       - Contact info: `{{ JSON.stringify($json.properties) }}` from "Find Contact by Email" node  
       - Call transcript: `{{ $('Form: Capture Transcript').item.json['Paste transcript here'] }}`  
     - Instructions: Extract participants, company, role, problems, timeline, metrics; write 120–160 word summary; create one follow-up task; update missing contact info.  
     - Rules: Be factual, do not invent, use normalized dates, keep spelling, concise language, output JSON only in the specified format.  
   - Connect "Find Contact by Email" output to this node as main input.  
   - Configure AI model input to "OpenAI Chat Model" node (ai_languageModel input).  
   - Enable output parsing.

5. **Create LangChain Output Parser Structured Node: "Parse Structured Output"**  
   - Node type: LangChain Output Parser Structured  
   - Provide JSON schema example matching AI output: Summary, Task name, Task body.  
   - Connect agent output (ai_outputParser) to this node.

6. **Create HubSpot Engagement Node: "Log Call Summary"**  
   - Node type: HubSpot Engagement (Create call)  
   - Set type to Call, status COMPLETED.  
   - Body content from parsed AI output: `={{ $json.output.Summary }}`  
   - Associate with contactId from "Find Contact by Email": `={{ $('Find Contact by Email').item.json.id }}`  
   - OAuth2 authentication configured.  
   - Connect main output from agent node to this node.

7. **Create HubSpot Engagement Node: "Create Follow-Up Task"**  
   - Node type: HubSpot Engagement (Create task)  
   - Set type to Task, status NOT_STARTED.  
   - Subject: `={{ $('AI: Summarize Call & Draft Task').item.json.output['Task name'] }}`  
   - Body: `={{ $('AI: Summarize Call & Draft Task').item.json.output['Task body'] }}`  
   - Associate with contactId from "Find Contact by Email".  
   - OAuth2 authentication configured.  
   - Connect output from "Log Call Summary" node.

8. **Create HubSpot Tool Node: "Update Contact from Transcript"**  
   - Node type: HubSpot Tool (Update Contact)  
   - Email: `={{ $('Form: Capture Transcript').item.json['Contact email'] }}`  
   - Authentication: OAuth2 configured.  
   - Map fields city, country, jobTitle, jobFunction dynamically using AI overrides:  
     - city: `$fromAI('City', 'Update this if the prospect mentions the city', 'string')`  
     - country: `$fromAI('Country_Region', 'Update this if the prospect mentions the country', 'string')`  
     - jobTitle: `$fromAI('Job_Title', 'Update this if the prospect mentions their job title', 'string')`  
     - jobFunction: `$fromAI('Job_Function', 'Update this if the prospect mentions their job function', 'string')`  
   - Connect ai_tool output from the Agent node.

9. **Add Sticky Notes for Documentation**  
   - Create three sticky notes with content explaining the overall workflow, input reception, AI processing, and customization tips, positioning them near related nodes for user clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow automates logging calls and creating follow-up tasks in HubSpot using AI-generated summaries and tasks. | Main project description within Sticky Note2 node in the workflow.                             |
| Customization tips include replacing the form with Google Drive folder trigger and adding audio extraction steps.    | Sticky Note3: https://example.com/customization-tips (replace with actual project blog link).  |
| Ensure HubSpot OAuth2 credentials have sufficient scope for contact read/write and engagement creation.               | HubSpot developer docs: https://developers.hubspot.com/docs/api/overview                       |
| OpenAI GPT-4.1-mini is used for cost-effective summarization but can be replaced with other GPT-4 models if desired.  | OpenAI API docs: https://platform.openai.com/docs/models/gpt-4                                |

---

**Disclaimer:**  
The provided content is derived exclusively from an n8n automation workflow. It complies fully with content policies and contains no illegal or protected data. All processed data is legal and publicly accessible.