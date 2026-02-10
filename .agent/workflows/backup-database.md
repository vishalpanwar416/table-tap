---
description: Perform database backup and verify restore
---

# Database Backup Workflow

Regular backup and verification procedure for Table-Tap database.

## Frequency
- **Automated**: Daily (Supabase)
- **Manual**: Weekly
- **Restore Test**: Monthly

## Steps

### 1. Verify Automated Backups

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Database** → **Backups**
4. Verify latest backup:
   - [ ] Backup completed successfully
   - [ ] Backup size is reasonable
   - [ ] Timestamp is recent (< 24 hours)

### 2. Perform Manual Backup

**Using Supabase CLI**:
// turbo
```bash
cd supabase

# Full database backup
supabase db dump -f backups/backup-$(date +%Y%m%d).sql

# Schema only
supabase db dump --schema public -f backups/schema-$(date +%Y%m%d).sql
```

**Using pg_dump** (alternative):
```bash
# Get connection string from Supabase dashboard
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -F c \
  -f backups/backup-$(date +%Y%m%d).dump
```

### 3. Backup Storage Files

```bash
# Backup avatars bucket
supabase storage download avatars \
  --recursive \
  --destination backups/storage/avatars-$(date +%Y%m%d)
```

### 4. Backup System Settings

```bash
# Run backup script
node scripts/backup-settings.js backups/
```

Or manually via SQL:
```sql
COPY (
  SELECT json_agg(row_to_json(t))
  FROM (
    SELECT key, value, category, is_public, description
    FROM public.system_settings
  ) t
) TO '/tmp/system_settings_backup.json';
```

### 5. Compress and Store

```bash
# Create compressed archive
tar -czf backups/backup-$(date +%Y%m%d).tar.gz \
  backups/backup-$(date +%Y%m%d).sql \
  backups/storage/ \
  backups/system_settings_*.json

# Upload to cloud storage (if configured)
# aws s3 cp backups/backup-$(date +%Y%m%d).tar.gz s3://your-bucket/backups/
```

### 6. Verify Backup Integrity

```bash
# Check file size
ls -lh backups/backup-$(date +%Y%m%d).tar.gz

# Verify archive
tar -tzf backups/backup-$(date +%Y%m%d).tar.gz | head -20

# Test extraction
mkdir -p backups/test
tar -xzf backups/backup-$(date +%Y%m%d).tar.gz -C backups/test
```

### 7. Document Backup

Create backup log entry:
```
Date: [Date]
Type: Manual Weekly Backup
Size: [Size in MB]
Files:
  - Database: backup-YYYYMMDD.sql
  - Storage: avatars-YYYYMMDD/
  - Settings: system_settings_YYYYMMDD.json
Status: Success
Notes: [Any issues or observations]
```

## Monthly Restore Test

**Perform this monthly to verify backups work!**

### 1. Set Up Test Environment

```bash
# Create test Supabase project or use staging
# DO NOT test on production!
```

### 2. Restore Database

```bash
# Using Supabase CLI
psql "postgresql://postgres:[TEST_PASSWORD]@[TEST_HOST]:5432/postgres" \
  < backups/backup-YYYYMMDD.sql
```

### 3. Verify Restore

```sql
-- Check table counts
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Verify critical tables
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM restaurants;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM system_settings;
```

### 4. Test Application

1. Point test app to restored database
2. Test critical functions:
   - [ ] User login
   - [ ] View restaurants
   - [ ] View orders
   - [ ] System settings load

### 5. Document Results

```
Restore Test - [Date]
Backup File: backup-YYYYMMDD.sql
Restore Time: [Minutes]
Status: Success/Failed
Issues: [Any problems encountered]
Data Integrity: Verified
Application Test: Passed
```

## Backup Retention Policy

- **Daily Backups**: 30 days
- **Weekly Backups**: 90 days
- **Monthly Backups**: 1 year
- **Yearly Backups**: 7 years (for compliance)

## Cleanup Old Backups

```bash
# Delete backups older than 90 days
find backups/ -name "backup-*.tar.gz" -mtime +90 -delete

# Or manually review and delete
ls -lt backups/
```

## Emergency Restore Procedure

If production database is corrupted:

### 1. Assess Damage
- What data is affected?
- When did corruption occur?
- Which backup to use?

### 2. Notify Team
- Alert all team members
- Put app in maintenance mode
- Communicate to users if needed

### 3. Restore from Backup

**Using Supabase Dashboard**:
1. Go to Database → Backups
2. Select backup before corruption
3. Click "Restore"
4. Confirm (THIS WILL OVERWRITE CURRENT DATA)
5. Wait for completion

**Using Manual Backup**:
```bash
# Restore database
psql "$DATABASE_URL" < backups/backup-YYYYMMDD.sql

# Restore storage
supabase storage upload avatars \
  --recursive \
  backups/storage/avatars-YYYYMMDD

# Restore settings
node scripts/restore-settings.js backups/system_settings_YYYYMMDD.json
```

### 4. Verify Restore
- Check data integrity
- Test critical functions
- Verify user access

### 5. Resume Operations
- Remove maintenance mode
- Monitor for issues
- Document incident

## Backup Checklist

**Weekly** (Every Sunday):
- [ ] Verify automated backup completed
- [ ] Perform manual backup
- [ ] Backup storage files
- [ ] Backup system settings
- [ ] Compress and archive
- [ ] Verify backup integrity
- [ ] Document backup

**Monthly** (First Sunday):
- [ ] Perform restore test
- [ ] Verify data integrity
- [ ] Test application
- [ ] Document results
- [ ] Clean up old backups

**Quarterly**:
- [ ] Review backup strategy
- [ ] Update documentation
- [ ] Test disaster recovery plan

## Troubleshooting

### Backup fails
- Check disk space
- Verify database connection
- Check Supabase status

### Restore fails
- Verify backup file integrity
- Check PostgreSQL version compatibility
- Review error logs

### Backup too large
- Consider incremental backups
- Compress with higher ratio
- Archive old data

## Resources

- Full Guide: `docs/BACKUP_RESTORE.md`
- Supabase Backups: https://supabase.com/docs/guides/platform/backups
- PostgreSQL Backup: https://www.postgresql.org/docs/current/backup.html
