Audit Google Drive File Permissions for Access Control Management

https://n8nworkflows.xyz/workflows/audit-google-drive-file-permissions-for-access-control-management-3549


# Audit Google Drive File Permissions for Access Control Management

### 1. Workflow Overview

This workflow automates the auditing of Google Drive file permissions to identify files with excessively open access, such as public sharing ("anyone with the link") or sharing with external users outside a trusted domain. It is designed for organizations or individuals seeking to improve their security posture by regularly reviewing and reporting on potentially risky file sharing settings.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger & Report Initialization**: Automatically triggers the audit daily and creates a new Google Sheet tab to store the audit results.
- **1.2 Fetch and Filter Google Drive Files**: Retrieves recently modified Google Drive documents and filters those with risky sharing permissions.
- **1.3 Data Transformation & Aggregation**: Processes the permissions data into a normalized tabular format suitable for reporting.
- **1.4 Report Storage & Notification**: Appends the processed data to the created Google Sheet and sends an email report summarizing the audit findings.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Report Initialization

**Overview:**  
This block sets the workflow to run automatically every day at 6 AM and creates a new sheet within a designated Google Sheets document to store that day's audit results.

**Nodes Involved:**  
- Schedule Trigger  
- Create New Sheet  
- Sticky Note (explanatory)

**Node Details:**

- **Schedule Trigger**  
  - *Type:* Scheduled Trigger  
  - *Role:* Initiates the workflow daily at 6 AM.  
  - *Configuration:* Set to trigger once daily at hour 6.  
  - *Input/Output:* No input; outputs trigger event to "Create New Sheet".  
  - *Edge Cases:* Misconfiguration could cause missed or multiple runs. Timezone considerations may affect trigger time.

- **Create New Sheet**  
  - *Type:* Google Sheets node (Create operation)  
  - *Role:* Creates a new sheet named with the current date (format: audit-yyyyMMdd) inside a fixed Google Sheets document.  
  - *Configuration:* Uses a fixed Google Sheets document ID; sheet title dynamically generated using current date.  
  - *Input/Output:* Receives trigger from Schedule Trigger; outputs sheet metadata (spreadsheetId, sheetId) for downstream use.  
  - *Credentials:* Requires Google Sheets OAuth2 credentials.  
  - *Edge Cases:* API quota limits, permission errors, or invalid document ID could cause failures.

- **Sticky Note**  
  - *Role:* Provides documentation about the scheduled trigger and audit sheet creation.  
  - *Content:* Explains the daily trigger and links to example audit sheet and n8n docs.

---

#### 1.2 Fetch and Filter Google Drive Files

**Overview:**  
This block retrieves all Google Drive documents modified in the last day and filters those with sharing permissions that pose potential security risks, specifically files shared publicly or with external users outside the trusted domain.

**Nodes Involved:**  
- Get Recently Active Documents  
- Has Shared with External Users (Filter)  
- For Each File (Split in Batches)  
- File Ref (NoOp)  
- Permissions To Items (Split Out)  
- Filter Out Owner of Document (Filter)  
- Sticky Note (explanatory)

**Node Details:**

- **Get Recently Active Documents**  
  - *Type:* Google Drive node (File/Folder resource, Query search)  
  - *Role:* Fetches Google Docs, Sheets, and Slides modified in the last 24 hours, including their permissions and sharing info.  
  - *Configuration:* Query filters files modified after current time minus 1 day, excludes trashed files, and limits to specific mime types.  
  - *Input/Output:* Triggered by "Create New Sheet"; outputs file list with metadata and permissions.  
  - *Credentials:* Requires Google Drive OAuth2 credentials.  
  - *Edge Cases:* API rate limits, permission errors, or empty results if no recent files.

- **Has Shared with External Users**  
  - *Type:* Filter node  
  - *Role:* Filters files that are either shared publicly ("anyone" permission) or shared with external users outside the domain "example.com".  
  - *Configuration:* Uses expressions to check if any permission is of type "anyone" or if any emailAddress does not end with "example.com".  
  - *Input/Output:* Receives files from "Get Recently Active Documents"; outputs filtered files to "For Each File".  
  - *Edge Cases:* Expression errors if permissions data is missing or malformed.

- **For Each File**  
  - *Type:* Split In Batches  
  - *Role:* Processes each file individually in batches for downstream processing.  
  - *Input/Output:* Receives filtered files; outputs each file one by one to "File Ref" and "Flatten Rows".  
  - *Edge Cases:* Large batch sizes may cause performance issues.

