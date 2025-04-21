import { validateRequest } from '@/auth'
import { redirect } from 'next/navigation';
import React from 'react'
import MyCourses from './MyCourses';

const MyCoursesPage = async () => {
  const { user } = await validateRequest();
  if(!user) redirect("/sign-in")
  if(!user.student) redirect("/")
  return (
    <MyCourses/>
  )
}

export default MyCoursesPage