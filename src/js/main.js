var mainCanvas, stage;
var touchFlag = false;
var touchLastFlag = false;

var startPos = {x:0, y:0};
var tempPos = {x:0, y:0};
var tempFrame = 0;
var maxFrame = 360;

var prePosX = 0;

var queue;
var imageUrls = [];
var imageSprite;
var startFrame;

function init()
{
    mainCanvas = document.getElementById('main_canvas');
    stage = new createjs.Stage(mainCanvas);

    var manifest = [];

    var id;
    var url;
    var i = 0;
    while(i < maxFrame)
    {
        id  = 'frame_' + zfill(i, 3);
        url = '/c4d.model_viewer/frame/' + id + '.jpg';   
        imageUrls.push(url);
        manifest.push({src: url, type:"image", id: id});
        i++;
    }

    queue = new createjs.LoadQueue(false);
    queue.setMaxConnections(5);
    queue.loadManifest(manifest);
    queue.on("complete",handleComplete, this);
}
function zfill(number, length)
{
    return (Array(length).join('0') + number).slice(-length);
}
function handleComplete(event) 
{
    createImageContainer();

    createjs.Ticker.addEventListener("tick", update);
    mainCanvas.addEventListener("touchstart", touchStart);
    mainCanvas.addEventListener("touchmove", touchMove);
    mainCanvas.addEventListener("touchend", touchEnd);
    mainCanvas.addEventListener("touchcancel", touchEnd);
}
function createImageContainer() 
{

    var images = [];
    var i      = 0;
    var length = imageUrls.length;
    while(i < length)
    {
        images.push(queue.getResult(imageUrls[i]));
        i++;
    }

    var spriteSheet = new createjs.SpriteSheet({
        images: images,
        frames: { width: 800, height: 600, count: maxFrame },
    });

    imageSprite = new createjs.Sprite(spriteSheet);
    imageSprite.scaleX = imageSprite.scaleY = 0.5;

    stage.addChild(imageSprite);
    stage.update();
}

function touchStart(e)
{
    touchFlag = true;
    touchLastFlag = false;
    lastSpeedX = 0;
    startFrame = tempFrame;

    var touchobj = e.changedTouches[0]; 
    startPos = {x: parseInt(touchobj.clientX), y: parseInt(touchobj.clientY)};
    e.preventDefault();
}
function touchMove(e)
{
    var touchobj = e.changedTouches[0]; 
    tempPos = {x: parseInt(touchobj.clientX), y: parseInt(touchobj.clientY)};
    e.preventDefault();
}
function touchEnd(e)
{
    touchFlag = false;

    lastSpeedX = tempPos.x - prePosX;
    if(Math.abs(lastSpeedX) > 0)
    {
        touchLastFlag = true;
    }

    e.preventDefault();
}
function updateFrame()
{
    if(tempFrame < 0)
    {
        tempFrame = tempFrame + maxFrame;
    }
    
    tempFrame = tempFrame % maxFrame;
    
    imageSprite.gotoAndStop(tempFrame);
    
    stage.update();
}
function update()
{
    if(touchFlag)
    {
        var offsetX = (tempPos.x - startPos.x);
    
        tempFrame = startFrame + offsetX;

        updateFrame();

        prePosX = tempPos.x;

        return false;
    }

    if(touchLastFlag)
    {
       tempFrame = tempFrame + lastSpeedX; 
       lastSpeedX = parseInt(lastSpeedX * 0.9);

       if(Math.abs(lastSpeedX) < 1)
       {
           touchLastFlag = false;
       }

       updateFrame();
    }
}
