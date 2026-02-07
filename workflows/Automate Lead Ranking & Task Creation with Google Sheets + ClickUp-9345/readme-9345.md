Automate Lead Ranking & Task Creation with Google Sheets + ClickUp

https://n8nworkflows.xyz/workflows/automate-lead-ranking---task-creation-with-google-sheets---clickup-9345


# Automate Lead Ranking & Task Creation with Google Sheets + ClickUp

### 1. Workflow Overview

This workflow automates lead prioritization and task creation to streamline sales or outreach follow-up efforts. It reads lead data from a Google Sheet, computes priority scores based on engagement and recency of contact, ranks leads, selects the top candidates, suggests optimal contact times based on time zones, creates corresponding tasks in ClickUp, and updates the spreadsheet with queue and status information.

Logical blocks:

- **1.1 Input Reception:** Triggering the workflow manually and reading lead data from Google Sheets.
- **1.2 Data Enrichment:** Calculating days since last contact and priority scores.
- **1.3 Lead Sorting and Filtering:** Sorting by priority score and selecting the top leads.
- **1.4 Time Optimization:** Suggesting best contact times per lead timezone.
- **1.5 Task Creation and Synchronization:** Creating tasks in ClickUp and updating Google Sheets with the latest status.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:** This initial block starts the workflow manually and fetches all lead data from a specified Google Sheet.
- **Nodes Involved:** Manual Trigger, Read Leads from Sheet, Sticky Note, Sticky Note1.

##### Manual Trigger
- **Type:** Manual Trigger node.
- **Role:** Starts the workflow on manual user initiation.
- **Configuration:** No parameters; default manual trigger.
- **Input/Output:** No inputs; outputs trigger signal to "Read Leads from Sheet".
- **Potential Failures:** None typical; user must manually trigger.

##### Read Leads from Sheet
- **Type:** Google Sheets node (v3).
- **Role:** Reads lead data from a specific Google Sheet document and sheet tab.
- **Configuration:**
  - Document ID: Points to the spreadsheet titled "Priority followup".
  - Sheet Name/GID: "Sheet1".
  - Reads all rows with columns expected: Lead Name, Last_Contact_Date, Engagement_Score, Timezone, Email, Status.
- **Credentials:** Uses Google Sheets OAuth2 credentials.
- **Input/Output:** Input from Manual Trigger; outputs lead data as JSON.
- **Edge Cases:** 
  - Permissions errors if OAuth token invalid or access revoked.
  - Empty or malformed data rows.
  - Sheet or document ID changes require node update.

##### Sticky Note (🚀 Workflow Start) & Sticky Note1 (📊 Step 1: Read Lead Data)
- **Type:** Sticky Note (documentation only).
- **Purpose:** Provide context and instructions about workflow start and lead data structure.

#### 1.2 Data Enrichment

- **Overview:** Calculates how many days have passed since last contact and computes a priority score combining engagement and recency.
- **Nodes Involved:** Calculate Days Since Contact1 (Function), Calculate Priority Score1 (Function), Sticky Note2, Sticky Note3.

##### Calculate Days Since Contact1
- **Type:** Function node.
- **Role:** For each lead, calculates the number of days elapsed since the last contact date.
- **Logic:** Parses Last_Contact_Date, subtracts from current date, adds "Days_Since_Last_Contact" field.
- **Input/Output:** Input from "Read Leads from Sheet"; output enriched lead data.
- **Edge Cases:** 
  - Invalid or missing date format can cause NaN or errors.
  - Timezone not considered; date parsing assumes consistent formatting.
- **Version Notes:** Ensure Node.js date parsing compatibility.

##### Calculate Priority Score1
- **Type:** Function node.
- **Role:** Calculates a weighted priority score per lead: 70% engagement score + 30% recency score.
- **Logic:** 
  - Engagement_Score parsed as float.
  - Recency score computed as (100 - days since contact), capped at zero minimum.
  - Priority_Score rounded integer.
- **Input/Output:** Input from previous function node; outputs lead data with Priority_Score.
- **Edge Cases:** 
  - Missing or non-numeric engagement scores default to zero.
  - Negative days or out-of-range values handled by max(0,...).

##### Sticky Note2 (⏰ Step 2: Calculate Recency) & Sticky Note3 (🎯 Step 3: Calculate Priority)
- **Documentation nodes explaining the calculations and logic.**

#### 1.3 Lead Sorting and Filtering

- **Overview:** Sorts leads by priority score descending and limits the list to top 10 leads.
- **Nodes Involved:** Sort by Priority Score (Sort), Select Top 10 Leads (Limit), Sticky Note4, Sticky Note5.

##### Sort by Priority Score
- **Type:** Sort node.
- **Role:** Orders all leads by "Priority_Score" descending.
- **Configuration:** Sort field set to Priority_Score descending.
- **Input/Output:** Input from priority score function; outputs sorted lead data.
- **Edge Cases:** Missing or equal priority scores treated as zero or tie.

