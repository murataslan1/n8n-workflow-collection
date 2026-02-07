AI-Powered Auto-Tagging for Zendesk Tickets using GPT-4.1-mini

https://n8nworkflows.xyz/workflows/ai-powered-auto-tagging-for-zendesk-tickets-using-gpt-4-1-mini-11167


# AI-Powered Auto-Tagging for Zendesk Tickets using GPT-4.1-mini

### 1. Workflow Overview

This workflow automates the process of tagging Zendesk tickets using an AI model (GPT-4.1-mini). It is designed for customer support teams who want to streamline ticket categorization by automatically assigning relevant tags based on ticket content and predefined rules. The workflow runs on a daily schedule, retrieves tickets created in the last 24 hours for specific Zendesk brands, processes each ticket through an AI agent that decides appropriate tags, and updates the tickets with these tags while preserving any existing ones.

Logical blocks:

- **1.1 Scheduled Execution & Brand Setup:** Defines the schedule and the Zendesk brands whose tickets will be processed.
- **1.2 Ticket Retrieval:** Queries Zendesk for tickets created in the last 24 hours for the specified brands.
- **1.3 Ticket Preparation:** Simplifies and structures ticket data for AI processing.
- **1.4 AI Tagging Agent:** Uses GPT-4.1-mini to analyze tickets and determine which tags to apply based on custom rules.
- **1.5 Ticket Update:** Updates Zendesk tickets with the new tags suggested by the AI agent.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Execution & Brand Setup

**Overview:**  
This block triggers the workflow once every 24 hours and sets which Zendesk brands' tickets should be processed.

**Nodes Involved:**  
- Schedule Trigger  
- Set Zendesk brands  
- Sticky Note (defining brand IDs)

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates the workflow daily at 10:00 AM.  
  - Configuration: Runs once per day at hour 10.  
  - Inputs: None  
  - Outputs: Triggers next node (Set Zendesk brands)  
  - Edge Cases: If the server time zone differs from Zendesk, ticket retrieval timing may mismatch.  
  - No special version dependencies.

- **Set Zendesk brands**  
  - Type: Set  
  - Role: Defines a string containing Zendesk brand IDs to filter tickets.  
  - Configuration: Assigns a string with brand identifiers (e.g., "brand:brand_id1 brand:brand_id2 brand:brand_id3").  
  - Key Expression: Hardcoded string listing brands separated by spaces, formatted for Zendesk query.  
  - Inputs: Trigger from Schedule Trigger  
  - Outputs: Passes brand string to Get tickets node  
  - Edge Cases: Brand IDs must be valid and match Zendesk; invalid IDs cause empty results.  
  - Sticky Note attached explains to replace these placeholder brand IDs with actual ones.

- **Sticky Note**  
  - Content: "Define the brand ids of the brands which you want the agent to tag their tickets"  
  - Context: Explains purpose of Set Zendesk brands node.

#### 1.2 Ticket Retrieval

**Overview:**  
Fetches all Zendesk tickets created in the last 24 hours for the specified brands.

**Nodes Involved:**  
- Get tickets  
- Sticky Note (explaining query)

**Node Details:**

- **Get tickets**  
  - Type: Zendesk  
  - Role: Retrieves tickets matching query criteria.  
  - Configuration:  
    - Operation: getAll  
    - Query: `created>{{$now.minus({hours: 24})}} {{ $json.brands }}` — fetches tickets created within last 24 hours and for specified brands.  
    - Sort: By creation date descending  
    - Return All: true (fetches all matching tickets)  
  - Credentials: Zendesk API connection (Woodoku account)  
  - Inputs: From Set Zendesk brands  
  - Outputs: Array of ticket objects to Prepare tickets for the agent  
  - Edge Cases: Query syntax errors, API rate limits, auth errors; no tickets found if brands or timing is wrong.  
  - Sticky Note: "Fetch tickets created in the last 24 hours"

- **Sticky Note**  
  - Content: "Fetch tickets created in the last 24 hours"  
  - Context: Explains purpose of Get tickets node.

#### 1.3 Ticket Preparation

**Overview:**  
Simplifies the tickets' data to only necessary fields and translates brand IDs to brand names for easier AI processing.

**Nodes Involved:**  
- Prepare tickets for the agent  
- Sticky Note (instructions on brand and field mapping)

