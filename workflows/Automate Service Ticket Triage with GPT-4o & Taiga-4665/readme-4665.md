Automate Service Ticket Triage with GPT-4o & Taiga

https://n8nworkflows.xyz/workflows/automate-service-ticket-triage-with-gpt-4o---taiga-4665


# Automate Service Ticket Triage with GPT-4o & Taiga

### 1. Workflow Overview

This workflow, titled **"Automate Service Ticket Triage with GPT-4o & Taiga"**, automates the triage process of service tickets created in the Taiga project management system. Its main goal is to analyze newly created tickets using AI (GPT-4o) to classify and enrich the ticket with key metadata fields: Type, Severity, Priority, Status, and Missing information if any. This structured classification enables streamlined processing, prioritization, and resolution.

The workflow is logically organized into these blocks:

- **1.1 Input Reception:** Listens for new service tickets created in a specified Taiga project.
- **1.2 AI Analysis:** Uses a GPT-4o language model to analyze the ticket subject and extract classification fields.
- **1.3 Classification Routing:** Switch nodes route the output to appropriate Taiga update nodes based on AI-determined Type, Severity, and Priority.
- **1.4 Status and Blocking Logic:** If the AI determines that more information is needed, the ticket status is updated to "Needs More Info" and the ticket is blocked.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block triggers the workflow when a new issue (service ticket) is created in Taiga.

- **Nodes Involved:**  
  - Service Ticket Created  
  - Sticky Note (documentation)

- **Node Details:**

  - **Service Ticket Created**  
    - Type: Taiga Trigger  
    - Role: Watches for newly created issues in the specified Taiga project (ID: 1694047).  
    - Configuration: Listens for "issue" resource creation events.  
    - Credentials: Uses Taiga API credentials.  
    - Outputs: Emits the new issue data to the next node.  
    - Potential Failures: API authentication errors, network timeouts, or webhook misconfiguration.

  - **Sticky Note**  
    - Type: Documentation node  
    - Role: Provides a detailed explanation of the workflow’s purpose and expected AI outputs.  
    - Configuration: Text describing use case and expected fields (Type, Priority, Recipient, Status, Missing).  
    - No inputs or outputs.

#### 1.2 AI Analysis

- **Overview:**  
  This block uses GPT-4o to analyze the ticket's subject line and extract structured classification data.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  
  - Structured Output Parser

- **Node Details:**

  - **AI Agent**  
    - Type: LangChain AI Agent  
    - Role: Sends the ticket subject text to the AI model with instructions to classify and extract fields.  
    - Configuration:  
      - Input text: ticket subject from Taiga trigger.  
      - System message: Specifies fields to extract (Type, Severity, Priority, Status, Missing) with allowed values.  
      - Output parser enabled for structured response.  
    - Inputs: Ticket subject from "Service Ticket Created" node.  
    - Outputs: JSON object with classification fields.  
    - Edge Cases: Ambiguous or very short ticket subjects may yield incomplete or incorrect AI responses.

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Node  
    - Role: Provides the GPT-4o-mini model for the AI Agent to query.  
    - Configuration: Uses "gpt-4o-mini" model with OpenAI API credentials.  
    - Inputs/Outputs: Connected as the AI language model backend to AI Agent.  
    - Potential Failures: API rate limits, invalid API key, or network issues.

  - **Structured Output Parser**  
    - Type: LangChain Structured Output Parser  
    - Role: Parses AI raw output into a JSON schema with expected fields.  
    - Configuration: JSON schema example provided for validation.  
    - Inputs: AI Agent raw output  
    - Outputs: Clean JSON with fields: Type, Severity, Priority, Status, Missing.  
    - Failures: Parsing errors if AI output deviates from expected format.

#### 1.3 Classification Routing

- **Overview:**  
  This block routes the AI-classified fields to update the ticket in Taiga accordingly for Type, Severity, and Priority via switch nodes and Taiga update nodes.

- **Nodes Involved:**  
  - Define Type (Switch)  
  - Define Severity (Switch)  
  - Define Priority (Switch)  
  - Set Type to Question, Enhancement, Bug, Onboarding (Taiga update nodes)  
  - Set Severity to Wishlist, Minor, Normal, Important, Critical (Taiga update nodes)  
  - Set Priority To Low, Normal, High (Taiga update nodes)

