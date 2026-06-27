import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { WorkspacePage } from "./components/workspace/WorkspacePage";
import { SettingsPage } from "./components/settings/SettingsPage";
import { useSettingsStore } from "./stores/settingsStore";

export function App() {
  const uiTheme = useSettingsStore((s) => s.uiTheme);

  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(uiTheme);
  }, [uiTheme]);

  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/project/:projectId" element={<WorkspacePage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
