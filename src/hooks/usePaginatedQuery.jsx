// src/hooks/usePaginatedQuery.jsx (Corregido y optimizado)

import { useState, useEffect, useCallback } from 'react';
import { getDocs, query, limit, startAfter } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export function usePaginatedQuery(baseQuery, pageSize = 6) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastVisible, setLastVisible] = useState(null);

    // Este useEffect se encarga de la carga INICIAL y de RESETEAR cuando la consulta cambia.
    useEffect(() => {
        if (!baseQuery) {
            setData([]);
            setLoading(false);
            setHasMore(false);
            return;
        }

        setLoading(true);
        const q = query(baseQuery, limit(pageSize));

        getDocs(q)
            .then(querySnapshot => {
                const newDocs = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

                setData(newDocs);

                if (querySnapshot.docs.length > 0) {
                    setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
                } else {
                    setLastVisible(null);
                }

                setHasMore(newDocs.length === pageSize);
            })
            .catch(error => {
                console.error("Error en la consulta inicial paginada:", error);
                toast.error("No se pudieron cargar los datos.");
            })
            .finally(() => {
                setLoading(false);
            });

    }, [baseQuery, pageSize]); // Se re-ejecuta cada vez que la 'baseQuery' cambia.

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || !lastVisible || !baseQuery) return;

        setLoadingMore(true);
        try {
            const nextQuery = query(baseQuery, startAfter(lastVisible), limit(pageSize));
            const querySnapshot = await getDocs(nextQuery);
            const newDocs = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            if (newDocs.length > 0) {
                setData(prevData => [...prevData, ...newDocs]);
                setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
                setHasMore(newDocs.length === pageSize);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error al cargar más datos:", error);
            toast.error("No se pudieron cargar más datos.");
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, lastVisible, baseQuery, pageSize]);

    return { data, loading, loadingMore, hasMore, loadMore };
}