import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp, Timestamp, getDocFromServer, writeBatch, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const firebaseConfigWithEnv = {
  ...firebaseConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
};

const app = initializeApp(firebaseConfigWithEnv);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Spec for Firestore Operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}
testConnection();

// Auth Helpers
export const syncUserToFirestore = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  
  const userData: any = {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastLogin: serverTimestamp()
  };

  if (!userDoc.exists()) {
    userData.createdAt = serverTimestamp();
  }

  await setDoc(userRef, userData, { merge: true });
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await syncUserToFirestore(user);
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string, name: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const user = result.user;
    await updateProfile(user, { displayName: name });
    await syncUserToFirestore(user);
    return user;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    const user = result.user;
    await syncUserToFirestore(user);
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const markIntroAsSeen = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, {
      hasSeenIntro: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
};

export const logout = () => signOut(auth);

export const updateUserProfile = async (userId: string, data: { displayName?: string; photoURL?: string }) => {
  const userRef = doc(db, 'users', userId);
  try {
    // Update Firebase Auth profile if current user
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await updateProfile(auth.currentUser, data);
    }
    // Update Firestore user document
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
};

// League Helpers
export const createLeague = async (name: string, creatorId: string) => {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const leagueRef = doc(collection(db, 'leagues'));
  const leagueData = {
    name,
    inviteCode,
    creatorId,
    members: [creatorId],
    roles: { [creatorId]: 'admin' },
    status: 'waiting',
    draftType: 'snake',
    createdAt: serverTimestamp()
  };
  
  try {
    await setDoc(leagueRef, leagueData);
    return { id: leagueRef.id, ...leagueData };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `leagues/${leagueRef.id}`);
  }
};

export const joinLeagueByCode = async (inviteCode: string, userId: string) => {
  const leaguesRef = collection(db, 'leagues');
  const q = query(leaguesRef, where('inviteCode', '==', inviteCode));
  
  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('Invalid invite code');
    }
    
    const leagueDoc = querySnapshot.docs[0];
    const leagueData = leagueDoc.data();
    
    if (leagueData.status !== 'waiting' && leagueData.status !== 'drafting') {
      throw new Error('This league has already started or finished drafting and no longer accepts new members.');
    }
    
    if (leagueData.members.includes(userId)) {
      return { id: leagueDoc.id, ...leagueData };
    }
    
    const updatedMembers = [...leagueData.members, userId];
    const updatedRoles = { ...leagueData.roles, [userId]: 'member' };
    await updateDoc(leagueDoc.ref, { 
      members: updatedMembers,
      roles: updatedRoles
    });
    
    return { id: leagueDoc.id, ...leagueData, members: updatedMembers, roles: updatedRoles };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'leagues');
  }
};

