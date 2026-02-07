Add new leads in Lemlist from Airtable

https://n8nworkflows.xyz/workflows/add-new-leads-in-lemlist-from-airtable-983


# Add new leads in Lemlist from Airtable

### 1. Workflow Overview

This workflow automates the process of adding new leads from Airtable into a Lemlist campaign. Its primary use case is to synchronize email leads stored in Airtable with Lemlist for email outreach campaigns. 

Logical blocks:

- **1.1 Data Retrieval from Airtable:** Fetches a list of emails and associated lead information from an Airtable base.
- **1.2 Lead Creation in Lemlist:** Uses the retrieved data to create leads in a specified Lemlist campaign.
- **1.3 Lead Verification in Lemlist:** Retrieves and confirms the information of each newly created lead from Lemlist to ensure successful creation.

---

### 2. Block-by-Block Analysis

#### 1.1 Data Retrieval from Airtable

- **Overview:**  
  This block extracts all lead emails (and associated fields) from an Airtable base. It serves as the data source for subsequent lead creation in Lemlist.

- **Nodes Involved:**  
  - Airtable

- **Node Details:**  

  - **Airtable**  
    - Type: Airtable node (n8n-nodes-base.airtable)  
    - Role: Lists records from a specified Airtable base and table.  
    - Configuration:  
      - Operation: List records  
      - No additional filters or options set, implying retrieval of all records.  
    - Expressions: None required inside the node itself since it fetches all records. Downstream nodes use the fields from this node.  
    - Input: None (start node)  
    - Output: List of records, each containing fields such as "Email" and "Name" (assumed from usage).  
    - Credentials: Uses configured Airtable API credentials ("Airtable Credentials n8n").  
    - Edge cases/failures:  
      - API authentication errors if credentials expire or are invalid.  
      - Network timeouts or rate limiting by Airtable API.  
      - Empty table or missing expected fields ("Email", "Name") causing downstream expression failures.  

#### 1.2 Lead Creation in Lemlist

- **Overview:**  
  Uses each record from Airtable to create a lead in the Lemlist campaign identified by its campaign ID. It maps the email and first name fields from Airtable to Lemlist's lead creation endpoint.

- **Nodes Involved:**  
  - Lemlist

- **Node Details:**  

  - **Lemlist**  
    - Type: Lemlist node (n8n-nodes-base.lemlist)  
    - Role: Creates a new lead in a specified Lemlist campaign.  
    - Configuration:  
      - Resource: Lead  
      - Operation: Create (default for lead resource)  
      - Campaign ID: "cam_H5pYEryq6mRKBiy5v" (hardcoded campaign identifier)  
      - Email: Expression `={{$json["fields"]["Email"]}}` pulls email from the current Airtable record.  
      - Additional Fields: First name mapped from Airtable via `={{$json["fields"]["Name"]}}`  
    - Input: Receives records from Airtable node.  
    - Output: Created lead details, passed to next node.  
    - Credentials: Uses Lemlist API credentials ("Lemlist API Credentials").  
    - Edge cases/failures:  
      - Invalid or missing email addresses lead to API errors.  
      - Campaign ID invalid or inaccessible (permission errors).  
      - API rate limiting or downtime.  
      - Expression failures if "Email" or "Name" fields are missing in input data.  

#### 1.3 Lead Verification in Lemlist

- **Overview:**  
  Retrieves the lead details from Lemlist for each email processed, confirming lead creation and fetching lead metadata.

- **Nodes Involved:**  
  - Lemlist1

- **Node Details:**  

  - **Lemlist1**  
    - Type: Lemlist node (n8n-nodes-base.lemlist)  
    - Role: Retrieves a lead's information from Lemlist by email.  
    - Configuration:  
      - Resource: Lead  
      - Operation: Get lead details  
      - Email: Expression `={{$node["Airtable"].json["fields"]["Email"]}}` references the email field from the original Airtable node, ensuring the same email is queried.  
    - Input: Receives output from Lemlist node, but expression pulls from Airtable node data.  
    - Output: Lead information retrieved from Lemlist API.  
    - Credentials: Uses Lemlist API credentials.  
    - Edge cases/failures:  
      - Lead not found in Lemlist if creation failed or delayed synchronization.  
      - API errors due to invalid credentials or rate limits.  
      - Expression issues if Airtable data is incomplete or nodes are disconnected.  

---

### 3. Summary Table

| Node Name  | Node Type            | Functional Role              | Input Node(s) | Output Node(s) | Sticky Note                                                                                                                   |
|------------|----------------------|-----------------------------|---------------|----------------|-------------------------------------------------------------------------------------------------------------------------------|
| Airtable   | Airtable             | Fetch emails and lead data   | None          | Lemlist        | This node lists all the emails that are stored in your Table. You may have the email addresses stored in a Google Sheet, CRM, or database. Replace the Airtable node with the respective node to get the list of the email addresses. |
| Lemlist    | Lemlist              | Create leads in Lemlist      | Airtable      | Lemlist1       | This node creates new leads for a campaign in Lemlist taking the information from the previous node.                            |
| Lemlist1   | Lemlist              | Retrieve lead info from Lemlist | Lemlist       | None           | This node returns the information of a lead from Lemlist.                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Airtable Node**  
   - Add a new node of type **Airtable**.  
   - Set operation to **List** to fetch records.  
   - Configure Airtable API credentials with your Airtable API key and base info.  
   - Ensure the target table contains at least fields "Email" and "Name" or adjust expressions accordingly.

2. **Create Lemlist Node (Lead Creation)**  
   - Add a new node of type **Lemlist**.  
   - Set resource to **Lead** and operation to **Create** (default).  
   - Enter the hardcoded campaign ID for the Lemlist campaign: `cam_H5pYEryq6mRKBiy5v`.  
   - Set the **Email** parameter with the expression: `{{$json["fields"]["Email"]}}` to map the email from Airtable.  
   - Under **Additional Fields**, set **First Name** with expression: `{{$json["fields"]["Name"]}}`.  
   - Configure Lemlist API credentials with your API key.  
   - Connect the output of the Airtable node to this Lemlist node.

3. **Create Lemlist1 Node (Lead Retrieval)**  
   - Add another node of type **Lemlist**.  
   - Set resource to **Lead** and operation to **Get**.  
   - Set the **Email** parameter with the expression: `{{$node["Airtable"].json["fields"]["Email"]}}` to fetch the same email from the Airtable node.  
   - Use the same Lemlist API credentials as above.  
   - Connect the output of the Lemlist lead creation node to this node.

4. **Finalize Workflow**  
   - Verify all connections: Airtable → Lemlist (create lead) → Lemlist1 (get lead info).  
   - Save and activate the workflow.  
   - Test by ensuring your Airtable base contains new leads not yet in Lemlist, then run the workflow to sync them.

---

### 5. General Notes & Resources

| Note Content                                                                                                           | Context or Link                        |
|------------------------------------------------------------------------------------------------------------------------|-------------------------------------|
| You may replace the Airtable node with another data source node like Google Sheets, CRM, or database nodes as required. | General flexibility for data source |
| Lemlist campaign ID is hardcoded; ensure you use the correct campaign ID for your Lemlist account.                     | Lemlist API documentation           |
| Ensure API credentials for Airtable and Lemlist have sufficient permissions and are up to date.                        | Credential management best practice |
| Lemlist API rate limits may affect workflows processing large numbers of leads; implement error handling or throttling.| Lemlist API rate limit guidelines   |