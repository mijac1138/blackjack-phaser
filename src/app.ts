import "phaser";
import { shuffle, filter, isArray, values, find, reverse, first, includes, sumBy } from "lodash";

const WIDTH = 800
const HEIGHT = 600


export class Table extends Phaser.Scene {
  public deck: string[]
  public drawnCards: string[] = []
  public playerCards: string[] = []
  public dealersCards: string[] = []
  public backFace: Phaser.GameObjects.Sprite;
  public playerStands: boolean = false
  public endState: boolean = false
  public controls: { Deal: Phaser.GameObjects.Text , Stand: Phaser.GameObjects.Text } = {
    Deal: null,
    Stand: null
  }

  constructor(config: GameConfig) {
    super({
      key: 'Table'
    })
  }

  preload(): void {
    this.load.setBaseURL('http://labs.phaser.io/assets/')
    this.load.atlas('cards', '/atlas/cards.png', '/atlas/cards.json');
  }

  create() {
    this.deck = this.initDeck()
    let x = 0;
    let y = 0;
    this.deck.forEach(card => {
      this.add.sprite(x, y, 'cards', card).setOrigin(0).setName(card)
      x += 0.2
      y += 3
    })
    this.deck = reverse(this.deck)
    this.add.sprite(x, y, 'cards', 'back').setOrigin(0).setName('back')
    this.controls.Deal = this.add.text(75, 500, 'Deal')
      .setOrigin(0).setFontSize(54).setFontStyle('bold italic')
      .setFontFamily('Arial').setBackgroundColor('#fab433')
      .setPadding(60, 10, 60, 10)
      .setAlpha(0.8)
    this.controls.Stand = this.add.text(400, 500, 'Stand')
      .setOrigin(0).setFontSize(54).setFontStyle('bold italic')
      .setFontFamily('Arial').setBackgroundColor('#fab433')
      .setPadding(60, 10, 60, 10)
      .setAlpha(0.8)
    // this.setDraggable(this.getCardSprite('back'))
    this.setInteractive(values(this.controls))
    this.input.on('drag', function(pointer, gameObject: Phaser.GameObjects.Sprite, dragX: number, dragY: number) {
      gameObject.x = dragX;
      gameObject.y = dragY
    })
    this.input.on('dragend', function (pointer, gameObject: Phaser.GameObjects.Text) {
      console.log(gameObject.x, gameObject.y)
    })
    this.input.on('pointerover', function(pointer, gameObjects: any[]) {
      gameObjects.forEach(o => {
        if (o.text === 'Stand' || o.text === 'Deal' || o.text === 'Shuffle') {
          o.setAlpha(1)
        }
      })
    })
    this.input.on('pointerout', function(pointer, gameObjects: any[]) {
      gameObjects.forEach(o => {
        if (o.text === 'Stand' || o.text === 'Deal' || o.text === 'Shuffle') {
          o.setAlpha(0.8)
        }
      })
    })
    this.controls.Deal.on('pointerdown', () => this.onDeal())
    this.controls.Stand.on('pointerdown', () => this.onStand())
    console.log(this)
  }

  onDeal(): void {
    if (this.endState) {
      this.endState = false
      this.scene.restart()
    } else if (this.drawnCards.length < 1 || this.endState) {
      this.firstDraw()
    } else {
      this.hitMe()
    }
  }

  firstDraw() {
    this.controls.Deal.disableInteractive()
    this.controls.Stand.disableInteractive()
    this.drawPlayer(-50)
      .then(() => this.drawDealer(-50))
      .then(() => this.drawPlayer())
      .then(() => this.drawDealer())
      .then(() => this.checkScore())
  }

  onStand() {
    if (this.drawnCards.length > 3) {
      this.playerStands = true
      this.checkScore()
    }
  }

  playerWin() {
    var title = this.add.text(225, 445, 'PLAYER WINS', { fontFamily: 'Arial', fontSize: 44, color: '#00ff00' });
    this.setEndState()
    console.log('PLAYER WINS')
  }

