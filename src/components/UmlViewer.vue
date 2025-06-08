<template>
  <div class="uml-viewer">
    <div class="flex gap-4 mb-4">
      <button 
        v-for="format in formats" 
        :key="format.value"
        @click="currentFormat = format.value"
        class="px-4 py-2 rounded-lg border-2"
        :class="currentFormat === format.value ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'"
      >
        {{ format.label }}
      </button>
    </div>
    
    <div class="bg-white p-4 rounded-lg shadow-lg">
      <img 
        v-if="diagramUrl" 
        :src="diagramUrl" 
        :alt="title"
        class="w-full"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { generateUmlDiagram, generateUmlPng, generateUmlTxt } from '../utils/plantuml';

const props = defineProps({
  umlCode: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'UML Diagram'
  }
});

const formats = [
  { label: 'SVG', value: 'svg' },
  { label: 'PNG', value: 'png' },
  { label: 'TXT', value: 'txt' }
];

const currentFormat = ref('svg');

const diagramUrl = computed(() => {
  switch (currentFormat.value) {
    case 'svg':
      return generateUmlDiagram(props.umlCode);
    case 'png':
      return generateUmlPng(props.umlCode);
    case 'txt':
      return generateUmlTxt(props.umlCode);
    default:
      return generateUmlDiagram(props.umlCode);
  }
});
</script>

<style scoped>
.uml-viewer {
  @apply p-4;
}
</style> 