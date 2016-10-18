try{

const { ipcRenderer } = require("electron");
const send = ipcRenderer.send.bind(ipcRenderer);

global.__demokit = { };

__demokit.smoothScroll = require("./vendor/smooth-scroll.min.js");

__demokit.resolve = function (uuid, aResolution)
{
    send("execute-resolve", uuid, aResolution);
}

__demokit.reject = function (uuid, aRejection)
{
    if (anException instanceof Error)
        send("execute-reject", uuid, { message: anException.message, stack: anException.stack });
    else
        send("execute-reject", uuid, anException);
}

__demokit.smoothScroll.init();

}
catch(e) { alert("yikes"); alert(e); }