import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Star, X } from 'lucide-react-native';
import { usageService } from '../services/UsageService';
import { useToast } from '../components/Toast';

const { width } = Dimensions.get('window');

export default function PaywallScreen({ navigation }: any) {
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const items = await usageService.getProducts();
            setProducts(items);
            if (items.length > 0) {
                setSelectedProduct(items[0]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribe = async () => {
        if (!selectedProduct) return;

        try {
            setIsLoading(true);
            const success = await usageService.purchaseSubscription(selectedProduct.productId);
            if (success) {
                showToast('Welcome to Premium!', 'success');
                navigation.goBack();
            }
        } catch (e) {
            showToast('Purchase could not be completed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        setIsLoading(true);
        showToast('Restoring purchases...', 'info');
        const success = await usageService.restorePurchases();
        setIsLoading(false);
        if (success) {
            showToast('Purchases restored successfully!', 'success');
            navigation.goBack();
        } else {
            showToast('No active subscription found', 'error');
        }
    };

    const handleClose = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <X size={24} color="#94A3B8" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.iconContainer}>
                    <Star size={64} color="#F59E0B" fill="#F59E0B" />
                </View>

                <Text style={styles.title}>Unlock Full Access</Text>
                <Text style={styles.subtitle}>
                    Get unlimited cry translations, smart sleep predictions, and more.
                </Text>

                <View style={styles.featuresList}>
                    <FeatureItem text="Unlimited Cry Translations" />
                    <FeatureItem text="Smart Sleep Window Predictions" />
                    <FeatureItem text="Personalized Soothing Sounds" />
                    <FeatureItem text="Baby Milestone Journal" />
                </View>

                <View style={styles.pricingContainer}>
                    {isLoading && products.length === 0 ? (
                        <ActivityIndicator size="large" color="#6366F1" style={{ marginBottom: 20 }} />
                    ) : (
                        <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe} disabled={isLoading}>
                            <Text style={styles.subscribeTitle}>
                                {selectedProduct ? `Start Free Trial` : 'Loading...'}
                            </Text>
                            <Text style={styles.subscribeSubtitle}>
                                {selectedProduct ? `Then ${selectedProduct.localizedPrice || selectedProduct.price}/month` : ''}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={handleRestore}>
                        <Text style={styles.restoreText}>Restore Purchases</Text>
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                        Cancel anytime. No commitment.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function FeatureItem({ text }: { text: string }) {
    return (
        <View style={styles.featureItem}>
            <View style={styles.checkContainer}>
                <Check size={16} color="#FFF" />
            </View>
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 24,
        zIndex: 10,
        padding: 8,
    },
    content: {
        padding: 24,
        alignItems: 'center',
        paddingTop: 60,
    },
    iconContainer: {
        marginBottom: 24,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#F8FAFC',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 18,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 48,
        lineHeight: 26,
    },
    featuresList: {
        width: '100%',
        marginBottom: 48,
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    checkContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 16,
        color: '#E2E8F0',
        fontWeight: '500',
    },
    pricingContainer: {
        width: '100%',
        alignItems: 'center',
    },
    subscribeButton: {
        width: '100%',
        backgroundColor: '#6366F1',
        paddingVertical: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    subscribeTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    subscribeSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    disclaimer: {
        fontSize: 12,
        color: '#64748B',
    },
    restoreText: {
        fontSize: 14,
        color: '#818CF8',
        fontWeight: '600',
        marginBottom: 24,
        marginTop: 8,
    },
});
