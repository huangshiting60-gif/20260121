let drops = [];
let fontSize = 14;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 計算螢幕寬度可以容納幾行文字
  let columns = width / fontSize;
  
  // 初始化每一行的落下位置 (y座標)
  for (let i = 0; i < columns; i++) {
    drops[i] = 1;
  }
  
  textSize(fontSize);
}

function draw() {
  // 繪製半透明黑色背景，形成殘影效果
  background(0, 20);
  
  fill(0, 255, 70); // 駭客任務綠
  
  // 遍歷每一行
  for (let i = 0; i < drops.length; i++) {
    // 隨機產生一個字元 (使用 Katakana 片假名區段看起來更有感覺)
    let charCode = 0x30A0 + round(random(0, 96));
    let txt = String.fromCharCode(charCode);
    
    // 繪製文字
    text(txt, i * fontSize, drops[i] * fontSize);
    
    // 當文字超出螢幕底部，隨機重置回頂部
    if (drops[i] * fontSize > height && random() > 0.975) {
      drops[i] = 0;
    }
    
    // 讓文字往下移動
    drops[i]++;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 視窗改變大小時重新計算欄位
  let columns = width / fontSize;
  drops = [];
  for (let i = 0; i < columns; i++) {
    drops[i] = 1;
  }
}
