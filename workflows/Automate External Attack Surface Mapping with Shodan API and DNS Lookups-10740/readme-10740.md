Automate External Attack Surface Mapping with Shodan API and DNS Lookups

https://n8nworkflows.xyz/workflows/automate-external-attack-surface-mapping-with-shodan-api-and-dns-lookups-10740


# Automate External Attack Surface Mapping with Shodan API and DNS Lookups

### 1. Workflow Overview

This workflow automates external attack surface mapping for a specified domain by integrating DNS lookups and Shodan API queries. It is designed to gather all DNS records, filter for IP addresses, and then query Shodan for open ports, banners, and service information related to those IPs. The results are compiled and logged into a Google Sheet and also output to the console for quick inspection.

The workflow is logically divided into these blocks:

- **1.1 Input Reception and Target Setup:** Manual trigger and domain parameter setup.
- **1.2 DNS Records Retrieval:** Query DNS records for the target domain using Google DNS.
- **1.3 DNS Records Processing and Filtering:** Extract DNS response data and filter for A and AAAA records (IP addresses).
- **1.4 Rate-Limited Shodan Queries:** For each IP, apply a delay to respect Shodan’s free-tier API rate limits, then query Shodan.
- **1.5 Shodan Data Parsing and Logging:** Parse returned Shodan JSON data, flatten it, handle errors, and append results to Google Sheets and console output.
- **1.6 Error Handling:** Catch and isolate errors without breaking the workflow.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Target Setup

**Overview:**  
This block provides the workflow entry point and allows the user to set the target domain for reconnaissance.

**Nodes Involved:**  
- START – Set target domain (Sticky Note)  
- When clicking 'Test workflow' (Manual Trigger)  
- Set Target Domain1 (Set Node)  

**Node Details:**

- **START – Set target domain**  
  - Type: Sticky Note  
  - Purpose: Marks the workflow entry and instructs user to set the domain name.  
  - Connections: None (informational only)  
  - Failure modes: None  

- **When clicking 'Test workflow'**  
  - Type: Manual Trigger  
  - Purpose: Starts the workflow manually for testing.  
  - Connections: Output to "Set Target Domain1"  
  - Failure modes: None  

- **Set Target Domain1**  
  - Type: Set  
  - Purpose: Contains the domain parameter setup (likely sets a variable with the target domain string).  
  - Connections: Outputs to "DNS Lookup (Google)1" and also to notification and error handler nodes.  
  - Failure modes: Missing or invalid domain input could cause downstream failures. Must ensure domain is valid.

---

#### 1.2 DNS Records Retrieval

**Overview:**  
Fetch all DNS records (A, AAAA, CNAME, etc.) for the target domain using Google’s DNS lookup API.

**Nodes Involved:**  
- DNS lookup (Google) (Sticky Note)  
- DNS Lookup (Google)1 (HTTP Request)  
- Extract DNS Records1 (Code)  

**Node Details:**

- **DNS lookup (Google)**  
  - Type: Sticky Note  
  - Purpose: Describes that this block pulls all DNS record types for the domain.  
  - Connections: None (comment only)  
  - Failure modes: None  

- **DNS Lookup (Google)1**  
  - Type: HTTP Request  
  - Purpose: Queries Google DNS API for the domain’s DNS records.  
  - Configuration:  
    - Endpoint: Google DNS API (e.g., `https://dns.google/resolve?name={{$json["domain"]}}`)  
    - Method: GET  
    - Parameters: Domain set from previous node  
  - Inputs: From "Set Target Domain1"  
  - Outputs: Response JSON to "Extract DNS Records1"  
  - Failure modes: HTTP errors, rate limits, invalid domain, network issues  

- **Extract DNS Records1**  
  - Type: Code (JavaScript)  
  - Purpose: Parses the DNS response JSON to extract relevant DNS records.  
  - Key Logic: Extracts records array, normalizes data for filtering.  
  - Inputs: From "DNS Lookup (Google)1"  
  - Outputs: To "Filter: Only IP records1" and also logs to Google Sheets (presumably for raw DNS data)  
  - Failure modes: Parsing errors if response is malformed or missing expected fields  

---

#### 1.3 DNS Records Processing and Filtering

**Overview:**  
Filters extracted DNS records to keep only IP address records (A and AAAA), preparing IPs for Shodan queries.

**Nodes Involved:**  
- Filter only IP records (Sticky Note)  
- Filter: Only IP records1 (If Node)  
- Prepare IP Item1 (Set Node)  

**Node Details:**

- **Filter only IP records**  
  - Type: Sticky Note  
  - Purpose: Instructional note indicating filtering to A and AAAA records only.  
  - Failure modes: None  

