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
            return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function saveOverrides(value) {
        try {
            localStorage.setItem(OVERRIDES_KEY, JSON.stringify(value));
        } catch (error) {}
    }

    const overrides = readOverrides();

    overrides["you-are-my-reality"] = Object.assign({}, overrides["you-are-my-reality"] || {}, {
        theme: RED_THEME,
        contentVersion: 2
    });

    overrides["my-world-with-you"] = Object.assign({}, overrides["my-world-with-you"] || {}, {
        theme: RED_THEME,
        contentVersion: 2
    });

    overrides["happy-birthday-my-love"] = Object.assign({}, overrides["happy-birthday-my-love"] || {}, {
        theme: HAPPY_BIRTHDAY_THEME,
        contentVersion: 2
    });

    overrides["you-save-me"] = Object.assign({}, overrides["you-save-me"] || {}, {
        theme: YOU_SAVE_ME_THEME,
        contentVersion: 2
    });

    saveOverrides(overrides);

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

    function applySaveMeTheme(blog) {
        if (blog) {
            blog.theme = Object.assign({}, YOU_SAVE_ME_THEME);
        }

        document.querySelectorAll('[data-blog-id="you-save-me"]').forEach(function (element) {
            element.style.setProperty("--blog-bg", YOU_SAVE_ME_THEME.background);
            element.style.setProperty("--blog-surface", YOU_SAVE_ME_THEME.surface);
            element.style.setProperty("--blog-text", YOU_SAVE_ME_THEME.text);
            element.style.setProperty("--blog-accent", YOU_SAVE_ME_THEME.accent);
        });
    }

    function installYouSaveMeBackgroundFix() {
        if (document.getElementById("youSaveMeBackgroundFix")) return;
        const style = document.createElement("style");
        style.id = "youSaveMeBackgroundFix";
        style.textContent = [
            '[data-blog-id="you-save-me"][data-blog-variant="diary"] .amino-content-banner.amino-content-image-free{background:var(--blog-bg)!important;}',
            '[data-blog-id="you-save-me"][data-blog-variant="diary"] .amino-content-banner{background:var(--blog-bg)!important;}',
            '[data-blog-id="you-save-me"][data-blog-variant="diary"] .amino-content-banner.amino-content-image-free{box-shadow:none!important;}'
        ].join("");
        document.head.appendChild(style);
    }

   function installYouSaveMeBackgroundFix() {
    if (document.getElementById("youSaveMeBackgroundFix")) return;

    const style = document.createElement("style");
    style.id = "youSaveMeBackgroundFix";

    style.textContent = `
        [data-blog-id="you-save-me"] {
            --blog-bg: #aeaeb3 !important;
            --blog-surface: #aeaeb3 !important;
            --blog-text: #ffffff !important;
            --blog-accent: #aeaeb3 !important;

            background: #aeaeb3 !important;
        }

        [data-blog-id="you-save-me"] .amino-reader-body,
        [data-blog-id="you-save-me"] .amino-reader-content,
        [data-blog-id="you-save-me"] .amino-content,
        [data-blog-id="you-save-me"] .blog-content {
            background: #aeaeb3 !important;
        }

        [data-blog-id="you-save-me"] .amino-content-paragraph,
        [data-blog-id="you-save-me"] .amino-content-quote,
        [data-blog-id="you-save-me"] .amino-content-heading {
            background: #aeaeb3 !important;
            color: #ffffff !important;
        }

        [data-blog-id="you-save-me"] .amino-content-banner,
        [data-blog-id="you-save-me"] .amino-content-banner.amino-content-image-free {
            background: #aeaeb3 !important;
            box-shadow: none !important;
        }

        /* NO modifica las imágenes */
        [data-blog-id="you-save-me"] .amino-content-banner img {
            filter: none !important;
            opacity: 1 !important;
        }
    `;

    document.head.appendChild(style);
}


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

            applySaveMeTheme(saveMeBlog);
        }
    });

    if (String(location.hash || "").indexOf("#amino-share=") === 0) {
        history.replaceState(history.state, "", location.pathname + location.search);
    }
})();
