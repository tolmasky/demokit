
const window = require("../window");

module.exports = async function terminalWindow(props)
{
    await window(
    {
        contentURL:require.resolve("./terminal/terminal-content.html"),
        title:props.title || "~ — bash — 80x24",
        ...props
    });
}
