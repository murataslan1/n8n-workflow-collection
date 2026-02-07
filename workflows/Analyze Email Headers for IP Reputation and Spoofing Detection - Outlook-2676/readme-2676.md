Analyze Email Headers for IP Reputation and Spoofing Detection - Outlook

https://n8nworkflows.xyz/workflows/analyze-email-headers-for-ip-reputation-and-spoofing-detection---outlook-2676


# Analyze Email Headers for IP Reputation and Spoofing Detection - Outlook

### 1. Workflow Overview

This n8n workflow automates the analysis of email headers to detect IP reputation and potential spoofing in emails received via Microsoft Outlook or through webhook input. It is designed primarily for security and IT operations teams to help identify phishing, spam, and compromised accounts by validating email authentication headers (SPF, DKIM, DMARC) and assessing the originating IP address reputation.

The workflow is logically divided into the following blocks:

- **1.1 Email Input Reception:**  
  Handles incoming emails either by polling an Outlook mailbox folder or receiving email header data via a webhook from third-party platforms.

- **1.2 Email Header Extraction and Processing:**  
  Extracts and organizes email headers, focusing on "Received" headers to identify the original sender IP.

- **1.3 IP Reputation Analysis:**  
  Queries external APIs (IP Quality Score and IP-API) to assess the reputation and geo-information of the originating IP address.

- **1.4 Email Authentication Header Validation:**  
  Checks for the presence of key authentication headers (Authentication-Results, Received-SPF, DKIM-Signature, DMARC), extracts their values, and evaluates the authentication results.

- **1.5 Data Aggregation and Output Formatting:**  
  Merges all authentication and IP reputation data, formats it into a consolidated output, and sends the results back via a webhook response.

---

### 2. Block-by-Block Analysis

#### 2.1 Email Input Reception

- **Overview:**  
  This block acquires email data either from Microsoft Outlook through polling or from an external system via a webhook. It prepares the email headers for subsequent processing.

- **Nodes Involved:**  
  - Trigger on New Email  
  - Retrieve Headers of Email  
  - Set Headers Here  
  - Webhook1  
  - Set Webhook Headers Here  

- **Node Details:**

  - **Trigger on New Email**  
    - Type: Microsoft Outlook Trigger  
    - Role: Polls a specified Outlook folder every minute for new emails.  
    - Configuration: Monitors a specific Outlook folder by its ID; OAuth2 credentials configured for Outlook access.  
    - Input: Outlook mailbox new email event.  
    - Output: Raw email JSON including message ID.  
    - Edge Cases: Disabled by default; if activated, must ensure credentials and folder ID are correct. Possible API rate limits or auth errors.  
    - Sticky Note: Explains testing usage for this node and the initial retrieval of email headers.

  - **Retrieve Headers of Email**  
    - Type: HTTP Request  
    - Role: Uses Microsoft Graph API to fetch detailed internetMessageHeaders for the given email ID.  
    - Configuration: GET request to `https://graph.microsoft.com/v1.0/me/messages/{{ $json.id }}?$select=internetMessageHeaders`, uses Outlook OAuth2 credentials.  
    - Input: Email message ID from the trigger node.  
    - Output: JSON containing email headers.  
    - Edge Cases: API failures, missing permissions, or invalid tokens may cause errors.  
    - Version: Uses HTTP Request node v4.2 for enhanced features.

  - **Set Headers Here**  
    - Type: Set  
    - Role: Extracts the `internetMessageHeaders` array from the previous node’s JSON into a standardized `headers` field.  
    - Input: JSON with `internetMessageHeaders`.  
    - Output: JSON with `headers` array for easier downstream processing.  
    - Edge Cases: Null or empty headers array.  
    - Sticky Note: Explains the processing and extraction of headers for further steps.

  - **Webhook1**  
    - Type: Webhook  
    - Role: Listens for incoming POST requests with email data from external systems.  
    - Configuration: POST method, webhook path set, responseMode set to respond with a node.  
    - Input: HTTP POST request containing email headers and data.  
    - Output: JSON with raw webhook payload.  
    - Edge Cases: Requires active workflow to respond; invalid payloads or missing headers may cause failure.  
    - Sticky Note: Describes production use of webhook for integration with third-party platforms.

  - **Set Webhook Headers Here**  
    - Type: Set  
    - Role: Extracts the `headers` array from the webhook payload body into the standardized `headers` field.  
    - Input: JSON from Webhook1 node.  
    - Output: JSON with `headers` array.  
    - Edge Cases: Payload without expected structure; missing `headers` field.  
    - Sticky Note: Part of webhook production flow.

