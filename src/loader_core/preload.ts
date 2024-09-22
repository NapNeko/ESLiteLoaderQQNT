import { contextBridge } from "electron";


function topologicalSort(dependencies: any[]) {
    const sorted: any[] = [];
    const visited = new Set();
    const visit = (slug: string) => {
        if (visited.has(slug)) return;
        visited.add(slug);
        const plugin = LiteLoader.plugins[slug];
        plugin.manifest.dependencies?.forEach((depSlug: string) => visit(depSlug));
        sorted.push(slug);
    }
    dependencies.forEach(slug => visit(slug));
    return sorted;
}


(new class {

    async init() {
        const preloadErrors: { [key: string]: { message: string, stack: string } } = {}
        for (const slug of topologicalSort(Object.keys(LiteLoader.plugins))) {
            const plugin = LiteLoader.plugins[slug];
            if (plugin.disabled || plugin.incompatible || plugin.error) {
                continue;
            }
            if (plugin.path.injects.preload) {
                try {
                    runPreloadScript(await (await fetch(`local:///${plugin.path.injects.preload}`)).text());
                }
                catch (e) {
                    preloadErrors[slug] = { message: `[Preload] ${e.message}`, stack: e.stack };
                }
            }
        }
        contextBridge.exposeInMainWorld("LiteLoaderPreloadErrors", preloadErrors);
        return this;
    }

}).init();