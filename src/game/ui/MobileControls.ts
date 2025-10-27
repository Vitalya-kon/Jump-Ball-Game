import Phaser from 'phaser';

export class MobileControls {
  private scene: Phaser.Scene;
  private isMobile: boolean = false;
  private leftButton: Phaser.GameObjects.Text | null = null;
  private rightButton: Phaser.GameObjects.Text | null = null;
  private jumpButton: Phaser.GameObjects.Text | null = null;
  private isLeftPressed: boolean = false;
  private isRightPressed: boolean = false;
  private isJumpPressed: boolean = false;
  private onLeftPress?: () => void;
  private onRightPress?: () => void;
  private onJumpPress?: () => void;

  constructor(scene: Phaser.Scene, onLeftPress?: () => void, onRightPress?: () => void, onJumpPress?: () => void) {
    this.scene = scene;
    this.onLeftPress = onLeftPress;
    this.onRightPress = onRightPress;
    this.onJumpPress = onJumpPress;
    this.isMobile = this.checkMobile();
  }

  private checkMobile(): boolean {
    // Проверяем, является ли устройство мобильным
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) 
                   || window.innerWidth <= 768;
    return isMobile;
  }

  create(): void {
    if (!this.isMobile) {
      console.log('[MobileControls] Не мобильное устройство, кнопки не показаны');
      return;
    }

    console.log('[MobileControls] Создаем мобильное управление');

    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;
    const buttonSize = 80;
    const buttonSpacing = 20;
    const bottomOffset = 50;

    // Кнопка влево
    this.leftButton = this.scene.add.text(
      buttonSpacing * 2, 
      screenHeight - bottomOffset, 
      '←', 
      {
        fontSize: '40px',
        color: '#ffffff',
        backgroundColor: 'transparent',
        padding: { x: 20, y: 15 }
      }
    );
    this.leftButton.setOrigin(0, 1);
    this.leftButton.setInteractive({ useHandCursor: true });
    this.leftButton.setDepth(1000);
    this.setupButtonEvents(this.leftButton, 'left');

    // Кнопка вправо
    this.rightButton = this.scene.add.text(
      buttonSpacing * 2 + buttonSize + buttonSpacing, 
      screenHeight - bottomOffset, 
      '→', 
      {
        fontSize: '40px',
        color: '#ffffff',
        backgroundColor: 'transparent',
        padding: { x: 20, y: 15 }
      }
    );
    this.rightButton.setOrigin(0, 1);
    this.rightButton.setInteractive({ useHandCursor: true });
    this.rightButton.setDepth(1000);
    this.setupButtonEvents(this.rightButton, 'right');

    // Кнопка прыжка (справа)
    this.jumpButton = this.scene.add.text(
      screenWidth - buttonSize - buttonSpacing + 60, 
      screenHeight - bottomOffset, 
      'JUMP', 
      {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: 'transparent',
        padding: { x: 35, y: 15 }
      }
    );
    this.jumpButton.setOrigin(1, 1);
    this.jumpButton.setInteractive({ useHandCursor: true });
    this.jumpButton.setDepth(1000);
    this.setupButtonEvents(this.jumpButton, 'jump');
  }

  private setupButtonEvents(button: Phaser.GameObjects.Text, type: string): void {
    button.on('pointerdown', () => {
      this.pressButton(type);
      if (button.style) {
        // button.setBackgroundColor('#555555');
      }
    });

    button.on('pointerup', () => {
      this.releaseButton(type);
      if (button.style) {
        // button.setBackgroundColor(type === 'jump' ? '#4a90e2' : '#333333');
      }
    });

    button.on('pointerout', () => {
      this.releaseButton(type);
      if (button.style) {
        // button.setBackgroundColor(type === 'jump' ? '#4a90e2' : '#333333');
      }
    });

    // Поддержка тачсринов
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (button.getBounds().contains(pointer.x, pointer.y)) {
        this.pressButton(type);
        if (button.style) {
        //   button.setBackgroundColor('#555555');
        }
      }
    });

    this.scene.input.on('pointerup', () => {
      this.releaseButton(type);
      if (button.style) {
        // button.setBackgroundColor(type === 'jump' ? '#4a90e2' : '#333333');
      }
    });
  }

  private pressButton(type: string): void {
    if (type === 'left' && !this.isLeftPressed) {
      this.isLeftPressed = true;
      if (this.onLeftPress) this.onLeftPress();
    } else if (type === 'right' && !this.isRightPressed) {
      this.isRightPressed = true;
      if (this.onRightPress) this.onRightPress();
    } else if (type === 'jump' && !this.isJumpPressed) {
      this.isJumpPressed = true;
      if (this.onJumpPress) this.onJumpPress();
    }
  }

  private releaseButton(type: string): void {
    if (type === 'left') {
      this.isLeftPressed = false;
    } else if (type === 'right') {
      this.isRightPressed = false;
    } else if (type === 'jump') {
      this.isJumpPressed = false;
    }
  }

  isLeftButtonPressed(): boolean {
    return this.isLeftPressed;
  }

  isRightButtonPressed(): boolean {
    return this.isRightPressed;
  }

  isJumpButtonPressed(): boolean {
    return this.isJumpPressed;
  }

  show(): void {
    if (this.leftButton) this.leftButton.setVisible(true);
    if (this.rightButton) this.rightButton.setVisible(true);
    if (this.jumpButton) this.jumpButton.setVisible(true);
  }

  hide(): void {
    if (this.leftButton) this.leftButton.setVisible(false);
    if (this.rightButton) this.rightButton.setVisible(false);
    if (this.jumpButton) this.jumpButton.setVisible(false);
  }

  destroy(): void {
    if (this.leftButton) this.leftButton.destroy();
    if (this.rightButton) this.rightButton.destroy();
    if (this.jumpButton) this.jumpButton.destroy();
    this.leftButton = null;
    this.rightButton = null;
    this.jumpButton = null;
  }
}

