Automate Invoice Processing with AI Data Extraction, Google Drive & Sheets

https://n8nworkflows.xyz/workflows/automate-invoice-processing-with-ai-data-extraction--google-drive---sheets-8476


# Automate Invoice Processing with AI Data Extraction, Google Drive & Sheets

### 1. Workflow Overview

**Purpose:**  
This n8n workflow automates the entire process of handling incoming PDF invoices stored in a designated Google Drive folder. It leverages AI-powered data extraction to parse critical invoice details, organizes invoices into a structured yearly/monthly folder hierarchy on Google Drive, renames files consistently, and logs all extracted data in a Google Sheets spreadsheet for centralized documentation.

**Target Use Cases:**  
- Businesses managing numerous PDF invoices requiring automated data extraction  
- Accounting teams seeking automated filing and documentation of invoices  
- Workflows requiring integration of Google Drive, Google Sheets, and AI-based text extraction  

**Logical Blocks:**  
- **1.1 Monitoring & Input Reception:** Detect new invoice PDFs in a Google Drive folder and queue them for processing  
- **1.2 Text Extraction from PDF:** Download PDF files and convert their contents into extractable text  
- **1.3 AI-Based Information Extraction:** Use AI (LangChain + OpenAI GPT-4) to extract structured invoice data from raw text  
- **1.4 Folder Management:** Check for and create year and month folders in Google Drive as needed  
- **1.5 File Handling:** Move the invoice to the correct folder and rename it based on extracted data  
- **1.6 Documentation:** Append extracted invoice data into a Google Sheets spreadsheet for record-keeping  
- **1.7 Initialization for Folder Creation:** (Separate sub-flow) Prepares lists of years and months and iterates to ensure folders exist  

---

### 2. Block-by-Block Analysis

#### 2.1 Monitoring & Input Reception

**Overview:**  
This block triggers the workflow when a new file is created in a specified Google Drive folder. It then lists the files in the folder and prepares them for batch processing.

**Nodes Involved:**  
- Google Drive Trigger  
- Search files and folders  
- Loop (splitInBatches)  

**Node Details:**

- **Google Drive Trigger**  
  - *Type:* Trigger node for Google Drive  
  - *Configuration:* Watches a specific folder (`Rechnungsablage`) for new files created, polling every minute  
  - *Input:* Event-based trigger (no input)  
  - *Output:* New file metadata  
  - *Potential Failures:* API limits, folder permission errors  

- **Search files and folders**  
  - *Type:* Google Drive node, file/folder search  
  - *Configuration:* Filters files inside the same folder as trigger  
  - *Input:* Trigger output  
  - *Output:* List of file/folder metadata for processing  
  - *Edge Cases:* Empty folder, API errors  

- **Loop (splitInBatches)**  
  - *Type:* SplitInBatches node to process files individually or in small batches  
  - *Configuration:* Default batch size (1) to handle each file sequentially  
  - *Input:* List of files from previous node  
  - *Output:* Single file per iteration  
  - *Notes:* Ensures workflow scales with multiple invoices  

---

#### 2.2 Text Extraction from PDF

**Overview:**  
Downloads the PDF file from Google Drive and extracts its text content for AI processing.

**Nodes Involved:**  
- GetFile  
- ExtractFromPDF  

**Node Details:**

- **GetFile**  
  - *Type:* Google Drive node (download operation)  
  - *Configuration:* Uses file ID from batch item to download the PDF file  
  - *Input:* Batch item with file metadata  
  - *Output:* File binary data for extraction  
  - *Edge Cases:* File not found, permission denied, download failure  

- **ExtractFromPDF**  
  - *Type:* Extract from File node (PDF operation)  
  - *Configuration:* Extracts text content from the downloaded PDF file  
  - *Input:* Binary PDF from GetFile  
  - *Output:* JSON with extracted text under `text` field  
  - *Edge Cases:* Corrupted PDF, scanned PDFs without OCR, extraction failure  

---

#### 2.3 AI-Based Information Extraction

**Overview:**  
Leverages AI to parse and extract structured invoice details from the raw text extracted from PDFs.

**Nodes Involved:**  
- Information Extractor  

**Node Details:**

