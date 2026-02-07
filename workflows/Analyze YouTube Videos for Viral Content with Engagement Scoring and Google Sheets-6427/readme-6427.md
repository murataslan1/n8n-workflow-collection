Analyze YouTube Videos for Viral Content with Engagement Scoring and Google Sheets

https://n8nworkflows.xyz/workflows/analyze-youtube-videos-for-viral-content-with-engagement-scoring-and-google-sheets-6427


# Analyze YouTube Videos for Viral Content with Engagement Scoring and Google Sheets

### 1. Workflow Overview

This n8n workflow automates the research and analysis of YouTube videos to identify viral content based on engagement metrics. It enables users to input search criteria via a form, fetches relevant video data and channel statistics from the YouTube Data API, computes an engagement-based performance score, labels videos accordingly, and finally appends the analyzed data to a Google Sheet for further review.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Receives user input from a form specifying search term, video format, and number of videos.
- **1.2 Video ID Retrieval:** Queries the YouTube Search API to obtain video IDs matching the input criteria.
- **1.3 Video Data Fetching:** Retrieves detailed metadata and statistics for each video ID.
- **1.4 Channel Statistics Retrieval:** Fetches channel-level statistics to enrich the dataset.
- **1.5 Data Extraction and Processing:** Extracts relevant fields from the API responses and calculates an engagement-based performance score with descriptive labels.
- **1.6 Data Merging and Labeling:** Combines video and channel data, labels videos based on view-to-subscriber ratios.
- **1.7 Data Export:** Appends the processed data rows to a specified Google Sheet.
- **1.8 Control and Rate Limiting:** Uses batching and waiting nodes to respect API rate limits and manage workflow execution.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  This block captures user input from a form webhook, including the search term, desired video format, and the number of videos to analyze.

- **Nodes Involved:**  
  - On form submission  
  - Set you keys  
  - Sticky Note (Instructional)

- **Node Details:**

  - **On form submission**  
    - *Type:* Form Trigger  
    - *Role:* Entry point that triggers the workflow when a user submits the form.  
    - *Configuration:*  
      - Form titled "test" with three fields:  
        1. "Share your idea?" (text, required)  
        2. "Format" (dropdown with options: short, medium, long, required)  
        3. "Number of Videos" (number input, required)  
      - Webhook ID is preset for external triggering.  
    - *Inputs:* HTTP form submission  
    - *Outputs:* JSON containing form data for next node  
    - *Failures:* Missing required fields, webhook errors

  - **Set you keys**  
    - *Type:* Set  
    - *Role:* Assigns workflow variables and sets the API key and user inputs for downstream nodes.  
    - *Configuration:*  
      - Sets `api_key` (manual placeholder, should be replaced with a secure credential)  
      - Maps form fields to variables:  
        - `search_term` from "Share your idea?"  
        - `format` from "Format"  
        - `videoLimit` from "Number of Videos"  
    - *Inputs:* JSON from form submission  
    - *Outputs:* JSON with assigned variables  
    - *Failures:* Missing or invalid API key, expression errors in mapping

  - **Sticky Note**  
    - *Purpose:* Provides users with instructions on how to start and input data.

---

#### 2.2 Video ID Retrieval

- **Overview:**  
  This block queries the YouTube Search API to retrieve video IDs based on the user's search term, format, and video limit.

- **Nodes Involved:**  
  - Get Video IDs (HTTP Request)  
  - Extract IDs (Code)  
  - Sticky Note (Instructional)

