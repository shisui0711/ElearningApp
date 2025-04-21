'use client'

import { useMutation } from "@tanstack/react-query"
import { UpdateProfile } from "./actions"
import { toast } from "sonner"

export const useUpdateProfile = () => {
    return useMutation({
        mutationFn: UpdateProfile,
        onSuccess(){
            toast.success("Cập nhật thông tin cá nhân thành công.")
        },
        onError(error){
            toast.error(error.message);
        }
    })
}