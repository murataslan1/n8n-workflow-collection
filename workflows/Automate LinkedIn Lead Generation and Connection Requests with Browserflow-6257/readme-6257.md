Automate LinkedIn Lead Generation and Connection Requests with Browserflow

https://n8nworkflows.xyz/workflows/automate-linkedin-lead-generation-and-connection-requests-with-browserflow-6257


# Automate LinkedIn Lead Generation and Connection Requests with Browserflow

### 1. Workflow Overview

This workflow automates the process of generating leads on LinkedIn by scraping profiles from a targeted search, checking the connection status of each profile, and sending connection invitations where appropriate. It is designed to streamline LinkedIn outreach campaigns, particularly for sales, marketing, or recruiting professionals targeting specific locations and job titles.

The workflow is composed of the following logical blocks:

- **1.1 Input Trigger and Search Scraping:** Initiates the workflow manually and scrapes LinkedIn profiles based on specified search criteria.
- **1.2 Data Preparation and Iteration:** Processes the scraped profiles, splitting them into individual items for sequential handling.
- **1.3 Connection Status Verification:** Checks if each person is already a connection or has a pending invitation.
- **1.4 Sending Connection Invitations:** Sends LinkedIn connection requests to eligible profiles.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Trigger and Search Scraping

- **Overview:**  
  This initial block starts the workflow manually and scrapes LinkedIn profiles using Browserflow based on specified search parameters such as job title and location.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’  
  - Scrape profiles from a linked in search

- **Node Details:**  

  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Technical Role: Entry point for manual execution to start the workflow.  
    - Configuration: No parameters; triggers workflow on user action.  
    - Connections: Outputs to “Scrape profiles from a linked in search.”  
    - Potential Failures: None typical, but workflow won’t proceed without manual trigger.  

  - **Scrape profiles from a linked in search**  
    - Type: Browserflow node  
    - Technical Role: Scrapes LinkedIn profiles based on search criteria.  
    - Configuration:  
      - Search Term: “Content Marketeer”  
      - City: Amsterdam  
      - Country: Netherlands  
      - Operation: scrapeProfilesFromSearch (custom Browserflow operation)  
    - Credentials: Requires valid Browserflow API credentials.  
    - Input: Trigger from Manual Trigger node.  
    - Output: Provides an array of profile data in a field named `data`.  
    - Potential Failures:  
      - Authentication errors with Browserflow API.  
      - LinkedIn UI changes causing scrape failures.  
      - Rate limiting or IP blocking by LinkedIn.  

---

#### 2.2 Data Preparation and Iteration

- **Overview:**  
  This block prepares the scraped profiles for sequential processing by splitting the batch data into individual items and iterating over them one by one.

- **Nodes Involved:**  
  - Split Out  
  - Loop Over Items

- **Node Details:**  

  - **Split Out**  
    - Type: Split Out  
    - Technical Role: Extracts individual profile objects from the scraped data array.  
    - Configuration: Splits based on the field `data` containing profiles array.  
    - Input: Receives batch data from “Scrape profiles from a linked in search.”  
    - Output: Outputs individual profile objects.  
    - Potential Failures: Expression failures if `data` field is missing or empty.  

  - **Loop Over Items**  
    - Type: Split In Batches  
    - Technical Role: Processes profiles one at a time to allow sequential handling.  
    - Configuration: Batch size is 1 to ensure one profile is handled per iteration.  
    - Input: Receives individual profiles from “Split Out.”  
    - Output: Iterates over each profile, sending one at a time to the next block.  
    - Potential Failures: Misconfiguration of batch size could lead to concurrency issues.  

---

#### 2.3 Connection Status Verification

- **Overview:**  
  For each profile, this block checks whether the user is already connected or has a pending connection request on LinkedIn to avoid duplicate invitations.

- **Nodes Involved:**  
  - Check if person is a connection  
  - Check Connection Status

- **Node Details:**  

  - **Check if person is a connection**  
    - Type: Browserflow node  
    - Technical Role: Uses Browserflow to query LinkedIn and determine connection status of the profile.  
    - Configuration: Default request options; uses profile information passed from previous step.  
    - Input: Profile data from “Loop Over Items.”  
    - Output: JSON including boolean flags such as `is_connection` and `is_pending`.  
    - Potential Failures:  
      - Browserflow or LinkedIn UI changes may cause failures.  
      - Network or API timeouts.  

  - **Check Connection Status**  
    - Type: If node  
    - Technical Role: Logical decision point that evaluates whether to send a connection invite.  
    - Configuration:  
      - Condition checks that both `is_connection` is false and `is_pending` is empty, i.e., profile is not connected and no pending invite exists.  
      - Logical AND combinator for these conditions.  
    - Input: Receives connection status from “Check if person is a connection.”  
    - Output:  
      - True branch: Continues without sending invite (currently no connected nodes on true branch).  
      - False branch: Proceeds to “Send Connection invite” node to send an invite.  
    - Potential Failures: Expression evaluation errors if fields missing or malformed.  

---

