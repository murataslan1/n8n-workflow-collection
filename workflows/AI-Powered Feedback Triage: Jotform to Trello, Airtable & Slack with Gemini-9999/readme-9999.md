AI-Powered Feedback Triage: Jotform to Trello, Airtable & Slack with Gemini

https://n8nworkflows.xyz/workflows/ai-powered-feedback-triage--jotform-to-trello--airtable---slack-with-gemini-9999


# AI-Powered Feedback Triage: Jotform to Trello, Airtable & Slack with Gemini

### 1. Workflow Overview

This workflow automates the triage and management of user feedback submitted via a JotForm form. It is designed for product teams to efficiently categorize, prioritize, and route feedback into actionable tasks or logs using AI-powered analysis with Google Gemini (PaLM), Trello for task management, Airtable for logging general feedback, and Slack for urgent alerts.

**Target Use Cases:**  
- Collecting user feedback from a web form  
- Automatically analyzing and categorizing feedback with AI  
- Creating Trello cards for bugs and feature requests  
- Logging general feedback into Airtable for review  
- Sending Slack alerts for high-priority bugs  
- Sending confirmation emails to users who provide their email

**Logical Blocks:**

- **1.1 Input Reception:** Receiving form submissions from JotForm and initial configuration.  
- **1.2 Conditional Email Confirmation:** Sending confirmation emails if the user provided an email.  
- **1.3 AI Processing:** Using Google Gemini to analyze and structure feedback data.  
- **1.4 Feedback Categorization & Routing:** Decision nodes that determine whether feedback is a bug, feature request, or general feedback and route accordingly.  
- **1.5 Trello Card Creation:** Creating cards for actionable feedback (bugs, feature requests) with proper labels and lists.  
- **1.6 Airtable Logging:** Logging non-actionable general feedback into Airtable.  
- **1.7 Urgency Check and Slack Alert:** Checking if a bug is high priority and sending Slack alerts to the dev team.  
- **1.8 No-Op Nodes:** Used where no further action is necessary.  
- **1.9 Documentation & Setup Notes:** Sticky notes for setup instructions and reminders.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
Receives feedback submissions from a JotForm form and initializes necessary configuration parameters.

- **Nodes Involved:**  
  - JotForm Trigger  
  - Config

- **Node Details:**  
  - **JotForm Trigger**  
    - Type: Trigger node for JotForm form submissions  
    - Configuration: Connected to a specific JotForm (ID 252934846764067) with API credentials  
    - Inputs: Webhook triggered on form submission  
    - Outputs: JSON data with resolved field names (e.g., "Feedback Details", "I am a...")  
    - Edge Cases: Form structure must match expected fields; webhook connectivity issues; API credential errors

  - **Config**  
    - Type: Set node (data initialization)  
    - Configuration: Stores Trello list and label IDs as string variables for later use  
    - Inputs: From JotForm Trigger node (triggered after form submission)  
    - Outputs: Provides configuration data to downstream nodes  
    - Edge Cases: Incorrect or outdated Trello IDs will cause Trello card creation failures

#### 1.2 Conditional Email Confirmation

- **Overview:**  
If the user provided an email, send a confirmation email acknowledging receipt of feedback; otherwise, skip this step.

- **Nodes Involved:**  
  - Email Provided?  
  - Send Confirmation Email  
  - Skip Confirmation Email

- **Node Details:**  
  - **Email Provided?**  
    - Type: If node  
    - Condition: Checks if "Your Email (Optional)" field is non-empty  
    - Inputs: Output of Config node  
    - Outputs: Routes to Send Confirmation Email if email exists, else to Skip Confirmation Email  
    - Edge Cases: Empty or malformed email fields, potential expression evaluation failures

  - **Send Confirmation Email**  
    - Type: Gmail node  
    - Configuration: Sends a plain text email confirming feedback receipt using Gmail OAuth2 credentials  
    - Inputs: Email address from form data  
    - Outputs: Email sent status  
    - Edge Cases: Gmail API quota limits, OAuth token expiration, invalid email addresses

  - **Skip Confirmation Email**  
    - Type: NoOp node  
    - Purpose: Placeholder to continue workflow when no email is provided

