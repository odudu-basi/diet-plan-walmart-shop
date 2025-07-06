import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ user: User | null; session: Session | null } | void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ user: User | null; session: Session | null } | void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Session retrieval error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Handle native app auth events
        if (Capacitor.isNativePlatform()) {
          if (event === 'SIGNED_IN' && session) {
            // Force a small delay to ensure state is properly set
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 100);
          } else if (event === 'SIGNED_OUT') {
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For native apps, use different auth flow
      if (Capacitor.isNativePlatform()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Native apps don't need URL redirects
          return { user: data.user, session: data.session };
        }
      } else {
        // Web auth flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        return { user: data.user, session: data.session };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For native apps, don't use email confirmation redirects
      const authOptions = Capacitor.isNativePlatform() ? {
        email,
        password,
        options: {
          data: fullName ? { full_name: fullName } : undefined,
        }
      } : {
        email,
        password,
        options: {
          data: fullName ? { full_name: fullName } : undefined,
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      };

      const { data, error } = await supabase.auth.signUp(authOptions);
      
      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // For native apps, force navigation
      if (Capacitor.isNativePlatform()) {
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextProps = {
    user,
    session,
    login,
    signUp,
    logout,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
