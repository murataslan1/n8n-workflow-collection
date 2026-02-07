Automate Monthly CrUX Report Transfer from BigQuery to NocoDB with Data Cleanup

https://n8nworkflows.xyz/workflows/automate-monthly-crux-report-transfer-from-bigquery-to-nocodb-with-data-cleanup-9368


# Automate Monthly CrUX Report Transfer from BigQuery to NocoDB with Data Cleanup

### 1. Workflow Overview

This workflow automates the monthly transfer of Chrome User Experience (CrUX) data from Google BigQuery to a NocoDB database, ensuring old data is cleaned up before inserting fresh monthly data. It targets use cases where teams need to maintain an up-to-date CrUX report inside a flexible no-code database for analysis or integration without manual export/import steps.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Triggers:** Two monthly triggers schedule the workflow execution on the first day of each month at different times.
- **1.2 Date Processing:** Convert the month name from the trigger input into a numeric format to dynamically construct BigQuery table names.
- **1.3 Data Cleanup:** Retrieve and delete last month’s CrUX data entries from NocoDB to avoid duplicates.
- **1.4 Data Fetching:** Query Google BigQuery for the current month’s CrUX top-ranked website origins and their popularity ranks.
- **1.5 Data Insertion:** Append the fresh CrUX data into the NocoDB table.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Triggers

- **Overview:**  
  Two schedule trigger nodes initiate the workflow monthly at different hours, providing temporal control over the data cleanup and fetch process.

- **Nodes Involved:**  
  - Monthly Trigger1  
  - Monthly Trigger2

- **Node Details:**

  - **Monthly Trigger1:**  
    - Type: Schedule Trigger  
    - Configuration: Fires monthly at hour 1 (1 AM) on the first day of the month.  
    - Connects to: Get Last Month Data node.  
    - Edge Cases: Potential timezone mismatch if server time differs from expected; ensure timezone configured in n8n settings matches desired operational timezone.

  - **Monthly Trigger2:**  
    - Type: Schedule Trigger  
    - Configuration: Fires monthly at hour 12 (12 PM) on the first day of the month.  
    - Connects to: Convert month name to number node.  
    - Edge Cases: Same timezone considerations as Monthly Trigger1.

- **Sticky Notes:**  
  - Monthly Trigger2 node is annotated with "Triggers 1st day of every month, after Monthly Trigger1."

---

#### 2.2 Date Processing

- **Overview:**  
  Converts a Gregorian month name (e.g., "January") from the trigger input into a corresponding two-digit month number string (e.g., "01"). This facilitates dynamic table name construction for BigQuery queries.

- **Nodes Involved:**  
  - Convert month name to number  
  - Edit Fields

- **Node Details:**

  - **Convert month name to number:**  
    - Type: Code node (JavaScript)  
    - Configuration:  
      - Uses a month-to-number mapping object.  
      - Processes all input items to extract and normalize the month name.  
      - Outputs JSON with original Month name and numeric Month_Number string.  
    - Input: From Monthly Trigger2.  
    - Output: To Edit Fields node.  
    - Edge Cases:  
      - If month name is misspelled or empty, Month_Number will be null, which might break downstream dynamic table name resolution.  
      - Trim and capitalization logic aims to reduce input variability issues.

  - **Edit Fields:**  
    - Type: Set node  
    - Configuration:  
      - Constructs a dynamic table name string combining year from Monthly Trigger2 and the Month_Number (e.g., "202304").  
      - Assigns this to a field named `table` for use in the BigQuery SQL query.  
    - Input: From Convert month name to number node.  
    - Output: To Google BigQuery node.  
    - Edge Cases:  
      - If Month_Number is null, the constructed table name will be invalid, causing BigQuery query to fail.

- **Sticky Notes:**  
  - Convert month name to number node is annotated with a note explaining the Gregorian month-to-number mapping.

---

#### 2.3 Data Cleanup

- **Overview:**  
  Retrieves all existing CrUX data entries for the previous month from NocoDB and deletes them in batches to prepare for fresh data insertion.

- **Nodes Involved:**  
  - Get Last Month Data  
  - Loop Over Items  
  - Delete in NocoDB

