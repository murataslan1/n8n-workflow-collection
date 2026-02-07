Automate Google Maps Lead Generation with Free Email Enrichment to Google Sheets

https://n8nworkflows.xyz/workflows/automate-google-maps-lead-generation-with-free-email-enrichment-to-google-sheets-7406


# Automate Google Maps Lead Generation with Free Email Enrichment to Google Sheets

### 1. Workflow Overview

This workflow automates the process of generating leads from Google Maps data, enriching them with free email information, and updating the results in Google Sheets. It is designed for lead generation specialists, marketing teams, or sales professionals aiming to efficiently gather business contact data and enhance it with verified email addresses.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception**: Manual trigger and retrieval of initial business data rows from Google Sheets.
- **1.2 Iterative Processing of Each Row**: Looping over each row to process lead data in manageable batches.
- **1.3 External HTTP Requests & Conditional Processing**: Making HTTP requests to query or scrape data, handling responses conditionally.
- **1.4 Email Extraction and Validation**: Parsing pages and internal links to extract possible email addresses.
- **1.5 Google Sheets Update**: Updating the original or internal Google Sheets rows with found email data or marking emails as not found.
- **1.6 Nested Iterations & Error Handling**: Handling multiple pages and items within pages, managing errors, and ensuring workflow continuity.

---

### 2. Block-by-Block Analysis

---

#### 2.1 Input Reception

**Overview:**  
This block initiates the workflow manually and fetches source data rows from Google Sheets to be processed.

**Nodes Involved:**  
- When clicking ‘Execute workflow’  
- Get row(s) in sheet

**Node Details:**  

- **When clicking ‘Execute workflow’**  
  - Type: Manual trigger  
  - Role: Entry point for the workflow, waiting for user to start execution.  
  - Configuration: Default manual trigger without parameters.  
  - Inputs: None  
  - Outputs: Connects to "Get row(s) in sheet".  
  - Edge Cases: None significant.  

- **Get row(s) in sheet**  
  - Type: Google Sheets  
  - Role: Reads rows from a configured Google Sheet containing lead data.  
  - Configuration: Presumably configured to read specific sheets and ranges, though exact parameters are not listed.  
  - Inputs: Trigger from manual node.  
  - Outputs: Passes rows to "Loop Over Items".  
  - Edge Cases: Authentication errors with Google Sheets API, empty sheets, or invalid ranges may cause failures.

---

#### 2.2 Iterative Processing of Each Row

**Overview:**  
This block manages processing each lead row in batches, controlling the workflow's pace and resource usage.

**Nodes Involved:**  
- Loop Over Items (splitInBatches)  
- If

**Node Details:**  

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Role: Processes the incoming rows in batches (default batch size or configured).  
  - Configuration: Batch size not explicitly stated; typically used to prevent API rate limits or large payloads.  
  - Inputs: Rows from Google Sheets node.  
  - Outputs: Two outputs - first for successful batch processing (empty array output in this case), second to continue processing chain with HTTP requests.  
  - Edge Cases: Very large datasets may require batch size tuning.  

- **If**  
  - Type: If  
  - Role: Conditional check following the HTTP Request node (see later block), to decide next step based on response.  
  - Configuration: Condition details not explicitly provided; likely checks if HTTP request returned valid data.  
  - Inputs: From HTTP Request node.  
  - Outputs: Routes to either "Code" node on success or "Email Not Found" on failure.  
  - Edge Cases: Misconfigured condition expressions or unexpected HTTP responses may cause logic errors.

---

#### 2.3 External HTTP Requests & Conditional Processing

**Overview:**  
Performs HTTP requests to external services or APIs, interprets results, and directs flow based on data presence.

**Nodes Involved:**  
- HTTP Request  
- If (conditional node after HTTP Request)  
- Code (conditional success handler)  
- Email Found (If node checking presence of email in outer page)  
- Email Not Found (Google Sheets update for missing emails)

**Node Details:**  

