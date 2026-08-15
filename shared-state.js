(function () {
    "use strict";

    const RED_THEME = {
        background: "#ff0006",
        surface: "#fe0104",
        text: "#fff4f4",
        accent: "#d94962"
    };

    const HAPPY_BIRTHDAY_THEME = {
        background: "#170713",
        surface: "#291022",
        text: "#fff1fb",
        accent: "#e756bd"
    };

    const YOU_SAVE_ME_THEME = {
        background: "#aeaeb3",
        surface: "#aeaeb3",
        text: "#ffffff",
        accent: "#aeaeb3"
    };

    const OVERRIDES_KEY = "amino-blog-overrides-v2";

    function readOverrides() {
        try {
            const raw = localStorage.getItem(OVERRIDES_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" && !Array.isArray(parsed)
                ? parsed
                : {};
        } catch (error) {
            return {};
        }
    }

    function saveOverrides(value) {
        try {
            localStorage.setItem(OVERRIDES_KEY, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;
        }
    }

    function keepFixedThemes() {
        const overrides = readOverrides();

        overrides["you-are-my-reality"] = Object.assign(
            {}, overrides["you-are-my-reality"] || {},
            { theme: RED_THEME, contentVersion: 2 }
        );

        overrides["my-world-with-you"] = Object.assign(
            {}, overrides["my-world-with-you"] || {},
            { theme: RED_THEME, contentVersion: 2 }
        );

        overrides["happy-birthday-my-love"] = Object.assign(
            {}, overrides["happy-birthday-my-love"] || {},
            { theme: HAPPY_BIRTHDAY_THEME, contentVersion: 2 }
        );

        /* Mantiene contenido/portada/bloques y solo fija el tema de You Save Me. */
        overrides["you-save-me"] = Object.assign(
            {}, overrides["you-save-me"] || {},
            { theme: YOU_SAVE_ME_THEME, contentVersion: 1 }
        );

        saveOverrides(overrides);
    }

    keepFixedThemes();

    async function b64Image(path, fallback) {
        if (!path) return fallback;
        try {
            const response = await fetch(path, { cache: "no-store" });
            if (!response.ok) throw new Error("image data not found");
            const text = (await response.text()).trim();
            return text ? "data:image/webp;base64," + text : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function findBlog(id) {
        if (typeof blogsData === "undefined" || !Array.isArray(blogsData)) return null;
        return blogsData.find(function (item) {
            return item && item.id === id;
        }) || null;
    }

    function insertImageAfterText(blog, banner) {
        if (!blog || !Array.isArray(blog.blocks)) return;

        const existing = blog.blocks.find(function (block) {
            return block && block.id === banner.id;
        });

        if (existing) {
            existing.src = banner.src;
            existing.alt = banner.alt;
            existing.layout = banner.layout || "banner";
            return;
        }

        const imageBlock = {
            id: banner.id,
            type: "image",
            src: banner.src,
            alt: banner.alt,
            layout: banner.layout || "banner"
        };

        const index = blog.blocks.findIndex(function (block) {
            return block &&
                typeof block.text === "string" &&
                block.text.indexOf(banner.after) >= 0;
        });

        if (index >= 0) blog.blocks.splice(index + 1, 0, imageBlock);
        else blog.blocks.push(imageBlock);
    }

    /*
     * IMPORTANTE:
     * El gris de You Save Me se aplica SOLO al lector abierto y a la vista previa.
     * No toca .managed-blog-card, así que la tarjeta del perfil conserva su diseño.
     */
    function installYouSaveMeReaderTheme() {
        if (document.getElementById("youSaveMeReaderTheme")) return;

        const style = document.createElement("style");
        style.id = "youSaveMeReaderTheme";
        style.textContent = `
            .modal-blog[data-blog-id="you-save-me"],
            .editor-preview-card[data-blog-id="you-save-me"] {
                --blog-bg: #aeaeb3 !important;
                --blog-surface: #aeaeb3 !important;
                --blog-text: #ffffff !important;
                --blog-accent: #aeaeb3 !important;
                background: #aeaeb3 !important;
                background-color: #aeaeb3 !important;
            }

            .modal-blog[data-blog-id="you-save-me"] .amino-reader-header,
            .modal-blog[data-blog-id="you-save-me"] .amino-reader-author,
            .modal-blog[data-blog-id="you-save-me"] .amino-reader-body,
            .modal-blog[data-blog-id="you-save-me"] .amino-reader-content,
            .modal-blog[data-blog-id="you-save-me"] .blog-modal-body,
            .modal-blog[data-blog-id="you-save-me"] .blog-modal-header,
            .modal-blog[data-blog-id="you-save-me"] .blog-modal-meta,
            .modal-blog[data-blog-id="you-save-me"] .amino-content-paragraph,
            .modal-blog[data-blog-id="you-save-me"] .amino-content-heading,
            .modal-blog[data-blog-id="you-save-me"] .amino-content-quote,
            .modal-blog[data-blog-id="you-save-me"] .amino-content-divider,
            .modal-blog[data-blog-id="you-save-me"] .amino-content-banner,
            .modal-blog[data-blog-id="you-save-me"] .amino-content-image-free,
            .modal-blog[data-blog-id="you-save-me"] .blog-modal-comments,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-reader-body,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-paragraph,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-heading,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-quote,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-divider,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-banner,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-image-free {
                background: #aeaeb3 !important;
                background-color: #aeaeb3 !important;
                box-shadow: none !important;
            }

            .modal-blog[data-blog-id="you-save-me"] .amino-content-paragraph,
            .modal-blog[data-blog-id="you-save-me"] .amino-content-heading,
            .modal-blog[data-blog-id="you-save-me"] .amino-content-quote,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-paragraph,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-heading,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-quote {
                color: #ffffff !important;
                border-color: #aeaeb3 !important;
            }

            /* Banners intactos: no filtro, no opacidad, no recolor. */
            .modal-blog[data-blog-id="you-save-me"] img,
            .editor-preview-card[data-blog-id="you-save-me"] img {
                filter: none !important;
                opacity: 1 !important;
            }
        `;
        document.head.appendChild(style);
    }

    installYouSaveMeReaderTheme();

    function forceSaveMeEditorColors() {
        const titleInput = document.getElementById("newPostTitle");
        if (!titleInput || titleInput.value.trim().toLowerCase() !== "you save me") {
            return false;
        }

        const values = [
            ["blogBackgroundColor", "#aeaeb3"],
            ["blogSurfaceColor", "#aeaeb3"],
            ["blogTextColor", "#ffffff"],
            ["blogAccentColor", "#aeaeb3"]
        ];

        values.forEach(function (entry) {
            const input = document.getElementById(entry[0]);
            if (!input) return;
            input.value = entry[1];
            /* Actualiza editorState dentro de blog-editor.js antes de persistEditor(). */
            input.dispatchEvent(new Event("input", { bubbles: true }));
        });

        return true;
    }

    /*
     * Se ejecuta en capture: ocurre ANTES del listener de Guardar de blog-editor.js.
     * Así el payload ya sale con #AEAEB3 y no se corrige tarde.
     */
    document.addEventListener("click", function (event) {
        const button = event.target && event.target.closest
            ? event.target.closest("#publishPost")
            : null;
        if (!button) return;

        const isSaveMe = forceSaveMeEditorColors();
        if (!isSaveMe) return;

        /* Respaldo después del guardado, sin alterar textos ni bloques. */
        setTimeout(keepFixedThemes, 0);
        setTimeout(keepFixedThemes, 150);
    }, true);

    async function installBlogExtras() {
        const realityBlog = findBlog("you-are-my-reality");

        if (realityBlog && Array.isArray(realityBlog.blocks)) {
            const realityBanners = [
                {
                    id: "reality-extra-miffy",
                    src: "img/reality-banner-miffy.svg",
                    b64: "img/reality-banner-miffy.b64",
                    alt: "Conejito asomándose sobre fondo rojo",
                    after: "felicidad silenciosa"
                },
                {
                    id: "reality-extra-couple",
                    src: "img/reality-banner-couple.svg",
                    alt: "Pareja mirándose en un banner rojo y blanco",
                    after: "lo cotidiano en algo que deseo cuidar"
                },
                {
                    id: "reality-extra-snoopy",
                    src: "img/reality-banner-snoopy.svg",
                    b64: "img/reality-banner-snoopy.b64",
                    alt: "Snoopy sobre fondo rojo",
                    after: "seguir creciendo con paciencia"
                },
                {
                    id: "reality-extra-snoopy-reading",
                    src: "img/reality-banner-snoopy-reading.svg",
                    b64: "img/reality-banner-snoopy-reading.b64",
                    alt: "Snoopy leyendo el periódico sobre fondo rojo",
                    after: "volvemos por voluntad"
                },
                {
                    id: "reality-extra-winter",
                    src: "img/reality-banner-winter.svg",
                    alt: "Pareja con bufandas en tonos rojos",
                    after: "seguir eligiéndonos desde la libertad"
                },
                {
                    id: "reality-extra-love",
                    src: "img/reality-banner-love.svg",
                    alt: "Banner rojo con estrellas y el texto japonés 愛してる",
                    after: "Tú eres mi realidad"
                }
            ];

            for (const banner of realityBanners) {
                banner.src = await b64Image(banner.b64, banner.src);
                banner.layout = "free";
                insertImageAfterText(realityBlog, banner);
            }
        }

        const saveMeBlog = findBlog("you-save-me");
        if (saveMeBlog && Array.isArray(saveMeBlog.blocks)) {
            const saveMeBanners = [
                {
                    id: "save-me-banner-1",
                    src: "img/banner1 saveme.png",
                    alt: "Banner 1 de You Save Me",
                    after: "atravesarlos sintiéndome completamente sola"
                },
                {
                    id: "save-me-banner-2",
                    src: "img/banner 2 saveme.png",
                    alt: "Banner 2 de You Save Me",
                    after: "merecía sentirme así"
                },
                {
                    id: "save-me-banner-3",
                    src: "img/banner3 saveme.png",
                    alt: "Banner 3 de You Save Me",
                    after: "mis ojos recordaron cómo encontrar la luz"
                },
                {
                    id: "save-me-banner-4",
                    src: "img/Banner 4 sabeme.png",
                    alt: "Banner 4 de You Save Me",
                    after: "una disculpa consciente sobre el silencio"
                },
                {
                    id: "save-me-banner-5",
                    src: "img/banner 5 de saveme.png",
                    alt: "Banner 5 de You Save Me",
                    after: "Me salvaste de la idea de que debía salvarme a solas"
                }
            ];

            saveMeBanners.forEach(function (banner) {
                banner.layout = "free";
                insertImageAfterText(saveMeBlog, banner);
            });

            saveMeBlog.theme = Object.assign({}, YOU_SAVE_ME_THEME);
        }
    }

    if (document.readyState === "complete") {
        installBlogExtras();
    } else {
        window.addEventListener("load", installBlogExtras, { once: true });
    }

    if (String(location.hash || "").indexOf("#amino-share=") === 0) {
        history.replaceState(history.state, "", location.pathname + location.search);
    }
})();