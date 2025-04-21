'use client'

import { createContext } from "react";
import * as React from "react";
import { DefaultEventsMap } from "socket.io";
import io, { Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket<DefaultEventsMap, DefaultEventsMap> | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
});

// Use environment variables or default to port 3000
const PORT = process.env.NEXT_PUBLIC_SOCKET_PORT || 3000;
const socket = io(`:${PORT}`, { path: "/api/socket", addTrailingSlash: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      console.log("Socket connected:", socket.id);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = React.useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context.socket;
};
