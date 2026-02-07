Archive empty pages in Notion database

https://n8nworkflows.xyz/workflows/archive-empty-pages-in-notion-database-1478


# Archive empty pages in Notion database

### 1. Workflow Overview

This workflow automates the archival of empty pages within specified Notion databases. It is designed to run on a schedule (defaulting to 2 AM daily) and systematically processes all databases and their pages to identify and archive pages that contain no meaningful content or properties.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow daily at a specified time.
- **1.2 Database and Page Retrieval:** Fetches all Notion databases and their respective pages.
- **1.3 Empty Property Check:** Evaluates pages for empty properties to preliminarily flag candidates for archival.
- **1.4 Detailed Block Content Analysis:** For flagged pages, retrieves page blocks and analyzes their content to confirm emptiness.
- **1.5 Archival Decision and Execution:** Determines if a page should be archived and performs the archival operation.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:**  
  This block triggers the workflow automatically every day at 2 AM (default), initiating the archival process.

- **Nodes Involved:**  
  - Every day @ 2am (Cron)

- **Node Details:**  
  - **Every day @ 2am**  
    - Type: Cron Trigger  
    - Configuration: Set to trigger once daily at 2:00 AM.  
    - Inputs: None (trigger node).  
    - Outputs: Triggers the "Get All Databases" node.  
    - Edge Cases: Misconfiguration of time may cause unexpected trigger times; ensure timezone settings in n8n are correct.

---

#### 2.2 Database and Page Retrieval

- **Overview:**  
  Retrieves all Notion databases accessible via the configured credentials, then fetches all pages within each database.

- **Nodes Involved:**  
  - Get All Databases  
  - Get All Database Pages

- **Node Details:**  
  - **Get All Databases**  
    - Type: Notion API node (resource: database, operation: getAll)  
    - Configuration: Retrieves all databases without pagination limits (returnAll: true).  
    - Credentials: Uses Notion API credentials configured in n8n.  
    - Inputs: Triggered by the Cron node.  
    - Outputs: List of databases with their metadata (including database IDs).  
    - Edge Cases: API rate limits or permission errors if credentials lack access to some databases.

  - **Get All Database Pages**  
    - Type: Notion API node (resource: databasePage, operation: getAll)  
    - Configuration: Retrieves all pages for each database ID passed from the previous node.  
    - Uses expression to dynamically set databaseId from each database's id field.  
    - Credentials: Same Notion API credentials.  
    - Inputs: Receives each database from "Get All Databases".  
    - Outputs: List of pages per database with full page details.  
    - Edge Cases: Large databases may cause timeouts or rate limits; ensure returnAll is true to fetch all pages.

---

#### 2.3 Empty Property Check

- **Overview:**  
  Checks each page’s properties to detect if they are empty, preliminarily marking pages that might be empty and candidates for archival.

- **Nodes Involved:**  
  - Check for empty properties  
  - If Empty Properties

- **Node Details:**  
  - **Check for empty properties**  
    - Type: Function node  
    - Configuration: Custom JavaScript iterates over each page’s properties, checking if any property contains data.  
    - Logic:  
      - For each property, examines its type and data length.  
      - If any property has content, marks `toDelete` as false; if all are empty, marks `toDelete` as true.  
    - Inputs: Pages from "Get All Database Pages".  
    - Outputs: Pages with an added boolean field `toDelete` indicating emptiness.  
    - Edge Cases: Properties with unexpected data structures may cause errors; assumes properties have a `type` and data array or string.

  - **If Empty Properties**  
    - Type: If node  
    - Configuration: Checks if `toDelete` is true to filter pages.  
    - Inputs: Pages with `toDelete` flags from the function node.  
    - Outputs: Only pages flagged as empty proceed to the next step.  
    - Edge Cases: Misinterpretation of property data could cause false positives or negatives.

---

#### 2.4 Detailed Block Content Analysis

- **Overview:**  
  For pages preliminarily flagged as empty, this block retrieves all content blocks of each page and analyzes them to confirm if the page is truly empty.

- **Nodes Involved:**  
  - SplitInBatches  
  - Get Page Blocks  
  - Process Blocks  
  - If toDelete

