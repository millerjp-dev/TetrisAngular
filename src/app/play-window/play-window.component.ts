import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CoreSystemService} from "../shared/core-system.service";
import {userDirection} from "../shared/models/direction.model";
import {userInputsModel} from "../shared/models/user-inputs.model";

@Component({
  selector: 'app-play-window',
  templateUrl: './play-window.component.html',
  styleUrls: ['./play-window.component.css']
})
export class PlayWindowComponent implements OnInit, AfterViewInit {
  @ViewChild('play', { static: true }) canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('held', { static: true }) holdArea: ElementRef<HTMLCanvasElement>;
  @ViewChild('next', { static: true }) nextArea: ElementRef<HTMLCanvasElement>;
  context: CanvasRenderingContext2D;
  contextHeld: CanvasRenderingContext2D;
  contextNext: CanvasRenderingContext2D;
  width;
  height;
  flicker = true;
  garbageBlocks = new GarbageBlocks(this.core);
  activePiece: BlockShape;
  heldPiece: BlockShape;
  nextPiece: BlockShape;
  heldSpawnX = 40;
  heldSpawnY = 40;
  playSpawnX = 80;
  playSpawnY = 0;
  nextSpawnX = 40;
  nextSpawnY = 40;
  clearedLines = 0;
  availablePieces = ['IBlock', 'TBlock', 'ZBlock', 'OBlock', 'JBlock', 'LBlock', 'SBlock'];
  pieceBag = [];
  heldThisPiece = false;
  constructor(private core: CoreSystemService) {
    this.core.clearedLine.subscribe( num => {
      this.clearedLines += num;
    });
    this.core.newPiece.subscribe( async () => {
      this.activePiece = null;
      await new Promise(resolve =>
        setTimeout(resolve, 500)
      );
      this.newActivePiece();

    });
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.context = this.canvas.nativeElement.getContext('2d');
    this.contextHeld = this.holdArea.nativeElement.getContext('2d');
    this.contextNext = this.nextArea.nativeElement.getContext('2d');
    this.core.newPiece.next(true);
    this.core.clock.subscribe( paused => {
      if (!paused) {
        this.movePiece(userDirection.Down);
      }
    });
    this.core.userInput.subscribe( input => {
      switch(input.input)
      {
        case(userInputsModel.left): this.movePiece(userDirection.Left); break;
        case(userInputsModel.right): this.movePiece(userDirection.Right); break;
        case(userInputsModel.down): this.movePiece(userDirection.Down); break;
        case(userInputsModel.up): this.activePiece ? this.activePiece.hardDrop(): ''; break;
        case(userInputsModel.turnR): this.activePiece ? this.activePiece.turnRight() : ''; break;
        case(userInputsModel.turnL): this.activePiece ? this.activePiece.turnLeft(): ''; break;
        case(userInputsModel.hold): this.holdPiece(); break;
        case(userInputsModel.reset): this.reset();
      }
    });

  }
  newActivePiece() {
    if (!this.nextPiece) {
      this.activePiece = this.createPiece(this.getRandomPiece(), this.playSpawnX, this.playSpawnY, this.canvas, this.garbageBlocks);
    } else {
      this.activePiece = this.createPiece(this.nextPiece.blockType, this.playSpawnX, this.playSpawnY, this.canvas, this.garbageBlocks);
    }
    this.nextPiece = this.createPiece(this.getRandomPiece(), this.nextSpawnX, this.nextSpawnY, this.nextArea, this.garbageBlocks);
    this.context.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.contextNext.clearRect(0,0,this.nextArea.nativeElement.width, this.nextArea.nativeElement.height);
    if (!this.activePiece.checkSpawn()) {
      this.reset();
    } else {
    this.heldThisPiece = false;
    this.activePiece.draw();
    this.nextPiece.draw();
    this.garbageBlocks.draw();
    }

  }

