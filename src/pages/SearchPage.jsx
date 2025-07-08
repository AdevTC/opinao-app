// src/pages/SearchPage.jsx (Actualizado)

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { PollCard } from '../components/PollCard';
import { Loader, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { EmptyState } from '../components/EmptyState';

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
                const isTagSearch = cleanedSearchTerm.startsWith('#');
                const finalSearchTerm = isTagSearch ? cleanedSearchTerm.substring(1) : cleanedSearchTerm;
                
                let userPromise = Promise.resolve({ docs: [] });
                let pollPromise = Promise.resolve([]);

                if (isTagSearch) {
                    const pollsRef = collection(db, 'polls');
                    const pollQuery = query(pollsRef, where('tags', 'array-contains', finalSearchTerm), limit(20));
                    pollPromise = getDocs(pollQuery).then(snapshot => 
                        snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                    );
                } else {
                    const usersRef = collection(db, 'users');
                    const userQuery = query(
                        usersRef, 
                        where('username', '>=', finalSearchTerm),
                        where('username', '<=', finalSearchTerm + '\uf8ff'),
                        limit(10)
                    );
                    userPromise = getDocs(userQuery);
                }
                
                const [userSnapshot, foundPolls] = await Promise.all([
                    userPromise,
                    pollPromise
                ]);

                const foundUsers = userSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                
                setUsers(foundUsers);
                setPolls(foundPolls);

            } catch (error) {
                if (error.code === 'failed-precondition') {
                     toast.error("La búsqueda requiere un índice. Por favor, créalo desde el enlace en la consola (F12).");
                     console.error("Error de índice en la búsqueda:", error);
                } else {
                    console.error("Error al buscar:", error);
                    toast.error("No se pudieron obtener los resultados de la búsqueda.");
                }
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
                 <EmptyState
                    icon={<Search />}
                    title="Sin resultados"
                    message="No hemos encontrado nada que coincida con tu búsqueda. Prueba a buscar por un nombre de usuario o por una etiqueta precedida de #"
                />
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