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

    const newPreference: TeacherPreference = {
      teacherName: newTeacherName,
      preferredDay: newPreferredDay,
      preferredPeriod: parseInt(newPreferredPeriod)
    };

    onTeacherPreferencesChange([...teacherPreferences, newPreference]);
    setNewTeacherName('');
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
      <Card className="card-gradient shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Schedule Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totalPeriods">Total Periods per Day</Label>
            <Input
              id="totalPeriods"
              type="number"
              min="1"
              max="12"
              value={scheduleSettings.totalPeriodsPerDay}
              onChange={(e) => handleScheduleChange('totalPeriodsPerDay', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lunchPeriod">Lunch Period</Label>
            <Input
              id="lunchPeriod"
              type="number"
              min="1"
              max={scheduleSettings.totalPeriodsPerDay}
              value={scheduleSettings.lunchPeriod}
              onChange={(e) => handleScheduleChange('lunchPeriod', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="breakPeriods">Break Periods (comma-separated)</Label>
            <Input
              id="breakPeriods"
              placeholder="3,9"
              value={scheduleSettings.breakPeriods.join(', ')}
              onChange={(e) => handleBreakPeriodsChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTeacherPeriods">Max Teacher Periods/Week</Label>
            <Input
              id="maxTeacherPeriods"
              type="number"
              min="1"
              max="40"
              value={scheduleSettings.maxTeacherPeriodsPerWeek}
              onChange={(e) => handleScheduleChange('maxTeacherPeriodsPerWeek', parseInt(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Teacher Preferences */}
      <Card className="card-gradient shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Teacher Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Preference */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="teacherName">Teacher Name</Label>
              <Input
                id="teacherName"
                placeholder="Enter teacher name"
                value={newTeacherName}
                onChange={(e) => setNewTeacherName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Preferred Day</Label>
                <Select value={newPreferredDay} onValueChange={setNewPreferredDay}>
                  <SelectTrigger>
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
                <Label>Preferred Period</Label>
                <Select value={newPreferredPeriod} onValueChange={setNewPreferredPeriod}>
                  <SelectTrigger>
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
              className="w-full"
              disabled={!newTeacherName || !newPreferredDay || !newPreferredPeriod}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Preference
            </Button>
          </div>

          {/* Existing Preferences */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {teacherPreferences.map((preference, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex-1">
                  <div className="font-medium text-sm">{preference.teacherName}</div>
                  <div className="text-xs text-muted-foreground">
                    {preference.preferredDay}, Period {preference.preferredPeriod}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTeacherPreference(index)}
                  className="text-destructive hover:bg-destructive/10"
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
