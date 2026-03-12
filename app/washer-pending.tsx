import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiFetch } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

interface CertificationProgress {
  type: 'field_certification' | 'training_center' | 'experience_review';
  // Field certification
  completed?: number;
  required?: number;
  percentage?: number;
  evaluations?: Array<{
    id: string;
    status: 'passed' | 'failed' | 'pending';
    mentorName?: string;
    date?: string;
    notes?: string;
  }>;
  // Training center
  centerName?: string;
  status?: string;
  expectedCompletion?: string;
}

interface ProviderProfile {
  displayName: string;
  email: string;
  isVerified: boolean;
  isActive: boolean;
  certificationStatus: string;
  certificationPath: string | null;
  washerStatus: string;
  certificationProgress?: CertificationProgress;
}

const STATUS_LABELS: Record<string, string> = {
  pending_certification: 'Under Review',
  in_training: 'In Training',
  certified: 'Certified',
  rejected: 'Not Approved',
  uncertified: 'Pending',
};

const STATUS_COLORS: Record<string, string> = {
  pending_certification: '#f59e0b',
  in_training: '#2563eb',
  certified: '#16a34a',
  rejected: '#dc2626',
  uncertified: '#6b7280',
};

export default function WasherPendingScreen() {
  const { logout, user } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pulse animation for pending indicators
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadProfile();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Poll every 30s — if they get verified, auto-navigate to washer-home
    const interval = setInterval(async () => {
      const updated = await fetchProfile();
      if (updated?.isVerified) {
        clearInterval(interval);
        router.replace('/washer-home');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchProfile = async (): Promise<ProviderProfile | null> => {
    try {
      const data = await apiFetch('/auth/washer/profile', {}, 'provider');
      if (data.success) {
        const p: ProviderProfile = {
          ...data.provider,
          certificationProgress: data.certificationProgress,
        };
        setProfile(p);
        return p;
      }
    } catch (error: any) {
      console.error('Fetch profile error:', error);
      if (error.message === 'Route not found') {
        Alert.alert('Configuration Error', 'The profile endpoint was not found. Please refresh the app or contact support.');
      }
    }
    return null;
  };

  const loadProfile = async () => {
    setLoading(true);
    await fetchProfile();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const updated = await fetchProfile();
    setRefreshing(false);
    if (updated?.isVerified) {
      router.replace('/washer-home');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  const certStatus = profile?.certificationStatus || 'pending_certification';
  const certPath = profile?.certificationPath;
  const progress = profile?.certificationProgress;

  const statusColor = STATUS_COLORS[certStatus] || '#6b7280';
  const statusLabel = STATUS_LABELS[certStatus] || 'Pending';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoMark}>
            <Ionicons name="water" size={28} color="#2563eb" />
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#6b7280" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headerGreeting}>Hi, {profile?.displayName?.split(' ')[0] || 'Washer'} 👋</Text>
        <Text style={styles.headerSubtitle}>Your application is being processed</Text>

        {/* Status pill */}
        <View style={[styles.statusPill, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* ── FIELD CERTIFICATION PATH ── */}
      {certPath === 'field_certification' && progress && (
        <>
          {/* Progress Ring Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressCardHeader}>
              <View style={styles.progressIconWrapper}>
                <Ionicons name="people" size={22} color="#2563eb" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.progressCardTitle}>Field Certification</Text>
                <Text style={styles.progressCardSubtitle}>Mentored on-the-job evaluations</Text>
              </View>
            </View>

            {/* Big progress display */}
            <View style={styles.bigProgressRow}>
              <View style={styles.bigProgressCircle}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Text style={styles.bigProgressNumber}>{progress.completed ?? 0}</Text>
                </Animated.View>
                <Text style={styles.bigProgressDivider}>of {progress.required ?? 6}</Text>
              </View>

              <View style={styles.progressMeta}>
                <Text style={styles.progressMetaLabel}>Evaluations completed</Text>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progress.percentage ?? 0}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressMetaPercent}>{progress.percentage ?? 0}% complete</Text>
              </View>
            </View>

            {/* Steps */}
            <View style={styles.stepsContainer}>
              {Array.from({ length: progress.required ?? 6 }).map((_, i) => {
                const evaluation = progress.evaluations?.[i];
                const isDone = i < (progress.completed ?? 0);
                const isCurrent = i === (progress.completed ?? 0);

                return (
                  <View key={i} style={styles.stepRow}>
                    <View style={[
                      styles.stepCircle,
                      isDone && styles.stepCircleDone,
                      isCurrent && styles.stepCircleCurrent,
                    ]}>
                      {isDone
                        ? <Ionicons name="checkmark" size={14} color="#fff" />
                        : <Text style={[styles.stepNumber, isCurrent && styles.stepNumberCurrent]}>{i + 1}</Text>
                      }
                    </View>

                    <View style={styles.stepContent}>
                      <Text style={[styles.stepTitle, isDone && styles.stepTitleDone]}>
                        Evaluation {i + 1}
                        {isCurrent && <Text style={styles.stepCurrentBadge}> ← Next</Text>}
                      </Text>
                      {evaluation && (
                        <Text style={styles.stepMeta}>
                          {evaluation.mentorName && `Mentor: ${evaluation.mentorName}`}
                          {evaluation.date && ` · ${evaluation.date}`}
                        </Text>
                      )}
                      {!evaluation && !isDone && (
                        <Text style={styles.stepMeta}>
                          {isCurrent ? 'Awaiting mentor assignment' : 'Upcoming'}
                        </Text>
                      )}
                    </View>

                    {isDone && (
                      <View style={styles.stepPassedBadge}>
                        <Text style={styles.stepPassedText}>Passed</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {(progress.completed ?? 0) === 0 && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color="#2563eb" />
                <Text style={styles.infoBoxText}>
                  A mentor will be assigned to you shortly. They'll accompany you on your first wash jobs and evaluate your technique.
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* ── TRAINING CENTER PATH ── */}
      {certPath === 'training_center' && (
        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <View style={styles.progressIconWrapper}>
              <Ionicons name="school" size={22} color="#7c3aed" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.progressCardTitle}>Training Center</Text>
              <Text style={styles.progressCardSubtitle}>Structured classroom program</Text>
            </View>
          </View>

          {/* Training stages */}
          {[
            {
              icon: 'mail-outline' as const,
              title: 'Application Received',
              desc: 'Your registration has been submitted',
              done: true,
            },
            {
              icon: 'business-outline' as const,
              title: 'Training Center Assignment',
              desc: progress?.centerName
                ? `Assigned to ${progress.centerName}`
                : 'Admin is assigning you to a center',
              done: !!progress?.centerName,
              active: !progress?.centerName,
            },
            {
              icon: 'book-outline' as const,
              title: 'Training Program',
              desc: progress?.expectedCompletion
                ? `Expected completion: ${progress.expectedCompletion}`
                : 'Complete the curriculum and practical sessions',
              done: ['completed', 'certified'].includes(progress?.status ?? ''),
              active: progress?.status === 'in_progress',
            },
            {
              icon: 'ribbon-outline' as const,
              title: 'Final Evaluation',
              desc: 'Pass the certification exam to become verified',
              done: certStatus === 'certified',
            },
          ].map((stage, i) => (
            <View key={i} style={styles.trainingStageRow}>
              <View style={[
                styles.trainingStageIcon,
                stage.done && styles.trainingStageIconDone,
                stage.active && styles.trainingStageIconActive,
              ]}>
                {stage.done
                  ? <Ionicons name="checkmark" size={18} color="#fff" />
                  : <Ionicons name={stage.icon} size={18} color={stage.active ? '#fff' : '#9ca3af'} />
                }
              </View>

              {i < 3 && (
                <View style={[styles.trainingConnector, stage.done && styles.trainingConnectorDone]} />
              )}

              <View style={styles.trainingStageContent}>
                <Text style={[styles.trainingStageTitle, stage.done && styles.trainingStageTitleDone]}>
                  {stage.title}
                </Text>
                <Text style={styles.trainingStageDesc}>{stage.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── EXPERIENCE REVIEW PATH ── */}
      {(certPath === null || !certPath) && certStatus === 'pending_certification' && (
        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <View style={[styles.progressIconWrapper, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="briefcase" size={22} color="#16a34a" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.progressCardTitle}>Experience Review</Text>
              <Text style={styles.progressCardSubtitle}>Admin verification of your background</Text>
            </View>
          </View>

          {[
            { title: 'Application Submitted', desc: 'Your experience details have been received', done: true },
            { title: 'Background Verification', desc: 'Admin is verifying your professional history', done: false, active: true },
            { title: 'Skills Assessment', desc: 'A quick practical evaluation may be scheduled', done: false },
            { title: 'Account Activation', desc: 'Get verified and start accepting jobs', done: false },
          ].map((stage, i) => (
            <View key={i} style={[styles.reviewStageRow, i < 3 && { marginBottom: 0 }]}>
              <View style={[
                styles.reviewDot,
                stage.done && styles.reviewDotDone,
                stage.active && styles.reviewDotActive,
              ]}>
                {stage.done
                  ? <Ionicons name="checkmark" size={12} color="#fff" />
                  : stage.active
                  ? <Animated.View style={[styles.reviewDotPulse, { transform: [{ scale: pulseAnim }] }]} />
                  : null
                }
              </View>
              <View style={styles.reviewStageContent}>
                <Text style={[styles.reviewStageTitle, stage.done && styles.reviewStageTitleDone]}>
                  {stage.title}
                </Text>
                <Text style={styles.reviewStageDesc}>{stage.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* What to expect card */}
      <View style={styles.expectCard}>
        <Text style={styles.expectTitle}>What happens next?</Text>
        {[
          { icon: 'notifications-outline' as const, text: 'You\'ll receive an email and app notification when your status changes' },
          { icon: 'refresh-outline' as const, text: 'Pull down to refresh this screen and check for updates' },
          { icon: 'help-circle-outline' as const, text: 'Contact support at support@washxpress.lk for any questions' },
        ].map(({ icon, text }, i) => (
          <View key={i} style={styles.expectRow}>
            <View style={styles.expectIconWrapper}>
              <Ionicons name={icon} size={18} color="#2563eb" />
            </View>
            <Text style={styles.expectText}>{text}</Text>
          </View>
        ))}
      </View>

      {/* Refresh hint */}
      <View style={styles.refreshHint}>
        <Ionicons name="sync-outline" size={14} color="#9ca3af" />
        <Text style={styles.refreshHintText}>Pull down to check for updates · Auto-checks every 30s</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 40 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6b7280' },

  // Header
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoMark: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center',
  },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  logoutText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  headerGreeting: { fontSize: 26, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: '#6b7280', marginBottom: 16 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusPillText: { fontSize: 13, fontWeight: '700' },

  // Progress card (shared)
  progressCard: {
    backgroundColor: '#fff', marginHorizontal: 20, marginTop: 20,
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  progressCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  progressIconWrapper: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center',
  },
  progressCardTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  progressCardSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  // Field cert — big progress
  bigProgressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 20 },
  bigProgressCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#eff6ff', borderWidth: 3, borderColor: '#2563eb',
    justifyContent: 'center', alignItems: 'center',
  },
  bigProgressNumber: { fontSize: 30, fontWeight: '900', color: '#2563eb', lineHeight: 36 },
  bigProgressDivider: { fontSize: 13, color: '#6b7280' },
  progressMeta: { flex: 1 },
  progressMetaLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  progressBarTrack: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 4 },
  progressMetaPercent: { fontSize: 13, color: '#6b7280', marginTop: 6 },

  // Field cert — steps
  stepsContainer: { gap: 0 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#e2e8f0',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  stepCircleDone: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  stepCircleCurrent: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  stepNumber: { fontSize: 13, fontWeight: '700', color: '#9ca3af' },
  stepNumberCurrent: { color: '#2563eb' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },
  stepTitleDone: { color: '#16a34a' },
  stepCurrentBadge: { color: '#2563eb', fontWeight: '700' },
  stepMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  stepPassedBadge: {
    backgroundColor: '#f0fdf4', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  stepPassedText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },

  // Training center stages
  trainingStageRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  trainingStageIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center',
    marginRight: 14, flexShrink: 0,
  },
  trainingStageIconDone: { backgroundColor: '#16a34a' },
  trainingStageIconActive: { backgroundColor: '#2563eb' },
  trainingConnector: {
    position: 'absolute', left: 19, top: 40,
    width: 2, height: 28, backgroundColor: '#e2e8f0',
  },
  trainingConnectorDone: { backgroundColor: '#16a34a' },
  trainingStageContent: { flex: 1, paddingTop: 4 },
  trainingStageTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  trainingStageTitleDone: { color: '#16a34a' },
  trainingStageDesc: { fontSize: 13, color: '#6b7280', marginTop: 3, lineHeight: 18 },

  // Experience review stages
  reviewStageRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  reviewDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center',
    marginRight: 14, flexShrink: 0,
  },
  reviewDotDone: { backgroundColor: '#16a34a' },
  reviewDotActive: { backgroundColor: '#2563eb' },
  reviewDotPulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  reviewStageContent: { flex: 1, paddingTop: 2 },
  reviewStageTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },
  reviewStageTitleDone: { color: '#16a34a' },
  reviewStageDesc: { fontSize: 13, color: '#6b7280', marginTop: 2, lineHeight: 18 },

  // Info box
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#eff6ff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#bfdbfe', marginTop: 16,
  },
  infoBoxText: { flex: 1, fontSize: 13, color: '#1d4ed8', lineHeight: 18 },

  // What to expect
  expectCard: {
    backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16,
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  expectTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  expectRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  expectIconWrapper: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  expectText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20, paddingTop: 8 },

  // Refresh hint
  refreshHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 20, paddingHorizontal: 24,
  },
  refreshHintText: { fontSize: 12, color: '#9ca3af' },
});