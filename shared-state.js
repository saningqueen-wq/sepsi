(function () {
    "use strict";

    const OVERRIDES_KEY = "amino-blog-overrides-v2";
    const DRAFTS_KEY = "amino-blog-drafts-v2";

    const FIXED_THEMES = {
        "you-are-my-reality": {
            background: "#ff0006",
            surface: "#fe0104",
            text: "#fff4f4",
            accent: "#d94962"
        },
        "my-world-with-you": {
            background: "#ff0006",
            surface: "#fe0104",
            text: "#fff4f4",
            accent: "#d94962"
        },
        "happy-birthday-my-love": {
            background: "#170713",
            surface: "#291022",
            text: "#fff1fb",
            accent: "#e756bd"
        },
        "you-save-me": {
            background: "#aeaeb3",
            surface: "#aeaeb3",
            text: "#ffffff",
            accent: "#aeaeb3"
        }
    };

    const CONTENT_VERSIONS = {
        "you-are-my-reality": 2,
        "my-world-with-you": 2,
        "happy-birthday-my-love": 2,
        "you-save-me": 1
    };

    const nativeSetItem = Storage.prototype.setItem;

    function cloneTheme(theme) {
        return {
            background: theme.background,
            surface: theme.surface,
            text: theme.text,
            accent: theme.accent
        };
    }

    function parseObject(raw) {
        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" && !Array.isArray(parsed)
                ? parsed
                : null;
        } catch (error) {
            return null;
        }
    }

    function fixOverridesObject(overrides) {
        if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
            overrides = {};
        }

        Object.keys(FIXED_THEMES).forEach(function (blogId) {
            const previous = overrides[blogId] &&
                typeof overrides[blogId] === "object" &&
                !Array.isArray(overrides[blogId])
                ? overrides[blogId]
                : {};

            overrides[blogId] = Object.assign({}, previous, {
                theme: cloneTheme(FIXED_THEMES[blogId]),
                contentVersion: CONTENT_VERSIONS[blogId]
            });
        });

        return overrides;
    }

    function fixDraftsObject(drafts) {
        if (!drafts || typeof drafts !== "object" || Array.isArray(drafts)) {
            return drafts;
        }

        Object.keys(drafts).forEach(function (target) {
            const entry = drafts[target];
            if (!entry || !entry.state || typeof entry.state !== "object") return;

            const blogId = entry.state.id;
            if (!FIXED_THEMES[blogId]) return;

            entry.state.theme = cloneTheme(FIXED_THEMES[blogId]);
            entry.state.contentVersion = CONTENT_VERSIONS[blogId];
        });

        return drafts;
    }

    function sanitizeExistingStorage() {
        try {
            const raw = localStorage.getItem(OVERRIDES_KEY);
            const overrides = raw ? parseObject(raw) : {};
            if (overrides !== null) {
                nativeSetItem.call(
                    localStorage,
                    OVERRIDES_KEY,
                    JSON.stringify(fixOverridesObject(overrides))
                );
            }

            const draftRaw = localStorage.getItem(DRAFTS_KEY);
            const drafts = draftRaw ? parseObject(draftRaw) : null;
            if (drafts) {
                nativeSetItem.call(
                    localStorage,
                    DRAFTS_KEY,
                    JSON.stringify(fixDraftsObject(drafts))
                );
            }
        } catch (error) {
            // El editor mostrará su aviso normal si el navegador bloquea localStorage.
        }
    }

    /*
     * Un solo punto de guardado:
     * cualquier escritura del editor en overrides o borradores conserva los temas fijos.
     * Texto, portada, orden e imágenes no se alteran.
     */
    function installStorageGuard() {
        if (Storage.prototype.__aminoThemeGuardInstalled) return;

        Storage.prototype.setItem = function (key, value) {
            let nextValue = value;

            if (this === localStorage && key === OVERRIDES_KEY) {
                const parsed = parseObject(String(value));
                if (parsed) {
                    nextValue = JSON.stringify(fixOverridesObject(parsed));
                }
            } else if (this === localStorage && key === DRAFTS_KEY) {
                const parsed = parseObject(String(value));
                if (parsed) {
                    nextValue = JSON.stringify(fixDraftsObject(parsed));
                }
            }

            return nativeSetItem.call(this, key, nextValue);
        };

        Object.defineProperty(Storage.prototype, "__aminoThemeGuardInstalled", {
            value: true,
            configurable: true
        });
    }

    sanitizeExistingStorage();
    installStorageGuard();

    function fixedThemeFor(blogId) {
        return FIXED_THEMES[blogId] || null;
    }

    function applyThemeVars(element, blogId) {
        const theme = fixedThemeFor(blogId);
        if (!element || !theme) return;

        element.style.setProperty("--blog-bg", theme.background);
        element.style.setProperty("--blog-surface", theme.surface);
        element.style.setProperty("--blog-text", theme.text);
        element.style.setProperty("--blog-accent", theme.accent);
    }

    function enforceThemesInData() {
        if (typeof blogsData === "undefined" || !Array.isArray(blogsData)) return;

        blogsData.forEach(function (blog) {
            if (blog && FIXED_THEMES[blog.id]) {
                blog.theme = cloneTheme(FIXED_THEMES[blog.id]);
                blog.contentVersion = CONTENT_VERSIONS[blog.id];
            }
        });
    }

    let activeEditorBlogId = null;

    const themeInputMap = {
        blogBackgroundColor: "background",
        blogSurfaceColor: "surface",
        blogTextColor: "text",
        blogAccentColor: "accent"
    };

    function forceThemeIntoEditor(blogId) {
        const theme = fixedThemeFor(blogId);
        if (!theme) return;

        Object.keys(themeInputMap).forEach(function (inputId) {
            const input = document.getElementById(inputId);
            const field = themeInputMap[inputId];
            if (!input) return;

            if (input.value.toLowerCase() !== theme[field]) {
                input.value = theme[field];
                input.dispatchEvent(new Event("input", { bubbles: true }));
            }
        });

        const preview = document.querySelector(".editor-preview-card");
        if (preview) applyThemeVars(preview, blogId);
    }

    function readerBlogId() {
        const reader = document.querySelector("#blogModal .modal-blog");
        return reader ? reader.getAttribute("data-blog-id") : "";
    }

    /*
     * Captura la navegación del editor para saber exactamente qué blog se está editando.
     * Antes de Guardar se sincronizan los cuatro inputs, de modo que persistEditor()
     * recibe ya el tema correcto y también actualiza el blog en memoria correctamente.
     */
    document.addEventListener("click", function (event) {
        const target = event.target;

        const feedEdit = target.closest &&
            target.closest(".managed-blog-card [data-feed-action='edit']");
        if (feedEdit) {
            const card = feedEdit.closest(".managed-blog-card");
            activeEditorBlogId = card ? card.dataset.blogId : null;
            setTimeout(function () {
                forceThemeIntoEditor(activeEditorBlogId);
            }, 0);
            return;
        }

        if (target.closest && target.closest("#blogEditBtn")) {
            activeEditorBlogId = readerBlogId() || null;
            setTimeout(function () {
                forceThemeIntoEditor(activeEditorBlogId);
            }, 0);
            return;
        }

        if (target.closest && target.closest("#createPost")) {
            activeEditorBlogId = null;
            return;
        }

        if (target.closest && target.closest("[data-blog-theme-preset]") &&
            fixedThemeFor(activeEditorBlogId)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            forceThemeIntoEditor(activeEditorBlogId);
            const status = document.getElementById("draftStatus");
            if (status) {
                status.textContent = "Este blog usa un tema fijo";
                status.dataset.state = "saved";
            }
            return;
        }

        if (target.closest && target.closest("#publishPost") &&
            fixedThemeFor(activeEditorBlogId)) {
            forceThemeIntoEditor(activeEditorBlogId);
        }
    }, true);

    /*
     * Si el usuario intenta mover un selector de color en un blog con tema fijo,
     * el mismo evento que recibe blog-editor.js ya lleva el valor correcto.
     */
    document.addEventListener("input", function (event) {
        const field = themeInputMap[event.target && event.target.id];
        const theme = fixedThemeFor(activeEditorBlogId);
        if (!field || !theme) return;

        if (event.target.value.toLowerCase() !== theme[field]) {
            event.target.value = theme[field];
        }
    }, true);

    function installScopedThemeCss() {
        if (document.getElementById("fixedBlogThemeCss")) return;

        const style = document.createElement("style");
        style.id = "fixedBlogThemeCss";
        style.textContent = `
            /* Solo lector y vista previa. Las tarjetas del perfil NO se tematizan. */
            #blogModal .modal-blog[data-blog-id="you-save-me"],
            #blogModal .modal-blog[data-blog-id="you-save-me"] .amino-reader-header,
            #blogModal .modal-blog[data-blog-id="you-save-me"] .amino-reader-author,
            #blogModal .modal-blog[data-blog-id="you-save-me"] .amino-reader-body,
            #blogModal .modal-blog[data-blog-id="you-save-me"] .blog-modal-comments,
            .editor-preview-card[data-blog-id="you-save-me"],
            .editor-preview-card[data-blog-id="you-save-me"] .amino-reader-body {
                background: #aeaeb3 !important;
                background-color: #aeaeb3 !important;
            }

            #blogModal .modal-blog[data-blog-id="you-save-me"] .amino-content-paragraph,
            #blogModal .modal-blog[data-blog-id="you-save-me"] .amino-content-heading,
            #blogModal .modal-blog[data-blog-id="you-save-me"] .amino-content-quote,
            #blogModal .modal-blog[data-blog-id="you-save-me"] .amino-content-divider,
            #blogModal .modal-blog[data-blog-id="you-save-me"] .amino-content-banner.amino-content-image-free,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-paragraph,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-heading,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-quote,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-divider,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-banner.amino-content-image-free {
                background: #aeaeb3 !important;
                background-color: #aeaeb3 !important;
                box-shadow: none !important;
            }

            #blogModal .modal-blog[data-blog-id="you-save-me"] .amino-content-paragraph,
            #blogModal .modal-blog[data-blog-id="you-save-me"] .amino-content-heading,
            #blogModal .modal-blog[data-blog-id="you-save-me"] .amino-content-quote,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-paragraph,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-heading,
            .editor-preview-card[data-blog-id="you-save-me"] .amino-content-quote {
                color: #ffffff !important;
                border-color: #aeaeb3 !important;
            }
        `;
        document.head.appendChild(style);
    }

    installScopedThemeCss();

    /*
     * Observador limitado al lector y a la vista previa.
     * No observa el feed ni reescribe estilos de las tarjetas.
     */
    function refreshVisibleFixedThemes() {
        const reader = document.querySelector("#blogModal .modal-blog");
        if (reader) applyThemeVars(reader, reader.getAttribute("data-blog-id"));

        const preview = document.querySelector(".editor-preview-card");
        if (preview) applyThemeVars(preview, preview.getAttribute("data-blog-id"));
    }

    const reader = document.querySelector("#blogModal .modal-blog");
    const preview = document.querySelector(".editor-preview-card");
    const visibleObserver = new MutationObserver(refreshVisibleFixedThemes);

    if (reader) {
        visibleObserver.observe(reader, {
            attributes: true,
            attributeFilter: ["data-blog-id", "style"],
            childList: true,
            subtree: true
        });
    }
    if (preview) {
        visibleObserver.observe(preview, {
            attributes: true,
            attributeFilter: ["data-blog-id", "style"],
            childList: true,
            subtree: true
        });
    }

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
            existing.layout = "free";
            return;
        }

        const imageBlock = {
            id: banner.id,
            type: "image",
            src: banner.src,
            alt: banner.alt,
            layout: "free"
        };

        const index = blog.blocks.findIndex(function (block) {
            return block &&
                typeof block.text === "string" &&
                block.text.indexOf(banner.after) >= 0;
        });

        if (index >= 0) blog.blocks.splice(index + 1, 0, imageBlock);
        else blog.blocks.push(imageBlock);
    }

    async function installBlogExtras() {
        enforceThemesInData();

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
                insertImageAfterText(realityBlog, banner);
            }
        }

        const saveMeBlog = findBlog("you-save-me");
        if (saveMeBlog && Array.isArray(saveMeBlog.blocks)) {
            [
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
            ].forEach(function (banner) {
                insertImageAfterText(saveMeBlog, banner);
            });
        }

        enforceThemesInData();
        refreshVisibleFixedThemes();
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
