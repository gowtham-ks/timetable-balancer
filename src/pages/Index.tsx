import { useState } from 'react';
import { TimetableGenerator } from '@/utils/timetableGenerator';
import { TimetableDisplay } from '@/components/TimetableDisplay';
import { AllocationReport } from '@/components/AllocationReport';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  SubjectData, 
  TeacherPreference, 
  ScheduleSettings,
  ClassTimetable,
  TeacherTimetable,
  SubjectAllocation
} from '@/types/timetable';
import { exportToCSV, downloadCSV } from '@/utils/exportUtils';
import { exportToExcel } from '@/utils/exportUtils';
import { 
  Download,
  FileSpreadsheet,
  RefreshCw,
  Trash2,
  GraduationCap,
  Clock,
  Users,
  BookOpen,
  Calendar,
  Sparkles
} from 'lucide-react';

const Index = () => {
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);
  const [teacherPreferences, setTeacherPreferences] = useState<TeacherPreference[]>([]);
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    totalPeriodsPerDay: 9,
    lunchPeriod: 5,
    breakPeriods: [3],
    maxTeacherPeriodsPerWeek: 25,
  });
  
  const [classTimetables, setClassTimetables] = useState<ClassTimetable[]>([]);
  const [teacherTimetables, setTeacherTimetables] = useState<TeacherTimetable[]>([]);
  const [allocationReport, setAllocationReport] = useState<SubjectAllocation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { toast } = useToast();

  const generateTimetables = async () => {
    if (subjectData.length === 0) {
      toast({
        title: "No Data",
        description: "Please upload subject data before generating timetables",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Starting timetable generation with:', {
        subjects: subjectData.length,
        teachers: teacherPreferences.length,
        settings: scheduleSettings
      });

      const generator = new TimetableGenerator(subjectData, teacherPreferences, scheduleSettings);
      const result = generator.generateTimetables();
      
      // Get current state for allocations
      const currentState = generator.getCurrentState();
      const allocations = Array.from(currentState.subjectAllocations.values());
      
      setClassTimetables(result.classTimetables);
      setTeacherTimetables(result.teacherTimetables);
      setAllocationReport(allocations);

      // Check for allocation issues
      const underAllocated = allocations.filter(a => a.allocatedPeriods < a.requiredPeriods);
      const overAllocated = allocations.filter(a => a.allocatedPeriods > a.requiredPeriods);

      if (overAllocated.length > 0 || underAllocated.length > 0) {
        console.warn('Allocation issues detected:', { overAllocated, underAllocated });
      }

      toast({
        title: "Timetables Generated Successfully! ✨",
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
      description: "Timetables exported to Excel file",
    });
  };

  const clearAll = () => {
    setSubjectData([]);
    setTeacherPreferences([]);
    setClassTimetables([]);
    setTeacherTimetables([]);
    setAllocationReport([]);
    
    toast({
      title: "Data Cleared",
      description: "All data has been cleared",
    });
  };

  const hasGeneratedTimetables = classTimetables.length > 0 || teacherTimetables.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="flex items-center justify-center gap-4 animate-float">
            <div className="relative">
              <GraduationCap className="h-16 w-16 text-primary drop-shadow-lg" />
              <Sparkles className="h-6 w-6 text-primary-light absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold gradient-text floating">
              Advanced Timetable Generator
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-delay-2">
            Create intelligent, constraint-based timetables with advanced lab allocation, 
            teacher preferences, and conflict resolution
          </p>
          
          {/* Stats Cards */}
          {hasGeneratedTimetables && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-fade-in-delay-3">
              <Card className="card-gradient hover-scale">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                  <Badge variant="secondary" className="mb-1">{classTimetables.length}</Badge>
                  <p className="text-sm text-muted-foreground">Classes</p>
                </CardContent>
              </Card>
              
              <Card className="card-gradient hover-scale">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <Badge variant="secondary" className="mb-1">{teacherTimetables.length}</Badge>
                  <p className="text-sm text-muted-foreground">Teachers</p>
                </CardContent>
              </Card>
              
              <Card className="card-gradient hover-scale">
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                  <Badge variant="secondary" className="mb-1">{subjectData.length}</Badge>
                  <p className="text-sm text-muted-foreground">Subjects</p>
                </CardContent>
              </Card>
              
              <Card className="card-gradient hover-scale">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <Badge variant="secondary" className="mb-1">{scheduleSettings.totalPeriodsPerDay}</Badge>
                  <p className="text-sm text-muted-foreground">Periods/Day</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid gap-8 xl:grid-cols-3 lg:grid-cols-2">
          {/* Settings Panel */}
          <div className="xl:col-span-1 lg:col-span-1 animate-fade-in-delay-4">
            <div className="space-y-6">
              <SettingsPanel
                subjectData={subjectData}
                teacherPreferences={teacherPreferences}
                scheduleSettings={scheduleSettings}
                onSubjectDataChange={setSubjectData}
                onTeacherPreferencesChange={setTeacherPreferences}
                onScheduleSettingsChange={setScheduleSettings}
                onGenerateTimetables={generateTimetables}
                isGenerating={isGenerating}
              />
              
              {/* Action Buttons */}
              {hasGeneratedTimetables && (
                <Card className="card-gradient animate-fade-in-delay-5">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm gradient-text">Export Options</h3>
                    
                    <div className="space-y-2">
                      <Button 
                        onClick={handleExportCSV}
                        variant="outline" 
                        size="sm" 
                        className="w-full hover-scale"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      
                      <Button 
                        onClick={handleExportExcel}
                        variant="outline" 
                        size="sm" 
                        className="w-full hover-scale"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export Excel
                      </Button>
                      
                      <Button 
                        onClick={clearAll}
                        variant="destructive" 
                        size="sm" 
                        className="w-full hover-scale"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Results Area */}
          <div className="xl:col-span-2 lg:col-span-1 space-y-8">
            {hasGeneratedTimetables ? (
              <div className="space-y-8 animate-fade-in-delay-5">
                <TimetableDisplay
                  classTimetables={classTimetables}
                  teacherTimetables={teacherTimetables}
                  totalPeriods={scheduleSettings.totalPeriodsPerDay}
                  lunchPeriod={scheduleSettings.lunchPeriod}
                  breakPeriods={scheduleSettings.breakPeriods}
                />
                
                {allocationReport.length > 0 && (
                  <div className="animate-fade-in-delay-6">
                    <AllocationReport allocations={allocationReport} />
                  </div>
                )}
              </div>
            ) : (
              <Card className="card-gradient text-center p-12 animate-fade-in-delay-5">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <Calendar className="h-24 w-24 text-muted-foreground/30" />
                      <Sparkles className="h-8 w-8 text-primary absolute -top-2 -right-2 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold text-muted-foreground">
                    Ready to Generate Timetables
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Upload your subject data and configure settings to generate 
                    intelligent, optimized timetables with advanced constraint resolution.
                  </p>
                  <div className="pt-4">
                    <Button 
                      onClick={generateTimetables}
                      disabled={subjectData.length === 0 || isGenerating}
                      size="lg"
                      className="hover-scale shadow-elegant"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Generate Timetables
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;