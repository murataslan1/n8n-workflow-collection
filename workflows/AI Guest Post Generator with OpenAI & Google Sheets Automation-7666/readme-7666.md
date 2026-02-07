AI Guest Post Generator with OpenAI & Google Sheets Automation

https://n8nworkflows.xyz/workflows/ai-guest-post-generator-with-openai---google-sheets-automation-7666


# AI Guest Post Generator with OpenAI & Google Sheets Automation

### 1. Workflow Overview

This workflow automates the generation of guest posts in German using OpenAI's language model and manages tasks via a Google Sheets planning document. It is designed for content teams or marketers who track guest post assignments and want to automate content creation and status updates seamlessly.

The workflow’s logical blocks are:

- **1.1 Input Reception:** Manual trigger initiates the workflow.
- **1.2 Planning Data Retrieval:** Reads guest post assignments from a Google Sheets planning document.
- **1.3 Filtering Assignments:** Filters assignments whose status is set to "Start" to identify posts ready for generation.
- **1.4 Prompt Formatting:** Constructs a prompt for OpenAI based on the topic and notes from the sheet.
- **1.5 AI Content Generation:** Uses OpenAI's text completion model to generate the guest post content.
- **1.6 Saving Generated Content:** Appends the generated post to a separate Google Sheets tab.
- **1.7 Updating Planning Status:** Marks the original task in the planning sheet as "Finished" to prevent reprocessing.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:** Starts the workflow manually to trigger the automation cycle.
- **Nodes Involved:**  
  - Start Trigger
- **Node Details:**  
  - **Start Trigger**  
    - Type: Manual Trigger  
    - Role: Initiates workflow execution on user demand.  
    - Configuration: Default manual trigger, no special parameters.  
    - Inputs: None (start node)  
    - Outputs: Triggers "Read Planning Sheet" node.  
    - Version: 1  
    - Edge cases: None significant; manual trigger requires user interaction.

#### 2.2 Planning Data Retrieval

- **Overview:** Reads the guest post planning data from a specified Google Sheets document and range.
- **Nodes Involved:**  
  - Read Planning Sheet
- **Node Details:**  
  - **Read Planning Sheet**  
    - Type: Google Sheets node  
    - Role: Retrieves rows from the "Planning" sheet to find posts to generate.  
    - Configuration:  
      - Operation: lookup  
      - Range: Planning!A1:E1000 (columns A to E, rows 1 to 1000)  
      - Return all matches: true (retrieves all rows, not just the first match)  
      - Sheet ID: Provided Google Sheets document ID  
    - Inputs: Trigger from "Start Trigger"  
    - Outputs: Passes data to "Filter Status = Start"  
    - Credentials: Google Sheets OAuth2 account  
    - Version: 4  
    - Edge cases:  
      - API quota limits or authorization errors.  
      - Empty or malformed data in the sheet.  
      - Range out of bounds or sheet ID invalid.  
      - Large datasets might cause performance impacts.

#### 2.3 Filtering Assignments

- **Overview:** Filters rows from the planning sheet where the "Status" column is "Start" to identify posts queued for generation.
- **Nodes Involved:**  
  - Filter Status = Start
- **Node Details:**  
  - **Filter Status = Start**  
    - Type: IF node  
    - Role: Conditional check to process only rows with "Status" = "Start"  
    - Configuration:  
      - Condition: String comparison, `$json["Status"]` equals "Start"  
    - Inputs: Data from "Read Planning Sheet"  
    - Outputs: True branch routes to "Format Prompt", false branch is not connected (filtered out)  
    - Version: 1  
    - Edge cases:  
      - Missing or incorrectly named "Status" field in input JSON causes expression failure.  
      - Case sensitivity issues if "start" or "START" appears instead of "Start".

#### 2.4 Prompt Formatting

- **Overview:** Builds a prompt string for OpenAI using topic and note fields from filtered rows.
- **Nodes Involved:**  
  - Format Prompt
