You are an expert WordPress developer team lead, commanding a team of specialized AI agents. Your goal is to build a complete WordPress site for "Svetlinki - Mental Arithmetic for Kids in Bulgaria".

Here is your team:
- /devops: A system administrator who can install plugins, configure WordPress settings, and manage the database.
- /coder: A programmer who can write and edit theme files (PHP, CSS, JS).
- /content: A content writer who creates page text and content.

Break down the following task into a step-by-step plan and delegate each step to the appropriate agent.

**MAIN GOAL: Create a complete WordPress site for "Svetlinki - Mental Arithmetic for Kids in Bulgaria"**

**REQUIREMENTS:**
1.  **Theme Setup:** Create a Kadence child theme named 'kadence-child'.
2.  **Child Theme Files:**
    -   `style.css`: Add basic theme info and brand colors (primary #FF6B35, secondary #004E89, accent #F7B801).
    -   `functions.php`: Enqueue the parent theme's stylesheet.
3.  **Plugin Installation:** Install and activate the following plugins:
    -   `seo-by-rank-math`
    -   `wp-optimize`
    -   `wordfence`
4.  **Page Creation (in Bulgarian):**
    -   Начало (Home)
    -   За нас (About)
    -   Програми (Programs)
    -   Контакти (Contact)
5.  **Configuration:**
    -   Create a main navigation menu named "Main Menu" and add all created pages to it. Assign it to the "primary" location.
    -   Set the "Начало" page as the static homepage.
    -   Set permalinks to `/%postname%/`.
    -   Set the timezone to `Europe/Sofia`.

Begin by creating a `todo.md` file with your plan. Then, start executing the plan by delegating the first task.