- **Information Extractor**  
  - *Type:* LangChain Information Extractor node integrated with OpenAI GPT-4  
  - *Configuration:*  
    - System prompt instructs AI to extract specific invoice fields with German formatting conventions (comma as decimal separator, date format YYYY-MM-DD)  
    - Extracts attributes: Company, Customer, Invoice Number, Invoice Date, Net Amount, VAT, Month (written), Year, Article count, Customer number  
  - *Input:* Text extracted from PDF  
  - *Output:* JSON object with extracted attributes under `output` key  
  - *Key Expressions:* Uses AI to interpret text; fallback behavior skips missing attributes  
  - *Edge Cases:* AI misunderstanding, incomplete extraction, incorrect formats  
  - *Sub-workflow:* Uses OpenAI Chat Model node internally (configured but not explicitly chained in connections)  

---

#### 2.4 Folder Management (Year and Month Folders)

**Overview:**  
Checks for the existence of year and month folders in the designated Google Drive folder structure, creating them if they do not exist.

**Nodes Involved:**  
- GetYearFolder  
- GetMonthFolder  
- Jahresordner schon vorhanden? (Year folder exists?)  
- Ordner noch nicht vorhanden (Folder not present)  
- Jahresordner erstellen (Create year folder)  
- Monate als Liste (Months as list)  
- Split Out / Split Out1  
- Loop Over Items  
- Monatsordner einfügen (Add month folder)  

**Node Details:**

- **GetYearFolder**  
  - *Type:* Google Drive node (search folder)  
  - *Configuration:* Queries for a folder named by the extracted year under main “Buchhaltung / Rechnungen” folder  
  - *Input:* Extracted year from AI output  
  - *Output:* Folder metadata if found  
  - *Edge Cases:* Folder not found, API errors  

- **GetMonthFolder**  
  - *Type:* Google Drive node (search folder)  
  - *Configuration:* Queries for a folder named by the extracted month under the year folder  
  - *Input:* Folder ID from GetYearFolder and month string from AI output  
  - *Output:* Month folder metadata if found  
  - *Edge Cases:* Folder missing, API errors  

- **Jahresordner schon vorhanden?**  
  - *Type:* Google Drive node with query string to check if year folder exists  
  - *Input:* Year from batch iteration  
  - *Output:* List of folders found  
  - *Edge Cases:* Empty results indicate folder absence  

- **Ordner noch nicht vorhanden** (If node)  
  - *Type:* If node  
  - *Configuration:* Checks if folder list is empty (i.e., folder does not exist)  
  - *Output:* Branches to create folders or skip  

- **Jahresordner erstellen**  
  - *Type:* Google Drive node (folder creation)  
  - *Configuration:* Creates year folder inside main folder if missing  
  - *Input:* Year string  
  - *Output:* Folder metadata of created folder  

- **Monate als Liste**  
  - *Type:* Set node  
  - *Configuration:* Creates an array of month names (German) for folder creation  
  - *Output:* Array of months  

- **Split Out / Split Out1**  
  - *Type:* SplitOut nodes  
  - *Configuration:* Splits arrays of years and months for iterative processing  

- **Loop Over Items**  
  - *Type:* SplitInBatches  
  - *Configuration:* Processes each year or month individually to create folders  

- **Monatsordner einfügen**  
  - *Type:* Google Drive node (folder creation)  
  - *Configuration:* Creates month folders inside corresponding year folder  
  - *Input:* Month name and parent year folder ID  

**Notes:**  
- This block runs in a sub-flow style, iterating over predefined years and months to ensure folder structure is in place and avoids duplication by checking existence first.  
- Sticky Notes describe this as a safety measure to prevent duplicate folder creation.

---

#### 2.5 File Handling (Move & Rename)

**Overview:**  
Moves the processed invoice PDF into the correct year/month folder and renames the file according to a naming convention based on extracted data.

**Nodes Involved:**  
- MoveFile  
- UpdateFileName  

**Node Details:**

- **MoveFile**  
  - *Type:* Google Drive node (move file operation)  
  - *Configuration:* Moves the file (using original file ID) to the month folder resolved earlier  
  - *Input:* File ID from GetFile node, destination folder ID from GetMonthFolder  
  - *Output:* Updated file metadata with new location  
  - *Edge Cases:* Permission errors, file locked, folder missing  

