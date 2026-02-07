Automate Zoom Attendee Segmentation in KlickTipp Based on Participation

https://n8nworkflows.xyz/workflows/automate-zoom-attendee-segmentation-in-klicktipp-based-on-participation-8910


# Automate Zoom Attendee Segmentation in KlickTipp Based on Participation

### 1. Workflow Overview

This n8n workflow automates the segmentation of Zoom webinar attendees in KlickTipp based on their participation duration. It listens for Zoom meeting ended events, validates incoming webhook requests, retrieves participant data from past meetings, and then subscribes and tags attendees in KlickTipp according to their attendance level (full or partial attendance). The workflow supports multiple webinar topics (e.g., beginner and expert webinars), filtering out internal users such as hosts, and applies different tags for full attendance.

**Logical Blocks:**

- **1.1 Webhook Listener and Validation**: Listens for Zoom webhook events and validates Zoom’s URL validation requests to establish webhook trust.
- **1.2 Event Processing and Delay**: Responds to regular Zoom meeting ended events and waits briefly to ensure data availability.
- **1.3 Retrieve Past Meeting Participants**: Pulls participant data for the ended webinar using Zoom API.
- **1.4 Participant Filtering and Routing**: Splits participant list, filters out internal users (hosts), and routes participants by webinar topic.
- **1.5 KlickTipp Subscription and Tagging**: Subscribes participants to KlickTipp lists and tags them based on attendance thresholds.
- **1.6 Attendance Threshold Checks and Tagging**: Determines if participants attended ≥90% of the webinar and applies the corresponding tags.

---

### 2. Block-by-Block Analysis

#### 1.1 Webhook Listener and Validation

**Overview:**  
This block listens for Zoom webhook POST requests and distinguishes between URL validation calls and normal meeting ended events. It performs HMAC SHA256 validation on Zoom’s validation requests and responds appropriately to confirm webhook ownership.

**Nodes Involved:**  
- Listen to ending Zoom meetings  
- URL Validation check (IF)  
- Crypto  
- Build Validation Body  
- Respond to Webhook (Validation)  
- Build Normal Event Body  
- Respond to Webhook (Events)

**Node Details:**  

- **Listen to ending Zoom meetings**  
  - Type: Webhook  
  - Role: Entry point listening for POST Zoom webhook events at a specific path.  
  - Config: HTTP POST, response mode set to use a response node.  
  - Inputs: External Zoom webhook POST requests.  
  - Outputs: JSON with event data.  
  - Failure modes: Missing or malformed Zoom payloads, unauthorized calls.

- **URL Validation check**  
  - Type: IF  
  - Role: Checks if the incoming event is a Zoom `endpoint.url_validation` request.  
  - Config: Compares `$json.body.event` with string `"endpoint.url_validation"`.  
  - Inputs: From webhook node.  
  - Outputs: Two branches — validation (true) and normal event (false).  
  - Edge cases: Case sensitivity, missing event field.

- **Crypto**  
  - Type: Crypto (HMAC SHA256)  
  - Role: Generates HMAC SHA256 hash of the plain token from Zoom using a secret key to validate the token.  
  - Config: Uses `$json.body.payload.plainToken` as value and secret `"dm4D484mTSKT67HpYQ8U0w"`.  
  - Inputs: Validation branch from IF node.  
  - Outputs: Encrypted token string.  
  - Failure: Invalid or missing tokens, incorrect secret key.

- **Build Validation Body**  
  - Type: Set  
  - Role: Constructs JSON with `plainToken` and the computed `encryptedToken` to send back to Zoom.  
  - Config: Sets `plainToken` from incoming JSON and `encryptedToken` from Crypto node output.  
  - Inputs: From Crypto node.  
  - Outputs: JSON response body for validation.  

- **Respond to Webhook (Validation)**  
  - Type: Respond to Webhook  
  - Role: Sends Zoom the required response to confirm webhook URL.  
  - Inputs: From Build Validation Body node.  
  - Outputs: HTTP 200 OK with validation body.  

- **Build Normal Event Body**  
  - Type: Set  
  - Role: Builds a generic `{ status: "ok" }` response for normal Zoom events.  
  - Inputs: From URL Validation check node’s false branch (normal event).  
  - Outputs: JSON response.  

