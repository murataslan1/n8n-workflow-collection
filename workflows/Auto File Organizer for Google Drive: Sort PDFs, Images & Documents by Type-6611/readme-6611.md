Auto File Organizer for Google Drive: Sort PDFs, Images & Documents by Type

https://n8nworkflows.xyz/workflows/auto-file-organizer-for-google-drive--sort-pdfs--images---documents-by-type-6611


# Auto File Organizer for Google Drive: Sort PDFs, Images & Documents by Type

### 1. Workflow Overview

This workflow automates the organization of files uploaded to a specific Google Drive folder by sorting them into dedicated subfolders based on their file type. It is designed to streamline file management by automatically detecting and relocating images, PDFs, and document files (including JSON files) into corresponding folders.

The workflow logic is divided into the following functional blocks:

- **1.1 Input Reception and File Enumeration**: Triggered manually or on demand, this block searches a specified Google Drive folder for all files to be processed.

- **1.2 Iterative Processing**: The workflow processes each file individually in a loop to allow type detection and proper routing.

- **1.3 File Metadata Retrieval**: Downloads each file’s metadata and binary content to access MIME type information.

- **1.4 File Type Detection and Sorting**: A series of conditional nodes check the file MIME type to determine if the file is a document (specifically JSON), a PDF, or an image (JPEG in this config), routing each file accordingly.

- **1.5 File Relocation**: Moves files to their respective Google Drive folders (Images, PDFs, Documents) based on detected type, maintaining file properties and permissions.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception and File Enumeration

- **Overview**: Initiates the workflow manually and queries a specific Google Drive folder to retrieve all files for processing.

- **Nodes Involved**:  
  - When clicking ‘Execute workflow’  
  - Search files and folders  
  - Loop Over Items  

- **Node Details**:  

  - **When clicking ‘Execute workflow’**  
    - *Type*: Manual Trigger  
    - *Role*: Starts the workflow on demand by user action.  
    - *Connections*: Outputs to "Search files and folders".  
    - *Failure Modes*: None typical; manual initiation.  

  - **Search files and folders**  
    - *Type*: Google Drive - File/Folder Search  
    - *Role*: Queries Google Drive for all files within a specific folder ID ("1CcHp9tPoC-f7-umMjLdUU-Y7GedKLQkx", labeled "Indore").  
    - *Configuration*: Returns all files found without pagination limit.  
    - *Inputs*: Receives manual trigger.  
    - *Outputs*: Sends list of files to "Loop Over Items".  
    - *Failure Modes*: API rate limits, invalid folder ID, auth errors.  

  - **Loop Over Items**  
    - *Type*: SplitInBatches  
    - *Role*: Iterates over each file item individually to allow sequential processing.  
    - *Configuration*: Default batch size (1 file per iteration).  
    - *Inputs*: Receives array of files.  
    - *Outputs*: On main output, sends single files for processing; on second output, triggers next iteration.  
    - *Failure Modes*: Empty input array leads to no processing; potential for infinite loop if not properly connected.  

#### 2.2 File Metadata Retrieval

- **Overview**: For each file, downloads associated binary data and metadata to enable MIME type inspection.

- **Nodes Involved**:  
  - Download file  

- **Node Details**:  

  - **Download file**  
    - *Type*: Google Drive - Download File  
    - *Role*: Retrieves the file content and metadata (including MIME type) necessary for type detection.  
    - *Configuration*: Uses file ID from current item; downloads the full binary data.  
    - *Inputs*: Receives single file from batch loop.  
    - *Outputs*: Passes file data to "If Document" conditional node.  
    - *Failure Modes*: File not found, access denied, network issues.  

#### 2.3 File Type Detection and Sorting

- **Overview**: Determines the type of file based on MIME type and routes it to the appropriate folder movement node.

- **Nodes Involved**:  
  - If Document  
  - If PDF  
  - If Image  

- **Node Details**:  

  - **If Document**  
    - *Type*: Conditional (If)  
    - *Role*: Checks if the file MIME type equals "application/json" (specifically detecting JSON documents).  
    - *Configuration*: Case-sensitive strict equality check on MIME type.  
    - *Inputs*: Receives file data from "Download file".  
    - *Outputs*:  
      - True: Routes to "Move to Documents"  
      - False: Routes to "If PDF"  
    - *Failure Modes*: Expression evaluation errors if MIME type missing; false negatives for non-JSON documents.  
    - *Note*: Despite the name, it only detects JSON files, not all documents.  

  - **If PDF**  
    - *Type*: Conditional (If)  
    - *Role*: Checks if MIME type exactly equals "application/pdf" to detect PDF files.  
    - *Configuration*: Case-sensitive strict equality.  
    - *Inputs*: Receives from "If Document" false path.  
    - *Outputs*:  
      - True: Routes to "Move to PDFs"  
      - False: Routes to "If Image"  
    - *Failure Modes*: Same as above; false negatives if MIME types vary.  

  - **If Image**  
    - *Type*: Conditional (If)  
    - *Role*: Checks if MIME type equals "image/jpeg" (with note that broader image types are intended but currently only JPEG is matched).  
    - *Configuration*: Case-insensitive equality check for "image/jpeg".  
    - *Inputs*: Receives from "If PDF" false path.  
    - *Outputs*:  
      - True: Routes to "Move to Images"  
      - False: File remains unprocessed.  
    - *Failure Modes*: Limited MIME type detection; other image formats ignored.  

#### 2.4 File Relocation

- **Overview**: Moves files into their designated Google Drive folders based on type detection.

- **Nodes Involved**:  
  - Move to Documents  
  - Move to PDFs  
  - Move to Images  

- **Node Details**:  

  - **Move to Documents**  
    - *Type*: Google Drive - Move File  
    - *Role*: Moves JSON document files to Documents folder.  
    - *Configuration*: Moves file by ID to folder ID "1KUO_jw0WCQR1lDwlkvTk1XP_0PoLb3RR" (replaceable with user’s actual folder ID).  
    - *Inputs*: Receives from "If Document" true path.  
    - *Outputs*: Returns to "Loop Over Items" to process next file.  
    - *Failure Modes*: Permission or quota errors, invalid folder ID.  

  - **Move to PDFs**  
    - *Type*: Google Drive - Move File  
    - *Role*: Moves PDF files to PDFs folder.  
    - *Configuration*: Moves file by ID to folder ID "1dHG2GI5WF3bg-Bw9ydD5fC_P5GqvdBFG".  
    - *Inputs*: Receives from "If PDF" true path.  
    - *Outputs*: Returns to "Loop Over Items".  
    - *Failure Modes*: Same as above.  

  - **Move to Images**  
    - *Type*: Google Drive - Move File  
    - *Role*: Moves image files to Images folder.  
    - *Configuration*: Moves file by ID to folder ID "1_ecL9heszdG2vACtpfHsVEe4OAs89DzM".  
    - *Inputs*: Receives from "If Image" true path.  
    - *Outputs*: Returns to "Loop Over Items".  
    - *Failure Modes*: Same as above.  

---

### 3. Summary Table

| Node Name              | Node Type                 | Functional Role                            | Input Node(s)                | Output Node(s)               | Sticky Note                                                                                      |
|------------------------|---------------------------|--------------------------------------------|------------------------------|------------------------------|------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger           | Start workflow manually                    |                              | Search files and folders      |                                                                                                |
| Search files and folders| Google Drive - Search     | Retrieves all files in given folder        | When clicking ‘Execute workflow’ | Loop Over Items              | Search files and folders (Google Drive): Purpose: Finds all files in a specific Google Drive folder. |
| Loop Over Items         | SplitInBatches            | Processes files one by one                  | Search files and folders       | Download file (main), Loop Over Items (second) | Loop Over Items (Split in Batches): Purpose: Processes files one by one.                       |
| Download file           | Google Drive - Download   | Downloads file metadata and binary          | Loop Over Items                | If Document                   | Download file (Google Drive): Purpose: Downloads file metadata and binary data.                |
| If Document             | Conditional (If)          | Detects JSON document files                  | Download file                 | Move to Documents (true), If PDF (false) | If Document (Conditional Node): Purpose: Detects JSON document files.                         |
| Move to Documents       | Google Drive - Move File  | Moves JSON files to Documents folder        | If Document                  | Loop Over Items               | Move to Documents (Google Drive): Purpose: Relocates JSON files to Documents folder.           |
| If PDF                  | Conditional (If)          | Detects PDF files                            | If Document (false)           | Move to PDFs (true), If Image (false) | If PDF (Conditional Node): Purpose: Detects PDF files.                                        |
| Move to PDFs            | Google Drive - Move File  | Moves PDF files to PDFs folder               | If PDF (true)                 | Loop Over Items               | Move to PDFs (Google Drive): Purpose: Relocates PDF files to PDFs folder.                      |
| If Image                | Conditional (If)          | Detects JPEG image files                      | If PDF (false)                | Move to Images (true)         | If Image (Conditional Node): Purpose: Detects image files (JPEG).                             |
| Move to Images          | Google Drive - Move File  | Moves image files to Images folder           | If Image (true)               | Loop Over Items               | Move to Images (Google Drive): Purpose: Relocates image files to Images folder.                |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add a **Manual Trigger** node named "When clicking ‘Execute workflow’".  
   - No special configuration needed.  

