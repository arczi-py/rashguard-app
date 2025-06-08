<template>
  <div class="flex flex-col min-h-screen">
    <!-- NAVBAR -->
    <nav class="bg-white border-b border-gray-200 shadow-lg px-12 py-6 flex items-center justify-between">
      <button class="text-gray-700 text-2xl font-medium hover:text-black transition">&lt; BACK</button>
      <h1 class="text-3xl font-semibold text-gray-800">Personalizowany rashguard</h1>
      <ShoppingCartIcon class="w-10 h-10 text-gray-700 cursor-pointer hover:text-black transition" />
    </nav>

    <!-- KONFIGURATOR -->
    <div class="flex flex-1 overflow-hidden">
      <!-- PODGLĄD + MINIATURY -->
      <main class="flex-1 flex flex-col h-[calc(100vh-88px)] bg-gray-400">
        <!-- TOOLS BAR -->
        <div class="flex justify-center gap-6 p-4">
          <button 
            class="w-14 h-14 bg-white rounded-full shadow-md hover:bg-gray-50 flex items-center justify-center transition"
            @click="undo"
            :disabled="currentHistoryIndex <= 0"
          >
            <img width="24" height="24" src="https://img.icons8.com/color/48/undo.png" alt="undo"/>
          </button>
          <button 
            class="w-14 h-14 bg-white rounded-full shadow-md hover:bg-gray-50 flex items-center justify-center transition"
            @click="refresh"
          >
            <img width="24" height="24" src="https://img.icons8.com/color/48/circular-arrows--v1.png" alt="refresh"/>
          </button>
          <button 
            class="w-14 h-14 bg-white rounded-full shadow-md hover:bg-gray-50 flex items-center justify-center transition"
            @click="redo"
            :disabled="currentHistoryIndex >= history.length - 1"
          >
            <img width="24" height="24" src="https://img.icons8.com/color/48/redo.png" alt="redo"/>
          </button>
          
          <button 
            class="w-14 h-14 bg-white rounded-full shadow-md hover:bg-gray-50 flex items-center justify-center transition"
            @click="saveDesign"
          >
            <img width="24" height="24" src="https://img.icons8.com/skeuomorphism/32/save-as.png" alt="save-as"/>
          </button>
        </div>

        <div class="flex-1 flex items-center justify-center px-6 bg-gray-400">
          <div class="relative w-full max-w-[900px] h-[900px] overflow-visible">
            <DesignCanvas
              :width="900"
              :height="900"
              :elements="designElements"
              :background-svg="currentView === 'front' ? svgFront : currentView === 'back' ? svgBack : svgSide"
              @select-element="handleElementSelect"
              @update:elements="(newElements) => designElements = newElements"
            />
          </div>
        </div>

        <!-- MINIATURY PODGLĄDÓW -->
        <div class="flex justify-center gap-4 p-4">
          <button
            class="w-24 h-24 rounded cursor-pointer overflow-hidden relative bg-gray-400"
            :class="{ 'ring-2 ring-black': currentView === 'front' }"
            @click.prevent="() => currentView = 'front'"
          >
            <div class="absolute inset-0" v-html="miniFrontSvg"></div>
          </button>
          <button
            class="w-24 h-24 rounded cursor-pointer overflow-hidden relative bg-gray-400"
            :class="{ 'ring-2 ring-black': currentView === 'back' }"
            @click.prevent="() => currentView = 'back'"
          >
            <div class="absolute inset-0" v-html="miniBackSvg"></div>
          </button>
        </div>

        <!-- Saved Projects -->
        <div class="mt-8">
          <h3 class="text-base font-medium text-gray-700 mb-2">Saved Projects</h3>
          <div class="space-y-2">
            <div v-if="savedProjects.length === 0" class="text-gray-500 text-sm">
              No saved projects yet
            </div>
            <div v-for="project in savedProjects" :key="project.id" 
              class="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
              <div>
                <div class="text-sm font-medium">Project</div>
                <div class="text-xs text-gray-500">{{ project.date }}</div>
              </div>
              <div class="flex gap-2">
                <button 
                  @click="restoreProject(project)"
                  class="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800"
                >
                  Restore
                </button>
                <button 
                  @click="deleteProject(project.id)"
                  class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- PANEL OPCJI -->
      <section class="w-[600px] bg-white shadow-lg flex flex-col h-[calc(100vh-88px)]">
        <div class="p-8 border-b border-gray-200">
          <h2 class="text-3xl font-semibold text-gray-900">Dostosuj rashguard</h2>
        </div>

        <div class="overflow-y-auto flex-1">
          <div class="p-8 space-y-8">
            <!-- Rozmiar -->
            <div>
              <h3 class="text-xl font-medium text-gray-700 mb-6">Rozmiar</h3>
              <div class="flex gap-4 flex-wrap">
                <button
                  v-for="s in availableSizes"
                  :key="s"
                  @click.prevent="() => size = s"
                  class="px-8 py-4 rounded-lg border-2 text-lg font-medium transition"
                  :class="size === s ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'"
                >
                  {{ s }}
                </button>
              </div>
            </div>

            <!-- Materiał -->
            <div>
              <h3 class="text-xl font-medium text-gray-700 mb-6">Materiał</h3>
              <select
                v-model="material"
                class="w-full rounded-lg border-2 border-gray-300 shadow-sm text-lg py-4 px-6"
              >
                <option>Standard</option>
                <option>Premium</option>
                <option>Mesh</option>
              </select>
            </div>

            <!-- Kolory -->
            <div>
              <h3 class="text-xl font-medium text-gray-700 mb-6">Kolor</h3>
              <div class="flex flex-wrap gap-5">
                <button
                  v-for="color in colors"
                  :key="color"
                  :style="{ backgroundColor: color }"
                  class="w-10 h-10 rounded-full"
                  :class="{ 'ring-2 ring-black': colorFront === color }"
                  @click="setFrontColor(color)"
                ></button>
              </div>
            </div>

            <!-- TEKSTY DODAWANE -->
            <div>
              <h3 class="text-base font-medium text-gray-700 mb-2">Dodaj tekst</h3>
              <select
                v-model="selectedPresetText"
                class="w-full mb-2 rounded-lg border-gray-300 shadow-sm text-base py-2 px-3"
              >
                <option value="">-- wybierz gotowy tekst --</option>
                <option>WARRIOR</option>
                <option>FIGHT MODE</option>
                <option>NO FEAR</option>
              </select>
              <button
                v-if="selectedPresetText"
                @click="addText(selectedPresetText)"
                class="mb-3 bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300"
              >
                Dodaj gotowy tekst
              </button>
              <input
                v-model="customTextInput"
                type="text"
                placeholder="wpisz własny tekst..."
                class="w-full mb-2 rounded-lg border-gray-300 shadow-sm text-base py-2 px-3"
              />
              <button
                v-if="customTextInput"
                @click="addText(customTextInput)"
                class="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300"
              >
                Dodaj tekst własny
              </button>
            </div>

            <!-- EDYCJA WYBRANEGO -->
            <div v-if="selectedElementIndex !== null" class="space-y-8">
              <div class="flex justify-between items-center">
                <h3 class="text-xl font-medium text-gray-700">Edycja elementu</h3>
                <button
                  @click.prevent="deleteSelectedElement"
                  class="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Usuń element
                </button>
              </div>
              
              <!-- Text Controls -->
              <div v-if="selectedElement?.type === 'text'" class="space-y-8">
                <!-- Text Content -->
                <div>
                  <label class="block text-lg font-medium text-gray-600 mb-3">Tekst</label>
                  <input
                    type="text"
                    v-model="selectedElement.text"
                    class="w-full rounded-lg border-2 border-gray-300 shadow-sm text-lg py-4 px-6"
                    @input="updateElement(selectedElementIndex, { text: $event.target.value })"
                  />
                </div>
                
                <!-- Font Controls -->
                <div>
                  <label class="block text-lg font-medium text-gray-600 mb-3">Czcionka</label>
                  <select
                    v-model="selectedElement.fontFamily"
                    class="w-full rounded-lg border-2 border-gray-300 shadow-sm text-lg py-4 px-6"
                    @change="updateElement(selectedElementIndex, { fontFamily: $event.target.value })"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>
                
                <!-- Font Size -->
                <div>
                  <label class="block text-lg font-medium text-gray-600 mb-3">Rozmiar czcionki</label>
                  <div class="flex items-center gap-4">
                    <button
                      @click="adjustFontSize(-2)"
                      class="px-6 py-3 border-2 rounded-lg text-lg hover:bg-gray-50 transition"
                    >-</button>
                    <span class="text-lg w-24 text-center">{{ selectedElement.fontSize }}px</span>
                    <button
                      @click="adjustFontSize(2)"
                      class="px-6 py-3 border-2 rounded-lg text-lg hover:bg-gray-50 transition"
                    >+</button>
                  </div>
                </div>
                
                <!-- Text Style Controls -->
                <div>
                  <label class="block text-lg font-medium text-gray-600 mb-3">Style tekstu</label>
                  <div class="flex flex-wrap gap-4">
                    <button
                      v-for="(value, style) in {bold: 'B', italic: 'I', underline: 'U', strikethrough: 'S'}"
                      :key="style"
                      @click.prevent="() => toggleStyle(style)"
                      class="px-6 py-3 border-2 rounded-lg text-lg font-medium transition"
                      :class="{ 'bg-gray-100': selectedElement[style] }"
                    >
                      {{ value }}
                    </button>
                  </div>
                </div>
                
                <!-- Text Alignment -->
                <div>
                  <label class="block text-lg font-medium text-gray-600 mb-3">Wyrównanie</label>
                  <div class="flex gap-4">
                    <button
                      @click="setTextAlign('left')"
                      class="flex-1 px-6 py-3 border-2 rounded-lg text-lg font-medium transition"
                      :class="{ 'bg-gray-100': selectedElement.textAlign === 'left' }"
                    >
                      Do lewej
                    </button>
                    <button
                      @click="setTextAlign('center')"
                      class="flex-1 px-6 py-3 border-2 rounded-lg text-lg font-medium transition"
                      :class="{ 'bg-gray-100': selectedElement.textAlign === 'center' }"
                    >
                      Wyśrodkuj
                    </button>
                    <button
                      @click="setTextAlign('right')"
                      class="flex-1 px-6 py-3 border-2 rounded-lg text-lg font-medium transition"
                      :class="{ 'bg-gray-100': selectedElement.textAlign === 'right' }"
                    >
                      Do prawej
                    </button>
                  </div>
                </div>
                
                <!-- Letter Spacing -->
                <div>
                  <label class="block text-lg font-medium text-gray-600 mb-3">Odstępy między literami</label>
                  <div class="flex items-center gap-4">
                    <button
                      @click="adjustLetterSpacing(-0.5)"
                      class="px-6 py-3 border-2 rounded-lg text-lg hover:bg-gray-50 transition"
                    >-</button>
                    <span class="text-lg w-24 text-center">{{ selectedElement.letterSpacing }}px</span>
                    <button
                      @click="adjustLetterSpacing(0.5)"
                      class="px-6 py-3 border-2 rounded-lg text-lg hover:bg-gray-50 transition"
                    >+</button>
                  </div>
                </div>
                
                <!-- Line Height -->
                <div>
                  <label class="block text-lg font-medium text-gray-600 mb-3">Wysokość linii</label>
                  <div class="flex items-center gap-4">
                    <button
                      @click="adjustLineHeight(-0.1)"
                      class="px-6 py-3 border-2 rounded-lg text-lg hover:bg-gray-50 transition"
                    >-</button>
                    <span class="text-lg w-24 text-center">{{ selectedElement.lineHeight.toFixed(1) }}</span>
                    <button
                      @click="adjustLineHeight(0.1)"
                      class="px-6 py-3 border-2 rounded-lg text-lg hover:bg-gray-50 transition"
                    >+</button>
                  </div>
                </div>
                
                <!-- Text Color -->
                <div>
                  <label class="block text-lg font-medium text-gray-600 mb-3">Kolor tekstu</label>
                  <div class="flex flex-wrap gap-4">
                    <button
                      v-for="color in textColors"
                      :key="color"
                      @click="setElementColor(color)"
                      class="w-8 h-8 rounded-full border-2"
                      :class="{ 'border-black': selectedElement.color === color }"
                      :style="{ backgroundColor: color }"
                    ></button>
                  </div>
                </div>
              </div>

              <!-- Scale Control -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Rozmiar</label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  v-model.number="selectedElement.scale" 
                  class="w-full"
                />
              </div>

              <!-- Rotation Control -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Obrót</label>
                <div class="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    step="15" 
                    v-model.number="selectedElement.rotation" 
                    class="flex-1"
                  />
                  <span class="text-sm w-12 text-right">{{ selectedElement.rotation }}°</span>
                </div>
              </div>
            </div>

            <!-- Grafika -->
            <div>
              <h3 class="text-base font-medium text-gray-700 mb-2">Dodaj grafikę</h3>
              <div class="flex flex-wrap gap-2 mb-2">
                <button
                  v-for="png in readyPngs"
                  :key="png.file"
                  @click="addImageFromAsset(png.file)"
                  class="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 flex items-center"
                >
                  <img :src="png.src" alt="" class="w-8 h-8 mr-2" />
                  {{ png.name }}
                </button>
              </div>
              <label class="block mt-2">
                <span class="sr-only">Wybierz plik</span>
                <input type="file" class="hidden" @change="handleFileChange" />
                <span class="inline-block px-4 py-2 bg-black text-white rounded cursor-pointer hover:bg-gray-800">
                  Wybierz plik
                </span>
                <span class="ml-2 text-gray-600 text-sm">{{ selectedFileName || 'Nie wybrano pliku' }}</span>
              </label>
            </div>

            <!-- Ilość i cena -->
            <div class="mt-auto flex items-center justify-between border-t pt-4">
              <div class="flex items-center gap-2">
                <button @click="quantity = Math.max(1, quantity - 1)" class="w-8 h-8 rounded border bg-white hover:bg-gray-100 text-xl leading-none">&minus;</button>
                <span class="w-8 text-center text-lg">{{ quantity }}</span>
                <button @click="quantity++" class="w-8 h-8 rounded border bg-white hover:bg-gray-100 text-xl leading-none">+</button>
              </div>
              <div class="text-xl font-semibold text-gray-900">
                {{ totalPrice }} zł
              </div>
            </div>

            <!-- Przycisk -->
            <button
              class="mt-4 bg-black text-white py-3 rounded-lg text-base hover:bg-gray-800 transition"
              @click="addToCart"
            >
              Dodaj do koszyka
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, unref } from 'vue'
import { ShoppingCartIcon } from '@heroicons/vue/24/outline'
import DesignCanvas from './components/DesignCanvas.vue'
import twemoji from 'twemoji'

