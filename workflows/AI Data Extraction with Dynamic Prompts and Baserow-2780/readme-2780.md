AI Data Extraction with Dynamic Prompts and Baserow

https://n8nworkflows.xyz/workflows/ai-data-extraction-with-dynamic-prompts-and-baserow-2780


# AI Data Extraction with Dynamic Prompts and Baserow

### 1. Workflow Overview

This workflow implements a dynamic AI-driven data extraction pattern for Baserow tables, designed to flexibly extract structured data from unstructured inputs such as PDFs. It leverages Baserow’s field descriptions as dynamic prompts to instruct an LLM (OpenAI) on what data to extract from an input file (e.g., a resume PDF). The workflow reacts to Baserow webhook events for row updates and field (column) creations or updates, enabling automatic and adaptive extraction without modifying the workflow itself.

**Target Use Cases:**  
- Automated extraction of structured data from documents (e.g., resumes) stored in Baserow tables.  
- Use cases where extraction attributes are dynamic and user-defined via Baserow field descriptions.  
- Scenarios requiring minimal maintenance and high reusability across multiple tables or schemas.

**Logical Blocks:**  
- **1.1 Webhook Event Reception:** Receives Baserow webhook events for row or field changes.  
- **1.2 Event Routing:** Routes events based on type (row updated, field created, field updated).  
- **1.3 Schema Retrieval & Prompt Extraction:** Fetches table schema and extracts field descriptions as dynamic prompts.  
- **1.4 Row Filtering & Preparation:** Filters rows with valid input files and prepares them for processing.  
- **1.5 Data Extraction Loop (Row-based):** For row update events, extracts data for missing fields using LLM and updates the row.  
- **1.6 Data Extraction Loop (Field-based):** For field creation/update events, extracts data for all rows under the field and updates them.  
- **1.7 LLM Integration & PDF Processing:** Downloads PDFs, extracts text, and generates field values using OpenAI LLM with dynamic prompts.  
- **1.8 Row Update:** Updates Baserow rows with extracted data.

---

### 2. Block-by-Block Analysis

#### 1.1 Webhook Event Reception

- **Overview:**  
  Listens for incoming webhook POST requests from Baserow containing event data about table changes.

- **Nodes Involved:**  
  - Baserow Event

- **Node Details:**  
  - **Baserow Event**  
    - Type: Webhook  
    - Role: Entry point for Baserow webhook events (row updated, field created, field updated).  
    - Configuration: HTTP POST method, unique webhook path.  
    - Inputs: External HTTP POST from Baserow.  
    - Outputs: JSON event payload with event_type and body.  
    - Edge cases: Invalid webhook calls, malformed payloads, unauthorized access if webhook URL is exposed.  
    - No sub-workflows invoked.

#### 1.2 Event Routing

- **Overview:**  
  Routes the incoming event to different branches depending on event type to handle row updates or field changes separately.

- **Nodes Involved:**  
  - Get Event Body  
  - Event Type  
  - Event Ref  
  - Event Ref1

- **Node Details:**  
  - **Get Event Body**  
    - Type: Set  
    - Role: Extracts the `body` property from the webhook event JSON for easier access downstream.  
    - Configuration: Sets JSON to `{{$node["Baserow Event"].json.body}}`.  
    - Input: Baserow Event output.  
    - Output: Event body JSON.  
    - Edge cases: Missing or malformed body property.  
  - **Event Type**  
    - Type: Switch  
    - Role: Routes based on `event_type` field (`rows.updated`, `field.created`, `field.updated`).  
    - Configuration: Checks event_type string equality.  
    - Input: Get Event Body output.  
    - Outputs: Three outputs named after event types.  
    - Edge cases: Unknown event types, case sensitivity issues.  
  - **Event Ref / Event Ref1**  
    - Type: NoOp  
    - Role: Reference nodes to branch workflow for clarity and connection management.  
    - Inputs: Event Type outputs.  
    - Outputs: Forward data to next steps.

#### 1.3 Schema Retrieval & Prompt Extraction

- **Overview:**  
  Retrieves the table schema from Baserow API and extracts fields that have descriptions (used as dynamic prompts).

- **Nodes Involved:**  
  - Table Fields API  
  - Get Prompt Fields

