(function () {
    "use strict";

    const STORAGE_KEY = "amino-bio-photos-v1";
    const rowSelector = "#bioModal .bio-img-row";
    let activeImage = null;

    function readSaved() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(value) ? value : [];
        } catch (error) {
            return [];
        }
    }

    function savePhotos() {
        const row = document.querySelector(rowSelector);
        if (!row) return;
        const photos = Array.from(row.querySelectorAll("img")).map(function (img) {
            return img.src || "";
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    }

    function loadPhotos() {
        const row = document.querySelector(rowSelector);
        if (!row) return;
        const saved = readSaved();
        row.querySelectorAll("img").forEach(function (img, index) {
            if (saved[index]) {
                img.src = saved[index];
                img.onerror = null;
            }
        });
    }

    function compressImage(file) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = function () {
                const image = new Image();
                image.onerror = reject;
                image.onload = function () {
                    const maxSide = 900;
                    let width = image.naturalWidth || image.width;
                    let height = image.naturalHeight || image.height;
                    const scale = Math.min(1, maxSide / Math.max(width, height));
                    width = Math.max(1, Math.round(width * scale));
                    height = Math.max(1, Math.round(height * scale));

                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const context = canvas.getContext("2d");
                    context.drawImage(image, 0, 0, width, height);

                    let result;
                    try {
                        result = canvas.toDataURL("image/webp", 0.86);
                        if (!result || result.indexOf("data:image/webp") !== 0) {
                            result = canvas.toDataURL("image/jpeg", 0.88);
                        }
                    } catch (error) {
                        result = reader.result;
                    }
                    resolve(result);
                };
                image.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function editingEnabled() {
        const button = document.getElementById("bioEditBtn");
        return !!button && (button.classList.contains("editing") || /guardar/i.test(button.textContent || ""));
    }

    function syncEditingClass() {
        const row = document.querySelector(rowSelector);
        if (!row) return;
        row.classList.toggle("bio-photo-editing", editingEnabled());
    }

    function ensurePicker() {
        let picker = document.getElementById("bioPhotoPicker");
        if (picker) return picker;

        picker = document.createElement("input");
        picker.type = "file";
        picker.id = "bioPhotoPicker";
        picker.accept = "image/*";
        picker.hidden = true;
        document.body.appendChild(picker);

        picker.addEventListener("change", async function () {
            const file = picker.files && picker.files[0];
            if (!file || !activeImage) return;

            try {
                const src = await compressImage(file);
                activeImage.src = src;
                activeImage.onerror = null;
                savePhotos();
            } catch (error) {
                console.warn("No se pudo cambiar la foto de la biografía", error);
            } finally {
                picker.value = "";
                activeImage = null;
            }
        });

        return picker;
    }

    function installStyles() {
        if (document.getElementById("bio-photo-editor-styles")) return;
        const style = document.createElement("style");
        style.id = "bio-photo-editor-styles";
        style.textContent = `
            #bioModal .bio-img-row {
                position: relative;
            }

            #bioModal .bio-img-row img {
                transition: transform .18s ease, outline-color .18s ease, opacity .18s ease;
            }

            #bioModal .bio-img-row.bio-photo-editing img {
                cursor: pointer;
                outline: 2px dashed rgba(255,255,255,.55);
                outline-offset: 3px;
            }

            #bioModal .bio-img-row.bio-photo-editing img:hover {
                transform: translateY(-2px) scale(1.025);
                outline-color: rgba(255,255,255,.9);
            }

            #bioModal .bio-img-row.bio-photo-editing::after {
                content: "Toca una foto para cambiarla";
                display: block;
                width: max-content;
                max-width: calc(100% - 24px);
                margin: 10px auto 0;
                padding: 5px 10px;
                border-radius: 999px;
                background: #080808;
                color: #fff;
                font-size: 11px;
                line-height: 1.2;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }

    function start() {
        const row = document.querySelector(rowSelector);
        const editButton = document.getElementById("bioEditBtn");
        if (!row || !editButton) return;

        installStyles();
        loadPhotos();
        const picker = ensurePicker();

        row.querySelectorAll("img").forEach(function (img) {
            img.addEventListener("click", function (event) {
                if (!editingEnabled()) return;
                event.preventDefault();
                event.stopPropagation();
                activeImage = img;
                picker.click();
            });
        });

        editButton.addEventListener("click", function () {
            setTimeout(syncEditingClass, 0);
        });

        syncEditingClass();
        window.addEventListener("amino-cloud-ready", loadPhotos);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
