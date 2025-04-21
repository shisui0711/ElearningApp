import { validateRequest } from '@/auth';
import { redirect } from 'next/navigation';
import React from 'react'

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await validateRequest()
  if(user) redirect('/')

  return (
   <div>{children}</div>
  );
}