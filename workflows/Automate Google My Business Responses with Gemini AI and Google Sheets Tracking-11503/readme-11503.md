Automate Google My Business Responses with Gemini AI and Google Sheets Tracking

https://n8nworkflows.xyz/workflows/automate-google-my-business-responses-with-gemini-ai-and-google-sheets-tracking-11503


# Automate Google My Business Responses with Gemini AI and Google Sheets Tracking

### 1. Workflow Overview

This workflow automates the process of responding to Google My Business (GMB) reviews using Google Gemini AI for generating replies and tracks the interactions in Google Sheets. It is designed for businesses managing multiple locations, streamlining review monitoring, AI-generated response creation, posting replies directly to GMB, and maintaining an audit trail in spreadsheets.

The workflow consists of the following logical blocks:

- **1.1 Scheduled Trigger & Configuration Retrieval:** Periodic initiation every 30 minutes and fetching business configuration data from Google Sheets.
- **1.2 Location Routing & Review Retrieval:** Routing to specific business locations and retrieving recent reviews from Google My Business for each location.
- **1.3 Review Filtering & Conditional Processing:** Filtering out already replied reviews and branching the workflow based on the presence of unreplied reviews.
- **1.4 AI-Powered Reply Generation:** Preparing data and sending review content to Google Gemini AI models to generate replies.
- **1.5 Reply Posting & Logging:** Posting AI-generated replies back to Google My Business and logging the success in Google Sheets.
- **1.6 Batch Processing & Business Config Updates:** Handling reviews in batches for scalability and updating business configuration sheets accordingly.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Configuration Retrieval

- **Overview:**  
  This block initiates the workflow every 30 minutes and gathers business configuration details such as location identifiers and credentials from a Google Sheet.

- **Nodes Involved:**  
  - Every 30 Minutes (Schedule Trigger)  
  - Get Business Configs1 (Google Sheets)  
  - Route Locations (Switch)

- **Node Details:**

  - **Every 30 Minutes**  
    - Type: Schedule Trigger  
    - Role: Starts the workflow on a fixed 30-minute interval.  
    - Configuration: Default schedule with no additional parameters, firing every 30 minutes.  
    - Inputs: None  
    - Outputs: Triggers "Get Business Configs1"  
    - Edge Cases: Missed triggers due to downtime or resource limits.

  - **Get Business Configs1**  
    - Type: Google Sheets  
    - Role: Reads business configuration data including location IDs and parameters from a specified Google Sheet.  
    - Configuration: Reads from a configured sheet and range, assumes credentials with proper access.  
    - Inputs: Trigger from schedule.  
    - Outputs: Sends data to "Route Locations".  
    - Edge Cases: Invalid sheet permissions, empty or malformed data.

  - **Route Locations**  
    - Type: Switch  
    - Role: Routes the workflow execution based on business location identifiers or types to different review retrieval nodes (Digital Scalers vs Acuyu).  
    - Configuration: Multiple cases defined matching location types or IDs.  
    - Inputs: Business configs from Google Sheets.  
    - Outputs: To "Get Reviews (Digital Scalers)" or "Get Reviews (Acuyu)" accordingly.  
    - Edge Cases: Unexpected location types, missing routing cases.

---

#### 1.2 Location Routing & Review Retrieval

- **Overview:**  
  Retrieves recent Google My Business reviews for each location based on routing decisions.

- **Nodes Involved:**  
  - Get Reviews (Digital Scalers)  
  - Get Reviews (Acuyu)

- **Node Details:**

  - **Get Reviews (Digital Scalers)**  
    - Type: Google Business Profile  
    - Role: Fetches recent reviews for Digital Scalers locations.  
    - Configuration: Uses GMB API credentials, queries reviews filtered by time or status.  
    - Inputs: Routed business config data.  
    - Outputs: To "Filter Unreplied Reviews1".  
    - Edge Cases: API rate limits, authentication errors, no reviews returned.

  - **Get Reviews (Acuyu)**  
    - Type: Google Business Profile  
    - Role: Fetches recent reviews for Acuyu locations.  
    - Configuration: Similar to above but for different location set.  
    - Inputs: Routed business config data.  
    - Outputs: To "Filter Unreplied Reviews2".  
    - Edge Cases: Same as above.

