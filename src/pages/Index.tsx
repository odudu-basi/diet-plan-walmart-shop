
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Sparkles, Heart, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import SignUpForm from "@/components/auth/SignUpForm";
import AuthenticatedApp from "@/components/auth/AuthenticatedApp";

const Index = () => {
  const { user, login, signUp, isLoading, error } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen fresh-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-green-400 border-r-transparent animate-spin animation-delay-150 mx-auto"></div>
          </div>
          <p className="text-emerald-700 font-medium">Loading FreshCart...</p>
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
    <div className="min-h-screen fresh-gradient p-4 flex flex-col">
      {/* Modern Header with New Logo */}
      <div className="text-center py-12 px-4">
        <div className="flex justify-center items-center mb-8">
          {/* Modern Logo Design */}
          <div className="relative">
            <div className="gradient-fresh p-4 rounded-2xl shadow-lg transform rotate-12 produce-shadow">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-yellow-400 p-2 rounded-full shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
            FreshCart
          </h1>
          <p className="text-xl text-emerald-800 font-medium max-w-md mx-auto">
            Stop wandering grocery aisles confused
          </p>
          <p className="text-emerald-700 max-w-lg mx-auto leading-relaxed">
            Tired of staring at shelves wondering what to buy? FreshCart ends grocery confusion with AI-powered meal plans
          </p>
        </div>

        {/* Feature highlights */}
        <div className="flex justify-center gap-6 mt-8">
          <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-full produce-shadow">
            <Zap className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">No More Guessing</span>
          </div>
          <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-full produce-shadow">
            <Heart className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-emerald-800">Know What to Buy</span>
          </div>
        </div>
      </div>

      {/* Modern Authentication Card */}
      <div className="flex-1 flex items-start justify-center px-4">
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 glass-card produce-shadow">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-emerald-50/50 to-green-50/50 rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-emerald-900">Welcome to FreshCart</CardTitle>
            <CardDescription className="text-base text-emerald-700">
              Start your smart shopping journey
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-emerald-100/50">
                <TabsTrigger value="login" className="text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-800">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-800">
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

      {/* Modern Footer */}
      <div className="text-center py-8 px-4">
        <p className="text-emerald-700 leading-relaxed max-w-md mx-auto">
          Join thousands who've stopped grocery store confusion and revolutionized their meal planning
        </p>
      </div>
    </div>
  );
};

export default Index;
