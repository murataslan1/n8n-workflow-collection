AI-Powered Body Measurement & Clothing Size Estimator from Image with Fal.ai

https://n8nworkflows.xyz/workflows/ai-powered-body-measurement---clothing-size-estimator-from-image-with-fal-ai-10863


# AI-Powered Body Measurement & Clothing Size Estimator from Image with Fal.ai

### 1. Workflow Overview

This workflow, titled *AI-Powered Body Measurement & Clothing Size Estimator from Image with Fal.ai*, automates estimating a person's body measurements and clothing size from an image URL submitted via a public form. It integrates with the fal.ai AI service to process the image asynchronously, polls for completion, retrieves the results, formats them into an email, and sends it to a specified recipient. The workflow is designed for fashion retailers, e-commerce platforms, or tailoring services aiming to provide personalized size recommendations based on customer images.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Handles public form submission and initial request dispatch.
- **1.2 AI Processing & Polling:** Sends the image to the fal.ai API, waits, and polls the request status until completion.
- **1.3 Result Retrieval & Presentation:** Fetches the completed results and displays them to the user.
- **1.4 AI Email Generation & Notification:** Uses an AI agent to generate a personalized HTML email and sends it via Gmail.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

**Overview:**  
This block captures the image URL submitted by the user through a public-facing form and initiates the image processing request to the fal.ai API.

**Nodes Involved:**  
- On form submission  
- Send image to estimator

**Node Details:**

- **On form submission**  
  - *Type:* Form Trigger  
  - *Role:* Entry point to receive the image URL from a user via a public web form titled “Fashion Size Estimator”.  
  - *Config:* Single required field labeled “Image” for the image URL. No attribution appended.  
  - *Inputs:* External HTTP webhook trigger.  
  - *Outputs:* Passes JSON containing the submitted image URL to the next node.  
  - *Failure:* Invalid or missing URL could cause failures downstream. Form validation mitigates missing input.  

- **Send image to estimator**  
  - *Type:* HTTP Request  
  - *Role:* Sends a POST request to fal.ai’s fashion size estimator endpoint with the image URL as JSON payload.  
  - *Config:*  
    - Method: POST  
    - URL: `https://queue.fal.run/easel-ai/fashion-size-estimator`  
    - Headers: `Content-Type: application/json`  
    - Authentication: HTTP Header Auth with `Authorization: Key YOURAPIKEY` (Fal.run API key)  
    - Body: JSON with `"image": "submitted URL"`  
  - *Inputs:* Receives form data with image URL.  
  - *Outputs:* Returns a `request_id` indicating queued processing.  
  - *Failures:* HTTP errors, auth failures, invalid API key, malformed request, or network issues.  
  - *Sticky Note:* “Send the image url to Fashion size estimator model”  

---

#### 1.2 AI Processing & Polling

**Overview:**  
This block manages the asynchronous nature of the AI processing by periodically checking the request status until the job is completed.

**Nodes Involved:**  
- Wait 10 sec.  
- Get status  
- Completed? (IF node)

**Node Details:**

- **Wait 10 sec.**  
  - *Type:* Wait  
  - *Role:* Pauses the workflow for 10 seconds between status checks to avoid excessive polling.  
  - *Config:* Fixed 10-second wait time.  
  - *Inputs:* Receives the `request_id` from the previous HTTP request.  
  - *Outputs:* Passes data to the next node after delay.  
  - *Failures:* Minimal risk, but long execution time could cause timeouts if workflow settings are restrictive.  

- **Get status**  
  - *Type:* HTTP Request  
  - *Role:* Queries fal.ai API for the current processing status of the request using the `request_id`.  
  - *Config:*  
    - Method: GET  
    - URL: `https://queue.fal.run/easel-ai/fashion-size-estimator/requests/{{request_id}}/status`  
    - Authentication: Same HTTP Header Auth credential as before.  
  - *Inputs:* Receives `request_id`.  
  - *Outputs:* JSON with `status` field (e.g., "COMPLETED", "PROCESSING").  
  - *Failures:* Auth errors, API downtime, or invalid `request_id`.  

