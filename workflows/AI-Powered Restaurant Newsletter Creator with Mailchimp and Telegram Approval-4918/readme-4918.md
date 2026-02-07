AI-Powered Restaurant Newsletter Creator with Mailchimp and Telegram Approval

https://n8nworkflows.xyz/workflows/ai-powered-restaurant-newsletter-creator-with-mailchimp-and-telegram-approval-4918


# AI-Powered Restaurant Newsletter Creator with Mailchimp and Telegram Approval

### 1. Workflow Overview

This workflow automates the creation and distribution of a restaurant newsletter using AI-powered content generation, human-in-the-loop approval via Telegram, and campaign management through Mailchimp. It is designed to:

- Generate newsletter content based on a scheduled topic
- Split and research newsletter sections using AI agents
- Aggregate and edit the final newsletter content with AI assistance
- Enable human feedback and corrections through Telegram
- Create and send Mailchimp campaigns based on the approved newsletter

**Logical Blocks:**

- **1.1 Input Reception & Scheduling:** Handles schedule triggers and topic input via Telegram.
- **1.2 AI Content Planning and Generation:** Plans newsletter sections, generates content using multiple AI agents, and performs research.
- **1.3 Content Aggregation and Editing:** Merges and aggregates content, then edits the newsletter with AI.
- **1.4 Human-In-The-Loop (HITL) Feedback:** Sends the draft newsletter to Telegram for feedback, checks feedback, and applies corrections.
- **1.5 Campaign Management & Distribution:** Creates and sends Mailchimp campaigns, and notifies via Telegram.
- **1.6 Utility and Control Nodes:** Code nodes, conditionals, and other auxiliary logic.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Scheduling

**Overview:**  
Manages scheduled triggers that initiate newsletter creation and collects the topic from Telegram user input.

**Nodes Involved:**  
- Monday 9am Trigger1  
- Tuesday 4pm Trigger1  
- Friday 2pm Trigger1  
- Saturday 2pm Trigger1  
- Merge All Schedule Triggers1  
- Determine Schedule Name  
- Prompt for Topic on Telegram  
- Listen for Topic Reply  
- Check if Message is a Reply  
- Set Topic from Reply  

**Node Details:**

- **Monday 9am Trigger1, Tuesday 4pm Trigger1, Friday 2pm Trigger1, Saturday 2pm Trigger1**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow execution at specified times.  
  - Config: Set to trigger on respective days and times.  
  - Input: None  
  - Output: Merges into a single stream via `Merge All Schedule Triggers1`.  
  - Failures: Scheduler downtime or misconfiguration could prevent triggering.

- **Merge All Schedule Triggers1**  
  - Type: Merge  
  - Role: Combines multiple schedule triggers into one flow.  
  - Config: Merges all incoming triggers into one output.  
  - Input: Schedule triggers  
  - Output: `Determine Schedule Name`.

- **Determine Schedule Name**  
  - Type: Code  
  - Role: Determines or formats the schedule name for the newsletter issue.  
  - Config: Custom JavaScript to process input data.  
  - Input: Merged triggers  
  - Output: `Prompt for Topic on Telegram`.  
  - Edge Cases: Script errors or unexpected input format.

- **Prompt for Topic on Telegram**  
  - Type: Telegram  
  - Role: Sends a prompt to users to provide the newsletter topic.  
  - Config: Uses Telegram credentials, sends message to chat/group.  
  - Input: Schedule name from previous node.  
  - Output: Waits for user reply.

- **Listen for Topic Reply**  
  - Type: Telegram Trigger  
  - Role: Listens for incoming Telegram messages in response to the prompt.  
  - Config: Linked to Telegram webhook.  
  - Input: Telegram user messages.  
  - Output: `Check if Message is a Reply`.

- **Check if Message is a Reply**  
  - Type: If  
  - Role: Determines if incoming Telegram message is a reply to the prompt.  
  - Conditions: Checks message metadata.  
  - Output: If yes, proceeds to `Set Topic from Reply`, else no output.

- **Set Topic from Reply**  
  - Type: Set  
  - Role: Extracts and stores the newsletter topic from the Telegram reply.  
  - Output: Starts AI processing with `Restaurant Newsletter Expert`.  

---

#### 1.2 AI Content Planning and Generation

**Overview:**  
Plans the newsletter structure and generates section content using specialized AI agents and tools.