---

#### 2.2 Email Header Extraction and Processing

- **Overview:**  
  Processes the extracted headers to isolate the relevant "Received" headers to determine the original sender's IP address by filtering and cleaning header data.

- **Nodes Involved:**  
  - Set Headers  
  - Extract Received Headers  
  - Remove Extra Received Headers  
  - Extract Original From IP  
  - Original IP Found?  
  - No Operation, do nothing  

- **Node Details:**

  - **Set Headers**  
    - Type: Set  
    - Role: Passes the standardized `headers` array for processing.  
    - Input: JSON with `headers` array.  
    - Output: Same with headers intact.  
    - Edge Cases: Empty or malformed headers.

  - **Extract Received Headers**  
    - Type: Code  
    - Role: Filters the `headers` array to keep only headers named "Received".  
    - Key Expression: Filters `headers` where `header.name === "Received"`.  
    - Input: JSON with headers array.  
    - Output: Array of "Received" headers.  
    - Edge Cases: No "Received" headers present.

  - **Remove Extra Received Headers**  
    - Type: Limit  
    - Role: Keeps only the last (most recent) "Received" header, which typically contains the original sender IP.  
    - Input: Array of "Received" headers.  
    - Output: Single "Received" header item.  

  - **Extract Original From IP**  
    - Type: Set  
    - Role: Uses a complex regular expression to extract the original external IP address from the "Received" header value, excluding private/internal IP ranges (e.g., 127.x.x.x, 10.x.x.x, 192.168.x.x).  
    - Key Expression: Regex applied on the header value to find IPv4 or IPv6 addresses excluding private IPs.  
    - Output Field: `extractedfromip` string containing the detected IP or undefined if none found.  
    - Edge Cases: Absence of valid public IP in header, regex matching failures.

  - **Original IP Found?**  
    - Type: If  
    - Role: Checks if `extractedfromip` is not empty or null.  
    - Condition: Boolean check on `extractedfromip`.  
    - True Branch: Continue to IP reputation queries.  
    - False Branch: Trigger `No Operation, do nothing` node to halt further processing.  
    - Edge Cases: IP extraction failures or missing IP.

  - **No Operation, do nothing**  
    - Type: NoOp  
    - Role: Placeholder node to stop processing if no valid IP is found.  
    - Output: Passes input unchanged.  

- **Sticky Note:**  
  Explains the focus on extracting the originating IP address by filtering and processing "Received" headers and cleaning out internal IPs.

---

#### 2.3 IP Reputation Analysis

- **Overview:**  
  Queries external APIs to assess the reputation and geographical information of the extracted originating IP address.

- **Nodes Involved:**  
  - Query IP Quality Score API  
  - Query IP API  
  - Authentication-Results Header?  

- **Node Details:**

  - **Query IP Quality Score API**  
    - Type: HTTP Request  
    - Role: Calls IPQualityScore API with the extracted IP to retrieve reputation data including fraud score and spam activity.  
    - URL Template: `https://ipqualityscore.com/api/json/ip/API_KEY/{{ extractedfromip }}?strictness=1&allow_public_access_points=true&lighter_penalties=true`  
    - Input: Extracted IP from previous node.  
    - Output: JSON with reputation metrics (fraud_score, etc.).  
    - Edge Cases: API key rate limits, network errors, invalid IPs.

  - **Query IP API**  
    - Type: HTTP Request  
    - Role: Requests geo and organization info about the IP from ip-api.com.  
    - URL Template: `http://ip-api.com/json/{{ extractedfromip }}`  
    - Input: Extracted IP.  
    - Output: JSON with fields like `org`, `country`, `city`.  
    - Edge Cases: Rate limits, API downtime.

  - **Authentication-Results Header?**  
    - Type: If  
    - Role: Checks if the "Authentication-Results" header exists in the headers array.  
    - Condition: Checks presence of header named "Authentication-Results".  
    - True Branch: Proceed to extract and evaluate authentication results.  
    - False Branch: Proceed to check other authentication headers (Received-SPF, DKIM-Signature, DMARC).  
    - Edge Cases: Header missing or malformed.

