Auto Categorise Outlook Emails with AI

https://n8nworkflows.xyz/workflows/auto-categorise-outlook-emails-with-ai-2454


# Auto Categorise Outlook Emails with AI

### 1. Workflow Overview

This workflow automates the categorization and organization of emails in Microsoft Outlook using AI. It targets freelancers and business professionals dealing with high email volumes, enabling efficient inbox management by categorizing emails into predefined folders and labels.

The workflow logic is divided into these functional blocks:

- **1.1 Input Reception and Email Fetching:** Trigger execution manually and fetch emails from Outlook with specific filters to exclude flagged or already categorized messages.
- **1.2 Email Content Preparation:** Sanitize and convert email bodies to Markdown, then further clean text for AI processing.
- **1.3 AI Categorization:** Use an AI language model (Ollama API) to analyze the email content and assign categories and subcategories.
- **1.4 Category Parsing and Routing:** Convert AI output to JSON, route emails based on categories using a switch node, and apply category updates.
- **1.5 Folder Management and Email Updates:** Move emails to corresponding Outlook folders and update email categories accordingly.
- **1.6 Conditional Processing and Error Handling:** Check if emails are read to finalize processing and handle any errors gracefully.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and Email Fetching

**Overview:**  
This block initiates the workflow manually and retrieves Outlook emails filtered to exclude flagged or categorized emails.

**Nodes Involved:**  
- When clicking ‘Test workflow’ (Manual Trigger)  
- Microsoft Outlook23 (Fetch emails)  
- Filter1 (Filter emails without categories)  
- Loop Over Items1 (Batch processing of emails)

**Node Details:**

- **When clicking ‘Test workflow’**  
  - Type: Manual Trigger  
  - Role: Starts workflow on manual activation  
  - Inputs: None  
  - Outputs: Triggers Microsoft Outlook23  
  - Failure cases: None (manual trigger)  

- **Microsoft Outlook23**  
  - Type: Microsoft Outlook node (Get All)  
  - Role: Retrieves emails from a specified Outlook folder ("Inbox")  
  - Config:  
    - Filter: `flag/flagStatus eq 'notFlagged' and not categories/any()`  
    - Fields fetched: flag, from, importance, replyTo, sender, subject, toRecipients, body, categories, isRead  
    - Limits to 1 email per run (can be increased)  
  - Inputs: Trigger node  
  - Outputs: Emails matching filter  
  - Edge cases: API rate limits, auth errors if token expired, folder not accessible  
  - Sticky note: Explains the filter usage to exclude flagged and categorized emails  

- **Filter1**  
  - Type: Filter node  
  - Role: Further ensures only emails without categories are processed  
  - Config: Checks if `categories` field is empty  
  - Inputs: Microsoft Outlook23 output  
  - Outputs: Passes emails without categories to batch processing  
  - Edge cases: Expression evaluation errors if `categories` field missing  

- **Loop Over Items1**  
  - Type: SplitInBatches  
  - Role: Processes emails one by one for downstream nodes  
  - Config: Default batch size (usually 1)  
  - Inputs: Filter1 output  
  - Outputs: Single email per batch to next block  

---

#### 2.2 Email Content Preparation

**Overview:**  
Sanitizes and converts email bodies into Markdown and cleans text to prepare structured input for AI.

**Nodes Involved:**  
- Markdown1 (Convert email body HTML to Markdown)  
- varEmal1 (Set cleaned email fields and text)

**Node Details:**

- **Markdown1**  
  - Type: Markdown node  
  - Role: Converts the HTML content of the email body to Markdown format  
  - Config: Takes `body.content` from current email item  
  - Inputs: Loop Over Items1 output (email)  
  - Outputs: Markdown version of email body  
  - Edge cases: HTML content malformed, empty email body  

