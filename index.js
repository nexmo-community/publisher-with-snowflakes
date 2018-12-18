// Sample code inspired from @aullman (https://github.com/aullman)
const closeToGreen = (r, g, b) => {
  // 86, 246, 61
  if (g > (b * 1.4) && g > (r * 1.4)) {
    return true;
  }
  return false;
};

const getCanvasStream = () => {
  let canvas;
  let cameraVideo;
  let filterVideo;
  let ctx;
  let stopped = false;
  let filterCtx;
  let filterCanvas;
  let cameraCtx;
  let cameraCanvas;

  const drawFrame = () => {
    cameraCtx.drawImage(videoElement, 0, 0, cameraCanvas.width, cameraCanvas.height);
    filterCtx.drawImage(filterVideo, 0, 0, filterCanvas.width, filterCanvas.height);

    const cameraData = cameraCtx.getImageData(0, 0, cameraCanvas.width, cameraCanvas.height);
    const filterData = filterCtx.getImageData(0, 0, filterCanvas.width, filterCanvas.height);
    const res = new Uint8ClampedArray(cameraData.data.length);
    for (let i = 0; i < cameraData.data.length; i += 4) {
      let imgData = cameraData;
      if (!closeToGreen(filterData.data[i], filterData.data[i+1], filterData.data[i+2])) {
        imgData = filterData;
      }
      res[i] = imgData.data[i];
      res[i + 1] = imgData.data[i + 1];
      res[i + 2] = imgData.data[i + 2];
      res[i + 3] = imgData.data[i + 3];
    }
    ctx.putImageData(new ImageData(res, cameraData.width, cameraData.height), 0, 0);
    if (!stopped) {
      requestAnimationFrame(drawFrame);
    } else {
      ctx = null;
    }
  };

  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
  canvas.width = 640;
  canvas.height = 480;

  // Get the Camera video
  OT.getUserMedia({
    audioSource: null
  }).then((stream) => {
    videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.play();
    cameraCanvas = document.createElement('canvas');
    cameraCanvas.width = videoElement.width = 640;
    cameraCanvas.height = videoElement.height = 480;
    cameraCtx = cameraCanvas.getContext('2d');

    requestAnimationFrame(drawFrame);
  });

  // Get the filter video
  filterVideo = document.createElement('video');
  filterVideo.setAttribute('loop', true);
  filterCanvas = document.createElement('canvas');
  filterVideo.src = 'snowflake-greenscreen.mp4';
  filterCanvas.width = filterVideo.width = 640;
  filterCanvas.height = filterVideo.height = 480;
  filterVideo.play();
  filterCtx = filterCanvas.getContext('2d');

  return {
    canvas,
    stop: () => {
      stopped = true;
    }
  };
};

const apiKey = '';
const sessionId = '';
const token = '';

const session = OT.initSession(apiKey, sessionId);
const canvasStream = getCanvasStream();
const publisher = OT.initPublisher('publisher', {
  videoSource: canvasStream.canvas.captureStream(30).getVideoTracks()[0],
});

session.on({
 streamCreated: event => {
   session.subscribe(event.stream);
 },
 sessionConnected: event => {
   session.publish(publisher);
 },
});

session.connect(token, (error) => {
 if (error) {
   console.log(`There was an error connecting to the session ${error.message}`);
 }
});
