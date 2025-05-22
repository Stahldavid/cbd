"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const [status, setStatus] = useState<string>("Checking...")
  const [details, setDetails] = useState<any>({})

  useEffect(() => {
    checkSupabaseConnection()
  }, [])

  const checkSupabaseConnection = async () => {
    try {
      console.log("Checking Supabase client...")
      console.log("Supabase instance:", supabase)
      console.log("Environment vars:", {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + "...",
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      })

      // Test basic connection
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setStatus(`Error: ${error.message}`)
        setDetails(error)
      } else {
        setStatus("Connection successful!")
        setDetails({
          hasSession: !!data.session,
          sessionUser: data.session?.user?.email || "No user"
        })
      }
    } catch (err: any) {
      console.error("Connection test failed:", err)
      setStatus(`Exception: ${err.message}`)
      setDetails(err)
    }
  }

  const testLogin = async () => {
    try {
      setStatus("Testing login...")
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "test@example.com",
        password: "testpassword"
      })
      
      if (error) {
        setStatus(`Login test error: ${error.message}`)
        setDetails(error)
      } else {
        setStatus("Login test completed (credentials may be invalid, but client works)")
        setDetails(data)
      }
    } catch (err: any) {
      console.error("Login test failed:", err)
      setStatus(`Login test exception: ${err.message}`)
      setDetails(err)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Status:</strong> {status}
          </div>
          
          <div>
            <strong>Details:</strong>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>

          <div className="space-x-2">
            <Button onClick={checkSupabaseConnection}>
              Re-check Connection
            </Button>
            <Button onClick={testLogin} variant="outline">
              Test Login Function
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p>If you see "Connection successful!" then Supabase is working.</p>
            <p>Check the browser console for additional details.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
