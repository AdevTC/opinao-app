// src/pages/SearchPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { PollCard } from '../components/PollCard';
import { Loader, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

const UserResultCard = ({ user }) => (
    <Link to={`/profile/${user.id}`} className="flex items-center gap-4 p-4 bg-light-bg dark:bg-dark-bg rounded-lg hover:bg-primary/10 transition-colors">
        <img 
            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=7c3aed&color=fff&size=48`}
            alt="Avatar"
            className="w-12 h-12 rounded-full object-cover"
        />
        <div>
            <p className="font-bold">{user.username}</p>
            <p className="text-sm text-gray-500">{user.profession || 'Sin profesión'}</p>
        </div>
    </Link>
);

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const rawSearchTerm = searchParams.get('q') || '';

    const [users, setUsers] = useState([]);
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!rawSearchTerm) {
            setLoading(false);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            
            try {
                const cleanedSearchTerm = rawSearchTerm.trim().toLowerCase();
                const searchTags = cleanedSearchTerm.split(',').map(tag => tag.trim()).filter(Boolean);

                let userPromise = Promise.resolve({ docs: [] }); // Devolvemos un objeto similar a snapshot
                if (!cleanedSearchTerm.includes(',')) {
                    const usersRef = collection(db, 'users');
                    const userQuery = query(usersRef, where('username', '==', cleanedSearchTerm), limit(5));
                    userPromise = getDocs(userQuery);
                }

                let pollPromise = Promise.resolve([]);
                if (searchTags.length > 0) {
                    const pollsRef = collection(db, 'polls');
                    
                    // --- INICIO DE LA CORRECCIÓN ---
                    // Quitamos el orderBy('createdAt') para evitar la necesidad del índice compuesto.
                    const initialPollQuery = query(
                        pollsRef, 
                        where('tags', 'array-contains', searchTags[0]),
                        limit(50) // Aumentamos un poco el límite por si filtramos mucho después
                    );
                    // --- FIN DE LA CORRECCIÓN ---

                    pollPromise = getDocs(initialPollQuery).then(snapshot => {
                        const allPollsForFirstTag = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                        
                        let filteredPolls = allPollsForFirstTag;
                        if (searchTags.length > 1) {
                            const otherTags = searchTags.slice(1);
                            filteredPolls = allPollsForFirstTag.filter(poll => 
                                otherTags.every(tag => poll.tags?.includes(tag))
                            );
                        }

                        // Ordenamos los resultados aquí, en el cliente, en lugar de en la base de datos.
                        return filteredPolls.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                    });
                }
                
                const [userSnapshot, foundPolls] = await Promise.all([
                    userPromise,
                    pollPromise
                ]);

                const foundUsers = userSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                
                setUsers(foundUsers);
                setPolls(foundPolls);

            } catch (error) {
                console.error("Error al buscar:", error);
                toast.error("No se pudieron obtener los resultados de la búsqueda.");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();

    }, [rawSearchTerm]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center mt-16">
                <Loader className="animate-spin text-primary mb-4" size={48} />
                <p>Buscando resultados para "{rawSearchTerm}"...</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-display font-bold mb-8 text-center">
                Resultados para: <span className="text-primary">"{rawSearchTerm}"</span>
            </h1>

            {users.length === 0 && polls.length === 0 ? (
                 <div className="text-center text-gray-500 p-8 rounded-xl bg-light-container dark:bg-dark-container">
                    <Search size={48} className="mx-auto mb-4 text-primary" />
                    <h2 className="text-xl font-bold mb-2">Sin resultados</h2>
                    <p>No hemos encontrado usuarios o encuestas que coincidan con tu búsqueda.</p>
                    <p>Prueba a buscar por un nombre de usuario exacto o por una o más etiquetas separadas por comas.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {users.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-4">Usuarios Encontrados</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {users.map(user => <UserResultCard key={user.id} user={user} />)}
                            </div>
                        </section>
                    )}

                    {polls.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-4">Encuestas Encontradas</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {polls.map(poll => <PollCard key={poll.id} poll={poll} />)}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}