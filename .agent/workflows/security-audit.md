---
description: Run security audit and address findings
---

# Security Audit Workflow

Complete security audit process for the Table-Tap application.

## Frequency
- **Full Audit**: Quarterly (every 3 months)
- **Quick Check**: Monthly
- **After Major Changes**: As needed

## Steps

### 1. Prepare for Audit

```bash
# Update all dependencies
cd table-tap-app
npm update
npm audit

cd ../table-tap-landing
npm update
npm audit
```

### 2. Run Automated Scans

**Dependency Vulnerabilities**:
```bash
# Check for vulnerabilities
npm audit

# Fix non-breaking issues
npm audit fix

# Review breaking changes
npm audit fix --force  # Use with caution
```

**Code Quality**:
```bash
# Run linter
npm run lint

# Check for security issues
npx eslint . --ext .js,.jsx
```

### 3. Complete Security Checklist

Open `docs/SECURITY_AUDIT.md` and go through each section:

**Critical Sections** (Priority 1):
1. Authentication & Authorization
2. Database Security (RLS policies)
3. API & Edge Functions
4. Secret Management

**Important Sections** (Priority 2):
5. Frontend Security
6. Infrastructure & Deployment
7. Third-Party Integrations

**Review Sections** (Priority 3):
8. Data Protection
9. Monitoring & Incident Response

### 4. Document Findings

Create audit report:

```markdown
# Security Audit Report - [Date]

## Summary
- Auditor: [Name]
- Date: [Date]
- Duration: [Hours]
- Critical Issues: [Count]
- High Issues: [Count]
- Medium Issues: [Count]
- Low Issues: [Count]

## Critical Issues

### Issue #1: [Title]
- **Severity**: Critical
- **Description**: [Details]
- **Impact**: [What could happen]
- **Remediation**: [How to fix]
- **Timeline**: [When to fix by]
- **Owner**: [Who will fix]
- **Status**: Open

## Action Plan

1. [Critical issue 1] - Due: [Date]
2. [Critical issue 2] - Due: [Date]
...
```

### 5. Address Critical Issues

**Immediate** (within 24 hours):
- Authentication bypasses
- SQL injection vulnerabilities
- Exposed secrets/credentials
- Critical dependency vulnerabilities

**High Priority** (within 7 days):
- XSS vulnerabilities
- CSRF vulnerabilities
- High-severity dependency issues
- Missing rate limiting

**Medium Priority** (within 30 days):
- Medium-severity vulnerabilities
- Missing security headers
- Weak encryption

### 6. Test Fixes

For each fix:
```bash
# Run tests
npm test

# Test specific functionality
# [Manual testing steps]

# Deploy to staging
git push origin staging

# Verify fix in staging
# [Verification steps]
```

### 7. Update Security Documentation

```bash
# Update security audit checklist
vim docs/SECURITY_AUDIT.md

# Add any new security measures
vim docs/SECURITY_BEST_PRACTICES.md  # If exists

# Commit changes
git add docs/
git commit -m "docs: update security documentation after audit"
```

### 8. Schedule Next Audit

Add to calendar:
- **Next Full Audit**: [Date + 3 months]
- **Next Quick Check**: [Date + 1 month]

## Quick Monthly Check

For monthly checks, focus on:

1. **Dependency Updates**
   ```bash
   npm audit
   ```

2. **Sentry Error Review**
   - Check for security-related errors
   - Review unusual patterns

3. **Access Log Review**
   - Check Supabase logs
   - Look for suspicious activity

4. **Backup Verification**
   - Confirm backups running
   - Test restore if needed

5. **SSL Certificate Check**
   - Verify certificates valid
   - Check expiration dates

## Common Vulnerabilities to Check

### 1. SQL Injection
- [ ] All database queries use parameterized queries
- [ ] RLS policies properly configured
- [ ] Input validation on all user inputs

### 2. XSS (Cross-Site Scripting)
- [ ] React's built-in escaping used
- [ ] No dangerouslySetInnerHTML without sanitization
- [ ] Content Security Policy headers set

### 3. CSRF (Cross-Site Request Forgery)
- [ ] SameSite cookie attribute set
- [ ] CSRF tokens for sensitive operations
- [ ] Origin validation on backend

### 4. Authentication Issues
- [ ] JWT properly verified
- [ ] Session timeout configured
- [ ] MFA available for admins
- [ ] Password policies enforced

### 5. Authorization Issues
- [ ] RLS policies on all tables
- [ ] Role checks in Edge Functions
- [ ] Frontend hides unauthorized UI
- [ ] Backend enforces permissions

## Emergency Response

If critical vulnerability found:

1. **Assess Impact**
   - How many users affected?
   - What data at risk?
   - Is it being exploited?

2. **Immediate Mitigation**
   - Disable affected feature if needed
   - Deploy hotfix ASAP
   - Monitor for exploitation

3. **Communication**
   - Notify team immediately
   - Prepare user communication if needed
   - Document incident

4. **Post-Incident**
   - Root cause analysis
   - Update procedures
   - Train team

## Audit Completion Checklist

- [ ] All sections of security checklist reviewed
- [ ] Findings documented
- [ ] Critical issues addressed
- [ ] High-priority issues scheduled
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Next audit scheduled
- [ ] Team notified of changes

## Resources

- Security Checklist: `docs/SECURITY_AUDIT.md`
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Supabase Security: https://supabase.com/docs/guides/platform/security
