Automate Real Estate Client Folder Creation with Google Sheets and Drive

https://n8nworkflows.xyz/workflows/automate-real-estate-client-folder-creation-with-google-sheets-and-drive-11186


# Automate Real Estate Client Folder Creation with Google Sheets and Drive

### 1. Workflow Overview

This workflow automates the administrative backend process for new real estate transactions entered into a Google Sheets client portal. Its main purpose is to ensure that for every new transaction record with a buyer email but lacking a dedicated Google Drive folder, the system will:

- Automatically create a personalized Google Drive folder for storing client documents,
- Update the transaction record in Google Sheets with the new folder's URL,
- Append an initial task in a separate "Tasks" sheet to prompt the client to upload necessary documents.

**Target Use Cases:**  
- Real estate agencies managing transactions via Google Sheets and Google Drive, seeking to automate folder creation and task assignment for document collection.  
- Teams wanting to streamline onboarding of new client transactions with minimal manual intervention.

**Logical Blocks:**

- **1.1 Input Reception:** Detect new transaction entries in Google Sheets with buyer email but missing document folder URL.  
- **1.2 Folder Creation:** Create a Google Drive folder named after the buyer's email under a specified parent folder.  
- **1.3 Transaction Update:** Update Google Sheets transaction record to include the newly created folder URL.  
- **1.4 Task Creation:** Add an initial task in the "Tasks" sheet to prompt document uploads.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
This block triggers the workflow whenever a new row is added or updated in the "Transactions" Google Sheet. It then filters to only process rows where the buyer's email is present but no Google Drive folder has been assigned.

- **Nodes Involved:**  
  - New Transaction Trigger  
  - Filter Missing Folder & Email

- **Node Details:**

  - **New Transaction Trigger**  
    - *Type:* Google Sheets Trigger  
    - *Role:* Watches the "Transactions" sheet for new or updated rows every minute.  
    - *Configuration:*  
      - Spreadsheet ID points to the targeted real estate client portal Google Sheet.  
      - Sheet name is set to the first tab (`gid=0`), named "Transactions".  
      - Polling mode: every minute.  
      - OAuth2 credentials for accessing Google Sheets are configured.  
    - *Input/Output:* No input; outputs new or updated sheet rows.  
    - *Edge Cases:*  
      - Possible auth errors if credentials expire.  
      - Delays in Google Sheets API polling could cause slight latency.  
      - Sheets structural changes (e.g., renamed columns) may break functionality.

  - **Filter Missing Folder & Email**  
    - *Type:* Filter node  
    - *Role:* Allows only rows where "Buyer Email" is non-empty AND "Documents URL" is empty to proceed.  
    - *Configuration:*  
      - Condition 1: Buyer Email is not empty.  
      - Condition 2: Documents URL is empty.  
      - Logical operator: AND.  
    - *Input/Output:* Input from trigger; outputs filtered rows matching conditions.  
    - *Edge Cases:*  
      - Empty or malformed email entries may cause false negatives.  
      - Case sensitivity set to true; ensures exact matches.

---

#### 1.2 Folder Creation

- **Overview:**  
Creates a new folder in Google Drive named after the buyer's email under a specific parent folder reserved for client documents.

- **Nodes Involved:**  
  - Create Client Documents Folder

- **Node Details:**

  - **Create Client Documents Folder**  
    - *Type:* Google Drive node (Folder creation)  
    - *Role:* Creates a folder with the buyer's email as the folder name inside a specified parent folder in Google Drive.  
    - *Configuration:*  
      - Name: dynamically set to the "Buyer Email" field from the filtered row.  
      - Parent folder ID: set via parameter pointing to a designated "Real Estate Client Documents" folder.  
      - Drive: "My Drive".  
      - OAuth2 credentials configured for Google Drive API access.  
    - *Input/Output:* Receives filtered transaction data; outputs folder metadata including folder ID.  
    - *Edge Cases:*  
      - Folder creation may fail if parent folder ID is incorrect or inaccessible.  
      - Duplicate folder names (same email) may create multiple folders.  
      - API quota limits or auth expiration could cause failures.

---

#### 1.3 Transaction Update

- **Overview:**  
Updates the original transaction row in the "Transactions" sheet to include the URL of the newly created Google Drive folder.