- **Node Details:**  
  - **Format Prompt**  
    - Type: Set node  
    - Role: Creates the prompt text for AI content generation.  
    - Configuration:  
      - Sets a single string field named "prompt" with the template:  
        `Write a guest post in German about the topic '{{ $json.Topic }}'. Include this note: '{{ $json.Note }}'`  
      - Keeps only the "prompt" field, removing all other data.  
    - Inputs: Filter output from "Filter Status = Start"  
    - Outputs: Passes prompt to "OpenAI - Generate Post"  
    - Version: 2  
    - Edge cases:  
      - Missing "Topic" or "Note" fields cause incomplete prompt text.  
      - Special characters in Topic or Note might require sanitization.  
      - Empty strings produce weak prompts.

#### 2.5 AI Content Generation

- **Overview:** Invokes OpenAI's completion API to generate guest post text based on the constructed prompt.
- **Nodes Involved:**  
  - OpenAI - Generate Post
- **Node Details:**  
  - **OpenAI - Generate Post**  
    - Type: OpenAI node  
    - Role: Generates content from AI based on prompt.  
    - Configuration:  
      - Model: text-davinci-003 (advanced, high-quality text generation)  
      - Resource: completion  
      - Prompt: Expression `{{$json["prompt"]}}`  
      - Max tokens: 1000 (limits response length)  
      - Temperature: 0.7 (balanced creativity)  
    - Inputs: Receives prompt from "Format Prompt"  
    - Outputs: Generated post data forwarded to "Save Post to Sheet"  
    - Credentials: OpenAI API key  
    - Version: 1  
    - Edge cases:  
      - API rate limits, authentication failures.  
      - Timeout or incomplete response.  
      - Unexpected content format requires validation.

#### 2.6 Saving Generated Content

- **Overview:** Appends the AI-generated guest post to the "Generated" sheet in the same Google Sheets document.
- **Nodes Involved:**  
  - Save Post to Sheet
- **Node Details:**  
  - **Save Post to Sheet**  
    - Type: Google Sheets node  
    - Role: Stores generated posts for record and review.  
    - Configuration:  
      - Operation: append  
      - Range: Generated!A1:C1 (appends starting in first row of "Generated" sheet, columns A to C)  
      - DataToSend: autoMapInputData (automatically maps incoming JSON fields)  
      - Sheet ID: same as planning sheet  
    - Inputs: Generated content from "OpenAI - Generate Post"  
    - Outputs: Passes data to "Mark as Finished" for status update  
    - Credentials: Google Sheets OAuth2 account  
    - Version: 4  
    - Edge cases:  
      - Append failures due to API limits or sheet protection.  
      - Data mapping errors if incoming data format changes.

#### 2.7 Updating Planning Status

- **Overview:** Updates the original guest post task’s status to "Finished" in the planning sheet to mark completion.
- **Nodes Involved:**  
  - Mark as Finished
- **Node Details:**  
  - **Mark as Finished**  
    - Type: Google Sheets node  
    - Role: Updates the "Status" column for the processed row to "Finished"  
    - Configuration:  
      - Operation: update  
      - Range: Planning!E:E (column E, which contains Status)  
      - Key: expression `{{$json.rowIndex}}` to identify the row index of the task  
      - DataToSend: sets column "Status" value to "Finished"  
      - Value input option: RAW (writes text as is)  
      - Sheet ID: same as planning sheet  
    - Inputs: From "Save Post to Sheet"  
    - Outputs: None (end of workflow)  
    - Credentials: Google Sheets OAuth2 account  
    - Version: 4  
    - Edge cases:  
      - Incorrect row index leads to wrong row update.  
      - Authorization or quota errors on sheet update.  
      - Concurrent updates causing race conditions.

---

### 3. Summary Table

| Node Name           | Node Type           | Functional Role                 | Input Node(s)          | Output Node(s)          | Sticky Note                      |
|---------------------|---------------------|--------------------------------|------------------------|-------------------------|---------------------------------|
| Start Trigger       | Manual Trigger       | Initiates workflow             | None                   | Read Planning Sheet     |                                 |
| Read Planning Sheet | Google Sheets        | Retrieves planning data        | Start Trigger          | Filter Status = Start   |                                 |
| Filter Status = Start| IF                   | Filters rows with Status="Start"| Read Planning Sheet    | Format Prompt           |                                 |
| Format Prompt       | Set                  | Constructs AI prompt           | Filter Status = Start   | OpenAI - Generate Post  |                                 |
| OpenAI - Generate Post | OpenAI             | Generates guest post content   | Format Prompt          | Save Post to Sheet      |                                 |
| Save Post to Sheet  | Google Sheets        | Appends generated post         | OpenAI - Generate Post | Mark as Finished        |                                 |
| Mark as Finished    | Google Sheets        | Updates status to "Finished"   | Save Post to Sheet     | None                    |                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Manual Trigger node**  
   - Name: `Start Trigger`  
   - Default configuration.

