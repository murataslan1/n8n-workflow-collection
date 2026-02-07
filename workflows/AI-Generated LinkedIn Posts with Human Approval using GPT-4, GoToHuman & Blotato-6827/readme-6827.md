AI-Generated LinkedIn Posts with Human Approval using GPT-4, GoToHuman & Blotato

https://n8nworkflows.xyz/workflows/ai-generated-linkedin-posts-with-human-approval-using-gpt-4--gotohuman---blotato-6827


# AI-Generated LinkedIn Posts with Human Approval using GPT-4, GoToHuman & Blotato

---

### 1. Workflow Overview

This workflow automates the creation, human approval, and LinkedIn posting of daily social media captions based on topic ideas sourced from a Google Sheet. It leverages GPT-4 via OpenAI to generate engaging, emoji-rich captions, routes the caption through a human review process using GoToHuman, and upon approval, posts the content to LinkedIn via Blotato. The workflow is structured into four main logical blocks:

- **1.1 Input Reception & Data Preparation:** Retrieves today’s topic from Google Sheets and filters it accordingly.
- **1.2 AI Caption Generation:** Uses GPT-4 to generate a short LinkedIn caption based on the topic idea.
- **1.3 Human Review & Approval:** Sends the generated caption to GoToHuman for approval and filters the flow based on the outcome.
- **1.4 Publishing:** Posts the approved caption to LinkedIn through Blotato and updates Google Sheets with caption and completion status.

Each block is designed to handle specific functional responsibilities and integrates tightly with the next, ensuring a smooth automated yet reviewable publishing process.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Data Preparation

- **Overview:** This block fetches the daily topic idea from a Google Sheet, matches it against today’s date, and prepares the idea for AI processing.
- **Nodes Involved:**  
  - Daily Trigger  
  - Test (Manual Trigger)  
  - Get Today's Idea (Google Sheets)  
  - Output Today's Date (Code)  
  - Keep only todays idea (Merge)

- **Node Details:**

  - **Daily Trigger**  
    - Type: Schedule Trigger  
    - Role: Automatically triggers the workflow daily.  
    - Configuration: Runs at a regular daily interval; no additional settings.  
    - Input: None (start trigger)  
    - Output: Triggers Get Today's Idea node.  
    - Edge Cases: Misconfiguration could lead to missed triggers; time zone considerations.

  - **Test**  
    - Type: Manual Trigger  
    - Role: Allows manual testing of the workflow.  
    - Input: None  
    - Output: Initiates Get Today's Idea node.  
    - Edge Cases: Useful for debugging; no automation impact.

  - **Get Today's Idea**  
    - Type: Google Sheets  
    - Role: Reads all rows from the configured Google Sheet containing ideas and dates.  
    - Configuration:  
      - Document ID and Sheet Name set to the shared Google Sheet URL and sheet ID.  
      - Uses OAuth2 Google Sheets credentials.  
    - Input: Trigger from Daily or Manual.  
    - Output: Provides all sheet rows for filtering.  
    - Edge Cases: Authentication failure, API quota limits, sheet structure changes.

  - **Output Today's Date**  
    - Type: Code (JavaScript)  
    - Role: Generates the current date in ISO format (YYYY-MM-DD) normalized to start of day for comparison.  
    - Key Code Snippet:  
      ```js
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return [{ json: { today: today.toISOString().split('T')[0] } }];
      ```  
    - Input: Trigger from Get Today's Idea or Test  
    - Output: Date string for merging.  
    - Edge Cases: Timezone differences might cause mismatch if Google Sheet dates are not aligned.

  - **Keep only todays idea**  
    - Type: Merge  
    - Role: Joins the Google Sheet data with the generated date, filtering rows where the sheet’s "Date" field matches today’s date exactly.  
    - Configuration: Merge by fields "Date" (sheet) and "today" (code node), mode combine.  
    - Input: Receives data from Get Today's Idea and Output Today's Date nodes.  
    - Output: Single row containing today’s idea.  
    - Edge Cases: No match results in empty output; data format mismatch can cause failures.

