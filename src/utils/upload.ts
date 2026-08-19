import { axiosInstance } from "../lib/axios";

const MAX_SIZE = 1024 * 1024;

export class UploadError extends Error {}

const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });

const compressImage = async (file: File, maxBytes = MAX_SIZE): Promise<File> => {
  const dataUrl = await readFile(file);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const isPng = file.type === "image/png";
  const type = isPng ? "image/jpeg" : file.type || "image/jpeg";
  const name = file.name.replace(/\.(png|jpg|jpeg|webp|gif)$/i, ".jpg") || "image.jpg";

  let quality = 0.82;
  let blob = await canvasToBlob(canvas, type, quality);
  while (blob && blob.size > maxBytes && quality > 0.4) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, type, quality);
  }
  if (!blob) throw new Error("Failed to compress image");
  if (blob.size > maxBytes) throw new UploadError("Image is too large (max 1MB)");

  return new File([blob], name, { type, lastModified: Date.now() });
};

export const uploadFile = async (file: File): Promise<string> => {
  if (file.size > MAX_SIZE && !file.type.startsWith("image/")) {
    throw new UploadError("File is too large (max 1MB)");
  }
  const toUpload = file.type.startsWith("image/") ? await compressImage(file) : file;

  const formData = new FormData();
  formData.append("image", toUpload);

  const { data } = await axiosInstance.post("/upload", formData);
  return data.url as string;
};