---

#### 1.3 Review Filtering & Conditional Processing

- **Overview:**  
  Filters out reviews that have already been replied to and decides whether to continue processing or terminate due to no new reviews.

- **Nodes Involved:**  
  - Filter Unreplied Reviews1  
  - Has Unreplied Reviews?1 (If)  
  - No New Reviews1  
  - Filter Unreplied Reviews2  
  - Has Unreplied Reviews?2 (If)  
  - No New Reviews2

- **Node Details:**

  - **Filter Unreplied Reviews1 & Filter Unreplied Reviews2**  
    - Type: Code  
    - Role: Custom JavaScript logic to identify reviews without replies.  
    - Key Expressions: Conditional filtering comparing review reply status flags.  
    - Inputs: Reviews from respective Get Reviews nodes.  
    - Outputs: To corresponding If nodes.  
    - Edge Cases: Data structure changes causing filter errors.

  - **Has Unreplied Reviews?1 & Has Unreplied Reviews?2**  
    - Type: If  
    - Role: Checks if filtered list has any unreplied reviews.  
    - Configuration: Conditional on length or presence of filtered array.  
    - Inputs: Filtered reviews.  
    - Outputs: True branch to "Split Reviews" nodes, False branch to "No New Reviews" nodes.  
    - Edge Cases: Empty inputs, malformed data.

  - **No New Reviews1 & No New Reviews2**  
    - Type: Code  
    - Role: Handles the case where no new reviews are detected; likely logs or ends processing.  
    - Inputs: False branch from If nodes.  
    - Outputs: Ends or logs workflow.  
    - Edge Cases: None critical; safe termination.

---

#### 1.4 AI-Powered Reply Generation

- **Overview:**  
  Prepares data and sends individual reviews in batch to Google Gemini AI models to generate professional replies.

- **Nodes Involved:**  
  - Split Reviews1 & Split Reviews  
  - Log to Business Sheet & Log to Business Sheet1  
  - Prepare Data & Prepare Data1 (Set nodes)  
  - Message a model & Message a model2 (Google Gemini)  
  - Prepare Reply & Prepare Reply1 (Code)  
  - Loop Over Items & Loop Over Items1 (SplitInBatches)

- **Node Details:**

  - **Split Reviews1 & Split Reviews**  
    - Type: SplitOut  
    - Role: Breaks the array of unreplied reviews into individual items for processing.  
    - Inputs: True branch from Has Unreplied Reviews? nodes.  
    - Outputs: To logging nodes.  
    - Edge Cases: Large batch sizes may cause memory or timeout issues.

  - **Log to Business Sheet & Log to Business Sheet1**  
    - Type: Google Sheets  
    - Role: Logs raw review data into a tracking spreadsheet for auditing.  
    - Inputs: Individual review items.  
    - Outputs: To Prepare Data nodes.  
    - Edge Cases: Sheet quota limits, write permissions.

  - **Prepare Data & Prepare Data1**  
    - Type: Set  
    - Role: Formats and organizes review data into the structure expected by the AI model node.  
    - Key Expressions: Setting variables such as review text, author, rating, etc.  
    - Inputs: Logged review items.  
    - Outputs: To Message a model nodes.  
    - Edge Cases: Missing data fields causing incomplete prompts.

  - **Message a model & Message a model2**  
    - Type: Google Gemini (Langchain)  
    - Role: Sends review data to Google Gemini AI to generate reply text.  
    - Configuration: Uses Google Gemini credentials, prompts configured to generate polite, context-aware replies.  
    - Inputs: Prepared data sets.  
    - Outputs: To Prepare Reply nodes.  
    - Edge Cases: API rate limits, prompt errors, model downtime.

  - **Prepare Reply & Prepare Reply1**  
    - Type: Code  
    - Role: Processes AI-generated replies, formats them for posting to GMB.  
    - Inputs: AI response data.  
    - Outputs: To Loop Over Items nodes for batch posting.  
    - Edge Cases: Parsing errors, empty AI responses.

  - **Loop Over Items & Loop Over Items1**  
    - Type: SplitInBatches  
    - Role: Processes replies in batches to control API calls and rate limits.  
    - Inputs: Prepared replies.  
    - Outputs: To Update Business Config Sheet and Post Reply nodes.  
    - Edge Cases: Batch size too large causing timeouts.