- **Sticky Note:**  
  Describes the API-based IP reputation checks and validation of presence of Authentication-Results header before further processing.

---

#### 2.4 Email Authentication Header Validation

- **Overview:**  
  Validates the presence and evaluates the content of SPF, DKIM, and DMARC authentication headers to understand email legitimacy.

- **Nodes Involved:**  
  - Extract Authentication-Results Header  
  - Determine Auth Values  
  - Format Combined Auth Output  
  - Received-SPF Header?  
  - Extract Received-SPF Header  
  - Aggregate Received-SPF Headers  
  - Set SPF Value  
  - No SPF Found  
  - DKIM-Signature Header?  
  - DKIM Signature Found  
  - No DKIM Signature Found  
  - DMARC Header?  
  - Extract DMARC Header  
  - Set DMARC Value  
  - No DMARC Header  

- **Node Details:**

  - **Extract Authentication-Results Header**  
    - Type: Code  
    - Role: Filters headers to isolate the "Authentication-Results" header only.  
    - Input: Headers array.  
    - Output: Array of "Authentication-Results" headers.  
    - Edge Cases: Multiple headers, empty result.

  - **Determine Auth Values**  
    - Type: Set  
    - Role: Parses the extracted "Authentication-Results" header content to set string variables `spfvalue`, `dkimvalue`, `dmarcvalue` based on presence of keywords like "pass", "fail", "temperror", or "neutral".  
    - Logic: Uses case-insensitive substring matching within the header value.  
    - Output: Authentication status strings for SPF, DKIM, DMARC.  
    - Edge Cases: Unknown or malformed header content.

  - **Format Combined Auth Output**  
    - Type: Set  
    - Role: Aggregates authentication values with IP info and reputation data into a composite JSON object.  
    - Fields Included: `spf`, `dkim`, `dmarc`, `initialIP`, `organization`, `country`, `city`, `recentSpamActivity`, `ipSenderReputation`.  
    - Edge Cases: Missing values replaced with default strings.

  - **Received-SPF Header?**  
    - Type: If  
    - Role: Checks for presence of "Received-SPF" header in the email headers.  
    - True Branch: Extract and aggregate SPF headers.  
    - False Branch: Set SPF as "not found".  

  - **Extract Received-SPF Header**  
    - Type: Code  
    - Role: Filters headers to extract all "Received-SPF" headers.  

  - **Aggregate Received-SPF Headers**  
    - Type: Aggregate  
    - Role: Aggregates all SPF header data into a single dataset for analysis.

  - **Set SPF Value**  
    - Type: Set  
    - Role: Analyzes aggregated SPF data and sets `spfvalue` to "pass", "fail", or "unknown" based on the last header's value.

  - **No SPF Found**  
    - Type: Set  
    - Role: Sets `spfvalue` to "not found" if no SPF header present.

  - **DKIM-Signature Header?**  
    - Type: If  
    - Role: Checks for presence of "DKIM-Signature" header.

  - **DKIM Signature Found**  
    - Type: Set  
    - Role: Sets `dkimvalue` to "found".

  - **No DKIM Signature Found**  
    - Type: Set  
    - Role: Sets `dkimvalue` to "not found".

  - **DMARC Header?**  
    - Type: If  
    - Role: Checks for presence of "dmarc" header.

  - **Extract DMARC Header**  
    - Type: Code  
    - Role: Filters headers array to extract "dmarc" headers.

  - **Set DMARC Value**  
    - Type: Set  
    - Role: Sets `spfvalue` based on DMARC header content presence of "pass" or "fail".

  - **No DMARC Header**  
    - Type: Set  
    - Role: Sets `dmarcvalue` to "not found".

