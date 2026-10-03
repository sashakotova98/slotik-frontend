import { api } from "./api";

export type UploadedPhoto = {
  url: string;
  publicId: string;
};

export async function apiUploadPhoto(file: File): Promise<UploadedPhoto> {
  const formData = new FormData();
  formData.append("file", file);

  return api<UploadedPhoto>("/Photo/upload", {
    method: "POST",
    body: formData,
  });
}
