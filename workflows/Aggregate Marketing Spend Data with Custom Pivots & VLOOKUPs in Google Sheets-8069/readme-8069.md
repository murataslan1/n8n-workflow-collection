Aggregate Marketing Spend Data with Custom Pivots & VLOOKUPs in Google Sheets

https://n8nworkflows.xyz/workflows/aggregate-marketing-spend-data-with-custom-pivots---vlookups-in-google-sheets-8069


# Aggregate Marketing Spend Data with Custom Pivots & VLOOKUPs in Google Sheets

---

### 1. Workflow Overview

This workflow automates the aggregation and summarization of marketing spend data stored in Google Sheets. It is designed to create a pivot-like summary table by merging raw spend data with a lookup table, performing aggregation, and writing the results back into a designated Google Sheets tab. The workflow eliminates manual pivot table creation, enabling streamlined reporting and data preparation for marketing analytics.

Logical blocks in the workflow:

- **1.1 Input Reception:** Manual trigger to start the workflow execution.
- **1.2 Data Retrieval:** Fetch raw marketing spend data and lookup reference data from Google Sheets.
- **1.3 Data Merging:** Combine marketing data with lookup data using a key field.
- **1.4 Data Aggregation:** Summarize the merged data by aggregating spend values grouped by name.
- **1.5 Output Preparation:** Clear previous summary data and append the new pivot-style aggregated results into the output Google Sheet tab.
- **1.6 Documentation and Setup Notes:** Sticky notes providing instructions, setup guidance, and contact information.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block provides the manual trigger for workflow execution, allowing the user to start the process on demand.

**Nodes Involved:**  
- When clicking ‘Execute workflow’

**Node Details:**

- **When clicking ‘Execute workflow’**  
  - *Type:* Manual Trigger  
  - *Role:* Initiates the workflow manually.  
  - *Configuration:* No parameters; simple manual trigger.  
  - *Input/Output:* No input; outputs trigger signal to "Get Marketing Data" and "Vlookup Data" nodes.  
  - *Edge Cases:* None expected; user interaction required.  
  - *Version:* Standard manual trigger node; no special requirements.

---

#### 1.2 Data Retrieval

**Overview:**  
This block retrieves two sets of data from Google Sheets: raw marketing spend data and lookup data used for reference (such as channel information).

**Nodes Involved:**  
- Get Marketing Data  
- Vlookup Data

**Node Details:**

- **Get Marketing Data**  
  - *Type:* Google Sheets (Read operation)  
  - *Role:* Retrieves raw marketing spend data from the "data" sheet/tab of the specified spreadsheet.  
  - *Configuration:* Reads entire "data" worksheet (gid=0) from the spreadsheet with ID `1aO6fhd-P55lXy9QuKs23Eifi1SzZ2GAFj0q0Qx4vl30`.  
  - *Credentials:* Uses OAuth2 credentials named "Google Sheets account 3".  
  - *Input:* Triggered by manual execution node.  
  - *Output:* Data passed to "Merge Tables (Vlookup)" node.  
  - *Edge Cases:* Potential failures include OAuth token expiration, permission errors, or sheet access issues.  
  - *Version:* Google Sheets node v4.7.

- **Vlookup Data**  
  - *Type:* Google Sheets (Read operation)  
  - *Role:* Retrieves lookup/reference data from the "Lookup" sheet/tab (gid=894339285) in the same spreadsheet.  
  - *Configuration:* Reads entire "Lookup" worksheet.  
  - *Credentials:* Same as above.  
  - *Input:* Triggered by manual execution node.  
  - *Output:* Data passed to "Merge Tables (Vlookup)" node.  
  - *Edge Cases:* Same as "Get Marketing Data".

---

#### 1.3 Data Merging

**Overview:**  
This block merges the raw marketing data with the lookup table based on a common key to enrich the dataset before aggregation.

**Nodes Involved:**  
- Merge Tables (Vlookup)

**Node Details:**

- **Merge Tables (Vlookup)**  
  - *Type:* Merge  
  - *Role:* Combines two data streams — marketing spend data and lookup data — by matching on the "Channel" field.  
  - *Configuration:*  
    - Mode: Combine (join)  
    - Matching field: "Channel"  
  - *Input:* Receives marketing data (main input) and lookup data (secondary input).  
  - *Output:* Merged dataset forwarded to "Pivot" node.  
  - *Edge Cases:*  
    - Missing matching keys leading to incomplete merges.  
    - Data type mismatches in key columns causing no matches.  
    - Empty inputs if upstream nodes fail.  
  - *Version:* Merge node v3.2.

---

#### 1.4 Data Aggregation

