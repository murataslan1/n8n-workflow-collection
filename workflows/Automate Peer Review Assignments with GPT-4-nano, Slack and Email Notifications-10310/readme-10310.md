Automate Peer Review Assignments with GPT-4-nano, Slack and Email Notifications

https://n8nworkflows.xyz/workflows/automate-peer-review-assignments-with-gpt-4-nano--slack-and-email-notifications-10310


# Automate Peer Review Assignments with GPT-4-nano, Slack and Email Notifications

---

### 1. Workflow Overview

This workflow automates the peer review assignment process for educational or training contexts by leveraging AI-driven rubric generation, peer assignment distribution, notification via Slack and email, scoring, final report generation, and analytics posting. It is designed primarily for educators or administrators who manage collaborative assessments, enabling consistent, fair, and efficient peer review cycles with minimal manual intervention.

The workflow is logically divided into the following functional blocks:

- **1.1 Input Reception and Storage:** Accepts assignment submissions via a webhook and stores them for processing.
- **1.2 Peer Assignment Distribution:** Assigns each submission to a fixed number of peer reviewers using a round-robin algorithm.
- **1.3 AI-Powered Rubric Generation:** Uses GPT-4-nano to generate a detailed peer review rubric tailored to each assignment.
- **1.4 Notifications and Communication:** Sends Slack notifications and emails to assigned reviewers with rubric and assignment details.
- **1.5 Response Preparation and Scoring:** Prepares data for response, calculates peer scores (simulated here), and stores results in a database.
- **1.6 Completion Check and Final Reporting:** Checks if all required reviews are completed for each assignment, generates a comprehensive final report using AI, and emails it to the student.
- **1.7 Dashboard Update and Analytics:** Updates an external dashboard with metrics and posts aggregated analytics reports to Slack.
- **1.8 Workflow Response:** Sends a confirmation response to the original webhook caller confirming successful assignment distribution.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Storage

**Overview:**  
Receives assignment submissions through a webhook POST request and stores the assignment data in workflow variables for subsequent processing.

**Nodes Involved:**  
- Webhook - Submit Assignment  
- Store Assignment Data

**Node Details:**  

- **Webhook - Submit Assignment**  
  - Type: Webhook  
  - Role: Entry point; receives HTTP POST requests at path `/peer-assessment`.  
  - Configuration: Responds immediately with data from downstream nodes.  
  - Inputs: External HTTP request.  
  - Outputs: JSON payload of submitted assignment (expected fields: studentId, studentName, email, assignmentId, assignmentTitle, submissionUrl, dueDate).  
  - Edge Cases: Missing or malformed payload, HTTP method other than POST.  

- **Store Assignment Data**  
  - Type: Set node  
  - Role: Stores assignment data in an internal structured format keyed by studentId.  
  - Configuration: Creates an object with an `assignments` array containing `{id: studentId, value: entire assignment JSON}`.  
  - Inputs: Output of webhook node.  
  - Outputs: Structured assignments array for downstream iteration.  
  - Edge Cases: Empty or duplicated studentId, missing fields.

---

#### 1.2 Peer Assignment Distribution

**Overview:**  
Assigns peer reviewers to each submitted assignment in a round-robin fashion, distributing 3 peer reviewers per assignment.

**Nodes Involved:**  
- Distribute Peer Assignments

**Node Details:**  

- **Distribute Peer Assignments**  
  - Type: Code node (JavaScript)  
  - Role: Implements logic to assign 3 peer reviewers to each student’s assignment by cycling through the list of assignments.  
  - Configuration:  
    - Loops over all assignments.  
    - For each assignment, selects the next 3 students (modulo total count) as reviewers.  
    - Constructs a new object containing assignment details plus the assigned reviewers and due date.  
  - Inputs: Array of assignments from Store Assignment Data.  
  - Outputs: Array with peer assignment details for each student.  
  - Edge Cases: Fewer than 4 assignments (reviewers may include the submitter), missing studentId or email fields.

---

#### 1.3 AI-Powered Rubric Generation

**Overview:**  
Generates a detailed rubric for peer review using GPT-4-nano, tailoring evaluation criteria to each assignment.

**Nodes Involved:**  
- OpenAI Model  
- Generate Review Rubric  
- Structure Parser

**Node Details:**  

- **Generate Review Rubric**  
  - Type: Langchain Agent  
  - Role: Sends a prompt to GPT-4-nano to generate a comprehensive peer review rubric with specified criteria and guidelines.  
  - Configuration:  
    - System message sets role as expert engineering educator.  
    - Prompt includes assignment title, student name, and submission URL.  
    - Requests structured output with evaluation guidelines, examples, key questions.  
  - Inputs: Peer assignment details from Distribute Peer Assignments.  
  - Outputs: AI-generated rubric text.  
  - Edge Cases: API connectivity, rate limits, prompt failures, ambiguous input data.  
  - Credentials: OpenAI API key required.

- **OpenAI Model**  
  - Type: Langchain LM Chat OpenAI  
  - Role: Underlying model node executing the GPT-4.1-nano call for the agent.  
  - Configuration: Model set to "gpt-4.1-nano".  
  - Inputs: From Generate Review Rubric agent.  
  - Outputs: Raw AI response.  
  - Credentials: OpenAI API.

- **Structure Parser**  
  - Type: Langchain Output Parser Structured  
  - Role: Parses the AI response into structured JSON to be used in later steps.  
  - Inputs: Output from OpenAI Model.  
  - Outputs: Parsed structured rubric.  
  - Edge Cases: Parsing failures due to unexpected AI output format.

---

#### 1.4 Notifications and Communication

**Overview:**  
Sends notifications to Slack channel and emails to assigned peer reviewers containing assignment details and the generated rubric.

**Nodes Involved:**  
- Notify on Slack  
- Email Reviewers

**Node Details:**  

- **Notify on Slack**  
  - Type: Slack node  
  - Role: Posts a formatted message in a Slack channel notifying about new peer review assignments.  
  - Configuration:  
    - Includes student name, assignment title, due date, list of assigned reviewers, submission URL, and confirmation of rubric generation.  
    - Authenticated via OAuth2 with Slack credentials.  
    - Channel hardcoded to a specific channel ID (e.g., "C12345678").  
  - Inputs: Peer assignment data with rubric from Generate Review Rubric.  
  - Outputs: Slack message confirmation.  
  - Edge Cases: Slack API failures, channel permission issues.

- **Email Reviewers**  
  - Type: Email Send  
  - Role: Sends HTML-formatted email to all assigned reviewers for a given assignment.  
  - Configuration:  
    - Subject includes assignment title.  
    - Email body includes assignment details, submission link, and the generated rubric text.  
    - Recipients set by reviewer emails extracted from peer assignments.  
    - From email is a fixed noreply address.  
  - Inputs: Peer assignment data with rubric.  
  - Outputs: Email send confirmation.  
  - Edge Cases: Invalid or missing email addresses, SMTP failures, formatting errors.

---

#### 1.5 Response Preparation and Scoring

**Overview:**  
Prepares response data for output and simulates peer review scoring with random scores, then stores results in a PostgreSQL database.

**Nodes Involved:**  
- Prepare Response Data  
- Calculate Peer Score  
- Store Review Results

**Node Details:**  

- **Prepare Response Data**  
  - Type: Set node  
  - Role: Prepares structured JSON output containing assignment ID, student info, rubric, reviewers, status, timestamp, and due date for response and further processing.  
  - Inputs: Output of Email Reviewers.  
  - Outputs: Prepared data object.  
  - Edge Cases: Missing fields or empty reviewer lists.

- **Calculate Peer Score**  
  - Type: Code node (run once per item)  
  - Role: Simulates peer review scoring by assigning random scores within defined ranges for rubric criteria, calculates total score and letter grade.  
  - Inputs: Prepared review data per reviewer.  
  - Outputs: Review data with scores, total score, grade, and evaluation timestamp.  
  - Edge Cases: Randomness may not represent real data; in production, replace with actual review input.

- **Store Review Results**  
  - Type: PostgreSQL node  
  - Role: Inserts review results into the `peer_reviews` table with columns for grade, scores (JSON string), studentId, reviewerId, totalScore, evaluatedAt timestamp, and assignmentId.  
  - Inputs: Output of Calculate Peer Score.  
  - Outputs: Database insert confirmation.  
  - Configuration: Requires database credentials with write access.  
  - Edge Cases: DB connection failures, data type mismatches, duplicates.

