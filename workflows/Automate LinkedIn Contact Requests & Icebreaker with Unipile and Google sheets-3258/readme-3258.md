Automate LinkedIn Contact Requests & Icebreaker with Unipile and Google sheets

https://n8nworkflows.xyz/workflows/automate-linkedin-contact-requests---icebreaker-with-unipile-and-google-sheets-3258


# Automate LinkedIn Contact Requests & Icebreaker with Unipile and Google sheets

### 1. Workflow Overview

This workflow automates LinkedIn contact requests and subsequent icebreaker messaging, integrating Unipile and Google Sheets to streamline LinkedIn outreach for professionals, recruiters, and marketers. It addresses the problem of manually managing LinkedIn connections and messages, helping users save time, reduce errors, and maintain consistent follow-ups.

**Logical Blocks:**

- **1.1 Input Reception and Initialization**  
  Trigger nodes and file reading to receive contact data and start the process.

- **1.2 Data Extraction and Transformation**  
  Extract LinkedIn profile data from input files and transform it for use with LinkedIn and Google Sheets.

- **1.3 LinkedIn Profile Management**  
  Query Google Sheets for existing LinkedIn profiles and populate new profile data.

- **1.4 Relationship Status Check and Contact Request Sending**  
  Decision block to verify if the contact is already connected; if not, sends a LinkedIn contact request.

- **1.5 Post-Request Actions: Icebreaker Messaging**  
  After contact request acceptance, sends an icebreaker message via an auxiliary workflow.

- **1.6 Status Updates and Logging**  
  Update statuses in Google Sheets based on actions taken (request sent, icebreaker sent).

- **1.7 Webhook and External API Integration**  
  Manages webhooks and HTTP requests for LinkedIn data, chats, and Unipile API integration.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Initialization

**Overview:**  
This block starts the workflow using different triggers and reads the initial input file containing LinkedIn contact data.

**Nodes Involved:**  
- Start HERE (Form Trigger)  
- Use this worflow to start the whole pocess (Manual Trigger)  
- When Executed by Another Workflow (ExecuteWorkflowTrigger)  
- Read file (Read/Write File)  
- Read file1 (Read/Write File)  
- Read file2 (Read/Write File)

**Node Details:**

- *Start HERE*  
  - Type: Form Trigger  
  - Role: Receives form input to initiate the workflow manually or via UI  
  - Key configurations: Webhook URL auto-generated; parameters may be empty or customized in UI  
  - Inputs: Triggered externally  
  - Outputs: Connected to "Split the DSN" node for data preparation  
  - Potential failures: Webhook not reachable, form submission errors  

- *Use this worflow to start the whole pocess*  
  - Type: Manual Trigger  
  - Role: Enables manual initiation inside n8n editor for testing or debugging  
  - Configuration: Basic trigger without parameters  
  - Inputs: None  
  - Outputs: Connects to "Read file" node  

- *When Executed by Another Workflow*  
  - Type: ExecuteWorkflowTrigger  
  - Role: Starts workflow when called by another workflow  
  - Inputs: External workflow triggers this  
  - Outputs: Reads intended input file via "Read file2"  

- *Read file / Read file1 / Read file2*  
  - Type: ReadWriteFile  
  - Role: Reads input files from filesystem (local or network share) containing LinkedIn contacts or related data  
  - Configuration: File path configured for self-hosted environments (limitation mentioned in overview)  
  - Inputs: Trigger node outputs  
  - Outputs: Forward data to extraction nodes  
  - Edge cases: File missing, read permission denied, incorrect format  

---

#### 2.2 Data Extraction and Transformation

**Overview:**  
Extracts structured data from files, converts formats if needed, and prepares LinkedIn profile information to be processed.

**Nodes Involved:**  
- Extract from File  
- Extract from File1  
- Extract from File2  
- Convert to File  
- Split the DSN  
- Extract username from Linkedin Link (Code)  
- Write file  

**Node Details:**

- *Extract from File / Extract from File1 / Extract from File2*  
  - Type: ExtractFromFile  
  - Role: Parses input files to extract relevant data, presumably CSV or JSON with LinkedIn profile details  
  - Inputs: Output from file readers  
  - Outputs: Data tables or JSON objects forwarded to profile querying or chat starting nodes  
  - Failures: Malformed file, extraction rules mismatch  

