/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, Query, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LifeEvent, UserProfile } from '../types';
import { useAuth } from './useAuth';

export function useTimeline(shareToken?: string | null) {
  const { user, isEditor } = useAuth();
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [sharedOwner, setSharedOwner] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setSharedOwner(null);
    if (shareToken) {
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('shareToken', '==', shareToken));
      getDocs(userQuery).then(snapshot => {
        if (!snapshot.empty) {
          setSharedOwner(snapshot.docs[0].data() as UserProfile);
        }
      }).catch(err => console.error('Failed to fetch shared owner:', err));
    } else {
      setSharedOwner(null);
    }
  }, [shareToken]);

  useEffect(() => {
    // If we have a shareToken, we can fetch even without a user
    if (!shareToken && loading && !user) {
      const checkAuthState = setTimeout(() => {
        if (!user) setLoading(false);
      }, 1500);
      return () => clearTimeout(checkAuthState);
    }
    
    // If no user and no shareToken, clear and stop
    if (!user && !shareToken) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const eventsRef = collection(db, 'events');
    let q: Query;

    if (shareToken) {
      // Fetch events that match the shareToken
      q = query(
        eventsRef,
        where('shareToken', '==', shareToken),
        orderBy('date', 'desc')
      );
    } else if (isEditor) {
      q = query(eventsRef, orderBy('date', 'desc'));
    } else if (user) {
      q = query(
        eventsRef, 
        where('participants', 'array-contains', user.uid),
        orderBy('date', 'desc')
      );
    } else {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const eventsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as LifeEvent[];
        setEvents(eventsData);
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
        console.error('Firestore Timeline Sync Error:', err);
      }
    );

    return () => unsubscribe();
  }, [user, isEditor, shareToken]);

  return { events, sharedOwner, loading, error };
}
