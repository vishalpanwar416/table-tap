# 🔒 Security Audit Checklist - Table Tap

## Overview
Comprehensive security audit checklist for the Table-Tap application infrastructure.

**Last Audit**: [Date]  
**Next Audit**: [Date + 3 months]  
**Auditor**: [Name]

---

## 📋 Audit Sections

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Database Security](#2-database-security)
3. [API & Edge Functions](#3-api--edge-functions)
4. [Frontend Security](#4-frontend-security)
5. [Infrastructure & Deployment](#5-infrastructure--deployment)
6. [Data Protection](#6-data-protection)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [Monitoring & Incident Response](#8-monitoring--incident-response)

---

## 1. Authentication & Authorization

### Supabase Auth Configuration

- [ ] **Google OAuth configured correctly**
  - [ ] Redirect URLs whitelisted
  - [ ] Client ID/Secret secured
  - [ ] Scopes minimized (only necessary permissions)

- [ ] **JWT Configuration**
  - [ ] JWT secret is strong and rotated regularly
  - [ ] Token expiration set appropriately (< 1 hour recommended)
  - [ ] Refresh token rotation enabled
  - [ ] Token verification in all Edge Functions

- [ ] **Session Management**
  - [ ] Session timeout configured (< 24 hours)
  - [ ] Concurrent session limits enforced
  - [ ] Session invalidation on logout working
  - [ ] Session data encrypted

- [ ] **Password Policies** (if applicable)
  - [ ] Minimum 8 characters
  - [ ] Complexity requirements enforced
  - [ ] Password reset flow secure
  - [ ] Rate limiting on auth endpoints

### Role-Based Access Control (RBAC)

- [ ] **User Roles Defined**
  - [ ] Admin role properly restricted
  - [ ] Manager role permissions appropriate
  - [ ] Staff roles (captain, waiter, cashier) limited
  - [ ] Customer role has minimal permissions

- [ ] **Role Assignment**
  - [ ] Only admins can assign roles
  - [ ] Role changes logged
  - [ ] Default role is least privileged (customer)

- [ ] **Permission Checks**
  - [ ] All sensitive operations check user role
  - [ ] Frontend hides unauthorized UI elements
  - [ ] Backend enforces permissions (don't trust frontend)

---

## 2. Database Security

### Row Level Security (RLS)

- [ ] **RLS Enabled on All Tables**
  - [ ] profiles ✅
  - [ ] restaurants ✅
  - [ ] subscriptions ✅
  - [ ] subscription_history ✅
  - [ ] restaurant_staff ✅
  - [ ] food_items ✅
  - [ ] orders ✅
  - [ ] invoices ✅
  - [ ] system_settings ✅
  - [ ] rate_limits ✅

- [ ] **Policy Testing**
  - [ ] Test each policy with different user roles
  - [ ] Verify users can't access other users' data
  - [ ] Verify multi-tenant isolation (restaurant_id)
  - [ ] Test edge cases (null values, deleted records)

- [ ] **Policy Performance**
  - [ ] Policies use indexed columns
  - [ ] No N+1 query issues
  - [ ] Explain plans reviewed for slow policies

### Database Configuration

- [ ] **Connection Security**
  - [ ] SSL/TLS enforced for all connections
  - [ ] Connection pooling configured (PgBouncer)
  - [ ] Connection limits set appropriately
  - [ ] Idle connection timeout configured

- [ ] **User Permissions**
  - [ ] Service role key secured (never in frontend)
  - [ ] Anon key has minimal permissions
  - [ ] Database users follow least privilege
  - [ ] Unused database users removed

- [ ] **Data Validation**
  - [ ] Input validation at database level (CHECK constraints)
  - [ ] Foreign key constraints enforced
  - [ ] NOT NULL constraints on required fields
  - [ ] Unique constraints on appropriate columns

### Sensitive Data

- [ ] **Encryption**
  - [ ] Sensitive fields encrypted (if applicable)
  - [ ] Encryption keys rotated regularly
  - [ ] Encryption at rest enabled (Supabase default)
  - [ ] Encryption in transit (TLS)

- [ ] **PII Handling**
  - [ ] Customer emails hashed/encrypted
  - [ ] Phone numbers masked in logs
  - [ ] Payment data not stored (Razorpay handles)
  - [ ] GDPR compliance for EU users

- [ ] **Secrets Management**
  - [ ] API keys in system_settings table
  - [ ] is_secret flag prevents frontend access
  - [ ] Secrets never logged
  - [ ] Secrets rotated quarterly

---

## 3. API & Edge Functions

### Edge Function Security

- [ ] **Authentication**
  - [ ] JWT verification on all protected functions
  - [ ] Service role key never exposed
  - [ ] User identity re-verified (don't trust claims)
  - [ ] Anonymous access explicitly allowed only where needed

- [ ] **Rate Limiting**
  - [ ] Rate limiting implemented on all public functions
  - [ ] Limits appropriate for function type:
    - [ ] ai-advisor: 10 req/min per user
    - [ ] send-email: 5 req/min per user
    - [ ] send-whatsapp: 5 req/min per user
    - [ ] verify-payment: 20 req/min per user
    - [ ] create-user: 3 req/min per IP
  - [ ] Rate limit cleanup job running

- [ ] **Input Validation**
  - [ ] All inputs validated and sanitized
  - [ ] Type checking enforced
  - [ ] SQL injection prevented (use parameterized queries)
  - [ ] XSS prevention (escape outputs)
  - [ ] CSRF tokens for state-changing operations

- [ ] **Error Handling**
  - [ ] Errors don't leak sensitive information
  - [ ] Stack traces not exposed in production
  - [ ] Generic error messages to users
  - [ ] Detailed errors logged securely

- [ ] **CORS Configuration**
  - [ ] CORS headers properly configured
  - [ ] Only allowed origins whitelisted
  - [ ] Credentials handling secure
  - [ ] Preflight requests handled

### API Best Practices

- [ ] **Versioning**
  - [ ] API versioning strategy in place
  - [ ] Deprecated endpoints documented
  - [ ] Breaking changes communicated

- [ ] **Documentation**
  - [ ] All endpoints documented
  - [ ] Authentication requirements clear
  - [ ] Rate limits documented
  - [ ] Error codes documented

---

## 4. Frontend Security

### React App Security

- [ ] **Environment Variables**
  - [ ] No secrets in frontend code
  - [ ] REACT_APP_ prefix for public vars only
  - [ ] Service role key never in frontend
  - [ ] .env files in .gitignore

- [ ] **XSS Prevention**
  - [ ] React's built-in escaping used
  - [ ] dangerouslySetInnerHTML avoided (or sanitized)
  - [ ] User input sanitized before rendering
  - [ ] Content Security Policy headers set

- [ ] **CSRF Protection**
  - [ ] SameSite cookie attribute set
  - [ ] CSRF tokens for sensitive operations
  - [ ] Origin validation on backend

- [ ] **Dependency Security**
  - [ ] npm audit run regularly
  - [ ] No critical vulnerabilities
  - [ ] Dependencies updated quarterly
  - [ ] Unused dependencies removed

### Client-Side Data

- [ ] **Local Storage**
  - [ ] No sensitive data in localStorage
  - [ ] Session tokens in httpOnly cookies (Supabase default)
  - [ ] Data cleared on logout
  - [ ] Encryption for sensitive cached data

- [ ] **State Management**
  - [ ] Sensitive data not in Redux/state longer than needed
  - [ ] State cleared on logout
  - [ ] No sensitive data in URL parameters

---

## 5. Infrastructure & Deployment

### Vercel Configuration

- [ ] **Environment Variables**
  - [ ] Production secrets separate from development
  - [ ] Environment variables encrypted
  - [ ] Access to Vercel dashboard restricted
  - [ ] MFA enabled for Vercel accounts

- [ ] **Deployment Security**
  - [ ] Automatic deployments from main branch only
  - [ ] Preview deployments don't use production data
  - [ ] Build logs don't expose secrets
  - [ ] Deployment notifications configured

- [ ] **Headers**
  - [ ] X-Content-Type-Options: nosniff ✅
  - [ ] X-Frame-Options: DENY ✅
  - [ ] X-XSS-Protection: 1; mode=block ✅
  - [ ] Strict-Transport-Security (HSTS)
  - [ ] Content-Security-Policy (CSP)
  - [ ] Referrer-Policy

### DNS & Domains

- [ ] **Domain Security**
  - [ ] DNSSEC enabled
  - [ ] Domain lock enabled
  - [ ] Registrar account has MFA
  - [ ] Auto-renewal enabled

- [ ] **SSL/TLS**
  - [ ] HTTPS enforced on all domains
  - [ ] TLS 1.2+ only
  - [ ] Certificate auto-renewal working
  - [ ] HSTS preload list submission

### Supabase Configuration

- [ ] **Project Security**
  - [ ] MFA enabled for all admin accounts
  - [ ] API keys rotated regularly
  - [ ] Unused API keys revoked
  - [ ] Project access limited to necessary users

- [ ] **Database Backups**
  - [ ] Automated backups enabled
  - [ ] Backup retention appropriate (30 days)
  - [ ] Restore tested monthly
  - [ ] Backups encrypted

- [ ] **Monitoring**
  - [ ] Database performance monitored
  - [ ] Connection pool usage tracked
  - [ ] Slow queries identified and optimized
  - [ ] Alerts configured for anomalies

---

## 6. Data Protection

### GDPR Compliance (if applicable)

- [ ] **User Rights**
  - [ ] Right to access (data export)
  - [ ] Right to deletion (account deletion)
  - [ ] Right to rectification (profile updates)
  - [ ] Right to portability (data export format)

- [ ] **Consent Management**
  - [ ] Cookie consent banner
  - [ ] Privacy policy accessible
  - [ ] Terms of service acceptance tracked
  - [ ] Consent withdrawal mechanism

- [ ] **Data Minimization**
  - [ ] Only necessary data collected
  - [ ] Data retention policy defined
  - [ ] Old data purged regularly
  - [ ] Anonymization for analytics

### Data Retention

- [ ] **Retention Policies**
  - [ ] Orders: 7 years (tax compliance)
  - [ ] Invoices: 7 years (tax compliance)
  - [ ] User profiles: Until deletion request
  - [ ] Logs: 90 days
  - [ ] Backups: 30 days

- [ ] **Data Deletion**
  - [ ] Soft delete vs hard delete policy
  - [ ] Cascade deletes configured
  - [ ] Deletion audit trail
  - [ ] Backup cleanup process

---

## 7. Third-Party Integrations

### Payment Gateway (Razorpay)

- [ ] **API Security**
  - [ ] API keys secured in database
  - [ ] Webhook signature verification
  - [ ] HTTPS only for webhooks
  - [ ] Webhook endpoint rate limited

- [ ] **PCI Compliance**
  - [ ] No card data stored locally
  - [ ] Razorpay handles all card processing
  - [ ] PCI SAQ-A compliance maintained

### Email Service (Resend)

- [ ] **API Security**
  - [ ] API key secured
  - [ ] Domain verified
  - [ ] SPF/DKIM/DMARC configured
  - [ ] Rate limiting on email sends

- [ ] **Content Security**
  - [ ] Email templates sanitized
  - [ ] No user input in email headers
  - [ ] Unsubscribe links working
  - [ ] Bounce handling implemented

### WhatsApp Business API

- [ ] **API Security**
  - [ ] Credentials secured
  - [ ] Webhook signature verification
  - [ ] Rate limiting enforced
  - [ ] Message templates approved

### OpenAI API

- [ ] **API Security**
  - [ ] API key secured
  - [ ] Usage limits configured
  - [ ] Input sanitization
  - [ ] Output validation

- [ ] **Data Privacy**
  - [ ] No PII sent to OpenAI
  - [ ] Data retention policy understood
  - [ ] Terms of service compliance

### Google Maps API

- [ ] **API Security**
  - [ ] API key secured
  - [ ] API key restrictions configured
  - [ ] Referrer restrictions set
  - [ ] Usage quotas monitored

---

## 8. Monitoring & Incident Response

### Error Tracking (Sentry)

- [ ] **Configuration**
  - [ ] Sentry initialized correctly
  - [ ] Source maps uploaded
  - [ ] Sensitive data filtered from errors
  - [ ] Alert rules configured

- [ ] **Monitoring**
  - [ ] Error rate monitored
  - [ ] Performance issues tracked
  - [ ] User feedback collected
  - [ ] Release tracking enabled

### Logging

- [ ] **Application Logs**
  - [ ] Structured logging implemented
  - [ ] Log levels appropriate
  - [ ] No sensitive data in logs
  - [ ] Logs centralized (Sentry/Vercel)

- [ ] **Audit Logs**
  - [ ] Admin actions logged
  - [ ] Authentication events logged
  - [ ] Data modifications logged
  - [ ] Logs tamper-proof

### Incident Response

- [ ] **Incident Response Plan**
  - [ ] Plan documented and accessible
  - [ ] Roles and responsibilities defined
  - [ ] Communication plan established
  - [ ] Escalation procedures clear

- [ ] **Disaster Recovery**
  - [ ] Backup/restore procedures tested
  - [ ] RTO/RPO defined
  - [ ] Failover plan documented
  - [ ] Team trained on procedures

### Security Monitoring

- [ ] **Alerts Configured**
  - [ ] Failed login attempts (> 5 in 5 min)
  - [ ] Unusual API usage patterns
  - [ ] Database performance degradation
  - [ ] Backup failures
  - [ ] SSL certificate expiration

- [ ] **Regular Reviews**
  - [ ] Access logs reviewed weekly
  - [ ] Error logs reviewed daily
  - [ ] Security alerts triaged immediately
  - [ ] Quarterly security audits

---

## 🎯 Vulnerability Scanning

### Automated Scans

- [ ] **Dependency Scanning**
  - [ ] npm audit run weekly
  - [ ] Dependabot/Renovate configured
  - [ ] Critical vulnerabilities patched within 24h
  - [ ] High vulnerabilities patched within 7 days

- [ ] **Code Scanning**
  - [ ] ESLint security rules enabled
  - [ ] SonarQube or similar tool used
  - [ ] Code review process enforced
  - [ ] Security-focused code reviews

### Manual Testing

- [ ] **Penetration Testing**
  - [ ] Annual penetration test scheduled
  - [ ] Findings documented and remediated
  - [ ] Retest after remediation
  - [ ] Report archived securely

- [ ] **Security Testing**
  - [ ] SQL injection testing
  - [ ] XSS testing
  - [ ] CSRF testing
  - [ ] Authentication bypass testing
  - [ ] Authorization testing
  - [ ] Rate limiting testing

---

## 📊 Security Metrics

### Track These Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Mean Time to Detect (MTTD) | < 1 hour | | |
| Mean Time to Respond (MTTR) | < 4 hours | | |
| Critical Vulnerabilities | 0 | | |
| High Vulnerabilities | < 5 | | |
| Failed Login Rate | < 1% | | |
| API Error Rate | < 0.1% | | |
| Backup Success Rate | 100% | | |
| Uptime | > 99.9% | | |

---

## ✅ Audit Sign-Off

### Audit Completion

- [ ] All sections reviewed
- [ ] Critical issues addressed
- [ ] High-priority issues scheduled
- [ ] Medium/Low issues documented
- [ ] Next audit scheduled

### Signatures

**Auditor**: _________________ Date: _______

**Security Lead**: _________________ Date: _______

**CTO/Technical Lead**: _________________ Date: _______

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Vercel Security](https://vercel.com/docs/security)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)

---

## 🚨 Critical Issues Template

If critical issues are found, document here:

### Issue #1
- **Severity**: Critical/High/Medium/Low
- **Description**: 
- **Impact**: 
- **Remediation**: 
- **Timeline**: 
- **Owner**: 
- **Status**: Open/In Progress/Resolved

---

**Last Updated**: February 11, 2026  
**Next Review**: May 11, 2026  
**Contact**: tabletap416@gmail.com
