
const window = require("../window");
const { delay } = require("bluebird");
const template = require("fs").readFileSync(require.resolve("./borderless/borderless-template.html"), "utf-8");

module.exports = async function borderlessWindow({ id, ...rest })
{
    await window({ ...rest, id, template });
}
