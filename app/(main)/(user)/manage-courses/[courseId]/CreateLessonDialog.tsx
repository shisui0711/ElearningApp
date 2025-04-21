'use client'

import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FolderPlus, Loader2, Upload, Video, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CreateLessonDialogProps {
  courseId: string
}

export const CreateLessonDialog = ({ courseId }: CreateLessonDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [activeTab, setActiveTab] = useState<string>("url")
  const router = useRouter()
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài học')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          videoUrl: videoUrl || undefined,
          courseId
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Đã xảy ra lỗi khi tạo bài học')
      }
      
      toast.success('Đã tạo bài học thành công!')
      router.refresh()
      setIsOpen(false)
      setTitle('')
      setDescription('')
      setVideoUrl('')
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi khi tạo bài học')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("video/")) {
      toast.error("Chỉ hỗ trợ các tập tin video.");
      return;
    }

    try {
      setUploadingMedia(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", "media");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload video");
      }

      const data = await response.json();
      setVideoUrl(data.fileUrl);
      setActiveTab("url");
      toast.success("Video đã được tải lên thành công.");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setUploadingMedia(false);
      // Clear the input
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    }
  };

  const removeVideo = () => {
    setVideoUrl('');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <FolderPlus className="mr-2 h-4 w-4" />
          Thêm bài học
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Thêm bài học mới</DialogTitle>
            <DialogDescription>
              Thêm bài học mới vào khóa học của bạn. Bạn có thể thêm nội dung sau.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Tiêu đề
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="Nhập tiêu đề bài học"
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
                placeholder="Nhập mô tả bài học (không bắt buộc)"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Video
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
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="Nhập đường dẫn video (YouTube, Vimeo, ...)"
                        disabled={loading}
                        className="flex-1"
                      />
                      {videoUrl && (
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon"
                          onClick={removeVideo}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {videoUrl && (
                      <div className="border rounded-md p-4">
                        <p className="text-sm font-medium mb-2">Video hiện tại:</p>
                        {videoUrl.startsWith('/uploads/') ? (
                          <video
                            src={videoUrl}
                            controls
                            className="w-full max-h-[200px]"
                          />
                        ) : (
                          <div className="bg-muted/30 p-3 rounded flex items-center gap-2">
                            <Video className="h-5 w-5 text-primary" />
                            <span className="text-sm truncate">{videoUrl}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="upload" className="space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <input
                        type="file"
                        ref={videoInputRef}
                        onChange={handleVideoUpload}
                        accept="video/*"
                        className="hidden"
                      />

                      {uploadingMedia ? (
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                          <p>Đang tải lên video...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <Video className="h-12 w-12 text-muted-foreground mb-3" />
                          <p className="mb-3 text-sm text-muted-foreground">Kéo và thả video vào đây, hoặc</p>
                          <Button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            disabled={loading}
                            variant="secondary"
                            size="sm"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Chọn video
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Đang tạo...' : 'Tạo bài học'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 