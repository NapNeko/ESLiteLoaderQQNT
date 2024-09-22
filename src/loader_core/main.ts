function topologicalSort(dependencies: any[]) {
    const sorted: any[] = [];
    const visited = new Set();
    const visit = (slug: string) => {
        if (visited.has(slug)) return;
        visited.add(slug);
        const plugin = LiteLoader.plugins[slug];
        plugin.manifest.dependencies?.forEach((depSlug: any) => visit(depSlug));
        sorted.push(slug);
    }
    dependencies.forEach(slug => visit(slug));
    return sorted;
}


export class MainLoader {
    #exports: { [key: string]: any } = {};
    init() {
        // 加载插件
        for (const slug of topologicalSort(Object.keys(LiteLoader.plugins))) {
            const plugin = LiteLoader.plugins[slug];
            if (plugin.disabled || plugin.incompatible) {
                continue;
            }
            if (plugin.path.injects.main) {
                try {
                    this.#exports[slug] = require(plugin.path.injects.main);
                }
                catch (e: unknown) {
                    const error = e as Error;
                    plugin.error = { message: `[Main] ${error.message}`, stack: error.stack };
                }
            }
        }
        return this;
    }

    onBrowserWindowCreated(window: unknown) {
        for (const slug in this.#exports) {
            const plugin = this.#exports[slug];
            plugin.onBrowserWindowCreated?.(window);
        }
    }

    onLogin(uid: any) {
        for (const slug in this.#exports) {
            const plugin = this.#exports[slug];
            plugin.onLogin?.(uid);
        }
    }

}