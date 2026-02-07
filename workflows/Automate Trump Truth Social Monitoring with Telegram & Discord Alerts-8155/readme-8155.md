Automate Trump Truth Social Monitoring with Telegram & Discord Alerts

https://n8nworkflows.xyz/workflows/automate-trump-truth-social-monitoring-with-telegram---discord-alerts-8155


# Automate Trump Truth Social Monitoring with Telegram & Discord Alerts

### 1. Workflow Overview

This workflow automates monitoring of posts related to Donald Trump on the Truth Social platform and sends alerts via Telegram and Discord when new relevant posts are detected. It is designed to run on a schedule, fetch the latest posts, filter and limit them, check if they are already processed, and then notify subscribed channels accordingly. The workflow includes the following logical blocks:

- **1.1 Scheduled Trigger & Data Fetching:** Periodically activates the workflow and retrieves new posts from Truth Social.
- **1.2 Data Processing & Filtering:** Splits fetched posts into individual items and limits the number of posts processed per run.
- **1.3 Duplicate Check & Conditional Alerting:** Checks whether posts have been previously stored to avoid duplicate alerts and conditionally triggers notifications.
- **1.4 Notification Dispatch:** Sends alerts to Telegram and Discord channels.
- **1.5 Data Persistence:** Stores identifiers of processed posts to prevent re-alerting in future runs.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Trigger & Data Fetching

- **Overview:**  
  This block triggers the workflow on a schedule and fetches the latest posts from Truth Social via an HTTP request.

- **Nodes Involved:**  
  - Schedule Trigger1  
  - Get New Posts

- **Node Details:**  

  - **Schedule Trigger1**  
    - Type: Schedule Trigger  
    - Role: Initiates workflow execution periodically based on a schedule (default schedule parameters not explicitly set, likely runs every defined interval)  
    - Config: Uses default schedule settings to start the workflow  
    - Inputs: None (trigger node)  
    - Outputs: Triggers "Get New Posts" node  
    - Edge Cases: Workflow will not run if schedule misconfigured; ensure schedule is active  
   
  - **Get New Posts**  
    - Type: HTTP Request  
    - Role: Retrieves the latest posts from Truth Social API or a specified endpoint  
    - Config: Configured with the API endpoint URL, method (likely GET), and necessary headers/authentication if required (details omitted)  
    - Inputs: Triggered by Schedule Trigger1  
    - Outputs: Provides raw posts data to "Split Items" node  
    - Edge Cases: API failures, rate limits, connectivity issues, malformed responses

#### 2.2 Data Processing & Filtering

- **Overview:**  
  Processes the batch of posts by splitting them into individual items and limits the number of posts processed in one run to manage load.

- **Nodes Involved:**  
  - Split Items  
  - Limit1

- **Node Details:**  

  - **Split Items**  
    - Type: Code Node  
    - Role: Splits the array of posts into individual items for downstream processing  
    - Config: Contains JavaScript code to parse and split the incoming data array  
    - Inputs: Raw posts from "Get New Posts"  
    - Outputs: Individual post items to "Limit1"  
    - Edge Cases: Errors if input data is improperly formatted or empty array  

  - **Limit1**  
    - Type: Limit  
    - Role: Restricts the number of posts processed to avoid overwhelming the system or hitting API limits  
    - Config: Configured with a maximum number of items to pass downstream (default or custom, not explicitly specified)  
    - Inputs: Individual posts from "Split Items"  
    - Outputs: Limited subset of posts to "Get a row1"  
    - Edge Cases: If limit set too low, may miss posts; if too high, risk of rate limiting or performance issues

#### 2.3 Duplicate Check & Conditional Alerting

- **Overview:**  
  Checks each post against stored IDs to detect duplicates, enabling conditional forwarding for new posts only.

- **Nodes Involved:**  
  - Get a row1  
  - If1

