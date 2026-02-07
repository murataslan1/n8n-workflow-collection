Automate Sprint Planning with OpenAI, Google Calendar, and Gmail for Agile Teams

https://n8nworkflows.xyz/workflows/automate-sprint-planning-with-openai--google-calendar--and-gmail-for-agile-teams-4038


# Automate Sprint Planning with OpenAI, Google Calendar, and Gmail for Agile Teams

### 1. Workflow Overview

This workflow automates the preparation and coordination of Sprint Planning sessions for Scrum Masters and Agile Coaches. It integrates Google Calendar, Google Sheets, Gmail, and OpenAI AI models to streamline backlog validation, AI-driven feedback generation, and email communications, reducing manual effort in sprint preparation for distributed teams or large backlogs.

The logic is organized into the following blocks:

- **1.1 Trigger & Initialization**: Detects when to run the workflow (manually or scheduled) and sets environment variables.
- **1.2 Sprint Planning Event Detection**: Checks Google Calendar for upcoming Sprint Planning events.
- **1.3 Backlog Retrieval and Filtering**: Loads backlog items from Google Sheets, filters for those ready for sprint planning or active in sprint.
- **1.4 Definition of Ready (DoR) Validation**: Uses AI to validate each user story against DoR criteria read from a Google Sheet, aggregates AI feedback.
- **1.5 Scrum Master Feedback Integration**: Further AI-driven feedback is added per story and merged back into the backlog.
- **1.6 Sprint Preparation Email Drafting and Approval**: AI drafts personalized emails for Scrum Master review and approval before sending to attendees.
- **1.7 Sprint Goal Suggestion Generation**: Optionally generates sprint goal suggestions for the Product Owner via AI and emails them.
- **1.8 Error Handling**: Captures and emails errors encountered during workflow execution.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Initialization

- **Overview**: Entry points for manual or scheduled execution; sets key environment variables such as event names, sheet names, and email addresses.
- **Nodes Involved**:  
  - When clicking ‘Test workflow’  
  - Schedule Trigger (disabled)  
  - Start Here: Set Environment Variables  
  - No Operation, do nothing  

- **Node Details**:

  - *When clicking ‘Test workflow’*  
    - Type: Manual Trigger  
    - Role: Allows manual start for testing or ad-hoc runs  
    - Inputs: None  
    - Outputs: Starts environment setup  
    - Edge cases: None (manual)  

  - *Schedule Trigger*  
    - Type: Schedule Trigger  
    - Role: Intended for automated weekly runs (currently disabled)  
    - Inputs: None  
    - Outputs: Initiates env setup when enabled  
    - Edge cases: Disabled; enable and configure cron schedule for production  

  - *Start Here: Set Environment Variables*  
    - Type: Set  
    - Role: Defines workflow-wide variables like calendar event names, sheet IDs, email addresses  
    - Configuration: Hardcoded or parameterized variables for environment  
    - Inputs: Manual or schedule trigger  
    - Outputs: Continues workflow execution  
    - Edge cases: Incorrect or missing variables can cause downstream failures  

  - *No Operation, do nothing*  
    - Type: NoOp  
    - Role: Placeholder / pass-through after env setup  
    - Inputs: From set node  
    - Outputs: Proceeds to calendar loading  
    - Edge cases: None  

---

#### 1.2 Sprint Planning Event Detection

- **Overview**: Loads Scrum Master’s Google Calendar, checks for upcoming Sprint Planning events, and branches logic accordingly.
- **Nodes Involved**:  
  - Load Calendar of Scrum Master  
  - Check for Upcoming Sprint Planning Project A  
  - If no event do nothing  
  - Take DoR link for further referral  
  - Take backlog link for further referral  
  - Check Open Stories in Current Sprint  

- **Node Details**:

  - *Load Calendar of Scrum Master*  
    - Type: Google Calendar  
    - Role: Fetches calendar events to find Sprint Planning sessions  
    - Configuration: Uses OAuth2 Google Calendar credentials; queries for relevant event timeframe  
    - Inputs: NoOp after env setup  
    - Outputs: Calendar events data  
    - Edge cases: API rate limits, auth errors, no events found  

  - *Check for Upcoming Sprint Planning Project A*  
    - Type: Filter  
    - Role: Filters calendar events for specific Sprint Planning event (e.g., by name/date)  
    - Inputs: Calendar events  
    - Outputs: Passes only if event exists  
    - Edge cases: No matching event leads to no-op path  

  - *If no event do nothing*  
    - Type: NoOp  
    - Role: Ends workflow early if no Sprint Planning event detected  
    - Inputs: Filter negative output  
    - Outputs: Initiates DoR link retrieval for logging/reference  
    - Edge cases: Workflow gracefully exits without error  

  - *Take DoR link for further referral*  
    - Type: Google Drive  
    - Role: Retrieves link or document of Definition of Ready criteria for reference  
    - Inputs: From no-event path  
    - Outputs: Passes link to backlog link retrieval  
    - Edge cases: Permissions errors, missing files  

  - *Take backlog link for further referral*  
    - Type: Google Drive  
    - Role: Retrieves link or document for backlog reference  
    - Inputs: From DoR link node  
    - Outputs: Passes data to open stories query  
    - Edge cases: Permissions errors  

  - *Check Open Stories in Current Sprint*  
    - Type: Google Sheets  
    - Role: Reads backlog items filtered for current sprint open stories  
    - Inputs: Backlog link data  
    - Outputs: User stories data for aggregation and feedback  
    - Edge cases: Missing or malformed sheet data, API limits  

---

#### 1.3 Backlog Retrieval and Filtering

- **Overview**: Gathers user stories from backlog and sprint, merges spill-over and ready stories, and prepares for AI validation.
- **Nodes Involved**:  
  - Wait until X days before the Sprint Planning1 (disabled)  
  - Combine Sprint Spill over with Ready for Sprint Planning  
  - Select Stories Ready for Sprint Planning from Backlog  
  - Aggregate Stories for Form Creation  
  - Create Dynamic Form  
  - Ask Scrum Master for Current Sprint Stories Check  
  - Process Feedback on Index  
  - Append Feedback to Story  
  - Keep stories that were not committed  

- **Node Details**:

  - *Wait until X days before the Sprint Planning1*  
    - Type: Wait  
    - Role: Intended delay to wait until configured days before event (disabled)  
    - Inputs: Filtered backlog stories  
    - Outputs: Proceeds to combine stories  
    - Edge cases: Disabled; enable to delay execution if needed  

  - *Combine Sprint Spill over with Ready for Sprint Planning*  
    - Type: Merge  
    - Role: Combines stories from spill-over and those marked ready for planning into one dataset  
    - Inputs: Spill over stories, ready stories from sheets  
    - Outputs: Merged list for batch processing  
    - Edge cases: Duplicates or missing data if sheets not current  

  - *Select Stories Ready for Sprint Planning from Backlog*  
    - Type: Google Sheets  
    - Role: Reads backlog items marked as “Ready for Sprint Planning”  
    - Inputs: None (triggered by previous nodes)  
    - Outputs: User stories filtered by status  
    - Edge cases: Sheet access issues, incorrect filter logic  

  - *Aggregate Stories for Form Creation*  
    - Type: Aggregate  
    - Role: Aggregates stories into a single JSON for form generation  
    - Inputs: Open stories from current sprint  
    - Outputs: Combined data for dynamic form creation  
    - Edge cases: Large data sets leading to performance delays  

  - *Create Dynamic Form*  
    - Type: Code  
    - Role: Generates a dynamic form (likely for Scrum Master feedback or confirmation) based on aggregated stories  
    - Inputs: Aggregated stories  
    - Outputs: Form data to be sent for review  
    - Edge cases: Code execution errors, malformed form structure  

  - *Ask Scrum Master for Current Sprint Stories Check*  
    - Type: Gmail  
    - Role: Sends email with form or request for Scrum Master to review current sprint stories  
    - Inputs: Form data  
    - Outputs: Awaits response for feedback processing  
    - Edge cases: Email delivery failure, no response  

  - *Process Feedback on Index*  
    - Type: SplitOut  
    - Role: Breaks down Scrum Master feedback to individual story level  
    - Inputs: Email feedback data  
    - Outputs: Individual feedback items for each story  
    - Edge cases: Parsing errors if feedback format unexpected  

  - *Append Feedback to Story*  
    - Type: Merge  
    - Role: Merges Scrum Master feedback back into each story’s data  
    - Inputs: Feedback items and original stories  
    - Outputs: Updated stories with Scrum Master comments  
    - Edge cases: Merge conflicts or missing feedback  

  - *Keep stories that were not committed*  
    - Type: Filter  
    - Role: Filters out stories that were committed to the sprint, keeping only spill-overs or uncommitted  
    - Inputs: Stories with appended feedback  
    - Outputs: Stories to be held for next planning or further action  
    - Edge cases: Incorrect filtering logic may omit important stories  

