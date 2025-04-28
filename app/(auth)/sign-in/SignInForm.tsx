"use client";
import React, { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SignInValues, signInSchema } from "@/lib/validation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SignIn } from "./actions";
import { Loader2, User, Lock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const SignInForm = () => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInValues) {
    startTransition(async () => {
      const { error } = await SignIn(values);
      if (error)
        toast.error("Đăng nhập thất bại", {
          description: error,
        });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 dark:text-gray-300 font-medium">
                Tên đăng nhập
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nhập tên đăng nhập hoặc email"
                    className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-red-500 text-sm font-medium" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel className="text-gray-700 dark:text-gray-300 font-medium">
                  Mật khẩu
                </FormLabel>
              </div>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Nhập mật khẩu"
                    className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-red-500 text-sm font-medium" />
            </FormItem>
          )}
        />
        <div className="pt-2">
          <Button
            disabled={isPending}
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Đang xử lý...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </div>
        <div className="text-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Chưa có tài khoản?
          </span>{" "}
          <Link
            href="#"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium transition-colors"
          >
            Đăng ký
          </Link>
        </div>
      </form>
    </Form>
  );
};

export default SignInForm;
