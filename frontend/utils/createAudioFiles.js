// This script creates basic audio files for the alarm system
// Run this with Node.js to generate the audio files

const fs = require('fs');
const path = require('path');

// Create a simple WAV file with a tone
function createWavFile(frequency, duration, filename) {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = sampleRate * duration;
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const fileSize = 44 + dataSize;
  
  const buffer = Buffer.alloc(fileSize);
  let offset = 0;
  
  // WAV header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // PCM format size
  buffer.writeUInt16LE(1, offset); offset += 2; // PCM format
  buffer.writeUInt16LE(numChannels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), offset); offset += 4;
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;
  
  // Generate tone data
  for (let i = 0; i < numSamples; i++) {
    const time = i / sampleRate;
    let sample = 0;
    
    if (filename.includes('ringtone')) {
      // Phone ringtone: dual tone with pauses
      const cycle = time % 2.5; // 2.5 second cycle
      if (cycle < 0.4) {
        sample = Math.sin(2 * Math.PI * 1336 * time) * 0.3; // High tone
      } else if (cycle < 0.8) {
        sample = Math.sin(2 * Math.PI * 941 * time) * 0.3; // Low tone
      } else {
        sample = 0; // Silence
      }
    } else {
      // Alarm: urgent beeping
      const beepCycle = time % 0.5;
      if (beepCycle < 0.25) {
        sample = Math.sin(2 * Math.PI * frequency * time) * 0.5;
      } else {
        sample = 0;
      }
    }
    
    const intSample = Math.max(-32767, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }
  
  const soundsDir = path.join(__dirname, '..', 'assets', 'sounds');
  if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(soundsDir, filename), buffer);
  console.log(`Created ${filename}`);
}

// Create audio files
console.log('Creating audio files...');
createWavFile(800, 3, 'phone-ringtone.wav'); // 3 second phone ringtone
createWavFile(1000, 2, 'urgent-alarm.wav'); // 2 second urgent alarm
console.log('Audio files created successfully!');