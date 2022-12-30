const { ipcRenderer } = require("electron");

// Select elements from the DOM
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const videoSelectBtn = document.getElementById("videoSelectBtn");
const videoElement = document.querySelector("video");

// Get the available video sources
// ipcRenderer.invoke("some-name").then((result) => {
//   console.log(result);
// });
const getVideoSources = async () => {
  const sources = await ipcRenderer.invoke("sources");
  const inputSources = await sources;

  // console.log(inputSources);
  ipcRenderer.send("show-context-menu", inputSources);
};

// event listeners
// videoSelectBtn.onclick = getVideoSources;

videoSelectBtn.addEventListener("click", (e) => {
  e.preventDefault();
  //   ipcRenderer.send("show-context-menu", { name: "something" });
  getVideoSources();
});

let mediaRecorder;
const recordedChunks = [];

ipcRenderer.on("context-menu-command", async (e, name, id) => {
  // console.log("what is happening", name);
  videoSelectBtn.textContent = name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: id,
      },
    },
  };

  // create a stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

  // create the media recorder
  const options = { mimetype: "video/webm; codecs-vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  // register event handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
});

// controls
startBtn.addEventListener("click", (e) => {
  if (!mediaRecorder) return;
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.textContent = "Recording";
});

stopBtn.addEventListener("click", (e) => {
  if (!mediaRecorder) return;
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.textContent = "Start";
});

// capture all recorded chunks
function handleDataAvailable(e) {
  console.log("Video data available");
  recordedChunks.push(e.data);
}

// saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  ipcRenderer.send(
    "dialog-content",
    {
      buttonLabel: "Save video",
      defaultPath: `vid-${Date.now()}.webm`,
    },
    buffer
  );

  // const { filePath } = await dialog.showSaveDialog({
  //   buttonLabel: "Save video",
  //   defaultPath: `vid-${Date.now()}.webm`,
  // });
}
