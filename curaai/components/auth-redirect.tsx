"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export function AuthRedirect({ redirectTo = "/auth/login" }: { redirectTo?: string }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Wait for auth state to load
    if (loading) return

    // If no user is authenticated, redirect to login
    if (!user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Don't render anything while checking auth or during redirect
  if (loading || !user) {
    return null
  }

  return null
}