#### 1.3 AI Processing

- **Overview:**  
Uses Google Gemini Chat Model with a Langchain agent node to analyze the feedback text, extract a structured summary including task title, category, priority, and tags.

- **Nodes Involved:**  
  - Google Gemini Chat Model  
  - AI Feedback Triage  
  - Structured Output Parser

- **Node Details:**  
  - **Google Gemini Chat Model**  
    - Type: AI language model node (Google PaLM/Gemini)  
    - Configuration: Connected to Google PaLM API credentials  
    - Inputs: Raw feedback text from JotForm Trigger via AI Feedback Triage node  
    - Outputs: AI-generated text response  
    - Edge Cases: API rate limits, network timeouts, malformed prompt injections

  - **AI Feedback Triage**  
    - Type: Langchain agent node  
    - Configuration: Defines prompt with instructions to: create a task title, determine category (Bug, Feature Request, General Feedback), suggest priority (High, Medium, Low), and extract tags as an array.  
    - Key Expression: Uses feedback details from JotForm Trigger node `{{ $('JotForm Trigger').item.json['Feedback Details'] }}`  
    - Inputs: Output from Google Gemini Chat Model node  
    - Outputs: AI-generated structured JSON in `output` property  
    - Edge Cases: Parsing failures, unexpected AI response format

  - **Structured Output Parser**  
    - Type: Langchain output parser node  
    - Configuration: Validates AI output against JSON schema example (task_title, category, suggested_priority, tags)  
    - Inputs: AI Feedback Triage output  
    - Outputs: Structured JSON object accessible for downstream nodes  
    - Edge Cases: Schema mismatch, JSON parse errors

#### 1.4 Feedback Categorization & Routing

- **Overview:**  
Decides whether feedback is actionable (Bug or Feature Request) or general feedback, routing accordingly.

- **Nodes Involved:**  
  - Is it a Bug or Feature?  
  - Create Trello Card  
  - Log General Feedback to Airtable

- **Node Details:**  
  - **Is it a Bug or Feature?**  
    - Type: If node  
    - Condition: Checks if `category` field (from AI output) is either 'bug' or 'feature request' (case-insensitive)  
    - Inputs: AI Feedback Triage node output  
    - Outputs: Routes to Create Trello Card if true, else Log General Feedback to Airtable  
    - Edge Cases: Category field missing or misspelled, case sensitivity issues

  - **Create Trello Card**  
    - Type: Trello node  
    - Configuration:  
      - Creates a card on appropriate Trello list based on category ('Bugs' or 'Feature Backlog')  
      - Card name: AI-generated task title  
      - Description: Includes submitter type, optional email, full feedback, and AI tags  
      - Labels: Adds labels based on submitter type (Customer, Staff, Other) and urgency (Urgent) using IDs from Config node  
      - Card position: Top of the list  
    - Inputs: AI Feedback Triage, JotForm Trigger, Config nodes  
    - Outputs: Created Trello card data including shortUrl  
    - Edge Cases: Invalid Trello credentials, incorrect list or label IDs, API rate limits

  - **Log General Feedback to Airtable**  
    - Type: Airtable node  
    - Configuration:  
      - Creates a record in "Feedback Submissions" table of the "Product Feedback Log" base  
      - Fields mapped: Email, Source, AI Tags, Full Feedback, Feedback Summary  
      - Typecast option enabled to allow automatic tag creation  
    - Inputs: AI Feedback Triage and JotForm Trigger nodes  
    - Outputs: Airtable record creation confirmation  
    - Edge Cases: Airtable API rate limits, invalid base or table IDs, missing fields

#### 1.5 Urgency Check and Slack Alert

- **Overview:**  
Determines if feedback is an urgent bug and sends a Slack alert to the dev team if so.

- **Nodes Involved:**  
  - Is it an Urgent Bug?  
  - Alert Dev Team  
  - No Alert Needed