**Nodes Involved:**  
- Restaurant Newsletter Expert  
- Newsletter Section Planner  
- Split Newsletter Sections  
- Restaurant Content Research Team  
- Tavily, Tavily1  
- OpenAI Chat Model  
- OpenRouter Chat Model  
- Code (related to research content)  

**Node Details:**

- **Restaurant Newsletter Expert**  
  - Type: LangChain Agent  
  - Role: Main AI agent to define newsletter content based on the topic.  
  - Input: Topic set from Telegram reply.  
  - Output: `Newsletter Section Planner`.  
  - Config: Uses AI model tuned for newsletter expertise.  
  - Failures: AI model API errors, input parsing issues.

- **Newsletter Section Planner**  
  - Type: OpenAI Node  
  - Role: Plans and outlines newsletter sections.  
  - Input: Output from expert agent.  
  - Output: `Split Newsletter Sections`.  
  - Config: OpenAI model parameters for text generation.

- **Split Newsletter Sections**  
  - Type: SplitOut  
  - Role: Splits planned sections into individual items for parallel processing.  
  - Input: Planner output (list of sections).  
  - Output: `Restaurant Content Research Team`.

- **Restaurant Content Research Team**  
  - Type: LangChain Agent  
  - Role: Generates detailed content per newsletter section.  
  - Input: Split sections.  
  - Output: `Code` node for processing research content.  
  - Config: AI model specialized in research and content generation.

- **Code (under Research Content)**  
  - Type: Code  
  - Role: Processes and formats research content for merging.  
  - Input: Research content from agent.  
  - Output: `Merge Research Content`.

- **Merge Research Content**  
  - Type: Merge  
  - Role: Combines multiple research content pieces into a unified data set.  
  - Input: Processed content from `Code`.  
  - Output: `Aggregate Newsletter Content`.

- **Aggregate Newsletter Content**  
  - Type: Aggregate  
  - Role: Aggregates all newsletter content into a single structure.  
  - Input: Merged research content.  
  - Output: `First Newsletter Editor1`.

- **Tavily and Tavily1**  
  - Type: Tavily Tool Nodes (external AI tools)  
  - Role: Supplementary AI tools assisting content generation by feeding into expert and research agents.  
  - Input/Output: Connected as ai_tool inputs to relevant agents.

- **OpenAI Chat Model, OpenRouter Chat Model**  
  - Type: AI Language Models  
  - Role: Provide language model capabilities to agents.  
  - Configuration: Different versions/types of OpenAI and OpenRouter models used for variety or fallback.

---

#### 1.3 Content Aggregation and Editing

**Overview:**  
Edits and refines the entire newsletter content using AI agents before sending for human approval.

**Nodes Involved:**  
- First Newsletter Editor1  
- Set Intent  
- HITL (Human In The Loop) Telegram Node  
- Check Feedback  
- Feedback AI  
- Correction Agent  
- Merge  
- Final Newsletter Editor  
- OpenAI Chat Model1  
- OpenAI Chat Model2  
- Merge (second instance)  

**Node Details:**

- **First Newsletter Editor1**  
  - Type: LangChain Agent  
  - Role: Performs initial editing of aggregated content.  
  - Input: Aggregated newsletter content.  
  - Output: `Set Intent`.  
  - Config: AI model configured for editorial tasks.

- **Set Intent**  
  - Type: Set  
  - Role: Prepares data and sets flags for HITL process and final merging.  
  - Input: Edited newsletter content.  
  - Output: `HITL` and `Merge`.

- **HITL (Telegram)**  
  - Type: Telegram  
  - Role: Sends newsletter draft to Telegram channel/user for human feedback.  
  - Input: Set Intent output.  
  - Output: `Check Feedback`.

- **Check Feedback**  
  - Type: LangChain Text Classifier  
  - Role: Analyzes human feedback to decide if corrections are needed.  
  - Input: HITL Telegram feedback.  
  - Output: Two branches: `Merge` (if feedback positive) or `Correction Agent` (if corrections needed).

- **Feedback AI**  
  - Type: OpenAI Chat Model  
  - Role: Processes feedback text for classification and correction.  
  - Input: Feedback messages.  
  - Output: `Check Feedback` and `Correction Agent`.

- **Correction Agent**  
  - Type: LangChain Agent  
  - Role: Applies corrections to newsletter content based on feedback.  
  - Input: Feedback AI results.  
  - Output: `Set Intent` (loop back for re-approval).

- **Merge (second instance)**  
  - Type: Merge  
  - Role: Combines feedback and edits before final editing.  
  - Input: From `Set Intent` and `Check Feedback`.  
  - Output: `Final Newsletter Editor`.

