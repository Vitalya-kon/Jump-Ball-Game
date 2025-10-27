import Phaser from 'phaser';

export class GameUI {
  private scoreText: Phaser.GameObjects.Text | null = null;
  private controlsImage: Phaser.GameObjects.Image | null = null;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    this.createScoreDisplay();
    this.createControlsDisplay();
  }

  private createScoreDisplay(): void {
    this.scoreText = this.scene.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#fff',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0);
  }

  private createControlsDisplay(): void {
    if (!this.scoreText) return;

    if (this.scene.textures.exists('controls')) {
      this.controlsImage = this.scene.add.image(
        this.scoreText.x + this.scoreText.width + 45,
        this.scoreText.y + 15,
        'controls'
      )
        .setScrollFactor(0)
        .setScale(0.4)
        .setOrigin(0, 0.5);

      this.controlsImage.setInteractive()
        .on('pointerover', () => {
          this.scene.input.setDefaultCursor('pointer');
        })
        .on('pointerout', () => {
          this.scene.input.setDefaultCursor('default');
        });
    } else {
      console.error("Изображение управления не загружено!");
      this.scene.add.text(
        this.scoreText.x + this.scoreText.width + 20,
        this.scoreText.y,
        "Controls",
        { fontSize: '16px', color: '#ff0000' }
      ).setScrollFactor(0);
    }
  }

  updateScore(score: number): void {
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${score}`);
    }
  }

  destroy(): void {
    if (this.scoreText) {
      this.scoreText.destroy();
      this.scoreText = null;
    }
    if (this.controlsImage) {
      this.controlsImage.destroy();
      this.controlsImage = null;
    }
  }

  recreate(): void {
    this.destroy();
    this.create();
  }
}
