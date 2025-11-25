const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
const photoUpload = document.getElementById('photoUpload');
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
const downloadBtn = document.getElementById('downloadBtn');

let userPhoto = null;
let frameImage = null;
let photoX = 0;
let photoY = 0;
let photoScale = 1;
let baseScale = 1; // Store the base scale to fit frame
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let isHovering = false;

// Set canvas size
canvas.width = 500;
canvas.height = 500;

// Load frame image
frameImage = new Image();
frameImage.src = 'assets/frame.png';
frameImage.onload = () => {
    drawCanvas();
};
frameImage.onerror = () => {
    // If frame doesn't exist, draw placeholder
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.fillStyle = '#999';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Frame: assets/frame.png', canvas.width / 2, canvas.height / 2);
};

// Photo upload handler
photoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            userPhoto = new Image();
            userPhoto.onload = () => {
                // Calculate base scale to fit the image to canvas size
                const scaleX = canvas.width / userPhoto.width;
                const scaleY = canvas.height / userPhoto.height;
                baseScale = Math.min(scaleX, scaleY);
                
                // Set zoom to 100% by default
                photoScale = baseScale;
                zoomSlider.value = 100;
                zoomSlider.min = 1;
                zoomSlider.max = 200;
                zoomValue.textContent = '100%';
                
                // Center the photo
                photoX = (canvas.width - userPhoto.width * photoScale) / 2;
                photoY = (canvas.height - userPhoto.height * photoScale) / 2;
                
                zoomSlider.disabled = false;
                downloadBtn.disabled = false;
                drawCanvas();
            };
            userPhoto.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Zoom slider handler
zoomSlider.addEventListener('input', (e) => {
    if (userPhoto) {
        const oldScale = photoScale;
        const zoomPercent = e.target.value / 100;
        const newScale = baseScale * zoomPercent;
        
        // Calculate the center point of the current photo position
        const centerX = photoX + (userPhoto.width * oldScale) / 2;
        const centerY = photoY + (userPhoto.height * oldScale) / 2;
        
        // Update scale
        photoScale = newScale;
        
        // Recalculate position to keep the same center point
        photoX = centerX - (userPhoto.width * photoScale) / 2;
        photoY = centerY - (userPhoto.height * photoScale) / 2;
        
        zoomValue.textContent = e.target.value + '%';
        drawCanvas();
    }
});

// Mouse drag handlers
canvas.addEventListener('mousedown', (e) => {
    if (userPhoto) {
        isDragging = true;
        const rect = canvas.getBoundingClientRect();
        dragStartX = e.clientX - rect.left - photoX;
        dragStartY = e.clientY - rect.top - photoY;
        e.preventDefault();
    }
});

document.addEventListener('mousemove', (e) => {
    if (isDragging && userPhoto) {
        const rect = canvas.getBoundingClientRect();
        photoX = e.clientX - rect.left - dragStartX;
        photoY = e.clientY - rect.top - dragStartY;
        checkBoundaries();
        drawCanvas();
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    if (userPhoto) {
        isHovering = false;
        drawCanvas();
    }
});

canvas.addEventListener('mouseenter', () => {
    if (userPhoto) {
        isHovering = true;
        drawCanvas();
    }
});

// Touch drag handlers for mobile
canvas.addEventListener('touchstart', (e) => {
    if (userPhoto) {
        isDragging = true;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        dragStartX = touch.clientX - rect.left - photoX;
        dragStartY = touch.clientY - rect.top - photoY;
        e.preventDefault();
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (isDragging && userPhoto) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        photoX = touch.clientX - rect.left - dragStartX;
        photoY = touch.clientY - rect.top - dragStartY;
        checkBoundaries();
        drawCanvas();
        e.preventDefault();
    }
});

canvas.addEventListener('touchend', () => {
    isDragging = false;
});

// Check if image is completely outside canvas and re-center if needed
function checkBoundaries() {
    if (!userPhoto) return;
    
    const scaledWidth = userPhoto.width * photoScale;
    const scaledHeight = userPhoto.height * photoScale;
    
    // Check if image is completely outside the canvas
    const completelyOutLeft = photoX + scaledWidth < 0;
    const completelyOutRight = photoX > canvas.width;
    const completelyOutTop = photoY + scaledHeight < 0;
    const completelyOutBottom = photoY > canvas.height;
    
    // Re-center if completely outside
    if (completelyOutLeft || completelyOutRight || completelyOutTop || completelyOutBottom) {
        photoX = (canvas.width - scaledWidth) / 2;
        photoY = (canvas.height - scaledHeight) / 2;
    }
}

// Draw canvas
function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw user photo (behind the frame)
    if (userPhoto) {
        const scaledWidth = userPhoto.width * photoScale;
        const scaledHeight = userPhoto.height * photoScale;
        ctx.drawImage(userPhoto, photoX, photoY, scaledWidth, scaledHeight);
    }
    
    // Draw frame on top with reduced opacity when hovering
    if (frameImage.complete && frameImage.naturalWidth > 0) {
        if (userPhoto && isHovering) {
            ctx.globalAlpha = 0.3;
        }
        ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
    }
}

// Download handler
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'framed-photo.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});
