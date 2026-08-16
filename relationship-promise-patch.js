(function () {
    "use strict";

    if (typeof blogsData === "undefined" || !Array.isArray(blogsData)) {
        return;
    }

    function makeBlock(id, type, text, format) {
        return {
            id: id,
            type: type,
            text: text,
            format: Object.assign({
                bold: false,
                italic: false,
                underline: false,
                strike: false,
                align: type === "heading" || type === "quote" ? "center" : "left"
            }, format || {})
        };
    }

    const happy = blogsData.find(function (item) {
        return item && item.id === "happy-birthday-my-love";
    });

    if (happy && Array.isArray(happy.blocks)) {
        const alreadyHasPromise = happy.blocks.some(function (block) {
            return block && typeof block.text === "string" && block.text.indexOf("MI PROMESA PARA TI") !== -1;
        });

        const futureSectionExists = happy.blocks.some(function (block) {
            return block && block.type === "heading" && typeof block.text === "string" &&
                block.text.indexOf("EL FUTURO QUE QUIERO COMPARTIR") !== -1;
        });

        if (!alreadyHasPromise && futureSectionExists) {
            const promiseBlocks = [
                { id: "promise-divider-start", type: "divider" },
                makeBlock(
                    "promise-heading",
                    "heading",
                    "❝ MI PROMESA PARA TI ❞",
                    { bold: true, underline: true, align: "center" }
                ),
                makeBlock(
                    "promise-intro",
                    "paragraph",
                    "Después de todo lo que vivimos, hay algo que quiero dejarte escrito no solo como palabras bonitas de cumpleaños, sino como algo que quiero cumplir contigo: una promesa.",
                    { italic: true, align: "center" }
                ),
                makeBlock(
                    "promise-01",
                    "paragraph",
                    "Yo no te puedo decir qué significa el amor para mí sin que lo primero que piense sea en ti. No amé, ni creo poder amar, a alguien como te he amado a ti. Eres la única persona que realmente me conoció, que logró entrar en mi corazón, en mi mundo y en mi forma de pensar y vivir. Y yo, de la misma forma, contigo me comprometí para estar contigo.",
                    { align: "left" }
                ),
                makeBlock(
                    "promise-02",
                    "paragraph",
                    "Yo admito que en el pasado no fui perfecto. Cometí errores y hubo cosas que pude haber hecho mejor, pero siempre estaba esperándote, viéndote y anhelando que estuviéramos juntos. Intenté muchas cosas para comprenderte, conocerte más y hacer cosas que te gustaran, porque quería que pudiéramos compartirlas y vivirlas juntos.",
                    { align: "left" }
                ),
                makeBlock(
                    "promise-03",
                    "paragraph",
                    "Para mí la relación que tuve contigo no fue algo pequeño. Fue algo que realmente sentí y que significó demasiado para mí. Viví contigo tus duelos, tus lágrimas, tus alegrías y tantas cosas que para mí significan mucho. Yo esperaba que todo eso fuera mutuo.",
                    { align: "left" }
                ),
                makeBlock(
                    "promise-04",
                    "paragraph",
                    "Hubo un momento en el que pensé que eso había muerto cuando conociste a él. Pensé que ahí lo nuestro había terminado, pero te aseguro que para mí nunca fue fácil. Seguías apareciendo en mis sueños, en mi cabeza por las noches y en mis pensamientos, porque tú para mí eres demasiado importante y fuiste de las cosas más bonitas que tuve en mi vida.",
                    { align: "left" }
                ),
                makeBlock(
                    "promise-05",
                    "paragraph",
                    "Tú nunca me pediste grandes cosas; solo pedías que te amara, que te hiciera sentir amada, y yo te amo aún por quien tú eres. Por eso tantas veces te hablaba de cambiar, de mejorar y de hacer todo lo que estuviera en mis manos. Sé que me equivoqué y sé que no puedo cambiar el pasado, pero también sé que hice cosas buenas y que todo lo que hice por ti nació del sentimiento que tenía.",
                    { align: "left" }
                ),
                makeBlock(
                    "promise-06",
                    "paragraph",
                    "Para mí, el amor también significa brindarte seguridad, confianza y apoyo sin importar la distancia que existe entre nosotros. Y una de las cosas que más vi en ti fue cómo muchas veces dudabas de ti misma. Dudabas de si ibas a poder con tus cosas, y ese momento difícil que viviste lo superaste. Mira hasta dónde has llegado, hasta dónde te vengo a conocer: a esa mujer que siempre esperé, pero que también admiro muchísimo.",
                    { align: "left" }
                ),
                makeBlock(
                    "promise-pride",
                    "quote",
                    "Eres uno de los orgullos más grandes que tengo.",
                    { bold: true, italic: true, align: "center" }
                ),
                makeBlock(
                    "promise-07",
                    "paragraph",
                    "Todo lo que pase es secundario. Y si alguna vez dudas de lo que puedes hacer, acuérdate de tus momentos más difíciles. Recuerda todas esas veces en las que pensaste que no ibas a poder y aun así pudiste, porque eres una mujer decidida, increíble y demasiado fuerte. Puedes superar muchísimo más de lo que tú misma crees, y eso es algo que yo siempre he sabido de ti.",
                    { align: "left" }
                ),
                makeBlock(
                    "promise-08",
                    "paragraph",
                    "¿Y qué quiero decirte con todo esto? Que si bien yo viví cosas malas y tú también pasaste por las tuyas, quiero que sepas que eso ya fue pasajero. Ahora quiero que nos enfoquemos en nosotros, en nuestro amor, que lo trabajemos, nos enamoremos más y podamos seguir adelante, porque esto creo que es de las mejores cosas que hay en la vida. Creo que es una bonita relación.",
                    { align: "left" }
                ),
                makeBlock(
                    "promise-09",
                    "paragraph",
                    "Sí, rompimos. Lloramos, sufrimos y nos dolieron muchas cosas, pero eso ya fue. Y si volvimos es porque simplemente todavía nos amamos, porque recordamos lo que pasamos y lo que aún no terminamos de vivir juntos. Yo volví con lo que te prometí que cambiaría, con las ganas de ser una mejor versión de mí, alguien de quien puedas enamorarte una y otra vez, y con el compromiso que siempre quise tener contigo.",
                    { align: "left" }
                ),
                makeBlock(
                    "promise-10",
                    "paragraph",
                    "Tal vez no salió todo bien en el pasado, pero ahora estoy bien. Estoy aquí para ti. Mi corazón está lleno de amor por ti. Sí, tuve que sanar partes de mí porque hubo momentos en los que sentí mi corazón roto, pero incluso así, todo el amor que te di fue con todo mi corazón y con todo el sentimiento que tenía.",
                    { align: "left" }
                ),
                makeBlock(
                    "promise-11",
                    "paragraph",
                    "Con nadie me dolió tanto alejarme como me dolió alejarme de ti. Con nadie sentí ese vacío de la manera en la que lo sentí contigo, porque yo te amé muchísimo y todavía te sigo amando. Yo realmente te entregué todo el sentimiento que pude. Te amé con lo que era, con mis errores, con mis virtudes, con mis miedos y con todo lo que llevaba dentro.",
                    { align: "left" }
                ),
                makeBlock(
                    "promise-always",
                    "quote",
                    "Contigo estaré siempre para ti, y eso también es una promesa.",
                    { bold: true, italic: true, align: "center" }
                ),
                makeBlock(
                    "promise-12",
                    "paragraph",
                    "Quiero estar contigo. Quiero acompañarte durante toda nuestra vida mientras ambos sigamos eligiéndonos mutuamente. Te ayudaré cuando algo te haga sentir mal; estaré contigo, no para decidir por ti, sino para recordarte quién eres, ayudarte a encontrar nuevamente tu camino y hacerte sentir que no estás sola. Estaré para tus decisiones y, cuando incluso te sientas perdida, estaré para ayudarte a encontrar una dirección sin quitarte la tuya.",
                    { align: "left" }
                ),
                makeBlock(
                    "promise-13",
                    "paragraph",
                    "Quiero realmente amarte por quien eres. Quiero estar en tus buenos y malos momentos, acompañarte en lo que venga y celebrar contigo todo lo que consigas.",
                    { align: "left" }
                ),
                makeBlock(
                    "promise-final",
                    "quote",
                    "Esa es mi promesa para ti.",
                    { bold: true, italic: true, align: "center" }
                ),
                { id: "promise-divider-end", type: "divider" }
            ];

            happy.blocks.push.apply(happy.blocks, promiseBlocks);
        }
    }

    const myWorld = blogsData.find(function (item) {
        return item && item.id === "my-world-with-you";
    });

    if (myWorld && Array.isArray(myWorld.blocks)) {
        const futureParagraph = myWorld.blocks.find(function (block) {
            return block && block.type === "paragraph" && typeof block.text === "string" &&
                block.text.indexOf("Cuando imagino el futuro") === 0;
        });

        const promiseReference = " En otro lugar te dejé escrita una promesa, pero aquí quiero recordarte una parte de ella: mientras sigamos eligiéndonos, quiero seguir construyendo este mundo contigo.";

        if (futureParagraph && futureParagraph.text.indexOf("En otro lugar te dejé escrita una promesa") === -1) {
            futureParagraph.text += promiseReference;
        }
    }
})();