- **Sticky Note:**  
  Explains the detailed evaluation of SPF, DKIM, and DMARC headers and their significance in email authentication.

---

#### 2.5 Data Aggregation and Output Formatting

- **Overview:**  
  Combines all authentication results and IP reputation data into a single structured output and sends it back as a webhook response for downstream consumption.

- **Nodes Involved:**  
  - Merge  
  - Aggregate  
  - Format Individual Auth Outputs  
  - Format Webhook Output  
  - Respond to Webhook  

- **Node Details:**

  - **Merge**  
    - Type: Merge  
    - Role: Combines three input streams representing SPF, DKIM, and DMARC results into one output.  
    - Configuration: Number of inputs = 3.  

  - **Aggregate**  
    - Type: Aggregate  
    - Role: Aggregates all merged data into a single item containing combined data for easier formatting.

  - **Format Individual Auth Outputs**  
    - Type: Set  
    - Role: Extracts individual authentication results and other metadata into clearly labeled fields (e.g., spf, dkim, dmarc, initialIP, organization, country, city, recentSpamActivity, ipSenderReputation).  
    - Uses fallback values if data is missing.  

  - **Format Webhook Output**  
    - Type: Set  
    - Role: Finalizes the output format to include all fields, maintaining any other existing data fields.  

  - **Respond to Webhook**  
    - Type: Respond to Webhook  
    - Role: Sends the final structured JSON back to the calling system as a webhook response.  

- **Sticky Note:**  
  Describes consolidation of all data, formatting, and webhook response to deliver actionable insights to external systems.

---

### 3. Summary Table

