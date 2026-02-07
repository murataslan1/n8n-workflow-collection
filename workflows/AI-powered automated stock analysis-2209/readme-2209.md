AI-powered automated stock analysis

https://n8nworkflows.xyz/workflows/ai-powered-automated-stock-analysis-2209


# AI-powered automated stock analysis

### 1. Workflow Overview

This workflow automates fundamental stock analysis by leveraging AI and SEC 10K reports. Its primary purpose is to streamline the production of an in-depth stock analysis report through a structured AI persona approach. The workflow targets financial analysts and investment professionals aiming to efficiently generate detailed company reports.

The workflow is logically divided into three main blocks, reflecting roles of different personas and functional stages:

- **1.1 Initialization and Planning (Senior Research Analyst)**  
  Sets up analysis parameters and plans the research agenda for the analyst team.

- **1.2 Research Execution (Squad of Research Analysts)**  
  Carries out detailed research by querying SEC 10K data and supplementary sources, then consolidates findings.

- **1.3 Report Finalization and Publishing (Senior Editor)**  
  Drafts and polishes the final report, then exports it to Google Docs for publishing or distribution.

Each block integrates multiple nodes implementing AI-driven tasks, data merging, and document management to ensure a seamless, collaborative analysis process.

---

### 2. Block-by-Block Analysis

#### 2.1 Initialization and Planning (Senior Research Analyst)

- **Overview:**  
  This block initiates the workflow upon manual trigger, sets initial parameters, and uses AI tools to plan the research work for the analyst squad.

- **Nodes Involved:**  
  - When clicking "Test workflow" (Manual Trigger)  
  - Settings (Set node)  
  - Plan work for team (OpenAI node)  
  - Wikipedia (Wikipedia tool)  
  - SEC10 Tool (Custom SEC 10K Q&A tool)  
  - Sticky Note8, Sticky Note (comments)

- **Node Details:**  
  - **When clicking "Test workflow"**  
    - Type: Manual Trigger  
    - Role: Starts the workflow manually.  
    - Input: None  
    - Output: Triggers the Settings node  
    - Failure: None expected unless manual trigger not activated.

  - **Settings**  
    - Type: Set node  
    - Role: Placeholder to set or reset workflow parameters as needed (empty in this config).  
    - Input: Trigger from manual node  
    - Output: Passes to "Plan work for team"  
    - Failure: None expected  
    - Version: 3.3

  - **Plan work for team**  
    - Type: OpenAI node (AI text generation)  
    - Role: Generates the research plan outline for the analyst team based on input parameters.  
    - Configuration: Uses OpenAI credentials; likely configured with a prompt template to define research tasks.  
    - Inputs: Receives output from Settings node and auxiliary AI tools (Wikipedia, SEC10 Tool) via AI tool connections.  
    - Outputs: Passes planned work instructions to "Delegate work" node.  
    - Failure: Possible API timeout, authentication errors, or prompt execution issues.  
    - Version: 1

  - **Wikipedia**  
    - Type: LangChain Wikipedia tool  
    - Role: Provides supplementary company or industry information to assist AI planning.  
    - Input: Connected as AI tool to "Plan work for team" node.  
    - Failure: Network issues, rate limits, or data not found.

  - **SEC10 Tool**  
    - Type: Custom LangChain Code tool  
    - Role: Answers SEC 10K-specific questions to enrich planning data.  
    - Input: Connected as AI tool to "Plan work for team" node.  
    - Failure: Possible data retrieval or code execution errors.

  - **Sticky Note8, Sticky Note**  
    - Type: Sticky notes  
    - Role: Provide contextual comments or reminders for this block (content not specified).

#### 2.2 Research Execution (Squad of Research Analysts)

- **Overview:**  
  This block delegates the planned tasks to analysts, executes detailed research using AI assisted by Wikipedia and SEC 10K tools, then merges their outputs.

- **Nodes Involved:**  
  - Delegate work (SplitOut)  
  - Do detailed research (OpenAI node)  
  - Wikipedia1 (Wikipedia tool)  
  - SEC10 Tool1 (SEC 10K tool)  
  - Combine all sections from researchers (Merge)  
  - Sticky Note16, Sticky Note19, Sticky Note21 (comments)

- **Node Details:**  
  - **Delegate work**  
    - Type: SplitOut  
    - Role: Splits the planned tasks into multiple parallel paths for research analysts to work on.  
    - Inputs: Receives plan from "Plan work for team" node.  
    - Outputs: Sends parallel outputs to "Do detailed research" and "Combine all sections from researchers" (index 1).  
    - Failure: Potential issues with improper splitting or empty input.

  - **Do detailed research**  
    - Type: OpenAI node  
    - Role: Executes detailed research analysis on assigned sections using AI.  
    - Configuration: Uses OpenAI credentials with appropriate prompt for research detail.  
    - Inputs: Receives task segments from "Delegate work". Also connected to AI tools Wikipedia1 and SEC10 Tool1 for enriched data.  
    - Outputs: Passes research outputs to "Combine all sections from researchers".  
    - Failure: API errors, prompt failures, or data insufficiency.  
    - Version: 1

  - **Wikipedia1**  
    - Type: LangChain Wikipedia tool  
    - Role: Supports "Do detailed research" node with additional data.  
    - Inputs: Connected as AI tool to "Do detailed research".  
    - Failure: Network or data errors.

  - **SEC10 Tool1**  
    - Type: Custom LangChain Code tool  
    - Role: Provides SEC 10K insights to "Do detailed research".  
    - Inputs: Connected as AI tool to "Do detailed research".  
    - Failure: Execution or data retrieval problems.

  - **Combine all sections from researchers**  
    - Type: Merge node  
    - Role: Aggregates all research outputs into a single consolidated dataset.  
    - Inputs: Receives multiple outputs from "Delegate work" and "Do detailed research".  
    - Outputs: Passes merged data to "Draft report".  
    - Failure: Merge conflicts or empty inputs.

  - **Sticky Note16, Sticky Note19, Sticky Note21**  
    - Type: Sticky notes  
    - Role: Provide comments or instructions for the research execution phase.

#### 2.3 Report Finalization and Publishing (Senior Editor)

- **Overview:**  
  This block drafts the report from combined research, polishes it using AI, and publishes the final document into Google Docs.

- **Nodes Involved:**  
  - Draft report (Code node)  
  - Polish report (OpenAI node)  
  - Create new Google docs (Google Docs node)  
  - Update document with report (Google Docs node)  
  - Sticky Note1 (comment)

- **Node Details:**  
  - **Draft report**  
    - Type: Code node (JavaScript/TypeScript)  
    - Role: Programmatically composes the first draft report using merged research sections.  
    - Input: Receives consolidated research content from "Combine all sections from researchers".  
    - Output: Sends draft text to "Polish report".  
    - Failure: Code logic errors, data formatting issues.

  - **Polish report**  
    - Type: OpenAI node  
    - Role: Enhances and refines the draft report for clarity, tone, and style.  
    - Configuration: OpenAI credentials, likely uses a text completion or editing model.  
    - Input: Receives draft report from "Draft report".  
    - Output: Passes polished text to "Create new Google docs".  
    - Failure: API errors, prompt malformation.

  - **Create new Google docs**  
    - Type: Google Docs node  
    - Role: Creates a new Google Docs document to host the final report.  
    - Configuration: Requires Google OAuth2 credentials and document naming parameters.  
    - Input: Receives polished report from "Polish report".  
    - Output: Sends document ID and metadata to "Update document with report".  
    - Failure: Authentication errors, quota limits.

  - **Update document with report**  
    - Type: Google Docs node  
    - Role: Inserts the polished report text into the newly created Google Doc.  
    - Input: Receives document ID and report content from "Create new Google docs".  
    - Output: Final node in the publishing sequence.  
    - Failure: API errors, document permission issues.

  - **Sticky Note1**  
    - Type: Sticky note  
    - Role: Contains notes or instructions related to the publishing phase.

---

### 3. Summary Table

| Node Name                    | Node Type                       | Functional Role                        | Input Node(s)                | Output Node(s)                          | Sticky Note                                    |
|------------------------------|--------------------------------|-------------------------------------|-----------------------------|----------------------------------------|------------------------------------------------|
| When clicking "Test workflow" | Manual Trigger                 | Workflow start                      | -                           | Settings                               |                                                |
| Settings                     | Set                            | Sets initial parameters             | When clicking "Test workflow"| Plan work for team                     |                                                |
| Plan work for team           | OpenAI                         | Plans research agenda               | Settings, Wikipedia, SEC10 Tool | Delegate work                        |                                                |
| Wikipedia                   | LangChain Wikipedia tool       | Supplementary info for planning    | -                           | Plan work for team (ai_tool)           |                                                |
| SEC10 Tool                  | LangChain Code (SEC 10K)        | SEC 10K Q&A for planning           | -                           | Plan work for team (ai_tool)           |                                                |
| Delegate work               | SplitOut                       | Splits tasks for research analysts | Plan work for team           | Do detailed research, Combine all sections from researchers |                                                |
| Do detailed research        | OpenAI                         | Performs detailed research          | Delegate work, Wikipedia1, SEC10 Tool1 | Combine all sections from researchers |                                                |
| Wikipedia1                  | LangChain Wikipedia tool       | Supplementary info for research    | -                           | Do detailed research (ai_tool)         |                                                |
| SEC10 Tool1                 | LangChain Code (SEC 10K)        | SEC 10K Q&A for research           | -                           | Do detailed research (ai_tool)         |                                                |
| Combine all sections from researchers | Merge                   | Aggregates research outputs         | Delegate work, Do detailed research | Draft report                       |                                                |
| Draft report                | Code                           | Creates initial report draft        | Combine all sections from researchers | Polish report                     |                                                |
| Polish report               | OpenAI                         | Refines and polishes report         | Draft report                | Create new Google docs                 |                                                |
| Create new Google docs      | Google Docs                    | Creates new Google Doc for report   | Polish report               | Update document with report            |                                                |
| Update document with report | Google Docs                    | Inserts report into Google Doc      | Create new Google docs      | -                                    |                                                |
| Sticky Note                 | Sticky Note                   | Comment / reminder                  | -                           | -                                    | (Multiple sticky notes across nodes)            |
| Sticky Note8                | Sticky Note                   | Comment / reminder                  | -                           | -                                    |                                                |
| Sticky Note16               | Sticky Note                   | Comment / reminder                  | -                           | -                                    |                                                |
| Sticky Note19               | Sticky Note                   | Comment / reminder                  | -                           | -                                    |                                                |
| Sticky Note21               | Sticky Note                   | Comment / reminder                  | -                           | -                                    |                                                |
| Sticky Note1                | Sticky Note                   | Comment / reminder                  | -                           | -                                    |                                                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger node** named "When clicking \"Test workflow\"" to start the workflow manually.

