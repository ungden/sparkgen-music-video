// Default theme ideas per genre — shown immediately, no API call needed
export const DEFAULT_MUSIC_IDEAS: Record<string, Array<{ icon: string; title: string; desc: string; color: string; iconColor: string }>> = {
  kids: [
    { icon: "rocket_launch", title: "Space Safari", desc: "Zoom past planets and meet silly aliens!", color: "bg-surface-container-low", iconColor: "text-primary" },
    { icon: "pets", title: "Dinosaur Dance", desc: "Stomp and roar with the friendly T-Rex!", color: "bg-secondary-container", iconColor: "text-secondary" },
    { icon: "water", title: "Ocean Splash", desc: "Dive deep with dolphins and singing fish!", color: "bg-tertiary-container", iconColor: "text-tertiary" },
    { icon: "forest", title: "Treehouse Party", desc: "Climb up high for a magical forest jam!", color: "bg-surface-container-highest", iconColor: "text-on-surface-variant" },
  ],
  pop: [
    { icon: "favorite", title: "Neon Hearts", desc: "A glowing love song under city lights", color: "bg-surface-container-low", iconColor: "text-primary" },
    { icon: "stars", title: "Midnight Drive", desc: "Windows down, music up, feeling free", color: "bg-secondary-container", iconColor: "text-secondary" },
    { icon: "sunny", title: "Golden Hour", desc: "Chasing sunsets and summer vibes", color: "bg-tertiary-container", iconColor: "text-tertiary" },
    { icon: "celebration", title: "Weekend Glow", desc: "Dance floors and unforgettable nights", color: "bg-surface-container-highest", iconColor: "text-on-surface-variant" },
  ],
  rock: [
    { icon: "electric_bolt", title: "Thunder Road", desc: "Guitars blazing down the highway", color: "bg-surface-container-low", iconColor: "text-primary" },
    { icon: "local_fire_department", title: "Rebel Heart", desc: "Breaking free from the ordinary", color: "bg-secondary-container", iconColor: "text-secondary" },
    { icon: "stadium", title: "Arena Anthem", desc: "A song that shakes the stadium", color: "bg-tertiary-container", iconColor: "text-tertiary" },
    { icon: "nights_stay", title: "Midnight Storm", desc: "Raw power meets raw emotion", color: "bg-surface-container-highest", iconColor: "text-on-surface-variant" },
  ],
  "hip-hop": [
    { icon: "mic", title: "Street Poet", desc: "Real stories from the block", color: "bg-surface-container-low", iconColor: "text-primary" },
    { icon: "diamond", title: "Crown Heavy", desc: "Rising up against all odds", color: "bg-secondary-container", iconColor: "text-secondary" },
    { icon: "nightlife", title: "After Hours", desc: "Late night vibes and smooth flow", color: "bg-tertiary-container", iconColor: "text-tertiary" },
    { icon: "speed", title: "Fast Lane", desc: "Moving quick, no looking back", color: "bg-surface-container-highest", iconColor: "text-on-surface-variant" },
  ],
  electronic: [
    { icon: "equalizer", title: "Neon Pulse", desc: "Synths and drops in a digital world", color: "bg-surface-container-low", iconColor: "text-primary" },
    { icon: "blur_on", title: "Deep Space", desc: "Floating through cosmic frequencies", color: "bg-secondary-container", iconColor: "text-secondary" },
    { icon: "waves", title: "Wave Runner", desc: "Ride the bass into the night", color: "bg-tertiary-container", iconColor: "text-tertiary" },
    { icon: "flash_on", title: "Circuit Break", desc: "High energy overload on the floor", color: "bg-surface-container-highest", iconColor: "text-on-surface-variant" },
  ],
};

// Fallback for genres without specific defaults
const GENERIC_IDEAS = [
  { icon: "music_note", title: "New Song", desc: "A fresh melody waiting to be born", color: "bg-surface-container-low", iconColor: "text-primary" },
  { icon: "favorite", title: "Heart & Soul", desc: "Pour your emotions into music", color: "bg-secondary-container", iconColor: "text-secondary" },
  { icon: "auto_awesome", title: "Magic Moment", desc: "Capture something special in a song", color: "bg-tertiary-container", iconColor: "text-tertiary" },
  { icon: "lightbulb", title: "Bright Idea", desc: "Turn inspiration into sound", color: "bg-surface-container-highest", iconColor: "text-on-surface-variant" },
];

