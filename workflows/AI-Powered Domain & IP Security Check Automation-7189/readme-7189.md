AI-Powered Domain & IP Security Check Automation

https://n8nworkflows.xyz/workflows/ai-powered-domain---ip-security-check-automation-7189


# AI-Powered Domain & IP Security Check Automation

### 1. Workflow Overview

This workflow automates the security analysis of domains and IP addresses using VirusTotal and AbuseIPDB data, augmented by AI-based risk assessment. Its primary goal is to scan domains and associated IPs for malicious or suspicious activities, evaluate related email security configurations (SPF, DKIM, DMARC), and produce risk evaluations with AI agents. The workflow integrates Google Sheets for task management and result tracking, updating statuses and comments automatically.

**Target Use Cases:**  
- Cybersecurity teams monitoring domain and IP reputation  
- Automated phishing or abuse risk assessment  
- Integration of AI-driven analysis with security data feeds  
- Automated reporting and workflow status management via Google Sheets

**Logical Blocks:**

- **1.1 Trigger and Input Acquisition:** Periodic trigger and retrieval of "To do" domain entries from Google Sheets.  
- **1.2 Domain Data Collection:** Query VirusTotal for domain reports, request rescans, and gather domain-IP resolution details.  
- **1.3 Domain Data Filtering:** Conditional checks to verify if domain data exists and categorize as malicious, suspicious, or safe.  
- **1.4 Malicious IP Analysis:** For IPs flagged as malicious/suspicious, query AbuseIPDB and DNS records (SPF, DKIM, DMARC), followed by AI risk evaluation.  
- **1.5 Malicious Hostname Analysis:** For hostnames flagged as malicious/suspicious, perform similar DNS checks and AI evaluation.  
- **1.6 Safe Domain Analysis:** For domains deemed safe, still perform DNS checks and AI evaluation as an additional precaution.  
- **1.7 AI-Driven Risk Assessment:** Multiple AI agents analyze the collated data to generate risk summaries in Indonesian.  
- **1.8 Google Sheets Update:** Update task statuses and add AI-generated comments back into the Google Sheets for tracking.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Trigger and Input Acquisition

**Overview:**  
Initiates the workflow on a schedule and fetches domain entries marked "To do" from Google Sheets for processing.

**Nodes Involved:**  
- Schedule Trigger1  
- Google Sheets10  

**Node Details:**

- **Schedule Trigger1:**  
  - Type: Schedule Trigger  
  - Role: Periodic workflow start  
  - Config: Triggered every few seconds (interval seconds)  
  - Inputs: None  
  - Outputs: Triggers next node  
  - Edge Cases: Trigger frequency too high may cause rate limits  

- **Google Sheets10:**  
  - Type: Google Sheets  
  - Role: Fetch domains with "To do" status  
  - Config: Reads from "Domain Customer" spreadsheet, sheet with gid=0 (Sheet1), filtered by Status = "To do"  
  - Credentials: Google OAuth2  
  - Inputs: Trigger data  
  - Outputs: Domain data for next steps  
  - Edge Cases: Authentication failure, API quota exceeded, empty results  

---

#### 1.2 Domain Data Collection

**Overview:**  
Fetches domain reports from VirusTotal, requests a domain rescan, retrieves analysis results, then collects domain-IP resolution data.

**Nodes Involved:**  
- Get a domain report  
- Request an domain rescan  
- Get a URL / file analysis  
- Domain-IP resolutions  
- IF Checking Domain Found Or Not Found  

**Node Details:**

- **Get a domain report:**  
  - Type: HTTP Request  
  - Role: Retrieves VirusTotal domain report based on domain name from Google Sheets  
  - Config: GET https://www.virustotal.com/api/v3/domains/{{ $json.Domain }}  
  - Authentication: VirusTotal API Credential  
  - Inputs: Domain from Google Sheets  
  - Outputs: Domain report JSON  
  - Edge Cases: Domain not found, API rate limits, auth errors  

- **Request an domain rescan:**  
  - Type: HTTP Request  
  - Role: Triggers VirusTotal to re-analyze the domain  
  - Config: POST https://www.virustotal.com/api/v3/domains/{{ $json.data.id }}/analyse  
  - Authentication: VirusTotal API  
  - Inputs: Domain ID from previous node  
  - Outputs: Rescan request response  
  - Edge Cases: Rescan limits, API errors  

