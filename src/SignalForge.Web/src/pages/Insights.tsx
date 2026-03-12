import { Brain } from 'lucide-react';
import FearGreedGauge from '../components/insights/FearGreedGauge';
import MarketPulse from '../components/insights/MarketPulse';
import SmartMoneyTracker from '../components/insights/SmartMoneyTracker';
import { useAssetModeStore } from '../stores/assetModeStore';

export default function Insights() {
  const { mode } = useAssetModeStore();
  const isCrypto = mode === 'crypto';
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-accent" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{isCrypto ? 'Crypto Insights' : 'AI Insights'}</h1>
          <p className="text-sm text-text-muted">{isCrypto ? 'Crypto intelligence & on-chain analytics' : 'Proprietary intelligence no one else offers'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <FearGreedGauge />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <SmartMoneyTracker />
        </div>
      </div>

      <MarketPulse />
    </div>
  );
}
