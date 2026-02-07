Automate SEO Analysis for Multiple Domains with Ahrefs and Google Sheets

https://n8nworkflows.xyz/workflows/automate-seo-analysis-for-multiple-domains-with-ahrefs-and-google-sheets-7010


# Automate SEO Analysis for Multiple Domains with Ahrefs and Google Sheets

### 1. Workflow Overview

This workflow automates the SEO analysis process for multiple domains by integrating Ahrefs data via an SEO MCP server and updating a Google Sheet with enriched analytics. It targets marketing professionals and SEO specialists who need to regularly monitor domain performance metrics such as traffic, backlinks, rankings, and keyword data for a list of domains.

The workflow is logically divided into these main blocks:

- **1.1 Input Reception:** Manual trigger to start the workflow.
- **1.2 Domain Retrieval:** Fetching domains from a Google Sheet.
- **1.3 Iterative Processing:** Looping over each domain to fetch data.
- **1.4 Traffic Data Retrieval and Parsing:** Querying Ahrefs traffic stats via MCP and parsing results.
- **1.5 SEO Metrics Retrieval and Parsing:** Querying Ahrefs backlink and ranking stats via MCP and parsing results.
- **1.6 Updating Google Sheet:** Writing back both traffic and SEO metrics to the Google Sheet.
- **1.7 Documentation Notes:** Sticky notes providing instructions and explanations.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Initiate workflow execution manually.
- **Nodes Involved:** 
  - When clicking ‘Execute workflow’
- **Node Details:**  
  - Type: Manual Trigger  
  - Configuration: No parameters; triggers on manual execution.  
  - Inputs: None  
  - Outputs: Connects to "Get Domains in sheet" node.  
  - Edge cases: None; manual trigger is straightforward.  

#### 2.2 Domain Retrieval

- **Overview:** Retrieve the list of domains from the Google Sheet to process.
- **Nodes Involved:**  
  - Get Domains in sheet
- **Node Details:**  
  - Type: Google Sheets (Read operation)  
  - Configuration: Reads from the "Domains" sheet (gid=0) of a Google Sheet document (ID: 1oBQqboIT9ubDmMIvvZveAneUHpuNV60egXsIU3hyuy0) using a Google Service Account for authentication.  
  - Key parameters: Reads all rows to get domain list.  
  - Inputs: From manual trigger.  
  - Outputs: To "Loop Over Items" node.  
  - Edge cases: Authentication failures, empty or malformed sheets, API rate limits.  

#### 2.3 Iterative Processing

- **Overview:** Split the retrieved domain list into individual domain items to process sequentially or in batches.
- **Nodes Involved:**  
  - Loop Over Items
- **Node Details:**  
  - Type: SplitInBatches  
  - Configuration: Defaults; no batch size specified which defaults to 1 item per batch.  
  - Inputs: From "Get Domains in sheet".  
  - Outputs: To "Get SEO Stats" and "Get Traffic" nodes in parallel.  
  - Edge cases: Handling empty inputs, potential out-of-memory if batch size too large.  

#### 2.4 Traffic Data Retrieval and Parsing

- **Overview:** Request traffic-related SEO data for each domain from the SEO MCP server and parse the JSON response.
- **Nodes Involved:**  
  - Get Traffic  
  - Parse JSON  
  - Add Traffic Data To Sheet
- **Node Details:**  
  - **Get Traffic**  
    - Type: MCP Client (Custom node)  
    - Configuration: Executes "get_traffic" tool with parameter domain_or_url set to current domain from JSON item.  
    - Credentials: SEO-MCP Client API credentials required.  
    - Inputs: Single domain from loop.  
    - Outputs: Raw JSON response forwarded to "Parse JSON".  
    - Edge cases: Network errors, invalid domain input, MCP server downtime, malformed responses.  
  - **Parse JSON**  
    - Type: Code  
    - Configuration: Parses the JSON string inside the response's "result.content[0].text". Converts stringified JSON to real object to normalize data.  
    - Inputs: From "Get Traffic".  
    - Outputs: Parsed JSON data forwarded to "Add Traffic Data To Sheet".  
    - Edge cases: Parsing errors from unexpected or malformed response content.  
  - **Add Traffic Data To Sheet**  
    - Type: Google Sheets (Update operation)  
    - Configuration: Updates the "Domains" sheet with traffic-related fields such as top_pages, top_keywords, costMontlyAvg, top_countries, traffic history, and averages. Matching done on "Domain" column.  
    - Inputs: Parsed traffic data and domain info.  
    - Outputs: Back to loop node to continue processing.  
    - Edge cases: Authentication issues, data mismatch, concurrent write conflicts.  

