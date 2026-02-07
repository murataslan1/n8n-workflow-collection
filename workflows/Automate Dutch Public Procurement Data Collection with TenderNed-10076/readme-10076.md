Automate Dutch Public Procurement Data Collection with TenderNed

https://n8nworkflows.xyz/workflows/automate-dutch-public-procurement-data-collection-with-tenderned-10076


# Automate Dutch Public Procurement Data Collection with TenderNed

### 1. Workflow Overview

This workflow automates the collection and processing of Dutch public procurement tender data from the TenderNed platform. It is designed to run daily, fetch new tender publications via the TenderNed API, retrieve detailed XML and JSON data for each tender, parse and flatten this data for easier analysis, filter tenders based on specified CPV codes, and finally store the filtered results in a data table.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Triggering the workflow manually or on schedule, and fetching the initial list of tender publications from the TenderNed API.
- **1.2 Response Processing**: Extracting the list of tenders from the API response and splitting it into individual items.
- **1.3 Per-Tender Detail Retrieval Loop**: Iterating over each tender item to fetch detailed XML and JSON data, parsing XML to JSON, and merging these data sources into one comprehensive record.
- **1.4 Aggregation and Flattening**: Collecting all processed tenders, flattening complex XML structures into usable fields, and enriching data with detailed extraction and transformation logic.
- **1.5 Filtering and Saving**: Filtering tenders based on CPV codes and other criteria, and inserting the filtered items into a data table for storage.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

**Overview:**  
This block initiates the workflow either manually or on a schedule and fetches the latest tender publications from the TenderNed API, limited to tenders from a specified date and type.

**Nodes Involved:**  
- Schedule Trigger  
- When clicking ‘Execute workflow’ (Manual Trigger)  
- Tenderned Publicaties (HTTP Request)  

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Configuration: Runs daily at 9:00 AM (default interval)  
  - Inputs: None (trigger only)  
  - Outputs: Triggers the next node (Tenderned Publicaties)  
  - Notes: Enables automatic daily runs without manual intervention  
  - Potential Failures: None, but workflow depends on schedule integrity  

- **When clicking ‘Execute workflow’**  
  - Type: Manual Trigger  
  - Configuration: Standard manual trigger for testing or development  
  - Inputs: None  
  - Outputs: Triggers Tenderned Publicaties node  
  - Notes: Allows manual execution for development/testing  

- **Tenderned Publicaties**  
  - Type: HTTP Request  
  - Configuration:  
    - URL: `https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties`  
    - Query Parameters:  
      - `publicatieDatumVanaf`: Fixed date "2025-01-01" (example, should be updated dynamically)  
      - `size`: 100 (max results per page)  
      - `publicatieType`: "VAK" (publication type filter)  
    - Authentication: HTTP Basic Auth with configured credentials  
    - Timeout: 30 seconds  
  - Inputs: Trigger from Schedule or Manual node  
  - Outputs: API response with a list of tender publications  
  - Failure Types: Network issues, authentication failure, API limits  

---

#### 2.2 Response Processing

**Overview:**  
Processes the API response to extract the array of tender publications and splits them into individual tender items for separate processing.

**Nodes Involved:**  
- Verwerk Response (Code)  
- Split Out  

**Node Details:**

- **Verwerk Response**  
  - Type: Code  
  - Configuration:  
    - Extracts `content` array from API response or uses the response directly if it is an array  
    - Logs the number of tenders found  
    - Returns JSON with `aantalPublicaties` and `publicaties` array for downstream nodes  
  - Inputs: Tenderned Publicaties node  
  - Outputs: Single JSON item with array `publicaties`  
  - Edge Cases:  
    - Empty results (returns message 'Geen nieuwe tenders gevonden')  
    - Unexpected response structure  
  - Notes: Prepares data for splitting  

- **Split Out**  
  - Type: Split Out  
  - Configuration:  
    - Splits on the field `publicaties`  
    - Includes all other fields in output  
  - Inputs: Verwerk Response  
  - Outputs: One item per tender in `publicaties` array  
  - Failure Types: Invalid or missing `publicaties` field  

---

#### 2.3 Per-Tender Detail Retrieval Loop