---

#### 1.4 Definition of Ready (DoR) Validation

- **Overview**: Loads DoR criteria and validates each user story against it using AI, aggregates feedback at the story level.
- **Nodes Involved**:  
  - Read DoR criteria  
  - Loop Over Items for DoR check  
  - Compare User Story to DoR Criterium  
  - OpenAI Scrum Master DoR Check  
  - Aggregate DoR check to User Story Level  
  - Add DoR feedback to User Story  

- **Node Details**:

  - *Read DoR criteria*  
    - Type: Google Sheets  
    - Role: Reads the Definition of Ready checklist or criteria from a sheet  
    - Inputs: None, triggered by batch loop  
    - Outputs: DoR criteria data for AI comparison  
    - Edge cases: Missing or outdated criteria  

  - *Loop Over Items for DoR check*  
    - Type: SplitInBatches  
    - Role: Processes user stories one-by-one or in small batches for DoR validation  
    - Inputs: User stories list  
    - Outputs: Passes each story to AI validation  
    - Edge cases: Batch size too large causing timeout  

  - *Compare User Story to DoR Criterium*  
    - Type: Langchain Agent (AI)  
    - Role: Uses AI to compare each user story against DoR criteria and generate feedback  
    - Inputs: Single story, DoR criteria  
    - Outputs: AI-generated evaluation per story item  
    - Edge cases: AI timeout, prompt failures, ambiguous input data  

  - *OpenAI Scrum Master DoR Check*  
    - Type: OpenAI Chat Completion  
    - Role: Provides AI language model backend for the Langchain agent above  
    - Inputs: Prompt with story and DoR criteria  
    - Outputs: AI textual feedback related to readiness  
    - Edge cases: API rate limits, auth errors, malformed prompts  

  - *Aggregate DoR check to User Story Level*  
    - Type: Aggregate  
    - Role: Combines multiple DoR feedback items per story into consolidated feedback  
    - Inputs: Individual AI feedback pieces  
    - Outputs: Single feedback summary per story  
    - Edge cases: Data loss or incorrect aggregation  

  - *Add DoR feedback to User Story*  
    - Type: Merge  
    - Role: Attaches aggregated DoR feedback back to each user story record  
    - Inputs: Original story data and aggregated feedback  
    - Outputs: Updated story data for further processing  
    - Edge cases: Merge failures or data mismatches  

---

#### 1.5 Scrum Master Feedback Integration

- **Overview**: Uses AI to generate additional Scrum Master feedback on stories and updates the backlog sheet with all feedback.
- **Nodes Involved**:  
  - Provide Scrum Master Feedback on the story  
  - OpenAI Scrum Master Story Feedback  
  - Update Scrum feedback in Backlog  

- **Node Details**:

  - *Provide Scrum Master Feedback on the story*  
    - Type: Langchain Agent (AI)  
    - Role: Creates tailored feedback or suggestions on each story based on combined data  
    - Inputs: Story with DoR feedback  
    - Outputs: Enhanced feedback text  
    - Edge cases: AI response errors, prompt misinterpretation  

  - *OpenAI Scrum Master Story Feedback*  
    - Type: OpenAI Chat Completion  
    - Role: Supports the AI agent with language model generation  
    - Inputs: Story and feedback prompt  
    - Outputs: AI-generated feedback text  
    - Edge cases: API limits, authentication issues  

  - *Update Scrum feedback in Backlog*  
    - Type: Google Sheets  
    - Role: Writes back all AI-generated feedback into the backlog sheet for record and visibility  
    - Inputs: Stories with appended feedback  
    - Outputs: Sheet update confirmation  
    - Edge cases: API limits, write conflicts, partial updates  

---

#### 1.6 Sprint Preparation Email Drafting and Approval

