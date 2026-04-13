# Fleet Manager — Supabase Auth Email Templates

Six HTML email templates themed for Fleet Manager (`#3B82F6` blue, Plus Jakarta Sans, clean card layout).

## How to install

1. Open Supabase → **Authentication → Emails → Templates**.
2. For each template below, click into the row and paste the HTML into the **Message body** field. Set the **Subject** to the matching value below.
3. Click **Save** on each template.

> **Heads up**: the built-in Supabase email service is rate-limited and marked "not for production". Set up custom SMTP under **SMTP Settings** before rolling this out to drivers.

## Template map

| Supabase template | File | Suggested subject |
|---|---|---|
| Invite user | [invite_user.html](./invite_user.html) | `You've been invited to Fleet Manager` |
| Confirm sign up | [confirm_signup.html](./confirm_signup.html) | `Confirm your Fleet Manager account` |
| Magic link | [magic_link.html](./magic_link.html) | `Sign in to Fleet Manager` |
| Change email address | [change_email.html](./change_email.html) | `Confirm your new email — Fleet Manager` |
| Reset password | [reset_password.html](./reset_password.html) | `Reset your Fleet Manager password` |
| Reauthentication | [reauthentication.html](./reauthentication.html) | `Your Fleet Manager verification code` |

## Template variables used

Supabase replaces these at send time — don't change the double-brace syntax:

- `{{ .ConfirmationURL }}` — action link (invite, confirm, magic link, reset, change email)
- `{{ .Token }}` — 6-digit OTP code (reauthentication only)
- `{{ .Email }}` — current email (change email template)
- `{{ .NewEmail }}` — new email (change email template)
- `{{ .SiteURL }}` — footer link

## URL configuration prerequisite

For invite / confirm / reset / change-email to actually work, the redirect target must be in the allowlist:

**Supabase → Authentication → URL Configuration → Redirect URLs**:

```
https://fleetmanagementrevamp.netlify.app/auth/set-password
https://fleetmanagementrevamp.netlify.app/dashboard
http://localhost:3000/auth/set-password
http://localhost:3000/dashboard
```

Without the right entries, Supabase silently strips `redirect_to` and the link lands on Supabase's default page.

## Design notes

- Max width 600px, centred card, 12px rounded corners
- Top + bottom 4–5px `#3B82F6` accent bars bracket the card
- Brand header = rounded "FM" tile + "Fleet Manager" wordmark
- Info boxes: blue (`#3B82F6`) for informational, amber (`#f59e0b`) for security warnings
- Button: solid blue, 8px corners, Plus Jakarta Sans 16px/700
- MSO fallback (Outlook) included on every CTA button
- Preheader text (invisible preview) set per template

## Testing

After saving a template, use Supabase's **Send test email** button in the template editor to preview the rendering in real email clients. Double-check:

- Outlook desktop (MSO fallback renders the button)
- Gmail web (spacing + button padding)
- iOS Mail (small-screen padding)
- Dark-mode clients (card background stays white; text stays legible)
