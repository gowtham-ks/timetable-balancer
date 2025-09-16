import { ClassTimetable, TeacherTimetable, ScheduleSettings } from '@/types/timetable';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export function exportClassTimetablesToCSV(classTimetables: ClassTimetable[], scheduleSettings: ScheduleSettings) {
  const { classCSV } = exportToCSV(classTimetables, []);
  downloadCSV(classCSV, 'class-timetables.csv');
}

export function exportTeacherTimetablesToCSV(teacherTimetables: TeacherTimetable[], scheduleSettings: ScheduleSettings) {
  const { teacherCSV } = exportToCSV([], teacherTimetables);
  downloadCSV(teacherCSV, 'teacher-timetables.csv');
}

export function exportClassTimetablesToExcel(classTimetables: ClassTimetable[], scheduleSettings: ScheduleSettings) {
  exportTimetablesToExcel(classTimetables, [], 'class-timetables.xlsx');
}

export function exportTeacherTimetablesToExcel(teacherTimetables: TeacherTimetable[], scheduleSettings: ScheduleSettings) {
  exportTimetablesToExcel([], teacherTimetables, 'teacher-timetables.xlsx');
}

export function exportAllTimetablesToExcel(classTimetables: ClassTimetable[], teacherTimetables: TeacherTimetable[], scheduleSettings: ScheduleSettings) {
  exportTimetablesToExcel(classTimetables, teacherTimetables, 'all-timetables.xlsx');
}

export function exportTimetablesToPDF(classTimetables: ClassTimetable[], teacherTimetables: TeacherTimetable[], scheduleSettings: ScheduleSettings) {
  const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  let yOffset = 20;
  
  // Add title
  pdf.setFontSize(16);
  pdf.text('Timetables Report', 20, yOffset);
  yOffset += 15;
  
  // Export Class Timetables
  if (classTimetables.length > 0) {
    pdf.setFontSize(14);
    pdf.text('Class Timetables:', 20, yOffset);
    yOffset += 10;
    
    classTimetables.forEach((classData, index) => {
      if (yOffset > 180) { // New page if needed
        pdf.addPage();
        yOffset = 20;
      }
      
      pdf.setFontSize(12);
      pdf.text(`Class: ${classData.className}`, 20, yOffset);
      yOffset += 8;
      
      // Simple table representation
      const tableData: string[][] = [];
      const headers = ['Period', ...days];
      tableData.push(headers);
      
      for (let period = 1; period <= scheduleSettings.totalPeriodsPerDay; period++) {
        const row = [`${period}`];
        days.forEach((_, dayIndex) => {
          const slot = classData.schedule[dayIndex]?.[period - 1];
          if (period === scheduleSettings.lunchPeriod) {
            row.push('LUNCH');
          } else if (scheduleSettings.breakPeriods.includes(period)) {
            row.push('BREAK');
          } else if (slot?.subject) {
            row.push(`${slot.subject}\n${slot.staff || ''}`);
          } else {
            row.push('Free');
          }
        });
        tableData.push(row);
      }
      
      // Add simple text-based table
      tableData.forEach((row, rowIndex) => {
        if (yOffset > 180) {
          pdf.addPage();
          yOffset = 20;
        }
        
        let xOffset = 20;
        row.forEach((cell, colIndex) => {
          pdf.setFontSize(8);
          const cellText = cell.length > 15 ? cell.substring(0, 15) + '...' : cell;
          pdf.text(cellText, xOffset, yOffset);
          xOffset += 35;
        });
        yOffset += 6;
      });
      
      yOffset += 10;
    });
  }
  
  // Export Teacher Timetables
  if (teacherTimetables.length > 0) {
    if (yOffset > 100) {
      pdf.addPage();
      yOffset = 20;
    }
    
    pdf.setFontSize(14);
    pdf.text('Teacher Timetables:', 20, yOffset);
    yOffset += 10;
    
    teacherTimetables.forEach((teacherData) => {
      if (yOffset > 180) {
        pdf.addPage();
        yOffset = 20;
      }
      
      pdf.setFontSize(12);
      pdf.text(`Teacher: ${teacherData.teacherName}`, 20, yOffset);
      yOffset += 8;
      
      // Simple table for teacher
      const tableData: string[][] = [];
      const headers = ['Period', ...days];
      tableData.push(headers);
      
      for (let period = 1; period <= scheduleSettings.totalPeriodsPerDay; period++) {
        const row = [`${period}`];
        days.forEach((_, dayIndex) => {
          const slot = teacherData.schedule[dayIndex]?.[period - 1];
          if (period === scheduleSettings.lunchPeriod) {
            row.push('LUNCH');
          } else if (scheduleSettings.breakPeriods.includes(period)) {
            row.push('BREAK');
          } else if (slot?.subject) {
            row.push(`${slot.subject}\n${slot.className || ''}`);
          } else {
            row.push('Free');
          }
        });
        tableData.push(row);
      }
      
      // Add simple text-based table
      tableData.forEach((row) => {
        if (yOffset > 180) {
          pdf.addPage();
          yOffset = 20;
        }
        
        let xOffset = 20;
        row.forEach((cell) => {
          pdf.setFontSize(8);
          const cellText = cell.length > 15 ? cell.substring(0, 15) + '...' : cell;
          pdf.text(cellText, xOffset, yOffset);
          xOffset += 35;
        });
        yOffset += 6;
      });
      
      yOffset += 10;
    });
  }
  
  pdf.save('timetables.pdf');
}

