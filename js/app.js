import { strokeMap, principleData, compressedStrokeData } from './data.js';
import { speakAsync } from './speak.js';

const statusDiv = document.getElementById('status');
const micButton = document.getElementById('mic-button');
const charCountSpan = document.getElementById('char-count');
const manualInput = document.getElementById('manual-input');
let writer = null;
let isLearning = false;
const strokeCache = new Map();

function animateStrokeAsync(writerInstance, strokeNum) {
    return new Promise(resolve => writerInstance.animateStroke(strokeNum, { onComplete: resolve }));
}

function getStrokeNames(char) {
    if (strokeCache.has(char)) return strokeCache.get(char);
    const compressedStrokes = compressedStrokeData[char];
    let strokeNames = null;
    if (compressedStrokes) {
        if (Array.isArray(compressedStrokes)) {
            strokeNames = compressedStrokes;
        } else if (typeof compressedStrokes === 'string') {
            strokeNames = [];
            let i = 0;
            while (i < compressedStrokes.length) {
                let found = false;
                for (let len = 4; len >= 1; len--) {
                    if (i + len <= compressedStrokes.length) {
                        const part = compressedStrokes.substring(i, i + len);
                        const name = strokeMap[part];
                        if (name) {
                            strokeNames.push(name);
                            i += len;
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) i++;
            }
        }
    }
    strokeCache.set(char, strokeNames);
    return strokeNames;
}

async function learnChar(char) {
    if (isLearning) return;
    isLearning = true;
    micButton.disabled = true;
    if (manualInput) manualInput.disabled = true;
    document.getElementById('writer-target').innerHTML = '';
    statusDiv.textContent = `正在加载“${char}”字...`;

    try {
        const strokeNames = getStrokeNames(char);
        const principle = principleData[char];
        await HanziWriter.loadCharacterData(char);
        writer = HanziWriter.create('writer-target', char, {
            width: 300,
            height: 300,
            padding: 25,
            showCharacter: false,
            showOutline: true,
            strokeAnimationSpeed: 1.5,
        });

        await speakAsync(`好的，我们来学习“${char}”字。`);
        if (principle) {
            statusDiv.textContent = `教学原则: ${principle.rule}`;
            await speakAsync(principle.explanation);
        }

        if (strokeNames && strokeNames.length > 0) {
            for (let i = 0; i < strokeNames.length; i++) {
                const strokeName = strokeNames[i];
                const message = `第 ${i + 1} 笔: ${strokeName}`;
                statusDiv.textContent = message;
                await speakAsync(message);
                await animateStrokeAsync(writer, i);
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        } else {
            statusDiv.textContent = '暂未收录该字的笔顺信息，先看动画吧！';
            await speakAsync('抱歉，暂时没有这个字的笔顺信息，先看动画吧！');
            await writer.animateCharacter();
        }
        await speakAsync('写完啦！');
        statusDiv.textContent = `“${char}”字写完啦！`;
        writer.showCharacter();
    } catch (err) {
        console.error('学习流程出错:', err);
        statusDiv.textContent = `加载“${char}”字时出错。`;
    } finally {
        isLearning = false;
        micButton.disabled = false;
        if (manualInput) manualInput.disabled = false;
    }
}

function getCharFromTranscript(transcript) {
    let match;
    match = transcript.match(/(.+)的(.)$/);
    if (match && match[1] && match[2]) {
        const contextWord = match[1];
        const targetChar = match[2];
        return contextWord.includes(targetChar) ? targetChar : contextWord.slice(-1);
    }
    match = transcript.match(/(.)字怎么写/);
    if (match && match[1]) return match[1];
    match = transcript.match(/^(.)字$/);
    if (match && match[1]) return match[1];
    match = transcript.match(/^(.)$/);
    if (match && match[1]) return match[1];
    return transcript.slice(-1);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    micButton.addEventListener('click', () => { if (!isLearning) recognition.start(); });
    recognition.onstart = () => { micButton.classList.add('listening'); statusDiv.textContent = '请说...'; };
    recognition.onend = () => micButton.classList.remove('listening');
    recognition.onerror = e => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            statusDiv.textContent = '无法使用麦克风，可手动输入';
            micButton.style.display = 'none';
            if (manualInput) {
                manualInput.style.display = 'block';
            }
        } else {
            statusDiv.textContent = '语音识别出错';
        }
    };
    recognition.onresult = e => {
        const transcript = e.results[0][0].transcript.trim().replace(/[。，]/g, '');
        const char = getCharFromTranscript(transcript);
        if (char) {
            learnChar(char);
        } else {
            statusDiv.textContent = '没听清，请重试';
            speakAsync('没听清，请再说一次。');
        }
    };
} else {
    statusDiv.textContent = '浏览器不支持语音识别，可手动输入';
    micButton.style.display = 'none';
    if (manualInput) {
        manualInput.style.display = 'block';
        manualInput.addEventListener('change', () => {
            const value = manualInput.value.trim();
            if (value) learnChar(value[value.length - 1]);
        });
    }
}

window.onload = function () {
    if (typeof compressedStrokeData !== 'undefined' && Object.keys(compressedStrokeData).length > 0) {
        charCountSpan.textContent = Object.keys(compressedStrokeData).length.toLocaleString();
        statusDiv.textContent = '字典加载完毕，请提问！';
        micButton.disabled = false;
        if (manualInput) manualInput.disabled = false;
    } else {
        statusDiv.textContent = '字典数据未加载，请检查代码。';
        micButton.disabled = true;
        if (manualInput) manualInput.disabled = true;
    }
};