- **Completed?**  
  - *Type:* IF  
  - *Role:* Checks if API status response equals “COMPLETED”.  
  - *Config:* Condition: `$json.status == "COMPLETED"` (case sensitive, strict type validation).  
  - *Inputs:* Status JSON from Get status node.  
  - *Outputs:*  
    - *True:* Proceed to fetch results.  
    - *False:* Loop back to wait and poll again.  
  - *Failures:* Expression evaluation errors if status field missing or malformed.  

- *Sticky Note:* “Is the result ready?”  

---

#### 1.3 Result Retrieval & Presentation

**Overview:**  
Once the processing is complete, this block fetches the detailed result including size and measurements, displays it on a thank-you page, and prepares data for email generation.

**Nodes Involved:**  
- Get result  
- Form  
- Respond to Webhook

**Node Details:**

- **Get result**  
  - *Type:* HTTP Request  
  - *Role:* Retrieves the finalized measurement and size data using the `request_id`.  
  - *Config:*  
    - Method: GET  
    - URL: `https://queue.fal.run/easel-ai/fashion-size-estimator/requests/{{request_id}}`  
    - Authentication: Same Fal.run HTTP Header Auth.  
  - *Inputs:* `request_id` from Completed? node.  
  - *Outputs:* JSON containing `size`, `height`, `bust`, `waist`, `hip`.  
  - *Failures:* Auth errors, API errors, invalid `request_id`.  

- **Form**  
  - *Type:* Form Completion  
  - *Role:* Returns a thank-you page to the user displaying the measurement results formatted as text.  
  - *Config:* Completion message template with placeholders for size and measurements.  
  - *Inputs:* Result JSON from Get result node.  
  - *Outputs:* Sends HTTP response to user.  
  - *Failures:* Missing data could cause rendering issues.  

- **Respond to Webhook**  
  - *Type:* Respond to Webhook  
  - *Role:* Sends the workflow’s final HTTP response back to the triggering client.  
  - *Inputs:* Result data from Get result node (and Form node).  
  - *Outputs:* HTTP response sent.  
  - *Failures:* Connection errors or webhook timeout.  

- *Sticky Note:* “STEP 2: Get result and send to thank you page, email or webhook”  

---

#### 1.4 AI Email Generation & Notification

**Overview:**  
This block uses Langchain’s AI agent with OpenAI GPT-4 to generate a personalized HTML email based on the measurement results and sends it to a configured email address via Gmail.

**Nodes Involved:**  
- AI Agent  
- OpenAI Chat Model  
- Structured Output Parser  
- Send a message

**Node Details:**

- **AI Agent**  
  - *Type:* Langchain Agent (AI language model orchestrator)  
  - *Role:* Receives measurement variables and a prompt template; orchestrates AI model call and output parsing.  
  - *Config:*  
    - Text input constructs a prompt embedding the size and measurements.  
    - Uses structured output parser to define expected JSON structure `{ "email_text": "string" }`.  
  - *Inputs:* Measurement JSON from Get result.  
  - *Outputs:* Structured JSON containing generated HTML email text.  
  - *Failures:* AI model API rate limits, prompt errors, parsing errors.  
  - *Sub-workflow:* Integrates with OpenAI Chat Model and Structured Output Parser nodes.  

- **OpenAI Chat Model**  
  - *Type:* Langchain OpenAI GPT-4 Chat Model  
  - *Role:* Provides the underlying AI model for generating text based on prompt.  
  - *Config:* Model set to `gpt-4.1-mini`.  
  - *Inputs:* Prompt from AI Agent.  
  - *Outputs:* AI-generated response text.  
  - *Failures:* API key issues, network problems, model limits.  

- **Structured Output Parser**  
  - *Type:* Langchain Output Parser  
  - *Role:* Parses AI output into structured JSON for workflow use.  
  - *Config:* Schema expects an object with a single string property `email_text`.  
  - *Inputs:* Raw AI text output.  
  - *Outputs:* Parsed JSON for AI Agent.  
  - *Failures:* Parsing errors if AI response does not conform to schema.  

