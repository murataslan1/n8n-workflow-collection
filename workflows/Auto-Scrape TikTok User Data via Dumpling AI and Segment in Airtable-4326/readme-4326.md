Auto-Scrape TikTok User Data via Dumpling AI and Segment in Airtable

https://n8nworkflows.xyz/workflows/auto-scrape-tiktok-user-data-via-dumpling-ai-and-segment-in-airtable-4326


# Auto-Scrape TikTok User Data via Dumpling AI and Segment in Airtable

### 1. Workflow Overview

This workflow automates the process of scraping TikTok user profile data based on TikTok usernames stored in an Airtable base. It leverages Dumpling AI's scraping API to enrich each TikTok handle with detailed profile statistics. The workflow includes filtering logic to process only profiles with a follower count of 100,000 or more, updating Airtable records accordingly with either basic or full profile stats.

**Target Use Cases:**  
- Marketers, agencies, or brands aiming to identify and qualify TikTok influencers automatically.  
- Data enrichment of TikTok users stored in Airtable for outreach or analytics purposes.  
- Automating social media data collection and filtering based on follower thresholds.

**Logical Blocks:**

- **1.1 Input Reception:** Watches for new TikTok usernames added to Airtable and triggers the workflow.  
- **1.2 Data Enrichment via Dumpling AI:** Sends the TikTok handle to Dumpling AI’s API to obtain profile data.  
- **1.3 Filtering Logic:** Checks if the follower count exceeds or equals 100k to branch logic.  
- **1.4 Airtable Update:** Updates the original Airtable record with either basic or comprehensive TikTok stats based on the filter outcome.  
- **1.5 Documentation:** Includes a sticky note summarizing the workflow purpose and steps.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block monitors an Airtable base for new records containing TikTok usernames. When a new handle is detected, the workflow triggers with that input.

- **Nodes Involved:**  
  - Watch for New TikTok Handles in Airtable

- **Node Details:**  
  - **Watch for New TikTok Handles in Airtable**  
    - Type: Airtable Trigger  
    - Role: Listens for new records or updates in a specified Airtable table based on the field "Tik tok username".  
    - Configuration:  
      - Polls every minute for changes.  
      - Uses Airtable Personal Access Token for authentication.  
      - Monitors a specific base and table (IDs are placeholders, to be configured).  
      - Triggers on changes in the "Tik tok username" field.  
    - Input: None (trigger node)  
    - Output: Emits new records containing TikTok usernames.  
    - Potential Failures:  
      - Authentication errors if the token is invalid or expired.  
      - Connectivity issues with Airtable API.  
      - Missing or empty TikTok username field in new records.  

#### 2.2 Data Enrichment via Dumpling AI

- **Overview:**  
  This block sends the TikTok handle from Airtable to Dumpling AI’s API to fetch detailed profile data including follower count, video count, hearts, and avatar.

- **Nodes Involved:**  
  - Get TikTok Profile Data via Dumpling AI

- **Node Details:**  
  - **Get TikTok Profile Data via Dumpling AI**  
    - Type: HTTP Request  
    - Role: Makes a POST request to Dumpling AI’s TikTok profile endpoint.  
    - Configuration:  
      - URL: https://app.dumplingai.com/api/v1/get-tiktok-profile  
      - Method: POST  
      - Body sent as JSON with the TikTok handle extracted dynamically from Airtable trigger data (`{{ $json.fields['Tik tok username'] }}`)  
      - Authentication: HTTP Header Auth using a generic credential named "n8n" (likely an API key).  
    - Input: TikTok username from Airtable trigger node.  
    - Output: JSON response containing profile stats and user metadata.  
    - Potential Failures:  
      - API key invalid or expired (authentication failure).  
      - Dumpling AI service downtime or rate limiting.  
      - Malformed response or unexpected JSON structure causing expression failures.  
      - Missing or incorrect TikTok handle leading to empty or error response.  

#### 2.3 Filtering Logic

- **Overview:**  
  This block decides the workflow path based on whether the TikTok profile’s follower count is at least 100,000.

- **Nodes Involved:**  
  - Check if Follower Count is 100k or More

- **Node Details:**  
  - **Check if Follower Count is 100k or More**  
    - Type: If  
    - Role: Conditional branching based on follower count.  
    - Configuration:  
      - Condition: Checks if the numeric value of `$json.stats.followerCount` is greater than or equal to 100,000.  
      - Case sensitive and strict type validation enabled.  
    - Input: Profile data from Dumpling AI response.  
    - Outputs:  
      - True branch: Profiles with followerCount ≥ 100,000.  
      - False branch: Profiles with followerCount < 100,000.  
    - Potential Failures:  
      - Missing or undefined followerCount in JSON causing expression errors.  
      - Non-numeric followerCount value.  