const colorFront = ref('#ffffff')
const colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']
const textColors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#C0C0C0']
const presetText = ref('')
const customText = ref('')
const selectedGraphic = ref('')
const uploadedImage = ref(null)
const currentView = ref('front')
const activeTab = ref('opis')

const svgFront = ref('')
const svgBack = ref('')
const svgSide = ref('')
const miniFrontSvg = ref('')
const miniBackSvg = ref('')

const size = ref('')
const availableSizes = ['S', 'M', 'L', 'XL', 'XXL']
const material = ref('Standard')
const quantity = ref(1)
const basePrice = 100

const designElements = ref([])
const selectedElementIndex = ref(null)
const selectedPresetText = ref('')
const customTextInput = ref('')

const selectedElement = computed(() => {
  return selectedElementIndex.value !== null ? designElements.value[selectedElementIndex.value] : null;
})

const selectedElementRotation = computed({
  get: () => {
    if (selectedElementIndex.value === null) return 0;
    const element = designElements.value[selectedElementIndex.value];
    return element ? ((element.rotation || 0) * 180 / Math.PI) % 360 : 0;
  },
  set: (degrees) => {
    if (selectedElementIndex.value === null) return;
    nextTick(() => {
      const newElements = [...designElements.value];
      newElements[selectedElementIndex.value] = {
        ...newElements[selectedElementIndex.value],
        rotation: degrees * Math.PI / 180
      };
      designElements.value = newElements;
    });
  }
});

