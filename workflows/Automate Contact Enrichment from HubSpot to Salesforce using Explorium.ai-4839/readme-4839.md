Automate Contact Enrichment from HubSpot to Salesforce using Explorium.ai

https://n8nworkflows.xyz/workflows/automate-contact-enrichment-from-hubspot-to-salesforce-using-explorium-ai-4839


# Automate Contact Enrichment from HubSpot to Salesforce using Explorium.ai

### 1. Workflow Overview

This workflow automates the enrichment of contact data sourced from HubSpot and leverages Explorium.ai’s AI-powered data enrichment APIs to enhance prospect information before creating corresponding lead records in Salesforce. Its primary use case is to maintain high-quality, enriched lead data in Salesforce by continuously syncing and augmenting HubSpot contact information.

The workflow is logically divided into the following functional blocks:

- **1.1 Input Reception and Contact Retrieval:**  
  Listens for HubSpot contact creation or update events and fetches detailed contact data.

- **1.2 Prospect Matching with Explorium:**  
  Sends contact information to Explorium’s matching API to identify prospect profiles in the Explorium intelligence graph.

- **1.3 Prospect ID Extraction and Filtering:**  
  Filters for successful matches and extracts prospect IDs for enrichment.

- **1.4 Parallel Prospect Enrichment:**  
  Enriches contact data via two Explorium endpoints in parallel to obtain comprehensive contact and profile information.

- **1.5 Data Merging and Transformation:**  
  Combines enrichment results, flattens and formats data suitable for Salesforce lead creation.

- **1.6 Salesforce Lead Creation:**  
  Creates new leads in Salesforce using the enriched and transformed data.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Contact Retrieval

- **Overview:**  
  This block triggers the workflow upon HubSpot contact events and retrieves detailed contact data for enrichment.

- **Nodes Involved:**  
  - HubSpot Trigger  
  - HubSpot

- **Node Details:**

  - **HubSpot Trigger**  
    - *Type:* Trigger node  
    - *Role:* Initiates workflow on HubSpot contact events (create/update).  
    - *Configuration:* Uses webhook with HubSpot Developer API credentials (App Token recommended).  
    - *Input:* External HubSpot webhook event.  
    - *Output:* Contact event metadata, including contact ID.  
    - *Failures:* Possible webhook connectivity issues, credential expiration.

  - **HubSpot**  
    - *Type:* Resource node  
    - *Role:* Fetch full contact details for given contact ID.  
    - *Configuration:* Operation: Get contact by ID; credentials: HubSpot App Token.  
    - *Input:* Contact ID from trigger node.  
    - *Output:* Full contact details JSON for downstream processing.  
    - *Failures:* API rate limits, invalid contact ID, auth errors.

---

#### 2.2 Prospect Matching with Explorium

- **Overview:**  
  Matches HubSpot contact data against Explorium’s prospect database to find corresponding prospect profiles.

- **Nodes Involved:**  
  - Match_prospect

- **Node Details:**

  - **Match_prospect**  
    - *Type:* HTTP Request  
    - *Role:* Sends POST request to Explorium’s /prospects/match endpoint.  
    - *Configuration:*  
      - URL: `https://api.explorium.ai/v1/prospects/match`  
      - Headers: Content-Type and Accept set to application/json.  
      - Authentication: Generic header auth with stored API key.  
      - Body: Dynamically built JSON including full_name, company_name (trimmed), and email extracted from HubSpot contact data.  
    - *Input:* HubSpot contact JSON.  
    - *Output:* Response containing matched prospects array with prospect_ids.  
    - *Failures:* API authentication failures, malformed data in expressions, empty or missing email fields, HTTP timeouts.

---

#### 2.3 Prospect ID Extraction and Filtering

- **Overview:**  
  Filters out unmatched prospects and extracts prospect IDs from matched results to prepare for enrichment.

- **Nodes Involved:**  
  - Filter - non matched  
  - Extract Prospect IDs from Matched Results