- **varEmal1**  
  - Type: Set node  
  - Role: Extracts and cleans relevant email fields and sanitizes body text for AI  
  - Config:  
    - Fields set: subject, importance, sender, from  
    - Body cleaned by removing HTML tags, markdown links, images, special characters, multiple spaces, and trimmed  
  - Inputs: Markdown1 output  
  - Outputs: Cleaned email data formatted for AI input  
  - Edge cases: Unexpected HTML escaping, missing fields, regex failures  
  - Sticky note: Describes sanitization purpose  

---

#### 2.3 AI Categorization

**Overview:**  
Uses the Ollama language model to categorize emails into predefined categories with reasoning, returning structured JSON output.

**Nodes Involved:**  
- varID & Category1 (Set email id and allowed categories)  
- AI Agent1 (Langchain AI agent)  
- Ollama Chat Model1 (AI model node)  
- varJSON1 (Parse AI output to JSON)  
- Catch Errors1 (Catch and handle JSON parsing errors)

**Node Details:**

- **varID & Category1**  
  - Type: Set node  
  - Role: Sets the current email ID and declares allowed categories for AI  
  - Config:  
    - id from email JSON `id`  
    - category list: "action", "junk", "receipt", "SaaS", "community", "business", "other"  
  - Inputs: varEmal1 output  
  - Outputs: Prepared email ID and category list for AI prompt  
  - Sticky note: Indicates user can customize categories here  

- **AI Agent1**  
  - Type: Langchain AI Agent  
  - Role: Sends email data to AI for categorization  
  - Config:  
    - Prompt includes cleaned email data with instructions for JSON output format  
    - Uses categories from varID & Category1  
    - System message defines category priorities and interpretation rules  
    - Temperature set low (0.2) for consistent output  
  - Inputs: varID & Category1 output  
  - Outputs: AI categorization JSON string  
  - Edge cases: API failures, malformed AI output, timeout  
  - Sub-workflow: Uses Ollama Chat Model1 as AI backend  

- **Ollama Chat Model1**  
  - Type: Ollama language model node  
  - Role: Provides AI model interface for Langchain agent  
  - Config: Model "qwen2.5:14b", temperature 0.2  
  - Inputs: AI Agent1 language model input  
  - Outputs: AI response for categorization  

- **varJSON1**  
  - Type: Set node  
  - Role: Extracts JSON object from AI output string  
  - Config: Uses regex to extract JSON substring from AI output  
  - On error: Continue workflow (ignore conversion errors)  
  - Inputs: AI Agent1 output  
  - Outputs: Parsed JSON object with category info  
  - Edge cases: AI output not valid JSON, partial output  
  - Sticky note: Describes conversion and error tolerance  

- **Catch Errors1**  
  - Type: Set node  
  - Role: Captures error details from varJSON1 failures  
  - Config: Saves error JSON for logging or debugging  
  - Inputs: varJSON1 error output  
  - Outputs: Continues workflow despite errors  

---

#### 2.4 Category Parsing and Routing

**Overview:**  
Routes emails to different update and move actions based on AI categories using a Switch node.

**Nodes Involved:**  
- Switch1 (Route based on category)  
- Microsoft Outlook12, 13, 16, 18, 20, 21, 22 (Update email categories)  
- Microsoft Outlook15, 17, 19, Microsoft Outlook Move Message1 (Move emails to folders)

**Node Details:**

- **Switch1**  
  - Type: Switch node  
  - Role: Routes emails based on `output.category` from AI JSON  
  - Config: Matches categories: junk, receipt, SaaS, community, action, business  
  - Has fallback output "extra" for unknown categories  
  - Inputs: varJSON1 output  
  - Outputs: Directs to corresponding Microsoft Outlook update nodes  
  - Sticky note: Advises matching categories with varID & Category1 node  

- **Microsoft Outlook12, 13, 16, 18, 20, 21, 22**  
  - Type: Microsoft Outlook nodes (Update operation)  
  - Role: Update email `categories` field with AI results (category and subCategory)  
  - Config:  
    - Uses email ID from varID & Category1  
    - Categories capitalized and filtered for blanks  
  - Inputs: Switch1 outputs respective to categories  
  - Outputs: Trigger respective folder move nodes or next steps  
  - Edge cases: API update errors, permission issues  