  holdPiece() {
    if (this.activePiece && !this.heldThisPiece) {

      this.heldThisPiece = true;
      if (!this.heldPiece) {
        this.contextHeld.clearRect(0,0,this.holdArea.nativeElement.width, this.holdArea.nativeElement.height);
        this.heldPiece = this.createPiece(this.activePiece.blockType, this.heldSpawnX, this.heldSpawnY, this.holdArea, this.garbageBlocks);
        this.heldPiece.draw();
        this.core.newPiece.next(true);
      } else {
        const heldType = this.activePiece.blockType;
        this.activePiece = this.createPiece(this.heldPiece.blockType, this.playSpawnX, this.playSpawnY, this.canvas, this.garbageBlocks);
        this.heldPiece = this.createPiece(heldType, this.heldSpawnX, this.heldSpawnY, this.holdArea, this.garbageBlocks);
        this.context.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);
        this.contextHeld.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);
        this.heldPiece.draw();
        this.activePiece.draw();
        this.garbageBlocks.draw();
      }
    }
  }

  getRandomPiece() {
    if (this.pieceBag.length < 1) {
      this.refillBag();
    }
    let piece = this.pieceBag[0];
    this.pieceBag = this.pieceBag.slice(1,this.pieceBag.length);
    return piece;
  }

  refillBag() {
    this.pieceBag = this.shuffle(this.availablePieces.slice(0,this.availablePieces.length));
  }

  shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  createPiece(type, startX, startY, canvas, garbageBlocks) {
    switch (type) {
      case ('IBlock'): return new IBlock(startX, startY, canvas, garbageBlocks);
      case ('TBlock'): return new TBlock(startX, startY, canvas, garbageBlocks);
      case ('OBlock'): return new OBlock(startX, startY, canvas, garbageBlocks);
      case ('LBlock'): return new LBlock(startX, startY, canvas, garbageBlocks);
      case ('JBlock'): return new JBlock(startX, startY, canvas, garbageBlocks);
      case ('SBlock'): return new SBlock(startX, startY, canvas, garbageBlocks);
      case ('ZBlock'): return new ZBlock(startX, startY, canvas, garbageBlocks);
    }
  }

  movePiece(dir: userDirection ) {
    this.activePiece != null ? this.activePiece.move(dir) : null;
  }


  reset() {
    this.clearedLines = 0;
    this.context.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.contextHeld.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.contextNext.clearRect(0,0,this.nextArea.nativeElement.width, this.nextArea.nativeElement.height);
    this.garbageBlocks = new GarbageBlocks(this.core);
    this.nextPiece = null;
    this.activePiece = null;
    this.heldPiece = null;
    this.pieceBag = [];
    this.core.newPiece.next(true);
  }
}

class Block {
  color;
  x;
  y;
  w;
  h;
  context: CanvasRenderingContext2D;
  constructor(canvas, startX, startY, w, h, color) {
    this.context = canvas.nativeElement.getContext("2d");
    this.x = startX;
    this.y = startY;
    this.w = w;
    this.h = h;
    this.color = color;
  }
  public draw() {
    this.context.beginPath();
    this.context.rect(this.x, this.y, this.w, this.h)
    this.context.fillStyle = this.color;
    this.context.fill();
    this.context.closePath();
    this.context.beginPath();
    this.context.rect(this.x + 1 , this.y + 1, this.w - 2, this.h - 2)
    this.context.strokeStyle = 'black';
    this.context.stroke();
    this.context.closePath();
  };
  public clear() {
    this.context.clearRect(this.x - .1, this.y - .1, this.w + .3, this.h + .1)
  }
  public move(deltaX, deltaY) {
    this.x += deltaX;
    this.y += deltaY;
  }
}

class BlockShape {
  hangTime = 1;
  blockType;
  blocks: Block[] = [];
  x;
  y;
  orientation = 0;
  garbageBlocks: GarbageBlocks;
  constructor(startX, startY, garbageBlocks) {
    this.x = startX;
    this.y = startY;
    this.garbageBlocks = garbageBlocks;
  }
  turnRight() {
    this.orientation < 3 ? this.orientation += 1 : this.orientation = 0;
  }

  turnLeft() {
    this.orientation > 0 ? this.orientation -= 1 : this.orientation = 3;
  }

  checkPivot(b0x, b0y, b1x, b1y, b2x, b2y, b3x, b3y, pivots: {x: number, y: number}[]) {
    return !pivots.every( pivot => {
      return !this.checkAndTurnBlocks(b0x, b0y, b1x, b1y, b2x, b2y, b3x, b3y, pivot.x, pivot.y);
    });
  }

  hardDrop() {
    let maxTries = 100;
    while(this.move(userDirection.Down)) {
      if( maxTries-- < 1) { break;}
    }
  }