- **File Ref**  
  - *Type:* NoOp  
  - *Role:* Acts as a reference node to pass file data downstream without modification.  
  - *Input/Output:* Receives file from "For Each File"; outputs to "Permissions To Items".  
  - *Edge Cases:* None.

- **Permissions To Items**  
  - *Type:* Split Out  
  - *Role:* Splits the permissions array of each file into individual items for detailed processing.  
  - *Configuration:* Splits on the "permissions" field.  
  - *Input/Output:* Receives file from "File Ref"; outputs individual permission entries to "Filter Out Owner of Document".  
  - *Edge Cases:* Files without permissions field may cause empty outputs.

- **Filter Out Owner of Document**  
  - *Type:* Filter  
  - *Role:* Filters out permission entries where the role is "owner" to focus on other users' permissions.  
  - *Configuration:* Condition excludes items where role equals "owner".  
  - *Input/Output:* Receives permissions; outputs non-owner permissions to "Normalise Fields".  
  - *Edge Cases:* Permissions without role field may cause filtering issues.

- **Sticky Note**  
  - *Role:* Documents the purpose of this block and provides a link to Google Drive node documentation.

---

#### 1.3 Data Transformation & Aggregation

**Overview:**  
This block normalizes the permissions data into a structured format, aggregates it, and prepares it for appending to the audit sheet.

**Nodes Involved:**  
- Normalise Fields (Set)  
- Aggregate  
- Flatten Rows (Set)  
- Rows to Items (Split Out)  
- Sticky Note (explanatory)

**Node Details:**

- **Normalise Fields**  
  - *Type:* Set node  
  - *Role:* Extracts and renames key fields from the permission items and associated file metadata to a consistent schema.  
  - *Configuration:* Assigns fields such as file_id, file_name, type (permission type), user_id, user (email), and role using expressions referencing upstream nodes.  
  - *Input/Output:* Receives filtered permission items; outputs normalized data to "Aggregate".  
  - *Edge Cases:* Missing fields in input JSON may cause empty or incorrect values.

- **Aggregate**  
  - *Type:* Aggregate node  
  - *Role:* Aggregates all normalized permission items into a single data array for batch processing.  
  - *Configuration:* Uses "aggregateAllItemData" to collect all items into one.  
  - *Input/Output:* Receives normalized items; outputs aggregated data to "For Each File".  
  - *Edge Cases:* Large datasets may cause memory or performance issues.

- **Flatten Rows**  
  - *Type:* Set node  
  - *Role:* Flattens the aggregated data arrays into a single array named "rows" for easier splitting.  
  - *Configuration:* Uses expression to flatten all input data arrays into one array.  
  - *Input/Output:* Receives batch data; outputs flattened rows to "Rows to Items".  
  - *Edge Cases:* Empty input arrays result in empty output.

- **Rows to Items**  
  - *Type:* Split Out  
  - *Role:* Splits the "rows" array into individual items for appending to the sheet.  
  - *Configuration:* Splits on the "rows" field.  
  - *Input/Output:* Receives flattened rows; outputs individual rows to "Append to New Sheet".  
  - *Edge Cases:* Empty rows array results in no output.

- **Sticky Note**  
  - *Role:* Explains the data transformation steps and links to Split Out node documentation.

---

#### 1.4 Report Storage & Notification

**Overview:**  
This block appends the normalized permission data to the newly created Google Sheet and sends an email report summarizing the audit findings.

**Nodes Involved:**  
- Append to New Sheet  
- Send Email Report (Execute Once)  
- Sticky Note (explanatory)

**Node Details:**

- **Append to New Sheet**  
  - *Type:* Google Sheets node (Append operation)  
  - *Role:* Appends the normalized permission rows to the sheet created at the start of the workflow.  
  - *Configuration:* Uses dynamic sheet ID and spreadsheet ID from "Create New Sheet" node outputs; auto-maps input data columns to sheet columns.  
  - *Input/Output:* Receives individual rows; outputs success confirmation to "Send Email Report".  
  - *Credentials:* Requires Google Sheets OAuth2 credentials.  
  - *Edge Cases:* API limits, permission errors, or invalid sheet IDs may cause failures.

- **Send Email Report (Execute Once)**  
  - *Type:* Gmail node  
  - *Role:* Sends a summary email with links to the audit report and lists of files shared publicly or with external users.  
  - *Configuration:*  
    - Recipient hardcoded as "jim@example.com" (should be customized).  
    - Subject includes current date.  
    - Message body dynamically lists files by sharing type with links to the Google Sheets report and the files themselves.  
    - Appends n8n attribution.  
  - *Input/Output:* Receives confirmation from "Append to New Sheet".  
  - *Credentials:* Requires Gmail OAuth2 credentials.  
  - *Edge Cases:* Email sending failures due to auth errors, quota limits, or invalid recipient address.

