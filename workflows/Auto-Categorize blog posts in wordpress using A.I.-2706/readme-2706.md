Auto-Categorize blog posts in wordpress using A.I.

https://n8nworkflows.xyz/workflows/auto-categorize-blog-posts-in-wordpress-using-a-i--2706


# Auto-Categorize blog posts in wordpress using A.I.

### 1. Workflow Overview

This workflow automates the categorization of WordPress blog posts by leveraging AI to analyze post titles and assign the most relevant category ID from a predefined list. It is designed to save content managers, bloggers, and website administrators significant manual effort in organizing their content.

The workflow is logically divided into the following blocks:

- **1.1 Input Reception:** Manual trigger to start the workflow.
- **1.2 Data Retrieval:** Fetch all WordPress posts that need categorization.
- **1.3 AI Processing:** Analyze each post title using an AI agent to determine the most appropriate category ID.
- **1.4 Post Update:** Update WordPress posts with the AI-assigned category IDs.

---

### 2. Block-by-Block Analysis

#### 1.1 Input Reception

- **Overview:**  
  This block initiates the workflow manually, allowing the user to trigger the categorization process on demand.

- **Nodes Involved:**  
  - When clicking ‘Test workflow’

- **Node Details:**  
  - **When clicking ‘Test workflow’**  
    - Type: Manual Trigger  
    - Role: Starts the workflow execution manually.  
    - Configuration: No parameters; simply triggers downstream nodes.  
    - Inputs: None  
    - Outputs: Connects to "Get All Wordpress Posts" node.  
    - Edge Cases: None; manual trigger is straightforward.  
    - Version: n8n v1 compatible.

---

#### 1.2 Data Retrieval

- **Overview:**  
  Retrieves all posts from the WordPress site, specifically targeting those that require categorization.

- **Nodes Involved:**  
  - Get All Wordpress Posts  
  - Sticky Note (contextual guidance)

- **Node Details:**  
  - **Get All Wordpress Posts**  
    - Type: WordPress node  
    - Role: Fetches all posts from the WordPress site.  
    - Configuration:  
      - Operation: getAll  
      - Return All: true (fetches all posts without pagination)  
      - Credentials: WordPress API credentials configured for the target site.  
    - Inputs: Triggered by manual trigger node.  
    - Outputs: Sends all posts to the AI Agent node.  
    - Edge Cases:  
      - Large number of posts may cause timeouts or memory issues; consider disabling "Return All" and using pagination if needed.  
      - Authentication errors if credentials are invalid or expired.  
    - Version: n8n v1 compatible.

  - **Sticky Note** (near Get All Wordpress Posts)  
    - Content: Advises to turn off "Return All" if issues arise, indicating potential performance or API limits.

---

#### 1.3 AI Processing

- **Overview:**  
  Uses an AI agent to analyze each post title and assign a single primary category ID from a fixed list of predefined categories.

- **Nodes Involved:**  
  - AI Agent  
  - OpenAI Chat Model  
  - Sticky Note (contextual guidance)

- **Node Details:**  
  - **AI Agent**  
    - Type: LangChain Agent node (AI processing)  
    - Role: Processes each post title to determine the most relevant category ID.  
    - Configuration:  
      - Prompt: Defines the AI's role as a content strategist and taxonomy specialist.  
      - Input Text: Post title (`{{ $json.title.rendered }}`)  
      - Category List: Fixed mapping of category IDs to category names (13 to 19).  
      - Output: Only the single most relevant category ID number.  
    - Inputs: Receives posts from "Get All Wordpress Posts".  
    - Outputs: Sends category ID to "Wordpress" update node.  
    - Edge Cases:  
      - AI may return invalid or unexpected category IDs if prompt is misconfigured.  
      - API rate limits or failures with OpenAI.  
      - Expression failures if post title is missing or malformed.  
    - Version: Requires n8n LangChain nodes v1.7 or later.

  - **OpenAI Chat Model**  
    - Type: LangChain OpenAI Chat Model node  
    - Role: Provides the language model backend for the AI Agent.  
    - Configuration:  
      - Credentials: OpenAI API key configured.  
      - Options: Default.  
    - Inputs: Connected as language model for AI Agent.  
    - Outputs: Feeds AI Agent with model responses.  
    - Edge Cases:  
      - API key invalid or quota exceeded.  
      - Network timeouts.  
    - Version: Requires LangChain integration in n8n.

  - **Sticky Note** (near AI Agent)  
    - Content:  
      - Reminds to set up categories in WordPress first.  
      - Instructs to edit the AI prompt to match category IDs.

---

#### 1.4 Post Update

- **Overview:**  
  Updates each WordPress post with the category ID assigned by the AI agent.

- **Nodes Involved:**  
  - Wordpress (Update Post)  
  - Sticky Note (contextual guidance)

- **Node Details:**  
  - **Wordpress**  
    - Type: WordPress node  
    - Role: Updates the post's categories field with the AI-assigned category ID.  
    - Configuration:  
      - Operation: update  
      - Post ID: Dynamically set from the original post (`={{ $('Get All Wordpress Posts').item.json.id }}`)  
      - Update Fields: categories set to AI output (`={{ $json.output }}`)  
      - Credentials: WordPress API credentials.  
    - Inputs: Receives category ID from AI Agent.  
    - Outputs: None (end of workflow).  
    - Edge Cases:  
      - Post ID mismatch or missing causes update failure.  
      - Authentication errors.  
      - WordPress API rate limits or errors.  
    - Version: n8n v1 compatible.

  - **Sticky Note** (near Wordpress update node)  
    - Content: "Update category" — brief reminder of node purpose.

---

### 3. Summary Table

