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
        background: "#2f2f31",
        surface: "#515156",
        text: "#f7f7f8",
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

    function hexToRgb(hex) {
        const value = String(hex || "").replace("#", "");
        if (!/^[0-9a-f]{6}$/i.test(value)) return { r: 47, g: 47, b: 49 };
        return {
            r: parseInt(value.slice(0, 2), 16),
            g: parseInt(value.slice(2, 4), 16),
            b: parseInt(value.slice(4, 6), 16)
        };
    }

    function recolorSaveMeBanner(src) {
        return new Promise(function (resolve) {
            const image = new Image();

            image.onload = function () {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = image.naturalWidth || image.width;
                    canvas.height = image.naturalHeight || image.height;
                    const context = canvas.getContext("2d", { willReadFrequently: true });
                    if (!context || !canvas.width || !canvas.height) {
                        resolve(src);
                        return;
                    }

                    context.drawImage(image, 0, 0);
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const pixels = imageData.data;
                    const target = hexToRgb(YOU_SAVE_ME_THEME.background);

                    // Los banners de Save Me tienen un fondo RGB(174,174,179).
                    // Se cambia solo ese gris (y sus pequeñas variaciones por compresión)
                    // para conservar intactos personajes, textos y fotografías.
                    for (let index = 0; index < pixels.length; index += 4) {
                        const r = pixels[index];
                        const g = pixels[index + 1];
                        const b = pixels[index + 2];
                        const alpha = pixels[index + 3];
                        if (alpha < 20) continue;

                        const closeToOriginalGray =
                            Math.abs(r - 174) <= 14 &&
                            Math.abs(g - 174) <= 14 &&
                            Math.abs(b - 179) <= 14;

                        const neutralGray =
                            Math.max(r, g, b) - Math.min(r, g, b) <= 9 &&
                            r >= 164 && r <= 184 &&
                            g >= 164 && g <= 184 &&
                            b >= 164 && b <= 189;

                        if (closeToOriginalGray || neutralGray) {
                            pixels[index] = target.r;
                            pixels[index + 1] = target.g;
                            pixels[index + 2] = target.b;
                        }
                    }

                    context.putImageData(imageData, 0, 0);
                    resolve(canvas.toDataURL("image/png"));
                } catch (error) {
                    resolve(src);
                }
            };

            image.onerror = function () {
                resolve(src);
            };

            image.src = src;
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

    installYouSaveMeBackgroundFix();

    window.addEventListener("load", async function () {
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

            for (const banner of saveMeBanners) {
                banner.src = await recolorSaveMeBanner(banner.src);
                banner.layout = "free";
                insertImageAfterText(saveMeBlog, banner);
            }

            applySaveMeTheme(saveMeBlog);
        }
    });

    if (String(location.hash || "").indexOf("#amino-share=") === 0) {
        history.replaceState(history.state, "", location.pathname + location.search);
    }
})();