- **Node Details:**  
  - **Table Fields API**  
    - Type: HTTP Request  
    - Role: Calls Baserow API to get all fields for the table specified in the event body.  
    - Configuration: GET request to `https://api.baserow.io/api/database/fields/table/{{table_id}}/` with query param `user_field_names=true`.  
    - Authentication: HTTP Header Auth with Baserow credentials.  
    - Input: Baserow Event JSON body with `table_id`.  
    - Output: JSON array of fields with metadata including descriptions.  
    - Edge cases: API errors, auth failures, rate limits, missing table_id.  
  - **Get Prompt Fields**  
    - Type: Code  
    - Role: Filters fields to those with non-empty descriptions (prompts).  
    - Configuration: JavaScript filters input items for fields with `description` property.  
    - Input: Table Fields API output.  
    - Output: JSON object with array `fields` containing id, order, name, description.  
    - Edge cases: No fields with descriptions, empty descriptions, malformed data.

#### 1.4 Row Filtering & Preparation

- **Overview:**  
  Filters rows to process only those with valid input files (e.g., PDF URLs) and prepares them for extraction.

- **Nodes Involved:**  
  - Filter Valid Fields  
  - List Table API  
  - Get Valid Rows  
  - Filter Valid Rows  
  - Get Row  
  - Rows to List  
  - Split Out  
  - Split In Batches (Loop Over Items, Loop Over Items1)

- **Node Details:**  
  - **Filter Valid Fields**  
    - Type: Filter  
    - Role: Filters fields that have a non-empty description (dynamic prompt).  
    - Input: Event Ref output.  
    - Output: Only fields with descriptions.  
  - **List Table API**  
    - Type: HTTP Request  
    - Role: Lists rows from Baserow table with pagination and filters for rows where the "File" field is not empty.  
    - Configuration: GET request to `https://api.baserow.io/api/database/rows/table/{{table_id}}/` with filters on "File" field.  
    - Authentication: Baserow HTTP Header Auth.  
    - Edge cases: Pagination limits, API errors, empty results.  
  - **Get Valid Rows**  
    - Type: Code  
    - Role: Flattens paginated results into a single array of rows with data.  
  - **Filter Valid Rows**  
    - Type: Filter  
    - Role: Filters rows that have a valid file URL in the "File" field.  
  - **Get Row**  
    - Type: HTTP Request  
    - Role: Retrieves full row data by row ID to check which fields need updating.  
  - **Rows to List**  
    - Type: Split Out  
    - Role: Splits array of rows into individual items for processing.  
  - **Split In Batches (Loop Over Items, Loop Over Items1)**  
    - Type: Split In Batches  
    - Role: Processes rows one at a time for better user experience and API rate management.  
    - Edge cases: Large datasets may require pagination tuning.

#### 1.5 Data Extraction Loop (Row-based)

- **Overview:**  
  For row update events, extracts missing field values using the LLM and updates the row accordingly.

- **Nodes Involved:**  
  - Fields to Update  
  - Generate Field Value1  
  - Get Result1  
  - Update Row1  
  - Row Ref  
  - Get File Data1  
  - Extract from File1  
  - OpenAI Chat Model (linked to Generate Field Value1)

- **Node Details:**  
  - **Fields to Update**  
    - Type: Code  
    - Role: Determines which fields with prompts are missing values in the current row.  
  - **Generate Field Value1**  
    - Type: Chain LLM (LangChain)  
    - Role: Sends extracted PDF text and prompt to OpenAI to generate the field value.  
    - Configuration: Uses prompt template with file text and field description.  
    - Edge cases: LLM timeouts, API limits, ambiguous prompts.  
  - **Get Result1**  
    - Type: Set  
    - Role: Formats LLM output into `{field: fieldName, value: extractedValue}` for update.  
  - **Update Row1**  
    - Type: HTTP Request  
    - Role: PATCH request to update the Baserow row with extracted field values.  
    - Configuration: Uses row ID and table ID from event, sends JSON body with field updates.  
    - Edge cases: API errors, partial updates, concurrent edits.  
  - **Row Ref**  
    - Type: NoOp  
    - Role: Reference node for current row data.  
  - **Get File Data1**  
    - Type: HTTP Request  
    - Role: Downloads the PDF file from the URL in the "File" field.  
  - **Extract from File1**  
    - Type: Extract From File  
    - Role: Extracts text content from the PDF for LLM input.  
  - **OpenAI Chat Model**  
    - Type: LLM Chat (OpenAI)  
    - Role: Executes the LLM call for data extraction.

#### 1.6 Data Extraction Loop (Field-based)

