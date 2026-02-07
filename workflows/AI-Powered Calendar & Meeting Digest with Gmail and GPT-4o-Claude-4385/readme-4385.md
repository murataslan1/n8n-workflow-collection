AI-Powered Calendar & Meeting Digest with Gmail and GPT-4o/Claude

https://n8nworkflows.xyz/workflows/ai-powered-calendar---meeting-digest-with-gmail-and-gpt-4o-claude-4385


# AI-Powered Calendar & Meeting Digest with Gmail and GPT-4o/Claude

### 1. Workflow Overview

This workflow, titled **"Daily Calendar Brief"**, automates the process of generating a daily digest of calendar events and recent emails, enhanced by AI summarization and research capabilities. It targets users who want an AI-powered briefing combining their Google Calendar schedule with relevant email context, then delivering a concise, readable summary via email every day.

**Logical blocks:**

- **1.1 Scheduled Trigger & Input Collection:**  
  Starts daily, reads Google Calendar events, and extracts attendee information.

- **1.2 Attendee Filtering and Email Retrieval:**  
  Filters external attendees and fetches latest Gmail emails related to events.

- **1.3 AI-Powered Research and Summarization:**  
  Uses two OpenRouter GPT-4o/Claude models with memory to analyze emails and calendar data, generate a research brief, merge event data, and summarize the schedule.

- **1.4 Formatting and Output Delivery:**  
  Converts the AI-generated markdown summary into HTML format and sends it by Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger & Input Collection

**Overview:**  
This block triggers the workflow daily, reads the Google Calendar events, then processes attendee data.

**Nodes Involved:**  
- Run Daily  
- Read Calendar Events  
- Parse Attendees

**Node Details:**

- **Run Daily**  
  - *Type:* Schedule Trigger  
  - *Role:* Initiates workflow once a day automatically.  
  - *Config:* Default daily schedule (time not specified).  
  - *Connections:* Output → Read Calendar Events  
  - *Possible Failures:* Trigger misconfiguration or timezone issues.

- **Read Calendar Events**  
  - *Type:* Google Calendar Node  
  - *Role:* Retrieves calendar events for the day.  
  - *Config:* Uses credentials for Google Calendar OAuth2; likely set to read today’s events by default.  
  - *Connections:* Output → Parse Attendees  
  - *Potential Failures:* Auth errors, API rate limits, empty event list.

- **Parse Attendees**  
  - *Type:* Split Out  
  - *Role:* Extracts and splits attendees from calendar events for further processing.  
  - *Config:* Default splitting, likely by attendee field arrays.  
  - *Connections:* Output → Identify External Attendees  
  - *Edge Cases:* Events without attendees, malformed attendee data.

---

#### 1.2 Attendee Filtering and Email Retrieval

**Overview:**  
Filters attendees to isolate external participants and fetches latest emails from Gmail relevant to those attendees or events.

**Nodes Involved:**  
- Identify External Attendees  
- Read Latest Emails

**Node Details:**

- **Identify External Attendees**  
  - *Type:* Filter  
  - *Role:* Filters attendee list to keep external users (e.g., outside organization).  
  - *Config:* Conditions based on attendee domain or email patterns.  
  - *Connections:* Output → Read Latest Emails  
  - *Failure Risks:* Incorrect filter logic, no external attendees found.

- **Read Latest Emails**  
  - *Type:* Gmail Node  
  - *Role:* Retrieves recent emails to incorporate into briefing.  
  - *Config:* Uses Gmail OAuth2 credentials; likely set to fetch emails matching event or attendee data.  
  - *Connections:* Output → Research and Develop Brief  
  - *Error Handling:* On error, continues workflow (non-blocking).  
  - *Failure Modes:* Auth token expiry, Gmail API limits, empty inbox.

---

#### 1.3 AI-Powered Research and Summarization

**Overview:**  
This core block uses OpenRouter language models with memory buffers to generate a research brief, merge event details, and produce a summarized schedule.

**Nodes Involved:**  
- OpenRouter Chat Model  
- Research and Develop Brief  
- Merge Events  
- OpenRouter Chat Model1  
- Summarize Schedule  
- Simple Memory

**Node Details:**

- **OpenRouter Chat Model**  
  - *Type:* LangChain LM Chat (OpenRouter)  
  - *Role:* Provides AI language model interface for research briefing.  
  - *Config:* Connected as AI language model for Research and Develop Brief node.  
  - *Connections:* AI LM output → Research and Develop Brief  
  - *Potential Issues:* API key validity, model errors, latency.

