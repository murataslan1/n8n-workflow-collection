Automate Inactive Deal Cleanup from GoHighLevel to Slack and Sheets

https://n8nworkflows.xyz/workflows/automate-inactive-deal-cleanup-from-gohighlevel-to-slack-and-sheets-10325


# Automate Inactive Deal Cleanup from GoHighLevel to Slack and Sheets

### 1. Workflow Overview

This workflow automates the cleanup of inactive deals in GoHighLevel CRM by archiving those that have had no activity for over 10 days. It runs daily, ensuring pipelines remain focused and uncluttered by outdated opportunities. The workflow also maintains an audit trail by logging actions to Google Sheets and sends a summary report to a Slack channel for team visibility.

Logical blocks:

- **1.1 Schedule Trigger:** Initiates the workflow daily at 9 AM.
- **1.2 Data Retrieval:** Fetches all opportunities from HighLevel CRM.
- **1.3 Inactivity Filtering:** Filters deals inactive for more than 10 days.
- **1.4 Archiving:** Archives the filtered inactive deals in HighLevel.
- **1.5 Data Processing:** Formats and enriches deal data for logging.
- **1.6 Logging:** Appends or updates the processed deal data in Google Sheets.
- **1.7 Notification:** Sends a summary report to Slack with archived deal details.

---

### 2. Block-by-Block Analysis

#### 1.1 Schedule Trigger

- **Overview:**  
  Triggers the workflow execution every day at 9 AM to perform the cleanup process.

- **Nodes Involved:**  
  - Daily at 9 AM  
  - Schedule Setup (sticky note)

- **Node Details:**

  - **Daily at 9 AM**  
    - Type: Schedule Trigger  
    - Configuration: Default cron interval set to run daily at 9 AM (can be modified via Schedule Setup note).  
    - Inputs: None (trigger node)  
    - Outputs: Initiates "Fetch All Opportunities" node  
    - Edge Cases: Misconfigured cron expressions may cause missed or multiple triggers.  
    - Version: 1.2

  - **Schedule Setup (Sticky Note)**  
    - Purpose: Provides instructions for modifying the schedule trigger timing.  
    - No execution role.

---

#### 1.2 Data Retrieval

- **Overview:**  
  Retrieves all current opportunities from GoHighLevel CRM including contact data, needed for further processing.

- **Nodes Involved:**  
  - Fetch All Opportunities  
  - HighLevel Configuration (sticky note)

- **Node Details:**

  - **Fetch All Opportunities**  
    - Type: GoHighLevel API node  
    - Operation: `getAll` on `opportunity` resource  
    - Configuration: No filters applied; fetches all opportunities.  
    - Credentials: Requires OAuth2 credentials with a location ID configured.  
    - Inputs: Trigger from schedule node  
    - Outputs: Passes data to inactivity filter node  
    - Edge Cases:  
      - Authentication errors if OAuth token expired or misconfigured  
      - Large data sets may cause timeout depending on HighLevel API limits  
    - Version: 2

  - **HighLevel Configuration (Sticky Note)**  
    - Details OAuth2 credential setup requirements and data fetched.  
    - No execution role.

---

#### 1.3 Inactivity Filtering

- **Overview:**  
  Filters the fetched deals to isolate those with no activity for more than 10 days, based on last action date or update timestamp.

- **Nodes Involved:**  
  - Filter Deals Inactive 10+ Days  
  - Filter Logic (sticky note)

- **Node Details:**

  - **Filter Deals Inactive 10+ Days**  
    - Type: Filter node  
    - Condition:  
      - Calculates days since last activity: `Math.floor((currentDate - lastActionDate or updatedAt)/ (milliseconds in one day))`  
      - Filters deals where days inactive > 10  
    - Inputs: Output from Fetch All Opportunities  
    - Outputs: Passes filtered inactive deals to archiving node  
    - Edge Cases:  
      - Deals missing both `lastActionDate` and `updatedAt` fields may cause expression evaluation issues  
      - Timezone differences might impact day calculation  
    - Version: 2

  - **Filter Logic (Sticky Note)**  
    - Explains the inactivity threshold and how to adjust it by changing the numeric value in the filter node.  
    - No execution role.

---

#### 1.4 Archiving

