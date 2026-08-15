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
    const DRAFTS_KEY = "amino-blog-drafts-v2";

    function cloneTheme(theme) {
        return Object.assign({}, theme);
    }

    function readOverrides() {
        try {
            const raw = localStorage.getItem(OVERRIDES_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    /*
     * Muy importante: todo guardado que pase por localStorage también pasa
     * por aquí. Así el editor nunca puede volver a guardar otro tema para
     * You Save Me por accidente.
     */
    const nativeSetItem = Storage.prototype.setItem;

    Storage.prototype.setItem = function (key, value) {
        let finalValue = value;

        if (this === window.localStorage && key === OVERRIDES_KEY) {
            try {
                const parsed = JSON.parse(String(value));
                if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                    parsed["you-save-me"] = Object.assign({}, parsed["you-save-me"] || {}, {
                        theme: cloneTheme(YOU_SAVE_ME_THEME),
                        contentVersion: 1
                    });
                    finalValue = JSON.stringify(parsed);
                }
            } catch (error) {}
        }

        /* También corrige el borrador del editor para que al recuperarlo no
           reaparezca el tema anterior. */
        if (this === window.localStorage && key === DRAFTS_KEY) {
            try {
                const drafts = JSON.parse(String(value));
                if (drafts && typeof drafts === "object" && !Array.isArray(drafts)) {
                    Object.keys(drafts).forEach(function (draftKey) {
                        const draft = drafts[draftKey];
                        const state = draft && draft.state;
                        if (state && state.id === "you-save-me") {
                            state.theme = cloneTheme(YOU_SAVE_ME_THEME);
                            state.contentVersion = 1;
                        }
                    });
                    finalValue = JSON.stringify(drafts);
                }
            } catch (error) {}
        }

        return nativeSetItem.call(this, key, finalValue);
    };

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

        overrides["you-are-my-reality"] = Object.assign({}, overrides["you-are-my-reality"] || {}, {
            theme: cloneTheme(RED_THEME),
            contentVersion: 2
        });

        overrides["my-world-with-you"] = Object.assign({}, overrides["my-world-with-you"] || {}, {
            theme: cloneTheme(RED_THEME),
            contentVersion: 2
        });

        overrides["happy-birthday-my-love"] = Object.assign({}, overrides["happy-birthday-my-love"] || {}, {
            theme: cloneTheme(HAPPY_BIRTHDAY_THEME),
            contentVersion: 2
        });

        overrides["you-save-me"] = Object.assign({}, overrides["you-save-me"] || {}, {
            theme: cloneTheme(YOU_SAVE_ME_THEME),
            contentVersion: 1
        });

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
            return block && typeof block.text === "string" && block.text.indexOf(banner.after) >= 0;
        });

        if (index >= 0) blog.blocks.splice(index + 1, 0, imageBlock);
        else blog.blocks.push(imageBlock);
    }

    function applySaveMeThemeToData(blog) {
        if (blog) {
            blog.theme = cloneTheme(YOU_SAVE_ME_THEME);
            blog.contentVersion = 1;
        }
    }

    function forceYouSaveMeFlatColor() {
        const roots = document.querySelectorAll('[data-blog-id="you-save-me"]');

        roots.forEach(function (root) {
            root.style.setProperty("--blog-bg", "#aeaeb3", "important");
            root.style.setProperty("--blog-surface", "#aeaeb3", "important");
            root.style.setProperty("--blog-text", "#ffffff", "important");
            root.style.setProperty("--blog-accent", "#aeaeb3", "important");
            root.style.setProperty("background", "#aeaeb3", "important");
            root.style.setProperty("background-color", "#aeaeb3", "important");

            const sameGraySelectors = [
                ".amino-reader-header",
                ".amino-reader-author",
                ".amino-reader-body",
                ".amino-reader-content",
                ".blog-modal-body",
                ".blog-modal-header",
                ".blog-modal-meta",
                ".amino-content-paragraph",
                ".amino-content-heading",
                ".amino-content-quote",
                ".amino-content-divider",
                ".amino-content-banner",
                ".amino-content-image-free",
                ".blog-modal-comments"
            ].join(",");

            root.querySelectorAll(sameGraySelectors).forEach(function (element) {
                element.style.setProperty("background", "#aeaeb3", "important");
                element.style.setProperty("background-color", "#aeaeb3", "important");
                element.style.setProperty("box-shadow", "none", "important");
            });

            root.querySelectorAll(
                ".amino-content-paragraph,.amino-content-heading,.amino-content-quote"
            ).forEach(function (element) {
                element.style.setProperty("color", "#ffffff", "important");
                element.style.setProperty("border-color", "#aeaeb3", "important");
            });
        });
    }

    function installYouSaveMeBackgroundFix() {
        if (document.getElementById("youSaveMeBackgroundFix")) return;

        const style = document.createElement("style");
        style.id = "youSaveMeBackgroundFix";
        style.textContent = `
            [data-blog-id="you-save-me"],
            [data-blog-id="you-save-me"] .amino-reader-header,
            [data-blog-id="you-save-me"] .amino-reader-author,
            [data-blog-id="you-save-me"] .amino-reader-body,
            [data-blog-id="you-save-me"] .amino-reader-content,
            [data-blog-id="you-save-me"] .blog-modal-body,
            [data-blog-id="you-save-me"] .blog-modal-header,
            [data-blog-id="you-save-me"] .blog-modal-meta,
            [data-blog-id="you-save-me"] .amino-content-paragraph,
            [data-blog-id="you-save-me"] .amino-content-heading,
            [data-blog-id="you-save-me"] .amino-content-quote,
            [data-blog-id="you-save-me"] .amino-content-divider,
            [data-blog-id="you-save-me"] .amino-content-banner,
            [data-blog-id="you-save-me"] .amino-content-banner.amino-content-image-free,
            [data-blog-id="you-save-me"] .blog-modal-comments {
                background: #aeaeb3 !important;
                background-color: #aeaeb3 !important;
            }

            [data-blog-id="you-save-me"] .amino-content-paragraph,
            [data-blog-id="you-save-me"] .amino-content-heading,
            [data-blog-id="you-save-me"] .amino-content-quote {
                color: #ffffff !important;
                box-shadow: none !important;
            }

            [data-blog-id="you-save-me"] .amino-content-banner,
            [data-blog-id="you-save-me"] .amino-content-banner.amino-content-image-free {
                box-shadow: none !important;
            }

            /* No altera los banners. */
            [data-blog-id="you-save-me"] img {
                filter: none !important;
                opacity: 1 !important;
            }
        `;
        document.head.appendChild(style);
    }

    installYouSaveMeBackgroundFix();

    let forceQueued = false;
    function queueForceYouSaveMe() {
        if (forceQueued) return;
        forceQueued = true;
        requestAnimationFrame(function () {
            forceQueued = false;
            forceYouSaveMeFlatColor();
        });
    }

    const observer = new MutationObserver(queueForceYouSaveMe);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-blog-id", "data-blog-variant", "style", "class"]
    });

    /*
     * Detectamos cuándo el editor abierto corresponde a You Save Me.
     * Antes de que blog-editor.js ejecute su Guardar, enviamos los cuatro
     * colores correctos mediante sus propios eventos input. Así el payload
     * que crea persistEditor ya sale correcto desde origen.
     */
    let editingYouSaveMe = false;

    function forceEditorSaveMeTheme() {
        if (!editingYouSaveMe) return;

        const values = [
            ["blogBackgroundColor", "#aeaeb3"],
            ["blogSurfaceColor", "#aeaeb3"],
            ["blogTextColor", "#ffffff"],
            ["blogAccentColor", "#aeaeb3"]
        ];

        values.forEach(function (entry) {
            const input = document.getElementById(entry[0]);
            if (!input) return;
            if (input.value.toLowerCase() !== entry[1]) {
                input.value = entry[1];
                input.dispatchEvent(new Event("input", { bubbles: true }));
            }
        });
    }

    document.addEventListener("click", function (event) {
        const editCardButton = event.target && event.target.closest
            ? event.target.closest('[data-feed-action="edit"]')
            : null;

        if (editCardButton) {
            const card = editCardButton.closest(".managed-blog-card");
            editingYouSaveMe = Boolean(card && card.dataset.blogId === "you-save-me");
            if (editingYouSaveMe) {
                setTimeout(forceEditorSaveMeTheme, 0);
            }
            return;
        }

        const readerEdit = event.target && event.target.closest
            ? event.target.closest("#blogEditBtn")
            : null;

        if (readerEdit) {
            const readerRoot = document.querySelector('.modal-blog[data-blog-id="you-save-me"]');
            editingYouSaveMe = Boolean(readerRoot);
            if (editingYouSaveMe) {
                setTimeout(forceEditorSaveMeTheme, 0);
            }
            return;
        }

        const saveButton = event.target && event.target.closest
            ? event.target.closest("#publishPost")
            : null;

        if (saveButton && editingYouSaveMe) {
            /* Este evento está en capture: ocurre ANTES del persistEditor. */
            forceEditorSaveMeTheme();

            setTimeout(function () {
                const saveMeBlog = findBlog("you-save-me");
                applySaveMeThemeToData(saveMeBlog);
                keepFixedThemes();
                queueForceYouSaveMe();
            }, 0);

            setTimeout(function () {
                keepFixedThemes();
                queueForceYouSaveMe();
            }, 150);
        }
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

            applySaveMeThemeToData(saveMeBlog);
            keepFixedThemes();
            queueForceYouSaveMe();
        }
    }

    if (document.readyState === "complete") {
        installBlogExtras();
        queueForceYouSaveMe();
    } else {
        window.addEventListener("load", function () {
            installBlogExtras();
            queueForceYouSaveMe();
        }, { once: true });
    }

    if (String(location.hash || "").indexOf("#amino-share=") === 0) {
        history.replaceState(history.state, "", location.pathname + location.search);
    }
})();