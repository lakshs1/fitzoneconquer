import { Play, Map, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-3">
      <Button 
        variant="gaming" 
        className="h-auto flex-col py-4 gap-2"
        onClick={() => navigate('/activity')}
      >
        <Play className="w-6 h-6" />
        <span className="text-xs">Start Run</span>
      </Button>
      <Button 
        variant="gaming" 
        className="h-auto flex-col py-4 gap-2"
        onClick={() => navigate('/map')}
      >
        <Map className="w-6 h-6" />
        <span className="text-xs">View Map</span>
      </Button>
      <Button 
        variant="gaming" 
        className="h-auto flex-col py-4 gap-2"
        onClick={() => navigate('/zones')}
      >
        <Swords className="w-6 h-6" />
        <span className="text-xs">Capture</span>
      </Button>
    </div>
  );
}