- **Node Details:**  
  - **SplitInBatches**  
    - Type: SplitInBatches node  
    - Configuration: Processes pages one at a time (batchSize: 1) to avoid API overload and handle each page individually.  
    - Inputs: Pages filtered by "If Empty Properties".  
    - Outputs: Single page per batch forwarded to "Get Page Blocks".  
    - Edge Cases: Batch size too large may cause rate limits; too small may slow processing.

  - **Get Page Blocks**  
    - Type: Notion API node (resource: block, operation: getAll)  
    - Configuration: Retrieves all blocks (content elements) of the page specified by `blockId` (page ID).  
    - Uses expression to set `blockId` dynamically from the current page’s id.  
    - Inputs: Single page from "SplitInBatches".  
    - Outputs: List of blocks for the page.  
    - Edge Cases: Pages with large content may cause timeouts; API limits apply.

  - **Process Blocks**  
    - Type: Function node  
    - Configuration: Custom JavaScript analyzes the blocks to determine if the page is empty.  
    - Logic:  
      - Initializes `toDelete` as false.  
      - If no blocks exist (`items[0].json.id` missing), marks page for deletion.  
      - Iterates over blocks checking if text content length is zero.  
      - If any block has text content, sets `toDelete` to false and breaks loop.  
      - Otherwise, sets `toDelete` to true.  
    - Inputs: Blocks from "Get Page Blocks".  
    - Outputs: Single JSON object with `toDelete` flag and `pageID`.  
    - Edge Cases: Blocks with non-text content or unexpected structure may cause false negatives.

  - **If toDelete**  
    - Type: If node  
    - Configuration: Checks if `toDelete` is true to decide if the page should be archived.  
    - Inputs: Output from "Process Blocks".  
    - Outputs: Pages confirmed empty proceed to "Archive Page".  
    - Edge Cases: Incorrect flagging could cause unwanted archival.

---

#### 2.5 Archival Decision and Execution

- **Overview:**  
  Archives pages confirmed to be empty by setting their archived status in Notion.

- **Nodes Involved:**  
  - Archive Page

- **Node Details:**  
  - **Archive Page**  
    - Type: Notion API node (operation: archive page)  
    - Configuration: Archives the page identified by `pageID`.  
    - Uses expression to dynamically set `pageId` from the JSON data.  
    - Inputs: Pages flagged for archival from "If toDelete".  
    - Outputs: Confirmation of archival operation.  
    - Edge Cases: Permission errors if credentials lack archive rights; API failures or network issues.

---

### 3. Summary Table

| Node Name             | Node Type               | Functional Role                  | Input Node(s)          | Output Node(s)          | Sticky Note                                                                                      |
|-----------------------|-------------------------|---------------------------------|------------------------|-------------------------|------------------------------------------------------------------------------------------------|
| Every day @ 2am       | Cron                    | Scheduled trigger               | —                      | Get All Databases       | Default runs at 2 AM daily; can be changed if needed.                                           |
| Get All Databases     | Notion API              | Retrieve all Notion databases   | Every day @ 2am        | Get All Database Pages   | Requires Notion credentials; ensure integration added to target databases.                      |
| Get All Database Pages| Notion API              | Retrieve pages from each database| Get All Databases      | Check for empty properties| Requires Notion credentials; dynamic databaseId expression used.                               |
| Check for empty properties | Function             | Check if page properties are empty | Get All Database Pages | If Empty Properties      | Custom JS checks all properties; flags pages with empty properties.                            |
| If Empty Properties   | If                      | Filter pages with empty properties | Check for empty properties | SplitInBatches          | Only pages with empty properties proceed.                                                     |
| SplitInBatches        | SplitInBatches          | Process pages one by one        | If Empty Properties     | Get Page Blocks          | Batch size set to 1 to avoid API overload.                                                    |
| Get Page Blocks       | Notion API              | Retrieve content blocks of page | SplitInBatches         | Process Blocks           | Requires Notion credentials; dynamic blockId expression used.                                 |
| Process Blocks        | Function                | Analyze blocks to confirm emptiness | Get Page Blocks        | If toDelete              | Custom JS analyzes block content; flags page for deletion if empty.                           |
| If toDelete           | If                      | Decide if page should be archived | Process Blocks         | Archive Page             | Only pages confirmed empty proceed.                                                          |
| Archive Page          | Notion API              | Archive the empty page          | If toDelete             | —                        | Requires Notion credentials with archive permissions.                                         |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Cron Trigger Node**  
   - Name: `Every day @ 2am`  
   - Type: Cron  
   - Parameters: Set trigger time to 2:00 AM daily (hour: 2).  
   - No credentials needed.

