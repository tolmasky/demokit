try{

const { ipcRenderer } = require("electron");
const send = ipcRenderer.send.bind(ipcRenderer);

global.__demokit = { };

const SmoothScroll = require("./vendor/smooth-scroll.min.js")
__demokit.smoothScroll = new SmoothScroll();

__demokit.resolve = function (uuid, aResolution)
{
    send("execute-resolve", uuid, aResolution);
}

__demokit.reject = function (uuid, anException)
{
    if (anException instanceof Error)
        send("execute-reject", uuid, { message: anException.message, stack: anException.stack });
    else
        send("execute-reject", uuid, anException);
}

}
catch(e) { alert("yikes"); alert(e); }