- **Node Details:**

  - **Define Type**  
    - Type: Switch  
    - Role: Routes based on AI output "Type" field.  
    - Options: Matches exactly "Question", "Enhancement", "Bug", "Onboarding".  
    - Inputs: AI Agent output JSON  
    - Outputs: Routes to corresponding "Set Type to ..." nodes.  
    - Edge Cases: Unrecognized types are not routed, potentially no update.

  - **Set Type to Question / Enhancement / Bug / Onboarding**  
    - Type: Taiga node (Update issue)  
    - Role: Update Taiga issue "type" field with respective type ID.  
    - Configuration: Uses issue ID and project ID from Taiga trigger.  
    - Outputs: For "Bug", flows onward to Define Severity node. For others, also connect to Define Severity.  
    - Potential Failures: API errors, invalid type IDs.

  - **Define Severity**  
    - Type: Switch  
    - Role: Routes based on AI output "Severity".  
    - Options: "Wishlist", "Minor", "Normal", "Important", "Critical".  
    - Inputs: AI Agent output JSON  
    - Outputs: Routes to corresponding "Set Severity to ..." nodes.

  - **Set Severity to Wishlist / Minor / Normal / Important / Critical**  
    - Type: Taiga node (Update issue severity)  
    - Role: Updates severity field with respective Taiga severity ID.  
    - Outputs: Some link downstream to Define Priority node (e.g., Minor, Normal, Critical, Important, Wishlist).  
    - Potential Failures: API errors, invalid severity IDs.

  - **Define Priority**  
    - Type: Switch  
    - Role: Routes based on AI output "Priority".  
    - Options: "Low", "Normal", "High".  
    - Inputs: AI Agent output JSON  
    - Outputs: Routes to Set Priority nodes.

  - **Set Priority To Low / Normal / High**  
    - Type: Taiga nodes (Update priority)  
    - Role: Update priority field with corresponding Taiga priority ID.  
    - Outputs: All connect to "More Info Needed?" conditional node.

#### 1.4 Status and Blocking Logic

- **Overview:**  
  Determines if the ticket needs more information based on AI output status and updates the ticket accordingly.

- **Nodes Involved:**  
  - More Info Needed? (If node)  
  - Set to Needs Info & Block (Taiga update node)

- **Node Details:**

  - **More Info Needed?**  
    - Type: If node  
    - Role: Checks if AI output "Status" equals "Needs More Info" (case insensitive).  
    - Inputs: AI Agent output JSON  
    - Outputs: If true, triggers "Set to Needs Info & Block" node.

  - **Set to Needs Info & Block**  
    - Type: Taiga update node  
    - Role: Updates ticket status to "Needs More Info" (status ID 11860979), sets "is_blocked" true, and appends a description indicating missing information (pulled from AI output) along with existing description.  
    - Inputs: Issue ID and project ID from Taiga trigger.  
    - Potential Failures: API errors, invalid status ID.

---

### 3. Summary Table

