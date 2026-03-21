import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { signin, getProfileFromFirebase, updateProfileInFirebase } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { auth as firebaseAuth } from '../firebaseConfig';
import SubscriptionAgreementModal from '../components/SubscriptionAgreementModal';

export default function LoginScreen() {
  const [selectedRole, setSelectedRole] = useState<'customer' | 'provider'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  const { setAuth, logout } = useAuth();
  const { colors, isDark } = useTheme();

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const result = await signin(email, password, selectedRole);

      if (result.token) {
        await setAuth(result.token, selectedRole, result.user);
      }

      // Check email verification
      const currentUser = firebaseAuth.currentUser;
      if (currentUser && !currentUser.emailVerified) {
        Alert.alert(
          'Verify Your Email 📧',
          'A verification email has been sent to your inbox. Please verify to access all features.',
          [
            {
              text: 'Resend Email',
              onPress: async () => {
                try {
                  await sendEmailVerification(currentUser);
                  Alert.alert('Sent ✅', 'Check your inbox and spam folder.');
                } catch (e: any) {
                  if (e.code === 'auth/too-many-requests') {
                    Alert.alert('Already Sent', 'Please check your inbox. Wait a few minutes before requesting another.');
                  } else {
                    Alert.alert('Error', e.message || 'Failed to resend.');
                  }
                }
              },
            },
            { text: 'Continue Anyway', onPress: () => proceedAfterLogin(result) },
          ]
        );
        setLoading(false);
        return;
      }

      await proceedAfterLogin(result);
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // ── Proceed after login ───────────────────────────────────────────────────
  const proceedAfterLogin = async (result: any) => {
    if (result.user?.uid) {
      try {
        const profile = await getProfileFromFirebase(result.user.uid, selectedRole);
        if (profile?.agreement) {
          router.replace((selectedRole === 'customer' ? '/customer-home' : '/washer-home') as any);
          return;
        }
      } catch (e) {
        console.warn('Could not fetch agreement status, falling back to prompt.', e);
      }
    }
    setShowAgreement(true);
  };

  // ── Agreement ─────────────────────────────────────────────────────────────
  const handleAgreeAndContinue = async () => {
    setShowAgreement(false);
    try {
      const userStr = await SecureStore.getItemAsync(selectedRole);
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.uid) await updateProfileInFirebase(u.uid, selectedRole, { agreement: true });
      }
    } catch (e) {
      console.error('Failed to save agreement:', e);
    }
    router.replace((selectedRole === 'customer' ? '/customer-home' : '/washer-home') as any);
  };

  const handleCancelAgreement = async () => {
    setShowAgreement(false);
    try { await logout(); } catch (e) { console.error('Logout failed', e); }
  };

  // ── Forgot Password ───────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, resetEmail.trim());
      Alert.alert(
        'Email Sent ✅',
        `A password reset link has been sent to ${resetEmail}. Check your inbox and spam folder.`,
        [{ text: 'OK', onPress: () => { setShowForgotPassword(false); setResetEmail(''); } }]
      );
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        Alert.alert('Not Found', 'No account found with this email address.');
      } else if (e.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else if (e.code === 'auth/too-many-requests') {
        Alert.alert('Too Many Requests', 'Please wait before requesting another reset email.');
      } else {
        Alert.alert('Error', e.message || 'Failed to send reset email.');
      }
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={[styles.logoCircle, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="water" size={36} color="#fff" />
            </View>
            <Text style={styles.title}>WashXpress</Text>
            <Text style={styles.subtitle}>Premium Car Care On Demand</Text>
          </View>

          {/* ── Login Card ── */}
          <View style={[styles.loginCard, { backgroundColor: colors.cardBackground }]}>

            {/* Role Toggle */}
            <View style={styles.roleSection}>
              <Text style={[styles.roleLabel, { color: colors.textSecondary }]}>Login as</Text>
              <View style={[styles.roleToggle, { backgroundColor: isDark ? colors.background : '#f3f4f6' }]}>
                {(['customer', 'provider'] as const).map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleButton,
                      selectedRole === role && [styles.roleButtonActive, { backgroundColor: colors.cardBackground }],
                    ]}
                    onPress={() => setSelectedRole(role)}
                  >
                    <Ionicons
                      name={role === 'customer' ? 'person' : 'briefcase'}
                      size={18}
                      color={selectedRole === role ? colors.accent : colors.textSecondary}
                    />
                    <Text style={[
                      styles.roleButtonText,
                      { color: colors.textSecondary },
                      selectedRole === role && [styles.roleButtonTextActive, { color: colors.accent }],
                    ]}>
                      {role === 'customer' ? 'Customer' : 'Provider'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Email Address</Text>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.background : '#f9fafb' }]}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Password</Text>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.background : '#f9fafb' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => { setResetEmail(email); setShowForgotPassword(true); }}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.accent }]}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.accent }, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginButtonText}>Login</Text>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>new to WashXpress?</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, { borderColor: colors.accent }]}
              onPress={() => router.push((selectedRole === 'provider' ? '/washer-signup' : '/signup') as any)}
            >
              <Ionicons name="person-add-outline" size={18} color={colors.accent} />
              <Text style={[styles.signUpButtonText, { color: colors.accent }]}>
                Create {selectedRole === 'provider' ? 'Washer' : 'Customer'} Account
              </Text>
            </TouchableOpacity>

          </View>

          {/* Role Info */}
          <View style={[styles.roleInfo, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1 }]}>
            <Ionicons
              name={selectedRole === 'customer' ? 'information-circle-outline' : 'shield-checkmark-outline'}
              size={16}
              color="rgba(255,255,255,0.5)"
            />
            <Text style={styles.roleInfoText}>
              {selectedRole === 'customer'
                ? 'Book washes, manage subscriptions, and track your service history'
                : 'Manage appointments, view customer requests, and track earnings'
              }
            </Text>
          </View>

        </ScrollView>
      </View>

      {/* ── Forgot Password Modal ── */}
      <Modal
        visible={showForgotPassword}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.cardBackground }]}>

            <View style={styles.modalHeader}>
              <View style={[styles.modalIconCircle, { backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff' }]}>
                <Ionicons name="lock-open-outline" size={28} color={colors.accent} />
              </View>
              <TouchableOpacity
                onPress={() => { setShowForgotPassword(false); setResetEmail(''); }}
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }]}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Reset Password</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.background : '#f9fafb', marginBottom: 20 }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.accent }, sendingReset && { opacity: 0.6 }]}
              onPress={handleForgotPassword}
              disabled={sendingReset}
            >
              {sendingReset
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                    <Text style={[styles.loginButtonText, { marginLeft: 8 }]}>Send Reset Email</Text>
                  </>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => { setShowForgotPassword(false); setResetEmail(''); }}
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* ── Agreement Modal ── */}
      <SubscriptionAgreementModal
        visible={showAgreement}
        onAgree={handleAgreeAndContinue}
        onCancel={handleCancelAgreement}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1 },
  scrollContent:        { paddingBottom: 48 },

  header:               { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 36, alignItems: 'center' },
  logoCircle:           { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title:                { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 6, letterSpacing: -0.5 },
  subtitle:             { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  loginCard:            { marginHorizontal: 20, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 },

  roleSection:          { marginBottom: 24 },
  roleLabel:            { fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  roleToggle:           { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  roleButton:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 10, gap: 6 },
  roleButtonActive:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  roleButtonText:       { fontSize: 14, fontWeight: '600' },
  roleButtonTextActive: { },

  inputGroup:           { marginBottom: 14 },
  label:                { fontSize: 13, fontWeight: '600', marginBottom: 7 },
  inputContainer:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14 },
  inputIcon:            { marginRight: 10 },
  input:                { flex: 1, paddingVertical: 13, fontSize: 15 },
  eyeIcon:              { padding: 6 },

  forgotPassword:       { alignSelf: 'flex-end', marginBottom: 20, marginTop: 2 },
  forgotPasswordText:   { fontSize: 13, fontWeight: '600' },

  loginButton:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 12, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  loginButtonDisabled:  { opacity: 0.6 },
  loginButtonText:      { color: '#fff', fontSize: 16, fontWeight: '700' },

  divider:              { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine:          { flex: 1, height: 1 },
  dividerText:          { marginHorizontal: 12, fontSize: 13 },

  signUpButton:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  signUpButtonText:     { fontSize: 15, fontWeight: '700' },

  signUpContainer:      { flexDirection: 'row', justifyContent: 'center' },
  signUpText:           { fontSize: 14 },
  signUpLink:           { fontSize: 14, fontWeight: '600' },

  roleInfo:             { marginHorizontal: 20, marginTop: 20, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleInfoText:         { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 18 },
  roleInfoBold:         { fontWeight: 'bold' },

  modalOverlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox:             { width: '100%', borderRadius: 24, padding: 24 },
  modalHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalIconCircle:      { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modalCloseBtn:        { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  modalTitle:           { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  modalSub:             { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  modalCancelBtn:       { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  modalCancelText:      { fontSize: 14, fontWeight: '600' },
});