**Node Details:**

- **Prepare tickets for the agent**  
  - Type: Set  
  - Role: Extracts and remaps ticket fields: id, subject, description, brand name, and existing tags.  
  - Configuration:  
    - Maps:  
      - `id` → ticket numerical ID  
      - `subject` → ticket subject string  
      - `description` → ticket description string  
      - `brand` → converts brand_id (from ticket) to a human-readable brand name using a lookup object (replace placeholders with actual brand IDs/names)  
      - `existing_tags` → current tags array on the ticket  
  - Inputs: From Get tickets node  
  - Outputs: Simplified ticket objects to AI Agent - Tag tickets node  
  - Edge Cases: Missing brand IDs or tags; brand mapping fallback to empty string if unknown brand_id.  
  - Sticky Note: "Get rid of the ticket fields the agent does not need. Replace brand_idX and brand_nameX with the actual brand ids and names"

- **Sticky Note**  
  - Content: "Get rid of the ticket fields the agent does not need. Replace brand_idX and brand_nameX with the actual brand ids and names"  
  - Context: Instructions for preparing data for AI.

#### 1.4 AI Tagging Agent

**Overview:**  
Analyzes each ticket's content and assigns tags based on predefined conditions using GPT-4.1-mini language model.

**Nodes Involved:**  
- OpenAI Chat Model  
- AI Agent - Tag tickets  
- Sticky Note (tagging rules instructions)

**Node Details:**

- **OpenAI Chat Model**  
  - Type: Langchain OpenAI Chat Model  
  - Role: Provides GPT-4.1-mini model for generating AI outputs.  
  - Configuration: Uses "gpt-4.1-mini" model, no special options.  
  - Credentials: OpenAI API credentials  
  - Inputs: None (invoked internally by AI Agent node via ai_languageModel connection)  
  - Outputs: AI completions to AI Agent - Tag tickets  
  - Edge Cases: API quota limit, network errors, model unavailability.

- **AI Agent - Tag tickets**  
  - Type: Langchain Agent  
  - Role: Receives tickets data, applies tagging logic via AI, and triggers Zendesk ticket update tool with new tags.  
  - Configuration:  
    - Text prompt includes:  
      - Instructions to analyze tickets and assign tags according to custom rules (placeholders: tag_nameX and conditionX to be replaced by user)  
      - Requirement to preserve existing tags  
      - Ticket data passed as JSON string  
    - System message describes agent role and input fields.  
    - Prompt type: define (structured AI prompt)  
  - Inputs: From Prepare tickets for the agent (main), and OpenAI Chat Model (ai_languageModel)  
  - Outputs: Sends update commands to Zendesk update node (ai_tool), and AI completions.  
  - Edge Cases: AI misinterpretation of rules, failure to preserve tags, errors in prompt formatting, Zendesk API update errors.  
  - Sticky Note: "Replace \"tag_nameX\" and \"conditionX\" with your tags and conditions for the agent to tag the ticket with that tag (For example: \"if the ticket description contains words X, Y Z\")"

- **Sticky Note**  
  - Content: "Replace \"tag_nameX\" and \"conditionX\" with your tags and conditions for the agent to tag the ticket with that tag (For example: \"if the ticket description contains words X, Y Z\")"  
  - Context: Instructions for customizing AI tagging logic.

#### 1.5 Ticket Update

**Overview:**  
Updates each Zendesk ticket with the tags determined by the AI agent, preserving existing tags.

**Nodes Involved:**  
- Update a ticket in Zendesk

**Node Details:**

- **Update a ticket in Zendesk**  
  - Type: Zendesk Tool  
  - Role: Updates the tags field of a Zendesk ticket.  
  - Configuration:  
    - Operation: update  
    - Ticket ID: set dynamically from AI output field `Ticket_ID`  
    - Tags: set dynamically from AI output field `Tag_Names_or_IDs` (can be single or multiple tags)  
    - Description: manual entry (static)  
    - Tool description clarifies this node’s purpose is to add or overwrite tags on tickets.  
  - Credentials: Zendesk API credentials (same as Get tickets)  
  - Inputs: From AI Agent - Tag tickets (ai_tool connection)  
  - Outputs: Result of ticket update operation (not connected further)  
  - Edge Cases: Invalid ticket ID, invalid tag names, API rate limits, auth failures.  
  - Sticky Note: None specific.

