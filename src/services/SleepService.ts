import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './NotificationService';

export interface SleepLog {
    id: string;
    startTime: string; // ISO string
    endTime?: string; // ISO string
    type: 'NAP' | 'NIGHT_SLEEP';
    notificationId?: string;
}

const STORAGE_KEY = '@lullaby_sleep_logs';

export class SleepService {
    async logSleepStart(): Promise<SleepLog> {
        const newLog: SleepLog = {
            id: Date.now().toString(),
            startTime: new Date().toISOString(),
            type: 'NAP', // Default to nap, logic can be refined
        };

        const logs = await this.getLogs();

        // Cancel any pending notifications when sleep starts
        const lastLog = logs[0];
        if (lastLog && lastLog.notificationId) {
            await notificationService.cancelNotification(lastLog.notificationId);
        }

        logs.unshift(newLog);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        return newLog;
    }

    async logSleepEnd(logId: string): Promise<void> {
        const logs = await this.getLogs();
        const logIndex = logs.findIndex(l => l.id === logId);
        if (logIndex !== -1) {
            logs[logIndex].endTime = new Date().toISOString();

            // Schedule notification for next wake window
            // MVP: 90 min wake window, notify 15 mins before (so in 75 mins)
            const WAKE_WINDOW_MINUTES = 90;
            const NOTIFY_BEFORE_MINUTES = 15;
            const secondsUntilNotify = (WAKE_WINDOW_MINUTES - NOTIFY_BEFORE_MINUTES) * 60;

            if (secondsUntilNotify > 0) {
                const notificationId = await notificationService.scheduleSleepReminder(secondsUntilNotify);
                logs[logIndex].notificationId = notificationId;
            }

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        }
    }

    async getLogs(): Promise<SleepLog[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Failed to fetch sleep logs', e);
            return [];
        }
    }

    async getLastWakeTime(): Promise<Date | null> {
        const logs = await this.getLogs();
        // Find the most recent log that has an end time
        const lastSleep = logs.find(l => l.endTime);
        return lastSleep ? new Date(lastSleep.endTime!) : null;
    }

    calculateNextNap(lastWakeTime: Date): Date {
        // MVP Logic: Assume 90 minute wake window (typical for 3-6 months)
        const WAKE_WINDOW_MINUTES = 90;
        return new Date(lastWakeTime.getTime() + WAKE_WINDOW_MINUTES * 60000);
    }

    async getCurrentStatus(): Promise<{ isAsleep: boolean; currentLog?: SleepLog }> {
        const logs = await this.getLogs();
        const latestLog = logs[0];

        if (latestLog && !latestLog.endTime) {
            return { isAsleep: true, currentLog: latestLog };
        }
        return { isAsleep: false };
    }

    async clearAll(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEY);
    }
}

export const sleepService = new SleepService();