// Add these reactive refs for better state management
const isDragging = ref(false);
const dragStart = ref(null);

// History states
const history = ref([]);
const currentHistoryIndex = ref(-1);

// Add these after the other refs
const savedProjects = ref([]);

const readyPngs = [
  { name: 'Rękawice bokserskie', file: 'boxing-gloves.png' },
  { name: 'Czaszka', file: 'death.png' },
  { name: 'Płomień', file: 'fire.png' },
  { name: 'Rycerz', file: 'knight.png' }
].map(item => ({
  ...item,
  src: new URL(`./assets/emoji/${item.file}`, import.meta.url).href
}));

// Add these functions before the onMounted
async function saveProjectToDB() {
  // Extract raw data from reactive objects
  const rawDesignData = {
    elements: unref(designElements),
    size: unref(size),
    material: unref(material),
    color: unref(colorFront),
    view: unref(currentView)
  };
  const response = await fetch('http://localhost:3000/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rawDesignData)
  });
  if (!response.ok) {
    throw new Error('Failed to save project');
  }
  return await response.json();
}

async function saveDesign() {
  try {
    await saveProjectToDB();
    alert('Projekt zapisany w bazie!');
  } catch (error) {
    console.error('Error saving design:', error);
    alert('Błąd zapisu projektu. Spróbuj ponownie.');
  }
}