- **Nodes Involved:**  
  - Update Transaction With Folder URL

- **Node Details:**

  - **Update Transaction With Folder URL**  
    - *Type:* Google Sheets node (Update operation)  
    - *Role:* Updates the "Documents URL" column in the transaction row identified by "ID".  
    - *Configuration:*  
      - Spreadsheet ID and sheet name same as trigger node ("Transactions", gid=0).  
      - Matching on "ID" column to identify the correct row to update.  
      - Sets "Documents URL" to the newly created folder URL constructed as `https://drive.google.com/drive/u/0/folders/{{folderId}}`.  
      - Credentials configured for Google Sheets API access.  
    - *Input/Output:* Takes folder ID from previous node; outputs updated sheet row confirmation.  
    - *Edge Cases:*  
      - If row ID is missing or changed, update may fail or apply to wrong row.  
      - Google Sheets API quota or permissions errors possible.  
      - Network timeouts or partial updates must be handled.

---

#### 1.4 Task Creation

- **Overview:**  
Appends a new task row to the "Tasks" sheet prompting the client to upload their documents to the newly created folder.

- **Nodes Involved:**  
  - Add Initial Upload Task

- **Node Details:**

  - **Add Initial Upload Task**  
    - *Type:* Google Sheets node (Append operation)  
    - *Role:* Adds a new row in the "Tasks" tab with task details linked to the transaction.  
    - *Configuration:*  
      - Spreadsheet and document ID same as above.  
      - Sheet name: "Tasks" tab (gid=357108817).  
      - Columns set:  
        - "Transaction ID" linked to the transaction's ID.  
        - "Task Name": preset text "Please update your documents to the documents folder."  
        - "Task Description": placeholder "...".  
        - "Status": preset to "To Do".  
      - Credentials configured with Google Sheets OAuth2.  
    - *Input/Output:* Receives transaction ID from previous nodes; outputs confirmation of row append.  
    - *Edge Cases:*  
      - Missing or incorrect transaction ID may cause task to be orphaned.  
      - Sheet structure changes may break append operation.  
      - API quota or network errors possible.

---

### 3. Summary Table

| Node Name                     | Node Type              | Functional Role                                  | Input Node(s)                 | Output Node(s)                    | Sticky Note                                                                                            |
|-------------------------------|------------------------|-------------------------------------------------|------------------------------|----------------------------------|------------------------------------------------------------------------------------------------------|
| Sticky Note                   | Sticky Note            | Describes workflow purpose                       |                              |                                  | "## What this workflow does\nWhen new transaction added (no Drive folder, but Customer email set):\n\n1 - Create a Drive folder share it with them\n2 - Add an initial task (sign offer contract)"               |
| New Transaction Trigger       | Google Sheets Trigger  | Detects new/updated transactions in sheet       |                              | Filter Missing Folder & Email    |                                                                                                      |
| Filter Missing Folder & Email | Filter                 | Filters rows needing folder creation             | New Transaction Trigger       | Create Client Documents Folder   |                                                                                                      |
| Create Client Documents Folder| Google Drive Folder    | Creates folder for client documents              | Filter Missing Folder & Email | Update Transaction With Folder URL|                                                                                                      |
| Update Transaction With Folder URL | Google Sheets        | Updates transaction row with folder URL          | Create Client Documents Folder| Add Initial Upload Task           |                                                                                                      |
| Add Initial Upload Task       | Google Sheets Append   | Adds first task to tasks sheet                    | Update Transaction With Folder URL |                              |                                                                                                      |
| Workflow Description         | Sticky Note            | Detailed workflow overview and setup instructions|                              |                                  | "## Workflow Overview\n\nThis workflow automates the backend setup when new real estate transactions are added to your client portal. When a transaction is created with a buyer email but no document folder assigned, the workflow automatically creates a dedicated Google Drive folder, shares it with the client, and adds an initial task prompting them to upload documents.\n\n### First Setup\n\n**Important:** Make a copy of the [reference Google Sheets spreadsheet](https://docs.google.com/spreadsheets/d/1UJPaBd_qHsNgInA2mrYaq7wgXLHzFw9jcTUoSpTxMDk/edit?usp=sharing) to your own Google account before using this workflow.\n\nYou'll need to authenticate:\n- **Google Sheets** (for trigger and updates)\n- **Google Drive** (for folder creation)\n\nEnsure your spreadsheet has at minimum two tabs: \"Transactions\" (with columns for ID, Buyer Email, Documents URL) and \"Tasks\" (with columns for Transaction ID, Task Name, Task Description, Status).\n\n### Configuration\n\nReconfigure the following to match your setup:\n- Update the Google Sheets trigger to point to your copied spreadsheet\n- Set the correct parent folder ID in Google Drive where transaction folders should be created\n- Customize the initial task name and description in the final \"Append row\" node\n- Update all Google Sheets nodes to reference your spreadsheet and sheet names" |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Google Sheets Trigger node: "New Transaction Trigger"**  
   - Set to watch your "Real Estate Client Portal" Google Sheet with your Spreadsheet ID.  
   - Set Sheet Name to "Transactions" (`gid=0`).  
   - Poll every minute.  
   - Authenticate with Google Sheets OAuth2 credentials.

