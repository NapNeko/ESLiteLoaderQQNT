import { SettingElementStyleSheets } from "./components/renderer";

declare global {
    interface Window {
        SettingElementStyleSheets: SettingElementStyleSheets;
    }
}