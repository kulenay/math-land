#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成小程序音效素材（WAV 16-bit mono 22050Hz）。

用法：python3 tools/gen_sounds.py
输出：assets/sounds/*.wav

设计原则：柔和、明亮、无刺耳感（面向儿童）。
- correct / star / win：上行琶音，奖励感
- wrong：柔和下行音，音量偏低，不带挫败感
- click / pop：短促 UI 音
"""
import math
import os
import struct
import wave

RATE = 22050
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'sounds')

NOTE = {  # 频率表（Hz）
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'G5': 783.99,
    'A5': 880.00, 'C6': 1046.50,
}


def synth(duration, fn):
    """合成一段音频，fn(t) 返回 [-1,1] 采样，t 为秒。带首尾 10ms 淡入淡出防爆音。"""
    n = int(RATE * duration)
    fade = int(RATE * 0.01)
    out = []
    for i in range(n):
        t = i / RATE
        env = 1.0
        if i < fade:
            env = i / fade
        elif i > n - fade:
            env = max(0.0, (n - i) / fade)
        out.append(max(-1.0, min(1.0, fn(t) * env)))
    return out


def tone(freq, duration, vol=0.5, decay=3.0):
    """单个音：正弦 + 二次谐波，指数衰减包络。"""
    return synth(duration, lambda t: vol * math.exp(-decay * t) * (
        math.sin(2 * math.pi * freq * t) + 0.3 * math.sin(4 * math.pi * freq * t)))


def arpeggio(notes, note_dur, gap=0.02, vol=0.45, decay=5.0):
    """一串音，音与音之间留 gap 秒空隙。"""
    segs = []
    for f in notes:
        segs.append(tone(f, note_dur, vol, decay))
        segs.append([0.0] * int(RATE * gap))
    return [s for seg in segs for s in seg]


def write_wav(name, samples):
    path = os.path.join(OUT_DIR, name)
    os.makedirs(OUT_DIR, exist_ok=True)
    with wave.open(path, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b''.join(struct.pack('<h', int(s * 32767)) for s in samples))
    print(f'  {name}  {os.path.getsize(path)} bytes')


def main():
    print('生成音效 ->', OUT_DIR)
    # UI 点击：800Hz 短促
    write_wav('click.wav', tone(800, 0.08, vol=0.35, decay=12.0))
    # 物品弹出：上行滑音
    write_wav('pop.wav', synth(0.14, lambda t: 0.4 * math.exp(-8 * t) * math.sin(
        2 * math.pi * (500 + 2800 * t) * t)))
    # 答对：C5-E5-G5
    write_wav('correct.wav', arpeggio([NOTE['C5'], NOTE['E5'], NOTE['G5']], 0.13))
    # 答错：柔和下行双音（低声量，不刺耳）
    write_wav('wrong.wav', arpeggio([400, 310], 0.18, gap=0.06, vol=0.28, decay=4.0))
    # 得星：G5-C6
    write_wav('star.wav', arpeggio([NOTE['G5'], NOTE['C6']], 0.14, vol=0.45))
    # 过关：C5-E5-G5-C6
    write_wav('win.wav', arpeggio([NOTE['C5'], NOTE['E5'], NOTE['G5'], NOTE['C6']],
                                  0.16, gap=0.03, vol=0.45, decay=4.0))
    print('完成。')


if __name__ == '__main__':
    main()
