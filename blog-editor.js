(function () {
    "use strict";

    if (typeof blogsData === "undefined") {
        return;
    }

    const BLOG_OVERRIDES_KEY = "amino-blog-overrides-v2";
    const USER_POSTS_KEY = "amino-posts-v2";
    const LEGACY_USER_POSTS_KEY = "amino-posts";
    const BLOG_DRAFT_KEY = "amino-blog-drafts-v2";
    const BLOG_CONTENT_VERSIONS = {
        "you-are-my-reality": 2,
        "my-serendipity": 2,
        "you-save-me": 1,
        "my-world-with-you": 2,
        "mr-jealous": 4,
        "happy-birthday-my-love": 2
    };
    const AMINO_PAGE_BLOG_IDS = Object.keys(BLOG_CONTENT_VERSIONS);
    const BLOG_LAYOUT_VARIANTS = {
        "you-are-my-reality": "letter",
        "my-serendipity": "timeline",
        "you-save-me": "diary",
        "my-world-with-you": "constellation",
        "mr-jealous": "classic",
        "happy-birthday-my-love": "birthday-card"
    };

    const BLOG_THEME_PRESETS = {
        black: { background: "#000000", surface: "#000000", text: "#ffffff", accent: "#d7dce6" },
        contrast: { background: "#000000", surface: "#212121", text: "#ffffff", accent: "#d7dce6" },
        amino: { background: "#212121", surface: "#292929", text: "#eeeeee", accent: "#c7ccd6" }
    };

    const postsList = document.getElementById("postsList");
    const createPostButton = document.getElementById("createPost");
    const readerModal = document.getElementById("blogModal");
    const readerWindow = readerModal ? readerModal.querySelector(".modal-blog") : null;
    const readerTitle = document.getElementById("blogModalTitle");
    const readerBody = document.getElementById("blogModalBody");
    const readerCover = document.getElementById("blogModalCover");
    const readerLikeCount = document.getElementById("blogModalLikeCount");
    const readerLikeButton = document.getElementById("blogModalLikeBtn");
    const closeReaderButton = document.getElementById("closeBlogModal");
    const editReaderButton = document.getElementById("blogEditBtn");
    const shareReaderButton = document.getElementById("blogShareBtn");

    const editorModal = document.getElementById("postModal");
    const closeEditorButton = document.getElementById("closePostModal");
    const publishEditorButton = document.getElementById("publishPost");
    const previewEditorButton = document.getElementById("previewPost");
    const editorTitleInput = document.getElementById("newPostTitle");
    const editorBlocks = document.getElementById("editorBlocks");
    const editorBlockCount = document.getElementById("editorBlockCount");
    const coverPicker = document.getElementById("coverPicker");
    const bannerPicker = document.getElementById("bannerPicker");
    const editorComposeView = document.getElementById("editorComposeView");
    const editorPreviewView = document.getElementById("editorPreviewView");
    const editorScroll = editorModal.querySelector(".blog-editor-scroll");
    const editorPreviewTitle = document.getElementById("editorPreviewTitle");
    const editorPreviewBody = document.getElementById("editorPreviewBody");
    const editorPreviewCover = document.getElementById("editorPreviewCover");
    const draftStatus = document.getElementById("draftStatus");
    const editorDialogTitle = document.getElementById("editorDialogTitle");
    const editorPreviewCard = editorModal.querySelector(".editor-preview-card");
    const blogBackgroundColor = document.getElementById("blogBackgroundColor");
    const blogSurfaceColor = document.getElementById("blogSurfaceColor");
    const blogTextColor = document.getElementById("blogTextColor");
    const blogAccentColor = document.getElementById("blogAccentColor");
    const addBlogImageButton = document.getElementById("addBlogImage");
    const blogImageUpload = document.getElementById("blogImageUpload");

    if (!postsList || !readerModal || !editorModal || !editorBlocks) {
        return;
    }

    const defaultBlogMeta = [
        {
            id: "you-are-my-reality",
            cover: "img/portada youarerality.png",
            time: "hace 13 días",
            comments: 13
        },
        {
            id: "my-serendipity",
            cover: "img/portadaserenpidia.png",
            time: "hace 20 días",
            comments: 8
        },
        {
            id: "you-save-me",
            cover: "img/portada you save me.png",
            time: "hace 1 mes",
            comments: 5
        },
        {
            id: "my-world-with-you",
            cover: "img/portada my world with you.png",
            time: "hace 1 mes",
            comments: 21
        },
        {
            id: "mr-jealous",
            cover: "img/portada mrjelous.png",
            time: "hace 13 días",
            comments: 34
        }
    ];

    const blockLabels = {
        paragraph: "Texto",
        heading: "Título",
        quote: "Cita",
        divider: "Separador",
        image: "Imagen"
    };

    let userPosts = [];
    let userPostsWritable = true;
    let userPostsWarning = "";
    const initialBlogOverrides = inspectStorage(BLOG_OVERRIDES_KEY);
    const validBlogOverrides = initialBlogOverrides.ok &&
        (!initialBlogOverrides.exists || (
            initialBlogOverrides.value &&
            typeof initialBlogOverrides.value === "object" &&
            !Array.isArray(initialBlogOverrides.value)
        ));
    let blogOverrides = validBlogOverrides && initialBlogOverrides.exists
        ? initialBlogOverrides.value
        : {};
    let blogOverridesWritable = validBlogOverrides;
    let blogOverridesWarning = validBlogOverrides
        ? ""
        : "Las ediciones anteriores de los blogs no se pudieron leer y se conservaron sin sobrescribirlas.";
    let currentReaderRef = null;
    let readerPreviousFocus = null;
    let editorState = null;
    let editorTarget = "new";
    let editorOpen = false;
    let editorShowingPreview = false;
    let editorDirty = false;
    let editorInsertIndex = null;
    let composeScrollTop = 0;
    let previewReturnFocus = null;
    let draftTimer = null;
    let previousFocus = null;

    function inspectStorage(key) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) {
                return { ok: true, exists: false, value: null, raw: null };
            }
            try {
                return { ok: true, exists: true, value: JSON.parse(raw), raw: raw };
            } catch (parseError) {
                return { ok: false, exists: true, value: null, raw: raw, error: parseError };
            }
        } catch (error) {
            return { ok: false, exists: false, value: null, raw: null, error: error };
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;
        }
    }

    function readDraft(target) {
        const result = inspectStorage(BLOG_DRAFT_KEY);
        const drafts = result.ok && result.exists ? result.value : {};
        if (!result.ok || !drafts || typeof drafts !== "object" || Array.isArray(drafts)) {
            return null;
        }
        return drafts[target] || null;
    }

    function removeDraft(target) {
        const result = inspectStorage(BLOG_DRAFT_KEY);
        const drafts = result.ok && result.exists ? result.value : {};
        if (!result.ok || !drafts || typeof drafts !== "object" || Array.isArray(drafts)) {
            return;
        }
        delete drafts[target];
        if (Object.keys(drafts).length) {
            writeStorage(BLOG_DRAFT_KEY, drafts);
        } else {
            try {
                localStorage.removeItem(BLOG_DRAFT_KEY);
            } catch (error) {
                // No afecta a la publicación ya guardada.
            }
        }
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function makeId(prefix) {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return prefix + "-" + window.crypto.randomUUID();
        }
        return prefix + "-" + Date.now() + "-" + Math.random().toString(16).slice(2);
    }

    function makeBlock(type, values) {
        return Object.assign({
            id: makeId("block"),
            type: type
        }, values || {});
    }

    function paragraph(text) {
        return makeBlock("paragraph", { text: text || "" });
    }

    function imageBlock(src, alt, layout) {
        return makeBlock("image", {
            src: src,
            alt: alt || "Decoración del blog",
            layout: layout === "free" ? "free" : "banner"
        });
    }

    function cleanText(text) {
        return String(text || "")
            .replace(/\u00a0/g, " ")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n[ \t]+/g, "\n")
            .trim();
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizeHexColor(value, fallback) {
        const color = String(value || "").trim();
        return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : fallback;
    }

    function defaultBlogTheme(blogId) {
        const preset = blogId === "mr-jealous"
            ? BLOG_THEME_PRESETS.contrast
            : BLOG_THEME_PRESETS.amino;
        return Object.assign({}, preset);
    }

    function requiredContentVersion(blogId) {
        return Number(BLOG_CONTENT_VERSIONS[blogId]) || 0;
    }

    function normalizeBlogTheme(theme, blogId) {
        const fallback = defaultBlogTheme(blogId);
        return {
            background: normalizeHexColor(theme && theme.background, fallback.background),
            surface: normalizeHexColor(theme && theme.surface, fallback.surface),
            text: normalizeHexColor(theme && theme.text, fallback.text),
            accent: normalizeHexColor(theme && theme.accent, fallback.accent)
        };
    }

    function normalizeTextFormat(format) {
        const alignment = format && ["left", "center", "right"].indexOf(format.align) >= 0
            ? format.align
            : "center";
        return {
            bold: Boolean(format && format.bold),
            italic: Boolean(format && format.italic),
            underline: Boolean(format && format.underline),
            strike: Boolean(format && format.strike),
            align: alignment
        };
    }

    function textFormatClasses(block) {
        const format = normalizeTextFormat(block && block.format);
        const classes = ["amino-align-" + format.align];
        if (format.bold) {
            classes.push("amino-text-bold");
        }
        if (format.italic) {
            classes.push("amino-text-italic");
        }
        if (format.underline) {
            classes.push("amino-text-underline");
        }
        if (format.strike) {
            classes.push("amino-text-strike");
        }
        return classes.join(" ");
    }

    function applyBlogTheme(element, theme, blogId) {
        if (!element) {
            return;
        }
        const normalized = normalizeBlogTheme(theme, blogId);
        element.style.setProperty("--blog-bg", normalized.background);
        element.style.setProperty("--blog-surface", normalized.surface);
        element.style.setProperty("--blog-text", normalized.text);
        element.style.setProperty("--blog-accent", normalized.accent);
        element.setAttribute("data-blog-themed", "true");
        element.setAttribute("data-blog-id", blogId || "");
        if (AMINO_PAGE_BLOG_IDS.indexOf(blogId) >= 0) {
            element.setAttribute("data-blog-layout", "amino-page");
        } else {
            element.removeAttribute("data-blog-layout");
        }
        if (BLOG_LAYOUT_VARIANTS[blogId]) {
            element.setAttribute("data-blog-variant", BLOG_LAYOUT_VARIANTS[blogId]);
        } else {
            element.removeAttribute("data-blog-variant");
        }
    }

    function isEmbeddedImage(value) {
        return /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(String(value || ""));
    }

    function safeImageSrc(value, fallback) {
        const src = String(value || "").trim();
        if (/^img\/[^<>]+$/i.test(src) || /^https?:\/\/[^<>\s]+$/i.test(src) || isEmbeddedImage(src)) {
            return src;
        }
        return typeof fallback === "string" ? fallback : "";
    }

    function safeCoverSrc(value) {
        return safeImageSrc(value, "img/portada mrjelous.png");
    }

    function htmlToBlocks(html) {
        const template = document.createElement("template");
        template.innerHTML = String(html || "");
        const blocks = [];

        Array.from(template.content.childNodes).forEach(function (node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const looseText = cleanText(node.textContent);
                if (looseText) {
                    blocks.push(paragraph(looseText));
                }
                return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            const element = node;
            const tag = element.tagName.toLowerCase();
            const nestedImage = tag === "img" ? element : element.querySelector("img");

            if (nestedImage && (tag === "img" || tag === "figure")) {
                const src = safeImageSrc(nestedImage.getAttribute("src"));
                if (src) {
                    blocks.push(imageBlock(
                        src,
                        nestedImage.getAttribute("alt") || "Decoración del blog"
                    ));
                }
                return;
            }

            if (tag === "hr") {
                blocks.push(makeBlock("divider"));
                return;
            }

            const text = cleanText(element.textContent);
            if (!text) {
                return;
            }

            if (tag === "h1" || tag === "h2" || tag === "h3") {
                blocks.push(makeBlock("heading", { text: text }));
            } else if (tag === "blockquote") {
                blocks.push(makeBlock("quote", { text: text }));
            } else {
                blocks.push(paragraph(text));
            }
        });

        if (!blocks.length && cleanText(template.content.textContent)) {
            blocks.push(paragraph(cleanText(template.content.textContent)));
        }

        return blocks;
    }

    function normalizeBlock(block) {
        const allowedTypes = ["paragraph", "heading", "quote", "divider", "image"];
        const type = allowedTypes.indexOf(block && block.type) >= 0 ? block.type : "paragraph";
        const normalized = {
            id: block && block.id ? String(block.id) : makeId("block"),
            type: type
        };

        if (type === "image") {
            normalized.src = safeImageSrc(block && block.src);
            if (!normalized.src) {
                return null;
            }
            normalized.alt = cleanText(block && block.alt) || "Decoración del blog";
            normalized.layout = block && block.layout === "free" || isEmbeddedImage(normalized.src)
                ? "free"
                : "banner";
        } else if (type !== "divider") {
            normalized.text = String(block && block.text ? block.text : "");
            const defaultFormat = type === "heading"
                ? { bold: true, align: "center" }
                : (type === "quote" ? { italic: true, align: "center" } : null);
            normalized.format = normalizeTextFormat(block && block.format ? block.format : defaultFormat);
        }

        return normalized;
    }

    function normalizeBlocks(blocks, legacyContent) {
        const source = Array.isArray(blocks) ? blocks : htmlToBlocks(legacyContent);
        const normalized = source.filter(Boolean).map(normalizeBlock).filter(Boolean);
        return normalized.length ? normalized : [paragraph("")];
    }

    function storyText(type, text, format) {
        return makeBlock(type, { text: text, format: format || { align: "center" } });
    }

    function storyHeading(number, title) {
        return storyText("heading", number + "\n" + title, {
            bold: true,
            underline: true,
            align: "center"
        });
    }

    function storyIndex(items) {
        return [
            makeBlock("divider"),
            storyText("heading", "❝ ÍNDICE ❞", { bold: true, underline: true, align: "center" }),
            storyText("paragraph", items.map(function (item, index) {
                return String(index + 1).padStart(2, "0") + "... " + item;
            }).join("\n"), { bold: true, align: "center" }),
            makeBlock("divider")
        ];
    }

    function createYouAreMyRealityBlocks() {
        return [
            imageBlock("img/banner reality.png", "Collage rojo de You Are My Reality"),
            storyText("paragraph", "Durante mucho tiempo pensé que la realidad era únicamente aquello que podía tocarse, medirse o explicarse. Entonces llegaste tú y cambiaste esa definición. Ahora sé que también es real la calma que aparece cuando pronuncias mi nombre, la confianza de contarte mis miedos y esa felicidad silenciosa que nace cuando compartimos el mismo instante.", { italic: true, align: "center" })
        ].concat(storyIndex([
            "CUANDO LO IMPOSIBLE TOMÓ TU FORMA",
            "LA VERDAD DE LOS DÍAS PEQUEÑOS",
            "UN HOGAR QUE TAMBIÉN RESPIRA",
            "ELEGIRTE EN TODOS LOS TIEMPOS"
        ]), [
            storyHeading("01", "CUANDO LO IMPOSIBLE TOMÓ TU FORMA"),
            storyText("paragraph", "Antes de ti, yo confundía lo real con lo predecible. Creía que la vida debía seguir caminos conocidos y que las emociones intensas pertenecían solamente a las historias. Pero apareciste con tu manera particular de mirar el mundo y, sin hacer ruido, abriste una puerta que yo no sabía que existía. De pronto, aquello que parecía demasiado hermoso para suceder comenzó a formar parte natural de mis días.", { align: "left" }),
            storyText("paragraph", "Llegaste sin convertirte en un milagro distante. Te volviste presente en conversaciones largas, silencios cómodos y pequeños gestos que nadie más habría notado. Ahí comprendí que el amor verdadero no siempre entra con grandes promesas; a veces se acerca despacio, aprende nuestras costumbres y se queda junto a nosotros. Tú transformaste lo improbable en cotidiano y lo cotidiano en algo que deseo cuidar.", { align: "left" }),
            storyText("quote", "“Eras mi sueño más lejano y terminaste siendo mi verdad más cercana.”", { bold: true, italic: true, align: "center" }),
            storyHeading("02", "LA VERDAD DE LOS DÍAS PEQUEÑOS"),
            storyText("paragraph", "Hay una verdad especial en nuestros días sencillos. Vive en los mensajes inesperados, en las palabras que alivian una tarde difícil y en la forma en que conseguimos hacernos compañía incluso desde lejos. No necesito que cada momento sea extraordinario para sentirme feliz contigo. Me basta saber que estás, que puedo encontrarte en medio del ruido y que existe un lugar en tu vida donde mi presencia también significa algo.", { align: "left" }),
            storyText("paragraph", "También somos reales cuando no coincidimos, cuando una palabra sale mal o el cansancio vuelve más difícil entendernos. Nuestro amor no pierde valor en esos momentos; demuestra su fuerza cuando decidimos hablar, escuchar y regresar el uno al otro. No estamos construyendo una ilusión sin grietas, sino un vínculo capaz de reconocer sus errores y seguir creciendo con paciencia, ternura y honestidad.", { align: "left" }),
            makeBlock("divider"),
            storyHeading("03", "UN HOGAR QUE TAMBIÉN RESPIRA"),
            storyText("paragraph", "Contigo entendí que un hogar no siempre tiene paredes. A veces es una voz que tranquiliza, una risa que devuelve la luz o una presencia ante la cual ya no hace falta fingir fortaleza. En ti encuentro ese refugio donde mis pensamientos pueden descansar y mis emociones no necesitan esconderse. No porque tengas todas las respuestas, sino porque sabes quedarte a mi lado mientras juntos intentamos encontrarlas.", { align: "left" }),
            storyText("paragraph", "Me gusta que nuestro amor tenga espacio para respirar. Que podamos ser nosotros mismos, conservar nuestros sueños y aun así elegir caminar cerca. Amar no debería reducirnos, sino ofrecernos un lugar seguro desde el cual crecer. Por eso valoro esa certeza de que no nos retenemos por miedo, sino que volvemos por voluntad, porque entre tantas posibilidades seguimos reconociéndonos como hogar.", { align: "left" }),
            storyText("quote", "“Mi lugar favorito está en la paz que siento contigo.”", { italic: true, align: "center" }),
            storyHeading("04", "ELEGIRTE EN TODOS LOS TIEMPOS"),
            storyText("paragraph", "Elegirte no significa imaginar que todos nuestros días serán fáciles. Significa querer compartir también las temporadas lentas, los cambios inesperados y esas etapas en las que tendremos que aprendernos nuevamente. Quiero estar presente cuando tus sueños se transformen y cuando los míos encuentren nuevas direcciones. No deseo una versión inmóvil de nosotros, sino la oportunidad de conocernos muchas veces.", { align: "left" }),
            storyText("paragraph", "Si alguna vez el futuro nos encuentra cansados, espero que recordemos la verdad que estamos construyendo ahora. Que volvamos a las conversaciones sinceras, a las risas sin motivo y a la decisión de tratarnos con cuidado. Mi promesa no es saber resolverlo todo; es no dejar de mirarte con curiosidad, respeto y ternura mientras podamos seguir eligiéndonos desde la libertad.", { align: "left" }),
            makeBlock("divider"),
            storyText("paragraph", "Tú eres mi realidad porque contigo no necesito escapar de mi vida para sentir algo extraordinario. Estás en mis días luminosos y también en aquellos que avanzan despacio. Eres verdad en lo que compartimos, en lo que aprendemos y en todo lo que todavía nos falta descubrir.", { italic: true, align: "center" }),
            storyText("quote", "“In this world, you are my reality.”", { bold: true, italic: true, align: "center" })
        ]);
    }

    function createMySerendipityBlocks() {
        return [
            imageBlock("img/my serenpidia banner1.png", "Primer recuerdo dorado de My Serendipity"),
            storyText("paragraph", "No estaba buscándote de la manera en que se buscan las respuestas. Ni siquiera sabía que mi vida guardaba un espacio con tu forma. Sin embargo, coincidimos: entre tantos caminos, horarios y posibilidades, algo nos puso frente a frente. Desde entonces pienso que la serendipia también es reconocer a tiempo un hallazgo hermoso y decidir cuidarlo.", { italic: true, align: "center" })
        ].concat(storyIndex([
            "EL ACCIDENTE MÁS HERMOSO",
            "LAS SEÑALES QUE NO ENTENDÍAMOS",
            "LA SUERTE APRENDIÓ TU NOMBRE",
            "QUEDARME DONDE TE ENCONTRÉ"
        ]), [
            storyHeading("01", "EL ACCIDENTE MÁS HERMOSO"),
            storyText("paragraph", "Nuestro encuentro no llegó acompañado de anuncios ni certezas. Fue uno de esos momentos que parecen pequeños mientras suceden, pero que después dividen la historia en un antes y un después. Quizá por eso lo recuerdo con tanta ternura: ninguno sabía hasta dónde nos llevaría aquella coincidencia. La vida simplemente acercó nuestras orillas y permitió que comenzáramos a descubrir todo lo que podíamos significar.", { align: "left" }),
            storyText("paragraph", "Lo más hermoso es que no necesitaste parecerte a ninguna expectativa. Fuiste tú, con tus detalles, contradicciones y esa manera irrepetible de habitar el mundo. Yo no encontré una idea perfecta; encontré una persona real que despertó preguntas nuevas, risas sinceras y deseos de permanecer. A veces la fortuna entrega algo distinto de lo imaginado y, al conocerlo, entendemos que era mucho mejor.", { align: "left" }),
            storyText("quote", "“La casualidad nos presentó; el corazón decidió reconocerte.”", { bold: true, italic: true, align: "center" }),
            imageBlock("img/banner 2 my serenpidia.png", "Pareja entre girasoles en tonos dorados"),
            storyHeading("02", "LAS SEÑALES QUE NO ENTENDÍAMOS"),
            storyText("paragraph", "Cuando miro hacia atrás, encuentro pequeñas señales escondidas en nuestra historia. Decisiones mínimas, cambios de planes y segundos aparentemente insignificantes tuvieron que coincidir para acercarnos. Ninguno parecía importante por separado, pero juntos formaron el camino que terminó llevándome hasta ti. No sé si todo estaba escrito; sé que entre tantas rutas posibles tuvimos la fortuna de compartir una.", { align: "left" }),
            storyText("paragraph", "Tal vez pasamos mucho tiempo avanzando sin saber que nos acercábamos. Mientras cada uno aprendía sus propias lecciones, la vida preparaba el punto exacto donde nuestras historias podrían encontrarse. No llegamos vacíos: trajimos cicatrices, sueños y aprendizajes que ahora nos ayudan a comprender por qué nuestra conexión se siente tan especial.", { align: "left" }),
            imageBlock("img/my serenpidia banner 3.png", "Manos unidas bajo una noche dorada"),
            makeBlock("divider"),
            storyHeading("03", "LA SUERTE APRENDIÓ TU NOMBRE"),
            storyText("paragraph", "Antes pensaba que tener suerte era recibir algo bueno sin esfuerzo. Contigo aprendí que la fortuna también necesita cuidado. Encontrarnos fue inesperado, pero conocernos, escucharnos y construir confianza ha sido una elección diaria. La casualidad pudo abrir la primera puerta; todo lo demás nació de nuestra voluntad de permanecer. Comenzó como un regalo imprevisto y se convirtió en una obra compartida.", { align: "left" }),
            storyText("paragraph", "Tu nombre ahora vive en mi definición de buena suerte. Está en la tranquilidad de poder hablar sin calcular cada palabra, en la emoción de contarte algo nuevo y en la certeza de que mis sentimientos encuentran un lugar donde ser recibidos. No sé cuántas coincidencias hicieron falta para conocerte, pero quiero agradecerlas cuidándonos mejor cada día.", { align: "left" }),
            storyText("quote", "“Fuiste azar por un instante y elección desde entonces.”", { italic: true, align: "center" }),
            imageBlock("img/banner serenpidia 4.png", "Abrazo oscuro que representa una coincidencia afortunada"),
            storyHeading("04", "QUEDARME DONDE TE ENCONTRÉ"),
            storyText("paragraph", "Encontrarte no significa que nuestro camino deba quedarse detenido en aquel primer momento. Quiero seguir descubriéndote mientras cambias, acompañar las preguntas que todavía no puedes responder y celebrar cada nueva versión de ti. La verdadera serendipia continúa cada vez que revelas una parte de tu mundo y vuelvo a sentir la sorpresa de haber hallado a alguien tan único.", { align: "left" }),
            storyText("paragraph", "Quedarme tampoco nace del temor a perderte. Nace de la alegría de construir contigo, de saber que nuestra historia puede crecer sin convertirse en una jaula. Deseo que siempre podamos elegirnos con libertad y conservar nuestra propia luz. Si la rutina intenta ocultar la maravilla, miraré de nuevo y recordaré que, entre millones de posibilidades, tuve la fortuna de encontrarte.", { align: "left" }),
            makeBlock("divider"),
            storyText("paragraph", "Quizá nunca sepamos qué movimiento diminuto del universo hizo posible nuestra coincidencia. Me basta saber que sucedió, que nos reconocimos y que hoy podemos cuidar aquello que comenzó inesperadamente. Tú eres mi serendipia: el descubrimiento que no estaba buscando y que ahora no cambiaría por ningún plan anterior.", { italic: true, align: "center" }),
            storyText("quote", "“Lucky I found you.”", { bold: true, italic: true, align: "center" })
        ]);
    }

    function createYouSaveMeBlocks() {
        return [
            storyText("paragraph", "Hay personas que llegan haciendo ruido y otras que cambian tu vida casi en silencio. Tú fuiste de las segundas. No apareciste con promesas enormes ni respuestas para todo; llegaste con esa manera tuya de escuchar, con mensajes que parecían sencillos y con una paciencia que, sin darme cuenta, empezó a ordenar el caos que yo llevaba dentro.", { italic: true, align: "center" }),
            storyText("paragraph", "Durante mucho tiempo pensé que ser salvada significaba que alguien vendría a resolverme la vida. Contigo entendí algo distinto: nadie puede caminar por mí, pero una mano sincera puede recordarme que todavía tengo fuerzas para levantarme. Por eso digo que me salvaste: no borraste mis días difíciles, pero hiciste que ya no tuviera que atravesarlos sintiéndome completamente sola.", { align: "center" })
        ].concat(storyIndex([
            "ANTES DE ENCONTRARTE",
            "LA FORMA EN QUE LLEGASTE",
            "SALVAR TAMBIÉN ES QUEDARSE",
            "APRENDER A RESPIRAR CONTIGO"
        ]), [
            storyHeading("01", "ANTES DE ENCONTRARTE"),
            storyText("paragraph", "Antes de ti yo sabía sonreír en las fotos, contestar «estoy bien» y seguir con el día como si nada pesara. Había aprendido a esconder el cansancio detrás de conversaciones normales y a guardar mis miedos donde nadie pudiera verlos. Desde fuera todo parecía tranquilo; por dentro sentía que caminaba por una habitación a oscuras, tocando las paredes para no caer.", { align: "left" }),
            storyText("paragraph", "No esperaba que alguien entendiera aquello que ni yo podía explicar. Me había acostumbrado a pensar que mis silencios eran demasiado complicados y que mis días grises podían cansar a cualquiera. Así que me hacía pequeña, pedía poco y fingía no necesitar compañía. Tal vez esa fue la parte más triste: no estar sola, sino haberme convencido de que merecía sentirme así.", { align: "left" }),
            imageBlock("img/fondo.jpg", "Paisaje gris que representa los días antes de encontrarte", "free"),
            storyHeading("02", "LA FORMA EN QUE LLEGASTE"),
            storyText("paragraph", "Llegaste sin interrogarme y sin obligarme a contar todo de inmediato. Te sentaste, de alguna manera, junto a mi silencio. Cuando no encontraba palabras, no llenabas el espacio con frases vacías; simplemente te quedabas. Ese gesto, que para cualquiera habría parecido mínimo, para mí fue una puerta abierta. Por primera vez en mucho tiempo sentí que podía bajar la guardia sin miedo.", { align: "left" }),
            storyText("paragraph", "Después vinieron tus pequeños cuidados: preguntar si había comido, enviarme algo que pudiera hacerme reír, celebrar conmigo una tarea que parecía insignificante. Nunca intentaste convertirte en héroe. Me trataste como una persona capaz, incluso cuando yo no me sentía así. Lentamente empecé a mirarme a través de tus ojos: no como alguien rota, sino como alguien cansada que todavía podía volver a florecer.", { align: "left" }),
            storyText("quote", "“No encendiste el sol de golpe; te quedaste conmigo hasta que mis ojos recordaron cómo encontrar la luz.”", { bold: true, italic: true, align: "center" }),
            storyHeading("03", "SALVAR TAMBIÉN ES QUEDARSE"),
            storyText("paragraph", "Quedarse no significa soportarlo todo ni olvidar los propios límites. Significa hablar con honestidad, cuidar sin controlar y regresar a la conversación incluso cuando es incómoda. Tú me enseñaste ese tipo de permanencia. No prometiste que jamás discutiríamos; me mostraste que una diferencia no tenía que convertirse en despedida y que podíamos decir «esto me dolió» sin destruirnos.", { align: "left" }),
            storyText("paragraph", "Esa seguridad cambió mi forma de amar. Dejé de sentir que tenía que ser perfecta para conservar tu cariño y empecé a mostrarte mis partes menos ordenadas. También aprendí a cuidar las tuyas, no desde la obligación, sino desde la ternura. Nos salvamos un poco cada vez que elegimos la verdad sobre el orgullo, la calma sobre el impulso y una disculpa consciente sobre el silencio.", { align: "left" }),
            makeBlock("divider"),
            storyHeading("04", "APRENDER A RESPIRAR CONTIGO"),
            storyText("paragraph", "Ahora sé que habrá días en los que vuelva a sentir miedo. Sanar no es una línea recta y amar no elimina todas las sombras. La diferencia es que ya no confundo un mal día con una vida perdida. Cuando el pecho se llena de ruido, recuerdo tu voz diciéndome que respire, pero también recuerdo que fui yo quien tomó aire. Tú no sustituiste mi fuerza: me ayudaste a reconocerla.", { align: "left" }),
            storyText("paragraph", "Quiero hacer lo mismo por ti. Quiero ser un lugar donde puedas descansar sin dejar de ser tú, una presencia que te acompañe sin encerrarte y una voz que te recuerde todo lo que vales cuando el mundo se vuelva pesado. No deseo una historia donde uno rescata y el otro espera; deseo una historia donde ambos aprendamos a encontrarnos, una y otra vez, en medio de cualquier tormenta.", { align: "left" }),
            storyText("quote", "“Me salvaste de la idea de que debía salvarme a solas.”", { italic: true, align: "center" }),
            makeBlock("divider"),
            storyText("paragraph", "Si alguna vez te preguntas qué cambiaste en mí, la respuesta está en las cosas pequeñas: duermo con un poco más de calma, pido ayuda sin tanta vergüenza y vuelvo a imaginar mañanas que antes no podía ver. Todo eso comenzó cuando decidiste conocerme de verdad y yo reuní el valor para dejarme conocer.", { align: "center" }),
            storyText("paragraph", "Gracias por caminar a mi lado sin apropiarte de mi camino. You save me, sí; pero, sobre todo, me recuerdas que también puedo salvarme, crecer y volver a elegir la vida.", { italic: true, align: "center" })
        ]);
    }

    function createMyWorldWithYouBlocks() {
        return [
            imageBlock("img/banner my word.png", "Escena romántica en blanco y negro de nuestro mundo"),
            storyText("paragraph", "Mi mundo no cambió de un día para otro cuando llegaste. La ciudad siguió teniendo las mismas calles, el reloj continuó avanzando con la misma prisa y las obligaciones no desaparecieron. Sin embargo, algo se movió dentro de mí: los lugares conocidos comenzaron a guardar recuerdos nuevos, las canciones tuvieron otro significado y hasta los días comunes adquirieron esa luz que aparece cuando sé que al final podré contarte todo.", { italic: true, align: "center" }),
            storyText("paragraph", "No quiero decir que tú seas todo mi mundo, porque te amo demasiado como para convertirte en una jaula. Tengo sueños, amistades y rincones que también me pertenecen, igual que tú tienes los tuyos. Lo hermoso es que, sin perder nuestras propias vidas, construimos un espacio compartido: un pequeño universo al que siempre podemos volver.", { align: "center" })
        ].concat(storyIndex([
            "UN MUNDO QUE EMPEZÓ PEQUEÑO",
            "NUESTROS LUGARES INVISIBLES",
            "INCLUSO CUANDO LLUEVE",
            "EL FUTURO TIENE TU NOMBRE"
        ]), [
            storyHeading("01", "UN MUNDO QUE EMPEZÓ PEQUEÑO"),
            storyText("paragraph", "Nuestro mundo comenzó con detalles que probablemente nadie más recordaría: una conversación que se alargó más de lo previsto, una broma que solo nosotros entendimos y ese momento extraño en el que dejé de mirar la hora porque hablar contigo se sentía más importante. No hubo música de película ni una señal enorme en el cielo. Solo dos personas descubriendo que querían seguir conociéndose.", { align: "left" }),
            storyText("paragraph", "Con el tiempo, esas coincidencias se convirtieron en costumbres. Aprendí la forma en que escribes cuando estás emocionado, las pausas que haces cuando algo te preocupa y las cosas mínimas que consiguen alegrarte. Tú empezaste a reconocer mis cambios de ánimo antes de que yo los nombrara. Así nació nuestro idioma: hecho de miradas, referencias absurdas y silencios que nunca se sienten vacíos.", { align: "left" }),
            storyHeading("02", "NUESTROS LUGARES INVISIBLES"),
            storyText("paragraph", "Tenemos lugares que no aparecen en ningún mapa. Están en una canción escuchada a la misma hora, en el espacio entre un mensaje y su respuesta, en una llamada nocturna cuando ninguno quería despedirse. También viven en objetos simples: una taza, una foto borrosa, una nota guardada o cualquier cosa que para otros no significa nada, pero que nosotros reconocemos como parte de nuestra historia.", { align: "left" }),
            storyText("paragraph", "Me gusta pensar que esos lugares viajan con nosotros. Aunque cambien las casas, las rutinas o las distancias, nadie puede quitarnos la memoria de cómo nos sentimos allí. Son refugios pequeños que abrimos con una palabra secreta, una fecha o una melodía. Cuando el mundo exterior se vuelve demasiado rápido, basta recordar uno de ellos para sentir que nuestras manos todavía saben encontrarse.", { align: "left" }),
            storyText("quote", "“Hogar no siempre es una dirección; a veces es decir «aquí estoy» y escuchar «yo también».”", { bold: true, italic: true, align: "center" }),
            imageBlock("img/banner my word2.png", "Pareja abrazada diciendo que se quiere"),
            makeBlock("divider"),
            storyHeading("03", "INCLUSO CUANDO LLUEVE"),
            storyText("paragraph", "Mi mundo contigo no es perfecto, y eso lo hace verdadero. Hay días en que estamos cansados, interpretamos mal una frase o llevamos preocupaciones que no sabemos compartir. A veces la lluvia cae también dentro de nuestro pequeño universo. Pero ya no le temo como antes, porque una tormenta no destruye todo lo construido si ambos cuidamos el techo y hablamos antes de que el silencio se vuelva una pared.", { align: "left" }),
            storyText("paragraph", "Amarte también significa conocerte cuando no tienes energía para brillar. Significa respetar tu espacio sin convertirlo en abandono y decirte la verdad sin usarla como arma. En esos días comprendo que el amor no se mide solamente en momentos hermosos; se reconoce en la paciencia, en la responsabilidad de reparar y en recordar que estamos del mismo lado incluso cuando pensamos distinto.", { align: "left" }),
            storyHeading("04", "EL FUTURO TIENE TU NOMBRE"),
            storyText("paragraph", "Cuando imagino el futuro, no veo una escena perfecta y detenida. Veo mañanas con sueño, planes que cambiarán, celebraciones inesperadas y decisiones que tendremos que tomar juntos. Me emociona esa vida real. Quiero descubrir las versiones de nosotros que todavía no conocemos, acompañarte cuando elijas nuevos caminos y permitir que tú también seas testigo de todo lo que yo llegue a ser.", { align: "left" }),
            storyText("paragraph", "No necesito saber exactamente dónde estaremos. Me basta pensar que seguiremos creando rituales: preparar algo sencillo, caminar sin rumbo, conversar al final del día y celebrar los avances que nadie más nota. Quiero un futuro con ventanas abiertas para nuestros sueños individuales y una mesa amplia para reunirlos. Si el tiempo nos transforma, deseo que la curiosidad nos ayude a volver a presentarnos.", { align: "left" }),
            storyText("quote", "“No sueño con detener el tiempo a tu lado; sueño con avanzar y seguir eligiéndote en cada versión de la vida.”", { italic: true, align: "center" }),
            makeBlock("divider"),
            storyText("paragraph", "Mi mundo contigo está hecho de contrastes: calma y aventura, risas escandalosas y silencios suaves, planes enormes y tardes en las que no ocurre nada especial. Cada parte tiene valor porque la vivimos con atención. Tú haces que mire dos veces aquello que antes habría pasado de largo, como si amar fuera aprender una nueva manera de observar.", { align: "center" }),
            storyText("paragraph", "Gracias por compartir tu universo sin pedirme que abandone el mío. Quiero seguir construyendo este lugar entre los dos: con puertas, no con muros; con raíces que sostengan y alas que no estorben. El mundo puede seguir siendo inmenso e incierto, pero cuando camino contigo deja de parecer un sitio ajeno.", { italic: true, align: "center" })
        ]);
    }

    function createHappyBirthdayBlocks() {
        return [
            imageBlock("img/titulo dentro blog de happy birthady.png", "Título decorativo Happy Birthday My Love"),
            storyText("heading", "HAPPY BIRTHDAY, MY LOVE", { bold: true, underline: true, align: "center" }),
            storyText("paragraph", "Hoy el calendario marca una fecha especial, pero para mí significa mucho más que un número. Significa que el mundo tuvo la suerte de recibirte y que, tiempo después, la vida hizo que nuestros caminos se encontraran. Por eso hoy no quiero limitarme a decir «feliz cumpleaños»; quiero dejar aquí un pedacito de todo lo que siento por ti.", { italic: true, align: "center" }),
            storyText("paragraph", "Celebrar tu cumpleaños también es celebrar cada versión de ti: la que se ríe sin poder detenerse, la que guarda sus preocupaciones en silencio, la que sigue adelante incluso cuando el día pesa demasiado y la que consigue iluminar mis horas sin darse cuenta. Todas esas versiones merecen cariño, calma y cosas bonitas.", { align: "center" }),
            storyText("paragraph", "Este blog es mi regalo escrito. No cabe en una caja ni lleva un lazo, pero está hecho de recuerdos, deseos, agradecimiento y sueños. Ojalá, cuando lo leas, puedas sentirte abrazado por cada palabra.", { align: "center" }),
            storyText("quote", "“Tu cumpleaños celebra el día en que llegaste al mundo; mi corazón celebra cada día que puedo compartir contigo.”", { bold: true, italic: true, align: "center" }),
            imageBlock("img/banner 1 sakura.png", "Sakura y Syaoran compartiendo un momento tierno")
        ].concat(storyIndex([
            "LOS RECUERDOS QUE GUARDO",
            "TODO LO QUE DESEO PARA TI",
            "GRACIAS POR EXISTIR EN MI VIDA",
            "EL FUTURO QUE QUIERO COMPARTIR"
        ]), [
            storyHeading("01", "LOS RECUERDOS QUE GUARDO"),
            storyText("paragraph", "Cuando pienso en nosotros, no recuerdo únicamente los momentos grandes. También vuelven los detalles: una conversación que se alargó más de lo esperado, una risa que apareció en el instante perfecto, una canción que de pronto comenzó a tener tu nombre y esos silencios cómodos en los que no hacía falta explicar nada. Son escenas pequeñas, pero juntas forman uno de mis lugares favoritos.", { align: "left" }),
            storyText("paragraph", "Guardo con especial cariño la forma en que poco a poco te volviste parte de mis días. Sin hacer ruido, comenzaste a aparecer en mis pensamientos al despertar, en las cosas que quería contarte durante la tarde y en mis últimos deseos antes de dormir. Desde entonces, incluso un día común puede sentirse especial si hay un momento contigo dentro de él.", { align: "left" }),
            storyText("paragraph", "También atesoro lo que no fue perfecto. Los días difíciles, las dudas y las veces en que tuvimos que aprender a escucharnos me enseñaron que querer a alguien no consiste en vivir una historia sin tropiezos, sino en elegir cuidarla con honestidad. Nuestros recuerdos no son perfectos: son reales, y por eso significan tanto para mí.", { align: "left" }),
            storyText("quote", "“Si pudiera volver a cada recuerdo contigo, no cambiaría el instante: solo me quedaría un poco más.”", { italic: true, align: "center" }),
            imageBlock("img/banner sakura2.png", "Sakura y Syaoran mirándose con timidez"),
            makeBlock("divider"),
            storyHeading("02", "TODO LO QUE DESEO PARA TI"),
            storyText("paragraph", "Deseo que este nuevo año de vida te acerque a todo aquello que hace brillar tus ojos. Que encuentres oportunidades capaces de emocionarte, caminos que te permitan crecer y personas que sepan reconocer la bondad que llevas dentro. Espero que nunca tengas que hacerte más pequeño para caber en los sueños de nadie.", { align: "left" }),
            storyText("paragraph", "Deseo que tengas fuerza, pero también descanso. Que puedas perseguir tus metas sin olvidar respirar, pedir ayuda cuando la necesites y celebrar cada paso, incluso los que parezcan mínimos. No tienes que demostrar tu valor todos los días: ya eres suficiente, incluso cuando estás cansado, inseguro o todavía buscando la respuesta.", { align: "left" }),
            storyText("paragraph", "Y, sobre todo, deseo que seas feliz de una manera tranquila y verdadera. Una felicidad que no dependa de fingir que todo está bien, sino de saber que puedes ser tú, con tus días luminosos y tus días grises. Ojalá la vida te trate con la misma ternura que tú has dejado en mi corazón.", { align: "left" }),
            storyText("quote", "“Que nunca te falten motivos para sonreír, valor para comenzar y un lugar seguro al cual regresar.”", { bold: true, italic: true, align: "center" }),
            imageBlock("img/banner3sakura.png", "Sakura y Syaoran prometiendo volver a verse"),
            makeBlock("divider"),
            storyHeading("03", "GRACIAS POR EXISTIR EN MI VIDA"),
            storyText("paragraph", "Gracias por escucharme, incluso cuando mis pensamientos salen desordenados. Gracias por tu paciencia, por tus palabras y por esas veces en que tu presencia fue suficiente para hacerme sentir mejor. Tal vez no siempre te lo digo en el momento exacto, pero noto cada gesto y guardo cada muestra de cariño.", { align: "left" }),
            storyText("paragraph", "Gracias por dejarme conocerte más allá de lo evidente. Por confiarme tus alegrías, tus miedos, tus planes y esa parte sensible que no todo el mundo consigue ver. Quiero cuidar esa confianza con respeto, porque sé que abrir el corazón requiere valentía y porque todo lo que compartes conmigo tiene un valor enorme.", { align: "left" }),
            storyText("paragraph", "Gracias, también, por enseñarme. A tu lado he aprendido nuevas formas de querer, de tener paciencia y de mirar el futuro con ilusión. No llegaste para completar algo que estaba vacío; llegaste para acompañarme, y tu compañía ha vuelto mi mundo más cálido, más honesto y mucho más bonito.", { align: "left" }),
            storyText("quote", "“Gracias por ser refugio sin encerrarme, compañía sin exigirme y amor sin dejar de ser tú.”", { italic: true, align: "center" }),
            imageBlock("img/banner 4sakura.png", "Syaoran sonrojado en una escena de celebración"),
            makeBlock("divider"),
            storyHeading("04", "EL FUTURO QUE QUIERO COMPARTIR"),
            storyText("paragraph", "Cuando pienso en el futuro, no imagino únicamente grandes promesas. Pienso en cosas sencillas: celebrar más cumpleaños, descubrir canciones juntos, reírnos de historias que solo nosotros entendemos y preguntarnos al final del día cómo nos fue. Pienso en seguir creando recuerdos que algún día miraremos con la misma ternura con la que hoy miramos los primeros.", { align: "left" }),
            storyText("paragraph", "Quiero estar presente en tus logros y también en esos momentos en los que necesites recordar que puedes intentarlo otra vez. Quiero verte crecer sin cortarte las alas, acompañarte sin decidir por ti y construir un amor en el que ambos podamos sentirnos libres, escuchados y seguros. No sé qué forma tendrá el mañana, pero me gusta imaginar que seguiremos eligiéndonos dentro de él.", { align: "left" }),
            storyText("paragraph", "Prometo no pedirle perfección a nuestra historia. Prefiero que sea sincera: que sepamos hablar, reparar, aprender y volver a tomarnos de la mano. Si el futuro trae cambios, deseo que también nos encuentre con la voluntad de conocernos de nuevo y con razones frescas para seguir diciendo «aquí estoy».", { align: "left" }),
            storyText("quote", "“No necesito conocer todo el camino; me basta saber que quiero seguir descubriéndolo contigo.”", { bold: true, italic: true, align: "center" }),
            imageBlock("img/bannersakura5.png", "Promesa entre Sakura y Syaoran"),
            makeBlock("divider"),
            storyText("heading", "FELIZ CUMPLEAÑOS, MI AMOR", { bold: true, underline: true, align: "center" }),
            storyText("paragraph", "Hoy deseo que recibas todo el cariño que has sembrado. Que te abracen bonito, que te recuerden lo importante que eres y que puedas mirar este nuevo comienzo con esperanza. Si alguna vez olvidas cuánto vales, vuelve a estas palabras: tu existencia ha dejado luz en otras vidas, especialmente en la mía.", { align: "center" }),
            storyText("paragraph", "Gracias por llegar hasta aquí, por sobrevivir a los días que parecían imposibles y por seguir convirtiéndote en la persona que deseas ser. Estoy profundamente orgullosa de ti, no solo por lo que consigues, sino por el corazón con el que recorres cada etapa.", { align: "center" }),
            storyText("paragraph", "Que este cumpleaños sea el inicio de doce meses llenos de calma, crecimiento, aventuras y amor. Espero estar a tu lado para aplaudir tus victorias, sostenerte en los días difíciles y recordarte que eres una de las coincidencias más bonitas de mi vida. Hoy, mañana y en todos los días que podamos compartir: te elijo, te agradezco y te quiero. ♡", { italic: true, align: "center" }),
            imageBlock("img/banner6sakura.png", "Pequeño gato diciendo miau como cierre tierno"),
            storyText("quote", "“De todos los regalos que la vida pudo darme, encontrarte sigue siendo mi favorito.”", { bold: true, italic: true, align: "center" })
        ]);
    }

    function createMrJealousBlocks() {
        function styledText(type, text, format) {
            return makeBlock(type, { text: text, format: format || { align: "center" } });
        }

        return [
            imageBlock("img/titutlo de mr jealous.png", "Título decorativo Mr Jealous"),
            styledText("paragraph", "Hola.\n\nEste no es un manual sobre los celos ni una lista de reglas. Es solamente una pequeña confesión: una de esas cosas que cuesta decir en voz alta, pero que se vuelve sencilla cuando la escribo pensando en ti.", { italic: true, align: "center" }),
            styledText("paragraph", "Tal vez parezca exagerado dedicar tantas palabras a una emoción tan pequeña, pero tú sabes que mi corazón nunca ha entendido de medidas cuando se trata de ti. Todo lo que siento llega completo: la alegría, la calma, el miedo y también esos celos que intento esconder detrás de una sonrisa.", { align: "center" }),
            makeBlock("divider"),
            styledText("heading", "❝ ÍNDICE ❞", { bold: true, underline: true, align: "center" }),
            styledText("paragraph", "01... LA CONFESIÓN\n02... ESA RISA\n03... NO ES ENOJO\n04... LO QUE EN REALIDAD QUIERO DECIR", { bold: true, align: "center" }),
            makeBlock("divider"),
            styledText("heading", "01\nLA CONFESIÓN", { bold: true, underline: true, align: "center" }),
            styledText("quote", "Y sí, lo admito: soy un poco celosa.", { bold: true, italic: true, align: "center" }),
            styledText("paragraph", "A veces intento fingir que no me importa. Sonrío, cambio de tema y actúo como si nada hubiera sucedido. Pero por dentro aparece esa pequeña voz que pregunta por qué alguien más consigue tu atención con tanta facilidad.", { align: "left" }),
            styledText("paragraph", "No es que quiera encerrarte ni apartarte del mundo. Me gusta verte feliz, libre y siendo tú. Supongo que el problema es que me importas tanto que, por un instante, quisiera guardar para mí cada mirada bonita que entregas.", { align: "left" }),
            styledText("paragraph", "Los celos llegan en detalles diminutos. En un nombre que aparece demasiadas veces, en una conversación que no alcanzo a escuchar o en el modo en que alguien se acerca a ti con una confianza que todavía no comprendo. No hacen ruido al entrar; simplemente se acomodan en mi pecho y convierten una duda pequeña en cientos de preguntas.", { align: "left" }),
            styledText("paragraph", "Lo más extraño es que sé perfectamente que no has hecho nada malo. Mi razón intenta tranquilizarme y repite que debo confiar, mientras mi corazón pide una señal sencilla: una mirada, una palabra o tu mano buscando la mía para recordarme que sigo estando a tu lado.", { align: "left" }),
            imageBlock("img/banner 2.png", "Pareja dibujada con un corazón"),
            styledText("heading", "02\nESA RISA", { bold: true, underline: true, align: "center" }),
            styledText("paragraph", "Me pone celosa cuando alguien te hace reír de esa manera. Cuando tu rostro cambia, tus ojos brillan y aparece esa risa que adoro. Por unos segundos siento que alguien entró en un lugar que yo creía solamente nuestro.", { align: "left" }),
            styledText("paragraph", "Conozco el sonido de tu risa cuando algo realmente te sorprende, cuando intentas contenerla y cuando terminas riéndote sin preocuparte por nada. Tal vez por eso me afecta tanto verla nacer por alguien más: porque es una de mis cosas favoritas de ti y porque, en secreto, siempre quiero ser parte de todo aquello que te hace bien.", { align: "left" }),
            styledText("quote", "Esa risa que, egoístamente, quisiera ser siempre yo quien la provoque.", { italic: true, align: "center" }),
            styledText("paragraph", "Después respiro y recuerdo que tu alegría no me pertenece: la compartes porque así eres. Aun así, no puedo evitar desear que, cuando termine el día, la sonrisa más sincera sea la que nace cuando estás conmigo.", { align: "left" }),
            styledText("paragraph", "No quiero convertirme en alguien que apague tu forma de brillar solo para sentirse segura. Prefiero aprender a mirar esos momentos sin pensar que cada persona es una amenaza. Quiero entender que puedes disfrutar de otras compañías y, aun así, elegir regresar conmigo para contarme todo lo que viviste.", { align: "left" }),
            imageBlock("img/banner 3 mrjealous.png", "Manos entrelazadas en blanco y negro"),
            styledText("heading", "03\nNO ES ENOJO", { bold: true, underline: true, align: "center" }),
            styledText("paragraph", "No te lo digo para hacerte sentir culpable. Tampoco porque dude de ti. Lo digo porque quiero ser honesta incluso con las partes de mí que no siempre son bonitas, con esa inseguridad que aparece sin permiso y necesita escuchar que todavía tenemos un lugar especial.", { align: "left" }),
            styledText("paragraph", "Mis celos no son una orden. Son una emoción que quiero aprender a cuidar, porque amarte también significa confiar, hablar y no convertir el miedo en una jaula.", { align: "left" }),
            styledText("paragraph", "Durante mucho tiempo creí que lo mejor era quedarme en silencio. Pensaba que admitir mis celos me haría parecer débil o demasiado intensa. Sin embargo, callarlos nunca consiguió que desaparecieran; solamente hizo que crecieran entre ideas inventadas y conclusiones que no tenían nada que ver con la realidad.", { align: "left" }),
            styledText("paragraph", "Por eso prefiero decírtelo con calma. No para pedirte explicaciones por cada cosa que haces, sino para permitirte conocer lo que ocurre dentro de mí. Quizá una conversación honesta no resuelva todas mis inseguridades, pero sí evita que el miedo hable por nosotros y nos aleje sin motivo.", { align: "left" }),
            styledText("quote", "No lo digo con enojo. Lo digo porque te quiero tanto que, a veces, sentirlo así de fuerte me asusta.", { bold: true, italic: true, align: "center" }),
            makeBlock("divider"),
            styledText("heading", "04\nLO QUE EN REALIDAD QUIERO DECIR", { bold: true, underline: true, align: "center" }),
            styledText("paragraph", "Lo que en realidad quiero decir es que me importas de una forma que todavía no sé explicar bien. Que me gusta sentirme elegida por ti, no como una posesión, sino como ese lugar al que deseas volver incluso después de conocer mil lugares más.", { align: "left" }),
            styledText("paragraph", "Quiero ser la persona a quien buscas cuando algo bueno sucede, el abrazo que recuerdas cuando el día pesa y la voz que consigue calmarte. Quiero aprender a quererte sin miedo, pero también poder confesarte cuando necesito un poco de seguridad.", { align: "left" }),
            styledText("paragraph", "No necesito que dejes de hablar con el mundo ni que reduzcas tu vida para hacer espacio a la mía. Solo necesito sentir que nuestro vínculo tiene raíces firmes, que no depende de competir con nadie y que puedo acercarme a ti cuando una duda me lastime sin encontrar burlas o indiferencia.", { align: "left" }),
            styledText("paragraph", "El amor que quiero construir contigo no se parece a una jaula. Se parece a una puerta abierta que ambos decidimos cruzar todos los días. Una elección libre, consciente y tranquila; un lugar donde podamos conservar nuestra individualidad sin olvidar que existe un nosotros que también merece tiempo, cuidado y palabras sinceras.", { align: "left" }),
            imageBlock("img/nbanner 4 mr.png", "Retrato oscuro con una persona y un gato"),
            styledText("paragraph", "Así que sí: a veces me pongo celosa. No porque crea que eres mío como si fueras una cosa, sino porque mi corazón te eligió y todavía está aprendiendo a no temer perder aquello que ama.\n\nSolo sé que te elijo.\nY me hace feliz saber que tú también me eliges.", { align: "left" }),
            styledText("paragraph", "Si alguna vez esa pequeña parte celosa vuelve a aparecer, intentaré no esconderla ni dejar que decida por mí. Te hablaré, respiraré y recordaré todas las razones que me has dado para confiar. Quizá no consiga dejar de sentirla de inmediato, pero puedo aprender a transformarla en una oportunidad para conocernos y cuidarnos mejor.", { align: "left" }),
            makeBlock("divider"),
            styledText("quote", "“I'm just a little jealous.”", { bold: true, italic: true, align: "center" }),
            styledText("paragraph", "— Mr Jealous ♡", { italic: true, align: "center" })
        ];
    }

    function prepareDefaultBlogs() {
        defaultBlogMeta.forEach(function (meta, index) {
            if (blogsData[index]) {
                Object.assign(blogsData[index], meta);
            }
        });

        [
            {
                index: 0,
                title: "You Are My Reality",
                blocks: createYouAreMyRealityBlocks(),
                theme: { background: "#080406", surface: "#190b10", text: "#fff5f7", accent: "#d94a63" }
            },
            {
                index: 1,
                title: "My Serendipity",
                blocks: createMySerendipityBlocks(),
                theme: { background: "#090805", surface: "#19160a", text: "#fff8dc", accent: "#d6ad36" }
            },
            {
                index: 2,
                title: "You Save Me",
                blocks: createYouSaveMeBlocks(),
                theme: { background: "#071015", surface: "#112029", text: "#eefaff", accent: "#74bfd1" }
            },
            {
                index: 3,
                title: "My World With You",
                blocks: createMyWorldWithYouBlocks(),
                theme: { background: "#071012", surface: "#102126", text: "#effbff", accent: "#74aebb" }
            },
            {
                index: 4,
                title: "Mr Jealous",
                blocks: createMrJealousBlocks(),
                theme: defaultBlogTheme("mr-jealous")
            }
        ].forEach(function (authored) {
            const blog = blogsData[authored.index];
            if (!blog) {
                return;
            }
            blog.title = authored.title;
            blog.blocks = authored.blocks;
            blog.theme = authored.theme;
            blog.contentVersion = requiredContentVersion(blog.id);
        });

        if (!blogsData.some(function (blog) { return blog.id === "happy-birthday-my-love"; })) {
            blogsData.push({
                id: "happy-birthday-my-love",
                title: "Happy Birthday My Love",
                cover: "img/12.png",
                likes: 0,
                comments: 0,
                time: "borrador",
                blocks: createHappyBirthdayBlocks(),
                contentVersion: requiredContentVersion("happy-birthday-my-love"),
                theme: { background: "#170713", surface: "#291022", text: "#fff1fb", accent: "#e756bd" }
            });
        }

        for (let index = 0; index < blogsData.length; index += 1) {
            const original = blogsData[index];
            const saved = blogOverrides && blogOverrides[original.id]
                ? blogOverrides[original.id]
                : {};
            const requiredVersion = requiredContentVersion(original.id);
            const refreshAuthoredContent = requiredVersion > 0 &&
                Number(saved.contentVersion || 0) < requiredVersion;

            blogsData[index] = Object.assign({}, original, saved, {
                id: original.id,
                cover: safeCoverSrc(saved.cover || original.cover),
                blocks: normalizeBlocks(refreshAuthoredContent ? original.blocks : (saved.blocks || original.blocks), original.content),
                contentVersion: requiredVersion || saved.contentVersion,
                theme: normalizeBlogTheme(saved.theme || original.theme, original.id)
            });
        }
    }

    function prepareUserPosts() {
        const primary = inspectStorage(USER_POSTS_KEY);
        let stored = [];
        let shouldMigrateLegacy = false;

        if (!primary.ok) {
            userPostsWritable = false;
            userPostsWarning = "No se pudieron leer tus publicaciones guardadas. No se sobrescribió ningún dato.";
        } else if (primary.exists) {
            if (Array.isArray(primary.value)) {
                stored = primary.value;
            } else {
                userPostsWritable = false;
                userPostsWarning = "Tus publicaciones guardadas tienen un formato desconocido y se conservaron sin cambios.";
            }
        } else {
            const legacy = inspectStorage(LEGACY_USER_POSTS_KEY);
            if (legacy.ok && legacy.exists && Array.isArray(legacy.value)) {
                stored = legacy.value;
                shouldMigrateLegacy = true;
            } else if (!legacy.ok || (legacy.exists && !Array.isArray(legacy.value))) {
                userPostsWarning = "Hay publicaciones antiguas que no se pudieron recuperar; se conservaron sin sobrescribirlas.";
            }
        }

        userPosts = stored
            .filter(function (post) {
                return post && (post.title || post.content || (Array.isArray(post.blocks) && post.blocks.length));
            })
            .map(function (post) {
                return {
                    id: post.id || makeId("blog"),
                    title: cleanText(post.title) || "Blog sin título",
                    cover: safeCoverSrc(post.cover || post.image),
                    likes: Number(post.likes) || 0,
                    comments: Number(post.comments) || 0,
                    time: post.time || "editado recientemente",
                    createdAt: post.createdAt || new Date().toISOString(),
                    updatedAt: post.updatedAt || new Date().toISOString(),
                    blocks: normalizeBlocks(post.blocks, post.content),
                    theme: normalizeBlogTheme(post.theme, post.id)
                };
            });

        if (shouldMigrateLegacy && !writeStorage(USER_POSTS_KEY, userPosts)) {
            userPostsWritable = false;
            userPostsWarning = "Tus publicaciones antiguas siguen intactas, pero no se pudo crear la copia editable.";
        }
    }

    function renderText(text) {
        return escapeHtml(text).replace(/\n/g, "<br>");
    }

    function renderBlocksToHtml(blocks) {
        return normalizeBlocks(blocks, "").map(function (block) {
            if (block.type === "heading") {
                return '<h3 class="amino-content-heading ' + textFormatClasses(block) + '">' + renderText(block.text) + "</h3>";
            }

            if (block.type === "quote") {
                return '<blockquote class="amino-content-quote ' + textFormatClasses(block) + '">' + renderText(block.text) + "</blockquote>";
            }

            if (block.type === "divider") {
                return '<div class="amino-content-divider" aria-hidden="true"><span>✦</span></div>';
            }

            if (block.type === "image") {
                const imageClass = block.layout === "free"
                    ? "amino-content-banner amino-content-image-free"
                    : "amino-content-banner";
                return '<figure class="' + imageClass + '"><img src="' +
                    escapeHtml(safeImageSrc(block.src)) +
                    '" alt="' +
                    escapeHtml(block.alt) +
                    '" loading="lazy" decoding="async"></figure>';
            }

            return '<p class="amino-content-paragraph ' + textFormatClasses(block) + '">' + renderText(block.text) + "</p>";
        }).join("");
    }

    function blockPreview(blocks) {
        const text = normalizeBlocks(blocks, "")
            .filter(function (block) { return block.type !== "image" && block.type !== "divider"; })
            .map(function (block) { return cleanText(block.text); })
            .filter(Boolean)
            .join(" ");

        if (!text) {
            return "Blog decorado y listo para seguir escribiendo.";
        }

        return text.length > 145 ? text.slice(0, 142).trim() + "..." : text;
    }

    function createButton(className, label, text) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className;
        button.setAttribute("aria-label", label);
        button.title = label;
        button.textContent = text;
        return button;
    }

    function createFeedCard(blog, source) {
        const article = document.createElement("article");
        article.className = "amino-post-card blog-card amino-feed-card managed-blog-card";
        article.dataset.blogId = blog.id;
        article.dataset.blogSource = source;

        const openButton = createButton("managed-card-open", "Abrir blog " + blog.title, "");
        openButton.dataset.feedAction = "open";

        const header = document.createElement("div");
        header.className = "amino-post-header";

        const time = document.createElement("span");
        time.className = "amino-post-time";
        time.textContent = blog.time || "editado recientemente";

        const cardTools = document.createElement("div");
        cardTools.className = "managed-card-tools";

        const editButton = createButton("amino-post-dots managed-card-edit", "Editar " + blog.title, "✎");
        editButton.dataset.feedAction = "edit";
        cardTools.appendChild(editButton);

        if (source === "custom") {
            const deleteButton = createButton("amino-post-dots managed-card-delete", "Eliminar " + blog.title, "×");
            deleteButton.dataset.feedAction = "delete";
            cardTools.appendChild(deleteButton);
        }

        header.append(time, cardTools);

        const textRow = document.createElement("div");
        textRow.className = "amino-post-text-row";
        const title = document.createElement("h3");
        title.className = "amino-post-title";
        title.textContent = blog.title;
        const preview = document.createElement("p");
        preview.className = "amino-post-preview";
        preview.textContent = blockPreview(blog.blocks);
        textRow.append(title, preview);

        const imageWrap = document.createElement("div");
        imageWrap.className = "amino-post-images";
        const cover = document.createElement("img");
        cover.src = safeCoverSrc(blog.cover);
        cover.alt = "Portada de " + blog.title;
        cover.loading = "lazy";
        cover.decoding = "async";
        imageWrap.appendChild(cover);

        const footer = document.createElement("div");
        footer.className = "amino-post-footer";
        const like = document.createElement("span");
        like.className = "amino-post-action";
        like.textContent = "♡ " + (Number(blog.likes) || 0);
        like.setAttribute("aria-label", (Number(blog.likes) || 0) + " me gusta");
        const comments = document.createElement("span");
        comments.className = "amino-post-action";
        comments.textContent = "💬 " + (Number(blog.comments) || 0);
        comments.setAttribute("aria-label", (Number(blog.comments) || 0) + " comentarios");
        const share = createButton("amino-post-action share-btn", "Compartir", "➦");
        share.dataset.feedAction = "share";
        footer.append(like, comments, share);

        article.append(openButton, header, textRow, imageWrap, footer);
        return article;
    }

    function renderPosts() {
        const fragment = document.createDocumentFragment();

        const storageWarnings = [blogOverridesWarning, userPostsWarning].filter(Boolean);
        if (storageWarnings.length) {
            const warning = document.createElement("div");
            warning.className = "blog-storage-warning";
            warning.setAttribute("role", "alert");
            warning.textContent = storageWarnings.join(" ");
            fragment.appendChild(warning);
        }

        userPosts.forEach(function (blog) {
            fragment.appendChild(createFeedCard(blog, "custom"));
        });

        blogsData.forEach(function (blog) {
            fragment.appendChild(createFeedCard(blog, "static"));
        });

        postsList.replaceChildren(fragment);
    }

    function getBlog(ref) {
        if (!ref) {
            return null;
        }

        const collection = ref.source === "custom" ? userPosts : blogsData;
        return collection.find(function (blog) { return blog.id === ref.id; }) || null;
    }

    function refFromCard(card) {
        return {
            source: card.dataset.blogSource,
            id: card.dataset.blogId
        };
    }

    function findCardOpener(ref) {
        if (!ref) {
            return null;
        }
        const matchingCard = Array.from(postsList.querySelectorAll(".managed-blog-card")).find(function (card) {
            return card.dataset.blogSource === ref.source && card.dataset.blogId === ref.id;
        }) || null;
        return matchingCard ? matchingCard.querySelector(".managed-card-open") : null;
    }

    function isRestorableFocus(element) {
        return Boolean(
            element &&
            element !== document.body &&
            element !== document.documentElement &&
            element.isConnected &&
            !readerModal.contains(element) &&
            !editorModal.contains(element) &&
            !element.hidden
        );
    }

    function syncBodyModalState() {
        Array.from(document.body.children).forEach(function (element) {
            if (element.hasAttribute("data-blog-background-inert")) {
                element.removeAttribute("inert");
                element.removeAttribute("data-blog-background-inert");
            }
        });

        const activeModal = editorModal.classList.contains("active")
            ? editorModal
            : (readerModal.classList.contains("active") ? readerModal : null);
        document.body.classList.toggle("blog-modal-open", Boolean(activeModal));

        if (!activeModal) {
            return;
        }

        Array.from(document.body.children).forEach(function (element) {
            if (element === activeModal || element.tagName === "SCRIPT" || element.hasAttribute("inert")) {
                return;
            }
            element.setAttribute("inert", "");
            element.setAttribute("data-blog-background-inert", "true");
        });
    }

    function trapFocus(event, modal) {
        const focusable = Array.from(modal.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(function (element) {
            return !element.hidden && element.offsetParent !== null;
        });

        if (!focusable.length) {
            event.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        } else if (!modal.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
        }
    }

    function openReader(ref, opener) {
        const blog = getBlog(ref);
        if (!blog) {
            return;
        }

        readerPreviousFocus = isRestorableFocus(opener)
            ? opener
            : (isRestorableFocus(document.activeElement) ? document.activeElement : findCardOpener(ref));
        currentReaderRef = { source: ref.source, id: ref.id };
        applyBlogTheme(readerWindow, blog.theme, blog.id);
        readerTitle.textContent = blog.title;
        readerBody.innerHTML = renderBlocksToHtml(blog.blocks);
        readerCover.style.backgroundImage = "none";
        readerCover.replaceChildren();

        if (blog.cover) {
            const image = document.createElement("img");
            image.src = safeCoverSrc(blog.cover);
            image.alt = "Portada de " + blog.title;
            image.loading = "lazy";
            readerCover.appendChild(image);
            readerCover.hidden = false;
        } else {
            readerCover.hidden = true;
        }

        const authorTime = readerModal.querySelector(".author-details small");
        if (authorTime) {
            authorTime.textContent = blog.time || "editado recientemente";
        }

        currentBlogLikes = Number(blog.likes) || 0;
        blogLiked = false;
        readerLikeButton.textContent = "♡";
        readerLikeButton.classList.remove("liked");
        readerLikeButton.setAttribute("aria-pressed", "false");
        readerLikeCount.textContent = String(currentBlogLikes);

        readerModal.classList.add("active");
        readerModal.setAttribute("aria-hidden", "false");
        syncBodyModalState();

        if (readerWindow) {
            readerWindow.scrollTop = 0;
        }

        window.setTimeout(function () {
            closeReaderButton.focus();
        }, 0);
    }

    function closeReader() {
        readerModal.classList.remove("active");
        readerModal.setAttribute("aria-hidden", "true");
        syncBodyModalState();

        let focusTarget = isRestorableFocus(readerPreviousFocus)
            ? readerPreviousFocus
            : null;

        if (!focusTarget && currentReaderRef) {
            focusTarget = findCardOpener(currentReaderRef);
        }

        if (focusTarget && typeof focusTarget.focus === "function") {
            focusTarget.focus();
        }
    }

    function deleteCustomBlog(ref) {
        const blog = getBlog(ref);
        if (!blog || ref.source !== "custom") {
            return;
        }

        if (!userPostsWritable) {
            window.alert("No se puede modificar esta lista hasta recuperar el almacenamiento del navegador.");
            return;
        }

        if (!window.confirm("¿Eliminar el blog \"" + blog.title + "\"?")) {
            return;
        }

        const remainingPosts = userPosts.filter(function (post) { return post.id !== ref.id; });
        if (!writeStorage(USER_POSTS_KEY, remainingPosts)) {
            window.alert("No se pudo eliminar porque el navegador no permitió guardar el cambio.");
            return;
        }
        userPosts = remainingPosts;
        renderPosts();
    }

    function handleFeedAction(event) {
        const card = event.target.closest(".managed-blog-card");
        if (!card || !postsList.contains(card)) {
            return;
        }

        const ref = refFromCard(card);
        const action = event.target.closest("[data-feed-action]");

        if (action) {
            event.preventDefault();
            event.stopPropagation();
            if (action.dataset.feedAction === "edit") {
                openEditor(ref);
            } else if (action.dataset.feedAction === "delete") {
                deleteCustomBlog(ref);
            } else if (action.dataset.feedAction === "share") {
                shareBlog(ref, action);
            } else if (action.dataset.feedAction === "open") {
                openReader(ref, action);
            }
            return;
        }

        openReader(ref, findCardOpener(ref));
    }

    function autoGrow(textarea) {
        textarea.style.height = "auto";
        textarea.style.height = Math.max(84, textarea.scrollHeight) + "px";
    }

    function compressBlogImage(file) {
        return new Promise(function (resolve, reject) {
            if (!/^image\/(?:png|jpeg|webp)$/i.test(file.type)) {
                reject(new Error("Formato no compatible"));
                return;
            }
            if (file.size > 15 * 1024 * 1024) {
                reject(new Error("La imagen supera 15 MB"));
                return;
            }

            const image = new Image();
            const objectUrl = URL.createObjectURL(file);
            image.onload = function () {
                URL.revokeObjectURL(objectUrl);
                const attempts = [
                    { size: 1600, quality: 0.82 },
                    { size: 1280, quality: 0.72 },
                    { size: 960, quality: 0.64 }
                ];
                let result = "";

                for (let index = 0; index < attempts.length; index += 1) {
                    const attempt = attempts[index];
                    const scale = Math.min(1, attempt.size / Math.max(image.naturalWidth, image.naturalHeight));
                    const width = Math.max(1, Math.round(image.naturalWidth * scale));
                    const height = Math.max(1, Math.round(image.naturalHeight * scale));
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const context = canvas.getContext("2d");
                    context.drawImage(image, 0, 0, width, height);
                    result = canvas.toDataURL("image/webp", attempt.quality);
                    if (result.length <= 650000) {
                        break;
                    }
                }

                resolve(result);
            };
            image.onerror = function () {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("No se pudo leer la imagen"));
            };
            image.src = objectUrl;
        });
    }

    async function addUploadedImages(files) {
        const selectedFiles = Array.from(files || []).slice(0, 8);
        if (!selectedFiles.length) {
            return;
        }

        setDraftStatus("Preparando imágenes…", "saving");
        let added = 0;
        for (let index = 0; index < selectedFiles.length; index += 1) {
            const file = selectedFiles[index];
            try {
                const source = await compressBlogImage(file);
                const description = cleanText(file.name.replace(/\.[^.]+$/, "")) || "Imagen del blog";
                addBlock("image", { src: source, alt: description, layout: "free" });
                added += 1;
            } catch (error) {
                setDraftStatus(error.message || "No se pudo añadir una imagen", "error");
            }
        }

        if (added) {
            setDraftStatus(added === 1 ? "Imagen añadida" : added + " imágenes añadidas", "saved");
        }
    }

    function blockFieldPlaceholder(type) {
        if (type === "heading") {
            return "Escribe un título para esta parte";
        }
        if (type === "quote") {
            return "Escribe una frase destacada";
        }
        return "Escribe esta parte de tu blog...";
    }

    function renderEditorBlocks(focusIndex) {
        editorBlocks.replaceChildren();

        if (Number.isInteger(focusIndex)) {
            editorInsertIndex = focusIndex;
        }

        editorState.blocks.forEach(function (block, index) {
            const item = document.createElement("article");
            item.className = "editor-block editor-block-" + block.type;
            item.dataset.blockIndex = String(index);
            if (index === editorInsertIndex) {
                item.classList.add("selected");
            }

            const header = document.createElement("header");
            header.className = "editor-block-header";

            const label = document.createElement("span");
            label.className = "editor-block-type";
            label.id = "editor-block-label-" + block.id;
            label.textContent = (blockLabels[block.type] || "Bloque") + " " + (index + 1);

            const controls = document.createElement("div");
            controls.className = "editor-block-controls";

            const blockDescription = (blockLabels[block.type] || "Bloque") + " " + (index + 1);
            const up = createButton("editor-block-button", "Subir " + blockDescription, "↑");
            up.dataset.blockAction = "up";
            up.disabled = index === 0;

            const down = createButton("editor-block-button", "Bajar " + blockDescription, "↓");
            down.dataset.blockAction = "down";
            down.disabled = index === editorState.blocks.length - 1;

            const remove = createButton("editor-block-button editor-block-remove", "Eliminar " + blockDescription, "×");
            remove.dataset.blockAction = "remove";

            controls.append(up, down, remove);
            header.append(label, controls);
            item.appendChild(header);

            if (block.type === "image") {
                const figure = document.createElement("figure");
                figure.className = block.layout === "free"
                    ? "editor-banner-preview editor-image-free"
                    : "editor-banner-preview";
                const image = document.createElement("img");
                image.src = safeImageSrc(block.src);
                image.alt = "";
                figure.appendChild(image);

                const altLabel = document.createElement("label");
                altLabel.className = "editor-alt-label";
                altLabel.textContent = "Descripción de la imagen";
                const altInput = document.createElement("input");
                altInput.type = "text";
                altInput.value = block.alt || "";
                altInput.dataset.blockField = "alt";
                altInput.placeholder = "Describe la imagen";
                altInput.required = true;
                altInput.setAttribute("aria-label", "Descripción de " + blockDescription);
                altLabel.appendChild(altInput);
                item.append(figure, altLabel);
            } else if (block.type === "divider") {
                const divider = document.createElement("div");
                divider.className = "editor-divider-preview";
                divider.setAttribute("aria-label", "Separador decorativo");
                divider.innerHTML = "<span>✦</span>";
                item.appendChild(divider);
            } else {
                const textarea = document.createElement("textarea");
                textarea.className = "editor-block-text " + textFormatClasses(block);
                textarea.value = block.text || "";
                textarea.dataset.blockField = "text";
                textarea.placeholder = blockFieldPlaceholder(block.type);
                textarea.rows = 1;
                textarea.setAttribute("aria-labelledby", label.id);

                const format = normalizeTextFormat(block.format);
                const formatToolbar = document.createElement("div");
                formatToolbar.className = "editor-format-toolbar";
                formatToolbar.setAttribute("aria-label", "Formato de " + blockDescription);
                [
                    { command: "bold", label: "Negrita", text: "B" },
                    { command: "italic", label: "Cursiva", text: "I" },
                    { command: "underline", label: "Subrayar", text: "U" },
                    { command: "strike", label: "Tachar", text: "S" },
                    { command: "align-left", label: "Alinear a la izquierda", text: "≡←" },
                    { command: "align-center", label: "Centrar texto", text: "≡" },
                    { command: "align-right", label: "Alinear a la derecha", text: "→≡" }
                ].forEach(function (option) {
                    const button = createButton("editor-format-button format-" + option.command, option.label, option.text);
                    button.dataset.formatCommand = option.command;
                    const pressed = option.command.indexOf("align-") === 0
                        ? format.align === option.command.replace("align-", "")
                        : Boolean(format[option.command]);
                    button.setAttribute("aria-pressed", String(pressed));
                    formatToolbar.appendChild(button);
                });

                item.append(textarea, formatToolbar);
            }

            editorBlocks.appendChild(item);
        });

        const total = editorState.blocks.length;
        editorBlockCount.textContent = total + (total === 1 ? " bloque" : " bloques");
        editorBlocks.querySelectorAll("textarea").forEach(autoGrow);

        if (Number.isInteger(focusIndex)) {
            const focusItem = editorBlocks.querySelector('[data-block-index="' + focusIndex + '"]');
            const focusField = focusItem ? focusItem.querySelector("textarea, input") : null;
            if (focusField) {
                window.setTimeout(function () {
                    focusField.focus();
                    if (typeof focusField.setSelectionRange === "function") {
                        const end = focusField.value.length;
                        focusField.setSelectionRange(end, end);
                    }
                }, 0);
            }
        }
    }

    function syncCoverPicker() {
        coverPicker.querySelectorAll("[data-cover]").forEach(function (option) {
            const selected = option.dataset.cover === editorState.cover;
            option.classList.toggle("selected", selected);
            option.setAttribute("aria-pressed", String(selected));
        });
    }

    function syncThemeControls() {
        if (!editorState || !blogBackgroundColor) {
            return;
        }
        editorState.theme = normalizeBlogTheme(editorState.theme, editorState.id);
        blogBackgroundColor.value = editorState.theme.background;
        blogSurfaceColor.value = editorState.theme.surface;
        blogTextColor.value = editorState.theme.text;
        blogAccentColor.value = editorState.theme.accent;

        editorModal.querySelectorAll("[data-blog-theme-preset]").forEach(function (button) {
            const preset = BLOG_THEME_PRESETS[button.dataset.blogThemePreset];
            const selected = preset && Object.keys(preset).every(function (key) {
                return preset[key] === editorState.theme[key];
            });
            button.classList.toggle("selected", Boolean(selected));
            button.setAttribute("aria-pressed", String(Boolean(selected)));
        });
    }

    function setDraftStatus(message, state) {
        draftStatus.textContent = message;
        draftStatus.dataset.state = state || "";
    }

    function scheduleDraftSave() {
        if (!editorOpen || !editorState) {
            return;
        }

        editorDirty = true;
        window.clearTimeout(draftTimer);
        setDraftStatus("Guardando borrador…", "saving");
        draftTimer = window.setTimeout(saveDraftNow, 650);
    }

    function saveDraftNow() {
        if (!editorOpen || !editorState || !editorDirty) {
            return true;
        }

        window.clearTimeout(draftTimer);
        const draftResult = inspectStorage(BLOG_DRAFT_KEY);
        const drafts = draftResult.ok && draftResult.exists ? draftResult.value : {};
        if (!draftResult.ok || !drafts || typeof drafts !== "object" || Array.isArray(drafts)) {
            setDraftStatus("No se sobrescribió un borrador que no se pudo leer", "error");
            return false;
        }
        const draftCollection = drafts;
        draftCollection[editorTarget] = {
            savedAt: new Date().toISOString(),
            state: editorState
        };
        const ok = writeStorage(BLOG_DRAFT_KEY, draftCollection);
        if (ok) {
            editorDirty = false;
        }
        setDraftStatus(ok ? "Borrador guardado" : "No se pudo guardar", ok ? "saved" : "error");
        return ok;
    }

    function freshEditorState(ref) {
        if (ref) {
            const blog = getBlog(ref);
            if (blog) {
                return {
                    source: ref.source,
                    id: ref.id,
                    title: blog.title,
                    cover: blog.cover,
                    blocks: clone(blog.blocks),
                    contentVersion: blog.contentVersion || null,
                    theme: normalizeBlogTheme(blog.theme, blog.id)
                };
            }
        }

        return {
            source: "new",
            id: null,
            title: "",
            cover: "img/portada mrjelous.png",
            blocks: [paragraph("")],
            contentVersion: null,
            theme: defaultBlogTheme("")
        };
    }

    function normalizedEditorState(state, fallback) {
        return {
            source: fallback.source,
            id: fallback.id,
            title: String(state && state.title != null ? state.title : fallback.title),
            cover: safeCoverSrc(state && state.cover ? state.cover : fallback.cover),
            blocks: normalizeBlocks(state && state.blocks, ""),
            contentVersion: state && state.contentVersion ? state.contentVersion : fallback.contentVersion,
            theme: normalizeBlogTheme(state && state.theme ? state.theme : fallback.theme, fallback.id)
        };
    }

    function showComposeView() {
        editorShowingPreview = false;
        editorComposeView.hidden = false;
        editorPreviewView.hidden = true;
        previewEditorButton.textContent = "Vista previa";
        previewEditorButton.setAttribute("aria-pressed", "false");
    }

    function updatePreview() {
        applyBlogTheme(editorPreviewCard, editorState.theme, editorState.id);
        editorPreviewTitle.textContent = cleanText(editorState.title) || "Sin título";
        editorPreviewBody.innerHTML = renderBlocksToHtml(editorState.blocks);
        editorPreviewCover.replaceChildren();

        const image = document.createElement("img");
        image.src = safeCoverSrc(editorState.cover);
        image.alt = "Portada de " + (cleanText(editorState.title) || "este blog");
        editorPreviewCover.appendChild(image);
    }

    function togglePreview() {
        if (!editorShowingPreview) {
            composeScrollTop = editorScroll ? editorScroll.scrollTop : 0;
            const activeBlock = Number.isInteger(editorInsertIndex)
                ? editorBlocks.querySelector('[data-block-index="' + editorInsertIndex + '"]')
                : null;
            previewReturnFocus = activeBlock
                ? activeBlock.querySelector("textarea, input")
                : editorTitleInput;
            updatePreview();
            editorShowingPreview = true;
            editorComposeView.hidden = true;
            editorPreviewView.hidden = false;
            previewEditorButton.textContent = "Seguir editando";
            previewEditorButton.setAttribute("aria-pressed", "true");
            if (editorScroll) {
                editorScroll.scrollTop = 0;
            }
        } else {
            showComposeView();
            window.requestAnimationFrame(function () {
                if (editorScroll) {
                    editorScroll.scrollTop = composeScrollTop;
                }
                if (previewReturnFocus && previewReturnFocus.isConnected) {
                    previewReturnFocus.focus();
                } else {
                    editorTitleInput.focus();
                }
            });
        }
    }

    function openEditor(ref) {
        previousFocus = document.activeElement;
        if (readerModal.classList.contains("active") && ref) {
            previousFocus = findCardOpener(ref) || createPostButton;
        }
        const baseState = freshEditorState(ref);
        editorTarget = ref ? ref.source + ":" + ref.id : "new";
        const savedDraft = readDraft(editorTarget);
        const editorRequiredVersion = requiredContentVersion(baseState.id);
        const staleAuthoredDraft = editorRequiredVersion > 0 && savedDraft && savedDraft.state &&
            Number(savedDraft.state.contentVersion || 0) < editorRequiredVersion;
        const canRestore = savedDraft &&
            savedDraft.state &&
            typeof savedDraft.state === "object" &&
            !staleAuthoredDraft;

        editorState = canRestore
            ? normalizedEditorState(savedDraft.state, baseState)
            : baseState;

        editorTitleInput.value = editorState.title;
        editorInsertIndex = null;
        editorDirty = false;
        editorDialogTitle.textContent = ref ? "Editar blog" : "Nuevo blog";
        publishEditorButton.textContent = ref ? "Guardar" : "Publicar";
        showComposeView();
        renderEditorBlocks();
        syncCoverPicker();
        syncThemeControls();
        setDraftStatus(canRestore ? "Borrador recuperado" : "Listo para escribir", canRestore ? "saved" : "");

        readerModal.classList.remove("active");
        readerModal.setAttribute("aria-hidden", "true");
        editorModal.classList.add("active");
        editorModal.setAttribute("aria-hidden", "false");
        editorOpen = true;
        syncBodyModalState();

        window.setTimeout(function () {
            if (editorState.title) {
                const firstField = editorBlocks.querySelector("textarea, input");
                if (firstField) {
                    firstField.focus();
                } else {
                    editorTitleInput.focus();
                }
            } else {
                editorTitleInput.focus();
            }
        }, 0);
    }

    function closeEditor(keepDraft) {
        if (!editorOpen) {
            return;
        }

        if (keepDraft !== false) {
            const saved = saveDraftNow();
            if (!saved && editorDirty) {
                setDraftStatus("No se pudo guardar el borrador", "error");
                const discard = window.confirm(
                    "No se pudo guardar tu borrador. ¿Quieres salir y perder estos cambios?"
                );
                if (!discard) {
                    return;
                }
            }
        }

        window.clearTimeout(draftTimer);
        editorOpen = false;
        editorModal.classList.remove("active");
        editorModal.setAttribute("aria-hidden", "true");
        showComposeView();
        syncBodyModalState();

        if (isRestorableFocus(previousFocus) && typeof previousFocus.focus === "function") {
            previousFocus.focus();
        }
    }

    function addBlock(type, values) {
        const block = makeBlock(type, values || {});
        if (type !== "divider" && type !== "image" && typeof block.text !== "string") {
            block.text = "";
        }
        const insertionIndex = Number.isInteger(editorInsertIndex)
            ? Math.min(editorInsertIndex + 1, editorState.blocks.length)
            : editorState.blocks.length;
        editorState.blocks.splice(insertionIndex, 0, normalizeBlock(block));
        renderEditorBlocks(insertionIndex);
        scheduleDraftSave();
    }

    function updateBlockFormat(index, command) {
        const block = editorState.blocks[index];
        if (!block || block.type === "image" || block.type === "divider") {
            return;
        }

        const format = normalizeTextFormat(block.format);
        if (command.indexOf("align-") === 0) {
            format.align = command.replace("align-", "");
        } else if (["bold", "italic", "underline", "strike"].indexOf(command) >= 0) {
            format[command] = !format[command];
        } else {
            return;
        }

        block.format = format;
        renderEditorBlocks(index);
        scheduleDraftSave();
    }

    function moveBlock(index, direction) {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= editorState.blocks.length) {
            return;
        }

        const moved = editorState.blocks.splice(index, 1)[0];
        editorState.blocks.splice(nextIndex, 0, moved);
        renderEditorBlocks(nextIndex);
        scheduleDraftSave();
    }

    function removeBlock(index) {
        const block = editorState.blocks[index];
        const hasContent = block && (
            block.type === "image" ||
            (block.type !== "divider" && cleanText(block.text))
        );

        if (hasContent && !window.confirm("¿Eliminar este bloque? Esta acción cambiará el borrador.")) {
            return;
        }

        editorState.blocks.splice(index, 1);
        if (!editorState.blocks.length) {
            editorState.blocks.push(paragraph(""));
        }
        renderEditorBlocks(Math.min(index, editorState.blocks.length - 1));
        setDraftStatus("Bloque eliminado", "");
        scheduleDraftSave();
    }

    function persistEditor() {
        const title = cleanText(editorState.title);
        if (!title) {
            showComposeView();
            editorTitleInput.focus();
            setDraftStatus("Escribe un título antes de guardar", "error");
            return;
        }

        const missingAltIndex = editorState.blocks.findIndex(function (block) {
            return block.type === "image" && !cleanText(block.alt);
        });

        if (missingAltIndex >= 0) {
            showComposeView();
            const missingAltField = editorBlocks.querySelector(
                '[data-block-index="' + missingAltIndex + '"] [data-block-field="alt"]'
            );
            if (missingAltField) {
                missingAltField.focus();
            }
            setDraftStatus("Describe cada imagen antes de guardar", "error");
            return;
        }

        const preparedBlocks = normalizeBlocks(editorState.blocks, "");
        const hasContent = preparedBlocks.some(function (block) {
            return block.type === "image" ||
                (block.type !== "divider" && cleanText(block.text));
        });

        if (!hasContent) {
            showComposeView();
            const firstField = editorBlocks.querySelector("textarea, input");
            if (firstField) {
                firstField.focus();
            }
            setDraftStatus("Añade texto o una imagen antes de guardar", "error");
            return;
        }

        window.clearTimeout(draftTimer);

        const now = new Date().toISOString();
        const payload = {
            title: title,
            cover: safeCoverSrc(editorState.cover),
            blocks: preparedBlocks,
            theme: normalizeBlogTheme(editorState.theme, editorState.id),
            updatedAt: now,
            time: "editado ahora"
        };
        if (requiredContentVersion(editorState.id)) {
            payload.contentVersion = requiredContentVersion(editorState.id);
        }

        let publishedRef;

        if (editorState.source === "static") {
            if (!blogOverridesWritable) {
                setDraftStatus("No se puede guardar sin sobrescribir ediciones anteriores.", "error");
                return;
            }
            const index = blogsData.findIndex(function (blog) { return blog.id === editorState.id; });
            if (index < 0) {
                return;
            }

            const nextOverrides = Object.assign({}, blogOverrides);
            nextOverrides[editorState.id] = payload;
            if (!writeStorage(BLOG_OVERRIDES_KEY, nextOverrides)) {
                saveDraftNow();
                setDraftStatus("No se pudo guardar. Tu editor sigue abierto.", "error");
                return;
            }
            blogOverrides = nextOverrides;
            blogsData[index] = Object.assign({}, blogsData[index], payload);
            publishedRef = { source: "static", id: editorState.id };
        } else if (editorState.source === "custom") {
            if (!userPostsWritable) {
                setDraftStatus("No se puede guardar sin sobrescribir datos anteriores.", "error");
                return;
            }
            const index = userPosts.findIndex(function (blog) { return blog.id === editorState.id; });
            if (index < 0) {
                return;
            }

            const nextPosts = userPosts.slice();
            nextPosts[index] = Object.assign({}, nextPosts[index], payload);
            if (!writeStorage(USER_POSTS_KEY, nextPosts)) {
                saveDraftNow();
                setDraftStatus("No se pudo guardar. Tu editor sigue abierto.", "error");
                return;
            }
            userPosts = nextPosts;
            publishedRef = { source: "custom", id: editorState.id };
        } else {
            if (!userPostsWritable) {
                setDraftStatus("No se puede publicar sin sobrescribir datos anteriores.", "error");
                return;
            }
            const created = Object.assign({
                id: makeId("blog"),
                likes: 0,
                comments: 0,
                createdAt: now
            }, payload);
            const nextPosts = [created].concat(userPosts);
            if (!writeStorage(USER_POSTS_KEY, nextPosts)) {
                saveDraftNow();
                setDraftStatus("No se pudo publicar. Tu editor sigue abierto.", "error");
                return;
            }
            userPosts = nextPosts;
            publishedRef = { source: "custom", id: created.id };
        }

        editorDirty = false;
        removeDraft(editorTarget);

        renderPosts();
        const publishedOpener = findCardOpener(publishedRef);
        closeEditor(false);
        openReader(publishedRef, publishedOpener);
    }

    function shareBlog(ref, feedbackButton) {
        const blog = getBlog(ref);
        if (!blog) {
            return;
        }

        const shareData = {
            title: blog.title,
            text: blockPreview(blog.blocks),
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).catch(function () {});
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(blog.title + " — " + window.location.href)
                .then(function () {
                    if (feedbackButton) {
                        feedbackButton.textContent = "✓";
                        window.setTimeout(function () { feedbackButton.textContent = "➦"; }, 1200);
                    }
                })
                .catch(function () {});
        }
    }

    function shareCurrentBlog() {
        shareBlog(currentReaderRef, shareReaderButton);
    }

    postsList.addEventListener("click", handleFeedAction);

    createPostButton.addEventListener("click", function () {
        openEditor(null);
    });

    editReaderButton.addEventListener("click", function () {
        if (currentReaderRef) {
            openEditor(currentReaderRef);
        }
    });

    shareReaderButton.addEventListener("click", shareCurrentBlog);
    closeReaderButton.addEventListener("click", closeReader);
    readerModal.addEventListener("click", function (event) {
        if (event.target === readerModal) {
            closeReader();
        }
    });

    closeEditorButton.addEventListener("click", function () {
        closeEditor(true);
    });

    previewEditorButton.addEventListener("click", togglePreview);
    publishEditorButton.addEventListener("click", persistEditor);

    editorTitleInput.addEventListener("input", function () {
        editorState.title = editorTitleInput.value;
        scheduleDraftSave();
    });

    [
        [blogBackgroundColor, "background"],
        [blogSurfaceColor, "surface"],
        [blogTextColor, "text"],
        [blogAccentColor, "accent"]
    ].forEach(function (entry) {
        const input = entry[0];
        const field = entry[1];
        input.addEventListener("input", function () {
            editorState.theme[field] = normalizeHexColor(input.value, editorState.theme[field]);
            syncThemeControls();
            scheduleDraftSave();
        });
    });

    addBlogImageButton.addEventListener("click", function () {
        blogImageUpload.click();
    });

    blogImageUpload.addEventListener("change", async function () {
        await addUploadedImages(blogImageUpload.files);
        blogImageUpload.value = "";
    });

    editorBlocks.addEventListener("input", function (event) {
        const item = event.target.closest("[data-block-index]");
        const field = event.target.dataset.blockField;
        if (!item || !field) {
            return;
        }

        const index = Number(item.dataset.blockIndex);
        if (!editorState.blocks[index]) {
            return;
        }

        editorState.blocks[index][field] = event.target.value;
        if (event.target.tagName === "TEXTAREA") {
            autoGrow(event.target);
        }
        scheduleDraftSave();
    });

    editorBlocks.addEventListener("focusin", function (event) {
        const item = event.target.closest("[data-block-index]");
        if (item) {
            editorInsertIndex = Number(item.dataset.blockIndex);
            editorBlocks.querySelectorAll(".editor-block.selected").forEach(function (block) {
                block.classList.remove("selected");
            });
            item.classList.add("selected");
        }
    });

    editorBlocks.addEventListener("click", function (event) {
        const formatButton = event.target.closest("[data-format-command]");
        const button = event.target.closest("[data-block-action]");
        const item = event.target.closest("[data-block-index]");
        if (!item) {
            return;
        }

        const index = Number(item.dataset.blockIndex);
        if (formatButton) {
            updateBlockFormat(index, formatButton.dataset.formatCommand);
            return;
        }
        if (!button) {
            return;
        }
        if (button.dataset.blockAction === "up") {
            moveBlock(index, -1);
        } else if (button.dataset.blockAction === "down") {
            moveBlock(index, 1);
        } else if (button.dataset.blockAction === "remove") {
            removeBlock(index);
        }
    });

    editorModal.addEventListener("click", function (event) {
        const addButton = event.target.closest("[data-add-block]");
        if (addButton) {
            addBlock(addButton.dataset.addBlock);
            return;
        }

        const themePreset = event.target.closest("[data-blog-theme-preset]");
        if (themePreset) {
            editorState.theme = Object.assign({}, BLOG_THEME_PRESETS[themePreset.dataset.blogThemePreset]);
            syncThemeControls();
            scheduleDraftSave();
            setDraftStatus("Tema aplicado", "saved");
            return;
        }

        const coverOption = event.target.closest("[data-cover]");
        if (coverOption) {
            editorState.cover = safeCoverSrc(coverOption.dataset.cover);
            syncCoverPicker();
            scheduleDraftSave();
            return;
        }

        const bannerOption = event.target.closest("[data-banner-src]");
        if (bannerOption) {
            const alreadyPresent = editorState.blocks.some(function (block) {
                return block.type === "image" && block.src === bannerOption.dataset.bannerSrc;
            });
            if (alreadyPresent && !window.confirm("Este banner ya está en el blog. ¿Quieres repetirlo?")) {
                return;
            }
            addBlock("image", {
                src: bannerOption.dataset.bannerSrc,
                alt: bannerOption.dataset.bannerAlt || "Decoración del blog"
            });
            setDraftStatus("Banner añadido", "");
        }
    });

    window.addEventListener("beforeunload", function (event) {
        if (editorOpen) {
            const saved = saveDraftNow();
            if (!saved && editorDirty) {
                event.preventDefault();
                event.returnValue = "";
            }
        }
    });

    document.addEventListener("keydown", function (event) {
        const activeModal = editorModal.classList.contains("active")
            ? editorModal
            : (readerModal.classList.contains("active") ? readerModal : null);

        if (event.key === "Tab" && activeModal) {
            trapFocus(event, activeModal);
            return;
        }

        if (event.key !== "Escape") {
            return;
        }

        if (editorModal.classList.contains("active")) {
            closeEditor(true);
        } else if (readerModal.classList.contains("active")) {
            closeReader();
        }
    });

    prepareDefaultBlogs();
    prepareUserPosts();
    renderPosts();
})();
