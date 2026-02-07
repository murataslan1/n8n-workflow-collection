Automate Posting to Multiple Facebook Groups with Airtop, Google Sheets & Telegram

https://n8nworkflows.xyz/workflows/automate-posting-to-multiple-facebook-groups-with-airtop--google-sheets---telegram-6049


# Automate Posting to Multiple Facebook Groups with Airtop, Google Sheets & Telegram

### 1. Workflow Overview

This workflow automates posting to multiple Facebook groups by orchestrating interactions between Airtop (a browser automation node), Google Sheets (to retrieve group data), and Telegram (for triggering and notifications). It is designed for users who manage multiple Facebook groups and want to automate posting content efficiently with minimum manual intervention.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception and Initialization:** Receive commands from Telegram, prepare session parameters.
- **1.2 Browser and Facebook Navigation:** Launch browser session, open Facebook, navigate profiles and groups.
- **1.3 Group List Retrieval:** Fetch the list of Facebook groups from Google Sheets.
- **1.4 Posting Loop:** Iterate over each group, open it, write and publish the post.
- **1.5 Post-Posting Actions:** Notify success via Telegram, wait between posts, and close the browser.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Initialization

**Overview:**  
This block triggers the workflow via Telegram, extracts message and chat information, and initializes session parameters for Airtop.

**Nodes Involved:**  
- Start (Telegram Trigger)  
- Set message and chatId (Set)  
- Start Browser (Airtop)  
- Open Facebook (Airtop)  
- Set sessionId and windowId (Set)  
- Scroll Down a Bit (Airtop)  
- Get live view (Airtop)  
- click close if theres popup modal (Airtop, disabled)  
- Click to switch profile (Airtop, disabled)  

**Node Details:**

- **Start (Telegram Trigger)**  
  - Type: Telegram Trigger  
  - Role: Entry point listening for Telegram messages to initiate the workflow  
  - Configuration: Webhook triggered on new Telegram messages  
  - Inputs: Telegram message data  
  - Outputs: Passes message data to next node  
  - Edge Cases: Telegram webhook failure, message format issues

- **Set message and chatId (Set)**  
  - Type: Set  
  - Role: Extracts and stores Telegram message content and chat ID for later use  
  - Configuration: Uses expressions to map Telegram input fields to workflow variables  
  - Inputs: Telegram Trigger output  
  - Outputs: Variables for message text and chat ID  
  - Edge Cases: Message content missing or malformed

- **Start Browser (Airtop)**  
  - Type: Airtop (browser automation)  
  - Role: Launches a new browser session for Facebook automation  
  - Configuration: Defaults to a clean browser start, no special parameters  
  - Inputs: Set variables from prior step  
  - Outputs: Browser session context for downstream nodes  
  - Edge Cases: Browser launch failure, resource limits

- **Open Facebook (Airtop)**  
  - Type: Airtop  
  - Role: Opens Facebook homepage in the launched browser session  
  - Configuration: URL set to Facebook main page  
  - Inputs: Browser session from Start Browser  
  - Outputs: Session with Facebook loaded  
  - Edge Cases: Facebook not reachable, network errors

- **Set sessionId and windowId (Set)**  
  - Type: Set  
  - Role: Stores session and window identifiers needed for Airtop browser control  
  - Configuration: Extracts session information from prior nodes  
  - Inputs: Output from Open Facebook  
  - Outputs: Variables for session management  
  - Edge Cases: Missing session or window data

- **Scroll Down a Bit (Airtop)**  
  - Type: Airtop  
  - Role: Scrolls down the Facebook page slightly to trigger lazy loading or UI updates  
  - Configuration: Scroll percentage or pixels defined internally  
  - Inputs: Session variables  
  - Outputs: Updated page state  
  - Edge Cases: Scroll failure, page layout changes

- **Get live view (Airtop)**  
  - Type: Airtop  
  - Role: Retrieves the current view or screenshot for verification or conditional logic (not fully detailed here)  
  - Configuration: Default without parameters  
  - Inputs: Scroll Down a Bit output  
  - Outputs: Live view data  
  - Edge Cases: Timeout, rendering issues

