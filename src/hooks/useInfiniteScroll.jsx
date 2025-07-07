// src/hooks/useInfiniteScroll.jsx
import { useEffect, useRef } from 'react';

/**
 * Un hook para implementar scroll infinito.
 * @param {function} callback - La función que se debe llamar para cargar más datos (ej: loadMore).
 * @param {boolean} hasMore - Booleano que indica si hay más datos por cargar.
 * @param {boolean} isLoading - Booleano para evitar llamadas múltiples mientras ya se está cargando.
 */
export function useInfiniteScroll(callback, hasMore, isLoading) {
  const observer = useRef();
  const targetRef = useRef(null); // Ref para el elemento que observaremos

  useEffect(() => {
    if (isLoading) return; // No hacer nada si ya está cargando

    // Creamos una instancia del observer
    observer.current = new IntersectionObserver(
      (entries) => {
        // Si el elemento observado es visible y hay más datos por cargar...
        if (entries[0].isIntersecting && hasMore) {
          callback();
        }
      },
      {
        rootMargin: '100px', // Empezar a cargar 100px antes de que el elemento sea visible
      }
    );

    // Empezamos a observar el elemento 'target' si existe
    if (targetRef.current) {
      observer.current.observe(targetRef.current);
    }

    const currentObserver = observer.current;
    const currentTarget = targetRef.current;

    // Función de limpieza para dejar de observar
    return () => {
      if (currentTarget) {
        currentObserver.disconnect();
      }
    };
  }, [callback, hasMore, isLoading]);

  return targetRef; // Devolvemos la ref para que el componente la asigne al elemento
}