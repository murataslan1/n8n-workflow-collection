Automated AI Lead Enrichment: Salesforce to Explorium for Enhanced Prospect Data

https://n8nworkflows.xyz/workflows/automated-ai-lead-enrichment--salesforce-to-explorium-for-enhanced-prospect-data-4837


# Automated AI Lead Enrichment: Salesforce to Explorium for Enhanced Prospect Data

---
### 1. Workflow Overview

This workflow automates the enrichment of new Salesforce lead records by leveraging Explorium’s AI-powered prospect matching and data enrichment APIs. When a new lead is created in Salesforce, the workflow triggers and sends lead data to Explorium to identify and match prospects. It then filters for valid matches, extracts prospect IDs, and performs parallel bulk enrichments for contact information and profile data. The enriched data is merged, flattened, and used to update the original Salesforce lead record with enhanced and validated prospect details.

**Target Use Cases:**  
- Sales and marketing teams aiming to enhance lead data quality automatically  
- Organizations integrating Salesforce with advanced third-party AI enrichment services  
- Scenarios requiring real-time lead enrichment to improve prospect insights and outreach  

**Logical Blocks:**  
- **1.1 Input Reception:** Salesforce real-time trigger on new lead creation  
- **1.2 Prospect Matching:** Sending lead data to Explorium’s matching API and filtering valid matches  
- **1.3 Prospect ID Extraction:** Extracting prospect IDs from matched results for enrichment  
- **1.4 Parallel Data Enrichment:** Bulk enrichment of contact information and profiles via Explorium APIs  
- **1.5 Data Consolidation:** Merging and flattening enriched data for Salesforce compatibility  
- **1.6 Lead Update:** Writing enriched data back to the original Salesforce lead record  
- **1.7 Documentation:** Sticky note with detailed workflow explanation and credential setup instructions  

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Listens for new lead creation events in Salesforce and outputs lead data to start the enrichment process.

- **Nodes Involved:**  
  - Salesforce Trigger

- **Node Details:**  
  - **Salesforce Trigger**  
    - Type: Salesforce Trigger node  
    - Role: Real-time webhook trigger on Salesforce lead creation events  
    - Configuration: Polls every minute, triggers on event type `leadCreated`  
    - Credentials: Salesforce OAuth2 configured  
    - Inputs: None (event-driven)  
    - Outputs: JSON containing new lead details (e.g., Id, FirstName, LastName, Company)  
    - Edge Cases:  
      - API rate limits or connectivity issues with Salesforce  
      - Missed lead creation events if webhook misconfigured  
    - Version: 1  

#### 1.2 Prospect Matching

- **Overview:**  
  Sends lead’s full name and company to Explorium’s prospect matching API to find relevant prospect profiles.

- **Nodes Involved:**  
  - Match_prospect  
  - Filter non-matched

- **Node Details:**  
  - **Match_prospect**  
    - Type: HTTP Request  
    - Role: Calls Explorium API endpoint `/v1/prospects/match` using POST  
    - Configuration:  
      - Constructs JSON body using lead’s full name and company from Salesforce Trigger node  
      - Headers: Content-Type and Accept set to `application/json`  
      - Authentication: Generic Header Auth with API key in Authorization header  
    - Inputs: Salesforce Trigger output  
    - Outputs: JSON response containing matched prospects array with prospect IDs  
    - Edge Cases:  
      - API authentication failure (invalid/missing API key)  
      - Timeout or network errors  
      - Empty or no matches returned  
    - Version: 4.2  

  - **Filter non-matched**  
    - Type: Filter node  
    - Role: Keeps only records where at least one matched prospect has a non-null `prospect_id`  
    - Configuration: Expression checks `matched_prospects.some(prospect => prospect.prospect_id !== null)`  
    - Inputs: Match_prospect output  
    - Outputs: Filtered matched prospects  
    - Edge Cases:  
      - All leads filtered out if no valid matches  
    - Version: 2.2  

#### 1.3 Prospect ID Extraction

- **Overview:**  
  Extracts all prospect IDs from the matched prospects into a flat array for bulk enrichment.

- **Nodes Involved:**  
  - Extract Prospect IDs from Matched Results

