import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, SafeAreaView, StatusBar, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Priority = 'VIP' | 'Priority' | 'Standard';
type Status = 'upcoming' | 'completed';

interface Job {
    id: string; name: string; phone: string; vehicle: string;
    service: string; address: string; date: string; time: string;
    amount: number; distance: string; priority: Priority;
    status: Status; coordinates: { lat: number; lng: number };
}

const JOBS: Job[] = [
    { id: '1', name: 'John Smith', phone: '+1 (555) 123-4567', vehicle: 'Toyota Camry • Silver • ABC1234', service: 'Premium Polish', address: '123 Main Street, Downtown, CA 90210', date: '2026-01-20', time: '10:00 AM', amount: 35, distance: '2.3 miles', priority: 'Priority', status: 'upcoming', coordinates: { lat: 34.0522, lng: -118.2437 } },
    { id: '2', name: 'Sarah Johnson', phone: '+1 (555) 234-5678', vehicle: 'Honda CR-V • White • XYZ5678', service: 'Basic Shine', address: '456 Oak Avenue, North Side, CA 90211', date: '2026-01-20', time: '2:00 PM', amount: 25, distance: '4.1 miles', priority: 'Standard', status: 'upcoming', coordinates: { lat: 34.0689, lng: -118.4452 } },
    { id: '3', name: 'Michael Brown', phone: '+1 (555) 345-6789', vehicle: 'BMW X5 • Black • LMN9012', service: 'Ultimate Detail', address: '789 Elm Road, West End, CA 90212', date: '2026-01-21', time: '9:00 AM', amount: 50, distance: '1.8 miles', priority: 'VIP', status: 'upcoming', coordinates: { lat: 34.0195, lng: -118.4912 } },
    { id: '4', name: 'Emily Davis', phone: '+1 (555) 456-7890', vehicle: 'Tesla Model 3 • Blue • QRS3456', service: 'One-Time Wash', address: '321 Pine Street, East District, CA 90213', date: '2026-01-19', time: '4:00 PM', amount: 15, distance: '3.5 miles', priority: 'Standard', status: 'completed', coordinates: { lat: 34.0736, lng: -118.2400 } },
    { id: '5', name: 'David Wilson', phone: '+1 (555) 567-8901', vehicle: 'Ford F-150 • Red • TUV7890', service: 'Premium Polish', address: '654 Maple Drive, South Area, CA 90214', date: '2026-01-18', time: '11:00 AM', amount: 35, distance: '2.7 miles', priority: 'Priority', status: 'completed', coordinates: { lat: 33.9731, lng: -118.2479 } },
];

const TODAY = '2026-01-20';

function formatDate(dateStr: string) {
    if (dateStr === TODAY) return 'Today';
    const tomorrow = new Date(TODAY);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isToday(dateStr: string) { return dateStr === TODAY; }

function PriorityBadge({ priority }: { priority: Priority }) {
    const map = {
        VIP: { bg: '#f3e8ff', text: '#7c3aed' },
        Priority: { bg: '#dbeafe', text: '#1d4ed8' },
        Standard: { bg: '#f3f4f6', text: '#6b7280' },
    };
    const s = map[priority];
    return (
        <View style={[b.wrap, { backgroundColor: s.bg }]}>
            <Text style={[b.text, { color: s.text }]}>{priority}</Text>
        </View>
    );
}
const b = StyleSheet.create({
    wrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginLeft: 6 },
    text: { fontSize: 11, fontWeight: '600' },
});

