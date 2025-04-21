"use client"

import { Session, User } from "lucia"
import { createContext, useContext } from "react";

interface ISessionContext {
  user: User;
  session: Session;
}

const SessionContext = createContext<ISessionContext|null>(null)

const SessionProvider = ({ children, value }: React.PropsWithChildren<{ value: ISessionContext }>) => {
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export default SessionProvider

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider")
  
  }
  return context
}