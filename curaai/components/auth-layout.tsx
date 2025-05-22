import type React from "react"
import Link from "next/link"
import { LucideArrowLeft } from "lucide-react"

export function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#F0F7FA] flex flex-col">
      <header className="h-[60px] flex items-center px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <LucideArrowLeft className="h-4 w-4" />
          <span className="text-sm">Voltar para a página inicial</span>
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-md bg-gradient-to-br from-[#00ACC1] to-[#0097A7] flex items-center justify-center text-white font-bold shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M12 8V16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 12H16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-semibold text-[#00ACC1]">CuraAI</span>
            <span className="text-xs text-muted-foreground -mt-1">Sistema de Cannabis Medicinal</span>
          </div>
        </div>
        {children}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} CuraAI. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