- **Node Details:**  
  - **Extract Prospect IDs from Matched Results**  
    - Type: Code (JavaScript)  
    - Role: Iterates over all matched prospects and extracts `prospect_id` values into a single array  
    - Key Code:  
      ```js
      const allItems = $input.all();
      const prospectIds = allItems.map(item => 
        item.json.matched_prospects.map(prospect => prospect.prospect_id)
      ).flat();
      return [{ json: { prospect_ids: prospectIds } }];
      ```  
    - Inputs: Filter non-matched output  
    - Outputs: JSON with `prospect_ids` array  
    - Edge Cases:  
      - Empty arrays if no matches (should not happen due to filtering)  
    - Version: 2  

#### 1.4 Parallel Data Enrichment

- **Overview:**  
  Performs two simultaneous bulk enrichment requests to Explorium’s APIs: one for contacts information and one for profiles.

- **Nodes Involved:**  
  - Explorium Enrich Contacts Information  
  - Explorium Enrich Profiles

- **Node Details:**  
  - **Explorium Enrich Contacts Information**  
    - Type: HTTP Request  
    - Role: Bulk enrich contacts data (emails, phones, professional info) for given prospect IDs  
    - Configuration:  
      - POST to `/v1/prospects/contacts_information/bulk_enrich`  
      - Sends JSON body `{ prospect_ids: [...] }` dynamically from code node output  
      - Headers and auth as in Match_prospect node  
    - Inputs: Extract Prospect IDs from Matched Results  
    - Outputs: Enriched contacts info JSON  
    - Edge Cases: API errors, partial data returned  
    - Version: 4.2  

  - **Explorium Enrich Profiles**  
    - Type: HTTP Request  
    - Role: Bulk enrich profiles data (additional demographic and professional info)  
    - Configuration:  
      - POST to `/v1/prospects/profiles/bulk_enrich`  
      - Same auth and header setup as above  
      - Uses same prospect_ids array  
    - Inputs: Extract Prospect IDs from Matched Results  
    - Outputs: Enriched profiles JSON  
    - Edge Cases: Same as contacts enrichment  
    - Version: 4.2  

#### 1.5 Data Consolidation

- **Overview:**  
  Combines the two enrichment results into one unified data stream and flattens nested structures for Salesforce compatibility.

- **Nodes Involved:**  
  - Merge  
  - Code - flatten

- **Node Details:**  
  - **Merge**  
    - Type: Merge node  
    - Role: Combines contacts information and profiles data streams using 'combine' mode (appends data arrays)  
    - Configuration: Matches on `data[0].prospect_id` field  
    - Inputs: Parallel outputs from Explorium Enrich Contacts Information (main input 0) and Explorium Enrich Profiles (main input 1)  
    - Outputs: Combined array of enriched data objects  
    - Edge Cases: Mismatched data lengths or missing prospect_ids  
    - Version: 3.1  

  - **Code - flatten**  
    - Type: Code node (JavaScript)  
    - Role: Flattens nested enrichment data arrays into a single array of objects with merged properties for each prospect  
    - Key Code:  
      ```js
      return $input.all().map(item => 
          item.json.data.map(prospect => ({
            prospect_id: prospect.prospect_id,
            ...prospect.data
          }))
        ).flat();
      ```  
    - Inputs: Merge output  
    - Outputs: Flattened array ready for Salesforce update  
    - Edge Cases: Nested data inconsistencies or undefined fields  
    - Version: 2  

#### 1.6 Lead Update

- **Overview:**  
  Updates the original Salesforce lead record with the enriched data fields retrieved from Explorium.

- **Nodes Involved:**  
  - Update Lead

- **Node Details:**  
  - **Update Lead**  
    - Type: Salesforce node  
    - Role: Updates lead record fields with enriched data (city, email, phone, state, title, company, country, website, mobilePhone)  
    - Configuration:  
      - Uses lead ID from Salesforce Trigger node  
      - Fields populated by expressions referencing flattened enrichment data JSON paths (e.g., city, professions_email, phone_numbers array, region_name)  
    - Credentials: Salesforce OAuth2  
    - Inputs: Code - flatten output  
    - Outputs: None (final node)  
    - Edge Cases:  
      - Salesforce API update errors (permission, field validation)  
      - Missing or null values in enrichment data  
    - Version: 1  