---

#### 2.2 AI Caption Generation

- **Overview:** This block uses GPT-4 to generate a concise, emoji-enhanced LinkedIn caption based on the filtered daily idea.
- **Nodes Involved:**  
  - AI Agent: Create caption for linkedin  
  - Tool: Inject Creativity (AI Tool)  
  - Parser: Extract JSON from Idea

- **Node Details:**

  - **Tool: Inject Creativity**  
    - Type: LangChain Tool (Think tool)  
    - Role: Provides additional creative input or contextual enhancement to the AI agent.  
    - Input: Not directly linked in the chain but available to AI Agent node as tool.  
    - Output: Feeds creative suggestions to AI Agent.  
    - Edge Cases: Tool errors could affect AI output quality.

  - **AI Agent: Create caption for linkedin**  
    - Type: LangChain Agent (AI Language Model)  
    - Role: Generates the LinkedIn caption based on the topic idea.  
    - Configuration:  
      - Model: GPT-4.1  
      - System Message: Instructs to expand the idea into a two-sentence social media post with emojis.  
      - Prompt: Injects the "idea" from input JSON.  
      - Output Parser: Enabled to ensure structured JSON output.  
      - Tools: Uses “Inject Creativity” tool to enhance output.  
    - Input: Output from Keep only todays idea node.  
    - Output: JSON structured caption.  
    - Credentials: OpenAI API key (configured with GPT-4 access).  
    - Edge Cases: API rate limits, prompt failure, malformed output, credential issues.

  - **Parser: Extract JSON from Idea**  
    - Type: LangChain Output Parser  
    - Role: Parses the raw AI output to extract a JSON object containing the "Caption" field.  
    - Configuration: Expects JSON array of objects with Caption property.  
    - Input: AI Agent’s raw output.  
    - Output: Clean JSON data for further use.  
    - Edge Cases: Parsing failures if AI output deviates from expected format.

---

#### 2.3 Human Review & Approval

- **Overview:** This block sends the AI-generated caption to a human approver via GoToHuman, allowing manual approval or rejection before posting.
- **Nodes Involved:**  
  - Save caption to google sheets  
  - Ask Human for approval (GoToHuman)  
  - Keep only if approved (Filter)  
  - Mark complete in google sheets

- **Node Details:**

  - **Save caption to google sheets**  
    - Type: Google Sheets  
    - Role: Saves the generated caption back to the sheet along with the date for record keeping.  
    - Configuration: Uses appendOrUpdate operation keyed by the "Date" field; updates the "caption" column.  
    - Input: Output from AI Agent node (caption JSON).  
    - Credentials: Google Sheets OAuth2.  
    - Edge Cases: API errors, conflicts if sheet structure changes.

  - **Ask Human for approval**  
    - Type: GoToHuman Node  
    - Role: Sends the caption text to GoToHuman for a review step.  
    - Configuration:  
      - Review Template ID configured to identify the approval workflow.  
      - Sends "text" field containing the caption to the reviewer.  
    - Webhook: Waits for human response via GoToHuman webhook.  
    - Credentials: GoToHuman API.  
    - Input: Caption from Save caption node.  
    - Output: Human response with status "approved" or other.  
    - Edge Cases: API connectivity, webhook failures, user delays.

  - **Keep only if approved**  
    - Type: Filter  
    - Role: Allows the workflow to continue only if human approved the caption.  
    - Condition: Checks if `response` field equals "approved".  
    - Input: GoToHuman approval output.  
    - Output: Passes forward only approved captions.  
    - Edge Cases: False negatives if field names or values change.

  - **Mark complete in google sheets**  
    - Type: Google Sheets  
    - Role: Updates the "complete" column in the Google Sheet to "Yes" for the approved caption’s date.  
    - Configuration: Update operation keyed by "Date".  
    - Input: From AI Agent node, parallel to Save caption node.  
    - Credentials: Google Sheets OAuth2.  
    - Edge Cases: Sync issues if multiple updates occur simultaneously.