- **Node Details:**

  - **Get Last Month Data:**  
    - Type: NocoDB node (Get All operation)  
    - Configuration:  
      - Connects to NocoDB project and table storing CrUX data.  
      - Retrieves all records with no filter (returns all for deletion).  
    - Input: From Monthly Trigger1.  
    - Output: To Loop Over Items node.  
    - Credentials: Uses NocoDB API token.  
    - Edge Cases:  
      - Large datasets might lead to pagination issues if not handled (returnAll=true mitigates this).  
      - Network or auth errors with NocoDB API.

  - **Loop Over Items:**  
    - Type: SplitInBatches node  
    - Configuration:  
      - Processes items in batches of 100 to avoid API rate limits or timeouts on deletion.  
    - Input: From Get Last Month Data.  
    - Output: Two connections: main output empty after processing, secondary output to Delete in NocoDB.  
    - Edge Cases:  
      - Batch size may need tuning depending on API limits.  
      - Failure to delete batches may cause partial data cleanup.

  - **Delete in NocoDB:**  
    - Type: NocoDB node (Delete operation)  
    - Configuration:  
      - Deletes individual records by ID from the NocoDB table.  
    - Input: From Loop Over Items.  
    - Output: Loops back to Loop Over Items to continue batch processing.  
    - Credentials: Uses NocoDB API token.  
    - Edge Cases:  
      - Failure to delete (e.g., missing IDs, permissions) may halt cleanup process.  
      - Idempotency is critical to avoid residual data.

- **Sticky Notes:**  
  - Covers entire cleanup flow: "This workflow deletes records for the last month — review filters carefully before running."

---

#### 2.4 Data Fetching

- **Overview:**  
  Queries Google BigQuery to fetch the top 10 website origins and their CrUX popularity ranks from the dynamically named monthly table.

- **Nodes Involved:**  
  - Google BigQuery

- **Node Details:**

  - **Google BigQuery:**  
    - Type: Google BigQuery node  
    - Configuration:  
      - Runs a SQL SELECT query on the `chrome-ux-report.all.[table]` dataset, where `[table]` is dynamically set from the workflow input (based on year and month number).  
      - Filters for non-null popularity rank, orders by rank ascending, limits results to 10.  
      - Uses a service account credential with BigQuery admin access.  
    - Input: From Edit Fields node.  
    - Output: To Append Crux Data into NocoDB node.  
    - Edge Cases:  
      - Query fails if the dynamic table name is invalid or does not exist (e.g., if month conversion failed).  
      - Authentication or permission errors with BigQuery.  
      - Query timeout or quota exceeded.

- **Sticky Notes:**  
  - Explains the BigQuery node purpose and notes that the LIMIT value can be adjusted to fetch more or fewer rows.

---

#### 2.5 Data Insertion

- **Overview:**  
  Inserts the fetched CrUX data into the NocoDB table, mapping origin URLs and their popularity ranks into corresponding fields.

- **Nodes Involved:**  
  - Append Crux Data into NocoDB

- **Node Details:**

  - **Append Crux Data into NocoDB:**  
    - Type: NocoDB node (Create operation)  
    - Configuration:  
      - Inserts new rows into the CrUX data table with two fields: `origin` and `crux_rank`.  
      - Uses data directly from the BigQuery node output.  
    - Input: From Google BigQuery node.  
    - Credentials: NocoDB API token.  
    - Edge Cases:  
      - Insert failures on duplicate keys or malformed data.  
      - API rate limiting or authentication errors.  
      - Data type mismatches for fields.

- **Sticky Notes:**  
  - Describes the two database fields and their meaning.

---

### 3. Summary Table

| Node Name               | Node Type               | Functional Role                     | Input Node(s)           | Output Node(s)             | Sticky Note                                                                                                      |
|-------------------------|-------------------------|-----------------------------------|------------------------|----------------------------|-----------------------------------------------------------------------------------------------------------------|
| Monthly Trigger1         | Schedule Trigger        | Initiates cleanup process monthly | —                      | Get Last Month Data         |                                                                                                                 |
| Get Last Month Data      | NocoDB                  | Fetches last month’s CrUX records | Monthly Trigger1       | Loop Over Items             | **Delete Last Month Data**: Deletes records for last month — review filters carefully before running.           |
| Loop Over Items          | SplitInBatches          | Processes deletion in batches     | Get Last Month Data    | Delete in NocoDB            |                                                                                                                 |
| Delete in NocoDB         | NocoDB                  | Deletes individual records        | Loop Over Items        | Loop Over Items             |                                                                                                                 |
| Monthly Trigger2         | Schedule Trigger        | Initiates data fetch process monthly | —                    | Convert month name to number | Triggers 1st day of every month, after Monthly Trigger1.                                                        |
| Convert month name to number | Code                  | Converts month name to number     | Monthly Trigger2       | Edit Fields                 | Converts Gregorian month names (January to December) to "01"–"12".                                             |
| Edit Fields             | Set                     | Constructs dynamic BigQuery table name | Convert month name to number | Google BigQuery         |                                                                                                                 |
| Google BigQuery          | Google BigQuery          | Fetches CrUX report data          | Edit Fields            | Append Crux Data into NocoDB | Connects to BigQuery, runs dynamic SQL to fetch top-ranked website origins and popularity ranks. Limit adjustable. |
| Append Crux Data into NocoDB | NocoDB               | Inserts new CrUX data into NocoDB | Google BigQuery        | —                          | Database fields: origin (URL), crux_rank (popularity rank).                                                     |
| Sticky Note              | Sticky Note             | Documentation                    | —                      | —                          | Converts Gregorian month name to number explanation.                                                           |
| Sticky Note1             | Sticky Note             | Documentation                    | —                      | —                          | Explains Google BigQuery node function and query limit usage.                                                  |
| Sticky Note2             | Sticky Note             | Documentation                    | —                      | —                          | Explains data deletion process and warns to review filters.                                                    |
| Sticky Note3             | Sticky Note             | Documentation                    | —                      | —                          | Notes Monthly Trigger2 scheduling.                                                                              |
| Sticky Note4             | Sticky Note             | Documentation                    | —                      | —                          | Explains fields in the NocoDB CrUX data table.                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Monthly Trigger1 node**  
   - Type: Schedule Trigger  
   - Set to trigger monthly at hour 1 (1 AM) on the first day of each month.  
   - Connect output to "Get Last Month Data" node.

