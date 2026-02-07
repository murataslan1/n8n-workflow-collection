Automate Zillow Property Search with Budget Filtering to Google Sheets

https://n8nworkflows.xyz/workflows/automate-zillow-property-search-with-budget-filtering-to-google-sheets-7070


# Automate Zillow Property Search with Budget Filtering to Google Sheets

---

### 1. Workflow Overview

This n8n workflow automates the process of retrieving property listings from Zillow, filters these properties based on a predefined buying budget, and appends or updates the filtered results into a Google Sheets document. It is designed for real estate investors or homebuyers who want to regularly monitor Zillow listings within their budget and maintain an up-to-date spreadsheet for analysis or tracking.

The workflow is organized into the following logical blocks:

- **1.1 Input Trigger:** Manual initiation of the workflow to start the search and data processing.
- **1.2 Data Retrieval:** Fetching raw property data from Zillow via an HTTP request.
- **1.3 Data Transformation:** Parsing and converting the raw array of properties into individual property items for processing.
- **1.4 Budget Filtering:** Filtering the individual property entries to only include those that meet the buyer’s budget constraints.
- **1.5 Data Output:** Appending or updating the filtered properties into a Google Sheets document for record-keeping.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Trigger

- **Overview:**  
This block triggers the entire workflow manually, allowing the user to initiate the property search and update process on demand.

- **Nodes Involved:**  
  - Manual Execution

- **Node Details:**

  - **Manual Execution**  
    - Type: Trigger node  
    - Role: Starts the workflow manually via user action in the n8n editor or via webhook trigger in the editor interface.  
    - Configuration: No parameters set; default manual trigger.  
    - Inputs: None  
    - Outputs: Connected to "Get Zillow Properties" node.  
    - Edge Cases: User must manually trigger; no automatic schedule or webhook integration here.  
    - Version: 1 (no special version requirements)  

#### 2.2 Data Retrieval

- **Overview:**  
This block sends a request to Zillow’s API or data source to retrieve the latest property listings.

- **Nodes Involved:**  
  - Get Zillow Properties

- **Node Details:**

  - **Get Zillow Properties**  
    - Type: HTTP Request  
    - Role: Performs an HTTP call to Zillow’s platform or API endpoint to fetch property data.  
    - Configuration: The exact endpoint, query parameters, headers, and authentication details are not specified here but would typically include URL for property search and any required API keys or tokens.  
    - Inputs: Triggered by "Manual Execution" node.  
    - Outputs: Raw JSON array or object containing property listing data.  
    - Edge Cases:  
      - HTTP errors (timeouts, 4xx/5xx responses) if Zillow’s API is unavailable or limits exceeded.  
      - Possible changes in Zillow’s API format or endpoint URL could break data retrieval.  
    - Version: 4.2+ recommended to support latest HTTP node features.

#### 2.3 Data Transformation

- **Overview:**  
Transforms the raw array of properties obtained from Zillow into individual property items for granular processing.

- **Nodes Involved:**  
  - Array to individual properties

- **Node Details:**

  - **Array to individual properties**  
    - Type: Code (JavaScript)  
    - Role: Parses the raw data, iterates over the array of properties, and outputs each as a separate item for downstream nodes.  
    - Configuration: Custom JavaScript code to handle data extraction and transformation. The code is not shown but is expected to map the property array correctly.  
    - Inputs: Raw JSON data from "Get Zillow Properties".  
    - Outputs: Individual property entries as separate items.  
    - Edge Cases:  
      - If the input data structure changes or is malformed, code may fail or produce incorrect outputs.  
      - Empty or null responses must be handled gracefully.  
    - Version: 2 (supports JavaScript execution)

#### 2.4 Budget Filtering

- **Overview:**  
Filters the individual property items to only pass those that fall within the buyer’s predefined budget.

- **Nodes Involved:**  
  - Filter properties by our buying budget

- **Node Details:**

  - **Filter properties by our buying budget**  
    - Type: If (conditional node)  
    - Role: Evaluates each property’s price against the budget criteria and routes only matching properties to the next node.  
    - Configuration: Conditional expression comparing property price field to a configured budget value (not explicitly shown).  
    - Inputs: Individual property items from "Array to individual properties".  
    - Outputs:  
      - True branch: Properties within budget, passed to "Append or update row in sheet".  
      - False branch: Properties outside budget, filtered out.  
    - Edge Cases:  
      - Missing or malformed price data in property item.  
      - Budget value not set or set incorrectly.  
      - Data type mismatches (string vs number).  
    - Version: 2.2 supports complex expressions and multiple outputs.

#### 2.5 Data Output

- **Overview:**  
This block appends new property records or updates existing rows in a Google Sheets document to maintain an updated property listing.

- **Nodes Involved:**  
  - Append or update row in sheet

