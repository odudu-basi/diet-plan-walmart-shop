
import { useState, createContext, useContext, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('diet_app_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('diet_app_user');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - In real app, this would be replaced with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check stored users (for demo purposes)
      const storedUsers = JSON.parse(localStorage.getItem('diet_app_users') || '[]');
      const existingUser = storedUsers.find((u: any) => u.email === email && u.password === password);
      
      if (!existingUser) {
        throw new Error('Invalid email or password');
      }

      const userData: User = {
        id: existingUser.id,
        email: existingUser.email
      };

      setUser(userData);
      localStorage.setItem('diet_app_user', JSON.stringify(userData));
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, confirmPassword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if user already exists (for demo purposes)
      const storedUsers = JSON.parse(localStorage.getItem('diet_app_users') || '[]');
      const existingUser = storedUsers.find((u: any) => u.email === email);
      
      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email,
        password, // In real app, this would be hashed
        createdAt: new Date().toISOString()
      };

      storedUsers.push(newUser);
      localStorage.setItem('diet_app_users', JSON.stringify(storedUsers));

      const userData: User = {
        id: newUser.id,
        email: newUser.email
      };

      setUser(userData);
      localStorage.setItem('diet_app_user', JSON.stringify(userData));
      
      toast({
        title: "Account Created!",
        description: "Welcome to Diet Shopping App!",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('diet_app_user');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signUp,
      logout,
      isLoading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
