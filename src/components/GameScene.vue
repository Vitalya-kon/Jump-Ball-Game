<template>
  <div>
    <div class="game-container" ref="gameContainer"></div>
  </div>
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
let worldWidth = 0;
let isJumping = false;
let sceneRef: Phaser.Scene | null = null; // 🔥 Сохраняем ссылку на сцену

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
  this.load.image('playerJump', '/assets/images/Ball/Jump/1.png');
  this.load.image('playerFall', '/assets/images/Ball/Jump/2.png');
  this.load.image('platform', '/assets/images/Platform/brown platform merged transparent.png');
  this.load.image('controls', '/assets/images/keyControl/keyControl.png');

  this.load.on('fileerror', (key: string, file: any) => {
    console.error(`Ошибка загрузки ресурса: ${key}`, file);
  });

  this.load.on('filecomplete', (key: string) => {
    console.log(`Ресурс загружен: ${key}`);
  });
}

function create(this: Phaser.Scene) {
  sceneRef = this; // 🔥 Сохраняем ссылку на сцену
  const canvasHeight = this.sys.canvas.height;
  worldWidth = 10000;

  this.add.tileSprite(0, 0, worldWidth, canvasHeight, 'background')
    .setOrigin(0, 0)
    .setScrollFactor(0, 1);

  platforms = this.physics.add.staticGroup();

  player = this.physics.add.sprite(150, 350, 'player');
  player.setBounce(0.5);
  player.setScale(1.3);
  player.setDepth(100);

  player.setBodySize(player.width * 0.8, player.height * 0.1);
  player.setOffset(player.width * 0.1, player.height * 0.05);

  if (platforms) {
    this.physics.add.collider(player, platforms, () => {
      if (isJumping) {
        isJumping = false;
        player?.setTexture('player');
      }
    });
  }

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

  if (this.textures.exists('controls')) {
    const controlsImage = this.add.image(
      scoreText.x + scoreText.width + 45,
      scoreText.y + 15,
      'controls'
    )
      .setScrollFactor(0)
      .setScale(0.4)
      .setOrigin(0, 0.5);

    controlsImage.setInteractive()
      .on('pointerover', () => {
        this.input.setDefaultCursor('pointer');
      })
      .on('pointerout', () => {
        this.input.setDefaultCursor('default');
      });
  } else {
    console.error("Изображение управления не загружено!");
    this.add.text(
      scoreText.x + scoreText.width + 20,
      scoreText.y,
      "Controls",
      { fontSize: '16px', color: '#ff0000' }
    ).setScrollFactor(0);
  }

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

  for (let i = 1; i <= 8; i++) {
    createNextPlatform(scene);
  }
}

function createNextPlatform(scene: Phaser.Scene) {
  const minGap = 500;
  const maxGap = 850;
  const gap = Phaser.Math.Between(minGap, maxGap);

  const newX = lastPlatformX + gap;

  if (newX > worldWidth - 2000) {
    worldWidth += 5000;
    scene.cameras.main.setBounds(0, 0, worldWidth, scene.scale.height);

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
    player.setTexture('playerJump');

    this.tweens.add({
      targets: player,
      scale: { from: 1.3, to: 1.4 },
      duration: 100,
      yoyo: true
    });
  }

  const camera = this.cameras.main;
  const cameraBottom = camera.worldView.bottom;

  // 🔥 Улучшенная проверка падения
  if (player.y > cameraBottom + 200) {
    console.log('[Падение] Игрок упал ниже камеры:',
      `y=${player.y.toFixed(0)}`,
      `камера=${cameraBottom.toFixed(0)}`,
      `разница=${(player.y - cameraBottom).toFixed(0)}`
    );
    endGame();
    return; // 🔥 Немедленно выходим из update
  }

  const viewportRight = player.x + this.cameras.main.width / 2;
  const generationThreshold = lastPlatformX - 1000;

  if (viewportRight > generationThreshold) {
    createNextPlatform(this);
  }

  if (isGameActive) {
    score = Math.floor(player.x / 10);
    scoreText?.setText(`Score: ${score}`);
  }

  const bg = this.children.getByName('background') as Phaser.GameObjects.TileSprite;
  if (bg && player.x > 400) {
    bg.tilePositionX = player.x * 0.1;
  }
}

