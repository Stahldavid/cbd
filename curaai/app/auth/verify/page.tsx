"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LucideMail, LucideArrowRight } from "lucide-react"
import { AuthLayout } from "@/components/auth-layout"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

export default function VerifyPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutos em segundos
  const [email, setEmail] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Get email from localStorage or URL params if available
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1)
    }

    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      if (nextInput) {
        nextInput.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      if (prevInput) {
        prevInput.focus()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const code = verificationCode.join("")
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'email'
      })

      if (error) {
        toast.error(error.message || "Código de verificação inválido.")
      } else {
        toast.success("E-mail verificado com sucesso!")
        router.push("/")
      }
    } catch (err: any) {
      toast.error(err.message || "Ocorreu um erro inesperado.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      toast.error("E-mail não encontrado. Tente fazer o cadastro novamente.")
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        toast.error(error.message || "Erro ao reenviar código.")
      } else {
        setTimeLeft(300)
        setVerificationCode(["", "", "", "", "", ""])
        toast.success("Código reenviado!")
      }
    } catch (err: any) {
      toast.error(err.message || "Ocorreu um erro inesperado.")
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Verificação de e-mail</CardTitle>
          <CardDescription>
            Enviamos um código de verificação para o seu e-mail. Por favor, insira o código abaixo para confirmar sua
            conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-[#F0F7FA] flex items-center justify-center">
              <LucideMail className="h-8 w-8 text-[#1E88E5]" />
            </div>
          </div>

          {!email && (
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="text-center mb-2">
                <p className="text-sm text-muted-foreground">Digite o código de 6 dígitos</p>
              </div>
              <div className="flex justify-center gap-2">
                {verificationCode.map((digit, index) => (
                  <Input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className="w-10 h-12 text-center text-lg font-medium"
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isLoading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <div className="text-center mt-2">
                <p className="text-sm text-muted-foreground">
                  Tempo restante: <span className="font-medium">{formatTime(timeLeft)}</span>
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1E88E5] hover:bg-[#1976D2]"
              disabled={isLoading || verificationCode.some((digit) => !digit) || !email}
            >
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
                  Verificando...
                </>
              ) : (
                <>
                  Verificar e continuar
                  <LucideArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Não recebeu o código?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-[#1E88E5]"
                onClick={handleResendCode}
                disabled={timeLeft > 0 || !email}
              >
                {timeLeft > 0 ? `Aguarde ${formatTime(timeLeft)}` : "Reenviar código"}
              </Button>
            </p>
          </div>
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