---

#### 1.5 Reply Posting & Logging

- **Overview:**  
  Posts AI-generated replies back to Google My Business and logs the success status in Google Sheets.

- **Nodes Involved:**  
  - Update Business Config Sheet & Update Business Config Sheet1  
  - Post Reply (GMB) & Post Reply (GMB)1  
  - Log Success & Log Success1  
  - Update Sheet (Success) & Update Sheet (Success)1

- **Node Details:**

  - **Post Reply (GMB) & Post Reply (GMB)1**  
    - Type: Google Business Profile  
    - Role: Posts the AI-generated reply to the corresponding GMB review.  
    - Configuration: Uses GMB API credentials, targets review ID.  
    - Inputs: Batched prepared replies.  
    - Outputs: To Log Success nodes.  
    - Edge Cases: API failures, permissions, rate limits.

  - **Log Success & Log Success1**  
    - Type: Code  
    - Role: Prepares data confirming successful reply posting.  
    - Inputs: Post reply response.  
    - Outputs: To Update Sheet (Success) nodes.  
    - Edge Cases: Unexpected API response formats.

  - **Update Sheet (Success) & Update Sheet (Success)1**  
    - Type: Google Sheets  
    - Role: Updates Google Sheets tracking to mark reviews as replied successfully.  
    - Inputs: Log success data.  
    - Outputs: Back to Loop Over Items nodes for next batch.  
    - Edge Cases: Sheet write errors or concurrent access issues.

  - **Update Business Config Sheet & Update Business Config Sheet1**  
    - Type: Google Sheets  
    - Role: Updates configuration or metadata related to business locations or replies.  
    - Inputs: From Loop Over Items nodes.  
    - Outputs: Final step in batch processing.  
    - Edge Cases: Sync conflicts, data integrity.

---

#### 1.6 Batch Processing & Business Config Updates

- **Overview:**  
  Handles large volumes of reviews by processing them in batches and updating business configuration sheets to maintain state and track processing.

- **Nodes Involved:**  
  - Loop Over Items & Loop Over Items1 (SplitInBatches)  
  - Update Business Config Sheet & Update Business Config Sheet1

- **Node Details:**

  - **Loop Over Items & Loop Over Items1**  
    - Type: SplitInBatches  
    - Role: Controls batch size to avoid API throttling and manage workflow load.  
    - Configuration: Batch size parameter configured as per API limits and performance needs.  
    - Inputs: Prepared replies.  
    - Outputs: To posting and config update nodes.  
    - Edge Cases: Batch drops or partial failures require retry logic.

  - **Update Business Config Sheet & Update Business Config Sheet1**  
    - (As above in 1.5) Ensure business configurations reflect the latest state after batches are processed.

---

### 3. Summary Table

