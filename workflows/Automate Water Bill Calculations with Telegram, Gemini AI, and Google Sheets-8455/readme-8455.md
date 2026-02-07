Automate Water Bill Calculations with Telegram, Gemini AI, and Google Sheets

https://n8nworkflows.xyz/workflows/automate-water-bill-calculations-with-telegram--gemini-ai--and-google-sheets-8455


# Automate Water Bill Calculations with Telegram, Gemini AI, and Google Sheets

### 1. Workflow Overview

This workflow automates water bill calculations using Telegram as the input channel, Google Gemini AI for image processing, and Google Sheets for data storage. It targets property managers or community administrators who want to collect water meter readings via Telegram images, process the readings with AI, calculate billing based on volume differences and rates, and then record and notify users of their bills.

The workflow is logically divided into these blocks:

- **1.1 Input Reception and Routing:** Receives user messages via Telegram, detects message type (image vs. text), and fetches the image file.
- **1.2 AI Image Processing and Data Extraction:** Sends the water meter image to Google Gemini AI to extract the meter reading (in m³), parses the structured output.
- **1.3 Lookup Previous Records:** Retrieves existing billing data from Google Sheets, finds the latest entry per user.
- **1.4 Bill Calculation:** Calculates the difference in meter readings, computes charges based on unit price and fixed fees, formats dates.
- **1.5 Data Preparation and Storage:** Prepares data fields and appends a new row to the Google Sheet with updated billing info.
- **1.6 Billing Message Formatting and Notification:** Formats the current and previous bill data into a message and sends it back to the user on Telegram.

Two sticky notes provide setup instructions and a short explanation of the bot's logic.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception and Routing

**Overview:**  
This block receives incoming Telegram messages via webhook, determines if the message contains a photo or is text, and fetches the photo file if applicable.

**Nodes Involved:**  
- Telegram Trigger  
- Redirect Message Types (Switch)  
- Get a file (Telegram)  

**Node Details:**

- **Telegram Trigger**  
  - Type: Telegram Trigger node  
  - Role: Entry point webhook for Telegram bot messages  
  - Config: Listens for "message" update types only  
  - Input: None (webhook)  
  - Output: Emits Telegram message JSON  
  - Edge cases: Missing or malformed messages; Telegram API downtime

- **Redirect Message Types (Switch)**  
  - Type: Switch node  
  - Role: Routes message flow based on message content type (photo presence)  
  - Config: Checks if the first photo exists in message JSON (`message.photo[0]` exists)  
  - Outputs:  
    - "Image Message" if photo exists  
    - "Text Message" fallback (not further handled here)  
  - Input: Telegram Trigger output  
  - Output: Routes to "Get a file" node for images  
  - Edge cases: Messages with no photo or unexpected message structures

- **Get a file (Telegram)**  
  - Type: Telegram node (Get file)  
  - Role: Downloads the largest photo file from the Telegram message (index 3) for processing  
  - Config: Uses expression to access `message.photo[3].file_id` (largest size)  
  - Input: Redirect Message Types output (Image Message)  
  - Output: Binary image data of the water meter photo  
  - Edge cases: Missing photo at index 3, file retrieval errors, network issues

---

#### 1.2 AI Image Processing and Data Extraction

**Overview:**  
Processes the downloaded water meter image using Google Gemini AI to extract the meter reading (in m³) and parses the structured response.

**Nodes Involved:**  
- Google Gemini Chat Model  
- Structured Output Parser  
- Image Explainer (Langchain Chain LLM)  

**Node Details:**

- **Google Gemini Chat Model**  
  - Type: Langchain Google Gemini Chat Model  
  - Role: Sends image data to Google Gemini AI for interpretation  
  - Config: Default options (uses n8n credentials for Gemini API)  
  - Input: Not directly connected from the workflow JSON (possibly internal in Langchain node)  
  - Output: AI model response with extracted data  
  - Edge cases: API key invalid, rate limits, response parsing errors

