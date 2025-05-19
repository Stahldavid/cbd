import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // Adjust path if needed

const MedicalRecordForm = ({ patientId, doctorId, recordToEdit, onRecordAdded, onRecordUpdated, onCancelEdit }) => {
    const [noteContent, setNoteContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const isEditing = !!recordToEdit;

    useEffect(() => {
        if (isEditing && recordToEdit) {
            setNoteContent(recordToEdit.note_content || '');
        } else {
            setNoteContent(''); // Reset for new entry
        }
    }, [recordToEdit, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!noteContent.trim()) {
            setError("O conteúdo da anotação não pode estar vazio.");
            return;
        }
        if (!patientId || (!isEditing && !doctorId)) {
            setError("Informações do paciente ou médico ausentes.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage('');

        try {
            if (isEditing) {
                // Update existing record
                const { data, error: updateError } = await supabase
                    .from('medical_records')
                    .update({ note_content: noteContent, updated_at: new Date().toISOString() }) // Assuming you add an updated_at to medical_records if needed
                    .eq('id', recordToEdit.id)
                    .eq('doctor_id', doctorId) // Ensure doctor owns the record they are editing
                    .select()
                    .single();
                if (updateError) throw updateError;
                setSuccessMessage('Anotação atualizada com sucesso!');
                if (onRecordUpdated) onRecordUpdated(data);
            } else {
                // Add new record
                const { data, error: insertError } = await supabase
                    .from('medical_records')
                    .insert([{ 
                        patient_id: patientId, 
                        doctor_id: doctorId, 
                        note_content: noteContent 
                    }])
                    .select()
                    .single();
                if (insertError) throw insertError;
                setSuccessMessage('Anotação adicionada com sucesso!');
                setNoteContent(''); // Clear form after successful submission
                if (onRecordAdded) onRecordAdded(data); // Callback to update list
            }
        } catch (err) {
            console.error('Error saving medical record:', err);
            setError(`Falha ao salvar anotação: ${err.message}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="medical-record-form p-4 border rounded-lg shadow-sm bg-gray-50">
            <h4 className="text-md font-semibold mb-2">{isEditing ? 'Editar Anotação' : 'Adicionar Nova Anotação'}</h4>
            <textarea 
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Digite sua anotação médica aqui..."
                rows="5"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
            />
            {error && <p className="text-red-600 text-sm mt-1">Erro: {error}</p>}
            {successMessage && <p className="text-green-600 text-sm mt-1">{successMessage}</p>}
            <div className="mt-3 flex items-center justify-end space-x-3">
                {isEditing && onCancelEdit && (
                    <button 
                        type="button"
                        onClick={onCancelEdit}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Cancelar
                    </button>
                )}
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400"
                >
                    {isLoading ? (isEditing ? 'Salvando...' : 'Adicionando...') : (isEditing ? 'Salvar Alterações' : 'Adicionar Anotação')}
                </button>
            </div>
        </form>
    );
};

export default MedicalRecordForm; 