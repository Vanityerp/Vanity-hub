"use client"

/**
 * Settings Storage Service
 *
 * This service provides persistent storage for application settings using localStorage.
 * It includes typed interfaces for all settings categories and helper functions for
 * getting and setting values.
 */

// Branding Settings Interface
export interface BrandingSettings {
  companyLogo: string | null; // File path or URL to uploaded logo
  companyName: string;
  primaryBrandColor: string;
  logoAltText: string;
  showCompanyNameWithLogo: boolean;
}

// Live Chat Settings Interface
export interface LiveChatSettings {
  enabled: boolean;
  serviceName: string;
  serviceUrl?: string;
  operatingHours: {
    startTime: string; // 24-hour format: "09:00"
    endTime: string;   // 24-hour format: "18:00"
  };
  operatingDays: string[]; // ["monday", "tuesday", "wednesday", "thursday", "friday"]
  timezone: string; // Will inherit from business timezone
}

// General Settings Interface
export interface GeneralSettings {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website: string;
  description: string;
  timezone: string;
  currency: string;
  taxRate: string;
  enableOnlineBooking: boolean;
  requireDeposit: boolean;
  depositAmount: string;
  cancellationPolicy: string;
  branding: BrandingSettings;
  liveChat: LiveChatSettings;
}

// Location Interface
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  status: string;
  description?: string;
  enableOnlineBooking: boolean;
  displayOnWebsite: boolean;
  staffCount?: number;
  servicesCount?: number;
}

// User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  locations: string[];
  status: string;
  avatar: string;
  color: string;
  lastLogin?: string;
}

// Role Interface
export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
}

// Integration Interface
export interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'not_connected';
  credentials?: Record<string, string>;
  settings?: Record<string, any>;
}

// Client Notification Settings Interface
export interface ClientNotificationSettings {
  appointmentConfirmation: boolean;
  appointmentReminder: boolean;
  appointmentFollowup: boolean;
  marketingEmails: boolean;
  reminderTime: string;
  emailChannel: boolean;
  smsChannel: boolean;
}

// Staff Notification Settings Interface
export interface StaffNotificationSettings {
  newAppointment: boolean;
  appointmentChanges: boolean;
  dailySchedule: boolean;
  inventoryAlerts: boolean;
  scheduleTime: string;
}

// Checkout Settings Interface
export interface CheckoutSettings {
  taxRate: number;
  shippingType: 'free' | 'flat' | 'percentage';
  shippingAmount: number;
  freeShippingThreshold: number;
  paymentMethods: {
    creditCard: boolean;
    cod: boolean;
  };
  orderProcessing: {
    requirePhoneForCOD: boolean;
    codConfirmationRequired: boolean;
    autoConfirmOrders: boolean;
  };
}

// Admin Notification Settings Interface
export interface AdminNotificationSettings {
  dailySummary: boolean;
  newClient: boolean;
  inventoryAlertsAdmin: boolean;
  staffChanges: boolean;
  paymentAlerts: boolean;
  summaryRecipients: string;
}

// Gift Card & Membership Settings Interface
export interface GiftCardMembershipSettings {
  giftCards: {
    enabled: boolean;
    allowCustomAmounts: boolean;
    predefinedAmounts: number[];
    minAmount: number;
    maxAmount: number;
    defaultExpirationMonths: number;
    allowNoExpiration: boolean;
    requirePurchaserInfo: boolean;
    allowDigitalDelivery: boolean;
    emailTemplate: string;
    termsAndConditions: string;
  };
  memberships: {
    enabled: boolean;
    allowAutoRenewal: boolean;
    autoRenewalDaysBefore: number;
    gracePeriodDays: number;
    prorationEnabled: boolean;
    upgradePolicy: 'immediate' | 'next_cycle';
    downgradePolicy: 'immediate' | 'next_cycle';
    cancellationPolicy: 'immediate' | 'end_of_cycle';
    refundPolicy: string;
    termsAndConditions: string;
    emailNotifications: {
      welcome: boolean;
      renewal: boolean;
      expiration: boolean;
      cancellation: boolean;
    };
  };
}

