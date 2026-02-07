Auto Expense Tracker from LINE Messages with GPT-4 and Google Sheets

https://n8nworkflows.xyz/workflows/auto-expense-tracker-from-line-messages-with-gpt-4-and-google-sheets-6264


# Auto Expense Tracker from LINE Messages with GPT-4 and Google Sheets

### 1. Workflow Overview

This workflow automates expense tracking by capturing LINE messaging app inputs (text or images), analyzing them with GPT-4 to extract structured expense data, checking for duplicates against a Google Sheets record, and updating the sheet with new expenses. It replies to the user on LINE to confirm success or notify about duplicates or irrelevant inputs.

Logical blocks:

- **1.1 Input Reception & Type Detection**: Receives POST requests from LINE webhook, distinguishes message type (text or image).
- **1.2 AI Processing & Data Extraction**: Sends input to GPT-4 via LangChain agent with a detailed prompt to extract six expense fields in JSON.
- **1.3 Data Deduplication Preparation**: Constructs a unique key from extracted fields to identify duplicates.
- **1.4 Duplicate Check Against Google Sheets**: Queries Google Sheets for existing expense entries using the deduplication key.
- **1.5 Branching on Duplicate & Validity**: Uses switch nodes to route the workflow based on expense relevance and duplication status.
- **1.6 Data Append & User Reply**: Appends non-duplicate expense data to Google Sheets and replies to the user on LINE with confirmation or appropriate messages.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception & Type Detection

**Overview:**  
Receives incoming POST requests from LINE platform webhook and routes messages based on type (text or image).

**Nodes Involved:**  
- Webhook  
- Switch based on Expense Type  
- message (Set node)  
- image (HTTP Request)

**Node Details:**

- **Webhook**  
  - *Type:* HTTP Webhook  
  - *Config:* Listens at path `your-webhook-path` for POST requests  
  - *Inputs:* Incoming HTTP POST from LINE platform  
  - *Outputs:* Passes entire JSON payload downstream  
  - *Failure cases:* Missing or malformed webhook payloads, unauthorized requests if LINE token is invalid

- **Switch based on Expense Type**  
  - *Type:* Switch  
  - *Config:* Checks `body.events[0].message.type` field for "text" or "image"  
  - *Inputs:* Webhook output JSON  
  - *Outputs:* Routes text messages to `message` node, image messages to `image` node  
  - *Edge cases:* Unsupported message types will be ignored (no route)

- **message (Set)**  
  - *Type:* Set  
  - *Config:* Extracts `body.events[0].message.text` into a simplified JSON field for AI consumption  
  - *Inputs:* From Switch node when message type = "text"  
  - *Outputs:* Provides text content downstream  

- **image (HTTP Request)**  
  - *Type:* HTTP Request  
  - *Config:* Fetches binary content from LINE image message using message ID and authorization header with LINE Channel access token  
  - *Inputs:* From Switch node when message type = "image"  
  - *Outputs:* Passes binary image data downstream for AI analysis  
  - *Failure cases:* Invalid or expired LINE token, missing image data, network timeout

---

#### 2.2 AI Processing & Data Extraction

**Overview:**  
Uses GPT-4 via LangChain agent to analyze the text or image input and extract six structured expense data fields in JSON format. Applies a detailed prompt enforcing strict extraction rules.

**Nodes Involved:**  
- AI Agent (LangChain agent)  
- OpenAI Chat Model  
- Structured Output Parser

**Node Details:**

- **AI Agent**  
  - *Type:* LangChain Agent Node  
  - *Config:*  
    - Sends input text or image to GPT-4 with a system prompt instructing to:  
      1) Stop if input is not an expense/invoice  
      2) Extract six fields: Date, Channel, Channel Type, Expense Description, Amount, Category  
    - Uses current date for "today" references  
    - Passthrough of binary images enabled  
  - *Inputs:* Text from `message` or binary from `image` node  
  - *Outputs:* Receives structured JSON output from OpenAI  
  - *Edge cases:*  
    - Input irrelevant to expenses causes early termination  
    - GPT-4 API rate limits or errors  
    - Parsing errors if output deviates from expected JSON

- **OpenAI Chat Model**  
  - *Type:* LangChain OpenAI Chat Model  
  - *Config:* Uses GPT-4.1-mini model variant via OpenAI API credential  
  - *Inputs:* From AI Agent node via LangChain integration  
  - *Outputs:* Chat completions for AI Agent  
  - *Credential:* OpenAI API key required  
  - *Failure cases:* API key invalid, usage limits exceeded

