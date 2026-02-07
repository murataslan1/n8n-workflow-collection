Automate LinkedIn Profile Following with Google Sheets and ConnectSafely

https://n8nworkflows.xyz/workflows/automate-linkedin-profile-following-with-google-sheets-and-connectsafely-11068


# Automate LinkedIn Profile Following with Google Sheets and ConnectSafely

---
### 1. Workflow Overview

This workflow automates the process of following LinkedIn profiles by reading profile URLs from a Google Sheets document, executing follow actions via the ConnectSafely.ai LinkedIn API, and updating the sheet to reflect the completion status. It is designed for users who want to scale LinkedIn follows in a compliant and efficient manner without manual intervention.

The workflow is logically divided into three main blocks:

- **1.1 Input Reception:** Manual trigger to start the workflow.
- **1.2 Data Retrieval:** Fetches target LinkedIn profile URLs from Google Sheets.
- **1.3 Action Execution and Update:** Uses ConnectSafely.ai API to follow the profiles and updates the Google Sheet status.

Supporting notes provide guidance and context for each block.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** This block initiates the workflow manually via a trigger node.
- **Nodes Involved:**  
  - When clicking 'Execute workflow'

- **Node Details:**

  - **When clicking 'Execute workflow'**  
    - **Type:** Manual Trigger  
    - **Role:** Starts workflow execution on user command.  
    - **Configuration:** Default manual trigger with no parameters.  
    - **Input/Output:** No input; outputs trigger signal to "Get row(s) in sheet" node.  
    - **Version:** Compatible with n8n v1+.  
    - **Potential Failures:** None typical, but workflow will not run unless manually triggered.

---

#### 2.2 Data Retrieval

- **Overview:** Retrieves LinkedIn profile URLs from a specified Google Sheets document to process follow actions only on pending profiles.
- **Nodes Involved:**  
  - Get row(s) in sheet  
  - Sticky Note - Get Profiles

- **Node Details:**

  - **Get row(s) in sheet**  
    - **Type:** Google Sheets  
    - **Role:** Reads rows from the configured Google Sheet to obtain LinkedIn URLs and associated metadata.  
    - **Configuration:**  
      - Document ID: Google Sheets document with LinkedIn data.  
      - Sheet Name: "Sheet1" (gid=0).  
      - Credentials: Google Sheets OAuth2 account connected.  
      - Operation: Read rows (default).  
      - No filters set, so all rows are fetched.  
    - **Inputs:** Triggered by manual trigger output.  
    - **Outputs:** Sends data to "ConnectSafely LinkedIn" node.  
    - **Version:** v4.7 or compatible.  
    - **Edge Cases:**  
      - Authentication failure if credentials expire.  
      - Empty or malformed rows might cause errors downstream.  
      - Large sheets may require pagination or batch handling.  
    - **Sticky Note:** "Get Target Profiles - Retrieves pending LinkedIn profiles from Google Sheets."

---

#### 2.3 Action Execution and Update

- **Overview:** Processes each LinkedIn profile URL via ConnectSafely.ai API to follow the user, then updates the Google Sheet to mark the profile as processed.
- **Nodes Involved:**  
  - ConnectSafely LinkedIn  
  - Update row in sheet  
  - Sticky Note - Execute Follow  
  - Sticky Note - Update Status

- **Node Details:**

  - **ConnectSafely LinkedIn**  
    - **Type:** ConnectSafely.ai LinkedIn node (community node)  
    - **Role:** Executes a follow action on LinkedIn profiles using ConnectSafely.ai’s API.  
    - **Configuration:**  
      - Account ID: Specific ConnectSafely account identifier.  
      - Operation: "followUser" (follows the LinkedIn user).  
      - Profile ID: Dynamically mapped from Google Sheets column `LinkedIn Url` using the expression `{{ $json['LinkedIn Url'] }}`.  
      - Credentials: ConnectSafely API credentials configured.  
    - **Inputs:** Receives rows from "Get row(s) in sheet".  
    - **Outputs:** Passes execution to "Update row in sheet".  
    - **Version:** v1 of the community node.  
    - **Edge Cases:**  
      - API authentication failure or expired token.  
      - Profile ID invalid or malformed URL.  
      - API rate limits or temporary server errors.  
      - Network timeouts.  
    - **Sticky Note:** "Execute Follow Action - Processes each profile through ConnectSafely.ai API."

  - **Update row in sheet**  
    - **Type:** Google Sheets  
    - **Role:** Updates the status field of processed rows to "done" in the Google Sheet to avoid repeated processing.  
    - **Configuration:**  
      - Document ID and Sheet Name same as "Get row(s) in sheet".  
      - Operation: Update row.  
      - Columns updated:  
        - `Status` set to "done".  
        - `row_number` used as matching column to identify the precise row to update.  
      - Mapping mode: Explicit column mapping with matching on `row_number`.  
      - Credentials: Google Sheets OAuth2 account.  
    - **Inputs:** Receives data from "ConnectSafely LinkedIn" node.  
    - **Outputs:** None (workflow ends here).  
    - **Version:** v4.7 or compatible.  
    - **Edge Cases:**  
      - Failure if `row_number` is missing or incorrect.  
      - Authentication errors.  
      - Concurrent updates might cause conflict.  
    - **Sticky Note:** "Update Status - Marks processed profiles as \"done\" in spreadsheet."

---

### 3. Summary Table