- **Final Newsletter Editor**  
  - Type: LangChain Agent  
  - Role: Final polish of newsletter content before campaign creation.  
  - Input: Merged content.  
  - Output: `If` node deciding next steps.  
  - Config: Uses OpenAI Chat Model1 for editing.

---

#### 1.4 Campaign Management & Distribution

**Overview:**  
Creates and sends campaigns in Mailchimp with the final newsletter, and sends notifications via Telegram.

**Nodes Involved:**  
- If  
- Get_Subcribers  
- Create_Campaign  
- Set_Campaign  
- Send_Campaign  
- Telegram  
- Gmail1  

**Node Details:**

- **If**  
  - Type: If  
  - Role: Determines if the campaign should be sent or if an alternative path is taken (e.g., send email via Gmail).  
  - Input: Final Newsletter Editor output.  
  - Output: `Get_Subcribers` (true branch), `Gmail1` (false branch).

- **Get_Subcribers**  
  - Type: Mailchimp  
  - Role: Retrieves subscriber list for the campaign.  
  - Config: Requires Mailchimp API credentials.  
  - Input: True branch from `If`.  
  - Output: `Create_Campaign`.

- **Create_Campaign**  
  - Type: HTTP Request  
  - Role: Calls Mailchimp API to create a new campaign.  
  - Input: Subscriber data.  
  - Output: `Set_Campaign`.

- **Set_Campaign**  
  - Type: HTTP Request  
  - Role: Sets campaign content using Mailchimp API.  
  - Input: Created campaign data.  
  - Output: `Send_Campaign`.

- **Send_Campaign**  
  - Type: HTTP Request  
  - Role: Sends the Mailchimp campaign.  
  - Input: Campaign data.  
  - Output: `Telegram`.

- **Telegram**  
  - Type: Telegram  
  - Role: Sends notification that the campaign has been sent.  
  - Input: From `Send_Campaign`.  
  - Output: None (end).

- **Gmail1**  
  - Type: Gmail  
  - Role: Alternative sending path via Gmail if Mailchimp path is not taken.  
  - Input: False branch from `If`.  
  - Output: `If` (loop or next step).

---

#### 1.5 Utility and Control Nodes

**Overview:**  
Auxiliary nodes for workflow control, documentation, and miscellaneous processing.

**Nodes Involved:**  
- Sticky Note, Sticky Note1, Enhanced Workflow Documentation, Part 1 Docs, Part 2 Docs  
- Code (general)  
- Merge nodes (various)  

**Node Details:**

- **Sticky Note Nodes**  
  - Type: Sticky Note  
  - Role: Hold documentation or comments inside the workflow.  
  - Content: Mostly empty, placeholders for notes.

- **Code Nodes**  
  - Type: Code  
  - Role: Custom JS for formatting, data transformation, or logic.  
  - Located in research content and scheduling blocks.

- **Merge Nodes**  
  - Used throughout to combine multiple inputs or synchronize parallel branches.

---

### 3. Summary Table

