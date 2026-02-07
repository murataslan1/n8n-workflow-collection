Analyze Email Headers for IP Reputation and Spoofing Detection - Gmail

https://n8nworkflows.xyz/workflows/analyze-email-headers-for-ip-reputation-and-spoofing-detection---gmail-2677


# Analyze Email Headers for IP Reputation and Spoofing Detection - Gmail

### 1. Workflow Overview

This workflow automates the security analysis of Gmail email headers to detect IP reputations, spoofing attempts, and authentication compliance (SPF, DKIM, DMARC). Its primary use case is to assist IT professionals and security analysts by providing detailed email origin and sender reputation insights. The workflow is modular, structured into logical blocks that correspond to stages in the processing pipeline:

- **1.1 Input Reception and Header Extraction:** Receives emails either via Gmail Trigger (for testing) or a Webhook (for production), and extracts email headers.
- **1.2 IP Address Extraction and Analysis:** Isolates the originating IP address from the email's "Received" headers and queries external IP reputation and geolocation services.
- **1.3 Authentication Header Detection and Parsing:** Checks for SPF, DKIM, and DMARC headers and extracts their respective authentication results.
- **1.4 Authentication Result Evaluation:** Processes the extracted authentication results to determine pass/fail/unknown statuses.
- **1.5 Consolidation and Output Formatting:** Merges all gathered data into a structured JSON response and sends it via webhook response for downstream consumption.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Input Reception and Header Extraction

**Overview:**  
This block initiates the workflow by receiving email data and standardizing the email headers for processing.

**Nodes Involved:**  
- Gmail Trigger (disabled by default, for testing)  
- Gmail Webhook  
- Set Gmail Webhook Headers Here  
- Set Gmail Headers Here  
- Gmail - Set Headers  
- Gmail - Extract Received Headers  
- Gmail - Remove Extra Received Headers  

**Node Details:**  

- **Gmail Trigger**  
  - Type: Trigger node for Gmail  
  - Role: Monitors Gmail inbox for new emails (disabled by default, used for testing)  
  - Config: Polls every minute; uses Gmail OAuth2 credentials  
  - Outputs: Raw Gmail email data including headers  
  - Edge Cases: Authentication errors with Gmail OAuth2; polling delays; disabled by default to avoid unintended triggers  

- **Gmail Webhook**  
  - Type: Webhook trigger  
  - Role: Receives HTTP POST requests containing email data for production use  
  - Config: HTTP POST at path `fb37cff7-b543-45f0-922d-4e0edcae5e43`, responds via response node  
  - Outputs: Incoming payload with email headers in body  
  - Edge Cases: Webhook only active if workflow is active; malformed payloads; authentication not handled here  

- **Set Gmail Webhook Headers Here**  
  - Type: Set node  
  - Role: Extracts `headers` object from webhook payload body and assigns it to JSON field `headers`  
  - Config: Assigns `headers` from `$json.body.headers`  
  - Input: Webhook data  
  - Output: Standardized header object for downstream nodes  

- **Set Gmail Headers Here**  
  - Type: Set node  
  - Role: Copies email headers from Gmail Trigger output into standardized `headers` field  
  - Config: Assigns `headers` from `$json.headers`  
  - Input: Gmail Trigger output  
  - Output: Standardized header object  

- **Gmail - Set Headers**  
  - Type: Set node  
  - Role: Pass-through node, includes all fields and prepares headers for extraction  
  - Config: Includes all other fields, keeps `headers` object  
  - Input: Set Gmail Webhook Headers Here or Set Gmail Headers Here  
  - Output: Prepared headers for extraction  

- **Gmail - Extract Received Headers**  
  - Type: Code node (JavaScript)  
  - Role: Filters all headers to extract those with the key "Received" (case-insensitive)  
  - Key Expressions: Uses Object.entries, filters for keys equal to "received" (case-insensitive), returns each header as separate JSON item  
  - Input: Headers object  
  - Output: Array of "Received" headers as individual items  
  - Edge Cases: Missing or malformed headers; case sensitivity handled  