3. **Add a Google Sheets node to read planning data**  
   - Name: `Read Planning Sheet`  
   - Operation: `lookup`  
   - Range: `Planning!A1:E1000`  
   - Sheet ID: *Enter your Google Sheets document ID*  
   - Return all matches: `true`  
   - Credentials: Connect your Google Sheets OAuth2 account.

4. **Connect `Start Trigger` output to `Read Planning Sheet` input.**

5. **Add an IF node to filter rows where Status = "Start"**  
   - Name: `Filter Status = Start`  
   - Condition: String comparison  
     - Value 1: `={{$json["Status"]}}`  
     - Operation: equals  
     - Value 2: `Start`

6. **Connect `Read Planning Sheet` output to `Filter Status = Start` input.**

7. **Add a Set node to format the OpenAI prompt**  
   - Name: `Format Prompt`  
   - Set only one string field named `prompt` with the value:  
     `Write a guest post in German about the topic '{{ $json.Topic }}'. Include this note: '{{ $json.Note }}'`  
   - Enable `Keep Only Set` to remove other data.

8. **Connect the `true` output of `Filter Status = Start` to `Format Prompt`.**

9. **Add an OpenAI node to generate the guest post**  
   - Name: `OpenAI - Generate Post`  
   - Model: `text-davinci-003`  
   - Resource: `completion`  
   - Prompt: `={{$json["prompt"]}}`  
   - Max Tokens: `1000`  
   - Temperature: `0.7`  
   - Credentials: Connect your OpenAI API credentials.

10. **Connect `Format Prompt` output to `OpenAI - Generate Post` input.**

11. **Add a Google Sheets node to save the generated post**  
    - Name: `Save Post to Sheet`  
    - Operation: `append`  
    - Range: `Generated!A1:C1`  
    - Sheet ID: same as planning sheet  
    - Data to Send: `autoMapInputData`  
    - Credentials: Google Sheets OAuth2 account.

12. **Connect `OpenAI - Generate Post` output to `Save Post to Sheet` input.**

13. **Add a Google Sheets node to update status as "Finished"**  
    - Name: `Mark as Finished`  
    - Operation: `update`  
    - Range: `Planning!E:E` (Status column)  
    - Key: `={{$json.rowIndex}}` (row index from input data)  
    - Data to send: set `"Status"` column value to `"Finished"`  
    - Value Input Option: `RAW`  
    - Sheet ID: same as planning sheet  
    - Credentials: Google Sheets OAuth2 account.

14. **Connect `Save Post to Sheet` output to `Mark as Finished` input.**

15. **Save the workflow and test by triggering manually.**

---

### 5. General Notes & Resources

| Note Content                                                                                 | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Workflow automates guest post writing in German using OpenAI and task tracking in Google Sheets. | Workflow context                                                                                 |
| Google Sheets OAuth2 credentials must have read/write access to the specified spreadsheet.    | Credential setup                                                                                |
| OpenAI API key requires permissions for text generation with model `text-davinci-003`.       | Credential setup                                                                                |
| Ensure the "Planning" sheet columns include at least: Topic, Note, Status, and row indexing. | Data structure requirement                                                                      |
| Recommended to handle API quotas and errors by adding error workflows or retry mechanisms.   | Best practices for production deployment                                                       |
| For prompt customization, adjust the `Format Prompt` node’s template string accordingly.     | Customization tip                                                                              |

---

**Disclaimer:** The text provided originates exclusively from an automated workflow created with n8n, an integration and automation tool. This process complies strictly with current content policies and contains no illegal, offensive, or protected elements. All processed data is legal and public.