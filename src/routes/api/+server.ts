import type { RequestHandler } from '@sveltejs/kit';
import { text } from '@sveltejs/kit';
import { ImageMagick, initializeImageMagick } from '@imagemagick/magick-wasm';

const grain = 22;
const redness = 1.1;
const yellowness = 1.15;
const blurRadius = 2;

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

        const buffer = await response.arrayBuffer();
        await initializeImageMagick();

        const image: any = await ImageMagick.read(buffer);
        image.gaussianBlur(blurRadius, blurRadius);

        // Apply grain and color adjustments
        image.modulate({ brightness: redness * 100, saturation: yellowness * 100 });

        const outputBuffer = await image.toBuffer('png');

        return new Response(outputBuffer, {
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