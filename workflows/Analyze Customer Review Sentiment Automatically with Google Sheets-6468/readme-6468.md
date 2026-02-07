Analyze Customer Review Sentiment Automatically with Google Sheets

https://n8nworkflows.xyz/workflows/analyze-customer-review-sentiment-automatically-with-google-sheets-6468


# Analyze Customer Review Sentiment Automatically with Google Sheets

### 1. Workflow Overview

This workflow, titled **"Analyze Customer Review Sentiment Automatically with Google Sheets"**, is designed to automate the process of sentiment analysis on customer reviews entered into a Google Sheet. It targets use cases such as quick customer satisfaction assessment, trend identification in feedback, and prioritizing customer follow-ups based on sentiment insights.

The core logic is organized into the following functional blocks:

- **1.1 Input Reception:** Detects new customer review entries added to a Google Sheet.
- **1.2 Sentiment Analysis:** Applies a custom keyword-based sentiment analysis to the review text.
- **1.3 Data Update:** Updates the original Google Sheet row with the detected sentiment.
- **1.4 User Guidance:** Sticky notes providing setup instructions, workflow purpose, and testing guidelines.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  Monitors a specified Google Sheet for newly added rows (i.e., new customer reviews) and triggers the workflow when detected.

- **Nodes Involved:**  
  - Google Sheets Trigger

- **Node Details:**

  **Google Sheets Trigger**  
  - Type: Trigger node that listens for changes in Google Sheets.  
  - Configuration:  
    - Event: `rowAdded` — triggers when a new row is added.  
    - Polling Interval: Every minute.  
    - Sheet: Specific sheet named "customer_reviews_template" within the Google Sheet document.  
    - Document ID: Points to the Google Sheet titled "Customer Review".  
    - Credentials: Uses OAuth2 credentials for Google Sheets API access.  
  - Inputs: None (trigger node).  
  - Outputs: Passes new row data downstream.  
  - Version-specific: Uses Google Sheets API v1 trigger node.  
  - Edge Cases / Failure Modes:  
    - OAuth token expiry or revocation causing authentication failures.  
    - API rate limits or connectivity issues.  
    - Missed triggers if polling is delayed or fails.  
  - Sub-workflow: None.

#### 1.2 Sentiment Analysis

- **Overview:**  
  Performs a custom sentiment analysis on the incoming review text using keyword matching to classify sentiment as Positive, Negative, Neutral, or Mixed.

- **Nodes Involved:**  
  - Analyze Sentiment (Code node)

- **Node Details:**

  **Analyze Sentiment**  
  - Type: Code node executing JavaScript for customized logic.  
  - Configuration:  
    - Reads "Review Text" and "Review ID" from incoming JSON.  
    - Converts review text to lowercase.  
    - Defines arrays of positive and negative keywords.  
    - Counts occurrences of positive and negative keywords separately.  
    - Determines sentiment based on count comparison:  
      - More positive keywords: "Positive"  
      - More negative keywords: "Negative"  
      - Equal count but both > 0: "Mixed"  
      - Otherwise: "Neutral"  
    - Returns an object with `sentiment` and `reviewId`.  
  - Key expressions:  
    - Usage of `.includes()` for keyword presence.  
    - Conditional logic for sentiment assignment.  
  - Inputs: Receives row data from Google Sheets Trigger.  
  - Outputs: JSON containing sentiment classification and review ID for matching.  
  - Version-specific: Requires n8n version supporting JavaScript Code node v2.  
  - Edge Cases / Failure Modes:  
    - Empty or missing "Review Text" field causing runtime errors.  
    - Case sensitivity handled by lowercasing.  
    - Keywords not exhaustive; ambiguous or complex sentences may be misclassified.  
    - Performance impact negligible for small datasets.  
  - Sub-workflow: None.

#### 1.3 Data Update

- **Overview:**  
  Updates the original Google Sheet row with the sentiment result based on matching review ID.

- **Nodes Involved:**  
  - Update Google Sheet with Sentiment

- **Node Details:**

  **Update Google Sheet with Sentiment**  
  - Type: Google Sheets node for updating rows.  
  - Configuration:  
    - Operation: `update` one or more rows.  
    - Sheet Name: Same as trigger, "customer_reviews_template".  
    - Document ID: Same Google Sheet document.  
    - Matching Column: Uses "Review ID" to find the exact row to update.  
    - Columns to Update:  
      - "Sentiment" column set to sentiment value from previous node.  
      - "Review ID" included for matching integrity.  
    - Mapping Mode: Defined explicitly for columns.  
    - Credentials: Uses OAuth2 credentials for Google Sheets API.  
  - Inputs: Receives sentiment and reviewId from Analyze Sentiment node.  
  - Outputs: Typically passes updated data downstream (none connected here).  
  - Version-specific: Uses Google Sheets node v4.6+.  
  - Edge Cases / Failure Modes:  
    - Failure to find matching row if Review ID is missing or mismatched.  
    - Google Sheets API quota or permission errors.  
    - Concurrent edits causing update conflicts.  
  - Sub-workflow: None.

#### 1.4 User Guidance (Sticky Notes)

- **Overview:**  
  Provides documentation and setup guidance within the workflow editor for user reference.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  
  - Sticky Note2

