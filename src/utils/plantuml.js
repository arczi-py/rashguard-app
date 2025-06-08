import plantumlEncoder from 'plantuml-encoder';

export function generateUmlDiagram(umlCode) {
  const encoded = plantumlEncoder.encode(umlCode);
  return `https://www.plantuml.com/plantuml/svg/${encoded}`;
}

export function generateUmlPng(umlCode) {
  const encoded = plantumlEncoder.encode(umlCode);
  return `https://www.plantuml.com/plantuml/png/${encoded}`;
}

export function generateUmlTxt(umlCode) {
  const encoded = plantumlEncoder.encode(umlCode);
  return `https://www.plantuml.com/plantuml/txt/${encoded}`;
} 