  checkAndTurnBlocks(b0x, b0y, b1x, b1y, b2x, b2y, b3x, b3y, px, py) {
    b0x = (b0x + px) * 20;
    b0y = -(b0y + py) * 20;
    b1x = (b1x + px) * 20;
    b1y = -(b1y + py) * 20;
    b2x = (b2x + px) * 20;
    b2y = -(b2y + py) * 20;
    b3x = (b3x + px) * 20;
    b3y = -(b3y + py) * 20;
    if (!this.garbageBlocks.checkIfEmpty(this.blocks[0].x + b0x, this.blocks[0].y + b0y)
  ) {return false;}
    if (
      !this.garbageBlocks.checkIfEmpty(this.blocks[1].x + b1x, this.blocks[1].y + b1y)
    ) {return false;}
    if (
      !this.garbageBlocks.checkIfEmpty(this.blocks[2].x + b2x, this.blocks[2].y + b2y)
    ) {return false;}
    if (
      !this.garbageBlocks.checkIfEmpty(this.blocks[3].x + b3x, this.blocks[3].y + b3y)
    ) {return false;}
    let count = 0;
    if (!this.blocks.every( block => {
      switch (count) {
        case (0):
          if (block.x + b0x > 180 || block.x + b0x < 0 || block.y + b0y > 380) {
            return false;
          }
          count++;
          break;
        case (1):
          if (block.x + b1x > 180 || block.x + b1x < 0 || block.y + b1y > 380) {
            return false;
          }
          count++;
          break;
        case(2):
          if (block.x + b2x > 180 || block.x + b2x < 0 || block.y + b2y > 380) {
            return false;
          }
          count++;
          break;
        case(3):
          if (block.x + b3x > 180 || block.x + b3x < 0 || block.y + b3y > 380) {
            return false;
          }
          break;
      }
      return true;
    })) {
      return false;
    }
    this.clear();
    this.blocks[0].move(b0x, b0y);
    this.blocks[1].move(b1x, b1y);
    this.blocks[2].move(b2x, b2y);
    this.blocks[3].move(b3x, b3y);
    this.draw();
    return true;
  }

  checkSpawn() {
    return this.blocks.every( block => {
      return this.garbageBlocks.checkIfEmpty(block.x, block.y);
    })
  }

  checkHang() {
      if (this.hangTime-- < 1) {
        this.moveToGarbage();
        return true;
      }
      return false;
  }

  moveToGarbage() {
    this.garbageBlocks.addBlocks(this.blocks);
  }

  clear() {
    this.blocks.forEach( block => {
      block.clear();
    })
  }

  draw() {
    this.blocks.forEach( block => {
      block.draw();
    })
  }
  move(dir: userDirection): boolean {
    let killPiece = false;
    let dontMove = false;

      this.blocks.every( block => {
        switch (dir) {
          case (userDirection.Down):
          if (!this.garbageBlocks.checkIfEmpty(block.x, block.y + 20)) {
            if(this.checkHang()) {
              killPiece = true;
            } else {
              dontMove = true;
            }
            return false;
          }
          if (block.y >= 380) {
            if(this.checkHang()) {
              killPiece = true;
            } else {
              dontMove = true;
            }
            return false;
          }
          break;
          case (userDirection.Right):
            if (!this.garbageBlocks.checkIfEmpty(block.x + 20, block.y) ) {
              dontMove = true;
              return false;
            }
            if (block.x == 180) {
              dontMove = true;
              return false;
            }
            break;
          case (userDirection.Left):
            if (!this.garbageBlocks.checkIfEmpty(block.x - 20, block.y) ) {
              dontMove = true;
              return false;
            }
            if (block.x == 0) {
              dontMove = true;
              return false;
            }
            break;
        }
        return true;
      });

    if (killPiece) {
      return false;
    }
    if (dontMove) {
      return true;
    }
    this.blocks.forEach( block => {
      block.clear();
    });
    this.blocks.forEach( block => {
      switch(dir) {
        case(userDirection.Down):
          block.move(0, 20); break;
        case(userDirection.Right):
          if (block.x < 280) {
            block.move(20, 0); break;
          }
          break;
        case(userDirection.Left):
          if (block.x > 0) {
            block.move(-20, 0);
          }
          break;
      }
    });
    this.blocks.forEach( block => {
      block.draw();
    });
    return true;
  }
}


class IBlock extends BlockShape {
  blockType = 'IBlock';
  constructor(startX, startY, canvas, garbageBlocks) {
    super(startX, startY, garbageBlocks);
    this.blocks.push(new Block(canvas, startX - 20, startY, 20, 20, 'Cyan'));
    this.blocks.push(new Block(canvas, startX, startY, 20, 20, 'Cyan'));
    this.blocks.push(new Block(canvas, startX + 20, startY, 20, 20, 'Cyan'));
    this.blocks.push(new Block(canvas, startX + 40, startY, 20, 20, 'Cyan'));
  }

  turnLeft() {
    let turned = false;
    switch(this.orientation) {
      case(0):
        turned = this.checkPivot(1, -2, 0, -1, -1, 0, -2, 1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: 2, y: 0}, {x: -1, y:2}, {x:2, y:-1}]);
        break;

      case(1):
        turned = this.checkPivot(-2, -1, -1, 0, 0, 1, 1, 2,
          [{x: 0, y: 0}, {x: 2, y:0}, {x: -1, y: 0}, {x: 2, y:1}, {x:-1, y:-2}]);
        break;
      case(2):
        turned = this.checkPivot(-1, 2, 0, 1, 1, 0, 2, -1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: -2, y: 0}, {x: 1, y:-2}, {x:-2, y:1}]);
        break;

      case(3):
        turned = this.checkPivot(2, 1, 1, 0, 0, -1, -1, -2,
          [{x: 0, y: 0}, {x: -2, y:0}, {x: 1, y: 0}, {x: -2, y:-1}, {x:1, y:2}]);
        break;
    }
    if (turned) {
      super.turnLeft();
    }
  }

  turnRight() {
    let turned = false;
    switch(this.orientation) {
      case(0):
        turned = this.checkPivot(2, 1, 1, 0, 0, -1, -1, -2,
          [{x: 0, y: 0}, {x: -2, y:0}, {x: 1, y: 0}, {x: -2, y:-1}, {x:1, y:2}]);
        break;
      case(1):
        turned = this.checkPivot(1, -2, 0, -1, -1, 0, -2, 1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: 2, y: 0}, {x: -1, y:2}, {x:2, y:-1}]);
        break;
      case(2):
        turned = this.checkPivot(-2, -1, -1, 0, 0, 1, 1, 2,
          [{x: 0, y: 0}, {x: 2, y:0}, {x: -1, y: 0}, {x: 2, y:1}, {x:-1, y:-2}]);
        break;
      case(3):
        turned = this.checkPivot(-1, 2, 0, 1, 1, 0, 2,  -1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: -2, y: 0}, {x: 1, y:-2}, {x:-2, y:1}]);
        break;
    }
    if (turned) {
      super.turnRight();
    }
  }
}

class TBlock extends BlockShape {
  blockType = 'TBlock';
  constructor(startX, startY, canvas, garbageBlocks) {
    super(startX, startY, garbageBlocks);
    this.blocks.push(new Block(canvas, startX, startY, 20, 20, 'Purple'));
    this.blocks.push(new Block(canvas, startX - 20, startY + 20, 20, 20, 'Purple'));
    this.blocks.push(new Block(canvas, startX + 20, startY + 20, 20, 20, 'Purple'));
    this.blocks.push(new Block(canvas, startX, startY + 20, 20, 20, 'Purple'));
  }
  turnLeft() {
      let turned = false;
      switch(this.orientation) {
        case(0):
          turned = this.checkPivot(-1, -1, 1, -1, -1, 1, 0, 0,
            [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: 1}, {x: 0, y:-2}, {x:1, y:-2}]);
          break;
        case(1):
          turned = this.checkPivot(-1, 1, -1, -1, 1, 1, 0, 0,
            [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: -1}, {x: 0, y:2}, {x:1, y:2}]);
          break;
        case(2):
          turned = this.checkPivot(1, 1, -1, 1, 1, -1, 0, 0,
            [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: 1}, {x: 0, y:-2}, {x:-1, y:-2}]);
          break;
        case(3):
          turned = this.checkPivot(1, -1, 1, 1, -1, -1, 0, 0,
            [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: -1}, {x: 0, y:2}, {x:-1, y:2}]);
          break;
      }
      if (turned) {
        super.turnLeft();
      }
    }

    turnRight() {
      let turned = false;
      switch(this.orientation) {
        case(0):
          turned = this.checkPivot(1, -1, 1, 1, -1, -1, 0, 0,
            [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: 1}, {x: 0, y:-2}, {x:-1, y:-2}]);
          break;
        case(1):
          turned = this.checkPivot(-1, -1, 1, -1, -1, 1, 0, 0,
            [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: -1}, {x: 0, y:2}, {x:1, y:2}]);
          break;
        case(2):
          turned = this.checkPivot(-1, 1, -1, -1, 1, 1, 0,  0,
            [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: 1}, {x: 0, y:-2}, {x:1, y:-2}]);
          break;
        case(3):
          turned = this.checkPivot(1, 1, -1, 1, 1, -1, 0, 0,
            [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: -1}, {x: 0, y:2}, {x:-1, y:2}]);
          break;
      }
      if (turned) {
        super.turnRight();
      }
    }
}
class OBlock extends BlockShape {
  blockType = 'OBlock';
  constructor(startX, startY, canvas, garbageBlocks) {
    super(startX, startY, garbageBlocks);
    this.blocks.push(new Block(canvas, startX, startY, 20, 20, 'Yellow'));
    this.blocks.push(new Block(canvas, startX + 20, startY, 20, 20, 'Yellow'));
    this.blocks.push(new Block(canvas, startX, startY + 20, 20, 20, 'Yellow'));
    this.blocks.push(new Block(canvas, startX + 20, startY + 20, 20, 20, 'Yellow'));
  }
}

