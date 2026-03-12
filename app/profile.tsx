import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebaseConfig';
import { useProfile } from '../hooks/useProfile';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, userType } = useAuth();
  const { data: profile, isLoading, error, refetch } = useProfile();

  // Refetch profile data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[ProfileScreen] Screen focused - refetching profile');
      refetch();
    }, [refetch])
  );

  console.log(`[ProfileScreen] userType=${userType}, isLoading=${isLoading}, isVerified=${profile?.isVerified}, hasError=${!!error}`);
  if (profile) console.log(`[ProfileScreen] profileUID=${profile.uid}`);

  const handleSignOut = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
              console.log("✅ Signed out");
            } catch (err) {
              console.error("❌ Sign out error:", err);
            }
          }
        }
      ]
    );
  };

  const getUserName = () => {
    if (profile?.displayName) return profile.displayName;
    const first = profile?.firstName || '';
    const last = profile?.lastName || '';
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;
    return 'WashXpress User';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // UID Validation safeguard
  const currentUser = auth.currentUser;
  const isUidValid = profile && currentUser && profile.uid === currentUser.uid;

  if (error || (profile === null && !isLoading)) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Unable to load profile data. Please refresh or check your connection.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isUidValid && profile) {
    console.error("❌ UID mismatch detected!");
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="shield-checkmark" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Security validation failed. Please log in again.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleSignOut}>
          <Text style={styles.retryButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDark = userType === 'provider';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Header
        title="My Profile"
        theme={isDark ? 'dark' : 'light'}
        rightElement={
          <TouchableOpacity onPress={() => router.push('/edit-profile')} style={[styles.editButton, isDark && styles.editButtonDark]}>
            <Text style={[styles.editButtonText, isDark && styles.editButtonTextDark]}>Edit</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarContainer, isDark && styles.avatarContainerDark]}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={48} color={isDark ? "#93c5fd" : "#2563eb"} />
            )}
          </View>
          <Text style={[styles.userName, isDark && styles.userNameDark]}>{getUserName()}</Text>
          
          {(() => {
            // Determine badge appearance based on user type and status
            let badgeStyle: any = styles.badge;
            let textStyle: any = styles.badgeText;
            let label = '';

            if (userType === 'customer') {
              label = profile?.subscription?.tier || 'Free Member';
            } else {
              // Providers must be verified to reach this screen
              label = 'Verified Washer';
              if (isDark) badgeStyle = [styles.badge, styles.badgeDark];
            }

            return (
              <View style={badgeStyle}>
                <Text style={textStyle}>{label}</Text>
              </View>
            );
          })()}
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Contact Information</Text>

          <View style={[styles.infoCard, isDark && styles.infoCardDark]}>
            <View style={styles.infoRow}>
              <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                <Ionicons name="mail" size={20} color={isDark ? "#94a3b8" : "#666"} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Email</Text>
                <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{profile?.email || 'N/A'}</Text>
              </View>
            </View>

            <View style={[styles.divider, isDark && styles.dividerDark]} />

            <View style={styles.infoRow}>
              <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                <Ionicons name="call" size={20} color={isDark ? "#94a3b8" : "#666"} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Phone Number</Text>
                <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{profile?.phoneNumber || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        </View>

        {userType === 'provider' && (
          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Washer Details</Text>
            <View style={[styles.infoCard, isDark && styles.infoCardDark]}>
              <View style={styles.infoRow}>
                <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                  <Ionicons name="star" size={20} color={isDark ? "#94a3b8" : "#666"} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Rating</Text>
                  <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{(profile as any)?.rating || 'N/A'}</Text>
                </View>
              </View>
              <View style={[styles.divider, isDark && styles.dividerDark]} />
              <View style={styles.infoRow}>
                <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                  <Ionicons name="location" size={20} color={isDark ? "#94a3b8" : "#666"} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Area</Text>
                  <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{(profile as any)?.area || 'N/A'}</Text>
                </View>
              </View>
              <View style={[styles.divider, isDark && styles.dividerDark]} />
              <View style={styles.infoRow}>
                <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                  <Ionicons name="finger-print" size={20} color={isDark ? "#94a3b8" : "#666"} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Washer ID</Text>
                  <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{profile?.uid || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Personal Details</Text>

          <View style={[styles.infoCard, isDark && styles.infoCardDark]}>
            <View style={styles.infoRow}>
              <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                <Ionicons name="person-outline" size={20} color={isDark ? "#94a3b8" : "#666"} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>First Name</Text>
                <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{profile?.firstName || 'Not provided'}</Text>
              </View>
            </View>

            <View style={[styles.divider, isDark && styles.dividerDark]} />

            <View style={styles.infoRow}>
              <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                <Ionicons name="person-outline" size={20} color={isDark ? "#94a3b8" : "#666"} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, isDark && styles.infoLabelDark]}>Last Name</Text>
                <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{profile?.lastName || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Footer / Logout */}
      <View style={[styles.footer, isDark && styles.footerDark]}>
        <TouchableOpacity style={[styles.logoutButton, isDark && styles.logoutButtonDark]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#0d1629',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
  },
  editButtonDark: {
    backgroundColor: 'rgba(37,99,235,0.2)',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  editButtonTextDark: {
    color: '#60a5fa',
  },
  scrollContent: {
    paddingVertical: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  avatarContainerDark: {
    backgroundColor: '#1e2d4a',
    borderColor: '#0d1629',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  userNameDark: {
    color: '#FFF',
  },
  badge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDark: {
    backgroundColor: 'rgba(37,99,235,0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  pendingBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1,
  },
  pendingBadgeText: {
    color: '#D97706',
  },
  unverifiedBadge: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  unverifiedBadgeText: {
    color: '#EF4444',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleDark: {
    color: '#94a3b8',
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardDark: {
    backgroundColor: '#1e2d4a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowOpacity: 0.2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerDark: {
    backgroundColor: '#0d1629',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoLabelDark: {
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  infoValueDark: {
    color: '#FFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 72,
  },
  dividerDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerDark: {
    backgroundColor: '#0d1629',
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutButtonDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 8,
  },
});