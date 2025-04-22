import ExamResult from "./ExamResult";


export default async function ExamResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExamResult examId={id} />
} 