| Node Name                      | Node Type                       | Functional Role                                  | Input Node(s)                       | Output Node(s)                            | Sticky Note                                                                                                 |
|--------------------------------|--------------------------------|-------------------------------------------------|-----------------------------------|------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Trigger on New Email            | Microsoft Outlook Trigger       | Polls Outlook folder for new emails             | -                                 | Retrieve Headers of Email                 | Testing email header analysis workflow; polls every minute to detect new emails.                            |
| Retrieve Headers of Email       | HTTP Request                   | Retrieves detailed internetMessageHeaders       | Trigger on New Email               | Set Headers Here                         | Testing step to fetch headers using Microsoft Graph API.                                                   |
| Set Headers Here                | Set                            | Extracts headers array into standardized field  | Retrieve Headers of Email          | Set Headers                             | Prepares headers for processing.                                                                            |
| Webhook1                      | Webhook                        | Receives email data from external POST requests | -                                 | Set Webhook Headers Here                 | Production webhook for third-party platform integration; requires active workflow.                          |
| Set Webhook Headers Here        | Set                            | Extracts headers array from webhook payload     | Webhook1                         | Set Headers                             | Prepares webhook headers for processing.                                                                    |
| Set Headers                    | Set                            | Passes headers for analysis                      | Set Headers Here, Set Webhook Headers Here | Extract Received Headers                 | Extract and process email headers.                                                                           |
| Extract Received Headers        | Code                           | Filters "Received" headers                        | Set Headers                      | Remove Extra Received Headers           | Focus on "Received" headers to find email route.                                                            |
| Remove Extra Received Headers   | Limit                          | Keeps only the last "Received" header           | Extract Received Headers          | Extract Original From IP                | Focus on the most recent "Received" header.                                                                  |
| Extract Original From IP        | Set                            | Extracts originating public IP from header       | Remove Extra Received Headers     | Original IP Found?                     | Uses regex to exclude private IPs and find originating IP.                                                  |
| Original IP Found?              | If                             | Checks if a valid originating IP is found       | Extract Original From IP          | Query IP Quality Score API, No Operation, do nothing | Validates presence of IP before reputation checks.                                                          |
| No Operation, do nothing        | NoOp                           | Halts processing if no IP found                   | Original IP Found? (False branch) | Authentication-Results Header?          | Stops workflow if IP extraction fails.                                                                       |
| Query IP Quality Score API      | HTTP Request                   | Queries IP reputation service                     | Original IP Found? (True branch)  | Query IP API                          | Calls IPQualityScore API for fraud and spam scoring.                                                        |
| Query IP API                   | HTTP Request                   | Queries IP geo and organization information       | Query IP Quality Score API         | Authentication-Results Header?          | Calls ip-api.com for IP metadata.                                                                            |
| Authentication-Results Header? | If                             | Checks for "Authentication-Results" header       | Query IP API                     | Extract Authentication-Results Header, Received-SPF Header?, DKIM-Signature Header?, DMARC Header? | Determines if authentication results are present.                                                          |
| Extract Authentication-Results Header | Code                     | Extracts Authentication-Results header            | Authentication-Results Header? (True branch) | Determine Auth Values                | Isolates authentication results header.                                                                     |
| Determine Auth Values           | Set                            | Parses SPF, DKIM, DMARC results from header      | Extract Authentication-Results Header | Format Combined Auth Output           | Assigns pass/fail/neutral/unknown values for authentication.                                                |
| Format Combined Auth Output     | Set                            | Aggregates auth results with IP reputation data  | Determine Auth Values             | Format Webhook Output                  | Combines all authentication and IP info into one object.                                                    |
| Received-SPF Header?            | If                             | Checks for "Received-SPF" header                   | Authentication-Results Header? (False branch) | Extract Received-SPF Header, No SPF Found | Validates presence of SPF header.                                                                            |
| Extract Received-SPF Header     | Code                           | Extracts all "Received-SPF" headers                | Received-SPF Header? (True branch) | Aggregate Received-SPF Headers          | Retrieves SPF validation headers.                                                                            |
| Aggregate Received-SPF Headers  | Aggregate                      | Aggregates SPF header data                          | Extract Received-SPF Header       | Set SPF Value                        | Combines SPF headers for evaluation.                                                                         |
| Set SPF Value                  | Set                            | Determines SPF pass/fail/unknown based on headers | Aggregate Received-SPF Headers    | Merge                               | Sets SPF status value.                                                                                        |
| No SPF Found                  | Set                            | Sets SPF status to "not found"                      | Received-SPF Header? (False branch) | Merge                               | Records absence of SPF header.                                                                               |
| DKIM-Signature Header?          | If                             | Checks for "DKIM-Signature" header                  | Authentication-Results Header? (False branch) | DKIM Signature Found, No DKIM Signature Found | Validates presence of DKIM header.                                                                            |
| DKIM Signature Found            | Set                            | Sets DKIM value to "found"                          | DKIM-Signature Header? (True branch) | Merge                               | Records DKIM presence.                                                                                        |
| No DKIM Signature Found         | Set                            | Sets DKIM value to "not found"                      | DKIM-Signature Header? (False branch) | Merge                               | Records absence of DKIM header.                                                                               |
| DMARC Header?                  | If                             | Checks for "dmarc" header presence                   | Authentication-Results Header? (False branch) | Extract DMARC Header, No DMARC Header | Validates presence of DMARC header.                                                                           |
| Extract DMARC Header            | Code                           | Extracts DMARC header from headers                   | DMARC Header? (True branch)       | Set DMARC Value                     | Retrieves DMARC header for evaluation.                                                                       |
| Set DMARC Value                | Set                            | Sets DMARC pass/fail/unknown status                  | Extract DMARC Header             | Merge                               | Records DMARC status value.                                                                                   |
| No DMARC Header                | Set                            | Sets DMARC value to "not found"                      | DMARC Header? (False branch)     | Merge                               | Records absence of DMARC header.                                                                              |
| Merge                         | Merge                          | Combines SPF, DKIM, DMARC results                    | Set SPF Value, DKIM Signature Found/No DKIM Signature Found, Set DMARC Value/No DMARC Header | Aggregate                         | Merges all authentication results for final aggregation.                                                   |
| Aggregate                    | Aggregate                      | Aggregates merged authentication results             | Merge                           | Format Individual Auth Outputs         | Organizes combined results into a single dataset.                                                            |
| Format Individual Auth Outputs | Set                            | Formats authentication and IP reputation data       | Aggregate                       | Format Webhook Output                  | Prepares detailed output fields for webhook response.                                                       |
| Format Webhook Output          | Set                            | Finalizes output structure                             | Format Individual Auth Outputs, Format Combined Auth Output | Respond to Webhook                   | Consolidates all output data.                                                                                 |
| Respond to Webhook             | Respond to Webhook             | Sends structured response back to caller              | Format Webhook Output           | -                                    | Returns final analysis results to requesting system.                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Microsoft Outlook Trigger node**  
   - Type: Microsoft Outlook Trigger  
   - Configure OAuth2 credentials for Outlook API access.  
   - Set folder ID to monitor the desired Outlook folder for new emails.  
   - Set polling interval (default: every minute).  
   - Leave disabled if using webhook input only.