class LBlock extends BlockShape {
  blockType = 'LBlock';
  constructor(startX, startY, canvas, garbageBlocks) {
    super(startX, startY, garbageBlocks);
    this.blocks.push(new Block(canvas, startX - 20, startY, 20, 20, 'Blue'));
    this.blocks.push(new Block(canvas, startX - 20, startY + 20, 20, 20, 'Blue'));
    this.blocks.push(new Block(canvas, startX, startY + 20, 20, 20, 'Blue'));
    this.blocks.push(new Block(canvas, startX + 20, startY + 20, 20, 20, 'Blue'));
  }
  turnLeft() {
    let turned = false;
    switch(this.orientation) {
      case(0):
        turned = this.checkPivot(0, -2, 1, -1, 0, 0, -1, 1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: 1}, {x: 0, y:-2}, {x:1, y:-2}]);
        break;
      case(1):
        turned = this.checkPivot(-2, 0, -1, -1, 0, 0, 1, 1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: -1}, {x: 0, y:2}, {x:1, y:2}]);
        break;
      case(2):
        turned = this.checkPivot(0, 2, -1, 1, 0, 0, 1, -1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: 1}, {x: 0, y:-2}, {x:-1, y:-2}]);
        break;
      case(3):
        turned = this.checkPivot(2, 0, 1, 1, 0, 0, -1, -1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: -1}, {x: 0, y:2}, {x:-1, y:2}]);
        break;
    }
    if (turned) {
      super.turnLeft();
    }
  }

  turnRight() {
    let turned = false;
    switch(this.orientation) {
      case(0):
        turned = this.checkPivot(2, 0, 1, 1, 0, 0, -1, -1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: 1}, {x: 0, y:-2}, {x:-1, y:-2}]);
        break;
      case(1):
        turned = this.checkPivot(0, -2, 1, -1, 0, 0, -1, 1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: -1}, {x: 0, y:2}, {x:1, y:2}]);
        break;
      case(2):
        turned = this.checkPivot(-2, 0, -1, -1, 0, 0, 1,  1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: 1}, {x: 0, y:-2}, {x:1, y:-2}]);
        break;
      case(3):
        turned = this.checkPivot(0, 2, -1, 1, 0, 0, 1, -1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: -1}, {x: 0, y:2}, {x:-1, y:2}]);
        break;
    }
    if (turned) {
      super.turnRight();
    }
    }
}

class JBlock extends BlockShape {
  blockType = 'JBlock';
  constructor(startX, startY, canvas, garbageBlocks) {
    super(startX, startY, garbageBlocks);
    this.blocks.push(new Block(canvas, startX + 20, startY, 20, 20, 'Orange'));
    this.blocks.push(new Block(canvas, startX + 20, startY + 20, 20, 20, 'Orange'));
    this.blocks.push(new Block(canvas, startX, startY + 20, 20, 20, 'Orange'));
    this.blocks.push(new Block(canvas, startX - 20, startY + 20, 20, 20, 'Orange'));
  }

