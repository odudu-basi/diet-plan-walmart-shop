
-- Add target_weight column to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN target_weight NUMERIC;