export default function MyJobs() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('jobs');

    const upcoming = JOBS.filter(j => j.status === 'upcoming');
    const completed = JOBS.filter(j => j.status === 'completed');
    const todayJobs = upcoming.filter(j => isToday(j.date)).sort((a, b) => a.time.localeCompare(b.time));
    const pendingTotal = upcoming.reduce((s, j) => s + j.amount, 0);

    const onBack = () => router.back();
    const onCreateRoute = (_: string, address: string) => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`);
    const onCreateDayRoute = (addresses: string[]) => {
        if (addresses.length === 0) { Alert.alert('No jobs scheduled for today!'); return; }
        Linking.openURL(`https://maps.google.com/maps?waypoints=${addresses.map(a => encodeURIComponent(a)).join('/')}`);
    };
    const onViewDetails = (jobId: string) => Alert.alert('View Details', `Job ID: ${jobId}`);

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#16a34a" />

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={s.headerCenter}>
                    <Text style={s.headerTitle}>My Jobs</Text>
                    <Text style={s.headerSub}>Accepted & completed jobs</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Stats Row */}
                <View style={s.statsRow}>
                    <View style={[s.statCard, { backgroundColor: '#f0fdf4' }]}>
                        <Ionicons name="calendar-outline" size={22} color="#16a34a" />
                        <Text style={[s.statNum, { color: '#16a34a' }]}>{upcoming.length}</Text>
                        <Text style={s.statLabel}>Upcoming</Text>
                    </View>
                    <View style={[s.statCard, { backgroundColor: '#f0fdf4' }]}>
                        <Ionicons name="checkmark-circle-outline" size={22} color="#16a34a" />
                        <Text style={[s.statNum, { color: '#16a34a' }]}>{completed.length}</Text>
                        <Text style={s.statLabel}>Completed</Text>
                    </View>
                    <View style={[s.statCard, { backgroundColor: '#f0fdf4' }]}>
                        <Ionicons name="cash-outline" size={22} color="#16a34a" />
                        <Text style={[s.statNum, { color: '#16a34a' }]}>${pendingTotal}</Text>
                        <Text style={s.statLabel}>Pending</Text>
                    </View>
                </View>

                {/* Full Day Route CTA */}
                <TouchableOpacity style={s.routeBtn} activeOpacity={0.85} onPress={() => onCreateDayRoute(todayJobs.map(j => j.address))}>
                    <Ionicons name="navigate-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
                    <View>
                        <Text style={s.routeBtnTitle}>Get Full Day Route</Text>
                        <Text style={s.routeBtnSub}>
                            {todayJobs.length > 0 ? `${todayJobs.length} job${todayJobs.length > 1 ? 's' : ''} today • Optimized route` : 'No jobs scheduled for today'}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Upcoming Jobs */}
                <Text style={s.sectionTitle}>Upcoming Jobs</Text>
                {upcoming.length === 0 ? (
                    <View style={s.emptyCard}>
                        <Ionicons name="briefcase-outline" size={48} color="#d1d5db" />
                        <Text style={s.emptyTitle}>No upcoming jobs</Text>
                        <Text style={s.emptySubtitle}>Check available jobs to accept new work</Text>
                    </View>
                ) : (
                    upcoming.map(job => {
                        const today = isToday(job.date);
                        return (
                            <View key={job.id} style={[s.jobCard, today && s.jobCardToday]}>
                                <View style={s.cardHeader}>
                                    <View style={s.cardLeft}>
                                        <View style={s.nameRow}>
                                            <Text style={s.jobName}>{job.name}</Text>
                                            <PriorityBadge priority={job.priority} />
                                        </View>
                                        <Text style={s.jobVehicle}>{job.vehicle}</Text>
                                        <TouchableOpacity style={s.phoneRow} onPress={() => Linking.openURL(`tel:${job.phone}`)}>
                                            <Ionicons name="call-outline" size={13} color="#16a34a" />
                                            <Text style={s.phoneText}>{job.phone}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={s.cardRight}>
                                        <Text style={s.jobAmount}>${job.amount}</Text>
                                        <Text style={s.jobDistance}>{job.distance}</Text>
                                    </View>
                                </View>

                                <View style={s.serviceBox}>
                                    <Ionicons name="car-sport-outline" size={14} color="#16a34a" />
                                    <Text style={s.serviceText}>  {job.service}</Text>
                                </View>

                                <View style={s.details}>
                                    <View style={s.detailRow}>
                                        <Ionicons name="location-outline" size={14} color="#6b7280" />
                                        <Text style={s.detailText}>{job.address}</Text>
                                    </View>
                                    <View style={s.detailRow}>
                                        <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                                        <Text style={[s.detailText, today && { color: '#16a34a', fontWeight: '600' }]}>{formatDate(job.date)}</Text>
                                    </View>
                                    <View style={s.detailRow}>
                                        <Ionicons name="time-outline" size={14} color="#6b7280" />
                                        <Text style={s.detailText}>{job.time}</Text>
                                    </View>
                                </View>

                                {today && (
                                    <View style={s.todayNotice}>
                                        <Text style={s.todayNoticeText}>📍 Job scheduled for today!</Text>
                                    </View>
                                )}

                                <View style={s.actionRow}>
                                    <TouchableOpacity style={s.dirBtn} onPress={() => onCreateRoute(job.id, job.address)}>
                                        <Ionicons name="navigate-outline" size={15} color="#fff" />
                                        <Text style={s.actionBtnText}> Directions</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.detailBtn} onPress={() => onViewDetails(job.id)}>
                                        <Ionicons name="checkmark-circle-outline" size={15} color="#fff" />
                                        <Text style={s.actionBtnText}> View Details</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                )}

                {/* Completed Jobs */}
                <Text style={s.sectionTitle}>Completed Jobs</Text>
                {completed.length === 0 ? (
                    <View style={s.emptyCard}>
                        <Ionicons name="checkmark-circle-outline" size={48} color="#d1d5db" />
                        <Text style={s.emptyTitle}>No completed jobs yet</Text>
                    </View>
                ) : (
                    completed.map(job => (
                        <View key={job.id} style={[s.jobCard, { opacity: 0.85 }]}>
                            <View style={s.cardHeader}>
                                <View style={s.cardLeft}>
                                    <View style={s.nameRow}>
                                        <Text style={s.jobName}>{job.name}</Text>
                                        <PriorityBadge priority={job.priority} />
                                    </View>
                                    <Text style={s.jobVehicle}>{job.vehicle}</Text>
                                </View>
                                <View style={s.cardRight}>
                                    <Text style={s.jobAmount}>${job.amount}</Text>
                                    <View style={s.paidBadge}>
                                        <Text style={s.paidText}>Paid</Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={s.completedMeta}>{job.service}  •  {formatDate(job.date)}  •  {job.time}</Text>
                        </View>
                    ))
                )}

                {/* Pro Tip */}
                <View style={s.tipCard}>
                    <View style={s.tipIcon}><Text style={{ fontSize: 22 }}>💡</Text></View>
                    <View style={s.tipContent}>
                        <Text style={s.tipTitle}>Pro Tip</Text>
                        <Text style={s.tipBody}>Use "Get Directions" to navigate to your job locations. Complete jobs as soon as you're done to receive payment faster!</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={s.bottomNav}>
                {[
                    { key: 'home', icon: 'home-outline', label: 'Home' },
                    { key: 'jobs', icon: 'briefcase-outline', label: 'My Jobs' },
                    { key: 'earnings', icon: 'cash-outline', label: 'Earnings' },
                    { key: 'marketplace', icon: 'cart-outline', label: 'Shop' },
                    { key: 'profile', icon: 'person-outline', label: 'Profile' },
                ].map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={s.navItem}
                        onPress={() => {
                            if (tab.key === 'home') router.push('/washer-home' as any);
                            else if (tab.key === 'marketplace') router.push('/marketplace' as any);
                            else if (tab.key === 'profile') router.push('/profile' as any);
                            else setActiveTab(tab.key);
                        }}
                    >
                        <Ionicons name={tab.icon as any} size={22} color={activeTab === tab.key ? '#16a34a' : '#9ca3af'} />
                        <Text style={[s.navLabel, activeTab === tab.key && s.navLabelActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe:             { flex: 1, backgroundColor: '#0d1629' },
    scroll:           { flex: 1 },
    scrollContent:    { paddingHorizontal: 16, paddingBottom: 100 },
  
    // Header
    header:           { backgroundColor: '#0d1629', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    backBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerCenter:     { flex: 1, alignItems: 'center' },
    headerTitle:      { color: '#fff', fontSize: 18, fontWeight: '700' },
    headerSub:        { color: '#93c5fd', fontSize: 12, marginTop: 1 },
  
    // Stats
    statsRow:         { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 4 },
    statCard:         { flex: 1, backgroundColor: '#1e2d4a', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },
    statNum:          { fontSize: 20, fontWeight: '800', marginTop: 4, color: '#2563eb' },
    statLabel:        { fontSize: 11, color: '#64748b', marginTop: 2 },
  
    // Route CTA
    routeBtn:         { backgroundColor: '#2563eb', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginTop: 14, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
    routeBtnTitle:    { color: '#fff', fontSize: 15, fontWeight: '700' },
    routeBtnSub:      { color: '#bfdbfe', fontSize: 12, marginTop: 2 },
  
    // Section
    sectionTitle:     { fontSize: 17, fontWeight: '700', color: '#fff', marginTop: 20, marginBottom: 10 },
  
    // Empty
    emptyCard:        { backgroundColor: '#1e2d4a', borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    emptyTitle:       { fontSize: 15, fontWeight: '600', color: '#94a3b8', marginTop: 10 },
    emptySubtitle:    { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  
    // Job Card
    jobCard:          { backgroundColor: '#1e2d4a', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
    jobCardToday:     { backgroundColor: '#1a3a2a', borderColor: 'rgba(37,99,235,0.3)' },
    cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    cardLeft:         { flex: 1 },
    nameRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    jobName:          { fontSize: 16, fontWeight: '700', color: '#fff' },
    jobVehicle:       { fontSize: 13, color: '#64748b', marginBottom: 4 },
    phoneRow:         { flexDirection: 'row', alignItems: 'center' },
    phoneText:        { fontSize: 13, color: '#60a5fa', fontWeight: '500', marginLeft: 4 },
    cardRight:        { alignItems: 'flex-end' },
    jobAmount:        { fontSize: 22, fontWeight: '800', color: '#2563eb' },
    jobDistance:      { fontSize: 12, color: '#64748b', marginTop: 2 },
  
    // Service Box
    serviceBox:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(37,99,235,0.15)', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 10, alignSelf: 'flex-start' },
    serviceText:      { fontSize: 13, color: '#60a5fa', fontWeight: '600' },
  
    // Details
    details:          { gap: 5, marginBottom: 12 },
    detailRow:        { flexDirection: 'row', alignItems: 'center' },
    detailText:       { fontSize: 13, color: '#94a3b8', marginLeft: 6, flex: 1 },
  
    // Today notice
    todayNotice:      { backgroundColor: 'rgba(37,99,235,0.15)', borderWidth: 1, borderColor: 'rgba(37,99,235,0.3)', borderRadius: 8, paddingVertical: 6, alignItems: 'center', marginBottom: 12 },
    todayNoticeText:  { fontSize: 13, color: '#60a5fa', fontWeight: '600' },
  
    // Action buttons
    actionRow:        { flexDirection: 'row', gap: 10 },
    dirBtn:           { flex: 1, flexDirection: 'row', backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 11, justifyContent: 'center', alignItems: 'center' },
    detailBtn:        { flex: 1, flexDirection: 'row', backgroundColor: '#1d4ed8', borderRadius: 10, paddingVertical: 11, justifyContent: 'center', alignItems: 'center' },
    actionBtnText:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  
    // Completed
    completedMeta:    { fontSize: 12, color: '#64748b', marginTop: 8 },
    paidBadge:        { backgroundColor: 'rgba(37,99,235,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
    paidText:         { color: '#60a5fa', fontSize: 11, fontWeight: '600' },
  
    // Pro Tip
    tipCard:          { flexDirection: 'row', backgroundColor: 'rgba(234,179,8,0.08)', borderWidth: 1, borderColor: 'rgba(234,179,8,0.2)', borderRadius: 16, padding: 16, marginTop: 4, marginBottom: 16, alignItems: 'flex-start' },
    tipIcon:          { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(234,179,8,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    tipContent:       { flex: 1 },
    tipTitle:         { fontSize: 15, fontWeight: '700', color: '#fbbf24', marginBottom: 4 },
    tipBody:          { fontSize: 13, color: '#d97706', lineHeight: 19 },
  
    // Bottom Nav
    bottomNav:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0d1629', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', paddingBottom: 20, paddingTop: 10, elevation: 10 },
    navItem:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
    navLabel:         { fontSize: 10, color: '#64748b', marginTop: 3, fontWeight: '500' },
    navLabelActive:   { color: '#2563eb', fontWeight: '600' },
  });