import { useState, useRef, useEffect } from "react";
import { parseExcel, teacherFields, mapExcelDataToTeachers, ExcelField } from "@/lib/excel";
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

type ImportTeachersDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ImportTeachersDialog({
  open,
  onClose,
  onSuccess,
}: ImportTeachersDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [selectedFields, setSelectedFields] = useState<ExcelField[]>([...teacherFields]);
  const [mappingMode, setMappingMode] = useState<'auto' | 'manual'>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setSelectedFields([...teacherFields]);
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
            const matchingField = teacherFields.find(
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
    if (excelData.length === 0) return;
    
    try {
      const mappedData = mapExcelDataToTeachers(
        excelData.slice(0, 5), // Preview first 5 rows
        fieldMapping
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
        const field = teacherFields.find(f => f.key === key);
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
      
      const mappedData = mapExcelDataToTeachers(excelData, fieldMapping);
      let imported = 0;
      
      // Process teachers in batches to show progress
      for (const teacher of mappedData) {
        try {
          await axios.post('/api/teachers', {
            displayName: teacher.user.displayName,
            username: teacher.user.username,
            email: teacher.user.email,
            password: teacher.user.password || 'Teacher@123', // Default password if not provided
          });
          
          imported++;
          setImportProgress(Math.round((imported / mappedData.length) * 100));
        } catch (error: any) {
          console.error(`Error importing teacher ${teacher.user?.username}:`, error);
          // Continue with next teacher
        }
      }
      
      toast.success(`Đã import ${imported}/${mappedData.length} giảng viên thành công.`);
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
    window.location.href = '/api/teachers/template';
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

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import giảng viên từ Excel</DialogTitle>
          <DialogDescription>
            Upload file Excel chứa danh sách giảng viên để thêm vào hệ thống.
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'upload' && (
          <div className="space-y-6 my-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-lg p-10 bg-muted/50">
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              
              <FileUp className="h-8 w-8 text-primary mb-4" />
              
              <div className="flex flex-col items-center space-y-2 mb-4">
                <h3 className="text-lg font-medium">
                  {file ? file.name : "Chọn file Excel để import"}
                </h3>
                {file && (
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-primary/20"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {file ? 'Chọn file khác' : 'Chọn file'}
                </Button>
                
                <Button
                  variant="outline"
                  className="border-primary/20"
                  onClick={downloadTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Tải mẫu Excel
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={onClose}
                variant="outline"
                className="mr-2"
              >
                Huỷ
              </Button>
              <Button
                onClick={() => setCurrentStep('mapping')}
                disabled={!file}
              >
                Tiếp tục
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'mapping' && excelHeaders.length > 0 && (
          <div className="space-y-6 my-4">
            <Tabs defaultValue="auto" value={mappingMode} onValueChange={(v) => setMappingMode(v as 'auto' | 'manual')}>
              <TabsList className="mb-4">
                <TabsTrigger value="auto">Tự động map</TabsTrigger>
                <TabsTrigger value="manual">Map thủ công</TabsTrigger>
              </TabsList>
              
              <TabsContent value="auto" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Hệ thống sẽ tự động map các cột Excel với trường dữ liệu phù hợp. Bạn có thể điều chỉnh lại nếu cần.
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Hãy chọn trường dữ liệu tương ứng với mỗi cột Excel.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            <div className="space-y-4">
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Cột Excel</TableHead>
                      <TableHead className="w-1/3">Trường dữ liệu</TableHead>
                      <TableHead>Dữ liệu mẫu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excelHeaders.map((header) => (
                      <TableRow key={header}>
                        <TableCell className="font-medium">{header}</TableCell>
                        <TableCell>
                          <Select
                            value={fieldMapping[header] || ''}
                            onValueChange={(value) => handleFieldMappingChange(header, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn trường dữ liệu" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Không sử dụng</SelectItem>
                              {teacherFields.map((field) => (
                                <SelectItem key={field.key} value={field.key}>
                                  {field.label} {field.required && '*'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm truncate">
                          {excelData[0]?.[header] || ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('upload')}
              >
                Quay lại
              </Button>
              <Button
                onClick={generatePreview}
              >
                Xem trước
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-6 my-4">
            <Alert className="mb-4">
              <AlertDescription>
                Xem trước dữ liệu sẽ được import. Kiểm tra kỹ các thông tin trước khi import.
              </AlertDescription>
            </Alert>

            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tên đăng nhập</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.user.displayName || '-'}</TableCell>
                      <TableCell>{item.user.email || '-'}</TableCell>
                      <TableCell>{item.user.username || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="text-sm text-muted-foreground">
              Hiển thị {previewData.length} dòng mẫu trong tổng số {excelData.length} dòng.
            </p>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('mapping')}
              >
                Quay lại
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang import...
                  </>
                ) : (
                  'Import'
                )}
              </Button>
            </div>

            {importing && (
              <div className="space-y-2">
                <Progress value={importProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {importProgress}% hoàn thành
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 