- **UpdateFileName**  
  - *Type:* Google Drive node (update file metadata)  
  - *Configuration:* Renames file using template:  
    `"{{ Customer }}     \n{{ Month }} {{ Year }}"`  
  - *Input:* File ID from MoveFile, extracted attributes Customer, Month, Year  
  - *Output:* Updated file metadata with new name  
  - *Edge Cases:* Naming conflicts, invalid characters, update failure  

---

#### 2.6 Documentation

**Overview:**  
Appends a new row to a Google Sheets spreadsheet with all extracted invoice data for centralized record keeping.

**Nodes Involved:**  
- AddToOverview  

**Node Details:**

- **AddToOverview**  
  - *Type:* Google Sheets node (append operation)  
  - *Configuration:* Maps extracted invoice attributes to predefined columns in a Google Sheets spreadsheet, including:  
    - Year, VAT, Customer, Month, Net Amount, Customer Number, Invoice Date, Invoice Number, Company Location  
  - *Input:* Extracted JSON output from Information Extractor  
  - *Output:* Confirmation of row append  
  - *Edge Cases:* Sheet not found, permission denied, schema mismatch  

---

#### 2.7 Initialization for Folder Creation

**Overview:**  
Sets up the list of years and months to be created as folders and triggers the folder creation flow.

**Nodes Involved:**  
- Jahre auswählen (Set Years)  
- Monate als Liste (Set Months)  
- Split Out (years)  
- Split Out1 (months)  
- Loop Over Items  

**Node Details:**

- **Jahre auswählen**  
  - *Type:* Set node  
  - *Configuration:* Hardcoded array of years `[2024, 2025, 2026]`  
  - *Output:* Array for folder creation iteration  

- **Monate als Liste**  
  - *Already described above*  

- **Split Out / Split Out1** and **Loop Over Items**  
  - Used to sequentially process each year and each month for folder creation as described in 2.4  

---

### 3. Summary Table