- **Gmail - Remove Extra Received Headers**  
  - Type: Limit node  
  - Role: Keeps only the last (most recent) "Received" header, which usually contains the originating IP  
  - Config: Keeps only last item  
  - Input: Multiple Received headers  
  - Output: Single "Received" header item  

---

#### 1.2 IP Address Extraction and Analysis

**Overview:**  
This block extracts the originating IP address from the most recent Received header and performs reputation and geolocation lookups using external APIs.

**Nodes Involved:**  
- Gmail - Extract Original From IP  
- Gmail - Original IP Found?  
- Gmail - Query IP Quality Score API  
- Gmail - Query IP API  
- Skip IP Check (NoOp node)  

**Node Details:**  

- **Gmail - Extract Original From IP**  
  - Type: Set node  
  - Role: Applies a complex regular expression to extract the first public IPv4 or IPv6 address from the Received header, excluding private/internal IPs  
  - Key Expression: Regex removes private IP ranges (127.*, 10.*, 172.16-31.*, 192.168.*), then matches IP pattern (IPv4 or IPv6)  
  - Input: Last Received header value  
  - Output: Single extracted IP string in `extractedfromip`  
  - Edge Cases: Missing or malformed IP; no public IP present returns null  

- **Gmail - Original IP Found?**  
  - Type: If node  
  - Role: Checks if `extractedfromip` is non-empty (boolean) to determine if IP analysis should proceed  
  - Input: Extracted IP from previous node  
  - Output: True branch continues to IP quality and geolocation queries; False branch skips IP check  
  - Edge Cases: Empty or null IP leads to skipping IP analysis  

- **Gmail - Query IP Quality Score API**  
  - Type: HTTP Request node  
  - Role: Calls IPQualityScore API with extracted IP to get reputation and fraud score data  
  - Config: URL templated with IP; includes query parameters for strictness and access point allowance  
  - Input: IP from Extract Original From IP node  
  - Output: JSON with IP fraud score and related metadata  
  - Requirements: Valid API key configured in URL  
  - Edge Cases: API request failures, rate limits, invalid IP  

- **Gmail - Query IP API**  
  - Type: HTTP Request node  
  - Role: Queries IP-API.com for geolocation and organization info of the IP  
  - Config: URL templated with extracted IP  
  - Output: JSON with org, city, country, etc.  
  - Edge Cases: API downtime, malformed IPs, rate limiting  

- **Skip IP Check**  
  - Type: NoOp node  
  - Role: Placeholder to continue workflow when no valid IP is found  
  - Output: Passes flow to Authentication-Results check  

---

#### 1.3 Authentication Header Detection and Parsing

**Overview:**  
This block detects the presence of authentication-related headers (Authentication-Results, Received-SPF, DKIM-Signature, DMARC) and extracts their raw values for further evaluation.

**Nodes Involved:**  
- Gmail - Authentication-Results Header?  
- Gmail - Extract Authentication-Results Header  
- Gmail - Received-SPF Header?  
- Gmail - Extract Received-SPF Header  
- Aggregate Received-SPF Headers1  
- Gmail - Set SPF Value  
- Gmail - No SPF Found  
- Gmail - DKIM-Signature Header?  
- Gmail - DKIM Signature Found  
- Gmail - No DKIM Signature Found  
- Gmail - DMARC Header?  
- Gmail - Extract DMARC Header  
- Gmail - Set DMARC Value  
- Gmail - No DMARC Header  

**Node Details:**  

- **Gmail - Authentication-Results Header?**  
  - Type: If node  
  - Role: Checks if headers include at least one "Authentication-Results" header  
  - Input: Headers object  
  - Output: True branch extracts Authentication-Results; False branch proceeds to SPF, DKIM, DMARC checks  

