Automate Google Business Reviews with AI Responses, Slack Alerts & Sheets Logging

https://n8nworkflows.xyz/workflows/automate-google-business-reviews-with-ai-responses--slack-alerts---sheets-logging-6590


# Automate Google Business Reviews with AI Responses, Slack Alerts & Sheets Logging

### 1. Workflow Overview

This n8n workflow automates the monitoring of Google Business Profile reviews, generating AI-crafted responses, sending Slack alerts based on review sentiment, and logging all interactions into Google Sheets. It is designed to streamline customer engagement and team notifications for businesses managing online reputation.

The workflow is logically divided into the following blocks:

- **1.1 Review Monitoring:** Watches for new reviews on a specified Google Business Profile location.
- **1.2 Business Configuration:** Sets business-specific parameters and environment variables used throughout the workflow.
- **1.3 Review Formatting:** Extracts and standardizes review details into consistent fields.
- **1.4 AI Response Generation:** Uses AI to craft a tailored response based on the review content and rating.
- **1.5 Sentiment-Based Routing:** Determines if a review is negative or positive and routes accordingly.
- **1.6 Notification Dispatch:** Sends Slack alerts to the team with the review and AI response, differentiated by sentiment.
- **1.7 Review Logging:** Records the review and AI response details into a Google Sheet for tracking and analysis.
- **1.8 Documentation and Setup Guidance:** Sticky notes providing setup instructions, configuration details, and integration tips.

---

### 2. Block-by-Block Analysis

#### 1.1 Review Monitoring

- **Overview:**  
  Continuously monitors the Google Business Profile for new reviews at a specific business location, triggering the workflow on each new review detected.

- **Nodes Involved:**  
  - Monitor Google Reviews

- **Node Details:**  
  - **Monitor Google Reviews**  
    - *Type:* Google Business Profile Trigger  
    - *Role:* Event trigger node that polls the Google Business Profile API every minute for new reviews.  
    - *Configuration:*  
      - Uses environment variables for `GOOGLE_BUSINESS_ACCOUNT_ID` and `GOOGLE_BUSINESS_LOCATION_ID`.  
      - Poll interval set to every minute for near real-time monitoring.  
    - *Input:* None (trigger node).  
    - *Output:* Emits review JSON data when a new review is detected.  
    - *Potential Failures:* Authentication errors with Google API, API rate limits, invalid account/location IDs.  
    - *Version Notes:* Requires Google Business Profile API enabled in Google Cloud and proper credentials.  

#### 1.2 Business Configuration

- **Overview:**  
  Sets key business context variables used downstream, such as business name, response tone, Slack webhook URL, and notification email.

- **Nodes Involved:**  
  - Business Configuration

- **Node Details:**  
  - **Business Configuration**  
    - *Type:* Set node  
    - *Role:* Initializes variables for use throughout the workflow.  
    - *Configuration:*  
      - `businessName`: String, e.g., "Your Business Name".  
      - `responseTone`: String controlling AI response style, e.g., "professional and friendly".  
      - `slackWebhookUrl`: Pulled from environment variable `SLACK_WEBHOOK_URL`.  
      - `notificationEmail`: Pulled from environment variable `NOTIFICATION_EMAIL`.  
    - *Input:* Receives review data from trigger node.  
    - *Output:* Passes enriched data forward with added configuration variables.  
    - *Edge Cases:* Missing or incorrect environment variables may cause downstream notification or AI response issues.  
    - *Continue On Fail:* Enabled to ensure workflow continues despite config issues.  

#### 1.3 Review Formatting

- **Overview:**  
  Transforms raw Google review data into a standardized format with clear field names for easier processing.

- **Nodes Involved:**  
  - Format Google Reviews

- **Node Details:**  
  - **Format Google Reviews**  
    - *Type:* Set node  
    - *Role:* Maps incoming review JSON to custom fields: `source`, `rating`, `reviewText`, `reviewerName`, `reviewDate`, and `reviewId`.  
    - *Configuration:* Uses expressions to extract fields from incoming JSON.  
    - *Input:* Receives enriched data from Business Configuration.  
    - *Output:* Outputs normalized review data for AI processing.  
    - *Edge Cases:* Missing or malformed review fields could cause empty or incorrect AI inputs.  
    - *Continue On Fail:* Enabled to avoid blocking on partial data.  

#### 1.4 AI Response Generation

- **Overview:**  
  Uses an AI node to analyze the formatted review and generate a professional response tailored to the tone and rating.

