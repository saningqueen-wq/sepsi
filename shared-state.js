(function () {
    "use strict";

    // Colores exactos de la captura del editor de "You Are My Reality".
    const RED_THEME = {
        background: "#ff0006",
        surface: "#fe0104",
        text: "#fff4f4",
        accent: "#d94962"
    };

    // Happy Birthday conserva su tema rosa/morado original.
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
        } catch (error) {
            // La página puede seguir funcionando aunque localStorage esté bloqueado.
        }
    }

    const overrides = readOverrides();

    // You Are My Reality: rojo de la captura.
    overrides["you-are-my-reality"] = Object.assign(
        {},
        overrides["you-are-my-reality"] || {},
        {
            theme: RED_THEME,
            contentVersion: 2
        }
    );

    // My World With You: mismo rojo de la captura, sin tocar contenido ni formato.
    overrides["my-world-with-you"] = Object.assign(
        {},
        overrides["my-world-with-you"] || {},
        {
            theme: RED_THEME,
            contentVersion: 2
        }
    );

    // Happy Birthday se mantiene con su tema original.
    overrides["happy-birthday-my-love"] = Object.assign(
        {},
        overrides["happy-birthday-my-love"] || {},
        {
            theme: HAPPY_BIRTHDAY_THEME,
            contentVersion: 2
        }
    );

    saveOverrides(overrides);

    // Añade los seis banners rojos de You Are My Reality una sola vez,
    // después de que blog-editor.js haya preparado los blogs.
    window.addEventListener("load", function () {
        if (typeof blogsData === "undefined" || !Array.isArray(blogsData)) {
            return;
        }

        const blog = blogsData.find(function (item) {
            return item && item.id === "you-are-my-reality";
        });

        if (!blog || !Array.isArray(blog.blocks)) {
            return;
        }

        const banners = [
            {
                id: "reality-extra-miffy",
                src: "img/reality-banner-miffy.svg",
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
                alt: "Snoopy sobre fondo rojo",
                after: "seguir creciendo con paciencia"
            },
            {
                id: "reality-extra-snoopy-reading",
                src: "img/reality-banner-snoopy-reading.svg",
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

        banners.forEach(function (banner) {
            const exists = blog.blocks.some(function (block) {
                return block && block.id === banner.id;
            });

            if (exists) {
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

            if (index >= 0) {
                blog.blocks.splice(index + 1, 0, imageBlock);
            } else {
                blog.blocks.push(imageBlock);
            }
        });
    });

    // No guardamos configuraciones dentro de la URL.
    if (String(location.hash || "").indexOf("#amino-share=") === 0) {
        history.replaceState(
            history.state,
            "",
            location.pathname + location.search
        );
    }
})();
