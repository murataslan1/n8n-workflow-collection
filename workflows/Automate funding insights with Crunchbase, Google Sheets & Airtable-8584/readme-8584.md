Automate funding insights with Crunchbase, Google Sheets & Airtable

https://n8nworkflows.xyz/workflows/automate-funding-insights-with-crunchbase--google-sheets---airtable-8584


# Automate funding insights with Crunchbase, Google Sheets & Airtable

### 1. Workflow Overview

This workflow automates the process of collecting, processing, and storing funding round insights from Crunchbase on a daily basis. It is designed for users needing up-to-date funding data for companies, including details such as funding amount, investors, categories, and announcement dates. The workflow is ideal for analysts, venture capital firms, or business intelligence teams tracking recent funding activities.

The workflow logic is divided into three main blocks:

- **1.1 Scheduled Trigger & Data Fetching:** Automatically triggers every day and retrieves the latest 100 funding rounds from the Crunchbase API.
- **1.2 Data Processing & Filtering:** Parses the raw API response into a structured, human-readable format and filters the data to only include funding rounds announced in the last 30 days.
- **1.3 Data Storage Outputs:** Saves the filtered funding insights simultaneously to Google Sheets and Airtable for reporting and database management purposes.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Data Fetching

**Overview:**  
This block initiates the workflow every day and fetches the most recent funding rounds data from Crunchbase’s API.

**Nodes Involved:**  
- 🕐 Daily Check  
- 📊 Fetch Recent Funding

**Node Details:**  

- **🕐 Daily Check**  
  - Type: Schedule Trigger  
  - Role: Automatically triggers the workflow daily without manual intervention.  
  - Configuration: Uses the default interval for daily execution.  
  - Inputs: None (start trigger)  
  - Outputs: Triggers the next node: 📊 Fetch Recent Funding  
  - Edge Cases: Misconfiguration may result in no trigger; ensure the n8n server time zone matches expected schedule.  

- **📊 Fetch Recent Funding**  
  - Type: HTTP Request  
  - Role: Calls Crunchbase API to fetch funding_rounds data (latest 100 records).  
  - Configuration:  
    - Method: POST  
    - URL: Crunchbase API endpoint with a placeholder for API key (`user_key={{YOUR_CRUNCHBASE_API_KEY}}`). User must replace `YOUR_CRUNCHBASE_API_KEY` with a valid key.  
    - Body Parameters: Requests specific fields such as identifiers, funding amounts, dates, organization details, investors, and investment types.  
    - Response Format: JSON  
  - Inputs: Trigger from 🕐 Daily Check  
  - Outputs: Raw API response JSON to 📄 Parse Funding Data  
  - Edge Cases:  
    - API key missing or invalid causes authentication errors.  
    - API rate limits or downtime may cause request failures or timeouts.  
    - Unexpected API schema changes may break downstream parsing.

#### 2.2 Data Processing & Filtering

**Overview:**  
Parses raw Crunchbase data into a structured format with clear fields, then filters to retain only funding rounds announced within the last 30 days.

**Nodes Involved:**  
- 📄 Parse Funding Data  
- 📅 Filter Recent (30 days)

**Node Details:**  

- **📄 Parse Funding Data**  
  - Type: Code (JavaScript)  
  - Role: Transforms raw Crunchbase JSON into a clean array of funding records with human-readable properties.  
  - Configuration:  
    - Custom JS code extracts funded organization details, investor names, categories, funding amounts (formatted as millions USD with “$XM”), announcement dates, descriptions, websites, and Crunchbase URLs.  
    - Adds a "scraped_at" field with current date in ISO format.  
  - Inputs: Raw JSON from 📊 Fetch Recent Funding  
  - Outputs: Structured JSON items to 📅 Filter Recent (30 days)  
  - Edge Cases:  
    - Missing or malformed fields in Crunchbase data may result in default "N/A" values.  
    - Unexpected nulls or array structures could cause runtime errors; code includes checks to mitigate this.  

- **📅 Filter Recent (30 days)**  
  - Type: Filter  
  - Role: Filters parsed funding records to only those announced after the date 30 days ago from execution.  
  - Configuration:  
    - Condition: Field "announced_date" must be after the date computed as current date minus 30 days (uses n8n expression with DateTime functions).  
  - Inputs: Parsed data from 📄 Parse Funding Data  
  - Outputs: Filtered data to both storage nodes 📊 Save to Google Sheets and 🗂️ Save to Airtable  
  - Edge Cases:  
    - Date format inconsistencies could cause filter misses.  
    - Records with "N/A" or missing announced_date will be excluded.

#### 2.3 Data Storage Outputs

**Overview:**  
Stores the filtered funding data in two external services: Google Sheets and Airtable, enabling both spreadsheet-based and database-like access.

**Nodes Involved:**  
- 📊 Save to Google Sheets  
- 🗂️ Save to Airtable

**Node Details:**  

