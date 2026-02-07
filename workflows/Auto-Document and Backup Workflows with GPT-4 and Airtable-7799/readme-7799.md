Auto-Document and Backup Workflows with GPT-4 and Airtable

https://n8nworkflows.xyz/workflows/auto-document-and-backup-workflows-with-gpt-4-and-airtable-7799


# Auto-Document and Backup Workflows with GPT-4 and Airtable

### 1. Workflow Overview

This workflow automates the backup and AI-driven documentation of n8n workflows by periodically scanning all workflows, detecting new versions (snapshots), storing snapshot data in Airtable, and generating concise AI summaries and change logs leveraging GPT-4. It is designed for users who want to maintain a centralized, versioned backup repository of their n8n workflows with AI-generated documentation for easier tracking and understanding of workflow changes over time.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Workflow Retrieval:** Triggered on a schedule, retrieves all n8n workflows and compares them against existing backups in Airtable.
- **1.2 Snapshot Identification and Filtering:** Identifies new or updated workflow versions (snapshots) that need to be backed up.
- **1.3 Workflow Metadata Upsert:** Creates or updates workflow records in Airtable with metadata.
- **1.4 Snapshot Download and Comparison:** Downloads the previous snapshot for a workflow and compares it with the current version.
- **1.5 AI Processing:** Uses GPT-4 to generate or regenerate workflow summaries and change logs based on the differences detected.
- **1.6 Snapshot Storage:** Stores the new workflow version and associated AI-generated documentation as snapshots in Airtable.
- **1.7 Finalization:** Handles file storage into Airtable attachments and introduces wait times to respect API rate limits.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Workflow Retrieval

**Overview:**  
This block triggers the workflow on a daily schedule at 8 AM and retrieves all existing workflows from the connected n8n instance. It initiates the process of identifying workflows that need backup.

**Nodes Involved:**  
- Schedule Trigger  
- Get all n8n workflows  
- Search all existing snapshots (Airtable)  
- Match snapshot IDs  
- Only keep new snapshots  

**Node Details:**  

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Config: Runs daily at 8:00 AM  
  - Inputs: None (trigger node)  
  - Outputs: Initiates the workflow  
  - Edge cases: Misconfiguration of schedule or workflow activation status could prevent triggering.

- **Get all n8n workflows**  
  - Type: n8n API node  
  - Config: Retrieves all workflows excluding pinned data  
  - Credentials: n8n API OAuth2 or API token  
  - Output: List of workflows with metadata (id, name, version, timestamps)  
  - Edge cases: API authentication failure, large data sets causing timeouts.

- **Search all existing snapshots (Airtable)**  
  - Type: Airtable node (search operation)  
  - Config: Searches "Snapshots" table for stored snapshot version IDs  
  - Credentials: Airtable API token  
  - Output: List of existing snapshot version IDs  
  - Edge cases: Airtable API rate limiting or authentication errors.

- **Match snapshot IDs**  
  - Type: Merge  
  - Config: Joins workflows with existing snapshot IDs by matching workflow version IDs  
  - Output: Combined dataset showing which workflows have new versions  
  - Edge cases: Mismatches due to inconsistent IDs or missing fields.

- **Only keep new snapshots**  
  - Type: Filter  
  - Config: Filters workflows to only those without existing snapshots or with new versions  
  - Output: List of workflows to process further  
  - Edge cases: Incorrect filtering logic could skip workflows needing backup.

---

#### 2.2 Snapshot Identification and Filtering

**Overview:**  
Processes the filtered workflows in batches to manage API rate limits and system resource usage.

**Nodes Involved:**  
- Loop Over Items  

**Node Details:**  

- **Loop Over Items**  
  - Type: SplitInBatches  
  - Config: Processes workflows one by one (default options)  
  - Input: List of workflows needing backup  
  - Output: Individual workflow items for sequential processing  
  - Edge cases: Large numbers of workflows could increase total run time.

---

#### 2.3 Workflow Metadata Upsert

**Overview:**  
Creates or updates workflow records in the Airtable "Workflows" table, ensuring metadata such as workflow ID, name, and creation time are current.

**Nodes Involved:**  
- Create or update workflow  
- Search all snapshots  

**Node Details:**  

- **Create or update workflow**  
  - Type: Airtable (upsert)  
  - Config: Matches by Workflow ID, updates name and creation time  
  - Input: Workflow metadata from Loop Over Items  
  - Output: Airtable record of workflow  
  - Edge cases: Airtable API errors, conflicts on unique keys.

