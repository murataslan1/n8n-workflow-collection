Auto-Delete SPAM, Social, and Promotions Emails in Gmail

https://n8nworkflows.xyz/workflows/auto-delete-spam--social--and-promotions-emails-in-gmail-4358


# Auto-Delete SPAM, Social, and Promotions Emails in Gmail

### 1. Workflow Overview

This workflow automates the deletion of unwanted emails from a Gmail inbox by targeting three specific Gmail categories: SPAM, Social, and Promotions. It is designed to run on a scheduled basis every three days, fetching all emails labeled under these categories, merging their data, and deleting them individually. The workflow is ideal for users who want to keep their Gmail inbox clean automatically by removing clutter emails without manual intervention.

The workflow logic is grouped into the following blocks:

- **1.1 Scheduled Trigger**: Periodically initiates the workflow every three days.
- **1.2 Fetch Emails by Category**: Retrieves all emails labeled as SPAM, Social, and Promotions from Gmail using three separate nodes.
- **1.3 Merge and Split Email IDs**: Combines the fetched email lists from all categories and splits them to process each email individually.
- **1.4 Delete Emails**: Deletes each email by its message ID using Gmail’s delete operation.
- **1.5 Documentation and Setup Notes**: Sticky notes providing guidance on configuration and usage.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger

- **Overview:**  
  This block automatically triggers the workflow every three days to ensure periodic cleaning of unwanted emails.

- **Nodes Involved:**  
  - Run Every 3 Days (Trigger)  

- **Node Details:**  
  - **Run Every 3 Days (Trigger)**  
    - Type: Schedule Trigger  
    - Configuration: Set to trigger every 3 days using the `daysInterval` parameter.  
    - Input: None (trigger node)  
    - Output: Starts the workflow, connected to three Gmail fetch nodes.  
    - Edge Cases: Misconfiguration may cause missed triggers; time zone considerations may affect exact run time.  

#### 2.2 Fetch Emails by Category

- **Overview:**  
  This block fetches all emails labeled under SPAM, Social, and Promotions categories separately using Gmail API nodes.

- **Nodes Involved:**  
  - Fetch SPAM Emails  
  - Fetch Social Emails  
  - Fetch Promotion Emails  

- **Node Details:**  
  - **Fetch SPAM Emails**  
    - Type: Gmail Node (Get All)  
    - Configuration: Retrieves all emails with label `SPAM`. `returnAll` is true to fetch all available emails.  
    - Credentials: Uses Gmail OAuth2 credentials named "Gmail account".  
    - Input: Trigger from schedule node  
    - Output: Outputs a list of emails labeled SPAM.  
    - Edge Cases: API quota limits, auth expiration, or label changes in Gmail may affect results.  

  - **Fetch Social Emails**  
    - Type: Gmail Node (Get All)  
    - Configuration: Retrieves all emails with label `CATEGORY_SOCIAL`.  
    - Credentials: Same as above.  
    - Input: Trigger from schedule node  
    - Output: Outputs Social category emails list.  
    - Edge Cases: Same as above.  

  - **Fetch Promotion Emails**  
    - Type: Gmail Node (Get All)  
    - Configuration: Retrieves all emails with label `CATEGORY_PROMOTIONS`.  
    - Credentials: Same as above.  
    - Input: Trigger from schedule node  
    - Output: Outputs Promotions emails list.  
    - Edge Cases: Same as above.  

#### 2.3 Merge and Split Email IDs

- **Overview:**  
  Combines the three separate lists of emails into a single collection and then splits it so each email can be processed individually.

- **Nodes Involved:**  
  - Combine All Fetched Emails  
  - Split Email IDs (One per item)  

- **Node Details:**  
  - **Combine All Fetched Emails**  
    - Type: Merge  
    - Configuration: Merges 3 inputs (SPAM, Social, Promotions) into one output array. The default merge mode is used (likely append).  
    - Input: Three Gmail fetch nodes  
    - Output: Combined list of all fetched emails.  
    - Edge Cases: If one input is empty, it still merges others; if all empty, output is empty array.  

  - **Split Email IDs (One per item)**  
    - Type: Split Out  
    - Configuration: Splits the combined list by the field `id`, so that each email ID is output as a separate item.  
    - Input: Combined email list  
    - Output: Individual email items with only one `id` per item.  
    - Edge Cases: If combined list is empty, no outputs are produced.  

#### 2.4 Delete Emails

- **Overview:**  
  Deletes each email individually in Gmail based on the message ID.

- **Nodes Involved:**  
  - Delete All Mails  

- **Node Details:**  
  - **Delete All Mails**  
    - Type: Gmail Node (Delete)  
    - Configuration: Deletes email by message ID using the expression `={{ $json.id }}` to target each email ID from the split node.  
    - Credentials: Same Gmail OAuth2 credentials as above.  
    - Input: Individual email ID items from Split node  
    - Output: Confirmation of deletion or error if any.  
    - Edge Cases: Attempting to delete already deleted emails may cause errors; auth token expiration; API quota exceeded; network issues.  

#### 2.5 Documentation and Setup Notes

- **Overview:**  
  Sticky notes provide guidance on Gmail OAuth2 credential setup, label configuration for targeted categories, scheduling, and general usage.

- **Nodes Involved:**  
  - Adjustments (Sticky Note)  
  - Sticky Note (Scheduled Trigger)  
  - Sticky Note1 (Merge & Prepare IDs)  
  - Sticky Note2 (Delete Emails)  
  - Sticky Note3 (Credits and Support)  

- **Node Details:**  
  - These nodes are purely informational and do not affect workflow execution.  
  - Contain instructions for users to customize label filters and scheduling intervals.  
  - Provide links for support and feedback.  

