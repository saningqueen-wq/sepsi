// ===========================================
// CAMBIO DE PESTAÑAS
// ===========================================

function readLocalJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
        return fallback;
    }
}

const tabs =
    document.querySelectorAll(".profile-tab");

const sections =
    document.querySelectorAll(".content-section");


tabs.forEach(tab => {

    tab.addEventListener("click", () => {

        tabs.forEach(item => {
            item.classList.remove("active");
        });

        sections.forEach(section => {
            section.classList.remove("active");
        });


        tab.classList.add("active");


        const section =
            document.getElementById(
                tab.dataset.section
            );

        section.classList.add("active");

    });

});


// ===========================================
// MURO
// ===========================================

const commentInput =
    document.getElementById("commentInput");

const sendComment =
    document.getElementById("sendComment");

const comments =
    document.getElementById("comments");


let savedComments = readLocalJson("amino-comments", []);

if (!Array.isArray(savedComments)) {
    savedComments = [];
}

savedComments = savedComments
    .filter(comment => comment && typeof comment === "object")
    .map(comment => ({
        text: String(comment.text ?? ""),
        date: String(comment.date ?? "")
    }))
    .filter(comment => comment.text.trim());


function renderComments() {

    savedComments.forEach(comment => {

        comments.insertAdjacentHTML(
            "beforeend",

            `

            <div class="comment user-comment">

                <img
                    class="comment-avatar"
                    src="img/perfil.jpg"
                    onerror="this.src='https://i.pinimg.com/736x/0c/67/30/0c673029324220a35d23c2cf67862175.jpg'"
                >

                <div>

                    <strong>
                        빛─❝ K a i ;;✦
                    </strong>

                    <p>
                        ${comment.text}
                    </p>

                    <small>
                        ${comment.date}
                        · Responder
                    </small>

                </div>

                <button>
                    ♡
                </button>

            </div>

            `
        );

    });

}


renderComments();


sendComment.addEventListener(
    "click",

    () => {

        const text =
            commentInput.value.trim();


        if (!text) {

            return;

        }


        const comment = {

            text,

            date:
                new Date()
                .toLocaleDateString(
                    "es-MX"
                )

        };


        savedComments.push(comment);


        localStorage.setItem(
            "amino-comments",
            JSON.stringify(savedComments)
        );


        comments.insertAdjacentHTML(

            "beforeend",

            `

            <div class="comment">

                <img
                    class="comment-avatar"
                    src="img/perfil.jpg"
                    onerror="this.src='https://i.pinimg.com/736x/0c/67/30/0c673029324220a35d23c2cf67862175.jpg'"
                >

                <div>

                    <strong>
                        빛─❝ K a i ;;✦
                    </strong>

                    <p>
                        ${text}
                    </p>

                    <small>
                        ahora · Responder
                    </small>

                </div>

                <button>
                    ♡
                </button>

            </div>

            `
        );


        commentInput.value = "";

    }

);


// ENTER PARA COMENTAR

commentInput.addEventListener(
    "keydown",

    event => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendComment.click();

        }

    }
);


// ===========================================
// CREAR POST
// ===========================================

