"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient'; // Ensure this path is correct

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  doctorId: string | null; // Assuming doctorId is the user.id
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<any>;
  signUpWithPassword: (credentials: { email: string; password: string; options?: any }) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting initial session:", error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setDoctorId(session?.user?.id ?? null);
      } catch (error) {
        console.error("Error in getInitialSession:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setDoctorId(session?.user?.id ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Wrapper functions for better error handling
  const signInWithPassword = async (credentials: { email: string; password: string }) => {
    try {
      const result = await supabase.auth.signInWithPassword(credentials);
      return result;
    } catch (error) {
      console.error("Error in signInWithPassword:", error);
      throw error;
    }
  };

  const signUpWithPassword = async (credentials: { email: string; password: string; options?: any }) => {
    try {
      const result = await supabase.auth.signUp(credentials);
      return result;
    } catch (error) {
      console.error("Error in signUpWithPassword:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const result = await supabase.auth.signOut();
      return result;
    } catch (error) {
      console.error("Error in signOut:", error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    doctorId,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};