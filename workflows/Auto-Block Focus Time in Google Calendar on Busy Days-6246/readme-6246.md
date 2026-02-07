Auto-Block Focus Time in Google Calendar on Busy Days

https://n8nworkflows.xyz/workflows/auto-block-focus-time-in-google-calendar-on-busy-days-6246


# Auto-Block Focus Time in Google Calendar on Busy Days

---

### 1. Workflow Overview

This workflow automates the creation of dedicated "Focus Time" blocks in a user’s Google Calendar for days that are already heavily booked (6 or more hours). It scans the current week (Sunday to Saturday) to analyze calendar events, calculates free time slots during standard working hours (9 AM to 5 PM), and automatically blocks out remaining free time on busy days as "Focus Time" events. The workflow is designed to run daily at 8 AM before the workday starts, ensuring the calendar is updated proactively.

**Target Use Cases:**  
- Professionals who want to ensure uninterrupted focus periods on busy days  
- Teams automating calendar management to optimize productivity  
- Users wanting a hands-off approach to time blocking based on existing commitments  

**Logical Blocks:**  
- **1.1 Schedule Trigger:** Initiates the workflow daily at a fixed time.  
- **1.2 Fetch Calendar Data:** Retrieves all events for the full current week from Google Calendar.  
- **1.3 Analyze and Calculate Free Slots:** Processes events to identify days with 6+ hours booked and computes available focus time slots.  
- **1.4 Decision Making:** Determines if focus time events should be created.  
- **1.5 Create Focus Time Events:** Splits and creates individual calendar events for each free slot on busy days.  
- **1.6 Logging:** Logs creation results or no-action messages for audit and troubleshooting.

---

### 2. Block-by-Block Analysis

---

#### 1.1 Schedule Trigger

- **Overview:**  
  Triggers the workflow once daily at 8:00 AM to analyze the current week’s calendar data before the workday begins.

- **Nodes Involved:**  
  - Schedule Trigger

- **Node Details:**

  **Schedule Trigger**  
  - Type: Schedule Trigger node  
  - Role: Initiates workflow execution on a fixed schedule  
  - Configuration: Cron expression set to `0 8 * * *` (8:00 AM every day)  
  - Input: None (trigger)  
  - Output: Triggers "Get Full Week Events" node  
  - Edge Cases: If the n8n instance is down or paused, the trigger may not fire; time zone mismatches may cause unexpected trigger time  
  - Version: 1.1  
  - Notes: Sticky Note attached recommends setting this trigger before the start of the user's workday

---

#### 1.2 Fetch Calendar Data

- **Overview:**  
  Retrieves all calendar events for the current week (Sunday through Saturday) from the user's primary Google Calendar.

- **Nodes Involved:**  
  - Get Full Week Events

- **Node Details:**

  **Get Full Week Events**  
  - Type: Google Calendar node  
  - Role: Fetches all events for the full week  
  - Configuration:  
    - Operation: `getAll` (fetch all events)  
    - Calendar: Primary calendar selected  
    - Options: Default (no filters or date range set here; filtering is done later in code)  
  - Input: Trigger from Schedule Trigger  
  - Output: Passes all events to the code node for processing  
  - Credentials: Uses Google Calendar OAuth2 (configured externally)  
  - Edge Cases:  
    - Authentication failures if credentials expire or are revoked  
    - API rate limits or quota errors  
    - Large event sets might cause performance issues  
  - Notes: Sticky Note reminds to update credentials accordingly

---

#### 1.3 Analyze and Calculate Free Slots

- **Overview:**  
  Processes the week's events to determine which days have 6 or more hours booked, calculates free time slots within standard working hours (9 AM to 5 PM), and prepares focus time slots to be created.

- **Nodes Involved:**  
  - Calculate Full Week Focus Time Slots

- **Node Details:**

  **Calculate Full Week Focus Time Slots**  
  - Type: Code node (JavaScript)  
  - Role:  
    - Defines the current week boundaries starting Sunday  
    - Iterates through each day, filters events for that day, and sums booked hours within 9-5 work hours  
    - If booked hours ≥ 6, calculates free slots between events and at day start/end  
    - Filters free slots to those ≥ 15 minutes  
    - Returns JSON indicating whether focus time creation is needed and details of free slots  
  - Input: All events from Google Calendar node  
  - Output: JSON with keys:  
    - `shouldCreateFocusTime` (boolean)  
    - `totalSlotsFound` (number)  
    - `freeSlots` (array of time slot objects)  
    - `weekAnalyzed` (array of day labels)  
  - Key expressions: Uses JavaScript date manipulation, array filtering, sorting, and mapping  
  - Edge Cases:  
    - Days with no events but somehow meeting 6+ hours (unlikely) are logged  
    - Events outside work hours are clipped to 9-5 window  
    - Timezone discrepancies may affect date comparisons (requires consistent timezone handling)  
  - Version: 2  
  - Notes: Sticky Note explains the weekly scope and 6+ hour threshold logic

