<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">UML Diagrams</h1>
    
    <div class="space-y-8">
      <!-- Use Case Diagram -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-semibold mb-4">Use Case Diagram</h2>
        <UmlViewer 
          :uml-code="diagrams.useCase"
          title="Rashguard Designer Use Cases"
        />
      </div>

      <!-- Activity Diagram -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-semibold mb-4">Activity Diagram</h2>
        <UmlViewer 
          :uml-code="diagrams.activity"
          title="Rashguard Designer Activity Flow"
        />
      </div>

      <!-- Sequence Diagram -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-semibold mb-4">Sequence Diagram</h2>
        <UmlViewer 
          :uml-code="diagrams.sequence"
          title="Rashguard Designer Sequence"
        />
      </div>

      <!-- Class Diagram -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-semibold mb-4">Class Diagram</h2>
        <UmlViewer 
          :uml-code="diagrams.class"
          title="Rashguard Designer Class Structure"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UmlViewer from '../components/UmlViewer.vue';
import { diagrams } from '../utils/generateDiagrams';
</script> 