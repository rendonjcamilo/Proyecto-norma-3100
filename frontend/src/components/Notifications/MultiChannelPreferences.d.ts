/**
 * Multi-Channel Notification Preferences Component
 * Allows users to configure email, SMS, and push notification settings
 */
import React from 'react';
import './MultiChannelPreferences.css';
interface UserPreferences {
    userId: string;
    emailEnabled: boolean;
    emailAddress?: string;
    emailVerified: boolean;
    emailQuietHoursStart?: string;
    emailQuietHoursEnd?: string;
    smsEnabled: boolean;
    phoneNumber?: string;
    smsVerified: boolean;
    smsQuietHoursStart?: string;
    smsQuietHoursEnd?: string;
    pushEnabled: boolean;
    pushQuietHoursStart?: string;
    pushQuietHoursEnd?: string;
}
interface MultiChannelPreferencesProps {
    userId: string;
    onSave?: (preferences: UserPreferences) => void;
}
export declare const MultiChannelPreferences: React.FC<MultiChannelPreferencesProps>;
export {};
//# sourceMappingURL=MultiChannelPreferences.d.ts.map