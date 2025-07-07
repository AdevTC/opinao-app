// src/pages/TagsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Hash, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TagCard = ({ tag }) => (
    <Link 
        to={`/tag/${tag.name}`}
        className="block bg-light-bg dark:bg-dark-bg p-6 rounded-lg text-center transform hover:-translate-y-1 transition-transform duration-300 shadow-md hover:shadow-primary/20"
    >
        <h3 className="font-bold font-display text-2xl text-primary">#{tag.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tag.count} {tag.count === 1 ? 'encuesta' : 'encuestas'}</p>
    </Link>
);

export default function TagsPage() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const tagsRef = collection(db, 'tags');
                const q = query(tagsRef, orderBy('count', 'desc'));
                const snapshot = await getDocs(q);
                setTags(snapshot.docs.map(doc => doc.data()));
            } catch (error) {
                console.error("Error al cargar las etiquetas:", error);
                toast.error("No se pudieron cargar las etiquetas.");
            } finally {
                setLoading(false);
            }
        };

        fetchTags();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center mt-16">
                <Loader className="animate-spin text-primary mb-4" size={48} />
                <p>Cargando etiquetas...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-5xl font-display font-bold">Explorar Etiquetas</h1>
                <p className="text-lg text-gray-500 mt-2">Descubre los temas más populares de la comunidad.</p>
            </div>
            
            {tags.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {tags.map(tag => (
                        <TagCard key={tag.name} tag={tag} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500 p-8 rounded-xl bg-light-container dark:bg-dark-container">
                    <Hash size={48} className="mx-auto mb-4 text-primary" />
                    <h2 className="text-xl font-bold mb-2">Aún no hay etiquetas</h2>
                    <p>Crea una encuesta y añádele algunas etiquetas para que aparezcan aquí.</p>
                </div>
            )}
        </div>
    );
}