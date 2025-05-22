"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient"; // Supabase client
import { toast } from "sonner"; // For notifications

// Interface for doctor profile data, align with your Supabase table structure
interface DoctorProfile {
  id: string;
  name?: string | null;
  crm?: string | null;
  specialty?: string | null;
  clinic_address?: string | null; // Ensure snake_case matches Supabase
  clinic_phone?: string | null; // Ensure snake_case matches Supabase
  email?: string | null;
  profile_picture_url?: string | null; // Ensure snake_case matches Supabase
  updated_at?: string;
}

interface DoctorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DoctorSettingsModal: React.FC<DoctorSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [crm, setCrm] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }

    if (!isOpen || !user?.id) {
      // Reset form when modal is closed or user is not available
      setName("");
      setCrm("");
      setSpecialty("");
      setClinicAddress("");
      setClinicPhone("");
      setLogoPreview(null);
      setSelectedLogoFile(null);
      return;
    }

    const fetchDoctorProfile = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      toast.info("Fetching profile...");
      try {
        const { data, error } = await supabase
          .from("doctors")
          .select(
            "name, crm, specialty, clinic_address, clinic_phone, profile_picture_url"
          )
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116: No rows found (expected for new profiles)
          throw error;
        }

        if (data) {
          setName(data.name || "");
          setCrm(data.crm || "");
          setSpecialty(data.specialty || "");
          setClinicAddress(data.clinic_address || "");
          setClinicPhone(data.clinic_phone || "");
          setLogoPreview(data.profile_picture_url || null);
        } else {
          // No profile exists, reset fields to ensure a clean slate for a new profile
          setName("");
          setCrm("");
          setSpecialty("");
          setClinicAddress("");
          setClinicPhone("");
          setLogoPreview(null);
          toast.info("No existing profile found. You can create one now.");
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        toast.error(`Failed to fetch profile: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctorProfile();
  }, [isOpen, user]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string); // Show local preview immediately
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("User not authenticated. Cannot save settings.");
      return;
    }
    setIsLoading(true);

    let logoUrlToSave: string | null = logoPreview; // Keep existing if no new logo

    if (selectedLogoFile) {
      const fileExt = selectedLogoFile.name.split(".").pop();
      // Using a more robust way to generate a unique name, though user.id is good, timestamp helps with potential re-uploads
      const fileName = `logo-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; // Store under user's ID folder to organize

      toast.info("Uploading new logo...");
      try {
        const { error: uploadError } = await supabase.storage
          .from("profile-pictures") // Bucket name
          .upload(filePath, selectedLogoFile, {
            cacheControl: "3600",
            upsert: true, // Overwrite if a file with the same path exists
          });

        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(filePath);

        if (publicURLData) {
          logoUrlToSave = publicURLData.publicUrl;
          // Update preview to reflect the actual stored URL, important if there were transformations or if the local preview was a data URI
          setLogoPreview(logoUrlToSave); 
        } else {
          throw new Error("Failed to get public URL for the uploaded logo.");
        }
        toast.success("Logo uploaded successfully!");
      } catch (error: any) {
        console.error("Error uploading logo:", error);
        toast.error(`Logo upload failed: ${error.message}`);
        setIsLoading(false);
        return; // Stop save if logo upload fails
      }
    }

    const profileData: DoctorProfile = {
      id: user.id,
      name: name || null,
      crm: crm || null,
      specialty: specialty || null,
      clinic_address: clinicAddress || null,
      clinic_phone: clinicPhone || null,
      email: user.email, // Email from auth context
      profile_picture_url: logoUrlToSave,
      updated_at: new Date().toISOString(),
    };

    toast.info("Saving profile information...");
    try {
      const { error } = await supabase
        .from("doctors")
        .upsert(profileData, { onConflict: "id" }); // 'id' should be PK

      if (error) throw error;

      toast.success("Profile saved successfully!");
      // Optionally: re-fetch profile data if needed or update context
      onClose(); // Close modal on successful save
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(`Failed to save profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Doctor Settings</DialogTitle>
          <DialogDescription>
            Manage your profile and clinic information. Changes will be saved upon clicking "Save".
          </DialogDescription>
        </DialogHeader>
        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"><p>Loading...</p></div>}
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={logoPreview || undefined} alt="Clinic Logo" />
              <AvatarFallback>LOGO</AvatarFallback>
            </Avatar>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="text-sm"
              disabled={isLoading}
            />
            <Label htmlFor="logo" className="text-xs text-muted-foreground">
              Upload your clinic logo (e.g., PNG, JPG). Max 2MB.
            </Label>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Dr. John Doe" disabled={isLoading} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="crm" className="text-right">CRM</Label>
            <Input id="crm" value={crm} onChange={(e) => setCrm(e.target.value)} className="col-span-3" placeholder="123456/SP" disabled={isLoading} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="specialty" className="text-right">Specialty</Label>
            <Input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="col-span-3" placeholder="Cardiology" disabled={isLoading} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" value={email} readOnly className="col-span-3 bg-muted" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clinicAddress" className="text-right">Clinic Address</Label>
            <Input id="clinicAddress" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} className="col-span-3" placeholder="123 Main St, Anytown" disabled={isLoading} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clinicPhone" className="text-right">Clinic Phone</Label>
            <Input id="clinicPhone" value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} className="col-span-3" placeholder="(XX) XXXXX-XXXX" disabled={isLoading} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorSettingsModal;