- **Node Details:**

  - **Filter - non matched**  
    - *Type:* Filter node  
    - *Role:* Passes only those items where at least one matched prospect has a non-null prospect_id.  
    - *Configuration:* Expression condition checking `matched_prospects.some(prospect => prospect.prospect_id !== null)`.  
    - *Input:* Output from Match_prospect.  
    - *Output:* Filtered matched prospects.  
    - *Failures:* Expression evaluation errors if input JSON does not contain expected fields.  
    - *Note:* Currently deactivated, so all output passes downstream.

  - **Extract Prospect IDs from Matched Results**  
    - *Type:* Code node (JavaScript)  
    - *Role:* Parses through all matched prospects and compiles a flat array of prospect_ids for bulk enrichment.  
    - *Configuration:* Maps over matched_prospects arrays, extracts prospect_id, returns single JSON object with prospect_ids array.  
    - *Input:* Filtered matched prospects.  
    - *Output:* JSON object with array of prospect_ids.  
    - *Failures:* Logic errors if matched_prospects is undefined or empty.

---

#### 2.4 Parallel Prospect Enrichment

- **Overview:**  
  Uses two parallel HTTP request nodes to enrich prospect data via Explorium’s bulk enrichment endpoints for contacts information and profiles.

- **Nodes Involved:**  
  - Explorium Enrich Contacts Information  
  - Explorium Enrich Profiles

- **Node Details:**

  - **Explorium Enrich Contacts Information**  
    - *Type:* HTTP Request  
    - *Role:* Bulk enrich contact info such as emails, phone numbers, professional details.  
    - *Configuration:*  
      - URL: `https://api.explorium.ai/v1/prospects/contacts_information/bulk_enrich`  
      - Method: POST  
      - Headers: Content-Type and Accept as application/json  
      - Body: JSON with `prospect_ids` array from previous node  
      - Auth: Generic header auth with Explorium API key.  
    - *Input:* Prospect IDs JSON.  
    - *Output:* Enriched contact information JSON.  
    - *Failures:* API errors, large payload issues, invalid prospect IDs.

  - **Explorium Enrich Profiles**  
    - *Type:* HTTP Request  
    - *Role:* Bulk enrich prospect profiles providing supplementary data.  
    - *Configuration:*  
      - URL: `https://api.explorium.ai/v1/prospects/profiles/bulk_enrich`  
      - Same auth and headers as above.  
      - Body: Prospect IDs array.  
    - *Input:* Prospect IDs JSON.  
    - *Output:* Enriched profile data JSON.  
    - *Failures:* Same as above.

---

#### 2.5 Data Merging and Transformation

- **Overview:**  
  Merges parallel enrichment results and transforms the combined data into a flat, Salesforce-ready format.

- **Nodes Involved:**  
  - Merge  
  - Code - flatten

- **Node Details:**

  - **Merge**  
    - *Type:* Merge node  
    - *Role:* Combines enrichment data streams from Contacts Information and Profiles nodes.  
    - *Configuration:* Mode set to “combine” to concatenate data arrays rather than overwrite.  
    - *Input:* Two inputs from Explorium enrichment nodes.  
    - *Output:* Single merged JSON array with prospect enrichment data.  
    - *Failures:* Data mismatches or empty inputs may yield incomplete merges.

  - **Code - flatten**  
    - *Type:* Code node (JavaScript)  
    - *Role:* Flattens nested enrichment data and maps fields for Salesforce lead creation.  
    - *Configuration:* Maps over merged data, extracts relevant fields like prospect_id and enrichment details into a flat object.  
    - *Input:* Merged enrichment data.  
    - *Output:* Flat array of enriched prospect objects.  
    - *Failures:* JavaScript errors if input structure is unexpected.

---

#### 2.6 Salesforce Lead Creation

- **Overview:**  
  Creates new lead records in Salesforce populated with enriched data from Explorium.

- **Nodes Involved:**  
  - Salesforce

