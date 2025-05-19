// SettingsModal.js - Modal de configurações do médico

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { ActionButton } from '../ChatSection'; // Corrected path
import { useAuth } from '../AuthContext'; 
import { supabase } from '../supabaseClient'; 
import { useNavigate } from 'react-router-dom';

// ... rest of the file remains the same ...
// --- Modal Components ---
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${(props) => props.theme.colors.modalOverlay};
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background-color: ${(props) => props.theme.colors.modalBackground};
  border-radius: 8px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${(props) => props.theme.shadows.main};
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};

  h2 {
    font-size: 1.25rem;
    margin: 0;
    color: ${(props) => props.theme.colors.lightText};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${(props) => props.theme.colors.border};
`;

const CloseButton = styled.button`
  border: none;
  background: none;
  color: ${(props) => props.theme.colors.lightText};
  cursor: pointer;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

// --- Settings Form Components ---
const SettingsPanel = styled.div`
  background-color: ${(props) => props.theme.colors.messageBg};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: ${(props) => props.theme.shadows.main};

  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.primary};
  }
`;

const FormGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => props.theme.colors.prescriptionLabel};
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${(props) => props.theme.colors.prescriptionBorder};
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  transition: border-color 0.2s ease-in-out;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
  
  &[readOnly] {
    background-color: ${(props) => props.theme.colors.disabledInputBackground};
    color: ${(props) => props.theme.colors.disabledInputText};
    cursor: not-allowed;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${(props) => props.theme.colors.prescriptionBorder};
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  transition: border-color 0.2s ease-in-out;
  min-height: 80px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
`;

const LogoUploadArea = styled.div`
  border: 2px dashed ${(props) => props.theme.colors.border};
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  margin-top: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
  }

  input {
    display: none;
  }

  p {
    margin: 0;
    color: ${(props) => props.theme.colors.lightText};
    font-size: 0.9rem;
  }

  svg {
    margin-bottom: 0.5rem;
    color: ${(props) => props.theme.colors.lightText};
  }
`;

const LogoPreview = styled.div`
  margin-top: 1rem;
  text-align: center;

  img {
    max-width: 100%;
    max-height: 100px;
    border-radius: 4px;
    object-fit: cover;
  }
`;

const SuccessMessage = styled.div`
  background-color: ${(props) => props.theme.colors.success}20;
  color: ${(props) => props.theme.colors.success};
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  svg {
    flex-shrink: 0;
  }
`;

// Componente do Modal de Configurações
export function SettingsModal({ isOpen, onClose, doctorSettings, setDoctorSettings }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    crm: '',
    email: '',
    specialty: '',
    clinic_address: '',
    clinic_phone: '',
    profile_picture_url: ''
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [selectedLogoFile, setSelectedLogoFile] = useState(null); // Store selected file
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (user && isOpen) {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('name, crm, email, specialty, clinic_address, clinic_phone, profile_picture_url')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setFormData(prev => ({ ...prev, ...data, email: user.email }));
          setLogoPreview(data.profile_picture_url || '');
        } else {
          setFormData(prev => ({
            ...prev,
            email: user.email || '',
            name: user.user_metadata?.full_name || '',
          }));
          setLogoPreview('');
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [user, isOpen]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  useEffect(() => {
    if (!isOpen) {
      setShowSuccess(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Just preview the file, don't upload yet
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setSelectedLogoFile(file); // Store the file for later upload
      console.log("[handleLogoUpload] File selected and stored for upload:", file.name);
    }
  };

  // New function to handle the actual upload during save
  const uploadLogo = async (file) => {
    if (!file || !user) return null;
    
    console.log("[uploadLogo] Original file.name:", file.name);
    
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    
    console.log("[uploadLogo] Generated filePath for upload:", filePath);
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type || 'image/png',
          upsert: true,
        });

      if (uploadError) {
        console.log("Upload error details:", uploadError);
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);
        
      if (publicUrlData) {
        return publicUrlData.publicUrl;
      }
      return null;
    } catch (error) {
      console.error("Error uploading logo:", error);
      return null;
    }
  };
  
  // Function to delete old profile picture
  const deleteOldProfilePicture = async (oldPictureUrl) => {
    if (!oldPictureUrl) return;
    
    console.log("[deleteOldProfilePicture] Old picture URL:", oldPictureUrl);
    
    let oldPath = '';
    // Try different extraction methods
    const urlParts = oldPictureUrl.split('profile-pictures/');
    if (urlParts.length > 1) {
      oldPath = urlParts[1];
    } else {
      // Alternative method: extract from full URL
      try {
        const urlObj = new URL(oldPictureUrl);
        const pathSegments = urlObj.pathname.split('/');
        // Find the index after 'profile-pictures'
        const index = pathSegments.findIndex(segment => segment === 'profile-pictures');
        if (index !== -1 && index < pathSegments.length - 1) {
          // Combine the remaining segments
          oldPath = pathSegments.slice(index + 1).join('/');
        }
      } catch (error) {
        console.error("Error parsing URL:", error);
      }
    }
    
    if (oldPath) {
      console.log("[deleteOldProfilePicture] Deleting old profile picture:", oldPath);
      
      const { data, error: deleteError } = await supabase.storage
        .from('profile-pictures')
        .remove([oldPath]);
        
      console.log("[deleteOldProfilePicture] Delete response:", data);
      
      if (deleteError) {
        console.error("Error deleting old profile picture:", deleteError);
      }
    } else {
      console.error("[deleteOldProfilePicture] Could not extract path from URL:", oldPictureUrl);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setShowSuccess(false);

    try {
      let profilePictureUrl = formData.profile_picture_url;
      
      // Upload new picture if selected
      if (selectedLogoFile) {
        const newUrl = await uploadLogo(selectedLogoFile);
        if (newUrl) {
          // Save old URL for deletion after successful database update
          const oldUrl = profilePictureUrl;
          profilePictureUrl = newUrl;
          
          // Update form data with new URL
          setFormData(prev => ({
            ...prev,
            profile_picture_url: newUrl
          }));
          
          // Delete old picture after successful upload and database update
          if (oldUrl && oldUrl !== newUrl) {
            await deleteOldProfilePicture(oldUrl);
          }
        }
      }
      
      const { email, ...profileDataToSave } = formData;
      
      const dataToUpsert = {
          id: user.id,
          name: profileDataToSave.name,
          crm: profileDataToSave.crm,
          specialty: profileDataToSave.specialty,
          clinic_address: profileDataToSave.clinic_address,
          clinic_phone: profileDataToSave.clinic_phone,
          profile_picture_url: profilePictureUrl,
          email: user.email,
          updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('doctors')
        .upsert(dataToUpsert, { onConflict: 'id' });

      if (error) throw error;

      const updatedDoctorSettings = {
        doctorName: dataToUpsert.name,
        crm: dataToUpsert.crm,
        phone: dataToUpsert.clinic_phone,
        address: dataToUpsert.clinic_address,
        logo: dataToUpsert.profile_picture_url,
      };
      setDoctorSettings(updatedDoctorSettings); 
      
      // Clear the selected file since it's been processed
      setSelectedLogoFile(null);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setSaving(true);
    try {
      await supabase.auth.signOut();
      navigate('/login');
      onClose();
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Configurações do Médico</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <ModalBody>
          {loading && <p>Carregando perfil...</p>}
          {!loading && (
            <>
              {showSuccess && (
                <SuccessMessage>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  Configurações salvas com sucesso!
                </SuccessMessage>
              )}
              <SettingsPanel>
                <h3>Informações Pessoais e Contato</h3>
                <FormGroup>
                  <div>
                    <FormLabel htmlFor="email">Email (não editável)</FormLabel>
                    <FormInput type="email" id="email" name="email" value={formData.email || ''} readOnly />
                  </div>
                  <div>
                    <FormLabel htmlFor="name">Nome Completo</FormLabel>
                    <FormInput type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} placeholder="Dr. Nome Completo" />
                  </div>
                </FormGroup>
              </SettingsPanel>

              <SettingsPanel>
                <h3>Informações Profissionais</h3>
                <FormGroup>
                  <div>
                    <FormLabel htmlFor="crm">CRM</FormLabel>
                    <FormInput type="text" id="crm" name="crm" value={formData.crm || ''} onChange={handleChange} placeholder="CRM/UF 12345" />
                  </div>
                  <div>
                    <FormLabel htmlFor="specialty">Especialidade</FormLabel>
                    <FormInput type="text" id="specialty" name="specialty" value={formData.specialty || ''} onChange={handleChange} placeholder="Cardiologia" />
                  </div>
                </FormGroup>
                <div>
                  <FormLabel htmlFor="clinic_address">Endereço da Clínica</FormLabel>
                  <FormTextarea id="clinic_address" name="clinic_address" value={formData.clinic_address || ''} onChange={handleChange} placeholder="Rua, número, bairro, cidade - UF, CEP" />
                </div>
                <div style={{marginTop: '1rem'}}>
                  <FormLabel htmlFor="clinic_phone">Telefone da Clínica</FormLabel>
                  <FormInput type="text" id="clinic_phone" name="clinic_phone" value={formData.clinic_phone || ''} onChange={handleChange} placeholder="(00) 00000-0000" />
                </div>
              </SettingsPanel>

              <SettingsPanel>
                <h3>Logo/Foto de Perfil</h3>
                <LogoUploadArea onClick={() => document.getElementById('logoUpload').click()}>
                  <input type="file" id="logoUpload" accept="image/*" onChange={handleLogoUpload} />
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <p>{logoPreview ? 'Clique para alterar o logo' : 'Clique para carregar um logo'}</p>
                </LogoUploadArea>
                {logoPreview && (
                  <LogoPreview>
                    <img src={logoPreview} alt="Pré-visualização do Logo" />
                    {selectedLogoFile && (
                      <p style={{fontSize: "0.8rem", color: "#999", marginTop: "0.5rem"}}>
                        A imagem será salva quando você clicar em "Salvar Alterações"
                      </p>
                    )}
                  </LogoPreview>
                )}
              </SettingsPanel>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <ActionButton onClick={handleLogout} disabled={saving} className="danger">
            {saving ? 'Saindo...': 'Sair'}
          </ActionButton>
          <div>
            <ActionButton onClick={onClose} disabled={saving} style={{marginRight: '0.5rem'}}>Cancelar</ActionButton>
            <ActionButton className="success" onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Salvando...' : (loading ? 'Carregando...' : 'Salvar Alterações')}
            </ActionButton>
          </div>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
} 