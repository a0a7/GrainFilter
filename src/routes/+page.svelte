<script lang="ts">
    let imageFile: HTMLImageElement | null = null;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;

    // Handle image upload
    function handleFileUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                imageFile = new Image();
                imageFile.src = e.target?.result as string;
                imageFile.onload = () => drawImage();
            };
            reader.readAsDataURL(file);
        }
    }

    // Apply 90s anime grain and color grading effect
    function drawImage(): void {
        if (!imageFile || !ctx) return;

        const width = canvas.width = imageFile.width;
        const height = canvas.height = imageFile.height;

        // Draw the uploaded image to the canvas
        ctx.drawImage(imageFile, 0, 0, width, height);

        // Apply grain effect
        let imageData = ctx.getImageData(0, 0, width, height);
        let data = imageData.data;

        // Simulate grainy look
        for (let i = 0; i < data.length; i += 4) {
            let noise = Math.random() * 50 - 25; // Grain noise
            data[i] += noise;      // Red
            data[i + 1] += noise;  // Green
            data[i + 2] += noise;  // Blue
        }

        // Apply retro anime color grading (soft pastel tones)
        for (let i = 0; i < data.length; i += 4) {
            data[i] = data[i] * 1.1 + 15;  // Red
            data[i + 1] = data[i + 1] * 1.05 + 10; // Green
            data[i + 2] = data[i + 2] * 0.9; // Blue
        }

        ctx.putImageData(imageData, 0, 0);
    }

    // Initialize canvas context
    $: if (canvas) {
        ctx = canvas.getContext('2d');
    }
</script>

<style>
    .upload-section {
        margin: 20px;
        text-align: center;
    }

    .canvas-container {
        display: flex;
        justify-content: center;
        margin-top: 20px;
    }

    canvas {
        border: 2px solid #ccc;
    }
</style>

<div class="upload-section">
    <h1>90s Anime Filter</h1>
    <input type="file" accept="image/*" on:change={handleFileUpload} />
</div>

<div class="canvas-container">
    <canvas bind:this={canvas}></canvas>
</div>