2. **Create HTTP Request node "Retrieve Headers of Email"**  
   - Set HTTP Method: GET  
   - URL: `https://graph.microsoft.com/v1.0/me/messages/{{ $json.id }}?$select=internetMessageHeaders`  
   - Authentication: Use Outlook OAuth2 credentials.  
   - Headers: Accept: application/json.

3. **Create Set node "Set Headers Here"**  
   - Add new field `headers` of type array.  
   - Value: `={{ $json.internetMessageHeaders }}`.

4. **Create Webhook node "Webhook1"**  
   - HTTP Method: POST  
   - Path: unique webhook path (e.g., `da28e0c6-ebe2-43e7-92fe-dde3278746a8`)  
   - Response Mode: Response Node.

5. **Create Set node "Set Webhook Headers Here"**  
   - Add new field `headers` of type array.  
   - Value: `={{ $json.body.headers }}`.

6. **Create Set node "Set Headers"**  
   - Include other fields as is (includeOtherFields: true).  
   - Pass through `headers` array.

7. **Create Code node "Extract Received Headers"**  
   ```js
   const headers = $json.headers;
   const receivedHeaders = headers.filter(header => header.name === "Received");
   return receivedHeaders;
   ```

8. **Create Limit node "Remove Extra Received Headers"**  
   - Keep: last 1 item (most recent Received header).

9. **Create Set node "Extract Original From IP"**  
   - Add string field `extractedfromip`.  
   - Use regex to remove private IPs and match public IPv4/IPv6 from the header value.

10. **Create If node "Original IP Found?"**  
    - Condition: Check if `extractedfromip` is not empty.

11. **Create HTTP Request node "Query IP Quality Score API"**  
    - URL: `https://ipqualityscore.com/api/json/ip/YOUR_API_KEY/{{ $json.extractedfromip }}?strictness=1&allow_public_access_points=true&lighter_penalties=true`  
    - No authentication needed beyond API key in URL.

12. **Create HTTP Request node "Query IP API"**  
    - URL: `http://ip-api.com/json/{{ $json.extractedfromip }}`.

13. **Create If node "Authentication-Results Header?"**  
    - Condition: Check if any header named "Authentication-Results" exists in `headers`.

14. **Create Code node "Extract Authentication-Results Header"**  
    ```js
    const headers = $json.headers;
    const authResults = headers.filter(header => header.name === "Authentication-Results");
    return authResults;
    ```

15. **Create Set node "Determine Auth Values"**  
    - Fields `spfvalue`, `dkimvalue`, `dmarcvalue`.  
    - Use expressions to parse header value for "pass", "fail", etc.

16. **Create Set node "Format Combined Auth Output"**  
    - Combine auth values with IP info and reputation data fields: `spf`, `dkim`, `dmarc`, `initialIP`, `organization`, `country`, `city`, `recentSpamActivity`, `ipSenderReputation`.

17. **Create If node "Received-SPF Header?"**  
    - Check for header named "Received-SPF".

18. **Create Code node "Extract Received-SPF Header"**  
    - Filter headers by name "Received-SPF".

19. **Create Aggregate node "Aggregate Received-SPF Headers"**  
    - Aggregate all SPF headers into one dataset.

20. **Create Set node "Set SPF Value"**  
    - Determine SPF pass/fail/unknown from aggregated data.

21. **Create Set node "No SPF Found"**  
    - Set `spfvalue` to "not found".

