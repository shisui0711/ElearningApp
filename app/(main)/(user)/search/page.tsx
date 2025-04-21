import CourseCard from '@/components/CourseCard'
import { Search } from 'lucide-react'
import React from 'react'

const SearchPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const { page = '1', sort = 'asc', query = '' } = await searchParams
  const courses = [];
  return (
    <div className='h-full pt-16'>
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center gap-4 mb-8'>
          <Search className='size-8 text-primary' />
          <div>
            <h1 className='text-3xl font-bold'>Kết quả tìm kiếm</h1>
            <p className='text-muted-foreground'>
              Tìm thấy 0 kết quả cho &quot;{query}&quot;
            </p>
          </div>
        </div>
        {courses.length === 0 ? (
          <div className='text-center py-12'>
            <h2 className='text-2xl font-semibold mb-4'>Không tìm thấy kết quả nào</h2>
            <p className='text-muted-foreground mb-8'>Hãy thử tìm kiếm với từ khóa khác</p>
          </div>
        ): (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {courses.map((course)=>(
                <CourseCard key={1} course='ABC'/>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchPage