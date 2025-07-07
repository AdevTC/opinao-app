// src/pages/CreatePollPage.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Plus, X, Image as ImageIcon, Check, Settings2, Hash, FileQuestion, ListOrdered, UploadCloud } from 'lucide-react';

// Pequeño componente para las secciones del formulario
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

export default function CreatePollPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [tags, setTags] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isQuiz, setIsQuiz] = useState(false);
    const [hideResults, setHideResults] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState([]);
    const [loading, setLoading] = useState(false);
    const imageInputRef = useRef(null);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 10) {
            setOptions([...options, '']);
        } else {
            toast.error('Puedes añadir un máximo de 10 opciones.');
        }
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            const newOptions = [...options];
            newOptions.splice(index, 1);
            setOptions(newOptions);
        } else {
            toast.error('Debe haber un mínimo de 2 opciones.');
        }
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
        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const handleCorrectAnswerToggle = (option) => {
        if (!option) return;
        setCorrectAnswers(prev => 
            prev.includes(option)
                ? prev.filter(item => item !== option)
                : [...prev, option]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (!question.trim() || question.trim().length < 5) return toast.error('La pregunta debe tener al menos 5 caracteres.');
        if (options.some(opt => opt.trim() === '')) return toast.error('Todas las opciones deben tener un valor.');
        if (isQuiz && correctAnswers.length === 0) return toast.error('Si es un quiz, debes marcar al menos una respuesta como correcta.');

        setLoading(true);
        toast.loading('Creando encuesta...');

        try {
            let imageUrl = '';
            if (image) {
                const imageRef = ref(storage, `poll-images/${Date.now()}_${image.name}`);
                await uploadBytes(imageRef, image);
                imageUrl = await getDownloadURL(imageRef);
            }

            const tagsArray = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag);
            const votes = options.reduce((acc, option) => ({ ...acc, [option]: 0 }), {});
            
            const batch = writeBatch(db);
            const newPollRef = doc(collection(db, 'polls'));
            
            batch.set(newPollRef, {
                question,
                options,
                tags: tagsArray,
                imageUrl,
                authorUid: user.uid,
                authorUsername: user.username,
                createdAt: serverTimestamp(),
                totalVotes: 0,
                votes,
                isQuiz,
                hideResults,
                correctAnswers: isQuiz ? correctAnswers : [],
            });

            tagsArray.forEach(tag => {
                const tagRef = doc(db, 'tags', tag);
                batch.set(tagRef, { name: tag, count: increment(1) }, { merge: true });
            });

            await batch.commit();

            toast.dismiss();
            toast.success('¡Encuesta creada con éxito!');
            navigate(`/poll/${newPollRef.id}`);

        } catch (error) {
            console.error("Error al crear la encuesta:", error);
            toast.dismiss();
            toast.error('No se pudo crear la encuesta.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-5xl font-display font-bold">Crea una nueva encuesta</h1>
                <p className="text-lg text-gray-500 mt-2">Comparte tus ideas con la comunidad</p>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl space-y-8">
                {/* SECCIÓN 1: PREGUNTA */}
                <FormSection icon={<FileQuestion size={24} />} title="La Pregunta Principal">
                    <textarea id="question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ej: ¿Cuál es tu lenguaje de programación favorito?" className="w-full text-lg p-4 rounded-lg bg-light-bg dark:bg-dark-bg border-2 border-transparent focus:border-primary focus:outline-none min-h-[100px] resize-y" />
                </FormSection>

                {/* SECCIÓN 2: OPCIONES */}
                <FormSection icon={<ListOrdered size={24} />} title="Opciones de Respuesta">
                    <div className="space-y-3">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <span className="font-bold text-primary">{index + 1}.</span>
                                <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`Opción ${index + 1}`} className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border-2 border-transparent focus:border-primary focus:outline-none" />
                                {isQuiz && (
                                    <button type="button" onClick={() => handleCorrectAnswerToggle(option)} title="Marcar como correcta" className={`p-3 rounded-full transition-colors ${correctAnswers.includes(option) ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                        <Check size={18} />
                                    </button>
                                )}
                                <button type="button" onClick={() => removeOption(index)} title="Eliminar opción" className="p-3 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"><X size={18} /></button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addOption} className="mt-4 flex items-center gap-2 text-sm font-bold text-primary hover:underline"><Plus size={16} />Añadir opción</button>
                </FormSection>

                {/* SECCIÓN 3: OPCIONES ADICIONALES */}
                <FormSection icon={<Settings2 size={24} />} title="Ajustes Adicionales">
                    <div className="space-y-6">
                        {/* Tags */}
                        <div>
                            <label htmlFor="tags" className="block text-md font-semibold mb-2 flex items-center gap-2"><Hash size={18}/>Etiquetas</label>
                            <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ej: tecnologia, cine, videojuegos..." className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border-2 border-transparent focus:border-primary focus:outline-none" />
                            <p className="text-xs text-gray-500 mt-1">Separa las etiquetas por comas.</p>
                        </div>

                        {/* Imagen */}
                        <div>
                            <label className="block text-md font-semibold mb-2 flex items-center gap-2"><ImageIcon size={18}/>Imagen de Portada</label>
                            {imagePreview ? (
                                <div className="relative group w-full h-48">
                                    <img src={imagePreview} alt="Previsualización" className="w-full h-full object-cover rounded-lg" />
                                    <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Eliminar imagen"><X size={20} /></button>
                                </div>
                            ) : (
                                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg">
                                    <UploadCloud size={32} className="text-gray-500 dark:text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Click para subir una imagen</p>
                                </label>
                            )}
                            <input id="image-upload" ref={imageInputRef} type="file" onChange={handleImageChange} className="hidden" accept="image/png, image/jpeg, image/gif" />
                        </div>

                        {/* Toggles */}
                        <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <label htmlFor="isQuiz" className="font-semibold">Modo Quiz</label>
                                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" id="isQuiz" checked={isQuiz} onChange={(e) => setIsQuiz(e.target.checked)} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div></label>
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="hideResults" className="font-semibold">Ocultar resultados hasta votar</label>
                                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" id="hideResults" checked={hideResults} onChange={(e) => setHideResults(e.target.checked)} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div></label>
                            </div>
                        </div>
                    </div>
                </FormSection>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all transform hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {loading ? 'Publicando...' : 'Publicar Encuesta'}
                    </button>
                </div>
            </form>
        </div>
    );
}