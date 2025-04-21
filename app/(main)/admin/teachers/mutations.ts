import { Teacher } from "@prisma/client";
import {
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createTeacher,
  deleteTeacher,
  updateTeacher,
} from "./actions";
import { toast } from "sonner";
import { useSession } from "@/provider/SessionProvider";

export function useDeleteTeacherMutation(teacher: Teacher) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: deleteTeacher,
    onSuccess: async (deletedTeacher) => {
      const queryFilter = {
        queryKey: ["teachers"],
      };

      await queryClient.cancelQueries(queryFilter);

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Xóa giảng viên thành công");
    },
    onError(error) {
      console.log(error);
      toast.error(error.message)
    },
  });

  return mutation;
}

export function useCreateTeacherMutation() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: createTeacher,
    onSuccess: async (newTeacher) => {
      const queryFilter = {
        queryKey: ["teachers"],
      } satisfies QueryFilters;

      await queryClient.cancelQueries(queryFilter);

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Tạo giảng viên thành công");
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.message)
    },
  });

  return mutation;
}

export function useUpdateTeacherMutation() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: updateTeacher,
    onSuccess: async (updatedTeacher) => {
      const queryFilter = {
        queryKey: ["teachers"],
      } satisfies QueryFilters;

      await queryClient.cancelQueries(queryFilter);

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Cập nhật giảng viên thành công");
    },
    onError: (error) => {
      console.log(error);
      toast.error(error.message)
    },
  });

  return mutation;
} 