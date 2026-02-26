-- Drop the function first to allow changing the return table signature safely
DROP FUNCTION IF EXISTS get_shared_expenses_by_email(text);

CREATE OR REPLACE FUNCTION get_shared_expenses_by_email(friend_email text)
RETURNS TABLE (
    split_expense_id uuid,
    description text,
    total_amount numeric,
    installment_number integer,
    total_installments integer,
    date date,
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
        creator.name AS creator_name, -- Fetching the creator's name
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
        public.user_profiles creator ON se.created_by = creator.id
    WHERE 
        f.email IS NOT NULL AND 
        -- Ignora maiúsculas/minúsculas e espaços extras para garantir que encontre o usuário corretamente
        lower(trim(f.email)) = lower(trim(friend_email))
    ORDER BY 
        se.date DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execution to anon (for users without an account logged in)
GRANT EXECUTE ON FUNCTION get_shared_expenses_by_email(text) TO anon;
