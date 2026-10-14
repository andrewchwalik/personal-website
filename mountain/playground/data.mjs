import { memories } from '../data.mjs?v=6';
export const route = 'M280 165 Q260 174 286 199 Q329 239 299 259 Q279 275 218 286 Q183 298 193 314 Q214 337 275 344 Q320 352 322 390 Q327 410 385 428 Q441 449 431 480 Q427 509 372 522 Q315 531 264 533 Q219 532 193 538 Q156 548 144 567 Q130 595 160 614 Q192 635 240 640 L287 647';
export const bridgeRoute = 'M372 522 Q350 535 363 545 Q397 562 434 571 Q497 602 600 646';
export const stops = memories.map((memory,index) => ({
  ...memory,
  id: ['president','startup','icecream','home','business'][index],
  label: ['Student president','Startup Bus','Ice cream shop','First home','Business owners'][index],
  point: [[280,165],[218,286],[322,390],[193,538],[240,640]][index]
}));
