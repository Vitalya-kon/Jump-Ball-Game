import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/main.css'

// --- ЗАМЕНЯЕМ НА ЭТО ---
// const initYandexSDK = () => {
//   if (!window.YaGames) {
//     console.error('Яндекс.Игры SDK не загружен! Проверьте <script> в index.html');
//     return;
//   }

//   window.YaGames.init()
//     .then(sdk => {
//       console.log('✅ SDK Яндекс.Игр успешно инициализирован!');
      
//       // Сохраняем результат в лидерборд
//       window.saveScore = (score: number) => {
//         sdk.setLeaderboardScore('top_score', score)
//           .then(() => console.log('📊 Результат сохранен:', score));
//       };
      
//       // Показ рекламы
//       window.showAd = () => {
//         sdk.showFullscreenAd({
//           callbacks: {
//             onClose: () => {
//               // Перезапуск игры после закрытия рекламы
//               if (window.game) window.game.scene.restart();
//             }
//           }
//         });
//       };
//     })
//     .catch(err => console.error('❌ Ошибка инициализации SDK:', err));
// };

// // Инициализация после загрузки страницы
// document.addEventListener('DOMContentLoaded', initYandexSDK);

createApp(App).mount('#app');