# Measurement Dashboard with CanvasContext

This project is a React + TypeScript application where users can draw two rectangles 
on a canvas, calculate their dimensions and the distance between their centers, and 
save these records in local storage. It demonstrates how to organize core canvas 
functionality in a separate Context (CanvasContext) and then expose the logic via a 
custom hook (useCanva), so multiple components can access it if needed.

## Features

1. **Context Separation**:
   - A dedicated CanvaContext that holds all canvas state, event handlers (mouse 
     down/move/up), rectangle calculations, and local storage synchronization.
   - A custom hook (useCanva) to provide easy access to these functionalities 
     anywhere in the app.

2. **Drawing Rectangles**:
   - Click and drag on the canvas to draw up to two rectangles. 
   - Real-time preview while drawing (green outline).
   - Red/Blue outlines for finalized rectangles.

3. **Dimensions & Distance**:
   - Each rectangle's dimensions (width, height).
   - Computation of the Euclidean distance between rectangle centers.

4. **Saving & Local Storage**:
   - Saves each record (two rectangles + distance + timestamp) into local storage.
   - Displays saved records in a table and re-renders them on canvas upon click.

5. **Responsive Layout**:
   - Minimal styling but tested for desktop and mobile. 
   - You can further enhance via media queries or CSS frameworks.

## Getting Started

### 1. Install Dependencies

\`\`\`
npm install
\`\`\`
or
\`\`\`
yarn
\`\`\`

### 2. Start Development Server

\`\`\`
npm start
\`\`\`
Then navigate to http://localhost:3000 in your browser (Create React App default).

### 3. Building for Production

\`\`\`
npm run build
\`\`\`
Generates a \`build\` folder with optimized assets.

## Project Structure

- \`CanvasContext.tsx\`: Houses the canvas and local storage logic, plus a \`useCanva\` hook. 
- \`App.tsx\`: Consumes the context and provides the main UI (canvas, buttons, table).
- \`types.ts\`: Shared TypeScript interfaces for rectangles and saved records.
- \`index.tsx\`: Renders the application, wrapping \`App\` in \`CanvaProvider\`.

## Possible Enhancements

- **Delete / Edit Records**: Add a delete button per row, or allow editing a saved record.
- **Sorting / Filtering**: Sort by timestamp or distance, or filter out older records.
- **Undo Functionality**: For removing the last drawn rectangle without clearing everything.
- **Testing**: Use Jest or React Testing Library to ensure correctness of the context logic 
  and UI interactions.

## License

MIT