// El creador original se conserva como referencia, pero el editor por bloques
// que se inicializa más abajo es ahora la única fuente de creación y edición.
if (false) {

const postModal =
    document.getElementById(
        "postModal"
    );


const createPost =
    document.getElementById(
        "createPost"
    );


const closePostModal =
    document.getElementById(
        "closePostModal"
    );


createPost.addEventListener(
    "click",
    () => {

        postModal.classList.add(
            "active"
        );

    }
);


closePostModal.addEventListener(
    "click",
    () => {

        postModal.classList.remove(
            "active"
        );

    }
);


// cerrar tocando fuera

postModal.addEventListener(
    "click",
    event => {

        if (
            event.target === postModal
        ) {

            postModal.classList.remove(
                "active"
            );

        }

    }
);


// ===========================================
// PUBLICAR
// ===========================================

const publishPost =
    document.getElementById(
        "publishPost"
    );


const postsList =
    document.getElementById(
        "postsList"
    );


let userPosts =
    JSON.parse(
        localStorage.getItem(
            "amino-posts"
        )
    ) || [];

// Limpiar posts en formato viejo (sin title/content válido)
userPosts = userPosts.filter(p => p && p.title && p.content);
localStorage.setItem("amino-posts", JSON.stringify(userPosts));


function generatePost(post, index) {

    const imgSrc = post.image ||
        "https://i.pinimg.com/736x/e1/d7/af/e1d7afc9e49e2cce50e25588264338c0.jpg";

    return `
        <article class="amino-post-card amino-feed-card user-created-post" data-post-index="${index}">
            <div class="amino-post-header">
                <span class="amino-post-time">ahora</span>
                <button class="amino-post-dots user-post-delete" data-index="${index}" title="Eliminar">✕</button>
            </div>
            <div class="amino-post-text-row">
                <h3 class="amino-post-title">${post.title}</h3>
                <p class="amino-post-preview">${post.content}</p>
            </div>
            <div class="amino-post-images">
                <img src="${imgSrc}"
                     onerror="this.src='https://i.pinimg.com/736x/e1/d7/af/e1d7afc9e49e2cce50e25588264338c0.jpg'">
            </div>
            <div class="amino-post-footer">
                <button class="amino-post-action">♡ 0</button>
                <button class="amino-post-action">💬 0</button>
                <button class="amino-post-action share-btn">➦</button>
            </div>
        </article>
    `;

}


// CARGAR GUARDADOS

userPosts.forEach((post, index) => {

    postsList.insertAdjacentHTML(
        "afterbegin",
        generatePost(post, index)
    );

});


// Borrar post de usuario
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("user-post-delete")) {
        e.stopPropagation();
        const idx = parseInt(e.target.dataset.index);
        if (confirm("¿Eliminar esta publicación?")) {
            userPosts.splice(idx, 1);
            localStorage.setItem("amino-posts", JSON.stringify(userPosts));
            // Re-render
            document.querySelectorAll(".user-created-post").forEach(el => el.remove());
            userPosts.forEach((post, i) => {
                postsList.insertAdjacentHTML("afterbegin", generatePost(post, i));
            });
        }
    }
});


publishPost.addEventListener(
    "click",

    () => {

        const title =
            document
            .getElementById(
                "newPostTitle"
            )
            .value
            .trim();


        const content =
            document
            .getElementById(
                "newPostContent"
            )
            .value
            .trim();


        const image =
            document
            .getElementById(
                "newPostImage"
            )
            .value
            .trim();


        if (
            !title ||
            !content
        ) {

            alert(
                "Escribe un título y contenido."
            );

            return;

        }


        const post = {

            title,
            content,
            image

        };


        userPosts.unshift(post);


        localStorage.setItem(

            "amino-posts",

            JSON.stringify(
                userPosts
            )

        );


        postsList.insertAdjacentHTML(

            "afterbegin",

            generatePost(post, 0)

        );


        document
            .getElementById(
                "newPostTitle"
            )
            .value =
            "";


        document
            .getElementById(
                "newPostContent"
            )
            .value =
            "";


        document
            .getElementById(
                "newPostImage"
            )
            .value =
            "";


        postModal.classList.remove(
            "active"
        );

    }

);

}


// ===========================================
// LIKES (muro / post general)
// ===========================================

document.addEventListener(
    "click",

    event => {

        if (
            event.target.classList
                .contains("like-button")
        ) {

            const current =
                event.target.textContent
                .trim();


            const number =
                parseInt(
                    current.replace(
                        /\D/g,
                        ""
                    )
                ) || 0;


            event.target.textContent =
                `♥ ${number + 1}`;

        }

    }

);


// ===========================================
// MODAL BIOGRAFÍA
// ===========================================

