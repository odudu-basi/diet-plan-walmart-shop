
import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RevenueCatProvider } from "@/hooks/useRevenueCat";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import MealPlanGenerator from "./pages/MealPlanGenerator";
import AllMealPlans from "./pages/AllMealPlans";
import WeeklyMealPlan from "./pages/WeeklyMealPlan";
import ShoppingList from "./pages/ShoppingList";
import ShoppingListDetails from "./pages/ShoppingListDetails";
import AdminPanel from "./pages/AdminPanel";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <RevenueCatProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/meal-plan-generator" element={<MealPlanGenerator />} />
                <Route path="/all-meal-plans" element={<AllMealPlans />} />
                <Route path="/meal-plan/:mealPlanId" element={<WeeklyMealPlan />} />
                <Route path="/shopping-list" element={<ShoppingList />} />
                <Route path="/shopping-list/:id" element={<ShoppingListDetails />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </RevenueCatProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
