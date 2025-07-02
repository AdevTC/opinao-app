// src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const ValidationError = ({ message }) => {
    if (!message) return null;
    return <p className="text-red-500 text-xs mt-1">{message}</p>;
};

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const validatePassword = (pass) => {
        const newErrors = {};
        if (pass.length < 8) newErrors.password = "Mínimo 8 caracteres.";
        else if (pass.length > 32) newErrors.password = "Máximo 32 caracteres.";
        else if (!/[A-Z]/.test(pass)) newErrors.password = "Debe incluir una mayúscula.";
        else if (!/[a-z]/.test(pass)) newErrors.password = "Debe incluir una minúscula.";
        else if (!/\d/.test(pass)) newErrors.password = "Debe incluir un número.";
        else if (!/[_$\u20AC]/.test(pass)) newErrors.password = "Debe incluir un símbolo (_, $, €).";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        const emailError = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Formato de email inválido." : "";
        const passwordErrors = validatePassword(password);
        const confirmPasswordError = password !== confirmPassword ? "Las contraseñas no coinciden." : "";
        
        const newErrors = { email: emailError, password: passwordErrors.password, confirmPassword: confirmPasswordError };
        setErrors(newErrors);

        const hasErrors = Object.values(newErrors).some(error => error);
        if (hasErrors) {
            setIsLoading(false);
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            toast.success('¡Cuenta creada! Ahora completa tu perfil.');
            navigate("/complete-profile");
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                setErrors({ ...errors, email: "Este correo electrónico ya está en uso." });
            } else {
                toast.error("Error al crear la cuenta.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl">
                <h2 className="text-3xl font-display font-bold text-center mb-6">Crear Cuenta</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-bold mb-2">Email</label>
                        <input type="text" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg" placeholder="tu@email.com" />
                        <ValidationError message={errors.email} />
                    </div>
                    <div className="relative">
                        <label htmlFor="password" className="block text-sm font-bold mb-2">Contraseña</label>
                        <input type={passwordVisible ? "text" : "password"} id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg" placeholder="••••••••" />
                        <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-500"><Eye size={20} /></button>
                        <ValidationError message={errors.password} />
                    </div>
                    <div className="relative">
                        <label htmlFor="confirmPassword" className="block text-sm font-bold mb-2">Repetir Contraseña</label>
                        <input type={passwordVisible ? "text" : "password"} id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg" placeholder="••••••••" />
                        <ValidationError message={errors.confirmPassword} />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg mt-4 transition-all">{isLoading ? 'Creando cuenta...' : 'Registrarse'}</button>
                </form>
                <p className="text-center mt-6 text-sm">¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="font-bold text-primary ml-2 hover:underline">Inicia Sesión</Link>
                </p>
            </div>
        </div>
    );
}
