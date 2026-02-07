Automate TikTok Video Transcription with RapidAPI and Google Sheets

https://n8nworkflows.xyz/workflows/automate-tiktok-video-transcription-with-rapidapi-and-google-sheets-5882


# Automate TikTok Video Transcription with RapidAPI and Google Sheets

### 1. Workflow Overview

This workflow automates the extraction of transcripts from TikTok videos using a RapidAPI TikTok Transcript Generator and updates a Google Sheet with cleaned and structured transcription data. It targets use cases such as content management, SEO enhancement, caption generation, and social media content repurposing by maintaining an up-to-date centralized record of TikTok video transcriptions.

The workflow is logically divided into the following blocks:

- **1.1 Manual Trigger & Input Retrieval:** Starts the workflow and reads existing TikTok video URLs and transcripts from Google Sheets.
- **1.2 Batch Processing & Filtering:** Processes rows in manageable batches and filters those requiring transcription.
- **1.3 Transcript Fetching via API:** Calls the TikTok transcript API for videos missing transcripts.
- **1.4 API Response Validation:** Checks for valid API responses, identifying unavailable transcripts.
- **1.5 Transcript Cleaning:** Cleans raw subtitle data by removing timestamps and headers for readability.
- **1.6 Google Sheets Update:** Updates the Google Sheet with cleaned transcripts or marks videos without available transcriptions.
- **1.7 Rate Limiting Pause:** Introduces a wait period between batches to respect API rate limits.

---

### 2. Block-by-Block Analysis

#### 1.1 Manual Trigger & Input Retrieval

- **Overview:**  
  Initiates the workflow manually and fetches the list of TikTok video URLs along with any existing transcripts from a Google Sheet.

- **Nodes Involved:**  
  - `When clicking ‘Execute workflow’` (Manual Trigger)  
  - `Google Sheets2` (Google Sheets Read)  

- **Node Details:**

  - **When clicking ‘Execute workflow’**  
    - Type: Manual Trigger  
    - Configuration: Default manual start with no parameters.  
    - Connections: Outputs to `Google Sheets2`.  
    - Edge Cases: None; purely manual start.

  - **Google Sheets2**  
    - Type: Google Sheets (Read)  
    - Configuration:  
      - Reads from "Sheet1" (gid=0) of the specified Google Sheet document.  
      - Authenticates via Service Account credentials.  
    - Key Expressions: None; reads entire rows.  
    - Input: Trigger from manual start.  
    - Output: Passes rows data to `Loop Over Items`.  
    - Edge Cases:  
      - Invalid or missing document ID causes read failure.  
      - Authentication errors with Google API.  
      - Empty sheet returns no data.

#### 1.2 Batch Processing & Filtering

- **Overview:**  
  Processes the fetched sheet rows in batches of 10 to avoid rate limits and filters rows that need transcription (non-empty Video URL and empty Transcript).

- **Nodes Involved:**  
  - `Loop Over Items` (Split In Batches)  
  - `If` (Conditional Check)  

- **Node Details:**

  - **Loop Over Items**  
    - Type: Split In Batches  
    - Configuration:  
      - Processes batches of 10 items by default (implicit).  
      - No reset between batches.  
    - Input: Rows from `Google Sheets2`.  
    - Output: Passes batches to `If` node or completes if no data.  
    - Edge Cases:  
      - Large datasets handled efficiently.  
      - Potential timing issues if batches are delayed.

  - **If**  
    - Type: Conditional Check  
    - Configuration:  
      - Condition:  
        - `Video Url` is not empty  
        - `Transcript` is empty  
      - Both conditions must be true to proceed.  
    - Input: Batch items from `Loop Over Items`.  
    - Output:  
      - True branch: to `HTTP Request` node for transcription fetch.  
      - False branch: loops back to `Loop Over Items` (skips processed rows).  
    - Edge Cases:  
      - If `Video Url` missing or malformed, row is skipped.  
      - If transcript exists, avoids redundant API calls.

#### 1.3 Transcript Fetching via API

- **Overview:**  
  Calls the RapidAPI TikTok Transcript Generator API to fetch raw subtitles for each video URL needing transcription.

- **Nodes Involved:**  
  - `HTTP Request`  