#### 2.5 SEO Metrics Retrieval and Parsing

- **Overview:** Request backlink and ranking SEO data for each domain and parse the JSON response.
- **Nodes Involved:**  
  - Get SEO Stats  
  - Parse JSON1  
  - Add Domain SEO Data To Sheet
- **Node Details:**  
  - **Get SEO Stats**  
    - Type: MCP Client (Custom node)  
    - Configuration: Executes "get_backlinks_list" tool with domain parameter set to current domain.  
    - Credentials: SEO-MCP Client API credentials.  
    - Inputs: Single domain item from loop.  
    - Outputs: Raw JSON response forwarded to "Parse JSON1".  
    - Edge cases: Same as Get Traffic node (network, malformed data).  
  - **Parse JSON1**  
    - Type: Code  
    - Configuration: Similar to Parse JSON; converts stringified JSON in "result.content[0].text" to object.  
    - Inputs: From "Get SEO Stats".  
    - Outputs: Parsed SEO data to "Add Domain SEO Data To Sheet".  
    - Edge cases: JSON parsing errors.  
  - **Add Domain SEO Data To Sheet**  
    - Type: Google Sheets (Update operation)  
    - Configuration: Updates the "Domains" sheet with SEO metrics like urlRating, domainRating, backlinksCount, referringDomains, dofollowBacklinksPercentage, dofollowRefdomainsPercentage. Matched on "Domain" column.  
    - Inputs: Parsed SEO metrics and domain info.  
    - Outputs: Back to loop node.  
    - Edge cases: Same as Add Traffic Data To Sheet node.  

#### 2.6 Updating Google Sheet

- **Overview:** The update steps are embedded within the above blocks where traffic and SEO data are each written back to the Google Sheet respectively.
- **Nodes Involved:**  
  - Add Traffic Data To Sheet  
  - Add Domain SEO Data To Sheet
- **Node Details:** See sections 2.4 and 2.5.

#### 2.7 Documentation Notes

- **Overview:** Provides user guidance and workflow explanation.
- **Nodes Involved:**  
  - Sticky Note6 (Traffic Data explanation)  
  - Sticky Note (SEO Data explanation)  
  - Sticky Note7 (Overall workflow instructions and requirements)  
- **Node Details:**  
  - Type: Sticky Note  
  - Configuration: Contains markdown-formatted text explaining workflow purpose, usage, setup, and requirements including links to relevant resources such as Google Sheets template and SEO MCP GitHub repository.  
  - Inputs/Outputs: None; purely informational.  

---

### 3. Summary Table

| Node Name                 | Node Type             | Functional Role                        | Input Node(s)               | Output Node(s)                       | Sticky Note                                                                                                                          |
|---------------------------|-----------------------|-------------------------------------|-----------------------------|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger        | Start workflow manually              | None                        | Get Domains in sheet                |                                                                                                                                      |
| Get Domains in sheet       | Google Sheets         | Read domain list from sheet          | When clicking ‘Execute workflow’ | Loop Over Items                    |                                                                                                                                      |
| Loop Over Items           | SplitInBatches        | Iterate over each domain              | Get Domains in sheet         | Get SEO Stats, Get Traffic          |                                                                                                                                      |
| Get SEO Stats             | MCP Client            | Fetch domain backlink and ranking SEO data | Loop Over Items              | Parse JSON1                       |                                                                                                                                      |
| Parse JSON1               | Code                  | Parse SEO JSON response               | Get SEO Stats                | Add Domain SEO Data To Sheet        |                                                                                                                                      |
| Add Domain SEO Data To Sheet | Google Sheets       | Update Google Sheet with SEO metrics | Parse JSON1                 | Loop Over Items                    |                                                                                                                                      |
| Get Traffic               | MCP Client            | Fetch domain traffic data             | Loop Over Items              | Parse JSON                       |                                                                                                                                      |
| Parse JSON                | Code                  | Parse traffic JSON response           | Get Traffic                  | Add Traffic Data To Sheet           |                                                                                                                                      |
| Add Traffic Data To Sheet | Google Sheets          | Update Google Sheet with traffic metrics | Parse JSON                  | Loop Over Items                    |                                                                                                                                      |
| Sticky Note6              | Sticky Note           | Explains traffic data retrieval block | None                        | None                              | ## 1. Get Domain Traffic information Retrieve traffic, top pages and keyword information from ahrefs.com for each domain            |
| Sticky Note               | Sticky Note           | Explains SEO data retrieval block     | None                        | None                              | ## 2. Get Domain SEO information Retrieve ranking and backlink information from ahrefs.com for each domain                           |
| Sticky Note7              | Sticky Note           | Workflow overview and usage instructions | None                        | None                              | ## Domain Analyzer Workflow Template with setup instructions and external links (Google Sheet template, SEO MCP GitHub, CapSolver) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**
   - Type: Manual Trigger  
   - No parameters needed.  
   - This will be the entry point.

