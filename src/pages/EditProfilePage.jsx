// src/pages/EditProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UploadCloud } from 'lucide-react';

export default function EditProfilePage() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '', lastName1: '', lastName2: '', birthDate: '', 
        gender: '', profession: '', education: '', country: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if(user) {
            setFormData({
                firstName: user.firstName || '',
                lastName1: user.lastName1 || '',
                lastName2: user.lastName2 || '',
                birthDate: user.birthDate || '',
                gender: user.gender || '',
                profession: user.profession || '',
                education: user.education || '',
                country: user.country || '',
            });
            setAvatarPreview(user.avatarUrl || '');
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        if(e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
            setAvatarPreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const dataToUpdate = { ...formData };
            if (avatarFile) {
                const storageRef = ref(storage, `avatars/${user.uid}`);
                await uploadBytes(storageRef, avatarFile);
                dataToUpdate.avatarUrl = await getDownloadURL(storageRef);
            }

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, dataToUpdate);
            toast.success("¡Perfil actualizado con éxito!");
            navigate(`/profile/${user.uid}`);
        } catch (error) {
            toast.error("Error al actualizar el perfil.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const professions = {
        "Área de la Salud": ["Médico/a", "Enfermero/a", "Farmacéutico/a"],
        "Área de la Tecnología": ["Desarrollador/a de Software", "Científico/a de Datos"],
        "Otras": ["Estudiante", "Otro"],
    };
    const countries = ["España", "México", "Argentina", "Colombia", "Estados Unidos"];
    const educationLevels = ["Sin estudios", "En estudios", "Educación Primaria", "Educación Secundaria", "Bachillerato", "Formación Profesional (Grado Medio)", "Formación Profesional (Grado Superior)", "Educación Superior (Grado)", "Educación Superior (Máster)", "Educación Superior (Doctorado)", "Otros"];

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-4xl font-display font-bold mb-8 text-center">Editar Perfil</h1>
            <form onSubmit={handleSubmit} className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl space-y-4">
                <div className="flex flex-col items-center space-y-4">
                    <img src={avatarPreview || `https://ui-avatars.com/api/?name=${user?.username || '?'}&background=7c3aed&color=fff&size=128`} alt="Avatar" className="w-32 h-32 rounded-full object-cover"/>
                    <label htmlFor="avatar-upload" className="cursor-pointer bg-gray-200 dark:bg-gray-600 py-2 px-4 rounded-lg font-semibold flex items-center gap-2">
                        <UploadCloud size={16}/> Cambiar Foto
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label htmlFor="firstName" className="block text-sm font-bold mb-2">Nombre*</label><input id="firstName" type="text" required value={formData.firstName} onChange={handleChange} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"/></div>
                    <div><label htmlFor="lastName1" className="block text-sm font-bold mb-2">Primer Apellido*</label><input id="lastName1" type="text" required value={formData.lastName1} onChange={handleChange} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"/></div>
                </div>
                <div><label htmlFor="lastName2" className="block text-sm font-bold mb-2">Segundo Apellido (Opcional)</label><input id="lastName2" type="text" value={formData.lastName2} onChange={handleChange} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"/></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label htmlFor="birthDate" className="block text-sm font-bold mb-2">Fecha de Nacimiento*</label><input id="birthDate" type="date" required value={formData.birthDate} onChange={handleChange} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"/></div>
                    <div><label htmlFor="gender" className="block text-sm font-bold mb-2">Género*</label><select id="gender" required value={formData.gender} onChange={handleChange} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"><option value="">Seleccionar...</option><option value="male">Hombre</option><option value="female">Mujer</option><option value="other">Otro</option><option value="none">Prefiero no decirlo</option></select></div>
                </div>
                <div><label htmlFor="profession" className="block text-sm font-bold mb-2">Profesión*</label><select id="profession" required value={formData.profession} onChange={handleChange} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"><option value="">Seleccionar...</option>{Object.entries(professions).map(([area, jobs]) => (<optgroup label={area} key={area}>{jobs.map(job => <option key={job} value={job}>{job}</option>)}</optgroup>))}</select></div>
                <div><label htmlFor="education" className="block text-sm font-bold mb-2">Nivel de Estudios*</label><select id="education" required value={formData.education} onChange={handleChange} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"><option value="">Seleccionar...</option>{educationLevels.map(level=><option key={level} value={level}>{level}</option>)}</select></div>
                <div><label htmlFor="country" className="block text-sm font-bold mb-2">País*</label><select id="country" required value={formData.country} onChange={handleChange} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"><option value="">Seleccionar...</option>{countries.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => navigate(`/profile/${user.uid}`)} className="bg-gray-200 dark:bg-gray-600 text-black dark:text-white font-bold py-3 px-6 rounded-lg">Cancelar</button>
                    <button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg">{isLoading ? 'Guardando...' : 'Guardar Cambios'}</button>
                </div>
            </form>
        </div>
    );
}
