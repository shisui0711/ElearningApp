import { Department } from "@prisma/client";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from "./actions";
import { DepartmentsPage } from "@/types";
import { toast } from "sonner";
import { useSession } from "@/provider/SessionProvider";

export function useDeleteDepartmentMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: async (deletedDepartment) => {
      const queryFilter = {
        queryKey: ["departments"],
      };

      await queryClient.cancelQueries<
        InfiniteData<DepartmentsPage, string | null>
      >(queryFilter);

      queryClient.setQueriesData<InfiniteData<DepartmentsPage, string | null>>(
        queryFilter,
        (oldData) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              departments: page.departments.filter(
                (dept) => dept.id !== deletedDepartment.id
              ),
              nextCusor: page.nextCusor,
            })),
          };
        }
      );

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Xóa khoa thành công");
    },
    onError(error) {
      console.log(error);
      toast.error(error.message)
      // toast.error("Có lỗi xảy ra vui lòng thử lại");
    },
  });

  return mutation;
}

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: async (newDepartment) => {
      const queryFilter = {
        queryKey: ["departments"],
      } satisfies QueryFilters;

      await queryClient.cancelQueries<
        InfiniteData<DepartmentsPage, string | null>
      >(queryFilter);

      queryClient.setQueriesData<InfiniteData<DepartmentsPage, string | null>>(
        queryFilter,
        (oldData) => {
          if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData;
          const firstPage = oldData.pages[0];
          if (firstPage) {
            return {
              pageParams: oldData.pageParams,
              pages: [
                {
                  departments: [newDepartment, ...firstPage.departments],
                  nextCusor: firstPage.nextCusor,
                },
                ...oldData.pages.slice(1),
              ],
            };
          }
          return oldData;
        }
      );

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Tạo khoa thành công");
    },
    onError: (error: any) => {
      console.log(error);
      toast.error(error.message)
      // toast.error("Có lỗi xảy ra. Vui lòng thử lại");
    },
  });

  return mutation;
}

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: updateDepartment,
    onSuccess: async (updatedDepartment) => {
      const queryFilter = {
        queryKey: ["departments"],
      } satisfies QueryFilters;

      await queryClient.cancelQueries<
        InfiniteData<DepartmentsPage, string | null>
      >(queryFilter);

      queryClient.setQueriesData<InfiniteData<DepartmentsPage, string | null>>(
        queryFilter,
        (oldData) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              departments: page.departments.map((dept) =>
                dept.id === updatedDepartment.id ? updatedDepartment : dept
              ),
              nextCusor: page.nextCusor,
            })),
          };
        }
      );

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
      });

      toast.success("Cập nhật khoa thành công");
    },
    onError: (error) => {
      console.log(error);
      // toast.error("Có lỗi xảy ra. Vui lòng thử lại");
      toast.error(error.message)
    },
  });

  return mutation;
}