- **Respond to Webhook (Events)**  
  - Type: Respond to Webhook  
  - Role: Sends back confirmation to Zoom for normal events.  
  - Inputs: From Build Normal Event Body node.  
  - Outputs: HTTP 200 OK.  

---

#### 1.2 Event Processing and Delay

**Overview:**  
After responding to Zoom’s event, the workflow waits 1 second to ensure that the meeting data is fully available through Zoom’s API before proceeding to fetch participants.

**Nodes Involved:**  
- Respond to Webhook (Events)  
- Wait 1 second  
- Get past Zoom meeting participants

**Node Details:**  

- **Respond to Webhook (Events)**  
  - (See above) Sends immediate response to Zoom webhook.

- **Wait 1 second**  
  - Type: Wait  
  - Role: Pauses the workflow 1 second post Zoom event to prevent premature API calls.  
  - Config: Wait time set to 1 second.  
  - Inputs: From Respond to Webhook (Events).  
  - Outputs: Proceeds next to fetch participants.  
  - Failure: Rare; network issues or node crashes.

- **Get past Zoom meeting participants**  
  - Type: HTTP Request  
  - Role: Calls Zoom API to get participant list of the past meeting using UUID from webhook payload.  
  - Config: URL dynamically constructed as `https://api.zoom.us/v2/past_meetings/{{meetingUUID}}/participants`. OAuth2 credentials for Zoom API used.  
  - Inputs: From Wait node.  
  - Outputs: JSON list of participants including attendance durations and details.  
  - Failure: API rate limits, invalid UUID, expired OAuth token, network errors.

---

#### 1.3 Retrieve Past Meeting Participants and Filtering

**Overview:**  
This block splits the participant array into individual items and filters out internal users such as hosts to avoid tagging them as attendees.

**Nodes Involved:**  
- Split webinar participants  
- Filter internal users

**Node Details:**  

- **Split webinar participants**  
  - Type: Split Out  
  - Role: Iterates through the `participants` array, outputting each participant as a separate item.  
  - Config: Field to split is `participants` from the Zoom API response.  
  - Inputs: From Get past Zoom meeting participants.  
  - Outputs: Individual participant JSON objects.  

- **Filter internal users**  
  - Type: Filter  
  - Role: Removes internal users (e.g., hosts) by checking a boolean flag `internal_user` in participant JSON.  
  - Config: Condition checks if `internal_user` is true; if so, excludes the participant.  
  - Inputs: From Split webinar participants.  
  - Outputs: Only external participants.  
  - Edge cases: Missing `internal_user` field may cause misclassification.

---

#### 1.4 Participant Routing by Webinar Topic

**Overview:**  
Routes filtered participants into different branches based on the webinar topic (e.g., "E-Mail Zustellung für Anfänger" vs "E-Mail Zustellung für Experten") to apply separate subscriber and tagging logic.

**Nodes Involved:**  
- Route by webinar name  
- Subscribe participant (beginner webinar branch)  
- Subscribe participant1 (expert webinar branch)

**Node Details:**  

- **Route by webinar name**  
  - Type: Switch  
  - Role: Routes participants based on whether the webinar topic contains "E-Mail Zustellung für Anfänger" or "E-Mail Zustellung für Experten".  
  - Config: Uses string containment on the Zoom meeting topic extracted from webhook payload.  
  - Inputs: From Filter internal users.  
  - Outputs: Two branches named accordingly.  
  - Edge cases: Topic naming changes or typos break routing.

- **Subscribe participant**  
  - Type: KlickTipp Node (subscribe)  
  - Role: Subscribes/updates participant in KlickTipp list for the beginner webinar branch with a general attendance tag.  
  - Config: Uses participant email; applies tagId `13327964`; sets first and last name by parsing `name` field.  
  - Inputs: From Route by webinar name (beginner branch).  
  - Outputs: To attendance check node.  
  - Failure: KlickTipp API errors, invalid emails.

- **Subscribe participant1**  
  - Type: KlickTipp Node (subscribe)  
  - Role: Same as above but for expert webinar branch, tagId `13327965`.  
  - Inputs: From Route by webinar name (expert branch).  
  - Outputs: To attendance check node.

---