#### 2.4 Airtable Update

- **Overview:**  
  This block updates the original Airtable record with TikTok profile data. Profiles meeting the follower count threshold get full stats updated; others receive basic stats only.

- **Nodes Involved:**  
  - Update Record with Basic TikTok Stats  
  - Update Record with All TikTok Stats

- **Node Details:**  
  - **Update Record with Basic TikTok Stats**  
    - Type: Airtable  
    - Role: Updates existing Airtable record with core TikTok statistics (heartCount, videoCount, followerCount, followingCount).  
    - Configuration:  
      - Points to the same Airtable base and table as the trigger.  
      - Uses "id" from the original Airtable record to locate the right record for update.  
      - Maps fields from Dumpling AI response to Airtable columns.  
      - Does not update avatarLarger field.  
      - Authentication: Airtable Personal Access Token.  
    - Input: True branch from filter node (followerCount ≥ 100k).  
    - Output: Updated Airtable record confirmation.  
    - Potential Failures:  
      - Record not found or ID mismatch.  
      - Airtable API limits or downtime.  
      - Type mismatches in numeric fields.  

  - **Update Record with All TikTok Stats**  
    - Type: Airtable  
    - Role: Updates the Airtable record with full TikTok stats including avatar thumbnail.  
    - Configuration:  
      - Same base and table as above.  
      - Adds avatarLarger field update from Dumpling AI’s `user.avatarThumb` property.  
      - Other stats updated as in Basic Stats node.  
      - Authentication: Airtable Personal Access Token.  
    - Input: False branch from filter node (followerCount < 100k).  
    - Output: Updated Airtable record confirmation.  
    - Potential Failures: Same as above, plus possible issues if avatar data is missing or malformed.  

#### 2.5 Documentation (Sticky Note)

- **Overview:**  
  Provides a detailed summary and explanation of the workflow purpose and steps for users and maintainers.

- **Nodes Involved:**  
  - Sticky Note

- **Node Details:**  
  - **Sticky Note**  
    - Type: Sticky Note  
    - Role: Documentation embedded directly in the workflow canvas.  
    - Content summarizing the workflow steps, target audience, and usage scenario.  
    - No inputs or outputs.

---

### 3. Summary Table

| Node Name                              | Node Type            | Functional Role                          | Input Node(s)                           | Output Node(s)                              | Sticky Note                                                                                      |
|--------------------------------------|----------------------|----------------------------------------|---------------------------------------|---------------------------------------------|------------------------------------------------------------------------------------------------|
| Watch for New TikTok Handles in Airtable | Airtable Trigger     | Monitors Airtable for new TikTok usernames | None                                  | Get TikTok Profile Data via Dumpling AI     |                                                                                              |
| Get TikTok Profile Data via Dumpling AI   | HTTP Request         | Fetches TikTok profile data via API     | Watch for New TikTok Handles in Airtable | Check if Follower Count is 100k or More       |                                                                                              |
| Check if Follower Count is 100k or More     | If                   | Branches workflow based on follower count threshold | Get TikTok Profile Data via Dumpling AI | Update Record with Basic TikTok Stats (true branch), Update Record with All TikTok Stats (false branch) |                                                                                              |
| Update Record with Basic TikTok Stats         | Airtable             | Updates Airtable record with basic stats | Check if Follower Count is 100k or More (true) | None                                        |                                                                                              |
| Update Record with All TikTok Stats            | Airtable             | Updates Airtable record with full stats | Check if Follower Count is 100k or More (false) | None                                        |                                                                                              |
| Sticky Note                          | Sticky Note          | Provides detailed workflow summary     | None                                  | None                                        | ### 📊 TikTok Profile Scraper & Airtable Filter with Dumpling AI<br>This workflow takes a list of TikTok profile URLs from Airtable and enriches them using Dumpling AI’s scraping API. It checks each profile's follower count, and only those with more than a set threshold (e.g. 10,000) are saved into a second Airtable base for qualified influencers.<br><br>**How it works:**<br>1. **Start Manually:** You trigger the workflow manually to begin the scraping process.<br>2. **Get TikTok Links from Airtable:** It reads TikTok profile URLs from the source Airtable table.<br>3. **Scrape Each Profile with Dumpling AI:** Sends the URL to Dumpling AI’s web scraper API to fetch profile stats.<br>4. **Extract Follower Count:** Uses the Edit Fields node to isolate the follower count from the returned data.<br>5. **Filter Profiles:** The workflow only continues for profiles with more than 10,000 followers.<br>6. **Save to Airtable:** The qualified profiles are stored in a second Airtable table for follow-up or outreach.<br><br>This is perfect for brands, agencies, or marketers who want to automatically qualify TikTok creators before reaching out. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Airtable Trigger Node**  
   - Node Type: Airtable Trigger  
   - Name: "Watch for New TikTok Handles in Airtable"  
   - Configure Airtable credentials with a valid Personal Access Token.  
   - Select the Airtable base and table you want to monitor.  
   - Set the trigger field to "Tik tok username".  
   - Set polling interval to every minute.  
   - Save node.

