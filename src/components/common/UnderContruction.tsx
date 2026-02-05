import { useLanguage } from "@/contexts/LanguageContext";

export default function UnderConstruction() {
    const { t } = useLanguage();
    return (
        <div
            className="mx-auto my-10 max-w-2xl rounded-2xl bg-white/70 p-6 text-center backdrop-blur dark:border-gray-700 dark:bg-gray-900/60"
            role="status"
            aria-live="polite"
        >
            <div
                role="status"
                aria-live="polite"
                className="mx-auto my-10 max-w-2xl rounded-2xl bg-white/70 p-6 text-center backdrop-blur
            dark:border-gray-700 dark:bg-gray-900/60"
            >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t("common.underDevelopment")}
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {t("common.weAreWorkingHardToFinishThisFeature")}
                </p>
            </div>
        </div>
    );
}