- **Filter: Only IP records1**  
  - Type: If  
  - Purpose: Conditional filtering node that passes only A and AAAA records.  
  - Configuration: Checks DNS record type property for "A" or "AAAA".  
  - Inputs: From "Extract DNS Records1"  
  - Outputs:  
    - True branch: To "Prepare IP Item1" (valid IP records)  
    - False branch: To "Parse Shodan Data" (likely to handle non-IP records or skip)  
  - Failure modes: Misclassification if DNS record type property changes or is missing  

- **Prepare IP Item1**  
  - Type: Set  
  - Purpose: Formats IP record data into the shape required for Shodan queries.  
  - Inputs: From "Filter: Only IP records1" (true)  
  - Outputs: To "Delay (rate-limit)"  
  - Failure modes: Incorrect mapping could cause malformed requests  

---

#### 1.4 Rate-Limited Shodan Queries

**Overview:**  
Implements a delay between Shodan API requests to respect free-tier rate limits, then performs Shodan search by IP.

**Nodes Involved:**  
- Rate-limit before Shodan (Sticky Note)  
- Delay (rate-limit) (Wait Node)  
- Shodan Search by IP (HTTP Request)  

**Node Details:**

- **Rate-limit before Shodan**  
  - Type: Sticky Note  
  - Purpose: Indicates a 10-second delay to comply with Shodan free-tier API limits.  
  - Failure modes: None  

- **Delay (rate-limit)**  
  - Type: Wait  
  - Purpose: Pauses workflow 10 seconds before each Shodan query.  
  - Configuration: Fixed wait time (10 seconds)  
  - Inputs: From "Prepare IP Item1"  
  - Outputs: To "Shodan Search by IP"  
  - Failure modes: Delay node malfunction or timeout issues  

- **Shodan Search by IP**  
  - Type: HTTP Request  
  - Purpose: Queries Shodan API for information about the IP address.  
  - Configuration:  
    - Endpoint: Shodan API search endpoint (e.g., `https://api.shodan.io/shodan/host/{{ $json["ip"] }}?key={{$credentials.shodanApiKey}}`)  
    - Method: GET  
    - Credentials: Shodan API key required  
  - Inputs: From "Delay (rate-limit)"  
  - Outputs: To "Parse Shodan Data"  
  - Failure modes: API key invalid, rate limiting, IP not found, network errors  

---

#### 1.5 Shodan Data Parsing and Logging

**Overview:**  
Parses Shodan JSON results, flattens service data into rows, handles errors gracefully, and logs results both to Google Sheets and console.

**Nodes Involved:**  
- Parse Shodan JSON (Sticky Note)  
- Parse Shodan Data (Code)  
- Write results (Sticky Note)  
- Log to Google Sheets1 (Google Sheets Node)  
- Notify: Results (console log) (Set Node)  

**Node Details:**

- **Parse Shodan JSON**  
  - Type: Sticky Note  
  - Purpose: Describes the node’s role in flattening service banners and ports into individual rows and handling errors.  
  - Failure modes: None  

- **Parse Shodan Data**  
  - Type: Code  
  - Purpose: Processes Shodan API JSON to extract relevant service info, flattening nested structures (e.g., ports, banners) into one record per service.  
  - Inputs: From "Shodan Search by IP" and also from false branch of "Filter: Only IP records1" (fallback)  
  - Outputs: To "Log to Google Sheets1", "Notify: Results (console log)", and "Error Handler (catch)"  
  - Failure modes: JSON parsing errors, empty or missing data, unexpected Shodan response changes  

- **Write results**  
  - Type: Sticky Note  
  - Purpose: Explains that results are appended to a Google Sheet and printed to console.  
  - Failure modes: None  

- **Log to Google Sheets1**  
  - Type: Google Sheets  
  - Purpose: Appends parsed Shodan data rows to a specified Google Sheet for persistent storage.  
  - Configuration:  
    - Spreadsheet ID and Sheet name configured  
    - Authentication via Google OAuth2 credentials  
  - Inputs: From "Parse Shodan Data" and "Extract DNS Records1" (for DNS logs)  
  - Outputs: To "Notify: Results (console log)"  
  - Failure modes: Authentication errors, quota limits, sheet access errors  

- **Notify: Results (console log)**  
  - Type: Set  
  - Purpose: Outputs a summary or confirmation message for quick results inspection in n8n’s execution log.  
  - Inputs: From "Log to Google Sheets1" and "Set Target Domain1" (initial notifications)  
  - Failure modes: None  

---

#### 1.6 Error Handling

**Overview:**  
Centralized error capture node that catches errors from multiple nodes and prevents workflow crashes by acting as a no-op placeholder.

