Add a new user to Notion database on Calendly invite creation

https://n8nworkflows.xyz/workflows/add-a-new-user-to-notion-database-on-calendly-invite-creation-1088


# Add a new user to Notion database on Calendly invite creation

### 1. Workflow Overview

This workflow automates the process of adding a new user entry into a Notion database each time an invite is created via Calendly. It is designed for use cases where event attendee information from Calendly needs to be tracked or managed within a Notion database, such as CRM, appointment tracking, or user management.

The workflow consists of two main logical blocks:

- **1.1 Input Reception:** Capturing invite creation events from Calendly in real-time.
- **1.2 Data Insertion:** Creating a new page (record) in a Notion database with the invitee’s details received from Calendly.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block listens for new invite creation events from Calendly and triggers the workflow execution when such an event occurs.

- **Nodes Involved:**  
  - Calendly Trigger

- **Node Details:**

  - **Node Name:** Calendly Trigger  
    - **Type:** Calendly Trigger (Webhook trigger node)  
    - **Technical Role:** Listens for specific Calendly webhook events to start the workflow.  
    - **Configuration:**  
      - Listens specifically for the event `invitee.created`, which fires each time a new invitee is created in Calendly.  
      - Uses credentials labeled "Calendly API Credentials" for authentication with Calendly API.  
      - WebhookId is set to a unique identifier (automatically managed by n8n).  
    - **Expressions/Variables:** None in configuration; data is dynamically received from Calendly webhook payload.  
    - **Input Connections:** None (trigger node).  
    - **Output Connections:** Passes data to the next node "Notion".  
    - **Version-specific Requirements:** Requires n8n version that supports Calendly Trigger node (generally n8n v0.157+).  
    - **Potential Failures:**  
      - Authentication failure if Calendly API credentials are invalid or expired.  
      - Webhook registration failure if webhook URL is unreachable or misconfigured.  
      - Event filtering misconfiguration can lead to no triggers firing.  
    - **Sub-workflow:** None.

#### 1.2 Data Insertion

- **Overview:**  
  This block receives the invitee data from the Calendly Trigger and creates a new page in a specified Notion database, mapping invitee details to appropriate database properties.

- **Nodes Involved:**  
  - Notion

- **Node Details:**

  - **Node Name:** Notion  
    - **Type:** Notion node (Database Page creation)  
    - **Technical Role:** Creates a new record (page) inside a Notion database.  
    - **Configuration:**  
      - Resource set to `databasePage`, meaning it creates a new page in a database.  
      - `databaseId` is set to `"b40628ca-9000-4576-ab2c-4ed3c37e6ee4"` which identifies the target Notion database.  
      - Properties mapping:  
        - Name (title property): Set from the Calendly invitee's name, extracted via expression `{{$json["payload"]["invitee"]["name"]}}`.  
        - Email (email property): Set from the invitee's email, expression `{{$json["payload"]["invitee"]["email"]}}`.  
        - Status (select property): Set to a fixed select option by ID `"6ad3880b-260a-4d12-999f-5b605e096c1c"`.  
      - Credentials use "Notion API Credentials" for authentication.  
    - **Expressions/Variables:** Uses JSONPath expressions to extract data from the incoming JSON payload.  
    - **Input Connections:** Receives data from "Calendly Trigger".  
    - **Output Connections:** None (end node).  
    - **Version-specific Requirements:** Requires n8n version supporting Notion node with database page creation (n8n v0.134+ recommended).  
    - **Potential Failures:**  
      - Authentication errors if Notion API credentials are invalid or lack permissions.  
      - Incorrect or outdated databaseId or property keys can cause creation failures.  
      - Expression errors if the expected JSON structure changes or is missing fields.  
      - Rate limiting from Notion API if too many requests are made in a short time.  
    - **Sub-workflow:** None.

---

### 3. Summary Table

| Node Name       | Node Type            | Functional Role          | Input Node(s)   | Output Node(s) | Sticky Note                                                                                  |
|-----------------|----------------------|-------------------------|-----------------|----------------|----------------------------------------------------------------------------------------------|
| Calendly Trigger| Calendly Trigger     | Trigger on invite creation| None            | Notion         | The Calendly node will trigger the workflow when an invite gets created.                     |
| Notion          | Notion               | Create new record in DB  | Calendly Trigger| None           | This node will create a new record using the information received from the previous node.    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow** in n8n.

2. **Add "Calendly Trigger" node:**
   - Node Type: Calendly Trigger  
   - Parameters:  
     - Events: Select only `invitee.created`  
   - Credentials: Set up or select existing "Calendly API Credentials" that have permissions to access your Calendly account and manage webhooks.  
   - Position node as desired.

3. **Add "Notion" node:**
   - Node Type: Notion  
   - Parameters:  
     - Resource: Set to `databasePage`  
     - Database ID: Enter the Notion database ID where new users should be created (e.g., `"b40628ca-9000-4576-ab2c-4ed3c37e6ee4"`)  
     - Properties:  
       - Map the `Name` (title) property to `{{$json["payload"]["invitee"]["name"]}}`  
       - Map the `Email` (email) property to `{{$json["payload"]["invitee"]["email"]}}`  
       - Map the `Status` (select) property to the specific select option ID you want to assign (e.g., `"6ad3880b-260a-4d12-999f-5b605e096c1c"`)  
   - Credentials: Select or create Notion API credentials with permissions to add pages to the target database.  
   - Position node to the right of the Calendly Trigger.

4. **Connect nodes:**
   - Connect the output of the Calendly Trigger node to the input of the Notion node.

5. **Save and activate the workflow.**

6. **Test:**
   - Create a test invite in Calendly and confirm that a new entry is created in your Notion database with the invitee’s name, email, and the selected status.

---

### 5. General Notes & Resources

| Note Content                                                                                  | Context or Link                                      |
|-----------------------------------------------------------------------------------------------|-----------------------------------------------------|
| This workflow requires valid API credentials for both Calendly and Notion with proper scopes. | Credential setup in n8n for Calendly and Notion API |
| The Notion database properties must exactly match the keys and property types used in the node.| Notion database schema configuration                  |
| For selecting the correct Notion select option ID, inspect the database's available options.  | Notion API documentation on select property values   |

---

This document fully describes the workflow "Add a new user to Notion database on Calendly invite creation," enabling understanding, reproduction, and modification by advanced users or automation agents.