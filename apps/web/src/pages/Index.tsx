import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Shield, Upload, Search, History, ArrowRight, Scan, CheckCircle, AlertTriangle, Linkedin } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Upload,
      title: 'Upload Media',
      description: 'Drag & drop images or videos for instant analysis',
    },
    {
      icon: Scan,
      title: 'AI Detection',
      description: 'Advanced CNN-based deepfake detection algorithms',
    },
    {
      icon: Search,
      title: 'Get Results',
      description: 'Real-time analysis with confidence scoring',
    },
    {
      icon: History,
      title: 'Track History',
      description: 'Complete audit trail of all your detections',
    },
  ];

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center glow-cyan">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-mono font-bold text-lg text-foreground">
              DEEPFAKE<span className="text-primary">DETECT</span>
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="font-mono text-sm w-full sm:w-auto">
                SIGN IN
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="font-mono text-sm bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                GET STARTED
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-16 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-sm text-primary">DETECTION SYSTEM ONLINE</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-mono leading-tight">
            <span className="text-foreground">DETECT</span>
            <br />
            <span className="text-primary text-glow-cyan">DEEPFAKES</span>
            <br />
            <span className="text-foreground">INSTANTLY</span>
          </h1>
          
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced AI-powered detection system to verify the authenticity of images and videos. 
            Protect yourself from manipulated media.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/auth">
              <Button size="lg" className="font-mono bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan">
                START SCANNING
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="font-mono border-border/50">
              LEARN MORE
            </Button>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="relative z-10 container mx-auto px-4 py-10 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden gradient-border p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Real Result */}
              <div className="space-y-4 text-center">
                <div className="aspect-square rounded-xl bg-secondary/50 flex items-center justify-center overflow-hidden">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-success/20 flex items-center justify-center glow-green">
                    <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-success" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-2xl font-bold text-success text-glow-green">REAL</div>
                  <div className="font-mono text-sm text-muted-foreground">Confidence: 94.7%</div>
                </div>
              </div>
              
              {/* Fake Result */}
              <div className="space-y-4 text-center">
                <div className="aspect-square rounded-xl bg-secondary/50 flex items-center justify-center overflow-hidden">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-destructive/20 flex items-center justify-center glow-red">
                    <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-2xl font-bold text-destructive">FAKE</div>
                  <div className="font-mono text-sm text-muted-foreground">Confidence: 89.2%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-mono font-bold text-foreground mb-4">
            HOW IT <span className="text-primary">WORKS</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Simple, fast, and accurate deepfake detection in four easy steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl bg-card/50 border border-border/30 hover:border-primary/50 transition-all duration-300 hover:glow-cyan"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="font-mono text-sm text-muted-foreground mb-2">
                STEP {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="font-mono font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8 p-8 sm:p-12 rounded-2xl bg-gradient-to-b from-primary/10 to-transparent border border-primary/20">
          <h2 className="text-3xl font-mono font-bold text-foreground">
            READY TO <span className="text-primary text-glow-cyan">DETECT?</span>
          </h2>
          <p className="text-muted-foreground">
            Create your account and start analyzing media for potential deepfakes today.
          </p>
          <Link to="/auth">
            <Button size="lg" className="font-mono bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan">
              CREATE FREE ACCOUNT
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-4 py-8 border-t border-border/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-mono">DEEPFAKE DETECTION SYSTEM</span>
          </div>
          <div className="font-mono">
            © {new Date().getFullYear()} All rights reserved
          </div>
          <div className="text-xs text-muted-foreground/70 font-mono flex items-center gap-1.5">
            Built by{' '}
            <span className="text-primary font-semibold">Pavan Borigi</span>
            <a
              href="https://www.linkedin.com/in/pavan-b-7b092836b/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors inline-flex items-center"
              title="LinkedIn Profile"
            >
              <Linkedin className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
