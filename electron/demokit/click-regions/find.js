
const execute = require("demokit/execute");
const { all: allWindows } = require("../window");
const Promise = require("bluebird");
const nextUUIDs = { };
const mainScene = Symbol("main-scene");
const { convert, Scene } = require("../coordinate-space");

module.exports = async function findClickRegions(previous)
{
    return Object.assign({ }, ...(await Promise.all([getRegions(), ...allWindows().map(id => getRegions({ window:id }))])));
}

async function getRegions({ window } = { })
{
    const nextUUID = nextUUIDs[window || mainScene] | 0;
    const [newNextUUID, regions] = await execute({ window, args:[{ prefix: window, nextUUID }], script: getRegions });

    nextUUIDs[window || mainScene] = newNextUUID;
    
    return await getConvertedRegions({ window, regions });
    
    async function getConvertedRegions({ window, regions })
    {
        if (!window)
            return regions;

        const conversion = await convert({ point: { x:0, y:0 }, from: window, to: Scene });
        const UUIDs = Object.keys(regions);

        for (const UUID of UUIDs)
        {
            const region = regions[UUID];
            regions[UUID] = { ...region, x: region.x + conversion.x, y: region.y + conversion.y };   
        }
        
        return regions;
    }
    
    function getRegions({ prefix, nextUUID }, resolve, reject)
    {
        const regions = { };
    
        document.querySelectorAll("*[data-demokit-click-action]").forEach(function (anElement)
        {
            const action = anElement.getAttribute("data-demokit-click-action");
            const UUID = (prefix || "") + getUUID(anElement);
            const opacity = parseInt(window.getComputedStyle(anElement, null).opacity, 10);
            
            if (opacity === 0)
                regions[UUID] = { x: 0, y: 0, w: 0, h:0, action };
            else
            {
                const rect = anElement.getBoundingClientRect();
    
                regions[UUID] = { x: rect.left, y: rect.top, w: rect.width, h:rect.height, action };
            }
        });

        resolve([nextUUID, regions]);
        
        function getUUID(anElement)
        {
            if (anElement.hasAttribute("data-demokit-click-uuid"))
                return anElement.getAttribute("data-demokit-click-uuid");

            const UUID = nextUUID++;

            anElement.setAttribute("data-demokit-click-uuid", UUID);

            return UUID;
        }
    }
}