| Node Name                    | Node Type                     | Functional Role                         | Input Node(s)                 | Output Node(s)               | Sticky Note                                                                                                         |
|------------------------------|-------------------------------|----------------------------------------|------------------------------|------------------------------|---------------------------------------------------------------------------------------------------------------------|
| When clicking 'Execute workflow' | Manual Trigger                | Initiates workflow execution            | None                         | Get row(s) in sheet           |                                                                                                                     |
| Get row(s) in sheet           | Google Sheets                 | Reads LinkedIn profile rows from sheet  | When clicking 'Execute workflow' | ConnectSafely LinkedIn         | Get Target Profiles - Retrieves pending LinkedIn profiles from Google Sheets                                        |
| ConnectSafely LinkedIn        | ConnectSafely.ai LinkedIn     | Executes follow action on LinkedIn      | Get row(s) in sheet           | Update row in sheet           | Execute Follow Action - Processes each profile through ConnectSafely.ai API                                         |
| Update row in sheet           | Google Sheets                 | Updates sheet row status to "done"      | ConnectSafely LinkedIn        | None                         | Update Status - Marks processed profiles as "done" in spreadsheet                                                  |
| Sticky Note - Main Overview   | Sticky Note                  | Overview and workflow instructions      | None                         | None                         | ## LinkedIn Profile Follow Automation\n\n@[youtube](b4G47AJX418)\n\nThis workflow automates following LinkedIn profiles at scale using ConnectSafely.ai's platform-compliant automation.\n\n### How it works\nThe workflow reads LinkedIn profile URLs from Google Sheets, processes each profile through ConnectSafely.ai's API to execute follow actions, and updates your spreadsheet with completion status. This eliminates manual clicking while maintaining LinkedIn's compliance standards.\n\n### Setup steps\n1. Install community node: `n8n-nodes-connectsafely.ai` (Settings > Community Nodes, then restart n8n)\n2. Prepare Google Sheet with columns: LinkedIn Url, Status, row_number\n3. Connect Google Sheets credentials and select your document\n4. Add ConnectSafely.ai API credentials from dashboard (Settings > API Keys)\n5. Map Profile ID to `{{ $json['LinkedIn Url'] }}`\n6. Configure status tracking to mark processed rows as \"done\"\n\n### Customization\n- Add delay nodes for large batches (500+ profiles)\n- Implement error handling for failed attempts\n- Extend to CRM integration or connection requests\n- Add analytics tracking for follow-back monitoring |
| Sticky Note - Get Profiles    | Sticky Note                  | Notes on profile retrieval process      | None                         | None                         | Get Target Profiles\n\nRetrieves pending LinkedIn profiles from Google Sheets                                       |
| Sticky Note - Execute Follow  | Sticky Note                  | Notes on executing follow actions       | None                         | None                         | Execute Follow Action\n\nProcesses each profile through ConnectSafely.ai API                                       |
| Sticky Note - Update Status   | Sticky Note                  | Notes on updating sheet status           | None                         | None                         | Update Status\n\nMarks processed profiles as "done" in spreadsheet                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add a node of type "Manual Trigger".  
   - Leave default configuration. This node will start the workflow manually.  

2. **Add Google Sheets Node to Read Rows**  
   - Add a "Google Sheets" node.  
   - Set operation to "Read Rows" (default).  
   - Configure credentials with a valid Google Sheets OAuth2 account.  
   - Set Document ID to your Google Sheets document containing LinkedIn profiles (e.g., "Linkedin-connection-request").  
   - Set Sheet Name to "Sheet1" or the relevant sheet (gid=0).  
   - No filters needed unless you want to limit rows to those pending processing (e.g., where Status != "done").  
   - Connect the output of "Manual Trigger" to this node's input.  

3. **Add ConnectSafely LinkedIn Node to Follow Profiles**  
   - Install community node `n8n-nodes-connectsafely.ai` if not already installed (Settings > Community Nodes, then restart n8n).  
   - Add the "ConnectSafely LinkedIn" node.  
   - Configure credentials with your ConnectSafely API key/account.  
   - Set operation to "followUser".  
   - Set Profile ID field to the expression: `{{ $json['LinkedIn Url'] }}` to dynamically use the LinkedIn URL from the sheet.  
   - Connect "Google Sheets" node output to this node input.  

4. **Add Google Sheets Node to Update Row Status**  
   - Add another "Google Sheets" node.  
   - Set operation to "Update Row".  
   - Use the same credentials and document/sheet settings as in the read node.  
   - Configure the columns to update:  
     - Set "Status" to "done".  
     - Set "row_number" to `{{ $('Get row(s) in sheet').item.json.row_number }}` to match the correct row.  
   - Use "row_number" as the matching column for update.  
   - Connect the output of the "ConnectSafely LinkedIn" node to this node input.  

5. **(Optional) Add Sticky Notes for Documentation**  
   - Add sticky notes describing the workflow overview, profile retrieval, follow execution, and status updates as per your documentation preferences.  

6. **Test Workflow**  
   - Manually trigger the workflow.  
   - Verify that rows are read, profiles are followed via ConnectSafely, and statuses update to "done".  

---

### 5. General Notes & Resources

| Note Content                                                                                                                 | Context or Link                                  |
|------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| Workflow automates LinkedIn profile follows using ConnectSafely.ai, maintaining compliance with LinkedIn platform policies.   | Main Sticky Note content including [YouTube](b4G47AJX418) |
| Requires installation of community node `n8n-nodes-connectsafely.ai` via n8n settings.                                          | Setup instruction in main sticky note           |
| Recommended to add delay nodes for processing large batches (500+ profiles) to avoid rate limits.                             | Customization suggestions in main sticky note   |
| Implement error handling for failed API calls and network issues to increase robustness.                                      | Customization suggestions in main sticky note   |
| Extend workflow by integrating with CRM systems or adding connection requests and analytics.                                  | Customization suggestions in main sticky note   |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow built with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.