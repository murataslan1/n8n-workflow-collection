Automate n8n User Invitations from a Google Spreadsheet

https://n8nworkflows.xyz/workflows/automate-n8n-user-invitations-from-a-google-spreadsheet-3233


# Automate n8n User Invitations from a Google Spreadsheet

### 1. Workflow Overview

This workflow automates the synchronization of user invitations between a Google Sheets spreadsheet and an n8n instance. It is designed to:

- Retrieve all existing users from the n8n instance via its API.
- Retrieve all user entries from a Google Sheets spreadsheet (structured similarly to a Squarespace newsletter block).
- Compare the spreadsheet entries against existing n8n users to identify new users.
- Automatically create new users in n8n for those not already present.
- Send invitation emails to newly created users.
- Be triggered manually or run on a schedule for continuous synchronization.

The workflow logic is divided into the following blocks:

- **1.1 Trigger Block:** Manual or scheduled start of the workflow.
- **1.2 Configuration Block:** Setting the n8n API endpoint URL.
- **1.3 Data Retrieval Block:** Fetching users from n8n and rows from Google Sheets.
- **1.4 Data Processing Block:** Combining paginated API results and comparing user lists.
- **1.5 User Creation Block:** Preparing new user data and sending invitations.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger Block

- **Overview:** Initiates the workflow either manually or on a schedule.
- **Nodes Involved:**  
  - When clicking ‘Test workflow’  
  - Schedule Trigger

- **Node Details:**

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Allows manual execution of the workflow for testing or on-demand runs.  
    - Configuration: No parameters; triggers on manual user action.  
    - Input: None  
    - Output: Triggers the next node "Edit Fields".  
    - Edge cases: None significant; manual trigger is straightforward.

  - **Schedule Trigger**  
    - Type: Schedule Trigger  
    - Role: Automatically triggers the workflow on a recurring interval.  
    - Configuration: Default interval (empty object), meaning it runs continuously or as configured by the user.  
    - Input: None  
    - Output: Triggers the next node "Edit Fields".  
    - Edge cases: Misconfiguration of interval could cause unexpected run frequency.

#### 1.2 Configuration Block

- **Overview:** Sets the base URL for the n8n API endpoint used in subsequent HTTP requests.
- **Nodes Involved:**  
  - Edit Fields  
  - Sticky Note3 (instructional note)

- **Node Details:**

  - **Edit Fields**  
    - Type: Set  
    - Role: Defines the variable `n8n_url` with the API endpoint URL for the n8n instance.  
    - Configuration: Hardcoded string value `"https://{n8n-url}/api/v1/users"`; user must replace `{n8n-url}` with their actual n8n instance URL.  
    - Key expressions: None dynamic; static string assignment.  
    - Input: Trigger from manual or schedule trigger nodes.  
    - Output: Passes `n8n_url` variable downstream.  
    - Edge cases: If the URL is not updated correctly, API calls will fail authentication or endpoint errors.

  - **Sticky Note3**  
    - Type: Sticky Note  
    - Content: Instructions to edit the `n8n_url` in the "Edit Fields" node with a link to the n8n API authentication guide.  
    - Role: Provides user guidance.  
    - No inputs or outputs.

#### 1.3 Data Retrieval Block

- **Overview:** Retrieves all user data from n8n API and all rows from the Google Sheets spreadsheet.
- **Nodes Involved:**  
  - Get all rows  
  - Get all Users

