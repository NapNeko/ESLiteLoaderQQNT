import { app, protocol, net } from "electron";
import path from "path";


app.on("ready", () => {
    const schemes = ["local"];
    const old_schemes = app.commandLine.getSwitchValue("fetch-schemes");
    const new_schemes = [old_schemes, ...schemes].join(",");
    app.commandLine.appendSwitch("fetch-schemes", new_schemes);
});


protocol.registerSchemesAsPrivileged([
    {
        scheme: "local",
        privileges: {
            standard: false,
            allowServiceWorkers: true,
            corsEnabled: false,
            supportFetchAPI: true,
            stream: true,
            bypassCSP: true
        }
    }
]);


export let protocolRegister = (protocol: { isProtocolRegistered: (arg0: string) => any; handle: (arg0: string, arg1: (req: any) => Promise<Response>) => void; }) => {
    if (!protocol.isProtocolRegistered("local")) {
        protocol.handle("local", (req) => {
            const { host, pathname } = new URL(decodeURI(req.url));
            const filepath = path.normalize(pathname.slice(1));
            switch (host) {
                case "root": return net.fetch(`file:///${LiteLoader.path.root}/${filepath}`);
                case "profile": return net.fetch(`file:///${LiteLoader.path.profile}/${filepath}`);
                default: return net.fetch(`file://${host}/${filepath}`);
            }
        });
    }
}