- *Convert to File*  
  - Type: ConvertToFile  
  - Role: Converts extracted data into file format expected by the subsequent nodes or storage  
  - Inputs: Data from "Split the DSN" node  
  - Outputs: Feeds "Write file" node  
  - Considerations: Conversion encoding, format type must match downstream consumers  

- *Split the DSN*  
  - Type: Set  
  - Role: Processes or restructures input data, possibly splitting dataset name or other compound values to cleaner parts  
  - Inputs: Form or manual trigger outputs  
  - Outputs: Processed data to "Convert to File"  

- *Extract username from Linkedin Link*  
  - Type: Code  
  - Role: Custom JavaScript extracts username or identifier portion from a LinkedIn URL string  
  - Inputs: LinkedIn profile link from Google Sheets queries  
  - Outputs: Username passed to further LinkedIn API queries  
  - Edge cases: Invalid or malformed URLs, unexpected URL structure  

- *Write file*  
  - Type: ReadWriteFile  
  - Role: Saves intermediate processed data files for further processing or webhook consumption  
  - Outputs: Connects to "Create Webhook"  

---

#### 2.3 LinkedIn Profile Management

**Overview:**  
This block queries Google Sheets to fetch existing LinkedIn profile data, compares profiles, and populates new profiles to the sheet.

**Nodes Involved:**  
- Get linkedin profiles  
- Get linkedin profiles1  
- Get user Linkedin data (HTTP Request)  
- Populate profiles (Google Sheets)  

**Node Details:**

- *Get linkedin profiles / Get linkedin profiles1*  
  - Type: Google Sheets  
  - Role: Reads LinkedIn profiles from a dedicated Google Sheet, typically containing user data to process  
  - Configuration: Spreadsheet ID, Sheet Name, and ranges defined to extract rows with profile info  
  - Inputs: Extracted LinkedIn data from files  
  - Outputs: Profile data passed to username extraction or relationship checks  
  - Edge cases: API quota exceeded, permission errors, inconsistent sheet formatting  

- *Get user Linkedin data*  
  - Type: HTTP Request  
  - Role: Calls LinkedIn or Unipile API to get detailed profile info based on username or ID  
  - Configuration: API endpoint, authentication credentials for Unipile, possibly OAuth2 or API key  
  - Outputs: Profile details passed for update or action  
  - Failures: API limit exceeded, invalid credentials, network timeout  

- *Populate profiles*  
  - Type: Google Sheets  
  - Role: Writes or updates LinkedIn profile details back into the Google Sheet for record-keeping  
  - Inputs: Data from "Get user Linkedin data" node  
  - Outputs: Feeds decision node on relationship state to start request process  
  - Edge cases: Write permission errors, concurrent edits  

---

#### 2.4 Relationship Status Check and Contact Request Sending

**Overview:**  
Decides if a LinkedIn contact request should be sent based on existing relationship status and performs the request if needed.

**Nodes Involved:**  
- if not is_relationship (If)  
- Send contact request (HTTP Request)  

**Node Details:**

- *if not is_relationship*  
  - Type: If  
  - Role: Conditional check on LinkedIn relationship status field indicating if contact is already connected  
  - Inputs: Outcome from profile population  
  - Outputs:  
    - True branch: Sends contact request  
    - False branch: Possibly sends icebreaker directly or skips  
  - Failure: Expression evaluation errors, missing status field  

- *Send contact request*  
  - Type: HTTP Request  
  - Role: Sends a LinkedIn contact request through the Unipile or LinkedIn API  
  - Configuration: API URL, request body with contact details and personalized message, authentication set up  
  - Inputs: If node's true branch triggering actual sending  
  - Outputs: Updates status sheet to reflect request sent  
  - Failures: API rejections, invitation limits exceeded, network errors  

---

#### 2.5 Post-Request Actions: Icebreaker Messaging

**Overview:**  
After the contact request is accepted, this block sends a predefined icebreaker message to initiate conversation.

**Nodes Involved:**  
- If status is invited (If)  
- Send Icebreaker (Execute Workflow)  
- Send Icebreaker1 (Execute Workflow)  

**Node Details:**

- *If status is invited*  
  - Type: If  
  - Role: Checks if contact request status shows 'invited' (request accepted)  
  - Inputs: Profile data or status from Google Sheets  
  - Outputs: Initiates the icebreaker workflow  
  - Failures: Status misread, inconsistent data  

