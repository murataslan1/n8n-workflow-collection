Automate Sports Betting Data with the Odds API

https://n8nworkflows.xyz/workflows/automate-sports-betting-data-with-the-odds-api-2843


# Automate Sports Betting Data with the Odds API

### 1. Workflow Overview

This workflow automates the retrieval and updating of sports betting data, specifically for Ice Hockey (NHL), using TheOddsAPI and Airtable. It is designed to run twice daily: once in the morning to pull upcoming game data and create records in Airtable, and once in the evening to fetch final game results and update existing Airtable records accordingly. The workflow is modular and can be adapted for other sports by adjusting API parameters.

Logical blocks:

- **1.1 Scheduled Triggers:** Two schedule triggers initiate the workflow at 7:00 AM and 11:00 PM daily.
- **1.2 Morning Data Retrieval:** HTTP request to TheOddsAPI to fetch upcoming Ice Hockey events, followed by creating new records in Airtable.
- **1.3 Evening Data Retrieval and Update:** HTTP request to TheOddsAPI to fetch game results, merging this data with existing records, and updating Airtable accordingly.
- **1.4 Data Merging:** A merge node combines morning and evening data by matching game IDs to ensure accurate updates.

---

### 2. Block-by-Block Analysis

#### 2.1 Scheduled Triggers

**Overview:**  
This block contains two schedule triggers that start the workflow at specific times: morning (7:00 AM) and evening (11:00 PM). These triggers automate the timing of data retrieval and updates.

**Nodes Involved:**  
- Morning Trigger To Pull Data At 7:00am  
- Evening Trigger To Pull Data At 11:00pm  
- Sticky Note (explaining trigger purpose)

**Node Details:**

- **Morning Trigger To Pull Data At 7:00am**  
  - Type: Schedule Trigger  
  - Configuration: Set to trigger daily at 7:00 AM  
  - Inputs: None (trigger node)  
  - Outputs: Connects to "Retrieve Data Of Upcoming Sport Events For The Day"  
  - Edge Cases: Timezone misconfiguration could cause unexpected trigger times.

- **Evening Trigger To Pull Data At 11:00pm**  
  - Type: Schedule Trigger  
  - Configuration: Set to trigger daily at 11:00 PM  
  - Inputs: None (trigger node)  
  - Outputs: Connects to "Retrieve Sport Results Data At The End Of The Day"  
  - Edge Cases: Same as above regarding timezone.

- **Sticky Note**  
  - Content: Explains that these triggers start the workflow at the start and end of the day and that times can be adjusted.

---

#### 2.2 Morning Data Retrieval and Record Creation

**Overview:**  
Triggered by the morning schedule, this block fetches upcoming Ice Hockey games from TheOddsAPI and creates corresponding records in Airtable.

**Nodes Involved:**  
- Retrieve Data Of Upcoming Sport Events For The Day  
- Create Records Of Upcoming Events For The Day  
- Sticky Note1 (explaining HTTP request and Airtable creation)

**Node Details:**

- **Retrieve Data Of Upcoming Sport Events For The Day**  
  - Type: HTTP Request  
  - Role: Fetch upcoming Ice Hockey NHL events from TheOddsAPI  
  - Configuration:  
    - URL: `https://api.the-odds-api.com/v4/sports/icehockey_nhl/events?apiKey=YOUR_API_KEY` (API key replaced with placeholder)  
    - Authentication: HTTP Header Auth using stored credentials  
    - Headers: Configured via credential, no additional headers specified  
  - Inputs: Trigger from morning schedule  
  - Outputs: JSON array of upcoming events  
  - Edge Cases:  
    - API key invalid or expired → authentication errors  
    - API rate limits exceeded → HTTP 429 errors  
    - Network timeouts or downtime  
    - Unexpected API response format changes