- **Node Details:**

  - **Salesforce**  
    - *Type:* Salesforce node  
    - *Role:* Creates lead records with enriched prospect data.  
    - *Configuration:*  
      - Operation: Create Lead  
      - Fields mapped from enriched JSON, including company, last name, city, email, phone, state, title, country, website, and mobile phone.  
      - Credentials: Salesforce OAuth2 API  
    - *Input:* Flattened enriched prospect JSON from Code node.  
    - *Output:* Salesforce record creation response.  
    - *Failures:* Salesforce API rate limits, field validation errors, authentication expiration.

---

### 3. Summary Table

| Node Name                          | Node Type             | Functional Role                                         | Input Node(s)                     | Output Node(s)                     | Sticky Note                                                                                                                   |
|-----------------------------------|-----------------------|---------------------------------------------------------|----------------------------------|-----------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| HubSpot Trigger                   | HubSpot Trigger       | Trigger on HubSpot contact events                        | (External)                      | HubSpot                          | Automatically enrich prospect data from HubSpot using Explorium and create leads in Salesforce. Requires credential setup.    |
| HubSpot                          | HubSpot               | Fetch full contact details by ID                         | HubSpot Trigger                 | Match_prospect                   |                                                                                                                                 |
| Match_prospect                   | HTTP Request          | Match prospect data with Explorium AI                    | HubSpot                        | Filter - non matched             | Sends contact data to Explorium's matching API to find prospect profiles.                                                     |
| Filter - non matched             | Filter                | Filter only matched prospects                             | Match_prospect                 | Extract Prospect IDs from Matched Results | Currently deactivated to allow all matches through.                                                                             |
| Extract Prospect IDs from Matched Results | Code                  | Extract prospect IDs from matched results                 | Filter - non matched           | Explorium Enrich Contacts Information, Explorium Enrich Profiles |                                                                                                                               |
| Explorium Enrich Contacts Information | HTTP Request          | Bulk enrich contacts’ information                         | Extract Prospect IDs from Matched Results | Merge                       |                                                                                                                               |
| Explorium Enrich Profiles        | HTTP Request          | Bulk enrich prospect profiles                             | Extract Prospect IDs from Matched Results | Merge                       |                                                                                                                               |
| Merge                           | Merge                 | Combine parallel enrichment results                       | Explorium Enrich Contacts Information, Explorium Enrich Profiles | Code - flatten               |                                                                                                                               |
| Code - flatten                  | Code                  | Flatten and prepare enrichment data for Salesforce       | Merge                         | Salesforce                     |                                                                                                                               |
| Salesforce                     | Salesforce             | Create leads in Salesforce with enriched data            | Code - flatten                | (End node)                    |                                                                                                                               |
| Sticky Note                    | Sticky Note            | Documentation and instructions                            | (None)                        | (None)                         | See detailed workflow overview, credentials, and explanation in this note.                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create HubSpot Trigger Node**  
   - Type: HubSpot Trigger  
   - Configure webhook for contact events (creation/updates).  
   - Set credentials: HubSpot Developer API (App Token).  
   - Position: Start of workflow.

2. **Add HubSpot Node**  
   - Type: HubSpot  
   - Operation: Get Contact  
   - Input: Contact ID from HubSpot Trigger node output.  
   - Credentials: HubSpot App Token.  
   - Purpose: Retrieve full contact details.  
   - Connect HubSpot Trigger → HubSpot.

