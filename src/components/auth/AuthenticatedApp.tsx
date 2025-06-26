
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";

const AuthenticatedApp = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSetupProfile = () => {
    navigate('/profile-setup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <User className="h-6 w-6 text-green-600" />
          <span className="text-lg font-semibold">Welcome, {user?.email}</span>
        </div>
        <Button 
          onClick={logout}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-green-600">
              Diet Shopping App
            </CardTitle>
            <CardDescription>
              You're successfully logged in! Next, we'll set up your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Ready to start your personalized diet journey?
            </p>
            <Button 
              onClick={handleSetupProfile}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Set Up Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthenticatedApp;
