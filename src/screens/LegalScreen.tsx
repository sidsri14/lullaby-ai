import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

export default function LegalScreen({ route, navigation }: any) {
    const { type } = route.params || { type: 'privacy' };
    const title = type === 'terms' ? 'Terms of Service' : 'Privacy Policy';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#F8FAFC" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {type === 'privacy' ? (
                    <Text style={styles.text}>
                        {`Lullaby AI Privacy Policy\n\nLast Updated: January 2026\n\n1. Introduction\nWelcome to Lullaby AI. We respect your privacy and are committed to protecting your personal data.\n\n2. Data Collection\nWe collect audio data solely for the purpose of analyzing your baby's cry. This analysis happens either on your device or via a secure API call to OpenAI. We do not store your audio recordings permanently on our servers.\n\n3. Data Usage\n- Audio: Used for cry analysis.\n- Usage Data: Used to track free/premium limits.\n\n4. Third-Party Services\nWe use OpenAI for analysis and RevenueCat/StoreKit for payments.\n\n5. Contact\nFor questions, please contact support@lullabyai.app.`}
                    </Text>
                ) : (
                    <Text style={styles.text}>
                        {`Lullaby AI Terms of Service\n\nLast Updated: January 2026\n\n1. Acceptance of Terms\nBy creating an account or using Lullaby AI, you agree to these terms.\n\n2. Medical Disclaimer\nLullaby AI is NOT a medical device. It provides information for educational and informational purposes only. Always consult a pediatrician for health concerns.\n\n3. Subscriptions\nPremium subscriptions are billed monthly. You can cancel at any time via your device settings.\n\n4. Limitation of Liability\nLullaby AI is provided "as is" without warranties of any kind.`}
                    </Text>
                )}
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F8FAFC',
    },
    content: {
        padding: 24,
    },
    text: {
        color: '#CBD5E1',
        fontSize: 16,
        lineHeight: 24,
    },
});
