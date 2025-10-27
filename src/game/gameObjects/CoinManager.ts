import Phaser from 'phaser';

export class CoinManager {
  private coins: Phaser.Physics.Arcade.Group | null = null;
  private scene: Phaser.Scene;
  private score = 0;
  private onScoreUpdate?: (score: number) => void;
  private platformIndex = 0; // Добавляем счетчик платформ

  constructor(scene: Phaser.Scene, onScoreUpdate?: (score: number) => void) {
    this.scene = scene;
    this.onScoreUpdate = onScoreUpdate;
  }

  create(): Phaser.Physics.Arcade.Group {
    this.coins = this.scene.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // Создаем анимацию для монеток
    this.scene.anims.create({
      key: 'coinSpin',
      frames: [
        { key: 'coin_pos_1' },
        { key: 'coin_pos_2' },
        { key: 'coin_pos_3' },
        { key: 'coin_pos_4' }
      ],
      frameRate: 6, // Плавная анимация с умеренной скоростью
      repeat: -1
    });

    return this.coins;
  }

  setupCollision(player: Phaser.Physics.Arcade.Sprite): void {
    if (!this.coins) return;

    this.scene.physics.add.overlap(player, this.coins, (_obj1, obj2) => {
      const coin = obj2 as Phaser.Physics.Arcade.Sprite;
      coin.destroy();
      this.score += 1;
      
      if (this.onScoreUpdate) {
        this.onScoreUpdate(this.score);
      }

      // Создаем эффект "+1"
      this.createPlusOneEffect(coin.x, coin.y);
    });
  }

  addCoinsToPlatform(platform: Phaser.Physics.Arcade.Sprite): void {
    if (!this.coins) return;

    this.platformIndex++; // Увеличиваем счетчик платформ
    const isSecondPlatform = this.platformIndex === 2; // Проверяем, является ли это второй платформой

    // На второй платформе монетки появляются обязательно, на остальных - с 60% вероятностью
    const shouldAddCoins = isSecondPlatform || Phaser.Math.Between(1, 5) <= 3;
    if (!shouldAddCoins) return;

    const coinCount = Phaser.Math.Between(1, 3);
    const platformWidth = platform.width * platform.scaleX;
    const coinSpacing = platformWidth / (coinCount + 1);
    const platformHeight = platform.height * platform.scaleY;

    for (let i = 0; i < coinCount; i++) {
      const coinX = platform.x - platformWidth / 2 + (i + 1) * coinSpacing;
      const coinY = platform.y - platformHeight / 2 - 30;

      const coin = this.coins.create(coinX, coinY, 'coin_pos_1');
      coin?.setImmovable(true);
      coin?.setOrigin(0.5, 0.5);
      coin?.setScale(0.8);
      coin?.setDepth(200);
      coin?.anims.play('coinSpin');
    }
  }

  private createPlusOneEffect(x: number, y: number): void {
    const plusOne = this.scene.add.sprite(x, y, '+1');
    plusOne.setDepth(300);
    plusOne.setScale(0.8);
    
    this.scene.tweens.add({
      targets: plusOne,
      y: y - 70,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        plusOne.destroy();
      }
    });
  }

  getCoins(): Phaser.Physics.Arcade.Group | null {
    return this.coins;
  }

  getScore(): number {
    return this.score;
  }

  resetScore(): void {
    this.score = 0;
    this.platformIndex = 0; // Сбрасываем счетчик платформ при рестарте
  }

  clearCoins(): void {
    this.coins?.clear(true, true);
  }

  destroy(): void {
    this.clearCoins();
    this.coins = null;
  }
}