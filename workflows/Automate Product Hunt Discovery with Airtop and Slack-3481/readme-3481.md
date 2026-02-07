Automate Product Hunt Discovery with Airtop and Slack

https://n8nworkflows.xyz/workflows/automate-product-hunt-discovery-with-airtop-and-slack-3481


# Automate Product Hunt Discovery with Airtop and Slack

### 1. Workflow Overview

This workflow automates the monitoring of Product Hunt for new product launches related to specific topics and delivers the results directly to a Slack channel. It is designed for users who want to stay updated on relevant product launches without manually checking Product Hunt multiple times a day.

The workflow is logically divided into the following blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow on a daily schedule.
- **1.2 Define Search Topic:** Sets the topic or keywords for the Product Hunt search.
- **1.3 Product Hunt Query via Airtop:** Uses Airtop's cloud browser node to extract up to 5 relevant product launches from Product Hunt based on the defined topic.
- **1.4 Conditional Check:** Determines if relevant products were found.
- **1.5 Slack Notification:** Sends the extracted product launch information to a specified Slack channel.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:**  
  This block triggers the workflow once daily at a specified hour, ensuring the monitoring runs automatically without manual intervention.

- **Nodes Involved:**  
  - Trigger daily

- **Node Details:**  
  - **Trigger daily**  
    - Type: Schedule Trigger  
    - Configuration: Set to trigger daily at 6:00 AM (UTC by default unless timezone specified)  
    - Inputs: None (start node)  
    - Outputs: Connects to "Define relevant products" node  
    - Edge Cases: If the n8n instance is down at trigger time, the execution will be missed unless retry or catch mechanisms are configured externally.  
    - Version: 1.2

#### 1.2 Define Search Topic

- **Overview:**  
  This block defines the search term(s) for which the workflow will look for product launches on Product Hunt.

- **Nodes Involved:**  
  - Define relevant products

- **Node Details:**  
  - **Define relevant products**  
    - Type: Set node  
    - Configuration: Assigns a string variable named "Relevant Products" with the value "AI Agents"  
    - Inputs: Receives trigger from "Trigger daily"  
    - Outputs: Passes data to "Look up products" node  
    - Key Expressions: The variable `Relevant Products` is used dynamically in the Airtop prompt expression  
    - Edge Cases: If the value is empty or malformed, the subsequent query may return no results or errors.  
    - Version: 3.4

#### 1.3 Product Hunt Query via Airtop

- **Overview:**  
  This block performs the actual scraping and extraction of product launch data from Product Hunt using Airtop's cloud browser capabilities.

- **Nodes Involved:**  
  - Look up products

- **Node Details:**  
  - **Look up products**  
    - Type: Airtop node (custom integration)  
    - Configuration:  
      - URL: https://www.producthunt.com/  
      - Prompt: A dynamic prompt that instructs Airtop to extract up to 5 product launches related to the topic defined in "Relevant Products". The prompt requests the title and URL for each product and specifies a fallback output "[NA]" if no relevant products are found.  
      - Session Mode: New session for each execution  
    - Credentials: Uses Airtop API key credential named "[PROD] Airtop"  
    - Inputs: Receives the "Relevant Products" variable from the Set node  
    - Outputs: Passes the extraction result to the "Found products?" conditional node  
    - Key Expressions: The prompt uses `={{ $json["Relevant Products"] }}` to insert the search term dynamically.  
    - Edge Cases:  
      - API key invalid or expired → authentication failure  
      - Network timeout or Airtop service unavailability  
      - Product Hunt page structure changes causing extraction errors  
      - No results found → returns "[NA]" string as per prompt  
    - Version: 1

#### 1.4 Conditional Check

- **Overview:**  
  This block checks if the Airtop node returned any relevant products or the fallback "[NA]" string, deciding whether to proceed with sending a Slack message.

- **Nodes Involved:**  
  - Found products?

- **Node Details:**  
  - **Found products?**  
    - Type: If node  
    - Configuration:  
      - Condition: Checks if the string returned by Airtop (`$json.data.modelResponse`) does NOT contain "[NA]"  
      - Case Sensitive: True  
      - Type Validation: Strict string comparison  
    - Inputs: Receives extraction result from "Look up products"  
    - Outputs:  
      - True branch: Connects to "Send slack message" node (only if relevant products found)  
      - False branch: No connection (workflow ends silently if no products found)  
    - Edge Cases:  
      - If the response format changes or is malformed, condition may fail or misinterpret results  
      - Case sensitivity may cause false negatives if "[na]" or other variants appear  
    - Version: 2.2

#### 1.5 Slack Notification

- **Overview:**  
  This block sends the formatted product launch information to a designated Slack channel via Slack API.

- **Nodes Involved:**  
  - Send slack message