export const startLeague = async (leagueId: string, picks: any[]) => {
  const leagueRef = doc(db, 'leagues', leagueId);
  try {
    // Update league status to drafted
    await updateDoc(leagueRef, { status: 'drafted' });
    
    // Save each pick as a team document in the subcollection
    const batch = writeBatch(db);
    picks.forEach((pick) => {
      const teamRef = doc(collection(db, `leagues/${leagueId}/teams`));
      batch.set(teamRef, {
        ...pick,
        status: 'active',
        createdAt: serverTimestamp()
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `leagues/${leagueId}`);
  }
};

export const removeMemberFromLeague = async (leagueId: string, userIdToRemove: string) => {
  const leagueRef = doc(db, 'leagues', leagueId);
  try {
    const leagueDoc = await getDoc(leagueRef);
    if (!leagueDoc.exists()) throw new Error('League not found');
    
    const data = leagueDoc.data();
    const updatedMembers = data.members.filter((id: string) => id !== userIdToRemove);
    const updatedRoles = { ...data.roles };
    delete updatedRoles[userIdToRemove];
    
    await updateDoc(leagueRef, { 
      members: updatedMembers,
      roles: updatedRoles
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `leagues/${leagueId}`);
  }
};

export const updateMemberRole = async (leagueId: string, userId: string, newRole: 'admin' | 'member') => {
  const leagueRef = doc(db, 'leagues', leagueId);
  try {
    const leagueDoc = await getDoc(leagueRef);
    if (!leagueDoc.exists()) throw new Error('League not found');
    
    const data = leagueDoc.data();
    const updatedRoles = { ...data.roles, [userId]: newRole };
    
    await updateDoc(leagueRef, { roles: updatedRoles });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `leagues/${leagueId}`);
  }
};

export const deleteLeague = async (leagueId: string) => {
  const leagueRef = doc(db, 'leagues', leagueId);
  try {
    // Note: In a real app, you might want to delete subcollections too,
    // but Firestore doesn't do this automatically. For this app, we'll just delete the league doc.
    await deleteDoc(leagueRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `leagues/${leagueId}`);
  }
};

export const syncLeagueStats = async (leagueId: string, standings: any[]) => {
  const teamsRef = collection(db, `leagues/${leagueId}/teams`);
  try {
    const querySnapshot = await getDocs(teamsRef);
    const batch = writeBatch(db);
    let updatedCount = 0;
    
    querySnapshot.docs.forEach((teamDoc) => {
      const teamData = teamDoc.data();
      const teamTla = teamData.teamId.toUpperCase();
      
      // Find the team in the standings
      let foundTeam: any = null;
      for (const group of standings) {
        foundTeam = group.table.find((row: any) => row.team.tla === teamTla);
        if (foundTeam) break;
      }
      
      if (foundTeam) {
        batch.update(teamDoc.ref, {
          stats: {
            wins: foundTeam.won,
            losses: foundTeam.lost,
            draws: foundTeam.draw,
            advancedFromGroup: foundTeam.position <= 2, // Assuming top 2 advance
          },
          updatedAt: serverTimestamp()
        });
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      await batch.commit();
    }
    return updatedCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `leagues/${leagueId}/teams`);
  }
};

export const getLeagueMembers = async (memberIds: string[]) => {
  if (!memberIds.length) return [];
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('__name__', 'in', memberIds));
  
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
};

export const seedDemoData = async (currentUserId: string, currentUserName: string, teams: any[]) => {
  try {
    const batch = writeBatch(db);
    
    // 1. Create Dummy Users
    const dummyUsers = [
      { id: 'demo_user_1', name: 'Alex "Striker" Chen', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
      { id: 'demo_user_2', name: 'Sarah "The Wall" Miller', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
      { id: 'demo_user_3', name: 'Marcus "Midfield" Jones', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' }
    ];

    dummyUsers.forEach(u => {
      const userRef = doc(db, 'users', u.id);
      batch.set(userRef, {
        displayName: u.name,
        photoURL: u.photo,
        email: `${u.id}@demo.com`,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
    });

    // 2. Create Demo League
    const leagueRef = doc(collection(db, 'leagues'));
    const allMemberIds = [currentUserId, ...dummyUsers.map(u => u.id)];
    const roles: any = { [currentUserId]: 'admin' };
    dummyUsers.forEach(u => roles[u.id] = 'member');

    const leagueData = {
      name: "World Cup Elite Demo",
      inviteCode: "DEMO26",
      creatorId: currentUserId,
      members: allMemberIds,
      roles: roles,
      status: 'drafted',
      draftType: 'snake',
      createdAt: serverTimestamp()
    };
    batch.set(leagueRef, leagueData);

    // 3. Simulate Draft (4 users, 4 teams each = 16 teams)
    const shuffledTeams = [...teams].sort(() => 0.5 - Math.random());
    const picksPerUser = 4;
    
    allMemberIds.forEach((uid, userIdx) => {
      const userName = uid === currentUserId ? currentUserName : dummyUsers.find(u => u.id === uid)?.name || "Demo User";
      
      for (let i = 0; i < picksPerUser; i++) {
        const teamIdx = userIdx + (i * allMemberIds.length);
        const team = shuffledTeams[teamIdx];
        if (!team) continue;

        const teamRef = doc(collection(db, `leagues/${leagueRef.id}/teams`));
        batch.set(teamRef, {
          teamId: team.id,
          userId: uid,
          userName: userName,
          round: i + 1,
          pickNumber: teamIdx + 1,
          status: 'active',
          stats: {
            wins: Math.floor(Math.random() * 3),
            losses: Math.floor(Math.random() * 2),
            draws: Math.floor(Math.random() * 2),
            advancedFromGroup: Math.random() > 0.5
          },
          createdAt: serverTimestamp()
        });
      }
    });

    await batch.commit();
    return leagueRef.id;
  } catch (error) {
    console.error("Error seeding demo data:", error);
    throw error;
  }
};
