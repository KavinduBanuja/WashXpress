import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, SafeAreaView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, Image, Alert,
  StyleSheet, Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Star, ChevronDown, ChevronUp, AlertCircle, Check } from 'lucide-react-native';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Trainee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  memberSince?: string;
  yearsExperience?: number;
  previousEmployer?: string;
  specializations?: string[];
  status: 'in_training' | 'certified';
  progress: { completedSessions: number; requiredSessions: number; isComplete: boolean };
  averageRating?: number;
  evaluations?: Evaluation[];
}

interface Evaluation {
  id: string;
  date: string;
  ratings: { technique: number; speed: number; customerService: number; safety: number };
  feedback: string;
}

interface FormState {
  bookingId: string;
  ratings: { technique: number | null; speed: number | null; customerService: number | null; safety: number | null };
  feedback: string;
  notes: string;
}

const RATING_CATEGORIES = [
  { key: 'technique', label: 'Technique', description: 'Quality of wash, attention to detail' },
  { key: 'speed', label: 'Speed', description: 'Efficiency, time management' },
  { key: 'customerService', label: 'Customer Service', description: 'Professionalism, communication' },
  { key: 'safety', label: 'Safety', description: 'Equipment handling, PPE usage' },
];

const AGREEMENT_POINTS = [
  'I will provide honest and constructive evaluations to help trainees improve',
  'I will complete all required evaluation sessions in a timely manner',
  "I understand that my feedback directly impacts a trainee's certification",
  'I will maintain professionalism and respect in all mentoring interactions',
  'I will report any serious concerns about a trainee to the admin team',
  'I agree that WashXpress may review my evaluations for quality assurance',
];

