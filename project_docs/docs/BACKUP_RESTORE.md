# 💾 Backup & Restore Procedures - Table Tap

## Overview
Comprehensive backup and disaster recovery procedures for the Table-Tap Supabase backend.

---

## 🎯 Backup Strategy

### What Gets Backed Up

| Component | Frequency | Retention | Method |
|-----------|-----------|-----------|--------|
| **Database** | Daily | 30 days | Supabase Auto + Manual |
| **Storage (Avatars)** | Weekly | 90 days | Manual Export |
| **Edge Functions** | On Deploy | Git History | Version Control |
| **System Settings** | Daily | 30 days | Database Backup |
| **Environment Variables** | Manual | Indefinite | Secure Documentation |

---

## 📊 Supabase Automated Backups

### What Supabase Backs Up Automatically

✅ **Database (PostgreSQL)**
- **Frequency**: Daily (Pro plan) or Weekly (Free plan)
- **Retention**: 7 days (Free), 30 days (Pro)
- **Point-in-Time Recovery**: Available on Pro plan
- **Location**: Managed by Supabase

✅ **What's Included**:
- All tables and data
- Database schema
- Functions and triggers
- RLS policies
- Indexes

❌ **What's NOT Included**:
- Storage bucket files
- Edge Function code (stored in Git)
- Environment variables

### Accessing Supabase Backups

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Database** → **Backups**
4. View available backups and restore points

---

## 🔄 Manual Backup Procedures

### 1. Database Backup (SQL Dump)

#### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Create database dump
supabase db dump -f backup-$(date +%Y%m%d).sql

# Dump specific schema only
supabase db dump --schema public -f backup-public-$(date +%Y%m%d).sql
```

#### Using pg_dump (Direct Connection)

```bash
# Get connection string from Supabase Dashboard → Settings → Database
# Format: postgresql://postgres:[password]@[host]:5432/postgres

# Full database backup
pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" \
  -F c \
  -f backup-$(date +%Y%m%d).dump

# Schema only (no data)
pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" \
  --schema-only \
  -f schema-$(date +%Y%m%d).sql

# Data only (no schema)
pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" \
  --data-only \
  -f data-$(date +%Y%m%d).sql
```

### 2. Storage Backup (Files)

#### Backup Avatar Images

```bash
# Install Supabase CLI
npm install -g supabase

# Download all files from avatars bucket
supabase storage download avatars \
  --recursive \
  --destination ./backups/storage/avatars-$(date +%Y%m%d)
```

#### Using Supabase JavaScript Client

```javascript
// backup-storage.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backupStorage() {
  const { data: files, error } = await supabase
    .storage
    .from('avatars')
    .list();

  if (error) throw error;

  for (const file of files) {
    const { data, error } = await supabase
      .storage
      .from('avatars')
      .download(file.name);

    if (error) throw error;

    const buffer = await data.arrayBuffer();
    fs.writeFileSync(
      path.join('./backups/storage', file.name),
      Buffer.from(buffer)
    );
  }

  console.log(`Backed up ${files.length} files`);
}

backupStorage();
```

### 3. System Settings Backup

```sql
-- Export system settings to JSON
COPY (
  SELECT json_agg(row_to_json(t))
  FROM (
    SELECT key, value, category, is_public, description
    FROM public.system_settings
  ) t
) TO '/tmp/system_settings_backup.json';
```

Or using Supabase client:

```javascript
// backup-settings.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backupSystemSettings() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*');

  if (error) throw error;

  fs.writeFileSync(
    `./backups/system_settings_${new Date().toISOString().split('T')[0]}.json`,
    JSON.stringify(data, null, 2)
  );

  console.log(`Backed up ${data.length} system settings`);
}

backupSystemSettings();
```

---

## 🔙 Restore Procedures

### 1. Database Restore

#### From Supabase Automated Backup

1. Go to **Supabase Dashboard** → **Database** → **Backups**
2. Select the backup you want to restore
3. Click **"Restore"**
4. **⚠️ WARNING**: This will overwrite your current database!
5. Confirm the restore operation
6. Wait for completion (can take several minutes)

#### From Manual SQL Dump

```bash
# Using Supabase CLI
supabase db reset --db-url "postgresql://postgres:[password]@[host]:5432/postgres"