  turnLeft() {
    let turned = false;
    switch(this.orientation) {
      case(0):
        turned = this.checkPivot(-2, 0, -1, 1, 0, 0, 1, -1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: 1}, {x: 0, y:-2}, {x:1, y:-2}]);
        break;
      case(1):
        turned = this.checkPivot(0, 2, 1, 1, 0, 0, -1, -1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: -1}, {x: 0, y:2}, {x:1, y:2}]);
        break;
      case(2):
        turned = this.checkPivot(2, 0, 1, -1, 0, 0, -1, 1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: 1}, {x: 0, y:-2}, {x:-1, y:-2}]);
        break;
      case(3):
        turned = this.checkPivot(0, -2, -1, -1, 0, 0, 1, 1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: -1}, {x: 0, y:2}, {x:-1, y:2}]);
        break;
    }
    if (turned) {
      super.turnLeft();
    }
  }

  turnRight() {
    let turned = false;
    switch(this.orientation) {
      case(0):
        turned = this.checkPivot(0, -2, -1, -1, 0, 0, 1, 1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: 1}, {x: 0, y:-2}, {x:-1, y:-2}]);
        break;
      case(1):
        turned = this.checkPivot(-2, 0, -1, 1, 0, 0, 1, -1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: -1}, {x: 0, y:2}, {x:1, y:2}]);
        break;
      case(2):
        turned = this.checkPivot(0, 2, 1, 1, 0, 0, -1,  -1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: 1}, {x: 0, y:-2}, {x:1, y:-2}]);
        break;
      case(3):
        turned = this.checkPivot(2, 0, 1, -1, 0, 0, -1, 1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: -1}, {x: 0, y:2}, {x:-1, y:2}]);
        break;
    }
    if (turned) {
      super.turnRight();
    }
  }
}

class ZBlock extends BlockShape {
  blockType = 'ZBlock';
  constructor(startX, startY, canvas, garbageBlocks) {
    super(startX, startY, garbageBlocks);
    this.blocks.push(new Block(canvas, startX - 20, startY, 20, 20, 'Red'));
    this.blocks.push(new Block(canvas, startX, startY, 20, 20, 'Red'));
    this.blocks.push(new Block(canvas, startX, startY + 20, 20, 20, 'Red'));
    this.blocks.push(new Block(canvas, startX + 20, startY + 20, 20, 20, 'Red'));
  }
  turnLeft() {
    let turned = false;
    switch(this.orientation) {
      case(0):
        turned = this.checkPivot(0, -2, -1, -1, 0, 0, -1, 1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: 1}, {x: 0, y:-2}, {x:1, y:-2}]);
        break;
      case(1):
        turned = this.checkPivot(-2, 0, -1, 1, 0, 0, 1, 1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: -1}, {x: 0, y:2}, {x:1, y:2}]);
        break;
      case(2):
        turned = this.checkPivot(0, 2, 1, 1, 0, 0, 1, -1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: 1}, {x: 0, y:-2}, {x:-1, y:-2}]);
        break;
      case(3):
        turned = this.checkPivot(2, 0, 1, -1, 0, 0, -1, -1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: -1}, {x: 0, y:2}, {x:-1, y:2}]);
        break;
    }
    if (turned) {
      super.turnLeft();
    }
  }

  turnRight() {
    let turned = false;
    switch(this.orientation) {
      case(0):
        turned = this.checkPivot(2, 0, 1, -1, 0, 0, -1, -1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: 1}, {x: 0, y:-2}, {x:-1, y:-2}]);
        break;
      case(1):
        turned = this.checkPivot(0, -2, -1, -1, 0, 0, -1, 1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: -1}, {x: 0, y:2}, {x:1, y:2}]);
        break;
      case(2):
        turned = this.checkPivot(-2, 0, -1, 1, 0, 0, 1,  1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: 1}, {x: 0, y:-2}, {x:1, y:-2}]);
        break;
      case(3):
        turned = this.checkPivot(0, 2, 1, 1, 0, 0, 1, -1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: -1}, {x: 0, y:2}, {x:-1, y:2}]);
        break;
    }
    if (turned) {
      super.turnRight();
    }
  }
}