- **Gmail - Extract Authentication-Results Header**  
  - Type: Code node  
  - Role: Extracts all "Authentication-Results" headers from headers object similarly to Received headers extraction  
  - Output: Array of Authentication-Results header entries  

- **Gmail - Received-SPF Header?**  
  - Type: If node  
  - Role: Checks for presence of "Received-SPF" header  
  - Output: Branches into extraction or no-SPF-found handling  

- **Gmail - Extract Received-SPF Header**  
  - Type: Code node  
  - Role: Extracts all "Received-SPF" headers for further aggregation  

- **Aggregate Received-SPF Headers1**  
  - Type: Aggregate node  
  - Role: Aggregates all Received-SPF header data into a single array  

- **Gmail - Set SPF Value**  
  - Type: Set node  
  - Role: Determines SPF pass/fail/unknown from last Received-SPF header's value  

- **Gmail - No SPF Found**  
  - Type: Set node  
  - Role: Sets SPF status to "not found" when no header is present  

- **Gmail - DKIM-Signature Header?**  
  - Type: If node  
  - Role: Checks for presence of "DKIM-Signature" header  

- **Gmail - DKIM Signature Found**  
  - Type: Set node  
  - Role: Sets DKIM status to "found" if header is present  

- **Gmail - No DKIM Signature Found**  
  - Type: Set node  
  - Role: Sets DKIM status to "not found" if header absent  

- **Gmail - DMARC Header?**  
  - Type: If node  
  - Role: Checks for presence of "DMARC" header  

- **Gmail - Extract DMARC Header**  
  - Type: Code node  
  - Role: Extracts "DMARC" headers from headers object  

- **Gmail - Set DMARC Value**  
  - Type: Set node  
  - Role: Sets DMARC pass/fail/unknown value from header content  

- **Gmail - No DMARC Header**  
  - Type: Set node  
  - Role: Sets DMARC status to "not found" if header missing  

---

#### 1.4 Authentication Result Evaluation

**Overview:**  
This block interprets the raw authentication headers to set meaningful pass/fail/neutral/unknown/error statuses for SPF, DKIM, and DMARC.

**Nodes Involved:**  
- Gmail - Determine Auth Values  
- Format Combined Auth Output1  

**Node Details:**  

- **Gmail - Determine Auth Values**  
  - Type: Set node  
  - Role: Uses conditional expressions on extracted header values to categorize SPF, DKIM, and DMARC results into normalized statuses such as "pass", "fail", "neutral", "error", or "unknown"  
  - Input: Authentication-Results header entries  
  - Output: JSON with `spfvalue`, `dkimvalue`, `dmarcvalue` fields  

- **Format Combined Auth Output1**  
  - Type: Set node  
  - Role: Combines authentication results with IP and reputation data into a single structured object for final output  
  - Fields: SPF, DKIM, DMARC statuses, originating IP, IP organization, country, city, recent spam activity, and sender reputation rating  

---

#### 1.5 Consolidation and Output Formatting

**Overview:**  
This final block merges all authentication and IP analysis results, formats the output, and responds to the webhook request.

**Nodes Involved:**  
- Gmail - Received-SPF Header? (branching)  
- Gmail - Merge  
- Gmail - Aggregate  
- Format Individual Auth Outputs1  
- Gmail - Format Output  
- Gmail - Respond to Webhook  

**Node Details:**  

- **Gmail - Merge**  
  - Type: Merge node  
  - Role: Combines three input streams corresponding to SPF, DKIM, and DMARC analyses into a consolidated dataset  

- **Gmail - Aggregate**  
  - Type: Aggregate node  
  - Role: Aggregates merged data into a single JSON object  

- **Format Individual Auth Outputs1**  
  - Type: Set node  
  - Role: Formats individual authentication outputs with metadata fields such as IP reputation and geographic info for enhanced readability  

