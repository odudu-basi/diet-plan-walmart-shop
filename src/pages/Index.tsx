
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Target, Heart } from "lucide-react";

const Index = () => {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', loginForm);
    // TODO: Implement authentication logic
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    console.log('Signup attempt:', signupForm);
    // TODO: Implement authentication logic
  };

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
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                      className="h-12"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 bg-green-600 hover:bg-green-700">
                    Log In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      required
                      className="h-12"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700">
                    Sign Up
                  </Button>
                </form>
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