---

#### 2.4 Publishing

- **Overview:** Posts the approved caption to LinkedIn via the Blotato service using an HTTP request.
- **Nodes Involved:**  
  - Post to Linkedin (HTTP Request)

- **Node Details:**

  - **Post to Linkedin**  
    - Type: HTTP Request  
    - Role: Sends a POST request to Blotato’s API to publish the caption to LinkedIn.  
    - Configuration:  
      - URL: `https://backend.blotato.com/v2/posts`  
      - Method: POST  
      - Headers: Contains `blotato-api-key` with user’s API key.  
      - JSON Body: Includes `accountId`, target type "linkedin", and the caption text pulled dynamically from GoToHuman approval response.  
      - Sends JSON body and headers accordingly.  
    - Input: Only triggered if the caption was approved (filtered).  
    - Edge Cases: API authentication failure, network errors, invalid account ID, rate limits.

---

### 3. Summary Table

| Node Name                   | Node Type                   | Functional Role                          | Input Node(s)                     | Output Node(s)                             | Sticky Note                                                                                                                                    |
|-----------------------------|-----------------------------|----------------------------------------|---------------------------------|--------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| Daily Trigger               | Schedule Trigger            | Trigger workflow daily                  | -                               | Get Today's Idea                           |                                                                                                                                                |
| Test                        | Manual Trigger             | Manual start for testing                | -                               | Get Today's Idea                           |                                                                                                                                                |
| Get Today's Idea            | Google Sheets              | Read daily ideas sheet                  | Daily Trigger, Test             | Keep only todays idea                      | ## ✅ Step 1 — Get Today’s Topic from Google Sheets (with setup instructions and sheet copy link)                                               |
| Output Today's Date         | Code                       | Generate today’s ISO date string        | Test                           | Keep only todays idea                      | ## ✅ Step 1 — Get Today’s Topic from Google Sheets (with setup instructions and sheet copy link)                                               |
| Keep only todays idea       | Merge                      | Filter sheet rows to today’s date       | Get Today's Idea, Output Today's Date | AI Agent: Create caption for linkedin | ## ✅ Step 1 — Get Today’s Topic from Google Sheets (with setup instructions and sheet copy link)                                               |
| Tool: Inject Creativity     | LangChain Tool (Think)     | Provide creative input to AI agent      | -                             | AI Agent: Create caption for linkedin      | ## ✅ Step 2 — Generate Caption with OpenAI (instructions on credential and AI logic)                                                           |
| AI Agent: Create caption for linkedin | LangChain Agent (AI LM) | Generate caption from idea with GPT-4  | Keep only todays idea, Tool: Inject Creativity, Parser: Extract JSON from Idea | Save caption to google sheets, Mark complete in google sheets | ## ✅ Step 2 — Generate Caption with OpenAI (instructions on credential and AI logic)                                                           |
| Parser: Extract JSON from Idea | LangChain Output Parser   | Parse AI output JSON for caption         | AI Agent: Create caption for linkedin | AI Agent: Create caption for linkedin      | ## ✅ Step 2 — Generate Caption with OpenAI (instructions on credential and AI logic)                                                           |
| Save caption to google sheets | Google Sheets             | Save generated caption to sheet          | AI Agent: Create caption for linkedin | Ask Human for approval                     | ## ✅ Step 2 — Generate Caption with OpenAI (instructions on credential and AI logic)                                                           |
| Ask Human for approval      | GoToHuman Approval         | Send caption for human review            | Save caption to google sheets   | Keep only if approved                      | ### 1. Set Up GoToHuman (account & credential setup) and review logic                                                                         |
| Keep only if approved       | Filter                     | Pass only approved captions              | Ask Human for approval          | Post to Linkedin                           | ### 1. Set Up GoToHuman (account & credential setup) and review logic                                                                         |
| Mark complete in google sheets | Google Sheets             | Update sheet marking idea as complete    | AI Agent: Create caption for linkedin | -                                         | ## ✅ Step 2 — Generate Caption with OpenAI (instructions on credential and AI logic)                                                           |
| Post to Linkedin            | HTTP Request               | Post approved caption to LinkedIn via Blotato | Keep only if approved           | -                                          | ## ✅ Step 4 — Publish to LinkedIn via Blotato (setup and API key instructions)                                                                 |
| Sticky Note                 | Sticky Note                | Instructions and workflow documentation  | -                              | -                                          | # 🤖 Automated LinkedIn Posting with OpenAI, GoToHuman, and Blotato (LinkedIn contact & email info)                                              |
| Sticky Note1                | Sticky Note                | Instructions: Step 1 — Google Sheets setup | -                              | -                                          | ## ✅ Step 1 — Get Today’s Topic from Google Sheets (with setup instructions and sheet copy link)                                               |
| Sticky Note                 | Sticky Note                | Instructions: Step 2 — OpenAI Caption generation | -                              | -                                          | ## ✅ Step 2 — Generate Caption with OpenAI (instructions on credential and AI logic)                                                           |
| Sticky Note3                | Sticky Note                | Instructions: GoToHuman setup & review logic | -                              | -                                          | ### 1. Set Up GoToHuman (account & credential setup) and review logic                                                                         |
| Sticky Note4                | Sticky Note                | Instructions: Step 4 — Blotato posting setup | -                              | -                                          | ## ✅ Step 4 — Publish to LinkedIn via Blotato (setup and API key instructions)                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Trigger Nodes:**  
   - Add a **Schedule Trigger** node named “Daily Trigger” configured to run once daily at your desired time.  
   - Add a **Manual Trigger** node named “Test” for manual testing.

