import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, Modal, TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { apiFetch } from '../services/apiClient';
import { initiatePayHerePayment } from '../utils/Payhere';

// ── Types ─────────────────────────────────────────────────────
interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    duration: number;
    categoryId: string;
}

interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    nickname: string;
    type: string;
}

interface Address {
    id: string;
    label: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode?: string;
    country: string;
    isDefault?: boolean;
}

interface Subscription {
    id: string;
    planName: string;
    remainingWashes: number;
    totalWashes: number;
    status: string;
    vehicleId: string;
}

interface PriceBreakdown {
    basePrice: number;
    multiplier: number;
    totalPrice: number;
    vehicleType: string;
}

type PaymentPath = 'subscription' | 'one_time' | null;

// ── Helpers ───────────────────────────────────────────────────
const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00',
];

function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDate(d: Date) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getNext7Days() {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    return days;
}

function toISODateString(d: Date) {
    return d.toISOString().split('T')[0];
}

// ── Main Screen ───────────────────────────────────────────────
export default function CreateBookingScreen() {
    const { serviceId } = useLocalSearchParams<{ serviceId: string }>();

    // Data
    const [service, setService] = useState<Service | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);

    // Selections
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [notes, setNotes] = useState('');

    // Payment path
    const [paymentPath, setPaymentPath] = useState<PaymentPath>(null);
    const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);

    // UI state
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
    const [addressModalVisible, setAddressModalVisible] = useState(false);

    // ── Load data ──────────────────────────────────────────────
    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [serviceRes, vehiclesRes, addressesRes] = await Promise.all([
                apiFetch(`/services/${serviceId}`, {}, 'customer'),
                apiFetch('/vehicles', {}, 'customer'),
                apiFetch('/profile/addresses', {}, 'customer'),
            ]);

            if (serviceRes.success) setService(serviceRes.data.service);
            if (vehiclesRes.success) {
                const vList: Vehicle[] = vehiclesRes.data.vehicles || [];
                setVehicles(vList);
                const def = vList[0] || null;
                if (def) {
                    setSelectedVehicle(def);
                    await checkSubscription(def.id);
                }
            }
            if (addressesRes.success) {
                const aList: Address[] = addressesRes.data.addresses || [];
                setAddresses(aList);
                setSelectedAddress(aList.find((a) => a.isDefault) || aList[0] || null);
            }
        } catch (err) {
            console.error('Load error:', err);
            Alert.alert('Error', 'Failed to load booking details.');
        } finally {
            setLoading(false);
        }
    };

    const checkSubscription = useCallback(async (vehicleId: string) => {
        try {
            const res = await apiFetch(
                `/subscriptions?vehicleId=${vehicleId}&status=active`,
                {},
                'customer'
            );
            if (res.success && res.data.subscriptions?.length > 0) {
                const sub: Subscription = res.data.subscriptions[0];
                if (sub.remainingWashes > 0) {
                    setSubscription(sub);
                    setPaymentPath('subscription'); // default to subscription if available
                    return;
                }
            }
            setSubscription(null);
            setPaymentPath('one_time');
        } catch {
            setSubscription(null);
            setPaymentPath('one_time');
        }
    }, []);

    // Recalculate price when vehicle or path changes
    useEffect(() => {
        if (!service || !selectedVehicle) return;
        const MULTIPLIERS: Record<string, number> = {
            Sedan: 1.0, Hatchback: 1.0, Coupe: 1.0,
            Convertible: 1.1, Wagon: 1.2, SUV: 1.3, Van: 1.4, Truck: 1.5,
        };
        const multiplier = MULTIPLIERS[selectedVehicle.type] ?? 1.0;
        const totalPrice = Math.round(service.price * multiplier);
        setPriceBreakdown({
            basePrice: service.price,
            multiplier,
            totalPrice,
            vehicleType: selectedVehicle.type,
        });
    }, [service, selectedVehicle]);

    const handleVehicleSelect = async (v: Vehicle) => {
        setSelectedVehicle(v);
        setVehicleModalVisible(false);
        setPaymentPath(null);
        setSubscription(null);
        await checkSubscription(v.id);
    };

    // ── Booking submit ─────────────────────────────────────────
    const handleBook = async () => {
        if (!service || !selectedVehicle || !selectedAddress || !selectedTime || !paymentPath) {
            Alert.alert('Incomplete', 'Please fill in all required fields.');
            return;
        }

        if (paymentPath === 'subscription') {
            await bookWithSubscription();
        } else {
            await bookWithPayment();
        }
    };

    // Path 1 — Subscription
    const bookWithSubscription = async () => {
        setSubmitting(true);
        try {
            const res = await apiFetch('/bookings', {
                method: 'POST',
                body: JSON.stringify({
                    serviceId: service!.id,
                    vehicleId: selectedVehicle!.id,
                    addressId: selectedAddress!.id,
                    scheduledDate: toISODateString(selectedDate),
                    scheduledTime: selectedTime,
                    notes: notes.trim() || undefined,
                    paymentPath: 'subscription',
                    subscriptionId: subscription!.id,
                }),
            }, 'customer');

            if (res.success) {
                router.replace({ pathname: '/booking-confirmation' as any, params: { bookingId: res.data.booking.id, path: 'subscription' } });
            } else {
                Alert.alert('Error', res.message || 'Failed to create booking.');
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    // Path 2 — One-time payment
    const bookWithPayment = async () => {
        if (!priceBreakdown) return;
        setSubmitting(true);
        try {
            // Step 1: Create a pending booking to get a bookingId for PayHere order_id
            const bookingRes = await apiFetch('/bookings', {
                method: 'POST',
                body: JSON.stringify({
                    serviceId: service!.id,
                    vehicleId: selectedVehicle!.id,
                    addressId: selectedAddress!.id,
                    scheduledDate: toISODateString(selectedDate),
                    scheduledTime: selectedTime,
                    notes: notes.trim() || undefined,
                    paymentPath: 'one_time',
                }),
            }, 'customer');

            if (!bookingRes.success) {
                Alert.alert('Error', bookingRes.message || 'Failed to initiate booking.');
                setSubmitting(false);
                return;
            }

            const bookingId = bookingRes.data.booking.id;

            // Step 2: Get hash from backend
            const hashRes = await apiFetch('/payments/hash', {
                method: 'POST',
                body: JSON.stringify({
                    bookingId,
                    amount: priceBreakdown.totalPrice,
                    currency: service!.currency || 'LKR',
                }),
            }, 'customer');

            if (!hashRes.success) {
                Alert.alert('Error', 'Failed to initiate payment.');
                setSubmitting(false);
                return;
            }

            // Step 3: Launch PayHere
            await initiatePayHerePayment({
                bookingId,
                amount: priceBreakdown.totalPrice,
                currency: service!.currency || 'LKR',
                hash: hashRes.data.hash,
                description: `${service!.name} — ${selectedVehicle!.nickname}`,
                onSuccess: () => {
                    router.replace({ pathname: '/booking-confirmation' as any, params: { bookingId, path: 'one_time' } });
                },
                onError: (msg: string) => {
                    Alert.alert('Payment Failed', msg || 'Your payment could not be processed. Please try again.');
                },
                onDismiss: () => {
                    Alert.alert('Payment Cancelled', 'You cancelled the payment. Your booking has been held for 10 minutes.');
                },
            });
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    const canBook =
        !!selectedVehicle &&
        !!selectedAddress &&
        !!selectedTime &&
        !!paymentPath &&
        (paymentPath === 'subscription' ? !!subscription : true);

    // ── Loading state ──────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Setting up your booking...</Text>
            </View>
        );
    }

    if (!service) {
        return (
            <View style={styles.loadingContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text style={[styles.loadingText, { color: '#ef4444' }]}>Service not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
                    <Text style={styles.retryBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Service</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Service summary */}
                <View style={styles.serviceCard}>
                    <View style={styles.serviceIconCircle}>
                        <Ionicons name="car-sport" size={26} color="#2563eb" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <View style={styles.serviceMetaRow}>
                            <Ionicons name="time-outline" size={13} color="#6b7280" />
                            <Text style={styles.serviceMeta}>{service.duration} min</Text>
                            <Text style={styles.serviceMetaDot}>·</Text>
                            <Text style={styles.serviceMeta}>Base: LKR {service.price.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Step 1: Vehicle ── */}
                <SectionLabel number={1} title="Select Vehicle" />
                <TouchableOpacity style={styles.selectionCard} onPress={() => setVehicleModalVisible(true)}>
                    {selectedVehicle ? (
                        <View style={styles.selectionCardInner}>
                            <View style={styles.selectionIconCircle}>
                                <Ionicons name="car" size={22} color="#2563eb" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.selectionPrimary}>{selectedVehicle.nickname || `${selectedVehicle.make} ${selectedVehicle.model}`}</Text>
                                <Text style={styles.selectionSecondary}>
                                    {selectedVehicle.type} · {selectedVehicle.licensePlate}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                        </View>
                    ) : (
                        <View style={styles.selectionCardInner}>
                            <Ionicons name="add-circle-outline" size={22} color="#9ca3af" />
                            <Text style={[styles.selectionSecondary, { marginLeft: 10 }]}>Tap to select a vehicle</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Vehicle type price multiplier notice */}
                {priceBreakdown && priceBreakdown.multiplier > 1.0 && (
                    <View style={styles.multiplierNotice}>
                        <Ionicons name="information-circle-outline" size={15} color="#92400e" />
                        <Text style={styles.multiplierText}>
                            {priceBreakdown.vehicleType} pricing applies (+{Math.round((priceBreakdown.multiplier - 1) * 100)}% on base price)
                        </Text>
                    </View>
                )}

                {/* ── Step 2: Payment Path ── */}
                <SectionLabel number={2} title="How Would You Like to Pay?" />

                {/* Subscription path card */}
                <PaymentPathCard
                    selected={paymentPath === 'subscription'}
                    onSelect={() => setPaymentPath('subscription')}
                    disabled={!subscription}
                    icon="refresh-circle"
                    iconColor="#16a34a"
                    title="Use Subscription Wash"
                    subtitle={
                        subscription
                            ? `${subscription.planName} · ${subscription.remainingWashes} wash${subscription.remainingWashes !== 1 ? 'es' : ''} remaining`
                            : 'No active subscription for this vehicle'
                    }
                    badge={subscription ? 'FREE' : undefined}
                    badgeColor="#16a34a"
                    disabledReason={
                        !subscription
                            ? 'No active subscription linked to this vehicle'
                            : undefined
                    }
                    subscribeAction={
                        !subscription
                            ? () => router.push('/subscriptions')
                            : undefined
                    }
                />

                {/* One-time payment card */}
                <PaymentPathCard
                    selected={paymentPath === 'one_time'}
                    onSelect={() => setPaymentPath('one_time')}
                    icon="card"
                    iconColor="#2563eb"
                    title="One-Time Payment"
                    subtitle={
                        priceBreakdown
                            ? `LKR ${priceBreakdown.totalPrice.toLocaleString()} via PayHere`
                            : `LKR ${service.price.toLocaleString()} via PayHere`
                    }
                    badge="CARD / BANK"
                    badgeColor="#2563eb"
                />

                {/* ── Step 3: Date ── */}
                <SectionLabel number={3} title="Select Date" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePicker}>
                    {getNext7Days().map((d) => {
                        const isToday = d.toDateString() === new Date().toDateString();
                        const isSelected = d.toDateString() === selectedDate.toDateString();
                        return (
                            <TouchableOpacity
                                key={d.toDateString()}
                                style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                                onPress={() => setSelectedDate(d)}
                            >
                                <Text style={[styles.dateChipDay, isSelected && styles.dateChipTextSelected]}>
                                    {isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })}
                                </Text>
                                <Text style={[styles.dateChipNum, isSelected && styles.dateChipTextSelected]}>
                                    {d.getDate()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* ── Step 4: Time ── */}
                <SectionLabel number={4} title="Select Time" />
                <View style={styles.timeGrid}>
                    {TIME_SLOTS.map((t) => {
                        const isSelected = selectedTime === t;
                        return (
                            <TouchableOpacity
                                key={t}
                                style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                                onPress={() => setSelectedTime(t)}
                            >
                                <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                                    {formatTime(t)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── Step 5: Address ── */}
                <SectionLabel number={5} title="Service Location" />
                <TouchableOpacity style={styles.selectionCard} onPress={() => setAddressModalVisible(true)}>
                    {selectedAddress ? (
                        <View style={styles.selectionCardInner}>
                            <View style={styles.selectionIconCircle}>
                                <Ionicons name="location" size={20} color="#2563eb" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.selectionPrimary}>{selectedAddress.label}</Text>
                                <Text style={styles.selectionSecondary} numberOfLines={1}>
                                    {selectedAddress.addressLine1}, {selectedAddress.city}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                        </View>
                    ) : (
                        <View style={styles.selectionCardInner}>
                            <Ionicons name="add-circle-outline" size={22} color="#9ca3af" />
                            <Text style={[styles.selectionSecondary, { marginLeft: 10 }]}>Tap to select an address</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* ── Notes ── */}
                <SectionLabel number={6} title={<>Special Instructions <Text style={styles.optionalLabel}>(optional)</Text></>} />
                <View style={styles.notesContainer}>
                    <TextInput
                        style={styles.notesInput}
                        multiline
                        numberOfLines={3}
                        placeholder="e.g. Gate code, parking spot, specific areas to focus on..."
                        placeholderTextColor="#9ca3af"
                        value={notes}
                        onChangeText={setNotes}
                        textAlignVertical="top"
                    />
                </View>

                {/* ── Price Summary ── */}
                {paymentPath && priceBreakdown && (
                    <View style={styles.priceSummaryCard}>
                        <Text style={styles.priceSummaryTitle}>Price Summary</Text>
                        <View style={styles.priceSummaryRow}>
                            <Text style={styles.priceSummaryLabel}>{service.name}</Text>
                            <Text style={styles.priceSummaryValue}>LKR {priceBreakdown.basePrice.toLocaleString()}</Text>
                        </View>
                        {priceBreakdown.multiplier > 1.0 && (
                            <View style={styles.priceSummaryRow}>
                                <Text style={styles.priceSummaryLabel}>{priceBreakdown.vehicleType} surcharge</Text>
                                <Text style={styles.priceSummaryValue}>
                                    +LKR {(priceBreakdown.totalPrice - priceBreakdown.basePrice).toLocaleString()}
                                </Text>
                            </View>
                        )}
                        {paymentPath === 'subscription' && (
                            <View style={styles.priceSummaryRow}>
                                <Text style={[styles.priceSummaryLabel, { color: '#16a34a' }]}>Subscription discount</Text>
                                <Text style={[styles.priceSummaryValue, { color: '#16a34a' }]}>
                                    -LKR {priceBreakdown.totalPrice.toLocaleString()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.priceSummaryDivider} />
                        <View style={styles.priceSummaryRow}>
                            <Text style={styles.priceSummaryTotalLabel}>Total</Text>
                            <Text style={styles.priceSummaryTotal}>
                                {paymentPath === 'subscription' ? 'FREE' : `LKR ${priceBreakdown.totalPrice.toLocaleString()}`}
                            </Text>
                        </View>
                        {paymentPath === 'subscription' && (
                            <Text style={styles.subscriptionNote}>
                                1 wash will be deducted from your {subscription?.planName} subscription
                            </Text>
                        )}
                    </View>
                )}

                {/* ── Booking CTA ── */}
                <TouchableOpacity
                    style={[styles.bookButton, (!canBook || submitting) && styles.bookButtonDisabled]}
                    onPress={handleBook}
                    disabled={!canBook || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name={paymentPath === 'subscription' ? 'checkmark-circle' : 'card'} size={20} color="#fff" />
                            <Text style={styles.bookButtonText}>
                                {paymentPath === 'subscription'
                                    ? 'Confirm Booking (Free)'
                                    : `Pay LKR ${priceBreakdown?.totalPrice.toLocaleString() ?? ''} & Book`}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── Vehicle Picker Modal ── */}
            <PickerModal
                visible={vehicleModalVisible}
                title="Your Vehicles"
                onClose={() => setVehicleModalVisible(false)}
            >
                {vehicles.length === 0 ? (
                    <EmptyModalState
                        icon="car-outline"
                        message="No vehicles added yet"
                        action="Add Vehicle"
                        onAction={() => { setVehicleModalVisible(false); router.push('/vehicles' as any); }}
                    />
                ) : (
                    vehicles.map((v) => (
                        <TouchableOpacity
                            key={v.id}
                            style={[styles.modalItem, selectedVehicle?.id === v.id && styles.modalItemSelected]}
                            onPress={() => handleVehicleSelect(v)}
                        >
                            <View style={styles.modalItemIcon}>
                                <Ionicons name="car" size={22} color={selectedVehicle?.id === v.id ? '#2563eb' : '#6b7280'} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.modalItemPrimary}>{v.nickname || `${v.make} ${v.model}`}</Text>
                                <Text style={styles.modalItemSecondary}>{v.type} · {v.year} · {v.licensePlate}</Text>
                            </View>
                            {selectedVehicle?.id === v.id && (
                                <Ionicons name="checkmark-circle" size={22} color="#2563eb" />
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </PickerModal>

            {/* ── Address Picker Modal ── */}
            <PickerModal
                visible={addressModalVisible}
                title="Service Locations"
                onClose={() => setAddressModalVisible(false)}
            >
                {addresses.length === 0 ? (
                    <EmptyModalState
                        icon="location-outline"
                        message="No addresses saved yet"
                        action="Add Address"
                        onAction={() => { setAddressModalVisible(false); router.push('/profile/addresses' as any); }}
                    />
                ) : (
                    addresses.map((a) => (
                        <TouchableOpacity
                            key={a.id}
                            style={[styles.modalItem, selectedAddress?.id === a.id && styles.modalItemSelected]}
                            onPress={() => { setSelectedAddress(a); setAddressModalVisible(false); }}
                        >
                            <View style={styles.modalItemIcon}>
                                <Ionicons name="location" size={22} color={selectedAddress?.id === a.id ? '#2563eb' : '#6b7280'} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.modalItemPrimary}>{a.label}{a.isDefault ? ' (Default)' : ''}</Text>
                                <Text style={styles.modalItemSecondary} numberOfLines={1}>
                                    {a.addressLine1}, {a.city}
                                </Text>
                            </View>
                            {selectedAddress?.id === a.id && (
                                <Ionicons name="checkmark-circle" size={22} color="#2563eb" />
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </PickerModal>
        </View>
    );
}

// ── Sub-components ─────────────────────────────────────────────

function SectionLabel({ number, title }: { number: number; title: any }) {
    return (
        <View style={styles.sectionLabelRow}>
            <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>{number}</Text>
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}

function PaymentPathCard({
    selected, onSelect, disabled, icon, iconColor, title, subtitle,
    badge, badgeColor, disabledReason, subscribeAction,
}: {
    selected: boolean; onSelect: () => void; disabled?: boolean;
    icon: string; iconColor: string; title: string; subtitle: string;
    badge?: string; badgeColor?: string; disabledReason?: string; subscribeAction?: () => void;
}) {
    return (
        <TouchableOpacity
            style={[
                styles.paymentCard,
                selected && styles.paymentCardSelected,
                disabled && styles.paymentCardDisabled,
            ]}
            onPress={!disabled ? onSelect : undefined}
            activeOpacity={disabled ? 1 : 0.7}
        >
            <View style={styles.paymentCardTop}>
                {/* Radio */}
                <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioDot} />}
                </View>

                {/* Icon */}
                <View style={[styles.paymentIconCircle, { backgroundColor: iconColor + '18' }]}>
                    <Ionicons name={icon as any} size={22} color={disabled ? '#9ca3af' : iconColor} />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.paymentTitleRow}>
                        <Text style={[styles.paymentTitle, disabled && styles.paymentTitleDisabled]}>{title}</Text>
                        {badge && (
                            <View style={[styles.paymentBadge, { backgroundColor: (disabled ? '#9ca3af' : badgeColor) + '20' }]}>
                                <Text style={[styles.paymentBadgeText, { color: disabled ? '#9ca3af' : badgeColor }]}>{badge}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.paymentSubtitle, disabled && styles.paymentSubtitleDisabled]}>{subtitle}</Text>
                </View>
            </View>

            {disabledReason && (
                <View style={styles.disabledReasonRow}>
                    <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
                    <Text style={styles.disabledReasonText}>{disabledReason}</Text>
                    {subscribeAction && (
                        <TouchableOpacity onPress={subscribeAction}>
                            <Text style={styles.subscribeLink}>Get one →</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
}

function PickerModal({ visible, title, onClose, children }: any) {
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                        <Ionicons name="close" size={24} color="#6b7280" />
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.modalScroll}>
                    {children}
                </ScrollView>
            </View>
        </Modal>
    );
}

function EmptyModalState({ icon, message, action, onAction }: any) {
    return (
        <View style={styles.modalEmpty}>
            <Ionicons name={icon} size={40} color="#d1d5db" />
            <Text style={styles.modalEmptyText}>{message}</Text>
            <TouchableOpacity style={styles.modalEmptyAction} onPress={onAction}>
                <Text style={styles.modalEmptyActionText}>{action}</Text>
            </TouchableOpacity>
        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', gap: 12 },
    loadingText: { fontSize: 16, color: '#6b7280' },
    retryBtn: { marginTop: 8, backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#fff', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },

    scrollContent: { padding: 20, paddingBottom: 40 },

    // Service card
    serviceCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#eff6ff', borderRadius: 16, padding: 16, marginBottom: 24,
        borderWidth: 1, borderColor: '#bfdbfe',
    },
    serviceIconCircle: {
        width: 52, height: 52, borderRadius: 16,
        backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center',
    },
    serviceName: { fontSize: 16, fontWeight: '700', color: '#1e3a8a' },
    serviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    serviceMeta: { fontSize: 13, color: '#3b82f6' },
    serviceMetaDot: { fontSize: 13, color: '#3b82f6' },

    // Section label
    sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 8 },
    sectionNumber: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center',
    },
    sectionNumberText: { fontSize: 12, fontWeight: '800', color: '#fff' },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    optionalLabel: { fontSize: 13, fontWeight: '400', color: '#9ca3af' },

    // Selection card
    selectionCard: {
        backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
        padding: 14, marginBottom: 6,
    },
    selectionCardInner: { flexDirection: 'row', alignItems: 'center' },
    selectionIconCircle: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center',
    },
    selectionPrimary: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
    selectionSecondary: { fontSize: 13, color: '#6b7280', marginTop: 2 },

    multiplierNotice: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#fffbeb', borderRadius: 10, padding: 10, marginBottom: 14,
        borderWidth: 1, borderColor: '#fde68a',
    },
    multiplierText: { fontSize: 13, color: '#92400e', flex: 1 },

    // Payment path cards
    paymentCard: {
        backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0',
        padding: 16, marginBottom: 10,
    },
    paymentCardSelected: { borderColor: '#2563eb', backgroundColor: '#f8faff' },
    paymentCardDisabled: { backgroundColor: '#f9fafb', borderColor: '#f1f5f9' },
    paymentCardTop: { flexDirection: 'row', alignItems: 'center' },
    radio: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2, borderColor: '#d1d5db',
        justifyContent: 'center', alignItems: 'center', marginRight: 2,
    },
    radioSelected: { borderColor: '#2563eb' },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563eb' },
    paymentIconCircle: {
        width: 44, height: 44, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginLeft: 10,
    },
    paymentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    paymentTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    paymentTitleDisabled: { color: '#9ca3af' },
    paymentBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    paymentBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    paymentSubtitle: { fontSize: 13, color: '#374151', marginTop: 3 },
    paymentSubtitleDisabled: { color: '#9ca3af' },
    disabledReasonRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9',
    },
    disabledReasonText: { fontSize: 12, color: '#9ca3af', flex: 1 },
    subscribeLink: { fontSize: 13, color: '#2563eb', fontWeight: '700' },

    // Date picker
    datePicker: { paddingBottom: 10, gap: 8, paddingLeft: 2, marginBottom: 6 },
    dateChip: {
        width: 64, height: 72, borderRadius: 16,
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
        justifyContent: 'center', alignItems: 'center', gap: 4,
    },
    dateChipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    dateChipDay: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
    dateChipNum: { fontSize: 20, color: '#0f172a', fontWeight: '800' },
    dateChipTextSelected: { color: '#fff' },

    // Time grid
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    timeChip: {
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    },
    timeChipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    timeChipText: { fontSize: 14, fontWeight: '600', color: '#374151' },
    timeChipTextSelected: { color: '#fff' },

    // Notes
    notesContainer: {
        backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
        padding: 14, marginBottom: 8,
    },
    notesInput: { fontSize: 15, color: '#0f172a', minHeight: 72, lineHeight: 22 },

    // Price summary
    priceSummaryCard: {
        backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0',
        padding: 18, marginTop: 20, marginBottom: 8,
    },
    priceSummaryTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
    priceSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    priceSummaryLabel: { fontSize: 14, color: '#6b7280' },
    priceSummaryValue: { fontSize: 14, color: '#374151', fontWeight: '600' },
    priceSummaryDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
    priceSummaryTotalLabel: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    priceSummaryTotal: { fontSize: 20, fontWeight: '800', color: '#2563eb' },
    subscriptionNote: {
        fontSize: 12, color: '#16a34a', marginTop: 8,
        textAlign: 'center', fontStyle: 'italic',
    },

    // Book button
    bookButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 18, marginTop: 16,
    },
    bookButtonDisabled: { backgroundColor: '#d1d5db' },
    bookButtonText: { fontSize: 16, fontWeight: '800', color: '#fff' },

    // Modal
    modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#fff', paddingTop: 20, paddingBottom: 16, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
    modalCloseBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
    modalScroll: { padding: 20, paddingBottom: 40 },
    modalItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
        padding: 14, marginBottom: 10,
    },
    modalItemSelected: { borderColor: '#2563eb', backgroundColor: '#f8faff' },
    modalItemIcon: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center',
    },
    modalItemPrimary: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
    modalItemSecondary: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    modalEmpty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    modalEmptyText: { fontSize: 15, color: '#6b7280' },
    modalEmptyAction: { backgroundColor: '#2563eb', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
    modalEmptyActionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});