##### Select Top 10 Leads
- **Type:** Limit node.
- **Role:** Limits output to top 10 leads for follow-up.
- **Configuration:** maxItems set to 10 (adjustable).
- **Input/Output:** Input sorted leads; outputs limited subset.
- **Edge Cases:** If fewer than 10 leads exist, passes all leads.

##### Sticky Note4 (📈 Step 4: Sort Leads), Sticky Note5 (🔝 Step 5: Filter Top Leads)
- **Documentation nodes explaining sorting and filtering steps.**

#### 1.4 Time Optimization

- **Overview:** Suggests an optimal send time per lead according to their timezone to maximize response rates.
- **Nodes Involved:** Suggest Optimal Send Time (Function), Sticky Note6.

##### Suggest Optimal Send Time
- **Type:** Function node.
- **Role:** Maps lead timezones to recommended send times.
- **Logic:** 
  - Checks lead's Timezone string (case insensitive).
  - Assigns suggested times: IST→10:00 AM, PST→9:00 AM, EST→9:30 AM, GMT→9:00 AM.
  - Defaults to 9:00 AM if no match.
  - Adds "Suggested_Send_Time" field.
- **Input/Output:** Input limited top leads; output enriched leads.
- **Edge Cases:** 
  - Unrecognized or missing timezone defaults to 9:00 AM.
  - Timezone string variations may cause mismatches.
- **Version Notes:** String manipulation is basic; no external timezone libraries.

##### Sticky Note6 (🕐 Step 6: Time Optimization)
- **Documentation node explaining timezone-based recommendations.**

#### 1.5 Task Creation and Synchronization

- **Overview:** Creates follow-up tasks in ClickUp for each prioritized lead and updates Google Sheets with queue status and enriched data.
- **Nodes Involved:** Create ClickUp Task (ClickUp), Update Sheet - Mark as Queued (Google Sheets), Sticky Note7, Sticky Note8.

##### Create ClickUp Task
- **Type:** ClickUp node.
- **Role:** Creates a task in a designated ClickUp list for each lead.
- **Configuration:**
  - Team, Space, List IDs configured.
  - Task name based on lead name with suffix "Priority Follow-up".
  - Additional task fields can be added via "additionalFields" (none specified here).
- **Credentials:** ClickUp API credentials configured.
- **Input/Output:** Input enriched leads with suggested send time; outputs task creation results.
- **Edge Cases:** 
  - API failures due to auth tokens or rate limits.
  - Missing required fields may cause task creation failure.

##### Update Sheet - Mark as Queued
- **Type:** Google Sheets node (v3).
- **Role:** Updates a second sheet ("Sheet2") in the same spreadsheet with lead priority scores, days since contact, suggested send times, and a queue status.
- **Configuration:**
  - Document ID same as input sheet.
  - Sheet ID corresponds to "Sheet2".
  - Data mode set to autoMapInputData, updating rows with matching keys.
- **Credentials:** Google Sheets OAuth2 credentials.
- **Input/Output:** Input from task creation output; outputs final update status.
- **Edge Cases:** 
  - Row mapping errors if keys don't match.
  - Permission or quota errors on Google Sheets API.

##### Sticky Note7 (✅ Step 7: Create Tasks), Sticky Note8 (📝 Step 8: Update Records)
- **Documentation nodes describing task creation and sheet update roles.**

---

### 3. Summary Table

| Node Name                   | Node Type               | Functional Role                         | Input Node(s)               | Output Node(s)              | Sticky Note                                                                                       |
|-----------------------------|-------------------------|---------------------------------------|-----------------------------|-----------------------------|-------------------------------------------------------------------------------------------------|
| Manual Trigger              | Manual Trigger          | Start workflow                        | None                        | Read Leads from Sheet        | ## 🚀 Workflow Start This workflow automatically identifies and queues your highest-priority leads for follow-up. |
| Read Leads from Sheet       | Google Sheets           | Read lead data from Google Sheet      | Manual Trigger              | Calculate Days Since Contact1| See note above                                                                                   |
| Calculate Days Since Contact1| Function                | Calculate days since last contact     | Read Leads from Sheet       | Calculate Priority Score1    | ## ⏰ Step 2: Calculate Recency Calculates days since last contact for each lead.               |
| Calculate Priority Score1   | Function                | Compute priority score                 | Calculate Days Since Contact1| Sort by Priority Score       | ## 🎯 Step 3: Calculate Priority Creates a Priority_Score for each lead.                        |
| Sort by Priority Score      | Sort                    | Sort leads by priority descending     | Calculate Priority Score1   | Select Top 10 Leads          | ## 📈 Step 4: Sort Leads Sorts all leads by Priority_Score in descending order.                 |
| Select Top 10 Leads         | Limit                   | Limit to top 10 leads                  | Sort by Priority Score      | Suggest Optimal Send Time    | ## 🔝 Step 5: Filter Top Leads Selects only the top 10 highest-priority leads.                  |
| Suggest Optimal Send Time   | Function                | Suggest optimal contact time           | Select Top 10 Leads         | Create ClickUp Task          | ## 🕐 Step 6: Time Optimization Suggests best time to contact each lead based on their timezone.|
| Create ClickUp Task         | ClickUp                  | Create task in ClickUp                  | Suggest Optimal Send Time   | Update Sheet - Mark as Queued| ## ✅ Step 7: Create Tasks Creates a ClickUp task for each priority lead.                       |
| Update Sheet - Mark as Queued| Google Sheets           | Update lead queue status in Sheet2     | Create ClickUp Task         | None                        | ## 📝 Step 8: Update Records Writes results back to Sheet2 with updated lead info.             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add Manual Trigger node:**  
   - No special configuration needed.