- **Gmail - Format Output**  
  - Type: Set node  
  - Role: Finalizes the structure and includes all relevant fields for the webhook response  

- **Gmail - Respond to Webhook**  
  - Type: Respond to Webhook node  
  - Role: Sends aggregated analysis as JSON response to the requesting client or platform  
  - Requirements: Workflow must be active for webhook response to work  
  - Edge Cases: Timeout or large payloads may cause failures; client connectivity issues  

---

### 3. Summary Table

| Node Name                         | Node Type               | Functional Role                                    | Input Node(s)                           | Output Node(s)                           | Sticky Note                                                                                     |
|----------------------------------|-------------------------|---------------------------------------------------|---------------------------------------|-----------------------------------------|------------------------------------------------------------------------------------------------|
| Gmail Trigger                    | Gmail Trigger           | Test trigger for new Gmail emails                  | None                                  | Set Gmail Headers Here                   | Testing Email Header Analysis Workflow (Testing section)                                       |
| Set Gmail Headers Here           | Set                     | Extracts headers from Gmail Trigger output         | Gmail Trigger                        | Gmail - Set Headers                      | Testing Email Header Analysis Workflow                                                        |
| Gmail - Set Headers              | Set                     | Pass-through node to prepare headers               | Set Gmail Headers Here or Set Gmail Webhook Headers Here | Gmail - Extract Received Headers         | Extract and Process Email Headers                                                             |
| Gmail - Extract Received Headers | Code                    | Extracts all "Received" headers                     | Gmail - Set Headers                   | Gmail - Remove Extra Received Headers    | Extract and Process Email Headers                                                             |
| Gmail - Remove Extra Received Headers | Limit                | Keeps only the last Received header                 | Gmail - Extract Received Headers     | Gmail - Extract Original From IP         | Extract and Process Email Headers                                                             |
| Gmail - Extract Original From IP | Set                     | Extracts originating IP from last Received header  | Gmail - Remove Extra Received Headers | Gmail - Original IP Found?               | Analyze IP Address and Check Authentication Results                                            |
| Gmail - Original IP Found?       | If                      | Checks if extracted IP is present                   | Gmail - Extract Original From IP      | Gmail - Query IP Quality Score API (true), Skip IP Check (false) | Analyze IP Address and Check Authentication Results                                            |
| Skip IP Check                   | NoOp                    | Placeholder to skip IP check                         | Gmail - Original IP Found? (false)    | Gmail - Authentication-Results Header?  | Analyze IP Address and Check Authentication Results                                            |
| Gmail - Query IP Quality Score API | HTTP Request          | Fetches IP reputation and fraud score               | Gmail - Original IP Found? (true)     | Gmail - Query IP API                     | Analyze IP Address and Check Authentication Results                                            |
| Gmail - Query IP API             | HTTP Request            | Fetches IP geolocation and organization info       | Gmail - Query IP Quality Score API    | Gmail - Authentication-Results Header?  | Analyze IP Address and Check Authentication Results                                            |
| Gmail - Authentication-Results Header? | If                 | Checks if Authentication-Results header exists     | Gmail - Query IP API or Skip IP Check | Gmail - Extract Authentication-Results Header (true), Gmail - Received-SPF Header? (false) | Analyze IP Address and Check Authentication Results                                            |
| Gmail - Extract Authentication-Results Header | Code           | Extracts Authentication-Results headers             | Gmail - Authentication-Results Header? (true) | Gmail - Determine Auth Values           | Extract and Evaluate Authentication Results                                                    |
| Gmail - Determine Auth Values    | Set                     | Parses SPF, DKIM, DMARC pass/fail statuses          | Gmail - Extract Authentication-Results Header | Format Combined Auth Output1             | Extract and Evaluate Authentication Results                                                    |
| Gmail - Received-SPF Header?     | If                      | Checks for Received-SPF header presence              | Gmail - Authentication-Results Header? (false) | Gmail - Extract Received-SPF Header (true), Gmail - No SPF Found (false) | Evaluate SPF, DKIM, and DMARC Compliance                                                      |
| Gmail - Extract Received-SPF Header | Code                  | Extracts Received-SPF headers                        | Gmail - Received-SPF Header? (true)   | Aggregate Received-SPF Headers1          | Evaluate SPF, DKIM, and DMARC Compliance                                                      |
| Aggregate Received-SPF Headers1  | Aggregate               | Aggregates all Received-SPF headers                  | Gmail - Extract Received-SPF Header   | Gmail - Set SPF Value                    | Evaluate SPF, DKIM, and DMARC Compliance                                                      |
| Gmail - Set SPF Value            | Set                     | Determines SPF pass/fail/unknown status              | Aggregate Received-SPF Headers1       | Gmail - Merge                           | Evaluate SPF, DKIM, and DMARC Compliance                                                      |
| Gmail - No SPF Found             | Set                     | Sets SPF value to "not found" if no SPF header      | Gmail - Received-SPF Header? (false) | Gmail - Merge                           | Evaluate SPF, DKIM, and DMARC Compliance                                                      |
| Gmail - DKIM-Signature Header?   | If                      | Checks for DKIM-Signature header presence            | Gmail - Authentication-Results Header? (false) | Gmail - DKIM Signature Found (true), Gmail - No DKIM Signature Found (false) | Evaluate SPF, DKIM, and DMARC Compliance                                                      |
| Gmail - DKIM Signature Found     | Set                     | Sets DKIM status to "found"                          | Gmail - DKIM-Signature Header? (true) | Gmail - Merge                           | Evaluate SPF, DKIM, and DMARC Compliance                                                      |
| Gmail - No DKIM Signature Found  | Set                     | Sets DKIM status to "not found"                      | Gmail - DKIM-Signature Header? (false) | Gmail - Merge                           | Evaluate SPF, DKIM, and DMARC Compliance                                                      |
| Gmail - DMARC Header?            | If                      | Checks for DMARC header presence                      | Gmail - Authentication-Results Header? (false) | Gmail - Extract DMARC Header (true), Gmail - No DMARC Header (false) | Evaluate SPF, DKIM, and DMARC Compliance                                                      |
| Gmail - Extract DMARC Header     | Code                    | Extracts DMARC headers                                | Gmail - DMARC Header? (true)          | Gmail - Set DMARC Value                  | Evaluate SPF, DKIM, and DMARC Compliance                                                      |
| Gmail - Set DMARC Value          | Set                     | Sets DMARC pass/fail/unknown status                   | Gmail - Extract DMARC Header          | Gmail - Merge                           | Evaluate SPF, DKIM, and DMARC Compliance                                                      |
| Gmail - No DMARC Header          | Set                     | Sets DMARC status to "not found"                      | Gmail - DMARC Header? (false)         | Gmail - Merge                           | Evaluate SPF, DKIM, and DMARC Compliance                                                      |
| Gmail - Merge                   | Merge                   | Merges SPF, DKIM, and DMARC results                   | Gmail - Set SPF Value, Gmail - DKIM Signature Found/No DKIM Signature Found, Gmail - Set DMARC Value/No DMARC Header | Gmail - Aggregate                      | Combine Results and Respond to Webhook                                                        |
| Gmail - Aggregate               | Aggregate                | Aggregates merged results into single object          | Gmail - Merge                        | Format Individual Auth Outputs1          | Combine Results and Respond to Webhook                                                        |
| Format Individual Auth Outputs1 | Set                     | Formats individual authentication outputs with metadata | Gmail - Aggregate                   | Gmail - Format Output                    | Combine Results and Respond to Webhook                                                        |
| Format Combined Auth Output1     | Set                     | Formats combined authentication and IP reputation data | Gmail - Determine Auth Values        | Gmail - Format Output                    | Combine Results and Respond to Webhook                                                        |
| Gmail - Format Output            | Set                     | Finalizes response structure                           | Format Individual Auth Outputs1, Format Combined Auth Output1 | Gmail - Respond to Webhook               | Combine Results and Respond to Webhook                                                        |
| Gmail - Respond to Webhook      | Respond to Webhook       | Sends JSON response to webhook request                 | Gmail - Format Output                 | None                                    | Combine Results and Respond to Webhook                                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Gmail Trigger node (optional for testing):**  
   - Type: Gmail Trigger  
   - Credentials: Set Gmail OAuth2 credentials  
   - Poll Mode: Every minute  
   - Disabled by default to avoid unintended triggers  

