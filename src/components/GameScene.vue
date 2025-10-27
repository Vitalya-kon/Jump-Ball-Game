<template>
  <div>
    <div class="game-container" ref="gameContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted, nextTick } from 'vue';
import Phaser from 'phaser';
import { Player } from '../game/gameObjects/Player';
import { PlatformManager } from '../game/gameObjects/PlatformManager';
import { CoinManager } from '../game/gameObjects/CoinManager';
import { GameUI } from '../game/ui/GameUI';
import { GameOverUI } from '../game/ui/GameOverUI';

const gameContainer = ref<HTMLElement | null>(null);
let game: Phaser.Game | null = null;
let isGameActive = true;

// Компоненты игры
let player: Player | null = null;
let platformManager: PlatformManager | null = null;
let coinManager: CoinManager | null = null;
let gameUI: GameUI | null = null;
let gameOverUI: GameOverUI | null = null;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: gameContainer.value,
  scene: {
    preload,
    create,
    update
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 400 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

function preload(this: Phaser.Scene) {
  this.load.image('background', '/assets/images/Space/space_bg.png');
  this.load.image('player', '/assets/images/Ball/Idle/1.png');
  this.load.image('playerJump', '/assets/images/Ball/Jump/1.png');
  this.load.image('playerFall', '/assets/images/Ball/Jump/2.png');
  this.load.image('platform', '/assets/images/Platform/brown platform merged transparent.png');
  this.load.image('controls', '/assets/images/keyControl/keyControl1.png');
  this.load.image('coin_pos_1', '/assets/images/Coin/gold_1.png');
  this.load.image('coin_pos_2', '/assets/images/Coin/gold_2.png');
  this.load.image('coin_pos_3', '/assets/images/Coin/gold_3.png');
  this.load.image('coin_pos_4', '/assets/images/Coin/gold_4.png');
  this.load.image('+1', '/assets/images/Coin/+1.png');

  this.load.on('fileerror', (key: string, file: any) => {
    console.error(`Ошибка загрузки ресурса: ${key}`, file);
  });

  this.load.on('filecomplete', (key: string) => {
    console.log(`Ресурс загружен: ${key}`);
  });
}

function create(this: Phaser.Scene) {
  const canvasHeight = this.sys.canvas.height;
  const canvasWidth = this.sys.canvas.width;

  // Создаем фон, растягивая на всю область видимости
  const bg = this.add.image(0, 0, 'background');
  bg.setOrigin(0, 0)
    .setScrollFactor(0, 0)
    .setDisplaySize(canvasWidth, canvasHeight)
    .setDepth(-1);

  // Инициализируем компоненты
  platformManager = new PlatformManager(this);
  platformManager.create();
  const initialPlatforms = platformManager.createInitialPlatforms();

  player = new Player(this);
  // Размещаем игрока на первой платформе
  const firstPlatform = initialPlatforms[0];
  let playerStartY = canvasHeight - 200;
  if (firstPlatform) {
    // Учитываем высоту платформы при расчете позиции игрока
    const platformHeight = firstPlatform.height * firstPlatform.scaleY;
    // Позиция игрока = позиция платформы - половина высоты платформы - высота коллайдера/2
    playerStartY = firstPlatform.y - platformHeight / 2 - 500;
  }
  const playerSprite = player.create(150, playerStartY);

  // Настраиваем камеру
  this.cameras.main.startFollow(playerSprite, true, 0.1, 0.1);
  this.cameras.main.setBounds(0, 0, platformManager.getWorldWidth(), canvasHeight);

  // Создаем UI
  gameUI = new GameUI(this);
  gameUI.create();

  // Создаем менеджер монеток
  coinManager = new CoinManager(this, (score) => {
    gameUI?.updateScore(score);
  });
  coinManager.create();
  coinManager.setupCollision(playerSprite);

  // Добавляем монетки на начальные платформы
  initialPlatforms.forEach(platform => {
    coinManager?.addCoinsToPlatform(platform);
  });

  // Создаем UI завершения игры
  gameOverUI = new GameOverUI(this, () => {
    restartGame(this);
  });

  // Настраиваем коллизии
  const platforms = platformManager.getPlatforms();
  if (platforms) {
    this.physics.add.collider(playerSprite, platforms, () => {
      player?.onPlatformCollision();
    });
  }

  hideGameOverUI();
}


function update(this: Phaser.Scene) {
  if (!player || !isGameActive || !platformManager) return;

  const playerSprite = player.getSprite();
  if (!playerSprite) return;

  // Обновляем игрока
  player.update();

  const camera = this.cameras.main;
  const cameraBottom = camera.worldView.bottom;

  // Проверка падения
  if (playerSprite.y > cameraBottom + 200) {
    console.log('[Падение] Игрок упал ниже камеры:',
      `y=${playerSprite.y.toFixed(0)}`,
      `камера=${cameraBottom.toFixed(0)}`,
      `разница=${(playerSprite.y - cameraBottom).toFixed(0)}`
    );
    endGame();
    return;
  }

  // Генерация новых платформ
  if (platformManager.shouldGenerateNextPlatform(playerSprite.x)) {
    const newPlatform = platformManager.createNextPlatform();
    if (newPlatform && coinManager) {
      coinManager.addCoinsToPlatform(newPlatform);
    }
  }

  // Фон остается статичным
}

function endGame() {
  if (!isGameActive) return;
  
  console.log('[endGame] Завершение игры');
  isGameActive = false;
  
  // Останавливаем физику игрока
  if (player) {
    const playerSprite = player.getSprite();
    if (playerSprite) {
      playerSprite.setVelocity(0, 0);
      if (playerSprite.body) {
        playerSprite.body.enable = false;
      }
    }
  }
  
  // Показываем UI завершения игры
  if (gameOverUI) {
    gameOverUI.show();
  }
}

function hideGameOverUI() {
  if (gameOverUI) {
    gameOverUI.hide();
  }
}

function restartGame(scene: Phaser.Scene) {
  console.log('[restartGame] Перезапуск игры');

  // Очищаем все временные элементы
  scene.children.each(child => {
    if (child instanceof Phaser.GameObjects.Sprite && child.texture.key === '+1') {
      child.destroy();
    }
  });
  
  hideGameOverUI();
  isGameActive = true;

  // Очищаем монетки
  coinManager?.clearCoins();
  coinManager?.resetScore();

  // Пересоздаем UI счета
  gameUI?.recreate();

  // Пересоздаем платформы
  platformManager?.reset();
  const initialPlatforms = platformManager?.createInitialPlatforms() || [];

  // Пересоздаем игрока на первой платформе
  if (player && initialPlatforms.length > 0) {
    const firstPlatform = initialPlatforms[0];
    if (firstPlatform) {
      // Учитываем высоту платформы при расчете позиции игрока
      const platformHeight = firstPlatform.height * firstPlatform.scaleY;
      const playerStartY = firstPlatform.y - platformHeight / 2 - 500;
      player.reset(150, playerStartY);
    }
  }

  // Добавляем монетки на начальные платформы
  initialPlatforms.forEach(platform => {
    coinManager?.addCoinsToPlatform(platform);
  });

  // Пересоздаем коллизии
  if (player) {
    const playerSprite = player.getSprite();
    const platforms = platformManager?.getPlatforms();
    if (playerSprite && platforms) {
      scene.physics.add.collider(playerSprite, platforms, () => {
        player?.onPlatformCollision();
      });
    }
  }

  // Сбрасываем камеру
  if (player) {
    const playerSprite = player.getSprite();
    if (playerSprite) {
      scene.cameras.main.startFollow(playerSprite, true, 0.1, 0.1);
      scene.cameras.main.setBounds(0, 0, platformManager?.getWorldWidth() || 10000, scene.scale.height);
    }
  }

  console.log('[restartGame] Игра перезапущена');
}

onMounted(() => {
  nextTick(() => {
    config.parent = gameContainer.value;
    game = new Phaser.Game(config);

    window.addEventListener('resize', () => {
      game?.scale.resize(window.innerWidth, window.innerHeight);
    });
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', () => { });
  if (game) {
    game.destroy(true);
    game = null;
  }
  
  // Очищаем компоненты
  player?.destroy();
  platformManager = null;
  coinManager?.destroy();
  gameUI?.destroy();
  gameOverUI?.destroy();
});
</script>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: black;
  touch-action: none;
}
</style>