// "use client";

// import React, { useState } from 'react';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useForm } from 'react-hook-form';
// import { z } from 'zod';
// import { Button } from '@/components/ui/button';
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';
// import { toast } from 'sonner';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Switch } from '@/components/ui/switch';
// import { Loader2, ShieldAlert, KeyRound, AlertTriangle } from 'lucide-react';
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// import { useSession } from '@/provider/SessionProvider';

// const securitySchema = z.object({
//   twoFactorEnabled: z.boolean().default(false),
//   loginNotifications: z.boolean().default(true),
//   sessionTimeout: z.boolean().default(false),
// });

// type SecurityFormValues = z.infer<typeof securitySchema>;

// async function updateSecuritySettings(values: SecurityFormValues) {
//   try {
//     const response = await fetch('/api/user/security', {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(values),
//     });
    
//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.message || 'Có lỗi xảy ra khi cập nhật cài đặt bảo mật');
//     }
    
//     return await response.json();
//   } catch (error) {
//     throw error;
//   }
// }

// export default function SecurityPage() {
//   const { user } = useSession();
//   const [isSubmitting, setIsSubmitting] = useState(false);
  
//   const form = useForm<SecurityFormValues>({
//     resolver: zodResolver(securitySchema),
//     defaultValues: {
//       twoFactorEnabled: user.twoFactorEnabled || false,
//       loginNotifications: user.loginNotifications !== false,
//       sessionTimeout: user.sessionTimeout || false,
//     },
//   });

//   async function onSubmit(values: SecurityFormValues) {
//     try {
//       setIsSubmitting(true);
//       await updateSecuritySettings(values);
//       toast.success('Cập nhật cài đặt bảo mật thành công');
//     } catch (error) {
//       toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <ShieldAlert className="h-5 w-5" />
//             Cài đặt bảo mật
//           </CardTitle>
//           <CardDescription>
//             Cài đặt các tùy chọn bảo mật để bảo vệ tài khoản của bạn.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//               <FormField
//                 control={form.control}
//                 name="twoFactorEnabled"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                     <div className="space-y-0.5">
//                       <FormLabel className="text-base">Xác thực hai yếu tố</FormLabel>
//                       <FormDescription>
//                         Bảo vệ tài khoản của bạn với xác thực hai yếu tố.
//                       </FormDescription>
//                     </div>
//                     <FormControl>
//                       <Switch
//                         checked={field.value}
//                         onCheckedChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
              
//               <FormField
//                 control={form.control}
//                 name="loginNotifications"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                     <div className="space-y-0.5">
//                       <FormLabel className="text-base">Thông báo đăng nhập</FormLabel>
//                       <FormDescription>
//                         Nhận thông báo khi có đăng nhập mới vào tài khoản của bạn.
//                       </FormDescription>
//                     </div>
//                     <FormControl>
//                       <Switch
//                         checked={field.value}
//                         onCheckedChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
              
//               <FormField
//                 control={form.control}
//                 name="sessionTimeout"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                     <div className="space-y-0.5">
//                       <FormLabel className="text-base">Hết hạn phiên đăng nhập</FormLabel>
//                       <FormDescription>
//                         Tự động đăng xuất sau 1 giờ không hoạt động.
//                       </FormDescription>
//                     </div>
//                     <FormControl>
//                       <Switch
//                         checked={field.value}
//                         onCheckedChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
              
//               <div className="flex justify-end">
//                 <Button type="submit" disabled={isSubmitting}>
//                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//                   Lưu thay đổi
//                 </Button>
//               </div>
//             </form>
//           </Form>
//         </CardContent>
//       </Card>
      
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <KeyRound className="h-5 w-5" />
//             Phiên đăng nhập
//           </CardTitle>
//           <CardDescription>
//             Quản lý các phiên đăng nhập của tài khoản bạn.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <div className="rounded-lg border p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="font-medium">Thiết bị hiện tại</p>
//                   <p className="text-sm text-muted-foreground">
//                     Windows 10 • Chrome • Thời gian đăng nhập: {new Date().toLocaleString('vi-VN')}
//                   </p>
//                 </div>
//                 <Button variant="outline" disabled>Hiện tại</Button>
//               </div>
//             </div>
            
//             <Button variant="destructive" className="w-full">
//               Đăng xuất khỏi tất cả các thiết bị khác
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
      
//       <Card className="border-destructive">
//         <CardHeader>
//           <CardTitle className="text-destructive flex items-center gap-2">
//             <AlertTriangle className="h-5 w-5" />
//             Vùng nguy hiểm
//           </CardTitle>
//           <CardDescription>
//             Các hành động không thể hoàn tác liên quan đến tài khoản của bạn.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Alert variant="destructive">
//             <AlertTriangle className="h-4 w-4" />
//             <AlertTitle>Cảnh báo</AlertTitle>
//             <AlertDescription>
//               Các hành động bên dưới có thể dẫn đến mất dữ liệu hoặc quyền truy cập vào tài khoản của bạn.
//             </AlertDescription>
//           </Alert>
          
//           <div className="mt-4 space-y-4">
//             <Button variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
//               Tải xuống toàn bộ dữ liệu của tôi
//             </Button>
            
//             <Button variant="destructive" className="w-full">
//               Xóa tài khoản của tôi
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// } 