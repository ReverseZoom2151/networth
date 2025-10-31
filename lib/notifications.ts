// Push Notifications and Local Notifications
// Handles bill reminders, goal milestones, and news alerts

import { isMobile } from './platform';

/**
 * Initialize push notifications
 * Request permission and register for remote notifications
 */
export const initializePushNotifications = async () => {
  if (!isMobile()) {
    console.log('Push notifications only available on mobile');
    return null;
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Request permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Register with APNs / FCM
    await PushNotifications.register();

    // Listen for registration
    await PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      // Send token to your server
      return token.value;
    });

    // Listen for registration errors
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error: ', error);
    });

    // Listen for push notifications
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received: ', notification);
    });

    // Listen for notification taps
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed', notification.actionId, notification.inputValue);
    });

    return true;
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
    return null;
  }
};

/**
 * Schedule a local notification (bill reminder, goal milestone, etc.)
 */
export const scheduleLocalNotification = async (options: {
  title: string;
  body: string;
  id: number;
  schedule?: {
    at: Date;
    repeats?: boolean;
    every?: 'day' | 'week' | 'month';
  };
  data?: any;
}) => {
  if (!isMobile()) {
    console.log('Local notifications only available on mobile');
    return;
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    // Request permission
    let permStatus = await LocalNotifications.checkPermissions();

    if (permStatus.display === 'prompt') {
      permStatus = await LocalNotifications.requestPermissions();
    }

    if (permStatus.display !== 'granted') {
      console.log('Local notification permission denied');
      return;
    }

    // Schedule notification
    await LocalNotifications.schedule({
      notifications: [
        {
          title: options.title,
          body: options.body,
          id: options.id,
          schedule: options.schedule
            ? {
                at: options.schedule.at,
                repeats: options.schedule.repeats,
                every: options.schedule.every,
              }
            : undefined,
          extra: options.data,
          smallIcon: 'res://drawable/ic_stat_icon',
          iconColor: '#000000',
        },
      ],
    });

    console.log('Notification scheduled:', options.title);
  } catch (error) {
    console.error('Failed to schedule notification:', error);
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = async (id: number) => {
  if (!isMobile()) return;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
};

/**
 * Get all pending notifications
 */
export const getPendingNotifications = async () => {
  if (!isMobile()) return [];

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const result = await LocalNotifications.getPending();
    return result.notifications;
  } catch (error) {
    console.error('Failed to get pending notifications:', error);
    return [];
  }
};

/**
 * Schedule bill reminder notification
 */
export const scheduleBillReminder = async (billName: string, dueDate: Date, billId: number) => {
  // Schedule notification 3 days before due date
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - 3);

  await scheduleLocalNotification({
    title: `Bill Reminder: ${billName}`,
    body: `Your ${billName} is due in 3 days`,
    id: billId,
    schedule: {
      at: reminderDate,
    },
    data: {
      type: 'bill_reminder',
      billId,
      dueDate: dueDate.toISOString(),
    },
  });
};

/**
 * Schedule goal milestone notification
 */
export const scheduleGoalMilestone = async (
  goalName: string,
  milestone: number,
  goalId: number
) => {
  await scheduleLocalNotification({
    title: `Goal Milestone Reached! 🎉`,
    body: `You've reached ${milestone}% of your ${goalName} goal!`,
    id: 10000 + goalId, // Offset to avoid collision with bill IDs
    data: {
      type: 'goal_milestone',
      goalId,
      milestone,
    },
  });
};

/**
 * Schedule daily financial tip notification
 */
export const scheduleDailyTipNotification = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); // 9 AM

  await scheduleLocalNotification({
    title: 'Daily Financial Tip 💡',
    body: 'Tap to see today\'s money-saving tip',
    id: 99999,
    schedule: {
      at: tomorrow,
      repeats: true,
      every: 'day',
    },
    data: {
      type: 'daily_tip',
    },
  });
};