- **Node Details:**  
  - **Is it an Urgent Bug?**  
    - Type: If node  
    - Condition: Checks if category is 'bug' and suggested_priority is 'high' (both case-insensitive)  
    - Inputs: AI Feedback Triage output  
    - Outputs: Routes to Alert Dev Team if true, else No Alert Needed  
    - Edge Cases: Missing or malformed priority/category fields

  - **Alert Dev Team**  
    - Type: Slack node  
    - Configuration:  
      - Sends a message to a specific Slack channel (dev-alerts) via webhook  
      - Message includes high priority alert emoji, feedback title, source, full feedback, and link to Trello card  
    - Inputs: JotForm Trigger, AI Feedback Triage, Create Trello Card nodes  
    - Outputs: Slack message delivery status  
    - Edge Cases: Slack API/webhook errors, channel permission issues

  - **No Alert Needed**  
    - Type: NoOp node  
    - Purpose: Terminates the path when no alert is necessary

#### 1.6 Documentation & Setup Notes

- **Overview:**  
Provides detailed sticky notes with setup instructions and explanations to assist users in configuring and understanding the workflow.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  
  - Sticky Note2  
  - Sticky Note3  
  - Sticky Note4  
  - Sticky Note5  
  - Sticky Note6

- **Node Details:**  
  - Sticky Note nodes contain text and images explaining:  
    - How to set up the JotForm feedback form  
    - How to find and enter Trello list and label IDs  
    - The AI analysis step and prompt details  
    - Trello card creation logic  
    - Airtable logging details  
    - Slack alert configuration for urgent bugs  
  - Inputs: None (informational only)  
  - Outputs: None

---

### 3. Summary Table

| Node Name                   | Node Type                              | Functional Role                                  | Input Node(s)                 | Output Node(s)                        | Sticky Note                                                                                                    |
|-----------------------------|--------------------------------------|-------------------------------------------------|------------------------------|-------------------------------------|----------------------------------------------------------------------------------------------------------------|
| JotForm Trigger             | JotForm Trigger                      | Receives form submission                         | N/A                          | Config, Email Provided?              | ## 🚪 Set Up Your Feedback Form - Instructions for Jotform form setup and webhook configuration               |
| Config                     | Set                                  | Stores Trello list and label IDs                 | JotForm Trigger              | AI Feedback Triage                   | ## 🔑 Enter Your Trello IDs - How to find and enter Trello board/list/label IDs                               |
| Email Provided?             | If                                   | Checks if user provided an email                 | Config                       | Send Confirmation Email, Skip Confirmation Email |                                                                                                                |
| Send Confirmation Email     | Gmail                                | Sends confirmation email to user                 | Email Provided?               | N/A                                 |                                                                                                                |
| Skip Confirmation Email     | NoOp                                 | Skips email sending if no email provided         | Email Provided?               | N/A                                 |                                                                                                                |
| Google Gemini Chat Model    | Langchain LM Chat Model (Google PaLM) | Calls Google Gemini AI to process feedback       | AI Feedback Triage (connected as LM) | AI Feedback Triage                   | ## 🧠 AI Analysis - Explains AI prompt and output schema                                                     |
| AI Feedback Triage          | Langchain Agent                      | Analyzes feedback, outputs structured JSON       | Config, Google Gemini Chat Model | Is it a Bug or Feature?              | ## 🧠 AI Analysis (continued)                                                                                   |
| Structured Output Parser    | Langchain Output Parser              | Parses AI output into structured JSON             | AI Feedback Triage           | Is it a Bug or Feature?              |                                                                                                                |
| Is it a Bug or Feature?     | If                                   | Determines if feedback is Bug or Feature Request | AI Feedback Triage           | Create Trello Card, Log General Feedback to Airtable |                                                                                                                |
| Create Trello Card          | Trello                               | Creates Trello card for bugs/features             | Is it a Bug or Feature?      | Is it an Urgent Bug?                 | ## Create Actionable Task - Details on card creation, list placement, labels                                 |
| Log General Feedback to Airtable | Airtable                        | Logs general feedback for later review            | Is it a Bug or Feature?      | N/A                                 | ## Log Non-Actionable Feedback - Airtable logging setup and rationale                                         |
| Is it an Urgent Bug?        | If                                   | Checks if bug is high priority                     | Create Trello Card           | Alert Dev Team, No Alert Needed      |                                                                                                                |
| Alert Dev Team              | Slack                                | Sends urgent bug alert message to Slack channel   | Is it an Urgent Bug?         | N/A                                 | ## Alert Team About Urgent Bugs - Slack alert setup and customization                                         |
| No Alert Needed             | NoOp                                 | Ends flow if no alert needed                       | Is it an Urgent Bug?         | N/A                                 |                                                                                                                |
| Sticky Note                 | Sticky Note                         | Setup instructions and overview                    | N/A                          | N/A                                 | ## 🚪 Set Up Your Feedback Form                                                                                 |
| Sticky Note1                | Sticky Note                         | Trello IDs explanation                             | N/A                          | N/A                                 | ## 🔑 Enter Your Trello IDs                                                                                      |
| Sticky Note2                | Sticky Note                         | AI analysis explanation                            | N/A                          | N/A                                 | ## 🧠 AI Analysis                                                                                                |
| Sticky Note3                | Sticky Note                         | Form preview image                                 | N/A                          | N/A                                 | ## Form Preview                                                                                                 |
| Sticky Note4                | Sticky Note                         | Trello card creation explanation                   | N/A                          | N/A                                 | ## Create Actionable Task                                                                                         |
| Sticky Note5                | Sticky Note                         | Airtable logging explanation                        | N/A                          | N/A                                 | ## Log Non-Actionable Feedback                                                                                   |
| Sticky Note6                | Sticky Note                         | Slack alert explanation for urgent bugs            | N/A                          | N/A                                 | ## Alert Team About Urgent Bugs                                                                                   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create the JotForm Trigger Node:**  
   - Type: JotForm Trigger  
   - Connect your JotForm API credentials  
   - Select your feedback form (ensure it has fields: "I am a..." (radio), "Your Email (Optional)", and "Feedback Details")  
   - Enable "Resolve Data" toggle for readable field names  

