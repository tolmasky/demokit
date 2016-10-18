
for (const tagName of ["b", "span", "div", "i" ])
    module.exports[tagName] = <tag tagName = { tagName } />;

module.exports.link = props => <tag tagName = { "link" } { ...props } />();
module.exports.button = props => <tag tagName = { "button" } { ...props } />();

function tag({ tagName, children, ...rest })
{
    const attributes = Object.keys(rest).reduce(function (attributes, anAttributeName)
    {
        return attributes + " " + anAttributeName + ` = "${rest[anAttributeName]}"`;
    }, "");

    return children.reduce(function (aString, aChild)
    {
        if (typeof aChild === "string")
            return aString + aChild;
    
        return aString + aChild();
    }, `<${tagName} ${attributes}>`) + `</${tagName}>`;
}