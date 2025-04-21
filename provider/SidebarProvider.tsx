'use client'

import React, { createContext, useContext, useState } from 'react'

type SidebarContextType = {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const SidebarProvider = ({children}:{children: React.ReactNode}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);
  return (
    <SidebarContext.Provider value={{isOpen, toggle, close}}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(){
  const context = useContext(SidebarContext);
  if(!context){
    throw new Error("useSidebar must be used within a SidebarProvider")
  }

  return context;
}

export default SidebarProvider