- **Structured Output Parser**  
  - *Type:* LangChain Structured Output Parser  
  - *Config:* Auto fixes minor format errors, expects JSON with schema of six fields  
  - *Inputs:* AI Agent/Chat Model output  
  - *Outputs:* JSON object with extracted fields for downstream use  
  - *Edge cases:* Parser failure if output is badly malformed

---

#### 2.3 Data Deduplication Preparation

**Overview:**  
Constructs a unique deduplication key string by concatenating Date, Channel Type, Amount, and Category fields to identify if the expense record is already logged.

**Nodes Involved:**  
- deduplication (Set node)  

**Node Details:**

- **deduplication**  
  - *Type:* Set  
  - *Config:* Creates field `for_duplication` with value `Date-Channel Type-Amount-Category` from AI output  
  - *Inputs:* Structured Output Parser data  
  - *Outputs:* Augmented JSON including deduplication key  
  - *Notes:* Ensures consistent key format for matching  

---

#### 2.4 Duplicate Check Against Google Sheets

**Overview:**  
Searches Google Sheets for existing entries matching the deduplication key to prevent duplicate records.

**Nodes Involved:**  
- Get row(s) in sheet (Google Sheets)  
- for_deduplications (Set)  
- Aggregate

**Node Details:**

- **Get row(s) in sheet**  
  - *Type:* Google Sheets node  
  - *Config:* Reads rows from a specific sheet ("2025en") in the "Spending Tracker" document  
  - *Inputs:* deduplication node output  
  - *Outputs:* Returns existing rows for aggregation  
  - *Credential:* Google Sheets OAuth2 required  
  - *Failure cases:* Credential expiry, Google API errors

- **for_deduplications**  
  - *Type:* Set  
  - *Config:* Maps deduplication key field from Get row(s) output for aggregation  
  - *Inputs:* Google Sheets output  
  - *Outputs:* Prepares data for aggregation node

- **Aggregate**  
  - *Type:* Aggregate  
  - *Config:* Aggregates all existing deduplication keys into a list `dedupeList`  
  - *Inputs:* from `for_deduplications`  
  - *Outputs:* List of all existing keys for duplicate checking

---

#### 2.5 Branching on Duplicate & Validity

**Overview:**  
Evaluates expense relevance and duplication status to decide workflow continuation: whether to reject as irrelevant, accept new expense, or reject as duplicate.

**Nodes Involved:**  
- Merge_all (Merge)  
- Response Switch (Switch)  
- reply_to_line_no_spending (HTTP Request)  
- reply_to_line_duplicated (HTTP Request)

**Node Details:**

- **Merge_all**  
  - *Type:* Merge  
  - *Config:* Combines deduplication key and aggregated list to pass all data to switch  
  - *Inputs:* From deduplication and Aggregate nodes  
  - *Outputs:* Combined data for switch evaluation

- **Response Switch**  
  - *Type:* Switch  
  - *Config:* Routes based on `for_duplication` and duplicate list conditions:  
    - "empty" (irrelevant data): `for_duplication` matches "DN-DN-DN-DN", regex patterns, or "---"  
    - "add": not in duplicate list  
    - "duplicate": found in duplicate list  
  - *Inputs:* Merge_all output  
  - *Outputs:* Routes to appropriate response nodes

- **reply_to_line_no_spending**  
  - *Type:* HTTP Request  
  - *Config:* Sends LINE reply with message "Irrelevant details or images will not be logged."  
  - *Inputs:* Response Switch for irrelevant data branches  
  - *Failure cases:* LINE API token invalid, network issues

- **reply_to_line_duplicated**  
  - *Type:* HTTP Request  
  - *Config:* Sends LINE reply with message "This entry has already been logged and will not be duplicated"  
  - *Inputs:* Response Switch duplicate branch

---

#### 2.6 Data Append & User Reply

**Overview:**  
Appends non-duplicate expense data to Google Sheets and replies to the user confirming successful logging.

**Nodes Involved:**  
- append_to_sheet1 (Google Sheets)  
- reply_to_line (HTTP Request)

**Node Details:**