- *Send Icebreaker / Send Icebreaker1*  
  - Type: Execute Workflow  
  - Role: Calls a sub-workflow dedicated to sending personalized icebreaker messages via LinkedIn or Unipile  
  - Inputs: Contact identifiers and prepared messages  
  - Outputs: Followed by status update nodes  
  - Requirements: Sub-workflow must exist and be configured correctly  
  - Failures: Sub-workflow errors, message sending failures  

---

#### 2.6 Status Updates and Logging

**Overview:**  
Updates the Google Sheets records to keep track of contact request and icebreaker message statuses.

**Nodes Involved:**  
- Update status  
- Update status1  
- Update status2  

**Node Details:**

- *Update status / Update status1 / Update status2*  
  - Type: Google Sheets  
  - Role: Updates rows in Google Sheets reflecting status changes after contact requests and icebreaker messages sent  
  - Inputs: Status and identifiers from send nodes  
  - Outputs: End of main processing chain for each contact  
  - Edge cases: Write conflicts, permission issues  

---

#### 2.7 Webhook and External API Integration

**Overview:**  
Manages communication with external systems (Unipile, LinkedIn APIs) and handles webhook responses.

**Nodes Involved:**  
- Create Webhook (HTTP Request)  
- Webhook status response (Form)  
- Response Webhook (Webhook)  
- Start chat (HTTP Request)  
- Get chat participants (HTTP Request)  
- Return attendee ID and Chat ID (Set)  

**Node Details:**

- *Create Webhook*  
  - Type: HTTP Request  
  - Role: Registers or maintains webhook endpoints in Unipile or other external systems  
  - Inputs: File write outputs or prior trigger  
  - Outputs: Receives webhook response for downstream use  
  - Failures: Registration errors, network issues  

- *Webhook status response*  
  - Type: Form  
  - Role: Responds to webhook calls confirming receipt or processing status  
  - Inputs: Incoming webhook calls  
  - Outputs: No further connections; serves as endpoint  

- *Response Webhook*  
  - Type: Webhook  
  - Role: Captures HTTP webhook callback data from external API or service  
  - Outputs: Passes data to file reading for persistence or further processing  

- *Start chat / Get chat participants*  
  - Type: HTTP Request  
  - Role: Initiates chat sessions and retrieves participant information for icebreaker messaging  
  - Configuration: Requires API keys and session data  
  - Outputs: Sends information downstream to manage attendee IDs and chats  

- *Return attendee ID and Chat ID*  
  - Type: Set  
  - Role: Extracts and sets key identifiers needed for messaging or status update  

---

### 3. Summary Table

