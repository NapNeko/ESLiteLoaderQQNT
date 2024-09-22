import "./components/renderer.js";
import "./easter_eggs/renderer.js";
import { SettingInterface } from "./settings/renderer.js";
import { RendererLoader } from "./loader_core/renderer.js";

//扩展 HTMLElement
declare global {
    interface HTMLElement {
        __VUE__: any[];
    }
}

const loader = await new RendererLoader().init();


// 寻找指定元素
function findElement(selector: string, callback: { (): void; (arg0: any): void; }) {
    const observer = (_: undefined | MutationRecord[], observer: { disconnect: () => void; } | undefined) => {
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
            observer?.disconnect?.();
            return true;
        }
        return false;
    }
    if (!observer(undefined, undefined)) {
        new MutationObserver(observer).observe(document, {
            subtree: true,
            attributes: false,
            childList: true
        });
    }
}


// 监听页面变化
async function watchURLHash(callback: { (currentHash: any): void; (arg0: string): void; }) {
    if (!location.hash.includes("#/blank")) {
        callback(location.hash);
    }
    else {
        navigation.addEventListener("navigatesuccess", () => {
            callback(location.hash)
        }, { once: true });
    }
}


function loadSettingInterface(currentHash: string) {
    if (currentHash.includes("#/setting")) {
        const settingInterface = new SettingInterface();
        findElement(".setting-tab .nav-bar", () => {
            settingInterface.SettingInit();
            loader.onSettingWindowCreated(settingInterface);
        });
    }
}


// 指定页面触发
watchURLHash(loadSettingInterface);


Proxy = new Proxy(Proxy, {
    construct(target, argArray, newTarget) {
        const component = argArray[0]?._;
        const element = component?.vnode?.el;
        if (component?.uid >= 0) {
            if (element) {
                watchComponentUnmount(component);
                recordComponent(component);
                loader.onVueComponentMount(component);
            } else watchComponentMount(component);
        }
        return Reflect.construct(target, argArray, newTarget);
    }
});


function recordComponent(component: { vnode: { el: any; }; }) {
    let element = component.vnode.el;
    while (!(element instanceof HTMLElement)) {
        element = element.parentElement;
    }

    // Expose component to element's __VUE__ property
    if (element.__VUE__) element.__VUE__.push(component);
    else element.__VUE__ = [component];

    // Add class to element
    element.classList.add("vue-component");
}


function watchComponentMount(component: { vnode: any; }) {
    let value: null = null;
    let hooked = false;
    Object.defineProperty(component.vnode, "el", {
        get() { return value },
        set(newValue) {
            value = newValue;
            if (!hooked && this.el) {
                hooked = true;
                watchComponentUnmount(component);
                loader.onVueComponentMount(component);
            }
            if (value) {
                recordComponent(component);
            }
        }
    });
}


function watchComponentUnmount(component: { vnode: any; }) {
    let value: null = null;
    let unhooked = false;
    Object.defineProperty(component, "isUnmounted", {
        get() { return value },
        set(newValue) {
            value = newValue;
            if (!unhooked && this.isUnmounted) {
                unhooked = true;
                loader.onVueComponentUnmount(component);
            }
        }
    });
}