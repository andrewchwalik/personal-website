import { memories } from '../data.mjs?v=6';
// One flat, closed park circuit, traced in the shared 600 x 930 map space.
export const route = 'M300 53 C445 50 530 170 546 350 C558 430 551 485 519 539 C500 650 460 746 370 789 C300 825 230 809 190 778 C100 720 42 640 44 485 C42 300 80 163 175 92 C215 64 260 51 300 53 Z';
export const bridgeJunction = [519,539];
export const bridgeMarker = [570,552];
export const bridgeRoute = 'M519 539 Q559 546 600 566';
export const stops = memories.map((memory,index) => ({
  ...memory,
  id: ['president','startup','icecream','home','business'][index],
  label: ['Student president','Startup Bus','Ice cream shop','First home','Business owners'][index],
  point: [[300,53],[550,420],[83,674],[490,653],[300,809]][index]
}));
