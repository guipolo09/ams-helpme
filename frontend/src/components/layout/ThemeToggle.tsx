import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/ThemeProvider";
import { Select } from "../ui";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <Select
      aria-label={t("common.theme")}
      value={theme}
      onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
      className="w-auto"
    >
      <option value="system">{t("common.system")}</option>
      <option value="light">{t("common.light")}</option>
      <option value="dark">{t("common.dark")}</option>
    </Select>
  );
}
