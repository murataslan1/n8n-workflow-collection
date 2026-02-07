AI News Research Team: 24/7 Newsletter Automation with Citations with Perplexity

https://n8nworkflows.xyz/workflows/ai-news-research-team--24-7-newsletter-automation-with-citations-with-perplexity-2778


# AI News Research Team: 24/7 Newsletter Automation with Citations with Perplexity

### 1. Workflow Overview

This workflow automates the creation of detailed, well-researched newsletters by continuously monitoring specified news topics using AI agents and the Perplexity API. It is designed for users who want to generate daily or periodic newsletters on topics like Bitcoin, Nvidia, etc., with automatic citation of sources and direct email delivery.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception & Scheduling:** Periodic triggering and retrieval of monitored news topics from Google Sheets.
- **1.2 Research Leadership & Planning:** The Research Leader agent analyzes topics and creates a research plan, delegating tasks to assistants.
- **1.3 Research Assistance & Data Gathering:** Research Assistants perform detailed research on subtopics, leveraging Perplexity AI and OpenAI models.
- **1.4 Content Assembly & Editing:** Merging research outputs, polishing the final newsletter content, and generating titles.
- **1.5 Output Delivery:** Sending the completed newsletter via Gmail.
- **1.6 Auxiliary & Utility Nodes:** Nodes handling API requests, markdown formatting, and workflow control.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception & Scheduling

**Overview:**  
This block triggers the workflow on a schedule and retrieves the list of news topics to monitor from Google Sheets. It loops over each topic to process them individually.

**Nodes Involved:**  
- Schedule Trigger  
- News to Monitor (Google Sheets)  
- Loop Over Items  
- Settings  
- Switch

**Node Details:**

- **Schedule Trigger**  
  - Type: Schedule Trigger  
  - Role: Initiates workflow execution on a defined schedule (e.g., daily).  
  - Config: Default schedule parameters (likely daily).  
  - Inputs: None  
  - Outputs: News to Monitor  
  - Edge Cases: Missed triggers if n8n server is down; schedule misconfiguration.

- **News to Monitor**  
  - Type: Google Sheets  
  - Role: Reads the list of news topics to monitor from a Google Sheet.  
  - Config: Connected to a Google Sheets document containing topics like Bitcoin, Nvidia, etc.  
  - Inputs: Schedule Trigger  
  - Outputs: Loop Over Items  
  - Edge Cases: API authentication errors; empty or malformed sheet data.

- **Loop Over Items**  
  - Type: Split In Batches  
  - Role: Processes each news topic individually in a loop.  
  - Config: Batch size likely 1 to handle topics sequentially.  
  - Inputs: News to Monitor  
  - Outputs: Settings (for main processing) and empty output for parallel processing.  
  - Edge Cases: Large number of topics may cause long execution times.

- **Settings**  
  - Type: Set  
  - Role: Sets workflow parameters such as report type (detailed/simple) and time window for news gathering.  
  - Config: Static or dynamic parameters for filtering and report preferences.  
  - Inputs: Loop Over Items  
  - Outputs: Switch  
  - Edge Cases: Incorrect parameter values may cause logic errors downstream.

- **Switch**  
  - Type: Switch  
  - Role: Routes execution based on conditions, e.g., whether to use the News Reporter or Research Leader agent.  
  - Config: Conditional logic based on settings or topic attributes.  
  - Inputs: Settings  
  - Outputs: News Reporter (main branch 1), Research Leader (main branch 2)  
  - Edge Cases: Misconfigured conditions may cause wrong routing.

---

#### 1.2 Research Leadership & Planning

**Overview:**  
This block uses the Research Leader AI agent to analyze the topic, create a content outline, and plan the research tasks. The Project Planner breaks down the research into specific subtasks.

**Nodes Involved:**  
- Research Leader 🔬  
- Perplexity_tool2  
- OpenAI Chat Model5  
- Project Planner  
- OpenAI Chat Model2  
- Structured Output Parser  
- Delegate to Research Assistants  
- Split Out (Delegate to Research Assistants)

**Node Details:**

- **Research Leader 🔬**  
  - Type: LangChain Agent  
  - Role: Acts as the lead AI researcher analyzing the topic and generating a research plan.  
  - Config: Uses OpenAI Chat Model5 and Perplexity_tool2 as AI tools.  
  - Inputs: Switch (branch for Research Leader)  
  - Outputs: Project Planner  
  - Edge Cases: API rate limits; failure in AI response; incomplete or ambiguous plans.

