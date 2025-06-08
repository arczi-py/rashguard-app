<template>
  <div class="relative w-full h-full select-none">
    <!-- Main canvas for rendering -->
    <canvas 
      ref="canvas"
      class="absolute inset-0 w-full h-full"
      @mousedown.prevent="startDrag"
      @mousemove="onDrag"
      @mouseup="endDrag"
      @mouseleave="endDrag"
      @dblclick.prevent="handleDoubleClick"
    ></canvas>
    
    <!-- Overlay for text editing -->
    <div
      v-if="editingText"
      ref="textEditor"
      class="absolute px-1 outline-none text-center select-text"
      :style="{
        left: `${editingText.x}px`,
        top: `${editingText.y}px`,
        transform: 'translate(-50%, -50%)',
        font: getElementFont(editingText),
        color: editingText.color || '#000000',
        minWidth: '50px',
        whiteSpace: 'pre-wrap'
      }"
      contenteditable="true"
      @blur="finishTextEditing"
      @keydown.enter.prevent="finishTextEditing"
    >{{ editingText.text }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';

// Add throttle utility function
function throttle(func, limit) {
  let inThrottle;
  let lastResult;
  return function(...args) {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func.apply(this, args);
      setTimeout(() => inThrottle = false, limit);
    }
    return lastResult;
  }
}

