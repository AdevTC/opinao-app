// src/pages/FeedPage.jsx
import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Users, Loader } from 'lucide-react';
import { PollCardSkeleton } from '../components/PollCardSkeleton';
import { PollCard } from '../components/PollCard';

const EmptyFeed = () => (
    <div className="text-center text-gray-500 p-8 rounded-xl bg-light-container dark:bg-dark-container">
        <Users size={48} className="mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-bold mb-2">Tu feed está vacío</h2>
        <p>Parece que todavía no sigues a nadie.</p>
        <p>¡Busca usuarios interesantes en la página de <Link to="/" className="text-primary font-bold hover:underline">Explorar</Link> y síguelos para ver sus encuestas aquí!</p>
    </div>
);

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

    if (loading) {
        if (!followingUids) {
            return <EmptyFeed />;
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

    if (!followingUids) {
        return <EmptyFeed />;
    }

    return (
        <div>
            <h1 className="text-4xl font-display font-bold mb-8 text-center">Mi Feed</h1>
            {polls.length === 0 ? (
                <p className="text-center text-gray-500">Las personas a las que sigues no han publicado nada todavía.</p>
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