- **Research and Develop Brief**  
  - *Type:* LangChain Agent  
  - *Role:* Processes emails and event info to generate a detailed research brief.  
  - *Config:* Uses OpenRouter Chat Model as AI LM, integrates AI memory buffer for context.  
  - *Connections:* Main output → Merge Events  
  - *AI Memory Input:* Receives buffer from Simple Memory node.  
  - *Error Handling:* Continues on error to avoid blocking.  
  - *Failures:* Model generation errors, memory buffer overflow.

- **Merge Events**  
  - *Type:* Code  
  - *Role:* Custom JavaScript code merges AI-generated brief with event data for coherent output.  
  - *Config:* No parameters exposed; logic embedded in code.  
  - *Connections:* Output → Summarize Schedule  
  - *Failures:* Code errors, null data inputs.

- **OpenRouter Chat Model1**  
  - *Type:* LangChain LM Chat (OpenRouter)  
  - *Role:* Provides AI language model interface for schedule summarization.  
  - *Config:* Connected as AI LM for Summarize Schedule node.  
  - *Connections:* AI LM output → Summarize Schedule  
  - *Risks:* Similar to first model; API key or response issues.

- **Summarize Schedule**  
  - *Type:* LangChain Chain LLM  
  - *Role:* Summarizes merged event and brief into a concise schedule summary.  
  - *Config:* Uses OpenRouter Chat Model1 as AI LM.  
  - *Connections:* Output → Markdown to HTML  
  - *Failures:* Model timeouts, inappropriate summary length.

- **Simple Memory**  
  - *Type:* LangChain Memory Buffer Window  
  - *Role:* Maintains short-term context memory for AI agent to enhance coherence.  
  - *Config:* Default window size; connected as AI memory input to Research and Develop Brief.  
  - *Connections:* Output → Research and Develop Brief (memory)  
  - *Edge Cases:* Memory overflow, stale context.

---

#### 1.4 Formatting and Output Delivery

**Overview:**  
Finalizes the AI-generated markdown summary by converting it to HTML and sending it via Gmail.

**Nodes Involved:**  
- Markdown to HTML  
- Send Email

**Node Details:**

- **Markdown to HTML**  
  - *Type:* Markdown Node  
  - *Role:* Converts AI summary in markdown format to HTML for email formatting.  
  - *Config:* Default markdown to HTML conversion.  
  - *Connections:* Output → Send Email  
  - *Failures:* Malformed markdown input causing conversion errors.

- **Send Email**  
  - *Type:* Gmail Node  
  - *Role:* Sends the formatted summary email to recipients.  
  - *Config:* Uses Gmail OAuth2 credentials; email content set dynamically from previous node output.  
  - *Connections:* Terminal node; no outputs.  
  - *Failure Risks:* Sending errors, authentication issues, recipient address problems.

---

### 3. Summary Table

| Node Name               | Node Type                                | Functional Role                        | Input Node(s)           | Output Node(s)          | Sticky Note                                |
|-------------------------|-----------------------------------------|-------------------------------------|------------------------|-------------------------|--------------------------------------------|
| Run Daily               | Schedule Trigger                        | Daily workflow start trigger         | —                      | Read Calendar Events     |                                            |
| Read Calendar Events    | Google Calendar                        | Fetch calendar events                 | Run Daily               | Parse Attendees          |                                            |
| Parse Attendees         | Split Out                             | Extract attendees from events        | Read Calendar Events    | Identify External Attendees |                                            |
| Identify External Attendees | Filter                              | Filter external attendees             | Parse Attendees         | Read Latest Emails       |                                            |
| Read Latest Emails      | Gmail                                 | Fetch recent emails                   | Identify External Attendees | Research and Develop Brief |                                            |
| OpenRouter Chat Model   | LangChain LM Chat (OpenRouter)        | AI language model for research       | —                      | Research and Develop Brief (AI LM) |                                            |
| Simple Memory           | LangChain Memory Buffer Window         | Maintains AI memory context          | —                      | Research and Develop Brief (AI Memory) |                                            |
| Research and Develop Brief | LangChain Agent                     | Generate research brief from emails and calendar | Read Latest Emails (main), OpenRouter Chat Model (AI LM), Simple Memory (AI Memory) | Merge Events           |                                            |
| Merge Events            | Code                                  | Merge AI brief with event data       | Research and Develop Brief | Summarize Schedule       |                                            |
| OpenRouter Chat Model1  | LangChain LM Chat (OpenRouter)        | AI language model for schedule summary | —                      | Summarize Schedule (AI LM) |                                            |
| Summarize Schedule      | LangChain Chain LLM                    | Summarize merged schedule            | Merge Events, OpenRouter Chat Model1 (AI LM) | Markdown to HTML        |                                            |
| Markdown to HTML        | Markdown Node                         | Convert markdown summary to HTML     | Summarize Schedule      | Send Email               |                                            |
| Send Email              | Gmail                                 | Send email with daily brief          | Markdown to HTML        | —                       |                                            |
| Sticky Note             | Sticky Note                          | (Empty content, no comment)          | —                      | —                       |                                            |

