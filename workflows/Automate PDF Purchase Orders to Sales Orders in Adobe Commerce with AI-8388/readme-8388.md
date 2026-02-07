Automate PDF Purchase Orders to Sales Orders in Adobe Commerce with AI

https://n8nworkflows.xyz/workflows/automate-pdf-purchase-orders-to-sales-orders-in-adobe-commerce-with-ai-8388


# Automate PDF Purchase Orders to Sales Orders in Adobe Commerce with AI

### 1. Workflow Overview

This workflow automates the processing of PDF purchase orders received via email into fully created sales orders in Adobe Commerce (Magento 2) using Company Credit as the payment method. It is designed primarily for B2B companies that receive structured purchase orders by email and want to streamline order entry, validation, and fulfillment in Adobe Commerce.

The workflow is logically divided into the following blocks:

- **1.1 Trigger & Input Reception**: Monitors an Outlook mailbox for incoming emails, downloads PDF attachments, and prepares raw order data.
- **1.2 AI Parsing & Data Normalization**: Sends combined email and PDF text data to an AI model (Azure OpenAI) to extract structured order details, such as emails, PO number, shipping preference, customer address, products, and extra fields.
- **1.3 Data Cleaning & Email Filtering**: Cleans product article numbers (e.g., removing unwanted prefixes) and filters out email addresses that are irrelevant or internal.
- **1.4 Customer Validation**: Searches Adobe Commerce for the customer by email, verifies the existence of a valid default shipping address, and checks company credit eligibility.
- **1.5 Cart Creation & Product Management**: Creates a new shopping cart (quote) for the customer, cleans any existing cart items, adds parsed products, and validates SKUs including configurable product checks.
- **1.6 Shipping & Billing Setup**: Sets billing and shipping addresses in the cart, estimates available shipping methods, and applies either standard or express shipping based on order data.
- **1.7 Order Finalization**: Sets the PO number in Adobe Commerce, adds internal order comments, validates payment methods, places the order using Company Credit, and moves the processed email to a designated folder.
- **1.8 Error Handling & Feedback**: Provides structured feedback messages, catches errors gracefully, and handles fallback logging for issues like missing data or invalid customers.

---

### 2. Block-by-Block Analysis

#### 1.1 Trigger & Input Reception

**Overview:**  
This block listens for new emails in a specific Outlook mailbox folder, downloads any PDF attachments, and extracts the email body text. It prepares the raw data for later AI parsing.

**Nodes Involved:**  
- Microsoft Outlook Trigger  
- set Text  
- Email combine  
- Code  
- Extract from File2 (disabled alternative)  

**Node Details:**  

- **Microsoft Outlook Trigger**  
  - Type: Trigger node for Microsoft Outlook  
  - Configuration: Watches a specific folder for new emails, downloads attachments automatically, polling every minute  
  - Inputs: Outlook mailbox folder events  
  - Outputs: Raw email data with attachments  
  - Potential failures: Authentication errors, connectivity issues, empty emails  

- **set Text**  
  - Type: Set node  
  - Configuration: Extracts and assigns the email body content to a field `text`  
  - Input: Microsoft Outlook Trigger output  
  - Output: Adds textual content to JSON for AI parsing  

- **Email combine**  
  - Type: No Operation (noOp) node  
  - Role: Placeholder to combine email and PDF extracted text (logically groups data)  

- **Code**  
  - Type: Code node (JavaScript)  
  - Configuration: Extracts PDF attachments from incoming data, filters for PDFs by mime type, creates a new data item with binary PDF data under “attachment”  
  - Input: Email with attachments  
  - Output: Cleaned binary PDF data ready for parsing  
  - Edge cases: Non-PDF attachments ignored, missing attachments  

- **Extract from File2** (disabled)  
  - Type: Extract from File (PDF extraction)  
  - Disabled: Yes, alternative extraction method  

---

#### 1.2 AI Parsing & Data Normalization

**Overview:**  
Combines email text and PDF content, then uses Azure OpenAI to parse essential order details into a structured JSON format. Afterwards, product article numbers are cleaned, and email addresses are filtered for relevance.

**Nodes Involved:**  
- set Information  
- AI Agent (LangChain agent node)  
- set OpenAI  
- filter Emailadresses  
- remove SCH  
- Switch  
- Vorgangsnummer  

**Node Details:**  

- **set Information**  
  - Type: Set node  
  - Combines email text and extracted PDF text into a single string for AI input (`info` field)  