- **Perplexity_tool2**  
  - Type: LangChain Tool Workflow  
  - Role: Provides real-time information retrieval via Perplexity API to the Research Leader.  
  - Inputs: Research Leader 🔬 (ai_tool)  
  - Outputs: Research Leader 🔬  
  - Edge Cases: API authentication errors; timeouts.

- **OpenAI Chat Model5**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Language model used by Research Leader for generating plans and analysis.  
  - Inputs: Research Leader 🔬 (ai_languageModel)  
  - Outputs: Research Leader 🔬  
  - Edge Cases: API quota exceeded; model unavailability.

- **Project Planner**  
  - Type: LangChain Agent  
  - Role: Breaks down the research plan into specific tasks for assistants.  
  - Config: Uses OpenAI Chat Model2 and Structured Output Parser.  
  - Inputs: Research Leader 🔬  
  - Outputs: Delegate to Research Assistants  
  - Edge Cases: Parsing errors; incomplete task breakdown.

- **OpenAI Chat Model2**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Language model used by Project Planner for task decomposition.  
  - Inputs: Project Planner (ai_languageModel)  
  - Outputs: Project Planner  
  - Edge Cases: Same as other OpenAI nodes.

- **Structured Output Parser**  
  - Type: LangChain Output Parser Structured  
  - Role: Parses structured AI outputs into usable data formats for downstream nodes.  
  - Inputs: Project Planner (ai_outputParser)  
  - Outputs: Project Planner  
  - Edge Cases: Parsing failures due to unexpected AI output format.

- **Delegate to Research Assistants**  
  - Type: Split Out  
  - Role: Splits the planned tasks to be assigned to Research Assistants.  
  - Inputs: Project Planner  
  - Outputs: Research Assistant (main branch 0), Merge chapters title and text (main branch 1)  
  - Edge Cases: Empty task list; splitting errors.

---

#### 1.3 Research Assistance & Data Gathering

**Overview:**  
Research Assistants perform detailed research on assigned subtasks using AI models and Perplexity API tools. Their outputs are merged for further processing.

**Nodes Involved:**  
- Research Assistant  
- Perplexity_tool1  
- OpenAI Chat Model4  
- Merge chapters title and text  
- Final article text  
- OpenAI Chat Model6

**Node Details:**

- **Research Assistant**  
  - Type: LangChain Agent  
  - Role: Conducts detailed research on assigned subtopics.  
  - Config: Uses OpenAI Chat Model4 and Perplexity_tool1.  
  - Inputs: Delegate to Research Assistants  
  - Outputs: Merge chapters title and text  
  - Edge Cases: API failures; incomplete research; retry enabled.

- **Perplexity_tool1**  
  - Type: LangChain Tool Workflow  
  - Role: Provides real-time data retrieval for Research Assistants via Perplexity API.  
  - Inputs: Research Assistant (ai_tool)  
  - Outputs: Research Assistant  
  - Edge Cases: API errors; rate limits.

- **OpenAI Chat Model4**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Language model supporting Research Assistant in generating research content.  
  - Inputs: Research Assistant (ai_languageModel)  
  - Outputs: Research Assistant  
  - Edge Cases: API quota; model errors.

- **Merge chapters title and text**  
  - Type: Merge  
  - Role: Combines outputs from multiple Research Assistants into a single dataset.  
  - Inputs: Research Assistant, Delegate to Research Assistants (main branch 1)  
  - Outputs: Final article text  
  - Edge Cases: Data mismatch; empty inputs.

- **Final article text**  
  - Type: Code  
  - Role: Processes merged research content, possibly formatting or cleaning text before editing.  
  - Inputs: Merge chapters title and text  
  - Outputs: Editor  
  - Edge Cases: Code execution errors; unexpected data formats.

- **OpenAI Chat Model6**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Used by Editor and Title1 nodes for final content polishing and title generation.  
  - Inputs: Title1, Editor (ai_languageModel)  
  - Outputs: Title1, Editor  
  - Edge Cases: API limits; model errors.

---

#### 1.4 Content Assembly & Editing

**Overview:**  
This block finalizes the newsletter content by editing and generating the newsletter title, then prepares it for email delivery.

**Nodes Involved:**  
- Editor  
- Title1  
- Gmail1  
- Gmail2

**Node Details:**

- **Editor**  
  - Type: LangChain Agent  
  - Role: Combines and polishes the final newsletter content.  
  - Config: Uses OpenAI Chat Model6 for language processing.  
  - Inputs: Final article text  
  - Outputs: Title1  
  - Edge Cases: AI response errors; incomplete editing.

- **Title1**  
  - Type: Chain LLM  
  - Role: Generates the newsletter title based on edited content.  
  - Config: Uses OpenAI Chat Model6.  
  - Inputs: Editor  
  - Outputs: Gmail1  
  - Edge Cases: Title generation failures.