#### 1.7 Documentation

- **Overview:**  
  Provides a detailed sticky note containing workflow purpose, credential setup, node explanations, and flow summary.

- **Nodes Involved:**  
  - Sticky Note

- **Node Details:**  
  - Type: Sticky Note  
  - Role: Documentation and user guidance embedded in the workflow canvas  
  - Content: Extensive explanation of credentials needed, node functions, data flow, and integration points  
  - Inputs/Outputs: None  
  - Version: 1  

---

### 3. Summary Table

| Node Name                          | Node Type             | Functional Role                                    | Input Node(s)                  | Output Node(s)                   | Sticky Note                                                                                       |
|-----------------------------------|-----------------------|--------------------------------------------------|-------------------------------|---------------------------------|-------------------------------------------------------------------------------------------------|
| Salesforce Trigger                | Salesforce Trigger    | Trigger on new Salesforce lead creation          | None                          | Match_prospect                  | Automatically enrich leads in Salesforce using Explorium MCP (detailed in Sticky Note node)     |
| Match_prospect                   | HTTP Request          | Match lead to prospect profiles in Explorium     | Salesforce Trigger            | Filter non-matched              |                                                                                                 |
| Filter non-matched               | Filter                | Filter for valid prospect matches                 | Match_prospect                | Extract Prospect IDs from Matched Results |                                                                                                 |
| Extract Prospect IDs from Matched Results | Code (JavaScript)    | Extract prospect IDs array for bulk enrichment    | Filter non-matched            | Explorium Enrich Contacts Information, Explorium Enrich Profiles |                                                                                                 |
| Explorium Enrich Contacts Information | HTTP Request          | Bulk enrich contact information                    | Extract Prospect IDs from Matched Results | Merge                          |                                                                                                 |
| Explorium Enrich Profiles        | HTTP Request          | Bulk enrich prospect profiles                      | Extract Prospect IDs from Matched Results | Merge                          |                                                                                                 |
| Merge                           | Merge                 | Combine enrichment results from two endpoints     | Explorium Enrich Contacts Information, Explorium Enrich Profiles | Code - flatten                 |                                                                                                 |
| Code - flatten                  | Code (JavaScript)      | Flatten and prepare enrichment data for Salesforce | Merge                        | Update Lead                    |                                                                                                 |
| Update Lead                    | Salesforce             | Update Salesforce lead with enriched data         | Code - flatten               | None                           |                                                                                                 |
| Sticky Note                    | Sticky Note            | Documentation and instructions                     | None                         | None                           | # Automatically enrich leads in Salesforce using Explorium MCP; detailed workflow and credential info |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Salesforce Trigger node:**  
   - Type: Salesforce Trigger  
   - Set trigger event to `leadCreated`  
   - Set polling mode to every minute (or use webhook if available)  
   - Assign Salesforce OAuth2 credential  
   - Position it as the initial node  

2. **Create HTTP Request node "Match_prospect":**  
   - Method: POST  
   - URL: `https://api.explorium.ai/v1/prospects/match`  
   - Authentication: Generic Header Auth using Explorium API key credential  
   - Headers:  
     - Content-Type: application/json  
     - Accept: application/json  
   - Body (JSON, raw):  
     ```json
     {
       "prospects_to_match": [
         {
           "full_name": "{{ $('Salesforce Trigger').item.json.FirstName }} {{ $('Salesforce Trigger').item.json.LastName }}",
           "company_name": "{{ $('Salesforce Trigger').item.json.Company }}"
         }
       ]
     }
     ```  
   - Connect Salesforce Trigger output to Match_prospect input  

3. **Create Filter node "Filter non-matched":**  
   - Condition: Expression  
   - Expression:  
     ```js
     {{ $json.matched_prospects.some(prospect => prospect.prospect_id !== null).toBoolean() }}
     ```  
   - Connect Match_prospect output to Filter non-matched input  

4. **Create Code node "Extract Prospect IDs from Matched Results":**  
   - Language: JavaScript  
   - Code:  
     ```js
     const allItems = $input.all();
     const prospectIds = allItems.map(item => 
       item.json.matched_prospects.map(prospect => prospect.prospect_id)
     ).flat();
     return [{ json: { prospect_ids: prospectIds } }];
     ```  
   - Connect Filter non-matched output to this node  