- **Create Records Of Upcoming Events For The Day**  
  - Type: Airtable  
  - Role: Create new records in Airtable for each upcoming event  
  - Configuration:  
    - Base: Airtable base identified by ID  
    - Table: Specific table for sports events  
    - Operation: Create  
    - Columns mapped:  
      - id ← $json.id (game ID)  
      - away_team ← $json.away_team  
      - home_team ← $json.home_team  
      - sports_key ← $json.sport_key  
      - sport_title ← $json.sport_title  
      - commence_time ← $json.commence_time  
    - Matching columns: None (creating new records)  
  - Inputs: Data from HTTP request node  
  - Outputs: Created Airtable records  
  - Edge Cases:  
    - Airtable API rate limits or quota exceeded  
    - Data type mismatches or missing fields  
    - Network errors  
    - Duplicate record creation if not properly managed

- **Sticky Note1**  
  - Content: Explains the HTTP request pulls upcoming data for Ice Hockey and references TheOddsAPI documentation links for events and odds. Also notes that records are created in Airtable.

---

#### 2.3 Evening Data Retrieval, Merge, and Update

**Overview:**  
Triggered by the evening schedule, this block fetches final game results from TheOddsAPI, merges them with existing upcoming event records by game ID, and updates Airtable records with scores and completion status.

**Nodes Involved:**  
- Retrieve Sport Results Data At The End Of The Day  
- Combine Sport Results With Upcoming Events Records By Matching ID  
- Update Table Records With Scores And Results For Sport Events  
- Sticky Note2 (explaining end-of-day update process)

**Node Details:**

- **Retrieve Sport Results Data At The End Of The Day**  
  - Type: HTTP Request  
  - Role: Fetch scores for Ice Hockey NHL games from TheOddsAPI for the previous day  
  - Configuration:  
    - URL: `https://api.the-odds-api.com/v4/sports/icehockey_nhl/scores?daysFrom=1&apiKey=YOUR_API_KEY`  
    - Authentication: HTTP Header Auth with stored credentials  
  - Inputs: Trigger from evening schedule  
  - Outputs: JSON array of game results  
  - Edge Cases:  
    - Same as morning HTTP request node (auth, rate limits, network)  
    - Data availability delay (scores not yet posted)  

- **Combine Sport Results With Upcoming Events Records By Matching ID**  
  - Type: Merge  
  - Role: Combine incoming scores data with existing upcoming events data by matching on the `id` field  
  - Configuration:  
    - Mode: Combine  
    - Fields to match: `id`  
  - Inputs:  
    - Left input: Data from morning HTTP request (upcoming events)  
    - Right input: Data from evening HTTP request (scores)  
  - Outputs: Combined data set with merged fields  
  - Edge Cases:  
    - Missing matching IDs → incomplete merges  
    - Data format inconsistencies causing merge failures  

- **Update Table Records With Scores And Results For Sport Events**  
  - Type: Airtable  
  - Role: Update existing Airtable records with scores, completion status, and last update timestamp  
  - Configuration:  
    - Base and Table: Same as morning Airtable node  
    - Operation: Update  
    - Matching column: `id` (game ID)  
    - Columns updated:  
      - scores ← $json.scores  
      - completed ← $json.completed  
      - last_update ← $json.last_update  
  - Inputs: Merged data from Merge node  
  - Outputs: Updated Airtable records  
  - Edge Cases:  
    - Airtable API limits or errors  
    - Missing records for update (if IDs do not match)  
    - Data type mismatches  
    - Partial updates if data incomplete

- **Sticky Note2**  
  - Content: Describes the end-of-day schedule trigger, HTTP request for scores, data merging by ID, and Airtable update. Notes flexibility to adjust for other sports or to include odds and sportsbook data.

---

### 3. Summary Table