export function getDefaultIdeas(genre: string) {
  return DEFAULT_MUSIC_IDEAS[genre] || GENERIC_IDEAS;
}

// Default story ideas for film styles
export const DEFAULT_FILM_IDEAS: Record<string, Array<{ icon: string; title: string; desc: string; color: string; iconColor: string }>> = {
  adventure: [
    { icon: "explore", title: "Lost Temple", desc: "A brave explorer discovers a hidden ancient city", color: "bg-surface-container-low", iconColor: "text-primary" },
    { icon: "sailing", title: "Sky Pirates", desc: "Airship bandits find a map to treasure", color: "bg-secondary-container", iconColor: "text-secondary" },
    { icon: "landscape", title: "Mountain Quest", desc: "Climbing to the peak where legends begin", color: "bg-tertiary-container", iconColor: "text-tertiary" },
    { icon: "pets", title: "Dragon Rider", desc: "A young hero befriends the last dragon", color: "bg-surface-container-highest", iconColor: "text-on-surface-variant" },
  ],
  "fairy-tale": [
    { icon: "auto_awesome", title: "Wish Flower", desc: "A magical flower grants three wishes", color: "bg-surface-container-low", iconColor: "text-primary" },
    { icon: "castle", title: "Enchanted Door", desc: "A door appears that leads to a magical world", color: "bg-secondary-container", iconColor: "text-secondary" },
    { icon: "stars", title: "Star Weaver", desc: "A girl who knits constellations into the sky", color: "bg-tertiary-container", iconColor: "text-tertiary" },
    { icon: "forest", title: "Talking Forest", desc: "Trees that whisper secrets to the kind", color: "bg-surface-container-highest", iconColor: "text-on-surface-variant" },
  ],
  "sci-fi": [
    { icon: "rocket_launch", title: "Last Signal", desc: "A lone astronaut receives a mysterious message", color: "bg-surface-container-low", iconColor: "text-primary" },
    { icon: "smart_toy", title: "AI Awakens", desc: "A robot begins to dream for the first time", color: "bg-secondary-container", iconColor: "text-secondary" },
    { icon: "public", title: "New Earth", desc: "Humanity's first day on an alien planet", color: "bg-tertiary-container", iconColor: "text-tertiary" },
    { icon: "memory", title: "Memory Loop", desc: "Reliving the same moment to change fate", color: "bg-surface-container-highest", iconColor: "text-on-surface-variant" },
  ],
  comedy: [
    { icon: "sentiment_very_satisfied", title: "Wrong Day", desc: "Everything that can go wrong does — hilariously", color: "bg-surface-container-low", iconColor: "text-primary" },
    { icon: "pets", title: "Cat Boss", desc: "A cat accidentally becomes CEO of a company", color: "bg-secondary-container", iconColor: "text-secondary" },
    { icon: "restaurant", title: "Chef Disaster", desc: "A terrible cook enters a cooking contest", color: "bg-tertiary-container", iconColor: "text-tertiary" },
    { icon: "school", title: "Substitute Hero", desc: "The world's worst substitute teacher saves the day", color: "bg-surface-container-highest", iconColor: "text-on-surface-variant" },
  ],
};

const GENERIC_FILM_IDEAS = [
  { icon: "movie", title: "Untold Story", desc: "A story waiting to be discovered", color: "bg-surface-container-low", iconColor: "text-primary" },
  { icon: "explore", title: "New Journey", desc: "An adventure beyond imagination", color: "bg-secondary-container", iconColor: "text-secondary" },
  { icon: "auto_awesome", title: "Magic Within", desc: "Finding something extraordinary in the ordinary", color: "bg-tertiary-container", iconColor: "text-tertiary" },
  { icon: "lightbulb", title: "What If", desc: "A question that changes everything", color: "bg-surface-container-highest", iconColor: "text-on-surface-variant" },
];

export function getDefaultFilmIdeas(style: string) {
  return DEFAULT_FILM_IDEAS[style] || GENERIC_FILM_IDEAS;
}
