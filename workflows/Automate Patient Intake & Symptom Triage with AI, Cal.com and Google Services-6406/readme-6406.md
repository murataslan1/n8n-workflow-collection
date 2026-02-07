Automate Patient Intake & Symptom Triage with AI, Cal.com and Google Services

https://n8nworkflows.xyz/workflows/automate-patient-intake---symptom-triage-with-ai--cal-com-and-google-services-6406


# Automate Patient Intake & Symptom Triage with AI, Cal.com and Google Services

### 1. Workflow Overview

This workflow automates patient intake and symptom triage by integrating AI-driven diagnosis with calendar and scheduling services (Cal.com, Google Calendar, Google Sheets). It streamlines appointment handling by extracting patient information, determining the appropriate medical department, and scheduling appointments automatically.

The workflow consists of five main logical blocks:

- **1.1 Input Reception:** Receiving new patient appointment requests from Cal.com via webhook trigger.
- **1.2 Appointment Time Extraction:** Capturing the requested appointment time from the incoming data.
- **1.3 AI Processing:** Utilizing AI models to perform symptom triage, diagnose, and route the patient to the correct doctor/department.
- **1.4 Appointment Data Management:** Checking existing appointments, filtering unique entries, and saving new appointments in Google Sheets.
- **1.5 Calendar Synchronization:** Mapping medical departments to their respective Google Calendars and creating appointments accordingly.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block listens for new patient appointment requests through a webhook trigger linked to Cal.com and initiates the workflow by passing the data downstream.

- **Nodes Involved:**  
  - Check for new patient appointment Requests

- **Node Details:**  
  - **Check for new patient appointment Requests**  
    - *Type:* Cal.com Trigger  
    - *Role:* Listens for incoming webhook events when a patient books an appointment via Cal.com.  
    - *Configuration:* Uses a predefined webhook ID to capture appointment request data.  
    - *Inputs:* External webhook calls (HTTP) from Cal.com.  
    - *Outputs:* Triggers the flow to the "Grab Appointment Time" node.  
    - *Edge Cases:* Webhook downtime, malformed payloads, authentication or permission errors for Cal.com webhook setup.

#### 2.2 Appointment Time Extraction

- **Overview:**  
  Extracts the appointment time from the incoming patient request data to use in scheduling and AI processing.

- **Nodes Involved:**  
  - Grab Appointment Time

- **Node Details:**  
  - **Grab Appointment Time**  
    - *Type:* DateTime  
    - *Role:* Extracts and formats the appointment date and time from the webhook data.  
    - *Configuration:* Default setup to parse date/time from incoming payload.  
    - *Inputs:* Output from the Cal.com trigger node.  
    - *Outputs:* Passes formatted date/time to "Intelligent Doctor Routing".  
    - *Edge Cases:* Missing or invalid date/time data causing parsing errors.

#### 2.3 AI Processing

- **Overview:**  
  Uses AI to triage symptoms and suggest the appropriate department or doctor, then parses the AI output into a structured patient info and diagnosis format.

- **Nodes Involved:**  
  - Intelligent Doctor Routing  
  - AI Diagnosis  
  - Parse Output in our preferred structure  
  - Extract Patient Info and AI Diagnosis  

- **Node Details:**  
  - **AI Diagnosis**  
    - *Type:* LangChain OpenRouter Chat Model  
    - *Role:* Runs AI chat model to analyze patient symptoms and provide a diagnosis or routing recommendation.  
    - *Configuration:* Connects to OpenAI or equivalent via LangChain integration.  
    - *Inputs:* Appointment time and patient data.  
    - *Outputs:* Passes AI response to "Intelligent Doctor Routing".  
    - *Edge Cases:* API rate limits, authentication failures, incomplete AI responses.  
  - **Intelligent Doctor Routing**  
    - *Type:* LangChain Chain LLM  
    - *Role:* Uses a language model chain to route patients to the correct medical department based on AI diagnosis.  
    - *Configuration:* Prebuilt chain logic with no custom parameters shown (likely preset prompts and routing rules).  
    - *Inputs:* AI diagnosis from previous node and appointment time.  
    - *Outputs:* Feeds data into "Parse Output in our preferred structure".  
    - *Edge Cases:* Incorrect routing due to ambiguous AI output.  
  - **Parse Output in our preferred structure**  
    - *Type:* Code  
    - *Role:* Parses and restructures AI output into a structured JSON object containing patient info and diagnosis.  
    - *Configuration:* Custom JavaScript code to normalize AI response.  
    - *Inputs:* Output from "Intelligent Doctor Routing".  
    - *Outputs:* Structured data passed to "Extract Patient Info and AI Diagnosis".  
    - *Edge Cases:* Parsing errors if AI output format changes.  
  - **Extract Patient Info and AI Diagnosis**  
    - *Type:* Set  
    - *Role:* Sets or formats data fields for further processing and storage.  
    - *Configuration:* Likely maps parsed data to fixed fields for Google Sheets input.  
    - *Inputs:* Parsed structured data.  
    - *Outputs:* Passes data to "Get Present Appointments".  
    - *Edge Cases:* Missing fields or unexpected data formats.

