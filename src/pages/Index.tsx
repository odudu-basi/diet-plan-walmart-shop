
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Target, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import SignUpForm from "@/components/auth/SignUpForm";
import AuthenticatedApp from "@/components/auth/AuthenticatedApp";

const Index = () => {
  const { user, login, signUp, isLoading, error } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex flex-col">
      {/* Header */}
      <div className="text-center py-8">
        <div className="flex justify-center items-center mb-4">
          <div className="bg-green-500 p-3 rounded-full mr-3">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <div className="bg-blue-500 p-3 rounded-full mr-3">
            <Target className="h-8 w-8 text-white" />
          </div>
          <div className="bg-red-500 p-3 rounded-full">
            <Heart className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Diet Shopping</h1>
        <p className="text-gray-600 text-lg">Your personal meal planning companion</p>
        <p className="text-gray-500 text-sm mt-2">AI-powered meal plans & smart shopping lists</p>
      </div>

      {/* Authentication Card */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">Welcome</CardTitle>
            <CardDescription>
              Sign in to access your personalized meal plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm 
                  onLogin={login}
                  isLoading={isLoading}
                  error={error}
                />
              </TabsContent>

              <TabsContent value="signup">
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

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">
          Transform your shopping experience with personalized meal planning
        </p>
      </div>
    </div>
  );
};

export default Index;
