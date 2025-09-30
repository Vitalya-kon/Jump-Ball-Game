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
let coins: Phaser.Physics.Arcade.Group | null = null; // 🔥 Группа монеток

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
  sceneRef = this; // 🔥 Сохраняем ссылку на сцену
  const canvasHeight = this.sys.canvas.height;
  worldWidth = 10000;
  score = 0; // Сбрасываем счет при старте игры

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

  

    // 🔥 Убираем старый расчет счета из update
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

  coins = this.physics.add.group({
    allowGravity: false,
    immovable: true
  });
  // 🔥 Добавляем создание анимации для монеток
  this.anims.create({
    key: 'coinSpin',
    frames: [
      { key: 'coin_pos_1' },
      { key: 'coin_pos_2' },
      { key: 'coin_pos_3' },
      { key: 'coin_pos_4' }
    ],
    frameRate: 5,
    repeat: -1
  });

  // 🔥 Основная коллизия для монеток (делаем один раз в create)
  this.physics.add.overlap(player, coins, (_obj1, obj2) => {
    const coin = obj2 as Phaser.Physics.Arcade.Sprite;
    coin.destroy();
    score += 1;
    scoreText?.setText(`Score: ${score}`);

    // 🔥 Новый эффект: создаем "+1"
    createPlusOneEffect(coin.x, coin.y);
  });

  

  lastPlatformY = canvasHeight - 100;
  createInitialPlatforms(this);

  hideGameOverUI();
}

// 🔥 Новая функция для эффекта "+1"
function createPlusOneEffect(x: number, y: number) {
  if (!sceneRef) return;
  
  // Создаем спрайт "+1"
  const plusOne = sceneRef.add.sprite(x, y, '+1');
  plusOne.setDepth(300);
  plusOne.setScale(0.8);
  
  // Анимируем появление и движение
  sceneRef.tweens.add({
    targets: plusOne,
    y: y - 70, // Двигаем вверх
    alpha: 0,  // Исчезаем
    duration: 2000,
    ease: 'Power2',
    onComplete: () => {
      plusOne.destroy(); // Удаляем после анимации
    }
  });
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

  // 🔥 Добавляем монетки на платформу (с 30% вероятностью)
  const shouldAddCoins = Phaser.Math.Between(1, 6) <= 3;
  if (shouldAddCoins) {
    const coinCount = Phaser.Math.Between(1, 3);
    const platformWidth = platform.width * platform.scaleX;
    const coinSpacing = platformWidth / (coinCount + 1);
    const platformHeight = platform.height * platform.scaleY;

    // 🔥 Используем глобальную группу монеток

    for (let i = 0; i < coinCount; i++) {
      const coinX = platform.x - platformWidth / 2 + (i + 1) * coinSpacing;
      const coinY = platform.y - platformHeight / 2 - 30;

      // 🔥 Создаем монетку через группу
      const coin = coins?.create(coinX, coinY, 'coin_pos_1');
      coin?.setImmovable(true); // Важно! Монетка не падает
      coin?.setOrigin(0.5, 0.5);
      coin?.setScale(0.8);
      coin?.setDepth(200);
      
      // Запускаем анимацию
      coin?.anims.play('coinSpin');
      
      // 🔥 Коллизия обрабатывается в основной overlap в create()
    }
  }

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

  // if (isGameActive) {
  //   score = Math.floor(player.x / 10);
  //   scoreText?.setText(`Score: ${score}`);
  // }

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

  // Очищаем все временные элементы
  scene.children.each(child => {
    if (child instanceof Phaser.GameObjects.Sprite && child.texture.key === '+1') {
      child.destroy();
    }
  });
  
  hideGameOverUI();
  isGameActive = true;
  score = 0;

  // 🔥 Полностью пересоздаем игрока
  if (player) {
    player.destroy();
  }

  // 🔥 Очищаем монетки при рестарте
  coins?.clear(true, true);

  // Обновляем текст счета
  if (scoreText) {
    scoreText.destroy();
  }
  scoreText = scene.add.text(20, 20, 'Score: 0', {
    fontSize: '24px',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: { x: 10, y: 5 }
  }).setScrollFactor(0);

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