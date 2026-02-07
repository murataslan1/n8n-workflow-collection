Automate HubSpot to Salesforce Lead Creation with Explorium AI Enrichment

https://n8nworkflows.xyz/workflows/automate-hubspot-to-salesforce-lead-creation-with-explorium-ai-enrichment-4836


# Automate HubSpot to Salesforce Lead Creation with Explorium AI Enrichment

### 1. Workflow Overview

This workflow automates the process of enriching HubSpot contact data using Explorium’s AI-powered prospect matching and enrichment services, then creates enriched lead records in Salesforce. It is designed for marketing and sales teams aiming to enhance their CRM lead quality by integrating multiple platforms seamlessly.

The workflow is logically divided into the following functional blocks:

- **1.1 Input Reception:** Listening for new or updated contact events from HubSpot.
- **1.2 HubSpot Data Retrieval:** Fetching detailed contact information from HubSpot.
- **1.3 Prospect Matching:** Sending contact details to Explorium to find matching prospect profiles.
- **1.4 Validation & Filtering:** Ensuring only matched prospects with valid IDs proceed.
- **1.5 Prospect ID Extraction:** Extracting matched prospect IDs for bulk enrichment.
- **1.6 Parallel Explorium Enrichment:** Performing bulk enrichment of contact information and profiles in parallel using Explorium endpoints.
- **1.7 Data Consolidation:** Merging enriched data streams into one unified dataset.
- **1.8 Data Transformation:** Flattening and formatting the enriched data for Salesforce compatibility.
- **1.9 Salesforce Lead Creation:** Creating new lead records in Salesforce with enriched information.

---

### 2. Block-by-Block Analysis

#### Block 1.1: Input Reception

- **Overview:**  
  Listens for contact-related events in HubSpot and triggers the workflow upon new or updated contacts.

- **Nodes Involved:**  
  - HubSpot Trigger

- **Node Details:**  
  - **HubSpot Trigger**  
    - Type: `HubSpot Trigger` node  
    - Role: Webhook-based event listener for HubSpot contact changes  
    - Configuration: Uses a webhook ID registered in HubSpot Developer API credentials to receive events  
    - Output: Emits event metadata including `contactId`  
    - Inputs: None (trigger node)  
    - Outputs: Connected to HubSpot node  
    - Edge Cases: Webhook misconfiguration, HubSpot API downtime, missing permissions on HubSpot side

#### Block 1.2: HubSpot Data Retrieval

- **Overview:**  
  Fetches full contact details from HubSpot using the contact ID received from the trigger node.

- **Nodes Involved:**  
  - HubSpot

- **Node Details:**  
  - **HubSpot**  
    - Type: `HubSpot` node  
    - Role: Fetches contact resource by ID  
    - Configuration: Operation set to `get` contact with `contactId` from previous node  
    - Authentication: HubSpot App Token  
    - Inputs: Receives contact ID from HubSpot Trigger node  
    - Outputs: Full contact JSON with properties (firstname, lastname, company, identity profiles)  
    - Edge Cases: Invalid contact ID, authentication failure, rate limiting by HubSpot API

#### Block 1.3: Prospect Matching

- **Overview:**  
  Sends contact details to Explorium’s prospect matching API to find matching profiles in their AI database.

- **Nodes Involved:**  
  - Match_prospect

- **Node Details:**  
  - **Match_prospect**  
    - Type: HTTP Request node  
    - Role: Calls Explorium’s `/prospects/match` endpoint with contact data  
    - Configuration: POST request with JSON body dynamically composed of full name, company name, and email extracted from the HubSpot contact data  
    - Headers: Content-Type and Accept set to application/json, Authorization via generic header auth credential  
    - Inputs: Receives contact data from HubSpot node  
    - Outputs: JSON response containing matched prospects and prospect IDs  
    - Edge Cases: API auth failures, request timeouts, malformed expressions if contact data missing or incomplete

#### Block 1.4: Validation & Filtering

- **Overview:**  
  Filters out any unmatched or invalid prospect data to ensure only valid matched prospects proceed.

- **Nodes Involved:**  
  - Filter - non matched

- **Node Details:**  
  - **Filter - non matched**  
    - Type: Filter node  
    - Role: Checks if matched prospects array contains at least one non-null prospect_id  
    - Configuration: Boolean condition on `$json.matched_prospects.some(prospect => prospect.prospect_id !== null)`  
    - Inputs: Receives matched prospects from Match_prospect node  
    - Outputs: Passes only matched items forward  
    - Status: Active (note that in the sticky note it was mentioned as deactivated but the JSON shows it connected and active)  
    - Edge Cases: Empty matched prospects, JSON parsing issues, false negatives if data structure changes

#### Block 1.5: Prospect ID Extraction

- **Overview:**  
  Extracts all valid prospect IDs from the matched results for bulk enrichment.

- **Nodes Involved:**  
  - Extract Prospect IDs from Matched Results

- **Node Details:**  
  - **Extract Prospect IDs from Matched Results**  
    - Type: Code node  
    - Role: Maps over all matched prospects, extracting `prospect_id` and flattening into a single array  
    - Configuration: JavaScript code returns an object with `prospect_ids` array  
    - Inputs: From Filter node  
    - Outputs: Single JSON object containing array of prospect IDs  
    - Edge Cases: Null or missing matched prospects, empty arrays, runtime exceptions in code

#### Block 1.6: Parallel Explorium Enrichment

- **Overview:**  
  Performs parallel bulk enrichment calls to Explorium’s endpoints for contacts information and profiles.

- **Nodes Involved:**  
  - Explorium Enrich Contacts Information  
  - Explorium Enrich Profiles

- **Node Details:**  
  - **Explorium Enrich Contacts Information**  
    - Type: HTTP Request node  
    - Role: POST to `/prospects/contacts_information/bulk_enrich` with prospect IDs array  
    - Headers: Content-Type and Accept as application/json  
    - Authentication: Header Auth using Explorium API key  
    - Inputs: Receives prospect IDs from extraction node  
    - Outputs: Enriched contact information JSON  
    - Edge Cases: API rate limiting, partial response data, authentication errors  

  - **Explorium Enrich Profiles**  
    - Type: HTTP Request node  
    - Role: POST to `/prospects/profiles/bulk_enrich` with same prospect IDs  
    - Headers and Auth same as above  
    - Inputs: Receives prospect IDs from extraction node  
    - Outputs: Enriched profiles JSON  
    - Edge Cases: Same as above

#### Block 1.7: Data Consolidation

- **Overview:**  
  Merges the two parallel enrichment data streams into a single combined data output.

- **Nodes Involved:**  
  - Merge

- **Node Details:**  
  - **Merge**  
    - Type: Merge node  
    - Role: Combines data streams from contact information and profiles enrichment nodes  
    - Configuration: Mode set to `combine` (concatenates inputs rather than matching)  
    - Inputs: Two inputs from Explorium Enrich Contacts Information and Explorium Enrich Profiles  
    - Outputs: Single merged array of enriched prospect data  
    - Edge Cases: Inconsistent data length, data alignment issues

#### Block 1.8: Data Transformation

- **Overview:**  
  Flattens and prepares the merged enrichment data for Salesforce lead creation.

- **Nodes Involved:**  
  - Code - flatten

- **Node Details:**  
  - **Code - flatten**  
    - Type: Code node  
    - Role: Maps over merged data, flattens nested structures, and reformats for Salesforce fields  
    - Configuration: JavaScript code merges each `prospect` object with its nested data properties into a flat structure  
    - Inputs: From Merge node  
    - Outputs: Flat JSON objects suitable for Salesforce lead fields  
    - Edge Cases: Unexpected data structure, undefined properties, code runtime errors

#### Block 1.9: Salesforce Lead Creation

- **Overview:**  
  Creates new lead records in Salesforce using the enriched and transformed contact data.

- **Nodes Involved:**  
  - Salesforce

- **Node Details:**  
  - **Salesforce**  
    - Type: Salesforce node  
    - Role: Create Lead operation with enriched prospect data mapped to lead fields  
    - Configuration: Fields like company, lastname, city, email, phone, state, title, country, website, mobilePhone are mapped dynamically from the enriched JSON  
    - Authentication: Salesforce OAuth2 API credentials  
    - Inputs: Receives flattened data from Code - flatten node  
    - Outputs: Successfully created leads or errors  
    - Edge Cases: Authentication token expiry, field validation errors, API limits, network errors

