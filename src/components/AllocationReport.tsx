import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SubjectAllocation } from '@/types/timetable';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface AllocationReportProps {
  allocations: SubjectAllocation[];
}

export const AllocationReport: React.FC<AllocationReportProps> = ({ allocations }) => {
  const totalRequired = allocations.reduce((sum, alloc) => sum + alloc.requiredPeriods, 0);
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocatedPeriods, 0);
  const successRate = totalRequired > 0 ? (totalAllocated / totalRequired) * 100 : 0;

  const fullyAllocated = allocations.filter(a => a.allocatedPeriods === a.requiredPeriods);
  const underAllocated = allocations.filter(a => a.allocatedPeriods < a.requiredPeriods);
  const overAllocated = allocations.filter(a => a.allocatedPeriods > a.requiredPeriods);

  const getStatusIcon = (allocation: SubjectAllocation) => {
    if (allocation.allocatedPeriods === allocation.requiredPeriods) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    } else if (allocation.allocatedPeriods < allocation.requiredPeriods) {
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    } else {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (allocation: SubjectAllocation) => {
    if (allocation.allocatedPeriods === allocation.requiredPeriods) {
      return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Complete</Badge>;
    } else if (allocation.allocatedPeriods < allocation.requiredPeriods) {
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Under-allocated</Badge>;
    } else {
      return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Over-allocated</Badge>;
    }
  };

  return (
    <Card className="card-gradient shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Period Allocation Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-primary/5">
            <div className="text-2xl font-bold text-primary">{totalAllocated}</div>
            <div className="text-sm text-muted-foreground">Periods Allocated</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{totalRequired}</div>
            <div className="text-sm text-muted-foreground">Periods Required</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-success/5">
            <div className="text-2xl font-bold text-success">{successRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Allocation Progress</span>
            <span>{totalAllocated}/{totalRequired}</span>
          </div>
          <Progress value={successRate} className="h-3" />
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-success/5 border border-success/20">
            <div className="text-lg font-semibold text-success">{fullyAllocated.length}</div>
            <div className="text-xs text-muted-foreground">Fully Allocated</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning/5 border border-warning/20">
            <div className="text-lg font-semibold text-warning">{underAllocated.length}</div>
            <div className="text-xs text-muted-foreground">Under-allocated</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="text-lg font-semibold text-destructive">{overAllocated.length}</div>
            <div className="text-xs text-muted-foreground">Over-allocated</div>
          </div>
        </div>

        {/* Detailed Allocation List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">Subject-wise Allocation Details</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {allocations.map((allocation, index) => {
              const [subject, className] = allocation.subjectKey.split('-').length > 1 
                ? allocation.subjectKey.split('-') 
                : [allocation.subjectKey, 'Unknown'];
              
              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(allocation)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{subject}</div>
                      <div className="text-xs text-muted-foreground truncate">{className}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {allocation.allocatedPeriods}/{allocation.requiredPeriods}
                      </div>
                      <div className="text-xs text-muted-foreground">periods</div>
                    </div>
                    {getStatusBadge(allocation)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Issues Section */}
        {(underAllocated.length > 0 || overAllocated.length > 0) && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Allocation Issues</h4>
            
            {underAllocated.length > 0 && (
              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div className="font-medium text-warning text-sm mb-2">Under-allocated Subjects:</div>
                <div className="space-y-1">
                  {underAllocated.map((allocation, index) => {
                    const shortfall = allocation.requiredPeriods - allocation.allocatedPeriods;
                    return (
                      <div key={index} className="text-xs text-muted-foreground">
                        • {allocation.subjectKey}: {shortfall} periods short
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {overAllocated.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="font-medium text-destructive text-sm mb-2">Over-allocated Subjects:</div>
                <div className="space-y-1">
                  {overAllocated.map((allocation, index) => {
                    const excess = allocation.allocatedPeriods - allocation.requiredPeriods;
                    return (
                      <div key={index} className="text-xs text-muted-foreground">
                        • {allocation.subjectKey}: {excess} periods excess
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {successRate === 100 && (
          <div className="text-center p-4 rounded-lg bg-success/5 border border-success/20">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="font-medium text-success">Perfect Allocation!</div>
            <div className="text-sm text-muted-foreground">All periods have been successfully allocated.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};