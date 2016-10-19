const R = require("ramda");

const sampleDelays = [136, 161, 139, 56, 96, 128, 159, 56, 96, 48, 113, 64, 183, 100, 140, 20, 88, 80];
const averageDelay = R.mean(sampleDelays);
const normalizedDelays = R.map(R.divide(R.__, averageDelay), sampleDelays);

const { delay } = require("bluebird");
const window = require("./window");
const { base } = require("generic-jsx");

const execute = require("demokit/execute");

module.exports.paste = async function paste({ window, children })
{
    const text = children.reduce(function (text, child)
    {
        if (typeof child === "string")
            return text + child;

        if (base(child) === br)
            return text + "\n";

        throw new Error("Paste tags can only contain strings and break tags.");
    }, "");

    await execute(
    {
        args: [{ id:window, text }],
        script: function ({ id, text }, resolve, reject)
        {
            const webview = document.querySelector("#" + id + " .window-content-webview");

            webview.insertText(text);
            resolve();
        }
    });
}

module.exports.backspace = async function backspace({ window })
{
    return await key({ window, code: "Backspace" });
}

module.exports.key = key;

async function key({ window, code })
{
    await execute(
    {
        args: [{ id:window, code }],
        script: function ({ id, code }, resolve, reject)
        {
            const webview = document.querySelector("#" + id + " .window-content-webview");

            webview.sendInputEvent(
            {
                type: "keydown",
                keyCode: code
            });
            webview.sendInputEvent(
            {
                type: "keyup",
                keyCode: code
            });
            resolve();
        }
    });
}

module.exports.type = async function type({ window, children })
{
    for (const child of R.flatten(children))
    {
        if (typeof child === "string")
            await insertText({ window, text: child });

        else
            await (<child window = { window }/>());
    }
}

module.exports.br = br;

async function br({ window, pause = 0 })
{try {
    await insertText({ window, text: "\n" });

    if (pause > 0)
        await delay(pause); } catch(e) { console.log(e) }
}

async function insertText({ window, text, WPM = 160 })
{
    const averageCharactersPerWord = 5.1;
    const CPM = WPM * averageCharactersPerWord;
    const baseDelay = 1000 / (CPM / 60);

    await execute(
    {
        args: [{ id:window, text, normalizedDelays, baseDelay }],
        script: function ({ id, text, normalizedDelays, baseDelay }, resolve, reject)
        {
            const length = text.length;
            const webview = document.querySelector("#" + id + " .window-content-webview");

            (function type(index)
            {
                webview.insertText(text.charAt(index));

                if (index === length - 1)
                    return resolve();

                window.setTimeout(type, normalizedDelays[index % normalizedDelays.length] * baseDelay, index + 1);
            })(0);
        }
    });
}
