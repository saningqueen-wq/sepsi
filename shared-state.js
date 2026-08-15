(function () {
    "use strict";

    // Colores exactos de la captura del editor de "You Are My Reality".
    const YOU_ARE_MY_REALITY_THEME = {
        background: "#ff0006",
        surface: "#fe0104",
        text: "#fff4f4",
        accent: "#d94962"
    };

    // Restauramos Happy Birthday al tema rosa/morado que tenía originalmente.
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

    // Forzamos únicamente el tema de You Are My Reality sin tocar sus textos,
    // imágenes, portada ni formato guardado.
    overrides["you-are-my-reality"] = Object.assign(
        {},
        overrides["you-are-my-reality"] || {},
        {
            theme: YOU_ARE_MY_REALITY_THEME,
            contentVersion: 2
        }
    );

    // Corrige el cambio anterior que había puesto este rojo por error
    // en Happy Birthday, conservando cualquier otro contenido editado.
    overrides["happy-birthday-my-love"] = Object.assign(
        {},
        overrides["happy-birthday-my-love"] || {},
        {
            theme: HAPPY_BIRTHDAY_THEME,
            contentVersion: 2
        }
    );

    saveOverrides(overrides);

    // No guardamos configuraciones dentro de la URL.
    if (String(location.hash || "").indexOf("#amino-share=") === 0) {
        history.replaceState(
            history.state,
            "",
            location.pathname + location.search
        );
    }
})();
