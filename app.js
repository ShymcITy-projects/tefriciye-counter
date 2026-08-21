// 1. Register Offline Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}

// 2. Element References
const countDisplay = document.getElementById('count');
const tapBtn = document.getElementById('tapBtn');
const resetBtn = document.getElementById('resetBtn');

const prayerText = document.getElementById('prayer-text');
const fontSmallerBtn = document.getElementById('fontSmaller');
const fontLargerBtn = document.getElementById('fontLarger');

// 3. Load Saved Counter & Date
let today = new Date().toDateString();
let savedDate = localStorage.getItem('prayerDate');
let count = parseInt(localStorage.getItem('prayerCount')) || 0;

if (savedDate !== today) {
  count = 0;
  localStorage.setItem('prayerDate', today);
}
countDisplay.innerText = count;

// 4. Load & Apply Saved Font Size (Default: 18px)
let currentFontSize = parseInt(localStorage.getItem('prayerFontSize')) || 18;
prayerText.style.fontSize = currentFontSize + 'px';

function updateFontSize(newSize) {
  // Enforce minimum (12px) and maximum (32px) limits
  if (newSize >= 12 && newSize <= 32) {
    currentFontSize = newSize;
    prayerText.style.fontSize = currentFontSize + 'px';
    localStorage.setItem('prayerFontSize', currentFontSize);
  }
}

fontSmallerBtn.addEventListener('click', () => updateFontSize(currentFontSize - 2));
fontLargerBtn.addEventListener('click', () => updateFontSize(currentFontSize + 2));

// 5. Counter Actions
tapBtn.addEventListener('click', () => {
  count++;
  countDisplay.innerText = count;
  localStorage.setItem('prayerCount', count);
  localStorage.setItem('prayerDate', today); 
  
  // Optional: Gentle vibration feedback if device supports it
  if (navigator.vibrate) {
    navigator.vibrate(40); 
  }
});

resetBtn.addEventListener('click', () => {
  if (confirm("Reset today's count to zero?")) {
    count = 0;
    countDisplay.innerText = count;
    localStorage.setItem('prayerCount', count);
  }
});
