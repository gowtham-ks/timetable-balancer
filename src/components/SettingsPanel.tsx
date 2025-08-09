import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, User, Plus, Trash2 } from 'lucide-react';
import { ScheduleSettings, TeacherPreference } from '@/types/timetable';

interface SettingsPanelProps {
  scheduleSettings: ScheduleSettings;
  teacherPreferences: TeacherPreference[];
  onScheduleSettingsChange: (settings: ScheduleSettings) => void;
  onTeacherPreferencesChange: (preferences: TeacherPreference[]) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  scheduleSettings,
  teacherPreferences,
  onScheduleSettingsChange,
  onTeacherPreferencesChange,
}) => {
  const [newTeacherName, setNewTeacherName] = React.useState('');
  const [newDepartment, setNewDepartment] = React.useState('');
  const [newYear, setNewYear] = React.useState('');
  const [newSection, setNewSection] = React.useState('');
  const [newPreferredDay, setNewPreferredDay] = React.useState('');
  const [newPreferredPeriod, setNewPreferredPeriod] = React.useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleScheduleChange = (field: keyof ScheduleSettings, value: number | number[]) => {
    onScheduleSettingsChange({
      ...scheduleSettings,
      [field]: value
    });
  };

  const handleBreakPeriodsChange = (value: string) => {
    const periods = value.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    handleScheduleChange('breakPeriods', periods);
  };

  const addTeacherPreference = () => {
    if (!newTeacherName || !newPreferredDay || !newPreferredPeriod) return;

    const className = newDepartment && newYear && newSection ? 
      `${newDepartment}-${newYear}-${newSection}` : undefined;

    const newPreference: TeacherPreference = {
      teacherName: newTeacherName,
      department: newDepartment || undefined,
      year: newYear || undefined,
      section: newSection || undefined,
      className,
      preferredDay: newPreferredDay,
      preferredPeriod: parseInt(newPreferredPeriod)
    };

    onTeacherPreferencesChange([...teacherPreferences, newPreference]);
    setNewTeacherName('');
    setNewDepartment('');
    setNewYear('');
    setNewSection('');
    setNewPreferredDay('');
    setNewPreferredPeriod('');
  };

  const removeTeacherPreference = (index: number) => {
    const updated = teacherPreferences.filter((_, i) => i !== index);
    onTeacherPreferencesChange(updated);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Schedule Settings */}
      <Card className="card-gradient shadow-card border-border/50 overflow-hidden group hover:shadow-glow transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary-glow/10 border-b border-border/30">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <span className="gradient-text font-bold text-lg">Schedule Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="totalPeriods" className="text-sm font-semibold text-foreground flex items-center gap-2">
                🕐 Total Periods per Day
              </Label>
              <Input
                id="totalPeriods"
                type="number"
                min="1"
                max="12"
                value={scheduleSettings.totalPeriodsPerDay}
                onChange={(e) => handleScheduleChange('totalPeriodsPerDay', parseInt(e.target.value))}
                className="bg-background border-border/60 focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="lunchPeriod" className="text-sm font-semibold text-foreground flex items-center gap-2">
                🍽️ Lunch Period
              </Label>
              <Input
                id="lunchPeriod"
                type="number"
                min="1"
                max={scheduleSettings.totalPeriodsPerDay}
                value={scheduleSettings.lunchPeriod}
                onChange={(e) => handleScheduleChange('lunchPeriod', parseInt(e.target.value))}
                className="bg-background border-border/60 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="breakPeriods" className="text-sm font-semibold text-foreground flex items-center gap-2">
              ☕ Break Periods <span className="text-xs text-muted-foreground">(comma-separated)</span>
            </Label>
            <Input
              id="breakPeriods"
              placeholder="e.g., 3, 9"
              value={scheduleSettings.breakPeriods.join(', ')}
              onChange={(e) => handleBreakPeriodsChange(e.target.value)}
              className="bg-background border-border/60 focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="maxTeacherPeriods" className="text-sm font-semibold text-foreground flex items-center gap-2">
              👥 Max Teacher Periods/Week
            </Label>
            <Input
              id="maxTeacherPeriods"
              type="number"
              min="1"
              max="40"
              value={scheduleSettings.maxTeacherPeriodsPerWeek}
              onChange={(e) => handleScheduleChange('maxTeacherPeriodsPerWeek', parseInt(e.target.value))}
              className="bg-background border-border/60 focus:border-primary transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teacher Preferences */}
      <Card className="card-gradient shadow-card border-border/50 overflow-hidden group hover:shadow-glow transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-secondary/30 to-accent/20 border-b border-border/30">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <User className="h-5 w-5 text-primary" />
            </div>
            <span className="gradient-text font-bold text-lg">Teacher Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Add New Preference */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="space-y-2">
              <Label htmlFor="teacherName" className="text-sm font-medium">Teacher Name</Label>
              <Input
                id="teacherName"
                placeholder="Enter teacher name"
                value={newTeacherName}
                onChange={(e) => setNewTeacherName(e.target.value)}
                className="bg-background"
              />
            </div>

            {/* Class Information */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">Class Information (Optional)</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Department</Label>
                  <Select value={newDepartment} onValueChange={setNewDepartment}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Dept" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSE">CSE</SelectItem>
                      <SelectItem value="ECE">ECE</SelectItem>
                      <SelectItem value="ME">ME</SelectItem>
                      <SelectItem value="CE">CE</SelectItem>
                      <SelectItem value="EEE">EEE</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Year</Label>
                  <Select value={newYear} onValueChange={setNewYear}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Section</Label>
                  <Select value={newSection} onValueChange={setNewSection}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Sec" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Preferred Day</Label>
                <Select value={newPreferredDay} onValueChange={setNewPreferredDay}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map(day => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Preferred Period</Label>
                <Select value={newPreferredPeriod} onValueChange={setNewPreferredPeriod}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Period" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: scheduleSettings.totalPeriodsPerDay }, (_, i) => i + 1).map(period => (
                      <SelectItem key={period} value={period.toString()}>
                        Period {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={addTeacherPreference}
              variant="outline"
              size="sm"
              className="w-full bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors"
              disabled={!newTeacherName || !newPreferredDay || !newPreferredPeriod}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Teacher Preference
            </Button>
          </div>

          {/* Existing Preferences */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {teacherPreferences.map((preference, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/30 shadow-sm">
                <div className="flex-1">
                  <div className="font-medium text-sm text-foreground">{preference.teacherName}</div>
                  {preference.className && (
                    <div className="text-xs text-primary font-medium">
                      Class: {preference.className}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="inline-flex items-center gap-1">
                      📅 {preference.preferredDay} • 🕐 Period {preference.preferredPeriod}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTeacherPreference(index)}
                  className="text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {teacherPreferences.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-4">
              No teacher preferences added yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
