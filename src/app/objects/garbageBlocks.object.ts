import {CoreSystemService} from "../shared/core-system.service";
import {Block} from "./block.object";

export class GarbageBlocks {
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
    this.blocks.every(block => {
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
    this.blocks = this.blocks.sort((a, b) => {
      return a.y > b.y ? 1 : -1;
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