| Node Name              | Node Type                           | Functional Role                         | Input Node(s)                 | Output Node(s)                  | Sticky Note                                                                                                    |
|------------------------|-----------------------------------|---------------------------------------|------------------------------|--------------------------------|---------------------------------------------------------------------------------------------------------------|
| Service Ticket Created  | Taiga Trigger                     | Entry point on new Taiga issue creation | -                            | AI Agent                       |                                                                                                               |
| Sticky Note            | Sticky Note                       | Explains workflow use case and logic  | -                            | -                              | ## Service Ticket Triage Helper Usecase: When a service ticket comes in, it's possible that it may not have enough information to act on. So we use AI to help classify the information to determine if there's enough information. Need to determine the following fields: Type, Priority, Recipient, Status, Missing. If all can be determined, set status accordingly; else set status "Needs More Info" and block ticket. |
| AI Agent               | LangChain AI Agent                | Analyzes ticket subject to extract classification fields | Service Ticket Created        | Define Type                    |                                                                                                               |
| OpenAI Chat Model      | LangChain OpenAI Chat Model       | Provides GPT-4o-mini model for AI Agent | -                            | AI Agent (ai_languageModel)     |                                                                                                               |
| Structured Output Parser| LangChain Structured Output Parser| Parses AI raw output into JSON schema | AI Agent                     | AI Agent (ai_outputParser)      |                                                                                                               |
| Define Type            | Switch                           | Routes based on AI "Type" field       | AI Agent                     | Set Type to Question, Enhancement, Bug, Onboarding |                                                                                                               |
| Set Type to Question   | Taiga                            | Updates ticket Type to Question        | Define Type                  | Define Severity                |                                                                                                               |
| Set Type to Enhancement| Taiga                            | Updates ticket Type to Enhancement     | Define Type                  | Define Severity                |                                                                                                               |
| Set Type to Bug        | Taiga                            | Updates ticket Type to Bug             | Define Type                  | Define Severity                |                                                                                                               |
| Set Type to Onboarding | Taiga                            | Updates ticket Type to Onboarding      | Define Type                  | Define Severity                |                                                                                                               |
| Define Severity        | Switch                           | Routes based on AI "Severity" field   | Set Type to ... (various)    | Set Severity to Wishlist, Minor, Normal, Important, Critical |                                                                                                               |
| Set Severity to Wishlist| Taiga                           | Updates ticket severity to Wishlist    | Define Severity              | Define Priority                |                                                                                                               |
| Set Severity to Minor  | Taiga                            | Updates ticket severity to Minor       | Define Severity              | Define Priority                |                                                                                                               |
| Set Severity to Normal | Taiga                            | Updates ticket severity to Normal      | Define Severity              | Define Priority                |                                                                                                               |
| Set Severity to Important| Taiga                          | Updates ticket severity to Important   | Define Severity              | Define Priority                |                                                                                                               |
| Set Severity to Critical| Taiga                           | Updates ticket severity to Critical    | Define Severity              | Define Priority                |                                                                                                               |
| Define Priority        | Switch                           | Routes based on AI "Priority" field   | Set Severity to ... (various)| Set Priority To Low, Normal, High |                                                                                                               |
| Set Priority To Low    | Taiga                            | Updates ticket priority to Low         | Define Priority              | More Info Needed?              |                                                                                                               |
| Set Priority To Normal | Taiga                            | Updates ticket priority to Normal      | Define Priority              | More Info Needed?              |                                                                                                               |
| Set Priority To High   | Taiga                            | Updates ticket priority to High        | Define Priority              | More Info Needed?              |                                                                                                               |
| More Info Needed?      | If                              | Checks if ticket status is "Needs More Info" | Set Priority To ... (various) | Set to Needs Info & Block      |                                                                                                               |
| Set to Needs Info & Block| Taiga                           | Updates ticket status to "Needs More Info" and blocks the ticket | More Info Needed?            | -                              |                                                                                                               |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Taiga Trigger Node "Service Ticket Created"**  
   - Type: Taiga Trigger  
   - Configure to watch for "issue" resource creation events in project ID: 1694047  
   - Authenticate with Taiga API credentials  
   - Position: Left side (e.g., x=-880, y=780)

2. **Add Sticky Note**  
   - Text:  
     ```
     ## Service Ticket Triage Helper
     Usecase: When a service ticket comes in, it's possible that it may not have enough information to act on. So we use AI to help classify the information to determine if there's enough information. 

     Need to determine the following fields from the initial ticket:

     1. Can the 'Type' be determined?
     2. Can the 'Priority' be determined?
     3. Can the 'Recipient' be determined?
     4. Can the 'Status' be determined?
     5. 'Missing' will have what is missing in the ticket. 

     If all of these can be determined, then we can set the status accordingly. If not, then we set the status to "Needs More Info" and populate the "Missing" parameter with the issue. The ticket also is set to 'Blocker' so it cannot move forward until the issue is resolved.
     ```

3. **Create OpenAI Chat Model Node "OpenAI Chat Model"**  
   - Type: LangChain OpenAI Chat Model  
   - Model: "gpt-4o-mini"  
   - Authenticate with OpenAI API credentials  
   - Position: e.g., x=-632, y=1000

4. **Create LangChain Structured Output Parser "Structured Output Parser"**  
   - Type: LangChain Structured Output Parser  
   - JSON schema example:  
     ```json
     {
       "Type": "Bug",
       "Severity": "Important",
       "Priority": "Medium",
       "Status": "New",
       "Missing": "Need more information about the fix. Where is it and what's the problem that is happening?"
     }
     ```  
   - Position: x=-512, y=1000  
   - Connect OpenAI Chat Model output to this node input.

