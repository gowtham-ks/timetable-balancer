import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/FileUpload";
import { CSVEditor } from "@/components/CSVEditor";
import { SettingsPanel } from "@/components/SettingsPanel";
import { TimetableDisplay } from "@/components/TimetableDisplay";
import { AllocationReport } from "@/components/AllocationReport";
import { TimetableGenerator } from "@/utils/timetableGenerator";
import { exportClassTimetablesToCSV, exportTeacherTimetablesToCSV, exportAllTimetablesToExcel, exportTimetablesToPDF } from "@/utils/exportUtils";
import { Download, FileText, RefreshCw, Upload, Settings, BarChart3, Calendar, Users, BookOpen, Loader2, Shield, Edit, Sparkles } from "lucide-react";
import type { 
  SubjectData, 
  TeacherPreference, 
  ScheduleSettings, 
  ClassTimetable, 
  TeacherTimetable 
} from "@/types/timetable";

interface AdminDashboardProps {
  subjectData: SubjectData[];
  setSubjectData: (data: SubjectData[]) => void;
  teacherPreferences: TeacherPreference[];
  setTeacherPreferences: (prefs: TeacherPreference[]) => void;
  scheduleSettings: ScheduleSettings;
  setScheduleSettings: (settings: ScheduleSettings) => void;
  classTimetables: ClassTimetable[];
  setClassTimetables: (timetables: ClassTimetable[]) => void;
  teacherTimetables: TeacherTimetable[];
  setTeacherTimetables: (timetables: TeacherTimetable[]) => void;
}

const AdminDashboard = ({
  subjectData,
  setSubjectData,
  teacherPreferences,
  setTeacherPreferences,
  scheduleSettings,
  setScheduleSettings,
  classTimetables,
  setClassTimetables,
  teacherTimetables,
  setTeacherTimetables
}: AdminDashboardProps) => {
  const { toast } = useToast();
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
    <>
      {/* Admin Header */}
      <div className="relative overflow-hidden mb-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-red-500" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            Complete control over timetable generation and management • Full access to all features
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-red-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-8 w-8 text-red-500" />
                  <span className="text-2xl font-bold text-red-500">{classTimetables.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Class Timetables</p>
              </CardContent>
            </Card>
            <Card className="border-red-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-8 w-8 text-red-500" />
                  <span className="text-2xl font-bold text-red-500">{teacherTimetables.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Teacher Schedules</p>
              </CardContent>
            </Card>
            <Card className="border-red-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-8 w-8 text-red-500" />
                  <span className="text-2xl font-bold text-red-500">{subjectData.length}</span>
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
          <Card className="border-red-500/20">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={generateTimetables}
                  disabled={isGenerating}
                  size="lg"
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  <RefreshCw className={`h-5 w-5 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? "Generating..." : "Generate Timetables"}
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExportCSV}
                    variant="outline" 
                    size="lg"
                    className="border-red-500/20 hover:bg-red-500/10"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    CSV
                  </Button>
                  
                  <Button 
                    onClick={handleExportExcel}
                    variant="outline" 
                    size="lg"
                    className="border-red-500/20 hover:bg-red-500/10"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Excel
                  </Button>
                  
                  <Button 
                    onClick={handleExportPDF}
                    variant="outline" 
                    size="lg"
                    className="border-red-500/20 hover:bg-red-500/10"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {(classTimetables.length > 0 || teacherTimetables.length > 0) && (
            <Card className="border-red-500/20">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Generated Timetables</CardTitle>
                    <CardDescription>Review and analyze all schedules</CardDescription>
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
            <Card className="border-red-500/20">
              <CardContent className="p-12 text-center">
                <div className="relative inline-block">
                  <RefreshCw className="h-16 w-16 text-red-500 animate-spin" />
                </div>
                <h3 className="text-2xl font-semibold mt-6 mb-2">Generating Perfect Timetables</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Processing all constraints and optimizing schedules for maximum efficiency...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isGenerating && classTimetables.length === 0 && teacherTimetables.length === 0 && (
            <Card className="border-dashed border-2 border-red-500/25">
              <CardContent className="p-12 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
                  <Shield className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Ready to Generate Timetables</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  As an administrator, you have full access to upload data, configure settings, and generate optimized timetables.
                </p>
                <Button 
                  onClick={generateTimetables}
                  disabled={subjectData.length === 0}
                  size="lg"
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Timetables
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;