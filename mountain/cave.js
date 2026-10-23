import { theatreVideos } from '../theatre-videos.mjs?v=2';

const dialog=document.getElementById('cave-cinema');
const screen=document.getElementById('cave-screen');
const films=document.getElementById('cave-films');
const status=document.getElementById('cave-status');
const youtube=document.getElementById('cave-youtube');
const channelUrl='https://www.youtube.com/@AndrewChwalik';
const welcome=screen.firstElementChild.cloneNode(true);
let savedScroll=0;

function playFilm(video){
  const iframe=document.createElement('iframe');
  // Muted inline playback avoids mobile browsers blocking autoplay with sound.
  iframe.src=`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&mute=1&playsinline=1&rel=0`;
  iframe.title=video.title;
  iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen=true;
  iframe.referrerPolicy='strict-origin-when-cross-origin';
  screen.replaceChildren(iframe);
  youtube.href=`https://www.youtube.com/watch?v=${video.id}`;
  status.textContent=`Now showing: ${video.title}.`;
  films.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.video===video.id)));
  screen.scrollIntoView({block:'nearest',behavior:'instant'});
}
for(const [index,video] of theatreVideos.entries()){
  if(!/^[\w-]{11}$/.test(video.id))continue;
  const button=document.createElement('button');button.type='button';button.dataset.video=video.id;
  button.setAttribute('aria-pressed','false');
  const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');
  const title=document.createElement('span');title.textContent=video.title;
  button.append(number,title);button.addEventListener('click',()=>playFilm(video));films.append(button);
}
document.addEventListener('enter-cave',()=>{
  if(dialog.open)return;
  savedScroll=scrollY;dialog.showModal();dialog.scrollTop=0;
  document.getElementById('player').classList.add('inside-cave');
});
document.getElementById('leave-cave').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{
  // Escape and the exit button both stop playback and leave the player at the doorway.
  screen.replaceChildren(welcome.cloneNode(true));youtube.href=channelUrl;
  status.textContent='A few of my favorite adventures. Pick a film and settle in.';
  films.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed','false'));
  document.getElementById('player').classList.remove('inside-cave');
  scrollTo({top:savedScroll,behavior:'instant'});
  document.querySelector('.stop[data-id="cave"]').focus({preventScroll:true});
});