22. **Create If node "DKIM-Signature Header?"**  
    - Check for header named "DKIM-Signature".

23. **Create Set node "DKIM Signature Found"**  
    - Set `dkimvalue` to "found".

24. **Create Set node "No DKIM Signature Found"**  
    - Set `dkimvalue` to "not found".

25. **Create If node "DMARC Header?"**  
    - Check for header named "dmarc".

26. **Create Code node "Extract DMARC Header"**  
    - Filter headers by name "dmarc".

27. **Create Set node "Set DMARC Value"**  
    - Set DMARC status based on header content (pass/fail/unknown).

28. **Create Set node "No DMARC Header"**  
    - Set `dmarcvalue` to "not found".

29. **Create Merge node "Merge"**  
    - Number of inputs: 3 (SPF, DKIM, DMARC branches).

30. **Create Aggregate node "Aggregate"**  
    - Aggregate all merged authentication results.

31. **Create Set node "Format Individual Auth Outputs"**  
    - Format combined authentication and IP reputation data into labeled fields.

32. **Create Set node "Format Webhook Output"**  
    - Finalize output structure including all fields and other existing data.

33. **Create Respond to Webhook node "Respond to Webhook"**  
    - Respond with the formatted JSON output.

34. **Connect nodes according to the logical flow:**  
    - Trigger on New Email → Retrieve Headers of Email → Set Headers Here → Set Headers → Extract Received Headers → Remove Extra Received Headers → Extract Original From IP → Original IP Found?  
      - True: Query IP Quality Score API → Query IP API → Authentication-Results Header?  
      - False: No Operation, do nothing → Authentication-Results Header?  
    - Authentication-Results Header?  
      - True: Extract Authentication-Results Header → Determine Auth Values → Format Combined Auth Output  
      - False: Received-SPF Header?, DKIM-Signature Header?, DMARC Header? branches → Merge → Aggregate  
    - After aggregation → Format Individual Auth Outputs → Format Webhook Output → Respond to Webhook.

35. **Credential Setup:**  
    - Configure Microsoft Outlook OAuth2 credentials for Outlook nodes.  
    - Securely add IP Quality Score API key in the HTTP Request node URL.  
    - No authentication needed for ip-api.com.

36. **Activate the workflow** for webhook operation mode; enable trigger node for Outlook polling.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                   | Context or Link                                                                                       |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| The workflow is highly modular, supporting both Outlook email polling and external webhook integration, enabling flexible deployment scenarios.                                                                              | Workflow design overview                                                                             |
| IP Quality Score API provides limited free lookups per month; consider subscription plans for higher volumes.                                                                                                                  | https://www.ipqualityscore.com/plans                                                               |
| Customize the workflow by adding alert nodes (Slack, Email) after the final formatting node for real-time notifications.                                                                                                       | Customization suggestions                                                                            |
| Consider integrating output with SIEM platforms (Splunk, ELK) for centralized security monitoring.                                                                                                                             | Customization suggestions                                                                            |
| The workflow efficiently excludes private/internal IP addresses when extracting the originating IP to avoid false positives.                                                                                                   | Block 2.2 explanation                                                                                |
| Regex patterns used for IP extraction support both IPv4 and IPv6 formats.                                                                                                                                                      | Node "Extract Original From IP" details                                                             |
| The workflow uses Microsoft Graph API v1.0 to fetch email headers; ensure your Outlook credentials have the necessary API permissions.                                                                                        | Node "Retrieve Headers of Email" details                                                           |
| Use the provided sticky notes inside the workflow for inline guidance and operational context during usage or modification.                                                                                                   | Sticky notes embedded in nodes                                                                       |
| For testing, enable the Outlook trigger and monitor logs for incoming emails; for production, disable trigger and rely on webhook inputs.                                                                                     | Setup instructions                                                                                   |
| The workflow currently does not include retries or error handling nodes; consider adding these for production environments to handle API failures or rate limits gracefully.                                                     | Operational considerations                                                                           |

---

This structured documentation enables a clear understanding of the workflow logic, facilitates reproduction or modification, and anticipates integration challenges and edge cases.