- **Nodes Involved:**  
  - Generate AI Response

- **Node Details:**  
  - **Generate AI Response**  
    - *Type:* AI Transform (likely OpenAI or similar)  
    - *Role:* Crafts a reply to the review using instructions that consider the review rating and tone preferences.  
    - *Configuration:*  
      - Instructions embed review fields via expressions: source, rating, reviewer name, review text.  
      - Response tone dynamically set using `Business Configuration.responseTone`.  
      - Conditional logic: If rating ≤ 3, acknowledge concerns and offer remediation; if 4-5 stars, thank warmly.  
      - Response limited to under 150 words.  
    - *Input:* Receives formatted review data.  
    - *Output:* Outputs the AI-generated response text in the `output` field.  
    - *Edge Cases:* AI API failures, rate limits, unexpected input format causing poor responses.  
    - *Continue On Fail:* Enabled to maintain workflow even if AI call fails.  

#### 1.5 Sentiment-Based Routing

- **Overview:**  
  Routes the workflow based on whether the review is negative (rating ≤ 3) or positive (rating > 3).

- **Nodes Involved:**  
  - Negative Review?

- **Node Details:**  
  - **Negative Review?**  
    - *Type:* If node  
    - *Role:* Checks if the review rating is less than or equal to 3.  
    - *Configuration:* Numeric comparison for rating ≤ 3.  
    - *Input:* Receives AI response and review data.  
    - *Output:* Two branches:  
      - True branch for negative reviews (≤3 stars).  
      - False branch for positive reviews (>3 stars).  
    - *Edge Cases:* Ratings missing or non-numeric could cause logic failure.  
    - *Version Notes:* Uses version 2.2 of If node for enhanced validation.  

#### 1.6 Notification Dispatch

- **Overview:**  
  Sends Slack messages to alert the team of new reviews, differentiating messages for negative and positive reviews.

- **Nodes Involved:**  
  - Alert Team - Negative  
  - Notify Team - Positive

- **Node Details:**  
  - **Alert Team - Negative**  
    - *Type:* HTTP Request node  
    - *Role:* Sends a Slack webhook message for negative reviews including review details and AI response.  
    - *Configuration:*  
      - URL taken from `Business Configuration.slackWebhookUrl`.  
      - POST method with JSON body containing text formatted with markdown and emojis (🚨).  
    - *Input:* Receives negative review branch data.  
    - *Output:* Passes data to logging node.  
    - *Edge Cases:* Slack webhook URL invalid, network errors, rate limits.  
    - *Continue On Fail:* Enabled to avoid blocking workflow in case of notification failure.  

  - **Notify Team - Positive**  
    - *Type:* HTTP Request node  
    - *Role:* Sends a Slack webhook message for positive reviews similarly formatted but with different emoji (✨).  
    - *Configuration:* Same as negative alert but message text tailored to positive feedback.  
    - *Input:* Receives positive review branch data.  
    - *Output:* Passes data to logging node.  
    - *Edge Cases:* Same as above.  
    - *Continue On Fail:* Enabled.  

#### 1.7 Review Logging

- **Overview:**  
  Appends the review details and AI response into a Google Sheet for record-keeping and historical analysis.

- **Nodes Involved:**  
  - Log to Google Sheets

- **Node Details:**  
  - **Log to Google Sheets**  
    - *Type:* Google Sheets node  
    - *Role:* Appends a new row with review data and AI response to the "Reviews" sheet.  
    - *Configuration:*  
      - Document ID from environment variable `GOOGLE_SHEET_ID`.  
      - Sheet named "Reviews".  
      - Columns mapped: Date (current ISO timestamp), Source, Rating, Review, Reviewer, Review ID, AI Response.  
      - Authentication via Service Account with editor permissions.  
    - *Input:* Receives data from either Slack alert node.  
    - *Output:* None (terminal node).  
    - *Edge Cases:* Missing or invalid Sheet ID, permission issues with service account, network errors.  
    - *Continue On Fail:* Enabled to avoid blocking workflow if logging fails.  

#### 1.8 Documentation and Setup Guidance

- **Overview:**  
  Provides visual notes within the workflow editor to guide users for setup, configuration, and usage.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  
  - Sticky Note2

