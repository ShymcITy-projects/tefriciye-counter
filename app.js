// 1. Register the offline Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}

// 2. Connect to the HTML buttons
const countDisplay = document.getElementById('count');
const tapBtn = document.getElementById('tapBtn');
const resetBtn = document.getElementById('resetBtn');

// 3. Load saved data from the phone's memory
let today = new Date().toDateString();
let savedDate = localStorage.getItem('prayerDate');
let count = parseInt(localStorage.getItem('prayerCount')) || 0;

// If it's a brand new day, reset the count to zero
if (savedDate !== today) {
  count = 0;
  localStorage.setItem('prayerDate', today);
}
countDisplay.innerText = count;

// 4. Increase count when tapped
tapBtn.addEventListener('click', () => {
  count++;
  countDisplay.innerText = count;
  localStorage.setItem('prayerCount', count);
  localStorage.setItem('prayerDate', today); 
});

// 5. Allow manual resets
resetBtn.addEventListener('click', () => {
  if (confirm("Reset today's count to zero?")) {
    count = 0;
    countDisplay.innerText = count;
    localStorage.setItem('prayerCount', count);
  }
});