- **AI Agent**  
  - Type: LangChain Agent node  
  - Configuration: Uses Azure OpenAI with a prompt template requesting JSON extraction of emails, PO number, express shipping flag, address details, products, and extra fields  
  - Input: Combined textual order data  
  - Output: Parsed JSON structured data (`content` field)  
  - Version: LangChain / Azure OpenAI integration required  
  - Edge cases: Parsing errors, incomplete data extraction, invalid JSON  

- **set OpenAI**  
  - Type: Set node  
  - Parses the AI Agent output JSON string into a JSON object in `content`  

- **filter Emailadresses**  
  - Type: Code node  
  - Filters out emails containing “@example.com” to remove irrelevant/internal addresses  
  - Input: `content.email` array from AI output  
  - Output: Updated `content.email` array  

- **remove SCH**  
  - Type: Code node  
  - Removes “SCH” prefix from product article numbers in the `content.products` array for normalization  

- **Switch**  
  - Type: Switch node  
  - Routes workflow based on conditions: if company is “Company 1”, or if customer email contains “@customer.com”, else routes to extra processing  
  - Used for customized handling or segmentation  

- **Vorgangsnummer**  
  - Type: Set node  
  - Copies the extra field “Vorgangsnummer” from the extracted data into `content.po_number` for consistency  

---

#### 1.3 Customer Validation

**Overview:**  
Searches Adobe Commerce for a customer matching the extracted email addresses. Validates customer existence, retrieves default shipping address, and makes sure company credit is available.

**Nodes Involved:**  
- Split Emails  
- Loop until existing customer found  
- get Customer  
- If Customer  
- set Customer  
- set Address  
- If Default Address  
- set Feedback (No customer found)  
- set Feedback Default Address  
- check Companycredit  
- If companyCredit  

**Node Details:**  

- **Split Emails**  
  - Type: splitOut node  
  - Splits the email array into individual emails for sequential processing  

- **Loop until existing customer found**  
  - Type: splitInBatches node  
  - Iterates over emails, stops when a valid customer is found  

- **get Customer**  
  - Type: HTTP Request node  
  - Queries Adobe Commerce customer search API by email and website ID 1  
  - Validates if customer exists (total_count === 1)  

- **If Customer**  
  - Type: If node  
  - Checks if exactly one customer found  

- **set Customer**  
  - Type: Set node  
  - Sets the found customer object for downstream use  

- **set Address**  
  - Type: Code node  
  - Extracts the default shipping address from the customer’s addresses array  

- **If Default Address**  
  - Type: If node  
  - Checks if default address was found (address ID exists)  

- **set Feedback**  
  - Type: Set node  
  - Sets an error message if no customer is found  

- **set Feedback Default Address**  
  - Type: Set node  
  - Sets an error message if no default address found for the customer  

- **check Companycredit**  
  - Type: Code node  
  - Checks if “companycredit” is among available payment methods  

- **If companyCredit**  
  - Type: If node  
  - Routes workflow depending on whether company credit is available or not  

- **Edge Cases:** Customer not found, no default address, no company credit payment method  

---

#### 1.4 Cart Creation & Product Management

**Overview:**  
Creates a new empty cart (quote) for the customer, removes existing cart items, adds products parsed from PDF, and validates SKU availability including configurable product handling.

**Nodes Involved:**  
- Create cart  
- set Quote Id  
- get Cart Items  
- remove From Shopping Cart  
- get Products  
- Split Out Products  
- set Clean Articlenumber  
- get Configurable  
- If configurable product found  
- Prepare sku & quote  
- Loop over products  
- If product in cart  
- Combine processed skus  
- Combine failed skus  
- set Feedback processed  
- set Feedback failed  
- Combine feedback  
- Merge  
- Merge1  
- Execute Workflow (sub-workflow: Klippa - add to cart)  
- Wait  
- No Operation nodes (noOp) for flow control  

**Node Details:**  

- **Create cart**  
  - HTTP POST to create a new cart for the customer ID  
  - Requires Magento 2 API credentials  

- **set Quote Id**  
  - Saves the created cart ID (`quote_id`) for subsequent requests  

- **get Cart Items**  
  - Retrieves existing items in the cart  

- **remove From Shopping Cart**  
  - Deletes items from the cart to start fresh  

- **get Products**  
  - Sets the parsed product array from AI output for iteration  

- **Split Out Products**  
  - Splits product array for batch processing  