- **Overview**: Combines all stories into email drafts, sends draft to Scrum Master for approval, then emails final content to attendees or saves drafts.
- **Nodes Involved**:  
  - Combine stories into one list  
  - Draft Email for Sprint Planning  
  - OpenAI Scrum Master Emailer  
  - Ask Approval to Scrum Master  
  - If Email content is Approved  
  - Send Email to Attendees  
  - Create Draft in Scrum Master Email  
  - Make aware the draft is ready to be adjusted manually  

- **Node Details**:

  - *Combine stories into one list*  
    - Type: Aggregate  
    - Role: Combines all validated and feedback-enriched stories into a unified list for email content generation  
    - Inputs: Stories with feedback  
    - Outputs: Single dataset for drafting emails  
    - Edge cases: Large payload causing delays  

  - *Draft Email for Sprint Planning*  
    - Type: Langchain Agent (AI)  
    - Role: Generates a personalized email draft summarizing backlog items and feedback for the team  
    - Inputs: Combined stories list  
    - Outputs: Email content draft  
    - Edge cases: AI generation errors, unclear drafts  

  - *OpenAI Scrum Master Emailer*  
    - Type: OpenAI Chat Completion  
    - Role: Provides language model backend for email drafting  
    - Inputs: Prompt with stories and context  
    - Outputs: Draft email text  
    - Edge cases: API failures, rate limits  

  - *Ask Approval to Scrum Master*  
    - Type: Gmail  
    - Role: Sends the drafted email to Scrum Master for review and approval before sending to the team  
    - Inputs: Draft email content  
    - Outputs: Waits for approval response  
    - Edge cases: Email delivery or response delays  

  - *If Email content is Approved*  
    - Type: If  
    - Role: Branches workflow based on Scrum Master approval  
    - Inputs: Approval status  
    - Outputs: Sends email to attendees or creates editable draft  

  - *Send Email to Attendees*  
    - Type: Gmail  
    - Role: Sends final approved email to team members involved in Sprint Planning  
    - Inputs: Approved email content  
    - Outputs: Confirmation of send  
    - Edge cases: Delivery failures, invalid recipient addresses  

  - *Create Draft in Scrum Master Email*  
    - Type: Gmail  
    - Role: Creates a draft email in Scrum Master’s Gmail for manual final edits if not approved automatically  
    - Inputs: Email draft content  
    - Outputs: Draft email saved in Gmail  
    - Edge cases: Gmail API errors  

  - *Make aware the draft is ready to be adjusted manually*  
    - Type: Gmail  
    - Role: Sends notification to Scrum Master that draft is ready for manual review and sending  
    - Inputs: After draft creation  
    - Outputs: Notification email  
    - Edge cases: Email failures  

---

#### 1.7 Sprint Goal Suggestion Generation

- **Overview**: Generates AI-based sprint goal suggestions for the Product Owner and sends an email with these suggestions.
- **Nodes Involved**:  
  - Draft Email for Sprint Goal Suggestions  
  - OpenAI Sprint Goal Email Agent  
  - Send Email to PO  

- **Node Details**:

  - *Draft Email for Sprint Goal Suggestions*  
    - Type: Langchain Agent (AI)  
    - Role: Drafts email content suggesting sprint goals based on backlog and sprint context  
    - Inputs: Combined stories or sprint context  
    - Outputs: Sprint goal suggestion email draft  
    - Edge cases: AI generation failures  

  - *OpenAI Sprint Goal Email Agent*  
    - Type: OpenAI Chat Completion  
    - Role: Language model supporting the goal suggestion generation  
    - Inputs: Prompt with sprint context  
    - Outputs: Text for suggestion email  
    - Edge cases: API errors  

  - *Send Email to PO*  
    - Type: Gmail  
    - Role: Sends sprint goal suggestions to Product Owner’s email  
    - Inputs: Draft email content  
    - Outputs: Confirmation of send  
    - Edge cases: Delivery failure, wrong recipient address  

---

#### 1.8 Error Handling

- **Overview**: Captures workflow errors and notifies the responsible parties via email.
- **Nodes Involved**:  
  - Error Trigger  
  - Send Error Email  

- **Node Details**:

  - *Error Trigger*  
    - Type: Error Trigger  
    - Role: Listens for any errors in workflow execution  
    - Inputs: Workflow error events  
    - Outputs: Triggers notification email  
    - Edge cases: None  

  - *Send Error Email*  
    - Type: Gmail  
    - Role: Sends email detailing the error encountered for immediate attention  
    - Inputs: Error details  
    - Outputs: Error notification sent  
    - Edge cases: Email delivery failure  