- **Get a URL / file analysis:**  
  - Type: HTTP Request  
  - Role: Gets detailed analysis results of the domain post-rescan  
  - Config: GET https://www.virustotal.com/api/v3/analyses/{{ $json.data.id }}  
  - Authentication: VirusTotal API  
  - Inputs: Analysis ID from rescan response  
  - Outputs: Analysis results JSON  
  - Edge Cases: Analysis not ready, timeouts  

- **Domain-IP resolutions:**  
  - Type: HTTP Request  
  - Role: Retrieves IP addresses associated with the domain  
  - Config: GET https://www.virustotal.com/api/v3/domains/{{ $('Get a domain report').item.json.data.id }}/resolutions  
  - Authentication: VirusTotal API  
  - Inputs: Domain ID from domain report  
  - Outputs: List of resolved IPs  
  - Edge Cases: No resolutions found  

- **IF Checking Domain Found Or Not Found:**  
  - Type: If node  
  - Role: Checks if domain report count > 0 to decide next steps  
  - Condition: $json.meta.count > 0  
  - Inputs: Domain-IP resolutions data  
  - Outputs: True path leads to resolution details, false path triggers Google Sheets update for no domain found  
  - Edge Cases: Missing meta data, empty responses  

---

#### 1.3 Domain Data Filtering

**Overview:**  
Analyzes the IP and hostname reputation scores to classify the domain as malicious, suspicious, or safe and routes accordingly.

**Nodes Involved:**  
- Resolution  
- Code  
- Malicious IP  
- Malicious Hostname  
- Safe  

**Node Details:**

- **Resolution:**  
  - Type: HTTP Request  
  - Role: Fetches detailed resolution info for the first resolved IP  
  - Config: GET https://www.virustotal.com/api/v3/resolutions/{{ $json.data[0].id }}  
  - Authentication: VirusTotal API  
  - Inputs: IP resolutions list  
  - Outputs: Resolution details JSON  
  - Edge Cases: Empty resolution data  

- **Code:**  
  - Type: Code (JavaScript)  
  - Role: Extracts and maps key attributes from resolution data for later evaluation  
  - Config: Extracts IP, hostname, and their malicious/suspicious scores, plus resolver info  
  - Inputs: Resolution data  
  - Outputs: Simplified JSON with relevant attributes  
  - Edge Cases: Missing attributes in input JSON  

- **Malicious IP:**  
  - Type: If node  
  - Role: Checks if IP's malicious or suspicious score > 0  
  - Condition: maliciousIP > 0 OR suspiciousIP > 0  
  - Inputs: Code node data  
  - Outputs: True proceeds to malicious IP analysis  
  - Edge Cases: Scores missing or zero  

- **Malicious Hostname:**  
  - Type: If node  
  - Role: Checks if hostname's malicious or suspicious score > 0  
  - Condition: maliciousHostname > 0 OR suspiciousHostname > 0  
  - Inputs: Code node data  
  - Outputs: True proceeds to malicious hostname analysis  
  - Edge Cases: Scores missing or zero  

- **Safe:**  
  - Type: If node  
  - Role: Checks that all malicious and suspicious scores are zero or missing, classifying domain as safe  
  - Condition: All scores (malicious and suspicious for IP and hostname) equal 0 or do not exist  
  - Inputs: Code node data  
  - Outputs: True proceeds to safe domain analysis  
  - Edge Cases: Partial data, missing fields  

---

#### 1.4 Malicious IP Analysis

**Overview:**  
For IPs flagged as malicious/suspicious, queries AbuseIPDB for abuse reports and performs DNS checks (SPF, DMARC, DKIM), followed by AI evaluation.

**Nodes Involved:**  
- HTTP Request (AbuseIPDB)  
- check SPF1  
- check DMARC1  
- check DKIM1  
- AI Agent1  
- OpenRouter Chat Model1  
- Simple Memory  
- Google Sheets6  
- Google Sheets7  
- Google Sheets8  

**Node Details:**

- **HTTP Request (AbuseIPDB):**  
  - Type: HTTP Request  
  - Role: Checks IP reputation and abuse reports from AbuseIPDB API  
  - Config: GET https://api.abuseipdb.com/api/v2/check?ipAddress={{ $json.ip }}&maxAgeInDays=90&verbose  
  - Authentication: AbuseIPDB API key in HTTP header  
  - Inputs: IP address from Code node  
  - Outputs: AbuseIPDB data with reports  
  - Edge Cases: API rate limits, no reports found  