- **set Clean Articlenumber**  
  - Cleans SKU strings by removing non-alphanumeric characters  

- **get Configurable**  
  - Checks if SKU corresponds to a configurable product in Adobe Commerce  

- **If configurable product found**  
  - Routes workflow depending on whether product is configurable  

- **Prepare sku & quote**  
  - Prepares SKU and quote ID for adding product to cart  

- **Loop over products**  
  - Iterates through products to add each to cart via sub-workflow  

- **If product in cart**  
  - Checks if product was successfully added (item_id exists)  

- **Combine processed skus / Combine failed skus**  
  - Aggregates feedback strings listing success or failure SKUs and prices  

- **set Feedback processed / set Feedback failed**  
  - Sets user-friendly messages summarizing product add status  

- **Combine feedback**  
  - Combines all feedback messages for final output  

- **Execute Workflow**  
  - Invokes sub-workflow “Klippa - add to cart” to add individual products  

- **Wait**  
  - Delays 2 seconds between product additions to prevent API overload  

- **Merge / Merge1**  
  - Combines multiple streams of product validation and addition results  

- **Edge Cases:** Invalid SKUs, product not found, configurable product handling, partial failures  

---

#### 1.5 Shipping & Billing Setup

**Overview:**  
Sets the billing address for the cart, estimates available shipping methods, and applies either standard or express shipping based on order data.

**Nodes Involved:**  
- set Billing Address  
- estimate Shipping Methods  
- Limit  
- If express  
- set Standard Shipping Method  
- set Express Shipping Method  

**Node Details:**  

- **set Billing Address**  
  - HTTP POST to set the billing address in the cart using customer address ID  
  - Sets `useForShipping` flag to true to reuse billing address for shipping  

- **estimate Shipping Methods**  
  - Posts customer address to get available shipping options for cart  

- **Limit**  
  - Limits number of shipping methods to top 2 for processing  

- **If express**  
  - If node checking AI-extracted `express` boolean flag  
  - Routes to standard or express shipping method nodes  

- **set Standard Shipping Method**  
  - HTTP POST to set shipping information with the first shipping method from estimate  

- **set Express Shipping Method**  
  - HTTP POST to set shipping information with the second shipping method (express)  

- **Edge Cases:** Address mismatch, no shipping methods returned, incorrect express flag  

---

#### 1.6 Order Finalization

**Overview:**  
Sets the purchase order reference number, adds an internal comment, checks payment methods (company credit), places the order, and moves the processed email message to the “Processed Orders” folder.

**Nodes Involved:**  
- set Reference Number  
- set Order Comment  
- get Payment Methods  
- check Companycredit (reused)  
- If companyCredit (reused)  
- place Order  
- Move a message  

**Node Details:**  

- **set Reference Number**  
  - PUT request to set custom PO number in the cart  

- **set Order Comment**  
  - PUT request to add an internal order comment for traceability  

- **get Payment Methods**  
  - POST request to retrieve available payment methods for the cart  

- **check Companycredit**  
  - Checks if company credit is available (already described)  

- **If companyCredit**  
  - If company credit is available, continue to place order  
  - Else, trigger error feedback  

- **place Order**  
  - PUT request to place the order using company credit as payment method  

- **Move a message**  
  - Moves the processed email from the inbox folder to the “Processed Orders” folder in Outlook  

- **Edge Cases:** PO number duplication, payment method unavailable, API errors  

---

#### 1.7 Error Handling & Feedback

**Overview:**  
Handles failures gracefully by stopping the workflow with error messages, setting feedback text for missing data, and combining errors for logging or notifications.

**Nodes Involved:**  
- Set empty email message  
- Set empty products message  
- Set empty PO number message  
- Set empty PO number message1  
- Pay on account error message  
- Json error message  
- Combine error fields  
- Stop and Error1  
- set Feedback (various)  
- No Operation nodes (noOp) for flow control  

**Node Details:**  

- **Set empty email message / Set empty products message / Set empty PO number message**  
  - Set nodes with user-friendly messages for missing critical data  

- **Pay on account error message**  
  - Error message if company credit is not allowed for the customer  

- **Json error message**  
  - Sets full JSON error output for debugging  

- **Combine error fields**  
  - Aggregates multiple error messages and email IDs for notification  

- **Stop and Error1**  
  - Stops workflow execution with a specified error message  

- **No Operation nodes**  
  - Used to control flow and allow graceful continuation or termination  

