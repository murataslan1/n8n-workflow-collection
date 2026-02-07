AI-Powered One-Click Virtual Fitting Room for WooCommerce, Shopify, Prestashop

https://n8nworkflows.xyz/workflows/ai-powered-one-click-virtual-fitting-room-for-woocommerce--shopify--prestashop-5200


# AI-Powered One-Click Virtual Fitting Room for WooCommerce, Shopify, Prestashop

### 1. Workflow Overview

This workflow enables an AI-powered virtual fitting room feature for eCommerce platforms such as WooCommerce, Shopify, and Prestashop. Visitors upload their own photo and virtually "try on" a selected garment image from the product catalog, enhancing user engagement and potentially reducing returns.

The workflow is divided into the following logical blocks:

- **1.1 Input Reception:** Captures user input from a custom form including user photo and selected product image URL.
- **1.2 Image Upload:** Uploads the user photo to a remote FTP server to make it accessible via URL.
- **1.3 AI Virtual Try-On Request:** Sends the URLs of the uploaded user photo and product image to an AI API that generates the virtual try-on image.
- **1.4 Processing Status Polling:** Repeatedly checks the AI API for completion status of the image processing.
- **1.5 Result Retrieval and Delivery:** Once processing is complete, fetches the generated virtual try-on image URL and redirects the user to this image.

Supplementary sticky notes provide documentation, instructions, and visual examples embedded in the workflow.

---

### 2. Block-by-Block Analysis

#### 2.1 Input Reception

- **Overview:**  
  Receives visitor input from a web form titled "Virtual Try On" where users upload a photo of themselves and the selected product image URL is passed as a hidden field.

- **Nodes Involved:**  
  - On form submission

- **Node Details:**

  - **On form submission**  
    - Type: Form Trigger  
    - Role: Entry point capturing form data when a user submits the virtual try-on form.  
    - Configuration:  
      - Form title: "Virtual Try On"  
      - Fields:  
        - "Nome" (Name) - required text input  
        - "Product" - hidden field containing product image URL (populated dynamically in production)  
        - "Me" - required file upload for user photo; accepts `.jpg` or `.png`  
      - No attribution appended  
    - Key Expressions: Accesses uploaded file information as `$json.Me[0].filename` and product image URL as `$json.Product`  
    - Input: HTTP POST from web form  
    - Output: Passes form data to FTP upload node  
    - Edge Cases: Missing required fields, unsupported file types, form submission errors  

#### 2.2 Image Upload

- **Overview:**  
  Uploads the user’s uploaded photo file to a designated FTP server to generate a publicly accessible URL.

- **Nodes Involved:**  
  - FTP

- **Node Details:**

  - **FTP**  
    - Type: FTP Upload  
    - Role: Transfers the uploaded user image from the form to a remote FTP server for later AI processing.  
    - Configuration:  
      - Operation: Upload  
      - Remote path dynamically generated based on current timestamp and original filename pattern: `=/eolianpenthouse.dev.eureweb.it/test/{{$now.format('yyyyyyLLddHHii')}}-{{ $json.Me[0].filename }}`  
      - Binary property to upload: `Me` (file from form)  
    - Credentials: Uses stored FTP credentials named "FTP account (Eolian DEV)"  
    - Input: Receives binary file data from form submission node  
    - Output: Passes control to "Create Image" HTTP request node  
    - Edge Cases: FTP connection failure, permission denied, file upload errors, filename conflicts  

#### 2.3 AI Virtual Try-On Request

- **Overview:**  
  Sends a POST request to the Fal.ai API with the URLs of the uploaded user photo and the product image to initiate virtual try-on processing.

- **Nodes Involved:**  
  - Create Image