| Node Name                 | Node Type                         | Functional Role                          | Input Node(s)               | Output Node(s)             | Sticky Note                                                                                                         |
|---------------------------|----------------------------------|----------------------------------------|-----------------------------|----------------------------|---------------------------------------------------------------------------------------------------------------------|
| When clicking ‘Test workflow’ | Manual Trigger                   | Starts workflow manually                | None                        | Get All Wordpress Posts     |                                                                                                                     |
| Get All Wordpress Posts    | WordPress                        | Retrieves all WordPress posts           | When clicking ‘Test workflow’ | AI Agent                   | Advises to turn off "Return All" if issues arise.                                                                   |
| AI Agent                  | LangChain Agent                  | Assigns category ID using AI             | Get All Wordpress Posts       | Wordpress                  | Reminds to set up categories in WordPress first; edit AI prompt with category IDs.                                  |
| OpenAI Chat Model          | LangChain OpenAI Chat Model     | Provides AI language model backend       | None (used by AI Agent)       | AI Agent                   |                                                                                                                     |
| Wordpress                 | WordPress                        | Updates posts with AI-assigned category | AI Agent                    | None                      | "Update category" reminder.                                                                                          |
| Sticky Note1              | Sticky Note                     | Informational: case study and tutorial links | None                        | None                      | ## How to Auto-Categorize 82 Blog Posts in 2 Minutes using A.I. (No Coding Required) [Case Study](https://rumjahn.com/how-to-use-a-i-to-categorize-wordpress-posts-and-streamline-your-content-organization-process/) [YouTube Tutorial](https://www.youtube.com/watch?v=IvQioioVqhw) |
| Sticky Note               | Sticky Note                     | Guidance on "Get wordpress posts" node | None                        | None                      | Turn off return all if you're running into issues.                                                                   |
| Sticky Note2              | Sticky Note                     | Guidance on AI categorization setup     | None                        | None                      | 1. Set up categories first in WordPress 2. Edit prompt and change categories and category numbers.                   |
| Sticky Note3              | Sticky Note                     | Guidance on update category node         | None                        | None                      | Update category                                                                                                      |

---

### 4. Reproducing the Workflow from Scratch

1. **Create Manual Trigger Node**  
   - Type: Manual Trigger  
   - Name: "When clicking ‘Test workflow’"  
   - No parameters needed.

2. **Create WordPress Node to Get Posts**  
   - Type: WordPress  
   - Name: "Get All Wordpress Posts"  
   - Operation: getAll  
   - Return All: true (consider disabling if performance issues)  
   - Credentials: Configure WordPress API credentials with admin access to your site.  
   - Connect output of Manual Trigger to this node.

3. **Create LangChain OpenAI Chat Model Node**  
   - Type: LangChain OpenAI Chat Model  
   - Name: "OpenAI Chat Model"  
   - Credentials: Configure with your OpenAI API key.  
   - Use default options.

4. **Create LangChain Agent Node**  
   - Type: LangChain Agent  
   - Name: "AI Agent"  
   - Prompt Type: Define  
   - Text Prompt:  
     ```
     You are an expert content strategist and taxonomy specialist with extensive experience in blog categorization and content organization.

     I will provide you with a blog post's title. Your task is to assign ONE primary category ID from this fixed list:

     13 = Content Creation
     14 = Digital Marketing
     15 = AI Tools
     17 = Automation & Integration
     18 = Productivity Tools
     19 = Analytics & Strategy

     Analyze the title and return only the single most relevant category ID number that best represents the main focus of the post. While a post might touch on multiple topics, select the dominant theme that would be most useful for navigation purposes.

     {{ $json.title.rendered }}

     Output only the category number
     ```
   - Connect "Get All Wordpress Posts" output to this node's input.  
   - Set the AI language model to the "OpenAI Chat Model" node.

5. **Create WordPress Node to Update Posts**  
   - Type: WordPress  
   - Name: "Wordpress"  
   - Operation: update  
   - Post ID: Set dynamically to `={{ $('Get All Wordpress Posts').item.json.id }}` to update the correct post.  
   - Update Fields: categories set to `={{ $json.output }}` (the category ID from AI Agent).  
   - Credentials: Use the same WordPress API credentials as before.  
   - Connect output of "AI Agent" to this node.

6. **Add Sticky Notes for Documentation (Optional but Recommended)**  
   - Add notes near each logical block to provide guidance on usage, configuration, and troubleshooting.  
   - Include links to the case study and tutorial for user reference.

7. **Test the Workflow**  
   - Run the manual trigger.  
   - Verify that uncategorized posts are fetched, AI assigns categories, and posts are updated accordingly.

---

### 5. General Notes & Resources

| Note Content                                                                                                   | Context or Link                                                                                                         |
|---------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| How to Auto-Categorize 82 Blog Posts in 2 Minutes using A.I. (No Coding Required)                              | Case Study: https://rumjahn.com/how-to-use-a-i-to-categorize-wordpress-posts-and-streamline-your-content-organization-process/ |
| YouTube tutorial on setting up this workflow                                                                   | https://www.youtube.com/watch?v=IvQioioVqhw                                                                             |
| Important: Backup your WordPress database before running this workflow                                         | General caution before bulk updates                                                                                     |
| Categories must be created manually in WordPress before running this workflow                                  | Workflow depends on predefined category IDs                                                                             |
| Customization options include modifying AI prompts, adding tag generation, and handling scheduled posts       | Workflow is extensible for broader content management needs                                                             |

---

This documentation provides a complete, structured understanding of the "Auto-Categorize blog posts in WordPress using A.I." workflow, enabling reproduction, modification, and troubleshooting by both human users and automation agents.