- **Structured Output Parser**  
  - Type: Langchain Output Parser Structured  
  - Role: Parses Gemini AI output into a JSON schema with keys `"m3"` (meter reading) and `"caption"` (user name)  
  - Config: Uses a JSON schema example for validation  
  - Input: Google Gemini Chat Model output  
  - Output: Structured JSON data for further use  
  - Edge cases: Malformed AI output, schema mismatch

- **Image Explainer (Langchain Chain LLM)**  
  - Type: Langchain Chain LLM node  
  - Role: Main node tying AI image input and text prompt, calls Gemini model and parses output  
  - Config: Prompt instructs to extract meter reading inside the box in m³; uses HumanMessagePromptTemplate with image binary input  
  - Input: Binary image from "Get a file" node  
  - Output: Parsed meter reading and caption  
  - Edge cases: AI misinterpretation, image quality issues

---

#### 1.3 Lookup Previous Records

**Overview:**  
Fetches existing data rows from Google Sheets to identify the latest water meter reading entry for the resident.

**Nodes Involved:**  
- Get row(s) in sheet (Google Sheets)  
- Find Latest Row (Code)  

**Node Details:**

- **Get row(s) in sheet**  
  - Type: Google Sheets node  
  - Role: Reads all rows from the configured sheet ("Tagihan Air", Sheet1) to get historical data  
  - Config: Automatic range detection, document and sheet IDs set to the water bill spreadsheet  
  - Input: Output from "Image Explainer" (to trigger after AI data extraction)  
  - Output: Array of rows with previous billing data  
  - Edge cases: API auth errors, empty sheet, large data causing timeouts

- **Find Latest Row**  
  - Type: Code node (JavaScript)  
  - Role: Selects the row with the highest `row_number` to find the most recent record  
  - Config: Uses JS reduce to find max `row_number`  
  - Input: Google Sheets rows  
  - Output: Single JSON object with latest row data  
  - Edge cases: Empty input array, missing `row_number` fields

---

#### 1.4 Bill Calculation

**Overview:**  
Calculates the water volume difference, billing amounts, and formats the date for the current reading.

**Nodes Involved:**  
- Calculate Bill (Code)  

**Node Details:**

- **Calculate Bill**  
  - Type: Code node (JavaScript)  
  - Role: Computes volume difference, multiplies by unit price, adds fixed charge, formats date string  
  - Config:  
    - Reads previous volume and current volume from AI output  
    - Extracts price per m³ and fixed fees from prior data  
    - Pads current volume reading to 5 digits with leading zeros  
    - Calculates billing totals  
    - Formats current date to Indonesian day and month names  
  - Input: Output from "Find Latest Row" and "Image Explainer"  
  - Output: JSON with calculated fields, user info, timestamps  
  - Edge cases: Missing or non-numeric input values, time zone issues

---

#### 1.5 Data Preparation and Storage

**Overview:**  
Prepares the calculated data into the exact schema for Google Sheets and appends a new row.

**Nodes Involved:**  
- Prepare Data for Sheet (Set)  
- Append row in sheet (Google Sheets)  

**Node Details:**

- **Prepare Data for Sheet**  
  - Type: Set node  
  - Role: Defines and maps all relevant billing fields (name, volumes, price, charges, dates, user and message IDs) for Google Sheets insertion  
  - Config: Assigns fields explicitly with expressions referencing prior nodes  
  - Input: Output from "Calculate Bill"  
  - Output: Structured JSON matching sheet columns  
  - Edge cases: Missing fields, type conversion issues

- **Append row in sheet**  
  - Type: Google Sheets node  
  - Role: Appends the prepared data as a new row to the billing spreadsheet  
  - Config: Targets same sheet and document as read node; uses defined column schema; appends mode enabled  
  - Input: Output from "Prepare Data for Sheet"  
  - Output: Confirmation of append operation  
  - Edge cases: Write permission denied, network errors, data validation failures

---

#### 1.6 Billing Message Formatting and Notification

**Overview:**  
Formats a detailed billing message showing current and previous volumes and totals, then sends it back to the user via Telegram.