function loadSavedProjects() {
  try {
    const projects = JSON.parse(localStorage.getItem('rashguardProjects') || '[]');
    savedProjects.value = projects;
  } catch (error) {
    console.error('Error loading saved projects:', error);
    savedProjects.value = [];
  }
}

function restoreProject(project) {
  try {
    designElements.value = project.elements;
    colorFront.value = project.colorFront;
    currentView.value = project.currentView;
    
    // Reset history
    history.value = [JSON.stringify(project.elements)];
    currentHistoryIndex.value = 0;
    
    alert('Project restored successfully!');
  } catch (error) {
    console.error('Error restoring project:', error);
    alert('Error restoring project. Please try again.');
  }
}

function deleteProject(projectId) {
  try {
    const projects = savedProjects.value.filter(p => p.id !== projectId);
    localStorage.setItem('rashguardProjects', JSON.stringify(projects));
    savedProjects.value = projects;
  } catch (error) {
    console.error('Error deleting project:', error);
    alert('Error deleting project. Please try again.');
  }
}

// Update the undo/redo functions
function undo() {
  if (currentHistoryIndex.value > 0) {
    currentHistoryIndex.value--;
    designElements.value = JSON.parse(history.value[currentHistoryIndex.value]);
  }
}

function redo() {
  if (currentHistoryIndex.value < history.value.length - 1) {
    currentHistoryIndex.value++;
    designElements.value = JSON.parse(history.value[currentHistoryIndex.value]);
  }
}

