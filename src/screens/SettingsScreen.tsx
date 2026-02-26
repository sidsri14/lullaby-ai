import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Trash2, Crown, RefreshCw, Smartphone, Key, Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usageService } from '../services/UsageService';
import { feedingService } from '../services/FeedingService';
import { sleepService } from '../services/SleepService';
import { cryAnalysisService } from '../services/CryAnalysisService';
import { useToast } from '../components/Toast';



export default function SettingsScreen({ navigation }: any) {
    const { showToast } = useToast();

    const [isPremium, setIsPremium] = useState(false);
    const [version, setVersion] = useState('1.0.0');

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        const premium = await usageService.isPremium();
        setIsPremium(premium);
    };

    const handleRestorePurchases = async () => {
        showToast('Searching for active subscriptions...', 'info');
        try {
            const success = await usageService.restorePurchases();
            await checkStatus();
            if (success) {
                showToast('Premium subscription restored!', 'success');
            } else {
                showToast('No active subscription found', 'error');
            }
        } catch (e) {
            showToast('Failed to restore purchases', 'error');
        }
    };

    const handleResetPremium = async () => {
        await usageService.setPremium(false);
        await checkStatus();
        showToast('Premium status reset to Free', 'info');
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'This will permanently delete all feeding logs, sleep schedules, and cry history. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Everything',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await feedingService.clearAll();
                            await sleepService.clearAll();
                            await cryAnalysisService.clearHistory();
                            await usageService.resetStats();
                            showToast('App data cleared successfully', 'success');
                            await checkStatus();
                        } catch (e) {
                            showToast('Failed to clear some data', 'error');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Subscription Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Subscription</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                <Crown size={24} color={isPremium ? '#F59E0B' : '#94A3B8'} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Member Status</Text>
                                <Text style={[styles.value, isPremium ? styles.premiumText : styles.freeText]}>
                                    {isPremium ? 'Premium Plan' : 'Free Plan'}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.actionButton} onPress={handleRestorePurchases}>
                            <RefreshCw size={20} color="#818CF8" />
                            <Text style={styles.actionText}>Restore Purchases</Text>
                        </TouchableOpacity>

                        {isPremium && (
                            <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]} onPress={handleResetPremium}>
                                <Settings size={20} color="#94A3B8" />
                                <Text style={[styles.actionText, { color: '#94A3B8' }]}>Reset Status (Debug)</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Legal Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Legal</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.row} onPress={() => (navigation as any).navigate('Legal', { type: 'privacy' })}>
                            <View style={styles.iconBox}>
                                <Settings size={24} color="#94A3B8" />
                            </View>
                            <Text style={[styles.value, { fontSize: 16 }]}>Privacy Policy</Text>
                        </TouchableOpacity>
                        <View style={{ height: 1, backgroundColor: '#334155', marginLeft: 64, marginVertical: 12 }} />
                        <TouchableOpacity style={styles.row} onPress={() => (navigation as any).navigate('Legal', { type: 'terms' })}>
                            <View style={styles.iconBox}>
                                <Settings size={24} color="#94A3B8" />
                            </View>
                            <Text style={[styles.value, { fontSize: 16 }]}>Terms of Service</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Data Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data Management</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
                            <Trash2 size={24} color="#EF4444" />
                            <Text style={styles.dangerText}>Clear All App Data</Text>
                        </TouchableOpacity>
                        <Text style={styles.helperText}>
                            Permanently removes all tracked activities and history.
                        </Text>
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(148, 163, 184, 0.1)' }]}>
                                <Smartphone size={24} color="#94A3B8" />
                            </View>
                            <View>
                                <Text style={styles.label}>Lullaby AI</Text>
                                <Text style={styles.value}>Version {version}</Text>
                                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>
                                    Powered by Lullaby Secure Engine™
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#F8FAFC',
    },
    content: {
        padding: 24,
        gap: 32,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    label: {
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 4,
    },
    value: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F8FAFC',
    },
    premiumText: {
        color: '#F59E0B',
    },
    freeText: {
        color: '#94A3B8',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        marginTop: 16,
    },
    actionText: {
        color: '#818CF8',
        fontSize: 16,
        fontWeight: '600',
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        justifyContent: 'center',
        marginBottom: 12,
    },
    dangerText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
    helperText: {
        color: '#64748B',
        fontSize: 14,
        textAlign: 'center',
    },
    inputContainer: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#334155',
        paddingTop: 16,
    },
    helperTextInput: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    input: {
        flex: 1,
        color: '#F8FAFC',
        padding: 12,
        fontSize: 14,
    },
    eyeIcon: {
        padding: 12,
    }
});
