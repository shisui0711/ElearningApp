import { Student } from "@prisma/client";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createStudent,
  deleteStudent,
  updateStudent,
} from "./actions";
import { toast } from "sonner";
import { useSession } from "@/provider/SessionProvider";
import { CreateStudentValues, UpdateStudentValues } from "@/lib/validation";

export function useDeleteStudentMutation(student: Student) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: async (deletedStudent) => {
      const queryFilter = {
        queryKey: ["students"],
      };

      await queryClient.cancelQueries(queryFilter);

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Xóa sinh viên thành công");
    },
    onError(error) {
      console.log(error);
      toast.error(error.message)
    },
  });

  return mutation;
}

export function useCreateStudentMutation() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: createStudent,
    onSuccess: async (newStudent) => {
      const queryFilter = {
        queryKey: ["students"],
      } satisfies QueryFilters;

      await queryClient.cancelQueries(queryFilter);

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Tạo sinh viên thành công");
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.message)
    },
  });

  return mutation;
}

export function useUpdateStudentMutation() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: updateStudent,
    onSuccess: async (updatedStudent) => {
      const queryFilter = {
        queryKey: ["students"],
      } satisfies QueryFilters;

      await queryClient.cancelQueries(queryFilter);

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Cập nhật sinh viên thành công");
    },
    onError: (error) => {
      console.log(error);
      toast.error(error.message)
    },
  });

  return mutation;
} 