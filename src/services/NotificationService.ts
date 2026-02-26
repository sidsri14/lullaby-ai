import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';



try {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
} catch (error) {
    console.warn('Failed to set notification handler (expected in Expo Go Android):', error);
}

// Note: On Android with Expo Go (SDK 53+), you may see an error regarding 
// "Android Push notifications ... provided by expo-notifications was removed".
// This affects remote push notifications. Local notifications (used here) 
// continue to function correctly. Use a Development Build for remote notifications.

export class NotificationService {
    async requestPermissions(): Promise<boolean> {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            return finalStatus === 'granted';
        } catch (error) {
            console.warn('Notification permissions check failed:', error);
            return false;
        }
    }

    async scheduleSleepReminder(secondsFromNow: number): Promise<string> {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) return '';

            const identifier = await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Sleep Window Opening',
                    body: 'Baby should be getting tired. Optimal sleep window starts in 15 minutes.',
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: secondsFromNow,
                    repeats: false,
                },
            });
            return identifier;
        } catch (error) {
            console.warn('Failed to schedule notification:', error);
            return '';
        }
    }

    async cancelNotification(identifier: string): Promise<void> {
        try {
            await Notifications.cancelScheduledNotificationAsync(identifier);
        } catch (error) {
            console.warn('Failed to cancel notification:', error);
        }
    }
}

export const notificationService = new NotificationService();