- **Search all snapshots**  
  - Type: Airtable (search)  
  - Config: Filters snapshots by current workflow ID to retrieve related snapshots  
  - Output: Snapshot data per workflow  
  - Edge cases: Airtable API call failures.

---

#### 2.4 Snapshot Download and Comparison

**Overview:**  
Fetches the last snapshot workflow file from Airtable and compares it to the current workflow version to identify changes.

**Nodes Involved:**  
- Check workflow status (Code)  
- Existing workflow? (If)  
- Download previous snapshot  
- Extract from File1  
- State that this is the first version  
- Document workflow differences  
- Prepare edits since last snapshot  
- Consolidate edits since last snapshot  

**Node Details:**  

- **Check workflow status**  
  - Type: Code  
  - Config: Counts snapshot records, applies logic to determine when to regenerate AI summaries (for 0,1,2, or multiples of 5 snapshots)  
  - Output: Boolean flag for AI summary regeneration  
  - Edge cases: Unexpected input formats or missing snapshot data.

- **Existing workflow?**  
  - Type: If  
  - Config: Checks if snapshot count > 0 to decide if previous snapshot exists  
  - Output: Branching to either download previous snapshot or mark as first version  
  - Edge cases: Incorrect condition may misroute processing.

- **Download previous snapshot**  
  - Type: Airtable (search)  
  - Config: Downloads the last snapshot's workflow file using snapshot ID  
  - Output: Binary file data of previous snapshot workflow JSON  
  - Edge cases: Missing file attachment, Airtable API limits.

- **Extract from File1**  
  - Type: Extract from File  
  - Config: Extracts JSON from the binary attachment field "Workflow_file_0"  
  - Output: Parsed previous workflow JSON  
  - Edge cases: File not JSON or corrupt binary data.

- **State that this is the first version**  
  - Type: Set  
  - Config: Sets a string flag "Edits since last snapshot" to "N/A - First identified version"  
  - Output: Text note for first snapshot case.

- **Document workflow differences**  
  - Type: Langchain Chain LLM (OpenAI GPT-4)  
  - Config: Compares previous snapshot JSON to current workflow JSON, returns a concise one-sentence summary of differences  
  - Input: Previous snapshot JSON and current workflow JSON  
  - Output: Summary text of workflow edits  
  - Edge cases: Large JSON input causing token limits or timeout.

- **Prepare edits since last snapshot**  
  - Type: Set  
  - Config: Assigns the AI-generated text difference to a field "Edits since last snapshot"  
  - Output: Structured edits summary.

- **Consolidate edits since last snapshot**  
  - Type: Set  
  - Config: Passes the "Edits since last snapshot" forward for storage  
  - Output: Final edits summary string.

---

#### 2.5 AI Processing

**Overview:**  
Determines if a new AI summary for the workflow should be generated and, if so, calls GPT-4 to produce it.

**Nodes Involved:**  
- Needs new workflow summary? (If)  
- Re-summarise workflow  
- Store new workflow summary  

**Node Details:**  

- **Needs new workflow summary?**  
  - Type: If  
  - Config: Checks the boolean from "Check workflow status" to decide if AI summary regeneration is needed  
  - Output: Branches to regenerate or skip

- **Re-summarise workflow**  
  - Type: Langchain Chain LLM (OpenAI GPT-4)  
  - Config: Takes current workflow JSON and returns a 1-sentence description of its purpose  
  - Output: AI-generated workflow summary  
  - Edge cases: API errors, token limits.

- **Store new workflow summary**  
  - Type: Airtable (update)  
  - Config: Updates the workflow record with the new AI summary text using the Airtable record ID  
  - Output: Updated workflow record  
  - Edge cases: Airtable update errors.

---

#### 2.6 Snapshot Storage

**Overview:**  
Stores the new snapshot with metadata and AI-generated edits into Airtable, uploads the workflow JSON file as an attachment, and triggers a wait to avoid API rate limits.

**Nodes Involved:**  
- Store new snapshot  
- Get full workflow JSON  
- Move Binary Data  
- Extract from File  
- Store workflow file into Airtable  
- Wait  
- The backup is done! (NoOp)  

**Node Details:**  

- **Store new snapshot**  
  - Type: Airtable (create)  
  - Config: Creates new record in "Snapshots" table including workflow link, version ID, update time, and edits summary  
  - Output: Snapshot record with new ID  
  - Edge cases: Airtable create errors.

- **Get full workflow JSON**  
  - Type: n8n API node  
  - Config: Downloads full workflow JSON for the current workflow ID  
  - Output: Binary JSON file of workflow  
  - Edge cases: API failures or missing workflow.

- **Move Binary Data**  
  - Type: Move Binary Data  
  - Config: Converts JSON string to binary in property "file" for upload  
  - Output: Binary data prepared for Airtable upload

- **Extract from File**  
  - Type: Extract from File  
  - Config: Converts binary data to property for easy handling

- **Store workflow file into Airtable**  
  - Type: HTTP Request  
  - Config: Uploads the binary JSON file as an attachment to the snapshot record in Airtable via REST API  
  - Note: Requires manual replacement of `<AIRTABLE-BASE-ID>` in URL with actual Airtable base ID  
  - Edge cases: API endpoint errors, auth failures, incorrect base ID

- **Wait**  
  - Type: Wait  
  - Config: Pauses workflow for 3 seconds to avoid hitting Airtable API rate limits  
  - Output: Controls pacing

- **The backup is done!**  
  - Type: NoOp  
  - Config: Marks the end of the backup process for a single workflow item

---

#### 2.7 Notes and Documentation Nodes

Several Sticky Note nodes provide contextual instructions and explanations for users setting up or modifying the workflow. These include:

- How to insert Airtable base ID for file upload  
- Explanation of AI summary regeneration frequency logic  
- Overview of the entire backup and AI documentation process  
- Instructions to duplicate Airtable base and connect credentials  
- Guidance on AI model selection for token efficiency  
- Reminder to respect API rate limits  

---

### 3. Summary Table

| Node Name                     | Node Type                      | Functional Role                              | Input Node(s)               | Output Node(s)                  | Sticky Note                                                                                          |
|-------------------------------|--------------------------------|----------------------------------------------|-----------------------------|--------------------------------|----------------------------------------------------------------------------------------------------|
| Schedule Trigger              | Schedule Trigger               | Initiate workflow on schedule                 | None                        | Get all n8n workflows, Search all existing snapshots | Define your backup frequency (daily at 8 AM)                                                       |
| Get all n8n workflows         | n8n API                       | Retrieve all workflows from n8n instance      | Schedule Trigger            | Match snapshot IDs             | Retrieving all workflows that have new snapshots                                                   |
| Search all existing snapshots | Airtable Search               | Get list of existing snapshot IDs             | Schedule Trigger            | Match snapshot IDs             | Retrieving all workflows that have new snapshots                                                   |
| Match snapshot IDs            | Merge                        | Identify new workflow versions to backup      | Get all n8n workflows, Search all existing snapshots | Only keep new snapshots       | Retrieving all workflows that have new snapshots                                                   |
| Only keep new snapshots       | Filter                       | Filter workflows to only new/updated versions | Match snapshot IDs           | Loop Over Items                | Retrieving all workflows that have new snapshots                                                   |
| Loop Over Items               | SplitInBatches               | Process workflows one by one                    | Only keep new snapshots      | Create or update workflow, The backup is done! |                                                                                                    |
| Create or update workflow     | Airtable Upsert              | Create or update workflow metadata in Airtable | Loop Over Items             | Search all snapshots          | If no record, create new workflow record; else update name                                        |
| Search all snapshots          | Airtable Search              | Retrieve snapshots linked to current workflow | Create or update workflow    | Check workflow status         |                                                                                                    |
| Check workflow status         | Code                         | Count snapshots and determine AI summary regen | Search all snapshots         | Existing workflow?            | Determines when to regenerate AI summary (0,1,2,multiples of 5 snapshots)                          |
| Existing workflow?            | If                           | Branch based on snapshot presence              | Check workflow status        | Download previous snapshot (yes), State that this is the first version (no) |                                                                                                    |
| Download previous snapshot    | Airtable Search              | Download last snapshot workflow file           | Existing workflow? (yes)     | Extract from File1            |                                                                                                    |
| Extract from File1            | Extract from File             | Extract JSON from binary snapshot file         | Download previous snapshot   | Document workflow differences |                                                                                                    |
| State that this is the first version | Set                      | Mark first snapshot version                      | Existing workflow? (no)      | Consolidate edits since last snapshot |                                                                                                    |
| Document workflow differences | Langchain Chain LLM          | Generate 1-sentence summary of changes         | Extract from File1, Loop Over Items | Prepare edits since last snapshot | AI-documenting the edits VS the previous snapshot                                                  |
| Prepare edits since last snapshot | Set                       | Assign changes summary text                      | Document workflow differences | Consolidate edits since last snapshot |                                                                                                    |
| Consolidate edits since last snapshot | Set                    | Pass edits summary forward                        | Prepare edits since last snapshot | Needs new workflow summary?   |                                                                                                    |
| Needs new workflow summary?   | If                           | Decide if AI summary needs regeneration         | Consolidate edits since last snapshot | Re-summarise workflow (yes), Store new snapshot (no) |                                                                                                    |
| Re-summarise workflow         | Langchain Chain LLM          | Generate 1-sentence AI summary of workflow      | Needs new workflow summary?  | Store new workflow summary    | (Re)-summarising workflow with AI at specific snapshot counts                                      |
| Store new workflow summary    | Airtable Update              | Update workflow record with AI summary          | Re-summarise workflow        | Store new snapshot            |                                                                                                    |
| Store new snapshot            | Airtable Create              | Create new snapshot record with metadata & edits | Needs new workflow summary? (no), Store new workflow summary | Get full workflow JSON        |                                                                                                    |
| Get full workflow JSON        | n8n API                      | Download full workflow JSON                      | Store new snapshot           | Move Binary Data              |                                                                                                    |
| Move Binary Data              | Move Binary Data             | Convert JSON string to binary data for upload   | Get full workflow JSON       | Extract from File             |                                                                                                    |
| Extract from File             | Extract from File            | Convert binary data to property for upload      | Move Binary Data             | Store workflow file into Airtable |                                                                                                    |
| Store workflow file into Airtable | HTTP Request              | Upload workflow JSON file to Airtable attachment | Extract from File            | Wait                         | Insert your Airtable base ID into the URL (replace <AIRTABLE-BASE-ID>)                             |
| Wait                         | Wait                         | Pause to avoid API rate limits                   | Store workflow file into Airtable | Loop Over Items              | Let's give some time to Airtable's API to rest                                                     |
| The backup is done!           | NoOp                         | Marks end of backup for one workflow item        | Loop Over Items             | None                         |                                                                                                    |
| Sticky Notes (multiple)       | Sticky Note                  | Provide documentation and instructions           | None                        | None                         | See detailed notes in section 5                                                                  |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Parameters: Set to run daily at 8:00 AM  

