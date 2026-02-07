AI Data Extraction with Dynamic Prompts and Airtable

https://n8nworkflows.xyz/workflows/ai-data-extraction-with-dynamic-prompts-and-airtable-2771


# AI Data Extraction with Dynamic Prompts and Airtable

### 1. Workflow Overview

This workflow implements a dynamic AI-driven data extraction pattern integrated with Airtable, designed to extract flexible and user-defined attributes from documents (PDF resumes in this example). It leverages Airtable’s field descriptions as dynamic prompts for an LLM (OpenAI) to extract relevant data from uploaded files, updating Airtable records automatically upon changes.

The workflow is logically divided into these blocks:

- **1.1 Webhook and Event Reception:** Receives Airtable webhook events for row or field changes.
- **1.2 Event Parsing and Routing:** Parses incoming events and routes processing based on event type (row updated, field created, or field updated).
- **1.3 Schema and Prompt Extraction:** Retrieves Airtable table schema and extracts field descriptions to use as dynamic AI prompts.
- **1.4 Row and Field Filtering:** Filters rows and fields to process only those with valid inputs or descriptions.
- **1.5 Data Extraction Loop:** For each relevant row and/or field, downloads the file, extracts text, and runs the LLM prompt to generate extracted data.
- **1.6 Airtable Record Update:** Updates Airtable records with the extracted data, either for specific fields or entire rows.
- **1.7 Airtable Webhook Setup (Mini-flow):** A separate mini-flow to create and manage Airtable webhooks for this integration.

---

### 2. Block-by-Block Analysis

#### 1.1 Webhook and Event Reception

- **Overview:** Listens for incoming webhook POST requests from Airtable notifying about changes in rows or fields.
- **Nodes Involved:**  
  - `Airtable Webhook`
  - `Get Webhook Payload`

- **Node Details:**

  - **Airtable Webhook**  
    - Type: Webhook  
    - Role: Entry point for Airtable change events (row or field updates).  
    - Config: HTTP POST method, unique webhook path.  
    - Inputs: External HTTP POST from Airtable.  
    - Outputs: JSON payload with event data.  
    - Edge Cases: Missing or malformed webhook payloads; unauthorized requests if webhook URL is exposed.

  - **Get Webhook Payload**  
    - Type: HTTP Request  
    - Role: Fetches detailed webhook payloads from Airtable API using webhook and base IDs.  
    - Config: Uses Airtable Personal Access Token credential; URL dynamically built from webhook data.  
    - Inputs: Output from `Get Prompt Fields` (for schema) and webhook data.  
    - Outputs: JSON with payloads array.  
    - Edge Cases: API rate limits, invalid credentials, network errors.

---

#### 1.2 Event Parsing and Routing

- **Overview:** Parses the webhook payload to identify event type and relevant IDs, then routes processing accordingly.
- **Nodes Involved:**  
  - `Parse Event` (Code)  
  - `Event Type` (Switch)  
  - `Event Ref` (NoOp)  
  - `Event Ref1` (NoOp)

- **Node Details:**

  - **Parse Event**  
    - Type: Code  
    - Role: Extracts event type (`row.updated`, `field.created`, `field.updated`), base ID, table ID, field ID, and row ID from webhook payload.  
    - Key Expressions: Uses helper functions to detect event type and extract IDs.  
    - Inputs: JSON from `Get Webhook Payload` and schema from `Get Prompt Fields`.  
    - Outputs: Structured JSON with event metadata.  
    - Edge Cases: Unknown event types, missing fields, empty payloads.

  - **Event Type**  
    - Type: Switch  
    - Role: Routes workflow based on event type to handle row updates or field changes differently.  
    - Config: Matches event_type field to three cases (`row.updated`, `field.created`, `field.updated`).  
    - Inputs: Output from `Parse Event`.  
    - Outputs: Three branches for each event type.  
    - Edge Cases: Unhandled event types lead to no output.

  - **Event Ref / Event Ref1**  
    - Type: NoOp  
    - Role: Placeholder nodes to hold event reference data for downstream nodes.  
    - Inputs: Routed from `Event Type`.  
    - Outputs: Pass-through of event metadata.  
    - Edge Cases: None.

