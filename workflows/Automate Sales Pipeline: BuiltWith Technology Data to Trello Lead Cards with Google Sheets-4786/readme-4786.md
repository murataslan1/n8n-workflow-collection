Automate Sales Pipeline: BuiltWith Technology Data to Trello Lead Cards with Google Sheets

https://n8nworkflows.xyz/workflows/automate-sales-pipeline--builtwith-technology-data-to-trello-lead-cards-with-google-sheets-4786


# Automate Sales Pipeline: BuiltWith Technology Data to Trello Lead Cards with Google Sheets

### 1. Workflow Overview

This workflow automates the process of enriching a sales pipeline by integrating domain technology data into Trello lead cards. It targets marketing, sales, and business intelligence users who want to analyze web technologies used by potential leads and manage that data visually in Trello. The workflow reads a list of domains from Google Sheets, queries the BuiltWith API to fetch technology stacks for each domain, extracts relevant technology information, and creates Trello cards with this data for further sales or market analysis.

The workflow is organized into three main logical blocks:

- **1.1 Input Reception:** Manually trigger the workflow and read target domains from Google Sheets.
- **1.2 Technology Data Retrieval and Extraction:** For each domain, send requests to BuiltWith API and parse the response to extract key tech stack info.
- **1.3 Trello Card Creation:** Create Trello cards populated with extracted technology data for each domain.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
Starts the workflow manually and fetches a list of domains from a Google Sheets document to be processed downstream.

**Nodes Involved:**  
- Manual Trigger  
- Read Domains from Google Sheets  

**Node Details:**  

- **Manual Trigger**  
  - Type: Manual trigger node  
  - Role: Initiates the workflow on user command; useful for testing and manual runs.  
  - Configuration: No parameters, simply a button-triggered start.  
  - Input: None  
  - Output: Trigger signal to next node.  
  - Edge cases: None typical, but user must remember to trigger manually or replace with scheduled trigger for automation.  

- **Read Domains from Google Sheets**  
  - Type: Google Sheets node  
  - Role: Reads the list of domains to analyze from a specified Google Sheet tab.  
  - Configuration:  
    - Document ID set to a Google Sheets file containing domain data.  
    - Sheet name set to the first tab ("gid=0").  
    - Reads all rows as input data.  
    - Uses OAuth2 credentials for Google Sheets connection.  
  - Expressions: N/A  
  - Input: Trigger from Manual Trigger node  
  - Output: List of domain rows, each with at least a `Domain` column.  
  - Edge cases:  
    - OAuth token expiration or invalid permissions.  
    - Empty or malformed sheets (missing Domain column).  
    - Large sheets may hit API limits; batching or pagination is not configured here.  

#### 1.2 Technology Data Retrieval and Extraction

**Overview:**  
For each domain fetched, the workflow queries the BuiltWith API to get technology stack details and extracts a simplified, relevant subset of the data.

**Nodes Involved:**  
- Fetch detail via BuiltWith (HTTP Request)  
- Extract Tech Stack Info (Code node)  

**Node Details:**  

- **Fetch detail via BuiltWith**  
  - Type: HTTP Request node  
  - Role: Sends a GET request to the BuiltWith API to retrieve technology data for each domain.  
  - Configuration:  
    - URL: `https://api.builtwith.com/v21/api.json`  
    - Query Parameters:  
      - `KEY`: User’s BuiltWith API key (placeholder `YOUR_API_KEY` in the workflow).  
      - `LOOKUP`: Domain dynamically set from each input item (`{{$json.Domain}}`).  
  - Input: Domains from Google Sheets node  
  - Output: Raw API JSON response containing technology detection results.  
  - Edge cases:  
    - API key missing or invalid → authentication errors.  
    - Rate limiting if many domains processed without delay.  
    - Network timeouts or BuiltWith service downtime.  
    - Domains not found by BuiltWith → empty or missing Results.  

