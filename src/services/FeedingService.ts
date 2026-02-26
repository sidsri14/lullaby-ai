import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeedingLog {
    id: string;
    timestamp: string; // ISO string
    type: 'BOTTLE' | 'BREAST';
    details: {
        amount?: number; // for Bottle
        unit?: 'oz' | 'ml'; // for Bottle
        side?: 'LEFT' | 'RIGHT' | 'BOTH'; // for Breast
        durationSeconds?: number; // for Breast
    };
    note?: string;
}

const STORAGE_KEY = '@lullaby_feeding_logs';

export class FeedingService {
    async logFeeding(log: Omit<FeedingLog, 'id' | 'timestamp'>): Promise<FeedingLog> {
        const newLog: FeedingLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            ...log,
        };

        const logs = await this.getLogs();
        logs.unshift(newLog);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        return newLog;
    }

    async getLogs(): Promise<FeedingLog[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Failed to fetch feeding logs', e);
            return [];
        }
    }

    async getLastFeeding(): Promise<FeedingLog | null> {
        const logs = await this.getLogs();
        return logs.length > 0 ? logs[0] : null;
    }

    async deleteFeeding(id: string): Promise<void> {
        let logs = await this.getLogs();
        logs = logs.filter(log => log.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }

    async clearAll(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEY);
    }
}

export const feedingService = new FeedingService();
