export function speakAsync(text) {
    return new Promise(resolve => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 1.2;
        const timeout = setTimeout(resolve, Math.max(5000, text.length * 500));
        utterance.onend = () => { clearTimeout(timeout); resolve(); };
        utterance.onerror = () => { clearTimeout(timeout); resolve(); };
        speechSynthesis.speak(utterance);
    });
}