- **Node Details:**  
  - **Sticky Note (Positioned top-left):**  
    - Setup guide for Google Business Profile API, Google Sheets integration, Slack webhook, and business configuration.  
    - Contains stepwise instructions for environment variable setup and testing.  

  - **Sticky Note1 (Near Google Sheets node):**  
    - Details required sheet name "Reviews", headers, and permissions for Service Account.  
    - Ensures correct columns for logging.  

  - **Sticky Note2 (Near Business Configuration node):**  
    - Instructions to update business name, response tone, Slack webhook URL, and notification email in the Business Configuration node.  
    - Emphasizes use of environment variables for sensitive data.  

---

### 3. Summary Table

| Node Name             | Node Type                 | Functional Role                        | Input Node(s)            | Output Node(s)             | Sticky Note                                                                                         |
|-----------------------|---------------------------|-------------------------------------|--------------------------|----------------------------|---------------------------------------------------------------------------------------------------|
| Monitor Google Reviews | Google Business Profile Trigger | Triggers workflow on new reviews     | None                     | Business Configuration      |                                                                                                   |
| Business Configuration | Set                       | Sets business variables (name, tone, webhook, email) | Monitor Google Reviews     | Format Google Reviews       | See Sticky Note2 for update instructions on business config variables                             |
| Format Google Reviews  | Set                       | Formats raw review data into standardized fields | Business Configuration    | Generate AI Response        |                                                                                                   |
| Generate AI Response   | AI Transform              | Generates AI-crafted review response | Format Google Reviews     | Negative Review?            |                                                                                                   |
| Negative Review?       | If                        | Routes based on review rating ≤ 3   | Generate AI Response       | Alert Team - Negative, Notify Team - Positive |                                                                                                   |
| Alert Team - Negative  | HTTP Request              | Sends Slack alert for negative reviews | Negative Review?          | Log to Google Sheets        |                                                                                                   |
| Notify Team - Positive | HTTP Request              | Sends Slack alert for positive reviews | Negative Review?          | Log to Google Sheets        |                                                                                                   |
| Log to Google Sheets   | Google Sheets             | Logs review and AI response to sheet | Alert Team - Negative, Notify Team - Positive | None                       | See Sticky Note1 for Google Sheets setup details                                                  |
| Sticky Note            | Sticky Note               | Setup guide and instructions         | None                     | None                       | See content in block 1.8 for detailed setup instructions                                         |
| Sticky Note1           | Sticky Note               | Google Sheets configuration details  | None                     | None                       | See content in block 1.8 for required sheet structure and permissions                             |
| Sticky Note2           | Sticky Note               | Business Configuration instructions  | None                     | None                       | See content in block 1.8 for environment variable usage and config update instructions           |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Google Business Profile Trigger Node:**  
   - Type: Google Business Profile Trigger  
   - Configure with:  
     - Account mode: ID, value from environment variable `GOOGLE_BUSINESS_ACCOUNT_ID`  
     - Location mode: ID, value from environment variable `GOOGLE_BUSINESS_LOCATION_ID`  
     - Poll interval: every minute  
   - No credentials needed beyond Google API setup.

2. **Add Set Node "Business Configuration":**  
   - Purpose: Define variables used downstream.  
   - Assign variables:  
     - `businessName`: String (e.g., "Your Business Name")  
     - `responseTone`: String (e.g., "professional and friendly")  
     - `slackWebhookUrl`: Expression pulling from env var `SLACK_WEBHOOK_URL`  
     - `notificationEmail`: Expression pulling from env var `NOTIFICATION_EMAIL`  
   - Connect output of Google Business Profile Trigger to this node.  
   - Enable "Continue On Fail" to avoid stopping workflow on config errors.

3. **Add Set Node "Format Google Reviews":**  
   - Purpose: Normalize review data fields.  
   - Set fields with expressions:  
     - `source`: "Google Business Profile" (static string)  
     - `rating`: `{{$json.starRating}}`  
     - `reviewText`: `{{$json.comment}}`  
     - `reviewerName`: `{{$json.reviewer.displayName}}`  
     - `reviewDate`: `{{$json.createTime}}`  
     - `reviewId`: `{{$json.reviewId}}`  
   - Connect Business Configuration node output to this node.  
   - Enable "Continue On Fail".

4. **Add AI Transform Node "Generate AI Response":**  
   - Purpose: Generate reply text using AI.  
   - Instructions template:  
     ```
     Analyze the review and generate a professional response. The review is:

     Source: {{ $json.source }}
     Rating: {{ $json.rating }}/5
     Reviewer: {{ $json.reviewerName }}
     Review: {{ $json.reviewText }}

     Generate a response that is {{ $('Business Configuration').item.json.responseTone }}. If the rating is 3 or below, acknowledge their concerns and offer to make things right. If 4-5 stars, thank them warmly. Keep responses under 150 words.
     ```  
   - Connect Format Google Reviews output to this node.  
   - Enable "Continue On Fail".