| Node Name               | Node Type                      | Functional Role                    | Input Node(s)                  | Output Node(s)                | Sticky Note                                                                                         |
|-------------------------|--------------------------------|----------------------------------|-------------------------------|------------------------------|--------------------------------------------------------------------------------------------------|
| Google Drive Trigger     | Google Drive Trigger           | Trigger on new file in folder    | -                             | Search files and folders      |                                                                                                |
| Search files and folders | Google Drive                  | List files in input folder       | Google Drive Trigger           | Loop                         |                                                                                                |
| Loop                    | SplitInBatches                | Process files in batches         | Search files and folders       | GetFile                      |                                                                                                |
| GetFile                 | Google Drive                  | Download invoice PDF file        | Loop                          | ExtractFromPDF                |                                                                                                |
| ExtractFromPDF           | ExtractFromFile (PDF)          | Extract text from PDF             | GetFile                       | Information Extractor         |                                                                                                |
| Information Extractor    | LangChain AI Extractor        | Extract structured invoice data  | ExtractFromPDF                | GetYearFolder                |                                                                                                |
| GetYearFolder            | Google Drive                  | Search year folder               | Information Extractor          | GetMonthFolder               |                                                                                                |
| GetMonthFolder           | Google Drive                  | Search month folder              | GetYearFolder                 | MoveFile                     |                                                                                                |
| MoveFile                 | Google Drive                  | Move invoice to correct folder  | GetMonthFolder                | UpdateFileName               |                                                                                                |
| UpdateFileName           | Google Drive                  | Rename invoice file              | MoveFile                     | AddToOverview                |                                                                                                |
| AddToOverview            | Google Sheets                 | Append invoice data to sheet    | UpdateFileName               | Loop                         |                                                                                                |
| Jahre auswählen          | Set                          | Define years list                | -                             | Split Out                    |                                                                                                |
| Split Out                | SplitOut                     | Split years array for iteration | Jahre auswählen               | Loop Over Items              |                                                                                                |
| Loop Over Items          | SplitInBatches               | Iterate over years/months        | Split Out / Monatsordner einfügen | Jahresordner schon vorhanden? |                                                                                                |
| Jahresordner schon vorhanden? | Google Drive                  | Check if year folder exists      | Loop Over Items               | Ordner noch nicht vorhanden  |                                                                                                |
| Ordner noch nicht vorhanden | If                           | Branch based on folder existence | Jahresordner schon vorhanden? | Jahresordner erstellen / Loop Over Items |                                                                                                |
| Jahresordner erstellen   | Google Drive                  | Create year folder               | Ordner noch nicht vorhanden   | Monate als Liste             |                                                                                                |
| Monate als Liste         | Set                          | Define months list               | Jahresordner erstellen        | Split Out1                   |                                                                                                |
| Split Out1               | SplitOut                     | Split months array for iteration | Monate als Liste              | Monatsordner einfügen        |                                                                                                |
| Monatsordner einfügen    | Google Drive                  | Create month folder              | Split Out1                   | Loop Over Items              |                                                                                                |
| Sticky Note              | StickyNote                   | Workflow description & intro    | -                             | -                            | 🧾 Automated Invoice Processing - n8n Workflow (Detailed description included)                   |
| Sticky Note1             | StickyNote                   | Title: Create folders for invoices | -                             | -                            | # Ordner für Rechnungen erstellen                                                              |
| Sticky Note2             | StickyNote                   | Text extraction stage title     | -                             | -                            | ## Text aus PDF extrahieren                                                                      |
| Sticky Note3             | StickyNote                   | AI extraction stage title       | -                             | -                            | ## Informationsextrahierung mit KI                                                             |
| Sticky Note4             | StickyNote                   | Moving and renaming invoices    | -                             | -                            | ## Rechnung in entsprechenden Ordner verschieben und umbennenen                                |
| Sticky Note5             | StickyNote                   | Documentation title             | -                             | -                            | ## Dokumentieren                                                                               |
| Sticky Note6             | StickyNote                   | Incoming invoice processing     | -                             | -                            | # Eingehende Rechnungen verarbeiten                                                           |
| Sticky Note7             | StickyNote                   | Folder creation explanation     | -                             | -                            | ## Jahres / Monatsordner erstellen (Folder creation safety and logic explanation)              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Drive Trigger node:**  
   - Type: Google Drive Trigger  
   - Configure to watch the folder “Rechnungsablage” (folder ID: `1Zc6vLxnVqTX1oZbn5lj54bRntQaDOnqy`)  
   - Set event to "fileCreated"  
   - Poll every minute  

2. **Add Google Drive node "Search files and folders":**  
   - Operation: List files/folders inside folder `Rechnungsablage`  
   - Connect trigger output to this node  

3. **Add SplitInBatches node "Loop":**  
   - No special config (default batch size 1)  
   - Connect output of search node to this node  

4. **Add Google Drive node "GetFile":**  
   - Operation: Download file  
   - Use expression to get fileId from current batch item (`{{$json.id}}`)  
   - Connect Loop output to this node  

5. **Add ExtractFromFile node "ExtractFromPDF":**  
   - Operation: PDF text extraction  
   - Connect GetFile output to this node  

6. **Add LangChain Information Extractor node "Information Extractor":**  
   - Input: Use extracted text from previous node (`{{$json.text}}`)  
   - Configure system prompt to instruct AI to extract invoice data with German formatting (comma decimal separator, YYYY-MM-DD)  
   - Define attributes to extract: Company, Customer, Invoice Number, Invoice Date, Net Amount, VAT, Month (written), Year, Article count, Customer Number  
   - Connect ExtractFromPDF output to this node  

7. **Add Google Drive node "GetYearFolder":**  
   - Operation: Search folder  
   - Folder ID: Main accounting folder `"Buchhaltung / Rechnungen"` (folder ID: `15m2uc0MJyvzv-QHvzXYu4Yfp4C2SG-ou`)  
   - Query string: Use extracted `Year` attribute from AI output  
   - Connect Information Extractor output to this node  

8. **Add Google Drive node "GetMonthFolder":**  
   - Operation: Search folder  
   - Folder ID: Use ID from GetYearFolder output  
   - Query string: Use extracted `Month` attribute from AI output  
   - Connect GetYearFolder output to this node  

9. **Add Google Drive node "MoveFile":**  
   - Operation: Move file  
   - File ID: Use from GetFile output  
   - Destination folder ID: Use from GetMonthFolder output  
   - Connect GetMonthFolder output to this node  