- **Node Details:**

  **Sticky Note**  
  - Type: Informational note node.  
  - Content:  
    - Workflow purpose: analyze customer reviews for sentiment automatically.  
    - Author: David Olusola.  
    - Use case explanation.  
  - Position: Top-left area for visibility.

  **Sticky Note1**  
  - Type: Instructional note.  
  - Content:  
    - Step-by-step instructions to create Google Sheets OAuth2 credentials in n8n.  
    - Link to copy the sample Google Sheet:  
      [Customer Review Google Sheet](https://docs.google.com/spreadsheets/d/1XmyKfySCUAgyTgnAU3p0bz22D_ofAPoTAUw2HuBezrM/edit?usp=sharing)  
  - Position: Top-right area.

  **Sticky Note2**  
  - Type: Instructional note.  
  - Content:  
    - Instructions on activating and testing the workflow.  
    - How to add a new review row and expect automatic sentiment updates.  
  - Position: Mid-left area.

- Edge Cases: None; purely informational.

---

### 3. Summary Table

| Node Name                   | Node Type                | Functional Role                       | Input Node(s)          | Output Node(s)                   | Sticky Note                                                                                                                                                                                      |
|-----------------------------|--------------------------|-------------------------------------|------------------------|---------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Google Sheets Trigger        | googleSheetsTrigger      | Detects new customer review entries | None                   | Analyze Sentiment                | This workflow watches for new rows in a Google Sheet (e.g., where you manually log customer reviews) and uses a Code node to perform a simple sentiment analysis, then updates the same row.     |
| Analyze Sentiment            | code                     | Performs keyword-based sentiment analysis | Google Sheets Trigger  | Update Google Sheet with Sentiment |                                                                                                                                                                                                 |
| Update Google Sheet with Sentiment | googleSheets           | Updates Google Sheet row with sentiment | Analyze Sentiment       | None                            |                                                                                                                                                                                                 |
| Sticky Note                 | stickyNote               | Workflow overview and purpose       | None                   | None                            | This workflow watches for new rows in a Google Sheet (e.g., where you manually log customer reviews) and uses a Code node to perform a simple sentiment analysis, then updates the same row.     |
| Sticky Note1                | stickyNote               | Setup instructions and Google Sheet link | None                   | None                            | To get this workflow up and running, follow these instructions: Create Google Sheets OAuth2 credentials in n8n; Copy the Google Sheet here: https://docs.google.com/spreadsheets/d/1XmyKfySCUAgyTgnAU3p0bz22D_ofAPoTAUw2HuBezrM/edit?usp=sharing |
| Sticky Note2                | stickyNote               | Activation and testing instructions | None                   | None                            | Click the "Activate" toggle button in the top right corner of the n8n workflow editor; Add a new row in the Google Sheet with a review text; Workflow triggers automatically to update sentiment. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Sheets Trigger Node**  
   - Add a new node of type **Google Sheets Trigger**.  
   - Set **Event** to `rowAdded`.  
   - Configure to poll every 1 minute.  
   - Set **Document ID** to your Google Sheet (e.g., "Customer Review").  
   - Set **Sheet Name** to the sheet containing reviews (e.g., "customer_reviews_template").  
   - Attach Google Sheets OAuth2 credentials (create if absent).  
   - This node will trigger on new rows added.

2. **Add a Code Node for Sentiment Analysis**  
   - Add a new **Code** node named "Analyze Sentiment".  
   - Use JavaScript to:  
     - Read `"Review Text"` and `"Review ID"` from input JSON.  
     - Convert review text to lowercase.  
     - Define arrays of positive and negative keywords.  
     - Count occurrences of each keyword set using `.includes()`.  
     - Assign sentiment label: "Positive", "Negative", "Mixed", or "Neutral".  
     - Return JSON object with fields: `sentiment` and `reviewId`.  
   - Connect output of Google Sheets Trigger to this node.

3. **Add Google Sheets Node to Update Row**  
   - Add a **Google Sheets** node named "Update Google Sheet with Sentiment".  
   - Set **Operation** to `update`.  
   - Set **Document ID** and **Sheet Name** to same as trigger node.  
   - Define **Matching Columns** as `"Review ID"`.  
   - Map columns explicitly:  
     - `"Sentiment"` set to `{{$json.sentiment}}`.  
     - `"Review ID"` set to `{{$json.reviewId}}`.  
   - Attach Google Sheets OAuth2 credentials (can be same or different from trigger).  
   - Connect output of "Analyze Sentiment" node to this node.

4. **Add Sticky Notes for Documentation (Optional but recommended)**  
   - Add sticky notes with content describing workflow purpose, setup instructions, and testing guidelines as per original workflow.  
   - Position them conveniently in the canvas.

5. **Testing and Activation**  
   - Activate the workflow by toggling the activation button.  
   - Add a new row in the Google Sheet with a column "Review Text" filled and leave "Sentiment" empty.  
   - Verify that after up to 1 minute the "Sentiment" column is updated with the analyzed sentiment.

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                                            |
|----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Workflow author: David Olusola                                                                                        | Provided in Sticky Note                                                                                                     |
| Sample Google Sheet to copy for testing and setup                                                                    | https://docs.google.com/spreadsheets/d/1XmyKfySCUAgyTgnAU3p0bz22D_ofAPoTAUw2HuBezrM/edit?usp=sharing                       |
| Activation instructions include toggling activation and manual row addition for immediate testing                    | Provided in Sticky Note2                                                                                                    |
| OAuth2 credentials setup for Google Sheets API is mandatory and involves user authentication and consent             | Detailed in Sticky Note1                                                                                                    |

---

**Disclaimer:**  
The provided text is exclusively derived from an automated workflow created with n8n, an integration and automation tool. This processing strictly adheres to applicable content policies and contains no illegal, offensive, or protected elements. All data handled are legal and publicly available.