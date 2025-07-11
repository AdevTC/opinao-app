// src/pages/PollPage.jsx (Corregido)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, increment, deleteDoc, collection, addDoc, query, orderBy, serverTimestamp, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { formatDate, calculateAge } from '../utils/helpers';
import { Share2, BarChart2, Trash2, Send, CheckCircle, Edit, Bookmark, ShieldCheck, Clock } from 'lucide-react';
import { Comment } from '../components/Comment';
import { HighlightProvider } from '../contexts/HighlightContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PollPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [poll, setPoll] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnonymousVote, setIsAnonymousVote] = useState(false);
    const navigate = useNavigate();

    const isPollClosed = poll?.deadline && poll.deadline.toDate() < new Date();
    const isOwner = user && poll && user.uid === poll.authorUid;
    const hasVoted = user?.votedPolls?.includes(id);
    const hasSaved = user?.savedPolls?.includes(id);

    // --- INICIO DE LA CORRECCIÓN ---
    // Esta es la lógica corregida. Ahora solo muestra los resultados si
    // el usuario ya ha votado o si la encuesta ha cerrado.
    const showResults = hasVoted || isPollClosed;
    // --- FIN DE LA CORRECCIÓN ---

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

    const handleToggleSave = async () => {
        if (!user) return toast.error("Necesitas iniciar sesión para guardar encuestas.");
        const userRef = doc(db, "users", user.uid);
        try {
            await updateDoc(userRef, {
                savedPolls: hasSaved ? arrayRemove(id) : arrayUnion(id)
            });
            toast.success(hasSaved ? "Encuesta eliminada de tus guardados" : "¡Encuesta guardada!");
        } catch (error) {
            console.error("Error al guardar la encuesta:", error);
            toast.error("No se pudo realizar la acción.");
        }
    };

    const handleVote = async () => {
        if (isPollClosed) return toast.error("Esta encuesta ya ha cerrado.");
        if (!user) return toast.error("Necesitas iniciar sesión para votar.");
        if (!user.profileComplete) return toast.error("Debes completar tu perfil para poder votar.");
        if (!selectedOption) return toast.error("Por favor, selecciona una opción.");

        try {
            const batch = writeBatch(db);
            const pollRef = doc(db, "polls", id);
            const userRef = doc(db, "users", user.uid);

            if (poll.isQuiz) {
                const isCorrect = poll.correctAnswers.includes(selectedOption);
                if (isCorrect) {
                    toast.success("¡Respuesta Correcta!", { icon: '✅' });
                    batch.update(userRef, { quizAnswersCorrect: increment(1) });
                } else {
                    toast.error("Respuesta Incorrecta", { icon: '❌' });
                }
            } else {
                toast.success("¡Gracias por tu voto!");
            }

            const voteField = `votes.${selectedOption}`;
            batch.update(pollRef, { [voteField]: increment(1), totalVotes: increment(1) });
            batch.update(userRef, { votedPolls: arrayUnion(id) });

            const voterDataRef = doc(collection(db, `polls/${id}/voters`));
            const voterData = {
                userId: user.uid,
                votedOption: selectedOption,
                votedAt: serverTimestamp(),
                age: isAnonymousVote ? null : calculateAge(user.birthDate),
                gender: isAnonymousVote ? 'anonymous' : user.gender,
                country: isAnonymousVote ? 'anonymous' : user.country,
                profession: isAnonymousVote ? 'anonymous' : user.profession,
                education: isAnonymousVote ? 'anonymous' : user.education,
            };
            batch.set(voterDataRef, voterData);

            await batch.commit();
        } catch (error) {
            console.error("Error al votar: ", error);
            toast.error("No se pudo registrar tu voto.");
        }
    };

    const handleDelete = async () => { if (window.confirm("¿Estás seguro de que quieres eliminar esta encuesta? Esta acción no se puede deshacer.")) { try { await deleteDoc(doc(db, "polls", id)); toast.success("Encuesta eliminada."); navigate('/'); } catch (error) { toast.error("No se pudo eliminar la encuesta."); } } };
    const handleShare = () => { const url = window.location.href; navigator.clipboard.writeText(url).then(() => toast.success('Enlace copiado al portapapeles')).catch(() => toast.error('No se pudo copiar el enlace.')); };
    const handleCommentSubmit = async (e) => { e.preventDefault(); if(!newComment.trim() || !user) return; const commentsRef = collection(db, "polls", id, "comments"); await addDoc(commentsRef, { text: newComment, authorUid: user.uid, authorUsername: user.username, authorAvatarUrl: user.avatarUrl || '', createdAt: serverTimestamp(), replyCount: 0, likes: [], likeCount: 0}); setNewComment("");};

    const totalVotes = poll ? poll.totalVotes || 0 : 0;

    if (loading) return <p className="text-center mt-8">Cargando encuesta...</p>;
    if (!poll) return <div className="text-center mt-8"><h1 className="text-2xl font-bold">Encuesta no encontrada</h1><p className="text-gray-500 mt-2">Es posible que haya sido eliminada.</p><Link to="/" className="text-primary mt-4 inline-block">Volver al inicio</Link></div>;

    return (
        <div className="max-w-2xl mx-auto">
            <style>{`.highlight-comment {animation: highlight-animation 2s ease-in-out; @keyframes highlight-animation {0% { background-color: rgba(124, 58, 237, 0); } 25% { background-color: rgba(124, 58, 237, 0.2); } 100% { background-color: rgba(124, 58, 237, 0); }}}`}</style>
            <div className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl">
                {poll.imageUrl && (<div className="mb-6 rounded-lg overflow-hidden"><img src={poll.imageUrl} alt={poll.question} className="w-full h-auto max-h-96 object-cover" /></div>)}
                <div className="flex justify-between items-start gap-4">
                    <h1 className="text-3xl md:text-4xl font-display font-bold">{poll.question}</h1>
                    <div className="flex-shrink-0 flex items-center">
                        {user && (<button onClick={handleToggleSave} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title={hasSaved ? "Eliminar de guardados" : "Guardar encuesta"}><Bookmark size={20} className={hasSaved ? 'text-primary fill-current' : ''} /></button>)}
                        <Link to={`/poll/${id}/results`} className="p-2 ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Ver resultados detallados"><BarChart2 size={20}/></Link>
                        <button onClick={handleShare} className="p-2 ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Copiar enlace"><Share2 size={20} /></button>
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Creada por <Link to={`/profile/${poll.authorUid}`} className="text-primary font-bold hover:underline">{poll.authorUsername || 'Anónimo'}</Link> • {formatDate(poll.createdAt)}</p>

                {poll.deadline && (
                    <div className={`flex items-center gap-2 text-sm font-bold p-2 rounded-md mb-6 ${isPollClosed ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'}`}>
                        <Clock size={16} />
                        {isPollClosed 
                            ? `Encuesta cerrada el ${poll.deadline.toDate().toLocaleDateString('es-ES')}` 
                            : `Cierra ${formatDistanceToNow(poll.deadline.toDate(), { locale: es, addSuffix: true })}`
                        }
                    </div>
                )}

                {showResults ? (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Resultados ({totalVotes} votos)</h2>
                        {poll.options.map((option, index) => { const voteCount = poll.votes[option] || 0; const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0; const isCorrect = poll.isQuiz && poll.correctAnswers.includes(option);
                            return (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between font-bold">
                                        <span>{option}{isCorrect && <CheckCircle className="inline ml-2 text-green-500"/>}</span>
                                        <span>{voteCount} ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4"><div className={`${isCorrect ? 'bg-green-500' : 'bg-primary'} h-4 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div></div>
                                </div>
                            ); 
                        })}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {poll.options.map((option, index) => (
                            <button key={index} onClick={() => setSelectedOption(option)} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedOption === option ? 'bg-primary/20 border-primary' : 'bg-gray-100 dark:bg-dark-bg border-transparent hover:border-primary/50'}`}>{option}</button>
                        ))}
                        <div className="pt-4 flex items-center justify-center gap-2">
                            <input type="checkbox" id="anonymous-vote" checked={isAnonymousVote} onChange={(e) => setIsAnonymousVote(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor="anonymous-vote" className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><ShieldCheck size={14}/>Votar de forma anónima (tus datos demográficos no se guardarán)</label>
                        </div>
                        <button onClick={handleVote} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 mt-6">Votar</button>
                    </div>
                )}
                {isOwner && (<div className="mt-8 border-t-2 border-dashed border-gray-500/50 pt-4 flex justify-end gap-4"><Link to={`/poll/${id}/edit`} className="inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-all"><Edit size={16} />Editar</Link><button onClick={handleDelete} className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all"><Trash2 size={16} />Eliminar</button></div>)}
            </div>

            <div className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl mt-8">
                <h2 className="text-2xl font-display font-bold mb-4">Comentarios ({comments.length})</h2>
                {user && user.profileComplete ? (<form onSubmit={handleCommentSubmit} className="flex gap-2 mb-6"><input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Añade un comentario..." className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border-2 border-transparent focus:border-primary focus:outline-none"/><button type="submit" className="p-3 bg-primary text-white rounded-lg hover:bg-primary/90"><Send size={20}/></button></form>) : (<p className="mb-6 text-center text-gray-500"><Link to="/login" className="text-primary font-bold hover:underline">Inicia sesión</Link> para dejar un comentario.</p>)}
                <HighlightProvider><div className="divide-y divide-gray-200 dark:divide-gray-700 -mt-4">{comments.length > 0 ? (comments.map(comment => (<Comment key={comment.id} commentData={comment} commentPath={`polls/${id}/comments/${comment.id}`} />))) : (<p className="text-gray-500 text-center pt-8">No hay comentarios todavía. ¡Sé el primero!</p>)}</div></HighlightProvider>
            </div>
        </div>
    );
}