- **check SPF1:**  
  - Type: HTTP Request  
  - Role: DNS TXT record lookup for SPF on IP address domain  
  - Config: GET https://dns.google/resolve?name={{ $json.data.ipAddress }}&type=TXT  
  - Inputs: IP address from AbuseIPDB response  
  - Outputs: SPF DNS records  
  - Edge Cases: No SPF record found  

- **check DMARC1:**  
  - Type: HTTP Request  
  - Role: DNS TXT record lookup for DMARC on _dmarc subdomain of IP domain  
  - Config: GET https://dns.google/resolve?name=_dmarc.{{ $('HTTP Request').item.json.data.ipAddress }}&type=TXT  
  - Inputs: IP address domain  
  - Outputs: DMARC DNS records  
  - Edge Cases: No DMARC record found  

- **check DKIM1:**  
  - Type: HTTP Request  
  - Role: DNS TXT record lookup for DKIM on selector1._domainkey subdomain of IP domain  
  - Config: GET https://dns.google/resolve?name=selector1._domainkey{{ $('HTTP Request').item.json.data.ipAddress }}&type=TXT  
  - Inputs: IP domain  
  - Outputs: DKIM DNS records  
  - Edge Cases: No DKIM record found  

- **AI Agent1:**  
  - Type: Langchain Agent  
  - Role: Evaluates IP and hostname risk scores plus AbuseIPDB reports, providing a summarized risk assessment in Indonesian  
  - Inputs: Malicious IP & Hostname scores, AbuseIPDB report date and comment  
  - System Prompt: Cybersecurity analyst evaluating phishing/spam risk based on IP reputation and email config  
  - Outputs: Risk evaluation text  
  - Edge Cases: AI API errors, incomplete input data  

- **OpenRouter Chat Model1:**  
  - Type: Language Model (OpenRouter)  
  - Role: Provides underlying language model for AI Agent1  
  - Credentials: OpenRouter API account  
  - Inputs/Outputs: AI Agent1 interface  

- **Simple Memory:**  
  - Type: Langchain Memory Buffer  
  - Role: Maintains conversational context for AI Agent1 sessions keyed by IP address  
  - Inputs: AI Agent1 output  
  - Outputs: AI Agent1 input for stateful context  

- **Google Sheets6:**  
  - Type: Google Sheets  
  - Role: Retrieves "To do" entries for IP analysis results update  
  - Inputs: AI Agent1 output  
  - Outputs: Entry for update  

- **Google Sheets7:**  
  - Type: Google Sheets  
  - Role: Updates domain status with AI Agent1's analysis output in the sheet  
  - Operation: Update based on Status match  
  - Inputs: AI Agent1 output  
  - Outputs: Confirmation of update  

- **Google Sheets8:**  
  - Type: Google Sheets  
  - Role: Finalizes update setting Status to "Done" with remarks from AI Agent1 output  
  - Operation: Update based on Keterangan match  
  - Inputs: Previous Google Sheets7 output  
  - Outputs: Update confirmation  

---

#### 1.5 Malicious Hostname Analysis

**Overview:**  
For hostnames flagged as malicious/suspicious, performs DNS TXT record checks (SPF, DMARC, DKIM) and AI-driven risk assessment.

**Nodes Involved:**  
- check SPF  
- check DMARC  
- check DKIM  
- AI Agent  
- OpenRouter Chat Model  
- Simple Memory1  
- Google Sheets3  
- Google Sheets4  
- Google Sheets5  

**Node Details:**

- **check SPF:**  
  - Type: HTTP Request  
  - Role: DNS TXT lookup for SPF on hostname  
  - Config: GET https://dns.google/resolve?name={{ $json.hostname }}&type=TXT  
  - Inputs: Hostname from Code node  
  - Outputs: SPF DNS records  

- **check DMARC:**  
  - Type: HTTP Request  
  - Role: DNS TXT lookup for DMARC on _dmarc.hostname  
  - Config: GET https://dns.google/resolve?name=_dmarc.{{ $('Malicious Hostname').item.json.hostname }}&type=TXT  
  - Inputs: Hostname  
  - Outputs: DMARC DNS records  