---

### 3. Summary Table

| Node Name                  | Node Type           | Functional Role                      | Input Node(s)                  | Output Node(s)             | Sticky Note                                                                                          |
|----------------------------|---------------------|------------------------------------|-------------------------------|----------------------------|----------------------------------------------------------------------------------------------------|
| Run Every 3 Days (Trigger) | Schedule Trigger    | Initiates workflow every 3 days    | None                          | Fetch SPAM, Social, Promotion Emails | ## ⏰ Scheduled Trigger: Runs every 3 days; interval adjustable.                                  |
| Fetch SPAM Emails           | Gmail Node          | Fetch emails labeled SPAM           | Run Every 3 Days (Trigger)     | Combine All Fetched Emails  | ## 📧 Gmail Setup: Adjust labels; check Gmail OAuth2 credentials.                                  |
| Fetch Social Emails         | Gmail Node          | Fetch emails labeled Social         | Run Every 3 Days (Trigger)     | Combine All Fetched Emails  | ## 📧 Gmail Setup: Adjust labels; check Gmail OAuth2 credentials.                                  |
| Fetch Promotion Emails      | Gmail Node          | Fetch emails labeled Promotions     | Run Every 3 Days (Trigger)     | Combine All Fetched Emails  | ## 📧 Gmail Setup: Adjust labels; check Gmail OAuth2 credentials.                                  |
| Combine All Fetched Emails  | Merge               | Combine all fetched emails          | Fetch SPAM, Social, Promotion Emails | Split Email IDs (One per item) | ## 🔀 Merge & Prepare IDs: Combines all categories; prepares for individual processing.           |
| Split Email IDs (One per item) | Split Out        | Split combined list into single email IDs | Combine All Fetched Emails     | Delete All Mails           | ## 🔀 Merge & Prepare IDs: Splits email list for individual deletion.                              |
| Delete All Mails            | Gmail Node          | Delete emails by message ID         | Split Email IDs (One per item) | None                       | ## 🗑️ Delete Emails: Deletes emails by ID; verify labels to avoid data loss.                      |
| Adjustments                 | Sticky Note         | Configuration guidelines            | None                          | None                       | ## 📧 Gmail Setup: Credential and label adjustment instructions.                                  |
| Sticky Note                 | Sticky Note         | Scheduled trigger notes             | None                          | None                       | ## ⏰ Scheduled Trigger: Workflow interval details.                                               |
| Sticky Note1                | Sticky Note         | Merge and split explanation         | None                          | None                       | ## 🔀 Merge & Prepare IDs: Workflow merging logic explained.                                      |
| Sticky Note2                | Sticky Note         | Delete emails explanation           | None                          | None                       | ## 🗑️ Delete Emails: Caution on deletion process.                                                |
| Sticky Note3                | Sticky Note         | Credits and support                 | None                          | None                       | ## ☕ Free tool, feedback and support links: https://khmuhtadin.com, https://buymeacoffee.com/khmuhtadin |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set the trigger interval to every 3 days (`daysInterval: 3`).  
   - Position appropriately.

2. **Create three Gmail nodes to fetch emails by category:**  
   - For each node, set operation to `getAll`, and set `returnAll` to true.  
   - Node 1 (Fetch SPAM Emails): Set filter label to `SPAM`.  
   - Node 2 (Fetch Social Emails): Set filter label to `CATEGORY_SOCIAL`.  
   - Node 3 (Fetch Promotion Emails): Set filter label to `CATEGORY_PROMOTIONS`.  
   - Assign Gmail OAuth2 credentials for all three nodes.  
   - Connect the Schedule Trigger output to each of these three Gmail nodes.

3. **Create a Merge node:**  
   - Type: Merge  
   - Set Inputs to 3 (to accept all three Gmail nodes).  
   - Connect the outputs of the three Gmail fetch nodes to the three inputs of the Merge node.

4. **Create a Split Out node:**  
   - Type: Split Out  
   - Configure to split on the field `id`.  
   - Connect the Merge node output to this Split Out node.

5. **Create a Gmail Delete node:**  
   - Type: Gmail  
   - Set operation to `delete`.  
   - Set the messageId parameter to the expression `={{ $json.id }}` to delete each email individually.  
   - Assign the same Gmail OAuth2 credentials.  
   - Connect the Split Out node output to this Gmail Delete node.

6. **Add Sticky Notes for documentation (optional):**  
   - Add notes for Gmail OAuth2 setup, scheduling details, merge/split explanation, and deletion caution.  
   - Include any support or credit links as desired.

7. **Activate and test the workflow:**  
   - Ensure credentials are valid and connected.  
   - Run the workflow manually or wait for schedule trigger to confirm emails in the specified categories are deleted as intended.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                | Context or Link                                     |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------|
| To customize categories to delete, adjust label filters in Gmail fetch nodes: `SPAM`, `CATEGORY_SOCIAL`, `CATEGORY_PROMOTIONS`.                             | Gmail labels                                        |
| Workflow runs every 3 days by default; adjust Schedule Trigger node to change interval.                                                                      | Schedule Trigger node                               |
| Ensure Gmail OAuth2 credentials are valid and authorized to read and delete emails.                                                                           | Gmail OAuth2 credentials                            |
| Workflow is free to use; feedback and support available at https://khmuhtadin.com and https://buymeacoffee.com/khmuhtadin                                  | Support and credits                                 |
| Care should be taken to avoid deleting important emails by verifying label configurations prior to running the workflow.                                    | User caution                                        |

---

**Disclaimer:** The text provided is entirely generated from an automated n8n workflow. It adheres strictly to content policies and contains no illegal, offensive, or protected elements. All data processed is legal and publicly accessible.