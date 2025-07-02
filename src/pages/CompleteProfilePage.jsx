// src/pages/CompleteProfilePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function CompleteProfilePage({ handleLogout }) {
    const { user } = useAuth();
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName1, setLastName1] = useState('');
    const [lastName2, setLastName2] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('');
    const [profession, setProfession] = useState('');
    const [education, setEducation] = useState('');
    const [country, setCountry] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const isValidUsername = (name) => /^(?=.{3,24}$)(?![_.])(?!.*[_.]{2})[a-z0-9._]+(?<![_.])$/.test(name);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const finalUsername = username.toLowerCase();
        
        if (!isValidUsername(finalUsername)) {
            toast.error("Nombre de usuario no válido.");
            return setIsLoading(false);
        }
        if (!firstName || !lastName1 || !birthDate || !gender || !profession || !education || !country) {
            toast.error("Por favor, completa todos los campos obligatorios.");
            return setIsLoading(false);
        }

        try {
            const usernameDocRef = doc(db, 'usernames', finalUsername);
            const usernameDoc = await getDoc(usernameDocRef);
            if (usernameDoc.exists()) {
                toast.error("Este nombre de usuario ya está en uso.");
                return setIsLoading(false);
            }

            const batch = writeBatch(db);
            const userRef = doc(db, 'users', user.uid);
            batch.set(userRef, { 
                username: finalUsername, 
                email: user.email,
                firstName,
                lastName1,
                lastName2,
                birthDate,
                gender,
                profession,
                education,
                country,
                createdAt: new Date(),
                votedPolls: []
            });
            batch.set(usernameDocRef, { uid: user.uid, email: user.email });
            await batch.commit();

            toast.success("¡Perfil completado! Ahora inicia sesión para continuar.");
            await handleLogout(true);
            navigate('/login');
            
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el perfil.");
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
            <h1 className="text-4xl font-display font-bold mb-8 text-center">Completa tu Perfil</h1>
            <p className="text-center text-gray-500 mb-6 -mt-4">Para poder disfrutar de Opinao, necesitamos que completes tu perfil.</p>
            <form onSubmit={handleSubmit} className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl space-y-4">
                <div><label htmlFor="username" className="block text-sm font-bold mb-2">Nombre de Usuario*</label><input id="username" type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"/></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label htmlFor="firstName" className="block text-sm font-bold mb-2">Nombre*</label><input id="firstName" type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"/></div>
                    <div><label htmlFor="lastName1" className="block text-sm font-bold mb-2">Primer Apellido*</label><input id="lastName1" type="text" required value={lastName1} onChange={e => setLastName1(e.target.value)} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"/></div>
                </div>
                <div><label htmlFor="lastName2" className="block text-sm font-bold mb-2">Segundo Apellido (Opcional)</label><input id="lastName2" type="text" value={lastName2} onChange={e => setLastName2(e.target.value)} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"/></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label htmlFor="birthDate" className="block text-sm font-bold mb-2">Fecha de Nacimiento*</label><input id="birthDate" type="date" required value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"/></div>
                    <div><label htmlFor="gender" className="block text-sm font-bold mb-2">Género*</label><select id="gender" required value={gender} onChange={e => setGender(e.target.value)} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"><option value="">Seleccionar...</option><option value="male">Hombre</option><option value="female">Mujer</option><option value="other">Otro</option><option value="none">Prefiero no decirlo</option></select></div>
                </div>
                <div><label htmlFor="profession" className="block text-sm font-bold mb-2">Profesión*</label><select id="profession" required value={profession} onChange={e => setProfession(e.target.value)} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"><option value="">Seleccionar...</option>{Object.entries(professions).map(([area, jobs]) => (<optgroup label={area} key={area}>{jobs.map(job => <option key={job} value={job}>{job}</option>)}</optgroup>))}</select></div>
                <div><label htmlFor="education" className="block text-sm font-bold mb-2">Nivel de Estudios*</label><select id="education" required value={education} onChange={e => setEducation(e.target.value)} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"><option value="">Seleccionar...</option>{educationLevels.map(level=><option key={level} value={level}>{level}</option>)}</select></div>
                <div><label htmlFor="country" className="block text-sm font-bold mb-2">País*</label><select id="country" required value={country} onChange={e => setCountry(e.target.value)} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg"><option value="">Seleccionar...</option>{countries.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg mt-4">{isLoading ? 'Guardando...' : 'Finalizar Registro'}</button>
            </form>
        </div>
    );
}