const props = defineProps({
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  elements: {
    type: Array,
    required: true
  },
  backgroundSvg: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:elements', 'select-element']);

const canvas = ref(null);
const ctx = ref(null);
const transformMode = ref(null);
const transformStart = ref(null);
const selectedElement = ref(null);
const editingText = ref(null);
const textEditor = ref(null);
const imageCache = new Map();
const backgroundImage = ref(null);
const svgLoadingError = ref(false);
const isDragging = ref(false);
const dpr = ref(window.devicePixelRatio || 1);
const canvasRect = ref(null);

// Create throttled versions of render and onDrag
const throttledRender = throttle(render, 16); // ~60fps
const throttledDrag = throttle((event) => {
  if (!isDragging.value || !transformStart.value || editingText.value) return;
  
  const rect = canvas.value.getBoundingClientRect();
  const scale = rect.width / props.width;
  
  // Convert mouse coordinates to design space
  const x = (event.clientX - rect.left) / scale;
  const y = (event.clientY - rect.top) / scale;
  
  if (transformMode.value === 'move') {
    const dx = x - transformStart.value.x;
    const dy = y - transformStart.value.y;
    
    const updatedElements = [...props.elements];
    const element = updatedElements[selectedElement.value];
    
    if (element) {
      element.x = Math.round(transformStart.value.initialX + dx);
      element.y = Math.round(transformStart.value.initialY + dy);
      emit('update:elements', updatedElements);
    }
  }
}, 16);

// Initialize canvas
onMounted(() => {
  initCanvas();
  loadBackground();
  window.addEventListener('mousemove', throttledDrag);
  window.addEventListener('mouseup', endDrag);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', throttledDrag);
  window.removeEventListener('mouseup', endDrag);
  window.removeEventListener('resize', updateCanvasSize);
  window.removeEventListener('mousemove', handleTransform);
  window.removeEventListener('mouseup', endTransform);
});

function initCanvas() {
  ctx.value = canvas.value.getContext('2d');
  updateCanvasSize();
  window.addEventListener('resize', updateCanvasSize);
}

function updateCanvasSize() {
  const rect = canvas.value.getBoundingClientRect();
  canvasRect.value = rect;
  
  // Update canvas size with proper DPI scaling
  canvas.value.width = rect.width * dpr.value;
  canvas.value.height = rect.height * dpr.value;
  
  // Scale all drawing operations
  ctx.value.scale(dpr.value, dpr.value);
  
  // Initial render
  render();
}

// Update watchers to use throttled render
watch(() => props.elements, () => {
  throttledRender();
}, { deep: true, immediate: true });

watch(() => props.backgroundSvg, () => {
  svgLoadingError.value = false;
  loadBackground();
});

function loadBackground() {
  if (!props.backgroundSvg) return;
  
  const cacheKey = props.backgroundSvg;
  if (imageCache.has(cacheKey)) {
    const cachedImage = imageCache.get(cacheKey);
    if (cachedImage.complete) {
      backgroundImage.value = cachedImage;
      throttledRender();
    } else {
      cachedImage.onload = () => {
        backgroundImage.value = cachedImage;
        throttledRender();
      };
    }
    return;
  }
  
  try {
    const img = new Image();
    
    img.onload = () => {
      imageCache.set(cacheKey, img);
      backgroundImage.value = img;
      svgLoadingError.value = false;
      throttledRender();
    };
    
    img.onerror = (error) => {
      console.error('Error loading background image:', error);
      if (!svgLoadingError.value) {
        svgLoadingError.value = true;
        retryLoadWithFallback(img, cacheKey);
      }
    };
    
    const svgBlob = new Blob([props.backgroundSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  } catch (error) {
    console.error('Error in loadBackground:', error);
    if (!svgLoadingError.value) {
      svgLoadingError.value = true;
      retryLoadWithFallback(new Image(), cacheKey);
    }
  }
}

function retryLoadWithFallback(img, cacheKey) {
  try {
    // Enhanced SVG encoding with better special character handling
    const svgString = props.backgroundSvg
      .replace(/[\u00A0-\u9999<>&]/gim, (i) => '&#' + i.charCodeAt(0) + ';')
      .replace(/#/g, '%23')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/'/g, '%27')
      .replace(/`/g, '%60')
      .replace(/\s+/g, ' ')
      .trim();

    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    
    img.onload = () => {
      imageCache.set(cacheKey, img);
      backgroundImage.value = img;
      svgLoadingError.value = false;
      throttledRender();
    };
    
    img.src = dataUrl;
  } catch (error) {
    console.error('Error in retryLoadWithFallback:', error);
    svgLoadingError.value = true;
  }
}

function render() {
  if (!ctx.value) return;
  
  const rect = canvas.value.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  
  // Clear canvas with proper scaling
  ctx.value.save();
  ctx.value.setTransform(1, 0, 0, 1, 0, 0);
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.value.restore();
  
  // Apply base transform for all drawing operations
  ctx.value.save();
  
  // Calculate the scale to fit the design space into the canvas
  const scale = rect.width / props.width;
  ctx.value.scale(scale, scale);
  
  // Enable transparency
  ctx.value.globalCompositeOperation = 'source-over';
  
  // Draw SVG background (bluzka) ROZCIĄGNIĘTA NA CAŁY CANVAS
  if (backgroundImage.value) {
    ctx.value.drawImage(backgroundImage.value, 0, 0, props.width, props.height);
  }
  
  // Draw all elements with proper transparency
  props.elements.forEach((element, index) => {
    ctx.value.save();
    
    // Move to element position
    ctx.value.translate(element.x, element.y);
    
    // Apply element transformations
    if (element.rotation) {
      ctx.value.rotate(element.rotation * Math.PI / 180);
    }
    if (element.scale) {
      ctx.value.scale(element.scale, element.scale);
    }
    
    // Enable transparency for each element
    ctx.value.globalCompositeOperation = 'source-over';
    
    if (element.type === 'text' && editingText.value !== element) {
      drawText(element);
    } else if (element.type === 'image') {
      drawImage(element);
    }
    
    ctx.value.restore();
    
    // Draw selection box if element is selected
    if (index === selectedElement.value) {
      drawSelectionBox(element);
    }
  });
  
  ctx.value.restore();
}

function drawGrid(width, height) {
  ctx.value.save();
  ctx.value.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.value.lineWidth = 1;
  
  // Draw vertical lines
  for (let x = 0; x <= width; x += 10) {
    ctx.value.beginPath();
    ctx.value.moveTo(x, 0);
    ctx.value.lineTo(x, height);
    ctx.value.stroke();
  }
  
  // Draw horizontal lines
  for (let y = 0; y <= height; y += 10) {
    ctx.value.beginPath();
    ctx.value.moveTo(0, y);
    ctx.value.lineTo(width, y);
    ctx.value.stroke();
  }
  
  ctx.value.restore();
}

function getElementFont(element) {
  const parts = [];
  if (element.italic) parts.push('italic');
  if (element.bold) parts.push('bold');
  parts.push(`${element.fontSize || 16}px`);
  parts.push(element.fontFamily || 'Arial');
  return parts.join(' ');
}

function drawText(element) {
  if (!ctx.value) return;
  
  // Set text styles
  ctx.value.font = getElementFont(element);
  ctx.value.fillStyle = element.color || '#000000';
  ctx.value.textBaseline = 'middle';
  ctx.value.textAlign = element.textAlign || 'center';
  
  // Apply letter spacing if specified
  if (element.letterSpacing) {
    ctx.value.letterSpacing = `${element.letterSpacing}px`;
  }
  
  // Split text into lines and calculate dimensions
  const lines = element.text.split('\n');
  const lineHeight = element.fontSize * (element.lineHeight || 1.2);
  const totalHeight = lines.length * lineHeight;
  
  // Draw each line with proper positioning
  lines.forEach((line, index) => {
    const y = (index - (lines.length - 1) / 2) * lineHeight;
    ctx.value.fillText(line, 0, y);
  });
}

function drawImage(element) {
     if (!ctx.value) return;
     
     const img = imageCache.get(element.src);
     if (!img || !img.complete) {
       if (!imageCache.has(element.src)) {
         const newImg = new Image();
         newImg.onload = () => {
           imageCache.set(element.src, newImg);
           render();
         };
         newImg.src = element.src;
       }
       return;
     }
   
     try {
       const width = element.width || img.width;
       const height = element.height || img.height;

      // Rysujemy PNG bez nadpisywania tła koszulki
      ctx.value.drawImage(img, -width/2, -height/2, width, height);
     } catch (error) {
       console.error('Error drawing image:', error);
     }
   }

function drawSelectionBox(element) {
  if (!ctx.value) return;
  
  ctx.value.save();
  
  // Move to element center
  ctx.value.translate(element.x, element.y);
  
  // Apply rotation if any
  if (element.rotation) {
    ctx.value.rotate(element.rotation * Math.PI / 180);
  }
  
  // Calculate dimensions
  const width = element.width * (element.scale || 1);
  const height = element.height * (element.scale || 1);
  
  // Draw selection rectangle
  ctx.value.strokeStyle = '#000000';
  ctx.value.lineWidth = 1;
  ctx.value.setLineDash([5, 5]);
  ctx.value.strokeRect(-width/2, -height/2, width, height);
  
  ctx.value.restore();
}

function handleDoubleClick(event) {
  if (isDragging.value) return;
  
  const rect = canvas.value.getBoundingClientRect();
  const scale = rect.width / props.width;
  const x = (event.clientX - rect.left) / scale;
  const y = (event.clientY - rect.top) / scale;
  
  const clickedIndex = findElementAtPosition(x, y);
  
  if (clickedIndex !== -1) {
    const element = props.elements[clickedIndex];
    if (element.type === 'text') {
      selectedElement.value = clickedIndex;
      emit('select-element', clickedIndex);
      startTextEditing(element);
      event.preventDefault();
    }
  }
}

function startTextEditing(element) {
  editingText.value = element;
  nextTick(() => {
    if (textEditor.value) {
      const rect = canvas.value.getBoundingClientRect();
      const scale = rect.width / props.width;
      const x = element.x * scale;
      const y = element.y * scale;
      
      textEditor.value.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      textEditor.value.style.width = `${element.width * scale}px`;
      textEditor.value.style.height = `${element.height * scale}px`;
      textEditor.value.focus();
      
      // Select all text for immediate editing
      const range = document.createRange();
      range.selectNodeContents(textEditor.value);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
}

function finishTextEditing(event) {
  if (!editingText.value) return;
  
  // Get the updated text content
  const newText = event.target.innerText.trim();
  
  if (newText) {
    // Find the original element and update it
    const elementIndex = props.elements.findIndex(e => 
      e.type === 'text' && 
      e.x === editingText.value.x && 
      e.y === editingText.value.y
    );
    
    if (elementIndex !== -1) {
      const updatedElements = [...props.elements];
      updatedElements[elementIndex] = {
        ...updatedElements[elementIndex],
        text: newText
      };
      emit('update:elements', updatedElements);
    }
  }
  
  // Reset editing state
  editingText.value = null;
  nextTick(() => {
    render();
  });
}

function startDrag(event) {
  if (editingText.value) return;
  
  const rect = canvas.value.getBoundingClientRect();
  const scale = rect.width / props.width;
  
  // Convert mouse coordinates to design space
  const x = (event.clientX - rect.left) / scale;
  const y = (event.clientY - rect.top) / scale;
  
  // Check if clicking on an element
  const clickedIndex = findElementAtPosition(x, y);
  
  if (clickedIndex !== -1) {
    selectedElement.value = clickedIndex;
    emit('select-element', clickedIndex);
    
    transformMode.value = 'move';
    transformStart.value = {
      x: x,
      y: y,
      initialX: props.elements[clickedIndex].x,
      initialY: props.elements[clickedIndex].y
    };
    isDragging.value = true;
  } else {
    selectedElement.value = null;
    emit('select-element', null);
  }
}

function endDrag() {
  isDragging.value = false;
  transformMode.value = null;
  transformStart.value = null;
}

function findElementAtPosition(x, y) {
  // Check elements in reverse order (top to bottom)
  for (let i = props.elements.length - 1; i >= 0; i--) {
    const element = props.elements[i];
    
    // Get element bounds
    const halfWidth = (element.width * (element.scale || 1)) / 2;
    const halfHeight = (element.height * (element.scale || 1)) / 2;
    
    // Transform the point based on element's rotation if it has one
    let testX = x - element.x;
    let testY = y - element.y;
    
    if (element.rotation) {
      // Convert rotation to radians
      const angle = -element.rotation * Math.PI / 180;
      // Rotate point around element center
      const rotatedX = testX * Math.cos(angle) - testY * Math.sin(angle);
      const rotatedY = testX * Math.sin(angle) + testY * Math.cos(angle);
      testX = rotatedX;
      testY = rotatedY;
    }
    
    // Check if transformed point is within element bounds
    if (
      testX >= -halfWidth &&
      testX <= halfWidth &&
      testY >= -halfHeight &&
      testY <= halfHeight
    ) {
      return i;
    }
  }
  
  return -1;
}

function getElementBounds(element) {
  const scale = element.scale || 1;
  
  if (element.type === 'text') {
    const width = element.width * scale;
    const height = element.height * scale;
    
    return {
      x: element.x - width / 2,
      y: element.y - height / 2,
      width,
      height
    };
  } else if (element.type === 'image') {
    const width = (element.width || 100) * scale;
    const height = (element.height || 100) * scale;
    
    return {
      x: element.x - width / 2,
      y: element.y - height / 2,
      width,
      height
    };
  }
  
  return { x: 0, y: 0, width: 0, height: 0 };
}

function getTransformHandles(element) {
  const bounds = getElementBounds(element);
  const rotation = element.rotation || 0;
  const rad = rotation * Math.PI / 180;
  
  // Helper function to rotate a point around the center
  const rotatePoint = (x, y) => {
    const dx = x - element.x;
    const dy = y - element.y;
    return {
      x: element.x + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: element.y + dx * Math.sin(rad) + dy * Math.cos(rad)
    };
  };
  
  return {
    rotate: rotatePoint(element.x, bounds.y - 30),
    nw: rotatePoint(bounds.x, bounds.y),
    ne: rotatePoint(bounds.x + bounds.width, bounds.y),
    se: rotatePoint(bounds.x + bounds.width, bounds.y + bounds.height),
    sw: rotatePoint(bounds.x, bounds.y + bounds.height)
  };
}

function isPointInCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function startTransform(e, mode) {
  if (!selectedElement.value) return;
  
  transformMode.value = mode;
  const rect = canvas.value.getBoundingClientRect();
  const scale = rect.width / props.width;
  
  transformStart.value = {
    x: e.clientX,
    y: e.clientY,
    elementX: selectedElement.value.x,
    elementY: selectedElement.value.y,
    elementWidth: selectedElement.value.width,
    elementHeight: selectedElement.value.height,
    elementRotation: selectedElement.value.rotation || 0,
    scale
  };
  
  // Add window-level event listeners
  window.addEventListener('mousemove', handleTransform);
  window.addEventListener('mouseup', endTransform);
}

function handleTransform(e) {
  if (!transformStart.value || !selectedElement.value) return;
  
  const dx = (e.clientX - transformStart.value.x) / transformStart.value.scale;
  const dy = (e.clientY - transformStart.value.y) / transformStart.value.scale;
  
  const updatedElement = { ...selectedElement.value };
  
  switch (transformMode.value) {
    case 'move':
      updatedElement.x = transformStart.value.elementX + dx;
      updatedElement.y = transformStart.value.elementY + dy;
      break;
    case 'rotate':
      const center = {
        x: transformStart.value.elementX + transformStart.value.elementWidth / 2,
        y: transformStart.value.elementY + transformStart.value.elementHeight / 2
      };
      const angle = Math.atan2(
        e.clientY - (center.y * transformStart.value.scale + canvasRect.value.top),
        e.clientX - (center.x * transformStart.value.scale + canvasRect.value.left)
      );
      // Snap to 15-degree intervals
      updatedElement.rotation = Math.round(angle * 180 / Math.PI / 15) * 15;
      break;
    case 'scale':
      const aspectRatio = transformStart.value.elementWidth / transformStart.value.elementHeight;
      const newWidth = Math.max(20, transformStart.value.elementWidth + dx);
      updatedElement.width = newWidth;
      updatedElement.height = newWidth / aspectRatio;
      break;
  }
  
  // Update the element while maintaining reactivity
  const elements = [...props.elements];
  const index = elements.findIndex(el => el === selectedElement.value);
  if (index !== -1) {
    elements[index] = updatedElement;
    emit('update:elements', elements);
  }
}

function endTransform() {
  if (transformMode.value && transformStart.value) {
    // Ensure the final state is captured in history
    const elements = [...props.elements];
    emit('update:elements', elements);
  }
  
  transformMode.value = null;
  transformStart.value = null;
  
  // Clean up window-level event listeners
  window.removeEventListener('mousemove', handleTransform);
  window.removeEventListener('mouseup', endTransform);
}

// Update addImageFromEmoji in App.vue to ensure proper image creation
function addImageFromEmoji(emoji) {
  const size = 100;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  // Create temporary canvas for initial rendering
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = size;
  tempCanvas.height = size;
  
  // Get contexts with alpha enabled
  const ctx = canvas.getContext('2d', { alpha: true });
  const tempCtx = tempCanvas.getContext('2d', { alpha: true });
  
  // Set up text rendering on temp canvas
  tempCtx.textAlign = 'center';
  tempCtx.textBaseline = 'middle';
  tempCtx.font = `${size * 0.8}px Arial`;
  tempCtx.fillStyle = 'black';
  
  // Draw emoji on temp canvas
  tempCtx.fillText(emoji, size/2, size/2);
  
  // Get image data from temp canvas
  const imageData = tempCtx.getImageData(0, 0, size, size);
  const data = imageData.data;
  
  // Create new image data for final canvas
  const finalImageData = ctx.createImageData(size, size);
  const finalData = finalImageData.data;
  
  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // If pixel has any color (not white)
    if (r < 245 || g < 245 || b < 245) {
      finalData[i] = r;     // Red
      finalData[i + 1] = g; // Green
      finalData[i + 2] = b; // Blue
      finalData[i + 3] = a; // Alpha
    } else {
      // Make pixel fully transparent
      finalData[i + 3] = 0;
    }
  }
  
  // Clear main canvas
  ctx.clearRect(0, 0, size, size);
  
  // Put processed image data
  ctx.putImageData(finalImageData, 0, 0);
  
  // Create final image
  const img = new Image();
  img.onload = () => {
    const newElement = {
      type: 'image',
      src: img.src,
      x: props.width / 2,
      y: props.height / 2,
      width: size,
      height: size,
      scale: 1,
      rotation: 0
    };
    
    imageCache.set(img.src, img);
    designElements.value = [...designElements.value, newElement];
    selectedElementIndex.value = designElements.value.length - 1;
  };
  
  // Use PNG format explicitly for transparency
  img.src = canvas.toDataURL('image/png', 1.0);
}
</script>

<style scoped>
[contenteditable] {
  min-width: 1px;
  white-space: pre-wrap;
  outline: none;
  background: transparent;
  user-select: text;
}
</style> 