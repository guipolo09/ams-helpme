import { useTranslation } from "react-i18next";
import { supportedLanguages } from "../../i18n";
import { Select } from "../ui";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <Select
      aria-label={t("common.language")}
      value={i18n.resolvedLanguage}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="w-auto"
    >
      {supportedLanguages.map((lng) => (
        <option key={lng.code} value={lng.code}>
          {lng.flag} {lng.label}
        </option>
      ))}
    </Select>
  );
}
