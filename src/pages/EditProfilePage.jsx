import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera } from 'lucide-react';

export default function EditProfilePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '', lastName1: '', lastName2: '', birthDate: '', 
        gender: '', profession: '', education: '', country: '', bio: ''
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [headerFile, setHeaderFile] = useState(null);
    const [headerPreview, setHeaderPreview] = useState('');

    const headerInputRef = useRef(null);

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
                bio: user.bio || '',
            });
            setAvatarPreview(user.avatarUrl || '');
            setHeaderPreview(user.headerUrl || '');
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
    
    const handleHeaderChange = (e) => {
        if(e.target.files[0]) {
            setHeaderFile(e.target.files[0]);
            setHeaderPreview(URL.createObjectURL(e.target.files[0]));
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

            if (headerFile) {
                const storageRef = ref(storage, `headers/${user.uid}`);
                await uploadBytes(storageRef, headerFile);
                dataToUpdate.headerUrl = await getDownloadURL(storageRef);
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

    const professions = { "Área de la Salud": ["Médico/a", "Enfermero/a", "Farmacéutico/a"], "Área de la Tecnología": ["Desarrollador/a de Software", "Científico/a de Datos"], "Otras": ["Estudiante", "Otro"], };
    const countries = ["España", "México", "Argentina", "Colombia", "Estados Unidos"];
    const educationLevels = ["Sin estudios", "En estudios", "Educación Primaria", "Educación Secundaria", "Bachillerato", "Formación Profesional (Grado Medio)", "Formación Profesional (Grado Superior)", "Educación Superior (Grado)", "Educación Superior (Máster)", "Educación Superior (Doctorado)", "Otros"];

    return (
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-4xl font-display font-bold mb-8 text-center">Editar Perfil</h1>
            
            <form onSubmit={handleSubmit} className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl space-y-6">
                
                <div className="relative h-48 bg-gray-200 dark:bg-gray-700 rounded-lg">
                    {headerPreview && <img src={headerPreview} alt="Cabecera" className="w-full h-full object-cover rounded-lg" />}
                    <label htmlFor="header-upload" className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full cursor-pointer hover:bg-black/70 transition-colors">
                        <Camera size={20} />
                    </label>
                    <input id="header-upload" ref={headerInputRef} type="file" accept="image/*" onChange={handleHeaderChange} className="hidden" />

                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                        <div className="relative group">
                            <img src={avatarPreview || `https://ui-avatars.com/api/?name=${user?.username || '?'}&background=7c3aed&color=fff&size=128`} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-light-container dark:border-dark-container"/>
                             <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 text-white flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} />
                            </label>
                            <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden"/>
                        </div>
                    </div>
                </div>
                <div className="pt-12"></div>

                <div>
                    <label htmlFor="bio" className="block text-sm font-bold mb-2">Biografía</label>
                    <textarea id="bio" value={formData.bio} onChange={handleChange} maxLength="160" placeholder="Cuéntale a la comunidad un poco sobre ti..." className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg min-h-[100px] resize-y"></textarea>
                    <p className="text-right text-xs text-gray-400">{formData.bio.length} / 160</p>
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
                
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={() => navigate(`/profile/${user.uid}`)} className="bg-gray-200 dark:bg-gray-600 text-black dark:text-white font-bold py-3 px-6 rounded-lg">Cancelar</button>
                    <button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg">{isLoading ? 'Guardando...' : 'Guardar Cambios'}</button>
                </div>
            </form>
        </div>
    );
}