export function exportToCSV(classTimetables: ClassTimetable[], teacherTimetables: TeacherTimetable[]) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Class timetables CSV
  let classCSV = 'Type,Name,Day,Period,Subject,Staff\n';
  classTimetables.forEach(classData => {
    classData.schedule.forEach((daySchedule, dayIndex) => {
      daySchedule.forEach((slot, periodIndex) => {
        if (slot.subject) {
          classCSV += `Class,${classData.className},${days[dayIndex]},${periodIndex + 1},${slot.subject},${slot.staff}\n`;
        }
      });
    });
  });

  // Teacher timetables CSV
  let teacherCSV = 'Type,Name,Day,Period,Subject,Class\n';
  teacherTimetables.forEach(teacherData => {
    teacherData.schedule.forEach((daySchedule, dayIndex) => {
      daySchedule.forEach((slot, periodIndex) => {
        if (slot.subject) {
          teacherCSV += `Teacher,${teacherData.teacherName},${days[dayIndex]},${periodIndex + 1},${slot.subject},${slot.className}\n`;
        }
      });
    });
  });

  return { classCSV, teacherCSV };
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportTimetablesToExcel(classTimetables: ClassTimetable[], teacherTimetables: TeacherTimetable[], filename: string) {
  const workbook = XLSX.utils.book_new();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Create Class Timetables Sheet
  if (classTimetables.length > 0) {
    const classData: any[][] = [];
    
    classTimetables.forEach(classData_item => {
      // Add class header
      classData.push([`Class: ${classData_item.className}`]);
      classData.push(['Period', ...days]);
      
      // Add timetable data
      for (let period = 1; period <= 10; period++) { // Assuming 10 periods max
        const row = [`Period ${period}`];
        days.forEach((_, dayIndex) => {
          const slot = classData_item.schedule[dayIndex]?.[period - 1];
          if (slot?.subject) {
            row.push(`${slot.subject} (${slot.staff || 'TBD'})`);
          } else {
            row.push('Free');
          }
        });
        classData.push(row);
      }
      
      classData.push([]); // Empty row between classes
    });
    
    const classWorksheet = XLSX.utils.aoa_to_sheet(classData);
    XLSX.utils.book_append_sheet(workbook, classWorksheet, 'Class Timetables');
  }
  
  // Create Teacher Timetables Sheet
  if (teacherTimetables.length > 0) {
    const teacherData: any[][] = [];
    
    teacherTimetables.forEach(teacherData_item => {
      // Add teacher header
      teacherData.push([`Teacher: ${teacherData_item.teacherName}`]);
      teacherData.push(['Period', ...days]);
      
      // Add timetable data
      for (let period = 1; period <= 10; period++) { // Assuming 10 periods max
        const row = [`Period ${period}`];
        days.forEach((_, dayIndex) => {
          const slot = teacherData_item.schedule[dayIndex]?.[period - 1];
          if (slot?.subject) {
            row.push(`${slot.subject} (${slot.className || 'TBD'})`);
          } else {
            row.push('Free');
          }
        });
        teacherData.push(row);
      }
      
      teacherData.push([]); // Empty row between teachers
    });
    
    const teacherWorksheet = XLSX.utils.aoa_to_sheet(teacherData);
    XLSX.utils.book_append_sheet(workbook, teacherWorksheet, 'Teacher Timetables');
  }
  
  // Save the file
  XLSX.writeFile(workbook, filename);
}

export function printTimetables() {
  window.print();
}