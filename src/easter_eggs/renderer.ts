// 寻找指定元素
async function findElement(selector: any, callback: (arg0: any) => void) {
    const observer = (_: MutationRecord[] | undefined, observer: { disconnect: () => void; } | undefined) => {
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
async function watchURLHash(callback: { (currentHash: any): Promise<void>; (arg0: string): void; }) {
    if (!location.hash.includes("#/blank")) {
        callback(location.hash);
    }
    else {
        navigation.addEventListener("navigatesuccess", () => {
            callback(location.hash)
        }, { once: true });
    }
}


// 加载彩蛋
async function loadEasterEggs(currentHash: string) {
    const easter_eggs = [
        "./check_update.js",
        "./search_furry.js",
        "./setting_navtab.js"
    ];
    for (const easter_egg of easter_eggs) {
        const { hash, selector, trigger } = await import(easter_egg);
        if (currentHash.includes(hash)) {
            findElement(selector, trigger);
        }
    }
}


// 指定页面触发
watchURLHash(loadEasterEggs);