#!/usr/bin/env node

var path = require("path");
var spawn = require("child_process").spawn;
var fs = require("fs");

if (process.argv[2] === "new")
{
    var name = process.argv[3];

    if (!name)
        throw new Error("Must supply a name");

    fs.mkdirSync(name);
    fs.writeFileSync(path.join(name, "index.js"), fs.readFileSync(path.join(__dirname, "..", "template", "index.js"), "utf-8"));
    console.log("create " + path.join(name, "index.js"));
    fs.writeFileSync(path.join(name, "package.json"), fs.readFileSync(path.join(__dirname, "..", "template", "package.json"), "utf-8").replace("${name}", name));
    console.log("create " + path.join(name, "package.json"));
}
else
{
    var electronPath = path.join(__dirname, "..", "electron", "node_modules", "electron", "dist");
    var electronExecutablePath = path.join(electronPath, fs.readFileSync(path.join(path.dirname(electronPath), "path.txt"), "utf-8"));

    spawn(electronExecutablePath, [path.join(__dirname, "..", "electron")].concat(process.argv.slice(2)), {stdio: "inherit"});
}