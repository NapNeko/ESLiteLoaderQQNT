import { SettingInterface } from "@/settings/renderer";

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
export class RendererLoader {

    #exports: { [key: string]: any } = {};

    async init() {
        // 确保preload加载完毕
        if (!window.LiteLoaderPreloadErrors) {
            await new Promise<void>(resolve => {
                const check = () => (window.LiteLoaderPreloadErrors ? resolve() : setTimeout(check));
                check();
            });
        }
        // 加载插件
        for (const slug of topologicalSort(Object.keys(LiteLoader.plugins))) {
            const plugin = LiteLoader.plugins[slug];
            if (plugin.disabled || plugin.incompatible) {
                continue;
            }
            const error = plugin.error || LiteLoaderPreloadErrors[slug];
            if (error) {
                this.#exports[slug] = { error };
                continue
            }
            if (plugin.path.injects.renderer) {
                try {
                    this.#exports[slug] = await import(`local:///${plugin.path.injects.renderer}`);
                }
                catch (e: any) {
                    this.#exports[slug] = { error: { message: `[Renderer] ${e.message}`, stack: e.stack } };
                }
            }
        }
        return this;
    }

    onSettingWindowCreated(settingInterface: SettingInterface) {
        for (const slug in this.#exports) {
            const plugin = this.#exports[slug];
            try {
                if (plugin.error) throw plugin.error;
                plugin.onSettingWindowCreated?.(settingInterface.add(LiteLoader.plugins[slug]));
            }
            catch (e) {
                const view = settingInterface.add(LiteLoader.plugins[slug]);
                const formattedError = { message: (e as Error).message, stack: (e as Error).stack };
                settingInterface.createErrorView(formattedError, slug, view);
            }
        }
    }

    onVueComponentMount(component: { vnode: any; }) {
        for (const slug in this.#exports) {
            const plugin = this.#exports[slug];
            plugin.onVueComponentMount?.(component);
        }
    }

    onVueComponentUnmount(component: { vnode: any; }) {
        for (const slug in this.#exports) {
            const plugin = this.#exports[slug];
            plugin.onVueComponentUnmount?.(component);
        }
    }

}