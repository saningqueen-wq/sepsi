(function () {
    "use strict";

    const STORAGE_KEY = "amino-blog-overrides-v2";
    const BLOG_ID = "you-save-me";
    const MARKER = "Durante mucho tiempo sentí que avanzaba bajo una tormenta";

    const NEW_BLOCKS = [
        {
            id: "save-me-storm-01",
            type: "paragraph",
            text: "Durante mucho tiempo sentí que avanzaba bajo una tormenta. La lluvia no paraba y cada paso se volvía más pesado; había cosas que me hacían daño, pensamientos que guardaba para mí y un camino frente a mí que, aunque sabía que debía seguir, muchas veces no podía ver con claridad. Entonces llegaste tú. Para mí fue como si un bello ángel apareciera en medio de aquella tormenta con un paraguas y, sin obligarme a correr ni a fingir que estaba bien, simplemente se quedara a mi lado hasta que pude volver a avanzar.",
            format: { bold: false, italic: false, underline: false, strike: false, align: "left" }
        },
        {
            id: "save-me-storm-02",
            type: "paragraph",
            text: "Me sacaste poco a poco de esa tormenta que me estaba haciendo tanto daño. Yo solía dejarme muchas cosas dentro y cargar con ellas en silencio, pero contigo fue diferente. La confianza que te fui dando hizo que empezara a liberarme de todo aquello que llevaba guardado. Contigo me sentía a salvo, podía sentirme yo mismo y no tenía que esconder cada pensamiento por miedo a ser juzgado. Siempre voy a agradecer la forma en que me escuchabas, tu paciencia y todas esas cosas que hacías por mí incluso cuando quizá no sabías cuánto significaban.",
            format: { bold: false, italic: false, underline: false, strike: false, align: "left" }
        },
        {
            id: "save-me-storm-03",
            type: "paragraph",
            text: "Esa fue también una de las razones por las que comenzaste a gustarme tanto y por las que yo quería permanecer a tu lado. No era solamente lo que me decías, sino cómo me hacías sentir: acompañado, comprendido y seguro. En medio de una etapa en la que muchas cosas se sentían pesadas, tú te convertiste en ese espacio donde por fin podía bajar el paraguas un momento y respirar.",
            format: { bold: false, italic: false, underline: false, strike: false, align: "left" }
        },
        {
            id: "save-me-storm-04",
            type: "paragraph",
            text: "Y aunque ninguno de los dos estaba del todo bien, yo también veía tu propia tristeza. Tú te sentías sola y triste en este mundo, y por eso, así como tú me ayudaste a salir de mi tormenta, yo quería hacer lo mismo contigo. Mi tristeza se hacía un poco más pequeña cuando podía estar para ti, porque quería que ambos pudiéramos vivir mejor, sanar y florecer juntos. No quería que solo uno salvara al otro; quería que aprendiéramos a cuidarnos mientras seguíamos caminando, hasta que la lluvia dejara de sentirse tan fuerte para los dos.",
            format: { bold: false, italic: false, underline: false, strike: false, align: "left" }
        },
        {
            id: "save-me-storm-quote",
            type: "quote",
            text: "“Llegaste con un paraguas cuando yo ya me había acostumbrado a la tormenta; después quise aprender a sostenerlo también para ti.”",
            format: { bold: true, italic: true, underline: false, strike: false, align: "center" }
        }
    ];

    function hasMarker(blocks) {
        return Array.isArray(blocks) && blocks.some(function (block) {
            return block && typeof block.text === "string" && block.text.indexOf(MARKER) === 0;
        });
    }

    function insertBlocks(blocks) {
        const source = Array.isArray(blocks) ? blocks.slice() : [];
        if (hasMarker(source)) return source;

        let insertAt = source.length;
        const headingIndex = source.findIndex(function (block) {
            return block && block.type === "heading" && /LA FORMA EN QUE LLEGASTE/i.test(block.text || "");
        });

        if (headingIndex >= 0) {
            const nextHeading = source.findIndex(function (block, index) {
                return index > headingIndex && block && block.type === "heading";
            });
            insertAt = nextHeading >= 0 ? nextHeading : source.length;

            for (let i = headingIndex + 1; i < insertAt; i += 1) {
                if (source[i] && source[i].type === "quote") {
                    insertAt = i;
                    break;
                }
            }
        }

        source.splice.apply(source, [insertAt, 0].concat(NEW_BLOCKS));
        return source;
    }

    function patchStoredState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const overrides = raw ? JSON.parse(raw) : {};
            if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) return false;

            const current = overrides[BLOG_ID] && typeof overrides[BLOG_ID] === "object"
                ? overrides[BLOG_ID]
                : { title: "You Save Me", cover: "img/portada you save me.png", blocks: [] };

            const nextBlocks = insertBlocks(current.blocks);
            if (nextBlocks.length === (Array.isArray(current.blocks) ? current.blocks.length : 0)) return false;

            current.blocks = nextBlocks;
            current.updatedAt = new Date().toISOString();
            current.time = "editado ahora";
            overrides[BLOG_ID] = current;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
            return true;
        } catch (error) {
            return false;
        }
    }

    function patchRuntimeData() {
        try {
            if (typeof blogsData === "undefined" || !Array.isArray(blogsData)) return;
            const blog = blogsData.find(function (item) { return item && item.id === BLOG_ID; });
            if (!blog) return;
            blog.blocks = insertBlocks(blog.blocks);
        } catch (error) {
            // El contenido guardado sigue siendo la fuente principal.
        }
    }

    function run() {
        patchStoredState();
        patchRuntimeData();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", run, { once: true });
    } else {
        run();
    }
})();