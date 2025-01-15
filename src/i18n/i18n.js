import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './translations/en.json';
import esTranslations from './translations/es.json';
import itTranslations from './translations/it.json';
import arTranslations from './translations/ar.json';
import svTranslations from './translations/sv.json';
import deTranslations from './translations/de.json';
import nlTranslations from './translations/nl.json';
import frTranslations from './translations/fr.json';
import faTranslations from './translations/fa.json';
import fiTranslations from './translations/fi.json';
import daTranslations from './translations/da.json';
import elTranslations from './translations/el.json';
import ruTranslations from './translations/ru.json';
import trTranslations from './translations/tr.json';
import ptTranslations from './translations/pt.json';
import jaTranslations from './translations/ja.json';
import hiTranslations from './translations/hi.json';
import kuTranslations from './translations/ku.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      it: { translation: itTranslations },
      ar: { translation: arTranslations },
      sv: { translation: svTranslations },
      de: { translation: deTranslations },
      nl: { translation: nlTranslations },
      fr: { translation: frTranslations },
      fa: { translation: faTranslations },
      fi: { translation: fiTranslations },
      da: { translation: daTranslations },
      el: { translation: elTranslations },
      ru: { translation: ruTranslations },
      tr: { translation: trTranslations },
      pt: { translation: ptTranslations },
      ja: { translation: jaTranslations },
      hi: { translation: hiTranslations },
      ku: { translation: kuTranslations }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 