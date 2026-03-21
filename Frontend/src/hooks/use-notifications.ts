"use client";

import { useEffect, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "task" | "comment" | "general";
  data?: any;
  timestamp: Date;
  read: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  isConnected: boolean;
}

export function useNotifications(userId: string | undefined): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const signalRUrl = process.env.NEXT_PUBLIC_SIGNALR_URL || "http://161.35.169.189:8090";
    const hubUrl = `${signalRUrl}/hubs/notifications?userId=${userId}`;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    setConnection(newConnection);

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [userId]);

  useEffect(() => {
    if (!connection) return;

    const startConnection = async () => {
      try {
        await connection.start();
        console.log("SignalR connected");
        setIsConnected(true);

        // Subscribe to notifications
        if (userId) {
          await connection.invoke("SubscribeToTaskNotifications", userId);
        }
      } catch (err) {
        console.error("SignalR connection error:", err);
        setIsConnected(false);
        // Will retry automatically thanks to withAutomaticReconnect()
      }
    };

    // Task notifications
    connection.on("TaskCompleted", (data) => {
      const notification: Notification = {
        id: Date.now().toString(),
        title: "Задача выполнена!",
        message: `Задача "${data.title}" была выполнена`,
        type: "task",
        data,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [notification, ...prev]);
    });

    connection.on("TaskAssigned", (data) => {
      const notification: Notification = {
        id: Date.now().toString(),
        title: "Новая задача!",
        message: `Вам назначена задача "${data.title}"`,
        type: "task",
        data,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [notification, ...prev]);
    });

    connection.on("TaskUpdated", (data) => {
      const notification: Notification = {
        id: Date.now().toString(),
        title: "Задача обновлена",
        message: `Задача "${data.title}" была обновлена`,
        type: "task",
        data,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [notification, ...prev]);
    });

    connection.on("GeneralNotification", (data) => {
      const notification: Notification = {
        id: Date.now().toString(),
        title: data.title,
        message: data.message,
        type: data.type || "general",
        data: data.data,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [notification, ...prev]);
    });

    connection.onreconnecting(() => {
      console.log("SignalR reconnecting...");
      setIsConnected(false);
    });

    connection.onreconnected(() => {
      console.log("SignalR reconnected");
      setIsConnected(true);
    });

    connection.onclose(() => {
      console.log("SignalR disconnected");
      setIsConnected(false);
    });

    startConnection();

    return () => {
      connection.off("TaskCompleted");
      connection.off("TaskAssigned");
      connection.off("TaskUpdated");
      connection.off("GeneralNotification");
    };
  }, [connection, userId]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    isConnected,
  };
}