- **Node Details:**

  - **Get Video IDs**  
    - *Type:* HTTP Request  
    - *Role:* Calls YouTube v3 Search API to find videos matching the search parameters.  
    - *Configuration:*  
      - URL: `https://www.googleapis.com/youtube/v3/search`  
      - Query parameters include:  
        - `part=snippet`  
        - `maxResults` = user-defined video limit  
        - `order=viewCount` (sort by popularity)  
        - `publishedAfter` = 7 days ago (dynamic)  
        - `publishedBefore` = now (dynamic)  
        - `q` = user search term  
        - `type=video`  
        - `videoDuration` = user selected format  
        - `key` = API key  
        - `regionCode=US`  
      - HTTP Header: Accept: application/json  
    - *Inputs:* From Set you keys node  
    - *Outputs:* JSON with video search results  
    - *Failures:* API key errors, quota exceeded, invalid parameters, network errors

  - **Extract IDs**  
    - *Type:* Code (JavaScript)  
    - *Role:* Parses the search API response to extract an array of video IDs.  
    - *Configuration:*  
      - Maps through all input items, extracts `videoId` from each video in `items`.  
      - Returns a flat array of objects with `videoid` fields.  
    - *Inputs:* Output of Get Video IDs  
    - *Outputs:* List of video ID objects for further processing  
    - *Failures:* If `items` is missing or empty, output will be empty; no error handling for malformed input.

  - **Sticky Note**  
    - *Purpose:* Explains that this block is simply getting video IDs from the YouTube API, reminds users to add their Google API key.

---

#### 2.3 Video Data Fetching

- **Overview:**  
  For each video ID, this block fetches detailed video metadata and statistics, including title, views, likes, comments, thumbnails, and channel information.

- **Nodes Involved:**  
  - Loop Over Items (SplitInBatches)  
  - Get Video Data (HTTP Request)  
  - Extract Video Data (Code)  
  - Video Performance (Code)  
  - Sticky Notes (Instructional)

- **Node Details:**

  - **Loop Over Items**  
    - *Type:* SplitInBatches  
    - *Role:* Processes video IDs in batches to avoid exceeding API rate limits.  
    - *Configuration:* Default batch size (not specified), no delay configured here.  
    - *Inputs:* Video IDs from Extract IDs  
    - *Outputs:* Batches of video IDs  
    - *Failures:* If batch size is too large, may cause API throttling.

  - **Get Video Data**  
    - *Type:* HTTP Request  
    - *Role:* Calls YouTube Videos API to retrieve detailed video info for given video IDs.  
    - *Configuration:*  
      - URL: `https://www.googleapis.com/youtube/v3/videos`  
      - Query parameters include:  
        - `part=snippet,statistics,contentDetails,status,topicDetails,recordingDetails,liveStreamingDetails,localizations,player`  
        - `id` = current video ID from batch  
        - `key` = API key  
      - Header: Accept: application/json  
    - *Inputs:* Video IDs from Loop Over Items  
    - *Outputs:* Detailed video info as JSON  
    - *Failures:* API key issues, quota, invalid video IDs, timeout

  - **Extract Video Data**  
    - *Type:* Code (JavaScript)  
    - *Role:* Extracts relevant video fields and prepares them for scoring and output.  
    - *Configuration:*  
      - Extracts channel title, channel URL, video title, viewCount, likeCount, commentCount, video URL, thumbnail URL, and a Google Sheets formula for thumbnail preview.  
    - *Inputs:* Video data from Get Video Data  
    - *Outputs:* Cleaned, structured video data objects  
    - *Failures:* Missing fields in API response (fallbacks to empty strings or zeroes), expression errors

  - **Video Performance**  
    - *Type:* Code (JavaScript)  
    - *Role:* Calculates an engagement-based performance score and assigns an emoji label describing video popularity.  
    - *Configuration:*  
      - Engagement rate = (likes + comments) / views * 1000 (scaled)  
      - Score clamped between 0 and 100  
      - Labels range from "💀 Dead" (very low engagement) to "🚀 HOLY HELL" (exceptional viral performance)  
      - Updates each item with `performance` and `performanceText` fields.  
    - *Inputs:* Extracted video data  
    - *Outputs:* Video data enriched with performance metrics  
    - *Failures:* Division by zero if views = 0 handled by skipping calculation, parsing errors if counts are not numbers

  - **Sticky Notes**  
    - *Provide guidance:*  
      - Explain the purpose of each step: getting video data, extracting data, calculating performance score.

---

#### 2.4 Channel Statistics Retrieval

- **Overview:**  
  This block fetches YouTube channel statistics to complement video data, enabling ratio calculations and better labeling.

- **Nodes Involved:**  
  - Get Channel Statistics (HTTP Request)  
  - Channel Data (Code)  
  - Sticky Note (Instructional)

