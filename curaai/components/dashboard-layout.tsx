import type React from "react"
import { UserNav } from "@/components/user-nav"
import { LucideSettings } from "lucide-react"
import { PatientProvider } from "@/contexts/PatientContext"
import { PrescriptionProvider } from "@/lib/prescriptionContext"

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="h-[60px] border-b border-border bg-gradient-to-r from-[#F8FAFC] to-[#F0F7FA] shadow-sm flex items-center px-4 fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center mr-2">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></div>
              <span className="text-sm text-muted-foreground">Online</span>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <LucideSettings className="h-5 w-5" />
            </button>
            <UserNav />
          </div>
        </div>
      </header>

      {/* Main content with 3-panel layout */}
      <main className="flex flex-1 pt-[60px]">
        <PatientProvider>
          <PrescriptionProvider>
            {children}
          </PrescriptionProvider>
        </PatientProvider>
      </main>
    </div>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 rounded-md bg-gradient-to-br from-[#00ACC1] to-[#0097A7] flex items-center justify-center text-white font-bold shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <span className="text-xl font-semibold text-[#00ACC1]">CuraAI</span>
        <span className="text-[10px] text-muted-foreground -mt-1">Medical Cannabis System</span>
      </div>
    </div>
  )
}