2. **Create Gmail Webhook node for production:**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Unique, e.g., `fb37cff7-b543-45f0-922d-4e0edcae5e43`  
   - Response Mode: Response Node  

3. **Set Gmail Webhook Headers Here (Set node):**  
   - Assign `headers` field from incoming webhook payload at `$json.body.headers`  

4. **Set Gmail Headers Here (Set node):**  
   - Assign `headers` field from `$json.headers` (Gmail Trigger output)  

5. **Gmail - Set Headers (Set node):**  
   - Include all other fields, keep `headers` object intact  

6. **Gmail - Extract Received Headers (Code node):**  
   - JavaScript to filter headers keys equal to "received" (case-insensitive) and return as array of objects  

7. **Gmail - Remove Extra Received Headers (Limit node):**  
   - Keep only last item (most recent "Received" header)  

8. **Gmail - Extract Original From IP (Set node):**  
   - Use regex to remove private IPs and extract first public IPv4 or IPv6 address from Received header value  
   - Store result in `extractedfromip`  

9. **Gmail - Original IP Found? (If node):**  
   - Condition: `extractedfromip` not empty (boolean true)  
   - True branch: continue to IP reputation queries  
   - False branch: skip IP check  

10. **Gmail - Query IP Quality Score API (HTTP Request):**  
    - URL: `https://ipqualityscore.com/api/json/ip/<<API_KEY>>/{{extractedfromip}}?strictness=1&allow_public_access_points=true&lighter_penalties=true`  
    - Replace `<<API_KEY>>` with your IPQualityScore API key  