**Overview:**  
Aggregates the merged data by summarizing total spend grouped by the "Name" field, simulating a pivot table aggregation.

**Nodes Involved:**  
- Pivot

**Node Details:**

- **Pivot**  
  - *Type:* Summarize  
  - *Role:* Performs aggregation by summing the "Spend ($)" field grouped by "Name".  
  - *Configuration:*  
    - Fields to split by: "Name"  
    - Fields to summarize: sum of "Spend ($)"  
  - *Input:* Receives merged data from "Merge Tables (Vlookup)".  
  - *Output:* Aggregated summary forwarded to "Clear sheet" node.  
  - *Edge Cases:*  
    - Missing or malformed numeric values in "Spend ($)" can cause aggregation errors.  
    - Empty input data leads to empty output.  
  - *Version:* Summarize node v1.1.

---

#### 1.5 Output Preparation

**Overview:**  
Clears the target Google Sheets tab to remove old data, then appends the newly aggregated pivot-like summary data.

**Nodes Involved:**  
- Clear sheet  
- Create "Pivot Table" Kindof

**Node Details:**

- **Clear sheet**  
  - *Type:* Google Sheets (Clear operation)  
  - *Role:* Clears all existing data in the "render pivot" sheet/tab (gid=1235077339) before writing new data.  
  - *Configuration:*  
    - Document ID: Same as above  
    - Sheet: "render pivot" (gid=1235077339)  
    - Operation: Clear entire sheet (no range specified)  
  - *Input:* Receives aggregated data trigger from "Pivot" node.  
  - *Output:* Triggers "Create 'Pivot Table' Kindof" node.  
  - *Edge Cases:*  
    - Permission or access errors.  
    - Failures if sheet is protected or locked.  
  - *Version:* Google Sheets node v4.7.

- **Create "Pivot Table" Kindof**  
  - *Type:* Google Sheets (Append operation)  
  - *Role:* Appends aggregated summary data into the "render pivot" sheet/tab.  
  - *Configuration:*  
    - Document ID: Same as above  
    - Sheet: "render pivot" (gid=1235077339)  
    - Operation: Append  
    - Columns mapped automatically: "sum_Spend_($)" and "Name"  
  - *Input:* Receives trigger from "Clear sheet" node and data from "Pivot" node.  
  - *Output:* End of workflow; no further nodes connected.  
  - *Edge Cases:*  
    - Append failures due to sheet protection.  
    - Data type mismatches if column headers change in the sheet.  
  - *Version:* Google Sheets node v4.7.

---

#### 1.6 Documentation and Setup Notes

**Overview:**  
Sticky notes provide important setup instructions, workflow description, and contact information for customization support.

**Nodes Involved:**  
- Sticky Note55  
- Sticky Note3  
- Sticky Note65

**Node Details:**

- **Sticky Note55**  
  - *Type:* Sticky Note  
  - *Role:* Describes the workflow purpose and main logic: building a pivot-style marketing spend summary using merge, summarize, and VLOOKUP operations in Google Sheets.  
  - *Content:* Detailed explanation of the workflow’s function and automation benefits.  
  - *Position:* Visible near the workflow start for user reference.

- **Sticky Note3**  
  - *Type:* Sticky Note  
  - *Role:* Setup instructions for Google Sheets OAuth2 credentials and sheet configurations, along with contact details for support.  
  - *Content:* Step-by-step instructions to authorize Google Sheets access, select appropriate spreadsheet tabs, and contact info with links.  
  - *Important Links:*  
    - Google Sheets URL for the example spreadsheet  
    - Contact email and LinkedIn profile of Robert Breen  
    - Company website: ynteractive.com

- **Sticky Note65**  
  - *Type:* Sticky Note  
  - *Role:* Concise OAuth2 connection instructions repeated for emphasis.  
  - *Content:* Steps to configure Google Sheets OAuth2 credentials and select spreadsheet tabs.  
  - *Link:* Google Sheets example URL.

---

### 3. Summary Table

