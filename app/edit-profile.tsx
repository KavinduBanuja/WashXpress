import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';

export default function EditProfileScreen() {
    const { userType } = useAuth();
    const { data: profile, isLoading } = useProfile();
    const updateProfileMutation = useUpdateProfile();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [area, setArea] = useState('');
    const [photoURL, setPhotoURL] = useState('');

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (profile) {
            setFirstName(profile.firstName || '');
            setLastName(profile.lastName || '');
            setPhoneNumber(profile.phoneNumber || '');
            setDisplayName(profile.displayName || '');
            setArea(profile.area || '');
            setPhotoURL(profile.photoURL || '');
        }
    }, [profile]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!firstName.trim() && !displayName.trim()) {
            newErrors.name = 'First Name or Display Name is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;

        // Determine a fallback displayName if not provided
        const finalDisplayName = displayName.trim() || `${firstName.trim()} ${lastName.trim()}`.trim();

        const updateData: any = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber: phoneNumber.trim(),
            displayName: finalDisplayName,
            photoURL: photoURL.trim(),
        };

        if (userType === 'provider') {
            updateData.area = area.trim();
        }

        console.log("Saving profile data:", updateData);

        updateProfileMutation.mutate(
            updateData,
            {
                onSuccess: () => {
                    console.log("✅ Profile update successful");
                    Alert.alert('Success', 'Profile updated successfully', [
                        {
                            text: 'OK', onPress: () => {
                                console.log("Navigating back to Profile...");
                                router.back();
                            }
                        }
                    ]);
                },
                onError: (err) => {
                    console.error("❌ Profile update error:", err);
                    Alert.alert('Error', err.message || 'Failed to update profile. Please try again.');
                }
            }
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    const isDark = userType === 'provider';

    return (
        <KeyboardAvoidingView
            style={[styles.container, isDark && styles.containerDark]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Header title="Edit Profile" theme={isDark ? 'dark' : 'light'} />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, isDark && styles.labelDark]}>Display Name</Text>
                    <TextInput
                        style={[styles.input, isDark && styles.inputDark]}
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="How should we call you?"
                        placeholderTextColor={isDark ? "#64748b" : "#999"}
                    />
                </View>
                
                <View style={styles.formGroup}>
                    <Text style={[styles.label, isDark && styles.labelDark]}>Profile Picture URL</Text>
                    <TextInput
                        style={[styles.input, isDark && styles.inputDark]}
                        value={photoURL}
                        onChangeText={setPhotoURL}
                        placeholder="https://example.com/photo.jpg"
                        placeholderTextColor={isDark ? "#64748b" : "#999"}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, isDark && styles.labelDark]}>First Name</Text>
                    <TextInput
                        style={[styles.input, isDark && styles.inputDark]}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="First Name"
                        placeholderTextColor={isDark ? "#64748b" : "#999"}
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, isDark && styles.labelDark]}>Last Name</Text>
                    <TextInput
                        style={[styles.input, isDark && styles.inputDark]}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Last Name"
                        placeholderTextColor={isDark ? "#64748b" : "#999"}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, isDark && styles.labelDark]}>Phone Number</Text>
                    <TextInput
                        style={[styles.input, isDark && styles.inputDark]}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="e.g. +1 234 567 8900"
                        placeholderTextColor={isDark ? "#64748b" : "#999"}
                        keyboardType="phone-pad"
                    />
                </View>

                {userType === 'provider' && (
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, isDark && styles.labelDark]}>Service Area</Text>
                        <TextInput
                            style={[styles.input, isDark && styles.inputDark]}
                            value={area}
                            onChangeText={setArea}
                            placeholder="e.g. Colombo, Pelawatta"
                            placeholderTextColor={isDark ? "#64748b" : "#999"}
                        />
                    </View>
                )}

                {/* Email is typically read-only or handled separately via Auth providers */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, isDark && styles.labelDark]}>Email (Read-only)</Text>
                    <TextInput
                        style={[styles.input, styles.readOnlyInput, isDark && styles.readOnlyInputDark]}
                        value={profile?.email || ''}
                        editable={false}
                    />
                </View>

            </ScrollView>

            <View style={[styles.footer, isDark && styles.footerDark]}>
                <TouchableOpacity
                    style={[styles.saveButton, updateProfileMutation.isPending && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={updateProfileMutation.isPending}
                >
                    {updateProfileMutation.isPending ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    containerDark: {
        backgroundColor: '#0d1629',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    scrollContent: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    labelDark: {
        color: '#94a3b8',
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#000',
    },
    inputDark: {
        backgroundColor: '#1e2d4a',
        borderColor: 'rgba(255,255,255,0.06)',
        color: '#FFF',
    },
    readOnlyInput: {
        backgroundColor: '#F0F0F0',
        color: '#666',
    },
    readOnlyInputDark: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: '#64748b',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    footerDark: {
        backgroundColor: '#0d1629',
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    saveButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