const bioModal =
    document.getElementById("bioModal");

const openBioModal =
    document.getElementById("openBioModal");

const closeBioModal =
    document.getElementById("closeBioModal");


openBioModal.addEventListener("click", () => {

    bioModal.classList.add("active");

});


closeBioModal.addEventListener("click", () => {

    bioModal.classList.remove("active");

});


bioModal.addEventListener("click", event => {

    if (event.target === bioModal) {

        bioModal.classList.remove("active");

    }

});


// Comentar en la biografía
const sendBioComment = document.getElementById("sendBioComment");
const bioCommentInput = document.getElementById("bioCommentInput");
const bioCommentList = document.getElementById("bioCommentList");

sendBioComment.addEventListener("click", () => {
    const text = bioCommentInput.value.trim();
    if (!text) return;

    bioCommentList.insertAdjacentHTML(
        "beforeend",
        `
        <div class="comment">
            <img class="comment-avatar"
                src="img/perfil.jpg"
                onerror="this.src='https://i.pinimg.com/736x/0c/67/30/0c673029324220a35d23c2cf67862175.jpg'"
            >
            <div>
                <strong>빵─❭ K a i ;;✦</strong>
                <p>${text}</p>
                <small>ahora · Responder</small>
            </div>
            <button>♡</button>
        </div>
        `
    );
    bioCommentInput.value = "";
});

bioCommentInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendBioComment.click();
    }
});


// ===========================================
// EDITAR BIOGRAFÍA
// ===========================================

const bioEditBtn = document.getElementById("bioEditBtn");
const bioText = document.querySelector(".bio-modal-text");
const bioAddLine = document.getElementById("bioAddLine");
let bioEditing = false;

bioEditBtn.addEventListener("click", () => {

    bioEditing = !bioEditing;

    if (bioEditing) {
        // Activar modo edición
        bioEditBtn.textContent = "✓ Guardar";
        bioEditBtn.classList.add("editing");
        bioText.classList.add("editing");

        // Hacer cada .bio-c editable y agregar botón borrar
        bioText.querySelectorAll(".bio-c").forEach(p => {
            p.setAttribute("contenteditable", "true");
            if (!p.querySelector(".bio-delete-line")) {
                const del = document.createElement("button");
                del.className = "bio-delete-line";
                del.textContent = "×";
                del.addEventListener("click", () => {
                    p.remove();
                });
                p.style.position = "relative";
                p.appendChild(del);
            }
        });

    } else {
        // Guardar y desactivar
        bioEditBtn.textContent = "✎ Editar";
        bioEditBtn.classList.remove("editing");
        bioText.classList.remove("editing");

        // Quitar contenteditable y botones borrar
        bioText.querySelectorAll(".bio-c").forEach(p => {
            p.removeAttribute("contenteditable");
            const del = p.querySelector(".bio-delete-line");
            if (del) del.remove();
        });

        // Guardar en localStorage
        const lines = [];
        bioText.querySelectorAll(".bio-c").forEach(p => {
            lines.push(p.textContent.trim());
        });
        localStorage.setItem("amino-bio", JSON.stringify(lines));
    }
});


// Agregar línea nueva
bioAddLine.addEventListener("click", () => {
    const newP = document.createElement("p");
    newP.className = "bio-c";
    newP.setAttribute("contenteditable", "true");
    newP.textContent = "Nueva línea...";
    newP.style.position = "relative";

    const del = document.createElement("button");
    del.className = "bio-delete-line";
    del.textContent = "×";
    del.addEventListener("click", () => {
        newP.remove();
    });
    newP.appendChild(del);

    // Insertar antes de las reacciones
    const reactions = bioText.querySelector(".bio-reactions");
    if (reactions) {
        bioText.insertBefore(newP, reactions);
    } else {
        bioText.insertBefore(newP, bioAddLine);
    }

    newP.focus();
});


// Cargar bio guardada
const savedBioValue = readLocalJson("amino-bio", null);
const savedBio = Array.isArray(savedBioValue) ? savedBioValue : null;

