import React, { useCallback, useState } from 'react';
import { Upload, File, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { parseCSV, validateCSVStructure } from '@/utils/csvParser';
import { SubjectData } from '@/types/timetable';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onDataUpload: (data: SubjectData[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Please select a CSV file');
      setUploadStatus('error');
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setUploadStatus('uploading');
    setErrorMessage('');

    try {
      // Validate CSV structure first
      await validateCSVStructure(file);

      // Parse CSV content
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = parseCSV(content);
          
          setUploadStatus('success');
          onDataUpload(data);
          
          toast({
            title: "Upload Successful",
            description: `Loaded ${data.length} subjects from CSV file`,
            variant: "default",
          });
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to parse CSV');
          setUploadStatus('error');
          toast({
            title: "Parse Error",
            description: error instanceof Error ? error.message : 'Failed to parse CSV',
            variant: "destructive",
          });
        }
      };

      reader.onerror = () => {
        setErrorMessage('Failed to read file');
        setUploadStatus('error');
        toast({
          title: "Read Error",
          description: "Failed to read the uploaded file",
          variant: "destructive",
        });
      };

      reader.readAsText(file);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'File validation failed');
      setUploadStatus('error');
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : 'File validation failed',
        variant: "destructive",
      });
    }
  }, [onDataUpload, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Upload className="h-8 w-8 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-success" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-destructive" />;
      default:
        return <File className="h-8 w-8" />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Processing CSV file...';
      case 'success':
        return 'CSV uploaded successfully!';
      case 'error':
        return errorMessage || 'Upload failed';
      default:
        return 'Choose CSV file or drag and drop';
    }
  };

  return (
    <Card className="card-gradient shadow-card border-dashed border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
      <CardContent className="p-8">
        <div
          className={`relative text-center transition-all duration-300 ${
            dragActive ? 'scale-105' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploadStatus === 'uploading'}
          />
          
          <div className="flex flex-col items-center space-y-4">
            <div className={`transition-colors duration-300 ${
              uploadStatus === 'success' ? 'text-success' : 
              uploadStatus === 'error' ? 'text-destructive' : 
              'text-primary'
            }`}>
              {getStatusIcon()}
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {getStatusText()}
              </p>
              
              <p className="text-sm text-muted-foreground">
                Required columns: Department, Year, Section, Subject, Periods, Staff
              </p>
              
              <p className="text-xs text-muted-foreground">
                Optional: PreferredDay, PreferredPeriod, PreferredSlots
              </p>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              disabled={uploadStatus === 'uploading'}
              className="mt-4"
            >
              {uploadStatus === 'uploading' ? 'Processing...' : 'Browse Files'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};