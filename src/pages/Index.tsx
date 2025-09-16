import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsPanel } from '@/components/SettingsPanel';
import { TimetableDisplay } from '@/components/TimetableDisplay';
import { AllocationReport } from '@/components/AllocationReport';
import { CSVEditor } from '@/components/CSVEditor';
import { FileUpload } from '@/components/FileUpload';
import { useToast } from '@/hooks/use-toast';
import { TimetableGenerator } from '@/utils/timetableGenerator';
import { exportClassTimetablesToCSV, exportTeacherTimetablesToCSV, exportAllTimetablesToExcel, exportTimetablesToPDF } from '@/utils/exportUtils';
import { 
  SubjectData, 
  TeacherPreference, 
  ScheduleSettings, 
  ClassTimetable, 
  TeacherTimetable, 
  SubjectAllocation 
} from '@/types/timetable';
import {
  Calendar,
  Users,
  BookOpen,
  Download,
  BarChart3,
  RefreshCw,
  Zap,
  Clock,
  Sparkles,
  GraduationCap,
  Brain,
  Upload,
  Settings,
  Edit
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
        title: "Missing Data",
        description: "Please upload subject data before generating timetables.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const generator = new TimetableGenerator(subjectData, teacherPreferences, scheduleSettings);
      const result = generator.generateTimetables();
      
      setClassTimetables(result.classTimetables);
      setTeacherTimetables(result.teacherTimetables);
      // setAllocationReport(result.allocationReport || []);
      
      toast({
        title: "Success! 🎉",
        description: `Generated ${result.classTimetables.length} class timetables and ${result.teacherTimetables.length} teacher timetables.`,
      });
    } catch (error) {
      console.error('Error generating timetables:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating the timetables. Please check your data and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (classTimetables.length === 0) {
      toast({
        title: "No Data",
        description: "Please generate timetables first before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      exportClassTimetablesToCSV(classTimetables, scheduleSettings);
      exportTeacherTimetablesToCSV(teacherTimetables, scheduleSettings);
      
      toast({
        title: "Export Successful! 📄",
        description: "Timetables have been exported to CSV files.",
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the timetables.",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    if (classTimetables.length === 0) {
      toast({
        title: "No Data",
        description: "Please generate timetables first before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      exportAllTimetablesToExcel(classTimetables, teacherTimetables, scheduleSettings);
      
      toast({
        title: "Excel Export Successful! 📊",
        description: "Timetables have been exported to Excel file.",
      });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast({
        title: "Excel Export Failed",
        description: "There was an error exporting to Excel.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    if (classTimetables.length === 0) {
      toast({
        title: "No Data",
        description: "Please generate timetables first before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      exportTimetablesToPDF(classTimetables, teacherTimetables, scheduleSettings);
      
      toast({
        title: "PDF Export Successful! 📑",
        description: "Timetables have been exported to PDF file.",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "PDF Export Failed",
        description: "There was an error exporting to PDF.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 animate-gradient-x"></div>
        <div className="relative container mx-auto px-4 py-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <GraduationCap className="h-12 w-12 text-primary animate-bounce" />
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-pink-500 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold gradient-text">
                Smart Timetable
              </h1>
              <Brain className="h-12 w-12 text-purple-500 animate-pulse" />
            </div>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              AI-powered academic scheduling that adapts to your needs • Lab sessions automatically arranged consecutively • Intelligent conflict resolution
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card-gradient p-6 rounded-2xl hover:shadow-glow transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-8 w-8 text-primary" />
                  <span className="text-2xl font-bold text-primary">{classTimetables.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Class Timetables</p>
              </div>
              <div className="card-gradient p-6 rounded-2xl hover:shadow-glow transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-8 w-8 text-purple-500" />
                  <span className="text-2xl font-bold text-purple-500">{teacherTimetables.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Teacher Schedules</p>
              </div>
              <div className="card-gradient p-6 rounded-2xl hover:shadow-glow transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-8 w-8 text-pink-500" />
                  <span className="text-2xl font-bold text-pink-500">{subjectData.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Subjects Loaded</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Settings Panel - Left Side */}
          <div className="xl:col-span-4">
            <div className="sticky top-4">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6 electric-pulse">
                  <TabsTrigger value="upload" className="flex items-center gap-2 hover-scale">
                    <Upload className="h-4 w-4" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="editor" className="flex items-center gap-2 hover-scale">
                    <Edit className="h-4 w-4" />
                    Edit
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2 hover-scale">
                    <Settings className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="flex items-center gap-2 hover-scale">
                    <BarChart3 className="h-4 w-4" />
                    Reports
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="animate-fade-in">
                  <FileUpload onDataUpload={setSubjectData} />
                </TabsContent>

                <TabsContent value="editor" className="animate-fade-in">
                  <CSVEditor 
                    data={subjectData} 
                    onDataChange={setSubjectData} 
                  />
                </TabsContent>

                <TabsContent value="settings" className="animate-fade-in">
                  <SettingsPanel
                    subjectData={subjectData}
                    scheduleSettings={scheduleSettings}
                    teacherPreferences={teacherPreferences}
                    onSubjectDataChange={setSubjectData}
                    onScheduleSettingsChange={setScheduleSettings}
                    onTeacherPreferencesChange={setTeacherPreferences}
                    onGenerateTimetables={generateTimetables}
                    isGenerating={isGenerating}
                  />
                </TabsContent>

                <TabsContent value="reports" className="animate-fade-in">
                  <AllocationReport allocations={allocationReport} />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Main Content Area - Right Side */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Action Buttons */}
            {(classTimetables.length > 0 || isGenerating) && (
              <Card className="card-gradient shadow-elegant border-primary/20 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={generateTimetables}
                      disabled={isGenerating}
                      size="lg"
                      className="flex-1 hover-scale glass-button bg-gradient-primary text-primary-foreground group"
                    >
                      <RefreshCw className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                      {isGenerating ? "Regenerating..." : "Regenerate Timetables"}
                    </Button>
                    
                    <div className="flex gap-2">
                    
                    <Button 
                      onClick={handleExportCSV}
                      variant="outline" 
                      size="lg" 
                      className="hover-scale glass border-primary/30 hover:border-primary/60"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Export CSV
                    </Button>
                    
                    <Button 
                      onClick={handleExportExcel}
                      variant="outline" 
                      size="lg" 
                      className="hover-scale glass border-green-500/30 hover:border-green-500/60"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Export Excel
                    </Button>
                    
                      <Button 
                        onClick={handleExportPDF}
                        variant="outline" 
                        size="lg" 
                        className="hover-scale glass border-red-500/30 hover:border-red-500/60"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {(classTimetables.length > 0 || teacherTimetables.length > 0 || allocationReport.length > 0) && (
              <Card className="card-gradient shadow-elegant border-primary/20 overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Generated Timetables</CardTitle>
                      <CardDescription>Review and analyze your optimized schedules</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="classes" className="w-full">
                    <div className="p-6 border-b border-border/30">
                      <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                        <TabsTrigger 
                          value="classes" 
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Class Schedules
                        </TabsTrigger>
                        <TabsTrigger 
                          value="teachers" 
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Teacher Schedules
                        </TabsTrigger>
                        <TabsTrigger 
                          value="report" 
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Allocation Report
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <div className="p-6">
                      <TabsContent value="classes" className="mt-0">
                        <TimetableDisplay 
                          classTimetables={classTimetables}
                          teacherTimetables={[]}
                          totalPeriods={scheduleSettings.totalPeriodsPerDay}
                          lunchPeriod={scheduleSettings.lunchPeriod}
                          breakPeriods={scheduleSettings.breakPeriods || []}
                        />
                      </TabsContent>
                      
                      <TabsContent value="teachers" className="mt-0">
                        <TimetableDisplay 
                          classTimetables={[]}
                          teacherTimetables={teacherTimetables}
                          totalPeriods={scheduleSettings.totalPeriodsPerDay}
                          lunchPeriod={scheduleSettings.lunchPeriod}
                          breakPeriods={scheduleSettings.breakPeriods || []}
                        />
                      </TabsContent>
                      
                      <TabsContent value="report" className="mt-0">
                        <AllocationReport allocations={allocationReport} />
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isGenerating && (
              <Card className="card-gradient shadow-elegant border-primary/20 overflow-hidden">
                <CardContent className="p-12 text-center">
                  <div className="relative inline-block">
                    <RefreshCw className="h-16 w-16 text-primary animate-spin" />
                    <div className="absolute inset-0 h-16 w-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                  </div>
                  <h3 className="text-2xl font-semibold mt-6 mb-2">Generating Your Perfect Timetable</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Our AI is carefully organizing your subjects, ensuring lab sessions are consecutive and optimizing teacher schedules...
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                    <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!isGenerating && classTimetables.length === 0 && subjectData.length === 0 && (
              <Card className="card-gradient shadow-elegant border-primary/20 overflow-hidden">
                <CardContent className="p-12 text-center">
                  <div className="relative inline-block mb-6">
                    <Clock className="h-20 w-20 text-primary/60" />
                    <Sparkles className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">Ready to Create Something Amazing?</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Upload your subject data and preferences to get started with intelligent timetable generation.
                    Our system ensures lab sessions are scheduled consecutively and optimizes for minimal conflicts.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">Smart Lab Scheduling</p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <Brain className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                      <p className="text-sm font-medium">AI-Powered Optimization</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;