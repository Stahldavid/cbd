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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LucideEye, LucideEyeOff, LucideLock, LucideMail, LucideUser } from "lucide-react"
import { AuthLayout } from "@/components/auth-layout"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    specialty: "",
    crm: "",
    state: "",
    institution: "",
    acceptTerms: false
  })
  const router = useRouter()
  const { signUpWithPassword, user, loading, session } = useAuth()

  useEffect(() => {
    if (!loading && user && session) {
      router.replace('/') // Redirect to homepage if already logged in
    }
  }, [user, session, loading, router])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === 1) {
      // Validate first step
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        toast.error("Por favor, preencha todos os campos obrigatórios.")
        return
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("As senhas não coincidem.")
        return
      }
      if (formData.password.length < 6) {
        toast.error("A senha deve ter pelo menos 6 caracteres.")
        return
      }
      setStep(2)
      return
    }

    // Validate second step
    if (!formData.specialty || !formData.crm || !formData.state) {
      toast.error("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    if (!formData.acceptTerms) {
      toast.error("Você deve aceitar os termos de serviço.")
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await signUpWithPassword({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`,
            specialty: formData.specialty,
            crm: formData.crm,
            state: formData.state,
            institution: formData.institution,
            role: 'doctor'
          }
        }
      })

      if (error) {
        toast.error(error.message || "Falha no cadastro. Tente novamente.")
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.warning("Uma conta com este e-mail pode já existir. Verifique seu e-mail ou tente fazer login.")
      } else if (data.session) {
        toast.success("Cadastro realizado e login efetuado com sucesso!")
        router.push('/')
      } else if (data.user) {
        toast.info("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar sua conta.")
        router.push('/auth/verify')
      } else {
        toast.error("Ocorreu um problema inesperado durante o cadastro.")
      }
    } catch (err: any) {
      toast.error(err.message || "Ocorreu um erro inesperado.")
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || (!loading && user && session)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1E88E5]"></div>
      </div>
    )
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
          <CardDescription>
            {step === 1 ? "Preencha seus dados pessoais para criar uma conta" : "Complete seu cadastro profissional"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <div className="relative">
                      <LucideUser className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="firstName"
                        placeholder="Nome"
                        required
                        className="pl-10"
                        disabled={isLoading}
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      placeholder="Sobrenome"
                      required
                      disabled={isLoading}
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                </div>
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
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <LucideLock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="pl-10"
                      disabled={isLoading}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
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
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <div className="relative">
                    <LucideLock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="pl-10"
                      disabled={isLoading}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidade médica</Label>
                  <Select disabled={isLoading} value={formData.specialty} onValueChange={(value) => handleInputChange('specialty', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neurologia">Neurologia</SelectItem>
                      <SelectItem value="psiquiatria">Psiquiatria</SelectItem>
                      <SelectItem value="ortopedia">Ortopedia</SelectItem>
                      <SelectItem value="clinica-geral">Clínica Geral</SelectItem>
                      <SelectItem value="oncologia">Oncologia</SelectItem>
                      <SelectItem value="outra">Outra especialidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crm">CRM (Conselho Regional de Medicina)</Label>
                  <Input
                    id="crm"
                    placeholder="Número do CRM"
                    required
                    disabled={isLoading}
                    value={formData.crm}
                    onChange={(e) => handleInputChange('crm', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Seu CRM será verificado antes da aprovação final da conta.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado do CRM</Label>
                  <Select disabled={isLoading} value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sp">São Paulo</SelectItem>
                      <SelectItem value="rj">Rio de Janeiro</SelectItem>
                      <SelectItem value="mg">Minas Gerais</SelectItem>
                      <SelectItem value="rs">Rio Grande do Sul</SelectItem>
                      <SelectItem value="pr">Paraná</SelectItem>
                      <SelectItem value="ba">Bahia</SelectItem>
                      <SelectItem value="sc">Santa Catarina</SelectItem>
                      <SelectItem value="go">Goiás</SelectItem>
                      <SelectItem value="pe">Pernambuco</SelectItem>
                      <SelectItem value="ce">Ceará</SelectItem>
                      <SelectItem value="outro">Outro estado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Instituição principal</Label>
                  <Input
                    id="institution"
                    placeholder="Hospital, clínica ou consultório"
                    disabled={isLoading}
                    value={formData.institution}
                    onChange={(e) => handleInputChange('institution', e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                required
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => handleInputChange('acceptTerms', !!checked)}
              />
              <Label htmlFor="terms" className="text-sm font-normal">
                Concordo com os{" "}
                <Link href="#" className="text-[#1E88E5] hover:underline">
                  Termos de Serviço
                </Link>{" "}
                e{" "}
                <Link href="#" className="text-[#1E88E5] hover:underline">
                  Política de Privacidade
                </Link>
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
                  Cadastrando...
                </>
              ) : step === 1 ? (
                "Continuar"
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Já tem uma conta?{" "}
            <Link href="/auth/login" className="text-[#1E88E5] hover:underline">
              Entrar
            </Link>
          </div>
          {step === 2 && (
            <Button variant="ghost" className="text-sm" onClick={() => setStep(1)} disabled={isLoading}>
              Voltar para dados pessoais
            </Button>
          )}
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
