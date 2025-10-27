import Phaser from 'phaser';

export function createScoreDisplay(scene: Phaser.Scene) {
  let score = 0;
  const text = scene.add.text(20, 20, 'Score: 0', {
    fontSize: '24px',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: { x: 10, y: 5 }
  }).setScrollFactor(0);

  return {
    update(value: number) {
      score = value;
      text.setText(`Score: ${score}`);
    },
    
    getScore() {
      return score;
    },
    
    reset() {
      this.update(0);
    },
    
    addPlusOneEffect(x: number, y: number) {
      const plusOne = scene.add.sprite(x, y, '+1');
      plusOne.setDepth(300);
      plusOne.setScale(0.8);

      scene.tweens.add({
        targets: plusOne,
        y: y - 70,
        alpha: 0,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => plusOne.destroy()
      });
    }
  };
}