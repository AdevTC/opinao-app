// src/pages/EditPollPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, X, Image as ImageIcon, Check, Info, UploadCloud, XCircle } from 'lucide-react';

const FormSection = ({ icon, title, children }) => (
    <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-full">
                {icon}
            </div>
            <h2 className="text-xl font-bold font-display">{title}</h2>
        </div>
        <div className="pl-12">
            {children}
        </div>
    </div>
);


export default function EditPollPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [poll, setPoll] = useState(null);
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState([]);
    const [tags, setTags] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isQuiz, setIsQuiz] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const imageInputRef = useRef(null);

    const areOptionsLocked = poll?.totalVotes > 0;

    useEffect(() => {
        const fetchPoll = async () => {
            const pollRef = doc(db, 'polls', id);
            const pollSnap = await getDoc(pollRef);

            if (pollSnap.exists()) {
                const pollData = pollSnap.data();
                if (pollData.authorUid !== user.uid) {
                    toast.error("No tienes permiso para editar esta encuesta.");
                    navigate(`/poll/${id}`);
                    return;
                }
                setPoll(pollData);
                setQuestion(pollData.question);
                setOptions(pollData.options);
                setTags((pollData.tags || []).join(', '));
                setImagePreview(pollData.imageUrl || null);
                setIsQuiz(pollData.isQuiz);
                setCorrectAnswers(pollData.correctAnswers || []);
            } else {
                toast.error("Encuesta no encontrada.");
                navigate('/');
            }
            setLoading(false);
        };

        if(user) {
            fetchPoll();
        }
    }, [id, user, navigate]);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 10) setOptions([...options, '']);
    };

    const removeOption = (index) => {
        if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                toast.error("La imagen no puede pesar más de 2MB.");
                return;
            }
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const handleCorrectAnswerToggle = (option) => {
        if (!option) return;
        setCorrectAnswers(prev => prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (question.trim().length < 5) return toast.error('La pregunta debe tener al menos 5 caracteres.');
        if (!areOptionsLocked && options.some(opt => opt.trim() === '')) return toast.error('Todas las opciones deben tener un valor.');
        if (!areOptionsLocked && isQuiz && correctAnswers.length === 0) return toast.error('Si es un quiz, debes marcar al menos una respuesta como correcta.');

        setIsSaving(true);
        toast.loading("Guardando cambios...");

        try {
            const pollRef = doc(db, 'polls', id);
            const dataToUpdate = {
                question,
                tags: tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag),
            };

            if (image) {
                const imageRef = ref(storage, `poll-images/${Date.now()}_${image.name}`);
                await uploadBytes(imageRef, image);
                dataToUpdate.imageUrl = await getDownloadURL(imageRef);
            } else if (imagePreview === null && poll.imageUrl) {
                dataToUpdate.imageUrl = '';
            }

            if (!areOptionsLocked) {
                dataToUpdate.options = options;
                dataToUpdate.isQuiz = isQuiz;
                dataToUpdate.correctAnswers = isQuiz ? correctAnswers : [];
            }

            await updateDoc(pollRef, dataToUpdate);
            toast.dismiss();
            toast.success("Encuesta actualizada con éxito.");
            navigate(`/poll/${id}`);

        } catch (error) {
            console.error("Error al actualizar la encuesta:", error);
            toast.dismiss();
            toast.error("No se pudieron guardar los cambios.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <p className="text-center mt-8">Cargando encuesta para editar...</p>;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-5xl font-display font-bold">Editando Encuesta</h1>
                <p className="text-lg text-gray-500 mt-2">Ajusta los detalles de tu encuesta.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl space-y-8">
                <div>
                    <label htmlFor="question" className="block text-lg font-semibold mb-2">Pregunta</label>
                    <textarea id="question" value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full text-lg p-4 rounded-lg bg-light-bg dark:bg-dark-bg border-2 border-transparent focus:border-primary focus:outline-none min-h-[100px] resize-y" />
                </div>

                <div>
                    <label className="block text-lg font-semibold mb-2">Opciones de Respuesta</label>
                    {areOptionsLocked && <div className="text-sm p-3 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-lg flex items-center gap-2"><Info size={16}/>No se pueden editar las opciones porque la encuesta ya tiene votos.</div>}
                    <div className="space-y-3 mt-2">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-3">
                                {isQuiz && <button type="button" onClick={() => handleCorrectAnswerToggle(option)} disabled={areOptionsLocked} className={`p-3 rounded-full transition-colors ${correctAnswers.includes(option) ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}><Check size={18} /></button>}
                                <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} disabled={areOptionsLocked} className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed" />
                                {!areOptionsLocked && <button type="button" onClick={() => removeOption(index)} className="p-3 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><X size={18} /></button>}
                            </div>
                        ))}
                    </div>
                    {!areOptionsLocked && <button type="button" onClick={addOption} className="mt-4 flex items-center gap-2 text-sm font-bold text-primary hover:underline"><Plus size={16} />Añadir opción</button>}
                </div>

                <div>
                    <label htmlFor="tags" className="block text-lg font-semibold mb-2">Etiquetas</label>
                    <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ej: tecnologia, cine, videojuegos..." className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border-2 border-transparent focus:border-primary focus:outline-none" />
                </div>
                
                <div>
                    <label className="block text-lg font-semibold mb-2">Imagen de Portada</label>
                    {imagePreview ? (
                        <div className="relative group w-full h-48">
                            <img src={imagePreview} alt="Previsualización" className="w-full h-full object-cover rounded-lg" />
                            <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Eliminar imagen"><XCircle size={20} /></button>
                        </div>
                    ) : (
                        <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg">
                            <UploadCloud size={32} className="text-gray-500 dark:text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Click para subir una imagen</p>
                        </label>
                    )}
                    <input id="image-upload" ref={imageInputRef} type="file" onChange={handleImageChange} className="hidden" accept="image/png, image/jpeg, image/gif" />
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button type="submit" disabled={isSaving} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all transform hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}