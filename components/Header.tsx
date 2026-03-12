import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    rightElement?: React.ReactNode;
    theme?: 'light' | 'dark';
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = true, rightElement, theme = 'light' }) => {
    const router = useRouter();
    const { userType } = useAuth();

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            // Fallback: If no history, go to the appropriate home screen
            // This prevents accidental redirect to index -> login
            if (userType === 'provider') {
                router.replace('/washer-home' as any);
            } else {
                router.replace('/customer-home' as any);
            }
        }
    };

    const isDark = theme === 'dark';

    return (
        <View style={[styles.header, isDark && styles.headerDark]}>
            <View style={styles.leftContainer}>
                {showBack && (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={isDark ? "#FFF" : "#2563eb"} />
                        {Platform.OS === 'ios' && <Text style={[styles.backText, isDark && styles.backTextDark]}>Back</Text>}
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.titleContainer}>
                <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]} numberOfLines={1}>{title}</Text>
            </View>
            <View style={styles.rightContainer}>
                {rightElement || <View style={{ width: 40 }} />}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        zIndex: 100,
    },
    headerDark: {
        backgroundColor: '#0d1629',
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    leftContainer: {
        flex: 1,
        alignItems: 'flex-start',
    },
    titleContainer: {
        flex: 2,
        alignItems: 'center',
    },
    rightContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: -4,
    },
    backText: {
        fontSize: 17,
        color: '#2563eb',
        marginLeft: -4,
    },
    backTextDark: {
        color: '#FFF',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    headerTitleDark: {
        color: '#FFF',
    },
});