| Node Name                          | Node Type               | Functional Role                                      | Input Node(s)                | Output Node(s)                     | Sticky Note                               |
|-----------------------------------|-------------------------|-----------------------------------------------------|------------------------------|----------------------------------|-------------------------------------------|
| When Executed by Another Workflow | ExecuteWorkflowTrigger  | Start workflow when called by another workflow      |                              | Read file2                        |                                           |
| Create Webhook                    | HTTP Request            | Registers webhook endpoints                          | Write file                    | Webhook status response           |                                           |
| Sticky Note                      | Sticky Note             | (Empty sticky note)                                  |                              |                                  |                                           |
| Start HERE                       | Form Trigger            | Form-based start trigger                             |                              | Split the DSN                    |                                           |
| Webhook status response          | Form                    | Responds to webhook calls                            | Create Webhook                |                                  |                                           |
| Send contact request             | HTTP Request            | Sends LinkedIn connection request                    | if not is_relationship        | Update status                    |                                           |
| if not is_relationship           | If                      | Checks if LinkedIn contact relationship exists      | Populate profiles             | Send contact request, Send Icebreaker1 |                                           |
| Get linkedin profiles            | Google Sheets           | Retrieves LinkedIn profiles                          | Extract from File             | Extract username from Linkedin Link |                                           |
| Populate profiles                | Google Sheets           | Updates LinkedIn profile details                      | Get user Linkedin data        | if not is_relationship           |                                           |
| Response Webhook                 | Webhook                 | Receives webhook data                                |                              | Read file1                      |                                           |
| Get chat participants           | HTTP Request            | Gets chat participants for icebreaker messaging     | Start chat                   | Return attendee ID and Chat ID    |                                           |
| Convert to File                 | ConvertToFile           | Converts data to file format                          | Split the DSN                 | Write file                      |                                           |
| Extract from File               | ExtractFromFile         | Extracts data from input file                         | Read file                    | Get linkedin profiles            |                                           |
| Extract from File1              | ExtractFromFile         | Extracts data from webhook response file             | Read file1                   | Get linkedin profiles1           |                                           |
| Extract from File2              | ExtractFromFile         | Extracts data for chat initialization                 | Read file2                   | Start chat                      |                                           |
| Read file                      | ReadWriteFile           | Reads input file for LinkedIn data                    | Use this worflow to start the whole pocess | Extract from File           |                                           |
| Write file                     | ReadWriteFile           | Writes converted data to file                          | Convert to File              | Create Webhook                  |                                           |
| Read file1                     | ReadWriteFile           | Reads data file for webhook response                   | Response Webhook             | Extract from File1              |                                           |
| Read file2                     | ReadWriteFile           | Reads file with chat data                              | When Executed by Another Workflow | Extract from File2             |                                           |
| Get linkedin profiles1          | Google Sheets           | Retrieves LinkedIn profiles for status check          | Extract from File1           | If status is invited            |                                           |
| If status is invited            | If                      | Checks if contact request has been accepted            | Get linkedin profiles1       | Send Icebreaker                 |                                           |
| Send Icebreaker                 | Execute Workflow        | Sends icebreaker message via sub-workflow              | If status is invited         | Update status1                  |                                           |
| Send Icebreaker1                | Execute Workflow        | Alternate icebreaker sender for no relationship branches | if not is_relationship     | Update status2                  |                                           |
| Update status                  | Google Sheets           | Updates status after contact request sent               | Send contact request         |                                  |                                           |
| Get user Linkedin data          | HTTP Request            | Gets detailed LinkedIn profile info                     | Extract username from Linkedin Link | Populate profiles         |                                           |
| Extract username from Linkedin Link | Code                 | Extracts username from a LinkedIn URL                    | Get linkedin profiles        | Get user Linkedin data           |                                           |
| Split the DSN                   | Set                    | Processes input data before converting                   | Start HERE                  | Convert to File                  |                                           |
| Start chat                     | HTTP Request            | Initiate chat session with LinkedIn contact             | Extract from File2           | Get chat participants           |                                           |
| Return attendee ID and Chat ID  | Set                    | Extracts chat and attendee IDs for messaging              | Get chat participants        |                                  |                                           |
| Update status1                 | Google Sheets           | Updates status after icebreaker sending                   | Send Icebreaker              |                                  |                                           |
| Update status2                 | Google Sheets           | Updates status after alternate icebreaker sending         | Send Icebreaker1             |                                  |                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Primary Triggers:**  
   - Create a *Form Trigger* node named “Start HERE” to initiate from a web form.  
   - Create a *Manual Trigger* named “Use this worflow to start the whole pocess” for manual runs.  
   - Create an *ExecuteWorkflowTrigger* node named “When Executed by Another Workflow” for inter-workflow calls.

2. **Set Up File Reading Nodes:**  
   - Add three *ReadWriteFile* nodes: “Read file,” “Read file1,” and “Read file2.” Configure their file paths to archive or ingest the relevant LinkedIn data files, making sure files exist for self-hosted environment.  
   - Connect "Use this worflow to start the whole pocess" → "Read file"  
   - Connect "When Executed by Another Workflow" → "Read file2"  
   - Connect "Response Webhook" → "Read file1"

3. **Data Extraction Nodes:**  
   - Add three *ExtractFromFile* nodes: “Extract from File,” “Extract from File1,” and “Extract from File2,” each configured to parse the expected input files from above read nodes (e.g., CSV or JSON parsers).  
   - Connect “Read file”→ “Extract from File”  
   - Connect “Read file1”→ “Extract from File1”  
   - Connect “Read file2”→ “Extract from File2”

4. **Data Processing Chain:**  
   - Add a *Set* node named “Split the DSN” to handle preprocessing of input data fields (e.g., parsing composite fields). Connect from “Start HERE” trigger.  
   - Add a *ConvertToFile* node named “Convert to File” to convert split data into suitable file format for sequencing. Attach output from “Split the DSN.”  
   - Add a *ReadWriteFile* node “Write file” to save converted file. Connect “Convert to File” → “Write file.”