- **append_to_sheet1**  
  - *Type:* Google Sheets node  
  - *Config:* Appends or updates row in "2025en" sheet with extracted fields and `for_duplication` key  
  - *Inputs:* Response Switch "add" branch  
  - *Outputs:* Confirmation forwarded to reply node  
  - *Credential:* Google Sheets OAuth2 required  
  - *Failure cases:* Google API errors, credential expiry

- **reply_to_line**  
  - *Type:* HTTP Request  
  - *Config:* Sends LINE reply with confirmation message including a summary of the logged expense  
  - *Inputs:* From append_to_sheet1 success  
  - *Failure cases:* LINE API errors or invalid token

---

### 3. Summary Table

| Node Name                | Node Type                          | Functional Role                      | Input Node(s)                  | Output Node(s)                          | Sticky Note                                                                                             |
|--------------------------|----------------------------------|------------------------------------|-------------------------------|----------------------------------------|-------------------------------------------------------------------------------------------------------|
| Webhook                  | HTTP Webhook                     | Receives LINE webhook POST requests | None                          | Switch based on Expense Type            | ## Requirements en<br>1. Set up GCP OAuth and enable the Google Sheets API<br>2. Pre-configure Google Sheet field names<br>3. Obtain LINE Developer Webhook URL<br>4. OpenAI API Key |
| Switch based on Expense Type | Switch                         | Routes message by type (text/image) | Webhook                       | message, image                         |                                                                                                       |
| message                  | Set                             | Extracts text message for AI input  | Switch based on Expense Type (text) | AI Agent                              |                                                                                                       |
| image                    | HTTP Request                    | Fetches image content from LINE     | Switch based on Expense Type (image) | AI Agent                              |                                                                                                       |
| AI Agent                 | LangChain Agent                 | Extracts structured expense data with GPT-4 | message, image                | deduplication                          | ## Prompt en<br>Check relevance: If the text is not an expense record or invoice, stop processing.<br>Extract 6 fields in JSON format. |
| OpenAI Chat Model        | LangChain OpenAI Chat Model     | Provides GPT-4 language model       | AI Agent (langchain integration) | AI Agent                              |                                                                                                       |
| Structured Output Parser | LangChain Output Parser         | Parses GPT-4 JSON output            | AI Agent                      | deduplication                          | ## Structured Output en<br>{ "Date": "...", "Channel": "...", "Channel Type": "...", "Expense Description": "...", "Amount": "...", "Category": "..." } |
| deduplication            | Set                             | Creates deduplication key string    | Structured Output Parser      | Get row(s) in sheet, Merge_all         | ## deduplication en<br>for_duplication = Date-Channel Type-Amount-Category                            |
| Get row(s) in sheet      | Google Sheets                   | Retrieves existing rows for deduplication check | deduplication               | for_deduplications                     | ## Google Sheet Fields en<br>1. Date<br>2. Channel<br>3. Channel Type<br>4. Expense Description<br>5. Amount<br>6. Category<br>7. for_duplication |
| for_deduplications       | Set                             | Prepares deduplication keys for aggregation | Get row(s) in sheet          | Aggregate                             | ## for_deduplications en<br>Manual Mapping for_duplication                                            |
| Aggregate                | Aggregate                      | Aggregates existing deduplication keys | for_deduplications           | Merge_all                             | ## Aggregrate en<br>input for_deduplication, output dedupeList                                        |
| Merge_all                | Merge                          | Combines current key and list of existing keys | deduplication, Aggregate     | Response Switch                      |                                                                                                       |
| Response Switch          | Switch                         | Routes based on duplication and relevance | Merge_all                  | reply_to_line_no_spending, append_to_sheet1, reply_to_line_duplicated | ## Switch en<br>Conditions for empty, add, duplicate branches                                         |
| reply_to_line_no_spending | HTTP Request                   | Replies to user for irrelevant or empty inputs | Response Switch (empty)       | None                                 |                                                                                                       |
| append_to_sheet1         | Google Sheets                  | Appends new expense data to Google Sheet | Response Switch (add)         | reply_to_line                        |                                                                                                       |
| reply_to_line            | HTTP Request                   | Replies to user confirming expense logged | append_to_sheet1             | None                                 |                                                                                                       |
| reply_to_line_duplicated | HTTP Request                   | Replies to user about duplicate expense entry | Response Switch (duplicate)   | None                                 |                                                                                                       |
| Sticky Note              | Sticky Note                    | Prompt instructions in English/Chinese | None                        | None                                 | See prompt content in section 2.2                                                                     |
| Sticky Note1             | Sticky Note                    | Structured output JSON example      | None                        | None                                 | See structured output JSON example in section 2.2                                                    |
| Sticky Note2             | Sticky Note                    | Deduplication key explanation       | None                        | None                                 | See deduplication formula in section 2.3                                                             |
| Sticky Note3             | Sticky Note                    | Google Sheets field setup           | None                        | None                                 | See Google Sheet Fields in section 2.4                                                               |
| Sticky Note4             | Sticky Note                    | for_deduplications manual mapping   | None                        | None                                 | See manual mapping note in section 2.4                                                               |
| Sticky Note5             | Sticky Note                    | Aggregate input/output explanation  | None                        | None                                 | See aggregation details in section 2.4                                                               |
| Sticky Note6             | Sticky Note                    | Switch node condition explanations  | None                        | None                                 | See switch condition logic details in section 2.5                                                    |
| Sticky Note7             | Sticky Note                    | Overall requirements summary        | None                        | None                                 | See requirements in section 2.1                                                                       |

