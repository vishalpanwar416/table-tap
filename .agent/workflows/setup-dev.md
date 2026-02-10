---
description: Set up development environment
---

# Development Setup Workflow

Complete setup guide for new developers joining the Table-Tap project.

## Prerequisites
- Node.js 18+ installed
- Git installed
- Code editor (VS Code recommended)
- Supabase account access

## Steps

### 1. Clone Repository
```bash
git clone https://github.com/your-org/Table-Tap-QR.git
cd Table-Tap-QR
```

### 2. Install Dependencies
// turbo
```bash
npm run install:all
```

This installs dependencies for:
- Root workspace
- table-tap-app
- table-tap-landing

### 3. Configure Environment Variables

**For table-tap-app** (`.env`):
```bash
cd table-tap-app
cp .env.example .env
```

Edit `.env` and add:
- `REACT_APP_SUPABASE_URL` - Get from Supabase dashboard
- `REACT_APP_SUPABASE_ANON_KEY` - Get from Supabase dashboard
- `REACT_APP_ENCRYPTION_KEY` - Generate 32-character key
- `REACT_APP_SENTRY_DSN` - Optional for development

**For table-tap-landing** (`.env.local`):
```bash
cd ../table-tap-landing
cp .env.example .env.local
```

Edit `.env.local` and add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SENTRY_DSN` - Optional for development

### 4. Set Up Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project or get access to existing
3. Run database setup:
   ```bash
   cd supabase
   # Apply all migrations
   supabase db push
   ```

### 5. Install Playwright (for E2E tests)
```bash
cd table-tap-app
npx playwright install
```

### 6. Start Development Servers

**Option 1: Start both apps**
```bash
# From root directory
npm run dev
```

This starts:
- App: http://localhost:3000
- Landing: http://localhost:3001

**Option 2: Start individually**
```bash
# App only
npm run dev:app

# Landing only
npm run dev:landing
```

### 7. Verify Setup

**Test App**:
1. Visit http://localhost:3000
2. Should see login page or customer app
3. Try signing in with Google

**Test Landing**:
1. Visit http://localhost:3001
2. Should see marketing homepage
3. Navigation should work

### 8. Run Tests
```bash
cd table-tap-app
npm test
```

**Expected**: All tests pass

## Common Issues

### Issue: "Module not found"
**Solution**: Run `npm install` in the specific directory

### Issue: "Supabase connection failed"
**Solution**: Check `.env` variables are correct

### Issue: Port already in use
**Solution**: 
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Issue: Tests failing
**Solution**: Clear cache and reinstall
```bash
rm -rf node_modules
npm install
npm test
```

## Next Steps

- [ ] Read `README.md` for project overview
- [ ] Review `docs/INFRASTRUCTURE_ANALYSIS.md`
- [ ] Check `docs/TESTING_GUIDE.md` for testing practices
- [ ] Join team Slack/Discord
- [ ] Get access to Vercel dashboard
- [ ] Get access to Sentry dashboard

## Development Tips

1. **Hot Reload**: Both apps support hot reload - changes appear instantly
2. **Debugging**: Use React DevTools and browser DevTools
3. **Database**: Use Supabase dashboard to view/edit data
4. **Logs**: Check browser console and terminal for errors
5. **Sentry**: Enable in dev with `REACT_APP_SENTRY_DEBUG=true`