- **Send a message**  
  - *Type:* Gmail node  
  - *Role:* Sends the generated HTML email to a configured recipient email address.  
  - *Config:*  
    - Recipient email hardcoded as `YOUR_EMAIL`.  
    - Subject: “Size estimator”  
    - Message body: Uses `email_text` from AI Agent output.  
    - Authentication: Gmail OAuth2 credentials.  
  - *Inputs:* JSON with `email_text` from AI Agent.  
  - *Outputs:* Confirmation of email sent.  
  - *Failures:* SMTP/auth errors, invalid recipient, quota limits.  

- *Sticky Note:* “STEP 3: Create an email and send the result”  

---

### 3. Summary Table

| Node Name               | Node Type                       | Functional Role                                              | Input Node(s)          | Output Node(s)          | Sticky Note                                                                                       |
|-------------------------|--------------------------------|--------------------------------------------------------------|------------------------|-------------------------|-------------------------------------------------------------------------------------------------|
| On form submission      | Form Trigger                   | Captures image URL input from user via public form           | External webhook       | Send image to estimator  |                                                                                                 |
| Send image to estimator | HTTP Request                   | Sends image URL to fal.ai API to initiate size estimation    | On form submission      | Wait 10 sec.             | Send the image url to Fashion size estimator model                                              |
| Wait 10 sec.            | Wait                           | Delays 10 seconds between status polls                       | Send image to estimator | Get status               |                                                                                                 |
| Get status              | HTTP Request                   | Checks status of AI processing job                            | Wait 10 sec.            | Completed?               |                                                                                                 |
| Completed?              | IF                             | Checks if AI processing is completed                          | Get status              | Get result (Yes), Wait 10 sec. (No) | Is the result ready?                                                                            |
| Get result              | HTTP Request                   | Retrieves completed measurement results                       | Completed?              | Form, Respond to Webhook, AI Agent | STEP 2 Get result and send to thank you page, email or webhook                                 |
| Form                    | Form Completion                | Displays result summary page to user                          | Get result              |                         |                                                                                                 |
| Respond to Webhook      | Respond to Webhook             | Sends HTTP response back to client                            | Get result              |                         |                                                                                                 |
| AI Agent                | Langchain Agent                | Generates personalized HTML email from measurement data      | Get result, OpenAI Chat Model, Structured Output Parser | Send a message            | STEP 3 Create an email and send the result                                                     |
| OpenAI Chat Model       | Langchain OpenAI Chat Model    | Provides GPT-4 AI model for text generation                   | AI Agent                | AI Agent                 |                                                                                                 |
| Structured Output Parser| Langchain Output Parser        | Parses AI model output into structured JSON                   | OpenAI Chat Model       | AI Agent                 |                                                                                                 |
| Send a message          | Gmail                         | Sends generated email to configured recipient                | AI Agent                |                         |                                                                                                 |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Form Trigger Node ("On form submission")**  
   - Type: Form Trigger  
   - Webhook path auto-generated, set form title to "Fashion Size Estimator"  
   - Add one required text field labeled "Image" for the image URL input.  

2. **Create HTTP Request Node ("Send image to estimator")**  
   - Method: POST  
   - URL: `https://queue.fal.run/easel-ai/fashion-size-estimator`  
   - Headers: Add header `Content-Type: application/json`  
   - Body type: JSON  
   - Body content: `{ "image": "={{$json.Image}}" }` (use expression to insert image URL)  
   - Authentication: Use HTTP Header Auth credentials (create a credential named "Fal.run API") with header name `Authorization` and value `Key YOURAPIKEY` (replace YOURAPIKEY with your actual API key from fal.ai).  
   - Connect: Output of "On form submission" → Input.  

3. **Create Wait Node ("Wait 10 sec.")**  
   - Set to wait 10 seconds.  
   - Connect output of "Send image to estimator" → Input.  

4. **Create HTTP Request Node ("Get status")**  
   - Method: GET  
   - URL: `https://queue.fal.run/easel-ai/fashion-size-estimator/requests/{{ $json.request_id }}/status` (use expression)  
   - Authentication: Same "Fal.run API" HTTP Header Auth.  
   - Connect output of "Wait 10 sec." → Input.  

5. **Create IF Node ("Completed?")**  
   - Condition: `$json.status` equals string `"COMPLETED"` (case sensitive)  
   - Connect output of "Get status" → Input.  
   - On True (COMPLETED): connect to "Get result" node (to be created).  
   - On False: loop back to "Wait 10 sec." node to poll again.  