- **Node Details:**  

  - **Get a row1**  
    - Type: Supabase  
    - Role: Queries the Supabase database to check if the current post ID has been stored previously  
    - Config: Uses Supabase credentials and queries the table holding post IDs  
    - Inputs: Limited posts from "Limit1"  
    - Outputs: Result to "If1" node  
    - Edge Cases: Database connection errors, query failures, missing credentials

  - **If1**  
    - Type: If (Conditional)  
    - Role: Determines whether the post is new (not found in Supabase) and routes accordingly  
    - Config: Checks the existence of the post ID in query result; if not found, passes to alert nodes  
    - Inputs: Query results from "Get a row1"  
    - Outputs: True branch leads to notification nodes; false branch ends the flow for that item  
    - Edge Cases: Expression evaluation errors, malformed input data

#### 2.4 Notification Dispatch

- **Overview:**  
  Sends alerts about new posts to both Telegram and Discord channels.

- **Nodes Involved:**  
  - Send Alert To Telegram2  
  - Send Alert To Discord2

- **Node Details:**  

  - **Send Alert To Telegram2**  
    - Type: Telegram  
    - Role: Sends a message alert to a configured Telegram chat or channel  
    - Config: Uses Telegram Bot credentials; message content built from post data (not shown explicitly)  
    - Inputs: True branch from "If1"  
    - Outputs: Passes to "Store ID for future updates" node  
    - Edge Cases: Invalid Telegram credentials, message rate limits, chat ID misconfiguration

  - **Send Alert To Discord2**  
    - Type: Discord  
    - Role: Sends a message alert to a Discord channel using a webhook  
    - Config: Configured with Discord webhook ID and message formatting  
    - Inputs: True branch from "If1" (parallel to Telegram)  
    - Outputs: No further downstream nodes (parallel output)  
    - Edge Cases: Invalid webhook, Discord rate limits, message formatting errors

#### 2.5 Data Persistence

- **Overview:**  
  Stores newly processed post IDs into Supabase to prevent duplicate alerts in future runs.

- **Nodes Involved:**  
  - Store ID for future updates

- **Node Details:**  

  - **Store ID for future updates**  
    - Type: Supabase  
    - Role: Inserts or updates the post ID record into the Supabase database  
    - Config: Uses Supabase credentials; configured to write the unique identifier of the processed post  
    - Inputs: Output from "Send Alert To Telegram2" (sequential after notification)  
    - Outputs: None (workflow end)  
    - Edge Cases: Database write failures, credential issues, data format errors

---

### 3. Summary Table

| Node Name                 | Node Type           | Functional Role                      | Input Node(s)           | Output Node(s)                  | Sticky Note                                   |
|---------------------------|---------------------|------------------------------------|-------------------------|--------------------------------|-----------------------------------------------|
| Schedule Trigger1          | Schedule Trigger    | Initiates workflow periodically     | None                    | Get New Posts                  |                                               |
| Get New Posts             | HTTP Request        | Fetches latest Truth Social posts   | Schedule Trigger1       | Split Items                   |                                               |
| Split Items               | Code                | Splits batch posts into individual  | Get New Posts           | Limit1                       |                                               |
| Limit1                    | Limit               | Limits number of posts processed    | Split Items             | Get a row1                   |                                               |
| Get a row1                | Supabase            | Checks for existing post in DB      | Limit1                  | If1                         |                                               |
| If1                       | If                  | Conditional routing based on DB check | Get a row1              | Send Alert To Telegram2; Send Alert To Discord2 |                                               |
| Send Alert To Telegram2   | Telegram            | Sends alert message to Telegram     | If1 (true branch)       | Store ID for future updates   |                                               |
| Send Alert To Discord2    | Discord             | Sends alert message to Discord      | If1 (true branch)       | None                        |                                               |
| Store ID for future updates | Supabase            | Stores processed post ID             | Send Alert To Telegram2 | None                        |                                               |
| Sticky Note1              | Sticky Note         | (empty)                            |                         |                                |                                               |
| Sticky Note6              | Sticky Note         | (empty)                            |                         |                                |                                               |
| Sticky Note7              | Sticky Note         | (empty)                            |                         |                                |                                               |
| Sticky Note8              | Sticky Note         | (empty)                            |                         |                                |                                               |
| Sticky Note9              | Sticky Note         | (empty)                            |                         |                                |                                               |
| Sticky Note10             | Sticky Note         | (empty)                            |                         |                                |                                               |
| Sticky Note16             | Sticky Note         | (empty)                            |                         |                                |                                               |

