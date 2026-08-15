(function () {
    "use strict";

    // Estado que debe viajar con el enlace compartido.
    // Los borradores NO se comparten: solo lo que ya se guardó/publicó.
    const SHARED_KEYS = [
        "amino-blog-overrides-v2",
        "amino-posts-v2"
    ];

    const HASH_PREFIX = "amino-share=";
    const MAX_HASH_LENGTH = 1200000;

    const nativeGetItem = Storage.prototype.getItem;
    const nativeSetItem = Storage.prototype.setItem;
    const nativeRemoveItem = Storage.prototype.removeItem;
    const nativeClear = Storage.prototype.clear;

    let syncingHash = false;
    let restoringHash = false;

    function isSharedKey(key) {
        return SHARED_KEYS.indexOf(String(key)) >= 0;
    }

    function utf8ToBase64Url(text) {
        const bytes = new TextEncoder().encode(String(text));
        let binary = "";
        const chunkSize = 0x8000;

        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
            binary += String.fromCharCode.apply(null, chunk);
        }

        return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/g, "");
    }

    function base64UrlToUtf8(value) {
        let normalized = String(value || "")
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        while (normalized.length % 4) {
            normalized += "=";
        }

        const binary = atob(normalized);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
        }

        return new TextDecoder().decode(bytes);
    }

    function currentSharedState() {
        const values = {};

        SHARED_KEYS.forEach(function (key) {
            const value = nativeGetItem.call(window.localStorage, key);
            values[key] = value === null ? null : value;
        });

        return {
            version: 1,
            values: values
        };
    }

    function showShareMessage(message, isError) {
        let toast = document.getElementById("aminoShareToast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "aminoShareToast";
            toast.setAttribute("role", "status");
            toast.style.position = "fixed";
            toast.style.left = "50%";
            toast.style.bottom = "24px";
            toast.style.transform = "translateX(-50%) translateY(16px)";
            toast.style.zIndex = "25000";
            toast.style.maxWidth = "min(90vw, 420px)";
            toast.style.padding = "11px 16px";
            toast.style.borderRadius = "999px";
            toast.style.background = "rgba(15,15,15,.94)";
            toast.style.color = "#fff";
            toast.style.font = "600 12px/1.35 Arial, sans-serif";
            toast.style.textAlign = "center";
            toast.style.boxShadow = "0 8px 30px rgba(0,0,0,.3)";
            toast.style.opacity = "0";
            toast.style.pointerEvents = "none";
            toast.style.transition = "opacity .2s ease, transform .2s ease";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.background = isError ? "rgba(126,24,37,.96)" : "rgba(15,15,15,.94)";
        toast.style.opacity = "1";
        toast.style.transform = "translateX(-50%) translateY(0)";

        window.clearTimeout(showShareMessage.timer);
        showShareMessage.timer = window.setTimeout(function () {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(-50%) translateY(16px)";
        }, 2600);
    }

    function syncHashFromStorage(showFeedback) {
        if (restoringHash || syncingHash) {
            return true;
        }

        syncingHash = true;
        try {
            const payload = JSON.stringify(currentSharedState());
            const encoded = utf8ToBase64Url(payload);
            const nextHash = HASH_PREFIX + encoded;

            if (nextHash.length > MAX_HASH_LENGTH) {
                if (showFeedback) {
                    showShareMessage("La versión es demasiado grande para guardarla dentro del enlace.", true);
                }
                return false;
            }

            const nextUrl = window.location.pathname + window.location.search + "#" + nextHash;
            window.history.replaceState(window.history.state, "", nextUrl);

            if (showFeedback) {
                showShareMessage("Cambios guardados en el enlace compartible ♡", false);
            }
            return true;
        } catch (error) {
            if (showFeedback) {
                showShareMessage("No se pudo preparar el enlace compartible.", true);
            }
            return false;
        } finally {
            syncingHash = false;
        }
    }

    function restoreSharedStateFromHash() {
        const hash = String(window.location.hash || "");
        const marker = "#" + HASH_PREFIX;
        if (hash.indexOf(marker) !== 0) {
            return false;
        }

        try {
            const decoded = base64UrlToUtf8(hash.slice(marker.length));
            const payload = JSON.parse(decoded);
            if (!payload || payload.version !== 1 || !payload.values || typeof payload.values !== "object") {
                return false;
            }

            restoringHash = true;
            SHARED_KEYS.forEach(function (key) {
                if (!Object.prototype.hasOwnProperty.call(payload.values, key)) {
                    return;
                }

                const value = payload.values[key];
                if (value === null) {
                    nativeRemoveItem.call(window.localStorage, key);
                } else if (typeof value === "string") {
                    nativeSetItem.call(window.localStorage, key, value);
                }
            });
            restoringHash = false;
            return true;
        } catch (error) {
            restoringHash = false;
            return false;
        }
    }

    // Debe ejecutarse ANTES de blog-editor.js para que la otra persona reciba
    // los cambios compartidos antes de que se construyan los blogs.
    const restoredFromLink = restoreSharedStateFromHash();

    Storage.prototype.setItem = function (key, value) {
        const result = nativeSetItem.call(this, key, value);
        if (this === window.localStorage && isSharedKey(key)) {
            syncHashFromStorage(true);
        }
        return result;
    };

    Storage.prototype.removeItem = function (key) {
        const result = nativeRemoveItem.call(this, key);
        if (this === window.localStorage && isSharedKey(key)) {
            syncHashFromStorage(false);
        }
        return result;
    };

    Storage.prototype.clear = function () {
        const result = nativeClear.call(this);
        if (this === window.localStorage) {
            syncHashFromStorage(false);
        }
        return result;
    };

    window.AminoSharedState = {
        refresh: function () {
            return syncHashFromStorage(true);
        },
        url: function () {
            syncHashFromStorage(false);
            return window.location.href;
        },
        restoredFromLink: restoredFromLink
    };

    // También convierte configuraciones que ya estaban guardadas antes de
    // instalar esta función en un enlace compartible al recargar la página.
    if (!restoredFromLink) {
        const hasExistingSharedData = SHARED_KEYS.some(function (key) {
            return nativeGetItem.call(window.localStorage, key) !== null;
        });
        if (hasExistingSharedData) {
            syncHashFromStorage(false);
        }
    }
})();
