import { useEffect, useState, useCallback } from 'react';
import { getTripSheetWSUrl } from '../api/apiCalls'; // Adjust path
import { toast } from 'react-toastify';

export const useTripSheetNotifications = (onNewNotification) => {
  const [socket, setSocket] = useState(null);

  const connect = useCallback(() => {
    const url = getTripSheetWSUrl();
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("TripSheet WebSocket Connected ✅");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("TripSheet Notification:", data);
        
        // Trigger the callback (e.g., refresh list)
        if (onNewNotification) onNewNotification(data);
        
        // Show a UI alert
        toast.info(data.message || "New Trip Sheet Update!");
      } catch (err) {
        console.error("Error parsing WS message:", err);
      }
    };

    ws.onclose = (e) => {
      console.log("TripSheet WebSocket Disconnected ❌. Reconnecting in 5s...");
      setTimeout(connect, 5000); // Simple auto-reconnect
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
      ws.close();
    };

    setSocket(ws);
  }, [onNewNotification]);

  useEffect(() => {
    connect();
    return () => {
      if (socket) socket.close();
    };
  }, []);

  return socket;
};