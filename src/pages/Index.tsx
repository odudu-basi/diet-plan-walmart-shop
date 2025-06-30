import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Heart, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import SignUpForm from "@/components/auth/SignUpForm";
import AuthenticatedApp from "@/components/auth/AuthenticatedApp";

const Index = () => {
  const { user, login, signUp, isLoading, error } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen fresh-gradient flex items-center justify-center p-4 pt-safe">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-green-400 border-r-transparent animate-spin animation-delay-150 mx-auto"></div>
          </div>
          <p className="text-emerald-700 font-medium">Loading Grocery Genius...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the authenticated app
  if (user) {
    return <AuthenticatedApp />;
  }

  // Otherwise show the authentication forms
  return (
    <div className="min-h-screen fresh-gradient flex flex-col safe-area-inset">
      {/* Modern Header with New Logo - Optimized for iPhone */}
      <div className="text-center px-4 pt-8 pb-6">
        <div className="flex justify-center items-center mb-6">
          {/* New Logo Design using the uploaded image */}
          <div className="relative">
            <img 
              src="/lovable-uploads/804399f0-9cfd-42fa-b9d7-d2d9d3008648.png" 
              alt="Grocery Genius Logo" 
              className="w-16 h-16 object-contain drop-shadow-lg"
            />
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-400 to-yellow-400 p-1.5 rounded-full shadow-lg">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
            Grocery Genius
          </h1>
          <p className="text-lg sm:text-xl text-emerald-800 font-medium max-w-md mx-auto px-4">
            Stop wandering grocery aisles confused
          </p>
          <p className="text-sm sm:text-base text-emerald-700 max-w-lg mx-auto leading-relaxed px-4">
            Tired of staring at shelves wondering what to buy? Grocery Genius ends grocery confusion with AI-powered meal plans
          </p>
        </div>

        {/* Feature highlights - Responsive for iPhone */}
        <div className="flex justify-center gap-3 sm:gap-6 mt-6 px-4">
          <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-full produce-shadow">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
            <span className="text-xs sm:text-sm font-medium text-emerald-800">No More Guessing</span>
          </div>
          <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-full produce-shadow">
            <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            <span className="text-xs sm:text-sm font-medium text-emerald-800">Know What to Buy</span>
          </div>
        </div>
      </div>

      {/* Modern Authentication Card - Optimized for iPhone */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8">
        <Card className="w-full max-w-sm mx-auto shadow-2xl border-0 glass-card produce-shadow">
          <CardHeader className="text-center pb-4 bg-gradient-to-r from-emerald-50/50 to-green-50/50 rounded-t-lg px-4 pt-4">
            <CardTitle className="text-xl font-bold text-emerald-900">Welcome to Grocery Genius</CardTitle>
            <CardDescription className="text-sm text-emerald-700">
              Start your smart shopping journey
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-10 bg-emerald-100/50">
                <TabsTrigger value="login" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-800">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-800">
                  Get Started
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-0">
                <LoginForm 
                  onLogin={login}
                  isLoading={isLoading}
                  error={error}
                />
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <SignUpForm 
                  onSignUp={signUp}
                  isLoading={isLoading}
                  error={error}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Modern Footer - Compact for iPhone */}
      <div className="text-center px-4 pb-safe">
        <p className="text-sm text-emerald-700 leading-relaxed max-w-sm mx-auto">
          Join thousands who've stopped grocery store confusion and revolutionized their meal planning
        </p>
      </div>
    </div>
  );
};

export default Index;
