-- Recurring Transactions Table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    category TEXT NOT NULL,
    payment_method TEXT DEFAULT 'PIX',
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    last_generated_month INTEGER,
    last_generated_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recurring"
ON recurring_transactions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
