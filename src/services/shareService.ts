import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';

export async function toggleLifetimeSharing(userId: string, enable: boolean): Promise<string | null> {
  const token = enable ? Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) : null;
  const batch = writeBatch(db);

  // Update user profile
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, { shareToken: token });

  // Update all events owned by this user
  const eventsRef = collection(db, 'events');
  const q = query(eventsRef, where('ownerId', '==', userId));
  const snapshot = await getDocs(q);

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { shareToken: token });
  });

  await batch.commit();
  return token;
}