- **Node Details:**

  - **Create Image**  
    - Type: HTTP Request (POST)  
    - Role: Calls the AI service endpoint to generate a virtual try-on image.  
    - Configuration:  
      - URL: `https://queue.fal.run/fal-ai/kling/v1-5/kolors-virtual-try-on`  
      - Method: POST  
      - Headers: Content-Type: application/json, Authorization header with API Key via generic HTTP header auth credential "Fal.run API"  
      - Body (JSON):  
        ```json
        {
          "human_image_url": "https://eolianpenthouse.dev.eureweb.it/test/{{$now.format('yyyyyyLLddHHii')}}-{{ $json.Me[0].filename }}",
          "garment_image_url": "{{ $('On form submission').item.json.Product }}"
        }
        ```  
      - Sends body and headers  
    - Input: Receives confirmation from FTP node that image is uploaded  
    - Output: Passes control to "Wait 10 sec." node for polling delay  
    - Edge Cases: API key invalid, network errors, malformed request, missing URLs  

#### 2.4 Processing Status Polling

- **Overview:**  
  Implements a polling loop to check when the AI virtual try-on image generation is completed.

- **Nodes Involved:**  
  - Wait 10 sec.  
  - Get status  
  - Completed?  
  - Get Url image  
  - Get image  
  - Form

