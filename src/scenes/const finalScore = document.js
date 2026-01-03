const finalScore = document.getElementById('finalScore');
if (finalScore) {
    finalScore.textContent = `Очки: ${score}`;
} else {
    console.warn('finalScore element not found, score:', score);
}