#### 2.4 Appointment Data Management

- **Overview:**  
  Retrieves existing appointments from Google Sheets, filters out duplicates, and saves new unique appointments.

- **Nodes Involved:**  
  - Get Present Appointments  
  - Return Unique Appointments  
  - Save new appointments  

- **Node Details:**  
  - **Get Present Appointments**  
    - *Type:* Google Sheets  
    - *Role:* Reads current appointment records from a specified Google Sheet.  
    - *Configuration:* Connects to Google Sheets with appropriate credentials, reads relevant sheet/tab.  
    - *Inputs:* Output from "Extract Patient Info and AI Diagnosis".  
    - *Outputs:* Passes data to "Return Unique Appointments".  
    - *Edge Cases:* Google API quota exceeded, sheet access denied, empty or corrupted sheet.  
  - **Return Unique Appointments**  
    - *Type:* Code  
    - *Role:* Filters new appointments to exclude those which already exist in the sheet.  
    - *Configuration:* Custom JavaScript comparing new data against existing data.  
    - *Inputs:* Data from "Get Present Appointments".  
    - *Outputs:* Unique appointments passed to "Save new appointments".  
    - *Edge Cases:* Logic errors causing false duplicates or missed entries.  
  - **Save new appointments**  
    - *Type:* Google Sheets  
    - *Role:* Appends unique new appointments to the Google Sheet.  
    - *Configuration:* Write mode enabled, correct sheet and range specified.  
    - *Inputs:* Filtered unique appointments.  
    - *Outputs:* Passes data for calendar mapping.  
    - *Edge Cases:* Write permission denied, quota limits, conflicting data writes.

#### 2.5 Calendar Synchronization

- **Overview:**  
  Maps each medical department to its Google Calendar and creates appointments accordingly.

- **Nodes Involved:**  
  - Map departments with their respective calendars  
  - Create Appointment in Respective Department's calender  

- **Node Details:**  
  - **Map departments with their respective calendars**  
    - *Type:* Code  
    - *Role:* Uses custom logic to associate medical departments with specific Google Calendar IDs.  
    - *Configuration:* JavaScript code mapping department names to calendar IDs.  
    - *Inputs:* Newly saved appointment data.  
    - *Outputs:* Appointment data enriched with calendar info passed to calendar node.  
    - *Edge Cases:* Missing or incorrect calendar mappings.  
  - **Create Appointment in Respective Department's calender**  
    - *Type:* Google Calendar  
    - *Role:* Creates calendar events for patient appointments in the corresponding department's calendar.  
    - *Configuration:* Uses OAuth2 credentials, sets event details like start/end time, description, attendees, etc.  
    - *Inputs:* Appointment data with calendar mapping.  
    - *Outputs:* Final action, no further nodes.  
    - *Edge Cases:* Calendar API errors, overlapping events, permission issues.

---

### 3. Summary Table

| Node Name                                 | Node Type                             | Functional Role                                    | Input Node(s)                         | Output Node(s)                                  | Sticky Note                          |
|-------------------------------------------|-------------------------------------|--------------------------------------------------|-------------------------------------|------------------------------------------------|------------------------------------|
| Check for new patient appointment Requests| Cal.com Trigger                     | Receives new patient appointment requests via webhook | None (webhook trigger)               | Grab Appointment Time                           |                                    |
| Grab Appointment Time                      | DateTime                            | Extracts and formats appointment time             | Check for new patient appointment Requests | Intelligent Doctor Routing                      |                                    |
| AI Diagnosis                              | LangChain lmChatOpenRouter          | Performs AI symptom triage and diagnosis          | None (connected via AI Diagnosis input) | Intelligent Doctor Routing                      |                                    |
| Intelligent Doctor Routing                 | LangChain Chain LLM                 | Routes patient to correct doctor/department       | Grab Appointment Time, AI Diagnosis  | Parse Output in our preferred structure         |                                    |
| Parse Output in our preferred structure   | Code                               | Parses AI output into structured format            | Intelligent Doctor Routing            | Extract Patient Info and AI Diagnosis            |                                    |
| Extract Patient Info and AI Diagnosis      | Set                                | Sets patient info and diagnosis fields             | Parse Output in our preferred structure | Get Present Appointments                         |                                    |
| Get Present Appointments                   | Google Sheets                      | Retrieves current appointments from sheet          | Extract Patient Info and AI Diagnosis | Return Unique Appointments                        |                                    |
| Return Unique Appointments                  | Code                               | Filters out duplicate appointments                  | Get Present Appointments              | Save new appointments                            |                                    |
| Save new appointments                      | Google Sheets                      | Saves unique new appointments                        | Return Unique Appointments            | Map departments with their respective calendars |                                    |
| Map departments with their respective calendars | Code                            | Maps departments to Google Calendar IDs             | Save new appointments                | Create Appointment in Respective Department's calender |                                    |
| Create Appointment in Respective Department's calender | Google Calendar             | Creates appointment events in department calendars | Map departments with their respective calendars | None                                           |                                    |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Cal.com Trigger Node**  
   - Type: Cal.com Trigger  
   - Setup webhook to receive new patient appointment requests.  
   - Save and activate webhook to get webhook URL.  

