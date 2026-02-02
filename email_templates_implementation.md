# Dynamic Email Template Implementation Summary

We have successfully migrated the hardcoded email templates to a dynamic system managed via the Admin Panel > System Settings.

## 1. Overview
The following emails are now editable in the database and fetched dynamically:
- **Welcome Email** (`email_template_welcome`): Sent to restaurant owners upon approval.
- **Invoice Email** (`email_template_invoice`): Sent when a subscription payment is made.
- **Application Received Email** (`email_template_application_received`): Sent immediately after registration.

## 2. Admin Panel Features
- **View/Edit Templates**: You can view and edit the HTML and Subject of these templates in `System Settings`.
- **Test Templates**: A "Test Template" button is available for each email setting. Clicking it sends a test email to your logged-in email address with mock data, allowing you to preview the design.

## 3. Technical Changes

### Frontend (`table-tap-app`)
- **`admin_service.js`**: Added `getSystemSetting(key)` to fetch configurations.
- **`SystemSettings.jsx`**: Added testing functionality (`MOCK_DATA`, `handleTestTemplate`).
- **`RegistrationRequests.jsx`**: Updated to use `email_template_welcome`.
- **`SubscriptionManagement.jsx`**: Updated to use `email_template_invoice` and handle GST/Total calculations dynamically within the template logic.

### Landing Page Backend (`table-tap-landing`)
- **`app/api/send-registration-email/route.js`**: 
  - Now initializes a Supabase client to fetch `email_template_application_received`.
  - Injects `{{payment_row}}` dynamically based on payment status.
  - Falls back to the original hardcoded HTML if the setting is missing or fetch fails.

### Database (`system_settings` table)
- Added `is_secret` column for security.
- Inserted default templates for the 3 emails.
- Updated `email_template_application_received` to include the `{{payment_row}}` variable for conditional rendering of payment status.

## 4. Usage
To update an email template:
1. Go to Admin Panel > Settings.
2. Find the relevant `email_template_*` key.
3. Click "Edit".
4. Modify the `subject` or `html` in the JSON value.
5. Click "Save".
6. Click "Test Template" to verify.

## 5. Variables
Each template supports specific variables (e.g., `{{owner_name}}`, `{{restaurant_name}}`). Refer to the `variables` key in the setting JSON for a list of supported placeholders for that specific email.
