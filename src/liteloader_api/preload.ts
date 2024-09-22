const { ipcRenderer, contextBridge } = require("electron");


function invokeAPI(name: string, method: string, args: any[]) {
    return ipcRenderer.invoke("LiteLoader.LiteLoader.api", name, method, args);
}


// LiteLoader
Object.defineProperty(globalThis, "LiteLoader", {
    value: {
        ...ipcRenderer.sendSync("LiteLoader.LiteLoader.LiteLoader"),
        api: {
            config: {
                get: (...args: any) => invokeAPI("config", "get", args),
                set: (...args: any) => invokeAPI("config", "set", args)
            },
            plugin: {
                install: (...args: any[]) => invokeAPI("plugin", "install", args),
                delete: (...args: any[]) => invokeAPI("plugin", "delete", args),
                disable: (...args: any[]) => invokeAPI("plugin", "disable", args)
            },
            openExternal: (...args: any[]) => invokeAPI("openExternal", "openExternal", args),
            openPath: (...args: any[]) => invokeAPI("openPath", "openPath", args)
        }
    }
});

contextBridge.exposeInMainWorld("LiteLoader", LiteLoader);