- **check DKIM:**  
  - Type: HTTP Request  
  - Role: DNS TXT lookup for DKIM on selector1._domainkey.hostname  
  - Config: GET https://dns.google/resolve?name=selector1._domainkey{{ $('Malicious Hostname').item.json.hostname }}&type=TXT  
  - Inputs: Hostname  
  - Outputs: DKIM DNS records  

- **AI Agent:**  
  - Type: Langchain Agent  
  - Role: AI evaluates malicious/suspicious hostname and IP risk and email security posture, producing Indonesian summary  
  - Inputs: Scores and DNS results  
  - Outputs: Risk analysis text  

- **OpenRouter Chat Model:**  
  - Role: Underlying language model for AI Agent  
  - Credentials: OpenRouter API  

- **Simple Memory1:**  
  - Role: Maintains AI conversation context keyed by hostname  

- **Google Sheets3:**  
  - Retrieves "To do" entries for malicious hostname update  

- **Google Sheets4:**  
  - Updates "To do" entries with AI Agent output for hostname analysis  

- **Google Sheets5:**  
  - Final update marking entries "Done" with remarks from AI Agent  

---

#### 1.6 Safe Domain Analysis

**Overview:**  
For domains without malicious or suspicious scores, still performs SPF, DMARC, DKIM checks and AI risk evaluation as a precaution.

**Nodes Involved:**  
- check SPF2  
- check DMARC2  
- check DKIM2  
- AI Agent2  
- OpenRouter Chat Model2  
- Simple Memory2  
- Google Sheets  
- Google Sheets1  
- Google Sheets2  

**Node Details:**

- **check SPF2:**  
  - DNS TXT lookup for SPF on safe domain hostname  

- **check DMARC2:**  
  - DNS TXT lookup for DMARC on _dmarc.safe.hostname  

- **check DKIM2:**  
  - DNS TXT lookup for DKIM on selector1._domainkey.safe.hostname  

- **AI Agent2:**  
  - AI assesses safe domain with DNS results and scores, producing summary in Indonesian  

- **OpenRouter Chat Model2:**  
  - Language model backend for AI Agent2  

- **Simple Memory2:**  
  - Context memory for AI Agent2 keyed by safe hostname  

- **Google Sheets:**  
  - Retrieves "To do" entries for safe domain update  

- **Google Sheets1:**  
  - Updates "To do" entries with AI Agent2 output  

- **Google Sheets2:**  
  - Finalizes update setting Status to "Done" with remarks from AI Agent2 output  

---

#### 1.7 Google Sheets Status Updates & Finalization

**Overview:**  
Throughout the workflow, Google Sheets nodes are used to fetch tasks and update statuses and analysis results to keep domain security checks tracked and managed.

**Nodes Involved:**  
- Google Sheets10, 9, 6, 3, etc. (read)  
- Google Sheets1, 2, 4, 5, 7, 8, 11, 12 (update)  

**Node Details:**  
- All Google Sheets nodes use OAuth2 credentials.  
- Read nodes filter rows with Status = "To do".  
- Update nodes match rows based on Status or Keterangan columns and update with AI results and new Status ("Done").  
- Edge cases include API limits, permission errors, and concurrency issues on updates.  

---

### 3. Summary Table

