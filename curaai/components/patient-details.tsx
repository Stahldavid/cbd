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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePatient, Patient as PatientFromContext } from "@/contexts/PatientContext"
import { useAuth } from "@/contexts/AuthContext"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from 'sonner'
import { PrescriptionTab } from "@/components/PrescriptionTab"
import { useTabStore } from "@/lib/tabStore"

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
  const { activeTab, setActiveTab } = useTabStore();
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-3 pt-3 border-b border-border sticky top-0 bg-background z-10">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="profile" className="text-xs px-2">Profile</TabsTrigger>
            <TabsTrigger value="history" className="text-xs px-2">History</TabsTrigger>
            <TabsTrigger value="prescriptions" className="text-xs px-2" data-tab="prescription">Prescriptions</TabsTrigger>
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
  const { fetchPatients, selectPatient } = usePatient(); // Get context functions
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PatientFromContext>>({ ...patient });

  useEffect(() => {
    // Sync formData when patient prop changes and not in edit mode
    if (!isEditing) {
      setFormData({ ...patient });
    }
  }, [patient, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value || null })); // Set to null if empty string for Supabase
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target; // value is YYYY-MM-DD
    setFormData(prev => ({ ...prev, [name]: value || null }));
  };


  const handleEdit = () => {
    setFormData({ ...patient }); // Ensure form starts with current patient data
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({ ...patient }); // Reset changes
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!patient?.id) {
      toast.error("Patient ID is missing.");
      return;
    }

    // Basic validation example (name is required)
    if (!formData.name?.trim()) {
        toast.error("Patient name cannot be empty.");
        return;
    }
    // DOB validation (ensure it's a valid date if provided)
    if (formData.date_of_birth && isNaN(new Date(formData.date_of_birth).getTime())) {
        toast.error("Invalid Date of Birth.");
        return;
    }


    const updateData: Partial<PatientFromContext> & { updated_at: string } = {
      // Only include fields that are meant to be editable
      name: formData.name,
      date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : undefined,
      gender: formData.gender,
      cpf: formData.cpf,
      rg: formData.rg,
      phone_number: formData.phone_number,
      email: formData.email,
      address: formData.address, 
      updated_at: new Date().toISOString(),
    };
    
    // Remove keys with undefined values to prevent Supabase errors
    Object.keys(updateData).forEach(key => {
        const typedKey = key as keyof typeof updateData;
        if (updateData[typedKey] === undefined) {
            delete updateData[typedKey];
        }
    });


    try {
      const { data, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patient.id)
        .select() // Select the updated row
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        toast.success("Patient profile updated successfully.");
        await fetchPatients(); // Refresh the entire patient list
        // Attempt to re-select the patient to update context.
        // This relies on fetchPatients correctly updating the list that selectPatient uses.
        selectPatient(data as PatientFromContext); 
        setFormData(data as PatientFromContext); // Update local form data with saved data
      }
      setIsEditing(false);
    } catch (error: any) {
      toast.error(`Failed to update patient: ${error.message}`);
      console.error("Error updating patient:", error);
    }
  };
  
  // Prepare display values, handling potential null/undefined from formData or patient
  // When not editing, always use `patient` prop for stable display until save.
  // When editing, use `formData`.
  const displayData = isEditing ? formData : patient;
  
  const displayName = displayData.name || "Selected Patient";
  const displayDob = displayData.date_of_birth 
    ? new Date(displayData.date_of_birth).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) // Ensure UTC for consistency if DOB is stored as ISO string
    : "Not available";
  const displayAge = displayData.date_of_birth 
    ? (new Date().getFullYear() - new Date(displayData.date_of_birth).getFullYear()) 
    : undefined;
  const displayPatientId = `#${patient.id.substring(0,8).toUpperCase()}...`; // Original patient ID, should not be editable or change

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            {/* Title should reflect the patient being viewed, not editable formData name */}
            <span>Demographics: {patient.name || "Selected Patient"}</span> 
            {!isEditing ? (
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleEdit}>
                <LucideEdit className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={handleSave}>
                        <LucideCheck className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Save Changes</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={handleCancel}>
                        <LucideX className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Cancel</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          {isEditing ? (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <div>
                  <Label htmlFor="name" className="text-xs">Name</Label>
                  <Input type="text" name="name" id="name" value={formData.name || ''} onChange={handleInputChange} className="h-8 text-xs" />
                </div>
                <div>
                  <Label htmlFor="date_of_birth" className="text-xs">Date of Birth</Label>
                  <Input 
                    type="date" name="date_of_birth" id="date_of_birth" 
                    // Ensure date is formatted as YYYY-MM-DD for input type="date"
                    value={formData.date_of_birth ? formData.date_of_birth.split('T')[0] : ''} 
                    onChange={handleDateChange} className="h-8 text-xs" 
                  />
                </div>
                <div>
                  <Label htmlFor="gender" className="text-xs">Gender</Label>
                  <Input type="text" name="gender" id="gender" value={formData.gender || ''} onChange={handleInputChange} className="h-8 text-xs" placeholder="e.g., Male, Female, Other" />
                </div>
                <div>
                  <Label htmlFor="cpf" className="text-xs">CPF</Label>
                  <Input type="text" name="cpf" id="cpf" value={formData.cpf || ''} onChange={handleInputChange} className="h-8 text-xs" placeholder="000.000.000-00"/>
                </div>
                <div>
                  <Label htmlFor="rg" className="text-xs">RG</Label>
                  <Input type="text" name="rg" id="rg" value={formData.rg || ''} onChange={handleInputChange} className="h-8 text-xs" />
                </div>
                <div>
                  <Label htmlFor="phone_number" className="text-xs">Phone</Label>
                  <Input type="tel" name="phone_number" id="phone_number" value={formData.phone_number || ''} onChange={handleInputChange} className="h-8 text-xs" placeholder="(XX) XXXXX-XXXX"/>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input type="email" name="email" id="email" value={formData.email || ''} onChange={handleInputChange} className="h-8 text-xs" placeholder="patient@example.com"/>
                </div>
                 <div className="col-span-2">
                  <Label htmlFor="address" className="text-xs">Address</Label>
                  <Input type="text" name="address" id="address" value={formData.address || ''} onChange={handleInputChange} className="h-8 text-xs" placeholder="Street, Number, City, State"/>
                </div>
              </div>
            </>
          ) : (
            // View Mode - uses `displayData` which points to `patient` prop
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Patient ID</p>
                <p className="font-mono text-[11px]">{displayPatientId}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">Name</p>
                <p>{patient.name || "Not registered"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">Date of Birth</p>
                <p>{(patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : "Not available")} {displayAge !== undefined && `(${displayAge} y/o)`}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">Gender</p>
                <p>{patient.gender || "Not specified"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">CPF</p>
                <p>{patient.cpf || "Not registered"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">RG</p>
                <p>{patient.rg || "Not registered"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">Phone</p>
                <p>{patient.phone_number || "Not registered"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">Email</p>
                <p>{patient.email || "Not registered"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs font-medium">Address</p>
                <p>{patient.address || "Not registered"}</p>
              </div>
            </div>
          )}
          {!isEditing && (
            <p className="text-xs text-muted-foreground pt-1 italic">Allergies, conditions, and other medical data are managed in their respective sections.</p>
          )}
        </CardContent>
      </Card>
      {/* Other cards remain unchanged for now, but could also become editable */}
      <Card><CardHeader><CardTitle className="text-base font-semibold">Medical Conditions</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground italic">Data for {patient.name || "Selected Patient"} not yet linked.</p></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base font-semibold">Current Medications</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground italic">Data for {patient.name || "Selected Patient"} not yet linked.</p></CardContent></Card>
      <Card className="border-destructive/30"><CardHeader className="text-destructive"><CardTitle className="text-base font-semibold flex items-center gap-1.5"><LucideAlertCircle className="h-4 w-4" />Allergies</CardTitle></CardHeader><CardContent className="bg-destructive/5"><p className="text-xs text-muted-foreground italic">Data for {patient.name || "Selected Patient"} not yet linked.</p></CardContent></Card>
    </div>
  )
}

function PatientHistory({ patient }: PatientSubComponentProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base font-semibold">Consultation History: {patient.name || "Selected Patient"}</CardTitle></CardHeader>
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
      const { data: rawData, error } = await supabase
        .from('medical_records')
        .select('id, record_date, note_content, doctor_id, doctors ( name )')
        .eq('patient_id', activePatient.id)
        .order('record_date', { ascending: false })

      if (error) {
        toast.error(`Failed to fetch notes: ${error.message}`)
        throw error
      }
      
      const formattedData = rawData?.map(record => ({
        ...record,
        doctors: record.doctors && Array.isArray(record.doctors) && record.doctors.length > 0 
                   ? record.doctors[0] 
                   : (record.doctors && !Array.isArray(record.doctors) ? record.doctors : null)
      })) || [];
      setPreviousNotes(formattedData as MedicalRecord[]);
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
      const { data: rawData, error } = await supabase
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

      if (rawData) {
        const formattedData = {
            ...rawData,
            doctors: rawData.doctors && Array.isArray(rawData.doctors) && rawData.doctors.length > 0 
                       ? rawData.doctors[0] 
                       : (rawData.doctors && !Array.isArray(rawData.doctors) ? rawData.doctors : null)
        };
        setPreviousNotes((prev) => [formattedData as MedicalRecord, ...prev].sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()))
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
 