11. **Gmail - Query IP API (HTTP Request):**  
    - URL: `http://ip-api.com/json/{{extractedfromip}}`  

12. **Skip IP Check (NoOp node):**  
    - Pass-through node for false branch of IP found condition  

13. **Gmail - Authentication-Results Header? (If node):**  
    - Checks if any header key equals "authentication-results" (case-insensitive) and is non-empty  

14. **Gmail - Extract Authentication-Results Header (Code node):**  
    - Extract all "Authentication-Results" headers as array  

15. **Gmail - Determine Auth Values (Set node):**  
    - Evaluate SPF, DKIM, DMARC statuses from extracted Authentication-Results header strings using conditional expressions (pass/fail/neutral/error/unknown)  

16. **Gmail - Received-SPF Header? (If node):**  
    - Checks presence of "Received-SPF" headers in headers object  

17. **Gmail - Extract Received-SPF Header (Code node):**  
    - Extract all "Received-SPF" headers as array  

18. **Aggregate Received-SPF Headers1 (Aggregate node):**  
    - Aggregate all SPF headers into single dataset  

19. **Gmail - Set SPF Value (Set node):**  
    - Determine SPF pass/fail/unknown based on last SPF header value content  

20. **Gmail - No SPF Found (Set node):**  
    - Sets SPF value to "not found" if SPF header missing  

21. **Gmail - DKIM-Signature Header? (If node):**  
    - Checks for DKIM-Signature header presence  

22. **Gmail - DKIM Signature Found (Set node):**  
    - Sets DKIM status to "found"  

23. **Gmail - No DKIM Signature Found (Set node):**  
    - Sets DKIM status to "not found"  

