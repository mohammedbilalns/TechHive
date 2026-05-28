function initProductImageCropper({ modalId, imageId, createPreviewUpdater }) {
  const modal = document.getElementById(modalId);
  const cropperImage = document.getElementById(imageId);

  let cropper = null;
  let currentImageInput = null;
  let currentPreviewId = null;
  let currentUploadLabelId = null;

  function closeCropper() {
    modal.style.display = "none";
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
  }

  function handleImageUpload(input, previewId, uploadLabelId) {
    if (!input.files || !input.files[0]) {
      return;
    }

    const reader = new FileReader();
    currentImageInput = input;
    currentPreviewId = previewId;
    currentUploadLabelId = uploadLabelId;

    reader.onload = function (event) {
      cropperImage.src = event.target.result;
      modal.style.display = "flex";

      if (cropper) {
        cropper.destroy();
      }

      cropper = new Cropper(cropperImage, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 1,
        background: false,
        zoomable: true,
        scalable: true,
      });
    };

    reader.readAsDataURL(input.files[0]);
  }

  function applyCrop() {
    if (!cropper) {
      return;
    }

    const canvas = cropper.getCroppedCanvas();
    canvas.toBlob((blob) => {
      const file = new File([blob], "croppedImage.png", { type: "image/png" });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      currentImageInput.files = dataTransfer.files;

      createPreviewUpdater({
        previewId: currentPreviewId,
        uploadLabelId: currentUploadLabelId,
        dataUrl: canvas.toDataURL(),
        input: currentImageInput,
      });

      closeCropper();
    });
  }

  return {
    handleImageUpload,
    closeCropper,
    applyCrop,
  };
}

export { initProductImageCropper };