function refresh() {
  designElements.value = [];
  history.value = [];
  currentHistoryIndex.value = -1;
  selectedElementIndex.value = null;
}

// Improve element selection handling
function handleElementSelect(index) {
  if (isDragging.value) return;
  
  selectedElementIndex.value = index;
  selectedPresetText.value = '';
  customTextInput.value = '';
  
  // Reset any ongoing transformations
  if (dragStart.value) {
    dragStart.value = null;
  }
}

// Improve element addition with better initial positioning
function addText(text) {
  if (!text.trim()) return;
  
  const fontSize = 32;
  const lineHeight = 1.2;
  
  // Create a temporary canvas context to measure text
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = `${fontSize}px Arial`;
  
  // Calculate text dimensions
  const lines = text.split('\n');
  let maxWidth = 0;
  lines.forEach(line => {
    const metrics = tempCtx.measureText(line);
    maxWidth = Math.max(maxWidth, metrics.width);
  });
  
  const width = maxWidth;
  const height = lines.length * fontSize * lineHeight;
  
  const newText = {
    type: 'text',
    text,
    x: 450,
    y: 450,
    width,
    height,
    fontSize,
    fontFamily: 'Arial',
    color: '#000000',
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    textAlign: 'center',
    letterSpacing: 0,
    lineHeight,
    rotation: 0,
    scale: 1
  };
  
  designElements.value = [...designElements.value, newText];
  selectedElementIndex.value = designElements.value.length - 1;
  selectedPresetText.value = '';
  customTextInput.value = '';
}