24. **Gmail - DMARC Header? (If node):**  
    - Checks for DMARC header presence  

25. **Gmail - Extract DMARC Header (Code node):**  
    - Extract DMARC headers as array  

26. **Gmail - Set DMARC Value (Set node):**  
    - Sets DMARC pass/fail/unknown based on header values  

27. **Gmail - No DMARC Header (Set node):**  
    - Sets DMARC status to "not found"  

28. **Gmail - Merge (Merge node):**  
    - Merge SPF, DKIM, and DMARC result streams into one  

29. **Gmail - Aggregate (Aggregate node):**  
    - Aggregate merged data into one item  

30. **Format Individual Auth Outputs1 (Set node):**  
    - Format fields: spf, dkim, dmarc, initialIP, organization, country, city, recentSpamActivity, ipSenderReputation  
    - Uses fraud_score thresholds from IPQualityScore API for spam activity and reputation labels  

31. **Format Combined Auth Output1 (Set node):**  
    - Similar formatting to above, combines authentication results with IP metadata  

32. **Gmail - Format Output (Set node):**  
    - Finalizes output JSON structure for webhook response  

33. **Gmail - Respond to Webhook (Respond to Webhook node):**  
    - Sends final JSON response to webhook caller  
    - Workflow must be active for webhook response to work  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                      | Context or Link                                                                                                           |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| ![](https://uploads.n8n.io/templates/gmaillogo.png)  Testing Email Header Analysis Workflow: Tests email header extraction from Gmail Trigger before production deployment.                                                                                         | Sticky Note on Gmail Trigger and Set Headers nodes                                                                       |
| ![](https://uploads.n8n.io/templates/n8n.png)  Extract and Process Email Headers: Focuses on extracting "Received" headers and isolating the originating IP address.                                                                                                | Sticky Note on Gmail - Set Headers, Extract Received Headers, Remove Extra Received Headers, Extract Original From IP nodes |
| ![](https://uploads.n8n.io/templates/ipqualityscoretemplate.png)  Analyze IP Address and Check Authentication Results: Covers IP reputation lookups and presence check for authentication headers.                                                               | Sticky Note covering IP analysis nodes and Authentication-Results Header? node                                            |
| ![](https://uploads.n8n.io/templates/n8n.png)  Extract and Evaluate Authentication Results: Parses SPF, DKIM, DMARC results into pass/fail/unknown states and combines with IP metadata.                                                                             | Sticky Note on Authentication Results extraction and Determine Auth Values nodes                                          |
| ![](https://uploads.n8n.io/templates/n8n.png)  Evaluate SPF, DKIM, and DMARC Compliance: Detailed presence checks and extraction of respective authentication headers, including fallback for missing headers.                                                     | Sticky Note on SPF, DKIM, DMARC header presence and extraction nodes                                                     |
| ![](https://uploads.n8n.io/templates/n8n.png)  Combine Results and Respond to Webhook: Merges all authentication and IP reputation data, formats output, and responds to webhook requests for integration with external platforms.                                  | Sticky Note covering final merge, aggregate, formatting, and respond to webhook nodes                                     |
| ![](https://uploads.n8n.io/templates/n8n.png)  Webhook Integration for Production: Describes activating the workflow to respond to third-party platform requests via webhook and properly formatting incoming data for analysis.                                    | Sticky Note on Gmail Webhook and Set Gmail Webhook Headers Here nodes                                                    |
| IPQualityScore API provides limited free lookups monthly. More details and pricing at https://www.ipqualityscore.com/plans                                                                                                                                      | API key setup note                                                                                                        |
| IP-API.com is a free service used for IP geolocation enrichment; ensure endpoint accessibility and monitor usage limits                                                                                                                                        | Related to IP query node                                                                                                |

---

This completes the comprehensive structured reference for the "Analyze Email Headers for IP Reputation and Spoofing Detection - Gmail" n8n workflow.