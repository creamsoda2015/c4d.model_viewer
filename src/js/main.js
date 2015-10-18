var stage, queue, imageSprite, startFrame, loadingBar, barShape;
var touchFlag     = false;
var touchLastFlag = false;
var startPos      = {x:0, y:0};
var tempPos       = {x:0, y:0};
var prePosX       = 0;
var imageUrls     = [];
var tempFrame     = 0;
var maxFrame      = 360;
var unitFrame     = 1;
var frameRate     = 24;
var maxConn       = 5;

function init()
{
    stage = new createjs.Stage(document.getElementById('main_canvas'));
    createjs.Touch.enable(stage);

    var manifest = [];
    var id;
    var url;
    var i = 0;
    while(i < maxFrame)
    {
        id  = 'frame_' + zfill(i, 3);
        url = '/c4d.model_viewer//src/frame/' + id + '.png';
        imageUrls.push(url);
        manifest.push({src: url, type:"image", id: id});
        i = i + unitFrame;
    }

    addLoadingBar();

    queue = new createjs.LoadQueue();
    queue.setMaxConnections(maxConn);
    queue.loadManifest(manifest);
    queue.on("complete",handleComplete, this);
    queue.on("progress",handleProgress, this);
}
function addLoadingBar()
{
    var color   = createjs.Graphics.getRGB(0xBBBBBB, 1.0)
    var shape   = new createjs.Shape();
    var padding = 3;
    loadingBar  = new createjs.Container();
    barH        = 8;
    barW        = stage.canvas.width - 60;
    barShape    = new createjs.Shape();
    barShape.graphics.beginFill(color).drawRect(0, 0, 1, barH).endFill();
    shape.graphics.setStrokeStyle(1).beginStroke(color).drawRect(-padding / 2, -padding / 2, barW + padding, barH + padding);
    loadingBar.addChild(barShape, shape);
    loadingBar.x = Math.round(stage.canvas.width / 2 - barW / 2);
    loadingBar.y = Math.round(stage.canvas.height / 2 - barH / 2);
    stage.addChild(loadingBar);
}
function removeLoadingBar()
{
    stage.removeChild(loadingBar);
}
function zfill(number, length)
{
    return (Array(length).join('0') + number).slice(-length);
}
function handleProgress(event) 
{
    barShape.scaleX = queue.progress * barW;
    stage.update();
}
function handleComplete(event) 
{
    removeLoadingBar();
    createImageContainer();

    createjs.Ticker.setFPS(frameRate);
    createjs.Ticker.addEventListener("tick", handleTick);

    stage.addEventListener("stagemousedown" , touchStart);
    stage.addEventListener("stagemousemove" , touchMove);
    stage.addEventListener("stagemouseup"   , touchEnd);
    stage.addEventListener("stagemouseleave", touchEnd);
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
        frames: { width: 640, height: 480, count: maxFrame }
    });

    imageSprite = new createjs.Sprite(spriteSheet);

    stage.addChild(imageSprite);
    stage.update();
}
function touchStart(e)
{
    e.preventDefault();

    touchFlag = true;
    touchLastFlag = false;
    lastSpeedX = 0;
    startFrame = tempFrame;

    startPos = {x: parseInt(e.rawX), y: parseInt(e.rawY)};
    tempPos.x = startPos.x;
    tempPos.y = startPos.y;
}
function touchMove(e)
{
console.log('touch move');
    e.preventDefault();

    tempPos = {x: parseInt(e.rawX), y: parseInt(e.rawY)};
}
function touchEnd(e)
{
    e.preventDefault();

    touchFlag = false;
    tempPos = {x: parseInt(e.rawX), y: parseInt(e.rawY)};

    lastSpeedX = tempPos.x - prePosX;
    if(Math.abs(lastSpeedX) > 0)
    {
        touchLastFlag = true;
    }
}
function touchCancel(e)
{
    touchEnd(e);
}
function updateFrame()
{
    if(tempFrame < 0)
    {
        tempFrame = tempFrame + maxFrame;
    }
    
    tempFrame     = tempFrame % maxFrame;
    var normFrame = Math.floor(tempFrame / unitFrame); 
    imageSprite.gotoAndStop(normFrame);
    stage.update();
}
function handleTick()
{
    if(touchFlag)
    {
        var offsetX = -(tempPos.x - startPos.x);
        tempFrame   = startFrame + offsetX;
        updateFrame();
        prePosX = tempPos.x;
        return false;
    }

    if(touchLastFlag)
    {
       tempFrame  = tempFrame - lastSpeedX; 
       lastSpeedX = parseInt(lastSpeedX * 0.9);
       if(Math.abs(lastSpeedX) < 1)
       {
           touchLastFlag = false;
       }
       updateFrame();
       return false;
    }

    tempFrame++;
    updateFrame();
}
