import {Block} from "./block.object";
import {GarbageBlocks} from "./garbageBlocks.object";
import {userDirection} from "../shared/models/direction.model";
import {CoreSystemService} from "../shared/core-system.service";
export class Tetrimino {
  hangTimeTicks = 200;
  clockSub;
  core: CoreSystemService;
  hanging = false;
  timesHung;
  ticks = 0;
  blockType;
  blocks: Block[] = [];
  x;
  y;
  orientation = 0;
  garbageBlocks: GarbageBlocks;
  constructor(startX, startY, garbageBlocks, core) {
    this.x = startX;
    this.y = startY;
    this.garbageBlocks = garbageBlocks;
    this.core = core;
    this.timesHung = 0;
    this.clockSub = this.core.clockTick.subscribe( paused => {
      if (!paused && this.hanging) {
        let stillHanging = this.blocks.every( block => {
          return this.garbageBlocks.checkIfEmpty(block.x, block.y + 20);
        })
        if (stillHanging) {
          if (this.ticks++ >= this.hangTimeTicks) {
            this.hardDrop();
          }
        } else {
          if (++this.timesHung < 5) {
            this.hanging = false;
            this.ticks = 0;
          } else {
            this.hardDrop();
          }
        }
      }
    });
  }

  public static createPiece(type, startX, startY, canvas, garbageBlocks, core) {
    switch (type) {
      case ('IBlock'): return new IBlock(startX, startY, canvas, garbageBlocks, core);
      case ('TBlock'): return new TBlock(startX, startY, canvas, garbageBlocks, core);
      case ('OBlock'): return new OBlock(startX, startY, canvas, garbageBlocks, core);
      case ('LBlock'): return new LBlock(startX, startY, canvas, garbageBlocks, core);
      case ('JBlock'): return new JBlock(startX, startY, canvas, garbageBlocks, core);
      case ('SBlock'): return new SBlock(startX, startY, canvas, garbageBlocks, core);
      case ('ZBlock'): return new ZBlock(startX, startY, canvas, garbageBlocks, core);
    }
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
    while(this.move(userDirection.Down, true)) {
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

  moveToGarbage() {
    this.garbageBlocks.addBlocks(this.blocks);
    this.clockSub.unsubscribe();
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
  move(dir: userDirection, bypass?): boolean {
    let killPiece = false;
    let dontMove = false;

    this.blocks.every( block => {
      switch (dir) {
        case (userDirection.Down):
          if (!this.garbageBlocks.checkIfEmpty(block.x, block.y + 20)) {
            if(bypass) {
              killPiece = true;
            } else {
              this.hanging = true;
              dontMove = true;
            }
            return false;
          }
          if (block.y >= 380) {
            if(bypass) {
              killPiece = true;
            } else {
              this.hanging = true;
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
      this.moveToGarbage();
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


class IBlock extends Tetrimino {
  blockType = 'IBlock';
  constructor(startX, startY, canvas, garbageBlocks, core) {
    super(startX, startY, garbageBlocks, core);
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
class TBlock extends Tetrimino {
  blockType = 'TBlock';
  constructor(startX, startY, canvas, garbageBlocks, core) {
    super(startX, startY, garbageBlocks, core);
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
class OBlock extends Tetrimino {
  blockType = 'OBlock';
  constructor(startX, startY, canvas, garbageBlocks, core) {
    super(startX, startY, garbageBlocks, core);
    this.blocks.push(new Block(canvas, startX, startY, 20, 20, 'Yellow'));
    this.blocks.push(new Block(canvas, startX + 20, startY, 20, 20, 'Yellow'));
    this.blocks.push(new Block(canvas, startX, startY + 20, 20, 20, 'Yellow'));
    this.blocks.push(new Block(canvas, startX + 20, startY + 20, 20, 20, 'Yellow'));
  }
}
class LBlock extends Tetrimino {
  blockType = 'LBlock';
  constructor(startX, startY, canvas, garbageBlocks, core) {
    super(startX, startY, garbageBlocks, core);
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
class JBlock extends Tetrimino {
  blockType = 'JBlock';
  constructor(startX, startY, canvas, garbageBlocks, core) {
    super(startX, startY, garbageBlocks, core);
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
class ZBlock extends Tetrimino {
  blockType = 'ZBlock';
  constructor(startX, startY, canvas, garbageBlocks, core) {
    super(startX, startY, garbageBlocks, core);
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
class SBlock extends Tetrimino {
  blockType = 'SBlock';

  constructor(startX, startY, canvas, garbageBlocks, core) {
    super(startX, startY, garbageBlocks, core);
    this.blocks.push(new Block(canvas, startX + 20, startY, 20, 20, 'Lime'));
    this.blocks.push(new Block(canvas, startX, startY, 20, 20, 'Lime'));
    this.blocks.push(new Block(canvas, startX, startY + 20, 20, 20, 'Lime'));
    this.blocks.push(new Block(canvas, startX - 20, startY + 20, 20, 20, 'Lime'));
  }

  turnLeft() {
    let turned = false;
    switch (this.orientation) {
      case(0):
        turned = this.checkPivot(-2, 0, -1, -1, 0, 0, 1, -1,
          [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: -2}, {x: 1, y: -2}]);
        break;
      case(1):
        turned = this.checkPivot(0, 2, -1, 1, 0, 0, -1, -1,
          [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: 0, y: 2}, {x: 1, y: 2}]);
        break;
      case(2):
        turned = this.checkPivot(2, 0, 1, 1, 0, 0, -1, 1,
          [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 0, y: -2}, {x: -1, y: -2}]);
        break;
      case(3):
        turned = this.checkPivot(0, -2, 1, -1, 0, 0, 1, 1,
          [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 0, y: 2}, {x: -1, y: 2}]);
        break;
    }
    if (turned) {
      super.turnLeft();
    }
  }

  turnRight() {
    let turned = false;
    switch (this.orientation) {
      case(0):
        turned = this.checkPivot(0, -2, 1, -1, 0, 0, 1, 1,
          [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: 1}, {x: 0, y: -2}, {x: -1, y: -2}]);
        break;
      case(1):
        turned = this.checkPivot(-2, 0, -1, -1, 0, 0, 1, -1,
          [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: -1}, {x: 0, y: 2}, {x: 1, y: 2}]);
        break;
      case(2):
        turned = this.checkPivot(0, 2, -1, 1, 0, 0, -1, -1,
          [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: -2}, {x: 1, y: -2}]);
        break;
      case(3):
        turned = this.checkPivot(2, 0, 1, 1, 0, 0, -1, 1,
          [{x: 0, y: 0}, {x: -1, y: 0}, {x: -1, y: -1}, {x: 0, y: 2}, {x: -1, y: 2}]);
        break;
    }
    if (turned) {
      super.turnRight();
    }
  }
}
