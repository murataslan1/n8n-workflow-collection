Automate HS Code Lookup & Enrichment with Google Sheets and Customs API

https://n8nworkflows.xyz/workflows/automate-hs-code-lookup---enrichment-with-google-sheets-and-customs-api-8034


# Automate HS Code Lookup & Enrichment with Google Sheets and Customs API

### 1. Workflow Overview

This workflow automates the lookup and enrichment of customs tariff numbers (HS Codes) based on item descriptions using a Customs API and Google Sheets. It targets users who need to efficiently find and update tariff codes for multiple product descriptions, streamlining customs classification tasks.

The workflow is logically divided into the following blocks:

- **1.1 Manual Single Query Input:** Receives a single item description via a chat interface and queries the Customs API to retrieve the best matching tariff number.
- **1.2 Batch Processing of Item Descriptions:** Reads a list of item descriptions from a Google Sheet, queries the Customs API for each item in batches, processes responses, and writes the enriched tariff numbers back to the sheet.
- **1.3 Completion Notification:** Sends an email notification upon successful completion of the batch enrichment process.

---

### 2. Block-by-Block Analysis

#### 2.1 Manual Single Query Input

- **Overview:**  
  This block enables manual input of an item description through a chat trigger, queries the Customs API for tariff number suggestions, and outputs the top suggestion.

- **Nodes Involved:**  
  - Chat Trigger  
  - Customs Tariff API Query  
  - Output Customs Tariff Number  
  - Sticky Note (instructional)

- **Node Details:**

  - **Chat Trigger**  
    - *Type & Role:* LangChain-based chat trigger node; entry point for manual input.  
    - *Configuration:* Waits for user input via chat, no additional options configured.  
    - *Expressions:* Uses `$json.chatInput` to capture the text input.  
    - *Connections:* Outputs to Customs Tariff API Query.  
    - *Edge Cases:* Input missing or malformed could cause API query failure.  
    - *Version:* 1.1

  - **Customs Tariff API Query**  
    - *Type & Role:* HTTP Request node; queries the Customs API with the encoded user input.  
    - *Configuration:*  
      - URL dynamically constructed with encoded input term:  
        `https://www.zolltarifnummern.de/api/v2/cnSuggest?term={{ encodeURIComponent($json.chatInput) }}&lang=de`  
      - Timeout set to 10 seconds.  
      - Headers: Accept JSON, User-Agent set to identify n8n workflow.  
      - Allow unauthorized certificates enabled (likely to handle API SSL issues).  
      - Continue on fail enabled to avoid workflow halt on errors.  
    - *Connections:* Outputs to Output Customs Tariff Number.  
    - *Edge Cases:* API timeout, network issues, invalid or empty input, malformed JSON response.  
    - *Version:* 4.2

  - **Output Customs Tariff Number**  
    - *Type & Role:* Set node; extracts and formats the first suggested tariff code from API response.  
    - *Configuration:* Assigns `text` to the second suggestion’s code (`suggestions[1].code`) from API response.  
    - *Expressions:* `={{ $json.suggestions[1].code }}`  
    - *Connections:* No further connections; final output for manual query.  
    - *Edge Cases:* If fewer than two suggestions are returned, this could produce undefined or errors.  
    - *Version:* 3.4

  - **Sticky Note**  
    - *Content:* Describes this block as "Manual Single Query for Customs Tariff Number: Enter item description and receive suggestion #1 from the API query."  
    - *Role:* User instruction; no workflow impact.

#### 2.2 Batch Processing of Item Descriptions

- **Overview:**  
  Reads multiple item descriptions from a Google Sheet, processes each item in batches through the Customs API, prepares enriched data, updates the sheet with tariff numbers, and aggregates results.

- **Nodes Involved:**  
  - Start Query (Manual Trigger)  
  - Read Item Descriptions (Google Sheets)  
  - Loop Over Items (SplitInBatches)  
  - Customs Tariff API Query Batch (HTTP Request)  
  - prepare data (Set)  
  - Write Customs Tariff to Sheet (Google Sheets)  
  - Aggregate (Aggregate)  
  - Sticky Notes (instructions)