---

#### 1.3 Schema and Prompt Extraction

- **Overview:** Retrieves Airtable table schema and extracts fields with descriptions to use as dynamic prompts.
- **Nodes Involved:**  
  - `Get Table Schema` (and `Get Table Schema1`)  
  - `Get Prompt Fields` (Code)

- **Node Details:**

  - **Get Table Schema / Get Table Schema1**  
    - Type: Airtable  
    - Role: Fetches the schema of the Airtable base to get field metadata including descriptions.  
    - Config: Uses base ID from webhook or set variables; requires Airtable Personal Access Token.  
    - Inputs: Event metadata or set variables.  
    - Outputs: JSON schema of the base.  
    - Edge Cases: API errors, invalid base ID, token expiration.

  - **Get Prompt Fields**  
    - Type: Code  
    - Role: Filters fields with non-empty descriptions and maps their id, name, type, and description for use as prompts.  
    - Inputs: Output from `Get Table Schema`.  
    - Outputs: JSON array of prompt fields.  
    - Edge Cases: No fields with descriptions, malformed schema.

---

#### 1.4 Row and Field Filtering

- **Overview:** Filters rows and fields to process only those with valid input files or prompt descriptions.
- **Nodes Involved:**  
  - `Filter Valid Rows`  
  - `Filter Valid Fields`  
  - `Fetch Records`  
  - `Get Row`

- **Node Details:**

  - **Filter Valid Rows**  
    - Type: Filter  
    - Role: Filters rows that have a non-empty file URL in the input field (e.g., "File").  
    - Inputs: Rows from Airtable.  
    - Outputs: Rows with valid files only.  
    - Edge Cases: Rows missing files, empty URLs.

  - **Filter Valid Fields**  
    - Type: Filter  
    - Role: Filters fields that have a non-empty description (prompt).  
    - Inputs: Fields from schema.  
    - Outputs: Fields with prompts.  
    - Edge Cases: Fields without descriptions.

  - **Fetch Records**  
    - Type: Airtable  
    - Role: Retrieves all records from the table where the input field is populated (filter formula).  
    - Inputs: Base and table IDs.  
    - Outputs: Records with files.  
    - Edge Cases: Large datasets causing pagination issues.

  - **Get Row**  
    - Type: Airtable  
    - Role: Retrieves a single row by ID for processing.  
    - Inputs: Row ID from event.  
    - Outputs: Full row data.  
    - Edge Cases: Missing or deleted rows.

---

#### 1.5 Data Extraction Loop

- **Overview:** Iterates over rows and fields, downloads files, extracts text, and uses LLM to generate extracted values based on dynamic prompts.
- **Nodes Involved:**  
  - `Loop Over Items` and `Loop Over Items1` (SplitInBatches)  
  - `Row Reference` and `Row Ref` (NoOp)  
  - `Get File Data` and `Get File Data1` (HTTP Request)  
  - `Extract from File` and `Extract from File1` (ExtractFromFile)  
  - `Generate Field Value` and `Generate Field Value1` (LangChain LLM)  
  - `Get Result` and `Get Result1` (Set)  
  - `Fields to Update` (Code)  
  - `Add Row ID to Payload` (Set)