- **Node Details:**

  - **Get Channel Statistics**  
    - *Type:* HTTP Request  
    - *Role:* Calls YouTube Channels API to get snippet and statistics for the channel of the video.  
    - *Configuration:*  
      - URL: `https://www.googleapis.com/youtube/v3/channels`  
      - Query params:  
        - `part=snippet,statistics,contentDetails`  
        - `id` = channel ID from the video data  
        - `key` = API key  
      - Redirect option enabled (though not strictly necessary)  
    - *Inputs:* Video data with channelId from Get Video Data  
    - *Outputs:* Channel statistics JSON  
    - *Failures:* API key errors, invalid channel ID, quota limits

  - **Channel Data**  
    - *Type:* Code (JavaScript)  
    - *Role:* Extracts the statistics object from the channel API response, preparing it for merging.  
    - *Configuration:*  
      - Returns only the statistics JSON from first item in input array.  
    - *Inputs:* Channel statistics response  
    - *Outputs:* Cleaned channel statistics object  
    - *Failures:* Missing or malformed input data

  - **Sticky Note**  
    - *Purpose:* Explains that we're retrieving channel data such as subscriber count and video count.

---

#### 2.5 Data Merging and Labeling

- **Overview:**  
  This block merges video and channel data, calculates view-to-subscriber ratios, and assigns labels describing the relative performance of the video in context.

- **Nodes Involved:**  
  - Merge (Combine)  
  - Code (Labeling)  
  - Sticky Note (Instructional)

- **Node Details:**

  - **Merge**  
    - *Type:* Merge  
    - *Role:* Combines video performance data and channel statistics into one dataset.  
    - *Configuration:* Combine mode set to "combine all" to merge all inputs into one array.  
    - *Inputs:*  
      - From Video Performance node (video data + performance)  
      - From Channel Data node (channel statistics)  
    - *Outputs:* Combined dataset for labeling  
    - *Failures:* Mismatch in input lengths or missing inputs can cause incomplete merges

  - **Code (Labeling)**  
    - *Type:* Code (JavaScript)  
    - *Role:* Calculates the ratio of views to subscribers and assigns a qualitative label: Outlier, Bad, Okay, Good, or Uncategorized.  
    - *Configuration:*  
      - Reads `viewCount` and `subscriberCount`  
      - Calculates ratio = views / subscribers (with zero-check)  
      - Labels based on ratio thresholds and subscriber/view counts to detect outliers or poor performance  
      - Adds `label` and formatted `viewToSubRatio` to each item  
    - *Inputs:* Merged video and channel data  
    - *Outputs:* Fully enriched dataset with labels  
    - *Failures:* Parsing errors, division by zero handled explicitly

  - **Sticky Note**  
    - *Purpose:* Explains the labeling criteria based on the view-to-subscriber ratio.

---

#### 2.6 Data Export

- **Overview:**  
  Finalized data is appended to a Google Sheet for easy visualization and sharing. A wait node is used to manage timing before the loop restarts.

- **Nodes Involved:**  
  - Append row in sheet (Google Sheets)  
  - Wait (Delay)  
  - Sticky Note (Instructional)

- **Node Details:**

  - **Append row in sheet**  
    - *Type:* Google Sheets  
    - *Role:* Appends each processed video record as a new row in a specified Google Sheet.  
    - *Configuration:*  
      - Operation: append  
      - Sheet Name: "gid=0" (default first sheet)  
      - Document ID: The specific Google Sheet document ID provided  
      - Columns mapped automatically from input data fields including: viewCount, subscriberCount, channelTitle, title, likeCount, commentCount, videoURL, thumbnail, thumbnailPreview, performance, performanceText, label, viewToSubRatio, etc.  
    - *Credentials:* Google Sheets OAuth2 credentials (named "Akash Google Sheet Account")  
    - *Inputs:* Labeled video + channel data  
    - *Outputs:* Confirmation of append operation  
    - *Failures:* Authentication failure, permission errors, quota exceeded, network issues

  - **Wait**  
    - *Type:* Wait  
    - *Role:* Pauses workflow for 2 seconds after appending to handle rate limits and sequencing.  
    - *Configuration:* 2 seconds delay  
    - *Inputs:* After append row  
    - *Outputs:* Triggers the next batch or ends workflow  
    - *Failures:* Generally none, but workflow stuck if downstream nodes fail

  - **Sticky Note**  
    - *Purpose:* Explains that this step uploads all data to Google Sheets for easier review.

