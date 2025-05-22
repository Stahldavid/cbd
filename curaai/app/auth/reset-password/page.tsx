"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideEye, LucideEyeOff, LucideLock, LucideCheck } from "lucide-react"
import { AuthLayout } from "@/components/auth-layout"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const [sessionEstablished, setSessionEstablished] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const router = useRouter()

  useEffect(() => {
    const processPasswordReset = async () => {
      try {
        console.log("=== Processing Password Reset ===")
        console.log("Full URL:", window.location.href)
        
        // Parse URL for all possible token locations
        const url = new URL(window.location.href)
        const queryParams = Object.fromEntries(url.searchParams.entries())
        
        // Parse hash fragments (Supabase often uses these)
        const hash = window.location.hash.substring(1)
        const hashParams: any = {}
        if (hash) {
          hash.split('&').forEach(param => {
            const [key, value] = param.split('=')
            if (key && value) {
              hashParams[key] = decodeURIComponent(value)
            }
          })
        }
        
        console.log("Query params:", queryParams)
        console.log("Hash params:", hashParams)
        
        // Get tokens from either location
        const accessToken = queryParams.access_token || hashParams.access_token
        const refreshToken = queryParams.refresh_token || hashParams.refresh_token
        const type = queryParams.type || hashParams.type
        
        const debugData = {
          type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          accessTokenPreview: accessToken ? accessToken.substring(0, 20) + "..." : null,
          queryParams,
          hashParams
        }
        
        console.log("Token analysis:", debugData)
        setDebugInfo(debugData)
        
        // If we have tokens, manually set the session
        if (accessToken && refreshToken) {
          console.log("Found tokens, setting session manually...")
          
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            console.log("Manual session result:", { 
              hasUser: !!data.user, 
              hasSession: !!data.session,
              error: error?.message 
            })
            
            if (error) {
              throw error
            }
            
            if (data.session && data.user) {
              console.log("✅ Session established successfully")
              setSessionEstablished(true)
              setIsValidSession(true)
              return
            }
          } catch (sessionError) {
            console.error("Failed to set session:", sessionError)
            toast.error("Erro ao processar link de redefinição.")
            setIsValidSession(false)
            return
          }
        }
        
        // Check if we already have a valid session
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log("Current session check:", { 
          hasSession: !!session, 
          userId: session?.user?.id,
          error: error?.message 
        })
        
        if (session && session.user) {
          console.log("✅ Valid session found")
          setSessionEstablished(true)
          setIsValidSession(true)
          return
        }
        
        // If we have a type=recovery but no valid session, it might be an old/invalid link
        if (type === 'recovery') {
          console.log("❌ Recovery type found but no valid session")
          toast.error("Link de redefinição expirado ou inválido.")
          setIsValidSession(false)
          setTimeout(() => {
            router.push('/auth/forgot-password')
          }, 2000)
          return
        }
        
        // No tokens and no session - invalid access
        console.log("❌ No valid tokens or session found")
        toast.error("Acesso inválido à página de redefinição.")
        setIsValidSession(false)
        setTimeout(() => {
          router.push('/auth/forgot-password')
        }, 2000)
        
      } catch (err) {
        console.error("Error processing password reset:", err)
        toast.error("Erro ao processar redefinição de senha.")
        setIsValidSession(false)
        setTimeout(() => {
          router.push('/auth/forgot-password')
        }, 2000)
      }
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", { event, hasSession: !!session })
      
      if (event === 'PASSWORD_RECOVERY' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        if (session && session.user) {
          console.log("✅ Valid session established via auth state change")
          setSessionEstablished(true)
          setIsValidSession(true)
        }
      }
    })

    // Small delay to let the page load, then process
    setTimeout(processPasswordReset, 100)

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.")
      return
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setIsLoading(true)

    try {
      console.log("Attempting to update password...")
      
      // Double-check we have a valid session before updating
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("Sessão não encontrada. Tente acessar o link novamente.")
      }
      
      const { data, error } = await supabase.auth.updateUser({
        password: password
      })

      console.log("Password update result:", { 
        hasUser: !!data.user, 
        error: error?.message 
      })

      if (error) {
        console.error("Password update error:", error)
        toast.error(error.message || "Erro ao redefinir senha.")
      } else {
        console.log("✅ Password updated successfully")
        setIsSuccess(true)
        toast.success("Senha redefinida com sucesso!")
        
        // Sign out and redirect to login
        await supabase.auth.signOut()
        
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      }
    } catch (err: any) {
      console.error("Password update exception:", err)
      toast.error(err.message || "Ocorreu um erro inesperado.")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while processing
  if (isValidSession === null) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1E88E5] mx-auto"></div>
              <div>
                <p className="font-medium">Processando redefinição de senha...</p>
                <p className="text-sm text-muted-foreground">
                  {sessionEstablished ? "Sessão estabelecida!" : "Validando link de redefinição..."}
                </p>
              </div>
              
              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <details className="text-xs text-left">
                  <summary className="cursor-pointer">Debug Info</summary>
                  <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify({
                      ...debugInfo,
                      sessionEstablished,
                      isValidSession
                    }, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  // Invalid session
  if (isValidSession === false) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <div className="text-red-600 text-xl">⚠️</div>
              </div>
              <div>
                <p className="font-medium">Link inválido ou expirado</p>
                <p className="text-sm text-muted-foreground">
                  O link de redefinição de senha não é válido ou já expirou. 
                  Você será redirecionado para solicitar um novo link.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Redefinir senha</CardTitle>
          <CardDescription>
            {isSuccess ? "Sua senha foi redefinida com sucesso" : "Crie uma nova senha para sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <LucideCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium">Senha redefinida com sucesso!</p>
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado para a página de login em instantes.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative">
                  <LucideLock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="pl-10"
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <LucideEyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <LucideEye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  A senha deve ter pelo menos 6 caracteres.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <div className="relative">
                  <LucideLock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="pl-10"
                    disabled={isLoading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <LucideEyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <LucideEye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#1E88E5] hover:bg-[#1976D2]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Redefinindo...
                  </>
                ) : (
                  "Redefinir senha"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/login" className="text-sm text-[#1E88E5] hover:underline">
            Voltar para o login
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
