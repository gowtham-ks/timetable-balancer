import { SubjectData } from '@/types/timetable';

export function parseCSV(csvContent: string): SubjectData[] {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Required columns
  const requiredColumns = ['department', 'year', 'section', 'subject', 'periods', 'staff'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  const data: SubjectData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1}: Column count mismatch. Expected ${headers.length}, got ${values.length}`);
      continue;
    }

    try {
      const rowData: any = {};
      
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });

      // Validate and convert required fields
      const periods = parseInt(rowData.periods);
      if (isNaN(periods) || periods <= 0) {
        throw new Error(`Invalid periods value: ${rowData.periods}`);
      }

      const subjectData: SubjectData = {
        department: rowData.department || '',
        year: rowData.year || '',
        section: rowData.section || '',
        subject: rowData.subject || '',
        periods: periods,
        staff: rowData.staff || '',
        preferredDay: rowData.preferredday || rowData.preferred_day,
        preferredPeriod: rowData.preferredperiod || rowData.preferred_period ? 
          parseInt(rowData.preferredperiod || rowData.preferred_period) : undefined,
        preferredSlots: rowData.preferredslots || rowData.preferred_slots
      };

      // Validate required fields
      if (!subjectData.department || !subjectData.year || !subjectData.section || 
          !subjectData.subject || !subjectData.staff) {
        throw new Error('Missing required field values');
      }

      data.push(subjectData);
    } catch (error) {
      console.error(`Error parsing row ${i + 1}:`, error);
      throw new Error(`Error in row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
    }
  }

  if (data.length === 0) {
    throw new Error('No valid data rows found in CSV file');
  }

  return data;
}

export function validateCSVStructure(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.trim().split('\n');
        
        if (lines.length < 2) {
          reject(new Error('CSV file must contain at least a header row and one data row'));
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredColumns = ['department', 'year', 'section', 'subject', 'periods', 'staff'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
          return;
        }

        resolve(true);
      } catch (error) {
        reject(new Error('Invalid CSV format'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}