- **Microsoft Outlook15, 17, 19**  
  - Type: Microsoft Outlook nodes (Move operation)  
  - Role: Move email to specific Outlook folders based on category  
  - Config: Folder IDs correspond to "Receipt", "Community", and "SaaS" folders respectively  
  - Inputs: Corresponding update nodes (13,16,18)  
  - Outputs: Merge1 node for batch merging  
  - Edge cases: Folder ID invalid, message ID missing  

- **Microsoft Outlook Move Message1**  
  - Type: Microsoft Outlook node (Move operation)  
  - Role: Moves emails categorized as "action" to "Actioned" folder  
  - Inputs: If1 node (conditional)  
  - Outputs: Merge1 node  
  - Edge cases: Same as other move nodes  

- **Merge1**  
  - Type: Merge node  
  - Role: Merges outputs from multiple move/update nodes to continue processing  
  - Config: Accepts 7 inputs (one per category branch)  
  - Inputs: Outputs from all move/update nodes  
  - Outputs: Loops back to Loop Over Items1 to continue processing next emails  

---

#### 2.5 Conditional Processing and Final Checks

**Overview:**  
Ensures that emails processed are unread before final moving actions, enabling selective processing and workflow stability.

**Nodes Involved:**  
- If1 (Check if email is read)  
- Microsoft Outlook Move Message1 (Move "action" emails)  
- Microsoft Outlook20, 22 (Update categories for "action" and "business")  
- Merge1 (Merge all outputs)

**Node Details:**

- **If1**  
  - Type: If node  
  - Role: Checks if the email `isRead` flag is true  
  - Config: Condition tests `$json.isRead == true`  
  - Inputs: Microsoft Outlook20 output  
  - Outputs:  
    - True: Move email to "Actioned" folder (Microsoft Outlook Move Message1)  
    - False: Continue merging without move  
  - Edge cases: Missing `isRead` field, expression errors  
  - Sticky note: Highlights check for read status  

- **Microsoft Outlook20, 22**  
  - Update operations for categories "action" and "business" emails before conditional move or merge  
  - Inputs and outputs tied into If1 and Merge1  

---

### 3. Summary Table

