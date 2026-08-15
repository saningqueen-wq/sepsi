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

    // No guardamos configuraciones dentro de la URL.
    if (String(location.hash || "").indexOf("#amino-share=") === 0) {
        history.replaceState(
            history.state,
            "",
            location.pathname + location.search
        );
    }
})();
