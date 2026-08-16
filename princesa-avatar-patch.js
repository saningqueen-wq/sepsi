(function () {
    "use strict";

    const PRINCESA_AVATAR = "img/princesa-avatar.jpg";

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
            image.addEventListener("error", function () {
                image.src = PRINCESA_AVATAR;
            }, { once: true });
        });

        document.querySelectorAll("#wiki .wiki-card:not(.new-wiki)").forEach(function (card) {
            const label = card.querySelector("span");
            const image = card.querySelector("img");

            if (label && image && /sobre ella/i.test(label.textContent || "")) {
                image.src = PRINCESA_AVATAR;
                image.alt = "Princesa";
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyPrincessAvatar, { once: true });
    } else {
        applyPrincessAvatar();
    }
})();
