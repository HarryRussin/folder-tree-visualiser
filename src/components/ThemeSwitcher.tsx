// components/ThemeSwitcher.tsx
import { FC } from "react";

type Props = {
  theme: string;
  setTheme: (t: string) => void;
};

const ThemeSwitcher: FC<Props> = ({ theme, setTheme }) => (
  <select
    value={theme}
    onChange={(e) => setTheme(e.target.value)}
    className="border rounded px-2 py-1 text-sm"
  >
    <option value="theme-terminal">🟢 Terminal</option>
    <option value="theme-ascii">⚪ ASCII</option>
    <option value="theme-icons">🟡 Icons</option>
    <option value="theme-blueprint">🔷 Blueprint</option>
    <option value="theme-contrast">🖤 High Contrast</option>
  </select>);

export default ThemeSwitcher