- **Extract Tech Stack Info**  
  - Type: Code (JavaScript) node  
  - Role: Parses the BuiltWith API response and extracts a single technology entry per domain with key metadata.  
  - Configuration:  
    - Custom JS code loops through the first path’s groups and picks the first technology found.  
    - Extracted fields: Technology name, Category, First Detected date, Last Detected date, Domain, URL.  
    - Returns a single simplified JSON object per domain for downstream use.  
  - Key expressions: Uses optional chaining and loops to safely access nested JSON.  
  - Input: Raw API response from BuiltWith node.  
  - Output: Simplified JSON array with one technology entry.  
  - Edge cases:  
    - No technologies found → returns empty array (no downstream data).  
    - Unexpected API response shape → code errors, should be handled with try/catch if extended.  
    - Multiple technologies per domain intentionally not extracted (simplification).  

#### 1.3 Trello Card Creation

**Overview:**  
Creates Trello cards for each extracted technology entry, populating card details to visually track leads and their technology stacks.

**Nodes Involved:**  
- Trello  

**Node Details:**  

- **Trello**  
  - Type: Trello node  
  - Role: Creates cards on a specified Trello board/list with extracted technology data.  
  - Configuration:  
    - Card name: Fixed as "Scan BuiltWith Results"  
    - Description: Template using expressions to fill in domain, technology, category, first and last detected dates, and URL from extracted data.  
    - Additional fields: Due date and member IDs left empty (can be customized).  
    - Requires Trello OAuth credentials.  
  - Input: Extracted tech stack info from Code node.  
  - Output: Confirmation of card creation per item.  
  - Edge cases:  
    - Trello API rate limits or authentication failures.  
    - Missing fields in input data → incomplete card descriptions.  
    - Trello board or list misconfiguration (not shown in workflow, assumed preset).  

---

### 3. Summary Table

| Node Name                    | Node Type          | Functional Role                       | Input Node(s)               | Output Node(s)            | Sticky Note                                                                                   |
|------------------------------|--------------------|------------------------------------|-----------------------------|---------------------------|----------------------------------------------------------------------------------------------|
| Manual Trigger               | Manual Trigger     | Start workflow manually             | —                           | Read Domains from Google Sheets | ## 🧩 **Section 1: Input Collection**<br>Starts workflow manually; useful for tests.          |
| Read Domains from Google Sheets | Google Sheets     | Read domain list from Google Sheet  | Manual Trigger              | Fetch detail via BuiltWith | ## 🧩 **Section 1: Input Collection**<br>Reads domains for analysis from Google Sheets.       |
| Fetch detail via BuiltWith   | HTTP Request       | Fetch technology data from BuiltWith API | Read Domains from Google Sheets | Extract Tech Stack Info   | ## 🌍 **Section 2: Tech Stack Lookup**<br>Queries BuiltWith API per domain.                   |
| Extract Tech Stack Info      | Code               | Extract simplified tech info        | Fetch detail via BuiltWith  | Trello                    | ## 🌍 **Section 2: Tech Stack Lookup**<br>Extracts key tech fields from API response.         |
| Trello                      | Trello             | Create Trello cards with tech info | Extract Tech Stack Info     | —                         | # 📊 **Section 3: Create Trello Cards**<br>Creates Trello cards with extracted tech data.     |
| Sticky Note                 | Sticky Note        | Documentation / explanation         | —                           | —                         | ## 🧩 **Section 1: Input Collection**<br>Explains the input stage of the workflow.            |
| Sticky Note1                | Sticky Note        | Documentation / explanation         | —                           | —                         | ## 🌍 **Section 2: Tech Stack Lookup**<br>Explains BuiltWith API fetch and extraction logic.  |
| Sticky Note2                | Sticky Note        | Documentation / explanation         | —                           | —                         | # 📊 **Section 3: Create Trello Cards**<br>Explains Trello card creation details.             |
| Sticky Note4                | Sticky Note        | Full workflow overview and tips     | —                           | —                         | ## ⚙️ **Workflow Overview:** Summary of entire workflow, blocks, and tips.                    |
| Sticky Note9                | Sticky Note        | Support and contact info             | —                           | —                         | Workflow assistance contact and resource links: YouTube and LinkedIn channels of author.     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add node: Manual Trigger  
   - No parameters needed. This node will start your workflow on demand.

