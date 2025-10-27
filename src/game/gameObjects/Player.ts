import Phaser from 'phaser';

export class Player {
  private sprite: Phaser.Physics.Arcade.Sprite | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;
  private isJumping = false;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(x: number, y: number): Phaser.Physics.Arcade.Sprite {
    this.sprite = this.scene.physics.add.sprite(x, y, 'player');
    this.sprite.setBounce(0.5);
    this.sprite.setScale(1.95);
    this.sprite.setDepth(100);
    // Улучшенные параметры коллайдера для лучшего позиционирования на платформах
    this.sprite.setBodySize(this.sprite.width * 0.6, this.sprite.height * 0.3);
    this.sprite.setOffset(this.sprite.width * 0.2, this.sprite.height * 0.1);

    // Настройка управления
    this.cursors = this.scene.input.keyboard?.createCursorKeys() || null;
    this.spaceKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) || null;

    return this.sprite;
  }

  update(): void {
    if (!this.sprite || !this.cursors || !this.spaceKey) return;

    const speed = 150;

    // Движение влево-вправо
    if (this.cursors.left.isDown) {
      this.sprite.setVelocityX(-speed);
      this.sprite.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.sprite.setVelocityX(speed);
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
    }

    // Прыжок
    const onGround = this.sprite.body?.touching.down || this.sprite.body?.blocked.down;
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && onGround) {
      this.sprite.setVelocityY(-400);
      this.isJumping = true;
      this.sprite.setTexture('playerJump');

      this.scene.tweens.add({
        targets: this.sprite,
        scale: { from: 1.95, to: 2.1 },
        duration: 100,
        yoyo: true
      });
    }
  }

  onPlatformCollision(): void {
    if (this.isJumping && this.sprite) {
      this.isJumping = false;
      this.sprite.setTexture('player');
    }
  }

  getSprite(): Phaser.Physics.Arcade.Sprite | null {
    return this.sprite;
  }

  getIsJumping(): boolean {
    return this.isJumping;
  }

  destroy(): void {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  reset(x: number, y: number): void {
    this.destroy();
    this.create(x, y);
  }
}