- **Sticky Note**  
  - *Role:* Describes the final reporting and notification steps with a link to Gmail node documentation.

---

### 3. Summary Table

| Node Name                    | Node Type               | Functional Role                              | Input Node(s)                  | Output Node(s)                  | Sticky Note                                                                                                          |
|------------------------------|-------------------------|----------------------------------------------|-------------------------------|--------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Schedule Trigger              | Scheduled Trigger       | Triggers workflow daily at 6 AM               | -                             | Create New Sheet                | See note: Scheduled Trigger runs daily and creates new audit sheet.                                                  |
| Create New Sheet              | Google Sheets           | Creates new sheet tab for daily audit         | Schedule Trigger              | Get Recently Active Documents   | See note: Creates dated sheet in fixed Google Sheets document.                                                       |
| Get Recently Active Documents | Google Drive            | Fetches recently modified Google Drive files  | Create New Sheet              | Has Shared with External Users  | See note: Fetches files modified in last day with permissions info.                                                  |
| Has Shared with External Users| Filter                  | Filters files shared publicly or externally   | Get Recently Active Documents | For Each File                  | See note: Filters files with risky sharing permissions.                                                              |
| For Each File                | Split In Batches        | Processes each file individually               | Has Shared with External Users| Flatten Rows, File Ref          | See note: Processes files one by one.                                                                                |
| File Ref                    | NoOp                    | Passes file data downstream                     | For Each File                 | Permissions To Items            |                                                                                                                      |
| Permissions To Items         | Split Out               | Splits permissions array into individual items | File Ref                      | Filter Out Owner of Document    |                                                                                                                      |
| Filter Out Owner of Document | Filter                  | Excludes owner permissions                      | Permissions To Items          | Normalise Fields                |                                                                                                                      |
| Normalise Fields             | Set                     | Normalizes and renames fields for reporting    | Filter Out Owner of Document  | Aggregate                      |                                                                                                                      |
| Aggregate                   | Aggregate               | Aggregates all normalized permission items     | Normalise Fields              | For Each File                  |                                                                                                                      |
| Flatten Rows                | Set                     | Flattens aggregated data into single array     | For Each File                 | Rows to Items                  | See note: Prepares data rows for appending to sheet.                                                                 |
| Rows to Items               | Split Out               | Splits rows array into individual items         | Flatten Rows                  | Append to New Sheet            |                                                                                                                      |
| Append to New Sheet         | Google Sheets           | Appends normalized data to audit sheet          | Rows to Items                 | Send Email Report (Execute Once)|                                                                                                                      |
| Send Email Report (Execute Once) | Gmail               | Sends email summary report                       | Append to New Sheet           | -                              | See note: Sends audit report email with links and file lists.                                                       |
| Sticky Note                 | Sticky Note             | Documentation notes                             | -                             | -                              | Multiple sticky notes provide detailed explanations and links for each block.                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Scheduled Trigger node**  
   - Set to trigger daily at 6 AM (hour 6).  
   - No credentials needed.

2. **Add a Google Sheets node (Create operation)**  
   - Operation: Create Sheet  
   - Document ID: Use your Google Sheets audit report document ID.  
   - Title: Set to `audit-{{ $now.format('yyyyMMdd') }}` to create a new sheet named by date.  
   - Connect Scheduled Trigger output to this node.  
   - Configure Google Sheets OAuth2 credentials.

3. **Add a Google Drive node (File/Folder resource, Query search)**  
   - Operation: Search  
   - Query: `modifiedTime > '{{ $now.minus({ 'days': 1 })}}' and trashed = false`  
   - File Types: Google Docs, Sheets, and Slides mime types.  
   - Fields: Include permissions, shared, name, id, kind, mimeType.  
   - Connect output of "Create New Sheet" to this node.  
   - Configure Google Drive OAuth2 credentials.

4. **Add a Filter node ("Has Shared with External Users")**  
   - Condition: OR  
     - Expression 1: `{{$json.shared && $json.permissions.some(item => item.emailAddress ? !item.emailAddress.endsWith('example.com') : false)}}` is true  
     - Expression 2: `{{$json.permissions.find(item => item.type === 'anyone')}}` exists  
   - Connect output of Google Drive node to this filter.

5. **Add a Split In Batches node ("For Each File")**  
   - No special batch size configured (default).  
   - Connect output of Filter node to this node.

6. **Add a NoOp node ("File Ref")**  
   - Connect output of "For Each File" to this node.

