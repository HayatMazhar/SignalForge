import { useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-8 animate-float">
          <Activity className="w-12 h-12 text-accent" />
        </div>
        <div className="text-8xl font-black text-accent/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h1>
        <p className="text-text-muted mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-bg font-bold hover:bg-accent/90 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