2. **Create the Config Node:**  
   - Type: Set  
   - Add string variables for Trello list and label IDs:  
     - `feature_backlog_list_id`: Trello list ID for feature requests  
     - `bugs_list_id`: Trello list ID for bugs  
     - `customer_label_id`, `staff_label_id`, `other_label_id`, `urgent_label_id`: Trello label IDs  
   - Connect JotForm Trigger to this node  

3. **Create the Email Provided? Node:**  
   - Type: If  
   - Condition: Check if field "Your Email (Optional)" is not empty  
   - Connect Config node output to this node  

4. **Create Send Confirmation Email Node:**  
   - Type: Gmail  
   - Credentials: Connect Gmail OAuth2 credentials  
   - Send to: Expression `{{$json["Your Email (Optional)"]}}`  
   - Subject: "Thanks for your feedback on IdeaToBiz!"  
   - Message: Plain text confirming receipt of feedback  
   - Connect from Email Provided? node’s true output  

5. **Create Skip Confirmation Email Node:**  
   - Type: NoOp  
   - Connect from Email Provided? node’s false output  

6. **Create Google Gemini Chat Model Node:**  
   - Type: Langchain Google Gemini Chat Model  
   - Credentials: Connect Google PaLM API credentials  
   - No special parameters needed beyond default  

7. **Create AI Feedback Triage Node:**  
   - Type: Langchain Agent  
   - Prompt:  
     ```
     You are an expert product manager's assistant, responsible for triaging all incoming feedback.

     A user has submitted the following feedback:
     "{{ $('JotForm Trigger').item.json['Feedback Details'] }}"

     Please analyze this feedback and follow these steps:
     1. First, create a short, clear `task_title` for it.
     2. Second, determine the `category`. Is this a 'Bug' (something is broken), a 'Feature Request' (a new idea), or 'General Feedback' (an opinion or comment)?
     3. Third, assess the `suggested_priority` based on the user's tone and the potential impact described.
     4. Fourth, extract an array of relevant `tags` (keywords).

     Provide your final analysis ONLY in the requested JSON format.
     ```
   - Connect Config node output to AI Feedback Triage input, and Google Gemini Chat Model node as the language model for this agent  

