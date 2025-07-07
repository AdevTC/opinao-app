// src/hooks/usePaginatedQuery.jsx
import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, getDocs, query, limit, startAfter } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export function usePaginatedQuery(baseQuery, pageSize = 6) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastVisible, setLastVisible] = useState(null);

    useEffect(() => {
        // Si no hay una consulta base (ej: el usuario no sigue a nadie),
        // dejamos de cargar y devolvemos un estado vacío.
        if (!baseQuery) {
            setData([]);
            setLoading(false);
            setHasMore(false);
            return;
        }

        setLoading(true);
        
        const initialQuery = query(baseQuery, limit(pageSize));

        const unsubscribe = onSnapshot(initialQuery, (snapshot) => {
            const newData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setData(newData);
            
            if (snapshot.docs.length > 0) {
                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            } else {
                setLastVisible(null);
            }
            
            setHasMore(newData.length === pageSize);
            setLoading(false);
        }, (error) => {
            console.error("Error en la consulta a Firestore: ", error);
            toast.error("No se pudieron cargar los datos.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [baseQuery, pageSize]);

    const loadMore = useCallback(async () => {
        // Añadimos una comprobación extra para no ejecutar si no hay consulta
        if (!hasMore || loadingMore || !lastVisible || !baseQuery) return;

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
            console.error("Error al cargar más datos: ", error);
            toast.error("No se pudieron cargar más datos.");
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loadingMore, lastVisible, baseQuery, pageSize]);

    return { data, loading, loadingMore, hasMore, loadMore };
}