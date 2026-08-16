(function () {
    "use strict";

    if (typeof blogsData === "undefined" || !Array.isArray(blogsData)) {
        return;
    }

    function format(align, extra) {
        return Object.assign({
            bold: false,
            italic: false,
            underline: false,
            strike: false,
            align: align || "left"
        }, extra || {});
    }

    function textBlock(id, type, text, blockFormat) {
        return {
            id: id,
            type: type,
            text: text,
            format: blockFormat || format(type === "heading" || type === "quote" ? "center" : "left")
        };
    }

    const blog = blogsData.find(function (item) {
        return item && item.id === "mr-jealous";
    });

    if (!blog || !Array.isArray(blog.blocks)) {
        return;
    }

    /* Corrige la voz para que hable desde "celoso". */
    blog.blocks.forEach(function (block) {
        if (!block || typeof block.text !== "string") {
            return;
        }

        if (block.text.indexOf("soy un poco celosa") !== -1) {
            block.text = block.text.replace("soy un poco celosa", "soy un poco celoso");
        }

        if (block.text.indexOf("01... LA CONFESIÓN") === 0) {
            block.text = "01... LA CONFESIÓN\n02... LO QUE DESPIERTA MIS CELOS\n03... NO ES ENOJO\n04... LO QUE EN REALIDAD QUIERO DECIR";
        }
    });

    const section02 = blog.blocks.findIndex(function (block) {
        return block && block.type === "heading" && typeof block.text === "string" &&
            block.text.indexOf("02") === 0 && block.text.indexOf("ESA RISA") !== -1;
    });

    const section03 = blog.blocks.findIndex(function (block, index) {
        return index > section02 && block && block.type === "heading" && typeof block.text === "string" &&
            block.text.indexOf("03") === 0;
    });

    if (section02 !== -1 && section03 !== -1) {
        const oldSection = blog.blocks.slice(section02, section03);
        const oldImage = oldSection.find(function (block) {
            return block && block.type === "image";
        });

        const replacement = [
            textBlock(
                "mrj-real-heading-02",
                "heading",
                "02\nLO QUE DESPIERTA MIS CELOS",
                format("center", { bold: true, underline: true })
            ),
            textBlock(
                "mrj-real-02-a",
                "paragraph",
                "Mis celos no nacen porque alguien te haga reír ni porque quiera ser dueño de cada momento bonito que vivas. Lo que realmente los despierta son esos hombres que no te conocen de verdad, de los que yo tampoco sé sus intenciones, y esa idea que aparece en mi cabeza de que alguno pueda acercarse para jugar contigo, confundirte o lastimarte. A veces el sentimiento simplemente nace antes de que yo alcance a razonarlo.",
                format("left")
            ),
            textBlock(
                "mrj-real-02-b",
                "paragraph",
                "Sé que dentro de esos celos puede aparecer una parte de mí que quisiera prohibirte ciertas cosas o pedirte que te alejes de alguien solo para sentirme tranquilo. Y justamente esa es una de las partes de mis celos que más odio. Porque sé que sentir algo no me da derecho a decidir tu vida. Tú tienes la libertad de vivir, conocer personas, tomar tus propias decisiones y seguir siendo tú. No quiero que mi miedo termine convirtiéndose en una jaula para la persona que amo.",
                format("left")
            ),
            textBlock(
                "mrj-real-02-quote",
                "quote",
                "Sentir celos es humano; convertirlos en una orden sería otra cosa. Por eso todavía estoy aprendiendo a sentirlos sin dejar que decidan por mí.",
                format("center", { bold: true, italic: true })
            ),
            textBlock(
                "mrj-real-02-c",
                "paragraph",
                "Antes me tragaba todo. Podía sentir una incomodidad enorme, imaginar mil cosas y quedarme callado hasta que el sentimiento se hacía más pesado de lo que debía. Ahora agradezco poder decírtelo. No porque espere que cambies tu vida cada vez que algo me dé celos, sino porque poder comunicarte lo que siento me ayuda a no convertir una emoción en silencio, distancia o resentimiento.",
                format("left")
            ),
            textBlock(
                "mrj-real-02-d",
                "paragraph",
                "Hubo una vez en particular en la que mis celos por un hombre se desataron muchísimo. Llegué a odiarlo dentro de mi cabeza y a desear que desapareciera de tu vida porque todo en mí quería proteger nuestro lugar. Pero no te obligué a apartarlo, no decidí por ti y no quise quitarte tu libertad. Te dejé vivir tu vida y lo que hice fue confesarte que sí, que estaba celoso. Ese momento también me enseñó que puedo sentir algo muy fuerte sin convertirlo en una prohibición.",
                format("left")
            ),
            textBlock(
                "mrj-real-02-e",
                "paragraph",
                "Al final los celos son un sentimiento humano que cualquiera puede llegar a vivir y desarrollar. Eso no significa que todo lo que nazca de ellos esté bien. Hay cosas que reconozco que debo trabajar, pensamientos que necesito cuestionar y maneras de reaccionar que quiero mejorar. Sigo trabajando en ello porque quiero que puedas sentirte amada sin dejar de sentirte libre.",
                format("left")
            )
        ];

        if (oldImage) {
            replacement.push(oldImage);
        }

        blog.blocks.splice.apply(blog.blocks, [section02, section03 - section02].concat(replacement));
    }
})();
