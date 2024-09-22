import style from "./static/style.css" with { type: "css" };

const html_url = "local://root/src/components/static/template.html";
const html_file = await (await fetch(html_url)).text();
const template = new DOMParser().parseFromString(html_file, "text/html");


Object.defineProperty(globalThis, "SettingElementStyleSheets", {
    value: new class {
        #styleSheets = [];
        #callbacks: ((styleSheets: CSSStyleSheet[]) => void)[] = [];
        set styleSheets(value) {
            this.#styleSheets = value;
            for (const callback of this.#callbacks) {
                callback(this.#styleSheets);
            }
        }
        get styleSheets() {
            return this.#styleSheets;
        }
        on(callback: (styleSheets: CSSStyleSheet[]) => void) {
            this.#callbacks.push(callback);
            callback(this.#styleSheets);
        }
    }
});

export interface SettingElementStyleSheets {
    styleSheets: CSSStyleSheet[];
    on(callback: (styleSheets: CSSStyleSheet[]) => void): void;
}
class SettingElementBase extends HTMLElement {
    private _template: HTMLElement | null;
    private _content: any;
    protected _slot: HTMLSlotElement | null;
    constructor(element_id: string) {
        super();
        this.attachShadow({ mode: "open" });
        this._template = template.getElementById(element_id);
        this._content = (this._template as HTMLTemplateElement)?.content?.cloneNode(true);
        this._slot = this.shadowRoot!.querySelector("slot");
        this.shadowRoot?.append(this._content);

        SettingElementStyleSheets.on((styleSheets) => {
            if (this.shadowRoot) {
                this.shadowRoot.adoptedStyleSheets = styleSheets;
            }
        });
    }
    attributeChangedCallback() {
        this.update();
    }
    update() {
        return;
    }
}


const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(style.toString());
SettingElementStyleSheets.styleSheets = [styleSheet];


customElements.define("setting-section", class extends SettingElementBase {
    static observedAttributes = ["data-title"];
    private _title: HTMLHeadingElement | null;
    constructor() {
        super("setting-section");
        if (!this.shadowRoot) {
            throw new Error("shadowRoot not found");
        }
        this._title = this.shadowRoot.querySelector("h1");
        this.update();
    }
    update() {
        if (this._title && this.dataset["title"] !== undefined) {
            this._title.textContent = this.dataset["title"]!;
        }
    }
});


customElements.define("setting-panel", class extends SettingElementBase {
    constructor() {
        super("setting-panel");
    }
});


customElements.define("setting-list", class extends SettingElementBase {
    static observedAttributes = ["data-title", "data-direction", "is-collapsible", "is-active", "is-disabled"];
    private _head: any;
    private _title: any;
    constructor() {
        super("setting-list");
        const head = this.shadowRoot?.querySelector("setting-item");
        if (!head) {
            throw new Error("setting-item not found in shadowRoot");
        }
        this._head = head;
        const _title = this.shadowRoot?.querySelector("h2");
        if (!head) {
            throw new Error("setting-item not found in shadowRoot");
        }
        this._title = _title;
        const slot = this.shadowRoot?.querySelector("slot");
        if (!slot) {
            throw new Error("slot not found in shadowRoot");
        }
        this._slot = slot;

        this._head.addEventListener("click", () => {
            this.toggleAttribute("is-active");
        });
        this.update();
        new MutationObserver((_, observer) => {
            observer.disconnect();
            this.update();
            observer.observe(this, { childList: true });
        }).observe(this, { childList: true });
    }
    update() {
        this._title.textContent = this.dataset["title"];
        const slot_children = this._slot ? this._slot.assignedElements() : [];
        this.querySelectorAll("setting-divider").forEach(node => node.remove());
        // 折叠列表
        if (this.hasAttribute("is-collapsible")) {
            this._head.classList.toggle("hidden", false);
            slot_children.forEach((node, index) => {
                const setting_divider = document.createElement("setting-divider");
                if (this.dataset["direction"] == "column") {
                    setting_divider.dataset["direction"] = "row";
                    (node as HTMLElement).dataset["direction"] = "row";
                }
                if (index < slot_children.length) {
                    node.before(setting_divider);
                }
            });
        }
        // 普通列表
        else {
            this._head.classList.toggle("hidden", true);
            slot_children.forEach((node, index) => {
                const setting_divider = document.createElement("setting-divider");
                if (this.dataset["direction"] == "column") {
                    setting_divider.dataset["direction"] = "row";
                    (node as HTMLElement).dataset["direction"] = "row";
                }
                if (this.dataset["direction"] == "row") {
                    setting_divider.dataset["direction"] = "column";
                    (node as HTMLElement).dataset["direction"] = "column";
                }
                if (index + 1 < slot_children.length) {
                    node.after(setting_divider);
                }
            });
        }
    }
});


customElements.define("setting-item", class extends SettingElementBase {
    static observedAttributes = ["data-direction"];
    constructor() {
        super("setting-item");
    }
});


customElements.define("setting-select", class extends SettingElementBase {
    static observedAttributes = ["is-disabled"];
    private _title: HTMLInputElement | null;
    private _button: HTMLElement | null;
    private _context: HTMLUListElement | null;
    constructor() {
        super("setting-select");
        this._title = this.shadowRoot?.querySelector("input")!;
        this._button = this.shadowRoot?.querySelector(".menu-button")!;
        this._context = this.shadowRoot?.querySelector("ul")!;
        const click = () => {
            if (this._context) {
                this._context.classList.toggle("hidden");
                if (!this._context.classList.contains("hidden")) {
                    window.addEventListener("pointerup", pointerup);
                    this._context.style.width = getComputedStyle(this).getPropertyValue("width");
                } else {
                    window.removeEventListener("pointerup", pointerup);
                    this._context.style.width = '';
                }
            }
        }
        const pointerup = (event: PointerEvent) => {
            if ((event.target as HTMLElement).tagName != "SETTING-SELECT") {
                click();
            }
        }
        this._button?.addEventListener("click", click);
        this._context?.addEventListener("click", (event: Event) => {
            const target = event.target as HTMLElement;
            if (target.tagName == "SETTING-OPTION" && !target.hasAttribute("is-selected")) {
                for (const node of this.querySelectorAll("setting-option[is-selected]")) {
                    node.toggleAttribute("is-selected");
                }
                target.toggleAttribute("is-selected");
                if (this._title) {
                    this._title.value = target.textContent || '';
                }
                this.dispatchEvent(new CustomEvent("selected", {
                    bubbles: true,
                    composed: true,
                    detail: {
                        name: target.textContent,
                        value: target.dataset["value"]
                    }
                }));
            }
        });
        if (this._title) {
            this._title.value = this.querySelector("setting-option[is-selected]")?.textContent || '';
        }
    }
});


customElements.define("setting-option", class extends SettingElementBase {
    static observedAttributes = ["data-value", "is-selected", "is-disabled"];
    constructor() {
        super("setting-option");
    }
});


customElements.define("setting-switch", class extends SettingElementBase {
    static observedAttributes = ["is-active", "is-disabled"];
    constructor() {
        super("setting-switch");
    }
});


customElements.define("setting-button", class extends SettingElementBase {
    static observedAttributes = ["data-type", "is-disabled"];
    constructor() {
        super("setting-button");
    }
});


customElements.define("setting-text", class extends SettingElementBase {
    static observedAttributes = ["data-type"];
    constructor() {
        super("setting-text");
    }
});


customElements.define("setting-link", class extends SettingElementBase {
    static observedAttributes = ["data-value"];
    constructor() {
        super("setting-link");
        this.addEventListener("click", () => {
            if (this.dataset["value"]) {
                LiteLoader.api.openExternal(this.dataset["value"]);
            }
        });
    }
});


customElements.define("setting-divider", class extends SettingElementBase {
    static observedAttributes = ["data-direction"];
    constructor() {
        super("setting-divider");
    }
});


customElements.define("setting-modal", class extends SettingElementBase {
    static observedAttributes = ["data-title", "is-active"];
    private _title: HTMLElement | null;
    private _close: HTMLElement | null;
    private _modal: HTMLElement | null;
    constructor() {
        super("setting-modal");
        this._title = this.shadowRoot?.querySelector(".title")!;
        this._close = this.shadowRoot?.querySelector(".close")!;
        this._modal = this.shadowRoot?.querySelector(".modal")!;
        if (this._close) {
            this._close.addEventListener("click", () => this.toggleAttribute("is-active"));
        }
        if (this._modal) {
            this._modal.addEventListener("click", () => this.toggleAttribute("is-active"));
        }
        this.update();
    }
    update() {
        if (this._title) {
            this._title.textContent = this.dataset["title"] ?? '';
        }
    }
});