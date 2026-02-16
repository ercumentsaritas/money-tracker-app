import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Transaction, RecurringTransaction } from '../types';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
});

export const NotificationService = {
    async registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        return finalStatus;
    },

    async scheduleTransactionReminder(transaction: Transaction) {
        if (!transaction.reminder_enabled) return null;

        const date = new Date(transaction.date);
        // 1 day before
        date.setDate(date.getDate() - 1);
        date.setHours(9, 0, 0, 0); // 9:00 AM

        // Don't schedule if date is in the past
        if (date.getTime() < Date.now()) return null;

        // Use explicit notification request
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Ödeme Hatırlatıcısı 🔔',
                body: `Yarın için ödemeniz var: ${transaction.description} - ${transaction.amount} ₺`,
                data: { transactionId: transaction.id },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date,
            },
        });

        return id;
    },

    async scheduleRecurringReminder(recurring: RecurringTransaction) {
        if (!recurring.reminder_enabled) return null;

        let trigger: any;
        let body = `Yarınki ödeme: ${recurring.name} - ${recurring.amount} ₺`;

        // 9:00 AM
        const hour = 9;
        const minute = 0;

        switch (recurring.frequency) {
            case 'daily':
                trigger = {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    hour,
                    minute,
                    repeats: true,
                };
                body = `Günlük ödeme hatırlatması: ${recurring.name}`;
                break;

            case 'weekly':
                // Need to calculate weekday. 
                const nextDate = new Date(recurring.next_date);
                let weekday = nextDate.getDay(); // 0-6 (Sun-Sat)

                // 1 day before
                weekday = weekday - 1;
                if (weekday < 0) weekday = 6; // Back to Saturday

                trigger = {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    weekday: weekday + 1, // 1-7
                    hour,
                    minute,
                    repeats: true
                };
                break;

            case 'monthly':
                // Monthly on day X.
                let day = recurring.day_of_month || new Date(recurring.next_date).getDate();

                if (day > 1) {
                    trigger = {
                        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                        day: day - 1,
                        hour,
                        minute,
                        repeats: true,
                    };
                } else {
                    // If day is 1st, notify on same day
                    trigger = {
                        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                        day: 1,
                        hour,
                        minute,
                        repeats: true,
                    };
                    body = `BUGÜN ödemeniz var: ${recurring.name} - ${recurring.amount} ₺`;
                }
                break;

            case 'yearly':
                // Yearly on Month M, Day D.
                const d = new Date(recurring.next_date);
                d.setDate(d.getDate() - 1); // Go back 1 day

                trigger = {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    month: d.getMonth() + 1, // 1-12
                    day: d.getDate(),
                    hour,
                    minute,
                    repeats: true,
                };
                break;

            default:
                return null;
        }

        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Ödeme Hatırlatıcısı 🔔',
                body,
                data: { recurringId: recurring.id },
            },
            trigger,
        });

        return id;
    },

    async cancelNotification(id: string) {
        await Notifications.cancelScheduledNotificationAsync(id);
    },

    async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }
};
