
/**
 * Lấy dữ liệu tổng quan cho analytics dashboard
 */
export async function getOverviewData() {
  try {
    const endpoint = `${process.env.NEXT_PUBLIC_BASSE_URL}/api/analytics/overview`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      // Nếu có lỗi, trả về dữ liệu mẫu
      return {
        totalStudents: 2350,
        totalCourses: 73,
        completionRate: 68,
        averageScore: 76,
        studentChange: 180,
        courseChange: 12,
        completionRateChange: 4,
        scoreChange: 2
      };
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching overview data:", error);
    // Trả về dữ liệu mẫu nếu có lỗi
    return {
      totalStudents: 2350,
      totalCourses: 73,
      completionRate: 68,
      averageScore: 76,
      studentChange: 180,
      courseChange: 12,
      completionRateChange: 4,
      scoreChange: 2
    };
  }
} 