2. **Add n8n API node "Get all n8n workflows"**  
   - Operation: List workflows (exclude pinned data)  
   - Credentials: Your n8n API OAuth2 or API token  
   - Connect: From Schedule Trigger output  

3. **Add Airtable node "Search all existing snapshots"**  
   - Operation: Search  
   - Base and Table: Select your Airtable base and "Snapshots" table  
   - Options: Only retrieve "n8n version ID" field  
   - Credentials: Airtable API token  
   - Connect: From Schedule Trigger output  

4. **Add Merge node "Match snapshot IDs"**  
   - Mode: Combine (joinMode: keepNonMatches)  
   - Merge by fields: "versionId" (from workflows) and "n8n version ID" (from snapshots)  
   - Connect: Inputs from "Get all n8n workflows" and "Search all existing snapshots"  

5. **Add Filter node "Only keep new snapshots"**  
   - Condition: Filter to keep only workflows without matching snapshots  
   - Connect: From "Match snapshot IDs" output  

6. **Add SplitInBatches node "Loop Over Items"**  
   - Default options (batch size 1)  
   - Connect: From "Only keep new snapshots" output  

7. **Add Airtable Upsert node "Create or update workflow"**  
   - Operation: Upsert by Workflow ID  
   - Base and Table: Your Airtable base, "Workflows" table  
   - Mapping: Workflow ID, Name, Creation time from current item  
   - Credentials: Airtable API token  
   - Connect: From "Loop Over Items" output  

8. **Add Airtable Search node "Search all snapshots"**  
   - Operation: Search snapshots filtered by Workflow ID  
   - Connect: From "Create or update workflow" output  

9. **Add Code node "Check workflow status"**  
   - JavaScript code to count snapshots and determine if AI summary should be regenerated  
   - Connect: From "Search all snapshots" output  

10. **Add If node "Existing workflow?"**  
    - Condition: Number of snapshots > 0  
    - Connect: From "Check workflow status" output  

11. **Add Airtable Search node "Download previous snapshot"**  
    - Operation: Search for last snapshot by version ID  
    - Connect: From "Existing workflow?" (true branch)  

12. **Add Extract from File node "Extract from File1"**  
    - Operation: fromJson  
    - Binary property: "Workflow_file_0"  
    - Connect: From "Download previous snapshot" output  

13. **Add Set node "State that this is the first version"**  
    - Set field: "Edits since last snapshot" to "N/A - First identified version"  
    - Connect: From "Existing workflow?" (false branch)  