- **Overview:**  
  For field creation or update events, extracts values for all rows under the affected field and updates them.

- **Nodes Involved:**  
  - List Table API  
  - Get Valid Rows  
  - Loop Over Items  
  - Row Reference  
  - Get File Data  
  - Extract from File  
  - Generate Field Value  
  - Get Result  
  - Update Row  
  - OpenAI Chat Model1 (linked to Generate Field Value)

- **Node Details:**  
  - **List Table API** and **Get Valid Rows** as above, to get rows with valid files.  
  - **Loop Over Items**  
    - Processes each row individually.  
  - **Row Reference**  
    - Holds current row context.  
  - **Get File Data**  
    - Downloads PDF for current row.  
  - **Extract from File**  
    - Extracts text from PDF.  
  - **Generate Field Value**  
    - Calls LLM with PDF text and field prompt to generate value.  
  - **Get Result**  
    - Formats output for update.  
  - **Update Row**  
    - Updates the row with the new field value.  
  - **OpenAI Chat Model1**  
    - Executes LLM calls for this branch.

#### 1.7 LLM Integration & PDF Processing

- **Overview:**  
  Core AI processing block that extracts text from PDFs and uses OpenAI LLM with dynamic prompts to generate field values.

- **Nodes Involved:**  
  - Get File Data / Get File Data1  
  - Extract from File / Extract from File1  
  - Generate Field Value / Generate Field Value1  
  - OpenAI Chat Model / OpenAI Chat Model1

- **Node Details:**  
  - **Get File Data / Get File Data1**  
    - Downloads PDF from URL in the row’s "File" field.  
  - **Extract from File / Extract from File1**  
    - Extracts textual content from the PDF for LLM input.  
  - **Generate Field Value / Generate Field Value1**  
    - Constructs prompt combining extracted text and field description.  
    - Sends prompt to OpenAI LLM via LangChain node.  
    - Uses instructions to keep answers short and return "n/a" if data cannot be extracted.  
  - **OpenAI Chat Model / OpenAI Chat Model1**  
    - Executes the actual LLM API call.  
    - Requires OpenAI API credentials configured in n8n.  
    - Edge cases: API rate limits, network errors, ambiguous or incomplete prompts.

#### 1.8 Row Update

- **Overview:**  
  Collects generated field values and updates the corresponding Baserow table row via PATCH API calls.

- **Nodes Involved:**  
  - Update Row / Update Row1

- **Node Details:**  
  - **Update Row / Update Row1**  
    - HTTP PATCH request to Baserow API to update row fields with extracted values.  
    - Uses row ID and table ID from event context.  
    - Sends JSON body with field-value pairs.  
    - Configured to continue on error and retry twice with delay.  
    - Edge cases: API errors, concurrent updates, partial failures.

---

### 3. Summary Table

