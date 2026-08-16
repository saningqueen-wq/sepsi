(function () {
    "use strict";

    const PRINCESA_AVATAR = "img/15228476856ed85cdc6d585b92c87b27.jpg";

    function applyPrincessAvatar() {
        document.querySelectorAll("#comments .comment").forEach(function (comment) {
            const name = comment.querySelector("strong");
            const avatar = comment.querySelector(".comment-avatar");

            if (!name || !avatar || !/princesa/i.test(name.textContent || "")) {
                return;
            }

            avatar.src = PRINCESA_AVATAR;
            avatar.alt = "Avatar de princesa";
            avatar.onerror = null;
        });

        document.querySelectorAll("#wiki .wiki-card:not(.new-wiki) img").forEach(function (image) {
            image.src = PRINCESA_AVATAR;
            image.alt = "Imagen de princesa";
            image.onerror = null;
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyPrincessAvatar, { once: true });
    } else {
        applyPrincessAvatar();
    }
})();
