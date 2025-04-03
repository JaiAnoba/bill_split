import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Bell, CreditCard, Shield, User } from "lucide-react";

const UserSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("notifications");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    billCreated: true,
    expenseAdded: true,
    participantAdded: true,
    billSettled: true,
    reminderEmails: false,
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    showProfileToOthers: true,
    allowFriendRequests: true,
    showActivityStatus: true,
    showEmailToParticipants: false,
  });

  // Payment settings
  const [paymentSettings, setPaymentSettings] = useState({
    defaultCurrency: "USD",
    savePaymentMethods: true,
    autoSettlePayments: false,
  });

  const handleToggleNotification = (
    setting: keyof typeof notificationSettings
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleTogglePrivacy = (setting: keyof typeof privacySettings) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleTogglePayment