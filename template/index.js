const { demo, group, wait, using } = require("demokit");
const { type, paste } = require("demokit/keyboard");
const scene = require("demokit/scene");
const recording = require("demokit/recording");
const browser = require("demokit/window/browser");
const { click } = require("demokit/mouse");

module.exports =
<demo>
    <scene width = { 1024 } height = { 768 } />

    <browser    id = "duckduckgo"
                title = "Duck Duck Go"
                contentURL = "https://duckduckgo.com"
                contentRect = { { origin: { x: "center", y: "center" }, size: { width: 900, height: 600 } } } />

    <recording.start filePath = "videos/video" />

    <using window = "duckduckgo">
        <click selector = "input[type=text]" />
        <type>How do I use <paste>JSX</paste>?</type>
        <click selector = "input[type=submit]" />
        <wait delay = { 3000 } />
    </using>

    <recording.stop />

</demo>