- **Node Details:**

  - **Loop Over Items / Loop Over Items1**  
    - Type: SplitInBatches  
    - Role: Processes one row at a time for better user experience and rate limiting.  
    - Inputs: List of rows or fields.  
    - Outputs: Single row or field per iteration.  
    - Edge Cases: Large batch sizes can cause delays.

  - **Row Reference / Row Ref**  
    - Type: NoOp  
    - Role: Holds current row data for downstream nodes.  
    - Inputs: From loops.  
    - Outputs: Pass-through.  
    - Edge Cases: None.

  - **Get File Data / Get File Data1**  
    - Type: HTTP Request  
    - Role: Downloads the file (PDF) from the URL in the row’s input field.  
    - Inputs: File URL from row data.  
    - Outputs: Binary file data.  
    - Edge Cases: Broken URLs, network errors, large files.

  - **Extract from File / Extract from File1**  
    - Type: ExtractFromFile  
    - Role: Extracts text content from the PDF file.  
    - Inputs: Binary file data.  
    - Outputs: Extracted text.  
    - Edge Cases: Unsupported file formats, corrupted PDFs.

  - **Generate Field Value / Generate Field Value1**  
    - Type: LangChain Chain LLM  
    - Role: Sends extracted text and dynamic prompt to LLM to generate the field value.  
    - Configuration:  
      - Prompt includes the file text wrapped in `<file>` tags.  
      - Dynamic prompt from field description.  
      - Output format from field type.  
      - Instruction to keep answer short and return "n/a" if data not found.  
    - Inputs: Extracted text, field description, and type.  
    - Outputs: LLM-generated text value.  
    - Credentials: OpenAI API key.  
    - Edge Cases: API rate limits, timeouts, ambiguous prompts.

  - **Get Result / Get Result1**  
    - Type: Set  
    - Role: Prepares output data for Airtable update, mapping field name to generated value.  
    - Inputs: LLM output, row ID, field name.  
    - Outputs: JSON with updated field values.  
    - Edge Cases: Missing LLM output.

  - **Fields to Update**  
    - Type: Code  
    - Role: Determines which fields are missing values in the current row and need updating.  
    - Inputs: Current row and prompt fields.  
    - Outputs: List of missing fields.  
    - Edge Cases: All fields present, no missing fields.

  - **Add Row ID to Payload**  
    - Type: Set  
    - Role: Combines all generated field values with the row ID for bulk update.  
    - Inputs: Multiple LLM outputs.  
    - Outputs: JSON object for update.  
    - Edge Cases: Conflicting field names.

---

#### 1.6 Airtable Record Update

- **Overview:** Updates Airtable records with extracted data, either for a single field or multiple fields.
- **Nodes Involved:**  
  - `Update Row`  
  - `Update Record`

- **Node Details:**

  - **Update Row**  
    - Type: Airtable  
    - Role: Updates a single Airtable record with new field values generated by the LLM.  
    - Config: Uses base and table IDs from event metadata; auto-maps input data fields.  
    - Inputs: JSON with record ID and updated fields.  
    - Outputs: Updated record confirmation.  
    - Edge Cases: API errors, invalid record ID.

  - **Update Record**  
    - Type: Airtable  
    - Role: Similar to `Update Row`, used in the field update branch to update records after generating values for changed fields.  
    - Inputs: Combined payload with row ID and updated fields.  
    - Edge Cases: Same as above.

---

#### 1.7 Airtable Webhook Setup (Mini-flow)

- **Overview:** Provides nodes to create Airtable webhooks for table data and field changes to enable event-driven updates.
- **Nodes Involved:**  
  - `When clicking ‘Test workflow’` (Manual Trigger)  
  - `Set Airtable Vars` (Set)  
  - `Get Table Schema1` (Airtable)  
  - `Get "Input" Field` (Set)  
  - `RecordsChanged Webhook` (HTTP Request)  
  - `FieldsChanged Webhook` (HTTP Request)

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Starts the mini-flow for webhook creation manually.  
    - Edge Cases: None.

  - **Set Airtable Vars**  
    - Type: Set  
    - Role: Stores user-configurable variables such as base ID, table ID, webhook URL, and input field name.  
    - Inputs: Manual or preset values.  
    - Outputs: Variables for downstream nodes.  
    - Edge Cases: Incorrect IDs cause webhook creation failure.

  - **Get Table Schema1**  
    - Type: Airtable  
    - Role: Retrieves schema to identify input field ID.  
    - Inputs: Base ID from variables.  
    - Outputs: Schema JSON.  
    - Edge Cases: API errors.

  - **Get "Input" Field**  
    - Type: Set  
    - Role: Extracts the input field metadata (e.g., "File") from schema for webhook filter setup.  
    - Inputs: Schema JSON.  
    - Outputs: Field object with ID.  
    - Edge Cases: Input field not found.

  - **RecordsChanged Webhook**  
    - Type: HTTP Request  
    - Role: Creates webhook for record updates filtered by input field changes.  
    - Inputs: Variables and input field ID.  
    - Outputs: Webhook creation response.  
    - Edge Cases: API limits, invalid URLs.

  - **FieldsChanged Webhook**  
    - Type: HTTP Request  
    - Role: Creates webhook for field additions or updates in the table.  
    - Inputs: Variables.  
    - Outputs: Webhook creation response.  
    - Edge Cases: Same as above.