---

### 3. Summary Table

| Node Name               | Node Type                            | Functional Role                          | Input Node(s)              | Output Node(s)                  | Sticky Note                                                                                         |
|-------------------------|------------------------------------|----------------------------------------|----------------------------|---------------------------------|---------------------------------------------------------------------------------------------------|
| Schedule Trigger        | Schedule Trigger                   | Starts workflow daily at 10:00 AM      | None                       | Set Zendesk brands              | Runs once every 24 hours                                                                           |
| Set Zendesk brands      | Set                                | Defines brands to filter tickets        | Schedule Trigger            | Get tickets                    | Define the brand ids of the brands which you want the agent to tag their tickets                   |
| Get tickets             | Zendesk                            | Fetch tickets created in last 24 hours | Set Zendesk brands          | Prepare tickets for the agent  | Fetch tickets created in the last 24 hours                                                        |
| Prepare tickets for the agent | Set                            | Simplifies ticket data for AI            | Get tickets                 | AI Agent - Tag tickets          | Get rid of the ticket fields the agent does not need. Replace brand_idX and brand_nameX with actual IDs and names |
| OpenAI Chat Model       | Langchain OpenAI Chat Model         | Provides GPT-4.1-mini language model   | None (used internally)       | AI Agent - Tag tickets          |                                                                                                   |
| AI Agent - Tag tickets  | Langchain Agent                    | Determines tags based on ticket content| Prepare tickets for the agent, OpenAI Chat Model | Update a ticket in Zendesk | Replace "tag_nameX" and "conditionX" with your tags and conditions for tagging tickets             |
| Update a ticket in Zendesk | Zendesk Tool                     | Updates Zendesk tickets with tags      | AI Agent - Tag tickets       | None                          |                                                                                                   |
| Sticky Note             | Sticky Note                       | Instruction on brands                   | None                       | None                          | Define the brand ids of the brands which you want the agent to tag their tickets                   |
| Sticky Note1            | Sticky Note                       | Instruction on ticket retrieval         | None                       | None                          | Fetch tickets created in the last 24 hours                                                        |
| Sticky Note2            | Sticky Note                       | Instruction on schedule                  | None                       | None                          | Runs once every 24 hours                                                                           |
| Sticky Note3            | Sticky Note                       | Instruction on ticket preparation       | None                       | None                          | Get rid of the ticket fields the agent does not need. Replace brand_idX and brand_nameX with actual IDs and names |
| Sticky Note4            | Sticky Note                       | Instruction on AI tagging rules          | None                       | None                          | Replace "tag_nameX" and "conditionX" with your tags and conditions for the agent                  |
| Sticky Note5            | Sticky Note                       | General workflow overview and setup     | None                       | None                          | ## Auto-tag Zendesk Tickets using Zendesk API and OpenAI. See workflow description in notes below |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Set to trigger once every 24 hours at 10:00 AM.

2. **Create a Set node named "Set Zendesk brands"**  
   - Add a string field named `brands`.  
   - Assign brands as a string in the format: `"brand:brand_id1 brand:brand_id2 brand:brand_id3"` (replace with actual brand IDs).  
   - Connect Schedule Trigger → Set Zendesk brands.

3. **Create a Zendesk node named "Get tickets"**  
   - Credentials: Connect your Zendesk API credentials.  
   - Operation: getAll  
   - Options: Set query to:  
     `created>{{$now.minus({hours: 24})}} {{ $json.brands }}` (this uses the brands string from previous node).  
   - Sort by `created_at` descending.  
   - Return All: true.  
   - Connect Set Zendesk brands → Get tickets.

4. **Create a Set node named "Prepare tickets for the agent"**  
   - Map the following fields from each ticket:  
     - `id`: `={{$json.id}}` (number)  
     - `subject`: `={{$json.subject}}` (string)  
     - `description`: `={{$json.description}}` (string)  
     - `brand`: Use an expression mapping brand IDs to brand names, e.g.:  
       ```js
       ={
         brand_id1: "brand_name1",
         brand_id2: "brand_name2",
         brand_id3: "brand_name3",
         brand_id4: "brand_name4"
       }[$json.brand_id] || ""
       ```  
       Replace brand_idX and brand_nameX with your actual values.  
     - `existing_tags`: `={{$json.tags}}` (array)  
   - Connect Get tickets → Prepare tickets for the agent.