---

#### 1.6 Completion Check and Final Reporting

**Overview:**  
Checks if the expected number of peer reviews per assignment is completed; if so, generates a final AI-written report and emails it to the student.

**Nodes Involved:**  
- Check Completion Status  
- Generate Final Report  
- OpenAI Model 2  
- Structure Parser 2  
- Email Final Report

**Node Details:**  

- **Check Completion Status**  
  - Type: Code node  
  - Role: Groups all reviews by assignmentId; verifies if at least 3 reviews completed; calculates average score and final grade.  
  - Inputs: All review records from Store Review Results.  
  - Outputs: Array of completed assignments with summary data.  
  - Edge Cases: Partial review sets, missing or inconsistent data.

- **Generate Final Report**  
  - Type: Langchain Agent  
  - Role: Sends prompt to GPT-4-nano to produce a detailed final assessment report including executive summary, strengths, improvements, recommendations, class comparison, and next steps.  
  - Configuration:  
    - System message defines the AI as an experienced engineering educator.  
    - Input includes assignment ID, completed review count, average score, and final grade.  
  - Inputs: Completion summary from Check Completion Status.  
  - Outputs: AI-generated final report text.  
  - Edge Cases: API errors, prompt misinterpretation.

- **OpenAI Model 2**  
  - Same as OpenAI Model, used here for final report generation.

- **Structure Parser 2**  
  - Parses AI final report to structured JSON format with sections like executiveSummary, strengths, improvements, recommendations, classComparison, nextSteps.

- **Email Final Report**  
  - Type: Email Send  
  - Role: Emails the final grade and report summary to the student’s email address extracted from peer assignments.  
  - Configuration:  
    - Subject references assignment ID.  
    - HTML body includes final grade, average score, parsed report, and count of completed reviewers.  
    - From email is noreply address.  
  - Inputs: Parsed final report and completion data.  
  - Edge Cases: Email delivery failures, missing student email.

---

#### 1.7 Dashboard Update and Analytics

**Overview:**  
Posts final grading metrics to an external dashboard and generates aggregated class analytics which are posted to Slack.

**Nodes Involved:**  
- Update Dashboard Metrics  
- Analytics Report  
- Post Analytics to Slack

**Node Details:**  

- **Update Dashboard Metrics**  
  - Type: HTTP Request  
  - Role: Sends POST requests to a university dashboard API with assignment ID, average score, grade, and timestamp.  
  - Configuration:  
    - Authenticated with generic HTTP header credentials.  
    - JSON body with metrics.  
  - Inputs: Final report completion data.  
  - Outputs: API response.  
  - Edge Cases: API unavailability, authentication errors.

- **Analytics Report**  
  - Type: Code node  
  - Role: Aggregates completed reviews to compute total assignments, class average score, grade distribution, and generation timestamp.  
  - Inputs: Final report completion data.  
  - Outputs: Analytics summary object.  
  - Edge Cases: Empty data sets.

- **Post Analytics to Slack**  
  - Type: Slack node  
  - Role: Posts an analytics summary message to a Slack channel including total assignments completed, class average, and grade distribution.  
  - Configuration: OAuth2 Slack authentication, channel ID same as earlier.  
  - Inputs: Analytics summary.  
  - Outputs: Slack message confirmation.  
  - Edge Cases: Slack API errors.

---

#### 1.8 Workflow Response

**Overview:**  
Sends a JSON response back to the webhook caller confirming the successful distribution of peer review assignments.

**Nodes Involved:**  
- Respond to Webhook

**Node Details:**  

- **Respond to Webhook**  
  - Type: Respond to Webhook  
  - Role: Final step responding to the initial HTTP request with a JSON object summarizing success status, assignment ID, student name, number of reviewers assigned, rubric generation flag, and status.  
  - Inputs: Prepared response data.  
  - Outputs: HTTP response.  
  - Edge Cases: Execution failure, malformed response.

---

### 3. Summary Table