#### 1.5 Attendance Threshold Checks and Tagging

**Overview:**  
This block checks if participants attended ≥90% of the webinar duration and tags them accordingly for full attendance within KlickTipp.

**Nodes Involved:**  
- Check full attendance (beginner branch)  
- Tag participant for full attendance (beginner)  
- Check full attendance1 (expert branch)  
- Tag participant with full attendance1 (expert)

**Node Details:**  

- **Check full attendance**  
  - Type: IF  
  - Role: Checks if participant’s `duration` in seconds is greater than 90% of the webinar’s total duration (converted to seconds).  
  - Config: Compares participant duration against `object.duration * 60 * 0.9` from webhook payload.  
  - Inputs: From Subscribe participant (beginner).  
  - Outputs: True branch for full attendance, false branch (no further action).  
  - Edge cases: Missing duration data, zero duration, inaccurate Zoom durations.

- **Tag participant for full attendance**  
  - Type: KlickTipp Node (contact-tagging)  
  - Role: Tags participant with full attendance tag for beginner webinar (`tagId: 13440472`).  
  - Inputs: From Check full attendance true branch.  
  - Outputs: End of branch.  
  - Failure: KlickTipp API errors.

- **Check full attendance1**  
  - Type: IF  
  - Role: Same as Check full attendance but for expert webinar participants.  
  - Inputs: From Subscribe participant1 (expert).  
  - Outputs: True branch for full attendance, false branch (no further action).

- **Tag participant with full attendance1**  
  - Type: KlickTipp Node (contact-tagging)  
  - Role: Tags participant with full attendance tag for expert webinar (`tagId: 13445224`).  
  - Inputs: From Check full attendance1 true branch.  
  - Outputs: End of branch.

---

### 3. Summary Table

| Node Name                    | Node Type                 | Functional Role                                 | Input Node(s)                   | Output Node(s)                      | Sticky Note                                                                                       |
|------------------------------|---------------------------|------------------------------------------------|---------------------------------|------------------------------------|-------------------------------------------------------------------------------------------------|
| Listen to ending Zoom meetings | Webhook                   | Entry point listening for Zoom webhook events | —                               | URL Validation check               |                                                                                                |
| URL Validation check          | IF                        | Checks for Zoom URL validation event           | Listen to ending Zoom meetings  | Crypto (true), Build Normal Event Body (false) |                                                                                                |
| Crypto                       | Crypto                    | Generates HMAC SHA256 for validation           | URL Validation check            | Build Validation Body              |                                                                                                |
| Build Validation Body         | Set                       | Builds response body for Zoom validation       | Crypto                         | Respond to Webhook (Validation)   |                                                                                                |
| Respond to Webhook (Validation) | Respond to Webhook         | Sends validation response back to Zoom         | Build Validation Body           | —                                  |                                                                                                |
| Build Normal Event Body       | Set                       | Builds generic OK response for normal events   | URL Validation check            | Respond to Webhook (Events)        |                                                                                                |
| Respond to Webhook (Events)   | Respond to Webhook         | Sends OK response to Zoom for events            | Build Normal Event Body         | Wait 1 second                     |                                                                                                |
| Wait 1 second                | Wait                      | Waits 1 second before fetching meeting data     | Respond to Webhook (Events)     | Get past Zoom meeting participants |                                                                                                |
| Get past Zoom meeting participants | HTTP Request            | Fetches webinar participants from Zoom API     | Wait 1 second                  | Split webinar participants         |                                                                                                |
| Split webinar participants    | Split Out                 | Splits participant list into individual items  | Get past Zoom meeting participants | Filter internal users           |                                                                                                |
| Filter internal users         | Filter                    | Filters out internal users like hosts           | Split webinar participants      | Route by webinar name             |                                                                                                |
| Route by webinar name         | Switch                    | Routes participants by webinar topic            | Filter internal users           | Subscribe participant (beginner), Subscribe participant1 (expert) |                                                                                                |
| Subscribe participant         | KlickTipp Subscribe       | Subscribes beginner webinar participants        | Route by webinar name           | Check full attendance              |                                                                                                |
| Check full attendance         | IF                        | Checks if attendance ≥ 90% for beginner webinar | Subscribe participant           | Tag participant for full attendance (true), (false branch no action) |                                                                                                |
| Tag participant for full attendance | KlickTipp contact-tagging | Tags participants with full attendance tag (beginner) | Check full attendance           | —                                  |                                                                                                |
| Subscribe participant1        | KlickTipp Subscribe       | Subscribes expert webinar participants          | Route by webinar name           | Check full attendance1             |                                                                                                |
| Check full attendance1        | IF                        | Checks if attendance ≥ 90% for expert webinar   | Subscribe participant1          | Tag participant with full attendance1 (true), (false branch no action) |                                                                                                |
| Tag participant with full attendance1 | KlickTipp contact-tagging | Tags participants with full attendance tag (expert) | Check full attendance1          | —                                  |                                                                                                |
| Sticky Note                  | Sticky Note               | Labels Meeting data reception block              | —                               | —                                  | ## Meeting data reception                                                                       |
| Sticky Note1                 | Sticky Note               | Labels Pulling webinar data block                 | —                               | —                                  | ## Pulling webinar data - participants and absentees                                           |
| Sticky Note2                 | Sticky Note               | Labels Segment all participants block             | —                               | —                                  | ## Segment all participants and absentees from the past webinar                               |
| Sticky Note3                 | Sticky Note               | Provides detailed workflow overview and instructions | —                               | —                                  | Community Node Disclaimer: This workflow uses KlickTipp community nodes. (Full detailed note)   |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Webhook Node**  
   - Name: `Listen to ending Zoom meetings`  
   - Type: Webhook  
   - HTTP Method: POST  
   - Path: Unique path for Zoom webhook (e.g., `0149ebe4-2dd9-420d-af7c-d60439f22451`)  
   - Response Mode: Response Node  
   - Save.

