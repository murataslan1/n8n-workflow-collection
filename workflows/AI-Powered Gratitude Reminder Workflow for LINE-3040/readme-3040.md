AI-Powered Gratitude Reminder Workflow for LINE

https://n8nworkflows.xyz/workflows/ai-powered-gratitude-reminder-workflow-for-line-3040


# AI-Powered Gratitude Reminder Workflow for LINE

### 1. Workflow Overview

This workflow, titled **"AI-Powered Gratitude Reminder Workflow for LINE"**, is designed to automate the daily sending of personalized gratitude reminder messages via the LINE messaging platform. It targets users who want to cultivate a habit of gratitude by reflecting on positive daily experiences, leveraging AI to generate varied and engaging reminders.

The workflow runs every evening at 9:00 PM and consists of four main logical blocks:

- **1.1 Scheduled Trigger:** Initiates the workflow daily at the specified time.
- **1.2 AI-Powered Message Generation:** Uses Azure OpenAI to generate a unique gratitude reminder message with creative variation.
- **1.3 Message Formatting:** Reformats the AI-generated text to comply with LINE Push API requirements.
- **1.4 Push Notification via LINE:** Sends the formatted message directly to the user’s LINE account.

This structure ensures a seamless, automated, and customizable gratitude reminder system suitable for individuals, counselors, businesses, and organizations promoting mental wellness.

---

### 2. Block-by-Block Analysis

#### 1.1 Scheduled Trigger

- **Overview:**  
  This block triggers the workflow every day at 9:00 PM (21:00), initiating the gratitude reminder process.

- **Nodes Involved:**  
  - Trigger 2100 Bear Gratitude Jar Notice  
  - Sticky Note (Trigger explanation)

- **Node Details:**

  - **Trigger 2100 Bear Gratitude Jar Notice**  
    - *Type:* Schedule Trigger  
    - *Role:* Starts the workflow daily at a fixed time.  
    - *Configuration:* Set to trigger at hour 21 (9:00 PM).  
    - *Input:* None (time-based trigger).  
    - *Output:* Passes control to the next node, "WriteReminder".  
    - *Edge Cases:* Workflow will not trigger if n8n instance is down or timezone misconfigured.  
    - *Version:* 1.2  
    - *Sticky Note Content:*  
      > We schedule the trigger at 9.00 pm before going to bed. This flow is to reflect what is the great thing that happened today.

---

#### 1.2 AI-Powered Message Generation

- **Overview:**  
  This block generates a personalized gratitude reminder message using Azure OpenAI with a temperature setting of 0.9 to ensure message variety and creativity.

- **Nodes Involved:**  
  - Azure OpenAI Chat Model  
  - WriteReminder  
  - Sticky Note1 (AI message generation explanation)

- **Node Details:**

  - **Azure OpenAI Chat Model**  
    - *Type:* Langchain Azure OpenAI Chat Model  
    - *Role:* Generates AI-based text messages.  
    - *Configuration:*  
      - Model: "4o" (specific Azure OpenAI model)  
      - Temperature: 0.9 (to increase creativity and variation)  
    - *Credentials:* Azure OpenAI API credentials required.  
    - *Input:* Receives prompt from "WriteReminder" node.  
    - *Output:* Sends generated message text to "WriteReminder".  
    - *Edge Cases:* Possible API authentication errors, rate limits, or timeouts.  
    - *Version:* 1  
    - *Sticky Note Content:*  
      > After getting the same reminder, we tend to ignore it. This is to generate variations of reminder by setting the temperature of the model at 0.9.

  - **WriteReminder**  
    - *Type:* Langchain Chain LLM  
    - *Role:* Defines and sends prompt text to the Azure OpenAI Chat Model.  
    - *Configuration:*  
      - Prompt text: "Today is a wonderful day! 🌟 What or who brought a smile to your face today? 😊"  
      - Additional message: "You'll rewrite this message to send reminder to user to record good thing today."  
      - Prompt type: "define" (custom prompt definition)  
    - *Input:* Trigger node output.  
    - *Output:* Sends prompt to Azure OpenAI Chat Model.  
    - *Edge Cases:* Expression evaluation errors or prompt misconfiguration.  
    - *Version:* 1.5  

---