// ── Agreement Gate ─────────────────────────────────────────────────────────────
function AgreementGate({ onAccepted }: { onAccepted: () => void }) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleAccept = async () => {
    if (!checked) {
      Alert.alert('Agreement Required', 'Please check the box to confirm you agree to the terms.');
      return;
    }
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      await setDoc(
        doc(db, 'providers', user.uid),
        {
          isMentor: true,                    // ← add this
          mentorshipAgreement: {
            accepted: true,
            acceptedAt: serverTimestamp(),
            version: '1.0',
          },
        },
        { merge: true }
      );
      onAccepted();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save agreement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={ag.container}>
      <StatusBar style="light" />
      <View style={ag.header}>
        <TouchableOpacity onPress={() => router.back()} style={ag.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={ag.headerTitle}>Mentorship Program</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={ag.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Hero */}
          <View style={ag.hero}>
            <View style={ag.heroIconCircle}>
              <Text style={{ fontSize: 48 }}>🎓</Text>
            </View>
            <Text style={ag.heroTitle}>Become a Mentor</Text>
            <Text style={ag.heroSub}>
              Share your expertise with new washers and help build the next generation of WashXpress professionals.
            </Text>
          </View>

          {/* Benefits */}
          <View style={ag.card}>
            <Text style={ag.cardTitle}>Why become a mentor?</Text>
            {[
              { icon: '⭐', text: 'Earn extra recognition and mentor badges on your profile' },
              { icon: '💰', text: 'Priority job matching for active mentors' },
              { icon: '🏆', text: 'Exclusive mentor tier with higher earnings potential' },
              { icon: '🤝', text: 'Build your professional reputation in the community' },
            ].map((b, i) => (
              <View key={i} style={ag.benefitRow}>
                <Text style={{ fontSize: 20, width: 28 }}>{b.icon}</Text>
                <Text style={ag.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>

          {/* Agreement */}
          <View style={ag.card}>
            <Text style={ag.cardTitle}>Mentor Agreement</Text>
            <Text style={ag.cardSub}>By joining the program you agree to the following:</Text>
            {AGREEMENT_POINTS.map((point, i) => (
              <View key={i} style={ag.pointRow}>
                <View style={ag.pointDot}>
                  <Text style={ag.pointNum}>{i + 1}</Text>
                </View>
                <Text style={ag.pointText}>{point}</Text>
              </View>
            ))}
          </View>

          {/* Checkbox */}
          <TouchableOpacity style={ag.checkRow} onPress={() => setChecked(v => !v)} activeOpacity={0.8}>
            <View style={[ag.checkbox, checked && ag.checkboxChecked]}>
              {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={ag.checkLabel}>
              I have read and agree to the Mentorship Program terms and responsibilities
            </Text>
          </TouchableOpacity>

          {/* Accept button */}
          <TouchableOpacity
            style={[ag.acceptBtn, (!checked || submitting) && ag.acceptBtnDisabled]}
            onPress={handleAccept}
            disabled={submitting || !checked}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                <Text style={ag.acceptBtnText}>Join the Mentorship Program</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={ag.disclaimer}>You can leave the program at any time by contacting the admin team.</Text>
          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Detail Row ────────────────────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 1 }}>{label}</Text>
      <Text style={{ fontSize: 14, color: '#fff' }}>{value}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MentorshipScreen() {
  const [agreedToMentorship, setAgreedToMentorship] = useState<boolean | null>(null);
  const [checkingAgreement, setCheckingAgreement] = useState(true);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [expandedTraineeId, setExpandedTraineeId] = useState<string | null>(null);
  const [showFormForTraineeId, setShowFormForTraineeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState<Record<string, FormState>>({});
  const [completionModal, setCompletionModal] = useState({ visible: false, traineeName: '' });

  useEffect(() => { checkAgreement(); }, []);

  const checkAgreement = async () => {
    try {
      const user = auth.currentUser;
      if (!user) { setAgreedToMentorship(false); setCheckingAgreement(false); return; }
      const providerDoc = await getDoc(doc(db, 'providers', user.uid));
      const data = providerDoc.data();
      // Check either field — backwards compatible
      const accepted = data?.isMentor === true || data?.mentorshipAgreement?.accepted === true;
      setAgreedToMentorship(accepted);
    } catch {
      setAgreedToMentorship(false);
    } finally {
      setCheckingAgreement(false);
    }
  };

  const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken(true);
  };

  const fetchTrainees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_PROVIDER_API_URL}/certification/my-trainees`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to fetch trainees');
      const data = await res.json();
      setTrainees(data.data?.trainees || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (agreedToMentorship) fetchTrainees(); }, [agreedToMentorship]);

  const toggleExpanded = (id: string) => {
    if (expandedTraineeId === id) { setExpandedTraineeId(null); setShowFormForTraineeId(null); return; }
    setExpandedTraineeId(id);
    setShowFormForTraineeId(null);
    if (!formState[id]) {
      setFormState(prev => ({
        ...prev,
        [id]: { bookingId: '', ratings: { technique: null, speed: null, customerService: null, safety: null }, feedback: '', notes: '' },
      }));
    }
  };

  const updateFormState = (id: string, key: keyof FormState, val: any) =>
    setFormState(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }));

  const updateRating = (id: string, cat: string, val: number) =>
    setFormState(prev => ({ ...prev, [id]: { ...prev[id], ratings: { ...prev[id].ratings, [cat]: val } } }));

  const submitEvaluation = async (traineeId: string) => {
    try {
      setSubmitting(true);
      const form = formState[traineeId];
      const token = await getAuthToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_PROVIDER_API_URL}/certification/evaluate`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ traineeId, bookingId: form.bookingId || null, ratings: form.ratings, feedback: form.feedback, notes: form.notes }),
        }
      );
      if (!res.ok) { const d = await res.json(); setError(d.message || 'Submission failed'); return; }
      const data = await res.json();
      if (data.data?.progress?.isComplete) {
        const trainee = trainees.find(t => t.id === traineeId);
        setCompletionModal({ visible: true, traineeName: trainee?.name || 'Trainee' });
      }
      fetchTrainees();
      setShowFormForTraineeId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const renderStars = (id: string, cat: string, val: number | null) => (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity key={star} onPress={() => updateRating(id, cat, star)}>
          <Star size={28} color={val && val >= star ? '#FFB800' : '#374151'} fill={val && val >= star ? '#FFB800' : 'none'} />
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (checkingAgreement) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      </SafeAreaView>
    );
  }

  // ── Agreement gate ────────────────────────────────────────────────────────
  if (!agreedToMentorship) {
    return <AgreementGate onAccepted={() => setAgreedToMentorship(true)} />;
  }

  // ── Main screen ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Trainees</Text>
        <View style={s.countBadge}>
          <Text style={s.countBadgeTxt}>{trainees.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {error && (
            <View style={s.errorBanner}>
              <AlertCircle size={18} color="#fca5a5" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          {/* Mentor badge */}
          <View style={s.mentorBadge}>
            <Text style={{ fontSize: 28 }}>🎓</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.mentorBadgeTitle}>Active Mentor</Text>
              <Text style={s.mentorBadgeSub}>You are part of the WashXpress Mentorship Program</Text>
            </View>
            <View style={s.mentorDot} />
          </View>

          {trainees.length === 0 && (
            <View style={s.emptyCard}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>👤</Text>
              <Text style={s.emptyTitle}>No trainees assigned yet</Text>
              <Text style={s.emptySub}>The admin will assign trainees to you soon.</Text>
            </View>
          )}

          {trainees.map(trainee => {
            const isExpanded = expandedTraineeId === trainee.id;
            const showForm = showFormForTraineeId === trainee.id;
            const form = formState[trainee.id] || {
              bookingId: '', ratings: { technique: null, speed: null, customerService: null, safety: null }, feedback: '', notes: '',
            };
            const canSubmit = Object.values(form.ratings).every(r => r !== null) && form.feedback.trim().length >= 50;
            const pct = Math.round((trainee.progress.completedSessions / trainee.progress.requiredSessions) * 100);

            return (
              <TouchableOpacity key={trainee.id} onPress={() => toggleExpanded(trainee.id)} activeOpacity={0.8} style={s.traineeCard}>
                <View style={s.traineeTop}>
                  <View style={s.traineeLeft}>
                    {trainee.photo
                      ? <Image source={{ uri: trainee.photo }} style={s.avatar} />
                      : <View style={s.avatarFallback}><Text style={s.avatarInitials}>{getInitials(trainee.name)}</Text></View>
                    }
                    <View style={{ flex: 1 }}>
                      <Text style={s.traineeName}>{trainee.name}</Text>
                      <Text style={s.traineeEmail}>{trainee.email}</Text>
                    </View>
                  </View>
                  {isExpanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <View style={[s.statusPill, trainee.status === 'certified' ? s.statusCert : s.statusTrain]}>
                    <Text style={[s.statusTxt, { color: trainee.status === 'certified' ? '#4ade80' : '#fbbf24' }]}>
                      {trainee.status === 'certified' ? '✓ Certified' : 'In Training'}
                    </Text>
                  </View>
                  {trainee.averageRating !== undefined && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Star size={13} color="#FFB800" fill="#FFB800" />
                      <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>{trainee.averageRating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>

                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>{trainee.progress.completedSessions}/{trainee.progress.requiredSessions} sessions</Text>
                  <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${pct}%` as any }]} />
                  </View>
                </View>

                {isExpanded && (
                  <View style={s.expandedWrap}>
                    <Text style={s.sectionLbl}>Profile</Text>
                    {trainee.phone && <DetailRow label="Phone" value={trainee.phone} />}
                    {trainee.memberSince && <DetailRow label="Member Since" value={new Date(trainee.memberSince).toLocaleDateString()} />}
                    {trainee.yearsExperience !== undefined && <DetailRow label="Experience" value={`${trainee.yearsExperience} years`} />}
                    {trainee.previousEmployer && <DetailRow label="Previous Employer" value={trainee.previousEmployer} />}

                    <Text style={[s.sectionLbl, { marginTop: 16 }]}>Past Evaluations</Text>
                    {trainee.evaluations && trainee.evaluations.length > 0 ? trainee.evaluations.map((ev, idx) => {
                      const avg = Math.round((ev.ratings.technique + ev.ratings.speed + ev.ratings.customerService + ev.ratings.safety) / 4);
                      return (
                        <View key={idx} style={s.evalCard}>
                          <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{new Date(ev.date).toLocaleDateString()}</Text>
                          <View style={{ flexDirection: 'row', gap: 3, marginBottom: 6 }}>
                            {[1, 2, 3, 4, 5].map(st => <Star key={st} size={13} color={st <= avg ? '#FFB800' : '#374151'} fill={st <= avg ? '#FFB800' : 'none'} />)}
                          </View>
                          <Text style={{ fontSize: 13, color: '#94a3b8', lineHeight: 18 }}>{ev.feedback}</Text>
                        </View>
                      );
                    }) : <Text style={{ fontSize: 13, color: '#64748b' }}>No evaluations yet</Text>}

                    {trainee.progress.isComplete ? (
                      <View style={s.completedBanner}>
                        <Check size={16} color="#4ade80" />
                        <Text style={s.completedTxt}>All sessions completed</Text>
                      </View>
                    ) : (
                      <TouchableOpacity style={s.evalBtn} onPress={() => setShowFormForTraineeId(showForm ? null : trainee.id)}>
                        <Text style={s.evalBtnTxt}>{showForm ? 'Hide Form' : 'Submit Evaluation'}</Text>
                      </TouchableOpacity>
                    )}

                    {showForm && !trainee.progress.isComplete && (
                      <View style={s.formWrap}>
                        <TextInput
                          placeholder="Booking ID (optional)"
                          placeholderTextColor="#64748b"
                          value={form.bookingId}
                          onChangeText={t => updateFormState(trainee.id, 'bookingId', t)}
                          style={s.input}
                        />
                        {RATING_CATEGORIES.map(cat => (
                          <View key={cat.key} style={{ marginBottom: 16 }}>
                            <Text style={s.catLabel}>{cat.label}</Text>
                            <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{cat.description}</Text>
                            {renderStars(trainee.id, cat.key, form.ratings[cat.key as keyof typeof form.ratings])}
                          </View>
                        ))}
                        <TextInput
                          placeholder="Overall feedback (min 50 chars)..."
                          placeholderTextColor="#64748b"
                          multiline
                          numberOfLines={4}
                          value={form.feedback}
                          onChangeText={t => updateFormState(trainee.id, 'feedback', t)}
                          style={[s.input, { minHeight: 100, textAlignVertical: 'top' }]}
                        />
                        <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'right', marginBottom: 8 }}>{form.feedback.length}/50 minimum</Text>
                        <TextInput
                          placeholder="Private notes (not shown to trainee)..."
                          placeholderTextColor="#64748b"
                          multiline
                          numberOfLines={3}
                          value={form.notes}
                          onChangeText={t => updateFormState(trainee.id, 'notes', t)}
                          style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
                        />
                        <TouchableOpacity
                          style={[s.submitBtn, (!canSubmit || submitting) && s.submitBtnDisabled]}
                          onPress={() => submitEvaluation(trainee.id)}
                          disabled={!canSubmit || submitting}
                        >
                          {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
                            <><Check size={16} color="#fff" /><Text style={s.submitBtnTxt}>Submit Evaluation</Text></>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 48 }} />
        </ScrollView>
      )}

      <Modal visible={completionModal.visible} transparent animationType="fade" onRequestClose={() => setCompletionModal(m => ({ ...m, visible: false }))}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={{ fontSize: 48, textAlign: 'center' }}>🎉</Text>
            <Text style={s.modalTitle}>{completionModal.traineeName} completed all sessions!</Text>
            <Text style={s.modalSub}>The admin team will review their certification.</Text>
            <TouchableOpacity style={s.modalBtn} onPress={() => setCompletionModal(m => ({ ...m, visible: false }))}>
              <Text style={s.modalBtnTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const ag = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1629' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: '#1e2d4a', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { padding: 20 },
  hero: { alignItems: 'center', paddingVertical: 32, marginBottom: 24 },
  heroIconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(37,99,235,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 10 },
  heroSub: { fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 },
  card: { backgroundColor: '#1e2d4a', borderRadius: 18, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 14 },
  cardSub: { fontSize: 13, color: '#64748b', marginBottom: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  benefitText: { flex: 1, fontSize: 14, color: '#94a3b8', lineHeight: 20 },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  pointDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(37,99,235,0.3)', justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  pointNum: { fontSize: 11, fontWeight: '700', color: '#60a5fa' },
  pointText: { flex: 1, fontSize: 13, color: '#94a3b8', lineHeight: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24, padding: 16, backgroundColor: '#1e2d4a', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(37,99,235,0.3)' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#2563eb', justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  checkboxChecked: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkLabel: { flex: 1, fontSize: 14, color: '#fff', lineHeight: 20 },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 18, marginBottom: 14 },
  acceptBtnDisabled: { opacity: 0.5 },
  acceptBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  disclaimer: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 18 },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d1629' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: '#1e2d4a', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  countBadge: { backgroundColor: '#2563eb', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, minWidth: 28, alignItems: 'center' },
  countBadgeTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 48 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorText: { flex: 1, fontSize: 13, color: '#fca5a5' },
  mentorBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(37,99,235,0.12)', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(37,99,235,0.25)' },
  mentorBadgeTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  mentorBadgeSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  mentorDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
  emptyCard: { backgroundColor: '#1e2d4a', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#94a3b8', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  traineeCard: { backgroundColor: '#1e2d4a', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  traineeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  traineeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 16, fontWeight: '700', color: '#fff' },
  traineeName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  traineeEmail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusCert: { backgroundColor: 'rgba(74,222,128,0.1)' },
  statusTrain: { backgroundColor: 'rgba(251,191,36,0.1)' },
  statusTxt: { fontSize: 12, fontWeight: '600' },
  progressBg: { height: 6, backgroundColor: '#0d1629', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 4 },
  expandedWrap: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  sectionLbl: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 10 },
  evalCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  completedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', marginTop: 14 },
  completedTxt: { fontSize: 13, fontWeight: '600', color: '#4ade80' },
  evalBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  evalBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  formWrap: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  input: { backgroundColor: '#0d1629', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
  catLabel: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: '#1e2d4a', borderRadius: 20, padding: 28, alignItems: 'center', gap: 12, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  modalSub: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  modalBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  modalBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});