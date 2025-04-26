import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createSubject,
  deleteSubject,
  updateSubject,
} from "./actions";
import { toast } from "sonner";
import { useSession } from "@/provider/SessionProvider";
import { UpdateSubjectValues } from "@/lib/validation";

export function useDeleteSubjectMutation(subject: any) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: async (deletedSubject) => {
      const queryFilter = {
        queryKey: ["subjects"],
      };

      await queryClient.cancelQueries(queryFilter);

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Xóa môn học thành công");
    },
    onError(error: any) {
      console.log(error);
      toast.error(error.message)
    },
  });

  return mutation;
}

export function useCreateSubjectMutation() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: createSubject,
    onSuccess: async (newSubject) => {
      const queryFilter = {
        queryKey: ["subjects"],
      } satisfies QueryFilters;

      await queryClient.cancelQueries(queryFilter);

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Tạo môn học thành công");
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.message)
    },
  });

  return mutation;
}

export function useUpdateSubjectMutation() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: updateSubject,
    onSuccess: async (updatedSubject) => {
      const queryFilter = {
        queryKey: ["subjects"],
      } satisfies QueryFilters;

      await queryClient.cancelQueries(queryFilter);

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Cập nhật môn học thành công");
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.message)
    },
  });

  return mutation;
} 