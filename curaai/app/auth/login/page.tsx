"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { LucideEye, LucideEyeOff, LucideLock, LucideMail } from "lucide-react"
import { AuthLayout } from "@/components/auth-layout"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const { signInWithPassword, user, loading, session } = useAuth()

  useEffect(() => {
    if (!loading && user && session) {
      router.replace('/') // Redirect to homepage if already logged in
    }
  }, [user, session, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.")
      return
    }

    setIsLoading(true)

    try {
      console.log("Attempting login with:", { email: email.substring(0, 3) + "..." })
      
      const result = await signInWithPassword({ email, password })
      console.log("Login result:", { hasError: !!result.error, hasUser: !!result.data?.user })
      
      if (result.error) {
        console.error("Login error:", result.error)
        toast.error(result.error.message || "Falha no login. Verifique suas credenciais.")
      } else if (result.data?.user) {
        toast.success("Login realizado com sucesso!")
        router.push('/')
      } else {
        toast.error("Resposta inesperada do servidor.")
      }
    } catch (err: any) {
      console.error("Login exception:", err)
      toast.error(err.message || "Ocorreu um erro inesperado.")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1E88E5]"></div>
        </div>
      </AuthLayout>
    )
  }

  // If already logged in, show redirecting message
  if (user && session) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1E88E5] mx-auto mb-4"></div>
            <p>Redirecionando...</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
          <CardDescription>Entre com seu e-mail e senha para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <LucideMail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  required
                  className="pl-10"
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="/auth/forgot-password" className="text-xs text-[#1E88E5] hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
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
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" checked={rememberMe} onCheckedChange={setRememberMe} />
              <Label htmlFor="remember" className="text-sm font-normal">
                Lembrar de mim por 30 dias
              </Label>
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
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full" disabled={isLoading}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Google
            </Button>
            <Button variant="outline" className="w-full" disabled={isLoading}>
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.5 3.5H14.5V8.5H9.5z" />
                <path d="M3.5 9.5H8.5V14.5H3.5z" />
                <path d="M9.5 9.5H14.5V14.5H9.5z" />
                <path d="M15.5 9.5H20.5V14.5H15.5z" />
                <path d="M9.5 15.5H14.5V20.5H9.5z" />
              </svg>
              Microsoft
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Não tem uma conta?{" "}
            <Link href="/auth/signup" className="text-[#1E88E5] hover:underline">
              Cadastre-se
            </Link>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            Ao continuar, você concorda com nossos{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-foreground">
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-foreground">
              Política de Privacidade
            </Link>
            .
          </div>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
