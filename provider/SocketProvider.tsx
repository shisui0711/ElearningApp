'use client'

import { createContext } from "react";
import * as React from "react";
import { DefaultEventsMap } from "socket.io";
import io, { Socket } from "socket.io-client";
import { useSession } from "./SessionProvider";

interface SocketContextType {
  socket: Socket<DefaultEventsMap, DefaultEventsMap> | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
});

// Use environment variables or default to port 3000
const PORT = process.env.NEXT_PUBLIC_SOCKET_PORT || 3000;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const { user } = useSession();

  React.useEffect(() => {
    if (!user?.id) return;
    
    const socketInstance = io(`:${PORT}`, { path: "/api/socket", addTrailingSlash: false });
    setSocket(socketInstance);

    const onConnect = () => {
      setIsConnected(true);
      socketInstance.emit("join_user_room", { userId: user.id });
      console.log("Socket connected:", socketInstance.id);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    };
  
    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);

    // We're not handling notifications directly here anymore
    // This is moved to the NotificationProvider

    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      socketInstance.disconnect();
    };
  }, [user?.id]);

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
