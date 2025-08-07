import React, { useState } from 'react';
import { GraduationCap, Calendar, Download, FileSpreadsheet, Printer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { SettingsPanel } from '@/components/SettingsPanel';
import { TimetableDisplay } from '@/components/TimetableDisplay';
import { TimetableGenerator } from '@/utils/timetableGenerator';
import { exportToCSV, exportToExcel, downloadCSV, printTimetables } from '@/utils/exportUtils';
import { SubjectData, TeacherPreference, ScheduleSettings, ClassTimetable, TeacherTimetable } from '@/types/timetable';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [teacherPreferences, setTeacherPreferences] = useState<TeacherPreference[]>([]);
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    totalPeriodsPerDay: 10,
    lunchPeriod: 6,
    breakPeriods: [3, 9],
    maxTeacherPeriodsPerWeek: 30
  });
  const [classTimetables, setClassTimetables] = useState<ClassTimetable[]>([]);
  const [teacherTimetables, setTeacherTimetables] = useState<TeacherTimetable[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();

  const handleDataUpload = (data: SubjectData[]) => {
    setSubjectData(data);
    setClassTimetables([]);
    setTeacherTimetables([]);
    
    toast({
      title: "Data Loaded",
      description: `Successfully loaded ${data.length} subject entries`,
    });
  };

  const generateTimetables = async () => {
    if (subjectData.length === 0) {
      toast({
        title: "No Data",
        description: "Please upload CSV data first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const generator = new TimetableGenerator(subjectData, teacherPreferences, scheduleSettings);
      const result = generator.generateTimetables();
      
      setClassTimetables(result.classTimetables);
      setTeacherTimetables(result.teacherTimetables);

      // Get allocation report
      const allocationReport = generator.getSubjectAllocationReport();
      const overAllocated = allocationReport.filter(a => a.allocatedPeriods > a.requiredPeriods);
      const underAllocated = allocationReport.filter(a => a.allocatedPeriods < a.requiredPeriods);

      if (overAllocated.length > 0 || underAllocated.length > 0) {
        console.warn('Allocation issues detected:', { overAllocated, underAllocated });
      }

      toast({
        title: "Timetables Generated",
        description: `Generated ${result.classTimetables.length} class timetables and ${result.teacherTimetables.length} teacher timetables`,
      });
    } catch (error) {
      console.error('Error generating timetables:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate timetables",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = () => {
    const { classCSV, teacherCSV } = exportToCSV(classTimetables, teacherTimetables);
    downloadCSV(classCSV, 'class_timetables.csv');
    downloadCSV(teacherCSV, 'teacher_timetables.csv');
    
    toast({
      title: "Export Successful",
      description: "Timetables exported to CSV files",
    });
  };

  const handleExportExcel = () => {
    exportToExcel(classTimetables, teacherTimetables);
    
    toast({
      title: "Export Successful",
      description: "Timetables exported to Excel format",
    });
  };

  const clearAll = () => {
    setSubjectData([]);
    setTeacherPreferences([]);
    setClassTimetables([]);
    setTeacherTimetables([]);
    
    toast({
      title: "Data Cleared",
      description: "All data has been cleared",
    });
  };

  const hasGeneratedTimetables = classTimetables.length > 0 || teacherTimetables.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3 animate-float">
            <GraduationCap className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">
              Advanced Timetable Generator
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Intelligent scheduling with teacher preferences, conflict resolution, and proper period allocation
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Data Upload Section */}
          <Card className="card-gradient shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Data Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload onDataUpload={handleDataUpload} />
              {subjectData.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-success font-medium">
                    ✓ Loaded {subjectData.length} subjects from CSV
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings Panel */}
          <SettingsPanel
            scheduleSettings={scheduleSettings}
            teacherPreferences={teacherPreferences}
            onScheduleSettingsChange={setScheduleSettings}
            onTeacherPreferencesChange={setTeacherPreferences}
          />

          {/* Action Buttons */}
          <Card className="card-gradient shadow-card">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  onClick={generateTimetables}
                  variant="hero"
                  size="lg"
                  disabled={isGenerating || subjectData.length === 0}
                  className="animate-pulse-glow"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Timetables'}
                </Button>

                {hasGeneratedTimetables && (
                  <>
                    <Button onClick={handleExportCSV} variant="outline" size="lg">
                      <Download className="h-5 w-5 mr-2" />
                      Export CSV
                    </Button>

                    <Button onClick={handleExportExcel} variant="outline" size="lg">
                      <FileSpreadsheet className="h-5 w-5 mr-2" />
                      Export Excel
                    </Button>

                    <Button onClick={printTimetables} variant="outline" size="lg">
                      <Printer className="h-5 w-5 mr-2" />
                      Print
                    </Button>
                  </>
                )}

                <Button onClick={clearAll} variant="destructive" size="lg">
                  <Trash2 className="h-5 w-5 mr-2" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timetables Display */}
          {hasGeneratedTimetables && (
            <Tabs defaultValue="classes" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="classes">Class Timetables</TabsTrigger>
                <TabsTrigger value="teachers">Teacher Timetables</TabsTrigger>
              </TabsList>
              
              <TabsContent value="classes" className="space-y-6">
                <TimetableDisplay
                  classTimetables={classTimetables}
                  teacherTimetables={[]}
                  totalPeriodsPerDay={scheduleSettings.totalPeriodsPerDay}
                  lunchPeriod={scheduleSettings.lunchPeriod}
                  breakPeriods={scheduleSettings.breakPeriods}
                />
              </TabsContent>
              
              <TabsContent value="teachers" className="space-y-6">
                <TimetableDisplay
                  classTimetables={[]}
                  teacherTimetables={teacherTimetables}
                  totalPeriodsPerDay={scheduleSettings.totalPeriodsPerDay}
                  lunchPeriod={scheduleSettings.lunchPeriod}
                  breakPeriods={scheduleSettings.breakPeriods}
                />
              </TabsContent>
            </Tabs>
          )}

          {!hasGeneratedTimetables && subjectData.length > 0 && (
            <Card className="card-gradient shadow-card">
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ready to Generate</h3>
                <p className="text-muted-foreground">
                  Configure your settings and click "Generate Timetables" to create schedules
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
