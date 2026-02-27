import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    duration: number;
    rating: number;
    reviewCount: number;
    categoryId: string;
    images: string[];
}

interface Category {
    id: string;
    name: string;
    icon: string;
    description: string;
}

export default function ServiceDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const serviceId = params.id as string;

    const [service, setService] = useState<Service | null>(null);
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serviceId) {
            Alert.alert('Error', 'Service not found');
            router.back();
            return;
        }
        loadServiceDetails();
    }, []);

    const loadServiceDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `http://172.20.10.4:8859/api/customer/services/${serviceId}`
            );
            const data = await response.json();

            if (data.success) {
                setService(data.data.service);

                // Load category details
                if (data.data.service.category) {
                    setCategory(data.data.service.category);
                }
            } else {
                Alert.alert('Error', 'Service not found');
                router.back();
            }
        } catch (error) {
            console.error('Load service error:', error);
            Alert.alert('Error', 'Failed to load service details');
        } finally {
            setLoading(false);
        }
    };

    const getServiceFeatures = (categoryId: string) => {
        const features: { [key: string]: string[] } = {
            'basic-wash': [
                'Exterior body wash',
                'Wheel cleaning',
                'Window cleaning',
                'Tire shine',
                'Quick dry',
            ],
            'premium-wash': [
                'Full exterior wash',
                'Interior vacuuming',
                'Dashboard cleaning',
                'Seat cleaning',
                'Door panel wiping',
                'Air freshener',
            ],
            'detailing': [
                'Complete exterior detailing',
                'Clay bar treatment',
                'Paint correction',
                'Interior deep clean',
                'Leather conditioning',
                'Engine bay cleaning',
            ],
            'interior-clean': [
                'Deep vacuum cleaning',
                'Seat shampooing',
                'Dashboard detailing',
                'Door panel cleaning',
                'Floor mat cleaning',
                'Odor removal',
            ],
            'ceramic-coating': [
                'Full wash & prep',
                'Paint decontamination',
                'Professional ceramic coating',
                '2+ years protection',
                'UV protection',
                'Hydrophobic finish',
            ],
            'tire-cleaning': [
                'Tire deep cleaning',
                'Wheel detailing',
                'Brake dust removal',
                'Tire shine application',
                'Wheel protection',
            ],
        };

        return features[categoryId] || [
            'Professional service',
            'Quality products',
            'Experienced washers',
        ];
    };

    const getCategoryIcon = (iconName: string) => {
        const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
            'droplets': 'water',
            'sparkles': 'sparkles',
            'star': 'star',
            'car': 'car',
            'shield': 'shield',
            'circle': 'ellipse',
        };
        return iconMap[iconName] || 'car';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading service...</Text>
            </View>
        );
    }

    if (!service) {
        return (
            <View style={styles.loadingContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#999" />
                <Text style={styles.errorText}>Service not found</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const features = getServiceFeatures(service.categoryId);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton}>
                    <Ionicons name="heart-outline" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Service Image/Icon */}
                <View style={styles.imageContainer}>
                    <View style={styles.categoryIconLarge}>
                        {category && (
                            <Ionicons
                                name={getCategoryIcon(category.icon)}
                                size={80}
                                color="#007AFF"
                            />
                        )}
                    </View>
                </View>

                {/* Service Info */}
                <View style={styles.infoSection}>
                    {/* Category Badge */}
                    {category && (
                        <View style={styles.categoryBadge}>
                            <Ionicons
                                name={getCategoryIcon(category.icon)}
                                size={16}
                                color="#007AFF"
                            />
                            <Text style={styles.categoryBadgeText}>{category.name}</Text>
                        </View>
                    )}

                    {/* Service Name */}
                    <Text style={styles.serviceName}>{service.name}</Text>

                    {/* Rating */}
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={20} color="#FFD700" />
                        <Text style={styles.ratingText}>
                            {service.rating} ({service.reviewCount} reviews)
                        </Text>
                    </View>

                    {/* Description */}
                    <Text style={styles.description}>{service.description}</Text>

                    {/* Duration & Price */}
                    <View style={styles.metaContainer}>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={24} color="#666" />
                            <View style={styles.metaText}>
                                <Text style={styles.metaLabel}>Duration</Text>
                                <Text style={styles.metaValue}>~{service.duration} minutes</Text>
                            </View>
                        </View>

                        <View style={styles.metaDivider} />

                        <View style={styles.metaItem}>
                            <Ionicons name="cash-outline" size={24} color="#666" />
                            <View style={styles.metaText}>
                                <Text style={styles.metaLabel}>Price</Text>
                                <Text style={styles.metaValue}>
                                    {service.currency} {service.price.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* What's Included */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What's Included</Text>
                    {features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    ))}
                </View>

                {/* How It Works */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How It Works</Text>

                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Book the Service</Text>
                            <Text style={styles.stepDescription}>
                                Select your vehicle, choose date & time, and confirm booking
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Provider Accepts</Text>
                            <Text style={styles.stepDescription}>
                                Available washers compete to accept your booking (fastest wins!)
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Get Your Car Washed</Text>
                            <Text style={styles.stepDescription}>
                                Washer arrives at your location and completes the service
                            </Text>
                        </View>
                    </View>

                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>4</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Rate & Review</Text>
                            <Text style={styles.stepDescription}>
                                Share your experience to help other customers
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Why Choose Us */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Why Choose WashXpress</Text>

                    <View style={styles.benefitItem}>
                        <Ionicons name="flash" size={24} color="#007AFF" />
                        <View style={styles.benefitContent}>
                            <Text style={styles.benefitTitle}>Fast Response</Text>
                            <Text style={styles.benefitDescription}>
                                Multiple washers compete for your booking
                            </Text>
                        </View>
                    </View>

                    <View style={styles.benefitItem}>
                        <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
                        <View style={styles.benefitContent}>
                            <Text style={styles.benefitTitle}>Verified Washers</Text>
                            <Text style={styles.benefitDescription}>
                                All washers are background-checked and rated
                            </Text>
                        </View>
                    </View>

                    <View style={styles.benefitItem}>
                        <Ionicons name="star" size={24} color="#007AFF" />
                        <View style={styles.benefitContent}>
                            <Text style={styles.benefitTitle}>Quality Guaranteed</Text>
                            <Text style={styles.benefitDescription}>
                                Professional service with money-back guarantee
                            </Text>
                        </View>
                    </View>

                    <View style={styles.benefitItem}>
                        <Ionicons name="location" size={24} color="#007AFF" />
                        <View style={styles.benefitContent}>
                            <Text style={styles.benefitTitle}>At Your Location</Text>
                            <Text style={styles.benefitDescription}>
                                Service comes to you - home, office, or anywhere
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Note about Provider Assignment */}
                <View style={styles.noteSection}>
                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                    <Text style={styles.noteText}>
                        Your washer will be assigned after booking. Available washers in your area will compete to accept your request.
                    </Text>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Book Button */}
            <View style={styles.footer}>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Total Price</Text>
                    <Text style={styles.priceAmount}>
                        {service.currency} {service.price.toLocaleString()}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => router.push(`/customerOrderScreen?serviceId=${service.id}`)}
                >
                    <Text style={styles.bookButtonText}>Book Now</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 18,
        color: '#666',
        marginTop: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    imageContainer: {
        height: 200,
        backgroundColor: '#F0F8FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryIconLarge: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoSection: {
        padding: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#F5F5F5',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F0F8FF',
        borderRadius: 16,
        marginBottom: 12,
    },
    categoryBadgeText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
        marginLeft: 6,
    },
    serviceName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 12,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    ratingText: {
        fontSize: 16,
        color: '#666',
        marginLeft: 8,
        fontWeight: '500',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#666',
        marginBottom: 24,
    },
    metaContainer: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
    },
    metaItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        marginLeft: 12,
    },
    metaLabel: {
        fontSize: 12,
        color: '#999',
    },
    metaValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginTop: 4,
    },
    metaDivider: {
        width: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 16,
    },
    section: {
        padding: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#F5F5F5',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    stepNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    stepNumberText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    benefitContent: {
        flex: 1,
        marginLeft: 16,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    benefitDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    noteSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        margin: 20,
        padding: 16,
        backgroundColor: '#F0F8FF',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    noteText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginLeft: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    priceAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    bookButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginRight: 8,
    },
    backButton: {
        padding: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        marginTop: 20,
    },
    backButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
