import { useEffect, useRef, useState } from 'react';
import type { Lead } from '../types';
import { API_BASE_URL } from '../services/api';

interface UseWebSocketOptions {
  workspaceId?: number;
  onLeadReceived: (lead: Lead) => void;
}

export const useWebSocket = ({ workspaceId, onLeadReceived }: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const connect = () => {
      let wsUrl = '';
      try {
        const urlObj = new URL(API_BASE_URL.startsWith('http') ? API_BASE_URL : `http://${window.location.host}`);
        const wsProtocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${wsProtocol}//${urlObj.host}/ws-leads`;
      } catch (err) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//localhost:5000/ws-leads`;
      }

      console.log(`Connecting to WebSocket: ${wsUrl}`);
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected. Sending STOMP CONNECT frame.');
        setIsConnected(true);

        // Send STOMP CONNECT frame
        const connectFrame = 
          "CONNECT\n" +
          "accept-version:1.1,1.0\n" +
          "heart-beat:10000,10000\n" +
          "\n" +
          "\u0000";
        socket.send(connectFrame);
      };

      socket.onmessage = (event) => {
        const message = event.data;
        
        // Parse simple STOMP frame
        if (message.startsWith('CONNECTED')) {
          console.log('STOMP session connected. Subscribing to workspace: ' + workspaceId);
          // Send STOMP SUBSCRIBE frame
          const subscribeFrame = 
            "SUBSCRIBE\n" +
            "id:sub-0\n" +
            `destination:/topic/workspace/${workspaceId}/leads\n` +
            "ack:auto\n" +
            "\n" +
            "\u0000";
          socket.send(subscribeFrame);
        } else if (message.startsWith('MESSAGE')) {
          // Extract body from STOMP frame
          // Stomp frames end with a null character \u0000 and body is after double newline
          const bodyIndex = message.indexOf('\n\n');
          if (bodyIndex !== -1) {
            const body = message.substring(bodyIndex + 2, message.length - 1).trim();
            try {
              const lead: Lead = JSON.parse(body);
              onLeadReceived(lead);
            } catch (e) {
              console.error('Error parsing lead JSON from WebSocket', e);
            }
          }
        }
      };

      socket.onclose = (event) => {
        console.log('WebSocket closed. Reason: ', event.reason);
        setIsConnected(false);
        // Retry connection after 5 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 5000);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error: ', error);
        socket.close();
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [workspaceId, onLeadReceived]);

  return { isConnected };
};
