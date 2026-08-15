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

    function clampChannel(value) {
        return Math.max(0, Math.min(255, Math.round(value)));
    }

    function rgbToHex(rgb) {
        return "#" + [rgb.r, rgb.g, rgb.b].map(function (value) {
            return clampChannel(value).toString(16).padStart(2, "0");
        }).join("");
    }

    function mixRgb(source, target, amount) {
        return {
            r: source.r + (target.r - source.r) * amount,
            g: source.g + (target.g - source.g) * amount,
            b: source.b + (target.b - source.b) * amount
        };
    }

    function colorLuminance(rgb) {
        return (rgb.r * 0.2126) + (rgb.g * 0.7152) + (rgb.b * 0.0722);
    }

    function sampleImageColor(src) {
        return new Promise(function (resolve) {
            const image = new Image();

            image.onload = function () {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = 42;
                    canvas.height = 42;
                    const context = canvas.getContext("2d", { willReadFrequently: true });
                    if (!context) {
                        resolve(null);
                        return;
                    }

                    context.drawImage(image, 0, 0, canvas.width, canvas.height);
                    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
                    let red = 0;
                    let green = 0;
                    let blue = 0;
                    let weightTotal = 0;

                    for (let index = 0; index < pixels.length; index += 4) {
                        const alpha = pixels[index + 3];
                        if (alpha < 90) continue;

                        const r = pixels[index];
                        const g = pixels[index + 1];
                        const b = pixels[index + 2];
                        const max = Math.max(r, g, b);
                        const min = Math.min(r, g, b);
                        const brightness = (r + g + b) / 3;

                        if (brightness < 6 || brightness > 250) continue;

                        const chroma = max - min;
                        const weight = 0.25 + Math.min(3, chroma / 55);
                        red += r * weight;
                        green += g * weight;
                        blue += b * weight;
                        weightTotal += weight;
                    }

                    if (!weightTotal) {
                        resolve(null);
                        return;
                    }

                    resolve({
                        r: red / weightTotal,
                        g: green / weightTotal,
                        b: blue / weightTotal,
                        weight: weightTotal
                    });
                } catch (error) {
                    resolve(null);
                }
            };

            image.onerror = function () {
                resolve(null);
            };

            image.src = src;
        });
    }

    async function makeThemeFromImages(paths) {
        const samples = await Promise.all(paths.map(sampleImageColor));
        let red = 0;
        let green = 0;
        let blue = 0;
        let total = 0;

        samples.forEach(function (sample) {
            if (!sample) return;
            const weight = Math.max(1, sample.weight);
            red += sample.r * weight;
            green += sample.g * weight;
            blue += sample.b * weight;
            total += weight;
        });

        if (!total) return null;

        const base = {
            r: red / total,
            g: green / total,
            b: blue / total
        };

        const dark = { r: 0, g: 0, b: 0 };
        const light = { r: 255, g: 255, b: 255 };
        const accentLighten = colorLuminance(base) < 90 ? 0.42 : 0.16;

        return {
            background: rgbToHex(mixRgb(base, dark, 0.70)),
            surface: rgbToHex(mixRgb(base, dark, 0.50)),
            text: "#fffafc",
            accent: rgbToHex(mixRgb(base, light, accentLighten))
        };
    }

    function applyThemeVariables(theme) {
        document.querySelectorAll('[data-blog-id="you-save-me"]').forEach(function (element) {
            element.style.setProperty("--blog-bg", theme.background);
            element.style.setProperty("--blog-surface", theme.surface);
            element.style.setProperty("--blog-text", theme.text);
            element.style.setProperty("--blog-accent", theme.accent);
        });
    }

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

            saveMeBanners.forEach(function (banner) {
                insertImageAfterText(saveMeBlog, banner);
            });

            const theme = await makeThemeFromImages(saveMeBanners.map(function (banner) {
                return banner.src;
            }));

            if (theme) {
                saveMeBlog.theme = theme;

                const currentOverrides = readOverrides();
                currentOverrides["you-save-me"] = Object.assign({}, currentOverrides["you-save-me"] || {}, {
                    theme: theme,
                    contentVersion: 1
                });
                saveOverrides(currentOverrides);
                applyThemeVariables(theme);
            }
        }
    });

    if (String(location.hash || "").indexOf("#amino-share=") === 0) {
        history.replaceState(history.state, "", location.pathname + location.search);
    }
})();
