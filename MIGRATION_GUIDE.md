# Database Migration Guide

## Applying the Shared AI Chat Migration

To enable the shared AI chat feature, you need to run a database migration on your Supabase instance.

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/002_add_chat_role.sql`
5. Click **Run** to execute the migration

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

### What This Migration Does

This migration adds a `role` column to the `session_chat` table that distinguishes between:
- **User messages** (`role = 'user'`) - Messages from collaborators
- **Assistant messages** (`role = 'assistant'`) - AI-generated responses

### Backwards Compatibility

The migration is backwards compatible:
- Existing messages without a role will default to `'user'`
- The application will work with or without the migration (though shared AI chat requires it)

### Verification

After running the migration, verify it worked:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'session_chat' 
  AND column_name = 'role';
```

You should see the `role` column listed.

## What's New

With this migration, both users in a session will now:
- ✅ See all AI chat messages in real-time
- ✅ See when their collaborator asks AI for help
- ✅ See all AI responses and code generation
- ✅ Have complete context of the AI conversation
- ✅ Share the same AI chat history

Both users can now use AI features and see each other's AI interactions!

