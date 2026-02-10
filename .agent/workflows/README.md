# 🔄 Table-Tap Workflows

Automated workflows and procedures for common development tasks.

## Available Workflows

### Development
- **`/setup-dev`** - Set up development environment
  - Install dependencies
  - Configure environment variables
  - Start development servers
  - Verify setup

### Deployment
- **`/deploy`** - Deploy application to production
  - Run tests
  - Build application
  - Deploy to Vercel
  - Verify deployment
  - Monitor for issues

### Infrastructure
- **`/create-edge-function`** - Add new Edge Function
  - Create function template
  - Implement rate limiting
  - Test locally
  - Deploy to Supabase
  - Integrate with frontend

- **`/backup-database`** - Backup and restore procedures
  - Verify automated backups
  - Perform manual backup
  - Test restore monthly
  - Emergency recovery

- **`/security-audit`** - Run security audit
  - Automated vulnerability scans
  - Manual security checklist
  - Document findings
  - Address issues
  - Schedule next audit

## How to Use Workflows

### In Chat
Simply type the workflow command:
```
/setup-dev
```

The AI will guide you through each step of the workflow.

### Manually
Navigate to `.agent/workflows/` and open the relevant markdown file:
```bash
cat .agent/workflows/setup-dev.md
```

## Workflow Features

### Turbo Mode
Steps marked with `// turbo` can be auto-executed:
```bash
// turbo
npm install
```

### Checklists
Interactive checklists for verification:
- [ ] Step completed
- [ ] Tests passing
- [ ] Deployment successful

### Code Snippets
Ready-to-use commands and code:
```bash
npm run dev
```

## Creating New Workflows

1. Create new file in `.agent/workflows/`
2. Use this template:

```markdown
---
description: Short description of workflow
---

# Workflow Title

Brief overview of what this workflow does.

## Prerequisites
- Requirement 1
- Requirement 2

## Steps

### 1. Step Title
Description of step

\`\`\`bash
# Commands
\`\`\`

### 2. Next Step
...

## Troubleshooting
Common issues and solutions

## Checklist
- [ ] Item 1
- [ ] Item 2
```

3. Add to this index

## Workflow Maintenance

- **Review**: Quarterly
- **Update**: When processes change
- **Test**: Before major releases

## Quick Reference

| Workflow | Use When | Frequency |
|----------|----------|-----------|
| `/setup-dev` | New developer onboarding | Once |
| `/deploy` | Deploying to production | As needed |
| `/create-edge-function` | Adding new API endpoint | As needed |
| `/backup-database` | Database backup/restore | Weekly |
| `/security-audit` | Security review | Quarterly |

## Related Documentation

- Infrastructure: `docs/INFRASTRUCTURE_ANALYSIS.md`
- Testing: `docs/TESTING_GUIDE.md`
- Security: `docs/SECURITY_AUDIT.md`
- Backups: `docs/BACKUP_RESTORE.md`
- Sentry: `docs/SENTRY_SETUP.md`

---

**Last Updated**: February 11, 2026  
**Maintained By**: Development Team
