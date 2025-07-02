// src/pages/PollPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, increment, deleteDoc, collection, addDoc, query, orderBy, serverTimestamp, arrayUnion, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { formatDate, calculateAge } from '../utils/helpers';
import { Share2, BarChart2, Trash2, Send, CheckCircle } from 'lucide-react';

export default function PollPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [poll, setPoll] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState(null);
    const navigate = useNavigate();

    const isOwner = user && poll && user.uid === poll.authorUid;
    const hasVoted = user?.votedPolls?.includes(id);

    // Lógica de visualización mejorada
    const showResults = hasVoted || (poll?.hideResults ? false : !user);

    useEffect(() => { 
        const docRef = doc(db, "polls", id);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                setPoll({ ...doc.data(), id: doc.id });
            } else {
                setPoll(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const commentsRef = collection(db, "polls", id, "comments");
        const q = query(commentsRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({...doc.data(), id: doc.id})));
        });
        return () => unsubscribe();
    }, [id]);
    
    const handleVote = async () => {
        if (!user) return toast.error("Necesitas iniciar sesión para votar.");
        if (!user.profileComplete) return toast.error("Debes completar tu perfil para poder votar.");
        if (!selectedOption) return toast.error("Por favor, selecciona una opción.");
        
        try {
            if (poll.isQuiz) {
                const isCorrect = poll.correctAnswers.includes(selectedOption);
                toast.success(isCorrect ? "¡Respuesta Correcta!" : "Respuesta Incorrecta", { icon: isCorrect ? '✅' : '❌' });
            } else {
                toast.success("¡Gracias por tu voto!");
            }

            const batch = writeBatch(db);
            const pollRef = doc(db, "polls", id);
            const userRef = doc(db, "users", user.uid);
            
            const voteField = `votes.${selectedOption}`;
            batch.update(pollRef, { [voteField]: increment(1), totalVotes: increment(1) });
            batch.update(userRef, { votedPolls: arrayUnion(id) });
            
            const voterDataRef = doc(collection(db, `polls/${id}/voters`));
            batch.set(voterDataRef, {
                userId: user.uid,
                votedOption: selectedOption,
                age: calculateAge(user.birthDate),
                gender: user.gender,
                country: user.country,
                profession: user.profession,
                education: user.education,
                votedAt: serverTimestamp()
            });

            await batch.commit();
        } catch (error) {
            console.error("Error al votar: ", error);
            toast.error("No se pudo registrar tu voto.");
        }
    };

    const handleDelete = async () => { if (window.confirm("¿Estás seguro?")) { try { await deleteDoc(doc(db, "polls", id)); toast.success("Encuesta eliminada."); navigate('/'); } catch (error) { toast.error("No se pudo eliminar."); } } };
    const handleShare = () => { const url = window.location.href; navigator.clipboard.writeText(url).then(() => toast.success('Enlace copiado')).catch(() => toast.error('No se pudo copiar.')); };
    const handleCommentSubmit = async (e) => { e.preventDefault(); if(!newComment.trim()) return; const commentsRef = collection(db, "polls", id, "comments"); await addDoc(commentsRef, { text: newComment, authorUid: user.uid, authorUsername: user.username, createdAt: serverTimestamp() }); setNewComment(""); };
    
    const totalVotes = poll ? poll.totalVotes || 0 : 0;
    
    if (loading) return <p className="text-center mt-8">Cargando encuesta...</p>;
    if (!poll) return <div className="text-center mt-8"><h1 className="text-2xl font-bold">Encuesta no encontrada</h1><p className="text-gray-500 mt-2">Es posible que haya sido eliminada.</p><Link to="/" className="text-primary mt-4 inline-block">Volver al inicio</Link></div>;
    
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl">
                <div className="flex justify-between items-start gap-4">
                    <h1 className="text-3xl md:text-4xl font-display font-bold">{poll.question}</h1>
                    <div className="flex-shrink-0 flex items-center">
                        <Link to={`/poll/${id}/results`} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Ver resultados detallados"><BarChart2 size={20}/></Link>
                        <button onClick={handleShare} className="p-2 ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Copiar enlace"><Share2 size={20} /></button>
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Creada por <Link to={`/profile/${poll.authorUid}`} className="text-primary font-bold hover:underline">{poll.authorUsername || 'Anónimo'}</Link> • {formatDate(poll.createdAt)}</p>
                
                {showResults ? (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Resultados ({totalVotes} votos)</h2>
                        {poll.options.map((option, index) => { 
                            const voteCount = poll.votes[option] || 0;
                            const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                            const isCorrect = poll.isQuiz && poll.correctAnswers.includes(option);
                            return (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between font-bold">
                                        <span>{option}{isCorrect && <CheckCircle className="inline ml-2 text-green-500"/>}</span>
                                        <span>{voteCount} ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                        <div className={`${isCorrect ? 'bg-green-500' : 'bg-primary'} h-4 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            ); 
                        })}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {poll.options.map((option, index) => (
                            <button key={index} onClick={() => setSelectedOption(option)} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedOption === option ? 'bg-primary/20 border-primary' : 'bg-gray-100 dark:bg-dark-bg border-transparent hover:border-primary/50'}`}>{option}</button>
                        ))}
                         <button onClick={handleVote} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 mt-6">Votar</button>
                    </div>
                )}
                {isOwner && (<div className="mt-8 border-t-2 border-dashed border-red-500/50 pt-4 text-right"><button onClick={handleDelete} className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all"><Trash2 size={16} />Eliminar Encuesta</button></div>)}
            </div>
            <div className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl mt-8">
                <h2 className="text-2xl font-display font-bold mb-4">Comentarios</h2>
                {user && user.profileComplete ? (
                    <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-6">
                        <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Añade un comentario..." className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border-2 border-transparent focus:border-primary focus:outline-none"/>
                        <button type="submit" className="p-3 bg-primary text-white rounded-lg hover:bg-primary/90"><Send size={20}/></button>
                    </form>
                ) : (
                    <p className="mb-6 text-center text-gray-500"><Link to="/login" className="text-primary font-bold hover:underline">Inicia sesión</Link> para dejar un comentario.</p>
                )}
                <div className="space-y-4">
                    {comments.length > 0 ? (comments.map(comment => (
                        <div key={comment.id} className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-bold text-sm text-primary">{comment.authorUsername}</p>
                                <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                            </div>
                            <p>{comment.text}</p>
                        </div>
                    ))) : (
                        <p className="text-gray-500 text-center">No hay comentarios todavía. ¡Sé el primero!</p>
                    )}
                </div>
            </div>
        </div>
    );
}