- **Gmail1**  
  - Type: Gmail  
  - Role: Sends the newsletter email to recipients.  
  - Config: Requires Gmail OAuth2 credentials; configured with recipient addresses and email content.  
  - Inputs: Title1  
  - Outputs: Loop Over Items (for possible further processing)  
  - Edge Cases: Authentication errors; email sending failures.

- **Gmail2**  
  - Type: Gmail  
  - Role: Another Gmail node, possibly for sending different or confirmation emails.  
  - Config: Similar to Gmail1 with OAuth2 credentials.  
  - Inputs: Title  
  - Outputs: Loop Over Items  
  - Edge Cases: Same as Gmail1.

---

#### 1.5 Auxiliary & Utility Nodes

**Overview:**  
These nodes handle HTTP requests to Perplexity API, markdown formatting, and workflow execution triggers.

**Nodes Involved:**  
- Perplexity API  
- Execute Workflow Trigger  
- Response  
- Markdown  
- News Reporter  
- Perplexity_tool  
- OpenAI Chat Model  
- Sticky Notes (multiple)

**Node Details:**

- **Perplexity API**  
  - Type: HTTP Request  
  - Role: Directly calls Perplexity API for information retrieval.  
  - Config: Uses Bearer token authentication with Perplexity API key.  
  - Inputs: Execute Workflow Trigger  
  - Outputs: Response  
  - Edge Cases: API errors; network timeouts.

- **Execute Workflow Trigger**  
  - Type: Execute Workflow Trigger  
  - Role: Allows triggering this workflow from other workflows or external sources.  
  - Inputs: External trigger  
  - Outputs: Perplexity API  
  - Edge Cases: Trigger misconfiguration.

- **Response**  
  - Type: Set  
  - Role: Sets or formats the response from Perplexity API for downstream use.  
  - Inputs: Perplexity API  
  - Outputs: None (end node)  
  - Edge Cases: Data formatting errors.

- **Markdown**  
  - Type: Markdown  
  - Role: Converts AI-generated content into markdown format for better readability.  
  - Inputs: News Reporter  
  - Outputs: Title  
  - Edge Cases: Formatting errors.

- **News Reporter**  
  - Type: LangChain Agent  
  - Role: AI agent that reports on news topics using OpenAI Chat Model and Perplexity_tool.  
  - Inputs: Switch (branch 1)  
  - Outputs: Markdown  
  - Edge Cases: API failures; incomplete reports.

- **Perplexity_tool**  
  - Type: LangChain Tool Workflow  
  - Role: Tool workflow providing Perplexity API access to News Reporter.  
  - Inputs: News Reporter (ai_tool)  
  - Outputs: News Reporter  
  - Edge Cases: API errors.

- **OpenAI Chat Model**  
  - Type: LangChain OpenAI Chat Model  
  - Role: Language model used by News Reporter.  
  - Inputs: News Reporter (ai_languageModel)  
  - Outputs: News Reporter  
  - Edge Cases: API limits.

- **Sticky Notes**  
  - Type: Sticky Note  
  - Role: Provide comments and instructions within the workflow canvas.  
  - Inputs/Outputs: None (visual only)  
  - Edge Cases: None.

---

### 3. Summary Table