| Node Name                     | Node Type                       | Functional Role                         | Input Node(s)                          | Output Node(s)                         | Sticky Note                           |
|-------------------------------|--------------------------------|---------------------------------------|--------------------------------------|--------------------------------------|-------------------------------------|
| Schedule Trigger1              | Schedule Trigger               | Periodic trigger                      | -                                    | Google Sheets10                      | ## Trigger                          |
| Google Sheets10               | Google Sheets                  | Fetch domains marked "To do"          | Schedule Trigger1                    | Get a domain report                  |                                     |
| Get a domain report           | HTTP Request                  | Retrieve VirusTotal domain report     | Google Sheets10                     | Request an domain rescan             | ## Checking domain                  |
| Request an domain rescan      | HTTP Request                  | Request VirusTotal domain rescan      | Get a domain report                 | Get a URL / file analysis            | ## Checking domain                  |
| Get a URL / file analysis     | HTTP Request                  | Get analysis results after rescan     | Request an domain rescan            | Domain-IP resolutions               | ## Checking domain                  |
| Domain-IP resolutions         | HTTP Request                  | Get domain-to-IP resolutions          | Get a URL / file analysis           | IF Checking Domain Found Or Not Found | ## Checking domain                  |
| IF Checking Domain Found Or Not Found | If                        | Check if domain data exists           | Domain-IP resolutions               | Resolution, Google Sheets9           | ## Filter                          |
| Resolution                   | HTTP Request                  | Get detailed IP resolution info       | IF Checking Domain Found Or Not Found (true branch) | Code                      | ## Checking domain                  |
| Code                         | Code (JavaScript)             | Extract key attributes from resolution | Resolution                        | Malicious Hostname, Malicious IP, Safe | ## Checking domain                  |
| Malicious IP                 | If                           | Check if IP is malicious/suspicious   | Code                              | HTTP Request (AbuseIPDB)             | ## Malicious IP Scan               |
| HTTP Request (AbuseIPDB)     | HTTP Request                  | Query AbuseIPDB for IP abuse reports  | Malicious IP                      | check SPF1                         | ## Malicious IP Scan               |
| check SPF1                   | HTTP Request                  | DNS TXT lookup for SPF on IP domain   | HTTP Request (AbuseIPDB)           | check DMARC1                      | ## Malicious IP Scan               |
| check DMARC1                 | HTTP Request                  | DNS TXT lookup for DMARC on IP domain | check SPF1                       | check DKIM1                      | ## Malicious IP Scan               |
| check DKIM1                  | HTTP Request                  | DNS TXT lookup for DKIM on IP domain  | check DMARC1                     | AI Agent1                       | ## Malicious IP Scan               |
| AI Agent1                   | Langchain Agent               | AI risk analysis for malicious IP     | check DKIM1                      | Google Sheets6                    | ## Malicious IP Scan               |
| OpenRouter Chat Model1       | LM Chat (OpenRouter)          | Language model for AI Agent1           | AI Agent1 (ai_languageModel)       | AI Agent1                      | ## Malicious IP Scan               |
| Simple Memory                | Memory Buffer Window          | Context memory for AI Agent1           | AI Agent1 (ai_memory)              | AI Agent1                     | ## Malicious IP Scan               |
| Google Sheets6              | Google Sheets                 | Fetch "To do" entries for IP update    | AI Agent1                        | Google Sheets7                  | ## Malicious IP Scan               |
| Google Sheets7              | Google Sheets                 | Update IP entry with AI analysis       | Google Sheets6                   | Google Sheets8                 | ## Malicious IP Scan               |
| Google Sheets8              | Google Sheets                 | Mark IP entry "Done" with remarks      | Google Sheets7                   | -                            | ## Malicious IP Scan               |
| Malicious Hostname          | If                           | Check if hostname is malicious/suspicious | Code                          | check SPF                        | ## Malicious Hostname Scan        |
| check SPF                  | HTTP Request                  | DNS TXT lookup for SPF on hostname     | Malicious Hostname               | check DMARC                   | ## Malicious Hostname Scan        |
| check DMARC                | HTTP Request                  | DNS TXT lookup for DMARC on hostname   | check SPF                      | check DKIM                   | ## Malicious Hostname Scan        |
| check DKIM                 | HTTP Request                  | DNS TXT lookup for DKIM on hostname    | check DMARC                   | AI Agent                    | ## Malicious Hostname Scan        |
| AI Agent                  | Langchain Agent               | AI risk analysis for malicious hostname | check DKIM                   | Google Sheets3               | ## Malicious Hostname Scan        |
| OpenRouter Chat Model      | LM Chat (OpenRouter)          | Language model for AI Agent             | AI Agent (ai_languageModel)      | AI Agent                    | ## Malicious Hostname Scan        |
| Simple Memory1             | Memory Buffer Window          | Context memory for AI Agent             | AI Agent (ai_memory)             | AI Agent                    | ## Malicious Hostname Scan        |
| Google Sheets3             | Google Sheets                 | Fetch "To do" entries for hostname update | AI Agent                    | Google Sheets4               | ## Malicious Hostname Scan        |
| Google Sheets4             | Google Sheets                 | Update hostname entry with AI analysis  | Google Sheets3                | Google Sheets5               | ## Malicious Hostname Scan        |
| Google Sheets5             | Google Sheets                 | Mark hostname entry "Done" with remarks | Google Sheets4                | -                            | ## Malicious Hostname Scan        |
| Safe                      | If                           | Check if domain is safe (no suspicious/malicious scores) | Code                          | check SPF2                     | ## Safe Scan                     |
| check SPF2                | HTTP Request                  | DNS TXT lookup for SPF on safe domain  | Safe                           | check DMARC2                   | ## Safe Scan                     |
| check DMARC2              | HTTP Request                  | DNS TXT lookup for DMARC on safe domain | check SPF2                    | check DKIM2                   | ## Safe Scan                     |
| check DKIM2               | HTTP Request                  | DNS TXT lookup for DKIM on safe domain  | check DMARC2                  | AI Agent2                    | ## Safe Scan                     |
| AI Agent2                | Langchain Agent               | AI risk analysis for safe domain        | check DKIM2                   | Google Sheets                 | ## Safe Scan                     |
| OpenRouter Chat Model2    | LM Chat (OpenRouter)          | Language model for AI Agent2             | AI Agent2 (ai_languageModel)   | AI Agent2                    | ## Safe Scan                     |
| Simple Memory2           | Memory Buffer Window          | Context memory for AI Agent2             | AI Agent2 (ai_memory)          | AI Agent2                    | ## Safe Scan                     |
| Google Sheets            | Google Sheets                 | Fetch "To do" entries for safe domain update | AI Agent2                    | Google Sheets1               | ## Safe Scan                     |
| Google Sheets1           | Google Sheets                 | Update safe domain entry with AI analysis | Google Sheets                | Google Sheets2               | ## Safe Scan                     |
| Google Sheets2           | Google Sheets                 | Mark safe domain entry "Done" with remarks | Google Sheets1               | -                            | ## Safe Scan                     |
| Google Sheets9           | Google Sheets                 | Update when domain not found             | IF Checking Domain Found Or Not Found (false path) | Google Sheets11            | ## Filter                       |
| Google Sheets11          | Google Sheets                 | Update status and remarks for not found | Google Sheets9               | Google Sheets12              | ## Update Status False          |
| Google Sheets12          | Google Sheets                 | Final confirmation update for not found | Google Sheets11              | -                            | ## Update Status False          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Set interval to trigger every few seconds or as desired (e.g., every 60 seconds)  