**Nodes Involved:**  
- Find Latest Row (re-used)  
- Format Bill Message (Code)  
- Send Bill to Telegram (Telegram)  

**Node Details:**

- **Format Bill Message**  
  - Type: Code node (JavaScript)  
  - Role: Creates a formatted JSON object with previous/current billing details, formatted rupiah currency, and volume differences for messaging  
  - Config: Uses helper functions for currency formatting and zero trimming  
  - Input: Current data, previous billing info, user data  
  - Output: JSON suitable for Telegram message template  
  - Edge cases: Formatting errors, missing previous data

- **Send Bill to Telegram**  
  - Type: Telegram node (Send message)  
  - Role: Sends the formatted bill message to the user's Telegram chat  
  - Config: Uses HTML parse mode, references chat ID and message ID for reply threading, message text uses template literals with node JSON data  
  - Input: Output from "Format Bill Message"  
  - Output: Telegram message sent confirmation  
  - Edge cases: Telegram API rate limits, invalid chat ID, message formatting errors

---

### 3. Summary Table

| Node Name              | Node Type                            | Functional Role                        | Input Node(s)           | Output Node(s)           | Sticky Note                                                                                              |
|------------------------|------------------------------------|-------------------------------------|------------------------|-------------------------|--------------------------------------------------------------------------------------------------------|
| Telegram Trigger       | Telegram Trigger                   | Receive Telegram messages            | None                   | Redirect Message Types   |                                                                                                        |
| Redirect Message Types | Switch                            | Route based on message type          | Telegram Trigger       | Get a file              |                                                                                                        |
| Get a file             | Telegram (Get File)                | Download photo from Telegram         | Redirect Message Types  | Image Explainer         |                                                                                                        |
| Google Gemini Chat Model| Langchain Google Gemini Chat Model| AI processing of image               | (Implicit in Image Explainer) | Structured Output Parser |                                                                                                        |
| Structured Output Parser | Langchain Output Parser Structured | Parse AI response to JSON schema     | Google Gemini Chat Model| Image Explainer         |                                                                                                        |
| Image Explainer        | Langchain Chain LLM                | Extract meter reading from image    | Get a file             | Get row(s) in sheet     |                                                                                                        |
| Get row(s) in sheet    | Google Sheets                     | Retrieve previous billing data       | Image Explainer        | Find Latest Row         |                                                                                                        |
| Find Latest Row        | Code                             | Select latest billing record         | Get row(s) in sheet    | Calculate Bill          | Format Bill Message                                                                                     |
| Calculate Bill         | Code                             | Compute bill amounts and format date | Find Latest Row        | Prepare Data for Sheet  |                                                                                                        |
| Prepare Data for Sheet | Set                              | Map data fields for sheet insertion  | Calculate Bill         | Append row in sheet     |                                                                                                        |
| Append row in sheet    | Google Sheets                    | Append billing data to spreadsheet   | Prepare Data for Sheet | Format Bill Message     |                                                                                                        |
| Format Bill Message    | Code                             | Format message for Telegram billing  | Append row in sheet, Find Latest Row | Send Bill to Telegram |                                                                                                        |
| Send Bill to Telegram  | Telegram (Send Message)           | Send bill notification to user       | Format Bill Message    | None                    |                                                                                                        |
| Sticky Note            | Sticky Note                      | Setup instructions and Google Sheet schema | None                   | None                    | 1. Create Google Sheet with specified columns; 2. Create Telegram Bot via BotFather; 3. Create Gemini API key |
| Sticky Note1           | Sticky Note                      | Explanation of water bill calculation logic | None                   | None                    | Explains volume difference and calculation example                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheet**  
   - Name the spreadsheet (e.g., "Tagihan Air").  
   - Create columns: Nama, Volume Sebelumnya, Volume Saat Ini, Harga/m³, Jumlah Bayar, Beban, Total Bayar, Tanggal Input.

