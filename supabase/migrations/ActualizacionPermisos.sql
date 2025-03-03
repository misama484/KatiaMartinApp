/*
  # Add user authentication fields to workers table

  1. Changes
    - Add user_id column to link workers to auth.users
    - Add user_role column to store role (worker or admin)
    - Add must_change_password flag
  2. Security
    - Update RLS policies to include user_id checks
*/

-- Add new columns to workers table
ALTER TABLE workers ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'worker';
ALTER TABLE workers ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);
CREATE INDEX IF NOT EXISTS idx_workers_email ON workers(email);

-- Update RLS policies for workers
DROP POLICY IF EXISTS "Allow authenticated full access to workers" ON workers;

-- Workers can only view and edit their own profile
CREATE POLICY "Workers can view and edit their own profile" ON workers
  FOR ALL
  USING (
    (auth.uid() = user_id AND user_role = 'worker') OR
    (auth.jwt() ->> 'user_role' = 'admin')
  );

-- Admins can view and edit all workers
CREATE POLICY "Admins can view and edit all workers" ON workers
  FOR ALL
  USING (auth.jwt() ->> 'user_role' = 'admin');