---

### 3. Summary Table

| Node Name               | Node Type                         | Functional Role                          | Input Node(s)                  | Output Node(s)                | Sticky Note                                                                                                                       |
|-------------------------|----------------------------------|----------------------------------------|-------------------------------|------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Airtable Webhook        | Webhook                          | Entry point for Airtable webhook events| —                             | Get Table Schema              | See Sticky Note3 for overall workflow explanation and video links                                                                |
| Get Webhook Payload     | HTTP Request                    | Fetches detailed webhook payload       | Get Prompt Fields              | Parse Event                   |                                                                                                                                  |
| Parse Event             | Code                            | Parses event type and IDs               | Get Webhook Payload            | Event Type                   |                                                                                                                                  |
| Event Type              | Switch                          | Routes workflow by event type           | Parse Event                   | Event Ref, Event Ref1         | Sticky Note4 explains event routing pattern                                                                                      |
| Event Ref               | NoOp                            | Holds event metadata for row events     | Event Type                    | Filter Valid Fields           |                                                                                                                                  |
| Event Ref1              | NoOp                            | Holds event metadata for field events   | Event Type                    | Get Row                      |                                                                                                                                  |
| Get Table Schema        | Airtable                        | Retrieves Airtable base schema           | Airtable Webhook              | Get Prompt Fields             | Sticky Note (Sticky Note) 1 explains Airtable node usage                                                                         |
| Get Prompt Fields       | Code                            | Extracts fields with descriptions       | Get Table Schema              | Get Webhook Payload           |                                                                                                                                  |
| Filter Valid Rows       | Filter                         | Filters rows with valid file URLs       | Get Row                      | Loop Over Items1              | Sticky Note7 explains filtering rows with valid input                                                                            |
| Filter Valid Fields     | Filter                         | Filters fields with descriptions        | Event Ref                    | Fetch Records                 | Sticky Note10 explains filtering fields                                                                                          |
| Fetch Records           | Airtable                       | Fetches records with input field populated| Filter Valid Fields           | Loop Over Items               |                                                                                                                                  |
| Get Row                 | Airtable                       | Retrieves single row by ID               | Event Ref1                   | Filter Valid Rows             |                                                                                                                                  |
| Loop Over Items         | SplitInBatches                 | Processes rows one at a time             | Fetch Records, Update Row     | Row Reference                | Sticky Note9 explains use of split in batches for user experience                                                                |
| Loop Over Items1        | SplitInBatches                 | Processes rows one at a time             | Filter Valid Rows, Update Record | Row Ref                    | Sticky Note12 explains split in batches usage                                                                                     |
| Row Reference           | NoOp                           | Holds current row data                   | Loop Over Items               | Get File Data                 |                                                                                                                                  |
| Row Ref                 | NoOp                           | Holds current row data                   | Loop Over Items1              | Get File Data1                |                                                                                                                                  |
| Get File Data           | HTTP Request                   | Downloads file from URL                   | Row Reference                | Extract from File             | Sticky Note11 explains file download and extraction                                                                              |
| Get File Data1          | HTTP Request                   | Downloads file from URL                   | Row Ref                      | Extract from File1            |                                                                                                                                  |
| Extract from File       | ExtractFromFile                | Extracts text from PDF                    | Get File Data                | Generate Field Value          | Sticky Note11                                                                                                                    |
| Extract from File1      | ExtractFromFile                | Extracts text from PDF                    | Get File Data1               | Fields to Update              |                                                                                                                                  |
| Generate Field Value    | LangChain Chain LLM            | Runs LLM prompt to generate field value | Extract from File            | Get Result                   | Sticky Note11 explains LLM usage for generating values                                                                           |
| Generate Field Value1   | LangChain Chain LLM            | Runs LLM prompt to generate field value | Extract from File1           | Get Result1                  |                                                                                                                                  |
| Get Result              | Set                            | Prepares update payload for Airtable    | Generate Field Value         | Update Row                   | Sticky Note6 explains updating Airtable record                                                                                   |
| Get Result1             | Set                            | Prepares update payload for Airtable    | Generate Field Value1        | Add Row ID to Payload        | Sticky Note13 explains updating Airtable record for field changes                                                               |
| Fields to Update        | Code                           | Identifies missing fields to update      | Extract from File1           | Generate Field Value1        |                                                                                                                                  |
| Add Row ID to Payload   | Set                            | Combines field values with row ID        | Get Result1                  | Update Record                |                                                                                                                                  |
| Update Row              | Airtable                       | Updates Airtable record                   | Get Result                   | Loop Over Items              | Sticky Note7                                                                                                                    |
| Update Record           | Airtable                       | Updates Airtable record                   | Add Row ID to Payload        | Loop Over Items1             | Sticky Note13                                                                                                                   |
| Set Airtable Vars       | Set                            | Stores user variables for webhook setup  | When clicking ‘Test workflow’ | Get Table Schema1, FieldsChanged Webhook | Sticky Note14 explains webhook creation                                                                                         |
| Get Table Schema1       | Airtable                       | Retrieves schema for webhook setup        | Set Airtable Vars            | Get "Input" Field            | Sticky Note14                                                                                                                   |
| Get "Input" Field       | Set                            | Extracts input field info for webhook setup| Get Table Schema1            | RecordsChanged Webhook       | Sticky Note14                                                                                                                   |
| RecordsChanged Webhook  | HTTP Request                   | Creates webhook for record changes         | Get "Input" Field            | —                           | Sticky Note14                                                                                                                   |
| FieldsChanged Webhook   | HTTP Request                   | Creates webhook for field changes          | Set Airtable Vars            | —                           | Sticky Note14                                                                                                                   |
| When clicking ‘Test workflow’ | Manual Trigger            | Starts webhook creation mini-flow          | —                           | Set Airtable Vars            | Sticky Note14                                                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - Method: POST  
   - Path: Unique identifier (e.g., `a82f0ae7-678e-49d9-8219-7281e8a2a1b2`)  
   - Purpose: Receive Airtable webhook events.

