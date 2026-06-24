const { processData } = require("./processor");
const out = processData([
  "A->B","A->C","B->D","C->E","E->F",
  "X->Y","Y->Z","Z->X",
  "P->Q","Q->R",
  "G->H","G->H","G->I",
  "hello","1->2","A->"
]);
console.log(JSON.stringify(out, null, 1));
