// src/pages/TagPage.jsx
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Loader, Hash } from 'lucide-react';
import { PollCardSkeleton } from '../components/PollCardSkeleton';
import { PollCard } from '../components/PollCard';

export default function TagPage() {
    const { tagName } = useParams();

    const tagQuery = useMemo(() => {
        if (!tagName) return null;
        // Esta consulta busca en el array 'tags' por un valor específico
        return query(
            collection(db, "polls"), 
            where('tags', 'array-contains', tagName),
            orderBy('createdAt', 'desc')
        );
    }, [tagName]);

    const { 
        data: polls, 
        loading, 
        loadingMore, 
        hasMore, 
        loadMore 
    } = usePaginatedQuery(tagQuery, 9);

    const loadMoreRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

    if (loading) {
        return (
            <div>
                <h1 className="text-4xl font-display font-bold mb-8 text-center flex items-center justify-center gap-2">
                    <Hash size={32} /> Encuestas sobre "{tagName}"
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <PollCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-4xl font-display font-bold mb-8 text-center flex items-center justify-center gap-2">
                <Hash size={32} /> Encuestas sobre "{tagName}"
            </h1>
            {polls.length === 0 ? (
                <p className="text-center text-gray-500 p-8 rounded-xl bg-light-container dark:bg-dark-container">
                    No se encontraron encuestas con esta etiqueta.
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {polls.map(poll => <PollCard key={poll.id} poll={poll} />)}
                    </div>
                    <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
                      {loadingMore && <Loader className="animate-spin text-primary" />}
                    </div>
                </>
            )}
        </div>
    );
}