| Node Name                                         | Node Type           | Functional Role                                   | Input Node(s)                                | Output Node(s)                                  | Sticky Note                                                                                                         |
|--------------------------------------------------|---------------------|-------------------------------------------------|----------------------------------------------|------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| Morning Trigger To Pull Data At 7:00am            | Schedule Trigger    | Starts morning data retrieval at 7:00 AM        | None                                         | Retrieve Data Of Upcoming Sport Events For The Day | The following triggers start the workflow at the Start of the day and the End of the day. Times can be adjusted to user's preference. |
| Evening Trigger To Pull Data At 11:00pm            | Schedule Trigger    | Starts evening data retrieval at 11:00 PM       | None                                         | Retrieve Sport Results Data At The End Of The Day | See above                                                                                                           |
| Retrieve Data Of Upcoming Sport Events For The Day | HTTP Request       | Fetch upcoming Ice Hockey events from TheOddsAPI | Morning Trigger To Pull Data At 7:00am       | Combine Sport Results With Upcoming Events Records By Matching ID, Create Records Of Upcoming Events For The Day | Once activated, HTTP Requests pulls the upcoming data for the sport of the user's choosing. The following is set for Ice Hockey. More documentation can be found within the link below: https://the-odds-api.com/liveapi/guides/v4/#get-events If you would like to add more data such as the sport books or odds, you can find documentation within the documentation below: https://the-odds-api.com/liveapi/guides/v4/#get-odds Once the data is pulled, the records are created within the Airtable. |
| Create Records Of Upcoming Events For The Day      | Airtable            | Create new records in Airtable for upcoming events | Retrieve Data Of Upcoming Sport Events For The Day | None                                           | See above                                                                                                           |
| Retrieve Sport Results Data At The End Of The Day  | HTTP Request       | Fetch final game scores from TheOddsAPI          | Evening Trigger To Pull Data At 11:00pm      | Combine Sport Results With Upcoming Events Records By Matching ID | At the end of the day, the Schedule Trigger will activate a HTTP request for the scores of the events. This is set for Ice Hockey but can be adjusted for the user's preference. After the data is pulled, it will merge the data with upcoming events to combine the results matching the id. The Airtable is then updated with the result records. This can be adjusted to pull in sports odds or the different sports book data. |
| Combine Sport Results With Upcoming Events Records By Matching ID | Merge               | Merge morning and evening data by game ID        | Retrieve Data Of Upcoming Sport Events For The Day, Retrieve Sport Results Data At The End Of The Day | Update Table Records With Scores And Results For Sport Events | See above                                                                                                           |
| Update Table Records With Scores And Results For Sport Events | Airtable            | Update existing Airtable records with scores and completion status | Combine Sport Results With Upcoming Events Records By Matching ID | None                                           | See above                                                                                                           |
| Sticky Note                                        | Sticky Note         | Explains schedule triggers                        | None                                         | None                                           | The following triggers start the workflow at the Start of the day and the End of the day. Times can be adjusted to user's preference. |
| Sticky Note1                                       | Sticky Note         | Explains morning HTTP request and Airtable creation | None                                         | None                                           | Once activated, HTTP Requests pulls the upcoming data for the sport of the user's choosing. The following is set for Ice Hockey. More documentation can be found within the link below: https://the-odds-api.com/liveapi/guides/v4/#get-events If you would like to add more data such as the sport books or odds, you can find documentation within the documentation below: https://the-odds-api.com/liveapi/guides/v4/#get-odds Once the data is pulled, the records are created within the Airtable. |
| Sticky Note2                                       | Sticky Note         | Explains evening HTTP request, merging, and Airtable update | None                                         | None                                           | At the end of the day, the Schedule Trigger will activate a HTTP request for the scores of the events. This is set for Ice Hockey but can be adjusted for the user's preference. After the data is pulled, it will merge the data with upcoming events to combine the results matching the id. The Airtable is then updated with the result records. This can be adjusted to pull in sports odds or the different sports book data. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node (Morning Trigger To Pull Data At 7:00am):**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 7:00 AM (adjust timezone as needed)  
   - No credentials required

2. **Create HTTP Request Node (Retrieve Data Of Upcoming Sport Events For The Day):**  
   - Type: HTTP Request  
   - URL: `https://api.the-odds-api.com/v4/sports/icehockey_nhl/events?apiKey=YOUR_API_KEY` (replace `YOUR_API_KEY` with your actual TheOddsAPI key)  
   - Authentication: HTTP Header Auth  
   - Configure HTTP Header Auth credentials with your TheOddsAPI key as a header (e.g., `apiKey`)  
   - Connect input from Morning Trigger node

