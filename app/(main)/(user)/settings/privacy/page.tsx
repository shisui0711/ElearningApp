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
// import { Loader2, Eye, Lock, Shield } from 'lucide-react';
// import { useSession } from '@/provider/SessionProvider';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// import { Label } from '@/components/ui/label';

// const privacySchema = z.object({
//   profileVisibility: z.enum(['public', 'registered', 'private']),
//   showEmail: z.boolean().default(false),
//   showCourses: z.boolean().default(true),
//   allowMessages: z.boolean().default(true),
//   dataCollection: z.boolean().default(true),
// });

// type PrivacyFormValues = z.infer<typeof privacySchema>;

// async function updatePrivacySettings(values: PrivacyFormValues) {
//   try {
//     const response = await fetch('/api/user/privacy', {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(values),
//     });
    
//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.message || 'Có lỗi xảy ra khi cập nhật quyền riêng tư');
//     }
    
//     return await response.json();
//   } catch (error) {
//     throw error;
//   }
// }

// export default function PrivacyPage() {
//   const { user } = useSession();
//   const [isSubmitting, setIsSubmitting] = useState(false);
  
//   const form = useForm<PrivacyFormValues>({
//     resolver: zodResolver(privacySchema),
//     defaultValues: {
//       profileVisibility: user.profileVisibility || 'public',
//       showEmail: user.showEmail || false,
//       showCourses: user.showCourses !== false,
//       allowMessages: user.allowMessages !== false,
//       dataCollection: user.dataCollection !== false,
//     },
//   });

//   async function onSubmit(values: PrivacyFormValues) {
//     try {
//       setIsSubmitting(true);
//       await updatePrivacySettings(values);
//       toast.success('Cập nhật quyền riêng tư thành công');
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
//             <Eye className="h-5 w-5" />
//             Quyền riêng tư hồ sơ
//           </CardTitle>
//           <CardDescription>
//             Kiểm soát những thông tin hiển thị trên hồ sơ của bạn và ai có thể xem chúng.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//               <FormField
//                 control={form.control}
//                 name="profileVisibility"
//                 render={({ field }) => (
//                   <FormItem className="space-y-3">
//                     <FormLabel>Hiển thị hồ sơ</FormLabel>
//                     <FormControl>
//                       <RadioGroup
//                         onValueChange={field.onChange}
//                         defaultValue={field.value}
//                         className="space-y-3"
//                       >
//                         <div className="flex items-center space-x-2 rounded-lg border p-3">
//                           <RadioGroupItem value="public" id="public" />
//                           <Label htmlFor="public" className="flex flex-col">
//                             <span className="font-medium">Công khai</span>
//                             <span className="text-sm text-muted-foreground">
//                               Tất cả mọi người có thể xem hồ sơ của bạn
//                             </span>
//                           </Label>
//                         </div>
//                         <div className="flex items-center space-x-2 rounded-lg border p-3">
//                           <RadioGroupItem value="registered" id="registered" />
//                           <Label htmlFor="registered" className="flex flex-col">
//                             <span className="font-medium">Thành viên đã đăng ký</span>
//                             <span className="text-sm text-muted-foreground">
//                               Chỉ người dùng đã đăng ký mới có thể xem hồ sơ của bạn
//                             </span>
//                           </Label>
//                         </div>
//                         <div className="flex items-center space-x-2 rounded-lg border p-3">
//                           <RadioGroupItem value="private" id="private" />
//                           <Label htmlFor="private" className="flex flex-col">
//                             <span className="font-medium">Riêng tư</span>
//                             <span className="text-sm text-muted-foreground">
//                               Chỉ bạn mới có thể xem hồ sơ của mình
//                             </span>
//                           </Label>
//                         </div>
//                       </RadioGroup>
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
              
//               <div className="space-y-4">
//                 <FormField
//                   control={form.control}
//                   name="showEmail"
//                   render={({ field }) => (
//                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                       <div className="space-y-0.5">
//                         <FormLabel className="text-base">Hiển thị email</FormLabel>
//                         <FormDescription>
//                           Cho phép người khác xem địa chỉ email của bạn
//                         </FormDescription>
//                       </div>
//                       <FormControl>
//                         <Switch
//                           checked={field.value}
//                           onCheckedChange={field.onChange}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
                
//                 <FormField
//                   control={form.control}
//                   name="showCourses"
//                   render={({ field }) => (
//                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                       <div className="space-y-0.5">
//                         <FormLabel className="text-base">Hiển thị khóa học</FormLabel>
//                         <FormDescription>
//                           Cho phép người khác xem danh sách khóa học bạn đang học hoặc dạy
//                         </FormDescription>
//                       </div>
//                       <FormControl>
//                         <Switch
//                           checked={field.value}
//                           onCheckedChange={field.onChange}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
                
//                 <FormField
//                   control={form.control}
//                   name="allowMessages"
//                   render={({ field }) => (
//                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                       <div className="space-y-0.5">
//                         <FormLabel className="text-base">Cho phép tin nhắn</FormLabel>
//                         <FormDescription>
//                           Cho phép người khác gửi tin nhắn trực tiếp cho bạn
//                         </FormDescription>
//                       </div>
//                       <FormControl>
//                         <Switch
//                           checked={field.value}
//                           onCheckedChange={field.onChange}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//               </div>
              
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
//             <Shield className="h-5 w-5" />
//             Quyền riêng tư dữ liệu
//           </CardTitle>
//           <CardDescription>
//             Kiểm soát cách chúng tôi thu thập và sử dụng dữ liệu của bạn.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//               <FormField
//                 control={form.control}
//                 name="dataCollection"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                     <div className="space-y-0.5">
//                       <FormLabel className="text-base">Thu thập dữ liệu sử dụng</FormLabel>
//                       <FormDescription>
//                         Cho phép chúng tôi thu thập dữ liệu về cách bạn sử dụng hệ thống để cải thiện trải nghiệm và phát triển tính năng mới
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
//             <Lock className="h-5 w-5" />
//             Chính sách riêng tư
//           </CardTitle>
//           <CardDescription>
//             Thông tin về cách chúng tôi xử lý dữ liệu của bạn.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <p className="text-sm text-muted-foreground">
//               Hệ thống E-Learning của chúng tôi cam kết bảo vệ quyền riêng tư của bạn. Chúng tôi chỉ thu thập những thông tin cần thiết để cung cấp dịch vụ và cải thiện trải nghiệm học tập của bạn.
//             </p>
            
//             <p className="text-sm text-muted-foreground">
//               Tất cả dữ liệu cá nhân của bạn được mã hóa và lưu trữ an toàn. Chúng tôi không chia sẻ thông tin của bạn với bên thứ ba mà không có sự đồng ý rõ ràng từ bạn.
//             </p>
            
//             <Button variant="link" className="px-0">
//               Đọc đầy đủ chính sách quyền riêng tư
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// } 