2. **Create Get Last Month Data node**  
   - Type: NocoDB node  
   - Operation: Get All  
   - Configure to connect to your NocoDB project and relevant CrUX data table (e.g., table ID "m4fowxbiwoqqj2m").  
   - Set Return All to true to fetch all records.  
   - Use NocoDB API Token credential.  
   - Connect output to "Loop Over Items" node.

3. **Create Loop Over Items node**  
   - Type: SplitInBatches  
   - Set batch size to 100 (to avoid API rate limits).  
   - Connect main output to nothing (empty) and secondary output to "Delete in NocoDB" node.

4. **Create Delete in NocoDB node**  
   - Type: NocoDB node  
   - Operation: Delete  
   - Configure to delete by ID field from input JSON (`id` field).  
   - Use same NocoDB API Token credential.  
   - Connect output back to "Loop Over Items" to continue batch processing.

5. **Create Monthly Trigger2 node**  
   - Type: Schedule Trigger  
   - Set to trigger monthly at hour 12 (12 PM) on first day of each month.  
   - Connect output to "Convert month name to number" node.

6. **Create Convert month name to number node**  
   - Type: Code (JavaScript)  
   - Paste the month mapping code to convert month names (e.g., January) to two-digit strings ("01").  
   - Input: JSON with a `Month` field from Monthly Trigger2.  
   - Output JSON includes `Month` and `Month_Number` fields.  
   - Connect output to "Edit Fields" node.

7. **Create Edit Fields node**  
   - Type: Set  
   - Create a new field `table` with value concatenating year from Monthly Trigger2 and `Month_Number` (e.g., "202304"). Use expression: `={{ $('Monthly Trigger2').item.json.Year }}{{ $json.Month_Number }}`.  
   - Connect output to "Google BigQuery" node.

8. **Create Google BigQuery node**  
   - Type: Google BigQuery node  
   - Configure with service account credentials having BigQuery admin rights.  
   - In SQL Query, use dynamic table name:  
     ```sql
     SELECT
       origin,
       experimental.popularity.rank AS crux_rank
     FROM
       `chrome-ux-report.all.{{ $json.table }}`
     WHERE
       experimental.popularity.rank IS NOT NULL
     ORDER BY
       crux_rank ASC
     LIMIT 10;
     ```  
   - Connect output to "Append Crux Data into NocoDB" node.

9. **Create Append Crux Data into NocoDB node**  
   - Type: NocoDB node  
   - Operation: Create  
   - Target same project and table as cleanup nodes.  
   - Map fields:  
     - `origin`: `{{$json.origin}}`  
     - `crux_rank`: `{{$json.crux_rank}}`  
   - Use NocoDB API Token credential.

10. **Optional: Create Sticky Notes**  
    - Add sticky notes for documentation clarity near respective nodes, especially for month conversion and BigQuery query explanation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                  | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow deletes last month’s CrUX records before inserting fresh data; review deletion filters carefully before running to avoid data loss.              | Sticky Note on data cleanup block                                                                |
| BigQuery SQL query limits the output to top 10 ranked origins; adjust LIMIT value to fetch more or fewer records as needed.                                   | Sticky Note near Google BigQuery node                                                            |
| Month name conversion code normalizes input to handle common capitalization/spaces and maps Gregorian month names to two-digit numeric strings ("01"-"12").     | Sticky Note near Convert month name to number node                                               |
| Scheduled triggers are configured to run on the 1st day of each month at 1 AM and 12 PM respectively, ensuring data deletion precedes fresh data fetch.        | Sticky Note near Monthly Trigger2                                                                |
| Project uses service account credentials for BigQuery and API token for NocoDB, ensure these are correctly configured and have sufficient permissions.         | Workflow credential usage                                                                         |

---

**Disclaimer:** The provided text is exclusively derived from an n8n automated workflow. It adheres strictly to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.