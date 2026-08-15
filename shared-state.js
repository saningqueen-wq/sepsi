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

    window.addEventListener("load", async function () {
        if (typeof blogsData === "undefined" || !Array.isArray(blogsData)) return;

        const blog = blogsData.find(function (item) {
            return item && item.id === "you-are-my-reality";
        });
        if (!blog || !Array.isArray(blog.blocks)) return;

        const banners = [
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

        for (const banner of banners) {
            const resolvedSrc = await b64Image(banner.b64, banner.src);
            const existing = blog.blocks.find(function (block) {
                return block && block.id === banner.id;
            });

            if (existing) {
                existing.src = resolvedSrc;
                existing.alt = banner.alt;
                continue;
            }

            const imageBlock = {
                id: banner.id,
                type: "image",
                src: resolvedSrc,
                alt: banner.alt,
                layout: "free"
            };

            const index = blog.blocks.findIndex(function (block) {
                return block && typeof block.text === "string" && block.text.indexOf(banner.after) >= 0;
            });

            if (index >= 0) blog.blocks.splice(index + 1, 0, imageBlock);
            else blog.blocks.push(imageBlock);
        }

        document.querySelectorAll('img[src="img/reality-banner-miffy.svg"]').forEach(function (img) {
            const block = blog.blocks.find(function (item) { return item && item.id === "reality-extra-miffy"; });
            if (block) img.src = block.src;
        });
    });

    if (String(location.hash || "").indexOf("#amino-share=") === 0) {
        history.replaceState(history.state, "", location.pathname + location.search);
    }
})();