- **click close if theres popup modal (Airtop, disabled)**  
  - Type: Airtop  
  - Role: Intended to close any modal popups that might block automation flow  
  - Configuration: Disabled, retry enabled with 2 max tries  
  - Inputs: Get live view output  
  - Outputs: Confirmation of modal closure  
  - Edge Cases: Popup not detected, modal blockers

- **Click to switch profile (Airtop, disabled)**  
  - Type: Airtop  
  - Role: Intended to switch Facebook profiles if needed  
  - Configuration: Disabled  
  - Inputs: click close if theres popup modal output  
  - Outputs: Profile switched confirmation  
  - Edge Cases: Profile switch failure

---

#### 2.2 Browser and Facebook Navigation

**Overview:**  
This block handles Facebook profile selection, navigating to the desired profile and groups page, preparing for posting.

**Nodes Involved:**  
- Go to Pages (Airtop, disabled)  
- Open Desired Profile (Airtop)  
- Switch to Desired Profile (Airtop)  
- Back to home (Airtop)  
- Scroll on home (Airtop)  

**Node Details:**

- **Go to Pages (Airtop, disabled)**  
  - Role: Navigate to Facebook Pages section (disabled)  
  - Edge Cases: Disabled, no active use

- **Open Desired Profile (Airtop)**  
  - Role: Opens the Facebook profile to be used for posting  
  - Inputs: Previous navigation nodes, session  
  - Outputs: Profile page loaded  
  - Edge Cases: Profile not found, access denied

- **Switch to Desired Profile (Airtop)**  
  - Role: Switches Facebook view to the specific profile if multiple profiles are accessible  
  - Inputs: Open Desired Profile  
  - Outputs: Profile switched confirmation  
  - Edge Cases: Switching errors

- **Back to home (Airtop)**  
  - Role: Returns to Facebook home page after profile switch  
  - Inputs: Switch to Desired Profile  
  - Outputs: Home page loaded  
  - Edge Cases: Navigation failure

- **Scroll on home (Airtop)**  
  - Role: Scrolls on Facebook home page to trigger UI updates or load content  
  - Inputs: Back to home  
  - Outputs: Scrolled page state  
  - Edge Cases: Scroll failure, layout changes

---

#### 2.3 Group List Retrieval

**Overview:**  
Fetches the list of Facebook groups where posts will be published from a Google Sheet.

**Nodes Involved:**  
- Get Group List (Google Sheets)  
- Post to Each Group (SplitInBatches)  

**Node Details:**

- **Get Group List (Google Sheets)**  
  - Type: Google Sheets  
  - Role: Reads rows from a configured sheet containing Facebook group URLs or IDs  
  - Configuration: Spreadsheet ID, Sheet name, Range set to the groups list  
  - Inputs: Output from Scroll on home  
  - Outputs: Array of groups to post to  
  - Edge Cases: Authentication failure, empty or malformed sheet data

- **Post to Each Group (SplitInBatches)**  
  - Type: SplitInBatches  
  - Role: Iterates over each Facebook group entry one by one to process posts sequentially  
  - Configuration: Batch size usually 1 for sequential processing  
  - Inputs: Group list array from Google Sheets  
  - Outputs: Single group data per iteration  
  - Edge Cases: Large batch sizes causing API rate limits or timeouts

---

#### 2.4 Posting Loop

**Overview:**  
Automates the process of opening each group, composing, and publishing a post.

**Nodes Involved:**  
- open group (Airtop)  
- Scroll60% (Airtop)  
- Find Post Box (Airtop)  
- click post box (Airtop)  
- Write Post (Airtop)  
- Publish Post (Airtop)  
- Scroll After Posting (Airtop)  

**Node Details:**

- **open group (Airtop)**  
  - Role: Opens the Facebook group page URL or ID from the current batch item  
  - Inputs: Post to Each Group iteration  
  - Outputs: Group page loaded  
  - Edge Cases: Group not accessible, permissions error