| Node Name                  | Node Type                        | Functional Role                         | Input Node(s)                 | Output Node(s)                | Sticky Note                                                                                       |
|----------------------------|---------------------------------|---------------------------------------|------------------------------|------------------------------|-------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                  | Workflow start                        | -                            | Microsoft Outlook23           |                                                                                                 |
| Microsoft Outlook23         | Microsoft Outlook (Get All)      | Fetch emails with filters             | When clicking ‘Test workflow’ | Filter1                      | ## Outlook Business with filters: Filters exclude flagged or categorized emails                  |
| Filter1                    | Filter                          | Pass emails without categories        | Microsoft Outlook23           | Loop Over Items1              |                                                                                                 |
| Loop Over Items1           | SplitInBatches                  | Batch processing emails one by one    | Filter1                      | Markdown1, Catch Errors1 (on error branch) |                                                                                                 |
| Markdown1                  | Markdown                        | Convert email body HTML to Markdown   | Loop Over Items1              | varEmal1                     | Converts the body of the email to markdown                                                      |
| varEmal1                   | Set                            | Sanitize email content and set fields | Markdown1                    | varID & Category1            | ## Sanitise Email: removes HTML and useless info for AI                                         |
| varID & Category1          | Set                            | Set email ID and allowed categories    | varEmal1                     | AI Agent1                   | ## Modify Categories: Edit to customize category selection                                      |
| AI Agent1                  | Langchain AI Agent              | Categorize email via AI                | varID & Category1            | varJSON1                    |                                                                                                 |
| Ollama Chat Model1         | Ollama Language Model           | AI model backend for categorization   | AI Agent1 (languageModel input) | AI Agent1                  |                                                                                                 |
| varJSON1                   | Set                            | Parse AI output to JSON                | AI Agent1                    | Switch1, Catch Errors1       | ## Convert to JSON: Ensures AI output is valid JSON; catches errors and continues processing    |
| Catch Errors1              | Set                            | Capture errors from JSON parsing       | varJSON1 (error output)       | Loop Over Items1             |                                                                                                 |
| Switch1                    | Switch                         | Route emails based on category         | varJSON1                     | Microsoft Outlook12, 13, 16, 18, 20, 21, 22 | ## Switch Categories: Ensure categories match varID & Category1 node                            |
| Microsoft Outlook12        | Microsoft Outlook (Update)      | Update categories for "junk" emails    | Switch1 (junk output)         | Microsoft Outlook10          | ## Set Categories                                                                                |
| Microsoft Outlook10        | Microsoft Outlook (Move)        | Move "junk" emails to Junk Email folder | Microsoft Outlook12          | Merge1                      | ## Move to Folders                                                                              |
| Microsoft Outlook13        | Microsoft Outlook (Update)      | Update categories for "receipt" emails | Switch1 (receipt output)      | Microsoft Outlook15          |                                                                                                 |
| Microsoft Outlook15        | Microsoft Outlook (Move)        | Move "receipt" emails to Receipt folder | Microsoft Outlook13          | Merge1                      |                                                                                                 |
| Microsoft Outlook16        | Microsoft Outlook (Update)      | Update categories for "community" emails | Switch1 (community output)   | Microsoft Outlook17          |                                                                                                 |
| Microsoft Outlook17        | Microsoft Outlook (Move)        | Move "community" emails to Community folder | Microsoft Outlook16          | Merge1                      |                                                                                                 |
| Microsoft Outlook18        | Microsoft Outlook (Update)      | Update categories for "SaaS" emails    | Switch1 (SaaS output)         | Microsoft Outlook19          |                                                                                                 |
| Microsoft Outlook19        | Microsoft Outlook (Move)        | Move "SaaS" emails to SaaS folder      | Microsoft Outlook18          | Merge1                      |                                                                                                 |
| Microsoft Outlook20        | Microsoft Outlook (Update)      | Update categories for "action" emails  | Switch1 (action output)       | If1                         |                                                                                                 |
| If1                        | If                             | Check if email is read                  | Microsoft Outlook20          | Microsoft Outlook Move Message1 (true), Merge1 (false) | ## Check if email has been read                                                                |
| Microsoft Outlook Move Message1 | Microsoft Outlook (Move)   | Move "action" emails to Actioned folder | If1 (true output)           | Merge1                      |                                                                                                 |
| Microsoft Outlook21        | Microsoft Outlook (Update)      | Update categories for "business" emails | Switch1 (business output)    | Merge1                      |                                                                                                 |
| Microsoft Outlook22        | Microsoft Outlook (Update)      | Update categories for "business" emails | Switch1 (business output)    | If1                         |                                                                                                 |
| Merge1                     | Merge                          | Merge outputs from all categories      | Multiple move/update nodes    | Loop Over Items1             |                                                                                                 |
| Sticky Note8               | Sticky Note                    | Workflow title and author info          | -                            | -                           | # Auto Categorise Outlook Emails with AI, built by Wayne Simpson at nocodecreative.io           |
| Sticky Note9               | Sticky Note                    | YouTube setup video link                 | -                            | -                           | Watch Set Up Video 👇 https://www.youtube.com/watch?v=EhRBkkjv_3c                              |
| Sticky Note10              | Sticky Note                    | Explanation of Outlook filters           | -                            | -                           | ## Outlook Business with filters: Filters exclude flagged or categorized emails                 |
| Sticky Note11              | Sticky Note                    | Sanitization explanation                  | -                            | -                           | ## Sanitise Email: removes HTML and useless info for AI                                        |
| Sticky Note12              | Sticky Note                    | Modify category selection guide           | -                            | -                           | ## Modify Categories: Edit to customize category selection                                    |
| Sticky Note13              | Sticky Note                    | JSON conversion and error handling notes | -                            | -                           | ## Convert to JSON: Ensures AI output is valid JSON; catches errors and continues processing   |
| Sticky Note14              | Sticky Note                    | Category switch node explanation          | -                            | -                           | ## Switch Categories: Ensure categories match varID & Category1 node                          |
| Sticky Note15              | Sticky Note                    | Set categories explanation                  | -                            | -                           | ## Set Categories                                                                             |
| Sticky Note16              | Sticky Note                    | Move to folders explanation                 | -                            | -                           | ## Move to Folders                                                                           |
| Sticky Note17              | Sticky Note                    | Read email check explanation                 | -                            | -                           | ## Check if email has been read                                                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Manual Trigger Node**  
   - Name: "When clicking ‘Test workflow’"  
   - Purpose: Manually start the workflow.

