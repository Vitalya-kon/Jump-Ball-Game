<template>
  <div class="game-container" ref="gameContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted, nextTick } from 'vue';
import Phaser from 'phaser';

const gameContainer = ref<HTMLElement | null>(null);
let game: Phaser.Game | null = null;
let score = 0;
let scoreText: Phaser.GameObjects.Text | null = null;
let gameOverText: Phaser.GameObjects.Text | null = null;
let restartButton: Phaser.GameObjects.Text | null = null;
let isGameActive = true;
let platforms: Phaser.Physics.Arcade.StaticGroup | null = null;
let player: Phaser.Physics.Arcade.Sprite | null = null;
let cursors: Phaser.Types.Input.Keyboard.CursorKeys | null | undefined = null;
let spaceKey: Phaser.Input.Keyboard.Key | null | undefined = null;
let lastPlatformX = 100;
let lastPlatformY = 600;
let worldWidth = 0; // 🔥 Будем расширять мир динамически
let isJumping = false;

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
  this.load.image('background', '/assets/images/Space/DeWatermark.ai_1759066519691.jpeg');
  this.load.image('player', '/assets/images/Ball/Idle/1.png');
  this.load.image('playerJump', '/assets/images/Ball/Jump/1.png'); // Изображение для прыжка
  this.load.image('playerFall', '/assets/images/Ball/Jump/2.png'); // Изображение для падения
  this.load.image('platform', '/assets/images/Platform/brown platform merged transparent.png');
}

function create(this: Phaser.Scene) {
  const canvasHeight = this.sys.canvas.height;
  worldWidth = 10000; // 🔥 Начальная ширина мира

  // 🔥 Создаем бесконечный фон с параллакс-эффектом
  this.add.tileSprite(0, 0, worldWidth, canvasHeight, 'background')
    .setOrigin(0, 0)
    .setScrollFactor(0, 1); // Фон не двигается по горизонтали

  platforms = this.physics.add.staticGroup();

  player = this.physics.add.sprite(150, 350, 'player');
  player.setBounce(0.5);
  player.setScale(1.3);
  player.setDepth(100);

  // 🔥 Настраиваем физическое тело для лучшего приземления
  player.setBodySize(player.width * 0.8, player.height * 0.1);
  player.setOffset(player.width * 0.1, player.height * 0.05);

  this.physics.add.collider(player, platforms, () => {
    if (isJumping) {
      isJumping = false;
      player?.setTexture('player');
    }
  });

  // 🔥 Настраиваем камеру с динамическими границами
  this.cameras.main.startFollow(player, true, 0.1, 0.1);
  this.cameras.main.setBounds(0, 0, worldWidth, canvasHeight);

  cursors = this.input.keyboard?.createCursorKeys();
  spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  scoreText = this.add.text(20, 20, 'Score: 0', {
    fontSize: '24px',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: { x: 10, y: 5 }
  }).setScrollFactor(0);

  lastPlatformY = canvasHeight - 100;
  createInitialPlatforms(this);

  hideGameOverUI();
}

function createInitialPlatforms(scene: Phaser.Scene) {
  const canvasHeight = scene.sys.canvas.height;
  lastPlatformY = canvasHeight - 100;
  lastPlatformX = 400;

  platforms?.create(lastPlatformX, lastPlatformY, 'platform')
    .setScale(0.8)
    .setDepth(1)
    .refreshBody();

  // 🔥 Создаем больше начальных платформ для бесконечного мира
  for (let i = 1; i <= 8; i++) {
    createNextPlatform(scene);
  }
}

function createNextPlatform(scene: Phaser.Scene) {
  const minGap = 500;
  const maxGap = 850;
  const gap = Phaser.Math.Between(minGap, maxGap);

  const newX = lastPlatformX + gap;

  // 🔥 Расширяем мир если приближаемся к границе
  if (newX > worldWidth - 2000) {
    worldWidth += 5000;
    scene.cameras.main.setBounds(0, 0, worldWidth, scene.scale.height);
    
    // 🔥 Обновляем фон для нового размера мира
    const bg = scene.children.getByName('background') as Phaser.GameObjects.TileSprite;
    if (bg) {
      bg.setSize(worldWidth, scene.scale.height);
    }
  }

  const minY = Math.max(150, lastPlatformY - 150);
  const maxY = Math.min(scene.scale.height - 100, lastPlatformY + 150);
  const newY = Phaser.Math.Between(minY, maxY);

  const platform = platforms?.create(newX, newY, 'platform');
  platform?.setScale(0.5 + Math.random() * 0.4);
  platform?.setDepth(1);
  platform?.refreshBody();

  lastPlatformX = newX;
  lastPlatformY = newY;
}