---

### 3. Summary Table

| Node Name                            | Node Type                    | Functional Role                                 | Input Node(s)                            | Output Node(s)                           | Sticky Note                               |
|------------------------------------|------------------------------|------------------------------------------------|-----------------------------------------|------------------------------------------|-------------------------------------------|
| When clicking ‘Test workflow’       | Manual Trigger               | Manual start trigger                            | None                                    | Start Here: Set Environment Variables    |                                           |
| Schedule Trigger                    | Schedule Trigger             | Scheduled run trigger (disabled)                | None                                    | Start Here: Set Environment Variables    |                                           |
| Start Here: Set Environment Variables | Set                         | Defines env variables                            | When clicking ‘Test workflow’, Schedule Trigger | No Operation, do nothing                  |                                           |
| No Operation, do nothing            | NoOp                        | Placeholder after env setup                      | Start Here: Set Environment Variables    | Load Calendar of Scrum Master             |                                           |
| Load Calendar of Scrum Master       | Google Calendar             | Loads calendar events                            | No Operation, do nothing                 | Check for Upcoming Sprint Planning Project A |                                           |
| Check for Upcoming Sprint Planning Project A | Filter                    | Filters for Sprint Planning event                | Load Calendar of Scrum Master            | If no event do nothing                     |                                           |
| If no event do nothing              | NoOp                        | Ends workflow early if no event                  | Check for Upcoming Sprint Planning Project A | Take DoR link for further referral        |                                           |
| Take DoR link for further referral  | Google Drive                | Retrieves DoR criteria document                   | If no event do nothing                    | Take backlog link for further referral     |                                           |
| Take backlog link for further referral | Google Drive                | Retrieves backlog document                        | Take DoR link for further referral       | Check Open Stories in Current Sprint       |                                           |
| Check Open Stories in Current Sprint | Google Sheets               | Reads open stories in current sprint             | Take backlog link for further referral   | Aggregate Stories for Form Creation, Append Feedback to Story |                                           |
| Aggregate Stories for Form Creation | Aggregate                   | Aggregates stories for form creation             | Check Open Stories in Current Sprint      | Create Dynamic Form                        |                                           |
| Create Dynamic Form                 | Code                        | Generates dynamic form for Scrum Master review  | Aggregate Stories for Form Creation       | Ask Scrum Master for Current Sprint Stories Check |                                           |
| Ask Scrum Master for Current Sprint Stories Check | Gmail                       | Sends email to Scrum Master for feedback         | Create Dynamic Form                       | Process Feedback on Index                  |                                           |
| Process Feedback on Index           | SplitOut                    | Splits Scrum Master feedback per story          | Ask Scrum Master for Current Sprint Stories Check | Append Feedback to Story                   |                                           |
| Append Feedback to Story            | Merge                       | Merges Scrum Master feedback into stories       | Process Feedback on Index                 | Keep stories that were not committed       |                                           |
| Keep stories that were not committed | Filter                      | Filters out committed stories                     | Append Feedback to Story                  | Wait until X days before the Sprint Planning1 |                                           |
| Wait until X days before the Sprint Planning1 | Wait                        | Waits configured days before event (disabled)   | Keep stories that were not committed      | Combine Sprint Spill over with Ready for Sprint Planning |                                           |
| Combine Sprint Spill over with Ready for Sprint Planning | Merge                       | Combines spill-over and ready stories            | Wait until X days before the Sprint Planning1, Select Stories Ready for Sprint Planning from Backlog | Loop Over Items for DoR check, Append Stories with DoR feedback |                                           |
| Select Stories Ready for Sprint Planning from Backlog | Google Sheets               | Reads backlog stories marked ready for planning | None                                    | Combine Sprint Spill over with Ready for Sprint Planning |                                           |
| Loop Over Items for DoR check       | SplitInBatches              | Processes each story for DoR validation          | Update Scrum feedback in Backlog          | Read DoR criteria, Append Stories with DoR feedback |                                           |
| Read DoR criteria                   | Google Sheets               | Reads Definition of Ready criteria                | Loop Over Items for DoR check              | Compare User Story to DoR Criterium        |                                           |
| Compare User Story to DoR Criterium | Langchain Agent             | AI compares story to DoR criteria                 | Read DoR criteria                         | Aggregate DoR check to User Story Level    |                                           |
| OpenAI Scrum Master DoR Check       | OpenAI Chat Completion      | AI language model for DoR check                    | Compare User Story to DoR Criterium       | Compare User Story to DoR Criterium        |                                           |
| Aggregate DoR check to User Story Level | Aggregate                   | Aggregates AI DoR feedback per story              | Compare User Story to DoR Criterium       | Add DoR feedback to User Story              |                                           |
| Add DoR feedback to User Story      | Merge                       | Adds aggregated DoR feedback to story             | Aggregate DoR check to User Story Level   | Provide Scrum Master Feedback on the story |                                           |
| Provide Scrum Master Feedback on the story | Langchain Agent             | AI generates Scrum Master feedback per story     | Add DoR feedback to User Story            | Update Scrum feedback in Backlog            |                                           |
| OpenAI Scrum Master Story Feedback  | OpenAI Chat Completion      | AI language model for Scrum Master feedback       | Provide Scrum Master Feedback on the story | Provide Scrum Master Feedback on the story |                                           |
| Update Scrum feedback in Backlog    | Google Sheets               | Updates backlog sheet with AI feedback             | Provide Scrum Master Feedback on the story | Loop Over Items for DoR check                |                                           |
| Append Stories with DoR feedback    | Merge                       | Merges DoR feedback with stories                   | Loop Over Items for DoR check              | Combine stories into one list                |                                           |
| Combine stories into one list        | Aggregate                   | Combines all stories with feedback for emails     | Append Stories with DoR feedback           | Draft Email for Sprint Planning, Draft Email for Sprint Goal Suggestions |                                           |
| Draft Email for Sprint Planning      | Langchain Agent             | AI drafts personalized email for sprint planning  | Combine stories into one list              | Ask Approval to Scrum Master                  |                                           |
| OpenAI Scrum Master Emailer          | OpenAI Chat Completion      | Language model for email drafting                   | Draft Email for Sprint Planning            | Draft Email for Sprint Planning               |                                           |
| Ask Approval to Scrum Master         | Gmail                       | Sends draft email to Scrum Master for approval     | Draft Email for Sprint Planning            | If Email content is Approved                   |                                           |
| If Email content is Approved         | If                          | Branches based on Scrum Master email approval      | Ask Approval to Scrum Master                | Send Email to Attendees, Create Draft in Scrum Master Email |                                           |
| Send Email to Attendees              | Gmail                       | Sends approved email to sprint attendees            | If Email content is Approved                | None                                         |                                           |
| Create Draft in Scrum Master Email  | Gmail                       | Saves email draft for manual adjustment             | If Email content is Approved                | Make aware the draft is ready to be adjusted manually |                                           |
| Make aware the draft is ready to be adjusted manually | Gmail                       | Notifies Scrum Master draft is ready for review    | Create Draft in Scrum Master Email          | None                                         |                                           |
| Draft Email for Sprint Goal Suggestions | Langchain Agent             | AI drafts sprint goal suggestion email for PO      | Combine stories into one list               | Send Email to PO                              |                                           |
| OpenAI Sprint Goal Email Agent       | OpenAI Chat Completion      | Language model for sprint goal suggestion           | Draft Email for Sprint Goal Suggestions      | Draft Email for Sprint Goal Suggestions        |                                           |
| Send Email to PO                    | Gmail                       | Sends sprint goal suggestion email to Product Owner | Draft Email for Sprint Goal Suggestions      | None                                         |                                           |
| Error Trigger                      | Error Trigger               | Catches workflow errors                             | Workflow error events                       | Send Error Email                              |                                           |
| Send Error Email                    | Gmail                       | Sends error notification email                      | Error Trigger                               | None                                         |                                           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes**  
   - Add a **Manual Trigger** node named “When clicking ‘Test workflow’”.  
   - Add a **Schedule Trigger** node named “Schedule Trigger”, disable it initially.