2. **Google Sheets: Get Today’s Idea**  
   - Create a **Google Sheets** node named “Get Today's Idea”.  
   - Set Document ID to your Google Sheet containing date and ideas.  
   - Set Sheet Name to the specific sheet/tab (e.g., gid=0 or Sheet1).  
   - Use OAuth2 credentials linked to your Google account authorized to access the sheet.

3. **Generate Today’s Date**  
   - Add a **Code** node named “Output Today's Date”.  
   - Use JavaScript code to generate ISO date string in YYYY-MM-DD format normalized to start of the day:  
     ```js
     const today = new Date();
     today.setHours(0, 0, 0, 0);
     return [{ json: { today: today.toISOString().split('T')[0] } }];
     ```

4. **Filter to Today’s Idea**  
   - Add a **Merge** node named “Keep only todays idea”.  
   - Configure merge mode to “Combine” on fields: Sheet’s “Date” and Code node’s “today”.  
   - Connect “Get Today’s Idea” and “Output Today’s Date” nodes as inputs.

5. **Create AI Tool for Creativity Injection**  
   - Add a **LangChain Tool Think** node named “Tool: Inject Creativity” with default settings.  
   - No additional configuration needed here unless customizing.

6. **Add AI Agent Node (GPT-4)**  
   - Add a **LangChain Agent** node named “AI Agent: Create caption for linkedin”.  
   - Configure model to GPT-4 (e.g., “gpt-4.1”).  
   - Set system message to instruct the model to create a two-sentence, emoji-rich LinkedIn caption based on the input idea, outputting JSON array with “Caption” key.  
   - Use prompt: `Idea: {{ $json.idea }}` (dynamically inject idea from previous node).  
   - Enable output parser.  
   - Assign the “Tool: Inject Creativity” as a tool for the agent.  
   - Set OpenAI API credentials with your OpenAI API key.

7. **Add Output Parser Node**  
   - Add a **LangChain Output Parser** node named “Parser: Extract JSON from Idea”.  
   - Define JSON schema example to expect an array with objects containing “Caption” string.

