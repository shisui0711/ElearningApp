import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Field definition interface
export interface ExcelField {
  key: string;
  label: string;
  required?: boolean;
  getValue?: (item: any) => any;
  setValue?: (value: any, item: any) => any;
}

// Available fields for students
export const studentFields: ExcelField[] = [
  { key: "firstName", label: "Họ", required: true },
  { key: "lastName", label: "Tên", required: true },
  { key: "displayName", label: "Họ tên đầy đủ" },
  { key: "email", label: "Email", required: true },
  { key: "username", label: "Tên đăng nhập", required: true },
  { key: "password", label: "Mật khẩu", required: true },
  {
    key: "class",
    label: "Lớp",
    required: true,
    getValue: (student) => student.class?.name || "",
    setValue: (value, item) => {
      // This will be handled separately since we need to look up the class by name
      return { ...item, className: value };
    },
  },
];

// Available fields for teachers
export const teacherFields: ExcelField[] = [
  { key: "displayName", label: "Họ tên đầy đủ", required: true },
  { key: "email", label: "Email", required: true },
  { key: "username", label: "Tên đăng nhập", required: true },
  { key: "password", label: "Mật khẩu", required: true }
];

// Export students to Excel
export const exportToExcel = (
  data: any[],
  fields: ExcelField[],
  filename: string
) => {
  // Convert data to worksheet format
  const processedData = data.map((item) => {
    const row: any = {};
    fields.forEach((field) => {
      if (field.getValue) {
        row[field.label] = field.getValue(item);
      } else {
        if (field.key.includes(".")) {
          const keys = field.key.split(".");
          let value = item;
          for (const key of keys) {
            value = value?.[key];
            if (value === undefined) break;
          }
          row[field.label] = value ?? "";
        } else {
          row[field.label] = item[field.key] ?? "";
        }
      }
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(processedData);

  // Auto-fit column widths
  const colWidths = fields.map((field) => {
    const header = field.label;
    let maxLength = header.length;

    for (const row of processedData) {
      const cellValue = row[header];
      const cellLength = cellValue ? cellValue.toString().length : 0;
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    }

    return { wch: maxLength + 2 }; // +2 for padding
  });

  worksheet["!cols"] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách");

  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Save file
  saveAs(blob, `${filename}.xlsx`);
};

// Parse Excel file to JSON
export const parseExcel = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};

// Map Excel data to student objects
export const mapExcelDataToStudents = (
  data: any[],
  fieldMapping: Record<string, string>,
  classes: any[]
) => {
  return data.map((row) => {
    const student: any = { user: {} };

    // Map fields according to the provided mapping
    Object.entries(fieldMapping).forEach(([excelField, modelField]) => {
      const value = row[excelField];
      if (value !== undefined) {
        // Handle special fields
        if (modelField === "class") {
          // Find class by name
          const classItem = classes.find((c) => c.name === value);
          if (classItem) {
            student.classId = classItem.id;
          }
        } else if (
          [
            "firstName",
            "lastName",
            "email",
            "username",
            "password",
            "displayName",
          ].includes(modelField)
        ) {
          // User fields go to user object
          student.user[modelField] = value;
        } else {
          // Other fields go directly to student
          student[modelField] = value;
        }
      }
    });

    return student;
  });
};

// Map Excel data to teacher objects
export const mapExcelDataToTeachers = (
  data: any[],
  fieldMapping: Record<string, string>
) => {
  return data.map((row) => {
    const teacher: any = { user: {} };

    // Map fields according to the provided mapping
    Object.entries(fieldMapping).forEach(([excelField, modelField]) => {
      const value = row[excelField];
      if (value !== undefined) {
        if (
          [
            "displayName",
            "email",
            "username",
            "password"
          ].includes(modelField)
        ) {
          // User fields go to user object
          teacher.user[modelField] = value;
        } else {
          // Other fields go directly to teacher
          teacher[modelField] = value;
        }
      }
    });

    return teacher;
  });
};