3. **Add Google Sheets node to read leads:**  
   - Operation: Read rows.  
   - Document ID: Use your Google Sheet document ID containing lead data.  
   - Sheet Name: "Sheet1" or your data sheet tab.  
   - Credentials: Set up Google Sheets OAuth2 credentials with read permission.  
   - Connect Manual Trigger → this node.

4. **Add Function node to calculate days since last contact:**  
   - Function code:
     ```javascript
     const today = new Date();
     return items.map(item => {
       const lastContact = new Date(item.json.Last_Contact_Date);
       const diffDays = Math.floor((today - lastContact) / (1000 * 60 * 60 * 24));
       item.json.Days_Since_Last_Contact = diffDays;
       return item;
     });
     ```
   - Connect "Read Leads from Sheet" → this node.

5. **Add Function node to calculate priority score:**  
   - Function code:
     ```javascript
     return items.map(item => {
       const engagement = parseFloat(item.json.Engagement_Score) || 0;
       const days = parseFloat(item.json.Days_Since_Last_Contact) || 0;
       const recencyScore = Math.max(0, 100 - days);
       item.json.Priority_Score = Math.round((engagement * 0.7) + (recencyScore * 0.3));
       return item;
     });
     ```
   - Connect previous function → this node.

6. **Add Sort node:**  
   - Sort by field: Priority_Score, order: descending.  
   - Connect priority score function → Sort node.

7. **Add Limit node:**  
   - Set maxItems to 10 (adjustable).  
   - Connect Sort node → Limit node.

8. **Add Function node to suggest optimal send time:**  
   - Function code:
     ```javascript
     return items.map(item => {
       const tz = (item.json.Timezone || '').toUpperCase();
       let suggestedTime = '9:00 AM';
       if (tz.includes('IST')) suggestedTime = '10:00 AM IST';
       else if (tz.includes('PST')) suggestedTime = '9:00 AM PST';
       else if (tz.includes('EST')) suggestedTime = '9:30 AM EST';
       else if (tz.includes('GMT')) suggestedTime = '9:00 AM GMT';
       item.json.Suggested_Send_Time = suggestedTime;
       return item;
     });
     ```
   - Connect Limit node → this node.

9. **Add ClickUp node to create tasks:**  
   - Operation: Create task.  
   - Configure team, space, and list IDs to your ClickUp workspace.  
   - Task name expression: `={{ $json.Lead_Name }} - Priority Follow-up`  
   - Credentials: Set up and select ClickUp API credentials.  
   - Connect send time function → ClickUp node.

10. **Add Google Sheets node to update queue status:**  
    - Operation: Update rows.  
    - Document ID: Same as input sheet.  
    - Sheet ID: Use the sheet ID for "Sheet2" or your target update sheet.  
    - Data mode: autoMapInputData.  
    - Credentials: Google Sheets OAuth2 credentials (write access).  
    - Connect ClickUp node → this node.

11. **Add sticky notes (optional) for documentation:**  
    - Use sticky notes to annotate workflow steps with descriptions as per the original.

12. **Test the workflow:**  
    - Manually trigger and verify lead data flows through each stage.  
    - Check ClickUp for task creation and Google Sheets for updates.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                 |
|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow automates lead prioritization to improve sales or outreach efficiency using Google Sheets and ClickUp. | Core use case for sales teams or CRM processes.                                                |
| Documentation sticky notes inside workflow provide stepwise explanations and formulas used.                    | Helpful for users modifying or auditing workflow logic.                                        |
| Adjust the "Select Top 10 Leads" node maxItems parameter to increase or decrease the number of leads queued.   | Flexible scaling according to workload or campaign size.                                      |
| Make sure OAuth credentials for Google Sheets and ClickUp are correctly set up and have sufficient permissions. | Credential misconfiguration is a common failure cause.                                        |
| Suggested send times are heuristics based on common time zones and can be extended for more regions or logic. | Timezone string matching is case insensitive but exact format matters.                         |
| For large datasets, consider API quotas and rate limits for Google Sheets and ClickUp.                         | Monitor execution logs and handle errors accordingly.                                         |

---

**Disclaimer:** The provided text is exclusively derived from an automated n8n workflow. All processed data comply strictly with applicable content policies and contain no illegal or protected content.