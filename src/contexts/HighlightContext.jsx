import React, { createContext, useContext, useState, useCallback } from 'react';

const HighlightContext = createContext();

export const useHighlight = () => {
    return useContext(HighlightContext);
};

export const HighlightProvider = ({ children }) => {
    const [highlightedId, setHighlightedId] = useState(null);

    const highlightComment = useCallback((commentId) => {
        setHighlightedId(commentId);
        setTimeout(() => {
            setHighlightedId(null);
        }, 2000);
    }, []);

    const value = {
        highlightedId,
        highlightComment,
    };

    return (
        <HighlightContext.Provider value={value}>
            {children}
        </HighlightContext.Provider>
    );
};