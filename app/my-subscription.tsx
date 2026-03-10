import { apiFetch } from '@/services/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Header } from '../components/Header';

interface Vehicle {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
    nickname?: string;
}

interface Plan {
    color: string;
    tagline?: string;
}

interface Subscription {
    id: string;
    planId: string;
    planName: string;
    status: string;
    startDate: string;
    endDate: string;
    remainingWashes: number;
    remainingInteriorCleans: number;
    remainingTireCleans: number;
    remainingFullDetails: number;
    totalWashes: number;
    totalInteriorCleans: number;
    totalTireCleans: number;
    totalFullDetails: number;
    vehicleId: string;
    vehicle?: Vehicle;
    plan?: Plan;
}

function AllowanceBar({
    label, icon, remaining, total, color,
}: {
    label: string; icon: string; remaining: number; total: number; color: string;
}) {
    if (total === 0) return null;
    const pct = Math.min((remaining / total) * 100, 100);
    const isEmpty = remaining === 0;
    return (
        <View style={styles.allowanceRow}>
            <View style={styles.allowanceTop}>
                <View style={styles.allowanceLabelRow}>
                    <Text style={styles.allowanceEmoji}>{icon}</Text>
                    <Text style={styles.allowanceLabel}>{label}</Text>
                </View>
                <Text style={[styles.allowanceCount, isEmpty && { color: '#ef4444' }]}>
                    {remaining} / {total} left
                </Text>
            </View>
            <View style={styles.barBg}>
                <View style={[
                    styles.barFill,
                    { width: `${pct}%` as any, backgroundColor: isEmpty ? '#fca5a5' : color },
                ]} />
            </View>
        </View>
    );
}

