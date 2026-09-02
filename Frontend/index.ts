// import { registerRootComponent } from 'expo';
// import { Platform } from 'react-native';

// import App from './App';

// // Inject global CSS on web to remove the browser's default orange focus ring
// // on all elements (React Native Web renders TextInput as a div/input).
// if (Platform.OS === 'web' && typeof document !== 'undefined') {
//   const style = document.createElement('style');
//   style.textContent = `
//     *:focus { outline: none !important; box-shadow: none !important; }
//     *:focus-visible { outline: none !important; box-shadow: none !important; }
//     input:focus, textarea:focus, [contenteditable]:focus {
//       outline: none !important;
//       box-shadow: none !important;
//     }
//   `;
//   document.head.appendChild(style);
// }

// // Suppress the React Native Web "Unexpected text node" warning caused by
// // nativewind v4's CSS interop layer injecting style elements. This is a known
// // upstream issue: https://github.com/marklawlor/nativewind/issues
// if (Platform.OS === 'web' && typeof console !== 'undefined') {
//   const originalError = console.error.bind(console);
//   console.error = (...args: unknown[]) => {
//     if (
//       typeof args[0] === 'string' &&
//       args[0].includes('Unexpected text node')
//     ) {
//       return;
//     }
//     originalError(...args);
//   };
// }

// // registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// // It also ensures that whether you load the app in Expo Go or in a native build,
// // the environment is set up appropriately
// registerRootComponent(App);

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);