<script lang="ts">
    let imageFile: HTMLImageElement | null = null;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;

    let grain = 22;
    let redness = 1.1;
    let yellowness = 1.15; 
    let blurRadius = 2; // Slight blur radius

    function handleFileUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                imageFile = new Image();
                imageFile.src = e.target?.result as string;
                imageFile.onload = () => {
                    if (ctx) {
                        drawImage();
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    }

    function drawImage(): void {
        if (!imageFile || !ctx) return;

        const width = imageFile.width;
        const height = imageFile.height;

        if (width === 0 || height === 0) return;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(imageFile, 0, 0, width, height);

        let imageData = ctx.getImageData(0, 0, width, height);
        let data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            let noise = Math.random() * (grain * 2) - grain;
            data[i] += noise; // Red
            data[i + 1] += noise; // Green
            data[i + 2] += noise; // Blue
        }

        // Apply Gaussian blur after noise
        imageData = gaussianBlur(imageData, blurRadius);
        data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.round((data[i] * redness * yellowness) / 32) * 32; 
            data[i + 1] = Math.round((data[i + 1] * yellowness) / 32) * 32; 
            data[i + 2] = Math.round(data[i + 2] / 64) * 64; 
        }

        ctx.putImageData(imageData, 0, 0);
    }

    function gaussianBlur(imageData: ImageData, radius: number): ImageData {
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

        return new ImageData(newData, width, height);
    }

    function saveImage(): void {
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function openInNewTab(): void {
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        const newTab = window.open();
        if (newTab) {
            newTab.document.body.innerHTML = `<img src="${dataUrl}" />`;
        }
    }

    $: if (canvas) {
        ctx = canvas.getContext('2d');
    }

    $: if (imageFile && ctx) {
        drawImage();
    }

    $: if (ctx && imageFile && grain !== undefined) {
        drawImage();
    }
</script>

<style>
    canvas {
        max-height: 50vh;
        width: auto;
    }

    @media (min-width: 768px) {
        canvas {
            max-height: 25vh;
        }
    }
</style>

<div class="flex flex-col items-center bg-gray-900 text-white min-h-screen p-4 pt-8">
    <input type="file" accept="image/*" on:change={handleFileUpload} class="mb-4 p-2 border border-gray-700 rounded bg-gray-800 text-white hover:bg-gray-700 transition duration-200" />
    <canvas bind:this={canvas} class="border-2 border-gray-700 mb-4 max-h-[50vh] md:max-h-[25vh] w-auto"></canvas>
    <div class="flex flex-row items-center space-x-2">
        <button on:click={saveImage} class="p-2 border border-gray-700 rounded bg-gray-800 text-white hover:bg-gray-700 transition duration-200">Save Image</button>
        <button on:click={openInNewTab} class="p-2 border border-gray-700 rounded bg-gray-800 text-white hover:bg-gray-700 transition duration-200">Open in New Tab</button>
    </div>
</div>