#### 1.3 Message Formatting

- **Overview:**  
  Reformats the AI-generated message to ensure it meets the LINE Push API's text formatting requirements, including escaping newlines and removing markdown or HTML tags.

- **Nodes Involved:**  
  - Reformat Output from Chat Model  
  - Sticky Note2 (Reformat explanation)

- **Node Details:**

  - **Reformat Output from Chat Model**  
    - *Type:* Set Node  
    - *Role:* Cleans and formats the AI-generated text for LINE API compatibility.  
    - *Configuration:*  
      - Creates a new string field `posestoday` by:  
        - Removing all newline characters and replacing them with escaped newlines (`\\n`)  
        - Removing markdown syntax and HTML tags  
        - Removing double quotes to avoid JSON formatting issues  
    - *Input:* AI-generated message JSON from Azure OpenAI Chat Model.  
    - *Output:* Reformatted message passed to the LINE Push Message node.  
    - *Edge Cases:* If AI text contains unexpected characters or formatting, it may cause JSON errors or message delivery failure.  
    - *Version:* 3.4  
    - *Sticky Note Content:*  
      > This is to reformat text to be able to send in Line Push API properly.

---

#### 1.4 Push Notification via LINE

- **Overview:**  
  Sends the reformatted gratitude reminder message to the user’s LINE account via the LINE Push API.

- **Nodes Involved:**  
  - Line Push Message  
  - Sticky Note3 (Push message explanation)

- **Node Details:**

  - **Line Push Message**  
    - *Type:* HTTP Request  
    - *Role:* Sends POST request to LINE Push API to deliver the message.  
    - *Configuration:*  
      - URL: https://api.line.me/v2/bot/message/push  
      - Method: POST  
      - Body: JSON containing:  
        - `to`: User’s LINE ID (placeholder "YOUR ID HERE" to be replaced)  
        - `messages`: Array with one text message containing `posestoday` field from previous node  
      - Authentication: HTTP Header Auth using LINE channel access token credentials  
    - *Input:* Reformatted message from "Reformat Output from Chat Model".  
    - *Output:* HTTP response from LINE API (success or error).  
    - *Edge Cases:* Authentication failure, invalid user ID, rate limits, network errors, or malformed JSON body.  
    - *Version:* 4.2  
    - *Sticky Note Content:*  
      > Send push message via LINE.

---

### 3. Summary Table

| Node Name                         | Node Type                         | Functional Role                      | Input Node(s)                      | Output Node(s)                   | Sticky Note                                                                                     |
|----------------------------------|----------------------------------|------------------------------------|----------------------------------|---------------------------------|------------------------------------------------------------------------------------------------|
| Trigger 2100 Bear Gratitude Jar Notice | Schedule Trigger                 | Initiates workflow daily at 9 PM   | None                             | WriteReminder                   | We schedule the trigger at 9.00 pm before going to bed. This flow is to reflect what is the great thing that happened today. |
| WriteReminder                    | Langchain Chain LLM               | Defines prompt for AI message      | Trigger 2100 Bear Gratitude Jar Notice | Azure OpenAI Chat Model         | After getting the same reminder, we tend to ignore it. This is to generate variations of reminder by setting the temperature of the model at 0.9 |
| Azure OpenAI Chat Model          | Langchain Azure OpenAI Chat Model| Generates AI gratitude reminder    | WriteReminder                   | Reformat Output from Chat Model |                                                                                                |
| Reformat Output from Chat Model  | Set                              | Formats AI output for LINE API     | Azure OpenAI Chat Model          | Line Push Message               | This is to reformat text to be able to send in Line Push API properly.                         |
| Line Push Message                | HTTP Request                     | Sends message via LINE Push API    | Reformat Output from Chat Model  | None                           | Send push message via LINE.                                                                     |
| Sticky Note                     | Sticky Note                      | Explanation for Trigger block      | None                             | None                           | We schedule the trigger at 9.00 pm before going to bed. This flow is to reflect what is the great thing that happened today. |
| Sticky Note1                    | Sticky Note                      | Explanation for AI message generation | None                             | None                           | After getting the same reminder, we tend to ignore it. This is to generate variations of reminder by setting the temperature of the model at 0.9 |
| Sticky Note2                    | Sticky Note                      | Explanation for message formatting | None                             | None                           | This is to reformat text to be able to send in Line Push API properly.                         |
| Sticky Note3                    | Sticky Note                      | Explanation for push notification  | None                             | None                           | Send push message via LINE.                                                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Schedule Trigger Node**  
   - Type: Schedule Trigger  
   - Name: "Trigger 2100 Bear Gratitude Jar Notice"  
   - Set to trigger daily at 21:00 (9:00 PM) in your desired timezone (Asia/Bangkok recommended).  
   - No credentials required.

