// src/components/TrendingTags.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Hash } from 'lucide-react';

const TagSkeleton = () => (
    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full px-4 py-2 h-8 w-24"></div>
);

export const TrendingTags = () => {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const tagsRef = collection(db, 'tags');
                // Pedimos las 5 etiquetas con el contador más alto (más populares)
                const q = query(tagsRef, orderBy('count', 'desc'), limit(5));
                const snapshot = await getDocs(q);
                setTags(snapshot.docs.map(doc => doc.data()));
            } catch (error) {
                console.error("Error al cargar los temas del momento:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTags();
    }, []);

    return (
        <div className="mb-10">
            <h2 className="text-xl font-bold font-display text-center mb-4">Temas del Momento</h2>
            <div className="flex flex-wrap justify-center items-center gap-3">
                {loading ? (
                    [...Array(5)].map((_, i) => <TagSkeleton key={i} />)
                ) : (
                    tags.map(tag => (
                        <Link 
                            key={tag.name} 
                            to={`/tag/${tag.name}`}
                            className="flex items-center gap-1 bg-light-container dark:bg-dark-container px-4 py-2 rounded-full font-semibold text-sm hover:bg-primary hover:text-white transition-colors shadow-sm border border-gray-200 dark:border-gray-700"
                        >
                            <Hash size={14} />
                            {tag.name}
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};