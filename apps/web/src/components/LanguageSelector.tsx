import { useLanguage, languages } from '../hooks/useLanguage';
import { useTranslation } from '../hooks/useTranslation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { Globe, Check } from 'lucide-react';

interface LanguageSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LanguageSelector({ open, onOpenChange }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const t = useTranslation();

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode as any);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text flex items-center">
            <Globe className="w-5 h-5 mr-2 text-cyan-400" />
            {t('sidebar.language')}
          </DialogTitle>
          <DialogDescription>Select your preferred language</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant="ghost"
              className={`w-full justify-between h-auto py-3 px-4 hover:bg-cyan-400/10 dark:hover:bg-cyan-400/10 hover:bg-gray-100 ${
                language === lang.code
                  ? 'bg-cyan-400/20 dark:bg-cyan-400/20 bg-gray-100 border border-cyan-400/30'
                  : ''
              }`}
              onClick={() => handleLanguageSelect(lang.code)}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-foreground dark:text-white text-gray-900">
                  {lang.nativeName}
                </span>
                <span className="text-xs text-muted-foreground dark:text-gray-400 text-gray-600">
                  {lang.name}
                </span>
              </div>
              {language === lang.code && (
                <Check className="w-5 h-5 text-cyan-400" />
              )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

