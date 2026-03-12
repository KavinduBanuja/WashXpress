<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import { apiFetch } from '@/services/apiClient';
import { getProfileFromFirebase } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
>>>>>>> bba8704429d380204cdacdf03b5a35cea2da5f17
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

<<<<<<< HEAD
// ── Types ──────────────────────────────────────────────
type Job = {
=======
interface WasherProfile {
    uid: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phoneNumber: string;
    photoURL?: string;
    area: string;
    rating: number;
    totalReviews: number;
    totalBookings: number;
    isActive: boolean;
    isVerified: boolean;
    memberSince: string;
}

interface Booking {
>>>>>>> bba8704429d380204cdacdf03b5a35cea2da5f17
    id: string;
    name: string;
    vehicle: string;
    service: string;
    address: string;
    date: string;
    time: string;
    amount: string;
    distance: string;
    priority: string;
};

// ── Helpers ─────────────────────────────────────────────
function formatDate(dateStr: string) {
    const today = new Date();
    const date = new Date(dateStr);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === new Date(today.getTime() + 86400000).toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PriorityBadge({ priority }: { priority: string }) {
    const map: any = {
        VIP: { bg: '#f3e8ff', text: '#7c3aed' },
        Priority: { bg: '#dbeafe', text: '#1d4ed8' },
        Standard: { bg: '#f3f4f6', text: '#6b7280' },
    };
<<<<<<< HEAD
    const s = map[priority] || map.Standard;
    return (
        <View style={[badgeStyles.badge, { backgroundColor: s.bg }]}>
            <Text style={[badgeStyles.text, { color: s.text }]}>{priority}</Text>
=======

    const loadProfile = async () => {
        try {
            const data = await apiFetch('/auth/washer/profile', {}, 'provider');

            if (data.success) {
                let profileData = data.provider;

                // Fetch full profile from Firestore to get firstName/lastName
                if (profileData?.uid) {
                    try {
                        const firestoreProfile = await getProfileFromFirebase(profileData.uid, 'provider');
                        if (firestoreProfile) {
                            profileData = {
                                ...profileData,
                                firstName: firestoreProfile.firstName,
                                lastName: firestoreProfile.lastName,
                                displayName: firestoreProfile.displayName || profileData.displayName,
                            };
                        }
                    } catch (err) {
                        console.warn('Could not fetch profile from Firestore:', err);
                    }
                }

                setProfile(profileData);
            }
        } catch (error) {
            console.error('Load profile error:', error);
        }
    };

    const loadCurrentJob = async () => {
        try {
            const data = await apiFetch('/bookings?status=in_progress&limit=1', {}, 'provider');

            if (data.success && data.data.bookings.length > 0) {
                setCurrentJob(data.data.bookings[0]);
            } else {
                setCurrentJob(null);
            }
        } catch (error) {
            console.error('Load current job error:', error);
        }
    };

    const loadNextBooking = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const data = await apiFetch(`/bookings?status=confirmed&startDate=${today}&limit=1`, {}, 'provider');

            if (data.success && data.data.bookings.length > 0) {
                setNextBooking(data.data.bookings[0]);
            } else {
                setNextBooking(null);
            }
        } catch (error) {
            console.error('Load next booking error:', error);
        }
    };

    const loadPendingRequests = async (silent = false) => {
        try {
            const data = await apiFetch('/bookings?status=pending&limit=10', {}, 'provider');

            if (data.success) {
                setRequests(data.data.bookings);
                setStats(prev => ({ ...prev, pendingRequests: data.data.bookings.length }));

                // Show notification if new requests (only if silent update)
                if (silent && data.data.bookings.length > 0) {
                    // You can show a badge or notification here
                }
            }
        } catch (error) {
            console.error('Load pending requests error:', error);
        }
    };

    const loadStats = async () => {
        try {
            const token = await AsyncStorage.getItem('idToken');
            const today = new Date().toISOString().split('T')[0];

            // Get today's completed bookings
            const todayData = await apiFetch(`/bookings?status=completed&startDate=${today}&endDate=${today}`, {}, 'provider');

            if (todayData.success) {
                const completedToday = todayData.data.bookings.length;
                const todayEarnings = todayData.data.bookings.reduce(
                    (sum: number, b: Booking) => sum + b.service.price,
                    0
                );

                setStats(prev => ({
                    ...prev,
                    completedToday,
                    todayEarnings,
                    todayBookings: completedToday,
                }));
            }

            // Calculate week/month earnings would require more API calls
            // For now, using mock data - implement proper calculations in production
            setStats(prev => ({
                ...prev,
                weekEarnings: prev.todayEarnings * 5, // Mock
                monthEarnings: prev.todayEarnings * 20, // Mock
            }));
        } catch (error) {
            console.error('Load stats error:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        await AsyncStorage.multiRemove(['customToken', 'idToken', 'user']);
        router.replace('/login');
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                <TouchableOpacity onPress={() => router.push('/profile' as any)}>
                    <View style={styles.profilePic}>
                        {profile?.photoURL ? (
                            <Image source={{ uri: profile.photoURL }} style={styles.profileImage} />
                        ) : (
                            <Ionicons name="person" size={24} color="#666" />
                        )}
                    </View>
                </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.greeting}>Welcome back,</Text>
                        <Text style={styles.name}>{profile?.displayName || 'Hello'}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => router.push('/washer-notifications' as any)}
                >
                    {pendingRequests.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                        </View>
                    )}
                    <Ionicons name="notifications-outline" size={28} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Current Job Banner */}
                {currentJob ? (
                    <TouchableOpacity
                        style={styles.currentJobBanner}
                        onPress={() => router.push(`/washer-booking-details?id=${currentJob.id}` as any)}
                    >
                        <View style={styles.currentJobHeader}>
                            <View style={styles.pulseIndicator} />
                            <Text style={styles.currentJobTitle}>CURRENT JOB IN PROGRESS</Text>
                        </View>

                        <View style={styles.currentJobContent}>
                            <View style={styles.currentJobInfo}>
                                <Text style={styles.currentJobService}>{currentJob.service.name}</Text>
                                <Text style={styles.currentJobCustomer}>{currentJob.customer.displayName}</Text>
                                <Text style={styles.currentJobVehicle}>
                                    {currentJob.vehicle.make} {currentJob.vehicle.model}
                                </Text>
                            </View>

                            <View style={styles.currentJobActions}>
                                <View style={styles.currentJobTime}>
                                    <Ionicons name="time-outline" size={16} color="#FFF" />
                                    <Text style={styles.currentJobTimeText}>
                                        {currentJob.startedAt
                                            ? `Started ${new Date(currentJob.startedAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}`
                                            : 'In Progress'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#FFF" />
                            </View>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.noJobBanner}>
                        <Ionicons name="checkmark-circle-outline" size={48} color="#4CAF50" />
                        <Text style={styles.noJobText}>No active job</Text>
                        <Text style={styles.noJobSubtext}>New requests will appear here</Text>
                    </View>
                )}

                {/* Stats Overview */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>Today's Performance</Text>

                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Ionicons name="cash-outline" size={32} color="#4CAF50" />
                            <Text style={styles.statValue}>LKR {stats.todayEarnings.toLocaleString()}</Text>
                            <Text style={styles.statLabel}>Earned Today</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Ionicons name="checkmark-circle-outline" size={32} color="#2196F3" />
                            <Text style={styles.statValue}>{stats.completedToday}</Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Ionicons name="star-outline" size={32} color="#FFD700" />
                            <Text style={styles.statValue}>{profile?.rating || 0}</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Ionicons name="time-outline" size={32} color="#FF9800" />
                            <Text style={styles.statValue}>{pendingRequests.length}</Text>
                            <Text style={styles.statLabel}>New Requests</Text>
                        </View>
                    </View>
                </View>

                {/* Earnings Summary */}
                <View style={styles.earningsCard}>
                    <View style={styles.earningsHeader}>
                        <Text style={styles.sectionTitle}>Earnings</Text>
                        <TouchableOpacity onPress={() => router.push('/washer-earnings' as any)}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.earningsRow}>
                        <View style={styles.earningItem}>
                            <Text style={styles.earningLabel}>This Week</Text>
                            <Text style={styles.earningValue}>
                                LKR {stats.weekEarnings.toLocaleString()}
                            </Text>
                        </View>

                        <View style={styles.earningDivider} />

                        <View style={styles.earningItem}>
                            <Text style={styles.earningLabel}>This Month</Text>
                            <Text style={styles.earningValue}>
                                LKR {stats.monthEarnings.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>New Job Requests</Text>
                            <TouchableOpacity onPress={() => router.push('/washer-requests')}>
                                <Text style={styles.viewAllText}>View All ({pendingRequests.length})</Text>
                            </TouchableOpacity>
                        </View>

                        {pendingRequests.slice(0, 3).map((request) => (
                            <TouchableOpacity
                                key={request.id}
                                style={styles.requestCard}
                                onPress={() => router.push(`/washer-job-request?id=${request.id}`)}
                            >
                                <View style={styles.requestHeader}>
                                    <View>
                                        <Text style={styles.requestService}>{request.service.name}</Text>
                                        <Text style={styles.requestCustomer}>{request.customer.displayName}</Text>
                                    </View>
                                    <View style={styles.requestPriceContainer}>
                                        <Text style={styles.requestPrice}>
                                            LKR {request.service.price.toLocaleString()}
                                        </Text>
                                        <Text style={styles.requestDuration}>~{request.service.duration} min</Text>
                                    </View>
                                </View>

                                <View style={styles.requestFooter}>
                                    <View style={styles.requestInfo}>
                                        <Ionicons name="calendar-outline" size={14} color="#666" />
                                        <Text style={styles.requestInfoText}>
                                            {request.scheduledDate} at {request.scheduledTime}
                                        </Text>
                                    </View>
                                    <View style={styles.requestInfo}>
                                        <Ionicons name="location-outline" size={14} color="#666" />
                                        <Text style={styles.requestInfoText}>{request.address.city}</Text>
                                    </View>
                                </View>

                                <View style={styles.requestActions}>
                                    <TouchableOpacity
                                        style={styles.acceptButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            router.push(`/washer-job-request?id=${request.id}&action=accept`);
                                        }}
                                    >
                                        <Text style={styles.acceptButtonText}>Accept</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.declineButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            router.push(`/washer-job-request?id=${request.id}&action=decline`);
                                        }}
                                    >
                                        <Text style={styles.declineButtonText}>Decline</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Next Booking */}
                {nextBooking && !currentJob && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Next Scheduled Job</Text>

                        <TouchableOpacity
                            style={styles.nextBookingCard}
                            onPress={() => router.push(`/washer-booking-details?id=${nextBooking.id}` as any)}
                        >
                            <View style={styles.nextBookingHeader}>
                                <View>
                                    <Text style={styles.nextBookingService}>{nextBooking.service.name}</Text>
                                    <Text style={styles.nextBookingCustomer}>
                                        {nextBooking.customer.displayName}
                                    </Text>
                                </View>
                                <View style={styles.nextBookingPrice}>
                                    <Text style={styles.nextBookingPriceText}>
                                        LKR {nextBooking.service.price.toLocaleString()}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.nextBookingDetails}>
                                <View style={styles.nextBookingDetail}>
                                    <Ionicons name="calendar" size={18} color="#007AFF" />
                                    <Text style={styles.nextBookingDetailText}>
                                        {nextBooking.scheduledDate}
                                    </Text>
                                </View>

                                <View style={styles.nextBookingDetail}>
                                    <Ionicons name="time" size={18} color="#007AFF" />
                                    <Text style={styles.nextBookingDetailText}>
                                        {nextBooking.scheduledTime}
                                    </Text>
                                </View>

                                <View style={styles.nextBookingDetail}>
                                    <Ionicons name="location" size={18} color="#007AFF" />
                                    <Text style={styles.nextBookingDetailText}>
                                        {nextBooking.address.label}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Quick Actions — Fixed Bottom Bar */}
            <View style={styles.quickActionsBar}>
                <TouchableOpacity
                    style={styles.quickActionItem}
                    onPress={() => router.push('/washer-bookings' as any)}
                >
                    <Ionicons name="calendar-outline" size={24} color="#007AFF" />
                    <Text style={styles.quickActionLabel}>Bookings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.quickActionItem}
                    onPress={() => router.push('/washer-earnings' as any)}
                >
                    <Ionicons name="stats-chart-outline" size={24} color="#007AFF" />
                    <Text style={styles.quickActionLabel}>Earnings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.quickActionItem}
                    onPress={() => router.push('/washer-reviews' as any)}
                >
                    <Ionicons name="star-outline" size={24} color="#007AFF" />
                    <Text style={styles.quickActionLabel}>Reviews</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.quickActionItem}
                    onPress={() => router.push('/profile' as any)}
                >
                    <Ionicons name="person-outline" size={24} color="#007AFF" />
                    <Text style={styles.quickActionLabel}>Profile</Text>
                </TouchableOpacity>
            </View>