class SBlock extends BlockShape {
  blockType = 'SBlock';
  constructor(startX, startY, canvas, garbageBlocks) {
    super(startX, startY, garbageBlocks);
    this.blocks.push(new Block(canvas, startX + 20, startY, 20, 20, 'Lime'));
    this.blocks.push(new Block(canvas, startX, startY, 20, 20, 'Lime'));
    this.blocks.push(new Block(canvas, startX, startY + 20, 20, 20, 'Lime'));
    this.blocks.push(new Block(canvas, startX - 20, startY + 20, 20, 20, 'Lime'));
  }

  turnLeft() {
    let turned = false;
    switch(this.orientation) {
      case(0):
        turned = this.checkPivot(-2, 0, -1, -1, 0, 0, 1, -1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: 1}, {x: 0, y:-2}, {x:1, y:-2}]);
        break;
      case(1):
        turned = this.checkPivot(0, 2, -1, 1, 0, 0, -1, -1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: -1}, {x: 0, y:2}, {x:1, y:2}]);
        break;
      case(2):
        turned = this.checkPivot(2, 0, 1, 1, 0, 0, -1, 1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: 1}, {x: 0, y:-2}, {x:-1, y:-2}]);
        break;
      case(3):
        turned = this.checkPivot(0, -2, 1, -1, 0, 0, 1, 1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: -1}, {x: 0, y:2}, {x:-1, y:2}]);
        break;
    }
    if (turned) {
      super.turnLeft();
    }
  }

  turnRight() {
    let turned = false;
    switch(this.orientation) {
      case(0):
        turned = this.checkPivot(0, -2, 1, -1, 0, 0, 1, 1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: 1}, {x: 0, y:-2}, {x:-1, y:-2}]);
        break;
      case(1):
        turned = this.checkPivot(-2, 0, -1, -1, 0, 0, 1, -1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: -1}, {x: 0, y:2}, {x:1, y:2}]);
        break;
      case(2):
        turned = this.checkPivot(0, 2, -1, 1, 0, 0, -1,  -1,
          [{x: 0, y: 0}, {x: 1, y:0}, {x: 1, y: 1}, {x: 0, y:-2}, {x:1, y:-2}]);
        break;
      case(3):
        turned = this.checkPivot(2, 0, 1, 1, 0, 0, -1, 1,
          [{x: 0, y: 0}, {x: -1, y:0}, {x: -1, y: -1}, {x: 0, y:2}, {x:-1, y:2}]);
        break;
    }
    if (turned) {
      super.turnRight();
    }
  }
}

class GarbageBlocks {
  blocks: Block[];
  constructor(private core: CoreSystemService, blocks?: Block[]) {
    this.blocks = blocks || [];
  }
  addBlocks(blocks: Block[]) {
    this.blocks = this.blocks.concat(blocks);
    this.CheckAndClear();
  }
  checkIfEmpty(x, y) {
    let empty = true;
    this.blocks.every( block => {
      if (block.x === x && block.y === y) {
        empty = false;
        return false;
      }
      return true;
    });
    return empty;
  }
   async ClearLine(y) {
      this.blocks.forEach(block => {
        if (block.y === y) {
          block.clear();
        }
      });
      this.blocks = this.blocks.filter(block => {
        return block.y !== y;
      });
      await new Promise(resolve =>
        setTimeout(resolve, 500)
      );
      this.blocks.forEach(block => {
        if (block.y <= y) {
          block.clear();
        }
      });
      this.blocks.forEach(block => {
        if (block.y <= y) {
          block.move(0, 20);
          block.draw();
        }
      });
  }
    CheckAndClear() {
    this.blocks = this.blocks.sort( (a, b) => {
      return a.y > b.y ? 1: -1;
    });
    let maxBlocks = 11;
    let prevBlockY = 0;
    let foundLine = false;
    this.blocks.every(block => {
        if (prevBlockY !== block.y) {
          prevBlockY = block.y;
          maxBlocks = 10;
        }
        if (--maxBlocks === 0) {
          this.ClearLine(block.y).then();
          foundLine = true;
          this.core.clearedLine.next(1);
          return false;
        }
        return true;
    });
    if (foundLine) {
      this.CheckAndClear();
    } else {
      this.core.newPiece.next(true);
    }

  }
  draw() {
    this.blocks.forEach(block => {
      block.draw();
      }
    )
  }

}