14. **Add Langchain Chain LLM node "Document workflow differences"**  
    - Prompt: Compare previous snapshot JSON with current workflow JSON, output a 1-sentence difference summary  
    - Connect: From "Extract from File1" (true branch)  

15. **Add Set node "Prepare edits since last snapshot"**  
    - Assign AI difference text to "Edits since last snapshot"  
    - Connect: From "Document workflow differences" output  
    - Also connect: From "State that this is the first version" (false branch)  

16. **Add Set node "Consolidate edits since last snapshot"**  
    - Pass "Edits since last snapshot" field onward  
    - Connect: From both previous Set nodes  

17. **Add If node "Needs new workflow summary?"**  
    - Condition: Based on "Re-generate AI summary?" from "Check workflow status"  
    - Connect: From "Consolidate edits since last snapshot" output  

18. **Add Langchain Chain LLM node "Re-summarise workflow"**  
    - Prompt: Generate 1-sentence description of the workflow  
    - Connect: From "Needs new workflow summary?" (true branch)  

19. **Add Airtable Update node "Store new workflow summary"**  
    - Updates the workflow record with AI summary text  
    - Connect: From "Re-summarise workflow" output  

20. **Add Airtable Create node "Store new snapshot"**  
    - Creates snapshot record with workflow link, version ID, update time, edits summary  
    - Connect: From "Needs new workflow summary?" (false branch) and "Store new workflow summary" output  

21. **Add n8n API node "Get full workflow JSON"**  
    - Operation: Get full workflow JSON by workflow ID  
    - Connect: From "Store new snapshot" output  

22. **Add Move Binary Data node**  
    - Converts JSON string to binary for upload  
    - Connect: From "Get full workflow JSON" output  

23. **Add Extract from File node**  
    - Extract binary data to property for upload  
    - Connect: From "Move Binary Data" output  

24. **Add HTTP Request node "Store workflow file into Airtable"**  
    - Method: POST  
    - URL: `https://content.airtable.com/v0/<AIRTABLE-BASE-ID>/{{ snapshotRecordId }}/Workflow_file/uploadAttachment`  
      - Replace `<AIRTABLE-BASE-ID>` with your Airtable base ID  
    - Body: file data and metadata  
    - Credentials: Airtable API token  
    - Connect: From "Extract from File" output  

25. **Add Wait node**  
    - Pause 3 seconds to avoid API rate limits  
    - Connect: From "Store workflow file into Airtable" output  

26. **Connect Wait output back to "Loop Over Items"**  
    - Allows processing the next workflow item  

27. **Add NoOp node "The backup is done!"**  
    - Ends processing for each workflow item  
    - Connect: From "Loop Over Items" output (second output branch)  

28. **Add Sticky Notes at relevant points**  
    - Add all instructional sticky notes seen in the original workflow for documentation  

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                     | Context or Link                                                                                                     |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| Automated Workflow Backup & AI Documenter: This workflow runs on a schedule to find new versions of your workflows. It uses AI to generate a summary and a "what's new" changelog, then saves the backup `.json` file and all documentation to a central Airtable base. Instructions to duplicate Airtable base, connect credentials, update URLs, and activate workflow. | https://airtable.com/appPFFj6CUUhZyDPT/shrorM8k6HsUqBACB (Airtable base to duplicate)                             |
| Insert your Airtable base ID into the URL in the "Store workflow file into Airtable" node. Replace `<AIRTABLE-BASE-ID>` with your actual base ID (starts with "app...") from your Airtable URL. This enables direct attachment uploads using Airtable API without external storage.                                                                                               | Critical manual step to enable file upload to Airtable                                                             |
| AI summary regeneration frequency can be customized in the "Check workflow status" code node. By default, it regenerates on 0,1,2 and multiples of 5 snapshots to balance token usage and summary freshness.                                                                                                                                                              | Adjust logic in code node to change frequency                                                                        |
| To avoid hitting Airtable API rate limits, a 3-second wait is introduced after each file upload.                                                                                                                                                                                                                                                                               | See "Wait" node                                                                                                    |
| Recommended to connect your preferred AI provider (e.g., OpenAI with GPT-4) and select an efficient model depending on workflow JSON size. For very large workflows, smaller models can be used to reduce token consumption.                                                                                                                                                   | See "OpenAI Chat Model1" node configuration                                                                        |
| This workflow was built by Guillaume Duvernay and is offered as a template for automated backup and AI documentation of n8n workflows.                                                                                                                                                                                                                                        | Author credit                                                                                                       |

---

**Disclaimer:**  
The provided content originates exclusively from an automated workflow created with n8n, an integration and automation tool. The workflow complies strictly with current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and publicly accessible.