2. **Add a Set node** named "Settings" with no parameters initially (placeholder for future config). Connect the Manual Trigger to this node.

3. **Add OpenAI node** named "Plan work for team":  
   - Configure with OpenAI credentials.  
   - Set prompt to instruct AI to create a research plan for stock analysis based on SEC 10K data.  
   - Connect input from "Settings" node.

4. **Add Wikipedia tool node** named "Wikipedia":  
   - Configure to query Wikipedia for relevant company/industry info.  
   - Connect as an AI tool input to "Plan work for team".

5. **Add LangChain Code node** named "SEC10 Tool":  
   - Configure custom code to answer SEC 10K questions.  
   - Connect as an AI tool input to "Plan work for team".

6. **Add SplitOut node** named "Delegate work":  
   - Connect the main output of "Plan work for team" to this node.  
   - Configure to split the research plan into multiple tasks for parallel execution.

7. **Add OpenAI node** named "Do detailed research":  
   - Configure with OpenAI credentials.  
   - Set prompt for detailed research on assigned stock analysis sections.  
   - Connect input from one output of "Delegate work".

8. **Add Wikipedia tool node** named "Wikipedia1":  
   - Configure similarly to "Wikipedia".  
   - Connect as AI tool input to "Do detailed research".

9. **Add LangChain Code node** named "SEC10 Tool1":  
   - Configure similar to "SEC10 Tool".  
   - Connect as AI tool input to "Do detailed research".

10. **Add Merge node** named "Combine all sections from researchers":  
    - Connect inputs from:  
      - Second output of "Delegate work"  
      - Main output of "Do detailed research"  
    - Configure to merge inputs into a single output.

11. **Add Code node** named "Draft report":  
    - Write code to combine merged research sections into an initial stock analysis report draft.  
    - Connect input from "Combine all sections from researchers".

12. **Add OpenAI node** named "Polish report":  
    - Configure with OpenAI credentials.  
    - Set prompt to enhance and polish the draft report text.  
    - Connect input from "Draft report".

13. **Add Google Docs node** named "Create new Google docs":  
    - Configure with Google OAuth2 credentials.  
    - Set parameters to create a new document (title can be parameterized).  
    - Connect input from "Polish report".

14. **Add Google Docs node** named "Update document with report":  
    - Configure to insert the polished report text into the Google Doc created by the previous node.  
    - Connect input from "Create new Google docs".

15. **Optionally add Sticky Note nodes** at relevant points for comments or instructions.

16. **Verify all credential configurations**:  
    - OpenAI API key for all OpenAI nodes.  
    - Google OAuth2 for Google Docs nodes.  
    - Custom code nodes must be able to access SEC 10K data sources or APIs.

17. **Test the workflow end-to-end** by manually triggering the start node and verifying each stage.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                        | Context or Link                                                                                                 |
|-----------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Streamlined fundamental stock analysis using AI personas: Senior Research Analyst, Research Analysts, Senior Editor                                | Workflow description                                                                                           |
| Uses a custom SEC 10K Q&A tool integrated with AI nodes to answer detailed company questions                                                      | Custom LangChain Code nodes                                                                                    |
| Setup requires configuring a companion "Stock Q&A Workflow" for company data [link](https://n8n.io/workflows/2183-ai-crew-to-automate-fundamental-stock-analysis-qanda-workflow/) | Setup instructions                                                                                            |
| Inspired by Guilio's AI WordPress post template [link](https://n8n.io/workflows/2187-write-a-wordpress-post-with-ai-starting-from-a-few-keywords/) | Credit and inspiration                                                                                        |
| Control over report length and detail is configurable through AI prompt parameters (implied by description)                                         | Usage note                                                                                                    |
| Google Docs nodes require OAuth2 credential with permissions to create and edit documents                                                           | Credential requirements                                                                                        |

---

This structured documentation provides a complete and detailed reference for understanding, reproducing, and troubleshooting the "AI-powered automated stock analysis" workflow. It is suitable for advanced users and AI agents alike.