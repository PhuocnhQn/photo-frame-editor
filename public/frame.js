const frameUpload = document.getElementById("frameUpload");
const clearFrame = document.getElementById("clearFrame");

// Upload frame mới
frameUpload.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("frame", file);

    await fetch("/upload-frame", { method: "POST", body: formData });
    loadFrames(true); // load lại và tự động chọn frame vừa thêm
});

// Xóa frame đã chọn
clearFrame.addEventListener("click", async () => {
    if (!currentFrame) return alert("Chưa có frame nào được chọn!");

    const fileName = currentFrame._element.src.split("/").pop(); // lấy tên file từ src
    if (!confirm("Bạn có chắc muốn xóa khung này?")) return;

    await fetch("/delete-frame/" + encodeURIComponent(fileName), { method: "DELETE" });
    canvas.remove(currentFrame);
    currentFrame = null;
    loadFrames(); // load lại danh sách frame
});
