import { apiFetch } from '@/services/apiClient';
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Booking {
    id: string;
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    totalPrice: number;
    currency: string;
    paidWithSubscription: boolean;
    service: {
        name: string;
    };
    customer: {
        displayName: string;
    };
    vehicle: {
        make: string;
        model: string;
    };
}

export default function WasherBookingsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'confirmed' | 'completed'>('confirmed');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadBookings();
    }, [activeTab]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const status = activeTab === 'confirmed' ? 'confirmed,in_progress' : 'completed';
            const data = await apiFetch(`/bookings?status=${status}`, {}, 'provider');

            if (data.success) {
                setBookings(data.data.bookings);
            }
        } catch (error) {
            console.error('Load bookings error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBookings();
    };

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            confirmed: '#4CAF50',
            in_progress: '#2196F3',
            completed: '#9E9E9E',
        };
        return colors[status] || '#999';
    };

    const renderBookingCard = ({ item }: { item: Booking }) => (
        <TouchableOpacity
            style={styles.bookingCard}
            onPress={() => router.push(`/washer-booking-details?id=${item.id}` as Href)}
        >
            <View style={styles.bookingHeader}>
                <View style={styles.bookingInfo}>
                    <Text style={styles.serviceName}>{item.service.name}</Text>
                    <Text style={styles.customerName}>{item.customer.displayName}</Text>
                    <Text style={styles.vehicleInfo}>
                        {item.vehicle.make} {item.vehicle.model}
                    </Text>
                </View>

                <View style={styles.priceContainer}>
                    <Text style={styles.price}>
                        {item.paidWithSubscription ? (
                            <Text style={{ color: '#4CAF50' }}>PAID</Text>
                        ) : (
                            `${item.currency} ${item.totalPrice.toLocaleString()}`
                        )}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusBadgeText}>
                            {item.status === 'in_progress' ? 'In Progress' : item.status}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.bookingFooter}>
                <View style={styles.footerItem}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.footerText}>{item.scheduledDate}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.footerText}>{item.scheduledTime}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateTitle}>
                {activeTab === 'confirmed' ? 'No Active Bookings' : 'No Completed Bookings'}
            </Text>
            <Text style={styles.emptyStateText}>
                {activeTab === 'confirmed'
                    ? 'Accepted bookings will appear here'
                    : 'Your completed jobs will appear here'}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Bookings</Text>
                <TouchableOpacity onPress={loadBookings}>
                    <Ionicons name="refresh" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'confirmed' && styles.activeTab]}
                    onPress={() => setActiveTab('confirmed')}
                >
                    <Text style={[styles.tabText, activeTab === 'confirmed' && styles.activeTabText]}>
                        Active
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                    onPress={() => setActiveTab('completed')}
                >
                    <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
                        Completed
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Bookings List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderBookingCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#999',
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    bookingCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    bookingInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    customerName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    vehicleInfo: {
        fontSize: 14,
        color: '#007AFF',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFF',
    },
    bookingFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    footerText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 6,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
});