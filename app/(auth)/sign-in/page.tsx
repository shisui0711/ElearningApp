import { Metadata } from 'next'
import React from 'react'
import SignInForm from './SignInForm'

export const metadata: Metadata = { title: "Đăng nhập" }

const Page = () => {
  return (
    <main className="h-screen flex items-center justify-center p-5">
      <div className='flex h-full max-h-[40rem] w-full max-w-[32rem] rounded-2xl overflow-hidden bg-card shadow-2xl'>
        <div className='w-full space-y-10 overflow-y-auto p-10'>
          <div className='space-y-1 text-center'>
            <h1 className='text-3xl font-bold'>
              Đăng nhập
            </h1>
          </div>
          <div className='space-y-5'>
            <SignInForm/>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Page