# Then apply your backup
psql "postgresql://postgres:[password]@[host]:5432/postgres" < backup-20260211.sql
```

#### From pg_dump File

```bash
# Restore from custom format dump
pg_restore -d "postgresql://postgres:[password]@[host]:5432/postgres" \
  --clean \
  --if-exists \
  backup-20260211.dump

# Restore from SQL file
psql "postgresql://postgres:[password]@[host]:5432/postgres" < backup-20260211.sql
```

### 2. Storage Restore

```bash
# Upload files back to Supabase Storage
supabase storage upload avatars \
  --recursive \
  ./backups/storage/avatars-20260211
```

Or using JavaScript:

```javascript
// restore-storage.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreStorage(backupDir) {
  const files = fs.readdirSync(backupDir);

  for (const filename of files) {
    const filePath = path.join(backupDir, filename);
    const fileBuffer = fs.readFileSync(filePath);

    const { error } = await supabase
      .storage
      .from('avatars')
      .upload(filename, fileBuffer, {
        upsert: true,
      });

    if (error) {
      console.error(`Failed to upload ${filename}:`, error);
    } else {
      console.log(`Restored ${filename}`);
    }
  }
}

restoreStorage('./backups/storage/avatars-20260211');
```

### 3. System Settings Restore

```javascript
// restore-settings.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreSystemSettings(backupFile) {
  const settings = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

  for (const setting of settings) {
    const { error } = await supabase
      .from('system_settings')
      .upsert(setting, { onConflict: 'key' });

    if (error) {
      console.error(`Failed to restore ${setting.key}:`, error);
    }
  }

  console.log(`Restored ${settings.length} settings`);
}

restoreSystemSettings('./backups/system_settings_2026-02-11.json');
```

---

## 🚨 Disaster Recovery Plan

### Scenario 1: Accidental Data Deletion

**Impact**: High  
**Recovery Time**: 15-30 minutes

**Steps**:
1. Immediately stop all write operations
2. Identify the time of deletion
3. Restore from most recent backup before deletion
4. Verify data integrity
5. Resume operations

### Scenario 2: Database Corruption

**Impact**: Critical  
**Recovery Time**: 30-60 minutes

**Steps**:
1. Switch to maintenance mode
2. Assess corruption extent
3. Restore from latest healthy backup
4. Run integrity checks
5. Test critical functions
6. Resume operations

### Scenario 3: Complete Supabase Outage

**Impact**: Critical  
**Recovery Time**: 2-4 hours

**Steps**:
1. Activate status page
2. Spin up new Supabase project
3. Restore database from latest backup
4. Restore storage files
5. Update DNS/environment variables
6. Deploy Edge Functions
7. Test all critical paths
8. Switch traffic to new instance

### Scenario 4: Ransomware/Security Breach

**Impact**: Critical  
**Recovery Time**: 4-8 hours

**Steps**:
1. Immediately isolate affected systems
2. Assess breach scope
3. Create new Supabase project with new credentials
4. Restore from backup BEFORE breach
5. Implement additional security measures
6. Audit all access logs
7. Notify affected users (if required)
8. Resume operations with enhanced monitoring

---

## 📅 Backup Schedule

### Daily Backups (Automated)
- **Time**: 2:00 AM UTC
- **What**: Full database snapshot
- **Retention**: 30 days
- **Verification**: Weekly spot checks

### Weekly Backups (Manual)
- **Day**: Sunday
- **Time**: 3:00 AM UTC
- **What**: Database + Storage + Settings
- **Retention**: 90 days
- **Location**: Secure cloud storage (AWS S3/Google Cloud Storage)

### Monthly Backups (Archive)
- **Day**: 1st of month
- **What**: Complete system snapshot
- **Retention**: 1 year
- **Location**: Cold storage

---

## ✅ Backup Verification Checklist

### Weekly Verification
- [ ] Confirm automated backup completed
- [ ] Check backup file size (should be consistent)
- [ ] Verify backup is accessible
- [ ] Test restore to staging environment (monthly)

### Monthly Verification
- [ ] Full restore test to clean environment
- [ ] Verify all tables and data
- [ ] Test critical application functions
- [ ] Document any issues
- [ ] Update recovery procedures if needed

---

## 🔐 Backup Security

### Encryption
- ✅ Backups encrypted at rest (Supabase default)
- ✅ Backups encrypted in transit (TLS)
- ✅ Manual backups should be encrypted before storage

### Access Control
- ✅ Limit backup access to admins only
- ✅ Use separate credentials for backup operations
- ✅ Enable MFA for backup system access
- ✅ Audit backup access logs monthly

### Storage
- ✅ Store backups in different region than production
- ✅ Use versioned storage (prevent accidental deletion)
- ✅ Implement lifecycle policies for old backups
- ✅ Test backup retrieval quarterly

---

## 📊 Backup Monitoring

### Metrics to Track
1. **Backup Success Rate**: Should be 100%
2. **Backup Size**: Monitor for unexpected changes
3. **Backup Duration**: Alert if > 2x normal time
4. **Storage Usage**: Ensure adequate space
5. **Restore Test Success**: Monthly verification

### Alerts to Configure
- ❌ Backup failed
- ⚠️ Backup size deviation > 50%
- ⚠️ Backup duration > 30 minutes
- ⚠️ Storage usage > 80%
- ❌ Restore test failed

---

## 🛠️ Tools & Scripts

### Automated Backup Script

Create `scripts/backup.sh`:
```bash
#!/bin/bash