- **HTTP Request**  
  - Type: HTTP Request  
  - Role: Makes external call to acquire data (e.g., Google Maps API or web scraping target).  
  - Configuration: Parameters not specified but likely includes URL from batch data, method GET, and possibly headers or query params.  
  - Inputs: From "Loop Over Items".  
  - Outputs: Two outputs; first to "If" node for validation, second to "Email Not Found" node for error/empty result scenario.  
  - On Error: Configured to continue on errors (prevents workflow halt).  
  - Edge Cases: Network failures, HTTP errors, timeouts, invalid URLs.  

- **If**  
  - Evaluates response from HTTP Request to decide if useful data was retrieved.  

- **Code (success path)**  
  - Type: Code (JavaScript)  
  - Role: Processes HTTP response data, likely extracting or transforming data to check for email presence.  
  - Inputs: From If node (success branch).  
  - Outputs: To "Email Found" node.  
  - Edge Cases: Script errors, invalid data format.  

- **Email Found (If node)**  
  - Checks if the email was found in the processed data.  
  - On true: sends data to "Email Updated" to update Sheets.  
  - On false: sends data to "Extract Pages" to continue scraping deeper pages.  

- **Email Not Found (Google Sheets)**  
  - Updates Google Sheets marking missing emails for the current batch item.  
  - Inputs: From HTTP Request failure path or internal page processing failure.  
  - Edge Cases: Google Sheets write errors, API quota exceeded.

---

#### 2.4 Email Extraction and Validation

**Overview:**  
This block dives deeper into the data by extracting subpages, iterating over them, and extracting emails from internal pages for better coverage.

**Nodes Involved:**  
- Extract Pages (Code)  
- Split Out  
- Loop Over Items1 (splitInBatches)  
- Fetch internal page (HTTP Request)  
- Extract Email (Code)  
- Email Found Internal (If)  
- Email Updated Internal (Google Sheets)  
- Email Not Found (Google Sheets, reused)

**Node Details:**  

- **Extract Pages**  
  - Type: Code  
  - Role: Parses the initial HTTP response to extract links to internal pages for further email scraping.  
  - Inputs: From "Email Found" node (false branch).  
  - Outputs: To "Split Out".  
  - Edge Cases: Parsing errors if page format changes or unexpected HTML.  

- **Split Out**  
  - Type: SplitOut  
  - Role: Splits extracted pages array into individual items for separate processing.  
  - Inputs: From "Extract Pages".  
  - Outputs: To "Loop Over Items1".  

- **Loop Over Items1**  
  - Type: SplitInBatches  
  - Role: Processes internal pages in batches similarly to outer loop.  
  - Inputs: From "Split Out".  
  - Outputs: Two outputs – first to "Email Not Found" if no more pages, second to "Fetch internal page" for fetching each internal page.  
  - Edge Cases: Same as outer loop; batch size and rate limits.  

- **Fetch internal page**  
  - Type: HTTP Request  
  - Role: Fetches each internal page URL to find embedded email addresses.  
  - Inputs: From "Loop Over Items1".  
  - Outputs: To "Extract Email".  
  - Edge Cases: HTTP errors, timeouts, invalid URLs.  

- **Extract Email**  
  - Type: Code  
  - Role: Parses the fetched internal page content to extract email addresses using regex or parsing logic.  
  - Inputs: From "Fetch internal page".  
  - Outputs: To "Email Found Internal".  
  - Edge Cases: Parsing errors, empty content.  

- **Email Found Internal (If)**  
  - Checks if the internal fetch yielded an email address.  
  - True: sends to "Email Updated Internal" to update Google Sheets.  
  - False: loops back to "Loop Over Items1" for next internal page.  

- **Email Updated Internal (Google Sheets)**  
  - Updates Google Sheets with newly discovered internal page email addresses.  
  - Inputs: From "Email Found Internal" true branch.  
  - Outputs: Loops back to "Loop Over Items" to continue processing main batch.  
  - Edge Cases: API write errors.

- **Email Not Found**  
  - Reused node to mark missing emails when no internal emails are found after full crawl.

---

#### 2.5 Google Sheets Update

**Overview:**  
Handles updating the Google Sheets document with enriched email data or flags when data cannot be enriched.

**Nodes Involved:**  
- Email Updated (Google Sheets)  
- Email Updated Internal (Google Sheets)  
- Email Not Found (Google Sheets)

**Node Details:**  

- **Email Updated**  
  - Type: Google Sheets  
  - Role: Writes the found email from the external page extraction to the sheet.  
  - Inputs: From "Email Found" true branch.  
  - Outputs: Loops back to "Loop Over Items" to continue with next batch item.  
  - Edge Cases: API limits, authentication issues.  

- **Email Updated Internal**  
  - Type: Google Sheets  
  - Role: Writes email found on internal pages to the sheet.  
  - Inputs: From "Email Found Internal".  
  - Outputs: Loops back to outer batch processing.  
  - Edge Cases: Same as above.  

- **Email Not Found**  
  - Type: Google Sheets  
  - Role: Logs entries without found emails, marking them accordingly.  
  - Inputs: From multiple failure or negative branches.  
  - Outputs: Loops back to "Loop Over Items" or at end of internal loop.  
  - Edge Cases: Same as above.

---

#### 2.6 Miscellaneous Nodes

**Sticky Notes:**  
- Two sticky notes are present but contain no content, possibly placeholders or for visual grouping.

---

### 3. Summary Table

| Node Name                    | Node Type        | Functional Role                              | Input Node(s)                      | Output Node(s)                    | Sticky Note                     |
|------------------------------|------------------|----------------------------------------------|----------------------------------|----------------------------------|--------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger   | Workflow entry point via manual execution     | None                             | Get row(s) in sheet              |                                |
| Get row(s) in sheet           | Google Sheets    | Fetch initial lead data rows                   | When clicking ‘Execute workflow’ | Loop Over Items                  |                                |
| Loop Over Items               | SplitInBatches   | Batch processing of lead rows                  | Get row(s) in sheet              | HTTP Request                    |                                |
| HTTP Request                 | HTTP Request     | External data fetch (Google Maps or scraping) | Loop Over Items                  | If, Email Not Found              |                                |
| If                          | If               | Conditional check on HTTP response             | HTTP Request                    | Code, Email Not Found            |                                |
| Code                        | Code             | Process HTTP response data                      | If                             | Email Found                     |                                |
| Email Found                 | If               | Check if email found in external page          | Code                           | Email Updated, Extract Pages     |                                |
| Email Updated               | Google Sheets    | Update sheet with found email                   | Email Found                    | Loop Over Items                  |                                |
| Extract Pages               | Code             | Extract internal page URLs for deeper scraping | Email Found                   | Split Out                      |                                |
| Split Out                  | SplitOut          | Split array of pages into individual items     | Extract Pages                  | Loop Over Items1                 |                                |
| Loop Over Items1            | SplitInBatches   | Batch process internal pages                    | Split Out                     | Email Not Found, Fetch internal page |                                |
| Fetch internal page         | HTTP Request     | Fetch each internal page content                | Loop Over Items1               | Extract Email                   |                                |
| Extract Email               | Code             | Extract email address from internal page       | Fetch internal page            | Email Found Internal             |                                |
| Email Found Internal        | If               | Check if email found in internal page           | Extract Email                  | Email Updated Internal, Loop Over Items1 |                                |
| Email Updated Internal      | Google Sheets    | Update sheet with internal page email           | Email Found Internal           | Loop Over Items                  |                                |
| Email Not Found             | Google Sheets    | Mark entries with no email found                | HTTP Request, Loop Over Items1 | Loop Over Items                  |                                |
| Sticky Note                 | Sticky Note      | Visual note placeholder                          | None                         | None                           |                                |
| Sticky Note1                | Sticky Note      | Visual note placeholder                          | None                         | None                           |                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: "When clicking ‘Execute workflow’"  
   - Purpose: Manual start of the workflow.  

2. **Add Google Sheets Node**  
   - Name: "Get row(s) in sheet"  
   - Configure credentials for Google Sheets API (OAuth2).  
   - Set to read the sheet containing initial lead data (specify Spreadsheet ID, Sheet name, and range as needed).  
   - Connect output of manual trigger to input of this node.  

