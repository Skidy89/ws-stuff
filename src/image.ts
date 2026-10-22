import type Requester from "./requester.js";
import type { Session } from "./session.js";
interface ImageLibrary {
  image_items: ImageItem[];
  total_filesize: number;
  total_count: number;
  average_filesize: number;
}
type ImageItem = {
  id: string;
  user_id: string;
  name: string;
  folders: string[];
  image: {
    id: string;
  };
  metadata: {
    type: string;
    width: number;
    height: number;
  };
  filesize: number;
  created_at: string;
};
type imageData = {
  id: string;
  filesize: number;
  width: number;
  height: number;
  format: string;
};
export default class SauceImage {
  constructor(
    private readonly http: Requester,
    private readonly session: Session,
  ) {}
  async getImageLibrary(): Promise<{ images: ImageLibrary }> {
    this.session.getMe();
    const request = await this.http.request<any>("/api/v1/image");
    return { images: request };
  }
  async uploadImage(image: string | Blob | File, name: string) {
    this.session.getMe();
    // this one just generates a presigned URL for uploading an image
    if (typeof image === "string") {
      const res = await fetch(image);
      if (!res.ok) throw new Error(`Failed to fetch image from ${image}`);
      image = await res.blob();
    }
    const data = await this.http.request<{
      upload_url: string;
      upload_attempt_id: string;
    }>("api/v2/images/upload-url", {
      method: "POST",
      body: {
        metadata: null,
      },
    });
    if (!data.upload_url) throw new Error("Failed to get upload URL");
    const uploadUrl = data.upload_url;
    const formData = new FormData();
    formData.append("file", image);
    const res = await this.http.rawRequest<imageData>(uploadUrl, {
      method: "POST",
      body: formData,
    });
    if (!res.id) throw new Error("Failed to upload image");
    const final = await this.http.request<any>(`api/v1/image`, {
      method: "POST",
      body: {
        filesize: res.filesize,
        image_id: res.id,
        name,
        metadata: {
          width: res.width,
          height: res.height,
          type: res.format,
        },
      },
    });
    return final.image_item as ImageItem;
  }
  formatImage(id: string) {
    return `https://saucepan.ai/cdn/${id}/highres`;
  }
}