5. **Create HTTP Request node "Explorium Enrich Contacts Information":**  
   - Method: POST  
   - URL: `https://api.explorium.ai/v1/prospects/contacts_information/bulk_enrich`  
   - Authentication: Same Generic Header Auth credential  
   - Headers:  
     - Content-Type: application/json  
     - Accept: application/json  
   - Body (JSON):  
     ```json
     { "prospect_ids": {{ $json.prospect_ids }} }
     ```  
   - Connect Extract Prospect IDs node output to this node  

6. **Create HTTP Request node "Explorium Enrich Profiles":**  
   - Method: POST  
   - URL: `https://api.explorium.ai/v1/prospects/profiles/bulk_enrich`  
   - Authentication: Same Generic Header Auth credential  
   - Headers: Same as above  
   - Body JSON: Same as above  
   - Connect Extract Prospect IDs node output to this node  

7. **Create Merge node "Merge":**  
   - Mode: Combine  
   - Fields to match: `data[0].prospect_id` (for combining based on prospect_id)  
   - Connect Explorium Enrich Contacts Information to Merge input 0  
   - Connect Explorium Enrich Profiles to Merge input 1  

8. **Create Code node "Code - flatten":**  
   - Language: JavaScript  
   - Code:  
     ```js
     return $input.all().map(item => 
         item.json.data.map(prospect => ({
           prospect_id: prospect.prospect_id,
           ...prospect.data
         }))
       ).flat();
     ```  
   - Connect Merge output to this node  

9. **Create Salesforce node "Update Lead":**  
   - Resource: Lead  
   - Operation: Update  
   - Lead ID: Use expression `={{ $('Salesforce Trigger').item.json.Id }}`  
   - Map fields with expressions referencing flattened data from Code - flatten node, for example:  
     - city: `={{ $json.city || null }}`  
     - email: `={{ $json.professions_email || null }}`  
     - phone: `={{ $json.phone_numbers?.[0]?.phone_number || "null" }}`  
     - state: `={{ $json.region_name || '' }}`  
     - title: `={{ $json.experience?.[0]?.title?.name || null }}`  
     - company: `={{ $json.company_name || null }}`  
     - country: `={{ $json.country_name || null }}`  
     - website: `={{ $json.experience?.[0]?.company?.website || null }}`  
     - mobilePhone: `={{ $json.mobile_phone }}`  
   - Assign Salesforce OAuth2 credential  
   - Connect Code - flatten output to Update Lead input  

10. **(Optional) Add Sticky Note node:**  
    - Add detailed documentation text describing workflow purpose, credentials, node roles, and execution flow  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                           |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| Workflow uses Salesforce OAuth2 and Explorium Generic Header Auth; ensure credentials are configured in n8n’s Settings → Credentials before execution.                                                                                                                                                                                                              | Credential setup instructions                              |
| Explorium API endpoints documentation: https://docs.explorium.ai/api-reference/prospects                                                                                                                                                                                                                                                                             | Explorium API docs                                         |
| This workflow uses "combine" mode in Merge node to aggregate parallel enrichment results, preserving data from multiple Explorium endpoints.                                                                                                                                                                                                                         | n8n Merge node documentation                               |
| Expressions extensively use optional chaining (e.g., `?.`) and null coalescing to avoid runtime errors if fields are missing in enrichment data.                                                                                                                                                                                                                    | Expression best practices                                   |
| The workflow assumes lead data includes `FirstName`, `LastName`, and `Company` fields in Salesforce; customize if your schema differs.                                                                                                                                                                                                                              | Salesforce lead data model                                  |
| Real-time lead enrichment improves sales prospect quality but may increase API usage; monitor Explorium API quotas and Salesforce API limits.                                                                                                                                                                                                                        | Operational considerations                                 |
| Sticky Note in the workflow contains a comprehensive written explanation that can be copied for internal documentation or user training.                                                                                                                                                                                                                              | Embedded documentation                                     |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow constructed with n8n, an integration and automation tool. This processing fully complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is lawful and public.