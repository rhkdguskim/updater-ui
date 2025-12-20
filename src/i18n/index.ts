import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Korean translations
import koCommon from './locales/ko/common.json';
import koTargets from './locales/ko/targets.json';
import koAuth from './locales/ko/auth.json';
import koDistributions from './locales/ko/distributions.json';
import koRollouts from './locales/ko/rollouts.json';
import koDashboard from './locales/ko/dashboard.json';
import koSystem from './locales/ko/system.json';
import koActions from './locales/ko/actions.json';

// English translations
import enCommon from './locales/en/common.json';
import enTargets from './locales/en/targets.json';
import enAuth from './locales/en/auth.json';
import enDistributions from './locales/en/distributions.json';
import enRollouts from './locales/en/rollouts.json';
import enDashboard from './locales/en/dashboard.json';
import enSystem from './locales/en/system.json';
import enActions from './locales/en/actions.json';

const resources = {
    ko: {
        common: koCommon,
        targets: koTargets,
        auth: koAuth,
        distributions: koDistributions,
        rollouts: koRollouts,
        dashboard: koDashboard,
        system: koSystem,
        actions: koActions,
    },
    en: {
        common: enCommon,
        targets: enTargets,
        auth: enAuth,
        distributions: enDistributions,
        rollouts: enRollouts,
        dashboard: enDashboard,
        system: enSystem,
        actions: enActions,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: ['common', 'targets', 'auth', 'distributions', 'rollouts', 'dashboard', 'system', 'actions'],
        interpolation: {
            escapeValue: false, // React already escapes values
        },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupLocalStorage: 'updater-language',
        },
    });

export default i18n;

