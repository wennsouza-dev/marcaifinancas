-- 1. Drop existing unique constraint dynamically
DO $$
DECLARE
    const_name text;
BEGIN
    SELECT constraint_name INTO const_name
    FROM information_schema.table_constraints
    WHERE table_name = 'monthly_budgets' 
      AND constraint_type = 'UNIQUE'
      AND table_schema = 'public'
    LIMIT 1;

    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE monthly_budgets DROP CONSTRAINT ' || const_name;
    END IF;
END $$;

-- 2. Add new columns
ALTER TABLE monthly_budgets ADD COLUMN month INT;
ALTER TABLE monthly_budgets ADD COLUMN year INT;

-- 3. Backfill existing records (assuming they were active for the current month)
UPDATE monthly_budgets SET month = EXTRACT(MONTH FROM CURRENT_DATE), year = EXTRACT(YEAR FROM CURRENT_DATE) WHERE month IS NULL;

-- 4. Require the new columns
ALTER TABLE monthly_budgets ALTER COLUMN month SET NOT NULL;
ALTER TABLE monthly_budgets ALTER COLUMN year SET NOT NULL;

-- 5. Add new composite constraint
ALTER TABLE monthly_budgets ADD CONSTRAINT monthly_budgets_user_category_month_year_key UNIQUE(user_id, category, month, year);