2. **Set Environment Variables**  
   - Add a **Set** node named “Start Here: Set Environment Variables”.  
   - Define variables for:  
     - Google Calendar event names (e.g., “Sprint Planning”)  
     - Google Sheets IDs for backlog and DoR criteria  
     - Email addresses for Scrum Master and Product Owner  
   - Connect both triggers to this node.

3. **No Operation Placeholder**  
   - Add a **NoOp** node named “No Operation, do nothing”.  
   - Connect “Start Here” node output to this node.

4. **Load Calendar Events**  
   - Add a **Google Calendar** node named “Load Calendar of Scrum Master”.  
   - Configure with OAuth2 Google credentials linked to Scrum Master’s calendar.  
   - Set to fetch events for the upcoming sprint planning period.  
   - Connect from the NoOp node.

5. **Filter for Sprint Planning Event**  
   - Add a **Filter** node named “Check for Upcoming Sprint Planning Project A”.  
   - Configure filter to check for events matching the Sprint Planning event name and date range.  
   - Connect from Google Calendar node.

6. **No Event Path**  
   - Add a **NoOp** node named “If no event do nothing”.  
   - Connect the “false” output of the filter to this node.

7. **Retrieve DoR and Backlog Links**  
   - Add two **Google Drive** nodes: “Take DoR link for further referral” and “Take backlog link for further referral”.  
   - Configure to retrieve links or access to DoR and backlog documents.  
   - Connect:  
     - No event node → Take DoR link → Take backlog link

