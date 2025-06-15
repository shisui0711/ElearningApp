import { NextResponse } from "next/server";
import { getOverviewData } from "@/lib/analytics/overview";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('timeRange') || 'month';
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');
  
  // Parse date strings to Date objects if provided
  const startDate = startDateStr ? new Date(startDateStr) : undefined;
  const endDate = endDateStr ? new Date(endDateStr) : undefined;
  
  try {
    const overviewData = await getOverviewData(
      timeRange as string, 
      startDate,
      endDate
    );
    
    return NextResponse.json(overviewData);
  } catch (error) {
    console.error("Error fetching overview data:", error);
    return NextResponse.json(
      { error: "Failed to fetch overview data" },
      { status: 500 }
    );
  }
} 