---

### 3. Summary Table

| Node Name                          | Node Type           | Functional Role                        | Input Node(s)                        | Output Node(s)                    | Sticky Note                                                                                                                                                                                                                                                             |
|-----------------------------------|---------------------|-------------------------------------|------------------------------------|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| HubSpot Trigger                   | HubSpot Trigger     | Triggers on new/updated HubSpot contacts | None                               | HubSpot                          | Automatically enrich prospect data from HubSpot using Explorium and create leads in Salesforce. Requires HubSpot, Explorium, and Salesforce credentials. Workflow overview and node descriptions included.                                                              |
| HubSpot                          | HubSpot             | Fetches contact details from HubSpot | HubSpot Trigger                   | Match_prospect                   | See above                                                                                                                                                                                                                                                              |
| Match_prospect                   | HTTP Request        | Matches prospect using Explorium AI | HubSpot                           | Filter - non matched             | See above                                                                                                                                                                                                                                                              |
| Filter - non matched             | Filter              | Filters only matched prospects with valid IDs | Match_prospect                    | Extract Prospect IDs from Matched Results | See above                                                                                                                                                                                                                                                              |
| Extract Prospect IDs from Matched Results | Code                | Extracts all prospect_ids from matched results | Filter - non matched              | Explorium Enrich Contacts Information, Explorium Enrich Profiles | See above                                                                                                                                                                                                                                                              |
| Explorium Enrich Contacts Information | HTTP Request        | Bulk enrich contact information via Explorium | Extract Prospect IDs from Matched Results | Merge                         | See above                                                                                                                                                                                                                                                              |
| Explorium Enrich Profiles        | HTTP Request        | Bulk enrich profiles via Explorium  | Extract Prospect IDs from Matched Results | Merge                         | See above                                                                                                                                                                                                                                                              |
| Merge                           | Merge               | Combines enrichment data streams     | Explorium Enrich Contacts Information, Explorium Enrich Profiles | Code - flatten                  | See above                                                                                                                                                                                                                                                              |
| Code - flatten                   | Code                | Flattens and formats enrichment data | Merge                             | Salesforce                      | See above                                                                                                                                                                                                                                                              |
| Salesforce                      | Salesforce          | Creates lead in Salesforce with enriched data | Code - flatten                   | None                           | See above                                                                                                                                                                                                                                                              |
| Sticky Note                     | Sticky Note         | Documentation and instructions       | None                             | None                           | Automatically enrich prospect data from HubSpot using Explorium and create leads in Salesforce. Credentials required and detailed workflow overview provided.                                                                                                          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create HubSpot Trigger Node**  
   - Type: HubSpot Trigger  
   - Configure webhook with HubSpot Developer API credentials (App or OAuth2)  
   - Set to listen for contact creation or update events  
   - Save webhook ID for reference  

2. **Add HubSpot Node**  
   - Type: HubSpot  
   - Operation: Get Contact  
   - Input: `contactId` from HubSpot Trigger output  
   - Authentication: HubSpot App Token credentials  
   - Ensure it fetches contact details fully (disable "Return All")  

3. **Add HTTP Request Node "Match_prospect"**  
   - Method: POST  
   - URL: `https://api.explorium.ai/v1/prospects/match`  
   - Authentication: Generic Header Auth with Explorium API key (Authorization: Bearer YOUR_API_KEY)  
   - Headers: Content-Type `application/json`, Accept `application/json`  
   - Body (JSON, raw expression):  
     ```json
     {
       "prospects_to_match": [
         {
           "full_name": "={{ ($json.properties.firstname.value || '') + ' ' + ($json.properties.lastname.value || '') }}",
           "company_name": "={{ ($json.properties.company.value || '').trim() }}",
           "email": "={{ $json['identity-profiles'][0].identities.find(id => id.type === 'EMAIL').value }}"
         }
       ]
     }
     ```  
   - Connect input from HubSpot node  

4. **Add Filter Node "Filter - non matched"**  
   - Condition: Boolean expression  
   - Expression: `{{$json.matched_prospects.some(prospect => prospect.prospect_id !== null)}}` must be true  
   - Connect input from Match_prospect node  

5. **Add Code Node "Extract Prospect IDs from Matched Results"**  
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
   - Connect input from Filter node  