3. **Create Airtable Node (Create Records Of Upcoming Events For The Day):**  
   - Type: Airtable  
   - Operation: Create  
   - Base: Select your Airtable base (e.g., by ID or name)  
   - Table: Select your table for sports events  
   - Map columns:  
     - id ← `$json.id`  
     - away_team ← `$json.away_team`  
     - home_team ← `$json.home_team`  
     - sports_key ← `$json.sport_key`  
     - sport_title ← `$json.sport_title`  
     - commence_time ← `$json.commence_time`  
   - Connect input from HTTP Request node

4. **Create Schedule Trigger Node (Evening Trigger To Pull Data At 11:00pm):**  
   - Type: Schedule Trigger  
   - Set to trigger daily at 11:00 PM (adjust timezone as needed)  
   - No credentials required

5. **Create HTTP Request Node (Retrieve Sport Results Data At The End Of The Day):**  
   - Type: HTTP Request  
   - URL: `https://api.the-odds-api.com/v4/sports/icehockey_nhl/scores?daysFrom=1&apiKey=YOUR_API_KEY` (replace `YOUR_API_KEY`)  
   - Authentication: HTTP Header Auth (same credentials as morning HTTP request)  
   - Connect input from Evening Trigger node

6. **Create Merge Node (Combine Sport Results With Upcoming Events Records By Matching ID):**  
   - Type: Merge  
   - Mode: Combine  
   - Fields to match: `id`  
   - Connect left input from "Retrieve Data Of Upcoming Sport Events For The Day" HTTP Request node  
   - Connect right input from "Retrieve Sport Results Data At The End Of The Day" HTTP Request node

7. **Create Airtable Node (Update Table Records With Scores And Results For Sport Events):**  
   - Type: Airtable  
   - Operation: Update  
   - Base and Table: Same as the create records node  
   - Matching column: `id`  
   - Map columns to update:  
     - scores ← `$json.scores`  
     - completed ← `$json.completed`  
     - last_update ← `$json.last_update`  
   - Connect input from Merge node

8. **Verify Credentials:**  
   - TheOddsAPI HTTP Header Auth: Store your API key securely in n8n credentials  
   - Airtable Personal Access Token: Create and store in n8n credentials with appropriate permissions for your base and table

9. **Add Sticky Notes (Optional):**  
   - Add notes near triggers explaining their schedule and purpose  
   - Add notes near HTTP request nodes with links to TheOddsAPI documentation:  
     - Events API: https://the-odds-api.com/liveapi/guides/v4/#get-events  
     - Odds API: https://the-odds-api.com/liveapi/guides/v4/#get-odds  
   - Add note near evening update explaining data merging and update logic

10. **Test Workflow:**  
    - Activate workflow  
    - Monitor execution logs for errors such as authentication failures, API rate limits, or Airtable update issues  
    - Adjust API parameters to change sports or data fields as needed

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                                                                                      |
|------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| TheOddsAPI documentation for events and odds API endpoints provides detailed info on parameters and response structure.           | https://the-odds-api.com/liveapi/guides/v4/#get-events and https://the-odds-api.com/liveapi/guides/v4/#get-odds |
| Airtable API documentation is essential for understanding field mapping, rate limits, and authentication.                         | https://airtable.com/api                                                                             |
| Adjust schedule trigger times according to your timezone and data availability needs.                                              | n8n Schedule Trigger node documentation                                                             |
| Ensure API keys have sufficient permissions and monitor rate limits to avoid workflow failures.                                    | TheOddsAPI and Airtable account settings                                                           |
| This workflow can be extended to include sportsbook odds, multiple sports, or additional data fields by modifying HTTP request URLs and Airtable schema. |                                                                                                    |

---

This completes the detailed reference documentation for the "Automate Sports Betting Data with the Odds API" workflow.