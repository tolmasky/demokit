
const execute = require("demokit/execute");

module.exports = async function scene({ width, height, background })
{
    await execute(
    {
        args: [{ width, height, background }],
        script: function (options, resolve, reject)
        {
            var width = options.width + "px";
            var height = options.height + "px";
            var remainingWidth = "calc((100vw - " + width + ")/2)";
            var remainingHeight = "calc((100vh - " + height + ")/2)";

            var topDimmer = document.querySelector("header.dimmer");
            var bottomDimmer = document.querySelector("footer.dimmer");
            var leftDimmer = document.querySelector("aside.dimmer.left");
            var rightDimmer = document.querySelector("aside.dimmer.right");

            topDimmer.style.height = remainingHeight;
            bottomDimmer.style.height = remainingHeight;

            leftDimmer.style.top = remainingHeight;
            leftDimmer.style.width = remainingWidth;
            leftDimmer.style.height = height;

            rightDimmer.style.top = remainingHeight;
            rightDimmer.style.width = remainingWidth;
            rightDimmer.style.height = height;

            var scene = document.getElementById("scene");

            scene.style.top = remainingHeight;
            scene.style.left = remainingWidth;
            scene.style.width = width;
            scene.style.height = height;

            if (options.background !== undefined)
                scene.style.background = options.background;

            resolve(true);
         }
    });
}

module.exports.getBoundingClientRect = async function getBoundingClientRect()
{
    const rect = await execute(
    {
        script: function(resolve, reject)
        {
            var rect = document.getElementById("scene").getBoundingClientRect();

            resolve({ origin: { x: rect.left, y: rect.top }, size: { width: rect.width, height: rect.height } });
        }
    });

    return rect;
}

module.exports.getSize = async function getSize()
{
    return await execute(
    {
        script: function(resolve, reject)
        {
            var rect = document.getElementById("scene").getBoundingClientRect();

            resolve({ width: rect.width, height: rect.height });
        }
    });
}