10. **Add Google Drive node "UpdateFileName":**  
    - Operation: Update file metadata (rename)  
    - File ID: Use from MoveFile output  
    - New file name: Compose string from extracted Customer, Month, and Year (e.g. `{{Customer}} {{Month}} {{Year}}`)  
    - Connect MoveFile output to this node  

11. **Add Google Sheets node "AddToOverview":**  
    - Operation: Append row  
    - Document ID: Your Google Sheets invoice overview spreadsheet  
    - Sheet Name: First sheet (gid=0)  
    - Map columns to extracted attributes: Year, VAT, Customer, Month, Net Amount, Customer Number, Invoice Date, Invoice Number, Company Location  
    - Connect UpdateFileName output to this node  

12. **Add Set node "Jahre auswählen":**  
    - Define array of years to create folders for, e.g., `[2024, 2025, 2026]`  

13. **Add SplitOut node "Split Out":**  
    - Split field: `jahr` for iteration  

14. **Add SplitInBatches node "Loop Over Items":**  
    - To iterate over each year  

15. **Add Google Drive node "Jahresordner schon vorhanden?":**  
    - Search for year folder inside main accounting folder  
    - Query string: current year  

16. **Add If node "Ordner noch nicht vorhanden":**  
    - Condition: Check if search result is empty (folder absent)  

17. **Add Google Drive node "Jahresordner erstellen":**  
    - Create folder with current year name inside main accounting folder  

18. **Add Set node "Monate als Liste":**  
    - Define array of months in German (e.g., `["Januar", "Februar", ... "Dezember"]`)  

19. **Add SplitOut node "Split Out1":**  
    - Split field: `monate` for iteration  

20. **Add Google Drive node "Monatsordner einfügen":**  
    - Create month folder inside the newly created year folder  

21. **Connect nodes as per logic:**  
    - Jahresordner erstellen → Monate als Liste → Split Out1 → Monatsordner einfügen → Loop Over Items (to iterate months)  
    - Loop Over Items → Jahresordner schon vorhanden? → Ordner noch nicht vorhanden → Jahresordner erstellen  
    - Handle "folder exists" branch to skip creation  

22. **Connect main invoice processing flow to folder management:**  
    - Information Extractor → GetYearFolder → GetMonthFolder → MoveFile → UpdateFileName → AddToOverview → Loop  

23. **Credentials:**  
    - Google Drive (OAuth2) with full access to input and output folders  
    - Google Sheets (OAuth2) with write access to the spreadsheet  
    - OpenAI API credentials configured for LangChain Information Extractor and Chat Model  

24. **Add Sticky Notes:**  
    - Add notes describing workflow sections as per original for clarity  

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                                          |
|----------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Workflow automates invoice processing including AI extraction, file organization, and documentation in Sheets       | Overview sticky note within workflow                                                                                      |
| Folder structure must be established before running workflow (Main accounting folder with year/month subfolders)     | See Sticky Note1 and Sticky Note7                                                                                         |
| AI extraction uses German formatting conventions (comma decimal, date format YYYY-MM-DD)                             | Configuration in Information Extractor node                                                                               |
| Workflow requires Google Drive and Sheets API credentials with proper permissions                                    | Setup instructions in Sticky Note                                                                                         |
| OpenAI GPT-4 is used for reliable data extraction                                                                    | Node: OpenAI Chat Model (LangChain integration)                                                                           |
| Workflow includes error considerations: missing folders, incomplete PDFs, API limits                                 | Described in Sticky Note                                                                                                  |
| For further customization, add attributes in Information Extractor or modify filename templates                      | Refer to Sticky Note for customization tips                                                                               |
| Google Sheet columns must match mapped fields exactly                                                                | See AddToOverview node configuration                                                                                      |
| Testing approach: upload test PDFs to input folder and monitor workflow execution and outputs                         | Suggested in workflow description sticky note                                                                             |
| Official n8n documentation and Google API docs recommended for troubleshooting                                       | External resources not linked but recommended for users                                                                   |

---

**Disclaimer:** The provided text is derived exclusively from an automated workflow created with n8n, respecting all current content policies. It contains no illegal or protected data, only legal and public information.