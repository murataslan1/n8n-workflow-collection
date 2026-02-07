Automate Droplet Snapshots on DigitalOcean

https://n8nworkflows.xyz/workflows/automate-droplet-snapshots-on-digitalocean-2485


# Automate Droplet Snapshots on DigitalOcean

### 1. Workflow Overview

This workflow automates the lifecycle management of DigitalOcean Droplet snapshots to optimize storage usage and reduce costs. It is designed for cloud administrators, DevOps teams, or developers managing multiple DigitalOcean Droplets who need an automated system to keep snapshot counts under control.

The workflow logically divides into the following blocks:

- **1.1 Trigger and Scheduling**: Initiates the workflow every 48 hours to maintain regular snapshot management.
- **1.2 Droplet Enumeration**: Retrieves a list of all droplets in the DigitalOcean account.
- **1.3 Snapshot Retrieval and Filtering**: For each droplet, collects its snapshots and checks if the count exceeds a defined threshold (4).
- **1.4 Snapshot Cleanup**: Deletes the oldest snapshot(s) if the snapshot count is at or above the threshold.
- **1.5 Snapshot Creation**: Creates a new snapshot for the droplet after cleanup to ensure up-to-date backups.

---

### 2. Block-by-Block Analysis

#### 2.1 Trigger and Scheduling

- **Overview:**  
  This block triggers the entire workflow to run automatically every 48 hours, ensuring snapshot management occurs regularly without manual intervention.

- **Nodes Involved:**  
  - Runs every 48hrs (Cron)

- **Node Details:**  
  - **Runs every 48hrs**  
    - Type: Cron  
    - Role: Triggers the workflow execution on a schedule  
    - Configuration: Set to run every 48 hours (mode: everyX, value: 48)  
    - Input Connections: None (starting node)  
    - Output Connections: Connects to “List All Droplets” node  
    - Edge Cases: If n8n is down at scheduled time, execution will be delayed until next available runtime. Adjusting frequency requires editing this node.  
    - Sticky Note: Explains the trigger schedule and customization options.

#### 2.2 Droplet Enumeration

- **Overview:**  
  Retrieves the complete list of DigitalOcean Droplets to be processed for snapshot management.

- **Nodes Involved:**  
  - List All Droplets

- **Node Details:**  
  - **List All Droplets**  
    - Type: HTTP Request  
    - Role: Calls DigitalOcean API endpoint to list droplets  
    - Configuration:  
      - URL: `https://api.digitalocean.com/v2/droplets`  
      - Authentication: DigitalOcean API key via header authentication  
      - Request Method: GET (default)  
    - Input Connections: From “Runs every 48hrs”  
    - Output Connections: To “List Snapshots for a Droplet”  
    - Edge Cases: API rate limits, network errors, or invalid API key may cause failures. Should check response for empty or partial data.  
    - Sticky Note: Describes its purpose to fetch all droplets.

#### 2.3 Snapshot Retrieval and Filtering

- **Overview:**  
  For each droplet, this block fetches its associated snapshots and filters droplets with 4 or more snapshots to identify candidates for cleanup.

- **Nodes Involved:**  
  - List Snapshots for a Droplet  
  - Filter

- **Node Details:**  
  - **List Snapshots for a Droplet**  
    - Type: HTTP Request  
    - Role: Retrieves snapshots for a specific droplet  
    - Configuration:  
      - URL template: `https://api.digitalocean.com/v2/droplets/{{ $json.droplets[0].id }}/snapshots` (uses droplet ID from previous node)  
      - Authentication: DigitalOcean API key via header  
    - Input Connections: From “List All Droplets”  
    - Output Connections: To “Filter”  
    - Edge Cases: If droplet ID is missing or invalid, API returns error. Also, droplets without snapshots will return empty lists.  
    - Sticky Note: Indicates its function to get snapshots per droplet.

  - **Filter**  
    - Type: Filter  
    - Role: Evaluates if the total number of snapshots for the droplet is 4 or more  
    - Configuration:  
      - Condition: `$json.meta.total >= 4`  
    - Input Connections: From “List Snapshots for a Droplet”  
    - Output Connections: If condition true, connects to “Delete a Snapshot”  
    - Edge Cases: If `$json.meta.total` is undefined or parsing fails, filter may misbehave. Also, droplets with fewer than 4 snapshots skip deletion.  
    - Sticky Note: Explains the threshold check.

#### 2.4 Snapshot Cleanup

- **Overview:**  
  Deletes the oldest snapshot for droplets exceeding the snapshot limit to keep snapshot counts manageable.

- **Nodes Involved:**  
  - Delete a Snapshot

