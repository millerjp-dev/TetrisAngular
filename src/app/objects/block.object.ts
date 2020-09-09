export class Block {
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