- **Node Details:**

  - **HTTP Request**  
    - Type: HTTP Request (POST)  
    - Configuration:  
      - URL: `https://tiktok-transcript-generator.p.rapidapi.com/tiktok/index.php`  
      - Request body contains the `url` parameter set dynamically from the current item’s `Video Url`.  
      - Headers include `x-rapidapi-host` and `x-rapidapi-key` for authentication.  
      - Sends body and headers as configured.  
      - On error: continue regular output to handle failures gracefully.  
    - Input: True branch from `If` node.  
    - Output: Passes API response to `If1` node.  
    - Edge Cases:  
      - API key invalid or missing causes auth failure.  
      - Network timeouts or slow responses.  
      - API returning errors or 404 if transcript unavailable.

#### 1.4 API Response Validation

- **Overview:**  
  Validates the API response to check whether the transcript was found or if a 404 error occurred.

- **Nodes Involved:**  
  - `If1` (Conditional Check)  

- **Node Details:**

  - **If1**  
    - Type: Conditional Check  
    - Configuration:  
      - Checks if `error.status` in response JSON is not equal to 404.  
    - Input: API response from `HTTP Request`.  
    - Output:  
      - True branch: passes to `Code` node for cleaning subtitles.  
      - False branch: passes to `Google Sheets1` node to log “No transcription available.”  
    - Edge Cases:  
      - Handles missing or malformed error fields gracefully.  
      - Other HTTP error codes not explicitly checked; may need extension.

#### 1.5 Transcript Cleaning

- **Overview:**  
  Cleans the raw subtitles by removing the "WEBVTT" header, timestamps, and empty lines to produce a readable transcript.

- **Nodes Involved:**  
  - `Code` (JavaScript)  

- **Node Details:**

  - **Code**  
    - Type: Code (JavaScript)  
    - Configuration:  
      - Extracts `subtitles` field from API JSON response.  
      - Removes:  
        - "WEBVTT" header lines  
        - Timestamp lines (e.g., "00:00:00 --> 00:00:05")  
        - Empty lines  
      - Trims final string.  
      - Outputs cleaned subtitles under `cleanedSubtitles`.  
    - Input: True branch from `If1`.  
    - Output: Passes cleaned transcript JSON to `Google Sheets` node.  
    - Edge Cases:  
      - Missing or malformed `subtitles` field could cause errors.  
      - Regex failures if subtitle format varies unexpectedly.

#### 1.6 Google Sheets Update

- **Overview:**  
  Updates the Google Sheet with either the cleaned transcript or a "No transcription available" message, including the video URL and generation date.

- **Nodes Involved:**  
  - `Google Sheets` (Append or Update)  
  - `Google Sheets1` (Append or Update)  

- **Node Details:**

  - **Google Sheets**  
    - Type: Google Sheets (Append or Update)  
    - Configuration:  
      - Writes to "Sheet1" (gid=0) of the configured Google Sheet.  
      - Updates or appends with keys: `Video Url`, `Transcript` (cleaned), `Generated Date` (current date in ISO format).  
      - Matches rows by `Video Url` to update existing entries.  
      - Authenticates using Service Account credentials.  
    - Input: Output from `Code` node.  
    - Output: Passes to `Wait` node.  
    - Edge Cases:  
      - Invalid document ID or permissions cause write failures.  
      - Data type mismatches or empty fields.

  - **Google Sheets1**  
    - Type: Google Sheets (Append or Update)  
    - Configuration:  
      - Same sheet and document as `Google Sheets`.  
      - Writes `Transcript` field as “No transcription available” for failed API calls.  
      - Matches rows by `Video Url`.  
      - Authenticates identically.  
    - Input: False branch from `If1`.  
    - Output: Passes to `Wait` node.  
    - Edge Cases:  
      - Same as above with sheet write failures.

#### 1.7 Rate Limiting Pause

- **Overview:**  
  Waits for a fixed duration between processing batches to avoid API rate limits and maintain workflow stability.

- **Nodes Involved:**  
  - `Wait`  

