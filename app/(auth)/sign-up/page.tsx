import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import SignUpForm from './SignUpForm'

export const metadata: Metadata = {
  title: "Đăng ký"
}

const Page = () => {
  return (
    <main className="h-screen flex items-center justify-center px-4">
      <div className='flex h-full max-h-[40rem] w-full max-w-[32rem] rounded-2xl overflow-hidden bg-card shadow-2xl'>
        <div className='w-full space-y-5 overflow-y-auto p-10'>
          <div className='space-y-1 text-center'>
            <h1 className='text-3xl font-bold'>
              Đăng ký tài khoản
            </h1>
          </div>
          <div className='space-y-5'>
            <SignUpForm/>
            <Link href='/sign-in' className='block text-center hover:underline hover:text-blue-500'>
              Đã có tài khoản? Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Page