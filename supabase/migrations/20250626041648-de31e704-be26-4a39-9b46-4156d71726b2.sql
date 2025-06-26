
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

-- Create meals table (individual meals within a meal plan)
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

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meal_plans
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

-- Create RLS policies for meals
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

-- Create RLS policies for meal_ingredients
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

-- Create RLS policies for shopping_lists
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

-- Create RLS policies for shopping_list_items
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
