(function () {
    "use strict";

    const INPUT_ID = "blogImageUpload";
    const SUPPORTED = /^image\/(?:png|jpeg|webp)$/i;
    let redispatching = false;

    function extensionOf(file) {
        const match = String(file && file.name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
        return match ? match[1] : "";
    }

    function normalizedMime(file) {
        const type = String(file && file.type || "").toLowerCase();
        const ext = extensionOf(file);

        if (type === "image/jpg" || type === "image/pjpeg" || (!type && (ext === "jpg" || ext === "jpeg"))) {
            return "image/jpeg";
        }
        if (!type && ext === "png") return "image/png";
        if (!type && ext === "webp") return "image/webp";
        return type;
    }

    function renameAs(file, mime) {
        if (file.type === mime) return file;
        try {
            return new File([file], file.name || "imagen", {
                type: mime,
                lastModified: file.lastModified || Date.now()
            });
        } catch (error) {
            return file;
        }
    }

    function canvasToBlob(canvas, type, quality) {
        return new Promise(function (resolve, reject) {
            canvas.toBlob(function (blob) {
                if (blob) resolve(blob);
                else reject(new Error("No se pudo convertir la imagen"));
            }, type, quality);
        });
    }

    function decodeWithImage(file) {
        return new Promise(function (resolve, reject) {
            const image = new Image();
            const url = URL.createObjectURL(file);
            image.onload = function () {
                URL.revokeObjectURL(url);
                resolve(image);
            };
            image.onerror = function () {
                URL.revokeObjectURL(url);
                reject(new Error("El navegador no pudo leer este formato"));
            };
            image.src = url;
        });
    }

    async function convertReadableImage(file) {
        const mime = normalizedMime(file);
        if (SUPPORTED.test(mime)) {
            return renameAs(file, mime);
        }

        if (!/^image\//i.test(mime) && !/^(avif|gif|bmp|heic|heif)$/i.test(extensionOf(file))) {
            throw new Error("El archivo seleccionado no parece ser una imagen");
        }

        let source;
        let width;
        let height;
        let closeSource = null;

        if (typeof createImageBitmap === "function") {
            try {
                source = await createImageBitmap(file);
                width = source.width;
                height = source.height;
                closeSource = function () {
                    if (source && typeof source.close === "function") source.close();
                };
            } catch (error) {
                source = null;
            }
        }

        if (!source) {
            source = await decodeWithImage(file);
            width = source.naturalWidth || source.width;
            height = source.naturalHeight || source.height;
        }

        if (!width || !height) {
            if (closeSource) closeSource();
            throw new Error("No se pudo leer el tamaño de la imagen");
        }

        const maxSide = 1800;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const outWidth = Math.max(1, Math.round(width * scale));
        const outHeight = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = outWidth;
        canvas.height = outHeight;
        const context = canvas.getContext("2d");
        if (!context) {
            if (closeSource) closeSource();
            throw new Error("No se pudo preparar la imagen");
        }
        context.drawImage(source, 0, 0, outWidth, outHeight);
        if (closeSource) closeSource();

        let blob;
        try {
            blob = await canvasToBlob(canvas, "image/webp", 0.86);
        } catch (error) {
            blob = await canvasToBlob(canvas, "image/jpeg", 0.88);
        }

        const outputType = blob.type === "image/webp" ? "image/webp" : "image/jpeg";
        const baseName = String(file.name || "imagen").replace(/\.[^.]+$/, "");
        const extension = outputType === "image/webp" ? ".webp" : ".jpg";
        return new File([blob], baseName + extension, {
            type: outputType,
            lastModified: Date.now()
        });
    }

    function setFiles(input, files) {
        if (typeof DataTransfer !== "undefined") {
            const transfer = new DataTransfer();
            files.forEach(function (file) {
                transfer.items.add(file);
            });
            input.files = transfer.files;
            return true;
        }

        try {
            Object.defineProperty(input, "files", {
                configurable: true,
                value: files
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    function showStatus(message, error) {
        const status = document.getElementById("draftStatus");
        if (!status) return;
        status.textContent = message;
        if (error) status.setAttribute("data-state", "error");
    }

    async function intercept(event) {
        const input = event.target;
        if (!input || input.id !== INPUT_ID || redispatching) return;

        const files = Array.from(input.files || []);
        if (!files.length) return;

        const needsFix = files.some(function (file) {
            return !SUPPORTED.test(normalizedMime(file));
        });

        if (!needsFix) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        showStatus("Leyendo tus imágenes…", false);

        try {
            const converted = [];
            for (let i = 0; i < files.length; i += 1) {
                converted.push(await convertReadableImage(files[i]));
            }

            if (!setFiles(input, converted)) {
                throw new Error("No se pudo preparar la selección de imágenes");
            }

            redispatching = true;
            input.dispatchEvent(new Event("change", { bubbles: true }));
            redispatching = false;
        } catch (error) {
            redispatching = false;
            input.value = "";
            showStatus((error && error.message) || "No se pudo leer la imagen", true);
        }
    }

    function start() {
        const input = document.getElementById(INPUT_ID);
        if (!input) return;
        input.setAttribute("accept", "image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.heic,.heif");
        input.addEventListener("change", intercept, true);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
