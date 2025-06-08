import fs from 'fs';
import path from 'path';
import { generateUmlPng } from './plantuml.js';

const diagrams = {
  useCase: `@startuml Rashguard Designer Use Cases

skinparam actorStyle awesome
skinparam usecase {
  BackgroundColor LightBlue
  BorderColor DarkBlue
}

actor Customer
actor Admin

rectangle "Rashguard Designer System" {
  usecase "Design Custom Rashguard" as UC1
  usecase "Add Text Elements" as UC2
  usecase "Add Image Elements" as UC3
  usecase "Save Design" as UC4
  usecase "Load Saved Design" as UC5
  usecase "Export Design" as UC6
  usecase "Manage Products" as UC7
  usecase "View Orders" as UC8
}

Customer --> UC1
Customer --> UC2
Customer --> UC3
Customer --> UC4
Customer --> UC5
Customer --> UC6

Admin --> UC7
Admin --> UC8

UC1 ..> UC2 : <<include>>
UC1 ..> UC3 : <<include>>
UC1 ..> UC4 : <<extend>>

@enduml`,

  activity: `@startuml Rashguard Designer Activity

skinparam ActivityBackgroundColor LightBlue
skinparam ActivityBorderColor DarkBlue
skinparam ArrowColor DarkBlue

start
:Customer visits website;

if (First time?) then (yes)
  :Create account;
else (no)
endif

:Select rashguard base;
:Choose size and material;

split
  :Add text elements;
  :Customize text properties;
  :Position text;
split again
  :Add image elements;
  :Adjust image properties;
  :Position images;
end split

:Preview design;

if (Design satisfactory?) then (yes)
  :Save design;
  :Add to cart;
  :Proceed to checkout;
  
  if (Payment successful?) then (yes)
    :Complete purchase;
    :Send confirmation;
    stop
  else (no)
    :Show payment error;
    back:Retry payment;
  endif
  
else (no)
  :Modify design;
  back:Preview design;
endif

@enduml`,

  sequence: `@startuml Rashguard Designer Sequence

actor Customer
participant "Design Canvas" as Canvas
participant "Text Editor" as Editor
participant "Image Handler" as Image
participant "Storage" as Storage

Customer -> Canvas: Open designer
activate Canvas

Customer -> Canvas: Add text element
activate Canvas
Canvas -> Editor: Create text editor
activate Editor
Editor --> Canvas: Return text element
deactivate Editor
Canvas --> Customer: Display text element
deactivate Canvas

Customer -> Canvas: Add image element
activate Canvas
Canvas -> Image: Process image
activate Image
Image --> Canvas: Return image element
deactivate Image
Canvas --> Customer: Display image element
deactivate Canvas

Customer -> Canvas: Save design
activate Canvas
Canvas -> Storage: Store design data
activate Storage
Storage --> Canvas: Confirm save
deactivate Storage
Canvas --> Customer: Show success message
deactivate Canvas

@enduml`,

  class: `@startuml Rashguard Designer Class

skinparam classAttributeIconSize 0

class App {
  + designElements: Array
  + currentView: String
  + colorFront: String
  + size: String
  + material: String
  + quantity: Number
  + saveDesign()
  + loadSavedProjects()
  + restoreProject()
  + deleteProject()
}

class DesignCanvas {
  + width: Number
  + height: Number
  + elements: Array
  + backgroundSvg: String
  + render()
  + handleElementSelect()
  + startDrag()
  + endDrag()
}

class DesignElement {
  + type: String
  + x: Number
  + y: Number
  + width: Number
  + height: Number
  + rotation: Number
  + scale: Number
}

class TextElement extends DesignElement {
  + text: String
  + fontSize: Number
  + fontFamily: String
  + color: String
  + bold: Boolean
  + italic: Boolean
  + underline: Boolean
  + textAlign: String
}

class ImageElement extends DesignElement {
  + src: String
}

class Storage {
  + saveProject()
  + loadProject()
  + deleteProject()
  + listProjects()
}

App "1" *-- "many" DesignCanvas : contains
DesignCanvas "1" *-- "many" DesignElement : contains
DesignElement <|-- TextElement
DesignElement <|-- ImageElement
App --> Storage : uses

note right of App
  Main application component
  managing state and user interactions
end note

note right of DesignCanvas
  Canvas component for
  rendering and manipulating
  design elements
end note

@enduml`
};

async function generateAndSaveDiagrams() {
  const outputDir = path.join(process.cwd(), 'public', 'diagrams');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [name, diagram] of Object.entries(diagrams)) {
    const url = generateUmlPng(diagram);
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    
    fs.writeFileSync(
      path.join(outputDir, `${name}.png`),
      Buffer.from(buffer)
    );
    
    console.log(`Generated ${name}.png`);
  }
}

export { generateAndSaveDiagrams, diagrams }; 