"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Patient } from '@/contexts/PatientContext';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientData: Omit<Patient, 'id' | 'age'>) => Promise<void>;
}

export function NewPatientModal({ isOpen, onClose, onSave }: NewPatientModalProps) {
  const [name, setName] = useState('');
  const [rg, setRg] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [primaryCondition, setPrimaryCondition] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name) {
      alert("Patient name is required.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        name,
        rg: rg || undefined,
        email: email || undefined,
        cpf: cpf || undefined,
        date_of_birth: dateOfBirth || undefined,
        gender: gender || undefined,
        phone_number: phoneNumber || undefined,
        address: address || undefined,
        medical_history_summary: medicalHistory || undefined,
        primary_condition: primaryCondition || undefined,
      });
      setName('');
      setRg('');
      setEmail('');
      setCpf('');
      setDateOfBirth('');
      setGender('');
      setPhoneNumber('');
      setAddress('');
      setMedicalHistory('');
      setPrimaryCondition('');
      onClose();
    } catch (error) {
      console.error("Failed to save patient:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new patient. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Patient's full name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rg" className="text-right">
              RG
            </Label>
            <Input
              id="rg"
              value={rg}
              onChange={(e) => setRg(e.target.value)}
              className="col-span-3"
              placeholder="Patient's RG"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cpf" className="text-right">
              CPF
            </Label>
            <Input
              id="cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="col-span-3"
              placeholder="Patient's CPF"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              placeholder="patient@example.com"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dateOfBirth" className="text-right">
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gender" className="text-right">
              Gender
            </Label>
            <Input
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Male, Female, Other"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phoneNumber" className="text-right">
              Phone
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="col-span-3"
              placeholder="(XX) XXXXX-XXXX"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Address
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="col-span-3"
              placeholder="Street, Number, City, State"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="primaryCondition" className="text-right">
              Primary Condition
            </Label>
            <Input
              id="primaryCondition"
              value={primaryCondition}
              onChange={(e) => setPrimaryCondition(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Chronic Pain"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="medicalHistory" className="text-right">
              Medical History
            </Label>
            <Input
              id="medicalHistory"
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              className="col-span-3"
              placeholder="Brief summary"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Patient'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 