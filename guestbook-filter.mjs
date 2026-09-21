// Shared by the browser and Worker; never rely on browser validation alone.
export function contentError(value) {
  const text = String(value).normalize('NFKC').replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '').toLowerCase();
  const links = text.replace(/\s*(?:\[dot\]|\(dot\)|\bdot\b)\s*/g, '.');
  if (/(?:https?\s*:|hxxps?\s*:|www\s*\.|:\/\/)/i.test(links)
      || /[\p{L}\p{N}][\p{L}\p{N}-]*\.[\p{L}]{2,63}(?:\b|\/)/u.test(links)
      || /\b\d{1,3}(?:\.\d{1,3}){3}\b/.test(links)
      || /\b[\w-]+\s*\.\s*(?:com|org|net|io|co|me|app|dev|xyz)\b/.test(links)) {
    return 'Please remove links from your name and message.';
  }
  const normalized = text.normalize('NFKD').replace(/\p{M}/gu, '').replace(/(?<=[a-z])!(?=[a-z])/g, 'i').replace(/[013457@$]/g, char => ({ '0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s' })[char]);
  const words = ['fuck','fucking','fucker','fuckers','fucked','motherfucker','motherfuckers','shit','shitty','bullshit','shitting','shithead','bitch','bitches','bitching','bastard','bastards','asshole','assholes','ass','arse','arsehole','cunt','cunts','dick','dicks','dickhead','cock','cocks','pussy','pussies','piss','pissed','pissing','damn','dammit','goddamn','whore','whores','slut','sluts','faggot','faggots','nigger','niggers','nigga'];
  // Word boundaries avoid matching innocent words such as "class" or "Scunthorpe".
  const pattern = words.map(word => [...word].map(char => `${char}+`).join('[\\s._*\\-]*')).join('|');
  if (new RegExp(`(?:^|[^a-z])(?:${pattern}|f[*]+ck|sh[*]+t|b[*]+tch|c[*]+nt)(?=$|[^a-z])`, 'i').test(normalized)) {
    return 'Please keep your name and message free of profanity.';
  }
  return null;
}
