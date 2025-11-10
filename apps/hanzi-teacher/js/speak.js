// 语音配置常量
const SPEECH_CONFIG = {
    RATE: 1.2,
    LANG: 'zh-CN',
    TIMEOUT_BASE: 5000,
    TIMEOUT_PER_CHAR: 500
};

export function speakAsync(text) {
    return new Promise(resolve => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = SPEECH_CONFIG.LANG;
        utterance.rate = SPEECH_CONFIG.RATE;
        const timeout = setTimeout(
            resolve,
            Math.max(SPEECH_CONFIG.TIMEOUT_BASE, text.length * SPEECH_CONFIG.TIMEOUT_PER_CHAR)
        );
        utterance.onend = () => { clearTimeout(timeout); resolve(); };
        utterance.onerror = () => { clearTimeout(timeout); resolve(); };
        speechSynthesis.speak(utterance);
    });
}
