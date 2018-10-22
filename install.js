var fs = require("fs");
var path = require("path");
var spawn = require("child_process").spawn;
var demokitDirectory = path.join(process.cwd(), "electron");
var installFlags = ["install", "--local", "--runtime=electron", "--target=3.0.3", "--disturl=https://atom.io/download/atom-shell", "--abi=66"];

spawn("npm", installFlags,
{
    stdio:"inherit",
    cwd:demokitDirectory
})
.on('close', function (code)
{
    spawn("npm", installFlags,
    {
        stdio:"inherit",
        cwd:path.join(demokitDirectory, "demokit")
    });
});