---

### 3. Summary Table

| Node Name           | Node Type             | Functional Role                               | Input Node(s)           | Output Node(s)         | Sticky Note                                                                                          |
|---------------------|-----------------------|-----------------------------------------------|------------------------|------------------------|----------------------------------------------------------------------------------------------------|
| On form submission  | Form Trigger          | Workflow entry point to receive user input   | —                      | Set you keys           |                                                                                                    |
| Set you keys         | Set                   | Assigns API key and user input variables     | On form submission      | Get Video IDs          |                                                                                                    |
| Get Video IDs        | HTTP Request          | Fetches video IDs via YouTube Search API     | Set you keys            | Extract IDs            | # Video ID's<br>Simply just getting the video ID's from YouTube API. Add your Google API key here. |
| Extract IDs          | Code                  | Extracts video IDs from search results       | Get Video IDs           | Loop Over Items        | # Extracting ID's<br>Extracting video ID's so we can feed them into the next YouTube API endpoint.  |
| Loop Over Items      | SplitInBatches        | Processes video IDs in batches                | Extract IDs             | Get Video Data         |                                                                                                    |
| Get Video Data       | HTTP Request          | Retrieves detailed video data                  | Loop Over Items         | Extract Video Data, Get Channel Statistics | # Get Video Data<br>Now we're getting the video data from each of the video ID's. Titles, likes, views, comments, etc. Add your Google API key here. |
| Extract Video Data   | Code                  | Extracts relevant video metadata               | Get Video Data          | Video Performance      | # Extracting Video Data<br>Extracting the video engagement metrics                                  |
| Video Performance    | Code                  | Calculates engagement score and labels videos| Extract Video Data      | Merge                  | # Video Performance<br>Using a simple calculation to determine video performance                   |
| Get Channel Statistics| HTTP Request         | Fetches channel stats for video's channel     | Get Video Data          | Channel Data           | # Get Video Data (shared with above note)                                                          |
| Channel Data         | Code                  | Extracts channel statistics from API response | Get Channel Statistics  | Merge                  | # Get Channel Statistics<br>Retrieving channel stats                                              |
| Merge                | Merge                 | Combines video and channel data                | Video Performance, Channel Data | Code (Labeling)      |                                                                                                    |
| Code (Labeling)      | Code                  | Calculates view-to-subscriber ratio and labels| Merge                   | Append row in sheet    |                                                                                                    |
| Append row in sheet  | Google Sheets         | Appends data rows to Google Sheet              | Code (Labeling)         | Wait                   | # Send to Google Sheets<br>Upload everything to our google sheet so we can view everything easier  |
| Wait                 | Wait                  | Delays workflow to manage rate limits          | Append row in sheet     | Loop Over Items         |                                                                                                    |
| Sticky Note          | Sticky Note           | Instructions for starting the workflow         | —                      | —                      | # Start<br>1. Send your search term<br>2. And Select format -'short', 'medium' or 'long'<br>Eg: best open source workflow tool |
| Sticky Note1         | Sticky Note           | Workflow overview and instructions              | —                      | —                      | # 🔍 YouTube Viral Video Research Workflow 📈 — Bulk Video Analysis for Viral Content!<br>Detailed overview and setup instructions included. |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node named "On form submission":**  
   - Configure the form with three fields:  
     - Text field labeled "Share your idea?" (required)  
     - Dropdown labeled "Format" with options: short, medium, long (required)  
     - Number field labeled "Number of Videos" (required)  
   - Note the webhook URL generated for triggering.

2. **Add a Set node named "Set you keys":**  
   - Assign the following variables:  
     - `api_key` (string): Your Google YouTube Data API key (replace `<api-key>` placeholder)  
     - `search_term`: Expression mapping from form input `"Share your idea?"`  
     - `format`: Expression from form input `"Format"`  
     - `videoLimit`: Expression from form input `"Number of Videos"`

