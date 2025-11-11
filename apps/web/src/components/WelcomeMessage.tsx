import { Sparkles } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function WelcomeMessage() {
  const t = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center w-full px-4">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 radial-glow opacity-50"></div>
            <div className="relative bg-card/50 backdrop-blur-sm rounded-full p-6 glow-border border-cyan-400/30">
              <Sparkles className="w-12 h-12 text-cyan-400" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {t('welcome.title')}
          </h2>
          <p className="text-gray-700 dark:text-gray-400 text-lg md:text-xl">
            {t('welcome.subtitle')}
          </p>
        </div>
        <div className="pt-2">
          <p className="text-sm text-gray-600 dark:text-gray-500">
            {t('welcome.hint')}
          </p>
        </div>
      </div>
    </div>
  );
}

