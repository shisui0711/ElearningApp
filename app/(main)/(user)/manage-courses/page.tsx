import { validateRequest } from '@/auth'
import { redirect } from 'next/navigation';
import React from 'react'
import ManageCourses from './ManageCourses';

const ManageCoursesPage = async () => {
  const { user } = await validateRequest();
  if(!user) redirect("/sign-in")
  if(!user.teacher) redirect("/")
  return (
    <ManageCourses/>
  )
}

export default ManageCoursesPage