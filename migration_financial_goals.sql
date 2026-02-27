-- Migration: Create financial_goals table
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  emoji TEXT DEFAULT '🎯',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goals"
  ON financial_goals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
