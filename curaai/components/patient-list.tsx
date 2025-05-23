"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LucidePlus, LucideSearch, LucideRefreshCw } from "lucide-react"
import { usePatient, Patient as PatientFromContext } from "@/contexts/PatientContext"
import { Skeleton } from "@/components/ui/skeleton"
import { NewPatientModal } from "./NewPatientModal"

export interface PatientDisplayDetails extends PatientFromContext {
  age?: number
  primaryCondition?: string
  status?: PatientStatus
  lastVisit?: string
  appointmentTime?: string
  avatarUrl?: string
}

type PatientStatus = "new" | "follow-up" | "urgent"

export function PatientList() {
  const {
    patients: patientsFromContext,
    activePatient,
    selectPatient,
    isLoadingPatients,
    fetchPatients,
    addPatient,
  } = usePatient()

  const [searchQuery, setSearchQuery] = useState("")
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false)

  const handleSaveNewPatient = async (patientData: Omit<PatientFromContext, 'id' | 'age'>) => {
    if (addPatient) {
      const createdPatient = await addPatient(patientData);
      if (createdPatient) {
        selectPatient(createdPatient);
        setIsNewPatientModalOpen(false);
      }
    }
  };

  const displayPatients: PatientDisplayDetails[] = patientsFromContext.map(p => ({
    ...p,
    age: p.date_of_birth ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear() : undefined,
    primaryCondition: (p as any).primaryCondition || "Condition N/A",
    status: (p as any).status || (["new", "follow-up", "urgent"] as PatientStatus[])[Math.floor(Math.random()*3)],
    lastVisit: (p as any).lastVisit || "-",
    appointmentTime: (p as any).appointmentTime || "-",
    avatarUrl: (p as any).avatarUrl || undefined,
  }))

  const filteredPatients = displayPatients.filter(
    (patient) =>
      patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.rg?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    if (!isLoadingPatients && patientsFromContext.length > 0 && !activePatient) {
      selectPatient(patientsFromContext[0])
    }
    if (activePatient && !patientsFromContext.find(p => p.id === activePatient.id)){
        selectPatient(null)
    }
  }, [isLoadingPatients, patientsFromContext, activePatient, selectPatient])

  return (
    <div className="w-[22%] border-r border-border bg-muted/30 h-[calc(100vh-60px)] flex flex-col">
      <div className="p-3 space-y-3 border-b border-border">
        <div className="relative">
          <LucideSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or RG..."
            className="pl-8 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoadingPatients && patientsFromContext.length === 0}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            className="flex-1 h-9" 
            disabled={isLoadingPatients}
            onClick={() => setIsNewPatientModalOpen(true)}
          >
            <LucidePlus className="mr-1.5 h-4 w-4" />
            New Patient
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => fetchPatients()} disabled={isLoadingPatients} aria-label="Refresh patients">
            <LucideRefreshCw className={cn("h-4 w-4", isLoadingPatients && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        {isLoadingPatients && patientsFromContext.length === 0 ? (
            <div className="p-3 space-y-1.5">
                {[...Array(8)].map((_, i) => <PatientCardSkeleton key={i} />)}
            </div>
        ) : (
            <>
                <div className="p-2 py-1.5 border-b border-border sticky top-0 bg-muted/30 z-[1]">
                    <p className="text-xs font-semibold text-muted-foreground px-1 tracking-wider">
                        PATIENTS ({filteredPatients.length})
                    </p>
                </div>
                {filteredPatients.length > 0 ? (
                    <ScrollArea className="flex-1">
                        <div className="space-y-0.5 p-2">
                        {filteredPatients.map((patient) => (
                            <PatientCard
                                key={patient.id}
                                patient={patient}
                                isSelected={activePatient?.id === patient.id}
                                onClick={() => selectPatient(patient)} 
                            />
                        ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mt-4">
                            {searchQuery ? "No patients match your search." : "No patients found."}
                        </p>
                        {!searchQuery && 
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchPatients()} disabled={isLoadingPatients}>
                                <LucideRefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isLoadingPatients && "animate-spin")} />
                                Retry Fetch
                            </Button>
                        }
                    </div>
                )}
            </>
        )}
      </div>
      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onSave={handleSaveNewPatient}
      />
    </div>
  )
}

function PatientCardSkeleton() {
    return (
        <div className="flex items-center space-x-2.5 p-2.5 rounded-md">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-3.5 w-3/5 rounded" />
                    <Skeleton className="h-2.5 w-10 rounded" />
                </div>
                <Skeleton className="h-3 w-4/5 rounded" />
                <div className="flex justify-between items-center">
                    <Skeleton className="h-2.5 w-1/3 rounded" />
                    <Skeleton className="h-2.5 w-1/4 rounded" />
                </div>
            </div>
        </div>
    );
}

function PatientCard({
  patient,
  isSelected,
  onClick,
}: {
  patient: PatientDisplayDetails
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        "w-full text-left p-2.5 rounded-lg transition-all duration-100 relative focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-muted/30 focus-visible:ring-primary focus:outline-none",
        isSelected ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted/60",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2.5">
        <Avatar className={cn("h-9 w-9 border-2", isSelected ? "border-primary-foreground/70 bg-primary-foreground/20" : "border-transparent bg-muted")}>
          <AvatarImage src={patient.avatarUrl || undefined} alt={patient.name || "Patient"} />
          <AvatarFallback 
            className={cn("font-semibold text-sm", isSelected ? "bg-transparent text-primary-foreground" : "text-muted-foreground")}
          >
            {patient.name?.split(" ").slice(0,2).map((n) => n[0]).join("") || "P"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={cn("font-semibold truncate text-sm", isSelected ? "text-primary-foreground" : "text-foreground")}>
              {patient.name || "Unnamed Patient"}
            </p>
            {patient.status && <StatusBadge status={patient.status} isSelected={isSelected} />}
          </div>
          <p className={cn("text-xs truncate", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {patient.age ? `${patient.age} y/o • ` : ""}{patient.primaryCondition || "No condition listed"}
          </p>
        </div>
      </div>
    </button>
  )
}

function StatusBadge({ status, isSelected }: { status: PatientStatus; isSelected: boolean }) {
  const baseClasses = "px-1.5 py-0.5 text-[10px] rounded-full font-medium tracking-wide leading-tight";
  let config = {
    bg: "bg-gray-200", 
    text: "text-gray-800", 
    label: status.charAt(0).toUpperCase() + status.slice(1)
  };

  if (isSelected) {
    config = {
        bg: "bg-primary-foreground/20", 
        text: "text-primary-foreground", 
        label: status.charAt(0).toUpperCase() + status.slice(1)
    };
    switch (status) {
        case "new": config.label = "New"; break;
        case "follow-up": config.label = "Follow-up"; break;
        case "urgent": config.label = "Urgent"; break;
    }
  } else {
    switch (status) {
        case "new": config = { bg: "bg-sky-100", text: "text-sky-700", label:"New" }; break;
        case "follow-up": config = { bg: "bg-blue-100", text: "text-blue-700", label:"Follow-up" }; break;
        case "urgent": config = { bg: "bg-red-100", text: "text-red-700", label:"Urgent" }; break;
    }
  }

  return (
    <span className={cn(baseClasses, config.bg, config.text)}>
      {config.label}
    </span>
  );
}