**Overview:**  
Iterates over each tender item, fetching detailed XML and JSON data for each tender by its `publicatieId`, parses XML data, and merges the detailed sources into one combined record.

**Nodes Involved:**  
- Loop Over Items (Split In Batches)  
- Haal XML Details (HTTP Request)  
- XML (XML Parse)  
- Haal JSON Details (HTTP Request)  
- Merge  

**Node Details:**

- **Loop Over Items**  
  - Type: Split In Batches  
  - Configuration: Default batch size (implicitly 1) for rate limiting  
  - Inputs: Split Out  
  - Outputs: Sends single tender item to both Haal XML Details and Haal JSON Details nodes  
  - Notes: Prevents API rate limiting by processing one tender at a time  
  - Failure Types: Timeout on long loops, interruptions  

- **Haal XML Details**  
  - Type: HTTP Request  
  - Configuration:  
    - URL template: `https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties/{{ $json.publicaties.publicatieId }}/public-xml`  
    - Response format: Text (raw XML)  
    - Authentication: HTTP Basic Auth  
    - Timeout: 30 seconds  
  - Inputs: Loop Over Items  
  - Outputs: Raw XML string  
  - Failure Types: Network errors, 404 if tender XML missing  

- **XML (Parser)**  
  - Type: XML  
  - Configuration: Trim whitespace option enabled  
  - Inputs: Haal XML Details  
  - Outputs: Parsed XML converted to JSON  
  - Failure Types: Malformed XML, parsing errors  

- **Haal JSON Details**  
  - Type: HTTP Request  
  - Configuration:  
    - URL template: `https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties/{{ $json.publicaties.publicatieId }}`  
    - Authentication: HTTP Basic Auth  
    - Timeout: 30 seconds  
  - Inputs: Loop Over Items  
  - Outputs: JSON with detailed tender metadata (e.g., kenmerk, keywords)  
  - Failure Types: Network issues, missing data  

- **Merge**  
  - Type: Merge  
  - Configuration:  
    - Number of inputs: 3 (Input 1: JSON Details, Input 2: XML parsed data, Input 3: Original tender info)  
    - Mode: Merge by position (combines the corresponding items by index)  
  - Inputs: Haal JSON Details (1), XML (2), Loop Over Items (3)  
  - Outputs: Single combined item per tender with all details  
  - Failure Types: Mismatched input counts, missing input data  

---

#### 2.4 Aggregation and Flattening

**Overview:**  
After processing each tender, this block aggregates all detailed tender items into an array, flattens complex XML structures, enriches fields with fixed logic, and extracts useful procurement details into flat, accessible fields.

**Nodes Involved:**  
- Aggregate  
- Splits Alle Velden (Code)  

**Node Details:**

- **Aggregate**  
  - Type: Aggregate  
  - Configuration:  
    - Aggregates all loop items into one array stored in `allData` field  
  - Inputs: Merge  
  - Outputs: Single item with aggregated data array  
  - Failure Types: Memory overload if too many items  

- **Splits Alle Velden**  
  - Type: Code  
  - Configuration:  
    - Complex JavaScript extracting and flattening:  
      - Separates XML, publicaties, and JSON detail data from aggregated input  
      - Flattens nested XML objects recursively into flat key-value pairs  
      - Fixes and enriches fields such as notes, descriptions (including lots), estimated value, deadlines, framework agreement types  
      - Extracts contact info, related publications, UBL metadata  
      - Extracts and formats awarding criteria including sub-criteria weighted percentages  
      - Detects platform based on URL (e.g., Mercell, TED, PIANOo)  
      - Extracts CPV codes and keywords  
      - Constructs various URLs and timestamps  
      - Logs progress and counts throughout  
      - Returns a fully flattened and enriched JSON object ready for filtering and storage  
  - Inputs: Aggregate  
  - Outputs: Filterable, structured tender data  
  - Failure Types: JavaScript errors if input structure changes, missing fields, malformed XML data  
  - Notes: This node is the core data transformation step and requires careful maintenance for TenderNed API changes  

---

#### 2.5 Filtering and Saving

