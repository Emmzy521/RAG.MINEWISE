import { useLanguage } from './useLanguage';
import { t as translate, TranslationKey } from '../lib/translations';

export function useTranslation() {
  const { language } = useLanguage();
  
  return (key: TranslationKey): string => {
    return translate(key, language);
  };
}

