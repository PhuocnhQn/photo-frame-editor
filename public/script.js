const canvas = new fabric.Canvas("canvas", {
  preserveObjectStacking: true,
  selection: false
});

let currentFrame;
let userImage;

// Load frames dynamically from /public/frames
const framesWrap = document.getElementById("frames");

async function loadFrames(selectLast = false) {
  framesWrap.innerHTML = "";
  try {
    const res = await fetch("/frames");
    const images = await res.json();

    images.forEach((fileName, idx) => {
      const item = document.createElement("div");
      item.className = "frame-item";

      const img = document.createElement("img");
      img.src = "/frames/" + encodeURIComponent(fileName); // encode để tránh khoảng trắng/Unicode
      img.alt = `Khung ${idx + 1}`;
      img.className = "frame-thumb";

      item.appendChild(img);
      item.addEventListener("click", () => selectFrame(img.src));

      framesWrap.appendChild(item);

      if (selectLast && idx === images.length - 1) {
        selectFrame(img.src);
      }
    });
  } catch (err) {
    console.error("Lỗi khi load frames:", err);
  }
}

// Load khi trang mở
loadFrames();


function selectFrame(src) {
  fabric.Image.fromURL(src, frame => {
    if (currentFrame) canvas.remove(currentFrame);
    // scale frame to fit canvas width while preserving aspect
    const scale = Math.min(canvas.width / frame.width, canvas.height / frame.height);
    frame.scale(scale);
    frame.set({ left: (canvas.width - frame.getScaledWidth()) / 2, top: (canvas.height - frame.getScaledHeight()) / 2 });
    frame.selectable = false;
    frame.evented = false;
    canvas.add(frame);
    currentFrame = frame;
    canvas.bringToFront(currentFrame);
    canvas.requestRenderAll();
    // Optionally fit user image inside
    if (userImage) fitToFrame();
  });
}

// Upload image
document.getElementById("upload").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (evt) {
    fabric.Image.fromURL(evt.target.result, img => {
      if (userImage) canvas.remove(userImage);
      userImage = img;
      userImage.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: "center",
        originY: "center",
        cornerStyle: "circle",
        transparentCorners: false,
        borderColor: "#6ea8fe",
        cornerColor: "#6ea8fe",
        rotatingPointOffset: 24
      });
      // reasonable start size
      const scale = Math.min(canvas.width * 0.7 / img.width, canvas.height * 0.7 / img.height);
      userImage.scale(scale);
      canvas.add(userImage);
      if (currentFrame) canvas.bringToFront(currentFrame);
      canvas.setActiveObject(userImage);
      canvas.requestRenderAll();
      updateControlsFromObject();
    });
  };
  reader.readAsDataURL(file);
});

document.getElementById("clear").addEventListener("click", () => {
  if (userImage) {
    canvas.remove(userImage);
    userImage = null;
    canvas.requestRenderAll();
  }
});

// Controls
const scaleInput = document.getElementById("scale");
const rotateInput = document.getElementById("rotate");

function updateControlsFromObject() {
  if (!userImage) return;
  scaleInput.value = userImage.scaleX?.toFixed(2) || 1;
  rotateInput.value = userImage.angle || 0;
}

scaleInput.addEventListener("input", () => {
  if (!userImage) return;
  const s = parseFloat(scaleInput.value);
  userImage.scale(s);
  canvas.requestRenderAll();
});

rotateInput.addEventListener("input", () => {
  if (!userImage) return;
  userImage.rotate(parseFloat(rotateInput.value));
  canvas.requestRenderAll();
});

document.getElementById("center").addEventListener("click", () => {
  if (!userImage) return;
  userImage.set({ left: canvas.width / 2, top: canvas.height / 2, originX: "center", originY: "center" });
  canvas.requestRenderAll();
});

document.getElementById("flipH").addEventListener("click", () => {
  if (!userImage) return;
  userImage.toggle("flipX");
  canvas.requestRenderAll();
});
document.getElementById("flipV").addEventListener("click", () => {
  if (!userImage) return;
  userImage.toggle("flipY");
  canvas.requestRenderAll();
});

document.getElementById("fit").addEventListener("click", fitToFrame);

function fitToFrame() {
  if (!userImage) return;
  // Fit user image to canvas or to current frame bounds if any
  let targetW = canvas.width, targetH = canvas.height, left = canvas.width / 2, top = canvas.height / 2;
  if (currentFrame) {
    targetW = currentFrame.getScaledWidth();
    targetH = currentFrame.getScaledHeight();
    left = currentFrame.left + targetW / 2;
    top = currentFrame.top + targetH / 2;
  }
  const s = Math.min(targetW / userImage.width, targetH / userImage.height);
  userImage.set({ originX: "center", originY: "center", left, top });
  userImage.scale(s);
  canvas.requestRenderAll();
  updateControlsFromObject();
}

// Keep frame always on top visually
canvas.on("object:modified", () => currentFrame && canvas.bringToFront(currentFrame));
canvas.on("object:moving", () => currentFrame && canvas.bringToFront(currentFrame));
canvas.on("after:render", () => currentFrame && currentFrame.set({ dirty: true }));

// Download
document.getElementById("download").addEventListener("click", () => {
  // Temporarily hide active controls for clean export
  const active = canvas.getActiveObject();
  if (active) active.set("active", false);
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  const link = document.createElement("a");
  link.href = canvas.toDataURL({ format: "png" });
  link.download = "framed-photo.png";
  link.click();
  // Restore active state
  if (active) canvas.setActiveObject(active);
});

// Helper: toggle boolean property
fabric.Object.prototype.toggle = function (prop) {
  this.set(prop, !this[prop]);
};
