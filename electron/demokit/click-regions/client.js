(function()
{
    "use strict"

    var recording = ${recording};
    var script = document.currentScript || (function()
    {
        var scripts = document.getElementsByTagName("script");

        return scripts[scripts.length - 1];
    });

    var id = script.getAttribute("data-video-id");
    var callback = eval(script.getAttribute("data-callback"));
    var timeOffset = parseInt(sript.getAttributes("data-offset"), 10) || 1450;
    var video = document.getElementById(id);
    var frames = recording.frames;
    var ids = recording.ids;
    var empty = { x:0, y:0, w:0, h:0 };

    update(video);

    function update(video)
    {
        var time = video.currentTime * 1000 || 0;
        var recording = null;
        var parentNode = video.parentNode;
        var parentFrame = parentNode.getBoundingClientRect();
        var videoFrame = video.getBoundingClientRect();
        var xRatio = videoFrame.width / width;
        var yRatio = videoFrame.height / height;
        var xOffset = videoFrame.left - parentFrame.left;
        var yOffset = videoFrame.top - parentFrame.top;
        var frame = null;

        for (index = 0; index < frames.length; ++index)
            if (frames[index].time - timeOffset < time)
                frame = frames[index];

        if (!frame)
            return repeat();

        var regions = frame.regions;
        var index = 0;
        var count = ids.length;

        for (; index < count; ++index)
        {
            var id = ids[index];
            var region = regions[id];
            var element = getElement(video, id, region || empty);
            var left = xOffset + region.x * xRatio;
            var top = yOffset + region.y * yRatio;
            var right = left + region.w * xRatio;
            var bottom = top + region.h * yRatio;

            element.style.width = Math.ceil(right - left) + "px";
            element.style.height = Math.ceil(bottom - top) + "px";
            element.style.top = Math.floor(top) + "px";
            element.style.left = Math.floor(left) + "px";               
        }

        repeat();

        function repeat()
        {
            window.requestAnimationFrame(function() { update(video) });
        }
    }

    function makeCallback(video, aRegion)
    {
        if (aRegion.action === "replay")
            return function()
            {
                video.pause();
                video.currentTime = 0;
                video.play()
            };
        
        if (aRegion.action.indexOf("href:") === 0)
            return function() { window.location.href = aRegion.action.substr("href:".length) };

        return function() { }
    }

    function getElement(video, id, region)
    {
        var element = document.getElementById(id);

        if (element)
            return element;

        var element = document.createElement("div");

        element.id = id;
        element.style.background = "red";
        element.style.zIndex = "10000";
        element.style.position = "absolute";
        element.style.cursor = "pointer";
        element.onclick = makeCallback(video, region);

        video.parentNode.appendChild(element);

        return element;
    }
})();
