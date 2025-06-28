
-- Create feature_flags table
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app_config table  
CREATE TABLE public.app_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Create policies for feature_flags (readable by all authenticated users, admin can modify)
CREATE POLICY "Anyone can view feature flags" 
  ON public.feature_flags 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage feature flags" 
  ON public.feature_flags 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for app_config (readable by all authenticated users, admin can modify)
CREATE POLICY "Anyone can view app config" 
  ON public.app_config 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage app config" 
  ON public.app_config 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert some sample feature flags
INSERT INTO public.feature_flags (name, description, enabled) VALUES
  ('new-meal-planner', 'Enhanced meal planning interface', false),
  ('advanced-nutrition', 'Advanced nutrition tracking', false),
  ('social-sharing', 'Share meal plans with friends', false);

-- Insert some sample app config
INSERT INTO public.app_config (key, value, type, description) VALUES
  ('max_meal_plans', '10', 'number', 'Maximum meal plans per user'),
  ('app_maintenance', 'false', 'boolean', 'App maintenance mode'),
  ('welcome_message', 'Welcome to FreshCart!', 'string', 'Welcome message for new users');