| Node Name                   | Node Type                          | Functional Role                          | Input Node(s)                       | Output Node(s)                   | Sticky Note |
|-----------------------------|----------------------------------|----------------------------------------|-----------------------------------|---------------------------------|-------------|
| Monday 9am Trigger1          | Schedule Trigger                 | Trigger workflow Monday 9am             | None                              | Merge All Schedule Triggers1     |             |
| Tuesday 4pm Trigger1         | Schedule Trigger                 | Trigger workflow Tuesday 4pm            | None                              | Merge All Schedule Triggers1     |             |
| Friday 2pm Trigger1          | Schedule Trigger                 | Trigger workflow Friday 2pm             | None                              | Merge All Schedule Triggers1     |             |
| Saturday 2pm Trigger1        | Schedule Trigger                 | Trigger workflow Saturday 2pm           | None                              | Merge All Schedule Triggers1     |             |
| Merge All Schedule Triggers1 | Merge                           | Combine schedule triggers                | Monday 9am, Tuesday 4pm, Friday 2pm, Saturday 2pm | Determine Schedule Name        |             |
| Determine Schedule Name      | Code                            | Format schedule name                     | Merge All Schedule Triggers1       | Prompt for Topic on Telegram     |             |
| Prompt for Topic on Telegram | Telegram                        | Send topic prompt to Telegram users     | Determine Schedule Name            | Listen for Topic Reply           |             |
| Listen for Topic Reply       | Telegram Trigger               | Listen for Telegram replies              | Telegram user messages             | Check if Message is a Reply      |             |
| Check if Message is a Reply  | If                             | Check if Telegram message is a reply    | Listen for Topic Reply             | Set Topic from Reply             |             |
| Set Topic from Reply         | Set                            | Store topic from Telegram reply         | Check if Message is a Reply        | Restaurant Newsletter Expert     |             |
| Restaurant Newsletter Expert | LangChain Agent                | Generate newsletter content plan        | Set Topic from Reply               | Newsletter Section Planner       |             |
| Newsletter Section Planner   | OpenAI                         | Plan newsletter sections                 | Restaurant Newsletter Expert       | Split Newsletter Sections        |             |
| Split Newsletter Sections    | SplitOut                       | Split sections for parallel processing  | Newsletter Section Planner         | Restaurant Content Research Team |             |
| Restaurant Content Research Team | LangChain Agent            | Generate detailed content per section   | Split Newsletter Sections          | Code (Research Content)          |             |
| Code (Research Content)      | Code                           | Process research content                 | Restaurant Content Research Team   | Merge Research Content           |             |
| Merge Research Content       | Merge                          | Combine section content pieces           | Code (Research Content)            | Aggregate Newsletter Content     |             |
| Aggregate Newsletter Content | Aggregate                      | Aggregate all content into one structure | Merge Research Content             | First Newsletter Editor1         |             |
| First Newsletter Editor1     | LangChain Agent                | Initial newsletter editing               | Aggregate Newsletter Content       | Set Intent                      |             |
| Set Intent                  | Set                             | Prepare for human review and merging    | First Newsletter Editor1           | HITL, Merge                     |             |
| HITL                        | Telegram                       | Send draft newsletter for feedback      | Set Intent                        | Check Feedback                  |             |
| Check Feedback              | LangChain Text Classifier       | Analyze feedback for approval or correction | HITL                            | Merge (approved), Correction Agent (correction) |             |
| Feedback AI                 | OpenAI Chat Model               | Process feedback text                    | HITL                             | Check Feedback, Correction Agent |             |
| Correction Agent            | LangChain Agent                | Apply corrections based on feedback     | Feedback AI                      | Set Intent                     |             |
| Merge (second instance)      | Merge                          | Combine feedback and edits               | Set Intent, Check Feedback        | Final Newsletter Editor         |             |
| Final Newsletter Editor      | LangChain Agent                | Final newsletter polish                  | Merge (second instance)            | If                             |             |
| If                         | If                             | Decide sending method (Mailchimp or Gmail) | Final Newsletter Editor           | Get_Subcribers (true), Gmail1 (false) |             |
| Get_Subcribers              | Mailchimp                      | Retrieve campaign subscribers            | If (true branch)                  | Create_Campaign                |             |
| Create_Campaign             | HTTP Request                   | Create Mailchimp campaign                | Get_Subcribers                   | Set_Campaign                  |             |
| Set_Campaign                | HTTP Request                   | Set campaign content                     | Create_Campaign                  | Send_Campaign                 |             |
| Send_Campaign               | HTTP Request                   | Send Mailchimp campaign                  | Set_Campaign                   | Telegram                     |             |
| Telegram                    | Telegram                      | Notify about campaign sent               | Send_Campaign                  | None                          |             |
| Gmail1                      | Gmail                         | Alternative email sending path           | If (false branch)                | If                            |             |
| Tavily                     | Tavily Tool                   | Assist content research agent            | None                            | Restaurant Content Research Team |             |
| Tavily1                    | Tavily Tool                   | Assist newsletter expert agent           | None                            | Restaurant Newsletter Expert     |             |
| OpenAI Chat Model           | OpenAI Language Model          | Language model for various agents        | None                            | Restaurant Newsletter Expert, Final Newsletter Editor |             |
| OpenAI Chat Model1          | OpenAI Language Model          | Language model for final editor           | None                            | Final Newsletter Editor         |             |
| OpenAI Chat Model2          | OpenAI Language Model          | Language model for first newsletter editor | None                          | First Newsletter Editor1        |             |
| OpenRouter Chat Model       | OpenRouter Language Model      | Alternate language model for content research | None                        | Restaurant Content Research Team |             |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Triggers:**  
   - Create four Schedule Trigger nodes set for Monday 9am, Tuesday 4pm, Friday 2pm, Saturday 2pm.  
   - Connect all outputs into a Merge node (`Merge All Schedule Triggers1`).