*Note: All sticky notes in this workflow have empty content.*

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Configure with the desired interval for polling (e.g., every 10 minutes).

2. **Add an HTTP Request node named "Get New Posts"**  
   - Connect from Schedule Trigger output.  
   - Set HTTP Method: GET.  
   - Specify the Truth Social API endpoint URL for fetching posts related to Donald Trump.  
   - Add any required headers or authentication tokens.

3. **Add a Code node named "Split Items"**  
   - Connect from "Get New Posts" output.  
   - Configure JavaScript code to parse the response JSON and split the array of posts into individual items. Example snippet:  
     ```javascript
     return items[0].json.posts.map(post => ({ json: post }));
     ```
   - Ensure error handling for empty or malformed data.

4. **Add a Limit node named "Limit1"**  
   - Connect from "Split Items" output.  
   - Configure the limit number (e.g., 5) to restrict how many posts are processed per run.

5. **Add a Supabase node named "Get a row1"**  
   - Connect from "Limit1" output.  
   - Configure to query the Supabase table where processed post IDs are stored.  
   - Use parameters to check if the current post ID exists.  
   - Set credentials for Supabase access.

6. **Add an If node named "If1"**  
   - Connect from "Get a row1" output.  
   - Configure condition to check if the query result is empty (i.e., post ID not found).  
   - True branch proceeds to notification nodes; false branch is left empty (terminates flow).

7. **Add a Telegram node named "Send Alert To Telegram2"**  
   - Connect from "If1" true output.  
   - Configure with Telegram Bot credentials and target chat ID.  
   - Compose message content dynamically using post details.

8. **Add a Discord node named "Send Alert To Discord2"**  
   - Connect from "If1" true output (parallel to Telegram node).  
   - Configure with Discord webhook URL.  
   - Compose message content dynamically using post details.

9. **Add a Supabase node named "Store ID for future updates"**  
   - Connect from "Send Alert To Telegram2" output (sequential).  
   - Configure to insert the current post ID into the Supabase table for processed posts.  
   - Use Supabase credentials.

10. **Verify all credentials are set correctly**  
    - Supabase: Access keys and URL.  
    - Telegram: Bot token and chat ID.  
    - Discord: Webhook URL.  

11. **Test the workflow end-to-end**  
    - Trigger manually or wait for scheduled run.  
    - Confirm posts are fetched, split, filtered, checked, and alerts sent only for new posts.  
    - Monitor logs for errors.

---

### 5. General Notes & Resources

| Note Content                                                                 | Context or Link                         |
|------------------------------------------------------------------------------|---------------------------------------|
| This workflow leverages Supabase as a simple backend database to track processed post IDs, ensuring alerts are not duplicated. | Supabase: https://supabase.com/       |
| Telegram bot setup requires bot creation and chat ID retrieval via BotFather and chat interaction. | Telegram Bot API docs                  |
| Discord alerts use webhooks; set up a webhook URL in your Discord server channel settings. | Discord Webhooks documentation        |
| Ensure API rate limits for Truth Social, Telegram, and Discord are respected to avoid throttling. | API documentation respective to each platform |
| No sticky notes content available in this workflow; add custom notes in n8n editor if needed. | n8n Sticky Notes feature               |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All handled data is lawful and public.