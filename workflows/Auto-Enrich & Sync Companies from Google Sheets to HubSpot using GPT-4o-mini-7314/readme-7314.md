Auto-Enrich & Sync Companies from Google Sheets to HubSpot using GPT-4o-mini

https://n8nworkflows.xyz/workflows/auto-enrich---sync-companies-from-google-sheets-to-hubspot-using-gpt-4o-mini-7314


# Auto-Enrich & Sync Companies from Google Sheets to HubSpot using GPT-4o-mini

### 1. Workflow Overview

This workflow automates the enrichment and synchronization of company data sourced from a Google Sheet into HubSpot CRM, leveraging GPT-4o-mini for detailed business intelligence. It is designed for B2B lead management scenarios where new company leads are continuously added to a spreadsheet and require data augmentation and CRM integration.

The workflow can be logically divided into four main blocks:

- **1.1 Lead Intake Filter:** Triggered by new rows added in Google Sheets, this block filters out entries without a company name, ensuring only valid leads proceed.
- **1.2 Company Intelligence via GPT-4o-mini:** Utilizes OpenAI’s GPT-4o-mini model to enrich company data with industry insights, size, founding year, and other relevant metadata, outputting structured JSON.
- **1.3 CRM Sync: HubSpot Company Management:** Checks for existing company records in HubSpot by domain, creates new records if absent, thus preventing duplicates and maintaining CRM data integrity.
- **1.4 Google Sheets Recordkeeping:** Updates the Google Sheet with enriched and CRM-synced company data for transparency, auditing, and further operational use.

---

### 2. Block-by-Block Analysis

#### 2.1 Lead Intake Filter

**Overview:**  
Monitors the Google Sheet for newly added company entries and filters out any rows lacking a company name to avoid processing invalid or incomplete data.

**Nodes Involved:**  
- 📥 Sheet Trigger - New Company  
- 🧹 Filter: Non-Empty Company Name'

**Node Details:**

- **📥 Sheet Trigger - New Company**  
  - Type: Google Sheets Trigger  
  - Role: Watches for new rows added to a specific Google Sheet (sheet "Sheet1" in the specified document).  
  - Configuration: Polls every minute for new rows on sheet with gid=0. Uses OAuth2 credentials for Google Sheets.  
  - Inputs: None (trigger node)  
  - Outputs: Emits data about the new row added.  
  - Edge Cases:  
    - Missing or revoked Google Sheets OAuth credentials.  
    - Sheet renaming or deletion causing documentId or sheetName invalidation.  
    - High polling frequency could lead to API rate limits.  

- **🧹 Filter: Non-Empty Company Name'**  
  - Type: If Node (Conditional)  
  - Role: Filters out rows where the "Company Name" field is empty.  
  - Configuration: Condition checks if `Company Name` field is not empty.  
  - Inputs: Output from Google Sheets Trigger.  
  - Outputs:  
    - True branch proceeds for non-empty names.  
    - False branch discards rows without company names.  
  - Edge Cases:  
    - Field name mismatch or case sensitivity issues could cause incorrect filtering.  
    - Empty strings or whitespace-only names might not be caught if not trimmed.  

---

#### 2.2 Company Intelligence via GPT-4o-mini

**Overview:**  
Enriches the valid company entries with detailed business intelligence data by querying OpenAI GPT-4o-mini, requesting a structured JSON response with specific company attributes.

**Nodes Involved:**  
- 🤖 OpenAI Enrichment (GPT-4o-mini)  
- 🧾 Parse Enriched Data  

**Node Details:**

- **🤖 OpenAI Enrichment (GPT-4o-mini)**  
  - Type: OpenAI Node (Langchain integration)  
  - Role: Sends the company name to GPT-4o-mini model with a system prompt instructing it to return structured JSON about the company.  
  - Configuration:  
    - Model: gpt-4o-mini  
    - Max tokens: 500  
    - Temperature: 0.3 (low randomness for factual output)  
    - Messages include a system prompt specifying expected JSON format and a user prompt with the company name.  
  - Inputs: Filtered rows with non-empty company names.  
  - Outputs: GPT response containing JSON-formatted company details.  
  - Credentials: OpenAI API key required.  
  - Edge Cases:  
    - API quota exhaustion or authentication errors.  
    - GPT output not strictly valid JSON (parsing failure).  
    - Inaccurate or incomplete data returned by GPT; null values expected where unknown.  
    - Timeout or network issues.  