**Nodes Involved:**  
- Error catcher (Sticky Note)  
- Error Handler (catch) (NoOp)  

**Node Details:**

- **Error catcher**  
  - Type: Sticky Note  
  - Purpose: Explains that any node throwing an error routes here.  
  - Failure modes: None  

- **Error Handler (catch)**  
  - Type: NoOp  
  - Purpose: Acts as endpoint for all caught errors to absorb them without further action.  
  - Inputs: From multiple nodes (e.g., "Shodan Search by IP", "Parse Shodan Data")  
  - Failure modes: None (intended no-op)  

---

### 3. Summary Table

| Node Name                 | Node Type          | Functional Role                          | Input Node(s)                | Output Node(s)                                  | Sticky Note                                                                                       |
|---------------------------|--------------------|----------------------------------------|-----------------------------|------------------------------------------------|-------------------------------------------------------------------------------------------------|
| START – Set target domain | Sticky Note        | Workflow entry point; target domain set | None                        | None                                           | Blue<br>Workflow entry point.<br>Set the domain you want to recon.                              |
| When clicking 'Test workflow' | Manual Trigger    | Manual workflow trigger                 | None                        | Set Target Domain1                              |                                                                                                 |
| Set Target Domain1         | Set                | Sets target domain parameter            | When clicking 'Test workflow' | DNS Lookup (Google)1, Notify: Results (console log), Error Handler (catch) |                                                                                                 |
| DNS lookup (Google)        | Sticky Note        | Explains DNS record retrieval           | None                        | None                                           | Green<br>Pull all DNS records for the domain (A, AAAA, CNAME, …).                               |
| DNS Lookup (Google)1       | HTTP Request       | Queries Google DNS API                   | Set Target Domain1           | Extract DNS Records1                            |                                                                                                 |
| Extract DNS Records1       | Code               | Extracts DNS records from API response  | DNS Lookup (Google)1         | Filter: Only IP records1, Log to Google Sheets1|                                                                                                 |
| Filter only IP records     | Sticky Note        | Explains filtering to A and AAAA records| None                        | None                                           | Yellow<br>Keep only A and AAAA records – we only need IPs for Shodan.                           |
| Filter: Only IP records1   | If                 | Filters only IP address records         | Extract DNS Records1         | Prepare IP Item1 (true), Parse Shodan Data (false) |                                                                                                 |
| Prepare IP Item1           | Set                | Prepares IP data for Shodan query       | Filter: Only IP records1     | Delay (rate-limit)                              |                                                                                                 |
| Rate-limit before Shodan   | Sticky Note        | Explains 10s delay to respect Shodan API| None                        | None                                           | Orange<br>10 s pause – respects Shodan free-tier limits.                                       |
| Delay (rate-limit)         | Wait               | Implements 10-second pause               | Prepare IP Item1             | Shodan Search by IP                             |                                                                                                 |
| Shodan Search by IP        | HTTP Request       | Queries Shodan API by IP                 | Delay (rate-limit)           | Parse Shodan Data                               |                                                                                                 |
| Parse Shodan JSON          | Sticky Note        | Explains parsing and flattening Shodan data | None                        | None                                           | Red<br>Flattens banners/ports into one row per service.<br>Handles errors, empty responses, and diagnostics. |
| Parse Shodan Data          | Code               | Parses and flattens Shodan JSON          | Shodan Search by IP, Filter: Only IP records1 (false) | Log to Google Sheets1, Notify: Results (console log), Error Handler (catch) |                                                                                                 |
| Write results              | Sticky Note        | Explains writing results to Google Sheets and console | None                        | None                                           | Purple<br>Append every row to Google Sheet.<br>Also prints to console for quick checks.        |
| Log to Google Sheets1      | Google Sheets      | Logs parsed data into Google Sheets      | Extract DNS Records1, Parse Shodan Data | Notify: Results (console log)                  |                                                                                                 |
| Notify: Results (console log) | Set                | Outputs results summary to console       | Set Target Domain1, Log to Google Sheets1, Parse Shodan Data | None                                           |                                                                                                 |
| Error catcher             | Sticky Note        | Explains error catch node                 | None                        | None                                           | Gray<br>Any node that throws goes here (No-Op placeholder).                                    |
| Error Handler (catch)      | NoOp               | Catches errors to prevent workflow crash | Multiple (Shodan Search by IP, Parse Shodan Data, Set Target Domain1) | None                                           |                                                                                                 |
| Sticky Note               | Sticky Note        | Unnamed note, no content                  | None                        | None                                           |                                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Name: "When clicking 'Test workflow'"  
   - Purpose: Manual start point for testing.  

