
const path = require("path");
const ScreenRecorder = require("screen-recorder").ScreenRecorder;
const scene = require("./scene");
const moment = require("moment");
const expandTilde = require("expand-tilde");
const { convert, Scene, Global } = require("./coordinate-space");
const { delay } = require("bluebird");
const recordClickRegions = require("./click-regions/record");



module.exports.start = async function ({ context, filePath = "out", framerate = 60, contentRect, space = Scene, clickRegions = false })
{    
    const expanded = expandTilde(filePath) + " " + moment().format("YYYY-MM-DD [at] h.mm.ss A");
    const resolved = path.resolve(process.cwd(), expanded + ".mov");

    await delay(1000);

    const sceneBounds = contentRect || { origin: { x:0, y: 0 }, size: await scene.getSize() };
    const { origin: { x, y }, size: { width, height } } = await convert({ rect: sceneBounds, from: Scene, to: Global });

    context.movie = new ScreenRecorder(resolved);
    context.movie.setCropRect(x, y, width, height);
    context.movie.setFrameRate(framerate);
    context.movie.setCapturesMouseClicks(false);
    context.movie.setCapturesCursor(false);
    context.movie.start();

    if (clickRegions)
    {
        context.size = { width, height };
        context.clickRegions = { stop: recordClickRegions(expanded + ".click-regions.js", { width, height }) };
    }

    await delay(1000);
};

module.exports.stop = async function ({ context })
{
    if (context.movie)
        context.movie.stop();

    if (context.clickRegions)
        await context.clickRegions.stop();        
};