function addImageFromAsset(file) {
  const size = 100;
  const src = new URL(`./assets/emoji/${file}`, import.meta.url).href;
  const newElement = {
    type: 'image',
    src,
    x: 450,
    y: 450,
    width: size,
    height: size,
    scale: 1,
    rotation: 0
  };
  designElements.value = [...designElements.value, newElement];
  selectedElementIndex.value = designElements.value.length - 1;
}

function addImageFromUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      const maxSize = 500;
      
      if (width > maxSize || height > maxSize) {
        const ratio = width / height;
        if (width > height) {
          width = maxSize;
          height = width / ratio;
        } else {
          height = maxSize;
          width = height * ratio;
        }
      }
      
      const newElement = {
        type: 'image',
        src: img.src,
        x: 450,
        y: 450,
        width,
        height,
        scale: 1,
        rotation: 0
      };
      
      designElements.value = [...designElements.value, newElement];
      selectedElementIndex.value = designElements.value.length - 1;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

// Improve element update handling
function updateElement(index, updates) {
  if (index === null || !designElements.value[index]) return;
  
  // Create updated element
  const element = designElements.value[index];
  const updatedElement = {
    ...element,
    ...updates
  };
  
  // Handle special cases for text elements
  if (element.type === 'text') {
    // Recalculate text dimensions if needed
    if (updates.text || updates.fontSize || updates.fontFamily) {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.font = `${updatedElement.fontSize}px ${updatedElement.fontFamily}`;
      
      const lines = updatedElement.text.split('\n');
      let maxWidth = 0;
      lines.forEach(line => {
        const metrics = tempCtx.measureText(line);
        maxWidth = Math.max(maxWidth, metrics.width);
      });
      
      updatedElement.width = maxWidth;
      updatedElement.height = lines.length * updatedElement.fontSize * updatedElement.lineHeight;
    }
  }
  
  const newElements = [...designElements.value];
  newElements[index] = updatedElement;
  designElements.value = newElements;
}

function deleteSelectedElement() {
  if (selectedElementIndex.value === null) return;
  
  const newElements = designElements.value.filter((_, index) => index !== selectedElementIndex.value);
  designElements.value = newElements;
  selectedElementIndex.value = null;
}