**Overview:**  
Filters tenders based on configured CPV codes and other criteria, then inserts qualifying tenders into a data table for storage.

**Nodes Involved:**  
- Filter op ...  
- Insert row (Data Table)  

**Node Details:**

- **Filter op ...**  
  - Type: Filter  
  - Configuration:  
    - Conditions check if the tender's `cpv_codes` array contains any from a large specified list of CPV codes relevant to the user  
    - Filters tenders strictly based on the presence of these CPV codes  
  - Inputs: Splits Alle Velden  
  - Outputs: Only tenders matching CPV codes  
  - Failure Types: Misconfiguration may filter out all tenders or allow irrelevant data  

- **Insert row**  
  - Type: Data Table  
  - Configuration:  
    - Inserts each filtered tender as a new row in a configured n8n Data Table  
    - Columns mapped automatically from incoming JSON fields  
  - Inputs: Filter op ...  
  - Outputs: None (writes to database)  
  - Failure Types: Data Table misconfiguration, missing columns, connection issues  

---

### 3. Summary Table

| Node Name              | Node Type            | Functional Role                            | Input Node(s)              | Output Node(s)                  | Sticky Note                                                                                                  |
|------------------------|----------------------|--------------------------------------------|----------------------------|--------------------------------|--------------------------------------------------------------------------------------------------------------|
| Schedule Trigger       | Schedule Trigger     | Starts workflow automatically daily       | —                          | Tenderned Publicaties           | ## Schedule Trigger: Runs daily at 9:00 AM; Manual trigger available for testing                             |
| When clicking ‘Execute workflow’ | Manual Trigger       | Starts workflow manually for testing       | —                          | Tenderned Publicaties           | Allows manual execution for development/testing                                                              |
| Tenderned Publicaties  | HTTP Request         | Fetches list of tender publications        | Schedule Trigger, Manual Trigger | Verwerk Response               | ## Fetch Tender Publications: Uses TenderNed API with HTTP Basic Auth; filters tenders by date and type      |
| Verwerk Response       | Code                 | Extracts 'publicaties' array from API response | Tenderned Publicaties        | Split Out                      | ## Process API Response: Unwraps API response to get array of tenders                                        |
| Split Out              | Split Out            | Splits tenders array into individual items | Verwerk Response            | Loop Over Items                | ## Split for Filtering: Prepares individual tender items for processing                                       |
| Loop Over Items        | Split In Batches     | Processes tenders one-by-one to avoid rate limits | Split Out                  | Haal XML Details, Haal JSON Details, Merge (via next nodes) | ## Loop Over Items: Processes tenders sequentially for reliable API calls                                    |
| Haal XML Details       | HTTP Request         | Fetches raw XML detail for each tender     | Loop Over Items             | XML                           | ## Fetch XML Details: Retrieves tender XML document; response as text for parsing                             |
| XML                    | XML Parser           | Parses raw XML string to JSON               | Haal XML Details            | Merge                         | ## Parse XML to JSON: Converts XML to JSON for easier data handling                                          |
| Haal JSON Details      | HTTP Request         | Fetches JSON detail data for each tender    | Loop Over Items             | Merge                         | ## Fetch JSON Details: Retrieves detailed metadata like keywords, reference numbers                           |
| Merge                  | Merge                | Combines JSON details, parsed XML, and original data | Haal JSON Details, XML, Loop Over Items | Aggregate                     | ## Merge All Data: Combines all tender details into one record                                               |
| Aggregate              | Aggregate            | Collects all processed tenders into array  | Merge                      | Splits Alle Velden             | ## Aggregate Loop Results: Prepares all tenders for batch processing                                         |
| Splits Alle Velden     | Code                 | Flattens XML and enriches tender data      | Aggregate                   | Filter op ...                 | Core transformation node: Flattens XML, extracts lots, criteria, platform detection, contact info, etc.      |
| Filter op ...          | Filter               | Filters tenders by configured CPV codes    | Splits Alle Velden          | Insert row                    | ## Filter Tenders: Configure CPV and other criteria for filtering                                            |
| Insert row             | Data Table           | Stores filtered tenders in a data table     | Filter op ...               | —                            | ## Save to Data Table: Inserts tenders as rows into configured n8n Data Table                                |
| Sticky Note1           | Sticky Note          | Documentation and TenderNed API info        | —                          | —                            | Detailed workflow documentation including API links and parameter info                                       |
| Schedule Info          | Sticky Note          | Explains schedule trigger and manual test   | —                          | —                            | Describes schedule and manual trigger usage                                                                  |
| API Fetch Info         | Sticky Note          | Explains TenderNed API fetch node           | —                          | —                            | Describes API endpoint, data fetched, and authentication setup                                              |
| Process Response Info  | Sticky Note          | Explains response processing node           | —                          | —                            | Details extraction of tenders from API response                                                              |
| Split Info             | Sticky Note          | Explains splitting tenders for processing   | —                          | —                            | Why and how tenders are split into individual items                                                          |
| Loop Info              | Sticky Note          | Explains Loop Over Items node                | —                          | —                            | Rate limiting logic to process tenders one at a time                                                         |
| JSON Details Info      | Sticky Note          | Explains JSON details fetch node             | —                          | —                            | Details on what JSON data is fetched for each tender                                                         |
| XML Details Info       | Sticky Note          | Explains XML fetch node                       | —                          | —                            | Details on XML data fetched and format                                                                        |
| XML Parser Info        | Sticky Note          | Explains XML parsing node                     | —                          | —                            | Why XML is parsed to JSON                                                                                      |
| Merge Info             | Sticky Note          | Explains merging of data sources              | —                          | —                            | Combines JSON, XML, and original tender info                                                                 |
| Aggregate Info         | Sticky Note          | Explains aggregation of all loop results      | —                          | —                            | Collects all processed tenders into a single array for batch processing                                       |
| Split for Filter Info  | Sticky Note          | Explains splitting aggregated data for filtering | —                          | —                            | Prepares aggregated data for filtering                                                                        |
| Filter Configuration   | Sticky Note          | Explains filtering configuration               | —                          | —                            | Instructions to configure filter criteria                                                                     |
| Database Setup         | Sticky Note          | Explains saving filtered tenders to data table | —                          | —                            | Steps to setup and configure Data Table for storage                                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Configure to run daily at 9:00 AM (or desired interval)  
   - No inputs  

