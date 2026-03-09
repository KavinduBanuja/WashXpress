import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    visible: boolean;
    onAgree: () => void;
    onCancel: () => void;
}

const { width, height } = Dimensions.get('window');

export default function SubscriptionAgreementModal({ visible, onAgree, onCancel }: Props) {
    const [agreed, setAgreed] = useState(false);

    const handleAgree = () => {
        if (agreed) {
            onAgree();
            setAgreed(false); // reset for next time if needed
        }
    };

    const policies = [
        { id: 1, text: "Scheduled subscription-based car wash visits" },
        { id: 2, text: "Professional, background-verified washers" },
        { id: 3, text: "Respect for customer property and parking spaces" },
        { id: 4, text: "Secure handling of customer location and personal data" },
        { id: 5, text: "Limited liability for pre-existing vehicle damage" },
        { id: 6, text: "Easy cancellation or subscription management within the app" },
    ];

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="water" size={32} color="#2563eb" />
                        </View>
                        <Text style={styles.title}>Subscription Service Agreement</Text>
                        <Text style={styles.subtitle}>Please read and agree to our terms before proceeding.</Text>
                    </View>

                    {/* Policy List */}
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        <View style={styles.policiesContainer}>
                            {policies.map((policy) => (
                                <View key={policy.id} style={styles.policyRow}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10b981" style={styles.bulletIcon} />
                                    <Text style={styles.policyText}>{policy.text}</Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Footer Controls */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setAgreed(!agreed)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={agreed ? "checkbox" : "square-outline"}
                                size={24}
                                color={agreed ? "#2563eb" : "#9ca3af"}
                            />
                            <Text style={styles.checkboxLabel}>I have read and agree to the terms</Text>
                        </TouchableOpacity>

                        <View style={styles.buttonGroup}>
                            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.agreeButton, !agreed && styles.agreeButtonDisabled]}
                                onPress={handleAgree}
                                disabled={!agreed}
                            >
                                <Text style={styles.agreeButtonText}>I Agree & Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.9,
        maxHeight: height * 0.85,
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 24,
    },
    header: {
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    scrollView: {
        paddingHorizontal: 24,
    },
    policiesContainer: {
        paddingVertical: 16,
    },
    policyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    bulletIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    policyText: {
        flex: 1,
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
    },
    footer: {
        padding: 24,
        backgroundColor: '#f9fafb',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkboxLabel: {
        marginLeft: 12,
        fontSize: 15,
        color: '#4b5563',
        flex: 1,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
    },
    cancelButtonText: {
        color: '#4b5563',
        fontSize: 16,
        fontWeight: '600',
    },
    agreeButton: {
        flex: 2,
        backgroundColor: '#2563eb',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    agreeButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
        elevation: 0,
    },
    agreeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
