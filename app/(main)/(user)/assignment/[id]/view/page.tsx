import ExamResult from "./ExamResult";


export default async function ExamResultPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  return <ExamResult examId={id} />
} 