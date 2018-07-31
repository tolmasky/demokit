
const execute = require("demokit/execute");

module.exports.convert = async function convert({ point, rect, from, to })
{
    if (typeof from === "string")
        return convert({ point, rect, from: { toWorkspace: toOrFromWorkspace({ selector: `#${from} .window-content`, direction: "to" }) }, to });

    if (typeof to === "string")
        return convert({ point, rect, from, to: { fromWorkspace: toOrFromWorkspace({ selector:`#${to} .window-content`, direction: "from" }) } });

    if (from === to)
        return point || rect;

    if (point)
        return await to.fromWorkspace({ point: await from.toWorkspace({ point }) });

    return await to.fromWorkspace({ rect: await from.toWorkspace({ rect }) });
}

module.exports.Scene =
{
    fromWorkspace: toOrFromWorkspace({ selector: "#scene", direction: "from" }),
    toWorkspace: toOrFromWorkspace({ selector: "#scene", direction: "to" })
};

module.exports.Workspace = { fromWorkspace: rectOrPoint, toWorkspace: rectOrPoint };

function rectOrPoint({ rect, point })
{
    if (rect)
        return rect;

    return point;
}

const GlobalToWorkspace = require("demokit/global-to-workspace");
const GlobalFromWorkspace = require("demokit/global-from-workspace");

module.exports.Global = { fromWorkspace: GlobalFromWorkspace, toWorkspace:  GlobalToWorkspace };

function toOrFromWorkspace(props)
{
    if (Object.keys(props).length < 3)
        return moreProps => toOrFromWorkspace(Object.assign({}, props, moreProps));

    return (async function ()
    {
        const { point, rect, selector, direction } = props;

        if (rect) {
            const scale = direction === "from" ? (1 / (rect.devicePixelRatio || 1)) : rect.devicePixelRatio || 1;
            return { origin: await toOrFromWorkspace({ point: { x: rect.origin.x * scale, y: rect.origin.y * scale }, selector, direction }), size: { width: rect.size.width * scale, height: rect.size.height * scale } };
        }

        const { origin: { x: dx, y: dy } } = await getFrameInWorkspace({ selector });
        const mulitplier = direction === "from" ? -1 : 1;

        return { x: point.x + mulitplier * dx, y: point.y + mulitplier * dy };
    })();
}

module.exports.getFrameInWorkspace = getFrameInWorkspace;

async function getFrameInWorkspace({ selector })
{
    return await execute(
    {
        args:[{ selector }],
        script: function({ selector }, resolve, reject)
        {
            const { left:x, top:y, width, height } = document.querySelector(selector).getBoundingClientRect();

            resolve({ origin: { x, y }, size: { width, height } });
        }
    });
}