---

### 4. Reproducing the Workflow from Scratch

1. **Create "Run Daily" node**  
   - Type: Schedule Trigger  
   - Set to trigger once daily at desired time (default daily).  

2. **Create "Read Calendar Events" node**  
   - Type: Google Calendar  
   - Configure Google OAuth2 credentials.  
   - Set to fetch events for current day or desired range.  
   - Connect output of "Run Daily" to input of this node.

3. **Create "Parse Attendees" node**  
   - Type: Split Out  
   - Configure to extract attendees list from calendar events.  
   - Connect output of "Read Calendar Events" to input.

4. **Create "Identify External Attendees" node**  
   - Type: Filter  
   - Set filter to include only attendees external to your organization (e.g., domain mismatch).  
   - Connect output of "Parse Attendees" to input.

5. **Create "Read Latest Emails" node**  
   - Type: Gmail  
   - Configure Gmail OAuth2 credentials.  
   - Set query/filter to retrieve recent or relevant emails, possibly related to attendees or event subjects.  
   - Set "On Error" to "Continue Regular Output" to avoid blocking.  
   - Connect output of "Identify External Attendees" to input.

6. **Create "OpenRouter Chat Model" node**  
   - Type: LangChain LM Chat (OpenRouter)  
   - Configure OpenRouter API credentials and choose GPT-4o/Claude model.  
   - No input connections (used as AI LM reference).

7. **Create "Simple Memory" node**  
   - Type: LangChain Memory Buffer Window  
   - Default buffer window size is fine.  
   - No input connections (memory buffer to feed AI).

8. **Create "Research and Develop Brief" node**  
   - Type: LangChain Agent  
   - Configure to use "OpenRouter Chat Model" as AI language model.  
   - Set AI memory input to "Simple Memory".  
   - Connect main input from "Read Latest Emails" output.  
   - Set error handling to continue on error.

9. **Create "Merge Events" node**  
   - Type: Code  
   - Write custom JavaScript to merge AI research brief and event data into a unified structure.  
   - Connect output of "Research and Develop Brief" to input.

10. **Create "OpenRouter Chat Model1" node**  
    - Type: LangChain LM Chat (OpenRouter)  
    - Configure identical or different OpenRouter credentials as needed.  
    - No input connections (used as AI LM reference).

11. **Create "Summarize Schedule" node**  
    - Type: LangChain Chain LLM  
    - Configure to use "OpenRouter Chat Model1" as AI language model.  
    - Connect main input from "Merge Events" output.

12. **Create "Markdown to HTML" node**  
    - Type: Markdown  
    - Default configuration to convert markdown to HTML.  
    - Connect output of "Summarize Schedule" to input.

13. **Create "Send Email" node**  
    - Type: Gmail  
    - Configure Gmail OAuth2 credentials.  
    - Set email recipient(s), subject, and dynamic HTML body from "Markdown to HTML" output.  
    - Connect output of "Markdown to HTML" to input.

14. **Connect all nodes following the described order and verify credentials are correctly set for Google Calendar, Gmail, and OpenRouter API.**

---

### 5. General Notes & Resources

| Note Content                                                                                      | Context or Link                                        |
|-------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| Workflow integrates GPT-4o/Claude via OpenRouter for advanced AI summarization and research.   | OpenRouter documentation: https://openrouter.ai/docs  |
| Gmail nodes use OAuth2; ensure tokens have necessary scopes for reading emails and sending mail. | Gmail API docs: https://developers.google.com/gmail/api |
| Google Calendar node requires OAuth2 with calendar read scope.                                  | Google Calendar API docs: https://developers.google.com/calendar |
| AI memory buffers improve context awareness in LangChain agents, enhancing briefing quality.    | LangChain memory docs: https://docs.langchain.com/docs/memory |
| Error handling set to “continue” on some nodes to avoid workflow stoppage on transient errors.  | Best practice for robust workflows.                    |
| Empty Sticky Note node present but contains no content, can be removed or repurposed.            |                                                        |

---

*Disclaimer:* The provided text is derived exclusively from an automated workflow created with n8n, a tool for integration and automation. This processing strictly complies with applicable content policies and contains no illegal, offensive, or protected elements. All data handled is legal and public.