2. **Create Google Sheets Node to Read Domains**
   - Type: Google Sheets (Read)  
   - Configure with Google Service Account credentials.  
   - Set Document ID to your Google Sheet containing domains.  
   - Set Sheet Name to "Domains" (gid=0).  
   - Read all rows (default).  
   - Connect output from Manual Trigger to this node.

3. **Create SplitInBatches Node**
   - Type: SplitInBatches  
   - Leave default batch size (1) or set as preferred.  
   - Connect input from "Get Domains in sheet".  
   - This node will iterate each domain.

4. **Create MCP Client Node for Traffic Data**
   - Type: MCP Client (Custom node, e.g., seo-mcp)  
   - Credentials: MCP Client API credentials (SEO-MCP).  
   - Tool Name: "get_traffic"  
   - Operation: "executeTool"  
   - Tool parameters: JSON with `"domain_or_url": "{{ $json.Domain }}"`  
   - Connect from SplitInBatches node.

5. **Create Code Node to Parse Traffic JSON**
   - Type: Code  
   - JavaScript code to parse stringified JSON from `result.content[0].text` using `JSON.parse()`.  
   - Input: From MCP Traffic node.  
   - Output: Parsed traffic data object.

6. **Create Google Sheets Node to Update Traffic Data**
   - Type: Google Sheets (Update)  
   - Credentials: Same Google Service Account.  
   - Document and Sheet: Same as domain input sheet.  
   - Map columns: Domain, top_pages, top_keywords, costMontlyAvg, top_countries, traffic_history, trafficMonthlyAvg.  
   - Matching column: Domain.  
   - Connect from traffic JSON parse node.  
   - Output back to SplitInBatches to continue loop.

7. **Create MCP Client Node for SEO Stats**
   - Type: MCP Client  
   - Credentials: SEO-MCP credentials.  
   - Tool Name: "get_backlinks_list"  
   - Operation: "executeTool"  
   - Tool parameters: JSON with `"domain": "{{ $json.Domain }}"`  
   - Connect from SplitInBatches.

8. **Create Code Node to Parse SEO JSON**
   - Type: Code  
   - Same parsing logic as traffic JSON node.  
   - Input: From SEO Stats MCP node.

9. **Create Google Sheets Node to Update SEO Data**
   - Type: Google Sheets (Update)  
   - Document and Sheet: Same as above.  
   - Map columns: Domain, urlRating, domainRating, backlinksCount, referringDomains, dofollowBacklinksPercentage, dofollowRefdomainsPercentage.  
   - Matching column: Domain.  
   - Input: From SEO JSON parse node.  
   - Output back to SplitInBatches node.

10. **Connect the two MCP nodes (Traffic and SEO) in parallel from SplitInBatches node.**

11. **Optionally add Sticky Note nodes for documentation inside the workflow:**
    - Explaining traffic data retrieval block.  
    - Explaining SEO data retrieval block.  
    - Overall workflow instructions with links to Google Sheet template, SEO MCP repository, and CapSolver registration.

12. **Configure credentials:**
    - Google API Service Account with read/write access to the target Google Sheet.  
    - SEO MCP Client API credentials with environment variables set (e.g., CapSolver API key).

13. **Test workflow with a small list of domains to verify data retrieval and sheet updates.**

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| This workflow uses [seo-mcp](https://github.com/cnych/seo-mcp) to interact with Ahrefs free tooling and requires a CapSolver API key for CAPTCHA solving. | SEO MCP GitHub and CapSolver registration: https://dashboard.capsolver.com/passport/register?inviteCode=p-4Y_DjQymvt |
| The Google Sheet template to use with this workflow is available here: [Google Sheet Template](https://docs.google.com/spreadsheets/d/1oBQqboIT9ubDmMIvvZveAneUHpuNV60egXsIU3hyuy0/edit#gid=456214435) | Google Sheets integration |
| For Google Sheets authentication, a Google Service Account is recommended to grant n8n read and write permissions. | n8n Docs: https://docs.n8n.io/integrations/builtin/credentials/google/service-account/ |
| Workflow saves time by automating bulk domain SEO and traffic analysis suitable for marketing research and SEO monitoring. | Workflow purpose |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.