| Node Name           | Node Type                      | Functional Role                          | Input Node(s)           | Output Node(s)           | Sticky Note                                                                                       |
|---------------------|--------------------------------|----------------------------------------|-------------------------|--------------------------|-------------------------------------------------------------------------------------------------|
| Baserow Event       | Webhook                        | Entry point for Baserow webhook events | -                       | Table Fields API          |                                                                                                 |
| Table Fields API    | HTTP Request                  | Fetch table schema fields from Baserow | Baserow Event           | Get Prompt Fields         | 1. Get Table Schema - uses HTTP node for flexible API calls                                     |
| Get Prompt Fields   | Code                          | Extract fields with descriptions (prompts) | Table Fields API        | Get Event Body            |                                                                                                 |
| Get Event Body      | Set                           | Extract event body from webhook payload | Get Prompt Fields       | Event Type                |                                                                                                 |
| Event Type          | Switch                        | Route workflow based on event type      | Get Event Body          | Event Ref, Event Ref1     | 2. Event Router Pattern - routes row vs field events                                            |
| Event Ref           | NoOp                          | Reference node for row update branch    | Event Type              | Filter Valid Fields       |                                                                                                 |
| Event Ref1          | NoOp                          | Reference node for field update branch  | Event Type              | Rows to List              |                                                                                                 |
| Filter Valid Fields | Filter                        | Filter fields with non-empty descriptions | Event Ref               | List Table API            |                                                                                                 |
| List Table API      | HTTP Request                  | List rows with valid files from Baserow | Filter Valid Fields     | Get Valid Rows            | 10. Listing All Rows Under The Column - uses pagination and filters                             |
| Get Valid Rows      | Code                          | Flatten paginated row results            | List Table API          | Loop Over Items           |                                                                                                 |
| Loop Over Items     | Split In Batches              | Process rows one at a time (field update) | Get Valid Rows          | Row Reference             | 8. Using an Items Loop - improves user experience and update speed                              |
| Row Reference       | NoOp                          | Reference current row in field update branch | Loop Over Items         | Get File Data             |                                                                                                 |
| Get File Data       | HTTP Request                  | Download PDF file from row's File field | Row Reference           | Extract from File         |                                                                                                 |
| Extract from File   | Extract From File             | Extract text from PDF                    | Get File Data           | Generate Field Value      | 9. Generating Value using LLM - core AI extraction step                                         |
| Generate Field Value| Chain LLM (LangChain)         | Generate field value using OpenAI LLM   | Extract from File       | Get Result                | 5. PDFs, LLMs and Dynamic Prompts? Oh My! - uses dynamic prompts and PDF text                    |
| Get Result          | Set                           | Format LLM output for row update        | Generate Field Value    | Update Row                |                                                                                                 |
| Update Row          | HTTP Request                  | Update Baserow row with extracted values | Get Result              | Loop Over Items           | 6. Update the Baserow Table Row - final update step                                             |
| Filter Valid Rows   | Filter                        | Filter rows with valid file URLs         | Rows to List            | Get Row                   | 3. Filter Only Rows with Valid Input - ensures only rows with files are processed               |
| Get Row             | HTTP Request                  | Get full row data for missing field check | Filter Valid Rows       | Loop Over Items1          |                                                                                                 |
| Loop Over Items1    | Split In Batches              | Process rows one at a time (row update)  | Get Row                 | Row Ref                   | 4. Using an Items Loop - improves user experience and update speed                              |
| Row Ref             | NoOp                          | Reference current row in row update branch | Loop Over Items1        | Get File Data1            |                                                                                                 |
| Get File Data1      | HTTP Request                  | Download PDF file from row's File field | Row Ref                 | Extract from File1        |                                                                                                 |
| Extract from File1  | Extract From File             | Extract text from PDF                    | Get File Data1          | Fields to Update          |                                                                                                 |
| Fields to Update    | Code                          | Identify missing fields with prompts    | Extract from File1      | Generate Field Value1     |                                                                                                 |
| Generate Field Value1| Chain LLM (LangChain)         | Generate field value using OpenAI LLM   | Fields to Update        | Get Result1               |                                                                                                 |
| Get Result1         | Set                           | Format LLM output for row update        | Generate Field Value1   | Update Row1               |                                                                                                 |
| Update Row1         | HTTP Request                  | Update Baserow row with extracted values | Get Result1             | Loop Over Items1          | 7. Update the Baserow Table Row - final update step for row update branch                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Unique identifier (e.g., `267ea500-e2cd-4604-a31f-f0773f27317c`)  
   - Purpose: Receive Baserow webhook events.

2. **Add HTTP Request Node to Fetch Table Fields**  
   - Type: HTTP Request  
   - Method: GET  
   - URL: `https://api.baserow.io/api/database/fields/table/{{ $json.body.table_id }}/`  
   - Query Parameters: `user_field_names=true`  
   - Authentication: HTTP Header Auth with Baserow API token  
   - Input: Output of Webhook node.

3. **Add Code Node to Extract Fields with Descriptions**  
   - Type: Code  
   - JavaScript: Filter fields where `description` exists and return array of `{id, order, name, description}`.

4. **Add Set Node to Extract Event Body**  
   - Type: Set  
   - Set JSON to `{{$node["Baserow Event"].json.body}}`.

5. **Add Switch Node to Route by Event Type**  
   - Type: Switch  
   - Expression: `{{$json.event_type}}`  
   - Cases: `rows.updated`, `field.created`, `field.updated`.

6. **Create Branch for Row Updated Events:**  
   - Add NoOp node as reference.  
   - Add HTTP Request node to list rows with filter: rows where "File" field is not empty.  
   - Use pagination with limit and next URL handling.  
   - Add Code node to flatten paginated results.  
   - Add Filter node to keep rows with valid file URLs.  
   - Add HTTP Request node to get full row data by ID.  
   - Add Split In Batches node to process rows one at a time.  
   - Add NoOp node as row reference.  
   - Add HTTP Request node to download PDF from "File" URL.  
   - Add Extract From File node to extract text from PDF.  
   - Add Code node to identify missing fields with prompts in the row.  
   - Add Chain LLM node (LangChain) configured with OpenAI credentials:  
     - Prompt includes extracted text and field description.  
     - Instructions to keep answer short and return "n/a" if data not found.  
   - Add Set node to format LLM output as `{field: fieldName, value: extractedValue}`.  
   - Add HTTP Request node to PATCH update the row with extracted values.  
   - Connect back to Split In Batches for next row.

