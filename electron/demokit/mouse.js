
const execute = require("demokit/execute");
const { wait } = require("./demokit");
const { Workspace, Scene, convert } = require("./coordinate-space");
const { getCenterRect, getBoundingClientRect } = require("./geometry");
const { getCursor, performClick } = require("bindings")("mouse");


exports.click = async function ({ move = true, effect = true, window, selector, nth, x, y, dx = 0, dy = 0, reveal = false, space = Scene })
{
    await moveAndClick({ move, effect, click: true, window, selector, nth, x, y, dx, dy, space });

    if (reveal)
    {
        const rect = await getBoundingClientRect({ window, selector, nth, space: Workspace });

        await moveSmooth({ destination: { x: rect.origin.x - 20, y: rect.origin.y + rect.size.height + 10 } });
        await exports.hide();
    }
}

exports.move = async function ({ window, selector, nth, x, y, dx = 0, dy = 0, space = Scene })
{
    await moveAndClick({ move: true, effect: false, click: false, window, selector, nth, x, y, dx, dy, space });
}

exports.effect = async function ({ window, selector, nth, x, y, dx = 0, dy = 0, space = Scene })
{
    await moveAndClick({ move: false, effect: true, click: false, window, selector, nth, x, y, dx, dy, space });
}

async function moveAndClick({ move, click, effect, window, selector, nth, x, y, dx, dy, space })
{
    if (selector)
        await wait.visible({ window, selector, nth });

    const position = await getWorkspaceMousePosition({ window, selector, nth, x, y, space });
    const adjusted = { x: position.x + dx, y: position.y + dy };

    if (move)
        await moveSmooth({ destination: adjusted });

    if (effect)
        await showClickEffect({ point: adjusted, space: Workspace });

    if (click)
        performClick(adjusted.x, adjusted.y);
}

exports.hide = async function ()
{
    await execute(
    {
        args:[{ opacity: 0 }],
        script: animateCursorOpacity
    });
}

function animateCursorOpacity({ opacity })
{
    const startOpacity = 1 - opacity;
    const element = document.getElementById("cursor");
    const style = element.style;

    if (parseInt(style.opacity, 10) === opacity)
        return resolve();

    element.addEventListener("transitionend", function end()
    {
        element.removeEventListener("transitioned", end, false);
        resolve();
    }, false);

    style.transition = "opacity 0.5s";
    style.opacity = opacity;
}

exports.show = async function show()
{
    await execute(
    {
        args:[{ opacity: 1 }],
        script: animateCursorOpacity
    });
}

async function getWorkspaceMousePosition({ window, selector, nth, x, y, space })
{
    if (selector)
        return getCenterRect({ rect: await getBoundingClientRect({ window, selector, nth, space:Workspace }) });

    if (x !== undefined || y !== undefined)
        return await convert({ point:{ x, y }, from:space, to:Workspace });

    if (x === undefined && y !== undefined)
        return await mousePosition();

    if (x === undefined)
        return await convert({ point:{ ...await getMousePosition(), y }, from:space, to:Workspace });

    return await convert({ point:{ ...await getMousePosition(), x }, from:space, to:Workspace });
}

async function getMousePosition()
{
    await execute(
    {
        script: function (resolve, reject)
        {
            const cursorElement = document.getElementById("cursor");

            resolve({ x: parseInt(cursorElement.left, 10), y: parseInt(cursorElement.top, 10) });
        }
    });
}

async function moveSmooth({ destination, delta })
{
    await exports.show();
    await execute(
    {
        args:[{ destination }],
        script: function ({ destination }, resolve, reject)
        {
            const style = document.getElementById("cursor").style;
            const position = { x: parseInt(style.left, 10), y: parseInt(style.top, 10) };
            const averageDuration = 2.0;

            // This is version of the robotjs algorithm, modified to adhere
            // to a timestep.
            (function render({ velocity, position, previous })
            {
                const time = new Date();
                const dt = time - previous;
                const steps = previous < 0 ? 0 : Math.round(rand(2 * dt / (3 * averageDuration), 4 * dt / (3 * averageDuration)));
                const array = Array.apply(null, { length: steps }).map(Number.call, Number);
                const result = array.reduce(step, { velocity, position });

                style.left = result.position.x + "px";
                style.top = result.position.y + "px";

                if (getDistance(result) > 0)
                    requestAnimationFrame(() => render(Object.assign({ previous: time }, result)));
                else
                    resolve();
            })({ velocity: { x:0, y: 0 }, position, previous: -1 });

            function getDistance({ position })
            {
                return Math.hypot(position.x - destination.x, position.y - destination.y)
            }

            function step({ velocity, position })
            {
                const distance = getDistance({ position });

                if (distance <= 1.0)
                    return { velocity, position: destination };

                const gravity = rand(5.0, 500.0);
                const vx = velocity.x + (gravity * (destination.x - position.x)) / distance;
                const vy = velocity.y + (gravity * (destination.y - position.y)) / distance;

                // Normalize velocity to get a unit vector of length 1.
                const velocityDistance = Math.hypot(vx, vy);
                const vxUnit = vx / velocityDistance;
                const vyUnit = vy / velocityDistance;

                const x = position.x + Math.floor(vxUnit + 0.5);
                const y = position.y + Math.floor(vyUnit + 0.5);

                return { velocity: { x:vxUnit, y:vyUnit }, position: { x, y }  };
            }

            function rand(min, max)
            {
                return Math.random() * (max - min) + min;
            }
        }
    });
}

exports.cursor = async function ({ name, imageURL, size, hotSpot })
{
    if (name)
        await setCursor(getCursor(name));

    else
        await setCursor({ imageURL, size, hotSpot });
}

async function setCursor({ imageURL, size, hotSpot })
{
    await execute(
    {
        args:[{ imageURL, size, hotSpot }],
        script: function({ imageURL, size, hotSpot }, resolve, reject)
        {
            const style = document.getElementById("cursor").style;

            style.backgroundImage = "url(" + imageURL + ")";
            style.width = size.width + "px";
            style.height = size.height + "px";
            style.marginLeft = -hotSpot.x + "px";
            style.marginTop = -hotSpot.y + "px";

            resolve();
        }
    });
}

async function showClickEffect({ point, space = Scene })
{
    await execute(
    {
        args:[{ point: await convert({ point, from:space, to:Workspace }) }],
        script: function ({ point: { x, y } }, resolve, reject)
        {
            var clickElement = document.createElement("div");

            clickElement.style.position = "absolute";
            clickElement.style.left = x- 50 + "px";
            clickElement.style.top = y - 50 + "px";
            clickElement.style.width = "100px";
            clickElement.style.height = "100px";
            clickElement.style.transformOrigin = "center";
            clickElement.style.border = "1px solid black";
            clickElement.style.borderRadius = "50%";
            clickElement.style.transform = "scale(0.1, 0.1)";
            clickElement.style.transition = "all .45s";
            clickElement.style.zIndex = 10000;
            clickElement.style.pointerEvents = "none";

            document.body.appendChild(clickElement);
            clickElement.getBoundingClientRect();

            clickElement.addEventListener("transitionend", function end()
            {
                clickElement.removeEventListener("transitionend", end);
                clickElement.parentNode.removeChild(clickElement);
                resolve();
            });

            clickElement.style.transform = "scale(1.0, 1.0)";
            clickElement.style.opacity = 0;
        }
    });
}