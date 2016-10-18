const { ipcMain } = require("electron");
const uuid = require("uuid");
const executions = { };

const on = ipcMain.on.bind(ipcMain);

// Patch Module._resolveFilename to always require the Electron API when
// require('electron') is done.
const path = require("path");
const demoKitPath = path.join(__dirname, "demokit");
const GenericJSXPath = path.dirname(require.resolve("generic-jsx"));

const Module = require("module");
const ModuleRequire = Module.prototype.require;
const originalResolveFilename = Module._resolveFilename;
const { delay } = require("bluebird");

Module._resolveFilename = function (aRequest, aParent, isMain)
{
    const [first, ...rest] = aRequest.split(path.sep);

    if (first === "demokit")
        return originalResolveFilename(path.join(...[demoKitPath, ...rest]), aParent, isMain);

    if (first === "generic-jsx")
        return originalResolveFilename(path.join(...[GenericJSXPath, ...rest]), aParent, isMain);

    return originalResolveFilename(aRequest, aParent, isMain);
}

module.exports = function (aMainWindow)
{
    on("ready", async function(event)
    {
        const sender = event.sender;
        const send = sender.send.bind(sender);
        const _execute = props => <execute send = { send } { ...props }/>();
        const all = { };
        _execute.register = function (resolve, reject,script)
        {
            const key = uuid.v4();
            executions[key] = { resolve, reject };
            return key;
        }

        Module.prototype.require = function (aPath)
        {
            const [first, ...rest] = aPath.split(path.sep);

            if (first === "demokit" && rest.length > 0)
                if (rest[0] === "_execute")
                    return _execute;
                else if (rest[0] === "global-from-workspace")
                    return globalFromWorkspace;
                else if (rest[0] === "global-to-workspace")
                    return globalToWorkspace;

            return ModuleRequire.apply(this, arguments);
        }

        try
        {
            const filePath = process.argv[process.argv.length - 1];
            const demo = require(path.resolve(process.cwd(), filePath));

            await demo();
        }
        catch (anException)
        {
            console.log(anException);
        }

        function globalFromWorkspace({ rect, point })
        {
            const contentBounds = aMainWindow.getContentBounds();

            if (rect)
                return { ...rect, origin: globalFromWorkspace({ point: rect.origin }) };

            return { x: contentBounds.x + point.x, y: contentBounds.y + point.y };
        }

        function globalToWorkspace({ rect, point })
        {
            const contentBounds = aMainWindow.getContentBounds();

            if (rect)
                return { ...rect, origin: globalToWorkspace({ point: rect.origin }) };

            return  { x: point.x - contentBounds.x, y: point.y - contentBounds.y };
        }
    });
}

on("execute-resolve", function (_, key, result)
{
    executions[key].resolve(result);

    delete executions[key];
});

on("execute-reject", function (_, key, result)
{
    executions[key].reject(result);

    delete executions[key];
});

function execute({ send, script, args = [] })
{
    const key = uuid.v4();

    return new Promise(function (resolve, reject)
    {
        executions[key] = { resolve, reject };

        send("execute", key, `(${script})`, args);
    });
}