// Individual Template Interface
export interface MessageTemplate {
  id: string;
  name: string;
  type: "email" | "sms";
  category: "system" | "marketing" | "welcome" | "reminder" | "birthday" | "follow_up" | "promotion" | "general";
  subject?: string;
  content: string;
  variables: string[];
  isDefault: boolean;
  isSystem: boolean; // System templates cannot be deleted
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

// Legacy Notification Templates Interface (for backward compatibility)
export interface NotificationTemplates {
  confirmationSubject: string;
  confirmationEmail: string;
  confirmationSms: string;
  reminderSubject: string;
  reminderEmail: string;
  followupSubject: string;
  followupEmail: string;
}

// Unified Templates Interface
export interface UnifiedTemplates {
  templates: MessageTemplate[];
  legacyTemplates: NotificationTemplates; // For backward compatibility
}

// All Settings Interface
export interface AllSettings {
  general: GeneralSettings;
  locations: Location[];
  users: User[];
  roles: Role[];
  integrations: Integration[];
  clientNotifications: ClientNotificationSettings;
  staffNotifications: StaffNotificationSettings;
  adminNotifications: AdminNotificationSettings;
  notificationTemplates: NotificationTemplates;
  unifiedTemplates: UnifiedTemplates;
  checkout: CheckoutSettings;
}

// Storage Keys
const STORAGE_KEYS = {
  GENERAL: 'vanity_general_settings',
  LOCATIONS: 'vanity_locations',
  USERS: 'vanity_users',
  ROLES: 'vanity_roles',
  INTEGRATIONS: 'vanity_integrations',
  CLIENT_NOTIFICATIONS: 'vanity_client_notifications',
  STAFF_NOTIFICATIONS: 'vanity_staff_notifications',
  ADMIN_NOTIFICATIONS: 'vanity_admin_notifications',
  NOTIFICATION_TEMPLATES: 'vanity_notification_templates',
  UNIFIED_TEMPLATES: 'vanity_unified_templates',
  CHECKOUT: 'vanity_checkout_settings',
  GIFT_CARD_MEMBERSHIP: 'vanity_gift_card_membership_settings',
};

// Helper function to get data from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Helper function to save data to localStorage
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

// Helper function to migrate settings to include branding
function migrateGeneralSettings(settings: any): GeneralSettings {
  // If branding field doesn't exist, add it with defaults
  if (!settings.branding) {
    settings.branding = {
      companyLogo: null,
      companyName: settings.businessName || "Vanity Hub",
      primaryBrandColor: "#8b5cf6",
      logoAltText: "Company Logo",
      showCompanyNameWithLogo: true
    };
  }
  return settings as GeneralSettings;
}

// Settings Service
export const SettingsStorage = {
  // General Settings
  getGeneralSettings: (): GeneralSettings => {
    const defaultSettings: GeneralSettings = {
      businessName: "Vanity Hub",
      email: "info@vanityhub.com",
      phone: "(974) 123-4567",
      address: "123 D-Ring Road",
      city: "Doha",
      state: "",
      zipCode: "",
      country: "Qatar",
      website: "https://www.vanityhub.com",
      description: "Premium salon services for hair, skin, and nails.",
      timezone: "Asia/Qatar",
      currency: "QAR",
      taxRate: "8.875",
      enableOnlineBooking: true,
      requireDeposit: false,
      depositAmount: "0",
      cancellationPolicy: "24 hours notice required for cancellations. No-shows may be charged a fee.",
      branding: {
        companyLogo: null,
        companyName: "Vanity Hub",
        primaryBrandColor: "#8b5cf6", // Default purple color
        logoAltText: "Company Logo",
        showCompanyNameWithLogo: true
      },
      liveChat: {
        enabled: true,
        serviceName: "Live Chat",
        serviceUrl: "",
        operatingHours: {
          startTime: "09:00",
          endTime: "18:00"
        },
        operatingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        timezone: "Asia/Qatar"
      }
    };

    // Get stored settings and migrate if necessary
    const storedSettings = getFromStorage<any>(STORAGE_KEYS.GENERAL, defaultSettings);
    return migrateGeneralSettings(storedSettings);
  },
  saveGeneralSettings: (settings: GeneralSettings) => saveToStorage(STORAGE_KEYS.GENERAL, settings),

  // Locations - Now fetched from database API
  getLocations: (): Location[] => {
    // Return empty array - locations should be fetched from database API
    // This method is kept for backward compatibility but should not be used
    console.warn("SettingsStorage.getLocations() is deprecated. Use the locations API instead.")
    return []
  },
  saveLocations: (locations: Location[]) => {
    console.warn("SettingsStorage.saveLocations() is deprecated. Use the locations API instead.")
    // No-op - locations should be managed through database API
  },
  addLocation: (location: Location) => {
    console.warn("SettingsStorage.addLocation() is deprecated. Use the locations API instead.")
    // No-op - locations should be managed through database API
  },
  updateLocation: (updatedLocation: Location) => {
    console.warn("SettingsStorage.updateLocation() is deprecated. Use the locations API instead.")
    // No-op - locations should be managed through database API
  },
  deleteLocation: (locationId: string) => {
    console.warn("SettingsStorage.deleteLocation() is deprecated. Use the locations API instead.")
    // No-op - locations should be managed through database API
  },

  // Users
  getUsers: (): User[] => getFromStorage<User[]>(STORAGE_KEYS.USERS, []),
  saveUsers: (users: User[]) => saveToStorage(STORAGE_KEYS.USERS, users),
  addUser: (user: User) => {
    const users = SettingsStorage.getUsers();
    users.push(user);
    saveToStorage(STORAGE_KEYS.USERS, users);
  },
  updateUser: (updatedUser: User) => {
    const users = SettingsStorage.getUsers();
    const index = users.findIndex(user => user.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      saveToStorage(STORAGE_KEYS.USERS, users);
    }
  },
  deleteUser: (userId: string) => {
    const users = SettingsStorage.getUsers();
    const filteredUsers = users.filter(user => user.id !== userId);
    saveToStorage(STORAGE_KEYS.USERS, filteredUsers);
  },

  // Roles
  getRoles: (): Role[] => getFromStorage<Role[]>(STORAGE_KEYS.ROLES, []),
  saveRoles: (roles: Role[]) => saveToStorage(STORAGE_KEYS.ROLES, roles),
  addRole: (role: Role) => {
    const roles = SettingsStorage.getRoles();
    roles.push(role);
    saveToStorage(STORAGE_KEYS.ROLES, roles);
  },
  updateRole: (updatedRole: Role) => {
    const roles = SettingsStorage.getRoles();
    const index = roles.findIndex(role => role.id === updatedRole.id);
    if (index !== -1) {
      roles[index] = updatedRole;
      saveToStorage(STORAGE_KEYS.ROLES, roles);
    }
  },
  deleteRole: (roleId: string) => {
    const roles = SettingsStorage.getRoles();
    const filteredRoles = roles.filter(role => role.id !== roleId);
    saveToStorage(STORAGE_KEYS.ROLES, filteredRoles);
  },

  // Integrations
  getIntegrations: (): Integration[] => getFromStorage<Integration[]>(STORAGE_KEYS.INTEGRATIONS, []),
  saveIntegrations: (integrations: Integration[]) => saveToStorage(STORAGE_KEYS.INTEGRATIONS, integrations),
  updateIntegration: (updatedIntegration: Integration) => {
    const integrations = SettingsStorage.getIntegrations();
    const index = integrations.findIndex(integration => integration.id === updatedIntegration.id);
    if (index !== -1) {
      integrations[index] = updatedIntegration;
    } else {
      integrations.push(updatedIntegration);
    }
    saveToStorage(STORAGE_KEYS.INTEGRATIONS, integrations);
  },

  // Notifications
  getClientNotifications: (): ClientNotificationSettings => getFromStorage<ClientNotificationSettings>(STORAGE_KEYS.CLIENT_NOTIFICATIONS, {
    appointmentConfirmation: true,
    appointmentReminder: true,
    appointmentFollowup: true,
    marketingEmails: true,
    reminderTime: "24",
    emailChannel: true,
    smsChannel: true,
  }),
  saveClientNotifications: (settings: ClientNotificationSettings) => saveToStorage(STORAGE_KEYS.CLIENT_NOTIFICATIONS, settings),

  getStaffNotifications: (): StaffNotificationSettings => getFromStorage<StaffNotificationSettings>(STORAGE_KEYS.STAFF_NOTIFICATIONS, {
    newAppointment: true,
    appointmentChanges: true,
    dailySchedule: true,
    inventoryAlerts: true,
    scheduleTime: "7",
  }),
  saveStaffNotifications: (settings: StaffNotificationSettings) => saveToStorage(STORAGE_KEYS.STAFF_NOTIFICATIONS, settings),

  getAdminNotifications: (): AdminNotificationSettings => getFromStorage<AdminNotificationSettings>(STORAGE_KEYS.ADMIN_NOTIFICATIONS, {
    dailySummary: true,
    newClient: true,
    inventoryAlertsAdmin: true,
    staffChanges: true,
    paymentAlerts: true,
    summaryRecipients: "admin@salonhub.com, manager@salonhub.com",
  }),
  saveAdminNotifications: (settings: AdminNotificationSettings) => saveToStorage(STORAGE_KEYS.ADMIN_NOTIFICATIONS, settings),

  getNotificationTemplates: (): NotificationTemplates => getFromStorage<NotificationTemplates>(STORAGE_KEYS.NOTIFICATION_TEMPLATES, {
    confirmationSubject: "Your appointment at SalonHub has been confirmed",
    confirmationEmail: `Hi {{client_name}},\n\nThank you for booking an appointment at SalonHub!\n\nAppointment Details:\n- Service: {{service_name}}\n- Date: {{appointment_date}}\n- Time: {{appointment_time}}\n- Stylist: {{staff_name}}\n- Location: SalonHub Location\n\nNeed to make changes? You can reschedule or cancel your appointment up to 24 hours in advance.\n\nWe look forward to seeing you!\n\nBest regards,\nThe SalonHub Team`,
    confirmationSms: `SalonHub: Your appointment for {{service_name}} on {{appointment_date}} at {{appointment_time}} with {{staff_name}} is confirmed. Reply HELP for help, STOP to unsubscribe.`,
    reminderSubject: "Reminder: Your upcoming appointment at SalonHub",
    reminderEmail: `Hi {{client_name}},\n\nThis is a friendly reminder about your upcoming appointment at SalonHub.\n\nAppointment Details:\n- Service: {{service_name}}\n- Date: {{appointment_date}}\n- Time: {{appointment_time}}\n- Stylist: {{staff_name}}\n- Location: SalonHub Location\n\nNeed to make changes? You can reschedule or cancel your appointment up to 24 hours in advance.\n\nWe look forward to seeing you!\n\nBest regards,\nThe SalonHub Team`,
    followupSubject: "How was your experience at SalonHub?",
    followupEmail: `Hi {{client_name}},\n\nThank you for visiting SalonHub! We hope you enjoyed your {{service_name}} with {{staff_name}}.\n\nWe'd love to hear about your experience. Please take a moment to leave a review or provide feedback.\n\n[Leave a Review]\n\nYour feedback helps us improve our services and better serve you in the future.\n\nBest regards,\nThe SalonHub Team`,
  }),
  saveNotificationTemplates: (templates: NotificationTemplates) => saveToStorage(STORAGE_KEYS.NOTIFICATION_TEMPLATES, templates),

  // Unified Templates Management
  getUnifiedTemplates: (): UnifiedTemplates => {
    const defaultSystemTemplates: MessageTemplate[] = [
      {
        id: "sys-confirmation-email",
        name: "Appointment Confirmation Email",
        type: "email",
        category: "system",
        subject: "Your appointment at VanityERP has been confirmed",
        content: `Hi {{client_name}},\n\nThank you for booking an appointment at VanityERP!\n\nAppointment Details:\n- Service: {{service_name}}\n- Date: {{appointment_date}}\n- Time: {{appointment_time}}\n- Stylist: {{staff_name}}\n- Location: {{location_name}}\n\nNeed to make changes? You can reschedule or cancel your appointment up to 24 hours in advance.\n\nWe look forward to seeing you!\n\nBest regards,\nThe VanityERP Team`,
        variables: ["client_name", "service_name", "appointment_date", "appointment_time", "staff_name", "location_name"],
        isDefault: true,
        isSystem: true,
        createdAt: new Date(),
        usageCount: 0
      },
      {
        id: "sys-confirmation-sms",
        name: "Appointment Confirmation SMS",
        type: "sms",
        category: "system",
        content: `VanityERP: Your appointment for {{service_name}} on {{appointment_date}} at {{appointment_time}} with {{staff_name}} is confirmed. Reply HELP for help, STOP to unsubscribe.`,
        variables: ["service_name", "appointment_date", "appointment_time", "staff_name"],
        isDefault: true,
        isSystem: true,
        createdAt: new Date(),
        usageCount: 0
      },
      {
        id: "sys-reminder-email",
        name: "Appointment Reminder Email",
        type: "email",
        category: "system",
        subject: "Reminder: Your upcoming appointment at VanityERP",
        content: `Hi {{client_name}},\n\nThis is a friendly reminder about your upcoming appointment at VanityERP.\n\nAppointment Details:\n- Service: {{service_name}}\n- Date: {{appointment_date}}\n- Time: {{appointment_time}}\n- Stylist: {{staff_name}}\n- Location: {{location_name}}\n\nNeed to make changes? You can reschedule or cancel your appointment up to 24 hours in advance.\n\nWe look forward to seeing you!\n\nBest regards,\nThe VanityERP Team`,
        variables: ["client_name", "service_name", "appointment_date", "appointment_time", "staff_name", "location_name"],
        isDefault: true,
        isSystem: true,
        createdAt: new Date(),
        usageCount: 0
      },
      {
        id: "sys-followup-email",
        name: "Appointment Follow-up Email",
        type: "email",
        category: "system",
        subject: "How was your experience at VanityERP?",
        content: `Hi {{client_name}},\n\nThank you for visiting VanityERP! We hope you enjoyed your {{service_name}} with {{staff_name}}.\n\nWe'd love to hear about your experience. Please take a moment to leave a review or provide feedback.\n\nYour feedback helps us improve our services and better serve you in the future.\n\nBest regards,\nThe VanityERP Team`,
        variables: ["client_name", "service_name", "staff_name"],
        isDefault: true,
        isSystem: true,
        createdAt: new Date(),
        usageCount: 0
      },
      {
        id: "mkt-welcome-email",
        name: "Welcome New Client",
        type: "email",
        category: "welcome",
        subject: "Welcome to {{salon_name}}!",
        content: "Hi {{client_name}},\n\nWelcome to our salon family! We're excited to have you as our client.\n\nBest regards,\n{{salon_name}} Team",
        variables: ["client_name", "salon_name"],
        isDefault: true,
        isSystem: false,
        createdAt: new Date(),
        usageCount: 0
      },
      {
        id: "mkt-birthday-email",
        name: "Birthday Wishes",
        type: "email",
        category: "birthday",
        subject: "Happy Birthday from {{salon_name}}!",
        content: "Happy Birthday {{client_name}}! 🎉\n\nWe hope you have a wonderful day! As a special birthday gift, enjoy 20% off your next appointment.\n\nBook now and treat yourself!\n\nBest wishes,\n{{salon_name}} Team",
        variables: ["client_name", "salon_name"],
        isDefault: true,
        isSystem: false,
        createdAt: new Date(),
        usageCount: 0
      }
    ];

    const legacyTemplates = SettingsStorage.getNotificationTemplates();

    return getFromStorage<UnifiedTemplates>(STORAGE_KEYS.UNIFIED_TEMPLATES, {
      templates: defaultSystemTemplates,
      legacyTemplates
    });
  },

  saveUnifiedTemplates: (unifiedTemplates: UnifiedTemplates) => saveToStorage(STORAGE_KEYS.UNIFIED_TEMPLATES, unifiedTemplates),

  getCheckoutSettings: (): CheckoutSettings => getFromStorage<CheckoutSettings>(STORAGE_KEYS.CHECKOUT, {
    taxRate: 0,
    shippingType: 'free',
    shippingAmount: 0,
    freeShippingThreshold: 50,
    paymentMethods: {
      creditCard: true,
      cod: true,
    },
    orderProcessing: {
      requirePhoneForCOD: true,
      codConfirmationRequired: true,
      autoConfirmOrders: false,
    },
  }),
  saveCheckoutSettings: (settings: CheckoutSettings) => saveToStorage(STORAGE_KEYS.CHECKOUT, settings),

  // Gift Card & Membership Settings
  getGiftCardMembershipSettings: (): GiftCardMembershipSettings => getFromStorage<GiftCardMembershipSettings>(STORAGE_KEYS.GIFT_CARD_MEMBERSHIP, {
    giftCards: {
      enabled: true,
      allowCustomAmounts: true,
      predefinedAmounts: [50, 100, 200, 500, 1000],
      minAmount: 10,
      maxAmount: 1000,
      defaultExpirationMonths: 12,
      allowNoExpiration: false,
      requirePurchaserInfo: true,
      allowDigitalDelivery: true,
      emailTemplate: `Dear {customerName},

Thank you for your gift card purchase! Here are the details:

Gift Card Code: {giftCardCode}
Amount: {amount}
Expires: {expirationDate}

{message}

Terms and conditions apply.

Best regards,
{businessName}`,
      termsAndConditions: 'Gift cards are non-refundable and cannot be exchanged for cash. Valid for services and products only.'
    },
    memberships: {
      enabled: true,
      allowAutoRenewal: true,
      autoRenewalDaysBefore: 7,
      gracePeriodDays: 3,
      prorationEnabled: true,
      upgradePolicy: 'immediate',
      downgradePolicy: 'next_cycle',
      cancellationPolicy: 'end_of_cycle',
      refundPolicy: 'No refunds for membership fees. Cancellations take effect at the end of the current billing cycle.',
      termsAndConditions: 'Membership terms and conditions apply. Benefits are non-transferable.',
      emailNotifications: {
        welcome: true,
        renewal: true,
        expiration: true,
        cancellation: true
      }
    }
  }),
  saveGiftCardMembershipSettings: (settings: GiftCardMembershipSettings) => saveToStorage(STORAGE_KEYS.GIFT_CARD_MEMBERSHIP, settings),
};

// Live Chat Utility Functions
export const LiveChatUtils = {
  /**
   * Check if live chat is currently available based on settings
   */
  isLiveChatAvailable: (settings: GeneralSettings): boolean => {
    if (!settings.liveChat?.enabled) {
      return false;
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Check if current day is in operating days
    const operatingDays = settings.liveChat.operatingDays || [];
    if (!operatingDays.includes(currentDay)) {
      return false;
    }

    // Check if current time is within operating hours
    const operatingHours = settings.liveChat.operatingHours;
    if (!operatingHours?.startTime || !operatingHours?.endTime) {
      return false;
    }

    const { startTime, endTime } = operatingHours;
    return currentTime >= startTime && currentTime <= endTime;
  },

  /**
   * Get formatted operating hours string
   */
  getOperatingHoursText: (settings: GeneralSettings): string => {
    if (!settings.liveChat?.enabled) {
      return "";
    }

    const operatingHours = settings.liveChat.operatingHours;
    if (!operatingHours?.startTime || !operatingHours?.endTime) {
      return "9:00 AM - 6:00 PM"; // Default fallback
    }

    const { startTime, endTime } = operatingHours;
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  },

  /**
   * Get formatted operating days string
   */
  getOperatingDaysText: (settings: GeneralSettings): string => {
    if (!settings.liveChat?.enabled) {
      return "";
    }

    const days = settings.liveChat.operatingDays || [];
    if (days.length === 0) {
      return "Monday-Friday"; // Default fallback
    }

    const dayNames = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    };

    if (days.length === 7) {
      return "Daily";
    }

    if (days.length === 5 &&
        days.includes('monday') && days.includes('tuesday') &&
        days.includes('wednesday') && days.includes('thursday') &&
        days.includes('friday')) {
      return "Monday-Friday";
    }

    if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
      return "Weekends";
    }

    // For custom combinations, list them out
    return days.map(day => dayNames[day as keyof typeof dayNames]).join(', ');
  },

  /**
   * Get complete live chat availability text
   */
  getLiveChatText: (settings: GeneralSettings): string => {
    if (!settings.liveChat?.enabled) {
      return "";
    }

    const hoursText = LiveChatUtils.getOperatingHoursText(settings);
    const daysText = LiveChatUtils.getOperatingDaysText(settings);
    const serviceName = settings.liveChat?.serviceName || "Live chat";

    return `${serviceName} available ${hoursText} (${daysText})`;
  }
};