7. **Add a Split Out node ("Permissions To Items")**  
   - Field to split out: `permissions`  
   - Connect output of "File Ref" to this node.

8. **Add a Filter node ("Filter Out Owner of Document")**  
   - Condition: AND  
     - Role field does not equal "owner"  
   - Connect output of "Permissions To Items" to this node.

9. **Add a Set node ("Normalise Fields")**  
   - Assign fields:  
     - file_id = `{{$node["File Ref"].item.json.id}}`  
     - file_name = `{{$node["File Ref"].item.json.name}}`  
     - type = `{{$json.type}}`  
     - user_id = `{{$json.id}}`  
     - user = `{{$json.emailAddress || 'n/a'}}`  
     - role = `{{$json.role}}`  
   - Connect output of "Filter Out Owner of Document" to this node.

10. **Add an Aggregate node ("Aggregate")**  
    - Aggregate all item data.  
    - Connect output of "Normalise Fields" to this node.

11. **Add a Split In Batches node ("For Each File")**  
    - Connect output of "Aggregate" to this node.

12. **Add a Set node ("Flatten Rows")**  
    - Assign field "rows" as:  
      `{{$input.all().flatMap(item => item.json.data)}}`  
    - Execute once.  
    - Connect output of "For Each File" to this node.

13. **Add a Split Out node ("Rows to Items")**  
    - Field to split out: `rows`  
    - Connect output of "Flatten Rows" to this node.

14. **Add a Google Sheets node ("Append to New Sheet")**  
    - Operation: Append  
    - Document ID: `{{$node["Create New Sheet"].first().json.spreadsheetId}}`  
    - Sheet Name: `{{$node["Create New Sheet"].first().json.sheetId}}`  
    - Columns: Map file_id, file_name, type, user_id, user, role automatically.  
    - Connect output of "Rows to Items" to this node.  
    - Configure Google Sheets OAuth2 credentials.

15. **Add a Gmail node ("Send Email Report (Execute Once)")**  
    - Recipient: Set to your email (e.g., "jim@example.com")  
    - Subject: `GDrive Audit for {{ $now.format('yyyy-MM-dd') }}`  
    - Message: Include dynamic lists of files shared publicly and externally with links to the audit sheet and files.  
    - Append n8n attribution.  
    - Execute once.  
    - Connect output of "Append to New Sheet" to this node.  
    - Configure Gmail OAuth2 credentials.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Context or Link                                                                                              |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| This workflow automates Google Drive file permission audits to improve security posture by identifying files with overly permissive sharing settings. It is designed for daily execution but can be customized for other intervals.                                                                                                                                                                                                                                                                                                                                                                                           | Workflow purpose and usage summary                                                                           |
| Example audit report spreadsheet: [https://docs.google.com/spreadsheets/d/1V2aiLhp3_nH7EBniMn7D0kFHg7-A5NjpDZXMhb4F5UI/edit?gid=503992967](https://docs.google.com/spreadsheets/d/1V2aiLhp3_nH7EBniMn7D0kFHg7-A5NjpDZXMhb4F5UI/edit?gid=503992967)                                                                                                                                                                                                                                                                                                                                                              | Example audit report                                                                                          |
| Scheduled Trigger node documentation: [https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger)                                                                                                                                                                                                                                                                                                                                                                                                                     | Scheduled Trigger node docs                                                                                   |
| Google Drive node documentation: [https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googledrive](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googledrive)                                                                                                                                                                                                                                                                                                                                                                                                                                   | Google Drive node docs                                                                                        |
| Split Out node documentation: [https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.splitout](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.splitout)                                                                                                                                                                                                                                                                                                                                                                                                                                         | Split Out node docs                                                                                           |
| Gmail node documentation: [https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/)                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Gmail node docs                                                                                              |
| For organizations not using Google Drive, similar workflows can be implemented using Microsoft SharePoint or Dropbox with equivalent nodes and APIs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Alternative platform suggestions                                                                              |
| Consider implementing allowlists for trusted domains to reduce false positives in external sharing detection.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Security best practice                                                                                         |
| This workflow can be extended to automatically remediate permissions by resetting overly permissive sharing settings and notifying users afterward.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Workflow customization idea                                                                                   |
| Join the n8n community for support: Discord [https://discord.com/invite/XPKeKXeB7d](https://discord.com/invite/XPKeKXeB7d), Forum [https://community.n8n.io/](https://community.n8n.io/)                                                                                                                                                                                                                                                                                                                                                                                                                                        | Community support links                                                                                       |

---

This comprehensive documentation enables advanced users and AI agents to understand, reproduce, and customize the Google Drive permissions audit workflow effectively, while anticipating potential issues and integration requirements.