- **Scroll60% (Airtop)**  
  - Role: Scrolls 60% down the group page to load post box or UI elements  
  - Inputs: open group output  
  - Outputs: Scrolled page state  
  - Edge Cases: Layout changes, scroll failure

- **Find Post Box (Airtop)**  
  - Role: Locates the post input box on the group page for writing content  
  - Inputs: Scroll60%  
  - Outputs: Post box element reference  
  - Edge Cases: UI changes, post box not found

- **click post box (Airtop)**  
  - Role: Clicks into the post box to activate it for text input  
  - Inputs: Find Post Box  
  - Outputs: Post box ready for input  
  - Edge Cases: Click not registered, popup interference

- **Write Post (Airtop)**  
  - Role: Enters the post message text, presumably from Telegram message or preset text  
  - Inputs: click post box  
  - Outputs: Text input completed  
  - Edge Cases: Input failure, encoding issues

- **Publish Post (Airtop)**  
  - Role: Clicks the publish/post button to submit the post to the group  
  - Inputs: Write Post  
  - Outputs: Post submitted confirmation  
  - Edge Cases: Network failure, Facebook rate limits, UI changes

- **Scroll After Posting (Airtop)**  
  - Role: Scrolls to update the page after posting, possibly to trigger UI refresh  
  - Inputs: Publish Post  
  - Outputs: Updated page state  
  - Edge Cases: Scroll failure

---

#### 2.5 Post-Posting Actions

**Overview:**  
After a post is published, this block sends a Telegram success notification, waits before the next post, and manages browser closure.

**Nodes Involved:**  
- Send Success Message (Telegram)  
- Wait 5 Seconds (Wait)  
- Close Browser (Airtop)  

**Node Details:**

- **Send Success Message (Telegram)**  
  - Type: Telegram node  
  - Role: Sends a message back to the Telegram chat confirming successful post publication  
  - Configuration: Uses chatId and message variables set earlier  
  - Inputs: Scroll After Posting  
  - Outputs: Confirmation message sent  
  - Edge Cases: Telegram API failures, chat ID invalid

- **Wait 5 Seconds (Wait)**  
  - Type: Wait  
  - Role: Pauses workflow execution for 5 seconds to prevent rapid posting and reduce detection risk  
  - Configuration: Fixed 5 seconds delay  
  - Inputs: Send Success Message  
  - Outputs: Delay completed  
  - Edge Cases: Delay interruptions, workflow timeout settings

- **Close Browser (Airtop)**  
  - Type: Airtop  
  - Role: Closes the browser session after all groups are processed  
  - Inputs: Post to Each Group completion  
  - Outputs: Browser session terminated  
  - Edge Cases: Failure to close browser, orphan processes

---

### 3. Summary Table

