const { all, delay } = require("bluebird");
const scene = require("./scene");
const recording = require("./recording");
const execute = require("demokit/execute");
const { base } = require("generic-jsx");
const { link, button } = require("./html");



module.exports.group = async function group({ children, ...rest })
{
    await all(children.map(async function (aChild)
    {
        while (typeof aChild === "function")
            aChild = await (<aChild { ...rest }/>());
    }));
}

module.exports.wait = async function wait({ delay: sleep, font: family })
{
    if (sleep !== undefined)
        return await delay(sleep);
}

module.exports.immediate = function({ children, ...rest })
{
    all(children.map(async function (aChild)
    {
        while (typeof aChild === "function")
            aChild = await (<aChild { ...rest }/>());
    }));
}

exports.wait.loaded = async function loaded({ font: family })
{
    return await font({ family });
}

exports.wait.visible = async function waitVisible({ window, selector, nth, timeout = Infinity })
{
    await execute(
    {
        window,
        args: [{ window, selector, timeout: timeout === Infinity ? -1 : timeout }],
        script: function({ window, selector, nth, timeout }, resolve, reject)
        {
            const date = new Date();

            (function check()
            {
                if (timeout > 0 && new Date() - date > timeout)
                    return reject({ message: "wait for visible " + selector + " timed out" })

                const element = getElement();

                if (element && element.getBoundingClientRect().height > 0)
                    return resolve(true);

                setTimeout(check, 100);
            })()

            function getElement()
            {
                if (nth === undefined)
                    return document.querySelector(selector);

                return document.querySelectorAll(selector)[nth];
            }
        }
    });
}

async function font({ family })
{
    await execute(
    {
        args:[{ family }],
        script: function({ family }, resolve)
        {
            const correctFamily = document.createElement("span");
            const comparisonFamily = document.createElement("span");

            correctFamily.style.fontFamily = family + ", Hevletica";
            correctFamily.style.fontSize = "50px";
            correctFamily.style.visibility = "hidden";
            comparisonFamily.style.fontFamily = "Helvetica";
            comparisonFamily.style.fontSize = "50px";
            comparisonFamily.style.visibility = "hidden";

            correctFamily.innerText = "abcdefghijklmnopqrstuvwxyz";
            comparisonFamily.innerText = "abcdefghijklmnopqrstuvwxyz";

            document.body.appendChild(correctFamily);
            document.body.appendChild(comparisonFamily);

            setTimeout(function check()
            {
                if (correctFamily.getBoundingClientRect().width !==
                    comparisonFamily.getBoundingClientRect().width)
                    return resolve(true);

                setTimeout(check, 100);
            }, 100);
        }
    });
}

module.exports.demo = async function demo({ children })
{
    const context = { };

    await (require("./mouse").cursor({ name: "default" }));

    try
    {
        for (let child of children)
            while (typeof child === "function")
            {
                if (base(child) === link || base(child) === button)
                    await execute(
                    {
                        args:[{ tag:child = await child() }],
                        script: function({ tag }, resolve)
                        {
                            document.body.innerHTML += tag;
                            resolve();
                        }
                    });

                else
                    child = await (<child context = { context }/>());
            }
    }
    catch (anException)
    {
        console.log(anException);
        console.log(anException.stack);
    }
    finally
    {
        await (<recording.stop context = { context }/>());
    }
}

exports.using = async function ({ children, window, id, ...rest })
{
    for (let child of children)
        while (typeof child === "function")
            child = await (<child window = { window || id } id = { window || id } {...rest} />());
}