2. **Add Airtable Node to Get Table Schema**  
   - Operation: Get Schema  
   - Base ID: From webhook payload or variable  
   - Credential: Airtable Personal Access Token  
   - Purpose: Retrieve table schema including field descriptions.

3. **Add Code Node to Extract Prompt Fields**  
   - Script: Filter fields with non-empty descriptions and map id, name, type, description.  
   - Input: Output from Get Table Schema.  
   - Output: List of prompt fields.

4. **Add HTTP Request Node to Get Webhook Payload**  
   - URL: `https://api.airtable.com/v0/bases/{{baseId}}/webhooks/{{webhookId}}/payloads`  
   - Credential: Airtable Personal Access Token  
   - Input: Output from Get Prompt Fields (for schema), webhook data.  
   - Purpose: Retrieve detailed webhook payloads.

5. **Add Code Node to Parse Event**  
   - Script: Extract event type (`row.updated`, `field.created`, `field.updated`), baseId, tableId, fieldId, rowId.  
   - Input: Webhook payload JSON.  
   - Output: Structured event metadata.

6. **Add Switch Node to Route by Event Type**  
   - Cases: `row.updated`, `field.created`, `field.updated`  
   - Input: Parsed event metadata.

7. **For `row.updated` branch:**  
   - Add NoOp node to hold event ref.  
   - Add Airtable node to Get Row by rowId.  
   - Add Filter node to keep rows with valid file URLs in input field.  
   - Add SplitInBatches node to process rows one at a time.  
   - Add NoOp node to hold current row.  
   - Add HTTP Request node to download file from URL.  
   - Add ExtractFromFile node to extract text from PDF.  
   - Add Code node to identify missing fields (fields with description but empty in row).  
   - Add SplitInBatches node to loop over missing fields.  
   - Add LangChain Chain LLM node to generate field value:  
     - Prompt includes extracted text wrapped in `<file>` tags.  
     - Dynamic prompt from field description.  
     - Output format from field type.  
     - Instruction to keep answer short and return "n/a" if not found.  
     - Credential: OpenAI API key.  
   - Add Set node to prepare update payload with field name and generated value.  
   - Add Airtable node to update record with new field value.  
   - Loop back to next field, then next row.