# Configuration
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"
PROJECT_REF="your-project-ref"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
echo "Backing up database..."
supabase db dump -f "$BACKUP_DIR/database.sql"

# Backup storage
echo "Backing up storage..."
supabase storage download avatars \
  --recursive \
  --destination "$BACKUP_DIR/storage"

# Backup system settings
echo "Backing up system settings..."
node scripts/backup-settings.js "$BACKUP_DIR"

# Compress backup
echo "Compressing backup..."
tar -czf "backups/backup-$DATE.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

# Upload to cloud storage (optional)
# aws s3 cp "backups/backup-$DATE.tar.gz" s3://your-bucket/backups/

echo "Backup completed: backup-$DATE.tar.gz"
```

### Automated Restore Script

Create `scripts/restore.sh`:
```bash
#!/bin/bash

# Usage: ./restore.sh backup-20260211_120000.tar.gz

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup-file.tar.gz>"
  exit 1
fi

# Extract backup
echo "Extracting backup..."
tar -xzf "$BACKUP_FILE"
BACKUP_DIR=$(basename "$BACKUP_FILE" .tar.gz)

# Restore database
echo "Restoring database..."
psql "$DATABASE_URL" < "$BACKUP_DIR/database.sql"

# Restore storage
echo "Restoring storage..."
supabase storage upload avatars \
  --recursive \
  "$BACKUP_DIR/storage"

# Restore settings
echo "Restoring system settings..."
node scripts/restore-settings.js "$BACKUP_DIR/system_settings.json"

echo "Restore completed!"
```

---

## 📚 Additional Resources

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
- [Disaster Recovery Planning](https://www.ready.gov/business/implementation/IT)

---

## ✅ Implementation Checklist

- [ ] Set up automated daily backups
- [ ] Configure weekly manual backups
- [ ] Create backup scripts
- [ ] Test restore procedure
- [ ] Document credentials securely
- [ ] Set up backup monitoring
- [ ] Schedule monthly restore tests
- [ ] Train team on procedures
- [ ] Create runbook for emergencies
- [ ] Review and update quarterly

---

**Last Updated**: February 11, 2026  
**Contact**: tabletap416@gmail.com  
**Emergency Contact**: [Your 24/7 contact]
