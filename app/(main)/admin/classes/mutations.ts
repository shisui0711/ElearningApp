import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createClass,
  deleteClass,
  updateClass,
} from "./actions";
import { toast } from "sonner";
import { useSession } from "@/provider/SessionProvider";
import { UpdateClassValues } from "@/lib/validation";

export function useDeleteClassMutation(classItem: any) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: async (deletedClass) => {
      const queryFilter = {
        queryKey: ["classes"],
      };

      await queryClient.cancelQueries(queryFilter);

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Xóa lớp thành công");
    },
    onError(error: any) {
      console.log(error);
      toast.error(error.message)
    },
  });

  return mutation;
}

export function useCreateClassMutation() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: createClass,
    onSuccess: async (newClass) => {
      const queryFilter = {
        queryKey: ["classes"],
      } satisfies QueryFilters;

      await queryClient.cancelQueries(queryFilter);

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Tạo lớp thành công");
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.message)
    },
  });

  return mutation;
}

export function useUpdateClassMutation() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: updateClass,
    onSuccess: async (updatedClass) => {
      const queryFilter = {
        queryKey: ["classes"],
      } satisfies QueryFilters;

      await queryClient.cancelQueries(queryFilter);

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Cập nhật lớp thành công");
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.message)
    },
  });

  return mutation;
}
