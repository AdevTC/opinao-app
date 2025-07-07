// src/components/SearchBar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export const SearchBar = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmedTerm = searchTerm.trim();
        if (trimmedTerm) {
            navigate(`/search?q=${encodeURIComponent(trimmedTerm)}`);
            setSearchTerm(''); // Limpiar la barra después de la búsqueda
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-xs">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar usuarios o #tags..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-light-bg dark:bg-dark-bg border-2 border-transparent focus:border-primary focus:outline-none"
            />
            <button
                type="submit"
                className="absolute left-0 top-0 h-full px-3 text-gray-400 hover:text-primary"
                aria-label="Buscar"
            >
                <Search size={18} />
            </button>
        </form>
    );
};