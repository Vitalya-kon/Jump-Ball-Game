declare global {
    interface Window {
        YaGames: any;
        showAd: () => void;
        game: Phaser.Game | null;
    }
}