2. **Create Notion Node to Get All Databases**  
   - Name: `Get All Databases`  
   - Type: Notion (resource: database, operation: getAll)  
   - Parameters: Set `returnAll` to true to fetch all databases.  
   - Credentials: Configure with your Notion API credentials (OAuth2 or integration token).  
   - Connect output of `Every day @ 2am` to this node.

3. **Create Notion Node to Get All Database Pages**  
   - Name: `Get All Database Pages`  
   - Type: Notion (resource: databasePage, operation: getAll)  
   - Parameters:  
     - `returnAll`: true  
     - `databaseId`: Set expression to `{{$json["id"]}}` to dynamically use each database’s ID.  
   - Credentials: Same Notion credentials as above.  
   - Connect output of `Get All Databases` to this node.

4. **Create Function Node to Check for Empty Properties**  
   - Name: `Check for empty properties`  
   - Type: Function  
   - Parameters: Use the following JavaScript code:
     ```javascript
     for (item of items) {
       let toDelete = false;
       for (const key in item.json.properties) {
         let type = item.json.properties[key].type;
         let data = item.json.properties[key][type];
         if (!data || data.length == 0) {
           toDelete = true;
         } else {
           toDelete = false;
           break;
         }
       }
       item.json.toDelete = toDelete;
     }
     return items;
     ```
   - Connect output of `Get All Database Pages` to this node.

5. **Create If Node to Filter Pages with Empty Properties**  
   - Name: `If Empty Properties`  
   - Type: If  
   - Parameters: Boolean condition where `{{$json["toDelete"]}}` equals `true`.  
   - Connect output of `Check for empty properties` to this node.

6. **Create SplitInBatches Node**  
   - Name: `SplitInBatches`  
   - Type: SplitInBatches  
   - Parameters: Set `batchSize` to 1 to process pages individually.  
   - Connect the `true` output of `If Empty Properties` to this node.

7. **Create Notion Node to Get Page Blocks**  
   - Name: `Get Page Blocks`  
   - Type: Notion (resource: block, operation: getAll)  
   - Parameters:  
     - `blockId`: Set expression to `{{$json["id"]}}` to get blocks of the current page.  
     - `returnAll`: true  
   - Credentials: Same Notion credentials.  
   - Connect output of `SplitInBatches` to this node.

8. **Create Function Node to Process Blocks**  
   - Name: `Process Blocks`  
   - Type: Function  
   - Parameters: Use the following JavaScript code:
     ```javascript
     let returnData = {
       json: {
         toDelete: false,
         pageID: $node["SplitInBatches"].json["id"],
       }
     };

     if (!items[0].json.id) {
       returnData.json.toDelete = true;
       return [returnData];
     }

     for (item of items) {
       let toDelete = false;
       let type = item.json.type;
       let data = item.json[type];

       if (!toDelete) {
         if (data.text.length == 0) {
           toDelete = true;
         } else {
           returnData.json.toDelete = false;
           break;
         }
       }
       returnData.json.toDelete = toDelete;
     }

     return [returnData];
     ```
   - Connect output of `Get Page Blocks` to this node.

9. **Create If Node to Decide Archival**  
   - Name: `If toDelete`  
   - Type: If  
   - Parameters: Boolean condition where `{{$json["toDelete"]}}` equals `true`.  
   - Connect output of `Process Blocks` to this node.

10. **Create Notion Node to Archive Page**  
    - Name: `Archive Page`  
    - Type: Notion (operation: archive page)  
    - Parameters:  
      - `pageId`: Set expression to `{{$json["pageID"]}}` to archive the identified page.  
    - Credentials: Same Notion credentials.  
    - Connect the `true` output of `If toDelete` to this node.

---

**Credential Setup Notes:**  
- All Notion nodes use the same Notion API credentials. Ensure your integration has access to all target databases and permission to archive pages.  
- OAuth2 or integration token credentials can be used depending on your Notion setup.

**Additional Configuration:**  
- Adjust the Cron node timing as needed to change the workflow’s run schedule.  
- If processing very large databases, consider increasing batch size cautiously or adding delay nodes to avoid rate limits.  
- Monitor execution logs for API errors or permission issues.

---

This completes the detailed analysis and reproduction instructions for the "Archive empty pages in Notion Database" workflow.