6. **Add HTTP Request Node "Explorium Enrich Contacts Information"**  
   - Method: POST  
   - URL: `https://api.explorium.ai/v1/prospects/contacts_information/bulk_enrich`  
   - Authentication: Generic Header Auth with Explorium API key  
   - Headers: Content-Type and Accept: `application/json`  
   - Body (JSON): `={{ { "prospect_ids": $json.prospect_ids } }}`  
   - Connect input from Extract Prospect IDs node  

7. **Add HTTP Request Node "Explorium Enrich Profiles"**  
   - Method: POST  
   - URL: `https://api.explorium.ai/v1/prospects/profiles/bulk_enrich`  
   - Authentication: Generic Header Auth with Explorium API key  
   - Headers: Content-Type and Accept: `application/json`  
   - Body (JSON): `={{ { "prospect_ids": $json.prospect_ids } }}`  
   - Connect input from Extract Prospect IDs node  

8. **Add Merge Node**  
   - Mode: Combine  
   - Connect first input from "Explorium Enrich Contacts Information"  
   - Connect second input from "Explorium Enrich Profiles"  

9. **Add Code Node "Code - flatten"**  
   - Language: JavaScript  
   - Code:  
     ```javascript
     return $input.all().map(item => 
       item.json.data.map(prospect => ({
         prospect_id: prospect.prospect_id,
         ...prospect.data
       }))
     ).flat();
     ```  
   - Connect input from Merge node  

10. **Add Salesforce Node**  
    - Operation: Create Lead  
    - Authentication: Salesforce OAuth2 credentials  
    - Map the following fields from flattened JSON:  
      - `company` ← `experience[0].company.name`  
      - `lastname` ← `full_name`  
      - `city` ← `city` or null  
      - `email` ← `professions_email` or null  
      - `phone` ← first phone number or "null" string  
      - `state` ← `region_name` or empty string  
      - `title` ← `experience[0].title.name` or null  
      - `country` ← `country_name` or null  
      - `website` ← `experience[0].company.website` or null  
      - `mobilePhone` ← `mobile_phone`  
    - Connect input from Code - flatten node  

11. **Test the Workflow**  
    - Ensure all credentials are configured correctly (HubSpot, Explorium, Salesforce)  
    - Trigger a test event in HubSpot (create or update a contact)  
    - Check data flow, API responses, and Salesforce lead creation  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Context or Link                                                                                                      |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| This workflow automates the enrichment of HubSpot prospects using Explorium’s AI prospect matching and bulk enrichment APIs, then creates leads in Salesforce with enriched data for improved sales outcomes. Credentials for HubSpot (App Token), Explorium API (Generic Header Auth), and Salesforce (OAuth2) must be set up prior to use.                                                                                                                                                                            | General overview and credential setup instructions                                                                   |
| For detailed Explorium API documentation and endpoints used (`/prospects/match`, `/prospects/contacts_information/bulk_enrich`, `/prospects/profiles/bulk_enrich`), consult: https://explorium.ai/api-reference                                                                                                                                                                                                                                                                                                               | Explorium API documentation                                                                                          |
| HubSpot webhook configuration and permissions require developer setup to enable contact event triggers. Ensure webhook URLs are reachable by HubSpot. Documentation: https://developers.hubspot.com/docs/api/webhooks                                                                                                                                                                                                                                                                                                         | HubSpot developer API docs                                                                                            |
| Salesforce OAuth2 credentials require app registration and permission scopes for Lead creation. Token refresh handling is recommended for production stability. Salesforce docs: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_web_server_oauth_flow.htm                                                                                                                                                                                                                           | Salesforce OAuth2 setup                                                                                                |
| The workflow includes a disabled "Filter" node in the sticky note but active in JSON. Adjust filtering logic as needed based on business rules to avoid processing unmatched prospects.                                                                                                                                                                                                                                                                                                                                         | Workflow maintenance note                                                                                             |
| For troubleshooting, pay attention to: API rate limits, data field availability (e.g., identity profiles in HubSpot contacts), and network connectivity between n8n and external APIs.                                                                                                                                                                                                                                                                                                                                           | Operational considerations                                                                                            |

---

**Disclaimer:** The provided text is exclusively based on an automated workflow created with n8n, a workflow automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly available.