6. **Create HTTP Request Node ("Get result")**  
   - Method: GET  
   - URL: `https://queue.fal.run/easel-ai/fashion-size-estimator/requests/{{ $json.request_id }}`  
   - Authentication: Same "Fal.run API" HTTP Header Auth.  
   - Connect True output of "Completed?" → Input.  

7. **Create Form Completion Node ("Form")**  
   - Operation: Completion  
   - Completion Title: "Fashion size estimator"  
   - Completion Message:  
     ```
     The result is:

     Size: {{ $json.size }}
     Height: {{ $json.height }}
     Bust: {{ $json.bust }}
     Waist: {{ $json.waist }}
     Hip: {{ $json.hip }}
     ```  
   - Connect output of "Get result" → Input.  

8. **Create Respond to Webhook Node ("Respond to Webhook")**  
   - Connect output of "Get result" → Input. This sends the final HTTP response to the original requestor.  

9. **Create Langchain AI Agent Node ("AI Agent")**  
   - Set prompt type to "define" with a prompt text embedding the measurement inputs (size, height, bust, waist, hip) requesting generation of an HTML email.  
   - Connect output of "Get result" → Input.  

10. **Create OpenAI Chat Model Node ("OpenAI Chat Model")**  
    - Model: `gpt-4.1-mini`  
    - Connect AI Agent’s AI language model input → Output of this node.  
    - Provide OpenAI API credentials (OpenAI API key).  

11. **Create Structured Output Parser Node ("Structured Output Parser")**  
    - Schema Type: Manual  
    - Input Schema:  
      ```json
      {
        "type": "object",
        "properties": {
          "email_text": {
            "type": "string"
          }
        }
      }
      ```  
    - Connect OpenAI Chat Model’s output → Input.  
    - Connect output → AI Agent’s AI output parser input.  

12. **Create Gmail Node ("Send a message")**  
    - Recipient: Set your target email address in the "Send To" field (e.g., YOUR_EMAIL)  
    - Subject: "Size estimator"  
    - Message: Use expression `{{$json.email_text}}` to insert generated HTML email content.  
    - Connect output of "AI Agent" → Input.  
    - Set Gmail OAuth2 credentials for sending email.  

13. **Connect all nodes as per the logical flow:**  
    - Webhook or Form Trigger → Send image to estimator → Wait 10 sec. → Get status → Completed? (False: loop back to Wait)  
    - Completed? (True) → Get result → Form & Respond to Webhook & AI Agent → OpenAI Chat Model → Structured Output Parser → AI Agent → Send a message  

14. **Credential Setup:**  
    - Create HTTP Header Auth credential named “Fal.run API” with header name `Authorization` and value `Key YOURAPIKEY`.  
    - Configure OpenAI API credentials for GPT-4.  
    - Configure Gmail OAuth2 credentials for sending email.  

---

### 5. General Notes & Resources

| Note Content                                                                                                             | Context or Link                                      |
|--------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| To obtain the API key for fal.ai, create an account at https://fal.ai/ and generate your personal API key.               | Setup instructions in Sticky Note6                   |
| The workflow uses asynchronous polling to handle potentially long AI processing times, with a fixed 10-second wait delay.| Design note for the polling mechanism                 |
| The AI-generated email is created using Langchain integration with OpenAI GPT-4, ensuring personalized and formatted output. | Advanced AI integration                               |
| For Gmail node, OAuth2 credentials must be configured in n8n to enable sending emails securely.                           | Gmail OAuth2 setup                                    |
| Fal.ai API endpoints used:                                                                                               | API documentation: https://fal.ai/docs (implied)    |
| - POST /easel-ai/fashion-size-estimator to submit image                                                                   |                                                     |
| - GET /easel-ai/fashion-size-estimator/requests/{request_id}/status to poll job status                                    |                                                     |
| - GET /easel-ai/fashion-size-estimator/requests/{request_id} to fetch results                                             |                                                     |

---

*Disclaimer: This documentation is based exclusively on an n8n workflow designed for integration with the fal.ai API. All data and services used comply with legal and policy guidelines.*