
const DEFAULT_WINDOW_TEMPLATE = require("fs").readFileSync(require.resolve("./window/window-template.html"), "utf-8");
const PRELOAD_PATH = require.resolve("./window/window-preload.js");
const scene = require("./scene");
const { all, delay } = require("bluebird");
const uuid = require("uuid");
const path = require("path");
const { getBoundingClientRect, using } = require("../demokit");
const execute = require("demokit/execute");
const { convert, Workspace, Scene, Global, getFrameInWorkspace } = require("./coordinate-space");

var FOCUSED_WINDOW_FRAME = null;
const ALL_WINDOWS = [];

module.exports = async function window({ contentRect, template = DEFAULT_WINDOW_TEMPLATE, ...rest })
{
    await execute(
    {
        args: [{ contentRect: await calculateContentRect({ contentRect }), ...rest }, PRELOAD_PATH, uuid.v4(), template],
            script: function ({ id, contentRect, contentURL, title, allowNodeIntegration, zoomLevel }, PRELOAD_PATH, partition, template)
        {
            const instantiation = document.createElement("div");

            instantiation.innerHTML = template;

            const instance = instantiation.querySelector("div");

            if (title)
            {
                const titleElement = instance.querySelector(".title");

                if (titleElement)
                    titleElement.innerText = title;
            }

            const content = instance.querySelector(".window-content");
            const webview = instance.querySelector(".window-content-webview");

            instance.id = id;
            instance.style.left = contentRect.origin.x + "px";
            instance.style.top = contentRect.origin.y + "px";

            content.style.width = contentRect.size.width + "px";
            content.style.height = contentRect.size.height + "px";

            webview.preload = PRELOAD_PATH;
            webview.partition = partition;

            if (allowNodeIntegration) {
                webview.nodeintegration = true;
            }

            if (contentURL)
                webview.src = contentURL;

            webview.addEventListener("dom-ready", function ()
            {
                if (zoomLevel) {
                    webview.setZoomLevel(zoomLevel);
                }
                webview.isDOMReady = true;
                resolve(true);
            });
            webview.addEventListener("will-navigate", function()
            {
                webview.isDOMReady = false;
            });

            document.getElementById("scene").appendChild(instance);
        }
    });

    ALL_WINDOWS.push(rest["id"]);
}

module.exports.all = function()
{
    return ALL_WINDOWS;
}

async function calculateContentRect({ contentRect })
{
    const contentSize = contentRect.size;
    const sceneSize = await scene.getSize();

    const shouldCenterBoth = contentRect.origin === "center";
    const shouldCenterX = shouldCenterBoth || contentRect.origin.x === "center";
    const shouldCenterY = shouldCenterBoth || contentRect.origin.y === "center";

    const centeredX = shouldCenterX && Math.floor(sceneSize.width - contentSize.width) / 2 || contentRect.origin.x;
    const centeredY = shouldCenterY && Math.floor(sceneSize.height - contentSize.height) / 2 || contentRect.origin.y;

    const x =   centeredX === "offscreen-left" && -contentSize.width - 20 ||
                centeredX === "offscreen-right" && sceneSize.width + 20 ||
                centeredX;
    const y =   centeredY === "offscreen-top" && -contentSize.height - 20 ||
                centeredY === "offscreen-bottom" && sceneSize.height + 40 ||
                centeredY;

    return { ...contentRect, origin: { x, y } };
}


async function getContentRect({ window, space })
{
    const contentRect = await getFrameInWorkspace({ selector: `#${window} .window-content`});

    return convert({ rect: contentRect, from: Workspace, to: space });
}

module.exports.style = async function({ id, origin, x, y, dx, opacity, width, height, scale, transformOrigin, animate = false })
{
    if (y === "center" || x === "center" || y === "offscreen-top" || x === "offscreen-left" || y === "offscreen-bottom" || x === "offscreen-right" || dx !== undefined)
    {
        const contentRect = await getContentRect({ window: id,  space: Scene });

        if (x !== undefined)
            contentRect.origin.x = x;

        if (y !== undefined)
            contentRect.origin.y = y;

        const { origin: { x:newX, y:newY } } = await calculateContentRect({ contentRect });

        if (x !== undefined)
            x = newX;

        if (y !== undefined)
            y = newY;
    
        if (dx !== undefined)
            x = newX + dx;
    }


    await execute(
    {
        args: [{ id, origin, x, y, scale, width, height, opacity, transformOrigin, animate }],
        script: function ({ id, origin, x, y, scale, width, height, opacity, transformOrigin, animate }, resolve, reject)
        {try {
            const window = document.getElementById(id);
            const content = document.querySelector("#" + id + " .window-content");

            if (animate)
            {
                window.addEventListener("transitionend", finished, false);
                content.addEventListener("transitionend", finished, false);

                window.style.transition = "left .45s, top .45s, opacity .45s, transform .45s";
                content.style.transition = "width .45s, height .45s";

                function finished()
                {
                    window.removeEventListener("transitionend", finished, false);
                    content.addEventListener("transitionend", finished, false);
                    resolve(true);
                }
            }

            if (origin || x)
                window.style.left = (x || origin.x) + "px";

            if (origin || y)
                window.style.top = (y || origin.y) + "px";

            if (width !== undefined)
                content.style.width = width + "px";

            if (height !== undefined)
                content.style.height = height + "px";

            if (opacity !== undefined)
                window.style.opacity = opacity;

            if (transformOrigin !== undefined)
                window.style.transformOrigin = transformOrigin.x + " " + transformOrigin.y;

            if (scale !== undefined)
                window.style.transform = "scale(" + scale + "," + scale + ")";

            if (!animate)
                resolve(true);}catch(e) { alert("HERE " + e) }
        }
    });
}

module.exports.focus = async function({ id })
{
    await execute(
    {
        id,
        script: function(resolve, reject)
        {
            document.body.focus();
            document.getElementById(id).querySelector(".window-content-webview").focus();
            resolve()
        }
    });
}

module.exports.set = async function set({ window, selector, value })
{
    await execute(
    {
        window,
        args: [{ selector, value }],
        script: function({ selector, value }, resolve, reject)
        {
            document.querySelector(selector).value = value;
            resolve();
        }
    });
}

module.exports.submit = async function submit({ id, form })
{
    return new Promise(function (resolve, reject)
    {
        execute(
        {
            args: [{ id }],
            script: function({ id }, resolve, reject)
            {
                var webview = document.getElementById(id).querySelector(".window-content-webview");

                webview.addEventListener("dom-ready", function didFrameFinishLoad(isMainFrame)
                {
                    resolve();
                    webview.removeEventListener("dom-ready", didFrameFinishLoad);
                });
            }
        }).then(resolve).catch(reject);

        execute(
        {
            window,
            args: [{ form }],
            script: function({ form }, resolve, reject)
            {
                document.querySelector(form).submit();
                resolve();
            }
        });
    });
}

module.exports.scroll = scroll;

async function scroll({ window, selector, nth })
{
    await execute(
    {
        window,
        args:[{selector}],
        script: function({ selector }, resolve, reject)
        {
            try {
            const anchor = document.querySelector(selector);
            const options = { speed: 1000, easing: "easeOutCubic", callback: function () { resolve(true) } };

            __demokit.smoothScroll.animateScroll( anchor, null, options ); } catch(e) { alert("ddd" + e) }
        }
    });
};
