const { convert, Scene } = require("./coordinate-space");
const execute = require("demokit/execute");

exports.getCenterRect = function getCenterOfRect({ rect })
{
    return { x: rect.origin.x + rect.size.width / 2, y: rect.origin.y + rect.size.height / 2 };
}

exports.getBoundingClientRect = async function ({ window, selector, nth, space = Scene })
{
    const boundingClientRect = await execute(
    {
        window,
        args: [{ selector, nth }],
        script: function({ selector, nth }, resolve, reject)
        {
            var rect =  nth !== undefined ?
                        document.querySelectorAll(selector)[nth].getBoundingClientRect() :
                        document.querySelector(selector).getBoundingClientRect();

            resolve({ origin: { x: rect.left, y: rect.top }, size: { width: rect.width, height: rect.height } });
        }
    });

    return await convert({ rect: boundingClientRect, to: space, from: window });
}