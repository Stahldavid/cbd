import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // Adjust path if needed

const PatientDetails = ({ patient, onPatientUpdate }) => {
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (patient) {
            setFormData({
                name: patient.name || '',
                date_of_birth: patient.date_of_birth || '',
                rg: patient.rg || '',
                cpf: patient.cpf || '',
                phone_number: patient.phone_number || '',
                email: patient.email || '',
                address: patient.address || '',
                gender: patient.gender || '',
                medical_history_summary: patient.medical_history_summary || ''
            });
        }
    }, [patient]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!patient || !patient.id) {
            setError("ID do paciente não encontrado.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMessage('');

        try {
            const updates = { ...formData };
            // Ensure date_of_birth is null if empty, otherwise it might cause DB error
            if (updates.date_of_birth === '') updates.date_of_birth = null;

            const { data: updatedPatient, error: updateError } = await supabase
                .from('patients')
                .update(updates)
                .eq('id', patient.id)
                .select()
                .single(); // Use single() if you expect one record back

            if (updateError) throw updateError;

            setSuccessMessage('Dados do paciente atualizados com sucesso!');
            if (onPatientUpdate) {
                onPatientUpdate(updatedPatient); // Update parent state if needed
            }
        } catch (err) {
            console.error('Error updating patient details:', err);
            setError('Falha ao atualizar dados do paciente: ' + err.message);
        } finally {
            setIsLoading(false);
            setTimeout(() => setSuccessMessage(''), 3000); // Clear success message after 3s
        }
    };

    if (!patient) return <p>Nenhum paciente selecionado.</p>;

    const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-700";

    return (
        <form onSubmit={handleSubmit} className="patient-details space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className={labelClass}>Nome Completo:</label>
                    <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                    <label htmlFor="date_of_birth" className={labelClass}>Data de Nascimento:</label>
                    <input type="date" name="date_of_birth" id="date_of_birth" value={formData.date_of_birth || ''} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                    <label htmlFor="rg" className={labelClass}>RG:</label>
                    <input type="text" name="rg" id="rg" value={formData.rg || ''} onChange={handleChange} className={inputClass} />
                </div>
                 <div>
                    <label htmlFor="cpf" className={labelClass}>CPF:</label>
                    <input type="text" name="cpf" id="cpf" value={formData.cpf || ''} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                    <label htmlFor="gender" className={labelClass}>Gênero:</label>
                    <input type="text" name="gender" id="gender" value={formData.gender || ''} onChange={handleChange} className={inputClass} placeholder="Masculino, Feminino, Outro" />
                </div>
                <div>
                    <label htmlFor="phone_number" className={labelClass}>Telefone:</label>
                    <input type="tel" name="phone_number" id="phone_number" value={formData.phone_number || ''} onChange={handleChange} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="email" className={labelClass}>Email:</label>
                    <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="address" className={labelClass}>Endereço:</label>
                    <textarea name="address" id="address" rows="2" value={formData.address || ''} onChange={handleChange} className={inputClass}></textarea>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="medical_history_summary" className={labelClass}>Resumo do Histórico Médico:</label>
                    <textarea name="medical_history_summary" id="medical_history_summary" rows="4" value={formData.medical_history_summary || ''} onChange={handleChange} className={inputClass}></textarea>
                </div>
            </div>

            {error && <p className="text-red-600 text-sm">Erro: {error}</p>}
            {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}

            <button 
                type="submit" 
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
            >
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
        </form>
    );
};

export default PatientDetails; 