---

### 4. Reproducing the Workflow from Scratch

1. **Create HTTP Webhook node**  
   - Name: `Webhook`  
   - Path: `your-webhook-path`  
   - Method: `POST`  
   - Purpose: Receive incoming LINE webhook events  

2. **Add Switch node for message type detection**  
   - Name: `Switch based on Expense Type`  
   - Condition:  
     - If `body.events[0].message.type` equals `"text"`, output "text"  
     - If `body.events[0].message.type` equals `"image"`, output "image"  
   - Connect `Webhook` node output to this node  

3. **Add Set node to extract text**  
   - Name: `message`  
   - Assign value: `body.events[0].message.text` as string  
   - Connect "text" output of Switch node to this node  

4. **Add HTTP Request node to fetch image content**  
   - Name: `image`  
   - Method: `GET`  
   - URL: `https://api-data.line.me/v2/bot/message/{{ $json.body.events[0].message.id }}/content`  
   - Headers:  
     - Authorization: `Bearer <Line Channel access token>` (replace with actual token)  
   - Connect "image" output of Switch node to this node  

5. **Add LangChain OpenAI Chat Model node**  
   - Name: `OpenAI Chat Model`  
   - Model: `gpt-4.1-mini` or equivalent GPT-4 model  
   - Credential: Configure with your OpenAI API key  
   - No direct input connection (used internally by AI Agent node)  

6. **Add LangChain Agent node**  
   - Name: `AI Agent`  
   - Text input: `"Please analyze {{ $json.body.events[0].message.text }} or the image"`  
   - System Message (prompt):  
     ```
     Check relevance: If the text is not an expense record or invoice, immediately stop all processing. If it is bookkeeping-related, extract the six data fields below.
     Extract these six pieces of information: 
       1. Date (If "today" use current date)
       2. Channel (Free text)
       3. Channel Type (Choose exactly one of: Convenience Store, Personal Care Store, Hypermarket / Supermarket, Traditional Market, Online Shopping, Pharmacy, Hardware Store, Restaurant / Food, Stall, Medical Clinic / Hospital, 3C / Electronics Mall, Airline / Passenger Transport, Software Top-Up, Gas / Transit Top-Up, Online Course, Telecom Company)
       4. Expense Description (Free text)
       5. Amount
       6. Category (Choose exactly one of: Household, Main Meals, Drinks & Desserts, Household Items, Beauty, Clothing & Accessories, Transport, Entertainment, Telecom, Medical, 3C, Software, Learning, Travel)
     Output format: JSON with fields Date, Channel, Channel Type, Expense Description, Amount, Category
     ```
   - Enable passthrough of binary images  
   - Connect input from `message` and `image` nodes (branch outputs respectively)  
   - Link OpenAI Chat Model as AI language model node for this agent  
   
7. **Add Structured Output Parser node**  
   - Name: `Structured Output Parser`  
   - Auto fix enabled  
   - JSON schema example:  
     ```json
     {
       "Date": "...",
       "Channel": "...",
       "Channel Type": "...",
       "Expense Description": "...",
       "Amount": "...",
       "Category": "..."
     }
     ```  
   - Connect output of AI Agent node to this parser  

8. **Add Set node for deduplication key**  
   - Name: `deduplication`  
   - Assign field `for_duplication` as:  
     `={{ $json.output.Date }}-{{ $json.output['Channel Type'] }}-{{ $json.output.Amount }}-{{ $json.output.Category }}`  
   - Include other fields from AI output  
   - Connect from Structured Output Parser output  