function update(this: Phaser.Scene) {
  if (!player || !isGameActive || !cursors || !spaceKey) return;

  const speed = 150;

  if (cursors.left.isDown) {
    player.setVelocityX(-speed);
    player.setFlipX(true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(speed);
    player.setFlipX(false);
  } else {
    player.setVelocityX(0);
  }

  const onGround = player.body?.touching.down || player.body?.blocked.down;

  

  if (Phaser.Input.Keyboard.JustDown(spaceKey) && onGround) {
    player.setVelocityY(-400);
    isJumping = true;
    player.setTexture('playerJump'); // Меняем на текстуру прыжка
    
    this.tweens.add({
      targets: player,
      scale: { from: 1.3, to: 1.4 }, 
      duration: 100,
      yoyo: true
    });
  }

  // 🔥 Улучшенная проверка падения
  if (player.y > this.sys.canvas.height + 1000) {
    endGame();
  }

  // 🔥 Генерация новых платформ когда игрок приближается к последней
  const viewportRight = player.x + this.cameras.main.width / 2;
  const generationThreshold = lastPlatformX - 1000;

  if (viewportRight > generationThreshold) {
    createNextPlatform(this);
  }

  // 🔥 Обновление счета на основе пройденного расстояния
  if (isGameActive) {
    score = Math.floor(player.x / 10);
    scoreText?.setText(`Score: ${score}`);
  }

  // 🔥 Параллакс эффект для фона (медленное движение)
  const bg = this.children.getByName('background') as Phaser.GameObjects.TileSprite;
  if (bg && player.x > 400) {
    bg.tilePositionX = player.x * 0.1;
  }
}

function endGame() {
  isGameActive = false;
  showGameOverUI();
}

function showGameOverUI() {
  const scene = game?.scene.getScenes()[0];
  if (!scene) return;

  gameOverText = scene.add.text(
    scene.cameras.main.centerX,
    scene.cameras.main.centerY - 50,
    'GAME OVER',
    { fontSize: '48px', color: '#ff0000', stroke: '#000', strokeThickness: 4 }
  ).setOrigin(0.5);

  restartButton = scene.add.text(
    scene.cameras.main.centerX,
    scene.cameras.main.centerY + 20,
    'Tap to Restart',
    { fontSize: '28px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 20, y: 10 } }
  ).setOrigin(0.5).setInteractive({ useHandCursor: true });

  restartButton.on('pointerdown', () => {
    restartGame(scene);
  });
}

function hideGameOverUI() {
  gameOverText?.destroy();
  restartButton?.destroy();
}

function restartGame(scene: Phaser.Scene) {
  hideGameOverUI();
  isGameActive = true;
  score = 0;
  scoreText?.setText('Score: 0');

  player?.setPosition(150, 350);
  player?.setVelocity(0, 0);

  scene.cameras.main.stopFollow();
  scene.cameras.main.setScroll(0, 0);
  if (player) {
    scene.cameras.main.startFollow(player, true, 0.1, 0.1);
  }

  platforms?.clear(true, true);

  // 🔥 Сбрасываем мир до начального размера
  worldWidth = 10000;
  scene.cameras.main.setBounds(0, 0, worldWidth, scene.scale.height);
  
  // 🔥 Сбрасываем фон
  const bg = scene.children.getByName('background') as Phaser.GameObjects.TileSprite;
  if (bg) {
    bg.setSize(worldWidth, scene.scale.height);
    bg.tilePositionX = 0;
  }

  lastPlatformX = 100;
  lastPlatformY = scene.scale.height - 100;

  createInitialPlatforms(scene);
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