- **Node Details:**

  - **Start Query**  
    - *Type & Role:* Manual Trigger; initiates batch process.  
    - *Configuration:* Default settings, triggered manually.  
    - *Connections:* Outputs to Read Item Descriptions.  
    - *Version:* 1

  - **Read Item Descriptions**  
    - *Type & Role:* Google Sheets node; reads item descriptions from a specified spreadsheet.  
    - *Configuration:*  
      - Document ID: `1nJ_VAeCwOnFwF-t7rFlbftbkAuT35gig9d7YCGsurHs`  
      - Sheet Name: `gid=0` (first sheet)  
      - Credentials: Google Sheets OAuth2 API account.  
    - *Connections:* Outputs to Loop Over Items.  
    - *Edge Cases:* Access denied, invalid document ID, empty sheet.  
    - *Version:* 4.5

  - **Loop Over Items**  
    - *Type & Role:* SplitInBatches node; processes items one by one or in small batches for API querying.  
    - *Configuration:* Default batch size (likely 1 by default unless specified).  
    - *Connections:*  
      - Main output to Aggregate node (to collect results).  
      - Secondary output to Customs Tariff API Query Batch node (for API querying).  
    - *Edge Cases:* Batch size misconfiguration, empty input.  
    - *Version:* 3

  - **Customs Tariff API Query Batch**  
    - *Type & Role:* HTTP Request node; queries Customs API for each item description in batch.  
    - *Configuration:*  
      - URL: `https://www.zolltarifnummern.de/api/v2/cnSuggest?term={{ encodeURIComponent($json['Artikelbeschreibung']) }}&lang=de`  
      - Timeout: 10 seconds  
      - Headers: Accept JSON, User-Agent set  
      - Continue on fail enabled.  
    - *Connections:* Outputs to prepare data node.  
    - *Edge Cases:* API rate limits, timeouts, empty or invalid descriptions.  
    - *Version:* 4.2

  - **prepare data**  
    - *Type & Role:* Set node; formats API response and prepares data to write back to the sheet.  
    - *Configuration:*  
      - Assigns:  
        - `Zolltarifnummer` (tariff code) = second suggestion code or "Nicht gefunden" if not found.  
        - `Artikelbeschreibung` = original item description.  
        - `Beschreibung der Zolltarifnummer` = parsed description from API (splitting HTML on `<br>`).  
        - `Score` = suggestion’s confidence score formatted as a percentage.  
    - *Expressions:* See above; handles missing suggestions gracefully.  
    - *Connections:* Outputs to Write Customs Tariff to Sheet.  
    - *Edge Cases:* Missing or malformed API suggestions, string parsing failures.  
    - *Version:* 3.4

  - **Write Customs Tariff to Sheet**  
    - *Type & Role:* Google Sheets node; updates the spreadsheet with enriched tariff data.  
    - *Configuration:*  
      - Document ID and Sheet Name same as Read Item Descriptions.  
      - Operation: Update using auto-mapping on `Artikelbeschreibung` column to find rows.  
      - Columns mapped: `Artikelbeschreibung` (string), `Zolltarifnummer` (string).  
      - Credentials: Same Google Sheets OAuth2 API account.  
    - *Connections:* Outputs back to Loop Over Items (to continue processing).  
    - *Edge Cases:* Row matching failure, permission issues, API limits.  
    - *Version:* 4.5

  - **Aggregate**  
    - *Type & Role:* Aggregate node; collects all processed items from batch processing for final summary or further use.  
    - *Configuration:* Aggregate all item data into a single output.  
    - *Connections:* Outputs to Send Completion Email.  
    - *Edge Cases:* Aggregate failure if input is empty.  
    - *Version:* 1

  - **Sticky Notes**  
    - *Sticky Note1:* Explains batch query process: "All entries in column A will be enriched with customs tariff numbers in column B."  
    - *Sticky Note3:* Provides a video tutorial link: [Video Tutorial](https://youtu.be/UccIqmMmq7w)  
    - *Role:* User guidance; no workflow impact.

#### 2.3 Completion Notification

- **Overview:**  
  Sends an email notification to a configured recipient indicating the batch processing job has completed successfully.

- **Nodes Involved:**  
  - Send Completion Email  
  - Sticky Note2 (instructional)

- **Node Details:**

  - **Send Completion Email**  
    - *Type & Role:* Gmail node; sends email notification.  
    - *Configuration:*  
      - Recipient: `test@example.com` (placeholder, configurable)  
      - Subject: "Completed: Customs Tariff Number Research Finished"  
      - Message: "Job completed successfully"  
      - Credentials: Gmail OAuth2 account configured.  
    - *Connections:* Input from Aggregate node.  
    - *Edge Cases:* Authentication failure, email send failure, invalid recipient address.  
    - *Version:* 2.1

  - **Sticky Note2**  
    - *Content:* Explains this is the completion notification and advises configuration of the email address.  
    - *Role:* User instruction.

---

### 3. Summary Table

| Node Name                  | Node Type                         | Functional Role                        | Input Node(s)               | Output Node(s)                      | Sticky Note                                                                                          |
|----------------------------|----------------------------------|-------------------------------------|-----------------------------|------------------------------------|----------------------------------------------------------------------------------------------------|
| Chat Trigger               | @n8n/n8n-nodes-langchain.chatTrigger | Manual single item input trigger    | -                           | Customs Tariff API Query            | Manual Single Query: Enter item description and receive suggestion #1 from the API query           |
| Customs Tariff API Query    | HTTP Request                     | Query Customs API for single input  | Chat Trigger                | Output Customs Tariff Number        | Manual Single Query: Enter item description and receive suggestion #1 from the API query           |
| Output Customs Tariff Number| Set                             | Extract top tariff code suggestion  | Customs Tariff API Query     | -                                  | Manual Single Query: Enter item description and receive suggestion #1 from the API query           |
| Sticky Note                | Sticky Note                     | Instructional note                  | -                           | -                                  | Manual Single Query for Customs Tariff Number input                                                 |
| Start Query                | Manual Trigger                  | Start batch process trigger          | -                           | Read Item Descriptions              | Batch Query from List: All entries in column A enriched with tariff numbers in column B             |
| Read Item Descriptions      | Google Sheets                   | Read item descriptions from sheet   | Start Query                 | Loop Over Items                    | Batch Query from List: All entries in column A enriched with tariff numbers in column B             |
| Loop Over Items             | SplitInBatches                  | Process items in batches             | Read Item Descriptions, Write Customs Tariff to Sheet | Aggregate, Customs Tariff API Query Batch | Batch Query from List: All entries in column A enriched with tariff numbers in column B             |
| Customs Tariff API Query Batch | HTTP Request                 | Query Customs API for batch items   | Loop Over Items             | prepare data                      | Batch Query from List: All entries in column A enriched with tariff numbers in column B             |
| prepare data               | Set                             | Format API response for sheet update| Customs Tariff API Query Batch | Write Customs Tariff to Sheet       | Batch Query from List: All entries in column A enriched with tariff numbers in column B             |
| Write Customs Tariff to Sheet | Google Sheets                | Update sheet with enriched data     | prepare data                | Loop Over Items                    | Batch Query from List: All entries in column A enriched with tariff numbers in column B             |
| Aggregate                  | Aggregate                      | Collect processed batch results     | Loop Over Items             | Send Completion Email              | Batch Query from List: All entries in column A enriched with tariff numbers in column B             |
| Send Completion Email       | Gmail                          | Send notification email             | Aggregate                   | -                                  | Completion: Notification email that process is finished (configure desired email address)           |
| Sticky Note1               | Sticky Note                     | Instructional note                  | -                           | -                                  | Batch Query from List: All entries in column A enriched with tariff numbers in column B             |
| Sticky Note2               | Sticky Note                     | Instructional note                  | -                           | -                                  | Completion notification email configuration                                                       |
| Sticky Note3               | Sticky Note                     | Instructional note with video link | -                           | -                                  | [Video Tutorial](https://youtu.be/UccIqmMmq7w)                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Single Query Input Block:**

   1. Add a **Chat Trigger** node (type: `@n8n/n8n-nodes-langchain.chatTrigger`):
      - No special parameters.
      - This node listens for manual chat input.

   2. Add an **HTTP Request** node named "Customs Tariff API Query":
      - URL:  
        `https://www.zolltarifnummern.de/api/v2/cnSuggest?term={{ encodeURIComponent($json.chatInput) }}&lang=de`  
      - Method: GET (default)  
      - Timeout: 10000 ms  
      - Response Format: JSON  
      - Send Headers:  
        - Accept: application/json  
        - User-Agent: n8n-workflow/1.0  
      - Allow unauthorized certificates: enabled  
      - Continue on Fail: enabled  
      - Connect Chat Trigger output to this node.

   3. Add a **Set** node named "Output Customs Tariff Number":
      - Assign field `text` to expression: `{{ $json.suggestions[1].code }}`  
      - Connect from the Customs Tariff API Query node.

   4. Optionally, add a **Sticky Note** with instructions:
      - Content: "Manual Single Query for Customs Tariff Number: Enter item description and receive suggestion #1 from the API query."

2. **Create Batch Processing Block:**

   1. Add a **Manual Trigger** node named "Start Query".

   2. Add a **Google Sheets** node named "Read Item Descriptions":
      - Operation: Read rows  
      - Document ID: `1nJ_VAeCwOnFwF-t7rFlbftbkAuT35gig9d7YCGsurHs` (replace with your own)  
      - Sheet Name or GID: `gid=0`  
      - Credentials: Configure Google Sheets OAuth2 credentials.  
      - Connect Start Query output to this node.

   3. Add a **SplitInBatches** node named "Loop Over Items":
      - Default batch size (usually 1) or set desired batch size.  
      - Connect Read Item Descriptions output to this node.

   4. Add an **HTTP Request** node named "Customs Tariff API Query Batch":
      - URL:  
        `https://www.zolltarifnummern.de/api/v2/cnSuggest?term={{ encodeURIComponent($json['Artikelbeschreibung']) }}&lang=de`  
      - Timeout: 10000 ms  
      - Response Format: JSON  
      - Headers:  
        - Accept: application/json  
        - User-Agent: n8n-workflow/1.0  
      - Allow unauthorized certificates: enabled  
      - Continue on Fail: enabled  
      - Connect Loop Over Items secondary output to this node.

   5. Add a **Set** node named "prepare data":
      - Assign fields:  
        - `Zolltarifnummer` = `{{ $json.suggestions && $json.suggestions[1] ? $json.suggestions[1].code : 'Nicht gefunden' }}`  
        - `Artikelbeschreibung` = `{{ $('Loop Over Items').item.json['Artikelbeschreibung'] }}`  
        - `Beschreibung der Zolltarifnummer` = `{{ $json.suggestions[1].value.split(/<br\s*\/?>/i)[1].trim() }}`  
        - `Score` = `{{ ($json.suggestions[1].score * 100).toFixed(1) + '%' }}`  
      - Connect Customs Tariff API Query Batch output to this node.

   6. Add a **Google Sheets** node named "Write Customs Tariff to Sheet":
      - Operation: Update rows  
      - Document ID and Sheet Name same as "Read Item Descriptions" node.  
      - Configure columns mapping:  
        - Match on `Artikelbeschreibung` column to find the correct row.  
        - Update `Zolltarifnummer` column with the new tariff code.  
      - Credentials: Same Google Sheets OAuth2 credentials.  
      - Connect prepare data output to this node.

   7. Connect "Write Customs Tariff to Sheet" output back to "Loop Over Items" main input to continue processing batches.

   8. Add an **Aggregate** node:
      - Operation: Aggregate all item data.  
      - Connect secondary output of Loop Over Items to this node.

   9. Optionally, add **Sticky Notes** explaining batch process and referencing video tutorial:
      - Content example:  
        "Batch Query from List: All entries in column A will be enriched with customs tariff numbers in column B."  
        "Video Tutorial: https://youtu.be/UccIqmMmq7w"

3. **Create Completion Notification Block:**

   1. Add a **Gmail** node named "Send Completion Email":
      - Recipient: `test@example.com` (replace with desired email)  
      - Subject: "Completed: Customs Tariff Number Research Finished"  
      - Message: "Job completed successfully"  
      - Credentials: Gmail OAuth2 configured.  
      - Connect Aggregate node output to this node.

   2. Optionally, add a **Sticky Note** with instructions to configure email address properly.

4. **Finalize connections and test:**

   - Ensure all nodes are connected as per described connections.  
   - Validate credentials for Google Sheets and Gmail are correctly set up.  
   - Test manual single queries and batch processing separately.  
   - Monitor for API rate limits or failures and adjust timeouts or batch sizes accordingly.

---

### 5. General Notes & Resources

| Note Content                                                                                         | Context or Link                                  |
|----------------------------------------------------------------------------------------------------|-------------------------------------------------|
| Video tutorial demonstrating the workflow usage and setup                                           | https://youtu.be/UccIqmMmq7w                     |
| Workflow uses the Zolltarifnummern.de Customs API for tariff number suggestions                      | https://www.zolltarifnummern.de/api/v2/         |
| Google Sheets document used for batch processing must have columns named exactly "Artikelbeschreibung" and "Zolltarifnummer" | Google Sheets setup                              |
| Email notifications require a configured Gmail OAuth2 credential with send permissions              | Gmail OAuth2 credential setup                     |
| The workflow handles missing API suggestions gracefully by marking tariff number as "Nicht gefunden" | Data quality and edge case handling              |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly adheres to content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.