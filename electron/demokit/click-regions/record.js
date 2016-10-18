
const { delay, promisifyAll } = require("bluebird");
const { writeFileAsync, readFileAsync } = promisifyAll(require("fs"));
const findClickRegions = require("./find");


module.exports = function recordClickRegions(aFilePath, aSceneSize)
{
    var keepRecording = true;
    const promise = recordClickRegions();

    return async function stop()
    {
        keepRecording = false;
        await promise;
    }

    async function recordClickRegions()
    {try {
        const start = new Date();
        const frames = [];

        while (keepRecording)
        {
            const previous = frames[frames.length - 1];
            const regions = await findClickRegions();
            const changed = Object.keys(regions).reduce(function (changed, aUUID)
            {
                const lhs = regions[aUUID];
                const rhs = previous && previous.regions[aUUID];

                if (!rhs || lhs.x !== rhs.x || lhs.y !== rhs.y || lhs.w !== rhs.w || lhs.h !== rhs.h || lhs.action !== rhs.action)
                    return Object.assign(changed, { [aUUID]: lhs }); 

                return changed;
            }, { });

            if (Object.keys(changed).length > 0)
                frames.push({ time: new Date() - start, regions: changed });

            await delay(100);
        }

        const ids = [...new Set(Array.prototype.concat.apply([], frames.map(frame => Object.keys(frame.regions))))];
        const recording = { frames, ids, size:aSceneSize };
        const serialized = JSON.stringify(recording, null, 2);
        const contents = (await readFileAsync(require.resolve("./client.js"), "utf-8")).replace("${recording}", serialized);

        await writeFileAsync(aFilePath, contents);

        } catch(e) { console.log("OH NO", e); }
    }
}