2. **Add Google Sheets Node to Read Domains**  
   - Add node: Google Sheets  
   - Set operation to read rows from a sheet.  
   - Configure credentials: connect your Google Sheets account via OAuth2.  
   - Set Document ID to your Google Sheet containing domain data.  
   - Set Sheet Name to the relevant tab (e.g., "Sheet1" or "gid=0").  
   - Ensure your sheet has a column named `Domain` with domain names as values.  
   - Connect output of Manual Trigger to this node.

3. **Add HTTP Request Node to Query BuiltWith API**  
   - Add node: HTTP Request  
   - Set method to GET.  
   - URL: `https://api.builtwith.com/v21/api.json`  
   - Add query parameters:  
     - `KEY` = Your BuiltWith API key (replace placeholder)  
     - `LOOKUP` = Expression: `{{$json["Domain"]}}` (dynamically inserts domain from previous node).  
   - Connect output of Google Sheets node to this HTTP Request node.

4. **Add Code Node to Extract Technology Data**  
   - Add node: Code (JavaScript)  
   - Paste the following JS code (adjusted for your environment if needed):  
     ```javascript
     const result = $json.Results?.[0];
     const domain = result?.Lookup || null;
     const path = result?.Result?.Paths?.[0];
     const url = path?.Url || null;

     let extracted = null;

     for (const group of path?.Groups || []) {
       const category = group.Name;
       const tech = group.Tech?.[0];

       if (tech) {
         extracted = {
           Technology: tech.Name,
           Category: category,
           "First Detected": tech.FirstDetected,
           "Last Detected": tech.LastDetected,
           Domain: domain,
           URL: url
         };
         break;
       }
     }

     return extracted ? [extracted] : [];
     ```  
   - This extracts one technology per domain for simplicity.  
   - Connect output of HTTP Request node to this Code node.

5. **Add Trello Node to Create Cards**  
   - Add node: Trello  
   - Configure credentials with your Trello OAuth account.  
   - Set operation to create card.  
   - Set card name to a fixed string like "Scan BuiltWith Results".  
   - Use the description field to insert key details with expressions, e.g.:  
     ```
     Domain: {{ $json.Domain }}
     Technology: {{ $json.Technology }}
     Category: {{ $json.Category }}
     First Detected: {{ $json["First Detected"] }}
     Last Detected: {{ $json["Last Detected"] }}
     URL: {{ $json.URL }}
     ```  
   - Optionally set due date and member IDs or leave blank.  
   - Connect output of Code node to this Trello node.

6. **Final Connections and Testing**  
   - Verify connections:  
     Manual Trigger → Google Sheets → HTTP Request → Code → Trello  
   - Test workflow by clicking Manual Trigger “Execute Node”.  
   - Check Trello board for created cards.

7. **Optional Enhancements**  
   - Replace Manual Trigger with Cron node for scheduled runs.  
   - Add error handling nodes and delays (Wait) to respect API limits.  
   - Customize Trello card fields, add labels or checklists as needed.  
   - Modify Code node to extract multiple technologies per domain if desired.

---

### 5. General Notes & Resources

| Note Content                                                                                                                             | Context or Link                                                       |
|------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| For any questions or support, contact: Yaron@nofluff.online                                                                             | Workflow assistance contact                                          |
| Explore more tips and tutorials here: YouTube: https://www.youtube.com/@YaronBeen/videos LinkedIn: https://www.linkedin.com/in/yaronbeen/ | Author’s social media and video resources                             |
| To analyze more domains, simply add them to the Google Sheet and rerun the workflow                                                      | Workflow usage tip                                                   |
| To automate runs, replace Manual Trigger with Cron node and set desired schedule                                                        | Automation enhancement advice                                        |
| Consider API limits from BuiltWith: add `Wait` nodes or batch processing for large domain lists                                           | Best practice for API rate limiting                                  |
| Modify the Code node to extract all technologies per domain for richer data                                                              | Customization tip                                                   |
| Trello board and list must be pre-configured to receive cards; adjust Trello node accordingly                                            | Integration prerequisite                                            |

---

**Disclaimer:** The provided text is exclusively derived from an automated workflow created with n8n, a no-code integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.