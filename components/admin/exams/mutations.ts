import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";

// Delete exam mutation
export function useDeleteExamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (examId: string) => {
      const response = await axios.delete(`/api/exams/${examId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch exams queries
      queryClient.invalidateQueries({
        queryKey: ["exams"],
      });
      toast.success("Đã xóa thành công bài kiểm tra");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Không thể xóa bài kiểm tra");
    }
  });
}

// Create exam mutation
export function useCreateExamMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (title: string) => {
      const response = await axios.post("/api/exams", { title });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch exams queries
      queryClient.invalidateQueries({
        queryKey: ["exams"],
      });
      toast.success("Bài kiểm tra đã được tạo thành công.");
      router.push(`/admin/exams/${data.id}`);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  });
} 