- **Node Details:**

  - **Wait**  
    - Type: Wait  
    - Configuration:  
      - Waits for 10 seconds before continuing.  
    - Input: From both `Google Sheets` and `Google Sheets1`.  
    - Output: Loops back to `Loop Over Items` to fetch the next batch.  
    - Edge Cases:  
      - Long wait times may delay processing of large datasets.  
      - Removing or reducing wait risks API throttling or failures.

---

### 3. Summary Table

| Node Name                     | Node Type                  | Functional Role                                   | Input Node(s)                   | Output Node(s)                 | Sticky Note                                                                                                                |
|-------------------------------|----------------------------|-------------------------------------------------|--------------------------------|-------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Execute workflow’ | Manual Trigger             | Starts the workflow manually                      | -                              | Google Sheets2                | Manually triggers the workflow to start the process of reading TikTok URLs and generating transcripts.                      |
| Google Sheets2                 | Google Sheets (Read)        | Reads TikTok URLs and transcripts from sheet     | When clicking ‘Execute workflow’ | Loop Over Items               | Reads rows from the specified Google Sheet containing TikTok video URLs and existing transcript data.                      |
| Loop Over Items                | Split In Batches            | Processes rows in batches to avoid rate limits   | Google Sheets2                 | If (true branch to HTTP Request, false to Loop Over Items) | Processes the fetched rows in smaller batches (default 10 items per batch) to avoid rate limits or overload.              |
| If                            | Conditional Check           | Filters rows needing transcription                | Loop Over Items                | HTTP Request (true), Loop Over Items (false) | Filters to process only rows where Video Url exists and Transcript is empty.                                                |
| HTTP Request                  | HTTP Request                | Fetches raw transcript via API                     | If                            | If1                          | Calls the TikTok Transcript Generator API with the video URL to retrieve the transcript.                                    |
| If1                           | Conditional Check           | Checks API response for transcript availability   | HTTP Request                  | Code (true), Google Sheets1 (false) | Checks if the API response is valid and does not contain a 404 error.                                                       |
| Code                          | Code (JavaScript)           | Cleans raw subtitles removing timestamps and headers | If1 (true)                    | Google Sheets                 | Cleans the raw subtitles returned by the API for better readability.                                                       |
| Google Sheets                 | Google Sheets (Append/Update) | Updates sheet with cleaned transcript             | Code                          | Wait                         | Writes cleaned transcript, video URL, and date back to Google Sheet.                                                       |
| Google Sheets1                | Google Sheets (Append/Update) | Marks videos with no transcripts                   | If1 (false)                   | Wait                         | Updates sheet with "No transcription available" for videos with failed API response.                                        |
| Wait                          | Wait                        | Pauses between batches to manage rate limits      | Google Sheets, Google Sheets1 | Loop Over Items              | Pauses the workflow briefly between batches to prevent hitting API rate limits.                                             |
| Sticky Note                   | Sticky Note                 | Documentation notes                                | -                             | -                            | # 📝 TikTok Transcript Extraction & Logging Workflow ... (see all sticky notes in node details)                              |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Add a **Manual Trigger** node named `When clicking ‘Execute workflow’`.  
   - Default settings; no parameters needed.

2. **Add Google Sheets Read Node**  
   - Add a **Google Sheets** node named `Google Sheets2`.  
   - Set operation to **Read Rows**.  
   - Configure to read from "Sheet1" (gid=0) of your Google Sheets document.  
   - Use **Service Account** credentials for authentication.  
   - Connect output of Manual Trigger to this node.

3. **Add Split In Batches Node**  
   - Add a **Split In Batches** node named `Loop Over Items`.  
   - Default batch size (10 items).  
   - Connect output of `Google Sheets2` to this node.

4. **Add Conditional (If) Node**  
   - Add an **If** node named `If`.  
   - Set condition to:  
     - `Video Url` is not empty  
     - AND `Transcript` is empty  
   - Connect true output to next step; false output back to `Loop Over Items` to skip processed rows.

