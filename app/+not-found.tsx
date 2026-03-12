import { Link, Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function NotFoundScreen() {
  const { userType } = useAuth();
  const router = useRouter();

  const handleGoHome = () => {
    if (userType === 'provider') {
      router.replace('/washer-home');
    } else if (userType === 'customer') {
      router.replace('/customer-home');
    } else {
      router.replace('/login');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={80} color="#2563eb" />
        <Text style={styles.title}>Under Construction</Text>
        <Text style={styles.message}>
          This screen is currently been developed and will be available soon.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleGoHome}>
          <Text style={styles.buttonText}>Go to Home Screen</Text>
        </TouchableOpacity>
        
        <Link href="/" asChild>
          <TouchableOpacity style={styles.link}>
            <Text style={styles.linkText}>Return to Start</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#0f172a',
  },
  message: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 16,
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#64748b',
    textDecorationLine: 'underline',
  },
});