8. **For `field.created` and `field.updated` branches:**  
   - Add NoOp node to hold event ref.  
   - Add Airtable node to fetch all records with input field populated (filter formula).  
   - Add SplitInBatches node to process each row.  
   - Add NoOp node to hold current row.  
   - Add HTTP Request node to download file.  
   - Add ExtractFromFile node to extract text.  
   - Add LangChain Chain LLM node to generate value for the changed field only.  
   - Add Set node to prepare update payload.  
   - Add Set node to add row ID to payload.  
   - Add Airtable node to update record.  
   - Loop back to next row.

9. **Create Mini-flow for Airtable Webhook Setup:**  
   - Manual Trigger node to start.  
   - Set node to store variables: base ID, table ID, webhook URL, input field name.  
   - Airtable node to get schema for base.  
   - Set node to extract input field metadata.  
   - HTTP Request node to create webhook for record changes filtered by input field.  
   - HTTP Request node to create webhook for field changes (add/update).  
   - Credential: Airtable Personal Access Token.

10. **Configure Credentials:**  
    - Airtable Personal Access Token with appropriate permissions.  
    - OpenAI API key for LLM nodes.

11. **Test Workflow:**  
    - Publish workflow and expose webhook URL to Airtable.  
    - Run mini-flow to create webhooks in Airtable.  
    - Test by updating rows or fields in Airtable and observe automatic extraction and updates.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                      | Context or Link                                                                                          |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| This workflow demonstrates the **Dynamic Prompts** AI pattern where prompts live outside the template in Airtable field descriptions, enabling flexible and maintainable data extraction.                                                                                                                                                                         | Workflow description                                                                                   |
| Video demo for n8n Studio showcasing this workflow: https://www.youtube.com/watch?v=_fNAD1u8BZw                                                                                                                                                                                                                                                                   | Video demo link                                                                                         |
| Example Airtable base used in this workflow: https://airtable.com/appAyH3GCBJ56cfXl/shrXzR1Tj99kuQbyL                                                                                                                                                                                                                                                            | Airtable example                                                                                        |
| Baserow version of this workflow available here: https://n8n.io/workflows/2780-ai-data-extraction-with-dynamic-prompts-and-baserow/                                                                                                                                                                                                                                | Alternative workflow                                                                                     |
| Airtable webhooks expire after 7 days if inactive; re-creation is necessary. See Airtable webhook developer docs: https://airtable.com/developers/web/api/webhooks-overview                                                                                                                                                                                       | Sticky Note14 and webhook setup notes                                                                  |
| Airtable node documentation: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.airtable/                                                                                                                                                                                                                                                        | Sticky Note1                                                                                           |
| Switch node documentation: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.switch/                                                                                                                                                                                                                                                           | Sticky Note4                                                                                           |
| SplitInBatches node documentation: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.splitinbatches/                                                                                                                                                                                                                                            | Sticky Note9 and Sticky Note12                                                                          |
| Filter node documentation: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.filter                                                                                                                                                                                                                                                            | Sticky Note10                                                                                          |
| ExtractFromFile node documentation: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.extractfromfile/                                                                                                                                                                                                                                          | Sticky Note11                                                                                          |
| LangChain LLM node documentation: https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm/                                                                                                                                                                                                                                | Sticky Note11                                                                                          |
| Join n8n community for help: Discord https://discord.com/invite/XPKeKXeB7d, Forum https://community.n8n.io/                                                                                                                                                                                                                                                        | Workflow description                                                                                   |
| Airtable branding image used in sticky notes: ![airtable.io](https://res.cloudinary.com/daglih2g8/image/upload/f_auto,q_auto/v1/n8n-workflows/airtable_logo)                                                                                                                                                                                                       | Sticky Note6                                                                                           |

---

This documentation fully describes the workflow’s structure, logic, and configuration to enable reproduction, modification, and troubleshooting by advanced users or AI agents.