| Node Name                  | Node Type                   | Functional Role                              | Input Node(s)                   | Output Node(s)                     | Sticky Note                 |
|----------------------------|-----------------------------|----------------------------------------------|---------------------------------|-----------------------------------|-----------------------------|
| Every 30 Minutes           | Schedule Trigger            | Triggers workflow every 30 minutes           | None                            | Get Business Configs1              |                             |
| Get Business Configs1      | Google Sheets              | Reads business config data                    | Every 30 Minutes                | Route Locations                   |                             |
| Route Locations            | Switch                     | Routes to correct location review retrieval  | Get Business Configs1           | Get Reviews (Digital Scalers), Get Reviews (Acuyu) |                             |
| Get Reviews (Digital Scalers) | Google Business Profile | Retrieves reviews for Digital Scalers locations | Route Locations                 | Filter Unreplied Reviews1         |                             |
| Get Reviews (Acuyu)        | Google Business Profile    | Retrieves reviews for Acuyu locations         | Route Locations                 | Filter Unreplied Reviews2         |                             |
| Filter Unreplied Reviews1  | Code                       | Filters out reviews already replied to        | Get Reviews (Digital Scalers)   | Has Unreplied Reviews?1           |                             |
| Filter Unreplied Reviews2  | Code                       | Filters out reviews already replied to        | Get Reviews (Acuyu)             | Has Unreplied Reviews?2           |                             |
| Has Unreplied Reviews?1    | If                         | Checks if unreplied reviews exist             | Filter Unreplied Reviews1       | Split Reviews1, No New Reviews1   |                             |
| Has Unreplied Reviews?2    | If                         | Checks if unreplied reviews exist             | Filter Unreplied Reviews2       | Split Reviews, No New Reviews2    |                             |
| No New Reviews1            | Code                       | Handles no new reviews condition               | Has Unreplied Reviews?1 (False) | None                            |                             |
| No New Reviews2            | Code                       | Handles no new reviews condition               | Has Unreplied Reviews?2 (False) | None                            |                             |
| Split Reviews1             | SplitOut                   | Splits review array into individual items     | Has Unreplied Reviews?1 (True)  | Log to Business Sheet             |                             |
| Split Reviews              | SplitOut                   | Splits review array into individual items     | Has Unreplied Reviews?2 (True)  | Log to Business Sheet1            |                             |
| Log to Business Sheet      | Google Sheets              | Logs reviews for auditing                      | Split Reviews1                  | Prepare Data                     |                             |
| Log to Business Sheet1     | Google Sheets              | Logs reviews for auditing                      | Split Reviews                   | Prepare Data1                    |                             |
| Prepare Data               | Set                        | Prepares data for AI model                      | Log to Business Sheet           | Message a model                  |                             |
| Prepare Data1              | Set                        | Prepares data for AI model                      | Log to Business Sheet1          | Message a model2                 |                             |
| Message a model            | Google Gemini (Langchain)  | Sends review data to AI for reply generation  | Prepare Data                   | Prepare Reply                   |                             |
| Message a model2           | Google Gemini (Langchain)  | Sends review data to AI for reply generation  | Prepare Data1                  | Prepare Reply1                  |                             |
| Prepare Reply              | Code                       | Formats AI replies for posting                  | Message a model                | Loop Over Items                 |                             |
| Prepare Reply1             | Code                       | Formats AI replies for posting                  | Message a model2               | Loop Over Items1                |                             |
| Loop Over Items            | SplitInBatches             | Processes replies in batches                     | Prepare Reply                  | Update Business Config Sheet, Post Reply (GMB) |                             |
| Loop Over Items1           | SplitInBatches             | Processes replies in batches                     | Prepare Reply1                 | Update Business Config Sheet1, Post Reply (GMB)1 |                             |
| Post Reply (GMB)           | Google Business Profile    | Posts AI-generated reply to GMB review          | Loop Over Items                | Log Success                    |                             |
| Post Reply (GMB)1          | Google Business Profile    | Posts AI-generated reply to GMB review          | Loop Over Items1               | Log Success1                   |                             |
| Log Success                | Code                       | Prepares success data for logging                | Post Reply (GMB)               | Update Sheet (Success)          |                             |
| Log Success1               | Code                       | Prepares success data for logging                | Post Reply (GMB)1              | Update Sheet (Success)1         |                             |
| Update Sheet (Success)     | Google Sheets              | Marks reviews as replied in sheet                | Log Success                   | Loop Over Items                |                             |
| Update Sheet (Success)1    | Google Sheets              | Marks reviews as replied in sheet                | Log Success1                  | Loop Over Items1               |                             |
| Update Business Config Sheet | Google Sheets            | Updates business config metadata                  | Loop Over Items               | None                          |                             |
| Update Business Config Sheet1 | Google Sheets          | Updates business config metadata                  | Loop Over Items1              | None                          |                             |
| Sticky Note (multiple)     | Sticky Note                | Visual notes in workflow canvas                   | None                         | None                          | Empty content (no comments) |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger Node ("Every 30 Minutes")**  
   - Set to run every 30 minutes (default cron or interval).  
   - No credentials needed.

2. **Create Google Sheets Node ("Get Business Configs1")**  
   - Configure credentials for Google Sheets.  
   - Set operation to "Read Rows" from the business config spreadsheet and appropriate range or sheet.  
   - Connect input from "Every 30 Minutes".