---

#### 1.4 Decision Making

- **Overview:**  
  Evaluates whether focus time events should be created based on analysis results.

- **Nodes Involved:**  
  - Should Create Focus Time?

- **Node Details:**

  **Should Create Focus Time?**  
  - Type: If node  
  - Role: Branches workflow based on boolean `shouldCreateFocusTime` from previous code node  
  - Configuration: Checks if `{{ $json.shouldCreateFocusTime }}` equals `true`  
  - Input: Output from "Calculate Full Week Focus Time Slots" node  
  - Output:  
    - True branch: proceeds to split free slots for event creation  
    - False branch: logs that no focus time is needed  
  - Edge Cases: Logic depends on code node output correctness  
  - Version: 2

---

#### 1.5 Create Focus Time Events

- **Overview:**  
  Splits the array of free slots into individual items and creates a corresponding focus time event on Google Calendar for each.

- **Nodes Involved:**  
  - Split Free Slots  
  - Create Focus Time Event

- **Node Details:**

  **Split Free Slots**  
  - Type: Item Lists node  
  - Role: Splits the `freeSlots` array from previous node into separate items for individual processing  
  - Configuration: Field to split out: `freeSlots`  
  - Input: True branch from If node  
  - Output: Single focus slot per item to next node  
  - Version: 3

  **Create Focus Time Event**  
  - Type: Google Calendar node  
  - Role: Creates a calendar event for each free slot  
  - Configuration:  
    - Operation: Create event (default)  
    - Start: `={{ $json.start }}` (ISO datetime of slot start)  
    - End: `={{ $json.end }}` (ISO datetime of slot end)  
    - Calendar: Primary calendar  
    - Additional fields: None specified, but event summary defaults to "Focus Time" from code data  
  - Credentials: Google Calendar OAuth2 (same as fetch node)  
  - Input: From Split Free Slots node  
  - Output: Passes created event data to logging node  
  - Edge Cases:  
    - API errors if event overlaps or quota exceeded  
    - Authentication errors if OAuth token expired  
  - Version: 1  
  - Notes: Sticky Note reminds to update credentials

---

#### 1.6 Logging

- **Overview:**  
  Logs the outcomes of focus time creation or the decision not to create focus time for the week.

- **Nodes Involved:**  
  - Log Results  
  - Log No Focus Time Needed

- **Node Details:**

  **Log Results**  
  - Type: Code node  
  - Role: Aggregates all created focus time events into a summary JSON message for audit or debug  
  - Configuration: Extracts event start/end times and summary, logs info to console, returns JSON summary  
  - Input: From Create Focus Time Event node  
  - Output: Summary message with total slots created and their details  
  - Version: 2

  **Log No Focus Time Needed**  
  - Type: Code node  
  - Role: Logs the message when no focus time events are created because no day had 6+ booked hours  
  - Configuration: Extracts message and analyzed week from input, logs to console, returns JSON with action flag  
  - Input: False branch from If node  
  - Output: Informational JSON message  
  - Version: 2

---

### 3. Summary Table