2. **Add an IF Node**  
   - Name: `URL Validation check`  
   - Type: IF  
   - Condition: `$json.body.event` equals `"endpoint.url_validation"` (case-sensitive)  
   - True branch: URL validation request  
   - False branch: Normal Zoom event

3. **Add a Crypto Node**  
   - Name: `Crypto`  
   - Type: Crypto (HMAC SHA256)  
   - Parameters:  
     - Type: SHA256  
     - Action: HMAC  
     - Value: Expression `{{$json.body.payload.plainToken}}`  
     - Secret: Your Zoom webhook secret (e.g., `"dm4D484mTSKT67HpYQ8U0w"`)

4. **Add a Set Node**  
   - Name: `Build Validation Body`  
   - Type: Set  
   - Set fields:  
     - `plainToken` = `{{$json.body.payload.plainToken}}`  
     - `encryptedToken` = `{{$json.data}}` (output from Crypto node)

5. **Add a Respond to Webhook Node**  
   - Name: `Respond to Webhook (Validation)`  
   - Type: Respond to Webhook  
   - Connect from `Build Validation Body`  
   - Sends response back to Zoom for validation.

6. **Add a Set Node**  
   - Name: `Build Normal Event Body`  
   - Type: Set  
   - Set field: `status` = `"ok"`  
   - Connect from `URL Validation check` false branch.

7. **Add a Respond to Webhook Node**  
   - Name: `Respond to Webhook (Events)`  
   - Type: Respond to Webhook  
   - Connect from `Build Normal Event Body`.

8. **Add a Wait Node**  
   - Name: `Wait 1 second`  
   - Type: Wait  
   - Wait time: 1 second  
   - Connect from `Respond to Webhook (Events)`.

9. **Add an HTTP Request Node**  
   - Name: `Get past Zoom meeting participants`  
   - Type: HTTP Request  
   - URL: `https://api.zoom.us/v2/past_meetings/{{ $json.body.payload.object.uuid }}/participants`  
   - Authentication: OAuth2 credentials for Zoom API  
   - Connect from `Wait 1 second`.

10. **Add a Split Out Node**  
    - Name: `Split webinar participants`  
    - Type: Split Out  
    - Field to split: `participants` from previous HTTP response  
    - Connect from `Get past Zoom meeting participants`.

11. **Add a Filter Node**  
    - Name: `Filter internal users`  
    - Type: Filter  
    - Condition: Exclude items where `internal_user` is `true` (boolean check)  
    - Connect from `Split webinar participants`.

