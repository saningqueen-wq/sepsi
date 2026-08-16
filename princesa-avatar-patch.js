(function () {
    "use strict";

    const PRINCESA_AVATAR = "img/15228476856ed85cdc6d585b92c87b27.jpg?v=3";

    function setPrincessAvatar(comment) {
        if (!comment || comment.nodeType !== 1) {
            return;
        }

        const name = comment.querySelector("strong, .comment-name, .author, .username");
        if (!name || !/princesa/i.test(name.textContent || "")) {
            return;
        }

        const avatar = comment.querySelector("img.comment-avatar, img.blog-comment-avatar, img[class*='avatar'], img");
        if (!avatar) {
            return;
        }

        avatar.src = PRINCESA_AVATAR;
        avatar.alt = "Avatar de princesa";
        avatar.removeAttribute("srcset");
        avatar.style.objectFit = "cover";
        avatar.style.borderRadius = "50%";
        avatar.onerror = function () {
            this.onerror = null;
            this.src = "img/15228476856ed85cdc6d585b92c87b27.jpg?v=3";
        };
    }

    function applyPrincessAvatar(root) {
        const scope = root && root.querySelectorAll ? root : document;

        if (scope.matches && scope.matches(".comment, .blog-comment, [class*='comment']")) {
            setPrincessAvatar(scope);
        }

        scope.querySelectorAll(".comment, .blog-comment, [class*='comment']").forEach(setPrincessAvatar);

        document.querySelectorAll("#wiki .wiki-card:not(.new-wiki) img").forEach(function (image) {
            image.src = PRINCESA_AVATAR;
            image.alt = "Imagen de princesa";
            image.removeAttribute("srcset");
            image.onerror = null;
        });
    }

    function startObserver() {
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType === 1) {
                        applyPrincessAvatar(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function init() {
        applyPrincessAvatar(document);
        startObserver();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