3. **Add an HTTP Request node named "Get Video IDs":**  
   - Set HTTP Method: GET  
   - URL: `https://www.googleapis.com/youtube/v3/search`  
   - Query Parameters:  
     - `part`: snippet  
     - `maxResults`: `={{ $json.videoLimit || 1 }}`  
     - `order`: viewCount  
     - `publishedAfter`: `={{ $now.minus({days:7}).startOf('day').toISO() }}`  
     - `publishedBefore`: `={{ $now.toISO() }}`  
     - `q`: `={{ $json.search_term }}`  
     - `type`: video  
     - `videoDuration`: `={{ $json.format }}`  
     - `key`: `={{ $json.api_key }}`  
     - `regionCode`: US  
   - Headers: Accept: application/json

4. **Add a Code node named "Extract IDs":**  
   - JavaScript code:  
     ```javascript
     const items = $input.all();
     return items.flatMap(item => 
       (item.json?.items || []).map(videoItem => ({
         json: {
           videoid: videoItem?.id?.videoId || null
         }
       }))
     );
     ```

5. **Add a SplitInBatches node named "Loop Over Items":**  
   - Default batch size (can be customized based on quota limits)

6. **Add an HTTP Request node named "Get Video Data":**  
   - HTTP Method: GET  
   - URL: `https://www.googleapis.com/youtube/v3/videos`  
   - Query Parameters:  
     - `part`: snippet,statistics,contentDetails,status,topicDetails,recordingDetails,liveStreamingDetails,localizations,player  
     - `id`: `={{ $json.videoid }}`  
     - `key`: `={{ $('Set you keys').item.json.api_key }}`  
   - Headers: Accept: application/json

7. **Add a Code node named "Extract Video Data":**  
   - JavaScript code:  
     ```javascript
     const items = $input.all();
     return items.flatMap(item =>
       (item.json?.items || []).map(videoItem => ({
         json: {
           channelTitle: videoItem.snippet?.channelTitle || '',
           channel: "https://www.youtube.com/channel/" + $input.first().json.items[0].snippet.channelId,
           title: videoItem.snippet?.title || '',
           viewCount: videoItem.statistics?.viewCount || 0,
           likeCount: videoItem.statistics?.likeCount || 0,
           commentCount: videoItem.statistics?.commentCount || 0,
           videoURL: `https://www.youtube.com/watch?v=${videoItem.id || ''}`,
           thumbnail: videoItem.snippet?.thumbnails?.maxres?.url || '',
           thumbnailPreview: `=IMAGE("${videoItem.snippet?.thumbnails?.maxres?.url || ''}",4,200,150)`
         }
       }))
     );
     ```

8. **Add a Code node named "Video Performance":**  
   - JavaScript code:  
     ```javascript
     const items = $input.all();
     return items.map(item => {
       const viewCount = parseInt(String(item.json?.viewCount || '0'), 10);
       const likeCount = parseInt(String(item.json?.likeCount || '0'), 10);
       const commentCount = parseInt(String(item.json?.commentCount || '0'), 10);
       let performance = 0;
       if (viewCount > 0) {
         const engagementRate = ((likeCount + commentCount) / viewCount) * 1000;
         performance = Math.min(Math.max(engagementRate, 0), 100);
       }
       const roundedPerformance = Math.round(performance);
       let performanceText = "💀 Dead";
       if (roundedPerformance >= 80) performanceText = "🚀 HOLY HELL";
       else if (roundedPerformance >= 60) performanceText = "🔥 INSANE";
       else if (roundedPerformance >= 40) performanceText = "💪 CRUSHING IT";
       else if (roundedPerformance >= 30) performanceText = "⭐ Stellar";
       else if (roundedPerformance >= 20) performanceText = "💪 Strong";
       else if (roundedPerformance >= 15) performanceText = "😊 Good";
       else if (roundedPerformance >= 10) performanceText = "🙂 Decent";
       else if (roundedPerformance >= 5) performanceText = "😐 Average";
       else {
         switch(roundedPerformance) {
           case 0: performanceText = "💀 Dead"; break;
           case 1: performanceText = "😴 Sleeping"; break;
           case 2: performanceText = "😐 Meh"; break;
           case 3: performanceText = "😕 Not good"; break;
           case 4: performanceText = "😞 Poor"; break;
           default: performanceText = "💀 Dead";
         }
       }
       return {
         ...item,
         json: {
           ...item.json,
           performance,
           performanceText
         }
       };
     });
     ```

9. **Add an HTTP Request node named "Get Channel Statistics":**  
   - HTTP Method: GET  
   - URL: `https://www.googleapis.com/youtube/v3/channels`  
   - Query Parameters:  
     - `part`: snippet,statistics,contentDetails  
     - `id`: `={{ $json.items[0].snippet.channelId }}`  
     - `key`: `={{ $('Set you keys').item.json.api_key }}`  
   - Enable redirect option (default)