8. **Save Caption to Google Sheets**  
   - Add a **Google Sheets** node named “Save caption to google sheets”.  
   - Configure to append or update rows keyed by “Date”.  
   - Map “Date” from today’s idea and “caption” from AI output.  
   - Use the same Google Sheets credentials as before.

9. **Mark Completion in Google Sheets**  
   - Add a **Google Sheets** node named “Mark complete in google sheets”.  
   - Configure update operation keyed by “Date”.  
   - Set “complete” column to “Yes”.  
   - Use Google Sheets credentials.

10. **Add GoToHuman Approval Node**  
    - Add a **GoToHuman** node named “Ask Human for approval”.  
    - Configure with your GoToHuman credential and the Review Template ID for content approvals.  
    - Send the caption text from previous Google Sheets save node.  
    - Ensure webhook is configured for receiving human review responses.

11. **Filter Approved Captions**  
    - Add a **Filter** node named “Keep only if approved”.  
    - Set condition to pass only where `response == "approved"`.

12. **Post to LinkedIn via Blotato**  
    - Add an **HTTP Request** node named “Post to Linkedin”.  
    - Set method to POST and URL to `https://backend.blotato.com/v2/posts`.  
    - Set headers with `blotato-api-key` containing your Blotato API key.  
    - Configure JSON body with your Blotato Account ID, target type “linkedin”, and text dynamically injected from GoToHuman approval response.  
    - Use JSON body and header parameter options accordingly.

13. **Connect Nodes:**  
    - Connect “Daily Trigger” and “Test” nodes output to “Get Today's Idea”.  
    - Connect “Get Today's Idea” and “Output Today's Date” to “Keep only todays idea”.  
    - Connect “Keep only todays idea” to “AI Agent: Create caption for linkedin” and link “Tool: Inject Creativity” as an AI tool.  
    - Connect “AI Agent” output to “Parser: Extract JSON from Idea” (used internally).  
    - Connect “AI Agent” output to both “Save caption to google sheets” and “Mark complete in google sheets”.  
    - Connect “Save caption to google sheets” to “Ask Human for approval”.  
    - Connect “Ask Human for approval” to “Keep only if approved”.  
    - Connect “Keep only if approved” to “Post to Linkedin”.

14. **Credential Setup:**  
    - **OpenAI:** Add API key credential with GPT-4 access.  
    - **Google Sheets:** Set OAuth2 credential authorized for your Google Sheet.  
    - **GoToHuman:** Add API credential from your GoToHuman account.  
    - **Blotato:** Use your Blotato API key in HTTP Request headers.

15. **Testing:**  
    - Use the “Test” manual trigger node to run the flow on demand.  
    - Monitor GoToHuman interface for approval requests.  
    - Verify Google Sheets updates and LinkedIn posts.

---

### 5. General Notes & Resources

| Note Content                                                                                             | Context or Link                                                                                   |
|---------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Workflow automates LinkedIn posts creation with OpenAI, human approval via GoToHuman, and posting via Blotato. | Main workflow concept.                                                                           |
| Google Sheet template available for copy: [Copy this sheet](https://docs.google.com/spreadsheets/d/1oC3dbRkGF_bSIKuFKtSJsYS-ZypT2uk7jPsAni8y154/copy) | Setup source data.                                                                               |
| GoToHuman setup documentation: https://gotohuman.com                                                    | For creating review templates and API credential setup.                                         |
| Blotato API documentation and signup: https://blotato.com                                              | To obtain API keys and account IDs for posting to LinkedIn.                                     |
| Contact for help: Robert Breen on LinkedIn: https://www.linkedin.com/in/robert-breen-29429625/ Email: robert@ynteractive.com | Support and questions.                                                                           |

---

**Disclaimer:**  
The provided text is exclusively derived from an n8n automation workflow. It strictly complies with content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.

---