  dealerWin() {
    var title = this.add.text(225, 445, 'DEALER WINS', { fontFamily: 'Arial', fontSize: 44, color: '#00ff00' });
    this.setEndState()
    console.log('DEALER WINS')
  }

  noWinner() {
    var title = this.add.text(225, 445, 'DRAW', { fontFamily: 'Arial', fontSize: 44, color: '#00ff00' });
    this.setEndState()
    console.log('DRAW, NO WINNER')
  }

  setEndState() {
    this.endState = true
    this.controls.Deal.setText('Shuffle')
    this.drawnCards = []
    this.dealersCards = []
    this.playerStands = false
    this.playerCards = []
    this.setInteractive(this.controls.Deal)
    this.disableInteractive(this.controls.Stand)
  }

  cardToTop(card) {
    this.children.bringToTop(card)
  }

  drawPlayer(offset = 0) {
    return new Promise((resolve, reject) => {
      const { deck } = this
      const currentCard = this.getCardSprite(this.getNextCardName(deck))
      this.cardToTop(currentCard)
      const backCard = this.getCardSprite('back')
      this.cardToTop(backCard)
      this.drawnCards.push(currentCard.name)
      this.playerCards.push(currentCard.name)
      this.tweens.add({
        targets: currentCard,
        x: { value: 300 + offset, duration: 1500, ease: 'Power2' },
        y: { value: 250, duration: 500, ease: 'Bounce.easeOut', delay: 150 },
        onComplete: resolve
      });
      this.tweens.add({
        targets: backCard,
        x: { value: currentCard.x, duration: 1500, ease: 'Power2' },
        y: { value: currentCard.y, duration: 500, ease: 'Bounce.easeOut', delay: 150 }
      });
    })
  }

  drawDealer(offset = 0) {
    return new Promise((resolve, reject) => {
      const { deck } = this
      const currentCard = this.getCardSprite(this.getNextCardName(deck))
      this.cardToTop(currentCard)
      const backCard = this.getCardSprite('back')
      this.cardToTop(backCard)
      if (this.dealersCards.length === 0) {
        currentCard.setTexture('cards', 'back')
      }
      this.drawnCards.push(currentCard.name)
      this.dealersCards.push(currentCard.name)
      this.tweens.add({
        targets: currentCard,
        x: { value: 300 + offset, duration: 1500, ease: 'Power2' },
        y: { value: 50, duration: 500, ease: 'Bounce.easeOut', delay: 150 },
        onComplete: resolve
      });
      this.tweens.add({
        targets: backCard,
        x: { value: currentCard.x, duration: 1500, ease: 'Power2' },
        y: { value: currentCard.y, duration: 500, ease: 'Bounce.easeOut', delay: 150 }
      });
    })
  }

  getNextCardName(deck) {
    return first(deck.filter(card => !includes(this.drawnCards, card)))
  }

  hitMe() {
    this.controls.Deal.disableInteractive()
    this.controls.Stand.disableInteractive()
    const offset = (50 + 50 * (this.playerCards.length - 2))
    this.drawPlayer(offset)
      .then(() => this.checkScore())
  }

  sumCards(cards) {
    return sumBy(cards, c => this.cardValue(c))
  }