const totalPrice = computed(() => {
  let price = basePrice

  if (material.value === 'Premium') price += 10
  else if (material.value === 'Mesh') price += 5

  if (presetText.value || customText.value) price += 5
  if (selectedGraphic.value || uploadedImage.value) price += 15

  return price * quantity.value
})

function setFrontColor(color) {
  colorFront.value = color;
  
  // Update SVG colors and ensure proper scaling
  if (svgFront.value) {
    const updatedFront = updateSvgColors(svgFront.value, color);
    svgFront.value = prepareSvgForDisplay(updatedFront, 'front', false);
    miniFrontSvg.value = prepareSvgForDisplay(updatedFront, 'mini-front', true);
  }
  if (svgBack.value) {
    const updatedBack = updateSvgColors(svgBack.value, color);
    svgBack.value = prepareSvgForDisplay(updatedBack, 'back', false);
    miniBackSvg.value = prepareSvgForDisplay(updatedBack, 'mini-back', true);
  }
}

function prepareSvgForDisplay(svg, id, isThumbnail) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');
  
  if (!svgElement) return svg;
  
  // Remove any existing dimensions and viewBox
  svgElement.removeAttribute('width');
  svgElement.removeAttribute('height');
  
  // Set proper viewBox if not present
  if (!svgElement.getAttribute('viewBox')) {
    svgElement.setAttribute('viewBox', '0 0 900 900');
  }
  
  // Set proper attributes based on display type
  if (isThumbnail) {
    svgElement.setAttribute('width', '100%');
    svgElement.setAttribute('height', '100%');
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgElement.setAttribute('class', 'w-full h-full');
  } else {
    svgElement.setAttribute('width', '100%');
    svgElement.setAttribute('height', '100%');
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  
  svgElement.setAttribute('id', id);
  
  return new XMLSerializer().serializeToString(doc);
}

function updateSvgColors(svg, color) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  
  // Update fill colors for all elements with fill attribute
  doc.querySelectorAll('[fill]').forEach(el => {
    const currentFill = el.getAttribute('fill');
    if (currentFill !== 'none' && currentFill !== 'transparent') {
      el.setAttribute('fill', color);
    }
  });
  
  // Update stroke colors for all elements with stroke attribute
  doc.querySelectorAll('[stroke]').forEach(el => {
    const currentStroke = el.getAttribute('stroke');
    if (currentStroke !== 'none' && currentStroke !== 'transparent') {
      el.setAttribute('stroke', color);
    }
  });
  
  // Also update any inline styles containing fill or stroke
  doc.querySelectorAll('[style]').forEach(el => {
    let style = el.getAttribute('style');
    if (style.includes('fill:') && !style.includes('fill:none') && !style.includes('fill:transparent')) {
      style = style.replace(/fill:[^;]+/, `fill:${color}`);
    }
    if (style.includes('stroke:') && !style.includes('stroke:none') && !style.includes('stroke:transparent')) {
      style = style.replace(/stroke:[^;]+/, `stroke:${color}`);
    }
    el.setAttribute('style', style);
  });
  
  return new XMLSerializer().serializeToString(doc);
}

function setElementColor(color) {
  if (selectedElementIndex.value === null) return;
  
  nextTick(() => {
    const newElements = [...designElements.value];
    newElements[selectedElementIndex.value] = {
      ...newElements[selectedElementIndex.value],
      color
    };
    designElements.value = newElements;
  });
}

function toggleStyle(style) {
  if (selectedElementIndex.value === null || selectedElement.value?.type !== 'text') return;
  
  nextTick(() => {
    const newElements = [...designElements.value];
    newElements[selectedElementIndex.value] = {
      ...newElements[selectedElementIndex.value],
      [style]: !newElements[selectedElementIndex.value][style]
    };
    designElements.value = newElements;
  });
}

function adjustFontSize(delta) {
  if (!selectedElement.value || selectedElement.value.type !== 'text') return;
  
  const newSize = Math.max(8, Math.min(144, selectedElement.value.fontSize + delta));
  const newElement = {
    ...selectedElement.value,
    fontSize: newSize
  }
  
  updateElement(selectedElementIndex.value, newElement)
}