5. **Webhook Setup:**  
   - Add an *HTTP Request* node named “Create Webhook” to register or interact with external webhook services using saved files. Connect “Write file” → “Create Webhook.”  
   - Add a *Form* node “Webhook status response” to respond to webhook calls. Link from “Create Webhook.”  
   - Add a *Webhook* node “Response Webhook” to receive incoming webhook data. Connect downstream to “Read file1.”

6. **LinkedIn Profile Management:**  
   - Add *Google Sheets* nodes: “Get linkedin profiles” and “Get linkedin profiles1.” Configure each with your Google Sheets credentials and sheet names/ ranges to retrieve profile data. Connect “Extract from File” to “Get linkedin profiles,” and “Extract from File1” to “Get linkedin profiles1.”  
   - Add an *HTTP Request* node “Get user Linkedin data” to query Unipile or LinkedIn API for detailed profile info, configured with appropriate API key credentials. Connect “Extract username from Linkedin Link” → “Get user Linkedin data.”  
   - Add a *Code* node “Extract username from Linkedin Link” with JavaScript to extract usernames from URLs. Connect “Get linkedin profiles” → “Extract username from Linkedin Link.”  
   - Add a *Google Sheets* node “Populate profiles” for updating profile info, connect from “Get user Linkedin data.”  
   - Connect “Populate profiles” → “if not is_relationship” (below).

7. **Decision and Request Sending:**  
   - Add an *If* node “if not is_relationship” to check relationship status from profile data.  
   - Add HTTP Request node “Send contact request” configured to send LinkedIn contact requests via Unipile API with authentication headers. Connect If’s true branch to “Send contact request.”  
   - Add *Google Sheets* node “Update status” to update sheet when requests are sent, connected from “Send contact request.”

8. **Post-Request Icebreaker Messaging:**  
   - Add *If* node “If status is invited” linked after “Get linkedin profiles1” to check if the invite was accepted.  
   - Add *Execute Workflow* node “Send Icebreaker” linked from true output of the above to trigger a sub-workflow sending icebreaker messages.  
   - Add *Google Sheets* nodes “Update status1” and “Update status2” to update respective message sending statuses after icebreaker executions.  
   - Add an alternate *Execute Workflow* “Send Icebreaker1” called by false branch or “if not is_relationship” branch for contacts already connected or processed alternate flows.

9. **Chat Management for Icebreaker:**  
   - Include HTTP Request node “Start chat” to initiate chat sessions for contacts. Input from “Extract from File2.”  
   - Add HTTP Request node “Get chat participants” to pull participants for chat. Connect “Start chat” → “Get chat participants.”  
   - Use a *Set* node “Return attendee ID and Chat ID” to extract and prepare IDs used by icebreaker message sending workflows.

10. **Credential Setup:**  
    - Configure credentials for Google Sheets with API access.  
    - Configure HTTP credentials for Unipile, LinkedIn API (OAuth2 or API key).  
    - Test handling of rate limits (LinkedIn invitation limits) and ensure API keys have sufficient scopes.

11. **Additional Configuration:**  
    - Add necessary sticky notes throughout to document usage and parameter settings.  
    - Validate error handling on all HTTP Request nodes for status codes, retries, and error catch.  
    - Test full workflow by running manual trigger and submitting form input.  

---

### 5. General Notes & Resources

| Note Content                                                                                                     | Context or Link                                                                                             |
|-----------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| Workflow only works on self-hosted instances due to its use of filesystem for intermediate files                | Mentioned in Workflow Description                                                                           |
| LinkedIn free accounts limited to 150 contact requests per week, multiple accounts recommended for volume       | Workflow Description                                                                                        |
| Account creation for Unipile required for API access and integration                                           | https://www.unipile.com/?utm_source=partner&utm_campaign=pollup_data                                       |
| Google Sheets template provided to organize LinkedIn contact data                                              | https://docs.google.com/spreadsheets/d/17D1Y-S-4C6iVHZAzlfe-rRvR1prezeLkfCgTfheBxUA/edit?gid=0#gid=0        |
| Users should customize contact and icebreaker messages to increase engagement                                   | Workflow Description                                                                                        |
| The workflow includes a sub-workflow dedicated to sending icebreaker messages; ensure it is imported and connected correctly | Referenced by Execute Workflow nodes “Send Icebreaker” and “Send Icebreaker1”                              |

---

This structured documentation comprehensively describes the workflow’s purpose, components, and operational details, enabling accurate reproduction, effective modification, and smooth integration with external systems.