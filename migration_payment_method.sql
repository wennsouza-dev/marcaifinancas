-- Migration: Add payment_method column to transactions table

-- 1. Create a variable for easy updates if needed
-- The options are: 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência', 'Dinheiro'
-- We'll just use a generic text column to keep it simple, without hard constraints,
-- allowing flexibility for future new options.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'payment_method') THEN
        ALTER TABLE public.transactions ADD COLUMN payment_method text;
    END IF;
END $$;