- **Overview:**  
  Updates the status of inactive deals in HighLevel CRM to mark them as archived, preserving deal details but removing them from active pipelines.

- **Nodes Involved:**  
  - Archive Inactive Deal  
  - Archive Configuration (sticky note)

- **Node Details:**

  - **Archive Inactive Deal**  
    - Type: GoHighLevel API node  
    - Operation: `update` on `opportunity` resource  
    - Configuration: Sets `status` field to `"archived"` (configurable)  
    - Uses expression to specify `opportunityId` from filtered deal JSON  
    - Inputs: Output from inactivity filter  
    - Outputs: Passes updated deals to data processing node  
    - Credentials: OAuth2 with HighLevel  
    - Edge Cases:  
      - API rate limits or update failures may cause partial archiving  
      - Status field must match HighLevel's accepted values or the update will fail  
    - Version: 2

  - **Archive Configuration (Sticky Note)**  
    - Advises on ensuring the `status` field matches your HighLevel setup (e.g., "archived", "lost", "closed").

---

#### 1.5 Data Processing

- **Overview:**  
  Enhances and formats deal data after archiving for consistent logging and reporting, calculating inactivity days and extracting key fields.

- **Nodes Involved:**  
  - Format Deal Data (Code node)  
  - Processing Logic (sticky note)

- **Node Details:**

  - **Format Deal Data**  
    - Type: Code (JavaScript) node  
    - Function:  
      - Maps each input deal to a formatted object with fields: id, name, pipelineId, pipelineStageId, contactId, contactName, lastActionDate, updatedAt, daysSinceActivity, isInactive, monetaryValue, source, tags, archivedAt (current timestamp)  
      - Calculates days inactive similarly as in filter node  
      - Joins contact tags into a comma-separated string  
    - Inputs: From Archive Inactive Deal node  
    - Outputs: To Google Sheets logging and Slack reporting nodes  
    - Edge Cases:  
      - Missing contact or tag data handled gracefully with defaults ("N/A", empty string)  
      - Date parsing errors if invalid date strings present  
    - Version: 2

  - **Processing Logic (Sticky Note)**  
    - Describes the transformation steps and output fields for downstream use.

---

#### 1.6 Logging

- **Overview:**  
  Appends or updates the processed deal records in a dedicated Google Sheet to maintain an audit trail of archived inactive deals.

- **Nodes Involved:**  
  - Log to Google Sheets  
  - Sheets Configuration (sticky note)

- **Node Details:**

  - **Log to Google Sheets**  
    - Type: Google Sheets node  
    - Operation: Append or update records in sheet named "Inactive Pipeliner"  
    - Configuration:  
      - Auto-maps columns based on input JSON fields (id, name, contactName, daysSinceActivity, monetaryValue, source, tags, archivedAt)  
      - Uses `id` column for matching existing rows to update or append new ones  
      - Document ID dynamically taken from Workflow Description sticky note's JSON field `sheetId`  
    - Inputs: Formatted deal data from code node  
    - Credentials: Google OAuth2  
    - Edge Cases:  
      - OAuth token expiry or permission issues can block data writing  
      - Mismatched or missing `sheetId` parameter will cause failures  
      - Rate limits on Google Sheets API may apply  
    - Version: 4.7

  - **Sheets Configuration (Sticky Note)**  
    - Lists setup steps for the Google Sheet and credentials, plus expected columns.

---

#### 1.7 Notification

- **Overview:**  
  Sends a summary Slack message after completion, reporting the total archived deals, combined monetary value, and a list of archived deals for team awareness.

- **Nodes Involved:**  
  - Send Slack Report  
  - Slack Setup (sticky note)

- **Node Details:**

  - **Send Slack Report**  
    - Type: Slack node  
    - Configuration:  
      - Message text includes: current date, total deals archived, total monetary value formatted with thousands separator, and numbered list of deal names  
      - Channel ID dynamically taken from Workflow Description sticky note's JSON field `slackChannel`  
    - Inputs: From Format Deal Data node (shares data with Google Sheets node)  
    - Credentials: Slack OAuth2  
    - Edge Cases:  
      - Missing or incorrect Slack channel ID causes message failure  
      - OAuth token expiry or revoked permissions block sending  
      - Large messages may hit Slack API limits or formatting issues  
    - Version: 2.1

  - **Slack Setup (Sticky Note)**  
    - Provides setup instructions for Slack OAuth2 connection and channel selection.