2. **Add a Manual Trigger node**  
   - Type: Manual Trigger  
   - For manual testing and development  
   - No inputs  

3. **Create an HTTP Request node named "Tenderned Publicaties"**  
   - URL: `https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties`  
   - Method: GET  
   - Query Parameters:  
     - `publicatieDatumVanaf`: Set to desired start date (e.g., `=new Date().toISOString().slice(0,10)` for dynamic)  
     - `size`: 100 (max per request)  
     - `publicatieType`: "VAK" (or other type as needed)  
   - Authentication: HTTP Basic Auth (configure credentials with TenderNed API user/pass)  
   - Connect Schedule Trigger and Manual Trigger nodes to this node's input  

4. **Add a Code node "Verwerk Response"**  
   - Purpose: Extract `publicaties` array from API response  
   - Code to extract `content` field or use response array directly:  
     ```javascript
     const response = $input.item.json;
     let publicaties = [];
     if (response.content && Array.isArray(response.content)) {
       publicaties = response.content;
     } else if (Array.isArray(response)) {
       publicaties = response;
     }
     return { json: { aantalPublicaties: publicaties.length, publicaties } };
     ```  
   - Connect Tenderned Publicaties output to this node  

5. **Add a Split Out node "Split Out"**  
   - Split on field: `publicaties`  
   - Include all other fields  
   - Input: Verwerk Response  

6. **Add a Split In Batches node "Loop Over Items"**  
   - Batch Size: 1 (to limit API calls)  
   - Input: Split Out node  

7. **Add two HTTP Request nodes:**  
   - **"Haal XML Details"**  
     - URL: `https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties/{{ $json.publicaties.publicatieId }}/public-xml`  
     - Method: GET  
     - Response Format: Text (raw XML)  
     - Authentication: HTTP Basic Auth (same credentials)  
     - Timeout: 30 seconds  
     - Input: Loop Over Items  
   - **"Haal JSON Details"**  
     - URL: `https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties/{{ $json.publicaties.publicatieId }}`  
     - Method: GET  
     - Authentication: HTTP Basic Auth  
     - Timeout: 30 seconds  
     - Input: Loop Over Items  