- **🧾 Parse Enriched Data**  
  - Type: Set Node  
  - Role: Extracts and sets the JSON content from GPT message response as the node’s output in a directly usable JSON format.  
  - Configuration: Reads the raw content from `message.content` and assigns it as the output JSON.  
  - Inputs: Output from OpenAI node.  
  - Outputs: Parsed structured JSON with company enrichment data fields.  
  - Edge Cases:  
    - Parsing errors if GPT output deviates from expected format.  
    - Empty or null content.  

---

#### 2.3 CRM Sync: HubSpot Company Management

**Overview:**  
Verifies if the enriched company already exists in HubSpot by searching with the company domain; if not found, it creates a new company record in HubSpot using the enriched data.

**Nodes Involved:**  
- 🔍 HubSpot: Find Company by Domain  
- ⚖️ Check: Company Exists in HubSpot?  
- 🏢 Create Company in HubSpot  
- 🧰 Prepare Sheet Data  

**Node Details:**

- **🔍 HubSpot: Find Company by Domain**  
  - Type: HubSpot Node  
  - Role: Searches HubSpot CRM for existing company using the domain name derived from the company name.  
  - Configuration:  
    - Operation: Search by Domain  
    - Domain expression: `={{ $json["Company Name"] }}` (note: using company name as domain may be logically imprecise unless domain is extracted or normalized)  
  - Inputs: Parsed enrichment data.  
  - Outputs: Returns company data if found or empty if not.  
  - Credentials: HubSpot App Token authentication.  
  - Edge Cases:  
    - Domain search failure if company name is not a valid domain.  
    - Authentication or API rate limit errors.  
    - Missing or malformed company name leading to false negatives.  

- **⚖️ Check: Company Exists in HubSpot?**  
  - Type: If Node  
  - Role: Checks if HubSpot search returned an existing company record by verifying if `id` field exists in response.  
  - Configuration: Condition checks existence of `id` field.  
  - Inputs: Output of HubSpot search node.  
  - Outputs:  
    - True branch (company exists): proceeds to prepare sheet data for update.  
    - False branch (company does not exist): proceeds to create company node.  
  - Edge Cases:  
    - Unexpected response structure causing condition failure.  

- **🏢 Create Company in HubSpot**  
  - Type: HubSpot Node  
  - Role: Creates a new company record in HubSpot CRM using enriched data fields.  
  - Configuration:  
    - Resource: Company  
    - Fields populated include company name, website URL, description, founding year, and headquarters country/region from parsed GPT data.  
  - Inputs: From false branch of existence check node.  
  - Outputs: Created company data.  
  - Credentials: HubSpot App Token authentication.  
  - Edge Cases:  
    - API throttling or validation errors (e.g., invalid field formats).  
    - Missing required fields leading to creation failure.  

- **🧰 Prepare Sheet Data**  
  - Type: Set Node  
  - Role: Prepares and formats the enriched and/or HubSpot-synced data for updating back into Google Sheets.  
  - Configuration: No explicit parameters; likely used to structure or standardize data for the next node.  
  - Inputs: From either the existence branch or creation branch (i.e., both paths converge here).  
  - Outputs: Data structured for Google Sheets update.  
  - Edge Cases:  
    - Data inconsistencies between HubSpot and GPT fields.  

---

#### 2.4 Google Sheets Recordkeeping

**Overview:**  
Updates the original Google Sheet with the enriched company information and sync status to maintain a live, auditable record of all companies processed.

**Nodes Involved:**  
- 📊 Update Google Sheet  

**Node Details:**

