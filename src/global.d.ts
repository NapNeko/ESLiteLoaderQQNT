import { SettingElementStyleSheets } from "./components/renderer";
declare global {
    let SettingElementStyleSheets: SettingElementStyleSheets;
    let LiteLoader: any;
    let runPreloadScript: (content: string) => void;
    let navigation: any;
}
export { };