5. **Add If Node "Negative Review?":**  
   - Purpose: Branch workflow based on review rating.  
   - Condition: Numeric check if `{{$json.rating}}` ≤ 3.  
   - Connect AI response node output to this node.

6. **Add HTTP Request Node "Alert Team - Negative":**  
   - Purpose: Notify team via Slack for negative reviews.  
   - Method: POST  
   - URL: Expression `{{ $('Business Configuration').item.json.slackWebhookUrl }}`  
   - Body Parameters (JSON):  
     - `text`:  
       ```
       🚨 *Urgent: Negative Review Alert* 🚨

       *Source:* {{ $json.source }}
       *Rating:* {{ $json.rating }}/5 ⭐
       *Reviewer:* {{ $json.reviewerName }}
       *Review:* {{ $json.reviewText }}

       *Suggested Response:*
       {{ $json.output }}
       ```  
   - Connect True output of If node to this node.  
   - Enable "Continue On Fail".

7. **Add HTTP Request Node "Notify Team - Positive":**  
   - Purpose: Notify team via Slack for positive reviews.  
   - Similar configuration as negative alert, but text:  
     ```
     ✨ *New Positive Review* ✨

     *Source:* {{ $json.source }}
     *Rating:* {{ $json.rating }}/5 ⭐
     *Reviewer:* {{ $json.reviewerName }}
     *Review:* {{ $json.reviewText }}

     *Suggested Response:*
     {{ $json.output }}
     ```  
   - Connect False output of If node to this node.  
   - Enable "Continue On Fail".

8. **Add Google Sheets Node "Log to Google Sheets":**  
   - Purpose: Append review data and AI response to a Google Sheet.  
   - Operation: Append  
   - Document ID: Expression `{{ $env.GOOGLE_SHEET_ID }}`  
   - Sheet Name: "Reviews"  
   - Columns mapping:  
     - Date: `{{ new Date().toISOString() }}`  
     - Source: `{{ $json.source }}`  
     - Rating: `{{ $json.rating }}`  
     - Review: `{{ $json.reviewText }}`  
     - Reviewer: `{{ $json.reviewerName }}`  
     - Review ID: `{{ $json.reviewId }}`  
     - AI Response: `{{ $json.output }}`  
   - Authentication: Google API via Service Account with editor rights to the sheet.  
   - Connect outputs of both Slack notification nodes to this node.  
   - Enable "Continue On Fail".

9. **Add Sticky Notes for Documentation:**  
   - Create three sticky notes with content from the original workflow to provide setup instructions, sheet configuration, and business config guidance.  
   - Position the notes near related nodes for clarity.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                          | Context or Link                                                                                   |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| **Google Business Profile API Setup**: Requires Google Cloud project with Business Profile API enabled, service account credentials, environment variables `GOOGLE_BUSINESS_ACCOUNT_ID` and `GOOGLE_BUSINESS_LOCATION_ID`.                                | See Sticky Note for detailed setup steps                                                        |
| **Google Sheets Integration**: Sheet named "Reviews" must have headers: Date, Source, Rating, Reviewer, Review, AI Response, Review ID. Service Account must have editor permissions.                                                                  | See Sticky Note1 for sheet configuration details                                                |
| **Slack Webhook Setup**: Create Slack Incoming Webhook URL and save in environment variable `SLACK_WEBHOOK_URL`. Configure notification email in `NOTIFICATION_EMAIL`.                                                                                 | See Sticky Note2 and Business Configuration node                                                |
| **AI Response Tone Customization**: Adjust `responseTone` in Business Configuration node to control AI response style, e.g., "professional and friendly", "casual and warm".                                                                            | Business Configuration node                                                                      |
| **Testing the Workflow**: Manual triggers and sample data testing recommended to verify all integrations before production use.                                                                                                                      | Sticky Note setup guide                                                                           |
| **Environment Variables Security**: Sensitive data such as Slack webhook URL, Google IDs, and emails are stored in environment variables for security and ease of deployment.                                                                        | Business Configuration and general best practices                                               |

---

*Disclaimer:* The provided text is derived solely from an automated workflow created with n8n, respecting all content policies. It contains no illegal, offensive, or protected elements. All processed data is legal and public.