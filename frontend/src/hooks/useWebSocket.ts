import { useEffect, useRef, useState } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import type { Lead } from '../types';
import { API_BASE_URL } from '../services/api';

interface UseWebSocketOptions {
  workspaceId?: number;
  userId?: number;
  onLeadReceived?: (lead: Lead) => void;
  onTaskReceived?: (task: any) => void;
  onNotificationReceived?: (notification: any) => void;
}

export const useWebSocket = ({
  workspaceId,
  userId,
  onLeadReceived,
  onTaskReceived,
  onNotificationReceived,
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);

  // Keep latest callbacks in refs to avoid reconnecting on every render
  const onLeadReceivedRef = useRef(onLeadReceived);
  onLeadReceivedRef.current = onLeadReceived;

  const onTaskReceivedRef = useRef(onTaskReceived);
  onTaskReceivedRef.current = onTaskReceived;

  const onNotificationReceivedRef = useRef(onNotificationReceived);
  onNotificationReceivedRef.current = onNotificationReceived;

  useEffect(() => {
    if (!workspaceId && !userId) return;

    let hubUrl = '';
    try {
      const urlObj = new URL(API_BASE_URL.startsWith('http') ? API_BASE_URL : `http://${window.location.host}`);
      hubUrl = `${urlObj.origin}/ws-leads`;
    } catch {
      hubUrl = 'http://localhost:5000/ws-leads';
    }

    const authStorage = localStorage.getItem('leadgrowth-auth');
    let token = '';
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        token = parsed?.state?.token || '';
      } catch {
        // ignore
      }
    }

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on('ReceiveLead', (lead: Lead) => {
      onLeadReceivedRef.current?.(lead);
    });

    connection.on('ReceiveTask', (task: any) => {
      onTaskReceivedRef.current?.(task);
    });

    connection.on('ReceiveNotification', (notification: any) => {
      onNotificationReceivedRef.current?.(notification);
    });

    connection.on('ReceiveWorkspaceNotification', (notification: any) => {
      onNotificationReceivedRef.current?.(notification);
    });

    let isMounted = true;

    const startConnection = async () => {
      try {
        await connection.start();
        if (!isMounted) return;
        setIsConnected(true);

        if (workspaceId) {
          await connection.invoke('JoinWorkspaceGroup', workspaceId);
        }
        if (userId) {
          await connection.invoke('JoinUserGroup', userId);
        }
      } catch (err) {
        if (isMounted) {
          setIsConnected(false);
        }
      }
    };

    connection.onreconnected(async () => {
      if (!isMounted) return;
      setIsConnected(true);
      try {
        if (workspaceId) {
          await connection.invoke('JoinWorkspaceGroup', workspaceId);
        }
        if (userId) {
          await connection.invoke('JoinUserGroup', userId);
        }
      } catch {
        // ignore
      }
    });

    connection.onreconnecting(() => {
      if (isMounted) setIsConnected(false);
    });

    connection.onclose(() => {
      if (isMounted) setIsConnected(false);
    });

    startConnection();

    return () => {
      isMounted = false;
      if (connection.state === HubConnectionState.Connected) {
        if (workspaceId) {
          connection.invoke('LeaveWorkspaceGroup', workspaceId).catch(() => {});
        }
        if (userId) {
          connection.invoke('LeaveUserGroup', userId).catch(() => {});
        }
      }
      connection.stop().catch(() => {});
    };
  }, [workspaceId, userId]);

  return { isConnected };
};
