// src/pages/AccountSettingsPage.jsx (Actualizado)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const ValidationError = ({ message }) => {
    if (!message) return null;
    return <p className="text-red-500 text-xs mt-1">{message}</p>;
};

export default function AccountSettingsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Estados para cambio de contraseña
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [errors, setErrors] = useState({});
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Estado para eliminar cuenta
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const validatePassword = (pass) => {
        if (pass.length < 8) return "Mínimo 8 caracteres.";
        if (pass.length > 32) return "Máximo 32 caracteres.";
        if (!/[A-Z]/.test(pass)) return "Debe incluir una mayúscula.";
        if (!/[a-z]/.test(pass)) return "Debe incluir una minúscula.";
        if (!/\d/.test(pass)) return "Debe incluir un número.";
        if (!/[_$\u20AC]/.test(pass)) return "Debe incluir un símbolo (_, $, €).";
        return "";
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setIsChangingPassword(true);
        setErrors({});

        const passwordError = validatePassword(newPassword);
        const confirmPasswordError = newPassword !== confirmNewPassword ? "Las contraseñas no coinciden." : "";

        if (passwordError || confirmPasswordError) {
            setErrors({ password: passwordError, confirmPassword: confirmPasswordError });
            setIsChangingPassword(false);
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            toast.success("Contraseña actualizada con éxito.");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                toast.error("La contraseña actual es incorrecta.");
            } else {
                toast.error("No se pudo cambiar la contraseña.");
            }
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== user.username) {
            toast.error("El nombre de usuario no coincide. Eliminación cancelada.");
            return;
        }
        setIsDeleting(true);
        try {
            // Ahora solo necesitamos eliminar el usuario del sistema de Auth.
            // La Cloud Function 'cleanupUser' se encargará del resto automáticamente.
            await deleteUser(auth.currentUser);

            toast.success("Cuenta eliminada permanentemente. ¡Te echaremos de menos!");
            navigate('/');
        } catch (error) {
            console.error("Error al eliminar la cuenta:", error);
            if (error.code === 'auth/requires-recent-login') {
                toast.error("Esta operación es sensible y requiere que inicies sesión de nuevo. Por favor, hazlo y vuelve a intentarlo.");
            } else {
                toast.error("No se pudo eliminar la cuenta. Por favor, contacta con soporte.");
            }
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 space-y-12">
            <div>
                <h1 className="text-4xl font-display font-bold mb-2 text-center">Ajustes de Cuenta</h1>
                <p className="text-center text-gray-500">Gestiona tu contraseña y los datos de tu cuenta.</p>
            </div>

            {/* Sección para Cambiar Contraseña (sin cambios) */}
            <div className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl">
                <h2 className="text-2xl font-display font-bold mb-6">Cambiar Contraseña</h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label htmlFor="currentPassword">Contraseña Actual</label>
                        <input type="password" id="currentPassword" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg" required />
                    </div>
                    <div className="relative">
                        <label htmlFor="newPassword">Nueva Contraseña</label>
                        <input type={passwordVisible ? "text" : "password"} id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg" required />
                        <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-gray-500"><Eye size={20} /></button>
                        <ValidationError message={errors.password} />
                    </div>
                    <div>
                        <label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</label>
                        <input type={passwordVisible ? "text" : "password"} id="confirmNewPassword" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg" required />
                        <ValidationError message={errors.confirmPassword} />
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={isChangingPassword} className="bg-primary text-white font-bold py-2 px-6 rounded-lg">{isChangingPassword ? 'Cambiando...' : 'Cambiar'}</button>
                    </div>
                </form>
            </div>

            {/* Sección para Eliminar Cuenta (actualizada) */}
            <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-xl">
                 <h2 className="text-2xl font-display font-bold mb-4 text-red-500">Zona de Peligro</h2>
                 <p className="mb-4">Eliminar tu cuenta es una acción irreversible. Se borrarán todos tus datos de perfil, encuestas y contenido asociado de forma permanente.</p>
                 <div>
                    <label htmlFor="deleteConfirmation" className="block font-bold mb-2">Para confirmar, escribe tu nombre de usuario: <span className="text-primary">{user.username}</span></label>
                    <input type="text" id="deleteConfirmation" value={deleteConfirmation} onChange={e => setDeleteConfirmation(e.target.value)} className="w-full p-3 mt-1 rounded-lg bg-light-bg dark:bg-dark-bg" />
                 </div>
                 <div className="text-right mt-4">
                    <button onClick={handleDeleteAccount} disabled={isDeleting || deleteConfirmation !== user.username} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isDeleting ? 'Eliminando...' : 'Eliminar mi cuenta'}
                    </button>
                 </div>
            </div>
        </div>
    );
}