2. **Add Microsoft Outlook Node (Get All Emails)**  
   - Name: "Microsoft Outlook23"  
   - Operation: `getAll`  
   - Folder: Select Inbox or desired mail folder  
   - Filters: Set filter to `"flag/flagStatus eq 'notFlagged' and not categories/any()"` to exclude flagged or categorized emails  
   - Limit: Set to 1 or more depending on batch size  
   - Fields: Request relevant fields including flag, from, importance, replyTo, sender, subject, toRecipients, body, categories, isRead  
   - Connect Manual Trigger output to this node.

3. **Add Filter Node**  
   - Name: "Filter1"  
   - Condition: Check if `categories` field is empty (array empty or string empty)  
   - Connect Microsoft Outlook23 output to Filter1 input.

4. **Add SplitInBatches Node**  
   - Name: "Loop Over Items1"  
   - Default batch size 1  
   - Connect Filter1 output to this node.

5. **Add Markdown Node**  
   - Name: "Markdown1"  
   - Input: HTML content from email body (e.g., `{{$json["body"]["content"]}}`)  
   - Connect Loop Over Items1 output to Markdown1.

6. **Add Set Node to Sanitize Email**  
   - Name: "varEmal1"  
   - Assign fields:  
     - subject from email JSON  
     - importance  
     - sender email address  
     - from email address  
     - body: apply regex replacements to remove HTML tags, markdown links/images, table separators, horizontal rules, multiple newlines, special characters except basic punctuation, and trim whitespace  
   - Connect Markdown1 output to varEmal1.

7. **Add Set Node to Prepare AI Input**  
   - Name: "varID & Category1"  
   - Assign fields:  
     - id: email id from Microsoft Outlook23 (or current item)  
     - category: string listing allowed categories `"action", "junk", "receipt", "SaaS", "community", "business", "other"`  
   - Connect varEmal1 output to this node.

8. **Add Langchain AI Agent Node**  
   - Name: "AI Agent1"  
   - Configure prompt to categorize email with instruction to output valid JSON using categories from varID & Category1 node  
   - System message to define category priorities, rules, and example JSON output  
   - Set temperature low (0.2) for predictable output  
   - Connect varID & Category1 output to AI Agent1.

9. **Add Ollama Chat Model Node**  
   - Name: "Ollama Chat Model1"  
   - Model: "qwen2.5:14b"  
   - Temperature: 0.2  
   - Connect AI Agent1's languageModel input to this node.

10. **Add Set Node to Parse JSON from AI output**  
    - Name: "varJSON1"  
    - Use regex to extract JSON object from AI response string  
    - Enable "Continue on error" to avoid workflow stop on parsing issues  
    - Connect AI Agent1 output to varJSON1.

11. **Add Set Node for Error Handling**  
    - Name: "Catch Errors1"  
    - Capture error messages or JSON parsing issues  
    - Connect error output of varJSON1 to Catch Errors1  
    - Connect Catch Errors1 output back to Loop Over Items1 to continue processing.