- **Node Details:**

  - **Wait 10 sec.**  
    - Type: Wait  
    - Role: Introduces a 10-second delay between status checks to prevent API flooding.  
    - Configuration: Wait time set to 10 seconds  
    - Input: Comes after "Create Image" node  
    - Output: Triggers "Get status" node  
    - Edge Cases: Timeout or excessive delays  

  - **Get status**  
    - Type: HTTP Request (GET)  
    - Role: Queries the AI API for the current processing status of the virtual try-on request.  
    - Configuration:  
      - URL Template: `https://queue.fal.run/fal-ai/kling/requests/{{ $('Create Image').item.json.request_id }}/status`  
      - Auth: Generic HTTP header auth with "Fal.run API" credentials  
    - Input: Triggered after wait node  
    - Output: Passes JSON status to "Completed?" node  
    - Edge Cases: API errors, invalid request_id, network issues  

  - **Completed?**  
    - Type: If  
    - Role: Checks if the AI processing status equals "COMPLETED"  
    - Configuration:  
      - Condition: `$json.status === "COMPLETED"`  
    - Input: Receives status JSON from "Get status"  
    - Output:  
      - True branch: calls "Get Url image" node  
      - False branch: loops back to "Wait 10 sec." node for another polling cycle  
    - Edge Cases: Unexpected or unknown statuses, infinite polling loops  

  - **Get Url image**  
    - Type: HTTP Request (GET)  
    - Role: Retrieves the final virtual try-on image URL from the AI API using request_id.  
    - Configuration:  
      - URL: `https://queue.fal.run/fal-ai/kling/requests/{{ $json.request_id }}`  
      - Auth: Generic HTTP header auth with "Fal.run API" credentials  
    - Input: Triggered on completion from "Completed?" node  
    - Output: Passes image URL JSON to "Get image" node  
    - Edge Cases: Missing or invalid request_id, API errors  

  - **Get image**  
    - Type: HTTP Request (GET)  
    - Role: Downloads or fetches the generated virtual try-on image from the retrieved URL.  
    - Configuration:  
      - URL: `{{ $json.image.url }}` (dynamic from previous node's output)  
    - Input: Receives image URL from "Get Url image" node  
    - Output: Passes to "Form" node for user redirection  
    - Edge Cases: Broken image URL, network failures  

  - **Form**  
    - Type: Form Completion Response  
    - Role: Redirects the user to the generated virtual try-on image URL for viewing.  
    - Configuration:  
      - Operation: Completion  
      - Redirect URL: `{{ $json.image.url }}` (dynamic)  
      - Responds with a redirect HTTP response  
    - Input: Receives image data from "Get image" node  
    - Output: Ends workflow response  
    - Edge Cases: Invalid URL or redirect failures  

#### 2.5 Documentation and Instructions (Sticky Notes)

- **Overview:**  
  Sticky notes provide inline documentation, visual examples of input/output images, usage instructions, and integration tips.

- **Nodes Involved:**  
  - Sticky Note  
  - Sticky Note1  
  - Sticky Note2  
  - Sticky Note3  
  - Sticky Note5  
  - Sticky Note6  
  - Sticky Note7

- **Key Content Highlights:**  
  - Visual examples of user photo, product image, and result images.  
  - Step-by-step instructions for API key acquisition, FTP setup, and eCommerce integration.  
  - Advice on how to create “Try On” buttons linking to the form with dynamic product URLs.  
  - External links:  
    - Fal.ai for API key signup: https://fal.ai/  
    - Example images hosted on https://n3wstorage.b-cdn.net/n3witalia/  

---

### 3. Summary Table

| Node Name         | Node Type                | Functional Role                  | Input Node(s)           | Output Node(s)            | Sticky Note                                                                                     |
|-------------------|--------------------------|--------------------------------|------------------------|---------------------------|------------------------------------------------------------------------------------------------|
| On form submission | Form Trigger             | Capture form data               | —                      | FTP                       |                                                                                                |
| FTP               | FTP                      | Upload user photo to FTP        | On form submission     | Create Image              |                                                                                                |
| Create Image      | HTTP Request             | Call AI API to create try-on   | FTP                    | Wait 10 sec.              | See Sticky Note6 for API key setup instructions                                                |
| Wait 10 sec.      | Wait                     | Delay between status checks    | Create Image            | Get status                |                                                                                                |
| Get status        | HTTP Request             | Check processing status        | Wait 10 sec.            | Completed?                |                                                                                                |
| Completed?        | If                       | Branch based on completion     | Get status              | Get Url image / Wait 10 sec.|                                                                                                |
| Get Url image     | HTTP Request             | Retrieve final image URL       | Completed?              | Get image                 |                                                                                                |
| Get image         | HTTP Request             | Download virtual try-on image  | Get Url image           | Form                      |                                                                                                |
| Form              | Form                     | Redirect user to result image  | Get image               | —                         |                                                                                                |
| Sticky Note       | Sticky Note              | Visual example: user photo     | —                      | —                         | ![User photo](https://n3wstorage.b-cdn.net/n3witalia/model.jpg)                                 |
| Sticky Note1      | Sticky Note              | Visual example: product image  | —                      | —                         | ![Product image](https://n3wstorage.b-cdn.net/n3witalia/tshirt.jpg)                             |
| Sticky Note2      | Sticky Note              | Visual example: result image   | —                      | —                         | ![Result image](https://n3wstorage.b-cdn.net/n3witalia/result.png)                              |
| Sticky Note3      | Sticky Note              | Workflow functionality summary | —                      | —                         | Explains overall virtual try-on functionality and eCommerce applicability                       |
| Sticky Note5      | Sticky Note              | eCommerce integration tips     | —                      | —                         | Instructions for dynamic product URL and "Try On" button setup                                 |
| Sticky Note6      | Sticky Note              | API key setup instructions     | —                      | —                         | Link to https://fal.ai/                                                                        |
| Sticky Note7      | Sticky Note              | FTP setup instructions         | —                      | —                         | Advises on FTP or S3 bucket for temporary image upload                                        |

---

### 4. Reproducing the Workflow from Scratch

1. **Create a Form Trigger node named "On form submission":**  
   - Set form title to "Virtual Try On".  
   - Add three form fields:  
     - "Nome" (required text),  
     - "Product" (hidden field for product image URL),  
     - "Me" (required file upload, accept `.jpg`, `.png`).  
   - No attribution appended.  
   - This node triggers on form submission.

2. **Add an FTP node named "FTP":**  
   - Set operation to "Upload".  
   - Set remote path to: `=/eolianpenthouse.dev.eureweb.it/test/{{$now.format('yyyyyyLLddHHii')}}-{{ $json.Me[0].filename }}`.  
   - Set binary property name to `Me` (to upload the file from form).  
   - Configure FTP credentials with your FTP server details.

3. **Add an HTTP Request node named "Create Image":**  
   - Set method to POST.  
   - URL: `https://queue.fal.run/fal-ai/kling/v1-5/kolors-virtual-try-on`.  
   - Set header "Content-Type" to "application/json".  
   - Use authentication type: Generic HTTP Header Auth with your Fal.ai API key credential (Authorization: "Key YOURAPIKEY").  
   - Set JSON body to:  
     ```json
     {
       "human_image_url": "https://eolianpenthouse.dev.eureweb.it/test/{{$now.format('yyyyyyLLddHHii')}}-{{ $json.Me[0].filename }}",
       "garment_image_url": "{{ $('On form submission').item.json.Product }}"
     }
     ```  
   - Connect FTP node output to this node.

4. **Add a Wait node named "Wait 10 sec.":**  
   - Set wait time to 10 seconds.  
   - Connect "Create Image" node output here.

5. **Add an HTTP Request node named "Get status":**  
   - Set method to GET.  
   - URL: `https://queue.fal.run/fal-ai/kling/requests/{{ $('Create Image').item.json.request_id }}/status`.  
   - Use same Fal.ai API key credentials as above.  
   - Connect "Wait 10 sec." output here.

6. **Add an If node named "Completed?":**  
   - Condition: Check if `$json.status` equals "COMPLETED" (strict, case-sensitive).  
   - Connect "Get status" output here.

7. **From "Completed?" node:**  
   - True branch: Add HTTP Request node "Get Url image":  
     - Method GET.  
     - URL: `https://queue.fal.run/fal-ai/kling/requests/{{ $json.request_id }}`.  
     - Use Fal.ai API key credentials.  
   - Connect output to "Get image" node.

   - False branch: Loop back to "Wait 10 sec." node to repeat polling.

8. **Add HTTP Request node named "Get image":**  
   - Method GET.  
   - URL: `{{ $json.image.url }}` (from previous node).  
   - Connect "Get Url image" output here.

9. **Add Form node named "Form":**  
   - Operation: Completion.  
   - Redirect URL: `={{ $json.image.url }}`.  
   - Respond with: Redirect.  
   - Connect "Get image" output here.

10. **Add Sticky Notes with relevant instructions:**  
    - API key acquisition and header setup (Sticky Note6).  
    - FTP or S3 upload instructions (Sticky Note7).  
    - eCommerce integration tips for "Try On" button and dynamic product URL usage (Sticky Note5).  
    - Visual examples of input and output images (Sticky Note, Sticky Note1, Sticky Note2).  
    - Overall workflow functionality description (Sticky Note3).

11. **Credentials Setup:**  
    - Configure FTP credentials with your FTP server details.  
    - Configure HTTP Header Auth credential with your Fal.ai API key for all HTTP request nodes interacting with the API.

12. **Testing:**  
    - Test form submission with valid image and product URL.  
    - Validate FTP upload success.  
    - Ensure API call returns `request_id`.  
    - Verify polling loop correctly detects completion.  
    - Confirm user is redirected to the final virtual try-on image URL.

---

### 5. General Notes & Resources

| Note Content                                                                                                                        | Context or Link                           |
|------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------|
| Create an account at [Fal.ai](https://fal.ai/) to obtain your API key required for the AI virtual try-on service.                 | API key setup instruction (Sticky Note6)|
| On eCommerce platforms, implement a "Try On" button that opens the n8n form URL with the product image URL as a query parameter.   | Integration tip (Sticky Note5)            |
| Temporary file storage can be done via FTP or alternatively an S3 bucket for scalability and reliability.                          | FTP setup note (Sticky Note7)             |
| Visual examples of user photo, garment image, and resulting virtual try-on image are provided as references in sticky notes.       | Visual aids (Sticky Note, Sticky Note1, Sticky Note2) |
| This workflow is designed to be low-code and easily adaptable to multiple eCommerce platforms to enhance customer experience.     | Workflow summary (Sticky Note3)           |

---

**Disclaimer:**  
The text provided derives exclusively from an automated workflow created with n8n, a workflow automation tool. This processing strictly complies with current content policies and contains no illegal, offensive, or protected elements. All data handled is legal and publicly accessible.