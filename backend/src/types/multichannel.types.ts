/**
 * Multi-Channel Notification Types
 * TypeScript interfaces for Email, SMS, and Push notifications
 */

// Email Notification Types
export interface EmailDelivery {
  id: string;
  notificationId: string;
  providerId: string;
  userId: string;
  email: string;
  subject: string;
  templateName: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  deliveryAttempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  sentAt?: Date;
  bounceReason?: string;
  emailProvider: 'mailgun' | 'sendgrid' | 'aws_ses' | 'resend';
  providerMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  id: string;
  templateName: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  variables?: Record<string, any>;
  language: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailConfig {
  provider: 'mailgun' | 'sendgrid' | 'aws_ses' | 'resend';
  apiKey: string;
  apiSecret?: string;
  fromEmail: string;
  fromName: string;
  region?: string;
  maxRetries: number;
  retryDelayMs: number;
}

// SMS Notification Types
export interface SMSDelivery {
  id: string;
  notificationId: string;
  providerId: string;
  userId: string;
  phoneNumber: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'undelivered';
  deliveryAttempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  sentAt?: Date;
  failureReason?: string;
  smsProvider: 'twilio' | 'aws_sns' | 'local_provider';
  providerMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSTemplate {
  id: string;
  templateName: string;
  messageTemplate: string;
  maxLength: number;
  variables?: Record<string, any>;
  language: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSConfig {
  provider: 'twilio' | 'aws_sns' | 'local_provider';
  accountSid?: string;
  authToken?: string;
  fromNumber: string;
  maxRetries: number;
  retryDelayMs: number;
  region?: string;
}

// Push Notification Types
export interface PushDelivery {
  id: string;
  notificationId: string;
  providerId: string;
  userId: string;
  deviceToken: string;
  devicePlatform: 'ios' | 'android' | 'web';
  title: string;
  body: string;
  status: 'pending' | 'sent' | 'failed' | 'invalid_token';
  deliveryAttempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  sentAt?: Date;
  failureReason?: string;
  pushProvider: 'fcm' | 'apns';
  providerMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushTemplate {
  id: string;
  templateName: string;
  title: string;
  body: string;
  actionUrl?: string;
  iconUrl?: string;
  imageUrl?: string;
  variables?: Record<string, any>;
  language: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushConfig {
  provider: 'fcm' | 'apns';
  projectId?: string;
  serviceAccountKey?: string;
  teamId?: string;
  keyId?: string;
  bundleId?: string;
  maxRetries: number;
  retryDelayMs: number;
}

// User Channel Preferences
export interface UserNotificationChannels {
  id: string;
  userId: string;
  providerId: string;

  // Email
  emailAddress?: string;
  emailEnabled: boolean;
  emailVerified: boolean;
  emailVerifiedAt?: Date;

  // SMS
  phoneNumber?: string;
  smsEnabled: boolean;
  smsVerified: boolean;
  smsVerifiedAt?: Date;

  // Push
  pushEnabled: boolean;

  // Quiet hours per channel
  emailQuietHoursStart?: string;
  emailQuietHoursEnd?: string;
  smsQuietHoursStart?: string;
  smsQuietHoursEnd?: string;
  pushQuietHoursStart?: string;
  pushQuietHoursEnd?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Notification Queue
export interface NotificationQueueItem {
  id: string;
  notificationId: string;
  channel: 'email' | 'sms' | 'push';
  providerId: string;
  userId: string;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Analytics
export interface NotificationDeliveryAnalytics {
  id: string;
  providerId: string;
  channel: 'email' | 'sms' | 'push';
  date: Date;

  totalSent: number;
  totalFailed: number;
  totalBounced: number;
  successRate: number;

  avgDeliveryTimeMs?: number;
  minDeliveryTimeMs?: number;
  maxDeliveryTimeMs?: number;

  createdAt: Date;
  updatedAt: Date;
}

// Service Request/Response Types
export interface SendEmailRequest {
  userId: string;
  providerId: string;
  email: string;
  templateName: string;
  variables?: Record<string, any>;
  notificationId?: string;
}

export interface SendSMSRequest {
  userId: string;
  providerId: string;
  phoneNumber: string;
  templateName: string;
  variables?: Record<string, any>;
  notificationId?: string;
}

export interface SendPushRequest {
  userId: string;
  providerId: string;
  deviceTokens: string[];
  devicePlatform: 'ios' | 'android' | 'web';
  templateName: string;
  variables?: Record<string, any>;
  notificationId?: string;
}

// Multi-channel Send Request
export interface SendMultiChannelRequest {
  notificationId: string;
  userId: string;
  providerId: string;
  channels: {
    email?: SendEmailRequest;
    sms?: SendSMSRequest;
    push?: SendPushRequest;
  };
}

// Delivery Status Update
export interface DeliveryStatusUpdate {
  deliveryId: string;
  status: 'sent' | 'failed' | 'bounced' | 'undelivered' | 'invalid_token';
  providerMessageId?: string;
  failureReason?: string;
  timestamp: Date;
}

// Webhook Payload Types
export interface EmailWebhookPayload {
  provider: string;
  event: 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
  messageId: string;
  timestamp: number;
  recipient?: string;
  failureType?: string;
  failureDescription?: string;
}

export interface SMSWebhookPayload {
  provider: string;
  event: 'delivered' | 'failed' | 'undelivered';
  messageId: string;
  timestamp: number;
  phoneNumber?: string;
  status?: string;
  errorCode?: string;
}

export interface PushWebhookPayload {
  provider: string;
  event: 'delivered' | 'failed' | 'invalid_token' | 'uninstalled';
  messageId: string;
  timestamp: number;
  deviceToken?: string;
  errorCode?: string;
}

// Rate Limiting
export interface ChannelRateLimit {
  channel: 'email' | 'sms' | 'push';
  maxPerHour: number;
  maxPerDay: number;
  maxPerUser: number;
}

// Provider Configuration
export interface ProviderConfig {
  email: EmailConfig;
  sms: SMSConfig;
  push: PushConfig;
  rateLimits: ChannelRateLimit[];
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
}
