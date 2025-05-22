"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideMail, LucideArrowLeft, LucideCheck } from "lucide-react"
import { AuthLayout } from "@/components/auth-layout"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("Sending password reset email for:", email)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      console.log("Password reset email result:", { error })

      if (error) {
        console.error("Password reset email error:", error)
        toast.error(error.message || "Erro ao enviar e-mail de recuperação.")
      } else {
        console.log("Password reset email sent successfully")
        setIsSubmitted(true)
        toast.success("E-mail de recuperação enviado!")
      }
    } catch (err: any) {
      console.error("Password reset email exception:", err)
      toast.error(err.message || "Ocorreu um erro inesperado.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Recuperar senha</CardTitle>
          <CardDescription>
            {isSubmitted
              ? "Enviamos um e-mail com instruções para redefinir sua senha"
              : "Digite seu e-mail para receber um link de recuperação de senha"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <LucideCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium">E-mail enviado com sucesso!</p>
                <p className="text-sm text-muted-foreground">
                  Enviamos um link de recuperação para <span className="font-medium">{email}</span>. Por favor,
                  verifique sua caixa de entrada e spam.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  O link expira em 1 hora por motivos de segurança.
                </p>
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                Não recebeu o e-mail?{" "}
                <Button variant="link" className="p-0 h-auto text-[#1E88E5]" onClick={() => setIsSubmitted(false)}>
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : (
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
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/login" className="text-sm text-[#1E88E5] hover:underline flex items-center gap-1">
            <LucideArrowLeft className="h-3 w-3" />
            Voltar para o login
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
