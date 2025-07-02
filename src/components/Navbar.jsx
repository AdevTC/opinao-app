// src/components/Navbar.jsx
import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Sun, Moon, PlusCircle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'react-hot-toast';

export default function Navbar({ toggleTheme, isDarkMode }) {
    const { user } = useAuth();
    const location = useLocation();
    
    const isSpecialPage = location.pathname === '/complete-profile' || location.pathname === '/edit-profile';
    const activeLinkStyle = { color: '#7c3aed', fontWeight: '600' };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success('¡Has cerrado sesión!');
        } catch (error) {
            toast.error('Error al cerrar sesión.');
        }
    };

    return (
        <header className="bg-light-container/80 dark:bg-dark-container/80 shadow-md sticky top-0 z-50 backdrop-blur-sm">
            <nav className="container mx-auto flex items-center justify-between p-4">
                <Link to="/" className="text-2xl font-display font-bold text-primary">Opinao</Link>
                
                <div className="hidden md:flex items-center space-x-6">
                    <NavLink to="/" style={({ isActive }) => (isActive && !isSpecialPage ? activeLinkStyle : undefined)} className={`hover:text-primary transition-colors ${isSpecialPage ? 'pointer-events-none text-gray-400' : ''}`}>Explorar</NavLink>
                    {user && user.profileComplete && (
                       <NavLink to={`/profile/${user.uid}`} style={({ isActive }) => (isActive ? activeLinkStyle : undefined)} className="hover:text-primary transition-colors">Mi Perfil</NavLink>
                    )}
                </div>

                <div className="flex items-center space-x-2 sm:space-x-4">
                  {user && user.profileComplete && (
                    <Link to="/create" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"><PlusCircle size={20} /><span className="hidden sm:inline">Crear</span></Link>
                  )}
                  <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle theme">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
                  
                  {user ? (
                    <div className="flex items-center gap-4">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                        ) : user.username && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <button onClick={handleLogout} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-800/50 text-red-500 transition-colors" aria-label="Cerrar sesión"><LogOut size={20} /></button>
                    </div>
                  ) : (
                    !isSpecialPage && <Link to="/login" className="font-bold text-primary hover:underline">Login</Link>
                  )}
                </div>
            </nav>
        </header>
    );
}
