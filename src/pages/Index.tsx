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
    totalPeriodsPerDay: 10,
    lunchPeriod: 6,
    breakPeriods: [3, 9],
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
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/4 -left-20 w-60 h-60 bg-secondary/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 right-1/3 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="flex items-center justify-center gap-6 animate-scale-in">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative glass p-4 rounded-full">
                <GraduationCap className="h-16 w-16 text-primary drop-shadow-lg" />
                <Sparkles className="h-6 w-6 text-accent absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-6xl font-bold gradient-text floating bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                SmartSchedule Pro
              </h1>
              <div className="flex items-center justify-center gap-2">
                <div className="h-1 w-12 bg-gradient-primary rounded-full"></div>
                <Badge variant="outline" className="text-xs font-medium border-primary/20">
                  AI-Powered
                </Badge>
                <div className="h-1 w-12 bg-gradient-primary rounded-full"></div>
              </div>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in-delay-2 leading-relaxed">
            Revolutionary timetable generation with intelligent lab allocation, 
            advanced constraint resolution, and seamless teacher preference integration
          </p>
          
          {/* Enhanced Stats Cards */}
          {hasGeneratedTimetables && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto animate-fade-in-delay-3">
              <Card className="glass shadow-elegant hover-scale group">
                <CardContent className="p-6 text-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <Calendar className="h-10 w-10 text-primary mx-auto relative z-10" />
                  </div>
                  <div className="text-3xl font-bold gradient-text mb-1">{classTimetables.length}</div>
                  <p className="text-sm text-muted-foreground font-medium">Classes Generated</p>
                </CardContent>
              </Card>
              
              <Card className="glass shadow-elegant hover-scale group">
                <CardContent className="p-6 text-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <Users className="h-10 w-10 text-secondary mx-auto relative z-10" />
                  </div>
                  <div className="text-3xl font-bold gradient-text mb-1">{teacherTimetables.length}</div>
                  <p className="text-sm text-muted-foreground font-medium">Teachers Scheduled</p>
                </CardContent>
              </Card>
              
              <Card className="glass shadow-elegant hover-scale group">
                <CardContent className="p-6 text-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <BookOpen className="h-10 w-10 text-accent mx-auto relative z-10" />
                  </div>
                  <div className="text-3xl font-bold gradient-text mb-1">{subjectData.length}</div>
                  <p className="text-sm text-muted-foreground font-medium">Subjects Allocated</p>
                </CardContent>
              </Card>
              
              <Card className="glass shadow-elegant hover-scale group">
                <CardContent className="p-6 text-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <Clock className="h-10 w-10 text-primary mx-auto relative z-10" />
                  </div>
                  <div className="text-3xl font-bold gradient-text mb-1">{scheduleSettings.totalPeriodsPerDay}</div>
                  <p className="text-sm text-muted-foreground font-medium">Periods Per Day</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid gap-8 xl:grid-cols-4 lg:grid-cols-3">
          {/* Enhanced Settings Panel */}
          <div className="xl:col-span-1 lg:col-span-1 animate-fade-in-delay-4">
            <div className="space-y-6">
              <div className="glass p-1 rounded-xl shadow-elegant">
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
              </div>
              
              {/* Enhanced Action Buttons */}
              {hasGeneratedTimetables && (
                <Card className="glass shadow-elegant animate-fade-in-delay-5 border-primary/20">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-2 w-2 bg-gradient-primary rounded-full animate-pulse"></div>
                      <h3 className="font-semibold gradient-text">Export & Actions</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        onClick={generateTimetables}
                        disabled={isGenerating}
                        size="default"
                        className="w-full hover-scale glass-button bg-gradient-primary text-primary-foreground group"
                      >
                        <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                        {isGenerating ? "Regenerating..." : "Regenerate Timetables"}
                      </Button>
                      
                      <Button 
                        onClick={handleExportCSV}
                        variant="outline" 
                        size="default" 
                        className="w-full hover-scale glass-button group"
                      >
                        <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        Export to CSV
                      </Button>
                      
                      <Button 
                        onClick={handleExportExcel}
                        variant="outline" 
                        size="default" 
                        className="w-full hover-scale glass-button group"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        Export to Excel
                      </Button>
                      
                      <Button 
                        onClick={clearAll}
                        variant="destructive" 
                        size="default" 
                        className="w-full hover-scale shadow-glow group"
                      >
                        <Trash2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        Clear All Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Enhanced Results Area */}
          <div className="xl:col-span-3 lg:col-span-2 space-y-8">
            {hasGeneratedTimetables ? (
              <div className="space-y-8 animate-fade-in-delay-5">
                <div className="glass p-1 rounded-xl shadow-elegant">
                  <TimetableDisplay
                    classTimetables={classTimetables}
                    teacherTimetables={teacherTimetables}
                    totalPeriods={scheduleSettings.totalPeriodsPerDay}
                    lunchPeriod={scheduleSettings.lunchPeriod}
                    breakPeriods={scheduleSettings.breakPeriods}
                  />
                </div>
                
                {allocationReport.length > 0 && (
                  <div className="animate-fade-in-delay-6 glass p-1 rounded-xl shadow-elegant">
                    <AllocationReport allocations={allocationReport} />
                  </div>
                )}
              </div>
            ) : (
              <Card className="glass text-center p-16 animate-fade-in-delay-5 shadow-elegant border-primary/10">
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="flex justify-center">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-primary rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                      <div className="relative glass p-8 rounded-full">
                        <Calendar className="h-32 w-32 text-primary/60" />
                        <Sparkles className="h-12 w-12 text-accent absolute -top-2 -right-2 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-bold gradient-text">
                      Ready to Create Magic ✨
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Upload your subject data and let our AI-powered engine craft 
                      the perfect timetables with intelligent constraint resolution 
                      and optimized scheduling algorithms.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                    <Button 
                      onClick={generateTimetables}
                      disabled={subjectData.length === 0 || isGenerating}
                      size="lg"
                      className="hover-scale shadow-elegant px-8 py-6 text-lg group"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-6 w-6 mr-3 animate-spin" />
                          Generating Magic...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform" />
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