
const _execute = require("demokit/_execute");

module.exports = async function execute({ window, ...rest })
{
    if (!window)
        return await _execute({ ...rest });

    return windowExecute({ window, ...rest });
}

async function windowExecute({ window, script, args = [] })
{
    return new Promise(function (resolve, reject)
    {
        _execute(
        {
            args:[{ id:window, script: `(${script})`, args, uuid: _execute.register(resolve, reject, `(${script})`) }],
            script: function ({ id, script, args, uuid }, resolve, reject)
            {try {
                var webview = document.getElementById(id).querySelector(".window-content-webview");
                var isDOMReady = webview.isDOMReady;

                if (!isDOMReady)
                    webview.addEventListener("dom-ready", runClientScript);
                else
                    runClientScript();

                function runClientScript()
                {
                    webview.removeEventListener("dom-ready", runClientScript);
                    runScript(script, uuid, args)
                }

                function run(uuid, aFunction, args, script)
                {
                    __demokit.pending(uuid);

                    new Promise(function (resolve, reject)
                        {
                            aFunction.apply(this, args.concat(resolve, reject));
                        })
                        .then(function resolve(anArgument)
                        {
                            __demokit.resolve(uuid, anArgument);
                        })
                        .catch(function reject(anException)
                        {
                            __demokit.reject(uuid, Object.assign(anException, { script }));
                        });
                }

                function runScript(aScript, uuid, args)
                {
                    webview.executeJavaScript(`(${run})("${uuid}", ${script}, ${JSON.stringify(args)}, ${JSON.stringify(script)})`);
                } } catch(e) { alert(e) }
            }
        });
    });
}