- **Node Details:**  
  - **Send slack message**  
    - Type: Slack node  
    - Configuration:  
      - Text: Uses the Airtop response string (`$json.data.modelResponse`) as the message content  
      - Channel: Sends to Slack channel ID "C087FK3J0MC" (configured via channel selector)  
      - Other options: Default  
    - Credentials: Uses Slack API OAuth2 credential named "Slack account"  
    - Inputs: Receives data from the "Found products?" node's true branch  
    - Outputs: None (end node)  
    - Edge Cases:  
      - Slack API authentication failure or revoked token  
      - Channel ID invalid or bot not invited to channel  
      - Message length limits or formatting issues  
    - Version: 2.3

---

### 3. Summary Table

| Node Name             | Node Type           | Functional Role                  | Input Node(s)        | Output Node(s)        | Sticky Note                                                                                         |
|-----------------------|---------------------|---------------------------------|----------------------|-----------------------|---------------------------------------------------------------------------------------------------|
| Trigger daily         | Schedule Trigger    | Initiates workflow daily         | None                 | Define relevant products |                                                                                                   |
| Define relevant products | Set                 | Defines search topic for query   | Trigger daily         | Look up products       |                                                                                                   |
| Look up products      | Airtop               | Queries Product Hunt via Airtop  | Define relevant products | Found products?        | Requires Airtop API key credential. Prompt dynamically inserts search term.                        |
| Found products?       | If                   | Checks if relevant products found | Look up products      | Send slack message (true branch) | Condition checks for "[NA]" string to detect no results.                                         |
| Send slack message    | Slack                | Sends product info to Slack      | Found products? (true) | None                  | Requires Slack OAuth2 credential. Sends message to channel ID C087FK3J0MC.                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a new workflow in n8n.**

2. **Add a Schedule Trigger node:**
   - Name: "Trigger daily"
   - Type: Schedule Trigger
   - Parameters:
     - Set to trigger daily at 6:00 AM (adjust hour as needed)
   - No credentials required
   - This node will start the workflow.

3. **Add a Set node:**
   - Name: "Define relevant products"
   - Connect input from "Trigger daily"
   - Parameters:
     - Add a string field named "Relevant Products"
     - Set value to your desired search term, e.g., "AI Agents"
   - No credentials required

4. **Add an Airtop node:**
   - Name: "Look up products"
   - Connect input from "Define relevant products"
   - Parameters:
     - URL: https://www.producthunt.com/
     - Prompt:  
       ```
       Extract up to 5 product launches that are {{ $json["Relevant Products"] }} for each product extract the title and URL (if exists).

       Return format:
       Today's [{{ $json["Relevant Products"] }}] on Producthunt
       1. Title 1 (URL 1)
       2. Title 2 (URL 2)
       and so on

       If you cannot find any relevant products, return [NA]
       ```
     - Resource: extraction
     - Operation: query
     - Session Mode: new
   - Credentials:
     - Select or create Airtop API credential with your API key

5. **Add an If node:**
   - Name: "Found products?"
   - Connect input from "Look up products"
   - Parameters:
     - Condition: Check if the field `data.modelResponse` does NOT contain the string "[NA]"
     - Case Sensitive: true
     - Type Validation: strict string
   - Outputs:
     - True branch: proceed to Slack node
     - False branch: no output (ends workflow)

6. **Add a Slack node:**
   - Name: "Send slack message"
   - Connect input from the true branch of "Found products?"
   - Parameters:
     - Text: Set to `{{$json.data.modelResponse}}` to send the extracted product info
     - Channel: Select the Slack channel by ID or name (e.g., channel ID "C087FK3J0MC")
   - Credentials:
     - Select or create Slack OAuth2 credential with permission to post messages and access the target channel

7. **Activate the workflow and test:**
   - Run the workflow manually or wait for the scheduled trigger
   - Verify Slack channel receives the formatted product launch messages

---

### 5. General Notes & Resources

| Note Content                                                                                                         | Context or Link                                                                                  |
|----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Airtop API key is required to use the Airtop node for web scraping and extraction.                                   | https://portal.airtop.ai/?utm_campaign=n8n                                                     |
| Slack workspace must allow adding incoming webhooks or OAuth2 apps with chat:write permission to post messages.      | Slack API documentation: https://api.slack.com/messaging/webhooks                              |
| Best practice: Use specific search terms to improve relevance and reduce noise in notifications.                     | See "Best Practices" section in workflow description                                          |
| Scheduling frequency can be adjusted to balance update timeliness and notification fatigue.                          | Suggested every 4 hours during working hours                                                   |
| Enable error handling in n8n to catch API or network failures and alert responsible parties.                         | n8n error workflow configuration documentation                                                |
| Consider monthly review of monitored topics to keep automation aligned with current needs.                           | Workflow description recommendations                                                          |
| For customization, you can modify the prompt, Slack message formatting, and add filters for keywords or companies.  | Workflow description customization options                                                    |

---

This document provides a complete and detailed reference for understanding, reproducing, and maintaining the "Monitor ProductHunt" automation workflow in n8n.