2. **Add Google Sheets node (Google Sheets10)**  
   - Operation: Read Rows  
   - Document: Select your Google Sheets document (Domain Customer)  
   - Sheet: Sheet1 (gid=0)  
   - Filter: Status equals "To do"  
   - Connect Schedule Trigger output to this node  

3. **Add HTTP Request node (Get a domain report)**  
   - Method: GET  
   - URL: `https://www.virustotal.com/api/v3/domains/{{ $json.Domain }}`  
   - Authentication: VirusTotal API credential (predefined)  
   - Header: Accept: application/json  
   - Connect Google Sheets10 output to this node  

4. **Add HTTP Request node (Request an domain rescan)**  
   - Method: POST  
   - URL: `https://www.virustotal.com/api/v3/domains/{{ $json.data.id }}/analyse`  
   - Authentication: VirusTotal API  
   - Header: Accept: application/json  
   - Connect Get a domain report output to this node  

5. **Add HTTP Request node (Get a URL / file analysis)**  
   - Method: GET  
   - URL: `https://www.virustotal.com/api/v3/analyses/{{ $json.data.id }}`  
   - Authentication: VirusTotal API  
   - Header: Accept: application/json  
   - Connect Request an domain rescan output to this node  

6. **Add HTTP Request node (Domain-IP resolutions)**  
   - Method: GET  
   - URL: `https://www.virustotal.com/api/v3/domains/{{ $('Get a domain report').item.json.data.id }}/resolutions`  
   - Authentication: VirusTotal API  
   - Header: Accept: application/json  
   - Connect Get a URL / file analysis output to this node  

7. **Add If node (IF Checking Domain Found Or Not Found)**  
   - Condition: `$json.meta.count > 0`  
   - Connect Domain-IP resolutions output to this node  

8. **Add HTTP Request node (Resolution)**  
   - Method: GET  
   - URL: `https://www.virustotal.com/api/v3/resolutions/{{ $json.data[0].id }}`  
   - Authentication: VirusTotal API  
   - Header: Accept: application/json  
   - Connect true output of IF node to this node  

9. **Add Code node (Code)**  
   - JavaScript code to extract relevant fields (ip, hostname, malicious/suspicious scores) from Resolution output  
   - Connect Resolution output to this node  

10. **Add three If nodes: Malicious IP, Malicious Hostname, Safe**  
    - Malicious IP: check if maliciousIP > 0 OR suspiciousIP > 0  
    - Malicious Hostname: check if maliciousHostname > 0 OR suspiciousHostname > 0  
    - Safe: check all four scores equal 0 or non-existent  
    - Connect Code output to all three  