2. **Create Langchain Chain LLM Node**  
   - Type: Langchain Chain LLM  
   - Name: "WriteReminder"  
   - Configure prompt text as:  
     ```
     Today is a wonderful day! 🌟 What or who brought a smile to your face today? 😊
     ```  
   - Add a message value:  
     ```
     You'll rewrite this message to send reminder to user to record good thing today.
     ```  
   - Set prompt type to "define".  
   - Connect input from the Schedule Trigger node.

3. **Create Langchain Azure OpenAI Chat Model Node**  
   - Type: Langchain Azure OpenAI Chat Model  
   - Name: "Azure OpenAI Chat Model"  
   - Model: Use model identifier "4o" or your preferred Azure OpenAI chat model.  
   - Set temperature to 0.9 to enable creative variation.  
   - Configure credentials with your Azure OpenAI API key and endpoint.  
   - Connect input from "WriteReminder" node.

4. **Create Set Node for Message Formatting**  
   - Type: Set  
   - Name: "Reformat Output from Chat Model"  
   - Add a string field named `posestoday`.  
   - Use the following expression to clean and format the AI text output:  
     ```
     {{$json.text.replaceAll("\n","\\n").replaceAll("\n","").removeMarkdown().removeTags().replaceAll('"',"")}}
     ```  
   - Connect input from "Azure OpenAI Chat Model" node.

5. **Create HTTP Request Node for LINE Push API**  
   - Type: HTTP Request  
   - Name: "Line Push Message"  
   - Set method to POST.  
   - URL: `https://api.line.me/v2/bot/message/push`  
   - Body type: JSON  
   - Body content:  
     ```json
     {
       "to": "YOUR ID HERE",
       "messages": [
         {
           "type": "text",
           "text": "{{ $json.posestoday }}"
         }
       ]
     }
     ```  
   - Enable "Send Body" and specify body as JSON.  
   - Authentication: HTTP Header Auth using LINE channel access token credentials.  
   - Connect input from "Reformat Output from Chat Model" node.

6. **Connect Nodes Sequentially:**  
   - Schedule Trigger → WriteReminder → Azure OpenAI Chat Model → Reformat Output from Chat Model → Line Push Message.

7. **Credentials Setup:**  
   - Configure Azure OpenAI API credentials with your Azure subscription key and endpoint.  
   - Configure LINE credentials with your LINE Messaging API channel access token using HTTP Header Auth.

8. **Test the Workflow:**  
   - Manually trigger or wait for scheduled time to verify message generation and delivery.  
   - Replace `"YOUR ID HERE"` in the HTTP Request node with the actual LINE user ID or group ID.

---

### 5. General Notes & Resources

| Note Content                                                                                          | Context or Link                                                                                  |
|-----------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| This workflow promotes mental wellness by encouraging daily gratitude reflection via AI-generated messages. | Workflow purpose and benefits summary.                                                         |
| Azure OpenAI model temperature set to 0.9 to ensure message variety and avoid repetition.            | AI creativity setting explanation.                                                             |
| LINE Push API requires proper message formatting and authentication via channel access token.       | LINE Developers Console documentation: https://developers.line.biz/en/docs/messaging-api/overview/ |
| Replace `"YOUR ID HERE"` in the LINE Push Message node with the actual recipient LINE user ID.       | Critical for message delivery correctness.                                                     |
| Timezone is set to Asia/Bangkok; adjust if deploying in other regions.                               | Workflow settings timezone configuration.                                                      |

---

This document provides a detailed, structured reference for understanding, reproducing, and customizing the "AI-Powered Gratitude Reminder Workflow for LINE," facilitating both human developers and AI agents in effective workflow management.