2. **Create Set Node for Target Domain**  
   - Name: "Set Target Domain1"  
   - Parameters: Add a field (e.g., `domain`) and set it to the desired target domain (string).  
   - Connect output of "When clicking 'Test workflow'" to this node.  

3. **Create HTTP Request Node for DNS Lookup**  
   - Name: "DNS Lookup (Google)1"  
   - HTTP Method: GET  
   - URL: `https://dns.google/resolve?name={{$json["domain"]}}` (uses expression to get domain)  
   - Connect output of "Set Target Domain1" to this node.  

4. **Create Code Node to Extract DNS Records**  
   - Name: "Extract DNS Records1"  
   - Purpose: Parse the `Answer` array from DNS response JSON, output each record as a separate item.  
   - Connect output of "DNS Lookup (Google)1" to this node.  

5. **Create If Node to Filter IP Records**  
   - Name: "Filter: Only IP records1"  
   - Condition: Check if record type is "A" or "AAAA" (DNS record type property).  
   - Connect output of "Extract DNS Records1" to this node.  

6. **Create Set Node to Prepare IP Items for Shodan**  
   - Name: "Prepare IP Item1"  
   - Purpose: Map the IP address value to a key expected by the Shodan query node (e.g., `ip`).  
   - Connect the "true" output of "Filter: Only IP records1" to this node.  

7. **Create Wait Node for Rate Limiting**  
   - Name: "Delay (rate-limit)"  
   - Duration: 10 seconds (fixed)  
   - Connect output of "Prepare IP Item1" to this node.  

8. **Create HTTP Request Node for Shodan API**  
   - Name: "Shodan Search by IP"  
   - HTTP Method: GET  
   - URL: `https://api.shodan.io/shodan/host/{{ $json["ip"] }}?key={{$credentials.shodanApiKey}}`  
   - Set credentials to your Shodan API credentials.  
   - Connect output of "Delay (rate-limit)" to this node.  

9. **Create Code Node to Parse Shodan JSON**  
   - Name: "Parse Shodan Data"  
   - Purpose: Flatten Shodan host data, iterate over ports/banners, create one item per service. Handle empty or error responses gracefully.  
   - Connect output of "Shodan Search by IP" to this node.  
   - Also connect "false" output of "Filter: Only IP records1" here to cover non-IP DNS records fallback.  

10. **Create Google Sheets Node to Log Results**  
    - Name: "Log to Google Sheets1"  
    - Operation: Append rows  
    - Configure with Google Sheets credentials, select spreadsheet and worksheet.  
    - Connect output of "Parse Shodan Data" and also "Extract DNS Records1" to this node to log both DNS and Shodan data.  

11. **Create Set Node for Console Notification**  
    - Name: "Notify: Results (console log)"  
    - Purpose: Prepare a summary message or log data for console output.  
    - Connect output of "Log to Google Sheets1" and "Set Target Domain1" to this node.  

12. **Create NoOp Node for Error Handling**  
    - Name: "Error Handler (catch)"  
    - Connect error outputs from nodes prone to errors: "Shodan Search by IP", "Parse Shodan Data", "Set Target Domain1".  

13. **Add Sticky Notes for Documentation**  
    - Add sticky notes with descriptions for blocks: input, DNS lookup, filtering, rate-limiting, parsing, logging, and error handling.  
    - Place them near corresponding nodes for clarity.  

14. **Test the Workflow**  
    - Manually trigger workflow.  
    - Verify domain is set.  
    - Confirm DNS records are fetched and processed.  
    - Validate IPs are filtered and queried via Shodan respecting rate limits.  
    - Check Google Sheets for appended results and console logs for output.  
    - Confirm errors are caught without workflow interruption.  

---

### 5. General Notes & Resources

| Note Content                                                                                                                         | Context or Link                                                                                  |
|--------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Shodan free-tier API rate limit is respected by a 10-second delay between queries.                                                   | Rate-limit before Shodan sticky note explanation                                               |
| Google DNS API is used to retrieve DNS records; ensure network access and valid domain input.                                        | DNS Lookup (Google) sticky note                                                                |
| Google Sheets node requires proper OAuth2 credentials with write permissions for appending data.                                     | Log to Google Sheets1 node                                                                     |
| For detailed Shodan API documentation and API key registration: https://developer.shodan.io/api                                        | Relevant to Shodan Search by IP node                                                           |
| Workflow is designed to be modular and robust with error handling to avoid termination on API or network failures.                   | Error catcher and Error Handler (catch) nodes                                                  |
| Consider extending workflow to handle pagination or additional Shodan query parameters if needed for large scopes or complex domains. | Potential workflow enhancement                                                                 |

---

**Disclaimer:** This document is generated from an n8n workflow automation. It complies with content policies and contains only legal, public, and non-offensive data processing.