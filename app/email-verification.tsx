// app/email-verification.tsx
// Used by both customer and washer signup flows
// Reads params: email, userType ('customer' | 'provider'), nextRoute

import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, Animated, KeyboardAvoidingView,
    Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { auth } from '../firebaseConfig';

const CUSTOMER_API = process.env.EXPO_PUBLIC_CUSTOMER_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL || '';
const PROVIDER_API = process.env.EXPO_PUBLIC_PROVIDER_API_URL || '';

export default function EmailVerificationScreen() {
    const { colors, isDark } = useTheme();
    const { email, userType, nextRoute } = useLocalSearchParams<{
        email: string;
        userType: 'customer' | 'provider';
        nextRoute: string;
    }>();

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [verified, setVerified] = useState(false);

    const inputs = useRef<(TextInput | null)[]>([]);
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const successScale = useRef(new Animated.Value(0)).current;

    const BASE_URL = userType === 'provider' ? PROVIDER_API : CUSTOMER_API;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        ]).start();
        startCountdown();
    }, []);

    const startCountdown = () => {
        setCountdown(60);
        setCanResend(false);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const getToken = async () => {
        const user = auth.currentUser;
        if (!user) return null;
        return user.getIdToken(true);
    };

    const handleInput = (val: string, index: number) => {
        if (val.length > 1) {
            // Handle paste
            const digits = val.replace(/\D/g, '').slice(0, 6).split('');
            const newCode = [...code];
            digits.forEach((d, i) => { if (index + i < 6) newCode[index + i] = d; });
            setCode(newCode);
            const nextIndex = Math.min(index + digits.length, 5);
            inputs.current[nextIndex]?.focus();
            return;
        }

        const newCode = [...code];
        newCode[index] = val.replace(/\D/g, '');
        setCode(newCode);

        if (val && index < 5) inputs.current[index + 1]?.focus();
        if (!val && index > 0) inputs.current[index - 1]?.focus();
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const fullCode = code.join('');
        if (fullCode.length < 6) {
            Alert.alert('Incomplete', 'Please enter the 6-digit code.');
            return;
        }

        setVerifying(true);
        try {
            const token = await getToken();
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${BASE_URL}/auth/verify-email`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ email, code: fullCode }),
            });

            const data = await res.json();

            if (data.success) {
                setVerified(true);
                Animated.spring(successScale, {
                    toValue: 1, useNativeDriver: true, tension: 50, friction: 6,
                }).start();

                setTimeout(() => {
                    router.replace((nextRoute || (userType === 'customer' ? '/customer-home' : '/login')) as any);
                }, 1800);
            } else {
                Alert.alert('Invalid Code', data.message || 'The code you entered is incorrect. Please try again.');
                setCode(['', '', '', '', '', '']);
                inputs.current[0]?.focus();
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Verification failed. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setResending(true);
        try {
            const token = await getToken();
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${BASE_URL}/auth/send-verification-email`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (data.success) {
                startCountdown();
                setCode(['', '', '', '', '', '']);
                inputs.current[0]?.focus();
                Alert.alert('Code Sent', `A new verification code has been sent to ${email}`);
            } else {
                Alert.alert('Error', data.message || 'Failed to resend code.');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to resend code.');
        } finally {
            setResending(false);
        }
    };

    const handleSkip = () => {
        Alert.alert(
            'Skip Verification?',
            'You can verify your email later from your profile. Some features may be limited until verified.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Skip for Now',
                    onPress: () => router.replace(
                        (nextRoute || (userType === 'customer' ? '/customer-home' : '/washer-home')) as any
                    ),
                },
            ]
        );
    };

    // ── Success state ─────────────────────────────────────────────────────
    if (verified) {
        return (
            <View style={[s.container, { backgroundColor: colors.background }]}>
                <View style={s.successWrap}>
                    <Animated.View style={[s.successCircle, { transform: [{ scale: successScale }] }]}>
                        <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
                    </Animated.View>
                    <Text style={[s.successTitle, { color: colors.textPrimary }]}>Email Verified!</Text>
                    <Text style={[s.successSub, { color: colors.textSecondary }]}>
                        Your email has been successfully verified.
                    </Text>
                    <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[s.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={[s.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Verify Email</Text>
                <TouchableOpacity onPress={handleSkip} style={s.skipBtn}>
                    <Text style={[s.skipTxt, { color: colors.textSecondary }]}>Skip</Text>
                </TouchableOpacity>
            </View>

            <Animated.ScrollView
                contentContainerStyle={s.scroll}
                showsVerticalScrollIndicator={false}
                style={{ opacity: fadeAnim }}
                keyboardShouldPersistTaps="handled"
            >
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    {/* Icon */}
                    <View style={[s.iconCircle, { backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff' }]}>
                        <Ionicons name="mail" size={48} color={colors.accent} />
                    </View>

                    {/* Title */}
                    <Text style={[s.title, { color: colors.textPrimary }]}>Check your inbox</Text>
                    <Text style={[s.subtitle, { color: colors.textSecondary }]}>
                        We sent a 6-digit verification code to
                    </Text>
                    <Text style={[s.emailText, { color: colors.accent }]}>{email}</Text>

                    {/* OTP inputs */}
                    <View style={s.otpRow}>
                        {code.map((digit, i) => (
                            <TextInput
                                key={i}
                                ref={ref => { inputs.current[i] = ref; }}
                                style={[
                                    s.otpInput,
                                    {
                                        backgroundColor: colors.cardBackground,
                                        borderColor: digit ? colors.accent : colors.divider,
                                        color: colors.textPrimary,
                                    },
                                    digit && s.otpInputFilled,
                                ]}
                                value={digit}
                                onChangeText={val => handleInput(val, i)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                                keyboardType="number-pad"
                                maxLength={6}
                                textAlign="center"
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    {/* Verify button */}
                    <TouchableOpacity
                        style={[
                            s.verifyBtn,
                            { backgroundColor: colors.accent },
                            (verifying || code.join('').length < 6) && { opacity: 0.6 },
                        ]}
                        onPress={handleVerify}
                        disabled={verifying || code.join('').length < 6}
                    >
                        {verifying
                            ? <ActivityIndicator color="#fff" />
                            : <><Ionicons name="shield-checkmark-outline" size={20} color="#fff" /><Text style={s.verifyBtnTxt}>Verify Email</Text></>
                        }
                    </TouchableOpacity>

                    {/* Resend */}
                    <View style={s.resendRow}>
                        <Text style={[s.resendLabel, { color: colors.textSecondary }]}>
                            Didn't receive the code?
                        </Text>
                        {canResend ? (
                            <TouchableOpacity onPress={handleResend} disabled={resending}>
                                {resending
                                    ? <ActivityIndicator size="small" color={colors.accent} />
                                    : <Text style={[s.resendLink, { color: colors.accent }]}>Resend Code</Text>
                                }
                            </TouchableOpacity>
                        ) : (
                            <Text style={[s.countdownTxt, { color: colors.textSecondary }]}>
                                Resend in {countdown}s
                            </Text>
                        )}
                    </View>

                    {/* Info box */}
                    <View style={[s.infoBox, { backgroundColor: isDark ? 'rgba(37,99,235,0.08)' : '#eff6ff', borderColor: isDark ? 'rgba(37,99,235,0.2)' : '#bfdbfe' }]}>
                        <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
                        <Text style={[s.infoTxt, { color: colors.textSecondary }]}>
                            The code expires in 10 minutes. Check your spam folder if you don't see it.
                        </Text>
                    </View>
                </Animated.View>
            </Animated.ScrollView>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container:      { flex: 1 },
    header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
    backBtn:        { width: 40, height: 40, justifyContent: 'center' },
    headerTitle:    { fontSize: 18, fontWeight: '700' },
    skipBtn:        { paddingHorizontal: 8, paddingVertical: 4 },
    skipTxt:        { fontSize: 14 },
    scroll:         { padding: 24, alignItems: 'center' },

    iconCircle:     { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24, marginTop: 16 },
    title:          { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
    subtitle:       { fontSize: 15, textAlign: 'center', marginBottom: 4 },
    emailText:      { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 32 },

    otpRow:         { flexDirection: 'row', gap: 10, marginBottom: 28 },
    otpInput:       { width: 46, height: 56, borderRadius: 14, borderWidth: 2, fontSize: 24, fontWeight: '800', textAlign: 'center' },
    otpInputFilled: { borderWidth: 2 },

    verifyBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', borderRadius: 16, paddingVertical: 17, marginBottom: 20 },
    verifyBtnTxt:   { fontSize: 16, fontWeight: '800', color: '#fff' },

    resendRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
    resendLabel:    { fontSize: 14 },
    resendLink:     { fontSize: 14, fontWeight: '700' },
    countdownTxt:   { fontSize: 14, fontWeight: '600' },

    infoBox:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, padding: 14, borderWidth: 1, width: '100%' },
    infoTxt:        { flex: 1, fontSize: 13, lineHeight: 18 },

    successWrap:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    successCircle:  { marginBottom: 20 },
    successTitle:   { fontSize: 28, fontWeight: '800', marginBottom: 10 },
    successSub:     { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});