| Node Name                  | Node Type                          | Functional Role                               | Input Node(s)               | Output Node(s)                    | Sticky Note                                                                                              |
|----------------------------|----------------------------------|-----------------------------------------------|-----------------------------|----------------------------------|--------------------------------------------------------------------------------------------------------|
| Schedule Trigger           | Schedule Trigger                 | Triggers workflow on schedule                  | None                        | News to Monitor                  |                                                                                                        |
| News to Monitor            | Google Sheets                   | Reads monitored news topics                     | Schedule Trigger            | Loop Over Items                  |                                                                                                        |
| Loop Over Items            | Split In Batches                | Processes each news topic individually          | News to Monitor             | Settings (main 0), empty (main 1) |                                                                                                        |
| Settings                  | Set                            | Sets parameters like report type and time window | Loop Over Items             | Switch                         |                                                                                                        |
| Switch                    | Switch                         | Routes execution to News Reporter or Research Leader | Settings                   | News Reporter (main 0), Research Leader (main 1) |                                                                                                        |
| News Reporter             | LangChain Agent                | AI agent reporting on news topics               | Switch                      | Markdown                       |                                                                                                        |
| Markdown                  | Markdown                       | Formats AI output to markdown                    | News Reporter               | Title                         |                                                                                                        |
| Title                     | Chain LLM                     | Generates newsletter title                       | Markdown                    | Gmail2                        |                                                                                                        |
| Gmail2                    | Gmail                         | Sends newsletter email                           | Title                       | Loop Over Items                |                                                                                                        |
| Research Leader 🔬         | LangChain Agent                | Leads research, creates content outline         | Switch                      | Project Planner               |                                                                                                        |
| Perplexity_tool2          | LangChain Tool Workflow        | Provides Perplexity API access to Research Leader | Research Leader 🔬 (ai_tool) | Research Leader 🔬             |                                                                                                        |
| OpenAI Chat Model5        | LangChain OpenAI Chat Model    | Language model for Research Leader               | Research Leader 🔬 (ai_languageModel) | Research Leader 🔬             |                                                                                                        |
| Project Planner           | LangChain Agent                | Breaks down research plan into tasks             | Research Leader 🔬           | Delegate to Research Assistants |                                                                                                        |
| OpenAI Chat Model2        | LangChain OpenAI Chat Model    | Language model for Project Planner                | Project Planner (ai_languageModel) | Project Planner               |                                                                                                        |
| Structured Output Parser  | LangChain Output Parser Structured | Parses AI output into structured data             | Project Planner (ai_outputParser) | Project Planner               |                                                                                                        |
| Delegate to Research Assistants | Split Out                      | Splits tasks for Research Assistants              | Project Planner             | Research Assistant (main 0), Merge chapters title and text (main 1) |                                                                                                        |
| Research Assistant        | LangChain Agent                | Performs detailed research on subtasks            | Delegate to Research Assistants | Merge chapters title and text  |                                                                                                        |
| Perplexity_tool1          | LangChain Tool Workflow        | Provides Perplexity API access to Research Assistant | Research Assistant (ai_tool) | Research Assistant             |                                                                                                        |
| OpenAI Chat Model4        | LangChain OpenAI Chat Model    | Language model for Research Assistant              | Research Assistant (ai_languageModel) | Research Assistant             |                                                                                                        |
| Merge chapters title and text | Merge                          | Combines research outputs                          | Research Assistant, Delegate to Research Assistants (main 1) | Final article text           |                                                                                                        |
| Final article text        | Code                           | Processes merged content before editing           | Merge chapters title and text | Editor                       |                                                                                                        |
| Editor                    | LangChain Agent                | Polishes final newsletter content                  | Final article text          | Title1                       |                                                                                                        |
| Title1                    | Chain LLM                     | Generates final newsletter title                    | Editor                      | Gmail1                       |                                                                                                        |
| Gmail1                    | Gmail                         | Sends final newsletter email                        | Title1                      | Loop Over Items              |                                                                                                        |
| Perplexity API            | HTTP Request                  | Direct Perplexity API calls                         | Execute Workflow Trigger    | Response                     |                                                                                                        |
| Execute Workflow Trigger  | Execute Workflow Trigger       | Allows external triggering of this workflow        | External                   | Perplexity API               |                                                                                                        |
| Response                  | Set                            | Formats Perplexity API response                      | Perplexity API              | None                        |                                                                                                        |
| Perplexity_tool           | LangChain Tool Workflow        | Provides Perplexity API access to News Reporter     | News Reporter (ai_tool)     | News Reporter               |                                                                                                        |
| OpenAI Chat Model         | LangChain OpenAI Chat Model    | Language model for News Reporter                     | News Reporter (ai_languageModel) | News Reporter               |                                                                                                        |
| Sticky Note               | Sticky Note                   | Comments and instructions                            | None                       | None                        | Multiple sticky notes provide guidance and explanations throughout the workflow canvas.                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger node**  
   - Type: Schedule Trigger  
   - Configure to run daily or as desired.

2. **Add Google Sheets node ("News to Monitor")**  
   - Connect to your Google Sheets account.  
   - Configure to read the sheet containing news topics to monitor.

3. **Add Split In Batches node ("Loop Over Items")**  
   - Connect input from "News to Monitor".  
   - Set batch size to 1 for sequential processing.

4. **Add Set node ("Settings")**  
   - Connect input from "Loop Over Items".  
   - Define parameters: report type (detailed/simple), time window (day/week/month), and any other preferences.

5. **Add Switch node ("Switch")**  
   - Connect input from "Settings".  
   - Configure conditions to route to either "News Reporter" or "Research Leader 🔬" based on settings or topic attributes.

6. **Add LangChain Agent node ("News Reporter")**  
   - Connect from Switch (branch 1).  
   - Configure with OpenAI Chat Model and Perplexity_tool for AI research and reporting.