8. **Create Structured Output Parser Node:**  
   - Type: Langchain Output Parser Structured  
   - JSON Schema Example:  
     ```json
     {
       "task_title": "A short, 5-10 word title for this feedback",
       "category": "Must be one of: 'Bug', 'Feature Request', or 'General Feedback'",
       "suggested_priority": "Must be one of: 'High', 'Medium', or 'Low'",
       "tags": [
         "keyword1",
         "keyword2"
       ]
     }
     ```  
   - Connect AI Feedback Triage node output to this node  

9. **Create Is it a Bug or Feature? Node:**  
   - Type: If  
   - Condition: Check if `output.category` (from AI Feedback Triage) equals "bug" or "feature request" (case-insensitive)  
   - Connect Structured Output Parser output to this node  

10. **Create Create Trello Card Node:**  
    - Type: Trello  
    - Credentials: Connect Trello API credentials  
    - Name: Expression from AI output `task_title`  
    - List ID: Expression selecting bugs list or feature backlog list based on category  
    - Description: Template including submitter type, optional email, full feedback, and AI tags  
    - Labels: Combine submitter label and urgent label if priority is high  
    - Position: Top of the list  
    - Connect true output of "Is it a Bug or Feature?" node to this node  

11. **Create Log General Feedback to Airtable Node:**  
    - Type: Airtable  
    - Credentials: Connect Airtable Personal Access Token  
    - Base: "Product Feedback Log" (select your base)  
    - Table: "Feedback Submissions"  
    - Fields mapped to form data and AI output (Feedback Summary, Full Feedback, Source, Email, AI Tags)  
    - Enable Typecast option in node options  
    - Connect false output of "Is it a Bug or Feature?" node to this node  

12. **Create Is it an Urgent Bug? Node:**  
    - Type: If  
    - Condition: Check if category is "bug" and suggested_priority is "high" (case-insensitive)  
    - Connect Create Trello Card node output to this node  

13. **Create Alert Dev Team Node:**  
    - Type: Slack  
    - Credentials: Connect Slack API credentials  
    - Channel: Select your dev-alerts Slack channel  
    - Message:  
      ```
      🚨 *High Priority Bug Reported!* 🚨

      *Title:* {{ $('AI Feedback Triage').item.json.output.task_title }}
      *Source:* {{ $('JotForm Trigger').item.json['I am a...'] }}
      *Feedback:* {{ $('JotForm Trigger').item.json['Feedback Details'] }}

      *Trello Card:*
      {{ $('Create Trello Card').item.json.shortUrl }}
      ```  
    - Connect true output of "Is it an Urgent Bug?" node to this node  

14. **Create No Alert Needed Node:**  
    - Type: NoOp  
    - Connect false output of "Is it an Urgent Bug?" node to this node  

15. **Connect Workflow Ends:**  
    - Slack alert node and No Alert node end paths  
    - Airtable logging node ends path  
    - Email nodes end paths  

16. **Add Sticky Notes:**  
    - Add sticky notes containing setup instructions for JotForm form, Trello IDs, AI analysis, Trello card creation, Airtable logging, and Slack alerting as per content in the original workflow for user reference.

---

### 5. General Notes & Resources

| Note Content                                                                                                                   | Context or Link                                                                                 |
|-------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow starts with a JotForm feedback form configured with specific field names and types.                                    | [JotForm Sign Up and Form Creation](https://www.jotform.com/?partner=atakhalighi)              |
| Instructions provided on how to extract Trello Board, List, and Label IDs from the Trello board JSON URL.                      | See Sticky Note1 content for detailed steps                                                    |
| AI analysis uses Google Gemini (PaLM) for natural language processing with a defined prompt to generate structured JSON output. | Requires Google PaLM API credentials                                                           |
| Airtable logging uses typecasting to auto-create tag options.                                                                   | Ensure Airtable base and table fields match those specified in the node                         |
| Slack alerts are targeted at a dedicated channel for development team notification.                                              | Channel should be configured to allow webhook messages                                         |
| The workflow ensures anonymous feedback can be handled gracefully (email optional).                                              | Conditional email sending allows privacy/respect for users without emails                       |

---

**Disclaimer:** The provided content is exclusively sourced from an automated workflow designed in n8n, an integration and automation platform. It strictly complies with relevant content policies and contains no illegal, offensive, or protected elements. All data processed is lawful and publicly accessible.