5. **Create an OpenAI Chat Model node**  
   - Type: Langchain OpenAI Chat Model  
   - Model: Select "gpt-4.1-mini".  
   - Credentials: Connect your OpenAI API credentials.

6. **Create a Langchain Agent node named "AI Agent - Tag tickets"**  
   - Credentials: Use OpenAI API credentials.  
   - Text prompt:  
     ```
     Analyse each ticket and set a tag according to the rules below:

     1. Tag to tag the ticket with: tag_name1 | Condition: condition1
     2. Tag to tag the ticket with: tag_name2 | Condition: condition2
     3. Tag to tag the ticket with: tag_name3 | Condition: condition3

     If a ticket meets more than one of the conditions above, tag the ticket with the tags of all of those conditions.

     If the ticket already has any existing tags, make sure you tag the ticket again with those existing tags as well as the new ones.

     When tagging a ticket you need to use the id of the ticket and the tag itself.

     These are the tickets:
     {{$json.toJsonString()}}
     ```  
     Replace `tag_nameX` and `conditionX` placeholders with your actual tag names and conditions (e.g., "if the ticket description contains 'refund'").  
   - System Message:  
     ```
     You are an agent whose job is to review Zendesk tickets created by the users of an application. Users create Zendesk tickets when they have a complaint or when they want to share some feedback. Your job is to review the content of the ticket and tag tickets with relevant tags using the Zendesk ticket update tool available to you.

     Each ticket contains the following fields:
     1. id: Numerical id of the ticket.
     2. subject: subject of the ticket as set by the user
     3. description: description of the ticket  as set by the user
     4. brand: brand of the application
     5. existing_tags: the tags which the ticket is currently tagged with
     ```  
   - Prompt Type: define  
   - Connect Prepare tickets for the agent (main) → AI Agent - Tag tickets.  
   - Connect OpenAI Chat Model (ai_languageModel) → AI Agent - Tag tickets.

7. **Create a Zendesk Tool node named "Update a ticket in Zendesk"**  
   - Credentials: Zendesk API credentials.  
   - Operation: update.  
   - Ticket ID: Set dynamically from AI output field `Ticket_ID`.  
   - Tags: Set dynamically from AI output field `Tag_Names_or_IDs`, which can be a single tag or array of tags.  
   - Description Type: manual (static).  
   - Connect AI Agent - Tag tickets (ai_tool) → Update a ticket in Zendesk.

8. **Optional: Add Sticky Notes for documentation**  
   - Add notes describing each block's purpose and instructions for replacing placeholders such as brand IDs, brand names, tag names, and conditions.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                        | Context or Link                                                                                                                                                     |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Workflow automatically reviews new Zendesk tickets and tags them using OpenAI’s GPT-4.1-mini model. Runs daily, filters by brand, preserves existing tags, and applies new tags based on customizable AI-driven rules.                                  | Workflow description; useful for support teams to automate ticket categorization and improve efficiency.                                                          |
| Replace placeholder brand IDs/names and tag rules with your actual data before running. Connect Zendesk and OpenAI accounts properly.                                                                                                            | Setup instructions inside Sticky Note5 and nodes' comments.                                                                                                       |
| OpenAI GPT-4.1-mini is used for cost-efficient AI processing with good contextual understanding. Ensure API quotas and credentials are valid to avoid failures.                                                                                     | Model choice note.                                                                                                                                                |
| The Zendesk query filters tickets created in the last 24 hours using a dynamic timestamp and brand filters. Adjust schedule or query as needed for different intervals or brands.                                                                     | Query syntax: `created>{{$now.minus({hours: 24})}} {{ $json.brands }}`                                                                                             |
| AI Agent prompt must be adapted to reflect your real tagging conditions and tag names to ensure accurate tagging.                                                                                                                                    | See Sticky Note4 for instructions on customizing tagging logic.                                                                                                   |
| For troubleshooting, monitor API rate limits, authentication validity, and network connectivity for both Zendesk and OpenAI integrations.                                                                                                          | Integration reliability best practices.                                                                                                                           |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with current content policies and contains no illegal, offensive, or protected content. All handled data is legal and public.