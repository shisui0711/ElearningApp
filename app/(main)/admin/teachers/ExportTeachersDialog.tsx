import { useState } from "react";
import { ExcelField, exportToExcel, teacherFields } from "@/lib/excel";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type ExportTeachersDialogProps = {
  open: boolean;
  onClose: () => void;
  teachers: any[];
};

// Sortable item component
function SortableItem({ id, field }: { id: string; field: ExcelField }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-secondary/30 rounded-md p-2 border border-transparent"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab focus:outline-none"
        type="button"
      >
        <GripVertical size={16} className="text-muted-foreground" />
      </button>
      <span>{field.label}</span>
      {field.required && <span className="text-destructive text-sm ml-auto">*</span>}
    </div>
  );
}

export default function ExportTeachersDialog({
  open,
  onClose,
  teachers,
}: ExportTeachersDialogProps) {
  // Initialize with all available fields
  const [selectedFields, setSelectedFields] = useState<ExcelField[]>([...teacherFields]);
  const [isExporting, setIsExporting] = useState(false);

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Map teacher data to include user properties at top level
  const prepareTeacherData = (teachers: any[]) => {
    return teachers.map(teacher => ({
      ...teacher,
      displayName: teacher.user.displayName,
      email: teacher.user.email,
      username: teacher.user.username,
    }));
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const preparedData = prepareTeacherData(teachers);
      exportToExcel(preparedData, selectedFields, 'danh-sach-giang-vien');
      onClose();
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleField = (field: ExcelField) => {
    const fieldIndex = selectedFields.findIndex(f => f.key === field.key);
    
    if (fieldIndex >= 0) {
      // Remove field if it's already selected
      setSelectedFields(prev => prev.filter(f => f.key !== field.key));
    } else {
      // Add field if it's not selected
      setSelectedFields(prev => [...prev, field]);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setSelectedFields((items) => {
        const oldIndex = items.findIndex(item => item.key === active.id);
        const newIndex = items.findIndex(item => item.key === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const isFieldSelected = (field: ExcelField) => {
    return selectedFields.some(f => f.key === field.key);
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xuất danh sách giảng viên</DialogTitle>
          <DialogDescription>
            Chọn và sắp xếp các trường dữ liệu để xuất. Kéo và thả để thay đổi thứ tự các trường.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="space-y-2">
            <Label>Trường dữ liệu</Label>
            <div className="grid grid-cols-2 gap-2">
              {teacherFields.map((field) => (
                <div
                  key={field.key}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`field-${field.key}`}
                    checked={isFieldSelected(field)}
                    onCheckedChange={() => handleToggleField(field)}
                  />
                  <Label htmlFor={`field-${field.key}`} className="cursor-pointer">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Thứ tự xuất (kéo để thay đổi)</Label>
            <div className="border rounded-md p-2 min-h-[100px]">
              {selectedFields.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Chưa có trường nào được chọn
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                >
                  <SortableContext
                    items={selectedFields.map(field => field.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedFields.map((field) => (
                        <SortableItem key={field.key} id={field.key} field={field} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || selectedFields.length === 0}
          >
            {isExporting ? "Đang xuất..." : "Xuất Excel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 