
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  age INTEGER,
  weight NUMERIC,
  height NUMERIC,
  goal TEXT,
  activity_level TEXT,
  dietary_restrictions TEXT[],
  allergies TEXT,
  budget_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create meal plans table
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create meals table
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  recipe_instructions TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  calories_per_serving INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create meal ingredients table
CREATE TABLE public.meal_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  category TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  PRIMARY KEY (id)
);

-- Create shopping lists table
CREATE TABLE public.shopping_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  total_estimated_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create shopping list items table
CREATE TABLE public.shopping_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  category TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  is_purchased BOOLEAN DEFAULT false,
  notes TEXT,
  PRIMARY KEY (id)
);

-- Create feature flags table
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create app config table
CREATE TABLE public.app_config (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  type TEXT DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for meal_plans
CREATE POLICY "Users can view their own meal plans" ON public.meal_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plans" ON public.meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans" ON public.meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans" ON public.meal_plans
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for meals
CREATE POLICY "Users can view meals from their meal plans" ON public.meals
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM public.meal_plans WHERE id = meals.meal_plan_id
  ));

CREATE POLICY "Users can create meals for their meal plans" ON public.meals
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.meal_plans WHERE id = meals.meal_plan_id
  ));

CREATE POLICY "Users can update meals from their meal plans" ON public.meals
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM public.meal_plans WHERE id = meals.meal_plan_id
  ));

CREATE POLICY "Users can delete meals from their meal plans" ON public.meals
  FOR DELETE USING (auth.uid() IN (
    SELECT user_id FROM public.meal_plans WHERE id = meals.meal_plan_id
  ));

-- RLS Policies for meal_ingredients
CREATE POLICY "Users can view ingredients from their meals" ON public.meal_ingredients
  FOR SELECT USING (auth.uid() IN (
    SELECT mp.user_id FROM public.meal_plans mp
    JOIN public.meals m ON mp.id = m.meal_plan_id
    WHERE m.id = meal_ingredients.meal_id
  ));

CREATE POLICY "Users can create ingredients for their meals" ON public.meal_ingredients
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT mp.user_id FROM public.meal_plans mp
    JOIN public.meals m ON mp.id = m.meal_plan_id
    WHERE m.id = meal_ingredients.meal_id
  ));

CREATE POLICY "Users can update ingredients from their meals" ON public.meal_ingredients
  FOR UPDATE USING (auth.uid() IN (
    SELECT mp.user_id FROM public.meal_plans mp
    JOIN public.meals m ON mp.id = m.meal_plan_id
    WHERE m.id = meal_ingredients.meal_id
  ));

CREATE POLICY "Users can delete ingredients from their meals" ON public.meal_ingredients
  FOR DELETE USING (auth.uid() IN (
    SELECT mp.user_id FROM public.meal_plans mp
    JOIN public.meals m ON mp.id = m.meal_plan_id
    WHERE m.id = meal_ingredients.meal_id
  ));

-- RLS Policies for shopping_lists
CREATE POLICY "Users can view their own shopping lists" ON public.shopping_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shopping lists" ON public.shopping_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping lists" ON public.shopping_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping lists" ON public.shopping_lists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for shopping_list_items
CREATE POLICY "Users can view items from their shopping lists" ON public.shopping_list_items
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM public.shopping_lists WHERE id = shopping_list_items.shopping_list_id
  ));

CREATE POLICY "Users can create items for their shopping lists" ON public.shopping_list_items
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.shopping_lists WHERE id = shopping_list_items.shopping_list_id
  ));

CREATE POLICY "Users can update items from their shopping lists" ON public.shopping_list_items
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM public.shopping_lists WHERE id = shopping_list_items.shopping_list_id
  ));

CREATE POLICY "Users can delete items from their shopping lists" ON public.shopping_list_items
  FOR DELETE USING (auth.uid() IN (
    SELECT user_id FROM public.shopping_lists WHERE id = shopping_list_items.shopping_list_id
  ));

-- RLS Policies for feature_flags (public read access)
CREATE POLICY "Anyone can view feature flags" ON public.feature_flags
  FOR SELECT USING (true);

-- RLS Policies for app_config (public read access) 
CREATE POLICY "Anyone can view app config" ON public.app_config
  FOR SELECT USING (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX idx_meals_meal_plan_id ON public.meals(meal_plan_id);
CREATE INDEX idx_meal_ingredients_meal_id ON public.meal_ingredients(meal_id);
CREATE INDEX idx_shopping_lists_user_id ON public.shopping_lists(user_id);
CREATE INDEX idx_shopping_list_items_shopping_list_id ON public.shopping_list_items(shopping_list_id);
