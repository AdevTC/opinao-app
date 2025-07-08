// src/pages/HomePage.jsx (Actualizado)

import React, { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Loader } from 'lucide-react';
import { PollCardSkeleton } from '../components/PollCardSkeleton';
import { PollCard } from '../components/PollCard';
import { TrendingTags } from '../components/TrendingTags'; // <-- 1. Importamos el nuevo componente

export default function HomePage() {
    const popularPollsQuery = useMemo(() => 
        query(collection(db, "polls"), orderBy("totalVotes", "desc"))
    , []);

    const { 
        data: polls, 
        loading, 
        loadingMore, 
        hasMore, 
        loadMore 
    } = usePaginatedQuery(popularPollsQuery, 6);

    const loadMoreRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

    return (
        <div>
            <h1 className="text-4xl font-display font-bold mb-8 text-center">Encuestas Populares</h1>

            {/* 2. Añadimos la sección de Temas del Momento aquí */}
            <TrendingTags />

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <PollCardSkeleton key={i} />)}
                </div>
            ) : polls.length === 0 ? (
                <p className="text-center text-gray-500">Aún no hay encuestas. ¡Crea la primera!</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {polls.map(poll => (
                            <PollCard key={poll.id} poll={poll} />
                        ))}
                    </div>
                    <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
                      {loadingMore && <Loader className="animate-spin text-primary" />}
                    </div>
                </>
            )}
        </div>
    );
}