| Node Name                      | Node Type            | Functional Role                           | Input Node(s)                  | Output Node(s)                | Sticky Note                                                                                   |
|-------------------------------|----------------------|-----------------------------------------|-------------------------------|------------------------------|-----------------------------------------------------------------------------------------------|
| Schedule Trigger               | Schedule Trigger     | Starts workflow daily at 8 AM             | None                          | Get Full Week Events          | Set the schedule time the workflow would run (recommend to set at a time before user's work day starts). |
| Get Full Week Events           | Google Calendar      | Fetches all events for the current week | Schedule Trigger              | Calculate Full Week Focus Time Slots | Workflow checks user's calendar from Sunday to Saturday of current week. Goal of this part is to determine if a day has 6 or more hours booked already. Note: Update the credentials used in the "Get Full Weeks Events" node to use your Google credentials. |
| Calculate Full Week Focus Time Slots | Code               | Analyzes events, calculates free slots   | Get Full Week Events          | Should Create Focus Time?      | For days with 6 or more hours already booked, the workflow automatically blocks the remaining hours for focus time. The workflow assumes an 8 hour work day. Note: Update the credentials used in the "Create Focus Time Event" node to use your Google credentials. |
| Should Create Focus Time?      | If                   | Decides if focus time events should be created | Calculate Full Week Focus Time Slots | Split Free Slots (true branch); Log No Focus Time Needed (false branch) |                                                                                               |
| Split Free Slots               | Item Lists            | Splits free slots array into individual items | Should Create Focus Time? (true) | Create Focus Time Event       |                                                                                               |
| Create Focus Time Event        | Google Calendar       | Creates focus time events in calendar    | Split Free Slots              | Log Results                  |                                                                                               |
| Log Results                   | Code                  | Logs success summary of created events   | Create Focus Time Event       | None                         |                                                                                               |
| Log No Focus Time Needed       | Code                  | Logs when no focus time creation is needed | Should Create Focus Time? (false) | None                         |                                                                                               |
| Sticky Note                   | Sticky Note           | Instructional note on scheduling          | None                          | None                         | Set the schedule time the workflow would run (recommend to set at a time before user's work day starts). |
| Sticky Note1                  | Sticky Note           | Instructional note on calendar fetching   | None                          | None                         | Workflow checks user's calendar from Sunday to Saturday of current week. Goal of this part is to determine if a day has 6 or more hours booked already. Note: Update the credentials used in the "Get Full Weeks Events" node to use your Google credentials. |
| Sticky Note2                  | Sticky Note           | Instructional note on focus time creation | None                          | None                         | For days with 6 or more hours already booked, the workflow automatically blocks the remaining hours for dedicated focus time. The workflows assumes an 8 hour work week. For example, if Monday has 6.5 booked already (for meetings, tasks etc.), the workflow will block the remaining 1.5 hours. The results are logged to help with any troubleshooting. Note: Update the credentials used in the "Create Focus Time Event" node to use your Google credentials. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node:**  
   - Type: Schedule Trigger  
   - Set Cron expression: `0 8 * * *` (daily at 8:00 AM)  
   - Connect output to next node.

2. **Create a Google Calendar node to fetch events:**  
   - Type: Google Calendar  
   - Operation: `getAll`  
   - Calendar: Primary calendar  
   - Credentials: Connect your Google Calendar OAuth2 credentials  
   - Connect input from Schedule Trigger output  
   - Connect output to Code node.

3. **Create a Code node to calculate focus time slots:**  
   - Type: Code (JavaScript)  
   - Paste the provided JavaScript code that:  
     - Defines the current week Sunday-Saturday  
     - Filters events per day within 9 AM - 5 PM  
     - Sums booked hours per day  
     - If booked hours ≥ 6, finds free slots of at least 15 minutes  
     - Returns JSON with `shouldCreateFocusTime` boolean and free slots  
   - Connect input from Google Calendar node  
   - Connect output to If node.

4. **Create an If node to decide whether to create focus time:**  
   - Type: If  
   - Condition: Check if `{{ $json.shouldCreateFocusTime }}` equals `true`  
   - True branch: connect to Item Lists node  
   - False branch: connect to Code node for logging no action.

5. **Create an Item Lists node to split free slots:**  
   - Type: Item Lists  
   - Field to split out: `freeSlots`  
   - Connect input from If node (true branch)  
   - Connect output to Google Calendar create event node.

6. **Create a Google Calendar node to create events:**  
   - Type: Google Calendar  
   - Operation: Create event  
   - Calendar: Primary calendar  
   - Start: Expression `={{ $json.start }}`  
   - End: Expression `={{ $json.end }}`  
   - Credentials: Same Google Calendar OAuth2 credentials  
   - Connect input from Item Lists node  
   - Connect output to Code node for logging creation results.

7. **Create a Code node to log results when focus time is created:**  
   - Type: Code (JavaScript)  
   - Aggregate created events  
   - Log summary message with total slots and their details  
   - Connect input from Google Calendar create event node.

8. **Create a Code node to log when no focus time is needed:**  
   - Type: Code (JavaScript)  
   - Extract message from input JSON  
   - Log that no focus time was created this week  
   - Connect input from If node (false branch).

9. **Add Sticky Notes for documentation:**  
   - Add notes near Schedule Trigger explaining recommended trigger time  
   - Add notes near Get Full Week Events about credential update and purpose  
   - Add notes near Calculate Focus Time Slots and Create Focus Time Event about logic and credentials.

---

### 5. General Notes & Resources

| Note Content                                                                                                                  | Context or Link                                                                                                  |
|-------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| The workflow runs daily before typical work hours to ensure focus time blocks are created proactively.                         | Scheduling best practice                                                                                         |
| Credentials for Google Calendar OAuth2 must be configured and kept valid for both reading and writing calendar events.         | Google Calendar API documentation                                                                                |
| This workflow assumes an 8-hour workday from 9 AM to 5 PM for calculating booked and free slots. Adjust code if needed.        | Business hours standard                                                                                          |
| Free slots shorter than 15 minutes are ignored to avoid creating impractically short focus blocks.                             | Configurable threshold in code                                                                                   |
| The calculation uses local timezone implicitly; ensure n8n server timezone matches user's calendar timezone to avoid errors.  | Timezone considerations                                                                                          |
| Logs provide detailed insights for troubleshooting and verifying workflow actions.                                              | Logging nodes                                                                                                    |

---

**Disclaimer:**  
The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly respects applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.