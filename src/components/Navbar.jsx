// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Sun, Moon, PlusCircle, LogOut, Bell, User as UserIcon, Settings, ChevronDown, Compass, Tag, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { SearchBar } from './SearchBar';

// Componente para el menú de usuario (derecha del todo)
const UserMenu = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success('¡Has cerrado sesión!');
        } catch (error) {
            toast.error('Error al cerrar sesión.');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    if (!user) {
        return <Link to="/login" className="font-bold text-primary hover:underline">Login</Link>;
    }
    
    if (!user.profileComplete) {
        return <button onClick={handleLogout} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-800/50 text-red-500 transition-colors" aria-label="Cerrar sesión"><LogOut size={20} /></button>
    }

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                        {user.username?.charAt(0).toUpperCase()}
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-light-container dark:bg-dark-container rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm">Sesión iniciada como</p>
                        <p className="text-sm font-medium truncate">{user.username}</p>
                    </div>
                    <div className="py-1">
                        <Link to={`/profile/${user.uid}`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-light-bg dark:hover:bg-dark-bg w-full">
                            <UserIcon size={16} /> Mi Perfil
                        </Link>
                        <Link to="/notifications" onClick={() => setIsOpen(false)} className="flex items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-light-bg dark:hover:bg-dark-bg w-full">
                            <div className="flex items-center gap-3"><Bell size={16} />Notificaciones</div>
                            {user.unreadNotifications > 0 && (
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                            )}
                        </Link>
                         <Link to="/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-light-bg dark:hover:bg-dark-bg w-full">
                            <Settings size={16} /> Ajustes
                        </Link>
                    </div>
                    <div className="py-1 border-t border-gray-200 dark:border-gray-700">
                         <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10">
                            <LogOut size={16} /> Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente para el nuevo menú de navegación
const NavMenu = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    return (
        <div className="relative inline-flex shadow-sm rounded-lg" ref={menuRef}>
            <Link to="/create" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-l-lg transition-colors">
                <PlusCircle size={20} />
                <span className="hidden sm:inline">Crear</span>
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="bg-primary hover:bg-primary/90 text-white p-2 rounded-r-lg border-l border-white/20">
                <ChevronDown size={20} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                 <div className="absolute right-0 mt-12 w-56 bg-light-container dark:bg-dark-container rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                     <NavLink to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-light-bg dark:hover:bg-dark-bg w-full">
                        <Compass size={16} /> Explorar
                    </NavLink>
                     <NavLink to="/tags" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-light-bg dark:hover:bg-dark-bg w-full">
                        <Tag size={16} /> Tags
                    </NavLink>
                    {user && user.profileComplete && (
                        <NavLink to="/feed" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-light-bg dark:hover:bg-dark-bg w-full">
                            <LayoutDashboard size={16} /> Mi Feed
                        </NavLink>
                    )}
                 </div>
            )}
        </div>
    );
};


export default function Navbar({ toggleTheme, isDarkMode }) {
    const { user } = useAuth();

    return (
        <header className="bg-light-container/80 dark:bg-dark-container/80 shadow-md sticky top-0 z-50 backdrop-blur-sm">
            <nav className="container mx-auto flex items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-6 flex-shrink-0">
                    <Link to="/" className="text-2xl font-display font-bold text-primary">Opinao</Link>
                </div>

                <div className="flex-1 flex justify-center px-4">
                   <SearchBar />
                </div>
                
                <div className="flex items-center space-x-4 flex-shrink-0">
                  {user && user.profileComplete && <NavMenu />}
                  <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle theme">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
                  <UserMenu />
                </div>
            </nav>
        </header>
    );
}