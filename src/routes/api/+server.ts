import type { RequestHandler } from '@sveltejs/kit';
import { json, text } from '@sveltejs/kit';
import fetch from 'node-fetch';
import { createCanvas, loadImage, ImageData as CanvasImageData } from 'canvas';

const grain = 22;
const redness = 1.1;
const yellowness = 1.15;
const blurRadius = 2;

// Custom type to match the structure of canvas ImageData
type CustomImageData = {
    width: number;
    height: number;
    data: Uint8ClampedArray;
};

export const GET: RequestHandler = async ({ url }) => {
    const imageUrl = url.searchParams.get('url');
    if (!imageUrl) {
        return text('Missing image URL', { status: 400 });
    }

    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            return text('Failed to fetch image', { status: 500 });
        }

        const buffer = await response.buffer();
        const image = await loadImage(buffer);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0);

        let imageData = ctx.getImageData(0, 0, image.width, image.height) as unknown as CustomImageData;
        let data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            let noise = Math.random() * (grain * 2) - grain;
            data[i] += noise; // Red
            data[i + 1] += noise; // Green
            data[i + 2] += noise; // Blue
        }

        imageData = gaussianBlur(imageData, blurRadius);
        data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.round((data[i] * redness * yellowness) / 32) * 32;
            data[i + 1] = Math.round((data[i + 1] * yellowness) / 32) * 32;
            data[i + 2] = Math.round(data[i + 2] / 64) * 64;
        }

        ctx.putImageData(new CanvasImageData(data, imageData.width, imageData.height), 0, 0);

        return new Response(canvas.toBuffer(), {
            status: 200,
            headers: {
                'Content-Type': 'image/png'
            }
        });
    } catch (error) {
        console.error('Error processing image:', error);
        return text('Error processing image', { status: 500 });
    }
};

function gaussianBlur(imageData: CustomImageData, radius: number): CustomImageData {
    const { width, height, data } = imageData;
    const newData = new Uint8ClampedArray(data.length);
    const kernelSize = (radius * 2) + 1;
    const kernel = new Float32Array(kernelSize * kernelSize);
    const sigma = radius / 3;
    const sigma2 = sigma * sigma;
    const piSigma2 = Math.PI * sigma2;
    let kernelSum = 0;

    for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
            const weight = Math.exp(-(x * x + y * y) / (2 * sigma2)) / piSigma2;
            kernel[(y + radius) * kernelSize + (x + radius)] = weight;
            kernelSum += weight;
        }
    }

    for (let i = 0; i < kernel.length; i++) {
        kernel[i] /= kernelSum;
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = 0;
            for (let ky = -radius; ky <= radius; ky++) {
                for (let kx = -radius; kx <= radius; kx++) {
                    const px = Math.min(width - 1, Math.max(0, x + kx));
                    const py = Math.min(height - 1, Math.max(0, y + ky));
                    const offset = (py * width + px) * 4;
                    const weight = kernel[(ky + radius) * kernelSize + (kx + radius)];
                    r += data[offset] * weight;
                    g += data[offset + 1] * weight;
                    b += data[offset + 2] * weight;
                    a += data[offset + 3] * weight;
                }
            }
            const offset = (y * width + x) * 4;
            newData[offset] = r;
            newData[offset + 1] = g;
            newData[offset + 2] = b;
            newData[offset + 3] = a;
        }
    }

    return { width, height, data: newData };
}