| Node Name               | Node Type                                 | Functional Role                       | Input Node(s)              | Output Node(s)                       | Sticky Note                                                                                                                                                                                                                                                                                                                                                                   |
|-------------------------|-------------------------------------------|------------------------------------|----------------------------|------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Webhook - Submit Assignment | Webhook                                    | Receive assignment submissions     | External HTTP POST          | Store Assignment Data               | ## Introduction Automate peer review assignment and grading with AI-powered evaluation. Designed for educators managing collaborative assessments efficiently. ## How It Works Webhook receives assignments, distributes them, AI generates review rubrics, emails reviewers, collects responses, calculates scores, stores results, emails reports, updates dashboard, and posts analytics to Slack. |
| Store Assignment Data    | Set                                       | Store assignment data               | Webhook - Submit Assignment | Distribute Peer Assignments         | See note on Webhook - Submit Assignment                                                                                                                                                                                                                                                                                                                                      |
| Distribute Peer Assignments | Code                                      | Assign peer reviewers               | Store Assignment Data       | Generate Review Rubric              | ## Prerequisites - OpenAI API key - Gmail account - Slack workspace - Database or storage system - Dashboard tool ## Use Cases - University peer review assignments - Corporate training evaluations - Research paper assessments ## Customization - Multi-round review cycles - Custom scoring algorithms ## Benefits - Eliminates manual distribution - Ensures consistent evaluation |
| Generate Review Rubric   | Langchain Agent                           | Generate AI peer review rubric     | Distribute Peer Assignments  | Notify on Slack, Email Reviewers    | See note on Distribute Peer Assignments                                                                                                                                                                                                                                                                                                                                      |
| OpenAI Model             | Langchain LM Chat OpenAI                  | AI model call for rubric generation| Generate Review Rubric       | Structure Parser                   | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Structure Parser        | Langchain Output Parser Structured         | Parse AI rubric output             | OpenAI Model                | Generate Review Rubric             | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Notify on Slack          | Slack                                     | Notify Slack channel about assignment| Generate Review Rubric       | Email Reviewers                    | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Email Reviewers          | Email Send                                | Email peer reviewers               | Notify on Slack             | Prepare Response Data, Calculate Peer Score | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Prepare Response Data    | Set                                       | Prepare data for response and scoring| Email Reviewers             | Respond to Webhook, Calculate Peer Score | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Calculate Peer Score     | Code (runOnceForEachItem)                  | Simulate peer scoring              | Prepare Response Data       | Store Review Results               | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Store Review Results     | PostgreSQL                                | Store review results in DB         | Calculate Peer Score        | Check Completion Status            | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Check Completion Status  | Code                                      | Check if peer reviews complete     | Store Review Results        | Generate Final Report              | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Generate Final Report    | Langchain Agent                           | Generate final assessment report   | Check Completion Status     | Email Final Report, Update Dashboard Metrics, Analytics Report | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| OpenAI Model 2           | Langchain LM Chat OpenAI                  | AI model call for final report     | Generate Final Report       | Structure Parser 2                | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Structure Parser 2       | Langchain Output Parser Structured         | Parse final report output          | OpenAI Model 2              | Generate Final Report             | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Email Final Report       | Email Send                                | Email final report to student      | Generate Final Report       | Update Dashboard Metrics          | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Update Dashboard Metrics | HTTP Request                              | Update external dashboard metrics  | Generate Final Report       | Analytics Report                  | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Analytics Report        | Code                                      | Aggregate analytics summary        | Generate Final Report       | Post Analytics to Slack           | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Post Analytics to Slack  | Slack                                     | Post analytics report to Slack     | Analytics Report            | -                                | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Respond to Webhook       | Respond to Webhook                        | Respond to initial webhook caller  | Prepare Response Data       | -                                | See note on Generate Review Rubric                                                                                                                                                                                                                                                                                                                                            |
| Sticky Note              | Sticky Note                              | Documentation and introduction     | -                          | -                                | ## Introduction Automate peer review assignment and grading with AI-powered evaluation. Designed for educators managing collaborative assessments efficiently. ## How It Works Webhook receives assignments, distributes them, AI generates review rubrics, emails reviewers, collects responses, calculates scores, stores results, emails reports, updates dashboard, and posts analytics to Slack. |
| Sticky Note1             | Sticky Note                              | Prerequisites, use cases, benefits | -                          | -                                | ## Prerequisites - OpenAI API key - Gmail account - Slack workspace - Database or storage system - Dashboard tool ## Use Cases - University peer review assignments - Corporate training evaluations - Research paper assessments ## Customization - Multi-round review cycles - Custom scoring algorithms ## Benefits - Eliminates manual distribution - Ensures consistent evaluation |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Webhook Node**  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: `peer-assessment`  
   - Response Mode: Response Node  
   - Purpose: Entry point to receive assignment submissions.

