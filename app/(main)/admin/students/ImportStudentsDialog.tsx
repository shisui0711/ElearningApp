import { useState, useRef, useEffect } from "react";
import { parseExcel, studentFields, mapExcelDataToStudents, ExcelField } from "@/lib/excel";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Download, FileUp, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useCreateStudentMutation } from "./mutations";
import { Class } from "@prisma/client";

type ImportStudentsDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ImportStudentsDialog({
  open,
  onClose,
  onSuccess,
}: ImportStudentsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [selectedFields, setSelectedFields] = useState<ExcelField[]>([...studentFields]);
  const [mappingMode, setMappingMode] = useState<'auto' | 'manual'>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutateAsync: createStudent } = useCreateStudentMutation();

  // Fetch all classes for mapping
  const { data: classes, isLoading: isLoadingClasses } = useQuery<Class[]>({
    queryKey: ["classes-all"],
    queryFn: async () => {
      const response = await axios.get("/api/classes/all");
      return response.data;
    },
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setFile(null);
        setExcelData([]);
        setExcelHeaders([]);
        setFieldMapping({});
        setImporting(false);
        setImportProgress(0);
        setCurrentStep('upload');
        setPreviewData([]);
        setSelectedFields([...studentFields]);
        setMappingMode('auto');
      }, 300);
    }
  }, [open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    
    try {
      // Parse Excel file
      const data = await parseExcel(selectedFile);
      setExcelData(data);
      
      // Extract headers from first row
      if (data.length > 0) {
        setExcelHeaders(Object.keys(data[0]));
        
        // Initialize field mapping with empty values
        const initialMapping: Record<string, string> = {};
        
        if (mappingMode === 'auto') {
          // Try to auto-map headers
          Object.keys(data[0]).forEach(header => {
            const matchingField = studentFields.find(
              field => field.label.toLowerCase() === header.toLowerCase() ||
                      field.key.toLowerCase() === header.toLowerCase()
            );
            
            if (matchingField) {
              initialMapping[header] = matchingField.key;
            } else {
              initialMapping[header] = '';
            }
          });
        }
        
        setFieldMapping(initialMapping);
        setCurrentStep('mapping');
      }
    } catch (error) {
      console.error("File parsing error:", error);
      toast.error("Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.");
    }
  };

  const handleFieldMappingChange = (excelField: string, dbField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [excelField]: dbField
    }));
  };

  const generatePreview = () => {
    if (excelData.length === 0 || !classes) return;
    
    try {
      const mappedData = mapExcelDataToStudents(
        excelData.slice(0, 5), // Preview first 5 rows
        fieldMapping,
        classes
      );
      
      setPreviewData(mappedData);
      setCurrentStep('preview');
    } catch (error) {
      console.error("Preview generation error:", error);
      toast.error("Lỗi khi tạo bản xem trước. Vui lòng kiểm tra lại cấu hình.");
    }
  };

  const validateRequiredFields = () => {
    // Get required fields that are selected for import
    const requiredFields = selectedFields
      .filter(f => f.required)
      .map(f => f.key);
    
    const mappedFields = Object.values(fieldMapping);
    
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
    
    if (missingFields.length > 0) {
      const missingFieldNames = missingFields.map(key => {
        const field = studentFields.find(f => f.key === key);
        return field?.label || key;
      });
      
      toast.error(`Thiếu các trường bắt buộc: ${missingFieldNames.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const handleImport = async () => {
    if (!validateRequiredFields()) return;
    
    try {
      setImporting(true);
      setImportProgress(0);
      
      const mappedData = mapExcelDataToStudents(excelData, fieldMapping, classes || []);
      let imported = 0;
      
      // Process students in batches to show progress
      for (const student of mappedData) {
        try {
          await createStudent({
            username: student.user.username,
            firstName: student.user.firstName,
            lastName: student.user.lastName,
            email: student.user.email,
            password: student.user.password || 'Student@123', // Default password if not provided
            classId: student.classId,
          });
          
          imported++;
          setImportProgress(Math.round((imported / mappedData.length) * 100));
        } catch (error: any) {
          console.error(`Error importing student ${student.user?.username}:`, error);
          // Continue with next student
        }
      }
      
      toast.success(`Đã import ${imported}/${mappedData.length} sinh viên thành công.`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Lỗi khi import dữ liệu. Vui lòng thử lại.");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    window.location.href = '/api/students/template';
  };
  
  const handleToggleField = (field: ExcelField) => {
    const fieldIndex = selectedFields.findIndex(f => f.key === field.key);
    
    if (fieldIndex >= 0) {
      // Only remove if it's not a required field
      if (!field.required) {
        setSelectedFields(prev => prev.filter(f => f.key !== field.key));
      } else {
        toast.error(`Không thể bỏ chọn trường bắt buộc: ${field.label}`);
      }
    } else {
      // Add field if it's not selected
      setSelectedFields(prev => [...prev, field]);
    }
  };

  const isFieldSelected = (field: ExcelField) => {
    return selectedFields.some(f => f.key === field.key);
  };

  // Get available mappable fields based on selection
  const getAvailableFields = () => {
    return selectedFields;
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className={currentStep === 'upload' ? "sm:max-w-md" : "sm:max-w-3xl max-h-[90vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle>Import danh sách sinh viên</DialogTitle>
          <DialogDescription>
            {currentStep === 'upload' && "Tải lên file Excel chứa danh sách sinh viên cần import."}
            {currentStep === 'mapping' && "Thiết lập tương ứng giữa các cột trong file Excel và trường dữ liệu."}
            {currentStep === 'preview' && "Xem trước dữ liệu sẽ được import vào hệ thống."}
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'upload' && (
          <div className="space-y-6 py-4">
            <div className="border-2 border-dashed rounded-md p-8 text-center space-y-4">
              <div className="flex flex-col items-center justify-center gap-2">
                <FileUp className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Kéo thả file hoặc nhấp vào đây để tải lên
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button 
                  variant="secondary" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Chọn file Excel
                </Button>
                {file && (
                  <p className="text-sm font-medium mt-2">
                    File đã chọn: {file.name}
                  </p>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tải mẫu Excel</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadTemplate}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Tải mẫu
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Bạn có thể tải về file mẫu để điền thông tin sinh viên theo định dạng chuẩn.
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Chọn trường dữ liệu cần import</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Chọn các trường dữ liệu bạn muốn import vào hệ thống. Các trường có dấu (*) là bắt buộc.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {studentFields.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`import-field-${field.key}`}
                      checked={isFieldSelected(field)}
                      onCheckedChange={() => handleToggleField(field)}
                      disabled={field.required}
                    />
                    <Label htmlFor={`import-field-${field.key}`} className="cursor-pointer">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'mapping' && (
          <div className="space-y-6 py-4">
            <Alert>
              <AlertDescription>
                Thiết lập tương ứng giữa các cột trong file Excel và các trường dữ liệu trong hệ thống. 
                Các trường có dấu (*) là bắt buộc.
              </AlertDescription>
            </Alert>
            
            <Tabs defaultValue="auto" value={mappingMode} onValueChange={(value) => setMappingMode(value as 'auto' | 'manual')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="auto">Tự động</TabsTrigger>
                <TabsTrigger value="manual">Thủ công</TabsTrigger>
              </TabsList>
              <TabsContent value="auto" className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Hệ thống sẽ tự động tìm các cột trong file Excel tương ứng với trường dữ liệu.
                </p>
              </TabsContent>
              <TabsContent value="manual" className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Bạn sẽ chọn thủ công các cột trong file Excel tương ứng với trường dữ liệu.
                </p>
              </TabsContent>
            </Tabs>
            
            <div className="border rounded-md overflow-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cột trong Excel</TableHead>
                    <TableHead>Trường dữ liệu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {excelHeaders.map((header) => (
                    <TableRow key={header}>
                      <TableCell>{header}</TableCell>
                      <TableCell>
                        <Select
                          value={fieldMapping[header] || ''}
                          onValueChange={(value) => handleFieldMappingChange(header, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trường dữ liệu" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Không sử dụng --</SelectItem>
                            {getAvailableFields().map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label} {field.required && <span className="text-destructive">*</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                Quay lại
              </Button>
              <Button onClick={generatePreview}>
                Xem trước
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-6 py-4">
            <Alert>
              <AlertDescription>
                Xem trước 5 dòng dữ liệu đầu tiên sẽ được import. Kiểm tra kỹ dữ liệu trước khi import.
              </AlertDescription>
            </Alert>
            
            <div className="border rounded-md overflow-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>STT</TableHead>
                    <TableHead>Họ</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tên đăng nhập</TableHead>
                    <TableHead>Lớp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.length > 0 ? (
                    previewData.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{student.user.firstName}</TableCell>
                        <TableCell>{student.user.lastName}</TableCell>
                        <TableCell>{student.user.email}</TableCell>
                        <TableCell>{student.user.username}</TableCell>
                        <TableCell>
                          {classes?.find(c => c.id === student.classId)?.name || 'Chưa phân lớp'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Không có dữ liệu hợp lệ để hiển thị
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Đang import...</span>
                  <span className="text-sm">{importProgress}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('mapping')} disabled={importing}>
                Quay lại
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={importing || previewData.length === 0}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang import...
                  </>
                ) : 'Import sinh viên'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 