try{

const { ipcRenderer } = require("electron");
const send = ipcRenderer.send.bind(ipcRenderer);

global.__demokit = { };

const SmoothScroll = require("./vendor/smooth-scroll.min.js")
__demokit.smoothScroll = new SmoothScroll();

const pendingPromises = {};

window.addEventListener("unload", (ev) => {
    const pendingUuids = Object.keys(pendingPromises);
    if (pendingUuids.length == 0) {
        return;
    }

    const rejection = { message: "window unloading", transient: true }
    pendingUuids.forEach((uuid) => {
        __demokit.reject(uuid, rejection)
    })
})

__demokit.pending = function (uuid) {
    pendingPromises[uuid] = true;
}

__demokit.resolve = function (uuid, aResolution)
{
    delete pendingPromises[uuid];
    send("execute-resolve", uuid, aResolution);
}

__demokit.reject = function (uuid, anException)
{
    delete pendingPromises[uuid];
    if (anException instanceof Error)
        send("execute-reject", uuid, { message: anException.message, stack: anException.stack });
    else
        send("execute-reject", uuid, anException);
}

}
catch(e) { alert("yikes"); alert(e); }