2. **Add Set Node "Store Assignment Data"**  
   - Purpose: Store incoming assignment data in structured format.  
   - Parameters: Create an object with `assignments` array containing entries of `{id: studentId, value: full assignment JSON}`.  
   - Connect output of Webhook node to this node.

3. **Add Code Node "Distribute Peer Assignments"**  
   - Purpose: Assign 3 peer reviewers per assignment in round-robin fashion.  
   - JavaScript: Loop over all assignments; for each, assign next 3 assignments as reviewers cyclically.  
   - Input: Array of assignments from previous node.  
   - Output: Array of peer assignments with reviewers.

4. **Add Langchain Agent Node "Generate Review Rubric"**  
   - Purpose: Create a detailed peer review rubric per assignment.  
   - Prompt: Provide assignment details and request rubric with specified criteria (Technical Accuracy, Problem-solving, etc.).  
   - System Message: "You are a helpful assistant that creates detailed, fair assessment rubrics for engineering students."  
   - Connect output from "Distribute Peer Assignments".

5. **Add Langchain LM Chat OpenAI Node "OpenAI Model"**  
   - Model: `gpt-4.1-nano`  
   - Credentials: Connect with valid OpenAI API key.  
   - Input: From "Generate Review Rubric" agent.

6. **Add Langchain Output Parser Structured Node "Structure Parser"**  
   - Purpose: Parse AI output into structured JSON.  
   - Input: From "OpenAI Model".

7. **Connect "Structure Parser" output back to "Generate Review Rubric" agent** (as per Langchain agent pattern).

8. **Add Slack Node "Notify on Slack"**  
   - Purpose: Notify Slack channel of new peer review assignment.  
   - Channel: Set appropriate Slack channel ID.  
   - Authentication: OAuth2 with Slack workspace credentials.  
   - Message: Include student name, assignment title, due date, assigned reviewers, submission URL, and rubric generation confirmation.  
   - Input: From "Generate Review Rubric" output.

9. **Add Email Send Node "Email Reviewers"**  
   - Purpose: Send email to assigned reviewers with assignment and rubric details.  
   - To: Reviewer emails (joined).  
   - From: `noreply@university.edu` (or configured sender).  
   - Subject: "Peer Review Assignment: <assignmentTitle>"  
   - Body: HTML including assignment details, submission URL, and rubric.  
   - Input: From "Notify on Slack".

10. **Add Set Node "Prepare Response Data"**  
    - Purpose: Prepare JSON response data with assignment info, rubric, reviewers, status, timestamps.  
    - Input: From "Email Reviewers".

11. **Add Code Node "Calculate Peer Score"**  
    - Mode: Run Once For Each Item  
    - Purpose: Simulate scoring with random values for rubric criteria, calculate total score and grade.  
    - Input: From "Prepare Response Data".

12. **Add PostgreSQL Node "Store Review Results"**  
    - Purpose: Insert peer review scores and metadata into `peer_reviews` table.  
    - Configure connection to PostgreSQL database.  
    - Map columns: grade, scores (JSON string), studentId, reviewerId, totalScore, evaluatedAt, assignmentId.  
    - Input: From "Calculate Peer Score".

13. **Add Code Node "Check Completion Status"**  
    - Purpose: Group reviews by assignmentId, check if at least 3 reviews completed, compute average score and final grade.  
    - Input: From "Store Review Results".

14. **Add Langchain Agent Node "Generate Final Report"**  
    - Purpose: Generate detailed final assessment report using AI.  
    - Prompt: Include assignment ID, student ID, number of completed reviews, average score, final grade; request structured academic report.  
    - System Message: "You are an experienced engineering educator creating fair, constructive assessment reports."  
    - Input: From "Check Completion Status".

15. **Add Langchain LM Chat OpenAI Node "OpenAI Model 2"**  
    - Model: `gpt-4.1-nano`  
    - Credentials: OpenAI API key.  
    - Input: From "Generate Final Report".

