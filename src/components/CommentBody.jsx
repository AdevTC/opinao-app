// src/components/CommentBody.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/helpers';

export const CommentBody = ({ authorUid, authorUsername, createdAt, text }) => (
    <>
        <div className="flex justify-between items-center mb-1">
            <Link to={`/profile/${authorUid}`} className="font-bold text-sm text-primary hover:underline">
                {authorUsername}
            </Link>
            <p className="text-xs text-gray-500">{formatDate(createdAt)}</p>
        </div>
        <p className="text-sm break-words">{text}</p>
    </>
);