3. **Add SplitInBatches Node**  
   - Name: "Loop Over Items"  
   - Set batch size (e.g., 5 or 10 depending on rate limits).  
   - Connect input from "Get row(s) in sheet".  

4. **Add HTTP Request Node**  
   - Name: "HTTP Request"  
   - Configure to perform GET requests to Google Maps or relevant lead data API.  
   - Use batch item data to dynamically set URL or query parameters.  
   - Configure error handling to "Continue on error".  
   - Connect from second output of "Loop Over Items".  

5. **Add If Node**  
   - Name: "If"  
   - Set condition to check if HTTP Request returned valid data (e.g., response status or presence of expected fields).  
   - Connect first HTTP Request output to input of this node.  

6. **Add Code Node**  
   - Name: "Code"  
   - Write JavaScript to parse HTTP response, extract relevant lead info and check for email presence.  
   - Connect "If" true output to "Code".  

7. **Add If Node**  
   - Name: "Email Found"  
   - Condition: Check if email was found in parsed data.  
   - Connect "Code" output to "Email Found".  

8. **Add Google Sheets Node**  
   - Name: "Email Updated"  
   - Configure to update the original Google Sheet row with the found email.  
   - Connect "Email Found" true output to this node.  
   - Connect output back to first input of "Loop Over Items" to process next batch.  

9. **Add Code Node**  
   - Name: "Extract Pages"  
   - Write JavaScript to extract internal page URLs from the HTTP response for deeper scraping.  
   - Connect "Email Found" false output to this node.  

10. **Add SplitOut Node**  
    - Name: "Split Out"  
    - Connect from "Extract Pages" output.  

11. **Add SplitInBatches Node**  
    - Name: "Loop Over Items1"  
    - Set batch size similarly.  
    - Connect from "Split Out".  

12. **Add HTTP Request Node**  
    - Name: "Fetch internal page"  
    - Configure to fetch each internal page URL dynamically.  
    - Connect second output of "Loop Over Items1" to this node.  

13. **Add Code Node**  
    - Name: "Extract Email"  
    - Write JavaScript to parse internal page content and extract email addresses.  
    - Connect from "Fetch internal page".  

14. **Add If Node**  
    - Name: "Email Found Internal"  
    - Condition: Check if email extracted from internal page is valid.  
    - Connect from "Extract Email".  

15. **Add Google Sheets Node**  
    - Name: "Email Updated Internal"  
    - Configure to update sheet with internal page email.  
    - Connect "Email Found Internal" true output here and then loop back to "Loop Over Items".  

16. **Connect "Email Found Internal" false output back to "Loop Over Items1"**  
    - To continue processing remaining internal pages.  

17. **Add Google Sheets Node**  
    - Name: "Email Not Found"  
    - Configure to mark rows with no found email.  
    - Connect from:  
      - "If" false output (failed HTTP request or no data)  
      - "Loop Over Items1" first output (no internal pages left)  
    - Connect outputs back to "Loop Over Items" to continue processing.  

18. **Configure Credentials**  
    - Google Sheets OAuth2 credentials configured and tested.  
    - HTTP Request node authentication if required (e.g., API keys).  

19. **Add Sticky Notes** as visual aids if desired (content empty).  

---

### 5. General Notes & Resources

| Note Content                                                                 | Context or Link                          |
|------------------------------------------------------------------------------|-----------------------------------------|
| Workflow automates Google Maps lead generation with free email enrichment.    | Workflow description                    |
| Uses Google Sheets as input/output for lead data management.                  | Google Sheets nodes                     |
| HTTP Request nodes configured to continue on error, ensuring robustness.     | Node error handling                     |
| Batch processing used to manage rate limits and large datasets.              | SplitInBatches nodes                    |
| Email extraction performed on both main and internal pages for coverage.     | Code nodes "Extract Email" and "Extract Pages" |
| No sticky note content was provided; placeholders present for future notes.  | Sticky Note nodes                       |

---

**Disclaimer:** The provided text is generated exclusively from an automated n8n workflow respecting all current content policies. It contains no illegal or offensive elements. All processed data is legal and public.