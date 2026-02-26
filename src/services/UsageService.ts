import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

// Conditionally require react-native-iap only on native platforms
let RNIap: any;
if (Platform.OS !== 'web') {
    try {
        RNIap = require('react-native-iap');
    } catch (e) {
        console.warn('react-native-iap not found (expected in Expo Go if not built)');
    }
}

const PREMIUM_KEY = '@lullaby_premium_status';
const USAGE_KEY = '@lullaby_free_usage_count';
const FREE_USAGE_LIMIT = 5;

// SKU/Product IDs from Apple Connect / Google Play Console
const ITEM_SKUS = Platform.select({
    ios: ['com.lullabyai.premium.monthly'],
    android: ['com.lullabyai.premium.monthly'],
}) || [];

export class UsageService {
    private isIapReady = false;

    constructor() {
        this.initIap();
    }

    private async initIap() {
        if (Platform.OS === 'web' || !RNIap) {
            this.isIapReady = false;
            return;
        }

        try {
            await RNIap.initConnection();
            this.isIapReady = true;
            console.log('IAP Connected');
            // Optimistically check for purchases on launch
            this.checkActivePurchases();
        } catch (error) {
            console.warn('IAP Initialization failed:', error);
            this.isIapReady = false;
        }
    }

    // --- Core Premium Logic ---

    async isPremium(): Promise<boolean> {
        // 1. Check local override/cache first for speed
        const localStatus = await AsyncStorage.getItem(PREMIUM_KEY);
        if (localStatus === 'true') return true;
        return false;
    }

    async setPremium(status: boolean): Promise<void> {
        await AsyncStorage.setItem(PREMIUM_KEY, status ? 'true' : 'false');
    }

    async incrementUsage(): Promise<boolean> {
        if (await this.isPremium()) return true;

        const current = await this.getUsageCount();
        if (current >= FREE_USAGE_LIMIT) {
            return false;
        }

        await AsyncStorage.setItem(USAGE_KEY, (current + 1).toString());
        return true;
    }

    async getUsageCount(): Promise<number> {
        const val = await AsyncStorage.getItem(USAGE_KEY);
        return val ? parseInt(val, 10) : 0;
    }

    async resetStats(): Promise<void> {
        await AsyncStorage.multiRemove([PREMIUM_KEY, USAGE_KEY]);
    }

    // --- IAP Methods ---

    async getProducts(): Promise<any[]> {
        if (!this.isIapReady || !RNIap) {
            // Mock data for Expo Go / Web
            return [{
                productId: 'com.lullabyai.premium.monthly',
                title: 'Premium Monthly (Mock)',
                price: '$9.99',
                currency: 'USD',
                description: 'Unlimited Access',
                localizedPrice: '$9.99',
                type: 'subs',
                subscriptionPeriodNumberIOS: '1',
                subscriptionPeriodUnitIOS: 'MONTH',
            }];
        }

        try {
            return await RNIap.getProducts({ skus: ITEM_SKUS });
        } catch (error) {
            console.warn('Failed to fetch products:', error);
            return [];
        }
    }

    async purchaseSubscription(sku: string): Promise<boolean> {
        if (!this.isIapReady || !RNIap) {
            // Mock Purchase Flow
            if (Platform.OS === 'web') {
                const confirm = window.confirm('Mock Purchase: Subscribe for $9.99?');
                if (confirm) {
                    await this.setPremium(true);
                    return true;
                }
                return false;
            }

            // Mock Success for Dev Build if IAP fails to load
            await new Promise(r => setTimeout(r, 1000));
            await this.setPremium(true);
            return true;
        }

        try {
            const purchase = await RNIap.requestSubscription({ sku });
            if (purchase) {
                // In production, you MUST verify receipt with your backend or Apple/Google
                await this.setPremium(true);
                return true;
            }
        } catch (error: any) {
            if (error.code !== 'E_USER_CANCELLED') {
                throw new Error(error.message || 'Purchase failed');
            }
        }
        return false;
    }

    async restorePurchases(): Promise<boolean> {
        if (!this.isIapReady || !RNIap) {
            await this.setPremium(true);
            return true;
        }

        try {
            const purchases = await RNIap.getAvailablePurchases();
            const hasPremium = purchases.some((p: any) => ITEM_SKUS.includes(p.productId));

            if (hasPremium) {
                await this.setPremium(true);
                return true;
            }
        } catch (error) {
            console.warn('Restore failed:', error);
        }

        return false;
    }

    private async checkActivePurchases() {
        if (!this.isIapReady || !RNIap) return;
        try {
            const purchases = await RNIap.getAvailablePurchases();
            const hasPremium = purchases.some((p: any) => ITEM_SKUS.includes(p.productId));
            if (hasPremium) {
                await this.setPremium(true);
            }
        } catch (e) {
            // ignore
        }
    }
}

export const usageService = new UsageService();