function endGame() {
  if (!isGameActive) return;
  
  console.log('[endGame] Завершение игры');
  isGameActive = false;
  
  // 🔥 Немедленно показываем UI завершения игры
  showGameOverUI();
}

function showGameOverUI() {
  if (!sceneRef) {
    console.error('[showGameOverUI] Сцена не найдена');
    return;
  }

  console.log('[showGameOverUI] Показ UI завершения игры');
  
  // 🔥 Останавливаем физику игрока
  if (player) {
    player.setVelocity(0, 0);
    if (player.body) {
      player.body.enable = false;
    }
  }

  hideGameOverUI(); // 🔥 Сначала очищаем старый UI

  gameOverText = sceneRef.add.text(
    sceneRef.cameras.main.centerX,
    sceneRef.cameras.main.centerY - 50,
    'GAME OVER',
    { 
      fontSize: '48px', 
      color: '#ff0000', 
      stroke: '#000', 
      strokeThickness: 4,
      fontFamily: 'Arial, sans-serif'
    }
  ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

  restartButton = sceneRef.add.text(
    sceneRef.cameras.main.centerX,
    sceneRef.cameras.main.centerY + 50,
    'Tap to Restart',
    { 
      fontSize: '32px', 
      color: '#fff', 
      backgroundColor: 'rgba(0,0,0,0.8)', 
      padding: { x: 30, y: 15 },
      fontFamily: 'Arial, sans-serif'
    }
  )
  .setOrigin(0.5)
  .setScrollFactor(0)
  .setDepth(1000)
  .setInteractive({ useHandCursor: true });

  restartButton.on('pointerdown', () => {
    console.log('[restartButton] Нажата кнопка рестарта');
    restartGame(sceneRef!);
  });

  // 🔥 Добавляем обработчик для перезапуска по нажатию любой клавиши
  sceneRef.input.keyboard?.once('keydown', () => {
    console.log('[keyboard] Нажата клавиша для рестарта');
    restartGame(sceneRef!);
  });
}

function hideGameOverUI() {
  if (gameOverText) {
    gameOverText.destroy();
    gameOverText = null;
  }
  if (restartButton) {
    restartButton.destroy();
    restartButton = null;
  }
}

function restartGame(scene: Phaser.Scene) {
  console.log('[restartGame] Перезапуск игры');
  
  hideGameOverUI();
  isGameActive = true;
  score = 0;

  // 🔥 Полностью пересоздаем игрока
  if (player) {
    player.destroy();
  }

  player = scene.physics.add.sprite(150, 350, 'player');
  player.setBounce(0.5);
  player.setScale(1.3);
  player.setDepth(100);
  player.setBodySize(player.width * 0.8, player.height * 0.1);
  player.setOffset(player.width * 0.1, player.height * 0.05);

  // 🔥 Пересоздаем коллизии
  if (platforms) {
    scene.physics.add.collider(player, platforms, () => {
      if (isJumping) {
        isJumping = false;
        player?.setTexture('player');
      }
    });
  }

  // 🔥 Сбрасываем камеру
  scene.cameras.main.startFollow(player, true, 0.1, 0.1);
  scene.cameras.main.setBounds(0, 0, worldWidth, scene.scale.height);

  // 🔥 Пересоздаем UI счета
  if (scoreText) {
    scoreText.destroy();
  }
  scoreText = scene.add.text(20, 20, 'Score: 0', {
    fontSize: '24px',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: { x: 10, y: 5 }
  }).setScrollFactor(0);

  // 🔥 Пересоздаем платформы
  platforms?.clear(true, true);
  lastPlatformX = 100;
  lastPlatformY = scene.scale.height - 100;
  createInitialPlatforms(scene);

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
  sceneRef = null; // 🔥 Очищаем ссылку на сцену
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