7. **Create Branch for Field Created/Updated Events:**  
   - Add NoOp node as reference.  
   - Add Filter node to keep fields with non-empty descriptions.  
   - Add HTTP Request node to list rows with non-empty "File" field.  
   - Add Code node to flatten results.  
   - Add Split In Batches node to process rows one at a time.  
   - Add NoOp node as row reference.  
   - Add HTTP Request node to download PDF from "File" URL.  
   - Add Extract From File node to extract text from PDF.  
   - Add Chain LLM node (LangChain) with OpenAI credentials:  
     - Prompt includes extracted text and field description.  
     - Instructions as above.  
   - Add Set node to format output.  
   - Add HTTP Request node to PATCH update the row with extracted field value.  
   - Loop back to Split In Batches for next row.

8. **Configure Credentials:**  
   - Baserow HTTP Header Auth with API token for all HTTP Request nodes calling Baserow API.  
   - OpenAI API credentials for LangChain nodes.

9. **Set Retry and Error Handling:**  
   - For update nodes, configure retries (max 2 attempts) and continue on error to avoid workflow halting.

10. **Publish Workflow and Configure Baserow Webhooks:**  
    - Create POST webhooks in Baserow for events: `row updated` (filtered on "File" field), `field created`, and `field updated`.  
    - Use webhook URL from the Webhook node.  
    - Enable "use fields names instead of IDs" option.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                         | Context or Link                                                                                      |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| This workflow demonstrates the **Dynamic Prompts** AI pattern where field descriptions in Baserow act as user-editable prompts for AI extraction, enabling flexible and maintainable data extraction workflows.                                                                                                                                                                      | Workflow description and concept                                                                    |
| Video demo of this workflow pattern in n8n Studio: [https://www.youtube.com/watch?v=_fNAD1u8BZw](https://www.youtube.com/watch?v=_fNAD1u8BZw)                                                                                                                                                                                                                                       | Video tutorial                                                                                      |
| Community discussion and support post: [https://community.n8n.io/t/dynamic-prompts-with-n8n-baserow-and-airtable/72052](https://community.n8n.io/t/dynamic-prompts-with-n8n-baserow-and-airtable/72052)                                                                                                                                                                                  | Community forum                                                                                    |
| Airtable version of this workflow available here: [https://n8n.io/workflows/2771-ai-data-extraction-with-dynamic-prompts-and-airtable/](https://n8n.io/workflows/2771-ai-data-extraction-with-dynamic-prompts-and-airtable/)                                                                                                                                                              | Alternative integration                                                                            |
| Baserow webhooks must be created manually in the Baserow UI by selecting appropriate events and options, including filtering on the input field (e.g., "File") for row updated events.                                                                                                                                                                                               | Setup instructions                                                                                 |
| The workflow uses the Baserow API directly via HTTP Request nodes for flexibility, including pagination and filtering capabilities not available in built-in nodes.                                                                                                                                                                                                                 | Technical detail                                                                                   |
| The LLM prompt instructs the AI to keep answers short and respond with "n/a" if data cannot be extracted, improving data quality and consistency.                                                                                                                                                                                                                                   | Prompt design                                                                                     |
| The workflow uses Split In Batches nodes to process rows sequentially for better user experience and to avoid API rate limits or long-running executions.                                                                                                                                                                                                                            | Performance and UX consideration                                                                  |
| Error handling is configured to continue on failure for update nodes with limited retries to improve robustness.                                                                                                                                                                                                                                                                     | Reliability                                                                                       |
| Baserow branding image is included in sticky notes for visual context.                                                                                                                                                                                                                                                                                                              | Branding                                                                                         |

---

This document provides a detailed, structured reference for understanding, reproducing, and maintaining the "AI Data Extraction with Dynamic Prompts and Baserow" workflow. It covers all nodes, their roles, configurations, and integration points, enabling advanced users and automation agents to work effectively with this workflow.