(function () {
    "use strict";

    // Color rojo fijo, tomado de la configuración que ya tenías guardada
    // en "You Are My Reality".
    const RED_THEME = {
        background: "#630015",
        surface: "#630015",
        text: "#fff5f7",
        accent: "#d94a63"
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
            // Si el navegador bloquea localStorage, el resto de la página sigue funcionando.
        }
    }

    const overrides = readOverrides();

    // Happy Birthday queda siempre con el mismo rojo de You Are My Reality,
    // incluso si antes se había guardado con el tema morado.
    overrides["happy-birthday-my-love"] = Object.assign(
        {},
        overrides["happy-birthday-my-love"] || {},
        {
            theme: RED_THEME,
            contentVersion: 2
        }
    );

    saveOverrides(overrides);

    // Ya no guardamos configuraciones dentro de la URL.
    if (String(location.hash || "").indexOf("#amino-share=") === 0) {
        history.replaceState(
            history.state,
            "",
            location.pathname + location.search
        );
    }
})();