>>>>>>> bba8704429d380204cdacdf03b5a35cea2da5f17
        </View>
    );
}

const badgeStyles = StyleSheet.create({
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginLeft: 6 },
    text: { fontSize: 11, fontWeight: '600' },
});

// ── Main Component ───────────────────────────────────────
export default function WasherHome() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('home');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'bookings'),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: Job[] = snapshot.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    name: data.customerName ?? 'Unknown',
                    vehicle: `${data.vehicleMake ?? ''} ${data.vehicleModel ?? ''} • ${data.vehicleColor ?? ''} • ${data.licensePlate ?? ''}`,
                    service: data.serviceType ?? 'Service',
                    address: data.address ?? 'No address',
                    date: data.date ?? '',
                    time: data.time ?? '',
                    amount: `$${data.price ?? '0'}`,
                    distance: `${data.distance ?? '?'} miles`,
                    priority: data.priority ?? 'Standard',
                };
            });
            setJobs(fetched);
            setLoading(false);
        }, (error) => {
            console.error('Firestore error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAcceptJob = async (jobId: string) => {
        try {
            setAccepting(jobId);
            await updateDoc(doc(db, 'bookings', jobId), {
                status: 'accepted',
                // TODO: add washerId when auth is implemented
            });
            // TODO: router.push(`/washer-booking-details?id=${jobId}`);
        } catch (error) {
            console.error('Failed to accept job:', error);
        } finally {
            setAccepting(null);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#16a34a" />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.welcomeText}>Welcome back</Text>
                            <Text style={styles.providerName}>Indrajith</Text>
                        </View>
                        <TouchableOpacity style={styles.profileBtn}>
                            <Ionicons name="person-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Earnings Card */}
                    <TouchableOpacity style={styles.earningsCard} activeOpacity={0.85}>
                        <View style={styles.earningsLeft}>
                            <View style={styles.earningsLabelRow}>
                                <Ionicons name="cash-outline" size={16} color="#16a34a" />
                                <Text style={styles.earningsLabel}>  This Month's Earnings</Text>
                            </View>
                            <Text style={styles.earningsAmount}>$1,245</Text>
                            <View style={styles.trendRow}>
                                <Ionicons name="trending-up-outline" size={14} color="#16a34a" />
                                <Text style={styles.trendText}>  +12% from last month</Text>
                            </View>
                        </View>
                        <View style={styles.earningsRight}>
                            <Text style={styles.jobsDoneCount}>28</Text>
                            <Text style={styles.jobsDoneLabel}>Jobs Done</Text>
                        </View>
                        <Text style={styles.earningsTap}>Tap to view detailed statistics →</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {[
                        { icon: 'star', color: '#f59e0b', value: '4.8', label: 'Rating' },
                        { icon: 'calendar-outline', color: '#3b82f6', value: '3', label: 'Today' },
                        { icon: 'checkmark-circle-outline', color: '#16a34a', value: '28', label: 'Completed' },
                    ].map((stat) => (
                        <View key={stat.label} style={styles.statCard}>
                            <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Available Jobs */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Available Jobs</Text>
                        {!loading && (
                            <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>{jobs.length} New</Text>
                            </View>
                        )}
                    </View>

                    {loading ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator size="large" color="#16a34a" />
                            <Text style={styles.loadingText}>Fetching available jobs...</Text>
                        </View>
                    ) : jobs.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Ionicons name="car-outline" size={48} color="#d1d5db" />
                            <Text style={styles.emptyTitle}>No Jobs Available</Text>
                            <Text style={styles.emptySubtitle}>Check back soon for new bookings</Text>
                        </View>
                    ) : (
                        jobs.map((job) => (
                            <View key={job.id} style={styles.jobCard}>
                                <View style={styles.jobCardHeader}>
                                    <View style={styles.jobCardLeft}>
                                        <View style={styles.jobNameRow}>
                                            <Text style={styles.jobName}>{job.name}</Text>
                                            <PriorityBadge priority={job.priority} />
                                        </View>
                                        <Text style={styles.jobVehicle}>{job.vehicle}</Text>
                                    </View>
                                    <View style={styles.jobCardRight}>
                                        <Text style={styles.jobAmount}>{job.amount}</Text>
                                        <Text style={styles.jobDistance}>{job.distance}</Text>
                                    </View>
                                </View>

                                <View style={styles.serviceBox}>
                                    <Ionicons name="car-sport-outline" size={14} color="#2563eb" />
                                    <Text style={styles.serviceText}>  {job.service}</Text>
                                </View>

                                <View style={styles.jobDetails}>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="location-outline" size={14} color="#6b7280" />
                                        <Text style={styles.detailText}>{job.address}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                                        <Text style={styles.detailText}>{formatDate(job.date)}</Text>
                                        <Ionicons name="time-outline" size={14} color="#6b7280" style={{ marginLeft: 10 }} />
                                        <Text style={styles.detailText}>{job.time}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.acceptBtn, accepting === job.id && styles.acceptBtnDisabled]}
                                    activeOpacity={0.8}
                                    onPress={() => handleAcceptJob(job.id)}
                                    disabled={accepting === job.id}
                                >
                                    {accepting === job.id ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.acceptBtnText}>Accept Job</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))
                    )}

                    {/* Pro Tip */}
                    {!loading && jobs.length > 0 && (
                        <View style={styles.proTipCard}>
                            <View style={styles.proTipIcon}>
                                <Ionicons name="star" size={22} color="#d97706" />
                            </View>
                            <View style={styles.proTipContent}>
                                <Text style={styles.proTipTitle}>Pro Tip</Text>
                                <Text style={styles.proTipBody}>
                                    Jobs with Priority or VIP badges pay 15–30% more! Accept them quickly before they're taken.
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                {[
                    { key: 'home', icon: 'home-outline', label: 'Home' },
                    { key: 'jobs', icon: 'briefcase-outline', label: 'My Jobs' },
                    { key: 'earnings', icon: 'cash-outline', label: 'Earnings' },
                    { key: 'shop', icon: 'cart-outline', label: 'Shop' },
                    { key: 'profile', icon: 'person-outline', label: 'Profile' },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={styles.navItem}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={22}
                            color={activeTab === tab.key ? '#16a34a' : '#9ca3af'}
                        />
                        <Text style={[styles.navLabel, activeTab === tab.key && styles.navLabelActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f9fafb' },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 90 },
    header: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    welcomeText: { color: '#dcfce7', fontSize: 14, marginBottom: 4 },
    providerName: { color: '#fff', fontSize: 26, fontWeight: '700' },
    profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    earningsCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 16, flexDirection: 'row', flexWrap: 'wrap', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
    earningsLeft: { flex: 1 },
    earningsLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    earningsLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
    earningsAmount: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 4 },
    trendRow: { flexDirection: 'row', alignItems: 'center' },
    trendText: { fontSize: 12, color: '#16a34a', fontWeight: '500' },
    earningsRight: { alignItems: 'center', justifyContent: 'center', paddingLeft: 16 },
    jobsDoneCount: { fontSize: 32, fontWeight: '800', color: '#16a34a' },
    jobsDoneLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
    earningsTap: { width: '100%', textAlign: 'center', marginTop: 10, fontSize: 12, color: '#9ca3af' },
    statsGrid: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -20, gap: 10, marginBottom: 8 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    statValue: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 6 },
    statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
    section: { paddingHorizontal: 16, marginTop: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    newBadge: { marginLeft: 10, backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    newBadgeText: { color: '#16a34a', fontSize: 12, fontWeight: '600' },
    loadingBox: { alignItems: 'center', paddingVertical: 40 },
    loadingText: { marginTop: 12, color: '#9ca3af', fontSize: 14 },
    emptyBox: { alignItems: 'center', paddingVertical: 40 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12 },
    emptySubtitle: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
    jobCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    jobCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    jobCardLeft: { flex: 1 },
    jobNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    jobName: { fontSize: 16, fontWeight: '700', color: '#111827' },
    jobVehicle: { fontSize: 13, color: '#6b7280' },
    jobCardRight: { alignItems: 'flex-end' },
    jobAmount: { fontSize: 20, fontWeight: '800', color: '#16a34a' },
    jobDistance: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    serviceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 10, alignSelf: 'flex-start' },
    serviceText: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
    jobDetails: { gap: 6, marginBottom: 14 },
    detailRow: { flexDirection: 'row', alignItems: 'center' },
    detailText: { fontSize: 13, color: '#6b7280', marginLeft: 6 },
    acceptBtn: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    acceptBtnDisabled: { backgroundColor: '#86efac' },
    acceptBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    proTipCard: { flexDirection: 'row', backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 16, padding: 16, marginTop: 4, marginBottom: 16, alignItems: 'flex-start' },
    proTipIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    proTipContent: { flex: 1 },
    proTipTitle: { fontSize: 15, fontWeight: '700', color: '#92400e', marginBottom: 4 },
    proTipBody: { fontSize: 13, color: '#b45309', lineHeight: 19 },
    bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', paddingBottom: 20, paddingTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 10 },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    navLabel: { fontSize: 10, color: '#9ca3af', marginTop: 3, fontWeight: '500' },
    navLabelActive: { color: '#16a34a', fontWeight: '600' },
});