if (savedBio && savedBio.length > 0) {
    const existing = bioText.querySelectorAll(".bio-c");
    existing.forEach(p => p.remove());

    const reactions = bioText.querySelector(".bio-reactions");
    savedBio.forEach(line => {
        const p = document.createElement("p");
        p.className = "bio-c";
        p.textContent = line;
        if (reactions) {
            bioText.insertBefore(p, reactions);
        } else {
            bioText.insertBefore(p, bioAddLine);
        }
    });
}

// ===========================================
// DATOS DE LOS 5 BLOGS
// ===========================================

var blogsData = [

    {
        title: "you are my reality",
        cover: "img/blog1.jpg",
        coverFallback: "https://i.pinimg.com/736x/e9/70/03/e97003a091125b9b3e5108ad646cc6e7.jpg",
        likes: 205,
        content: `
            <p>꒰ ☁ ꒱ . . . you are my reality</p>
            <p>╭──────────────╮</p>
            <p>Hay momentos en la vida donde todo
            parece difuso, como si el mundo estuviera
            envuelto en niebla... y entonces apareces tú.</p>
            <p>Como un destello de luz entre la oscuridad,
            como el primer rayo de sol después de días grises.</p>
            <p>꒰ ♡ ꒱ Eres mi realidad. La única que quiero.</p>
            <p>Cuando estoy contigo, todo lo demás desaparece.
            El ruido, el miedo, las dudas... todo se silencia.</p>
            <p>Solo quedas tú.</p>
            <p>╰──────────────╯</p>
            <p>❝ In this world, you are my reality ❞</p>
        `
    },

    {
        title: "my serendipity",
        cover: "img/blog2.jpg",
        coverFallback: "https://i.pinimg.com/736x/e1/d7/af/e1d7afc9e49e2cce50e25588264338c0.jpg",
        likes: 112,
        content: `
            <p>꒰ ✦ ꒱ . . . my serendipity</p>
            <p>╭──────────────╮</p>
            <p>Serendipidad: el arte de encontrar
            algo maravilloso sin haberlo buscado.</p>
            <p>Eso eres tú. Un accidente hermoso.
            Un regalo que no esperaba.</p>
            <p>꒰ 🌙 ꒱ Llegaste sin avisar,
            y te quedaste en cada parte de mí.</p>
            <p>En mis pensamientos al despertar,
            en mis sueños al dormir,
            en cada canción que escucho.</p>
            <p>Mi serendipidad.</p>
            <p>╰──────────────╯</p>
            <p>❝ Lucky I found you ❞</p>
        `
    },

    {
        title: "you save me",
        cover: "img/blog3.jpg",
        coverFallback: "https://i.pinimg.com/736x/98/36/e9/9836e9e634a1abff4a615666374631cd.jpg",
        likes: 88,
        content: `
            <p>꒰ 💫 ꒱ . . . you save me</p>
            <p>╭──────────────╮</p>
            <p>Hubo un tiempo en que me perdí a mí misma.
            Caminando sin rumbo, sin saber a dónde ir.</p>
            <p>Y entonces llegaste tú.</p>
            <p>꒰ ♡ ꒱ No me rescataste como en un cuento de hadas.
            Lo hiciste de una manera más real, más tuya.</p>
            <p>Con tu presencia.
            Con tus palabras.
            Con ese silencio cómodo que solo tú sabes crear.</p>
            <p>Me salvaste siendo tú mismo.</p>
            <p>╰──────────────╯</p>
            <p>❝ You are my saving grace ❞</p>
        `
    },

    {
        title: "my world with you",
        cover: "img/blog4.jpg",
        coverFallback: "https://i.pinimg.com/736x/b1/e1/d1/b1e1d1842f6097bafc27ba60595a7b59.jpg",
        likes: 176,
        content: `
            <p>꒰ 🌍 ꒱ . . . my world with you</p>
            <p>╭──────────────╮</p>
            <p>Mi mundo contigo es distinto.</p>
            <p>Los colores son más brillantes,
            los días más largos,
            las noches más cálidas.</p>
            <p>꒰ ✿ ꒱ Contigo aprendí que
            el mundo puede ser un lugar hermoso.</p>
            <p>Que hay momentos que valen la pena,
            personas que cambian tu vida,
            y tú eres una de ellas.</p>
            <p>Mi mundo solo tiene sentido contigo.</p>
            <p>╰──────────────╯</p>
            <p>❝ The world is beautiful with you ❞</p>
        `
    },

    {
        title: "Mr Jealous",
        cover: "img/blog5.jpg",
        coverFallback: "https://i.pinimg.com/736x/e2/cc/08/e2cc080655f4f11de7be16641022f6aa.jpg",
        likes: 240,
        content: `
            <p>꒰ 👀 ꒱ . . . mr jealous</p>
            <p>╭──────────────╮</p>
            <p>Y sí, lo admito.</p>
            <p>Me pone celosa cuando alguien
            te hace reír de esa manera.</p>
            <p>Esa risa que sé que solo yo debería provocar.</p>
            <p>꒰ ♡ ꒱ Pero no lo digo con enojo.
            Lo digo porque te quiero tanto
            que a veces asusta.</p>
            <p>Porque me importas de una forma
            que no sé explicar bien con palabras.</p>
            <p>Solo sé que eres mío.</p>
            <p>Y yo soy tuya.</p>
            <p>╰──────────────╯</p>
            <p>❝ I'm just a little jealous ❞</p>
        `
    }

];


