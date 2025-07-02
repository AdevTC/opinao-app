// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, onSnapshot, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { BarChart2, HelpCircle } from 'lucide-react';

export default function HomePage() {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, "polls"), orderBy("totalVotes", "desc"), limit(6));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const pollsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setPolls(pollsData);
            setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHasMore(pollsData.length === 6);
            setLoading(false);
        }, (error) => {
            console.error("Error al obtener las encuestas: ", error);
            toast.error("No se pudieron cargar las encuestas.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const fetchMorePolls = async () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        try {
            const q = query(collection(db, "polls"), orderBy("totalVotes", "desc"), startAfter(lastVisible), limit(6));
            const querySnapshot = await getDocs(q);
            const newPollsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            setPolls(prevPolls => [...prevPolls, ...newPollsData]);
            setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHasMore(newPollsData.length === 6);
        } catch (error) {
            toast.error("Error al cargar más encuestas.");
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) return <p className="text-center mt-8">Cargando encuestas...</p>;

    return (
        <div>
            <h1 className="text-4xl font-display font-bold mb-8 text-center">Encuestas Populares</h1>
            {polls.length === 0 ? (
                <p className="text-center text-gray-500">Aún no hay encuestas. ¡Crea la primera!</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {polls.map(poll => (
                            <div key={poll.id} className="bg-light-container dark:bg-dark-container p-6 rounded-xl shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col justify-between">
                               <div>
                                 <div className="flex justify-between items-start">
                                   <h2 className="font-display text-2xl font-bold mb-2 text-gray-800 dark:text-primary-light pr-2">{poll.question}</h2>
                                   {poll.isQuiz && <HelpCircle className="text-primary flex-shrink-0" title="Esta encuesta es un Quiz" />}
                                 </div>
                                 <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm">
                                    Creada por{' '}
                                    <Link to={poll.authorUid ? `/profile/${poll.authorUid}` : '#'} className="text-primary font-bold hover:underline">
                                        {poll.authorUsername || 'Anónimo'}
                                    </Link>
                                 </p>
                                 <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <BarChart2 size={14} />
                                    <span>{poll.totalVotes || 0} votos</span>
                                 </div>
                               </div>
                               <Link to={`/poll/${poll.id}`} className="block w-full text-center bg-primary text-white font-bold py-2 px-4 rounded-lg mt-4 hover:bg-primary/90 transition-colors">Votar ahora</Link>
                            </div>
                        ))}
                    </div>
                    {hasMore && (
                        <div className="text-center mt-8">
                            <button onClick={fetchMorePolls} disabled={loadingMore} className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:bg-gray-400">
                                {loadingMore ? 'Cargando...' : 'Cargar más encuestas'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
