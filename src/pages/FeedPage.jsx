// src/pages/FeedPage.jsx (Actualizado)

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Users, Loader } from 'lucide-react';
import { PollCardSkeleton } from '../components/PollCardSkeleton';
import { PollCard } from '../components/PollCard';
import { EmptyState } from '../components/EmptyState';

export default function FeedPage() {
    const { user } = useAuth();
    const followingUids = user?.following && user.following.length > 0 ? user.following.slice(0, 30) : null;
    const feedQuery = useMemo(() => {
        if (!followingUids) return null;
        return query(
            collection(db, "polls"),
            where('authorUid', 'in', followingUids),
            orderBy("createdAt", "desc")
        );
    }, [JSON.stringify(followingUids)]);

    const { 
        data: polls, 
        loading, 
        loadingMore, 
        hasMore, 
        loadMore 
    } = usePaginatedQuery(feedQuery, 10);

    const loadMoreRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

    if (loading && polls.length === 0) {
        if (!followingUids) {
            return (
                 <EmptyState
                    icon={<Users />}
                    title="Tu feed está vacío"
                    message="Parece que todavía no sigues a nadie. ¡Encuentra gente interesante y síguela para ver sus encuestas aquí!"
                    actionText="Explorar Etiquetas"
                    actionTo="/tags"
                />
            );
        }
        return (
            <div>
                <h1 className="text-4xl font-display font-bold mb-8 text-center">Mi Feed</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <PollCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <h1 className="text-4xl font-display font-bold mb-8 text-center">Mi Feed</h1>
            {polls.length === 0 ? (
                <EmptyState
                    icon={<Users />}
                    title="Un silencio tranquilo"
                    message="Las personas a las que sigues no han publicado nada todavía."
                />
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