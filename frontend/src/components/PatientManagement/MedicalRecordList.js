import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient'; // Adjust path if needed
// import MedicalRecordForm from './MedicalRecordForm'; // For editing existing records

const MedicalRecordList = ({ patientId, currentDoctorId }) => {
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // const [editingRecord, setEditingRecord] = useState(null); // For inline editing

    const fetchRecords = useCallback(async () => {
        if (!patientId) return;
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('medical_records')
                .select(`
                    id,
                    record_date,
                    note_content,
                    doctor_id,
                    doctors ( name, id ) 
                `)
                .eq('patient_id', patientId)
                .order('record_date', { ascending: false });
            
            if (fetchError) throw fetchError;
            setRecords(data || []);
        } catch (err) {
            console.error('Error fetching medical records:', err);
            setError('Falha ao carregar histórico médico.');
        } finally {
            setIsLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleDeleteRecord = async (recordId) => {
        if (!window.confirm("Tem certeza que deseja excluir esta anotação?")) return;

        setIsLoading(true); // Consider a specific loading state for delete
        try {
            const { error: deleteError } = await supabase
                .from('medical_records')
                .delete()
                .eq('id', recordId)
                .eq('doctor_id', currentDoctorId); // Ensure only owner can delete through UI action
            
            if (deleteError) throw deleteError;
            setRecords(prevRecords => prevRecords.filter(r => r.id !== recordId));
            // Show success message
        } catch (err) {
            console.error('Error deleting medical record:', err);
            setError('Falha ao excluir anotação: ' + (err.message || 'Verifique suas permissões.'));
        }
        setIsLoading(false);
    };

    // const handleEditRecord = (record) => {
    //     setEditingRecord(record);
    // };

    // const handleUpdateRecord = (updatedRecord) => {
    //     setRecords(prevRecords => prevRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    //     setEditingRecord(null);
    // };

    if (isLoading) return <p>Carregando histórico médico...</p>;
    if (error) return <p className="text-red-600">Erro: {error}</p>;
    if (records.length === 0) return <p>Nenhuma anotação no histórico médico para este paciente.</p>;

    return (
        <div className="medical-record-list space-y-4">
            {/* editingRecord && (
                <MedicalRecordForm 
                    patientId={patientId} 
                    doctorId={currentDoctorId} 
                    recordToEdit={editingRecord}
                    onRecordUpdated={handleUpdateRecord}
                    onCancelEdit={() => setEditingRecord(null)}
                />
            ) */} 
            {records.map(record => (
                <div key={record.id} className="p-3 border rounded-md shadow-sm bg-white">
                    <p className="text-sm text-gray-500">
                        Data: {new Date(record.record_date).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-500">
                        Médico: {record.doctors?.name || 'Desconhecido'} (ID: {record.doctor_id.substring(0,8)}...)
                    </p>
                    <p className="mt-1 text-gray-800 whitespace-pre-wrap">{record.note_content}</p>
                    {currentDoctorId === record.doctor_id && (
                        <div className="mt-2 text-right">
                            {/* <button 
                                onClick={() => handleEditRecord(record)} 
                                className="text-xs text-blue-600 hover:text-blue-800 mr-2"
                            >
                                Editar
                            </button> */}
                            <button 
                                onClick={() => handleDeleteRecord(record.id)} 
                                className="text-xs text-red-600 hover:text-red-800"
                                disabled={isLoading}
                            >
                                Excluir
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default MedicalRecordList; 