  checkScore() {
    this.controls.Deal.disableInteractive()
    this.controls.Stand.disableInteractive()
    let dealersSum = this.sumCards(this.dealersCards)
    let playerSum = this.sumCards(this.playerCards)
    if (playerSum > 21 && this.hasAce(this.playerCards)) {
      playerSum -= 10
    }
    if (dealersSum > 21 && this.hasAce(this.dealersCards)) {
      dealersSum -= 10
    }
    const firstDraw = this.drawnCards.length < 4
    const canDealerDraw = dealersSum < 17
    const playerHasBlackjack = playerSum === 21 && this.hasAce(this.playerCards) && this.playerCards.length === 2
    const dealerHasBlackjack = dealersSum === 21 && this.hasAce(this.drawnCards) && this.dealersCards.length === 2
    const playerHas21 = this.playerStands && playerSum === 21
    const dealerHas21 = dealersSum === 21
    const playerOver = playerSum > 21
    const dealerOver = dealersSum > 21
    const playerDrawnLast = this.playerCards.length > this.dealersCards.length

    console.log('checkScore', dealersSum, playerSum)

    const dealerRevealOnWin = () => {
      const cardName = first(this.dealersCards)
      const dealerBackCard = this.getCardSprite(cardName)
      this.tweens.add({
        targets: dealerBackCard,
        x: { value: dealerBackCard.x + 50, duration: 500, ease: 'Power1', delay: 1 },
        yoyo: true,
        onYoyo: () => dealerBackCard.setTexture('cards', cardName),
        onComplete: () => this.dealerWin()
      });
    }

    if (dealerHasBlackjack && playerHasBlackjack || (playerSum === dealersSum && !canDealerDraw && this.playerStands)) {
      this.noWinner()
    } else if (dealerHasBlackjack && !playerHasBlackjack) {
      dealerRevealOnWin()
    } else if (playerHasBlackjack) {
      this.playerWin()
    } else if (!firstDraw && canDealerDraw && (this.playerStands || (playerDrawnLast && !playerOver))) {
      this.drawDealer((50 + 50 * (this.dealersCards.length - 2)))
        .then(() => this.checkScore())
    } else if (playerHas21 && !canDealerDraw && (dealersSum < playerSum || dealerOver)) {
      this.playerWin()
    } else if(playerHas21 && dealerHas21) {
      this.noWinner()
    } else if (playerHas21 && canDealerDraw) {
      this.drawDealer((50 + 50 * (this.dealersCards.length - 2)))
        .then(() => this.checkScore())
    } else if (playerOver) {
      dealerRevealOnWin()
    } else if (this.playerStands && !playerOver && playerSum > dealersSum) {
      this.playerWin()
    } else if (this.playerStands && !playerOver && dealersSum > playerSum && !dealerOver) {
      dealerRevealOnWin()
    } else if (playerOver && !dealerOver) {
      dealerRevealOnWin()
    } else if (!playerOver && dealerOver) {
      this.playerWin()
    } else {
      this.controls.Deal.setInteractive()
      this.controls.Stand.setInteractive()
    }
  }

  checkFor21() {
    const playerSum = this.sumCards(this.playerCards)

    return playerSum === 21
  }

  hasAce(cards) {
    return find(cards, c => includes(c, 'Ace'))
  }

  cardValue(card) {
    if (includes(card, 'Ace')) return 11
    if (includes(card, 'King') || includes(card, 'Jack') || includes(card, 'Queen')) return 10
    return parseInt(card.replace( /^\D+/g, ''))
  }

  initDeck(): string[] {
    const deck = this.textures.get('cards').getFrameNames();
    return shuffle(filter(deck, c => c !== 'back' && c !== 'joker'))
  }

  shuffleDeck(cards: string[]): string[] {
    return shuffle(cards)
  }

  getCardSprite(name): any {
    return find(this.children.list, child => child.name === name)
  }

  setInteractive(gameObjects: Phaser.GameObjects.GameObject[]|Phaser.GameObjects.GameObject) {
    if (!isArray(gameObjects)) {
      gameObjects = [gameObjects]
    }

    gameObjects.forEach(o => o.setInteractive())
  }

  disableInteractive(gameObjects: Phaser.GameObjects.GameObject[]|Phaser.GameObjects.GameObject) {
    if (!isArray(gameObjects)) {
      gameObjects = [gameObjects]
    }

    gameObjects.forEach(o => o.disableInteractive())
  }

  setDraggable(gameObjects: Phaser.GameObjects.GameObject[]|Phaser.GameObjects.GameObject) {
    this.setInteractive(gameObjects)
    if (!isArray(gameObjects)) {
      gameObjects = [gameObjects]
    }

    gameObjects.forEach(o => this.input.setDraggable(o))
  }
}

const config: GameConfig = {
  title: "Blackjack",
  width: WIDTH,
  height: HEIGHT,
  parent: "game",
  backgroundColor: "#18216D",
  scene: [Table]
};

export class StarfallGame extends Phaser.Game {
  constructor(config: GameConfig) {
    super(config);
  }
}

window.onload = () => {
  var game = new StarfallGame(config);
};