- **Edge Cases:** Missing fields, invalid data, API errors, duplicate orders  

---

### 3. Summary Table

| Node Name                      | Node Type                   | Functional Role                           | Input Node(s)                  | Output Node(s)                 | Sticky Note                                                  |
|-------------------------------|-----------------------------|-----------------------------------------|-------------------------------|-------------------------------|--------------------------------------------------------------|
| Microsoft Outlook Trigger      | Trigger                     | Listens for new emails and downloads PDFs |                               | set Text                      | 📩 1. Trigger & Input                                         |
| set Text                      | Set                         | Extracts email body text                 | Microsoft Outlook Trigger      | Email combine                 | 📩 1. Trigger & Input                                         |
| Email combine                 | NoOp                        | Combines email and PDF text data        | set Text                      | Code                         | 📩 1. Trigger & Input                                         |
| Code                         | Code                        | Extracts PDF attachments from email     | Email combine                 | Extract from File2 (disabled) | 📩 1. Trigger & Input                                         |
| Extract from File2            | Extract from File            | PDF text extraction (disabled alt)      | Code                         | set Information              | 📩 1. Trigger & Input                                         |
| set Information              | Set                         | Prepare combined text for AI parsing    | Extract from File2             | AI Agent                     | 📝 AI Parsing & Normalisation & Checks                       |
| AI Agent                     | LangChain Agent              | Parses PDF/email text to structured JSON| set Information              | set OpenAI                   | 📝 AI Parsing & Normalisation & Checks                       |
| set OpenAI                   | Set                         | Parses AI output JSON string to JSON    | AI Agent                     | filter Emailadresses         | 📝 AI Parsing & Normalisation & Checks                       |
| filter Emailadresses          | Code                        | Filters out internal emails from list   | set OpenAI                   | Emails not empty             | 📝 AI Parsing & Normalisation & Checks                       |
| remove SCH                   | Code                        | Cleans product article numbers          | Switch                       | Products                    | 📝 AI Parsing & Normalisation & Checks                       |
| Switch                      | Switch                      | Routes by company or customer email     | Products not empty            | Vorgangsnummer, remove SCH, Products | 📝 AI Parsing & Normalisation & Checks                 |
| Vorgangsnummer              | Set                         | Sets PO number from extra fields        | Switch                       | Products                    | 📝 AI Parsing & Normalisation & Checks                       |
| Split Emails                | splitOut                    | Splits emails for customer lookup       | set Emails                   | Loop until existing customer found | 👤 Customer Validation                                  |
| Loop until existing customer found | splitInBatches           | Iterates emails until valid customer    | Split Emails                 | get Customer, No Operation, do nothing2 | 👤 Customer Validation                                  |
| get Customer                | HTTP Request                | Searches Adobe Commerce customer by email | Loop until existing customer found | If Customer                | 👤 Customer Validation                                  |
| If Customer                 | If                          | Checks if customer found                 | get Customer                 | set Customer, Loop until existing customer found | 👤 Customer Validation                                  |
| set Customer                | Set                         | Saves valid customer data                | If Customer                  | set Address                 | 👤 Customer Validation                                  |
| set Address                 | Code                        | Extracts default shipping address       | set Customer                | If Default Address          | 👤 Customer Validation                                  |
| If Default Address          | If                          | Checks if default address exists        | set Address                 | Create cart, set Feedback Default Address | 👤 Customer Validation                                  |
| Create cart                 | HTTP Request                | Creates empty cart for customer          | If Default Address           | set Quote Id                | 🛒 Cart Creation                                         |
| set Quote Id                | Set                         | Saves new cart ID                        | Create cart                 | get Cart Items, get Products | 🛒 Cart Creation                                         |
| get Cart Items              | HTTP Request                | Retrieves items in cart                  | set Quote Id                | remove From Shopping Cart    | 🛒 Cart Creation                                         |
| remove From Shopping Cart   | HTTP Request                | Removes items from cart                  | get Cart Items              | No Operation, do nothing1    | 🛒 Cart Creation                                         |
| get Products                | Set                         | Prepares product list for adding to cart| set Quote Id                | Split Out Products          | 🛒 Cart Creation                                         |
| Split Out Products          | splitOut                    | Splits products for iteration            | get Products                | set Clean Articlenumber     | 🛒 Cart Creation                                         |
| set Clean Articlenumber     | Set                         | Normalizes SKU strings                   | Split Out Products          | Merge, get Configurable      | 🛒 Cart Creation                                         |
| get Configurable            | HTTP Request                | Checks if product is configurable        | set Clean Articlenumber     | Merge                       | 🛒 Cart Creation                                         |
| Merge                      | Merge                       | Combines cleaned SKUs and configurable results | get Configurable, set Clean Articlenumber | If configurable product found | 🛒 Cart Creation                                         |
| If configurable product found | If                         | Routes based on configurable product presence | Merge                      | Prepare sku & quote, set Feedback configurable | 🛒 Cart Creation                                         |
| Prepare sku & quote         | Set                         | Prepares SKU and quote ID for adding    | If configurable product found | Loop over products          | 🛒 Cart Creation                                         |
| Loop over products          | splitInBatches              | Iterates over products to add to cart   | Prepare sku & quote         | Merge1, Execute Workflow    | 🛒 Cart Creation                                         |
| Execute Workflow            | Execute Workflow            | Sub-workflow "Klippa - add to cart" to add products | Loop over products          | Wait                       | 🛒 Cart Creation                                         |
| Wait                       | Wait                        | Waits 2 seconds between product additions | Execute Workflow            | Loop over products          | 🛒 Cart Creation                                         |
| If product in cart          | If                          | Checks if product was successfully added | Merge1                      | Combine processed skus, Combine failed skus | 🛒 Cart Creation                                         |
| Combine processed skus      | Code                        | Combines list of successfully added SKUs| If product in cart          | set Feedback processed      | 🛒 Cart Creation                                         |
| Combine failed skus         | Code                        | Combines list of failed SKUs             | If product in cart          | set Feedback failed         | 🛒 Cart Creation                                         |
| set Feedback processed      | Set                         | Sets success message with SKUs           | Combine processed skus      | Combine feedback            | 🛒 Cart Creation                                         |
| set Feedback failed         | Set                         | Sets failure message with SKUs           | Combine failed skus         | Combine feedback            | 🛒 Cart Creation                                         |
| Combine feedback            | Code                        | Aggregates processed/failed/configurable feedback | set Feedback processed, set Feedback failed, set Feedback configurable | Keep 1                    | 🛒 Cart Creation                                         |
| Keep 1                     | Limit                       | Keeps last feedback message              | Combine feedback            | No Operation, do nothing1   | 🛒 Cart Creation                                         |
| set Billing Address         | HTTP Request                | Sets billing address in cart             | Aggregate                  | estimate Shipping Methods   | 🚚 Shipping & Billing                                   |
| Aggregate                  | Aggregate                   | Aggregates item data for billing          | If product in cart          | set Billing Address         | 🚚 Shipping & Billing                                   |
| estimate Shipping Methods   | HTTP Request                | Estimates shipping methods available     | set Billing Address         | Limit                      | 🚚 Shipping & Billing                                   |
| Limit                      | Limit                       | Limits shipping methods to 2               | estimate Shipping Methods   | If express                 | 🚚 Shipping & Billing                                   |
| If express                 | If                          | Checks if express shipping requested      | Limit                      | set Standard Shipping Method, set Express Shipping Method | 🚚 Shipping & Billing                                   |
| set Standard Shipping Method | HTTP Request                | Sets standard shipping method              | If express                 | set Reference Number       | 🚚 Shipping & Billing                                   |
| set Express Shipping Method | HTTP Request                | Sets express shipping method               | If express                 | set Reference Number       | 🚚 Shipping & Billing                                   |
| set Reference Number       | HTTP Request                | Sets PO number in cart                      | set Standard Shipping Method, set Express Shipping Method | set Order Comment         | ✅ Finalize Order                                      |
| set Order Comment          | HTTP Request                | Adds order comment                          | set Reference Number        | get Payment Methods         | ✅ Finalize Order                                      |
| get Payment Methods        | HTTP Request                | Retrieves payment methods                   | set Order Comment           | check Companycredit         | ✅ Finalize Order                                      |
| check Companycredit        | Code                        | Checks if company credit payment available | get Payment Methods         | If companyCredit            | ✅ Finalize Order                                      |
| If companyCredit           | If                          | Routes based on company credit availability | check Companycredit         | If developer, Pay on account error message | ✅ Finalize Order                                      |
| If developer               | If                          | Ensures workflow runs only if not developer | If companyCredit            | place Order, get Cart Items1 | ✅ Finalize Order                                      |
| place Order                | HTTP Request                | Places order using company credit payment   | If developer                | Move a message              | ✅ Finalize Order                                      |
| Move a message             | Microsoft Outlook           | Moves processed email to “Processed Orders” | place Order                 |                             | ✅ Finalize Order                                      |
| Set empty email message    | Set                         | Sets error message when no emails found    | Emails not empty (false)     | No Operation, do nothing3   | ⚠️ Error Handling                                     |
| Set empty products message | Set                         | Sets error message when no products found  | Products not empty (false)   | No Operation, do nothing3   | ⚠️ Error Handling                                     |
| Set empty PO number message | Set                        | Sets error message when no PO number found  | If PO number not empty (false) | No Operation, do nothing3 | ⚠️ Error Handling                                     |
| Set empty PO number message1 | Set                       | Sets error message if PO number already exists | IF PO number not exists (false) | No Operation, do nothing3 | ⚠️ Error Handling                                     |
| Pay on account error message | Set                       | Sets error message if company credit not allowed | If companyCredit (false)    | Combine error fields        | ⚠️ Error Handling                                     |
| Json error message          | Set                        | Converts error info to JSON string           | Combine error fields         | Stop and Error1             | ⚠️ Error Handling                                     |
| Combine error fields        | Set                        | Aggregates error messages and email IDs     | set Feedback Default Address, Pay on account error message, Set empty PO number message1 | Json error message | ⚠️ Error Handling                                     |
| Stop and Error1             | Stop and Error             | Stops workflow with error message            | Json error message           |                             | ⚠️ Error Handling                                     |
| set Feedback                | Set                        | Sets feedback for no customer found          | No Operation, do nothing2    | No Operation, do nothing1   | ⚠️ Error Handling                                     |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Microsoft Outlook Trigger**  
   - Type: Microsoft Outlook Trigger  
   - Configure credentials for Outlook mailbox  
   - Set folder to watch (Inbox or specific orders folder)  
   - Enable downloading attachments  
   - Poll every minute  