| Node Name                   | Node Type              | Functional Role                     | Input Node(s)               | Output Node(s)                 | Sticky Note                                                                                   |
|-----------------------------|------------------------|-----------------------------------|-----------------------------|-------------------------------|-----------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger         | Workflow start trigger            | -                           | Get Marketing Data, Vlookup Data |                                                                                               |
| Get Marketing Data           | Google Sheets (Read)   | Retrieve raw marketing spend data | When clicking ‘Execute workflow’ | Merge Tables (Vlookup)          |                                                                                               |
| Vlookup Data                | Google Sheets (Read)   | Retrieve lookup/reference data    | When clicking ‘Execute workflow’ | Merge Tables (Vlookup)          |                                                                                               |
| Merge Tables (Vlookup)       | Merge                  | Merge marketing and lookup data   | Get Marketing Data, Vlookup Data | Pivot                         |                                                                                               |
| Pivot                       | Summarize              | Aggregate spend by Name            | Merge Tables (Vlookup)       | Clear sheet                   |                                                                                               |
| Clear sheet                 | Google Sheets (Clear)  | Clear old pivot data from sheet   | Pivot                       | Create "Pivot Table" Kindof    |                                                                                               |
| Create "Pivot Table" Kindof | Google Sheets (Append) | Append aggregated data to sheet   | Clear sheet                 | -                             |                                                                                               |
| Sticky Note55               | Sticky Note            | Workflow purpose description      | -                           | -                             | Build a pivot-style marketing spend summary in Google Sheets using n8n (Merge + Summarize + Vlookup) |
| Sticky Note3                | Sticky Note            | Setup instructions and contacts   | -                           | -                             | See detailed OAuth2 setup and contact info (links included)                                  |
| Sticky Note65               | Sticky Note            | OAuth2 connection instructions    | -                           | -                             | See Google Sheets OAuth2 setup instructions with link                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Purpose: To start workflow manually.

2. **Create Google Sheets Node (Get Marketing Data)**  
   - Type: Google Sheets  
   - Operation: Read  
   - Spreadsheet ID: `1aO6fhd-P55lXy9QuKs23Eifi1SzZ2GAFj0q0Qx4vl30`  
   - Sheet: "data" (gid=0)  
   - Credentials: Configure Google Sheets OAuth2 credentials (named e.g. "Google Sheets account 3").  
   - Connect output from Manual Trigger.

3. **Create Google Sheets Node (Vlookup Data)**  
   - Type: Google Sheets  
   - Operation: Read  
   - Spreadsheet ID: same as above  
   - Sheet: "Lookup" (gid=894339285)  
   - Credentials: Same as above.  
   - Connect output from Manual Trigger.

4. **Create Merge Node (Merge Tables (Vlookup))**  
   - Type: Merge  
   - Mode: Combine (join)  
   - Fields to match: "Channel" (string match)  
   - Input 1: Connect from "Get Marketing Data" node (main input)  
   - Input 2: Connect from "Vlookup Data" node (secondary input)

5. **Create Summarize Node (Pivot)**  
   - Type: Summarize  
   - Fields to split by: "Name"  
   - Fields to summarize: sum of "Spend ($)"  
   - Connect input from Merge node output.

6. **Create Google Sheets Node (Clear sheet)**  
   - Type: Google Sheets  
   - Operation: Clear  
   - Spreadsheet ID: same as above  
   - Sheet: "render pivot" (gid=1235077339)  
   - Credentials: Same as above.  
   - Connect input from Summarize node output.

7. **Create Google Sheets Node (Create "Pivot Table" Kindof)**  
   - Type: Google Sheets  
   - Operation: Append  
   - Spreadsheet ID: same as above  
   - Sheet: "render pivot" (gid=1235077339)  
   - Columns mapping: Automatically map columns "sum_Spend_($)" and "Name" from input data  
   - Credentials: Same as above.  
   - Connect input from Clear sheet output.

8. **Verify and Test**  
   - Ensure OAuth2 credentials are authorized and valid.  
   - Test manual trigger to verify data flows through each step and results append correctly.  
   - Handle any permission or data format issues found during testing.

9. **(Optional) Add Sticky Notes**  
   - Add descriptive sticky notes for workflow purpose, setup instructions, and contact info for future users.

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                                         |
|-------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Workflow automates pivot-like marketing spend summary creation in Google Sheets by merging raw data and lookup tables, aggregating totals, and appending results automatically. | Workflow description and purpose.                                                                                       |
| Setup requires Google Sheets OAuth2 credentials setup in n8n and selection of appropriate spreadsheet and worksheet tabs.          | Instructions detailed in sticky notes; example spreadsheet: https://docs.google.com/spreadsheets/d/1aO6fhd-P55lXy9QuKs23Eifi1SzZ2GAFj0q0Qx4vl30/ |
| Contact for customization help: Robert Breen, email: rbreen@ynteractive.com, LinkedIn: https://www.linkedin.com/in/robert-breen-29429625/, company: https://ynteractive.com | Provided in sticky notes for user support and customization requests.                                                   |

---

**Disclaimer:** The provided text is derived exclusively from an automated n8n workflow. It fully complies with content policies and contains no illegal or protected elements. All processed data is legal and public.