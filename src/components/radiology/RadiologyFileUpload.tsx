import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Upload, FileText, X, CheckCircle, Loader2, Download, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RadiologyFileUploadProps {
  orderId: string;
  patientName: string;
  service: string;
  existingFileUrl?: string;
  existingFileName?: string;
  onUploadSuccess?: () => void;
}

export const RadiologyFileUpload: React.FC<RadiologyFileUploadProps> = ({
  orderId,
  patientName,
  service,
  existingFileUrl,
  existingFileName,
  onUploadSuccess
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/dicom',
        'application/dicom',
        'application/pdf',
        'application/zip'
      ];

      if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.dcm')) {
        toast.error('Invalid file type. Allowed: JPG, PNG, PDF, DICOM, ZIP');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique file name
      const timestamp = Date.now();
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${orderId}/${timestamp}_${sanitizedFileName}`;

      // Simulate progress (Supabase doesn't provide real-time progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to Supabase Storage
      // Note: Using regular supabase client (should work with public bucket policies)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('radiology-files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: selectedFile.type
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(95);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('radiology-files')
        .getPublicUrl(filePath);

      // Update database with file info
      const { error: dbError } = await supabase
        .from('visit_radiology')
        .update({
          file_url: publicUrl,
          file_name: selectedFile.name,
          uploaded_at: new Date().toISOString(),
          uploaded_by: user?.email || 'Unknown'
        })
        .eq('id', orderId);

      if (dbError) {
        throw dbError;
      }

      setUploadProgress(100);
      
      toast.success('File uploaded successfully!');
      
      // Reset state
      setSelectedFile(null);
      setIsOpen(false);
      
      // Callback to refresh parent data
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleViewFile = () => {
    if (existingFileUrl) {
      window.open(existingFileUrl, '_blank');
    }
  };

  const handleDownloadFile = () => {
    if (existingFileUrl && existingFileName) {
      const link = document.createElement('a');
      link.href = existingFileUrl;
      link.download = existingFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      {/* Upload/View Button */}
      {existingFileUrl ? (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleViewFile}
            className="h-8 px-2"
            title="View file"
          >
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadFile}
            className="h-8 px-2"
            title="Download file"
          >
            <Download className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsOpen(true)}
            className="h-8 px-2"
            title="Replace file"
          >
            <Upload className="h-4 w-4 text-orange-600" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="h-8 px-2"
          title="Upload file"
        >
          <Upload className="h-4 w-4 text-blue-600" />
        </Button>
      )}

      {/* Upload Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Radiology File</DialogTitle>
            <DialogDescription>
              Upload DICOM, X-Ray, MRI, CT scan images or reports for this radiology order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Patient Info */}
            <div className="bg-gray-50 p-3 rounded-md space-y-1">
              <p className="text-sm"><span className="font-semibold">Patient:</span> {patientName}</p>
              <p className="text-sm"><span className="font-semibold">Service:</span> {service}</p>
              {existingFileName && (
                <p className="text-sm"><span className="font-semibold">Current File:</span> {existingFileName}</p>
              )}
            </div>

            {/* File Input */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File</Label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*,.dcm,.pdf,.zip,application/dicom"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: JPG, PNG, PDF, DICOM (.dcm), ZIP (Max: 50MB)
              </p>
            </div>

            {/* Selected File Preview */}
            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setSelectedFile(null);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