2. **Add Google Drive Search Node**  
   - Add a **Google Drive** node named "Search files and folders".  
   - Set *Resource* to **File/Folder**, *Operation* to **Search**.  
   - Filter by Folder ID: set to the target source folder where files are uploaded (example: "1CcHp9tPoC-f7-umMjLdUU-Y7GedKLQkx").  
   - Set **Return All** to true to retrieve all files.  
   - Connect "When clicking ‘Execute workflow’" node output to this node’s input.  
   - Configure Google Drive OAuth2 credentials.  

3. **Add SplitInBatches Node**  
   - Add a **SplitInBatches** node named "Loop Over Items".  
   - Default batch size is 1 (process one file at a time).  
   - Connect output of "Search files and folders" to this node.  

4. **Add Google Drive Download Node**  
   - Add a **Google Drive** node named "Download file".  
   - Set *Operation* to **Download**.  
   - Set *File ID* to expression: `{{$json["id"]}}` to download current file in loop.  
   - Connect main output of "Loop Over Items" to this node.  

5. **Add Conditional Node for Document Detection**  
   - Add an **If** node named "If Document".  
   - Configure condition:  
     - Check if `{{$binary.data.mimeType}}` equals `"application/json"` (case sensitive).  
   - Connect output of "Download file" to this node.  

6. **Add Google Drive Move Node for Documents**  
   - Add a **Google Drive** node named "Move to Documents".  
   - Set *Operation* to **Move**.  
   - Set *File ID* to `{{$json["id"]}}`.  
   - Set *Folder ID* to your Documents folder ID (e.g., "1KUO_jw0WCQR1lDwlkvTk1XP_0PoLb3RR").  
   - Connect **True** output of "If Document" node to this node.  
   - Connect output of this node back to the "Loop Over Items" node to continue processing.  

7. **Add Conditional Node for PDF Detection**  
   - Add an **If** node named "If PDF".  
   - Configure condition:  
     - Check if `{{$binary.data.mimeType}}` equals `"application/pdf"` (case sensitive).  
   - Connect **False** output of "If Document" to this node.  

8. **Add Google Drive Move Node for PDFs**  
   - Add a **Google Drive** node named "Move to PDFs".  
   - Set *Operation* to **Move**.  
   - Set *File ID* to `{{$json["id"]}}`.  
   - Set *Folder ID* to your PDFs folder ID (e.g., "1dHG2GI5WF3bg-Bw9ydD5fC_P5GqvdBFG").  
   - Connect **True** output of "If PDF" to this node.  
   - Connect output of this node back to "Loop Over Items".  

9. **Add Conditional Node for Image Detection**  
   - Add an **If** node named "If Image".  
   - Configure condition:  
     - Check if `{{$binary.data.mimeType}}` equals `"image/jpeg"` (case insensitive).  
   - Connect **False** output of "If PDF" to this node.  

10. **Add Google Drive Move Node for Images**  
    - Add a **Google Drive** node named "Move to Images".  
    - Set *Operation* to **Move**.  
    - Set *File ID* to `{{$json["id"]}}`.  
    - Set *Folder ID* to your Images folder ID (e.g., "1_ecL9heszdG2vACtpfHsVEe4OAs89DzM").  
    - Connect **True** output of "If Image" to this node.  
    - Connect output of this node back to "Loop Over Items".  

11. **Connect Loop Continuation**  
    - Connect **False** output of "If Image" node to the second output (continue loop) of "Loop Over Items" to skip unprocessed files and continue iterating.  

12. **Credentials Setup**  
    - Ensure Google Drive OAuth2 credentials are configured and selected on all Google Drive nodes.  
    - Replace folder IDs with your actual folder IDs for source, Documents, PDFs, and Images folders.  

13. **Test Execution**  
    - Trigger the workflow manually and verify files are moved according to their MIME type.  

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                        |
|----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| The workflow is currently configured to detect only JSON files for documents and JPEG for images; expand MIME checks for broader coverage. | Recommended extension for broader document and image formats handling. |
| Folder IDs must be replaced with actual Google Drive folder IDs relevant to your environment to ensure proper file placement. | Google Drive folder URL format: `https://drive.google.com/drive/folders/{folderId}` |
| Each move operation preserves file metadata and permissions, ensuring no data loss during relocation.                | Google Drive API behavior                                             |
| Looping via SplitInBatches is crucial to process files sequentially and avoid API rate limits or execution overload. | n8n SplitInBatches node documentation                                |