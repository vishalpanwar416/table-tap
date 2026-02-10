# Verify table-tap.in on Resend

To send emails (bills, welcome emails, etc.) **from** your domain (e.g. `noreply@table-tap.in`), you must add and verify **table-tap.in** in Resend. Until then, Resend may only allow sending from `onboarding@resend.dev` or will show a "domain not verified" error.

## Steps

### 1. Open Resend Domains

- Go to **https://resend.com/domains**
- Sign in to your Resend account (the one whose API key is in `resend_config`)

### 2. Add the domain

- Click **Add Domain**
- Enter: **table-tap.in**
- (Optional) Resend recommends using a subdomain like **send.table-tap.in** for sending—you can choose that instead if you prefer.
- Click **Add** / **Create**

### 3. Add DNS records

Resend will show two kinds of records. Add them at your **domain registrar or DNS provider** (where table-tap.in is managed, e.g. Cloudflare, Namecheap, GoDaddy, etc.):

1. **SPF (TXT record)**  
   - Resend will give you a host (e.g. `send` or `send.table-tap.in`) and a TXT value.  
   - Create a **TXT** record with that name and value.

2. **DKIM (TXT record)**  
   - Resend will give you a DKIM host (e.g. `resend._domainkey`) and a long TXT value.  
   - Create a **TXT** record with that name and value.

3. **MX (for Return-Path, if shown)**  
   - If Resend shows an MX record for bounce handling, add it as well.

Save the DNS changes at your provider.

### 4. Verify in Resend

- Back in **https://resend.com/domains**, open the **table-tap.in** domain.
- Click **Verify DNS Records** (or **Verify**).
- DNS can take from a few minutes up to 24–48 hours. If it stays “Pending”, wait and try **Verify** again later.

### 5. Use the domain in TableTap

After the domain status is **Verified** in Resend:

1. Open **Admin Panel → System Settings**.
2. Edit **resend_config**.
3. Set **from_email** to your verified address, for example:
   - `TableTap <noreply@table-tap.in>`  
   or, if you used a subdomain:
   - `TableTap <noreply@send.table-tap.in>`
4. Save.

Emails sent by TableTap (bill emails, etc.) will then use this “from” address.

## Troubleshooting

- **Domain not verifying**  
  Double-check the TXT/MX host names and values (no extra spaces, full value pasted). See [Resend: What if my domain is not verifying?](https://resend.com/docs/knowledge-base/what-if-my-domain-is-not-verifying).

- **Still using onboarding@resend.dev**  
  Update `resend_config` → `from_email` in System Settings (or in the `system_settings` table) to `TableTap <noreply@table-tap.in>` (or your chosen address on table-tap.in).