3. **Add HTTP Request Node “Match_prospect”**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.explorium.ai/v1/prospects/match`  
   - Headers: `Content-Type: application/json`, `Accept: application/json`  
   - Authentication: Generic Header Auth with Explorium API key.  
   - Body (JSON): Dynamically build:  
     ```json
     {
       "prospects_to_match": [
         {
           "full_name": "{{ ($json.properties.firstname.value || '') + ' ' + ($json.properties.lastname.value || '') }}",
           "company_name": "{{ ($json.properties.company.value || '').trim() }}",
           "email": "{{ $json['identity-profiles'][0].identities.find(id => id.type === 'EMAIL').value }}"
         }
       ]
     }
     ```  
   - Connect HubSpot → Match_prospect.

4. **Add Filter Node “Filter - non matched”**  
   - Type: Filter  
   - Condition: Pass only if `matched_prospects.some(prospect => prospect.prospect_id !== null)` is true.  
   - Connect Match_prospect → Filter - non matched.  
   - (Optional: deactivate filter to allow all through.)

5. **Add Code Node “Extract Prospect IDs from Matched Results”**  
   - Type: Code  
   - Language: JavaScript  
   - Code:  
     ```javascript
     const allItems = $input.all();
     const prospectIds = allItems.map(item => 
       item.json.matched_prospects.map(prospect => prospect.prospect_id)
     ).flat();
     return [{
       json: {
         prospect_ids: prospectIds
       }
     }];
     ```  
   - Connect Filter - non matched → Extract Prospect IDs from Matched Results.

6. **Add HTTP Request Node “Explorium Enrich Contacts Information”**  
   - Type: HTTP Request  
   - Method: POST  
   - URL: `https://api.explorium.ai/v1/prospects/contacts_information/bulk_enrich`  
   - Headers: Content-Type and Accept: application/json  
   - Authentication: Generic Header Auth (same Explorium API key)  
   - Body: `{"prospect_ids": $json.prospect_ids}` (expression)  
   - Connect Extract Prospect IDs from Matched Results → Explorium Enrich Contacts Information (main input).

7. **Add HTTP Request Node “Explorium Enrich Profiles”**  
   - Same configuration as above, but URL:  
     `https://api.explorium.ai/v1/prospects/profiles/bulk_enrich`  
   - Connect Extract Prospect IDs from Matched Results → Explorium Enrich Profiles (main input).

8. **Add Merge Node “Merge”**  
   - Mode: Combine (to concatenate inputs)  
   - Connect Explorium Enrich Contacts Information → Merge (input 0)  
   - Connect Explorium Enrich Profiles → Merge (input 1)

9. **Add Code Node “Code - flatten”**  
   - Type: Code  
   - Language: JavaScript  
   - Code snippet example to flatten and map fields:  
     ```javascript
     return $input.all().map(item => 
       item.json.data.map(prospect => ({
         prospect_id: prospect.prospect_id,
         ...prospect.data
       }))
     ).flat();
     ```  
   - Connect Merge → Code - flatten.

10. **Add Salesforce Node**  
    - Type: Salesforce  
    - Operation: Create Lead  
    - Map enriched fields (e.g., company, lastname, city, email, phone, state, title, country, website, mobilePhone) using expressions from the flattened data.  
    - Credentials: Salesforce OAuth2 API or Username/Password.  
    - Connect Code - flatten → Salesforce.

11. **Add a Sticky Note** (optional but recommended)  
    - Add detailed documentation, credential notes, and overview inside the Sticky Note for users.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                          | Context or Link                                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| This workflow automatically enriches prospect data from HubSpot using Explorium.ai, integrating with Salesforce to create enriched lead records. Credentials for HubSpot App Token, Explorium Generic Header Auth, and Salesforce OAuth2 are required.                                                                                                                               | See the Sticky Note node content for detailed instructions.                                                  |
| Explorium API endpoints used: `/v1/prospects/match`, `/v1/prospects/contacts_information/bulk_enrich`, `/v1/prospects/profiles/bulk_enrich`. API key must be provided via header authorization.                                                                                                                                                                                      | https://docs.explorium.ai/                                                                                     |
| HubSpot trigger uses webhook; ensure public endpoint and valid credentials. Salesforce node requires proper OAuth2 configuration with permissions to create Lead records.                                                                                                                                                                                                             | HubSpot and Salesforce official API documentation.                                                           |
| The Filter node for non-matched prospects is currently deactivated; re-enable to prevent unmatched data from continuing downstream.                                                                                                                                                                                                                                                | Workflow configuration note.                                                                                   |
| Expressions use JavaScript syntax; ensure field paths exist in HubSpot JSON to avoid runtime errors. Use defensive programming if modifying.                                                                                                                                                                                                                                        | n8n expression documentation: https://docs.n8n.io/nodes/expressions/                                          |

---

**Disclaimer:** The provided content originates exclusively from an automated n8n workflow. It complies strictly with content policies and contains no illegal or offensive material. All processed data are legal and publicly accessible.