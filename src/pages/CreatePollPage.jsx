// src/pages/CreatePollPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function CreatePollPage() {
    const { user } = useAuth();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [isQuiz, setIsQuiz] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState([]);
    const [hideResults, setHideResults] = useState(false); // <-- Nuevo estado
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    
    const handleOptionChange = (index, value) => { const newOptions = [...options]; newOptions[index] = value; setOptions(newOptions); };
    const addOption = () => { if (options.length < 10) setOptions([...options, '']); else toast.error("Máximo 10 opciones."); };
    const removeOption = (index) => { if (options.length > 2) setOptions(options.filter((_, i) => i !== index)); else toast.error("Mínimo 2 opciones."); };
    
    const handleCorrectAnswerChange = (option) => {
        setCorrectAnswers(prev => 
            prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return toast.error("La pregunta no puede estar vacía.");
        const filledOptions = options.map(opt => opt.trim()).filter(opt => opt !== '');
        if (filledOptions.length < 2) return toast.error("Debes proporcionar al menos 2 opciones.");
        if (isQuiz && correctAnswers.length === 0) return toast.error("En un quiz, debes marcar al menos una respuesta correcta.");
        
        setIsLoading(true);
        try {
            await addDoc(collection(db, "polls"), {
                question: question.trim(),
                options: filledOptions,
                authorUid: user.uid,
                authorUsername: user.username,
                createdAt: serverTimestamp(),
                votes: {},
                totalVotes: 0,
                isQuiz,
                correctAnswers: isQuiz ? correctAnswers : [],
                hideResults // <-- Añadimos la nueva opción
            });
            toast.success("¡Encuesta creada!");
            navigate(`/`);
        } catch (error) {
            toast.error("No se pudo crear la encuesta.");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-display font-bold mb-8 text-center">Crea tu Encuesta</h1>
            <form onSubmit={handleSubmit} className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl space-y-6">
                <style>{`
                  .toggle-checkbox:checked { transform: translateX(1.5rem); border-color: #7c3aed; }
                  .toggle-checkbox:checked + .toggle-label { background-color: #7c3aed; }
                `}</style>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-light-bg dark:bg-dark-bg p-3 rounded-lg">
                        <label htmlFor="isQuiz" className="font-bold">Modo Quiz</label>
                        <div className="relative inline-block w-14 h-8 align-middle select-none">
                            <input type="checkbox" name="isQuiz" id="isQuiz" checked={isQuiz} onChange={(e) => setIsQuiz(e.target.checked)} className="toggle-checkbox absolute block w-8 h-8 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-300 ease-in-out"/>
                            <label htmlFor="isQuiz" className="toggle-label block overflow-hidden h-8 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300 ease-in-out"></label>
                        </div>
                    </div>
                    {/* Nuevo interruptor para ocultar resultados */}
                    <div className="flex items-center justify-between bg-light-bg dark:bg-dark-bg p-3 rounded-lg">
                        <label htmlFor="hideResults" className="font-bold">Ocultar resultados hasta votar</label>
                        <div className="relative inline-block w-14 h-8 align-middle select-none">
                            <input type="checkbox" name="hideResults" id="hideResults" checked={hideResults} onChange={(e) => setHideResults(e.target.checked)} className="toggle-checkbox absolute block w-8 h-8 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-300 ease-in-out"/>
                            <label htmlFor="hideResults" className="toggle-label block overflow-hidden h-8 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300 ease-in-out"></label>
                        </div>
                    </div>
                </div>

                <div><label htmlFor="question" className="block text-lg font-bold mb-2">Tu Pregunta</label><input type="text" id="question" value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full p-3 text-lg rounded-lg bg-light-bg dark:bg-dark-bg"/></div>
                <div><label className="block text-lg font-bold mb-2">{isQuiz ? 'Define las opciones y marca la(s) correcta(s)' : 'Opciones de Respuesta'}</label><div className="space-y-3">{options.map((option, index) => (<div key={index} className="flex items-center gap-2">
                    {isQuiz && <input type="checkbox" checked={correctAnswers.includes(option)} onChange={() => handleCorrectAnswerChange(option)} disabled={!option} className="h-6 w-6 rounded text-primary focus:ring-primary"/>}
                    <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg" placeholder={`Opción ${index + 1}`}/>
                    <button type="button" onClick={() => removeOption(index)} className="p-3 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><Trash2 size={20} /></button>
                </div>))}</div></div><div className="flex justify-between items-center"><button type="button" onClick={addOption} className="font-bold text-primary hover:underline">Añadir opción</button><button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg">{isLoading ? 'Creando...' : 'Crear Encuesta'}</button></div>
            </form>
        </div>
    );
}