2. **Set Up Telegram Bot**  
   - Use @BotFather in Telegram to create a new bot.  
   - Obtain the API token.  
   - In n8n, create Telegram credentials with this token.

3. **Configure Google Gemini API Credentials**  
   - Generate API key for Google Gemini from Google AI Studio.  
   - Add credentials in n8n for Gemini API access.

4. **Add Telegram Trigger Node**  
   - Type: Telegram Trigger  
   - Trigger on "message" updates only.

5. **Add Switch Node (Redirect Message Types)**  
   - Check if incoming message contains a photo (`message.photo[0]` exists).  
   - Output "Image Message" if photo exists, else "Text Message".

6. **Add Telegram Node "Get a file"**  
   - Configure to download the largest photo (`message.photo[3].file_id`).  
   - Connect output of Switch "Image Message" to this node.

7. **Add Langchain Chain LLM Node "Image Explainer"**  
   - Input: Binary image from "Get a file".  
   - Prompt: Extract number inside the box in m³ and caption text.  
   - Use Google Gemini Chat Model and Structured Output Parser for AI interaction.  
   - Configure to parse output into JSON with keys `"m3"` and `"caption"`.

8. **Add Google Sheets Node "Get row(s) in sheet"**  
   - Read all rows from the water bill sheet (document ID and sheet name).  
   - Connect output from "Image Explainer".

9. **Add Code Node "Find Latest Row"**  
   - JavaScript code to find the row with the maximum `row_number` (latest record).  
   - Input: Google Sheets rows.

10. **Add Code Node "Calculate Bill"**  
    - Inputs: Output from "Find Latest Row".  
    - Logic:  
      - Parse previous and current volume readings.  
      - Calculate volume difference.  
      - Multiply by price per m³, add fixed charge.  
      - Format current date as "Day, Date Month Year" in Indonesian.  
      - Add user info from Telegram message.

11. **Add Set Node "Prepare Data for Sheet"**  
    - Map fields: Nama, Volume Sebelumnya, Volume Saat Ini, Harga/m³, Jumlah Bayar, Beban, Total Bayar, Tanggal Input, user, chat_id, mess_id.  
    - Use expressions to assign values from previous nodes.

12. **Add Google Sheets Node "Append row in sheet"**  
    - Append mode enabled.  
    - Same sheet and document as reading node.  
    - Input: "Prepare Data for Sheet".

13. **Add Code Node "Format Bill Message"**  
    - Inputs: "Append row in sheet" and "Find Latest Row".  
    - Format message with previous and current billing details, volumes, and totals.  
    - Format currency with thousands separator.  
    - Prepare JSON for Telegram messaging.

14. **Add Telegram Node "Send Bill to Telegram"**  
    - Send message with HTML formatting.  
    - Use chat_id and reply_to_message_id from prepared data.  
    - Connect output from "Format Bill Message".

15. **Connect all nodes in described order** ensuring data flows as per described input/output dependencies.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                       | Context or Link                                   |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| Create Google Sheet with columns: Nama, Volume Sebelumnya, Volume Saat Ini, Harga/m³, Jumlah Bayar, Beban, Total Bayar, Tanggal Input.                                                                                                                                                                                                                          | Sticky Note content in workflow                   |
| Create Telegram Bot via @BotFather, obtain token and configure credentials in n8n.                                                                                                                                                                                                                                                                                | Sticky Note content in workflow                   |
| Generate Google Gemini API key in Google AI Studio and configure credentials in n8n.                                                                                                                                                                                                                                                                              | Sticky Note content in workflow                   |
| Water bill bot logic: Residents send water meter photo plus name caption, bot calculates volume difference and billing with fixed charges, returns bill summary and payment instructions.                                                                                                                                                                        | Sticky Note1 content in workflow                  |
| Payment instructions include QRIS payment link: https://miftahrahmat.com                                                                                                                                                                                                                                                                                         | Message template in "Send Bill to Telegram" node |

---

**Disclaimer:**  
The text above is extracted exclusively from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to current content policies and contains no illegal, offensive, or protected elements. All data processed is legal and public.