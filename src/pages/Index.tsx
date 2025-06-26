
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-blue-500 border-r-transparent animate-spin animation-delay-150 mx-auto"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading FreshCart...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4 flex flex-col">
      {/* Modern Header with New Logo */}
      <div className="text-center py-12 px-4">
        <div className="flex justify-center items-center mb-8">
          {/* Modern Logo Design */}
          <div className="relative">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-4 rounded-2xl shadow-lg transform rotate-12">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            FreshCart
          </h1>
          <p className="text-xl text-gray-700 font-medium max-w-md mx-auto">
            Smart meal planning meets effortless shopping
          </p>
          <p className="text-gray-600 max-w-lg mx-auto leading-relaxed">
            AI-powered meal plans with Walmart pricing • Zero waste • Maximum savings
          </p>
        </div>

        {/* Feature highlights */}
        <div className="flex justify-center gap-6 mt-8">
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <Zap className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-gray-700">AI-Powered</span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-medium text-gray-700">Personalized</span>
          </div>
        </div>
      </div>

      {/* Modern Authentication Card */}
      <div className="flex-1 flex items-start justify-center px-4">
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-gray-800">Welcome to FreshCart</CardTitle>
            <CardDescription className="text-base text-gray-600">
              Start your smart shopping journey
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-gray-100/50">
                <TabsTrigger value="login" className="text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-base font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
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
        <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
          Join thousands who've revolutionized their meal planning and grocery shopping experience
        </p>
      </div>
    </div>
  );
};

export default Index;
