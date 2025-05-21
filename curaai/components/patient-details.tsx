"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabaseClient"
import {
  LucideAlertCircle,
  LucideFileText,
  LucidePrinter,
  LucideDownload,
  LucideChevronDown,
  LucideChevronUp,
  LucideEdit,
  LucideCheck,
  LucideX,
  LucideInfo,
  LucideUserCircle2,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { usePatient, Patient as PatientFromContext } from "@/contexts/PatientContext"
import { useAuth } from "@/contexts/AuthContext"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from 'sonner'
import { PrescriptionTab } from "@/components/PrescriptionTab"

interface Doctor {
  name: string;
}

interface MedicalRecord {
  id: string;
  record_date: string;
  note_content: string;
  doctor_id: string;
  doctors?: Doctor | null;
}

interface ConsultationNotesProps {
  activePatient: PatientFromContext;
  doctorId: string | null;
}

interface PatientSubComponentProps {
  patient: PatientFromContext;
}

interface PrescriptionTabProps extends PatientSubComponentProps {
  doctorId: string | null;
}

export function PatientDetails() {
  const [activeUITab, setActiveUITab] = useState("profile")
  const { activePatient, isLoadingPatients } = usePatient()
  const { doctorId, loading: authLoading } = useAuth()

  if (isLoadingPatients || authLoading) {
    return <PatientDetailsSkeleton />
  }

  if (!activePatient) {
    return (
      <div className="w-[30%] min-w-[350px] max-w-[450px] h-[calc(100vh-60px)] flex flex-col items-center justify-center border-l border-border bg-muted/20 p-8 text-center">
        <LucideUserCircle2 className="h-16 w-16 text-muted-foreground/70 mb-4" strokeWidth={1.5} />
        <p className="text-lg font-medium text-foreground/80">No Patient Selected</p>
        <p className="text-sm text-muted-foreground mt-1">Please select a patient from the list to view their details and manage notes.</p>
      </div>
    )
  }

  return (
    <div className="w-[30%] min-w-[350px] max-w-[450px] h-[calc(100vh-60px)] overflow-hidden bg-background flex flex-col border-l border-border">
      <Tabs value={activeUITab} onValueChange={setActiveUITab} className="flex-1 flex flex-col">
        <div className="px-3 pt-3 border-b border-border sticky top-0 bg-background z-10">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="profile" className="text-xs px-2">Profile</TabsTrigger>
            <TabsTrigger value="history" className="text-xs px-2">History</TabsTrigger>
            <TabsTrigger value="prescriptions" className="text-xs px-2">Prescriptions</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs px-2">Notes</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            <TabsContent value="profile" className="mt-0">
              <PatientProfile patient={activePatient} />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <PatientHistory patient={activePatient} />
            </TabsContent>

            <TabsContent value="prescriptions" className="mt-0">
              <PrescriptionTab patient={activePatient} doctorId={doctorId} />
            </TabsContent>

            <TabsContent value="notes" className="mt-0">
              <ConsultationNotes activePatient={activePatient} doctorId={doctorId} />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

function PatientDetailsSkeleton() {
  return (
    <div className="w-[30%] min-w-[350px] max-w-[450px] h-[calc(100vh-60px)] overflow-hidden bg-background flex flex-col border-l border-border p-3 space-y-3">
      <div className="grid grid-cols-4 gap-2 px-1 pt-1 mb-1">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-md" />)}
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  )
}

function PatientProfile({ patient }: PatientSubComponentProps) {
  const displayName = patient.name || "Selected Patient"
  const displayDob = patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('pt-BR') : "Not available"
  const displayAge = patient.date_of_birth ? (new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()) : undefined
  const displayPatientId = `#${patient.id.substring(0,8).toUpperCase()}...`
  const displayGender = patient.gender || "Not specified"
  const displayCpfRg = patient.cpf || patient.rg || "Not registered"
  const displayPhone = patient.phone_number || "Not registered"
  const displayEmail = patient.email || "Not registered"

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Demographics: {displayName}</span>
            <Button variant="outline" size="icon" className="h-7 w-7">
              <LucideEdit className="h-3.5 w-3.5" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <div>
              <p className="text-muted-foreground text-xs font-medium">Patient ID</p>
              <p className="font-mono text-[11px]">{displayPatientId}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Date of Birth</p>
              <p>{displayDob} {displayAge !== undefined && `(${displayAge} y/o)`}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Gender</p>
              <p>{displayGender}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">CPF/RG</p>
              <p>{displayCpfRg}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Phone</p>
              <p>{displayPhone}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Email</p>
              <p>{displayEmail}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-1 italic">Further patient profile details (conditions, medications, allergies) will be populated from actual patient data.</p>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle className="text-base font-semibold">Medical Conditions</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground italic">Data for {displayName} not yet linked.</p></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base font-semibold">Current Medications</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground italic">Data for {displayName} not yet linked.</p></CardContent></Card>
      <Card className="border-destructive/30"><CardHeader className="text-destructive"><CardTitle className="text-base font-semibold flex items-center gap-1.5"><LucideAlertCircle className="h-4 w-4" />Allergies</CardTitle></CardHeader><CardContent className="bg-destructive/5"><p className="text-xs text-muted-foreground italic">Data for {displayName} not yet linked.</p></CardContent></Card>
    </div>
  )
}

function PatientHistory({ patient }: PatientSubComponentProps) {
  return (
    <Card>
      <CardHeader><CardTitle  className="text-base font-semibold">Consultation History: {patient.name || "Selected Patient"}</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground italic">Full history for patient ID {patient.id.substring(0,8)}... will be implemented here.</p>
      </CardContent>
    </Card>
  )
}

function ConsultationNotes({ activePatient, doctorId }: ConsultationNotesProps) {
  const [currentNoteTab, setCurrentNoteTab] = useState('new')
  const [currentNote, setCurrentNote] = useState('')
  const [previousNotes, setPreviousNotes] = useState<MedicalRecord[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false)

  const fetchPreviousNotes = useCallback(async () => {
    if (!activePatient?.id) return
    setIsLoadingPrevious(true)
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('id, record_date, note_content, doctor_id, doctors ( name )')
        .eq('patient_id', activePatient.id)
        .order('record_date', { ascending: false })

      if (error) {
        toast.error(`Failed to fetch notes: ${error.message}`)
        throw error
      }
      setPreviousNotes((data as MedicalRecord[]) || [])
    } catch (error: any) {
      console.error('Error fetching previous notes:', error)
      // Toast is already shown if error is thrown from try block
    } finally {
      setIsLoadingPrevious(false)
    }
  }, [activePatient?.id])

  useEffect(() => {
    if (activePatient?.id) {
      fetchPreviousNotes()
      setCurrentNote('')
    } else {
      setPreviousNotes([])
      setCurrentNote('')
    }
  }, [activePatient, fetchPreviousNotes])

  const handleSaveNote = async () => {
    if (!currentNote.trim()) {
      toast.warning('Note content cannot be empty.')
      return
    }
    if (!activePatient?.id || !doctorId) {
      toast.error('Cannot save note: Missing patient or doctor information.')
      return
    }

    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          patient_id: activePatient.id,
          doctor_id: doctorId,
          note_content: currentNote,
        })
        .select('id, record_date, note_content, doctor_id, doctors ( name )')
        .single()

      if (error) {
        toast.error(`Failed to save note: ${error.message}`)
        throw error
      }

      if (data) {
        setPreviousNotes((prev) => [data as MedicalRecord, ...prev].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()))
        toast.success('Note saved successfully!')
      }
      setCurrentNote('')
      setCurrentNoteTab('previous')
    } catch (error: any) {
      console.error('Error saving note:', error)
      // Toast is already shown if error is thrown from try block
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <Tabs value={currentNoteTab} onValueChange={setCurrentNoteTab} className="mt-0">
        <TabsList className="grid w-full grid-cols-2 mb-3 h-9">
          <TabsTrigger value="new" className="text-xs px-2">New Note</TabsTrigger>
          <TabsTrigger value="previous" className="text-xs px-2">
            Previous Notes ({previousNotes.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="new" className="mt-0">
          <div className="flex flex-col space-y-2">
            <Textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder={`Notes for ${activePatient.name || "selected patient"}...`}
              disabled={isSaving || !activePatient || isLoadingPrevious}
              className="min-h-[180px] text-sm p-2.5 focus-visible:ring-primary/80 rounded-md border-input"
              rows={7}
            />
            <Button 
              onClick={handleSaveNote} 
              disabled={isSaving || !currentNote.trim() || !activePatient || isLoadingPrevious}
              className="self-end h-9 min-w-[100px]"
            >
              {isSaving ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="previous" className="mt-0">
          {isLoadingPrevious ? (
            <div className="flex flex-col items-center justify-center h-36 border rounded-md bg-muted/20">
              <LucideFileText className="h-7 w-7 text-muted-foreground/80 mb-2 animate-pulse" />
              <p className="text-xs text-muted-foreground">Loading notes...</p>
        </div>
          ) : previousNotes.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-380px)] space-y-2 pr-1">
              {previousNotes.map((note) => (
                <Card key={note.id} className="mb-2 shadow-sm bg-muted/20 hover:bg-muted/30 transition-colors duration-150 rounded-lg">
                  <CardHeader className="pb-1 pt-1.5 px-2.5">
                    <div className="flex justify-between items-center text-[11px] text-muted-foreground font-medium">
                      <span className="text-foreground/80">
                        {new Date(note.record_date).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </span>
                      <span className="font-semibold">Dr. {note.doctors?.name || "Unknown"}</span>
      </div>
                  </CardHeader>
                  <CardContent className="text-xs px-2.5 pb-2">
                    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{note.note_content}</p>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-36 border rounded-md bg-muted/20">
              <LucideInfo className="h-7 w-7 text-muted-foreground/80 mb-2" />
              <p className="text-xs text-muted-foreground">No previous notes for this patient.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
