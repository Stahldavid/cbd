import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // VERIFY THIS PATH!
import PatientSearch from './PatientSearch';
import PatientDetails from './PatientDetails';
import MedicalRecordList from './MedicalRecordList';
import MedicalRecordForm from './MedicalRecordForm';

const PatientMainView = () => {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [currentUser, setCurrentUser] = useState(null); // To store logged-in doctor's info (specifically their ID)
    const [refreshRecordListKey, setRefreshRecordListKey] = useState(0); // Key to trigger MedicalRecordList refresh

    useEffect(() => {
        const getUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                console.error("Error fetching user:", error);
                return;
            }
            if (user) {
                // Assuming user.id is the doctor_id you need for RLS and record creation.
                // If you store doctor-specific profiles in your 'doctors' table linked by auth.uid(),
                // you might want to fetch that profile here as well.
                setCurrentUser(user);
            }
        };
        getUser();
    }, []);

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        setRefreshRecordListKey(prevKey => prevKey + 1); // Change key to force re-render/re-fetch of records
    };

    const handlePatientUpdate = (updatedPatient) => {
        // If the selected patient is updated, reflect changes immediately.
        setSelectedPatient(updatedPatient);
        console.log("Patient details updated in MainView:", updatedPatient);
        // Optionally, you could also refresh the search list if name/RG changed significantly,
        // but typically not needed just for summary updates.
    };

    const handleNewRecord = (newRecord) => {
        console.log("New medical record added:", newRecord);
        // Trigger a refresh of the medical record list
        setRefreshRecordListKey(prevKey => prevKey + 1);
    };
    
    const handleRecordUpdated = (updatedRecord) => {
        console.log("Medical record updated:", updatedRecord);
        setRefreshRecordListKey(prevKey => prevKey + 1);
    };

    return (
        <div className="patient-main-view p-4 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-700">Gerenciamento de Pacientes</h1>
            
            <PatientSearch onPatientSelect={handlePatientSelect} />
            
            {selectedPatient && (
                <div className="mt-6 p-6 border border-gray-200 rounded-lg shadow-md bg-white">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Detalhes do Paciente: {selectedPatient.name}</h2>
                    <PatientDetails patient={selectedPatient} onPatientUpdate={handlePatientUpdate} />
                    
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-3 text-gray-700">Histórico Médico</h3>
                        <MedicalRecordList 
                            patientId={selectedPatient.id} 
                            currentDoctorId={currentUser?.id} 
                            key={refreshRecordListKey} // Force re-render/re-fetch when key changes
                        />
                    </div>
                    
                    {currentUser && (
                        <div className="mt-8">
                            <h3 className="text-xl font-semibold mb-3 text-gray-700">Adicionar Nova Anotação</h3>
                            <MedicalRecordForm 
                                patientId={selectedPatient.id} 
                                doctorId={currentUser.id} 
                                onRecordAdded={handleNewRecord}
                                // For editing existing records (optional feature)
                                // recordToEdit={someEditingRecordState} 
                                // onRecordUpdated={handleRecordUpdated}
                                // onCancelEdit={() => setSomeEditingRecordState(null)}
                            />
                        </div>
                    )}
                </div>
            )}

            {!selectedPatient && (
                <p className="mt-6 text-center text-gray-500">Busque por um paciente para ver ou adicionar informações.</p>
            )}
        </div>
    );
};

export default PatientMainView; 