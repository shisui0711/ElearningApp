'use client'
import { useMutation } from "@tanstack/react-query"
import { ChangePassword } from "./actions"
import { toast } from "sonner"

export const useChangePassword = () => {
    return useMutation({
        mutationFn: ChangePassword,
        onSuccess(){
            toast.success("Thay đổi mật khẩu thành công");
        },
        onError(error){
            toast.error(error.message)
        }
    })
}