16. **Add Langchain Output Parser Structured Node "Structure Parser 2"**  
    - Purpose: Parse the AI final report into structured JSON with expected sections.  
    - Input: From "OpenAI Model 2".

17. **Connect "Structure Parser 2" output back to "Generate Final Report" agent**.

18. **Add Email Send Node "Email Final Report"**  
    - Purpose: Email final report and grade to the student.  
    - To: Student email extracted from assignments (e.g., from "Distribute Peer Assignments").  
    - From: `noreply@university.edu`.  
    - Subject: "Final Peer Review Report: <assignmentId>"  
    - Body: HTML including final grade, average score, report summary, and review count.  
    - Input: From "Generate Final Report".

19. **Add HTTP Request Node "Update Dashboard Metrics"**  
    - Purpose: POST final grading metrics to external dashboard API.  
    - URL: `https://dashboard.university.edu/api/metrics`  
    - Method: POST  
    - Authentication: HTTP Header Authentication with configured credentials.  
    - Body Parameters: assignmentId, averageScore, grade, timestamp.  
    - Input: From "Generate Final Report".

20. **Add Code Node "Analytics Report"**  
    - Purpose: Aggregate class peer review data to calculate total assignments, class average, and grade distribution.  
    - Input: From "Generate Final Report".

21. **Add Slack Node "Post Analytics to Slack"**  
    - Purpose: Post analytics summary message to Slack channel.  
    - Channel: Same as Notify on Slack.  
    - Authentication: OAuth2 Slack credentials.  
    - Input: From "Analytics Report".

22. **Add Respond to Webhook Node "Respond to Webhook"**  
    - Purpose: Send final JSON response to webhook caller confirming success.  
    - Response Body: JSON with success, message, assignmentId, student name, reviewer count, rubric generated flag, status.  
    - Input: From "Prepare Response Data".

23. **Connect all nodes according to the flow described above**, ensuring proper input-output links and execution order.

24. **Set up credentials:**  
    - OpenAI API key (for Langchain and OpenAI nodes).  
    - Slack OAuth2 credentials.  
    - Email SMTP credentials (e.g., Gmail or other).  
    - PostgreSQL database credentials.  
    - HTTP header auth credentials for dashboard API.

25. **Test the workflow thoroughly:**  
    - Send sample POST requests to webhook with valid assignment data.  
    - Verify Slack notifications and emails are correctly sent.  
    - Confirm database insertions and dashboard updates occur.  
    - Validate AI-generated rubrics and reports for correctness and formatting.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                           | Context or Link                                                                                                                                                            |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| This workflow automates peer review assignment and grading with AI-powered evaluation, improving efficiency and consistency for educators managing collaborative assessments.                         | See introductory Sticky Note node in the workflow.                                                                                                                       |
| Prerequisites include OpenAI API key, Gmail account, Slack workspace, database or storage system, and a dashboard tool for metrics visualization.                                                      | See Sticky Note1 node content for detailed prerequisites.                                                                                                                 |
| Use cases extend beyond universities, including corporate training evaluations and research paper assessments.                                                                                         | Sticky Note1 list of use cases.                                                                                                                                           |
| Customizations possible: multi-round reviews, alternative scoring algorithms, customized rubric prompts.                                                                                                | Sticky Note1 customization suggestions.                                                                                                                                    |
| Benefits include elimination of manual distribution, consistent evaluation standards, and automated reporting and analytics.                                                                           | Sticky Note1 benefits section.                                                                                                                                             |
| Slack channel ID and email "from" addresses are hardcoded and should be updated to reflect your environment.                                                                                           | Configuration note for Slack and email nodes.                                                                                                                             |
| AI model used is GPT-4.1-nano; ensure your OpenAI API plan supports this model.                                                                                                                        | OpenAI model node configurations.                                                                                                                                         |
| Database schema must include a `peer_reviews` table with appropriate columns for storing review data.                                                                                                   | PostgreSQL node configuration requires this setup.                                                                                                                        |
| Dashboard URL and authentication credentials must be updated to match your institution's API and security protocols.                                                                                   | HTTP Request node configuration.                                                                                                                                           |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All manipulated data is legal and public.

---