12. **Add a Switch Node**  
    - Name: `Route by webinar name`  
    - Type: Switch  
    - Add two outputs with conditions:  
      - Output 1: Webinar topic contains `"E-Mail Zustellung für Anfänger"`  
      - Output 2: Webinar topic contains `"E-Mail Zustellung für Experten"`  
    - Use expression: `{{ $('Listen to ending Zoom meetings').item.json.body.payload.object.topic }}`  
    - Connect from `Filter internal users`.

13. **Add two KlickTipp Subscribe Nodes**  
    - Name: `Subscribe participant` (Beginner branch)  
      - Email: `{{$json.email}}` or `{{$json.user_email}}` depending on data field  
      - TagId: `"13327964"`  
      - ListId: `"358895"`  
      - Fields: Extract first and last name from `$json.name` string splitting by space  
      - Connect from first output of Switch node.  

    - Name: `Subscribe participant1` (Expert branch)  
      - Same as above but TagId: `"13327965"`  
      - Connect from second output of Switch node.

14. **Add two IF Nodes to check attendance ≥ 90%**  
    - Name: `Check full attendance` (Beginner branch)  
      - Condition: `$json.duration` > webinar duration * 60 * 0.9  
      - Webinar duration from webhook payload: `{{ $('Listen to ending Zoom meetings').item.json.body.payload.object.duration }}`  
      - Connect from `Subscribe participant`.  

    - Name: `Check full attendance1` (Expert branch)  
      - Same condition as above.  
      - Connect from `Subscribe participant1`.

15. **Add two KlickTipp Tagging Nodes**  
    - Name: `Tag participant for full attendance` (Beginner)  
      - Email: `{{$json.email}}`  
      - TagId: `"13440472"` (full attendance tag)  
      - Connect from true branch of `Check full attendance`.

    - Name: `Tag participant with full attendance1` (Expert)  
      - Email: `{{$json.email}}`  
      - TagId: `"13445224"`  
      - Connect from true branch of `Check full attendance1`.

---

### 5. General Notes & Resources

| Note Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Context or Link                                                                                                                                                                                                 |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Community Node Disclaimer: This workflow uses KlickTipp community nodes. It automates Zoom to KlickTipp integration for attendee segmentation based on participation time. The workflow supports multiple webinar topics with distinct tagging logic and filters out internal users such as hosts. It requires Zoom API OAuth2 credentials and KlickTipp API credentials. Setup instructions and campaign expansion ideas are included in the sticky notes inside the workflow. Pro tip: test with different attendance durations to validate tagging.                                                                                                                                                                                                                                                                                                                                                              | Included as detailed sticky note `Sticky Note3` inside the workflow JSON.                                                                                                                                        |
| Zoom API Scopes required: `meeting:read:meeting`, `meeting:read:list_past_participants`. Zoom webhook must be configured to send `meeting.ended` events. KlickTipp requires pre-created tags and custom fields to handle meeting metadata and attendance segments.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Zoom and KlickTipp setup instructions from sticky notes.                                                                                                                                                         |
| The webhook secret key used for HMAC validation (`dm4D484mTSKT67HpYQ8U0w`) must match the secret configured in Zoom webhook settings for URL validation to succeed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Crypto node secret key configuration.                                                                                                                                                                           |
| Attendance percentage thresholds are currently set at 90%. Adjust IF node conditions to change segmentation sensitivity.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Attendance check IF nodes.                                                                                                                                                                                       |
| Potential failure points include: invalid webhook payloads, Zoom API rate limits, expired OAuth tokens, incorrect KlickTipp tag IDs, and missing participant data. Implement monitoring and error handling as needed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | General best practices and failure modes.                                                                                                                                                                       |
| For more information on Zoom API and webhooks: https://marketplace.zoom.us/docs/api-reference/webhook-reference/endpoint-validation/                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Zoom API Documentation.                                                                                                                                                                                          |
| For KlickTipp API information and community nodes: https://community.klicktipp.com/                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | KlickTipp Community Resources.                                                                                                                                                                                  |

---

This document fully details the workflow structure, logic, nodes, configuration, and reproduction instructions to enable both expert users and automation agents to understand, reproduce, and extend this Zoom to KlickTipp attendee segmentation automation.