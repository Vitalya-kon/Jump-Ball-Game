import Phaser from 'phaser';

interface Enemy extends Phaser.Physics.Arcade.Sprite {
  direction: number;
  leftBound: number;
  rightBound: number;
  platform: Phaser.Physics.Arcade.Sprite;
  lastX: number;
  stuckFrames: number;
}

export class EnemyManager {
  private enemies: Phaser.Physics.Arcade.Group | null = null;
  private scene: Phaser.Scene;
  private onGameOver?: () => void;
  private collisionSet = false;

  constructor(scene: Phaser.Scene, onGameOver?: () => void) {
    this.scene = scene;
    this.onGameOver = onGameOver;
  }

  create(): Phaser.Physics.Arcade.Group {
    this.enemies = this.scene.physics.add.group({
      allowGravity: false, // Отключаем гравитацию для врагов
      immovable: false
    });

    // Создаем анимацию ходьбы врага
    this.scene.anims.create({
      key: 'enemyWalk',
      frames: [
        { key: 'enemies_walk_pos_1' },
        { key: 'enemies_walk_pos_2' }
      ],
      frameRate: 8,
      repeat: -1
    });

    return this.enemies;
  }

  addEnemyToPlatform(platform: Phaser.Physics.Arcade.Sprite): void {
    if (!this.enemies) {
      console.log('[EnemyManager] Группа врагов не создана');
      return;
    }

    // 80% вероятность появления врага на платформе
    const randomValue = Math.random();
    const shouldCreate = randomValue <= 0.8; // 80% шанс создать врага
    
    if (!shouldCreate) return;

    const platformWidth = platform.width * platform.scaleX;
    const platformHeight = platform.height * platform.scaleY;
    
    // Вычисляем границы платформы
    const leftBound = platform.x - platformWidth / 3;
    const rightBound = platform.x + platformWidth / 3;
    
    // Начальная позиция врага (в центре платформы)
    const startX = platform.x;
    // Размещаем врага на верхней границе платформы (анкер снизу)
    const startY = platform.y - platformHeight / 3.3;

    // Создаем врага
    const enemy = this.enemies.create(startX, startY, 'enemies_walk_pos_1') as Enemy;
    
    // Настройка врага
    enemy.setOrigin(0.5, 1); // Анкер снизу для правильного позиционирования на платформе
    enemy.setScale(0.6);
    enemy.setDepth(50);
    enemy.setCollideWorldBounds(false);
    
    // Настраиваем физическое тело
    if (enemy.body && enemy.body instanceof Phaser.Physics.Arcade.Body) {
      enemy.body.setSize(enemy.width * 0.7, enemy.height * 0.7);
      enemy.body.setAllowGravity(false); // Отключаем гравитацию
    }
    
    // Привязываем данные к врагу
    enemy.direction = 1; // Направление движения (1 = вправо, -1 = влево)
    enemy.leftBound = leftBound + enemy.width / 3;
    enemy.rightBound = rightBound - enemy.width / 3;
    enemy.platform = platform;
    enemy.lastX = enemy.x;
    enemy.stuckFrames = 0;

    // Устанавливаем начальное направление спрайта (лицом вправо)
    enemy.setFlipX(false);

    // Запускаем анимацию ходьбы
    enemy.anims.play('enemyWalk');

    // Устанавливаем начальную скорость
    enemy.setVelocityX(50);
  }

  update(): void {
    if (!this.enemies) return;

    this.enemies.children.entries.forEach(child => {
      const enemy = child as Enemy;
      
      if (!enemy.active || !enemy.platform) {
        return;
      }

      const platform = enemy.platform;
      const platformWidth = platform.width * platform.scaleX;
      
      // Обновляем границы платформы
      enemy.leftBound = platform.x - platformWidth / 3 + enemy.width / 3;
      enemy.rightBound = platform.x + platformWidth / 3 - enemy.width / 3;

      // Проверяем застревание врага
      if (Math.abs(enemy.x - enemy.lastX) < 1) {
        // Враг не двигается
        enemy.stuckFrames++;
        
        // Если застрял более 10 фреймов - меняем направление
        if (enemy.stuckFrames > 5) {
          enemy.direction *= -1;
          enemy.setVelocityX(50 * enemy.direction);
          enemy.setFlipX(enemy.direction < 0);
          enemy.stuckFrames = 0;
        }
      } else {
        // Враг двигается нормально
        enemy.stuckFrames = 0;
        enemy.lastX = enemy.x;
      }

      // Проверяем, достиг ли враг края платформы
      if (enemy.x >= enemy.rightBound || enemy.x <= enemy.leftBound) {
        // Разворачиваем врага
        enemy.direction *= -1;
        enemy.setVelocityX(50 * enemy.direction);
        // Отзеркаливаем спрайт при смене направления
        enemy.setFlipX(enemy.direction < 0);
      }

      // Очищаем врагов, которые вышли за пределы видимости (остались позади камеры)
      const camera = this.scene.cameras.main;
      const cameraLeft = camera.x - 200; // Добавляем запас 200 пикселей
    //   const cameraRight = camera.x + camera.width + 500; // Впереди камеры оставляем больше места
      
      // Удаляем врагов, которые остались позади игрока
      if (enemy.x < cameraLeft) {
        enemy.destroy();
      }
      // Также удаляем врагов, которые слишком далеко впереди (на случай багов)
    //   if (enemy.x > cameraRight) {
    //     console.log('[EnemyManager] Удаляем врага слишком далеко впереди x=', enemy.x);
    //     enemy.destroy();
    //   }
    });
  }

  setupCollision(player: Phaser.Physics.Arcade.Sprite): void {
    if (!this.enemies) return;
    
    // Если коллизия уже установлена, не создаем ее повторно
    if (this.collisionSet) {
      return;
    }

    this.scene.physics.add.overlap(player, this.enemies, () => {
      console.log('Столкновение с врагом!');
      
      if (player.body && player.body instanceof Phaser.Physics.Arcade.Body) {
        // Включаем гравитацию для падения вниз
        player.body.setAllowGravity(true);
        player.body.setGravityY(2000); // Сильная гравитация вниз
        
        // Устанавливаем скорость вниз
        player.setVelocity(0, 500);
        
        // Отключаем все коллизии этого игрока
        player.body.checkCollision.none = true;
        player.body.checkCollision.up = false;
        player.body.checkCollision.down = false;
        player.body.checkCollision.left = false;
        player.body.checkCollision.right = false;
      }
      
      // Вызываем функцию завершения игры
      if (this.onGameOver) {
        setTimeout(() => {
          this.onGameOver!();
        }, 500); // Небольшая задержка перед показом окна
      }
    });
    
    this.collisionSet = true;
  }

  clearEnemies(): void {
    this.collisionSet = false;
    this.enemies?.clear(true, true);
  }

  getEnemies(): Phaser.Physics.Arcade.Group | null {
    return this.enemies;
  }

  destroy(): void {
    this.clearEnemies();
    this.enemies = null;
  }
}

