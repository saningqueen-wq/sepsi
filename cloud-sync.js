(function () {
    "use strict";

    const SUPABASE_URL = "https://huemiwswjmzjrnnzwdic.supabase.co";
    const SUPABASE_KEY = "sb_publishable_fEoU6S7ci0X9qmDvZgUYkQ_sT74apuc";
    const ROW_ID = "site";
    const SYNC_KEYS = [
        "amino-blog-overrides-v2",
        "amino-posts-v2",
        "amino-posts",
        "amino-blog-drafts-v2",
        "amino-comments",
        "amino-bio",
        "amino-bio-photos-v1",
        "theme-accent",
        "theme-bg"
    ];
    const LOCAL_STAMP_KEY = "amino-cloud-sync-updated-at";
    const RELOAD_FLAG = "amino-cloud-sync-reloaded";
    const nativeSetItem = Storage.prototype.setItem;
    const nativeRemoveItem = Storage.prototype.removeItem;
    let applyingRemote = false;
    let saveTimer = null;

    function snapshotLocal() {
        const data = {};
        SYNC_KEYS.forEach(function (key) {
            const value = localStorage.getItem(key);
            if (value !== null) data[key] = value;
        });
        return data;
    }

    function hasMeaningfulData(data) {
        return data && Object.keys(data).some(function (key) {
            const value = data[key];
            return value !== null && value !== "" && value !== "{}" && value !== "[]";
        });
    }

    async function api(path, options) {
        const response = await fetch(SUPABASE_URL + "/rest/v1/" + path, Object.assign({
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: "Bearer " + SUPABASE_KEY,
                "Content-Type": "application/json"
            },
            cache: "no-store"
        }, options || {}));
        if (!response.ok) throw new Error("Cloud sync HTTP " + response.status);
        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    async function readCloud() {
        const rows = await api("blog_state?id=eq." + encodeURIComponent(ROW_ID) + "&select=payload,updated_at");
        return Array.isArray(rows) && rows[0] ? rows[0] : null;
    }

    async function writeCloud() {
        const payload = snapshotLocal();
        const now = new Date().toISOString();
        await api("blog_state?id=eq." + encodeURIComponent(ROW_ID), {
            method: "PATCH",
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: "Bearer " + SUPABASE_KEY,
                "Content-Type": "application/json",
                Prefer: "return=minimal"
            },
            body: JSON.stringify({ payload: payload, updated_at: now })
        });
        nativeSetItem.call(localStorage, LOCAL_STAMP_KEY, now);
        window.dispatchEvent(new CustomEvent("amino-cloud-saved", { detail: { updatedAt: now } }));
    }

    function scheduleCloudSave() {
        if (applyingRemote) return;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            writeCloud().catch(function (error) {
                console.warn("No se pudo guardar en la nube", error);
            });
        }, 350);
    }

    function installStorageMirror() {
        if (Storage.prototype.__aminoCloudMirrorInstalled) return;
        Storage.prototype.setItem = function (key, value) {
            const result = nativeSetItem.call(this, key, value);
            if (this === localStorage && SYNC_KEYS.indexOf(key) >= 0) scheduleCloudSave();
            return result;
        };
        Storage.prototype.removeItem = function (key) {
            const result = nativeRemoveItem.call(this, key);
            if (this === localStorage && SYNC_KEYS.indexOf(key) >= 0) scheduleCloudSave();
            return result;
        };
        Object.defineProperty(Storage.prototype, "__aminoCloudMirrorInstalled", {
            value: true,
            configurable: true
        });
    }

    function applyRemotePayload(payload) {
        applyingRemote = true;
        try {
            SYNC_KEYS.forEach(function (key) {
                if (Object.prototype.hasOwnProperty.call(payload, key)) {
                    nativeSetItem.call(localStorage, key, payload[key]);
                } else {
                    nativeRemoveItem.call(localStorage, key);
                }
            });
        } finally {
            applyingRemote = false;
        }
    }

    async function initialSync() {
        try {
            const cloud = await readCloud();
            const local = snapshotLocal();
            const cloudPayload = cloud && cloud.payload && typeof cloud.payload === "object" ? cloud.payload : {};
            const localStamp = localStorage.getItem(LOCAL_STAMP_KEY) || "";
            const cloudStamp = cloud && cloud.updated_at ? cloud.updated_at : "";

            if (!hasMeaningfulData(cloudPayload) && hasMeaningfulData(local)) {
                await writeCloud();
                sessionStorage.setItem(RELOAD_FLAG, "1");
                return;
            }

            if (hasMeaningfulData(cloudPayload) && (!localStamp || cloudStamp > localStamp)) {
                applyRemotePayload(cloudPayload);
                nativeSetItem.call(localStorage, LOCAL_STAMP_KEY, cloudStamp);
                if (!sessionStorage.getItem(RELOAD_FLAG)) {
                    sessionStorage.setItem(RELOAD_FLAG, "1");
                    location.reload();
                    return;
                }
            }

            sessionStorage.removeItem(RELOAD_FLAG);
            window.dispatchEvent(new CustomEvent("amino-cloud-ready"));
        } catch (error) {
            console.warn("No se pudo sincronizar con la nube; se usará el guardado local.", error);
        }
    }

    installStorageMirror();
    initialSync();

    window.addEventListener("focus", function () {
        readCloud().then(function (cloud) {
            if (!cloud || !cloud.payload) return;
            const localStamp = localStorage.getItem(LOCAL_STAMP_KEY) || "";
            if (cloud.updated_at && cloud.updated_at > localStamp) {
                applyRemotePayload(cloud.payload);
                nativeSetItem.call(localStorage, LOCAL_STAMP_KEY, cloud.updated_at);
                location.reload();
            }
        }).catch(function () {});
    });
})();
