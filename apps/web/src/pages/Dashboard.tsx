import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDetections, useCreateDetection, Detection } from '@/hooks/useDetections';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, Upload, LogOut, History, Scan, 
  CheckCircle, AlertTriangle, Loader2, X,
  FileImage, FileVideo, BarChart3
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import DetectionResult from '@/components/DetectionResult';
import StatsCard from '@/components/StatsCard';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: detections, isLoading: loadingDetections } = useDetections();
  const createDetection = useCreateDetection();
  const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<Detection | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Sign Out Failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      navigate('/');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setCurrentResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const analyzeMedia = async () => {
    if (!selectedFile || !user) return;

    setIsAnalyzing(true);

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media-uploads')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media-uploads')
        .getPublicUrl(fileName);

      // Call real ML model API
      const formData = new FormData();
      formData.append('file', selectedFile);

      const apiResponse = await fetch(`${apiBaseUrl}/api/detect`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        throw new Error('API detection failed');
      }

      const apiResult = await apiResponse.json();
      
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Detection failed');
      }

      const { prediction, confidence, fake_probability, real_probability } = apiResult.data;
      const isReal = prediction === 'real';
      const confidencePercent = confidence * 100;

      const detection = await createDetection.mutateAsync({
        file_name: selectedFile.name,
        file_type: selectedFile.type.startsWith('video') ? 'video' : 'image',
        file_size: selectedFile.size,
        media_url: publicUrl,
        result: isReal ? 'real' : 'fake',
        confidence: parseFloat(confidencePercent.toFixed(2)),
        analysis_details: {
          model: 'MobileNetV3-Small',
          real_probability: parseFloat((real_probability * 100).toFixed(2)),
          fake_probability: parseFloat((fake_probability * 100).toFixed(2)),
          processing_time_ms: Date.now(),
        },
      });

      setCurrentResult(detection);
      toast({
        title: 'Analysis Complete',
        description: `Media classified as ${isReal ? 'REAL' : 'FAKE'} with ${confidencePercent.toFixed(1)}% confidence`,
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message === 'Failed to fetch' 
          ? 'API server not running. Start it with: python server/api_server.py'
          : error.message || 'An error occurred during analysis',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCurrentResult(null);
  };

  const stats = {
    totalScans: detections?.length || 0,
    fakeDetected: detections?.filter(d => d.result === 'fake').length || 0,
    realDetected: detections?.filter(d => d.result === 'real').length || 0,
  };

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/90 to-background pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center glow-cyan">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="font-mono font-bold text-lg text-foreground">
                DEEPFAKE<span className="text-primary">DETECT</span>
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="font-mono text-sm w-full sm:w-auto"
                onClick={() => navigate('/history')}
              >
                <History className="w-4 h-4 mr-2" />
                HISTORY
              </Button>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <span className="font-mono text-sm text-muted-foreground truncate max-w-[220px]">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatsCard
            icon={BarChart3}
            label="Total Scans"
            value={stats.totalScans}
            color="primary"
          />
          <StatsCard
            icon={CheckCircle}
            label="Real Detected"
            value={stats.realDetected}
            color="success"
          />
          <StatsCard
            icon={AlertTriangle}
            label="Fake Detected"
            value={stats.fakeDetected}
            color="destructive"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Zone */}
          <Card className="bg-card/50 border-border/30 overflow-hidden">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                UPLOAD MEDIA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedFile ? (
                <div
                  {...getRootProps()}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer
                    transition-all duration-300
                    ${isDragActive 
                      ? 'border-primary bg-primary/5 glow-cyan' 
                      : 'border-border/50 hover:border-primary/50 hover:bg-primary/5'
                    }
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-foreground mb-1">
                        {isDragActive ? 'DROP FILE HERE' : 'DRAG & DROP MEDIA'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to select • Images & Videos up to 50MB
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileImage className="w-4 h-4" /> JPG, PNG, GIF
                      </span>
                      <span className="flex items-center gap-1">
                        <FileVideo className="w-4 h-4" /> MP4, WebM, MOV
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="relative rounded-xl overflow-hidden bg-secondary/50">
                    <button
                      onClick={clearSelection}
                      className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {selectedFile.type.startsWith('video') ? (
                      <video
                        src={previewUrl!}
                        className="w-full aspect-video object-contain"
                        controls
                      />
                    ) : (
                      <img
                        src={previewUrl!}
                        alt="Preview"
                        className="w-full aspect-video object-contain"
                      />
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-mono text-muted-foreground truncate flex-1">
                      {selectedFile.name}
                    </div>
                    <div className="font-mono text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  
                  {/* Analyze Button */}
                  <Button
                    onClick={analyzeMedia}
                    disabled={isAnalyzing}
                    className="w-full font-mono bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ANALYZING...
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4 mr-2" />
                        START ANALYSIS
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result Display */}
          <Card className="bg-card/50 border-border/30">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2">
                <Scan className="w-5 h-5 text-primary" />
                DETECTION RESULT
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="aspect-square flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-primary/30 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin" />
                    </div>
                    <Scan className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-primary animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-mono text-lg text-foreground">SCANNING MEDIA</p>
                    <p className="font-mono text-sm text-muted-foreground cursor-blink">
                      Analyzing for manipulation artifacts
                    </p>
                  </div>
                </div>
              ) : currentResult ? (
                <DetectionResult detection={currentResult} />
              ) : (
                <div className="aspect-square flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-mono text-muted-foreground">NO MEDIA ANALYZED</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload an image or video to begin detection
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
