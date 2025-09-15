import React, { useState, useCallback } from 'react';
import { Edit, Save, X, Plus, Trash2, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SubjectData } from '@/types/timetable';
import { useToast } from '@/hooks/use-toast';

interface CSVEditorProps {
  data: SubjectData[];
  onDataChange: (data: SubjectData[]) => void;
}

export const CSVEditor: React.FC<CSVEditorProps> = ({ data, onDataChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<SubjectData[]>([]);
  const { toast } = useToast();

  const startEditing = useCallback(() => {
    setEditingData([...data]);
    setIsEditing(true);
  }, [data]);

  const cancelEditing = useCallback(() => {
    setEditingData([]);
    setIsEditing(false);
  }, []);

  const saveChanges = useCallback(() => {
    onDataChange(editingData);
    setIsEditing(false);
    toast({
      title: "Changes Saved",
      description: "CSV data has been updated successfully",
    });
  }, [editingData, onDataChange, toast]);

  const updateRow = useCallback((index: number, field: keyof SubjectData, value: string | number) => {
    const newData = [...editingData];
    newData[index] = { ...newData[index], [field]: value };
    setEditingData(newData);
  }, [editingData]);

  const addRow = useCallback(() => {
    const newRow: SubjectData = {
      department: '',
      year: '',
      section: '',
      subject: '',
      periods: 0,
      staff: '',
      preferredDay: '',
      preferredPeriod: undefined,
      preferredSlots: ''
    };
    setEditingData([...editingData, newRow]);
  }, [editingData]);

  const removeRow = useCallback((index: number) => {
    const newData = editingData.filter((_, i) => i !== index);
    setEditingData(newData);
  }, [editingData]);

  const exportCSV = useCallback(() => {
    const csvContent = data.map(row => [
      row.department,
      row.year,
      row.section,
      row.subject,
      row.periods,
      row.staff,
      row.preferredDay || '',
      row.preferredPeriod || '',
      row.preferredSlots || ''
    ].join(',')).join('\n');
    
    const headers = 'Department,Year,Section,Subject,Periods,Staff,PreferredDay,PreferredPeriod,PreferredSlots\n';
    const fullContent = headers + csvContent;
    
    const blob = new Blob([fullContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timetable-data.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "CSV Exported",
      description: "Data exported successfully to CSV file",
    });
  }, [data, toast]);

  const displayData = isEditing ? editingData : data;

  if (data.length === 0) {
    return (
      <Card className="card-gradient shadow-card animate-fade-in">
        <CardContent className="p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Upload a CSV file to enable editing
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-gradient shadow-card animate-fade-in electric-pulse">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl gradient-text neon-glow flex items-center gap-3">
            <span className="text-3xl">📝</span>
            CSV Data Editor
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportCSV}
                  className="hover-scale"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={startEditing}
                  className="hover-scale bg-gradient-electric"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Data
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={cancelEditing}
                  className="hover-scale"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  variant="success" 
                  size="sm" 
                  onClick={saveChanges}
                  className="hover-scale"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-border p-3 bg-primary/10 text-primary font-semibold">Department</th>
                <th className="border border-border p-3 bg-primary/10 text-primary font-semibold">Year</th>
                <th className="border border-border p-3 bg-primary/10 text-primary font-semibold">Section</th>
                <th className="border border-border p-3 bg-primary/10 text-primary font-semibold">Subject</th>
                <th className="border border-border p-3 bg-primary/10 text-primary font-semibold">Periods</th>
                <th className="border border-border p-3 bg-primary/10 text-primary font-semibold">Staff</th>
                <th className="border border-border p-3 bg-primary/10 text-primary font-semibold">Preferred Day</th>
                <th className="border border-border p-3 bg-primary/10 text-primary font-semibold">Preferred Period</th>
                <th className="border border-border p-3 bg-primary/10 text-primary font-semibold">Preferred Slots</th>
                {isEditing && (
                  <th className="border border-border p-3 bg-primary/10 text-primary font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, index) => (
                <tr key={index} className="hover:bg-primary/5 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td className="border border-border p-2">
                    {isEditing ? (
                      <Input
                        value={row.department}
                        onChange={(e) => updateRow(index, 'department', e.target.value)}
                        className="min-w-24"
                      />
                    ) : (
                      <span className="text-sm">{row.department}</span>
                    )}
                  </td>
                  <td className="border border-border p-2">
                    {isEditing ? (
                      <Input
                        value={row.year}
                        onChange={(e) => updateRow(index, 'year', e.target.value)}
                        className="min-w-20"
                      />
                    ) : (
                      <span className="text-sm">{row.year}</span>
                    )}
                  </td>
                  <td className="border border-border p-2">
                    {isEditing ? (
                      <Input
                        value={row.section}
                        onChange={(e) => updateRow(index, 'section', e.target.value)}
                        className="min-w-20"
                      />
                    ) : (
                      <span className="text-sm">{row.section}</span>
                    )}
                  </td>
                  <td className="border border-border p-2">
                    {isEditing ? (
                      <Input
                        value={row.subject}
                        onChange={(e) => updateRow(index, 'subject', e.target.value)}
                        className="min-w-32"
                      />
                    ) : (
                      <span className="text-sm font-medium text-primary">{row.subject}</span>
                    )}
                  </td>
                  <td className="border border-border p-2">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={row.periods}
                        onChange={(e) => updateRow(index, 'periods', parseInt(e.target.value) || 0)}
                        className="min-w-20"
                      />
                    ) : (
                      <span className="text-sm text-center block">{row.periods}</span>
                    )}
                  </td>
                  <td className="border border-border p-2">
                    {isEditing ? (
                      <Input
                        value={row.staff}
                        onChange={(e) => updateRow(index, 'staff', e.target.value)}
                        className="min-w-32"
                      />
                    ) : (
                      <span className="text-sm">{row.staff}</span>
                    )}
                  </td>
                  <td className="border border-border p-2">
                    {isEditing ? (
                      <Input
                        value={row.preferredDay || ''}
                        onChange={(e) => updateRow(index, 'preferredDay', e.target.value)}
                        className="min-w-24"
                        placeholder="Optional"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{row.preferredDay || '-'}</span>
                    )}
                  </td>
                  <td className="border border-border p-2">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={row.preferredPeriod || ''}
                        onChange={(e) => updateRow(index, 'preferredPeriod', parseInt(e.target.value) || undefined)}
                        className="min-w-20"
                        placeholder="Optional"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground text-center block">{row.preferredPeriod || '-'}</span>
                    )}
                  </td>
                  <td className="border border-border p-2">
                    {isEditing ? (
                      <Input
                        value={row.preferredSlots || ''}
                        onChange={(e) => updateRow(index, 'preferredSlots', e.target.value)}
                        className="min-w-24"
                        placeholder="Optional"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{row.preferredSlots || '-'}</span>
                    )}
                  </td>
                  {isEditing && (
                    <td className="border border-border p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRow(index)}
                        className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {isEditing && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={addRow}
              className="hover-scale bg-gradient-neon"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Row
            </Button>
          </div>
        )}

        {!isEditing && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Total rows: {data.length} | Click "Edit Data" to modify entries</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};