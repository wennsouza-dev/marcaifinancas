-- Monthly Budgets per Category
CREATE TABLE IF NOT EXISTS monthly_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- RLS
ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own budgets"
ON monthly_budgets FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