- **📊 Save to Google Sheets**  
  - Type: Google Sheets  
  - Role: Appends or updates rows in a specified Google Sheet to maintain a funding tracker.  
  - Configuration:  
    - Operation: appendOrUpdate  
    - Sheet Name: "Funding Tracker"  
    - Document ID: Must be replaced by user’s Google Sheet ID (`YOUR_GOOGLE_SHEET_ID`)  
    - Columns mapped to fields such as Company Name, Funding Amount, Investors, Industry, Description, Crunchbase URL, etc.  
    - Cell format set to USER_ENTERED to allow formulas or formatting.  
  - Inputs: Filtered data from 📅 Filter Recent (30 days)  
  - Outputs: None (end node)  
  - Requirements: Google OAuth2 credentials for Google Sheets must be configured.  
  - Edge Cases:  
    - Credential expiration or permission issues can cause authentication failures.  
    - Sheet ID or sheet name errors cause write failures.

- **🗂️ Save to Airtable**  
  - Type: Airtable  
  - Role: Appends funding data as new records into an Airtable base for easy querying and management.  
  - Configuration:  
    - Operation: append  
    - Application ID and Table ID must be replaced with user’s Airtable app and table identifiers (`YOUR_AIRTABLE_APP_ID`, `YOUR_AIRTABLE_TABLE_ID`).  
    - Uses OAuth2 authentication with Airtable.  
  - Inputs: Filtered data from 📅 Filter Recent (30 days)  
  - Outputs: None (end node)  
  - Edge Cases:  
    - OAuth token expiration or permission issues can block writes.  
    - Invalid app or table IDs cause failures.  
    - Rate limits or Airtable API changes may affect operation.

---

### 3. Summary Table

| Node Name              | Node Type           | Functional Role                      | Input Node(s)         | Output Node(s)                            | Sticky Note                                                                                              |
|------------------------|---------------------|------------------------------------|-----------------------|------------------------------------------|----------------------------------------------------------------------------------------------------------|
| 🕐 Daily Check          | Schedule Trigger    | Starts workflow daily               | None                  | 📊 Fetch Recent Funding                  | The workflow is scheduled to run daily. Calls Crunchbase API with user_key={{YOUR_CRUNCHBASE_API_KEY}}.    |
| 📊 Fetch Recent Funding | HTTP Request       | Fetches latest funding rounds       | 🕐 Daily Check         | 📄 Parse Funding Data                     | See above                                                                                                 |
| 📄 Parse Funding Data   | Code (JavaScript)  | Parses and structures Crunchbase data | 📊 Fetch Recent Funding | 📅 Filter Recent (30 days)                | Parses raw data to readable format and fields. Filters only last 30 days funding rounds.                   |
| 📅 Filter Recent (30 days) | Filter           | Filters funding rounds by date      | 📄 Parse Funding Data  | 📊 Save to Google Sheets, 🗂️ Save to Airtable | Filters to keep only funding rounds announced within the last 30 days.                                    |
| 📊 Save to Google Sheets | Google Sheets      | Saves funding data to Google Sheets | 📅 Filter Recent (30 days) | None                                   | Saves standardized funding data for sharing and reporting.                                                |
| 🗂️ Save to Airtable      | Airtable           | Saves funding data to Airtable      | 📅 Filter Recent (30 days) | None                                   | Stores funding data for database management.                                                             |
| Workflow Info           | Sticky Note        | Describes Trigger & Fetching block  | None                  | None                                     | Describes block 1: daily trigger and Crunchbase API fetch with API key placeholder.                       |
| Workflow Info1          | Sticky Note        | Describes Data Processing block     | None                  | None                                     | Describes block 2: parsing and filtering recent data.                                                    |
| Workflow Info2          | Sticky Note        | Describes Storage Outputs block     | None                  | None                                     | Describes block 3: saving outputs to Google Sheets and Airtable.                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Name: 🕐 Daily Check  
   - Type: Schedule Trigger  
   - Configuration: Set to trigger every day (default daily interval).  
   - No credentials required.

2. **Create an HTTP Request node**  
   - Name: 📊 Fetch Recent Funding  
   - Type: HTTP Request  
   - Connection: Connect output of 🕐 Daily Check to input of this node.  
   - Configuration:  
     - HTTP Method: POST  
     - URL: `https://api.crunchbase.com/api/v4/searches/funding_rounds?user_key={{YOUR_CRUNCHBASE_API_KEY}}` (replace `YOUR_CRUNCHBASE_API_KEY` with your actual Crunchbase API key)  
     - Body Parameters:  
       - `field_ids`: `["identifier","funding_round_money_raised","announced_on","funded_organization_identifier","funded_organization_description","funded_organization_website","funded_organization_categories","investor_identifiers","investment_type"]`  
       - `order`: `[{"field_id":"announced_on","sort_order":"desc"}]`  
       - `limit`: `100`  
     - Response Format: JSON  
   - No additional credentials besides the API key in the URL.

3. **Create a Code node**  
   - Name: 📄 Parse Funding Data  
   - Type: Code  
   - Connection: Connect output of 📊 Fetch Recent Funding to input of this node.  
   - Configuration: Paste the JavaScript code provided below to parse the Crunchbase JSON, mapping the fields and formatting funding amounts as millions USD, extracting categories, investors, and adding a scrape date:

```javascript
// Parse and structure the funding data
const items = [];

if ($input.first().json.entities) {
  for (const entity of $input.first().json.entities) {
    const properties = entity.properties;
    const fundedOrg = properties.funded_organization_identifier;
    
    // Extract investor names
    let investors = '';
    if (properties.investor_identifiers && properties.investor_identifiers.length > 0) {
      investors = properties.investor_identifiers.map(inv => inv.value).join(', ');
    }
    
    // Extract categories
    let categories = '';
    if (fundedOrg && fundedOrg.categories && fundedOrg.categories.length > 0) {
      categories = fundedOrg.categories.map(cat => cat.value).join(', ');
    }
    
    // Format funding amount
    let fundingAmount = 'N/A';
    if (properties.funding_round_money_raised && properties.funding_round_money_raised.value_usd) {
      fundingAmount = `$${(properties.funding_round_money_raised.value_usd / 1000000).toFixed(2)}M`;
    }
    
    items.push({
      json: {
        company_name: fundedOrg ? fundedOrg.value : 'N/A',
        funding_amount: fundingAmount,
        funding_type: properties.investment_type ? properties.investment_type.value : 'N/A',
        announced_date: properties.announced_on ? properties.announced_on.value : 'N/A',
        description: fundedOrg && fundedOrg.short_description ? fundedOrg.short_description : 'N/A',
        website: fundedOrg && fundedOrg.website ? fundedOrg.website.value : 'N/A',
        industry: categories || 'N/A',
        investors: investors || 'N/A',
        crunchbase_url: fundedOrg ? `https://www.crunchbase.com/organization/${fundedOrg.permalink}` : 'N/A',
        scraped_at: new Date().toISOString().split('T')[0]
      }
    });
  }
}

return items;
```

4. **Create a Filter node**  
   - Name: 📅 Filter Recent (30 days)  
   - Type: Filter  
   - Connection: Connect output of 📄 Parse Funding Data to input of this node.  
   - Configuration:  
     - Condition: Keep items where `announced_date` is after the date 30 days ago.  
     - Expression for right side: `={{DateTime.now().minus({days: 30}).toFormat('yyyy-MM-dd')}}`  
     - Compare left side: `{{$json["announced_date"]}}`  
     - Operator: `after`  
     - Case sensitive: true  
     - Type validation: strict (date-time)  

5. **Create a Google Sheets node**  
   - Name: 📊 Save to Google Sheets  
   - Type: Google Sheets  
   - Connection: Connect "true" output of 📅 Filter Recent (30 days) to this node.  
   - Configuration:  
     - Operation: appendOrUpdate  
     - Spreadsheet ID: Replace with your Google Sheets document ID  
     - Sheet Name: "Funding Tracker"  
     - Columns (define mapping): Map fields as follows:  
       - Company Name → `{{$json.company_name}}`  
       - Funding Amount → `{{$json.funding_amount}}`  
       - Funding Type → `{{$json.funding_type}}`  
       - Date Announced → `{{$json.announced_date}}`  
       - Description → `{{$json.description}}`  
       - Website → `{{$json.website}}`  
       - Industry → `{{$json.industry}}`  
       - Investors → `{{$json.investors}}`  
       - Crunchbase URL → `{{$json.crunchbase_url}}`  
       - Scraped At → `{{$json.scraped_at}}`  
     - Cell Format: USER_ENTERED  
   - Credentials: Configure your Google Sheets OAuth2 credentials.

6. **Create an Airtable node**  
   - Name: 🗂️ Save to Airtable  
   - Type: Airtable  
   - Connection: Connect "true" output of 📅 Filter Recent (30 days) to this node (parallel to Google Sheets node).  
   - Configuration:  
     - Operation: Append  
     - Application ID: Replace with your Airtable app ID  
     - Table ID: Replace with your Airtable table ID  
   - Credentials: Configure Airtable OAuth2 credentials.

7. (Optional) Add Sticky Notes nodes with documentation content describing each block for clarity, matching the content from the three Workflow Info nodes.

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                                                                             |
|----------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| The Crunchbase API key must be obtained from your Crunchbase account and replaced in the HTTP Request URL. | Crunchbase API Documentation: https://data.crunchbase.com/docs                                                                 |
| Google Sheets OAuth2 credentials must have permission to edit the specified spreadsheet.                  | Google Sheets API: https://developers.google.com/sheets/api/guides/authorizing                                  |
| Airtable OAuth2 credentials require app and table IDs for the target base where data will be appended.   | Airtable API: https://airtable.com/api                                                                                 |
| The funding amount is formatted in millions USD with two decimals precision, e.g., $12.34M.             | This formatting simplifies large numbers for readability.                                                     |
| Filtering only the last 30 days ensures the dataset remains current and manageable.                       | The filter uses n8n’s DateTime library expression for dynamic date calculation.                                |

---

This documentation should enable both human users and automation agents to understand, reproduce, and maintain the funding insights pipeline effectively.