2. **Create HTTP Request Node**  
   - Node Type: HTTP Request  
   - Name: "Get TikTok Profile Data via Dumpling AI"  
   - Set method to POST.  
   - URL: `https://app.dumplingai.com/api/v1/get-tiktok-profile`  
   - Authentication: Create and assign HTTP Header Auth credentials with your Dumpling AI API key.  
   - Body Format: JSON  
   - Body Content:  
     ```json
     {
       "handle": "{{ $json.fields['Tik tok username'] }}"
     }
     ```  
   - Connect "Watch for New TikTok Handles in Airtable" output to this node input.

3. **Create If Node for Filtering**  
   - Node Type: If  
   - Name: "Check if Follower Count is 100k or More"  
   - Condition: Numeric check where expression `{{ $json.stats.followerCount }}` is greater than or equal to 100000.  
   - Connect "Get TikTok Profile Data via Dumpling AI" output to this node input.

4. **Create Airtable Update Node for Basic Stats**  
   - Node Type: Airtable  
   - Name: "Update Record with Basic TikTok Stats"  
   - Credentials: Use the same Airtable Personal Access Token as the trigger.  
   - Base & Table: Same as trigger node.  
   - Operation: Update  
   - Record ID: Use expression `{{ $('Watch for New TikTok Handles in Airtable').item.json.id }}` to target the original record.  
   - Map fields:  
     - ID: `{{ $json.user.id }}`  
     - heartCount: `{{ $json.stats.heart }}`  
     - videoCount: `{{ $json.stats.videoCount }}`  
     - followerCount: `{{ $json.stats.followerCount }}`  
     - followingCount: `{{ $json.stats.followingCount }}`  
     - Tik tok username: `{{ $('Watch for New TikTok Handles in Airtable').item.json.fields['Tik tok username'] }}`  
   - Connect "Check if Follower Count is 100k or More" true output to this node.

5. **Create Airtable Update Node for All Stats**  
   - Node Type: Airtable  
   - Name: "Update Record with All TikTok Stats"  
   - Credentials: Same as above.  
   - Base & Table: Same as above.  
   - Operation: Update  
   - Record ID: Same expression as previous node.  
   - Map fields:  
     - All fields from Basic Stats node plus:  
     - avatarLarger: `{{ $json.user.avatarThumb }}`  
   - Connect "Check if Follower Count is 100k or More" false output to this node.

6. **Add Sticky Note for Documentation** (optional)  
   - Node Type: Sticky Note  
   - Position it clearly on the canvas.  
   - Paste the summary content describing the workflow purpose and operation steps.

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| Workflow uses Dumpling AI API for web scraping of TikTok profiles. Dumpling AI requires API key authentication. | Dumpling AI API documentation (https://app.dumplingai.com/docs) (not provided directly in workflow) |
| Airtable tables must have predefined schema with fields: Tik tok username, ID, followerCount, followingCount, heartCount, videoCount, avatarLarger (avatar thumbnail). | Airtable schema setup requirement |
| The follower count threshold is set to 100,000 in this workflow; adjust in the If node condition as needed to target different influencer tiers. | Configurable filter parameter |
| The workflow polls Airtable every minute; this frequency can be adjusted in the trigger node settings. | Airtable API rate limits and cost considerations |
| Ensure Dumpling AI and Airtable credentials are correctly configured with necessary permissions before activating the workflow. | Credential setup best practice |

---

*Disclaimer: The provided text and workflow are created exclusively with n8n, an automation and integration tool, fully respecting current content policies and containing no illegal, offensive, or protected elements. All data processed is legal and public.*