2. **Create DateTime Node "Grab Appointment Time"**  
   - Connect input to Cal.com Trigger node.  
   - Configure to parse appointment date/time from webhook payload (adjust expression accordingly).  

3. **Create LangChain OpenRouter Chat Model Node "AI Diagnosis"**  
   - Configure with OpenAI (or compatible) credentials via LangChain integration.  
   - No special parameters needed beyond credentials.  

4. **Create LangChain Chain LLM Node "Intelligent Doctor Routing"**  
   - Connect inputs from "Grab Appointment Time" and "AI Diagnosis" nodes.  
   - Use a chain configured to route patients based on AI diagnosis.  
   - If available, import preset chain logic for doctor routing.  

5. **Create Code Node "Parse Output in our preferred structure"**  
   - Connect input from "Intelligent Doctor Routing".  
   - Write JavaScript to parse AI output JSON/text into a structured object with fields like patient name, symptoms, diagnosis, recommended department.  

6. **Create Set Node "Extract Patient Info and AI Diagnosis"**  
   - Connect input from "Parse Output in our preferred structure".  
   - Map parsed data fields to fixed variables for downstream use (e.g., patientName, diagnosis, appointmentTime).  

7. **Create Google Sheets Node "Get Present Appointments"**  
   - Configure Google Sheets credentials (OAuth2).  
   - Specify spreadsheet and worksheet containing existing appointments.  
   - Connect input from "Extract Patient Info and AI Diagnosis".  
   - Set operation to read all current appointment rows.  

8. **Create Code Node "Return Unique Appointments"**  
   - Connect input from "Get Present Appointments".  
   - Write JavaScript logic to compare incoming appointment with existing ones and filter out duplicates.  

9. **Create Google Sheets Node "Save new appointments"**  
   - Connect input from "Return Unique Appointments".  
   - Configure to append new unique appointments to the Google Sheet.  

10. **Create Code Node "Map departments with their respective calendars"**  
    - Connect input from "Save new appointments".  
    - Write JavaScript to map department names to their corresponding Google Calendar IDs.  
    - Add calendarId field to appointment data.  

11. **Create Google Calendar Node "Create Appointment in Respective Department's calender"**  
    - Connect input from previous code node.  
    - Configure Google Calendar credentials (OAuth2).  
    - Set calendar ID dynamically from mapped appointment data.  
    - Map event details: start time, end time, summary, description, attendees.  

12. **Connect all nodes as per the flow:**  
    - Cal.com Trigger → Grab Appointment Time → AI Diagnosis → Intelligent Doctor Routing → Parse Output → Extract Patient Info → Get Present Appointments → Return Unique Appointments → Save new appointments → Map departments → Create Google Calendar event.  

13. **Test the workflow with sample appointment data** to verify end-to-end functionality.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                   |
|-----------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| This workflow integrates AI-powered symptom triage with Google Sheets and Calendar for appointment handling automation. | General workflow purpose.                                                                        |
| LangChain nodes require valid OpenAI or OpenRouter API credentials to function properly.             | AI Integration requirements.                                                                    |
| Cal.com webhook must be configured and active to receive appointment requests.                       | Cal.com webhook setup documentation: https://cal.com/docs/api/webhooks                           |
| Google Sheets and Google Calendar nodes require OAuth2 credentials with appropriate scopes.          | Google API scopes: https://developers.google.com/identity/protocols/oauth2/scopes                 |
| Careful error handling recommended for webhook failures, API rate limits, and date parsing errors.  | Best practices for production workflows.                                                        |

---

**Disclaimer:** The provided text is exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.