5. **Create LangChain AI Agent Node "AI Agent"**  
   - Type: LangChain AI Agent  
   - Input Text: `={{ $json.data.subject }}` (from "Service Ticket Created")  
   - System Message:  
     ```
     You are a helpful AI assistant designed to analyze Taiga service ticket descriptions and extract these 4 fields and their values from the description:

     Type: [Bug, Question, Enhancement, Onboarding]
     Severity: [Wishlist, Minor, Normal, Important, Critical]
     Priority: [Low, Normal, High]
     Status: [New, Rejected, Needs More Info]
     Missing: Blank if all the info is in the ticket

     Each parameter will return one of these options each.
     If the status is "Needs More Info" then, it should say what's missing in the 'Missing' Parameter.
     ```  
   - Enable structured output parser  
   - Connect output parser node to AI Agent's ai_outputParser input  
   - Connect OpenAI Chat Model node to AI Agent's ai_languageModel input  
   - Connect "Service Ticket Created" main output to AI Agent main input

6. **Create Switch Node "Define Type"**  
   - Type: Switch  
   - Rule: Match AI Agent output field `Type` exactly to one of: "Question", "Enhancement", "Bug", "Onboarding"  
   - Position: x=-284, y=759  
   - Connect AI Agent output to this node

7. **Create Taiga Update Nodes for Type**  
   - "Set Type to Question" with Taiga Type ID: 5097140  
   - "Set Type to Enhancement" with Taiga Type ID: 5097141  
   - "Set Type to Bug" with Taiga Type ID: 5097139  
   - "Set Type to Onboarding" with Taiga Type ID: 5099270  
   - All update the issue with ID and project ID from "Service Ticket Created" trigger  
   - Connect each output of "Define Type" switch to corresponding "Set Type to ..." node

8. **Create Switch Node "Define Severity"**  
   - Type: Switch  
   - Rule: Match AI Agent output `Severity` exactly to one of: "Wishlist", "Minor", "Normal", "Important", "Critical"  
   - Position: x=156, y=738  
   - Connect outputs of all "Set Type to ..." nodes to this node

9. **Create Taiga Update Nodes for Severity**  
   - "Set Severity to Wishlist" (severity ID 8467039)  
   - "Set Severity to Minor" (8467040)  
   - "Set Severity to Normal" (8467041)  
   - "Set Severity to Important" (8467042)  
   - "Set Severity to Critical" (8467043)  
   - Connect outputs of "Define Severity" switch to respective nodes  
   - Connect outputs of these nodes to next block (Define Priority)

10. **Create Switch Node "Define Priority"**  
    - Type: Switch  
    - Rule: Match AI Agent output `Priority` exactly to one of: "Low", "Normal", "High"  
    - Position: x=596, y=780  
    - Connect outputs of Severity update nodes to this node

11. **Create Taiga Update Nodes for Priority**  
    - "Set Priority To Low" (priority ID 5086090)  
    - "Set Priority To Normal" (5086091)  
    - "Set Priority To High" (5086092)  
    - Connect outputs of "Define Priority" switch to these nodes

12. **Create If Node "More Info Needed?"**  
    - Type: If  
    - Condition: Check if AI Agent output `Status` equals "Needs More Info" (case insensitive)  
    - Position: x=1036, y=780  
    - Connect outputs of all priority update nodes to this node

13. **Create Taiga Update Node "Set to Needs Info & Block"**  
    - Update issue status to ID 11860979 ("Needs More Info")  
    - Set "is_blocked" true  
    - Append description:  
      ```
      We need more information to forward this ticket: 
      {{ $('AI Agent').item.json.output.Missing }}

      Existing information: 
      {{ $('Service Ticket Created').item.json.data.description }}
      ```  
    - Connect "True" output of "More Info Needed?" node to this node

14. **Workflow Activation**  
    - Enable and test the workflow by creating new issues in the Taiga project.  
    - Monitor logs for errors or unexpected AI responses.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                      | Context or Link                                            |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| Workflow uses GPT-4o-mini model via LangChain integration in n8n for AI classification of service tickets.                                                                                                                                       | n8n LangChain & OpenAI API                                 |
| Taiga issue type, severity, priority, and status IDs are hardcoded and must match the Taiga project configuration. Adjust these if your Taiga instance uses different IDs.                                                                         | Taiga project configuration                                |
| The AI prompt carefully instructs the model to output structured JSON fields and to specify missing info if status is "Needs More Info".                                                                                                         | AI prompt in AI Agent node                                 |
| Blocking the ticket by setting "is_blocked" ensures tickets with insufficient info cannot proceed in Taiga workflows until resolved.                                                                                                              | Taiga issue blocking logic                                 |
| Sticky note included in workflow summarizes the use case and logic for easy reference inside n8n editor.                                                                                                                                          | Workflow documentation inside n8n                          |

---

**Disclaimer:**  
The provided text originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process strictly complies with current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.