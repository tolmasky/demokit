
const window = require("../window");
const execute = require("demokit/execute");
const { delay } = require("bluebird");

module.exports = async function codeEditorWindow({ id, source, firstLineNumber = 1, ...rest })
{
    await window({ ...rest, id, contentURL: require.resolve("./code-editor/code-editor-content.html") });
    await execute(
    {
        window: id,
        script: function ({ source, firstLineNumber }, resolve, reject)
        {
            window.editor.setValue(source);
            window.editor.setOption("firstLineNumber", firstLineNumber);
            resolve();
        },
        args: [{ source, firstLineNumber }]
    });
}