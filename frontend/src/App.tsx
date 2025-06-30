import { Sidebar } from './components/Sidebar';
import { EditorCanvas } from './components/EditorCanvas';
import { Toolbar } from './components/Toolbar';
// самый верх App.tsx
console.log('🏗  App module imported');
export const App = () => (
  <div className="flex h-full">
    <Sidebar />
    <EditorCanvas />
    <Toolbar />
  </div>
);