8. **Read Open Stories from Backlog**  
   - Add a **Google Sheets** node named “Check Open Stories in Current Sprint”.  
   - Configure to read backlog sheet filtering stories active in current sprint.  
   - Connect from “Take backlog link for further referral”.

9. **Aggregate Stories for Form Creation**  
   - Add an **Aggregate** node named “Aggregate Stories for Form Creation”.  
   - Configure to combine all open stories into one object.  
   - Connect from “Check Open Stories in Current Sprint”.

10. **Create Dynamic Form**  
    - Add a **Code** node named “Create Dynamic Form”.  
    - Write code to generate a form structure for Scrum Master review based on aggregated stories.  
    - Connect from aggregate node.

11. **Send Email for Scrum Master Feedback**  
    - Add a **Gmail** node named “Ask Scrum Master for Current Sprint Stories Check”.  
    - Configure with OAuth2 Gmail credentials for Scrum Master.  
    - Compose email including the dynamic form or feedback request.  
    - Connect from Code node.

12. **Process Feedback**  
    - Add a **SplitOut** node named “Process Feedback on Index” to break feedback into individual story comments.  
    - Connect from “Ask Scrum Master for Current Sprint Stories Check”.

13. **Append Feedback to Stories**  
    - Add a **Merge** node named “Append Feedback to Story”.  
    - Merge feedback with original story data.  
    - Connect from “Process Feedback on Index” and backlogged stories.

14. **Filter Uncommitted Stories**  
    - Add a **Filter** node named “Keep stories that were not committed”.  
    - Configure to exclude stories marked as committed in sprint.  
    - Connect from “Append Feedback to Story”.

15. **Wait Node (Optional)**  
    - Add a **Wait** node named “Wait until X days before the Sprint Planning1” (disabled by default).  
    - Configure delay period before sprint planning event.  
    - Connect from filter node.

16. **Combine Spill-over and Ready Stories**  
    - Add a **Merge** node named “Combine Sprint Spill over with Ready for Sprint Planning”.  
    - Connect from Wait node and another Google Sheets node reading “Select Stories Ready for Sprint Planning from Backlog” (which reads backlog items with status “Ready for Sprint Planning”).  
    - Configure to combine story lists.

17. **Loop Over Stories for DoR Validation**  
    - Add a **SplitInBatches** node named “Loop Over Items for DoR check” for batch processing stories.  
    - Connect from merge node.

18. **Read DoR Criteria**  
    - Add a **Google Sheets** node named “Read DoR criteria”.  
    - Configure to read DoR checklist.  
    - Connect from batch loop node (for each batch).

19. **AI DoR Validation**  
    - Add a **Langchain Agent** node named “Compare User Story to DoR Criterium” linked to an **OpenAI Chat Completion** node named “OpenAI Scrum Master DoR Check”.  
    - Configure Langchain agent with prompt to compare story to DoR criteria and provide feedback.  
    - Connect Google Sheets DoR criteria to Langchain agent, batch stories as input.