2. **Add Set node "set Text"**  
   - Extract `body.content` from trigger output into `text` field  

3. **Add No Operation node "Email combine"**  
   - Placeholder to combine email and PDF text  

4. **Add Code node to extract PDFs**  
   - Script to filter binary data for PDFs and output as `attachment`  

5. **Add Set node "set Information"**  
   - Concatenate email text and extracted PDF text into `info` field  

6. **Add LangChain Agent node "AI Agent"**  
   - Configure Azure OpenAI with appropriate credentials  
   - Use prompt template to extract emails, PO number, shipping flag, address, products, and extra fields as JSON  
   - Input: `info` field from previous step  

7. **Add Set node "set OpenAI"**  
   - Parse AI output JSON string into JSON object field `content`  

8. **Add Code node "filter Emailadresses"**  
   - Filter out emails containing “@example.com” from `content.email` array  

9. **Add Code node "remove SCH"**  
   - Iterate over `content.products`, remove “SCH” prefix from `articlenumber`  

10. **Add Switch node**  
    - Conditions: if company name contains “Company 1” → route to “Vorgangsnummer”  
    - else if any email contains “@customer.com” → route to “remove SCH”  
    - else route to "Products"  

11. **Add Set node "Vorgangsnummer"**  
    - Copy `extra_fields.Vorgangsnummer` into `content.po_number`  