#### 2.4 Sending Connection Invitations

- **Overview:**  
  This block sends LinkedIn connection invites to profiles that are not connected and have no pending invitations.

- **Nodes Involved:**  
  - Send Connection invite

- **Node Details:**  

  - **Send Connection invite**  
    - Type: Browserflow node  
    - Technical Role: Automates sending a connection request on LinkedIn via Browserflow.  
    - Configuration: Default request options; uses profile data passed from “Check Connection Status.”  
    - Input: Receives profiles from “Check Connection Status” node’s false branch (profiles eligible for invite).  
    - Output: Returns control back to “Loop Over Items” to continue processing next profile.  
    - Potential Failures:  
      - LinkedIn UI changes, rate limits, or account restrictions could block invites.  
      - Browserflow API failures or network errors.  
    - Loop-back connection enables sequential processing of remaining profiles.  

---

### 3. Summary Table

| Node Name                     | Node Type                   | Functional Role                       | Input Node(s)                 | Output Node(s)                 | Sticky Note                                                                                      |
|-------------------------------|-----------------------------|------------------------------------|------------------------------|-------------------------------|-------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’  | Manual Trigger              | Workflow start trigger              | —                            | Scrape profiles from a linked in search |                                                                                                 |
| Scrape profiles from a linked in search | Browserflow                | Scrape LinkedIn profiles based on search | When clicking ‘Test workflow’ | Split Out                     | Requires Browserflow API credentials                                                            |
| Split Out                     | Split Out                   | Extract individual profiles from batch | Scrape profiles from a linked in search | Loop Over Items               |                                                                                                 |
| Loop Over Items               | Split In Batches            | Iterate profiles one by one         | Split Out                    | Check if person is a connection | Batch size = 1 for sequential processing                                                        |
| Check if person is a connection | Browserflow                | Verify LinkedIn connection status  | Loop Over Items (false branch) | Check Connection Status        |                                                                                                 |
| Check Connection Status       | If                          | Decide if invite should be sent    | Check if person is a connection | Send Connection invite (false branch), Loop Over Items (true branch) |                                                                                                 |
| Send Connection invite        | Browserflow                 | Send LinkedIn connection invitations | Check Connection Status (false branch) | Loop Over Items               | Loops back to process next profile; may fail due to LinkedIn UI changes or rate limits          |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node:**  
   - Name: `When clicking ‘Test workflow’`  
   - Purpose: Manual start of the workflow.

2. **Add a Browserflow node to scrape LinkedIn profiles:**  
   - Name: `Scrape profiles from a linked in search`  
   - Operation: `scrapeProfilesFromSearch` (custom Browserflow operation)  
   - Parameters:  
     - Search Term: `"Content Marketeer"`  
     - City: `"Amsterdam"`  
     - Country: `"Netherlands"`  
   - Credentials: Setup Browserflow API credentials linked to your account.  
   - Connect the Manual Trigger node’s output to this node’s input.

3. **Add a Split Out node:**  
   - Name: `Split Out`  
   - Purpose: Extract individual profiles from the field `data` returned by the previous node.  
   - Configure to split on the field `data`.  
   - Connect output of `Scrape profiles from a linked in search` to this node.

4. **Add a Split In Batches node:**  
   - Name: `Loop Over Items`  
   - Purpose: Process profiles one at a time.  
   - Set batch size to 1.  
   - Connect output of `Split Out` to this node.

5. **Add a Browserflow node to check connection status:**  
   - Name: `Check if person is a connection`  
   - Purpose: Query LinkedIn to determine if the profile is already connected or pending.  
   - Use default request options.  
   - Connect the false output branch of `Loop Over Items` (to process each item) to this node.

6. **Add an If node:**  
   - Name: `Check Connection Status`  
   - Purpose: Decide if a connection invite should be sent.  
   - Condition:  
     - Check `$json.is_connection` is `false`  
     - AND `$json.is_pending` is empty or false  
   - Connect output of `Check if person is a connection` to this node.

7. **Add a Browserflow node to send connection invites:**  
   - Name: `Send Connection invite`  
   - Purpose: Send a LinkedIn connection request to the profile.  
   - Use default request options.  
   - Connect the false branch of `Check Connection Status` to this node.

8. **Loop-back connection:**  
   - Connect the output of `Send Connection invite` back to the `Loop Over Items` node to continue processing next profile.

9. **Ensure all Browserflow nodes have valid Browserflow API credentials configured.**

10. **Save and activate the workflow.**

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                                     |
|----------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| Browserflow API credentials are required for all Browserflow nodes to function properly.    | https://browserflow.com/docs/api                                   |
| LinkedIn UI changes can disrupt scraping and automation; regular maintenance is recommended.| LinkedIn automation best practices and anti-bot guidelines        |
| Batch size set to 1 ensures sequential processing and avoids LinkedIn rate limits.           | n8n documentation on SplitInBatches node                           |

---

**Disclaimer:** The provided text is exclusively generated from an automated workflow created with n8n, an integration and automation tool. This process strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and publicly available.