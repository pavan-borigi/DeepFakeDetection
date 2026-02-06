import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDetections, useDeleteDetection, Detection } from '@/hooks/useDetections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, ArrowLeft, Trash2, Filter, 
  CheckCircle, AlertTriangle, Loader2,
  FileImage, FileVideo, Calendar, Eye
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import DetectionResult from '@/components/DetectionResult';

export default function History() {
  const navigate = useNavigate();
  const { data: detections, isLoading } = useDetections();
  const deleteDetection = useDeleteDetection();
  
  const [filter, setFilter] = useState<'all' | 'real' | 'fake'>('all');
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);

  const filteredDetections = detections?.filter(d => {
    if (filter === 'all') return true;
    return d.result === filter;
  }) || [];

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this detection?')) {
      await deleteDetection.mutateAsync(id);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/90 to-background pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center glow-cyan">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <span className="font-mono font-bold text-lg text-foreground">
                  DETECTION HISTORY
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                  <SelectTrigger className="w-32 font-mono text-sm bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ALL</SelectItem>
                    <SelectItem value="real">REAL ONLY</SelectItem>
                    <SelectItem value="fake">FAKE ONLY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredDetections.length === 0 ? (
          <Card className="bg-card/50 border-border/30">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                <Shield className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="font-mono text-lg text-foreground mb-2">NO DETECTIONS FOUND</p>
              <p className="text-sm text-muted-foreground mb-6">
                {filter !== 'all' 
                  ? `No ${filter} detections in your history`
                  : 'Start analyzing media to see your detection history'
                }
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="font-mono bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                GO TO DASHBOARD
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-sm text-muted-foreground">
                Showing {filteredDetections.length} detection{filteredDetections.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid gap-4">
              {filteredDetections.map((detection) => (
                <Card
                  key={detection.id}
                  className="bg-card/50 border-border/30 hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => setSelectedDetection(detection)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-lg bg-secondary/50 overflow-hidden flex-shrink-0">
                        {detection.file_type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileVideo className="w-8 h-8 text-muted-foreground" />
                          </div>
                        ) : (
                          <img
                            src={detection.media_url}
                            alt={detection.file_name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-mono text-sm text-foreground truncate">
                              {detection.file_name}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(detection.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                {detection.file_type === 'video' ? (
                                  <FileVideo className="w-3 h-3" />
                                ) : (
                                  <FileImage className="w-3 h-3" />
                                )}
                                {detection.file_type.toUpperCase()}
                              </span>
                              <span>{formatFileSize(detection.file_size)}</span>
                            </div>
                          </div>
                          
                          {/* Result Badge */}
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <Badge
                                variant={detection.result === 'real' ? 'default' : 'destructive'}
                                className={`font-mono ${
                                  detection.result === 'real'
                                    ? 'bg-success/20 text-success border-success/30'
                                    : 'bg-destructive/20 text-destructive border-destructive/30'
                                }`}
                              >
                                {detection.result === 'real' ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                )}
                                {detection.result.toUpperCase()}
                              </Badge>
                              <p className="font-mono text-xs text-muted-foreground mt-1">
                                {detection.confidence}% confidence
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDetection(detection);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => handleDelete(detection.id, e)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <Dialog open={!!selectedDetection} onOpenChange={() => setSelectedDetection(null)}>
        <DialogContent className="max-w-2xl bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-mono">DETECTION DETAILS</DialogTitle>
          </DialogHeader>
          {selectedDetection && (
            <div className="space-y-4">
              {/* Media Preview */}
              <div className="rounded-xl overflow-hidden bg-secondary/50">
                {selectedDetection.file_type === 'video' ? (
                  <video
                    src={selectedDetection.media_url}
                    className="w-full aspect-video object-contain"
                    controls
                  />
                ) : (
                  <img
                    src={selectedDetection.media_url}
                    alt={selectedDetection.file_name}
                    className="w-full aspect-video object-contain"
                  />
                )}
              </div>
              
              <DetectionResult detection={selectedDetection} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
