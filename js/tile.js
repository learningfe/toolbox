new Vue({
    el: document.getElementById("app"),

    data() {
        return {
            price: 0,
            width: 0,
            height: 0,

            preset: [
                // 宽 高 片单价
                [750, 1500],
                [600, 1200],
                [800, 800],
            ],
            history: [],
        };
    },
    computed: {
        priceM2() {
            return this.calcPriceM2(this.width, this.height, this.price);
        },
    },

    methods: {
        calcPriceM2(width, height, price) {
            const area = width * height * 0.001 * 0.001;
            const p = area ? price / area : 0;
            return p.toFixed(2);
        },

        loadPresets([width, height, price]) {
            this.width = width || this.width;
            this.height = height || this.height;
            this.price = price || this.price;
        },

        save() {
            const data = [this.width, this.height, this.price, this.priceM2];
            const alreadySaved = this.history.some(item => isArrayEqual(item, data));
            if (!alreadySaved) {
                this.history.push(data);
                this.writeHistory();

                const size = [this.width, this.height];
                const alreadyHasPreset = this.preset.some(item => isArrayEqual(item, size));
                if (!alreadyHasPreset) {
                    this.preset.push(size);
                    this.writePreset();
                }
            }
        },

        focus(e) {
            if (e && e.target && typeof e.target.select === 'function') {
                e.target.select();
            }
        },

        // presets
        writePreset() {
            writeStorage("__price_preset__", this.preset);
        },

        readPreset() {
            const data = readStorage("__price_preset__");
            this.preset = Array.isArray(data) ? data : [
                [750, 1500],
                [600, 1200],
                [800, 800],
            ];
        },

        // history

        writeHistory() {
            writeStorage("__price_history__", this.history);
        },

        readHistory() {
            const data = readStorage("__price_history__");
            this.history = Array.isArray(data) ? data : [];
        },

        clearHistory() {
            this.history = [];
            this.writeHistory();
        },

        deleteHistory(index) {
            this.history.splice(index, 1);
            this.writeHistory();
        },

        // input

        writeInput() {
            writeStorage("__price_input__", this.price);
        },

        readInput() {
            const data = readStorage("__price_input__");
            this.price = data || 0;
        },
    },

    watch: {
        price: function (next, prev) {
            this.writeInput();
        },
    },

    mounted() {
        this.readPreset();
        this.readHistory();
        this.readInput();

        this.loadPresets(this.preset[0]);

        document.addEventListener('contextmenu', e => e.preventDefault());
    },
});

function writeStorage(key, data) {
    debounceExec(key, () => {
        window.localStorage.setItem(key, JSON.stringify(data));
        console.log("[info] save %s", key);
    });
}

function readStorage(key) {
    try {
        const cache = window.localStorage.getItem(key);
        const data = cache ? JSON.parse(cache) || null : null;
        return data;
    } catch (e) {
        return null;
    }
}

function isArrayEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }
        if (a.every((item, index) => item === b[index])) {
            return true;
        }
    }
    return false;
}

function debounceExec(key, fn) {
    window.__debounceDelay__ = window.__debounceDelay || 1000;
    window.__debounceMap__ = window.__debounceMap__ || new Map();

    clearTimeout(window.__debounceMap__.get(key));

    window.__debounceMap__.set(
        key,
        setTimeout(fn, window.__debounceDelay__)
    );
}

const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register(
                '/toolbox/sw.js',
                {
                    scope: '/toolbox/',
                }
            );
            if (registration.installing) {
                console.log('Service worker installing');
            } else if (registration.waiting) {
                console.log('Service worker installed');
            } else if (registration.active) {
                console.log('Service worker active');
            }
        } catch (error) {
            console.error(`Registration failed with ${error}`);
        }
    }
};

window.addEventListener('load', registerServiceWorker);