2. **Determine Schedule Name:**  
   - Add a Code node connected to the Merge node.  
   - Write JavaScript to format or generate the newsletter issue name based on the schedule trigger.

3. **Prompt for Topic on Telegram:**  
   - Add a Telegram node connected to the Code node.  
   - Configure with Telegram credentials.  
   - Set message prompting user for newsletter topic.

4. **Listen for Telegram Reply:**  
   - Add a Telegram Trigger node to listen for incoming messages.  
   - Connect to an If node to check if the message is a reply.  
   - If yes, connect to a Set node to extract and store the topic.

5. **Restaurant Newsletter Expert Agent:**  
   - Add a LangChain Agent node configured as a newsletter expert.  
   - Connect input from the Set Topic node.

6. **Newsletter Section Planner (OpenAI):**  
   - Add an OpenAI node for planning newsletter sections.  
   - Connect from the expert agent output.

7. **Split Newsletter Sections:**  
   - Add a SplitOut node to split planned sections for parallel processing.  
   - Connect from the planner.

8. **Restaurant Content Research Team Agent:**  
   - Add a LangChain Agent node for content research.  
   - Connect input from the SplitOut node.

9. **Tavily Nodes:**  
   - Add Tavily nodes as AI tool inputs to the expert and research agents.

10. **Research Content Processing:**  
    - Add a Code node to process content from research agent.  
    - Connect output to a Merge node to combine all research content.

11. **Aggregate Newsletter Content:**  
    - Add an Aggregate node connected to the Merge node.

12. **First Newsletter Editor:**  
    - Add a LangChain Agent node for initial editing.  
    - Connect from the aggregator.

13. **Set Intent:**  
    - Add a Set node to prepare data for HITL and merging.  
    - Connect from the first editor.

14. **Human-In-The-Loop Telegram Node:**  
    - Add a Telegram node to send the draft for feedback.  
    - Connect from Set Intent.

15. **Check Feedback:**  
    - Add a LangChain Text Classifier node to analyze feedback.  
    - Connect from Telegram node.

16. **Feedback AI and Correction Agent:**  
    - Add OpenAI Chat Model node for feedback processing.  
    - Add a LangChain Agent node for correction.  
    - Connect outputs accordingly: feedback AI to classifier and correction agent; correction agent loops back to Set Intent.

17. **Merge Feedback and Edits:**  
    - Add a Merge node to combine feedback results and edits.  
    - Connect from Set Intent and Check Feedback.

18. **Final Newsletter Editor:**  
    - Add a LangChain Agent node for final polish.  
    - Connect from the Merge node.

19. **Conditional Sending Path:**  
    - Add an If node to decide between Mailchimp campaign or Gmail sending.

20. **Mailchimp Campaign Creation:**  
    - Add Mailchimp node to get subscribers.  
    - Add HTTP Request nodes to create campaign, set campaign content, and send campaign in Mailchimp.  
    - Connect sequentially.

21. **Telegram Notification:**  
    - Add Telegram node to notify campaign sent.  
    - Connect from Send Campaign node.

22. **Gmail Node:**  
    - Add Gmail node connected to the false branch of If node as an alternative sending method.

23. **Credential Setup:**  
    - Configure credentials for Telegram, OpenAI, OpenRouter, Mailchimp, Gmail, and Tavily nodes.

24. **Testing and Debugging:**  
    - Test each branch and node for correct input/output.  
    - Handle API limits, authentication errors, and edge cases such as missing topic replies or feedback timeouts.

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                           |
|--------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| Workflow integrates AI content generation with human feedback via Telegram and Mailchimp sending. | Main project purpose.                                     |
| Uses LangChain agents and OpenAI models extensively for content creation and editing.             | AI technology stack.                                     |
| Telegram is used for prompt and feedback collection enabling HITL (Human In The Loop) process.    | Feedback mechanism.                                      |
| Mailchimp API is used for campaign creation and distribution.                                     | Mailing list management.                                 |
| Tavily nodes provide additional AI tool support for enhanced content generation.                  | External AI tool integration.                            |
| Workflow scheduling supports multiple time slots to trigger newsletter creation.                   | Scheduling flexibility.                                  |
| Ensure API keys and credentials are securely configured for all third-party services.              | Security and access management.                          |

---

**Disclaimer:**  
The content provided is exclusively derived from an automated workflow created with n8n, respecting all applicable content policies and containing no illegal or protected material. All processed data is legal and public.