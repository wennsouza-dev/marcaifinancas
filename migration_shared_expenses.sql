-- 1. Add 'email' column to friends table
ALTER TABLE public.friends
ADD COLUMN IF NOT EXISTS email text;

-- 2. Create the RPC function to get shared expenses blindly via email
-- Drop the function first to allow changing the return table signature
DROP FUNCTION IF EXISTS get_shared_expenses_by_email(text);

CREATE OR REPLACE FUNCTION get_shared_expenses_by_email(friend_email text)
RETURNS TABLE (
    split_expense_id uuid,
    description text,
    total_amount numeric,
    installment_number integer,
    total_installments integer,
    date date, -- Fixed: changed from timestamp with time zone to date
    billing_date date,
    creator_name text,
    amount_owed numeric,
    is_paid boolean,
    participant_id uuid
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        se.id AS split_expense_id,
        se.description,
        se.amount AS total_amount,
        se.installment_number,
        se.total_installments,
        se.date,
        se.billing_date,
        u.name AS creator_name, -- Fetching the user name
        sp.amount_owed,
        sp.is_paid,
        sp.id AS participant_id
    FROM 
        public.split_expenses se
    INNER JOIN 
        public.split_participants sp ON se.id = sp.split_expense_id
    INNER JOIN 
        public.friends f ON sp.friend_id = f.id
    INNER JOIN 
        public.user_profiles u ON se.created_by = u.id
    WHERE 
        f.email = friend_email AND
        f.email IS NOT NULL AND
        f.email != ''
    ORDER BY 
        se.date DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Grand execute permission to anon (since they are not logged in)
GRANT EXECUTE ON FUNCTION get_shared_expenses_by_email(text) TO anon;
