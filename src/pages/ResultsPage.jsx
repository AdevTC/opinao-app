// src/pages/ResultsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAgeGroup } from '../utils/helpers';

const CustomBarChart = ({ data, title, dataKeyX, dataKeyY }) => (
    <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg">
        <h3 className="font-bold mb-4 text-center">{title}</h3>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey={dataKeyX} />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{fill: 'rgba(124, 58, 237, 0.1)'}} contentStyle={{backgroundColor: '#333', border: 'none', color: '#fff'}}/>
                <Bar dataKey={dataKeyY} fill="#7c3aed" name="Votos" />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

export default function ResultsPage() {
    const { id } = useParams();
    const [poll, setPoll] = useState(null);
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResultsData = async () => {
            setLoading(true);
            try {
                const pollDocRef = doc(db, "polls", id);
                const pollDoc = await getDoc(pollDocRef);

                if (pollDoc.exists()) {
                    setPoll({ ...pollDoc.data(), id: pollDoc.id });
                } else {
                    toast.error("Encuesta no encontrada.");
                    setLoading(false);
                    return;
                }
                
                const votersRef = collection(db, `polls/${id}/voters`);
                const votersSnapshot = await getDocs(votersRef);
                const votersData = votersSnapshot.docs.map(d => d.data());
                setVoters(votersData);

            } catch (e) {
                console.error("Error al cargar los resultados: ", e);
                toast.error("No se pudieron cargar los resultados de la encuesta.");
            } finally {
                setLoading(false);
            }
        };
        fetchResultsData();
    }, [id]);
    
    const genderData = useMemo(() => {
        if (!voters.length) return [];
        const counts = voters.reduce((acc, voter) => {
            const gender = {male: 'Hombres', female: 'Mujeres', other: 'Otro'}[voter.gender] || 'No especificado';
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, Votos: value }));
    }, [voters]);

    const ageData = useMemo(() => {
        if (!voters.length) return [];
        const counts = voters.reduce((acc, voter) => {
            const ageGroup = getAgeGroup(voter.age);
            acc[ageGroup] = (acc[ageGroup] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, Votos: value })).sort((a,b) => a.name.localeCompare(b.name));
    }, [voters]);
    
     const countryData = useMemo(() => {
        if (!voters.length) return [];
        const counts = voters.reduce((acc, voter) => {
            const country = voter.country || 'No especificado';
            acc[country] = (acc[country] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, Votos: value })).sort((a,b) => b.Votos - a.Votos);
    }, [voters]);

    if (loading) return <p className="text-center mt-8">Cargando resultados...</p>;
    if (!poll) return <p className="text-center mt-8">Encuesta no encontrada.</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-display font-bold mb-2 text-center">Resultados Detallados</h1>
            <p className="text-xl text-gray-500 mb-8 text-center">{poll.question}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <CustomBarChart data={genderData} title="Votos por Género" dataKeyX="name" dataKeyY="Votos" />
                <CustomBarChart data={ageData} title="Votos por Grupo de Edad" dataKeyX="name" dataKeyY="Votos" />
                <CustomBarChart data={countryData} title="Votos por País" dataKeyX="name" dataKeyY="Votos" />
            </div>
        </div>
    );
};