- **Node Details:**

  - **Get all rows**  
    - Type: Google Sheets  
    - Role: Fetches all rows from the specified Google Sheets document and sheet.  
    - Configuration:  
      - Document ID: `15A3ZWzIBfONL4U_1XGJvtsS8HtMQ69qrpxd5C5L6Akg` (sample sheet)  
      - Sheet Name: `gid=0` (first sheet)  
      - Credentials: Google Sheets OAuth2  
    - Key expressions: None dynamic; static document and sheet IDs.  
    - Input: From "Edit Fields" node.  
    - Output: Passes spreadsheet rows downstream.  
    - Edge cases:  
      - Credential expiration or invalid permissions.  
      - Sheet structure changes may cause data mismatch.

  - **Get all Users**  
    - Type: HTTP Request  
    - Role: Calls the n8n API to retrieve all users, with pagination support.  
    - Configuration:  
      - URL: Dynamic, uses `n8n_url` from input JSON.  
      - Authentication: n8n API Key (predefined credential).  
      - Pagination: Cursor-based, continues fetching until no `nextCursor` in response.  
      - Query parameter: `limit=5` (small page size for demonstration).  
    - Key expressions:  
      - Pagination cursor: `={{ $response.body.nextCursor }}`  
      - Pagination complete when: `={{ !$response.body.nextCursor }}`  
    - Input: From "Edit Fields" node.  
    - Output: Passes paginated user data downstream.  
    - Edge cases:  
      - API key invalid or expired.  
      - Network timeouts or API errors.  
      - Pagination logic failure if API changes.

#### 1.4 Data Processing Block

- **Overview:** Combines paginated user results into a single list and compares spreadsheet users against existing n8n users to identify new users.
- **Nodes Involved:**  
  - Combine all paginated results  
  - Get non-users

- **Node Details:**

  - **Combine all paginated results**  
    - Type: Code  
    - Role: Merges multiple paginated API responses into a single array of user objects.  
    - Configuration: JavaScript code concatenates all `.json.data` arrays from inputs.  
    - Key expressions:  
      ```javascript
      let results = [];
      for (let i = 0; i < $input.all().length; i++) {
        results = results.concat($input.all()[i].json.data);
      }
      return results;
      ```  
    - Input: Multiple paginated responses from "Get all Users".  
    - Output: Single combined user list.  
    - Edge cases:  
      - Empty or malformed input arrays.  
      - Unexpected API response structure changes.

  - **Get non-users**  
    - Type: Merge  
    - Role: Performs a left join to find spreadsheet rows that do not match any existing n8n user by email.  
    - Configuration:  
      - Mode: Combine  
      - Join Mode: Keep Non Matches (left join)  
      - Merge by fields: Spreadsheet `Email Address` vs. n8n user `email`  
      - Output data from: Input1 (spreadsheet rows)  
    - Input:  
      - Input1: Rows from Google Sheets ("Get all rows")  
      - Input2: Combined users list ("Combine all paginated results")  
    - Output: Rows representing users not found in n8n.  
    - Edge cases:  
      - Email field mismatches due to case sensitivity or formatting.  
      - Missing email fields in either source.

#### 1.5 User Creation Block

- **Overview:** Prepares new user data and sends invitation requests to the n8n API.
- **Nodes Involved:**  
  - Create users list  
  - Invite Users

- **Node Details:**

  - **Create users list**  
    - Type: Set  
    - Role: Transforms spreadsheet data into the format required by the n8n API to create users.  
    - Configuration:  
      - Sets `email` field from spreadsheet `Email Address`  
      - Sets `role` field to `"global:member"` (default user role)  
    - Key expressions:  
      - `email = {{$json['Email Address']}}`  
      - `role = "global:member"`  
    - Input: From "Get non-users" node (new users only).  
    - Output: User objects ready for API creation.  
    - Edge cases:  
      - Missing or malformed email addresses.  
      - Role hardcoded; may need adjustment for different permissions.

  - **Invite Users**  
    - Type: HTTP Request  
    - Role: Sends POST requests to the n8n API to create new users and trigger invitation emails.  
    - Configuration:  
      - URL: Uses `n8n_url` from "Edit Fields" node.  
      - Method: POST  
      - Body: JSON array of user objects from "Create users list".  
      - Authentication: n8n API Key (predefined credential).  
    - Key expressions:  
      - Body: `={{ [$json] }}` (wraps single user JSON in array)  
    - Input: From "Create users list".  
    - Output: API response confirming user creation.  
    - Edge cases:  
      - API errors due to duplicate users or invalid data.  
      - Network or authentication failures.

