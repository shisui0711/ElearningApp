import DoExam from "./DoExam";

export default async function TakeExamPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  return <DoExam examId={id}/>
} 