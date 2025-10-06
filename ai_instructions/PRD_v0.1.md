## **PRD Continuation: Phase 5 and Beyond**

**Project Status:** The core V1 functionality is in place. Phases 0 through 4 of the initial PRD have been successfully implemented, establishing the full lifecycle from meeting creation to protocol review. The application is now ready for significant UX enhancements, a design system overhaul, and the introduction of advanced collaboration features.

### **Phase 5: UI/UX Overhaul & Brutalist Theming**

**Goal:** Refine the application's visual identity to be more distinctive and professional. Implement a global navigation system and a consistent, modern "brutalist-inspired" design system.

- **Step 5.1: Rebrand "Protocol" to "Minutes"**

  - **Task:** Perform a project-wide find-and-replace.
  - **Details:** Change every user-facing instance of "Meeting Protocol" or "Protocol" to "Meeting Minutes" or "Minutes". This includes page titles, button text, and component content. Update the AI prompts in the backend API routes (`/api/generate-template`, `/api/generate-summary`) to reflect this new terminology, ensuring the AI generates content using the term "Minutes".

- **Step 5.2: Implement New Design System & Theming**

implement consistent good looking theme

- **Step 5.3: Setup Google Auth**

  - **Task:** Configure Google OAuth in Supabase and update the application to support Google sign-in.
  - **Details:**
    - In Supabase Dashboard, go to Authentication > Providers, enable Google, and configure the client ID and secret from Google Cloud Console.
    - Update the auth components (e.g., login and sign-up forms) to include a Google sign-in button using Supabase's auth methods.
    - Ensure the user creation trigger handles Google auth metadata, including avatar_url from Google.

- **Step 5.4: Database Migration - Add User Avatar**

  - **Task:** Add an `avatar_url` column to the `users` table and update the new user trigger.

    - **SQL Migration:** Execute the following SQL in your Supabase project:

    ```sql

    -- Add the avatar_url column to the users table

    ```

- **Step 5.5: Implement Global Navbar**
  - **Task:** Create a new, persistent `Navbar` component and integrate it into the main layout.
  - **Component (`/components/layout/Navbar.tsx`):**
    - **UI:**
      - On the left, display the text "Summario" as a bold logo that links to the `/meetings` dashboard.
      - ~~On the right, implement a User Menu using shadcn's `DropdownMenu` triggered by an `Avatar` component.~~ Try to modify the theme swithcer component so that it works here
    - **Logic:**
      - The Navbar should be a client component (`"use client"`) to fetch user data.
      - Fetch the user's `full_name` and `avatar_url` from the `users` table to display in the `Avatar`.
      - The `DropdownMenu` should contain:
        - A link to `/settings`.
        - A theme switcher (implement using the theme-switcher component) with options for "Light", "Dark", and "System".
        - A "Logout" option.
  - **Integration:** Add this `Navbar` component to the root `layout.tsx` so it appears on all authenticated pages.

### **Phase 6: Enhancing the Meeting Lifecycle (Pre-Meeting & Live View)**

**Goal:** Overhaul the user experience for scheduled and in-progress meetings, providing more context, control, and real-time feedback.

- **Step 6.1: Enhance Meeting Setup Page (`/meeting-setup`)**

  - **Task:** Add language selection and bot messaging options to the "Create New Meeting" form.
  - **UI Changes:**
    - **Language Selection:** Add a `Select` component with the label "Meeting Language". Options should include "Auto-detect Language" and common languages (e.g., English, German, Spanish). Include a hint below: "Selecting a language improves accuracy."
    - **Bot Messaging:** Add a `Checkbox` component with the label "Send introductory message in chat".
  - **Logic:**
    - Update the page's state management to capture the selected `language` and the `send_message` boolean.
    - Update the payload sent to `/api/create-meeting` to include these new fields.

- **Step 6.2: Update `create-meeting` API**

  - **Task:** Modify the `/api/create-meeting` endpoint to handle the new language and messaging options.
  - **Logic:**
    - The endpoint should now accept `language` (string) and `send_initial_message` (boolean) in its request body.
    - If `language` is provided and is not "auto", add the `lang` property to the Skribby API payload.
    - If `send_initial_message` is true, construct and add the `initial_chat_message` property to the Skribby payload. The content should be: `Summario is transcribing and generating minutes for this meeting. If you do not consent, please state your objection now.`

- **Step 6.3: Implement the Live Meeting Status View**
  - **Task:** Redesign the `/meeting/[meeting_id]` page for meetings that are not yet `SUMMARIZED` or `APPROVED`.
  - **UI Layout:** Create a two-column layout.
    - **Left Column:**
      - Implement a `<MultiStepLoader />` component that displays the current `meeting.status` visually.
      - The loader should show the following steps, highlighting the current one: `Scheduled` -> `Starting` -> `Joining` -> `Recording` -> `Done` -> `Summarizing`. Map your existing statuses (`INITIALIZED`, `JOINING`, etc.) to these user-facing steps.
    - **Right Column:**
      - Display an `<EditableAgenda />` component. This component will fetch and display the `agenda_topics` for the meeting. For now, this component will be view-only.
    - **Action Button:**
      - If the meeting status is `SCHEDULED` or `INITIALIZED`, display a `Button` that says "Edit Setup". This button should link back to the `/meeting-setup` page, pre-filled with the current meeting's data.

### **Phase 7: Advanced Editing & Collaboration**

**Goal:** Introduce powerful editing capabilities with a WYSIWYG editor and implement meeting sharing features for collaboration.

- **Step 7.1: Implement WYSIWYG Editor**

  - **Task:** Replace the "Raw Markdown" `Textarea` in the `ReviewMinutesView` component with the Toast UI Editor.
  - **Implementation:**
    - Install the TUI Editor library (`@toast-ui/editor`).
    - Create a new client component wrapper (e.g., `<TuiEditor />`) to handle the editor's initialization, as it directly manipulates the DOM. This component will prevent SSR issues.
    - In `ReviewMinutesView`, use this `<TuiEditor />` component.
    - **Props:** The editor component should accept the initial markdown content (`meeting.structured_protocol.final_protocol_output`).
    - **Getting Content:** The editor instance provides a `getMarkdown()` method. When the "Approve & Save Minutes" button is clicked, call this method on the editor instance to get the latest content and send it to your API.

- **Step 7.2: Database & RLS for Enhanced Sharing**

  - **Task:** Update the `meetings` table to support granular access levels and implement the corresponding Row-Level Security policies.
  - **Details:**
    - A new `access_level` column will be added to the `meetings` table.
    - This column will store the sharing status of the meeting, using one of the following values: `PRIVATE`, `VIEWER`, `COLLABORATOR`, `EDITOR`, `OWNER`.
  - **SQL for RLS Policy:**

    ```sql
    -- First, create a new type for the access levels to ensure data integrity.
    CREATE TYPE meeting_access_level AS ENUM ('PRIVATE', 'VIEWER', 'COLLABORATOR', 'EDITOR', 'OWNER');

    -- Alter the table to use the new type.
    ALTER TABLE public.meetings
      ADD COLUMN access_level meeting_access_level DEFAULT 'PRIVATE' NOT NULL;

    -- This policy allows owners to have unrestricted access.
    CREATE POLICY "Owners can manage their own meetings"
    ON public.meetings
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

    -- This policy allows any authenticated user to view a meeting if it's not private.
    -- The application UI will be responsible for enforcing finer-grained permissions (e.g., editing).
    CREATE POLICY "Users can view non-private meetings"
    ON public.meetings
    FOR SELECT
    USING (access_level <> 'PRIVATE');
    ```

- **Step 7.3: Implement Sharing UI & API**

  - **Task:** Add a "Share" button to the main meeting page, which opens a popover to manage access levels, and create the backend logic.
  - **UI (`/app/meeting/[meeting_id]/page.tsx`):**
    - A "Share" `Button` should be prominently displayed at the top of the meeting page.
  - **Component (`/components/meeting/SharePopover.tsx`):**
    - Clicking the "Share" button will open a `Popover`.
    - For meeting owners:
      - A `Switch` labeled "Share Meeting" will be displayed.
      - When toggled on, the access level defaults to `VIEWER`.
      - A `RadioGroup` appears, allowing the owner to select the access level:
        - **Private**: "Only you can access."
        - **Viewer**: "Anyone with the link can view the agenda and minutes."
        - **Collaborator**: "Anyone with the link can view and edit the agenda."
        - **Editor**: "Anyone with the link can view and edit the agenda and minutes."
    - For non-owners, the UI will be read-only, showing the current access level.
    - The `RadioGroup`'s state should reflect the current `meeting.access_level`.
    - Below the options, show a read-only `Input` with the shareable URL (`<your-domain>/meeting/[meeting_id]`), along with a "Copy Link" button.
  - **API Route (`/api/update-meeting-access`):**
    - Create a new `POST` endpoint that accepts `{ meeting_id: string, access_level: string }`.
    - This endpoint will update the `access_level` column for the specified meeting.
    - **Security:** Ensure only the meeting owner can call this endpoint.

- **Step 7.4: Handle Role-Based Access**
  - **Task:** Modify the data fetching and UI rendering on the `/meeting/[meeting_id]` page to enforce permissions for different user roles.
  - **Logic in `[meeting_id]/page.tsx`:**
    - **Data Fetching:**
      - Fetch the meeting details. The RLS policies will ensure that only authorized users can retrieve the meeting record.
      - If no meeting is found, it means the meeting is private or the user lacks access. Render an `<AccessDenied />` component that prompts the user to log in or request access from the owner.
    - **UI Rendering based on Role:**
      - **Owner:** Has full control. Can edit the agenda, edit the minutes, manage sharing settings, and perform destructive actions like stopping the bot or deleting the meeting.
      - **Editor:** Can view everything. Can edit the agenda (`EditableAgenda`) and the minutes (`ReviewMinutesView` with WYSIWYG editor). Cannot change sharing settings or delete the meeting.
      - **Collaborator:** Can view everything (agenda, minutes). Can only edit the agenda (`EditableAgenda`). The minutes view (`ReviewMinutesView` or `ApprovedMinutesView`) will be read-only.
      - **Viewer:** Can view everything in a read-only state. No editing capabilities.
      - **Unauthenticated User:** If a meeting is not `PRIVATE`, an unauthenticated user has the same permissions as a `Viewer`. They can see the meeting details but cannot interact with any controls. If the meeting is `PRIVATE`, they will be blocked by RLS and see the `<AccessDenied />` page.