// ===========================================
// MODAL BLOG (lector estilo Amino)
// ===========================================

const blogModal =
    document.getElementById("blogModal");

const closeBlogModal =
    document.getElementById("closeBlogModal");

const blogModalTitle =
    document.getElementById("blogModalTitle");

const blogModalCover =
    document.getElementById("blogModalCover");

const blogModalBody =
    document.getElementById("blogModalBody");

const blogModalLikeBtn =
    document.getElementById("blogModalLikeBtn");

const blogModalLikeCount =
    document.getElementById("blogModalLikeCount");


let currentBlogLikes = 0;
let blogLiked = false;


// Abrir blog al hacer click en una card

document.querySelectorAll(".blog-card").forEach(card => {

    card.addEventListener("click", () => {

        const index = parseInt(card.dataset.blog);
        const blog = blogsData[index];

        if (!blog) return;

        blogModalTitle.textContent = blog.title;

        blogModalCover.style.backgroundImage =
            `url('${blog.cover}'), url('${blog.coverFallback}')`;

        blogModalBody.innerHTML = blog.content;

        currentBlogLikes = blog.likes;
        blogLiked = false;
        blogModalLikeBtn.textContent = "♡";
        blogModalLikeBtn.classList.remove("liked");
        blogModalLikeCount.textContent = currentBlogLikes;

        blogModal.classList.add("active");

        blogModal.querySelector(".modal-blog").scrollTop = 0;

    });

});


// Botón like dentro del blog modal

blogModalLikeBtn.addEventListener("click", () => {

    if (!blogLiked) {

        blogLiked = true;
        currentBlogLikes++;
        blogModalLikeBtn.textContent = "♥";
        blogModalLikeBtn.classList.add("liked");
        blogModalLikeBtn.setAttribute("aria-pressed", "true");

    } else {

        blogLiked = false;
        currentBlogLikes--;
        blogModalLikeBtn.textContent = "♡";
        blogModalLikeBtn.classList.remove("liked");
        blogModalLikeBtn.setAttribute("aria-pressed", "false");

    }

    blogModalLikeCount.textContent = currentBlogLikes;

});


// Cerrar blog modal

closeBlogModal.addEventListener("click", () => {

    blogModal.classList.remove("active");

});


