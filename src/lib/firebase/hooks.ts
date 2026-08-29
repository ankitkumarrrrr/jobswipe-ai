"use client";

import { useState, useEffect, useCallback } from "react";
import { getFirebase, isFirebaseConfigured } from "./config";
import { collection, onSnapshot, query, orderBy, limit, doc, setDoc, serverTimestamp } from "firebase/firestore";

// Hook for real-time stats from Firestore
export function useFirebaseStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const { db } = getFirebase();
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      const statsRef = doc(db, "stats", "dashboard");
      const unsubscribe = onSnapshot(statsRef, (doc) => {
        if (doc.exists()) {
          setStats(doc.data());
          setConnected(true);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase stats error:", error);
      setLoading(false);
    }
  }, []);

  return { stats, loading, connected };
}

// Hook for real-time user list from Firestore
export function useFirebaseUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const { db } = getFirebase();
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      const usersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const userList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(userList);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase users error:", error);
      setLoading(false);
    }
  }, []);

  return { users, loading };
}

// Sync local stats to Firestore
export async function syncStatsToFirebase(stats: any) {
  if (!isFirebaseConfigured) return;

  const { db } = getFirebase();
  if (!db) return;

  try {
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    await setDoc(doc(db, "stats", "dashboard"), {
      ...stats,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to sync stats to Firebase:", error);
  }
}

// Sync a new user to Firestore
export async function syncUserToFirebase(user: any) {
  if (!isFirebaseConfigured) return;

  const { db } = getFirebase();
  if (!db) return;

  try {
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    await setDoc(doc(db, "users", user.id), {
      ...user,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to sync user to Firebase:", error);
  }
}
