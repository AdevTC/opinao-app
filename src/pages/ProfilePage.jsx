// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  documentId,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/helpers';
import { Edit, MapPin, Briefcase, FileText, Vote, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { authorUid } = useParams();
  const [activeTab, setActiveTab] = useState('created');
  const [createdPolls, setCreatedPolls] = useState([]);
  const [votedPolls, setVotedPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const { user: currentUser } = useAuth();

  const [lastVotedVisible, setLastVotedVisible] = useState(null);
  const [hasMoreVoted, setHasMoreVoted] = useState(true);
  const [loadingMoreVoted, setLoadingMoreVoted] = useState(false);

  const isOwnProfile = currentUser && currentUser.uid === authorUid;
  const POLLS_PER_PAGE = 5;

  useEffect(() => {
    setLoading(true);
    const userDocRef = doc(db, 'users', authorUid);

    const profileUnsubscribe = onSnapshot(userDocRef, (userDoc) => {
      if (userDoc.exists()) {
        setProfile(userDoc.data());
      } else {
        setProfile(null);
      }
    });

    const createdPollsRef = collection(db, 'polls');
    const qCreated = query(createdPollsRef, where('authorUid', '==', authorUid), orderBy('createdAt', 'desc'));
    const createdUnsubscribe = onSnapshot(qCreated, (querySnapshot) => {
      setCreatedPolls(querySnapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
      setLoading(false);
    });

    return () => {
      profileUnsubscribe();
      createdUnsubscribe();
    };
  }, [authorUid]);

  useEffect(() => {
    const fetchInitialVotedPolls = async () => {
      if (isOwnProfile && profile && profile.votedPolls && profile.votedPolls.length > 0) {
        const pollsRef = collection(db, 'polls');
        const votedIds = profile.votedPolls.slice(0, POLLS_PER_PAGE);
        const q = query(pollsRef, where(documentId(), 'in', votedIds));
        const snapshot = await getDocs(q);
        const initialPolls = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        setVotedPolls(initialPolls);
        setLastVotedVisible(votedIds[votedIds.length - 1]);
        setHasMoreVoted(profile.votedPolls.length > POLLS_PER_PAGE);
      }
    };
    fetchInitialVotedPolls();
  }, [profile, isOwnProfile]);

  const fetchMoreVotedPolls = async () => {
    if (!hasMoreVoted || loadingMoreVoted || !profile?.votedPolls?.length) return;
    setLoadingMoreVoted(true);
    try {
      const currentIndex = profile.votedPolls.indexOf(lastVotedVisible) + 1;
      const nextIds = profile.votedPolls.slice(currentIndex, currentIndex + POLLS_PER_PAGE);
      if (nextIds.length === 0) {
        setHasMoreVoted(false);
        return;
      }
      const pollsRef = collection(db, 'polls');
      const q = query(pollsRef, where(documentId(), 'in', nextIds));
      const snapshot = await getDocs(q);
      const newPolls = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
      setVotedPolls((prev) => [...prev, ...newPolls]);
      setLastVotedVisible(nextIds[nextIds.length - 1]);
      setHasMoreVoted(profile.votedPolls.length > currentIndex + POLLS_PER_PAGE);
    } catch (err) {
      toast.error('Error al cargar más encuestas votadas.');
    } finally {
      setLoadingMoreVoted(false);
    }
  };

  const TabButton = ({ tabName, activeTab, setActiveTab, icon, children }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center gap-2 py-2 px-4 rounded-t-lg font-bold transition-colors ${
        activeTab === tabName
          ? 'bg-light-container dark:bg-dark-container text-primary'
          : 'bg-transparent text-gray-500 hover:text-primary'
      }`}
    >
      {icon} {children}
    </button>
  );

  if (loading) return <p className="text-center mt-8">Cargando perfil...</p>;
  if (!profile) return <p className="text-center mt-8">Este usuario no existe.</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-light-container dark:bg-dark-container p-8 rounded-xl shadow-2xl mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img
            src={
              profile.avatarUrl ||
              `https://ui-avatars.com/api/?name=${profile.username}&background=7c3aed&color=fff&size=128`
            }
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-grow text-center sm:text-left w-full">
            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <h1 className="text-3xl font-display font-bold">{profile.username}</h1>
              {isOwnProfile && (
                <>
                  <Link to="/edit-profile" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Editar Perfil">
                    <Edit size={20} />
                  </Link>
                  <Link to="/settings" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Ajustes de Cuenta">
                    <Settings size={20} />
                  </Link>
                </>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400">Miembro desde {formatDate(profile.createdAt)}</p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 justify-center sm:justify-start text-sm">
              {profile.country && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {profile.country}
                </span>
              )}
              {profile.profession && (
                <span className="flex items-center gap-1">
                  <Briefcase size={14} /> {profile.profession}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4">
          <TabButton tabName="created" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FileText size={16} />}>
            Creadas
          </TabButton>
          {isOwnProfile && (
            <TabButton tabName="voted" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Vote size={16} />}>
              Votadas
            </TabButton>
          )}
        </nav>
      </div>

      <div className="py-6">
        {activeTab === 'created' && (
          <div className="space-y-4">
            {createdPolls.length > 0 ? (
              createdPolls.map((poll) => (
                <Link
                  key={poll.id}
                  to={`/poll/${poll.id}`}
                  className="block bg-light-container dark:bg-dark-container p-4 rounded-lg hover:shadow-lg transition-shadow"
                >
                  <p className="font-bold">{poll.question}</p>
                  <p className="text-sm text-gray-500">
                    {poll.totalVotes || 0} votos • Creada {formatDate(poll.createdAt)}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-center text-gray-500 p-8 rounded-xl bg-light-container dark:bg-dark-container">
                Este usuario todavía no ha creado ninguna encuesta.
              </p>
            )}
          </div>
        )}
        {activeTab === 'voted' && (
          <div className="space-y-4">
            {votedPolls.length > 0 ? (
              <>
                {votedPolls.map((poll) => (
                  <Link
                    key={poll.id}
                    to={`/poll/${poll.id}`}
                    className="block bg-light-container dark:bg-dark-container p-4 rounded-lg hover:shadow-lg transition-shadow"
                  >
                    <p className="font-bold">{poll.question}</p>
                    <p className="text-sm text-gray-500">
                      {poll.totalVotes || 0} votos • Creada por {poll.authorUsername}
                    </p>
                  </Link>
                ))}
                {hasMoreVoted && (
                  <div className="text-center mt-6">
                    <button
                      onClick={fetchMoreVotedPolls}
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                      disabled={loadingMoreVoted}
                    >
                      {loadingMoreVoted ? 'Cargando...' : 'Cargar más'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-gray-500 p-8 rounded-xl bg-light-container dark:bg-dark-container">
                Aún no has votado en ninguna encuesta.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
