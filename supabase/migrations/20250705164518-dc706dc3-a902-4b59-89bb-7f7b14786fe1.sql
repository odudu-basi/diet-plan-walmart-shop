
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  age INTEGER,
  weight NUMERIC,
  height NUMERIC,
  target_weight NUMERIC,
  goal TEXT,
  activity_level TEXT,
  dietary_restrictions TEXT[],
  allergies TEXT,
  budget_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meal_plans table
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meals table
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  recipe_instructions TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER DEFAULT 1,
  calories_per_serving INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meal_ingredients table
CREATE TABLE public.meal_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.meals ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  category TEXT,
  estimated_cost NUMERIC
);

-- Create shopping_lists table
CREATE TABLE public.shopping_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES public.meal_plans ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  total_estimated_cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shopping_list_items table
CREATE TABLE public.shopping_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  category TEXT,
  estimated_cost NUMERIC,
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  notes TEXT
);

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

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- RLS policies for meal_plans
CREATE POLICY "Users can view their own meal plans" 
  ON public.meal_plans 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plans" 
  ON public.meal_plans 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans" 
  ON public.meal_plans 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans" 
  ON public.meal_plans 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for meals
CREATE POLICY "Users can view meals in their meal plans" 
  ON public.meals 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.meal_plans 
    WHERE meal_plans.id = meals.meal_plan_id 
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can create meals in their meal plans" 
  ON public.meals 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.meal_plans 
    WHERE meal_plans.id = meals.meal_plan_id 
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update meals in their meal plans" 
  ON public.meals 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.meal_plans 
    WHERE meal_plans.id = meals.meal_plan_id 
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete meals in their meal plans" 
  ON public.meals 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.meal_plans 
    WHERE meal_plans.id = meals.meal_plan_id 
    AND meal_plans.user_id = auth.uid()
  ));

-- RLS policies for meal_ingredients
CREATE POLICY "Users can view ingredients in their meals" 
  ON public.meal_ingredients 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.meals 
    JOIN public.meal_plans ON meal_plans.id = meals.meal_plan_id
    WHERE meals.id = meal_ingredients.meal_id 
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can create ingredients in their meals" 
  ON public.meal_ingredients 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.meals 
    JOIN public.meal_plans ON meal_plans.id = meals.meal_plan_id
    WHERE meals.id = meal_ingredients.meal_id 
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update ingredients in their meals" 
  ON public.meal_ingredients 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.meals 
    JOIN public.meal_plans ON meal_plans.id = meals.meal_plan_id
    WHERE meals.id = meal_ingredients.meal_id 
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete ingredients in their meals" 
  ON public.meal_ingredients 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.meals 
    JOIN public.meal_plans ON meal_plans.id = meals.meal_plan_id
    WHERE meals.id = meal_ingredients.meal_id 
    AND meal_plans.user_id = auth.uid()
  ));

-- RLS policies for shopping_lists
CREATE POLICY "Users can view their own shopping lists" 
  ON public.shopping_lists 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shopping lists" 
  ON public.shopping_lists 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping lists" 
  ON public.shopping_lists 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping lists" 
  ON public.shopping_lists 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for shopping_list_items
CREATE POLICY "Users can view items in their shopping lists" 
  ON public.shopping_list_items 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.shopping_lists 
    WHERE shopping_lists.id = shopping_list_items.shopping_list_id 
    AND shopping_lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can create items in their shopping lists" 
  ON public.shopping_list_items 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.shopping_lists 
    WHERE shopping_lists.id = shopping_list_items.shopping_list_id 
    AND shopping_lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can update items in their shopping lists" 
  ON public.shopping_list_items 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.shopping_lists 
    WHERE shopping_lists.id = shopping_list_items.shopping_list_id 
    AND shopping_lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items in their shopping lists" 
  ON public.shopping_list_items 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.shopping_lists 
    WHERE shopping_lists.id = shopping_list_items.shopping_list_id 
    AND shopping_lists.user_id = auth.uid()
  ));

-- RLS policies for feature_flags (readable by all authenticated users)
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

-- RLS policies for app_config (readable by all authenticated users)
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

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample feature flags
INSERT INTO public.feature_flags (name, description, enabled) VALUES
  ('new-meal-planner', 'Enhanced meal planning interface', false),
  ('advanced-nutrition', 'Advanced nutrition tracking', false),
  ('social-sharing', 'Share meal plans with friends', false);

-- Insert sample app config
INSERT INTO public.app_config (key, value, type, description) VALUES
  ('max_meal_plans', '10', 'number', 'Maximum meal plans per user'),
  ('app_maintenance', 'false', 'boolean', 'App maintenance mode'),
  ('welcome_message', 'Welcome to FreshCart!', 'string', 'Welcome message for new users');