5. **Add HTTP Request Node**  
   - Add an **HTTP Request** node named `HTTP Request`.  
   - Set method to POST.  
   - URL: `https://tiktok-transcript-generator.p.rapidapi.com/tiktok/index.php`  
   - Body Parameters: `{ "url": "={{ $json['Video Url'] }}" }`  
   - Headers:  
     - `x-rapidapi-host`: `tiktok-transcript-generator.p.rapidapi.com`  
     - `x-rapidapi-key`: *Your RapidAPI key here*  
   - Enable "Send Body" and "Send Headers".  
   - Set **On Error** to continue regular output.  
   - Connect true output from `If` node here.

6. **Add Conditional (If1) Node**  
   - Add an **If** node named `If1`.  
   - Condition: Check if `error.status` does **not** equal 404 in the API response.  
   - True output goes to cleaning step; false goes to marking no transcript.

7. **Add Code Node**  
   - Add a **Code** node named `Code`.  
   - JavaScript code snippet to clean subtitles:  
     ```javascript
     return items.map(item => {
       const raw = item.json.subtitles;

       const cleaned = raw
         .replace(/^WEBVTT\s*/gm, '')                       // Remove "WEBVTT"
         .replace(/^\d{2}:\d{2}:\d{2} --> \d{2}:\d{2}:\d{2}/gm, '') // Remove timestamps
         .replace(/^\s*\n/gm, '')                           // Remove empty lines
         .trim();

       return {
         json: {
           cleanedSubtitles: cleaned
         }
       };
     });
     ```  
   - Connect true output from `If1` here.

8. **Add Google Sheets Append/Update Node for Clean Transcript**  
   - Add a **Google Sheets** node named `Google Sheets`.  
   - Operation: Append or Update.  
   - Sheet: "Sheet1" (gid=0) in the same Google Sheet.  
   - Map columns:  
     - `Video Url`: `={{ $('If').item.json['Video Url'] }}`  
     - `Transcript`: `={{ $json.cleanedSubtitles }}`  
     - `Generated Date`: `={{ new Date().toISOString().slice(0, 10) }}`  
   - Matching column: `Video Url`.  
   - Authenticate with Service Account credentials.  
   - Connect output of `Code` node here.

9. **Add Google Sheets Append/Update Node for No Transcript**  
   - Add another **Google Sheets** node named `Google Sheets1`.  
   - Similar configuration as above, but:  
     - `Transcript`: `"No transcription available"`  
     - `Video Url` from `If` node's item.  
     - `Generated Date`: current date as above.  
   - Connect false output from `If1` node here.

10. **Add Wait Node**  
    - Add a **Wait** node named `Wait`.  
    - Set wait time to 10 seconds.  
    - Connect outputs of both `Google Sheets` and `Google Sheets1` to this node.

11. **Loop Back to Batch Processing**  
    - Connect output of `Wait` node back to `Loop Over Items` node to process the next batch.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                        | Context or Link                                                                                  |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow automates TikTok transcript generation and logs results in Google Sheets, reducing manual transcription effort and improving content management.                                                                                                      | Sticky Note content covering entire workflow overview.                                         |
| Use a valid RapidAPI key for the TikTok Transcript Generator API to ensure successful API calls.                                                                                                                                                                   | HTTP Request node configuration.                                                               |
| Google Sheets Service Account credentials must have appropriate access to the target spreadsheet for reading and writing data.                                                                                                                                     | Google Sheets nodes authentication.                                                            |
| The `Wait` node introduces a 10-second delay to comply with API rate limits and ensure stable workflow execution when handling multiple videos.                                                                                                                    | Wait node purpose.                                                                             |
| Regex cleaning in the Code node assumes subtitle formatting consistent with WebVTT standard; variations may require adjustments.                                                                                                                                     | Code node cleaning logic.                                                                       |
| To extend error handling, consider checking for additional HTTP status codes or API error messages.                                                                                                                                                                | Suggestion for robustness in API response validation.                                         |
| This workflow design enables scalability for large video lists by batching and controlled pacing, suitable for marketing teams and social media managers.                                                                                                        | Use case summary.                                                                              |
| For further automation, consider triggering this workflow via schedule or webhook instead of manual trigger if desired.                                                                                                                                              | Enhancement suggestion.                                                                         |

---

**Disclaimer:** The provided content is derived exclusively from an automated workflow created with n8n, adhering strictly to current content policies. It contains no illegal, offensive, or protected material. All data handled is legal and publicly available.