3. **Add a Filter node: "Filter Missing Folder & Email"**  
   - Connect it to the trigger’s output.  
   - Configure conditions (AND):  
     - "Buyer Email" is not empty.  
     - "Documents URL" is empty.  
   - This ensures only transactions needing folder creation proceed.

4. **Add a Google Drive node: "Create Client Documents Folder"**  
   - Connect it to the Filter node’s output.  
   - Operation: Create Folder.  
   - Folder Name: Set expression to the value of "Buyer Email" from the incoming JSON.  
   - Parent Folder ID: Input your Google Drive folder ID where client folders should be created.  
   - Drive: "My Drive".  
   - Authenticate with Google Drive OAuth2 credentials.

5. **Add a Google Sheets node: "Update Transaction With Folder URL"**  
   - Connect it to the Drive node’s output.  
   - Operation: Update.  
   - Sheet Name: "Transactions" (`gid=0`).  
   - Matching Column: "ID" (maps to the transaction’s unique identifier).  
   - Columns to update:  
     - "Documents URL" set to `https://drive.google.com/drive/u/0/folders/{{folderId}}` where `folderId` is the folder ID from the previous node.  
   - Authenticate with Google Sheets OAuth2 credentials.

6. **Add a Google Sheets node: "Add Initial Upload Task"**  
   - Connect it to the update node’s output.  
   - Operation: Append.  
   - Sheet Name: "Tasks" (`gid=357108817` or your task tab).  
   - Columns to set:  
     - "Transaction ID": set from the transaction's ID.  
     - "Task Name": "Please update your documents to the documents folder."  
     - "Task Description": "...".  
     - "Status": "To Do".  
   - Authenticate with Google Sheets OAuth2 credentials.

7. **Optional:** Add Sticky Note nodes for documentation within the workflow editor summarizing workflow purpose and setup instructions.

8. **Verify:** Test the workflow by adding a new row in your "Transactions" sheet with a buyer email but empty "Documents URL". Confirm folder creation, sheet update, and task creation.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                               | Context or Link                                                                                                                        |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| Important: Make a copy of the reference Google Sheets spreadsheet to your Google Account before use.                                                                                                                                       | [Reference spreadsheet link](https://docs.google.com/spreadsheets/d/1UJPaBd_qHsNgInA2mrYaq7wgXLHzFw9jcTUoSpTxMDk/edit?usp=sharing)      |
| Authenticate both Google Sheets and Google Drive nodes properly via OAuth2 for API access.                                                                                                                                                  | n8n Credentials setup for Google APIs                                                                                                |
| Ensure your Google Sheet has at least two tabs: "Transactions" with columns (ID, Buyer Email, Documents URL) and "Tasks" with columns (Transaction ID, Task Name, Task Description, Status).                                                 | Workflow data structure requirements                                                                                                |
| Customize the parent folder ID in Google Drive node and task description/name to fit your organizational needs.                                                                                                                            | Google Drive folder hierarchy and task management customization                                                                     |
| The workflow runs every minute polling Google Sheets; expect slight latency in real-time updates.                                                                                                                                           | Polling strategy and limitations                                                                                                    |

---

**Disclaimer:** The text provided is exclusively derived from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.