---

### 3. Summary Table

| Node Name                 | Node Type          | Functional Role                               | Input Node(s)                     | Output Node(s)                  | Sticky Note                                                                                                     |
|---------------------------|--------------------|-----------------------------------------------|----------------------------------|--------------------------------|----------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger     | Manual start of workflow                       | None                             | Edit Fields                    |                                                                                                                |
| Schedule Trigger          | Schedule Trigger   | Scheduled start of workflow                    | None                             | Edit Fields                    |                                                                                                                |
| Edit Fields               | Set                | Sets n8n API endpoint URL                      | When clicking ‘Test workflow’, Schedule Trigger | Get all rows, Get all Users    | Change n8n_url to your instance URL https://docs.n8n.io/api/authentication/#call-the-api-using-your-key         |
| Get all rows              | Google Sheets      | Retrieves all rows from Google Sheets         | Edit Fields                     | Get non-users                  |                                                                                                                |
| Get all Users             | HTTP Request       | Retrieves all users from n8n API with pagination | Edit Fields                     | Combine all paginated results  |                                                                                                                |
| Combine all paginated results | Code               | Combines paginated user responses into one list | Get all Users                   | Get non-users                  |                                                                                                                |
| Get non-users             | Merge              | Finds spreadsheet entries not in n8n users    | Get all rows, Combine all paginated results | Create users list             |                                                                                                                |
| Create users list         | Set                | Prepares new user data for API creation       | Get non-users                   | Invite Users                  |                                                                                                                |
| Invite Users              | HTTP Request       | Sends user creation and invitation requests   | Create users list               | None                         |                                                                                                                |
| Sticky Note1              | Sticky Note        | Workflow description and instructions          | None                             | None                         | ## Invite users to n8n from Google sheets\nThis workflow will get all Users from n8n and compare against the rows from Google sheets and create new users\n\nInvitation emails will be sent once the new users created\n\nYou can run the workflow on demand or by schedule\n\n## Spreadsheet template\n\nThe sheet columns are inspire from Squarespace newsletter block connection, but you can change the node to adapt new columns format\n\nClone the [sample sheet here](https://docs.google.com/spreadsheets/d/1wi2Ucb4b35e0-fuf-96sMnyzTft0ADz3MwdE_cG_WnQ/edit?usp=sharing)\n- Submitted On\t\n- Email Address\t\n- Name" |
| Sticky Note3              | Sticky Note        | Instruction to edit n8n_url                    | None                             | None                         | ## Edit this node 👇\nChange n8n_url to your instance URL\nhttps://docs.n8n.io/api/authentication/#call-the-api-using-your-key |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**

   - Add a **Manual Trigger** node named `When clicking ‘Test workflow’`. No configuration needed.
   - Add a **Schedule Trigger** node named `Schedule Trigger`. Configure the interval as desired (default is continuous).

2. **Create Configuration Node:**

   - Add a **Set** node named `Edit Fields`.
   - Add one assignment:
     - Name: `n8n_url`
     - Type: String
     - Value: `"https://{n8n-url}/api/v1/users"` (replace `{n8n-url}` with your actual n8n instance URL).
   - Connect both trigger nodes (`When clicking ‘Test workflow’` and `Schedule Trigger`) to `Edit Fields`.

3. **Create Data Retrieval Nodes:**

   - Add a **Google Sheets** node named `Get all rows`.
   - Configure:
     - Document ID: Use your Google Sheets document ID (or the sample: `15A3ZWzIBfONL4U_1XGJvtsS8HtMQ69qrpxd5C5L6Akg`).
     - Sheet Name: `gid=0` or your target sheet.
     - Credentials: Set up and select your Google Sheets OAuth2 credentials.
   - Connect `Edit Fields` to `Get all rows`.

   - Add an **HTTP Request** node named `Get all Users`.
   - Configure:
     - URL: `={{ $json.n8n_url }}` (dynamic from input).
     - Method: GET.
     - Authentication: Use n8n API Key credentials.
     - Query Parameters: Add parameter `limit` with value `5`.
     - Pagination: Enable cursor pagination with:
       - Cursor parameter name: `cursor`
       - Cursor value: `={{ $response.body.nextCursor }}`
       - Pagination complete when: `={{ !$response.body.nextCursor }}`
   - Connect `Edit Fields` to `Get all Users`.

