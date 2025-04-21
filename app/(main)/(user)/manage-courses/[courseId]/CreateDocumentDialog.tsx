'use client'

import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FilePlus, FileText, Loader2, Upload, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CreateDocumentDialogProps {
  courseId: string
  lessons: { id: string; title: string }[]
}

export const CreateDocumentDialog = ({ courseId, lessons }: CreateDocumentDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState('PDF')
  const [lessonId, setLessonId] = useState('')
  const [activeTab, setActiveTab] = useState<string>("url")
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề tài liệu')
      return
    }
    
    if (!url.trim()) {
      toast.error('Vui lòng nhập đường dẫn tài liệu')
      return
    }
    
    if (!lessonId) {
      toast.error('Vui lòng chọn bài học')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          url,
          type,
          lessonId
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Đã xảy ra lỗi khi thêm tài liệu')
      }
      
      toast.success('Đã thêm tài liệu thành công!')
      router.refresh()
      setIsOpen(false)
      setTitle('')
      setDescription('')
      setUrl('')
      setType('PDF')
      setLessonId('')
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi khi thêm tài liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", "media");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      setUrl(data.fileUrl);
      setActiveTab("url");
      
      // Set title based on file name if no title is set
      if (!title) {
        const fileName = file.name.split('.')[0];
        setTitle(fileName.charAt(0).toUpperCase() + fileName.slice(1));
      }
      
      // Auto-detect file type based on extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension) {
        if (['pdf'].includes(extension)) {
          setType('PDF');
        } else if (['mp4', 'webm', 'mov'].includes(extension)) {
          setType('VIDEO');
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
          setType('IMAGE');
        } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
          setType('AUDIO');
        } else {
          setType('OTHER');
        }
      }
      
      toast.success("Tài liệu đã được tải lên thành công.");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setUploadingFile(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeUrl = () => {
    setUrl('');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <FilePlus className="mr-2 h-4 w-4" />
          Thêm tài liệu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Thêm tài liệu mới</DialogTitle>
            <DialogDescription>
              Thêm tài liệu mới vào bài học. Bạn cần phải có ít nhất một bài học.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {lessons.length === 0 ? (
              <div className="text-center py-4 bg-muted/30 rounded-md">
                <p className="text-muted-foreground">Vui lòng tạo ít nhất một bài học trước</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lesson" className="text-right">
                    Bài học
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      value={lessonId} 
                      onValueChange={setLessonId}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn bài học" />
                      </SelectTrigger>
                      <SelectContent>
                        {lessons.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Tiêu đề
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="col-span-3"
                    placeholder="Nhập tiêu đề tài liệu"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Mô tả
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Nhập mô tả tài liệu (không bắt buộc)"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Tài liệu
                  </Label>
                  <div className="col-span-3">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="url">URL trực tiếp</TabsTrigger>
                        <TabsTrigger value="upload">Tải lên</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="url" className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Nhập đường dẫn tài liệu"
                            disabled={loading}
                            className="flex-1"
                          />
                          {url && (
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon"
                              onClick={removeUrl}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        {url && (
                          <div className="border rounded-md p-4">
                            <p className="text-sm font-medium mb-2">Tài liệu hiện tại:</p>
                            <div className="bg-muted/30 p-3 rounded flex items-center gap-2">
                              <FileText className="h-5 w-5 text-primary" />
                              <span className="text-sm truncate">{url}</span>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="upload" className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                          />

                          {uploadingFile ? (
                            <div className="flex flex-col items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                              <p>Đang tải lên tài liệu...</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                              <p className="mb-3 text-sm text-muted-foreground">Kéo và thả tài liệu vào đây, hoặc</p>
                              <Button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                                variant="secondary"
                                size="sm"
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Chọn tài liệu
                              </Button>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Loại
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      value={type} 
                      onValueChange={setType}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại tài liệu" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="VIDEO">Video</SelectItem>
                        <SelectItem value="IMAGE">Hình ảnh</SelectItem>
                        <SelectItem value="AUDIO">Âm thanh</SelectItem>
                        <SelectItem value="OTHER">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading || lessons.length === 0}
            >
              {loading ? 'Đang thêm...' : 'Thêm tài liệu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 