| Node Name                     | Node Type           | Functional Role                               | Input Node(s)                   | Output Node(s)                   | Sticky Note                                      |
|-------------------------------|---------------------|-----------------------------------------------|--------------------------------|---------------------------------|-------------------------------------------------|
| Start                         | Telegram Trigger    | Entry point, receive Telegram command          |                                | Set message and chatId           |                                                 |
| Set message and chatId        | Set                 | Extract Telegram message and chat ID           | Start                          | Start Browser                   |                                                 |
| Start Browser                 | Airtop              | Launch browser session                          | Set message and chatId          | Open Facebook                  |                                                 |
| Open Facebook                | Airtop              | Open Facebook homepage                          | Start Browser                   | Set sessionId and windowId       |                                                 |
| Set sessionId and windowId   | Set                 | Store session and window IDs                    | Open Facebook                  | Scroll Down a Bit                |                                                 |
| Scroll Down a Bit            | Airtop              | Scroll page slightly                            | Set sessionId and windowId      | Get live view                   |                                                 |
| Get live view               | Airtop              | Capture current browser view                     | Scroll Down a Bit               | click close if theres popup modal|                                                 |
| click close if theres popup modal | Airtop (disabled) | Close popups if present                          | Get live view                  | Click to switch profile          |                                                 |
| Click to switch profile      | Airtop (disabled)   | Switch Facebook profile                          | click close if theres popup modal | Go to Pages (disabled)           |                                                 |
| Go to Pages                 | Airtop (disabled)   | Navigate to Facebook Pages section (disabled)  | Click to switch profile          | Open Desired Profile             |                                                 |
| Open Desired Profile         | Airtop              | Open specified Facebook profile                 | Go to Pages (disabled)          | Switch to Desired Profile        |                                                 |
| Switch to Desired Profile    | Airtop              | Switch to desired Facebook profile              | Open Desired Profile            | Back to home                   |                                                 |
| Back to home                | Airtop              | Navigate to Facebook home page                   | Switch to Desired Profile       | Scroll on home                  |                                                 |
| Scroll on home              | Airtop              | Scroll on Facebook home to load content         | Back to home                   | Get Group List                 |                                                 |
| Get Group List              | Google Sheets       | Retrieve Facebook group list                      | Scroll on home                 | Post to Each Group             |                                                 |
| Post to Each Group          | SplitInBatches      | Iterate over groups for posting                  | Get Group List                 | Close Browser, open group       |                                                 |
| open group                 | Airtop              | Open Facebook group page                          | Post to Each Group             | Scroll60%                      |                                                 |
| Scroll60%                  | Airtop              | Scroll 60% down group page                        | open group                    | Find Post Box                  |                                                 |
| Find Post Box              | Airtop              | Locate post input box                             | Scroll60%                     | click post box                 |                                                 |
| click post box             | Airtop              | Click to activate post box                        | Find Post Box                 | Write Post                    |                                                 |
| Write Post                 | Airtop              | Write the post content                            | click post box                | Publish Post                  |                                                 |
| Publish Post               | Airtop              | Click publish button to post                      | Write Post                    | Scroll After Posting          |                                                 |
| Scroll After Posting       | Airtop              | Scroll page after posting                          | Publish Post                  | Send Success Message          |                                                 |
| Send Success Message       | Telegram            | Notify Telegram chat of successful post          | Scroll After Posting          | Wait 5 Seconds                |                                                 |
| Wait 5 Seconds             | Wait                | Pause workflow 5 seconds between posts            | Send Success Message          | Post to Each Group            |                                                 |
| Close Browser              | Airtop              | Close the browser session                          | Post to Each Group            |                                 |                                                 |
| Sticky Note                | StickyNote          |                                                 |                                |                                 |                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Telegram Trigger Node ("Start"):**
   - Type: Telegram Trigger  
   - Configure webhook to listen for incoming Telegram messages.

2. **Create Set Node ("Set message and chatId"):**
   - Type: Set  
   - Extract `message.text` and `chat.id` from Telegram trigger data using expressions.  
   - Connect from Telegram Trigger output.

3. **Create Airtop Node ("Start Browser"):**
   - Type: Airtop  
   - Configure to launch a new browser session without additional parameters.  
   - Connect from Set node output.

