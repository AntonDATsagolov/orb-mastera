// Набор фигур и bag-генератор
const shapes = [
  [[1,1,1]],            // I (len3)
  [[1,1],[1,1]],        // O
  [[1,1,1],[0,1,0]],    // T
  [[1,1,0],[0,1,1]],    // S
  [[0,1,1],[1,1,0]],    // Z
  [[1,0,0],[1,1,1]],    // L
  [[0,0,1],[1,1,1]],    // J
  [[1]]                 // single
];

function randShapeByIndex(i){
  const s = shapes[i];
  const h = s.length, w = s[0].length;
  return { shape: s.map(r=>r.slice()), w, h, key: i };
}

// bag (Fisher-Yates shuffle)
function createBag() {
  const bag = [];
  for(let i=0;i<shapes.length;i++) bag.push(i);
  for(let i=bag.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export default {
  shapes,
  randShapeByIndex,
  createBag
};