---

### 3. Summary Table

| Node Name                  | Node Type           | Functional Role                 | Input Node(s)             | Output Node(s)                    | Sticky Note                                                                                          |
|----------------------------|---------------------|--------------------------------|---------------------------|---------------------------------|----------------------------------------------------------------------------------------------------|
| Workflow Description       | Sticky Note         | Overview and instructions       |                           |                                 | ## 🎯 Workflow Overview This workflow automatically identifies and archives inactive deals...     |
| Schedule Setup             | Sticky Note         | Instructions for scheduling     |                           |                                 | ## ⏰ Schedule Configuration Current: Runs daily at 9 AM To modify: ...                            |
| Daily at 9 AM              | Schedule Trigger    | Trigger workflow daily at 9 AM |                           | Fetch All Opportunities          |                                                                                                    |
| HighLevel Configuration    | Sticky Note         | Instructions for HighLevel API  |                           |                                 | ## 📊 HighLevel Setup Required OAuth2 credentials configured Location ID in credential settings... |
| Fetch All Opportunities    | HighLevel API       | Retrieves all opportunities     | Daily at 9 AM             | Filter Deals Inactive 10+ Days   |                                                                                                    |
| Filter Logic               | Sticky Note         | Explanation of inactivity filter|                           |                                 | ## 🔍 Inactivity Filter Logic: calculates days since last activity Threshold: 10 days ...         |
| Filter Deals Inactive 10+ Days | Filter           | Filters deals inactive >10 days | Fetch All Opportunities   | Archive Inactive Deal            |                                                                                                    |
| Archive Configuration      | Sticky Note         | Archive action instructions     |                           |                                 | ## 📦 Archive Action Updates opportunity status Marks as archived/closed Preserve all deal data... |
| Archive Inactive Deal      | HighLevel API       | Archives inactive deals         | Filter Deals Inactive 10+ Days | Format Deal Data              |                                                                                                    |
| Processing Logic           | Sticky Note         | Data processing explanation     |                           |                                 | ## 🧮 Data Processing Transforms deal data Calculates days inactive Extracts contact info ...      |
| Format Deal Data           | Code (JavaScript)   | Formats deals for logging       | Archive Inactive Deal      | Log to Google Sheets, Send Slack Report |                                                                                              |
| Sheets Configuration       | Sticky Note         | Google Sheets setup instructions|                           |                                 | ## 📋 Google Sheets Setup Required: Create Sheet Add sheet named "Inactive Pipeliner" ...          |
| Log to Google Sheets       | Google Sheets       | Logs deals to Google Sheet      | Format Deal Data          |                                 |                                                                                                    |
| Slack Setup                | Sticky Note         | Slack notification setup        |                           |                                 | ## 💬 Slack Notification Setup: Connect Slack OAuth2 Select channel Remove hardcoded channel ID... |
| Send Slack Report          | Slack               | Sends summary Slack message     | Format Deal Data          |                                 |                                                                                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n named "Automate Inactive Deal Cleanup from GoHighLevel to Slack and Sheets."

2. **Add a Schedule Trigger node:**
   - Name: "Daily at 9 AM"  
   - Type: Schedule Trigger  
   - Configure to run daily at 9 AM using cron expression `0 9 * * *`.

3. **Add a HighLevel node to fetch opportunities:**
   - Name: "Fetch All Opportunities"  
   - Type: HighLevel  
   - Set Resource: `opportunity`  
   - Operation: `getAll`  
   - Credentials: Use OAuth2 credentials configured for HighLevel with Location ID set.  
   - Connect "Daily at 9 AM" output to this node input.

4. **Add a Filter node to identify inactive deals:**
   - Name: "Filter Deals Inactive 10+ Days"  
   - Type: Filter  
   - Condition:  
     - Left Value: `={{ Math.floor((new Date() - new Date($json.lastActionDate || $json.updatedAt)) / (1000 * 60 * 60 * 24)) }}`  
     - Operator: Greater Than (`gt`)  
     - Right Value: `10`  
   - Connect "Fetch All Opportunities" output to this filter input.