- **📊 Update Google Sheet**  
  - Type: Google Sheets Node  
  - Role: Updates or appends enriched company data back into the Google Sheet row corresponding to the company, keyed on "Company Name".  
  - Configuration:  
    - Operation: appendOrUpdate  
    - Matching column: "Company Name"  
    - Columns mapped include Website, Industry, Description, Headquarters, Company Size, Founded Year, Business Type, etc., mapped from parsed GPT JSON.  
    - Uses OAuth2 credentials for Google Sheets.  
  - Inputs: Prepared data from the "Prepare Sheet Data" node.  
  - Outputs: None (terminal node).  
  - Edge Cases:  
    - Google Sheets API errors or rate limits.  
    - Mismatches causing duplicate rows or failure to update.  
    - Column name typos (note: "Headquaters" and "Buisness Type" are misspelled in mapping).  
    - Concurrent updates leading to race conditions.  

---

### 3. Summary Table

| Node Name                       | Node Type                   | Functional Role                          | Input Node(s)                   | Output Node(s)                    | Sticky Note                                                                                         |
|--------------------------------|-----------------------------|----------------------------------------|--------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------|
| 📥 Sheet Trigger - New Company  | Google Sheets Trigger        | Triggers workflow on new sheet rows    | None                           | 🧹 Filter: Non-Empty Company Name' | ## Lead Intake Filter: triggers on new rows and filters incomplete or duplicate entries.          |
| 🧹 Filter: Non-Empty Company Name' | If Node                    | Filters out rows with empty company name | 📥 Sheet Trigger - New Company | 🤖 OpenAI Enrichment (GPT-4o-mini) | ## Lead Intake Filter: filters invalid leads to proceed only with valid entries.                  |
| 🤖 OpenAI Enrichment (GPT-4o-mini) | OpenAI Node (Langchain)    | Generates enriched company data via GPT | 🧹 Filter: Non-Empty Company Name' | 🧾 Parse Enriched Data           | ## Company Intelligence via GPT-4o-mini: enriches data with structured JSON from OpenAI.          |
| 🧾 Parse Enriched Data          | Set Node                    | Parses GPT response into JSON           | 🤖 OpenAI Enrichment (GPT-4o-mini) | 🔍 HubSpot: Find Company by Domain | ## Company Intelligence via GPT-4o-mini: parses GPT output for downstream use.                     |
| 🔍 HubSpot: Find Company by Domain | HubSpot Node               | Searches HubSpot for existing company  | 🧾 Parse Enriched Data          | ⚖️ Check: Company Exists in HubSpot? | ## CRM Sync: HubSpot Company Management: checks for company existence to avoid duplicates.        |
| ⚖️ Check: Company Exists in HubSpot? | If Node                  | Branches workflow based on company existence | 🔍 HubSpot: Find Company by Domain | 🧰 Prepare Sheet Data / 🏢 Create Company in HubSpot | ## CRM Sync: HubSpot Company Management: routes to create or update logic accordingly.            |
| 🏢 Create Company in HubSpot    | HubSpot Node                | Creates new company record if missing  | ⚖️ Check: Company Exists in HubSpot? (false branch) | 🧰 Prepare Sheet Data          | ## CRM Sync: HubSpot Company Management: creates company record if not found.                     |
| 🧰 Prepare Sheet Data           | Set Node                    | Prepares data for Google Sheets update | ⚖️ Check: Company Exists in HubSpot? (true branch) / 🏢 Create Company in HubSpot | 📊 Update Google Sheet          | ## Google Sheets Recordkeeping: formats data for updating the sheet.                              |
| 📊 Update Google Sheet          | Google Sheets Node          | Updates Google Sheet with enriched data | 🧰 Prepare Sheet Data           | None                            | ## Google Sheets Recordkeeping: updates sheet for visibility and traceability.                     |
| Sticky Note                    | Sticky Note                 | Lead Intake Filter description         | None                           | None                           | ## Lead Intake Filter: This block triggers the workflow from a newly added row in Google Sheets...|
| Sticky Note1                   | Sticky Note                 | Company Intelligence description       | None                           | None                           | ## Company Intelligence via GPT-4o-mini: This module uses OpenAI to extract rich company insights.|
| Sticky Note2                   | Sticky Note                 | CRM Sync description                    | None                           | None                           | ## CRM Sync: HubSpot Company Management: ensures clean CRM, checks existence, creates if needed.  |
| Sticky Note3                   | Sticky Note                 | Google Sheets Recordkeeping description | None                           | None                           | ## Google Sheets Recordkeeping: Captures all enriched and CRM-synced companies in Google Sheets.  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger Node:**  
   - Type: Google Sheets Trigger  
   - Polling: Every minute  
   - Document ID: Your Google Sheet ID (where companies are listed)  
   - Sheet Name: Use the GID or sheet name (e.g., "Sheet1")  
   - Credentials: Google Sheets Trigger OAuth2 credentials  