export default function MySubscriptionScreen() {
    const router = useRouter();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelling, setCancelling] = useState<string | null>(null);

    const loadSubscriptions = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await apiFetch('/subscriptions?status=active', {}, 'customer');
            if (res.success) setSubscriptions(res.data.subscriptions ?? []);
        } catch {
            Alert.alert('Error', 'Failed to load your subscriptions');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadSubscriptions(); }, []);

    const onRefresh = () => { setRefreshing(true); loadSubscriptions(true); };

    const handleCancel = (sub: Subscription) => {
        Alert.alert(
            'Cancel Subscription',
            `Cancel your ${sub.planName} plan for ${sub.vehicle?.nickname || `${sub.vehicle?.make} ${sub.vehicle?.model}`}?\n\nYou'll keep access until ${new Date(sub.endDate).toLocaleDateString('en-LK', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
            [
                { text: 'Keep It', style: 'cancel' },
                {
                    text: 'Cancel Plan',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setCancelling(sub.id);
                            await apiFetch(`/subscriptions/${sub.id}/cancel`, {
                                method: 'PATCH',
                                body: JSON.stringify({ reason: 'Cancelled by customer' }),
                            }, 'customer');
                            Alert.alert('Cancelled', 'Your subscription has been cancelled.');
                            loadSubscriptions();
                        } catch {
                            Alert.alert('Error', 'Failed to cancel subscription');
                        } finally {
                            setCancelling(null);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Header title="My Plan" />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0ca6e8" />
                </View>
            </View>
        );
    }

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');

    return (
        <View style={styles.container}>
            <Header title="My Plan" />
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ca6e8']} />}
            >
                {activeSubscriptions.length === 0 ? (
                    /* ── No active plan ── */
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="ribbon-outline" size={44} color="#9ca3af" />
                        </View>
                        <Text style={styles.emptyTitle}>No active plan</Text>
                        <Text style={styles.emptySubtitle}>
                            Subscribe to a monthly plan and get regular washes at a discounted rate — one subscription per vehicle.
                        </Text>
                        <TouchableOpacity
                            style={styles.browsePlansBtn}
                            onPress={() => router.push('/subscriptions' as Href)}
                        >
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                            <Text style={styles.browsePlansBtnText}>Browse Plans</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* ── Active subscription cards ── */}
                        {activeSubscriptions.map((sub) => {
                            const color = sub.plan?.color || '#0ca6e8';
                            const endDate = new Date(sub.endDate).toLocaleDateString('en-LK', {
                                day: 'numeric', month: 'long', year: 'numeric',
                            });
                            const daysLeft = Math.max(0, Math.ceil(
                                (new Date(sub.endDate).getTime() - Date.now()) / 86400000
                            ));
                            const isExpiringSoon = daysLeft <= 7;

                            return (
                                <View key={sub.id} style={[styles.card, { borderColor: color }]}>
                                    {/* Card header */}
                                    <View style={[styles.cardHeader, { backgroundColor: color }]}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.cardPlanName}>{sub.planName} Plan</Text>
                                            <Text style={styles.cardVehicle}>
                                                {sub.vehicle?.nickname || `${sub.vehicle?.make} ${sub.vehicle?.model}`}
                                                {sub.vehicle?.licensePlate ? ` · ${sub.vehicle.licensePlate}` : ''}
                                            </Text>
                                        </View>
                                        <View style={styles.activePill}>
                                            <View style={styles.activeDot} />
                                            <Text style={styles.activePillText}>ACTIVE</Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardBody}>
                                        {/* Expiry notice */}
                                        <View style={[
                                            styles.expiryRow,
                                            isExpiringSoon && { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
                                        ]}>
                                            <Ionicons
                                                name={isExpiringSoon ? 'warning-outline' : 'calendar-outline'}
                                                size={16}
                                                color={isExpiringSoon ? '#ef4444' : '#6b7280'}
                                            />
                                            <Text style={[
                                                styles.expiryText,
                                                isExpiringSoon && { color: '#ef4444', fontWeight: '700' },
                                            ]}>
                                                {isExpiringSoon
                                                    ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}!`
                                                    : `Renews ${endDate} · ${daysLeft} days left`}
                                            </Text>
                                        </View>

                                        {/* Allowances */}
                                        <Text style={styles.allowancesTitle}>Service Allowances</Text>
                                        <AllowanceBar label="Exterior Washes" icon="🚿" remaining={sub.remainingWashes} total={sub.totalWashes} color={color} />
                                        <AllowanceBar label="Interior Cleans" icon="🧹" remaining={sub.remainingInteriorCleans} total={sub.totalInteriorCleans} color={color} />
                                        <AllowanceBar label="Tire Cleanings" icon="⚙️" remaining={sub.remainingTireCleans} total={sub.totalTireCleans} color={color} />
                                        <AllowanceBar label="Full Details" icon="✨" remaining={sub.remainingFullDetails} total={sub.totalFullDetails} color={color} />

                                        {/* Cancel button */}
                                        <TouchableOpacity
                                            style={styles.cancelBtn}
                                            onPress={() => handleCancel(sub)}
                                            disabled={cancelling === sub.id}
                                        >
                                            {cancelling === sub.id
                                                ? <ActivityIndicator size="small" color="#ef4444" />
                                                : <Text style={styles.cancelBtnText}>Cancel This Plan</Text>
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}

                        {/* ── Change / Upgrade / Add plan CTA ── */}
                        <View style={styles.changePlanCard}>
                            <View style={styles.changePlanLeft}>
                                <View style={styles.changePlanIconCircle}>
                                    <Ionicons name="swap-vertical-outline" size={22} color="#0ca6e8" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 14 }}>
                                    <Text style={styles.changePlanTitle}>Change or Upgrade Plan</Text>
                                    <Text style={styles.changePlanSubtitle}>
                                        Downgrade, upgrade, or add a plan for another vehicle
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.changePlanBtn}
                                onPress={() => router.push('/subscriptions' as Href)}
                            >
                                <Text style={styles.changePlanBtnText}>View Plans</Text>
                                <Ionicons name="arrow-forward" size={16} color="#0ca6e8" />
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20 },

    // Empty state
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyIconCircle: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151', marginBottom: 8 },
    emptySubtitle: {
        fontSize: 14, color: '#9ca3af', textAlign: 'center',
        lineHeight: 22, paddingHorizontal: 24, marginBottom: 28,
    },
    browsePlansBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#0ca6e8', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28,
    },
    browsePlansBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

    // Subscription card
    card: {
        borderRadius: 18, borderWidth: 1.5, overflow: 'hidden',
        marginBottom: 20, backgroundColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
    },
    cardHeader: { padding: 18, flexDirection: 'row', alignItems: 'center' },
    cardPlanName: { fontSize: 20, fontWeight: '800', color: '#fff' },
    cardVehicle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
    activePill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
    activePillText: { fontSize: 11, fontWeight: '800', color: '#fff' },

    cardBody: { padding: 18 },

    expiryRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#f8fafc', borderRadius: 10, padding: 10,
        borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 18,
    },
    expiryText: { fontSize: 13, color: '#6b7280', flex: 1 },

    allowancesTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 14 },

    allowanceRow: { marginBottom: 14 },
    allowanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    allowanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    allowanceEmoji: { fontSize: 15 },
    allowanceLabel: { fontSize: 14, color: '#374151' },
    allowanceCount: { fontSize: 13, fontWeight: '700', color: '#374151' },
    barBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4 },

    cancelBtn: {
        marginTop: 6, paddingVertical: 12, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#fca5a5', alignItems: 'center',
    },
    cancelBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },

    // Change plan card
    changePlanCard: {
        backgroundColor: '#fff', borderRadius: 18, padding: 18,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    changePlanLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    changePlanIconCircle: {
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: '#e0f4fd', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    changePlanTitle: { fontSize: 15, fontWeight: '700', color: '#0d1629' },
    changePlanSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 3, lineHeight: 18 },
    changePlanBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1.5, borderColor: '#0ca6e8', borderRadius: 12, paddingVertical: 12,
    },
    changePlanBtnText: { fontSize: 14, fontWeight: '700', color: '#0ca6e8' },
});