blogModal.addEventListener("click", event => {

    if (event.target === blogModal) {

        blogModal.classList.remove("active");

    }

});


// Comentar en blog modal

const sendBlogComment =
    document.getElementById("sendBlogComment");

const blogCommentInput =
    document.getElementById("blogCommentInput");

const blogCommentList =
    document.getElementById("blogCommentList");


sendBlogComment.addEventListener("click", () => {

    const text = blogCommentInput.value.trim();

    if (!text) return;

    blogCommentList.insertAdjacentHTML(
        "beforeend",
        `
        <div class="comment">
            <img class="comment-avatar"
                src="img/perfil.jpg"
                onerror="this.src='https://i.pinimg.com/736x/0c/67/30/0c673029324220a35d23c2cf67862175.jpg'"
            >
            <div>
                <strong>빛─❝ K a i ;;✦</strong>
                <p>${text}</p>
                <small>ahora · Responder</small>
            </div>
            <button>♡</button>
        </div>
        `
    );

    blogCommentInput.value = "";

});


blogCommentInput.addEventListener("keydown", e => {

    if (e.key === "Enter") {
        e.preventDefault();
        sendBlogComment.click();
    }

});


// ===========================================
// SISTEMA DE TEMAS / COLORES (NUEVO)
// ===========================================

const themePanel    = document.getElementById("themePanel");
const themeOverlay  = document.getElementById("themeOverlay");
const openThemeBtn  = document.getElementById("openThemePanel");
const closeThemeBtn = document.getElementById("closeThemePanel");
const themeResetBtn = document.getElementById("themeReset");
const customPicker  = document.getElementById("customColorPicker");
const swatchCustom  = document.getElementById("swatchCustom");

// Abrir panel
openThemeBtn.addEventListener("click", () => {
    themePanel.classList.add("open");
    themeOverlay.classList.add("active");
});

// Cerrar panel
function closeTheme() {
    themePanel.classList.remove("open");
    themeOverlay.classList.remove("active");
}

closeThemeBtn.addEventListener("click", closeTheme);
themeOverlay.addEventListener("click", closeTheme);


let activeAccent = "#18c67e";
let activeBackground = "#eeeeec";


