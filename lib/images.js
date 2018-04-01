var _ = require("underscore");
var fs = require("fs");
var path = require('path');

var promises = require("./promises");
var Html = require("./html");
var base64js = require('base64-js');
var wmf = require('libwmf');

exports.imgElement = imgElement;

function imgElement(func) {
    return function(element, messages) {
        return promises.when(func(element)).then(function(result) {
            var attributes = _.clone(result);
            if (element.altText) {
                attributes.alt = element.altText;
            }
            return [Html.freshElement("img", attributes)];
        });
    };
}

// Undocumented, but retained for backwards-compatibility with 0.3.x
exports.inline = exports.imgElement;

var wmfCount = 0;
var sourceFile = path.join(__dirname, "temp.wmf");
var targetFile = path.join(__dirname, "temp.png");
var png = true;
exports.dataUri = imgElement(function(element) {
    return element.read("base64").then(async function(imageBuffer) {
        if (png) {
            element.contentType = "image/png";
            fs.writeFileSync(sourceFile, base64js.toByteArray(imageBuffer));
            await new Promise((resolve, reject) => {
                wmf(sourceFile).max().toPNG(targetFile, (err) => {
                    if (err) {
                        console.error('err from inside wmf', err);
                        reject(err);
                    } else {
                        resolve(wmfCount);
                    }
                })
            }).then((value) => {
                wmfCount += 1;
                console.log('convert %s wmf image', wmfCount);
            }, (error) => {
                console.error('error from then', error);
            }).catch((error) => {
                console.error('error from catch', error);
            });
            imageBuffer = base64js.fromByteArray(fs.readFileSync(targetFile));
        }
        return {
            src: "data:" + element.contentType + ";base64," + imageBuffer
        };
    });
});
