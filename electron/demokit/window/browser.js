
const window = require("../window");
const DEFAULT_BROWSER_TEMPLATE = require("fs").readFileSync(require.resolve("./browser/browser-template.html"), "utf-8");
const execute = require("demokit/execute");

module.exports = async function browserWindow({ id, title, ...rest })
{
    await window({ ...rest, id, title, template: DEFAULT_BROWSER_TEMPLATE });
    await execute(
    {
        args: [{ id, title }],
        script: function({ id, title }, resolve)
        {
            if (title)
            {
                const locationBar = document.getElementById(id).querySelector(".location-bar");

                if (locationBar)
                    locationBar.innerText = title;
            }
            
            resolve(true);
        }
    });
}