4. **Create Airtop Node ("Open Facebook"):**
   - Type: Airtop  
   - Configure URL to Facebook homepage (https://www.facebook.com).  
   - Connect from Start Browser output.

5. **Create Set Node ("Set sessionId and windowId"):**
   - Type: Set  
   - Extract and store sessionId and windowId from the Open Facebook node output.  
   - Connect from Open Facebook output.

6. **Create Airtop Node ("Scroll Down a Bit"):**
   - Type: Airtop  
   - Configure to perform a small scroll action (e.g., 10-20% page height).  
   - Connect from Set sessionId and windowId output.

7. **Create Airtop Node ("Get live view"):**
   - Type: Airtop  
   - Configure to capture the current browser view or page state.  
   - Connect from Scroll Down a Bit output.

8. **(Optional) Create Airtop Node ("click close if theres popup modal"):**
   - Type: Airtop  
   - Logic to detect and close modals, retry up to twice.  
   - Disabled by default.  
   - Connect from Get live view output.

9. **(Optional) Create Airtop Node ("Click to switch profile"):**
   - Type: Airtop  
   - Logic to switch Facebook profile if multiple profiles exist.  
   - Disabled by default.  
   - Connect from click close if theres popup modal output.

10. **(Optional) Create Airtop Node ("Go to Pages"):**
    - Type: Airtop  
    - Navigate to the Facebook Pages area.  
    - Disabled by default.  
    - Connect from Click to switch profile output.

11. **Create Airtop Node ("Open Desired Profile"):**
    - Type: Airtop  
    - Open the target Facebook profile page for posting.  
    - Connect from Go to Pages output (or from Click to switch profile output if Go to Pages disabled).

12. **Create Airtop Node ("Switch to Desired Profile"):**
    - Type: Airtop  
    - Switch view to the selected Facebook profile.  
    - Connect from Open Desired Profile output.

13. **Create Airtop Node ("Back to home"):**
    - Type: Airtop  
    - Navigate back to Facebook home page.  
    - Connect from Switch to Desired Profile output.

14. **Create Airtop Node ("Scroll on home"):**
    - Type: Airtop  
    - Scroll on home page to trigger content loading.  
    - Connect from Back to home output.

15. **Create Google Sheets Node ("Get Group List"):**
    - Type: Google Sheets  
    - Configure with credentials and spreadsheet ID to read the group list sheet.  
    - Connect from Scroll on home output.

16. **Create SplitInBatches Node ("Post to Each Group"):**
    - Type: SplitInBatches  
    - Configure batch size = 1 to iterate groups one at a time.  
    - Connect from Get Group List output.

17. **Create Airtop Node ("open group"):**
    - Type: Airtop  
    - Open the Facebook group URL or ID from the current batch item.  
    - Connect from Post to Each Group output.

18. **Create Airtop Node ("Scroll60%"):**
    - Type: Airtop  
    - Scroll 60% down the group page to load UI elements.  
    - Connect from open group output.

19. **Create Airtop Node ("Find Post Box"):**
    - Type: Airtop  
    - Locate the post input box element.  
    - Connect from Scroll60% output.

20. **Create Airtop Node ("click post box"):**
    - Type: Airtop  
    - Click into post box to activate it.  
    - Connect from Find Post Box output.

21. **Create Airtop Node ("Write Post"):**
    - Type: Airtop  
    - Enter the post content (likely from Telegram message or preset).  
    - Connect from click post box output.

22. **Create Airtop Node ("Publish Post"):**
    - Type: Airtop  
    - Click the publish button to post content.  
    - Connect from Write Post output.

23. **Create Airtop Node ("Scroll After Posting"):**
    - Type: Airtop  
    - Scroll page to refresh after posting.  
    - Connect from Publish Post output.

24. **Create Telegram Node ("Send Success Message"):**
    - Type: Telegram  
    - Send confirmation message to the original Telegram chat using stored chatId.  
    - Connect from Scroll After Posting output.

25. **Create Wait Node ("Wait 5 Seconds"):**
    - Type: Wait  
    - Pause execution for 5 seconds before next iteration.  
    - Connect from Send Success Message output.

26. **Connect Wait 5 Seconds output back to "Post to Each Group" to continue loop.**

27. **Create Airtop Node ("Close Browser"):**
    - Type: Airtop  
    - Close the browser session once all groups have been processed.  
    - Connect from Post to Each Group completion (after all batches processed).

---

### 5. General Notes & Resources

| Note Content                                                                                              | Context or Link                                                |
|-----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| Workflow automates Facebook posting using Airtop browser automation integrated with Telegram and Google Sheets | Project description                                            |
| Telegram trigger webhook ID: 1e558573-987c-4695-beb8-b0f68cd02791                                           | Telegram node configuration                                   |
| Telegram send message webhook ID: 41ab4745-f68e-44f9-bd41-8fa71ee79821                                     | Telegram node configuration                                   |
| Wait node configured for 5 seconds delay between posts to avoid spamming or detection by Facebook         | Throttling mechanism                                           |
| Some Airtop nodes (click close if theres popup modal, Click to switch profile, Go to Pages) are disabled by default | Optional or experimental functionality                         |

---

**Disclaimer:** The content is derived exclusively from an automated n8n workflow designed for lawful and public data handling. It complies with all relevant content policies and contains no illegal or offensive material.