10. **Add a Code node named "Channel Data":**  
    - JavaScript code:  
      ```javascript
      return [$input.first().json.items[0].statistics];
      ```

11. **Add a Merge node named "Merge":**  
    - Mode: Combine  
    - Combine By: Combine All  
    - Inputs:  
      - From Video Performance node  
      - From Channel Data node

12. **Add a Code node named "Code" for labeling:**  
    - JavaScript code:  
      ```javascript
      return $input.all().map(item => {
        const views = parseInt(item.json.viewCount || '0');
        const subs = parseInt(item.json.subscriberCount || '0');
        let label = '';
        const ratio = subs > 0 ? views / subs : 0;
        if ((subs < 500 && views > 5000) || (ratio > 1 && subs > 1000)) {
          label = 'Outlier';
        } else if (ratio < 0.02) {
          label = 'Bad';
        } else if (ratio >= 0.02 && ratio < 0.1) {
          label = 'Okay';
        } else if (ratio >= 0.1) {
          label = 'Good';
        } else {
          label = 'Uncategorized';
        }
        return {
          json: {
            ...item.json,
            label,
            viewToSubRatio: ratio.toFixed(4)
          }
        };
      });
      ```

13. **Add a Google Sheets node named "Append row in sheet":**  
    - Operation: Append  
    - Document ID: Your Google Sheet document ID  
    - Sheet Name: `gid=0` or your actual sheet name  
    - Columns: Auto map input data fields including all relevant fields (viewCount, subscriberCount, title, performance, label, etc.)  
    - Credentials: Google Sheets OAuth2 credentials properly configured

14. **Add a Wait node named "Wait":**  
    - Delay: 2 seconds (to manage API rate limits and sequencing)

15. **Connect nodes as follows:**  
    - On form submission → Set you keys → Get Video IDs → Extract IDs → Loop Over Items → Get Video Data → Extract Video Data → Video Performance → Merge (input 1)  
    - Get Video Data → Get Channel Statistics → Channel Data → Merge (input 2)  
    - Merge → Code (Labeling) → Append row in sheet → Wait → Loop Over Items (second output to continue batches)

16. **Add Sticky Notes for clarity:**  
    - Place instructional Sticky Notes near corresponding nodes as documented.

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| This workflow enables bulk analysis of YouTube videos to identify viral content based on engagement metrics, perfect for content creators and marketers. | Workflow description and intended use |
| Google API Key must be generated via Google Developers Console at https://console.developers.google.com/ and added securely to the n8n credentials (avoid hardcoding). | Setup instructions for API key |
| Google Sheets must be shared with the Google account used in n8n to allow appending data. | Google Sheets OAuth2 setup |
| Workflow includes detailed instructions via sticky notes, including labels for performance scoring like "🚀 HOLY HELL" for viral videos. | User guidance within workflow |
| Video performance scoring uses an engagement rate scaled by 10x to reflect realistic YouTube engagement percentages. | Scoring methodology |
| Rate limiting is managed via batching and a 2-second wait node to avoid API quota issues. | Workflow stability considerations |

---

**Disclaimer:**  
The provided information and workflow are based solely on an n8n automation workflow utilizing publicly accessible YouTube APIs and Google Sheets integration. All data handled is legal and publicly available. The workflow respects all relevant content and API usage policies.