- **Node Details:**

  - **Append or update row in sheet**  
    - Type: Google Sheets node  
    - Role: Writes property data into a designated Google Sheets spreadsheet, appending new rows or updating existing entries based on a key.  
    - Configuration:  
      - Spreadsheet ID and Sheet Name are set (not visible here).  
      - Mode likely set to "Append or Update" to avoid duplicates.  
      - Mapping of property fields to sheet columns configured.  
    - Inputs: Filtered property items from "Filter properties by our buying budget" node.  
    - Outputs: None or confirmation of rows updated.  
    - Edge Cases:  
      - Authentication errors with Google Sheets API (OAuth2 token expiration).  
      - Rate limits on Google Sheets API.  
      - Conflicts or errors during update if keys are not unique or properly mapped.  
    - Version: 4.6+ recommended for latest Google Sheets features.

---

### 3. Summary Table

| Node Name                     | Node Type             | Functional Role                                  | Input Node(s)             | Output Node(s)                      | Sticky Note                                                                                 |
|-------------------------------|-----------------------|-------------------------------------------------|---------------------------|------------------------------------|---------------------------------------------------------------------------------------------|
| Manual Execution               | Manual Trigger        | Starts workflow manually                         | -                         | Get Zillow Properties               |                                                                                             |
| Get Zillow Properties          | HTTP Request          | Retrieves property listings from Zillow         | Manual Execution          | Array to individual properties      |                                                                                             |
| Array to individual properties | Code                  | Parses property array into individual items     | Get Zillow Properties     | Filter properties by our buying budget |                                                                                             |
| Filter properties by our buying budget | If (Conditional)       | Filters properties by budget                     | Array to individual properties | Append or update row in sheet        |                                                                                             |
| Append or update row in sheet  | Google Sheets         | Adds or updates property records in Google Sheets | Filter properties by our buying budget | -                                  |                                                                                             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Execution Node**  
   - Add a **Manual Trigger** node. No configuration needed. This starts the workflow manually.

2. **Create HTTP Request Node "Get Zillow Properties"**  
   - Add an **HTTP Request** node connected to the Manual Trigger.  
   - Configure the HTTP request with Zillow API endpoint: set method to GET or POST as required by Zillow.  
   - Add necessary headers or authentication credentials (e.g., API key) via credentials section.  
   - Save the node as "Get Zillow Properties".

3. **Add Code Node "Array to individual properties"**  
   - Add a **Code** node connected to "Get Zillow Properties".  
   - Write JavaScript to parse the JSON response, iterate over the array of properties, and output each property as an individual item.  
   - Example snippet:  
     ```javascript
     const properties = items[0].json.properties; // Adjust path as needed
     return properties.map(property => ({ json: property }));
     ```  
   - Name the node "Array to individual properties".

4. **Add If Node "Filter properties by our buying budget"**  
   - Add an **If** node connected to the "Array to individual properties" node.  
   - Configure the condition to check if property price ≤ predefined budget value.  
   - Example expression: `{{$json["price"]}} <= 500000` (replace with actual budget).  
   - Use the True output branch for passing properties within budget.

5. **Add Google Sheets Node "Append or update row in sheet"**  
   - Add a **Google Sheets** node connected to the True output of the If node.  
   - Configure credentials for Google Sheets OAuth2.  
   - Set the operation to "Append" or "Append or Update" depending on requirements.  
   - Select the target Spreadsheet and Sheet.  
   - Map property fields (e.g., address, price, bedrooms) to appropriate sheet columns.  
   - Save the node.

6. **Connect the Workflow**  
   - Ensure connections flow: Manual Execution → Get Zillow Properties → Array to individual properties → Filter properties by our buying budget → Append or update row in sheet.

7. **Test Workflow**  
   - Manually trigger the workflow to verify data retrieval, filtering, and sheet updates.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                                |
|-----------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| Ensure Google Sheets credentials are set up with OAuth2 and have edit permissions for target sheet. | Google Sheets API documentation: https://developers.google.com/sheets/api |
| Zillow API details, including endpoint URLs and authentication, must be obtained separately.  | Zillow Developer Portal or API documentation (not publicly available) |
| Consider adding error handling nodes or retry logic for HTTP requests to improve robustness.  | n8n Documentation on error workflows: https://docs.n8n.io/nodes/trigger/error-trigger/ |
| For scheduled automatic updates, consider replacing Manual Trigger with Cron Trigger node.    | n8n Cron Trigger documentation: https://docs.n8n.io/nodes/trigger/cron/ |

---

disclaimer Le texte fourni provient exclusivement d’un workflow automatisé réalisé avec n8n, un outil d’intégration et d’automatisation. Ce traitement respecte strictement les politiques de contenu en vigueur et ne contient aucun élément illégal, offensant ou protégé. Toutes les données manipulées sont légales et publiques.

---