- **Node Details:**  
  - **Delete a Snapshot**  
    - Type: HTTP Request  
    - Role: Deletes a specific snapshot by ID via DigitalOcean API  
    - Configuration:  
      - URL template: `https://api.digitalocean.com/v2/snapshots/{{ $json.snapshots[0].id }}` (targets oldest snapshot ID)  
      - Request Method: DELETE  
      - Authentication: DigitalOcean API key via header  
    - Input Connections: From “Filter” (true branch)  
    - Output Connections: To “Droplet Actions snapshot (n8n.optimus01.co.za)”  
    - Edge Cases: Deletion may fail due to invalid snapshot ID, API rate limits, or permission issues. Should handle HTTP errors gracefully.  
    - Sticky Note: Describes deletion of oldest snapshot based on filter.

#### 2.5 Snapshot Creation

- **Overview:**  
  Creates a new snapshot for the droplet after old snapshots have been cleaned up, ensuring continuous backup coverage.

- **Nodes Involved:**  
  - Droplet Actions snapshot (n8n.optimus01.co.za)

- **Node Details:**  
  - **Droplet Actions snapshot (n8n.optimus01.co.za)**  
    - Type: HTTP Request  
    - Role: Initiates snapshot creation action for a droplet via DigitalOcean API  
    - Configuration:  
      - URL template: `https://api.digitalocean.com/v2/droplets/{{ $('List All Droplets').item.json.droplets[0].id }}/actions`  
      - Request Method: POST  
      - Body Parameters: `{ "type": "snapshot" }` to specify snapshot creation  
      - Authentication: DigitalOcean API key via header  
    - Input Connections: From “Delete a Snapshot”  
    - Output Connections: None (end of workflow)  
    - Edge Cases: Snapshot creation may fail due to API limits, droplet state, or network issues. Confirm status response for success.  
    - Sticky Note: Highlights creation of new snapshot post cleanup.

---

### 3. Summary Table

| Node Name                         | Node Type         | Functional Role                                  | Input Node(s)          | Output Node(s)                          | Sticky Note                                                                                                                           |
|----------------------------------|-------------------|-------------------------------------------------|------------------------|---------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| Runs every 48hrs                 | Cron              | Triggers workflow every 48 hours                 | -                      | List All Droplets                     | ## Trigger workflow every 48 hours This node triggers the workflow to run every 48 hours. You can adjust the frequency if needed.    |
| List All Droplets                 | HTTP Request      | Lists all DigitalOcean droplets                   | Runs every 48hrs        | List Snapshots for a Droplet          | ## Get all droplets from DigitalOcean Fetches a list of all the droplets in your DigitalOcean account. This is the first step.       |
| List Snapshots for a Droplet      | HTTP Request      | Retrieves snapshots for each droplet              | List All Droplets       | Filter                              | ## Retrieve snapshots for a droplet Retrieves all the snapshots associated with a specific droplet.                                   |
| Filter                           | Filter            | Checks if snapshot count ≥ 4                        | List Snapshots for a Droplet | Delete a Snapshot                    | ## Check if there are more than 4 snapshots Checks if the number of snapshots for a droplet is equal to or greater than 4.            |
| Delete a Snapshot                | HTTP Request      | Deletes the oldest snapshot when limit exceeded  | Filter                  | Droplet Actions snapshot (n8n.optimus01.co.za) | ## Delete the oldest snapshot Deletes the oldest snapshot from the droplet if snapshot count exceeds limit.                            |
| Droplet Actions snapshot (n8n.optimus01.co.za) | HTTP Request | Creates a new snapshot for the droplet             | Delete a Snapshot        | -                                   | ## Create a new snapshot Creates a new snapshot after cleanup to keep backups updated.                                                  |
| Sticky Note2                    | Sticky Note       | Documentation on trigger frequency                 | -                      | -                                   | ## Trigger workflow every 48 hours This node triggers the workflow to run every 48 hours. You can adjust the frequency if needed.     |
| Sticky Note3                    | Sticky Note       | Documentation on droplets listing step             | -                      | -                                   | ## Get all droplets from DigitalOcean Fetches a list of all the droplets in your DigitalOcean account.                                  |
| Sticky Note4                    | Sticky Note       | Documentation on snapshot retrieval                 | -                      | -                                   | ## Retrieve snapshots for a droplet Retrieves all the snapshots associated with a specific droplet.                                   |
| Sticky Note5                    | Sticky Note       | Documentation on snapshot count filtering           | -                      | -                                   | ## Check if there are more than 4 snapshots Checks if the number of snapshots for a droplet is equal to or greater than 4.            |
| Sticky Note6                    | Sticky Note       | Documentation on snapshot deletion                   | -                      | -                                   | ## Delete the oldest snapshot Deletes the oldest snapshot from the droplet if snapshot count exceeds limit.                            |
| Sticky Note7                    | Sticky Note       | Documentation on snapshot creation                   | -                      | -                                   | ## Create a new snapshot Creates a new snapshot after cleanup to keep backups updated.                                                  |
| Sticky Note1                    | Sticky Note       | Summary of workflow steps                            | -                      | -                                   | ### What this workflow does … (full summary content)                                                                                  |
| Sticky Note9                    | Sticky Note       | Workflow branding and purpose                        | -                      | -                                   | ## Automate Droplet Snapshot Management on DigitalOcean Built for the Let's Automate It Community by Optimus Agency                    |
| Sticky Note14                   | Sticky Note       | Setup instructions                                  | -                      | -                                   | ## Setup DigitalOcean API Key, Snapshot Threshold, Execution Frequency                                                                |
| Sticky Note15                   | Sticky Note       | Customization instructions                          | -                      | -                                   | ## How to customize Adjust Snapshot Limit, Run Frequency, Add Notifications                                                           |
| Sticky Note11                   | Sticky Note       | Link to community resources                          | -                      | -                                   | ### Get More Templates Like This 👇 [Video Thumbnail](http://onlinethinking.io/community)                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Cron Node**  
   - Name: `Runs every 48hrs`  
   - Type: Cron Trigger  
   - Parameters: Set trigger mode to “everyX” with value 48 (hours)  
   - No credentials required  
   - Purpose: Schedule workflow execution every 48 hours.

