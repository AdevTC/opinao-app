// src/components/PollCard.jsx (Actualizado con animaciones)

import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, HelpCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const PollCard = ({ poll }) => {
    const hasDeadline = poll.deadline && poll.deadline.toDate;
    const isPollClosed = hasDeadline && poll.deadline.toDate() < new Date();

    return (
        // --- 1. Añadimos clases para la transición y el efecto hover ---
        <div className="bg-light-container dark:bg-dark-container rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-300 ease-in-out hover:-translate-y-1 flex flex-col justify-between overflow-hidden">
            {poll.imageUrl && (
                <div className="w-full h-40 overflow-hidden">
                    {/* 2. Añadimos un efecto de zoom a la imagen */}
                    <img src={poll.imageUrl} alt={poll.question} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
            )}
            <div className="p-6 flex flex-col justify-between flex-grow">
                <div>
                    {poll.tags && poll.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {poll.tags.map(tag => (
                                <Link key={tag} to={`/tag/${tag}`} className="text-xs bg-primary/10 text-primary font-bold px-2 py-1 rounded-full hover:bg-primary/20 transition-colors">
                                    #{tag}
                                </Link>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-between items-start">
                        <h2 className="font-display text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200 pr-2">{poll.question}</h2>
                        {poll.isQuiz && <HelpCircle className="text-primary flex-shrink-0" title="Esta encuesta es un Quiz" />}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm">
                        Creada por{' '}
                        <Link to={poll.authorUid ? `/profile/${poll.authorUid}` : '#'} className="text-primary font-bold hover:underline">
                            {poll.authorUsername || 'Anónimo'}
                        </Link>
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5"><BarChart2 size={14} /> {poll.totalVotes || 0} votos</span>

                        {hasDeadline && (
                            <span className={`flex items-center gap-1.5 font-semibold ${isPollClosed ? 'text-red-500' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                <Clock size={14} />
                                {isPollClosed ? 'Cerrada' : `Cierra ${formatDistanceToNow(poll.deadline.toDate(), { locale: es, addSuffix: true })}`}
                            </span>
                        )}
                    </div>
                </div>
                <Link to={`/poll/${poll.id}`} className={`block w-full text-center text-white font-bold py-2 px-4 rounded-lg mt-6 transition-all duration-300 ${isPollClosed ? 'bg-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 hover:scale-105'}`}>
                    {isPollClosed ? 'Ver Resultados' : 'Votar ahora'}
                </Link>
            </div>
        </div>
    );
};