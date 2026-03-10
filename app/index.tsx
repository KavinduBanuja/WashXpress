import { Redirect } from 'expo-router';

// ── AUTO-RETRIEVAL (commented out for testing) ────────────────────────────────
// To restore: uncomment everything below and delete the simple Redirect return.
/*
import * as SecureStore from 'expo-secure-store';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../firebaseConfig';
import { apiFetch } from '../services/apiClient';

type Destination =
  | '/login'
  | '/customer-home'
  | '/washer-home'
  | '/washer-pending';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [destination, setDestination] = useState<Destination | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await new Promise<User | null>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 5000);
          const unsubscribe = onAuthStateChanged(auth, (u) => {
            clearTimeout(timeout);
            unsubscribe();
            resolve(u);
          });
        });

        if (!user) {
          await Promise.all([
            SecureStore.deleteItemAsync('accessToken'),
            SecureStore.deleteItemAsync('userType'),
          ]);
          setDestination('/login');
          return;
        }

        const userType = await SecureStore.getItemAsync('userType');
        if (!userType) { setDestination('/login'); return; }

        if (userType === 'customer') { setDestination('/customer-home'); return; }

        if (userType === 'provider') {
          try {
            const data = await apiFetch('/auth/washer/profile', {}, 'provider');
            setDestination(data.success && data.provider?.isVerified ? '/washer-home' : '/washer-pending');
          } catch {
            setDestination('/washer-pending');
          }
          return;
        }

        setDestination('/login');
      } catch {
        setDestination('/login');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading || !destination) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return <Redirect href={destination} />;
}
*/
// ─────────────────────────────────────────────────────────────────────────────

export default function Index() {
  return <Redirect href="/login" />;
}