2. **Add If Node for Filtering Invalid Entries:**  
   - Type: If  
   - Condition: Check if field `Company Name` is not empty (`isNotEmpty`).  
   - Input: Connect from Google Sheets Trigger output.  

3. **Add OpenAI Node for Enrichment:**  
   - Type: OpenAI (Langchain)  
   - Model: `gpt-4o-mini`  
   - Temperature: 0.3  
   - Max Tokens: 500  
   - Messages:  
     - System prompt instructing to respond with structured JSON containing company info fields.  
     - User prompt: Provide detailed info about the company name from input data.  
   - Credentials: OpenAI API credentials  
   - Connect true branch of filter node to this node.  

4. **Add Set Node to Parse GPT Response:**  
   - Type: Set  
   - Mode: Raw  
   - Expression for JSON output: `={{ $json.message.content }}` (extract the content field from GPT response)  
   - Connect from OpenAI node output.  

5. **Add HubSpot Node to Search Company by Domain:**  
   - Type: HubSpot  
   - Resource: Company  
   - Operation: Search By Domain  
   - Domain: Expression `={{ $json["Company Name"] }}` (consider refining to extract domain properly)  
   - Credentials: HubSpot App Token authentication  
   - Connect from Set node output.  

6. **Add If Node to Check Company Existence:**  
   - Type: If  
   - Condition: Check if `id` field exists in HubSpot search response output.  
   - Connect from HubSpot search node output.  

7. **Add HubSpot Node to Create Company (False Branch):**  
   - Type: HubSpot  
   - Resource: Company  
   - Operation: Create  
   - Fields: Map relevant fields from parsed GPT JSON (`Company Name`, `website`, `description`, `yearFounded`, `countryRegion`)  
   - Credentials: HubSpot App Token authentication  
   - Connect false branch of existence check node here.  

8. **Add Set Node to Prepare Data for Sheet Update (Both Branches):**  
   - Type: Set  
   - Purpose: Format or standardize data for Google Sheets update (no explicit parameters needed).  
   - Connect true branch of existence check node and output of create company node to this node (merge paths).  

9. **Add Google Sheets Node to Update Sheet:**  
   - Type: Google Sheets  
   - Operation: appendOrUpdate  
   - Document ID and Sheet Name: Same as trigger node  
   - Matching Column: `Company Name`  
   - Columns mapped: Website, Industry, Description, Headquarters, Company Size, Founded Year, Business Type (map from parsed GPT data)  
   - Credentials: Google Sheets OAuth2 credentials (can differ from trigger)  
   - Connect from Prepare Sheet Data node output.  

10. **Add Sticky Notes (optional for clarity):**  
    - Add descriptive sticky notes near each logical block with content as in the original workflow for documentation and maintenance ease.  

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                                                                                                 |
|----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| The workflow relies heavily on OpenAI’s GPT-4o-mini model to generate structured company information. Accuracy depends on model knowledge cutoff and prompt design. | OpenAI GPT model documentation: https://platform.openai.com/docs/models/gpt-4o-mini                                                 |
| HubSpot domain search uses company name as domain; consider enhancing domain extraction for accuracy. | HubSpot company API: https://developers.hubspot.com/docs/api/crm/companies                                                        |
| Google Sheets column names contain typos ("Headquaters", "Buisness Type") that should be corrected to avoid confusion. | Google Sheets documentation: https://support.google.com/docs/                                                                    |
| API rate limits for Google Sheets, HubSpot, and OpenAI can affect workflow stability; implement monitoring and retries as needed. | n8n documentation on error handling: https://docs.n8n.io/nodes/handling-errors/                                                   |
| This workflow is intended for B2B lead enrichment and CRM synchronization with audit trail in Sheets. It provides a scalable base for integrating AI-driven data enrichment with CRM workflows. | —                                                                                                                              |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data is legal and public.