function normalizeThemeColor(color) {
    const value = String(color || "").trim().toLowerCase();

    if (/^#[0-9a-f]{6}$/.test(value)) return value;

    if (/^#[0-9a-f]{3}$/.test(value)) {
        return "#" + value.slice(1).split("").map(char => char + char).join("");
    }

    return null;
}


function themeRgb(color) {
    const normalized = normalizeThemeColor(color);
    if (!normalized) return null;

    return {
        r: parseInt(normalized.slice(1, 3), 16),
        g: parseInt(normalized.slice(3, 5), 16),
        b: parseInt(normalized.slice(5, 7), 16)
    };
}


function mixThemeColor(baseColor, blendColor, blendAmount) {
    const base = themeRgb(baseColor);
    const blend = themeRgb(blendColor);
    const amount = Math.max(0, Math.min(1, blendAmount));

    const channel = (first, second) =>
        Math.round(first + (second - first) * amount)
            .toString(16)
            .padStart(2, "0");

    return `#${channel(base.r, blend.r)}${channel(base.g, blend.g)}${channel(base.b, blend.b)}`;
}


function themeLuminance(color) {
    const rgb = themeRgb(color);
    const channels = [rgb.r, rgb.g, rgb.b].map(value => {
        const normalized = value / 255;
        return normalized <= 0.03928
            ? normalized / 12.92
            : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}


function themeContrastColor(color) {
    const luminance = themeLuminance(color);
    const whiteContrast = 1.05 / (luminance + 0.05);
    const darkContrast = (luminance + 0.05) / 0.05;

    return darkContrast > whiteContrast ? "#171717" : "#ffffff";
}


function setThemeVariable(name, value) {
    document.documentElement.style.setProperty(name, value);
}


// --- Aplicar color de acento ---
function applyAccent(color) {

    const normalized = normalizeThemeColor(color);
    if (!normalized) return;

    activeAccent = normalized;

    setThemeVariable("--amino-green", normalized);
    setThemeVariable("--accent-color", normalized);
    setThemeVariable("--accent-middle", mixThemeColor(normalized, "#000000", 0.38));
    setThemeVariable("--accent-deep", mixThemeColor(normalized, "#000000", 0.56));
    setThemeVariable("--accent-darker", mixThemeColor(normalized, "#000000", 0.70));
    setThemeVariable("--accent-contrast", themeContrastColor(normalized));
    setThemeVariable("--theme-separator", normalized);

    // Marca swatch seleccionado
    document.querySelectorAll(".swatch").forEach(swatch => {
        const swatchColor = normalizeThemeColor(swatch.dataset.color);
        swatch.classList.toggle("selected", swatchColor === normalized);
    });

    localStorage.setItem("theme-accent", normalized);
}


// --- Aplicar color de fondo ---
function applyBg(color) {

    const normalized = normalizeThemeColor(color);
    if (!normalized) return;

    activeBackground = normalized;

    const darkTheme = themeLuminance(normalized) < 0.24;
    const surface = darkTheme
        ? mixThemeColor(normalized, "#ffffff", 0.07)
        : mixThemeColor(normalized, "#ffffff", 0.72);
    const mutedSurface = darkTheme
        ? mixThemeColor(normalized, "#000000", 0.12)
        : mixThemeColor(normalized, "#000000", 0.035);
    const elevatedSurface = darkTheme
        ? mixThemeColor(normalized, "#ffffff", 0.13)
        : mixThemeColor(normalized, "#ffffff", 0.90);
    const border = darkTheme
        ? mixThemeColor(normalized, "#ffffff", 0.20)
        : mixThemeColor(normalized, "#000000", 0.12);

    setThemeVariable("--page-bg", normalized);
    setThemeVariable("--surface-bg", surface);
    setThemeVariable("--surface-muted", mutedSurface);
    setThemeVariable("--surface-elevated", elevatedSurface);
    setThemeVariable("--text-primary", darkTheme ? "#f5f5f5" : "#222222");
    setThemeVariable("--text-secondary", darkTheme ? "#b9b9b9" : "#777777");
    setThemeVariable("--theme-border", border);

    localStorage.setItem("theme-bg", normalized);

    // Marca bg-opt activo
    document.querySelectorAll(".bg-opt").forEach(b => {
        b.classList.toggle(
            "active",
            normalizeThemeColor(b.dataset.bg) === normalized
        );
    });
}


// --- Swatches de color de acento ---
document.querySelectorAll(".swatch:not(.swatch-custom)").forEach(swatch => {
    swatch.addEventListener("click", () => {
        applyAccent(swatch.dataset.color);
    });
});


// --- Swatch personalizado (color picker) ---
customPicker.addEventListener("input", () => {
    const color = customPicker.value;
    swatchCustom.style.background = color;
    applyAccent(color);
});

swatchCustom.addEventListener("click", () => {
    customPicker.click();
});


// --- Opciones de fondo ---
document.querySelectorAll(".bg-opt").forEach(btn => {
    btn.addEventListener("click", () => {
        applyBg(btn.dataset.bg);
    });
});


// --- Presets completos ---
document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        applyAccent(btn.dataset.accent);
        applyBg(btn.dataset.bg);

        document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});


// --- Restaurar predeterminado ---
themeResetBtn.addEventListener("click", () => {
    applyAccent("#18c67e");
    applyBg("#eeeeec");
    document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
    localStorage.removeItem("theme-accent");
    localStorage.removeItem("theme-bg");
});


// --- Cargar tema guardado al inicio ---
const savedAccent = localStorage.getItem("theme-accent");
const savedBg     = localStorage.getItem("theme-bg");

if (savedAccent) applyAccent(savedAccent);
if (savedBg)     applyBg(savedBg);
