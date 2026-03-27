-- Add missing DELETE policy on sync_history
-- Run in Supabase SQL Editor

create policy "Users can delete own sync history"
  on public.sync_history for delete
  using (auth.uid() = user_id);