9. **Add Google Sheets node to get existing rows**  
   - Name: `Get row(s) in sheet`  
   - Operation: Read rows  
   - Document ID: Your Google Sheets spending tracker document ID  
   - Sheet Name/ID: Specific sheet for 2025 expenses  
   - Credential: Google Sheets OAuth2 credential configured and authorized for this sheet  
   - Connect from `deduplication` node  

10. **Add Set node to map deduplication keys from sheet rows**  
    - Name: `for_deduplications`  
    - Map field `for_duplication` from rows retrieved  
    - Connect from `Get row(s) in sheet` node  

11. **Add Aggregate node**  
    - Name: `Aggregate`  
    - Aggregate field: `for_duplication` with rename output `dedupeList`  
    - Connect from `for_deduplications` node  

12. **Add Merge node**  
    - Name: `Merge_all`  
    - Mode: Combine by position  
    - Connect from `deduplication` (main input) and `Aggregate` (second input)  

13. **Add Switch node to route based on duplication and relevance**  
    - Name: `Response Switch`  
    - Conditions:  
      - Output `empty` if `for_duplication` equals `"DN-DN-DN-DN"` or matches regex `^.*-DN-DN-DN$` or equals `"---"`  
      - Output `add` if `for_duplication` is **not** in `dedupeList`  
      - Output `duplicate` if `for_duplication` **is** in `dedupeList`  
    - Connect from `Merge_all` node  

14. **Add HTTP Request node to reply for no spending detected**  
    - Name: `reply_to_line_no_spending`  
    - URL: `https://api.line.me/v2/bot/message/reply`  
    - Method: POST  
    - Headers: Include `Authorization: Bearer <Line Channel access token>` and `Content-Type: application/json`  
    - Body (JSON): Reply token from webhook and message: "Irrelevant details or images will not be logged."  
    - Connect from `Response Switch` empty outputs  

15. **Add HTTP Request node to reply for duplicate expense**  
    - Name: `reply_to_line_duplicated`  
    - Config similar to above, message: "This entry has already been logged and will not be duplicated"  
    - Connect from `Response Switch` duplicate output  

16. **Add Google Sheets node to append new expense**  
    - Name: `append_to_sheet1`  
    - Operation: Append or update row based on `for_duplication` key  
    - Map columns: Date, Channel, Channel Type, Expense Description, Amount, Category, for_duplication from AI output and set node  
    - Credential: Same Google Sheets OAuth2 credential  
    - Connect from `Response Switch` add output  

17. **Add HTTP Request node to confirm logging success**  
    - Name: `reply_to_line`  
    - Similar config as other reply nodes  
    - Message: "✅ Expense recorded successfully: {{ for_duplication }}" or a summary from merged data  
    - Connect from `append_to_sheet1` success output  

18. **Test workflow end-to-end with sample LINE messages**  
    - Confirm webhook receives events  
    - Confirm AI extracts data correctly  
    - Confirm duplicates are detected  
    - Confirm Google Sheets updates  
    - Confirm LINE replies arrive correctly  

---

### 5. General Notes & Resources

| Note Content                                                                                                                              | Context or Link                                                                                              |
|-------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Workflow requires setting up GCP OAuth and enabling Google Sheets API for access                                                          | See Sticky Note7 content                                                                                     |
| LINE Channel access token must be kept secure and updated if expired                                                                      | LINE Developer Console                                                                                       |
| OpenAI API key must have GPT-4 access enabled                                                                                             | OpenAI API platform                                                                                          |
| Google Sheet columns must be pre-configured exactly as: Date, Channel, Channel Type, Expense Description, Amount, Category, for_duplication | See Sticky Note3 content                                                                                      |
| Prompt instructions enforce strict data extraction and stop workflow if irrelevant, improving accuracy and reducing noise                 | See Sticky Note content in section 2.2                                                                        |
| Deduplication key format critical to avoid duplicate entries                                                                              | See Sticky Note2 content                                                                                      |
| For troubleshooting: monitor API call limits, check webhook security and payload formats, verify OAuth tokens and permissions             | General best practices                                                                                         |

---

**Disclaimer:**  
The text provided is derived exclusively from an automated workflow created using n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected material. All data handled is legal and public.