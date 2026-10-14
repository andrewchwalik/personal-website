import { memories } from '../data.mjs?v=7';
// One flat, closed park circuit, traced in the shared 600 x 930 map space.
export const route = 'M287 58 C340 55 342 111 405 104 C483 87 529 146 530 212 C529 263 563 294 557 345 C553 397 510 415 524 469 C531 504 527 525 521 545 C507 588 488 610 503 653 C520 694 492 717 470 735 C441 768 397 765 365 789 C319 826 278 818 243 794 C194 763 129 763 102 718 C82 696 85 682 94 666 C117 622 79 591 65 558 C51 541 55 529 62 515 C82 473 110 444 83 410 C60 383 36 357 43 327 C48 283 102 270 112 236 C124 211 99 193 96 168 C88 124 159 95 191 77 C221 62 250 57 287 58 Z';
export const bridgeJunction = [521,545];
export const bridgeMarker = [565,505];
export const bridgeRoute = 'M521 545 Q549 512 600 460';
export const stops = [...memories.map((memory,index) => ({
  ...memory,
  id: ['president','startup','icecream','home','business'][index],
  label: ['Student president','Startup Bus','Ice cream shop','First home','Business owners'][index],
  feature: ['Flag-topped playfort','Bus climbing toy','Ice cream play kiosk','Little playhouse','Pretend market'][index],
  point: [[96,168],[530,212],[62,515],[524,469],[470,735]][index],
  flip: [false,true,false,true,true][index]
})), {
  id:'soccer', label:'College Soccer Player', title:'College Soccer Player',
  text:'Playing college soccer is part of my story, and part of the love for the game I carry into the climb.',
  feature:'Mini soccer play area', point:[43,327]
}, {
  id:'family', label:'Start a Family', title:'Start a Family',
  text:'Building a life with my wife and our kiddo. Growing together, making memories, and finding adventure in everyday life.',
  feature:'Parent and baby swings', point:[557,345], flip:true
}, {
  id:'roadtrip', label:'USA Roadtrip', title:'USA Roadtrip',
  text:'An adventure on the open road, exploring the USA and enjoying the journey along the way.',
  feature:'Camper play vehicle with slide', point:[94,666]
}];
