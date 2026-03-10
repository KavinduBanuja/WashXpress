import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { apiFetch } from '../services/apiClient';

interface Booking {
    id: string;
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    paidWithSubscription: boolean;
    totalPrice: number;
    currency: string;
    service: { name: string; duration: number };
    vehicle: { make: string; model: string; licensePlate: string; type: string };
    address: { label: string; addressLine1: string; city: string };
    priceBreakdown?: { basePrice: number; multiplier: number; totalPrice: number; vehicleType: string };
}

function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    });
}

export default function BookingConfirmationScreen() {
    const { bookingId, path } = useLocalSearchParams<{ bookingId: string; path: string }>();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBooking();
    }, []);

    const loadBooking = async () => {
        try {
            const res = await apiFetch(`/bookings/${bookingId}`, {}, 'customer');
            if (res.success) setBooking(res.data.booking);
        } catch (err) {
            console.error('Load booking error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: '#ef4444', fontSize: 16 }}>Booking not found</Text>
                <TouchableOpacity onPress={() => router.replace('/customer-home')} style={styles.homeBtn}>
                    <Text style={styles.homeBtnText}>Go Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isSubscription = booking.paidWithSubscription || path === 'subscription';

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Success animation area */}
                <View style={styles.successArea}>
                    <View style={styles.successCircle}>
                        <Ionicons name="checkmark" size={48} color="#fff" />
                    </View>
                    <Text style={styles.successTitle}>Booking Confirmed!</Text>
                    <Text style={styles.successSubtitle}>
                        {isSubscription
                            ? 'Your subscription wash has been scheduled'
                            : 'Payment successful · Your wash is scheduled'}
                    </Text>
                </View>

                {/* Payment method badge */}
                <View style={[
                    styles.pathBadge,
                    { backgroundColor: isSubscription ? '#f0fdf4' : '#eff6ff', borderColor: isSubscription ? '#86efac' : '#bfdbfe' },
                ]}>
                    <Ionicons
                        name={isSubscription ? 'refresh-circle' : 'card'}
                        size={18}
                        color={isSubscription ? '#16a34a' : '#2563eb'}
                    />
                    <Text style={[styles.pathBadgeText, { color: isSubscription ? '#16a34a' : '#2563eb' }]}>
                        {isSubscription ? 'Paid via Subscription Wash' : 'Paid via One-Time Payment'}
                    </Text>
                </View>

                {/* Booking details card */}
                <View style={styles.detailsCard}>
                    <Text style={styles.detailsCardTitle}>Booking Details</Text>

                    <DetailRow icon="receipt-outline" label="Booking ID" value={`#${booking.id.slice(-8).toUpperCase()}`} />
                    <DetailRow icon="sparkles-outline" label="Service" value={booking.service.name} />
                    <DetailRow icon="car-outline" label="Vehicle" value={`${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.licensePlate})`} />
                    <DetailRow icon="calendar-outline" label="Date" value={formatDate(booking.scheduledDate)} />
                    <DetailRow icon="time-outline" label="Time" value={formatTime(booking.scheduledTime)} />
                    <DetailRow icon="hourglass-outline" label="Duration" value={`${booking.service.duration} minutes`} />
                    <DetailRow icon="location-outline" label="Location" value={`${booking.address.label} · ${booking.address.addressLine1}, ${booking.address.city}`} />
                </View>

                {/* Price breakdown */}
                <View style={styles.priceCard}>
                    <Text style={styles.detailsCardTitle}>Price Breakdown</Text>
                    {booking.priceBreakdown && (
                        <>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>{booking.service.name}</Text>
                                <Text style={styles.priceValue}>LKR {booking.priceBreakdown.basePrice.toLocaleString()}</Text>
                            </View>
                            {booking.priceBreakdown.multiplier > 1.0 && (
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>{booking.priceBreakdown.vehicleType} surcharge</Text>
                                    <Text style={styles.priceValue}>
                                        +LKR {(booking.priceBreakdown.totalPrice - booking.priceBreakdown.basePrice).toLocaleString()}
                                    </Text>
                                </View>
                            )}
                            {isSubscription && (
                                <View style={styles.priceRow}>
                                    <Text style={[styles.priceLabel, { color: '#16a34a' }]}>Subscription discount</Text>
                                    <Text style={[styles.priceValue, { color: '#16a34a' }]}>
                                        -LKR {booking.priceBreakdown.totalPrice.toLocaleString()}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                    <View style={styles.priceDivider} />
                    <View style={styles.priceRow}>
                        <Text style={styles.priceTotalLabel}>Total Charged</Text>
                        <Text style={[styles.priceTotalValue, { color: isSubscription ? '#16a34a' : '#2563eb' }]}>
                            {isSubscription ? 'FREE' : `LKR ${booking.totalPrice.toLocaleString()}`}
                        </Text>
                    </View>
                </View>

                {/* What's next info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>What happens next?</Text>
                    {[
                        { icon: 'search-outline', text: 'WashXpress is finding the best available washer near you' },
                        { icon: 'notifications-outline', text: "You'll get a notification once a washer accepts your booking" },
                        { icon: 'car-sport-outline', text: 'Your washer will arrive at the scheduled time' },
                    ].map(({ icon, text }, i) => (
                        <View key={i} style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name={icon as any} size={16} color="#2563eb" />
                            </View>
                            <Text style={styles.infoText}>{text}</Text>
                        </View>
                    ))}
                </View>

                {/* Actions */}
                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.replace({ pathname: '/booking-details', params: { bookingId: booking.id } })}
                >
                    <Ionicons name="eye-outline" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>Track Booking</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/customer-home')}>
                    <Text style={styles.secondaryBtnText}>Back to Home</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
                <Ionicons name={icon as any} size={16} color="#6b7280" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    scroll: { padding: 24, paddingTop: 60 },

    successArea: { alignItems: 'center', marginBottom: 24 },
    successCircle: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#16a34a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
    },
    successTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
    successSubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },

    pathBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, marginBottom: 24,
    },
    pathBadgeText: { fontSize: 14, fontWeight: '700' },

    detailsCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    detailsCardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
    detailIcon: {
        width: 32, height: 32, borderRadius: 8, backgroundColor: '#f8fafc',
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    detailLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600', marginBottom: 2 },
    detailValue: { fontSize: 14, color: '#0f172a', fontWeight: '600', lineHeight: 20 },

    priceCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    priceLabel: { fontSize: 14, color: '#6b7280' },
    priceValue: { fontSize: 14, color: '#374151', fontWeight: '600' },
    priceDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
    priceTotalLabel: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    priceTotalValue: { fontSize: 22, fontWeight: '800' },

    infoCard: {
        backgroundColor: '#eff6ff', borderRadius: 20, padding: 20, marginBottom: 24,
        borderWidth: 1, borderColor: '#bfdbfe',
    },
    infoTitle: { fontSize: 15, fontWeight: '700', color: '#1e3a8a', marginBottom: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    infoIcon: {
        width: 32, height: 32, borderRadius: 8, backgroundColor: '#dbeafe',
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    infoText: { flex: 1, fontSize: 14, color: '#1e40af', lineHeight: 20, paddingTop: 6 },

    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 16, marginBottom: 12,
    },
    primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    secondaryBtn: {
        borderRadius: 16, paddingVertical: 14, alignItems: 'center',
        borderWidth: 1.5, borderColor: '#e2e8f0',
    },
    secondaryBtnText: { fontSize: 15, fontWeight: '700', color: '#374151' },

    homeBtn: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    homeBtnText: { color: '#fff', fontWeight: '700' },
});