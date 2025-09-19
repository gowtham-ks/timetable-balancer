import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { FileUpload } from "@/components/FileUpload";
import { CSVEditor } from "@/components/CSVEditor";
import { SettingsPanel } from "@/components/SettingsPanel";
import { TimetableDisplay } from "@/components/TimetableDisplay";
import { AllocationReport } from "@/components/AllocationReport";
import { TimetableGenerator } from "@/utils/timetableGenerator";
import { exportClassTimetablesToCSV, exportTeacherTimetablesToCSV, exportAllTimetablesToExcel, exportTimetablesToPDF, printTimetables } from "@/utils/exportUtils";
import { Download, FileText, Printer, RefreshCw, Upload, Settings, BarChart3, Calendar, Clock, Users, BookOpen, Loader2, GraduationCap, Brain, Edit, Sparkles } from "lucide-react";
import type { 
  SubjectData, 
  TeacherPreference, 
  ScheduleSettings, 
  ClassTimetable, 
  TeacherTimetable 
} from "@/types/timetable";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  
  // Redirect to auth if not authenticated
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Core state management
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
  const [isGenerating, setIsGenerating] = useState(false);

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
    <Layout>
      {/* Enhanced Header */}
      <div className="relative overflow-hidden mb-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <GraduationCap className="h-12 w-12 text-primary animate-bounce" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-pink-500 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Smart Timetable Generator
            </h1>
            <Brain className="h-12 w-12 text-purple-500 animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            AI-powered academic scheduling that adapts to your needs • Lab sessions automatically arranged consecutively
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-8 w-8 text-primary" />
                  <span className="text-2xl font-bold text-primary">{classTimetables.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Class Timetables</p>
              </CardContent>
            </Card>
            <Card className="border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-8 w-8 text-purple-500" />
                  <span className="text-2xl font-bold text-purple-500">{teacherTimetables.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Teacher Schedules</p>
              </CardContent>
            </Card>
            <Card className="border-pink-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-8 w-8 text-pink-500" />
                  <span className="text-2xl font-bold text-pink-500">{subjectData.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Subjects Loaded</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Settings Panel - Left Side */}
        <div className="xl:col-span-4">
          <div className="sticky top-4">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Reports
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <FileUpload onDataUpload={setSubjectData} />
              </TabsContent>

              <TabsContent value="editor">
                <CSVEditor 
                  data={subjectData} 
                  onDataChange={setSubjectData} 
                />
              </TabsContent>

              <TabsContent value="settings">
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

              <TabsContent value="reports">
                <AllocationReport allocations={[]} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Main Content Area - Right Side */}  
        <div className="xl:col-span-8 space-y-8">
          
          {/* Action Buttons */}
          {(classTimetables.length > 0 || isGenerating) && (
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={generateTimetables}
                    disabled={isGenerating}
                    size="lg"
                    className="flex-1"
                  >
                    <RefreshCw className={`h-5 w-5 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? "Regenerating..." : "Regenerate Timetables"}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleExportCSV}
                      variant="outline" 
                      size="lg"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      CSV
                    </Button>
                    
                    <Button 
                      onClick={handleExportExcel}
                      variant="outline" 
                      size="lg"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Excel
                    </Button>
                    
                    <Button 
                      onClick={handleExportPDF}
                      variant="outline" 
                      size="lg"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Section */}
          {(classTimetables.length > 0 || teacherTimetables.length > 0) && (
            <Card className="border-primary/20">
              <CardHeader className="border-b">
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
                  <div className="p-6 border-b">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="classes">
                        <Calendar className="h-4 w-4 mr-2" />
                        Class Schedules
                      </TabsTrigger>
                      <TabsTrigger value="teachers">
                        <Users className="h-4 w-4 mr-2" />
                        Teacher Schedules
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
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isGenerating && (
            <Card className="border-primary/20">
              <CardContent className="p-12 text-center">
                <div className="relative inline-block">
                  <RefreshCw className="h-16 w-16 text-primary animate-spin" />
                </div>
                <h3 className="text-2xl font-semibold mt-6 mb-2">Generating Your Perfect Timetable</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Our AI is carefully organizing your subjects, ensuring lab sessions are consecutive and optimizing teacher schedules...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isGenerating && classTimetables.length === 0 && teacherTimetables.length === 0 && (
            <Card className="border-dashed border-2 border-muted-foreground/25">
              <CardContent className="p-12 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No Timetables Generated Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Upload your subject data and configure your preferences to get started with AI-powered timetable generation.
                </p>
                {profile?.role === 'admin' && (
                  <Button 
                    onClick={generateTimetables}
                    disabled={subjectData.length === 0}
                    size="lg"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Timetables
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Index;