12. **Add Set node "set Emails"**  
    - Prepare email array for customer validation  

13. **Add splitOut node "Split Emails"**  
    - Split emails to process one by one  

14. **Add splitInBatches node "Loop until existing customer found"**  
    - Loop over emails until a valid customer is found  

15. **Add HTTP Request node "get Customer"**  
    - Query Adobe Commerce customers by email and website_id=1  

16. **Add If node "If Customer"**  
    - Check if total_count == 1  

17. **Add Set node "set Customer"**  
    - Store found customer JSON  

18. **Add Code node "set Address"**  
    - Extract default shipping address from customer addresses  

19. **Add If node "If Default Address"**  
    - Check if default address ID exists  

20. **Add HTTP Request node "Create cart"**  
    - POST to create cart for customer ID  

21. **Add Set node "set Quote Id"**  
    - Store cart (quote) ID  

22. **Add HTTP Request node "get Cart Items"**  
    - Get existing cart items  

23. **Add HTTP Request node "remove From Shopping Cart"**  
    - Delete existing cart items to start fresh  

24. **Add Set node "get Products"**  
    - Set product array from AI output `content.products`  

25. **Add splitOut node "Split Out Products"**  
    - Split products for iteration  

26. **Add Set node "set Clean Articlenumber"**  
    - Clean product SKUs (remove non-alphanumeric characters)  

27. **Add HTTP Request node "get Configurable"**  
    - Check if SKU is configurable product in Adobe Commerce  

28. **Add Merge node**  
    - Combine clean SKU and configurable check results  

29. **Add If node "If configurable product found"**  
    - Route to SKU preparation or feedback on missing product  

30. **Add Set node "Prepare sku & quote"**  
    - Prepare SKU and quote ID for adding  

31. **Add splitInBatches node "Loop over products"**  
    - Loop over products to add to cart  

32. **Add Execute Workflow node "Execute Workflow"**  
    - Call sub-workflow “Klippa - add to cart” to add each product  

33. **Add Wait node**  
    - Wait 2 seconds between product additions  

34. **Add If node "If product in cart"**  
    - Check if product was successfully added  

35. **Add Code nodes "Combine processed skus" and "Combine failed skus"**  
    - Combine SKUs with success or failure for feedback  

36. **Add Set nodes "set Feedback processed" and "set Feedback failed"**  
    - Create user messages for added or failed products  

37. **Add Code node "Combine feedback"**  
    - Aggregate all product feedback messages  

38. **Add Limit node "Keep 1"**  
    - Keep last feedback message  

39. **Add HTTP Request node "set Billing Address"**  
    - Set billing address on cart with customer address ID  

40. **Add HTTP Request node "estimate Shipping Methods"**  
    - POST address to get shipping method estimates  

41. **Add Limit node**  
    - Limit shipping methods to 2  

42. **Add If node "If express"**  
    - Check boolean flag `content.express`  

43. **Add HTTP Request nodes "set Standard Shipping Method" and "set Express Shipping Method"**  
    - Set shipping method based on express flag  

44. **Add HTTP Request node "set Reference Number"**  
    - PUT PO number on cart  

45. **Add HTTP Request node "set Order Comment"**  
    - PUT internal comment on order  

46. **Add HTTP Request node "get Payment Methods"**  
    - Retrieve payment methods for cart  

47. **Add Code node "check Companycredit"**  
    - Check if payment methods include company credit  

48. **Add If node "If companyCredit"**  
    - Proceed if company credit available, else error  

49. **Add If node "If developer"**  
    - Prevent order placement if email sender is developer@example.com (optional safeguard)  

50. **Add HTTP Request node "place Order"**  
    - Place order using company credit payment  

51. **Add Microsoft Outlook node "Move a message"**  
    - Move email to “Processed Orders” folder  

52. **Add multiple Set nodes for error messages**  
    - For missing emails, missing products, missing or duplicate PO number, company credit errors  

53. **Add Set node "Json error message" and "Combine error fields"**  
    - Aggregate and format error messages  

54. **Add Stop and Error node**  
    - Stop workflow with error message  

55. **Add multiple No Operation nodes (noOp) as flow controls**  

---

### 5. General Notes & Resources

| Note Content | Context or Link |
|--------------|-----------------|
| This workflow is tailored for Adobe Commerce using Company Credit payment method and requires customers with pre-existing accounts. | Sticky Note: Workflow Description |
| AI parsing is performed with Azure OpenAI (LangChain integration). The prompt expects JSON structure extraction including purchase order details. | Sticky Note: AI Parsing |
| Error handling is comprehensive, providing clear feedback messages and orderly workflow termination on missing data or invalid conditions. | Sticky Note: Error Handling |
| The workflow includes a sub-workflow named "Klippa - add to cart" responsible for adding individual products to the cart. | Node: Execute Workflow |
| Outlook mailbox credentials must be configured with OAuth2 for secure email access and attachment download. | Microsoft Outlook Trigger node |
| Magento 2 API credentials are required for all HTTP Request nodes interacting with Adobe Commerce REST API endpoints. | HTTP Request nodes |
| The workflow can be adapted for other payment methods or input sources by modifying parsing and order placement logic. | Workflow overview and description notes |

---

This documentation provides a structured and comprehensive reference for understanding, reproducing, and modifying the "Automate PDF Purchase Orders to Sales Orders in Adobe Commerce with AI" workflow in n8n. It covers logical flow blocks, node-by-node details, potential failure points, and integration specifics.