5. **Add a HighLevel node to archive deals:**
   - Name: "Archive Inactive Deal"  
   - Type: HighLevel  
   - Resource: `opportunity`  
   - Operation: `update`  
   - Set `updateFields` to `{ "status": "archived" }` (adjust status field as per your HighLevel setup).  
   - Set `opportunityId` to `={{ $json.id }}` using expression.  
   - Credentials: Same HighLevel OAuth2 credentials.  
   - Connect "Filter Deals Inactive 10+ Days" output to this node input.

6. **Add a Code node to format deal data:**
   - Name: "Format Deal Data"  
   - Type: Code (JavaScript)  
   - Insert the following JavaScript code:
     ```js
     const formattedData = $input.all().map(item => {
       const opp = item.json;
       const lastActivity = new Date(opp.lastActionDate || opp.updatedAt);
       const daysSinceActivity = Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24));
       
       return {
         json: {
           id: opp.id,
           name: opp.name,
           pipelineId: opp.pipelineId,
           pipelineStageId: opp.pipelineStageId,
           contactId: opp.contactId,
           contactName: opp.contact?.name || 'N/A',
           lastActionDate: opp.lastActionDate,
           updatedAt: opp.updatedAt,
           daysSinceActivity: daysSinceActivity,
           isInactive: daysSinceActivity > 10,
           monetaryValue: opp.monetaryValue || 0,
           source: opp.source || 'Unknown',
           tags: Array.isArray(opp.contact?.tags) ? opp.contact.tags.join(', ') : '',
           archivedAt: new Date().toISOString()
         }
       };
     });
     return formattedData;
     ```
   - Connect "Archive Inactive Deal" output to this node input.

7. **Add a Google Sheets node to log data:**
   - Name: "Log to Google Sheets"  
   - Type: Google Sheets  
   - Operation: Append or Update  
   - Sheet Name: "Inactive Pipeliner"  
   - Document ID: Use your Google Sheet ID for the target spreadsheet.  
   - Columns to map: id, name, contactName, daysSinceActivity, monetaryValue, source, tags, archivedAt  
   - Matching column for updates: id  
   - Credentials: Google OAuth2 with appropriate access.  
   - Connect "Format Deal Data" output to this node input.

8. **Add a Slack node to send a report:**
   - Name: "Send Slack Report"  
   - Type: Slack  
   - Message Text:
     ```
     =:bookmark_tabs: *Inactive Pipeline Cleaner Report*

     *Date:* {{ $now.format('MMMM dd, yyyy') }}
     *Total Deals Archived:* {{ $json.count }}
     *Total Monetary Value:* ${{ $json.totalValue.toLocaleString() }}

     *Archived Deals:*
     {{ $json.dealsList.split(',').map((deal, idx) => `${idx + 1}. ${deal.trim()}`).join('\n') }}
     ```
   - Channel: Select your Slack channel dynamically or hardcode channel ID.  
   - Credentials: Slack OAuth2 with posting permissions.  
   - Connect "Format Deal Data" output to this node input.

9. **Add Sticky Notes in the workflow to describe:**
   - Workflow overview and business value.  
   - Schedule configuration instructions.  
   - HighLevel API setup details.  
   - Inactivity filter logic and threshold adjustment.  
   - Archiving action explanation and status field info.  
   - Data processing steps and output fields.  
   - Google Sheets setup instructions.  
   - Slack setup instructions and channel configuration.

10. **Activate the workflow** and test by running manually or waiting for the next scheduled trigger.

---

### 5. General Notes & Resources

| Note Content                                                                                     | Context or Link                                                             |
|-------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------|
| This workflow keeps CRM pipelines clean by automating archival of inactive deals and logs all changes for auditability. | Workflow purpose overview in sticky note "Workflow Description"            |
| Schedule can be easily adjusted by editing the cron expression in the Schedule Trigger node.     | See "Schedule Setup" sticky note                                           |
| Ensure OAuth2 credentials for HighLevel, Google Sheets, and Slack are properly configured and have necessary API scopes. | Credentials setup across nodes                                            |
| Reference Google Sheet must exist with a sheet named "Inactive Pipeliner" and correct columns.   | See "Sheets Configuration" sticky note                                     |
| Slack message formatting uses n8n expressions and JavaScript for dynamic content.                 | See "Slack Setup" sticky note                                               |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.