8. **Add an XML node "XML"**  
   - Purpose: Parse XML string from Haal XML Details  
   - Option: Trim whitespace enabled  
   - Input: Haal XML Details  

9. **Add a Merge node "Merge"**  
   - Number of Inputs: 3  
   - Mode: Merge by Position  
   - Connect:  
     - Input 1: Haal JSON Details  
     - Input 2: XML node  
     - Input 3: Loop Over Items (original tender item)  

10. **Add an Aggregate node "Aggregate"**  
    - Aggregate all items into one array field `allData`  
    - Input: Merge  

11. **Add a Code node "Splits Alle Velden"**  
    - Paste the provided JavaScript code that flattens XML data, extracts fields, enriches, and prepares tender data  
    - Input: Aggregate  

12. **Add a Filter node "Filter op ..."**  
    - Configure condition: Check if `cpv_codes` array contains any of the specified CPV codes relevant for filtering tenders  
    - Input: Splits Alle Velden  

13. **Add a Data Table node "Insert row"**  
    - Create or select an n8n Data Table beforehand with columns matching the tender fields  
    - Map incoming data to columns (auto mapping or manual)  
    - Input: Filter op ...  

14. **Connect all nodes accordingly:**  
    - Schedule Trigger & Manual Trigger → Tenderned Publicaties  
    - Tenderned Publicaties → Verwerk Response → Split Out → Loop Over Items  
    - Loop Over Items → Haal XML Details → XML → Merge (input 2)  
    - Loop Over Items → Haal JSON Details → Merge (input 1)  
    - Loop Over Items → Merge (input 3)  
    - Merge → Aggregate → Splits Alle Velden → Filter op ... → Insert row  

15. **Credentials:**  
    - Configure HTTP Basic Auth credentials for TenderNed API in both HTTP Request nodes ("Tenderned Publicaties", "Haal XML Details", "Haal JSON Details")  

16. **Testing:**  
    - Run manual trigger to verify functionality  
    - Adjust `publicatieDatumVanaf` dynamically for incremental fetching (e.g., current date minus 1 day)  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                                         |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Workflow automatically scrapes TenderNed tenders with detailed XML and JSON data, filters by CPV codes, and saves results daily.                                                                                                                                                                                                            | TenderNed Tender Scraper Workflow sticky note                                                                           |
| TenderNed API documentation and parameters: https://www.tenderned.nl/info/swagger/                                                                                                                                                                                                                                                          | TenderNed API Docs                                                                                                      |
| CPV code search help: https://www.tenderned.nl/cms/nl/vraag/zoek-op-omschrijving-cpv-code                                                                                                                                                                                                                                                    | TenderNed CPV Info                                                                                                      |
| API Dataset info: https://data.overheid.nl/dataset/aankondigingen-van-overheidsopdrachten---tenderned                                                                                                                                                                                                                                        | Dutch Government Open Data Portal                                                                                       |
| Filtering is critical and should be adjusted to user needs; start with broad filters and refine gradually.                                                                                                                                                                                                                                    | Filter Configuration sticky note                                                                                        |
| Data Table setup requires prior creation of a Data Table in n8n with appropriate columns matching tender fields; run initial workflow to discover columns.                                                                                                                                                                                  | Database Setup sticky note                                                                                              |
| The flattening and enrichment Code node is complex and tailored to TenderNed XML structure; changes in TenderNed XML may require updates to this code.                                                                                                                                                                                      | Splits Alle Velden node detailed code                                                                                  |
| The workflow respects API rate limits by processing tenders one at a time in Loop Over Items node.                                                                                                                                                                                                                                           | Loop Info sticky note                                                                                                  |
| Manual trigger node allows for on-demand runs during development or troubleshooting.                                                                                                                                                                                                                                                        | Schedule Info sticky note                                                                                              |

---

This structured document provides a thorough understanding of the workflow, enabling advanced users and AI agents to reproduce, modify, or troubleshoot it effectively.