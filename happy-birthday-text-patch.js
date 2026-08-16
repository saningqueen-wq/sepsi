(function () {
    "use strict";

    if (typeof blogsData === "undefined" || !Array.isArray(blogsData)) {
        return;
    }

    const blog = blogsData.find(function (item) {
        return item && item.id === "happy-birthday-my-love";
    });

    if (!blog || !Array.isArray(blog.blocks)) {
        return;
    }

    const additions = [
        {
            startsWith: "Celebrar tu cumpleaños también es celebrar cada versión de ti:",
            text: " Y sí, muchas veces me avergüenzo contigo; no porque me incomode, sino porque eres demasiado bonita y a veces simplemente no sé cómo reaccionar. Peor todavía cuando me dices ciertas cosas o haces algo a propósito solo para verme ponerme nervioso, porque sabes perfectamente el efecto que tienes en mí."
        },
        {
            startsWith: "Guardo con especial cariño la forma en que poco a poco te volviste parte de mis días.",
            text: " También guardo esos momentos en los que consigues avergonzarme con una sola frase, una mirada o alguna cosa que haces sabiendo exactamente cómo voy a reaccionar. Me da vergüenza admitirlo, pero muchas veces es porque te veo demasiado bonita y se me olvida por completo cómo hacerme el tranquilo."
        },
        {
            startsWith: "Gracias por escucharme, incluso cuando mis pensamientos salen desordenados.",
            text: " Y gracias también por esas veces en las que me haces avergonzar a propósito. A veces dices algo bonito, haces un gesto o simplemente decides molestarme un poquito porque ya sabes que voy a ponerme nervioso; y aunque intente disimularlo, casi nunca puedo, sobre todo porque viniendo de ti todo me afecta el doble de lo bonita que eres."
        },
        {
            startsWith: "Cuando pienso en el futuro, no imagino únicamente grandes promesas.",
            text: " También quiero seguir teniendo esos momentos en los que me avergüenzo por algo que me dices o haces intencionalmente para verme reaccionar, mientras yo intento fingir que no pasa nada. Sé que probablemente vas a seguir haciéndolo porque conoces perfectamente mis puntos débiles, y la verdad es que una parte de mí espera que nunca dejes de hacerlo."
        }
    ];

    additions.forEach(function (addition) {
        const block = blog.blocks.find(function (candidate) {
            return candidate &&
                candidate.type === "paragraph" &&
                typeof candidate.text === "string" &&
                candidate.text.indexOf(addition.startsWith) === 0;
        });

        if (!block || block.text.indexOf(addition.text.trim()) !== -1) {
            return;
        }

        block.text += addition.text;
    });
})();
