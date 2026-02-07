Add a event to Google Calendar automatically

https://n8nworkflows.xyz/workflows/add-a-event-to-google-calendar-automatically-427


# Add a event to Google Calendar automatically

### 1. Workflow Overview

This workflow is designed to automate the addition of a calendar event to Google Calendar. It targets users who want to create calendar events programmatically within n8n, triggered manually or by other means. The workflow contains two main logical blocks:

- **1.1 Input Reception:** A manual trigger node to start the workflow.
- **1.2 Google Calendar Event Creation:** A Google Calendar node that creates a calendar event with specified start and end times.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block initiates the workflow execution manually. It is the entry point that triggers the subsequent creation of the calendar event.

- **Nodes Involved:**  
  - On clicking 'execute' (Manual Trigger)

- **Node Details:**  
  - **Name:** On clicking 'execute'  
  - **Type:** Manual Trigger (`n8n-nodes-base.manualTrigger`)  
  - **Role:** Allows manual initiation of the workflow within the n8n editor or via API call.  
  - **Configuration:** Default settings, no parameters configured.  
  - **Expressions/Variables:** None.  
  - **Input:** None (starting node).  
  - **Output:** Connects to the Google Calendar node.  
  - **Version-Specific:** Compatible with n8n v0.108.0+ (general manual trigger node).  
  - **Potential Failures:** None expected as it is a manual trigger; user must execute manually.  
  - **Sub-Workflow:** None.

#### 1.2 Google Calendar Event Creation

- **Overview:**  
  This block handles the creation of a new calendar event in the specified Google Calendar account. It receives the trigger from the manual trigger node and uses preset event times to add the event.

- **Nodes Involved:**  
  - Google Calendar

- **Node Details:**  
  - **Name:** Google Calendar  
  - **Type:** Google Calendar Node (`n8n-nodes-base.googleCalendar`)  
  - **Role:** To create a calendar event by specifying start and end date-times, and the calendar email.  
  - **Configuration:**  
    - **Calendar:** `shaligramshraddha@gmail.com` (target calendar email)  
    - **Start:** `2020-06-25T07:00:00.000Z` (ISO 8601 format)  
    - **End:** `2020-06-27T07:00:00.000Z` (ISO 8601 format)  
    - **Additional Fields:** None configured.  
  - **Expressions/Variables:** None; static date-time values are used.  
  - **Input:** Receives trigger data from the Manual Trigger node.  
  - **Output:** Outputs data representing the created event (event ID, details, etc.).  
  - **Version-Specific:** Requires valid Google Calendar OAuth2 credentials linked to the node (credential named "new one").  
  - **Potential Failures:**  
    - Authentication errors (invalid or expired Google OAuth2 token).  
    - Permission errors if the user does not have write access to the specified calendar.  
    - Date-time format errors if values are not valid ISO 8601 strings.  
    - Network or API rate limiting errors.  
  - **Sub-Workflow:** None.

---

### 3. Summary Table

| Node Name            | Node Type               | Functional Role                | Input Node(s)          | Output Node(s) | Sticky Note |
|----------------------|-------------------------|-------------------------------|-----------------------|----------------|-------------|
| On clicking 'execute' | Manual Trigger          | Initiates the workflow manually | None                  | Google Calendar |             |
| Google Calendar      | Google Calendar Node    | Creates an event on Google Calendar | On clicking 'execute' | None           |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add a new node of type **Manual Trigger**.  
   - Leave all parameters as default.  
   - Position it as the start node.

2. **Create Google Calendar Node**  
   - Add a node of type **Google Calendar**.  
   - Configure the following parameters:  
     - **Calendar:** Enter the Google Calendar email address you want to add events to (e.g., `shaligramshraddha@gmail.com`).  
     - **Start:** Set static start date-time as `2020-06-25T07:00:00.000Z`.  
     - **End:** Set static end date-time as `2020-06-27T07:00:00.000Z`.  
     - Leave **Additional Fields** empty unless you want to add more event details (like description, summary, location).  
   - Assign valid **Google Calendar OAuth2 credentials** to this node:  
     - Create or select existing OAuth2 credentials with appropriate Google API scopes (`https://www.googleapis.com/auth/calendar`).  
     - Name credentials accordingly (e.g., "new one").  
   
3. **Connect Nodes**  
   - Connect the output of the **Manual Trigger** node to the input of the **Google Calendar** node.

4. **Save and Execute**  
   - Save the workflow.  
   - Trigger execution by clicking on **Execute Workflow** manually.  
   - Verify event creation in the specified Google Calendar.

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                                       |
|----------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| Ensure Google Calendar API is enabled in your Google Cloud Console for the OAuth2 credentials | Google API Console: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com |
| Date-time values must be in ISO 8601 format and use UTC timezone (`Z` suffix)                | https://www.iso.org/iso-8601-date-and-time-format.html                |
| OAuth2 credentials require consent with calendar write permissions                           | Google OAuth2 scopes: https://developers.google.com/identity/protocols/oauth2/scopes#calendar |
| For dynamic event creation, consider replacing static dates with expressions or input data  | n8n Expressions Documentation: https://docs.n8n.io/nodes/expressions/ |

---

This documentation provides a thorough understanding of the workflow, enabling users to replicate, troubleshoot, and extend the automation as needed.