11. **Malicious IP branch:**  
    a. HTTP Request (AbuseIPDB) – Check IP reputation  
    b. check SPF1 (DNS TXT lookup for SPF on IP domain)  
    c. check DMARC1 (DNS TXT lookup for DMARC on IP domain)  
    d. check DKIM1 (DNS TXT lookup for DKIM on IP domain)  
    e. AI Agent1 – Langchain Agent with OpenRouter model; input includes IP scores and AbuseIPDB reports; system prompt in Indonesian  
    f. Simple Memory – Context memory keyed by IP address  
    g. Google Sheets6 – Fetch "To do" entries  
    h. Google Sheets7 – Update entries with AI Agent1 output  
    i. Google Sheets8 – Mark entries as "Done" with remarks  
    j. Connect nodes in above logical order

12. **Malicious Hostname branch:**  
    a. check SPF (DNS TXT lookup for SPF on hostname)  
    b. check DMARC (DNS TXT lookup for DMARC on hostname)  
    c. check DKIM (DNS TXT lookup for DKIM on hostname)  
    d. AI Agent – Langchain Agent with OpenRouter model; input includes hostname scores; system prompt in Indonesian  
    e. Simple Memory1 – Context memory keyed by hostname  
    f. Google Sheets3 – Fetch "To do" entries  
    g. Google Sheets4 – Update entries with AI Agent output  
    h. Google Sheets5 – Mark entries as "Done" with remarks  
    i. Connect nodes as per above order  

13. **Safe branch:**  
    a. check SPF2 (DNS TXT lookup for SPF on safe domain)  
    b. check DMARC2 (DNS TXT lookup for DMARC on safe domain)  
    c. check DKIM2 (DNS TXT lookup for DKIM on safe domain)  
    d. AI Agent2 – Langchain Agent with OpenRouter model; system prompt in Indonesian  
    e. Simple Memory2 – Context memory keyed by safe hostname  
    f. Google Sheets – Fetch "To do" entries  
    g. Google Sheets1 – Update entries with AI Agent2 output  
    h. Google Sheets2 – Mark entries as "Done" with remarks  
    i. Connect nodes accordingly  

14. **False branch of IF Checking Domain Found Or Not Found:**  
    a. Google Sheets9 – Fetch "To do" entries  
    b. Google Sheets11 – Update entries to "To do" with explanation for domain not found  
    c. Google Sheets12 – Mark entries "Done"  
    d. Connect nodes accordingly  

15. **Configure all credentials:**  
    - VirusTotal API (predefined credential)  
    - AbuseIPDB API (HTTP header auth)  
    - Google Sheets OAuth2  
    - OpenRouter API for AI Language Model  

16. **Test workflow end-to-end** to handle empty results, API errors, and ensure Google Sheets updates correctly.

---

### 5. General Notes & Resources

| Note Content                                                                                                          | Context or Link                                                                                           |
|-----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| The workflow uses advanced AI-driven agents (Langchain + OpenRouter) to produce natural language risk assessments.     | AI nodes require valid OpenRouter API credentials                                                        |
| Google Sheets is used as a task queue and results repository, with filtering on "To do" status for incremental scans. | Spreadsheet ID: 15q0yJ4rbMdFTLUrMb9UDtYjCK_sh23OQxE8VTv0k2Tc (named "Domain Customer")                    |
| VirusTotal API integration requires API keys and careful rate limit management.                                        | https://www.virustotal.com/gui/join-us                                                                   |
| AbuseIPDB provides IP abuse report data via HTTP header authentication.                                                | https://www.abuseipdb.com/api/                                                                           |
| DNS lookups for SPF, DMARC, DKIM use Google's DNS-over-HTTPS API.                                                     | https://dns.google/                                                                                       |
| The workflow status updates maintain synchronization between AI analysis results and domain task status in Sheets.    |                                                                                                          |
| The AI prompts and system messages are in Indonesian, suitable for Indonesian-speaking cybersecurity analysts.        |                                                                                                          |
| Sticky notes in the workflow visually group domain checking, IP scan, hostname scan, safe scan, and filtering steps.  | Sticky note colors and sizes help navigation and understanding of workflow sections                        |

---

**Disclaimer:**  
The provided text is derived exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.