3. **Create a Switch Node ("Route Locations")**  
   - Configure cases based on a field (e.g., Location Type or ID) from business configs.  
   - Branch 1 output to "Get Reviews (Digital Scalers)"  
   - Branch 2 output to "Get Reviews (Acuyu)"

4. **Create two Google Business Profile Nodes ("Get Reviews (Digital Scalers)" and "Get Reviews (Acuyu)")**  
   - Configure each with appropriate GMB credentials and location IDs.  
   - Set operation to "Get Reviews".  
   - Connect respective outputs from "Route Locations".

5. **Create two Code Nodes ("Filter Unreplied Reviews1" and "Filter Unreplied Reviews2")**  
   - Write JavaScript to filter reviews without replies.  
   - Input from respective Get Reviews nodes.  
   - Output to respective If nodes.

6. **Create two If Nodes ("Has Unreplied Reviews?1", "Has Unreplied Reviews?2")**  
   - Condition: Check if filtered reviews array length > 0.  
   - True branch to SplitOut nodes; False branch to Code nodes for no new reviews.

7. **Create two Code Nodes ("No New Reviews1" and "No New Reviews2")**  
   - Log or handle cases with no new reviews; may simply end workflow or send notification.

8. **Create two SplitOut Nodes ("Split Reviews1" and "Split Reviews")**  
   - Split arrays of unreplied reviews into individual review items.  
   - Connect True branches from respective If nodes.

9. **Create two Google Sheets Nodes ("Log to Business Sheet" and "Log to Business Sheet1")**  
   - Configure to append rows logging review details for auditing.  
   - Inputs from SplitOut nodes.

10. **Create two Set Nodes ("Prepare Data" and "Prepare Data1")**  
    - Map review fields (text, author, rating, etc.) into data structure for AI prompts.  
    - Input from Google Sheets logging nodes.

11. **Create two Google Gemini Nodes ("Message a model" and "Message a model2")**  
    - Configure with Google Gemini credentials.  
    - Set prompt template to generate review replies based on input data.  
    - Input from Prepare Data nodes.

12. **Create two Code Nodes ("Prepare Reply" and "Prepare Reply1")**  
    - Process AI replies, format for posting (e.g., sanitize text, add metadata).  
    - Input from Gemini nodes.

13. **Create two SplitInBatches Nodes ("Loop Over Items" and "Loop Over Items1")**  
    - Set batch size based on API limits (e.g., 5-10).  
    - Input from Prepare Reply nodes.

14. **Create four Nodes for posting and logging:**  
    - Google Business Profile Nodes ("Post Reply (GMB)" and "Post Reply (GMB)1")  
      - Post replies to GMB using review IDs.  
      - Input from respective Loop Over Items nodes.  
    - Code Nodes ("Log Success" and "Log Success1")  
      - Format success response data.  
      - Input from Post Reply nodes.  
    - Google Sheets Nodes ("Update Sheet (Success)" and "Update Sheet (Success)1")  
      - Update sheet rows marking reviews as replied.  
      - Input from Log Success nodes.  
    - Google Sheets Nodes ("Update Business Config Sheet" and "Update Business Config Sheet1")  
      - Update any business config metadata.  
      - Input from Loop Over Items nodes (parallel to Post Reply).

15. **Connect all nodes following the above order ensuring correct data flow and batch handling.**

16. **Configure all credentials carefully:**  
    - Google Sheets OAuth2 with read/write permissions.  
    - Google Business Profile API access with proper scopes.  
    - Google Gemini AI API credentials for Langchain integration.

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|----------------|
| The workflow is designed to scale across multiple business locations with different review sources (Digital Scalers, Acuyu). | Conceptual design note |
| Google Gemini API integration is used for generating context-aware replies based on review text. | AI integration detail |
| Review logging in Google Sheets enables audit trail and manual monitoring. | Operational best practice |
| Batch processing ensures API limits are respected, improving reliability. | Performance consideration |
| Ensure all API credentials are kept secure and refreshed regularly to prevent downtime. | Security best practice |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated n8n workflow. This process strictly complies with applicable content policies and contains no illegal, offensive, or protected material. All handled data is legal and public.