7. **Add LangChain Tool Workflow node ("Perplexity_tool")**  
   - Connect as ai_tool input to "News Reporter".  
   - Configure to call Perplexity API with Bearer token authentication.

8. **Add LangChain OpenAI Chat Model node ("OpenAI Chat Model")**  
   - Connect as ai_languageModel input to "News Reporter".  
   - Configure with OpenAI API credentials.

9. **Add Markdown node ("Markdown")**  
   - Connect input from "News Reporter".  
   - No special configuration needed; converts text to markdown.

10. **Add Chain LLM node ("Title")**  
    - Connect input from "Markdown".  
    - Configure with OpenAI Chat Model for title generation.

11. **Add Gmail node ("Gmail2")**  
    - Connect input from "Title".  
    - Configure with Gmail OAuth2 credentials and email parameters.

12. **Add LangChain Agent node ("Research Leader 🔬")**  
    - Connect from Switch (branch 2).  
    - Configure with OpenAI Chat Model5 and Perplexity_tool2.

13. **Add LangChain Tool Workflow node ("Perplexity_tool2")**  
    - Connect as ai_tool input to "Research Leader 🔬".  
    - Configure Perplexity API access.

14. **Add LangChain OpenAI Chat Model node ("OpenAI Chat Model5")**  
    - Connect as ai_languageModel input to "Research Leader 🔬".  
    - Configure OpenAI credentials.

15. **Add LangChain Agent node ("Project Planner")**  
    - Connect input from "Research Leader 🔬".  
    - Configure with OpenAI Chat Model2 and Structured Output Parser.

16. **Add LangChain OpenAI Chat Model node ("OpenAI Chat Model2")**  
    - Connect as ai_languageModel input to "Project Planner".

17. **Add LangChain Output Parser Structured node ("Structured Output Parser")**  
    - Connect as ai_outputParser input to "Project Planner".

18. **Add Split Out node ("Delegate to Research Assistants")**  
    - Connect input from "Project Planner".  
    - Configure to split tasks for Research Assistants.

19. **Add LangChain Agent node ("Research Assistant")**  
    - Connect from "Delegate to Research Assistants" (main branch 0).  
    - Configure with OpenAI Chat Model4 and Perplexity_tool1.

20. **Add LangChain Tool Workflow node ("Perplexity_tool1")**  
    - Connect as ai_tool input to "Research Assistant".

21. **Add LangChain OpenAI Chat Model node ("OpenAI Chat Model4")**  
    - Connect as ai_languageModel input to "Research Assistant".

22. **Add Merge node ("Merge chapters title and text")**  
    - Connect inputs from "Research Assistant" and "Delegate to Research Assistants" (main branch 1).

23. **Add Code node ("Final article text")**  
    - Connect input from "Merge chapters title and text".  
    - Add code to process and format merged content.

24. **Add LangChain Agent node ("Editor")**  
    - Connect input from "Final article text".  
    - Configure with OpenAI Chat Model6 for content polishing.

25. **Add Chain LLM node ("Title1")**  
    - Connect input from "Editor".  
    - Configure with OpenAI Chat Model6 for final title generation.

26. **Add Gmail node ("Gmail1")**  
    - Connect input from "Title1".  
    - Configure with Gmail OAuth2 credentials for sending final newsletter.

27. **Add HTTP Request node ("Perplexity API")**  
    - Configure for direct Perplexity API calls with Bearer token.  
    - Connect from Execute Workflow Trigger node.

28. **Add Execute Workflow Trigger node**  
    - Configure to allow external triggering of this workflow.

29. **Add Set node ("Response")**  
    - Connect input from "Perplexity API".  
    - Configure to format API response.

30. **Add Sticky Notes**  
    - Add notes as needed for documentation and instructions.

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                                                                     |
|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Workflow video demonstration: "Building an AI Personal Assistant"                               | https://youtu.be/sKJAypXDTLA                                                                       |
| Perplexity API setup instructions: Create account, generate API key, set Bearer auth credentials | Part of workflow setup steps                                                                        |
| Workflow uses multi-agent AI system: Research Leader, Project Planner, Research Assistants, Editor | Conceptual design of AI collaboration                                                               |
| Integration with newsletter tools like Kit recommended for publishing                            | Suggested external integration                                                                      |
| Sticky notes within the workflow provide detailed guidance and explanations                      | Visual aids inside n8n canvas                                                                       |

---

This document provides a detailed, structured reference for understanding, reproducing, and modifying the "AI News Research Team: 24/7 Newsletter Automation with Citations with Perplexity" workflow. It covers all nodes, their configurations, and interconnections, enabling advanced users and AI agents to work effectively with the workflow.