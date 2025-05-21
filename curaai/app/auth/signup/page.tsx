"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { toast } from 'sonner';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUpWithPassword, user, loading, session } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && session) {
      router.replace('/'); // Redirect to homepage if already logged in
    }
  }, [user, session, loading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      // You can add more user metadata here if needed, like name, role, etc.
      // For example: options: { data: { full_name: 'Test User', role: 'doctor' } }
      const { data, error } = await signUpWithPassword({ email, password });

      if (error) {
        toast.error(error.message || "Failed to sign up. Please try again.");
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        // This condition might indicate an existing user trying to sign up again with an unverified email from a previous attempt.
        // Supabase sometimes returns a user object here but marks them as not having an identity if email is already in use but unconfirmed.
        toast.warning("An account with this email may already exist and is unverified. Please check your email or try logging in.");
      } else if (data.session) {
        // User is logged in (e.g. if email confirmation is disabled)
        toast.success("Signed up and logged in successfully!");
        router.push('/');
      } else if (data.user) {
        // User created, email confirmation likely required
        toast.info("Signup successful! Please check your email to confirm your account.");
        // Optionally redirect to a page saying "Check your email" or to login page
        router.push('/auth/login'); 
      } else {
        toast.error("An unexpected issue occurred during sign up.");
      }
    } catch (err: any) {
        toast.error(err.message || "An unexpected error occurred.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (loading || (!loading && user && session)) {
    return (
        <div className="flex justify-center items-center h-screen">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Join Cura AI to streamline your medical practice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="me@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                minLength={6} // Supabase default minimum
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
              {isSubmitting ? 'Signing up...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 