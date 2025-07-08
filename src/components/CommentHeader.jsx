// src/components/CommentHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export const CommentHeader = ({ authorUid, authorAvatarUrl, authorUsername }) => (
    <Link to={`/profile/${authorUid}`}>
        <img 
            src={authorAvatarUrl || `https://ui-avatars.com/api/?name=${authorUsername}&background=7c3aed&color=fff&size=40`} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
    </Link>
);