20. **Aggregate DoR Feedback**  
    - Add an **Aggregate** node named “Aggregate DoR check to User Story Level”.  
    - Combine AI output feedback per story.  
    - Connect from Langchain agent.

21. **Merge Feedback into Stories**  
    - Add a **Merge** node named “Add DoR feedback to User Story”.  
    - Connect aggregated feedback and original story data.

22. **AI Scrum Master Story Feedback**  
    - Add a **Langchain Agent** node named “Provide Scrum Master Feedback on the story” linked with an **OpenAI Chat Completion** node named “OpenAI Scrum Master Story Feedback”.  
    - Configure to provide additional AI feedback based on DoR feedback.  
    - Connect merged story data.

23. **Update Backlog Sheet**  
    - Add a **Google Sheets** node named “Update Scrum feedback in Backlog”.  
    - Configure to write AI feedback back into backlog sheet.  
    - Connect from AI feedback node.

24. **Merge Stories with Feedback**  
    - Add a **Merge** node named “Append Stories with DoR feedback”.  
    - Connect from “Loop Over Items for DoR check” and updated backlog data.

25. **Combine All Stories**  
    - Add an **Aggregate** node named “Combine stories into one list”.  
    - Connect from “Append Stories with DoR feedback”.

26. **Draft Sprint Planning Email**  
    - Add a **Langchain Agent** node named “Draft Email for Sprint Planning” linked with **OpenAI Chat Completion** node “OpenAI Scrum Master Emailer”.  
    - Configure prompt to draft personalized email with backlog stories and feedback.  
    - Connect from combined stories aggregate.

27. **Ask Scrum Master for Email Approval**  
    - Add a **Gmail** node named “Ask Approval to Scrum Master”.  
    - Configure to send drafted email to Scrum Master for review.  
    - Connect from email draft node.

28. **Conditional Branch for Approval**  
    - Add an **If** node named “If Email content is Approved”.  
    - Configure to check approval response (e.g., via email reply webhook or manual trigger).  
    - Connect from Gmail approval node.

29. **Send Final Email or Save Draft**  
    - Add two **Gmail** nodes named “Send Email to Attendees” and “Create Draft in Scrum Master Email”.  
    - Connect “true” branch of approval if node to “Send Email to Attendees”.  
    - Connect “false” branch to “Create Draft in Scrum Master Email”.

30. **Notify Draft Ready for Manual Adjustment**  
    - Add a **Gmail** node named “Make aware the draft is ready to be adjusted manually”.  
    - Connect from “Create Draft in Scrum Master Email”.

31. **Draft Sprint Goal Suggestions Email**  
    - Add a **Langchain Agent** node named “Draft Email for Sprint Goal Suggestions” linked with **OpenAI Chat Completion** node “OpenAI Sprint Goal Email Agent”.  
    - Connect from combined stories aggregate.

32. **Send Sprint Goal Email to Product Owner**  
    - Add a **Gmail** node named “Send Email to PO”.  
    - Configure to send sprint goal suggestions to Product Owner email.  
    - Connect from draft sprint goal email node.

33. **Error Handling**  
    - Add an **Error Trigger** node named “Error Trigger”.  
    - Add a **Gmail** node named “Send Error Email” configured to notify admin or Scrum Master on errors.  
    - Connect error trigger to Gmail node.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                  |
|-------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| Workflow validated by a Scrum Master with 10+ years of experience, ensuring practical relevance. | Workflow description                                             |
| AI-driven backlog validation and email drafting streamline sprint planning preparation.          | Workflow USPs                                                   |
| Setup requires connecting Google Calendar, Sheets, Gmail, and OpenAI credentials with OAuth2.   | Setup instructions                                              |
| Customizable for Jira or other backlog tools by swapping Google Sheets nodes accordingly.       | Customization tips                                              |
| Clear separation of manual approval steps enhances control and prevents premature emails.       | Email approval process                                          |
| Refer to n8n documentation for OAuth2 credential setup for Google and Gmail integrations.       | https://docs.n8n.io/integrations/builtin/google-calendar/       |
| Langchain agent nodes leverage OpenAI API; ensure API quota and token limits are respected.     | OpenAI API best practices                                       |

---

This detailed analysis and stepwise reproduction guide provides a clear understanding of the workflow’s architecture, enabling advanced users or AI systems to reproduce, modify, or troubleshoot the Sprint Planning automation workflow effectively.