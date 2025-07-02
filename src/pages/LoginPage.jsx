// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (!identifier || !password) throw new Error("empty_fields");
            let userEmail = identifier;
            
            if (!identifier.includes('@')) {
                const usernameDocRef = doc(db, 'usernames', identifier.toLowerCase());
                const usernameDoc = await getDoc(usernameDocRef);
                if (!usernameDoc.exists()) throw new Error('auth/user-not-found');
                userEmail = usernameDoc.data().email;
            }
            
            await signInWithEmailAndPassword(auth, userEmail, password);
            toast.success('¡Bienvenido de nuevo!');
            navigate("/");
        } catch (error) {
            toast.error('Usuario o contraseña incorrectos.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl">
                <h2 className="text-3xl font-display font-bold text-center mb-6">Iniciar Sesión</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="identifier" className="block text-sm font-bold mb-2">Email o Usuario</label>
                        <input type="text" id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg" placeholder="tu@email.com o tu_usuario" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-bold mb-2">Contraseña</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg" placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg mt-4 transition-all">{isLoading ? 'Cargando...' : 'Entrar'}</button>
                </form>
                <p className="text-center mt-6 text-sm">¿No tienes cuenta?{' '}
                    <Link to="/signup" className="font-bold text-primary ml-2 hover:underline">Regístrate</Link>
                </p>
            </div>
        </div>
    );
}
