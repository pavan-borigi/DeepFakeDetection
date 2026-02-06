import { Detection } from '@/hooks/useDetections';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface DetectionResultProps {
  detection: Detection;
}

export default function DetectionResult({ detection }: DetectionResultProps) {
  const isReal = detection.result === 'real';
  const confidence = detection.confidence;
  
  // Calculate stroke dasharray for circular progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main Result */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          {/* Background ring */}
          <svg className="w-40 h-40 progress-ring">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-secondary"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-1000 ease-out ${
                isReal ? 'text-success' : 'text-destructive'
              }`}
            />
          </svg>
          
          {/* Center icon */}
          <div className={`absolute inset-0 flex items-center justify-center`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isReal ? 'bg-success/20 glow-green' : 'bg-destructive/20 glow-red'
            }`}>
              {isReal ? (
                <CheckCircle className="w-10 h-10 text-success" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-destructive" />
              )}
            </div>
          </div>
        </div>
        
        {/* Result Text */}
        <div className="text-center space-y-2">
          <div className={`font-mono text-3xl sm:text-4xl font-bold ${
            isReal ? 'text-success text-glow-green' : 'text-destructive'
          }`}>
            {isReal ? 'REAL' : 'FAKE'}
          </div>
          <div className="font-mono text-base sm:text-lg text-muted-foreground">
            {confidence.toFixed(1)}% Confidence
          </div>
        </div>
      </div>

      {/* Analysis Details */}
      {detection.analysis_details && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-secondary/30">
            <CheckCircle className="w-5 h-5 mx-auto mb-2 text-success" />
            <div className="font-mono text-lg text-foreground">
              {detection.analysis_details.real_probability?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-xs text-muted-foreground">Real</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-secondary/30">
            <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-warning" />
            <div className="font-mono text-lg text-foreground">
              {detection.analysis_details.fake_probability?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-xs text-muted-foreground">Fake</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-secondary/30">
            <Clock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <div className="font-mono text-sm text-foreground">
              {detection.analysis_details.model || 'CNN'}
            </div>
            <div className="text-xs text-muted-foreground">Model</div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="text-center text-xs text-muted-foreground p-3 rounded-lg bg-primary/10 border border-primary/30">
        <p className="font-mono">
          ✓ AI-Powered Detection • MobileNetV3 CNN Model • CPU Optimized
        </p>
      </div>
    </div>
  );
}