2. **Create HTTP Request Node to List Droplets**  
   - Name: `List All Droplets`  
   - Type: HTTP Request  
   - Parameters:  
     - URL: `https://api.digitalocean.com/v2/droplets`  
     - Request Method: GET (default)  
     - Authentication: Header Auth using DigitalOcean API Key  
   - Credentials: Create or use existing HTTP Header Auth credentials with your DigitalOcean API key  
   - Connect output from `Runs every 48hrs` to this node.

3. **Create HTTP Request Node to List Snapshots per Droplet**  
   - Name: `List Snapshots for a Droplet`  
   - Type: HTTP Request  
   - Parameters:  
     - URL: `https://api.digitalocean.com/v2/droplets/{{ $json.droplets[0].id }}/snapshots`  
     - Request Method: GET  
     - Authentication: Header Auth (same credentials as above)  
   - Connect output from `List All Droplets` to this node.

4. **Create Filter Node to Check Snapshot Count**  
   - Name: `Filter`  
   - Type: Filter  
   - Parameters:  
     - Condition: Number operation → Check if `$json.meta.total >= 4`  
   - Connect output from `List Snapshots for a Droplet` to this node.

5. **Create HTTP Request Node to Delete Snapshot**  
   - Name: `Delete a Snapshot`  
   - Type: HTTP Request  
   - Parameters:  
     - URL: `https://api.digitalocean.com/v2/snapshots/{{ $json.snapshots[0].id }}`  
     - Request Method: DELETE  
     - Authentication: Header Auth (DigitalOcean API Key)  
   - Connect “true” output of `Filter` node to this node.

6. **Create HTTP Request Node to Create Snapshot**  
   - Name: `Droplet Actions snapshot (n8n.optimus01.co.za)`  
   - Type: HTTP Request  
   - Parameters:  
     - URL: `https://api.digitalocean.com/v2/droplets/{{ $('List All Droplets').item.json.droplets[0].id }}/actions`  
     - Request Method: POST  
     - Body Parameters: Add parameter with key `type` and value `snapshot`  
     - Authentication: Header Auth (DigitalOcean API Key)  
   - Connect output from `Delete a Snapshot` node to this node.

7. **Link connections as follows:**  
   - `Runs every 48hrs` → `List All Droplets` → `List Snapshots for a Droplet` → `Filter`  
   - `Filter` (true) → `Delete a Snapshot` → `Droplet Actions snapshot (n8n.optimus01.co.za)`  
   - Note: No action on `Filter` false path (droplets with fewer than 4 snapshots skip deletion and snapshot creation per this workflow).

8. **Configure Credentials:**  
   - Create HTTP Header Auth credential in n8n with your DigitalOcean API key.  
   - Assign this credential to all HTTP Request nodes requiring DigitalOcean API access.

9. **Optional:** Add Sticky Notes with content from this analysis for documentation clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                    | Context or Link                                            |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| This workflow automates DigitalOcean Droplet snapshot management by keeping snapshots under a defined limit, deleting old ones, and creating new snapshots.    | Workflow Purpose Summary                                   |
| Built for the [Let's Automate It Community](http://onlinethinking.io/community) by [Optimus Agency](https://optimus01.co.za/)                                  | Branding and Credits                                       |
| Setup instructions include configuring DigitalOcean API key credentials, snapshot limit adjustments, and execution frequency setup.                          | Setup Guidelines                                           |
| Customization tips include adjusting snapshot limits, changing run frequency, and adding notifications such as Slack or email alerts.                        | Customization Advice                                       |
| Video resource for more templates: [Let's Automate It Community](http://onlinethinking.io/community)                                                           | Community Resource Link                                    |

---

This comprehensive document enables understanding, reproduction, and customization of the “Automate Droplet Snapshots on DigitalOcean” workflow without reference to the original JSON. It anticipates common failure points such as API authentication errors, rate limits, or malformed expressions and provides clear guidance on node configuration and workflow logic.