4. **Create Data Processing Nodes:**

   - Add a **Code** node named `Combine all paginated results`.
   - Paste the following JavaScript code:
     ```javascript
     let results = [];
     for (let i = 0; i < $input.all().length; i++) {
       results = results.concat($input.all()[i].json.data);
     }
     return results;
     ```
   - Connect `Get all Users` to `Combine all paginated results`.

   - Add a **Merge** node named `Get non-users`.
   - Configure:
     - Mode: Combine
     - Join Mode: Keep Non Matches (left join)
     - Merge by fields: Left field `Email Address` (from Google Sheets), Right field `email` (from n8n users)
     - Output data from: Input1 (Google Sheets rows)
   - Connect `Get all rows` to input 1 of `Get non-users`.
   - Connect `Combine all paginated results` to input 2 of `Get non-users`.

5. **Create User Creation Nodes:**

   - Add a **Set** node named `Create users list`.
   - Configure two assignments:
     - `email` (string): `={{ $json['Email Address'] }}`
     - `role` (string): `"global:member"`
   - Connect `Get non-users` to `Create users list`.

   - Add an **HTTP Request** node named `Invite Users`.
   - Configure:
     - URL: `={{ $('Edit Fields').item.json.n8n_url }}`
     - Method: POST
     - Authentication: n8n API Key credentials
     - Body Content Type: JSON
     - Body Parameters: Use expression `={{ [$json] }}` to send an array with the user object.
   - Connect `Create users list` to `Invite Users`.

6. **Add Sticky Notes (Optional):**

   - Add a sticky note near `Edit Fields` with instructions to update the `n8n_url` and a link to the authentication guide:  
     "## Edit this node 👇  
     Change n8n_url to your instance URL  
     https://docs.n8n.io/api/authentication/#call-the-api-using-your-key"

   - Add a sticky note describing the overall workflow and spreadsheet template with the sample sheet link near the start of the workflow.

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Clone the sample Google Sheet template to use with this workflow: [Sample Sheet](https://docs.google.com/spreadsheets/d/1wi2Ucb4b35e0-fuf-96sMnyzTft0ADz3MwdE_cG_WnQ/edit?usp=sharing) | Spreadsheet template for user data input                                                           |
| Update the `n8n_url` in the "Edit Fields" node to match your n8n instance URL for API calls.                                         | https://docs.n8n.io/api/authentication/#call-the-api-using-your-key                                 |
| This workflow requires valid n8n API Key credentials and Google Sheets OAuth2 credentials configured in n8n.                       | Credential setup                                                                                     |
| The workflow supports both manual and scheduled execution for flexible synchronization.                                             | Trigger options                                                                                    |
| Pagination in the "Get all Users" node uses cursor-based pagination with a small page size (`limit=5`) for demonstration.          | Pagination handling                                                                                 |
| The user role is hardcoded as `global:member` when creating new users; adjust if different roles are needed.                       | User role assignment                                                                                |
| The email comparison in the merge node is case-sensitive; ensure consistent email formatting in the spreadsheet and n8n users.    | Potential edge case in user matching                                                               |
| For more templates by the author, visit: [n8n Templates by bangank36](https://n8n.io/creators/bangank36/)                           | Additional resources                                                                               |

---

This document provides a detailed and structured reference to understand, reproduce, and maintain the "Automate n8n User Invitations from a Google Spreadsheet" workflow, including all nodes, configurations, and potential edge cases.