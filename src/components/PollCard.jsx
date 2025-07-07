// src/components/PollCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, HelpCircle } from 'lucide-react';

export const PollCard = ({ poll }) => {
    return (
        <div className="bg-light-container dark:bg-dark-container rounded-xl shadow-lg hover:shadow-primary/20 transition-shadow duration-300 flex flex-col justify-between overflow-hidden">
            {poll.imageUrl && (
                <div className="w-full h-40">
                    <img src={poll.imageUrl} alt="" className="w-full h-full object-cover" />
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
                        <h2 className="font-display text-2xl font-bold mb-2 text-gray-800 dark:text-primary-light pr-2">{poll.question}</h2>
                        {poll.isQuiz && <HelpCircle className="text-primary flex-shrink-0" title="Esta encuesta es un Quiz" />}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm">
                        Creada por{' '}
                        <Link to={poll.authorUid ? `/profile/${poll.authorUid}` : '#'} className="text-primary font-bold hover:underline">
                            {poll.authorUsername || 'Anónimo'}
                        </Link>
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <BarChart2 size={14} />
                        <span>{poll.totalVotes || 0} votos</span>
                    </div>
                </div>
                <Link to={`/poll/${poll.id}`} className="block w-full text-center bg-primary text-white font-bold py-2 px-4 rounded-lg mt-4 hover:bg-primary/90 transition-colors">Votar ahora</Link>
            </div>
        </div>
    );
};