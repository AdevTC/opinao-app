import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDocs, collection, query, where, onSnapshot, orderBy, documentId } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/helpers';
import { toggleFollow } from '../utils/userActions';
import { checkAndAwardBadges, BADGE_DEFINITIONS } from '../utils/badges';
import { Edit, Settings, UserPlus, UserCheck, Briefcase, GraduationCap, FileText, Vote, Loader, BarChart3, Trophy, Bookmark } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { PollCard } from '../components/PollCard';
import { PollCardSkeleton } from '../components/PollCardSkeleton';

const ProfileCardSkeleton = () => (
    <div className="bg-light-container dark:bg-dark-container rounded-xl shadow-2xl overflow-hidden mb-8 animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-800"></div>
        <div className="p-6">
            <div className="flex justify-between items-start -mt-24">
                <div className="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-700 border-4 border-light-container dark:border-dark-container"></div>
                <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded-lg mt-6"></div>
            </div>
            <div className="pt-4 space-y-3">
                <div className="h-8 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-12 w-full bg-gray-300 dark:bg-gray-700 rounded mt-4"></div>
            </div>
            <div className="flex items-center gap-6 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="h-10 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-10 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-10 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
        </div>
    </div>
);

export default function ProfilePage() {
    const { authorUid } = useParams();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [isFollowingLoading, setIsFollowingLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('created');
    const [badgesChecked, setBadgesChecked] = useState(false);

    const POLLS_PER_PAGE = 6;
    const isOwnProfile = currentUser && currentUser.uid === authorUid;

    const createdPollsQuery = useMemo(() => 
        query(collection(db, 'polls'), where('authorUid', '==', authorUid), orderBy('createdAt', 'desc'))
    , [authorUid]);
    const { data: createdPolls, loading: loadingCreated, loadMore: loadMoreCreated, hasMore: hasMoreCreated } = usePaginatedQuery(createdPollsQuery, POLLS_PER_PAGE);
    const createdLoadMoreRef = useInfiniteScroll(loadMoreCreated, hasMoreCreated, loadingCreated);

    const [votedPolls, setVotedPolls] = useState([]);
    const [loadingVoted, setLoadingVoted] = useState(true);
    const [votedPollsIds, setVotedPollsIds] = useState([]);
    const [lastVotedIndex, setLastVotedIndex] = useState(0);
    const [hasMoreVoted, setHasMoreVoted] = useState(true);

    const [savedPolls, setSavedPolls] = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(true);
    const [savedPollsIds, setSavedPollsIds] = useState([]);
    const [lastSavedIndex, setLastSavedIndex] = useState(0);
    const [hasMoreSaved, setHasMoreSaved] = useState(true);

    const isFollowing = profile?.followers?.includes(currentUser?.uid);

    useEffect(() => {
        const profileUnsubscribe = onSnapshot(doc(db, 'users', authorUid), (userDoc) => {
            if (userDoc.exists()) {
                const userData = { ...userDoc.data(), uid: userDoc.id };
                setProfile(userData);
                
                if (currentUser?.uid === authorUid) {
                    setVotedPollsIds(ids => JSON.stringify(ids) !== JSON.stringify(userData.votedPolls || []) ? (userData.votedPolls || []) : ids);
                    setSavedPollsIds(ids => JSON.stringify(ids) !== JSON.stringify(userData.savedPolls || []) ? (userData.savedPolls || []) : ids);
                    
                    if (!loadingCreated && !badgesChecked) {
                        checkAndAwardBadges(userData, createdPolls.length);
                        setBadgesChecked(true);
                    }
                }
            } else {
                setProfile(null);
            }
            setLoadingProfile(false);
        });
        return () => profileUnsubscribe();
    }, [authorUid, currentUser, createdPolls.length, loadingCreated, badgesChecked]);
    
    const fetchVotedPolls = async (startIndex = 0) => {
        if (!isOwnProfile || votedPollsIds.length === 0) {
            setLoadingVoted(false);
            setHasMoreVoted(false);
            return;
        }

        setLoadingVoted(true);
        const nextIds = votedPollsIds.slice(startIndex, startIndex + POLLS_PER_PAGE);

        if (nextIds.length === 0) {
            setHasMoreVoted(false);
            setLoadingVoted(false);
            return;
        }

        try {
            const pollsRef = collection(db, 'polls');
            const q = query(pollsRef, where(documentId(), 'in', nextIds));
            const snapshot = await getDocs(q);
            
            const fetchedPollsMap = snapshot.docs.reduce((acc, doc) => {
                acc[doc.id] = { ...doc.data(), id: doc.id };
                return acc;
            }, {});
            
            const orderedPolls = nextIds.map(id => fetchedPollsMap[id]).filter(Boolean);
            
            setVotedPolls(prev => startIndex === 0 ? orderedPolls : [...prev, ...orderedPolls]);
            setLastVotedIndex(startIndex + nextIds.length);
            setHasMoreVoted(votedPollsIds.length > startIndex + nextIds.length);
        } catch (err) {
            toast.error('Error al cargar encuestas votadas.');
        } finally {
            setLoadingVoted(false);
        }
    };

    const fetchSavedPolls = async (startIndex = 0) => {
        if (!isOwnProfile || savedPollsIds.length === 0) {
            setLoadingSaved(false);
            setHasMoreSaved(false);
            return;
        }

        setLoadingSaved(true);
        const nextIds = savedPollsIds.slice(startIndex, startIndex + POLLS_PER_PAGE);

        if (nextIds.length === 0) {
            setHasMoreSaved(false);
            setLoadingSaved(false);
            return;
        }

        try {
            const pollsRef = collection(db, 'polls');
            const q = query(pollsRef, where(documentId(), 'in', nextIds));
            const snapshot = await getDocs(q);
            
            const fetchedPollsMap = snapshot.docs.reduce((acc, doc) => {
                acc[doc.id] = { ...doc.data(), id: doc.id };
                return acc;
            }, {});
            
            const orderedPolls = nextIds.map(id => fetchedPollsMap[id]).filter(Boolean);
            
            setSavedPolls(prev => startIndex === 0 ? orderedPolls : [...prev, ...orderedPolls]);
            setLastSavedIndex(startIndex + nextIds.length);
            setHasMoreSaved(savedPollsIds.length > startIndex + nextIds.length);
        } catch (err) {
            toast.error('Error al cargar encuestas guardadas.');
        } finally {
            setLoadingSaved(false);
        }
    };

    useEffect(() => {
        if (isOwnProfile) {
            if (activeTab === 'voted' && votedPolls.length === 0) {
                fetchVotedPolls(0);
            } else if (activeTab === 'saved' && savedPolls.length === 0) {
                fetchSavedPolls(0);
            }
        }
    }, [activeTab, isOwnProfile, votedPollsIds, savedPollsIds]);

    const votedLoadMoreRef = useInfiniteScroll(() => fetchVotedPolls(lastVotedIndex), hasMoreVoted, loadingVoted);
    const savedLoadMoreRef = useInfiniteScroll(() => fetchSavedPolls(lastSavedIndex), hasMoreSaved, loadingSaved);

    const handleToggleFollow = async () => {
        if (!currentUser) return toast.error("Necesitas iniciar sesión para seguir a otros usuarios.");
        setIsFollowingLoading(true);
        await toggleFollow(currentUser.uid, profile.uid, isFollowing);
        setIsFollowingLoading(false);
    };

    if (loadingProfile) return <ProfileCardSkeleton />;
    if (!profile) return <p className="text-center mt-8">Este usuario no existe.</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-light-container dark:bg-dark-container rounded-xl shadow-2xl overflow-hidden mb-8">
                <div className={`h-48 ${profile.headerUrl ? '' : 'bg-gray-200 dark:bg-gray-800'}`}>
                    {profile.headerUrl && <img src={profile.headerUrl} alt="Cabecera del perfil" className="w-full h-full object-cover" />}
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-end -mt-20">
                        <img src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.username}&background=7c3aed&color=fff&size=128`} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-light-container dark:border-dark-container" />
                        <div className="pb-4">
                            {isOwnProfile ? (
                                <div className="flex gap-2">
                                    <Link to="/edit-profile" className="bg-gray-200 dark:bg-gray-700 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"><Edit size={16} /> Editar Perfil</Link>
                                    <Link to="/settings" className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" title="Ajustes de Cuenta"><Settings size={20} /></Link>
                                </div>
                            ) : currentUser && (
                                <button onClick={handleToggleFollow} disabled={isFollowingLoading} className={`font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${ isFollowing ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-primary text-white' }`}>
                                    {isFollowingLoading ? '...' : (isFollowing ? <><UserCheck size={16}/> Siguiendo</> : <><UserPlus size={16}/> Seguir</>)}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="pt-4">
                        <h1 className="text-3xl font-display font-bold">{profile.username}</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Miembro desde {formatDate(profile.createdAt)}</p>
                        {profile.bio && <p className="mt-4 text-base text-gray-700 dark:text-gray-300">{profile.bio}</p>}
                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                            {profile.profession && (<span className="flex items-center gap-1.5"><Briefcase size={14} /> {profile.profession}</span>)}
                            {profile.education && (<span className="flex items-center gap-1.5"><GraduationCap size={14} /> {profile.education}</span>)}
                        </div>
                    </div>
                    <div className="flex items-center gap-6 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="text-center"><p className="font-bold text-lg">{createdPolls.length}</p><p className="text-sm text-gray-500">Encuestas</p></div>
                        <div className="text-center"><p className="font-bold text-lg">{profile.followerCount || 0}</p><p className="text-sm text-gray-500">Seguidores</p></div>
                        <div className="text-center"><p className="font-bold text-lg">{profile.followingCount || 0}</p><p className="text-sm text-gray-500">Siguiendo</p></div>
                    </div>
                </div>
            </div>

            <div className="bg-light-container dark:bg-dark-container rounded-xl shadow-xl p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <h3 className="text-xl font-bold font-display flex items-center gap-2 mb-4"><BarChart3 size={20} /> Estadísticas</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                                <span className="font-semibold">Encuestas Creadas</span>
                                <span className="font-bold text-primary">{createdPolls.length}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                                <span className="font-semibold">Encuestas Votadas</span>
                                <span className="font-bold text-primary">{profile.votedPolls?.length || 0}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                                <span className="font-semibold">Quizzes Acertados</span>
                                <span className="font-bold text-primary">{profile.quizAnswersCorrect || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold font-display flex items-center gap-2 mb-4"><Trophy size={20} /> Logros</h3>
                        {profile.badges && profile.badges.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {profile.badges.map(badgeId => {
                                    const badge = BADGE_DEFINITIONS[badgeId];
                                    if (!badge) return null;
                                    return (
                                        <div key={badgeId} title={badge.description} className="flex items-center gap-2 bg-light-bg dark:bg-dark-bg p-2 rounded-full cursor-help">
                                            <span className="text-xl">{badge.icon}</span>
                                            <span className="font-semibold text-sm pr-2">{badge.name}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic mt-4">¡Sigue participando para desbloquear logros!</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4">
                    <button onClick={() => setActiveTab('created')} className={`flex items-center gap-2 py-2 px-4 rounded-t-lg font-bold transition-colors ${activeTab === 'created' ? 'bg-light-container dark:bg-dark-container text-primary' : 'bg-transparent text-gray-500 hover:text-primary'}`}><FileText size={16} /> Creadas</button>
                    {isOwnProfile && <button onClick={() => setActiveTab('voted')} className={`flex items-center gap-2 py-2 px-4 rounded-t-lg font-bold transition-colors ${activeTab === 'voted' ? 'bg-light-container dark:bg-dark-container text-primary' : 'bg-transparent text-gray-500 hover:text-primary'}`}><Vote size={16} /> Votadas</button>}
                    {isOwnProfile && <button onClick={() => setActiveTab('saved')} className={`flex items-center gap-2 py-2 px-4 rounded-t-lg font-bold transition-colors ${activeTab === 'saved' ? 'bg-light-container dark:bg-dark-container text-primary' : 'bg-transparent text-gray-500 hover:text-primary'}`}><Bookmark size={16} /> Guardadas</button>}
                </nav>
            </div>
            
            <div className="py-6">
                {activeTab === 'created' && (
                    <>
                        {loadingCreated && createdPolls.length === 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><PollCardSkeleton /><PollCardSkeleton /><PollCardSkeleton /></div>
                        ) : createdPolls.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {createdPolls.map(poll => <PollCard key={poll.id} poll={poll} />)}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-12">Este usuario no ha creado ninguna encuesta.</p>
                        )}
                        <div ref={createdLoadMoreRef} className="h-10 flex justify-center items-center">{hasMoreCreated && <Loader className="animate-spin text-primary" />}</div>
                    </>
                )}
                {activeTab === 'voted' && isOwnProfile && (
                    <>
                        {loadingVoted && votedPolls.length === 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><PollCardSkeleton /><PollCardSkeleton /><PollCardSkeleton /></div>
                        ) : votedPolls.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {votedPolls.map(poll => poll && <PollCard key={poll.id} poll={poll} />)}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-12">Aún no has votado en ninguna encuesta.</p>
                        )}
                         <div ref={votedLoadMoreRef} className="h-10 flex justify-center items-center">{hasMoreVoted && loadingVoted && <Loader className="animate-spin text-primary" />}</div>
                    </>
                )}
                {activeTab === 'saved' && isOwnProfile && (
                    <>
                        {loadingSaved && savedPolls.length === 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><PollCardSkeleton /><PollCardSkeleton /><PollCardSkeleton /></div>
                        ) : savedPolls.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {savedPolls.map(poll => poll && <PollCard key={poll.id} poll={poll} />)}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-12">Aún no has guardado ninguna encuesta.</p>
                        )}
                         <div ref={savedLoadMoreRef} className="h-10 flex justify-center items-center">{hasMoreSaved && loadingSaved && <Loader className="animate-spin text-primary" />}</div>
                    </>
                )}
            </div>
        </div>
    );
}