function setTextAlign(align) {
  if (!selectedElement.value || selectedElement.value.type !== 'text') return;
  
  const newElement = {
    ...selectedElement.value,
    textAlign: align
  }
  
  updateElement(selectedElementIndex.value, newElement)
}

function updateSelectedElement() {
  if (selectedElement.value) {
    selectedElement.value = { ...selectedElement.value }
  }
}

function adjustLetterSpacing(delta) {
  if (!selectedElement.value || selectedElement.value.type !== 'text') return;
  
  const newLetterSpacing = Math.max(0, Math.min(10, selectedElement.value.letterSpacing + delta));
  const newElement = {
    ...selectedElement.value,
    letterSpacing: newLetterSpacing
  }
  
  updateElement(selectedElementIndex.value, newElement)
}

function adjustLineHeight(delta) {
  if (!selectedElement.value || selectedElement.value.type !== 'text') return;
  
  const newLineHeight = Math.max(0.8, Math.min(2, selectedElement.value.lineHeight + delta));
  const newElement = {
    ...selectedElement.value,
    lineHeight: newLineHeight
  }
  
  updateElement(selectedElementIndex.value, newElement)
}

// Add state to history
function addToHistory(elements) {
  try {
    // Remove any future states if we're not at the end
    if (currentHistoryIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentHistoryIndex.value + 1);
    }
    
    // Add new state
    history.value.push(JSON.stringify(elements));
    currentHistoryIndex.value = history.value.length - 1;
  } catch (error) {
    console.error('Error adding to history:', error);
  }
}

// Watch for changes in designElements
watch(designElements, (newElements) => {
  addToHistory(newElements);
}, { deep: true });

onMounted(async () => {
  loadSavedProjects();
  try {
    // Load SVG files with proper error handling
    const loadSvg = async (path) => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.statusText}`);
        }
        const text = await response.text();
        if (!text.includes('<svg')) {
          throw new Error('Invalid SVG content');
        }
        return text;
      } catch (error) {
        console.error(`Error loading SVG from ${path}:`, error);
        return null;
      }
    };

    // Load front and back SVGs
    const [front, back] = await Promise.all([
      loadSvg('/src/assets/front.svg'),
      loadSvg('/src/assets/back.svg')
    ]);

    if (!front || !back) {
      console.error('Failed to load one or more SVG files');
      return;
    }

    // Set main SVGs with proper preparation
    svgFront.value = prepareSvgForDisplay(front, 'front', false);
    svgBack.value = prepareSvgForDisplay(back, 'back', false);

    // Create thumbnails with proper preparation
    miniFrontSvg.value = prepareSvgForDisplay(front, 'mini-front', true);
    miniBackSvg.value = prepareSvgForDisplay(back, 'mini-back', true);

    // Apply initial color
    nextTick(() => {
      setFrontColor(colorFront.value);
    });
  } catch (error) {
    console.error('Error in onMounted:', error);
  }
});

// Watch for view changes to update colors
watch(currentView, () => {
  nextTick(() => {
    setFrontColor(colorFront.value);
  });
});

// Watch for color changes and update SVGs
watch(() => colorFront.value, (newColor) => {
  if (newColor) {
    setFrontColor(newColor);
  }
});

// Dodaję funkcję do obsługi "Dodaj do koszyka"
async function addToCart() {
  try {
    await saveProjectToDB();
    alert('Projekt został zapisany i dodany do koszyka!');
  } catch (error) {
    console.error('Error saving design:', error);
    alert('Błąd zapisu projektu. Spróbuj ponownie.');
  }
}

const selectedFileName = ref('');
function handleFileChange(event) {
  const file = event.target.files[0];
  selectedFileName.value = file ? file.name : '';
  addImageFromUpload(event);
}
</script>
