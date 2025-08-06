import type { ImageData } from "@/types";

export const getPNGImageData = async (imageUrl: string) => {
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();

  return new Promise<ImageData>((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({
          rgbaValues: [],
          imageWidth: 0,
          imageHeight: 0,
          image: img,
        });
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const pixelData = ctx.getImageData(0, 0, img.width, img.height);
      const rgbaValues: ImageData["rgbaValues"] = [];

      for (let i = 0; i < pixelData.data.length; i += 4) {
        rgbaValues.push({
          r: pixelData.data[i],
          g: pixelData.data[i + 1],
          b: pixelData.data[i + 2],
          a: pixelData.data[i + 3],
        });
      }

      resolve({
        rgbaValues,
        imageWidth: img.width,
        imageHeight: img.height,
        image: img,
      });
    };

    img.src = URL.createObjectURL(imageBlob);
  });
};