12. **Add Switch Node to Route by Category**  
    - Name: "Switch1"  
    - Rules: Match categories "junk", "receipt", "SaaS", "community", "action", "business" from varJSON1 output's `output.category` field  
    - Configure fallback for unknown categories  
    - Connect varJSON1 main output to Switch1.

13. **Add Microsoft Outlook Update Nodes for Each Category**  
    - Nodes: Microsoft Outlook12 (junk), 13 (receipt), 16 (community), 18 (SaaS), 20 (action), 21 (business), 22 (business update)  
    - Operation: `update`  
    - Update field: `categories` set to array `[category, subCategory]` capitalized and filtered for blanks from AI output  
    - Use email ID from varID & Category1  
    - Connect each Switch1 output to corresponding update node.

14. **Add Microsoft Outlook Move Nodes for Folder Management**  
    - Microsoft Outlook10: Move "junk" emails to Junk Email folder  
    - Microsoft Outlook15: Move "receipt" emails to Receipt folder  
    - Microsoft Outlook17: Move "community" emails to Community folder  
    - Microsoft Outlook19: Move "SaaS" emails to SaaS folder  
    - Microsoft Outlook Move Message1: Move "action" emails to Actioned folder (conditional)  
    - Configure folder IDs accordingly (copy from existing Outlook folders or use folder picker)  
    - Connect update nodes to their respective move nodes.

15. **Add If Node to Check Email Read Status**  
    - Name: "If1"  
    - Condition: Check if `$json.isRead` is true  
    - Connect Microsoft Outlook20 output (action emails update) to If1  
    - True output: Connect to Microsoft Outlook Move Message1 (move to Actioned)  
    - False output: Connect to Merge1 node

16. **Add Merge Node**  
    - Name: "Merge1"  
    - Configure to accept 7 inputs (for 7 category branches)  
    - Connect all move and update nodes outputs to Merge1 inputs  
    - Connect Merge1 output back to Loop Over Items1 for next email processing batch

17. **Credentials Setup**  
    - Microsoft Outlook: Provide OAuth2 credentials for your Outlook account  
    - Ollama API: Provide API access credentials for Ollama model usage

18. **Adjustments**  
    - Modify categories in varID & Category1 node as needed  
    - Adjust folder IDs in move nodes to match your Outlook folder structure  
    - Increase Microsoft Outlook23 limit if processing more emails per run  
    - Review error handling (Catch Errors1) and logging preferences

---

### 5. General Notes & Resources

| Note Content                                                                                       | Context or Link                                               |
|--------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| Automate your email management with AI-powered categorization tailored for freelancers and professionals. | Workflow purpose summary                                       |
| [Check out the YouTube video for step-by-step setup instructions!](https://www.youtube.com/watch?v=EhRBkkjv_3c) | Setup video linked in Sticky Note9                             |
| Built by Wayne Simpson at nocodecreative.io                                                      | Author and project credit in Sticky Note8                     |
| Outlook filter: `flag/flagStatus eq 'notFlagged' and not categories/any()`                       | Ensures only unflagged and uncategorized emails are processed |
| Category priorities and usage instructions are embedded in the AI Agent system message prompt     | Critical for correct AI categorization                         |
| Categories: action, junk, receipt, SaaS, community, business, other                              | Defined categories in workflow; modify with care              |
| Email sanitization includes removing HTML, markdown links/images, special characters, and extra spaces | Improves AI input quality                                      |
| Error handling node (Catch Errors1) ensures workflow continues despite JSON parse failures        | Improves robustness                                            |
| Folder IDs must be updated to match user-specific Outlook folders                                 | Required for correct email movement                            |
| AI temperature set low (0.2) for consistent output                                               | Balances creativity vs consistency in AI responses            |

---

This document provides a comprehensive, structured reference for understanding, reproducing, and modifying the "Auto Categorise Outlook Emails with AI" workflow in n8n, helping users manage their Outlook inbox efficiently using AI-driven automation.